import { configureLocale, normalizeLocale, t } from "../i18n/core";
import { queryJsonPath } from "../utils/jsonPath";

self.onmessage = (event: MessageEvent<{ input: string; expression: string; indent: number; locale?: string }>) => {
  configureLocale(() => normalizeLocale(event.data.locale));
  try {
    self.postMessage({ value: queryJsonPath(event.data.input, event.data.expression, event.data.indent) });
  } catch (reason) {
    self.postMessage({ error: reason instanceof Error ? reason.message : t('JSONPath 查询失败。') });
  }
};
