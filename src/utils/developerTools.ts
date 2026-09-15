import { t } from "../i18n/core";
export function parseTimestamp(input: string, unit: "seconds" | "milliseconds"): number {
  if (!/^-?\d+$/.test(input.trim())) throw new Error(t('请输入整数时间戳，并选择秒或毫秒。'));
  const value = Number(input.trim());
  const milliseconds = unit === "seconds" ? value * 1000 : value;
  if (!Number.isSafeInteger(milliseconds) || !Number.isFinite(new Date(milliseconds).getTime())) {
    throw new Error(t('时间戳超出可处理范围。'));
  }
  return milliseconds;
}

export function parseIsoDate(input: string): number {
  // 强制显式偏移，避免系统时区、夏令时和 Date.parse 的宽松日期修正改变用户输入的含义。
  const parts = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.(\d{1,3}))?(Z|[+-]\d{2}:\d{2})$/.exec(input.trim());
  if (!parts) throw new Error(t('使用带时区的 ISO 时间，例如 2026-09-14T12:00:00+08:00 或 2026-09-14T04:00:00Z。'));
  const [year, month, day, hour, minute, second] = parts.slice(1, 7).map(Number);
  const leap = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const zone = parts[8];
  if (month < 1 || month > 12 || day < 1 || day > days[month - 1] || hour > 23 || minute > 59 || second > 59) {
    throw new Error(t('日期或时间不存在，请检查月份、天数和时分秒。'));
  }
  if (zone !== "Z" && (Number(zone.slice(1, 3)) > 23 || Number(zone.slice(4)) > 59)) {
    throw new Error(t('时区偏移无效。'));
  }
  const value = Date.parse(input.trim());
  if (!Number.isFinite(value)) throw new Error(t('无法解析日期时间。'));
  return value;
}

export function generateUuids(count: number): string[] {
  if (!Number.isInteger(count) || count < 1 || count > 1000) throw new Error(t('生成数量需要是 1～1000 的整数。'));
  if (!globalThis.crypto?.getRandomValues) throw new Error(t('当前环境不支持安全随机数，无法生成 UUID。'));
  return Array.from({ length: count }, () => {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    // UUID v4 的版本位和 RFC 变体位，其余 122 位来自安全随机源。
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  });
}

export function organizeText(input: string, options: { trim: boolean; removeEmpty: boolean; deduplicate: boolean; sort: "none" | "ascending" | "descending" }): string {
  if (input === "") return "";
  // 统一换行符；一个末尾换行仅视为行结束符，额外空行仍参与空行选项处理。
  const normalized = input.replace(/\r\n?/g, "\n");
  let lines = (normalized.endsWith("\n") ? normalized.slice(0, -1) : normalized).split("\n");
  if (options.trim) lines = lines.map((line) => line.trim());
  if (options.removeEmpty) lines = lines.filter((line) => line.trim() !== "");
  if (options.deduplicate) lines = [...new Set(lines)];
  // 按 UTF-16 字符顺序排序，跨平台稳定，不依赖系统语言或拼音规则。
  if (options.sort !== "none") lines.sort();
  if (options.sort === "descending") lines.reverse();
  return lines.join("\n");
}
