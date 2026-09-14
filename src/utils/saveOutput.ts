import { isTauri } from "@tauri-apps/api/core";
import { save } from "@tauri-apps/plugin-dialog";
import { writeFile } from "@tauri-apps/plugin-fs";
import { exportDefaults } from "./exportDefaults";

export async function saveOutput(data: Uint8Array, name: string, extension: string, mime: string): Promise<boolean> {
  const defaults = exportDefaults(name);
  if (isTauri()) {
    const path = await save({ defaultPath: defaults.path, filters: [{ name: extension.toUpperCase(), extensions: [extension] }] });
    if (!path) return false;
    await writeFile(path, data);
  } else {
    // 浏览器预览也可验收导出，不增加桌面文件权限或后台上传。
    const url = URL.createObjectURL(new Blob([new Uint8Array(data)], { type: mime }));
    const link = document.createElement("a");
    link.href = url;
    link.download = defaults.filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return true;
}
