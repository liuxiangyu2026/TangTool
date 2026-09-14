# TangTool 0.1.0 交付验收

当前为候选包，尚未公开发布。应用代码基线 `7c1d928`；三平台构建：[34840425160](https://github.com/liuxiangyu2026/TangTool/actions/runs/34840425160)。

## 产物与来源

- 本机 macOS ARM：`release-artifacts/aarch64-apple-darwin/TangTool-0.1.0-aarch64-apple-darwin.zip`。
- 每个平台同时提供 `SHA256SUMS.txt` 和 `build-info.json`；核对版本、目标架构、提交和 `dirty: false`。
- Windows 为 NSIS `.exe`；macOS 为保留执行权限的 `.app` ZIP。不要把不同提交的包混入同一版本。
- 完整构建后执行 `npm run release:collect`；它检查 macOS 包资源封印并收集产物。只改代码而未重新构建时，不得用此命令把旧包标记为新提交。

## 目前已验证

- R1～R7 的本机隔离复验、现有 13 用例、前端/官网构建、Rust 静态检查；详情见 [发布检查记录](release-checks.md)。
- macOS ARM 完整候选包资源封印、最低系统版本 14.0、B 图标资源存在。
- 本机包内 sidecar 在中文空格路径、无有效 Python 搜索路径、项目外目录执行 DOCX/PDF 转换成功。

## 目标机仍需验收

每个平台分别记录机器系统版本、芯片/架构、产物 SHA-256、日期和结果。Windows/macOS Intel 未实测，Mac 当前因锁屏尚未完成原生窗口检查，不能填写“通过”。

| 验收项 | Windows x64 | macOS ARM | macOS Intel |
| --- | --- | --- | --- |
| 安装/解压后启动，B 图标、菜单及窗口正常 | 待验收 | 待验收 | 待验收 |
| 无 Python、无项目目录，离线 DOCX/PDF 转换 | 待验收 | 仅本机隔离组件通过 | 待验收 |
| JSON 导入/复制/导出；Base64 文件正常往返及拒绝覆盖源文件 | 待验收 | 待验收 | 待验收 |
| 文件 MD5 进度；转换中队列锁定；保存期间切换不串文档 | 待验收 | 待验收 | 待验收 |
| Markdown 标题/表格排版，原始预览；CodeMirror/Worker 正常 | 待验收 | 待验收 | 待验收 |
| 图片压缩、表格输入及 QR PNG/SVG 导出 | 待验收 | 待验收 | 待验收 |
| 收藏、主题、字号、窗口/分栏记忆及默认导出目录重启恢复 | 待验收 | 待验收 | 待验收 |
| 关闭后输入内容不持久化；覆盖安装/升级/卸载行为 | 待验收 | 待验收 | 待验收 |
| 缺少 WebView2 且断网时安装运行 | 待验收 | 不适用 | 不适用 |

## 正式发布前的用户选择

- TODO：确认首发是否接受未签名/未公证的公开版本及系统安装提示，或提供 Developer ID/Windows 签名方案后再发布；不会代购证书。
- TODO：如使用 Developer ID，给 PyInstaller 内部库和 Tauri 外壳统一签名，重新开启 hardened runtime，完成公证和签名后转换复验。当前 ad-hoc 候选包不满足这一条件。
- 首发版本拟沿用项目现有 `0.1.0`，仅 Windows x64、macOS 14+ ARM/Intel；其他系统/架构不在已声明范围。
- 所需验收通过后，将同一代码基线合入 main，上传对应三平台产物与独立校验文件，复核下载链接，再启用 GitHub Pages。
- 官网尚未启用 Pages，仓库尚无 Release；不得把 Actions artifact 链接当作对用户永久有效的下载链接。
