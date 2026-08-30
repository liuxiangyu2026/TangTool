# TangTool 项目协作说明

## 1. 项目目标

TangTool 是一款面向 Windows 和 macOS 的本地桌面工具箱。第一期强调离线处理、隐私保护、操作直接和可持续扩展。

项目同时承担学习目标：开发者已经熟悉 Vue 3、TypeScript、Vite、Pinia 和 Vue Router；开发过程需要通过小步任务、讲解、实践和复盘，逐步掌握 Tauri、Rust、桌面文件能力、文档转换、跨平台构建和 GitHub Actions。

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
- [ ] 完成第一个 Vue 调用 Rust Command 的练习
- [ ] 学习 Tauri 权限、配置和错误返回
- [ ] 建立通用复制、文件选择、保存和提示能力

### M2：JSON 基础工具

- [ ] JSON 格式化、压缩、校验和错误定位
- [ ] 增加编辑器、示例、清空、复制和文件导入导出
- [ ] 添加核心逻辑单元测试

### M3：JSON 对比和 JSON 转 Excel

- [ ] 使用成熟 diff 库实现结构化 JSON 对比
- [ ] 设计嵌套 JSON 展平规则
- [ ] 使用 SheetJS 生成并保存 XLSX
- [ ] 覆盖空数组、混合类型、深层嵌套等边界情况

### M4：密码、哈希与 Base64

- [ ] 使用安全随机源实现密码生成器
- [ ] 实现文本和文件 MD5
- [ ] 实现文本和文件 Base64 编解码
- [ ] 对大文件采用流式处理，避免界面卡顿

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

- 当前里程碑：M1 应用骨架和第一个前后端调用
- 当前任务：M1-1A 清理初版路由和占位页，然后开始侧栏与统一页面结构
- 已完成：M0-1 开发环境；GitHub CLI 登录；Node.js 24.19.0；npm 11.17.0；Rust/Cargo 1.98.0；Git 2.55.0；MSVC Build Tools；Windows SDK 10.0.26100.0；WebView2 152.0.4191.53
- 已完成：官方脚手架、命名统一、依赖安装、Windows 启动、Vue 到 Rust 的调用链、生产构建；npm 报告 0 个漏洞；已精确许可 `esbuild@0.25.12` 安装脚本
- 已完成：Git 仓库和 `main` 分支；首次提交 `d428427`；公开仓库 `https://github.com/liuxiangyu2026/TangTool`
- 已完成：安装 Pinia 4.0.3、Vue Router 4.6.4、Lucide Vue Next 1.0.0、Tailwind CSS 4.3.3
- 已完成：Tailwind 4 已通过 `@tailwindcss/vite` 接入；`src/styles.css` 已由 `src/main.ts` 导入；生产构建成功
- 已完成：初版 Hash 路由已建立，`/` 可重定向到 `/json/format`，Windows Tauri 窗口能显示 JSON 格式化占位页
- 已知状态：M0 尚待补充 ESLint、Prettier 和基础测试；Vue Router 5 与当前 Vite 6 存在 peer dependency 冲突
- 交接基线：首次提交是 `d428427`；当前 M1 修改应与本文档一起形成下一次提交并推送，macOS 端以“包含本文交接说明”的最新 `origin/main` 为准
- 下一步：按第 8 节清理当前实现；本步骤已明确暂停，尚未修改相关代码

## 8. 当前任务验收标准

### 下一步必须先完成的代码清理

- 将 `src/router/index.ts` 中仅用于组织 URL、没有父组件的 JSON 和文档嵌套路由改为六条扁平工具路由
- 保留 `/` 到 `/json/format` 的重定向，并继续使用 `createWebHashHistory()`
- 将路由 meta 分组中的 `json` 改为 `JSON`，`document` 改为 `文档`
- 删除 `ToolPlaceholderView.vue` 中额外的 `Tool Placeholder` 标题、无意义外层 `div` 和空 style
- `ToolPlaceholderView.vue` 只显示 `route.meta.group` 和 `route.meta.title`；meta 总是存在，无需可选链
- `App.vue` 只保留 `<RouterView />`，删除空的 script 和 style 区块
- 整理 `src/main.ts` 导入顺序，并删除第 11 行的多余空白行
- 执行 `npm run build`，必须成功
- 执行 `git diff --check`，必须没有输出
- 执行 `npm run tauri dev`，默认页应只显示 `JSON` 和 `JSON 格式化`

### 清理完成后的后续任务

- 建立固定尺寸的桌面工具侧栏，覆盖第一期全部工具入口
- 当前路由在侧栏中应有清晰选中状态
- 建立统一页面标题和内容区域，不使用营销式首页
- 页面壳不因标题、图标或路由变化产生位移

## 9. 关键技术决定

- 2026-08-30：选择 Vue 3 而不是 React，因为开发者已有 Vue 经验，且 Vue 生态足以满足桌面工具需求。
- 2026-08-30：选择 Tauri 2，以较小安装体积获得 Windows/macOS 桌面能力，并把它作为 Rust 和跨平台桌面开发的学习主线。
- 2026-08-30：第一期坚持本地处理，不设计云端账户和文件上传。
- 2026-08-30：采用 GitHub Actions 分别在 Windows 和 macOS runner 构建；macOS 安装包不能只依靠 Windows 本机完成最终验证。
- 2026-08-30：应用唯一标识使用 `com.github.liuxiangyu2026.tangtool`。
- 2026-08-30：当前脚手架保持 Vite 6，并固定 Vue Router 4；Vue Router 5 要求 Vite 7.3 或 8，不使用 `--force` 绕过 peer dependency 检查。

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
