/**
 * Community Module — Comprehensive Tests (PRD 12)
 *
 * TDD coverage for classified ads lifecycle, ad categories/search,
 * idea board with voting, idea status transitions, community events,
 * event RSVP tracking, and forum topics/replies.
 *
 * Tests 1-15:
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
  },
}));

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: (...args: unknown[]) => mockGuardRoute(...args),
}));

// Import route handlers after mocks
import { GET as GET_ADS, POST as POST_AD } from '../route';
import { GET as GET_AD_ID, PATCH as PATCH_AD, DELETE as DELETE_AD } from '../[id]/route';
import { GET as GET_EVENTS, POST as POST_EVENT } from '../events/route';

import { GET as GET_IDEAS, POST as POST_IDEA } from '../../ideas/route';
import { PATCH as PATCH_IDEA } from '../../ideas/[id]/route';
import { POST as VOTE_POST } from '../../ideas/[id]/vote/route';

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
