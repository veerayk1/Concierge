/**
 * Missing Contact Tracker Service Tests
 *
 * Validates detection of missing contact information, completeness scoring,
 * and report generation across employees, residents, and units.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  getMissingContacts,
  getContactCompleteness,
  generateMissingContactReport,
  type ContactDataSource,
  type PersonRecord,
  type UnitRecord,
} from '../missing-contact-tracker';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createEmployee(overrides: Partial<PersonRecord> = {}): PersonRecord {
  return {
    id: `emp-${Math.random().toString(36).slice(2, 8)}`,
    firstName: 'Jane',
    lastName: 'Staff',
    email: 'jane@building.com',
    phone: '+14165551234',
    propertyId: 'prop-1',
    ...overrides,
  };
}

function createResident(overrides: Partial<PersonRecord> = {}): PersonRecord {
  return {
    id: `res-${Math.random().toString(36).slice(2, 8)}`,
    firstName: 'John',
    lastName: 'Resident',
    email: 'john@example.com',
    phone: '+14165559876',
    unitNumber: '101',
    propertyId: 'prop-1',
    ...overrides,
  };
}

function createUnit(overrides: Partial<UnitRecord> = {}): UnitRecord {
  return {
    id: `unit-${Math.random().toString(36).slice(2, 8)}`,
    unitNumber: '101',
    propertyId: 'prop-1',
    emergencyContacts: [{ id: 'ec-1', name: 'Emergency Person', phone: '+14165550000' }],
    ...overrides,
  };
}

function createDataSource(
  employees: PersonRecord[] = [],
  residents: PersonRecord[] = [],
  units: UnitRecord[] = [],
): ContactDataSource {
  return {
    getEmployees: vi.fn().mockResolvedValue(employees),
    getResidents: vi.fn().mockResolvedValue(residents),
    getUnits: vi.fn().mockResolvedValue(units),
  };
}

// ---------------------------------------------------------------------------
// getMissingContacts
// ---------------------------------------------------------------------------

describe('Missing Contact Tracker — getMissingContacts', () => {
  it('returns zero counts when all contacts are present', async () => {
    const ds = createDataSource(
      [createEmployee(), createEmployee({ id: 'emp-2', firstName: 'Bob' })],
      [createResident(), createResident({ id: 'res-2', firstName: 'Alice' })],
      [createUnit(), createUnit({ id: 'unit-2', unitNumber: '102' })],
    );

    const result = await getMissingContacts('prop-1', ds);

    expect(result.employeesMissingEmail.count).toBe(0);
    expect(result.residentsMissingEmail.count).toBe(0);
    expect(result.residentsMissingPhone.count).toBe(0);
    expect(result.unitsMissingEmergencyContact.count).toBe(0);
  });

  it('counts employees missing email correctly', async () => {
    const ds = createDataSource(
      [
        createEmployee({ id: 'emp-1', email: null }),
        createEmployee({ id: 'emp-2', email: undefined }),
        createEmployee({ id: 'emp-3', email: 'valid@building.com' }),
      ],
      [],
      [],
    );

    const result = await getMissingContacts('prop-1', ds);

    expect(result.employeesMissingEmail.count).toBe(2);
    expect(result.employeesMissingEmail.total).toBe(3);
    expect(result.employeesMissingEmail.items).toHaveLength(2);
  });

  it('counts residents missing email', async () => {
    const ds = createDataSource(
      [],
      [
        createResident({ id: 'res-1', email: null }),
        createResident({ id: 'res-2', email: 'valid@example.com' }),
        createResident({ id: 'res-3', email: '' }),
      ],
      [],
    );

    const result = await getMissingContacts('prop-1', ds);

    expect(result.residentsMissingEmail.count).toBe(2);
    expect(result.residentsMissingEmail.total).toBe(3);
  });

  it('counts residents missing phone', async () => {
    const ds = createDataSource(
      [],
      [
        createResident({ id: 'res-1', phone: null }),
        createResident({ id: 'res-2', phone: '+14165559999' }),
        createResident({ id: 'res-3', phone: undefined }),
        createResident({ id: 'res-4', phone: '  ' }),
      ],
      [],
    );

    const result = await getMissingContacts('prop-1', ds);

    expect(result.residentsMissingPhone.count).toBe(3);
    expect(result.residentsMissingPhone.total).toBe(4);
  });

  it('counts units missing emergency contacts', async () => {
    const ds = createDataSource(
      [],
      [],
      [
        createUnit({ id: 'unit-1', emergencyContacts: [] }),
        createUnit({ id: 'unit-2' }), // has contacts
        createUnit({ id: 'unit-3', emergencyContacts: [] }),
      ],
    );

    const result = await getMissingContacts('prop-1', ds);

    expect(result.unitsMissingEmergencyContact.count).toBe(2);
    expect(result.unitsMissingEmergencyContact.total).toBe(3);
  });

  it('handles empty property with no users or units', async () => {
    const ds = createDataSource([], [], []);

    const result = await getMissingContacts('prop-1', ds);

    expect(result.employeesMissingEmail.count).toBe(0);
    expect(result.employeesMissingEmail.total).toBe(0);
    expect(result.residentsMissingEmail.count).toBe(0);
    expect(result.residentsMissingEmail.total).toBe(0);
    expect(result.residentsMissingPhone.count).toBe(0);
    expect(result.residentsMissingPhone.total).toBe(0);
    expect(result.unitsMissingEmergencyContact.count).toBe(0);
    expect(result.unitsMissingEmergencyContact.total).toBe(0);
  });

  it('includes person name and unit number in missing items', async () => {
    const ds = createDataSource(
      [],
      [
        createResident({
          id: 'res-1',
          firstName: 'Alice',
          lastName: 'Wong',
          unitNumber: '815',
          email: null,
        }),
      ],
      [],
    );

    const result = await getMissingContacts('prop-1', ds);

    expect(result.residentsMissingEmail.items[0]).toEqual({
      id: 'res-1',
      name: 'Alice Wong',
      unitNumber: '815',
    });
  });

  it('tenant isolation — only queries the specified propertyId', async () => {
    const ds = createDataSource([], [], []);

    await getMissingContacts('prop-42', ds);

    expect(ds.getEmployees).toHaveBeenCalledWith('prop-42');
    expect(ds.getResidents).toHaveBeenCalledWith('prop-42');
    expect(ds.getUnits).toHaveBeenCalledWith('prop-42');
  });

  it('treats empty-string email as missing', async () => {
    const ds = createDataSource([createEmployee({ id: 'emp-1', email: '' })], [], []);

    const result = await getMissingContacts('prop-1', ds);
    expect(result.employeesMissingEmail.count).toBe(1);
  });

  it('treats whitespace-only phone as missing', async () => {
    const ds = createDataSource([], [createResident({ id: 'res-1', phone: '   ' })], []);

    const result = await getMissingContacts('prop-1', ds);
    expect(result.residentsMissingPhone.count).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// getContactCompleteness
// ---------------------------------------------------------------------------

describe('Missing Contact Tracker — getContactCompleteness', () => {
  it('returns 100% when all contacts are present', async () => {
    const ds = createDataSource([createEmployee()], [createResident()], [createUnit()]);

    const score = await getContactCompleteness('prop-1', ds);

    // 1 employee email OK + 1 resident email OK + 1 resident phone OK + 1 unit EC OK = 4/4
    expect(score.percentage).toBe(100);
    expect(score.totalChecks).toBe(4);
    expect(score.passingChecks).toBe(4);
  });

  it('returns 75% when one out of four categories has a gap', async () => {
    const ds = createDataSource(
      [createEmployee()], // 1/1 email OK
      [createResident()], // 1/1 email OK, 1/1 phone OK
      [createUnit({ emergencyContacts: [] })], // 0/1 EC
    );

    const score = await getContactCompleteness('prop-1', ds);

    // 3 passing out of 4 total = 75%
    expect(score.percentage).toBe(75);
    expect(score.totalChecks).toBe(4);
    expect(score.passingChecks).toBe(3);
  });

  it('returns 100% for empty property (no people or units)', async () => {
    const ds = createDataSource([], [], []);

    const score = await getContactCompleteness('prop-1', ds);

    expect(score.percentage).toBe(100);
    expect(score.totalChecks).toBe(0);
    expect(score.passingChecks).toBe(0);
  });

  it('returns 0% when all contacts are missing', async () => {
    const ds = createDataSource(
      [createEmployee({ email: null })],
      [createResident({ email: null, phone: null })],
      [createUnit({ emergencyContacts: [] })],
    );

    const score = await getContactCompleteness('prop-1', ds);

    // 0 passing out of 4 total = 0%
    expect(score.percentage).toBe(0);
    expect(score.totalChecks).toBe(4);
    expect(score.passingChecks).toBe(0);
  });

  it('calculates correctly with mixed completeness', async () => {
    const ds = createDataSource(
      [
        createEmployee({ id: 'emp-1', email: 'a@b.com' }),
        createEmployee({ id: 'emp-2', email: null }),
      ],
      [
        createResident({ id: 'res-1', email: 'c@d.com', phone: '+1234' }),
        createResident({ id: 'res-2', email: null, phone: null }),
      ],
      [
        createUnit({ id: 'unit-1' }), // has EC
        createUnit({ id: 'unit-2', emergencyContacts: [] }),
      ],
    );

    const score = await getContactCompleteness('prop-1', ds);

    // emp email: 1/2, res email: 1/2, res phone: 1/2, unit EC: 1/2
    // total = 8, passing = 4 => 50%
    expect(score.percentage).toBe(50);
    expect(score.totalChecks).toBe(8);
    expect(score.passingChecks).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// generateMissingContactReport
// ---------------------------------------------------------------------------

describe('Missing Contact Tracker — generateMissingContactReport', () => {
  it('report includes all four categories', async () => {
    const ds = createDataSource([createEmployee()], [createResident()], [createUnit()]);

    const report = await generateMissingContactReport('prop-1', ds);

    expect(report.categories).toHaveLength(4);

    const labels = report.categories.map((c) => c.label);
    expect(labels).toContain('Employees Missing Email');
    expect(labels).toContain('Residents Missing Email');
    expect(labels).toContain('Residents Missing Phone');
    expect(labels).toContain('Units Missing Emergency Contact');
  });

  it('report includes propertyId and timestamp', async () => {
    const ds = createDataSource([], [], []);
    const now = new Date('2026-03-19T12:00:00Z');

    const report = await generateMissingContactReport('prop-42', ds, now);

    expect(report.propertyId).toBe('prop-42');
    expect(report.generatedAt).toEqual(now);
  });

  it('report includes completeness score', async () => {
    const ds = createDataSource([createEmployee()], [createResident()], [createUnit()]);

    const report = await generateMissingContactReport('prop-1', ds);

    expect(report.completeness).toBeDefined();
    expect(report.completeness.percentage).toBe(100);
  });

  it('assigns correct severity to categories', async () => {
    const ds = createDataSource([createEmployee()], [createResident()], [createUnit()]);

    const report = await generateMissingContactReport('prop-1', ds);

    const emergencyCategory = report.categories.find(
      (c) => c.label === 'Units Missing Emergency Contact',
    );
    const emailCategory = report.categories.find((c) => c.label === 'Employees Missing Email');
    const phoneCategory = report.categories.find((c) => c.label === 'Residents Missing Phone');

    expect(emergencyCategory!.severity).toBe('critical');
    expect(emailCategory!.severity).toBe('warning');
    expect(phoneCategory!.severity).toBe('info');
  });

  it('category percentage reflects completeness', async () => {
    const ds = createDataSource(
      [],
      [
        createResident({ id: 'res-1', email: 'a@b.com' }),
        createResident({ id: 'res-2', email: null }),
      ],
      [],
    );

    const report = await generateMissingContactReport('prop-1', ds);

    const residentEmail = report.categories.find((c) => c.label === 'Residents Missing Email');
    // 1 out of 2 have email => 50% completeness
    expect(residentEmail!.percentage).toBe(50);
    expect(residentEmail!.count).toBe(1);
    expect(residentEmail!.total).toBe(2);
  });

  it('report for empty property has 100% completeness in all categories', async () => {
    const ds = createDataSource([], [], []);

    const report = await generateMissingContactReport('prop-1', ds);

    for (const category of report.categories) {
      expect(category.percentage).toBe(100);
      expect(category.count).toBe(0);
      expect(category.total).toBe(0);
    }
  });
});
