import { diffArrays } from "diff";

export type TextDiffRow = { type: "same" | "added" | "removed"; left: string | null; right: string | null; leftNumber: number | null; rightNumber: number | null };
export type TextDiffResult = { rows: TextDiffRow[]; added: number; removed: number };

export function compareText(left: string, right: string, ignoreWhitespace: boolean): TextDiffResult {
  if (left.length > 200000 || right.length > 200000) throw new Error("每侧最多支持 20 万字符。");
  // 保留末尾空行来显示文件结尾换行差异；CRLF / LF 统一，不把系统换行差异当作改动。
  const originalLeft = left === "" ? [] : left.replace(/\r\n?/g, "\n").split("\n");
  const originalRight = right === "" ? [] : right.replace(/\r\n?/g, "\n").split("\n");
  if (originalLeft.length > 2000 || originalRight.length > 2000) throw new Error("每侧最多支持 2000 行，请分段对比。");
  const normalize = (line: string) => (ignoreWhitespace ? line.replace(/[^\S\r\n]+/g, "") : line);
  const changes = diffArrays(originalLeft.map(normalize), originalRight.map(normalize), { timeout: 1500, maxEditLength: 4000 });
  if (!changes) throw new Error("差异计算超出限制，请缩小文本范围。");
  let l = 0;
  let r = 0;
  let added = 0;
  let removed = 0;
  const rows: TextDiffRow[] = [];
  for (const change of changes) {
    for (let i = 0; i < change.value.length; i++) {
      if (change.added) {
        rows.push({ type: "added", left: null, right: originalRight[r++], leftNumber: null, rightNumber: r });
        added++;
      } else if (change.removed) {
        rows.push({ type: "removed", left: originalLeft[l++], right: null, leftNumber: l, rightNumber: null });
        removed++;
      } else {
        rows.push({ type: "same", left: originalLeft[l++], right: originalRight[r++], leftNumber: l, rightNumber: r });
      }
    }
  }
  return { rows, added, removed };
}
