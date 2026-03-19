/**
 * Data Quality System — Concierge
 *
 * Validation, duplicate detection, quality scoring, missing data reports,
 * and auto-fix suggestions per docs/tech/DATA-QUALITY.md.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ValidationResult {
  valid: boolean;
  error?: string;
  normalized?: string;
}

export interface DuplicateMatch {
  id: string;
  matchedField: string;
  similarity: number;
  value: string;
}

export interface QualityScore {
  overall: number;
  completeness: number;
  validity: number;
  details: Record<string, { filled: boolean; weight: number }>;
}

export interface MissingDataReport {
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  affectedIds: string[];
  description: string;
}

export interface ModuleCompleteness {
  module: string;
  requiredFields: string[];
  completed: number;
  missing: number;
  completeness: number;
}

export interface AutoFixSuggestion {
  field: string;
  original: string;
  suggested: string;
  confidence: number;
  reason: string;
}

export interface BulkValidationResult {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  errors: Array<{
    recordId: string;
    field: string;
    error: string;
    value: string;
  }>;
}

export interface Resident {
  id: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  unitId?: string;
  moveInDate?: string;
}

export interface Unit {
  id: string;
  number: string;
  floor?: string;
  propertyId: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  residents?: Resident[];
  email?: string;
  phone?: string;
  instructions?: string;
}

// ---------------------------------------------------------------------------
// Validation Functions
// ---------------------------------------------------------------------------

/**
 * Validate email format per RFC 5322 (practical subset).
 * Returns normalized (lowercase, trimmed) email if valid.
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }

  const trimmed = email.trim().toLowerCase();

  if (trimmed.length === 0) {
    return { valid: false, error: 'Email is required' };
  }

  // Practical RFC 5322 regex
  const emailRegex =
    /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;

  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Invalid email format' };
  }

  return { valid: true, normalized: trimmed };
}

/**
 * Validate phone number in E.164 format for Canadian/US numbers.
 * Accepts various input formats and normalizes to +1XXXXXXXXXX.
 */
export function validatePhone(phone: string): ValidationResult {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, error: 'Phone number is required' };
  }

  const trimmed = phone.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: 'Phone number is required' };
  }

  // Strip all non-digit characters except leading +
  const hasPlus = trimmed.startsWith('+');
  const digits = trimmed.replace(/\D/g, '');

  let normalized: string;

  if (hasPlus && digits.startsWith('1') && digits.length === 11) {
    // +1XXXXXXXXXX format
    normalized = `+${digits}`;
  } else if (digits.length === 11 && digits.startsWith('1')) {
    // 1XXXXXXXXXX — missing +
    normalized = `+${digits}`;
  } else if (digits.length === 10) {
    // XXXXXXXXXX — missing country code, default to +1
    normalized = `+1${digits}`;
  } else {
    return {
      valid: false,
      error: 'Phone must be a valid 10-digit Canadian/US number',
    };
  }

  // Validate area code (first digit after +1 must be 2-9)
  const areaCode = normalized.charAt(2);
  if (areaCode === '0' || areaCode === '1') {
    return {
      valid: false,
      error: 'Invalid area code',
    };
  }

  return { valid: true, normalized };
}

/**
 * Validate unit number: alphanumeric, hyphens, periods. 1-10 chars.
 * Stored uppercase.
 */
export function validateUnitNumber(unit: string): ValidationResult {
  if (!unit || typeof unit !== 'string') {
    return { valid: false, error: 'Unit number is required' };
  }

  const trimmed = unit.trim();

  if (trimmed.length === 0) {
    return { valid: false, error: 'Unit number is required' };
  }

  if (trimmed.length > 10) {
    return { valid: false, error: 'Unit number must be 1-10 characters' };
  }

  const unitRegex = /^[a-zA-Z0-9.\-]+$/;
  if (!unitRegex.test(trimmed)) {
    return {
      valid: false,
      error: 'Unit number may only contain letters, numbers, hyphens, and periods',
    };
  }

  return { valid: true, normalized: trimmed.toUpperCase() };
}

