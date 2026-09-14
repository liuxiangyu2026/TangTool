import { ref, watch } from "vue";
import { usePreferencesStore } from "../stores/preferences";

export function usePanelRatio(key: string, initial: number, min: number, max: number) {
  const settings = usePreferencesStore();
  const saved = settings.rememberPanels ? settings.panelRatios[key] : undefined;
  const ratio = ref(Math.max(min, Math.min(max, saved ?? initial)));
  watch([ratio, () => settings.rememberPanels], ([value, enabled]) => {
    if (enabled) settings.panelRatios = { ...settings.panelRatios, [key]: value };
  });
  return ratio;
}
