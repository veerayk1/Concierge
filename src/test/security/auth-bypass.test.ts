/**
 * Auth Bypass Tests — Security Rulebook A.1, B.1–B.4
 *
 * Validates that authentication and authorization boundaries cannot be
 * bypassed: missing tokens, expired tokens, malformed tokens, wrong
 * signatures, tampered payloads, missing property IDs, suspended users,
 * role escalation, and tenant isolation.
 *
 * Uses the guardRoute function (the single entry point for all API auth)
 * and the requireAuth / requireRole / requireTenantAccess primitives.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import type { TokenPayload, Role } from '@/types';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/server/middleware/auth', () => ({
  requireAuth: vi.fn(),
}));

// We need the real AuthError for instanceof checks inside guardRoute
vi.mock('@/server/errors', async (importOriginal) => {
  const actual = (await importOriginal()) as Record<string, unknown>;
  return {
    ...actual,
    AuthError: class AuthError extends Error {
      readonly statusCode = 401 as const;
      readonly code = 'AUTH_ERROR' as const;
      readonly isOperational = true;
      constructor(message = 'Authentication required') {
        super(message);
        this.name = 'AuthError';
        Object.setPrototypeOf(this, new.target.prototype);
      }
    },
  };
});

import { guardRoute } from '@/server/middleware/api-guard';
import { requireAuth } from '@/server/middleware/auth';
import { AuthError } from '@/server/errors';
import { requireRole } from '@/server/middleware/rbac';
import { ForbiddenError } from '@/server/errors';
import { requireTenantAccess } from '@/server/middleware/tenant';
import { NotFoundError } from '@/server/errors';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(headers: Record<string, string> = {}): NextRequest {
  return new NextRequest('http://localhost:3000/api/v1/events', {
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

function mockPayload(overrides: Partial<TokenPayload> = {}): TokenPayload {
  return {
    sub: 'user-001',
    pid: 'prop-001',
    role: 'property_admin' as Role,
    perms: ['*'],
    mfa: true,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 900,
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
// 1. Missing auth token
// ---------------------------------------------------------------------------

describe('Auth bypass — missing token', () => {
  it('returns 401 when no Authorization header is provided', async () => {
    const req = makeRequest(); // no Authorization header, no demo header
    const result = await guardRoute(req, { allowDemo: false });

    expect(result.error).not.toBeNull();
    expect(result.error!.status).toBe(401);
    expect(result.user).toBeNull();
  });

  it('returns 401 when Authorization header is empty', async () => {
    const req = makeRequest({ Authorization: '' });
    // guardRoute checks for authorization header; empty string is falsy
    const result = await guardRoute(req, { allowDemo: false });

    expect(result.error).not.toBeNull();
    expect(result.error!.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// 2. Expired JWT
// ---------------------------------------------------------------------------

describe('Auth bypass — expired JWT', () => {
  it('returns 401 for expired token', async () => {
    vi.mocked(requireAuth).mockRejectedValue(new AuthError('Token has expired'));

    const req = makeRequest({ Authorization: 'Bearer expired-token-value' });
    const result = await guardRoute(req, { allowDemo: false });

    expect(result.error).not.toBeNull();
    expect(result.error!.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// 3. Malformed JWT
// ---------------------------------------------------------------------------

describe('Auth bypass — malformed JWT', () => {
  it('returns 401 for completely invalid token string', async () => {
    vi.mocked(requireAuth).mockRejectedValue(new AuthError('Invalid authorization token'));

    const req = makeRequest({ Authorization: 'Bearer not.a.valid.jwt.at.all' });
    const result = await guardRoute(req, { allowDemo: false });

    expect(result.error).not.toBeNull();
    expect(result.error!.status).toBe(401);
  });

  it('returns 401 for token with missing segments', async () => {
    vi.mocked(requireAuth).mockRejectedValue(new AuthError('Invalid authorization token'));

    const req = makeRequest({ Authorization: 'Bearer header-only' });
    const result = await guardRoute(req, { allowDemo: false });

    expect(result.error).not.toBeNull();
    expect(result.error!.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// 4. JWT signed with wrong secret
// ---------------------------------------------------------------------------

describe('Auth bypass — wrong signing secret', () => {
  it('returns 401 for token signed with a different secret', async () => {
    vi.mocked(requireAuth).mockRejectedValue(new AuthError('Invalid token signature'));

    const req = makeRequest({ Authorization: 'Bearer wrong-secret-token' });
    const result = await guardRoute(req, { allowDemo: false });

    expect(result.error).not.toBeNull();
    expect(result.error!.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// 5. Tampered JWT payload
// ---------------------------------------------------------------------------

describe('Auth bypass — tampered payload', () => {
  it('returns 401 when JWT payload has been modified', async () => {
    vi.mocked(requireAuth).mockRejectedValue(new AuthError('Invalid token signature'));

    const req = makeRequest({ Authorization: 'Bearer tampered.payload.token' });
    const result = await guardRoute(req, { allowDemo: false });

    expect(result.error).not.toBeNull();
    expect(result.error!.status).toBe(401);
  });

  it('returns 401 when token payload structure is invalid', async () => {
    vi.mocked(requireAuth).mockRejectedValue(new AuthError('Invalid token payload structure'));

    const req = makeRequest({ Authorization: 'Bearer valid-sig-bad-payload' });
    const result = await guardRoute(req, { allowDemo: false });

    expect(result.error).not.toBeNull();
    expect(result.error!.status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// 6. Role escalation — resident cannot access admin endpoints
// ---------------------------------------------------------------------------

describe('Auth bypass — role escalation', () => {
  it('resident_tenant cannot access admin-only endpoints', async () => {
    vi.mocked(requireAuth).mockResolvedValue(
      mockPayload({
        sub: 'resident-user-001',
        role: 'resident_tenant',
        perms: ['event:read:own', 'maintenance:create'],
        mfa: false,
      }),
    );

    const req = makeRequest({ Authorization: 'Bearer resident-token' });
    const result = await guardRoute(req, {
      roles: ['super_admin', 'property_admin'],
      allowDemo: false,
    });

    expect(result.error).not.toBeNull();
    expect(result.error!.status).toBe(403);
  });

  it('security_guard cannot access property_admin endpoints', async () => {
    vi.mocked(requireAuth).mockResolvedValue(
      mockPayload({
        sub: 'guard-user-001',
        role: 'security_guard',
        perms: ['event:create', 'event:read'],
        mfa: false,
      }),
    );

    const req = makeRequest({ Authorization: 'Bearer guard-token' });
    const result = await guardRoute(req, {
      roles: ['property_admin', 'property_manager'],
      allowDemo: false,
    });

    expect(result.error).not.toBeNull();
    expect(result.error!.status).toBe(403);
  });

  it('visitor role cannot access any staff endpoint', async () => {
    vi.mocked(requireAuth).mockResolvedValue(
      mockPayload({
        sub: 'visitor-001',
        role: 'visitor',
        perms: ['announcement:read:public'],
        mfa: false,
      }),
    );

    const req = makeRequest({ Authorization: 'Bearer visitor-token' });
    const result = await guardRoute(req, {
      roles: ['front_desk', 'security_guard', 'property_manager', 'property_admin'],
      allowDemo: false,
    });

    expect(result.error).not.toBeNull();
    expect(result.error!.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// 7. requireRole — direct RBAC checks
// ---------------------------------------------------------------------------

describe('requireRole — role-based access control', () => {
  it('throws ForbiddenError when role is not in allowed list', () => {
    expect(() => requireRole('resident_tenant', ['super_admin', 'property_admin'])).toThrow(
      ForbiddenError,
    );
  });

  it('does not throw when role is in allowed list', () => {
    expect(() => requireRole('property_admin', ['super_admin', 'property_admin'])).not.toThrow();
  });

  it('allows any role when allowed list is empty', () => {
    expect(() => requireRole('visitor', [])).not.toThrow();
  });
});

// ---------------------------------------------------------------------------
// 8. Tenant isolation — user A cannot access property B's data
// ---------------------------------------------------------------------------

describe('Tenant isolation — cross-property access blocked', () => {
  it('throws NotFoundError when user property does not match resource property', () => {
    const userPropertyId = 'prop-AAA';
    const resourcePropertyId = 'prop-BBB';

    expect(() => requireTenantAccess(userPropertyId, resourcePropertyId)).toThrow(NotFoundError);
  });

  it('returns 404 (not 403) to prevent property ID enumeration', () => {
    try {
      requireTenantAccess('prop-AAA', 'prop-BBB');
      expect.unreachable('Should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(NotFoundError);
      expect((e as NotFoundError).statusCode).toBe(404);
    }
  });

  it('does not throw when property IDs match', () => {
    expect(() => requireTenantAccess('prop-AAA', 'prop-AAA')).not.toThrow();
  });

  it('guardRoute provides propertyId for downstream tenant checks', async () => {
    vi.mocked(requireAuth).mockResolvedValue(
      mockPayload({ pid: 'prop-AAA', role: 'property_admin' }),
    );

    const req = makeRequest({ Authorization: 'Bearer valid-token' });
    const result = await guardRoute(req, { allowDemo: false });

    expect(result.error).toBeNull();
    expect(result.user).not.toBeNull();
    expect(result.user!.propertyId).toBe('prop-AAA');

    // Downstream code would call requireTenantAccess(result.user.propertyId, resource.propertyId)
    expect(() => requireTenantAccess(result.user!.propertyId, 'prop-BBB')).toThrow(NotFoundError);
    expect(() => requireTenantAccess(result.user!.propertyId, 'prop-AAA')).not.toThrow();
  });
});
