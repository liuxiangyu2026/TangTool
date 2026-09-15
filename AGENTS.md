# TangTool 协作与接续说明

> 更新于 2026-09-15。本文只保存当前约定、状态和下一步；历史实现过程请查 Git 记录。不要从早期占位页或已完成里程碑重新开始。

## 1. 目标与协作约定

TangTool 是 Windows / macOS 本地桌面工具箱，强调离线处理、隐私和直接的操作体验。开发者熟悉 Vue / TypeScript，正在学习 Tauri、Rust、Tailwind CSS、文档转换和跨平台发布。

- 小步结对开发：任务开始说明目标、原理与验收标准；实现后解释关键点、验证并更新本文。
- 需求存在实质歧义时先提问；低风险细节可说明假设后继续。需要后续确认的位置用具体 TODO 标注。
- Vue / HTML 标签属性尽量同一行，过长才换行；不要把整个组件挤成一行。
- 通用可读性：不压缩代码，不把多条语句、复杂逻辑或完整代码块挤在同一行；合理保留缩进、空格与空行。
- 不拆分只有一行且只调用一次的小方法；为业务规则、边界和非显然原因写有价值的注释。
- 除非用户明确要求，不新增或遗留单元测试文件。可用临时脚本验证后删除；不要顺手改动已有测试基线。
- Tailwind 变更应解释类名对应的 CSS 与布局原理，保留学习机会。
- 不擅自调整工具栏按钮顺序或放大按钮；使用紧凑按钮和 Lucide 图标。
- 不提交密码、令牌、私钥、个人文档。保留不属于本任务的改动。
- **保留用户的 `.venv` 和 `.venv-sidecar`，不能作为临时文件清理，也不能跨机器复制环境。**
- 提交、推送、发布和仓库设置变更按用户授权执行；换机前确保需要的改动已提交并推送。

## 2. 技术与边界

- Tauri 2 + Rust；Vue 3 + TypeScript + Vite 6；Pinia、Vue Router 4、Tailwind 4、Lucide。
- CodeMirror 6：JSON 编辑、折叠、语法高亮和错误定位；microdiff：结构化对比。
- SheetJS 0.20.3 使用官方发布源；不要替换成 npm 上过时的 0.18.5。
- MarkItDown 0.1.7 + PyInstaller 6.22.3；跨平台依赖及哈希固定在 `sidecar/requirements.lock`。
- Vue Router 5 与当前 Vite 不兼容，不使用 `--force` 绕过依赖检查。
- 工具内容默认仅在本机处理；前端做轻量文本操作，Rust 做文件、密码随机源及进程隔离。
- 路由懒加载 + 以路由名为 key 的 KeepAlive：菜单切换保留工具输入，刷新/关闭应用后清空。
- 仅外观与侧栏偏好写入 `tangtool.preferences.v1`；不持久化 JSON、密码或文档内容。
- 文件选择/保存使用 Tauri Dialog + 最小 FS 权限；不开放任意目录遍历和删除能力。
- 应用标识：`com.github.liuxiangyu2026.tangtool`；默认 1200×800，最小 900×640。

## 3. 已实现功能与不可丢失的规则

