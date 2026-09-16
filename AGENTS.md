# TangTool 协作与接续说明

> 更新于 2026-09-16。本文只保存当前约定、状态和下一步；历史实现过程请查 Git 记录。不要从早期占位页或已完成里程碑重新开始。

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
- 仅语言、外观、收藏、导出、布局和更新检查偏好写入 `tangtool.preferences.v1`；不持久化 JSON、密码或文档内容。
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
| 文档转 Markdown | 需独立文档组件，页面提供下载/重新检测，未安装禁用转换；仅 DOCX / PDF，最多10个，追加去重、逐个转换、独立删除保存，清除需确认且不删源文件 |
| Markdown 预览 | marked 解析；格式化 / 原始模式，支持标题、表格、列表等；复杂排版、扫描 PDF、字体可能影响转换，不含 OCR |
| 侧栏与设置 | 图标折叠、悬停名称，底部版本/设置入口；浅色/深色/跟随系统；紧凑/标准/较大字号；本机记忆 |
| 一级菜单 | 分组标题可展开/收起；底部“折叠到一级 / 展开全部分组”；collapsedGroups 与外观一同保存；图标侧栏模式继续显示工具图标 |
| 时间戳 / 时区 | 明确秒/毫秒；ISO 日期输入必须带 Z 或偏移；支持常用 IANA 显示时区；拒绝非法日期，不猜测时区 |
| UUID | 安全随机 UUID v4；1～1000 条、默认 10；大小写/连字符选项；批量复制，不写入磁盘 |
| 正则调试 | JavaScript g/i/m/s/u/y 标志；Worker 执行，1 秒超时；最多 1000 匹配，有长度/捕获组限制，处理 Unicode 零长度匹配 |
| 文本整理 / SHA | 逐行去首尾空白→移除空行→区分大小写去重→字符排序；SHA-256/512 按 UTF-8 计算，支持空文本，最多 2 MiB；SHA 本轮只支持文本 |
| 官网 | 中英双语、19 工具分类目录、6 组双语截图轮播和平台下载；已上线 https://liuxiangyu2026.github.io/TangTool/ |
| 首页 | 默认 `/`，菜单名“首页”；顶部单线搜索，无介绍文字；中文/英文/拼音及非连续模糊匹配；共用 `src/data/tools.ts`，会话内保留搜索，不落盘 |
| Excel/CSV 转 JSON | XLSX/XLS/UTF-8 CSV；单表数组或多表分组；空单元格 null、空/重名表头补齐；原始/显示文本模式，不执行公式和宏；完整只读 CodeMirror、行号/高亮/折叠/全部展开及完整复制 |
| Cron | 用户确认仅标准 5 段；中英文说明，IANA 时区、ISO 起点、未来 10 次；日期/星期同时限制时 OR；不支持 Quartz、不创建任务 |
| QR Code | 本地文本/网址，PNG/SVG 导出；默认 M/512px、4 格白边、最多 1000 UTF-8 字节，不访问输入 URL |
| 文本对比 | 逐行新增/删除高亮与行号；忽略行内空白但保留换行，统一 CRLF/LF；每侧 2000 行/20 万字符，后台超时保护 |
| 图片压缩 | 用户确认单张 JPEG/PNG/WebP → JPEG/WebP；质量/最长边、前后预览和体积；JPEG 透明区铺白，动画只留首帧，不保留元数据，默认 `_compressed` 另存 |
| 颜色选择器 | `/color`；二维 S/V 色板+竖向 H 条，点选/拖动/方向键；完整 216 安全色独立滚动、常用色前置、色块铺满并显示 HEX；通道/透明度/多编码/文字对比度保留 |

设置当前范围：简体中文/英文、主题/界面字号、工具收藏、窗口尺寸/最大化和分栏记忆、编辑器字体/换行/2-4-8空格缩进、默认导出目录及原名/日期时间后缀、自动检查更新和预发布提醒。无账户同步、自动安装更新或任意字体下载；提示时长仍固定 2 秒。只保存偏好与布局，不保存密码/JSON/文档内容。

## 4. 打包与发布真实状态

