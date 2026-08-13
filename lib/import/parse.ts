import Papa from "papaparse";
import ExcelJS from "exceljs";

export type ParsedSpreadsheet = { headers: string[]; rows: string[][] };

// Schutz gegen versehentlich riesige Dateien — Vereins-Scoutinglisten
// liegen erfahrungsgemäß im Bereich von einigen hundert Zeilen.
const MAX_ROWS = 2000;

export async function parseSpreadsheet(
  buffer: Buffer,
  fileType: "csv" | "xlsx"
): Promise<ParsedSpreadsheet> {
  return fileType === "csv" ? parseCsv(buffer) : parseXlsx(buffer);
}

function parseCsv(buffer: Buffer): ParsedSpreadsheet {
  const text = buffer.toString("utf-8");
  const result = Papa.parse<string[]>(text, { skipEmptyLines: true });
  const [headerRow, ...dataRows] = result.data;

  if (!headerRow) return { headers: [], rows: [] };

  return {
    headers: headerRow.map((h) => String(h ?? "").trim()),
    rows: dataRows
      .slice(0, MAX_ROWS)
      .map((row) => row.map((cell) => String(cell ?? "").trim())),
  };
}

async function parseXlsx(buffer: Buffer): Promise<ParsedSpreadsheet> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ArrayBuffer);
  const sheet = workbook.worksheets[0];

  if (!sheet) return { headers: [], rows: [] };

  const headers: string[] = [];
  sheet.getRow(1).eachCell({ includeEmpty: true }, (cell, colNumber) => {
    headers[colNumber - 1] = cellToString(cell.value).trim();
  });

  const rows: string[][] = [];
  const lastRow = Math.min(sheet.rowCount, MAX_ROWS + 1);

  for (let r = 2; r <= lastRow; r++) {
    const row = sheet.getRow(r);
    const values: string[] = [];
    for (let c = 1; c <= headers.length; c++) {
      values[c - 1] = cellToString(row.getCell(c).value).trim();
    }
    if (values.some((v) => v !== "")) rows.push(values);
  }

  return { headers, rows };
}

function cellToString(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return formatDateIso(value);
  if (typeof value === "object") {
    if ("text" in value && typeof value.text === "string") return value.text;
    if ("result" in value) return String((value as { result: unknown }).result ?? "");
  }
  return String(value);
}

export function formatDateIso(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

// Akzeptiert ISO (YYYY-MM-DD) und das im deutschen Vereinsumfeld übliche
// DD.MM.YYYY. Gibt null zurück, wenn das Format nicht erkannt wird.
export function parseDateValue(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;

  const deMatch = trimmed.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (deMatch) {
    const [, d, m, y] = deMatch;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  return null;
}
