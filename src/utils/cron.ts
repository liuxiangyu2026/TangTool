import { t } from "../i18n/core";
import { CronDate, CronExpressionParser } from "cron-parser";
import cronstrue from "cronstrue";
import "cronstrue/locales/zh_CN";
import { parseIsoDate } from "./developerTools";

export type CronDialect = "auto" | "unix" | "seconds" | "quartz" | "spring";
export type CronResult = {
  description: string;
  englishDescription: string;
  fields: string[];
  fieldNames: string[];
  dates: string[];
  dayOr: boolean;
  dialect: Exclude<CronDialect, "auto">;
  ambiguous: boolean;
  reboot: boolean;
};

const macros: Record<string, string> = {
  "@YEARLY": "0 0 1 1 *", "@ANNUALLY": "0 0 1 1 *", "@MONTHLY": "0 0 1 * *",
  "@WEEKLY": "0 0 * * 0", "@DAILY": "0 0 * * *", "@MIDNIGHT": "0 0 * * *",
  "@HOURLY": "0 * * * *", "@MINUTELY": "* * * * *", "@SECONDLY": "* * * * * *",
  "@WEEKDAYS": "0 0 * * MON-FRI", "@WEEKENDS": "0 0 * * SUN,SAT",
};
const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const weekdays = ["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"];

/** 先展开范围及步长，再处理 Quartz 星期编号，保持范围与步长的含义。 */
function expandField(field: string, min: number, max: number, wrap = false): Set<number> {
  const values = new Set<number>();
  for (const part of field.split(",")) {
    const match = /^(\*|\d+(?:-\d+)?)(?:\/(\d+))?$/.exec(part);
    if (!match) throw new Error(t('Cron 字段无效：{field}', { field }));
    const step = match[2] === undefined ? 1 : Number(match[2]);
    if (step < 1 || step > max - min + 1) throw new Error(t('Cron 步长超出范围：{field}', { field }));
    const range = match[1] === "*" ? [min, max] : match[1]!.split("-").map(Number);
    const first = range[0]!;
    const last = range[1] ?? (match[2] ? max : first);
    if (first < min || first > max || last < min || last > max || (last < first && !wrap)) {
      throw new Error(t('Cron 字段超出范围：{field}', { field }));
    }
    const length = last >= first ? last - first : max - first + last - min + 1;
    for (let offset = 0; offset <= length; offset += step) values.add(min + (first - min + offset) % (max - min + 1));
  }
  return values;
}

type DayMatcher = (year: number, month: number, day: number) => boolean;

