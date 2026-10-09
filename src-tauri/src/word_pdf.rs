use crate::{app_error::AppError, document_runtime, file_access};
use serde::Serialize;
use std::fs;
use std::io::{Read, Write};
use std::path::PathBuf;
use std::process::Command;
use std::sync::atomic::{AtomicBool, Ordering};

static CONVERTING: AtomicBool = AtomicBool::new(false);

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct WordRuntimeStatus {
    available: bool,
    download_url: &'static str,
}

fn libreoffice_path() -> Option<PathBuf> {
    #[cfg(target_os = "macos")]
    let candidates = vec![PathBuf::from(
        "/Applications/LibreOffice.app/Contents/MacOS/soffice",
    )];
    #[cfg(windows)]
    let candidates: Vec<PathBuf> = ["ProgramFiles", "ProgramFiles(x86)"]
        .into_iter()
        .filter_map(std::env::var_os)
        .map(|directory| PathBuf::from(directory).join("LibreOffice/program/soffice.com"))
        .collect();
    #[cfg(not(any(target_os = "macos", windows)))]
    let candidates: Vec<PathBuf> = Vec::new();
    candidates.into_iter().find(|path| path.is_file())
}

#[tauri::command]
pub fn check_word_runtime() -> WordRuntimeStatus {
    WordRuntimeStatus {
        available: libreoffice_path().is_some(),
        download_url: "https://www.libreoffice.org/download/download-libreoffice/",
    }
}

#[tauri::command]
pub async fn convert_word_to_pdf(
    app: tauri::AppHandle,
    path: String,
    output: String,
) -> Result<(), AppError> {
    let source = file_access::selected_path(&app, &path, false)?;
    let destination = file_access::selected_path(&app, &output, true)?;
    tauri::async_runtime::spawn_blocking(move || convert_document(source, destination))
        .await
        .map_err(|_| AppError::from("文档转换任务异常结束"))?
}

fn convert_document(source: PathBuf, destination: PathBuf) -> Result<(), AppError> {
    if CONVERTING
        .compare_exchange(false, true, Ordering::AcqRel, Ordering::Acquire)
        .is_err()
    {
        return Err(AppError::from("已有 Word 转换任务正在运行"));
    }
    struct ResetBusy;
    impl Drop for ResetBusy {
        fn drop(&mut self) {
            CONVERTING.store(false, Ordering::Release);
        }
    }
    let _reset = ResetBusy;
    if !source
        .extension()
        .is_some_and(|extension| extension.eq_ignore_ascii_case("docx"))
    {
        return Err(AppError::from("请选择 DOCX 文件"));
    }
    if !destination
        .extension()
        .is_some_and(|extension| extension.eq_ignore_ascii_case("pdf"))
    {
        return Err(AppError::from("输出文件需要使用 .pdf 扩展名"));
    }
    if destination.exists() || fs::symlink_metadata(&destination).is_ok() {
        return Err(AppError::from("目标文件已存在，请选择新的文件名"));
    }
    let engine = libreoffice_path().ok_or("请先安装 LibreOffice，然后重新检测")?;
    let metadata =
        fs::metadata(&source).map_err(|error| AppError::detail("读取文件失败：{detail}", error))?;
    if metadata.len() == 0 || metadata.len() > 50 * 1024 * 1024 {
        return Err(AppError::from("请选择非空且不超过 50 MiB 的文档"));
    }
    let work = tempfile::Builder::new()
        .prefix("tangtool-word-")
        .tempdir()
        .map_err(|error| AppError::detail("创建转换目录失败：{detail}", error))?;
    let profile = work.path().join("profile");
    fs::create_dir_all(profile.join("user"))
        .map_err(|error| AppError::detail("创建转换目录失败：{detail}", error))?;
    // 独立临时配置不接管用户已打开的 Office 会话；禁用宏及自动更新外部链接。
    fs::write(profile.join("user/registrymodifications.xcu"), r#"<?xml version="1.0" encoding="UTF-8"?>
<oor:items xmlns:oor="http://openoffice.org/2001/registry">
  <item oor:path="/org.openoffice.Office.Common/Security/Scripting"><prop oor:name="MacroSecurityLevel" oor:op="fuse"><value>3</value></prop></item>
  <item oor:path="/org.openoffice.Office.Writer/Content/Update"><prop oor:name="Link" oor:op="fuse"><value>2</value></prop></item>
</oor:items>"#).map_err(|error| AppError::detail("创建转换目录失败：{detail}", error))?;
    let input = work.path().join("input.docx");
    fs::copy(&source, &input).map_err(|error| AppError::detail("读取文件失败：{detail}", error))?;
    let profile_url = tauri::Url::from_directory_path(&profile)
        .map_err(|_| AppError::from("转换配置路径无效"))?;
    let mut command = Command::new(engine);
    // TODO: 安装真实 LibreOffice 后补验 Windows/macOS 中文文档、表格分页及超时退出。
    command
        .arg(format!("-env:UserInstallation={profile_url}"))
        .args([
            "--headless",
            "--nologo",
            "--nodefault",
            "--norestore",
            "--convert-to",
            "pdf:writer_pdf_Export",
            "--outdir",
        ])
        .arg(work.path())
        .arg(&input);
    let converted = document_runtime::run(command, &[], 180, 64 * 1024)?;
    let result = work.path().join("input.pdf");
    if !converted.status.success() || !result.is_file() {
        return Err(AppError::from(
            "Word 转 PDF 失败，请检查文档与 LibreOffice 安装",
        ));
    }
    let mut file = fs::File::open(&result)
        .map_err(|error| AppError::detail("读取文件失败：{detail}", error))?;
    let mut header = [0; 5];
    file.read_exact(&mut header)
        .map_err(|_| AppError::from("转换结果不是有效的 PDF"))?;
    if &header != b"%PDF-"
        || file
            .metadata()
            .map_err(|_| AppError::from("转换结果不是有效的 PDF"))?
            .len()
            > 256 * 1024 * 1024
    {
        return Err(AppError::from("转换结果不是有效的 PDF"));
    }
    let mut temporary =
        tempfile::NamedTempFile::new_in(destination.parent().ok_or("保存位置缺少父目录")?)
            .map_err(|error| AppError::detail("保存失败：{detail}", error))?;
    temporary
        .write_all(&header)
        .map_err(|error| AppError::detail("保存失败：{detail}", error))?;
    std::io::copy(&mut file, temporary.as_file_mut())
        .map_err(|error| AppError::detail("保存失败：{detail}", error))?;
    temporary
        .as_file()
        .sync_all()
        .map_err(|error| AppError::detail("保存失败：{detail}", error))?;
    // 即使保存对话框之后目标被创建，也不覆盖现有文件。
    temporary
        .persist_noclobber(destination)
        .map_err(|error| AppError::detail("保存失败：{detail}", error))?;
    Ok(())
}
