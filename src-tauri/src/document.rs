use crate::app_error::AppError;
use serde::Deserialize;
use std::io::{Read, Write};
use std::path::PathBuf;
use std::process::{Command, Stdio};
use std::thread;
use std::time::{Duration, Instant};

#[derive(Deserialize)]
struct ConversionResponse {
    ok: bool,
    markdown: Option<String>,
    error: Option<String>,
}

#[tauri::command]
pub async fn convert_document_to_markdown(
    app: tauri::AppHandle,
    path: String,
) -> Result<String, AppError> {
    let path = crate::file_access::selected_path(&app, &path, false)?;
    tauri::async_runtime::spawn_blocking(move || convert_document(path))
        .await
        .map_err(|_| AppError::from("文档转换任务异常结束"))?
}

fn convert_document(input: PathBuf) -> Result<String, AppError> {
    let extension = input
        .extension()
        .and_then(|value| value.to_str())
        .unwrap_or("")
        .to_ascii_lowercase();
    if !matches!(extension.as_str(), "docx" | "pdf") {
        return Err(AppError::from("仅支持 DOCX 和 PDF 文档"));
    }
    let input = input
        .canonicalize()
        .map_err(|_| AppError::from("输入文件不存在或不可访问"))?;
    if !input.is_file() {
        return Err(AppError::from("请选择一个文档文件"));
    }

    // Development uses the local environment; packaged builds only use the adjacent binary.
    // `dev` is provided by tauri-build and is distinct from debug_assertions (debug .app builds).
    #[cfg(dev)]
    let mut command = {
        let root = PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("..");
        let python = root.join(if cfg!(windows) {
            ".venv/Scripts/python.exe"
        } else {
            ".venv/bin/python"
        });
        let runner = root.join("sidecar/markitdown_runner.py");
        if !python.is_file() || !runner.is_file() {
            return Err(AppError::from("开发环境缺少 .venv 或转换脚本，请按 sidecar/README.md 安装依赖；请勿删除已有虚拟环境"));
        }
        let mut command = Command::new(python);
        command.arg(runner).current_dir(root);
        command
    };
    #[cfg(not(dev))]
    let mut command = {
        let executable =
            std::env::current_exe().map_err(|_| AppError::from("无法确定应用安装目录"))?;
        let binary = executable
            .parent()
            .ok_or("无法确定 sidecar 目录")?
            .join(if cfg!(windows) {
                "tangtool-markitdown.exe"
            } else {
                "tangtool-markitdown"
            });
        if !binary.is_file() {
            return Err(AppError::from(
                "安装包缺少文档转换组件，请使用完整安装包（开发者请执行 npm run desktop:build）",
            ));
        }
        Command::new(binary)
    };
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        command.creation_flags(0x08000000); // CREATE_NO_WINDOW while keeping stdio pipes.
    }
    let mut child = command
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|error| AppError::detail("启动文档转换组件失败：{detail}", error))?;
    let request = serde_json::json!({ "inputPath": input }).to_string();
    let write_result = child
        .stdin
        .take()
        .ok_or_else(|| "Could not open the conversion input pipe".to_string())
        .and_then(|mut stdin| {
            stdin
                .write_all(request.as_bytes())
                .map_err(|error| error.to_string())
        });
    if let Err(error) = write_result {
        let _ = child.kill();
        let _ = child.wait();
        return Err(AppError::detail("发送转换请求失败：{detail}", error));
    }
    // Close stdin before waiting: runner reads until EOF. Drain both pipes concurrently.
    let stdout = child.stdout.take().ok_or("无法打开转换输出通道")?;
    let stderr = child.stderr.take().ok_or("无法打开转换错误通道")?;
    let output_reader = thread::spawn(move || read_output(stdout, 16 * 1024 * 1024));
    let error_reader = thread::spawn(move || read_output(stderr, 64 * 1024));
    let started = Instant::now();
    let exit_status = loop {
        match child.try_wait() {
            Ok(Some(status)) => break status,
            Ok(None) if started.elapsed() < Duration::from_secs(180) => {
                thread::sleep(Duration::from_millis(30))
            }
            other => {
                let _ = child.kill();
                let _ = child.wait();
                return Err(if other.is_err() {
                    "无法读取转换进程状态"
                } else {
                    "文档转换超过 180 秒，请尝试拆分文档"
                }
                .into());
            }
        }
    };
    let output = output_reader.join().map_err(|_| "读取转换结果失败")??;
    let errors = error_reader.join().map_err(|_| "读取转换错误失败")??;
    let response: ConversionResponse = serde_json::from_slice(&output).map_err(|_| {
        AppError::detail(
            "转换组件返回了无效结果：{detail}",
            String::from_utf8_lossy(&errors)
                .chars()
                .take(1000)
                .collect::<String>(),
        )
    })?;
    if !response.ok {
        return Err(AppError::detail(
            "文档转换失败：{detail}",
            response
                .error
                .unwrap_or_else(|| "Unknown conversion error".to_string()),
        ));
    }
    if !exit_status.success() {
        return Err(AppError::from("转换组件异常退出，请重试"));
    }
    response
        .markdown
        .ok_or_else(|| AppError::from("转换响应缺少 Markdown 内容"))
}

fn read_output(reader: impl Read, limit: u64) -> Result<Vec<u8>, AppError> {
    let mut bytes = Vec::new();
    reader
        .take(limit + 1)
        .read_to_end(&mut bytes)
        .map_err(|error| AppError::detail("读取转换输出失败：{detail}", error))?;
    if bytes.len() as u64 > limit {
        return Err(AppError::from("转换输出过大，请拆分文档后重试"));
    }
    Ok(bytes)
}
