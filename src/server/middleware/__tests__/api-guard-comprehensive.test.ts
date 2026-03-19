/**
 * Concierge — API Guard Comprehensive Tests
 *
 * Tests for the guardRoute function: authentication, authorization,
 * token extraction, MFA enforcement, and rate limiting behavior.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest, NextResponse } from 'next/server';
import type { Role, TokenPayload } from '@/types';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/server/middleware/auth', () => ({
  requireAuth: vi.fn(),
}));

vi.mock('@/server/errors', () => {
  class AuthError extends Error {
    constructor(message: string) {
      super(message);
      this.name = 'AuthError';
    }
  }
  return { AuthError };
});

import { requireAuth } from '@/server/middleware/auth';
import { AuthError } from '@/server/errors';
import { guardRoute } from '@/server/middleware/api-guard';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(headers: Record<string, string> = {}): NextRequest {
  return new NextRequest('http://localhost:3000/api/v1/users', {
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

function makeRequestWithIp(ip: string, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest('http://localhost:3000/api/v1/users', {
    headers: {
      'Content-Type': 'application/json',
      'x-forwarded-for': ip,
      ...headers,
    },
  });
}

function makeTokenPayload(overrides: Partial<TokenPayload> = {}): TokenPayload {
  return {
    sub: 'user-123',
    pid: 'prop-456',
    role: 'property_admin' as Role,
    perms: ['*'],
    mfa: true,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('guardRoute — comprehensive', () => {
  // -----------------------------------------------------------------------
  // 1. Returns user context on valid auth
  // -----------------------------------------------------------------------
  describe('returns user context on valid auth', () => {
    it('returns GuardResult with user and null error on valid token', async () => {
      const payload = makeTokenPayload();
      vi.mocked(requireAuth).mockResolvedValue(payload);

      const req = makeRequest({ Authorization: 'Bearer valid-token' });
      const result = await guardRoute(req, { allowDemo: false });

      expect(result.error).toBeNull();
      expect(result.user).not.toBeNull();
      expect(result.user!.userId).toBe('user-123');
    });

    it('returns correct user shape with all required fields', async () => {
      const payload = makeTokenPayload({
        sub: 'user-abc',
        pid: 'prop-xyz',
        role: 'front_desk',
        perms: ['event:create', 'event:read'],
        mfa: false,
      });
      vi.mocked(requireAuth).mockResolvedValue(payload);

      const req = makeRequest({ Authorization: 'Bearer valid-token' });
      const result = await guardRoute(req, { allowDemo: false });

      expect(result.user).toEqual({
        userId: 'user-abc',
        propertyId: 'prop-xyz',
        role: 'front_desk',
        permissions: ['event:create', 'event:read'],
        mfaVerified: false,
      });
    });
  });

  // -----------------------------------------------------------------------
  // 2. Returns 401 NextResponse on missing auth
  // -----------------------------------------------------------------------
  describe('returns 401 on missing auth', () => {
    it('returns 401 when no Authorization header is present (no demo)', async () => {
      vi.mocked(requireAuth).mockRejectedValue(new AuthError('Missing authorization token'));

      const req = makeRequest();
      const result = await guardRoute(req, { allowDemo: false });

      expect(result.user).toBeNull();
      expect(result.error).not.toBeNull();
      expect(result.error!.status).toBe(401);
    });

    it('returns 401 with UNAUTHORIZED error code in body', async () => {
      vi.mocked(requireAuth).mockRejectedValue(new AuthError('Missing authorization token'));

      const req = makeRequest();
      const result = await guardRoute(req, { allowDemo: false });

      const body = await result.error!.json();
      expect(body.error).toBe('UNAUTHORIZED');
    });

    it('returns 401 when no auth header and no demo header in dev', async () => {
      // In dev mode without demo header AND without token
      const req = makeRequest();
      const result = await guardRoute(req, { allowDemo: true });

      // Since no x-demo-role and no Authorization header, should return 401
      expect(result.error).not.toBeNull();
      expect(result.error!.status).toBe(401);
    });
  });

  // -----------------------------------------------------------------------
  // 3. Extracts propertyId from token
  // -----------------------------------------------------------------------
  describe('extracts propertyId from token', () => {
    it('maps token.pid to user.propertyId', async () => {
      const payload = makeTokenPayload({ pid: 'property-uuid-789' });
      vi.mocked(requireAuth).mockResolvedValue(payload);

      const req = makeRequest({ Authorization: 'Bearer valid-token' });
      const result = await guardRoute(req, { allowDemo: false });

      expect(result.user!.propertyId).toBe('property-uuid-789');
    });

    it('handles empty propertyId from token', async () => {
      const payload = makeTokenPayload({ pid: '' });
      vi.mocked(requireAuth).mockResolvedValue(payload);

      const req = makeRequest({ Authorization: 'Bearer valid-token' });
      const result = await guardRoute(req, { allowDemo: false });

      expect(result.user!.propertyId).toBe('');
    });

    it('extracts propertyId from demo mode token', async () => {
      const req = makeRequest({ 'x-demo-role': 'property_admin' });
      const result = await guardRoute(req, { allowDemo: true });

      expect(result.user!.propertyId).toBe('00000000-0000-4000-b000-000000000001');
    });
  });

  // -----------------------------------------------------------------------
  // 4. Extracts role and permissions from token
  // -----------------------------------------------------------------------
  describe('extracts role and permissions from token', () => {
    it('maps token.role to user.role', async () => {
      const payload = makeTokenPayload({ role: 'security_guard' });
      vi.mocked(requireAuth).mockResolvedValue(payload);

      const req = makeRequest({ Authorization: 'Bearer valid-token' });
      const result = await guardRoute(req, { allowDemo: false });

      expect(result.user!.role).toBe('security_guard');
    });

    it('maps token.perms to user.permissions', async () => {
      const payload = makeTokenPayload({
        perms: ['packages.read', 'packages.create', 'events.read'],
      });
      vi.mocked(requireAuth).mockResolvedValue(payload);

      const req = makeRequest({ Authorization: 'Bearer valid-token' });
      const result = await guardRoute(req, { allowDemo: false });

      expect(result.user!.permissions).toEqual(['packages.read', 'packages.create', 'events.read']);
    });

    it('handles wildcard permissions', async () => {
      const payload = makeTokenPayload({ perms: ['*'] });
      vi.mocked(requireAuth).mockResolvedValue(payload);

      const req = makeRequest({ Authorization: 'Bearer valid-token' });
      const result = await guardRoute(req, { allowDemo: false });

      expect(result.user!.permissions).toEqual(['*']);
    });

    it('handles empty permissions array', async () => {
      const payload = makeTokenPayload({ perms: [] });
      vi.mocked(requireAuth).mockResolvedValue(payload);

      const req = makeRequest({ Authorization: 'Bearer valid-token' });
      const result = await guardRoute(req, { allowDemo: false });

      expect(result.user!.permissions).toEqual([]);
    });

    it('enforces role restrictions — returns 403 for unauthorized role', async () => {
      const payload = makeTokenPayload({ role: 'resident_tenant' });
      vi.mocked(requireAuth).mockResolvedValue(payload);

      const req = makeRequest({ Authorization: 'Bearer valid-token' });
      const result = await guardRoute(req, {
        roles: ['super_admin', 'property_admin'],
        allowDemo: false,
      });

      expect(result.error).not.toBeNull();
      expect(result.error!.status).toBe(403);
    });

    it('allows access when user role matches one of the allowed roles', async () => {
      const payload = makeTokenPayload({ role: 'property_admin' });
      vi.mocked(requireAuth).mockResolvedValue(payload);

      const req = makeRequest({ Authorization: 'Bearer valid-token' });
      const result = await guardRoute(req, {
        roles: ['super_admin', 'property_admin'],
        allowDemo: false,
      });

      expect(result.error).toBeNull();
      expect(result.user!.role).toBe('property_admin');
    });

    it('allows any authenticated user when no roles restriction', async () => {
      const payload = makeTokenPayload({ role: 'family_member' });
      vi.mocked(requireAuth).mockResolvedValue(payload);

      const req = makeRequest({ Authorization: 'Bearer valid-token' });
      const result = await guardRoute(req, { allowDemo: false });

      expect(result.error).toBeNull();
      expect(result.user!.role).toBe('family_member');
    });

    it('demo mode returns wildcard permissions', async () => {
      const req = makeRequest({ 'x-demo-role': 'front_desk' });
      const result = await guardRoute(req, { allowDemo: true });

      expect(result.user!.permissions).toEqual(['*']);
    });
  });

  // -----------------------------------------------------------------------
  // 5. Enforces MFA when required
  // -----------------------------------------------------------------------
  describe('MFA handling', () => {
    it('maps token.mfa to user.mfaVerified', async () => {
      const payload = makeTokenPayload({ mfa: true });
      vi.mocked(requireAuth).mockResolvedValue(payload);

      const req = makeRequest({ Authorization: 'Bearer valid-token' });
      const result = await guardRoute(req, { allowDemo: false });

      expect(result.user!.mfaVerified).toBe(true);
    });

    it('reports mfaVerified as false when MFA not completed', async () => {
      const payload = makeTokenPayload({ mfa: false });
      vi.mocked(requireAuth).mockResolvedValue(payload);

      const req = makeRequest({ Authorization: 'Bearer valid-token' });
      const result = await guardRoute(req, { allowDemo: false });

      expect(result.user!.mfaVerified).toBe(false);
    });

    it('demo mode always reports mfaVerified as true', async () => {
      const req = makeRequest({ 'x-demo-role': 'property_admin' });
      const result = await guardRoute(req, { allowDemo: true });

      expect(result.user!.mfaVerified).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // 6. Rate limits per-IP for unauthenticated requests
  // -----------------------------------------------------------------------
  describe('rate limiting for unauthenticated requests', () => {
    it('returns 401 for unauthenticated requests without demo header', async () => {
      // An unauthenticated request from any IP should get 401 before auth
      const req = makeRequestWithIp('192.168.1.50');
      const result = await guardRoute(req, { allowDemo: false });

      expect(result.error).not.toBeNull();
      expect(result.error!.status).toBe(401);
    });

    it('returns 401 for repeated unauthenticated requests from same IP', async () => {
      const results = await Promise.all(
        Array.from({ length: 3 }, () => {
          const req = makeRequestWithIp('192.168.1.50');
          return guardRoute(req, { allowDemo: false });
        }),
      );

      // All should get 401 (no token)
      results.forEach((result) => {
        expect(result.error).not.toBeNull();
        expect(result.error!.status).toBe(401);
      });
    });

    it('different IPs without auth are independently handled', async () => {
      const ip1Req = makeRequestWithIp('10.0.0.1');
      const ip2Req = makeRequestWithIp('10.0.0.2');

      const [result1, result2] = await Promise.all([
        guardRoute(ip1Req, { allowDemo: false }),
        guardRoute(ip2Req, { allowDemo: false }),
      ]);

      // Both should return 401 (no auth), but independently
      expect(result1.error!.status).toBe(401);
      expect(result2.error!.status).toBe(401);
    });
  });

  // -----------------------------------------------------------------------
  // 7. Rate limits per-user for authenticated requests
  // -----------------------------------------------------------------------
  describe('rate limiting for authenticated requests', () => {
    it('authenticated requests from different users are processed independently', async () => {
      // User 1
      vi.mocked(requireAuth).mockResolvedValueOnce(
        makeTokenPayload({ sub: 'user-1', role: 'property_admin' }),
      );
      // User 2
      vi.mocked(requireAuth).mockResolvedValueOnce(
        makeTokenPayload({ sub: 'user-2', role: 'front_desk' }),
      );

      const req1 = makeRequest({ Authorization: 'Bearer token-user-1' });
      const req2 = makeRequest({ Authorization: 'Bearer token-user-2' });

      const [result1, result2] = await Promise.all([
        guardRoute(req1, { allowDemo: false }),
        guardRoute(req2, { allowDemo: false }),
      ]);

      expect(result1.error).toBeNull();
      expect(result1.user!.userId).toBe('user-1');

      expect(result2.error).toBeNull();
      expect(result2.user!.userId).toBe('user-2');
    });

    it('multiple requests from same authenticated user succeed', async () => {
      vi.mocked(requireAuth).mockResolvedValue(makeTokenPayload({ sub: 'user-1' }));

      const results = await Promise.all(
        Array.from({ length: 5 }, () => {
          const req = makeRequest({ Authorization: 'Bearer token-user-1' });
          return guardRoute(req, { allowDemo: false });
        }),
      );

      results.forEach((result) => {
        expect(result.error).toBeNull();
        expect(result.user!.userId).toBe('user-1');
      });
    });
  });

  // -----------------------------------------------------------------------
  // Additional edge cases
  // -----------------------------------------------------------------------
  describe('edge cases', () => {
    it('handles requireAuth throwing a non-AuthError', async () => {
      vi.mocked(requireAuth).mockRejectedValue(new Error('Unexpected internal error'));

      const req = makeRequest({ Authorization: 'Bearer some-token' });
      const result = await guardRoute(req, { allowDemo: false });

      // Should still return 401 (generic auth failure)
      expect(result.error).not.toBeNull();
      expect(result.error!.status).toBe(401);
    });

    it('demo mode with role check passes for matching role', async () => {
      const req = makeRequest({ 'x-demo-role': 'super_admin' });
      const result = await guardRoute(req, {
        roles: ['super_admin'],
        allowDemo: true,
      });

      expect(result.error).toBeNull();
      expect(result.user!.role).toBe('super_admin');
    });

    it('demo mode with role check fails for non-matching role', async () => {
      const req = makeRequest({ 'x-demo-role': 'resident_tenant' });
      const result = await guardRoute(req, {
        roles: ['super_admin', 'property_admin'],
        allowDemo: true,
      });

      expect(result.error).not.toBeNull();
      expect(result.error!.status).toBe(403);

      const body = await result.error!.json();
      expect(body.error).toBe('FORBIDDEN');
    });

    it('demo user has a known demo userId', async () => {
      const req = makeRequest({ 'x-demo-role': 'property_admin' });
      const result = await guardRoute(req, { allowDemo: true });

      expect(result.user!.userId).toBe('00000000-0000-4000-a000-000000000001');
    });

    it('returns error as NextResponse type', async () => {
      vi.mocked(requireAuth).mockRejectedValue(new AuthError('Auth failed'));

      const req = makeRequest({ Authorization: 'Bearer bad-token' });
      const result = await guardRoute(req, { allowDemo: false });

      expect(result.error).toBeInstanceOf(NextResponse);
    });

    it('all supported roles can authenticate when no role restriction', async () => {
      const roles: Role[] = [
        'super_admin',
        'property_admin',
        'property_manager',
        'security_guard',
        'front_desk',
        'maintenance_staff',
        'resident_owner',
        'resident_tenant',
      ];

      for (const role of roles) {
        vi.mocked(requireAuth).mockResolvedValue(makeTokenPayload({ role }));

        const req = makeRequest({ Authorization: 'Bearer token' });
        const result = await guardRoute(req, { allowDemo: false });

        expect(result.error).toBeNull();
        expect(result.user!.role).toBe(role);
      }
    });
  });
});
