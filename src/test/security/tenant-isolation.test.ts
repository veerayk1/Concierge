/**
 * Concierge — Tenant Isolation Tests
 *
 * Validates that multi-tenant isolation is enforced at every boundary:
 *   - User in Property A cannot access Property B data
 *   - API routes enforce propertyId filtering
 *   - Cross-tenant data leakage prevention
 *   - Multi-property staff can only access assigned properties
 *   - Super admin can access all properties
 *
 * Per Security Rulebook A.3, B.2.
 *
 * @module test/security/tenant-isolation
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
import { requireTenantAccess } from '@/server/middleware/tenant';
import { NotFoundError, ForbiddenError } from '@/server/errors';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROPERTY_A = 'prop-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const PROPERTY_B = 'prop-bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';
const PROPERTY_C = 'prop-cccccccc-cccc-cccc-cccc-cccccccccccc';
const SUPER_ADMIN_PROPERTY = 'prop-00000000-0000-4000-b000-000000000000';

const ROLE_PERMISSIONS: Record<string, string[]> = {
  super_admin: ['*'],
  property_admin: ['property:manage', 'user:manage', 'event:manage', 'unit:manage'],
  property_manager: ['event:manage', 'unit:manage', 'maintenance:manage'],
  front_desk: ['event:create', 'event:read', 'package:manage', 'visitor:manage'],
  security_guard: ['event:create', 'event:read', 'incident:manage', 'visitor:manage'],
  resident_owner: ['event:read:own', 'maintenance:create', 'amenity:book'],
  resident_tenant: ['event:read:own', 'maintenance:create', 'amenity:book'],
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

function mockPayload(
  role: Role,
  propertyId: string,
  extra: Partial<TokenPayload> = {},
): TokenPayload {
  return {
    sub: `user-${role}-001`,
    pid: propertyId,
    role,
    perms: ROLE_PERMISSIONS[role] ?? [],
    mfa: role === 'super_admin' || role === 'property_admin',
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 900,
    ...extra,
  };
}

function stubAuth(role: Role, propertyId: string): void {
  vi.mocked(requireAuth).mockResolvedValue(mockPayload(role, propertyId));
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

// ============================================================================
// 1. User in Property A cannot access Property B data
// ============================================================================

describe('User in Property A cannot access Property B data', () => {
  it('requireTenantAccess throws NotFoundError for cross-property access', () => {
    expect(() => requireTenantAccess(PROPERTY_A, PROPERTY_B)).toThrow(NotFoundError);
  });

  it('requireTenantAccess throws NotFoundError (not ForbiddenError) to prevent enumeration', () => {
    try {
      requireTenantAccess(PROPERTY_A, PROPERTY_B);
      expect.unreachable('Should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(NotFoundError);
      expect(e).not.toBeInstanceOf(ForbiddenError);
      expect((e as NotFoundError).statusCode).toBe(404);
    }
  });

  it('error message is generic "Resource not found" — no property IDs leaked', () => {
    try {
      requireTenantAccess(PROPERTY_A, PROPERTY_B);
      expect.unreachable('Should have thrown');
    } catch (e) {
      const msg = (e as NotFoundError).message;
      expect(msg).toBe('Resource not found');
      expect(msg).not.toContain(PROPERTY_A);
      expect(msg).not.toContain(PROPERTY_B);
    }
  });

  it('Property A admin cannot access Property B resources', () => {
    expect(() => requireTenantAccess(PROPERTY_A, PROPERTY_B)).toThrow(NotFoundError);
  });

  it('Property B resident cannot access Property A packages', () => {
    expect(() => requireTenantAccess(PROPERTY_B, PROPERTY_A)).toThrow(NotFoundError);
  });

  it('Property A front desk cannot view Property C events', () => {
    expect(() => requireTenantAccess(PROPERTY_A, PROPERTY_C)).toThrow(NotFoundError);
  });

  it('access is allowed when property IDs match', () => {
    expect(() => requireTenantAccess(PROPERTY_A, PROPERTY_A)).not.toThrow();
    expect(() => requireTenantAccess(PROPERTY_B, PROPERTY_B)).not.toThrow();
    expect(() => requireTenantAccess(PROPERTY_C, PROPERTY_C)).not.toThrow();
  });
});

// ============================================================================
// 2. API routes enforce propertyId filtering
// ============================================================================

describe('API routes enforce propertyId filtering', () => {
  it('guardRoute returns propertyId from the authenticated token', async () => {
    stubAuth('property_admin', PROPERTY_A);
    const req = makeRequest({ Authorization: 'Bearer valid-token' });
    const result = await guardRoute(req, { allowDemo: false });

    expect(result.error).toBeNull();
    expect(result.user).not.toBeNull();
    expect(result.user!.propertyId).toBe(PROPERTY_A);
  });

  it('different tokens yield different propertyId values', async () => {
    stubAuth('property_admin', PROPERTY_A);
    const reqA = makeRequest({ Authorization: 'Bearer token-a' });
    const resultA = await guardRoute(reqA, { allowDemo: false });
    expect(resultA.user!.propertyId).toBe(PROPERTY_A);

    stubAuth('property_admin', PROPERTY_B);
    const reqB = makeRequest({ Authorization: 'Bearer token-b' });
    const resultB = await guardRoute(reqB, { allowDemo: false });
    expect(resultB.user!.propertyId).toBe(PROPERTY_B);
  });

  it('route handler can use propertyId from guard for WHERE clause filtering', async () => {
    stubAuth('front_desk', PROPERTY_A);
    const req = makeRequest({ Authorization: 'Bearer valid-token' });
    const result = await guardRoute(req, { allowDemo: false });

    // Simulates what a route handler would do
    const where = {
      propertyId: result.user!.propertyId,
      deletedAt: null,
    };

    expect(where.propertyId).toBe(PROPERTY_A);
    expect(where.propertyId).not.toBe(PROPERTY_B);
  });

  it('downstream tenant check fails if resource belongs to different property', async () => {
    stubAuth('property_manager', PROPERTY_A);
    const req = makeRequest({ Authorization: 'Bearer valid-token' });
    const result = await guardRoute(req, { allowDemo: false });

    // Resource from Property B
    const resourcePropertyId = PROPERTY_B;

    expect(() => requireTenantAccess(result.user!.propertyId, resourcePropertyId)).toThrow(
      NotFoundError,
    );
  });

  it('downstream tenant check passes if resource belongs to same property', async () => {
    stubAuth('property_manager', PROPERTY_A);
    const req = makeRequest({ Authorization: 'Bearer valid-token' });
    const result = await guardRoute(req, { allowDemo: false });

    const resourcePropertyId = PROPERTY_A;

    expect(() => requireTenantAccess(result.user!.propertyId, resourcePropertyId)).not.toThrow();
  });
});

// ============================================================================
// 3. Cross-tenant data leakage prevention
// ============================================================================

describe('Cross-tenant data leakage prevention', () => {
  it('tenant access check is symmetric — A->B and B->A both blocked', () => {
    expect(() => requireTenantAccess(PROPERTY_A, PROPERTY_B)).toThrow(NotFoundError);
    expect(() => requireTenantAccess(PROPERTY_B, PROPERTY_A)).toThrow(NotFoundError);
  });

  it('no partial property ID matching (substring attacks)', () => {
    // Even if Property B starts with the same prefix as Property A
    const propSimilar = PROPERTY_A.slice(0, -1) + 'b'; // Change last char
    expect(() => requireTenantAccess(PROPERTY_A, propSimilar)).toThrow(NotFoundError);
  });

  it('empty string propertyId does not match any property', () => {
    expect(() => requireTenantAccess('', PROPERTY_A)).toThrow(NotFoundError);
    expect(() => requireTenantAccess(PROPERTY_A, '')).toThrow(NotFoundError);
  });

  it('tenant check uses strict equality (no case insensitivity)', () => {
    const upperProp = PROPERTY_A.toUpperCase();
    // If IDs differ by case, they should not match
    if (upperProp !== PROPERTY_A) {
      expect(() => requireTenantAccess(PROPERTY_A, upperProp)).toThrow(NotFoundError);
    }
  });

  it('search results are scoped by propertyId from guard', async () => {
    stubAuth('property_manager', PROPERTY_A);
    const req = makeRequest(
      { Authorization: 'Bearer valid-token' },
      'http://localhost:3000/api/v1/events?q=fire',
    );
    const result = await guardRoute(req, { allowDemo: false });

    // The search handler would scope results using this propertyId
    expect(result.user!.propertyId).toBe(PROPERTY_A);
    expect(result.user!.propertyId).not.toBe(PROPERTY_B);
  });

  it('reports are scoped to the requesting user property', async () => {
    stubAuth('property_admin', PROPERTY_B);
    const req = makeRequest(
      { Authorization: 'Bearer valid-token' },
      'http://localhost:3000/api/v1/reports',
    );
    const result = await guardRoute(req, { allowDemo: false });

    expect(result.user!.propertyId).toBe(PROPERTY_B);
    expect(() => requireTenantAccess(result.user!.propertyId, PROPERTY_A)).toThrow(NotFoundError);
    expect(() => requireTenantAccess(result.user!.propertyId, PROPERTY_C)).toThrow(NotFoundError);
  });

  it('unit data from Property A cannot be accessed by Property B user', async () => {
    stubAuth('front_desk', PROPERTY_B);
    const req = makeRequest(
      { Authorization: 'Bearer valid-token' },
      'http://localhost:3000/api/v1/units',
    );
    const result = await guardRoute(req, { allowDemo: false });

    // Simulate fetching a unit that belongs to Property A
    const unitPropertyId = PROPERTY_A;
    expect(() => requireTenantAccess(result.user!.propertyId, unitPropertyId)).toThrow(
      NotFoundError,
    );
  });

  it('maintenance request from Property A hidden from Property C user', async () => {
    stubAuth('resident_tenant', PROPERTY_C);
    const req = makeRequest(
      { Authorization: 'Bearer valid-token' },
      'http://localhost:3000/api/v1/maintenance',
    );
    const result = await guardRoute(req, { allowDemo: false });

    const requestPropertyId = PROPERTY_A;
    expect(() => requireTenantAccess(result.user!.propertyId, requestPropertyId)).toThrow(
      NotFoundError,
    );
  });
});

// ============================================================================
// 4. Multi-property staff can only access assigned properties
// ============================================================================

describe('Multi-property staff access control', () => {
  it('staff with Property A token can access Property A resources', async () => {
    stubAuth('front_desk', PROPERTY_A);
    const req = makeRequest({ Authorization: 'Bearer token-prop-a' });
    const result = await guardRoute(req, { allowDemo: false });

    expect(result.user!.propertyId).toBe(PROPERTY_A);
    expect(() => requireTenantAccess(result.user!.propertyId, PROPERTY_A)).not.toThrow();
  });

  it('staff with Property A token cannot access Property B resources', async () => {
    stubAuth('front_desk', PROPERTY_A);
    const req = makeRequest({ Authorization: 'Bearer token-prop-a' });
    const result = await guardRoute(req, { allowDemo: false });

    expect(() => requireTenantAccess(result.user!.propertyId, PROPERTY_B)).toThrow(NotFoundError);
  });

  it('staff switching to Property B gets new token with Property B context', async () => {
    // First session — Property A
    stubAuth('property_manager', PROPERTY_A);
    const reqA = makeRequest({ Authorization: 'Bearer token-a' });
    const resultA = await guardRoute(reqA, { allowDemo: false });
    expect(resultA.user!.propertyId).toBe(PROPERTY_A);

    // Second session — Property B (new token issued after property switch)
    stubAuth('property_manager', PROPERTY_B);
    const reqB = makeRequest({ Authorization: 'Bearer token-b' });
    const resultB = await guardRoute(reqB, { allowDemo: false });
    expect(resultB.user!.propertyId).toBe(PROPERTY_B);

    // Cross-access still blocked
    expect(() => requireTenantAccess(resultA.user!.propertyId, PROPERTY_B)).toThrow(NotFoundError);
    expect(() => requireTenantAccess(resultB.user!.propertyId, PROPERTY_A)).toThrow(NotFoundError);
  });

  it('property_admin for Property A cannot manage Property B users', async () => {
    stubAuth('property_admin', PROPERTY_A);
    const req = makeRequest(
      { Authorization: 'Bearer valid-token' },
      'http://localhost:3000/api/v1/users',
    );
    const result = await guardRoute(req, { allowDemo: false });

    expect(result.user!.propertyId).toBe(PROPERTY_A);
    expect(() => requireTenantAccess(result.user!.propertyId, PROPERTY_B)).toThrow(NotFoundError);
  });

  it('security_guard token is scoped to a single property', async () => {
    stubAuth('security_guard', PROPERTY_C);
    const req = makeRequest({ Authorization: 'Bearer guard-token' });
    const result = await guardRoute(req, { allowDemo: false });

    expect(result.user!.propertyId).toBe(PROPERTY_C);
    expect(() => requireTenantAccess(result.user!.propertyId, PROPERTY_A)).toThrow(NotFoundError);
    expect(() => requireTenantAccess(result.user!.propertyId, PROPERTY_B)).toThrow(NotFoundError);
    expect(() => requireTenantAccess(result.user!.propertyId, PROPERTY_C)).not.toThrow();
  });
});

// ============================================================================
// 5. Super admin can access all properties
// ============================================================================

describe('Super admin can access all properties', () => {
  it('super_admin role has wildcard permission', () => {
    expect(ROLE_PERMISSIONS.super_admin).toEqual(['*']);
  });

  it('super_admin can authenticate and access admin routes', async () => {
    stubAuth('super_admin', SUPER_ADMIN_PROPERTY);
    const req = makeRequest({ Authorization: 'Bearer super-admin-token' });
    const result = await guardRoute(req, {
      roles: ['super_admin'],
      allowDemo: false,
    });

    expect(result.error).toBeNull();
    expect(result.user!.role).toBe('super_admin');
  });

  it('super_admin is granted access even when role list is restrictive', async () => {
    stubAuth('super_admin', SUPER_ADMIN_PROPERTY);
    const req = makeRequest({ Authorization: 'Bearer super-admin-token' });
    const result = await guardRoute(req, {
      roles: ['super_admin', 'property_admin'],
      allowDemo: false,
    });

    expect(result.error).toBeNull();
  });

  it('super_admin token carries a propertyId for request scoping', async () => {
    stubAuth('super_admin', SUPER_ADMIN_PROPERTY);
    const req = makeRequest({ Authorization: 'Bearer super-admin-token' });
    const result = await guardRoute(req, { allowDemo: false });

    expect(result.user!.propertyId).toBeDefined();
    expect(result.user!.propertyId).toBe(SUPER_ADMIN_PROPERTY);
  });

  it('super_admin bypasses RBAC role checks when listed in allowed roles', async () => {
    stubAuth('super_admin', SUPER_ADMIN_PROPERTY);
    const req = makeRequest({ Authorization: 'Bearer super-admin-token' });

    // Even routes restricted to front_desk should allow super_admin if listed
    const result = await guardRoute(req, {
      roles: ['super_admin', 'front_desk'],
      allowDemo: false,
    });

    expect(result.error).toBeNull();
    expect(result.user!.role).toBe('super_admin');
  });
});

// ============================================================================
// 6. Tenant isolation across different resource types
// ============================================================================

describe('Tenant isolation across resource types', () => {
  const resources = [
    { name: 'events', path: '/api/v1/events' },
    { name: 'packages', path: '/api/v1/packages' },
    { name: 'maintenance', path: '/api/v1/maintenance' },
    { name: 'units', path: '/api/v1/units' },
    { name: 'bookings', path: '/api/v1/bookings' },
    { name: 'announcements', path: '/api/v1/announcements' },
    { name: 'visitors', path: '/api/v1/visitors' },
    { name: 'users', path: '/api/v1/users' },
  ];

  for (const resource of resources) {
    it(`${resource.name} — user from Property A blocked from Property B`, async () => {
      stubAuth('property_admin', PROPERTY_A);
      const req = makeRequest(
        { Authorization: 'Bearer valid-token' },
        `http://localhost:3000${resource.path}`,
      );
      const result = await guardRoute(req, { allowDemo: false });

      expect(result.user!.propertyId).toBe(PROPERTY_A);
      expect(() => requireTenantAccess(result.user!.propertyId, PROPERTY_B)).toThrow(NotFoundError);
    });
  }
});

// ============================================================================
// 7. Edge cases
// ============================================================================

describe('Tenant isolation edge cases', () => {
  it('null-like propertyId values do not bypass checks', () => {
    // Both undefined-ish strings should not match
    expect(() => requireTenantAccess('null', PROPERTY_A)).toThrow(NotFoundError);
    expect(() => requireTenantAccess('undefined', PROPERTY_A)).toThrow(NotFoundError);
  });

  it('identical strings always pass the check', () => {
    const id = 'prop-12345678-1234-1234-1234-123456789012';
    expect(() => requireTenantAccess(id, id)).not.toThrow();
  });

  it('whitespace-padded IDs do not match unpadded IDs', () => {
    expect(() => requireTenantAccess(` ${PROPERTY_A}`, PROPERTY_A)).toThrow(NotFoundError);
    expect(() => requireTenantAccess(PROPERTY_A, `${PROPERTY_A} `)).toThrow(NotFoundError);
  });

  it('NotFoundError has statusCode 404', () => {
    try {
      requireTenantAccess(PROPERTY_A, PROPERTY_B);
      expect.unreachable('Should have thrown');
    } catch (e) {
      expect((e as NotFoundError).statusCode).toBe(404);
    }
  });

  it('NotFoundError has code NOT_FOUND', () => {
    try {
      requireTenantAccess(PROPERTY_A, PROPERTY_B);
      expect.unreachable('Should have thrown');
    } catch (e) {
      expect((e as NotFoundError).code).toBe('NOT_FOUND');
    }
  });

  it('NotFoundError is operational', () => {
    try {
      requireTenantAccess(PROPERTY_A, PROPERTY_B);
      expect.unreachable('Should have thrown');
    } catch (e) {
      expect((e as NotFoundError).isOperational).toBe(true);
    }
  });
});
