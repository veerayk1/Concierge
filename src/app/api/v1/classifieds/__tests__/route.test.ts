/**
 * Classified Ads / Marketplace API Tests — Comprehensive coverage
 *
 * Tests the community classified ads endpoints:
 * - GET /api/v1/community — list listings sorted by createdAt descending
 * - GET /api/v1/community — filter by category, condition, status, search, free items
 * - POST /api/v1/community — create listing with validation
 * - PATCH /api/v1/community/:id — mark as sold, removed, status transitions
 * - DELETE /api/v1/community/:id — soft-delete (archive)
 * - POST /api/v1/community/:id/flag — flag inappropriate ads
 * - POST /api/v1/community/expire — auto-expiry detection
 * - Tenant isolation, XSS prevention, ownership checks
 * 25+ tests
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
const mockFlagCreate = vi.fn();

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
      create: (...args: unknown[]) => mockFlagCreate(...args),
    },
  },
}));

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: (...args: unknown[]) => mockGuardRoute(...args),
}));

// Import route handlers after mocks
import { GET, POST } from '../../community/route';
import { GET as GET_ID, PATCH, DELETE } from '../../community/[id]/route';
import { POST as FLAG_POST } from '../../community/[id]/flag/route';
import { POST as EXPIRE_POST } from '../../community/expire/route';

const PROPERTY_A = '00000000-0000-4000-b000-000000000001';
const PROPERTY_B = '00000000-0000-4000-b000-000000000099';
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
});

// ---------------------------------------------------------------------------
// Shared test data
// ---------------------------------------------------------------------------

const validAd = {
  propertyId: PROPERTY_A,
  title: 'Leather couch for sale',
  description: 'A nice leather couch in great condition, barely used for two years.',
  price: 200,
  priceType: 'negotiable' as const,
  condition: 'like_new' as const,
};

// ---------------------------------------------------------------------------
// 1. GET /community — list listings sorted by createdAt descending
// ---------------------------------------------------------------------------

describe('GET /community — Listing order', () => {
  it('orders by createdAt descending', async () => {
    const req = createGetRequest('/api/v1/community', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET(req);
    expect(mockAdFindMany.mock.calls[0]![0].orderBy).toEqual({ createdAt: 'desc' });
  });

  it('returns empty array when no ads exist', async () => {
    const req = createGetRequest('/api/v1/community', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await GET(req);
    const body = await parseResponse<{ data: unknown[] }>(res);
    expect(body.data).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 2. GET /community — filter by category
// ---------------------------------------------------------------------------

describe('GET /community — Filter by category', () => {
  it('filters by categoryId', async () => {
    const req = createGetRequest('/api/v1/community', {
      searchParams: { propertyId: PROPERTY_A, categoryId: 'cat-furniture' },
    });
    await GET(req);
    expect(mockAdFindMany.mock.calls[0]![0].where.categoryId).toBe('cat-furniture');
  });

  it('filters by category string', async () => {
    const req = createGetRequest('/api/v1/community', {
      searchParams: { propertyId: PROPERTY_A, category: 'electronics' },
    });
    await GET(req);
    expect(mockAdFindMany.mock.calls[0]![0].where.category).toBe('electronics');
  });
});

// ---------------------------------------------------------------------------
// 3. GET /community — filter by status (active by default)
// ---------------------------------------------------------------------------

describe('GET /community — Status filter', () => {
  it('defaults to active status filter', async () => {
    const req = createGetRequest('/api/v1/community', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET(req);
    expect(mockAdFindMany.mock.calls[0]![0].where.status).toBe('active');
  });
});

// ---------------------------------------------------------------------------
// 4. GET /community — search by title and description
// ---------------------------------------------------------------------------

describe('GET /community — Search', () => {
  it('search covers title and description', async () => {
    const req = createGetRequest('/api/v1/community', {
      searchParams: { propertyId: PROPERTY_A, search: 'couch' },
    });
    await GET(req);

    const where = mockAdFindMany.mock.calls[0]![0].where;
    expect(where.OR).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ title: { contains: 'couch', mode: 'insensitive' } }),
        expect.objectContaining({ description: { contains: 'couch', mode: 'insensitive' } }),
      ]),
    );
  });
});

// ---------------------------------------------------------------------------
// 5. GET /community — pagination
// ---------------------------------------------------------------------------

describe('GET /community — Pagination', () => {
  it('defaults to page 1 with pageSize 20', async () => {
    mockAdCount.mockResolvedValue(0);
    const req = createGetRequest('/api/v1/community', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await GET(req);
    const body = await parseResponse<{ meta: { page: number; pageSize: number } }>(res);
    expect(body.meta.page).toBe(1);
    expect(body.meta.pageSize).toBe(20);
  });

  it('paginates correctly on page 2', async () => {
    mockAdCount.mockResolvedValue(50);
    const req = createGetRequest('/api/v1/community', {
      searchParams: { propertyId: PROPERTY_A, page: '2', pageSize: '10' },
    });
    await GET(req);

    const call = mockAdFindMany.mock.calls[0]![0];
    expect(call.skip).toBe(10);
    expect(call.take).toBe(10);
  });

  it('returns totalPages in meta', async () => {
    mockAdCount.mockResolvedValue(45);
    const req = createGetRequest('/api/v1/community', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await GET(req);
    const body = await parseResponse<{ meta: { totalPages: number; total: number } }>(res);
    expect(body.meta.total).toBe(45);
    expect(body.meta.totalPages).toBe(3); // ceil(45/20)
  });

  it('includes images for ad listings', async () => {
    const req = createGetRequest('/api/v1/community', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET(req);
    expect(mockAdFindMany.mock.calls[0]![0].include.images).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// 6. GET /community — Tenant isolation
// ---------------------------------------------------------------------------

describe('GET /community — Tenant isolation', () => {
  it('rejects without propertyId', async () => {
    const req = createGetRequest('/api/v1/community');
    const res = await GET(req);
    expect(res.status).toBe(400);
    expect(mockAdFindMany).not.toHaveBeenCalled();
  });

  it('scopes query to provided propertyId', async () => {
    const req = createGetRequest('/api/v1/community', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET(req);
    expect(mockAdFindMany.mock.calls[0]![0].where.propertyId).toBe(PROPERTY_A);
  });

  it('isolates queries between properties', async () => {
    const req = createGetRequest('/api/v1/community', {
      searchParams: { propertyId: PROPERTY_B },
    });
    await GET(req);
    expect(mockAdFindMany.mock.calls[0]![0].where.propertyId).toBe(PROPERTY_B);
  });
});

// ---------------------------------------------------------------------------
// 7. POST /community — create listing with validation
// ---------------------------------------------------------------------------

describe('POST /community — Validation', () => {
  it('rejects empty body', async () => {
    const req = createPostRequest('/api/v1/community', {});
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('rejects missing title', async () => {
    const req = createPostRequest('/api/v1/community', {
      propertyId: PROPERTY_A,
      description: 'A nice couch for sale in great condition',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects title shorter than 3 characters', async () => {
    const req = createPostRequest('/api/v1/community', {
      propertyId: PROPERTY_A,
      title: 'AB',
      description: 'A nice couch for sale in great condition',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects description shorter than 10 characters', async () => {
    const req = createPostRequest('/api/v1/community', {
      propertyId: PROPERTY_A,
      title: 'Couch for sale',
      description: 'Short',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects description over 5000 characters', async () => {
    const req = createPostRequest('/api/v1/community', {
      propertyId: PROPERTY_A,
      title: 'Couch for sale',
      description: 'X'.repeat(5001),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects negative price', async () => {
    const req = createPostRequest('/api/v1/community', {
      ...validAd,
      price: -10,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects invalid priceType', async () => {
    const req = createPostRequest('/api/v1/community', {
      ...validAd,
      priceType: 'auction',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects invalid contactEmail format', async () => {
    const req = createPostRequest('/api/v1/community', {
      ...validAd,
      contactEmail: 'not-an-email',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects invalid propertyId format', async () => {
    const req = createPostRequest('/api/v1/community', {
      ...validAd,
      propertyId: 'not-a-uuid',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('accepts price of 0 (free items)', async () => {
    mockAdCreate.mockResolvedValue({ id: 'ad-free', status: 'active', price: 0 });
    const req = createPostRequest('/api/v1/community', {
      ...validAd,
      price: 0,
      priceType: 'free',
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });
});

// ---------------------------------------------------------------------------
// 8. POST /community — creation behavior
// ---------------------------------------------------------------------------

describe('POST /community — Ad Creation', () => {
  it('creates ad with status=active', async () => {
    mockAdCreate.mockResolvedValue({ id: 'ad-1', ...validAd, status: 'active' });

    const req = createPostRequest('/api/v1/community', validAd);
    await POST(req);

    const createData = mockAdCreate.mock.calls[0]![0].data;
    expect(createData.status).toBe('active');
  });

  it('returns 201 with ad data', async () => {
    mockAdCreate.mockResolvedValue({ id: 'ad-1', ...validAd, status: 'active' });

    const req = createPostRequest('/api/v1/community', validAd);
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('posted');
  });

  it('sets userId from authenticated user', async () => {
    mockAdCreate.mockResolvedValue({ id: 'ad-1', status: 'active' });

    const req = createPostRequest('/api/v1/community', validAd);
    await POST(req);

    expect(mockAdCreate.mock.calls[0]![0].data.userId).toBe(USER_RESIDENT);
  });

  it('accepts all valid priceType values', async () => {
    for (const priceType of ['fixed', 'negotiable', 'free', 'contact']) {
      vi.clearAllMocks();
      setAuth(USER_RESIDENT, 'resident');
      mockAdCreate.mockResolvedValue({ id: `ad-${priceType}`, status: 'active' });
      const req = createPostRequest('/api/v1/community', { ...validAd, priceType });
      const res = await POST(req);
      expect(res.status).toBe(201);
    }
  });

  it('accepts all valid condition values', async () => {
    for (const condition of ['new', 'like_new', 'good', 'fair', 'not_applicable']) {
      vi.clearAllMocks();
      setAuth(USER_RESIDENT, 'resident');
      mockAdCreate.mockResolvedValue({ id: `ad-${condition}`, status: 'active' });
      const req = createPostRequest('/api/v1/community', { ...validAd, condition });
      const res = await POST(req);
      expect(res.status).toBe(201);
    }
  });
});

// ---------------------------------------------------------------------------
// 9. POST /community — XSS prevention
// ---------------------------------------------------------------------------

describe('POST /community — XSS sanitization', () => {
  it('strips HTML from title', async () => {
    mockAdCreate.mockResolvedValue({ id: 'ad-1', status: 'active' });

    const req = createPostRequest('/api/v1/community', {
      ...validAd,
      title: '<script>alert("xss")</script>Couch',
    });
    await POST(req);

    const createData = mockAdCreate.mock.calls[0]![0].data;
    expect(createData.title).not.toContain('<script>');
  });

  it('strips HTML from description', async () => {
    mockAdCreate.mockResolvedValue({ id: 'ad-1', status: 'active' });

    const req = createPostRequest('/api/v1/community', {
      ...validAd,
      description: '<img onerror="alert(1)" src="">Nice couch for sale',
    });
    await POST(req);

    const createData = mockAdCreate.mock.calls[0]![0].data;
    expect(createData.description).not.toContain('<img');
    expect(createData.description).not.toContain('onerror');
  });
});

// ---------------------------------------------------------------------------
// 10. PATCH /community/:id — mark as sold
// ---------------------------------------------------------------------------

describe('PATCH /community/:id — Mark as sold', () => {
  it('transitions active ad to sold', async () => {
    mockAdFindUnique.mockResolvedValue({
      id: 'ad-1',
      userId: USER_RESIDENT,
      status: 'active',
      propertyId: PROPERTY_A,
    });
    mockAdUpdate.mockResolvedValue({ id: 'ad-1', status: 'sold' });

    const req = createPatchRequest('/api/v1/community/ad-1', { status: 'sold' });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'ad-1' }) });
    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: { status: string } }>(res);
    expect(body.data.status).toBe('sold');
  });

  it('rejects transitioning sold ad back to active', async () => {
    mockAdFindUnique.mockResolvedValue({
      id: 'ad-1',
      userId: USER_RESIDENT,
      status: 'sold',
      propertyId: PROPERTY_A,
    });

    const req = createPatchRequest('/api/v1/community/ad-1', { status: 'active' });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'ad-1' }) });
    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('INVALID_TRANSITION');
  });
});

// ---------------------------------------------------------------------------
// 11. PATCH /community/:id — ownership check
// ---------------------------------------------------------------------------

describe('PATCH /community/:id — Ownership', () => {
  it('rejects edit from non-owner non-admin', async () => {
    setAuth(USER_OTHER, 'resident');
    mockAdFindUnique.mockResolvedValue({
      id: 'ad-1',
      userId: USER_RESIDENT,
      status: 'active',
      propertyId: PROPERTY_A,
    });

    const req = createPatchRequest('/api/v1/community/ad-1', { title: 'New title here' });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'ad-1' }) });
    expect(res.status).toBe(403);
  });

  it('allows admin to edit any ad', async () => {
    setAuth(USER_ADMIN, 'property_admin');
    mockAdFindUnique.mockResolvedValue({
      id: 'ad-1',
      userId: USER_RESIDENT,
      status: 'active',
      propertyId: PROPERTY_A,
    });
    mockAdUpdate.mockResolvedValue({ id: 'ad-1', status: 'active' });

    const req = createPatchRequest('/api/v1/community/ad-1', { title: 'Admin edited title' });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'ad-1' }) });
    expect(res.status).toBe(200);
  });

  it('returns 404 for non-existent ad', async () => {
    mockAdFindUnique.mockResolvedValue(null);

    const req = createPatchRequest('/api/v1/community/ad-ghost', { title: 'New title' });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'ad-ghost' }) });
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// 12. DELETE /community/:id — soft delete (archive)
// ---------------------------------------------------------------------------

describe('DELETE /community/:id — Soft delete', () => {
  it('archives ad on delete (soft-delete)', async () => {
    mockAdFindUnique.mockResolvedValue({
      id: 'ad-1',
      userId: USER_RESIDENT,
      status: 'active',
      propertyId: PROPERTY_A,
    });
    mockAdUpdate.mockResolvedValue({ id: 'ad-1', status: 'archived' });

    const req = createDeleteRequest('/api/v1/community/ad-1');
    const res = await DELETE(req, { params: Promise.resolve({ id: 'ad-1' }) });
    expect(res.status).toBe(200);

    const updateCall = mockAdUpdate.mock.calls[0]![0];
    expect(updateCall.data.status).toBe('archived');
  });

  it('rejects delete from non-owner non-admin', async () => {
    setAuth(USER_OTHER, 'resident');
    mockAdFindUnique.mockResolvedValue({
      id: 'ad-1',
      userId: USER_RESIDENT,
      status: 'active',
      propertyId: PROPERTY_A,
    });

    const req = createDeleteRequest('/api/v1/community/ad-1');
    const res = await DELETE(req, { params: Promise.resolve({ id: 'ad-1' }) });
    expect(res.status).toBe(403);
  });

  it('allows admin to delete any ad', async () => {
    setAuth(USER_ADMIN, 'property_admin');
    mockAdFindUnique.mockResolvedValue({
      id: 'ad-1',
      userId: USER_RESIDENT,
      status: 'active',
      propertyId: PROPERTY_A,
    });
    mockAdUpdate.mockResolvedValue({ id: 'ad-1', status: 'archived' });

    const req = createDeleteRequest('/api/v1/community/ad-1');
    const res = await DELETE(req, { params: Promise.resolve({ id: 'ad-1' }) });
    expect(res.status).toBe(200);
  });

  it('returns 404 for non-existent ad', async () => {
    mockAdFindUnique.mockResolvedValue(null);

    const req = createDeleteRequest('/api/v1/community/ad-ghost');
    const res = await DELETE(req, { params: Promise.resolve({ id: 'ad-ghost' }) });
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// 13. GET /community/:id — single ad detail
// ---------------------------------------------------------------------------

describe('GET /community/:id — Detail', () => {
  it('returns a single ad with images', async () => {
    mockAdFindUnique.mockResolvedValue({
      id: 'ad-1',
      title: 'Leather couch',
      status: 'active',
      propertyId: PROPERTY_A,
      images: [],
    });

    const req = createGetRequest('/api/v1/community/ad-1');
    const res = await GET_ID(req, { params: Promise.resolve({ id: 'ad-1' }) });
    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: { id: string } }>(res);
    expect(body.data.id).toBe('ad-1');
  });

  it('returns 404 for non-existent ad', async () => {
    mockAdFindUnique.mockResolvedValue(null);

    const req = createGetRequest('/api/v1/community/ad-ghost');
    const res = await GET_ID(req, { params: Promise.resolve({ id: 'ad-ghost' }) });
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// 14. POST /community/:id/flag — flag ad
// ---------------------------------------------------------------------------

describe('POST /community/:id/flag — Flag ad', () => {
  it('flags an ad with valid reason', async () => {
    mockAdFindUnique.mockResolvedValue({
      id: 'ad-1',
      userId: USER_OTHER,
      status: 'active',
      propertyId: PROPERTY_A,
    });
    mockFlagCreate.mockResolvedValue({
      id: 'flag-1',
      adId: 'ad-1',
      userId: USER_RESIDENT,
      reason: 'spam',
    });

    const req = createPostRequest('/api/v1/community/ad-1/flag', {
      reason: 'spam',
    });
    const res = await FLAG_POST(req, { params: Promise.resolve({ id: 'ad-1' }) });
    expect(res.status).toBe(201);
  });

  it('flags an ad with reason and description', async () => {
    mockAdFindUnique.mockResolvedValue({
      id: 'ad-1',
      userId: USER_OTHER,
      status: 'active',
      propertyId: PROPERTY_A,
    });
    mockFlagCreate.mockResolvedValue({
      id: 'flag-1',
      adId: 'ad-1',
      userId: USER_RESIDENT,
      reason: 'inappropriate',
      description: 'Contains offensive language',
    });

    const req = createPostRequest('/api/v1/community/ad-1/flag', {
      reason: 'inappropriate',
      description: 'Contains offensive language',
    });
    const res = await FLAG_POST(req, { params: Promise.resolve({ id: 'ad-1' }) });
    expect(res.status).toBe(201);
  });

  it('rejects invalid flag reason', async () => {
    mockAdFindUnique.mockResolvedValue({
      id: 'ad-1',
      userId: USER_OTHER,
      status: 'active',
      propertyId: PROPERTY_A,
    });

    const req = createPostRequest('/api/v1/community/ad-1/flag', {
      reason: 'invalid_reason',
    });
    const res = await FLAG_POST(req, { params: Promise.resolve({ id: 'ad-1' }) });
    expect(res.status).toBe(400);
  });

  it('accepts all valid flag reasons', async () => {
    for (const reason of ['spam', 'inappropriate', 'scam', 'prohibited_item', 'other']) {
      vi.clearAllMocks();
      setAuth(USER_RESIDENT, 'resident');
      mockAdFindUnique.mockResolvedValue({
        id: 'ad-1',
        userId: USER_OTHER,
        status: 'active',
        propertyId: PROPERTY_A,
      });
      mockFlagCreate.mockResolvedValue({ id: `flag-${reason}`, reason });

      const req = createPostRequest('/api/v1/community/ad-1/flag', { reason });
      const res = await FLAG_POST(req, { params: Promise.resolve({ id: 'ad-1' }) });
      expect(res.status).toBe(201);
    }
  });

  it('returns 404 for flagging non-existent ad', async () => {
    mockAdFindUnique.mockResolvedValue(null);

    const req = createPostRequest('/api/v1/community/ad-ghost/flag', {
      reason: 'spam',
    });
    const res = await FLAG_POST(req, { params: Promise.resolve({ id: 'ad-ghost' }) });
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// 15. POST /community/expire — auto-expiry
// ---------------------------------------------------------------------------

describe('POST /community/expire — Auto-expiry', () => {
  it('expires active ads older than 30 days', async () => {
    mockAdUpdateMany.mockResolvedValue({ count: 5 });

    const req = createPostRequest('/api/v1/community/expire', {});
    const res = await EXPIRE_POST(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { expiredCount: number } }>(res);
    expect(body.data.expiredCount).toBe(5);
  });

  it('sets status to expired for matching ads', async () => {
    mockAdUpdateMany.mockResolvedValue({ count: 0 });

    const req = createPostRequest('/api/v1/community/expire', {});
    await EXPIRE_POST(req);

    const call = mockAdUpdateMany.mock.calls[0]![0];
    expect(call.where.status).toBe('active');
    expect(call.data.status).toBe('expired');
  });

  it('uses 30-day cutoff for expiration', async () => {
    mockAdUpdateMany.mockResolvedValue({ count: 0 });

    const beforeCall = new Date();
    const req = createPostRequest('/api/v1/community/expire', {});
    await EXPIRE_POST(req);

    const call = mockAdUpdateMany.mock.calls[0]![0];
    const cutoff = call.where.createdAt.lte as Date;
    // cutoff should be ~30 days ago
    const daysDiff = (beforeCall.getTime() - cutoff.getTime()) / (1000 * 60 * 60 * 24);
    expect(daysDiff).toBeGreaterThanOrEqual(29.9);
    expect(daysDiff).toBeLessThanOrEqual(30.1);
  });

  it('returns count of 0 when nothing to expire', async () => {
    mockAdUpdateMany.mockResolvedValue({ count: 0 });

    const req = createPostRequest('/api/v1/community/expire', {});
    const res = await EXPIRE_POST(req);
    const body = await parseResponse<{ data: { expiredCount: number } }>(res);
    expect(body.data.expiredCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 16. Error handling
// ---------------------------------------------------------------------------

describe('Community — Error handling', () => {
  it('handles database errors without leaking internals on POST', async () => {
    mockAdCreate.mockRejectedValue(new Error('FK constraint: propertyId not found'));

    const req = createPostRequest('/api/v1/community', validAd);
    const res = await POST(req);
    expect(res.status).toBe(500);
    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).not.toContain('FK constraint');
  });

  it('handles database errors without leaking internals on GET', async () => {
    mockAdFindMany.mockRejectedValue(new Error('connection timeout'));

    const req = createGetRequest('/api/v1/community', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await GET(req);
    expect(res.status).toBe(500);
    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).not.toContain('connection timeout');
  });
});
