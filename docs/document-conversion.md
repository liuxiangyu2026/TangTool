# 文档互转与 PDF 图片导出

本页记录2026-09-20实现、2026-10-09随v0.1.4 Preview发布的文档功能。v0.1.3不包含这些新增工具。

## 使用范围

- Word / PDF互转：仅DOCX↔PDF。DOCX→PDF需要LibreOffice，PDF→DOCX无需原Markdown组件。
- PDF→DOCX文字模式：可编辑文字，保留分页和基本字号；按视觉行重建段落，复杂表格、图片、多栏和旋转文字不保证原样布局。扫描页没有文字时明确报错。
- PDF→DOCX外观模式：每页作为图片嵌入Word，保留页面外观，文字不可直接编辑；可处理扫描页，不做OCR。
- PDF转图片：PNG/JPEG，最长边64～8192px，或指定宽高等比缩放并补白；不拉伸页面。可预览/保存当前页，或按`1-3,5`选择页码打包ZIP。
- 输入上限50MiB；DOCX/PDF图片输出按需执行，每次PDF批量最多100页；单图最多2400万像素，图片集合最多100MiB，文字转换最多200万字符。加密/损坏PDF返回错误，不绕过密码保护。

## LibreOffice

使用[官方安装包](https://www.libreoffice.org/download/download-libreoffice/)，安装后在工具页点击重新检测。

- macOS默认路径：`/Applications/LibreOffice.app/Contents/MacOS/soffice`。
- Windows默认路径：`%ProgramFiles%\LibreOffice\program\soffice.com`，兼容ProgramFiles(x86)。不扫描任意目录，不接受前端传入可执行文件路径。
- 主安装包与Markdown组件均不自动安装LibreOffice。已有Markdown组件1.0.0保持原协议与下载路径。
- 转换使用独立临时配置，不接管用户打开的Office文档；宏安全级别3，Writer外链更新值2（Never），配置值已核对上游定义。输入复制到任务临时目录，最多等待180秒。输出通过受限路径检查，原子提交新文件，已有目标拒绝覆盖。

## 资源与内存

PDF.js、docx与JSZip只在需要时加载。`scripts/pdf-assets.mjs`把字体、CMap、WASM与许可证复制到生产资源，不从CDN读取。生产CSP只增加本地资源访问、嵌入字体blob和WASM执行，不允许JavaScript eval或任意远端连接。

每次PDF任务独立销毁解析器与Worker；图片逐页生成，画布在finally中释放。离开页面只释放预览URL，可恢复原文件和结果；原始文件不持久化到应用偏好。

## 已完成与待验收

已完成：前端/官网构建、现有13测试、Rust check/fmt/Clippy、生产依赖官方审计；临时Node样本验证中文字提取、指定尺寸PNG、文字及图片DOCX、扫描拒绝、尺寸上限和取消；生产CSP下独立浏览器验证PNG预览、指定页码ZIP、DOCX下载及跨工具切换。临时脚本不进入仓库。

Rust转换适配层还通过了临时替身引擎检查：成功输出、扩展名拒绝、已有目标拒绝、引擎失败不生成成品、转换期间新建的目标文件不被覆盖。该检查验证进程调用和保存保护，不代表真实LibreOffice转换质量。

待验收：本机LibreOffice实际DOCX→PDF转换，缺失/已有/损坏组件分支，Windows/Intel原生文件选择与保存、转换超时及安装位置差异。不能将浏览器成功当作Tauri所有目标机文件权限和转换引擎验收通过。

官网截图已随v0.1.4同步，来自当前生产前端；不代表v0.1.3包含这些工具，也不代替上述原生验收。
