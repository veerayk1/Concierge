/**
 * Equipment Lifecycle API Route Tests — per CLAUDE.md Phase 2
 *
 * Equipment tracking prevents surprise failures. A boiler that hasn't been
 * serviced in 3 years will fail in January. Lifecycle management with
 * categories, warranty tracking, and replacement forecasts lets property
 * managers stay ahead of costly breakdowns.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  createGetRequest,
  createPostRequest,
  createPatchRequest,
  parseResponse,
} from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Mock Setup
// ---------------------------------------------------------------------------

const mockFindMany = vi.fn();
const mockCount = vi.fn();
const mockCreate = vi.fn();
const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    equipment: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      count: (...args: unknown[]) => mockCount(...args),
      create: (...args: unknown[]) => mockCreate(...args),
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
    maintenanceRequest: {
      findMany: vi.fn().mockResolvedValue([]),
      count: vi.fn().mockResolvedValue(0),
      aggregate: vi.fn().mockResolvedValue({ _sum: { cost: null } }),
    },
  },
}));

vi.mock('nanoid', () => ({
  nanoid: vi.fn().mockReturnValue('A1B2'),
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

import { GET, POST } from '../route';
import { GET as GET_BY_ID, PATCH } from '@/app/api/v1/equipment/[id]/route';
import { GET as GET_HISTORY } from '@/app/api/v1/equipment/[id]/history/route';

beforeEach(() => {
  vi.clearAllMocks();
  mockFindMany.mockResolvedValue([]);
  mockCount.mockResolvedValue(0);
});

const PROPERTY_ID = '00000000-0000-4000-b000-000000000001';
const EQUIPMENT_ID = '00000000-0000-4000-c000-000000000001';

// ---------------------------------------------------------------------------
// 1. Create equipment with required fields
// ---------------------------------------------------------------------------

describe('POST /api/v1/equipment — Equipment Creation', () => {
  const validBody = {
    propertyId: PROPERTY_ID,
    name: 'Rooftop HVAC Unit #1',
    category: 'HVAC' as const,
    serialNumber: 'HVAC-2024-001',
    location: 'Rooftop Level 12',
    installDate: '2024-01-15',
  };

  it('creates equipment with name, category, serialNumber, location, installDate', async () => {
    mockCreate.mockResolvedValue({
      id: EQUIPMENT_ID,
      ...validBody,
      status: 'active',
      assetTag: 'EQ-0001',
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const req = createPostRequest('/api/v1/equipment', validBody);
    const res = await POST(req);

    expect(res.status).toBe(201);
    const body = await parseResponse<{ data: Record<string, unknown> }>(res);
    expect(body.data).toBeDefined();

    const createData = mockCreate.mock.calls[0]![0].data;
    expect(createData.name).toBe('Rooftop HVAC Unit #1');
    expect(createData.category).toBe('HVAC');
    expect(createData.serialNumber).toBe('HVAC-2024-001');
    expect(createData.location).toBe('Rooftop Level 12');
    expect(createData.installDate).toBeDefined();
  });

  it('rejects missing name — every piece of equipment must be identifiable', async () => {
    const req = createPostRequest('/api/v1/equipment', {
      propertyId: PROPERTY_ID,
      category: 'HVAC',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('rejects missing propertyId — tenant isolation is non-negotiable', async () => {
    const req = createPostRequest('/api/v1/equipment', {
      name: 'Boiler',
      category: 'HVAC',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('generates an asset tag for physical labeling', async () => {
    mockCreate.mockResolvedValue({
      id: EQUIPMENT_ID,
      ...validBody,
      status: 'active',
      assetTag: 'EQ-A1B2',
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/equipment', validBody);
    await POST(req);

    const createData = mockCreate.mock.calls[0]![0].data;
    expect(createData.assetTag).toMatch(/^EQ-[A-Z0-9]+$/);
  });

  it('sets initial status to active', async () => {
    mockCreate.mockResolvedValue({
      id: EQUIPMENT_ID,
      ...validBody,
      status: 'active',
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/equipment', validBody);
    await POST(req);

    const createData = mockCreate.mock.calls[0]![0].data;
    expect(createData.status).toBe('active');
  });

  it('handles database errors gracefully', async () => {
    mockCreate.mockRejectedValue(new Error('DB connection lost'));

    const req = createPostRequest('/api/v1/equipment', validBody);
    const res = await POST(req);

    expect(res.status).toBe(500);
    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).not.toContain('DB connection lost');
  });
});

// ---------------------------------------------------------------------------
// 2. Equipment categories
// ---------------------------------------------------------------------------

describe('Equipment Categories', () => {
  const categories = ['HVAC', 'plumbing', 'electrical', 'fire_safety', 'elevator', 'other'];

  it.each(categories)('accepts category: %s', async (category) => {
    mockCreate.mockResolvedValue({
      id: EQUIPMENT_ID,
      name: `${category} unit`,
      category,
      status: 'active',
      propertyId: PROPERTY_ID,
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/equipment', {
      propertyId: PROPERTY_ID,
      name: `${category} unit`,
      category,
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('rejects invalid category', async () => {
    const req = createPostRequest('/api/v1/equipment', {
      propertyId: PROPERTY_ID,
      name: 'Widget',
      category: 'teleportation',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('defaults to "other" when no category is specified', async () => {
    mockCreate.mockResolvedValue({
      id: EQUIPMENT_ID,
      name: 'Generic Item',
      category: 'other',
      status: 'active',
      propertyId: PROPERTY_ID,
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/equipment', {
      propertyId: PROPERTY_ID,
      name: 'Generic Item',
    });
    await POST(req);

    const createData = mockCreate.mock.calls[0]![0].data;
    expect(createData.category).toBe('other');
  });
});

// ---------------------------------------------------------------------------
// 3. Status lifecycle: active → needs_repair → under_repair → decommissioned
// ---------------------------------------------------------------------------

describe('PATCH /api/v1/equipment/:id — Status Lifecycle', () => {
  const makeExisting = (status: string) => ({
    id: EQUIPMENT_ID,
    propertyId: PROPERTY_ID,
    name: 'Boiler #3',
    category: 'HVAC',
    status,
    createdAt: new Date(),
    deletedAt: null,
  });

  it('transitions active → needs_repair', async () => {
    mockFindUnique.mockResolvedValue(makeExisting('active'));
    mockUpdate.mockResolvedValue({ ...makeExisting('needs_repair') });

    const req = createPatchRequest(`/api/v1/equipment/${EQUIPMENT_ID}`, {
      status: 'needs_repair',
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: EQUIPMENT_ID }) });
    expect(res.status).toBe(200);
  });

  it('transitions needs_repair → under_repair', async () => {
    mockFindUnique.mockResolvedValue(makeExisting('needs_repair'));
    mockUpdate.mockResolvedValue({ ...makeExisting('under_repair') });

    const req = createPatchRequest(`/api/v1/equipment/${EQUIPMENT_ID}`, {
      status: 'under_repair',
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: EQUIPMENT_ID }) });
    expect(res.status).toBe(200);
  });

  it('transitions under_repair → active (back to service)', async () => {
    mockFindUnique.mockResolvedValue(makeExisting('under_repair'));
    mockUpdate.mockResolvedValue({ ...makeExisting('active') });

    const req = createPatchRequest(`/api/v1/equipment/${EQUIPMENT_ID}`, {
      status: 'active',
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: EQUIPMENT_ID }) });
    expect(res.status).toBe(200);
  });

  it('transitions active → decommissioned', async () => {
    mockFindUnique.mockResolvedValue(makeExisting('active'));
    mockUpdate.mockResolvedValue({ ...makeExisting('decommissioned') });

    const req = createPatchRequest(`/api/v1/equipment/${EQUIPMENT_ID}`, {
      status: 'decommissioned',
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: EQUIPMENT_ID }) });
    expect(res.status).toBe(200);
  });

  it('rejects invalid transition: active → under_repair (must go through needs_repair)', async () => {
    mockFindUnique.mockResolvedValue(makeExisting('active'));

    const req = createPatchRequest(`/api/v1/equipment/${EQUIPMENT_ID}`, {
      status: 'under_repair',
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: EQUIPMENT_ID }) });
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('INVALID_STATUS_TRANSITION');
  });

  it('rejects transition from decommissioned — equipment cannot be un-decommissioned', async () => {
    mockFindUnique.mockResolvedValue(makeExisting('decommissioned'));

    const req = createPatchRequest(`/api/v1/equipment/${EQUIPMENT_ID}`, {
      status: 'active',
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: EQUIPMENT_ID }) });
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// 4. Warranty tracking
// ---------------------------------------------------------------------------

describe('Warranty Tracking', () => {
  it('stores warrantyExpiry date on creation', async () => {
    mockCreate.mockResolvedValue({
      id: EQUIPMENT_ID,
      name: 'Elevator Motor',
      warrantyExpiry: new Date('2027-06-15'),
      status: 'active',
      propertyId: PROPERTY_ID,
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/equipment', {
      propertyId: PROPERTY_ID,
      name: 'Elevator Motor',
      category: 'elevator',
      warrantyExpiry: '2027-06-15',
    });
    await POST(req);

    const createData = mockCreate.mock.calls[0]![0].data;
    expect(createData.warrantyExpiry).toBeDefined();
  });

  it('GET returns warranty status as active when expiry is in the future', async () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    mockFindUnique.mockResolvedValue({
      id: EQUIPMENT_ID,
      propertyId: PROPERTY_ID,
      name: 'Fire Pump',
      category: 'fire_safety',
      status: 'active',
      warrantyExpiry: futureDate,
      deletedAt: null,
      maintenanceRequests: [],
    });

    const req = createGetRequest(`/api/v1/equipment/${EQUIPMENT_ID}`, {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: EQUIPMENT_ID }) });

    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: { warrantyStatus: string } }>(res);
    expect(body.data.warrantyStatus).toBe('active');
  });

  it('GET returns warranty status as expired when expiry is in the past', async () => {
    const pastDate = new Date('2023-01-01');

    mockFindUnique.mockResolvedValue({
      id: EQUIPMENT_ID,
      propertyId: PROPERTY_ID,
      name: 'Old Pump',
      category: 'plumbing',
      status: 'active',
      warrantyExpiry: pastDate,
      deletedAt: null,
      maintenanceRequests: [],
    });

    const req = createGetRequest(`/api/v1/equipment/${EQUIPMENT_ID}`, {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: EQUIPMENT_ID }) });

    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: { warrantyStatus: string } }>(res);
    expect(body.data.warrantyStatus).toBe('expired');
  });

  it('GET returns warranty status as unknown when no expiry date set', async () => {
    mockFindUnique.mockResolvedValue({
      id: EQUIPMENT_ID,
      propertyId: PROPERTY_ID,
      name: 'Old Boiler',
      category: 'HVAC',
      status: 'active',
      warrantyExpiry: null,
      deletedAt: null,
      maintenanceRequests: [],
    });

    const req = createGetRequest(`/api/v1/equipment/${EQUIPMENT_ID}`, {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: EQUIPMENT_ID }) });

    const body = await parseResponse<{ data: { warrantyStatus: string } }>(res);
    expect(body.data.warrantyStatus).toBe('unknown');
  });
});

// ---------------------------------------------------------------------------
// 5. Maintenance history: link maintenance requests to equipment
// ---------------------------------------------------------------------------

describe('GET /api/v1/equipment/:id/history — Maintenance History', () => {
  it('returns maintenance requests linked to equipment', async () => {
    mockFindUnique.mockResolvedValue({
      id: EQUIPMENT_ID,
      propertyId: PROPERTY_ID,
      name: 'Boiler',
      deletedAt: null,
    });

    const { prisma } = await import('@/server/db');
    (prisma.maintenanceRequest.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        id: 'mr-1',
        referenceNumber: 'MR-0001',
        description: 'Annual boiler inspection',
        status: 'completed',
        createdAt: new Date('2025-01-15'),
      },
      {
        id: 'mr-2',
        referenceNumber: 'MR-0002',
        description: 'Boiler pressure valve replacement',
        status: 'open',
        createdAt: new Date('2025-03-01'),
      },
    ]);

    const req = createGetRequest(`/api/v1/equipment/${EQUIPMENT_ID}/history`, {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET_HISTORY(req, { params: Promise.resolve({ id: EQUIPMENT_ID }) });

    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: unknown[] }>(res);
    expect(body.data).toHaveLength(2);
  });

  it('returns 404 when equipment does not exist', async () => {
    mockFindUnique.mockResolvedValue(null);

    const req = createGetRequest(`/api/v1/equipment/${EQUIPMENT_ID}/history`, {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET_HISTORY(req, { params: Promise.resolve({ id: EQUIPMENT_ID }) });
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// 6. Replacement forecast based on expected lifespan
// ---------------------------------------------------------------------------

describe('Replacement Forecast', () => {
  it('GET single equipment includes replacement forecast when lifespan is set', async () => {
    const installDate = new Date('2015-01-01');

    mockFindUnique.mockResolvedValue({
      id: EQUIPMENT_ID,
      propertyId: PROPERTY_ID,
      name: 'Elevator Motor',
      category: 'elevator',
      status: 'active',
      installDate,
      expectedLifespanYears: 15,
      warrantyExpiry: null,
      deletedAt: null,
      maintenanceRequests: [],
    });

    const req = createGetRequest(`/api/v1/equipment/${EQUIPMENT_ID}`, {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: EQUIPMENT_ID }) });

    expect(res.status).toBe(200);
    const body = await parseResponse<{
      data: { replacementForecast: { estimatedReplacementDate: string; isPastDue: boolean } };
    }>(res);
    expect(body.data.replacementForecast).toBeDefined();
    expect(body.data.replacementForecast.estimatedReplacementDate).toBeDefined();
  });

  it('marks replacement as past due when equipment exceeds expected lifespan', async () => {
    const installDate = new Date('2005-01-01');

    mockFindUnique.mockResolvedValue({
      id: EQUIPMENT_ID,
      propertyId: PROPERTY_ID,
      name: 'Ancient HVAC',
      category: 'HVAC',
      status: 'active',
      installDate,
      expectedLifespanYears: 10,
      warrantyExpiry: null,
      deletedAt: null,
      maintenanceRequests: [],
    });

    const req = createGetRequest(`/api/v1/equipment/${EQUIPMENT_ID}`, {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: EQUIPMENT_ID }) });

    const body = await parseResponse<{
      data: { replacementForecast: { isPastDue: boolean } };
    }>(res);
    expect(body.data.replacementForecast.isPastDue).toBe(true);
  });

  it('omits replacement forecast when lifespan or installDate is missing', async () => {
    mockFindUnique.mockResolvedValue({
      id: EQUIPMENT_ID,
      propertyId: PROPERTY_ID,
      name: 'Mystery Unit',
      category: 'other',
      status: 'active',
      installDate: null,
      expectedLifespanYears: null,
      warrantyExpiry: null,
      deletedAt: null,
      maintenanceRequests: [],
    });

    const req = createGetRequest(`/api/v1/equipment/${EQUIPMENT_ID}`, {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: EQUIPMENT_ID }) });

    const body = await parseResponse<{
      data: { replacementForecast: unknown };
    }>(res);
    expect(body.data.replacementForecast).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 7. List equipment with filtering by category, status, location
// ---------------------------------------------------------------------------

describe('GET /api/v1/equipment — Filtering', () => {
  it('REJECTS without propertyId', async () => {
    const req = createGetRequest('/api/v1/equipment');
    const res = await GET(req);
    expect(res.status).toBe(400);
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it('scopes to propertyId + soft-delete filter', async () => {
    const req = createGetRequest('/api/v1/equipment', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    await GET(req);

    const where = mockFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_ID);
    expect(where.deletedAt).toBeNull();
  });

  it('filters by category — property manager needs to see all HVAC units at once', async () => {
    const req = createGetRequest('/api/v1/equipment', {
      searchParams: { propertyId: PROPERTY_ID, category: 'HVAC' },
    });
    await GET(req);
    expect(mockFindMany.mock.calls[0]![0].where.category).toBe('HVAC');
  });

  it('filters by status — show only items needing repair', async () => {
    const req = createGetRequest('/api/v1/equipment', {
      searchParams: { propertyId: PROPERTY_ID, status: 'needs_repair' },
    });
    await GET(req);
    expect(mockFindMany.mock.calls[0]![0].where.status).toBe('needs_repair');
  });

  it('filters by location — check all equipment on a specific floor', async () => {
    const req = createGetRequest('/api/v1/equipment', {
      searchParams: { propertyId: PROPERTY_ID, location: 'Rooftop' },
    });
    await GET(req);
    expect(mockFindMany.mock.calls[0]![0].where.location).toEqual({
      contains: 'Rooftop',
      mode: 'insensitive',
    });
  });

  it('supports search by name or serial number', async () => {
    const req = createGetRequest('/api/v1/equipment', {
      searchParams: { propertyId: PROPERTY_ID, search: 'boiler' },
    });
    await GET(req);

    const where = mockFindMany.mock.calls[0]![0].where;
    expect(where.OR).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: { contains: 'boiler', mode: 'insensitive' } }),
        expect.objectContaining({ serialNumber: { contains: 'boiler', mode: 'insensitive' } }),
        expect.objectContaining({ assetTag: { contains: 'boiler', mode: 'insensitive' } }),
      ]),
    );
  });

  it('returns paginated results with meta', async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(42);

    const req = createGetRequest('/api/v1/equipment', {
      searchParams: { propertyId: PROPERTY_ID, page: '2', pageSize: '10' },
    });
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await parseResponse<{ meta: { total: number; page: number } }>(res);
    expect(body.meta.total).toBe(42);
    expect(body.meta.page).toBe(2);
  });

  it('orders by name ASC by default', async () => {
    const req = createGetRequest('/api/v1/equipment', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    await GET(req);
    expect(mockFindMany.mock.calls[0]![0].orderBy).toEqual({ name: 'asc' });
  });
});

// ---------------------------------------------------------------------------
// 8. Cost tracking: purchase price, maintenance costs, total cost of ownership
// ---------------------------------------------------------------------------

describe('Cost Tracking', () => {
  it('stores purchase price on creation', async () => {
    mockCreate.mockResolvedValue({
      id: EQUIPMENT_ID,
      name: 'Fire Panel',
      purchasePrice: 25000,
      propertyId: PROPERTY_ID,
      status: 'active',
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/equipment', {
      propertyId: PROPERTY_ID,
      name: 'Fire Panel',
      category: 'fire_safety',
      purchasePrice: 25000,
    });
    await POST(req);

    const createData = mockCreate.mock.calls[0]![0].data;
    expect(createData.purchasePrice).toBe(25000);
  });

  it('GET single equipment includes cost summary with total cost of ownership', async () => {
    mockFindUnique.mockResolvedValue({
      id: EQUIPMENT_ID,
      propertyId: PROPERTY_ID,
      name: 'Boiler',
      category: 'HVAC',
      status: 'active',
      purchasePrice: 15000,
      warrantyExpiry: null,
      installDate: null,
      expectedLifespanYears: null,
      deletedAt: null,
      maintenanceRequests: [
        { id: 'mr-1', status: 'completed' },
        { id: 'mr-2', status: 'completed' },
      ],
    });

    const { prisma } = await import('@/server/db');
    (prisma.maintenanceRequest.aggregate as ReturnType<typeof vi.fn>).mockResolvedValue({
      _sum: { cost: 3500 },
    });

    const req = createGetRequest(`/api/v1/equipment/${EQUIPMENT_ID}`, {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: EQUIPMENT_ID }) });

    expect(res.status).toBe(200);
    const body = await parseResponse<{
      data: {
        costSummary: {
          purchasePrice: number;
          maintenanceCost: number;
          totalCostOfOwnership: number;
        };
      };
    }>(res);
    expect(body.data.costSummary).toBeDefined();
    expect(body.data.costSummary.purchasePrice).toBe(15000);
  });
});

// ---------------------------------------------------------------------------
// 9. Inspection schedule linked to equipment
// ---------------------------------------------------------------------------

describe('Inspection Schedule', () => {
  it('stores nextInspectionDate on creation', async () => {
    mockCreate.mockResolvedValue({
      id: EQUIPMENT_ID,
      name: 'Fire Extinguisher',
      nextInspectionDate: new Date('2025-06-01'),
      propertyId: PROPERTY_ID,
      status: 'active',
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/equipment', {
      propertyId: PROPERTY_ID,
      name: 'Fire Extinguisher',
      category: 'fire_safety',
      nextInspectionDate: '2025-06-01',
    });
    await POST(req);

    const createData = mockCreate.mock.calls[0]![0].data;
    expect(createData.nextInspectionDate).toBeDefined();
  });

  it('updates nextInspectionDate via PATCH', async () => {
    mockFindUnique.mockResolvedValue({
      id: EQUIPMENT_ID,
      propertyId: PROPERTY_ID,
      name: 'Fire Extinguisher',
      status: 'active',
      deletedAt: null,
    });
    mockUpdate.mockResolvedValue({
      id: EQUIPMENT_ID,
      nextInspectionDate: new Date('2025-12-01'),
    });

    const req = createPatchRequest(`/api/v1/equipment/${EQUIPMENT_ID}`, {
      nextInspectionDate: '2025-12-01',
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: EQUIPMENT_ID }) });
    expect(res.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// 10. QR code / asset tag generation for physical labeling
// ---------------------------------------------------------------------------

describe('Asset Tag Generation', () => {
  it('auto-generates an asset tag on creation', async () => {
    mockCreate.mockResolvedValue({
      id: EQUIPMENT_ID,
      name: 'Water Heater',
      assetTag: 'EQ-A1B2',
      propertyId: PROPERTY_ID,
      status: 'active',
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/equipment', {
      propertyId: PROPERTY_ID,
      name: 'Water Heater',
      category: 'plumbing',
    });
    await POST(req);

    const createData = mockCreate.mock.calls[0]![0].data;
    expect(createData.assetTag).toMatch(/^EQ-[A-Z0-9]+$/);
  });

  it('asset tag is searchable in equipment list', async () => {
    const req = createGetRequest('/api/v1/equipment', {
      searchParams: { propertyId: PROPERTY_ID, search: 'EQ-A1B2' },
    });
    await GET(req);

    const where = mockFindMany.mock.calls[0]![0].where;
    expect(where.OR).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ assetTag: { contains: 'EQ-A1B2', mode: 'insensitive' } }),
      ]),
    );
  });
});

// ---------------------------------------------------------------------------
// 11. Bulk import equipment from CSV
// ---------------------------------------------------------------------------

describe('POST /api/v1/equipment — Bulk Import', () => {
  it('accepts an array of equipment items for bulk import', async () => {
    mockCreate
      .mockResolvedValueOnce({
        id: 'eq-1',
        name: 'HVAC Unit 1',
        category: 'HVAC',
        status: 'active',
        assetTag: 'EQ-0001',
      })
      .mockResolvedValueOnce({
        id: 'eq-2',
        name: 'Fire Panel A',
        category: 'fire_safety',
        status: 'active',
        assetTag: 'EQ-0002',
      });

    const req = createPostRequest('/api/v1/equipment', {
      propertyId: PROPERTY_ID,
      bulk: true,
      items: [
        { name: 'HVAC Unit 1', category: 'HVAC', serialNumber: 'SN-001', location: 'Floor 1' },
        {
          name: 'Fire Panel A',
          category: 'fire_safety',
          serialNumber: 'SN-002',
          location: 'Lobby',
        },
      ],
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
    const body = await parseResponse<{ data: unknown[]; message: string }>(res);
    expect(body.data).toHaveLength(2);
    expect(body.message).toContain('2');
  });

  it('rejects bulk import with invalid items and returns per-row errors', async () => {
    const req = createPostRequest('/api/v1/equipment', {
      propertyId: PROPERTY_ID,
      bulk: true,
      items: [
        { name: 'Good Item', category: 'HVAC' },
        { name: '', category: 'invalid_category' }, // bad row
      ],
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string; rowErrors: unknown[] }>(res);
    expect(body.error).toBe('BULK_VALIDATION_ERROR');
    expect(body.rowErrors).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// 12. Equipment aging report: items past expected lifespan
// ---------------------------------------------------------------------------

describe('GET /api/v1/equipment — Aging Report', () => {
  it('filters for equipment past expected lifespan when aging=true', async () => {
    const oldInstallDate = new Date('2005-01-01');
    mockFindMany.mockResolvedValue([
      {
        id: 'eq-1',
        name: 'Old Boiler',
        category: 'HVAC',
        installDate: oldInstallDate,
        expectedLifespanYears: 10,
        status: 'active',
      },
    ]);
    mockCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/equipment', {
      searchParams: { propertyId: PROPERTY_ID, aging: 'true' },
    });
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: unknown[] }>(res);
    expect(body.data).toHaveLength(1);

    // The aging filter queries for items where installDate + expectedLifespanYears < now
    const where = mockFindMany.mock.calls[0]![0].where;
    expect(where.installDate).toBeDefined();
    expect(where.expectedLifespanYears).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// GET /api/v1/equipment/:id — Detail View
// ---------------------------------------------------------------------------

describe('GET /api/v1/equipment/:id', () => {
  it('returns 404 when equipment does not exist', async () => {
    mockFindUnique.mockResolvedValue(null);

    const req = createGetRequest(`/api/v1/equipment/${EQUIPMENT_ID}`, {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: EQUIPMENT_ID }) });
    expect(res.status).toBe(404);
  });

  it('returns equipment with enriched data', async () => {
    mockFindUnique.mockResolvedValue({
      id: EQUIPMENT_ID,
      propertyId: PROPERTY_ID,
      name: 'Elevator Motor',
      category: 'elevator',
      status: 'active',
      warrantyExpiry: new Date('2030-01-01'),
      installDate: new Date('2020-01-01'),
      expectedLifespanYears: 20,
      purchasePrice: 50000,
      deletedAt: null,
      maintenanceRequests: [],
    });

    const { prisma } = await import('@/server/db');
    (prisma.maintenanceRequest.aggregate as ReturnType<typeof vi.fn>).mockResolvedValue({
      _sum: { cost: 2000 },
    });

    const req = createGetRequest(`/api/v1/equipment/${EQUIPMENT_ID}`, {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: EQUIPMENT_ID }) });

    expect(res.status).toBe(200);
    const body = await parseResponse<{
      data: {
        warrantyStatus: string;
        replacementForecast: unknown;
        costSummary: unknown;
      };
    }>(res);
    expect(body.data.warrantyStatus).toBe('active');
    expect(body.data.replacementForecast).toBeDefined();
    expect(body.data.costSummary).toBeDefined();
  });
});
