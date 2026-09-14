# TangTool 产品官网

独立静态站点，不进入 Tauri 安装包。原生 HTML / CSS / JavaScript，Vite 仅用于本地预览、资源路径和构建。无外部字体、埋点或文件上传功能。

## 本地预览

在项目根目录执行：

```bash
npm ci
npm run site:dev
```

访问 http://127.0.0.1:4173 。生产构建 `npm run site:build` 输出至 `website/dist`；可用 `npm run site:preview` 验证生产资源。相对资源路径兼容 `/TangTool/` 子目录。不要将原始 website 文件夹直接上传，必须使用构建结果。

## 首次发布 GitHub Pages

当前只添加了工作流，尚未修改远程设置或上线。

1. 提交并推送官网代码到 main。
2. 仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。
3. 在 **Actions → Deploy product website → Run workflow** 选择 main 并运行。
4. 成功后地址应为 https://liuxiangyu2026.github.io/TangTool/ ，以工作流输出为准。

公开仓库可使用免费的 GitHub Pages 托管与 github.io 地址；这不是赠送独立域名。独立域名需自行注册并配置。工作流仅手动触发，不因普通代码提交自动发布。

## 安装包与版本记录

官网从公开 GitHub Releases API 读取最近 30 个发布，优先第一个非预发布版本；仅有预发布时明确标记测试版。无发布、请求超时/限流与单平台缺包都展示可理解的状态，并保留 Releases 页面链接。Actions 产物需要登录且会过期，不作为公开稳定下载源。

首次正式下载开放前：先完成目标机验收，再创建 Release、上传三平台包。不要把未验收构建标成稳定版，也不要仅上传 GitHub 自动生成的源代码 ZIP。

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
