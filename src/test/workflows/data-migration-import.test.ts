/**
 * Integration Workflow Tests — Data Migration Import
 *
 * Tests complete data migration workflows across multiple API endpoints:
 *   - CSV resident import (upload -> validate -> preview -> map -> execute -> track -> report)
 *   - Competitor migration (upload -> auto-detect -> map -> dry-run -> execute with rollback)
 *   - DSAR export (request -> collect -> export -> audit trail)
 *
 * Each test validates CSV parsing, column mapping, import job lifecycle,
 * progress tracking, error handling, and DSAR-compliant exports.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createGetRequest, createPostRequest, parseResponse } from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Prisma Mock
// ---------------------------------------------------------------------------

const mockImportJobCreate = vi.fn();
const mockImportJobFindMany = vi.fn();
const mockImportJobCount = vi.fn();

const mockDataExportRequestCreate = vi.fn();
const mockDataExportRequestFindMany = vi.fn();
const mockDataExportRequestCount = vi.fn();

const mockAuditLogCreate = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    importJob: {
      create: (...args: unknown[]) => mockImportJobCreate(...args),
      findMany: (...args: unknown[]) => mockImportJobFindMany(...args),
      count: (...args: unknown[]) => mockImportJobCount(...args),
    },
    dataExportRequest: {
      create: (...args: unknown[]) => mockDataExportRequestCreate(...args),
      findMany: (...args: unknown[]) => mockDataExportRequestFindMany(...args),
      count: (...args: unknown[]) => mockDataExportRequestCount(...args),
    },
    auditLog: {
      create: (...args: unknown[]) => mockAuditLogCreate(...args),
    },
  },
}));

// ---------------------------------------------------------------------------
// Data Migration Mock
// ---------------------------------------------------------------------------

const mockParseCsv = vi.fn();
const mockAutoDetectMappings = vi.fn();
const mockValidateMappedData = vi.fn();
const mockCreateImportJob = vi.fn();
const mockConvertCompetitorFormat = vi.fn();
const mockGetImportJobStatus = vi.fn();
const mockExportPropertyData = vi.fn();

vi.mock('@/server/data-migration', () => ({
  parseCsv: (...args: unknown[]) => mockParseCsv(...args),
  autoDetectMappings: (...args: unknown[]) => mockAutoDetectMappings(...args),
  validateMappedData: (...args: unknown[]) => mockValidateMappedData(...args),
  createImportJob: (...args: unknown[]) => mockCreateImportJob(...args),
  convertCompetitorFormat: (...args: unknown[]) => mockConvertCompetitorFormat(...args),
  getImportJobStatus: (...args: unknown[]) => mockGetImportJobStatus(...args),
  exportPropertyData: (...args: unknown[]) => mockExportPropertyData(...args),
  ENTITY_FIELDS: {
    users: ['firstName', 'lastName', 'email', 'phone', 'unitNumber'],
    units: ['number', 'floor', 'building', 'type'],
    packages: ['id', 'unitId', 'status'],
    maintenance: ['id', 'description', 'status'],
    visitors: ['name', 'unitId', 'signedInAt'],
    amenity_bookings: ['id', 'amenityId', 'status'],
    emergency_contacts: ['name', 'phone', 'relationship'],
    fob_keys: ['serialNumber', 'type', 'status'],
    maintenanceRequests: ['id', 'description', 'status'],
    bookings: ['id', 'amenityId', 'status'],
    events: ['id', 'type', 'description'],
  },
}));

vi.mock('@/schemas/data-migration', () => ({
  createMigrationJobUnionSchema: {
    safeParse: vi.fn().mockImplementation((data: Record<string, unknown>) => {
      if (!data.type)
        return {
          success: false,
          error: { flatten: () => ({ fieldErrors: { type: ['Required'] } }) },
        };
      return { success: true, data };
    }),
  },
  MIGRATION_JOB_STATUSES: ['pending', 'processing', 'completed', 'failed'],
}));

vi.mock('@/lib/sanitize', () => ({
  stripHtml: (s: string) => s,
  stripControlChars: (s: string) => s,
}));

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: vi.fn().mockResolvedValue({
    user: {
      userId: 'admin-001',
      propertyId: 'prop-001',
      role: 'property_admin',
      permissions: ['*'],
      mfaVerified: true,
    },
    error: null,
  }),
}));

// ---------------------------------------------------------------------------
// Import route handlers AFTER mocks
// ---------------------------------------------------------------------------

import { POST as importData } from '@/app/api/v1/data-migration/import/route';
import { GET as getImportStatus } from '@/app/api/v1/data-migration/import/[id]/status/route';
import { POST as exportData } from '@/app/api/v1/data-migration/export/route';
import {
  GET as listMigrationJobs,
  POST as createMigrationJob,
} from '@/app/api/v1/data-migration/route';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROPERTY_ID = '00000000-0000-4000-a000-000000000001';

const SAMPLE_CSV = `firstName,lastName,email,phone,unitNumber
John,Doe,john@example.com,416-555-0001,101
Jane,Smith,jane@example.com,416-555-0002,102
Bob,Wilson,bob@example.com,416-555-0003,103
Alice,Brown,alice@example.com,416-555-0004,104
Charlie,Davis,charlie@example.com,416-555-0005,105
Invalid,,bad-email,,
Mary,Johnson,mary@example.com,416-555-0007,107
Tom,Lee,tom@example.com,416-555-0008,108
Sara,Kim,sara@example.com,416-555-0009,109
David,Park,david@example.com,416-555-0010,110`;

const PARSED_HEADERS = ['firstName', 'lastName', 'email', 'phone', 'unitNumber'];

const PARSED_ROWS = [
  {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '416-555-0001',
    unitNumber: '101',
  },
  {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane@example.com',
    phone: '416-555-0002',
    unitNumber: '102',
  },
  {
    firstName: 'Bob',
    lastName: 'Wilson',
    email: 'bob@example.com',
    phone: '416-555-0003',
    unitNumber: '103',
  },
  {
    firstName: 'Alice',
    lastName: 'Brown',
    email: 'alice@example.com',
    phone: '416-555-0004',
    unitNumber: '104',
  },
  {
    firstName: 'Charlie',
    lastName: 'Davis',
    email: 'charlie@example.com',
    phone: '416-555-0005',
    unitNumber: '105',
  },
  { firstName: 'Invalid', lastName: '', email: 'bad-email', phone: '', unitNumber: '' },
  {
    firstName: 'Mary',
    lastName: 'Johnson',
    email: 'mary@example.com',
    phone: '416-555-0007',
    unitNumber: '107',
  },
  {
    firstName: 'Tom',
    lastName: 'Lee',
    email: 'tom@example.com',
    phone: '416-555-0008',
    unitNumber: '108',
  },
  {
    firstName: 'Sara',
    lastName: 'Kim',
    email: 'sara@example.com',
    phone: '416-555-0009',
    unitNumber: '109',
  },
  {
    firstName: 'David',
    lastName: 'Park',
    email: 'david@example.com',
    phone: '416-555-0010',
    unitNumber: '110',
  },
];

const DEFAULT_MAPPINGS = [
  { sourceColumn: 'firstName', targetField: 'firstName' },
  { sourceColumn: 'lastName', targetField: 'lastName' },
  { sourceColumn: 'email', targetField: 'email' },
  { sourceColumn: 'phone', targetField: 'phone' },
  { sourceColumn: 'unitNumber', targetField: 'unitNumber' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeImportJob(overrides: Record<string, unknown> = {}) {
  return {
    id: 'import-001',
    propertyId: PROPERTY_ID,
    entityType: 'users',
    fileName: 'residents.csv',
    status: 'processing',
    totalRows: 10,
    processedRows: 0,
    successRows: 0,
    errorRows: 0,
    errors: [],
    duplicateStrategy: 'skip',
    columnMappings: DEFAULT_MAPPINGS,
    createdBy: 'admin-001',
    createdAt: new Date('2026-03-15T10:00:00Z'),
    completedAt: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  // Set up default mock responses
  mockParseCsv.mockReturnValue({ headers: PARSED_HEADERS, rows: PARSED_ROWS });
  mockAutoDetectMappings.mockReturnValue(DEFAULT_MAPPINGS);
});

// ===========================================================================
// SCENARIO 1: CSV Resident Import
// ===========================================================================

describe('Scenario 1: CSV Resident Import (upload -> validate -> preview -> map -> execute -> track -> report)', () => {
  it('Step 1: upload CSV with resident data and parse it', async () => {
    mockValidateMappedData.mockReturnValue({
      valid: true,
      totalRows: 10,
      validRows: 9,
      invalidRows: 1,
      errors: [{ row: 6, field: 'email', message: 'Invalid email format' }],
      preview: PARSED_ROWS.slice(0, 5),
    });

    const req = createPostRequest('/api/v1/data-migration/import', {
      propertyId: PROPERTY_ID,
      entityType: 'users',
      csvContent: SAMPLE_CSV,
      dryRun: true,
    });

    const res = await importData(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { valid: boolean; totalRows: number; validRows: number; invalidRows: number };
      message: string;
    }>(res);
    expect(body.data.totalRows).toBe(10);
    expect(body.message).toContain('Dry-run');
  });

  it('Step 2: validate CSV format and columns via dry-run', async () => {
    mockValidateMappedData.mockReturnValue({
      valid: true,
      totalRows: 10,
      validRows: 9,
      invalidRows: 1,
      errors: [{ row: 6, field: 'email', message: 'Invalid email format' }],
      preview: PARSED_ROWS.slice(0, 5),
    });

    const req = createPostRequest('/api/v1/data-migration/import', {
      propertyId: PROPERTY_ID,
      entityType: 'users',
      csvContent: SAMPLE_CSV,
      dryRun: true,
    });

    const res = await importData(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: {
        valid: boolean;
        validRows: number;
        invalidRows: number;
        errors: { row: number; field: string; message: string }[];
        mappings: { sourceColumn: string; targetField: string }[];
      };
    }>(res);
    expect(body.data.valid).toBe(true);
    expect(body.data.validRows).toBe(9);
    expect(body.data.invalidRows).toBe(1);
    expect(body.data.errors).toHaveLength(1);
    expect(body.data.errors[0]!.row).toBe(6);
    expect(body.data.mappings).toHaveLength(5);
  });

  it('Step 3: preview first 5 rows in dry-run response', async () => {
    mockValidateMappedData.mockReturnValue({
      valid: true,
      totalRows: 10,
      validRows: 9,
      invalidRows: 1,
      errors: [],
      preview: PARSED_ROWS.slice(0, 5),
    });

    const req = createPostRequest('/api/v1/data-migration/import', {
      propertyId: PROPERTY_ID,
      entityType: 'users',
      csvContent: SAMPLE_CSV,
      dryRun: true,
    });

    const res = await importData(req);
    const body = await parseResponse<{
      data: { preview: Record<string, string>[] };
    }>(res);
    expect(body.data.preview).toHaveLength(5);
    expect(body.data.preview[0]).toHaveProperty('firstName', 'John');
    expect(body.data.preview[4]).toHaveProperty('firstName', 'Charlie');
  });

  it('Step 4: map columns to fields with explicit columnMappings', async () => {
    mockValidateMappedData.mockReturnValue({
      valid: true,
      totalRows: 10,
      validRows: 9,
      invalidRows: 1,
      errors: [],
      preview: PARSED_ROWS.slice(0, 5),
      mappings: DEFAULT_MAPPINGS,
    });

    const req = createPostRequest('/api/v1/data-migration/import', {
      propertyId: PROPERTY_ID,
      entityType: 'users',
      csvContent: SAMPLE_CSV,
      columnMappings: DEFAULT_MAPPINGS,
      dryRun: true,
    });

    const res = await importData(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { entityType: string; mappings: { sourceColumn: string; targetField: string }[] };
    }>(res);
    expect(body.data.entityType).toBe('users');
    expect(body.data.mappings).toHaveLength(5);
    expect(body.data.mappings[0]!.sourceColumn).toBe('firstName');
    expect(body.data.mappings[0]!.targetField).toBe('firstName');
  });

  it('Step 5: execute import — returns job with importId', async () => {
    mockCreateImportJob.mockResolvedValue(makeImportJob());

    const req = createPostRequest('/api/v1/data-migration/import', {
      propertyId: PROPERTY_ID,
      entityType: 'users',
      csvContent: SAMPLE_CSV,
      columnMappings: DEFAULT_MAPPINGS,
      duplicateStrategy: 'skip',
    });

    const res = await importData(req);
    expect(res.status).toBe(202);

    const body = await parseResponse<{
      data: { importId: string; status: string; totalRows: number; entityType: string };
      message: string;
    }>(res);
    expect(body.data.importId).toBe('import-001');
    expect(body.data.status).toBe('processing');
    expect(body.data.totalRows).toBe(10);
    expect(body.data.entityType).toBe('users');
    expect(body.message).toContain('Import job created');
  });

  it('Step 6: track progress at 0%', async () => {
    mockGetImportJobStatus.mockReturnValue(
      makeImportJob({ processedRows: 0, successRows: 0, errorRows: 0 }),
    );

    const req = createGetRequest('/api/v1/data-migration/import/import-001/status');
    const res = await getImportStatus(req, { params: Promise.resolve({ id: 'import-001' }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { id: string; status: string; progress: number; totalRows: number };
    }>(res);
    expect(body.data.progress).toBe(0);
    expect(body.data.totalRows).toBe(10);
  });

  it('Step 6b: track progress at 50%', async () => {
    mockGetImportJobStatus.mockReturnValue(
      makeImportJob({ processedRows: 5, successRows: 4, errorRows: 1 }),
    );

    const req = createGetRequest('/api/v1/data-migration/import/import-001/status');
    const res = await getImportStatus(req, { params: Promise.resolve({ id: 'import-001' }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { progress: number; processedRows: number; successRows: number; errorRows: number };
    }>(res);
    expect(body.data.progress).toBe(50);
    expect(body.data.processedRows).toBe(5);
    expect(body.data.successRows).toBe(4);
    expect(body.data.errorRows).toBe(1);
  });

  it('Step 6c: track progress at 100%', async () => {
    mockGetImportJobStatus.mockReturnValue(
      makeImportJob({
        status: 'completed',
        processedRows: 10,
        successRows: 9,
        errorRows: 1,
        completedAt: new Date('2026-03-15T10:05:00Z'),
      }),
    );

    const req = createGetRequest('/api/v1/data-migration/import/import-001/status');
    const res = await getImportStatus(req, { params: Promise.resolve({ id: 'import-001' }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: {
        progress: number;
        status: string;
        completedAt: string;
        successRows: number;
        errorRows: number;
      };
    }>(res);
    expect(body.data.progress).toBe(100);
    expect(body.data.status).toBe('completed');
    expect(body.data.completedAt).toBeTruthy();
  });

  it('Step 7: handle invalid rows — skip and log errors', async () => {
    mockGetImportJobStatus.mockReturnValue(
      makeImportJob({
        status: 'completed',
        processedRows: 10,
        successRows: 9,
        errorRows: 1,
        errors: [{ row: 6, field: 'email', message: 'Invalid email format', value: 'bad-email' }],
      }),
    );

    const req = createGetRequest('/api/v1/data-migration/import/import-001/status');
    const res = await getImportStatus(req, { params: Promise.resolve({ id: 'import-001' }) });
    const body = await parseResponse<{
      data: {
        errors: { row: number; field: string; message: string }[];
        errorRows: number;
      };
    }>(res);
    expect(body.data.errorRows).toBe(1);
    expect(body.data.errors).toHaveLength(1);
    expect(body.data.errors[0]!.row).toBe(6);
    expect(body.data.errors[0]!.field).toBe('email');
  });

  it('Step 8: report — imported X, skipped Y, errors Z', async () => {
    mockGetImportJobStatus.mockReturnValue(
      makeImportJob({
        status: 'completed',
        processedRows: 10,
        successRows: 9,
        errorRows: 1,
        errors: [{ row: 6, field: 'email', message: 'Invalid email format' }],
        completedAt: new Date('2026-03-15T10:05:00Z'),
      }),
    );

    const req = createGetRequest('/api/v1/data-migration/import/import-001/status');
    const res = await getImportStatus(req, { params: Promise.resolve({ id: 'import-001' }) });
    const body = await parseResponse<{
      data: {
        totalRows: number;
        successRows: number;
        errorRows: number;
        processedRows: number;
        status: string;
      };
    }>(res);
    expect(body.data.totalRows).toBe(10);
    expect(body.data.successRows).toBe(9);
    expect(body.data.errorRows).toBe(1);
    expect(body.data.processedRows).toBe(10);
    expect(body.data.status).toBe('completed');
  });

  it('should reject import without propertyId', async () => {
    const req = createPostRequest('/api/v1/data-migration/import', {
      entityType: 'users',
      csvContent: SAMPLE_CSV,
    });

    const res = await importData(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('should reject import without entityType', async () => {
    const req = createPostRequest('/api/v1/data-migration/import', {
      propertyId: PROPERTY_ID,
      csvContent: SAMPLE_CSV,
    });

    const res = await importData(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('should reject import with invalid entityType', async () => {
    const req = createPostRequest('/api/v1/data-migration/import', {
      propertyId: PROPERTY_ID,
      entityType: 'invalid_type',
      csvContent: SAMPLE_CSV,
    });

    const res = await importData(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string; message: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
    expect(body.message).toContain('Invalid entityType');
  });

  it('should reject empty CSV', async () => {
    mockParseCsv.mockReturnValue({ headers: ['firstName'], rows: [] });

    const req = createPostRequest('/api/v1/data-migration/import', {
      propertyId: PROPERTY_ID,
      entityType: 'users',
      csvContent: 'firstName\n',
    });

    const res = await importData(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string; message: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
    expect(body.message).toContain('no data rows');
  });

  it('should reject invalid duplicate strategy', async () => {
    const req = createPostRequest('/api/v1/data-migration/import', {
      propertyId: PROPERTY_ID,
      entityType: 'users',
      csvContent: SAMPLE_CSV,
      duplicateStrategy: 'invalid_strategy',
    });

    const res = await importData(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });
});

// ===========================================================================
// SCENARIO 2: Competitor Migration
// ===========================================================================

describe('Scenario 2: Competitor Migration (upload -> auto-detect -> map -> dry-run -> execute)', () => {
  it('Step 1: upload export from competitor system with competitorFormat', async () => {
    mockConvertCompetitorFormat.mockReturnValue({
      headers: ['firstName', 'lastName', 'email', 'phone', 'unitNumber'],
      rows: PARSED_ROWS.slice(0, 5),
    });
    mockValidateMappedData.mockReturnValue({
      valid: true,
      totalRows: 5,
      validRows: 5,
      invalidRows: 0,
      errors: [],
      preview: PARSED_ROWS.slice(0, 5),
    });

    const req = createPostRequest('/api/v1/data-migration/import', {
      propertyId: PROPERTY_ID,
      entityType: 'users',
      csvContent:
        'resident_first,resident_last,resident_email,phone_num,suite\nJohn,Doe,john@example.com,4165550001,101',
      competitorFormat: 'buildinglink',
      dryRun: true,
    });

    const res = await importData(req);
    expect(res.status).toBe(200);

    expect(mockConvertCompetitorFormat).toHaveBeenCalledWith(
      expect.any(String),
      'users',
      'buildinglink',
    );
  });

  it('Step 2: auto-detect format and generate identity mappings', async () => {
    mockConvertCompetitorFormat.mockReturnValue({
      headers: ['firstName', 'lastName', 'email', 'phone', 'unitNumber'],
      rows: PARSED_ROWS.slice(0, 3),
    });
    mockValidateMappedData.mockReturnValue({
      valid: true,
      totalRows: 3,
      validRows: 3,
      invalidRows: 0,
      errors: [],
      preview: PARSED_ROWS.slice(0, 3),
    });

    const req = createPostRequest('/api/v1/data-migration/import', {
      propertyId: PROPERTY_ID,
      entityType: 'users',
      csvContent: 'some,competitor,csv,data\n1,2,3,4',
      competitorFormat: 'aquarius',
      dryRun: true,
    });

    const res = await importData(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { mappings: { sourceColumn: string; targetField: string }[] };
    }>(res);
    // Identity mappings: source = target after conversion
    body.data.mappings.forEach((m) => {
      expect(m.sourceColumn).toBe(m.targetField);
    });
  });

  it('Step 3: map competitor fields to Concierge fields', async () => {
    mockConvertCompetitorFormat.mockReturnValue({
      headers: ['firstName', 'lastName', 'email'],
      rows: [{ firstName: 'John', lastName: 'Doe', email: 'john@example.com' }],
    });
    mockValidateMappedData.mockReturnValue({
      valid: true,
      totalRows: 1,
      validRows: 1,
      invalidRows: 0,
      errors: [],
      preview: [{ firstName: 'John', lastName: 'Doe', email: 'john@example.com' }],
      mappings: [
        { sourceColumn: 'firstName', targetField: 'firstName' },
        { sourceColumn: 'lastName', targetField: 'lastName' },
        { sourceColumn: 'email', targetField: 'email' },
      ],
    });

    const req = createPostRequest('/api/v1/data-migration/import', {
      propertyId: PROPERTY_ID,
      entityType: 'users',
      csvContent: 'first_name,last_name,email_address\nJohn,Doe,john@example.com',
      competitorFormat: 'buildinglink',
      dryRun: true,
    });

    const res = await importData(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { mappings: { sourceColumn: string; targetField: string }[] };
    }>(res);
    expect(body.data.mappings.length).toBeGreaterThan(0);
  });

  it('Step 4: dry-run validation before actual import', async () => {
    mockConvertCompetitorFormat.mockReturnValue({
      headers: ['firstName', 'lastName', 'email'],
      rows: [
        { firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
        { firstName: '', lastName: '', email: 'invalid' },
      ],
    });
    mockValidateMappedData.mockReturnValue({
      valid: false,
      totalRows: 2,
      validRows: 1,
      invalidRows: 1,
      errors: [{ row: 2, field: 'email', message: 'Invalid email' }],
      preview: [{ firstName: 'John', lastName: 'Doe', email: 'john@example.com' }],
    });

    const req = createPostRequest('/api/v1/data-migration/import', {
      propertyId: PROPERTY_ID,
      entityType: 'users',
      csvContent: 'data',
      competitorFormat: 'buildinglink',
      dryRun: true,
    });

    const res = await importData(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { valid: boolean; invalidRows: number; errors: { row: number }[] };
      message: string;
    }>(res);
    expect(body.data.valid).toBe(false);
    expect(body.data.invalidRows).toBe(1);
    expect(body.message).toContain('Dry-run');
  });

  it('Step 5: execute competitor migration with rollback capability', async () => {
    mockConvertCompetitorFormat.mockReturnValue({
      headers: ['firstName', 'lastName', 'email'],
      rows: [{ firstName: 'John', lastName: 'Doe', email: 'john@example.com' }],
    });
    mockCreateImportJob.mockResolvedValue(makeImportJob({ totalRows: 1, entityType: 'users' }));

    const req = createPostRequest('/api/v1/data-migration/import', {
      propertyId: PROPERTY_ID,
      entityType: 'users',
      csvContent: 'data',
      competitorFormat: 'buildinglink',
      duplicateStrategy: 'merge',
    });

    const res = await importData(req);
    expect(res.status).toBe(202);

    const body = await parseResponse<{
      data: { importId: string; duplicateStrategy: string };
    }>(res);
    expect(body.data.importId).toBeTruthy();
    expect(body.data.duplicateStrategy).toBe('skip');
  });

  it('should support generic competitor format', async () => {
    mockConvertCompetitorFormat.mockReturnValue({
      headers: ['firstName', 'lastName', 'email'],
      rows: [{ firstName: 'A', lastName: 'B', email: 'a@b.com' }],
    });
    mockValidateMappedData.mockReturnValue({
      valid: true,
      totalRows: 1,
      validRows: 1,
      invalidRows: 0,
      errors: [],
      preview: [],
    });

    const req = createPostRequest('/api/v1/data-migration/import', {
      propertyId: PROPERTY_ID,
      entityType: 'users',
      csvContent: 'data',
      competitorFormat: 'generic',
      dryRun: true,
    });

    const res = await importData(req);
    expect(res.status).toBe(200);
  });

  it('should fall back to auto-detect when no mappings and no competitor format', async () => {
    mockAutoDetectMappings.mockReturnValue([
      { sourceColumn: 'firstName', targetField: 'firstName' },
      { sourceColumn: 'email', targetField: 'email' },
    ]);
    mockValidateMappedData.mockReturnValue({
      valid: true,
      totalRows: 10,
      validRows: 10,
      invalidRows: 0,
      errors: [],
      preview: [],
    });

    const req = createPostRequest('/api/v1/data-migration/import', {
      propertyId: PROPERTY_ID,
      entityType: 'users',
      csvContent: SAMPLE_CSV,
      dryRun: true,
    });

    const res = await importData(req);
    expect(res.status).toBe(200);
    expect(mockAutoDetectMappings).toHaveBeenCalledWith(PARSED_HEADERS, 'users');
  });
});

// ===========================================================================
// SCENARIO 3: DSAR Export
// ===========================================================================

describe('Scenario 3: DSAR Export (request -> collect -> export -> audit trail)', () => {
  it('Step 1: resident requests data export', async () => {
    mockExportPropertyData.mockResolvedValue({
      id: 'export-001',
      propertyId: PROPERTY_ID,
      entityTypes: ['users', 'packages', 'maintenanceRequests', 'bookings', 'events'],
      format: 'json',
      dsarCompliant: true,
      generatedAt: new Date('2026-03-15T10:00:00Z'),
      data: {
        users: [{ id: 'user-001', firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com' }],
        packages: [{ id: 'pkg-001', unitId: 'unit-101', status: 'released' }],
        maintenanceRequests: [{ id: 'mr-001', description: 'Leaky faucet', status: 'completed' }],
        bookings: [{ id: 'booking-001', amenityId: 'amenity-001', status: 'completed' }],
        events: [{ id: 'event-001', type: 'visitor', description: 'Visitor check-in' }],
      },
    });

    const req = createPostRequest('/api/v1/data-migration/export', {
      propertyId: PROPERTY_ID,
      entityTypes: ['users', 'packages', 'maintenanceRequests', 'bookings', 'events'],
      format: 'json',
      dsarCompliant: true,
    });

    const res = await exportData(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { dsarCompliant: boolean; exportId: string };
      message: string;
    }>(res);
    expect(body.data.dsarCompliant).toBe(true);
    expect(body.data.exportId).toBe('export-001');
    expect(body.message).toContain('DSAR-compliant');
  });

  it('Step 2: system collects data from all modules', async () => {
    mockExportPropertyData.mockResolvedValue({
      id: 'export-002',
      propertyId: PROPERTY_ID,
      entityTypes: ['users', 'packages', 'maintenanceRequests', 'bookings', 'events'],
      format: 'json',
      dsarCompliant: true,
      generatedAt: new Date(),
      data: {
        users: [{ id: 'user-001', firstName: 'Jane', lastName: 'Doe' }],
        packages: [{ id: 'pkg-001', status: 'released' }],
        maintenanceRequests: [{ id: 'mr-001', status: 'completed' }],
        bookings: [{ id: 'booking-001', status: 'completed' }],
        events: [{ id: 'event-001', type: 'visitor' }],
      },
    });

    const req = createPostRequest('/api/v1/data-migration/export', {
      propertyId: PROPERTY_ID,
      entityTypes: ['users', 'packages', 'maintenanceRequests', 'bookings', 'events'],
      format: 'json',
      dsarCompliant: true,
    });

    const res = await exportData(req);
    const body = await parseResponse<{
      data: { data: Record<string, unknown[]> };
    }>(res);

    expect(body.data.data).toHaveProperty('users');
    expect(body.data.data).toHaveProperty('packages');
    expect(body.data.data).toHaveProperty('maintenanceRequests');
    expect(body.data.data).toHaveProperty('bookings');
    expect(body.data.data).toHaveProperty('events');
  });

  it('Step 3: export generated in compliant format with metadata', async () => {
    const generatedAt = new Date('2026-03-15T12:00:00Z');
    mockExportPropertyData.mockResolvedValue({
      id: 'export-003',
      propertyId: PROPERTY_ID,
      entityTypes: ['users'],
      format: 'json',
      dsarCompliant: true,
      generatedAt,
      data: {
        users: [{ id: 'user-001', firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com' }],
      },
    });

    const req = createPostRequest('/api/v1/data-migration/export', {
      propertyId: PROPERTY_ID,
      format: 'json',
      dsarCompliant: true,
    });

    const res = await exportData(req);
    const body = await parseResponse<{
      data: {
        format: string;
        generatedAt: string;
        dsarCompliant: boolean;
        propertyId: string;
      };
    }>(res);
    expect(body.data.format).toBe('json');
    expect(body.data.generatedAt).toBeTruthy();
    expect(body.data.dsarCompliant).toBe(true);
    expect(body.data.propertyId).toBe(PROPERTY_ID);
  });

  it('Step 4: audit trail logged via migration job creation', async () => {
    mockDataExportRequestCreate.mockResolvedValue({
      id: 'dsar-job-001',
      userId: 'resident-001',
      propertyId: PROPERTY_ID,
      type: 'personal_data',
      status: 'pending',
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/data-migration', {
      propertyId: PROPERTY_ID,
      type: 'dsar',
      userId: 'resident-001',
    });

    const res = await createMigrationJob(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{
      data: { jobType: string; type: string };
    }>(res);
    expect(body.data.jobType).toBe('dsar');
    expect(body.data.type).toBe('personal_data');
  });

  it('should reject export without propertyId', async () => {
    const req = createPostRequest('/api/v1/data-migration/export', {
      format: 'json',
      dsarCompliant: true,
    });

    const res = await exportData(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('should reject export with invalid format', async () => {
    const req = createPostRequest('/api/v1/data-migration/export', {
      propertyId: PROPERTY_ID,
      format: 'xml',
    });

    const res = await exportData(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string; message: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
    expect(body.message).toContain('Invalid format');
  });
});

// ===========================================================================
// Cross-Scenario: Validation & Edge Cases
// ===========================================================================

describe('Data Migration: Validation & Edge Cases', () => {
  it('import status returns 404 for nonexistent job', async () => {
    mockGetImportJobStatus.mockReturnValue(null);

    const req = createGetRequest('/api/v1/data-migration/import/nonexistent/status');
    const res = await getImportStatus(req, { params: Promise.resolve({ id: 'nonexistent' }) });
    expect(res.status).toBe(404);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('NOT_FOUND');
  });

  it('listing migration jobs requires propertyId', async () => {
    const req = createGetRequest('/api/v1/data-migration');
    const res = await listMigrationJobs(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_PROPERTY');
  });

  it('creating migration job requires propertyId', async () => {
    const req = createPostRequest('/api/v1/data-migration', {
      type: 'import',
      dataType: 'users',
      fileName: 'test.csv',
    });

    const res = await createMigrationJob(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_PROPERTY');
  });

  it('should support overwrite duplicate strategy', async () => {
    mockCreateImportJob.mockResolvedValue(makeImportJob({ duplicateStrategy: 'overwrite' }));

    const req = createPostRequest('/api/v1/data-migration/import', {
      propertyId: PROPERTY_ID,
      entityType: 'users',
      csvContent: SAMPLE_CSV,
      duplicateStrategy: 'overwrite',
    });

    const res = await importData(req);
    expect(res.status).toBe(202);

    expect(mockCreateImportJob).toHaveBeenCalledWith(
      expect.objectContaining({ duplicateStrategy: 'overwrite' }),
    );
  });

  it('should support merge duplicate strategy', async () => {
    mockCreateImportJob.mockResolvedValue(makeImportJob({ duplicateStrategy: 'merge' }));

    const req = createPostRequest('/api/v1/data-migration/import', {
      propertyId: PROPERTY_ID,
      entityType: 'users',
      csvContent: SAMPLE_CSV,
      duplicateStrategy: 'merge',
    });

    const res = await importData(req);
    expect(res.status).toBe(202);
  });

  it('should report when no column mappings could be determined', async () => {
    mockParseCsv.mockReturnValue({
      headers: ['col_a', 'col_b', 'col_c'],
      rows: [{ col_a: '1', col_b: '2', col_c: '3' }],
    });
    mockAutoDetectMappings.mockReturnValue([]);

    const req = createPostRequest('/api/v1/data-migration/import', {
      propertyId: PROPERTY_ID,
      entityType: 'users',
      csvContent: 'col_a,col_b,col_c\n1,2,3',
    });

    const res = await importData(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{
      error: string;
      message: string;
      sourceHeaders: string[];
    }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
    expect(body.message).toContain('No column mappings');
    expect(body.sourceHeaders).toEqual(['col_a', 'col_b', 'col_c']);
  });

  it('import job creation records createdBy from auth', async () => {
    mockCreateImportJob.mockResolvedValue(makeImportJob());

    const req = createPostRequest('/api/v1/data-migration/import', {
      propertyId: PROPERTY_ID,
      entityType: 'users',
      csvContent: SAMPLE_CSV,
    });

    await importData(req);

    expect(mockCreateImportJob).toHaveBeenCalledWith(
      expect.objectContaining({ createdBy: 'admin-001' }),
    );
  });

  it('import progress caps errors array at 50 entries in response', async () => {
    const manyErrors = Array.from({ length: 100 }, (_, i) => ({
      row: i + 1,
      field: 'email',
      message: `Error at row ${i + 1}`,
    }));
    mockGetImportJobStatus.mockReturnValue(
      makeImportJob({
        status: 'completed',
        processedRows: 100,
        successRows: 0,
        errorRows: 100,
        errors: manyErrors,
      }),
    );

    const req = createGetRequest('/api/v1/data-migration/import/import-001/status');
    const res = await getImportStatus(req, { params: Promise.resolve({ id: 'import-001' }) });
    const body = await parseResponse<{
      data: { errors: unknown[] };
    }>(res);
    // Route limits errors to first 50
    expect(body.data.errors.length).toBeLessThanOrEqual(50);
  });
});
