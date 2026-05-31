/**
 * Resident Visitor Pre-Authorization API Tests
 *
 * GET  /api/v1/my/visitors  — resident's own expected/active visitors
 * POST /api/v1/my/visitors  — resident pre-authorizes a guest
 *
 * The unit is always resolved server-side from OccupancyRecord; the
 * request body never carries a unitId, so a resident cannot authorize
 * a guest into another unit.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createGetRequest, createPostRequest, parseResponse } from '@/test/helpers/api';

const PROPERTY_ID = '00000000-0000-4000-b000-000000000001';
const RESIDENT_USER_ID = '00000000-0000-4000-a000-000000000001';
const RESIDENT_UNIT_ID = '00000000-0000-4000-e000-000000000001';

// ---------------------------------------------------------------------------
// Mock Prisma
// ---------------------------------------------------------------------------

const mockOccupancyFindFirst = vi.fn();
const mockVisitorFindMany = vi.fn();
const mockVisitorCreate = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    occupancyRecord: {
      findFirst: (...args: unknown[]) => mockOccupancyFindFirst(...args),
    },
    visitorEntry: {
      findMany: (...args: unknown[]) => mockVisitorFindMany(...args),
      create: (...args: unknown[]) => mockVisitorCreate(...args),
    },
  },
}));

// ---------------------------------------------------------------------------
// Mock guardRoute
// ---------------------------------------------------------------------------

const mockGuardRoute = vi.fn();

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: (...args: unknown[]) => mockGuardRoute(...args),
  enforcePropertyAccess: vi.fn().mockReturnValue(null),
}));

function setResidentAuth(role = 'resident_owner') {
  mockGuardRoute.mockResolvedValue({
    user: {
      userId: RESIDENT_USER_ID,
      propertyId: PROPERTY_ID,
      role,
      permissions: [],
      unitId: RESIDENT_UNIT_ID,
    },
    error: null,
  });
}

function setOccupied() {
  mockOccupancyFindFirst.mockResolvedValue({ unitId: RESIDENT_UNIT_ID, propertyId: PROPERTY_ID });
}

function tomorrowIso(hour = 19): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

beforeEach(() => {
  vi.clearAllMocks();
  setResidentAuth();
  setOccupied();
});

describe('POST /api/v1/my/visitors — resident pre-authorization', () => {
  it('creates a pre-authorized visitor (201) and resolves unit from occupancy', async () => {
    mockVisitorCreate.mockResolvedValue({
      id: 'visitor-1',
      visitorName: 'Sarah Kim',
      visitorType: 'visitor',
      arrivalAt: new Date(tomorrowIso()),
      comments: 'Pre-authorized by resident',
    });
    const { POST } = await import('../route');
    const req = createPostRequest('/api/v1/my/visitors', {
      visitorName: 'Sarah Kim',
      expectedArrivalAt: tomorrowIso(),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);

    // The create must use the occupancy-resolved unit, never a body value.
    const createArg = mockVisitorCreate.mock.calls[0]?.[0] as {
      data: { unitId: string; propertyId: string };
    };
    expect(createArg.data.unitId).toBe(RESIDENT_UNIT_ID);
    expect(createArg.data.propertyId).toBe(PROPERTY_ID);
  });

  it('rejects a missing visitor name with 400', async () => {
    const { POST } = await import('../route');
    const req = createPostRequest('/api/v1/my/visitors', { expectedArrivalAt: tomorrowIso() });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(mockVisitorCreate).not.toHaveBeenCalled();
  });

  it('rejects an arrival more than 30 days out with 400 TOO_FAR_FUTURE', async () => {
    const far = new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString();
    const { POST } = await import('../route');
    const req = createPostRequest('/api/v1/my/visitors', {
      visitorName: 'Late Guest',
      expectedArrivalAt: far,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('TOO_FAR_FUTURE');
    expect(mockVisitorCreate).not.toHaveBeenCalled();
  });

  it('returns 400 NO_UNIT when the resident has no active occupancy', async () => {
    mockOccupancyFindFirst.mockResolvedValue(null);
    const { POST } = await import('../route');
    const req = createPostRequest('/api/v1/my/visitors', {
      visitorName: 'Sarah Kim',
      expectedArrivalAt: tomorrowIso(),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('NO_UNIT');
  });

  it('prefixes comments with the resident-authored marker', async () => {
    mockVisitorCreate.mockResolvedValue({
      id: 'v2',
      visitorName: 'Bob',
      visitorType: 'visitor',
      arrivalAt: new Date(tomorrowIso()),
      comments: 'Pre-authorized by resident. Bringing tools',
    });
    const { POST } = await import('../route');
    const req = createPostRequest('/api/v1/my/visitors', {
      visitorName: 'Bob',
      expectedArrivalAt: tomorrowIso(),
      notes: 'Bringing tools',
    });
    await POST(req);
    const createArg = mockVisitorCreate.mock.calls[0]?.[0] as { data: { comments: string } };
    expect(createArg.data.comments).toContain('Pre-authorized by resident');
    expect(createArg.data.comments).toContain('Bringing tools');
  });
});

describe('GET /api/v1/my/visitors', () => {
  it('returns the resident expected-visitor list scoped to their unit', async () => {
    mockVisitorFindMany.mockResolvedValue([
      {
        id: 'v1',
        visitorName: 'Sarah Kim',
        visitorType: 'visitor',
        arrivalAt: new Date(),
        departureAt: null,
        comments: null,
      },
    ]);
    const { GET } = await import('../route');
    const req = createGetRequest('/api/v1/my/visitors', { searchParams: { status: 'expected' } });
    const res = await GET(req);
    expect(res.status).toBe(200);

    // Query must be scoped to the resident's own unit.
    const whereArg = mockVisitorFindMany.mock.calls[0]?.[0] as {
      where: { unitId: string; propertyId: string };
    };
    expect(whereArg.where.unitId).toBe(RESIDENT_UNIT_ID);
    expect(whereArg.where.propertyId).toBe(PROPERTY_ID);
  });

  it('returns an empty list (not an error) when the resident has no unit', async () => {
    mockOccupancyFindFirst.mockResolvedValue(null);
    const { GET } = await import('../route');
    const req = createGetRequest('/api/v1/my/visitors', {});
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: unknown[] }>(res);
    expect(body.data).toEqual([]);
  });
});
