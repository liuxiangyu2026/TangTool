import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const target = { "darwin-arm64": "aarch64-apple-darwin", "darwin-x64": "x86_64-apple-darwin", "win32-x64": "x86_64-pc-windows-msvc" }[`${process.platform}-${process.arch}`];
if (!target) throw new Error("请在 macOS arm64/x64 或 Windows x64 上构建对应平台 sidecar。");
const extension = process.platform === "win32" ? ".exe" : "";
const runtime = JSON.parse(readFileSync(path.join(root, "sidecar/runtime.json"), "utf8"));
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
const build = path.join(root, "sidecar/build", target, "component");
mkdirSync(build, { recursive: true });
run(python, [
  "-m", "PyInstaller", "--noconfirm", "--onedir", "--console", "--noupx",
  "--name", "tangtool-markitdown", "--distpath", path.join(build, "dist"),
  "--workpath", path.join(build, "work"), "--specpath", build,
  "--collect-all", "magika", "--collect-all", "onnxruntime", "--collect-data", "pdfminer",
  "--collect-all", "pypdfium2", "--copy-metadata", "markitdown",
  "--add-data", `${path.join(root, "sidecar/runtime.json")}${path.delimiter}.`,
  path.join(root, "sidecar/markitdown_runner.py"),
]);
const payload = path.join(build, "dist/tangtool-markitdown");
const binary = path.join(payload, `tangtool-markitdown${extension}`);
run(binary, ["--health"]);
const packages = path.join(build, "packages");
mkdirSync(packages, { recursive: true });
const name = `TangTool-DocumentRuntime-${runtime.version}-${target}`;
if (process.platform === "darwin") {
  const componentPackage = path.join(build, "document-component.pkg");
  // 不让 Installer 搜索/迁移已有 Python.framework；组件只能写入 TangTool 的固定目录。
  const componentList = path.join(build, "component-list.plist");
  writeFileSync(componentList, '<?xml version="1.0" encoding="UTF-8"?><plist version="1.0"><array/></plist>\n');
  run("pkgbuild", [
    "--root", payload, "--component-plist", componentList,
    "--identifier", `com.github.liuxiangyu2026.tangtool.document-runtime.${target}`,
    "--version", runtime.version, "--ownership", "recommended",
    "--install-location", `/Library/Application Support/TangTool/DocumentRuntime/${runtime.version}`,
    componentPackage,
  ]);
  const requirements = path.join(build, "requirements.plist");
  writeFileSync(requirements, `<?xml version="1.0" encoding="UTF-8"?>
<plist version="1.0"><dict>
  <key>os</key><array><string>14.0</string></array>
  <key>arch</key><array><string>${process.arch === "arm64" ? "arm64" : "x86_64"}</string></array>
</dict></plist>\n`);
  const distribution = path.join(build, "distribution.xml");
  run("productbuild", ["--synthesize", "--product", requirements, "--package", componentPackage, distribution]);
  run("productbuild", [
    "--distribution", distribution, "--package-path", build,
    path.join(packages, `${name}.pkg`),
  ]);
} else {
  const candidates = [
    process.env.TANGTOOL_MAKENSIS,
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, "tauri/NSIS/makensis.exe"),
    process.env["ProgramFiles(x86)"] && path.join(process.env["ProgramFiles(x86)"], "NSIS/makensis.exe"),
  ];
  const compiler = candidates.find(candidate => candidate && existsSync(candidate)) ?? "makensis";
  run(compiler, [
    "-INPUTCHARSET", "UTF8", "-V3", `-DRUNTIME_VERSION=${runtime.version}`,
    `-DRUNTIME_ICON=${path.join(root, "src-tauri/icons/icon.ico")}`,
    `-DRUNTIME_SOURCE=${payload}`, `-DRUNTIME_OUTPUT=${path.join(packages, `${name}-setup.exe`)}`,
    path.join(root, "sidecar/component-installer.nsi"),
  ]);
}
console.log(`Document component package ready: ${packages}`);
