/**
 * Concierge — RBAC Middleware Tests
 *
 * Tests for role-based access control across all 12 roles.
 * Per Security Rulebook B.3.
 */

import { describe, it, expect } from 'vitest';

import { requireRole } from '@/server/middleware/rbac';
import { ForbiddenError } from '@/server/errors';
import type { Role } from '@/types';

// ---------------------------------------------------------------------------
// All 12 roles
// ---------------------------------------------------------------------------

const ALL_ROLES: Role[] = [
  'super_admin',
  'property_admin',
  'property_manager',
  'front_desk',
  'security_guard',
  'maintenance_staff',
  'board_member',
  'resident_owner',
  'resident_tenant',
  'family_member',
  'offsite_owner',
  'visitor',
];

// ---------------------------------------------------------------------------
// requireRole — basic behavior
// ---------------------------------------------------------------------------

describe('requireRole', () => {
  it('does not throw when user role is in the allowed list', () => {
    expect(() => {
      requireRole('property_admin', ['property_admin', 'super_admin']);
    }).not.toThrow();
  });

  it('throws ForbiddenError when user role is NOT in the allowed list', () => {
    expect(() => {
      requireRole('visitor', ['property_admin', 'super_admin']);
    }).toThrow(ForbiddenError);
  });

  it('does not throw when allowedRoles is empty (any authenticated user)', () => {
    for (const role of ALL_ROLES) {
      expect(() => requireRole(role, [])).not.toThrow();
    }
  });

  it('throws ForbiddenError with descriptive message', () => {
    try {
      requireRole('resident_tenant', ['property_admin']);
      expect.unreachable('Should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(ForbiddenError);
      expect((e as ForbiddenError).message).toContain('resident_tenant');
    }
  });
});

// ---------------------------------------------------------------------------
// super_admin
// ---------------------------------------------------------------------------

describe('super_admin access', () => {
  it('can access super_admin-only routes', () => {
    expect(() => requireRole('super_admin', ['super_admin'])).not.toThrow();
  });

  it('can access admin routes', () => {
    expect(() => requireRole('super_admin', ['super_admin', 'property_admin'])).not.toThrow();
  });

  it('is denied if not explicitly in the allowed list', () => {
    // super_admin does NOT auto-bypass — must be in the list
    expect(() => requireRole('super_admin', ['property_admin'])).toThrow(ForbiddenError);
  });
});

// ---------------------------------------------------------------------------
// property_admin
// ---------------------------------------------------------------------------

describe('property_admin access', () => {
  it('can access property-level admin routes', () => {
    expect(() =>
      requireRole('property_admin', ['property_admin', 'property_manager']),
    ).not.toThrow();
  });

  it('is denied access to super_admin-only routes', () => {
    expect(() => requireRole('property_admin', ['super_admin'])).toThrow(ForbiddenError);
  });
});

// ---------------------------------------------------------------------------
// Staff roles
// ---------------------------------------------------------------------------

describe('staff role access', () => {
  const staffRoles: Role[] = [
    'property_manager',
    'front_desk',
    'security_guard',
    'maintenance_staff',
  ];

  it.each(staffRoles)('%s can access staff-level routes', (role) => {
    expect(() => requireRole(role, staffRoles)).not.toThrow();
  });

  it.each(staffRoles)('%s is denied access to admin routes', (role) => {
    expect(() => requireRole(role, ['super_admin', 'property_admin'])).toThrow(ForbiddenError);
  });
});

// ---------------------------------------------------------------------------
// Resident roles
// ---------------------------------------------------------------------------

describe('resident role access', () => {
  const residentRoles: Role[] = [
    'resident_owner',
    'resident_tenant',
    'family_member',
    'offsite_owner',
  ];

  it.each(residentRoles)('%s can access resident routes', (role) => {
    expect(() => requireRole(role, residentRoles)).not.toThrow();
  });

  it.each(residentRoles)('%s is denied access to admin routes', (role) => {
    expect(() => requireRole(role, ['super_admin', 'property_admin'])).toThrow(ForbiddenError);
  });

  it.each(residentRoles)('%s is denied access to staff routes', (role) => {
    expect(() => requireRole(role, ['front_desk', 'security_guard', 'maintenance_staff'])).toThrow(
      ForbiddenError,
    );
  });
});

// ---------------------------------------------------------------------------
// board_member
// ---------------------------------------------------------------------------

describe('board_member access', () => {
  it('can access board-member routes', () => {
    expect(() => requireRole('board_member', ['board_member'])).not.toThrow();
  });

  it('is denied access to admin routes', () => {
    expect(() => requireRole('board_member', ['super_admin', 'property_admin'])).toThrow(
      ForbiddenError,
    );
  });

  it('is denied access to front-desk routes', () => {
    expect(() => requireRole('board_member', ['front_desk'])).toThrow(ForbiddenError);
  });
});

// ---------------------------------------------------------------------------
// visitor
// ---------------------------------------------------------------------------

describe('visitor access', () => {
  it('can access visitor routes', () => {
    expect(() => requireRole('visitor', ['visitor'])).not.toThrow();
  });

  it('is denied access to any non-visitor route', () => {
    const nonVisitorRoles = ALL_ROLES.filter((r) => r !== 'visitor');
    expect(() => requireRole('visitor', nonVisitorRoles)).toThrow(ForbiddenError);
  });
});

// ---------------------------------------------------------------------------
// All roles — comprehensive matrix
// ---------------------------------------------------------------------------

describe('comprehensive role matrix', () => {
  it.each(ALL_ROLES)('%s is allowed when explicitly in the allowed list', (role) => {
    expect(() => requireRole(role, [role])).not.toThrow();
  });

  it.each(ALL_ROLES)(
    '%s returns 403 when not in a single-role allowed list of a different role',
    (role) => {
      // Pick a role that is NOT the current one
      const otherRole = ALL_ROLES.find((r) => r !== role)!;
      expect(() => requireRole(role, [otherRole])).toThrow(ForbiddenError);
    },
  );
});
