# TangTool v0.1.4 · JSON 对比增强、文档转换与内存优化

## 本版本更新

- **JSON 对比**：左右独立格式化；新增只对比 key，递归比较完整路径并按索引比较数组，忽略叶子值。结果展示全部字段，相同值正常显示，不同值红绿对照；点击字段定位并展开对应原文。大结果采用虚拟滚动。
- **JSON 工具栏**：JSON 对比与 JSON 转 Excel 的转义、格式化、全部折叠/展开集中在数据标题栏右侧，采用统一紧凑按钮。
- **JSON 转 Excel**：格式化遵循缩进设置，保留已有表格预览与分表选项；语法错误提示位置且不修改输入。
- **Word / PDF 互转**：DOCX→PDF 按需安装 LibreOffice；PDF→DOCX 提供可编辑文字和保留页面外观（图片）两种模式。文字模式不完整还原复杂表格、图片与多栏，不含 OCR；扫描件可用页面图片模式。
- **PDF 转图片**：支持 PNG/JPEG，指定最长边或固定宽高等比留白，当前页预览/保存及指定页码 ZIP 导出。
- **内存优化**：减少 JSON 重复解析；只读编辑器不保留旧结果撤销历史；切页释放可重建的图片、Markdown 与编辑器显示资源，仍保留工具输入与结果。
- **官网与双语**：21个工具，7组14张中英文真实界面截图；同步工具介绍和帮助说明。没有加入使用统计或上报。

## 安装与已知限制

- v0.1.3重建版可通过应用内“更新”下载本版本；更早的不含更新安装能力的构建需手动下载。更新前保存工具内容。
- LibreOffice需用户自行从官方站点安装到默认位置，再在工具页重新检测；旧Markdown组件1.0.0不包含LibreOffice，已有组件无需重装。
- PDF输入最多50MiB，每次批量最多100页；图片最多2400万像素，图片集合最多100MiB。PDF转Word的文字模式最多200万字符。
- 本版本继续为Preview，未提供系统开发者签名或Apple公证；更新包有独立签名验证，系统安装授权提示仍可能出现。
- 已有浏览器转换与文件保护验证不替代全部原生目标机验收。LibreOffice真实转档质量、Windows/macOS安装权限与完整自更新流程仍需目标机复核。

## English

- JSON comparison adds independent formatting, recursive key-only comparison and all-field results with red/green values, click-to-locate and virtual scrolling. Arrays use indices.
- Compact escape/format/fold/unfold controls now share pane headers. JSON-to-Excel formatting preserves previews and sheet options and follows indentation preferences.
- New Word/PDF converter: DOCX-to-PDF requires an optional LibreOffice installation. PDF-to-DOCX offers editable text or page images. Complex layouts are not fully reconstructed; OCR is not included.
- New PDF-to-images tool: PNG/JPEG, custom dimensions with preserved proportions, page preview and selected-page ZIP export.
- Reduced repeated parsing and idle preview/editor memory while keeping session inputs. The website now presents 21 tools and seven bilingual screenshot sets. No usage telemetry was added.

Rebuilt v0.1.3 supports in-app upgrading; older builds require a manual download. Document Runtime stays at1.0.0. LibreOffice is installed separately by the user. This remains a Preview without OS developer signing/notarization; update packages are signed separately. Full native installation, real LibreOffice conversion and end-to-end updating remain subject to target-machine acceptance.
