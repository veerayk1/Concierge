/**
 * Concierge — Token Refresh Route Tests
 *
 * POST /api/auth/refresh
 *
 * Tests for refresh token rotation, replay detection,
 * expiry handling, and new access token issuance.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import { createPostRequest, parseResponse } from '@/test/helpers/api';
import { createUser } from '@/test/factories/user';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/server/db', () => ({
  prisma: {
    refreshToken: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
    },
    session: {
      findFirst: vi.fn(),
    },
  },
  default: {
    refreshToken: {
      findUnique: vi.fn(),
      update: vi.fn(),
      create: vi.fn(),
      delete: vi.fn(),
    },
    user: { findUnique: vi.fn() },
    session: { findFirst: vi.fn() },
  },
}));

vi.mock('@/server/auth/jwt', () => ({
  signAccessToken: vi.fn().mockResolvedValue('new-access-token'),
  generateRefreshToken: vi.fn().mockReturnValue('new-refresh-token'),
  initializeKeys: vi.fn(),
}));

import { prisma } from '@/server/db';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function callRefresh(body: Record<string, unknown>) {
  const { POST } = await import('@/app/api/auth/refresh/route');
  const req = createPostRequest('/api/auth/refresh', body);
  return POST(req);
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const PROPERTY_ID = '550e8400-e29b-41d4-a716-446655440010';

function mockValidRefreshToken(userId: string) {
  return {
    id: 'rt-1',
    token: 'valid-refresh-token',
    userId,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    revokedAt: null,
    replacedByToken: null,
    createdAt: new Date(),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/auth/refresh', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns new access token for valid refresh token', async () => {
    const user = createUser({ isActive: true });
    const rt = mockValidRefreshToken(user.id);

    vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue(rt as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      ...user,
      userProperties: [{ role: { slug: 'front_desk', permissions: [] }, propertyId: PROPERTY_ID }],
    } as any);
    vi.mocked(prisma.refreshToken.create).mockResolvedValue({
      id: 'rt-2',
      token: 'new-refresh-token',
    } as any);

    const res = await callRefresh({ refreshToken: 'valid-refresh-token' });

    expect(res.status).toBe(200);
    const body = await parseResponse(res);
    expect((body as any).data).toHaveProperty('accessToken');
    expect((body as any).data.accessToken).toBe('new-access-token');
  });

  it('rotates refresh token — old one invalidated, new one issued', async () => {
    const user = createUser({ isActive: true });
    const rt = mockValidRefreshToken(user.id);

    vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue(rt as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      ...user,
      userProperties: [{ role: { slug: 'front_desk', permissions: [] }, propertyId: PROPERTY_ID }],
    } as any);
    vi.mocked(prisma.refreshToken.create).mockResolvedValue({
      id: 'rt-2',
      token: 'new-refresh-token',
    } as any);

    const res = await callRefresh({ refreshToken: 'valid-refresh-token' });

    expect(res.status).toBe(200);
    const body = await parseResponse(res);
    expect((body as any).data).toHaveProperty('refreshToken');
    expect((body as any).data.refreshToken).not.toBe('valid-refresh-token');

    // Old token should be revoked
    expect(prisma.refreshToken.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: rt.id },
        data: expect.objectContaining({
          revokedAt: expect.any(Date),
        }),
      }),
    );
  });

  it('returns 401 for invalid refresh token', async () => {
    vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue(null);

    const res = await callRefresh({ refreshToken: 'invalid-token' });

    expect(res.status).toBe(401);
  });

  it('returns 401 for expired refresh token', async () => {
    const user = createUser({ isActive: true });
    const expiredRt = {
      ...mockValidRefreshToken(user.id),
      expiresAt: new Date(Date.now() - 1000), // expired
    };

    vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue(expiredRt as any);

    const res = await callRefresh({ refreshToken: 'expired-refresh-token' });

    expect(res.status).toBe(401);
  });

  it('returns 401 for already-used (revoked) refresh token — replay detection', async () => {
    const user = createUser({ isActive: true });
    const revokedRt = {
      ...mockValidRefreshToken(user.id),
      revokedAt: new Date(), // already revoked
      replacedByToken: 'rt-successor',
    };

    vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue(revokedRt as any);

    const res = await callRefresh({ refreshToken: 'already-used-token' });

    expect(res.status).toBe(401);
  });

  it('returns 401 when user is deactivated', async () => {
    const user = createUser({ isActive: false });
    const rt = mockValidRefreshToken(user.id);

    vi.mocked(prisma.refreshToken.findUnique).mockResolvedValue(rt as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(user as any);

    const res = await callRefresh({ refreshToken: 'valid-refresh-token' });

    expect(res.status).toBe(401);
  });

  it('returns 422 for missing refreshToken in body', async () => {
    const res = await callRefresh({});

    expect(res.status).toBe(422);
  });
});
