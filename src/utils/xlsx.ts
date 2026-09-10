import { utils, write } from "xlsx";

import type { JsonTableRow, JsonTableSheet } from "./jsonToTable";

export function createXlsxData(sheets: JsonTableSheet[]): Uint8Array {
  const workbook = utils.book_new();
  const worksheetNames = createWorksheetNames(sheets.map((sheet) => sheet.name));

  sheets.forEach((sheet, index) => {
    const worksheet = utils.json_to_sheet(sheet.rows, { header: sheet.columns });
    worksheet["!cols"] = sheet.columns.map((column) => ({
      wch: Math.min(Math.max(getColumnWidth(column, sheet.rows), 10), 50),
    }));
    utils.book_append_sheet(workbook, worksheet, worksheetNames[index]);
  });

  const data = write(workbook, {
    bookType: "xlsx",
    type: "array",
    compression: true,
  }) as ArrayBuffer;

  return new Uint8Array(data);
}

export function createWorksheetNames(names: string[]): string[] {
  const usedNames = new Set<string>();

  return names.map((name, index) => {
    const sanitizedName = name.replace(/[\\/?*\[\]:]/g, "_").replace(/^'+|'+$/g, "").trim() || `Sheet${index + 1}`;
    const baseName = sanitizedName.slice(0, 31);
    let worksheetName = baseName;
    let suffix = 2;

    while (usedNames.has(worksheetName.toLocaleLowerCase())) {
      const suffixText = `_${suffix}`;
      worksheetName = `${baseName.slice(0, 31 - suffixText.length)}${suffixText}`;
      suffix++;
    }

    usedNames.add(worksheetName.toLocaleLowerCase());
    return worksheetName;
  });
}

function getColumnWidth(column: string, rows: JsonTableRow[]): number {
  let width = getDisplayWidth(column);

  for (const row of rows) {
    const value = row[column];
    if (value !== undefined) {
      width = Math.max(width, getDisplayWidth(String(value)));
    }
  }

  return width + 2;
}

function getDisplayWidth(value: string): number {
  return Array.from(value).reduce((width, character) => width + (character.codePointAt(0)! > 0xff ? 2 : 1), 0);
}
