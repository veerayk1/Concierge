/**
 * Idea Board API Tests — per Condo Control unique features
 *
 * Covers:
 * 1. POST /ideas — create idea with title, description
 * 2. GET /ideas — list ideas sorted by votes (most popular first)
 * 3. POST /ideas/:id/vote — upvote/downvote an idea
 * 4. Cannot vote on own idea
 * 5. Cannot vote twice on same idea
 * 6. Status transitions: submitted -> under_review -> planned -> completed -> declined
 * 7. Only admin can change idea status
 * 8. Comment on ideas
 * 9. Vote count aggregation
 * 10. Category tagging for ideas
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  createGetRequest,
  createPostRequest,
  createPatchRequest,
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
// 1. POST /ideas — create idea with title, description
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

  it('rejects missing title', async () => {
    const req = createPostRequest('/api/v1/ideas', {
      propertyId: PROPERTY_A,
      description: 'Some description for the idea board.',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects missing description', async () => {
    const req = createPostRequest('/api/v1/ideas', {
      propertyId: PROPERTY_A,
      title: 'Missing description idea',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
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
// 2. GET /ideas — list ideas sorted by votes (most popular first)
// ---------------------------------------------------------------------------

describe('GET /ideas — List sorted by votes', () => {
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

  it('requires propertyId', async () => {
    const req = createGetRequest('/api/v1/ideas');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('includes vote data in response', async () => {
    const req = createGetRequest('/api/v1/ideas', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET(req);

    const call = mockIdeaFindMany.mock.calls[0]![0];
    expect(call.include.votes).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// 3. POST /ideas/:id/vote — upvote/downvote an idea
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

  it('returns 404 for non-existent idea', async () => {
    mockIdeaFindUnique.mockResolvedValue(null);

    const req = createPostRequest('/api/v1/ideas/idea-ghost/vote', {});
    const res = await VOTE_POST(req, { params: Promise.resolve({ id: 'idea-ghost' }) });
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// 4. Cannot vote on own idea
// ---------------------------------------------------------------------------

describe('POST /ideas/:id/vote — Cannot vote on own idea', () => {
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
// 5. Cannot vote twice on same idea
// ---------------------------------------------------------------------------

describe('POST /ideas/:id/vote — Cannot vote twice', () => {
  it('rejects duplicate vote', async () => {
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
// 6. Status transitions: submitted -> under_review -> planned -> completed -> declined
// ---------------------------------------------------------------------------

describe('PATCH /ideas/:id — Status transitions', () => {
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

  it('allows declining from submitted', async () => {
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
});

// ---------------------------------------------------------------------------
// 7. Only admin can change idea status
// ---------------------------------------------------------------------------

describe('PATCH /ideas/:id — Admin-only status changes', () => {
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

  it('allows admin to change status', async () => {
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
// 8. Comment on ideas
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

    const req = createPostRequest('/api/v1/ideas/idea-ghost/comments', {
      content: 'Comment on ghost idea',
    });
    const res = await COMMENT_POST(req, { params: Promise.resolve({ id: 'idea-ghost' }) });
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// 9. Vote count aggregation
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

    // Verify the idea's voteCount was updated
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
// 10. Category tagging for ideas
// ---------------------------------------------------------------------------

describe('Ideas — Category tagging', () => {
  it('creates idea with a category tag', async () => {
    mockIdeaCreate.mockResolvedValue({
      id: 'idea-1',
      status: 'submitted',
      category: 'amenities',
    });

    const req = createPostRequest('/api/v1/ideas', {
      propertyId: PROPERTY_A,
      title: 'Better pool hours',
      description: 'Extend pool hours to 10 PM on weekends for residents.',
      category: 'amenities',
    });
    const res = await POST(req);
    expect(res.status).toBe(201);

    const data = mockIdeaCreate.mock.calls[0]![0].data;
    expect(data.category).toBe('amenities');
  });

  it('filters ideas by category', async () => {
    const req = createGetRequest('/api/v1/ideas', {
      searchParams: { propertyId: PROPERTY_A, category: 'amenities' },
    });
    await GET(req);

    const call = mockIdeaFindMany.mock.calls[0]![0];
    expect(call.where.category).toBe('amenities');
  });

  it('returns ideas without category filter when none specified', async () => {
    const req = createGetRequest('/api/v1/ideas', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET(req);

    const call = mockIdeaFindMany.mock.calls[0]![0];
    expect(call.where.category).toBeUndefined();
  });

  it('accepts category as optional field', async () => {
    mockIdeaCreate.mockResolvedValue({ id: 'idea-no-cat', status: 'submitted' });

    const req = createPostRequest('/api/v1/ideas', {
      propertyId: PROPERTY_A,
      title: 'General suggestion',
      description: 'Just a general idea without a specific category.',
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });
});

// We need createDeleteRequest for vote removal tests
import { createDeleteRequest } from '@/test/helpers/api';
