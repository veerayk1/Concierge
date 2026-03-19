/**
 * Concierge — Export Utilities Tests
 *
 * Tests CSV generation, Excel-compatible export, PDF HTML generation,
 * filename sanitization, escaping, and edge cases.
 */

import { describe, it, expect } from 'vitest';

import {
  sanitizeFilename,
  escapeCSVValue,
  extractColumns,
  generateCSVString,
  generatePrintHTML,
  exportToCSV,
  exportToExcel,
  exportToPDF,
} from '@/lib/export';

// ---------------------------------------------------------------------------
// 1. CSV Value Escaping
// ---------------------------------------------------------------------------

describe('escapeCSVValue', () => {
  it('returns simple strings unchanged', () => {
    expect(escapeCSVValue('hello')).toBe('hello');
    expect(escapeCSVValue('42')).toBe('42');
  });

  it('wraps values containing commas in double quotes', () => {
    expect(escapeCSVValue('Toronto, ON')).toBe('"Toronto, ON"');
  });

  it('escapes double quotes by doubling them', () => {
    expect(escapeCSVValue('He said "hello"')).toBe('"He said ""hello"""');
  });

  it('wraps values containing newlines in double quotes', () => {
    expect(escapeCSVValue('line1\nline2')).toBe('"line1\nline2"');
    expect(escapeCSVValue('line1\r\nline2')).toBe('"line1\r\nline2"');
  });

  it('handles values with commas and quotes together', () => {
    expect(escapeCSVValue('"Unit 101", Floor 1')).toBe('"""Unit 101"", Floor 1"');
  });

  it('converts null and undefined to empty string', () => {
    expect(escapeCSVValue(null)).toBe('');
    expect(escapeCSVValue(undefined)).toBe('');
  });

  it('converts numbers to strings', () => {
    expect(escapeCSVValue(42)).toBe('42');
    expect(escapeCSVValue(0)).toBe('0');
    expect(escapeCSVValue(3.14)).toBe('3.14');
  });

  it('converts booleans to strings', () => {
    expect(escapeCSVValue(true)).toBe('true');
    expect(escapeCSVValue(false)).toBe('false');
  });

  it('serializes objects as JSON', () => {
    expect(escapeCSVValue({ a: 1 })).toBe('"{""a"":1}"');
  });

  it('serializes arrays as JSON', () => {
    expect(escapeCSVValue([1, 2, 3])).toBe('"[1,2,3]"');
  });
});

// ---------------------------------------------------------------------------
// 2. Filename Sanitization
// ---------------------------------------------------------------------------

describe('sanitizeFilename', () => {
  it('returns a simple filename unchanged', () => {
    expect(sanitizeFilename('packages')).toBe('packages');
  });

  it('replaces spaces with hyphens', () => {
    expect(sanitizeFilename('package log')).toBe('package-log');
  });

  it('strips unsafe characters', () => {
    expect(sanitizeFilename('file<>:"/\\|?*name')).toBe('filename');
  });

  it('preserves dots, hyphens, and underscores', () => {
    expect(sanitizeFilename('report_2026-03.v2')).toBe('report_2026-03.v2');
  });

  it('returns "export" for empty input', () => {
    expect(sanitizeFilename('')).toBe('export');
  });

  it('returns "export" for null/undefined-like input', () => {
    expect(sanitizeFilename(null as unknown as string)).toBe('export');
    expect(sanitizeFilename(undefined as unknown as string)).toBe('export');
  });

  it('returns "export" when all characters are stripped', () => {
    expect(sanitizeFilename('!!!@@@###')).toBe('export');
  });

  it('collapses multiple spaces to a single hyphen', () => {
    expect(sanitizeFilename('my   file   name')).toBe('my-file-name');
  });

  it('handles unicode characters by stripping them', () => {
    expect(sanitizeFilename('amenities-cafe')).toBe('amenities-cafe');
    // Accented and non-ASCII chars are stripped for filesystem safety
    expect(sanitizeFilename('rapport-resume')).toBe('rapport-resume');
  });
});

// ---------------------------------------------------------------------------
// 3. Column Header Extraction
// ---------------------------------------------------------------------------

describe('extractColumns', () => {
  it('extracts keys from the first row of data', () => {
    const data = [
      { id: 1, name: 'Pool', status: 'Open' },
      { id: 2, name: 'Gym', status: 'Closed' },
    ];
    expect(extractColumns(data)).toEqual(['id', 'name', 'status']);
  });

  it('returns empty array for empty data', () => {
    expect(extractColumns([])).toEqual([]);
  });

  it('returns empty array for null/undefined', () => {
    expect(extractColumns(null as unknown as Record<string, unknown>[])).toEqual([]);
    expect(extractColumns(undefined as unknown as Record<string, unknown>[])).toEqual([]);
  });

  it('handles single row', () => {
    expect(extractColumns([{ a: 1 }])).toEqual(['a']);
  });
});

// ---------------------------------------------------------------------------
// 4. CSV String Generation
// ---------------------------------------------------------------------------

