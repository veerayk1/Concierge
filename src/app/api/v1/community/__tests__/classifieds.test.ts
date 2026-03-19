/**
 * Classified Ads — Extended Tests
 *
 * Covers Condo Control unique features:
 * 1. Create ad with title, description, price, category, photos
 * 2. Status lifecycle: draft -> active -> sold -> expired
 * 3. Auto-expire ads after 30 days
 * 4. Contact methods: in_app, phone, email
 * 5. Category filtering: furniture, electronics, services, free, other
 * 6. Search by title and description
 * 7. User can only edit/delete their own ads
 * 8. Flag inappropriate ad -> admin review queue
 * 9. Pagination with cursor-based navigation
 * 10. Admin can remove any ad with reason
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
const mockAdDelete = vi.fn();
const mockAdUpdateMany = vi.fn();
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
      delete: (...args: unknown[]) => mockAdDelete(...args),
      updateMany: (...args: unknown[]) => mockAdUpdateMany(...args),
    },
    classifiedAdFlag: {
      create: (...args: unknown[]) => mockAdFlagCreate(...args),
      findMany: (...args: unknown[]) => mockAdFlagFindMany(...args),
    },
    classifiedAdImage: {
      create: (...args: unknown[]) => mockAdImageCreate(...args),
    },
  },
}));

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: (...args: unknown[]) => mockGuardRoute(...args),
}));

// Import route handlers after mocks are set up
import { GET, POST } from '../route';
import { GET as GET_ID, PATCH, DELETE } from '../[id]/route';
import { POST as FLAG_POST } from '../[id]/flag/route';
import { POST as EXPIRE_POST } from '../expire/route';

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
  mockAdFindMany.mockResolvedValue([]);
  mockAdCount.mockResolvedValue(0);
});

// ---------------------------------------------------------------------------
// 1. Create ad with title, description, price, category, photos
// ---------------------------------------------------------------------------

describe('Classified Ads — Create with full fields', () => {
  const validAd = {
    propertyId: PROPERTY_A,
    title: 'IKEA Kallax shelf',
    description: 'White IKEA Kallax 4x2 shelf unit, excellent condition.',
    price: 75,
    priceType: 'negotiable' as const,
    category: 'furniture',
    contactMethod: ['in_app', 'email'] as const,
    contactEmail: 'seller@example.com',
  };

  it('creates an ad with title, description, price, category', async () => {
    mockAdCreate.mockResolvedValue({ id: 'ad-1', ...validAd, status: 'active' });
    const req = createPostRequest('/api/v1/community', validAd);
    const res = await POST(req);
    expect(res.status).toBe(201);

    const data = mockAdCreate.mock.calls[0]![0].data;
    expect(data.title).toContain('Kallax');
    expect(data.price).toBe(75);
  });

  it('stores category from input', async () => {
    mockAdCreate.mockResolvedValue({ id: 'ad-1', status: 'active' });
    const req = createPostRequest('/api/v1/community', validAd);
    await POST(req);
    const data = mockAdCreate.mock.calls[0]![0].data;
    expect(data.category).toBe('furniture');
  });

  it('stores contactMethod array', async () => {
    mockAdCreate.mockResolvedValue({ id: 'ad-1', status: 'active' });
    const req = createPostRequest('/api/v1/community', validAd);
    await POST(req);
    const data = mockAdCreate.mock.calls[0]![0].data;
    expect(data.contactMethod).toEqual(['in_app', 'email']);
  });
});

// ---------------------------------------------------------------------------
// 2. Status lifecycle: draft -> active -> sold -> expired
// ---------------------------------------------------------------------------

describe('Classified Ads — Status lifecycle', () => {
  it('updates ad from draft to active', async () => {
    mockAdFindUnique.mockResolvedValue({
      id: 'ad-1',
      userId: USER_RESIDENT,
      status: 'draft',
      propertyId: PROPERTY_A,
    });
    mockAdUpdate.mockResolvedValue({ id: 'ad-1', status: 'active' });

    const req = createPatchRequest('/api/v1/community/ad-1', { status: 'active' });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'ad-1' }) });
    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: { status: string } }>(res);
    expect(body.data.status).toBe('active');
  });

  it('updates ad from active to sold', async () => {
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

  it('rejects invalid status transition (sold -> draft)', async () => {
    mockAdFindUnique.mockResolvedValue({
      id: 'ad-1',
      userId: USER_RESIDENT,
      status: 'sold',
      propertyId: PROPERTY_A,
    });

    const req = createPatchRequest('/api/v1/community/ad-1', { status: 'draft' });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'ad-1' }) });
    expect(res.status).toBe(400);
  });

  it('rejects invalid status transition (expired -> active)', async () => {
    mockAdFindUnique.mockResolvedValue({
      id: 'ad-1',
      userId: USER_RESIDENT,
      status: 'expired',
      propertyId: PROPERTY_A,
    });

    const req = createPatchRequest('/api/v1/community/ad-1', { status: 'active' });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'ad-1' }) });
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// 3. Auto-expire ads after 30 days
// ---------------------------------------------------------------------------

describe('Classified Ads — Auto-expire after 30 days', () => {
  it('marks ads older than 30 days as expired', async () => {
    mockAdUpdateMany.mockResolvedValue({ count: 5 });

    const req = createPostRequest('/api/v1/community/expire', {});
    const res = await EXPIRE_POST(req);
    expect(res.status).toBe(200);

    const call = mockAdUpdateMany.mock.calls[0]![0];
    expect(call.where.status).toBe('active');
    expect(call.where.createdAt.lte).toBeDefined();
    expect(call.data.status).toBe('expired');
  });

  it('returns count of expired ads', async () => {
    mockAdUpdateMany.mockResolvedValue({ count: 3 });

    const req = createPostRequest('/api/v1/community/expire', {});
    const res = await EXPIRE_POST(req);
    const body = await parseResponse<{ data: { expiredCount: number } }>(res);
    expect(body.data.expiredCount).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// 4. Contact methods: in_app, phone, email
// ---------------------------------------------------------------------------

describe('Classified Ads — Contact methods', () => {
  const baseAd = {
    propertyId: PROPERTY_A,
    title: 'Moving sale items',
    description: 'Various household items available for free pickup.',
  };

  it('accepts in_app contact method', async () => {
    mockAdCreate.mockResolvedValue({ id: 'ad-1', status: 'active' });
    const req = createPostRequest('/api/v1/community', {
      ...baseAd,
      contactMethod: ['in_app'],
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('accepts phone contact method', async () => {
    mockAdCreate.mockResolvedValue({ id: 'ad-1', status: 'active' });
    const req = createPostRequest('/api/v1/community', {
      ...baseAd,
      contactMethod: ['phone'],
      contactPhone: '416-555-1234',
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('accepts email contact method', async () => {
    mockAdCreate.mockResolvedValue({ id: 'ad-1', status: 'active' });
    const req = createPostRequest('/api/v1/community', {
      ...baseAd,
      contactMethod: ['email'],
      contactEmail: 'seller@example.com',
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('accepts multiple contact methods', async () => {
    mockAdCreate.mockResolvedValue({ id: 'ad-1', status: 'active' });
    const req = createPostRequest('/api/v1/community', {
      ...baseAd,
      contactMethod: ['in_app', 'phone', 'email'],
      contactPhone: '416-555-1234',
      contactEmail: 'seller@example.com',
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const data = mockAdCreate.mock.calls[0]![0].data;
    expect(data.contactMethod).toHaveLength(3);
  });

  it('defaults to in_app if no contact method specified', async () => {
    mockAdCreate.mockResolvedValue({ id: 'ad-1', status: 'active' });
    const req = createPostRequest('/api/v1/community', baseAd);
    await POST(req);
    const data = mockAdCreate.mock.calls[0]![0].data;
    expect(data.contactMethod).toEqual(['in_app']);
  });
});

// ---------------------------------------------------------------------------
// 5. Category filtering: furniture, electronics, services, free, other
// ---------------------------------------------------------------------------

describe('Classified Ads — Category filtering', () => {
  it('filters by category=furniture', async () => {
    const req = createGetRequest('/api/v1/community', {
      searchParams: { propertyId: PROPERTY_A, category: 'furniture' },
    });
    await GET(req);
    const where = mockAdFindMany.mock.calls[0]![0].where;
    expect(where.category).toBe('furniture');
  });

  it('filters by category=electronics', async () => {
    const req = createGetRequest('/api/v1/community', {
      searchParams: { propertyId: PROPERTY_A, category: 'electronics' },
    });
    await GET(req);
    const where = mockAdFindMany.mock.calls[0]![0].where;
    expect(where.category).toBe('electronics');
  });

  it('filters by category=services', async () => {
    const req = createGetRequest('/api/v1/community', {
      searchParams: { propertyId: PROPERTY_A, category: 'services' },
    });
    await GET(req);
    const where = mockAdFindMany.mock.calls[0]![0].where;
    expect(where.category).toBe('services');
  });

  it('filters by category=free', async () => {
    const req = createGetRequest('/api/v1/community', {
      searchParams: { propertyId: PROPERTY_A, category: 'free' },
    });
    await GET(req);
    const where = mockAdFindMany.mock.calls[0]![0].where;
    expect(where.category).toBe('free');
  });

  it('filters by category=other', async () => {
    const req = createGetRequest('/api/v1/community', {
      searchParams: { propertyId: PROPERTY_A, category: 'other' },
    });
    await GET(req);
    const where = mockAdFindMany.mock.calls[0]![0].where;
    expect(where.category).toBe('other');
  });

  it('returns all categories when no category filter is specified', async () => {
    const req = createGetRequest('/api/v1/community', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET(req);
    const where = mockAdFindMany.mock.calls[0]![0].where;
    expect(where.category).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 6. Search by title and description
// ---------------------------------------------------------------------------

describe('Classified Ads — Search', () => {
  it('searches by title keyword', async () => {
    const req = createGetRequest('/api/v1/community', {
      searchParams: { propertyId: PROPERTY_A, search: 'bookshelf' },
    });
    await GET(req);
    const where = mockAdFindMany.mock.calls[0]![0].where;
    expect(where.OR).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ title: { contains: 'bookshelf', mode: 'insensitive' } }),
      ]),
    );
  });

  it('searches by description keyword', async () => {
    const req = createGetRequest('/api/v1/community', {
      searchParams: { propertyId: PROPERTY_A, search: 'solid wood' },
    });
    await GET(req);
    const where = mockAdFindMany.mock.calls[0]![0].where;
    expect(where.OR).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          description: { contains: 'solid wood', mode: 'insensitive' },
        }),
      ]),
    );
  });

  it('combines search with category filter', async () => {
    const req = createGetRequest('/api/v1/community', {
      searchParams: { propertyId: PROPERTY_A, search: 'desk', category: 'furniture' },
    });
    await GET(req);
    const where = mockAdFindMany.mock.calls[0]![0].where;
    expect(where.category).toBe('furniture');
    expect(where.OR).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// 7. User can only edit/delete their own ads
// ---------------------------------------------------------------------------

describe('Classified Ads — Ownership enforcement', () => {
  it('allows owner to edit their ad', async () => {
    mockAdFindUnique.mockResolvedValue({
      id: 'ad-1',
      userId: USER_RESIDENT,
      status: 'active',
      propertyId: PROPERTY_A,
    });
    mockAdUpdate.mockResolvedValue({ id: 'ad-1', title: 'Updated title', status: 'active' });

    const req = createPatchRequest('/api/v1/community/ad-1', { title: 'Updated title' });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'ad-1' }) });
    expect(res.status).toBe(200);
  });

  it('rejects edit from non-owner', async () => {
    setAuth(USER_OTHER, 'resident');
    mockAdFindUnique.mockResolvedValue({
      id: 'ad-1',
      userId: USER_RESIDENT,
      status: 'active',
      propertyId: PROPERTY_A,
    });

    const req = createPatchRequest('/api/v1/community/ad-1', { title: 'Hijack title' });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'ad-1' }) });
    expect(res.status).toBe(403);
  });

  it('allows owner to delete their ad', async () => {
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

  it('rejects delete from non-owner', async () => {
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

  it('returns 404 for non-existent ad on edit', async () => {
    mockAdFindUnique.mockResolvedValue(null);

    const req = createPatchRequest('/api/v1/community/ad-nonexistent', { title: 'Ghost' });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'ad-nonexistent' }) });
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// 8. Flag inappropriate ad -> admin review queue
// ---------------------------------------------------------------------------

describe('Classified Ads — Flagging', () => {
  it('allows a user to flag an inappropriate ad', async () => {
    mockAdFindUnique.mockResolvedValue({
      id: 'ad-1',
      userId: USER_OTHER,
      status: 'active',
      propertyId: PROPERTY_A,
    });
    mockAdFlagCreate.mockResolvedValue({ id: 'flag-1', adId: 'ad-1', reason: 'spam' });

    const req = createPostRequest('/api/v1/community/ad-1/flag', {
      reason: 'spam',
      description: 'This looks like a scam listing.',
    });
    const res = await FLAG_POST(req, { params: Promise.resolve({ id: 'ad-1' }) });
    expect(res.status).toBe(201);
  });

  it('stores the flagger userId', async () => {
    mockAdFindUnique.mockResolvedValue({
      id: 'ad-1',
      userId: USER_OTHER,
      status: 'active',
      propertyId: PROPERTY_A,
    });
    mockAdFlagCreate.mockResolvedValue({ id: 'flag-1' });

    const req = createPostRequest('/api/v1/community/ad-1/flag', {
      reason: 'inappropriate',
    });
    await FLAG_POST(req, { params: Promise.resolve({ id: 'ad-1' }) });

    const data = mockAdFlagCreate.mock.calls[0]![0].data;
    expect(data.userId).toBe(USER_RESIDENT);
  });

  it('returns 404 when flagging non-existent ad', async () => {
    mockAdFindUnique.mockResolvedValue(null);

    const req = createPostRequest('/api/v1/community/ad-ghost/flag', {
      reason: 'spam',
    });
    const res = await FLAG_POST(req, { params: Promise.resolve({ id: 'ad-ghost' }) });
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// 9. Pagination with cursor-based navigation
// ---------------------------------------------------------------------------

describe('Classified Ads — Cursor pagination', () => {
  it('accepts cursor param and passes it as skip-cursor', async () => {
    const req = createGetRequest('/api/v1/community', {
      searchParams: { propertyId: PROPERTY_A, cursor: 'ad-cursor-xyz' },
    });
    await GET(req);
    const call = mockAdFindMany.mock.calls[0]![0];
    expect(call.cursor).toEqual({ id: 'ad-cursor-xyz' });
    expect(call.skip).toBe(1); // skip the cursor item itself
  });

  it('returns nextCursor in response when more results exist', async () => {
    const ads = Array.from({ length: 20 }, (_, i) => ({ id: `ad-${i}`, title: `Ad ${i}` }));
    mockAdFindMany.mockResolvedValue(ads);
    mockAdCount.mockResolvedValue(50);

    const req = createGetRequest('/api/v1/community', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await GET(req);
    const body = await parseResponse<{ meta: { nextCursor: string | null } }>(res);
    expect(body.meta.nextCursor).toBe('ad-19');
  });

  it('returns null nextCursor when no more results', async () => {
    const ads = [{ id: 'ad-last', title: 'Last' }];
    mockAdFindMany.mockResolvedValue(ads);
    mockAdCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/community', {
      searchParams: { propertyId: PROPERTY_A, pageSize: '20' },
    });
    const res = await GET(req);
    const body = await parseResponse<{ meta: { nextCursor: string | null } }>(res);
    expect(body.meta.nextCursor).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 10. Admin can remove any ad with reason
// ---------------------------------------------------------------------------

describe('Classified Ads — Admin removal', () => {
  it('allows admin to delete any ad regardless of ownership', async () => {
    setAuth(USER_ADMIN, ADMIN_ROLE);
    mockAdFindUnique.mockResolvedValue({
      id: 'ad-1',
      userId: USER_RESIDENT,
      status: 'active',
      propertyId: PROPERTY_A,
    });
    mockAdUpdate.mockResolvedValue({
      id: 'ad-1',
      status: 'archived',
      rejectionReason: 'Violates community guidelines',
    });

    const req = createDeleteRequest('/api/v1/community/ad-1', {
      body: { reason: 'Violates community guidelines' },
    });
    const res = await DELETE(req, { params: Promise.resolve({ id: 'ad-1' }) });
    expect(res.status).toBe(200);
  });

  it('stores the admin removal reason', async () => {
    setAuth(USER_ADMIN, ADMIN_ROLE);
    mockAdFindUnique.mockResolvedValue({
      id: 'ad-1',
      userId: USER_RESIDENT,
      status: 'active',
      propertyId: PROPERTY_A,
    });
    mockAdUpdate.mockResolvedValue({ id: 'ad-1', status: 'archived' });

    const req = createDeleteRequest('/api/v1/community/ad-1', {
      body: { reason: 'Prohibited item' },
    });
    await DELETE(req, { params: Promise.resolve({ id: 'ad-1' }) });

    const updateCall = mockAdUpdate.mock.calls[0]![0];
    expect(updateCall.data.rejectionReason).toBe('Prohibited item');
  });

  it('admin removal sets status to archived', async () => {
    setAuth(USER_ADMIN, ADMIN_ROLE);
    mockAdFindUnique.mockResolvedValue({
      id: 'ad-1',
      userId: USER_RESIDENT,
      status: 'active',
      propertyId: PROPERTY_A,
    });
    mockAdUpdate.mockResolvedValue({ id: 'ad-1', status: 'archived' });

    const req = createDeleteRequest('/api/v1/community/ad-1', {
      body: { reason: 'Policy violation' },
    });
    await DELETE(req, { params: Promise.resolve({ id: 'ad-1' }) });

    const updateCall = mockAdUpdate.mock.calls[0]![0];
    expect(updateCall.data.status).toBe('archived');
  });
});
