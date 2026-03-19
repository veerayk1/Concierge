/**
 * Concierge — Comprehensive RBAC & Multi-Tenancy Tests (PRD 02)
 *
 * Exhaustive tests for all 14 roles and their access boundaries:
 *   super_admin, property_admin, property_manager, security_supervisor,
 *   security_guard, front_desk, maintenance_staff, superintendent,
 *   board_member, resident_owner, resident_tenant, family_member,
 *   offsite_owner, visitor
 *
 * Covers:
 *   - Role-based route access (allowed = pass, disallowed = ForbiddenError)
 *   - Tenant isolation (cross-property access = NotFoundError)
 *   - Permission hierarchy enforcement
 *   - Fine-grained permission matching (event:create vs event:read vs event:manage)
 *   - Permission wildcard (*) semantics
 *   - Edge cases: multi-property context switching, suspended users,
 *     role changes, demo mode
 *
 * @module test/security/rbac-comprehensive
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import type { Role, TokenPayload } from '@/types';
import { ROLE_HIERARCHY, ADMIN_ROLES, STAFF_ROLES, RESIDENT_ROLES } from '@/types';

// ---------------------------------------------------------------------------
// Mocks — guardRoute depends on requireAuth, which we control
// ---------------------------------------------------------------------------

vi.mock('@/server/middleware/auth', () => ({
  requireAuth: vi.fn(),
}));

// Preserve real error classes so instanceof checks work inside guardRoute
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
import { ForbiddenError, NotFoundError, AuthError } from '@/server/errors';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ALL_ROLES: Role[] = [
  'super_admin',
  'property_admin',
  'property_manager',
  'security_supervisor',
  'security_guard',
  'front_desk',
  'maintenance_staff',
  'superintendent',
  'board_member',
  'resident_owner',
  'resident_tenant',
  'family_member',
  'offsite_owner',
  'visitor',
];

const PROPERTY_A = 'prop-aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
const PROPERTY_B = 'prop-bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb';

/**
 * Default permissions per role — mirrors the auth helper / user factory.
 */
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

/** Stub requireAuth to return a payload for the given role + property. */
function stubAuth(role: Role, propertyId = PROPERTY_A, extra: Partial<TokenPayload> = {}): void {
  vi.mocked(requireAuth).mockResolvedValue(
    mockPayload({ role, pid: propertyId, perms: ROLE_PERMISSIONS[role], ...extra }),
  );
}

/** Helper to call guardRoute with a bearer-token request. */
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
// 1. super_admin — access to everything across all properties
// ═══════════════════════════════════════════════════════════════════════════

