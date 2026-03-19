/**
 * Asset Management API Route Tests
 *
 * Assets are physical items a property owns: furniture, appliances, IT equipment,
 * and building systems. Each has a tag number, depreciation tracking, and can be
 * assigned to common areas or units. QR codes on tags enable quick lookups.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  createGetRequest,
  createPostRequest,
  createPatchRequest,
  parseResponse,
} from '@/test/helpers/api';
import { calculateDepreciation } from '@/schemas/asset';

// ---------------------------------------------------------------------------
// Mock Setup
// ---------------------------------------------------------------------------

const mockAssetFindMany = vi.fn();
const mockAssetFindUnique = vi.fn();
const mockAssetCount = vi.fn();
const mockAssetCreate = vi.fn();
const mockAssetUpdate = vi.fn();
const mockAssetAuditCreate = vi.fn();
const mockAssetAuditFindMany = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    asset: {
      findMany: (...args: unknown[]) => mockAssetFindMany(...args),
      findUnique: (...args: unknown[]) => mockAssetFindUnique(...args),
      count: (...args: unknown[]) => mockAssetCount(...args),
      create: (...args: unknown[]) => mockAssetCreate(...args),
      update: (...args: unknown[]) => mockAssetUpdate(...args),
    },
    assetAudit: {
      create: (...args: unknown[]) => mockAssetAuditCreate(...args),
      findMany: (...args: unknown[]) => mockAssetAuditFindMany(...args),
    },
  },
}));

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: vi.fn().mockResolvedValue({
    user: {
      userId: 'test-staff',
      propertyId: '00000000-0000-4000-b000-000000000001',
      role: 'property_manager',
      permissions: ['*'],
      mfaVerified: false,
    },
    error: null,
  }),
}));

// Route imports MUST come after vi.mock calls
import { GET, POST } from '../route';
import { GET as GET_DETAIL, PATCH } from '../../assets/[id]/route';
import { GET as GET_QR } from '../../assets/[id]/qr-code/route';
import { GET as GET_AUDITS, POST as POST_AUDIT } from '../../assets/audit/route';

beforeEach(() => {
  vi.clearAllMocks();
  mockAssetFindMany.mockResolvedValue([]);
  mockAssetCount.mockResolvedValue(0);
  mockAssetAuditFindMany.mockResolvedValue([]);
});

const PROPERTY_ID = '00000000-0000-4000-b000-000000000001';
const ASSET_ID = '00000000-0000-4000-a000-000000000001';
const UNIT_ID = '00000000-0000-4000-c000-000000000001';

// ---------------------------------------------------------------------------
// 1. Create asset with tag number, description, location
// ---------------------------------------------------------------------------

describe('POST /api/v1/assets — Create asset', () => {
  const validAsset = {
    propertyId: PROPERTY_ID,
    name: 'Lobby reception desk',
    category: 'furniture' as const,
    status: 'in_use' as const,
    location: 'Main Lobby',
  };

  it('creates an asset with required fields', async () => {
    mockAssetCreate.mockResolvedValue({
      id: ASSET_ID,
      ...validAsset,
      tagNumber: 'AST-ABC123',
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/assets', validAsset);
    const res = await POST(req);
    expect(res.status).toBe(201);

    const createData = mockAssetCreate.mock.calls[0]![0].data;
    expect(createData.tagNumber).toMatch(/^AST-[A-Z0-9]{6}$/);
    expect(createData.description).toContain('Lobby reception desk');
    expect(createData.location).toBe('Main Lobby');
    expect(createData.propertyId).toBe(PROPERTY_ID);
  });

  it('rejects missing required fields', async () => {
    const req = createPostRequest('/api/v1/assets', {});
    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('rejects missing name', async () => {
    const req = createPostRequest('/api/v1/assets', {
      propertyId: PROPERTY_ID,
      category: 'furniture',
      location: 'Lobby',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects missing location', async () => {
    const req = createPostRequest('/api/v1/assets', {
      propertyId: PROPERTY_ID,
      name: 'Desk',
      category: 'furniture',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects missing category', async () => {
    const req = createPostRequest('/api/v1/assets', {
      propertyId: PROPERTY_ID,
      name: 'Desk',
      location: 'Lobby',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 201 with asset data and message', async () => {
    mockAssetCreate.mockResolvedValue({
      id: ASSET_ID,
      ...validAsset,
      tagNumber: 'AST-ABC123',
    });

    const req = createPostRequest('/api/v1/assets', validAsset);
    const res = await POST(req);

    const body = await parseResponse<{ data: { id: string }; message: string }>(res);
    expect(body.data.id).toBe(ASSET_ID);
    expect(body.message).toMatch(/Asset AST-[A-Z0-9]{6} created/);
  });

  it('creates asset with all optional fields', async () => {
    const fullAsset = {
      ...validAsset,
      description: 'Premium lobby furniture',
      assignmentType: 'common_area',
      purchaseDate: '2024-01-15T00:00:00Z',
      purchasePrice: 5000,
      usefulLifeYears: 10,
      manufacturer: 'Herman Miller',
      modelNumber: 'AE-2024',
      serialNumber: 'SN-12345',
      notes: 'Premium lobby furniture',
    };

    mockAssetCreate.mockResolvedValue({
      id: ASSET_ID,
      ...fullAsset,
      tagNumber: 'AST-ABC123',
    });

    const req = createPostRequest('/api/v1/assets', fullAsset);
    const res = await POST(req);
    expect(res.status).toBe(201);

    const createData = mockAssetCreate.mock.calls[0]![0].data;
    expect(createData.manufacturer).toBe('Herman Miller');
    expect(createData.modelNumber).toBe('AE-2024');
    expect(createData.serialNumber).toBe('SN-12345');
    expect(createData.purchaseValue).toBe(5000);
  });

  it('sets createdById from authenticated user', async () => {
    mockAssetCreate.mockResolvedValue({
      id: ASSET_ID,
      ...validAsset,
      tagNumber: 'AST-ABC123',
    });

    const req = createPostRequest('/api/v1/assets', validAsset);
    await POST(req);

    const createData = mockAssetCreate.mock.calls[0]![0].data;
    expect(createData.createdById).toBe('test-staff');
  });

  it('handles database errors gracefully', async () => {
    mockAssetCreate.mockRejectedValue(new Error('DB down'));

    const req = createPostRequest('/api/v1/assets', validAsset);
    const res = await POST(req);
    expect(res.status).toBe(500);

    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).not.toContain('DB down');
  });
});

// ---------------------------------------------------------------------------
// 2. Asset categories: furniture, appliance, IT, building_system
// ---------------------------------------------------------------------------

describe('Asset categories', () => {
  const validCategories = ['furniture', 'appliance', 'it', 'building_system'];

  it.each(validCategories)('accepts category: %s', async (category) => {
    mockAssetCreate.mockResolvedValue({
      id: ASSET_ID,
      tagNumber: `AST-ABC123`,
      category,
    });

    const req = createPostRequest('/api/v1/assets', {
      propertyId: PROPERTY_ID,
      name: `Test ${category} asset`,
      category,
      location: 'Test Location',
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('rejects invalid category', async () => {
    const req = createPostRequest('/api/v1/assets', {
      propertyId: PROPERTY_ID,
      name: 'Invalid',
      category: 'weapons',
      location: 'Garage',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects another invalid category', async () => {
    const req = createPostRequest('/api/v1/assets', {
      propertyId: PROPERTY_ID,
      name: 'Invalid',
      category: 'spaceship',
      location: 'Storage',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('can filter assets by category via GET', async () => {
    const req = createGetRequest('/api/v1/assets', {
      searchParams: { propertyId: PROPERTY_ID, category: 'it' },
    });
    await GET(req);

    const where = mockAssetFindMany.mock.calls[0]![0].where;
    expect(where.category).toBe('it');
  });
});

// ---------------------------------------------------------------------------
// 3. Asset status: in_use, in_storage, under_repair, disposed
// ---------------------------------------------------------------------------

describe('Asset status', () => {
  const validStatuses = ['in_use', 'in_storage', 'under_repair', 'disposed'];

  it.each(validStatuses)('accepts status: %s', async (status) => {
    mockAssetCreate.mockResolvedValue({
      id: ASSET_ID,
      tagNumber: 'AST-ABC123',
      status,
    });

    const req = createPostRequest('/api/v1/assets', {
      propertyId: PROPERTY_ID,
      name: `Status ${status}`,
      category: 'furniture',
      status,
      location: 'Storage',
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('defaults status to in_use when not provided', async () => {
    mockAssetCreate.mockResolvedValue({
      id: ASSET_ID,
      tagNumber: 'AST-ABC123',
      status: 'in_use',
    });

    const req = createPostRequest('/api/v1/assets', {
      propertyId: PROPERTY_ID,
      name: 'Default status',
      category: 'furniture',
      location: 'Lobby',
    });
    const res = await POST(req);
    expect(res.status).toBe(201);

    const createData = mockAssetCreate.mock.calls[0]![0].data;
    expect(createData.status).toBe('in_use');
  });

  it('can update status via PATCH', async () => {
    mockAssetFindUnique.mockResolvedValue({
      id: ASSET_ID,
      propertyId: PROPERTY_ID,
      status: 'in_use',
    });
    mockAssetUpdate.mockResolvedValue({
      id: ASSET_ID,
      status: 'under_repair',
      tagNumber: 'AST-S',
    });

    const req = createPatchRequest('/api/v1/assets/update', {
      status: 'under_repair',
    });
    const res = await PATCH(req, {
      params: Promise.resolve({ id: ASSET_ID }),
    });
    expect(res.status).toBe(200);

    const updateData = mockAssetUpdate.mock.calls[0]![0].data;
    expect(updateData.status).toBe('under_repair');
  });

  it('can update status to disposed via PATCH', async () => {
    mockAssetFindUnique.mockResolvedValue({
      id: ASSET_ID,
      propertyId: PROPERTY_ID,
      status: 'in_use',
    });
    mockAssetUpdate.mockResolvedValue({
      id: ASSET_ID,
      status: 'disposed',
      tagNumber: 'AST-DISP',
    });

    const req = createPatchRequest('/api/v1/assets/update', {
      status: 'disposed',
    });
    const res = await PATCH(req, {
      params: Promise.resolve({ id: ASSET_ID }),
    });
    expect(res.status).toBe(200);

    const updateData = mockAssetUpdate.mock.calls[0]![0].data;
    expect(updateData.status).toBe('disposed');
  });

  it('can filter by status via GET', async () => {
    const req = createGetRequest('/api/v1/assets', {
      searchParams: { propertyId: PROPERTY_ID, status: 'disposed' },
    });
    await GET(req);

    const where = mockAssetFindMany.mock.calls[0]![0].where;
    expect(where.status).toBe('disposed');
  });
});

// ---------------------------------------------------------------------------
// 4. Asset assignment to common areas or units
// ---------------------------------------------------------------------------

describe('Asset assignment', () => {
  it('assigns asset to a common area', async () => {
    mockAssetCreate.mockResolvedValue({
      id: ASSET_ID,
      assignmentType: 'common_area',
      assignedToId: null,
      location: 'Main Lobby',
      tagNumber: 'AST-ABC123',
    });

    const req = createPostRequest('/api/v1/assets', {
      propertyId: PROPERTY_ID,
      name: 'Lobby sofa',
      category: 'furniture',
      location: 'Main Lobby',
      assignmentType: 'common_area',
    });
    const res = await POST(req);
    expect(res.status).toBe(201);

    const createData = mockAssetCreate.mock.calls[0]![0].data;
    expect(createData.assignmentType).toBe('common_area');
  });

  it('assigns asset to a unit', async () => {
    mockAssetCreate.mockResolvedValue({
      id: ASSET_ID,
      assignmentType: 'unit',
      assignedToId: UNIT_ID,
      location: 'Unit 302',
      tagNumber: 'AST-ABC123',
    });

    const req = createPostRequest('/api/v1/assets', {
      propertyId: PROPERTY_ID,
      name: 'Unit dishwasher',
      category: 'appliance',
      location: 'Unit 302',
      assignmentType: 'unit',
      assignedToId: UNIT_ID,
    });
    const res = await POST(req);
    expect(res.status).toBe(201);

    const createData = mockAssetCreate.mock.calls[0]![0].data;
    expect(createData.assignmentType).toBe('unit');
    expect(createData.assignedToId).toBe(UNIT_ID);
  });

  it('can reassign asset via PATCH', async () => {
    mockAssetFindUnique.mockResolvedValue({
      id: ASSET_ID,
      propertyId: PROPERTY_ID,
      assignmentType: 'common_area',
      assignedToId: null,
    });
    mockAssetUpdate.mockResolvedValue({
      id: ASSET_ID,
      assignmentType: 'unit',
      assignedToId: UNIT_ID,
      tagNumber: 'AST-CA',
    });

    const req = createPatchRequest('/api/v1/assets/update', {
      assignmentType: 'unit',
      assignedToId: UNIT_ID,
    });
    const res = await PATCH(req, {
      params: Promise.resolve({ id: ASSET_ID }),
    });
    expect(res.status).toBe(200);

    const updateData = mockAssetUpdate.mock.calls[0]![0].data;
    expect(updateData.assignmentType).toBe('unit');
    expect(updateData.assignedToId).toBe(UNIT_ID);
  });

  it('can filter by assignmentType via GET', async () => {
    const req = createGetRequest('/api/v1/assets', {
      searchParams: { propertyId: PROPERTY_ID, assignmentType: 'common_area' },
    });
    await GET(req);

    const where = mockAssetFindMany.mock.calls[0]![0].where;
    expect(where.assignmentType).toBe('common_area');
  });
});

// ---------------------------------------------------------------------------
// 5. Depreciation tracking: purchase date, value, useful life
// ---------------------------------------------------------------------------

describe('Depreciation tracking', () => {
  const asOfDate = new Date('2026-03-19T00:00:00Z');

  it('calculates straight-line depreciation correctly', () => {
    const result = calculateDepreciation(10000, 10, '2021-03-19T00:00:00Z', asOfDate);

    expect(result.annualDepreciation).toBe(1000);
    expect(result.accumulatedDepreciation).toBeCloseTo(5000, -1);
    expect(result.currentValue).toBeCloseTo(5000, -1);
    expect(result.percentDepreciated).toBeCloseTo(50, 0);
    expect(result.isFullyDepreciated).toBe(false);
  });

  it('marks asset as fully depreciated when past useful life', () => {
    const result = calculateDepreciation(5000, 3, '2020-01-01T00:00:00Z', asOfDate);

    expect(result.isFullyDepreciated).toBe(true);
    expect(result.currentValue).toBe(0);
    expect(result.percentDepreciated).toBe(100);
  });

  it('handles brand-new asset (0 depreciation)', () => {
    const result = calculateDepreciation(8000, 5, '2026-03-19T00:00:00Z', asOfDate);

    expect(result.accumulatedDepreciation).toBeCloseTo(0, 0);
    expect(result.currentValue).toBeCloseTo(8000, 0);
    expect(result.isFullyDepreciated).toBe(false);
  });

  it('calculates annual depreciation rate correctly', () => {
    const result = calculateDepreciation(12000, 6, '2025-03-19T00:00:00Z', asOfDate);
    expect(result.annualDepreciation).toBe(2000);
  });

  it('clamps depreciation at purchase value for very old assets', () => {
    const result = calculateDepreciation(3000, 2, '2015-01-01T00:00:00Z', asOfDate);

    expect(result.currentValue).toBe(0);
    expect(result.accumulatedDepreciation).toBeLessThanOrEqual(3000);
    expect(result.isFullyDepreciated).toBe(true);
  });

  it('returns depreciation data in asset detail response', async () => {
    mockAssetFindUnique.mockResolvedValue({
      id: ASSET_ID,
      propertyId: PROPERTY_ID,
      tagNumber: 'AST-DEP',
      description: 'Office desk',
      category: 'furniture',
      status: 'in_use',
      location: 'Office',
      purchaseDate: new Date('2024-03-19'),
      purchaseValue: 2000,
      usefulLifeYears: 10,
    });

    const req = createGetRequest('/api/v1/assets/detail');
    const res = await GET_DETAIL(req, {
      params: Promise.resolve({ id: ASSET_ID }),
    });

    expect(res.status).toBe(200);
    const body = await parseResponse<{
      data: {
        depreciation: {
          currentValue: number;
          annualDepreciation: number;
          isFullyDepreciated: boolean;
        };
      };
    }>(res);

    expect(body.data.depreciation).toBeDefined();
    expect(body.data.depreciation.annualDepreciation).toBe(200);
    expect(body.data.depreciation.isFullyDepreciated).toBe(false);
  });

  it('returns null depreciation when purchase data is missing', async () => {
    mockAssetFindUnique.mockResolvedValue({
      id: ASSET_ID,
      propertyId: PROPERTY_ID,
      tagNumber: 'AST-NODEP',
      description: 'Old desk',
      category: 'furniture',
      status: 'in_use',
      location: 'Office',
      purchaseDate: null,
      purchaseValue: null,
      usefulLifeYears: null,
    });

    const req = createGetRequest('/api/v1/assets/detail');
    const res = await GET_DETAIL(req, {
      params: Promise.resolve({ id: ASSET_ID }),
    });

    const body = await parseResponse<{
      data: { depreciation: null };
    }>(res);
    expect(body.data.depreciation).toBeNull();
  });

  it('returns null depreciation when purchaseValue is present but usefulLifeYears is missing', async () => {
    mockAssetFindUnique.mockResolvedValue({
      id: ASSET_ID,
      propertyId: PROPERTY_ID,
      tagNumber: 'AST-PARTIAL',
      description: 'Partial data desk',
      category: 'furniture',
      status: 'in_use',
      location: 'Office',
      purchaseDate: new Date('2024-01-01'),
      purchaseValue: 5000,
      usefulLifeYears: null,
    });

    const req = createGetRequest('/api/v1/assets/detail');
    const res = await GET_DETAIL(req, {
      params: Promise.resolve({ id: ASSET_ID }),
    });

    const body = await parseResponse<{
      data: { depreciation: null };
    }>(res);
    expect(body.data.depreciation).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 6. Asset audit: physical inventory count vs system records
// ---------------------------------------------------------------------------

describe('POST /api/v1/assets/audit — Physical inventory audit', () => {
  const validAudit = {
    propertyId: PROPERTY_ID,
    auditDate: '2026-03-19T00:00:00Z',
    conductedById: '00000000-0000-4000-f000-000000000001',
    findings: [
      { assetId: ASSET_ID, found: true, condition: 'good' as const },
      {
        assetId: '00000000-0000-4000-a000-000000000002',
        found: false,
        condition: 'missing' as const,
        notes: 'Not found in expected location',
      },
    ],
  };

  it('creates an audit with findings', async () => {
    mockAssetAuditCreate.mockResolvedValue({
      id: 'audit-1',
      ...validAudit,
      summary: { total: 2, found: 1, missing: 1, discrepancyRate: 50 },
    });

    const req = createPostRequest('/api/v1/assets/audit', validAudit);
    const res = await POST_AUDIT(req);
    expect(res.status).toBe(201);

    const createData = mockAssetAuditCreate.mock.calls[0]![0].data;
    expect(createData.propertyId).toBe(PROPERTY_ID);
    expect(createData.findings).toBeDefined();
  });

  it('calculates discrepancy between physical count and system records', async () => {
    mockAssetAuditCreate.mockResolvedValue({
      id: 'audit-2',
      ...validAudit,
      summary: { total: 2, found: 1, missing: 1, discrepancyRate: 50 },
    });

    const req = createPostRequest('/api/v1/assets/audit', validAudit);
    const res = await POST_AUDIT(req);

    const body = await parseResponse<{
      data: { summary: { total: number; found: number; missing: number; discrepancyRate: number } };
    }>(res);

    expect(body.data.summary.total).toBe(2);
    expect(body.data.summary.found).toBe(1);
    expect(body.data.summary.missing).toBe(1);
    expect(body.data.summary.discrepancyRate).toBe(50);
  });

  it('calculates 0% discrepancy when all assets found', async () => {
    const allFoundAudit = {
      ...validAudit,
      findings: [
        { assetId: ASSET_ID, found: true, condition: 'good' as const },
        {
          assetId: '00000000-0000-4000-a000-000000000002',
          found: true,
          condition: 'fair' as const,
        },
      ],
    };

    mockAssetAuditCreate.mockResolvedValue({
      id: 'audit-3',
      ...allFoundAudit,
      summary: { total: 2, found: 2, missing: 0, discrepancyRate: 0 },
    });

    const req = createPostRequest('/api/v1/assets/audit', allFoundAudit);
    const res = await POST_AUDIT(req);

    const body = await parseResponse<{
      data: { summary: { discrepancyRate: number } };
    }>(res);
    expect(body.data.summary.discrepancyRate).toBe(0);
  });

  it('sets createdById from authenticated user', async () => {
    mockAssetAuditCreate.mockResolvedValue({
      id: 'audit-4',
      ...validAudit,
      summary: { total: 2, found: 1, missing: 1, discrepancyRate: 50 },
    });

    const req = createPostRequest('/api/v1/assets/audit', validAudit);
    await POST_AUDIT(req);

    const createData = mockAssetAuditCreate.mock.calls[0]![0].data;
    expect(createData.createdById).toBe('test-staff');
  });

  it('returns message with found/total counts', async () => {
    mockAssetAuditCreate.mockResolvedValue({
      id: 'audit-5',
      ...validAudit,
      summary: { total: 2, found: 1, missing: 1, discrepancyRate: 50 },
    });

    const req = createPostRequest('/api/v1/assets/audit', validAudit);
    const res = await POST_AUDIT(req);

    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('1/2');
  });

  it('rejects missing required fields', async () => {
    const req = createPostRequest('/api/v1/assets/audit', {});
    const res = await POST_AUDIT(req);
    expect(res.status).toBe(400);
  });

  it('returns audit history for a property', async () => {
    mockAssetAuditFindMany.mockResolvedValue([
      {
        id: 'audit-1',
        propertyId: PROPERTY_ID,
        auditDate: new Date('2026-03-19'),
        summary: { total: 50, found: 48, missing: 2, discrepancyRate: 4 },
      },
    ]);

    const req = createGetRequest('/api/v1/assets/audit', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET_AUDITS(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: Array<{ summary: { discrepancyRate: number } }>;
    }>(res);
    expect(body.data).toHaveLength(1);
    expect(body.data[0]!.summary.discrepancyRate).toBe(4);
  });

  it('rejects audit listing without propertyId', async () => {
    const req = createGetRequest('/api/v1/assets/audit');
    const res = await GET_AUDITS(req);
    expect(res.status).toBe(400);
  });

  it('orders audit history by date descending', async () => {
    const req = createGetRequest('/api/v1/assets/audit', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    await GET_AUDITS(req);

    const orderBy = mockAssetAuditFindMany.mock.calls[0]![0].orderBy;
    expect(orderBy).toEqual({ auditDate: 'desc' });
  });
});

// ---------------------------------------------------------------------------
// 7. QR code generation for asset tags
// ---------------------------------------------------------------------------

describe('GET /api/v1/assets/:id/qr-code — QR code generation', () => {
  it('returns QR code data URL for an asset', async () => {
    mockAssetFindUnique.mockResolvedValue({
      id: ASSET_ID,
      propertyId: PROPERTY_ID,
      tagNumber: 'AST-001',
    });

    const req = createGetRequest('/api/v1/assets/qr-code');
    const res = await GET_QR(req, {
      params: Promise.resolve({ id: ASSET_ID }),
    });

    expect(res.status).toBe(200);
    const body = await parseResponse<{
      data: { assetId: string; tagNumber: string; qrDataUrl: string };
    }>(res);

    expect(body.data.assetId).toBe(ASSET_ID);
    expect(body.data.tagNumber).toBe('AST-001');
    expect(body.data.qrDataUrl).toContain('data:image/svg+xml');
  });

  it('returns 404 for non-existent asset', async () => {
    mockAssetFindUnique.mockResolvedValue(null);

    const req = createGetRequest('/api/v1/assets/qr-code');
    const res = await GET_QR(req, {
      params: Promise.resolve({ id: 'non-existent' }),
    });
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// GET /api/v1/assets — List assets with filtering
// ---------------------------------------------------------------------------

describe('GET /api/v1/assets — List assets', () => {
  it('REJECTS without propertyId', async () => {
    const req = createGetRequest('/api/v1/assets');
    const res = await GET(req);
    expect(res.status).toBe(400);
    expect(mockAssetFindMany).not.toHaveBeenCalled();
  });

  it('scopes to propertyId — tenant isolation', async () => {
    const req = createGetRequest('/api/v1/assets', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    await GET(req);

    const where = mockAssetFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_ID);
  });

  it('supports search by description or tag number', async () => {
    const req = createGetRequest('/api/v1/assets', {
      searchParams: { propertyId: PROPERTY_ID, search: 'lobby' },
    });
    await GET(req);

    const where = mockAssetFindMany.mock.calls[0]![0].where;
    expect(where.OR).toBeDefined();
    expect(where.OR).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ description: expect.objectContaining({ contains: 'lobby' }) }),
        expect.objectContaining({ tagNumber: expect.objectContaining({ contains: 'lobby' }) }),
      ]),
    );
  });

  it('search is case insensitive', async () => {
    const req = createGetRequest('/api/v1/assets', {
      searchParams: { propertyId: PROPERTY_ID, search: 'Lobby' },
    });
    await GET(req);

    const where = mockAssetFindMany.mock.calls[0]![0].where;
    expect(where.OR[0].description.mode).toBe('insensitive');
  });

  it('returns paginated results', async () => {
    mockAssetFindMany.mockResolvedValue([
      { id: ASSET_ID, tagNumber: 'AST-001', description: 'Desk' },
    ]);
    mockAssetCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/assets', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: Array<{ tagNumber: string }>;
      meta: { total: number };
    }>(res);
    expect(body.data).toHaveLength(1);
    expect(body.meta.total).toBe(1);
  });

  it('respects custom page and pageSize', async () => {
    const req = createGetRequest('/api/v1/assets', {
      searchParams: { propertyId: PROPERTY_ID, page: '3', pageSize: '20' },
    });
    await GET(req);

    const call = mockAssetFindMany.mock.calls[0]![0];
    expect(call.skip).toBe(40);
    expect(call.take).toBe(20);
  });

  it('calculates totalPages correctly', async () => {
    mockAssetFindMany.mockResolvedValue([]);
    mockAssetCount.mockResolvedValue(95);

    const req = createGetRequest('/api/v1/assets', {
      searchParams: { propertyId: PROPERTY_ID, pageSize: '10' },
    });
    const res = await GET(req);

    const body = await parseResponse<{
      meta: { totalPages: number };
    }>(res);
    expect(body.meta.totalPages).toBe(10);
  });

  it('orders results by tagNumber ascending', async () => {
    const req = createGetRequest('/api/v1/assets', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    await GET(req);

    const orderBy = mockAssetFindMany.mock.calls[0]![0].orderBy;
    expect(orderBy).toEqual({ tagNumber: 'asc' });
  });

  it('handles database errors gracefully', async () => {
    mockAssetFindMany.mockRejectedValue(new Error('Connection timeout'));

    const req = createGetRequest('/api/v1/assets', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET(req);
    expect(res.status).toBe(500);

    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).not.toContain('Connection timeout');
  });
});

// ---------------------------------------------------------------------------
// GET /api/v1/assets/:id — Asset detail
// ---------------------------------------------------------------------------

describe('GET /api/v1/assets/:id — Asset detail', () => {
  it('returns asset with full details', async () => {
    mockAssetFindUnique.mockResolvedValue({
      id: ASSET_ID,
      propertyId: PROPERTY_ID,
      tagNumber: 'AST-001',
      description: 'Lobby desk',
      category: 'furniture',
      status: 'in_use',
      location: 'Main Lobby',
      purchaseDate: null,
      purchaseValue: null,
      usefulLifeYears: null,
    });

    const req = createGetRequest('/api/v1/assets/detail');
    const res = await GET_DETAIL(req, {
      params: Promise.resolve({ id: ASSET_ID }),
    });
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { tagNumber: string; category: string };
    }>(res);
    expect(body.data.tagNumber).toBe('AST-001');
    expect(body.data.category).toBe('furniture');
  });

  it('returns 404 for non-existent asset', async () => {
    mockAssetFindUnique.mockResolvedValue(null);

    const req = createGetRequest('/api/v1/assets/detail');
    const res = await GET_DETAIL(req, {
      params: Promise.resolve({ id: 'non-existent' }),
    });
    expect(res.status).toBe(404);
  });

  it('returns 404 error with NOT_FOUND code', async () => {
    mockAssetFindUnique.mockResolvedValue(null);

    const req = createGetRequest('/api/v1/assets/detail');
    const res = await GET_DETAIL(req, {
      params: Promise.resolve({ id: 'non-existent' }),
    });

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('NOT_FOUND');
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/v1/assets/:id — Update asset
// ---------------------------------------------------------------------------

describe('PATCH /api/v1/assets/:id — Update asset', () => {
  it('updates asset description', async () => {
    mockAssetFindUnique.mockResolvedValue({
      id: ASSET_ID,
      propertyId: PROPERTY_ID,
      tagNumber: 'AST-001',
      description: 'Old description',
    });
    mockAssetUpdate.mockResolvedValue({
      id: ASSET_ID,
      tagNumber: 'AST-001',
      description: 'Updated lobby reception desk',
    });

    const req = createPatchRequest('/api/v1/assets/update', {
      description: 'Updated lobby reception desk',
    });
    const res = await PATCH(req, {
      params: Promise.resolve({ id: ASSET_ID }),
    });
    expect(res.status).toBe(200);

    const updateData = mockAssetUpdate.mock.calls[0]![0].data;
    expect(updateData.description).toBe('Updated lobby reception desk');
  });

  it('updates asset location', async () => {
    mockAssetFindUnique.mockResolvedValue({
      id: ASSET_ID,
      propertyId: PROPERTY_ID,
    });
    mockAssetUpdate.mockResolvedValue({
      id: ASSET_ID,
      tagNumber: 'AST-001',
      location: 'Second Floor Lounge',
    });

    const req = createPatchRequest('/api/v1/assets/update', {
      location: 'Second Floor Lounge',
    });
    const res = await PATCH(req, {
      params: Promise.resolve({ id: ASSET_ID }),
    });
    expect(res.status).toBe(200);
  });

  it('updates asset notes', async () => {
    mockAssetFindUnique.mockResolvedValue({
      id: ASSET_ID,
      propertyId: PROPERTY_ID,
    });
    mockAssetUpdate.mockResolvedValue({
      id: ASSET_ID,
      tagNumber: 'AST-001',
      notes: 'Needs repair in Q2',
    });

    const req = createPatchRequest('/api/v1/assets/update', {
      notes: 'Needs repair in Q2',
    });
    const res = await PATCH(req, {
      params: Promise.resolve({ id: ASSET_ID }),
    });
    expect(res.status).toBe(200);
  });

  it('returns 404 for non-existent asset', async () => {
    mockAssetFindUnique.mockResolvedValue(null);

    const req = createPatchRequest('/api/v1/assets/update', {
      status: 'under_repair',
    });
    const res = await PATCH(req, {
      params: Promise.resolve({ id: 'non-existent' }),
    });
    expect(res.status).toBe(404);
  });

  it('returns updated asset with message containing tag number', async () => {
    mockAssetFindUnique.mockResolvedValue({
      id: ASSET_ID,
      propertyId: PROPERTY_ID,
    });
    mockAssetUpdate.mockResolvedValue({
      id: ASSET_ID,
      tagNumber: 'AST-UPD',
      status: 'in_storage',
    });

    const req = createPatchRequest('/api/v1/assets/update', {
      status: 'in_storage',
    });
    const res = await PATCH(req, {
      params: Promise.resolve({ id: ASSET_ID }),
    });

    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('AST-UPD');
  });

  it('handles database errors gracefully', async () => {
    mockAssetFindUnique.mockResolvedValue({
      id: ASSET_ID,
      propertyId: PROPERTY_ID,
    });
    mockAssetUpdate.mockRejectedValue(new Error('Write conflict'));

    const req = createPatchRequest('/api/v1/assets/update', {
      status: 'disposed',
    });
    const res = await PATCH(req, {
      params: Promise.resolve({ id: ASSET_ID }),
    });
    expect(res.status).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// Tenant isolation
// ---------------------------------------------------------------------------

describe('Tenant isolation', () => {
  it('cannot query assets without propertyId', async () => {
    const req = createGetRequest('/api/v1/assets');
    const res = await GET(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_PROPERTY');
  });

  it('cannot list audits without propertyId', async () => {
    const req = createGetRequest('/api/v1/assets/audit');
    const res = await GET_AUDITS(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_PROPERTY');
  });

  it('asset listing always scoped to provided propertyId', async () => {
    const otherPropertyId = '00000000-0000-4000-b000-000000000099';
    const req = createGetRequest('/api/v1/assets', {
      searchParams: { propertyId: otherPropertyId },
    });
    await GET(req);

    const where = mockAssetFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(otherPropertyId);
  });
});
