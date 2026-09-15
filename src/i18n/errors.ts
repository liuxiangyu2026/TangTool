import { t, type MessageParameters } from "./core";

/** 只解释本应用的结构化错误；第三方/系统错误保留原文，绝不翻译工具数据。 */
export function errorMessage(reason: unknown, fallback = "操作失败，请重试。", depth = 0): string {
  if (reason instanceof Error) return reason.message || t(fallback);
  if (typeof reason === "string") return t(reason || fallback);
  if (!reason || typeof reason !== "object" || depth > 3) return t(fallback);
  const error = reason as { key?: unknown; parameters?: unknown; cause?: unknown };
  if (typeof error.key !== "string") return t(fallback);
  const parameters: MessageParameters = {};
  if (error.parameters && typeof error.parameters === "object") {
    for (const [key, value] of Object.entries(error.parameters)) {
      if (typeof value === "string" || typeof value === "number") parameters[key] = value;
    }
  }
  const message = t(error.key, parameters);
  return error.cause ? `${errorMessage(error.cause, fallback, depth + 1)}\n${message}` : message;
}
