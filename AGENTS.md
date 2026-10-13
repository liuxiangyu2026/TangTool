# TangTool 协作与接续

> 更新于 2026-10-13。新会话先读本文，再查看 Git 状态和相关代码；无需重读整段历史对话。只维护当前规则与状态，历史细节查专题文档和 Git。

## 1. 当前状态

- Windows / macOS 本地桌面工具箱，支持简体中文与英文，共 **24 个工具**。
- **v0.1.5 Preview 已发布，官网已部署**；三平台构建、更新签名、14份附件匿名公开下载校验通过，v0.1.2/v0.1.3/v0.1.4保留。不要从已完成功能或发布流程重新开始。
- 官网：https://liuxiangyu2026.github.io/TangTool/
- 功能目录以 `src/data/toolCatalog.ts` 和 README 为准；发布来源、运行编号、摘要与证据见 [v0.1.5交付记录](docs/build-checklist-0.1.5.md)。发布标签绑定源码提交，后续交付文档提交不移动标签。
- v0.1.5新增Logo / 图标制作、JSON/YAML互转、文本脱敏；扩展JSONPath、正则替换、50张批量图片转换与压缩、单张图片拾色、Unix/秒级/Quartz/Spring/宏Cron。图片支持JPEG/PNG/WebP/BMP/ICO/静态GIF，无需额外插件，不支持HEIC；单图拾色保留自动/手动颜色，初始按宽高适应预览（最高400px），支持缩放、可见区域绘制及顶部工具栏下整体滚动，Web安全色至少三整行。详见[图片工具](docs/image-tools.md)、[Cron格式](docs/cron-formats.md)、[六项扩展](docs/productivity-tools.md)。
- 同步修复文字单行/末行选中背景，统一工具栏文本框/数字框/下拉框高度，按分组整理目录和路由。前端/官网构建、原13项测试、Rust检查与浏览器功能验收通过；临时验证代码已清理，没有新增永久测试。
- 当前可继续接收新需求。未完成的真机验收见第5节，不能把构建成功当作全部验收通过。

## 2. 协作约定

- 用户熟悉 Vue/TypeScript，正在学习 Tauri/Rust/Tailwind。开始简述目标，完成后解释关键点、验证并更新必要的接续记录；Tailwind变更适当解释布局类名。
- 实质歧义先问；低风险细节说明假设后继续。缺少业务信息的位置写具体 TODO。
- 代码清晰易读，不压缩复杂逻辑，不把多条语句挤在一行；Vue/HTML属性长度合理时放同一行。
- 不过度拆方法，尤其不要抽出只有一行且仅调用一次的方法；注释解释业务与边界，Java字段采用多行文档注释。
- 未经明确要求，不新增永久单元测试或相关测试代码；临时验证后清理，保留已有测试基线。
- 不擅自移动按钮、放大按钮或改用户布局；使用紧凑按钮和Lucide图标。
- 保留用户改动、设置和工具输入；**不得删除或跨机器复制 `.venv`、`.venv-sidecar`**。
- 不提交/打印凭据、私钥或用户文档。提交、推送、发布按用户授权执行，换机交接时确认所需改动已推送。

## 3. 技术与代码入口

- Tauri 2 + Rust；Vue 3 + TypeScript + Vite 6；Pinia、Vue Router 4、Tailwind 4、CodeMirror 6。开发/CI推荐Node22。
- SheetJS使用官方源0.20.3，不换成npm旧版0.18.5；Vue Router 5与当前Vite不兼容，不用 `--force` 绕过。
- Markdown组件使用MarkItDown/PyInstaller及 `sidecar/requirements.lock`；PDF处理使用本地PDF.js、docx、JSZip。其他版本以锁文件为准。
- 工具页面：`src/views/`；算法：`src/utils/`；菜单/目录：`src/data/tools.ts`、`toolCatalog.ts`；路由：`src/router/index.ts`。
- 公共布局/编辑器：`src/components/`；偏好：`src/stores/preferences.ts`；原生能力：`src-tauri/src/`；官网：`website/`。
- 应用标识 `com.github.liuxiangyu2026.tangtool`，默认1200×800、最小900×640；B模块T品牌图标已用于主程序与安装包。

## 4. 必须保留的产品规则

