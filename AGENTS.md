# TangTool 项目协作说明

## 1. 项目目标

TangTool 是一款面向 Windows 和 macOS 的本地桌面工具箱。第一期强调离线处理、隐私保护、操作直接和可持续扩展。

项目同时承担学习目标：开发者已经熟悉 Vue 3、TypeScript、Vite、Pinia 和 Vue Router；开发过程需要通过小步任务、讲解、实践和复盘，逐步掌握 Tauri、Rust、桌面文件能力、文档转换、跨平台构建和 GitHub Actions。

开发者此前没有使用过 Tailwind CSS。涉及 Tailwind 的任务需要说明工具类对应的 CSS、布局原理和常见误区，并通过小步实践帮助开发者逐步掌握，而不是只提供需要照抄的类名。

## 2. 协作方式

- 使用结对开发方式，不一次性代写完整应用。
- 每个任务开始前说明目标、原理、新知识和验收标准。
- 开发者亲自完成关键练习，Codex 检查实现并解释问题和原因。
- 修复问题时先复现和定位，再共同修改，不只给出最终答案。
- 每完成一个任务，更新本文档中的进度、关键决定和下一步。
- 新电脑拉取仓库后，先阅读本文档和 README，再从“当前任务”继续。
- 不提交密码、访问令牌、私钥、个人文档或其他敏感数据。

## 3. 第一期功能范围

### JSON 工具

- JSON 格式化、压缩和语法校验
- 清晰显示语法错误位置和原因
- JSON 对比，支持左右输入和差异高亮
- JSON 转 Excel，支持数组对象和嵌套字段展开
- 从文件读取 JSON，并导出处理结果

### 文档转 Markdown

- Word（DOCX）转 Markdown
- PDF 转 Markdown
- 支持文件选择、拖放、转换预览和结果保存
- 明确提示扫描版 PDF、复杂排版和表格可能存在识别误差

### 密码生成器

- 设置长度、字符类型和排除易混淆字符
- 使用操作系统安全随机数生成密码
- 显示密码强度并支持复制

### 哈希与编码

- MD5 摘要计算，支持文本和文件
- Base64 文本编码与解码
- Base64 文件编码与解码
- UI 中明确说明 MD5 不是加密，Base64 也不是加密

## 4. 技术栈

- 桌面框架：Tauri 2
- 前端：Vue 3 + TypeScript + Vite
- 状态管理：Pinia
- 路由：Vue Router
- UI：Tailwind CSS + shadcn-vue，图标使用 Lucide
- 编辑器：CodeMirror 6（优先）或 Monaco Editor（需要时评估）
- 原生能力：Rust + Tauri Commands / Plugins
- Excel：SheetJS
- Word/PDF 转 Markdown：Microsoft MarkItDown，通过跨平台 sidecar 调用
- 测试：Vitest、Vue Test Utils，Rust 单元测试；关键流程后续增加端到端测试
- 工程质量：ESLint、Prettier、Clippy、rustfmt
- 持续集成与发布：GitHub Actions

## 5. 架构原则

- 默认所有内容在本机处理，不上传用户文件。
- 前端负责交互和轻量纯文本转换；Rust 负责系统文件、原生能力和敏感操作边界。
- 密码生成必须使用密码学安全随机源，不使用 `Math.random()`。
- 文档转换通过 sidecar 隔离，前端不直接依赖 Python 环境。
- 功能以独立工具模块组织，共享文件选择、复制、通知和导出能力。
- 第一阶段保持简单，确认存在复用和复杂度后再抽象。

## 6. 开发计划与学习目标

### M0：环境、仓库和最小应用

- [x] 安装并验证 Node.js LTS、Rust、Tauri 的 Windows 开发依赖
- [x] 创建 Tauri 2 + Vue 3 + TypeScript 项目
- [x] 理解 WebView、前端进程、Rust 后端和 Tauri Command 的关系
- [x] 初始化 Git，创建 GitHub 仓库并推送
- [ ] 建立 README、格式化、Lint 和基础测试
- [x] 在 Windows 上启动最小桌面应用

### M1：应用骨架和第一个前后端调用

- [ ] 建立工具型布局、侧栏、路由和统一页面结构
- [x] 完成第一个 Vue 调用 Rust Command 的练习
- [ ] 学习 Tauri 权限、配置和错误返回
- [ ] 建立通用复制、文件选择、保存和提示能力

### M2：JSON 基础工具

- [x] JSON 格式化、压缩、校验和错误定位
- [x] 增加编辑器、示例、清空、复制和文件导入导出
- [x] 添加核心逻辑单元测试

### M3：JSON 对比和 JSON 转 Excel

- [x] 使用成熟 diff 库实现结构化 JSON 对比
- [x] 设计嵌套 JSON 展平规则
- [x] 使用 SheetJS 生成并保存 XLSX
- [x] 覆盖空数组、混合类型、深层嵌套等边界情况

### M4：密码、哈希与 Base64

- [x] 使用安全随机源实现密码生成器
- [x] 实现文本和文件 MD5
- [ ] 实现文本和文件 Base64 编解码
- [x] 对大文件采用 Rust 流式读取和进度事件，避免前端一次性加载

### M5：Word/PDF 转 Markdown

- [ ] 先在开发环境验证 MarkItDown 的转换效果
- [ ] 理解并实现 Tauri sidecar 调用、进程通信和错误处理
- [ ] 为 Windows 和 macOS 构建独立 sidecar
- [ ] 完成拖放、预览、保存和转换限制提示

### M6：质量、跨平台构建和发布

- [ ] 完善单元测试、集成测试和关键流程测试
- [ ] 配置 GitHub Actions 的 Windows/macOS 检查与构建
- [ ] 配置应用图标、版本号和安装包
- [ ] 在 Windows 和 macOS 验收安装、升级和卸载
- [ ] 编写使用说明、开发说明和发布说明

## 7. 当前进度

