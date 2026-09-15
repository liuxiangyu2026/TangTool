# TangTool v0.1.1 · 轻量安装包

主程序与文档转换组件改为独立安装，减少主包体积。已有工具、双语切换、输入保留和偏好设置继续保留。

- Windows 安装前检测 WebView2；缺少时提供微软官方下载入口，安装后点击下一步重新检测。主包不再包含完整 WebView2 离线安装器。
- Windows 文档组件默认不勾选；需要时勾选并从链接单独安装，安装器重新检测通过后继续。不勾选可直接安装主程序。
- macOS 主应用默认不包含文档组件；需要文档转换时下载对应架构的组件 PKG。
- 文档页提供“组件安装包”和“重新检测”。未安装、版本不兼容或检测失败时不能转换，其他工具不受影响；安装后重新检测即可使用，无需重启应用。
- 文档组件 1.0.0 内置 Python 与 DOCX/PDF 转换依赖，用户无需配置 Python。组件与主程序分别维护，不自动联网安装或更新。

下载名称带 DocumentRuntime 的文件为组件包，其余 TangTool 安装包为主程序。macOS 要求 14 或更新版本，组件 PKG 可能请求管理员授权。已发布 v0.1.0 保持不变。

仍为未签名／未公证预发布版。构建、自检和文件摘要不替代干净目标机的安装、转换、升级与卸载验收。下载后核对同一 Release 的 SHA-256 清单。

## English

The app and document conversion component are now distributed separately, reducing the main installer size.

- Windows checks for WebView2 before installation. If it is missing, install it from Microsoft's download page and click Next to check again. The offline WebView2 installer is no longer embedded.
- The Windows document component is optional and unchecked by default. Select it to download and install the separate component before continuing, or leave it unchecked to install only the app.
- macOS does not include the document component by default. Download the matching component PKG when needed.
- The document tool links to the component installer and offers Check again. Conversion requires a compatible, working component; other tools remain available. No app restart is needed after installation.
- Document Runtime 1.0.0 includes Python and DOCX/PDF dependencies. No manual Python setup or automatic component downloads are required.

Files containing DocumentRuntime are component installers; the other TangTool packages contain the app. macOS requires 14 or later and may request administrator authorization for the component PKG. This remains a preview without verified developer signing or Apple notarization. Verify downloads using the SHA-256 file from this release. Target-machine acceptance remains separate from build checks.
