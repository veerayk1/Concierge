/**
 * Equipment Lifecycle Tests — per CLAUDE.md Phase 2
 *
 * Equipment failure in a condo can range from inconvenient (broken gym
 * treadmill) to catastrophic (boiler explosion in January). Lifecycle
 * management with status transitions, warranty tracking, maintenance
 * history, and replacement forecasts prevents surprise failures and
 * gives property managers data to justify capital expenditures to boards.
 *
 * These tests cover:
 * - Status transitions (active -> needs_repair -> under_repair -> decommissioned)
 * - Invalid transitions (cannot reverse decommission)
 * - Service date tracking
 * - Warranty status calculation
 * - Maintenance history linkage
 * - Replacement forecast
 * - Cost tracking (purchase + maintenance = total cost of ownership)
 * - Equipment category validation
 * - Bulk status operations
 * - Search and filtering
 * - Manufacturer and model tracking
 * - Serial number handling
 * - Tenant isolation
 * - Edge cases and error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
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

const mockMrFindMany = vi.fn();
const mockMrCount = vi.fn();
const mockMrAggregate = vi.fn();

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
      findMany: (...args: unknown[]) => mockMrFindMany(...args),
      count: (...args: unknown[]) => mockMrCount(...args),
      aggregate: (...args: unknown[]) => mockMrAggregate(...args),
    },
  },
}));

vi.mock('nanoid', () => ({
  nanoid: vi.fn().mockReturnValue('X9Y8'),
}));

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: vi.fn().mockResolvedValue({
    user: {
      userId: 'pm-jones',
      propertyId: '00000000-0000-4000-b000-000000000001',
      role: 'property_manager',
      permissions: ['*'],
      mfaVerified: false,
    },
    error: null,
  }),
}));

vi.mock('@/lib/sanitize', () => ({
  stripHtml: (s: string) => s.replace(/<[^>]*>/g, ''),
  stripControlChars: (s: string) => s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''),
}));

// ---------------------------------------------------------------------------
// Import routes (after mocks)
// ---------------------------------------------------------------------------

import { GET, POST } from '../route';
import { GET as GET_BY_ID, PATCH } from '../[id]/route';
import { GET as GET_HISTORY } from '../[id]/history/route';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROP_ID = '00000000-0000-4000-b000-000000000001';
const OTHER_PROP_ID = '00000000-0000-4000-b000-000000000099';
const EQUIP_ID = '00000000-0000-4000-c000-000000000001';
const EQUIP_ID_2 = '00000000-0000-4000-c000-000000000002';
const EQUIP_ID_3 = '00000000-0000-4000-c000-000000000003';

beforeEach(() => {
  vi.clearAllMocks();
  mockFindMany.mockResolvedValue([]);
  mockCount.mockResolvedValue(0);
  mockMrFindMany.mockResolvedValue([]);
  mockMrCount.mockResolvedValue(0);
  mockMrAggregate.mockResolvedValue({ _sum: { cost: null } });
});

// ---------------------------------------------------------------------------
// Helper: create an equipment mock object
// ---------------------------------------------------------------------------

function makeEquipment(overrides: Record<string, unknown> = {}) {
  return {
    id: EQUIP_ID,
    propertyId: PROP_ID,
    name: 'HVAC Unit #1',
    category: 'HVAC',
    status: 'active',
    serialNumber: 'SN-001',
    manufacturer: 'Carrier',
    modelNumber: 'M-2024',
    location: 'Rooftop Level 12',
    installDate: new Date('2020-01-15'),
    purchaseDate: new Date('2019-12-01'),
    purchasePrice: 25000,
    warrantyExpiry: new Date('2030-01-15'),
    expectedLifespanYears: 20,
    nextInspectionDate: new Date('2026-06-01'),
    nextServiceDate: null,
    notes: null,
    assetTag: 'EQ-X9Y8',
    deletedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    maintenanceRequests: [],
    ...overrides,
  };
}

// ===========================================================================
// 1. Status transitions: active -> needs_repair -> under_repair -> active
// ===========================================================================

describe('PATCH — Valid status transitions', () => {
  it('transitions active -> needs_repair', async () => {
    mockFindUnique.mockResolvedValue(makeEquipment({ status: 'active' }));
    mockUpdate.mockResolvedValue(makeEquipment({ status: 'needs_repair' }));

    const req = createPatchRequest(`/api/v1/equipment/${EQUIP_ID}`, { status: 'needs_repair' });
    const res = await PATCH(req, { params: Promise.resolve({ id: EQUIP_ID }) });

    expect(res.status).toBe(200);
    expect(mockUpdate.mock.calls[0]![0].data.status).toBe('needs_repair');
  });

  it('transitions needs_repair -> under_repair', async () => {
    mockFindUnique.mockResolvedValue(makeEquipment({ status: 'needs_repair' }));
    mockUpdate.mockResolvedValue(makeEquipment({ status: 'under_repair' }));

    const req = createPatchRequest(`/api/v1/equipment/${EQUIP_ID}`, { status: 'under_repair' });
    const res = await PATCH(req, { params: Promise.resolve({ id: EQUIP_ID }) });

    expect(res.status).toBe(200);
  });

  it('transitions under_repair -> active (back to service)', async () => {
    mockFindUnique.mockResolvedValue(makeEquipment({ status: 'under_repair' }));
    mockUpdate.mockResolvedValue(makeEquipment({ status: 'active' }));

    const req = createPatchRequest(`/api/v1/equipment/${EQUIP_ID}`, { status: 'active' });
    const res = await PATCH(req, { params: Promise.resolve({ id: EQUIP_ID }) });

    expect(res.status).toBe(200);
  });

  it('transitions active -> decommissioned', async () => {
    mockFindUnique.mockResolvedValue(makeEquipment({ status: 'active' }));
    mockUpdate.mockResolvedValue(makeEquipment({ status: 'decommissioned' }));

    const req = createPatchRequest(`/api/v1/equipment/${EQUIP_ID}`, { status: 'decommissioned' });
    const res = await PATCH(req, { params: Promise.resolve({ id: EQUIP_ID }) });

    expect(res.status).toBe(200);
  });

  it('transitions needs_repair -> decommissioned', async () => {
    mockFindUnique.mockResolvedValue(makeEquipment({ status: 'needs_repair' }));
    mockUpdate.mockResolvedValue(makeEquipment({ status: 'decommissioned' }));

    const req = createPatchRequest(`/api/v1/equipment/${EQUIP_ID}`, { status: 'decommissioned' });
    const res = await PATCH(req, { params: Promise.resolve({ id: EQUIP_ID }) });

    expect(res.status).toBe(200);
  });

  it('transitions under_repair -> decommissioned', async () => {
    mockFindUnique.mockResolvedValue(makeEquipment({ status: 'under_repair' }));
    mockUpdate.mockResolvedValue(makeEquipment({ status: 'decommissioned' }));

    const req = createPatchRequest(`/api/v1/equipment/${EQUIP_ID}`, { status: 'decommissioned' });
    const res = await PATCH(req, { params: Promise.resolve({ id: EQUIP_ID }) });

    expect(res.status).toBe(200);
  });
});

// ===========================================================================
// 2. Invalid transitions (cannot go back from decommissioned)
// ===========================================================================

describe('PATCH — Invalid status transitions', () => {
  it('rejects decommissioned -> active', async () => {
    mockFindUnique.mockResolvedValue(makeEquipment({ status: 'decommissioned' }));

    const req = createPatchRequest(`/api/v1/equipment/${EQUIP_ID}`, { status: 'active' });
    const res = await PATCH(req, { params: Promise.resolve({ id: EQUIP_ID }) });

    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string; message: string }>(res);
    expect(body.error).toBe('INVALID_STATUS_TRANSITION');
    expect(body.message).toContain('decommissioned');
  });

  it('rejects decommissioned -> needs_repair', async () => {
    mockFindUnique.mockResolvedValue(makeEquipment({ status: 'decommissioned' }));

    const req = createPatchRequest(`/api/v1/equipment/${EQUIP_ID}`, { status: 'needs_repair' });
    const res = await PATCH(req, { params: Promise.resolve({ id: EQUIP_ID }) });

    expect(res.status).toBe(400);
  });

  it('rejects decommissioned -> under_repair', async () => {
    mockFindUnique.mockResolvedValue(makeEquipment({ status: 'decommissioned' }));

    const req = createPatchRequest(`/api/v1/equipment/${EQUIP_ID}`, { status: 'under_repair' });
    const res = await PATCH(req, { params: Promise.resolve({ id: EQUIP_ID }) });

    expect(res.status).toBe(400);
  });

  it('rejects active -> under_repair (must go through needs_repair first)', async () => {
    mockFindUnique.mockResolvedValue(makeEquipment({ status: 'active' }));

    const req = createPatchRequest(`/api/v1/equipment/${EQUIP_ID}`, { status: 'under_repair' });
    const res = await PATCH(req, { params: Promise.resolve({ id: EQUIP_ID }) });

    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string; message: string }>(res);
    expect(body.error).toBe('INVALID_STATUS_TRANSITION');
    expect(body.message).toContain('Allowed');
  });

  it('rejects needs_repair -> active (must go through under_repair)', async () => {
    mockFindUnique.mockResolvedValue(makeEquipment({ status: 'needs_repair' }));

    const req = createPatchRequest(`/api/v1/equipment/${EQUIP_ID}`, { status: 'active' });
    const res = await PATCH(req, { params: Promise.resolve({ id: EQUIP_ID }) });

    expect(res.status).toBe(400);
  });

  it('allows same-status update without error (no transition)', async () => {
    mockFindUnique.mockResolvedValue(makeEquipment({ status: 'active' }));
    mockUpdate.mockResolvedValue(makeEquipment({ status: 'active', notes: 'Updated notes' }));

    const req = createPatchRequest(`/api/v1/equipment/${EQUIP_ID}`, {
      notes: 'Updated notes',
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: EQUIP_ID }) });

    expect(res.status).toBe(200);
  });
});

// ===========================================================================
// 3. Service date tracking
// ===========================================================================

describe('PATCH — Service date tracking', () => {
  it('updates nextServiceDate', async () => {
    mockFindUnique.mockResolvedValue(makeEquipment());
    mockUpdate.mockResolvedValue(makeEquipment({ nextServiceDate: new Date('2026-12-01') }));

    const req = createPatchRequest(`/api/v1/equipment/${EQUIP_ID}`, {
      nextServiceDate: '2026-12-01',
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: EQUIP_ID }) });

    expect(res.status).toBe(200);
    const updateCall = mockUpdate.mock.calls[0]![0];
    expect(updateCall.data.nextServiceDate).toBeInstanceOf(Date);
  });

  it('updates nextInspectionDate', async () => {
    mockFindUnique.mockResolvedValue(makeEquipment());
    mockUpdate.mockResolvedValue(makeEquipment({ nextInspectionDate: new Date('2026-09-15') }));

    const req = createPatchRequest(`/api/v1/equipment/${EQUIP_ID}`, {
      nextInspectionDate: '2026-09-15',
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: EQUIP_ID }) });

    expect(res.status).toBe(200);
    const updateCall = mockUpdate.mock.calls[0]![0];
    expect(updateCall.data.nextInspectionDate).toBeInstanceOf(Date);
  });

  it('rejects invalid nextServiceDate format', async () => {
    mockFindUnique.mockResolvedValue(makeEquipment({ nextServiceDate: new Date('2026-06-01') }));

    const req = createPatchRequest(`/api/v1/equipment/${EQUIP_ID}`, {
      nextServiceDate: 'not-a-date',
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: EQUIP_ID }) });

    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });
});

// ===========================================================================
// 4. Warranty status calculation
// ===========================================================================

describe('GET /api/v1/equipment/:id — Warranty status calculation', () => {
  it('returns warrantyStatus=active when expiry is in the future', async () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 3);

    mockFindUnique.mockResolvedValue(makeEquipment({ warrantyExpiry: futureDate }));
    mockMrAggregate.mockResolvedValue({ _sum: { cost: null } });

    const req = createGetRequest(`/api/v1/equipment/${EQUIP_ID}`);
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: EQUIP_ID }) });

    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: { warrantyStatus: string } }>(res);
    expect(body.data.warrantyStatus).toBe('active');
  });

  it('returns warrantyStatus=expired when expiry is in the past', async () => {
    mockFindUnique.mockResolvedValue(makeEquipment({ warrantyExpiry: new Date('2020-01-01') }));
    mockMrAggregate.mockResolvedValue({ _sum: { cost: null } });

    const req = createGetRequest(`/api/v1/equipment/${EQUIP_ID}`);
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: EQUIP_ID }) });

    const body = await parseResponse<{ data: { warrantyStatus: string } }>(res);
    expect(body.data.warrantyStatus).toBe('expired');
  });

  it('returns warrantyStatus=unknown when no expiry date', async () => {
    mockFindUnique.mockResolvedValue(makeEquipment({ warrantyExpiry: null }));
    mockMrAggregate.mockResolvedValue({ _sum: { cost: null } });

    const req = createGetRequest(`/api/v1/equipment/${EQUIP_ID}`);
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: EQUIP_ID }) });

    const body = await parseResponse<{ data: { warrantyStatus: string } }>(res);
    expect(body.data.warrantyStatus).toBe('unknown');
  });
});

// ===========================================================================
// 5. Maintenance history for equipment
// ===========================================================================

describe('GET /api/v1/equipment/:id/history — Maintenance history', () => {
  it('returns maintenance requests linked to equipment', async () => {
    mockFindUnique.mockResolvedValue(makeEquipment());
    mockMrFindMany.mockResolvedValue([
      {
        id: 'mr-1',
        referenceNumber: 'MR-0001',
        description: 'Annual HVAC filter replacement',
        status: 'completed',
        priority: 'medium',
        createdAt: new Date('2025-06-15'),
        completedDate: new Date('2025-06-16'),
      },
      {
        id: 'mr-2',
        referenceNumber: 'MR-0002',
        description: 'Compressor noise investigation',
        status: 'open',
        priority: 'high',
        createdAt: new Date('2026-03-01'),
        completedDate: null,
      },
    ]);

    const req = createGetRequest(`/api/v1/equipment/${EQUIP_ID}/history`, {
      searchParams: { propertyId: PROP_ID },
    });
    const res = await GET_HISTORY(req, { params: Promise.resolve({ id: EQUIP_ID }) });

    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: Array<{ referenceNumber: string }> }>(res);
    expect(body.data).toHaveLength(2);
    expect(body.data[0]!.referenceNumber).toBe('MR-0001');
  });

  it('returns empty array when no maintenance history exists', async () => {
    mockFindUnique.mockResolvedValue(makeEquipment());
    mockMrFindMany.mockResolvedValue([]);

    const req = createGetRequest(`/api/v1/equipment/${EQUIP_ID}/history`, {
      searchParams: { propertyId: PROP_ID },
    });
    const res = await GET_HISTORY(req, { params: Promise.resolve({ id: EQUIP_ID }) });

    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: unknown[] }>(res);
    expect(body.data).toHaveLength(0);
  });

  it('returns 404 for non-existent equipment', async () => {
    mockFindUnique.mockResolvedValue(null);

    const req = createGetRequest(`/api/v1/equipment/${EQUIP_ID}/history`, {
      searchParams: { propertyId: PROP_ID },
    });
    const res = await GET_HISTORY(req, { params: Promise.resolve({ id: EQUIP_ID }) });

    expect(res.status).toBe(404);
  });

  it('requires propertyId for history endpoint', async () => {
    const req = createGetRequest(`/api/v1/equipment/${EQUIP_ID}/history`);
    const res = await GET_HISTORY(req, { params: Promise.resolve({ id: EQUIP_ID }) });

    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_PROPERTY');
  });

  it('scopes maintenance history to propertyId', async () => {
    mockFindUnique.mockResolvedValue(makeEquipment());
    mockMrFindMany.mockResolvedValue([]);

    const req = createGetRequest(`/api/v1/equipment/${EQUIP_ID}/history`, {
      searchParams: { propertyId: PROP_ID },
    });
    await GET_HISTORY(req, { params: Promise.resolve({ id: EQUIP_ID }) });

    const where = mockMrFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROP_ID);
    expect(where.equipmentId).toBe(EQUIP_ID);
  });

  it('orders history by createdAt descending', async () => {
    mockFindUnique.mockResolvedValue(makeEquipment());
    mockMrFindMany.mockResolvedValue([]);

    const req = createGetRequest(`/api/v1/equipment/${EQUIP_ID}/history`, {
      searchParams: { propertyId: PROP_ID },
    });
    await GET_HISTORY(req, { params: Promise.resolve({ id: EQUIP_ID }) });

    const orderBy = mockMrFindMany.mock.calls[0]![0].orderBy;
    expect(orderBy).toEqual({ createdAt: 'desc' });
  });
});

// ===========================================================================
// 6. Equipment linked to maintenance requests (GET detail)
// ===========================================================================

describe('GET /api/v1/equipment/:id — Linked maintenance requests', () => {
  it('includes maintenance requests in detail response', async () => {
    mockFindUnique.mockResolvedValue(
      makeEquipment({
        maintenanceRequests: [
          { id: 'mr-1', status: 'completed' },
          { id: 'mr-2', status: 'open' },
        ],
      }),
    );
    mockMrAggregate.mockResolvedValue({ _sum: { cost: 5000 } });

    const req = createGetRequest(`/api/v1/equipment/${EQUIP_ID}`);
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: EQUIP_ID }) });

    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: { maintenanceRequests: unknown[] } }>(res);
    expect(body.data.maintenanceRequests).toHaveLength(2);
  });
});

// ===========================================================================
// 7. Replacement forecast
// ===========================================================================

describe('GET — Replacement forecast', () => {
  it('calculates replacement date from installDate + expectedLifespan', async () => {
    mockFindUnique.mockResolvedValue(
      makeEquipment({
        installDate: new Date('2015-06-01'),
        expectedLifespanYears: 15,
      }),
    );
    mockMrAggregate.mockResolvedValue({ _sum: { cost: null } });

    const req = createGetRequest(`/api/v1/equipment/${EQUIP_ID}`);
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: EQUIP_ID }) });

    const body = await parseResponse<{
      data: { replacementForecast: { estimatedReplacementDate: string; isPastDue: boolean } };
    }>(res);
    expect(body.data.replacementForecast).not.toBeNull();
    expect(body.data.replacementForecast.estimatedReplacementDate).toContain('2030');
  });

  it('marks isPastDue=true when equipment exceeds expected lifespan', async () => {
    mockFindUnique.mockResolvedValue(
      makeEquipment({
        installDate: new Date('2000-01-01'),
        expectedLifespanYears: 10,
      }),
    );
    mockMrAggregate.mockResolvedValue({ _sum: { cost: null } });

    const req = createGetRequest(`/api/v1/equipment/${EQUIP_ID}`);
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: EQUIP_ID }) });

    const body = await parseResponse<{
      data: { replacementForecast: { isPastDue: boolean } };
    }>(res);
    expect(body.data.replacementForecast.isPastDue).toBe(true);
  });

  it('marks isPastDue=false when equipment is within lifespan', async () => {
    const recentInstall = new Date();
    recentInstall.setFullYear(recentInstall.getFullYear() - 2);

    mockFindUnique.mockResolvedValue(
      makeEquipment({
        installDate: recentInstall,
        expectedLifespanYears: 20,
      }),
    );
    mockMrAggregate.mockResolvedValue({ _sum: { cost: null } });

    const req = createGetRequest(`/api/v1/equipment/${EQUIP_ID}`);
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: EQUIP_ID }) });

    const body = await parseResponse<{
      data: { replacementForecast: { isPastDue: boolean } };
    }>(res);
    expect(body.data.replacementForecast.isPastDue).toBe(false);
  });

  it('returns null forecast when installDate is missing', async () => {
    mockFindUnique.mockResolvedValue(
      makeEquipment({
        installDate: null,
        expectedLifespanYears: 15,
      }),
    );
    mockMrAggregate.mockResolvedValue({ _sum: { cost: null } });

    const req = createGetRequest(`/api/v1/equipment/${EQUIP_ID}`);
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: EQUIP_ID }) });

    const body = await parseResponse<{ data: { replacementForecast: unknown } }>(res);
    expect(body.data.replacementForecast).toBeNull();
  });

  it('returns null forecast when expectedLifespanYears is missing', async () => {
    mockFindUnique.mockResolvedValue(
      makeEquipment({
        installDate: new Date('2020-01-01'),
        expectedLifespanYears: null,
      }),
    );
    mockMrAggregate.mockResolvedValue({ _sum: { cost: null } });

    const req = createGetRequest(`/api/v1/equipment/${EQUIP_ID}`);
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: EQUIP_ID }) });

    const body = await parseResponse<{ data: { replacementForecast: unknown } }>(res);
    expect(body.data.replacementForecast).toBeNull();
  });
});

// ===========================================================================
// 8. Equipment cost tracking
// ===========================================================================

describe('GET — Cost tracking', () => {
  it('returns cost summary with purchase price and maintenance cost', async () => {
    mockFindUnique.mockResolvedValue(makeEquipment({ purchasePrice: 30000 }));
    mockMrAggregate.mockResolvedValue({ _sum: { cost: 5000 } });

    const req = createGetRequest(`/api/v1/equipment/${EQUIP_ID}`);
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: EQUIP_ID }) });

    const body = await parseResponse<{
      data: {
        costSummary: {
          purchasePrice: number;
          maintenanceCost: number;
          totalCostOfOwnership: number;
        };
      };
    }>(res);
    expect(body.data.costSummary.purchasePrice).toBe(30000);
    expect(body.data.costSummary.maintenanceCost).toBe(5000);
    expect(body.data.costSummary.totalCostOfOwnership).toBe(35000);
  });

  it('handles zero maintenance cost', async () => {
    mockFindUnique.mockResolvedValue(makeEquipment({ purchasePrice: 10000 }));
    mockMrAggregate.mockResolvedValue({ _sum: { cost: null } });

    const req = createGetRequest(`/api/v1/equipment/${EQUIP_ID}`);
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: EQUIP_ID }) });

    const body = await parseResponse<{
      data: { costSummary: { maintenanceCost: number; totalCostOfOwnership: number } };
    }>(res);
    expect(body.data.costSummary.maintenanceCost).toBe(0);
    expect(body.data.costSummary.totalCostOfOwnership).toBe(10000);
  });

  it('handles null purchase price', async () => {
    mockFindUnique.mockResolvedValue(makeEquipment({ purchasePrice: null }));
    mockMrAggregate.mockResolvedValue({ _sum: { cost: 2000 } });

    const req = createGetRequest(`/api/v1/equipment/${EQUIP_ID}`);
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: EQUIP_ID }) });

    const body = await parseResponse<{
      data: { costSummary: { purchasePrice: number; totalCostOfOwnership: number } };
    }>(res);
    expect(body.data.costSummary.purchasePrice).toBe(0);
    expect(body.data.costSummary.totalCostOfOwnership).toBe(2000);
  });
});

// ===========================================================================
// 9. Equipment category validation
// ===========================================================================

describe('POST — Equipment category validation', () => {
  const validCategories = ['HVAC', 'plumbing', 'electrical', 'fire_safety', 'elevator', 'other'];

  it.each(validCategories)('accepts category: %s', async (category) => {
    mockCreate.mockResolvedValue({
      id: EQUIP_ID,
      name: `${category} unit`,
      category,
      status: 'active',
      propertyId: PROP_ID,
      assetTag: 'EQ-X9Y8',
    });

    const req = createPostRequest('/api/v1/equipment', {
      propertyId: PROP_ID,
      name: `${category} unit`,
      category,
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('rejects invalid category', async () => {
    const req = createPostRequest('/api/v1/equipment', {
      propertyId: PROP_ID,
      name: 'Invalid Category Equipment',
      category: 'teleportation',
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('defaults to "other" when category not specified', async () => {
    mockCreate.mockResolvedValue({
      id: EQUIP_ID,
      name: 'No Category',
      category: 'other',
      status: 'active',
      propertyId: PROP_ID,
      assetTag: 'EQ-X9Y8',
    });

    const req = createPostRequest('/api/v1/equipment', {
      propertyId: PROP_ID,
      name: 'No Category',
    });
    await POST(req);

    const createData = mockCreate.mock.calls[0]![0].data;
    expect(createData.category).toBe('other');
  });
});

// ===========================================================================
// 10. Equipment search and filtering
// ===========================================================================

describe('GET /api/v1/equipment — Search and filtering', () => {
  it('requires propertyId for listing', async () => {
    const req = createGetRequest('/api/v1/equipment');
    const res = await GET(req);

    expect(res.status).toBe(400);
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it('scopes to propertyId and excludes soft-deleted', async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/equipment', {
      searchParams: { propertyId: PROP_ID },
    });
    await GET(req);

    const where = mockFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROP_ID);
    expect(where.deletedAt).toBeNull();
  });

  it('filters by category', async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/equipment', {
      searchParams: { propertyId: PROP_ID, category: 'elevator' },
    });
    await GET(req);

    expect(mockFindMany.mock.calls[0]![0].where.category).toBe('elevator');
  });

  it('filters by status', async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/equipment', {
      searchParams: { propertyId: PROP_ID, status: 'needs_repair' },
    });
    await GET(req);

    expect(mockFindMany.mock.calls[0]![0].where.status).toBe('needs_repair');
  });

  it('filters by location (case-insensitive contains)', async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/equipment', {
      searchParams: { propertyId: PROP_ID, location: 'Basement' },
    });
    await GET(req);

    expect(mockFindMany.mock.calls[0]![0].where.location).toEqual({
      contains: 'Basement',
      mode: 'insensitive',
    });
  });

  it('searches by name, serialNumber, or assetTag', async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/equipment', {
      searchParams: { propertyId: PROP_ID, search: 'HVAC' },
    });
    await GET(req);

    const where = mockFindMany.mock.calls[0]![0].where;
    expect(where.OR).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: { contains: 'HVAC', mode: 'insensitive' } }),
        expect.objectContaining({ serialNumber: { contains: 'HVAC', mode: 'insensitive' } }),
        expect.objectContaining({ assetTag: { contains: 'HVAC', mode: 'insensitive' } }),
      ]),
    );
  });

  it('returns paginated results', async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(75);

    const req = createGetRequest('/api/v1/equipment', {
      searchParams: { propertyId: PROP_ID, page: '3', pageSize: '10' },
    });
    const res = await GET(req);

    const body = await parseResponse<{
      meta: { page: number; pageSize: number; total: number; totalPages: number };
    }>(res);
    expect(body.meta.page).toBe(3);
    expect(body.meta.pageSize).toBe(10);
    expect(body.meta.total).toBe(75);
    expect(body.meta.totalPages).toBe(8);
  });

  it('orders by name ascending by default', async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/equipment', {
      searchParams: { propertyId: PROP_ID },
    });
    await GET(req);

    expect(mockFindMany.mock.calls[0]![0].orderBy).toEqual({ name: 'asc' });
  });
});

// ===========================================================================
// 11. Manufacturer and model tracking
// ===========================================================================

describe('POST/PATCH — Manufacturer and model tracking', () => {
  it('stores manufacturer and modelNumber on creation', async () => {
    mockCreate.mockResolvedValue({
      id: EQUIP_ID,
      name: 'Elevator Motor',
      manufacturer: 'Otis',
      modelNumber: 'GEN-3',
      status: 'active',
      propertyId: PROP_ID,
      assetTag: 'EQ-X9Y8',
    });

    const req = createPostRequest('/api/v1/equipment', {
      propertyId: PROP_ID,
      name: 'Elevator Motor',
      category: 'elevator',
      manufacturer: 'Otis',
      modelNumber: 'GEN-3',
    });
    await POST(req);

    const createData = mockCreate.mock.calls[0]![0].data;
    expect(createData.manufacturer).toBe('Otis');
    expect(createData.modelNumber).toBe('GEN-3');
  });

  it('updates manufacturer via PATCH', async () => {
    mockFindUnique.mockResolvedValue(makeEquipment());
    mockUpdate.mockResolvedValue(makeEquipment({ manufacturer: 'Trane' }));

    const req = createPatchRequest(`/api/v1/equipment/${EQUIP_ID}`, {
      manufacturer: 'Trane',
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: EQUIP_ID }) });

    expect(res.status).toBe(200);
    expect(mockUpdate.mock.calls[0]![0].data.manufacturer).toBe('Trane');
  });

  it('updates modelNumber via PATCH', async () => {
    mockFindUnique.mockResolvedValue(makeEquipment());
    mockUpdate.mockResolvedValue(makeEquipment({ modelNumber: 'XR-500' }));

    const req = createPatchRequest(`/api/v1/equipment/${EQUIP_ID}`, {
      modelNumber: 'XR-500',
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: EQUIP_ID }) });

    expect(res.status).toBe(200);
    expect(mockUpdate.mock.calls[0]![0].data.modelNumber).toBe('XR-500');
  });

  it('clears manufacturer when set to empty string', async () => {
    mockFindUnique.mockResolvedValue(makeEquipment({ manufacturer: 'OldBrand' }));
    mockUpdate.mockResolvedValue(makeEquipment({ manufacturer: null }));

    const req = createPatchRequest(`/api/v1/equipment/${EQUIP_ID}`, {
      manufacturer: '',
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: EQUIP_ID }) });

    expect(res.status).toBe(200);
    expect(mockUpdate.mock.calls[0]![0].data.manufacturer).toBeNull();
  });
});

// ===========================================================================
// 12. Serial number handling
// ===========================================================================

describe('POST/PATCH — Serial number handling', () => {
  it('stores serialNumber on creation', async () => {
    mockCreate.mockResolvedValue({
      id: EQUIP_ID,
      name: 'Fire Pump',
      serialNumber: 'FP-2024-001',
      status: 'active',
      propertyId: PROP_ID,
      assetTag: 'EQ-X9Y8',
    });

    const req = createPostRequest('/api/v1/equipment', {
      propertyId: PROP_ID,
      name: 'Fire Pump',
      category: 'fire_safety',
      serialNumber: 'FP-2024-001',
    });
    await POST(req);

    const createData = mockCreate.mock.calls[0]![0].data;
    expect(createData.serialNumber).toBe('FP-2024-001');
  });

  it('updates serialNumber via PATCH', async () => {
    mockFindUnique.mockResolvedValue(makeEquipment());
    mockUpdate.mockResolvedValue(makeEquipment({ serialNumber: 'SN-NEW-001' }));

    const req = createPatchRequest(`/api/v1/equipment/${EQUIP_ID}`, {
      serialNumber: 'SN-NEW-001',
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: EQUIP_ID }) });

    expect(res.status).toBe(200);
    expect(mockUpdate.mock.calls[0]![0].data.serialNumber).toBe('SN-NEW-001');
  });

  it('allows null serialNumber (not all equipment has one)', async () => {
    mockCreate.mockResolvedValue({
      id: EQUIP_ID,
      name: 'Generic Fan',
      serialNumber: null,
      status: 'active',
      propertyId: PROP_ID,
      assetTag: 'EQ-X9Y8',
    });

    const req = createPostRequest('/api/v1/equipment', {
      propertyId: PROP_ID,
      name: 'Generic Fan',
      category: 'HVAC',
    });
    await POST(req);

    const createData = mockCreate.mock.calls[0]![0].data;
    expect(createData.serialNumber).toBeNull();
  });
});

// ===========================================================================
// 13. Tenant isolation
// ===========================================================================

describe('Tenant isolation', () => {
  it('listing requires propertyId', async () => {
    const req = createGetRequest('/api/v1/equipment');
    const res = await GET(req);

    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_PROPERTY');
  });

  it('listing scopes to propertyId', async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/equipment', {
      searchParams: { propertyId: PROP_ID },
    });
    await GET(req);

    expect(mockFindMany.mock.calls[0]![0].where.propertyId).toBe(PROP_ID);
  });

  it('creation requires propertyId', async () => {
    const req = createPostRequest('/api/v1/equipment', {
      name: 'No Property',
      category: 'HVAC',
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('history endpoint requires propertyId', async () => {
    const req = createGetRequest(`/api/v1/equipment/${EQUIP_ID}/history`);
    const res = await GET_HISTORY(req, { params: Promise.resolve({ id: EQUIP_ID }) });

    expect(res.status).toBe(400);
  });
});

// ===========================================================================
// 14. Equipment detail (GET by ID)
// ===========================================================================

describe('GET /api/v1/equipment/:id — Detail view', () => {
  it('returns 404 when equipment not found', async () => {
    mockFindUnique.mockResolvedValue(null);

    const req = createGetRequest(`/api/v1/equipment/${EQUIP_ID}`);
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: EQUIP_ID }) });

    expect(res.status).toBe(404);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('NOT_FOUND');
  });

  it('returns enriched data with warrantyStatus, replacementForecast, costSummary', async () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 5);

    mockFindUnique.mockResolvedValue(
      makeEquipment({
        warrantyExpiry: futureDate,
        installDate: new Date('2020-01-01'),
        expectedLifespanYears: 20,
        purchasePrice: 50000,
      }),
    );
    mockMrAggregate.mockResolvedValue({ _sum: { cost: 3000 } });

    const req = createGetRequest(`/api/v1/equipment/${EQUIP_ID}`);
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: EQUIP_ID }) });

    expect(res.status).toBe(200);
    const body = await parseResponse<{
      data: {
        warrantyStatus: string;
        replacementForecast: { estimatedReplacementDate: string; isPastDue: boolean };
        costSummary: {
          purchasePrice: number;
          maintenanceCost: number;
          totalCostOfOwnership: number;
        };
      };
    }>(res);

    expect(body.data.warrantyStatus).toBe('active');
    expect(body.data.replacementForecast).not.toBeNull();
    expect(body.data.replacementForecast.isPastDue).toBe(false);
    expect(body.data.costSummary.purchasePrice).toBe(50000);
    expect(body.data.costSummary.maintenanceCost).toBe(3000);
    expect(body.data.costSummary.totalCostOfOwnership).toBe(53000);
  });
});

// ===========================================================================
// 15. PATCH — Equipment not found
// ===========================================================================

describe('PATCH — Equipment not found', () => {
  it('returns 404 when updating non-existent equipment', async () => {
    mockFindUnique.mockResolvedValue(null);

    const req = createPatchRequest(`/api/v1/equipment/${EQUIP_ID}`, {
      status: 'needs_repair',
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: EQUIP_ID }) });

    expect(res.status).toBe(404);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('NOT_FOUND');
  });

  it('does not call update for non-existent equipment', async () => {
    mockFindUnique.mockResolvedValue(null);

    const req = createPatchRequest(`/api/v1/equipment/${EQUIP_ID}`, { name: 'Ghost' });
    await PATCH(req, { params: Promise.resolve({ id: EQUIP_ID }) });

    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// 16. Asset tag generation
// ===========================================================================

describe('POST — Asset tag generation', () => {
  it('auto-generates asset tag with EQ- prefix', async () => {
    mockCreate.mockResolvedValue({
      id: EQUIP_ID,
      name: 'Water Heater',
      assetTag: 'EQ-X9Y8',
      status: 'active',
      propertyId: PROP_ID,
    });

    const req = createPostRequest('/api/v1/equipment', {
      propertyId: PROP_ID,
      name: 'Water Heater',
      category: 'plumbing',
    });
    await POST(req);

    const createData = mockCreate.mock.calls[0]![0].data;
    expect(createData.assetTag).toMatch(/^EQ-[A-Z0-9]+$/);
  });
});

// ===========================================================================
// 17. Bulk import
// ===========================================================================

describe('POST — Bulk import', () => {
  it('creates multiple equipment items at once', async () => {
    mockCreate
      .mockResolvedValueOnce({ id: EQUIP_ID, name: 'Item 1', assetTag: 'EQ-0001' })
      .mockResolvedValueOnce({ id: EQUIP_ID_2, name: 'Item 2', assetTag: 'EQ-0002' });

    const req = createPostRequest('/api/v1/equipment', {
      propertyId: PROP_ID,
      bulk: true,
      items: [
        { name: 'Item 1', category: 'HVAC' },
        { name: 'Item 2', category: 'plumbing' },
      ],
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
    const body = await parseResponse<{ data: unknown[]; message: string }>(res);
    expect(body.data).toHaveLength(2);
    expect(body.message).toContain('2');
  });

  it('rejects bulk import with validation errors per row', async () => {
    const req = createPostRequest('/api/v1/equipment', {
      propertyId: PROP_ID,
      bulk: true,
      items: [
        { name: 'Valid', category: 'HVAC' },
        { name: '', category: 'bad_category' },
      ],
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string; rowErrors: unknown[] }>(res);
    expect(body.error).toBe('BULK_VALIDATION_ERROR');
    expect(body.rowErrors.length).toBeGreaterThan(0);
  });

  it('rejects bulk import without propertyId', async () => {
    const req = createPostRequest('/api/v1/equipment', {
      bulk: true,
      items: [{ name: 'No Property', category: 'HVAC' }],
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });
});

// ===========================================================================
// 18. XSS prevention
// ===========================================================================

describe('XSS prevention', () => {
  it('sanitizes name on creation', async () => {
    mockCreate.mockResolvedValue({
      id: EQUIP_ID,
      name: 'Clean Name',
      status: 'active',
      propertyId: PROP_ID,
      assetTag: 'EQ-X9Y8',
    });

    const req = createPostRequest('/api/v1/equipment', {
      propertyId: PROP_ID,
      name: '<img onerror=alert(1)>Clean Name',
      category: 'HVAC',
    });
    await POST(req);

    const createData = mockCreate.mock.calls[0]![0].data;
    expect(createData.name).not.toContain('<img');
    expect(createData.name).toContain('Clean Name');
  });

  it('sanitizes notes on update', async () => {
    mockFindUnique.mockResolvedValue(makeEquipment());
    mockUpdate.mockResolvedValue(makeEquipment());

    const req = createPatchRequest(`/api/v1/equipment/${EQUIP_ID}`, {
      notes: '<script>steal()</script>Safe note',
    });
    await PATCH(req, { params: Promise.resolve({ id: EQUIP_ID }) });

    const updateCall = mockUpdate.mock.calls[0]![0];
    expect(updateCall.data.notes).not.toContain('<script>');
    expect(updateCall.data.notes).toContain('Safe note');
  });
});

// ===========================================================================
// 19. Aging report
// ===========================================================================

describe('GET — Aging report filter', () => {
  it('filters for equipment past expected lifespan when aging=true', async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/equipment', {
      searchParams: { propertyId: PROP_ID, aging: 'true' },
    });
    await GET(req);

    const where = mockFindMany.mock.calls[0]![0].where;
    expect(where.installDate).toBeDefined();
    expect(where.expectedLifespanYears).toBeDefined();
  });
});

// ===========================================================================
// 20. Error handling
// ===========================================================================

describe('Error handling', () => {
  it('returns 500 on database error during creation', async () => {
    mockCreate.mockRejectedValue(new Error('Disk full'));

    const req = createPostRequest('/api/v1/equipment', {
      propertyId: PROP_ID,
      name: 'Error Equipment',
      category: 'HVAC',
    });
    const res = await POST(req);

    expect(res.status).toBe(500);
    const body = await parseResponse<{ error: string; message: string }>(res);
    expect(body.error).toBe('INTERNAL_ERROR');
    expect(body.message).not.toContain('Disk full');
  });

  it('returns 500 on database error during update', async () => {
    mockFindUnique.mockResolvedValue(makeEquipment());
    mockUpdate.mockRejectedValue(new Error('Constraint violation'));

    const req = createPatchRequest(`/api/v1/equipment/${EQUIP_ID}`, { name: 'New Name' });
    const res = await PATCH(req, { params: Promise.resolve({ id: EQUIP_ID }) });

    expect(res.status).toBe(500);
  });

  it('returns 500 on database error during listing', async () => {
    mockFindMany.mockRejectedValue(new Error('Timeout'));

    const req = createGetRequest('/api/v1/equipment', {
      searchParams: { propertyId: PROP_ID },
    });
    const res = await GET(req);

    expect(res.status).toBe(500);
  });

  it('returns 500 on database error during detail view', async () => {
    mockFindUnique.mockRejectedValue(new Error('Connection refused'));

    const req = createGetRequest(`/api/v1/equipment/${EQUIP_ID}`);
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: EQUIP_ID }) });

    expect(res.status).toBe(500);
  });

  it('returns 500 on database error during history view', async () => {
    mockFindUnique.mockResolvedValue(makeEquipment());
    mockMrFindMany.mockRejectedValue(new Error('Deadlock'));

    const req = createGetRequest(`/api/v1/equipment/${EQUIP_ID}/history`, {
      searchParams: { propertyId: PROP_ID },
    });
    const res = await GET_HISTORY(req, { params: Promise.resolve({ id: EQUIP_ID }) });

    expect(res.status).toBe(500);
  });
});

// ===========================================================================
// 21. PATCH — Update multiple fields at once
// ===========================================================================

describe('PATCH — Multi-field update', () => {
  it('updates name, location, and notes in a single request', async () => {
    mockFindUnique.mockResolvedValue(makeEquipment());
    mockUpdate.mockResolvedValue(
      makeEquipment({
        name: 'Renamed Equipment',
        location: 'New Location',
        notes: 'Updated notes',
      }),
    );

    const req = createPatchRequest(`/api/v1/equipment/${EQUIP_ID}`, {
      name: 'Renamed Equipment',
      location: 'New Location',
      notes: 'Updated notes',
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: EQUIP_ID }) });

    expect(res.status).toBe(200);
    const updateCall = mockUpdate.mock.calls[0]![0];
    expect(updateCall.data.name).toBe('Renamed Equipment');
    expect(updateCall.data.location).toBe('New Location');
    expect(updateCall.data.notes).toBe('Updated notes');
  });

  it('updates purchasePrice', async () => {
    mockFindUnique.mockResolvedValue(makeEquipment());
    mockUpdate.mockResolvedValue(makeEquipment({ purchasePrice: 45000 }));

    const req = createPatchRequest(`/api/v1/equipment/${EQUIP_ID}`, {
      purchasePrice: 45000,
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: EQUIP_ID }) });

    expect(res.status).toBe(200);
    expect(mockUpdate.mock.calls[0]![0].data.purchasePrice).toBe(45000);
  });

  it('updates warrantyExpiry', async () => {
    mockFindUnique.mockResolvedValue(makeEquipment());
    mockUpdate.mockResolvedValue(makeEquipment({ warrantyExpiry: new Date('2032-01-01') }));

    const req = createPatchRequest(`/api/v1/equipment/${EQUIP_ID}`, {
      warrantyExpiry: '2032-01-01',
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: EQUIP_ID }) });

    expect(res.status).toBe(200);
    expect(mockUpdate.mock.calls[0]![0].data.warrantyExpiry).toBeInstanceOf(Date);
  });

  it('updates expectedLifespanYears', async () => {
    mockFindUnique.mockResolvedValue(makeEquipment());
    mockUpdate.mockResolvedValue(makeEquipment({ expectedLifespanYears: 25 }));

    const req = createPatchRequest(`/api/v1/equipment/${EQUIP_ID}`, {
      expectedLifespanYears: 25,
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: EQUIP_ID }) });

    expect(res.status).toBe(200);
    expect(mockUpdate.mock.calls[0]![0].data.expectedLifespanYears).toBe(25);
  });
});