| 模块 | 当前能力 / 规则 |
| --- | --- |
| JSON 格式化 | 单编辑器；示例→格式化→压缩→复制→清除→导入→导出；实时校验、行列定位、折叠与彩色语法 |
| JSON 对比 | 新增/删除/修改，点击差异定位；数组按索引，不识别移动；对齐以左侧共同 key 顺序为准，独有 key 各自置后，不补字段、不重排数组 |
| JSON 转 Excel | 嵌套对象展开；null 为文本 `null`、缺失留空；数组默认紧凑 JSON，可选独立 Sheet 并重复主要字段；预览 50 行、保存全部 |
| 树形 JSON 平铺 | 检测后代同名数组字段才提供选项；每条根到末级路径一行，保留所有父级数据；单 Sheet，不做笛卡尔展开 |
| 拖动布局 | JSON 对比左右 25%～75%、结果高度 20%～60%；Excel 左右 25%～75%；文档左右 25%～55%；统一 Grip 图标并支持键盘 |
| 密码 | Rust 操作系统安全随机源，无偏采样与打乱；长度 4～128（默认 20），数量 1～20（默认 6）；保证所选字符类型，默认排除易混淆字符 |
| URL / MD5 / Base64 | 三个独立菜单及不同图标；URL 参数组件编解码；MD5 文本/文件；Base64 文本/文件；文件 Rust 流式处理；明确不是加密 |
| 文档转 Markdown | 仅 DOCX / PDF，不支持 .doc、无需 LibreOffice；最多 10 个，追加并按路径去重；逐个转换、点击查看、独立删除与保存；清除需确认，只清列表不删文件 |
| Markdown 预览 | marked 解析；格式化 / 原始模式，支持标题、表格、列表等；复杂排版、扫描 PDF、字体可能影响转换，不含 OCR |
| 侧栏与设置 | 图标折叠、悬停名称，底部版本/设置入口；浅色/深色/跟随系统；紧凑/标准/较大字号；本机记忆 |
| 一级菜单 | 分组标题可展开/收起；底部“折叠到一级 / 展开全部分组”；collapsedGroups 与外观一同保存；图标侧栏模式继续显示工具图标 |
| 时间戳 / 时区 | 明确秒/毫秒；ISO 日期输入必须带 Z 或偏移；支持常用 IANA 显示时区；拒绝非法日期，不猜测时区 |
| UUID | 安全随机 UUID v4；1～1000 条、默认 10；大小写/连字符选项；批量复制，不写入磁盘 |
| 正则调试 | JavaScript g/i/m/s/u/y 标志；Worker 执行，1 秒超时；最多 1000 匹配，有长度/捕获组限制，处理 Unicode 零长度匹配 |
| 文本整理 / SHA | 逐行去首尾空白→移除空行→区分大小写去重→字符排序；SHA-256/512 按 UTF-8 计算，支持空文本，最多 2 MiB；SHA 本轮只支持文本 |
| 官网 | `website/` 独立静态站：功能、平台下载、版本和限制说明；GitHub Pages 手动发布工作流，尚未上线 |
| 首页 | 默认 `/`，菜单名“首页”；顶部单线搜索，无介绍文字；中文/英文/拼音及非连续模糊匹配；共用 `src/data/tools.ts`，会话内保留搜索，不落盘 |
| Excel/CSV 转 JSON | XLSX/XLS/UTF-8 CSV；单表数组或多表分组；空单元格 null、空/重名表头补齐；原始/显示文本模式，不执行公式和宏；完整只读 CodeMirror、行号/高亮/折叠/全部展开及完整复制 |
| Cron | 用户确认仅标准 5 段；中文说明，IANA 时区、ISO 起点、未来 10 次；日期/星期同时限制时 OR；不支持 Quartz、不创建任务 |
| QR Code | 本地文本/网址，PNG/SVG 导出；默认 M/512px、4 格白边、最多 1000 UTF-8 字节，不访问输入 URL |
| 文本对比 | 逐行新增/删除高亮与行号；忽略行内空白但保留换行，统一 CRLF/LF；每侧 2000 行/20 万字符，后台超时保护 |
| 图片压缩 | 用户确认单张 JPEG/PNG/WebP → JPEG/WebP；质量/最长边、前后预览和体积；JPEG 透明区铺白，动画只留首帧，不保留元数据，默认 `_compressed` 另存 |
| 颜色选择器 | `/color`；二维 S/V 色板+竖向 H 条，点选/拖动/方向键；完整 216 安全色独立滚动、常用色前置、色块铺满并显示 HEX；通道/透明度/多编码/文字对比度保留 |

设置当前范围：主题/界面字号、工具收藏、窗口尺寸/最大化和分栏记忆、编辑器字体/换行/2-4-8空格缩进、默认导出目录及原名/日期时间后缀。无账户同步、自动更新或任意字体下载；提示时长仍固定 2 秒。只保存偏好与布局，不保存密码/JSON/文档内容。

## 4. 打包与发布真实状态

