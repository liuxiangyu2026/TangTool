use serde::Serialize;
use std::collections::BTreeMap;

/// IPC 仅传消息标识与参数，前端按当前语言展示；路径和系统详情不参与翻译。
#[derive(Debug, Serialize)]
pub struct AppError {
    pub key: String,
    pub parameters: BTreeMap<String, String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub cause: Option<Box<AppError>>,
}

impl AppError {
    pub fn parameter(mut self, name: &str, value: impl ToString) -> Self {
        self.parameters.insert(name.to_string(), value.to_string());
        self
    }

    pub fn detail(key: &str, detail: impl ToString) -> Self {
        Self::from(key).parameter("detail", detail)
    }

    pub fn caused_by(mut self, cause: AppError) -> Self {
        self.cause = Some(Box::new(cause));
        self
    }
}

impl From<&str> for AppError {
    fn from(key: &str) -> Self {
        Self {
            key: key.to_string(),
            parameters: BTreeMap::new(),
            cause: None,
        }
    }
}

impl From<String> for AppError {
    fn from(key: String) -> Self {
        Self {
            key,
            parameters: BTreeMap::new(),
            cause: None,
        }
    }
}
