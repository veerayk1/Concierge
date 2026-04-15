/**
 * Comprehensive Auth Flow Tests
 *
 * Tests the complete authentication lifecycle including login, token refresh,
 * logout, 2FA verification, and password reset flows. Covers success paths,
 * failure paths, and edge cases for all auth endpoints.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createPostRequest, parseResponse } from '@/test/helpers/api';
import { createUser } from '@/test/factories/user';

// ---------------------------------------------------------------------------
// Prisma Mock
// ---------------------------------------------------------------------------

const mockUserFindUnique = vi.fn();
const mockUserUpdate = vi.fn();
const mockLoginAuditCreate = vi.fn();
const mockRefreshTokenCreate = vi.fn();
const mockRefreshTokenFindUnique = vi.fn();
const mockRefreshTokenUpdate = vi.fn();
const mockRefreshTokenUpdateMany = vi.fn();
const mockSessionCreate = vi.fn();
const mockSessionFindFirst = vi.fn();
const mockSessionUpdateMany = vi.fn();
const mockPasswordResetTokenCount = vi.fn();
const mockPasswordResetTokenCreate = vi.fn();
const mockPasswordResetTokenFindUnique = vi.fn();
const mockPasswordResetTokenUpdate = vi.fn();
const mockPasswordHistoryFindMany = vi.fn();
const mockPasswordHistoryCreate = vi.fn();
const mockRecoveryCodeFindFirst = vi.fn();
const mockRecoveryCodeUpdate = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
      update: (...args: unknown[]) => mockUserUpdate(...args),
    },
    loginAudit: {
      create: (...args: unknown[]) => mockLoginAuditCreate(...args),
    },
    refreshToken: {
      create: (...args: unknown[]) => mockRefreshTokenCreate(...args),
      findUnique: (...args: unknown[]) => mockRefreshTokenFindUnique(...args),
      update: (...args: unknown[]) => mockRefreshTokenUpdate(...args),
      updateMany: (...args: unknown[]) => mockRefreshTokenUpdateMany(...args),
    },
    session: {
      create: (...args: unknown[]) => mockSessionCreate(...args),
      findFirst: (...args: unknown[]) => mockSessionFindFirst(...args),
      updateMany: (...args: unknown[]) => mockSessionUpdateMany(...args),
    },
    passwordResetToken: {
      count: (...args: unknown[]) => mockPasswordResetTokenCount(...args),
      create: (...args: unknown[]) => mockPasswordResetTokenCreate(...args),
      findUnique: (...args: unknown[]) => mockPasswordResetTokenFindUnique(...args),
      update: (...args: unknown[]) => mockPasswordResetTokenUpdate(...args),
    },
    passwordHistory: {
      findMany: (...args: unknown[]) => mockPasswordHistoryFindMany(...args),
      create: (...args: unknown[]) => mockPasswordHistoryCreate(...args),
    },
    recoveryCode: {
      findFirst: (...args: unknown[]) => mockRecoveryCodeFindFirst(...args),
      update: (...args: unknown[]) => mockRecoveryCodeUpdate(...args),
    },
  },
}));

vi.mock('@/server/auth/password', () => ({
  verifyPassword: vi.fn(),
  hashPassword: vi.fn().mockResolvedValue('$argon2id$v=19$m=65536,t=3,p=4$newhashedpassword'),
}));

vi.mock('@/server/auth/jwt', () => ({
  signAccessToken: vi.fn().mockResolvedValue('mock-access-token'),
  generateRefreshToken: vi.fn().mockReturnValue('mock-refresh-token'),
  verifyAccessToken: vi.fn().mockResolvedValue({
    sub: 'user-001',
    pid: 'prop-001',
    role: 'front_desk',
    perms: [],
    mfa: false,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 900,
  }),
  initializeKeys: vi.fn(),
}));

vi.mock('@/server/auth/session', () => ({
  createSession: vi.fn().mockResolvedValue({
    id: 'session-001',
    userId: 'user-001',
    deviceFingerprint: 'mock-fp',
    ipAddress: '127.0.0.1',
    userAgent: 'test',
    lastActiveAt: new Date(),
    expiresAt: new Date(Date.now() + 86400000),
    createdAt: new Date(),
  }),
  generateDeviceFingerprint: vi.fn().mockReturnValue('mock-fingerprint'),
  validateSession: vi.fn(),
  revokeAllUserSessions: vi.fn(),
}));

vi.mock('@/server/auth/totp', () => ({
  verifyTotpCode: vi.fn(),
}));

vi.mock('@/server/email', () => ({
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/server/middleware/rate-limit', () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ remaining: 10, limit: 10 }),
}));

// ---------------------------------------------------------------------------
// Import route handlers AFTER mocks
// ---------------------------------------------------------------------------

import { POST as loginHandler } from '@/app/api/auth/login/route';
import { POST as refreshHandler } from '@/app/api/auth/refresh/route';
import { POST as logoutHandler } from '@/app/api/auth/logout/route';
import { POST as verify2faHandler } from '@/app/api/auth/verify-2fa/route';
import { POST as forgotPasswordHandler } from '@/app/api/auth/forgot-password/route';
import { POST as resetPasswordHandler } from '@/app/api/auth/reset-password/route';

import { verifyPassword } from '@/server/auth/password';
import { verifyTotpCode } from '@/server/auth/totp';
import { revokeAllUserSessions } from '@/server/auth/session';
import { sendPasswordResetEmail } from '@/server/email';

// ---------------------------------------------------------------------------
// Constants & Helpers
// ---------------------------------------------------------------------------

const PROPERTY_ID = '550e8400-e29b-41d4-a716-446655440010';

function mockActiveUser(overrides: Record<string, unknown> = {}) {
  const user = createUser({
    email: 'test@example.com',
    isActive: true,
    mfaEnabled: false,
    ...overrides,
  });
  return {
    ...user,
    failedLoginAttempts: 0,
    lockedUntil: null,
    userProperties: [
      {
        role: { slug: 'front_desk', permissions: ['event:create', 'event:read'] },
        propertyId: PROPERTY_ID,
      },
    ],
    ...overrides,
  };
}

function createLoginRequest(email: string, password: string) {
  return createPostRequest('/api/auth/login', { email, password });
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

// ===========================================================================
// 1. Login with valid credentials returns tokens
// ===========================================================================

describe('Auth Comprehensive: Login with valid credentials returns tokens', () => {
  it('returns accessToken and refreshToken on valid login', async () => {
    const user = mockActiveUser();
    mockUserFindUnique.mockResolvedValue(user);
    vi.mocked(verifyPassword).mockResolvedValue({ valid: true, needsRehash: false });
    mockUserUpdate.mockResolvedValue(user);

    const res = await loginHandler(createLoginRequest('test@example.com', 'ValidPassword123!'));

    expect(res.status).toBe(200);
    const body = await parseResponse(res);
    const data = (body as Record<string, unknown>).data as Record<string, unknown>;
    expect(data).toHaveProperty('accessToken');
    expect(data).toHaveProperty('refreshToken');
    expect(data.accessToken).toBe('mock-access-token');
    expect(data.refreshToken).toBe('mock-refresh-token');
  });

  it('includes user info (email, role) in login response', async () => {
    const user = mockActiveUser();
    mockUserFindUnique.mockResolvedValue(user);
    vi.mocked(verifyPassword).mockResolvedValue({ valid: true, needsRehash: false });
    mockUserUpdate.mockResolvedValue(user);

    const res = await loginHandler(createLoginRequest('test@example.com', 'ValidPassword123!'));
    const body = await parseResponse(res);
    const data = (body as Record<string, unknown>).data as Record<string, unknown>;
    const userData = data.user as Record<string, unknown>;

    expect(userData.email).toBe('test@example.com');
    expect(userData.role).toBe('front_desk');
  });

  it('updates lastLoginAt on successful login', async () => {
    const user = mockActiveUser({ failedLoginAttempts: 3 });
    mockUserFindUnique.mockResolvedValue(user);
    vi.mocked(verifyPassword).mockResolvedValue({ valid: true, needsRehash: false });
    mockUserUpdate.mockResolvedValue(user);

    await loginHandler(createLoginRequest('test@example.com', 'ValidPassword123!'));

    expect(mockUserUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          lastLoginAt: expect.any(Date),
        }),
      }),
    );
  });

  it('creates a refresh token in the database', async () => {
    const user = mockActiveUser();
    mockUserFindUnique.mockResolvedValue(user);
    vi.mocked(verifyPassword).mockResolvedValue({ valid: true, needsRehash: false });
    mockUserUpdate.mockResolvedValue(user);

    await loginHandler(createLoginRequest('test@example.com', 'ValidPassword123!'));

    expect(mockRefreshTokenCreate).toHaveBeenCalled();
  });
});

// ===========================================================================
// 2. Login with invalid credentials returns 401
// ===========================================================================

describe('Auth Comprehensive: Login with invalid credentials returns 401', () => {
  it('returns 401 for wrong password', async () => {
    const user = mockActiveUser();
    mockUserFindUnique.mockResolvedValue(user);
    vi.mocked(verifyPassword).mockResolvedValue({ valid: false, needsRehash: false });
    mockUserUpdate.mockResolvedValue(user);

    const res = await loginHandler(createLoginRequest('test@example.com', 'WrongPassword!'));

    expect(res.status).toBe(401);
    const body = await parseResponse(res);
    expect((body as Record<string, unknown>).code).toBe('AUTH_ERROR');
  });

  it('returns 401 for non-existent email (no user enumeration)', async () => {
    mockUserFindUnique.mockResolvedValue(null);

    const res = await loginHandler(createLoginRequest('noone@example.com', 'AnyPassword!'));

    expect(res.status).toBe(401);
    const body = await parseResponse(res);
    expect((body as Record<string, unknown>).code).toBe('AUTH_ERROR');
  });

  it('uses identical error message for non-existent email and wrong password', async () => {
    // Non-existent user
    mockUserFindUnique.mockResolvedValue(null);
    const res1 = await loginHandler(createLoginRequest('noone@example.com', 'AnyPassword!'));
    const body1 = await parseResponse(res1);

    // Wrong password
    const user = mockActiveUser();
    mockUserFindUnique.mockResolvedValue(user);
    vi.mocked(verifyPassword).mockResolvedValue({ valid: false, needsRehash: false });
    mockUserUpdate.mockResolvedValue(user);
    const res2 = await loginHandler(createLoginRequest('test@example.com', 'WrongPassword!'));
    const body2 = await parseResponse(res2);

    expect((body1 as Record<string, unknown>).message).toBe(
      (body2 as Record<string, unknown>).message,
    );
  });

  it('increments failedLoginAttempts on wrong password', async () => {
    const user = mockActiveUser({ failedLoginAttempts: 2 });
    mockUserFindUnique.mockResolvedValue(user);
    vi.mocked(verifyPassword).mockResolvedValue({ valid: false, needsRehash: false });
    mockUserUpdate.mockResolvedValue(user);

    await loginHandler(createLoginRequest('test@example.com', 'WrongPassword!'));

    expect(mockUserUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          failedLoginAttempts: 3,
        }),
      }),
    );
  });

  it('returns 401 for deactivated account', async () => {
    const user = mockActiveUser({ isActive: false });
    mockUserFindUnique.mockResolvedValue(user);

    const res = await loginHandler(createLoginRequest('test@example.com', 'ValidPassword123!'));

    expect(res.status).toBe(401);
  });

  it('returns 423 for locked account', async () => {
    const user = mockActiveUser({
      failedLoginAttempts: 5,
      lockedUntil: new Date(Date.now() + 15 * 60 * 1000),
    });
    mockUserFindUnique.mockResolvedValue(user);

    const res = await loginHandler(createLoginRequest('test@example.com', 'ValidPassword123!'));

    expect(res.status).toBe(423);
    const body = await parseResponse(res);
    expect((body as Record<string, unknown>).code).toBe('ACCOUNT_LOCKED');
  });
});

// ===========================================================================
// 3. Token refresh with valid refresh token
// ===========================================================================

describe('Auth Comprehensive: Token refresh with valid refresh token', () => {
  it('returns new access and refresh tokens', async () => {
    const user = mockActiveUser();
    const storedToken = {
      id: 'rt-001',
      token: 'valid-refresh-token',
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      revokedAt: null,
      replacedByToken: null,
      createdAt: new Date(),
    };

    mockRefreshTokenFindUnique.mockResolvedValue(storedToken);
    mockUserFindUnique.mockResolvedValue(user);
    mockRefreshTokenUpdate.mockResolvedValue({ ...storedToken, revokedAt: new Date() });
    mockRefreshTokenCreate.mockResolvedValue({ id: 'rt-002', token: 'mock-refresh-token' });

    const req = createPostRequest('/api/auth/refresh', { refreshToken: 'valid-refresh-token' });
    const res = await refreshHandler(req);

    expect(res.status).toBe(200);
    const body = await parseResponse(res);
    const data = (body as Record<string, unknown>).data as Record<string, unknown>;
    expect(data).toHaveProperty('accessToken');
    expect(data).toHaveProperty('refreshToken');
  });

  it('rotates the refresh token (revokes old, creates new)', async () => {
    const user = mockActiveUser();
    const storedToken = {
      id: 'rt-001',
      token: 'valid-refresh-token',
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      revokedAt: null,
      replacedByToken: null,
      createdAt: new Date(),
    };

    mockRefreshTokenFindUnique.mockResolvedValue(storedToken);
    mockUserFindUnique.mockResolvedValue(user);
    mockRefreshTokenUpdate.mockResolvedValue({ ...storedToken, revokedAt: new Date() });
    mockRefreshTokenCreate.mockResolvedValue({ id: 'rt-002', token: 'mock-refresh-token' });

    await refreshHandler(
      createPostRequest('/api/auth/refresh', { refreshToken: 'valid-refresh-token' }),
    );

    // Old token revoked
    expect(mockRefreshTokenUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: storedToken.id },
        data: expect.objectContaining({ revokedAt: expect.any(Date) }),
      }),
    );

    // New token created
    expect(mockRefreshTokenCreate).toHaveBeenCalled();
  });
});

// ===========================================================================
// 4. Token refresh with expired token returns 401
// ===========================================================================

describe('Auth Comprehensive: Token refresh with expired token returns 401', () => {
  it('returns 401 for expired refresh token', async () => {
    mockRefreshTokenFindUnique.mockResolvedValue({
      id: 'rt-expired',
      token: 'expired-refresh-token',
      userId: 'user-001',
      expiresAt: new Date(Date.now() - 1000),
      revokedAt: null,
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/auth/refresh', { refreshToken: 'expired-refresh-token' });
    const res = await refreshHandler(req);

    expect(res.status).toBe(401);
    const body = await parseResponse(res);
    expect((body as Record<string, unknown>).message).toContain('expired');
  });

  it('returns 401 for revoked refresh token (replay attack)', async () => {
    mockRefreshTokenFindUnique.mockResolvedValue({
      id: 'rt-revoked',
      token: 'revoked-refresh-token',
      userId: 'user-001',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      revokedAt: new Date(),
      replacedByToken: 'rt-successor',
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/auth/refresh', { refreshToken: 'revoked-refresh-token' });
    const res = await refreshHandler(req);

    expect(res.status).toBe(401);
    const body = await parseResponse(res);
    expect((body as Record<string, unknown>).message).toContain('revoked');
  });

  it('returns 401 for nonexistent refresh token', async () => {
    mockRefreshTokenFindUnique.mockResolvedValue(null);

    const req = createPostRequest('/api/auth/refresh', {
      refreshToken: 'nonexistent-token',
    });
    const res = await refreshHandler(req);

    expect(res.status).toBe(401);
  });
});

// ===========================================================================
// 5. Logout invalidates session
// ===========================================================================

describe('Auth Comprehensive: Logout invalidates session', () => {
  it('revokes all refresh tokens and sessions', async () => {
    mockRefreshTokenUpdateMany.mockResolvedValue({ count: 1 });
    mockSessionUpdateMany.mockResolvedValue({ count: 1 });

    const req = createPostRequest('/api/auth/logout', undefined, {
      headers: { Authorization: 'Bearer mock-access-token' },
    });
    const res = await logoutHandler(req);

    expect(res.status).toBe(200);

    // Refresh tokens revoked
    expect(mockRefreshTokenUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: 'user-001', revokedAt: null }),
        data: expect.objectContaining({ revokedAt: expect.any(Date) }),
      }),
    );

    // Sessions revoked
    expect(mockSessionUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: 'user-001' }),
        data: expect.objectContaining({ revokedAt: expect.any(Date) }),
      }),
    );
  });

  it('returns success message in response', async () => {
    mockRefreshTokenUpdateMany.mockResolvedValue({ count: 1 });
    mockSessionUpdateMany.mockResolvedValue({ count: 1 });

    const req = createPostRequest('/api/auth/logout', undefined, {
      headers: { Authorization: 'Bearer mock-access-token' },
    });
    const res = await logoutHandler(req);
    const body = await parseResponse(res);

    expect(((body as Record<string, unknown>).data as Record<string, unknown>).message).toContain(
      'Logged out',
    );
  });

  it('succeeds even if no active sessions exist', async () => {
    mockRefreshTokenUpdateMany.mockResolvedValue({ count: 0 });
    mockSessionUpdateMany.mockResolvedValue({ count: 0 });

    const req = createPostRequest('/api/auth/logout', undefined, {
      headers: { Authorization: 'Bearer mock-access-token' },
    });
    const res = await logoutHandler(req);

    expect(res.status).toBe(200);
  });
});

// ===========================================================================
// 6. 2FA verification flow
// ===========================================================================

describe('Auth Comprehensive: 2FA verification flow', () => {
  it('login returns mfaRequired=true for MFA-enabled user', async () => {
    const mfaUser = mockActiveUser({ mfaEnabled: true, mfaSecret: 'JBSWY3DPEHPK3PXP' });
    mockUserFindUnique.mockResolvedValue(mfaUser);
    vi.mocked(verifyPassword).mockResolvedValue({ valid: true, needsRehash: false });

    const res = await loginHandler(createLoginRequest('test@example.com', 'ValidPassword123!'));
    expect(res.status).toBe(200);

    const body = await parseResponse(res);
    const data = (body as Record<string, unknown>).data as Record<string, unknown>;
    expect(data.mfaRequired).toBe(true);
    expect(data).toHaveProperty('mfaToken');
    expect(data).not.toHaveProperty('accessToken');
  });

  it('verify-2fa with correct code returns tokens', async () => {
    const mfaUser = mockActiveUser({ mfaEnabled: true, mfaSecret: 'JBSWY3DPEHPK3PXP' });

    // Step 1: Login to get mfaToken
    mockUserFindUnique.mockResolvedValue(mfaUser);
    vi.mocked(verifyPassword).mockResolvedValue({ valid: true, needsRehash: false });
    const loginRes = await loginHandler(
      createLoginRequest('test@example.com', 'ValidPassword123!'),
    );
    const loginBody = await parseResponse(loginRes);
    const mfaToken = ((loginBody as Record<string, unknown>).data as Record<string, unknown>)
      .mfaToken as string;

    // Step 2: Verify 2FA
    mockUserFindUnique.mockResolvedValue(mfaUser);
    vi.mocked(verifyTotpCode).mockResolvedValue(true);
    mockUserUpdate.mockResolvedValue(mfaUser);

    const verifyRes = await verify2faHandler(
      createPostRequest('/api/auth/verify-2fa', { mfaToken, code: '123456' }),
    );

    expect(verifyRes.status).toBe(200);
    const verifyBody = await parseResponse(verifyRes);
    const verifyData = (verifyBody as Record<string, unknown>).data as Record<string, unknown>;
    expect(verifyData).toHaveProperty('accessToken');
    expect(verifyData).toHaveProperty('refreshToken');
  });

  it('verify-2fa with wrong code returns 401', async () => {
    const mfaUser = mockActiveUser({ mfaEnabled: true, mfaSecret: 'JBSWY3DPEHPK3PXP' });

    // Step 1: Login
    mockUserFindUnique.mockResolvedValue(mfaUser);
    vi.mocked(verifyPassword).mockResolvedValue({ valid: true, needsRehash: false });
    const loginRes = await loginHandler(
      createLoginRequest('test@example.com', 'ValidPassword123!'),
    );
    const loginBody = await parseResponse(loginRes);
    const mfaToken = ((loginBody as Record<string, unknown>).data as Record<string, unknown>)
      .mfaToken as string;

    // Step 2: Wrong code
    mockUserFindUnique.mockResolvedValue(mfaUser);
    vi.mocked(verifyTotpCode).mockResolvedValue(false);

    const verifyRes = await verify2faHandler(
      createPostRequest('/api/auth/verify-2fa', { mfaToken, code: '000000' }),
    );

    expect(verifyRes.status).toBe(401);
    const body = await parseResponse(verifyRes);
    expect((body as Record<string, unknown>).code).toBe('AUTH_ERROR');
  });

  it('2FA login creates an audit log entry', async () => {
    const mfaUser = mockActiveUser({ mfaEnabled: true, mfaSecret: 'JBSWY3DPEHPK3PXP' });

    // Login
    mockUserFindUnique.mockResolvedValue(mfaUser);
    vi.mocked(verifyPassword).mockResolvedValue({ valid: true, needsRehash: false });
    const loginRes = await loginHandler(
      createLoginRequest('test@example.com', 'ValidPassword123!'),
    );
    const loginBody = await parseResponse(loginRes);
    const mfaToken = ((loginBody as Record<string, unknown>).data as Record<string, unknown>)
      .mfaToken as string;

    // Verify
    mockUserFindUnique.mockResolvedValue(mfaUser);
    vi.mocked(verifyTotpCode).mockResolvedValue(true);
    mockUserUpdate.mockResolvedValue(mfaUser);

    await verify2faHandler(createPostRequest('/api/auth/verify-2fa', { mfaToken, code: '123456' }));

    expect(mockLoginAuditCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: mfaUser.id,
          success: true,
        }),
      }),
    );
  });
});

// ===========================================================================
// 7. Password reset request sends email
// ===========================================================================

describe('Auth Comprehensive: Password reset request sends email', () => {
  it('sends password reset email for existing user', async () => {
    const user = mockActiveUser();
    mockPasswordResetTokenCount.mockResolvedValue(0);
    mockUserFindUnique.mockResolvedValue(user);
    mockPasswordResetTokenCreate.mockResolvedValue({
      id: 'prt-001',
      token: 'reset-token-uuid',
      userId: user.id,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    const res = await forgotPasswordHandler(
      createPostRequest('/api/auth/forgot-password', { email: 'test@example.com' }),
    );

    expect(res.status).toBe(200);
    expect(sendPasswordResetEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        email: user.email,
        firstName: user.firstName,
        token: expect.any(String),
      }),
    );
  });

  it('returns 200 even for non-existent email (no user enumeration)', async () => {
    mockPasswordResetTokenCount.mockResolvedValue(0);
    mockUserFindUnique.mockResolvedValue(null);

    const res = await forgotPasswordHandler(
      createPostRequest('/api/auth/forgot-password', { email: 'nonexistent@example.com' }),
    );

    // Should return 200 to prevent email enumeration
    expect(res.status).toBe(200);
    // Email should NOT be sent since user does not exist
    expect(sendPasswordResetEmail).not.toHaveBeenCalled();
  });

  it('creates a password reset token in the database', async () => {
    const user = mockActiveUser();
    mockPasswordResetTokenCount.mockResolvedValue(0);
    mockUserFindUnique.mockResolvedValue(user);
    mockPasswordResetTokenCreate.mockResolvedValue({
      id: 'prt-001',
      token: 'reset-token-uuid',
      userId: user.id,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    await forgotPasswordHandler(
      createPostRequest('/api/auth/forgot-password', { email: 'test@example.com' }),
    );

    expect(mockPasswordResetTokenCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: user.id,
          token: expect.any(String),
          expiresAt: expect.any(Date),
        }),
      }),
    );
  });
});

// ===========================================================================
// 8. Password reset with valid token updates password
// ===========================================================================

describe('Auth Comprehensive: Password reset with valid token updates password', () => {
  it('resets password and marks token as used', async () => {
    const user = mockActiveUser();
    mockPasswordResetTokenFindUnique.mockResolvedValue({
      id: 'prt-001',
      token: 'valid-reset-token',
      userId: user.id,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      usedAt: null,
    });
    mockUserFindUnique.mockResolvedValue(user);
    mockPasswordHistoryFindMany.mockResolvedValue([]);
    mockUserUpdate.mockResolvedValue({ ...user, passwordHash: 'new-hash' });
    mockPasswordHistoryCreate.mockResolvedValue({ id: 'ph-001' });
    mockPasswordResetTokenUpdate.mockResolvedValue({ id: 'prt-001', usedAt: new Date() });
    vi.mocked(revokeAllUserSessions).mockResolvedValue(undefined);
    mockRefreshTokenUpdateMany.mockResolvedValue({ count: 0 });

    const res = await resetPasswordHandler(
      createPostRequest('/api/auth/reset-password', {
        token: 'valid-reset-token',
        password: 'NewSecure123!@#Password',
      }),
    );

    expect(res.status).toBe(200);
    const body = await parseResponse(res);
    expect(((body as Record<string, unknown>).data as Record<string, unknown>).message).toContain(
      'reset successfully',
    );

    // Token marked as used
    expect(mockPasswordResetTokenUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ usedAt: expect.any(Date) }),
      }),
    );
  });

  it('revokes all sessions after password reset', async () => {
    const user = mockActiveUser();
    mockPasswordResetTokenFindUnique.mockResolvedValue({
      id: 'prt-001',
      token: 'valid-reset-token',
      userId: user.id,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      usedAt: null,
    });
    mockUserFindUnique.mockResolvedValue(user);
    mockPasswordHistoryFindMany.mockResolvedValue([]);
    mockUserUpdate.mockResolvedValue(user);
    mockPasswordHistoryCreate.mockResolvedValue({ id: 'ph-001' });
    mockPasswordResetTokenUpdate.mockResolvedValue({ id: 'prt-001', usedAt: new Date() });
    vi.mocked(revokeAllUserSessions).mockResolvedValue(undefined);
    mockRefreshTokenUpdateMany.mockResolvedValue({ count: 2 });

    await resetPasswordHandler(
      createPostRequest('/api/auth/reset-password', {
        token: 'valid-reset-token',
        password: 'NewSecure123!@#Password',
      }),
    );

    expect(revokeAllUserSessions).toHaveBeenCalledWith(user.id);
    expect(mockRefreshTokenUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: user.id, revokedAt: null }),
      }),
    );
  });

  it('stores password hash in history', async () => {
    const user = mockActiveUser();
    mockPasswordResetTokenFindUnique.mockResolvedValue({
      id: 'prt-001',
      token: 'valid-reset-token',
      userId: user.id,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      usedAt: null,
    });
    mockUserFindUnique.mockResolvedValue(user);
    mockPasswordHistoryFindMany.mockResolvedValue([]);
    mockUserUpdate.mockResolvedValue(user);
    mockPasswordHistoryCreate.mockResolvedValue({ id: 'ph-001' });
    mockPasswordResetTokenUpdate.mockResolvedValue({ id: 'prt-001', usedAt: new Date() });
    vi.mocked(revokeAllUserSessions).mockResolvedValue(undefined);
    mockRefreshTokenUpdateMany.mockResolvedValue({ count: 0 });

    await resetPasswordHandler(
      createPostRequest('/api/auth/reset-password', {
        token: 'valid-reset-token',
        password: 'NewSecure123!@#Password',
      }),
    );

    expect(mockPasswordHistoryCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ userId: user.id }),
      }),
    );
  });

  it('returns 401 for expired reset token', async () => {
    mockPasswordResetTokenFindUnique.mockResolvedValue({
      id: 'prt-expired',
      token: 'expired-token',
      userId: 'user-001',
      expiresAt: new Date(Date.now() - 1000),
      usedAt: null,
    });

    const res = await resetPasswordHandler(
      createPostRequest('/api/auth/reset-password', {
        token: 'expired-token',
        password: 'NewSecure123!@#Password',
      }),
    );

    expect(res.status).toBe(401);
    const body = await parseResponse(res);
    expect((body as Record<string, unknown>).message).toContain('expired');
  });

  it('returns 401 for already-used reset token', async () => {
    mockPasswordResetTokenFindUnique.mockResolvedValue({
      id: 'prt-used',
      token: 'used-token',
      userId: 'user-001',
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      usedAt: new Date(),
    });

    const res = await resetPasswordHandler(
      createPostRequest('/api/auth/reset-password', {
        token: 'used-token',
        password: 'NewSecure123!@#Password',
      }),
    );

    expect(res.status).toBe(401);
    const body = await parseResponse(res);
    expect((body as Record<string, unknown>).message).toContain('already been used');
  });

  it('returns 401 for nonexistent reset token', async () => {
    mockPasswordResetTokenFindUnique.mockResolvedValue(null);

    const res = await resetPasswordHandler(
      createPostRequest('/api/auth/reset-password', {
        token: 'does-not-exist',
        password: 'NewSecure123!@#Password',
      }),
    );

    expect(res.status).toBe(401);
  });
});
