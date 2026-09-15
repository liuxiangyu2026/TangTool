import { configureLocale, normalizeLocale, t } from "../i18n/core";
export type RegexMatch = { index: number; value: string; groups: (string | null)[] };
export type RegexResponse = { matches: RegexMatch[]; limited: boolean; error: string };

self.onmessage = (event: MessageEvent<{ pattern: string; flags: string; input: string; locale?: string }>) => {
  configureLocale(() => normalizeLocale(event.data.locale));
  const { pattern, flags, input } = event.data;
  const response: RegexResponse = { matches: [], limited: false, error: "" };
  try {
    if (!/^[gimsuy]*$/.test(flags)) throw new Error(t('仅支持 g、i、m、s、u、y 标志。'));
    const regex = new RegExp(pattern, flags);
    let match: RegExpExecArray | null;
    while ((match = regex.exec(input)) !== null) {
      response.matches.push({
        index: match.index,
        value: match[0].slice(0, 2000),
        groups: match.slice(1, 21).map((value) => (value === undefined ? null : value.slice(0, 500))),
      });
      if (response.matches.length >= 1000) {
        response.limited = true;
        break;
      }
      if (!regex.global && !regex.sticky) break;
      // exec 遇到零长度匹配不会自动前进，Unicode 模式必须跳过整个码点。
      if (match[0] === "") {
        const point = input.codePointAt(regex.lastIndex);
        regex.lastIndex += regex.unicode && point !== undefined && point > 0xffff ? 2 : 1;
      }
    }
  } catch (reason) {
    response.error = reason instanceof Error ? reason.message : t('正则表达式无效');
  }
  self.postMessage(response);
};
