import { t } from "../i18n/core";
import { read, utils, type WorkSheet } from "xlsx";

export type TableJsonRequest = { data: ArrayBuffer; filename: string; sheet: string; allSheets: boolean; header: boolean; formatted: boolean; indent?: number };
export type TableJsonNote = { name: string; column: number; key: string };
export type TableJsonResult = { names: string[]; selected: string; json: string; rows: number; notes: TableJsonNote[] };

export function tableToJson(request: TableJsonRequest): TableJsonResult {
  const csv = /\.csv$/i.test(request.filename);
  let source: ArrayBuffer | string = request.data;
  if (csv) {
    try {
      source = new TextDecoder("utf-8", { fatal: true }).decode(request.data);
    } catch {
      throw new Error(t('CSV 不是有效 UTF-8，请先另存为 UTF-8 CSV。'));
    }
  }
  const workbook = read(source, { type: csv ? "string" : "array", raw: csv, cellDates: false, cellText: true, sheetRows: 10002 });
  if (!workbook.SheetNames.length || workbook.SheetNames.length > 50) throw new Error(t('工作表为空或超过 50 个，请拆分文件。'));
  const names = workbook.SheetNames;
  const selected = request.sheet && names.includes(request.sheet) ? request.sheet : names[0];
  const output: Record<string, unknown> = Object.create(null);
  const notes: TableJsonNote[] = [];
  let totalRows = 0;
  for (const name of request.allSheets ? names : [selected]) {
    const sheet: WorkSheet = workbook.Sheets[name];
    const reference = sheet["!fullref"] ?? sheet["!ref"];
    if (!reference) {
      output[name] = [];
      continue;
    }
    const range = utils.decode_range(reference);
    if (range.e.r - range.s.r + 1 > 10001 || range.e.c - range.s.c + 1 > 200) {
      throw new Error(t('工作表 {p0} 超出限制（最多 10000 行数据、200 列），未导出截断结果。', { p0: name }));
    }
    // 从实际使用范围开始；格式化模式保留单元格显示文本，原始模式保留数值/布尔值。
    const rows = utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: !request.formatted, defval: null, blankrows: false });
    if (!rows.length) {
      output[name] = [];
      continue;
    }
    const width = Math.max(...rows.map((row) => row.length));
    const headerRow = request.header ? rows.shift()! : [];
    const used = new Set<string>();
    const headers = Array.from({ length: width }, (_, index) => {
      const cell = headerRow[index];
      const base = cell === null || cell === undefined || String(cell).trim() === "" ? `column_${index + 1}` : String(cell);
      let key = base;
      let suffix = 2;
      while (used.has(key)) key = `${base}_${suffix++}`;
      used.add(key);
      if (request.header && key !== String(cell ?? "")) notes.push({ name, column: index + 1, key });
      return key;
    });
    totalRows += rows.length;
    if (totalRows > 20000) throw new Error(t('本次总数据超过 20000 行，请按工作表分别导出。'));
    output[name] = rows.map((row) => {
      const item: Record<string, unknown> = Object.create(null);
      headers.forEach((key, index) => {
        item[key] = row[index] ?? null;
      });
      return item;
    });
  }
  const json = JSON.stringify(request.allSheets ? output : output[selected], null, [2, 4, 8].includes(request.indent ?? 2) ? request.indent ?? 2 : 2);
  if (json.length > 5_000_000) throw new Error(t('JSON 结果超过 500 万字符，请缩小表格范围。'));
  return { names, selected, json, rows: totalRows, notes: notes.slice(0, 20) };
}
