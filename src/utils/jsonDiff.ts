import diff from "microdiff";

import { parseJson, type JsonErrorResult } from "./json";

export type JsonDiffChange =
  | { type: "added"; path: (string | number)[]; pathLabel: string; newValue: unknown }
  | { type: "removed"; path: (string | number)[]; pathLabel: string; oldValue: unknown }
  | { type: "changed"; path: (string | number)[]; pathLabel: string; oldValue: unknown; newValue: unknown };

export type CompareJsonResult = { ok: true; changes: JsonDiffChange[] } | JsonPairErrorResult;

export type JsonComparisonRow = {
  path: (string | number)[];
  pathLabel: string;
  type: "same" | "added" | "removed" | "changed";
  leftPresent: boolean;
  rightPresent: boolean;
  leftPreview: string;
  rightPreview: string;
  parent: number;
};

export type JsonComparisonResult = { ok: true; rows: JsonComparisonRow[]; differenceCount: number } | JsonPairErrorResult;

export function compareJsonRows(leftInput: string, rightInput: string, keysOnly = false): JsonComparisonResult {
  const parsed = parseJsonPair(leftInput, rightInput);
  if (!parsed.ok) return parsed;
  const rows: JsonComparisonRow[] = [];
  type Pending = { left: unknown; right: unknown; leftPresent: boolean; rightPresent: boolean; path: (string | number)[]; parent: number };
  const pending: Pending[] = [
    { left: parsed.leftValue, right: parsed.rightValue, leftPresent: true, rightPresent: true, path: [], parent: -1 },
  ];
  let differenceCount = 0;

  // 迭代遍历避免深层 JSON 的递归栈溢出；只保留短预览，不复制整棵子树到结果。
  while (pending.length) {
    const item = pending.pop()!;
    const { left, right, leftPresent, rightPresent, path, parent } = item;
    const leftContainer = left !== null && typeof left === "object";
    const rightContainer = right !== null && typeof right === "object";
    const sameContainer = leftContainer && rightContainer && Array.isArray(left) === Array.isArray(right);
    const type = !leftPresent
      ? "added"
      : !rightPresent
        ? "removed"
        : keysOnly || sameContainer || Object.is(left, right)
          ? "same"
          : "changed";
    const index = rows.length;
    rows.push({
      path,
      pathLabel: formatJsonPath(path),
      type,
      leftPresent,
      rightPresent,
      leftPreview: leftPresent ? previewJsonValue(left) : "",
      rightPreview: rightPresent ? previewJsonValue(right) : "",
      parent,
    });
    if (type !== "same") differenceCount++;

    const children = new Map<
      string,
      { segment: string | number; leftPresent: boolean; rightPresent: boolean; left: unknown; right: unknown }
    >();
    for (const [value, side] of [
      [left, "left"],
      [right, "right"],
    ] as const) {
      if (value === null || typeof value !== "object") continue;
      for (const key of Object.keys(value)) {
        const segment = Array.isArray(value) ? Number(key) : key;
        // 对象的 "0" 与数组的 [0] 是不同路径，不能把容器类型变化混为同一字段。
        const identity = `${typeof segment}:${key}`;
        const child = children.get(identity) ?? { segment, leftPresent: false, rightPresent: false, left: undefined, right: undefined };
        child[side] = (value as Record<string, unknown>)[key];
        if (side === "left") child.leftPresent = true;
        else child.rightPresent = true;
        children.set(identity, child);
      }
    }
    for (const child of [...children.values()].reverse()) {
      pending.push({ ...child, path: [...path, child.segment], parent: index });
    }
  }
  if (!keysOnly) {
    // 容器的颜色反映子项差异，但差异计数不重复累加祖先节点。
    for (let index = rows.length - 1; index > 0; index--) {
      const row = rows[index];
      if (row.type !== "same" && row.parent >= 0 && rows[row.parent].type === "same") rows[row.parent].type = "changed";
    }
  }
  return { ok: true, rows, differenceCount };
}

function previewJsonValue(value: unknown, depth = 0): string {
  if (Array.isArray(value)) {
    if (depth) return `[${value.length}]`;
    return `[${value.slice(0, 3).map(item => previewJsonValue(item, 1)).join(", ")}${value.length > 3 ? ", …" : ""}]`;
  }
  if (value !== null && typeof value === "object") {
    const keys = Object.keys(value);
    if (depth) return `{${keys.length}}`;
    const entries = keys.slice(0, 3).map(key => `${JSON.stringify(key.slice(0, 60))}: ${previewJsonValue((value as Record<string, unknown>)[key], 1)}`);
    return `{${entries.join(", ")}${keys.length > 3 ? ", …" : ""}}`;
  }
  const limit = depth ? 60 : 240;
  if (typeof value === "string") return JSON.stringify(value.length > limit ? `${value.slice(0, limit)}…` : value);
  return JSON.stringify(value) ?? "";
}

export type AlignJsonKeysResult = { ok: true; leftValue: string; rightValue: string } | JsonPairErrorResult;

