import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, copyFileSync, chmodSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const target = { "darwin-arm64": "aarch64-apple-darwin", "darwin-x64": "x86_64-apple-darwin", "win32-x64": "x86_64-pc-windows-msvc" }[`${process.platform}-${process.arch}`];
if (!target) throw new Error("请在 macOS arm64/x64 或 Windows x64 上构建对应平台 sidecar。");
const extension = process.platform === "win32" ? ".exe" : "";
const envPath = process.env.TANGTOOL_SIDECAR_PYTHON;
const python = envPath ? path.resolve(envPath) : path.join(root, ".venv-sidecar", process.platform === "win32" ? "Scripts/python.exe" : "bin/python");
if (!existsSync(python)) throw new Error("找不到打包 Python。请按 sidecar/README.md 安装依赖或指定 TANGTOOL_SIDECAR_PYTHON。");

function run(command, args) {
  const result = spawnSync(command, args, { cwd: root, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(`构建命令失败（退出码 ${result.status}）`);
}

// Do not label a Rosetta/x64 Python bundle as arm64 (or vice versa).
const check = spawnSync(python, ["-c", "import platform; print(platform.machine().lower())"], { encoding: "utf8" });
const pythonArch = check.stdout?.trim();
if (check.status !== 0 || !(process.arch === "arm64" ? ["arm64", "aarch64"] : ["x86_64", "amd64"]).includes(pythonArch)) {
  throw new Error("Python 与 Node 架构不一致，请使用同架构环境构建。");
}
run(python, ["-c", "import importlib.metadata as m; assert m.version('markitdown') == '0.1.7'; assert m.version('pyinstaller') == '6.22.3', '请安装 sidecar/requirements.txt'"]);
const build = path.join(root, "sidecar/build", target);
mkdirSync(build, { recursive: true });
run(python, [
  "-m", "PyInstaller", "--noconfirm", "--onefile", "--console", "--noupx",
  "--name", "tangtool-markitdown", "--distpath", path.join(build, "dist"),
  "--workpath", path.join(build, "work"), "--specpath", build,
  "--collect-all", "magika", "--collect-all", "onnxruntime", "--collect-data", "pdfminer",
  "--collect-all", "pypdfium2", "--copy-metadata", "markitdown",
  path.join(root, "sidecar/markitdown_runner.py"),
]);
const binary = path.join(root, "src-tauri/binaries", `tangtool-markitdown-${target}${extension}`);
mkdirSync(path.dirname(binary), { recursive: true });
copyFileSync(path.join(build, "dist", `tangtool-markitdown${extension}`), binary);
if (process.platform !== "win32") chmodSync(binary, 0o755);
run(binary, ["--health"]);
console.log(`Sidecar ready: ${binary}`);
