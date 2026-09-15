import { t } from "../i18n/core";
import { CronExpressionParser } from "cron-parser";
import cronstrue from "cronstrue";
import "cronstrue/locales/zh_CN";
import { parseIsoDate } from "./developerTools";

export type CronResult = { description: string; englishDescription: string; fields: string[]; dates: string[]; dayOr: boolean };

export function explainCron(expression: string, timeZone: string, start: string): CronResult {
  const fields = expression.trim().toUpperCase().split(/\s+/);
  if (fields.length !== 5) throw new Error(t('只支持标准 5 段：分 时 日 月 星期，不含秒或年份。'));
  const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const weekdays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];
  const normalized = fields.map((field, index) => {
    if (index === 3) field = field.replace(/[A-Z]+/g, (name) => String(months.indexOf(name) + 1 || name));
    if (index === 4) field = field.replace(/[A-Z]+/g, (name) => (weekdays.includes(name) ? String(weekdays.indexOf(name)) : name));
    if (!/^[\d*,/\-]+$/.test(field)) throw new Error(t('仅支持数字、*、列表、范围、步长及月份/星期缩写；不支持 Quartz 的 ?、L、W、#。'));
    return field;
  });
  new Intl.DateTimeFormat("zh-CN", { timeZone }).format(new Date());
  const interval = CronExpressionParser.parse(normalized.join(" "), { currentDate: new Date(parseIsoDate(start)), tz: timeZone });
  const dates = interval.take(10).map((date) => date.toDate().toISOString());
  return {
    description: cronstrue.toString(normalized.join(" "), { locale: "zh_CN", use24HourTimeFormat: true, logicalAndDayFields: false }),
    englishDescription: cronstrue.toString(normalized.join(" "), { locale: "en", use24HourTimeFormat: true, logicalAndDayFields: false }),
    fields,
    dates,
    dayOr: normalized[2] !== "*" && normalized[4] !== "*",
  };
}
