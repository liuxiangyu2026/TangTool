import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// 文档组件只作为独立下载产物，不再向主安装器生成组件选项或检查配置。
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
