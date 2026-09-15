# 文档转换组件

从 TangTool 0.1.1 起，主程序与文档组件分开交付。组件包含 Python、MarkItDown 0.1.7 及 DOCX/PDF 依赖，用户不需要手动配置 Python，也不支持旧式 .doc、OCR 或 Word/PDF 互转。

## 用户安装

- Windows：主安装器先检测必需的 WebView2；缺少时提供微软下载链接，点击下一步重新检测。文档组件默认不勾选，勾选后需从链接单独安装并通过检测；不勾选可以继续。
- macOS：主应用 ZIP 不包含文档组件。文档页提供对应架构的 PKG 链接，用户通过系统 Installer 安装，可能需要管理员授权。
- 文档页始终提供“组件安装包”和“重新检测”。未安装、版本不匹配或自检失败时禁用选择/转换；已有结果仍可复制保存，其他工具不受影响。
- 检测通过后无需重启应用。应用只在用户点击链接时打开浏览器，不自动联网下载或更新组件。
- Windows 组件可在系统应用列表独立卸载。组件与主程序分别安装，删除或升级主程序不会主动删除共享组件及用户文档。

组件版本、协议与下载 Release 统一定义在 `runtime.json`。当前为组件 1.0.0、协议 1，三平台安装包已随 [应用 v0.1.1](https://github.com/liuxiangyu2026/TangTool/releases/tag/v0.1.1) 公开并通过下载回读。未来调整版本时，发布前不得把尚未存在的链接标记为可用。

| 平台 | 固定组件目录 |
| --- | --- |
| Windows x64 | `%LOCALAPPDATA%\\TangTool\\DocumentRuntime\\1.0.0` |
| macOS ARM / Intel | `/Library/Application Support/TangTool/DocumentRuntime/1.0.0` |

目录内为 `tangtool-markitdown.exe` / `tangtool-markitdown` 和 `_internal/`。只读取固定版本目录，不扫描磁盘、不回退到系统 Python，也不使用旧版主程序旁的组件。macOS PKG 禁止自动识别和迁移内置 Python.framework，确保不覆盖系统已有 Python；明确最低 macOS 14.0 和对应架构。

## 开发环境

开发模式继续使用项目 `.venv` 和 `sidecar/markitdown_runner.py`。独立打包使用 `.venv-sidecar`。**必须保留用户已有的这两个环境；仅在新机器或环境不存在时创建，不跨机器复制、不作为临时目录清理。**

新机器可按对应平台创建环境，再安装锁定依赖：

```bash
# macOS：在项目根目录，使用同架构 Python 3.10
python3.10 -m venv .venv
python3.10 -m venv .venv-sidecar
.venv/bin/python -m pip install --require-hashes -r sidecar/requirements.lock
.venv-sidecar/bin/python -m pip install --require-hashes -r sidecar/requirements.lock
```

```powershell
# Windows：使用 Python 3.10 x64
py -3.10 -m venv .venv
py -3.10 -m venv .venv-sidecar
.venv\Scripts\python.exe -m pip install --require-hashes -r sidecar/requirements.lock
.venv-sidecar\Scripts\python.exe -m pip install --require-hashes -r sidecar/requirements.lock
```

可以用 `TANGTOOL_SIDECAR_PYTHON` 指定已有的同架构打包 Python。构建脚本检查 Python/Node 架构及固定工具版本，不安装依赖或重建用户环境。

## 构建与发布

```bash
npm run desktop:build -- --bundles app -- --locked   # macOS
npm run desktop:build -- --bundles nsis -- --locked  # Windows
npm run release:collect
```

`desktop:build` 先生成 Windows 检查页所需的版本常量并构建轻量主包，然后构建独立组件。Windows 复用 Tauri 下载的 NSIS 编译器；也可用 `TANGTOOL_MAKENSIS` 指向已有编译器。macOS 使用系统 pkgbuild/productbuild。不要再传已移除的 tauri.sidecar.conf.json。

单独运行 `npm run sidecar:build` 只重建组件；Windows 需已具备上述 NSIS 编译器。生成目录为 `sidecar/build/<target>/component/`，PyInstaller 使用 onedir，避免启动时重复解压整个组件。该目录和生成的 Windows 常量文件均被 Git 忽略。

每个平台收集两份安装包：

- 主程序：`TangTool-0.1.1-<target>.zip` 或 `TangTool-0.1.1-<target>-setup.exe`。
- 文档组件：`TangTool-DocumentRuntime-1.0.0-<target>.pkg` 或 `TangTool-DocumentRuntime-1.0.0-<target>-setup.exe`。

`release:collect` 还输出 SHA256SUMS.txt、提交/dirty 标记及 componentVersion。必须紧随完整构建运行，不把旧包标记为新代码。三平台工作流仍为 `.github/workflows/desktop-build.yml`；一个 Release 应包含三份主包、三份组件包和统一校验/来源文件。已发布 v0.1.0 附件保持不变。

## 协议与验证

- `--health` 导入实际 DOCX/PDF 依赖并初始化文件识别模型，输出 JSON：ok、componentVersion、protocol、target、formats、MarkItDown version。
- Windows 安装器使用 `--check`，成功时退出 0 并输出无换行的 `TangToolDocumentRuntime:1.0.0:<target>`；不只检查文件存在。
- 转换 stdin 为 UTF-8 JSON，包含 inputPath、protocol 和 componentVersion。stdout 返回 ok、同一协议/组件版本及 markdown 或 error；stderr 只作诊断。
- 健康检查限制 20 秒/64 KiB 输出，转换限制 180 秒/16 MiB，双管道同时读取，关闭 stdin 后等待，不在 UI 线程执行。
- 构建会运行组件自检；还需在各目标机验收缺失/安装/重新检测、DOCX/PDF 转换、Windows 可选分支与 WebView2 缺失重检，以及组件升级卸载。CI 通过不等于所有真机项目已通过。
- 无正式开发者签名或公证；后续接入证书时需同时评估独立组件中的所有二进制签名及主程序配置，不能把 ad-hoc 封印检查当作正式签名。

更新 Python 依赖时，用 Python 3.10 更新 `requirements.txt` 和跨平台哈希锁文件 `requirements.lock`，并提升组件版本、重新检查各平台。保持用户不新增永久单元测试的约定，临时验证脚本与样本在完成后删除。
