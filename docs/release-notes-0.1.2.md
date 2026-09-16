# TangTool v0.1.2 · 首发预览版

TangTool 从 v0.1.2 开始公开发布，是支持简体中文和英文的 Windows / macOS 本地工具箱。

- 19 个工具：JSON 格式化/对比、JSON 与 Excel/CSV 互转、文档转 Markdown、密码、SHA、URL、MD5、Base64、时间戳/时区、UUID、Cron、正则、文本整理/对比、二维码、图片压缩和颜色选择器。
- 首页搜索与收藏、折叠菜单、主题和字号、窗口与分栏记忆、编辑器与导出偏好。
- 默认启动及使用期间每6小时检查公开版本，侧栏提示新版，版本页查看说明和下载；设置可关闭自动检查或预发布提醒，不上传工具内容，不自动安装。
- 主程序为轻量安装包；DOCX/PDF 转 Markdown 需另装本版本提供的文档组件 1.0.0。组件自带 Python，无需自行配置 Python；Windows 可选安装，macOS 默认不安装组件。
- Windows x64 安装时检查 WebView2，缺少时需先从微软安装并重新检测；macOS 支持 Apple Silicon / Intel，要求 macOS 14 或更新版本。
- 窗口、任务栏、安装器与卸载器使用 TangTool B 标志。

首发为未签名／未公证预发布版，系统可能显示安装提示。复杂文档排版可能影响转换，不支持旧式 .doc、扫描件 OCR 或 Word/PDF 互转。构建及摘要检查不代表所有目标机安装、组件检测、升级和卸载均已完成实机验收。

请根据系统和芯片选择 TangTool 主程序。名称含 DocumentRuntime 的文件为可选文档组件；SHA256SUMS.txt 和 build-info.json 提供校验值与构建来源。

## English

TangTool starts its public release history at v0.1.2, a local Windows / macOS toolbox with Simplified Chinese and English interfaces.

- 19 tools covering JSON formatting/comparison, JSON and Excel/CSV conversion, documents to Markdown, passwords, SHA, URL, MD5, Base64, timestamps/time zones, UUID, Cron, regex, text cleanup/comparison, QR codes, image compression and colors.
- Home search and favorites, collapsible navigation, themes and text sizes, window and panel memory, editor and export preferences.
- Public release checks at startup and every six hours during use, a sidebar update badge, release notes and downloads. Automatic checks and preview updates are configurable. Tool contents are not uploaded and updates are not installed automatically.
- Lightweight apps with optional Document Runtime 1.0.0 for DOCX/PDF to Markdown, available in this release. The component includes Python; no manual Python setup is needed. It is optional on Windows and not installed by default on macOS.
- Windows x64 requires WebView2; the installer checks it and lets users install it from Microsoft before retrying. Apple Silicon and Intel Macs require macOS 14 or later.
- The window, taskbar, installer and uninstaller use the TangTool B logo.

This first release is a preview without verified developer signing or Apple notarization; system warnings may appear. Complex layouts can affect document conversion. Legacy .doc, scanned-document OCR and Word/PDF conversion are not supported. Build and checksum checks do not replace installation, component detection, upgrade and uninstall testing on each target platform.

Choose the TangTool app for your system and processor. Files containing DocumentRuntime are optional document components. SHA256SUMS.txt and build-info.json provide checksums and build provenance.
