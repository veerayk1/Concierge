/**
 * Classified Ad Detail API Route Tests — [id] endpoints
 *
 * Tests cover:
 * 1.  GET returns ad with images and increments viewCount
 * 2.  GET returns 404 for non-existent ad
 * 3.  GET includes photoCount derived from images array
 * 4.  PATCH marks ad as sold (author)
 * 5.  PATCH marks ad as sold (admin)
 * 6.  PATCH renews listing (extends 30 days)
 * 7.  PATCH rejects renewing sold ad
 * 8.  PATCH edits listing title (author only)
 * 9.  PATCH edits listing description (author only)
 * 10. PATCH edits listing price
 * 11. PATCH rejects edit from non-owner non-admin
 * 12. PATCH returns 404 for non-existent ad
 * 13. DELETE archives listing (author)
 * 14. DELETE archives listing (admin)
 * 15. DELETE rejects non-owner non-admin
 * 16. DELETE returns 404 for non-existent ad
 * 17. DELETE stores removal reason when provided
 * 18. Ownership check enforcement — admin bypass
 * 19. Tenant isolation — ownership scoping
 * 20. Validation — rejects invalid priceType
 * 21. XSS sanitization on PATCH
 * 22. Error handling — database errors do not leak internals
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createGetRequest,
  createPatchRequest,
  createDeleteRequest,
  parseResponse,
} from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Mock Setup
// ---------------------------------------------------------------------------

const mockAdFindUnique = vi.fn();
const mockAdUpdate = vi.fn();

const mockGuardRoute = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    classifiedAd: {
      findUnique: (...args: unknown[]) => mockAdFindUnique(...args),
      update: (...args: unknown[]) => mockAdUpdate(...args),
    },
  },
}));

vi.mock('@/lib/sanitize', () => ({
  stripHtml: vi.fn((input: string) => input.replace(/<[^>]*>/g, '')),
  stripControlChars: vi.fn((input: string) =>
    input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''),
  ),
}));

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: (...args: unknown[]) => mockGuardRoute(...args),
}));

import { GET, PATCH, DELETE } from '../route';

// ---------------------------------------------------------------------------
// Constants & Helpers
// ---------------------------------------------------------------------------

const PROPERTY_A = '00000000-0000-4000-b000-000000000001';
const AD_ID = 'ad-detail-001';
const USER_AUTHOR = 'user-author-001';
const USER_ADMIN = 'user-admin-002';
const USER_OTHER = 'user-other-003';

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

function setAuth(userId: string, role: string) {
  mockGuardRoute.mockResolvedValue({
    user: { userId, propertyId: PROPERTY_A, role, permissions: ['*'], mfaVerified: false },
    error: null,
  });
}

const sampleAd = {
  id: AD_ID,
  propertyId: PROPERTY_A,
  userId: USER_AUTHOR,
  title: 'Leather Couch',
  description: 'A beautiful leather couch in excellent condition, barely used.',
  price: 200,
  priceType: 'negotiable',
  category: 'furniture',
  condition: 'like_new',
  status: 'active',
  viewCount: 10,
  renewalCount: 0,
  expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  images: [
    { id: 'img-1', filePath: '/uploads/couch-front.jpg', sortOrder: 0 },
    { id: 'img-2', filePath: '/uploads/couch-side.jpg', sortOrder: 1 },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  setAuth(USER_AUTHOR, 'resident');
  mockAdFindUnique.mockResolvedValue(null);
  mockAdUpdate.mockResolvedValue({});
});

// ---------------------------------------------------------------------------
// 1–3. GET /api/v1/classifieds/:id
// ---------------------------------------------------------------------------

describe('GET /api/v1/classifieds/:id', () => {
  it('returns ad with images and increments viewCount', async () => {
    mockAdFindUnique.mockResolvedValue(sampleAd);
    mockAdUpdate.mockResolvedValue({ ...sampleAd, viewCount: 11 });

    const req = createGetRequest('/api/v1/classifieds/' + AD_ID);
    const res = await GET(req, makeParams(AD_ID));
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { id: string; photoCount: number } }>(res);
    expect(body.data.id).toBe(AD_ID);
    expect(body.data.photoCount).toBe(2);
  });

  it('calls viewCount increment on fetch', async () => {
    mockAdFindUnique.mockResolvedValue(sampleAd);
    mockAdUpdate.mockResolvedValue({});

    const req = createGetRequest('/api/v1/classifieds/' + AD_ID);
    await GET(req, makeParams(AD_ID));

    expect(mockAdUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: AD_ID },
        data: { viewCount: { increment: 1 } },
      }),
    );
  });

  it('returns 404 for non-existent ad', async () => {
    mockAdFindUnique.mockResolvedValue(null);

    const req = createGetRequest('/api/v1/classifieds/non-existent');
    const res = await GET(req, makeParams('non-existent'));
    expect(res.status).toBe(404);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('NOT_FOUND');
  });

  it('includes images in the response', async () => {
    mockAdFindUnique.mockResolvedValue(sampleAd);
    mockAdUpdate.mockResolvedValue({});

    const req = createGetRequest('/api/v1/classifieds/' + AD_ID);
    await GET(req, makeParams(AD_ID));

    const call = mockAdFindUnique.mock.calls[0]![0];
    expect(call.include.images).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// 4–6. PATCH /api/v1/classifieds/:id — Mark as sold & renew
// ---------------------------------------------------------------------------

describe('PATCH /api/v1/classifieds/:id — Mark as sold', () => {
  it('author marks ad as sold', async () => {
    setAuth(USER_AUTHOR, 'resident');
    mockAdFindUnique.mockResolvedValue(sampleAd);
    mockAdUpdate.mockResolvedValue({ ...sampleAd, status: 'sold' });

    const req = createPatchRequest('/api/v1/classifieds/' + AD_ID, { status: 'sold' });
    const res = await PATCH(req, makeParams(AD_ID));
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { status: string } }>(res);
    expect(body.data.status).toBe('sold');
  });

  it('admin marks any ad as sold', async () => {
    setAuth(USER_ADMIN, 'property_admin');
    mockAdFindUnique.mockResolvedValue(sampleAd);
    mockAdUpdate.mockResolvedValue({ ...sampleAd, status: 'sold' });

    const req = createPatchRequest('/api/v1/classifieds/' + AD_ID, { status: 'sold' });
    const res = await PATCH(req, makeParams(AD_ID));
    expect(res.status).toBe(200);
  });
});

describe('PATCH /api/v1/classifieds/:id — Renew listing', () => {
  it('renews active listing extending expiration by 30 days', async () => {
    setAuth(USER_AUTHOR, 'resident');
    mockAdFindUnique.mockResolvedValue(sampleAd);
    mockAdUpdate.mockResolvedValue({ ...sampleAd, renewalCount: 1, status: 'active' });

    const beforeTime = new Date();
    const req = createPatchRequest('/api/v1/classifieds/' + AD_ID, { renew: true });
    const res = await PATCH(req, makeParams(AD_ID));
    expect(res.status).toBe(200);

    const updateCall = mockAdUpdate.mock.calls[0]![0];
    expect(updateCall.data.renewalCount).toEqual({ increment: 1 });
    expect(updateCall.data.status).toBe('active');

    const newExpiry = updateCall.data.expirationDate as Date;
    const daysDiff = (newExpiry.getTime() - beforeTime.getTime()) / (1000 * 60 * 60 * 24);
    expect(daysDiff).toBeGreaterThanOrEqual(29.9);
    expect(daysDiff).toBeLessThanOrEqual(30.1);
  });

  it('renews expired listing', async () => {
    setAuth(USER_AUTHOR, 'resident');
    const expiredAd = { ...sampleAd, status: 'expired' };
    mockAdFindUnique.mockResolvedValue(expiredAd);
    mockAdUpdate.mockResolvedValue({ ...expiredAd, status: 'active', renewalCount: 1 });

    const req = createPatchRequest('/api/v1/classifieds/' + AD_ID, { renew: true });
    const res = await PATCH(req, makeParams(AD_ID));
    expect(res.status).toBe(200);

    const updateCall = mockAdUpdate.mock.calls[0]![0];
    expect(updateCall.data.status).toBe('active');
  });

  it('rejects renewing sold ad', async () => {
    setAuth(USER_AUTHOR, 'resident');
    const soldAd = { ...sampleAd, status: 'sold' };
    mockAdFindUnique.mockResolvedValue(soldAd);

    const req = createPatchRequest('/api/v1/classifieds/' + AD_ID, { renew: true });
    const res = await PATCH(req, makeParams(AD_ID));
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('INVALID_RENEW');
  });

  it('rejects renewing archived ad', async () => {
    setAuth(USER_AUTHOR, 'resident');
    const archivedAd = { ...sampleAd, status: 'archived' };
    mockAdFindUnique.mockResolvedValue(archivedAd);

    const req = createPatchRequest('/api/v1/classifieds/' + AD_ID, { renew: true });
    const res = await PATCH(req, makeParams(AD_ID));
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('INVALID_RENEW');
  });
});

// ---------------------------------------------------------------------------
// 8–12. PATCH /api/v1/classifieds/:id — Edit listing
// ---------------------------------------------------------------------------

describe('PATCH /api/v1/classifieds/:id — Edit listing', () => {
  it('author edits listing title', async () => {
    setAuth(USER_AUTHOR, 'resident');
    mockAdFindUnique.mockResolvedValue(sampleAd);
    mockAdUpdate.mockResolvedValue({ ...sampleAd, title: 'Updated Couch' });

    const req = createPatchRequest('/api/v1/classifieds/' + AD_ID, { title: 'Updated Couch' });
    const res = await PATCH(req, makeParams(AD_ID));
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { title: string } }>(res);
    expect(body.data.title).toBe('Updated Couch');
  });

  it('author edits listing description', async () => {
    setAuth(USER_AUTHOR, 'resident');
    mockAdFindUnique.mockResolvedValue(sampleAd);
    mockAdUpdate.mockResolvedValue({
      ...sampleAd,
      description: 'Updated description with more detail',
    });

    const req = createPatchRequest('/api/v1/classifieds/' + AD_ID, {
      description: 'Updated description with more detail',
    });
    const res = await PATCH(req, makeParams(AD_ID));
    expect(res.status).toBe(200);
  });

  it('updates price to zero (free item)', async () => {
    setAuth(USER_AUTHOR, 'resident');
    mockAdFindUnique.mockResolvedValue(sampleAd);
    mockAdUpdate.mockResolvedValue({ ...sampleAd, price: 0 });

    const req = createPatchRequest('/api/v1/classifieds/' + AD_ID, { price: 0, priceType: 'free' });
    const res = await PATCH(req, makeParams(AD_ID));
    expect(res.status).toBe(200);

    expect(mockAdUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ price: 0, priceType: 'free' }),
      }),
    );
  });

  it('rejects edit from non-owner non-admin', async () => {
    setAuth(USER_OTHER, 'resident');
    mockAdFindUnique.mockResolvedValue(sampleAd);

    const req = createPatchRequest('/api/v1/classifieds/' + AD_ID, { title: 'Hijacked' });
    const res = await PATCH(req, makeParams(AD_ID));
    expect(res.status).toBe(403);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('FORBIDDEN');
  });

  it('returns 404 for non-existent ad', async () => {
    mockAdFindUnique.mockResolvedValue(null);

    const req = createPatchRequest('/api/v1/classifieds/non-existent', { title: 'Nope' });
    const res = await PATCH(req, makeParams('non-existent'));
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// 13–17. DELETE /api/v1/classifieds/:id — Archive listing
// ---------------------------------------------------------------------------

describe('DELETE /api/v1/classifieds/:id', () => {
  it('author archives their listing', async () => {
    setAuth(USER_AUTHOR, 'resident');
    mockAdFindUnique.mockResolvedValue(sampleAd);
    mockAdUpdate.mockResolvedValue({ ...sampleAd, status: 'archived' });

    const req = createDeleteRequest('/api/v1/classifieds/' + AD_ID);
    const res = await DELETE(req, makeParams(AD_ID));
    expect(res.status).toBe(200);

    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toBe('Ad removed.');

    const updateCall = mockAdUpdate.mock.calls[0]![0];
    expect(updateCall.data.status).toBe('archived');
  });

  it('admin archives any listing', async () => {
    setAuth(USER_ADMIN, 'property_admin');
    mockAdFindUnique.mockResolvedValue(sampleAd);
    mockAdUpdate.mockResolvedValue({ ...sampleAd, status: 'archived' });

    const req = createDeleteRequest('/api/v1/classifieds/' + AD_ID);
    const res = await DELETE(req, makeParams(AD_ID));
    expect(res.status).toBe(200);
  });

  it('rejects delete from non-owner non-admin', async () => {
    setAuth(USER_OTHER, 'resident');
    mockAdFindUnique.mockResolvedValue(sampleAd);

    const req = createDeleteRequest('/api/v1/classifieds/' + AD_ID);
    const res = await DELETE(req, makeParams(AD_ID));
    expect(res.status).toBe(403);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('FORBIDDEN');
  });

  it('returns 404 for non-existent ad', async () => {
    mockAdFindUnique.mockResolvedValue(null);

    const req = createDeleteRequest('/api/v1/classifieds/non-existent');
    const res = await DELETE(req, makeParams('non-existent'));
    expect(res.status).toBe(404);
  });

  it('stores removal reason when provided in body', async () => {
    setAuth(USER_ADMIN, 'property_admin');
    mockAdFindUnique.mockResolvedValue(sampleAd);
    mockAdUpdate.mockResolvedValue({ ...sampleAd, status: 'archived' });

    const req = createDeleteRequest('/api/v1/classifieds/' + AD_ID, {
      body: { reason: 'Violates community guidelines' },
    });
    const res = await DELETE(req, makeParams(AD_ID));
    expect(res.status).toBe(200);

    const updateCall = mockAdUpdate.mock.calls[0]![0];
    expect(updateCall.data.rejectionReason).toBe('Violates community guidelines');
  });
});

// ---------------------------------------------------------------------------
// 18. Ownership check enforcement
// ---------------------------------------------------------------------------

describe('Ownership check enforcement', () => {
  it('admin bypasses ownership check on PATCH', async () => {
    setAuth(USER_ADMIN, 'property_admin');
    mockAdFindUnique.mockResolvedValue(sampleAd); // userId is USER_AUTHOR
    mockAdUpdate.mockResolvedValue({ ...sampleAd, title: 'Admin Edit' });

    const req = createPatchRequest('/api/v1/classifieds/' + AD_ID, { title: 'Admin Edit' });
    const res = await PATCH(req, makeParams(AD_ID));
    expect(res.status).toBe(200);
  });

  it('property_manager bypasses ownership check on PATCH', async () => {
    setAuth('manager-001', 'property_manager');
    mockAdFindUnique.mockResolvedValue(sampleAd);
    mockAdUpdate.mockResolvedValue({ ...sampleAd, title: 'Manager Edit' });

    const req = createPatchRequest('/api/v1/classifieds/' + AD_ID, { title: 'Manager Edit' });
    const res = await PATCH(req, makeParams(AD_ID));
    expect(res.status).toBe(200);
  });

  it('super_admin bypasses ownership check on DELETE', async () => {
    setAuth('super-001', 'super_admin');
    mockAdFindUnique.mockResolvedValue(sampleAd);
    mockAdUpdate.mockResolvedValue({ ...sampleAd, status: 'archived' });

    const req = createDeleteRequest('/api/v1/classifieds/' + AD_ID);
    const res = await DELETE(req, makeParams(AD_ID));
    expect(res.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// 19. Tenant isolation
// ---------------------------------------------------------------------------

describe('Tenant isolation', () => {
  it('non-owner resident cannot modify ad from another resident', async () => {
    setAuth(USER_OTHER, 'resident');
    mockAdFindUnique.mockResolvedValue(sampleAd);

    const req = createPatchRequest('/api/v1/classifieds/' + AD_ID, { title: 'Steal' });
    const res = await PATCH(req, makeParams(AD_ID));
    expect(res.status).toBe(403);
  });

  it('non-owner resident cannot delete ad from another resident', async () => {
    setAuth(USER_OTHER, 'resident');
    mockAdFindUnique.mockResolvedValue(sampleAd);

    const req = createDeleteRequest('/api/v1/classifieds/' + AD_ID);
    const res = await DELETE(req, makeParams(AD_ID));
    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// 20. Validation
// ---------------------------------------------------------------------------

describe('Validation', () => {
  it('rejects invalid priceType on PATCH', async () => {
    setAuth(USER_AUTHOR, 'resident');
    mockAdFindUnique.mockResolvedValue(sampleAd);

    const req = createPatchRequest('/api/v1/classifieds/' + AD_ID, { priceType: 'auction' });
    const res = await PATCH(req, makeParams(AD_ID));
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('rejects invalid condition on PATCH', async () => {
    setAuth(USER_AUTHOR, 'resident');
    mockAdFindUnique.mockResolvedValue(sampleAd);

    const req = createPatchRequest('/api/v1/classifieds/' + AD_ID, { condition: 'broken' });
    const res = await PATCH(req, makeParams(AD_ID));
    expect(res.status).toBe(400);
  });

  it('rejects negative price on PATCH', async () => {
    setAuth(USER_AUTHOR, 'resident');
    mockAdFindUnique.mockResolvedValue(sampleAd);

    const req = createPatchRequest('/api/v1/classifieds/' + AD_ID, { price: -5 });
    const res = await PATCH(req, makeParams(AD_ID));
    expect(res.status).toBe(400);
  });

  it('rejects title shorter than 3 characters', async () => {
    setAuth(USER_AUTHOR, 'resident');
    mockAdFindUnique.mockResolvedValue(sampleAd);

    const req = createPatchRequest('/api/v1/classifieds/' + AD_ID, { title: 'AB' });
    const res = await PATCH(req, makeParams(AD_ID));
    expect(res.status).toBe(400);
  });

  it('rejects invalid contactEmail format', async () => {
    setAuth(USER_AUTHOR, 'resident');
    mockAdFindUnique.mockResolvedValue(sampleAd);

    const req = createPatchRequest('/api/v1/classifieds/' + AD_ID, { contactEmail: 'not-email' });
    const res = await PATCH(req, makeParams(AD_ID));
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// 21. XSS sanitization
// ---------------------------------------------------------------------------

describe('XSS sanitization', () => {
  it('strips HTML from title on PATCH', async () => {
    setAuth(USER_AUTHOR, 'resident');
    mockAdFindUnique.mockResolvedValue(sampleAd);
    mockAdUpdate.mockResolvedValue({});

    const req = createPatchRequest('/api/v1/classifieds/' + AD_ID, {
      title: '<script>alert("xss")</script>Clean Title',
    });
    await PATCH(req, makeParams(AD_ID));

    const updateData = mockAdUpdate.mock.calls[0]![0].data;
    expect(updateData.title).not.toContain('<script>');
    expect(updateData.title).toContain('Clean Title');
  });

  it('strips HTML from description on PATCH', async () => {
    setAuth(USER_AUTHOR, 'resident');
    mockAdFindUnique.mockResolvedValue(sampleAd);
    mockAdUpdate.mockResolvedValue({});

    const req = createPatchRequest('/api/v1/classifieds/' + AD_ID, {
      description: '<img onerror="alert(1)">Nice item for sale here',
    });
    await PATCH(req, makeParams(AD_ID));

    const updateData = mockAdUpdate.mock.calls[0]![0].data;
    expect(updateData.description).not.toContain('<img');
  });
});

// ---------------------------------------------------------------------------
// 22. Error handling
// ---------------------------------------------------------------------------

describe('Error handling', () => {
  it('handles database error on GET without leaking internals', async () => {
    mockAdFindUnique.mockRejectedValue(new Error('connection timeout'));

    const req = createGetRequest('/api/v1/classifieds/' + AD_ID);
    const res = await GET(req, makeParams(AD_ID));
    expect(res.status).toBe(500);

    const body = await parseResponse<{ error: string; message: string }>(res);
    expect(body.error).toBe('INTERNAL_ERROR');
    expect(body.message).not.toContain('connection timeout');
  });

  it('handles database error on PATCH without leaking internals', async () => {
    setAuth(USER_AUTHOR, 'resident');
    mockAdFindUnique.mockResolvedValue(sampleAd);
    mockAdUpdate.mockRejectedValue(new Error('deadlock'));

    const req = createPatchRequest('/api/v1/classifieds/' + AD_ID, { title: 'Crash' });
    const res = await PATCH(req, makeParams(AD_ID));
    expect(res.status).toBe(500);

    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).not.toContain('deadlock');
  });

  it('handles database error on DELETE without leaking internals', async () => {
    setAuth(USER_AUTHOR, 'resident');
    mockAdFindUnique.mockResolvedValue(sampleAd);
    mockAdUpdate.mockRejectedValue(new Error('FK violation'));

    const req = createDeleteRequest('/api/v1/classifieds/' + AD_ID);
    const res = await DELETE(req, makeParams(AD_ID));
    expect(res.status).toBe(500);

    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).not.toContain('FK violation');
  });
});
