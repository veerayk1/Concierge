/**
 * Concierge — Forgot Password Route Tests
 *
 * POST /api/auth/forgot-password
 *
 * Tests for password reset email dispatch, email enumeration prevention,
 * rate limiting, and token expiry.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import { createPostRequest, parseResponse } from '@/test/helpers/api';
import { createUser } from '@/test/factories/user';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/server/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
    },
    passwordResetToken: {
      create: vi.fn(),
      count: vi.fn(),
    },
  },
  default: {
    user: { findUnique: vi.fn() },
    passwordResetToken: { create: vi.fn(), count: vi.fn() },
  },
}));

const mockSendEmail = vi.fn().mockResolvedValue(undefined);
vi.mock('@/server/email', () => ({
  sendPasswordResetEmail: mockSendEmail,
}));

import { prisma } from '@/server/db';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function callForgotPassword(body: Record<string, unknown>) {
  const { POST } = await import('@/app/api/auth/forgot-password/route');
  const req = createPostRequest('/api/auth/forgot-password', body);
  return POST(req);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/auth/forgot-password', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.passwordResetToken.count).mockResolvedValue(0);
  });

  it('returns 200 and sends email for valid existing email', async () => {
    const user = createUser({ email: 'exists@example.com', isActive: true });
    vi.mocked(prisma.user.findUnique).mockResolvedValue(user as any);

    const res = await callForgotPassword({ email: 'exists@example.com' });

    expect(res.status).toBe(200);
    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'exists@example.com',
      }),
    );
  });

  it('returns 200 even for non-existent email (no enumeration)', async () => {
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const res = await callForgotPassword({ email: 'nobody@example.com' });

    expect(res.status).toBe(200);
    // Should NOT send an email for non-existent user
    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('response body is identical for existing and non-existing emails', async () => {
    // Existing email
    const user = createUser({ email: 'real@example.com', isActive: true });
    vi.mocked(prisma.user.findUnique).mockResolvedValue(user as any);
    const res1 = await callForgotPassword({ email: 'real@example.com' });
    const body1 = await parseResponse(res1);

    vi.clearAllMocks();
    vi.mocked(prisma.passwordResetToken.count).mockResolvedValue(0);

    // Non-existing email
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);
    const res2 = await callForgotPassword({ email: 'fake@example.com' });
    const body2 = await parseResponse(res2);

    // Same status
    expect(res1.status).toBe(res2.status);
    // Same response structure (message should be generic)
    expect((body1 as any).data?.message ?? (body1 as any).message).toBe(
      (body2 as any).data?.message ?? (body2 as any).message,
    );
  });

  it('returns 429 when rate limited (3 per hour for same email)', async () => {
    // Simulate 3 existing tokens within the last hour
    vi.mocked(prisma.passwordResetToken.count).mockResolvedValue(3);
    vi.mocked(prisma.user.findUnique).mockResolvedValue(
      createUser({ email: 'spam@example.com', isActive: true }) as any,
    );

    const res = await callForgotPassword({ email: 'spam@example.com' });

    expect(res.status).toBe(429);
  });

  it('creates a reset token that expires after 1 hour', async () => {
    const user = createUser({ email: 'token-test@example.com', isActive: true });
    vi.mocked(prisma.user.findUnique).mockResolvedValue(user as any);

    await callForgotPassword({ email: 'token-test@example.com' });

    expect(prisma.passwordResetToken.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: user.id,
          expiresAt: expect.any(Date),
        }),
      }),
    );

    // Verify expiry is approximately 1 hour from now
    const createCall = vi.mocked(prisma.passwordResetToken.create).mock.calls[0]?.[0];
    if (createCall) {
      const expiresAt = (createCall as any).data.expiresAt as Date;
      const oneHourFromNow = Date.now() + 60 * 60 * 1000;
      expect(Math.abs(expiresAt.getTime() - oneHourFromNow)).toBeLessThan(5000);
    }
  });

  it('returns 422 for invalid email format', async () => {
    const res = await callForgotPassword({ email: 'not-an-email' });

    expect(res.status).toBe(422);
  });

  it('returns 422 for missing email', async () => {
    const res = await callForgotPassword({});

    expect(res.status).toBe(422);
  });

  it('does not send email for inactive/deactivated user', async () => {
    const user = createUser({ email: 'inactive@example.com', isActive: false });
    vi.mocked(prisma.user.findUnique).mockResolvedValue(user as any);

    const res = await callForgotPassword({ email: 'inactive@example.com' });

    // Still returns 200 (no enumeration)
    expect(res.status).toBe(200);
    // But should not send email
    expect(mockSendEmail).not.toHaveBeenCalled();
  });
});