function dayMatcher(field: string, weekday: boolean, quartz: boolean, extended: boolean): DayMatcher {
  if (field === "*" || field === "?") return () => true;
  const min = weekday ? (quartz ? 1 : 0) : 1;
  const max = weekday ? 7 : 31;
  const matchers: DayMatcher[] = [];
  for (const part of field.split(",")) {
    if (extended && !weekday && /^(L(?:-\d+)?W?|\d+W)$/.test(part)) {
      const offset = part.startsWith("L-") ? Number(part.slice(2).replace("W", "")) : 0;
      const target = part.endsWith("W") && !part.startsWith("L") ? Number(part.slice(0, -1)) : null;
      if (offset > 30 || (target !== null && (target < 1 || target > 31))) throw new Error(t('Cron 字段超出范围：{field}', { field }));
      matchers.push((year, month, day) => {
        const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
        let selected = target ?? last - offset;
        if (selected < 1 || selected > last) return false;
        if (part.endsWith("W")) {
          const dow = new Date(Date.UTC(year, month - 1, selected)).getUTCDay();
          // 最近工作日不跨月：月初周六向后移，月末周日向前移。
          if (dow === 6) selected += selected === 1 ? 2 : -1;
          if (dow === 0) selected += selected === last ? -2 : 1;
        }
        return day === selected;
      });
    } else if (extended && weekday && /^(\d+L|\d+#[1-5]|L)$/.test(part)) {
      const special = /^(\d+)(L|#[1-5])$/.exec(part);
      const value = special ? Number(special[1]) : 7;
      if (value < min || value > max || (!quartz && !special)) throw new Error(t('Cron 字段无效：{field}', { field }));
      const expected = quartz ? value - 1 : value % 7;
      matchers.push((year, month, day) => {
        if (new Date(Date.UTC(year, month - 1, day)).getUTCDay() !== expected) return false;
        // Quartz 单独的 L 等价于星期 7（周六），dL 才表示本月最后一个该星期。
        if (!special) return true;
        return special[2] === "L"
          ? day + 7 > new Date(Date.UTC(year, month, 0)).getUTCDate()
          : Math.ceil(day / 7) === Number(special[2]!.slice(1));
      });
    } else {
      const values = expandField(part, min, max, quartz);
      const normalized = new Set([...values].map(value => weekday ? (quartz ? value - 1 : value % 7) : value));
      matchers.push((year, month, day) => normalized.has(weekday ? new Date(Date.UTC(year, month - 1, day)).getUTCDay() : day));
    }
  }
  return (year, month, day) => matchers.some(match => match(year, month, day));
}

export function explainCron(expression: string, timeZone: string, start: string, requested: CronDialect = "auto"): CronResult {
  const input = expression.trim().toUpperCase();
  if (!input || input.length > 500) throw new Error(t('请输入不超过 500 字符的 Cron 表达式。'));
  if (!["auto", "unix", "seconds", "quartz", "spring"].includes(requested)) throw new Error(t('请选择有效的 Cron 格式。'));
  new Intl.DateTimeFormat("en", { timeZone }).format(new Date());
  const startDate = new Date(parseIsoDate(start));
  if (input === "@REBOOT") {
    return { description: "系统启动时执行；没有可按日历预测的执行时间。", englishDescription: "Run at system startup; future times cannot be predicted from a calendar.", fields: ["@reboot"], fieldNames: ["宏"], dates: [], dayOr: false, dialect: "unix", ambiguous: false, reboot: true };
  }
  if (input.startsWith("@") && !macros[input]) throw new Error(t('不支持的 Cron 宏：{field}', { field: input }));
  const fields = (macros[input] ?? input).split(/\s+/);
  const isMacro = Boolean(macros[input]);
  let dialect: Exclude<CronDialect, "auto">;
  if (isMacro) dialect = fields.length === 5 ? "unix" : "seconds";
  else if (requested !== "auto") dialect = requested;
  else if (fields.length === 5) dialect = "unix";
  else if (fields.length === 7 || fields.includes("?")) dialect = "quartz";
  else dialect = /[LW#]/.test(fields[3] + fields[5]) ? "spring" : "seconds";
  const quartz = dialect === "quartz";
  if ((dialect === "unix" && fields.length !== 5) || (!quartz && dialect !== "unix" && fields.length !== 6) || (quartz && fields.length !== 6 && fields.length !== 7)) {
    throw new Error(t('字段数与所选格式不符：Unix 为 5 段，秒级 / Spring 为 6 段，Quartz 为 6 或 7 段。'));
  }
  const normalized = fields.length === 5 ? ["0", ...fields] : [...fields];
  normalized[4] = normalized[4]!.replace(/JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC/g, name => String(months.indexOf(name) + 1));
  normalized[5] = normalized[5]!.replace(/SUN|MON|TUE|WED|THU|FRI|SAT/g, name => String(weekdays.indexOf(name) + (quartz ? 1 : 0)));
  if (normalized.some((field, index) => field.includes("?") && (index !== 3 && index !== 5 || field !== "?"))) {
    throw new Error(t('? 只能单独用于日期或星期字段。'));
  }
  if ((dialect === "unix" || dialect === "seconds") && normalized.some(field => /[?LW#]/.test(field))) {
    throw new Error(t('此语法需要选择 Quartz 或 Spring 格式。'));
  }
  if (quartz && (normalized[3] === "?") === (normalized[5] === "?")) {
    throw new Error(t('Quartz 的日期与星期字段必须且只能有一个使用 ?。'));
  }
  if (quartz && ((/[LW]/.test(normalized[3]!) && normalized[3]!.includes(",")) || (/[L#]/.test(normalized[5]!) && normalized[5]!.includes(",")))) {
    throw new Error(t('Quartz 的特殊日期规则不能与列表混用。'));
  }
  const seconds = expandField(normalized[0]!, 0, 59, quartz);
  const minutes = expandField(normalized[1]!, 0, 59, quartz);
  const hours = expandField(normalized[2]!, 0, 23, quartz);
  const allowedMonths = expandField(normalized[4]!, 1, 12, quartz);
  const localStart = new CronDate(startDate, timeZone);
  const firstYear = localStart.getFullYear();
  const years = quartz ? expandField(normalized[6] ?? "*", 1970, 9999) : null;
  // 无固定年份时，400 年覆盖完整公历周期；固定年份允许预览更远的日期。
  const lastYear = years && normalized[6] && normalized[6] !== "*" ? Math.max(...years) : Math.min(9999, firstYear + 400);
  const matchDay = dayMatcher(normalized[3]!, false, quartz, quartz || dialect === "spring");
  const matchWeek = dayMatcher(normalized[5]!, true, quartz, quartz || dialect === "spring");
  const dayOr = (dialect === "unix" || dialect === "seconds") && normalized[3] !== "*" && normalized[5] !== "*";
  const dates: string[] = [];
  // 先按公历选出当月有效日期，再交给已有引擎计算时区和夏令时；不逐秒扫描 W/年份。
  for (let year = firstYear; year <= lastYear && dates.length < 10; year++) {
    if (years && !years.has(year)) continue;
    for (let month = year === firstYear ? localStart.getMonth() + 1 : 1; month <= 12 && dates.length < 10; month++) {
      if (!allowedMonths.has(month)) continue;
      const days: number[] = [];
      const last = new Date(Date.UTC(year, month, 0)).getUTCDate();
      for (let day = 1; day <= last; day++) {
        const dom = matchDay(year, month, day);
        const dow = matchWeek(year, month, day);
        if (dayOr ? dom || dow : dom && dow) days.push(day);
      }
      if (!days.length) continue;
      const boundary = new CronDate(`${year}-${String(month).padStart(2, "0")}-01T00:00:00`, timeZone);
      const end = new CronDate(boundary);
      end.addMonth();
      const interval = CronExpressionParser.parse(`${[...seconds].join(",")} ${[...minutes].join(",")} ${[...hours].join(",")} ${days.join(",")} ${month} *`, {
        currentDate: new Date(Math.max(startDate.getTime(), boundary.toDate().getTime() - 1)),
        endDate: new Date(end.toDate().getTime() - 1), tz: timeZone,
      });
      while (dates.length < 10 && interval.hasNext()) dates.push(interval.next().toDate().toISOString());
    }
  }
  const descriptionOptions = { use24HourTimeFormat: true, logicalAndDayFields: dialect === "spring", dayOfWeekStartIndexZero: !quartz, throwExceptionOnParseError: true };
  let description = `Cron：${fields.join(" ")}`;
  let englishDescription = `Cron: ${fields.join(" ")}`;
  // 说明库会把 L-3W 误读成 3W，也无法可靠描述跨边界范围；这类规则直接展示字段。
  const wrapped = normalized.slice(0, 6).some(field => [...field.matchAll(/(\d+)-(\d+)/g)].some(match => Number(match[1]) > Number(match[2])));
  if (!/L-\d+W/.test(normalized[3]!) && !wrapped && normalized[5] !== "L") {
    try {
      const chinese = cronstrue.toString(fields.join(" "), { ...descriptionOptions, locale: "zh_CN" });
      const english = cronstrue.toString(fields.join(" "), { ...descriptionOptions, locale: "en" });
      description = chinese;
      englishDescription = english;
    } catch {
      // 预览由上面的严格规则驱动；说明库不认识某种组合时保留原规则，不伪造自然语言。
    }
  }
  return {
    description, englishDescription, fields,
    fieldNames: fields.length === 5 ? ["分", "时", "日", "月", "星期"] : ["秒", "分", "时", "日", "月", "星期", "年"].slice(0, fields.length),
    dates, dayOr, dialect, ambiguous: requested === "auto" && !isMacro && fields.length === 6, reboot: false,
  };
}
