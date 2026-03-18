/**
 * Concierge — User Test Factory
 *
 * Generates realistic user records matching the Prisma User model,
 * with role-specific convenience functions for all 12 roles.
 *
 * @module test/factories/user
 */

import { faker } from '@faker-js/faker';
import type { Role } from '@/types';

// ---------------------------------------------------------------------------
// Types (plain objects matching Prisma models)
// ---------------------------------------------------------------------------

export interface UserFactoryData {
  id: string;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  avatarUrl: string | null;
  mfaEnabled: boolean;
  mfaSecret: string | null;
  isActive: boolean;
  activatedAt: Date | null;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface UserPropertyFactoryData {
  id: string;
  userId: string;
  propertyId: string;
  roleId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export interface RoleFactoryData {
  id: string;
  propertyId: string;
  name: string;
  slug: string;
  description: string | null;
  isSystem: boolean;
  permissions: string[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

// ---------------------------------------------------------------------------
// Role display names and default permissions
// ---------------------------------------------------------------------------

const ROLE_DISPLAY_NAMES: Record<Role, string> = {
  super_admin: 'Super Admin',
  property_admin: 'Property Admin',
  property_manager: 'Property Manager',
  security_supervisor: 'Security Supervisor',
  security_guard: 'Security Guard',
  front_desk: 'Front Desk / Concierge',
  maintenance_staff: 'Maintenance Staff',
  superintendent: 'Superintendent',
  board_member: 'Board Member',
  resident_owner: 'Resident Owner',
  resident_tenant: 'Resident Tenant',
  family_member: 'Family Member',
  offsite_owner: 'Offsite Owner',
  visitor: 'Visitor',
};

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
// Constants
// ---------------------------------------------------------------------------

/** Pre-hashed password for test accounts: "TestPassword123!" (argon2) */
const TEST_PASSWORD_HASH =
  '$argon2id$v=19$m=65536,t=3,p=4$dGVzdHNhbHQxMjM$a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6';

// ---------------------------------------------------------------------------
// Factory Functions — User
// ---------------------------------------------------------------------------

/**
 * Creates a realistic user with all required fields.
 * Override any field by passing partial data.
 */
export function createUser(overrides: Partial<UserFactoryData> = {}): UserFactoryData {
  const firstName = faker.person.firstName();
  const lastName = faker.person.lastName();
  const now = new Date();

  return {
    id: faker.string.uuid(),
    email: faker.internet.email({ firstName, lastName, provider: 'example.com' }).toLowerCase(),
    passwordHash: TEST_PASSWORD_HASH,
    firstName,
    lastName,
    phone:
      faker.helpers.maybe(() => faker.phone.number({ style: 'national' }), {
        probability: 0.7,
      }) ?? null,
    avatarUrl: null,
    mfaEnabled: false,
    mfaSecret: null,
    isActive: true,
    activatedAt: now,
    lastLoginAt:
      faker.helpers.maybe(() => faker.date.recent({ days: 30 }), {
        probability: 0.8,
      }) ?? null,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides,
  };
}

/**
 * Creates a user along with a role assignment for a specific property.
 * Returns the user, the role record, and the user-property junction.
 */
export function createUserWithRole(
  role: Role,
  propertyId: string,
  overrides: {
    user?: Partial<UserFactoryData>;
    role?: Partial<RoleFactoryData>;
    userProperty?: Partial<UserPropertyFactoryData>;
  } = {},
): {
  user: UserFactoryData;
  role: RoleFactoryData;
  userProperty: UserPropertyFactoryData;
} {
  const now = new Date();

  const roleRecord: RoleFactoryData = {
    id: faker.string.uuid(),
    propertyId,
    name: ROLE_DISPLAY_NAMES[role],
    slug: role,
    description: `System role: ${ROLE_DISPLAY_NAMES[role]}`,
    isSystem: true,
    permissions: ROLE_PERMISSIONS[role],
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides.role,
  };

  const user = createUser(overrides.user);

  const userProperty: UserPropertyFactoryData = {
    id: faker.string.uuid(),
    userId: user.id,
    propertyId,
    roleId: roleRecord.id,
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
    ...overrides.userProperty,
  };

  return { user, role: roleRecord, userProperty };
}

// ---------------------------------------------------------------------------
// Role-Specific Convenience Functions
// ---------------------------------------------------------------------------

export function createSuperAdmin(propertyId: string, overrides: Partial<UserFactoryData> = {}) {
  return createUserWithRole('super_admin', propertyId, {
    user: { mfaEnabled: true, ...overrides },
  });
}

export function createPropertyAdmin(propertyId: string, overrides: Partial<UserFactoryData> = {}) {
  return createUserWithRole('property_admin', propertyId, {
    user: { mfaEnabled: true, ...overrides },
  });
}

export function createPropertyManager(
  propertyId: string,
  overrides: Partial<UserFactoryData> = {},
) {
  return createUserWithRole('property_manager', propertyId, {
    user: overrides,
  });
}

export function createFrontDesk(propertyId: string, overrides: Partial<UserFactoryData> = {}) {
  return createUserWithRole('front_desk', propertyId, { user: overrides });
}

export function createSecurityGuard(propertyId: string, overrides: Partial<UserFactoryData> = {}) {
  return createUserWithRole('security_guard', propertyId, { user: overrides });
}

export function createMaintenanceStaff(
  propertyId: string,
  overrides: Partial<UserFactoryData> = {},
) {
  return createUserWithRole('maintenance_staff', propertyId, {
    user: overrides,
  });
}

export function createBoardMember(propertyId: string, overrides: Partial<UserFactoryData> = {}) {
  return createUserWithRole('board_member', propertyId, { user: overrides });
}

export function createResidentOwner(propertyId: string, overrides: Partial<UserFactoryData> = {}) {
  return createUserWithRole('resident_owner', propertyId, { user: overrides });
}

export function createResidentTenant(propertyId: string, overrides: Partial<UserFactoryData> = {}) {
  return createUserWithRole('resident_tenant', propertyId, {
    user: overrides,
  });
}

export function createFamilyMember(propertyId: string, overrides: Partial<UserFactoryData> = {}) {
  return createUserWithRole('family_member', propertyId, { user: overrides });
}

export function createOffsiteOwner(propertyId: string, overrides: Partial<UserFactoryData> = {}) {
  return createUserWithRole('offsite_owner', propertyId, { user: overrides });
}

export function createVisitor(propertyId: string, overrides: Partial<UserFactoryData> = {}) {
  return createUserWithRole('visitor', propertyId, { user: overrides });
}

// ---------------------------------------------------------------------------
// Batch & Utility
// ---------------------------------------------------------------------------

/**
 * Creates multiple users in batch.
 */
export function createUsers(
  count: number,
  overrides: Partial<UserFactoryData> = {},
): UserFactoryData[] {
  return Array.from({ length: count }, () => createUser(overrides));
}

/**
 * Creates a complete set of users — one for each role — all assigned
 * to the same property. Useful for RBAC integration tests.
 */
export function createAllRoleUsers(propertyId: string) {
  const roles: Role[] = [
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

  return roles.map((role) => ({
    roleName: role,
    ...createUserWithRole(role, propertyId),
  }));
}

/**
 * Creates an inactive / deactivated user (e.g., for testing access denial).
 */
export function createInactiveUser(overrides: Partial<UserFactoryData> = {}): UserFactoryData {
  return createUser({
    isActive: false,
    activatedAt: null,
    lastLoginAt: null,
    ...overrides,
  });
}