type JsonPairErrorResult = { ok: false; leftError?: JsonErrorResult; rightError?: JsonErrorResult };
type ParsedJsonPairResult = { ok: true; leftValue: unknown; rightValue: unknown } | JsonPairErrorResult;

export function compareJson(leftInput: string, rightInput: string): CompareJsonResult {
  const parsedResult = parseJsonPair(leftInput, rightInput);
  if (!parsedResult.ok) {
    return parsedResult;
  }

  const { leftValue, rightValue } = parsedResult;

  if (!canCompareContainers(leftValue, rightValue)) {
    return Object.is(leftValue, rightValue)
      ? { ok: true, changes: [] }
      : { ok: true, changes: [{ type: "changed", path: [], pathLabel: "$", oldValue: leftValue, newValue: rightValue }] };
  }

  const leftContainer = leftValue as Record<string, unknown> | unknown[];
  const rightContainer = rightValue as Record<string, unknown> | unknown[];
  const changes: JsonDiffChange[] = diff(leftContainer, rightContainer, { cyclesFix: false }).map((change) => {
    const pathLabel = formatJsonPath(change.path);

    if (change.type === "CREATE") {
      return { type: "added", path: change.path, pathLabel, newValue: change.value };
    }

    if (change.type === "REMOVE") {
      return { type: "removed", path: change.path, pathLabel, oldValue: change.oldValue };
    }

    return { type: "changed", path: change.path, pathLabel, oldValue: change.oldValue, newValue: change.value };
  });

  return { ok: true, changes };
}

export function alignJsonKeys(leftInput: string, rightInput: string, indent = 2): AlignJsonKeysResult {
  const parsedResult = parseJsonPair(leftInput, rightInput);
  if (!parsedResult.ok) {
    return parsedResult;
  }

  const [leftValue, rightValue] = alignJsonValues(parsedResult.leftValue, parsedResult.rightValue);
  return {
    ok: true,
    leftValue: JSON.stringify(leftValue, null, indent),
    rightValue: JSON.stringify(rightValue, null, indent),
  };
}

function parseJsonPair(leftInput: string, rightInput: string): ParsedJsonPairResult {
  // 校验直接复用解析结果，避免大文档在一次对比中被重复解析。
  const leftValidation = parseJson(leftInput);
  const rightValidation = parseJson(rightInput);

  if (!leftValidation.ok || !rightValidation.ok) {
    return {
      ok: false,
      leftError: leftValidation.ok ? undefined : leftValidation,
      rightError: rightValidation.ok ? undefined : rightValidation,
    };
  }

  return {
    ok: true,
    leftValue: leftValidation.value,
    rightValue: rightValidation.value,
  };
}

function alignJsonValues(leftValue: unknown, rightValue: unknown): [unknown, unknown] {
  if (Array.isArray(leftValue) && Array.isArray(rightValue)) {
    const alignedLeft = [...leftValue];
    const alignedRight = [...rightValue];

    for (let index = 0; index < Math.min(leftValue.length, rightValue.length); index++) {
      [alignedLeft[index], alignedRight[index]] = alignJsonValues(leftValue[index], rightValue[index]);
    }

    return [alignedLeft, alignedRight];
  }

  if (!isJsonObject(leftValue) || !isJsonObject(rightValue)) {
    return [leftValue, rightValue];
  }

  const leftKeys = Object.keys(leftValue);
  const rightKeys = Object.keys(rightValue);
  const rightKeySet = new Set(rightKeys);
  const leftKeySet = new Set(leftKeys);
  const commonKeys = leftKeys.filter((key) => rightKeySet.has(key));
  const leftOnlyKeys = leftKeys.filter((key) => !rightKeySet.has(key));
  const rightOnlyKeys = rightKeys.filter((key) => !leftKeySet.has(key));
  const alignedLeft = Object.create(null) as Record<string, unknown>;
  const alignedRight = Object.create(null) as Record<string, unknown>;

  // Common keys follow the left input order. Side-only keys remain local and are appended last.
  for (const key of commonKeys) {
    [alignedLeft[key], alignedRight[key]] = alignJsonValues(leftValue[key], rightValue[key]);
  }

  for (const key of leftOnlyKeys) {
    alignedLeft[key] = leftValue[key];
  }

  for (const key of rightOnlyKeys) {
    alignedRight[key] = rightValue[key];
  }

  return [alignedLeft, alignedRight];
}

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function canCompareContainers(leftValue: unknown, rightValue: unknown): leftValue is Record<string, unknown> | unknown[] {
  if (leftValue === null || rightValue === null || typeof leftValue !== "object" || typeof rightValue !== "object") {
    return false;
  }

  return Array.isArray(leftValue) === Array.isArray(rightValue);
}

function formatJsonPath(path: (string | number)[]): string {
  return path.reduce<string>((result, segment) => {
    if (typeof segment === "number") {
      return `${result}[${segment}]`;
    }

    return /^[A-Za-z_$][\w$]*$/.test(segment) ? `${result}.${segment}` : `${result}[${JSON.stringify(segment)}]`;
  }, "$");
}
