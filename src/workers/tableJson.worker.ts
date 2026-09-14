import { tableToJson, type TableJsonRequest } from "../utils/tableToJson";

self.onmessage = (event: MessageEvent<TableJsonRequest>) => {
  try {
    self.postMessage({ value: tableToJson(event.data) });
  } catch (reason) {
    self.postMessage({ error: reason instanceof Error ? reason.message : "无法读取表格，请检查格式或文件是否已加密。" });
  }
};
