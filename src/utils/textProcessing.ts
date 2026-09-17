import { t } from "../i18n/core";

export const textSeparators = [",", "，", "|", "、", "\\", "/", "-", "_", "—", ";", "；"];
export const textQuotePairs = {
  double: ['"', '"'],
  single: ["'", "'"],
  chineseDouble: ["“", "”"],
  chineseSingle: ["‘", "’"],
} as const;

export type TextProcessingOptions = {
  separator: string;
  quoteAction: "none" | "add" | "remove";
  quoteStyle: keyof typeof textQuotePairs;
  trim: boolean;
  removeEmpty: boolean;
  deduplicate: boolean;
  sort: "none" | "ascending" | "descending";
};

export function processText(input: string, options: TextProcessingOptions): { text: string; count: number } {
  if (input.length > 1_000_000) throw new Error(t('单次最多处理 100 万个字符，请分批整理。'));
  if (options.separator !== "\n" && input.includes("\t")) {
    throw new Error(t('输入含制表符，请使用换行输出，或先整理为单列后再拼接。'));
  }
  if (options.separator.length > 32) throw new Error(t('自定义分隔符最多32个字符。'));
  if (!input) return { text: "", count: 0 };

  // 一个末尾换行是 Excel 复制的行结束符，不额外生成一项；其他空行按选项处理。
  const normalized = input.replace(/\r\n?/g, "\n");
  let items = (normalized.endsWith("\n") ? normalized.slice(0, -1) : normalized).split("\n");
  if (options.trim) items = items.map(item => item.trim());
  if (options.removeEmpty) items = items.filter(item => item.trim() !== "");
  if (options.deduplicate) items = [...new Set(items)];
  // 延续逐行整理的字符排序规则，不把前导零数据转换成数值，也不按系统语言排序。
  if (options.sort !== "none") items.sort();
  if (options.sort === "descending") items.reverse();

  const pair = textQuotePairs[options.quoteStyle];
  let outputLength = Math.max(0, items.length - 1) * options.separator.length;
  items = items.map(item => {
    let value = item;
    if (options.quoteAction === "add") {
      value = pair[0] + item + pair[1];
    } else if (options.quoteAction === "remove") {
      // 只去掉一对匹配的首尾引号，不剥离多层，也不修改内容内部的引号。
      const outer = Object.values(textQuotePairs).find(([start, end]) => item.length >= 2 && item.startsWith(start) && item.endsWith(end));
      if (outer) value = item.slice(outer[0].length, -outer[1].length);
    }
    outputLength += value.length;
    if (outputLength > 2_000_000) throw new Error(t('拼接结果超过200万个字符，请减少数据或缩短分隔符。'));
    return value;
  });
  // 去重/排序之后按字面分隔符拼接，保留引号内部文本，不隐式生成 SQL/CSV 转义。
  return { text: items.join(options.separator), count: items.length };
}
