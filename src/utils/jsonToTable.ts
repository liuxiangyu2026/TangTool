import { validateJson, type JsonErrorResult } from "./json";

export type JsonTableCellValue = string | number | boolean;
export type JsonTableRow = Record<string, JsonTableCellValue>;
export type JsonTableSheet = {
  name: string;
  columns: string[];
  rows: JsonTableRow[];
};
export type JsonArrayField = {
  key: string;
  path: string;
  segments: string[];
};
export type JsonRecursiveArrayField = {
  key: string;
  path: string;
};
export type JsonRecursiveFlattenResult = {
  path: string;
  maxDepth: number;
};

export type JsonToTableResult =
  | { ok: true; columns: string[]; rows: JsonTableRow[] }
  | JsonErrorResult;
export type JsonToWorkbookResult =
  | {
      ok: true;
      sheets: JsonTableSheet[];
      arrayFields: JsonArrayField[];
      recursiveArrayFields: JsonRecursiveArrayField[];
      repeatableColumns: string[];
      recursiveFlatten?: JsonRecursiveFlattenResult;
    }
  | JsonErrorResult;

export type JsonWorkbookOptions = {
  arrayPaths?: string[];
  repeatColumns?: string[];
  flattenRecursivePath?: string;
};

type RecursiveArrayFieldGroup = JsonRecursiveArrayField & {
  rootNodes: Record<string, unknown>[];
};

export function jsonToTable(input: string): JsonToTableResult {
  const result = jsonToWorkbook(input);
  if (!result.ok) {
    return result;
  }

  return {
    ok: true,
    columns: result.sheets[0].columns,
    rows: result.sheets[0].rows,
  };
}

export function jsonToWorkbook(input: string, options: JsonWorkbookOptions = {}): JsonToWorkbookResult {
  const validationResult = validateJson(input);
  if (!validationResult.ok) {
    return validationResult;
  }

  const value: unknown = JSON.parse(input);
  if ((Array.isArray(value) && value.length === 0) || (isJsonObject(value) && Object.keys(value).length === 0)) {
    return { ok: false, error: "没有可导出的数据" };
  }

  const parentValues = Array.isArray(value) ? value : [value];
  const arrayFields = collectArrayFields(parentValues);
  const recursiveFieldGroups = collectRecursiveArrayFields(parentValues);
  const recursiveArrayFields = recursiveFieldGroups.map(({ key, path }) => ({ key, path }));
  const selectedRecursiveField = recursiveFieldGroups.find((field) => field.path === options.flattenRecursivePath);
  const knownArrayPaths = new Set(arrayFields.map((field) => field.path));
  const selectedArrayPaths = new Set((options.arrayPaths ?? []).filter((path) => knownArrayPaths.has(path)));
  const repeatableTable = createTable(parentValues, knownArrayPaths);
  const repeatColumns = (options.repeatColumns ?? []).filter((column) => repeatableTable.columns.includes(column));

  if (selectedRecursiveField) {
    const flattenedTable = createRecursiveFlatTable(selectedRecursiveField.rootNodes, selectedRecursiveField.key);
    return {
      ok: true,
      sheets: [{ name: "JSON Data", columns: flattenedTable.columns, rows: flattenedTable.rows }],
      arrayFields,
      recursiveArrayFields,
      repeatableColumns: repeatableTable.columns,
      recursiveFlatten: { path: selectedRecursiveField.path, maxDepth: flattenedTable.maxDepth },
    };
  }

  const sheets: JsonTableSheet[] = [{
    name: "JSON Data",
    ...createTable(parentValues, selectedArrayPaths),
  }];

  for (const field of arrayFields) {
    if (!selectedArrayPaths.has(field.path)) {
      continue;
    }

    const sheet = createArraySheet(parentValues, field, repeatColumns, knownArrayPaths);
    if (sheet.rows.length > 0) {
      sheets.push(sheet);
    }
  }

  return { ok: true, sheets, arrayFields, recursiveArrayFields, repeatableColumns: repeatableTable.columns };
}

function createTable(values: unknown[], omittedPaths: Set<string> = new Set()): Pick<JsonTableSheet, "columns" | "rows"> {
  const columns: string[] = [];
  const columnSet = new Set<string>();
  const rows = values.map((value) => {
    const row = createRow();

    if (isJsonObject(value) && Object.keys(value).length > 0) {
      flattenObject(value, "", row, columns, columnSet, omittedPaths);
    } else {
      setCell(row, "value", toCellValue(value), columns, columnSet);
    }

    return row;
  });

  return { columns, rows };
}

