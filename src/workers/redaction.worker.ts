import { configureLocale, normalizeLocale, t } from "../i18n/core";
import { redactText, type RedactionOptions } from "../utils/textRedaction";

self.onmessage = (event: MessageEvent<{ input: string; options: RedactionOptions; locale?: string }>) => {
  configureLocale(() => normalizeLocale(event.data.locale));
  try {
    self.postMessage({ value: redactText(event.data.input, event.data.options) });
  } catch (reason) {
    self.postMessage({ error: reason instanceof Error ? reason.message : t('脱敏失败，请检查规则。') });
  }
};
