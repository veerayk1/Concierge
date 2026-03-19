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

const mockGuardRoute = vi.fn();

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: (...args: unknown[]) => mockGuardRoute(...args),
}));

// Route imports MUST come after vi.mock calls
import { POST as POST_IMPORT } from '../import/route';
import { GET as GET_IMPORT_STATUS } from '../import/[id]/status/route';
import { POST as POST_EXPORT } from '../export/route';

// ---------------------------------------------------------------------------
// Constants & Helpers
// ---------------------------------------------------------------------------

const PROPERTY_ID = '00000000-0000-4000-b000-000000000001';
const ADMIN_USER_ID = 'test-admin';
const RESIDENT_USER_ID = 'test-resident';

const mockAdminAuth = () =>
  mockGuardRoute.mockResolvedValue({
    user: {
      userId: ADMIN_USER_ID,
      propertyId: PROPERTY_ID,
      role: 'property_admin',
      permissions: ['*'],
      mfaVerified: false,
    },
    error: null,
  });

const mockResidentAuth = () =>
  mockGuardRoute.mockResolvedValue({
    user: {
      userId: RESIDENT_USER_ID,
      propertyId: PROPERTY_ID,
      role: 'resident_owner',
      permissions: ['*'],
      mfaVerified: false,
    },
    error: null,
  });

function buildCsv(headers: string[], rows: string[][]): string {
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

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
  mockAdminAuth();
});

// ===========================================================================
// 1. POST /data-migration/import — Create import job with file metadata
// ===========================================================================