- 当前里程碑：M4 密码、哈希与 Base64
- 当前任务：M5-1 MarkItDown 环境与转换入口验证
- 已完成：M0-1 开发环境；GitHub CLI 登录；Node.js 24.19.0；npm 11.17.0；Rust/Cargo 1.98.0；Git 2.55.0；MSVC Build Tools；Windows SDK 10.0.26100.0；WebView2 152.0.4191.53
- 已完成：官方脚手架、命名统一、依赖安装、Windows 启动、Vue 到 Rust 的调用链、生产构建；npm 报告 0 个漏洞；已精确许可 `esbuild@0.25.12` 安装脚本
- 已完成：Git 仓库和 `main` 分支；首次提交 `d428427`；公开仓库 `https://github.com/liuxiangyu2026/TangTool`
- 已完成：安装 Pinia 4.0.3、Vue Router 4.6.4、Lucide Vue Next 1.0.0、Tailwind CSS 4.3.3
- 已完成：Tailwind 4 已通过 `@tailwindcss/vite` 接入；`src/styles.css` 已由 `src/main.ts` 导入；生产构建成功
- 已完成：初版 Hash 路由已建立，`/` 可重定向到 `/json/format`，Windows Tauri 窗口能显示 JSON 格式化占位页
- 已完成：M1-1A 路由和占位页清理；六条工具路由已扁平化；`App.vue`、`main.ts` 和占位页已精简；macOS 上 `npm run build`、`git diff --check` 和 `npm run tauri dev` 验收通过
- 已完成：macOS 接续环境；Xcode Command Line Tools 已安装；Node.js 20.15.0；npm 10.7.0；Rust/Cargo 1.98.0；首次 Tauri crate 下载与原生编译成功
- 已完成：M1-1B-1 页面壳外层结构；使用 Flex 建立固定宽度侧栏和可收缩、独立滚动的主内容区
- 已完成：M1-1B-2 侧栏导航数据与分组；已覆盖 JSON、文档、安全、编码四组和六个第一期工具，使用 Lucide 动态组件和 `RouterLink`
- 已验证：本地开发页默认跳转到 `#/json/format`；六个侧栏入口均能切换到对应 Hash 路由和页面标题；`npm run build` 成功；控制台无错误或警告；`git diff --check` 无输出
- 已完成：M1-1B-3 使用 `RouterLink` 的 `exact-active-class` 提供当前路由选中状态；刷新、直接访问 Hash 路由和点击导航均已验收
- 已完成：M1-1B-4 统一页面标题和工具工作区；六个页面共用稳定的背景、标题区域和最小高度内容区；`npm run build` 与 `git diff --check` 已通过
- 已完成：M2-1 初版 `src/utils/json.ts`；空输入返回失败；解析异常返回错误信息；Vitest 已加入 `package.json`，当前 1 个测试通过
- 已完成：M2-1 JSON 格式化测试补强；对象、数组、压缩 JSON、非法 JSON 和空输入共 5 个用例通过，成功结果已完整断言 `value`
- 已完成：M2-1 JSON 格式化页面；新增 `JsonFormatView.vue`，完成输入、格式化操作、只读输出和错误提示，并将 `/json/format` 切换到专用页面
- 已验证：有效 JSON 能输出两空格缩进结果；非法 JSON 会清空旧输出并显示解析错误；空输入显示“JSON 内容不能为空”；`npm test` 5 个用例通过；`npm run build` 和 `git diff --check` 通过
- 已完成：M2-2 JSON 压缩与编辑体验；新增 `minifyJson` 和 5 个测试，JSON 测试共 10 个；格式化页改为单个 CodeMirror 6 编辑器，顶部提供格式化、压缩和复制按钮
- 已完成：CodeMirror JSON 语法高亮和折叠槽；key、字符串、数字、布尔值和 null 使用不同颜色，格式化后的对象与数组支持收起和展开
- 已完成：接入 Tauri Clipboard 插件，仅授予 `clipboard-manager:allow-write-text` 权限；默认窗口调整为 1200×800，最小尺寸为 900×640；所有工具页减少外边距并放宽内容区域
- 已验证：`npm test` 10 个用例通过；`npm run build`、`cargo check` 和 `git diff --check` 通过；JSON 专用页面已懒加载，构建不再出现 500 KB 首屏块警告；`npm run tauri dev` 启动成功
- 已完成：JSON 顶部工具栏增加清除按钮；格式化、压缩、复制和清除均使用 Lucide 小图标，并分别使用蓝、橙、绿、红配色
- 已完成：按当前 `示例 → 格式化 → 压缩 → 复制 → 清除 → 导入 → 导出` 顺序保留工具栏位置；按钮缩小为 `px-3 py-1.5`、图标 14px，使界面更紧凑
- 已完成：路由出口使用 `KeepAlive` 并以路由名作为缓存 key；切换到其他工具再返回时保留 JSON 内容、折叠状态和撤销历史，刷新或关闭应用后仍会清空
- 已验证：JSON 格式化页切换到 JSON 对比页后再返回，编辑内容保持不变；清除按钮能清空内容并将焦点放回编辑器
- 已完成：M2-3 新增 `validateJson` 和结构化错误结果；解析失败返回错误原因、字符位置、行号和列号，并使用 JSON 语法树作为不同运行时错误文案的定位兜底
- 已完成：CodeMirror 接入实时 lint；输入停止约 300ms 后显示错误标记，格式化或压缩失败时自动滚动并定位错误字符，底部显示标准化原因和行列信息
- 已验证：多行尾随逗号在第 3 行显示 lint 标记，点击格式化后显示第 3 行第 1 列；修正后错误标记和提示清除；`npm test` 13 个用例、`npm run build` 和 `git diff --check` 通过
- 已完成：M2-4 增加示例、导入和导出按钮；示例覆盖对象、数组、字符串、数字、布尔值和 null；导入与导出使用 Tauri Dialog 和 FS 插件
- 已完成：文件能力遵循最小权限；只开放打开/保存对话框、读取文本文件和写入文本文件，文件对话框选择的路径只在当前应用会话中临时加入 FS scope
- 已验证：真实 Tauri debug 应用中完成 JSON 文件导入、导出、取消导入、取消导出和空内容阻止导出；导出文件与导入源逐字节一致；测试文件已清理
- 已验证：`npm test` 13 个用例、`npm run build`、`cargo check --offline`、`git diff --check` 和 `npm run tauri build -- --debug --bundles app` 通过
- 已验证：debug `.app` 中点击复制后显示“已复制到剪贴板”，Tauri Clipboard 写文本权限实际可用
- 已完成：M2 完整功能已通过提交 `18e6aec feat: complete JSON formatting tool` 推送到 `origin/main`
- 已完成：M3-1 采用 `microdiff` 实现结构化 JSON 对比纯函数；应用层统一映射为新增、删除、修改三类结果，并生成可读 JSONPath
- 已完成：新增 `JsonDiffView.vue`；提供左右 CodeMirror 编辑器、示例、对比、清除和可滚动差异结果列表；页面通过路由懒加载
- 已验证：示例产生 5 处差异；对象字段新增/删除/修改、数组索引路径、单侧非法 JSON、忽略对象 key 顺序和菜单切换状态保留均通过本地交互验收
- 已完成：M3-2 点击差异卡片后使用 Lezer JSON 语法树定位对应属性或数组元素，左右 CodeMirror 同步滚动并按新增、删除、修改颜色高亮；当前差异卡片显示蓝色选中状态
- 已完成：左右编辑器之间增加竖向拖动手柄，宽度限制为 25%～75%；编辑器与差异结果之间增加横向拖动手柄，结果区高度限制为 20%～60%
- 已完成：两个分隔器支持 Pointer Events、pointer capture、ARIA separator 和方向键 2% 步进调整；拖动后 CodeMirror 自动重新测量
- 已验证：鼠标左右/上下拖动、键盘方向键调整、差异项定位、高亮及菜单切换状态保留均通过本地交互验收
- 已完成：JSON 对比页增加“对齐”按钮；每层共同 key 按左侧顺序排列，左右独有 key 分别追加到各自对象末尾，嵌套对象和同索引数组对象递归处理
- 已验证：顶层对象、嵌套对象、数组中的对象和非法 JSON 保护均通过交互验收；对齐不会插入缺失字段，也不会改变数组元素顺序
- 已完成：M3-1、M3-2 已通过提交 `d230e73 feat: add structured JSON comparison` 推送到 `origin/main`
- 已完成：M3-3 确定 JSON 转 Excel 规则；顶层数组映射为行、嵌套对象映射为路径列、嵌套数组保留为紧凑 JSON 字符串、null 写为文本 `null`、缺失字段留空
- 已完成：新增 `jsonToTable` 纯函数；支持顶层对象、对象数组、基本类型数组、混合数组、特殊字符 key、空对象与空数组错误，并按字段第一次出现顺序生成列
- 已验证：通过临时脚本覆盖嵌套对象、字段缺失、数组、null、空值、混合类型、特殊 key 和 `__proto__` key；验证后已删除临时脚本，未新增测试文件
- 已完成：M3-4 使用 SheetJS 0.20.3 将展平结果生成 XLSX；工作表名为 `JSON Data`，保留数字和布尔值类型，并根据表头与数据自动设置列宽
- 已完成：新增 `JsonExcelView.vue`；提供 CodeMirror 输入、示例、生成预览、导入 JSON、保存 XLSX 和清除；预览最多渲染 50 行，保存包含全部数据
- 已完成：Tauri FS 增加 `fs:allow-write-file` 二进制写权限，不增加目录遍历、删除或重命名权限；JSON 转 Excel 页面通过路由懒加载，SheetJS 不进入首屏
- 已验证：示例生成 2 行 × 8 列预览；修改输入清除旧预览；空数组、非法 JSON、菜单切换状态保留通过；真实 debug `.app` 保存 XLSX 成功并回读验证工作表、表头、值类型和列宽
- 已验证：现有 13 个测试、`npm run build`、`cargo check --offline`、`git diff --check` 和 debug `.app` 构建通过；临时脚本和 XLSX 文件已删除
- 已完成：JSON 转 Excel 编辑器与预览之间增加竖向拖动手柄，宽度限制为 25%～75%，支持 Pointer Events、pointer capture、ARIA separator 和方向键 2% 步进调整
- 已完成：自动识别父级对象中的数组字段；用户可选择一个或多个数组生成独立 Sheet，并选择非数组主要字段重复到每个子表数据行
- 已完成：选中的数组列从主 Sheet 移除；数组对象按既有规则展平，基本类型数组使用 `value` 列；空数组不生成空 Sheet；父子字段重名时子字段增加 `item.` 前缀
- 已完成：数组 Sheet 默认使用字段 key 命名；非法字符自动替换，名称限制为 31 个字符，忽略大小写处理重名并增加数字后缀
- 已验证：示例中选择 `modules` 并重复 `name、version` 后生成 2 个 Sheet，子表为 3 行 × 4 列；页面切换后选项、当前 Sheet 和拖动比例保持不变
- 已验证：临时脚本覆盖多个数组字段、嵌套数组路径、对象数组、基本类型数组、空数组、父子同名字段、Sheet 名清洗与 XLSX 回读；脚本已删除，未新增测试文件
- 已完成：自动识别数组元素中再次出现同名数组字段的树形递归 JSON，并只在检测成功时显示“递归数据平铺”选项
- 已完成：递归平铺以每条根节点到末级节点的完整路径生成一行，使用 `第1级、第2级……` 列依次保留全部父级和末级数据；空或缺失子数组的节点作为末级节点
- 已完成：平铺模式使用单个 `JSON Data` Sheet，不生成各层数组 Sheet；递归字段不再保存为 JSON 字符串，节点中的其他非递归数组仍按原规则保存
- 已验证：用户提供的三层 `children` 示例生成 1 行 × 6 列；多根节点、不同分支深度、空子数组、包装数组中的递归结构、普通非递归数组和 XLSX 回读均通过
- 已验证：递归平铺选项、输入和预览在菜单切换后保持不变；临时验证脚本已删除，未新增测试文件
- 已完成：M3 JSON 转 Excel 已通过提交 `43e4143 feat: add JSON to Excel conversion` 推送到 `origin/main`
- 已完成：M4-1 密码规则确定；长度 4～128、默认 20；生成数量 1～20、默认 6；支持大写、小写、数字、特殊字符，并默认排除 `0 O o 1 I l |`
- 已完成：Rust 新增 `generate_passwords` Tauri Command，使用操作系统安全随机源、无偏索引采样和 Fisher–Yates 打乱，独立生成指定数量，并保证每种已选字符类型至少出现一次
- 已完成：密码生成器页面；提供长度滑块和数字输入、生成数量、字符类型、排除易混淆字符、自动/手动生成、逐条复制、复制全部、熵值强度和本地隐私说明；页面通过路由懒加载
- 已完成：修复窗口放大时密码结果区与顶部按钮之间的多余空白；结果内容改为顶部对齐并独立滚动，避免使用垂直居中放大空白
- 已完成：新增 URL 编码工具页；使用 `encodeURIComponent` 和 `decodeURIComponent` 处理 URL 参数组件，支持示例、编码、解码、复制和清除
- 已完成：URL 解码失败时显示明确的百分号编码错误；不发起网络请求，输入、结果和操作状态通过路由 `KeepAlive` 保留
- 已验证：URL 示例编码、中文和特殊字符解码还原、非法编码提示、菜单切换状态保留、生产构建和现有 13 个测试通过
- 已完成：编码工具页增加文本 MD5 模式；Rust 新增 `calculate_text_md5` Command，按 UTF-8 字节计算 32 位小写十六进制摘要
- 已完成：MD5 模式提供示例、计算、复制和清除，明确提示 MD5 不是加密；空输入由 Rust 返回可展示错误
- 已验证：标准 `abc` 摘要、中文文本、空输入错误、复制提示、URL/MD5 模式切换和 debug `.app` 交互均通过
- 已完成：文件 MD5 使用 Rust `spawn_blocking` 和 1 MiB 缓冲区流式读取；通过 `md5-file-progress` 事件向前端报告进度，并返回摘要和文件大小
- 已完成：文件 MD5 模式提供文件选择、计算、进度、文件大小、复制和清除；文件只在本机读取，不上传
- 已验证：18 字节临时文件回读结果 `942a7d28876abb20171e3699acab5b65`、100% 进度、文件大小、复制和清理状态均通过真实 debug `.app`
- 已完成：编码菜单拆分为 URL 编码、MD5、Base64 三个独立入口和路由；URL 与 MD5 页面不再共用模式切换页
- 已完成：Base64 文本页面；支持 UTF-8 文本编码、解码、示例、复制、清除和非法内容提示，并明确 Base64 不是加密
- 已验证：三个侧栏入口、Base64 中文往返、非法 Base64 错误、现有 13 个测试、生产构建和格式检查通过
- 已完成：MD5 页面合并文本和文件两种模式，文件模式支持选择文件、计算、复制和清除
- 已完成：Base64 页面合并文本和文件两种模式；文件模式支持选择文件、保存 Base64 编码结果和保存解码结果
- 已完成：Rust 新增 Base64 文件编码/解码 Command，沿用 Tauri Dialog 的输入输出路径，不增加重复菜单
- 已完成：Base64 文件编码/解码改为 Rust 缓冲流式处理，避免一次性读取整个文件；编码输出和解码输出均直接写入用户选择的目标路径
- 已完成：M4 密码、MD5、URL 编码和 Base64 功能均已实现；最新流式 Base64 修改已通过提交 `88cbef9 BASE64大文件处理` 保存
- 已验证：临时 Rust 测试覆盖长度、四类必选字符、易混淆字符排除、非法选项和连续生成不同，验证后测试代码已删除
- 已验证：`cargo check --offline`、`cargo clippy --offline -- -D warnings`、`cargo fmt --check`、现有 13 个前端测试、`npm run build` 和 `git diff --check` 通过
- 已验证：最新 debug `.app` 中默认自动生成 6 条 20 位密码；长度与数量联动、仅数字生成、易混淆字符开关、无字符类型错误、重新生成、逐条复制和复制全部均符合规则
- 已验证：密码配置、生成结果和复制状态在菜单切换后保留；1200×800 窗口下双栏布局正常；验收结束后已恢复默认 20 位和全部字符类型配置
- 已完成：M4-1 密码生成器已通过提交 `69ef33a feat: add secure password generator` 推送到 `origin/main`
- 待提交前清理：当前菜单拆分、MD5/Base64 双模式页面、Base64 文件 Command 和进度文档尚未提交
- 已知状态：M0 尚待补充 ESLint、Prettier；Vue Router 5 与当前 Vite 6 存在 peer dependency 冲突
- 已知状态：M3-1 当前按数组索引比较，不识别对象数组元素移动；如后续确认需要移动检测，再评估 `jsondiffpatch` 的 `objectHash` 规则
- 交接基线：最新远程提交是 `c2fee6c 文本md5`；当前菜单拆分、Base64 文本页面和文件 MD5 页面接入状态应一起形成下一次提交并推送
- 下一步：完成 M4 最终回归和发布检查；随后进入 M5 文档转 Markdown
- 已完成：M5 环境初步评估；Python 3.10.7 和 `uv` 已安装，系统存在 LibreOffice，但仓库当前没有 MarkItDown
- 已完成：确认官方 MarkItDown 支持 PDF、Word 和命令行输入输出；PDF/DOCX 依赖可使用 `markitdown[pdf,docx]` 安装
- 已完成：新增 `sidecar/markitdown_runner.py`，定义单次 JSON 请求/响应协议，输入本地文件路径并返回 Markdown 或结构化错误；禁用插件，保持本地处理边界
- 已完成：文档转 Markdown 页面接入 DOCX/PDF 选择、sidecar 转换、Markdown 预览、复制和清除；页面提示扫描版 PDF、复杂排版和表格可能存在识别误差
- 已完成：文档页增加 Markdown 保存按钮；浏览器拖放当前提示使用原生选择按钮，Tauri 原生拖放事件留待 sidecar 打包阶段接入
- 已修复：Tauri 进程当前目录位于 `src-tauri` 时无法找到项目根目录 sidecar；Rust 现在兼容当前目录和上一级项目目录，并从项目根目录查找 `.venv`
- 已修复：项目虚拟环境不存在时不再回退到系统 Python；转换命令会提示在项目根目录创建 `.venv` 并安装 MarkItDown，避免出现模糊的 `No module named 'markitdown'`
- 已完成：用户手动安装 MarkItDown PDF/DOCX 依赖；DOCX 临时样本转换成功，标题和正文结构保留；PDF 临时样本转换成功，但当前字体环境下中文出现乱码
- 已完成：临时虚拟环境、DOCX/PDF 样本和转换结果已清理；sidecar 仍保持单次 JSON 请求/响应协议
- 下一步：在真实 Tauri 窗口验证 DOCX/PDF 选择与转换，再处理 sidecar 打包和跨平台路径

