import { configureLocale, normalizeLocale, t } from "../i18n/core";
import { explainCron, type CronDialect } from "../utils/cron";

self.onmessage = (event: MessageEvent<{ expression: string; timeZone: string; start: string; dialect?: CronDialect; locale?: string }>) => {
  configureLocale(() => normalizeLocale(event.data.locale));
  try {
    const { expression, timeZone, start, dialect } = event.data;
    self.postMessage({ value: explainCron(expression, timeZone, start, dialect) });
  } catch (reason) {
    self.postMessage({ error: reason instanceof Error ? reason.message : t('表达式或日期无效。') });
  }
};
