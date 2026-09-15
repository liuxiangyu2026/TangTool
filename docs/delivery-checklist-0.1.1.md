# TangTool 0.1.1 交付记录

[v0.1.1 Lightweight Preview](https://github.com/liuxiangyu2026/TangTool/releases/tag/v0.1.1) 已公开，官网已部署主程序与组件的独立下载入口。此记录不表示所有目标机交互验收已完成。

## 来源与附件

- 构建/标签提交：`73b95fb81e4f879d522a2b7befa27da13189998a`；已通过 PR #2 合入 main（`c4f7a15`），合并后文件内容与构建提交相同。
- 三平台构建：[34944063273](https://github.com/liuxiangyu2026/TangTool/actions/runs/34944063273)；质量检查：[34944062682](https://github.com/liuxiangyu2026/TangTool/actions/runs/34944062682)，全部成功。
- 官网部署：[34947571777](https://github.com/liuxiangyu2026/TangTool/actions/runs/34947571777)，来自合并后的 main。
- 六份安装包及统一 SHA256SUMS.txt / build-info.json 已上传，八份公开附件经过下载回读，大小与 SHA-256 全部一致。临时 TLS 中断经重试完成，没有修改包内容。
- 本机产物与回读记录位于被忽略的 `release-artifacts/ci-34944063273/`。本机早期 dirty 包不用于公开发布，v0.1.0 的旧附件保持不变。

| 平台 / 文件 | 字节数 | SHA-256 |
| --- | ---: | --- |
| macOS ARM 主包 ZIP | 4149780 | `c8911f10ae5ae03c496099c94422e6040e22afd9b1e38324dbfa9267980ba26f` |
| macOS ARM 组件 PKG | 58881417 | `f32997834f33b0d669b1ee445f3a1bb8239952f1f929d4d8658d5e1a05734ef0` |
| macOS Intel 主包 ZIP | 4337456 | `93927f3ef5d86223d4324acdb785f998bf55f159febaabf6dd96dc766824448b` |
| macOS Intel 组件 PKG | 62756949 | `771fabf594b5cf361b62fb3999d92742dad966f7559233645b7cce40efc1bd71` |
| Windows x64 主包 EXE | 3055736 | `4de506118a7c0170da0d06486f73153cb5de9610871d215840feae14f828965b` |
| Windows x64 组件 EXE | 48164695 | `bdc597461a85f863ee4969e8ad25b7dc51b986680327b6da8b9aab81294b77d5` |

## 已验证

- 前端/官网构建、现有 13 个测试、Rust fmt/Clippy、三平台主包与组件编译、自检和收集均通过；未新增永久单元测试。
- Windows 两个 NSIS 安装器编译通过，检查日志未发现安装脚本警告。主包约 2.9 MiB，不包含 WebView2 离线安装器或文档组件。
- ARM/Intel 主包约 4.0/4.1 MiB，资源封印、版本 0.1.1、正式应用标识和无内置 sidecar 均核对。
- 两个 PKG 的固定目录、最低 macOS 14.0、架构要求已核对；relocatable=false，Python.framework 迁移条目为空，避免匹配系统已有 Python。
- 本机与云端 ARM 组件解包后，在项目外的中文空格路径、无有效 PYTHONHOME/PYTHONPATH 下通过健康检查、DOCX（含表格）、PDF 转换及不兼容协议拒绝。没有安装到系统组件目录。
- 同代码的独立标识原生预览中，未安装组件时主应用可启动；中英文文档页显示安装提示，选择/转换禁用，下载和重新检测入口可用；重复检测后状态正确。该预览没有改动用户正式应用的偏好。
- 官网中英文主包/组件六个链接对应同一 Release 的正确系统与芯片，不把组件 EXE 误判为 Windows 主程序；说明明确组件可选、macOS 默认不含组件及 WebView2 前置安装要求。

## 仍待目标机交互验收

- Windows：WebView2 缺失、HKCU/HKLM 已安装的分支；缺失时下一步留页、安装后再次检测；文档组件不勾选直接继续、勾选缺失时阻止继续、安装后放行。
- Windows：实际运行独立组件安装器、卸载与重装；主程序升级不误删组件；文档页由缺失到就绪并转换。
- macOS：系统 Installer 实际安装 PKG、授权与系统提示、安装后点击重新检测无需重启；错误架构、损坏组件、组件升级的用户流程。
- 三平台：继续核对旧交付表中的复制导出、布局偏好恢复、图标、升级卸载与离线文件处理；不要把历史结果直接记为新包通过。

保持预发布与未签名／未公证说明。用户已接受该交付方式，不把证书采购重新列为前置条件；仍不得声称所有干净目标机已经验收通过。
