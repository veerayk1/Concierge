/**
 * Import Validation Engine
 *
 * Validates mapped data rows before import. Returns per-row validation
 * results with specific error/warning messages.
 */

import type { ColumnMapping, EntityType } from './column-mapper';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface RowIssue {
  column: string;
  severity: 'error' | 'warning';
  message: string;
  value: string;
}

export interface ValidatedRow {
  index: number;
  data: Record<string, string>;
  mappedData: Record<string, string>;
  status: 'valid' | 'warning' | 'error';
  issues: RowIssue[];
}

export interface ValidationResult {
  totalRows: number;
  validRows: number;
  warningRows: number;
  errorRows: number;
  rows: ValidatedRow[];
}

// ---------------------------------------------------------------------------
// Main Validator
// ---------------------------------------------------------------------------

export function validateImportData(
  rows: Record<string, string>[],
  mappings: ColumnMapping[],
  entityType: EntityType,
  existingUnitNumbers?: Set<string>,
): ValidationResult {
  // Build mapping lookup: sourceHeader → targetField
  const fieldMap = new Map<string, string>();
  for (const m of mappings) {
    if (m.targetField && !m.isCustomField) {
      fieldMap.set(m.sourceHeader, m.targetField);
    }
  }

  // Track seen values for duplicate detection
  const seenUnitNumbers = new Set<string>();
  const seenEmails = new Set<string>();

  const validatedRows: ValidatedRow[] = rows.map((row, index) => {
    const issues: RowIssue[] = [];
    const mappedData: Record<string, string> = {};

    // Map source columns to target fields
    for (const [sourceHeader, targetField] of fieldMap) {
      mappedData[targetField] = row[sourceHeader] ?? '';
    }

    // Also map custom fields
    for (const m of mappings) {
      if (m.isCustomField && m.sourceHeader) {
        mappedData[`custom:${m.sourceHeader}`] = row[m.sourceHeader] ?? '';
      }
    }

    if (entityType === 'units') {
      validateUnitRow(mappedData, index, issues, seenUnitNumbers, existingUnitNumbers);
    } else if (entityType === 'properties') {
      validatePropertyRow(mappedData, issues, seenUnitNumbers);
    } else {
      validateResidentRow(mappedData, index, issues, seenEmails);
    }

    const hasErrors = issues.some((i) => i.severity === 'error');
    const hasWarnings = issues.some((i) => i.severity === 'warning');
    const status = hasErrors ? 'error' : hasWarnings ? 'warning' : 'valid';

    return { index, data: row, mappedData, status, issues };
  });

  return {
    totalRows: validatedRows.length,
    validRows: validatedRows.filter((r) => r.status === 'valid').length,
    warningRows: validatedRows.filter((r) => r.status === 'warning').length,
    errorRows: validatedRows.filter((r) => r.status === 'error').length,
    rows: validatedRows,
  };
}

// ---------------------------------------------------------------------------
// Unit Validation
// ---------------------------------------------------------------------------

