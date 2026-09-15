import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";
import { toolCatalog, toolGroups } from "../src/data/toolCatalog.ts";

const symbols = {
  "/color": "◐", "/json/format": "{ }", "/json/diff": "⇄", "/json/excel": "▦",
  "/excel/json": "CSV", "/document/markdown": "M↓", "/password": "✳", "/sha": "SHA",
  "/hash-codec": "URL", "/md5": "MD5", "/base64": "64", "/timestamp": "◷",
  "/uuid": "ID", "/cron": "↻", "/regex": ".*", "/text": "≡", "/text/diff": "±",
  "/qrcode": "▣", "/image/compress": "↘",
};

function escapeHtml(value) {
  return value.replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character]);
}

export default defineConfig({
  plugins: [{
    name: "shared-tool-catalog",
    transformIndexHtml: {
      order: "pre",
      handler(html) {
        // 在构建时输出完整目录，无 JavaScript 时也能阅读基本功能。
        const cards = toolCatalog.map(tool => `
          <article class="feature" data-tool-group="${tool.group}">
            <span class="feature-icon" aria-hidden="true">${symbols[tool.path]}</span>
            <h3 data-i18n>${escapeHtml(tool.label)}</h3>
            <p data-i18n>${escapeHtml(tool.description)}</p>
          </article>`).join("");
        const filters = toolGroups.map(group => `<button type="button" data-tool-filter="${group.id}" aria-pressed="false" data-i18n>${escapeHtml(group.label)}</button>`).join("\n          ");
        return html.replace("<!-- TOOL_CATALOG -->", cards).replace("<!-- TOOL_FILTERS -->", filters);
      },
    },
  }],
  root: fileURLToPath(new URL(".", import.meta.url)),
  // 两个预览可同时运行，避免与桌面前端共用依赖预构建缓存。
  cacheDir: fileURLToPath(new URL("../node_modules/.vite-website", import.meta.url)),
  // 相对资源路径兼容 GitHub Pages /TangTool/ 子路径和本地预览。
  base: "./",
  server: { host: "127.0.0.1", port: 4173, strictPort: true },
  build: { outDir: "dist", emptyOutDir: true },
});
