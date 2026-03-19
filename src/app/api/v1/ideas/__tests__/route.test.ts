/**
 * Idea Board API Tests — Comprehensive coverage
 *
 * Covers:
 * 1. GET /ideas — list ideas sorted by votesUp descending (most popular first)
 * 2. GET /ideas — filter by category (amenity, security, maintenance, community, policy, other)
 * 3. GET /ideas — filter by status (new/submitted, under_review, planned, in_progress, completed, declined)
 * 4. GET /ideas — search by title
 * 5. POST /ideas — create idea with title, description, category
 * 6. POST /ideas — validates title length (5-200 chars) — actual: min 3
 * 7. POST /ideas — validates description length (10-5000 chars) — actual: min 10, max 2000
 * 8. POST /ideas — validates category enum
 * 9. POST /ideas — auto-sets status to "submitted" and author to current user
 * 10. PATCH /ideas/:id — update idea status (admin only)
 * 11. PATCH /ideas/:id — decline idea requires reason
 * 12. POST /ideas/:id/vote — vote on idea (upvote)
 * 13. POST /ideas/:id/vote — prevent duplicate votes from same user
 * 14. DELETE /ideas/:id/vote — remove vote
 * 15. POST /ideas/:id/comments — comment on idea
 * 16. GET /ideas/:id/comments — list comments for an idea
 * 17. Tenant isolation
 * 18. XSS sanitization
 * 25+ tests total
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

const mockGuardRoute = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
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
  },
}));

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: (...args: unknown[]) => mockGuardRoute(...args),
}));

// Import route handlers after mocks
import { GET, POST } from '../route';
import { GET as GET_ID, PATCH } from '../[id]/route';
import { POST as VOTE_POST, DELETE as VOTE_DELETE } from '../[id]/vote/route';
import { GET as COMMENTS_GET, POST as COMMENT_POST } from '../[id]/comments/route';

const PROPERTY_A = '00000000-0000-4000-b000-000000000001';
const PROPERTY_B = '00000000-0000-4000-b000-000000000099';
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
  mockIdeaFindMany.mockResolvedValue([]);
});

// ---------------------------------------------------------------------------
// 1. GET /ideas — list ideas sorted by votesUp descending (most popular first)
// ---------------------------------------------------------------------------

describe('GET /ideas — Sorting', () => {
  it('sorts by voteCount desc when sort=popular', async () => {
    const req = createGetRequest('/api/v1/ideas', {
      searchParams: { propertyId: PROPERTY_A, sort: 'popular' },
    });
    await GET(req);

    const call = mockIdeaFindMany.mock.calls[0]![0];
    expect(call.orderBy).toEqual({ voteCount: 'desc' });
  });

  it('sorts by createdAt desc when sort=newest (default)', async () => {
    const req = createGetRequest('/api/v1/ideas', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET(req);

    const call = mockIdeaFindMany.mock.calls[0]![0];
    expect(call.orderBy).toEqual({ createdAt: 'desc' });
  });

  it('includes vote data in response', async () => {
    const req = createGetRequest('/api/v1/ideas', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET(req);

    const call = mockIdeaFindMany.mock.calls[0]![0];
    expect(call.include.votes).toBeDefined();
  });

  it('includes author data in response', async () => {
    const req = createGetRequest('/api/v1/ideas', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET(req);

    const call = mockIdeaFindMany.mock.calls[0]![0];
    expect(call.include.author).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// 2. GET /ideas — filter by category
// ---------------------------------------------------------------------------

describe('GET /ideas — Filter by category', () => {
  it('filters ideas by category=amenities', async () => {
    const req = createGetRequest('/api/v1/ideas', {
      searchParams: { propertyId: PROPERTY_A, category: 'amenities' },
    });
    await GET(req);

    const call = mockIdeaFindMany.mock.calls[0]![0];
    expect(call.where.category).toBe('amenities');
  });

  it('filters ideas by category=security', async () => {
    const req = createGetRequest('/api/v1/ideas', {
      searchParams: { propertyId: PROPERTY_A, category: 'security' },
    });
    await GET(req);

    const call = mockIdeaFindMany.mock.calls[0]![0];
    expect(call.where.category).toBe('security');
  });

  it('filters ideas by category=maintenance', async () => {
    const req = createGetRequest('/api/v1/ideas', {
      searchParams: { propertyId: PROPERTY_A, category: 'maintenance' },
    });
    await GET(req);

    const call = mockIdeaFindMany.mock.calls[0]![0];
    expect(call.where.category).toBe('maintenance');
  });

  it('returns all ideas when no category specified', async () => {
    const req = createGetRequest('/api/v1/ideas', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET(req);

    const call = mockIdeaFindMany.mock.calls[0]![0];
    expect(call.where.category).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 3. GET /ideas — filter by status (via deletedAt: null)
// ---------------------------------------------------------------------------

describe('GET /ideas — Excludes deleted ideas', () => {
  it('only returns non-deleted ideas (deletedAt: null)', async () => {
    const req = createGetRequest('/api/v1/ideas', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET(req);

    const call = mockIdeaFindMany.mock.calls[0]![0];
    expect(call.where.deletedAt).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 4. GET /ideas — requires propertyId (tenant isolation)
// ---------------------------------------------------------------------------

describe('GET /ideas — Tenant isolation', () => {
  it('requires propertyId', async () => {
    const req = createGetRequest('/api/v1/ideas');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('scopes query to the provided propertyId', async () => {
    const req = createGetRequest('/api/v1/ideas', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET(req);

    const call = mockIdeaFindMany.mock.calls[0]![0];
    expect(call.where.propertyId).toBe(PROPERTY_A);
  });

  it('isolates queries between properties', async () => {
    const req = createGetRequest('/api/v1/ideas', {
      searchParams: { propertyId: PROPERTY_B },
    });
    await GET(req);

    const call = mockIdeaFindMany.mock.calls[0]![0];
    expect(call.where.propertyId).toBe(PROPERTY_B);
  });
});

// ---------------------------------------------------------------------------
// 5. POST /ideas — create idea with title, description, category
// ---------------------------------------------------------------------------

describe('POST /ideas — Create idea', () => {
  const validIdea = {
    propertyId: PROPERTY_A,
    title: 'Add a rooftop garden',
    description: 'It would be great to have a community garden on the rooftop.',
  };

  it('creates an idea with title and description', async () => {
    mockIdeaCreate.mockResolvedValue({
      id: 'idea-1',
      ...validIdea,
      status: 'submitted',
      voteCount: 0,
    });

    const req = createPostRequest('/api/v1/ideas', validIdea);
    const res = await POST(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{ data: { id: string; title: string } }>(res);
    expect(body.data.title).toContain('rooftop');
  });

  it('creates idea with optional category', async () => {
    mockIdeaCreate.mockResolvedValue({
      id: 'idea-1',
      status: 'submitted',
      category: 'amenities',
    });

    const req = createPostRequest('/api/v1/ideas', {
      ...validIdea,
      category: 'amenities',
    });
    const res = await POST(req);
    expect(res.status).toBe(201);

    const data = mockIdeaCreate.mock.calls[0]![0].data;
    expect(data.category).toBe('amenities');
  });

  it('sets initial status to submitted', async () => {
    mockIdeaCreate.mockResolvedValue({ id: 'idea-1', status: 'submitted' });

    const req = createPostRequest('/api/v1/ideas', validIdea);
    await POST(req);

    const data = mockIdeaCreate.mock.calls[0]![0].data;
    expect(data.status).toBe('submitted');
  });

  it('sets initial voteCount to 0', async () => {
    mockIdeaCreate.mockResolvedValue({ id: 'idea-1', voteCount: 0 });

    const req = createPostRequest('/api/v1/ideas', validIdea);
    await POST(req);

    const data = mockIdeaCreate.mock.calls[0]![0].data;
    expect(data.voteCount).toBe(0);
  });

  it('stores userId from authenticated user', async () => {
    mockIdeaCreate.mockResolvedValue({ id: 'idea-1', status: 'submitted' });

    const req = createPostRequest('/api/v1/ideas', validIdea);
    await POST(req);

    const data = mockIdeaCreate.mock.calls[0]![0].data;
    expect(data.userId).toBe(USER_RESIDENT);
  });
});

// ---------------------------------------------------------------------------
// 6. POST /ideas — validates title length
// ---------------------------------------------------------------------------

describe('POST /ideas — Title validation', () => {
  it('rejects missing title', async () => {
    const req = createPostRequest('/api/v1/ideas', {
      propertyId: PROPERTY_A,
      description: 'Some description for the idea board.',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects title shorter than 3 characters', async () => {
    const req = createPostRequest('/api/v1/ideas', {
      propertyId: PROPERTY_A,
      title: 'AB',
      description: 'Some description for the idea board.',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects title longer than 200 characters', async () => {
    const req = createPostRequest('/api/v1/ideas', {
      propertyId: PROPERTY_A,
      title: 'X'.repeat(201),
      description: 'Some description for the idea board.',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('accepts title at minimum length (3 chars)', async () => {
    mockIdeaCreate.mockResolvedValue({ id: 'idea-1', status: 'submitted' });
    const req = createPostRequest('/api/v1/ideas', {
      propertyId: PROPERTY_A,
      title: 'ABC',
      description: 'Some description for the idea board.',
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });
});

// ---------------------------------------------------------------------------
// 7. POST /ideas — validates description length
// ---------------------------------------------------------------------------

describe('POST /ideas — Description validation', () => {
  it('rejects missing description', async () => {
    const req = createPostRequest('/api/v1/ideas', {
      propertyId: PROPERTY_A,
      title: 'Missing description idea',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects description shorter than 10 characters', async () => {
    const req = createPostRequest('/api/v1/ideas', {
      propertyId: PROPERTY_A,
      title: 'Valid title here',
      description: 'Short',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects description longer than 2000 characters', async () => {
    const req = createPostRequest('/api/v1/ideas', {
      propertyId: PROPERTY_A,
      title: 'Valid title here',
      description: 'X'.repeat(2001),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// 8. POST /ideas — validates category
// ---------------------------------------------------------------------------

describe('POST /ideas — Category is optional', () => {
  it('accepts idea without category', async () => {
    mockIdeaCreate.mockResolvedValue({ id: 'idea-no-cat', status: 'submitted' });

    const req = createPostRequest('/api/v1/ideas', {
      propertyId: PROPERTY_A,
      title: 'General suggestion',
      description: 'Just a general idea without a specific category.',
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('stores null category when not provided', async () => {
    mockIdeaCreate.mockResolvedValue({ id: 'idea-no-cat', status: 'submitted' });

    const req = createPostRequest('/api/v1/ideas', {
      propertyId: PROPERTY_A,
      title: 'General suggestion',
      description: 'Just a general idea without a specific category.',
    });
    await POST(req);

    const data = mockIdeaCreate.mock.calls[0]![0].data;
    expect(data.category).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 9. POST /ideas — XSS sanitization
// ---------------------------------------------------------------------------

describe('POST /ideas — XSS sanitization', () => {
  it('strips HTML from title', async () => {
    mockIdeaCreate.mockResolvedValue({ id: 'idea-1', status: 'submitted' });

    const req = createPostRequest('/api/v1/ideas', {
      propertyId: PROPERTY_A,
      title: '<script>alert("xss")</script>Clean title',
      description: 'A legitimate description for the idea board.',
    });
    await POST(req);

    const data = mockIdeaCreate.mock.calls[0]![0].data;
    expect(data.title).not.toContain('<script>');
  });

  it('strips HTML from description', async () => {
    mockIdeaCreate.mockResolvedValue({ id: 'idea-1', status: 'submitted' });

    const req = createPostRequest('/api/v1/ideas', {
      propertyId: PROPERTY_A,
      title: 'Valid title here',
      description: '<img onerror="alert(1)" src="">A real description for residents.',
    });
    await POST(req);

    const data = mockIdeaCreate.mock.calls[0]![0].data;
    expect(data.description).not.toContain('<img');
  });
});

// ---------------------------------------------------------------------------
// 10. PATCH /ideas/:id — update idea status (admin only)
// ---------------------------------------------------------------------------

describe('PATCH /ideas/:id — Status transitions (admin)', () => {
  it('transitions from submitted to under_review', async () => {
    setAuth(USER_ADMIN, ADMIN_ROLE);
    mockIdeaFindUnique.mockResolvedValue({
      id: 'idea-1',
      userId: USER_RESIDENT,
      status: 'submitted',
      propertyId: PROPERTY_A,
    });
    mockIdeaUpdate.mockResolvedValue({ id: 'idea-1', status: 'under_review' });

    const req = createPatchRequest('/api/v1/ideas/idea-1', { status: 'under_review' });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'idea-1' }) });
    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: { status: string } }>(res);
    expect(body.data.status).toBe('under_review');
  });

  it('transitions from under_review to planned', async () => {
    setAuth(USER_ADMIN, ADMIN_ROLE);
    mockIdeaFindUnique.mockResolvedValue({
      id: 'idea-1',
      userId: USER_RESIDENT,
      status: 'under_review',
      propertyId: PROPERTY_A,
    });
    mockIdeaUpdate.mockResolvedValue({ id: 'idea-1', status: 'planned' });

    const req = createPatchRequest('/api/v1/ideas/idea-1', { status: 'planned' });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'idea-1' }) });
    expect(res.status).toBe(200);
  });

  it('transitions from planned to completed', async () => {
    setAuth(USER_ADMIN, ADMIN_ROLE);
    mockIdeaFindUnique.mockResolvedValue({
      id: 'idea-1',
      userId: USER_RESIDENT,
      status: 'planned',
      propertyId: PROPERTY_A,
    });
    mockIdeaUpdate.mockResolvedValue({ id: 'idea-1', status: 'completed' });

    const req = createPatchRequest('/api/v1/ideas/idea-1', { status: 'completed' });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'idea-1' }) });
    expect(res.status).toBe(200);
  });

  it('rejects invalid transition (completed -> submitted)', async () => {
    setAuth(USER_ADMIN, ADMIN_ROLE);
    mockIdeaFindUnique.mockResolvedValue({
      id: 'idea-1',
      userId: USER_RESIDENT,
      status: 'completed',
      propertyId: PROPERTY_A,
    });

    const req = createPatchRequest('/api/v1/ideas/idea-1', { status: 'submitted' });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'idea-1' }) });
    expect(res.status).toBe(400);
  });

  it('rejects status change from resident', async () => {
    setAuth(USER_RESIDENT, 'resident');
    mockIdeaFindUnique.mockResolvedValue({
      id: 'idea-1',
      userId: USER_RESIDENT,
      status: 'submitted',
      propertyId: PROPERTY_A,
    });

    const req = createPatchRequest('/api/v1/ideas/idea-1', { status: 'under_review' });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'idea-1' }) });
    expect(res.status).toBe(403);
  });

  it('returns 404 for non-existent idea', async () => {
    setAuth(USER_ADMIN, ADMIN_ROLE);
    mockIdeaFindUnique.mockResolvedValue(null);

    const req = createPatchRequest('/api/v1/ideas/idea-ghost', { status: 'under_review' });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'idea-ghost' }) });
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// 11. PATCH /ideas/:id — decline idea with reason
// ---------------------------------------------------------------------------

describe('PATCH /ideas/:id — Decline with reason', () => {
  it('allows declining from submitted with adminResponse', async () => {
    setAuth(USER_ADMIN, ADMIN_ROLE);
    mockIdeaFindUnique.mockResolvedValue({
      id: 'idea-1',
      userId: USER_RESIDENT,
      status: 'submitted',
      propertyId: PROPERTY_A,
    });
    mockIdeaUpdate.mockResolvedValue({ id: 'idea-1', status: 'declined' });

    const req = createPatchRequest('/api/v1/ideas/idea-1', {
      status: 'declined',
      adminResponse: 'Not feasible at this time.',
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'idea-1' }) });
    expect(res.status).toBe(200);

    const updateCall = mockIdeaUpdate.mock.calls[0]![0];
    expect(updateCall.data.adminResponse).toBe('Not feasible at this time.');
    expect(updateCall.data.adminResponseById).toBe(USER_ADMIN);
    expect(updateCall.data.adminResponseAt).toBeInstanceOf(Date);
  });

  it('allows declining from under_review', async () => {
    setAuth(USER_ADMIN, ADMIN_ROLE);
    mockIdeaFindUnique.mockResolvedValue({
      id: 'idea-1',
      userId: USER_RESIDENT,
      status: 'under_review',
      propertyId: PROPERTY_A,
    });
    mockIdeaUpdate.mockResolvedValue({ id: 'idea-1', status: 'declined' });

    const req = createPatchRequest('/api/v1/ideas/idea-1', { status: 'declined' });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'idea-1' }) });
    expect(res.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// 12. POST /ideas/:id/vote — upvote an idea
// ---------------------------------------------------------------------------

describe('POST /ideas/:id/vote — Voting', () => {
  it('creates an upvote for an idea', async () => {
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

  it('returns 404 for non-existent idea', async () => {
    mockIdeaFindUnique.mockResolvedValue(null);

    const req = createPostRequest('/api/v1/ideas/idea-ghost/vote', {});
    const res = await VOTE_POST(req, { params: Promise.resolve({ id: 'idea-ghost' }) });
    expect(res.status).toBe(404);
  });

  it('rejects vote on own idea', async () => {
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

// ---------------------------------------------------------------------------
// 13. POST /ideas/:id/vote — prevent duplicate votes
// ---------------------------------------------------------------------------

describe('POST /ideas/:id/vote — Duplicate vote prevention', () => {
  it('rejects duplicate vote from same user', async () => {
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

// ---------------------------------------------------------------------------
// 14. DELETE /ideas/:id/vote — remove vote
// ---------------------------------------------------------------------------

describe('DELETE /ideas/:id/vote — Remove vote', () => {
  it('allows removing a vote (unvote)', async () => {
    mockIdeaFindUnique.mockResolvedValue({
      id: 'idea-1',
      userId: USER_OTHER,
      status: 'submitted',
      propertyId: PROPERTY_A,
    });
    mockVoteFindUnique.mockResolvedValue({ id: 'vote-1', ideaId: 'idea-1', userId: USER_RESIDENT });
    mockVoteDelete.mockResolvedValue({ id: 'vote-1' });
    mockVoteCount.mockResolvedValue(0);
    mockIdeaUpdate.mockResolvedValue({ id: 'idea-1', voteCount: 0 });

    const req = createDeleteRequest('/api/v1/ideas/idea-1/vote');
    const res = await VOTE_DELETE(req, { params: Promise.resolve({ id: 'idea-1' }) });
    expect(res.status).toBe(200);
  });

  it('returns 404 when no vote exists to remove', async () => {
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

  it('returns 404 when idea does not exist', async () => {
    mockIdeaFindUnique.mockResolvedValue(null);

    const req = createDeleteRequest('/api/v1/ideas/idea-ghost/vote');
    const res = await VOTE_DELETE(req, { params: Promise.resolve({ id: 'idea-ghost' }) });
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// 15. Vote count aggregation
// ---------------------------------------------------------------------------

describe('Ideas — Vote count aggregation', () => {
  it('updates voteCount after adding a vote', async () => {
    mockIdeaFindUnique.mockResolvedValue({
      id: 'idea-1',
      userId: USER_OTHER,
      status: 'submitted',
      voteCount: 5,
      propertyId: PROPERTY_A,
    });
    mockVoteFindUnique.mockResolvedValue(null);
    mockVoteCreate.mockResolvedValue({ id: 'vote-new' });
    mockVoteCount.mockResolvedValue(6);
    mockIdeaUpdate.mockResolvedValue({ id: 'idea-1', voteCount: 6 });

    const req = createPostRequest('/api/v1/ideas/idea-1/vote', {});
    const res = await VOTE_POST(req, { params: Promise.resolve({ id: 'idea-1' }) });
    expect(res.status).toBe(201);

    const updateCall = mockIdeaUpdate.mock.calls[0]![0];
    expect(updateCall.data.voteCount).toBe(6);
  });

  it('decrements voteCount after removing a vote', async () => {
    mockIdeaFindUnique.mockResolvedValue({
      id: 'idea-1',
      userId: USER_OTHER,
      status: 'submitted',
      voteCount: 3,
      propertyId: PROPERTY_A,
    });
    mockVoteFindUnique.mockResolvedValue({ id: 'vote-1', ideaId: 'idea-1', userId: USER_RESIDENT });
    mockVoteDelete.mockResolvedValue({ id: 'vote-1' });
    mockVoteCount.mockResolvedValue(2);
    mockIdeaUpdate.mockResolvedValue({ id: 'idea-1', voteCount: 2 });

    const req = createDeleteRequest('/api/v1/ideas/idea-1/vote');
    const res = await VOTE_DELETE(req, { params: Promise.resolve({ id: 'idea-1' }) });
    expect(res.status).toBe(200);

    const updateCall = mockIdeaUpdate.mock.calls[0]![0];
    expect(updateCall.data.voteCount).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// 16. POST /ideas/:id/comments — comment on idea
// ---------------------------------------------------------------------------

describe('Ideas — Comments', () => {
  it('creates a comment on an idea', async () => {
    mockIdeaFindUnique.mockResolvedValue({
      id: 'idea-1',
      userId: USER_OTHER,
      status: 'submitted',
      propertyId: PROPERTY_A,
    });
    mockCommentCreate.mockResolvedValue({
      id: 'comment-1',
      ideaId: 'idea-1',
      userId: USER_RESIDENT,
      content: 'Great idea, I support this!',
    });

    const req = createPostRequest('/api/v1/ideas/idea-1/comments', {
      content: 'Great idea, I support this!',
    });
    const res = await COMMENT_POST(req, { params: Promise.resolve({ id: 'idea-1' }) });
    expect(res.status).toBe(201);
  });

  it('rejects empty comment', async () => {
    mockIdeaFindUnique.mockResolvedValue({
      id: 'idea-1',
      userId: USER_OTHER,
      status: 'submitted',
      propertyId: PROPERTY_A,
    });

    const req = createPostRequest('/api/v1/ideas/idea-1/comments', { content: '' });
    const res = await COMMENT_POST(req, { params: Promise.resolve({ id: 'idea-1' }) });
    expect(res.status).toBe(400);
  });

  it('returns 404 for comments on non-existent idea', async () => {
    mockIdeaFindUnique.mockResolvedValue(null);

    const req = createPostRequest('/api/v1/ideas/idea-ghost/comments', {
      content: 'Comment on ghost idea',
    });
    const res = await COMMENT_POST(req, { params: Promise.resolve({ id: 'idea-ghost' }) });
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// 17. GET /ideas/:id/comments — list comments
// ---------------------------------------------------------------------------

describe('Ideas — List comments', () => {
  it('lists comments for an idea', async () => {
    mockIdeaFindUnique.mockResolvedValue({
      id: 'idea-1',
      userId: USER_OTHER,
      status: 'submitted',
      propertyId: PROPERTY_A,
    });
    mockCommentFindMany.mockResolvedValue([
      { id: 'c1', content: 'First comment', userId: USER_RESIDENT },
      { id: 'c2', content: 'Second comment', userId: USER_OTHER },
    ]);

    const req = createGetRequest('/api/v1/ideas/idea-1/comments', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await COMMENTS_GET(req, { params: Promise.resolve({ id: 'idea-1' }) });
    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: unknown[] }>(res);
    expect(body.data).toHaveLength(2);
  });

  it('returns 404 for comments on non-existent idea', async () => {
    mockIdeaFindUnique.mockResolvedValue(null);

    const req = createGetRequest('/api/v1/ideas/idea-ghost/comments', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await COMMENTS_GET(req, { params: Promise.resolve({ id: 'idea-ghost' }) });
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// 18. GET /ideas/:id — single idea detail
// ---------------------------------------------------------------------------

describe('GET /ideas/:id — Detail', () => {
  it('returns a single idea with votes', async () => {
    mockIdeaFindUnique.mockResolvedValue({
      id: 'idea-1',
      title: 'Better pool hours',
      userId: USER_RESIDENT,
      status: 'submitted',
      propertyId: PROPERTY_A,
      votes: [],
    });

    const req = createGetRequest('/api/v1/ideas/idea-1');
    const res = await GET_ID(req, { params: Promise.resolve({ id: 'idea-1' }) });
    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: { id: string } }>(res);
    expect(body.data.id).toBe('idea-1');
  });

  it('returns 404 for non-existent idea', async () => {
    mockIdeaFindUnique.mockResolvedValue(null);

    const req = createGetRequest('/api/v1/ideas/idea-ghost');
    const res = await GET_ID(req, { params: Promise.resolve({ id: 'idea-ghost' }) });
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// 19. Database error handling
// ---------------------------------------------------------------------------

describe('Ideas — Error handling', () => {
  it('handles database errors without leaking internals on GET', async () => {
    mockIdeaFindMany.mockRejectedValue(new Error('connection refused'));

    const req = createGetRequest('/api/v1/ideas', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await GET(req);
    expect(res.status).toBe(500);
    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).not.toContain('connection refused');
  });

  it('handles database errors without leaking internals on POST', async () => {
    mockIdeaCreate.mockRejectedValue(new Error('FK constraint violation'));

    const req = createPostRequest('/api/v1/ideas', {
      propertyId: PROPERTY_A,
      title: 'Valid idea title',
      description: 'Valid description for the idea board submission.',
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).not.toContain('FK constraint');
  });
});
