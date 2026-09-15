import { invoke as invokeCommand, type InvokeArgs } from "@tauri-apps/api/core";
import { errorMessage } from "../i18n/errors";

export async function invoke<T>(command: string, args?: InvokeArgs): Promise<T> {
  try {
    return await invokeCommand<T>(command, args);
  } catch (reason) {
    // Tauri 调用方原本接收字符串错误；在这个边界解析结构化消息并保留该约定。
    throw errorMessage(reason);
  }
}
