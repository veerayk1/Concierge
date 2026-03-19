/**
 * Data Quality System Tests — TDD
 *
 * Tests for validation, duplicate detection, quality scoring,
 * missing data reports, and auto-fix suggestions.
 * Spec: docs/tech/DATA-QUALITY.md
 */

import { describe, expect, it } from 'vitest';
import {
  validateEmail,
  validatePhone,
  validateUnitNumber,
  validateName,
  levenshteinDistance,
  findDuplicateEmails,
  findDuplicateUnits,
  findDuplicateNames,
  calculateUnitQualityScore,
  findUnitsWithoutEmergencyContacts,
  findResidentsWithoutEmail,
  calculateModuleCompleteness,
  suggestEmailFixes,
  suggestResidentFixes,
  bulkValidateUnits,
  bulkValidateResidents,
} from '@/server/data-quality';
import type { Resident, Unit } from '@/server/data-quality';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeResident(overrides: Partial<Resident> = {}): Resident {
  return {
    id: 'r-1',
    firstName: 'John',
    lastName: 'Smith',
    email: 'john.smith@gmail.com',
    phone: '+14165551234',
    unitId: 'u-1',
    moveInDate: '2025-06-01',
    ...overrides,
  };
}

function makeUnit(overrides: Partial<Unit> = {}): Unit {
  return {
    id: 'u-1',
    number: '101',
    floor: '1',
    propertyId: 'p-1',
    emergencyContact: 'Jane Smith',
    emergencyPhone: '+14165559999',
    email: 'unit101@building.com',
    phone: '+14165551111',
    instructions: 'Dog friendly',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// 1. Email Validation
// ---------------------------------------------------------------------------

describe('Email Validation', () => {
  it('accepts valid email formats', () => {
    const valid = [
      'user@example.com',
      'user.name@example.com',
      'user+tag@example.co.uk',
      'first.last@sub.domain.com',
      'USER@EXAMPLE.COM',
    ];

    for (const email of valid) {
      const result = validateEmail(email);
      expect(result.valid, `Expected "${email}" to be valid`).toBe(true);
      expect(result.normalized).toBe(email.toLowerCase().trim());
    }
  });

  it('rejects invalid email formats', () => {
    const invalid = [
      '',
      'notanemail',
      '@missing-local.com',
      'missing-domain@',
      'missing@.com',
      'spaces in@email.com',
      'double@@at.com',
      'no-tld@example',
    ];

    for (const email of invalid) {
      const result = validateEmail(email);
      expect(result.valid, `Expected "${email}" to be invalid`).toBe(false);
      expect(result.error).toBeDefined();
    }
  });

  it('normalizes email to lowercase and trimmed', () => {
    const result = validateEmail('  User@Example.COM  ');
    expect(result.valid).toBe(true);
    expect(result.normalized).toBe('user@example.com');
  });
});

// ---------------------------------------------------------------------------
// 2. Phone Validation — Canadian/US E.164
// ---------------------------------------------------------------------------

describe('Phone Validation', () => {
  it('accepts valid E.164 Canadian/US phone numbers', () => {
    const valid = [
      { input: '+14165551234', expected: '+14165551234' },
      { input: '14165551234', expected: '+14165551234' },
      { input: '4165551234', expected: '+14165551234' },
      { input: '(416) 555-1234', expected: '+14165551234' },
      { input: '416-555-1234', expected: '+14165551234' },
      { input: '+1 416 555 1234', expected: '+14165551234' },
    ];

    for (const { input, expected } of valid) {
      const result = validatePhone(input);
      expect(result.valid, `Expected "${input}" to be valid`).toBe(true);
      expect(result.normalized).toBe(expected);
    }
  });

  it('rejects invalid phone numbers', () => {
    const invalid = [
      '',
      '123',
      '12345',
      '+44123456789', // Non-NA country code with wrong length
      '+10165551234', // Area code starts with 0
      '+11165551234', // Area code starts with 1
      '999',
    ];

    for (const phone of invalid) {
      const result = validatePhone(phone);
      expect(result.valid, `Expected "${phone}" to be invalid`).toBe(false);
      expect(result.error).toBeDefined();
    }
  });

  it('defaults to +1 country code for 10-digit numbers', () => {
    const result = validatePhone('4165551234');
    expect(result.valid).toBe(true);
    expect(result.normalized).toBe('+14165551234');
  });
});

// ---------------------------------------------------------------------------
// 3. Unit Number Validation
// ---------------------------------------------------------------------------

describe('Unit Number Validation', () => {
  it('accepts valid alphanumeric unit numbers', () => {
    const valid = [
      { input: '101', expected: '101' },
      { input: 'PH-2', expected: 'PH-2' },
      { input: 'B1.05', expected: 'B1.05' },
      { input: 'ph-2', expected: 'PH-2' },
      { input: 'a', expected: 'A' },
    ];

    for (const { input, expected } of valid) {
      const result = validateUnitNumber(input);
      expect(result.valid, `Expected "${input}" to be valid`).toBe(true);
      expect(result.normalized).toBe(expected);
    }
  });

  it('rejects invalid unit numbers', () => {
    const invalid = [
      '',
      'unit with spaces',
      '!@#$%',
      'A'.repeat(11), // > 10 chars
      'unit/101',
    ];

    for (const unit of invalid) {
      const result = validateUnitNumber(unit);
      expect(result.valid, `Expected "${unit}" to be invalid`).toBe(false);
      expect(result.error).toBeDefined();
    }
  });

  it('normalizes unit numbers to uppercase', () => {
    const result = validateUnitNumber('ph-2');
    expect(result.normalized).toBe('PH-2');
  });
});

// ---------------------------------------------------------------------------
// 4. Duplicate Detection — Similar Emails (typo tolerance)
// ---------------------------------------------------------------------------

describe('Duplicate Detection — Emails', () => {
  it('detects exact duplicate emails', () => {
    const residents = [
      makeResident({ id: 'r-1', email: 'john@gmail.com' }),
      makeResident({ id: 'r-2', email: 'john@gmail.com' }),
    ];

    const groups = findDuplicateEmails(residents);
    expect(groups).toHaveLength(1);
    expect(groups[0]).toHaveLength(2);
    expect(groups[0]!.map((m) => m.id)).toContain('r-1');
    expect(groups[0]!.map((m) => m.id)).toContain('r-2');
  });

  it('detects typo-similar emails (Levenshtein <= 2)', () => {
    const residents = [
      makeResident({ id: 'r-1', email: 'john@gmail.com' }),
      makeResident({ id: 'r-2', email: 'jonh@gmail.com' }), // 1 transposition
    ];

    const groups = findDuplicateEmails(residents);
    expect(groups).toHaveLength(1);
    expect(groups[0]!.map((m) => m.id)).toEqual(expect.arrayContaining(['r-1', 'r-2']));
  });

  it('does not flag completely different emails', () => {
    const residents = [
      makeResident({ id: 'r-1', email: 'john@gmail.com' }),
      makeResident({ id: 'r-2', email: 'alice@yahoo.com' }),
    ];

    const groups = findDuplicateEmails(residents);
    expect(groups).toHaveLength(0);
  });

  it('skips residents without email', () => {
    const residents = [
      makeResident({ id: 'r-1', email: 'john@gmail.com' }),
      makeResident({ id: 'r-2', email: undefined }),
    ];

    const groups = findDuplicateEmails(residents);
    expect(groups).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 5. Duplicate Detection — Similar Unit Numbers
// ---------------------------------------------------------------------------

describe('Duplicate Detection — Unit Numbers', () => {
  it('detects duplicate unit numbers (case-insensitive)', () => {
    const units = [
      makeUnit({ id: 'u-1', number: 'PH-2' }),
      makeUnit({ id: 'u-2', number: 'ph-2' }),
    ];

    const groups = findDuplicateUnits(units);
    expect(groups).toHaveLength(1);
    expect(groups[0]).toHaveLength(2);
  });

  it('does not flag distinct unit numbers', () => {
    const units = [makeUnit({ id: 'u-1', number: '101' }), makeUnit({ id: 'u-2', number: '102' })];

    const groups = findDuplicateUnits(units);
    expect(groups).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 6. Duplicate Detection — Similar Resident Names (fuzzy matching)
// ---------------------------------------------------------------------------

describe('Duplicate Detection — Resident Names', () => {
  it('detects fuzzy-match duplicate names (Levenshtein <= 2)', () => {
    const residents = [
      makeResident({ id: 'r-1', firstName: 'John', lastName: 'Smith' }),
      makeResident({ id: 'r-2', firstName: 'Jon', lastName: 'Smith' }),
    ];

    const groups = findDuplicateNames(residents);
    expect(groups).toHaveLength(1);
    expect(groups[0]!.map((m) => m.id)).toEqual(expect.arrayContaining(['r-1', 'r-2']));
    // Similarity should be > 0 and < 1
    const secondMatch = groups[0]!.find((m) => m.id === 'r-2');
    expect(secondMatch!.similarity).toBeGreaterThan(0.8);
    expect(secondMatch!.similarity).toBeLessThan(1);
  });

  it('does not flag completely different names', () => {
    const residents = [
      makeResident({ id: 'r-1', firstName: 'John', lastName: 'Smith' }),
      makeResident({ id: 'r-2', firstName: 'Alice', lastName: 'Wong' }),
    ];

    const groups = findDuplicateNames(residents);
    expect(groups).toHaveLength(0);
  });

  it('Levenshtein distance is correct for known pairs', () => {
    expect(levenshteinDistance('kitten', 'sitting')).toBe(3);
    expect(levenshteinDistance('', 'abc')).toBe(3);
    expect(levenshteinDistance('abc', 'abc')).toBe(0);
    expect(levenshteinDistance('john smith', 'jon smith')).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// 7. Quality Score — Unit with all fields = 100%
// ---------------------------------------------------------------------------

describe('Quality Score', () => {
  it('returns 100% completeness for a fully populated unit', () => {
    const unit = makeUnit(); // all fields present
    const score = calculateUnitQualityScore(unit);

    expect(score.completeness).toBe(100);
    expect(score.validity).toBe(100);
    expect(score.overall).toBe(100);

    // Every field should be marked as filled
    for (const detail of Object.values(score.details)) {
      expect(detail.filled).toBe(true);
    }
  });

  // ---------------------------------------------------------------------------
  // 8. Quality Score — Unit missing phone/email = lower score
  // ---------------------------------------------------------------------------

  it('returns lower score for a unit missing phone and email', () => {
    const unit = makeUnit({ email: undefined, phone: undefined });
    const score = calculateUnitQualityScore(unit);

    expect(score.completeness).toBeLessThan(100);
    expect(score.overall).toBeLessThan(100);
    expect(score.details['email']!.filled).toBe(false);
    expect(score.details['phone']!.filled).toBe(false);
  });

  // ---------------------------------------------------------------------------
  // 9. Quality Score — Weighted by field importance
  // ---------------------------------------------------------------------------

  it('weights fields by importance (emergencyContact > instructions)', () => {
    // Missing emergencyContact (weight 0.20) should hurt more than missing instructions (0.10)
    const unitMissingEmergency = makeUnit({ emergencyContact: undefined });
    const unitMissingInstructions = makeUnit({ instructions: undefined });

    const scoreEmergency = calculateUnitQualityScore(unitMissingEmergency);
    const scoreInstructions = calculateUnitQualityScore(unitMissingInstructions);

    expect(scoreEmergency.completeness).toBeLessThan(scoreInstructions.completeness);
  });

  it('correctly calculates overall as weighted combo of completeness and validity', () => {
    const unit = makeUnit();
    const score = calculateUnitQualityScore(unit);
    const expected = Math.round(score.completeness * 0.6 + score.validity * 0.4);
    expect(score.overall).toBe(expected);
  });
});

// ---------------------------------------------------------------------------
// 10. Missing Data Report — Units without emergency contacts
// ---------------------------------------------------------------------------

describe('Missing Data Reports', () => {
  it('reports units without emergency contacts', () => {
    const units = [
      makeUnit({ id: 'u-1', emergencyContact: 'Jane', emergencyPhone: '+14165551234' }),
      makeUnit({ id: 'u-2', emergencyContact: undefined, emergencyPhone: undefined }),
      makeUnit({ id: 'u-3', emergencyContact: 'Bob', emergencyPhone: undefined }),
    ];

    const report = findUnitsWithoutEmergencyContacts(units);
    expect(report.severity).toBe('critical');
    expect(report.affectedIds).toHaveLength(2);
    expect(report.affectedIds).toContain('u-2');
    expect(report.affectedIds).toContain('u-3');
    expect(report.description).toContain('2 units');
  });

  it('returns empty list when all units have emergency contacts', () => {
    const units = [makeUnit()];
    const report = findUnitsWithoutEmergencyContacts(units);
    expect(report.affectedIds).toHaveLength(0);
  });

  // ---------------------------------------------------------------------------
  // 11. Missing Data Report — Residents without email (BuildingLink feature)
  // ---------------------------------------------------------------------------

  it('reports residents without email', () => {
    const residents = [
      makeResident({ id: 'r-1', email: 'john@gmail.com' }),
      makeResident({ id: 'r-2', email: undefined }),
      makeResident({ id: 'r-3', email: undefined }),
    ];

    const report = findResidentsWithoutEmail(residents);
    expect(report.severity).toBe('critical');
    expect(report.affectedIds).toHaveLength(2);
    expect(report.affectedIds).toContain('r-2');
    expect(report.affectedIds).toContain('r-3');
    expect(report.description).toContain('2 residents');
  });

  it('returns empty list when all residents have email', () => {
    const residents = [makeResident()];
    const report = findResidentsWithoutEmail(residents);
    expect(report.affectedIds).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 12. Data Completeness Dashboard — Per-module completion percentages
// ---------------------------------------------------------------------------

describe('Data Completeness Dashboard', () => {
  it('calculates per-module completion percentages', () => {
    const units = [
      makeUnit({ id: 'u-1' }), // complete
      makeUnit({ id: 'u-2', floor: undefined }), // missing floor
    ];

    const residents = [
      makeResident({ id: 'r-1' }), // complete
      makeResident({ id: 'r-2', email: undefined }), // missing email
      makeResident({ id: 'r-3', phone: undefined, email: undefined }), // missing 2
    ];

    const modules = calculateModuleCompleteness(units, residents);
    expect(modules).toHaveLength(2);

    const unitsModule = modules.find((m) => m.module === 'Units');
    expect(unitsModule).toBeDefined();
    expect(unitsModule!.completed).toBe(1);
    expect(unitsModule!.missing).toBe(1);
    expect(unitsModule!.completeness).toBe(50);

    const residentsModule = modules.find((m) => m.module === 'Residents');
    expect(residentsModule).toBeDefined();
    expect(residentsModule!.completed).toBe(1);
    expect(residentsModule!.missing).toBe(2);
    expect(residentsModule!.completeness).toBeCloseTo(33.3, 0);
  });

  it('returns 100% when no records exist', () => {
    const modules = calculateModuleCompleteness([], []);
    for (const mod of modules) {
      expect(mod.completeness).toBe(100);
    }
  });
});

// ---------------------------------------------------------------------------
// 13. Auto-Fix Suggestions — Common email domain typos
// ---------------------------------------------------------------------------

describe('Auto-Fix Suggestions', () => {
  it('suggests fix for gmial.com -> gmail.com', () => {
    const fix = suggestEmailFixes('john@gmial.com');
    expect(fix).not.toBeNull();
    expect(fix!.suggested).toBe('john@gmail.com');
    expect(fix!.confidence).toBeGreaterThanOrEqual(0.9);
    expect(fix!.reason).toContain('gmial.com');
  });

  it('suggests fix for hotmal.com -> hotmail.com', () => {
    const fix = suggestEmailFixes('jane@hotmal.com');
    expect(fix).not.toBeNull();
    expect(fix!.suggested).toBe('jane@hotmail.com');
  });

  it('suggests fix for yaho.com -> yahoo.com', () => {
    const fix = suggestEmailFixes('test@yaho.com');
    expect(fix).not.toBeNull();
    expect(fix!.suggested).toBe('test@yahoo.com');
  });

  it('returns null for correct domains', () => {
    const fix = suggestEmailFixes('john@gmail.com');
    expect(fix).toBeNull();
  });

  it('returns null for empty/invalid input', () => {
    expect(suggestEmailFixes('')).toBeNull();
    expect(suggestEmailFixes('not-an-email')).toBeNull();
  });

  it('suggests phone country code fix for residents', () => {
    const resident = makeResident({ phone: '4165551234' });
    const fixes = suggestResidentFixes(resident);
    const phoneFix = fixes.find((f) => f.field === 'phone');
    expect(phoneFix).toBeDefined();
    expect(phoneFix!.suggested).toBe('+14165551234');
  });

  it('suggests whitespace normalization for names', () => {
    const resident = makeResident({ firstName: '  John  ', lastName: 'Smith' });
    const fixes = suggestResidentFixes(resident);
    const nameFix = fixes.find((f) => f.field === 'firstName');
    expect(nameFix).toBeDefined();
    expect(nameFix!.suggested).toBe('John');
  });

  it('returns no suggestions for clean data', () => {
    const resident = makeResident(); // all clean
    const fixes = suggestResidentFixes(resident);
    expect(fixes).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 14. Bulk Validation — Validate all units/residents in a property
// ---------------------------------------------------------------------------

describe('Bulk Validation', () => {
  it('validates all units and reports errors', () => {
    const units = [
      makeUnit({ id: 'u-1', number: '101' }),
      makeUnit({ id: 'u-2', number: '' }), // invalid
      makeUnit({ id: 'u-3', number: '303', email: 'bad-email' }), // invalid email
    ];

    const result = bulkValidateUnits(units);
    expect(result.totalRecords).toBe(3);
    expect(result.validRecords).toBe(1);
    expect(result.invalidRecords).toBe(2);
    expect(result.errors.length).toBeGreaterThanOrEqual(2);

    const emptyUnitError = result.errors.find((e) => e.recordId === 'u-2' && e.field === 'number');
    expect(emptyUnitError).toBeDefined();

    const badEmailError = result.errors.find((e) => e.recordId === 'u-3' && e.field === 'email');
    expect(badEmailError).toBeDefined();
  });

  it('validates all residents and reports errors', () => {
    const residents = [
      makeResident({ id: 'r-1' }), // valid
      makeResident({ id: 'r-2', email: 'not-an-email' }), // invalid email
      makeResident({ id: 'r-3', phone: '123' }), // invalid phone
    ];

    const result = bulkValidateResidents(residents);
    expect(result.totalRecords).toBe(3);
    expect(result.validRecords).toBe(1);
    expect(result.invalidRecords).toBe(2);

    const emailError = result.errors.find((e) => e.recordId === 'r-2' && e.field === 'email');
    expect(emailError).toBeDefined();

    const phoneError = result.errors.find((e) => e.recordId === 'r-3' && e.field === 'phone');
    expect(phoneError).toBeDefined();
  });

  it('returns all-valid result for clean data', () => {
    const units = [makeUnit(), makeUnit({ id: 'u-2', number: '202' })];
    const result = bulkValidateUnits(units);
    expect(result.totalRecords).toBe(2);
    expect(result.validRecords).toBe(2);
    expect(result.invalidRecords).toBe(0);
    expect(result.errors).toHaveLength(0);
  });

  it('handles empty arrays', () => {
    const unitResult = bulkValidateUnits([]);
    expect(unitResult.totalRecords).toBe(0);
    expect(unitResult.validRecords).toBe(0);
    expect(unitResult.errors).toHaveLength(0);

    const residentResult = bulkValidateResidents([]);
    expect(residentResult.totalRecords).toBe(0);
    expect(residentResult.validRecords).toBe(0);
    expect(residentResult.errors).toHaveLength(0);
  });
});
