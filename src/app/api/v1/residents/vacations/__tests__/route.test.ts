/**
 * Vacation Periods API Tests — per PRD 07 Unit Management
 *
 * Covers:
 * - GET /api/v1/residents/vacations (list vacations)
 * - POST /api/v1/residents/vacations (create vacation)
 * - Date validation
 * - Overlap detection
 * - holdMail flag
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
    vacationPeriod: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
      create: (...args: unknown[]) => mockCreate(...args),
    },
  },
}));

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: vi.fn().mockResolvedValue({
    user: {
      userId: 'test-staff',
      propertyId: '00000000-0000-4000-b000-000000000001',
      role: 'front_desk',
      permissions: ['*'],
      mfaVerified: false,
    },
    error: null,
  }),
}));

import { GET, POST } from '../route';

const PROPERTY_A = '00000000-0000-4000-b000-000000000001';
const USER_A = '00000000-0000-4000-e000-000000000001';
const USER_B = '00000000-0000-4000-e000-000000000002';
const UNIT_A = '00000000-0000-4000-f000-000000000001';

// Build future dates relative to today to avoid "past date" validation failures
function futureDate(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toISOString().split('T')[0]!;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockFindMany.mockResolvedValue([]);
  mockFindFirst.mockResolvedValue(null);
});

// ---------------------------------------------------------------------------
// GET /api/v1/residents/vacations — Listing
// ---------------------------------------------------------------------------

describe('GET /api/v1/residents/vacations — Listing', () => {
  it('rejects without propertyId', async () => {
    const req = createGetRequest('/api/v1/residents/vacations');
    const res = await GET(req);
    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_PROPERTY');
  });

  it('returns vacations for property', async () => {
    const mockVacations = [
      { id: 'v1', userId: USER_A, startDate: '2026-07-01', endDate: '2026-07-15' },
      { id: 'v2', userId: USER_B, startDate: '2026-08-01', endDate: '2026-08-10' },
    ];
    mockFindMany.mockResolvedValue(mockVacations);

    const req = createGetRequest('/api/v1/residents/vacations', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: typeof mockVacations }>(res);
    expect(body.data).toHaveLength(2);
  });

  it('filters by userId when provided', async () => {
    const req = createGetRequest('/api/v1/residents/vacations', {
      searchParams: { propertyId: PROPERTY_A, userId: USER_A },
    });
    await GET(req);

    const where = mockFindMany.mock.calls[0]![0].where;
    expect(where.userId).toBe(USER_A);
  });

  it('filters by isActive=true', async () => {
    const req = createGetRequest('/api/v1/residents/vacations', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET(req);

    const where = mockFindMany.mock.calls[0]![0].where;
    expect(where.isActive).toBe(true);
  });

  it('orders by startDate ascending', async () => {
    const req = createGetRequest('/api/v1/residents/vacations', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET(req);

    expect(mockFindMany.mock.calls[0]![0].orderBy).toEqual({ startDate: 'asc' });
  });
});

// ---------------------------------------------------------------------------
// POST /api/v1/residents/vacations — Valid Creation
// ---------------------------------------------------------------------------

describe('POST /api/v1/residents/vacations — Valid Creation', () => {
  it('creates vacation with valid dates', async () => {
    const startDate = futureDate(10);
    const endDate = futureDate(20);
    const created = {
      id: 'v-new',
      propertyId: PROPERTY_A,
      userId: USER_A,
      unitId: UNIT_A,
      startDate,
      endDate,
      holdMail: false,
      isActive: true,
    };
    mockCreate.mockResolvedValue(created);

    const req = createPostRequest('/api/v1/residents/vacations', {
      propertyId: PROPERTY_A,
      userId: USER_A,
      unitId: UNIT_A,
      startDate,
      endDate,
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await parseResponse<{ data: typeof created; message: string }>(res);
    expect(body.message).toContain('created');
  });

  it('sets holdMail flag', async () => {
    const startDate = futureDate(5);
    const endDate = futureDate(15);
    mockCreate.mockResolvedValue({ id: 'v1', holdMail: true });

    const req = createPostRequest('/api/v1/residents/vacations', {
      propertyId: PROPERTY_A,
      userId: USER_A,
      unitId: UNIT_A,
      startDate,
      endDate,
      holdMail: true,
    });
    const res = await POST(req);
    expect(res.status).toBe(201);

    const createData = mockCreate.mock.calls[0]![0].data;
    expect(createData.holdMail).toBe(true);
  });

  it('saves optional notes', async () => {
    const startDate = futureDate(10);
    const endDate = futureDate(20);
    mockCreate.mockResolvedValue({ id: 'v1' });

    const req = createPostRequest('/api/v1/residents/vacations', {
      propertyId: PROPERTY_A,
      userId: USER_A,
      unitId: UNIT_A,
      startDate,
      endDate,
      notes: 'Visiting family in Vancouver',
    });
    const res = await POST(req);
    expect(res.status).toBe(201);

    const createData = mockCreate.mock.calls[0]![0].data;
    expect(createData.notes).toBe('Visiting family in Vancouver');
  });
});

// ---------------------------------------------------------------------------
// POST /api/v1/residents/vacations — Date Validation
// ---------------------------------------------------------------------------

describe('POST /api/v1/residents/vacations — Date Validation', () => {
  it('rejects endDate before startDate', async () => {
    const req = createPostRequest('/api/v1/residents/vacations', {
      propertyId: PROPERTY_A,
      userId: USER_A,
      unitId: UNIT_A,
      startDate: futureDate(20),
      endDate: futureDate(10),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await parseResponse<{ fields: Record<string, string[]> }>(res);
    expect(body.fields.endDate).toBeDefined();
  });

  it('rejects endDate equal to startDate', async () => {
    const sameDate = futureDate(10);
    const req = createPostRequest('/api/v1/residents/vacations', {
      propertyId: PROPERTY_A,
      userId: USER_A,
      unitId: UNIT_A,
      startDate: sameDate,
      endDate: sameDate,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects startDate in the past', async () => {
    const req = createPostRequest('/api/v1/residents/vacations', {
      propertyId: PROPERTY_A,
      userId: USER_A,
      unitId: UNIT_A,
      startDate: '2020-01-01',
      endDate: futureDate(10),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await parseResponse<{ fields: Record<string, string[]> }>(res);
    expect(body.fields.startDate).toBeDefined();
  });

  it('rejects invalid date format', async () => {
    const req = createPostRequest('/api/v1/residents/vacations', {
      propertyId: PROPERTY_A,
      userId: USER_A,
      unitId: UNIT_A,
      startDate: '07/15/2026',
      endDate: '07/30/2026',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// POST /api/v1/residents/vacations — Overlap Detection
// ---------------------------------------------------------------------------

describe('POST /api/v1/residents/vacations — Overlap Detection', () => {
  it('rejects overlapping vacation for the same user', async () => {
    mockFindFirst.mockResolvedValue({
      id: 'existing',
      userId: USER_A,
      startDate: futureDate(12),
      endDate: futureDate(22),
    });

    const req = createPostRequest('/api/v1/residents/vacations', {
      propertyId: PROPERTY_A,
      userId: USER_A,
      unitId: UNIT_A,
      startDate: futureDate(10),
      endDate: futureDate(20),
    });
    const res = await POST(req);
    expect(res.status).toBe(409);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('OVERLAP_CONFLICT');
  });
});

// ---------------------------------------------------------------------------
// POST /api/v1/residents/vacations — Error Handling
// ---------------------------------------------------------------------------

describe('POST /api/v1/residents/vacations — Error Handling', () => {
  it('handles database errors gracefully', async () => {
    mockCreate.mockRejectedValue(new Error('FK violation'));
    const req = createPostRequest('/api/v1/residents/vacations', {
      propertyId: PROPERTY_A,
      userId: USER_A,
      unitId: UNIT_A,
      startDate: futureDate(10),
      endDate: futureDate(20),
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).not.toContain('FK violation');
  });

  it('rejects missing required fields', async () => {
    const req = createPostRequest('/api/v1/residents/vacations', {
      propertyId: PROPERTY_A,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
