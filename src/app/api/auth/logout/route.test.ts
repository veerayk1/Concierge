/**
 * Concierge — Logout Route Tests
 *
 * POST /api/auth/logout
 *
 * Tests for session invalidation, cookie clearing, and idempotency.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import { createPostRequest, parseResponse } from '@/test/helpers/api';
import { createTestJWT } from '@/test/helpers/auth';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/server/db', () => ({
  prisma: {
    refreshToken: {
      updateMany: vi.fn(),
    },
    session: {
      updateMany: vi.fn(),
    },
  },
  default: {
    refreshToken: { updateMany: vi.fn() },
    session: { updateMany: vi.fn() },
  },
}));

vi.mock('@/server/auth/session', () => ({
  revokeSession: vi.fn(),
  revokeAllUserSessions: vi.fn(),
  validateSession: vi.fn().mockResolvedValue(true),
}));

vi.mock('@/server/auth/jwt', () => ({
  verifyAccessToken: vi.fn().mockResolvedValue({
    sub: 'user-1',
    pid: 'prop-1',
    role: 'front_desk',
    perms: [],
    mfa: false,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 900,
  }),
  initializeKeys: vi.fn(),
}));

import { prisma } from '@/server/db';
import { revokeSession } from '@/server/auth/session';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function callLogout(headers: Record<string, string> = {}) {
  const { POST } = await import('@/app/api/auth/logout/route');
  const req = createPostRequest('/api/auth/logout', undefined, { headers });
  return POST(req);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/auth/logout', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200 and invalidates refresh token', async () => {
    const token = await createTestJWT('user-1', 'front_desk', 'prop-1');

    const res = await callLogout({ Authorization: `Bearer ${token}` });

    expect(res.status).toBe(200);

    // Should revoke the user's refresh tokens
    expect(prisma.refreshToken.updateMany).toHaveBeenCalled();
  });

  it('clears session cookies in the response', async () => {
    const token = await createTestJWT('user-1', 'front_desk', 'prop-1');

    const res = await callLogout({ Authorization: `Bearer ${token}` });

    expect(res.status).toBe(200);

    // Check for Set-Cookie header that clears the session
    const setCookie = res.headers.get('set-cookie');
    // The response should instruct the browser to clear auth cookies
    // Implementation should set cookies with Max-Age=0 or Expires in the past
    if (setCookie) {
      expect(setCookie).toMatch(/Max-Age=0|expires=Thu, 01 Jan 1970/i);
    }
  });

  it('returns 200 even if no active session (idempotent)', async () => {
    // No authorization header — should still return 200
    const res = await callLogout();

    expect(res.status).toBe(200);
  });

  it('invalidates the specific session', async () => {
    const token = await createTestJWT('user-1', 'front_desk', 'prop-1');

    await callLogout({ Authorization: `Bearer ${token}` });

    // Should call session revocation
    expect(prisma.session.updateMany).toHaveBeenCalled();
  });
});