## 8. 当前任务验收标准

### 已完成：M1-1A 路由和占位页清理

- [x] 将 `src/router/index.ts` 中仅用于组织 URL、没有父组件的 JSON 和文档嵌套路由改为六条扁平工具路由
- [x] 保留 `/` 到 `/json/format` 的重定向，并继续使用 `createWebHashHistory()`
- [x] 将路由 meta 分组中的 `json` 改为 `JSON`，`document` 改为 `文档`
- [x] 删除 `ToolPlaceholderView.vue` 中额外的 `Tool Placeholder` 标题、无意义外层 `div` 和空 style
- [x] `ToolPlaceholderView.vue` 只显示 `route.meta.group` 和 `route.meta.title`；meta 总是存在，无需可选链
- [x] `App.vue` 只保留 `<RouterView />`，删除空的 script 和 style 区块
- [x] 整理 `src/main.ts` 导入顺序，并删除多余空白行
- [x] 执行 `npm run build`，构建成功
- [x] 执行 `git diff --check`，没有输出
- [x] 执行 `npm run tauri dev`，默认页只显示 `JSON` 和 `JSON 格式化`

### 当前任务：M1-1B 侧栏与统一页面结构

- 建立固定尺寸的桌面工具侧栏，覆盖第一期全部工具入口
- 当前路由在侧栏中应有清晰选中状态
- 建立统一页面标题和内容区域，不使用营销式首页
- 页面壳不因标题、图标或路由变化产生位移