function validateUnitRow(
  data: Record<string, string>,
  _index: number,
  issues: RowIssue[],
  seenNumbers: Set<string>,
  existingNumbers?: Set<string>,
) {
  const unitNumber = data.number?.trim();

  // Required: unit number
  if (!unitNumber) {
    issues.push({
      column: 'Unit Number',
      severity: 'error',
      message: 'Unit number is required',
      value: '',
    });
    return;
  }

  // Duplicate within file
  const lowerNumber = unitNumber.toLowerCase();
  if (seenNumbers.has(lowerNumber)) {
    issues.push({
      column: 'Unit Number',
      severity: 'warning',
      message: `Duplicate unit "${unitNumber}" in this file`,
      value: unitNumber,
    });
  }
  seenNumbers.add(lowerNumber);

  // Duplicate against existing
  if (existingNumbers?.has(lowerNumber)) {
    issues.push({
      column: 'Unit Number',
      severity: 'warning',
      message: `Unit "${unitNumber}" already exists in this property`,
      value: unitNumber,
    });
  }

  // Floor: must be numeric
  if (data.floor && isNaN(Number(data.floor))) {
    issues.push({
      column: 'Floor',
      severity: 'warning',
      message: `"${data.floor}" is not a valid floor number — will be skipped`,
      value: data.floor,
    });
  }

  // Square footage: must be numeric
  if (data.squareFootage) {
    const cleaned = data.squareFootage.replace(/[,\s]/g, '');
    if (isNaN(Number(cleaned))) {
      issues.push({
        column: 'Square Footage',
        severity: 'warning',
        message: `"${data.squareFootage}" is not a valid number — will be skipped`,
        value: data.squareFootage,
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Resident Validation
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Property Validation
// ---------------------------------------------------------------------------

function validatePropertyRow(
  data: Record<string, string>,
  issues: RowIssue[],
  seenNames: Set<string>,
) {
  const name = data.name?.trim();
  if (!name) {
    issues.push({
      column: 'Property Name',
      severity: 'error',
      message: 'Property name is required',
      value: '',
    });
    return;
  }

  const lowerName = name.toLowerCase();
  if (seenNames.has(lowerName)) {
    issues.push({
      column: 'Property Name',
      severity: 'warning',
      message: `Duplicate property "${name}" in this file`,
      value: name,
    });
  }
  seenNames.add(lowerName);

  const address = data.address?.trim();
  if (!address) {
    issues.push({
      column: 'Address',
      severity: 'error',
      message: 'Address is required',
      value: '',
    });
  }

  const city = data.city?.trim();
  if (!city) {
    issues.push({
      column: 'City',
      severity: 'error',
      message: 'City is required',
      value: '',
    });
  }

  const province = data.province?.trim();
  if (!province) {
    issues.push({
      column: 'Province',
      severity: 'error',
      message: 'Province/State is required',
      value: '',
    });
  }

  if (data.unitCount) {
    const count = parseInt(data.unitCount, 10);
    if (isNaN(count) || count < 0) {
      issues.push({
        column: 'Unit Count',
        severity: 'warning',
        message: `"${data.unitCount}" is not a valid number — will default to 0`,
        value: data.unitCount,
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Resident Validation
// ---------------------------------------------------------------------------

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateResidentRow(
  data: Record<string, string>,
  _index: number,
  issues: RowIssue[],
  seenEmails: Set<string>,
) {
  const firstName = data.firstName?.trim();
  const lastName = data.lastName?.trim();
  const fullName = data.fullName?.trim();

  // Required: at least a name
  if (!firstName && !fullName) {
    issues.push({
      column: 'Name',
      severity: 'error',
      message: 'At least a first name or full name is required',
      value: '',
    });
  }

  // If we have fullName but not firstName/lastName, that's fine — we'll split it
  if (fullName && !firstName && !lastName) {
    // Will be split during import — no issue
  }

  // Email validation
  const email = data.email?.trim();
  if (email) {
    if (!EMAIL_REGEX.test(email)) {
      issues.push({
        column: 'Email',
        severity: 'error',
        message: `"${email}" is not a valid email address`,
        value: email,
      });
    } else {
      const lowerEmail = email.toLowerCase();
      if (seenEmails.has(lowerEmail)) {
        issues.push({
          column: 'Email',
          severity: 'warning',
          message: `Duplicate email "${email}" in this file`,
          value: email,
        });
      }
      seenEmails.add(lowerEmail);
    }
  }

  // Phone validation (lenient)
  const phone = data.phone?.trim();
  if (phone) {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 7 || digits.length > 15) {
      issues.push({
        column: 'Phone',
        severity: 'warning',
        message: `"${phone}" may not be a valid phone number`,
        value: phone,
      });
    }
  }

  // Unit number check (warning only — resident still importable)
  const unitNumber = data.unitNumber?.trim();
  if (!unitNumber) {
    issues.push({
      column: 'Unit',
      severity: 'warning',
      message: 'No unit specified — resident will be created without unit assignment',
      value: '',
    });
  }

  // Move-in date parsing (warning only)
  const moveInDate = data.moveInDate?.trim();
  if (moveInDate) {
    const parsed = tryParseDate(moveInDate);
    if (!parsed) {
      issues.push({
        column: 'Move-in Date',
        severity: 'warning',
        message: `"${moveInDate}" could not be parsed as a date — will be skipped`,
        value: moveInDate,
      });
    }
  }
}

// ---------------------------------------------------------------------------
// Date Parsing Helper
// ---------------------------------------------------------------------------

function tryParseDate(value: string): Date | null {
  // Try ISO format first
  const isoDate = new Date(value);
  if (!isNaN(isoDate.getTime())) return isoDate;

  // Try common formats: MM/DD/YYYY, DD/MM/YYYY, YYYY/MM/DD
  const formats = [
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/, // MM/DD/YYYY or DD/MM/YYYY
    /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})$/, // YYYY/MM/DD
    /^(\d{1,2})[/-](\d{1,2})[/-](\d{2})$/, // MM/DD/YY
  ];

  for (const fmt of formats) {
    const match = value.match(fmt);
    if (match) {
      const d = new Date(value);
      if (!isNaN(d.getTime())) return d;
    }
  }

  return null;
}

// ---------------------------------------------------------------------------
// Export helpers
// ---------------------------------------------------------------------------

export function generateErrorReport(result: ValidationResult): string {
  const headers = ['Row', 'Status', 'Column', 'Issue', 'Value'];
  const rows = result.rows
    .filter((r) => r.issues.length > 0)
    .flatMap((r) =>
      r.issues.map((issue) => [
        String(r.index + 1),
        issue.severity,
        issue.column,
        issue.message,
        issue.value,
      ]),
    );

  return [headers, ...rows].map((row) => row.map(csvEscape).join(',')).join('\n');
}

function csvEscape(value: string): string {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
