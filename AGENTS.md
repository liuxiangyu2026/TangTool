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
- 仅语言、外观、收藏、导出和布局偏好写入 `tangtool.preferences.v1`；不持久化 JSON、密码或文档内容。
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
| 官网 | 中英双语、19 工具分类目录、6 组双语截图轮播和平台下载；已上线 https://liuxiangyu2026.github.io/TangTool/ |
| 首页 | 默认 `/`，菜单名“首页”；顶部单线搜索，无介绍文字；中文/英文/拼音及非连续模糊匹配；共用 `src/data/tools.ts`，会话内保留搜索，不落盘 |
| Excel/CSV 转 JSON | XLSX/XLS/UTF-8 CSV；单表数组或多表分组；空单元格 null、空/重名表头补齐；原始/显示文本模式，不执行公式和宏；完整只读 CodeMirror、行号/高亮/折叠/全部展开及完整复制 |
| Cron | 用户确认仅标准 5 段；中英文说明，IANA 时区、ISO 起点、未来 10 次；日期/星期同时限制时 OR；不支持 Quartz、不创建任务 |
| QR Code | 本地文本/网址，PNG/SVG 导出；默认 M/512px、4 格白边、最多 1000 UTF-8 字节，不访问输入 URL |
| 文本对比 | 逐行新增/删除高亮与行号；忽略行内空白但保留换行，统一 CRLF/LF；每侧 2000 行/20 万字符，后台超时保护 |
| 图片压缩 | 用户确认单张 JPEG/PNG/WebP → JPEG/WebP；质量/最长边、前后预览和体积；JPEG 透明区铺白，动画只留首帧，不保留元数据，默认 `_compressed` 另存 |
| 颜色选择器 | `/color`；二维 S/V 色板+竖向 H 条，点选/拖动/方向键；完整 216 安全色独立滚动、常用色前置、色块铺满并显示 HEX；通道/透明度/多编码/文字对比度保留 |

设置当前范围：简体中文/英文、主题/界面字号、工具收藏、窗口尺寸/最大化和分栏记忆、编辑器字体/换行/2-4-8空格缩进、默认导出目录及原名/日期时间后缀。无账户同步、自动更新或任意字体下载；提示时长仍固定 2 秒。只保存偏好与布局，不保存密码/JSON/文档内容。

## 4. 打包与发布真实状态

