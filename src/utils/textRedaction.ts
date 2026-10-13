import { replaceTextBounded } from "./regexReplacement";
import { t } from "../i18n/core";

export type RedactionOptions = { phone: boolean; email: boolean; identity: boolean; bank: boolean; custom: boolean; pattern: string; replacement: string };
export type RedactionResult = { output: string; counts: Record<"phone" | "email" | "identity" | "bank" | "custom", number> };

export function redactText(input: string, options: RedactionOptions): RedactionResult {
  if (input.length > 100_000) throw new Error(t('脱敏文本最多 10 万字符。'));
  const counts = { phone: 0, email: 0, identity: 0, bank: 0, custom: 0 };
  const spans: { from: number; to: number; value: string }[] = [];
  function mask(value: string, front: number, back: number): string {
    return value.length <= front + back ? "*".repeat(value.length) : value.slice(0, front) + "*".repeat(value.length - front - back) + value.slice(-back);
  }
  const rules: { key: "phone" | "email" | "identity" | "bank"; pattern: RegExp; replace: (value: string) => string }[] = [
    { key: "email", pattern: /[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9.-]*[A-Z0-9])?\.[A-Z]{2,}/gi, replace: value => {
      const at = value.lastIndexOf("@");
      return mask(value.slice(0, at), 1, 1) + value.slice(at);
    } },
    { key: "identity", pattern: /(?<!\d)(?:[1-9]\d{5}(?:19|20)\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3}[\dXx]|[1-9]\d{5}\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])\d{3})(?![\dXx])/g, replace: value => mask(value, 3, 4) },
    { key: "bank", pattern: /(?<!\d)(?:\d{13,19}|(?:\d{4}[ -]){3}\d{4})(?!\d)/g, replace: value => {
      const digits = value.replace(/\D/g, "");
      const masked = mask(digits, 6, 4);
      let index = 0;
      return value.replace(/\d/g, () => masked[index++]!);
    } },
    { key: "phone", pattern: /(?<!\d)(?:\+?86[ -]?)?1[3-9]\d{9}(?!\d)/g, replace: value => value.slice(0, -11) + mask(value.slice(-11), 3, 4) },
  ];
  // 基于原文收集位置，优先保护邮箱/身份证，防止重叠数字被再次当成银行卡或手机号。
  for (const rule of rules) {
    if (!options[rule.key]) continue;
    for (const match of input.matchAll(rule.pattern)) {
      const from = match.index!;
      const to = from + match[0].length;
      if (spans.some(span => from < span.to && to > span.from)) continue;
      spans.push({ from, to, value: rule.replace(match[0]) });
      counts[rule.key]++;
    }
  }
  spans.sort((a, b) => a.from - b.from);
  let output = "";
  let offset = 0;
  for (const span of spans) {
    output += input.slice(offset, span.from) + span.value;
    offset = span.to;
  }
  output += input.slice(offset);
  if (options.custom) {
    if (!options.pattern || options.pattern.length > 2000 || options.replacement.length > 2000) throw new Error(t('自定义表达式和替换内容最多 2000 字符，表达式不能为空。'));
    const regex = new RegExp(options.pattern, "gu");
    const custom = replaceTextBounded(output, regex, options.replacement);
    counts.custom = custom.count;
    output = custom.output;
    if (output.length > 2_000_000) throw new Error(t('替换结果超过 200 万字符，请缩小输入或替换内容。'));
  }
  return { output, counts };
}
