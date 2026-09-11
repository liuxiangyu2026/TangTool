use md5::{Digest, Md5};
use serde::Deserialize;
use std::fmt::Write;

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

    let digest = Md5::digest(input.as_bytes());
    let mut result = String::with_capacity(32);
    for byte in digest {
        write!(&mut result, "{byte:02x}").map_err(|_| "生成 MD5 摘要失败".to_string())?;
    }

    Ok(result)
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
            calculate_text_md5,
            generate_passwords
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
