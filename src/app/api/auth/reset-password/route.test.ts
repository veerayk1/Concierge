/**
 * Concierge — Reset Password Route Tests
 *
 * POST /api/auth/reset-password
 *
 * Tests for token validation, password strength enforcement,
 * session invalidation, and password history.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import { createPostRequest, parseResponse } from '@/test/helpers/api';
import { createUser } from '@/test/factories/user';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/server/db', () => ({
  prisma: {
    passwordResetToken: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    passwordHistory: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
    session: {
      updateMany: vi.fn(),
    },
    refreshToken: {
      updateMany: vi.fn(),
    },
  },
  default: {
    passwordResetToken: { findUnique: vi.fn(), update: vi.fn() },
    user: { findUnique: vi.fn(), update: vi.fn() },
    passwordHistory: { create: vi.fn(), findMany: vi.fn() },
    session: { updateMany: vi.fn() },
    refreshToken: { updateMany: vi.fn() },
  },
}));

vi.mock('@/server/auth/password', () => ({
  hashPassword: vi.fn().mockResolvedValue('$argon2id$v=19$new-hash'),
  verifyPassword: vi.fn(),
}));

vi.mock('@/server/auth/session', () => ({
  revokeAllUserSessions: vi.fn(),
}));

import { prisma } from '@/server/db';
import { hashPassword, verifyPassword } from '@/server/auth/password';
import { revokeAllUserSessions } from '@/server/auth/session';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function callResetPassword(body: Record<string, unknown>) {
  const { POST } = await import('@/app/api/auth/reset-password/route');
  const req = createPostRequest('/api/auth/reset-password', body);
  return POST(req);
}

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const STRONG_PASSWORD = 'NewStr0ng!Password99';

function mockValidResetToken(userId: string) {
  return {
    id: 'prt-1',
    token: 'valid-reset-token',
    userId,
    expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 min remaining
    usedAt: null,
    createdAt: new Date(),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/auth/reset-password', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.passwordHistory.findMany).mockResolvedValue([]);
  });

  it('returns 200 for valid token + strong password', async () => {
    const user = createUser({ isActive: true });
    const resetToken = mockValidResetToken(user.id);

    vi.mocked(prisma.passwordResetToken.findUnique).mockResolvedValue(resetToken as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(user as any);

    const res = await callResetPassword({
      token: 'valid-reset-token',
      password: STRONG_PASSWORD,
    });

    expect(res.status).toBe(200);
  });

  it('updates the user password hash', async () => {
    const user = createUser({ isActive: true });
    const resetToken = mockValidResetToken(user.id);

    vi.mocked(prisma.passwordResetToken.findUnique).mockResolvedValue(resetToken as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(user as any);

    await callResetPassword({
      token: 'valid-reset-token',
      password: STRONG_PASSWORD,
    });

    expect(hashPassword).toHaveBeenCalledWith(STRONG_PASSWORD);
    expect(prisma.user.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: user.id },
        data: expect.objectContaining({
          passwordHash: expect.any(String),
        }),
      }),
    );
  });

  it('returns 401 for invalid/non-existent token', async () => {
    vi.mocked(prisma.passwordResetToken.findUnique).mockResolvedValue(null);

    const res = await callResetPassword({
      token: 'invalid-token',
      password: STRONG_PASSWORD,
    });

    expect(res.status).toBe(401);
  });

  it('returns 401 for expired token', async () => {
    const user = createUser({ isActive: true });
    const expiredToken = {
      ...mockValidResetToken(user.id),
      expiresAt: new Date(Date.now() - 1000), // expired
    };

    vi.mocked(prisma.passwordResetToken.findUnique).mockResolvedValue(expiredToken as any);

    const res = await callResetPassword({
      token: 'expired-token',
      password: STRONG_PASSWORD,
    });

    expect(res.status).toBe(401);
  });

  it('returns 401 for already-used token', async () => {
    const user = createUser({ isActive: true });
    const usedToken = {
      ...mockValidResetToken(user.id),
      usedAt: new Date(), // already used
    };

    vi.mocked(prisma.passwordResetToken.findUnique).mockResolvedValue(usedToken as any);

    const res = await callResetPassword({
      token: 'used-token',
      password: STRONG_PASSWORD,
    });

    expect(res.status).toBe(401);
  });

  it('returns 422 for weak password (too short)', async () => {
    const res = await callResetPassword({
      token: 'valid-token',
      password: 'short',
    });

    expect(res.status).toBe(422);
  });

  it('returns 422 for password without special character', async () => {
    const res = await callResetPassword({
      token: 'valid-token',
      password: 'NoSpecialChars123A',
    });

    expect(res.status).toBe(422);
  });

  it('invalidates all existing sessions after password change', async () => {
    const user = createUser({ isActive: true });
    const resetToken = mockValidResetToken(user.id);

    vi.mocked(prisma.passwordResetToken.findUnique).mockResolvedValue(resetToken as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(user as any);

    await callResetPassword({
      token: 'valid-reset-token',
      password: STRONG_PASSWORD,
    });

    // All sessions should be revoked
    expect(revokeAllUserSessions).toHaveBeenCalledWith(user.id);

    // All refresh tokens should be invalidated
    expect(prisma.refreshToken.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ userId: user.id }),
      }),
    );
  });

  it('stores password in history to prevent reuse', async () => {
    const user = createUser({ isActive: true });
    const resetToken = mockValidResetToken(user.id);

    vi.mocked(prisma.passwordResetToken.findUnique).mockResolvedValue(resetToken as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(user as any);

    await callResetPassword({
      token: 'valid-reset-token',
      password: STRONG_PASSWORD,
    });

    expect(prisma.passwordHistory.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: user.id,
          passwordHash: expect.any(String),
        }),
      }),
    );
  });

  it('rejects password that matches recent history (password reuse prevention)', async () => {
    const user = createUser({ isActive: true });
    const resetToken = mockValidResetToken(user.id);

    vi.mocked(prisma.passwordResetToken.findUnique).mockResolvedValue(resetToken as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(user as any);

    // Simulate password history containing the same password
    vi.mocked(prisma.passwordHistory.findMany).mockResolvedValue([
      { id: 'ph-1', userId: user.id, passwordHash: 'old-hash-1', createdAt: new Date() },
      { id: 'ph-2', userId: user.id, passwordHash: 'old-hash-2', createdAt: new Date() },
    ] as any);

    // verifyPassword returns true for one of the history entries
    vi.mocked(verifyPassword).mockResolvedValueOnce({ valid: true, needsRehash: false }); // matches history

    const res = await callResetPassword({
      token: 'valid-reset-token',
      password: STRONG_PASSWORD,
    });

    // Should reject with 422 for password reuse
    expect(res.status).toBe(422);
  });

  it('marks the reset token as used after successful reset', async () => {
    const user = createUser({ isActive: true });
    const resetToken = mockValidResetToken(user.id);

    vi.mocked(prisma.passwordResetToken.findUnique).mockResolvedValue(resetToken as any);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(user as any);

    await callResetPassword({
      token: 'valid-reset-token',
      password: STRONG_PASSWORD,
    });

    expect(prisma.passwordResetToken.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: resetToken.id },
        data: expect.objectContaining({
          usedAt: expect.any(Date),
        }),
      }),
    );
  });
});
