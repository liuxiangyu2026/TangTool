use crate::app_error::AppError;
use serde::{Deserialize, Serialize};
use std::io::{Read, Write};
use std::path::PathBuf;
use std::process::{Command, Output, Stdio};
use std::thread;
use std::time::{Duration, Instant};

#[derive(Deserialize)]
pub(crate) struct RuntimeConfig {
    pub version: String,
    pub protocol: u32,
    pub release: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct HealthResponse {
    ok: bool,
    component_version: String,
    protocol: u32,
    target: String,
    formats: Vec<String>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct RuntimeStatus {
    available: bool,
    version: String,
    download_url: Option<String>,
    error: Option<AppError>,
}

pub(crate) fn configuration() -> Result<RuntimeConfig, AppError> {
    serde_json::from_str(include_str!("../../sidecar/runtime.json"))
        .map_err(|_| AppError::from("文档组件配置无效，请重新安装应用"))
}

fn target() -> Option<&'static str> {
    match (std::env::consts::OS, std::env::consts::ARCH) {
        ("windows", "x86_64") => Some("x86_64-pc-windows-msvc"),
        ("macos", "aarch64") => Some("aarch64-apple-darwin"),
        ("macos", "x86_64") => Some("x86_64-apple-darwin"),
        _ => None,
    }
}

pub(crate) fn command() -> Result<Command, AppError> {
    // tauri-build 的 dev cfg 不等于 debug_assertions；debug .app 也走真实组件路径。
    #[cfg(dev)]
    let command = {
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
    let command = {
        let config = configuration()?;
        let directory = match std::env::consts::OS {
            "windows" => {
                PathBuf::from(std::env::var_os("LOCALAPPDATA").ok_or("无法确定文档组件安装目录")?)
                    .join("TangTool/DocumentRuntime")
            }
            "macos" => PathBuf::from("/Library/Application Support/TangTool/DocumentRuntime"),
            _ => return Err(AppError::from("当前系统不支持文档转换组件")),
        }
        .join(config.version);
        let binary = directory.join(if cfg!(windows) {
            "tangtool-markitdown.exe"
        } else {
            "tangtool-markitdown"
        });
        if !binary.is_file() {
            return Err(AppError::from("未安装文档转换组件，安装后才能使用此功能"));
        }
        let mut command = Command::new(binary);
        command.current_dir(directory);
        command.env_remove("PYTHONHOME").env_remove("PYTHONPATH");
        command
    };
    Ok(command)
}

#[tauri::command]
pub async fn check_document_runtime() -> Result<RuntimeStatus, AppError> {
    tauri::async_runtime::spawn_blocking(|| {
        let config = configuration()?;
        let download_url = target().map(|target| {
            let suffix = if cfg!(windows) { "-setup.exe" } else { ".pkg" };
            format!(
                "https://github.com/liuxiangyu2026/TangTool/releases/download/{}/TangTool-DocumentRuntime-{}-{}{}",
                config.release, config.version, target, suffix
            )
        });
        let check = (|| {
            let mut command = command()?;
            command.arg("--health");
            let output = run(command, &[], 20, 64 * 1024)?;
            let health: HealthResponse = serde_json::from_slice(&output.stdout)
                .map_err(|_| AppError::from("文档组件检测失败，请重新安装对应平台的组件"))?;
            if !output.status.success()
                || !health.ok
                || health.component_version != config.version
                || health.protocol != config.protocol
                || Some(health.target.as_str()) != target()
                || !["docx", "pdf"].iter().all(|format| health.formats.iter().any(|value| value == format))
            {
                return Err(AppError::from("文档组件版本或架构不兼容，请安装本页提供的组件"));
            }
            Ok(())
        })();
        Ok(RuntimeStatus {
            available: check.is_ok(),
            version: config.version,
            download_url,
            error: check.err(),
        })
    })
    .await
    .map_err(|_| AppError::from("文档组件检测任务异常结束"))?
}

/// 健康检查与实际转换共用进程边界：后台执行、关闭 stdin、限时及有界双管道读取。
pub(crate) fn run(
    mut command: Command,
    input: &[u8],
    seconds: u64,
    limit: u64,
) -> Result<Output, AppError> {
    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        command.creation_flags(0x08000000);
    }
    let mut child = command
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|error| AppError::detail("启动文档转换组件失败：{detail}", error))?;
    let write_result = child
        .stdin
        .take()
        .ok_or_else(|| "Could not open component input".to_string())
        .and_then(|mut stdin| stdin.write_all(input).map_err(|error| error.to_string()));
    if let Err(error) = write_result {
        let _ = child.kill();
        let _ = child.wait();
        return Err(AppError::detail("发送转换请求失败：{detail}", error));
    }
    let stdout = child.stdout.take().ok_or("无法打开转换输出通道")?;
    let stderr = child.stderr.take().ok_or("无法打开转换错误通道")?;
    let output_reader = thread::spawn(move || read_output(stdout, limit));
    let error_reader = thread::spawn(move || read_output(stderr, 64 * 1024));
    let started = Instant::now();
    let status = loop {
        match child.try_wait() {
            Ok(Some(status)) => break status,
            Ok(None) if started.elapsed() < Duration::from_secs(seconds) => {
                thread::sleep(Duration::from_millis(30))
            }
            other => {
                let _ = child.kill();
                let _ = child.wait();
                let _ = output_reader.join();
                let _ = error_reader.join();
                return Err(if other.is_err() {
                    AppError::from("无法读取转换进程状态")
                } else {
                    AppError::from("文档组件处理超过 {seconds} 秒，请重试或拆分文档")
                        .parameter("seconds", seconds)
                });
            }
        }
    };
    Ok(Output {
        status,
        stdout: output_reader.join().map_err(|_| "读取转换结果失败")??,
        stderr: error_reader.join().map_err(|_| "读取转换错误失败")??,
    })
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
