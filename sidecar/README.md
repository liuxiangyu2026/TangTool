# 文档转换 sidecar

仅支持 DOCX/PDF，离线调用 MarkItDown。旧式 `.doc` 已移除，不依赖 LibreOffice。

## 开发与打包是两个环境

- `npm run tauri dev`：从项目 `.venv` 启动 Python runner，方便调试。路径由 Rust 编译时项目目录定位，不依赖终端当前目录。
- `npm run desktop:build`：先用 PyInstaller 生成独立程序，再通过 `tauri.sidecar.conf.json` 的 `externalBin` 随应用打包。安装包从主程序同目录启动转换器，不访问项目 `.venv`，不回退系统 Python。
- `npm run tauri build` 未带 sidecar 配置时不会携带转换器；只适合排查 UI，不可作为完整交付包。缺少组件会明确报错。
- **不要删除用户已有的 `.venv` 来清理测试环境。** `.venv` 和 `.venv-sidecar` 均被 Git 忽略；换机时各自重建，不复制环境目录。

## 本机准备

构建要求 Node、Rust/Tauri 平台工具链及同架构 CPython 3.10。`requirements.txt` 固定主要依赖，`requirements.lock` 锁定传递依赖和哈希。依赖下载安装仅发生在开发/构建阶段。

macOS（项目根目录）：

```bash
# 已有 .venv 时跳过第一行。
uv venv --python 3.10 .venv
uv pip install --python .venv/bin/python --require-hashes -r sidecar/requirements.lock

# 独立打包环境，已有时跳过创建命令。
uv venv --python 3.10 .venv-sidecar
uv pip install --python .venv-sidecar/bin/python --require-hashes -r sidecar/requirements.lock
npm ci
npm run sidecar:build
npm run desktop:build -- --bundles app
```

Windows PowerShell（项目根目录）：

```powershell
# 已有环境时跳过对应的创建命令。
uv venv --python 3.10 .venv
uv pip install --python .venv\Scripts\python.exe --require-hashes -r sidecar/requirements.lock
uv venv --python 3.10 .venv-sidecar
uv pip install --python .venv-sidecar\Scripts\python.exe --require-hashes -r sidecar/requirements.lock
npm ci
npm run sidecar:build
npm run desktop:build -- --bundles nsis
```

已构建 sidecar 后，快速打 debug 应用（不重新运行 PyInstaller）：

```bash
npm run tauri build -- --debug --config src-tauri/tauri.sidecar.conf.json
```

可用 `TANGTOOL_SIDECAR_PYTHON` 指定另一个同架构、已安装锁定依赖的 Python。构建脚本不会下载依赖，也不会创建或清空环境；只重建 `sidecar/build` 下的自有产物和 `src-tauri/binaries/tangtool-markitdown-*`。

## 平台产物

| 构建环境 | 产物 |
| --- | --- |
| macOS Apple Silicon | `src-tauri/binaries/tangtool-markitdown-aarch64-apple-darwin` |
| macOS Intel | `src-tauri/binaries/tangtool-markitdown-x86_64-apple-darwin` |
| Windows x64 | `src-tauri/binaries/tangtool-markitdown-x86_64-pc-windows-msvc.exe` |

必须在目标系统/架构分别构建；不能只改文件名来跨平台使用。打包后 Tauri 去掉 target 后缀，macOS 将 sidecar 放在 `.app/Contents/MacOS`，Windows 放在主程序同目录。二进制不提交 Git。

`.github/workflows/desktop-build.yml` 提供手动运行的三个平台构建任务，仅上传 Actions 产物，不发布 Release、不签名。

2026-09-14，[首次三平台构建](https://github.com/liuxiangyu2026/TangTool/actions/runs/34800140359) 已全部成功，构建提交为 `107b4be`。产物名称如下：

| 平台 | Artifact | 大小（约） |
| --- | --- | --- |
| Windows x64 | `TangTool-x86_64-pc-windows-msvc` | 64.5 MiB |
| macOS Apple Silicon | `TangTool-aarch64-apple-darwin` | 59.9 MiB |
| macOS Intel | `TangTool-x86_64-apple-darwin` | 63.6 MiB |

这些结果确认完整包构建、sidecar `--health` 与产物上传通过；尚未确认目标电脑安装、离线文档转换、签名或公证。下一步使用这些产物做下面的交付验收，不必为同一提交重复运行构建。

### 启动三平台构建

1. 先确认工作流代码已经提交并推送到 GitHub。
2. 登录 GitHub，打开仓库 Actions → **Build desktop with document sidecar**。
3. 点击 **Run workflow**，选择 `main`，启动构建。
4. 等待三个任务分别结束；若某个平台失败，打开失败步骤日志定位，不把其他平台通过等同于全平台通过。
5. 在运行详情页 Artifacts 下载对应架构产物。macOS 下载 zip 并解压 `.app`，Windows 下载 artifact zip 后取出其中 NSIS `.exe` 安装包。

如果已安装并登录 GitHub CLI，也可以在项目根目录执行：

```bash
gh workflow run desktop-build.yml --ref main
gh run list --workflow desktop-build.yml --limit 5
```

工作流仅有 `workflow_dispatch` 触发器，因此提交或推送代码不会自动开始构建。页面没有 **Run workflow** 时，先检查是否登录、有仓库写权限，以及工作流是否已在默认分支。无需把访问令牌写进仓库或发到聊天中。

构建成功后仍需下载产物，在目标系统上完成下方交付验收；Actions 构建成功本身不代表安装与文档转换已经通过。

## 协议与行为

stdin 接收一个 UTF-8 JSON 对象，写完必须关闭 stdin：

```json
{"inputPath":"文档绝对路径.docx"}
```

stdout 只输出一个 JSON 对象：成功返回 `{"ok":true,"markdown":"..."}` 并退出 0；失败返回 `{"ok":false,"error":"..."}` 并退出 1。诊断写入 stderr。`--health` 返回版本及支持格式。

Rust 在后台线程启动进程，独立读取 stdout/stderr，单次转换最长 180 秒，结果上限 16 MiB；不上传文件、不启用云服务或第三方插件。PDF 扫描件无 OCR，复杂表格、字体映射仍可能影响转换质量。Python 运行时、格式依赖及 Magika 模型由 PyInstaller 收入独立程序。

## 交付验收

- 从非项目目录启动打包应用，验证中文/空格路径、DOCX 标题和表格、PDF 文本。
- 在无 Python、无 MarkItDown、无项目仓库的电脑上测试；无需要求用户安装这些工具。
- 验证损坏文件、缺失文件、拒绝 `.doc`、批量转换后窗口可操作。
- Windows 若缺 WebView2，需要安装包处理该运行时；离线交付还需 M6 配置和验证。
- macOS 正式分发仍待开发者签名、公证和目标系统版本验证；当前本地 ad-hoc debug 包不等于已完成正式发布。

更新依赖时重新生成并审查锁文件：

```bash
uv pip compile sidecar/requirements.txt --universal --python-version 3.10 --generate-hashes -o sidecar/requirements.lock
```
