use base64::engine::general_purpose::STANDARD;
use md5::{Digest, Md5};
use serde::{Deserialize, Serialize};
use std::fs::File;
use std::io::{self, BufReader, BufWriter, Read};
use std::path::PathBuf;
use std::process::{Command, Stdio};
use tauri::{AppHandle, Emitter};

const UPPERCASE: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWERCASE: &[u8] = b"abcdefghijklmnopqrstuvwxyz";
const NUMBERS: &[u8] = b"0123456789";
const SYMBOLS: &[u8] = b"!@#$%^&*()-_=+[]{};:,.?";
const AMBIGUOUS_CHARACTERS: &[u8] = b"0Oo1Il|";
const MIN_PASSWORD_LENGTH: usize = 4;
const MAX_PASSWORD_LENGTH: usize = 128;
const MIN_PASSWORD_COUNT: usize = 1;
const MAX_PASSWORD_COUNT: usize = 20;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct PasswordOptions {
    length: usize,
    count: usize,
    include_uppercase: bool,
    include_lowercase: bool,
    include_numbers: bool,
    include_symbols: bool,
    exclude_ambiguous: bool,
}

#[tauri::command]
fn generate_passwords(options: PasswordOptions) -> Result<Vec<String>, String> {
    if !(MIN_PASSWORD_LENGTH..=MAX_PASSWORD_LENGTH).contains(&options.length) {
        return Err(format!(
            "密码长度必须在 {MIN_PASSWORD_LENGTH} 到 {MAX_PASSWORD_LENGTH} 之间"
        ));
    }
    if !(MIN_PASSWORD_COUNT..=MAX_PASSWORD_COUNT).contains(&options.count) {
        return Err(format!(
            "生成数量必须在 {MIN_PASSWORD_COUNT} 到 {MAX_PASSWORD_COUNT} 之间"
        ));
    }

    let selected_groups = [
        (options.include_uppercase, UPPERCASE),
        (options.include_lowercase, LOWERCASE),
        (options.include_numbers, NUMBERS),
        (options.include_symbols, SYMBOLS),
    ]
    .into_iter()
    .filter(|(selected, _)| *selected)
    .map(|(_, characters)| {
        characters
            .iter()
            .copied()
            .filter(|character| {
                !options.exclude_ambiguous || !AMBIGUOUS_CHARACTERS.contains(character)
            })
            .collect::<Vec<_>>()
    })
    .collect::<Vec<_>>();

    if selected_groups.is_empty() {
        return Err("请至少选择一种字符类型".to_string());
    }
    if selected_groups.iter().any(Vec::is_empty) {
        return Err("排除易混淆字符后没有可用字符".to_string());
    }
    if options.length < selected_groups.len() {
        return Err("密码长度不能小于已选择的字符类型数量".to_string());
    }

    let character_pool = selected_groups
        .iter()
        .flat_map(|group| group.iter().copied())
        .collect::<Vec<_>>();
    (0..options.count)
        .map(|_| generate_one_password(options.length, &selected_groups, &character_pool))
        .collect()
}

#[tauri::command]
fn calculate_text_md5(input: String) -> Result<String, String> {
    if input.is_empty() {
        return Err("请输入需要计算 MD5 的文本".to_string());
    }

    Ok(format_md5(Md5::digest(input.as_bytes())))
}