- M0～M4 核心功能已实现；M5 页面和独立 sidecar 已实现；目前进入 M6 发布准备及体验增强。
- GitHub Actions [运行 34800140359](https://github.com/liuxiangyu2026/TangTool/actions/runs/34800140359) 的 Windows x64、macOS ARM、macOS Intel 构建、sidecar health 和产物上传全部通过（构建提交 `107b4be`）。
- 产物名：`TangTool-x86_64-pc-windows-msvc`（含 NSIS .exe）、`TangTool-aarch64-apple-darwin`、`TangTool-x86_64-apple-darwin`（macOS 为保留权限的 .app ZIP）。
- macOS ARM sidecar 与 Rust 打包路径通过隔离目录、无有效 Python 搜索路径的转换验证。**CI 成功不等于无开发环境的干净机器验收成功。**
- Windows/Intel macOS 安装运行、无 Python/无仓库/离线转换、升级与卸载仍待真机验收。本机此前 GUI 验收受锁屏/屏幕捕获限制，不能据此标记通过。
- 本轮开始时仓库没有公开 Release。当前应用版本 0.1.0，仍标记开发阶段；未完成签名、公证和自动更新。
- 完整安装包内置 Python、MarkItDown 和依赖；最终用户不需要安装这些运行时。Windows 已配置内置离线 WebView2 安装程序，待真机验证；macOS 完整包最低 14.0。
- 开发转换使用项目 `.venv`；打包应用只调用主程序同目录 sidecar，不回退系统 Python。通信 UTF-8 JSON、后台执行、180 秒超时和输出大小限制。
- 完整安装包必须使用 `npm run desktop:build`；普通 `tauri build` 不带 sidecar 配置，不能当作完整交付包。

## 5. 当前任务、验收与下一步

用户要求连续推进到正式交付，常规修复、验证和候选包准备不再每步等待“继续”。仍不能把构建成功等同正式交付；证书/付费/账号缺口和目标机验收需明确交接。Word/PDF 互转仍暂缓。

当前 M6：初审发现的 R1～R7 已修复并通过本机隔离复验；详细证据、边界和打包结果见 `docs/release-checks.md`。

已提交推送 `codex/release-hardening`。应用修复基线 `7c1d928`；三平台构建 [34840425160](https://github.com/liuxiangyu2026/TangTool/actions/runs/34840425160) 全部成功。三份产物已下载到 `release-artifacts/ci-34840425160/` 并核对外层/内层 SHA-256、版本及干净提交。ARM 云端包完成隔离 DOCX/PDF 转换；Intel 只检查架构、包封印与图标，Windows 只检查安装器结构和摘要，均不算目标机运行验收。正式交付验收表与版本说明草稿在 `docs/delivery-checklist.md`、`docs/release-notes-0.1.0.md`。

- Base64 文件：同文件身份检查、拒绝末级符号链接、同目录临时写入、检查 finish/flush/sync 后提交；错误保留旧文件。前端固定输入快照并防重复操作。
- 文档：DOMPurify 净化预览，仅保留排版，不加载图片/打开链接；复制保存仍保留原 Markdown。保存固定名称/内容快照；转换固定队列并禁止增删，删除前项保持当前选择。
- MD5：输入变化清空旧摘要，防迟到请求回写，文件进度按 requestId 匹配并清理监听。Base64 文本上限 2 MiB，分块编码及严格 UTF-8 解码。
- 自定义 Rust 文件命令验证 Dialog/FS scope；启用生产/开发 CSP。真实 scope 临时验证通过，但原生文件对话框和 WebView/CSP 仍需验收。
- Vitest 4.1.11 / mocker 4.1.11，保留 Vite 6.4.3；现有 13 测试、前端/官网构建、Clippy/rustfmt 通过；npm 全量审计 0。Python 本地公告初筛无命中；Rust 初筛有上游未维护和仅 Linux/BSD 链的 glib 公告，详见报告，不能声称整体无漏洞。
- 新增 `.github/workflows/quality.yml`；完整打包前检查，Cargo 锁定。未新增永久测试文件。
- Windows `tauri.windows.conf.json` 配置内置离线 WebView2；需无运行时离线真机验收。
- macOS `tauri.macos.conf.json` 最低 14.0（当前 NumPy 二进制要求），候选包 ad-hoc 签名并关闭 hardened runtime，避免无 Team ID 的内置 Python 被库验证拒绝；不是开发者签名或公证。正式签名前须按 `sidecar/README.md` 的 TODO 统一内外签名身份、重新开启强化运行时并复验。
- `npm run release:collect` 紧随完整构建，生成版本化 ZIP/NSIS、SHA-256、提交及 dirty 标记，放入被忽略的 `release-artifacts/`；不要提交二进制。只有干净提交对应的包可进入正式验收。
- 2026-09-15 已启动云端 ARM 候选包并核对进程路径：原生 DOCX 选择/转换/排版/保存、追加与批量转换、删除前项保持选择、JSON 编辑器显示、MD5 文本/文件及旧摘要失效、Base64 正常编码保存/严格文本解码、正则 Worker 通过。具体通过边界见 `docs/release-checks.md`，不代表全部原生验收通过。
- 已确认进程退出重启，JSON 收藏仍保留。随后 Mac 再次锁屏：临时深色主题、JSON 格式化收藏尚未恢复；恢复原值是解锁后的第一步（原值为“跟随系统”、未收藏 JSON 格式化）。主题跨重启、输入清空、窗口/分栏与导出目录记忆仍需复核。当前验收实例在被忽略的 `release-artifacts/ci-34840425160/native-check/TangTool.app`。
- 覆盖保护的原生 Replace 确认被自动审批拒绝（认为会不可逆覆盖源文件）；未绕过，也不把源文件未变记为保护通过。目标是本轮生成的可重建临时样本，已只读核对；该原生步骤仍待完成。此前隔离写入保护验证仍有效。

接下来按顺序继续：

1. 新三平台构建已通过，无需重跑已完成检查；若修改应用代码/依赖/打包配置则对新提交重新构建。历史 `107b4be` 仅作历史参考。
2. 等待 Mac 解锁，先恢复临时主题/收藏，再完成余下原生验收；配合 Windows x64、macOS Intel 干净机器验收：无 Python/无仓库、离线转换、文件工具、复制导出、偏好恢复、B 图标、升级卸载。
3. 确认首发签名/公证方案、平台和版本，上传已验收产物及校验清单到 Release；启用 Pages 发布官网（`website/README.md`）。
4. 发布完成后再考虑文档原生拖放、ESLint/Prettier 和新工具；不在交付修复中扩充功能范围。

当前必须由用户补充：再次解锁 Mac 并暂时保持唤醒（原生控制明确报告重新锁定）；确认首发接受未签名/未公证版本，还是准备正式证书后公开发布（签名问题仍未答复）。此前已只读核对 GitHub 仓库有维护权限、无 Release、Pages 未启用；不是账号权限阻塞。尚未合并 main、公开 Release 或部署 Pages。临时验证程序和样本已清理，用户环境保留；临时 UI 偏好因锁屏暂未恢复，不能遗漏。

现有体验约定：`ToolNotice` 中上方固定浮层 2 秒；首页搜索约60%；菜单滚动条4px，折叠时 B Logo 在展开按钮上方；色卡3:2、216安全色独立滚动；透明色按明确黑/白底合成并计算对比度。工具内容仅会话保留，偏好与布局才落盘。细节以第3节、代码和 Git 记录为准。

未实现候选：JSONPath、SQL 格式化、JWT 本地查看（解码不等于验签）、SHA 文件摘要、JSON/YAML。不得默认加入云端 API、账户或上传。

## 6. 换机与常用命令

先阅读本文、`README.md`、`sidecar/README.md`；以 Git 状态与最新提交为准，不在本文复制不断失效的“最新 HEAD”。

```bash
git status --short --branch
git log -1 --oneline
# 工作区干净且已确认接续分支时：
git pull --ff-only
npm ci
npm run tauri dev
```

- Windows：Node.js LTS、Rust stable、MSVC Build Tools、Windows SDK、WebView2。
- macOS：Node.js LTS、Rust stable、Xcode Command Line Tools。
- Python 开发/打包环境按 `sidecar/README.md` 在新电脑重建；保留已有环境，不从其他电脑复制。
- CI 使用 Node 22、Python 3.10 和 Rust stable；首次依赖下载与 Rust 编译可能较慢。
- 前端热更新：`npm run tauri dev`；只看网页布局：`npm run dev`（不能验收 Tauri 文件和密码能力）。
- 官网：`npm run site:dev`；生产构建：`npm run site:build`；发布说明：`website/README.md`。
- 常用检查：`npm run build`、现有 `npm test`、`git diff --check`；Rust 变更再运行 Cargo check / Clippy / rustfmt。
- 打包：`npm run desktop:build`；三平台工作流：`.github/workflows/desktop-build.yml`（手动触发）。