- 用户已明确授权全部修改合入 main、发布版本并部署官网；此前自动审批的合入阻塞已解除，不再重复询问。已接受首发未签名／未公证，不以购买证书作为发布前提。
- [PR #1](https://github.com/liuxiangyu2026/TangTool/pull/1) 已合入 main，发布代码来源为 `9a936b8b1f6f889a6a11513531ad07f64179a16d`。本地也已切换 main；后续文档提交不改变安装包来源。
- [v0.1.0 Preview](https://github.com/liuxiangyu2026/TangTool/releases/tag/v0.1.0) 已于 2026-09-15 公开，含 Windows x64 NSIS、macOS ARM/Intel 应用 ZIP、统一 `SHA256SUMS.txt` 与 `build-info.json`。保留预发布标记，不能称为三平台真机全部验收通过的稳定版。
- 三平台构建 [34934860407](https://github.com/liuxiangyu2026/TangTool/actions/runs/34934860407)、主分支质量检查 [34934810780](https://github.com/liuxiangyu2026/TangTool/actions/runs/34934810780) 全部成功。安装包在 `release-artifacts/ci-34934860407/`，外层/内层摘要、版本、提交与 dirty=false 均核对；上传后的五个附件摘要也全部一致。
- 已不带登录凭证从公开 Release 回读全部五个附件，大小与 SHA-256 全部一致；记录在该产物目录的 `public-download-verification.json`。公开标签 v0.1.0 固定指向发布提交，不随后续文档提交移动。
- ARM/Intel 包资源封印、B 图标、主程序和 sidecar 架构、版本 0.1.0、最低 macOS 14.0 已复核。Windows 检查摘要和 NSIS 结构；安装器 PE32 外壳不代表应用不是 x64。
- 官网已上线：[TangTool](https://liuxiangyu2026.github.io/TangTool/)，部署 [34934863889](https://github.com/liuxiangyu2026/TangTool/actions/runs/34934863889) 同样来自 `9a936b8`。线上中英切换、19 工具、六组截图、圆点切换、放大关闭及三个真实下载入口通过，明确显示预发布。
- 完整包内置 Python、MarkItDown 和依赖；用户不需额外安装 Python。Windows 已内置 WebView2 离线安装程序，缺少运行时且断网的安装仍待真机验收。macOS 为 ad-hoc 签名，未做 Developer ID 签名或公证。
- **构建/摘要检查不替代干净目标机验收。** Windows/Intel 安装运行、离线转换、升级卸载及部分 ARM 原生子项仍待验证。历史 `7c1d928` ARM GUI 和 `f13a1d2` 隔离 DOCX/PDF 转换证据不得自动记为新包全部通过；详细边界见 `docs/delivery-checklist.md`、`docs/release-checks.md`。
- `ci-34840425160/`、`ci-34929714721/` 和本机早期包均为历史产物，不混入本次 Release。源码或打包配置变更需重新完整构建，单独执行收集命令不能把旧包标成新提交。
- 完整打包使用 `npm run desktop:build`，普通 `tauri build` 不带完整 sidecar。开发转换使用项目 `.venv`；打包仅调用随包 sidecar，不回退系统 Python，UTF-8 JSON 通信、后台执行、180 秒超时及输出限制保持不变。

## 5. 当前交付内容与下一步

根目录 README 按用户要求仅保留项目介绍、19 项工具和官网链接；`README.md` 与 `README.en.md` 顶部互相切换。开发与验收信息维护在本文及专题文档，不写回产品 README。

- 双语覆盖桌面和官网，各自记住选择，默认简体中文。纯文本字典及显式参数、Vue 响应式语言、Worker 显式 locale、Rust `AppError { key, parameters, cause }` 保持一致；不翻译用户输入、文件名和文档内容，不重建 KeepAlive 工具。维护规则见 `docs/localization.md`。
- 官网首屏六组中英截图，每 4.5 秒横向轮播，仅显示玻璃圆点；点击圆点切换，点击图片放大、再次点击或 Escape 关闭。悬停/焦点/大图/后台页面暂停，尊重减少动态效果偏好。图片保持 1280×720 原比例，来自生产前端演示数据，不代表原生能力验收。
- 官网删除“全部工具”按钮，再次点击当前分类恢复全部。首页搜索、统计和卡片共用居中 1200px 最大内容宽度，搜索占内容区约60%，其他工具页保持原布局。
- R1～R7 发布加固已完成：Base64 同文件保护、临时写入并检查 finish/flush/sync；文档预览 DOMPurify 净化、转换队列锁定及保存快照；MD5 防旧结果回写；自定义文件命令验证 Dialog/FS scope，保留生产/开发 CSP。不得移除这些边界。
- 现有 13 测试、前端/官网构建、Rust fmt/Clippy 通过；npm 审计 0。Python/Rust 公告检查范围及上游未维护依赖见 `docs/release-checks.md`，不能概括成整个项目没有漏洞。未新增永久单元测试。
- 体验约定：提示中上方固定显示 2 秒；菜单滚动条4px；折叠时 B Logo 位于展开按钮上方；色卡3:2、216安全色独立滚动；半透明色按明确黑/白底合成后计算对比度。仅偏好/布局落盘，工具内容只在会话保留。

下一步：

1. 使用本次 Release 包完成 Windows x64、macOS Intel 和剩余 ARM 原生验收，并把机器、系统、包摘要与具体结果写入交付表。重点包括无 Python/无仓库的离线转换、文件操作与复制、偏好恢复、图标、升级卸载、Windows 无 WebView2 离线安装。
2. 验收完成后按用户决定安排稳定版；当前没有自动更新。不把未签名方案重新列为待确认，不默认采购证书。
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
