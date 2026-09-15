use crate::app_error::AppError;
use base64::engine::general_purpose::STANDARD;
use same_file::Handle;
use std::fs::{self, File};
use std::io::{self, BufReader, BufWriter, Read, Write};
use std::path::Path;
use std::time::SystemTime;
use tempfile::{Builder, NamedTempFile};

#[derive(Clone, Copy)]
pub enum Operation {
    Encode,
    Decode,
}

struct Destination {
    handle: Handle,
    length: u64,
    modified: SystemTime,
    permissions: fs::Permissions,
}

pub fn convert_file(path: &Path, output_path: &Path, operation: Operation) -> Result<(), AppError> {
    let input =
        File::open(path).map_err(|error| AppError::detail("读取源文件失败：{detail}", error))?;
    if !input
        .metadata()
        .map_err(|error| AppError::detail("读取源文件信息失败：{detail}", error))?
        .is_file()
    {
        return Err(AppError::from("请选择普通文件作为输入"));
    }
    let input_handle = Handle::from_file(
        input
            .try_clone()
            .map_err(|error| AppError::detail("检查源文件身份失败：{detail}", error))?,
    )
    .map_err(|error| AppError::detail("检查源文件身份失败：{detail}", error))?;

    let filename = output_path.file_name().ok_or("请选择有效的输出文件名")?;
    let parent = output_path
        .parent()
        .filter(|parent| !parent.as_os_str().is_empty())
        .unwrap_or_else(|| Path::new("."))
        .canonicalize()
        .map_err(|error| AppError::detail("输出目录不存在或不可访问：{detail}", error))?;
    if !parent.is_dir() {
        return Err(AppError::from("输出位置不是目录"));
    }
    // 固定实际父目录；不会创建目录，也不跟随最终目标的符号链接进行写入。
    let destination_path = parent.join(filename);
    let original = inspect_destination(&input_handle, &destination_path)?;
    let mut temporary = Builder::new()
        .prefix(".tangtool-base64-")
        .suffix(".tmp")
        .tempfile_in(&parent)
        .map_err(|error| AppError::detail("无法在输出目录创建临时文件：{detail}", error))?;

    let preparation = (|| {
        convert_stream(BufReader::new(input), temporary.as_file_mut(), operation)?;
        if let Some(target) = &original {
            temporary
                .as_file()
                .set_permissions(target.permissions.clone())
                .map_err(|error| AppError::detail("无法保留目标文件权限：{detail}", error))?;
        }
        // flush 只负责用户态缓冲；sync_all 成功后才允许提交结果。
        temporary
            .as_file()
            .sync_all()
            .map_err(|error| AppError::detail("无法完整写入临时文件：{detail}", error))?;

        let current = inspect_destination(&input_handle, &destination_path)?;
        let unchanged = match (&original, &current) {
            (None, None) => true,
            (Some(before), Some(after)) => {
                before.handle == after.handle
                    && before.length == after.length
                    && before.modified == after.modified
            }
            _ => false,
        };
        if !unchanged {
            return Err(AppError::from(
                "目标文件在处理期间发生变化，已停止保存，请重新选择目标",
            ));
        }
        Ok(())
    })();

    if let Err(error) = preparation {
        return Err(cleanup_temporary(temporary, error));
    }

    // 新目标使用不覆盖提交，避免在转换期间出现同名文件时误覆盖。
    // 已有目标使用同一文件系统的原子替换；不先删目标，也不以拷贝覆盖作为失败兜底。
    let committed = if original.is_some() {
        temporary.persist(&destination_path)
    } else {
        temporary.persist_noclobber(&destination_path)
    };
    match committed {
        Ok(_) => Ok(()),
        Err(error) => {
            let message = AppError::detail("提交结果失败，原文件未主动删除：{detail}", error.error);
            Err(cleanup_temporary(error.file, message))
        }
    }
}

fn inspect_destination(input: &Handle, path: &Path) -> Result<Option<Destination>, AppError> {
    let metadata = match fs::symlink_metadata(path) {
        Ok(metadata) => metadata,
        Err(error) if error.kind() == io::ErrorKind::NotFound => return Ok(None),
        Err(error) => return Err(AppError::detail("检查目标文件失败：{detail}", error)),
    };
    if metadata.file_type().is_symlink() {
        return Err(AppError::from(
            "输出目标是符号链接，请另选普通文件，避免误改链接指向的内容",
        ));
    }
    if !metadata.is_file() {
        return Err(AppError::from("输出目标不是普通文件"));
    }
    let handle = Handle::from_path(path)
        .map_err(|error| AppError::detail("检查目标文件身份失败：{detail}", error))?;
    // 比较打开文件的身份，而非只比较路径字符串，覆盖硬链接、大小写和相对路径别名。
    if input == &handle {
        return Err(AppError::from(
            "输入和输出指向同一个文件，请选择不同的输出文件",
        ));
    }
    let metadata = handle
        .as_file()
        .metadata()
        .map_err(|error| AppError::detail("读取目标文件信息失败：{detail}", error))?;
    if !metadata.is_file() || metadata.permissions().readonly() {
        return Err(AppError::from("目标文件不是可写的普通文件，请另选保存位置"));
    }
    Ok(Some(Destination {
        handle,
        length: metadata.len(),
        modified: metadata
            .modified()
            .map_err(|error| AppError::detail("读取目标修改时间失败：{detail}", error))?,
        permissions: metadata.permissions(),
    }))
}

fn convert_stream(
    reader: impl Read,
    writer: impl Write,
    operation: Operation,
) -> Result<(), AppError> {
    let mut output = BufWriter::with_capacity(1024 * 1024, writer);
    match operation {
        Operation::Encode => {
            let mut input = reader;
            let mut encoder = base64::write::EncoderWriter::new(&mut output, &STANDARD);
            io::copy(&mut input, &mut encoder)
                .map_err(|error| AppError::detail("Base64 编码失败：{detail}", error))?;
            encoder
                .finish()
                .map_err(|error| AppError::detail("Base64 编码收尾失败：{detail}", error))?;
        }
        Operation::Decode => {
            let mut decoder = base64::read::DecoderReader::new(reader, &STANDARD);
            io::copy(&mut decoder, &mut output)
                .map_err(|error| AppError::detail("Base64 解码失败：{detail}", error))?;
        }
    }
    // EncoderWriter::finish 不等于内部 BufWriter 已落盘；不能依赖 Drop 忽略写入错误。
    output
        .flush()
        .map_err(|error| AppError::detail("写入结果失败：{detail}", error))
}

fn cleanup_temporary(file: NamedTempFile, reason: AppError) -> AppError {
    let path = file.path().to_path_buf();
    match file.close() {
        Ok(()) => reason,
        Err(error) => AppError::detail("临时文件清理失败，请手动检查 {path}：{detail}", error)
            .parameter("path", path.display())
            .caused_by(reason),
    }
}
