import { configureLocale, normalizeLocale, t } from "../i18n/core";
import { compareText } from "../utils/textDiff";

self.onmessage = (event: MessageEvent<{ left: string; right: string; ignoreWhitespace: boolean; locale?: string }>) => {
  configureLocale(() => normalizeLocale(event.data.locale));
  try {
    self.postMessage({ value: compareText(event.data.left, event.data.right, event.data.ignoreWhitespace) });
  } catch (reason) {
    self.postMessage({ error: reason instanceof Error ? reason.message : t('对比失败。') });
  }
};
