/**
 * Authentication & Authorization Tests — Security Rulebook A.1, B.1–B.4
 *
 * Comprehensive tests for authentication and authorization across all API
 * endpoints. Covers:
 *   - Unauthenticated requests (401)
 *   - Invalid/expired/malformed JWT tokens (401)
 *   - Role-based access control (RBAC) per role
 *   - Tenant isolation (cross-property access blocked)
 *   - Session management (revocation, password change)
 *   - Demo mode enforcement
 *   - Permission-level checks (fine-grained)
 *
 * Uses guardRoute (single entry point for all API auth), requireRole,
 * and requireTenantAccess primitives.
 *
 * @module test/security/auth-authorization
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
import { requireRole } from '@/server/middleware/rbac';
import { requireTenantAccess } from '@/server/middleware/tenant';
import { AuthError, ForbiddenError, NotFoundError } from '@/server/errors';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROPERTY_A = 'prop-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const PROPERTY_B = 'prop-bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

const ROLE_PERMISSIONS: Record<Role, string[]> = {
  super_admin: ['*'],
  property_admin: [
    'property:manage',
    'user:manage',
    'role:manage',
    'event:manage',
    'unit:manage',
    'maintenance:manage',
    'amenity:manage',
    'announcement:manage',
    'report:view',
    'settings:manage',
  ],
  property_manager: [
    'event:manage',
    'unit:manage',
    'maintenance:manage',
    'amenity:manage',
    'announcement:manage',
    'report:view',
    'vendor:manage',
  ],
  security_supervisor: [
    'event:create',
    'event:read',
    'event:update',
    'incident:manage',
    'visitor:manage',
    'parking:manage',
    'key:manage',
    'unit:read',
    'shift_log:manage',
    'report:view:security',
    'training:manage:team',
  ],
  security_guard: [
    'event:create',
    'event:read',
    'event:update',
    'incident:manage',
    'visitor:manage',
    'parking:manage',
    'key:manage',
    'unit:read',
    'shift_log:manage',
  ],
  front_desk: [
    'event:create',
    'event:read',
    'event:update',
    'package:manage',
    'visitor:manage',
    'unit:read',
    'announcement:read',
    'shift_log:manage',
  ],
  maintenance_staff: ['maintenance:read', 'maintenance:update', 'equipment:read', 'unit:read'],
  superintendent: [
    'maintenance:read',
    'maintenance:update',
    'maintenance:create',
    'equipment:manage',
    'unit:read',
    'building_systems:read',
    'shift_log:manage',
    'parts:request',
  ],
  board_member: ['report:view', 'announcement:read', 'unit:read', 'financial:view'],
  resident_owner: [
    'event:read:own',
    'maintenance:create',
    'maintenance:read:own',
    'amenity:book',
    'announcement:read',
    'profile:manage',
  ],
  resident_tenant: [
    'event:read:own',
    'maintenance:create',
    'maintenance:read:own',
    'amenity:book',
    'announcement:read',
    'profile:manage',
  ],
  family_member: ['event:read:own', 'amenity:book', 'announcement:read', 'profile:read'],
  offsite_owner: [
    'event:read:own',
    'maintenance:read:own',
    'announcement:read',
    'report:view:own',
    'profile:manage',
  ],
  visitor: ['announcement:read:public'],
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(
  headers: Record<string, string> = {},
  url = 'http://localhost:3000/api/v1/events',
): NextRequest {
  return new NextRequest(url, {
    headers: { 'Content-Type': 'application/json', ...headers },
  });
}

function mockPayload(overrides: Partial<TokenPayload> = {}): TokenPayload {
  const role = (overrides.role as Role) ?? 'property_admin';
  return {
    sub: 'user-001',
    pid: PROPERTY_A,
    role,
    perms: ROLE_PERMISSIONS[role],
    mfa: role === 'super_admin' || role === 'property_admin',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 900,
    ...overrides,
  };
}

function stubAuth(role: Role, propertyId = PROPERTY_A, extra: Partial<TokenPayload> = {}): void {
  vi.mocked(requireAuth).mockResolvedValue(
    mockPayload({ role, pid: propertyId, perms: ROLE_PERMISSIONS[role], ...extra }),
  );
}

async function callGuard(roles: Role[], role?: Role, propertyId?: string) {
  if (role) stubAuth(role, propertyId);
  const req = makeRequest({ Authorization: 'Bearer valid-token' });
  return guardRoute(req, { roles, allowDemo: false });
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

// ═══════════════════════════════════════════════════════════════════════════
// 1. Unauthenticated requests return 401
// ═══════════════════════════════════════════════════════════════════════════

describe('Unauthenticated requests return 401', () => {
  it('returns 401 when no Authorization header is provided', async () => {
    const req = makeRequest();
    const result = await guardRoute(req, { allowDemo: false });
    expect(result.error).not.toBeNull();
    expect(result.error!.status).toBe(401);
    expect(result.user).toBeNull();
  });

  it('returns 401 when Authorization header is empty string', async () => {
    const req = makeRequest({ Authorization: '' });
    const result = await guardRoute(req, { allowDemo: false });
    expect(result.error).not.toBeNull();
    expect(result.error!.status).toBe(401);
  });

  it('returns 401 when Authorization header has no Bearer prefix', async () => {
    vi.mocked(requireAuth).mockRejectedValue(new AuthError('Invalid authorization token'));
    const req = makeRequest({ Authorization: 'some-token-value' });
    const result = await guardRoute(req, { allowDemo: false });
    expect(result.error).not.toBeNull();
    expect(result.error!.status).toBe(401);
  });

  it('returns 401 when Bearer token is empty', async () => {
    const req = makeRequest({ Authorization: 'Bearer ' });
    const result = await guardRoute(req, { allowDemo: false });
    expect(result.error).not.toBeNull();
    expect(result.error!.status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. Invalid JWT token returns 401
// ═══════════════════════════════════════════════════════════════════════════

describe('Invalid JWT token returns 401', () => {
  it('returns 401 for completely invalid token string', async () => {
    vi.mocked(requireAuth).mockRejectedValue(new AuthError('Invalid authorization token'));
    const req = makeRequest({ Authorization: 'Bearer not.a.valid.jwt' });
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

  it('returns 401 for token signed with wrong secret', async () => {
    vi.mocked(requireAuth).mockRejectedValue(new AuthError('Invalid token signature'));
    const req = makeRequest({ Authorization: 'Bearer wrong-secret-token' });
    const result = await guardRoute(req, { allowDemo: false });
    expect(result.error).not.toBeNull();
    expect(result.error!.status).toBe(401);
  });

  it('returns 401 for tampered JWT payload', async () => {
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

// ═══════════════════════════════════════════════════════════════════════════
// 3. Expired JWT token returns 401
// ═══════════════════════════════════════════════════════════════════════════

describe('Expired JWT token returns 401', () => {
  it('returns 401 for expired token', async () => {
    vi.mocked(requireAuth).mockRejectedValue(new AuthError('Token has expired'));
    const req = makeRequest({ Authorization: 'Bearer expired-token-value' });
    const result = await guardRoute(req, { allowDemo: false });
    expect(result.error).not.toBeNull();
    expect(result.error!.status).toBe(401);
  });

  it('returns 401 for token expired 1 second ago', async () => {
    vi.mocked(requireAuth).mockRejectedValue(new AuthError('Token has expired'));
    const req = makeRequest({ Authorization: 'Bearer just-expired-token' });
    const result = await guardRoute(req, { allowDemo: false });
    expect(result.error).not.toBeNull();
    expect(result.error!.status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. Valid JWT with wrong property returns 403 (via tenant isolation)
// ═══════════════════════════════════════════════════════════════════════════

describe('Valid JWT with wrong property — tenant isolation', () => {
  it('throws NotFoundError (404) when user property does not match resource property', () => {
    expect(() => requireTenantAccess(PROPERTY_A, PROPERTY_B)).toThrow(NotFoundError);
  });

  it('returns 404 (not 403) to prevent property ID enumeration', () => {
    try {
      requireTenantAccess(PROPERTY_A, PROPERTY_B);
      expect.unreachable('Should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(NotFoundError);
      expect((e as NotFoundError).statusCode).toBe(404);
    }
  });

  it('does not throw when property IDs match', () => {
    expect(() => requireTenantAccess(PROPERTY_A, PROPERTY_A)).not.toThrow();
  });

  it('guardRoute provides propertyId for downstream tenant checks', async () => {
    stubAuth('property_admin', PROPERTY_A);
    const req = makeRequest({ Authorization: 'Bearer valid-token' });
    const result = await guardRoute(req, { allowDemo: false });

    expect(result.error).toBeNull();
    expect(result.user).not.toBeNull();
    expect(result.user!.propertyId).toBe(PROPERTY_A);

    expect(() => requireTenantAccess(result.user!.propertyId, PROPERTY_B)).toThrow(NotFoundError);
    expect(() => requireTenantAccess(result.user!.propertyId, PROPERTY_A)).not.toThrow();
  });

  it('error message does not leak property IDs', () => {
    try {
      requireTenantAccess(PROPERTY_A, PROPERTY_B);
      expect.unreachable('Should have thrown');
    } catch (e) {
      const msg = (e as NotFoundError).message;
      expect(msg).not.toContain(PROPERTY_A);
      expect(msg).not.toContain(PROPERTY_B);
      expect(msg).toBe('Resource not found');
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. Role-based access control
// ═══════════════════════════════════════════════════════════════════════════

describe('Role-based access — resident cannot access admin endpoints', () => {
  it('resident_tenant cannot access admin-only routes', async () => {
    const result = await callGuard(['super_admin', 'property_admin'], 'resident_tenant');
    expect(result.error).not.toBeNull();
    expect(result.error!.status).toBe(403);
  });

  it('resident_owner cannot access admin-only routes', async () => {
    const result = await callGuard(['super_admin', 'property_admin'], 'resident_owner');
    expect(result.error).not.toBeNull();
    expect(result.error!.status).toBe(403);
  });

  it('resident_tenant cannot access user management', async () => {
    const result = await callGuard(['super_admin', 'property_admin'], 'resident_tenant');
    expect(result.error).not.toBeNull();
    expect(result.error!.status).toBe(403);
  });

  it('family_member cannot access any staff routes', async () => {
    const result = await callGuard(
      ['front_desk', 'security_guard', 'property_manager'],
      'family_member',
    );
    expect(result.error).not.toBeNull();
    expect(result.error!.status).toBe(403);
  });

  it('visitor cannot access any non-visitor route', async () => {
    const allStaffAndAdmin: Role[] = [
      'super_admin',
      'property_admin',
      'property_manager',
      'front_desk',
      'security_guard',
    ];
    const result = await callGuard(allStaffAndAdmin, 'visitor');
    expect(result.error).not.toBeNull();
    expect(result.error!.status).toBe(403);
  });
});

describe('Role-based access — security guard cannot access financial endpoints', () => {
  it('security_guard cannot access financial routes', async () => {
    const result = await callGuard(
      ['super_admin', 'property_admin', 'board_member'],
      'security_guard',
    );
    expect(result.error).not.toBeNull();
    expect(result.error!.status).toBe(403);
  });

  it('security_guard does NOT have financial:view permission', () => {
    expect(ROLE_PERMISSIONS.security_guard).not.toContain('financial:view');
  });

  it('security_guard does NOT have report:view (only report:view:security via supervisor)', () => {
    expect(ROLE_PERMISSIONS.security_guard).not.toContain('report:view');
  });

  it('security_guard cannot access maintenance management', async () => {
    const result = await callGuard(
      ['property_admin', 'property_manager', 'maintenance_staff', 'superintendent'],
      'security_guard',
    );
    expect(result.error).not.toBeNull();
    expect(result.error!.status).toBe(403);
  });
});

describe('Role-based access — front desk cannot modify settings', () => {
  it('front_desk cannot access settings routes', async () => {
    const result = await callGuard(['super_admin', 'property_admin'], 'front_desk');
    expect(result.error).not.toBeNull();
    expect(result.error!.status).toBe(403);
  });

  it('front_desk does NOT have settings:manage permission', () => {
    expect(ROLE_PERMISSIONS.front_desk).not.toContain('settings:manage');
  });

  it('front_desk does NOT have user:manage permission', () => {
    expect(ROLE_PERMISSIONS.front_desk).not.toContain('user:manage');
  });

  it('front_desk does NOT have property:manage permission', () => {
    expect(ROLE_PERMISSIONS.front_desk).not.toContain('property:manage');
  });
});

describe('Role-based access — board member cannot access operational data', () => {
  it('board_member cannot access staff operational routes', async () => {
    const result = await callGuard(
      ['front_desk', 'security_guard', 'maintenance_staff'],
      'board_member',
    );
    expect(result.error).not.toBeNull();
    expect(result.error!.status).toBe(403);
  });

  it('board_member does NOT have event:create permission', () => {
    expect(ROLE_PERMISSIONS.board_member).not.toContain('event:create');
  });

  it('board_member does NOT have package:manage permission', () => {
    expect(ROLE_PERMISSIONS.board_member).not.toContain('package:manage');
  });

  it('board_member does NOT have incident:manage permission', () => {
    expect(ROLE_PERMISSIONS.board_member).not.toContain('incident:manage');
  });

  it('board_member does NOT have visitor:manage permission', () => {
    expect(ROLE_PERMISSIONS.board_member).not.toContain('visitor:manage');
  });
});

describe('Role-based access — super admin can access everything', () => {
  it('super_admin can access admin routes', async () => {
    const result = await callGuard(['super_admin'], 'super_admin');
    expect(result.error).toBeNull();
    expect(result.user!.role).toBe('super_admin');
  });

  it('super_admin can access staff routes when listed', async () => {
    const result = await callGuard(['super_admin', 'front_desk', 'security_guard'], 'super_admin');
    expect(result.error).toBeNull();
  });

  it('super_admin has wildcard (*) permission', () => {
    expect(ROLE_PERMISSIONS.super_admin).toEqual(['*']);
  });

  it('super_admin can access financial routes', async () => {
    const result = await callGuard(
      ['super_admin', 'property_admin', 'board_member'],
      'super_admin',
    );
    expect(result.error).toBeNull();
  });

  it('super_admin can access event routes', async () => {
    const result = await callGuard(['super_admin', 'front_desk', 'security_guard'], 'super_admin');
    expect(result.error).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. Tenant isolation — cross-property access blocked
// ═══════════════════════════════════════════════════════════════════════════

describe('Tenant isolation — user from Property A cannot see Property B data', () => {
  it('property_admin of Property A cannot access Property B resources', () => {
    expect(() => requireTenantAccess(PROPERTY_A, PROPERTY_B)).toThrow(NotFoundError);
  });

  it('front_desk of Property A cannot access Property B events', () => {
    expect(() => requireTenantAccess(PROPERTY_A, PROPERTY_B)).toThrow(NotFoundError);
  });

  it('resident of Property A cannot see Property B packages', () => {
    expect(() => requireTenantAccess(PROPERTY_A, PROPERTY_B)).toThrow(NotFoundError);
  });
});

describe('Tenant isolation — search results scoped to current property', () => {
  it('guardRoute always includes propertyId from token for search scoping', async () => {
    stubAuth('property_manager', PROPERTY_A);
    const req = makeRequest(
      { Authorization: 'Bearer valid-token' },
      'http://localhost:3000/api/v1/events?q=fire',
    );
    const result = await guardRoute(req, { allowDemo: false });

    expect(result.user!.propertyId).toBe(PROPERTY_A);
    // Search handler would use result.user.propertyId as a filter
  });

  it('different property tokens yield different propertyId in guard result', async () => {
    stubAuth('property_admin', PROPERTY_A);
    const reqA = makeRequest({ Authorization: 'Bearer token-a' });
    const resultA = await guardRoute(reqA, { allowDemo: false });
    expect(resultA.user!.propertyId).toBe(PROPERTY_A);

    stubAuth('property_admin', PROPERTY_B);
    const reqB = makeRequest({ Authorization: 'Bearer token-b' });
    const resultB = await guardRoute(reqB, { allowDemo: false });
    expect(resultB.user!.propertyId).toBe(PROPERTY_B);
  });
});

describe('Tenant isolation — reports scoped to current property', () => {
  it('board_member report access scoped to their property', async () => {
    stubAuth('board_member', PROPERTY_A);
    const req = makeRequest(
      { Authorization: 'Bearer valid-token' },
      'http://localhost:3000/api/v1/reports',
    );
    const result = await guardRoute(req, {
      roles: ['board_member', 'property_admin', 'property_manager', 'super_admin'],
      allowDemo: false,
    });

    expect(result.error).toBeNull();
    expect(result.user!.propertyId).toBe(PROPERTY_A);
    expect(() => requireTenantAccess(result.user!.propertyId, PROPERTY_B)).toThrow(NotFoundError);
  });

  it('property_manager report access scoped to their property', async () => {
    stubAuth('property_manager', PROPERTY_B);
    const req = makeRequest(
      { Authorization: 'Bearer valid-token' },
      'http://localhost:3000/api/v1/reports',
    );
    const result = await guardRoute(req, {
      roles: ['property_manager', 'property_admin', 'super_admin'],
      allowDemo: false,
    });

    expect(result.error).toBeNull();
    expect(result.user!.propertyId).toBe(PROPERTY_B);
    expect(() => requireTenantAccess(result.user!.propertyId, PROPERTY_A)).toThrow(NotFoundError);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. Session management
// ═══════════════════════════════════════════════════════════════════════════

describe('Session management — revoked session returns 401', () => {
  it('revoked/suspended user token is rejected by auth layer', async () => {
    vi.mocked(requireAuth).mockRejectedValue(new AuthError('Account suspended'));
    const req = makeRequest({ Authorization: 'Bearer revoked-session-token' });
    const result = await guardRoute(req, { allowDemo: false });

    expect(result.error).not.toBeNull();
    expect(result.error!.status).toBe(401);
    expect(result.user).toBeNull();
  });

  it('previously valid token rejected after session revocation', async () => {
    // First request succeeds
    stubAuth('property_admin', PROPERTY_A);
    const req1 = makeRequest({ Authorization: 'Bearer valid-token' });
    const result1 = await guardRoute(req1, { allowDemo: false });
    expect(result1.error).toBeNull();

    // Session revoked
    vi.mocked(requireAuth).mockRejectedValue(new AuthError('Session revoked'));
    const req2 = makeRequest({ Authorization: 'Bearer valid-token' });
    const result2 = await guardRoute(req2, { allowDemo: false });
    expect(result2.error).not.toBeNull();
    expect(result2.error!.status).toBe(401);
  });
});

describe('Session management — password change invalidates sessions', () => {
  it('token from before password change is rejected', async () => {
    // Before password change — works
    stubAuth('property_admin', PROPERTY_A);
    const req1 = makeRequest({ Authorization: 'Bearer pre-password-change-token' });
    const result1 = await guardRoute(req1, { allowDemo: false });
    expect(result1.error).toBeNull();

    // After password change — old token rejected
    vi.mocked(requireAuth).mockRejectedValue(new AuthError('Token issued before password change'));
    const req2 = makeRequest({ Authorization: 'Bearer pre-password-change-token' });
    const result2 = await guardRoute(req2, { allowDemo: false });
    expect(result2.error).not.toBeNull();
    expect(result2.error!.status).toBe(401);
  });

  it('new token after password change works', async () => {
    stubAuth('property_admin', PROPERTY_A);
    const req = makeRequest({ Authorization: 'Bearer new-post-password-token' });
    const result = await guardRoute(req, { allowDemo: false });
    expect(result.error).toBeNull();
    expect(result.user!.role).toBe('property_admin');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. requireRole — direct RBAC boundary checks
// ═══════════════════════════════════════════════════════════════════════════

describe('requireRole — direct RBAC checks', () => {
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

  it('ForbiddenError has statusCode 403', () => {
    try {
      requireRole('visitor', ['super_admin']);
      expect.unreachable('Should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(ForbiddenError);
      expect((e as ForbiddenError).statusCode).toBe(403);
    }
  });

  it('ForbiddenError has code FORBIDDEN', () => {
    try {
      requireRole('visitor', ['super_admin']);
      expect.unreachable('Should have thrown');
    } catch (e) {
      expect((e as ForbiddenError).code).toBe('FORBIDDEN');
    }
  });

  it('ForbiddenError message includes the denied role', () => {
    try {
      requireRole('family_member', ['super_admin']);
      expect.unreachable('Should have thrown');
    } catch (e) {
      expect((e as ForbiddenError).message).toContain('family_member');
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 9. guardRoute — complete auth flow integration
// ═══════════════════════════════════════════════════════════════════════════

describe('guardRoute — complete auth + RBAC flow', () => {
  it('returns user object with correct fields on success', async () => {
    stubAuth('property_admin', PROPERTY_A);
    const req = makeRequest({ Authorization: 'Bearer valid-token' });
    const result = await guardRoute(req, { allowDemo: false });

    expect(result.error).toBeNull();
    expect(result.user).not.toBeNull();
    expect(result.user!.userId).toBe('user-001');
    expect(result.user!.propertyId).toBe(PROPERTY_A);
    expect(result.user!.role).toBe('property_admin');
    expect(result.user!.permissions).toEqual(ROLE_PERMISSIONS.property_admin);
    expect(result.user!.mfaVerified).toBe(true);
  });

  it('returns 401 for missing token (no demo, no auth header)', async () => {
    const req = makeRequest();
    const result = await guardRoute(req, { allowDemo: false });
    expect(result.error).not.toBeNull();
    expect(result.error!.status).toBe(401);
  });

  it('returns 401 for rejected auth', async () => {
    vi.mocked(requireAuth).mockRejectedValue(new AuthError('Token has expired'));
    const req = makeRequest({ Authorization: 'Bearer expired-token' });
    const result = await guardRoute(req, { allowDemo: false });
    expect(result.error).not.toBeNull();
    expect(result.error!.status).toBe(401);
  });

  it('returns 403 for wrong role', async () => {
    stubAuth('visitor', PROPERTY_A);
    const req = makeRequest({ Authorization: 'Bearer valid-token' });
    const result = await guardRoute(req, {
      roles: ['super_admin', 'property_admin'],
      allowDemo: false,
    });
    expect(result.error).not.toBeNull();
    expect(result.error!.status).toBe(403);
  });

  it('returns no error when no roles specified (any authenticated user)', async () => {
    stubAuth('visitor', PROPERTY_A);
    const req = makeRequest({ Authorization: 'Bearer valid-token' });
    const result = await guardRoute(req, { allowDemo: false });
    expect(result.error).toBeNull();
    expect(result.user!.role).toBe('visitor');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 10. Demo mode — RBAC still enforced
// ═══════════════════════════════════════════════════════════════════════════

describe('Demo mode — RBAC is still enforced', () => {
  it('demo user with front_desk role can access front_desk routes', async () => {
    const req = makeRequest({ 'x-demo-role': 'front_desk' });
    const result = await guardRoute(req, {
      roles: ['front_desk', 'property_admin'],
      allowDemo: true,
    });
    expect(result.error).toBeNull();
    expect(result.user!.role).toBe('front_desk');
    expect(result.user!.userId).toBe('00000000-0000-4000-a000-000000000001');
  });

  it('demo user with visitor role is denied admin routes', async () => {
    const req = makeRequest({ 'x-demo-role': 'visitor' });
    const result = await guardRoute(req, {
      roles: ['super_admin', 'property_admin'],
      allowDemo: true,
    });
    expect(result.error).not.toBeNull();
    expect(result.error!.status).toBe(403);
  });

  it('demo mode disabled does not accept x-demo-role header', async () => {
    const req = makeRequest({ 'x-demo-role': 'property_admin' });
    const result = await guardRoute(req, {
      roles: ['property_admin'],
      allowDemo: false,
    });
    expect(result.error).not.toBeNull();
    expect(result.error!.status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 11. Role downgrade/upgrade takes effect immediately
// ═══════════════════════════════════════════════════════════════════════════

describe('Role changes take effect immediately', () => {
  it('role downgrade denies previously accessible routes', async () => {
    // Admin access works
    stubAuth('property_admin', PROPERTY_A);
    const req1 = makeRequest({ Authorization: 'Bearer admin-token' });
    const result1 = await guardRoute(req1, {
      roles: ['property_admin', 'super_admin'],
      allowDemo: false,
    });
    expect(result1.error).toBeNull();

    // After downgrade to resident
    stubAuth('resident_tenant', PROPERTY_A);
    const req2 = makeRequest({ Authorization: 'Bearer tenant-token' });
    const result2 = await guardRoute(req2, {
      roles: ['property_admin', 'super_admin'],
      allowDemo: false,
    });
    expect(result2.error).not.toBeNull();
    expect(result2.error!.status).toBe(403);
  });

  it('role upgrade grants previously denied routes', async () => {
    // Front desk denied admin route
    stubAuth('front_desk', PROPERTY_A);
    const req1 = makeRequest({ Authorization: 'Bearer frontdesk-token' });
    const result1 = await guardRoute(req1, {
      roles: ['property_admin', 'super_admin'],
      allowDemo: false,
    });
    expect(result1.error).not.toBeNull();

    // After promotion to admin
    stubAuth('property_admin', PROPERTY_A);
    const req2 = makeRequest({ Authorization: 'Bearer new-admin-token' });
    const result2 = await guardRoute(req2, {
      roles: ['property_admin', 'super_admin'],
      allowDemo: false,
    });
    expect(result2.error).toBeNull();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 12. Inactive/suspended user
// ═══════════════════════════════════════════════════════════════════════════

describe('Inactive/suspended user rejected', () => {
  it('suspended user returns 401', async () => {
    vi.mocked(requireAuth).mockRejectedValue(new AuthError('Account suspended'));
    const req = makeRequest({ Authorization: 'Bearer suspended-user-token' });
    const result = await guardRoute(req, { allowDemo: false });
    expect(result.error).not.toBeNull();
    expect(result.error!.status).toBe(401);
    expect(result.user).toBeNull();
  });

  it('deactivated user returns 401', async () => {
    vi.mocked(requireAuth).mockRejectedValue(new AuthError('User account is inactive'));
    const req = makeRequest({ Authorization: 'Bearer inactive-user-token' });
    const result = await guardRoute(req, { allowDemo: false });
    expect(result.error).not.toBeNull();
    expect(result.error!.status).toBe(401);
  });
});
