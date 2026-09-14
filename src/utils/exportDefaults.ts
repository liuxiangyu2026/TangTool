import { usePreferencesStore } from "../stores/preferences";

export function buildExportName(name: string, rule: "original" | "timestamp", date = new Date()): string {
  const leaf = name.split(/[\\/]/).pop() || "tangtool";
  if (rule === "original") return leaf;
  const dot = leaf.lastIndexOf(".");
  const stem = dot > 0 ? leaf.slice(0, dot) : leaf;
  const extension = dot > 0 ? leaf.slice(dot) : "";
  const pad = (value: number) => String(value).padStart(2, "0");
  const stamp = `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}_${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
  return `${stem}_${stamp}${extension}`;
}

export function exportDefaults(name: string) {
  const settings = usePreferencesStore();
  const filename = buildExportName(name, settings.filenameRule);
  const directory = settings.exportDirectory;
  // 只设置对话框建议路径，不自动创建目录或覆盖文件。保留根目录与 Windows 盘符/UNC 语义。
  const separator = directory.includes("\\") ? "\\" : "/";
  const path = directory ? `${directory.replace(/[\\/]+$/, "")}${separator}${filename}` : filename;
  return { filename, path };
}
