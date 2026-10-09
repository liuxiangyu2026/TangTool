# v0.1.4 构建与发布记录

用户于2026-10-09授权发布，v0.1.4 Preview已公开，沿用更新签名和独立Markdown组件1.0.0。v0.1.2/v0.1.3保留。

## 发布来源

- 源码与标签：`02f8f501a924797a9fc179ee70c41529a1bb5612`，包含功能提交`668a3b6`及依赖安全补丁。后续交接文档提交不改变安装包来源。
- 三平台构建：[37890398796](https://github.com/liuxiangyu2026/TangTool/actions/runs/37890398796)，全部成功。
- 质量检查：[37890379122](https://github.com/liuxiangyu2026/TangTool/actions/runs/37890379122)，前端与Windows/macOS Rust检查全部成功。
- 发布与公开回读：[37892658748](https://github.com/liuxiangyu2026/TangTool/actions/runs/37892658748)，成功；Release ID407563503，共14份附件。
- 官网部署：[37892878783](https://github.com/liuxiangyu2026/TangTool/actions/runs/37892878783)，成功，来源与安装包一致。
- 官网公开HTML/脚本/样式/引用截图与本地生产构建摘要一致，浏览器确认v0.1.4六个下载链接、21工具及7组图片，英文图片全部解码成功；报告存入同一证据目录。
- 本机再次核对正式标签、latest.json三平台版本/下载地址、build-info和SHA256SUMS；发布runner的14条无凭证公开回读记录均与正式附件大小和SHA-256匹配。
- 证据：`release-artifacts/ci-37890398796/`，含来源、截图摘要、正式版本元数据、更新清单、来源/摘要文件及公开回读报告。

## 主安装包

| 平台 | 文件 | 字节数 |
| --- | --- | ---: |
| Windows x64 | TangTool-0.1.4-x86_64-pc-windows-msvc-setup.exe | 6472990 |
| macOS ARM | TangTool-0.1.4-aarch64-apple-darwin.zip | 8062350 |
| macOS Intel | TangTool-0.1.4-x86_64-apple-darwin.zip | 8352643 |

更新包有签名，系统开发者签名/公证仍未提供；保持Preview。新PDF本地字体及解析资源使主包比v0.1.3有所增长，仍不包含LibreOffice或Python组件。

## 验证范围

- 版本号统一更新到0.1.4，包含JSON对比/转Excel标题栏操作、全部字段及key-only比较、两项文档工具和内存优化。中英文更新说明见 `release-notes-0.1.4.md`。
- 本地前端/官网构建、现有13测试、Rust fmt/Clippy通过；七组中英文截图从当前生产前端重拍，侧栏显示0.1.4。
- 新功能验证沿用 `release-artifacts/feature-upgrade-20260920/`，后续标题栏调整已通过中英文、窄分栏及格式化/转义/折叠检查。无永久新增测试。
- 待目标机验收：LibreOffice实际DOCX→PDF、Windows/Intel原生文件操作、安装升级与重启。不得把浏览器、替身进程或CI结果当作这些检查通过。
- 更新签名继续用GitHub Actions的`TAURI_SIGNING_PRIVATE_KEY`，不生成新密钥、不打印私钥、不把密钥放入仓库。发布流程校验三平台包签名和来源，公开后回读14份附件。
- 发布前重新审计发现新公告，已在原兼容范围内升级brace-expansion至2.1.7、source-map-js至1.2.2、DOMPurify至3.4.16；npm官方审计回到0公告。不得将9月旧审计直接当作本次检查。