/**
 * Validate a name field: 1-100 characters, must contain at least one letter.
 * Trims whitespace, collapses multiple spaces.
 */
export function validateName(name: string): ValidationResult {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Name is required' };
  }

  const trimmed = name.trim().replace(/\s+/g, ' ');

  if (trimmed.length === 0) {
    return { valid: false, error: 'Name is required' };
  }

  if (trimmed.length > 100) {
    return { valid: false, error: 'Name must be 1-100 characters' };
  }

  // Must contain at least one letter (Unicode-aware)
  if (!/\p{L}/u.test(trimmed)) {
    return { valid: false, error: 'Name must contain at least one letter' };
  }

  return { valid: true, normalized: trimmed };
}

// ---------------------------------------------------------------------------
// Fuzzy Matching / Duplicate Detection
// ---------------------------------------------------------------------------

/**
 * Calculate Levenshtein distance between two strings.
 */
export function levenshteinDistance(a: string, b: string): number {
  const la = a.length;
  const lb = b.length;

  if (la === 0) return lb;
  if (lb === 0) return la;

  // Use single-row optimization
  const prev = Array.from({ length: lb + 1 }, (_, i) => i);

  for (let i = 1; i <= la; i++) {
    let prevDiag = prev[0]!;
    prev[0] = i;

    for (let j = 1; j <= lb; j++) {
      const temp = prev[j]!;
      if (a[i - 1] === b[j - 1]) {
        prev[j] = prevDiag;
      } else {
        prev[j] = 1 + Math.min(prevDiag, prev[j - 1]!, prev[j]!);
      }
      prevDiag = temp;
    }
  }

  return prev[lb]!;
}

/**
 * Calculate similarity between two strings (0-1 scale).
 */
export function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshteinDistance(a, b) / maxLen;
}

/**
 * Find duplicate emails in a set of residents.
 * Matches exact (after normalization) and typo-tolerant (Levenshtein <= 2).
 */
export function findDuplicateEmails(residents: Resident[]): DuplicateMatch[][] {
  const groups: DuplicateMatch[][] = [];
  const visited = new Set<string>();

  for (let i = 0; i < residents.length; i++) {
    const ri = residents[i]!;
    if (!ri.email || visited.has(ri.id)) continue;

    const emailI = ri.email.toLowerCase().trim();
    const group: DuplicateMatch[] = [];

    for (let j = i + 1; j < residents.length; j++) {
      const rj = residents[j]!;
      if (!rj.email || visited.has(rj.id)) continue;

      const emailJ = rj.email.toLowerCase().trim();
      const dist = levenshteinDistance(emailI, emailJ);

      if (dist <= 2) {
        if (group.length === 0) {
          group.push({
            id: ri.id,
            matchedField: 'email',
            similarity: 1,
            value: emailI,
          });
        }
        group.push({
          id: rj.id,
          matchedField: 'email',
          similarity: similarity(emailI, emailJ),
          value: emailJ,
        });
        visited.add(rj.id);
      }
    }

    if (group.length > 0) {
      visited.add(ri.id);
      groups.push(group);
    }
  }

  return groups;
}

/**
 * Find duplicate unit numbers within a property.
 * Exact match after normalization (uppercase, trimmed).
 */
export function findDuplicateUnits(units: Unit[]): DuplicateMatch[][] {
  const groups: DuplicateMatch[][] = [];
  const byNumber = new Map<string, Unit[]>();

  for (const unit of units) {
    const normalized = unit.number.trim().toUpperCase();
    const existing = byNumber.get(normalized) ?? [];
    existing.push(unit);
    byNumber.set(normalized, existing);
  }

  for (const [number, dupes] of byNumber) {
    if (dupes.length > 1) {
      groups.push(
        dupes.map((u) => ({
          id: u.id,
          matchedField: 'unitNumber',
          similarity: 1,
          value: number,
        })),
      );
    }
  }

  return groups;
}

