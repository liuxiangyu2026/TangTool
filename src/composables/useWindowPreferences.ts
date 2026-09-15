import { t } from "../i18n";
import { onBeforeUnmount, onMounted, watch } from "vue";
import { isTauri } from "@tauri-apps/api/core";
import { currentMonitor, getCurrentWindow, LogicalSize } from "@tauri-apps/api/window";
import { usePreferencesStore } from "../stores/preferences";

export function useWindowPreferences() {
  const settings = usePreferencesStore();
  let dispose: (() => void) | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let stopped = false;
  let restoring = true;
  async function recordSize() {
    if (stopped || restoring || !settings.rememberWindow || !isTauri()) return;
    try {
      const win = getCurrentWindow();
      const [size, scale, maximized, minimized] = await Promise.all([win.innerSize(), win.scaleFactor(), win.isMaximized(), win.isMinimized()]);
      if (stopped || !settings.rememberWindow || minimized) return;
      const logical = size.toLogical(scale);
      // 最大化时保留最近的普通窗口大小，下次先恢复普通大小再最大化。
      const normal = maximized ? settings.windowSize ?? { width: 1200, height: 800 } : logical;
      settings.windowSize = { width: normal.width, height: normal.height, maximized };
    } catch {
      settings.storageError = t("无法记录窗口尺寸，其他设置不受影响。");
    }
  }
  onMounted(async () => {
    if (!isTauri()) return;
    try {
      const win = getCurrentWindow();
      const saved = settings.rememberWindow ? settings.windowSize : null;
      if (saved) {
        const monitor = await currentMonitor();
        const screen = monitor?.size.toLogical(monitor.scaleFactor);
        await win.setSize(new LogicalSize(Math.max(900, Math.min(saved.width, (screen?.width ?? 16000) - 32)), Math.max(640, Math.min(saved.height, (screen?.height ?? 16000) - 80))));
        if (saved.maximized) await win.maximize();
      }
      if (stopped) return;
      dispose = await win.onResized(() => {
        clearTimeout(timer);
        timer = setTimeout(() => { void recordSize(); }, 150);
      });
      if (stopped) dispose();
      restoring = false;
      await recordSize();
    } catch {
      restoring = false;
      settings.storageError = t("恢复窗口尺寸失败，使用当前窗口尺寸。");
    }
  });
  watch(() => settings.rememberWindow, enabled => { if (enabled) void recordSize(); });
  onBeforeUnmount(() => { stopped = true; clearTimeout(timer); dispose?.(); });
}
