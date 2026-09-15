import { spawnSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const runtime = JSON.parse(readFileSync(path.join(root, "sidecar/runtime.json"), "utf8"));
const generated = path.join(root, "src-tauri/windows/generated");
mkdirSync(generated, { recursive: true });
writeFileSync(path.join(generated, "runtime.nsh"), [
  `!define DOCUMENT_RUNTIME_VERSION "${runtime.version}"`,
  `!define DOCUMENT_RUNTIME_TOKEN "TangToolDocumentRuntime:${runtime.version}:x86_64-pc-windows-msvc"`,
  `!define DOCUMENT_RUNTIME_URL "https://github.com/liuxiangyu2026/TangTool/releases/download/${runtime.release}/TangTool-DocumentRuntime-${runtime.version}-x86_64-pc-windows-msvc-setup.exe"`,
  "",
].join("\n"));

// 主包先构建，Windows 的 NSIS 编译器随后复用于独立组件包。
const tasks = [
  [path.join(root, "node_modules/@tauri-apps/cli/tauri.js"), "build", ...process.argv.slice(2)],
  [path.join(root, "scripts/build-sidecar.mjs")],
];
for (const args of tasks) {
  const result = spawnSync(process.execPath, args, { cwd: root, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}