/**
 * Find duplicate resident names using fuzzy matching.
 * Levenshtein distance <= 2 on full name.
 */
export function findDuplicateNames(residents: Resident[]): DuplicateMatch[][] {
  const groups: DuplicateMatch[][] = [];
  const visited = new Set<string>();

  for (let i = 0; i < residents.length; i++) {
    const ri = residents[i]!;
    const nameI = `${ri.firstName} ${ri.lastName}`.toLowerCase().trim();
    if (visited.has(ri.id)) continue;

    const group: DuplicateMatch[] = [];

    for (let j = i + 1; j < residents.length; j++) {
      const rj = residents[j]!;
      if (visited.has(rj.id)) continue;

      const nameJ = `${rj.firstName} ${rj.lastName}`.toLowerCase().trim();
      const dist = levenshteinDistance(nameI, nameJ);

      if (dist <= 2) {
        if (group.length === 0) {
          group.push({
            id: ri.id,
            matchedField: 'name',
            similarity: 1,
            value: nameI,
          });
        }
        group.push({
          id: rj.id,
          matchedField: 'name',
          similarity: similarity(nameI, nameJ),
          value: nameJ,
        });
        visited.add(rj.id);
      }
    }

    if (group.length > 0) {
      visited.add(ri.id);
      groups.push(group);
    }
  }

  return groups;
}

// ---------------------------------------------------------------------------
// Quality Scoring
// ---------------------------------------------------------------------------

/** Field weights for quality score calculation (must sum to 1.0). */
const UNIT_FIELD_WEIGHTS: Record<string, number> = {
  number: 0.2,
  floor: 0.05,
  emergencyContact: 0.2,
  emergencyPhone: 0.15,
  email: 0.15,
  phone: 0.15,
  instructions: 0.1,
};

/**
 * Calculate quality score for a single unit.
 * Returns overall score (0-100), completeness, validity, and per-field details.
 */
export function calculateUnitQualityScore(unit: Unit): QualityScore {
  const details: Record<string, { filled: boolean; weight: number }> = {};
  let weightedSum = 0;

  for (const [field, weight] of Object.entries(UNIT_FIELD_WEIGHTS)) {
    const value = unit[field as keyof Unit];
    const filled = value !== undefined && value !== null && value !== '';
    details[field] = { filled, weight };
    if (filled) {
      weightedSum += weight;
    }
  }

  const completeness = Math.round(weightedSum * 100);

  // Validity: check format of filled fields
  let validFields = 0;
  let totalCheckable = 0;

  if (unit.email) {
    totalCheckable++;
    if (validateEmail(unit.email).valid) validFields++;
  }
  if (unit.phone) {
    totalCheckable++;
    if (validatePhone(unit.phone).valid) validFields++;
  }
  if (unit.number) {
    totalCheckable++;
    if (validateUnitNumber(unit.number).valid) validFields++;
  }

  const validity = totalCheckable > 0 ? Math.round((validFields / totalCheckable) * 100) : 100;

  // Overall = weighted combo per spec: completeness * 0.6 + validity * 0.4
  // (Simplified for unit-level; property-level uses the 4-component formula)
  const overall = Math.round(completeness * 0.6 + validity * 0.4);

  return { overall, completeness, validity, details };
}

// ---------------------------------------------------------------------------
// Missing Data Reports
// ---------------------------------------------------------------------------

/**
 * Find units without emergency contacts.
 */
export function findUnitsWithoutEmergencyContacts(units: Unit[]): MissingDataReport {
  const affected = units.filter((u) => !u.emergencyContact || !u.emergencyPhone);

  return {
    category: 'Units Without Emergency Contacts',
    severity: 'critical',
    affectedIds: affected.map((u) => u.id),
    description: `${affected.length} unit${affected.length === 1 ? '' : 's'} ha${affected.length === 1 ? 's' : 've'} no emergency contact`,
  };
}

