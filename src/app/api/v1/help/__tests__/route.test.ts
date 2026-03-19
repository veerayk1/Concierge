/**
 * Help Center & Knowledge Base API Route Tests — per PRD 25
 *
 * The help center is how users self-serve answers and how admins manage
 * support tickets. If contextual help fails, support ticket volume spikes.
 * If ticket visibility leaks, users see other tenants' private issues.
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

const mockArticleFindMany = vi.fn();
const mockArticleFindUnique = vi.fn();
const mockArticleCount = vi.fn();
const mockArticleCreate = vi.fn();
const mockArticleUpdate = vi.fn();

const mockTicketFindMany = vi.fn();
const mockTicketFindUnique = vi.fn();
const mockTicketCount = vi.fn();
const mockTicketCreate = vi.fn();
const mockTicketUpdate = vi.fn();

const mockCommentFindMany = vi.fn();
const mockCommentCreate = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    helpArticle: {
      findMany: (...args: unknown[]) => mockArticleFindMany(...args),
      findUnique: (...args: unknown[]) => mockArticleFindUnique(...args),
      count: (...args: unknown[]) => mockArticleCount(...args),
      create: (...args: unknown[]) => mockArticleCreate(...args),
      update: (...args: unknown[]) => mockArticleUpdate(...args),
    },
    supportTicket: {
      findMany: (...args: unknown[]) => mockTicketFindMany(...args),
      findUnique: (...args: unknown[]) => mockTicketFindUnique(...args),
      count: (...args: unknown[]) => mockTicketCount(...args),
      create: (...args: unknown[]) => mockTicketCreate(...args),
      update: (...args: unknown[]) => mockTicketUpdate(...args),
    },
    ticketComment: {
      findMany: (...args: unknown[]) => mockCommentFindMany(...args),
      create: (...args: unknown[]) => mockCommentCreate(...args),
    },
  },
}));

const mockGuardRoute = vi.fn();

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: (...args: unknown[]) => mockGuardRoute(...args),
}));

// Import route handlers AFTER mocks
import { GET as GET_ARTICLES, POST as POST_ARTICLES } from '../../help/articles/route';
import { GET as GET_ARTICLE_BY_ID, PATCH as PATCH_ARTICLE } from '../../help/articles/[id]/route';
import { GET as GET_CONTEXTUAL } from '../../help/contextual/route';
import { GET as GET_TICKETS, POST as POST_TICKETS } from '../../help/tickets/route';
import { GET as GET_TICKET_BY_ID, PATCH as PATCH_TICKET } from '../../help/tickets/[id]/route';
import { GET as GET_COMMENTS, POST as POST_COMMENTS } from '../../help/tickets/[id]/comments/route';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROPERTY_ID = '00000000-0000-4000-b000-000000000001';
const USER_ID = 'test-user-id';
const ADMIN_USER_ID = 'test-admin-id';

const mockResidentAuth = () =>
  mockGuardRoute.mockResolvedValue({
    user: {
      userId: USER_ID,
      propertyId: PROPERTY_ID,
      role: 'resident_owner',
      permissions: ['*'],
      mfaVerified: false,
    },
    error: null,
  });

const mockAdminAuth = () =>
  mockGuardRoute.mockResolvedValue({
    user: {
      userId: ADMIN_USER_ID,
      propertyId: PROPERTY_ID,
      role: 'property_admin',
      permissions: ['*'],
      mfaVerified: false,
    },
    error: null,
  });

beforeEach(() => {
  vi.clearAllMocks();
  mockArticleFindMany.mockResolvedValue([]);
  mockArticleCount.mockResolvedValue(0);
  mockTicketFindMany.mockResolvedValue([]);
  mockTicketCount.mockResolvedValue(0);
  mockCommentFindMany.mockResolvedValue([]);
  mockAdminAuth();
});

// ---------------------------------------------------------------------------
// 1. GET /help/articles — List help articles with categories
// ---------------------------------------------------------------------------

describe('GET /api/v1/help/articles — List Articles', () => {
  it('returns paginated articles with category field', async () => {
    const articles = [
      {
        id: 'a1',
        title: 'Getting Started Guide',
        category: 'getting_started',
        tags: ['onboarding'],
        sortOrder: 0,
      },
      { id: 'a2', title: 'Package Pickup', category: 'packages', tags: ['packages'], sortOrder: 1 },
    ];
    mockArticleFindMany.mockResolvedValue(articles);
    mockArticleCount.mockResolvedValue(2);

    const req = createGetRequest('/api/v1/help/articles');
    const res = await GET_ARTICLES(req);

    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: typeof articles; meta: { total: number } }>(res);
    expect(body.data).toHaveLength(2);
    expect(body.data[0]!.category).toBe('getting_started');
    expect(body.meta.total).toBe(2);
  });

  it('filters articles by category', async () => {
    mockArticleFindMany.mockResolvedValue([]);
    mockArticleCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/help/articles', {
      searchParams: { category: 'packages' },
    });
    await GET_ARTICLES(req);

    const where = mockArticleFindMany.mock.calls[0]![0].where;
    expect(where.category).toBe('packages');
  });

  it('only returns published articles for non-admin users', async () => {
    mockResidentAuth();
    const req = createGetRequest('/api/v1/help/articles');
    await GET_ARTICLES(req);

    const where = mockArticleFindMany.mock.calls[0]![0].where;
    expect(where.status).toBe('published');
  });

  it('returns all statuses for admin users', async () => {
    mockAdminAuth();
    const req = createGetRequest('/api/v1/help/articles');
    await GET_ARTICLES(req);

    const where = mockArticleFindMany.mock.calls[0]![0].where;
    expect(where.status).toBeUndefined();
  });

  it('orders by sortOrder ASC then createdAt DESC', async () => {
    const req = createGetRequest('/api/v1/help/articles');
    await GET_ARTICLES(req);

    const orderBy = mockArticleFindMany.mock.calls[0]![0].orderBy;
    expect(orderBy).toEqual([{ isFeatured: 'desc' }, { sortOrder: 'asc' }, { createdAt: 'desc' }]);
  });
});

// ---------------------------------------------------------------------------
// 2. GET /help/articles/:id — Single article with full content
// ---------------------------------------------------------------------------

describe('GET /api/v1/help/articles/:id — Single Article', () => {
  it('returns a single article with full body content', async () => {
    const article = {
      id: 'a1',
      title: 'Getting Started Guide',
      body: '# Welcome\n\nThis is the **getting started** guide.',
      category: 'getting_started',
      tags: ['onboarding'],
      sortOrder: 0,
      status: 'published',
    };
    mockArticleFindUnique.mockResolvedValue(article);

    const req = createGetRequest('/api/v1/help/articles/a1');
    const res = await GET_ARTICLE_BY_ID(req, { params: Promise.resolve({ id: 'a1' }) });

    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: typeof article }>(res);
    expect(body.data.body).toContain('# Welcome');
    expect(body.data.title).toBe('Getting Started Guide');
  });

  it('returns 404 for non-existent article', async () => {
    mockArticleFindUnique.mockResolvedValue(null);

    const req = createGetRequest('/api/v1/help/articles/nonexistent');
    const res = await GET_ARTICLE_BY_ID(req, { params: Promise.resolve({ id: 'nonexistent' }) });

    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// 3. Search help articles by title and body
// ---------------------------------------------------------------------------

describe('GET /api/v1/help/articles — Search', () => {
  it('searches articles by title and body', async () => {
    const req = createGetRequest('/api/v1/help/articles', {
      searchParams: { search: 'package pickup' },
    });
    await GET_ARTICLES(req);

    const where = mockArticleFindMany.mock.calls[0]![0].where;
    expect(where.OR).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ title: { contains: 'package pickup', mode: 'insensitive' } }),
        expect.objectContaining({ body: { contains: 'package pickup', mode: 'insensitive' } }),
      ]),
    );
  });
});

// ---------------------------------------------------------------------------
// 4. POST /help/articles — Admin creates help article
// ---------------------------------------------------------------------------

describe('POST /api/v1/help/articles — Create Article', () => {
  it('admin creates a help article with all fields', async () => {
    const input = {
      title: 'How to Track Packages',
      body: '# Package Tracking\n\nFollow these steps to track your package.',
      category: 'packages',
      tags: ['packages', 'tracking'],
      sortOrder: 5,
    };
    const created = {
      id: 'a-new',
      slug: 'how-to-track-packages',
      ...input,
      status: 'draft',
      createdAt: new Date(),
    };
    mockArticleCreate.mockResolvedValue(created);

    const req = createPostRequest('/api/v1/help/articles', input);
    const res = await POST_ARTICLES(req);

    expect(res.status).toBe(201);
    const body = await parseResponse<{ data: typeof created }>(res);
    expect(body.data.title).toBe('How to Track Packages');
    expect(body.data.slug).toBe('how-to-track-packages');
  });

  it('rejects article creation without required fields', async () => {
    const req = createPostRequest('/api/v1/help/articles', {});
    const res = await POST_ARTICLES(req);

    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('rejects non-admin users from creating articles', async () => {
    mockGuardRoute.mockResolvedValue({
      user: null,
      error: new Response(JSON.stringify({ error: 'FORBIDDEN' }), { status: 403 }),
    });

    const req = createPostRequest('/api/v1/help/articles', {
      title: 'Test',
      body: 'Test body content here with enough characters to meet the minimum length requirement.',
      category: 'packages',
    });
    const res = await POST_ARTICLES(req);

    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// 5. Categories: getting_started, packages, maintenance, amenities, security, admin
// ---------------------------------------------------------------------------

describe('Help Article Categories', () => {
  it('rejects invalid category on article creation', async () => {
    const req = createPostRequest('/api/v1/help/articles', {
      title: 'Invalid Category Test',
      body: 'This should fail validation but has enough characters to pass body check.',
      category: 'nonexistent_category',
    });
    const res = await POST_ARTICLES(req);

    expect(res.status).toBe(400);
  });

  it.each([
    'getting_started',
    'packages',
    'maintenance',
    'amenities',
    'security',
    'admin',
  ] as const)('accepts valid category: %s', async (category) => {
    mockArticleCreate.mockResolvedValue({
      id: 'a-cat',
      title: `${category} article`,
      slug: `${category}-article`,
      body: 'Content here for testing purposes. This body must be at least fifty characters long.',
      category,
      tags: [],
      sortOrder: 0,
      status: 'draft',
    });

    const req = createPostRequest('/api/v1/help/articles', {
      title: `${category} article`,
      body: 'Content here for testing purposes. This body must be at least fifty characters long.',
      category,
    });
    const res = await POST_ARTICLES(req);

    expect(res.status).toBe(201);
  });
});

// ---------------------------------------------------------------------------
// 6. Article has: title, body (markdown), category, tags, sortOrder
// ---------------------------------------------------------------------------

describe('Help Article Field Structure', () => {
  it('stores sortOrder for display ordering', async () => {
    mockArticleCreate.mockResolvedValue({
      id: 'a-sort',
      title: 'Sorted Article',
      slug: 'sorted-article',
      body: 'Content here for sorting test. This body must be at least fifty characters long.',
      category: 'getting_started',
      tags: ['intro'],
      sortOrder: 10,
      status: 'draft',
    });

    const req = createPostRequest('/api/v1/help/articles', {
      title: 'Sorted Article',
      body: 'Content here for sorting test. This body must be at least fifty characters long.',
      category: 'getting_started',
      tags: ['intro'],
      sortOrder: 10,
    });
    await POST_ARTICLES(req);

    const createData = mockArticleCreate.mock.calls[0]![0].data;
    expect(createData.sortOrder).toBe(10);
    expect(createData.tags).toEqual(['intro']);
  });

  it('stores markdown body content', async () => {
    const markdownBody =
      '# Title\n\n## Subtitle\n\n- Item 1\n- Item 2\n\n```js\nconsole.log("hello");\n```';
    mockArticleCreate.mockResolvedValue({
      id: 'a-md',
      title: 'Markdown Test',
      slug: 'markdown-test',
      body: markdownBody,
      category: 'admin',
      tags: [],
      sortOrder: 0,
      status: 'draft',
    });

    const req = createPostRequest('/api/v1/help/articles', {
      title: 'Markdown Test',
      body: markdownBody,
      category: 'admin',
    });
    await POST_ARTICLES(req);

    const createData = mockArticleCreate.mock.calls[0]![0].data;
    expect(createData.body).toContain('# Title');
    expect(createData.body).toContain('```js');
  });
});

// ---------------------------------------------------------------------------
// 7. Contextual help: GET /help/contextual?page=packages
// ---------------------------------------------------------------------------

describe('GET /api/v1/help/contextual — Contextual Help', () => {
  it('returns articles relevant to a specific page', async () => {
    const articles = [
      {
        id: 'a1',
        title: 'Package FAQ',
        category: 'packages',
        contextPages: ['packages'],
        sortOrder: 0,
      },
    ];
    mockArticleFindMany.mockResolvedValue(articles);

    const req = createGetRequest('/api/v1/help/contextual', {
      searchParams: { page: 'packages' },
    });
    const res = await GET_CONTEXTUAL(req);

    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: typeof articles }>(res);
    expect(body.data).toHaveLength(1);
    expect(body.data[0]!.title).toBe('Package FAQ');
  });

  it('filters by contextPages containing the requested page', async () => {
    const req = createGetRequest('/api/v1/help/contextual', {
      searchParams: { page: 'packages' },
    });
    await GET_CONTEXTUAL(req);

    const where = mockArticleFindMany.mock.calls[0]![0].where;
    expect(where.contextPages).toEqual({ has: 'packages' });
    expect(where.status).toBe('published');
  });

  it('returns 400 when page param is missing', async () => {
    const req = createGetRequest('/api/v1/help/contextual');
    const res = await GET_CONTEXTUAL(req);

    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// 8. Support tickets: POST /help/tickets — Create support ticket
// ---------------------------------------------------------------------------

describe('POST /api/v1/help/tickets — Create Ticket', () => {
  it('creates a support ticket with initial status "open"', async () => {
    mockResidentAuth();
    const input = {
      subject: 'Cannot access amenity booking',
      description: 'When I try to book the gym, I get an error message saying "unavailable".',
      category: 'amenities',
    };
    const created = {
      id: 'tk-1',
      ...input,
      status: 'open',
      priority: 'medium',
      userId: USER_ID,
      propertyId: PROPERTY_ID,
      createdAt: new Date(),
    };
    mockTicketCreate.mockResolvedValue(created);

    const req = createPostRequest('/api/v1/help/tickets', input);
    const res = await POST_TICKETS(req);

    expect(res.status).toBe(201);
    const body = await parseResponse<{ data: typeof created }>(res);
    expect(body.data.status).toBe('open');
    expect(body.data.userId).toBe(USER_ID);
  });

  it('rejects ticket without required fields', async () => {
    mockResidentAuth();
    const req = createPostRequest('/api/v1/help/tickets', {});
    const res = await POST_TICKETS(req);

    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });
});

// ---------------------------------------------------------------------------
// 9. Support tickets: GET /help/tickets — List user's tickets
// ---------------------------------------------------------------------------

describe('GET /api/v1/help/tickets — List Tickets', () => {
  it("returns only the current user's tickets for non-admin", async () => {
    mockResidentAuth();
    mockTicketFindMany.mockResolvedValue([]);
    mockTicketCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/help/tickets');
    await GET_TICKETS(req);

    const where = mockTicketFindMany.mock.calls[0]![0].where;
    expect(where.userId).toBe(USER_ID);
  });

  it('admin can view all tickets (no userId filter)', async () => {
    mockAdminAuth();
    mockTicketFindMany.mockResolvedValue([]);
    mockTicketCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/help/tickets');
    await GET_TICKETS(req);

    const where = mockTicketFindMany.mock.calls[0]![0].where;
    expect(where.userId).toBeUndefined();
  });

  it('returns paginated results', async () => {
    mockResidentAuth();
    const tickets = [{ id: 'tk-1', subject: 'Test', status: 'open' }];
    mockTicketFindMany.mockResolvedValue(tickets);
    mockTicketCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/help/tickets');
    const res = await GET_TICKETS(req);

    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: typeof tickets; meta: { total: number } }>(res);
    expect(body.meta.total).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// 10. Ticket status: open -> in_progress -> resolved -> closed
// ---------------------------------------------------------------------------

describe('PATCH /api/v1/help/tickets/:id — Ticket Status Transitions', () => {
  it('transitions ticket from open to in_progress', async () => {
    const existing = { id: 'tk-1', status: 'open', userId: ADMIN_USER_ID, propertyId: PROPERTY_ID };
    mockTicketFindUnique.mockResolvedValue(existing);
    mockTicketUpdate.mockResolvedValue({ ...existing, status: 'in_progress' });

    const req = createPatchRequest('/api/v1/help/tickets/tk-1', { status: 'in_progress' });
    const res = await PATCH_TICKET(req, { params: Promise.resolve({ id: 'tk-1' }) });

    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: { status: string } }>(res);
    expect(body.data.status).toBe('in_progress');
  });

  it('transitions ticket from in_progress to resolved', async () => {
    const existing = {
      id: 'tk-1',
      status: 'in_progress',
      userId: ADMIN_USER_ID,
      propertyId: PROPERTY_ID,
    };
    mockTicketFindUnique.mockResolvedValue(existing);
    mockTicketUpdate.mockResolvedValue({ ...existing, status: 'resolved' });

    const req = createPatchRequest('/api/v1/help/tickets/tk-1', { status: 'resolved' });
    const res = await PATCH_TICKET(req, { params: Promise.resolve({ id: 'tk-1' }) });

    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: { status: string } }>(res);
    expect(body.data.status).toBe('resolved');
  });

  it('transitions ticket from resolved to closed', async () => {
    const existing = {
      id: 'tk-1',
      status: 'resolved',
      userId: ADMIN_USER_ID,
      propertyId: PROPERTY_ID,
    };
    mockTicketFindUnique.mockResolvedValue(existing);
    mockTicketUpdate.mockResolvedValue({ ...existing, status: 'closed' });

    const req = createPatchRequest('/api/v1/help/tickets/tk-1', { status: 'closed' });
    const res = await PATCH_TICKET(req, { params: Promise.resolve({ id: 'tk-1' }) });

    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: { status: string } }>(res);
    expect(body.data.status).toBe('closed');
  });

  it('returns 404 for non-existent ticket', async () => {
    mockTicketFindUnique.mockResolvedValue(null);

    const req = createPatchRequest('/api/v1/help/tickets/nonexistent', { status: 'in_progress' });
    const res = await PATCH_TICKET(req, { params: Promise.resolve({ id: 'nonexistent' }) });

    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// 11. Ticket comments: POST /help/tickets/:id/comments
// ---------------------------------------------------------------------------

describe('POST /api/v1/help/tickets/:id/comments — Add Comment', () => {
  it('adds a comment to an existing ticket', async () => {
    mockResidentAuth();
    const ticket = { id: 'tk-1', status: 'open', userId: USER_ID, propertyId: PROPERTY_ID };
    mockTicketFindUnique.mockResolvedValue(ticket);

    const comment = {
      id: 'c-1',
      ticketId: 'tk-1',
      userId: USER_ID,
      body: 'I tried clearing my cache but the issue persists.',
      isStaff: false,
      createdAt: new Date(),
    };
    mockCommentCreate.mockResolvedValue(comment);

    const req = createPostRequest('/api/v1/help/tickets/tk-1/comments', {
      body: 'I tried clearing my cache but the issue persists.',
    });
    const res = await POST_COMMENTS(req, { params: Promise.resolve({ id: 'tk-1' }) });

    expect(res.status).toBe(201);
    const parsed = await parseResponse<{ data: typeof comment }>(res);
    expect(parsed.data.body).toContain('clearing my cache');
  });

  it('rejects empty comment body', async () => {
    mockResidentAuth();
    const ticket = { id: 'tk-1', status: 'open', userId: USER_ID, propertyId: PROPERTY_ID };
    mockTicketFindUnique.mockResolvedValue(ticket);

    const req = createPostRequest('/api/v1/help/tickets/tk-1/comments', { body: '' });
    const res = await POST_COMMENTS(req, { params: Promise.resolve({ id: 'tk-1' }) });

    expect(res.status).toBe(400);
  });

  it('returns 404 when ticket does not exist', async () => {
    mockResidentAuth();
    mockTicketFindUnique.mockResolvedValue(null);

    const req = createPostRequest('/api/v1/help/tickets/nonexistent/comments', {
      body: 'This should fail.',
    });
    const res = await POST_COMMENTS(req, { params: Promise.resolve({ id: 'nonexistent' }) });

    expect(res.status).toBe(404);
  });

  it('marks admin comments with isStaff=true', async () => {
    mockAdminAuth();
    const ticket = { id: 'tk-1', status: 'open', userId: USER_ID, propertyId: PROPERTY_ID };
    mockTicketFindUnique.mockResolvedValue(ticket);

    const comment = {
      id: 'c-2',
      ticketId: 'tk-1',
      userId: ADMIN_USER_ID,
      body: 'We are looking into this.',
      isStaff: true,
      createdAt: new Date(),
    };
    mockCommentCreate.mockResolvedValue(comment);

    const req = createPostRequest('/api/v1/help/tickets/tk-1/comments', {
      body: 'We are looking into this.',
    });
    const res = await POST_COMMENTS(req, { params: Promise.resolve({ id: 'tk-1' }) });

    expect(res.status).toBe(201);
    const createData = mockCommentCreate.mock.calls[0]![0].data;
    expect(createData.isStaff).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 12. Admin can view all tickets, user sees only their own
// ---------------------------------------------------------------------------

describe('Ticket Visibility — Role-Based Access', () => {
  it('resident only sees their own tickets in list', async () => {
    mockResidentAuth();
    mockTicketFindMany.mockResolvedValue([]);
    mockTicketCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/help/tickets');
    await GET_TICKETS(req);

    const where = mockTicketFindMany.mock.calls[0]![0].where;
    expect(where.userId).toBe(USER_ID);
    expect(where.propertyId).toBe(PROPERTY_ID);
  });

  it('admin sees all tickets for the property', async () => {
    mockAdminAuth();
    mockTicketFindMany.mockResolvedValue([]);
    mockTicketCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/help/tickets');
    await GET_TICKETS(req);

    const where = mockTicketFindMany.mock.calls[0]![0].where;
    expect(where.userId).toBeUndefined();
    expect(where.propertyId).toBe(PROPERTY_ID);
  });

  it("resident cannot view another user's ticket by ID", async () => {
    mockResidentAuth();
    const otherTicket = {
      id: 'tk-other',
      status: 'open',
      userId: 'other-user-id',
      propertyId: PROPERTY_ID,
    };
    mockTicketFindUnique.mockResolvedValue(otherTicket);

    const req = createGetRequest('/api/v1/help/tickets/tk-other');
    const res = await GET_TICKET_BY_ID(req, { params: Promise.resolve({ id: 'tk-other' }) });

    expect(res.status).toBe(404);
  });

  it('admin can view any ticket by ID', async () => {
    mockAdminAuth();
    const ticket = {
      id: 'tk-other',
      subject: 'Help',
      status: 'open',
      userId: 'other-user-id',
      propertyId: PROPERTY_ID,
    };
    mockTicketFindUnique.mockResolvedValue(ticket);

    const req = createGetRequest('/api/v1/help/tickets/tk-other');
    const res = await GET_TICKET_BY_ID(req, { params: Promise.resolve({ id: 'tk-other' }) });

    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: typeof ticket }>(res);
    expect(body.data.id).toBe('tk-other');
  });

  it('GET /help/tickets/:id/comments returns comments for the ticket', async () => {
    mockResidentAuth();
    const ticket = { id: 'tk-1', status: 'open', userId: USER_ID, propertyId: PROPERTY_ID };
    mockTicketFindUnique.mockResolvedValue(ticket);

    const comments = [
      {
        id: 'c-1',
        ticketId: 'tk-1',
        userId: USER_ID,
        body: 'Hello',
        isStaff: false,
        createdAt: new Date(),
      },
    ];
    mockCommentFindMany.mockResolvedValue(comments);

    const req = createGetRequest('/api/v1/help/tickets/tk-1/comments');
    const res = await GET_COMMENTS(req, { params: Promise.resolve({ id: 'tk-1' }) });

    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: typeof comments }>(res);
    expect(body.data).toHaveLength(1);
  });
});
