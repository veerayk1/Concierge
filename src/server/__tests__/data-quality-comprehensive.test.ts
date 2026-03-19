/**
 * Data Quality Comprehensive Tests
 *
 * Extended testing for the data quality system covering:
 * - Duplicate detection across units
 * - Missing contact info detection
 * - Invalid email format detection
 * - Phone number format validation
 * - Data completeness scoring
 */

import { describe, expect, it } from 'vitest';
import {
  validateEmail,
  validatePhone,
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
    id: 'r-default',
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane.doe@gmail.com',
    phone: '+14165559876',
    unitId: 'u-1',
    moveInDate: '2025-06-01',
    ...overrides,
  };
}

function makeUnit(overrides: Partial<Unit> = {}): Unit {
  return {
    id: 'u-default',
    number: '501',
    floor: '5',
    propertyId: 'p-1',
    emergencyContact: 'Emergency Person',
    emergencyPhone: '+14165550000',
    email: 'unit501@building.com',
    phone: '+14165551111',
    instructions: 'Leave packages at door',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// 1. Duplicate detection across units
// ---------------------------------------------------------------------------

describe('Data Quality Comprehensive — Duplicate Detection Across Units', () => {
  it('detects exact duplicate unit numbers', () => {
    const units = [makeUnit({ id: 'u-1', number: '101' }), makeUnit({ id: 'u-2', number: '101' })];

    const groups = findDuplicateUnits(units);
    expect(groups).toHaveLength(1);
    expect(groups[0]).toHaveLength(2);
  });

  it('detects case-insensitive duplicate unit numbers', () => {
    const units = [
      makeUnit({ id: 'u-1', number: 'PH-1' }),
      makeUnit({ id: 'u-2', number: 'ph-1' }),
    ];

    const groups = findDuplicateUnits(units);
    expect(groups).toHaveLength(1);
  });

  it('does not flag unique unit numbers', () => {
    const units = [
      makeUnit({ id: 'u-1', number: '101' }),
      makeUnit({ id: 'u-2', number: '102' }),
      makeUnit({ id: 'u-3', number: '103' }),
    ];

    const groups = findDuplicateUnits(units);
    expect(groups).toHaveLength(0);
  });

  it('groups multiple duplicates together', () => {
    const units = [
      makeUnit({ id: 'u-1', number: '101' }),
      makeUnit({ id: 'u-2', number: '101' }),
      makeUnit({ id: 'u-3', number: '101' }),
    ];

    const groups = findDuplicateUnits(units);
    expect(groups).toHaveLength(1);
    expect(groups[0]).toHaveLength(3);
  });

  it('detects duplicate resident names with fuzzy matching', () => {
    const residents = [
      makeResident({ id: 'r-1', firstName: 'Michael', lastName: 'Johnson' }),
      makeResident({ id: 'r-2', firstName: 'Micheal', lastName: 'Johnson' }), // typo
    ];

    const groups = findDuplicateNames(residents);
    expect(groups).toHaveLength(1);
  });

  it('does not flag completely different names', () => {
    const residents = [
      makeResident({ id: 'r-1', firstName: 'Alice', lastName: 'Wong' }),
      makeResident({ id: 'r-2', firstName: 'Bob', lastName: 'Smith' }),
    ];

    const groups = findDuplicateNames(residents);
    expect(groups).toHaveLength(0);
  });

  it('Levenshtein distance handles edge cases', () => {
    expect(levenshteinDistance('', '')).toBe(0);
    expect(levenshteinDistance('abc', '')).toBe(3);
    expect(levenshteinDistance('', 'xyz')).toBe(3);
    expect(levenshteinDistance('same', 'same')).toBe(0);
  });

  it('detects multiple duplicate groups in separate sets', () => {
    const units = [
      makeUnit({ id: 'u-1', number: '101' }),
      makeUnit({ id: 'u-2', number: '101' }),
      makeUnit({ id: 'u-3', number: '202' }),
      makeUnit({ id: 'u-4', number: '202' }),
      makeUnit({ id: 'u-5', number: '303' }),
    ];

    const groups = findDuplicateUnits(units);
    expect(groups).toHaveLength(2);
  });

  it('handles empty arrays without errors', () => {
    expect(findDuplicateUnits([])).toHaveLength(0);
    expect(findDuplicateNames([])).toHaveLength(0);
    expect(findDuplicateEmails([])).toHaveLength(0);
  });

  it('handles single-item arrays without false positives', () => {
    const units = [makeUnit({ id: 'u-1', number: '101' })];
    const residents = [makeResident({ id: 'r-1' })];

    expect(findDuplicateUnits(units)).toHaveLength(0);
    expect(findDuplicateNames(residents)).toHaveLength(0);
    expect(findDuplicateEmails(residents)).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 2. Missing contact info detection
// ---------------------------------------------------------------------------

describe('Data Quality Comprehensive — Missing Contact Info Detection', () => {
  it('detects residents without email', () => {
    const residents = [
      makeResident({ id: 'r-1', email: 'has@email.com' }),
      makeResident({ id: 'r-2', email: undefined }),
      makeResident({ id: 'r-3', email: undefined }),
    ];

    const report = findResidentsWithoutEmail(residents);
    expect(report.affectedIds).toHaveLength(2);
    expect(report.affectedIds).toContain('r-2');
    expect(report.affectedIds).toContain('r-3');
    expect(report.severity).toBe('critical');
  });

  it('reports zero missing when all residents have email', () => {
    const residents = [
      makeResident({ id: 'r-1', email: 'a@b.com' }),
      makeResident({ id: 'r-2', email: 'c@d.com' }),
    ];

    const report = findResidentsWithoutEmail(residents);
    expect(report.affectedIds).toHaveLength(0);
  });

  it('detects units without emergency contacts', () => {
    const units = [
      makeUnit({ id: 'u-1', emergencyContact: 'Contact Person', emergencyPhone: '+14165551234' }),
      makeUnit({ id: 'u-2', emergencyContact: undefined, emergencyPhone: undefined }),
      makeUnit({ id: 'u-3', emergencyContact: 'Name Only', emergencyPhone: undefined }),
    ];

    const report = findUnitsWithoutEmergencyContacts(units);
    expect(report.affectedIds).toHaveLength(2);
    expect(report.severity).toBe('critical');
    expect(report.description).toContain('2 units');
  });

  it('reports zero missing when all units have complete emergency contacts', () => {
    const units = [
      makeUnit({
        id: 'u-1',
        emergencyContact: 'Person A',
        emergencyPhone: '+14165551111',
      }),
    ];

    const report = findUnitsWithoutEmergencyContacts(units);
    expect(report.affectedIds).toHaveLength(0);
  });

  it('handles empty arrays for missing contact reports', () => {
    const emailReport = findResidentsWithoutEmail([]);
    expect(emailReport.affectedIds).toHaveLength(0);

    const emergencyReport = findUnitsWithoutEmergencyContacts([]);
    expect(emergencyReport.affectedIds).toHaveLength(0);
  });

  it('counts all affected residents in description', () => {
    const residents = [
      makeResident({ id: 'r-1', email: undefined }),
      makeResident({ id: 'r-2', email: undefined }),
      makeResident({ id: 'r-3', email: undefined }),
      makeResident({ id: 'r-4', email: undefined }),
      makeResident({ id: 'r-5', email: 'has@email.com' }),
    ];

    const report = findResidentsWithoutEmail(residents);
    expect(report.affectedIds).toHaveLength(4);
    expect(report.description).toContain('4 residents');
  });
});

// ---------------------------------------------------------------------------
// 3. Invalid email format detection
// ---------------------------------------------------------------------------

describe('Data Quality Comprehensive — Invalid Email Format Detection', () => {
  it('accepts standard email formats', () => {
    const valid = [
      'user@example.com',
      'user.name@example.com',
      'user+tag@example.co.uk',
      'first.last@sub.domain.com',
    ];

    for (const email of valid) {
      const result = validateEmail(email);
      expect(result.valid, `Expected "${email}" to be valid`).toBe(true);
    }
  });

  it('rejects emails without @ symbol', () => {
    const result = validateEmail('notanemail');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('rejects emails without domain', () => {
    const result = validateEmail('user@');
    expect(result.valid).toBe(false);
  });

  it('rejects emails without local part', () => {
    const result = validateEmail('@example.com');
    expect(result.valid).toBe(false);
  });

  it('rejects emails with spaces', () => {
    const result = validateEmail('user name@example.com');
    expect(result.valid).toBe(false);
  });

  it('rejects emails with double @', () => {
    const result = validateEmail('user@@example.com');
    expect(result.valid).toBe(false);
  });

  it('rejects empty string', () => {
    const result = validateEmail('');
    expect(result.valid).toBe(false);
  });

  it('rejects email without TLD', () => {
    const result = validateEmail('user@example');
    expect(result.valid).toBe(false);
  });

  it('normalizes to lowercase and trimmed', () => {
    const result = validateEmail('  USER@EXAMPLE.COM  ');
    expect(result.valid).toBe(true);
    expect(result.normalized).toBe('user@example.com');
  });

  it('case-insensitive normalization preserves validity', () => {
    const result = validateEmail('John.Doe@Gmail.Com');
    expect(result.valid).toBe(true);
    expect(result.normalized).toBe('john.doe@gmail.com');
  });

  it('detects typo-similar duplicate emails', () => {
    const residents = [
      makeResident({ id: 'r-1', email: 'john@gmail.com' }),
      makeResident({ id: 'r-2', email: 'jonh@gmail.com' }), // transposition
    ];

    const groups = findDuplicateEmails(residents);
    expect(groups).toHaveLength(1);
  });

  it('suggests fix for common domain typos', () => {
    const gmialFix = suggestEmailFixes('user@gmial.com');
    expect(gmialFix).not.toBeNull();
    expect(gmialFix!.suggested).toBe('user@gmail.com');

    const hotmalFix = suggestEmailFixes('user@hotmal.com');
    expect(hotmalFix).not.toBeNull();
    expect(hotmalFix!.suggested).toBe('user@hotmail.com');

    const yahoFix = suggestEmailFixes('user@yaho.com');
    expect(yahoFix).not.toBeNull();
    expect(yahoFix!.suggested).toBe('user@yahoo.com');
  });

  it('returns null for correct email domains', () => {
    expect(suggestEmailFixes('user@gmail.com')).toBeNull();
    expect(suggestEmailFixes('user@hotmail.com')).toBeNull();
    expect(suggestEmailFixes('user@yahoo.com')).toBeNull();
  });

  it('bulk validation catches invalid emails', () => {
    const residents = [
      makeResident({ id: 'r-1', email: 'valid@email.com' }),
      makeResident({ id: 'r-2', email: 'not-an-email' }),
      makeResident({ id: 'r-3', email: '@missing-local.com' }),
    ];

    const result = bulkValidateResidents(residents);
    expect(result.invalidRecords).toBe(2);

    const emailErrors = result.errors.filter((e) => e.field === 'email');
    expect(emailErrors).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// 4. Phone number format validation
// ---------------------------------------------------------------------------

describe('Data Quality Comprehensive — Phone Number Format Validation', () => {
  it('accepts E.164 format with country code', () => {
    const result = validatePhone('+14165551234');
    expect(result.valid).toBe(true);
    expect(result.normalized).toBe('+14165551234');
  });

  it('accepts 10-digit number and adds +1', () => {
    const result = validatePhone('4165551234');
    expect(result.valid).toBe(true);
    expect(result.normalized).toBe('+14165551234');
  });

  it('accepts formatted number with dashes', () => {
    const result = validatePhone('416-555-1234');
    expect(result.valid).toBe(true);
    expect(result.normalized).toBe('+14165551234');
  });

  it('accepts formatted number with parentheses', () => {
    const result = validatePhone('(416) 555-1234');
    expect(result.valid).toBe(true);
    expect(result.normalized).toBe('+14165551234');
  });

  it('accepts number with spaces', () => {
    const result = validatePhone('+1 416 555 1234');
    expect(result.valid).toBe(true);
    expect(result.normalized).toBe('+14165551234');
  });

  it('accepts 11-digit number starting with 1', () => {
    const result = validatePhone('14165551234');
    expect(result.valid).toBe(true);
    expect(result.normalized).toBe('+14165551234');
  });

  it('rejects empty string', () => {
    const result = validatePhone('');
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  });

  it('rejects too-short numbers', () => {
    expect(validatePhone('123').valid).toBe(false);
    expect(validatePhone('12345').valid).toBe(false);
  });

  it('rejects area codes starting with 0', () => {
    const result = validatePhone('+10165551234');
    expect(result.valid).toBe(false);
  });

  it('rejects area codes starting with 1', () => {
    const result = validatePhone('+11165551234');
    expect(result.valid).toBe(false);
  });

  it('suggests country code fix for 10-digit numbers', () => {
    const resident = makeResident({ phone: '4165551234' });
    const fixes = suggestResidentFixes(resident);
    const phoneFix = fixes.find((f) => f.field === 'phone');
    expect(phoneFix).toBeDefined();
    expect(phoneFix!.suggested).toBe('+14165551234');
  });

  it('bulk validation catches invalid phone numbers', () => {
    const residents = [
      makeResident({ id: 'r-1', phone: '+14165551234' }),
      makeResident({ id: 'r-2', phone: '123' }),
      makeResident({ id: 'r-3', phone: 'not-a-phone' }),
    ];

    const result = bulkValidateResidents(residents);
    const phoneErrors = result.errors.filter((e) => e.field === 'phone');
    expect(phoneErrors).toHaveLength(2);
  });

  it('bulk validation allows missing phone (optional field)', () => {
    const residents = [makeResident({ id: 'r-1', phone: undefined })];

    const result = bulkValidateResidents(residents);
    // Phone is optional, so no error for missing phone
    const phoneErrors = result.errors.filter((e) => e.field === 'phone');
    expect(phoneErrors).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 5. Data completeness scoring
// ---------------------------------------------------------------------------

describe('Data Quality Comprehensive — Data Completeness Scoring', () => {
  it('fully populated unit scores 100% completeness', () => {
    const unit = makeUnit();
    const score = calculateUnitQualityScore(unit);

    expect(score.completeness).toBe(100);
    expect(score.overall).toBe(100);
  });

  it('unit missing email and phone scores lower', () => {
    const unit = makeUnit({ email: undefined, phone: undefined });
    const score = calculateUnitQualityScore(unit);

    expect(score.completeness).toBeLessThan(100);
    expect(score.details['email']!.filled).toBe(false);
    expect(score.details['phone']!.filled).toBe(false);
  });

  it('unit missing emergency contact has bigger score impact than missing instructions', () => {
    const unitNoEmergency = makeUnit({ emergencyContact: undefined });
    const unitNoInstructions = makeUnit({ instructions: undefined });

    const scoreNoEmergency = calculateUnitQualityScore(unitNoEmergency);
    const scoreNoInstructions = calculateUnitQualityScore(unitNoInstructions);

    // Emergency contact is weighted higher (0.20) than instructions (0.10)
    expect(scoreNoEmergency.completeness).toBeLessThan(scoreNoInstructions.completeness);
  });

  it('overall score is weighted combo of completeness (60%) and validity (40%)', () => {
    const unit = makeUnit();
    const score = calculateUnitQualityScore(unit);
    const expected = Math.round(score.completeness * 0.6 + score.validity * 0.4);
    expect(score.overall).toBe(expected);
  });

  it('module completeness dashboard shows per-module percentages', () => {
    const units = [makeUnit({ id: 'u-1' }), makeUnit({ id: 'u-2', floor: undefined })];

    const residents = [makeResident({ id: 'r-1' }), makeResident({ id: 'r-2', email: undefined })];

    const modules = calculateModuleCompleteness(units, residents);
    expect(modules).toHaveLength(2);

    const unitsModule = modules.find((m) => m.module === 'Units');
    expect(unitsModule!.completed).toBe(1);
    expect(unitsModule!.missing).toBe(1);
    expect(unitsModule!.completeness).toBe(50);

    const residentsModule = modules.find((m) => m.module === 'Residents');
    expect(residentsModule!.completed).toBe(1);
    expect(residentsModule!.missing).toBe(1);
    expect(residentsModule!.completeness).toBe(50);
  });

  it('module completeness returns 100% for empty arrays', () => {
    const modules = calculateModuleCompleteness([], []);
    for (const mod of modules) {
      expect(mod.completeness).toBe(100);
    }
  });

  it('bulk validation returns correct counts for all-valid data', () => {
    const units = [makeUnit({ id: 'u-1', number: '101' }), makeUnit({ id: 'u-2', number: '202' })];

    const result = bulkValidateUnits(units);
    expect(result.totalRecords).toBe(2);
    expect(result.validRecords).toBe(2);
    expect(result.invalidRecords).toBe(0);
    expect(result.errors).toHaveLength(0);
  });

  it('bulk validation returns correct counts for mixed data', () => {
    const units = [
      makeUnit({ id: 'u-1', number: '101' }),
      makeUnit({ id: 'u-2', number: '' }), // invalid
      makeUnit({ id: 'u-3', number: '303', email: 'bad-email' }), // invalid email
    ];

    const result = bulkValidateUnits(units);
    expect(result.totalRecords).toBe(3);
    expect(result.validRecords).toBe(1);
    expect(result.invalidRecords).toBe(2);
  });

  it('bulk validation handles empty input', () => {
    const unitResult = bulkValidateUnits([]);
    expect(unitResult.totalRecords).toBe(0);
    expect(unitResult.validRecords).toBe(0);
    expect(unitResult.errors).toHaveLength(0);

    const residentResult = bulkValidateResidents([]);
    expect(residentResult.totalRecords).toBe(0);
    expect(residentResult.validRecords).toBe(0);
    expect(residentResult.errors).toHaveLength(0);
  });

  it('name validation catches whitespace issues', () => {
    const result = validateName('  John  ');
    expect(result.valid).toBe(true);
    expect(result.normalized).toBe('John');
  });

  it('resident fix suggestions include whitespace normalization', () => {
    const resident = makeResident({ firstName: '  Jane  ', lastName: '  Doe  ' });
    const fixes = suggestResidentFixes(resident);
    const firstNameFix = fixes.find((f) => f.field === 'firstName');
    expect(firstNameFix).toBeDefined();
    expect(firstNameFix!.suggested).toBe('Jane');
  });

  it('no suggestions for clean resident data', () => {
    const resident = makeResident();
    const fixes = suggestResidentFixes(resident);
    expect(fixes).toHaveLength(0);
  });
});
