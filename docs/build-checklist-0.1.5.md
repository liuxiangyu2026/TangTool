# v0.1.5 构建与发布记录

用户于2026-10-13授权提交、推送并形成新版本。本版为Preview，主程序0.1.5，Markdown组件继续1.0.0，沿用现有更新签名密钥；不覆盖旧标签或附件。

## 发布来源与结果

- 源码提交：[`50c62736049b27d23dd9cb64a7d45536cb4ce379`](https://github.com/liuxiangyu2026/TangTool/commit/50c62736049b27d23dd9cb64a7d45536cb4ce379)，已推送main；范围见[版本说明](release-notes-0.1.5.md)，工具总数24。
- 质量检查：[38368969980](https://github.com/liuxiangyu2026/TangTool/actions/runs/38368969980)，前端及Windows/macOS Rust检查成功。
- 三平台构建：[38369037757](https://github.com/liuxiangyu2026/TangTool/actions/runs/38369037757)，三平台全部成功（ARM 5m18s、Windows 11m43s、Intel 18m13s）。
- [v0.1.5 Preview](https://github.com/liuxiangyu2026/TangTool/releases/tag/v0.1.5)已公开，Release ID `411467701`；标签绑定上述完整源码提交，后续交付文档提交不移动标签。
- 发布运行：[38371618307](https://github.com/liuxiangyu2026/TangTool/actions/runs/38371618307)成功，完成三平台来源、摘要、更新签名校验及全部14份附件的匿名公开回读。
- 官网部署：[38371988894](https://github.com/liuxiangyu2026/TangTool/actions/runs/38371988894)成功，来源同为`50c6273`；[线上官网](https://liuxiangyu2026.github.io/TangTool/)已显示0.1.5与24个工具。
- 远端标签回读确认：v0.1.2=`e556e5b`、v0.1.3=`7975187`、v0.1.4=`02f8f50`保持原提交，v0.1.5=`50c6273`。

## 公开附件与更新验证

发布包含三平台主包、三平台文档组件、两份macOS更新归档、三份更新签名，以及`latest.json`、`SHA256SUMS.txt`、`build-info.json`，共14份。文档组件仍为1.0.0，已有组件无需重装。

| 主程序手工安装包 | 字节数 | SHA-256 |
| --- | ---: | --- |
| macOS ARM ZIP | 8304921 | `ac3c65861b4dabe22f4d1d694a55ac1e97be82c69cf560d4533960cc3cbb9a77` |
| macOS Intel ZIP | 8593977 | `733d11bfbca794b98f4e2127e22b397d4a4a761e430d1e1322f81722edc677db` |
| Windows x64 EXE | 6680188 | `252a4453485ea90595f4ac7045c0a61758d25dfb55453bedbe7db33f2389788b` |

发布工作流对14份附件分别进行无凭据下载、字节数和SHA-256核验，报告为`public-release-verification`产物中的`public-verification.json`。本机又独立匿名下载三个更新包及签名，以应用现有公钥验签，均通过；同时核对更新清单、来源提交与构建运行号。

| 更新目标 | SHA-256 | 本机独立验签 |
| --- | --- | --- |
| darwin-aarch64 | `c958c0350c25a97c0d8f2df3fb93cf7f3036f8cf488685a4284652d7a634862a` | 通过 |
| darwin-x86_64 | `f957d3443dc86533a43ff98fa1d49df23d5c9195866c40ed85246491ce269ec9` | 通过 |
| windows-x86_64 | `252a4453485ea90595f4ac7045c0a61758d25dfb55453bedbe7db33f2389788b` | 通过 |

更新选择验证：0.1.4在允许预发布时能发现0.1.5，关闭预发布时忽略；同版本、草稿和外部下载来源不会被选用。沿用现有密钥，没有生成或输出私钥。更新包签名不代表Windows系统代码签名或Apple公证。

## 本地与官网验证

- 本地前端/官网构建、原13项测试、Rust fmt/check/Clippy（锁定、离线缓存）通过；npm官方全量审计0公告。
- 七组14张中英文截图从0.1.5生产前端重拍，1280×720无损WebP，逐像素回读一致，侧栏版本0.1.5；真实工具状态与演示数据，无个人浏览器资料。
- 官网生产预览及线上独立浏览器验收通过：24工具、7组双语图片加载与1280×720尺寸、放大/关闭交互、六个0.1.5公开下载入口、390px手机布局、图标正常。主包入口未误选`.app.tar.gz`更新归档。
- 官网18份公开文件（HTML、JavaScript、CSS、SVG及14张截图）匿名回读SHA-256与本地生产构建全部一致。
- 本地证据：`release-artifacts/v0.1.5-preflight/`；包、签名、来源及公开回读证据在`release-artifacts/ci-38369037757/`，包括`public-verification.json`、`public-local-verification.json`、`pages-run.json`、`website-public-verification.json`与`website-assets-verification.json`。证据目录按现有规则不进入Git。

## 待验边界

- JSON/YAML、脱敏、JSONPath、正则替换、批量图片、Logo与图片拾色/缩放/高图/滚动已通过本轮浏览器验证；临时验证代码已清理，没有新增永久单元测试。
- 详细范围见[日常工具扩展](productivity-tools.md)、[图片工具](image-tools.md)、[Cron格式](cron-formats.md)。
- 浏览器和CI不替代原生真机验收：原生保存、Windows图标应用、安装升级/重启及真实LibreOffice转档仍待目标机复核。