/**
 * Find residents without email addresses.
 * Per BuildingLink feature: "X occupants missing email addresses."
 */
export function findResidentsWithoutEmail(residents: Resident[]): MissingDataReport {
  const affected = residents.filter((r) => !r.email);

  return {
    category: 'Residents Missing Email',
    severity: 'critical',
    affectedIds: affected.map((r) => r.id),
    description: `${affected.length} resident${affected.length === 1 ? '' : 's'} ha${affected.length === 1 ? 's' : 've'} no email address`,
  };
}

/**
 * Generate per-module data completeness dashboard.
 */
export function calculateModuleCompleteness(
  units: Unit[],
  residents: Resident[],
): ModuleCompleteness[] {
  // Units module: required fields = number, floor, emergencyContact
  const unitRequired = ['number', 'floor', 'emergencyContact'] as const;
  let unitCompleted = 0;
  let unitMissing = 0;

  for (const unit of units) {
    const allPresent = unitRequired.every((f) => {
      const val = unit[f as keyof Unit];
      return val !== undefined && val !== null && val !== '';
    });
    if (allPresent) unitCompleted++;
    else unitMissing++;
  }

  // Residents module: required fields = email, phone, unitId, moveInDate
  const residentRequired = ['email', 'phone', 'unitId', 'moveInDate'] as const;
  let residentCompleted = 0;
  let residentMissing = 0;

  for (const resident of residents) {
    const allPresent = residentRequired.every((f) => {
      const val = resident[f as keyof Resident];
      return val !== undefined && val !== null && val !== '';
    });
    if (allPresent) residentCompleted++;
    else residentMissing++;
  }

  const unitTotal = unitCompleted + unitMissing;
  const residentTotal = residentCompleted + residentMissing;

  return [
    {
      module: 'Units',
      requiredFields: [...unitRequired],
      completed: unitCompleted,
      missing: unitMissing,
      completeness: unitTotal > 0 ? Math.round((unitCompleted / unitTotal) * 1000) / 10 : 100,
    },
    {
      module: 'Residents',
      requiredFields: [...residentRequired],
      completed: residentCompleted,
      missing: residentMissing,
      completeness:
        residentTotal > 0 ? Math.round((residentCompleted / residentTotal) * 1000) / 10 : 100,
    },
  ];
}

// ---------------------------------------------------------------------------
// Auto-Fix Suggestions
// ---------------------------------------------------------------------------

/** Common email domain typos and their corrections. */
const EMAIL_DOMAIN_TYPOS: Record<string, string> = {
  'gmial.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gmaill.com': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmil.com': 'gmail.com',
  'hotmal.com': 'hotmail.com',
  'hotmial.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'hotmaill.com': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'outloo.com': 'outlook.com',
  'outlookk.com': 'outlook.com',
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'yhoo.com': 'yahoo.com',
  'yahoo.co': 'yahoo.com',
  'iclod.com': 'icloud.com',
  'iclould.com': 'icloud.com',
};

/**
 * Suggest auto-fixes for common email domain typos.
 */
export function suggestEmailFixes(email: string): AutoFixSuggestion | null {
  if (!email || typeof email !== 'string') return null;

  const trimmed = email.trim().toLowerCase();
  const atIndex = trimmed.indexOf('@');
  if (atIndex === -1) return null;

  const localPart = trimmed.slice(0, atIndex);
  const domain = trimmed.slice(atIndex + 1);

  const corrected = EMAIL_DOMAIN_TYPOS[domain];
  if (corrected) {
    return {
      field: 'email',
      original: trimmed,
      suggested: `${localPart}@${corrected}`,
      confidence: 0.95,
      reason: `Common typo: "${domain}" should be "${corrected}"`,
    };
  }

  return null;
}

