import { configureLocale, normalizeLocale, t } from "../i18n/core";
import { convertJsonYaml } from "../utils/jsonYaml";

self.onmessage = (event: MessageEvent<{ input: string; direction: "json-yaml" | "yaml-json"; indent: number; locale?: string }>) => {
  configureLocale(() => normalizeLocale(event.data.locale));
  try {
    self.postMessage({ value: convertJsonYaml(event.data.input, event.data.direction, event.data.indent) });
  } catch (reason) {
    self.postMessage({ error: reason instanceof Error ? reason.message : t('转换失败，请检查输入。') });
  }
};
