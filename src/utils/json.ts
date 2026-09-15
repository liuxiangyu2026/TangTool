import { t } from "../i18n/core";
import { parser } from "@lezer/json";

export type JsonErrorResult = {
  ok: false;
  error: string;
  position?: number;
  line?: number;
  column?: number;
};

export type FormatJsonResult =
  | { ok: true; value: string }
  | JsonErrorResult;

export type ValidateJsonResult =
  | { ok: true }
  | JsonErrorResult;

type ParseJsonResult =
  | { ok: true; value: unknown }
  | JsonErrorResult;

export function formatJson(input: string, indent = 2): FormatJsonResult {
  const result = parseJson(input);

  if (!result.ok) {
    return result;
  }

  return { ok: true, value: JSON.stringify(result.value, null, indent) };
}

export function minifyJson(input: string): FormatJsonResult {
  return formatJson(input, 0);
}

export function validateJson(input: string): ValidateJsonResult {
  const result = parseJson(input);
  return result.ok ? { ok: true } : result;
}

export function formatJsonErrorMessage(result: JsonErrorResult): string {
  if (result.line === undefined || result.column === undefined) {
    return result.error;
  }

  return t('{p0}（第 {p1} 行，第 {p2} 列）', { p0: result.error, p1: result.line, p2: result.column });
}

function parseJson(input: string): ParseJsonResult {
  if (input.trim() === "") {
    return { ok: false, error: t('JSON 内容不能为空') };
  }

  try {
    return { ok: true, value: JSON.parse(input) };
  } catch (error) {
    const rawMessage = error instanceof Error ? error.message : t('JSON 格式无效');
    const position = getJsonErrorPosition(input, rawMessage);
    const { line, column } = getLineAndColumn(input, position);

    return {
      ok: false,
      error: normalizeJsonError(rawMessage),
      position,
      line,
      column,
    };
  }
}

function getJsonErrorPosition(input: string, message: string): number {
  const positionMatch = message.match(/at position (\d+)/i);
  if (positionMatch) {
    return Math.min(Number(positionMatch[1]), input.length);
  }

  const lineColumnMatch = message.match(/at line (\d+) column (\d+)/i);
  if (lineColumnMatch) {
    return getPositionFromLineAndColumn(input, Number(lineColumnMatch[1]), Number(lineColumnMatch[2]));
  }

  const cursor = parser.parse(input).cursor();
  do {
    if (cursor.type.isError) {
      return cursor.from;
    }
  } while (cursor.next());

  return 0;
}

function getPositionFromLineAndColumn(input: string, targetLine: number, targetColumn: number): number {
  const lineBreakPattern = /\r\n|\r|\n/g;
  let line = 1;
  let lineStart = 0;
  let match: RegExpExecArray | null;

  while (line < targetLine && (match = lineBreakPattern.exec(input))) {
    line++;
    lineStart = match.index + match[0].length;
  }

  return Math.min(lineStart + targetColumn - 1, input.length);
}

function getLineAndColumn(input: string, position: number): { line: number; column: number } {
  const contentBeforeError = input.slice(0, position);
  const lines = contentBeforeError.split(/\r\n|\r|\n/);

  return {
    line: lines.length,
    column: lines[lines.length - 1].length + 1,
  };
}

function normalizeJsonError(message: string): string {
  const reason = message
    .replace(/^JSON Parse error:\s*/i, "")
    .replace(/\s+at position \d+(?:\s+\(line \d+ column \d+\))?$/i, "")
    .replace(/\s+at line \d+ column \d+$/i, "")
    .trim();

  return t('JSON 语法错误：{p0}', { p0: reason || t('格式无效') });
}
