/**
 * Document Parser API — Extract tabular data from PDF and Word files
 * Server-side because pdf-parse and mammoth need Node.js APIs
 */

import { NextRequest, NextResponse } from 'next/server';
import { guardRoute } from '@/server/middleware/api-guard';

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request, {
      roles: ['super_admin', 'property_admin', 'property_manager'],
    });
    if (auth.error) return auth.error;

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const fileType = formData.get('fileType') as string;

    if (!file) {
      return NextResponse.json(
        { error: 'MISSING_FILE', message: 'No file provided' },
        { status: 400 },
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    if (fileType === 'pdf') {
      return await parsePdf(buffer);
    } else if (fileType === 'docx') {
      return await parseDocx(buffer);
    }

    return NextResponse.json(
      { error: 'UNSUPPORTED', message: `Unsupported file type: ${fileType}` },
      { status: 400 },
    );
  } catch (error) {
    console.error('Document parse error:', error);
    return NextResponse.json(
      {
        error: 'PARSE_ERROR',
        message: 'Failed to extract data from document. Try exporting to CSV or Excel instead.',
      },
      { status: 422 },
    );
  }
}

// ---------------------------------------------------------------------------
// PDF Extraction
// ---------------------------------------------------------------------------

async function parsePdf(buffer: Buffer) {
  const warnings: string[] = [];

  // Use pdfjs-dist to get text items with their X positions.
  // This allows us to detect column boundaries by position gaps.
  try {
    const pdfjsLib = await import('pdfjs-dist/legacy/build/pdf.mjs');
    // Point worker to the actual file in node_modules
    const path = await import('path');
    pdfjsLib.GlobalWorkerOptions.workerSrc = path.resolve(
      process.cwd(),
      'node_modules/pdfjs-dist/legacy/build/pdf.worker.mjs',
    );
    const doc = await pdfjsLib.getDocument({
      data: new Uint8Array(buffer),
      useWorkerFetch: false,
      isEvalSupported: false,
      useSystemFonts: true,
    }).promise;

    // Collect all text items with their (x, y) positions across all pages
    type TextItem = { str: string; x: number; y: number; page: number };
    const allItems: TextItem[] = [];

    for (let pageNum = 1; pageNum <= doc.numPages; pageNum++) {
      const page = await doc.getPage(pageNum);
      const content = await page.getTextContent();
      for (const item of content.items) {
        if ('str' in item && item.str.trim()) {
          const tx = item.transform;
          allItems.push({
            str: item.str,
            x: Math.round(tx[4]),
            y: Math.round(tx[5]),
            page: pageNum,
          });
        }
      }
    }

    if (allItems.length === 0) {
      return NextResponse.json({
        headers: [],
        rows: [],
        totalRows: 0,
        parseWarnings: ['No text found in PDF.'],
        rawPreview: '',
      });
    }

    // Group items into rows by Y coordinate (items within 3px are same row)
    // Sort by page desc then Y desc (PDF Y goes bottom-to-top)
    allItems.sort((a, b) => a.page - b.page || b.y - a.y || a.x - b.x);

    const rowGroups: TextItem[][] = [];
    let currentRow: TextItem[] = [allItems[0]!];
    let currentY = allItems[0]!.y;
    let currentPage = allItems[0]!.page;

    for (let i = 1; i < allItems.length; i++) {
      const item = allItems[i]!;
      if (item.page === currentPage && Math.abs(item.y - currentY) < 4) {
        currentRow.push(item);
      } else {
        if (currentRow.length > 0) rowGroups.push(currentRow);
        currentRow = [item];
        currentY = item.y;
        currentPage = item.page;
      }
    }
    if (currentRow.length > 0) rowGroups.push(currentRow);

    // Sort items within each row by X position
    for (const row of rowGroups) {
      row.sort((a, b) => a.x - b.x);
    }

    // Find the header row: the FIRST row on page 1 that has many items
    // (skip title/subtitle rows which typically have 1-3 items)
    // The header row should have at least 4 items and be one of the first 10 rows
    let headerRowIdx = -1;
    const typicalDataColumnCount = Math.max(
      ...rowGroups.slice(0, Math.min(rowGroups.length, 20)).map((r) => r.length),
    );
    const headerThreshold = Math.max(4, Math.floor(typicalDataColumnCount * 0.5));

    for (let i = 0; i < Math.min(rowGroups.length, 15); i++) {
      const row = rowGroups[i]!;
      // Header rows are on page 1 and have enough items
      if (row[0]?.page === 1 && row.length >= headerThreshold) {
        // Check if items look like headers (contain text, not just numbers)
        const textItems = row.filter((item) => isNaN(Number(item.str.replace(/[,$%]/g, ''))));
        if (textItems.length >= Math.floor(row.length * 0.5)) {
          headerRowIdx = i;
          break;
        }
      }
    }

    // Fallback: first row with max items
    if (headerRowIdx === -1) {
      let maxItems = 0;
      for (let i = 0; i < Math.min(rowGroups.length, 10); i++) {
        if (rowGroups[i]!.length > maxItems) {
          maxItems = rowGroups[i]!.length;
          headerRowIdx = i;
        }
      }
    }

    const headerRow = rowGroups[headerRowIdx]!;
    if (headerRow.length < 2) {
      // Fallback to simple text extraction
      return fallbackPdfParse(buffer, warnings);
    }

    // Build column boundaries from header X positions
    const headers: string[] = headerRow.map((item) => item.str.trim());
    const colStarts: number[] = headerRow.map((item) => item.x);

    // Parse data rows (everything after the header)
    const dataRows: Record<string, string>[] = [];

    for (let r = headerRowIdx + 1; r < rowGroups.length; r++) {
      const rowItems = rowGroups[r]!;
      const record: Record<string, string> = {};

      // Assign each text item to the nearest column
      for (const item of rowItems) {
        let bestCol = 0;
        let bestDist = Math.abs(item.x - colStarts[0]!);
        for (let c = 1; c < colStarts.length; c++) {
          const dist = Math.abs(item.x - colStarts[c]!);
          if (dist < bestDist) {
            bestDist = dist;
            bestCol = c;
          }
        }
        const colName = headers[bestCol]!;
        record[colName] = record[colName]
          ? record[colName] + ' ' + item.str.trim()
          : item.str.trim();
      }

      // Only add if it has some data
      if (Object.values(record).some((v) => v.length > 0)) {
        dataRows.push(record);
      }
    }

    warnings.push(
      `Extracted ${headers.length} columns and ${dataRows.length} rows from PDF using layout analysis.`,
    );

    const rawPreview = rowGroups
      .slice(0, 15)
      .map((row) => row.map((i) => i.str).join(' | '))
      .join('\n');

    return NextResponse.json({
      headers,
      rows: dataRows,
      totalRows: dataRows.length,
      parseWarnings: warnings,
      rawPreview,
    });
  } catch (pdfjsError) {
    console.error('pdfjs-dist parsing failed, falling back:', pdfjsError);
    return fallbackPdfParse(buffer, warnings);
  }
}

