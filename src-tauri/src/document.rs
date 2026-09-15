use crate::app_error::AppError;
use crate::document_runtime;
use serde::Deserialize;
use std::path::PathBuf;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
struct ConversionResponse {
    ok: bool,
    protocol: u32,
    component_version: String,
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

    let config = document_runtime::configuration()?;
    let request = serde_json::json!({
        "inputPath": input,
        "protocol": config.protocol,
        "componentVersion": config.version,
    })
    .to_string();
    let output = document_runtime::run(
        document_runtime::command()?,
        request.as_bytes(),
        180,
        16 * 1024 * 1024,
    )?;
    let response: ConversionResponse = serde_json::from_slice(&output.stdout).map_err(|_| {
        AppError::detail(
            "转换组件返回了无效结果：{detail}",
            String::from_utf8_lossy(&output.stderr)
                .chars()
                .take(1000)
                .collect::<String>(),
        )
    })?;
    if response.protocol != config.protocol || response.component_version != config.version {
        return Err(AppError::from(
            "文档组件版本或架构不兼容，请安装本页提供的组件",
        ));
    }
    if !response.ok {
        return Err(AppError::detail(
            "文档转换失败：{detail}",
            response
                .error
                .unwrap_or_else(|| "Unknown conversion error".to_string()),
        ));
    }
    if !output.status.success() {
        return Err(AppError::from("转换组件异常退出，请重试"));
    }
    response
        .markdown
        .ok_or_else(|| AppError::from("转换响应缺少 Markdown 内容"))
}