- 用户已授权合入、发布和官网部署，接受未签名／未公证预发布；不再以购买证书或重复确认作为前提。
- 当前公开版本：[v0.1.2 Preview](https://github.com/liuxiangyu2026/TangTool/releases/tag/v0.1.2)，包含 Windows 图标设置修复与更新提醒。发布/标签提交为 `93d9f72ba472aa542d66e6b49fbb7d6c7889b0f9`，PR #3 已合入 main（`5f668bc`）；之后的发布流程/官网/交接文档提交不改写安装包来源。
- 三平台构建 [34954747054](https://github.com/liuxiangyu2026/TangTool/actions/runs/34954747054) 与质量检查 [34954747296](https://github.com/liuxiangyu2026/TangTool/actions/runs/34954747296) 全部通过。每个平台提供主包和独立文档组件，共六份安装包；另附统一 SHA256SUMS.txt 和 build-info.json。
- 主包大小约 Windows 2.9 MiB、macOS ARM 4.0 MiB、macOS Intel 4.1 MiB；组件约45.9 / 56.2 / 59.8 MiB。产物在 `release-artifacts/ci-34954747054/`，来源、dirty=false、内外摘要与上传摘要均核对。发布工作流 [35042315356](https://github.com/liuxiangyu2026/TangTool/actions/runs/35042315356) 成功，八份附件均经 GitHub runner 无登录凭证公开下载回读并匹配 SHA-256。
- 官网：[TangTool](https://liuxiangyu2026.github.io/TangTool/)，最新部署 [35042315249](https://github.com/liuxiangyu2026/TangTool/actions/runs/35042315249) 来自主分支 `fdee4f3`。中英六个主包/组件链接已复核，均指向 v0.1.2；官网升级说明同步自动检查、手动安装和旧版首次手动升级的要求。主包匹配明确排除 DocumentRuntime，不能混淆安装包类型。
- Windows 主包不再包含 WebView2 离线安装器。安装页检测 HKLM/HKCU 运行时，缺少时提供微软链接，下一步重新检测并阻止继续。文档组件默认不勾选，勾选后需手动安装组件并通过自检，不选可继续。
- macOS 主应用默认不含文档组件，独立 PKG 安装到 `/Library/Application Support/TangTool/DocumentRuntime/1.0.0`；Windows 组件为当前用户安装到 `%LOCALAPPDATA%\TangTool\DocumentRuntime\1.0.0`。组件自带 Python，不使用用户系统 Python。PKG 固定路径、架构、最低14.0及禁用框架迁移已核对。
- 文档组件版本1.0.0、协议1和下载版本v0.1.1由 `sidecar/runtime.json` 统一定义。健康检查20秒/64 KiB，转换180秒/16 MiB；只有匹配版本/架构且自检成功才启用转换，页面提供安装包和重新检测，无需重启。
- ARM 组件在本机与云端 PKG 解包后通过项目外、无有效 Python 搜索路径的 DOCX（含表格）/PDF 转换及协议拒绝。独立标识原生预览通过中英缺失提示、禁用状态与重复检测；没有实际安装组件到用户系统目录，没有改动用户正式应用偏好。
- **CI、自检和摘要检查不等于全部目标机交互验收通过。** Windows 安装页的真实点击分支、组件安装卸载，macOS 系统 Installer 安装后重新检测，以及干净机器流程仍待验证。详情见 `docs/delivery-checklist-0.1.2.md` 及引用的旧待验项。保持预发布、无正式签名／公证及不自动安装更新的说明。
- `npm run desktop:build` 现在生成轻量主包和独立组件包，`npm run sidecar:build` 单独生成组件，`release:collect` 紧随完整构建收集两份平台附件。已移除旧 tauri.sidecar.conf.json。开发模式继续用项目 `.venv`，打包用 `.venv-sidecar`，必须保留两者。
- 旧 [v0.1.0](https://github.com/liuxiangyu2026/TangTool/releases/tag/v0.1.0) 完整包保留，其内置运行时说明和旧验收记录不能套用于轻量包。旧产物目录仅供历史参考；代码/依赖/打包配置变化需重新构建，不把旧包标为新提交。

## 5. 当前交付内容与下一步

v0.1.2 已公开交付，Release ID 为389077246。用户于2026-09-16明确授权启用发布工作流及所需写入权限，原权限阻塞已解除，不要再次询问。`.github/workflows/publish-release.yml` 只允许从 main 手动触发，输入成功构建 run ID、完整源码 commit 和已有预发布草稿 ID；校验来源/摘要，保留已完成附件，只清理本草稿未完成传输，完整后发布并回读公开下载。发布后的正式下载地址需重新查询，不能复用草稿临时标签地址。不会触发新一轮桌面重编译，不覆盖历史公开包。

Windows 任务栏图标设置修复已合入 v0.1.2：旧主 EXE 的 ICO 已是 B 图标，当前 tauri-runtime-wry/tao 默认只设置 ICON_SMALL，ICON_BIG 未同步；新增 Windows 专属启动设置，从当前 EXE 的32512号资源组显式设置两种图标，NSIS 安装/卸载图标共用品牌 ICO。Windows 编译及新主程序/安装器六种尺寸资源像素核对通过；实际任务栏仍待 Windows 复核。使用锁文件已有 windows-sys 0.61.2，不改应用标识、不清理用户固定图标缓存；旧固定项若仍缓存图标，可取消固定再从开始菜单启动新版并重新固定。

本轮新增更新提醒：用户要求发布新版后能提醒。已按“启动检查＋使用期间6小时检查、侧栏新版标记、版本页手动检查/说明/下载、设置可关闭”实现，不自动安装。当前渠道为预发布，默认包含预发布，可设置仅正式版。仅访问本仓库 GitHub Releases API，CSP 仅放行该查询路径，不发送工具内容；查询结果仅在会话保存，偏好仍用原 storage key。v0.1.1 用户必须先手动升级到带此功能的版本，不能宣称旧版已经能自动收到提醒。

临时验证已覆盖 SemVer（含多位版本号/预发布排序/大数字/非法格式）、同仓库版本链接校验、预发布过滤、启动及6小时检查、可见性、关闭取消/迟到响应、限流/超时、偏好保存与定时器清理；未新增永久单元测试。独立标识 macOS 原生预览已成功查询真实 GitHub 版本并显示检查时间，验证实际 WebView/CSP 联网路径；新版提示分支使用临时数据验证。自动检查仅在桌面原生环境启用，浏览器开发预览可手动检查。

可选文档组件与轻量安装包方案已实现并公开。不要重新从该功能开始；接下来优先按 v0.1.2 交付表及其引用的旧待验项补齐目标机安装、检测、升级卸载验收。

根目录 README 按用户要求仅保留项目介绍、19 项工具和官网链接；`README.md` 与 `README.en.md` 顶部互相切换。开发与验收信息维护在本文及专题文档，不写回产品 README。

- 双语覆盖桌面和官网，各自记住选择，默认简体中文。纯文本字典及显式参数、Vue 响应式语言、Worker 显式 locale、Rust `AppError { key, parameters, cause }` 保持一致；不翻译用户输入、文件名和文档内容，不重建 KeepAlive 工具。维护规则见 `docs/localization.md`。
- 官网首屏六组中英截图，每 4.5 秒横向轮播，仅显示玻璃圆点；点击圆点切换，点击图片放大、再次点击或 Escape 关闭。悬停/焦点/大图/后台页面暂停，尊重减少动态效果偏好。图片保持 1280×720 原比例，来自生产前端演示数据，不代表原生能力验收。
- 官网删除“全部工具”按钮，再次点击当前分类恢复全部。首页搜索、统计和卡片共用居中 1200px 最大内容宽度，搜索占内容区约60%，其他工具页保持原布局。
- R1～R7 发布加固已完成：Base64 同文件保护、临时写入并检查 finish/flush/sync；文档预览 DOMPurify 净化、转换队列锁定及保存快照；MD5 防旧结果回写；自定义文件命令验证 Dialog/FS scope，保留生产/开发 CSP。不得移除这些边界。
- 现有 13 测试、前端/官网构建、Rust fmt/Clippy 通过；npm 审计 0。Python/Rust 公告检查范围及上游未维护依赖见 `docs/release-checks.md`，不能概括成整个项目没有漏洞。未新增永久单元测试。
- 体验约定：提示中上方固定显示 2 秒；菜单滚动条4px；折叠时 B Logo 位于展开按钮上方；色卡3:2、216安全色独立滚动；半透明色按明确黑/白底合成后计算对比度。仅偏好/布局落盘，工具内容只在会话保留。

下一步：

1. 使用 v0.1.2 包完成交付表中的目标机验收：Windows WebView2 缺失重检与组件可选分支，独立组件安装后页面重新检测、无系统 Python 的转换、文件操作、偏好恢复、图标和升级卸载。
2. 验收完成后按用户决定安排稳定版；已支持更新提醒，尚不自动下载安装。不把未签名方案重新列为待确认，不默认采购证书。
3. 发布后的新功能再按需求推进：文档原生拖放、JSONPath、SQL 格式化、JWT 本地查看、SHA 文件摘要、JSON/YAML。Word/PDF 互转仍暂缓；不默认加入云端 API、账户或上传。
4. 保留用户已有设置、工具输入与两个 Python 环境；不要重复清除已恢复的临时主题和收藏。历史原生测试的详细待验项见交付表。

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
- 发布：先建立指向构建源码提交的预发布草稿，再从 main 手动运行 `.github/workflows/publish-release.yml`，填写 `run_id`、`commit` 和 `release_id`；运行成功且公开回读报告齐全后更新交付文档。工作流已获用户授权，无需重新申请相同权限。
