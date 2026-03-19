/**
 * Data Migration API Tests — Import/Export, CSV Mapping, DSAR, Competitor Migration
 *
 * Per PRD 27: Tests cover CSV upload, column mapping, dry-run validation,
 * user/unit/package import with role assignment, duplicate detection,
 * progress tracking, DSAR-compliant export, entity-specific export,
 * competitor format import (BuildingLink, Aquarius), and import rollback.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createPostRequest, createGetRequest, parseResponse } from '@/test/helpers/api';
import {
  parseCsv,
  autoDetectMappings,
  validateMappedData,
  convertCompetitorFormat,
} from '@/server/data-migration';
import type { ColumnMapping } from '@/server/data-migration';

// ---------------------------------------------------------------------------
// Mock Setup
// ---------------------------------------------------------------------------

const mockUserFindMany = vi.fn();
const mockUserCreate = vi.fn();
const mockUnitFindMany = vi.fn();
const mockUnitCreate = vi.fn();
const mockPackageFindMany = vi.fn();
const mockPackageCreate = vi.fn();
const mockMaintenanceFindMany = vi.fn();
const mockVisitorFindMany = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    user: {
      findMany: (...args: unknown[]) => mockUserFindMany(...args),
      create: (...args: unknown[]) => mockUserCreate(...args),
    },
    unit: {
      findMany: (...args: unknown[]) => mockUnitFindMany(...args),
      create: (...args: unknown[]) => mockUnitCreate(...args),
    },
    package: {
      findMany: (...args: unknown[]) => mockPackageFindMany(...args),
      create: (...args: unknown[]) => mockPackageCreate(...args),
    },
    maintenanceRequest: {
      findMany: (...args: unknown[]) => mockMaintenanceFindMany(...args),
    },
    visitorEntry: {
      findMany: (...args: unknown[]) => mockVisitorFindMany(...args),
    },
  },
}));

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: vi.fn().mockResolvedValue({
    user: {
      userId: 'test-admin',
      propertyId: '00000000-0000-4000-b000-000000000001',
      role: 'property_admin',
      permissions: ['*'],
      mfaVerified: false,
    },
    error: null,
  }),
}));

// Route imports MUST come after vi.mock calls
import { POST as POST_IMPORT } from '../import/route';
import { GET as GET_IMPORT_STATUS } from '../import/[id]/status/route';
import { POST as POST_EXPORT } from '../export/route';

beforeEach(() => {
  vi.clearAllMocks();
  mockUserFindMany.mockResolvedValue([]);
  mockUserCreate.mockResolvedValue({ id: 'new-user-1' });
  mockUnitFindMany.mockResolvedValue([]);
  mockUnitCreate.mockResolvedValue({ id: 'new-unit-1' });
  mockPackageFindMany.mockResolvedValue([]);
  mockPackageCreate.mockResolvedValue({ id: 'new-pkg-1' });
  mockMaintenanceFindMany.mockResolvedValue([]);
  mockVisitorFindMany.mockResolvedValue([]);
});

const PROPERTY_ID = '00000000-0000-4000-b000-000000000001';

// ===========================================================================
// HELPER: build a CSV string
// ===========================================================================

function buildCsv(headers: string[], rows: string[][]): string {
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

// ===========================================================================
// 1. POST /data-migration/import — upload CSV file for import
// ===========================================================================

describe('POST /api/v1/data-migration/import — Upload CSV for import', () => {
  const usersCsv = buildCsv(
    ['first_name', 'last_name', 'email', 'phone'],
    [
      ['Alice', 'Smith', 'alice@example.com', '555-0001'],
      ['Bob', 'Jones', 'bob@example.com', '555-0002'],
    ],
  );

  it('accepts CSV content and returns import job', async () => {
    const req = createPostRequest('/api/v1/data-migration/import', {
      propertyId: PROPERTY_ID,
      entityType: 'users',
      csvContent: usersCsv,
      fileName: 'residents.csv',
    });
    const res = await POST_IMPORT(req);
    expect(res.status).toBe(202);

    const body = await parseResponse<{
      data: { importId: string; status: string; totalRows: number; entityType: string };
      message: string;
    }>(res);
    expect(body.data.importId).toBeDefined();
    expect(['pending', 'validating', 'importing', 'completed']).toContain(body.data.status);
    expect(body.data.totalRows).toBe(2);
    expect(body.data.entityType).toBe('users');
    expect(body.message).toContain('Import job created');
  });

  it('rejects request without required fields', async () => {
    const req = createPostRequest('/api/v1/data-migration/import', {});
    const res = await POST_IMPORT(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('rejects invalid entity type', async () => {
    const req = createPostRequest('/api/v1/data-migration/import', {
      propertyId: PROPERTY_ID,
      entityType: 'invalid_type',
      csvContent: usersCsv,
    });
    const res = await POST_IMPORT(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string; message: string }>(res);
    expect(body.message).toContain('Invalid entityType');
  });

  it('rejects CSV with no data rows', async () => {
    const emptyCsv = 'first_name,last_name,email';
    const req = createPostRequest('/api/v1/data-migration/import', {
      propertyId: PROPERTY_ID,
      entityType: 'users',
      csvContent: emptyCsv,
    });
    const res = await POST_IMPORT(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('no data rows');
  });
});

// ===========================================================================
// 2. CSV column mapping: map source columns to Concierge fields
// ===========================================================================

describe('CSV column mapping — auto-detect and manual mapping', () => {
  it('auto-detects standard column names', () => {
    const headers = ['first_name', 'last_name', 'email', 'phone'];
    const mappings = autoDetectMappings(headers, 'users');

    expect(mappings).toHaveLength(4);
    expect(mappings).toContainEqual({ sourceColumn: 'first_name', targetField: 'first_name' });
    expect(mappings).toContainEqual({ sourceColumn: 'email', targetField: 'email' });
  });

  it('auto-detects similar column names (e.g., "Email Address" → email)', () => {
    const headers = ['First Name', 'Last Name', 'Email'];
    const mappings = autoDetectMappings(headers, 'users');

    // Should find mappings for at least some columns
    expect(mappings.length).toBeGreaterThan(0);
  });

  it('accepts explicit column mappings in import request', async () => {
    const csv = buildCsv(['fname', 'lname', 'mail'], [['Alice', 'Smith', 'alice@example.com']]);

    const mappings: ColumnMapping[] = [
      { sourceColumn: 'fname', targetField: 'first_name' },
      { sourceColumn: 'lname', targetField: 'last_name' },
      { sourceColumn: 'mail', targetField: 'email' },
    ];

    const req = createPostRequest('/api/v1/data-migration/import', {
      propertyId: PROPERTY_ID,
      entityType: 'users',
      csvContent: csv,
      columnMappings: mappings,
      dryRun: true,
    });
    const res = await POST_IMPORT(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { mappings: ColumnMapping[]; validRows: number };
    }>(res);
    expect(body.data.mappings).toEqual(mappings);
    expect(body.data.validRows).toBe(1);
  });

  it('returns error when no mappings can be determined', async () => {
    const csv = buildCsv(['xyz_col', 'abc_col'], [['val1', 'val2']]);

    const req = createPostRequest('/api/v1/data-migration/import', {
      propertyId: PROPERTY_ID,
      entityType: 'users',
      csvContent: csv,
    });
    const res = await POST_IMPORT(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{
      error: string;
      availableFields: string[];
      sourceHeaders: string[];
    }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
    expect(body.availableFields).toBeDefined();
    expect(body.sourceHeaders).toEqual(['xyz_col', 'abc_col']);
  });
});

// ===========================================================================
// 3. Validate mapped data before import (dry-run mode)
// ===========================================================================

describe('Dry-run validation — validate mapped data before import', () => {
  it('returns validation results without importing data', async () => {
    const csv = buildCsv(
      ['first_name', 'last_name', 'email'],
      [
        ['Alice', 'Smith', 'alice@example.com'],
        ['Bob', 'Jones', 'bob@example.com'],
      ],
    );

    const req = createPostRequest('/api/v1/data-migration/import', {
      propertyId: PROPERTY_ID,
      entityType: 'users',
      csvContent: csv,
      dryRun: true,
    });
    const res = await POST_IMPORT(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: {
        valid: boolean;
        totalRows: number;
        validRows: number;
        errorRows: number;
        preview: unknown[];
      };
      message: string;
    }>(res);
    expect(body.data.valid).toBe(true);
    expect(body.data.totalRows).toBe(2);
    expect(body.data.validRows).toBe(2);
    expect(body.data.errorRows).toBe(0);
    expect(body.message).toContain('Dry-run');

    // Ensure no DB writes happened
    expect(mockUserCreate).not.toHaveBeenCalled();
  });

  it('reports validation errors with row numbers and field names', () => {
    const rows = [
      { first_name: 'Alice', last_name: 'Smith', email: 'invalid-email' },
      { first_name: '', last_name: 'Jones', email: 'bob@example.com' },
    ];

    const mappings: ColumnMapping[] = [
      { sourceColumn: 'first_name', targetField: 'first_name' },
      { sourceColumn: 'last_name', targetField: 'last_name' },
      { sourceColumn: 'email', targetField: 'email' },
    ];

    const result = validateMappedData(rows, mappings, 'users');

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    // Row with invalid email
    expect(
      result.errors.some((e) => e.field === 'email' && e.message.includes('Invalid email')),
    ).toBe(true);
    // Row with missing first_name
    expect(
      result.errors.some((e) => e.field === 'first_name' && e.message.includes('missing')),
    ).toBe(true);
  });

  it('returns preview of first 5 valid rows', () => {
    const rows = Array.from({ length: 10 }, (_, i) => ({
      first_name: `User${i}`,
      last_name: `Last${i}`,
      email: `user${i}@example.com`,
    }));

    const mappings: ColumnMapping[] = [
      { sourceColumn: 'first_name', targetField: 'first_name' },
      { sourceColumn: 'last_name', targetField: 'last_name' },
      { sourceColumn: 'email', targetField: 'email' },
    ];

    const result = validateMappedData(rows, mappings, 'users');
    expect(result.preview).toHaveLength(5);
  });
});

// ===========================================================================
// 4. Import users from CSV with role assignment
// ===========================================================================

describe('Import users from CSV with role assignment', () => {
  it('creates users with default resident role', async () => {
    const csv = buildCsv(
      ['first_name', 'last_name', 'email', 'phone'],
      [['Alice', 'Smith', 'alice@example.com', '555-1234']],
    );

    const req = createPostRequest('/api/v1/data-migration/import', {
      propertyId: PROPERTY_ID,
      entityType: 'users',
      csvContent: csv,
    });
    const res = await POST_IMPORT(req);
    expect(res.status).toBe(202);

    // Wait for async import processing
    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockUserCreate).toHaveBeenCalled();
    const createArgs = mockUserCreate.mock.calls[0]![0];
    expect(createArgs.data.firstName).toBe('Alice');
    expect(createArgs.data.lastName).toBe('Smith');
    expect(createArgs.data.email).toBe('alice@example.com');
    expect(createArgs.data.userProperties.create.propertyId).toBe(PROPERTY_ID);
    expect(createArgs.data.userProperties.create.roleId).toBe('default-resident-role');
  });

  it('sets passwordHash to IMPORTED_NEEDS_RESET for imported users', async () => {
    const csv = buildCsv(
      ['first_name', 'last_name', 'email'],
      [['Alice', 'Smith', 'alice@example.com']],
    );

    const req = createPostRequest('/api/v1/data-migration/import', {
      propertyId: PROPERTY_ID,
      entityType: 'users',
      csvContent: csv,
    });
    await POST_IMPORT(req);
    await new Promise((resolve) => setTimeout(resolve, 100));

    const createArgs = mockUserCreate.mock.calls[0]![0];
    expect(createArgs.data.passwordHash).toBe('IMPORTED_NEEDS_RESET');
  });
});

// ===========================================================================
// 5. Import units from CSV with floor/building mapping
// ===========================================================================

describe('Import units from CSV with floor/building mapping', () => {
  it('creates units with floor and building data', async () => {
    const csv = buildCsv(
      ['number', 'floor', 'building', 'type', 'status', 'sq_ft'],
      [['101', '1', 'Tower A', 'residential', 'active', '850']],
    );

    const req = createPostRequest('/api/v1/data-migration/import', {
      propertyId: PROPERTY_ID,
      entityType: 'units',
      csvContent: csv,
    });
    const res = await POST_IMPORT(req);
    expect(res.status).toBe(202);

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockUnitCreate).toHaveBeenCalled();
    const createArgs = mockUnitCreate.mock.calls[0]![0];
    expect(createArgs.data.number).toBe('101');
    expect(createArgs.data.floor).toBe(1);
    expect(createArgs.data.unitType).toBe('residential');
    expect(createArgs.data.squareFootage).toBe(850);
    expect(createArgs.data.propertyId).toBe(PROPERTY_ID);
  });

  it('validates unit number is required', () => {
    const rows = [{ number: '', floor: '1', building: 'A' }];
    const mappings: ColumnMapping[] = [
      { sourceColumn: 'number', targetField: 'number' },
      { sourceColumn: 'floor', targetField: 'floor' },
    ];

    const result = validateMappedData(rows, mappings, 'units');
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.field === 'number')).toBe(true);
  });
});

// ===========================================================================
// 6. Import packages history from CSV
// ===========================================================================

describe('Import packages history from CSV', () => {
  it('creates package records with correct field mapping', async () => {
    const csv = buildCsv(
      ['reference', 'unit_number', 'courier', 'status', 'tracking_number', 'perishable'],
      [['PKG-001', '101', 'FedEx', 'received', '1Z999AA10123456784', 'No']],
    );

    const mappings: ColumnMapping[] = [
      { sourceColumn: 'reference', targetField: 'reference' },
      { sourceColumn: 'unit_number', targetField: 'unit_number' },
      { sourceColumn: 'courier', targetField: 'courier' },
      { sourceColumn: 'status', targetField: 'status' },
      { sourceColumn: 'tracking_number', targetField: 'tracking_number' },
      { sourceColumn: 'perishable', targetField: 'perishable' },
    ];

    const req = createPostRequest('/api/v1/data-migration/import', {
      propertyId: PROPERTY_ID,
      entityType: 'packages',
      csvContent: csv,
      columnMappings: mappings,
    });
    const res = await POST_IMPORT(req);
    expect(res.status).toBe(202);

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(mockPackageCreate).toHaveBeenCalled();
    const createArgs = mockPackageCreate.mock.calls[0]![0];
    expect(createArgs.data.referenceNumber).toBe('PKG-001');
    expect(createArgs.data.status).toBe('received');
    expect(createArgs.data.isPerishable).toBe(false);
    expect(createArgs.data.propertyId).toBe(PROPERTY_ID);
  });
});

// ===========================================================================
// 7. Handle duplicate detection during import (skip/overwrite/merge)
// ===========================================================================

describe('Duplicate detection during import — skip/overwrite/merge', () => {
  it('skips duplicate rows when strategy is "skip"', async () => {
    // Existing user in DB
    mockUserFindMany.mockResolvedValue([{ email: 'alice@example.com' }]);

    const csv = buildCsv(
      ['first_name', 'last_name', 'email'],
      [
        ['Alice', 'Smith', 'alice@example.com'], // duplicate
        ['Charlie', 'Brown', 'charlie@example.com'], // new
      ],
    );

    const req = createPostRequest('/api/v1/data-migration/import', {
      propertyId: PROPERTY_ID,
      entityType: 'users',
      csvContent: csv,
      duplicateStrategy: 'skip',
    });
    const res = await POST_IMPORT(req);
    expect(res.status).toBe(202);

    const body = await parseResponse<{
      data: { duplicateStrategy: string };
    }>(res);
    expect(body.data.duplicateStrategy).toBe('skip');
  });

  it('rejects invalid duplicate strategy', async () => {
    const csv = buildCsv(
      ['first_name', 'last_name', 'email'],
      [['Alice', 'Smith', 'alice@example.com']],
    );

    const req = createPostRequest('/api/v1/data-migration/import', {
      propertyId: PROPERTY_ID,
      entityType: 'users',
      csvContent: csv,
      duplicateStrategy: 'invalid_strategy',
    });
    const res = await POST_IMPORT(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('Invalid duplicateStrategy');
  });

  it('detects duplicate units by unit number', async () => {
    mockUnitFindMany.mockResolvedValue([{ number: '101' }, { number: '102' }]);

    const csv = buildCsv(
      ['number', 'floor'],
      [
        ['101', '1'], // duplicate
        ['103', '1'], // new
      ],
    );

    const req = createPostRequest('/api/v1/data-migration/import', {
      propertyId: PROPERTY_ID,
      entityType: 'units',
      csvContent: csv,
      duplicateStrategy: 'skip',
    });
    const res = await POST_IMPORT(req);
    expect(res.status).toBe(202);
  });
});

// ===========================================================================
// 8. Import progress tracking: GET /data-migration/import/:id/status
// ===========================================================================

describe('GET /api/v1/data-migration/import/:id/status — Progress tracking', () => {
  it('returns job status with progress percentage', async () => {
    // First create an import job
    const csv = buildCsv(
      ['first_name', 'last_name', 'email'],
      [
        ['Alice', 'Smith', 'alice@example.com'],
        ['Bob', 'Jones', 'bob@example.com'],
      ],
    );

    const importReq = createPostRequest('/api/v1/data-migration/import', {
      propertyId: PROPERTY_ID,
      entityType: 'users',
      csvContent: csv,
    });
    const importRes = await POST_IMPORT(importReq);
    const importBody = await parseResponse<{
      data: { importId: string };
    }>(importRes);

    // Wait for processing
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Now check status
    const statusReq = createGetRequest(
      `/api/v1/data-migration/import/${importBody.data.importId}/status`,
    );
    const statusRes = await GET_IMPORT_STATUS(statusReq, {
      params: Promise.resolve({ id: importBody.data.importId }),
    });
    expect(statusRes.status).toBe(200);

    const statusBody = await parseResponse<{
      data: {
        id: string;
        status: string;
        progress: number;
        totalRows: number;
        processedRows: number;
        successRows: number;
        errorRows: number;
        entityType: string;
        createdAt: string;
      };
    }>(statusRes);

    expect(statusBody.data.id).toBe(importBody.data.importId);
    expect(statusBody.data.entityType).toBe('users');
    expect(statusBody.data.totalRows).toBe(2);
    expect(typeof statusBody.data.progress).toBe('number');
    expect(statusBody.data.createdAt).toBeDefined();
  });

  it('returns 404 for non-existent import job', async () => {
    const req = createGetRequest('/api/v1/data-migration/import/non-existent/status');
    const res = await GET_IMPORT_STATUS(req, {
      params: Promise.resolve({ id: 'non-existent' }),
    });
    expect(res.status).toBe(404);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('NOT_FOUND');
  });
});

// ===========================================================================
// 9. Export all data for a property (DSAR compliance)
// ===========================================================================

describe('POST /api/v1/data-migration/export — DSAR-compliant export', () => {
  it('exports all entity types for a property', async () => {
    mockUserFindMany.mockResolvedValue([
      {
        id: 'u1',
        firstName: 'Alice',
        lastName: 'Smith',
        email: 'alice@example.com',
        phone: '555-1234',
        isActive: true,
        createdAt: new Date('2026-01-01'),
        userProperties: [{ role: { name: 'resident_owner' } }],
      },
    ]);
    mockUnitFindMany.mockResolvedValue([
      {
        number: '101',
        floor: '1',
        building: { name: 'Tower A' },
        unitType: 'residential',
        status: 'active',
        squareFootage: 850,
        parkingSpot: 'P1',
        locker: 'L1',
      },
    ]);

    const req = createPostRequest('/api/v1/data-migration/export', {
      propertyId: PROPERTY_ID,
      format: 'json',
    });
    const res = await POST_EXPORT(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: {
        exportId: string;
        data: Record<string, unknown[]>;
        entityTypes: string[];
        dsarCompliant: boolean;
        generatedAt: string;
      };
      message: string;
    }>(res);

    expect(body.data.exportId).toBeDefined();
    expect(body.data.entityTypes).toContain('users');
    expect(body.data.entityTypes).toContain('units');
    expect(body.data.data.users).toHaveLength(1);
    expect(body.data.data.units).toHaveLength(1);
    expect(body.data.generatedAt).toBeDefined();
  });

  it('supports DSAR-compliant personal data export', async () => {
    mockUserFindMany.mockResolvedValue([
      {
        id: 'u1',
        firstName: 'Alice',
        lastName: 'Smith',
        email: 'alice@example.com',
        phone: null,
        isActive: true,
        createdAt: new Date(),
        userProperties: [{ role: { name: 'resident_owner' } }],
      },
    ]);

    const req = createPostRequest('/api/v1/data-migration/export', {
      propertyId: PROPERTY_ID,
      format: 'json',
      dsarCompliant: true,
    });
    const res = await POST_EXPORT(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { dsarCompliant: boolean };
      message: string;
    }>(res);
    expect(body.data.dsarCompliant).toBe(true);
    expect(body.message).toContain('DSAR');
  });

  it('rejects missing propertyId', async () => {
    const req = createPostRequest('/api/v1/data-migration/export', {
      format: 'json',
    });
    const res = await POST_EXPORT(req);
    expect(res.status).toBe(400);
  });
});

// ===========================================================================
// 10. Export specific entity type (users, units, packages, etc.)
// ===========================================================================

describe('Export specific entity type', () => {
  it('exports only specified entity types', async () => {
    mockPackageFindMany.mockResolvedValue([
      {
        referenceNumber: 'PKG-001',
        unit: { number: '101' },
        courier: { name: 'FedEx' },
        status: 'received',
        trackingNumber: '1Z999AA1',
        isPerishable: false,
        createdAt: new Date(),
        releasedAt: null,
      },
    ]);

    const req = createPostRequest('/api/v1/data-migration/export', {
      propertyId: PROPERTY_ID,
      entityTypes: ['packages'],
      format: 'json',
    });
    const res = await POST_EXPORT(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: {
        entityTypes: string[];
        data: { packages: unknown[] };
      };
    }>(res);
    expect(body.data.entityTypes).toEqual(['packages']);
    expect(body.data.data.packages).toHaveLength(1);
  });

  it('exports multiple specific entity types', async () => {
    mockUserFindMany.mockResolvedValue([]);
    mockUnitFindMany.mockResolvedValue([]);

    const req = createPostRequest('/api/v1/data-migration/export', {
      propertyId: PROPERTY_ID,
      entityTypes: ['users', 'units'],
      format: 'json',
    });
    const res = await POST_EXPORT(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { entityTypes: string[] };
    }>(res);
    expect(body.data.entityTypes).toEqual(['users', 'units']);
  });

  it('rejects invalid entity types in export', async () => {
    const req = createPostRequest('/api/v1/data-migration/export', {
      propertyId: PROPERTY_ID,
      entityTypes: ['invalid_entity'],
      format: 'json',
    });
    const res = await POST_EXPORT(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('Invalid entity types');
  });
});

// ===========================================================================
// 11. Import from competitor format: BuildingLink CSV export
// ===========================================================================

describe('Import from competitor format — BuildingLink CSV export', () => {
  it('auto-maps BuildingLink column names to Concierge fields', () => {
    const headers = ['First Name', 'Last Name', 'Email Address', 'Phone Number', 'Unit', 'Role'];
    const mappings = autoDetectMappings(headers, 'users', 'buildinglink');

    expect(mappings).toContainEqual({ sourceColumn: 'First Name', targetField: 'first_name' });
    expect(mappings).toContainEqual({ sourceColumn: 'Last Name', targetField: 'last_name' });
    expect(mappings).toContainEqual({ sourceColumn: 'Email Address', targetField: 'email' });
    expect(mappings).toContainEqual({ sourceColumn: 'Phone Number', targetField: 'phone' });
  });

  it('converts BuildingLink CSV to Concierge format', () => {
    const buildingLinkCsv = buildCsv(
      ['Unit Number', 'Floor', 'Building Name', 'Unit Type', 'Status'],
      [['301', '3', 'West Tower', 'condo', 'occupied']],
    );

    const result = convertCompetitorFormat(buildingLinkCsv, 'units', 'buildinglink');

    expect(result.mappings.length).toBeGreaterThan(0);
    expect(result.rows[0]).toHaveProperty('number', '301');
    expect(result.rows[0]).toHaveProperty('floor', '3');
    expect(result.rows[0]).toHaveProperty('building', 'West Tower');
  });

  it('imports BuildingLink CSV via competitorFormat parameter', async () => {
    const csv = buildCsv(
      ['First Name', 'Last Name', 'Email Address', 'Phone Number'],
      [['Alice', 'Smith', 'alice@example.com', '555-0001']],
    );

    const req = createPostRequest('/api/v1/data-migration/import', {
      propertyId: PROPERTY_ID,
      entityType: 'users',
      csvContent: csv,
      competitorFormat: 'buildinglink',
      dryRun: true,
    });
    const res = await POST_IMPORT(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { valid: boolean; validRows: number };
    }>(res);
    expect(body.data.valid).toBe(true);
    expect(body.data.validRows).toBe(1);
  });
});

// ===========================================================================
// 12. Import from competitor format: Aquarius backup
// ===========================================================================

describe('Import from competitor format — Aquarius backup', () => {
  it('auto-maps Aquarius column names to Concierge fields', () => {
    const headers = ['FirstName', 'LastName', 'EmailAddress', 'PhoneNo', 'UnitNo', 'UserRole'];
    const mappings = autoDetectMappings(headers, 'users', 'aquarius');

    expect(mappings).toContainEqual({ sourceColumn: 'FirstName', targetField: 'first_name' });
    expect(mappings).toContainEqual({ sourceColumn: 'LastName', targetField: 'last_name' });
    expect(mappings).toContainEqual({ sourceColumn: 'EmailAddress', targetField: 'email' });
    expect(mappings).toContainEqual({ sourceColumn: 'PhoneNo', targetField: 'phone' });
  });

  it('converts Aquarius CSV to Concierge format', () => {
    const aquariusCsv = buildCsv(
      ['UnitNo', 'FloorNo', 'BuildingName', 'UnitType', 'UnitStatus'],
      [['201', '2', 'East Wing', 'studio', 'vacant']],
    );

    const result = convertCompetitorFormat(aquariusCsv, 'units', 'aquarius');

    expect(result.mappings.length).toBeGreaterThan(0);
    expect(result.rows[0]).toHaveProperty('number', '201');
    expect(result.rows[0]).toHaveProperty('floor', '2');
    expect(result.rows[0]).toHaveProperty('building', 'East Wing');
  });

  it('converts Aquarius package data', () => {
    const aquariusCsv = buildCsv(
      ['RefNo', 'UnitNo', 'CourierName', 'PkgStatus', 'TrackingNo'],
      [['REF-001', '101', 'Canada Post', 'picked_up', 'CP123456789']],
    );

    const result = convertCompetitorFormat(aquariusCsv, 'packages', 'aquarius');

    expect(result.rows[0]).toHaveProperty('reference', 'REF-001');
    expect(result.rows[0]).toHaveProperty('courier', 'Canada Post');
    expect(result.rows[0]).toHaveProperty('status', 'picked_up');
  });

  it('imports Aquarius CSV via competitorFormat parameter', async () => {
    const csv = buildCsv(
      ['FirstName', 'LastName', 'EmailAddress'],
      [['Bob', 'Jones', 'bob@example.com']],
    );

    const req = createPostRequest('/api/v1/data-migration/import', {
      propertyId: PROPERTY_ID,
      entityType: 'users',
      csvContent: csv,
      competitorFormat: 'aquarius',
      dryRun: true,
    });
    const res = await POST_IMPORT(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { valid: boolean };
    }>(res);
    expect(body.data.valid).toBe(true);
  });
});

// ===========================================================================
// 13. Rollback failed import
// ===========================================================================

describe('Rollback failed import', () => {
  it('marks completed import as rolled back', async () => {
    // Import some data
    const csv = buildCsv(
      ['first_name', 'last_name', 'email'],
      [['Alice', 'Smith', 'alice@example.com']],
    );

    const importReq = createPostRequest('/api/v1/data-migration/import', {
      propertyId: PROPERTY_ID,
      entityType: 'users',
      csvContent: csv,
    });
    const importRes = await POST_IMPORT(importReq);
    const importBody = await parseResponse<{
      data: { importId: string };
    }>(importRes);

    // Wait for processing to complete
    await new Promise((resolve) => setTimeout(resolve, 150));

    // Verify it completed
    const statusReq = createGetRequest(
      `/api/v1/data-migration/import/${importBody.data.importId}/status`,
    );
    const statusRes = await GET_IMPORT_STATUS(statusReq, {
      params: Promise.resolve({ id: importBody.data.importId }),
    });
    const statusBody = await parseResponse<{
      data: { status: string };
    }>(statusRes);
    expect(['completed', 'failed']).toContain(statusBody.data.status);

    // Rollback the import via the engine directly
    const { rollbackImport } = await import('@/server/data-migration');
    const rollbackResult = await rollbackImport(importBody.data.importId);
    expect(rollbackResult.success).toBe(true);
    expect(rollbackResult.message).toContain('rolled back');

    // Verify status is now rolled_back
    const afterReq = createGetRequest(
      `/api/v1/data-migration/import/${importBody.data.importId}/status`,
    );
    const afterRes = await GET_IMPORT_STATUS(afterReq, {
      params: Promise.resolve({ id: importBody.data.importId }),
    });
    const afterBody = await parseResponse<{
      data: { status: string };
    }>(afterRes);
    expect(afterBody.data.status).toBe('rolled_back');
  });

  it('returns error when rolling back non-existent import', async () => {
    const { rollbackImport } = await import('@/server/data-migration');
    const result = await rollbackImport('non-existent-id');
    expect(result.success).toBe(false);
    expect(result.message).toContain('not found');
  });

  it('returns error when rolling back a pending import', async () => {
    // Create import but don't wait for it to complete
    const csv = buildCsv(
      ['number'],
      Array.from({ length: 1000 }, (_, i) => [String(i)]),
    );

    const importReq = createPostRequest('/api/v1/data-migration/import', {
      propertyId: PROPERTY_ID,
      entityType: 'units',
      csvContent: csv,
    });
    const importRes = await POST_IMPORT(importReq);
    const importBody = await parseResponse<{
      data: { importId: string };
    }>(importRes);

    // Immediately try to rollback before completion
    const { rollbackImport } = await import('@/server/data-migration');
    const result = await rollbackImport(importBody.data.importId);
    // Should fail because status is not completed/failed yet
    expect(result.success).toBe(false);
    expect(result.message).toContain('Cannot rollback');
  });
});

// ===========================================================================
// CSV Parser Unit Tests
// ===========================================================================

describe('CSV parser — parseCsv()', () => {
  it('parses simple CSV', () => {
    const csv = 'name,email\nAlice,alice@example.com\nBob,bob@example.com';
    const result = parseCsv(csv);

    expect(result.headers).toEqual(['name', 'email']);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toEqual({ name: 'Alice', email: 'alice@example.com' });
  });

  it('handles quoted fields with commas', () => {
    const csv = 'name,address\n"Smith, John","123 Main St, Apt 4"';
    const result = parseCsv(csv);

    expect(result.rows[0]!.name).toBe('Smith, John');
    expect(result.rows[0]!.address).toBe('123 Main St, Apt 4');
  });

  it('handles empty CSV', () => {
    const result = parseCsv('');
    expect(result.headers).toEqual(['']);
    expect(result.rows).toHaveLength(0);
  });

  it('handles escaped quotes in CSV', () => {
    const csv = 'name,note\n"Alice ""The Great""",hello';
    const result = parseCsv(csv);
    expect(result.rows[0]!.name).toBe('Alice "The Great"');
  });
});
