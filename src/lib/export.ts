/**
 * Concierge — Export Utilities
 *
 * Client-side export functions for CSV, Excel-compatible CSV, and PDF (via print).
 * Required on every listing page per Design System technical non-negotiables:
 * "Export (Excel/PDF) on every listing page."
 *
 * @module lib/export
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type DataRow = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Sanitizes a filename by removing characters that are unsafe for filesystems.
 * Replaces whitespace with hyphens and strips anything except alphanumeric,
 * hyphens, underscores, and dots.
 */
export function sanitizeFilename(name: string): string {
  if (!name || typeof name !== 'string') {
    return 'export';
  }

  const sanitized = name
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9\-_.]/g, '');

  return sanitized.length > 0 ? sanitized : 'export';
}

/**
 * Escapes a value for CSV output per RFC 4180:
 * - Values containing commas, double quotes, or newlines are wrapped in double quotes.
 * - Double quotes within values are escaped by doubling them.
 * - null/undefined become empty strings.
 */
export function escapeCSVValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '';
  }

  const str = typeof value === 'object' ? JSON.stringify(value) : String(value);

  // If the value contains a comma, double quote, or newline, wrap in quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}

/**
 * Extracts column headers from the first row of data.
 * Returns an empty array if data is empty.
 */
export function extractColumns(data: DataRow[]): string[] {
  if (!data || data.length === 0) {
    return [];
  }
  return Object.keys(data[0]!);
}

// ---------------------------------------------------------------------------
// CSV Export
// ---------------------------------------------------------------------------

/**
 * Converts an array of data objects to a CSV string and triggers a browser
 * download. Each object key becomes a column header.
 *
 * @param data - Array of row objects.
 * @param filename - Desired filename (without extension). Sanitized automatically.
 *
 * @example
 * exportToCSV([{ name: 'Pool', status: 'Open' }], 'amenities')
 * // Downloads "amenities.csv"
 */
export function exportToCSV(data: DataRow[], filename: string): void {
  if (!data || data.length === 0) {
    return;
  }

  const csv = generateCSVString(data);
  const safeName = sanitizeFilename(filename);

  triggerDownload(csv, `${safeName}.csv`, 'text/csv;charset=utf-8;');
}

/**
 * Generates a CSV string from data rows. Exported for testing.
 */
export function generateCSVString(data: DataRow[]): string {
  if (!data || data.length === 0) {
    return '';
  }

  const columns = extractColumns(data);
  const headerRow = columns.map(escapeCSVValue).join(',');

  const bodyRows = data.map((row) => columns.map((col) => escapeCSVValue(row[col])).join(','));

  return [headerRow, ...bodyRows].join('\n');
}

// ---------------------------------------------------------------------------
// Excel-compatible CSV Export
// ---------------------------------------------------------------------------

/**
 * Creates an Excel-compatible CSV with UTF-8 BOM prefix so that Excel
 * correctly interprets Unicode characters and opens the file with proper
 * column separation.
 *
 * @param data - Array of row objects.
 * @param filename - Desired filename (without extension). Sanitized automatically.
 *
 * @example
 * exportToExcel([{ unit: '1502', resident: 'Jean-Pierre' }], 'units')
 * // Downloads "units.xlsx.csv" (opens correctly in Excel)
 */
export function exportToExcel(data: DataRow[], filename: string): void {
  if (!data || data.length === 0) {
    return;
  }

  const csv = generateCSVString(data);
  // UTF-8 BOM ensures Excel interprets the file correctly
  const BOM = '\uFEFF';
  const safeName = sanitizeFilename(filename);

  triggerDownload(BOM + csv, `${safeName}.csv`, 'text/csv;charset=utf-8;');
}

// ---------------------------------------------------------------------------
// PDF Export (via Print Dialog)
// ---------------------------------------------------------------------------

/**
 * Generates a print-friendly HTML table from data and opens the browser
 * print dialog. Users can then save as PDF or print directly.
 *
 * @param title - Document title displayed at the top of the page.
 * @param data - Array of row objects.
 * @param columns - Which columns to include. If empty, all columns from the
 *   first row are used.
 *
 * @example
 * exportToPDF('Package Log', packages, ['reference', 'courier', 'status', 'date'])
 */
export function exportToPDF(title: string, data: DataRow[], columns: string[]): void {
  if (!data || data.length === 0) {
    return;
  }

  const cols = columns.length > 0 ? columns : extractColumns(data);
  const html = generatePrintHTML(title, data, cols);

  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    return;
  }

  printWindow.document.write(html);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

/**
 * Generates the print-friendly HTML document. Exported for testing.
 */
export function generatePrintHTML(title: string, data: DataRow[], columns: string[]): string {
  const sanitizedTitle = title.replace(/</g, '&lt;').replace(/>/g, '&gt;');

  const headerCells = columns
    .map((col) => {
      const label = col
        .replace(/([A-Z])/g, ' $1')
        .replace(/[_-]/g, ' ')
        .trim();
      const capitalized = label.charAt(0).toUpperCase() + label.slice(1);
      return `<th>${capitalized.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</th>`;
    })
    .join('');

  const bodyRows = data
    .map((row) => {
      const cells = columns
        .map((col) => {
          const val = row[col];
          const display = val === null || val === undefined ? '' : String(val);
          return `<td>${display.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</td>`;
        })
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${sanitizedTitle}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 24px; color: #1a1a1a; }
    h1 { font-size: 18px; font-weight: 600; margin-bottom: 8px; }
    .meta { font-size: 12px; color: #666; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 13px; }
    th { text-align: left; padding: 8px 12px; border-bottom: 2px solid #e5e5e5; font-weight: 600; background: #f9fafb; }
    td { padding: 8px 12px; border-bottom: 1px solid #e5e5e5; }
    tr:nth-child(even) { background: #f9fafb; }
    @media print {
      body { padding: 0; }
      table { page-break-inside: auto; }
      tr { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <h1>${sanitizedTitle}</h1>
  <p class="meta">Exported on ${new Date().toLocaleDateString('en-CA')} &mdash; ${data.length} record${data.length !== 1 ? 's' : ''}</p>
  <table>
    <thead><tr>${headerCells}</tr></thead>
    <tbody>${bodyRows}</tbody>
  </table>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Download Trigger
// ---------------------------------------------------------------------------

/**
 * Creates a temporary anchor element to trigger a file download in the browser.
 */
function triggerDownload(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.style.display = 'none';
  document.body.appendChild(anchor);
  anchor.click();

  // Cleanup
  setTimeout(() => {
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }, 100);
}
