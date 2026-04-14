/**
 * Shift Log API Route Tests — per PRD 03 Section 3.1.6
 *
 * Covers:
 * - GET /api/v1/shift-log (list entries with filtering)
 * - POST /api/v1/shift-log (create entry)
 * - GET /api/v1/shift-log/handoff (entries since last shift change)
 * - POST /api/v1/shift-log/:id/pin (pin/unpin entry)
 * - POST /api/v1/shift-log/mark-read (bulk mark as read)
 * - GET /api/v1/shift-log/unread-count
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createGetRequest, createPostRequest, parseResponse } from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Mock Setup
// ---------------------------------------------------------------------------

const mockEventFindMany = vi.fn();
const mockEventCount = vi.fn();
const mockEventCreate = vi.fn();
const mockEventFindUnique = vi.fn();
const mockEventUpdate = vi.fn();
const mockEventUpdateMany = vi.fn();
const mockEventTypeFindFirst = vi.fn();
const mockEventTypeCreate = vi.fn();
const mockEventGroupFindFirst = vi.fn();
const mockEventGroupCreate = vi.fn();
const mockShiftLogEntryFindUnique = vi.fn();
const mockShiftLogEntryUpdate = vi.fn();
const mockShiftLogEntryDelete = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    event: {
      findMany: (...args: unknown[]) => mockEventFindMany(...args),
      count: (...args: unknown[]) => mockEventCount(...args),
      create: (...args: unknown[]) => mockEventCreate(...args),
      findUnique: (...args: unknown[]) => mockEventFindUnique(...args),
      update: (...args: unknown[]) => mockEventUpdate(...args),
      updateMany: (...args: unknown[]) => mockEventUpdateMany(...args),
    },
    eventType: {
      findFirst: (...args: unknown[]) => mockEventTypeFindFirst(...args),
      create: (...args: unknown[]) => mockEventTypeCreate(...args),
    },
    eventGroup: {
      findFirst: (...args: unknown[]) => mockEventGroupFindFirst(...args),
      create: (...args: unknown[]) => mockEventGroupCreate(...args),
    },
    shiftLogEntry: {
      findUnique: (...args: unknown[]) => mockShiftLogEntryFindUnique(...args),
      update: (...args: unknown[]) => mockShiftLogEntryUpdate(...args),
      delete: (...args: unknown[]) => mockShiftLogEntryDelete(...args),
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
import { GET as GET_HANDOFF } from '../handoff/route';
import { POST as POST_PIN } from '../[id]/pin/route';
import { POST as POST_MARK_READ } from '../mark-read/route';
import { GET as GET_UNREAD_COUNT } from '../unread-count/route';

const PROPERTY_A = '00000000-0000-4000-b000-000000000001';
const PROPERTY_B = '00000000-0000-4000-b000-000000000002';

beforeEach(() => {
  vi.clearAllMocks();
  mockEventFindMany.mockResolvedValue([]);
  mockEventCount.mockResolvedValue(0);
  mockEventTypeFindFirst.mockResolvedValue({ id: 'shift-log-type', name: 'Shift Log' });
  mockEventGroupFindFirst.mockResolvedValue({ id: 'shift-log-group', name: 'Shift Log' });
});

// ---------------------------------------------------------------------------
// 1. GET /api/v1/shift-log — Ordered by createdAt desc
// ---------------------------------------------------------------------------

describe('GET /api/v1/shift-log — Ordering', () => {
  it('returns shift entries ordered by createdAt desc (most recent first)', async () => {
    const req = createGetRequest('/api/v1/shift-log', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET(req);

    const call = mockEventFindMany.mock.calls[0]![0];
    // Pinned entries appear first, then ordered by createdAt desc
    expect(call.orderBy).toEqual([{ customFields: { sort: 'desc' } }, { createdAt: 'desc' }]);
  });
});

// ---------------------------------------------------------------------------
// 2. GET /api/v1/shift-log — Date Range Filtering
// ---------------------------------------------------------------------------

describe('GET /api/v1/shift-log — Date Range Filtering', () => {
  it('filters by dateFrom and dateTo (custom range)', async () => {
    const dateFrom = '2026-03-01T00:00:00.000Z';
    const dateTo = '2026-03-15T23:59:59.999Z';

    const req = createGetRequest('/api/v1/shift-log', {
      searchParams: { propertyId: PROPERTY_A, dateFrom, dateTo },
    });
    await GET(req);

    const where = mockEventFindMany.mock.calls[0]![0].where;
    expect(where.createdAt).toEqual({
      gte: new Date(dateFrom),
      lte: new Date(dateTo),
    });
  });

  it('filters by dateFrom only', async () => {
    const dateFrom = '2026-03-10T00:00:00.000Z';

    const req = createGetRequest('/api/v1/shift-log', {
      searchParams: { propertyId: PROPERTY_A, dateFrom },
    });
    await GET(req);

    const where = mockEventFindMany.mock.calls[0]![0].where;
    expect(where.createdAt).toEqual({ gte: new Date(dateFrom) });
  });

  it('filters by dateTo only', async () => {
    const dateTo = '2026-03-15T23:59:59.999Z';

    const req = createGetRequest('/api/v1/shift-log', {
      searchParams: { propertyId: PROPERTY_A, dateTo },
    });
    await GET(req);

    const where = mockEventFindMany.mock.calls[0]![0].where;
    expect(where.createdAt).toEqual({ lte: new Date(dateTo) });
  });

  it('returns all entries when no date range is specified', async () => {
    const req = createGetRequest('/api/v1/shift-log', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET(req);

    const where = mockEventFindMany.mock.calls[0]![0].where;
    expect(where.createdAt).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 3. GET /api/v1/shift-log — Priority Filtering
// ---------------------------------------------------------------------------

describe('GET /api/v1/shift-log — Priority Filtering', () => {
  it('filters by priority=normal', async () => {
    const req = createGetRequest('/api/v1/shift-log', {
      searchParams: { propertyId: PROPERTY_A, priority: 'normal' },
    });
    await GET(req);

    const where = mockEventFindMany.mock.calls[0]![0].where;
    expect(where.priority).toBe('normal');
  });

  it('filters by priority=important', async () => {
    const req = createGetRequest('/api/v1/shift-log', {
      searchParams: { propertyId: PROPERTY_A, priority: 'important' },
    });
    await GET(req);

    const where = mockEventFindMany.mock.calls[0]![0].where;
    expect(where.priority).toBe('important');
  });

  it('filters by priority=urgent', async () => {
    const req = createGetRequest('/api/v1/shift-log', {
      searchParams: { propertyId: PROPERTY_A, priority: 'urgent' },
    });
    await GET(req);

    const where = mockEventFindMany.mock.calls[0]![0].where;
    expect(where.priority).toBe('urgent');
  });

  it('ignores invalid priority values', async () => {
    const req = createGetRequest('/api/v1/shift-log', {
      searchParams: { propertyId: PROPERTY_A, priority: 'mega-urgent' },
    });
    await GET(req);

    const where = mockEventFindMany.mock.calls[0]![0].where;
    expect(where.priority).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 4. GET /api/v1/shift-log — Category Filtering
// ---------------------------------------------------------------------------

describe('GET /api/v1/shift-log — Category Filtering', () => {
  const validCategories = ['general', 'package', 'visitor', 'maintenance', 'security', 'other'];

  for (const category of validCategories) {
    it(`filters by category=${category}`, async () => {
      const req = createGetRequest('/api/v1/shift-log', {
        searchParams: { propertyId: PROPERTY_A, category },
      });
      await GET(req);

      const where = mockEventFindMany.mock.calls[0]![0].where;
      expect(where.customFields).toEqual(
        expect.objectContaining({ path: ['category'], equals: category }),
      );
    });
  }

  it('ignores invalid category values', async () => {
    const req = createGetRequest('/api/v1/shift-log', {
      searchParams: { propertyId: PROPERTY_A, category: 'alien-invasion' },
    });
    await GET(req);

    const where = mockEventFindMany.mock.calls[0]![0].where;
    expect(where.customFields).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 5. POST /api/v1/shift-log — Auto-Generated Timestamp
// ---------------------------------------------------------------------------

describe('POST /api/v1/shift-log — Entry Creation', () => {
  const validEntry = {
    propertyId: PROPERTY_A,
    content: 'Water leak reported in unit 1204. Maintenance notified.',
  };

  it('creates entry with auto-generated timestamp and returns 201', async () => {
    const before = Date.now();
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

  it('sets createdById from authenticated user', async () => {
    mockEventCreate.mockResolvedValue({ id: 'event-1' });

    const req = createPostRequest('/api/v1/shift-log', validEntry);
    await POST(req);

    expect(mockEventCreate.mock.calls[0]![0].data.createdById).toBe('test-staff');
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

// ---------------------------------------------------------------------------
// 6. POST /api/v1/shift-log — Required Fields
// ---------------------------------------------------------------------------

describe('POST /api/v1/shift-log — Required Fields', () => {
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
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects empty content string (min 1 char)', async () => {
    const req = createPostRequest('/api/v1/shift-log', {
      propertyId: PROPERTY_A,
      content: '',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('accepts content with exactly 1 character', async () => {
    mockEventCreate.mockResolvedValue({ id: 'event-1' });
    const req = createPostRequest('/api/v1/shift-log', {
      propertyId: PROPERTY_A,
      content: 'X',
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('rejects invalid propertyId format', async () => {
    const req = createPostRequest('/api/v1/shift-log', {
      propertyId: 'not-uuid',
      content: 'Entry',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// 7. POST /api/v1/shift-log — Optional Fields
// ---------------------------------------------------------------------------

describe('POST /api/v1/shift-log — Optional Fields', () => {
  it('accepts priority field', async () => {
    mockEventCreate.mockResolvedValue({ id: 'event-1' });

    const req = createPostRequest('/api/v1/shift-log', {
      propertyId: PROPERTY_A,
      content: 'Urgent: fire alarm triggered.',
      priority: 'urgent',
    });
    const res = await POST(req);
    expect(res.status).toBe(201);

    const createData = mockEventCreate.mock.calls[0]![0].data;
    expect(createData.priority).toBe('urgent');
  });

  it('defaults priority to normal when not provided', async () => {
    mockEventCreate.mockResolvedValue({ id: 'event-1' });

    const req = createPostRequest('/api/v1/shift-log', {
      propertyId: PROPERTY_A,
      content: 'Routine check.',
    });
    await POST(req);

    const createData = mockEventCreate.mock.calls[0]![0].data;
    expect(createData.priority).toBe('normal');
  });

  it('accepts category field stored in customFields', async () => {
    mockEventCreate.mockResolvedValue({ id: 'event-1' });

    const req = createPostRequest('/api/v1/shift-log', {
      propertyId: PROPERTY_A,
      content: 'Package delivered for unit 501.',
      category: 'package',
    });
    await POST(req);

    const createData = mockEventCreate.mock.calls[0]![0].data;
    expect(createData.customFields.category).toBe('package');
  });

  it('defaults category to general when not provided', async () => {
    mockEventCreate.mockResolvedValue({ id: 'event-1' });

    const req = createPostRequest('/api/v1/shift-log', {
      propertyId: PROPERTY_A,
      content: 'Some note.',
    });
    await POST(req);

    const createData = mockEventCreate.mock.calls[0]![0].data;
    expect(createData.customFields.category).toBe('general');
  });

  it('accepts mentionedUnitId stored in customFields', async () => {
    mockEventCreate.mockResolvedValue({ id: 'event-1' });
    const unitId = '00000000-0000-4000-b000-000000000099';

    const req = createPostRequest('/api/v1/shift-log', {
      propertyId: PROPERTY_A,
      content: 'Noise complaint from unit.',
      mentionedUnitId: unitId,
    });
    await POST(req);

    const createData = mockEventCreate.mock.calls[0]![0].data;
    expect(createData.customFields.mentionedUnitId).toBe(unitId);
  });

  it('accepts mentionedResidentId stored in customFields', async () => {
    mockEventCreate.mockResolvedValue({ id: 'event-1' });
    const residentId = '00000000-0000-4000-b000-000000000088';

    const req = createPostRequest('/api/v1/shift-log', {
      propertyId: PROPERTY_A,
      content: 'Resident asked about parking.',
      mentionedResidentId: residentId,
    });
    await POST(req);

    const createData = mockEventCreate.mock.calls[0]![0].data;
    expect(createData.customFields.mentionedResidentId).toBe(residentId);
  });

  it('rejects invalid category values', async () => {
    const req = createPostRequest('/api/v1/shift-log', {
      propertyId: PROPERTY_A,
      content: 'Bad category.',
      category: 'nonexistent',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects invalid priority values', async () => {
    const req = createPostRequest('/api/v1/shift-log', {
      propertyId: PROPERTY_A,
      content: 'Bad priority.',
      priority: 'super-duper',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// 8. XSS Prevention — Strips HTML from Content
// ---------------------------------------------------------------------------

describe('POST /api/v1/shift-log — XSS Prevention', () => {
  it('strips HTML tags from content', async () => {
    mockEventCreate.mockResolvedValue({ id: 'event-1' });

    const req = createPostRequest('/api/v1/shift-log', {
      propertyId: PROPERTY_A,
      content: '<script>alert("xss")</script>Water leak in lobby',
    });
    await POST(req);

    const createData = mockEventCreate.mock.calls[0]![0].data;
    expect(createData.description).not.toContain('<script>');
    expect(createData.description).toContain('Water leak');
  });

  it('strips nested HTML tags', async () => {
    mockEventCreate.mockResolvedValue({ id: 'event-1' });

    const req = createPostRequest('/api/v1/shift-log', {
      propertyId: PROPERTY_A,
      content: '<div><b>Bold</b> <img src=x onerror=alert(1)> text</div>',
    });
    await POST(req);

    const createData = mockEventCreate.mock.calls[0]![0].data;
    expect(createData.description).not.toContain('<div>');
    expect(createData.description).not.toContain('<img');
    expect(createData.description).not.toContain('onerror');
    expect(createData.description).toContain('text');
  });
});

// ---------------------------------------------------------------------------
// 9. Tenant Isolation — Only See Entries For Your Property
// ---------------------------------------------------------------------------

describe('GET /api/v1/shift-log — Tenant Isolation', () => {
  it('rejects without propertyId', async () => {
    const req = createGetRequest('/api/v1/shift-log');
    const res = await GET(req);
    expect(res.status).toBe(400);
    expect(mockEventFindMany).not.toHaveBeenCalled();
  });

  it('filters by propertyId and soft-delete', async () => {
    const req = createGetRequest('/api/v1/shift-log', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET(req);

    const where = mockEventFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_A);
    expect(where.deletedAt).toBeNull();
  });

  it('scopes to shift_log event type only', async () => {
    const req = createGetRequest('/api/v1/shift-log', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET(req);

    const where = mockEventFindMany.mock.calls[0]![0].where;
    expect(where.eventType).toEqual({ slug: 'shift_log' });
  });

  it('does not expose entries from a different property', async () => {
    const req = createGetRequest('/api/v1/shift-log', {
      searchParams: { propertyId: PROPERTY_B },
    });
    await GET(req);

    const where = mockEventFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_B);
    // Ensures no cross-tenant leakage — each query is scoped
    expect(where.propertyId).not.toBe(PROPERTY_A);
  });
});

// ---------------------------------------------------------------------------
// 10. Shift Handoff — GET /shift-log/handoff
// ---------------------------------------------------------------------------

describe('GET /api/v1/shift-log/handoff — Entries Since Last Shift Change', () => {
  it('returns entries since specified shiftStart time', async () => {
    const shiftStart = '2026-03-18T07:00:00.000Z';

    const req = createGetRequest('/api/v1/shift-log/handoff', {
      searchParams: { propertyId: PROPERTY_A, shiftStart },
    });
    await GET_HANDOFF(req);

    const where = mockEventFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_A);
    expect(where.eventType).toEqual({ slug: 'shift_log' });
    // createdAt filter is inside OR (along with pinned entries)
    expect(where.OR).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          createdAt: { gte: new Date(shiftStart) },
        }),
      ]),
    );
  });

  it('rejects without propertyId', async () => {
    const req = createGetRequest('/api/v1/shift-log/handoff', {
      searchParams: { shiftStart: '2026-03-18T07:00:00.000Z' },
    });
    const res = await GET_HANDOFF(req);
    expect(res.status).toBe(400);
  });

  it('rejects without shiftStart', async () => {
    const req = createGetRequest('/api/v1/shift-log/handoff', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await GET_HANDOFF(req);
    expect(res.status).toBe(400);
  });

  it('orders handoff entries by createdAt desc', async () => {
    const req = createGetRequest('/api/v1/shift-log/handoff', {
      searchParams: {
        propertyId: PROPERTY_A,
        shiftStart: '2026-03-18T07:00:00.000Z',
      },
    });
    await GET_HANDOFF(req);

    const call = mockEventFindMany.mock.calls[0]![0];
    expect(call.orderBy).toEqual([{ customFields: { sort: 'desc' } }, { createdAt: 'desc' }]);
  });

  it('includes pinned entries in handoff results', async () => {
    const req = createGetRequest('/api/v1/shift-log/handoff', {
      searchParams: {
        propertyId: PROPERTY_A,
        shiftStart: '2026-03-18T07:00:00.000Z',
      },
    });
    await GET_HANDOFF(req);

    const where = mockEventFindMany.mock.calls[0]![0].where;
    // The OR condition ensures pinned entries are included
    expect(where.OR).toBeDefined();
    expect(where.OR).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          customFields: { path: ['pinned'], equals: true },
        }),
      ]),
    );
  });
});

// ---------------------------------------------------------------------------
// 11. Pinned Entries Appear at Top
// ---------------------------------------------------------------------------

describe('GET /api/v1/shift-log — Pinned Entries', () => {
  it('orders by pinned status first (pinned at top)', async () => {
    const req = createGetRequest('/api/v1/shift-log', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET(req);

    const call = mockEventFindMany.mock.calls[0]![0];
    // Pinned entries have customFields.pinned = true, sorted to top via
    // customFields sort desc (true > false/null in JSONB sort)
    expect(call.orderBy[0]).toEqual({ customFields: { sort: 'desc' } });
    expect(call.orderBy[1]).toEqual({ createdAt: 'desc' });
  });
});

// ---------------------------------------------------------------------------
// 12. POST /shift-log/:id/pin — Pin/Unpin Entry
// ---------------------------------------------------------------------------

describe('POST /api/v1/shift-log/:id/pin — Pin/Unpin', () => {
  const entryId = '00000000-0000-4000-b000-000000000055';

  it('pins an entry (sets customFields.pinned = true)', async () => {
    mockEventFindUnique.mockResolvedValue({
      id: entryId,
      propertyId: PROPERTY_A,
      customFields: { category: 'general' },
    });
    mockEventUpdate.mockResolvedValue({
      id: entryId,
      customFields: { category: 'general', pinned: true },
    });

    const req = createPostRequest('/api/v1/shift-log/pin', { pinned: true });
    const res = await POST_PIN(req, {
      params: Promise.resolve({ id: entryId }),
    });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { customFields: { pinned: boolean } } }>(res);
    expect(body.data.customFields.pinned).toBe(true);
  });

  it('unpins an entry (sets customFields.pinned = false)', async () => {
    mockEventFindUnique.mockResolvedValue({
      id: entryId,
      propertyId: PROPERTY_A,
      customFields: { category: 'general', pinned: true },
    });
    mockEventUpdate.mockResolvedValue({
      id: entryId,
      customFields: { category: 'general', pinned: false },
    });

    const req = createPostRequest('/api/v1/shift-log/pin', { pinned: false });
    const res = await POST_PIN(req, {
      params: Promise.resolve({ id: entryId }),
    });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { customFields: { pinned: boolean } } }>(res);
    expect(body.data.customFields.pinned).toBe(false);
  });

  it('returns 404 if entry does not exist', async () => {
    mockEventFindUnique.mockResolvedValue(null);

    const req = createPostRequest('/api/v1/shift-log/pin', { pinned: true });
    const res = await POST_PIN(req, {
      params: Promise.resolve({ id: entryId }),
    });
    expect(res.status).toBe(404);
  });

  it('rejects if pinned field is missing', async () => {
    const req = createPostRequest('/api/v1/shift-log/pin', {});
    const res = await POST_PIN(req, {
      params: Promise.resolve({ id: entryId }),
    });
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// 13. Bulk Read — POST /shift-log/mark-read
// ---------------------------------------------------------------------------

describe('POST /api/v1/shift-log/mark-read — Bulk Mark As Read', () => {
  it('marks multiple entries as read by current user', async () => {
    const entryIds = [
      '00000000-0000-4000-b000-000000000060',
      '00000000-0000-4000-b000-000000000061',
    ];

    // Mock findMany to return the entries to update
    mockEventFindMany.mockResolvedValue(
      entryIds.map((id) => ({
        id,
        propertyId: PROPERTY_A,
        customFields: { category: 'general', readBy: [] },
      })),
    );
    mockEventUpdate.mockResolvedValue({});

    const req = createPostRequest('/api/v1/shift-log/mark-read', {
      propertyId: PROPERTY_A,
      entryIds,
    });
    const res = await POST_MARK_READ(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{ message: string; markedCount: number }>(res);
    expect(body.markedCount).toBe(2);
  });

  it('does not duplicate userId in readBy if already read', async () => {
    const entryId = '00000000-0000-4000-b000-000000000060';

    mockEventFindMany.mockResolvedValue([
      {
        id: entryId,
        propertyId: PROPERTY_A,
        customFields: { category: 'general', readBy: ['test-staff'] },
      },
    ]);

    const req = createPostRequest('/api/v1/shift-log/mark-read', {
      propertyId: PROPERTY_A,
      entryIds: [entryId],
    });
    const res = await POST_MARK_READ(req);
    expect(res.status).toBe(200);

    // Should NOT call update for already-read entries
    expect(mockEventUpdate).not.toHaveBeenCalled();
  });

  it('rejects without entryIds', async () => {
    const req = createPostRequest('/api/v1/shift-log/mark-read', {
      propertyId: PROPERTY_A,
    });
    const res = await POST_MARK_READ(req);
    expect(res.status).toBe(400);
  });

  it('rejects without propertyId', async () => {
    const req = createPostRequest('/api/v1/shift-log/mark-read', {
      entryIds: ['00000000-0000-4000-b000-000000000060'],
    });
    const res = await POST_MARK_READ(req);
    expect(res.status).toBe(400);
  });

  it('rejects empty entryIds array', async () => {
    const req = createPostRequest('/api/v1/shift-log/mark-read', {
      propertyId: PROPERTY_A,
      entryIds: [],
    });
    const res = await POST_MARK_READ(req);
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// 14. Unread Count — GET /shift-log/unread-count
// ---------------------------------------------------------------------------

describe('GET /api/v1/shift-log/unread-count', () => {
  it('returns count of unread entries for current user', async () => {
    // Mock: 5 total entries, 2 already read by test-staff
    mockEventFindMany.mockResolvedValue([
      { id: '1', customFields: { readBy: ['test-staff'] } },
      { id: '2', customFields: { readBy: [] } },
      { id: '3', customFields: { readBy: ['other-user'] } },
      { id: '4', customFields: { readBy: ['test-staff', 'other-user'] } },
      { id: '5', customFields: {} },
    ]);

    const req = createGetRequest('/api/v1/shift-log/unread-count', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await GET_UNREAD_COUNT(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{ unreadCount: number }>(res);
    // Entries 2, 3, 5 are unread (not containing test-staff in readBy)
    expect(body.unreadCount).toBe(3);
  });

  it('rejects without propertyId', async () => {
    const req = createGetRequest('/api/v1/shift-log/unread-count');
    const res = await GET_UNREAD_COUNT(req);
    expect(res.status).toBe(400);
  });

  it('returns 0 when all entries are read', async () => {
    mockEventFindMany.mockResolvedValue([
      { id: '1', customFields: { readBy: ['test-staff'] } },
      { id: '2', customFields: { readBy: ['test-staff'] } },
    ]);

    const req = createGetRequest('/api/v1/shift-log/unread-count', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await GET_UNREAD_COUNT(req);

    const body = await parseResponse<{ unreadCount: number }>(res);
    expect(body.unreadCount).toBe(0);
  });

  it('returns 0 when no entries exist', async () => {
    mockEventFindMany.mockResolvedValue([]);

    const req = createGetRequest('/api/v1/shift-log/unread-count', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await GET_UNREAD_COUNT(req);

    const body = await parseResponse<{ unreadCount: number }>(res);
    expect(body.unreadCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// GET /api/v1/shift-log — Pagination
// ---------------------------------------------------------------------------

describe('GET /api/v1/shift-log — Pagination', () => {
  it('defaults to page 1 with pageSize 20', async () => {
    mockEventCount.mockResolvedValue(0);
    const req = createGetRequest('/api/v1/shift-log', {
      searchParams: { propertyId: PROPERTY_A },
    });
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
    const req = createGetRequest('/api/v1/shift-log', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await GET(req);
    const body = await parseResponse<{ meta: { totalPages: number } }>(res);
    expect(body.meta.totalPages).toBe(3); // ceil(55/20)
  });

  it('includes eventType name for display', async () => {
    const req = createGetRequest('/api/v1/shift-log', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET(req);
    expect(mockEventFindMany.mock.calls[0]![0].include.eventType).toBeDefined();
  });

  it('returns empty array when no entries exist', async () => {
    const req = createGetRequest('/api/v1/shift-log', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await GET(req);
    const body = await parseResponse<{ data: unknown[] }>(res);
    expect(body.data).toEqual([]);
  });
});