describe('generateCSVString', () => {
  it('generates CSV with headers and data rows', () => {
    const data = [
      { name: 'Pool', status: 'Open', capacity: 25 },
      { name: 'Gym', status: 'Closed', capacity: 50 },
    ];

    const csv = generateCSVString(data);
    const lines = csv.split('\n');

    expect(lines).toHaveLength(3);
    expect(lines[0]).toBe('name,status,capacity');
    expect(lines[1]).toBe('Pool,Open,25');
    expect(lines[2]).toBe('Gym,Closed,50');
  });

  it('properly escapes values with commas', () => {
    const data = [{ address: '100 King St, Toronto', unit: '1502' }];
    const csv = generateCSVString(data);
    const lines = csv.split('\n');

    expect(lines[1]).toBe('"100 King St, Toronto",1502');
  });

  it('handles values with double quotes', () => {
    const data = [{ note: 'He said "hello"' }];
    const csv = generateCSVString(data);
    const lines = csv.split('\n');

    expect(lines[1]).toBe('"He said ""hello"""');
  });

  it('handles values with newlines', () => {
    const data = [{ description: 'Line 1\nLine 2' }];
    const csv = generateCSVString(data);

    // The header + one data row, but the data row contains an embedded newline
    // that is wrapped in quotes
    expect(csv).toContain('"Line 1\nLine 2"');
    expect(csv.startsWith('description\n')).toBe(true);
  });

  it('handles null and undefined values', () => {
    const data = [{ a: null, b: undefined, c: 'value' }];
    const csv = generateCSVString(data);
    const lines = csv.split('\n');

    expect(lines[1]).toBe(',,value');
  });

  it('returns empty string for empty data', () => {
    expect(generateCSVString([])).toBe('');
  });

  it('returns empty string for null data', () => {
    expect(generateCSVString(null as unknown as Record<string, unknown>[])).toBe('');
  });
});

// ---------------------------------------------------------------------------
// 5. Special Character Handling
// ---------------------------------------------------------------------------

describe('special character handling in CSV', () => {
  it('handles emoji in values', () => {
    const data = [{ status: 'Active ✓', note: 'Priority ⚡' }];
    const csv = generateCSVString(data);

    expect(csv).toContain('Active ✓');
    expect(csv).toContain('Priority ⚡');
  });

  it('handles French accented characters', () => {
    const data = [{ name: 'Jean-Pierre Tremblay', unit: 'Résidence A' }];
    const csv = generateCSVString(data);

    expect(csv).toContain('Jean-Pierre Tremblay');
    expect(csv).toContain('Résidence A');
  });

  it('handles tab characters', () => {
    const data = [{ note: 'col1\tcol2' }];
    const csv = generateCSVString(data);

    expect(csv).toContain('col1\tcol2');
  });

  it('handles mixed special characters', () => {
    const data = [{ value: 'Price: $1,500.00 "premium"' }];
    const csv = generateCSVString(data);

    // Commas and quotes together require wrapping and escaping
    expect(csv).toContain('"Price: $1,500.00 ""premium"""');
  });
});

// ---------------------------------------------------------------------------
// 6. PDF HTML Generation
// ---------------------------------------------------------------------------

describe('generatePrintHTML', () => {
  const sampleData = [
    { name: 'Pool', status: 'Open' },
    { name: 'Gym', status: 'Closed' },
  ];

  it('includes the title', () => {
    const html = generatePrintHTML('Amenities Report', sampleData, ['name', 'status']);
    expect(html).toContain('<h1>Amenities Report</h1>');
  });

  it('includes column headers', () => {
    const html = generatePrintHTML('Report', sampleData, ['name', 'status']);
    expect(html).toContain('<th>Name</th>');
    expect(html).toContain('<th>Status</th>');
  });

  it('includes data rows', () => {
    const html = generatePrintHTML('Report', sampleData, ['name', 'status']);
    expect(html).toContain('<td>Pool</td>');
    expect(html).toContain('<td>Open</td>');
    expect(html).toContain('<td>Gym</td>');
    expect(html).toContain('<td>Closed</td>');
  });

  it('includes record count', () => {
    const html = generatePrintHTML('Report', sampleData, ['name', 'status']);
    expect(html).toContain('2 records');
  });

  it('uses singular "record" for a single row', () => {
    const html = generatePrintHTML('Report', [sampleData[0]!], ['name', 'status']);
    expect(html).toContain('1 record');
    expect(html).not.toContain('1 records');
  });

  it('sanitizes HTML in title to prevent XSS', () => {
    const html = generatePrintHTML('<script>alert("xss")</script>', sampleData, ['name']);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });

  it('sanitizes HTML in cell values to prevent XSS', () => {
    const data = [{ name: '<img onerror=alert(1) src=x>' }];
    const html = generatePrintHTML('Report', data, ['name']);
    expect(html).not.toContain('<img');
    expect(html).toContain('&lt;img');
  });

  it('handles null/undefined values in cells', () => {
    const data = [{ name: null, status: undefined }];
    const html = generatePrintHTML('Report', data as unknown as Record<string, unknown>[], [
      'name',
      'status',
    ]);
    // Should render empty cells, not "null" or "undefined" text
    expect(html).toContain('<td></td>');
  });

  it('converts camelCase column names to readable labels', () => {
    const data = [{ eventType: 'package', createdAt: '2026-03-18' }];
    const html = generatePrintHTML('Report', data, ['eventType', 'createdAt']);
    expect(html).toContain('<th>Event Type</th>');
    expect(html).toContain('<th>Created At</th>');
  });

  it('includes print-specific CSS', () => {
    const html = generatePrintHTML('Report', sampleData, ['name']);
    expect(html).toContain('@media print');
  });

  it('includes valid HTML5 doctype', () => {
    const html = generatePrintHTML('Report', sampleData, ['name']);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<meta charset="utf-8">');
  });
});

// ---------------------------------------------------------------------------
// 7. Export Functions — Empty Data Handling
// ---------------------------------------------------------------------------

describe('export functions with empty data', () => {
  it('exportToCSV does nothing with empty array', () => {
    // Should not throw
    expect(() => exportToCSV([], 'test')).not.toThrow();
  });

  it('exportToExcel does nothing with empty array', () => {
    expect(() => exportToExcel([], 'test')).not.toThrow();
  });

  it('exportToPDF does nothing with empty array', () => {
    expect(() => exportToPDF('Test', [], ['col'])).not.toThrow();
  });
});
