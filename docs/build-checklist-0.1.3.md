# TangTool v0.1.3 构建与发布记录

[v0.1.3 Preview](https://github.com/liuxiangyu2026/TangTool/releases/tag/v0.1.3) 已公开，官网已部署更新。发布成功不代替真机安装验收，继续采用未签名／未公证预览方案。版本内容见 [更新说明](release-notes-0.1.3.md)。

## 已完成的本地检查

- 前端和官网构建、现有13个测试、Rust fmt/Clippy、差异格式检查通过。
- 统一提示顶部定位：900×640和1920×1080时顶部8px、普通消息底部46px，工具栏从105px开始；两侧JSON错误合并的长消息底部66px，完整内容保留滚动，无工具栏重叠。2秒自动消失及手动关闭逻辑未改变。
- 先前各轮临时验证覆盖JSON转义与折叠、MD5四种结果、实时文本组合选项、偏好迁移及菜单收藏；没有新增永久单元测试。
- 版本号在 package.json/package-lock.json、Cargo.toml/Cargo.lock及tauri.conf.json统一为0.1.3。文档组件保持1.0.0，应用内链接继续使用已存在的v0.1.2组件附件。

## 构建状态

- 功能提交为 `d72bc2b`，构建及发布标签均指向 `8e25a10729fd99096e99f7426256c4f32ef18a87`；后续交接文档提交不修改安装包来源。
- 三平台构建：[35185179323](https://github.com/liuxiangyu2026/TangTool/actions/runs/35185179323) 全部成功，Windows NSIS 主安装器和独立组件、两种 macOS 架构的主应用和组件包均已生成。
- 对应质量检查：[35185026089](https://github.com/liuxiangyu2026/TangTool/actions/runs/35185026089) 已全部成功。
- 发布工作流 [35186998007](https://github.com/liuxiangyu2026/TangTool/actions/runs/35186998007) 成功，Release ID390461859。三份主包、三份组件、SHA256SUMS.txt和build-info.json共八份附件完成上传及无凭证公开下载回读，大小与SHA-256一致；已核对正式标签来源。
- 官网部署 [35187185643](https://github.com/liuxiangyu2026/TangTool/actions/runs/35187185643) 成功，来源 `acd297759ded3fd73e5bdcfc9c31a5b0ad32e793`；它相对构建提交仅更新交接文档，官网代码一致。
- 官网公开HTML和脚本经HTTPS回读，与当前重新构建结果摘要一致；按官网版本选择规则确认最新为v0.1.3，六个主包/组件链接均指向本版。本机浏览器仍遇到连接关闭，视觉复核未完成，未将资源校验冒充浏览器实测。结果保存于 `website-verification.json`。
- 本地 `release-artifacts/ci-35185179323/` 保存公开版本元数据、来源、SHA-256清单及公开回读报告。旧v0.1.2附件保留，应用内组件下载继续复用v0.1.2的1.0.0组件。

| 平台 / 文件 | 字节数 | SHA-256 |
| --- | ---: | --- |
| macOS ARM 主包 ZIP | 4175879 | `ad72a104d7d223be9e898346ebe442aca9dbecb1591fba7abe38e719bdf001fe` |
| macOS ARM 组件 PKG | 58882747 | `9ffbfcc49cb8883fe7b402a47b71dcac5271300ba127e119b6f5afd033169fe0` |
| macOS Intel 主包 ZIP | 4361450 | `cb2714789b9989d51643a263d3d09ab85dc2250809be29f9604e0b6e2046b8d4` |
| macOS Intel 组件 PKG | 62758605 | `6d1fc003eb7bf8d127fd6ec8b0a479c2d41b830802825a30a2f8fde78d7414ef` |
| Windows x64 主包 EXE | 3067561 | `e7751cfe5338a7d01bc3c5a0a9a13e4642848a4b20473a31dd660498f7a03c2d` |
| Windows x64 组件 EXE | 48171378 | `5843bddacad00b49fe1884233e8d829e24d96ca861c857f4bce9654f816958e3` |

## 待目标机验收

- Windows主安装器不再显示或检查文档组件；WebView2已安装/未安装重检和静默安装分支仍需真机验证。
- 文档工具页下载组件、安装后重新检测和DOCX/PDF转换；已有1.0.0组件兼容。
- Windows/macOS实际复制与导出、图标、窗口及分栏恢复、升级卸载；提示在原生窗口与字体设置下的展示。
- 继续采用未签名／未公证预览方案，无自动安装更新。旧版本发布记录保持不变。
