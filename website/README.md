# TangTool 产品官网

独立静态站点，不进入 Tauri 安装包。原生 HTML / CSS / JavaScript，Vite 仅用于本地预览、资源路径和构建。无外部字体、埋点或文件上传功能。

支持简体中文与英文，顶部切换并在官网独立保存选择，也可使用 `?lang=en` 分享英文页面。桌面与官网共用 `src/data/toolCatalog.ts`，构建时输出完整 19 项工具，支持按分类筛选。

`screenshots/` 提供六组中英文实际界面截图：1280×720、无损 WebP，不旋转、不透视、不拉伸，统一放在首屏截图轮播中，每 4.5 秒切换，下方仅保留玻璃质感圆点，当前圆点高亮、点击可切换；不显示箭头、数字或播放按钮。点击可放大，再点击大图、背景或按 Escape 关闭；悬停、焦点操作、打开大图及页面隐藏时暂停，减少动态效果偏好默认不自动播放。截图取自生产前端并使用演示数据，不代表原生文件/安装能力已全部验收。

工具分类不再显示“全部工具”按钮，初始显示全部，再次点击当前分类恢复全部。

## 本地预览

在项目根目录执行：

```bash
npm ci
npm run site:dev
```

访问 http://127.0.0.1:4173 。生产构建 `npm run site:build` 输出至 `website/dist`；可用 `npm run site:preview` 验证生产资源。相对资源路径兼容 `/TangTool/` 子目录。不要将原始 website 文件夹直接上传，必须使用构建结果。

## GitHub Pages 部署

官网已上线：[TangTool](https://liuxiangyu2026.github.io/TangTool/)。最新部署 [35194598402](https://github.com/liuxiangyu2026/TangTool/actions/runs/35194598402) 来自主分支提交 `7975187`，包含v0.1.3重建版说明、应用内更新及旧同版本需手动重装的提示。首页继续保持完整工具目录和玻璃圆点截图轮播。

1. 提交并推送官网代码到 main。
2. 仓库 Pages 已使用 **GitHub Actions**，无需重复设置。
3. 在 **Actions → Deploy product website → Run workflow** 选择 main 并运行。
4. 成功后地址应为 https://liuxiangyu2026.github.io/TangTool/ ，以工作流输出为准。

公开仓库可使用免费的 GitHub Pages 托管与 github.io 地址；这不是赠送独立域名。独立域名需自行注册并配置。工作流仅手动触发，不因普通代码提交自动发布。

## 安装包与版本记录

公开版本从v0.1.2开始，主程序与文档组件分别下载。主包匹配排除DocumentRuntime文件，组件匹配对应平台EXE/PKG后缀，不跨版本补附件。v0.1.3已公开为预发布包：Windows主安装器只检查WebView2，不再提供文档组件选项或检查；各平台用户在文档工具页按需下载组件。

最新为 [v0.1.3 Preview 重建版](https://github.com/liuxiangyu2026/TangTool/releases/tag/v0.1.3)，包含三平台主包、三平台组件、两份macOS更新归档、三份签名及更新/摘要/来源清单，共14份公开附件回读校验通过。网站仍展示六个手工安装入口，不能匹配到`.app.tar.gz`更新归档。文档组件仍为1.0.0，已有组件无需重装，应用内链接复用v0.1.2组件。当前来源与待验边界见 `../docs/build-checklist-0.1.3-updater.md`，旧v0.1.2发布保留。

本轮官网公开HTML/脚本回读与本地构建一致，版本接口按页面规则选中v0.1.3，六个下载安装链接核对通过。浏览器实际显示v0.1.3及主包3.9/5.4/5.7MB，对应组件链接正确；未重复全站响应式及截图验收。

“如何升级”已说明点击更新、确认保存内容、进度、签名验证和安装重启；系统权限提示仍可能出现。旧v0.1.3必须手动安装重建版一次，同版本不会提示更新，后续更高版本才走应用内更新。更新签名不同于Windows正式代码签名/Apple公证。

官网从公开 GitHub Releases API 读取最近 30 个发布，优先第一个非预发布版本；仅有预发布时明确标记测试版。无发布、请求超时/限流与单平台缺包都展示可理解的状态，并保留 Releases 页面链接。Actions 产物需要登录且会过期，不作为公开稳定下载源。

首发已确认采用未签名／未公证版本。页面明确系统安装提示和当前验收范围，不将签名或公证作为已经具备的能力。首次正式下载开放前应完成对应目标机验收；未验收构建不得标成稳定版。不要仅上传 GitHub 自动生成的源代码 ZIP。

当前文件名匹配约定：

- Windows x64：`TangTool_<版本>_x64-setup.exe`，或带 x86_64 的 TangTool .exe。
- macOS Apple Silicon：`TangTool-aarch64-apple-darwin.zip`（也接受带 arm64 的 .dmg；ZIP 需含 apple-darwin / macos 平台标识）。
- macOS Intel：`TangTool-x86_64-apple-darwin.zip`（也接受对应 .dmg）。

macOS 上传内部保留执行权限的应用 ZIP，不是再包一层的 Actions artifact ZIP。下载链接只采用本仓库 Release 资产的 HTTPS 地址；不跨版本补包。若文件命名改变，同步更新 `main.js` 的平台匹配规则。

桌面版本页和官网无发布时的开发记录共用 `src/data/changelog.json`。发布新版本时同步维护 `package.json`、Tauri/Rust 版本、此记录和 Release 说明；开发状态标签与官网验收提示也应据实更新。官网不渲染远端原始 HTML；完整升级说明链接到 GitHub。

## 验收清单

- 桌面和手机宽度下布局正常，锚点、FAQ、反馈链接可用。
- Release 列表为空时不出现伪造安装包链接。
- 发布后确认三个下载入口分别对应正确版本、系统、芯片。
- 网络失败时仍能看基本功能，并直接前往 Releases。
- Pages 上线后复核资源无 404，并实际下载回读安装包；本地构建成功不代表线上部署成功。
