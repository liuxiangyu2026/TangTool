import { onScopeDispose, ref, watch } from "vue";
import { defineStore } from "pinia";

type Theme = "system" | "light" | "dark";
const storageKey = "tangtool.preferences.v1";
export const editorFonts = {
  system: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
  consolas: 'Consolas, "Liberation Mono", monospace',
  menlo: 'Menlo, Monaco, "Liberation Mono", monospace',
};

export const usePreferencesStore = defineStore("preferences", () => {
  const theme = ref<Theme>("system");
  const fontSize = ref(16);
  const sidebarCollapsed = ref(false);
  const collapsedGroups = ref<string[]>([]);
  const storageError = ref("");
  const favorites = ref<string[]>([]);
  const rememberWindow = ref(true);
  const rememberPanels = ref(true);
  const windowSize = ref<{ width: number; height: number; maximized: boolean } | null>(null);
  const panelRatios = ref<Record<string, number>>({});
  const editorFont = ref<keyof typeof editorFonts>("system");
  const editorWrap = ref(false);
  const indentWidth = ref(2);
  const exportDirectory = ref("");
  const filenameRule = ref<"original" | "timestamp">("original");
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) ?? "null");
    if (saved && typeof saved === "object") {
      if (["system", "light", "dark"].includes(saved.theme)) theme.value = saved.theme;
      if ([14, 16, 18].includes(saved.fontSize)) fontSize.value = saved.fontSize;
      if (typeof saved.sidebarCollapsed === "boolean") sidebarCollapsed.value = saved.sidebarCollapsed;
      if (Array.isArray(saved.collapsedGroups)) {
        collapsedGroups.value = saved.collapsedGroups.filter((key: unknown) => typeof key === "string").slice(0, 20);
      }
      if (Array.isArray(saved.favorites)) favorites.value = [...new Set<string>(saved.favorites.filter((value: unknown) => typeof value === "string" && value.startsWith("/")).slice(0, 100))];
      if (typeof saved.rememberWindow === "boolean") rememberWindow.value = saved.rememberWindow;
      if (typeof saved.rememberPanels === "boolean") rememberPanels.value = saved.rememberPanels;
      const size = saved.windowSize;
      if (rememberWindow.value && size && Number.isFinite(size.width) && Number.isFinite(size.height) && size.width >= 900 && size.width <= 16000 && size.height >= 640 && size.height <= 16000) {
        windowSize.value = { width: size.width, height: size.height, maximized: size.maximized === true };
      }
      if (rememberPanels.value && saved.panelRatios && typeof saved.panelRatios === "object") {
        panelRatios.value = Object.fromEntries(Object.entries(saved.panelRatios).filter(([key, value]) => key.length < 200 && typeof value === "number" && Number.isFinite(value) && value >= 10 && value <= 90).slice(0, 100)) as Record<string, number>;
      }
      if (["system", "consolas", "menlo"].includes(saved.editorFont)) editorFont.value = saved.editorFont;
      if (typeof saved.editorWrap === "boolean") editorWrap.value = saved.editorWrap;
      if ([2, 4, 8].includes(saved.indentWidth)) indentWidth.value = saved.indentWidth;
      if (typeof saved.exportDirectory === "string" && saved.exportDirectory.length < 4096) exportDirectory.value = saved.exportDirectory;
      if (["original", "timestamp"].includes(saved.filenameRule)) filenameRule.value = saved.filenameRule;
    }
  } catch {
    storageError.value = "无法读取本地偏好，已使用默认设置。";
  }

  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)");
  function applyAppearance() {
    const dark = theme.value === "dark" || (theme.value === "system" && systemTheme.matches);
    document.documentElement.dataset.theme = dark ? "dark" : "light";
    document.documentElement.style.fontSize = `${fontSize.value}px`;
    document.documentElement.style.setProperty("--editor-font", editorFonts[editorFont.value]);
    document.documentElement.style.setProperty("--editor-wrap", editorWrap.value ? "pre-wrap" : "pre");
    document.documentElement.style.setProperty("--editor-tab-size", String(indentWidth.value));
  }
  systemTheme.addEventListener("change", applyAppearance);
  onScopeDispose(() => systemTheme.removeEventListener("change", applyAppearance));
  watch([theme, fontSize, editorFont, editorWrap, indentWidth], applyAppearance, { immediate: true, flush: "sync" });
  watch(rememberWindow, enabled => { if (!enabled) windowSize.value = null; });
  watch(rememberPanels, enabled => { if (!enabled) panelRatios.value = {}; });
  watch(
    [theme, fontSize, sidebarCollapsed, collapsedGroups, favorites, rememberWindow, rememberPanels, windowSize, panelRatios, editorFont, editorWrap, indentWidth, exportDirectory, filenameRule],
    () => {
      // 仅保存外观偏好；JSON、文档内容和密码不写入持久化存储。
      try {
        localStorage.setItem(
          storageKey,
          JSON.stringify({
            theme: theme.value,
            fontSize: fontSize.value,
            sidebarCollapsed: sidebarCollapsed.value,
            collapsedGroups: collapsedGroups.value,
            favorites: favorites.value, rememberWindow: rememberWindow.value, rememberPanels: rememberPanels.value,
            windowSize: rememberWindow.value ? windowSize.value : null, panelRatios: rememberPanels.value ? panelRatios.value : {},
            editorFont: editorFont.value, editorWrap: editorWrap.value, indentWidth: indentWidth.value,
            exportDirectory: exportDirectory.value, filenameRule: filenameRule.value,
          }),
        );
        storageError.value = "";
      } catch {
        storageError.value = "设置已在当前窗口生效，但无法保存；重启后可能恢复默认。";
      }
    },
    { flush: "sync", deep: true },
  );
  function toggleFavorite(path: string) {
    favorites.value = favorites.value.includes(path) ? favorites.value.filter(value => value !== path) : [...favorites.value, path];
  }
  return { theme, fontSize, sidebarCollapsed, collapsedGroups, storageError, favorites, toggleFavorite,
    rememberWindow, rememberPanels, windowSize, panelRatios, editorFont, editorWrap, indentWidth, exportDirectory, filenameRule };
});
