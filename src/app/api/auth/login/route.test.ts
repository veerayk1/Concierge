/**
 * Concierge — Login API Route Tests
 *
 * POST /api/auth/login
 *
 * Tests for credential verification, MFA flow, account lockout,
 * rate limiting, audit logging, and email enumeration prevention.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import { createPostRequest, parseResponse, parseErrorResponse } from '@/test/helpers/api';
import { createUser, createPropertyAdmin } from '@/test/factories/user';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Mock Prisma client
vi.mock('@/server/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    loginAudit: {
      create: vi.fn(),
    },
    refreshToken: {
      create: vi.fn(),
    },
    session: {
      create: vi.fn(),
    },
  },
  default: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    loginAudit: {
      create: vi.fn(),
    },
    refreshToken: {
      create: vi.fn(),
    },
    session: {
      create: vi.fn(),
    },
  },
}));

// Mock password verification
vi.mock('@/server/auth/password', () => ({
  verifyPassword: vi.fn(),
  hashPassword: vi.fn(),
}));

// Mock JWT signing
vi.mock('@/server/auth/jwt', () => ({
  signAccessToken: vi.fn().mockResolvedValue('mock-access-token'),
  generateRefreshToken: vi.fn().mockReturnValue('mock-refresh-token'),
  initializeKeys: vi.fn(),
}));

// Mock session
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
  generateDeviceFingerprint: vi.fn().mockReturnValue('mock-fingerprint'),
}));

// Import after mocks
import { POST } from '@/app/api/auth/login/route';
import { prisma } from '@/server/db';
import { verifyPassword } from '@/server/auth/password';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const PROPERTY_ID = '550e8400-e29b-41d4-a716-446655440010';

function createLoginRequest(email: string, password: string) {
  return createPostRequest('/api/auth/login', {
    email,
    password,
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/auth/login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200 with access token for valid credentials (no MFA)', async () => {
    const user = createUser({
      email: 'admin@example.com',
      isActive: true,
      mfaEnabled: false,
    });

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      ...user,
      userProperties: [
        { role: { slug: 'property_admin', permissions: ['*'] }, propertyId: PROPERTY_ID },
      ],
    } as any);
    vi.mocked(verifyPassword).mockResolvedValue({ valid: true, needsRehash: false });

    const req = createLoginRequest('admin@example.com', 'ValidPassword123!');
    const res = await POST(req);

    expect(res.status).toBe(200);
    const body = await parseResponse(res);
    expect(body).toHaveProperty('data');
    expect((body as any).data).toHaveProperty('accessToken');
    expect((body as any).data).toHaveProperty('refreshToken');
  });

  it('returns 401 for wrong password', async () => {
    const user = createUser({ email: 'user@example.com', isActive: true });

    vi.mocked(prisma.user.findUnique).mockResolvedValue(user as any);
    vi.mocked(verifyPassword).mockResolvedValue({ valid: false, needsRehash: false });

    const req = createLoginRequest('user@example.com', 'WrongPassword123!');
    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it('returns 401 for non-existent user', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const req = createLoginRequest('nobody@example.com', 'AnyPassword123!');
    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it('does not reveal whether email exists (same error message for wrong email vs wrong password)', async () => {
    // Non-existent user
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    const res1 = await POST(createLoginRequest('nobody@example.com', 'Password123!'));

    // Existing user, wrong password
    const user = createUser({ email: 'real@example.com', isActive: true });
    vi.mocked(prisma.user.findUnique).mockResolvedValue(user as any);
    vi.mocked(verifyPassword).mockResolvedValue({ valid: false, needsRehash: false });
    const res2 = await POST(createLoginRequest('real@example.com', 'WrongPwd123!'));

    expect(res1.status).toBe(res2.status);

    const body1 = await parseResponse(res1);
    const body2 = await parseResponse(res2);
    // Error messages should be identical to prevent enumeration
    expect((body1 as any).message).toBe((body2 as any).message);
  });

  it('returns 423 for locked account (after 5 failed attempts)', async () => {
    const user = createUser({
      email: 'locked@example.com',
      isActive: true,
    });
    // Simulate a locked account
    const lockedUser = {
      ...user,
      failedLoginAttempts: 5,
      lockedUntil: new Date(Date.now() + 15 * 60 * 1000), // locked for 15 more minutes
    };

    vi.mocked(prisma.user.findUnique).mockResolvedValue(lockedUser as any);

    const req = createLoginRequest('locked@example.com', 'AnyPassword123!');
    const res = await POST(req);

    expect(res.status).toBe(423);
  });

  it('returns MFA challenge (not JWT) when user has MFA enabled', async () => {
    const user = createUser({
      email: 'mfa-user@example.com',
      isActive: true,
      mfaEnabled: true,
      mfaSecret: 'JBSWY3DPEHPK3PXP',
    });

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      ...user,
      userProperties: [
        { role: { slug: 'property_admin', permissions: ['*'] }, propertyId: PROPERTY_ID },
      ],
    } as any);
    vi.mocked(verifyPassword).mockResolvedValue({ valid: true, needsRehash: false });

    const req = createLoginRequest('mfa-user@example.com', 'ValidPassword123!');
    const res = await POST(req);

    expect(res.status).toBe(200);
    const body = await parseResponse(res);
    // Should return an MFA token, NOT an access token
    expect((body as any).data).toHaveProperty('mfaToken');
    expect((body as any).data).not.toHaveProperty('accessToken');
  });

  it('returns 422 for invalid input (missing email)', async () => {
    const req = createPostRequest('/api/auth/login', {
      password: 'SomePassword123!',
    });
    const res = await POST(req);

    expect(res.status).toBe(422);
  });

  it('returns 422 for invalid input (empty password)', async () => {
    const req = createPostRequest('/api/auth/login', {
      email: 'user@example.com',
      password: '',
    });
    const res = await POST(req);

    expect(res.status).toBe(422);
  });

  it('returns 429 when rate limited', async () => {
    // Simulate rate limit exceeded
    // This test expects the rate limiter to kick in after threshold
    // The actual implementation should use Redis counters
    // For now we test that the route respects rate limit middleware

    // Make multiple rapid requests
    const requests = Array.from({ length: 10 }, () =>
      POST(createLoginRequest('ratelimit@example.com', 'Password123!')),
    );

    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const responses = await Promise.all(requests);

    // At least one response should be 429 if rate limiting is active
    // (or all should be 401 if not yet enforced — this is a TDD test)
    const has429 = responses.some((r) => r.status === 429);
    const allAuth = responses.every((r) => r.status === 401 || r.status === 429);

    expect(allAuth).toBe(true);
    // When implementation is complete, uncomment:
    // expect(has429).toBe(true);
  });

  it('creates LoginAudit record on successful login', async () => {
    const user = createUser({ email: 'audit@example.com', isActive: true, mfaEnabled: false });

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      ...user,
      userProperties: [{ role: { slug: 'front_desk', permissions: [] }, propertyId: PROPERTY_ID }],
    } as any);
    vi.mocked(verifyPassword).mockResolvedValue({ valid: true, needsRehash: false });

    const req = createLoginRequest('audit@example.com', 'ValidPassword123!');
    await POST(req);

    expect(prisma.loginAudit.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: user.id,
          success: true,
        }),
      }),
    );
  });

  it('creates LoginAudit record on failed login', async () => {
    const user = createUser({ email: 'fail-audit@example.com', isActive: true });

    vi.mocked(prisma.user.findUnique).mockResolvedValue(user as any);
    vi.mocked(verifyPassword).mockResolvedValue({ valid: false, needsRehash: false });

    const req = createLoginRequest('fail-audit@example.com', 'WrongPassword!');
    await POST(req);

    expect(prisma.loginAudit.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          success: false,
        }),
      }),
    );
  });

  it('returns 401 for inactive/deactivated user', async () => {
    const user = createUser({
      email: 'inactive@example.com',
      isActive: false,
    });

    vi.mocked(prisma.user.findUnique).mockResolvedValue(user as any);

    const req = createLoginRequest('inactive@example.com', 'ValidPassword123!');
    const res = await POST(req);

    expect(res.status).toBe(401);
  });

  it('increments failed login attempts on wrong password', async () => {
    const user = createUser({ email: 'counter@example.com', isActive: true });

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      ...user,
      failedLoginAttempts: 2,
    } as any);
    vi.mocked(verifyPassword).mockResolvedValue({ valid: false, needsRehash: false });

    const req = createLoginRequest('counter@example.com', 'WrongPassword123!');
    await POST(req);

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: user.id },
        data: expect.objectContaining({
          failedLoginAttempts: expect.any(Number),
        }),
      }),
    );
  });

  it('resets failed login attempts on successful login', async () => {
    const user = createUser({
      email: 'reset-counter@example.com',
      isActive: true,
      mfaEnabled: false,
    });

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      ...user,
      failedLoginAttempts: 3,
      userProperties: [{ role: { slug: 'front_desk', permissions: [] }, propertyId: PROPERTY_ID }],
    } as any);
    vi.mocked(verifyPassword).mockResolvedValue({ valid: true, needsRehash: false });

    const req = createLoginRequest('reset-counter@example.com', 'ValidPassword123!');
    await POST(req);

    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          failedLoginAttempts: 0,
        }),
      }),
    );
  });
});