function flattenObject(value: Record<string, unknown>, prefix: string, row: JsonTableRow, columns: string[], columnSet: Set<string>, omittedPaths: Set<string> = new Set()) {
  for (const [key, nestedValue] of Object.entries(value)) {
    const path = appendPath(prefix, key);

    if (omittedPaths.has(path)) {
      continue;
    }

    if (isJsonObject(nestedValue) && Object.keys(nestedValue).length > 0) {
      flattenObject(nestedValue, path, row, columns, columnSet, omittedPaths);
      continue;
    }

    setCell(row, path, toCellValue(nestedValue), columns, columnSet);
  }
}

function collectArrayFields(values: unknown[]): JsonArrayField[] {
  const fields: JsonArrayField[] = [];
  const paths = new Set<string>();

  for (const value of values) {
    if (isJsonObject(value)) {
      visitObject(value, "", [], fields, paths);
    }
  }

  return fields;
}

function visitObject(value: Record<string, unknown>, prefix: string, parentSegments: string[], fields: JsonArrayField[], paths: Set<string>) {
  for (const [key, nestedValue] of Object.entries(value)) {
    const path = appendPath(prefix, key);
    const segments = [...parentSegments, key];

    if (Array.isArray(nestedValue)) {
      if (!paths.has(path)) {
        paths.add(path);
        fields.push({ key, path, segments });
      }
      continue;
    }

    if (isJsonObject(nestedValue)) {
      visitObject(nestedValue, path, segments, fields, paths);
    }
  }
}

function collectRecursiveArrayFields(values: unknown[]): RecursiveArrayFieldGroup[] {
  const candidates = new Map<string, JsonRecursiveArrayField>();

  for (const value of values) {
    if (isJsonObject(value)) {
      visitRecursiveCandidates(value, "", candidates);
    }
  }

  return Array.from(candidates.values()).map((field) => ({
    ...field,
    rootNodes: collectRecursiveRootNodes(values, field.path),
  }));
}

function visitRecursiveCandidates(value: Record<string, unknown>, prefix: string, candidates: Map<string, JsonRecursiveArrayField>) {
  for (const [key, nestedValue] of Object.entries(value)) {
    const path = appendPath(prefix, key);

    if (Array.isArray(nestedValue)) {
      // 同名数组在子节点中再次出现，才视为树形递归字段。
      if (nestedValue.some((item) => isJsonObject(item) && Array.isArray(item[key]))) {
        candidates.set(path, { key, path });
        continue;
      }

      for (const item of nestedValue) {
        if (isJsonObject(item)) {
          visitRecursiveCandidates(item, `${path}[]`, candidates);
        }
      }
      continue;
    }

    if (isJsonObject(nestedValue)) {
      visitRecursiveCandidates(nestedValue, path, candidates);
    }
  }
}

function collectRecursiveRootNodes(values: unknown[], targetPath: string): Record<string, unknown>[] {
  const rootNodes: Record<string, unknown>[] = [];

  for (const value of values) {
    if (isJsonObject(value)) {
      visitRecursiveRootNodes(value, "", targetPath, rootNodes);
    }
  }

  return rootNodes;
}

function visitRecursiveRootNodes(value: Record<string, unknown>, prefix: string, targetPath: string, rootNodes: Record<string, unknown>[]) {
  for (const [key, nestedValue] of Object.entries(value)) {
    const path = appendPath(prefix, key);

    if (Array.isArray(nestedValue)) {
      if (path === targetPath) {
        rootNodes.push(value);
        continue;
      }

      for (const item of nestedValue) {
        if (isJsonObject(item)) {
          visitRecursiveRootNodes(item, `${path}[]`, targetPath, rootNodes);
        }
      }
      continue;
    }

    if (isJsonObject(nestedValue)) {
      visitRecursiveRootNodes(nestedValue, path, targetPath, rootNodes);
    }
  }
}

function createRecursiveFlatTable(rootNodes: Record<string, unknown>[], childKey: string): Pick<JsonTableSheet, "columns" | "rows"> & { maxDepth: number } {
  const leafPaths: unknown[][] = [];
  const stack = rootNodes.slice().reverse().map((node) => ({ node, ancestors: [] as unknown[] }));

  while (stack.length > 0) {
    const current = stack.pop()!;
    const children = isJsonObject(current.node) ? current.node[childKey] : undefined;

    if (Array.isArray(children) && children.length > 0) {
      for (let index = children.length - 1; index >= 0; index--) {
        stack.push({ node: children[index], ancestors: [...current.ancestors, current.node] });
      }
      continue;
    }

    leafPaths.push([...current.ancestors, current.node]);
  }

  const levelColumns: string[][] = [];
  const levelColumnSets: Set<string>[] = [];
  const omittedChildPath = new Set([appendPath("", childKey)]);
  const rows = leafPaths.map((nodes) => {
    const row = createRow();

    nodes.forEach((node, levelIndex) => {
      const nodeTable = createTable([node], omittedChildPath);
      const levelColumnsForNode = levelColumns[levelIndex] ?? (levelColumns[levelIndex] = []);
      const levelColumnSet = levelColumnSets[levelIndex] ?? (levelColumnSets[levelIndex] = new Set());

      for (const column of nodeTable.columns) {
        const levelColumn = prefixLevelColumn(levelIndex, column);
        row[levelColumn] = nodeTable.rows[0][column];

        if (!levelColumnSet.has(levelColumn)) {
          levelColumnSet.add(levelColumn);
          levelColumnsForNode.push(levelColumn);
        }
      }
    });

    return row;
  });

  return {
    columns: levelColumns.flat(),
    rows,
    maxDepth: levelColumns.length,
  };
}

