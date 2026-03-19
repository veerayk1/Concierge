/**
 * Classified Ads — Expiry and Price Tests (GAP 12.2)
 *
 * Classified ads must auto-expire after 30 days to prevent stale listings.
 * Price field is required for buyer decision-making. The Prisma schema has
 * both `price` (Decimal) and `expirationDate` (DateTime) on ClassifiedAd.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createPostRequest, parseResponse } from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Mock Setup
// ---------------------------------------------------------------------------

const mockAdCreate = vi.fn();
const mockAdCount = vi.fn();
const mockAdFindMany = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    classifiedAd: {
      create: (...args: unknown[]) => mockAdCreate(...args),
      count: (...args: unknown[]) => mockAdCount(...args),
      findMany: (...args: unknown[]) => mockAdFindMany(...args),
    },
  },
}));

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: vi.fn().mockResolvedValue({
    user: {
      userId: 'user-resident-001',
      propertyId: '00000000-0000-4000-b000-000000000001',
      role: 'resident_owner',
      permissions: ['*'],
      mfaVerified: false,
    },
    error: null,
  }),
}));

import { POST } from '../route';

const PROPERTY_A = '00000000-0000-4000-b000-000000000001';

const validAd = {
  propertyId: PROPERTY_A,
  title: 'Standing desk for sale',
  description: 'Adjustable standing desk, excellent condition, barely used for six months.',
  price: 350,
  priceType: 'negotiable' as const,
  condition: 'like_new' as const,
};

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// GAP 12.2: Price field handling
// ---------------------------------------------------------------------------

describe('POST /community — Price field (GAP 12.2)', () => {
  it('stores price when provided', async () => {
    mockAdCreate.mockResolvedValue({ id: 'ad-1', status: 'active', price: 350 });

    const req = createPostRequest('/api/v1/community', validAd);
    await POST(req);

    const createData = mockAdCreate.mock.calls[0]![0].data;
    expect(createData.price).toBe(350);
  });

  it('stores price as null when not provided (free item)', async () => {
    mockAdCreate.mockResolvedValue({ id: 'ad-2', status: 'active', price: null });

    const { price: _, ...adWithoutPrice } = validAd;
    const req = createPostRequest('/api/v1/community', {
      ...adWithoutPrice,
      priceType: 'free',
    });
    await POST(req);

    const createData = mockAdCreate.mock.calls[0]![0].data;
    expect(createData.price).toBeNull();
  });

  it('stores price of 0 (explicitly free)', async () => {
    mockAdCreate.mockResolvedValue({ id: 'ad-3', status: 'active', price: 0 });

    const req = createPostRequest('/api/v1/community', { ...validAd, price: 0 });
    await POST(req);

    const createData = mockAdCreate.mock.calls[0]![0].data;
    expect(createData.price).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// GAP 12.2: Expiration date auto-set
// ---------------------------------------------------------------------------

describe('POST /community — Expiration date (GAP 12.2)', () => {
  it('sets expirationDate to ~30 days from now on creation', async () => {
    mockAdCreate.mockResolvedValue({ id: 'ad-4', status: 'active' });

    const beforeCreation = new Date();
    const req = createPostRequest('/api/v1/community', validAd);
    await POST(req);

    const createData = mockAdCreate.mock.calls[0]![0].data;
    expect(createData.expirationDate).toBeInstanceOf(Date);

    const expirationDate = createData.expirationDate as Date;
    const daysDiff = (expirationDate.getTime() - beforeCreation.getTime()) / (1000 * 60 * 60 * 24);
    expect(daysDiff).toBeGreaterThanOrEqual(29.9);
    expect(daysDiff).toBeLessThanOrEqual(30.1);
  });

  it('always sets expirationDate even when not specified in request', async () => {
    mockAdCreate.mockResolvedValue({ id: 'ad-5', status: 'active' });

    const req = createPostRequest('/api/v1/community', validAd);
    await POST(req);

    const createData = mockAdCreate.mock.calls[0]![0].data;
    expect(createData.expirationDate).toBeDefined();
    expect(createData.expirationDate).toBeInstanceOf(Date);
  });
});

// ---------------------------------------------------------------------------
// GAP 12.2: Price + priceType consistency
// ---------------------------------------------------------------------------

describe('POST /community — Price type consistency (GAP 12.2)', () => {
  it('accepts all valid priceType values with price', async () => {
    for (const priceType of ['fixed', 'negotiable', 'free', 'contact']) {
      vi.clearAllMocks();
      mockAdCreate.mockResolvedValue({ id: `ad-${priceType}`, status: 'active' });

      const req = createPostRequest('/api/v1/community', {
        ...validAd,
        priceType,
        price: priceType === 'free' ? 0 : 100,
      });
      const res = await POST(req);
      expect(res.status).toBe(201);
    }
  });

  it('returns 201 with posted message', async () => {
    mockAdCreate.mockResolvedValue({ id: 'ad-6', status: 'active', price: 200 });

    const req = createPostRequest('/api/v1/community', validAd);
    const res = await POST(req);

    expect(res.status).toBe(201);
    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('posted');
  });
});