### 已完成：M1-1B-3 侧栏当前路由选中状态

- [x] 使用 `RouterLink` 的 `exact-active-class` 提供当前路由选中状态
- [x] 不复制维护第二份当前路径状态
- [x] 验收刷新、直接访问 Hash 路由和点击导航后的选中状态

### 已完成：M1-1B-4 统一页面标题和内容区域

- [x] 页面背景覆盖主内容区的可视高度
- [x] 页面内边距在普通桌面和较宽窗口下保持合理
- [x] 标题区域和工具内容区域有稳定的垂直间距
- [x] 内容区域具备稳定的最小高度，不因占位内容为空而塌陷
- [x] `npm run build` 和 `git diff --check` 均通过

### 已完成：M2-1 JSON 格式化核心逻辑、单元测试与页面接入

- [x] JSON 处理先拆成不依赖 Vue 的纯函数
- [x] 格式化成功时返回缩进后的 JSON
- [x] 格式化失败时返回可显示的错误信息，不吞掉异常
- [x] 补齐 Vitest 测试：对象、数组、压缩 JSON、非法 JSON 和空输入
- [x] 测试成功结果中的 `value`，不要只测试 `ok`
- [x] 测试通过后把函数接入 JSON 格式化页面
- [x] 页面提供 JSON 输入、格式化按钮和只读输出
- [x] 格式化失败时清空旧输出并显示错误提示
- [x] 本地验证有效 JSON、非法 JSON 和空输入三条交互路径
- [x] `npm test`、`npm run build` 和 `git diff --check` 均通过

