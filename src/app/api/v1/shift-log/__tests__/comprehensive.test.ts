/**
 * Comprehensive Shift Log Module Tests — PRD 15
 *
 * Covers 12 scenario groups with 60+ individual test cases:
 *   1. Entry CRUD with timestamp auto-generation
 *   2. Chronological ordering (newest first, pinned at top)
 *   3. Priority filtering (normal, important, urgent)
 *   4. Category filtering via customFields JSONB
 *   5. Shift handoff (entries since last shift change + pinned)
 *   6. Pin/unpin entries
 *   7. Bulk mark-as-read
 *   8. Unread count per user
 *   9. XSS prevention on content
 *  10. Pagination and meta
 *  11. Tenant isolation and property scoping
 *  12. Validation and edge cases
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createGetRequest, createPostRequest, parseResponse } from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// UUIDs
// ---------------------------------------------------------------------------
const PROPERTY_A = '00000000-0000-4000-b000-000000000001';
const PROPERTY_B = '00000000-0000-4000-b000-000000000002';
const STAFF_USER = '00000000-0000-4000-c000-000000000001';
const OTHER_USER = '00000000-0000-4000-c000-000000000099';
const ENTRY_ID_1 = '00000000-0000-4000-c000-000000000001';
const ENTRY_ID_2 = '00000000-0000-4000-c000-000000000002';
const ENTRY_ID_3 = '00000000-0000-4000-c000-000000000003';
const UNIT_ID = '00000000-0000-4000-e000-000000000001';
const RESIDENT_ID = '00000000-0000-4000-f000-000000000001';

// ---------------------------------------------------------------------------
// Mock Setup — Prisma
// ---------------------------------------------------------------------------

const mockEventFindMany = vi.fn();
const mockEventCount = vi.fn();
const mockEventCreate = vi.fn();
const mockEventFindUnique = vi.fn();
const mockEventUpdate = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    event: {
      findMany: (...args: unknown[]) => mockEventFindMany(...args),
      count: (...args: unknown[]) => mockEventCount(...args),
      create: (...args: unknown[]) => mockEventCreate(...args),
      findUnique: (...args: unknown[]) => mockEventFindUnique(...args),
      update: (...args: unknown[]) => mockEventUpdate(...args),
    },
  },
}));

// ---------------------------------------------------------------------------
// Mock Setup — guardRoute
// ---------------------------------------------------------------------------

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: vi.fn().mockResolvedValue({
    user: {
      userId: '00000000-0000-4000-c000-000000000001',
      propertyId: '00000000-0000-4000-b000-000000000001',
      role: 'front_desk',
      permissions: ['*'],
      mfaVerified: false,
    },
    error: null,
  }),
}));

// ---------------------------------------------------------------------------
// Mock sanitize
// ---------------------------------------------------------------------------

vi.mock('@/lib/sanitize', () => ({
  stripHtml: vi.fn((s: string) => s.replace(/<[^>]*>/g, '')),
  stripControlChars: vi.fn((s: string) => s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')),
}));

// ---------------------------------------------------------------------------
// Import route handlers AFTER mocks
// ---------------------------------------------------------------------------

import { GET, POST } from '../route';
import { GET as GET_HANDOFF } from '../handoff/route';
import { POST as POST_PIN } from '../[id]/pin/route';
import { POST as POST_MARK_READ } from '../mark-read/route';
import { GET as GET_UNREAD_COUNT } from '../unread-count/route';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeEntry(overrides: Record<string, unknown> = {}) {
  return {
    id: ENTRY_ID_1,
    propertyId: PROPERTY_A,
    eventTypeId: 'shift-log-type',
    title: 'Shift log note',
    description: 'Test entry content',
    priority: 'normal',
    referenceNo: 'SL-ABC123',
    createdById: STAFF_USER,
    customFields: { category: 'general', pinned: false, readBy: [] },
    createdAt: new Date('2026-03-18T10:00:00Z'),
    updatedAt: new Date('2026-03-18T10:00:00Z'),
    deletedAt: null,
    eventType: { name: 'Shift Log' },
    ...overrides,
  };
}

const validBody = {
  propertyId: PROPERTY_A,
  content: 'Water leak reported in unit 1204. Maintenance notified.',
};

beforeEach(() => {
  vi.clearAllMocks();
  mockEventFindMany.mockResolvedValue([]);
  mockEventCount.mockResolvedValue(0);
});

// ===========================================================================
// 1. Entry CRUD with timestamp auto-generation
// ===========================================================================

describe('1. Entry CRUD with timestamp auto-generation', () => {
  it('creates entry with 201 status and confirmation message', async () => {
    mockEventCreate.mockResolvedValue(makeEntry());

    const res = await POST(createPostRequest('/api/v1/shift-log', validBody));
    expect(res.status).toBe(201);

    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('added');
  });

  it('auto-generates SL- prefixed reference number', async () => {
    mockEventCreate.mockResolvedValue(makeEntry());

    await POST(createPostRequest('/api/v1/shift-log', validBody));

    const data = mockEventCreate.mock.calls[0]![0].data;
    expect(data.referenceNo).toMatch(/^SL-/);
  });

  it('sets createdById from authenticated user session', async () => {
    mockEventCreate.mockResolvedValue(makeEntry());

    await POST(createPostRequest('/api/v1/shift-log', validBody));

    expect(mockEventCreate.mock.calls[0]![0].data.createdById).toBe(STAFF_USER);
  });

  it('initializes customFields with default pinned=false and readBy=[]', async () => {
    mockEventCreate.mockResolvedValue(makeEntry());

    await POST(createPostRequest('/api/v1/shift-log', validBody));

    const cf = mockEventCreate.mock.calls[0]![0].data.customFields;
    expect(cf.pinned).toBe(false);
    expect(cf.readBy).toEqual([]);
  });

  it('sets eventTypeId to shift-log-type', async () => {
    mockEventCreate.mockResolvedValue(makeEntry());

    await POST(createPostRequest('/api/v1/shift-log', validBody));

    expect(mockEventCreate.mock.calls[0]![0].data.eventTypeId).toBe('shift-log-type');
  });

  it('generates reference numbers with SL- prefix', async () => {
    mockEventCreate.mockResolvedValue(makeEntry());

    await POST(createPostRequest('/api/v1/shift-log', validBody));

    const ref = mockEventCreate.mock.calls[0]![0].data.referenceNo as string;
    expect(ref).toMatch(/^SL-/);
    expect(ref.length).toBeGreaterThan(3);
  });
});

// ===========================================================================
// 2. Chronological ordering (newest first)
// ===========================================================================

describe('2. Chronological ordering', () => {
  it('orders by customFields (pinned first) then createdAt desc', async () => {
    await GET(createGetRequest('/api/v1/shift-log', { searchParams: { propertyId: PROPERTY_A } }));

    const call = mockEventFindMany.mock.calls[0]![0];
    expect(call.orderBy).toEqual([{ customFields: { sort: 'desc' } }, { createdAt: 'desc' }]);
  });

  it('includes eventType name in response for display', async () => {
    await GET(createGetRequest('/api/v1/shift-log', { searchParams: { propertyId: PROPERTY_A } }));

    const call = mockEventFindMany.mock.calls[0]![0];
    expect(call.include.eventType).toEqual({ select: { name: true } });
  });

  it('returns entries in data array with meta pagination', async () => {
    mockEventFindMany.mockResolvedValue([makeEntry()]);
    mockEventCount.mockResolvedValue(1);

    const res = await GET(
      createGetRequest('/api/v1/shift-log', { searchParams: { propertyId: PROPERTY_A } }),
    );
    const body = await parseResponse<{ data: unknown[]; meta: { page: number; total: number } }>(
      res,
    );

    expect(body.data).toHaveLength(1);
    expect(body.meta.total).toBe(1);
  });
});

// ===========================================================================
// 3. Priority filtering
// ===========================================================================

describe('3. Priority filtering', () => {
  for (const priority of ['normal', 'important', 'urgent'] as const) {
    it(`filters by priority=${priority}`, async () => {
      await GET(
        createGetRequest('/api/v1/shift-log', {
          searchParams: { propertyId: PROPERTY_A, priority },
        }),
      );

      expect(mockEventFindMany.mock.calls[0]![0].where.priority).toBe(priority);
    });
  }

  it('ignores invalid priority values (does not add to where)', async () => {
    await GET(
      createGetRequest('/api/v1/shift-log', {
        searchParams: { propertyId: PROPERTY_A, priority: 'critical' },
      }),
    );

    expect(mockEventFindMany.mock.calls[0]![0].where.priority).toBeUndefined();
  });

  it('does not set priority filter when parameter is absent', async () => {
    await GET(
      createGetRequest('/api/v1/shift-log', {
        searchParams: { propertyId: PROPERTY_A },
      }),
    );

    expect(mockEventFindMany.mock.calls[0]![0].where.priority).toBeUndefined();
  });
});

// ===========================================================================
// 4. Category filtering
// ===========================================================================

describe('4. Category filtering via customFields JSONB', () => {
  const categories = ['general', 'package', 'visitor', 'maintenance', 'security', 'other'];

  for (const category of categories) {
    it(`filters by category=${category} using JSONB path query`, async () => {
      await GET(
        createGetRequest('/api/v1/shift-log', {
          searchParams: { propertyId: PROPERTY_A, category },
        }),
      );

      const where = mockEventFindMany.mock.calls[0]![0].where;
      expect(where.customFields).toEqual({ path: ['category'], equals: category });
    });
  }

  it('ignores invalid category values', async () => {
    await GET(
      createGetRequest('/api/v1/shift-log', {
        searchParams: { propertyId: PROPERTY_A, category: 'alien' },
      }),
    );

    expect(mockEventFindMany.mock.calls[0]![0].where.customFields).toBeUndefined();
  });

  it('stores category in customFields when creating entry', async () => {
    mockEventCreate.mockResolvedValue(makeEntry());

    await POST(
      createPostRequest('/api/v1/shift-log', {
        ...validBody,
        category: 'security',
      }),
    );

    expect(mockEventCreate.mock.calls[0]![0].data.customFields.category).toBe('security');
  });

  it('defaults category to general when not provided on create', async () => {
    mockEventCreate.mockResolvedValue(makeEntry());

    await POST(createPostRequest('/api/v1/shift-log', validBody));

    expect(mockEventCreate.mock.calls[0]![0].data.customFields.category).toBe('general');
  });
});

// ===========================================================================
// 5. Shift handoff
// ===========================================================================

describe('5. Shift handoff', () => {
  const shiftStart = '2026-03-18T07:00:00.000Z';

  it('returns entries created since shiftStart via OR condition', async () => {
    await GET_HANDOFF(
      createGetRequest('/api/v1/shift-log/handoff', {
        searchParams: { propertyId: PROPERTY_A, shiftStart },
      }),
    );

    const where = mockEventFindMany.mock.calls[0]![0].where;
    expect(where.OR).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ createdAt: { gte: new Date(shiftStart) } }),
      ]),
    );
  });

  it('also includes pinned entries regardless of timestamp', async () => {
    await GET_HANDOFF(
      createGetRequest('/api/v1/shift-log/handoff', {
        searchParams: { propertyId: PROPERTY_A, shiftStart },
      }),
    );

    const where = mockEventFindMany.mock.calls[0]![0].where;
    expect(where.OR).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ customFields: { path: ['pinned'], equals: true } }),
      ]),
    );
  });

  it('scopes to shift_log event type', async () => {
    await GET_HANDOFF(
      createGetRequest('/api/v1/shift-log/handoff', {
        searchParams: { propertyId: PROPERTY_A, shiftStart },
      }),
    );

    expect(mockEventFindMany.mock.calls[0]![0].where.eventType).toEqual({ slug: 'shift_log' });
  });

  it('returns 400 if propertyId is missing', async () => {
    const res = await GET_HANDOFF(
      createGetRequest('/api/v1/shift-log/handoff', {
        searchParams: { shiftStart },
      }),
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 if shiftStart is missing', async () => {
    const res = await GET_HANDOFF(
      createGetRequest('/api/v1/shift-log/handoff', {
        searchParams: { propertyId: PROPERTY_A },
      }),
    );
    expect(res.status).toBe(400);
  });

  it('returns data array directly (not paginated)', async () => {
    mockEventFindMany.mockResolvedValue([makeEntry(), makeEntry({ id: ENTRY_ID_2 })]);

    const res = await GET_HANDOFF(
      createGetRequest('/api/v1/shift-log/handoff', {
        searchParams: { propertyId: PROPERTY_A, shiftStart },
      }),
    );
    const body = await parseResponse<{ data: unknown[] }>(res);

    expect(body.data).toHaveLength(2);
  });
});

// ===========================================================================
// 6. Pin/unpin entries
// ===========================================================================

describe('6. Pin/unpin entries', () => {
  it('pins entry by setting customFields.pinned = true', async () => {
    mockEventFindUnique.mockResolvedValue(makeEntry());
    mockEventUpdate.mockResolvedValue(
      makeEntry({ customFields: { category: 'general', pinned: true, readBy: [] } }),
    );

    const res = await POST_PIN(createPostRequest('/api/v1/shift-log/pin', { pinned: true }), {
      params: Promise.resolve({ id: ENTRY_ID_1 }),
    });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { customFields: { pinned: boolean } } }>(res);
    expect(body.data.customFields.pinned).toBe(true);
  });

  it('unpins entry by setting customFields.pinned = false', async () => {
    mockEventFindUnique.mockResolvedValue(makeEntry({ customFields: { pinned: true } }));
    mockEventUpdate.mockResolvedValue(makeEntry({ customFields: { pinned: false } }));

    const res = await POST_PIN(createPostRequest('/api/v1/shift-log/pin', { pinned: false }), {
      params: Promise.resolve({ id: ENTRY_ID_1 }),
    });
    expect(res.status).toBe(200);
  });

  it('preserves existing customFields when toggling pin', async () => {
    mockEventFindUnique.mockResolvedValue(
      makeEntry({ customFields: { category: 'security', readBy: ['u1'], pinned: false } }),
    );
    mockEventUpdate.mockResolvedValue({});

    await POST_PIN(createPostRequest('/api/v1/shift-log/pin', { pinned: true }), {
      params: Promise.resolve({ id: ENTRY_ID_1 }),
    });

    const updateData = mockEventUpdate.mock.calls[0]![0].data.customFields;
    expect(updateData.category).toBe('security');
    expect(updateData.readBy).toEqual(['u1']);
    expect(updateData.pinned).toBe(true);
  });

  it('returns 404 if entry does not exist', async () => {
    mockEventFindUnique.mockResolvedValue(null);

    const res = await POST_PIN(createPostRequest('/api/v1/shift-log/pin', { pinned: true }), {
      params: Promise.resolve({ id: 'nonexistent-id' }),
    });
    expect(res.status).toBe(404);
  });

  it('returns 400 if pinned field is missing from body', async () => {
    const res = await POST_PIN(createPostRequest('/api/v1/shift-log/pin', {}), {
      params: Promise.resolve({ id: ENTRY_ID_1 }),
    });
    expect(res.status).toBe(400);
  });

  it('returns 400 if pinned is not a boolean', async () => {
    const res = await POST_PIN(createPostRequest('/api/v1/shift-log/pin', { pinned: 'yes' }), {
      params: Promise.resolve({ id: ENTRY_ID_1 }),
    });
    expect(res.status).toBe(400);
  });
});

// ===========================================================================
// 7. Bulk mark-as-read
// ===========================================================================

describe('7. Bulk mark-as-read', () => {
  it('marks multiple unread entries as read for current user', async () => {
    mockEventFindMany.mockResolvedValue([
      makeEntry({ id: ENTRY_ID_1, customFields: { readBy: [] } }),
      makeEntry({ id: ENTRY_ID_2, customFields: { readBy: [] } }),
    ]);
    mockEventUpdate.mockResolvedValue({});

    const res = await POST_MARK_READ(
      createPostRequest('/api/v1/shift-log/mark-read', {
        propertyId: PROPERTY_A,
        entryIds: [ENTRY_ID_1, ENTRY_ID_2],
      }),
    );

    expect(res.status).toBe(200);
    const body = await parseResponse<{ markedCount: number }>(res);
    expect(body.markedCount).toBe(2);
    expect(mockEventUpdate).toHaveBeenCalledTimes(2);
  });

  it('does not duplicate userId if already in readBy array', async () => {
    mockEventFindMany.mockResolvedValue([
      makeEntry({ id: ENTRY_ID_1, customFields: { readBy: [STAFF_USER] } }),
    ]);

    const res = await POST_MARK_READ(
      createPostRequest('/api/v1/shift-log/mark-read', {
        propertyId: PROPERTY_A,
        entryIds: [ENTRY_ID_1],
      }),
    );

    const body = await parseResponse<{ markedCount: number }>(res);
    expect(body.markedCount).toBe(0);
    expect(mockEventUpdate).not.toHaveBeenCalled();
  });

  it('appends userId to existing readBy array preserving others', async () => {
    mockEventFindMany.mockResolvedValue([
      makeEntry({ id: ENTRY_ID_1, customFields: { readBy: [OTHER_USER] } }),
    ]);
    mockEventUpdate.mockResolvedValue({});

    await POST_MARK_READ(
      createPostRequest('/api/v1/shift-log/mark-read', {
        propertyId: PROPERTY_A,
        entryIds: [ENTRY_ID_1],
      }),
    );

    const updateCf = mockEventUpdate.mock.calls[0]![0].data.customFields;
    expect(updateCf.readBy).toContain(STAFF_USER);
    expect(updateCf.readBy).toContain(OTHER_USER);
  });

  it('returns 400 if entryIds is empty array', async () => {
    const res = await POST_MARK_READ(
      createPostRequest('/api/v1/shift-log/mark-read', {
        propertyId: PROPERTY_A,
        entryIds: [],
      }),
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 if propertyId is missing', async () => {
    const res = await POST_MARK_READ(
      createPostRequest('/api/v1/shift-log/mark-read', {
        entryIds: [ENTRY_ID_1],
      }),
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 if entryIds is missing', async () => {
    const res = await POST_MARK_READ(
      createPostRequest('/api/v1/shift-log/mark-read', {
        propertyId: PROPERTY_A,
      }),
    );
    expect(res.status).toBe(400);
  });

  it('scopes findMany to property and shift_log event type', async () => {
    mockEventFindMany.mockResolvedValue([]);

    await POST_MARK_READ(
      createPostRequest('/api/v1/shift-log/mark-read', {
        propertyId: PROPERTY_A,
        entryIds: [ENTRY_ID_1],
      }),
    );

    const where = mockEventFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_A);
    expect(where.eventType).toEqual({ slug: 'shift_log' });
    expect(where.id).toEqual({ in: [ENTRY_ID_1] });
  });
});

// ===========================================================================
// 8. Unread count per user
// ===========================================================================

describe('8. Unread count per user', () => {
  it('counts entries where readBy does not include current userId', async () => {
    mockEventFindMany.mockResolvedValue([
      { id: '1', customFields: { readBy: [STAFF_USER] } },
      { id: '2', customFields: { readBy: [] } },
      { id: '3', customFields: { readBy: [OTHER_USER] } },
      { id: '4', customFields: { readBy: [STAFF_USER, OTHER_USER] } },
      { id: '5', customFields: {} },
    ]);

    const res = await GET_UNREAD_COUNT(
      createGetRequest('/api/v1/shift-log/unread-count', {
        searchParams: { propertyId: PROPERTY_A },
      }),
    );
    const body = await parseResponse<{ unreadCount: number }>(res);

    expect(body.unreadCount).toBe(3); // entries 2, 3, 5
  });

  it('returns 0 when all entries are read by current user', async () => {
    mockEventFindMany.mockResolvedValue([
      { id: '1', customFields: { readBy: [STAFF_USER] } },
      { id: '2', customFields: { readBy: [STAFF_USER] } },
    ]);

    const res = await GET_UNREAD_COUNT(
      createGetRequest('/api/v1/shift-log/unread-count', {
        searchParams: { propertyId: PROPERTY_A },
      }),
    );
    const body = await parseResponse<{ unreadCount: number }>(res);

    expect(body.unreadCount).toBe(0);
  });

  it('returns 0 when there are no entries', async () => {
    mockEventFindMany.mockResolvedValue([]);

    const res = await GET_UNREAD_COUNT(
      createGetRequest('/api/v1/shift-log/unread-count', {
        searchParams: { propertyId: PROPERTY_A },
      }),
    );
    const body = await parseResponse<{ unreadCount: number }>(res);

    expect(body.unreadCount).toBe(0);
  });

  it('returns 400 when propertyId is missing', async () => {
    const res = await GET_UNREAD_COUNT(createGetRequest('/api/v1/shift-log/unread-count'));
    expect(res.status).toBe(400);
  });

  it('handles entries with null customFields gracefully', async () => {
    mockEventFindMany.mockResolvedValue([{ id: '1', customFields: null }]);

    const res = await GET_UNREAD_COUNT(
      createGetRequest('/api/v1/shift-log/unread-count', {
        searchParams: { propertyId: PROPERTY_A },
      }),
    );
    const body = await parseResponse<{ unreadCount: number }>(res);

    expect(body.unreadCount).toBe(1);
  });

  it('handles entries with readBy as non-array gracefully', async () => {
    mockEventFindMany.mockResolvedValue([{ id: '1', customFields: { readBy: 'not-an-array' } }]);

    const res = await GET_UNREAD_COUNT(
      createGetRequest('/api/v1/shift-log/unread-count', {
        searchParams: { propertyId: PROPERTY_A },
      }),
    );
    const body = await parseResponse<{ unreadCount: number }>(res);

    expect(body.unreadCount).toBe(1);
  });
});

// ===========================================================================
// 9. XSS prevention on content
// ===========================================================================

describe('9. XSS prevention on content', () => {
  it('strips <script> tags from content before storing', async () => {
    mockEventCreate.mockResolvedValue(makeEntry());

    await POST(
      createPostRequest('/api/v1/shift-log', {
        ...validBody,
        content: '<script>alert("xss")</script>Safe content',
      }),
    );

    const desc = mockEventCreate.mock.calls[0]![0].data.description;
    expect(desc).not.toContain('<script>');
    expect(desc).toContain('Safe content');
  });

  it('strips <img onerror> payloads from content', async () => {
    mockEventCreate.mockResolvedValue(makeEntry());

    await POST(
      createPostRequest('/api/v1/shift-log', {
        ...validBody,
        content: '<img src=x onerror=alert(1)>Real text',
      }),
    );

    const desc = mockEventCreate.mock.calls[0]![0].data.description;
    expect(desc).not.toContain('<img');
    expect(desc).not.toContain('onerror');
  });

  it('strips nested HTML divs and bold tags', async () => {
    mockEventCreate.mockResolvedValue(makeEntry());

    await POST(
      createPostRequest('/api/v1/shift-log', {
        ...validBody,
        content: '<div><b>Bold</b> text</div>',
      }),
    );

    const desc = mockEventCreate.mock.calls[0]![0].data.description;
    expect(desc).not.toContain('<div>');
    expect(desc).not.toContain('<b>');
    expect(desc).toContain('text');
  });

  it('strips null bytes from content', async () => {
    mockEventCreate.mockResolvedValue(makeEntry());

    await POST(
      createPostRequest('/api/v1/shift-log', {
        ...validBody,
        content: 'Hello\x00World',
      }),
    );

    const desc = mockEventCreate.mock.calls[0]![0].data.description;
    expect(desc).not.toContain('\x00');
  });

  it('preserves legitimate text after stripping', async () => {
    mockEventCreate.mockResolvedValue(makeEntry());

    await POST(
      createPostRequest('/api/v1/shift-log', {
        ...validBody,
        content: 'Water leak <b>reported</b> in <script>evil()</script>lobby',
      }),
    );

    const desc = mockEventCreate.mock.calls[0]![0].data.description;
    expect(desc).toContain('Water leak');
    expect(desc).toContain('lobby');
  });
});

// ===========================================================================
// 10. Pagination and meta
// ===========================================================================

describe('10. Pagination and meta', () => {
  it('defaults to page 1, pageSize 20', async () => {
    mockEventCount.mockResolvedValue(0);

    const res = await GET(
      createGetRequest('/api/v1/shift-log', {
        searchParams: { propertyId: PROPERTY_A },
      }),
    );
    const body = await parseResponse<{ meta: { page: number; pageSize: number } }>(res);

    expect(body.meta.page).toBe(1);
    expect(body.meta.pageSize).toBe(20);
  });

  it('calculates skip correctly for page 3 with pageSize 10', async () => {
    mockEventCount.mockResolvedValue(100);

    await GET(
      createGetRequest('/api/v1/shift-log', {
        searchParams: { propertyId: PROPERTY_A, page: '3', pageSize: '10' },
      }),
    );

    const call = mockEventFindMany.mock.calls[0]![0];
    expect(call.skip).toBe(20);
    expect(call.take).toBe(10);
  });

  it('returns totalPages in meta based on total and pageSize', async () => {
    mockEventCount.mockResolvedValue(55);

    const res = await GET(
      createGetRequest('/api/v1/shift-log', {
        searchParams: { propertyId: PROPERTY_A },
      }),
    );
    const body = await parseResponse<{ meta: { totalPages: number; total: number } }>(res);

    expect(body.meta.totalPages).toBe(3); // ceil(55/20)
    expect(body.meta.total).toBe(55);
  });

  it('returns empty data array and zero total when no entries exist', async () => {
    const res = await GET(
      createGetRequest('/api/v1/shift-log', {
        searchParams: { propertyId: PROPERTY_A },
      }),
    );
    const body = await parseResponse<{ data: unknown[]; meta: { total: number } }>(res);

    expect(body.data).toEqual([]);
    expect(body.meta.total).toBe(0);
  });
});

// ===========================================================================
// 11. Tenant isolation
// ===========================================================================

describe('11. Tenant isolation and property scoping', () => {
  it('returns 400 when propertyId is missing from GET', async () => {
    const res = await GET(createGetRequest('/api/v1/shift-log'));
    expect(res.status).toBe(400);
    expect(mockEventFindMany).not.toHaveBeenCalled();
  });

  it('filters by propertyId in where clause', async () => {
    await GET(
      createGetRequest('/api/v1/shift-log', {
        searchParams: { propertyId: PROPERTY_A },
      }),
    );

    expect(mockEventFindMany.mock.calls[0]![0].where.propertyId).toBe(PROPERTY_A);
  });

  it('filters by deletedAt: null to exclude soft-deleted', async () => {
    await GET(
      createGetRequest('/api/v1/shift-log', {
        searchParams: { propertyId: PROPERTY_A },
      }),
    );

    expect(mockEventFindMany.mock.calls[0]![0].where.deletedAt).toBeNull();
  });

  it('scopes to shift_log event type via slug filter', async () => {
    await GET(
      createGetRequest('/api/v1/shift-log', {
        searchParams: { propertyId: PROPERTY_A },
      }),
    );

    expect(mockEventFindMany.mock.calls[0]![0].where.eventType).toEqual({ slug: 'shift_log' });
  });

  it('property B search does not return property A results', async () => {
    await GET(
      createGetRequest('/api/v1/shift-log', {
        searchParams: { propertyId: PROPERTY_B },
      }),
    );

    expect(mockEventFindMany.mock.calls[0]![0].where.propertyId).toBe(PROPERTY_B);
  });
});

// ===========================================================================
// 12. Validation and edge cases
// ===========================================================================

describe('12. Validation and edge cases', () => {
  it('rejects empty body on POST', async () => {
    const res = await POST(createPostRequest('/api/v1/shift-log', {}));
    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('rejects missing content field', async () => {
    const res = await POST(createPostRequest('/api/v1/shift-log', { propertyId: PROPERTY_A }));
    expect(res.status).toBe(400);
  });

  it('rejects empty string content (min 1 char)', async () => {
    const res = await POST(
      createPostRequest('/api/v1/shift-log', {
        propertyId: PROPERTY_A,
        content: '',
      }),
    );
    expect(res.status).toBe(400);
  });

  it('accepts content with exactly 1 character', async () => {
    mockEventCreate.mockResolvedValue(makeEntry());

    const res = await POST(
      createPostRequest('/api/v1/shift-log', {
        propertyId: PROPERTY_A,
        content: 'X',
      }),
    );
    expect(res.status).toBe(201);
  });

  it('rejects invalid UUID for propertyId', async () => {
    const res = await POST(
      createPostRequest('/api/v1/shift-log', {
        propertyId: 'not-a-uuid',
        content: 'test',
      }),
    );
    expect(res.status).toBe(400);
  });

  it('rejects invalid priority values on create', async () => {
    const res = await POST(
      createPostRequest('/api/v1/shift-log', {
        ...validBody,
        priority: 'super-duper',
      }),
    );
    expect(res.status).toBe(400);
  });

  it('rejects invalid category values on create', async () => {
    const res = await POST(
      createPostRequest('/api/v1/shift-log', {
        ...validBody,
        category: 'nonexistent',
      }),
    );
    expect(res.status).toBe(400);
  });

  it('accepts mentionedUnitId as UUID in customFields', async () => {
    mockEventCreate.mockResolvedValue(makeEntry());

    await POST(
      createPostRequest('/api/v1/shift-log', {
        ...validBody,
        mentionedUnitId: UNIT_ID,
      }),
    );

    expect(mockEventCreate.mock.calls[0]![0].data.customFields.mentionedUnitId).toBe(UNIT_ID);
  });

  it('accepts mentionedResidentId as UUID in customFields', async () => {
    mockEventCreate.mockResolvedValue(makeEntry());

    await POST(
      createPostRequest('/api/v1/shift-log', {
        ...validBody,
        mentionedResidentId: RESIDENT_ID,
      }),
    );

    expect(mockEventCreate.mock.calls[0]![0].data.customFields.mentionedResidentId).toBe(
      RESIDENT_ID,
    );
  });

  it('returns 500 with safe error message on database failure', async () => {
    mockEventCreate.mockRejectedValue(new Error('FK: eventTypeId not found'));

    const res = await POST(createPostRequest('/api/v1/shift-log', validBody));
    expect(res.status).toBe(500);

    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).not.toContain('FK');
  });

  it('GET returns 500 with safe message on database error', async () => {
    mockEventFindMany.mockRejectedValue(new Error('timeout'));

    const res = await GET(
      createGetRequest('/api/v1/shift-log', {
        searchParams: { propertyId: PROPERTY_A },
      }),
    );
    expect(res.status).toBe(500);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('INTERNAL_ERROR');
  });

  it('date range filtering applies both dateFrom and dateTo', async () => {
    const dateFrom = '2026-03-01T00:00:00Z';
    const dateTo = '2026-03-15T23:59:59Z';

    await GET(
      createGetRequest('/api/v1/shift-log', {
        searchParams: { propertyId: PROPERTY_A, dateFrom, dateTo },
      }),
    );

    const where = mockEventFindMany.mock.calls[0]![0].where;
    expect(where.createdAt.gte).toEqual(new Date(dateFrom));
    expect(where.createdAt.lte).toEqual(new Date(dateTo));
  });

  it('date range filtering applies only dateFrom when dateTo is absent', async () => {
    await GET(
      createGetRequest('/api/v1/shift-log', {
        searchParams: { propertyId: PROPERTY_A, dateFrom: '2026-03-10T00:00:00Z' },
      }),
    );

    const where = mockEventFindMany.mock.calls[0]![0].where;
    expect(where.createdAt.gte).toBeDefined();
    expect(where.createdAt.lte).toBeUndefined();
  });
});
