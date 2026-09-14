import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

export default defineConfig({
  root: fileURLToPath(new URL(".", import.meta.url)),
  // 两个预览可同时运行，避免与桌面前端共用依赖预构建缓存。
  cacheDir: fileURLToPath(new URL("../node_modules/.vite-website", import.meta.url)),
  // 相对资源路径兼容 GitHub Pages /TangTool/ 子路径和本地预览。
  base: "./",
  server: { host: "127.0.0.1", port: 4173, strictPort: true },
  build: { outDir: "dist", emptyOutDir: true },
});