### 已完成：M2-2 JSON 压缩、CodeMirror 编辑器与复制

- [x] 新增不依赖 Vue 的 JSON 压缩纯函数，保持与 `formatJson` 一致的结果类型和空输入行为
- [x] 覆盖对象、数组、已压缩 JSON、非法 JSON 和空输入测试
- [x] 格式化与压缩结果在同一个编辑器中展示
- [x] 顶部工具栏提供格式化、压缩和复制按钮，编辑区尺寸变化不移动按钮
- [x] 顶部工具栏提供清除按钮，清除后编辑器重新获得焦点
- [x] 四个操作按钮均带 Lucide 小图标，并使用不同的语义颜色
- [x] 使用 CodeMirror 6 提供 JSON 语法高亮、行号和折叠槽
- [x] 格式化后的对象与数组支持收起和展开
- [x] 使用 `KeepAlive` 保留菜单切换前的 JSON 内容、折叠状态和撤销历史
- [x] 复制使用 Tauri Clipboard 插件，能力配置只允许写文本
- [x] 默认窗口使用 1200×800，最小尺寸使用 900×640
- [x] 工具页面减少四周 padding 并扩大内容占比
- [x] `npm test`、`npm run build`、`cargo check`、`git diff --check` 和 `npm run tauri dev` 通过
- [x] 在真实 debug `.app` 中点击复制按钮，确认显示成功提示

### 已完成：M2-3 JSON 语法校验与错误位置

- [x] 将解析错误转换为稳定、可展示的原因信息
- [x] 提取错误字符位置，并显示行号与列号
- [x] 使用 JSON 语法树作为不同运行时错误信息的定位兜底
- [x] 在 CodeMirror 中实时显示 lint 标记
- [x] 格式化或压缩失败时滚动并定位错误字符
- [x] 修正内容后清除错误提示和标记
- [x] 为合法 JSON、多行非法 JSON 和空输入补充校验测试
- [x] `npm test` 13 个用例、`npm run build` 和 `git diff --check` 通过

### 已完成：M2-4 示例 JSON 与文件导入导出

