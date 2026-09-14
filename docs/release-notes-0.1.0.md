# TangTool v0.1.0 发布说明草稿

发布前请完成 [交付验收](delivery-checklist.md)，并根据最终签名、公证和验收结果调整安装说明。本文件尚不代表已发布。

TangTool 是 Windows/macOS 本地工具箱，日常内容在本机处理，无账户和云端上传。

## 功能

- JSON 格式化与对比、JSON 转 Excel（多 Sheet/递归树平铺）、Excel/CSV 转 JSON。
- DOCX/PDF 批量转 Markdown，最多 10 个文档，可查看排版预览或原始内容。
- 密码、UUID、URL、MD5、Base64、SHA、时间戳/时区、Cron、正则和文本整理/对比。
- 二维码、单张图片压缩、颜色选择器和完整 Web 安全色。
- 首页即时搜索、工具收藏、可折叠侧栏、主题/字号、窗口分栏及编辑器/导出偏好。

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

TODO：发布前填写实际签名/公证状态及与其一致的安装提示，不承诺未经验证的系统兼容性或免安全提示安装。
