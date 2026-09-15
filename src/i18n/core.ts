import english from "./en.json";
import chinese from "./zh.json";

export type Locale = "zh-CN" | "en";
export type MessageParameters = Record<string, string | number>;

let readLocale: () => Locale = () => "zh-CN";

/** Vue 界面、官网和 Worker 分别提供语言来源，共用同一套纯文本字典。 */
export function configureLocale(reader: () => Locale): void {
  readLocale = reader;
}

export function normalizeLocale(value: unknown): Locale {
  return value === "en" ? "en" : "zh-CN";
}

export function translate(message: string, locale: Locale, parameters: MessageParameters = {}): string {
  // 中文原文作为可读消息标识；只替换明确的参数，不编译 HTML 或执行模板代码。
  const catalog = (locale === "en" ? english : chinese) as Record<string, string>;
  const text = Object.prototype.hasOwnProperty.call(catalog, message) ? catalog[message] : message;
  return text.replace(/\{(\w+)\}/g, (placeholder, key: string) => Object.prototype.hasOwnProperty.call(parameters, key) ? String(parameters[key]) : placeholder);
}

export function t(message: string, parameters: MessageParameters = {}): string {
  return translate(message, readLocale(), parameters);
}