async function fallbackPdfParse(buffer: Buffer, warnings: string[]) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse') as (
    buffer: Buffer,
  ) => Promise<{ text: string; numpages: number }>;
  const result = await pdfParse(buffer);
  const text = result.text;
  const rawPreview = text.split('\n').slice(0, 30).join('\n');

  const lines = text
    .split('\n')
    .map((l: string) => l.trim())
    .filter((l: string) => l.length > 0);

  if (lines.length < 2) {
    return NextResponse.json({
      headers: [],
      rows: [],
      totalRows: 0,
      parseWarnings: ['No tabular data found in PDF.'],
      rawPreview,
    });
  }

  const { headers, rows } = extractTableFromLines(lines);

  if (headers.length === 0) {
    warnings.push('Could not detect column structure. The raw text is shown below for reference.');
  } else {
    warnings.push(`Detected ${headers.length} columns and ${rows.length} rows from PDF.`);
  }

  return NextResponse.json({
    headers,
    rows,
    totalRows: rows.length,
    parseWarnings: warnings,
    rawPreview,
  });
}

// ---------------------------------------------------------------------------
// Word (DOCX) Extraction
// ---------------------------------------------------------------------------

async function parseDocx(buffer: Buffer) {
  const mammoth = await import('mammoth');
  const result = await mammoth.convertToHtml({ buffer });
  const html = result.value;

  const warnings: string[] = [];

  // Try to extract tables from HTML
  const tableMatch = html.match(/<table[\s\S]*?<\/table>/i);

  if (tableMatch) {
    const { headers, rows } = extractTableFromHtml(tableMatch[0]);
    if (headers.length > 0) {
      warnings.push(
        `Found a table with ${headers.length} columns and ${rows.length} rows in the Word document.`,
      );
      return NextResponse.json({
        headers,
        rows,
        totalRows: rows.length,
        parseWarnings: warnings,
      });
    }
  }

  // Fallback: extract text and try line-by-line
  const textResult = await mammoth.extractRawText({ buffer });
  const text = textResult.value;
  const rawPreview = text.split('\n').slice(0, 30).join('\n');
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  const { headers, rows } = extractTableFromLines(lines);

  if (headers.length === 0) {
    warnings.push('No table structure found in Word document. Try exporting to CSV or Excel.');
  } else {
    warnings.push(`Extracted ${headers.length} columns and ${rows.length} rows from text content.`);
  }

  return NextResponse.json({
    headers,
    rows,
    totalRows: rows.length,
    parseWarnings: warnings,
    rawPreview,
  });
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function extractTableFromLines(lines: string[]): {
  headers: string[];
  rows: Record<string, string>[];
} {
  // Try tab-separated first
  const firstLine = lines[0];
  if (!firstLine) return { headers: [], rows: [] };
  const tabCount = (firstLine.match(/\t/g) || []).length;

  if (tabCount >= 1) {
    // Tab-separated
    const headers = firstLine.split('\t').map((h) => h.trim());
    const rows = lines.slice(1).map((line) => {
      const cells = line.split('\t').map((c) => c.trim());
      const record: Record<string, string> = {};
      headers.forEach((h, i) => {
        if (h) record[h] = cells[i] ?? '';
      });
      return record;
    });
    return { headers: headers.filter(Boolean), rows };
  }

  // Try multi-space separation (common in PDF)
  const multiSpacePattern = /\s{2,}/;
  if (multiSpacePattern.test(firstLine)) {
    const headers = firstLine.split(multiSpacePattern).map((h) => h.trim());
    if (headers.length >= 2) {
      const rows = lines.slice(1).map((line) => {
        const cells = line.split(multiSpacePattern).map((c) => c.trim());
        const record: Record<string, string> = {};
        headers.forEach((h, i) => {
          if (h) record[h] = cells[i] ?? '';
        });
        return record;
      });
      return { headers: headers.filter(Boolean), rows };
    }
  }

  // Try comma-separated as last resort
  if (firstLine.includes(',')) {
    const headers = firstLine.split(',').map((h) => h.trim());
    const rows = lines.slice(1).map((line) => {
      const cells = line.split(',').map((c) => c.trim());
      const record: Record<string, string> = {};
      headers.forEach((h, i) => {
        if (h) record[h] = cells[i] ?? '';
      });
      return record;
    });
    return { headers: headers.filter(Boolean), rows };
  }

  return { headers: [], rows: [] };
}

function extractTableFromHtml(tableHtml: string): {
  headers: string[];
  rows: Record<string, string>[];
} {
  // Simple HTML table parser (no DOM needed on server)
  const headerMatches = tableHtml.match(/<th[^>]*>([\s\S]*?)<\/th>/gi) || [];
  const headers = headerMatches.map((th) => th.replace(/<[^>]+>/g, '').trim());

  if (headers.length === 0) {
    // Try first row as headers
    const firstRowMatch = tableHtml.match(/<tr[^>]*>([\s\S]*?)<\/tr>/i);
    if (firstRowMatch && firstRowMatch[1]) {
      const cellMatches = firstRowMatch[1].match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
      headers.push(...cellMatches.map((td) => td.replace(/<[^>]+>/g, '').trim()));
    }
  }

  const rowMatches = tableHtml.match(/<tr[^>]*>([\s\S]*?)<\/tr>/gi) || [];
  const startIndex = headers.length > 0 ? 1 : 0;
  const rows: Record<string, string>[] = [];

  for (let i = startIndex; i < rowMatches.length; i++) {
    const rowHtml = rowMatches[i];
    if (!rowHtml) continue;
    const cellMatches = rowHtml.match(/<td[^>]*>([\s\S]*?)<\/td>/gi) || [];
    const cells = cellMatches.map((td) => td.replace(/<[^>]+>/g, '').trim());
    const record: Record<string, string> = {};
    headers.forEach((h, idx) => {
      if (h) record[h] = cells[idx] ?? '';
    });
    if (Object.values(record).some((v) => v.length > 0)) {
      rows.push(record);
    }
  }

  return { headers: headers.filter(Boolean), rows };
}
