/**
 * Community Module — Comprehensive Tests (PRD 12)
 *
 * TDD coverage for classified ads lifecycle, idea board with voting,
 * community events, forum topics with threading, moderation, flagging,
 * notifications, auto-expiry, content moderation, and tenant isolation.
 *
 * Tests 1-33:
 *  1. Classified ads — create ad with title, description, price
 *  2. Classified ads — status lifecycle (draft -> active -> sold -> expired)
 *  3. Classified ads — reject invalid transition (sold -> draft)
 *  4. Ad categories — filter by category
 *  5. Ad search — search by title and description
 *  6. Idea board — create idea with title and description
 *  7. Idea board — upvote an idea (not own)
 *  8. Idea board — cannot vote on own idea
 *  9. Idea board — cannot vote twice (duplicate)
 * 10. Idea status — admin transitions submitted -> under_review
 * 11. Idea status — resident cannot change status (403)
 * 12. Community events — create event with required fields
 * 13. Community events — list upcoming events
 * 14. Community events — reject event without title
 * 15. Community events — tenant isolation (require propertyId)
 * 16. Forum — create topic with title, body, category
 * 17. Forum — list topics with sorting (pinned first)
 * 18. Forum — reply to topic
 * 19. Forum — reject reply to locked topic
 * 20. Forum — nested (threaded) replies
 * 21. Forum — moderation: admin pin topic
 * 22. Forum — moderation: admin lock topic
 * 23. Forum — author can delete own topic
 * 24. Forum — admin can delete any topic
 * 25. Forum — XSS prevention on content
 * 26. Forum — notification on reply
 * 27. Idea status — full lifecycle (submitted->under_review->planned->completed)
 * 28. Idea status — reject invalid transition
 * 29. Classified ad — flagging for moderation
 * 30. Classified ad — auto-expiry after 30 days
 * 31. Classified ad — delete by owner
 * 32. Ad — ad detail by ID
 * 33. Community engagement — user reputation via contributions
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

const mockAdFindMany = vi.fn();
const mockAdFindUnique = vi.fn();
const mockAdCount = vi.fn();
const mockAdCreate = vi.fn();
const mockAdUpdate = vi.fn();
const mockAdUpdateMany = vi.fn();

const mockIdeaFindMany = vi.fn();
const mockIdeaFindUnique = vi.fn();
const mockIdeaCreate = vi.fn();
const mockIdeaUpdate = vi.fn();
const mockVoteCreate = vi.fn();
const mockVoteFindUnique = vi.fn();
const mockVoteDelete = vi.fn();
const mockVoteCount = vi.fn();
const mockCommentCreate = vi.fn();
const mockCommentFindMany = vi.fn();

const mockEventFindMany = vi.fn();
const mockEventCreate = vi.fn();

const mockAdFlagCreate = vi.fn();
const mockAdFlagFindMany = vi.fn();
const mockAdImageCreate = vi.fn();

const mockTopicFindMany = vi.fn();
const mockTopicFindUnique = vi.fn();
const mockTopicCreate = vi.fn();
const mockTopicUpdate = vi.fn();
const mockTopicDelete = vi.fn();
const mockTopicCount = vi.fn();
const mockReplyFindMany = vi.fn();
const mockReplyFindUnique = vi.fn();
const mockReplyCreate = vi.fn();
const mockNotificationCreate = vi.fn();

const mockGuardRoute = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    classifiedAd: {
      findMany: (...args: unknown[]) => mockAdFindMany(...args),
      findUnique: (...args: unknown[]) => mockAdFindUnique(...args),
      count: (...args: unknown[]) => mockAdCount(...args),
      create: (...args: unknown[]) => mockAdCreate(...args),
      update: (...args: unknown[]) => mockAdUpdate(...args),
      updateMany: (...args: unknown[]) => mockAdUpdateMany(...args),
    },
    classifiedAdFlag: {
      create: (...args: unknown[]) => mockAdFlagCreate(...args),
      findMany: (...args: unknown[]) => mockAdFlagFindMany(...args),
    },
    classifiedAdImage: {
      create: (...args: unknown[]) => mockAdImageCreate(...args),
    },
    idea: {
      findMany: (...args: unknown[]) => mockIdeaFindMany(...args),
      findUnique: (...args: unknown[]) => mockIdeaFindUnique(...args),
      create: (...args: unknown[]) => mockIdeaCreate(...args),
      update: (...args: unknown[]) => mockIdeaUpdate(...args),
    },
    ideaVote: {
      create: (...args: unknown[]) => mockVoteCreate(...args),
      findUnique: (...args: unknown[]) => mockVoteFindUnique(...args),
      delete: (...args: unknown[]) => mockVoteDelete(...args),
      count: (...args: unknown[]) => mockVoteCount(...args),
    },
    ideaComment: {
      create: (...args: unknown[]) => mockCommentCreate(...args),
      findMany: (...args: unknown[]) => mockCommentFindMany(...args),
    },
    communityEvent: {
      findMany: (...args: unknown[]) => mockEventFindMany(...args),
      create: (...args: unknown[]) => mockEventCreate(...args),
    },
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
import { GET as GET_ADS, POST as POST_AD } from '../route';
import { GET as GET_AD_ID, PATCH as PATCH_AD, DELETE as DELETE_AD } from '../[id]/route';
import { POST as FLAG_AD } from '../[id]/flag/route';
import { POST as EXPIRE_ADS } from '../expire/route';
import { GET as GET_EVENTS, POST as POST_EVENT } from '../events/route';

import { GET as GET_IDEAS, POST as POST_IDEA } from '../../ideas/route';
import { GET as GET_IDEA_ID, PATCH as PATCH_IDEA } from '../../ideas/[id]/route';
import { POST as VOTE_POST, DELETE as VOTE_DELETE } from '../../ideas/[id]/vote/route';

import { GET as FORUM_GET, POST as FORUM_POST } from '../../forum/route';
import {
  GET as FORUM_GET_TOPIC,
  PATCH as FORUM_PATCH,
  DELETE as FORUM_DELETE,
} from '../../forum/[id]/route';
import { GET as FORUM_GET_REPLIES, POST as FORUM_POST_REPLY } from '../../forum/[id]/replies/route';

const PROPERTY_A = '00000000-0000-4000-b000-000000000001';
const USER_RESIDENT = 'user-resident-001';
const USER_OTHER = 'user-other-002';
const USER_ADMIN = 'user-admin-003';

function setAuth(userId: string, role: string) {
  mockGuardRoute.mockResolvedValue({
    user: { userId, propertyId: PROPERTY_A, role, permissions: ['*'], mfaVerified: false },
    error: null,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  setAuth(USER_RESIDENT, 'resident');
  mockAdFindMany.mockResolvedValue([]);
  mockAdCount.mockResolvedValue(0);
  mockIdeaFindMany.mockResolvedValue([]);
  mockEventFindMany.mockResolvedValue([]);
  mockTopicFindMany.mockResolvedValue([]);
  mockTopicCount.mockResolvedValue(0);
});

// ===========================================================================
// 1. Classified ads — create ad
// ===========================================================================

describe('1. Classified ads — create with title, description, price', () => {
  const validAd = {
    propertyId: PROPERTY_A,
    title: 'Standing desk for sale',
    description: 'Adjustable standing desk, barely used, excellent condition.',
    price: 150,
    priceType: 'negotiable' as const,
    condition: 'like_new' as const,
  };

  it('creates ad with status=active and returns 201', async () => {
    mockAdCreate.mockResolvedValue({ id: 'ad-1', ...validAd, status: 'active' });
    const req = createPostRequest('/api/v1/community', validAd);
    const res = await POST_AD(req);
    expect(res.status).toBe(201);
  });

  it('sets userId from authenticated user on the ad', async () => {
    mockAdCreate.mockResolvedValue({ id: 'ad-1', status: 'active' });
    const req = createPostRequest('/api/v1/community', validAd);
    await POST_AD(req);

    const data = mockAdCreate.mock.calls[0]![0].data;
    expect(data.userId).toBe(USER_RESIDENT);
  });

  it('rejects ad without title', async () => {
    const { title: _, ...noTitle } = validAd;
    const req = createPostRequest('/api/v1/community', noTitle);
    const res = await POST_AD(req);
    expect(res.status).toBe(400);
  });
});

// ===========================================================================
// 2. Classified ads — status lifecycle (draft -> active -> sold -> expired)
// ===========================================================================

describe('2. Classified ads — status lifecycle', () => {
  it('transitions from draft to active', async () => {
    mockAdFindUnique.mockResolvedValue({
      id: 'ad-1',
      userId: USER_RESIDENT,
      status: 'draft',
      propertyId: PROPERTY_A,
    });
    mockAdUpdate.mockResolvedValue({ id: 'ad-1', status: 'active' });

    const req = createPatchRequest('/api/v1/community/ad-1', { status: 'active' });
    const res = await PATCH_AD(req, { params: Promise.resolve({ id: 'ad-1' }) });
    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: { status: string } }>(res);
    expect(body.data.status).toBe('active');
  });

  it('transitions from active to sold', async () => {
    mockAdFindUnique.mockResolvedValue({
      id: 'ad-1',
      userId: USER_RESIDENT,
      status: 'active',
      propertyId: PROPERTY_A,
    });
    mockAdUpdate.mockResolvedValue({ id: 'ad-1', status: 'sold' });

    const req = createPatchRequest('/api/v1/community/ad-1', { status: 'sold' });
    const res = await PATCH_AD(req, { params: Promise.resolve({ id: 'ad-1' }) });
    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: { status: string } }>(res);
    expect(body.data.status).toBe('sold');
  });
});

// ===========================================================================
// 3. Classified ads — reject invalid transition (sold -> draft)
// ===========================================================================

describe('3. Classified ads — reject invalid transition', () => {
  it('rejects sold -> draft transition', async () => {
    mockAdFindUnique.mockResolvedValue({
      id: 'ad-1',
      userId: USER_RESIDENT,
      status: 'sold',
      propertyId: PROPERTY_A,
    });

    const req = createPatchRequest('/api/v1/community/ad-1', { status: 'draft' });
    const res = await PATCH_AD(req, { params: Promise.resolve({ id: 'ad-1' }) });
    expect(res.status).toBe(400);
  });

  it('rejects expired -> active transition', async () => {
    mockAdFindUnique.mockResolvedValue({
      id: 'ad-1',
      userId: USER_RESIDENT,
      status: 'expired',
      propertyId: PROPERTY_A,
    });

    const req = createPatchRequest('/api/v1/community/ad-1', { status: 'active' });
    const res = await PATCH_AD(req, { params: Promise.resolve({ id: 'ad-1' }) });
    expect(res.status).toBe(400);
  });
});

// ===========================================================================
// 4. Ad categories — filter by category
// ===========================================================================

describe('4. Ad categories — filter', () => {
  it('filters ads by category=furniture', async () => {
    const req = createGetRequest('/api/v1/community', {
      searchParams: { propertyId: PROPERTY_A, category: 'furniture' },
    });
    await GET_ADS(req);
    const where = mockAdFindMany.mock.calls[0]![0].where;
    expect(where.category).toBe('furniture');
  });

  it('returns all categories when no filter applied', async () => {
    const req = createGetRequest('/api/v1/community', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET_ADS(req);
    const where = mockAdFindMany.mock.calls[0]![0].where;
    expect(where.category).toBeUndefined();
  });
});

// ===========================================================================
// 5. Ad search — search by title and description
// ===========================================================================

describe('5. Ad search — title and description', () => {
  it('searches ads by keyword in title and description', async () => {
    const req = createGetRequest('/api/v1/community', {
      searchParams: { propertyId: PROPERTY_A, search: 'couch' },
    });
    await GET_ADS(req);

    const where = mockAdFindMany.mock.calls[0]![0].where;
    expect(where.OR).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ title: { contains: 'couch', mode: 'insensitive' } }),
        expect.objectContaining({ description: { contains: 'couch', mode: 'insensitive' } }),
      ]),
    );
  });
});

// ===========================================================================
// 6. Idea board — create idea
// ===========================================================================

describe('6. Idea board — create idea', () => {
  it('creates idea with title, description, status=submitted', async () => {
    mockIdeaCreate.mockResolvedValue({
      id: 'idea-1',
      title: 'Rooftop garden',
      status: 'submitted',
      voteCount: 0,
    });

    const req = createPostRequest('/api/v1/ideas', {
      propertyId: PROPERTY_A,
      title: 'Rooftop garden',
      description: 'Community garden on the rooftop would be amazing.',
    });
    const res = await POST_IDEA(req);

    expect(res.status).toBe(201);
    const body = await parseResponse<{ data: { status: string } }>(res);
    expect(body.data.status).toBe('submitted');
  });

  it('rejects idea without title', async () => {
    const req = createPostRequest('/api/v1/ideas', {
      propertyId: PROPERTY_A,
      description: 'Missing title.',
    });
    const res = await POST_IDEA(req);
    expect(res.status).toBe(400);
  });
});

// ===========================================================================
// 7. Idea board — upvote an idea (not own)
// ===========================================================================

describe('7. Idea board — upvote', () => {
  it('creates an upvote on another user idea', async () => {
    mockIdeaFindUnique.mockResolvedValue({
      id: 'idea-1',
      userId: USER_OTHER,
      status: 'submitted',
      propertyId: PROPERTY_A,
    });
    mockVoteFindUnique.mockResolvedValue(null);
    mockVoteCreate.mockResolvedValue({ id: 'vote-1', ideaId: 'idea-1', userId: USER_RESIDENT });
    mockVoteCount.mockResolvedValue(1);
    mockIdeaUpdate.mockResolvedValue({ id: 'idea-1', voteCount: 1 });

    const req = createPostRequest('/api/v1/ideas/idea-1/vote', {});
    const res = await VOTE_POST(req, { params: Promise.resolve({ id: 'idea-1' }) });
    expect(res.status).toBe(201);
  });
});

// ===========================================================================
// 8. Idea board — cannot vote on own idea
// ===========================================================================

describe('8. Idea board — cannot vote on own idea', () => {
  it('returns 403 CANNOT_VOTE_OWN_IDEA', async () => {
    mockIdeaFindUnique.mockResolvedValue({
      id: 'idea-1',
      userId: USER_RESIDENT,
      status: 'submitted',
      propertyId: PROPERTY_A,
    });

    const req = createPostRequest('/api/v1/ideas/idea-1/vote', {});
    const res = await VOTE_POST(req, { params: Promise.resolve({ id: 'idea-1' }) });
    expect(res.status).toBe(403);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('CANNOT_VOTE_OWN_IDEA');
  });
});

// ===========================================================================
// 9. Idea board — cannot vote twice
// ===========================================================================

describe('9. Idea board — prevent duplicate vote', () => {
  it('returns 409 ALREADY_VOTED on duplicate', async () => {
    mockIdeaFindUnique.mockResolvedValue({
      id: 'idea-1',
      userId: USER_OTHER,
      status: 'submitted',
      propertyId: PROPERTY_A,
    });
    mockVoteFindUnique.mockResolvedValue({
      id: 'vote-existing',
      ideaId: 'idea-1',
      userId: USER_RESIDENT,
    });

    const req = createPostRequest('/api/v1/ideas/idea-1/vote', {});
    const res = await VOTE_POST(req, { params: Promise.resolve({ id: 'idea-1' }) });
    expect(res.status).toBe(409);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('ALREADY_VOTED');
  });
});

// ===========================================================================
// 10. Idea status — admin transitions submitted -> under_review
// ===========================================================================

describe('10. Idea status — admin transitions', () => {
  it('admin transitions submitted -> under_review', async () => {
    setAuth(USER_ADMIN, 'property_admin');
    mockIdeaFindUnique.mockResolvedValue({
      id: 'idea-1',
      userId: USER_RESIDENT,
      status: 'submitted',
      propertyId: PROPERTY_A,
    });
    mockIdeaUpdate.mockResolvedValue({ id: 'idea-1', status: 'under_review' });

    const req = createPatchRequest('/api/v1/ideas/idea-1', { status: 'under_review' });
    const res = await PATCH_IDEA(req, { params: Promise.resolve({ id: 'idea-1' }) });
    expect(res.status).toBe(200);
  });

  it('admin transitions under_review -> planned', async () => {
    setAuth(USER_ADMIN, 'property_admin');
    mockIdeaFindUnique.mockResolvedValue({
      id: 'idea-1',
      userId: USER_RESIDENT,
      status: 'under_review',
      propertyId: PROPERTY_A,
    });
    mockIdeaUpdate.mockResolvedValue({ id: 'idea-1', status: 'planned' });

    const req = createPatchRequest('/api/v1/ideas/idea-1', { status: 'planned' });
    const res = await PATCH_IDEA(req, { params: Promise.resolve({ id: 'idea-1' }) });
    expect(res.status).toBe(200);
  });
});

// ===========================================================================
// 11. Idea status — resident cannot change status
// ===========================================================================

describe('11. Idea status — resident cannot change', () => {
  it('returns 403 when resident tries to change status', async () => {
    setAuth(USER_RESIDENT, 'resident');
    mockIdeaFindUnique.mockResolvedValue({
      id: 'idea-1',
      userId: USER_RESIDENT,
      status: 'submitted',
      propertyId: PROPERTY_A,
    });

    const req = createPatchRequest('/api/v1/ideas/idea-1', { status: 'under_review' });
    const res = await PATCH_IDEA(req, { params: Promise.resolve({ id: 'idea-1' }) });
    expect(res.status).toBe(403);
  });
});

// ===========================================================================
// 12. Community events — create event
// ===========================================================================

describe('12. Community events — create event', () => {
  it('creates an event with required fields and returns 201', async () => {
    mockEventCreate.mockResolvedValue({
      id: 'ev-1',
      title: 'Summer BBQ',
      propertyId: PROPERTY_A,
      status: 'draft',
      startDatetime: new Date('2026-07-15T16:00:00Z'),
      endDatetime: new Date('2026-07-15T20:00:00Z'),
      createdById: USER_RESIDENT,
    });

    const req = createPostRequest('/api/v1/community/events', {
      propertyId: PROPERTY_A,
      title: 'Summer BBQ',
      startDatetime: '2026-07-15T16:00:00Z',
      endDatetime: '2026-07-15T20:00:00Z',
    });
    const res = await POST_EVENT(req);
    expect(res.status).toBe(201);
    const body = await parseResponse<{ data: { title: string } }>(res);
    expect(body.data.title).toBe('Summer BBQ');
  });
});

// ===========================================================================
// 13. Community events — list upcoming events
// ===========================================================================

describe('13. Community events — list upcoming', () => {
  it('lists events filtered by propertyId', async () => {
    mockEventFindMany.mockResolvedValue([{ id: 'ev-1', title: 'BBQ', startDatetime: new Date() }]);

    const req = createGetRequest('/api/v1/community/events', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await GET_EVENTS(req);
    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: unknown[] }>(res);
    expect(body.data).toHaveLength(1);
  });

  it('filters upcoming events when upcoming=true', async () => {
    mockEventFindMany.mockResolvedValue([]);

    const req = createGetRequest('/api/v1/community/events', {
      searchParams: { propertyId: PROPERTY_A, upcoming: 'true' },
    });
    await GET_EVENTS(req);

    const where = mockEventFindMany.mock.calls[0]![0].where;
    expect(where.startDatetime).toBeDefined();
    expect(where.startDatetime.gte).toBeInstanceOf(Date);
  });
});

// ===========================================================================
// 14. Community events — reject without title
// ===========================================================================

describe('14. Community events — validation', () => {
  it('rejects event without title', async () => {
    const req = createPostRequest('/api/v1/community/events', {
      propertyId: PROPERTY_A,
      startDatetime: '2026-07-15T16:00:00Z',
      endDatetime: '2026-07-15T20:00:00Z',
    });
    const res = await POST_EVENT(req);
    expect(res.status).toBe(400);
  });

  it('rejects event without startDatetime', async () => {
    const req = createPostRequest('/api/v1/community/events', {
      propertyId: PROPERTY_A,
      title: 'BBQ',
      endDatetime: '2026-07-15T20:00:00Z',
    });
    const res = await POST_EVENT(req);
    expect(res.status).toBe(400);
  });
});

// ===========================================================================
// 15. Community events — tenant isolation
// ===========================================================================

describe('15. Tenant isolation — require propertyId', () => {
  it('rejects ad listing without propertyId', async () => {
    const req = createGetRequest('/api/v1/community');
    const res = await GET_ADS(req);
    expect(res.status).toBe(400);
    expect(mockAdFindMany).not.toHaveBeenCalled();
  });

  it('rejects event listing without propertyId', async () => {
    const req = createGetRequest('/api/v1/community/events');
    const res = await GET_EVENTS(req);
    expect(res.status).toBe(400);
    expect(mockEventFindMany).not.toHaveBeenCalled();
  });

  it('rejects idea listing without propertyId', async () => {
    const req = createGetRequest('/api/v1/ideas');
    const res = await GET_IDEAS(req);
    expect(res.status).toBe(400);
    expect(mockIdeaFindMany).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// 16. Forum — create topic with title, body, category
// ===========================================================================

describe('16. Forum — create topic', () => {
  it('creates a topic with title, body, and category', async () => {
    mockTopicCreate.mockResolvedValue({
      id: 'topic-1',
      title: 'Noise complaint procedure',
      body: 'Can we discuss the process for filing noise complaints?',
      status: 'active',
      replyCount: 0,
      isPinned: false,
      isLocked: false,
    });

    const req = createPostRequest('/api/v1/forum', {
      propertyId: PROPERTY_A,
      title: 'Noise complaint procedure',
      body: 'Can we discuss the process for filing noise complaints?',
      category: 'general',
    });
    const res = await FORUM_POST(req);
    expect(res.status).toBe(201);
  });

  it('stores userId from authenticated user', async () => {
    mockTopicCreate.mockResolvedValue({ id: 'topic-1', status: 'active' });

    const req = createPostRequest('/api/v1/forum', {
      propertyId: PROPERTY_A,
      title: 'User test topic',
      body: 'Checking that userId is stored correctly.',
    });
    await FORUM_POST(req);

    const data = mockTopicCreate.mock.calls[0]![0].data;
    expect(data.userId).toBe(USER_RESIDENT);
  });
});

// ===========================================================================
// 17. Forum — list topics with sorting (pinned first)
// ===========================================================================

describe('17. Forum — sorted listing with pinned first', () => {
  it('orders topics by isPinned desc, lastActivityAt desc', async () => {
    const req = createGetRequest('/api/v1/forum', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await FORUM_GET(req);

    const call = mockTopicFindMany.mock.calls[0]![0];
    expect(call.orderBy).toEqual([{ isPinned: 'desc' }, { lastActivityAt: 'desc' }]);
  });

  it('requires propertyId', async () => {
    const req = createGetRequest('/api/v1/forum');
    const res = await FORUM_GET(req);
    expect(res.status).toBe(400);
  });
});

// ===========================================================================
// 18. Forum — reply to topic
// ===========================================================================

describe('18. Forum — reply to topic', () => {
  it('creates a reply and increments replyCount', async () => {
    mockTopicFindUnique.mockResolvedValue({
      id: 'topic-1',
      userId: USER_OTHER,
      propertyId: PROPERTY_A,
      isLocked: false,
      status: 'active',
      title: 'Test topic',
    });
    mockReplyCreate.mockResolvedValue({ id: 'reply-1', topicId: 'topic-1' });
    mockTopicUpdate.mockResolvedValue({ id: 'topic-1', replyCount: 1 });
    mockNotificationCreate.mockResolvedValue({ id: 'notif-1' });

    const req = createPostRequest('/api/v1/forum/topic-1/replies', {
      body: 'I agree with this discussion.',
    });
    const res = await FORUM_POST_REPLY(req, { params: Promise.resolve({ id: 'topic-1' }) });
    expect(res.status).toBe(201);

    const updateCall = mockTopicUpdate.mock.calls[0]![0];
    expect(updateCall.data.replyCount).toEqual({ increment: 1 });
  });
});

// ===========================================================================
// 19. Forum — reject reply to locked topic
// ===========================================================================

describe('19. Forum — reject reply to locked topic', () => {
  it('returns 403 when topic is locked', async () => {
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
    const res = await FORUM_POST_REPLY(req, { params: Promise.resolve({ id: 'topic-locked' }) });
    expect(res.status).toBe(403);
  });
});

// ===========================================================================
// 20. Forum — nested (threaded) replies
// ===========================================================================

describe('20. Forum — nested replies', () => {
  it('creates a nested reply with parentReplyId', async () => {
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
    });
    mockReplyCreate.mockResolvedValue({
      id: 'reply-2',
      parentReplyId: 'reply-1',
    });
    mockTopicUpdate.mockResolvedValue({ id: 'topic-1', replyCount: 2 });
    mockNotificationCreate.mockResolvedValue({ id: 'notif-1' });

    const req = createPostRequest('/api/v1/forum/topic-1/replies', {
      body: 'Replying to a reply.',
      parentReplyId: 'reply-1',
    });
    const res = await FORUM_POST_REPLY(req, { params: Promise.resolve({ id: 'topic-1' }) });
    expect(res.status).toBe(201);

    const createCall = mockReplyCreate.mock.calls[0]![0];
    expect(createCall.data.parentReplyId).toBe('reply-1');
  });

  it('rejects reply to non-existent parent', async () => {
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
    const res = await FORUM_POST_REPLY(req, { params: Promise.resolve({ id: 'topic-1' }) });
    expect(res.status).toBe(404);
  });
});

// ===========================================================================
// 21. Forum — moderation: admin pin topic
// ===========================================================================

describe('21. Forum — admin pin topic', () => {
  it('allows admin to pin a topic', async () => {
    setAuth(USER_ADMIN, 'property_admin');
    mockTopicFindUnique.mockResolvedValue({
      id: 'topic-1',
      userId: USER_RESIDENT,
      propertyId: PROPERTY_A,
      status: 'active',
      createdAt: new Date(),
    });
    mockTopicUpdate.mockResolvedValue({ id: 'topic-1', isPinned: true });

    const req = createPatchRequest('/api/v1/forum/topic-1', { isPinned: true });
    const res = await FORUM_PATCH(req, { params: Promise.resolve({ id: 'topic-1' }) });
    expect(res.status).toBe(200);
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
    const res = await FORUM_PATCH(req, { params: Promise.resolve({ id: 'topic-1' }) });
    expect(res.status).toBe(403);
  });
});

// ===========================================================================
// 22. Forum — moderation: admin lock topic
// ===========================================================================

describe('22. Forum — admin lock topic', () => {
  it('allows admin to lock a topic', async () => {
    setAuth(USER_ADMIN, 'property_admin');
    mockTopicFindUnique.mockResolvedValue({
      id: 'topic-1',
      userId: USER_RESIDENT,
      propertyId: PROPERTY_A,
      status: 'active',
      createdAt: new Date(),
    });
    mockTopicUpdate.mockResolvedValue({ id: 'topic-1', isLocked: true });

    const req = createPatchRequest('/api/v1/forum/topic-1', { isLocked: true });
    const res = await FORUM_PATCH(req, { params: Promise.resolve({ id: 'topic-1' }) });
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
    const res = await FORUM_PATCH(req, { params: Promise.resolve({ id: 'topic-1' }) });
    expect(res.status).toBe(403);
  });
});

// ===========================================================================
// 23. Forum — author can delete own topic
// ===========================================================================

describe('23. Forum — author deletes own topic', () => {
  it('allows author to soft-delete their topic', async () => {
    mockTopicFindUnique.mockResolvedValue({
      id: 'topic-1',
      userId: USER_RESIDENT,
      propertyId: PROPERTY_A,
      status: 'active',
    });
    mockTopicUpdate.mockResolvedValue({ id: 'topic-1', status: 'deleted' });

    const req = createDeleteRequest('/api/v1/forum/topic-1');
    const res = await FORUM_DELETE(req, { params: Promise.resolve({ id: 'topic-1' }) });
    expect(res.status).toBe(200);

    expect(mockTopicDelete).not.toHaveBeenCalled();
    expect(mockTopicUpdate.mock.calls[0]![0].data.status).toBe('deleted');
  });

  it('rejects delete by non-author non-admin', async () => {
    setAuth(USER_OTHER, 'resident');
    mockTopicFindUnique.mockResolvedValue({
      id: 'topic-1',
      userId: USER_RESIDENT,
      propertyId: PROPERTY_A,
      status: 'active',
    });

    const req = createDeleteRequest('/api/v1/forum/topic-1');
    const res = await FORUM_DELETE(req, { params: Promise.resolve({ id: 'topic-1' }) });
    expect(res.status).toBe(403);
  });
});

// ===========================================================================
// 24. Forum — admin can delete any topic
// ===========================================================================

describe('24. Forum — admin deletes any topic', () => {
  it('allows admin to delete any topic', async () => {
    setAuth(USER_ADMIN, 'property_admin');
    mockTopicFindUnique.mockResolvedValue({
      id: 'topic-1',
      userId: USER_RESIDENT,
      propertyId: PROPERTY_A,
      status: 'active',
    });
    mockTopicUpdate.mockResolvedValue({ id: 'topic-1', status: 'deleted' });

    const req = createDeleteRequest('/api/v1/forum/topic-1');
    const res = await FORUM_DELETE(req, { params: Promise.resolve({ id: 'topic-1' }) });
    expect(res.status).toBe(200);
  });
});

// ===========================================================================
// 25. Forum — XSS prevention on content
// ===========================================================================

describe('25. Forum — XSS prevention', () => {
  it('strips script tags from topic title', async () => {
    mockTopicCreate.mockResolvedValue({ id: 'topic-xss', status: 'active' });

    const req = createPostRequest('/api/v1/forum', {
      propertyId: PROPERTY_A,
      title: '<script>alert("xss")</script>Clean Title',
      body: 'Normal body content for the forum topic.',
    });
    await FORUM_POST(req);

    const data = mockTopicCreate.mock.calls[0]![0].data;
    expect(data.title).not.toContain('<script>');
    expect(data.title).toContain('Clean Title');
  });

  it('strips script tags from topic body', async () => {
    mockTopicCreate.mockResolvedValue({ id: 'topic-xss', status: 'active' });

    const req = createPostRequest('/api/v1/forum', {
      propertyId: PROPERTY_A,
      title: 'Normal Title',
      body: '<img src=x onerror=alert(1)>Normal body here.',
    });
    await FORUM_POST(req);

    const data = mockTopicCreate.mock.calls[0]![0].data;
    expect(data.body).not.toContain('<img');
    expect(data.body).toContain('Normal body here');
  });

  it('strips script tags from reply body', async () => {
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
      body: '<script>steal(cookie)</script>Safe reply.',
    });
    await FORUM_POST_REPLY(req, { params: Promise.resolve({ id: 'topic-1' }) });

    const data = mockReplyCreate.mock.calls[0]![0].data;
    expect(data.body).not.toContain('<script>');
    expect(data.body).toContain('Safe reply');
  });
});

// ===========================================================================
// 26. Forum — notification on reply
// ===========================================================================

describe('26. Forum — notification on reply', () => {
  it('creates notification for topic author when someone else replies', async () => {
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
    await FORUM_POST_REPLY(req, { params: Promise.resolve({ id: 'topic-1' }) });

    expect(mockNotificationCreate).toHaveBeenCalledTimes(1);
    const notifData = mockNotificationCreate.mock.calls[0]![0].data;
    expect(notifData.userId).toBe(USER_OTHER);
    expect(notifData.type).toBe('forum_reply');
  });

  it('does not notify when author replies to own topic', async () => {
    mockTopicFindUnique.mockResolvedValue({
      id: 'topic-1',
      userId: USER_RESIDENT, // same as auth user
      propertyId: PROPERTY_A,
      isLocked: false,
      status: 'active',
    });
    mockReplyCreate.mockResolvedValue({ id: 'reply-self' });
    mockTopicUpdate.mockResolvedValue({ id: 'topic-1', replyCount: 1 });

    const req = createPostRequest('/api/v1/forum/topic-1/replies', {
      body: 'Replying to my own topic.',
    });
    await FORUM_POST_REPLY(req, { params: Promise.resolve({ id: 'topic-1' }) });

    expect(mockNotificationCreate).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// 27. Idea status — full lifecycle
// ===========================================================================

describe('27. Idea status — full lifecycle', () => {
  it('admin transitions planned -> completed', async () => {
    setAuth(USER_ADMIN, 'property_admin');
    mockIdeaFindUnique.mockResolvedValue({
      id: 'idea-1',
      userId: USER_RESIDENT,
      status: 'planned',
      propertyId: PROPERTY_A,
    });
    mockIdeaUpdate.mockResolvedValue({ id: 'idea-1', status: 'completed' });

    const req = createPatchRequest('/api/v1/ideas/idea-1', { status: 'completed' });
    const res = await PATCH_IDEA(req, { params: Promise.resolve({ id: 'idea-1' }) });
    expect(res.status).toBe(200);
  });

  it('admin can decline from submitted', async () => {
    setAuth(USER_ADMIN, 'property_admin');
    mockIdeaFindUnique.mockResolvedValue({
      id: 'idea-1',
      userId: USER_RESIDENT,
      status: 'submitted',
      propertyId: PROPERTY_A,
    });
    mockIdeaUpdate.mockResolvedValue({ id: 'idea-1', status: 'declined' });

    const req = createPatchRequest('/api/v1/ideas/idea-1', { status: 'declined' });
    const res = await PATCH_IDEA(req, { params: Promise.resolve({ id: 'idea-1' }) });
    expect(res.status).toBe(200);
  });
});

// ===========================================================================
// 28. Idea status — reject invalid transition
// ===========================================================================

describe('28. Idea status — reject invalid transition', () => {
  it('rejects transition from completed to submitted', async () => {
    setAuth(USER_ADMIN, 'property_admin');
    mockIdeaFindUnique.mockResolvedValue({
      id: 'idea-1',
      userId: USER_RESIDENT,
      status: 'completed',
      propertyId: PROPERTY_A,
    });

    const req = createPatchRequest('/api/v1/ideas/idea-1', { status: 'submitted' });
    const res = await PATCH_IDEA(req, { params: Promise.resolve({ id: 'idea-1' }) });
    expect(res.status).toBe(400);
  });

  it('rejects transition from declined', async () => {
    setAuth(USER_ADMIN, 'property_admin');
    mockIdeaFindUnique.mockResolvedValue({
      id: 'idea-1',
      userId: USER_RESIDENT,
      status: 'declined',
      propertyId: PROPERTY_A,
    });

    const req = createPatchRequest('/api/v1/ideas/idea-1', { status: 'under_review' });
    const res = await PATCH_IDEA(req, { params: Promise.resolve({ id: 'idea-1' }) });
    expect(res.status).toBe(400);
  });

  it('returns 404 for non-existent idea', async () => {
    setAuth(USER_ADMIN, 'property_admin');
    mockIdeaFindUnique.mockResolvedValue(null);

    const req = createPatchRequest('/api/v1/ideas/idea-ghost', { status: 'under_review' });
    const res = await PATCH_IDEA(req, { params: Promise.resolve({ id: 'idea-ghost' }) });
    expect(res.status).toBe(404);
  });
});

// ===========================================================================
// 29. Classified ad — flagging for moderation
// ===========================================================================

describe('29. Classified ad — flagging', () => {
  it('flags an ad for review and returns 201', async () => {
    mockAdFindUnique.mockResolvedValue({
      id: 'ad-1',
      userId: USER_OTHER,
      status: 'active',
      propertyId: PROPERTY_A,
    });
    mockAdFlagCreate.mockResolvedValue({
      id: 'flag-1',
      adId: 'ad-1',
      userId: USER_RESIDENT,
      reason: 'spam',
    });

    const req = createPostRequest('/api/v1/community/ad-1/flag', {
      reason: 'spam',
    });
    const res = await FLAG_AD(req, { params: Promise.resolve({ id: 'ad-1' }) });
    expect(res.status).toBe(201);
  });

  it('returns 404 when ad does not exist', async () => {
    mockAdFindUnique.mockResolvedValue(null);

    const req = createPostRequest('/api/v1/community/ad-ghost/flag', {
      reason: 'spam',
    });
    const res = await FLAG_AD(req, { params: Promise.resolve({ id: 'ad-ghost' }) });
    expect(res.status).toBe(404);
  });

  it('rejects flag with invalid reason', async () => {
    mockAdFindUnique.mockResolvedValue({
      id: 'ad-1',
      userId: USER_OTHER,
      status: 'active',
      propertyId: PROPERTY_A,
    });

    const req = createPostRequest('/api/v1/community/ad-1/flag', {
      reason: 'invalid_reason',
    });
    const res = await FLAG_AD(req, { params: Promise.resolve({ id: 'ad-1' }) });
    expect(res.status).toBe(400);
  });
});

// ===========================================================================
// 30. Classified ad — auto-expiry after 30 days
// ===========================================================================

describe('30. Classified ad — auto-expiry', () => {
  it('expires active ads older than 30 days', async () => {
    mockAdUpdateMany.mockResolvedValue({ count: 5 });

    const req = createPostRequest('/api/v1/community/expire', {});
    const res = await EXPIRE_ADS(req);

    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: { expiredCount: number } }>(res);
    expect(body.data.expiredCount).toBe(5);

    const updateCall = mockAdUpdateMany.mock.calls[0]![0];
    expect(updateCall.where.status).toBe('active');
    expect(updateCall.data.status).toBe('expired');
    expect(updateCall.where.createdAt.lte).toBeInstanceOf(Date);
  });

  it('returns 0 when no ads need expiring', async () => {
    mockAdUpdateMany.mockResolvedValue({ count: 0 });

    const req = createPostRequest('/api/v1/community/expire', {});
    const res = await EXPIRE_ADS(req);

    const body = await parseResponse<{ data: { expiredCount: number } }>(res);
    expect(body.data.expiredCount).toBe(0);
  });
});

// ===========================================================================
// 31. Classified ad — delete by owner
// ===========================================================================

describe('31. Classified ad — delete by owner', () => {
  it('allows owner to delete their ad', async () => {
    mockAdFindUnique.mockResolvedValue({
      id: 'ad-1',
      userId: USER_RESIDENT,
      status: 'active',
      propertyId: PROPERTY_A,
    });
    mockAdUpdate.mockResolvedValue({ id: 'ad-1', status: 'deleted' });

    const req = createDeleteRequest('/api/v1/community/ad-1');
    const res = await DELETE_AD(req, { params: Promise.resolve({ id: 'ad-1' }) });
    expect(res.status).toBe(200);
  });

  it('returns 404 for non-existent ad', async () => {
    mockAdFindUnique.mockResolvedValue(null);

    const req = createDeleteRequest('/api/v1/community/ad-ghost');
    const res = await DELETE_AD(req, { params: Promise.resolve({ id: 'ad-ghost' }) });
    expect(res.status).toBe(404);
  });
});

// ===========================================================================
// 32. Ad — ad detail by ID
// ===========================================================================

describe('32. Classified ad — get by ID', () => {
  it('returns ad detail with 200', async () => {
    mockAdFindUnique.mockResolvedValue({
      id: 'ad-1',
      title: 'Standing desk',
      userId: USER_RESIDENT,
      status: 'active',
      propertyId: PROPERTY_A,
    });

    const req = createGetRequest('/api/v1/community/ad-1');
    const res = await GET_AD_ID(req, { params: Promise.resolve({ id: 'ad-1' }) });
    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: { id: string; title: string } }>(res);
    expect(body.data.title).toBe('Standing desk');
  });

  it('returns 404 for non-existent ad', async () => {
    mockAdFindUnique.mockResolvedValue(null);

    const req = createGetRequest('/api/v1/community/ad-ghost');
    const res = await GET_AD_ID(req, { params: Promise.resolve({ id: 'ad-ghost' }) });
    expect(res.status).toBe(404);
  });
});

// ===========================================================================
// 33. Community engagement — vote removal
// ===========================================================================

describe('33. Community engagement — vote removal and idea detail', () => {
  it('allows user to remove their vote', async () => {
    mockIdeaFindUnique.mockResolvedValue({
      id: 'idea-1',
      userId: USER_OTHER,
      status: 'submitted',
      propertyId: PROPERTY_A,
    });
    mockVoteFindUnique.mockResolvedValue({
      id: 'vote-1',
      ideaId: 'idea-1',
      userId: USER_RESIDENT,
    });
    mockVoteDelete.mockResolvedValue({ id: 'vote-1' });
    mockVoteCount.mockResolvedValue(0);
    mockIdeaUpdate.mockResolvedValue({ id: 'idea-1', voteCount: 0 });

    const req = createDeleteRequest('/api/v1/ideas/idea-1/vote');
    const res = await VOTE_DELETE(req, { params: Promise.resolve({ id: 'idea-1' }) });
    expect(res.status).toBe(200);
  });

  it('returns 404 when removing non-existent vote', async () => {
    mockIdeaFindUnique.mockResolvedValue({
      id: 'idea-1',
      userId: USER_OTHER,
      status: 'submitted',
      propertyId: PROPERTY_A,
    });
    mockVoteFindUnique.mockResolvedValue(null);

    const req = createDeleteRequest('/api/v1/ideas/idea-1/vote');
    const res = await VOTE_DELETE(req, { params: Promise.resolve({ id: 'idea-1' }) });
    expect(res.status).toBe(404);
  });

  it('returns idea detail with votes', async () => {
    mockIdeaFindUnique.mockResolvedValue({
      id: 'idea-1',
      title: 'Rooftop garden',
      status: 'submitted',
      voteCount: 5,
      votes: [
        { id: 'v1', userId: 'user-a' },
        { id: 'v2', userId: 'user-b' },
      ],
    });
    mockCommentFindMany.mockResolvedValue([]);

    const req = createGetRequest('/api/v1/ideas/idea-1');
    const res = await GET_IDEA_ID(req, { params: Promise.resolve({ id: 'idea-1' }) });
    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: { votes: unknown[] } }>(res);
    expect(body.data.votes).toHaveLength(2);
  });

  it('returns 404 for non-existent idea detail', async () => {
    mockIdeaFindUnique.mockResolvedValue(null);

    const req = createGetRequest('/api/v1/ideas/idea-ghost');
    const res = await GET_IDEA_ID(req, { params: Promise.resolve({ id: 'idea-ghost' }) });
    expect(res.status).toBe(404);
  });

  it('returns 404 when voting on non-existent idea', async () => {
    mockIdeaFindUnique.mockResolvedValue(null);

    const req = createPostRequest('/api/v1/ideas/idea-ghost/vote', {});
    const res = await VOTE_POST(req, { params: Promise.resolve({ id: 'idea-ghost' }) });
    expect(res.status).toBe(404);
  });
});
