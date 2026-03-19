/**
 * Community API Route Tests — per PRD 12 Community
 *
 * Covers:
 * - GET /api/v1/community (list classified ads)
 * - POST /api/v1/community (create ad)
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createGetRequest, createPostRequest, parseResponse } from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Mock Setup
// ---------------------------------------------------------------------------

const mockAdFindMany = vi.fn();
const mockAdCount = vi.fn();
const mockAdCreate = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    classifiedAd: {
      findMany: (...args: unknown[]) => mockAdFindMany(...args),
      count: (...args: unknown[]) => mockAdCount(...args),
      create: (...args: unknown[]) => mockAdCreate(...args),
    },
  },
}));

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: vi.fn().mockResolvedValue({
    user: {
      userId: 'test-resident',
      propertyId: '00000000-0000-4000-b000-000000000001',
      role: 'resident',
      permissions: ['*'],
      mfaVerified: false,
    },
    error: null,
  }),
}));

import { GET, POST } from '../route';

const PROPERTY_A = '00000000-0000-4000-b000-000000000001';

beforeEach(() => {
  vi.clearAllMocks();
  mockAdFindMany.mockResolvedValue([]);
  mockAdCount.mockResolvedValue(0);
});

// ---------------------------------------------------------------------------
// GET /api/v1/community — Tenant Isolation
// ---------------------------------------------------------------------------

describe('GET /api/v1/community — Tenant Isolation', () => {
  it('rejects without propertyId', async () => {
    const req = createGetRequest('/api/v1/community');
    const res = await GET(req);
    expect(res.status).toBe(400);
    expect(mockAdFindMany).not.toHaveBeenCalled();
  });

  it('filters by propertyId and active status', async () => {
    const req = createGetRequest('/api/v1/community', { searchParams: { propertyId: PROPERTY_A } });
    await GET(req);

    const where = mockAdFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_A);
    expect(where.status).toBe('active');
  });
});

// ---------------------------------------------------------------------------
// GET /api/v1/community — Filtering & Pagination
// ---------------------------------------------------------------------------

describe('GET /api/v1/community — Filtering', () => {
  it('filters by categoryId', async () => {
    const req = createGetRequest('/api/v1/community', {
      searchParams: { propertyId: PROPERTY_A, categoryId: 'cat-furniture' },
    });
    await GET(req);
    expect(mockAdFindMany.mock.calls[0]![0].where.categoryId).toBe('cat-furniture');
  });

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

  it('defaults to page 1 with pageSize 20', async () => {
    mockAdCount.mockResolvedValue(0);
    const req = createGetRequest('/api/v1/community', { searchParams: { propertyId: PROPERTY_A } });
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
    const req = createGetRequest('/api/v1/community', { searchParams: { propertyId: PROPERTY_A } });
    const res = await GET(req);
    const body = await parseResponse<{ meta: { totalPages: number; total: number } }>(res);
    expect(body.meta.total).toBe(45);
    expect(body.meta.totalPages).toBe(3); // ceil(45/20)
  });

  it('includes images for ad listings', async () => {
    const req = createGetRequest('/api/v1/community', { searchParams: { propertyId: PROPERTY_A } });
    await GET(req);
    expect(mockAdFindMany.mock.calls[0]![0].include.images).toBeDefined();
  });

  it('orders by createdAt descending', async () => {
    const req = createGetRequest('/api/v1/community', { searchParams: { propertyId: PROPERTY_A } });
    await GET(req);
    expect(mockAdFindMany.mock.calls[0]![0].orderBy).toEqual({ createdAt: 'desc' });
  });

  it('returns empty array when no ads exist', async () => {
    const req = createGetRequest('/api/v1/community', { searchParams: { propertyId: PROPERTY_A } });
    const res = await GET(req);
    const body = await parseResponse<{ data: unknown[] }>(res);
    expect(body.data).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// POST /api/v1/community — Validation
// ---------------------------------------------------------------------------

describe('POST /api/v1/community — Validation', () => {
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
      description: 'A nice couch for sale',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects title shorter than 3 characters', async () => {
    const req = createPostRequest('/api/v1/community', {
      propertyId: PROPERTY_A,
      title: 'AB',
      description: 'A nice couch for sale',
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

  it('rejects invalid propertyId format', async () => {
    const req = createPostRequest('/api/v1/community', {
      propertyId: 'not-a-uuid',
      title: 'Couch for sale',
      description: 'A nice couch for sale in great condition',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects invalid priceType', async () => {
    const req = createPostRequest('/api/v1/community', {
      propertyId: PROPERTY_A,
      title: 'Couch for sale',
      description: 'A nice couch for sale in great condition',
      priceType: 'auction',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects negative price', async () => {
    const req = createPostRequest('/api/v1/community', {
      propertyId: PROPERTY_A,
      title: 'Couch for sale',
      description: 'A nice couch for sale in great condition',
      price: -10,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects invalid contactEmail format', async () => {
    const req = createPostRequest('/api/v1/community', {
      propertyId: PROPERTY_A,
      title: 'Couch for sale',
      description: 'A nice couch for sale in great condition',
      contactEmail: 'not-an-email',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// POST /api/v1/community — Creation
// ---------------------------------------------------------------------------

describe('POST /api/v1/community — Ad Creation', () => {
  const validAd = {
    propertyId: PROPERTY_A,
    title: 'Couch for sale',
    description: 'A nice leather couch in great condition, barely used.',
    price: 200,
    priceType: 'negotiable' as const,
    condition: 'like_new' as const,
  };

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

  it('strips HTML from title — XSS prevention', async () => {
    mockAdCreate.mockResolvedValue({ id: 'ad-1', status: 'active' });

    const req = createPostRequest('/api/v1/community', {
      ...validAd,
      title: '<script>alert("xss")</script>Couch',
    });
    await POST(req);

    const createData = mockAdCreate.mock.calls[0]![0].data;
    expect(createData.title).not.toContain('<script>');
  });

  it('strips HTML from description — XSS prevention', async () => {
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

  it('sets userId from authenticated user', async () => {
    mockAdCreate.mockResolvedValue({ id: 'ad-1', status: 'active' });

    const req = createPostRequest('/api/v1/community', validAd);
    await POST(req);

    expect(mockAdCreate.mock.calls[0]![0].data.userId).toBe('test-resident');
  });

  it('accepts all valid priceType values', async () => {
    for (const priceType of ['fixed', 'negotiable', 'free', 'contact']) {
      mockAdCreate.mockResolvedValue({ id: `ad-${priceType}`, status: 'active' });
      const req = createPostRequest('/api/v1/community', { ...validAd, priceType });
      const res = await POST(req);
      expect(res.status).toBe(201);
    }
  });

  it('accepts all valid condition values', async () => {
    for (const condition of ['new', 'like_new', 'good', 'fair', 'not_applicable']) {
      mockAdCreate.mockResolvedValue({ id: `ad-${condition}`, status: 'active' });
      const req = createPostRequest('/api/v1/community', { ...validAd, condition });
      const res = await POST(req);
      expect(res.status).toBe(201);
    }
  });

  it('handles database errors without leaking internals', async () => {
    mockAdCreate.mockRejectedValue(new Error('FK constraint: propertyId not found'));

    const req = createPostRequest('/api/v1/community', validAd);
    const res = await POST(req);
    expect(res.status).toBe(500);
    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).not.toContain('FK constraint');
  });
});
