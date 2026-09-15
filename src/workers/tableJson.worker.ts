import { configureLocale, normalizeLocale, t } from "../i18n/core";
import { tableToJson, type TableJsonRequest } from "../utils/tableToJson";

self.onmessage = (event: MessageEvent<TableJsonRequest & { locale?: string }>) => {
  configureLocale(() => normalizeLocale(event.data.locale));
  try {
    self.postMessage({ value: tableToJson(event.data) });
  } catch (reason) {
    self.postMessage({ error: reason instanceof Error ? reason.message : t('无法读取表格，请检查格式或文件是否已加密。') });
  }
};
