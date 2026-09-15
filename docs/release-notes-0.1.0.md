# TangTool v0.1.0 发布说明草稿

发布前请核对 [交付验收](delivery-checklist.md) 与本次构建提交。本文件为发布说明草稿，尚不代表已发布。首发已确认不提供正式开发者签名或 Apple 公证。

TangTool 是 Windows/macOS 本地工具箱，日常内容在本机处理，无账户和云端上传。

## 功能

- JSON 格式化与对比、JSON 转 Excel（多 Sheet/递归树平铺）、Excel/CSV 转 JSON。
- DOCX/PDF 批量转 Markdown，最多 10 个文档，可查看排版预览或原始内容。
- 密码、UUID、URL、MD5、Base64、SHA、时间戳/时区、Cron、正则和文本整理/对比。
- 二维码、单张图片压缩、颜色选择器和完整 Web 安全色。
- 首页即时搜索、工具收藏、可折叠侧栏、主题/字号、窗口分栏及编辑器/导出偏好。
- 简体中文与英文双语，桌面和官网各自记住选择，切换语言保留工具输入及已有结果。

## 安装包

按系统与芯片下载 Windows x64 或 macOS ARM/Intel。macOS 完整包要求 14 或更新版本。
完整包内置文档转换运行时，不需要另装 Python、MarkItDown 或 LibreOffice；Windows 安装包包含 WebView2 离线安装程序。
下载后可用对应的 SHA-256 校验清单核对文件完整性。

## 使用范围

- 文档仅支持 DOCX/PDF，不支持旧 `.doc`；扫描 PDF 没有 OCR，复杂排版可能与原稿不同。
- Markdown 预览展示排版，不加载图片或打开文档中的链接；原始内容可复制和保存。
- 图片压缩首批单张 JPEG/PNG/WebP 输入、JPEG/WebP 输出；动画仅保留首帧，不保留元数据。
- Cron 仅标准 5 段；显示未来执行时间，不创建系统定时任务。
- MD5/SHA 为摘要，Base64 为编码，不是加密；工具输入不跨重启保存，偏好保存在本机。
- 当前没有自动更新；升级前保存正在处理的内容并退出旧版。

## 安装提示与验收范围

本版本没有正式开发者签名或 Apple 公证。macOS 可能提示无法验证开发者；Windows 可能显示未知发布者、SmartScreen 提示，或被 Smart App Control / 企业策略阻止。只从本仓库下载并核对 SHA-256，不要求关闭系统整体安全保护。

三平台构建和目标机器验收分别记录。macOS ARM 已进行部分原生验收；Windows/Intel 的完整安装运行、升级卸载及无 WebView2 离线安装仍需真机验证。请以本次 Release 对应的验收记录为准，不把旧提交的通过结果视为新包已全部通过。

## English

TangTool is a local desktop toolkit for Windows and macOS, with 19 tools and a Simplified Chinese / English interface. Language changes preserve tool inputs and existing results. The website includes the complete tool catalog and matching screenshots in both languages.

- JSON formatting and comparison; JSON to Excel with multiple sheets or recursive flattening; Excel/CSV to JSON.
- Batch DOCX/PDF to Markdown conversion for up to 10 documents, with formatted and raw previews.
- Passwords, UUIDs, URL, MD5, Base64, SHA, timestamps, Cron, regex, text cleanup and comparison.
- QR codes, image compression and a color picker with all 216 web-safe colors.
- Search, favorites, theme/size options, resizable panels and local preferences.

Choose Windows x64, macOS Apple Silicon or macOS Intel. macOS requires 14 or later. Complete packages include the document conversion runtime; Python and MarkItDown do not need separate installation. Windows packages include the offline WebView2 installer. Verify the downloaded package against the SHA-256 file from the same release.

This release has no verified developer signature or Apple notarization. System warnings or policy blocks may prevent installation or execution; not every computer offers a way to continue. Verify the download source before deciding to run it. Automatic updates and OCR are not included. Scanned PDFs and complex layouts may not convert accurately; legacy .doc files are unsupported.

Build success does not replace target-machine acceptance. Partial native checks have been performed on macOS ARM. Complete Windows/Intel installation, upgrades, removal and offline installation without WebView2 still require validation. Refer to the acceptance record for this build.
