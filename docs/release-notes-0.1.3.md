# TangTool v0.1.3 · 工具体验与安装流程优化

本版本按作者要求重新打包，增加应用内更新。已安装之前v0.1.3的用户请手动下载并安装本次重建包；同版本替换不会显示新版提醒。安装此构建后，后续更高版本可在应用内更新。

## 本版本更新

- **应用内更新**：按钮改为“更新”；确认已保存内容后，显示下载进度，强制验证签名，通过后自动启动安装并重启，不再要求跳转GitHub下载。失败显示原因，可重试。
- **操作提示**：所有工具共用的提示上移至窗口顶部，默认约8px；收紧高度，长提示可滚动，避免下伸遮挡工具栏。仍为2秒自动消失，支持手动关闭。
- **JSON 工具**：新增“添加\转义 / 去除\转义”，每次在所有双引号前增减一个反斜杠；对比两侧独立操作。各 JSON 数据框新增全部折叠/展开，支持单行和大文档，不改变实际数据或已有差异/表格预览。保留调整后的转义按钮位置。
- **MD5**：文本和文件均显示32位大写、32位小写、16位大写、16位小写，逐项复制。16位为完整摘要的第9～24位，不是另一种算法。
- **实时文本整理**：合并逐行整理和列数据拼接，输入/选项变化即更新。去空白、空行、去重、排序、中英文单双引号、换行或常用/自定义分隔符可组合。默认换行输出，关闭去重可保留重复项；去引号仅去首尾一对匹配引号。
- **菜单与收藏**：文档后新增“文本”，包含文本整理/对比；URL、MD5、Base64 移至“安全”，移除“编码”一级菜单。侧栏支持只看收藏并记住开关，保留当前工具输入。
- **安装流程**：Windows 主安装器不再提供或检查文档转换组件，只保留必需的 WebView2 检查。用户需要 DOCX/PDF 转 Markdown 时，从文档工具页自行下载安装组件，再点击重新检测。

## 安装与限制

- 文档组件仍为1.0.0，已有组件无需重装；应用内继续链接到已有的 v0.1.2 组件下载，不要求新版本组件先发布。
- 文本处理最多100万个输入字符、200万个输出字符；除换行输出外，含制表符的数据需先整理为单列。不解析单元格内部换行，不自动执行 CSV/SQL 转义。
- 仍无系统开发者签名／公证：Windows x64、macOS 14+ Apple Silicon / Intel。新增的更新包签名用于验证来源，不消除系统安全提示；更新前结束任务并保存内容，只有点击并确认更新后才下载安装。
- 构建和摘要校验不等于全部目标机安装、组件检测、升级和卸载已经完成实机验收。

## English

- **In-app updates:** the Update button now downloads with progress, verifies the package signature and starts installation/restart after confirmation. Older builds of v0.1.3 require one manual reinstallation of this rebuilt version; a same-version replacement does not trigger update notifications.
- **Notices:** moved near the top of every tool window (about 8px by default), with a compact, scrollable message area to reduce toolbar overlap. Automatic dismissal remains two seconds, with manual dismissal available.
- **JSON tools:** add/remove one backslash before every double quote, independently on each comparison side. All JSON panes offer collapse-all/expand-all, including single-line and large documents, without changing data or existing results. Customized escape-button positions are retained.
- **MD5:** text and files show uppercase/lowercase 32-character and 16-character variants, each independently copyable. The shorter form is characters 9–24 of the full digest.
- **Live text cleanup:** line cleanup and column joining share one live pipeline. Combine trimming, blank-line removal, deduplication, sorting, straight/Chinese single/double quotes and preset/custom delimiters. Output defaults to line breaks; disable deduplication to retain duplicates. Quote removal strips one matching outer pair only.
- **Navigation and favorites:** a Text group follows Documents; URL, MD5 and Base64 move to Security. A persistent sidebar favorites filter does not clear active tool contents.
- **Installation:** the Windows app installer no longer offers or checks the document component; required WebView2 checks remain. Download the optional component from the document tool and check again after installation.

Document Runtime remains 1.0.0; existing installations do not need replacement, and in-app links continue to use the available v0.1.2 component downloads. Text processing is limited to 1 million input / 2 million output characters and does not perform CSV/SQL escaping. OS developer signing and notarization are not included. Update packages are signed separately; installation requires clicking Update and confirming. Build and checksum checks do not replace target-machine acceptance.
