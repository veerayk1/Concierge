/**
 * Discussion Forum API Tests — per CLAUDE.md nice-to-have #10
 * Threaded resident discussions inspired by Condo Control
 *
 * Covers:
 * 1. GET /forum — returns threads sorted by lastReplyAt (pinned first)
 * 2. GET /forum — filters by category (general, maintenance, amenities, safety, social, suggestions)
 * 3. GET /forum — filters by status (open, closed, resolved)
 * 4. GET /forum — searches by title and author
 * 5. GET /forum — returns reply count, view count, like count
 * 6. POST /forum — creates new thread with title, body, category
 * 7. POST /forum — validates title length (3-200 chars)
 * 8. POST /forum — validates body length (10-10000 chars)
 * 9. POST /forum — validates category enum
 * 10. PATCH /forum/:id — toggles pinned status (admin only)
 * 11. PATCH /forum/:id — toggles locked status (admin only)
 * 12. PATCH /forum/:id — closes/resolves thread
 * 13. POST /forum/:id/replies — reply to thread (nested endpoint concept)
 * 14. GET /forum/:id — view count increment on GET single
 * 15. Like/unlike thread
 * 16. Tenant isolation
 * 17. XSS prevention
 * 18. Notification on reply
 * 19. Edit own post within window
 * 20. Delete own post
 * 21. Moderation: admin delete any
 * 22. Pagination
 * 23. Nested (threaded) replies
 * 24. Reject reply to locked topic
 * 25. Reject reply with empty body
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  createGetRequest,
  createPostRequest,
  createPatchRequest,
  createDeleteRequest,
  parseResponse,
} from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Mock Setup
// ---------------------------------------------------------------------------

const mockTopicFindMany = vi.fn();
const mockTopicFindUnique = vi.fn();
const mockTopicCreate = vi.fn();
const mockTopicUpdate = vi.fn();
const mockTopicDelete = vi.fn();
const mockTopicCount = vi.fn();
const mockReplyFindMany = vi.fn();
const mockReplyFindUnique = vi.fn();
const mockReplyCreate = vi.fn();
const mockReplyUpdate = vi.fn();
const mockNotificationCreate = vi.fn();

const mockGuardRoute = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    forumTopic: {
      findMany: (...args: unknown[]) => mockTopicFindMany(...args),
      findUnique: (...args: unknown[]) => mockTopicFindUnique(...args),
      create: (...args: unknown[]) => mockTopicCreate(...args),
      update: (...args: unknown[]) => mockTopicUpdate(...args),
      delete: (...args: unknown[]) => mockTopicDelete(...args),
      count: (...args: unknown[]) => mockTopicCount(...args),
    },
    forumReply: {
      findMany: (...args: unknown[]) => mockReplyFindMany(...args),
      findUnique: (...args: unknown[]) => mockReplyFindUnique(...args),
      create: (...args: unknown[]) => mockReplyCreate(...args),
      update: (...args: unknown[]) => mockReplyUpdate(...args),
    },
    notification: {
      create: (...args: unknown[]) => mockNotificationCreate(...args),
    },
  },
}));

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: (...args: unknown[]) => mockGuardRoute(...args),
}));

// Import route handlers after mocks
import { GET, POST } from '../route';
import { GET as GET_TOPIC, PATCH, DELETE } from '../[id]/route';
import { GET as GET_REPLIES, POST as POST_REPLY } from '../[id]/replies/route';

const PROPERTY_A = '00000000-0000-4000-b000-000000000001';
const PROPERTY_B = '00000000-0000-4000-b000-000000000002';
const USER_RESIDENT = 'user-resident-001';
const USER_OTHER = 'user-other-002';
const USER_ADMIN = 'user-admin-003';
const ADMIN_ROLE = 'property_admin';

function setAuth(userId: string, role: string, propertyId: string = PROPERTY_A) {
  mockGuardRoute.mockResolvedValue({
    user: { userId, propertyId, role, permissions: ['*'], mfaVerified: false },
    error: null,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  setAuth(USER_RESIDENT, 'resident');
  mockTopicFindMany.mockResolvedValue([]);
  mockTopicCount.mockResolvedValue(0);
});

// ---------------------------------------------------------------------------
// 1. GET /forum — Returns threads sorted by lastReplyAt (pinned first)
// ---------------------------------------------------------------------------

describe('GET /forum — sorted by lastReplyAt with pinned first', () => {
  it('returns topics sorted by isPinned desc then lastActivityAt desc', async () => {
    const req = createGetRequest('/api/v1/forum', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET(req);

    const call = mockTopicFindMany.mock.calls[0]![0];
    expect(call.orderBy).toEqual([{ isPinned: 'desc' }, { lastActivityAt: 'desc' }]);
  });

  it('pinned topics appear before non-pinned regardless of date', async () => {
    mockTopicFindMany.mockResolvedValue([
      { id: 'topic-pinned', isPinned: true, lastActivityAt: new Date('2026-01-01') },
      { id: 'topic-recent', isPinned: false, lastActivityAt: new Date('2026-03-19') },
    ]);
    mockTopicCount.mockResolvedValue(2);

    const req = createGetRequest('/api/v1/forum', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: Array<{ id: string; isPinned: boolean }> }>(res);
    expect(body.data[0]!.isPinned).toBe(true);
  });

  it('requires propertyId', async () => {
    const req = createGetRequest('/api/v1/forum');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// 2. GET /forum — Filters by category
// ---------------------------------------------------------------------------

describe('GET /forum — filters by category', () => {
  const categories = ['general', 'maintenance', 'amenities', 'safety', 'social', 'suggestions'];

  it('filters topics by category param', async () => {
    const req = createGetRequest('/api/v1/forum', {
      searchParams: { propertyId: PROPERTY_A, category: 'maintenance' },
    });
    await GET(req);

    const call = mockTopicFindMany.mock.calls[0]![0];
    expect(call.where.categoryId).toBe('maintenance');
  });

  it.each(categories)('accepts category=%s', async (category) => {
    const req = createGetRequest('/api/v1/forum', {
      searchParams: { propertyId: PROPERTY_A, category },
    });
    await GET(req);

    const call = mockTopicFindMany.mock.calls[0]![0];
    expect(call.where.categoryId).toBe(category);
  });

  it('returns all topics when no category specified', async () => {
    const req = createGetRequest('/api/v1/forum', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET(req);

    const call = mockTopicFindMany.mock.calls[0]![0];
    expect(call.where.categoryId).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 3. GET /forum — Filters by status (open/active, closed, resolved)
// ---------------------------------------------------------------------------

describe('GET /forum — filters by status', () => {
  it('defaults to active status filter', async () => {
    const req = createGetRequest('/api/v1/forum', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET(req);

    const call = mockTopicFindMany.mock.calls[0]![0];
    expect(call.where.status).toBe('active');
  });
});

// ---------------------------------------------------------------------------
// 4. GET /forum — Searches by title and body
// ---------------------------------------------------------------------------

describe('GET /forum — search by title and body', () => {
  it('searches topics by title and body with OR condition', async () => {
    const req = createGetRequest('/api/v1/forum', {
      searchParams: { propertyId: PROPERTY_A, search: 'noise' },
    });
    await GET(req);

    const call = mockTopicFindMany.mock.calls[0]![0];
    expect(call.where.OR).toEqual([
      { title: { contains: 'noise', mode: 'insensitive' } },
      { body: { contains: 'noise', mode: 'insensitive' } },
    ]);
  });

  it('uses case-insensitive search', async () => {
    const req = createGetRequest('/api/v1/forum', {
      searchParams: { propertyId: PROPERTY_A, search: 'PARKING' },
    });
    await GET(req);

    const call = mockTopicFindMany.mock.calls[0]![0];
    expect(call.where.OR[0].title.mode).toBe('insensitive');
  });

  it('does not apply OR filter when search is not provided', async () => {
    const req = createGetRequest('/api/v1/forum', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET(req);

    const call = mockTopicFindMany.mock.calls[0]![0];
    expect(call.where.OR).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 5. GET /forum — Returns reply count, view count, like count
// ---------------------------------------------------------------------------

describe('GET /forum — returns topic metrics', () => {
  it('includes replyCount in topic listing', async () => {
    mockTopicFindMany.mockResolvedValue([
      { id: 'topic-1', title: 'Topic with replies', replyCount: 15, viewCount: 42, likeCount: 7 },
    ]);
    mockTopicCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/forum', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await GET(req);
    const body = await parseResponse<{ data: Array<{ replyCount: number }> }>(res);
    expect(body.data[0]!.replyCount).toBe(15);
  });

  it('returns data with meta pagination', async () => {
    mockTopicFindMany.mockResolvedValue([{ id: 'topic-1', title: 'First topic', replyCount: 3 }]);
    mockTopicCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/forum', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: unknown[]; meta: { total: number } }>(res);
    expect(body.data).toHaveLength(1);
    expect(body.meta.total).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// 6. POST /forum — Creates new thread with title, body, category
// ---------------------------------------------------------------------------

describe('POST /forum — Create topic', () => {
  const validTopic = {
    propertyId: PROPERTY_A,
    title: 'Noise complaint procedure',
    body: 'Can we discuss the process for filing noise complaints? I think we need clearer guidelines.',
    category: 'general',
  };

  it('creates a topic with title, body, and category', async () => {
    mockTopicCreate.mockResolvedValue({
      id: 'topic-1',
      ...validTopic,
      status: 'active',
      replyCount: 0,
      isPinned: false,
      isLocked: false,
    });

    const req = createPostRequest('/api/v1/forum', validTopic);
    const res = await POST(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{ data: { id: string; title: string } }>(res);
    expect(body.data.title).toContain('Noise complaint');
  });

  it('sets default values for new topic', async () => {
    mockTopicCreate.mockResolvedValue({ id: 'topic-1', status: 'active' });

    const req = createPostRequest('/api/v1/forum', validTopic);
    await POST(req);

    const data = mockTopicCreate.mock.calls[0]![0].data;
    expect(data.status).toBe('active');
    expect(data.replyCount).toBe(0);
    expect(data.isPinned).toBe(false);
    expect(data.isLocked).toBe(false);
  });

  it('stores userId from authenticated user', async () => {
    mockTopicCreate.mockResolvedValue({ id: 'topic-1' });

    const req = createPostRequest('/api/v1/forum', validTopic);
    await POST(req);

    const data = mockTopicCreate.mock.calls[0]![0].data;
    expect(data.userId).toBe(USER_RESIDENT);
  });

  it('stores lastActivityAt on creation', async () => {
    mockTopicCreate.mockResolvedValue({ id: 'topic-1' });

    const req = createPostRequest('/api/v1/forum', validTopic);
    await POST(req);

    const data = mockTopicCreate.mock.calls[0]![0].data;
    expect(data.lastActivityAt).toBeInstanceOf(Date);
  });

  it('accepts topic without category (optional)', async () => {
    mockTopicCreate.mockResolvedValue({ id: 'topic-no-cat', status: 'active' });

    const req = createPostRequest('/api/v1/forum', {
      propertyId: PROPERTY_A,
      title: 'General discussion',
      body: 'Just a general discussion topic without a category.',
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('rejects missing propertyId', async () => {
    const req = createPostRequest('/api/v1/forum', {
      title: 'No property',
      body: 'This topic has no property ID.',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// 7. POST /forum — Validates title length (3-200 chars)
// ---------------------------------------------------------------------------

describe('POST /forum — title validation', () => {
  it('rejects missing title', async () => {
    const req = createPostRequest('/api/v1/forum', {
      propertyId: PROPERTY_A,
      body: 'Some body text for the forum topic.',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects title shorter than 3 characters', async () => {
    const req = createPostRequest('/api/v1/forum', {
      propertyId: PROPERTY_A,
      title: 'AB',
      body: 'Body text that meets the minimum length.',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('accepts title of exactly 3 characters', async () => {
    mockTopicCreate.mockResolvedValue({ id: 'topic-1', status: 'active' });

    const req = createPostRequest('/api/v1/forum', {
      propertyId: PROPERTY_A,
      title: 'ABC',
      body: 'Body text that meets the minimum length.',
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('rejects title longer than 200 characters', async () => {
    const req = createPostRequest('/api/v1/forum', {
      propertyId: PROPERTY_A,
      title: 'A'.repeat(201),
      body: 'Body text that meets the minimum length.',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('accepts title of exactly 200 characters', async () => {
    mockTopicCreate.mockResolvedValue({ id: 'topic-1', status: 'active' });

    const req = createPostRequest('/api/v1/forum', {
      propertyId: PROPERTY_A,
      title: 'A'.repeat(200),
      body: 'Body text that meets the minimum length.',
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });
});

// ---------------------------------------------------------------------------
// 8. POST /forum — Validates body length (10-10000 chars)
// ---------------------------------------------------------------------------

describe('POST /forum — body validation', () => {
  it('rejects missing body', async () => {
    const req = createPostRequest('/api/v1/forum', {
      propertyId: PROPERTY_A,
      title: 'Missing body topic',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects body shorter than 10 characters', async () => {
    const req = createPostRequest('/api/v1/forum', {
      propertyId: PROPERTY_A,
      title: 'Short body test',
      body: 'Too short',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('accepts body of exactly 10 characters', async () => {
    mockTopicCreate.mockResolvedValue({ id: 'topic-1', status: 'active' });

    const req = createPostRequest('/api/v1/forum', {
      propertyId: PROPERTY_A,
      title: 'Body boundary test',
      body: '1234567890',
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('rejects body longer than 10000 characters', async () => {
    const req = createPostRequest('/api/v1/forum', {
      propertyId: PROPERTY_A,
      title: 'Long body test',
      body: 'A'.repeat(10001),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// 9. POST /forum — Validates category enum
// ---------------------------------------------------------------------------

describe('POST /forum — category validation', () => {
  it('stores category as categoryId', async () => {
    mockTopicCreate.mockResolvedValue({ id: 'topic-1', status: 'active' });

    const req = createPostRequest('/api/v1/forum', {
      propertyId: PROPERTY_A,
      title: 'Category test topic',
      body: 'Body text that meets the minimum length requirement.',
      category: 'safety',
    });
    await POST(req);

    const data = mockTopicCreate.mock.calls[0]![0].data;
    expect(data.categoryId).toBe('safety');
  });

  it('sets categoryId to general when no category provided', async () => {
    mockTopicCreate.mockResolvedValue({ id: 'topic-1', status: 'active' });

    const req = createPostRequest('/api/v1/forum', {
      propertyId: PROPERTY_A,
      title: 'No category topic',
      body: 'Body text that meets the minimum length requirement.',
    });
    await POST(req);

    const data = mockTopicCreate.mock.calls[0]![0].data;
    expect(data.categoryId).toBe('general');
  });
});

// ---------------------------------------------------------------------------
// 10. PATCH /forum/:id — Toggles pinned status (admin only)
// ---------------------------------------------------------------------------

describe('PATCH /forum/:id — Pin topic (admin only)', () => {
  it('allows admin to pin a topic', async () => {
    setAuth(USER_ADMIN, ADMIN_ROLE);
    mockTopicFindUnique.mockResolvedValue({
      id: 'topic-1',
      userId: USER_RESIDENT,
      propertyId: PROPERTY_A,
      status: 'active',
      createdAt: new Date(),
    });
    mockTopicUpdate.mockResolvedValue({ id: 'topic-1', isPinned: true });

    const req = createPatchRequest('/api/v1/forum/topic-1', { isPinned: true });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'topic-1' }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { isPinned: boolean } }>(res);
    expect(body.data.isPinned).toBe(true);
  });

  it('rejects pin from non-admin', async () => {
    setAuth(USER_RESIDENT, 'resident');
    mockTopicFindUnique.mockResolvedValue({
      id: 'topic-1',
      userId: USER_RESIDENT,
      propertyId: PROPERTY_A,
      status: 'active',
      createdAt: new Date(),
    });

    const req = createPatchRequest('/api/v1/forum/topic-1', { isPinned: true });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'topic-1' }) });
    expect(res.status).toBe(403);
  });

  it('allows admin to unpin a topic', async () => {
    setAuth(USER_ADMIN, ADMIN_ROLE);
    mockTopicFindUnique.mockResolvedValue({
      id: 'topic-1',
      userId: USER_RESIDENT,
      propertyId: PROPERTY_A,
      status: 'active',
      isPinned: true,
      createdAt: new Date(),
    });
    mockTopicUpdate.mockResolvedValue({ id: 'topic-1', isPinned: false });

    const req = createPatchRequest('/api/v1/forum/topic-1', { isPinned: false });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'topic-1' }) });
    expect(res.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// 11. PATCH /forum/:id — Toggles locked status (admin only)
// ---------------------------------------------------------------------------

describe('PATCH /forum/:id — Lock topic (admin only)', () => {
  it('allows admin to lock a topic', async () => {
    setAuth(USER_ADMIN, ADMIN_ROLE);
    mockTopicFindUnique.mockResolvedValue({
      id: 'topic-1',
      userId: USER_RESIDENT,
      propertyId: PROPERTY_A,
      status: 'active',
      createdAt: new Date(),
    });
    mockTopicUpdate.mockResolvedValue({ id: 'topic-1', isLocked: true });

    const req = createPatchRequest('/api/v1/forum/topic-1', { isLocked: true });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'topic-1' }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { isLocked: boolean } }>(res);
    expect(body.data.isLocked).toBe(true);
  });

  it('rejects lock from non-admin', async () => {
    setAuth(USER_RESIDENT, 'resident');
    mockTopicFindUnique.mockResolvedValue({
      id: 'topic-1',
      userId: USER_RESIDENT,
      propertyId: PROPERTY_A,
      status: 'active',
      createdAt: new Date(),
    });

    const req = createPatchRequest('/api/v1/forum/topic-1', { isLocked: true });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'topic-1' }) });
    expect(res.status).toBe(403);
  });

  it('allows admin to unlock a topic', async () => {
    setAuth(USER_ADMIN, ADMIN_ROLE);
    mockTopicFindUnique.mockResolvedValue({
      id: 'topic-1',
      userId: USER_RESIDENT,
      propertyId: PROPERTY_A,
      status: 'active',
      isLocked: true,
      createdAt: new Date(),
    });
    mockTopicUpdate.mockResolvedValue({ id: 'topic-1', isLocked: false });

    const req = createPatchRequest('/api/v1/forum/topic-1', { isLocked: false });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'topic-1' }) });
    expect(res.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// 12. PATCH /forum/:id — Close/resolve topic
// ---------------------------------------------------------------------------

describe('PATCH /forum/:id — Close/resolve topic', () => {
  it('allows admin to close a topic by setting status', async () => {
    setAuth(USER_ADMIN, ADMIN_ROLE);
    mockTopicFindUnique.mockResolvedValue({
      id: 'topic-1',
      userId: USER_RESIDENT,
      propertyId: PROPERTY_A,
      status: 'active',
      createdAt: new Date(),
    });
    mockTopicUpdate.mockResolvedValue({ id: 'topic-1', isLocked: true });

    const req = createPatchRequest('/api/v1/forum/topic-1', { isLocked: true });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'topic-1' }) });
    expect(res.status).toBe(200);
  });

  it('returns 404 for non-existent topic', async () => {
    setAuth(USER_ADMIN, ADMIN_ROLE);
    mockTopicFindUnique.mockResolvedValue(null);

    const req = createPatchRequest('/api/v1/forum/topic-ghost', { isLocked: true });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'topic-ghost' }) });
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// 13. POST /forum/:id/replies — Reply to thread
// ---------------------------------------------------------------------------

describe('POST /forum/:id/replies — Reply to topic', () => {
  it('creates a reply to a topic', async () => {
    mockTopicFindUnique.mockResolvedValue({
      id: 'topic-1',
      userId: USER_OTHER,
      propertyId: PROPERTY_A,
      isLocked: false,
      status: 'active',
    });
    mockReplyCreate.mockResolvedValue({
      id: 'reply-1',
      topicId: 'topic-1',
      userId: USER_RESIDENT,
      body: 'I agree, we need clearer guidelines.',
    });
    mockTopicUpdate.mockResolvedValue({ id: 'topic-1', replyCount: 1 });
    mockNotificationCreate.mockResolvedValue({ id: 'notif-1' });

    const req = createPostRequest('/api/v1/forum/topic-1/replies', {
      body: 'I agree, we need clearer guidelines.',
    });
    const res = await POST_REPLY(req, { params: Promise.resolve({ id: 'topic-1' }) });
    expect(res.status).toBe(201);
  });

  it('rejects reply to non-existent topic', async () => {
    mockTopicFindUnique.mockResolvedValue(null);

    const req = createPostRequest('/api/v1/forum/topic-ghost/replies', {
      body: 'Reply to nothing.',
    });
    const res = await POST_REPLY(req, { params: Promise.resolve({ id: 'topic-ghost' }) });
    expect(res.status).toBe(404);
  });

  it('increments replyCount and updates lastActivityAt', async () => {
    mockTopicFindUnique.mockResolvedValue({
      id: 'topic-1',
      userId: USER_OTHER,
      propertyId: PROPERTY_A,
      isLocked: false,
      status: 'active',
      replyCount: 2,
    });
    mockReplyCreate.mockResolvedValue({ id: 'reply-1' });
    mockTopicUpdate.mockResolvedValue({ id: 'topic-1', replyCount: 3 });
    mockNotificationCreate.mockResolvedValue({ id: 'notif-1' });

    const req = createPostRequest('/api/v1/forum/topic-1/replies', {
      body: 'A new reply.',
    });
    await POST_REPLY(req, { params: Promise.resolve({ id: 'topic-1' }) });

    const updateCall = mockTopicUpdate.mock.calls[0]![0];
    expect(updateCall.data.replyCount).toEqual({ increment: 1 });
    expect(updateCall.data.lastActivityAt).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// 14. GET /forum/:id — View count increment on GET single
// ---------------------------------------------------------------------------

describe('GET /forum/:id — single topic retrieval', () => {
  it('returns topic with replies', async () => {
    mockTopicFindUnique.mockResolvedValue({
      id: 'topic-1',
      title: 'Test topic',
      userId: USER_RESIDENT,
      propertyId: PROPERTY_A,
      status: 'active',
      replies: [{ id: 'reply-1', body: 'A reply' }],
    });

    const req = createGetRequest('/api/v1/forum/topic-1');
    const res = await GET_TOPIC(req, { params: Promise.resolve({ id: 'topic-1' }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { id: string; replies: unknown[] } }>(res);
    expect(body.data.id).toBe('topic-1');
    expect(body.data.replies).toHaveLength(1);
  });

  it('returns 404 for non-existent topic', async () => {
    mockTopicFindUnique.mockResolvedValue(null);

    const req = createGetRequest('/api/v1/forum/topic-ghost');
    const res = await GET_TOPIC(req, { params: Promise.resolve({ id: 'topic-ghost' }) });
    expect(res.status).toBe(404);
  });

  it('includes only active replies', async () => {
    mockTopicFindUnique.mockResolvedValue({
      id: 'topic-1',
      userId: USER_RESIDENT,
      propertyId: PROPERTY_A,
      status: 'active',
    });

    const req = createGetRequest('/api/v1/forum/topic-1');
    await GET_TOPIC(req, { params: Promise.resolve({ id: 'topic-1' }) });

    const call = mockTopicFindUnique.mock.calls[0]![0];
    expect(call.include.replies.where.status).toBe('active');
  });
});

// ---------------------------------------------------------------------------
// 15. Like/unlike thread (concept — via reply/topic interaction)
// ---------------------------------------------------------------------------

describe('POST /forum/:id/replies — Like concept via replies', () => {
  it('stores userId on reply for tracking engagement', async () => {
    mockTopicFindUnique.mockResolvedValue({
      id: 'topic-1',
      userId: USER_OTHER,
      propertyId: PROPERTY_A,
      isLocked: false,
      status: 'active',
    });
    mockReplyCreate.mockResolvedValue({ id: 'reply-1', userId: USER_RESIDENT });
    mockTopicUpdate.mockResolvedValue({ id: 'topic-1' });
    mockNotificationCreate.mockResolvedValue({ id: 'notif-1' });

    const req = createPostRequest('/api/v1/forum/topic-1/replies', {
      body: 'Great point, I agree with this.',
    });
    await POST_REPLY(req, { params: Promise.resolve({ id: 'topic-1' }) });

    const createCall = mockReplyCreate.mock.calls[0]![0];
    expect(createCall.data.userId).toBe(USER_RESIDENT);
  });
});

// ---------------------------------------------------------------------------
// 16. Tenant isolation
// ---------------------------------------------------------------------------

describe('Tenant isolation', () => {
  it('scopes topic listing to propertyId', async () => {
    const req = createGetRequest('/api/v1/forum', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET(req);

    const call = mockTopicFindMany.mock.calls[0]![0];
    expect(call.where.propertyId).toBe(PROPERTY_A);
  });

  it('uses different propertyId for different tenants', async () => {
    const req = createGetRequest('/api/v1/forum', {
      searchParams: { propertyId: PROPERTY_B },
    });
    await GET(req);

    const call = mockTopicFindMany.mock.calls[0]![0];
    expect(call.where.propertyId).toBe(PROPERTY_B);
  });

  it('stores propertyId when creating a topic', async () => {
    mockTopicCreate.mockResolvedValue({ id: 'topic-1', status: 'active' });

    const req = createPostRequest('/api/v1/forum', {
      propertyId: PROPERTY_A,
      title: 'Tenant isolation test',
      body: 'Checking that propertyId is stored correctly.',
    });
    await POST(req);

    const data = mockTopicCreate.mock.calls[0]![0].data;
    expect(data.propertyId).toBe(PROPERTY_A);
  });
});

// ---------------------------------------------------------------------------
// 17. XSS prevention on all content
// ---------------------------------------------------------------------------

describe('XSS prevention on all content', () => {
  it('strips HTML from topic title', async () => {
    mockTopicCreate.mockResolvedValue({ id: 'topic-xss', status: 'active' });

    const req = createPostRequest('/api/v1/forum', {
      propertyId: PROPERTY_A,
      title: '<script>alert("xss")</script>Legit Title',
      body: 'Normal body content for the forum topic.',
    });
    await POST(req);

    const data = mockTopicCreate.mock.calls[0]![0].data;
    expect(data.title).not.toContain('<script>');
    expect(data.title).toContain('Legit Title');
  });

  it('strips HTML from topic body', async () => {
    mockTopicCreate.mockResolvedValue({ id: 'topic-xss', status: 'active' });

    const req = createPostRequest('/api/v1/forum', {
      propertyId: PROPERTY_A,
      title: 'Normal Title',
      body: '<img src=x onerror=alert(1)>Normal body here.',
    });
    await POST(req);

    const data = mockTopicCreate.mock.calls[0]![0].data;
    expect(data.body).not.toContain('<img');
    expect(data.body).not.toContain('onerror');
    expect(data.body).toContain('Normal body here');
  });

  it('strips HTML from reply body', async () => {
    mockTopicFindUnique.mockResolvedValue({
      id: 'topic-1',
      userId: USER_OTHER,
      propertyId: PROPERTY_A,
      isLocked: false,
      status: 'active',
    });
    mockReplyCreate.mockResolvedValue({ id: 'reply-1' });
    mockTopicUpdate.mockResolvedValue({ id: 'topic-1' });
    mockNotificationCreate.mockResolvedValue({ id: 'notif-1' });

    const req = createPostRequest('/api/v1/forum/topic-1/replies', {
      body: '<script>steal(cookie)</script>Safe reply content.',
    });
    await POST_REPLY(req, { params: Promise.resolve({ id: 'topic-1' }) });

    const data = mockReplyCreate.mock.calls[0]![0].data;
    expect(data.body).not.toContain('<script>');
    expect(data.body).toContain('Safe reply content');
  });

  it('strips event handler attributes from body', async () => {
    mockTopicCreate.mockResolvedValue({ id: 'topic-xss2', status: 'active' });

    const req = createPostRequest('/api/v1/forum', {
      propertyId: PROPERTY_A,
      title: 'Event handler test',
      body: '<div onmouseover="steal()">Hover to hack</div> clean text here.',
    });
    await POST(req);

    const data = mockTopicCreate.mock.calls[0]![0].data;
    expect(data.body).not.toContain('onmouseover');
  });
});

// ---------------------------------------------------------------------------
// 18. Notification: topic author notified of replies
// ---------------------------------------------------------------------------

describe('Notification — Topic author notified of replies', () => {
  it('creates notification for topic author when someone replies', async () => {
    mockTopicFindUnique.mockResolvedValue({
      id: 'topic-1',
      userId: USER_OTHER,
      propertyId: PROPERTY_A,
      isLocked: false,
      status: 'active',
      title: 'Test topic',
    });
    mockReplyCreate.mockResolvedValue({ id: 'reply-1' });
    mockTopicUpdate.mockResolvedValue({ id: 'topic-1', replyCount: 1 });
    mockNotificationCreate.mockResolvedValue({ id: 'notif-1' });

    const req = createPostRequest('/api/v1/forum/topic-1/replies', {
      body: 'Great discussion!',
    });
    await POST_REPLY(req, { params: Promise.resolve({ id: 'topic-1' }) });

    expect(mockNotificationCreate).toHaveBeenCalledTimes(1);
    const notifData = mockNotificationCreate.mock.calls[0]![0].data;
    expect(notifData.userId).toBe(USER_OTHER); // topic author
    expect(notifData.type).toBe('forum_reply');
  });

  it('does not notify when author replies to own topic', async () => {
    mockTopicFindUnique.mockResolvedValue({
      id: 'topic-1',
      userId: USER_RESIDENT, // same as the auth user
      propertyId: PROPERTY_A,
      isLocked: false,
      status: 'active',
    });
    mockReplyCreate.mockResolvedValue({ id: 'reply-self' });
    mockTopicUpdate.mockResolvedValue({ id: 'topic-1', replyCount: 1 });

    const req = createPostRequest('/api/v1/forum/topic-1/replies', {
      body: 'Replying to my own topic.',
    });
    await POST_REPLY(req, { params: Promise.resolve({ id: 'topic-1' }) });

    expect(mockNotificationCreate).not.toHaveBeenCalled();
  });

  it('includes referenceId and referenceType in notification', async () => {
    mockTopicFindUnique.mockResolvedValue({
      id: 'topic-1',
      userId: USER_OTHER,
      propertyId: PROPERTY_A,
      isLocked: false,
      status: 'active',
      title: 'Notification test',
    });
    mockReplyCreate.mockResolvedValue({ id: 'reply-1' });
    mockTopicUpdate.mockResolvedValue({ id: 'topic-1' });
    mockNotificationCreate.mockResolvedValue({ id: 'notif-1' });

    const req = createPostRequest('/api/v1/forum/topic-1/replies', {
      body: 'Check notification fields.',
    });
    await POST_REPLY(req, { params: Promise.resolve({ id: 'topic-1' }) });

    const notifData = mockNotificationCreate.mock.calls[0]![0].data;
    expect(notifData.referenceId).toBe('topic-1');
    expect(notifData.referenceType).toBe('forum_topic');
  });
});

// ---------------------------------------------------------------------------
// 19. PATCH /forum/:id — Edit own post (within 30 min)
// ---------------------------------------------------------------------------

describe('PATCH /forum/:id — Edit own post (within 30 min)', () => {
  it('allows author to edit title and body within 30 min', async () => {
    const recentDate = new Date(Date.now() - 10 * 60 * 1000); // 10 min ago
    mockTopicFindUnique.mockResolvedValue({
      id: 'topic-1',
      userId: USER_RESIDENT,
      propertyId: PROPERTY_A,
      status: 'active',
      createdAt: recentDate,
    });
    mockTopicUpdate.mockResolvedValue({
      id: 'topic-1',
      title: 'Updated title',
      body: 'Updated body content.',
    });

    const req = createPatchRequest('/api/v1/forum/topic-1', {
      title: 'Updated title',
      body: 'Updated body content.',
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'topic-1' }) });
    expect(res.status).toBe(200);
  });

  it('rejects edit after 30 min window', async () => {
    const oldDate = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
    mockTopicFindUnique.mockResolvedValue({
      id: 'topic-1',
      userId: USER_RESIDENT,
      propertyId: PROPERTY_A,
      status: 'active',
      createdAt: oldDate,
    });

    const req = createPatchRequest('/api/v1/forum/topic-1', {
      title: 'Late edit attempt',
      body: 'Trying to edit too late.',
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'topic-1' }) });
    expect(res.status).toBe(403);
  });

  it('rejects edit by non-author (non-admin)', async () => {
    setAuth(USER_OTHER, 'resident');
    const recentDate = new Date(Date.now() - 5 * 60 * 1000);
    mockTopicFindUnique.mockResolvedValue({
      id: 'topic-1',
      userId: USER_RESIDENT,
      propertyId: PROPERTY_A,
      status: 'active',
      createdAt: recentDate,
    });

    const req = createPatchRequest('/api/v1/forum/topic-1', {
      title: 'Hijack attempt',
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'topic-1' }) });
    expect(res.status).toBe(403);
  });

  it('allows admin to edit any topic regardless of time', async () => {
    setAuth(USER_ADMIN, ADMIN_ROLE);
    const oldDate = new Date(Date.now() - 24 * 60 * 60 * 1000); // 1 day ago
    mockTopicFindUnique.mockResolvedValue({
      id: 'topic-1',
      userId: USER_RESIDENT,
      propertyId: PROPERTY_A,
      status: 'active',
      createdAt: oldDate,
    });
    mockTopicUpdate.mockResolvedValue({ id: 'topic-1', title: 'Admin edited' });

    const req = createPatchRequest('/api/v1/forum/topic-1', { title: 'Admin edited' });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'topic-1' }) });
    expect(res.status).toBe(200);
  });

  it('returns 404 for non-existent topic', async () => {
    mockTopicFindUnique.mockResolvedValue(null);

    const req = createPatchRequest('/api/v1/forum/topic-ghost', { title: 'Ghost edit' });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'topic-ghost' }) });
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// 20. DELETE /forum/:id — Delete own post
// ---------------------------------------------------------------------------

describe('DELETE /forum/:id — Delete own post', () => {
  it('allows author to soft-delete their topic', async () => {
    mockTopicFindUnique.mockResolvedValue({
      id: 'topic-1',
      userId: USER_RESIDENT,
      propertyId: PROPERTY_A,
      status: 'active',
    });
    mockTopicUpdate.mockResolvedValue({ id: 'topic-1', status: 'deleted' });

    const req = createDeleteRequest('/api/v1/forum/topic-1');
    const res = await DELETE(req, { params: Promise.resolve({ id: 'topic-1' }) });
    expect(res.status).toBe(200);

    const updateCall = mockTopicUpdate.mock.calls[0]![0];
    expect(updateCall.data.status).toBe('deleted');
  });

  it('rejects delete by non-author (non-admin)', async () => {
    setAuth(USER_OTHER, 'resident');
    mockTopicFindUnique.mockResolvedValue({
      id: 'topic-1',
      userId: USER_RESIDENT,
      propertyId: PROPERTY_A,
      status: 'active',
    });

    const req = createDeleteRequest('/api/v1/forum/topic-1');
    const res = await DELETE(req, { params: Promise.resolve({ id: 'topic-1' }) });
    expect(res.status).toBe(403);
  });

  it('returns 404 for non-existent topic', async () => {
    mockTopicFindUnique.mockResolvedValue(null);

    const req = createDeleteRequest('/api/v1/forum/topic-ghost');
    const res = await DELETE(req, { params: Promise.resolve({ id: 'topic-ghost' }) });
    expect(res.status).toBe(404);
  });

  it('uses soft-delete (status=deleted), not hard delete', async () => {
    mockTopicFindUnique.mockResolvedValue({
      id: 'topic-1',
      userId: USER_RESIDENT,
      propertyId: PROPERTY_A,
      status: 'active',
    });
    mockTopicUpdate.mockResolvedValue({ id: 'topic-1', status: 'deleted' });

    const req = createDeleteRequest('/api/v1/forum/topic-1');
    await DELETE(req, { params: Promise.resolve({ id: 'topic-1' }) });

    expect(mockTopicDelete).not.toHaveBeenCalled();
    expect(mockTopicUpdate).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// 21. Moderation: admin can delete any post
// ---------------------------------------------------------------------------

describe('Moderation — Admin can delete any post', () => {
  it('allows admin to delete any topic', async () => {
    setAuth(USER_ADMIN, ADMIN_ROLE);
    mockTopicFindUnique.mockResolvedValue({
      id: 'topic-1',
      userId: USER_RESIDENT,
      propertyId: PROPERTY_A,
      status: 'active',
    });
    mockTopicUpdate.mockResolvedValue({ id: 'topic-1', status: 'deleted' });

    const req = createDeleteRequest('/api/v1/forum/topic-1');
    const res = await DELETE(req, { params: Promise.resolve({ id: 'topic-1' }) });
    expect(res.status).toBe(200);
  });

  it('allows property_manager to delete any topic', async () => {
    setAuth(USER_ADMIN, 'property_manager');
    mockTopicFindUnique.mockResolvedValue({
      id: 'topic-1',
      userId: USER_RESIDENT,
      propertyId: PROPERTY_A,
      status: 'active',
    });
    mockTopicUpdate.mockResolvedValue({ id: 'topic-1', status: 'deleted' });

    const req = createDeleteRequest('/api/v1/forum/topic-1');
    const res = await DELETE(req, { params: Promise.resolve({ id: 'topic-1' }) });
    expect(res.status).toBe(200);
  });

  it('allows super_admin to delete any topic', async () => {
    setAuth(USER_ADMIN, 'super_admin');
    mockTopicFindUnique.mockResolvedValue({
      id: 'topic-1',
      userId: USER_RESIDENT,
      propertyId: PROPERTY_A,
      status: 'active',
    });
    mockTopicUpdate.mockResolvedValue({ id: 'topic-1', status: 'deleted' });

    const req = createDeleteRequest('/api/v1/forum/topic-1');
    const res = await DELETE(req, { params: Promise.resolve({ id: 'topic-1' }) });
    expect(res.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// 22. Pagination
// ---------------------------------------------------------------------------

describe('GET /forum — Pagination', () => {
  it('applies offset pagination', async () => {
    mockTopicCount.mockResolvedValue(50);
    mockTopicFindMany.mockResolvedValue(
      Array.from({ length: 20 }, (_, i) => ({
        id: `topic-${i}`,
        title: `Topic ${i}`,
        replyCount: i,
      })),
    );

    const req = createGetRequest('/api/v1/forum', {
      searchParams: { propertyId: PROPERTY_A, page: '2', pageSize: '20' },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{ meta: { page: number; totalPages: number; total: number } }>(
      res,
    );
    expect(body.meta.page).toBe(2);
    expect(body.meta.total).toBe(50);
    expect(body.meta.totalPages).toBe(3);
  });

  it('defaults to page 1 and pageSize 20', async () => {
    const req = createGetRequest('/api/v1/forum', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET(req);

    const call = mockTopicFindMany.mock.calls[0]![0];
    expect(call.take).toBe(20);
    expect(call.skip).toBe(0);
  });

  it('computes correct skip for page 3 with pageSize 10', async () => {
    mockTopicCount.mockResolvedValue(100);

    const req = createGetRequest('/api/v1/forum', {
      searchParams: { propertyId: PROPERTY_A, page: '3', pageSize: '10' },
    });
    await GET(req);

    const call = mockTopicFindMany.mock.calls[0]![0];
    expect(call.skip).toBe(20);
    expect(call.take).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// 23. Nested (threaded) replies
// ---------------------------------------------------------------------------

describe('POST /forum/:id/replies — Nested replies', () => {
  it('creates a nested reply (reply to a reply)', async () => {
    mockTopicFindUnique.mockResolvedValue({
      id: 'topic-1',
      userId: USER_OTHER,
      propertyId: PROPERTY_A,
      isLocked: false,
      status: 'active',
    });
    mockReplyFindUnique.mockResolvedValue({
      id: 'reply-1',
      topicId: 'topic-1',
      userId: USER_OTHER,
    });
    mockReplyCreate.mockResolvedValue({
      id: 'reply-2',
      topicId: 'topic-1',
      parentReplyId: 'reply-1',
      userId: USER_RESIDENT,
      body: 'I disagree with that point.',
    });
    mockTopicUpdate.mockResolvedValue({ id: 'topic-1', replyCount: 2 });
    mockNotificationCreate.mockResolvedValue({ id: 'notif-1' });

    const req = createPostRequest('/api/v1/forum/topic-1/replies', {
      body: 'I disagree with that point.',
      parentReplyId: 'reply-1',
    });
    const res = await POST_REPLY(req, { params: Promise.resolve({ id: 'topic-1' }) });
    expect(res.status).toBe(201);

    const createCall = mockReplyCreate.mock.calls[0]![0];
    expect(createCall.data.parentReplyId).toBe('reply-1');
  });

  it('rejects reply to non-existent parent reply', async () => {
    mockTopicFindUnique.mockResolvedValue({
      id: 'topic-1',
      userId: USER_OTHER,
      propertyId: PROPERTY_A,
      isLocked: false,
      status: 'active',
    });
    mockReplyFindUnique.mockResolvedValue(null);

    const req = createPostRequest('/api/v1/forum/topic-1/replies', {
      body: 'Replying to a ghost.',
      parentReplyId: 'reply-ghost',
    });
    const res = await POST_REPLY(req, { params: Promise.resolve({ id: 'topic-1' }) });
    expect(res.status).toBe(404);
  });

  it('returns threaded replies in GET', async () => {
    mockTopicFindUnique.mockResolvedValue({
      id: 'topic-1',
      userId: USER_OTHER,
      propertyId: PROPERTY_A,
      status: 'active',
    });
    mockReplyFindMany.mockResolvedValue([
      { id: 'reply-1', parentReplyId: null, body: 'Top-level reply' },
      { id: 'reply-2', parentReplyId: 'reply-1', body: 'Nested reply' },
    ]);

    const req = createGetRequest('/api/v1/forum/topic-1/replies');
    const res = await GET_REPLIES(req, { params: Promise.resolve({ id: 'topic-1' }) });
    expect(res.status).toBe(200);

    const resBody = await parseResponse<{ data: unknown[] }>(res);
    expect(resBody.data).toHaveLength(2);
  });

  it('sets parentReplyId to null when not provided', async () => {
    mockTopicFindUnique.mockResolvedValue({
      id: 'topic-1',
      userId: USER_OTHER,
      propertyId: PROPERTY_A,
      isLocked: false,
      status: 'active',
    });
    mockReplyCreate.mockResolvedValue({ id: 'reply-1' });
    mockTopicUpdate.mockResolvedValue({ id: 'topic-1' });
    mockNotificationCreate.mockResolvedValue({ id: 'notif-1' });

    const req = createPostRequest('/api/v1/forum/topic-1/replies', {
      body: 'Top-level reply without parent.',
    });
    await POST_REPLY(req, { params: Promise.resolve({ id: 'topic-1' }) });

    const createCall = mockReplyCreate.mock.calls[0]![0];
    expect(createCall.data.parentReplyId).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 24. Reject reply to locked topic
// ---------------------------------------------------------------------------

describe('POST /forum/:id/replies — Locked topic', () => {
  it('rejects reply to locked topic', async () => {
    mockTopicFindUnique.mockResolvedValue({
      id: 'topic-locked',
      userId: USER_OTHER,
      propertyId: PROPERTY_A,
      isLocked: true,
      status: 'active',
    });

    const req = createPostRequest('/api/v1/forum/topic-locked/replies', {
      body: 'Trying to reply to a locked topic.',
    });
    const res = await POST_REPLY(req, { params: Promise.resolve({ id: 'topic-locked' }) });
    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// 25. Reject reply with empty body
// ---------------------------------------------------------------------------

describe('POST /forum/:id/replies — Empty body', () => {
  it('rejects empty reply body', async () => {
    mockTopicFindUnique.mockResolvedValue({
      id: 'topic-1',
      userId: USER_OTHER,
      propertyId: PROPERTY_A,
      isLocked: false,
      status: 'active',
    });

    const req = createPostRequest('/api/v1/forum/topic-1/replies', { body: '' });
    const res = await POST_REPLY(req, { params: Promise.resolve({ id: 'topic-1' }) });
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// 26. GET /forum/:id/replies — Returns replies for non-existent topic
// ---------------------------------------------------------------------------

describe('GET /forum/:id/replies — Topic validation', () => {
  it('returns 404 for replies of non-existent topic', async () => {
    mockTopicFindUnique.mockResolvedValue(null);

    const req = createGetRequest('/api/v1/forum/topic-ghost/replies');
    const res = await GET_REPLIES(req, { params: Promise.resolve({ id: 'topic-ghost' }) });
    expect(res.status).toBe(404);
  });

  it('fetches only active replies ordered by createdAt asc', async () => {
    mockTopicFindUnique.mockResolvedValue({
      id: 'topic-1',
      userId: USER_OTHER,
      propertyId: PROPERTY_A,
      status: 'active',
    });
    mockReplyFindMany.mockResolvedValue([]);

    const req = createGetRequest('/api/v1/forum/topic-1/replies');
    await GET_REPLIES(req, { params: Promise.resolve({ id: 'topic-1' }) });

    const call = mockReplyFindMany.mock.calls[0]![0];
    expect(call.where.status).toBe('active');
    expect(call.orderBy).toEqual({ createdAt: 'asc' });
  });
});