- [x] 增加一键填充示例 JSON，并复用当前单编辑器和状态清理逻辑
- [x] 通过 Tauri 文件选择能力读取本地 JSON 文件
- [x] 将当前编辑器内容保存为 JSON 文件
- [x] 导出前校验当前内容，避免将非法内容保存为 `.json`
- [x] 保持所有内容在本机处理，并为取消选择、读取失败和保存失败提供提示
- [x] 只授予 Dialog 打开/保存与 FS 文本读写权限，不开放目录遍历、删除或重命名能力
- [x] 真实 Tauri 应用中验证导入、导出、取消操作和空内容阻止导出
- [x] 验证导出文件与导入源逐字节一致，并清理临时测试文件
- [x] `npm test`、`npm run build`、`cargo check --offline`、`git diff --check` 和 debug `.app` 构建通过

### 已完成：M3-1 JSON 结构化对比基础闭环

- [x] 使用成熟的 `microdiff` 库比较解析后的 JSON 结构，而不是比较原始字符串
- [x] 将第三方结果映射为应用自己的新增、删除和修改类型
- [x] 为对象字段和数组索引生成可读 JSONPath
- [x] 左右输入使用 CodeMirror 6，并保留语法高亮、折叠和菜单切换状态
- [x] 差异列表显示路径、旧值和新值，并用绿色、红色、橙色区分变更类型
- [x] 任一侧非法 JSON 时显示对应行列错误，不生成误导性的差异结果
- [x] 对象 key 顺序不同时，只要结构和值一致就显示 0 处差异
- [x] 页面和 CodeMirror 依赖均按路由懒加载
- [x] 现有 13 个测试、`npm run build` 和 `git diff --check` 通过

### 已完成：M3-2 编辑器差异定位、高亮与可拖动布局

- [x] 点击差异结果后，左右编辑器滚动到对应字段
- [x] 对新增、删除和修改范围使用与结果列表一致的颜色
- [x] 当前选中的差异卡片使用蓝色 ring 标识
- [x] 使用 JSON 语法树定位对象属性与数组元素，避免重复值导致字符串搜索误定位
- [x] 左右编辑器中间提供竖向拖动图标，可左右调整宽度
- [x] 差异结果上方提供横向拖动图标，可上下调整高度
- [x] 左右宽度限制为 25%～75%，结果区高度限制为 20%～60%
- [x] 两个分隔器支持键盘方向键调整并提供 ARIA 数值
- [x] 拖动和菜单切换后编辑器内容、高亮及面板比例保持正常
- [x] 增加“对齐”按钮，将左右共同 key 调整为一致顺序
- [x] 左右独有 key 分别放在各自对象末尾，不插入占位字段
- [x] 递归对齐嵌套对象和同索引数组对象，不改变数组元素顺序
- [x] 任一侧 JSON 非法时显示对应错误并保留原始输入
- [x] 现有 13 个测试、`npm run build` 和 `git diff --check` 通过

### 已完成：M3-3 JSON 转 Excel 嵌套展平规则与纯函数

- [x] 顶层对象映射为一行，顶层数组每个元素映射为一行
- [x] 顶层基本类型和数组基本类型使用 `value` 列
- [x] 嵌套对象递归展开，普通 key 使用点号路径，特殊 key 使用括号路径
- [x] 嵌套数组保存为紧凑 JSON 字符串，不展开为重复行
- [x] 数字和布尔值保留原类型，null 写为文本 `null`，缺失字段留空
- [x] 空对象、空数组分别保存为 `{}`、`[]`；顶层空对象和空数组返回无数据错误
- [x] 多行字段按照第一次出现的顺序生成列
- [x] 使用无原型对象承载行数据，安全处理 `__proto__` 等合法 key
- [x] 使用临时脚本验证规则并在完成后删除，未保留测试文件
- [x] 现有 13 个测试、`npm run build` 和 `git diff --check` 通过

### 已完成：M3-4 SheetJS 与 JSON 转 Excel 页面

- [x] 使用 SheetJS 0.20.3 将展平结果转换为工作表和 XLSX
- [x] 页面提供 JSON 输入、示例、清除、表格预览和保存
- [x] 预览最多显示 50 行，保存包含全部行
- [x] 保留数字和布尔值类型，缺失字段生成空单元格
- [x] 自动设置 10～50 字符范围内的合理列宽
- [x] 保存继续使用 Tauri Dialog 与 FS 插件，只增加二进制写文件权限
- [x] 为无数据、非法 JSON、取消保存和保存失败提供明确提示
- [x] 页面内容和预览在菜单切换后保留，编辑内容变化时旧预览自动清除
- [x] JSON 编辑器与 Excel 预览之间提供可拖动分隔器，并支持键盘调整与 ARIA 数值
- [x] 自动识别数组字段并提供独立 Sheet 多选项
- [x] 支持选择多个主要字段，在数组子 Sheet 的每一行重复展示
- [x] 拆分后的数组列从主 Sheet 移除，空数组不创建空 Sheet
- [x] 数组对象按列展平，基本类型数组使用 `value` 列，父子同名字段不会互相覆盖
- [x] Sheet 名使用字段 key，并处理非法字符、长度限制和重名
- [x] 主 Sheet 与子 Sheet 均可通过标签切换预览，最终保存包含全部工作表和全部行
- [x] 仅在同名数组字段出现在后代节点时提供递归平铺选项
- [x] 每个末级节点生成一行，并按层级顺序保留路径上的全部父节点数据
- [x] 不同深度分支允许后续层级留空，空或缺失递归数组的节点作为末级节点
- [x] 平铺模式只生成 `JSON Data`，递归数组列不再保留为 JSON 字符串
- [x] 非递归 JSON 和节点中的其他数组继续使用既有转换规则
- [x] 真实 debug `.app` 保存 XLSX，并通过 SheetJS 回读验证工作表、数据和列宽
- [x] 现有 13 个测试、`npm run build`、`cargo check --offline`、`git diff --check` 和 debug `.app` 构建通过

### 当前任务：M4-1 安全密码生成器

