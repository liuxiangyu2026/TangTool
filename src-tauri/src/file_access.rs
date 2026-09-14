use std::path::{Path, PathBuf};
use tauri::AppHandle;
use tauri_plugin_fs::FsExt;

/// 自定义命令直接调用 std::fs，必须显式复用文件对话框授予的运行时权限。
pub fn selected_path(app: &AppHandle, path: &str, output: bool) -> Result<PathBuf, String> {
    let path = Path::new(path);
    if !path.is_absolute() {
        return Err("请通过文件对话框选择完整文件路径".to_string());
    }
    let resolved = if output {
        // 新文件尚不存在，只解析父目录；保留末级符号链接让写入保护明确拒绝。
        let name = path.file_name().ok_or("保存位置缺少文件名")?;
        path.parent()
            .ok_or("保存位置缺少父目录")?
            .canonicalize()
            .map_err(|error| format!("无法访问保存目录：{error}"))?
            .join(name)
    } else {
        path.canonicalize()
            .map_err(|error| format!("无法访问输入文件：{error}"))?
    };
    if !app.fs_scope().is_allowed(&resolved) {
        return Err("没有该文件的访问权限，请重新通过文件对话框选择输入或保存位置".to_string());
    }
    if !output && !resolved.is_file() {
        return Err("请选择普通文件".to_string());
    }
    Ok(resolved)
}
