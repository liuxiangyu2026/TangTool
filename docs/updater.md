# 应用内更新与签名密钥

## 密钥位置与保管

- 本机私钥备份：`/Users/liuxiangyu/.tangtool/keys/updater.key`。
- 对应公钥：`/Users/liuxiangyu/.tangtool/keys/updater.key.pub`；公钥也写入 `src-tauri/tauri.conf.json` 的 `plugins.updater.pubkey`。
- 备份目录权限700，文件600，限当前用户访问。私钥未设置额外口令，依赖本机账户/磁盘保护；应另存一份到受保护的密码管理器或加密离线备份，不能仅依赖此电脑。
- GitHub仓库 `liuxiangyu2026/TangTool` → Settings → Secrets and variables → Actions → `TAURI_SIGNING_PRIVATE_KEY`，已通过GitHub公钥加密上传。Secret值不可从GitHub读回，切勿删除本机备份。
- 公钥SHA-256：`5062948eaf6c53c5ed5e27f89b356dc41512b2911ac392d7e18897e8adc36bd1`。
- 这是更新包签名，不是Windows代码签名证书或Apple公证，不消除系统安装警告。私钥不得提交到Git、安装包、构建产物或日志，也不得每次打包重新生成。

本机打包时，只传私钥文件路径，勿把内容粘贴到终端历史：

```bash
TAURI_SIGNING_PRIVATE_KEY=/Users/liuxiangyu/.tangtool/keys/updater.key TAURI_SIGNING_PRIVATE_KEY_PASSWORD='' npm run desktop:build -- --bundles app -- --locked
```

## 用户流程

版本页“更新”按钮打开原生确认，提醒结束任务并保存内容；确认后在应用内显示下载进度。下载完成强制验证签名，验证成功才安装；Windows启动NSIS安装器并退出当前应用，macOS替换应用后重启。权限或系统安全提示仍可能出现。取消确认/网络失败/签名错误不安装，保留现有工具内容并允许重试。

只在用户点击并确认后安装，启动和周期检查仅提醒。更新期间全局模态进度框阻止新操作，原生窗口关闭请求暂时阻止；下载最多10分钟、256MiB。关闭或暂停自动检查不会取消已经确认的安装。

## 信任边界

- Rust命令只接受版本标签、语言和进度Channel；不接受下载URL、公钥、安装路径或安装参数。原生确认避免仅依赖前端按钮。
- 版本必须为合法SemVer且高于当前版本；只读取本仓库该版本的 `latest.json`，要求返回版本及本平台主程序下载URL完全匹配。HTTPS与证书校验保持开启。
- 官方 `tauri-plugin-updater` 强制验签；公钥固定在应用配置，不授予前端通用updater命令权限。进度回传不包含Key或用户工具内容。
- 下载字节只有验证通过才传给安装器。失败信息不将远端内容作为HTML执行，发布说明继续走DOMPurify。

## 构建与发布

- Windows主安装包 `.exe` 同时用作更新包，附 `.sig`；macOS除手工安装ZIP外，另生成 `.app.tar.gz` 更新包和 `.sig`。
- `release:collect`记录每个平台更新包文件名和签名。发布流程用仓库公钥验证所有更新包，按平台生成 `latest.json`，汇总SHA256SUMS和来源，公开后回读全部附件。
- 按现有预发布筛选选中具体Release后，再下载该Release的清单；不使用GitHub `/latest`（它可能排除预发布）。
- 用户明确要求此次重建替换v0.1.3，这是一次例外。旧v0.1.3只有跳转下载能力，需手动安装重建包；同版本不能自动提示更新。之后必须提升版本号，不再用替换附件代替正常升级。
- 不自动下载或升级文档组件1.0.0，不改用户偏好与文档。macOS安装在不可写位置时可能需要权限；不能把更新签名成功等同于三平台完整安装升级验收。
