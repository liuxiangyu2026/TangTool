import { readdir, readFile } from "node:fs/promises";
import { resolve, basename } from "node:path";

// PDF 字体、CMap 和 WASM 跟随安装包离线分发，不向 CDN 请求文档资源。
export function pdfAssets() {
  const root = resolve("node_modules/pdfjs-dist");
  const groups = ["cmaps", "standard_fonts", "wasm"];
  return {
    name: "tangtool-pdf-assets",
    async generateBundle() {
      for (const [name, path] of [
        ["LICENSE.pdfjs.txt", resolve(root, "LICENSE")],
        ["LICENSE.docx.txt", resolve("node_modules/docx/LICENSE")],
        ["LICENSE.jszip.txt", resolve("node_modules/jszip/LICENSE.markdown")],
      ]) {
        this.emitFile({ type: "asset", fileName: `pdf-assets/${name}`, source: await readFile(path) });
      }
      for (const group of groups) {
        for (const name of await readdir(resolve(root, group))) {
          this.emitFile({ type: "asset", fileName: `pdf-assets/${group}/${name}`, source: await readFile(resolve(root, group, name)) });
        }
      }
    },
    configureServer(server) {
      server.middlewares.use("/pdf-assets/", async (request, response, next) => {
        const [group, name] = (request.url ?? "").split("?")[0].split("/").filter(Boolean);
        if (!groups.includes(group) || !name || name !== basename(name)) return next();
        try {
          const bytes = await readFile(resolve(root, group, name));
          response.setHeader("Content-Type", name.endsWith(".wasm") ? "application/wasm" : "application/octet-stream");
          response.end(bytes);
        } catch {
          next();
        }
      });
    },
  };
}
