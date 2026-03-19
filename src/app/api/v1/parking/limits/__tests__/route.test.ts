/**
 * Parking Limit Configuration API Tests — per PRD 13 Parking Management
 *
 * Covers:
 * - GET /api/v1/parking/limits (list configs)
 * - POST /api/v1/parking/limits (create config)
 * - Scope/period validation matrix
 * - Duplicate prevention
 * - Granular limit scenarios
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createGetRequest, createPostRequest, parseResponse } from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Mock Setup
// ---------------------------------------------------------------------------

const mockFindMany = vi.fn();
const mockFindFirst = vi.fn();
const mockCreate = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    parkingLimitConfig: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
      create: (...args: unknown[]) => mockCreate(...args),
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

import { GET, POST } from '../route';

const PROPERTY_A = '00000000-0000-4000-b000-000000000001';
const PROPERTY_B = '00000000-0000-4000-b000-000000000002';
const PERMIT_TYPE_A = '00000000-0000-4000-c000-000000000001';

beforeEach(() => {
  vi.clearAllMocks();
  mockFindMany.mockResolvedValue([]);
  mockFindFirst.mockResolvedValue(null);
});

// ---------------------------------------------------------------------------
// GET /api/v1/parking/limits — Basics
// ---------------------------------------------------------------------------

describe('GET /api/v1/parking/limits — Basics', () => {
  it('rejects without propertyId', async () => {
    const req = createGetRequest('/api/v1/parking/limits');
    const res = await GET(req);
    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_PROPERTY');
  });

  it('returns empty array for property with no limits', async () => {
    const req = createGetRequest('/api/v1/parking/limits', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: unknown[] }>(res);
    expect(body.data).toEqual([]);
  });

  it('returns all limits for a property', async () => {
    const mockLimits = [
      { id: 'l1', propertyId: PROPERTY_A, scope: 'per_unit', period: 'per_month', maxCount: 2 },
      { id: 'l2', propertyId: PROPERTY_A, scope: 'per_plate', period: 'per_week', maxCount: 1 },
    ];
    mockFindMany.mockResolvedValue(mockLimits);

    const req = createGetRequest('/api/v1/parking/limits', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await GET(req);
    const body = await parseResponse<{ data: typeof mockLimits }>(res);
    expect(body.data).toHaveLength(2);
    expect(body.data[0]!.scope).toBe('per_unit');
  });

  it('filters by isActive=true', async () => {
    const req = createGetRequest('/api/v1/parking/limits', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET(req);

    const where = mockFindMany.mock.calls[0]![0].where;
    expect(where.isActive).toBe(true);
    expect(where.propertyId).toBe(PROPERTY_A);
  });

  it('orders by createdAt descending', async () => {
    const req = createGetRequest('/api/v1/parking/limits', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET(req);

    expect(mockFindMany.mock.calls[0]![0].orderBy).toEqual({ createdAt: 'desc' });
  });

  it('handles database errors gracefully', async () => {
    mockFindMany.mockRejectedValue(new Error('DB connection failed'));
    const req = createGetRequest('/api/v1/parking/limits', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await GET(req);
    expect(res.status).toBe(500);
    const body = await parseResponse<{ error: string; message: string }>(res);
    expect(body.error).toBe('INTERNAL_ERROR');
    expect(body.message).not.toContain('DB connection');
  });
});

// ---------------------------------------------------------------------------
// POST /api/v1/parking/limits — Valid Creation
// ---------------------------------------------------------------------------

describe('POST /api/v1/parking/limits — Valid Creation', () => {
  it('creates a parking limit config with valid data', async () => {
    const created = {
      id: 'new-limit',
      propertyId: PROPERTY_A,
      scope: 'per_unit',
      period: 'per_month',
      maxCount: 3,
      isActive: true,
    };
    mockCreate.mockResolvedValue(created);

    const req = createPostRequest('/api/v1/parking/limits', {
      propertyId: PROPERTY_A,
      scope: 'per_unit',
      period: 'per_month',
      maxCount: 3,
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await parseResponse<{ data: typeof created; message: string }>(res);
    expect(body.data.scope).toBe('per_unit');
    expect(body.message).toContain('created');
  });

  it('creates a limit with optional permitTypeId', async () => {
    mockCreate.mockResolvedValue({ id: 'l1', permitTypeId: PERMIT_TYPE_A });

    const req = createPostRequest('/api/v1/parking/limits', {
      propertyId: PROPERTY_A,
      permitTypeId: PERMIT_TYPE_A,
      scope: 'per_plate',
      period: 'per_week',
      maxCount: 1,
    });
    const res = await POST(req);
    expect(res.status).toBe(201);

    const createData = mockCreate.mock.calls[0]![0].data;
    expect(createData.permitTypeId).toBe(PERMIT_TYPE_A);
  });

  it('creates a consecutive-day limit with valid consecutiveDays', async () => {
    mockCreate.mockResolvedValue({
      id: 'l1',
      scope: 'per_unit',
      period: 'consecutive',
      maxCount: 1,
      consecutiveDays: 14,
    });

    const req = createPostRequest('/api/v1/parking/limits', {
      propertyId: PROPERTY_A,
      scope: 'per_unit',
      period: 'consecutive',
      maxCount: 1,
      consecutiveDays: 14,
    });
    const res = await POST(req);
    expect(res.status).toBe(201);

    const createData = mockCreate.mock.calls[0]![0].data;
    expect(createData.consecutiveDays).toBe(14);
  });

  it('creates a day_visit limit with valid dayVisitLimit', async () => {
    mockCreate.mockResolvedValue({
      id: 'l1',
      scope: 'per_plate',
      period: 'day_visit',
      maxCount: 5,
      dayVisitLimit: 3,
    });

    const req = createPostRequest('/api/v1/parking/limits', {
      propertyId: PROPERTY_A,
      scope: 'per_plate',
      period: 'day_visit',
      maxCount: 5,
      dayVisitLimit: 3,
    });
    const res = await POST(req);
    expect(res.status).toBe(201);

    const createData = mockCreate.mock.calls[0]![0].data;
    expect(createData.dayVisitLimit).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// POST /api/v1/parking/limits — Scope Validation
// ---------------------------------------------------------------------------

describe('POST /api/v1/parking/limits — Scope Validation', () => {
  it('rejects invalid scope value', async () => {
    const req = createPostRequest('/api/v1/parking/limits', {
      propertyId: PROPERTY_A,
      scope: 'per_building',
      period: 'per_month',
      maxCount: 1,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('accepts per_unit scope', async () => {
    mockCreate.mockResolvedValue({ id: 'l1' });
    const req = createPostRequest('/api/v1/parking/limits', {
      propertyId: PROPERTY_A,
      scope: 'per_unit',
      period: 'per_month',
      maxCount: 1,
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('accepts per_plate scope', async () => {
    mockCreate.mockResolvedValue({ id: 'l1' });
    const req = createPostRequest('/api/v1/parking/limits', {
      propertyId: PROPERTY_A,
      scope: 'per_plate',
      period: 'per_month',
      maxCount: 1,
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('accepts per_area scope', async () => {
    mockCreate.mockResolvedValue({ id: 'l1' });
    const req = createPostRequest('/api/v1/parking/limits', {
      propertyId: PROPERTY_A,
      scope: 'per_area',
      period: 'per_month',
      maxCount: 1,
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });
});

// ---------------------------------------------------------------------------
// POST /api/v1/parking/limits — Period Validation
// ---------------------------------------------------------------------------

describe('POST /api/v1/parking/limits — Period Validation', () => {
  it('rejects invalid period value', async () => {
    const req = createPostRequest('/api/v1/parking/limits', {
      propertyId: PROPERTY_A,
      scope: 'per_unit',
      period: 'per_quarter',
      maxCount: 1,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('accepts per_week period', async () => {
    mockCreate.mockResolvedValue({ id: 'l1' });
    const req = createPostRequest('/api/v1/parking/limits', {
      propertyId: PROPERTY_A,
      scope: 'per_unit',
      period: 'per_week',
      maxCount: 1,
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('accepts per_year period', async () => {
    mockCreate.mockResolvedValue({ id: 'l1' });
    const req = createPostRequest('/api/v1/parking/limits', {
      propertyId: PROPERTY_A,
      scope: 'per_unit',
      period: 'per_year',
      maxCount: 1,
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });
});

// ---------------------------------------------------------------------------
// POST /api/v1/parking/limits — maxCount Validation
// ---------------------------------------------------------------------------

describe('POST /api/v1/parking/limits — maxCount Validation', () => {
  it('validates maxCount >= 1', async () => {
    const req = createPostRequest('/api/v1/parking/limits', {
      propertyId: PROPERTY_A,
      scope: 'per_unit',
      period: 'per_month',
      maxCount: 0,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string; fields: Record<string, string[]> }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('rejects negative maxCount', async () => {
    const req = createPostRequest('/api/v1/parking/limits', {
      propertyId: PROPERTY_A,
      scope: 'per_unit',
      period: 'per_month',
      maxCount: -5,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects non-integer maxCount', async () => {
    const req = createPostRequest('/api/v1/parking/limits', {
      propertyId: PROPERTY_A,
      scope: 'per_unit',
      period: 'per_month',
      maxCount: 2.5,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// POST /api/v1/parking/limits — Conditional Field Validation
// ---------------------------------------------------------------------------

describe('POST /api/v1/parking/limits — Conditional Field Validation', () => {
  it('rejects consecutiveDays when period is not "consecutive"', async () => {
    const req = createPostRequest('/api/v1/parking/limits', {
      propertyId: PROPERTY_A,
      scope: 'per_unit',
      period: 'per_month',
      maxCount: 1,
      consecutiveDays: 7,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await parseResponse<{ fields: Record<string, string[]> }>(res);
    expect(body.fields.consecutiveDays).toBeDefined();
  });

  it('rejects dayVisitLimit when period is not "day_visit"', async () => {
    const req = createPostRequest('/api/v1/parking/limits', {
      propertyId: PROPERTY_A,
      scope: 'per_plate',
      period: 'per_week',
      maxCount: 1,
      dayVisitLimit: 5,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await parseResponse<{ fields: Record<string, string[]> }>(res);
    expect(body.fields.dayVisitLimit).toBeDefined();
  });

  it('requires consecutiveDays when period is "consecutive"', async () => {
    const req = createPostRequest('/api/v1/parking/limits', {
      propertyId: PROPERTY_A,
      scope: 'per_unit',
      period: 'consecutive',
      maxCount: 1,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('requires dayVisitLimit when period is "day_visit"', async () => {
    const req = createPostRequest('/api/v1/parking/limits', {
      propertyId: PROPERTY_A,
      scope: 'per_plate',
      period: 'day_visit',
      maxCount: 1,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// POST /api/v1/parking/limits — Duplicate Prevention
// ---------------------------------------------------------------------------

describe('POST /api/v1/parking/limits — Duplicate Prevention', () => {
  it('prevents duplicate scope+period+permitType combinations', async () => {
    mockFindFirst.mockResolvedValue({
      id: 'existing',
      propertyId: PROPERTY_A,
      scope: 'per_unit',
      period: 'per_month',
    });

    const req = createPostRequest('/api/v1/parking/limits', {
      propertyId: PROPERTY_A,
      scope: 'per_unit',
      period: 'per_month',
      maxCount: 2,
    });
    const res = await POST(req);
    expect(res.status).toBe(409);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('DUPLICATE_LIMIT');
  });

  it('allows same scope+period for different properties', async () => {
    mockFindFirst.mockResolvedValue(null);
    mockCreate.mockResolvedValue({ id: 'l1' });

    const req = createPostRequest('/api/v1/parking/limits', {
      propertyId: PROPERTY_B,
      scope: 'per_unit',
      period: 'per_month',
      maxCount: 2,
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('allows same scope+period for different permit types', async () => {
    mockFindFirst.mockResolvedValue(null);
    mockCreate.mockResolvedValue({ id: 'l1' });

    const req = createPostRequest('/api/v1/parking/limits', {
      propertyId: PROPERTY_A,
      permitTypeId: PERMIT_TYPE_A,
      scope: 'per_unit',
      period: 'per_month',
      maxCount: 2,
    });
    const res = await POST(req);
    expect(res.status).toBe(201);

    // Verify permitTypeId was used in the duplicate check
    const findWhere = mockFindFirst.mock.calls[0]![0].where;
    expect(findWhere.permitTypeId).toBe(PERMIT_TYPE_A);
  });
});

// ---------------------------------------------------------------------------
// Granular Limit Matrix Scenarios
// ---------------------------------------------------------------------------

describe('Granular Limit Matrix Scenarios', () => {
  beforeEach(() => {
    mockCreate.mockImplementation(({ data }: { data: Record<string, unknown> }) =>
      Promise.resolve({ id: 'new-id', ...data }),
    );
  });

  it('per-plate weekly limit: max 1 permit per plate per week', async () => {
    const req = createPostRequest('/api/v1/parking/limits', {
      propertyId: PROPERTY_A,
      scope: 'per_plate',
      period: 'per_week',
      maxCount: 1,
    });
    const res = await POST(req);
    expect(res.status).toBe(201);

    const createData = mockCreate.mock.calls[0]![0].data;
    expect(createData.scope).toBe('per_plate');
    expect(createData.period).toBe('per_week');
    expect(createData.maxCount).toBe(1);
  });

  it('per-unit monthly limit: max 4 permits per unit per month', async () => {
    const req = createPostRequest('/api/v1/parking/limits', {
      propertyId: PROPERTY_A,
      scope: 'per_unit',
      period: 'per_month',
      maxCount: 4,
    });
    const res = await POST(req);
    expect(res.status).toBe(201);

    const createData = mockCreate.mock.calls[0]![0].data;
    expect(createData.scope).toBe('per_unit');
    expect(createData.period).toBe('per_month');
    expect(createData.maxCount).toBe(4);
  });

  it('consecutive day limit: max 14 consecutive days per unit', async () => {
    const req = createPostRequest('/api/v1/parking/limits', {
      propertyId: PROPERTY_A,
      scope: 'per_unit',
      period: 'consecutive',
      maxCount: 1,
      consecutiveDays: 14,
    });
    const res = await POST(req);
    expect(res.status).toBe(201);

    const createData = mockCreate.mock.calls[0]![0].data;
    expect(createData.period).toBe('consecutive');
    expect(createData.consecutiveDays).toBe(14);
  });

  it('per-area yearly limit: max 12 permits per area per year', async () => {
    const req = createPostRequest('/api/v1/parking/limits', {
      propertyId: PROPERTY_A,
      scope: 'per_area',
      period: 'per_year',
      maxCount: 12,
    });
    const res = await POST(req);
    expect(res.status).toBe(201);

    const createData = mockCreate.mock.calls[0]![0].data;
    expect(createData.scope).toBe('per_area');
    expect(createData.period).toBe('per_year');
    expect(createData.maxCount).toBe(12);
  });

  it('day visit limit: max 3 day visits per plate', async () => {
    const req = createPostRequest('/api/v1/parking/limits', {
      propertyId: PROPERTY_A,
      scope: 'per_plate',
      period: 'day_visit',
      maxCount: 5,
      dayVisitLimit: 3,
    });
    const res = await POST(req);
    expect(res.status).toBe(201);

    const createData = mockCreate.mock.calls[0]![0].data;
    expect(createData.period).toBe('day_visit');
    expect(createData.dayVisitLimit).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// POST /api/v1/parking/limits — Error Handling
// ---------------------------------------------------------------------------

describe('POST /api/v1/parking/limits — Error Handling', () => {
  it('handles database errors without leaking internals', async () => {
    mockCreate.mockRejectedValue(new Error('Unique constraint violation'));
    const req = createPostRequest('/api/v1/parking/limits', {
      propertyId: PROPERTY_A,
      scope: 'per_unit',
      period: 'per_month',
      maxCount: 1,
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).not.toContain('Unique constraint');
  });

  it('rejects missing propertyId', async () => {
    const req = createPostRequest('/api/v1/parking/limits', {
      scope: 'per_unit',
      period: 'per_month',
      maxCount: 1,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects missing scope', async () => {
    const req = createPostRequest('/api/v1/parking/limits', {
      propertyId: PROPERTY_A,
      period: 'per_month',
      maxCount: 1,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects missing period', async () => {
    const req = createPostRequest('/api/v1/parking/limits', {
      propertyId: PROPERTY_A,
      scope: 'per_unit',
      maxCount: 1,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
