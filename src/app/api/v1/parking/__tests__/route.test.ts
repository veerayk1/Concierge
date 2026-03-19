/**
 * Parking API Route Tests — per PRD 13 Parking Management
 *
 * Covers:
 * - GET /api/v1/parking (permits + violations)
 * - GET /api/v1/parking/areas (list areas)
 * - POST /api/v1/parking/areas (create area)
 * - PATCH /api/v1/parking/violations/:id (update violation status)
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

const mockPermitFindMany = vi.fn();
const mockViolationFindMany = vi.fn();
const mockViolationUpdate = vi.fn();
const mockAreaFindMany = vi.fn();
const mockAreaCreate = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    parkingPermit: {
      findMany: (...args: unknown[]) => mockPermitFindMany(...args),
    },
    parkingViolation: {
      findMany: (...args: unknown[]) => mockViolationFindMany(...args),
      update: (...args: unknown[]) => mockViolationUpdate(...args),
    },
    parkingArea: {
      findMany: (...args: unknown[]) => mockAreaFindMany(...args),
      create: (...args: unknown[]) => mockAreaCreate(...args),
    },
  },
}));

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: vi.fn().mockResolvedValue({
    user: {
      userId: 'test-staff',
      propertyId: '00000000-0000-4000-b000-000000000001',
      role: 'security',
      permissions: ['*'],
      mfaVerified: false,
    },
    error: null,
  }),
}));

import { GET } from '../route';
import { GET as GET_AREAS, POST as POST_AREA } from '../areas/route';
import { PATCH as PATCH_VIOLATION } from '../violations/[id]/route';

const PROPERTY_A = '00000000-0000-4000-b000-000000000001';

beforeEach(() => {
  vi.clearAllMocks();
  mockPermitFindMany.mockResolvedValue([]);
  mockViolationFindMany.mockResolvedValue([]);
  mockAreaFindMany.mockResolvedValue([]);
});

// ---------------------------------------------------------------------------
// GET /api/v1/parking — Tenant Isolation
// ---------------------------------------------------------------------------

describe('GET /api/v1/parking — Tenant Isolation', () => {
  it('rejects without propertyId', async () => {
    const req = createGetRequest('/api/v1/parking');
    const res = await GET(req);
    expect(res.status).toBe(400);
    expect(mockPermitFindMany).not.toHaveBeenCalled();
    expect(mockViolationFindMany).not.toHaveBeenCalled();
  });

  it('filters permits by propertyId and soft-delete', async () => {
    const req = createGetRequest('/api/v1/parking', { searchParams: { propertyId: PROPERTY_A } });
    await GET(req);

    const where = mockPermitFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_A);
    expect(where.deletedAt).toBeNull();
  });

  it('filters violations by propertyId and soft-delete', async () => {
    const req = createGetRequest('/api/v1/parking', {
      searchParams: { propertyId: PROPERTY_A, type: 'violations' },
    });
    await GET(req);

    const where = mockViolationFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_A);
    expect(where.deletedAt).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// GET /api/v1/parking — Permits
// ---------------------------------------------------------------------------

describe('GET /api/v1/parking — Permits', () => {
  it('defaults to permits when type is not specified', async () => {
    const req = createGetRequest('/api/v1/parking', { searchParams: { propertyId: PROPERTY_A } });
    await GET(req);
    expect(mockPermitFindMany).toHaveBeenCalled();
    expect(mockViolationFindMany).not.toHaveBeenCalled();
  });

  it('filters permits by status', async () => {
    const req = createGetRequest('/api/v1/parking', {
      searchParams: { propertyId: PROPERTY_A, status: 'active' },
    });
    await GET(req);
    expect(mockPermitFindMany.mock.calls[0]![0].where.status).toBe('active');
  });

  it('search covers referenceNumber and licensePlate', async () => {
    const req = createGetRequest('/api/v1/parking', {
      searchParams: { propertyId: PROPERTY_A, search: 'ABC123' },
    });
    await GET(req);

    const where = mockPermitFindMany.mock.calls[0]![0].where;
    expect(where.OR).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ referenceNumber: { contains: 'ABC123', mode: 'insensitive' } }),
        expect.objectContaining({ licensePlate: { contains: 'ABC123', mode: 'insensitive' } }),
      ]),
    );
  });

  it('includes unit and permitType relations', async () => {
    const req = createGetRequest('/api/v1/parking', { searchParams: { propertyId: PROPERTY_A } });
    await GET(req);

    const include = mockPermitFindMany.mock.calls[0]![0].include;
    expect(include.unit).toBeDefined();
    expect(include.permitType).toBeDefined();
  });

  it('orders permits by createdAt descending', async () => {
    const req = createGetRequest('/api/v1/parking', { searchParams: { propertyId: PROPERTY_A } });
    await GET(req);
    expect(mockPermitFindMany.mock.calls[0]![0].orderBy).toEqual({ createdAt: 'desc' });
  });

  it('returns empty array when no permits exist', async () => {
    const req = createGetRequest('/api/v1/parking', { searchParams: { propertyId: PROPERTY_A } });
    const res = await GET(req);
    const body = await parseResponse<{ data: unknown[] }>(res);
    expect(body.data).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// GET /api/v1/parking — Violations
// ---------------------------------------------------------------------------

describe('GET /api/v1/parking — Violations', () => {
  it('returns violations when type=violations', async () => {
    const req = createGetRequest('/api/v1/parking', {
      searchParams: { propertyId: PROPERTY_A, type: 'violations' },
    });
    await GET(req);
    expect(mockViolationFindMany).toHaveBeenCalled();
    expect(mockPermitFindMany).not.toHaveBeenCalled();
  });

  it('filters violations by status', async () => {
    const req = createGetRequest('/api/v1/parking', {
      searchParams: { propertyId: PROPERTY_A, type: 'violations', status: 'open' },
    });
    await GET(req);
    expect(mockViolationFindMany.mock.calls[0]![0].where.status).toBe('open');
  });

  it('search covers licensePlate and location', async () => {
    const req = createGetRequest('/api/v1/parking', {
      searchParams: { propertyId: PROPERTY_A, type: 'violations', search: 'P1' },
    });
    await GET(req);

    const where = mockViolationFindMany.mock.calls[0]![0].where;
    expect(where.OR).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ licensePlate: { contains: 'P1', mode: 'insensitive' } }),
        expect.objectContaining({ location: { contains: 'P1', mode: 'insensitive' } }),
      ]),
    );
  });

  it('orders violations by createdAt descending', async () => {
    const req = createGetRequest('/api/v1/parking', {
      searchParams: { propertyId: PROPERTY_A, type: 'violations' },
    });
    await GET(req);
    expect(mockViolationFindMany.mock.calls[0]![0].orderBy).toEqual({ createdAt: 'desc' });
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/v1/parking/violations/:id — Update Violation
// ---------------------------------------------------------------------------

describe('PATCH /api/v1/parking/violations/:id — Status Updates', () => {
  it('updates violation status to resolved with timestamp', async () => {
    mockViolationUpdate.mockResolvedValue({ id: 'v1', status: 'resolved' });

    const req = createPatchRequest('/api/v1/parking/violations/v1', { status: 'resolved' });
    const res = await PATCH_VIOLATION(req, { params: Promise.resolve({ id: 'v1' }) });
    expect(res.status).toBe(200);

    const updateData = mockViolationUpdate.mock.calls[0]![0].data;
    expect(updateData.status).toBe('resolved');
    expect(updateData.resolvedAt).toBeInstanceOf(Date);
    expect(updateData.resolvedById).toBe('test-staff');
  });

  it('updates violation with notes', async () => {
    mockViolationUpdate.mockResolvedValue({ id: 'v1', notes: 'Warning issued' });

    const req = createPatchRequest('/api/v1/parking/violations/v1', { notes: 'Warning issued' });
    await PATCH_VIOLATION(req, { params: Promise.resolve({ id: 'v1' }) });

    expect(mockViolationUpdate.mock.calls[0]![0].data.notes).toBe('Warning issued');
  });

  it('sets towRequested flag', async () => {
    mockViolationUpdate.mockResolvedValue({ id: 'v1', towRequested: true });

    const req = createPatchRequest('/api/v1/parking/violations/v1', { towRequested: true });
    await PATCH_VIOLATION(req, { params: Promise.resolve({ id: 'v1' }) });

    expect(mockViolationUpdate.mock.calls[0]![0].data.towRequested).toBe(true);
  });

  it('handles database errors without leaking internals', async () => {
    mockViolationUpdate.mockRejectedValue(new Error('Record not found'));

    const req = createPatchRequest('/api/v1/parking/violations/bad-id', { status: 'resolved' });
    const res = await PATCH_VIOLATION(req, { params: Promise.resolve({ id: 'bad-id' }) });
    expect(res.status).toBe(500);
    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).not.toContain('Record not found');
  });
});

// ---------------------------------------------------------------------------
// GET /api/v1/parking/areas — Parking Areas
// ---------------------------------------------------------------------------

describe('GET /api/v1/parking/areas — Listing', () => {
  it('rejects without propertyId', async () => {
    const req = createGetRequest('/api/v1/parking/areas');
    const res = await GET_AREAS(req);
    expect(res.status).toBe(400);
  });

  it('filters by propertyId and active status', async () => {
    mockAreaFindMany.mockResolvedValue([]);
    const req = createGetRequest('/api/v1/parking/areas', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET_AREAS(req);

    const where = mockAreaFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_A);
    expect(where.isActive).toBe(true);
  });

  it('orders areas by name ascending', async () => {
    mockAreaFindMany.mockResolvedValue([]);
    const req = createGetRequest('/api/v1/parking/areas', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET_AREAS(req);

    expect(mockAreaFindMany.mock.calls[0]![0].orderBy).toEqual({ areaName: 'asc' });
  });

  it('maps response to include spot count', async () => {
    mockAreaFindMany.mockResolvedValue([
      {
        id: 'area-1',
        areaName: 'P1 Underground',
        areaCode: 'P1',
        totalSpots: 100,
        visitorSpots: 10,
        _count: { spots: 85 },
      },
    ]);

    const req = createGetRequest('/api/v1/parking/areas', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await GET_AREAS(req);
    const body = await parseResponse<{ data: { spotCount: number }[] }>(res);
    expect(body.data[0]!.spotCount).toBe(85);
  });
});

// ---------------------------------------------------------------------------
// POST /api/v1/parking/areas — Create Area
// ---------------------------------------------------------------------------

describe('POST /api/v1/parking/areas — Validation', () => {
  it('rejects missing propertyId', async () => {
    const req = createPostRequest('/api/v1/parking/areas', { areaName: 'P1', areaCode: 'P1' });
    const res = await POST_AREA(req);
    expect(res.status).toBe(400);
  });

  it('rejects missing areaName', async () => {
    const req = createPostRequest('/api/v1/parking/areas', {
      propertyId: PROPERTY_A,
      areaCode: 'P1',
    });
    const res = await POST_AREA(req);
    expect(res.status).toBe(400);
  });

  it('rejects missing areaCode', async () => {
    const req = createPostRequest('/api/v1/parking/areas', {
      propertyId: PROPERTY_A,
      areaName: 'P1 Underground',
    });
    const res = await POST_AREA(req);
    expect(res.status).toBe(400);
  });

  it('rejects totalSpots over 5000', async () => {
    const req = createPostRequest('/api/v1/parking/areas', {
      propertyId: PROPERTY_A,
      areaName: 'Mega Lot',
      areaCode: 'ML',
      totalSpots: 5001,
    });
    const res = await POST_AREA(req);
    expect(res.status).toBe(400);
  });

  it('creates area successfully and returns 201', async () => {
    mockAreaCreate.mockResolvedValue({
      id: 'area-1',
      propertyId: PROPERTY_A,
      areaName: 'P1 Underground',
      areaCode: 'P1',
    });

    const req = createPostRequest('/api/v1/parking/areas', {
      propertyId: PROPERTY_A,
      areaName: 'P1 Underground',
      areaCode: 'P1',
    });
    const res = await POST_AREA(req);
    expect(res.status).toBe(201);
    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('created');
  });

  it('handles database errors gracefully', async () => {
    mockAreaCreate.mockRejectedValue(new Error('Unique constraint'));
    const req = createPostRequest('/api/v1/parking/areas', {
      propertyId: PROPERTY_A,
      areaName: 'Duplicate',
      areaCode: 'DUP',
    });
    const res = await POST_AREA(req);
    expect(res.status).toBe(500);
  });
});
