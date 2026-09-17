use crate::app_error::AppError;
use futures_util::future::{AbortHandle, Abortable};
use semver::Version;
use serde::Serialize;
use std::sync::atomic::{AtomicBool, Ordering};
use std::time::{Duration, Instant};
use tauri::{ipc::Channel, AppHandle, State};
use tauri_plugin_dialog::{DialogExt, MessageDialogButtons};
use tauri_plugin_updater::UpdaterExt;

const RELEASE_DOWNLOADS: &str = "https://github.com/liuxiangyu2026/TangTool/releases/download/";
const MAX_UPDATE_BYTES: u64 = 256 * 1024 * 1024;

#[derive(Default)]
pub struct UpdateState {
    pub busy: AtomicBool,
}

struct UpdateGuard<'a>(&'a AtomicBool);

impl Drop for UpdateGuard<'_> {
    fn drop(&mut self) {
        self.0.store(false, Ordering::SeqCst);
    }
}

#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct UpdateProgress {
    phase: &'static str,
    downloaded: u64,
    total: Option<u64>,
}

/// 只允许本仓库的更新清单和本平台主程序；前端不能指定下载地址、签名或安装路径。
#[tauri::command]
pub async fn install_app_update(
    app: AppHandle,
    state: State<'_, UpdateState>,
    tag: String,
    language: String,
    progress: Channel<UpdateProgress>,
) -> Result<bool, AppError> {
    if cfg!(debug_assertions) {
        return Err("开发模式不安装更新，请使用已安装的发行版".into());
    }
    let raw_version = tag.strip_prefix('v').unwrap_or(&tag);
    let version = Version::parse(raw_version).map_err(|_| AppError::from("更新版本信息无效"))?;
    if tag.len() > 128 || version <= app.package_info().version {
        return Err("更新版本必须高于当前版本".into());
    }
    let (target, suffix) = match (std::env::consts::OS, std::env::consts::ARCH) {
        ("windows", "x86_64") => ("x86_64-pc-windows-msvc", "-setup.exe"),
        ("macos", "aarch64") => ("aarch64-apple-darwin", ".app.tar.gz"),
        ("macos", "x86_64") => ("x86_64-apple-darwin", ".app.tar.gz"),
        _ => return Err("当前系统或架构不支持应用内更新".into()),
    };
    if state.busy.swap(true, Ordering::SeqCst) {
        return Err("已有更新任务正在进行".into());
    }
    let _guard = UpdateGuard(&state.busy);
    let handle = app.clone();
    let english = language == "en";
    // 原生确认不能被网页替代；明确提醒用户先完成正在运行的转换并保存会话内容。
    let confirmed = tauri::async_runtime::spawn_blocking(move || {
        handle.dialog().message(if english {
            "Finish running tasks and save your work first. The app will download and verify the update, then close for installation and restart. Unsaved tool contents will be lost. Continue?"
        } else {
            "请先结束正在运行的任务并保存内容。应用将下载并校验更新，完成后关闭应用、安装并重启，未保存的工具内容会丢失。是否继续？"
        }).title(if english { "Update TangTool" } else { "更新 TangTool" })
          .buttons(MessageDialogButtons::OkCancelCustom(
              if english { "Update" } else { "更新" }.into(),
              if english { "Cancel" } else { "取消" }.into(),
          )).blocking_show()
    }).await.map_err(|_| AppError::from("无法显示更新确认，请重试"))?;
    if !confirmed {
        return Ok(false);
    }
    progress
        .send(UpdateProgress {
            phase: "checking",
            downloaded: 0,
            total: None,
        })
        .map_err(|_| AppError::from("更新页面已关闭，请重试"))?;
    let endpoint = format!("{RELEASE_DOWNLOADS}{tag}/latest.json")
        .parse()
        .map_err(|_| AppError::from("更新版本信息无效"))?;
    let updater = app
        .updater_builder()
        .endpoints(vec![endpoint])
        .map_err(|_| AppError::from("更新配置无效"))?
        .timeout(Duration::from_secs(30))
        .configure_client(|client| {
            client
                .https_only(true)
                .connect_timeout(Duration::from_secs(15))
        })
        .build()
        .map_err(|_| AppError::from("更新配置无效"))?;
    let mut update = updater
        .check()
        .await
        .map_err(|_| AppError::from("无法获取更新包，请检查网络或稍后重试"))?
        .ok_or_else(|| AppError::from("当前没有可安装的新版本"))?;
    let expected_url = format!("{RELEASE_DOWNLOADS}{tag}/TangTool-{version}-{target}{suffix}");
    if update.version != version.to_string() || update.download_url.as_str() != expected_url {
        return Err("更新包与所选版本或平台不匹配，已停止安装".into());
    }
    update.timeout = Some(Duration::from_secs(600));
    let mut downloaded = 0_u64;
    let mut sent_at = Instant::now();
    let mut exceeded_limit = false;
    let (abort, registration) = AbortHandle::new_pair();
    progress
        .send(UpdateProgress {
            phase: "downloading",
            downloaded: 0,
            total: None,
        })
        .map_err(|_| AppError::from("更新页面已关闭，请重试"))?;
    let download = update.download(
        |chunk, total| {
            downloaded = downloaded.saturating_add(chunk as u64);
            if downloaded > MAX_UPDATE_BYTES || total.is_some_and(|size| size > MAX_UPDATE_BYTES) {
                exceeded_limit = true;
                abort.abort();
                return;
            }
            if sent_at.elapsed() >= Duration::from_millis(100) || total == Some(downloaded) {
                if progress
                    .send(UpdateProgress {
                        phase: "downloading",
                        downloaded,
                        total,
                    })
                    .is_err()
                {
                    abort.abort();
                }
                sent_at = Instant::now();
            }
        },
        || {
            let _ = progress.send(UpdateProgress {
                phase: "verifying",
                downloaded: 0,
                total: None,
            });
        },
    );
    let downloaded_bytes = Abortable::new(download, registration).await;
    if exceeded_limit {
        return Err("更新包超过大小限制，已停止下载".into());
    }
    let bytes = downloaded_bytes
        .map_err(|_| AppError::from("更新下载已中止，请重试"))?
        .map_err(|_| AppError::from("更新下载或签名校验失败，未安装任何内容，请重试"))?;
    // download 返回前插件已强制验证签名；只有通过校验的内存数据才能交给安装器。
    progress
        .send(UpdateProgress {
            phase: "installing",
            downloaded,
            total: Some(downloaded),
        })
        .map_err(|_| AppError::from("更新页面已关闭，请重试"))?;
    tauri::async_runtime::spawn_blocking(move || update.install(bytes))
        .await
        .map_err(|_| AppError::from("启动更新安装失败，请重试"))?
        .map_err(|_| AppError::from("更新安装失败，请检查应用目录权限并重试"))?;
    // Windows 安装器启动后插件自动退出；macOS 替换完成后显式重启运行新版本。
    app.restart();
}
