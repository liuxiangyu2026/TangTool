use std::io;
use tauri::WebviewWindow;
use windows_sys::Win32::System::LibraryLoader::GetModuleHandleW;
use windows_sys::Win32::UI::WindowsAndMessaging::{
    GetSystemMetrics, LoadImageW, SendMessageW, ICON_BIG, ICON_SMALL, IMAGE_ICON, LR_SHARED,
    SM_CXICON, SM_CXSMICON, SM_CYICON, SM_CYSMICON, WM_SETICON,
};

pub fn apply(window: &WebviewWindow) -> Result<(), Box<dyn std::error::Error>> {
    let hwnd = window.hwnd()?.0;
    // tauri-build 将 icons/icon.ico 写为主 EXE 的 32512 号图标组。
    // 必须传当前 EXE 模块；空模块下的相同编号会指向 Windows 默认图标。
    let module = unsafe { GetModuleHandleW(std::ptr::null()) };
    if module.is_null() {
        return Err(io::Error::last_os_error().into());
    }
    let resource = 32512usize as *const u16;
    for (kind, width, height) in [
        (ICON_SMALL, SM_CXSMICON, SM_CYSMICON),
        (ICON_BIG, SM_CXICON, SM_CYICON),
    ] {
        // 当前 Tauri/tao 默认仅设置 ICON_SMALL；任务栏的大图标需单独同步。
        // LoadImage 根据系统尺寸选择 ICO 帧，避免把最小帧放大用于任务栏。
        let icon = unsafe {
            LoadImageW(
                module,
                resource,
                IMAGE_ICON,
                GetSystemMetrics(width),
                GetSystemMetrics(height),
                LR_SHARED,
            )
        };
        if icon.is_null() {
            return Err(io::Error::last_os_error().into());
        }
        // setup 在窗口创建后的主线程执行。LR_SHARED 句柄由系统管理，不手动销毁。
        unsafe { SendMessageW(hwnd, WM_SETICON, kind as usize, icon as isize) };
    }
    Ok(())
}