- [x] 密码长度限制为 4～128，默认 20
- [x] 生成数量限制为 1～20，默认 6
- [x] 支持大写字母、小写字母、数字和特殊字符，并保证每种已选类型至少出现一次
- [x] 默认排除 `0 O o 1 I l |` 易混淆字符
- [x] 使用 Rust 和操作系统安全随机源，不使用 `Math.random()`
- [x] 使用无偏索引采样和安全打乱，避免取模偏差及固定字符类型位置
- [x] 页面提供长度输入、滑块、字符类型、排除选项、生成、复制和密码强度
- [x] 页面支持一次生成多条密码，提供生成数量、逐条复制和复制全部
- [x] 结果内容区域顶部对齐并独立滚动，窗口放大时不产生额外大段空白
- [x] 默认进入页面自动生成，设置变化后重新生成，菜单切换保留当前状态
- [x] 临时 Rust 测试验证生成规则后删除，没有保留测试代码
- [x] `cargo check`、Clippy、rustfmt、现有前端测试、生产构建和 `git diff --check` 通过
- [x] 在真实 Tauri 窗口验证自动生成、设置联动、非法配置、复制和状态保留

### 已完成：M4-2 URL 编码、解码与文本 MD5

- [x] 使用 `encodeURIComponent` 实现 URL 参数组件编码
- [x] 使用 `decodeURIComponent` 实现 URL 参数组件解码
- [x] 支持中文、空格、特殊字符和路径查询字符串
- [x] 非法百分号编码显示明确错误，不吞掉异常
- [x] 页面提供示例、编码、解码、复制和清除操作
- [x] 页面切换后保留输入、结果和操作状态
- [x] 浏览器交互、`npm test`、`npm run build` 和 `git diff --check` 通过
- [x] 文本 MD5 模式使用 Rust Command 计算 UTF-8 字节摘要
- [x] MD5 提供示例、计算、复制、清除和空输入错误
- [x] 明确说明 MD5 不是加密，不能用于存储密码
- [x] 标准摘要、中文文本和真实 Tauri IPC 交互验收通过

### 当前任务：M4-3 Base64 文本与文件编解码

- [x] 编码菜单拆分为 URL 编码、MD5、Base64 三个独立入口
- [x] Base64 文本 UTF-8 编码和解码
- [x] 提供示例、编码、解码、复制、清除和错误提示
- [x] 明确说明 Base64 是编码方式，不是加密
- [x] Base64 文本中文往返和非法输入验证通过
- [x] MD5 页面包含文本和文件两个模式
- [x] Base64 页面包含文本和文件两个模式
- [x] 文件 Base64 支持选择输入文件、保存编码结果和保存解码结果
- [x] 文件 Base64 使用 Rust 缓冲流式读写，适合大文件边界
- [x] 文件 MD5 使用 Tauri Dialog 选择文件，并由 Rust 流式读取计算
- [x] 文件计算通过事件显示进度，并展示文件大小
- [x] 文件 MD5 提供复制、清除、取消选择和读取失败提示
- [x] 空文件和大文件边界继续由流式实现覆盖
- [x] 真实 debug `.app` 文件选择、摘要回读、进度和复制验收通过

### 已完成：M1-1B-1 页面壳外层结构

- [x] 根容器使用 `flex h-screen overflow-hidden`
- [x] 侧栏使用固定宽度、禁止收缩和纵向布局
- [x] 主内容区使用 `min-w-0 flex-1 overflow-auto`

### 已完成：M1-1B-2 侧栏导航数据与分组

- [x] 显示 TangTool 标题
- [x] 建立 JSON、文档、安全、编码四个分组
- [x] 覆盖 JSON 格式化、JSON 对比、JSON 转 Excel、文档转 Markdown、密码生成器和 URL 编码六个入口
- [x] 使用已安装的 Lucide 图标和动态组件渲染图标
- [x] 使用 `RouterLink` 让图标和文字组成完整可点击区域
- [x] 为分组和菜单项提供稳定的 `:key`
- [x] 本地验证六个入口均能切换到正确路由和页面标题
- [x] 执行 `npm run build`，构建成功
- [x] 执行 `git diff --check`，没有输出
- [ ] 提交前补齐 `src/App.vue` 文件末尾换行并统一菜单数据字符串引号

### 已完成：M1-1B-3 侧栏当前路由选中状态

- 为当前路由提供明显但克制的选中背景和文字/图标颜色
- 使用 Vue Router 的路由状态或 `RouterLink` active class，不复制维护第二份当前路径状态
- 确保页面刷新、直接访问 Hash 路由和点击导航后选中状态一致

### 已完成：M1-1B-4 统一页面标题和内容区域

- 页面背景覆盖主内容区的可视高度
- 页面内边距在普通桌面和较宽窗口下保持合理
- 标题区域和工具内容区域有稳定的垂直间距
- 内容区域具备稳定的最小高度，不因占位内容为空而塌陷
- `npm run build` 和 `git diff --check` 均通过

## 9. 关键技术决定

