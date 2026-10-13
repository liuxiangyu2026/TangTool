import { t } from "../i18n/core";

/** 逐个匹配并在拼接前限制输出；避免原生全局替换一次积累巨量捕获组或展开 $' / $`。 */
export function replaceTextBounded(input: string, regex: RegExp, template: string, limit = 2_000_000): { output: string; count: number } {
  const expression = new RegExp(regex.source, regex.flags);
  expression.lastIndex = regex.global ? 0 : regex.lastIndex;
  let count = 0;
  let output = "";
  let consumed = 0;
  let match: RegExpExecArray | null;
  while ((match = expression.exec(input)) !== null) {
    const named = match.groups;
    const offset = match.index;
    const matched = match[0];
    const captures = match.slice(1);
    const prefix = input.slice(consumed, offset);
    if (output.length + prefix.length > limit) throw new Error(t('替换结果超过 200 万字符，请缩小输入或替换内容。'));
    output += prefix;
    let value = "";
    let cursor = 0;
    for (const tokenMatch of template.matchAll(/\$(\$|&|`|'|<[^>]*>|\d{1,2})/g)) {
      const token = tokenMatch[1]!;
      let piece = tokenMatch[0];
      if (token === "$") piece = "$";
      else if (token === "&") piece = matched;
      else if (token === "`") piece = input.slice(0, offset);
      else if (token === "'") piece = input.slice(offset + matched.length);
      else if (token.startsWith("<")) piece = named ? named[token.slice(1, -1)] ?? "" : piece;
      else {
        const index = Number(token);
        const first = Number(token[0]);
        if (index > 0 && index <= captures.length) piece = captures[index - 1] ?? "";
        else if (token.length === 2 && first > 0 && first <= captures.length) piece = (captures[first - 1] ?? "") + token[1];
      }
      const literal = template.slice(cursor, tokenMatch.index);
      if (output.length + value.length + literal.length + piece.length > limit) throw new Error(t('替换结果超过 200 万字符，请缩小输入或替换内容。'));
      value += literal + piece;
      cursor = tokenMatch.index! + tokenMatch[0].length;
    }
    const tail = template.slice(cursor);
    if (output.length + value.length + tail.length > limit) throw new Error(t('替换结果超过 200 万字符，请缩小输入或替换内容。'));
    output += value + tail;
    consumed = offset + matched.length;
    count++;
    if (!expression.global) break;
    if (matched === "") {
      const point = input.codePointAt(expression.lastIndex);
      expression.lastIndex += expression.unicode && point !== undefined && point > 0xffff ? 2 : 1;
    }
  }
  const suffix = input.slice(consumed);
  if (output.length + suffix.length > limit) throw new Error(t('替换结果超过 200 万字符，请缩小输入或替换内容。'));
  return { output: output + suffix, count };
}
