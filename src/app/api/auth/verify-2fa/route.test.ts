/**
 * Concierge — 2FA Verification Route Tests
 *
 * POST /api/auth/verify-2fa
 *
 * Tests for MFA code verification, recovery code usage,
 * token expiry, and JWT issuance after successful 2FA.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import { createPostRequest, parseResponse } from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/server/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    recoveryCode: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    session: {
      create: vi.fn(),
    },
    refreshToken: {
      create: vi.fn(),
    },
    loginAudit: {
      create: vi.fn(),
    },
  },
  default: {
    user: { findUnique: vi.fn(), update: vi.fn() },
    recoveryCode: { findFirst: vi.fn(), update: vi.fn() },
    session: { create: vi.fn() },
    refreshToken: { create: vi.fn() },
    loginAudit: { create: vi.fn() },
  },
}));

vi.mock('@/server/auth/totp', () => ({
  verifyTotpCode: vi.fn(),
}));

vi.mock('@/server/auth/jwt', () => ({
  signAccessToken: vi.fn().mockResolvedValue('mock-access-token'),
  generateRefreshToken: vi.fn().mockReturnValue('mock-refresh-token'),
  initializeKeys: vi.fn(),
  verifyAccessToken: vi.fn(),
}));

vi.mock('@/server/auth/session', () => ({
  createSession: vi.fn().mockResolvedValue({
    id: 'session-id',
    userId: 'user-id',
    deviceFingerprint: 'fp',
    ipAddress: '127.0.0.1',
    userAgent: 'test',
    lastActiveAt: new Date(),
    expiresAt: new Date(Date.now() + 86400000),
    createdAt: new Date(),
  }),
  generateDeviceFingerprint: vi.fn().mockReturnValue('mock-fp'),
}));

// Must import after mocks
import { prisma } from '@/server/db';
import { verifyTotpCode } from '@/server/auth/totp';
import { createUser } from '@/test/factories/user';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * The verify-2fa route does not exist yet — this import will fail until
 * the route is implemented. That's the TDD expectation.
 */
async function callVerify2fa(body: Record<string, unknown>) {
  // Dynamic import to handle missing module gracefully in test listing
  const { POST } = await import('@/app/api/auth/verify-2fa/route');
  const req = createPostRequest('/api/auth/verify-2fa', body);
  return POST(req);
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const PROPERTY_ID = '550e8400-e29b-41d4-a716-446655440010';

function mockUserWithMfa() {
  return createUser({
    mfaEnabled: true,
    mfaSecret: 'JBSWY3DPEHPK3PXP',
    isActive: true,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/auth/verify-2fa', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200 with JWT for valid TOTP code', async () => {
    const user = mockUserWithMfa();

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      ...user,
      userProperties: [
        { role: { slug: 'property_admin', permissions: ['*'] }, propertyId: PROPERTY_ID },
      ],
    } as any);
    vi.mocked(verifyTotpCode).mockResolvedValue(true);

    const res = await callVerify2fa({
      code: '123456',
      mfaToken: 'valid-mfa-token',
    });

    expect(res.status).toBe(200);
    const body = await parseResponse(res);
    expect((body as any).data).toHaveProperty('accessToken');
    expect((body as any).data).toHaveProperty('refreshToken');
  });

  it('returns 401 for invalid TOTP code', async () => {
    const user = mockUserWithMfa();

    vi.mocked(prisma.user.findUnique).mockResolvedValue(user as any);
    vi.mocked(verifyTotpCode).mockResolvedValue(false);

    const res = await callVerify2fa({
      code: '000000',
      mfaToken: 'valid-mfa-token',
    });

    expect(res.status).toBe(401);
  });

  it('returns 401 for expired MFA token', async () => {
    // The mfaToken should have a 5-minute TTL
    // Simulating an expired token by having the lookup fail

    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const res = await callVerify2fa({
      code: '123456',
      mfaToken: 'expired-mfa-token',
    });

    expect(res.status).toBe(401);
  });

  it('returns 200 with JWT for valid recovery code', async () => {
    const user = mockUserWithMfa();

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      ...user,
      userProperties: [
        { role: { slug: 'property_admin', permissions: ['*'] }, propertyId: PROPERTY_ID },
      ],
    } as any);

    // Recovery code is found and not yet used
    vi.mocked((prisma as any).recoveryCode.findFirst).mockResolvedValue({
      id: 'rc-1',
      userId: user.id,
      code: 'ABCD1234',
      usedAt: null,
    } as any);

    const res = await callVerify2fa({
      recoveryCode: 'ABCD1234',
      mfaToken: 'valid-mfa-token',
    });

    expect(res.status).toBe(200);
    const body = await parseResponse(res);
    expect((body as any).data).toHaveProperty('accessToken');
  });

  it('marks recovery code as used after successful verification', async () => {
    const user = mockUserWithMfa();

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      ...user,
      userProperties: [
        { role: { slug: 'property_admin', permissions: ['*'] }, propertyId: PROPERTY_ID },
      ],
    } as any);

    vi.mocked((prisma as any).recoveryCode.findFirst).mockResolvedValue({
      id: 'rc-1',
      userId: user.id,
      code: 'ABCD1234',
      usedAt: null,
    } as any);

    await callVerify2fa({
      recoveryCode: 'ABCD1234',
      mfaToken: 'valid-mfa-token',
    });

    expect((prisma as any).recoveryCode.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'rc-1' },
        data: expect.objectContaining({
          usedAt: expect.any(Date),
        }),
      }),
    );
  });

  it('returns 401 for already-used recovery code', async () => {
    const user = mockUserWithMfa();

    vi.mocked(prisma.user.findUnique).mockResolvedValue(user as any);

    // Recovery code already used
    vi.mocked((prisma as any).recoveryCode.findFirst).mockResolvedValue(null);

    const res = await callVerify2fa({
      recoveryCode: 'USED1234',
      mfaToken: 'valid-mfa-token',
    });

    expect(res.status).toBe(401);
  });

  it('returns 422 for missing both code and recoveryCode', async () => {
    const res = await callVerify2fa({
      mfaToken: 'valid-mfa-token',
    });

    expect(res.status).toBe(422);
  });
});
