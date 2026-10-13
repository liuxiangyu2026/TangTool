import { parseDocument, stringify } from "yaml";
import { t } from "../i18n/core";

/** YAML 先保留 Map 的键类型，再转换；不把数字/复合键静默转成字符串，也不展开循环别名。 */
export function convertJsonYaml(input: string, direction: "json-yaml" | "yaml-json", indent = 2): string {
  if (!input.trim() || input.length > 2_000_000) throw new Error(t('请输入内容，最多 200 万字符。'));
  let value: unknown;
  if (direction === "json-yaml") value = JSON.parse(input);
  else {
    const document = parseDocument(input, { version: "1.2", schema: "core", uniqueKeys: true, intAsBigInt: true, merge: false });
    if (document.errors.length) throw document.errors[0];
    if (document.warnings.length) throw document.warnings[0];
    value = document.toJS({ mapAsMap: true, maxAliasCount: 100 });
  }
  let nodes = 0;
  const ancestors = new WeakSet<object>();
  function compatible(item: unknown, depth: number): unknown {
    if (++nodes > 100_000 || depth > 200) throw new Error(t('数据过深或展开后过大，请缩小输入。'));
    if (typeof item === "bigint") {
      if (item > BigInt(Number.MAX_SAFE_INTEGER) || item < BigInt(Number.MIN_SAFE_INTEGER)) throw new Error(t('存在超出 JSON 安全整数范围的数值，请先改为字符串。'));
      return Number(item);
    }
    if (typeof item === "number" && Number.isInteger(item) && !Number.isSafeInteger(item)) throw new Error(t('存在超出 JSON 安全整数范围的数值，请先改为字符串。'));
    if (typeof item === "number" && !Number.isFinite(item)) throw new Error(t('JSON 不支持 NaN 或 Infinity，请先改为字符串。'));
    if (item === null || typeof item !== "object") return item;
    if (ancestors.has(item)) throw new Error(t('存在循环引用，无法转换为 JSON。'));
    ancestors.add(item);
    let result: unknown;
    if (Array.isArray(item)) result = item.map(child => compatible(child, depth + 1));
    else {
      const record: Record<string, unknown> = Object.create(null);
      const entries = item instanceof Map ? [...item.entries()] : Object.entries(item);
      for (const [key, child] of entries) {
        if (typeof key !== "string") throw new Error(t('JSON 对象的键必须是字符串，不能转换 YAML 的数字或复合键。'));
        Object.defineProperty(record, key, { value: compatible(child, depth + 1), enumerable: true });
      }
      result = record;
    }
    ancestors.delete(item);
    return result;
  }
  const normalized = compatible(value, 0);
  const output = direction === "json-yaml" ? stringify(normalized, { indent, lineWidth: 0 }) : JSON.stringify(normalized, null, indent);
  if (output.length > 2_000_000) throw new Error(t('转换结果超过 200 万字符，请缩小输入。'));
  return output;
}