- **本地处理**：不上传工具内容。路由懒加载+按路由名KeepAlive，切菜单保留输入，关闭/刷新后清空；仅偏好和布局写入 `tangtool.preferences.v1`。
- **双语**：桌面/官网各自记住语言，切换不重建工具、不翻译用户数据。新增文案同步英文；Rust错误使用AppError。详见 [本地化约定](docs/localization.md)。
- **菜单/设置**：工具目录和路由按分组连续排列，JSON/YAML互转放在JSON/表格组末尾；文档后为文本组；URL、MD5、Base64在安全组，无编码组。侧栏可折叠、分组收起、只看收藏；侧栏与首页筛选开关独立。已有主题、字号、收藏、窗口/分栏记忆、编辑器和导出偏好应兼容保留。
- **按钮位置**：JSON对比两侧及JSON转Excel的“JSON数据”标题栏右侧，顺序为 **转义→格式化→全部折叠→全部展开**，转义/格式化同样紧凑。JSON格式化页转义在“压缩”后，Excel/CSV转JSON页在“转换”后。
- **JSON语义**：转义只对ASCII双引号前增减一个反斜杠，多层逐次去除，不解析JSON。折叠只改变显示；转Excel格式化沿用缩进并保留预览/分表选项，普通编辑或转义使旧预览失效。
- **JSON对比**：全部路径红绿值对照、虚拟滚动、点击定位并展开；只对比key递归比较路径，忽略叶子值。数组按索引，不识别移动；对齐依左侧共同key顺序，独有key各自放末尾，不补字段、不重排数组。
- **表格转换**：JSON转Excel支持数组独立Sheet及重复主要字段；树形递归平铺按每条根到叶路径一行，保留所有父级，不做笛卡尔展开。预览50行、导出全部；null为文本null、缺失留空。反向转换不执行公式或宏。
- **文档**：Markdown仅DOCX/PDF，最多10个，追加去重、独立删除，清除需确认且不删源文件；独立组件1.0.0按需安装。DOCX→PDF另需LibreOffice；PDF→DOCX有文字/页面图片模式，不含OCR、复杂排版有局限。PDF转图片支持指定尺寸等比留白及分页ZIP，详见 [文档转换](docs/document-conversion.md)。
- **资源/安全**：文件对话框授权+最小FS权限；保留同文件保护、临时写入/同步提交、Markdown净化、队列锁定、迟到响应防护、Worker超时和CSP。优化内存时释放可重建的显示资源，不以清空输入代替优化。
- **体验**：提示距顶部约8px、2秒消失、长文可滚动且不挤布局；统一Grip分栏手柄并支持键盘；公共单行文本框、数字框和下拉框统一2rem高度，随界面字号缩放，条件显隐不因原生控件高度差撑高工具栏；首页内容最大1200px。侧栏滚动条4px，折叠后Logo在展开按钮上方。
- **官网**：7组14张中英文真实截图，1280×720无损WebP，不旋转/透视/拉伸；4.5秒轮播、仅玻璃圆点、点击放大并再次点击/Escape关闭。用户已授权用独立Playwright浏览器截图和验收，使用演示数据，不读取个人浏览器资料。
- 其他已定规则（密码范围、MD5四种结果、文本实时处理、216安全色等）以目标工具代码与 [版本说明](docs/release-notes-0.1.5.md) 为准，修改前先读对应实现。

## 5. 尚待验收与暂缓事项

- LibreOffice真实DOCX→PDF转换、中文/表格分页和超时退出；上次发布时本机未安装，开始验收前重新检查。
- Windows/macOS原生文件操作、组件安装/重新检测、权限、图标、升级卸载及完整应用内更新/重启。已有浏览器、替身引擎、CI验证不等于这些真机检查已通过。
- 已确认暂不做使用统计；30天试用/购买Key仅讨论，未实现收费、授权或账户。
- 候选功能不是待执行指令：文档拖放、SQL格式化、JWT查看、SHA文件摘要；按用户新需求决定。
- 验证范围与历史证据见 [发布检查](docs/release-checks.md)，不要把历史审计结果说成当前没有漏洞。

## 6. 发布与更新

- 用户接受未签名/未公证Preview，不反复要求购买证书。**更新包签名不等于系统代码签名/公证**。
- 启动及每6小时检查更新；只有用户点击“更新”并确认后才下载、验签、安装/重启。默认包含预发布，可关闭自动检查。旧v0.1.3非重建包需手动安装新版一次。
- 后续版本必须递增，不默认覆盖公开安装包或移动旧标签。主程序、Markdown组件分开交付；组件配置在 `sidecar/runtime.json`，主安装器仅检查WebView2，不前置检查文档组件。
- **沿用现有更新密钥，不重新生成、输出或删除**。GitHub Secret为 `TAURI_SIGNING_PRIVATE_KEY`；本机备份位置、权限及打包方法见 [更新与密钥保管](docs/updater.md)。
- 已授权的发布工作流权限不需重复申请：从main触发 `desktop-build.yml`；成功后创建对应源码提交的预发布草稿，运行 `publish-release.yml`，填写 `run_id/commit/release_id`。验签、来源及公开下载回读通过后，运行 `pages.yml` 并核对官网版本/链接/截图。
- 具体运行编号、包摘要留在专题交付文档，不在本文堆积历史日志。README只保留产品介绍、工具与官网链接。

## 7. 接续与常用命令

先运行 `git status --short --branch`、`git log -1 --oneline`，以实际工作区为准；确认分支且干净后才 `git pull --ff-only`。

- 安装/启动：`npm ci`、`npm run tauri dev`；网页布局预览：`npm run dev`（不能验收原生文件能力）。
- 检查：`npm run build`、现有 `npm test`、`git diff --check`；Rust变更再运行Cargo check/Clippy/fmt。
- 官网：`npm run site:dev`、`npm run site:build`；部署细节见 [官网说明](website/README.md)。
- 打包：`npm run desktop:build`，需现有签名密钥；Python环境/独立组件见 [sidecar说明](sidecar/README.md)。
- 新机器：Node22、Rust stable；Windows需MSVC/SDK/WebView2，macOS需Xcode命令行工具。Python环境在新机重建，保留本机已有环境。
