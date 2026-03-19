/**
 * Shift Log API Route Tests — per PRD 03 Section 3.1.6
 *
 * Covers:
 * - GET /api/v1/shift-log (list entries)
 * - POST /api/v1/shift-log (create entry)
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createGetRequest, createPostRequest, parseResponse } from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Mock Setup
// ---------------------------------------------------------------------------

const mockEventFindMany = vi.fn();
const mockEventCount = vi.fn();
const mockEventCreate = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    event: {
      findMany: (...args: unknown[]) => mockEventFindMany(...args),
      count: (...args: unknown[]) => mockEventCount(...args),
      create: (...args: unknown[]) => mockEventCreate(...args),
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

beforeEach(() => {
  vi.clearAllMocks();
  mockEventFindMany.mockResolvedValue([]);
  mockEventCount.mockResolvedValue(0);
});

// ---------------------------------------------------------------------------
// GET /api/v1/shift-log — Tenant Isolation
// ---------------------------------------------------------------------------

describe('GET /api/v1/shift-log — Tenant Isolation', () => {
  it('rejects without propertyId', async () => {
    const req = createGetRequest('/api/v1/shift-log');
    const res = await GET(req);
    expect(res.status).toBe(400);
    expect(mockEventFindMany).not.toHaveBeenCalled();
  });

  it('filters by propertyId and soft-delete', async () => {
    const req = createGetRequest('/api/v1/shift-log', { searchParams: { propertyId: PROPERTY_A } });
    await GET(req);

    const where = mockEventFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_A);
    expect(where.deletedAt).toBeNull();
  });

  it('scopes to shift_log event type only', async () => {
    const req = createGetRequest('/api/v1/shift-log', { searchParams: { propertyId: PROPERTY_A } });
    await GET(req);

    const where = mockEventFindMany.mock.calls[0]![0].where;
    expect(where.eventType).toEqual({ slug: 'shift_log' });
  });
});

// ---------------------------------------------------------------------------
// GET /api/v1/shift-log — Pagination
// ---------------------------------------------------------------------------

describe('GET /api/v1/shift-log — Pagination', () => {
  it('defaults to page 1 with pageSize 20', async () => {
    mockEventCount.mockResolvedValue(0);
    const req = createGetRequest('/api/v1/shift-log', { searchParams: { propertyId: PROPERTY_A } });
    const res = await GET(req);
    const body = await parseResponse<{ meta: { page: number; pageSize: number } }>(res);
    expect(body.meta.page).toBe(1);
    expect(body.meta.pageSize).toBe(20);
  });

  it('paginates correctly on page 3', async () => {
    mockEventCount.mockResolvedValue(100);
    const req = createGetRequest('/api/v1/shift-log', {
      searchParams: { propertyId: PROPERTY_A, page: '3', pageSize: '10' },
    });
    await GET(req);

    const call = mockEventFindMany.mock.calls[0]![0];
    expect(call.skip).toBe(20); // (3-1) * 10
    expect(call.take).toBe(10);
  });

  it('returns totalPages in meta', async () => {
    mockEventCount.mockResolvedValue(55);
    const req = createGetRequest('/api/v1/shift-log', { searchParams: { propertyId: PROPERTY_A } });
    const res = await GET(req);
    const body = await parseResponse<{ meta: { totalPages: number } }>(res);
    expect(body.meta.totalPages).toBe(3); // ceil(55/20)
  });

  it('orders by createdAt descending — newest entries first', async () => {
    const req = createGetRequest('/api/v1/shift-log', { searchParams: { propertyId: PROPERTY_A } });
    await GET(req);
    expect(mockEventFindMany.mock.calls[0]![0].orderBy).toEqual({ createdAt: 'desc' });
  });

  it('includes eventType name for display', async () => {
    const req = createGetRequest('/api/v1/shift-log', { searchParams: { propertyId: PROPERTY_A } });
    await GET(req);
    expect(mockEventFindMany.mock.calls[0]![0].include.eventType).toBeDefined();
  });

  it('returns empty array when no entries exist', async () => {
    const req = createGetRequest('/api/v1/shift-log', { searchParams: { propertyId: PROPERTY_A } });
    const res = await GET(req);
    const body = await parseResponse<{ data: unknown[] }>(res);
    expect(body.data).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// POST /api/v1/shift-log — Validation
// ---------------------------------------------------------------------------

describe('POST /api/v1/shift-log — Validation', () => {
  it('rejects empty body', async () => {
    const req = createPostRequest('/api/v1/shift-log', {});
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('rejects missing content', async () => {
    const req = createPostRequest('/api/v1/shift-log', {
      propertyId: PROPERTY_A,
      shift: 'morning',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects empty content string', async () => {
    const req = createPostRequest('/api/v1/shift-log', {
      propertyId: PROPERTY_A,
      shift: 'morning',
      content: '',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects content over 4000 characters', async () => {
    const req = createPostRequest('/api/v1/shift-log', {
      propertyId: PROPERTY_A,
      shift: 'morning',
      content: 'X'.repeat(4001),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects missing shift', async () => {
    const req = createPostRequest('/api/v1/shift-log', {
      propertyId: PROPERTY_A,
      content: 'All quiet on the front desk.',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects invalid shift value', async () => {
    const req = createPostRequest('/api/v1/shift-log', {
      propertyId: PROPERTY_A,
      content: 'All quiet.',
      shift: 'graveyard',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects invalid propertyId format', async () => {
    const req = createPostRequest('/api/v1/shift-log', {
      propertyId: 'not-uuid',
      content: 'Entry',
      shift: 'morning',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// POST /api/v1/shift-log — Entry Creation
// ---------------------------------------------------------------------------

describe('POST /api/v1/shift-log — Entry Creation', () => {
  const validEntry = {
    propertyId: PROPERTY_A,
    content: 'Water leak reported in unit 1204. Maintenance notified.',
    shift: 'morning' as const,
    priority: 'important' as const,
  };

  it('creates entry and returns 201', async () => {
    mockEventCreate.mockResolvedValue({ id: 'event-1', ...validEntry });

    const req = createPostRequest('/api/v1/shift-log', validEntry);
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('added');
  });

  it('generates SL- reference number', async () => {
    mockEventCreate.mockResolvedValue({ id: 'event-1' });

    const req = createPostRequest('/api/v1/shift-log', validEntry);
    await POST(req);

    const createData = mockEventCreate.mock.calls[0]![0].data;
    expect(createData.referenceNo).toMatch(/^SL-/);
  });

  it('stores shift in customFields', async () => {
    mockEventCreate.mockResolvedValue({ id: 'event-1' });

    const req = createPostRequest('/api/v1/shift-log', validEntry);
    await POST(req);

    const createData = mockEventCreate.mock.calls[0]![0].data;
    expect(createData.customFields.shift).toBe('morning');
  });

  it('strips HTML from content — XSS prevention', async () => {
    mockEventCreate.mockResolvedValue({ id: 'event-1' });

    const req = createPostRequest('/api/v1/shift-log', {
      ...validEntry,
      content: '<script>alert("xss")</script>Water leak in lobby',
    });
    await POST(req);

    const createData = mockEventCreate.mock.calls[0]![0].data;
    expect(createData.description).not.toContain('<script>');
    expect(createData.description).toContain('Water leak');
  });

  it('sets createdById from authenticated user', async () => {
    mockEventCreate.mockResolvedValue({ id: 'event-1' });

    const req = createPostRequest('/api/v1/shift-log', validEntry);
    await POST(req);

    expect(mockEventCreate.mock.calls[0]![0].data.createdById).toBe('test-staff');
  });

  it('accepts all 3 valid shift values', async () => {
    for (const shift of ['morning', 'afternoon', 'night']) {
      mockEventCreate.mockResolvedValue({ id: `event-${shift}` });
      const req = createPostRequest('/api/v1/shift-log', { ...validEntry, shift });
      const res = await POST(req);
      expect(res.status).toBe(201);
    }
  });

  it('defaults priority to normal', async () => {
    mockEventCreate.mockResolvedValue({ id: 'event-1' });

    const req = createPostRequest('/api/v1/shift-log', {
      propertyId: PROPERTY_A,
      content: 'Routine check complete.',
      shift: 'night',
    });
    await POST(req);

    expect(mockEventCreate.mock.calls[0]![0].data.priority).toBe('normal');
  });

  it('handles database errors without leaking internals', async () => {
    mockEventCreate.mockRejectedValue(new Error('FK: eventTypeId not found'));

    const req = createPostRequest('/api/v1/shift-log', validEntry);
    const res = await POST(req);
    expect(res.status).toBe(500);
    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).not.toContain('FK');
  });
});
