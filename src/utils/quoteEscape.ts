export type QuoteEscapeAction = "add" | "remove";

/** 逐字处理双引号，不解析 JSON，也不改变换行、单引号或其他转义序列。 */
export function transformQuoteEscapes(input: string, action: QuoteEscapeAction): string {
  if (action === "add") {
    return input.replace(/"/g, '\\"');
  }

  // 只匹配紧邻双引号的一个反斜杠；前面还有反斜杠时留给下一次操作。
  return input.replace(/\\"/g, '"');
}