/**
 * Generate all auto-fix suggestions for a resident.
 */
export function suggestResidentFixes(resident: Resident): AutoFixSuggestion[] {
  const suggestions: AutoFixSuggestion[] = [];

  // Email domain typo check
  if (resident.email) {
    const fix = suggestEmailFixes(resident.email);
    if (fix) suggestions.push(fix);
  }

  // Phone missing country code
  if (resident.phone) {
    const trimmed = resident.phone.trim();
    const digits = trimmed.replace(/\D/g, '');
    if (digits.length === 10 && !trimmed.startsWith('+')) {
      suggestions.push({
        field: 'phone',
        original: trimmed,
        suggested: `+1${digits}`,
        confidence: 0.9,
        reason: 'Phone number missing country code; defaulting to +1 (North America)',
      });
    }
  }

  // Name whitespace normalization
  for (const nameField of ['firstName', 'lastName'] as const) {
    const val = resident[nameField];
    if (val) {
      const normalized = val.trim().replace(/\s+/g, ' ');
      if (normalized !== val) {
        suggestions.push({
          field: nameField,
          original: val,
          suggested: normalized,
          confidence: 1.0,
          reason: 'Trim whitespace and collapse multiple spaces',
        });
      }
    }
  }

  return suggestions;
}

// ---------------------------------------------------------------------------
// Bulk Validation
// ---------------------------------------------------------------------------

/**
 * Validate all units in a property.
 */
export function bulkValidateUnits(units: Unit[]): BulkValidationResult {
  const errors: BulkValidationResult['errors'] = [];

  for (const unit of units) {
    const unitResult = validateUnitNumber(unit.number);
    if (!unitResult.valid) {
      errors.push({
        recordId: unit.id,
        field: 'number',
        error: unitResult.error!,
        value: unit.number,
      });
    }

    if (unit.email) {
      const emailResult = validateEmail(unit.email);
      if (!emailResult.valid) {
        errors.push({
          recordId: unit.id,
          field: 'email',
          error: emailResult.error!,
          value: unit.email,
        });
      }
    }

    if (unit.phone) {
      const phoneResult = validatePhone(unit.phone);
      if (!phoneResult.valid) {
        errors.push({
          recordId: unit.id,
          field: 'phone',
          error: phoneResult.error!,
          value: unit.phone,
        });
      }
    }
  }

  const invalidIds = new Set(errors.map((e) => e.recordId));

  return {
    totalRecords: units.length,
    validRecords: units.length - invalidIds.size,
    invalidRecords: invalidIds.size,
    errors,
  };
}

/**
 * Validate all residents in a property.
 */
export function bulkValidateResidents(residents: Resident[]): BulkValidationResult {
  const errors: BulkValidationResult['errors'] = [];

  for (const resident of residents) {
    // Name validation
    const nameResult = validateName(`${resident.firstName} ${resident.lastName}`);
    if (!nameResult.valid) {
      errors.push({
        recordId: resident.id,
        field: 'name',
        error: nameResult.error!,
        value: `${resident.firstName} ${resident.lastName}`,
      });
    }

    if (resident.email) {
      const emailResult = validateEmail(resident.email);
      if (!emailResult.valid) {
        errors.push({
          recordId: resident.id,
          field: 'email',
          error: emailResult.error!,
          value: resident.email,
        });
      }
    }

    if (resident.phone) {
      const phoneResult = validatePhone(resident.phone);
      if (!phoneResult.valid) {
        errors.push({
          recordId: resident.id,
          field: 'phone',
          error: phoneResult.error!,
          value: resident.phone,
        });
      }
    }
  }

  const invalidIds = new Set(errors.map((e) => e.recordId));

  return {
    totalRecords: residents.length,
    validRecords: residents.length - invalidIds.size,
    invalidRecords: invalidIds.size,
    errors,
  };
}
