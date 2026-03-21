/**
 * Universal File Parser — CSV, Excel, PDF, Word
 *
 * Parses any supported file format into a unified ParsedFile structure.
 * CSV and Excel are parsed client-side for instant feedback.
 * PDF and Word go through a server-side extraction endpoint.
 */

import Papa from 'papaparse';
import ExcelJS from 'exceljs';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ParsedFile {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
  fileName: string;
  fileType: 'csv' | 'xlsx' | 'xls' | 'pdf' | 'docx';
  parseWarnings?: string[];
  rawPreview?: string;
}

export type SupportedFileType = 'csv' | 'xlsx' | 'xls' | 'pdf' | 'docx';

const SUPPORTED_EXTENSIONS: Record<string, SupportedFileType> = {
  csv: 'csv',
  xlsx: 'xlsx',
  xls: 'xls',
  pdf: 'pdf',
  docx: 'docx',
};

// ---------------------------------------------------------------------------
// Main Entry
// ---------------------------------------------------------------------------

export async function parseFile(file: File): Promise<ParsedFile> {
  const ext = file.name.split('.').pop()?.toLowerCase() ?? '';
  const fileType = SUPPORTED_EXTENSIONS[ext];

  if (!fileType) {
    throw new Error(
      `Unsupported file type: .${ext}. Supported formats: CSV, Excel (.xlsx, .xls), PDF, Word (.docx)`,
    );
  }

  switch (fileType) {
    case 'csv':
      return parseCsvFile(file);
    case 'xlsx':
    case 'xls':
      return parseExcelFile(file);
    case 'pdf':
    case 'docx':
      return parseDocumentFile(file, fileType);
  }
}

export function getSupportedExtensions(): string[] {
  return Object.keys(SUPPORTED_EXTENSIONS);
}

export function getAcceptString(): string {
  return '.csv,.xlsx,.xls,.pdf,.docx';
}

// ---------------------------------------------------------------------------
// CSV Parser
// ---------------------------------------------------------------------------

async function parseCsvFile(file: File): Promise<ParsedFile> {
  const text = await file.text();
  const warnings: string[] = [];

  return new Promise((resolve, reject) => {
    Papa.parse(text, {
      header: true,
      skipEmptyLines: 'greedy',
      dynamicTyping: false,
      transformHeader: (header: string) => header.trim(),
      complete: (results) => {
        if (results.errors.length > 0) {
          const critical = results.errors.filter(
            (e) => e.type === 'Quotes' || e.type === 'FieldMismatch',
          );
          if (critical.length > 0) {
            warnings.push(
              `${critical.length} parsing issue(s) detected. Some rows may have misaligned columns.`,
            );
          }
        }

        const headers = results.meta.fields ?? [];
        // Filter out empty headers
        const cleanHeaders = headers.filter((h) => h.trim().length > 0);
        const rows = (results.data as Record<string, string>[]).map((row) => {
          const clean: Record<string, string> = {};
          for (const h of cleanHeaders) {
            clean[h] = String(row[h] ?? '').trim();
          }
          return clean;
        });

        // Remove rows that are completely empty
        const nonEmptyRows = rows.filter((row) => Object.values(row).some((v) => v.length > 0));

        resolve({
          headers: cleanHeaders,
          rows: nonEmptyRows,
          totalRows: nonEmptyRows.length,
          fileName: file.name,
          fileType: 'csv',
          parseWarnings: warnings.length > 0 ? warnings : undefined,
        });
      },
      error: (error: Error) => {
        reject(new Error(`Failed to parse CSV: ${error.message}`));
      },
    });
  });
}

// ---------------------------------------------------------------------------
// Excel Parser
// ---------------------------------------------------------------------------

async function parseExcelFile(file: File): Promise<ParsedFile> {
  const buffer = await file.arrayBuffer();
  const workbook = new ExcelJS.Workbook();
  const warnings: string[] = [];

  try {
    await workbook.xlsx.load(buffer);
  } catch {
    throw new Error(
      'Failed to parse Excel file. Please make sure it is a valid .xlsx or .xls file.',
    );
  }

  const worksheet = workbook.worksheets[0];
  if (!worksheet || worksheet.rowCount === 0) {
    throw new Error('Excel file is empty or has no worksheets.');
  }

  if (workbook.worksheets.length > 1) {
    warnings.push(
      `This file has ${workbook.worksheets.length} sheets. Only the first sheet ("${worksheet.name}") will be imported.`,
    );
  }

  // Extract headers from first row
  const headerRow = worksheet.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell({ includeEmpty: false }, (cell, colNumber) => {
    const value = cellToString(cell);
    headers[colNumber - 1] = value.trim();
  });

  // Remove trailing empty headers
  while (headers.length > 0 && !headers[headers.length - 1]) {
    headers.pop();
  }

  if (headers.length === 0) {
    throw new Error('No headers found in the first row of the spreadsheet.');
  }

  // Extract data rows
  const rows: Record<string, string>[] = [];
  for (let rowNum = 2; rowNum <= worksheet.rowCount; rowNum++) {
    const row = worksheet.getRow(rowNum);
    const record: Record<string, string> = {};
    let hasData = false;

    for (let i = 0; i < headers.length; i++) {
      const cell = row.getCell(i + 1);
      const value = cellToString(cell).trim();
      const header = headers[i];
      if (header) {
        record[header] = value;
        if (value.length > 0) hasData = true;
      }
    }

    if (hasData) rows.push(record);
  }

  return {
    headers: headers.filter(Boolean),
    rows,
    totalRows: rows.length,
    fileName: file.name,
    fileType: file.name.endsWith('.xls') ? 'xls' : 'xlsx',
    parseWarnings: warnings.length > 0 ? warnings : undefined,
  };
}

function cellToString(cell: ExcelJS.Cell): string {
  if (cell.value === null || cell.value === undefined) return '';
  if (cell.type === ExcelJS.ValueType.Date && cell.value instanceof Date) {
    return cell.value.toISOString().split('T')[0] ?? '';
  }
  if (typeof cell.value === 'object' && 'text' in cell.value) {
    return String((cell.value as { text: string }).text);
  }
  if (typeof cell.value === 'object' && 'result' in cell.value) {
    return String((cell.value as { result: unknown }).result ?? '');
  }
  return String(cell.value);
}

// ---------------------------------------------------------------------------
// PDF / Word Parser (Server-side extraction)
// ---------------------------------------------------------------------------

async function parseDocumentFile(file: File, fileType: 'pdf' | 'docx'): Promise<ParsedFile> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('fileType', fileType);

  const response = await fetch('/api/v1/import/parse-document', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Unknown error' }));
    throw new Error(error.message || `Failed to parse ${fileType.toUpperCase()} file`);
  }

  const result = await response.json();

  return {
    headers: result.headers,
    rows: result.rows,
    totalRows: result.totalRows,
    fileName: file.name,
    fileType,
    parseWarnings: result.parseWarnings,
    rawPreview: result.rawPreview,
  };
}
