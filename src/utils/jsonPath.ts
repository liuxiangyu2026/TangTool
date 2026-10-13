import { JSONPathJS } from "jsonpath-js";
import { t } from "../i18n/core";

export type JsonPathResult = { values: string; paths: string; count: number };
export function queryJsonPath(input: string, expression: string, indent = 2): JsonPathResult {
  if (input.length > 2_000_000 || !expression.trim() || expression.length > 2000) throw new Error(t('JSON 最多 200 万字符，JSONPath 需要为 1～2000 字符。'));
  // 字符串字面量中的括号是数据；其余标识符调用一律拒绝，不启用脚本或函数扩展。
  const syntax = expression.replace(/'(?:\\.|[^'\\])*'|"(?:\\.|[^"\\])*"/g, "''");
  if (/[a-zA-Z_]\w*\s*\(/.test(syntax)) throw new Error(t('JSONPath 不支持脚本或函数调用。'));
  const value = JSON.parse(input, (_key, item: unknown) => {
    // 查询库按属性访问节点，去掉对象原型，确保 constructor 等只会匹配实际 JSON 字段。
    return item !== null && typeof item === "object" && !Array.isArray(item) ? Object.assign(Object.create(null), item) : item;
  });
  const matches = new JSONPathJS(expression).paths(value);
  if (matches.length > 5000) throw new Error(t('查询结果超过 5000 项，请缩小查询范围。'));
  const values = JSON.stringify(matches.map(match => match.value), null, indent);
  const paths = JSON.stringify(matches, null, indent);
  if (values.length + paths.length > 4_000_000) throw new Error(t('查询结果过大，请缩小查询范围。'));
  return { values, paths, count: matches.length };
}
