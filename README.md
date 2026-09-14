# TangTool

TangTool 是一款面向 Windows 和 macOS 的本地桌面工具箱，目标是让常用的数据、文档和编码处理保持简单、快速并尽可能离线完成。

> 项目目前处于第一期开发阶段，功能和界面仍在持续完善。

## 第一期功能

- JSON 格式化、压缩、校验、对比以及 JSON 转 Excel
- Word、PDF 转 Markdown
- 使用安全随机源的密码生成器
- 文本和文件 MD5 摘要
- 文本和文件 Base64 编码与解码

## 技术栈

- Tauri 2
- Vue 3 + TypeScript + Vite
- Rust
- Pinia + Vue Router
- GitHub Actions

## 本地开发

请先安装 Node.js LTS、Rust 和对应平台的 Tauri 系统依赖。

```powershell
npm install
npm run tauri dev
```

检查前端类型并构建生产资源：

```powershell
npm run build
```

## 文档转换与完整安装包

开发模式的 DOCX/PDF 转换需要项目根目录 `.venv`，请保留已有环境。完整安装包使用独立 sidecar，构建步骤及 Windows/macOS 命令见 [sidecar/README.md](sidecar/README.md)。

```bash
npm run sidecar:build
npm run desktop:build
```

完整包随应用携带 Python、MarkItDown 和格式依赖；最终用户无需手动安装它们。当前只支持 DOCX/PDF，不支持 `.doc`，无需 LibreOffice。Windows/Intel macOS 真机验收及签名、公证仍在后续发布任务中。

## 隐私原则

TangTool 默认在本机处理输入内容和文件。第一期不设计云端账户，也不上传用户文件。

## 项目协作

需求、开发计划、技术决定和当前进度记录在 [AGENTS.md](./AGENTS.md)。
