/**
 * Discussion Forum API Tests — per CLAUDE.md nice-to-have #10
 * Threaded resident discussions inspired by Condo Control
 *
 * Covers:
 * 1. POST /forum — create topic with title, body, category
 * 2. GET /forum — list topics sorted by latest activity
 * 3. POST /forum/:id/replies — reply to topic
 * 4. POST /forum/:id/replies — nested replies (threaded discussion)
 * 5. PATCH /forum/:id — pin topic (admin only)
 * 6. PATCH /forum/:id — close/lock topic (admin only)
 * 7. PATCH /forum/:id — edit own post (within 30 min)
 * 8. DELETE /forum/:id — delete own post
 * 9. GET /forum?search= — topic search by title and body
 * 10. GET /forum?category= — category filtering
 * 11. GET /forum?page= — pagination with reply count
 * 12. XSS prevention on all content
 * 13. Moderation: admin can delete any post
 * 14. Notification: topic author notified of replies
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
const USER_RESIDENT = 'user-resident-001';
const USER_OTHER = 'user-other-002';
const USER_ADMIN = 'user-admin-003';
const ADMIN_ROLE = 'property_admin';

function setAuth(userId: string, role: string) {
  mockGuardRoute.mockResolvedValue({
    user: { userId, propertyId: PROPERTY_A, role, permissions: ['*'], mfaVerified: false },
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
// 1. POST /forum — Create topic with title, body, category
// ---------------------------------------------------------------------------

describe('POST /forum — Create topic', () => {
  const validTopic = {
    propertyId: PROPERTY_A,
    title: 'Noise complaint procedure',
    body: 'Can we discuss the process for filing noise complaints? I think we need clearer guidelines.',
    category: 'building-rules',
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

  it('rejects missing title', async () => {
    const req = createPostRequest('/api/v1/forum', {
      propertyId: PROPERTY_A,
      body: 'Some body text for the forum topic.',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects missing body', async () => {
    const req = createPostRequest('/api/v1/forum', {
      propertyId: PROPERTY_A,
      title: 'Missing body topic',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects missing propertyId', async () => {
    const req = createPostRequest('/api/v1/forum', {
      title: 'No property',
      body: 'This topic has no property ID.',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
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
});

// ---------------------------------------------------------------------------
// 2. GET /forum — List topics sorted by latest activity
// ---------------------------------------------------------------------------

describe('GET /forum — List topics sorted by latest activity', () => {
  it('returns topics sorted by lastActivityAt desc', async () => {
    const req = createGetRequest('/api/v1/forum', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET(req);

    const call = mockTopicFindMany.mock.calls[0]![0];
    expect(call.orderBy).toEqual([{ isPinned: 'desc' }, { lastActivityAt: 'desc' }]);
  });

  it('requires propertyId', async () => {
    const req = createGetRequest('/api/v1/forum');
    const res = await GET(req);
    expect(res.status).toBe(400);
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
// 3. POST /forum/:id/replies — Reply to topic
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
// 4. POST /forum/:id/replies — Nested replies (threaded discussion)
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
});

// ---------------------------------------------------------------------------
// 5. PATCH /forum/:id — Pin topic (admin only)
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
// 6. PATCH /forum/:id — Close/lock topic (admin only)
// ---------------------------------------------------------------------------

describe('PATCH /forum/:id — Close topic (admin only)', () => {
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
// 7. PATCH /forum/:id — Edit own post (within 30 min)
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
// 8. DELETE /forum/:id — Delete own post
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
});

// ---------------------------------------------------------------------------
// 9. GET /forum?search= — Topic search by title and body
// ---------------------------------------------------------------------------

describe('GET /forum?search= — Topic search', () => {
  it('searches topics by title and body', async () => {
    const req = createGetRequest('/api/v1/forum', {
      searchParams: { propertyId: PROPERTY_A, search: 'noise' },
    });
    await GET(req);

    const call = mockTopicFindMany.mock.calls[0]![0];
    expect(call.where.OR).toBeDefined();
    expect(call.where.OR).toEqual([
      { title: { contains: 'noise', mode: 'insensitive' } },
      { body: { contains: 'noise', mode: 'insensitive' } },
    ]);
  });

  it('returns results without search filter when none specified', async () => {
    const req = createGetRequest('/api/v1/forum', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET(req);

    const call = mockTopicFindMany.mock.calls[0]![0];
    expect(call.where.OR).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 10. GET /forum?category= — Category filtering
// ---------------------------------------------------------------------------

describe('GET /forum?category= — Category filtering', () => {
  it('filters topics by category', async () => {
    const req = createGetRequest('/api/v1/forum', {
      searchParams: { propertyId: PROPERTY_A, category: 'building-rules' },
    });
    await GET(req);

    const call = mockTopicFindMany.mock.calls[0]![0];
    expect(call.where.categoryId).toBe('building-rules');
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
// 11. GET /forum?page= — Pagination with reply count
// ---------------------------------------------------------------------------

describe('GET /forum?page= — Pagination with reply count', () => {
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

  it('includes replyCount in topic listing', async () => {
    mockTopicFindMany.mockResolvedValue([
      { id: 'topic-1', title: 'Topic with replies', replyCount: 15 },
    ]);
    mockTopicCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/forum', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await GET(req);
    const body = await parseResponse<{ data: { replyCount: number }[] }>(res);
    expect(body.data[0]!.replyCount).toBe(15);
  });
});

// ---------------------------------------------------------------------------
// 12. XSS prevention on all content
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
});

// ---------------------------------------------------------------------------
// 13. Moderation: admin can delete any post
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
// 14. Notification: topic author notified of replies
// ---------------------------------------------------------------------------

describe('Notification — Topic author notified of replies', () => {
  it('creates notification for topic author when someone replies', async () => {
    mockTopicFindUnique.mockResolvedValue({
      id: 'topic-1',
      userId: USER_OTHER,
      propertyId: PROPERTY_A,
      isLocked: false,
      status: 'active',
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
});