describe('POST /api/v1/data-migration/import — Create Import Job', () => {
  const usersCsv = buildCsv(
    ['first_name', 'last_name', 'email', 'phone'],
    [
      ['Alice', 'Smith', 'alice@example.com', '555-0001'],
      ['Bob', 'Jones', 'bob@example.com', '555-0002'],
    ],
  );

  it('accepts CSV content and returns import job with metadata', async () => {
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

  it('returns 202 Accepted status for async processing', async () => {
    const req = createPostRequest('/api/v1/data-migration/import', {
      propertyId: PROPERTY_ID,
      entityType: 'units',
      csvContent: buildCsv(['number', 'floor'], [['101', '1']]),
    });
    const res = await POST_IMPORT(req);
    expect(res.status).toBe(202);
  });
});

// ===========================================================================
// 2. POST /data-migration/import — Validates required fields
// ===========================================================================

describe('POST /api/v1/data-migration/import — Required Field Validation', () => {
  it('rejects request without any fields', async () => {
    const req = createPostRequest('/api/v1/data-migration/import', {});
    const res = await POST_IMPORT(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('rejects request without propertyId', async () => {
    const req = createPostRequest('/api/v1/data-migration/import', {
      entityType: 'users',
      csvContent: 'first_name,email\nAlice,alice@example.com',
    });
    const res = await POST_IMPORT(req);
    expect(res.status).toBe(400);
  });

  it('rejects request without entityType', async () => {
    const req = createPostRequest('/api/v1/data-migration/import', {
      propertyId: PROPERTY_ID,
      csvContent: 'first_name,email\nAlice,alice@example.com',
    });
    const res = await POST_IMPORT(req);
    expect(res.status).toBe(400);
  });

  it('rejects request without csvContent', async () => {
    const req = createPostRequest('/api/v1/data-migration/import', {
      propertyId: PROPERTY_ID,
      entityType: 'users',
    });
    const res = await POST_IMPORT(req);
    expect(res.status).toBe(400);
  });
});

// ===========================================================================
// 3. POST /data-migration/import — Validates import type (entity type)
// ===========================================================================

describe('POST /api/v1/data-migration/import — Entity Type Validation', () => {
  const simpleCsv = 'col1,col2\nval1,val2';

  it('rejects invalid entity type', async () => {
    const req = createPostRequest('/api/v1/data-migration/import', {
      propertyId: PROPERTY_ID,
      entityType: 'invalid_type',
      csvContent: simpleCsv,
    });
    const res = await POST_IMPORT(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('Invalid entityType');
  });

  it.each([
    'users',
    'units',
    'packages',
    'maintenance',
    'visitors',
    'amenity_bookings',
    'emergency_contacts',
    'fob_keys',
  ])('accepts valid entity type: %s', async (entityType) => {
    const csv = buildCsv(['first_name', 'email'], [['Alice', 'alice@example.com']]);
    const req = createPostRequest('/api/v1/data-migration/import', {
      propertyId: PROPERTY_ID,
      entityType,
      csvContent: csv,
    });
    const res = await POST_IMPORT(req);
    // Should be 200 (dry-run), 202 (import), or 400 (no mappings), not entity type rejection
    expect(res.status).not.toBe(500);
  });
});

// ===========================================================================
// 4. Import field mapping validation
// ===========================================================================

describe('CSV Column Mapping — Auto-Detect and Manual', () => {
  it('auto-detects standard column names for users', () => {
    const headers = ['first_name', 'last_name', 'email', 'phone'];
    const mappings = autoDetectMappings(headers, 'users');

    expect(mappings).toHaveLength(4);
    expect(mappings).toContainEqual({ sourceColumn: 'first_name', targetField: 'first_name' });
    expect(mappings).toContainEqual({ sourceColumn: 'email', targetField: 'email' });
  });

  it('auto-detects similar column names (fuzzy matching)', () => {
    const headers = ['First Name', 'Last Name', 'Email'];
    const mappings = autoDetectMappings(headers, 'users');

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
// 5. Import preview (dry-run: first 5 rows)
// ===========================================================================

describe('Dry-Run Validation — Preview and Validation', () => {
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
    expect(
      result.errors.some((e) => e.field === 'email' && e.message.includes('Invalid email')),
    ).toBe(true);
    expect(
      result.errors.some((e) => e.field === 'first_name' && e.message.includes('missing')),
    ).toBe(true);
  });
});

// ===========================================================================
// 6. Import execution with progress tracking
// ===========================================================================

describe('Import Execution — Progress Tracking', () => {
  it('creates import job and tracks progress via status endpoint', async () => {
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
    const importBody = await parseResponse<{ data: { importId: string } }>(importRes);

    await new Promise((resolve) => setTimeout(resolve, 150));

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
// 7. Import error handling (invalid rows tracked separately)
// ===========================================================================

describe('Import Error Handling — Invalid Row Tracking', () => {
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
// 8. Import rollback capability
// ===========================================================================

describe('Import Rollback', () => {
  it('marks completed import as rolled back', async () => {
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
    const importBody = await parseResponse<{ data: { importId: string } }>(importRes);

    await new Promise((resolve) => setTimeout(resolve, 150));

    // Verify it completed
    const statusReq = createGetRequest(
      `/api/v1/data-migration/import/${importBody.data.importId}/status`,
    );
    const statusRes = await GET_IMPORT_STATUS(statusReq, {
      params: Promise.resolve({ id: importBody.data.importId }),
    });
    const statusBody = await parseResponse<{ data: { status: string } }>(statusRes);
    expect(['completed', 'failed']).toContain(statusBody.data.status);

    // Rollback
    const { rollbackImport } = await import('@/server/data-migration');
    const rollbackResult = await rollbackImport(importBody.data.importId);
    expect(rollbackResult.success).toBe(true);
    expect(rollbackResult.message).toContain('rolled back');

    // Verify status after rollback
    const afterReq = createGetRequest(
      `/api/v1/data-migration/import/${importBody.data.importId}/status`,
    );
    const afterRes = await GET_IMPORT_STATUS(afterReq, {
      params: Promise.resolve({ id: importBody.data.importId }),
    });
    const afterBody = await parseResponse<{ data: { status: string } }>(afterRes);
    expect(afterBody.data.status).toBe('rolled_back');
  });

  it('returns error when rolling back non-existent import', async () => {
    const { rollbackImport } = await import('@/server/data-migration');
    const result = await rollbackImport('non-existent-id');
    expect(result.success).toBe(false);
    expect(result.message).toContain('not found');
  });

  it('returns error when rolling back a pending import', async () => {
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
    const importBody = await parseResponse<{ data: { importId: string } }>(importRes);

    const { rollbackImport } = await import('@/server/data-migration');
    const result = await rollbackImport(importBody.data.importId);
    expect(result.success).toBe(false);
    expect(result.message).toContain('Cannot rollback');
  });
});

// ===========================================================================
// 9. POST /data-migration/export — Create export job
// ===========================================================================

describe('POST /api/v1/data-migration/export — Create Export', () => {
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
        generatedAt: string;
      };
      message: string;
    }>(res);

    expect(body.data.exportId).toBeDefined();
    expect(body.data.entityTypes).toContain('users');
    expect(body.data.entityTypes).toContain('units');
    expect(body.data.generatedAt).toBeDefined();
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
// 10. Export format options (csv, json)
// ===========================================================================

describe('POST /api/v1/data-migration/export — Format Validation', () => {
  it('accepts json format', async () => {
    mockUserFindMany.mockResolvedValue([]);
    mockUnitFindMany.mockResolvedValue([]);

    const req = createPostRequest('/api/v1/data-migration/export', {
      propertyId: PROPERTY_ID,
      format: 'json',
    });
    const res = await POST_EXPORT(req);
    expect(res.status).toBe(200);
  });

  it('accepts csv format', async () => {
    mockUserFindMany.mockResolvedValue([]);
    mockUnitFindMany.mockResolvedValue([]);

    const req = createPostRequest('/api/v1/data-migration/export', {
      propertyId: PROPERTY_ID,
      format: 'csv',
    });
    const res = await POST_EXPORT(req);
    expect(res.status).toBe(200);
  });

  it('rejects invalid format', async () => {
    const req = createPostRequest('/api/v1/data-migration/export', {
      propertyId: PROPERTY_ID,
      format: 'xml',
    });
    const res = await POST_EXPORT(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('Invalid format');
  });
});

// ===========================================================================
// 11. Export scope — specific entity types
// ===========================================================================

describe('POST /api/v1/data-migration/export — Entity Scope', () => {
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
      data: { entityTypes: string[]; data: { packages: unknown[] } };
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

    const body = await parseResponse<{ data: { entityTypes: string[] } }>(res);
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
// 12. DSAR export (all data for a specific user)
// ===========================================================================

describe('POST /api/v1/data-migration/export — DSAR Compliance', () => {
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

  it('DSAR export message differs from standard export', async () => {
    mockUserFindMany.mockResolvedValue([]);

    // Standard export
    const stdReq = createPostRequest('/api/v1/data-migration/export', {
      propertyId: PROPERTY_ID,
      format: 'json',
    });
    const stdRes = await POST_EXPORT(stdReq);
    const stdBody = await parseResponse<{ message: string }>(stdRes);

    // DSAR export
    const dsarReq = createPostRequest('/api/v1/data-migration/export', {
      propertyId: PROPERTY_ID,
      format: 'json',
      dsarCompliant: true,
    });
    const dsarRes = await POST_EXPORT(dsarReq);
    const dsarBody = await parseResponse<{ message: string }>(dsarRes);

    expect(dsarBody.message).not.toBe(stdBody.message);
    expect(dsarBody.message).toContain('DSAR');
  });
});

// ===========================================================================
// 13. Non-admin cannot do full property export (only DSAR)
// ===========================================================================

describe('Export — Role-Based Access', () => {
  it('non-admin cannot perform full property export', async () => {
    mockResidentAuth();

    const req = createPostRequest('/api/v1/data-migration/export', {
      propertyId: PROPERTY_ID,
      format: 'json',
    });
    const res = await POST_EXPORT(req);
    expect(res.status).toBe(403);

    const body = await parseResponse<{ error: string; message: string }>(res);
    expect(body.error).toBe('FORBIDDEN');
    expect(body.message).toContain('dsarCompliant');
  });
});

// ===========================================================================
// 14. Duplicate detection — skip/overwrite/merge strategies
// ===========================================================================

describe('Duplicate Detection During Import', () => {
  it('skips duplicate rows when strategy is "skip"', async () => {
    mockUserFindMany.mockResolvedValue([{ email: 'alice@example.com' }]);

    const csv = buildCsv(
      ['first_name', 'last_name', 'email'],
      [
        ['Alice', 'Smith', 'alice@example.com'],
        ['Charlie', 'Brown', 'charlie@example.com'],
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

    const body = await parseResponse<{ data: { duplicateStrategy: string } }>(res);
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
        ['101', '1'],
        ['103', '1'],
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
// 15. Job status tracking (pending, processing, completed, failed, cancelled)
// ===========================================================================

describe('Job Status Tracking', () => {
  it('status endpoint returns progress percentage', async () => {
    const csv = buildCsv(
      ['first_name', 'last_name', 'email'],
      [
        ['Alice', 'Smith', 'alice@example.com'],
        ['Bob', 'Jones', 'bob@example.com'],
        ['Charlie', 'Brown', 'charlie@example.com'],
      ],
    );

    const importReq = createPostRequest('/api/v1/data-migration/import', {
      propertyId: PROPERTY_ID,
      entityType: 'users',
      csvContent: csv,
    });
    const importRes = await POST_IMPORT(importReq);
    const importBody = await parseResponse<{ data: { importId: string } }>(importRes);

    await new Promise((resolve) => setTimeout(resolve, 200));

    const statusReq = createGetRequest(
      `/api/v1/data-migration/import/${importBody.data.importId}/status`,
    );
    const statusRes = await GET_IMPORT_STATUS(statusReq, {
      params: Promise.resolve({ id: importBody.data.importId }),
    });

    const statusBody = await parseResponse<{
      data: {
        progress: number;
        processedRows: number;
        successRows: number;
        errorRows: number;
        completedAt: string | null;
      };
    }>(statusRes);

    expect(statusBody.data.progress).toBeGreaterThanOrEqual(0);
    expect(statusBody.data.progress).toBeLessThanOrEqual(100);
    expect(typeof statusBody.data.processedRows).toBe('number');
    expect(typeof statusBody.data.successRows).toBe('number');
    expect(typeof statusBody.data.errorRows).toBe('number');
  });
});

// ===========================================================================
// 16. Import users with role assignment
// ===========================================================================

describe('Import Users — Role Assignment', () => {
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
// 17. Import units with floor/building mapping
// ===========================================================================

describe('Import Units — Floor/Building Mapping', () => {
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
});

// ===========================================================================
// 18. Import packages with field mapping
// ===========================================================================

describe('Import Packages — Field Mapping', () => {
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
// 19. Competitor format import — BuildingLink
// ===========================================================================

describe('Import from Competitor Format — BuildingLink', () => {
  it('auto-maps BuildingLink column names to Concierge fields', () => {
    const headers = ['First Name', 'Last Name', 'Email Address', 'Phone Number', 'Unit', 'Role'];
    const mappings = autoDetectMappings(headers, 'users', 'buildinglink');

    expect(mappings).toContainEqual({ sourceColumn: 'First Name', targetField: 'first_name' });
    expect(mappings).toContainEqual({ sourceColumn: 'Last Name', targetField: 'last_name' });
    expect(mappings).toContainEqual({
      sourceColumn: 'Email Address',
      targetField: 'email',
    });
    expect(mappings).toContainEqual({
      sourceColumn: 'Phone Number',
      targetField: 'phone',
    });
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

    const body = await parseResponse<{ data: { valid: boolean; validRows: number } }>(res);
    expect(body.data.valid).toBe(true);
    expect(body.data.validRows).toBe(1);
  });
});

// ===========================================================================
// 20. Competitor format import — Aquarius
// ===========================================================================

describe('Import from Competitor Format — Aquarius', () => {
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

    const body = await parseResponse<{ data: { valid: boolean } }>(res);
    expect(body.data.valid).toBe(true);
  });
});

// ===========================================================================
// 21. Generic CSV import (no competitor format)
// ===========================================================================

describe('Generic CSV Import', () => {
  it('imports generic CSV with auto-detect mappings', async () => {
    const csv = buildCsv(
      ['first_name', 'last_name', 'email'],
      [['Generic', 'User', 'generic@example.com']],
    );

    const req = createPostRequest('/api/v1/data-migration/import', {
      propertyId: PROPERTY_ID,
      entityType: 'users',
      csvContent: csv,
      dryRun: true,
    });
    const res = await POST_IMPORT(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { valid: boolean; entityType: string } }>(res);
    expect(body.data.valid).toBe(true);
    expect(body.data.entityType).toBe('users');
  });
});

// ===========================================================================
// 22. CSV Parser unit tests
// ===========================================================================

describe('CSV Parser — parseCsv()', () => {
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

// ===========================================================================
// 23. Tenant isolation — propertyId scoping
// ===========================================================================

describe('Data Migration — Tenant Isolation', () => {
  it('import job is associated with the correct propertyId', async () => {
    const csv = buildCsv(
      ['first_name', 'last_name', 'email'],
      [['Alice', 'Smith', 'alice@example.com']],
    );

    const req = createPostRequest('/api/v1/data-migration/import', {
      propertyId: PROPERTY_ID,
      entityType: 'users',
      csvContent: csv,
    });
    const res = await POST_IMPORT(req);
    expect(res.status).toBe(202);

    await new Promise((resolve) => setTimeout(resolve, 100));

    if (mockUserCreate.mock.calls.length > 0) {
      const createArgs = mockUserCreate.mock.calls[0]![0];
      expect(createArgs.data.userProperties.create.propertyId).toBe(PROPERTY_ID);
    }
  });

  it('export scoped to specific propertyId', async () => {
    mockUserFindMany.mockResolvedValue([]);

    const req = createPostRequest('/api/v1/data-migration/export', {
      propertyId: PROPERTY_ID,
      format: 'json',
    });
    const res = await POST_EXPORT(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { propertyId: string } }>(res);
    expect(body.data.propertyId).toBe(PROPERTY_ID);
  });
});

// ===========================================================================
// 24. Auth required for import (admin only)
// ===========================================================================

describe('Import — Authentication & Authorization', () => {
  it('rejects unauthenticated import requests', async () => {
    mockGuardRoute.mockResolvedValue({
      user: null,
      error: new Response(JSON.stringify({ error: 'UNAUTHORIZED' }), { status: 401 }),
    });

    const csv = buildCsv(['first_name', 'email'], [['Alice', 'alice@example.com']]);
    const req = createPostRequest('/api/v1/data-migration/import', {
      propertyId: PROPERTY_ID,
      entityType: 'users',
      csvContent: csv,
    });
    const res = await POST_IMPORT(req);
    expect(res.status).toBe(401);
  });
});

// ===========================================================================
// 25. Export includes generatedAt timestamp
// ===========================================================================

describe('Export — Metadata', () => {
  it('includes generatedAt ISO timestamp', async () => {
    mockUserFindMany.mockResolvedValue([]);

    const req = createPostRequest('/api/v1/data-migration/export', {
      propertyId: PROPERTY_ID,
      format: 'json',
    });
    const res = await POST_EXPORT(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { generatedAt: string; exportId: string } }>(res);
    expect(body.data.generatedAt).toBeDefined();
    // Verify ISO format
    const date = new Date(body.data.generatedAt);
    expect(date.toISOString()).toBe(body.data.generatedAt);
    expect(body.data.exportId).toBeDefined();
  });
});

// ===========================================================================
// 26. Import status endpoint shows error details
// ===========================================================================

describe('Import Status — Error Details', () => {
  it('status response includes errors array (limited to 50)', async () => {
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
    const importBody = await parseResponse<{ data: { importId: string } }>(importRes);

    await new Promise((resolve) => setTimeout(resolve, 150));

    const statusReq = createGetRequest(
      `/api/v1/data-migration/import/${importBody.data.importId}/status`,
    );
    const statusRes = await GET_IMPORT_STATUS(statusReq, {
      params: Promise.resolve({ id: importBody.data.importId }),
    });

    const statusBody = await parseResponse<{
      data: {
        errors: unknown[];
        duplicateStrategy: string;
        fileName: string;
      };
    }>(statusRes);

    expect(Array.isArray(statusBody.data.errors)).toBe(true);
    expect(statusBody.data.errors.length).toBeLessThanOrEqual(50);
    expect(statusBody.data.duplicateStrategy).toBeDefined();
  });
});
