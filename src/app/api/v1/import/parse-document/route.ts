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
  // Dynamic import to avoid bundling issues
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const pdfParse = require('pdf-parse') as (buffer: Buffer) => Promise<{ text: string }>;
  const result = await pdfParse(buffer);
  const text = result.text;

  const warnings: string[] = [];
  const rawPreview = text.split('\n').slice(0, 30).join('\n');

  // Try to detect tabular structure
  const lines = text
    .split('\n')
    .map((l: string) => l.trim())
    .filter((l: string) => l.length > 0);

  if (lines.length < 2) {
    return NextResponse.json({
      headers: [],
      rows: [],
      totalRows: 0,
      parseWarnings: ['No tabular data found in PDF. Try exporting to CSV or Excel.'],
      rawPreview,
    });
  }

  // Heuristic: detect if lines have consistent tab/multi-space separation
  const { headers, rows } = extractTableFromLines(lines);

  if (headers.length === 0) {
    warnings.push(
      'Could not detect column structure automatically. The raw text preview is shown below — please verify the data.',
    );
  } else {
    warnings.push(
      `Detected ${headers.length} columns and ${rows.length} data rows from PDF. Please verify the mapping is correct.`,
    );
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