function prefixLevelColumn(levelIndex: number, column: string): string {
  const levelName = `第${levelIndex + 1}级`;
  return column.startsWith("[") ? `${levelName}${column}` : `${levelName}.${column}`;
}

function createArraySheet(parentValues: unknown[], field: JsonArrayField, repeatColumns: string[], knownArrayPaths: Set<string>): JsonTableSheet {
  const columns = [...repeatColumns];
  const columnSet = new Set(columns);
  const childColumnNames = new Map<string, string>();
  const rows: JsonTableRow[] = [];

  for (const parentValue of parentValues) {
    if (!isJsonObject(parentValue)) {
      continue;
    }

    const arrayValue = getPathValue(parentValue, field.segments);
    if (!Array.isArray(arrayValue) || arrayValue.length === 0) {
      continue;
    }

    const parentTable = createTable([parentValue], knownArrayPaths);
    const parentRow = parentTable.rows[0];

    for (const item of arrayValue) {
      const row = createRow();
      for (const column of repeatColumns) {
        if (parentRow[column] !== undefined) {
          row[column] = parentRow[column];
        }
      }

      appendArrayItem(item, row, columns, columnSet, new Set(repeatColumns), childColumnNames);
      rows.push(row);
    }
  }

  return { name: field.key, columns, rows };
}

function appendArrayItem(item: unknown, row: JsonTableRow, columns: string[], columnSet: Set<string>, reservedColumns: Set<string>, childColumnNames: Map<string, string>) {
  const itemRow = createRow();
  const itemColumns: string[] = [];
  const itemColumnSet = new Set<string>();

  if (isJsonObject(item) && Object.keys(item).length > 0) {
    flattenObject(item, "", itemRow, itemColumns, itemColumnSet);
  } else {
    setCell(itemRow, "value", toCellValue(item), itemColumns, itemColumnSet);
  }

  for (const column of itemColumns) {
    const targetColumn = createChildColumnName(column, reservedColumns, columnSet, childColumnNames);
    setCell(row, targetColumn, itemRow[column], columns, columnSet);
  }
}

function createChildColumnName(column: string, reservedColumns: Set<string>, existingColumns: Set<string>, childColumnNames: Map<string, string>): string {
  const existingName = childColumnNames.get(column);
  if (existingName) {
    return existingName;
  }

  let candidate = reservedColumns.has(column) ? `item.${column}` : column;
  let suffix = 2;
  while (existingColumns.has(candidate)) {
    candidate = `item.${column}_${suffix}`;
    suffix++;
  }

  childColumnNames.set(column, candidate);
  return candidate;
}

function getPathValue(value: Record<string, unknown>, segments: string[]): unknown {
  let current: unknown = value;

  for (const segment of segments) {
    if (!isJsonObject(current)) {
      return undefined;
    }
    current = current[segment];
  }

  return current;
}

function setCell(row: JsonTableRow, column: string, value: JsonTableCellValue, columns: string[], columnSet: Set<string>) {
  row[column] = value;

  if (!columnSet.has(column)) {
    columnSet.add(column);
    columns.push(column);
  }
}

function toCellValue(value: unknown): JsonTableCellValue {
  if (value === null) {
    return "null";
  }

  if (Array.isArray(value) || isJsonObject(value)) {
    return JSON.stringify(value);
  }

  return value as JsonTableCellValue;
}

function appendPath(prefix: string, key: string): string {
  const segment = /^[A-Za-z_$][\w$]*$/.test(key) ? key : `[${JSON.stringify(key)}]`;

  if (prefix === "") {
    return segment;
  }

  return segment.startsWith("[") ? `${prefix}${segment}` : `${prefix}.${segment}`;
}

function createRow(): JsonTableRow {
  return Object.create(null) as JsonTableRow;
}

function isJsonObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
