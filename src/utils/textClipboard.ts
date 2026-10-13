import { isTauri } from "@tauri-apps/api/core";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";

export async function copyText(value: string): Promise<void> {
  if (isTauri()) await writeText(value);
  else await navigator.clipboard.writeText(value);
}
