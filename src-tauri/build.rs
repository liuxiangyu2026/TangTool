fn main() {
    // EXE、快捷方式及运行时的大小图标共用同一份品牌 ICO。
    let attributes = tauri_build::Attributes::new().windows_attributes(
        tauri_build::WindowsAttributes::new().window_icon_path("icons/icon.ico"),
    );
    tauri_build::try_build(attributes).expect("failed to prepare application resources");
}