#[tauri::command]
fn convert_document_to_markdown(path: String) -> Result<String, String> {
    let working_directory =
        std::env::current_dir().map_err(|error| format!("无法确定应用目录：{error}"))?;
    let sidecar_path = working_directory.join("sidecar/markitdown_runner.py");
    let (python, runner) = if cfg!(target_os = "windows") {
        (
            working_directory.join(".venv/Scripts/python.exe"),
            sidecar_path,
        )
    } else {
        (working_directory.join(".venv/bin/python"), sidecar_path)
    };
    let python = if python.is_file() {
        python
    } else {
        PathBuf::from("python3")
    };
    let request = serde_json::json!({ "inputPath": path });
    let output = Command::new(python)
        .arg(runner)
        .current_dir(working_directory)
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .and_then(|mut child| {
            std::io::Write::write_all(
                child.stdin.as_mut().expect("stdin is piped"),
                request.to_string().as_bytes(),
            )?;
            child.wait_with_output()
        })
        .map_err(|error| format!("启动文档转换进程失败：{error}"))?;

    let response: serde_json::Value = serde_json::from_slice(&output.stdout).map_err(|_| {
        format!(
            "文档转换进程返回了无效结果：{}",
            String::from_utf8_lossy(&output.stderr)
        )
    })?;
    if response.get("ok").and_then(serde_json::Value::as_bool) != Some(true) {
        return Err(response
            .get("error")
            .and_then(serde_json::Value::as_str)
            .unwrap_or("文档转换失败")
            .to_string());
    }

    response
        .get("markdown")
        .and_then(serde_json::Value::as_str)
        .map(str::to_owned)
        .ok_or_else(|| "文档转换结果为空".to_string())
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
struct FileMd5Result {
    digest: String,
    byte_length: u64,
}

#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
struct FileMd5Progress {
    processed_bytes: u64,
    total_bytes: u64,
}

#[tauri::command]
async fn calculate_file_md5(app: AppHandle, path: String) -> Result<FileMd5Result, String> {
    tauri::async_runtime::spawn_blocking(move || calculate_file_md5_sync(app, path))
        .await
        .map_err(|error| format!("文件 MD5 任务执行失败：{error}"))?
}

fn calculate_file_md5_sync(app: AppHandle, path: String) -> Result<FileMd5Result, String> {
    let mut file = File::open(&path).map_err(|error| format!("无法读取文件：{error}"))?;
    let total_bytes = file
        .metadata()
        .map_err(|error| format!("无法读取文件信息：{error}"))?
        .len();
    let mut hasher = Md5::new();
    let mut buffer = [0_u8; 1024 * 1024];
    let mut processed_bytes = 0_u64;

    let _ = app.emit(
        "md5-file-progress",
        FileMd5Progress {
            processed_bytes,
            total_bytes,
        },
    );

    loop {
        let bytes_read = file
            .read(&mut buffer)
            .map_err(|error| format!("读取文件失败：{error}"))?;
        if bytes_read == 0 {
            break;
        }

        hasher.update(&buffer[..bytes_read]);
        processed_bytes += bytes_read as u64;
        let _ = app.emit(
            "md5-file-progress",
            FileMd5Progress {
                processed_bytes,
                total_bytes,
            },
        );
    }

    Ok(FileMd5Result {
        digest: format_md5(hasher.finalize()),
        byte_length: processed_bytes,
    })
}

#[tauri::command]
async fn encode_file_base64(path: String, output_path: String) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || {
        let input = File::open(&path).map_err(|error| format!("读取文件失败：{error}"))?;
        let output =
            File::create(&output_path).map_err(|error| format!("创建 Base64 文件失败：{error}"))?;
        let mut encoder = base64::write::EncoderWriter::new(BufWriter::new(output), &STANDARD);
        io::copy(&mut BufReader::new(input), &mut encoder)
            .map_err(|error| format!("Base64 编码失败：{error}"))?;
        encoder
            .finish()
            .map_err(|error| format!("保存 Base64 文件失败：{error}"))?;
        Ok::<(), String>(())
    })
    .await
    .map_err(|error| format!("Base64 编码任务失败：{error}"))?
}

#[tauri::command]
async fn decode_file_base64(path: String, output_path: String) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || {
        let input = File::open(&path).map_err(|error| format!("读取 Base64 文件失败：{error}"))?;
        let output =
            File::create(&output_path).map_err(|error| format!("创建解码文件失败：{error}"))?;
        let mut decoder = base64::read::DecoderReader::new(BufReader::new(input), &STANDARD);
        io::copy(&mut decoder, &mut BufWriter::new(output))
            .map_err(|error| format!("Base64 解码失败：{error}"))?;
        Ok::<(), String>(())
    })
    .await
    .map_err(|error| format!("Base64 解码任务失败：{error}"))?
}

fn format_md5(digest: impl AsRef<[u8]>) -> String {
    digest
        .as_ref()
        .iter()
        .map(|byte| format!("{byte:02x}"))
        .collect()
}

fn generate_one_password(
    length: usize,
    selected_groups: &[Vec<u8>],
    character_pool: &[u8],
) -> Result<String, String> {
    let mut password = Vec::with_capacity(length);

    // 每个已选类型先取一个字符，保证生成结果满足用户选择。
    for group in selected_groups {
        password.push(group[random_index(group.len())?]);
    }
    while password.len() < length {
        password.push(character_pool[random_index(character_pool.len())?]);
    }

    // 安全打乱必选字符的位置，避免密码结构泄露字符类型顺序。
    for index in (1..password.len()).rev() {
        let target_index = random_index(index + 1)?;
        password.swap(index, target_index);
    }

    String::from_utf8(password).map_err(|_| "生成密码时发生字符编码错误".to_string())
}

fn random_index(upper_bound: usize) -> Result<usize, String> {
    let upper_bound = upper_bound as u64;
    let unbiased_limit = u64::MAX - (u64::MAX % upper_bound);

    loop {
        let mut random_bytes = [0_u8; 8];
        getrandom::fill(&mut random_bytes)
            .map_err(|error| format!("无法从操作系统获取安全随机数：{error}"))?;
        let random_value = u64::from_ne_bytes(random_bytes);

        if random_value < unbiased_limit {
            return Ok((random_value % upper_bound) as usize);
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![
            calculate_file_md5,
            convert_document_to_markdown,
            encode_file_base64,
            decode_file_base64,
            calculate_text_md5,
            generate_passwords
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
