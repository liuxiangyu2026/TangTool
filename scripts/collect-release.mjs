import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { copyFile, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const target = {
  "darwin-arm64": "aarch64-apple-darwin",
  "darwin-x64": "x86_64-apple-darwin",
  "win32-x64": "x86_64-pc-windows-msvc",
}[`${process.platform}-${process.arch}`];
if (!target) throw new Error("仅收集 Windows x64 和 macOS ARM/Intel 产物。");

const { version } = JSON.parse(await readFile(path.join(root, "package.json"), "utf8"));
const commit = execFileSync("git", ["rev-parse", "HEAD"], { cwd: root, encoding: "utf8" }).trim();
const dirty = execFileSync("git", ["status", "--porcelain", "--untracked-files=normal"], { cwd: root, encoding: "utf8" }).trim() !== "";
const outputDirectory = path.join(root, "release-artifacts", target);
await mkdir(outputDirectory, { recursive: true });
const files = [];

if (process.platform === "darwin") {
  const app = path.join(root, "src-tauri/target/release/bundle/macos/TangTool.app");
  // 包的资源封印必须完整；ad-hoc 通过此项仍不代表开发者签名或 Apple 公证。
  execFileSync("codesign", ["--verify", "--deep", "--strict", app], { stdio: "inherit" });
  const name = `TangTool-${version}-${target}.zip`;
  execFileSync("ditto", ["-c", "-k", "--keepParent", app, path.join(outputDirectory, name)], { stdio: "inherit" });
  files.push(name);
} else {
  const directory = path.join(root, "src-tauri/target/release/bundle/nsis");
  const installers = (await readdir(directory)).filter((name) => name.endsWith(".exe"));
  if (installers.length !== 1) throw new Error("应有且只有一个 NSIS 安装包，请检查构建输出，避免混入旧版本。");
  const name = `TangTool-${version}-${target}-setup.exe`;
  await copyFile(path.join(directory, installers[0]), path.join(outputDirectory, name));
  files.push(name);
}

const checksums = [];
for (const name of files) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(path.join(outputDirectory, name))) hash.update(chunk);
  checksums.push(`${hash.digest("hex")}  ${name}`);
}

const manifest = {
  version,
  target,
  commit,
  dirty,
  builtAt: new Date().toISOString(),
  node: process.version,
  files,
  acceptance: "candidate-only",
  note: "构建产物，尚不能替代目标机安装、离线转换、升级卸载及正式签名/公证验收。",
};
await writeFile(path.join(outputDirectory, "SHA256SUMS.txt"), `${checksums.join("\n")}\n`);
await writeFile(path.join(outputDirectory, "build-info.json"), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`候选包及校验信息已收集：${outputDirectory}`);
if (dirty) console.warn("当前工作区有未提交内容，build-info 已标记 dirty，不可作为可追溯的正式发布包。");
