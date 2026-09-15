import { configureLocale, normalizeLocale, t } from "../i18n/core";
import { explainCron } from "../utils/cron";

self.onmessage = (event: MessageEvent<{ expression: string; timeZone: string; start: string; locale?: string }>) => {
  configureLocale(() => normalizeLocale(event.data.locale));
  try {
    const { expression, timeZone, start } = event.data;
    self.postMessage({ value: explainCron(expression, timeZone, start) });
  } catch (reason) {
    self.postMessage({ error: reason instanceof Error ? reason.message : t('表达式或日期无效。') });
  }
};