- 2026-08-30：选择 Vue 3 而不是 React，因为开发者已有 Vue 经验，且 Vue 生态足以满足桌面工具需求。
- 2026-08-30：选择 Tauri 2，以较小安装体积获得 Windows/macOS 桌面能力，并把它作为 Rust 和跨平台桌面开发的学习主线。
- 2026-08-30：第一期坚持本地处理，不设计云端账户和文件上传。
- 2026-08-30：采用 GitHub Actions 分别在 Windows 和 macOS runner 构建；macOS 安装包不能只依靠 Windows 本机完成最终验证。
- 2026-08-30：应用唯一标识使用 `com.github.liuxiangyu2026.tangtool`。
- 2026-08-30：当前脚手架保持 Vite 6，并固定 Vue Router 4；Vue Router 5 要求 Vite 7.3 或 8，不使用 `--force` 绕过 peer dependency 检查。
- 2026-08-31：没有父组件、共享布局或共享守卫需求的工具路由使用扁平配置；URL 继续表达功能分组，显示分组由路由 meta 维护。
- 2026-09-10：工具页面通过路由级 `KeepAlive` 保存会话期临时状态，并以路由名区分缓存实例；状态不写入磁盘，刷新或关闭应用后清空。
- 2026-09-10：JSON 文件导入导出使用 Tauri Dialog 返回用户明确选择的路径，由 FS 插件读写；只开放文本读写命令，路径 scope 仅在当前应用会话中生效。
- 2026-09-10：M3-1 使用 `microdiff` 生成结构化差异，并在应用层转换为稳定类型；解析后的 JSON 不存在循环引用，因此关闭 `cyclesFix`。数组暂按索引比较，不在业务规则未确认前推断元素身份或移动。
- 2026-09-10：M3-2 使用 Lezer JSON 语法树按结构化路径定位编辑器范围，不使用字符串搜索；布局分隔器使用 Pointer Events 和百分比边界，并保留键盘调整能力。
- 2026-09-10：JSON key 对齐以左侧共同 key 顺序为基准，左右独有 key 各自置后；只调整对象属性顺序，不补字段、不改变数组元素顺序。
- 2026-09-10：JSON 转 Excel 以顶层数组决定行、嵌套对象决定列；嵌套数组不做笛卡尔展开，保留为紧凑 JSON 字符串；null 使用文本 `null` 与缺失字段空单元格区分。
- 2026-09-10：SheetJS 使用官方 CDN 发布的 0.20.3，不使用 npm 公共仓库中过时的 0.18.5；前端生成 XLSX `Uint8Array`，再通过 Tauri FS 写入用户选择的路径。
- 2026-09-10：数组字段默认仍以紧凑 JSON 留在主 Sheet；用户选择拆分后才从主 Sheet 移除并生成子 Sheet。子 Sheet 可重复用户选择的非数组主要字段，空数组不创建工作表，Sheet 名按 Excel 规则自动清洗并保证唯一。
- 2026-09-10：树形递归 JSON 以“数组元素中再次出现同名数组字段”为识别条件；用户启用平铺后，每条根到末级节点路径生成一行，以层级前缀保留全部祖先数据，并用单个 `JSON Data` Sheet 替代逐层子 Sheet。
- 2026-09-11：密码生成由 Rust Tauri Command 负责，使用 `getrandom` 0.4.3 直接读取操作系统安全随机源；前端只传递生成配置和显示结果。字符选择使用拒绝采样消除取模偏差，必选字符加入后通过 Fisher–Yates 打乱位置；一次命令返回 1～20 条独立密码。
- 2026-09-11：URL 编码使用 `encodeURIComponent` / `decodeURIComponent` 处理参数组件，不使用 `encodeURI`，也不发起网络请求；解码错误在前端转换为可展示提示。
- 2026-09-11：文本 MD5 使用 RustCrypto `md-5` 0.11.0 的 `Md5::digest` 计算 UTF-8 字节摘要；前端通过 Tauri Command 调用，页面明确标注 MD5 仅用于兼容性摘要，不是加密。
- 2026-09-11：文件 MD5 由 Rust `spawn_blocking` 执行，使用 1 MiB 缓冲区流式读取，并通过 Tauri 事件发送已处理字节数；前端不读取文件内容，只传递用户通过 Dialog 选择的路径。
- 2026-09-11：编码菜单拆分为独立 URL、MD5、Base64 路由；Base64 文本在前端按 UTF-8 字节使用 `btoa` / `atob` 转换，文件 Base64 延后使用 Rust 流式处理。

## 10. 待确认事项

- 应用最终图标
- 第一版支持的界面语言
- macOS 真机测试条件，以及后续是否进行 Apple 签名和公证

## 11. 换机接续说明（macOS）

### Windows 结束前

2026-08-30 的换机交接提交应包含：

- 修改：`AGENTS.md`、`package.json`、`package-lock.json`、`src/App.vue`、`src/main.ts`、`vite.config.ts`
- 新增：`src/router/`、`src/views/`、`src/styles.css`

在 Windows 上提交并执行 `git push` 后再换机，否则 macOS 无法拉取这些内容。当前代码已经能构建和运行，已知的结构与格式问题保留到下一次按第 8 节修复。macOS 拉取后如果能读到本节，说明交接文档已经进入仓库；仍需用 `git status` 和 `git log -1 --oneline` 确认分支状态。

### macOS 首次准备

安装 Xcode Command Line Tools、Node.js LTS 和 Rust stable：

```bash
xcode-select --install
node --version
npm --version
rustc --version
cargo --version
```

拉取并恢复项目：

```bash
git clone https://github.com/liuxiangyu2026/TangTool.git
cd TangTool
npm install
npm run build
npm run tauri dev
```

如果仓库已经存在，则在工作区干净的前提下执行 `git pull --ff-only`。首次 Rust 编译下载和编译 crate 会比较慢。启动成功后先阅读本文档第 7、8 节，从路由和占位页清理继续，不要直接跳到侧栏开发。

### 最新交接状态（2026-09-11）

- macOS 已完成 Rust stable、Tauri 原生编译和本地开发页验证；当前项目代码可以通过 `npm run tauri dev` 启动桌面窗口，前端修改会由 Vite HMR 自动刷新。
- 当前最新远端提交为 `44db08b base64文本编码`；菜单拆分、MD5/Base64 双模式页面、Base64 文件 Command 和本文档更新尚未形成新提交，具体以 `git status --short --branch` 和 `git log -1 --oneline` 为准。
- 当前 `npm test` 有 13 个测试通过；M4-1 已通过 Rust 临时规则测试、Clippy、rustfmt、Rust 检查、前端生产构建和 debug `.app` 构建，临时测试已删除。
- 最新 debug `.app` 已完成默认生成 6 条、数量改为 3 条、长度与选项联动、无字符类型错误、易混淆字符开关、逐条复制、复制全部、菜单切换状态保留和窗口布局验收；URL 编码和文本 MD5 已完成浏览器/桌面交互验收；结束后已恢复默认配置。
- 换到 Windows 前，必须在 macOS 完成构建验收、提交并执行 `git push`；否则 Windows 只能看到旧的 `origin/main`，无法获得本次页面实现和交接进度。

Windows 端接续命令：

```bash
git status --short --branch
git log -1 --oneline
git pull --ff-only
npm install
npm run build
npm run tauri dev
```

下次继续时先阅读本文档第 7、8 节：复查、提交并推送文件 MD5 修改；随后进入 Base64 编解码。
