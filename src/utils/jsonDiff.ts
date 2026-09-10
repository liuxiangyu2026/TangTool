import diff from "microdiff";

import { validateJson, type JsonErrorResult } from "./json";

export type JsonDiffChange =
  | { type: "added"; path: (string | number)[]; pathLabel: string; newValue: unknown }
  | { type: "removed"; path: (string | number)[]; pathLabel: string; oldValue: unknown }
  | { type: "changed"; path: (string | number)[]; pathLabel: string; oldValue: unknown; newValue: unknown };

export type CompareJsonResult =
  | { ok: true; changes: JsonDiffChange[] }
  | JsonPairErrorResult;

export type AlignJsonKeysResult =
  | { ok: true; leftValue: string; rightValue: string }
  | JsonPairErrorResult;

type JsonPairErrorResult = { ok: false; leftError?: JsonErrorResult; rightError?: JsonErrorResult };
type ParsedJsonPairResult =
  | { ok: true; leftValue: unknown; rightValue: unknown }
  | JsonPairErrorResult;

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

export function alignJsonKeys(leftInput: string, rightInput: string): AlignJsonKeysResult {
  const parsedResult = parseJsonPair(leftInput, rightInput);
  if (!parsedResult.ok) {
    return parsedResult;
  }

  const [leftValue, rightValue] = alignJsonValues(parsedResult.leftValue, parsedResult.rightValue);
  return {
    ok: true,
    leftValue: JSON.stringify(leftValue, null, 2),
    rightValue: JSON.stringify(rightValue, null, 2),
  };
}

function parseJsonPair(leftInput: string, rightInput: string): ParsedJsonPairResult {
  const leftValidation = validateJson(leftInput);
  const rightValidation = validateJson(rightInput);

  if (!leftValidation.ok || !rightValidation.ok) {
    return {
      ok: false,
      leftError: leftValidation.ok ? undefined : leftValidation,
      rightError: rightValidation.ok ? undefined : rightValidation,
    };
  }

  return {
    ok: true,
    leftValue: JSON.parse(leftInput),
    rightValue: JSON.parse(rightInput),
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
  const alignedLeft: Record<string, unknown> = {};
  const alignedRight: Record<string, unknown> = {};

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

    return /^[A-Za-z_$][\w$]*$/.test(segment)
      ? `${result}.${segment}`
      : `${result}[${JSON.stringify(segment)}]`;
  }, "$");
}