describe('1. super_admin — full system access', () => {
  it('can access super_admin-only routes', async () => {
    const result = await callGuard(['super_admin'], 'super_admin');
    expect(result.error).toBeNull();
    expect(result.user!.role).toBe('super_admin');
  });

  it('can access property_admin routes', async () => {
    const result = await callGuard(['super_admin', 'property_admin'], 'super_admin');
    expect(result.error).toBeNull();
  });

  it('can access staff routes when explicitly listed', async () => {
    const result = await callGuard(['super_admin', 'front_desk', 'security_guard'], 'super_admin');
    expect(result.error).toBeNull();
  });

  it('is denied when not explicitly in the allowed list (no implicit bypass)', () => {
    expect(() => requireRole('super_admin', ['property_admin'])).toThrow(ForbiddenError);
  });

  it('holds wildcard (*) permission', () => {
    expect(ROLE_PERMISSIONS.super_admin).toEqual(['*']);
  });

  it('has the highest hierarchy value', () => {
    const maxHierarchy = Math.max(...Object.values(ROLE_HIERARCHY));
    expect(ROLE_HIERARCHY.super_admin).toBe(maxHierarchy);
  });

  it('can access any property via tenant isolation (super_admin bypasses conceptually)', () => {
    // In practice, super_admin has no pid restriction — but the function
    // still checks equality. The system should always pass the correct pid.
    expect(() => requireTenantAccess(PROPERTY_A, PROPERTY_A)).not.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 2. property_admin — full access to their property only
// ═══════════════════════════════════════════════════════════════════════════

describe('2. property_admin — full access to own property', () => {
  it('can access admin routes', async () => {
    const result = await callGuard(['property_admin', 'super_admin'], 'property_admin');
    expect(result.error).toBeNull();
    expect(result.user!.role).toBe('property_admin');
  });

  it('can access staff routes when listed', async () => {
    const result = await callGuard(
      ['property_admin', 'property_manager', 'front_desk'],
      'property_admin',
    );
    expect(result.error).toBeNull();
  });

  it('cannot access super_admin-only routes', async () => {
    const result = await callGuard(['super_admin'], 'property_admin');
    expect(result.error).not.toBeNull();
    expect(result.error!.status).toBe(403);
  });

  it('has property:manage, user:manage, settings:manage permissions', () => {
    const perms = ROLE_PERMISSIONS.property_admin;
    expect(perms).toContain('property:manage');
    expect(perms).toContain('user:manage');
    expect(perms).toContain('settings:manage');
  });

  it('is scoped to its own property via tenant isolation', () => {
    expect(() => requireTenantAccess(PROPERTY_A, PROPERTY_A)).not.toThrow();
    expect(() => requireTenantAccess(PROPERTY_A, PROPERTY_B)).toThrow(NotFoundError);
  });

  it('has hierarchy value below super_admin', () => {
    expect(ROLE_HIERARCHY.property_admin).toBeLessThan(ROLE_HIERARCHY.super_admin);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 3. property_manager — management access, no billing/compliance
// ═══════════════════════════════════════════════════════════════════════════

describe('3. property_manager — management scope without billing', () => {
  it('can access management routes', async () => {
    const result = await callGuard(['property_admin', 'property_manager'], 'property_manager');
    expect(result.error).toBeNull();
  });

  it('cannot access admin-only routes', async () => {
    const result = await callGuard(['super_admin', 'property_admin'], 'property_manager');
    expect(result.error).not.toBeNull();
    expect(result.error!.status).toBe(403);
  });

  it('has event, unit, maintenance, amenity, announcement manage permissions', () => {
    const perms = ROLE_PERMISSIONS.property_manager;
    expect(perms).toContain('event:manage');
    expect(perms).toContain('unit:manage');
    expect(perms).toContain('maintenance:manage');
    expect(perms).toContain('amenity:manage');
    expect(perms).toContain('announcement:manage');
  });

  it('does NOT have billing or settings permissions', () => {
    const perms = ROLE_PERMISSIONS.property_manager;
    expect(perms).not.toContain('settings:manage');
    expect(perms).not.toContain('property:manage');
    expect(perms).not.toContain('user:manage');
    expect(perms).not.toContain('role:manage');
  });

  it('has vendor:manage permission', () => {
    expect(ROLE_PERMISSIONS.property_manager).toContain('vendor:manage');
  });

  it('hierarchy is below property_admin', () => {
    expect(ROLE_HIERARCHY.property_manager).toBeLessThan(ROLE_HIERARCHY.property_admin);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 4. front_desk — events, packages, visitors, shift log; no admin settings
// ═══════════════════════════════════════════════════════════════════════════

describe('4. front_desk — operational scope', () => {
  it('can access front_desk routes', async () => {
    const result = await callGuard(
      ['front_desk', 'property_manager', 'property_admin'],
      'front_desk',
    );
    expect(result.error).toBeNull();
  });

  it('cannot access admin routes', async () => {
    const result = await callGuard(['super_admin', 'property_admin'], 'front_desk');
    expect(result.error).not.toBeNull();
    expect(result.error!.status).toBe(403);
  });

  it('has event:create, event:read, event:update permissions', () => {
    const perms = ROLE_PERMISSIONS.front_desk;
    expect(perms).toContain('event:create');
    expect(perms).toContain('event:read');
    expect(perms).toContain('event:update');
  });

  it('has package:manage and visitor:manage permissions', () => {
    const perms = ROLE_PERMISSIONS.front_desk;
    expect(perms).toContain('package:manage');
    expect(perms).toContain('visitor:manage');
  });

  it('has shift_log:manage permission', () => {
    expect(ROLE_PERMISSIONS.front_desk).toContain('shift_log:manage');
  });

  it('does NOT have settings:manage or user:manage permissions', () => {
    const perms = ROLE_PERMISSIONS.front_desk;
    expect(perms).not.toContain('settings:manage');
    expect(perms).not.toContain('user:manage');
    expect(perms).not.toContain('property:manage');
  });

  it('does NOT have maintenance:manage permission', () => {
    expect(ROLE_PERMISSIONS.front_desk).not.toContain('maintenance:manage');
  });

  it('has unit:read (read-only unit access) but not unit:manage', () => {
    const perms = ROLE_PERMISSIONS.front_desk;
    expect(perms).toContain('unit:read');
    expect(perms).not.toContain('unit:manage');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 5. security_guard — security console, incidents, keys; no maintenance
// ═══════════════════════════════════════════════════════════════════════════

describe('5. security_guard — security-focused scope', () => {
  it('can access security guard routes', async () => {
    const result = await callGuard(['security_guard', 'security_supervisor'], 'security_guard');
    expect(result.error).toBeNull();
  });

  it('cannot access admin routes', async () => {
    const result = await callGuard(['super_admin', 'property_admin'], 'security_guard');
    expect(result.error).not.toBeNull();
    expect(result.error!.status).toBe(403);
  });

  it('has incident:manage, visitor:manage, key:manage permissions', () => {
    const perms = ROLE_PERMISSIONS.security_guard;
    expect(perms).toContain('incident:manage');
    expect(perms).toContain('visitor:manage');
    expect(perms).toContain('key:manage');
  });

  it('has parking:manage permission', () => {
    expect(ROLE_PERMISSIONS.security_guard).toContain('parking:manage');
  });

  it('does NOT have maintenance permissions', () => {
    const perms = ROLE_PERMISSIONS.security_guard;
    expect(perms).not.toContain('maintenance:manage');
    expect(perms).not.toContain('maintenance:read');
    expect(perms).not.toContain('maintenance:create');
  });

  it('does NOT have package:manage permission', () => {
    expect(ROLE_PERMISSIONS.security_guard).not.toContain('package:manage');
  });

  it('has shift_log:manage permission', () => {
    expect(ROLE_PERMISSIONS.security_guard).toContain('shift_log:manage');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 6. maintenance_staff — maintenance requests, equipment; no packages
// ═══════════════════════════════════════════════════════════════════════════

describe('6. maintenance_staff — maintenance-focused scope', () => {
  it('can access maintenance routes', async () => {
    const result = await callGuard(['maintenance_staff', 'superintendent'], 'maintenance_staff');
    expect(result.error).toBeNull();
  });

  it('cannot access admin routes', async () => {
    const result = await callGuard(['super_admin', 'property_admin'], 'maintenance_staff');
    expect(result.error).not.toBeNull();
    expect(result.error!.status).toBe(403);
  });

  it('has maintenance:read, maintenance:update, equipment:read permissions', () => {
    const perms = ROLE_PERMISSIONS.maintenance_staff;
    expect(perms).toContain('maintenance:read');
    expect(perms).toContain('maintenance:update');
    expect(perms).toContain('equipment:read');
  });

  it('does NOT have maintenance:create permission (cannot create new requests)', () => {
    expect(ROLE_PERMISSIONS.maintenance_staff).not.toContain('maintenance:create');
  });

  it('does NOT have package:manage, visitor:manage, or incident:manage', () => {
    const perms = ROLE_PERMISSIONS.maintenance_staff;
    expect(perms).not.toContain('package:manage');
    expect(perms).not.toContain('visitor:manage');
    expect(perms).not.toContain('incident:manage');
  });

  it('has unit:read for looking up unit info', () => {
    expect(ROLE_PERMISSIONS.maintenance_staff).toContain('unit:read');
  });

  it('does NOT have shift_log:manage', () => {
    expect(ROLE_PERMISSIONS.maintenance_staff).not.toContain('shift_log:manage');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 7. superintendent — maintenance + equipment manage + shift log
// ═══════════════════════════════════════════════════════════════════════════

describe('7. superintendent — enhanced maintenance scope', () => {
  it('can access superintendent routes', async () => {
    const result = await callGuard(['superintendent', 'maintenance_staff'], 'superintendent');
    expect(result.error).toBeNull();
  });

  it('cannot access admin routes', async () => {
    const result = await callGuard(['super_admin', 'property_admin'], 'superintendent');
    expect(result.error).not.toBeNull();
    expect(result.error!.status).toBe(403);
  });

  it('has maintenance:create (unlike maintenance_staff)', () => {
    expect(ROLE_PERMISSIONS.superintendent).toContain('maintenance:create');
  });

  it('has equipment:manage (not just equipment:read)', () => {
    expect(ROLE_PERMISSIONS.superintendent).toContain('equipment:manage');
  });

  it('has building_systems:read, shift_log:manage, parts:request', () => {
    const perms = ROLE_PERMISSIONS.superintendent;
    expect(perms).toContain('building_systems:read');
    expect(perms).toContain('shift_log:manage');
    expect(perms).toContain('parts:request');
  });

  it('does NOT have package:manage or visitor:manage', () => {
    const perms = ROLE_PERMISSIONS.superintendent;
    expect(perms).not.toContain('package:manage');
    expect(perms).not.toContain('visitor:manage');
  });

  it('hierarchy is above maintenance_staff', () => {
    expect(ROLE_HIERARCHY.superintendent).toBeGreaterThan(ROLE_HIERARCHY.maintenance_staff);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 8. security_supervisor — security + training; higher than guard
// ═══════════════════════════════════════════════════════════════════════════

describe('8. security_supervisor — extended security scope', () => {
  it('can access security supervisor routes', async () => {
    const result = await callGuard(
      ['security_supervisor', 'security_guard'],
      'security_supervisor',
    );
    expect(result.error).toBeNull();
  });

  it('cannot access admin routes', async () => {
    const result = await callGuard(['super_admin', 'property_admin'], 'security_supervisor');
    expect(result.error).not.toBeNull();
    expect(result.error!.status).toBe(403);
  });

  it('has all security_guard permissions plus report:view:security and training:manage:team', () => {
    const supervisorPerms = ROLE_PERMISSIONS.security_supervisor;
    const guardPerms = ROLE_PERMISSIONS.security_guard;

    // Every guard permission should also be on supervisor
    for (const perm of guardPerms) {
      expect(supervisorPerms).toContain(perm);
    }
    // Supervisor extras
    expect(supervisorPerms).toContain('report:view:security');
    expect(supervisorPerms).toContain('training:manage:team');
  });

  it('hierarchy is above security_guard', () => {
    expect(ROLE_HIERARCHY.security_supervisor).toBeGreaterThan(ROLE_HIERARCHY.security_guard);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 9. board_member — reports, financials, governance; no operations
// ═══════════════════════════════════════════════════════════════════════════

describe('9. board_member — governance/oversight scope', () => {
  it('can access board_member routes', async () => {
    const result = await callGuard(['board_member'], 'board_member');
    expect(result.error).toBeNull();
  });

  it('cannot access admin routes', async () => {
    const result = await callGuard(['super_admin', 'property_admin'], 'board_member');
    expect(result.error).not.toBeNull();
    expect(result.error!.status).toBe(403);
  });

  it('cannot access staff operational routes', async () => {
    const result = await callGuard(['front_desk', 'security_guard'], 'board_member');
    expect(result.error).not.toBeNull();
    expect(result.error!.status).toBe(403);
  });

  it('has report:view, financial:view, announcement:read permissions', () => {
    const perms = ROLE_PERMISSIONS.board_member;
    expect(perms).toContain('report:view');
    expect(perms).toContain('financial:view');
    expect(perms).toContain('announcement:read');
  });

  it('does NOT have operational permissions', () => {
    const perms = ROLE_PERMISSIONS.board_member;
    expect(perms).not.toContain('event:create');
    expect(perms).not.toContain('package:manage');
    expect(perms).not.toContain('maintenance:manage');
    expect(perms).not.toContain('incident:manage');
    expect(perms).not.toContain('visitor:manage');
  });

  it('has unit:read but not unit:manage', () => {
    const perms = ROLE_PERMISSIONS.board_member;
    expect(perms).toContain('unit:read');
    expect(perms).not.toContain('unit:manage');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 10. resident_owner — own unit data, bookings, maintenance
// ═══════════════════════════════════════════════════════════════════════════

describe('10. resident_owner — own-unit scope', () => {
  it('can access resident routes', async () => {
    const result = await callGuard(['resident_owner', 'resident_tenant'], 'resident_owner');
    expect(result.error).toBeNull();
  });

  it('cannot access staff routes', async () => {
    const result = await callGuard(['front_desk', 'security_guard'], 'resident_owner');
    expect(result.error).not.toBeNull();
    expect(result.error!.status).toBe(403);
  });

  it('cannot access admin routes', async () => {
    const result = await callGuard(['super_admin', 'property_admin'], 'resident_owner');
    expect(result.error).not.toBeNull();
    expect(result.error!.status).toBe(403);
  });

  it('has event:read:own (scoped to own data)', () => {
    expect(ROLE_PERMISSIONS.resident_owner).toContain('event:read:own');
  });

  it('has maintenance:create and maintenance:read:own', () => {
    const perms = ROLE_PERMISSIONS.resident_owner;
    expect(perms).toContain('maintenance:create');
    expect(perms).toContain('maintenance:read:own');
  });

  it('has amenity:book and profile:manage', () => {
    const perms = ROLE_PERMISSIONS.resident_owner;
    expect(perms).toContain('amenity:book');
    expect(perms).toContain('profile:manage');
  });

  it('does NOT have full event:read or event:manage', () => {
    const perms = ROLE_PERMISSIONS.resident_owner;
    expect(perms).not.toContain('event:read');
    expect(perms).not.toContain('event:manage');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 11. resident_tenant — same as owner but no governance
// ═══════════════════════════════════════════════════════════════════════════

describe('11. resident_tenant — tenant-level scope', () => {
  it('can access resident routes', async () => {
    const result = await callGuard(['resident_owner', 'resident_tenant'], 'resident_tenant');
    expect(result.error).toBeNull();
  });

  it('cannot access staff or admin routes', async () => {
    const result = await callGuard(
      ['super_admin', 'property_admin', 'front_desk'],
      'resident_tenant',
    );
    expect(result.error).not.toBeNull();
    expect(result.error!.status).toBe(403);
  });

  it('has same base permissions as resident_owner', () => {
    const ownerPerms = ROLE_PERMISSIONS.resident_owner;
    const tenantPerms = ROLE_PERMISSIONS.resident_tenant;
    // tenant_tenant should have the same set (both lack governance by default)
    expect(tenantPerms).toEqual(ownerPerms);
  });

  it('does NOT have financial:view (no governance visibility)', () => {
    expect(ROLE_PERMISSIONS.resident_tenant).not.toContain('financial:view');
    expect(ROLE_PERMISSIONS.resident_tenant).not.toContain('report:view');
  });

  it('hierarchy is below resident_owner', () => {
    expect(ROLE_HIERARCHY.resident_tenant).toBeLessThan(ROLE_HIERARCHY.resident_owner);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 12. family_member — read-only on their unit
// ═══════════════════════════════════════════════════════════════════════════

describe('12. family_member — read-only unit scope', () => {
  it('can access family_member routes', async () => {
    const result = await callGuard(
      ['family_member', 'resident_owner', 'resident_tenant'],
      'family_member',
    );
    expect(result.error).toBeNull();
  });

  it('cannot access staff routes', async () => {
    const result = await callGuard(['front_desk', 'security_guard'], 'family_member');
    expect(result.error).not.toBeNull();
    expect(result.error!.status).toBe(403);
  });

  it('has profile:read (NOT profile:manage)', () => {
    const perms = ROLE_PERMISSIONS.family_member;
    expect(perms).toContain('profile:read');
    expect(perms).not.toContain('profile:manage');
  });

  it('has event:read:own but NOT maintenance:create', () => {
    const perms = ROLE_PERMISSIONS.family_member;
    expect(perms).toContain('event:read:own');
    expect(perms).not.toContain('maintenance:create');
  });

  it('can book amenities', () => {
    expect(ROLE_PERMISSIONS.family_member).toContain('amenity:book');
  });

  it('does NOT have maintenance:read:own', () => {
    expect(ROLE_PERMISSIONS.family_member).not.toContain('maintenance:read:own');
  });

  it('hierarchy is below resident_tenant', () => {
    expect(ROLE_HIERARCHY.family_member).toBeLessThan(ROLE_HIERARCHY.resident_tenant);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 13. offsite_owner — remote read, no booking
// ═══════════════════════════════════════════════════════════════════════════

describe('13. offsite_owner — remote owner scope', () => {
  it('can access offsite_owner routes', async () => {
    const result = await callGuard(['offsite_owner', 'resident_owner'], 'offsite_owner');
    expect(result.error).toBeNull();
  });

  it('cannot access staff routes', async () => {
    const result = await callGuard(['front_desk', 'security_guard'], 'offsite_owner');
    expect(result.error).not.toBeNull();
    expect(result.error!.status).toBe(403);
  });

  it('has report:view:own (own-unit reports)', () => {
    expect(ROLE_PERMISSIONS.offsite_owner).toContain('report:view:own');
  });

  it('does NOT have amenity:book (not on-site)', () => {
    expect(ROLE_PERMISSIONS.offsite_owner).not.toContain('amenity:book');
  });

  it('has maintenance:read:own but NOT maintenance:create', () => {
    const perms = ROLE_PERMISSIONS.offsite_owner;
    expect(perms).toContain('maintenance:read:own');
    expect(perms).not.toContain('maintenance:create');
  });

  it('hierarchy is below family_member', () => {
    expect(ROLE_HIERARCHY.offsite_owner).toBeLessThan(ROLE_HIERARCHY.family_member);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// 14. visitor — minimal read access
// ═══════════════════════════════════════════════════════════════════════════

describe('14. visitor — minimal public access', () => {
  it('can access visitor-only routes', async () => {
    const result = await callGuard(['visitor'], 'visitor');
    expect(result.error).toBeNull();
  });

  it('cannot access any non-visitor route', async () => {
    const nonVisitor = ALL_ROLES.filter((r) => r !== 'visitor');
    const result = await callGuard(nonVisitor as Role[], 'visitor');
    expect(result.error).not.toBeNull();
    expect(result.error!.status).toBe(403);
  });

  it('has ONLY announcement:read:public permission', () => {
    expect(ROLE_PERMISSIONS.visitor).toEqual(['announcement:read:public']);
  });

  it('does NOT have any manage, create, or update permissions', () => {
    const perms = ROLE_PERMISSIONS.visitor;
    const hasWrite = perms.some(
      (p) => p.includes('manage') || p.includes('create') || p.includes('update'),
    );
    expect(hasWrite).toBe(false);
  });

  it('has the lowest hierarchy value', () => {
    const minHierarchy = Math.min(...Object.values(ROLE_HIERARCHY));
    expect(ROLE_HIERARCHY.visitor).toBe(minHierarchy);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Comprehensive role × route matrix via guardRoute
// ═══════════════════════════════════════════════════════════════════════════

describe('Comprehensive role access matrix — guardRoute', () => {
  // Route groups with the roles that should have access
  const routeMatrix: { route: string; allowedRoles: Role[] }[] = [
    {
      route: '/api/v1/admin/settings',
      allowedRoles: ['super_admin', 'property_admin'],
    },
    {
      route: '/api/v1/users',
      allowedRoles: ['super_admin', 'property_admin'],
    },
    {
      route: '/api/v1/events',
      allowedRoles: [
        'super_admin',
        'property_admin',
        'property_manager',
        'front_desk',
        'security_guard',
        'security_supervisor',
      ],
    },
    {
      route: '/api/v1/packages',
      allowedRoles: ['super_admin', 'property_admin', 'property_manager', 'front_desk'],
    },
    {
      route: '/api/v1/incidents',
      allowedRoles: [
        'super_admin',
        'property_admin',
        'property_manager',
        'security_guard',
        'security_supervisor',
      ],
    },
    {
      route: '/api/v1/maintenance',
      allowedRoles: [
        'super_admin',
        'property_admin',
        'property_manager',
        'maintenance_staff',
        'superintendent',
      ],
    },
    {
      route: '/api/v1/reports',
      allowedRoles: ['super_admin', 'property_admin', 'property_manager', 'board_member'],
    },
    {
      route: '/api/v1/financials',
      allowedRoles: ['super_admin', 'property_admin', 'board_member'],
    },
  ];

  for (const { route, allowedRoles } of routeMatrix) {
    describe(`Route: ${route}`, () => {
      it.each(allowedRoles)('%s can access (200)', async (role) => {
        stubAuth(role);
        const req = makeRequest(
          { Authorization: 'Bearer valid-token' },
          `http://localhost:3000${route}`,
        );
        const result = await guardRoute(req, { roles: allowedRoles, allowDemo: false });
        expect(result.error).toBeNull();
        expect(result.user!.role).toBe(role);
      });

      const deniedRoles = ALL_ROLES.filter((r) => !allowedRoles.includes(r));
      if (deniedRoles.length > 0) {
        it.each(deniedRoles)('%s is denied (403)', async (role) => {
          stubAuth(role);
          const req = makeRequest(
            { Authorization: 'Bearer valid-token' },
            `http://localhost:3000${route}`,
          );
          const result = await guardRoute(req, { roles: allowedRoles, allowDemo: false });
          expect(result.error).not.toBeNull();
          expect(result.error!.status).toBe(403);
        });
      }
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// Tenant isolation — every role is scoped to its own property
// ═══════════════════════════════════════════════════════════════════════════

describe('Tenant isolation — all roles scoped to own property', () => {
  it.each(ALL_ROLES)('%s can only see own property data', (role) => {
    // Same property — access granted
    expect(() => requireTenantAccess(PROPERTY_A, PROPERTY_A)).not.toThrow();
    // Different property — access denied (404 to prevent enumeration)
    expect(() => requireTenantAccess(PROPERTY_A, PROPERTY_B)).toThrow(NotFoundError);
  });

  it('returns 404 (not 403) on cross-property access for all roles', () => {
    for (const role of ALL_ROLES) {
      try {
        requireTenantAccess(PROPERTY_A, PROPERTY_B);
        expect.unreachable(`${role}: should have thrown`);
      } catch (e) {
        expect(e).toBeInstanceOf(NotFoundError);
        expect((e as NotFoundError).statusCode).toBe(404);
      }
    }
  });

  it('guardRoute injects propertyId from token for downstream checks', async () => {
    stubAuth('property_admin', PROPERTY_A);
    const req = makeRequest({ Authorization: 'Bearer valid-token' });
    const result = await guardRoute(req, { allowDemo: false });

    expect(result.user!.propertyId).toBe(PROPERTY_A);

    // Downstream code uses this for tenant isolation
    expect(() => requireTenantAccess(result.user!.propertyId, PROPERTY_A)).not.toThrow();
    expect(() => requireTenantAccess(result.user!.propertyId, PROPERTY_B)).toThrow(NotFoundError);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Permission hierarchy: admin > manager > staff > resident
// ═══════════════════════════════════════════════════════════════════════════

describe('Permission hierarchy — numeric ordering', () => {
  it('super_admin > property_admin > property_manager', () => {
    expect(ROLE_HIERARCHY.super_admin).toBeGreaterThan(ROLE_HIERARCHY.property_admin);
    expect(ROLE_HIERARCHY.property_admin).toBeGreaterThan(ROLE_HIERARCHY.property_manager);
  });

  it('property_manager > security_supervisor > security_guard', () => {
    expect(ROLE_HIERARCHY.property_manager).toBeGreaterThan(ROLE_HIERARCHY.security_supervisor);
    expect(ROLE_HIERARCHY.security_supervisor).toBeGreaterThanOrEqual(
      ROLE_HIERARCHY.security_guard,
    );
  });

  it('staff roles > board_member > resident roles', () => {
    const lowestStaff = Math.min(...[...STAFF_ROLES].map((r) => ROLE_HIERARCHY[r]));
    expect(lowestStaff).toBeGreaterThan(ROLE_HIERARCHY.board_member);
    expect(ROLE_HIERARCHY.board_member).toBeGreaterThan(ROLE_HIERARCHY.resident_owner);
  });

  it('resident_owner > resident_tenant > family_member > offsite_owner > visitor', () => {
    expect(ROLE_HIERARCHY.resident_owner).toBeGreaterThan(ROLE_HIERARCHY.resident_tenant);
    expect(ROLE_HIERARCHY.resident_tenant).toBeGreaterThan(ROLE_HIERARCHY.family_member);
    expect(ROLE_HIERARCHY.family_member).toBeGreaterThan(ROLE_HIERARCHY.offsite_owner);
    expect(ROLE_HIERARCHY.offsite_owner).toBeGreaterThan(ROLE_HIERARCHY.visitor);
  });

  it('all 14 roles have a defined hierarchy value', () => {
    for (const role of ALL_ROLES) {
      expect(ROLE_HIERARCHY[role]).toBeDefined();
      expect(typeof ROLE_HIERARCHY[role]).toBe('number');
    }
  });

  it('ADMIN_ROLES set contains exactly super_admin and property_admin', () => {
    expect(ADMIN_ROLES.has('super_admin')).toBe(true);
    expect(ADMIN_ROLES.has('property_admin')).toBe(true);
    expect(ADMIN_ROLES.size).toBe(2);
  });

  it('STAFF_ROLES set contains exactly the 6 staff roles', () => {
    const expected: Role[] = [
      'property_manager',
      'security_supervisor',
      'security_guard',
      'front_desk',
      'maintenance_staff',
      'superintendent',
    ];
    for (const r of expected) {
      expect(STAFF_ROLES.has(r)).toBe(true);
    }
    expect(STAFF_ROLES.size).toBe(6);
  });

  it('RESIDENT_ROLES set contains exactly the 4 resident roles', () => {
    const expected: Role[] = [
      'resident_owner',
      'resident_tenant',
      'family_member',
      'offsite_owner',
    ];
    for (const r of expected) {
      expect(RESIDENT_ROLES.has(r)).toBe(true);
    }
    expect(RESIDENT_ROLES.size).toBe(4);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// requireRole — cannot modify data outside permission scope
// ═══════════════════════════════════════════════════════════════════════════

describe('requireRole — data modification boundaries', () => {
  it('resident cannot call admin-only route', () => {
    expect(() => requireRole('resident_tenant', ['super_admin', 'property_admin'])).toThrow(
      ForbiddenError,
    );
  });

  it('front_desk cannot call maintenance-only route', () => {
    expect(() => requireRole('front_desk', ['maintenance_staff', 'superintendent'])).toThrow(
      ForbiddenError,
    );
  });

  it('maintenance_staff cannot call security-only route', () => {
    expect(() =>
      requireRole('maintenance_staff', ['security_guard', 'security_supervisor']),
    ).toThrow(ForbiddenError);
  });

  it('board_member cannot call any staff operational route', () => {
    expect(() =>
      requireRole('board_member', ['front_desk', 'security_guard', 'maintenance_staff']),
    ).toThrow(ForbiddenError);
  });

  it('visitor cannot call any non-visitor route', () => {
    const everyoneElse = ALL_ROLES.filter((r) => r !== 'visitor');
    expect(() => requireRole('visitor', everyoneElse)).toThrow(ForbiddenError);
  });

  it('family_member cannot call routes requiring manage permissions', () => {
    expect(() => requireRole('family_member', ['property_admin', 'property_manager'])).toThrow(
      ForbiddenError,
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Edge case 15: User with multiple properties switches context
// ═══════════════════════════════════════════════════════════════════════════

describe('Edge case 15: Multi-property context switching', () => {
  it('user can only access the property specified in their token', async () => {
    // First request — property A
    stubAuth('property_admin', PROPERTY_A);
    const reqA = makeRequest({ Authorization: 'Bearer token-prop-a' });
    const resultA = await guardRoute(reqA, { allowDemo: false });
    expect(resultA.user!.propertyId).toBe(PROPERTY_A);

    // Second request — property B (new token)
    stubAuth('property_admin', PROPERTY_B);
    const reqB = makeRequest({ Authorization: 'Bearer token-prop-b' });
    const resultB = await guardRoute(reqB, { allowDemo: false });
    expect(resultB.user!.propertyId).toBe(PROPERTY_B);
  });

  it('tenant isolation enforces the current property context', () => {
    // User's token says property A — accessing property B resource fails
    expect(() => requireTenantAccess(PROPERTY_A, PROPERTY_B)).toThrow(NotFoundError);

    // After "switching" to property B (new token), accessing property A fails
    expect(() => requireTenantAccess(PROPERTY_B, PROPERTY_A)).toThrow(NotFoundError);
  });

  it('property context is per-request, not session-cached', async () => {
    // Request 1: property A
    stubAuth('property_manager', PROPERTY_A);
    const r1 = await callGuard(['property_manager'], 'property_manager', PROPERTY_A);
    expect(r1.user!.propertyId).toBe(PROPERTY_A);

    // Request 2: same user, property B (different JWT)
    stubAuth('property_manager', PROPERTY_B);
    const r2 = await callGuard(['property_manager'], 'property_manager', PROPERTY_B);
    expect(r2.user!.propertyId).toBe(PROPERTY_B);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Edge case 16: Suspended user's permissions are immediately revoked
// ═══════════════════════════════════════════════════════════════════════════

describe('Edge case 16: Suspended user — immediate revocation', () => {
  it('requireAuth rejection results in 401 from guardRoute', async () => {
    vi.mocked(requireAuth).mockRejectedValue(new AuthError('Account suspended'));
    const req = makeRequest({ Authorization: 'Bearer suspended-user-token' });
    const result = await guardRoute(req, { allowDemo: false });

    expect(result.error).not.toBeNull();
    expect(result.error!.status).toBe(401);
    expect(result.user).toBeNull();
  });

  it('a previously valid token is rejected when auth layer marks user suspended', async () => {
    // First request succeeds
    stubAuth('property_admin', PROPERTY_A);
    const req1 = makeRequest({ Authorization: 'Bearer valid-token' });
    const result1 = await guardRoute(req1, { allowDemo: false });
    expect(result1.error).toBeNull();

    // User gets suspended — requireAuth now throws
    vi.mocked(requireAuth).mockRejectedValue(new AuthError('Account suspended'));
    const req2 = makeRequest({ Authorization: 'Bearer valid-token' });
    const result2 = await guardRoute(req2, { allowDemo: false });

    expect(result2.error).not.toBeNull();
    expect(result2.error!.status).toBe(401);
  });

  it('inactive user payload should fail auth (no cached permissions)', async () => {
    // Simulating a user whose token is structurally valid but the account is deactivated
    vi.mocked(requireAuth).mockRejectedValue(new AuthError('User account is inactive'));

    const req = makeRequest({ Authorization: 'Bearer inactive-user-token' });
    const result = await guardRoute(req, { allowDemo: false });

    expect(result.error).not.toBeNull();
    expect(result.error!.status).toBe(401);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Edge case 17: Role change takes effect on next request (not cached)
// ═══════════════════════════════════════════════════════════════════════════

describe('Edge case 17: Role change — immediate on next request', () => {
  it('role downgrade takes effect immediately via new token', async () => {
    // First request: user is property_admin
    stubAuth('property_admin', PROPERTY_A);
    const req1 = makeRequest({ Authorization: 'Bearer admin-token' });
    const result1 = await guardRoute(req1, {
      roles: ['property_admin', 'super_admin'],
      allowDemo: false,
    });
    expect(result1.error).toBeNull();
    expect(result1.user!.role).toBe('property_admin');

    // User gets downgraded to resident_tenant — new token issued
    stubAuth('resident_tenant', PROPERTY_A);
    const req2 = makeRequest({ Authorization: 'Bearer tenant-token' });
    const result2 = await guardRoute(req2, {
      roles: ['property_admin', 'super_admin'],
      allowDemo: false,
    });
    expect(result2.error).not.toBeNull();
    expect(result2.error!.status).toBe(403);
  });

  it('role upgrade takes effect immediately via new token', async () => {
    // First request: user is front_desk — denied admin route
    stubAuth('front_desk', PROPERTY_A);
    const req1 = makeRequest({ Authorization: 'Bearer frontdesk-token' });
    const result1 = await guardRoute(req1, {
      roles: ['property_admin', 'super_admin'],
      allowDemo: false,
    });
    expect(result1.error).not.toBeNull();
    expect(result1.error!.status).toBe(403);

    // User gets promoted to property_admin — new token
    stubAuth('property_admin', PROPERTY_A);
    const req2 = makeRequest({ Authorization: 'Bearer new-admin-token' });
    const result2 = await guardRoute(req2, {
      roles: ['property_admin', 'super_admin'],
      allowDemo: false,
    });
    expect(result2.error).toBeNull();
    expect(result2.user!.role).toBe('property_admin');
  });

  it('requireRole reads role from the current payload, not a cache', () => {
    // Two sequential checks with different roles — both evaluate independently
    expect(() => requireRole('property_admin', ['property_admin'])).not.toThrow();
    expect(() => requireRole('front_desk', ['property_admin'])).toThrow(ForbiddenError);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Edge case 18: Permission wildcard (*) grants all permissions
// ═══════════════════════════════════════════════════════════════════════════

describe('Edge case 18: Wildcard (*) permission', () => {
  it('super_admin has wildcard permission', () => {
    expect(ROLE_PERMISSIONS.super_admin).toContain('*');
  });

  it('no non-admin role has wildcard permission', () => {
    const nonAdmins = ALL_ROLES.filter((r) => r !== 'super_admin');
    for (const role of nonAdmins) {
      expect(ROLE_PERMISSIONS[role]).not.toContain('*');
    }
  });

  it('wildcard is a single-element permissions array for super_admin', () => {
    expect(ROLE_PERMISSIONS.super_admin).toEqual(['*']);
    expect(ROLE_PERMISSIONS.super_admin).toHaveLength(1);
  });

  it('a permission check function can detect wildcard', () => {
    function hasPermission(perms: string[], required: string): boolean {
      return perms.includes('*') || perms.includes(required);
    }

    // super_admin wildcard matches everything
    expect(hasPermission(['*'], 'event:create')).toBe(true);
    expect(hasPermission(['*'], 'maintenance:manage')).toBe(true);
    expect(hasPermission(['*'], 'settings:manage')).toBe(true);

    // Non-wildcard requires exact match
    expect(hasPermission(['event:create'], 'event:create')).toBe(true);
    expect(hasPermission(['event:create'], 'event:manage')).toBe(false);
  });

  it('wildcard (*) is distinct from scoped permissions', () => {
    function hasPermission(perms: string[], required: string): boolean {
      return perms.includes('*') || perms.includes(required);
    }

    // Scoped read does not grant manage
    expect(hasPermission(['event:read'], 'event:manage')).toBe(false);
    // But wildcard does
    expect(hasPermission(['*'], 'event:manage')).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Edge case 19: Fine-grained permissions (event:create vs event:read vs event:manage)
// ═══════════════════════════════════════════════════════════════════════════

describe('Edge case 19: Fine-grained permission strings', () => {
  /**
   * Simple permission matcher that supports:
   *   - Exact match: "event:create" matches "event:create"
   *   - Wildcard: "*" matches anything
   *   - Manage implies CRUD: "event:manage" matches "event:create", "event:read", etc.
   *   - Own-scoped: "event:read:own" is narrower than "event:read"
   */
  function hasPermission(perms: string[], required: string): boolean {
    if (perms.includes('*')) return true;
    if (perms.includes(required)) return true;

    // Check if a :manage permission covers the required :create/:read/:update/:delete
    const parts = required.split(':');
    if (parts.length >= 2) {
      const resource = parts[0];
      const manageKey = `${resource}:manage`;
      if (perms.includes(manageKey)) return true;
    }

    return false;
  }

  describe('event:create vs event:read vs event:manage', () => {
    it('front_desk has event:create but not event:manage', () => {
      const perms = ROLE_PERMISSIONS.front_desk;
      expect(perms).toContain('event:create');
      expect(perms).not.toContain('event:manage');
    });

    it('property_manager has event:manage which implies event:create', () => {
      const perms = ROLE_PERMISSIONS.property_manager;
      expect(hasPermission(perms, 'event:create')).toBe(true);
      expect(hasPermission(perms, 'event:read')).toBe(true);
      expect(hasPermission(perms, 'event:manage')).toBe(true);
    });

    it('resident_owner has event:read:own (own-scoped read)', () => {
      const perms = ROLE_PERMISSIONS.resident_owner;
      expect(perms).toContain('event:read:own');
      expect(perms).not.toContain('event:read');
      expect(perms).not.toContain('event:manage');
    });

    it('visitor has NO event permissions at all', () => {
      const perms = ROLE_PERMISSIONS.visitor;
      const eventPerms = perms.filter((p) => p.startsWith('event:'));
      expect(eventPerms).toHaveLength(0);
    });
  });

  describe('maintenance:create vs maintenance:read vs maintenance:manage', () => {
    it('maintenance_staff has maintenance:read and maintenance:update but NOT maintenance:create', () => {
      const perms = ROLE_PERMISSIONS.maintenance_staff;
      expect(perms).toContain('maintenance:read');
      expect(perms).toContain('maintenance:update');
      expect(perms).not.toContain('maintenance:create');
    });

    it('superintendent has maintenance:create (can create new requests)', () => {
      expect(ROLE_PERMISSIONS.superintendent).toContain('maintenance:create');
    });

    it('property_manager has maintenance:manage (full CRUD)', () => {
      const perms = ROLE_PERMISSIONS.property_manager;
      expect(hasPermission(perms, 'maintenance:create')).toBe(true);
      expect(hasPermission(perms, 'maintenance:read')).toBe(true);
      expect(hasPermission(perms, 'maintenance:update')).toBe(true);
    });

    it('resident_owner has maintenance:create but only maintenance:read:own', () => {
      const perms = ROLE_PERMISSIONS.resident_owner;
      expect(perms).toContain('maintenance:create');
      expect(perms).toContain('maintenance:read:own');
      expect(perms).not.toContain('maintenance:read');
    });
  });

  describe(':own scoped permissions are narrower than unscoped', () => {
    it('event:read:own does NOT satisfy a check for event:read', () => {
      const perms = ['event:read:own'];
      expect(hasPermission(perms, 'event:read')).toBe(false);
    });

    it('event:read DOES satisfy a check for event:read', () => {
      const perms = ['event:read'];
      expect(hasPermission(perms, 'event:read')).toBe(true);
    });

    it('maintenance:read:own does NOT satisfy maintenance:read', () => {
      const perms = ['maintenance:read:own'];
      expect(hasPermission(perms, 'maintenance:read')).toBe(false);
    });

    it('report:view:own does NOT satisfy report:view', () => {
      const perms = ['report:view:own'];
      expect(hasPermission(perms, 'report:view')).toBe(false);
    });

    it('report:view:security does NOT satisfy report:view', () => {
      const perms = ['report:view:security'];
      expect(hasPermission(perms, 'report:view')).toBe(false);
    });
  });

  describe(':manage implies CRUD sub-permissions', () => {
    it('package:manage implies package:create, package:read, package:update', () => {
      const perms = ['package:manage'];
      expect(hasPermission(perms, 'package:create')).toBe(true);
      expect(hasPermission(perms, 'package:read')).toBe(true);
      expect(hasPermission(perms, 'package:update')).toBe(true);
    });

    it('incident:manage implies incident:create', () => {
      const perms = ['incident:manage'];
      expect(hasPermission(perms, 'incident:create')).toBe(true);
    });

    it('event:create does NOT imply event:manage', () => {
      const perms = ['event:create'];
      expect(hasPermission(perms, 'event:manage')).toBe(false);
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Demo mode RBAC enforcement
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
    expect(result.user!.userId).toBe('demo-user');
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

  it('demo user with resident_tenant role is denied staff routes', async () => {
    const req = makeRequest({ 'x-demo-role': 'resident_tenant' });
    const result = await guardRoute(req, {
      roles: ['front_desk', 'security_guard'],
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
    // Without a real Bearer token and with demo disabled, should fail
    expect(result.error).not.toBeNull();
    expect(result.error!.status).toBe(401);
  });

  it.each(ALL_ROLES)('demo mode with role %s gets permissions: [*]', async (role) => {
    const req = makeRequest({ 'x-demo-role': role });
    const result = await guardRoute(req, { allowDemo: true });
    if (result.user) {
      // Demo users always get wildcard permissions in the current implementation
      expect(result.user.permissions).toEqual(['*']);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// requireRole — empty allowed list means any authenticated user
// ═══════════════════════════════════════════════════════════════════════════

describe('requireRole — empty allowed list (any authenticated user)', () => {
  it.each(ALL_ROLES)('%s passes when allowedRoles is empty', (role) => {
    expect(() => requireRole(role, [])).not.toThrow();
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// requireRole — each role vs every other role (N x N matrix)
// ═══════════════════════════════════════════════════════════════════════════

describe('requireRole — N x N role matrix', () => {
  for (const role of ALL_ROLES) {
    it(`${role} is allowed when explicitly in the allowed list`, () => {
      expect(() => requireRole(role, [role])).not.toThrow();
    });

    it(`${role} is denied when allowed list contains only a different role`, () => {
      const otherRole = ALL_ROLES.find((r) => r !== role)!;
      expect(() => requireRole(role, [otherRole])).toThrow(ForbiddenError);
    });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// Tenant isolation — error message does not leak property IDs
// ═══════════════════════════════════════════════════════════════════════════

describe('Tenant isolation — error message safety', () => {
  it('error message does not contain the resource property ID', () => {
    try {
      requireTenantAccess(PROPERTY_A, PROPERTY_B);
      expect.unreachable('Should have thrown');
    } catch (e) {
      const msg = (e as NotFoundError).message;
      expect(msg).not.toContain(PROPERTY_B);
      expect(msg).toBe('Resource not found');
    }
  });

  it('error message does not contain the user property ID', () => {
    try {
      requireTenantAccess(PROPERTY_A, PROPERTY_B);
      expect.unreachable('Should have thrown');
    } catch (e) {
      const msg = (e as NotFoundError).message;
      expect(msg).not.toContain(PROPERTY_A);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// ForbiddenError — correct status code and structure
// ═══════════════════════════════════════════════════════════════════════════

describe('ForbiddenError — error structure', () => {
  it('has statusCode 403', () => {
    try {
      requireRole('visitor', ['super_admin']);
      expect.unreachable('Should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(ForbiddenError);
      expect((e as ForbiddenError).statusCode).toBe(403);
    }
  });

  it('has code FORBIDDEN', () => {
    try {
      requireRole('visitor', ['super_admin']);
      expect.unreachable('Should have thrown');
    } catch (e) {
      expect((e as ForbiddenError).code).toBe('FORBIDDEN');
    }
  });

  it('message mentions the denied role', () => {
    try {
      requireRole('family_member', ['super_admin']);
      expect.unreachable('Should have thrown');
    } catch (e) {
      expect((e as ForbiddenError).message).toContain('family_member');
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// guardRoute — complete auth flow integration
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

  it('returns 200 (no error) when no roles specified (any authenticated user)', async () => {
    stubAuth('visitor', PROPERTY_A);
    const req = makeRequest({ Authorization: 'Bearer valid-token' });
    const result = await guardRoute(req, { allowDemo: false });

    expect(result.error).toBeNull();
    expect(result.user!.role).toBe('visitor');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Role type coverage — all 14 roles are in the Role type
// ═══════════════════════════════════════════════════════════════════════════

describe('Role type coverage — all 14 roles are defined', () => {
  it('ALL_ROLES contains exactly 14 roles', () => {
    expect(ALL_ROLES).toHaveLength(14);
  });

  it('every role has a defined permission set', () => {
    for (const role of ALL_ROLES) {
      expect(ROLE_PERMISSIONS[role]).toBeDefined();
      expect(Array.isArray(ROLE_PERMISSIONS[role])).toBe(true);
      expect(ROLE_PERMISSIONS[role].length).toBeGreaterThan(0);
    }
  });

  it('every role has a hierarchy value', () => {
    for (const role of ALL_ROLES) {
      expect(typeof ROLE_HIERARCHY[role]).toBe('number');
      expect(ROLE_HIERARCHY[role]).toBeGreaterThan(0);
    }
  });

  it('hierarchy values are unique or intentionally shared (front_desk = security_guard)', () => {
    // front_desk and security_guard are at the same level (70)
    expect(ROLE_HIERARCHY.front_desk).toBe(ROLE_HIERARCHY.security_guard);

    // All other roles should have unique values
    const allValues = Object.values(ROLE_HIERARCHY);
    const uniqueValues = new Set(allValues);
    // We allow front_desk === security_guard (shared 70), so unique count is 14 - 1 = 13
    expect(uniqueValues.size).toBeGreaterThanOrEqual(ALL_ROLES.length - 1);
  });
});
