/**
 * Concierge — Database Seed Script
 *
 * Creates foundational data for development and testing.
 * Idempotent: safe to run multiple times (uses upsert).
 *
 * Usage: pnpm db:seed
 */

import { PrismaClient, PropertyType, SubscriptionTier } from '@prisma/client';

// Lazy-import argon2 (native module)
async function hashPassword(password: string): Promise<string> {
  const argon2 = await import('argon2');
  return argon2.hash(password, {
    type: 2, // argon2id
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });
}

const prisma = new PrismaClient();

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function uuid(): string {
  return crypto.randomUUID();
}

function log(emoji: string, message: string): void {
  console.log(`  ${emoji}  ${message}`);
}

// Pre-generate stable UUIDs for idempotency
const IDS = {
  // Super Admin
  superAdmin: '00000000-0000-4000-a000-000000000001',

  // Properties
  mapleHeights: '00000000-0000-4000-b000-000000000001',
  lakeshoreTowers: '00000000-0000-4000-b000-000000000002',

  // Roles - Maple Heights
  mh_propertyAdmin: '00000000-0000-4000-c000-000000010001',
  mh_propertyManager: '00000000-0000-4000-c000-000000010002',
  mh_frontDesk: '00000000-0000-4000-c000-000000010003',
  mh_securityGuard: '00000000-0000-4000-c000-000000010004',
  mh_maintenanceStaff: '00000000-0000-4000-c000-000000010005',
  mh_boardMember: '00000000-0000-4000-c000-000000010006',
  mh_residentOwner: '00000000-0000-4000-c000-000000010007',
  mh_residentTenant: '00000000-0000-4000-c000-000000010008',
  mh_superAdmin: '00000000-0000-4000-c000-000000010009',
  mh_securitySupervisor: '00000000-0000-4000-c000-000000010010',
  mh_superintendent: '00000000-0000-4000-c000-000000010011',

  // Roles - Lakeshore Towers
  lt_propertyAdmin: '00000000-0000-4000-c000-000000020001',
  lt_propertyManager: '00000000-0000-4000-c000-000000020002',
  lt_frontDesk: '00000000-0000-4000-c000-000000020003',
  lt_securityGuard: '00000000-0000-4000-c000-000000020004',
  lt_maintenanceStaff: '00000000-0000-4000-c000-000000020005',
  lt_boardMember: '00000000-0000-4000-c000-000000020006',
  lt_residentOwner: '00000000-0000-4000-c000-000000020007',
  lt_residentTenant: '00000000-0000-4000-c000-000000020008',
  lt_superAdmin: '00000000-0000-4000-c000-000000020009',
  lt_securitySupervisor: '00000000-0000-4000-c000-000000020010',
  lt_superintendent: '00000000-0000-4000-c000-000000020011',

  // Users - Maple Heights staff
  mh_adminUser: '00000000-0000-4000-d000-000000010001',
  mh_boardUser: '00000000-0000-4000-d000-000000010002',
  mh_managerUser: '00000000-0000-4000-d000-000000010003',
  mh_secSupervisorUser: '00000000-0000-4000-d000-000000010004',
  mh_guard1User: '00000000-0000-4000-d000-000000010005',
  mh_guard2User: '00000000-0000-4000-d000-000000010006',
  mh_frontDesk1User: '00000000-0000-4000-d000-000000010007',
  mh_frontDesk2User: '00000000-0000-4000-d000-000000010008',
  mh_maintenanceUser: '00000000-0000-4000-d000-000000010009',
  mh_superintendentUser: '00000000-0000-4000-d000-000000010010',

  // Users - Maple Heights residents
  mh_resident01: '00000000-0000-4000-d000-000000010101',
  mh_resident02: '00000000-0000-4000-d000-000000010102',
  mh_resident03: '00000000-0000-4000-d000-000000010103',
  mh_resident04: '00000000-0000-4000-d000-000000010104',
  mh_resident05: '00000000-0000-4000-d000-000000010105',
  mh_resident06: '00000000-0000-4000-d000-000000010106',
  mh_resident07: '00000000-0000-4000-d000-000000010107',
  mh_resident08: '00000000-0000-4000-d000-000000010108',
  mh_resident09: '00000000-0000-4000-d000-000000010109',
  mh_resident10: '00000000-0000-4000-d000-000000010110',

  // Users - Lakeshore Towers staff
  lt_adminUser: '00000000-0000-4000-d000-000000020001',
  lt_boardUser: '00000000-0000-4000-d000-000000020002',
  lt_managerUser: '00000000-0000-4000-d000-000000020003',
  lt_secSupervisorUser: '00000000-0000-4000-d000-000000020004',
  lt_guard1User: '00000000-0000-4000-d000-000000020005',
  lt_guard2User: '00000000-0000-4000-d000-000000020006',
  lt_frontDesk1User: '00000000-0000-4000-d000-000000020007',
  lt_frontDesk2User: '00000000-0000-4000-d000-000000020008',
  lt_maintenanceUser: '00000000-0000-4000-d000-000000020009',
  lt_superintendentUser: '00000000-0000-4000-d000-000000020010',

  // Users - Lakeshore Towers residents
  lt_resident01: '00000000-0000-4000-d000-000000020101',
  lt_resident02: '00000000-0000-4000-d000-000000020102',
  lt_resident03: '00000000-0000-4000-d000-000000020103',
  lt_resident04: '00000000-0000-4000-d000-000000020104',
  lt_resident05: '00000000-0000-4000-d000-000000020105',
  lt_resident06: '00000000-0000-4000-d000-000000020106',
  lt_resident07: '00000000-0000-4000-d000-000000020107',
  lt_resident08: '00000000-0000-4000-d000-000000020108',
  lt_resident09: '00000000-0000-4000-d000-000000020109',
  lt_resident10: '00000000-0000-4000-d000-000000020110',

  // Event Groups (shared structure, but per-property)
  mh_eg_security: '00000000-0000-4000-e000-000000010001',
  mh_eg_packages: '00000000-0000-4000-e000-000000010002',
  mh_eg_maintenance: '00000000-0000-4000-e000-000000010003',
  mh_eg_communication: '00000000-0000-4000-e000-000000010004',
  mh_eg_community: '00000000-0000-4000-e000-000000010005',

  lt_eg_security: '00000000-0000-4000-e000-000000020001',
  lt_eg_packages: '00000000-0000-4000-e000-000000020002',
  lt_eg_maintenance: '00000000-0000-4000-e000-000000020003',
  lt_eg_communication: '00000000-0000-4000-e000-000000020004',
  lt_eg_community: '00000000-0000-4000-e000-000000020005',

  // Property Settings
  mh_settings: '00000000-0000-4000-f000-000000010001',
  lt_settings: '00000000-0000-4000-f000-000000020001',
} as const;

// ---------------------------------------------------------------------------
// Role Definitions
// ---------------------------------------------------------------------------

interface RoleDef {
  name: string;
  slug: string;
  description: string;
  permissions: string[];
}

const ROLE_DEFINITIONS: RoleDef[] = [
  {
    name: 'Super Admin',
    slug: 'super_admin',
    description: 'Platform-wide administrator with full access to all properties and settings',
    permissions: ['*'],
  },
  {
    name: 'Property Admin',
    slug: 'property_admin',
    description: 'Full administrative control over a single property',
    permissions: [
      'property:manage',
      'user:manage',
      'role:manage',
      'event:*',
      'unit:*',
      'maintenance:*',
      'amenity:*',
      'announcement:*',
      'security:*',
      'report:*',
      'settings:*',
      'package:*',
      'parking:*',
      'training:*',
      'community:*',
    ],
  },
  {
    name: 'Property Manager',
    slug: 'property_manager',
    description: 'Day-to-day property operations manager',
    permissions: [
      'event:*',
      'unit:read',
      'unit:update',
      'maintenance:*',
      'amenity:*',
      'announcement:*',
      'security:read',
      'report:read',
      'report:export',
      'package:*',
      'parking:*',
      'vendor:*',
    ],
  },
  {
    name: 'Front Desk / Concierge',
    slug: 'front_desk',
    description: 'Front desk staff handling packages, visitors, and resident requests',
    permissions: [
      'event:create',
      'event:read',
      'event:update',
      'unit:read',
      'package:*',
      'security:visitor:create',
      'security:visitor:read',
      'security:key:create',
      'security:key:read',
      'security:pass_on:*',
      'announcement:read',
      'amenity:read',
      'amenity:booking:create',
    ],
  },
  {
    name: 'Security Guard',
    slug: 'security_guard',
    description: 'Security personnel managing incidents, patrols, and access control',
    permissions: [
      'event:create',
      'event:read',
      'event:update',
      'security:*',
      'unit:read',
      'package:read',
      'parking:violation:create',
      'parking:violation:read',
      'announcement:read',
    ],
  },
  {
    name: 'Security Supervisor',
    slug: 'security_supervisor',
    description: 'Senior security managing shifts, escalations, and security reports',
    permissions: [
      'event:*',
      'security:*',
      'unit:read',
      'package:read',
      'parking:*',
      'announcement:read',
      'report:security:read',
      'report:security:export',
    ],
  },
  {
    name: 'Maintenance Staff',
    slug: 'maintenance_staff',
    description: 'Maintenance personnel handling work orders and equipment',
    permissions: [
      'maintenance:read',
      'maintenance:update',
      'maintenance:comment',
      'equipment:read',
      'equipment:update',
      'unit:read',
    ],
  },
  {
    name: 'Superintendent',
    slug: 'superintendent',
    description: 'Building superintendent overseeing maintenance and building operations',
    permissions: [
      'maintenance:*',
      'equipment:*',
      'vendor:read',
      'unit:read',
      'unit:update',
      'event:read',
      'event:create',
      'report:maintenance:read',
    ],
  },
  {
    name: 'Board Member',
    slug: 'board_member',
    description: 'Condo board member with access to reports and governance features',
    permissions: [
      'report:read',
      'report:export',
      'announcement:read',
      'amenity:read',
      'unit:read',
      'maintenance:read',
      'financial:read',
    ],
  },
  {
    name: 'Resident (Owner)',
    slug: 'resident_owner',
    description: 'Unit owner with access to their own unit data and resident features',
    permissions: [
      'self:read',
      'self:update',
      'package:self:read',
      'maintenance:self:create',
      'maintenance:self:read',
      'amenity:booking:create',
      'amenity:booking:self:read',
      'announcement:read',
      'community:read',
      'community:create',
    ],
  },
  {
    name: 'Resident (Tenant)',
    slug: 'resident_tenant',
    description: 'Unit tenant with access to their own unit data and resident features',
    permissions: [
      'self:read',
      'self:update',
      'package:self:read',
      'maintenance:self:create',
      'maintenance:self:read',
      'amenity:booking:create',
      'amenity:booking:self:read',
      'announcement:read',
      'community:read',
      'community:create',
    ],
  },
];

// ---------------------------------------------------------------------------
// Event Group / Type definitions
// ---------------------------------------------------------------------------

interface EventTypeDef {
  name: string;
  slug: string;
  icon: string;
  color: string;
  defaultPriority: string;
  notifyOnCreate: boolean;
}

interface EventGroupDef {
  name: string;
  slug: string;
  description: string;
  sortOrder: number;
  types: EventTypeDef[];
}

const EVENT_GROUP_DEFINITIONS: EventGroupDef[] = [
  {
    name: 'Security',
    slug: 'security',
    description: 'Security-related events including visitors, incidents, and patrols',
    sortOrder: 1,
    types: [
      {
        name: 'Visitor Entry',
        slug: 'visitor-entry',
        icon: 'user-check',
        color: '#2563EB',
        defaultPriority: 'normal',
        notifyOnCreate: true,
      },
      {
        name: 'Incident Report',
        slug: 'incident-report',
        icon: 'alert-triangle',
        color: '#DC2626',
        defaultPriority: 'high',
        notifyOnCreate: true,
      },
      {
        name: 'Key Checkout',
        slug: 'key-checkout',
        icon: 'key',
        color: '#F59E0B',
        defaultPriority: 'normal',
        notifyOnCreate: false,
      },
      {
        name: 'Patrol Log',
        slug: 'patrol-log',
        icon: 'shield',
        color: '#6366F1',
        defaultPriority: 'low',
        notifyOnCreate: false,
      },
      {
        name: 'Pass-On Note',
        slug: 'pass-on-note',
        icon: 'message-circle',
        color: '#8B5CF6',
        defaultPriority: 'normal',
        notifyOnCreate: true,
      },
    ],
  },
  {
    name: 'Packages',
    slug: 'packages',
    description: 'Package and parcel tracking events',
    sortOrder: 2,
    types: [
      {
        name: 'Package Received',
        slug: 'package-received',
        icon: 'package',
        color: '#059669',
        defaultPriority: 'normal',
        notifyOnCreate: true,
      },
      {
        name: 'Package Released',
        slug: 'package-released',
        icon: 'package-check',
        color: '#10B981',
        defaultPriority: 'normal',
        notifyOnCreate: false,
      },
      {
        name: 'Outgoing Package',
        slug: 'outgoing-package',
        icon: 'send',
        color: '#0EA5E9',
        defaultPriority: 'low',
        notifyOnCreate: false,
      },
    ],
  },
  {
    name: 'Maintenance',
    slug: 'maintenance',
    description: 'Maintenance requests, work orders, and inspections',
    sortOrder: 3,
    types: [
      {
        name: 'Service Request',
        slug: 'service-request',
        icon: 'wrench',
        color: '#F97316',
        defaultPriority: 'normal',
        notifyOnCreate: true,
      },
      {
        name: 'Work Order',
        slug: 'work-order',
        icon: 'clipboard-list',
        color: '#EA580C',
        defaultPriority: 'normal',
        notifyOnCreate: true,
      },
      {
        name: 'Inspection',
        slug: 'inspection',
        icon: 'search',
        color: '#D97706',
        defaultPriority: 'low',
        notifyOnCreate: false,
      },
    ],
  },
  {
    name: 'Communication',
    slug: 'communication',
    description: 'Announcements, broadcasts, and property communications',
    sortOrder: 4,
    types: [
      {
        name: 'Announcement',
        slug: 'announcement',
        icon: 'megaphone',
        color: '#2563EB',
        defaultPriority: 'normal',
        notifyOnCreate: true,
      },
      {
        name: 'Emergency Broadcast',
        slug: 'emergency-broadcast',
        icon: 'siren',
        color: '#DC2626',
        defaultPriority: 'urgent',
        notifyOnCreate: true,
      },
    ],
  },
  {
    name: 'Community',
    slug: 'community',
    description: 'Community events, classifieds, and social features',
    sortOrder: 5,
    types: [
      {
        name: 'Event',
        slug: 'community-event',
        icon: 'calendar',
        color: '#7C3AED',
        defaultPriority: 'low',
        notifyOnCreate: true,
      },
      {
        name: 'Classified Ad',
        slug: 'classified-ad',
        icon: 'tag',
        color: '#0D9488',
        defaultPriority: 'low',
        notifyOnCreate: false,
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Main seed function
// ---------------------------------------------------------------------------

export async function main(): Promise<void> {
  console.log('\n========================================');
  console.log('  Concierge — Seeding Database');
  console.log('========================================\n');

  // Hash passwords once
  const superAdminHash = await hashPassword('SuperAdmin123!');
  const staffHash = await hashPassword('StaffPass123!@');
  const residentHash = await hashPassword('Resident123!@');

  // -------------------------------------------------------------------------
  // 1. Super Admin User
  // -------------------------------------------------------------------------
  log('1/15', 'Creating Super Admin user...');

  const superAdmin = await prisma.user.upsert({
    where: { email: 'admin@concierge.app' },
    update: {
      firstName: 'Super',
      lastName: 'Admin',
      passwordHash: superAdminHash,
      isActive: true,
      activatedAt: new Date(),
    },
    create: {
      id: IDS.superAdmin,
      email: 'admin@concierge.app',
      passwordHash: superAdminHash,
      firstName: 'Super',
      lastName: 'Admin',
      isActive: true,
      activatedAt: new Date(),
      mfaEnabled: false,
    },
  });
  log('OK', `Super Admin: ${superAdmin.email} (${superAdmin.id})`);

  // -------------------------------------------------------------------------
  // 2. Properties
  // -------------------------------------------------------------------------
  log('2/15', 'Creating properties...');

  const mapleHeights = await prisma.property.upsert({
    where: { id: IDS.mapleHeights },
    update: {
      name: 'Maple Heights Condominiums',
      address: '100 Maple Avenue',
      city: 'Toronto',
      province: 'Ontario',
      country: 'CA',
      postalCode: 'M5V 2T6',
      unitCount: 200,
      timezone: 'America/Toronto',
      isActive: true,
      type: PropertyType.PRODUCTION,
      subscriptionTier: SubscriptionTier.PROFESSIONAL,
      propertyCode: 'MPL-HTS',
    },
    create: {
      id: IDS.mapleHeights,
      name: 'Maple Heights Condominiums',
      address: '100 Maple Avenue',
      city: 'Toronto',
      province: 'Ontario',
      country: 'CA',
      postalCode: 'M5V 2T6',
      unitCount: 200,
      timezone: 'America/Toronto',
      isActive: true,
      type: PropertyType.PRODUCTION,
      subscriptionTier: SubscriptionTier.PROFESSIONAL,
      propertyCode: 'MPL-HTS',
    },
  });
  log('OK', `Property: ${mapleHeights.name} (${mapleHeights.id})`);

  const lakeshoreTowers = await prisma.property.upsert({
    where: { id: IDS.lakeshoreTowers },
    update: {
      name: 'Lakeshore Towers',
      address: '500 Lakeshore Boulevard West',
      city: 'Mississauga',
      province: 'Ontario',
      country: 'CA',
      postalCode: 'L5B 1M5',
      unitCount: 150,
      timezone: 'America/Toronto',
      isActive: true,
      type: PropertyType.PRODUCTION,
      subscriptionTier: SubscriptionTier.ENTERPRISE,
      propertyCode: 'LKS-TWR',
    },
    create: {
      id: IDS.lakeshoreTowers,
      name: 'Lakeshore Towers',
      address: '500 Lakeshore Boulevard West',
      city: 'Mississauga',
      province: 'Ontario',
      country: 'CA',
      postalCode: 'L5B 1M5',
      unitCount: 150,
      timezone: 'America/Toronto',
      isActive: true,
      type: PropertyType.PRODUCTION,
      subscriptionTier: SubscriptionTier.ENTERPRISE,
      propertyCode: 'LKS-TWR',
    },
  });
  log('OK', `Property: ${lakeshoreTowers.name} (${lakeshoreTowers.id})`);

  // -------------------------------------------------------------------------
  // 3. Roles (per property)
  // -------------------------------------------------------------------------
  log('3/15', 'Creating roles for each property...');

  const properties = [
    { property: mapleHeights, prefix: 'mh' as const },
    { property: lakeshoreTowers, prefix: 'lt' as const },
  ];

  const roleMap: Record<string, Record<string, string>> = {};

  for (const { property, prefix } of properties) {
    roleMap[property.id] = {};

    for (const roleDef of ROLE_DEFINITIONS) {
      const roleIdKey = `${prefix}_${roleDef.slug.replace(/_/g, '')}` as string;
      // Look up a stable ID from IDS, or generate one
      const roleId =
        (IDS as Record<string, string>)[`${prefix}_${roleDef.slug.replace(/\//g, '')}`] ??
        (IDS as Record<string, string>)[`${prefix}_${roleDef.slug}`] ??
        uuid();

      const role = await prisma.role.upsert({
        where: {
          propertyId_slug: {
            propertyId: property.id,
            slug: roleDef.slug,
          },
        },
        update: {
          name: roleDef.name,
          description: roleDef.description,
          permissions: roleDef.permissions,
          isSystem: true,
        },
        create: {
          id: roleId,
          propertyId: property.id,
          name: roleDef.name,
          slug: roleDef.slug,
          description: roleDef.description,
          permissions: roleDef.permissions,
          isSystem: true,
        },
      });

      roleMap[property.id]![roleDef.slug] = role.id;
    }
    log('OK', `  ${ROLE_DEFINITIONS.length} roles for ${property.name}`);
  }

  // -------------------------------------------------------------------------
  // 4. Staff Users + UserProperty assignments
  // -------------------------------------------------------------------------
  log('4/15', 'Creating staff and resident users...');

  interface UserSeed {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    phone?: string;
    roleSlug: string;
    passwordHash: string;
  }

  async function seedUsersForProperty(
    property: { id: string; name: string },
    users: UserSeed[],
  ): Promise<void> {
    for (const u of users) {
      const user = await prisma.user.upsert({
        where: { email: u.email },
        update: {
          firstName: u.firstName,
          lastName: u.lastName,
          phone: u.phone ?? null,
          passwordHash: u.passwordHash,
          isActive: true,
          activatedAt: new Date(),
        },
        create: {
          id: u.id,
          email: u.email,
          passwordHash: u.passwordHash,
          firstName: u.firstName,
          lastName: u.lastName,
          phone: u.phone ?? null,
          isActive: true,
          activatedAt: new Date(),
          mfaEnabled: false,
        },
      });

      const roleId = roleMap[property.id]![u.roleSlug];
      if (!roleId) {
        console.error(`    WARNING: Role "${u.roleSlug}" not found for property ${property.id}`);
        continue;
      }

      await prisma.userProperty.upsert({
        where: {
          userId_propertyId: {
            userId: user.id,
            propertyId: property.id,
          },
        },
        update: { roleId },
        create: {
          userId: user.id,
          propertyId: property.id,
          roleId,
        },
      });
    }
  }

  // Also link Super Admin to both properties
  for (const { property } of properties) {
    const saRoleId = roleMap[property.id]!['super_admin'];
    if (saRoleId) {
      await prisma.userProperty.upsert({
        where: {
          userId_propertyId: {
            userId: superAdmin.id,
            propertyId: property.id,
          },
        },
        update: { roleId: saRoleId },
        create: {
          userId: superAdmin.id,
          propertyId: property.id,
          roleId: saRoleId,
        },
      });
    }
  }

  // -- Maple Heights users --
  const mhStaff: UserSeed[] = [
    {
      id: IDS.mh_adminUser,
      email: 'admin@mapleheights.ca',
      firstName: 'Sarah',
      lastName: 'Chen',
      phone: '+14165551001',
      roleSlug: 'property_admin',
      passwordHash: staffHash,
    },
    {
      id: IDS.mh_boardUser,
      email: 'board@mapleheights.ca',
      firstName: 'Robert',
      lastName: 'Kim',
      phone: '+14165551002',
      roleSlug: 'board_member',
      passwordHash: staffHash,
    },
    {
      id: IDS.mh_managerUser,
      email: 'manager@mapleheights.ca',
      firstName: 'David',
      lastName: 'Patel',
      phone: '+14165551003',
      roleSlug: 'property_manager',
      passwordHash: staffHash,
    },
    {
      id: IDS.mh_secSupervisorUser,
      email: 'security.sup@mapleheights.ca',
      firstName: 'Maria',
      lastName: 'Rodriguez',
      phone: '+14165551004',
      roleSlug: 'security_supervisor',
      passwordHash: staffHash,
    },
    {
      id: IDS.mh_guard1User,
      email: 'guard1@mapleheights.ca',
      firstName: 'James',
      lastName: 'Wilson',
      phone: '+14165551005',
      roleSlug: 'security_guard',
      passwordHash: staffHash,
    },
    {
      id: IDS.mh_guard2User,
      email: 'guard2@mapleheights.ca',
      firstName: 'Amir',
      lastName: 'Hassan',
      phone: '+14165551006',
      roleSlug: 'security_guard',
      passwordHash: staffHash,
    },
    {
      id: IDS.mh_frontDesk1User,
      email: 'concierge1@mapleheights.ca',
      firstName: 'Emily',
      lastName: 'Thompson',
      phone: '+14165551007',
      roleSlug: 'front_desk',
      passwordHash: staffHash,
    },
    {
      id: IDS.mh_frontDesk2User,
      email: 'concierge2@mapleheights.ca',
      firstName: 'Kevin',
      lastName: 'Nguyen',
      phone: '+14165551008',
      roleSlug: 'front_desk',
      passwordHash: staffHash,
    },
    {
      id: IDS.mh_maintenanceUser,
      email: 'maintenance@mapleheights.ca',
      firstName: 'Tony',
      lastName: 'Garcia',
      phone: '+14165551009',
      roleSlug: 'maintenance_staff',
      passwordHash: staffHash,
    },
    {
      id: IDS.mh_superintendentUser,
      email: 'super@mapleheights.ca',
      firstName: 'Frank',
      lastName: 'Bianchi',
      phone: '+14165551010',
      roleSlug: 'superintendent',
      passwordHash: staffHash,
    },
  ];

  const mhResidents: UserSeed[] = [
    {
      id: IDS.mh_resident01,
      email: 'resident1@mapleheights.ca',
      firstName: 'Alice',
      lastName: 'Johnson',
      phone: '+14165552001',
      roleSlug: 'resident_owner',
      passwordHash: residentHash,
    },
    {
      id: IDS.mh_resident02,
      email: 'resident2@mapleheights.ca',
      firstName: 'Bob',
      lastName: 'Smith',
      phone: '+14165552002',
      roleSlug: 'resident_owner',
      passwordHash: residentHash,
    },
    {
      id: IDS.mh_resident03,
      email: 'resident3@mapleheights.ca',
      firstName: 'Carol',
      lastName: 'Davis',
      phone: '+14165552003',
      roleSlug: 'resident_tenant',
      passwordHash: residentHash,
    },
    {
      id: IDS.mh_resident04,
      email: 'resident4@mapleheights.ca',
      firstName: 'Dan',
      lastName: 'Lee',
      phone: '+14165552004',
      roleSlug: 'resident_owner',
      passwordHash: residentHash,
    },
    {
      id: IDS.mh_resident05,
      email: 'resident5@mapleheights.ca',
      firstName: 'Eva',
      lastName: 'Martinez',
      phone: '+14165552005',
      roleSlug: 'resident_tenant',
      passwordHash: residentHash,
    },
    {
      id: IDS.mh_resident06,
      email: 'resident6@mapleheights.ca',
      firstName: 'George',
      lastName: 'Brown',
      phone: '+14165552006',
      roleSlug: 'resident_owner',
      passwordHash: residentHash,
    },
    {
      id: IDS.mh_resident07,
      email: 'resident7@mapleheights.ca',
      firstName: 'Helen',
      lastName: 'Taylor',
      phone: '+14165552007',
      roleSlug: 'resident_tenant',
      passwordHash: residentHash,
    },
    {
      id: IDS.mh_resident08,
      email: 'resident8@mapleheights.ca',
      firstName: 'Ivan',
      lastName: 'Petrov',
      phone: '+14165552008',
      roleSlug: 'resident_owner',
      passwordHash: residentHash,
    },
    {
      id: IDS.mh_resident09,
      email: 'resident9@mapleheights.ca',
      firstName: 'Jenny',
      lastName: 'Wang',
      phone: '+14165552009',
      roleSlug: 'resident_tenant',
      passwordHash: residentHash,
    },
    {
      id: IDS.mh_resident10,
      email: 'resident10@mapleheights.ca',
      firstName: 'Karl',
      lastName: 'Mueller',
      phone: '+14165552010',
      roleSlug: 'resident_owner',
      passwordHash: residentHash,
    },
  ];

  await seedUsersForProperty(mapleHeights, [...mhStaff, ...mhResidents]);
  log('OK', `  ${mhStaff.length} staff + ${mhResidents.length} residents for Maple Heights`);

  // -- Lakeshore Towers users --
  const ltStaff: UserSeed[] = [
    {
      id: IDS.lt_adminUser,
      email: 'admin@lakeshoretowers.ca',
      firstName: 'Linda',
      lastName: 'Park',
      phone: '+19055551001',
      roleSlug: 'property_admin',
      passwordHash: staffHash,
    },
    {
      id: IDS.lt_boardUser,
      email: 'board@lakeshoretowers.ca',
      firstName: 'Michael',
      lastName: 'Okafor',
      phone: '+19055551002',
      roleSlug: 'board_member',
      passwordHash: staffHash,
    },
    {
      id: IDS.lt_managerUser,
      email: 'manager@lakeshoretowers.ca',
      firstName: 'Susan',
      lastName: 'Wright',
      phone: '+19055551003',
      roleSlug: 'property_manager',
      passwordHash: staffHash,
    },
    {
      id: IDS.lt_secSupervisorUser,
      email: 'security.sup@lakeshoretowers.ca',
      firstName: 'Carlos',
      lastName: 'Mendez',
      phone: '+19055551004',
      roleSlug: 'security_supervisor',
      passwordHash: staffHash,
    },
    {
      id: IDS.lt_guard1User,
      email: 'guard1@lakeshoretowers.ca',
      firstName: 'Derek',
      lastName: 'Singh',
      phone: '+19055551005',
      roleSlug: 'security_guard',
      passwordHash: staffHash,
    },
    {
      id: IDS.lt_guard2User,
      email: 'guard2@lakeshoretowers.ca',
      firstName: 'Fatima',
      lastName: 'Ali',
      phone: '+19055551006',
      roleSlug: 'security_guard',
      passwordHash: staffHash,
    },
    {
      id: IDS.lt_frontDesk1User,
      email: 'concierge1@lakeshoretowers.ca',
      firstName: 'Grace',
      lastName: 'Chung',
      phone: '+19055551007',
      roleSlug: 'front_desk',
      passwordHash: staffHash,
    },
    {
      id: IDS.lt_frontDesk2User,
      email: 'concierge2@lakeshoretowers.ca',
      firstName: 'Hassan',
      lastName: 'Ibrahim',
      phone: '+19055551008',
      roleSlug: 'front_desk',
      passwordHash: staffHash,
    },
    {
      id: IDS.lt_maintenanceUser,
      email: 'maintenance@lakeshoretowers.ca',
      firstName: 'Joe',
      lastName: 'Russo',
      phone: '+19055551009',
      roleSlug: 'maintenance_staff',
      passwordHash: staffHash,
    },
    {
      id: IDS.lt_superintendentUser,
      email: 'super@lakeshoretowers.ca',
      firstName: 'Peter',
      lastName: 'Kowalski',
      phone: '+19055551010',
      roleSlug: 'superintendent',
      passwordHash: staffHash,
    },
  ];

  const ltResidents: UserSeed[] = [
    {
      id: IDS.lt_resident01,
      email: 'resident1@lakeshoretowers.ca',
      firstName: 'Nadia',
      lastName: 'Karim',
      phone: '+19055552001',
      roleSlug: 'resident_owner',
      passwordHash: residentHash,
    },
    {
      id: IDS.lt_resident02,
      email: 'resident2@lakeshoretowers.ca',
      firstName: 'Oliver',
      lastName: 'Chen',
      phone: '+19055552002',
      roleSlug: 'resident_tenant',
      passwordHash: residentHash,
    },
    {
      id: IDS.lt_resident03,
      email: 'resident3@lakeshoretowers.ca',
      firstName: 'Priya',
      lastName: 'Sharma',
      phone: '+19055552003',
      roleSlug: 'resident_owner',
      passwordHash: residentHash,
    },
    {
      id: IDS.lt_resident04,
      email: 'resident4@lakeshoretowers.ca',
      firstName: 'Quinn',
      lastName: 'MacDonald',
      phone: '+19055552004',
      roleSlug: 'resident_tenant',
      passwordHash: residentHash,
    },
    {
      id: IDS.lt_resident05,
      email: 'resident5@lakeshoretowers.ca',
      firstName: 'Raj',
      lastName: 'Gupta',
      phone: '+19055552005',
      roleSlug: 'resident_owner',
      passwordHash: residentHash,
    },
    {
      id: IDS.lt_resident06,
      email: 'resident6@lakeshoretowers.ca',
      firstName: 'Sofia',
      lastName: 'Morales',
      phone: '+19055552006',
      roleSlug: 'resident_owner',
      passwordHash: residentHash,
    },
    {
      id: IDS.lt_resident07,
      email: 'resident7@lakeshoretowers.ca',
      firstName: 'Thomas',
      lastName: 'Baker',
      phone: '+19055552007',
      roleSlug: 'resident_tenant',
      passwordHash: residentHash,
    },
    {
      id: IDS.lt_resident08,
      email: 'resident8@lakeshoretowers.ca',
      firstName: 'Uma',
      lastName: 'Patel',
      phone: '+19055552008',
      roleSlug: 'resident_owner',
      passwordHash: residentHash,
    },
    {
      id: IDS.lt_resident09,
      email: 'resident9@lakeshoretowers.ca',
      firstName: 'Victor',
      lastName: 'Novak',
      phone: '+19055552009',
      roleSlug: 'resident_tenant',
      passwordHash: residentHash,
    },
    {
      id: IDS.lt_resident10,
      email: 'resident10@lakeshoretowers.ca',
      firstName: 'Wendy',
      lastName: 'Tanaka',
      phone: '+19055552010',
      roleSlug: 'resident_owner',
      passwordHash: residentHash,
    },
  ];

  await seedUsersForProperty(lakeshoreTowers, [...ltStaff, ...ltResidents]);
  log('OK', `  ${ltStaff.length} staff + ${ltResidents.length} residents for Lakeshore Towers`);

  // -------------------------------------------------------------------------
  // 5. Units (20 per property: floors 1-5, units 01-04)
  // -------------------------------------------------------------------------
  log('5/15', 'Creating units...');

  for (const { property } of properties) {
    let unitIndex = 0;
    for (let floor = 1; floor <= 5; floor++) {
      for (let unit = 1; unit <= 4; unit++) {
        const unitNumber = `${floor}${unit.toString().padStart(2, '0')}`;
        await prisma.unit.upsert({
          where: {
            propertyId_number: {
              propertyId: property.id,
              number: unitNumber,
            },
          },
          update: {
            floor,
            unitType: 'residential',
            status: unitIndex < 16 ? 'occupied' : 'vacant', // 16 occupied, 4 vacant
          },
          create: {
            propertyId: property.id,
            number: unitNumber,
            floor,
            unitType: 'residential',
            status: unitIndex < 16 ? 'occupied' : 'vacant',
            packageEmailNotification: true,
          },
        });
        unitIndex++;
      }
    }
    log('OK', `  20 units for ${property.name}`);
  }

  // -------------------------------------------------------------------------
  // 6. Event Groups & Event Types
  // -------------------------------------------------------------------------
  log('6/15', 'Creating event groups and event types...');

  const eventGroupIdMap: Record<string, Record<string, string>> = {};

  for (const { property, prefix } of properties) {
    eventGroupIdMap[property.id] = {};

    for (const groupDef of EVENT_GROUP_DEFINITIONS) {
      // Use stable IDs from the IDS map
      const groupIdKey = `${prefix}_eg_${groupDef.slug}` as keyof typeof IDS;
      const groupId = IDS[groupIdKey] ?? uuid();

      const group = await prisma.eventGroup.upsert({
        where: {
          propertyId_slug: {
            propertyId: property.id,
            slug: groupDef.slug,
          },
        },
        update: {
          name: groupDef.name,
          description: groupDef.description,
          sortOrder: groupDef.sortOrder,
          isActive: true,
        },
        create: {
          id: groupId,
          propertyId: property.id,
          name: groupDef.name,
          slug: groupDef.slug,
          description: groupDef.description,
          sortOrder: groupDef.sortOrder,
          isActive: true,
        },
      });

      eventGroupIdMap[property.id]![groupDef.slug] = group.id;

      // Create event types for this group
      for (const typeDef of groupDef.types) {
        await prisma.eventType.upsert({
          where: {
            propertyId_slug: {
              propertyId: property.id,
              slug: typeDef.slug,
            },
          },
          update: {
            name: typeDef.name,
            icon: typeDef.icon,
            color: typeDef.color,
            defaultPriority: typeDef.defaultPriority,
            notifyOnCreate: typeDef.notifyOnCreate,
            isActive: true,
          },
          create: {
            propertyId: property.id,
            eventGroupId: group.id,
            name: typeDef.name,
            slug: typeDef.slug,
            icon: typeDef.icon,
            color: typeDef.color,
            defaultPriority: typeDef.defaultPriority,
            notifyOnCreate: typeDef.notifyOnCreate,
            isActive: true,
          },
        });
      }
    }

    const totalTypes = EVENT_GROUP_DEFINITIONS.reduce((sum, g) => sum + g.types.length, 0);
    log(
      'OK',
      `  ${EVENT_GROUP_DEFINITIONS.length} groups, ${totalTypes} types for ${property.name}`,
    );
  }

  // -------------------------------------------------------------------------
  // 7. Property Settings
  // -------------------------------------------------------------------------
  log('7/15', 'Creating property settings...');

  await prisma.propertySettings.upsert({
    where: { propertyId: mapleHeights.id },
    update: {
      propertyName: 'Maple Heights Condominiums',
      legalName: 'Toronto Standard Condominium Corporation 1234',
      corporationNumber: 'TSCC-1234',
      totalFloors: 40,
      totalUnits: 200,
      yearBuilt: 2018,
      welcomeMessage:
        'Welcome to Maple Heights Condominiums. Please contact the front desk for any assistance.',
      description: 'A premium residential condominium in downtown Toronto.',
      operationalToggles: {
        packagesEnabled: true,
        amenityBookingEnabled: true,
        maintenanceRequestsEnabled: true,
        visitorLogEnabled: true,
        parkingManagementEnabled: true,
        classifiedAdsEnabled: false,
        trainingModuleEnabled: false,
      },
      brandingConfig: {
        primaryColor: '#1E40AF',
        accentColor: '#2563EB',
        logoUrl: null,
      },
    },
    create: {
      id: IDS.mh_settings,
      propertyId: mapleHeights.id,
      propertyName: 'Maple Heights Condominiums',
      legalName: 'Toronto Standard Condominium Corporation 1234',
      corporationNumber: 'TSCC-1234',
      totalFloors: 40,
      totalUnits: 200,
      yearBuilt: 2018,
      welcomeMessage:
        'Welcome to Maple Heights Condominiums. Please contact the front desk for any assistance.',
      description: 'A premium residential condominium in downtown Toronto.',
      operationalToggles: {
        packagesEnabled: true,
        amenityBookingEnabled: true,
        maintenanceRequestsEnabled: true,
        visitorLogEnabled: true,
        parkingManagementEnabled: true,
        classifiedAdsEnabled: false,
        trainingModuleEnabled: false,
      },
      brandingConfig: {
        primaryColor: '#1E40AF',
        accentColor: '#2563EB',
        logoUrl: null,
      },
    },
  });
  log('OK', `  Settings for Maple Heights`);

  await prisma.propertySettings.upsert({
    where: { propertyId: lakeshoreTowers.id },
    update: {
      propertyName: 'Lakeshore Towers',
      legalName: 'Peel Standard Condominium Corporation 5678',
      corporationNumber: 'PSCC-5678',
      totalFloors: 30,
      totalUnits: 150,
      yearBuilt: 2020,
      welcomeMessage: 'Welcome to Lakeshore Towers. Your lakeside living experience starts here.',
      description: 'Modern waterfront condominium in Mississauga.',
      operationalToggles: {
        packagesEnabled: true,
        amenityBookingEnabled: true,
        maintenanceRequestsEnabled: true,
        visitorLogEnabled: true,
        parkingManagementEnabled: true,
        classifiedAdsEnabled: true,
        trainingModuleEnabled: true,
      },
      brandingConfig: {
        primaryColor: '#0F766E',
        accentColor: '#0D9488',
        logoUrl: null,
      },
    },
    create: {
      id: IDS.lt_settings,
      propertyId: lakeshoreTowers.id,
      propertyName: 'Lakeshore Towers',
      legalName: 'Peel Standard Condominium Corporation 5678',
      corporationNumber: 'PSCC-5678',
      totalFloors: 30,
      totalUnits: 150,
      yearBuilt: 2020,
      welcomeMessage: 'Welcome to Lakeshore Towers. Your lakeside living experience starts here.',
      description: 'Modern waterfront condominium in Mississauga.',
      operationalToggles: {
        packagesEnabled: true,
        amenityBookingEnabled: true,
        maintenanceRequestsEnabled: true,
        visitorLogEnabled: true,
        parkingManagementEnabled: true,
        classifiedAdsEnabled: true,
        trainingModuleEnabled: true,
      },
      brandingConfig: {
        primaryColor: '#0F766E',
        accentColor: '#0D9488',
        logoUrl: null,
      },
    },
  });
  log('OK', `  Settings for Lakeshore Towers`);

  // -------------------------------------------------------------------------
  // 8. Courier Types
  // -------------------------------------------------------------------------
  log('8/15', 'Creating courier types...');

  const COURIER_DEFINITIONS = [
    { name: 'Amazon', slug: 'amazon', iconUrl: '/icons/couriers/amazon.svg', color: '#FF9900' },
    { name: 'FedEx', slug: 'fedex', iconUrl: '/icons/couriers/fedex.svg', color: '#4D148C' },
    { name: 'UPS', slug: 'ups', iconUrl: '/icons/couriers/ups.svg', color: '#351C15' },
    {
      name: 'Canada Post',
      slug: 'canada-post',
      iconUrl: '/icons/couriers/canada-post.svg',
      color: '#DC2626',
    },
    { name: 'DHL', slug: 'dhl', iconUrl: '/icons/couriers/dhl.svg', color: '#FFCC00' },
    {
      name: 'Purolator',
      slug: 'purolator',
      iconUrl: '/icons/couriers/purolator.svg',
      color: '#E31937',
    },
    { name: 'Other', slug: 'other', iconUrl: '/icons/couriers/other.svg', color: '#6B7280' },
  ];

  const courierMap: Record<string, Record<string, string>> = {};

  for (const { property } of properties) {
    courierMap[property.id] = {};
    for (let i = 0; i < COURIER_DEFINITIONS.length; i++) {
      const cDef = COURIER_DEFINITIONS[i]!;
      const courierId = `00000000-0000-4000-aa00-${property.id.slice(-6)}${(i + 1).toString().padStart(6, '0')}`;
      const courier = await prisma.courierType.upsert({
        where: { id: courierId },
        update: {
          name: cDef.name,
          slug: cDef.slug,
          iconUrl: cDef.iconUrl,
          color: cDef.color,
          sortOrder: i,
          isActive: true,
          isSystem: true,
        },
        create: {
          id: courierId,
          propertyId: property.id,
          name: cDef.name,
          slug: cDef.slug,
          iconUrl: cDef.iconUrl,
          color: cDef.color,
          sortOrder: i,
          isActive: true,
          isSystem: true,
        },
      });
      courierMap[property.id]![cDef.slug] = courier.id;
    }
    log('OK', `  ${COURIER_DEFINITIONS.length} courier types for ${property.name}`);
  }

  // -------------------------------------------------------------------------
  // 9. Amenity Groups & Amenities
  // -------------------------------------------------------------------------
  log('9/15', 'Creating amenities...');

  const AMENITY_GROUP_ID_MH = '00000000-0000-4000-ab00-000000010001';
  const AMENITY_GROUP_ID_LT = '00000000-0000-4000-ab00-000000020001';

  const amenityGroupIds: Record<string, string> = {
    [mapleHeights.id]: AMENITY_GROUP_ID_MH,
    [lakeshoreTowers.id]: AMENITY_GROUP_ID_LT,
  };

  for (const { property, prefix } of properties) {
    const groupId = amenityGroupIds[property.id]!;

    await prisma.amenityGroup.upsert({
      where: { id: groupId },
      update: { name: 'Building Amenities', displayOrder: 1, isActive: true },
      create: {
        id: groupId,
        propertyId: property.id,
        name: 'Building Amenities',
        displayOrder: 1,
        isActive: true,
      },
    });

    const AMENITY_DEFINITIONS = [
      {
        name: 'Party Room',
        description:
          'Large event space with kitchen, seating for 60, and AV equipment. Perfect for birthdays, anniversaries, and holiday gatherings.',
        color: '#7C3AED',
        icon: 'party-popper',
        bookingStyle: 'fixed_slots',
        slotDurationMinutes: 240,
        maxConcurrent: 1,
        maxGuests: 60,
      },
      {
        name: 'Gym / Fitness Centre',
        description:
          'Fully equipped fitness centre with cardio machines, free weights, and stretching area. Open 5:00 AM to 11:00 PM daily.',
        color: '#DC2626',
        icon: 'dumbbell',
        bookingStyle: 'flexible_range',
        slotDurationMinutes: 60,
        maxConcurrent: 15,
        maxGuests: 0,
      },
      {
        name: 'Swimming Pool',
        description:
          'Indoor heated pool with adjacent hot tub and sauna. Lifeguard on duty weekends 10 AM - 6 PM.',
        color: '#0EA5E9',
        icon: 'waves',
        bookingStyle: 'fixed_slots',
        slotDurationMinutes: 90,
        maxConcurrent: 20,
        maxGuests: 2,
      },
      {
        name: 'BBQ Area',
        description:
          'Outdoor terrace with 3 gas BBQ stations, picnic tables, and a covered seating area overlooking the courtyard.',
        color: '#F97316',
        icon: 'flame',
        bookingStyle: 'fixed_slots',
        slotDurationMinutes: 180,
        maxConcurrent: 3,
        maxGuests: 10,
      },
      {
        name: 'Guest Suite',
        description:
          'Fully furnished one-bedroom suite for overnight visitors. Includes queen bed, ensuite bathroom, and basic kitchenette.',
        color: '#6366F1',
        icon: 'bed',
        bookingStyle: 'full_day',
        slotDurationMinutes: null,
        maxConcurrent: 1,
        maxGuests: 2,
      },
      {
        name: 'Rooftop Lounge',
        description:
          'Premium rooftop space with panoramic city views, comfortable seating, and a bar area. Available for private events.',
        color: '#0D9488',
        icon: 'building',
        bookingStyle: 'fixed_slots',
        slotDurationMinutes: 180,
        maxConcurrent: 1,
        maxGuests: 30,
      },
    ];

    for (let i = 0; i < AMENITY_DEFINITIONS.length; i++) {
      const aDef = AMENITY_DEFINITIONS[i]!;
      const amenityId = `00000000-0000-4000-ac00-${property.id.slice(-6)}${(i + 1).toString().padStart(6, '0')}`;
      await prisma.amenity.upsert({
        where: { id: amenityId },
        update: {
          name: aDef.name,
          description: aDef.description,
          color: aDef.color,
          icon: aDef.icon,
          bookingStyle: aDef.bookingStyle,
          slotDurationMinutes: aDef.slotDurationMinutes,
          maxConcurrent: aDef.maxConcurrent,
          maxGuests: aDef.maxGuests,
          displayOrder: i,
          isActive: true,
        },
        create: {
          id: amenityId,
          propertyId: property.id,
          groupId: groupId,
          name: aDef.name,
          description: aDef.description,
          color: aDef.color,
          icon: aDef.icon,
          bookingStyle: aDef.bookingStyle,
          slotDurationMinutes: aDef.slotDurationMinutes,
          maxConcurrent: aDef.maxConcurrent,
          maxGuests: aDef.maxGuests,
          displayOrder: i,
          isActive: true,
          createdById: prefix === 'mh' ? IDS.mh_adminUser : IDS.lt_adminUser,
        },
      });
    }
    log('OK', `  ${AMENITY_DEFINITIONS.length} amenities for ${property.name}`);
  }

  // -------------------------------------------------------------------------
  // 10. Maintenance Categories
  // -------------------------------------------------------------------------
  log('10/15', 'Creating maintenance categories...');

  const MAINTENANCE_CATEGORIES = [
    {
      name: 'Plumbing',
      icon: 'droplets',
      color: '#0EA5E9',
      subCategories: ['Leaking faucet', 'Clogged drain', 'Toilet repair', 'Water heater'],
      defaultPriority: 'normal',
    },
    {
      name: 'Electrical',
      icon: 'zap',
      color: '#F59E0B',
      subCategories: ['Outlet not working', 'Light fixture', 'Breaker tripped', 'Wiring issue'],
      defaultPriority: 'high',
    },
    {
      name: 'HVAC',
      icon: 'thermometer',
      color: '#6366F1',
      subCategories: ['No heat', 'No AC', 'Thermostat issue', 'Strange noise'],
      defaultPriority: 'high',
    },
    {
      name: 'Appliance',
      icon: 'refrigerator',
      color: '#8B5CF6',
      subCategories: ['Dishwasher', 'Washer/Dryer', 'Oven/Stove', 'Refrigerator'],
      defaultPriority: 'normal',
    },
    {
      name: 'General',
      icon: 'wrench',
      color: '#6B7280',
      subCategories: ['Door/Lock', 'Window', 'Flooring', 'Paint/Walls', 'Pest control'],
      defaultPriority: 'low',
    },
    {
      name: 'Emergency',
      icon: 'siren',
      color: '#DC2626',
      subCategories: ['Flood', 'Fire damage', 'Gas leak', 'Broken window', 'Lock-out'],
      defaultPriority: 'critical',
    },
  ];

  const maintenanceCatMap: Record<string, Record<string, string>> = {};

  for (const { property } of properties) {
    maintenanceCatMap[property.id] = {};
    for (let i = 0; i < MAINTENANCE_CATEGORIES.length; i++) {
      const mCat = MAINTENANCE_CATEGORIES[i]!;
      const catId = `00000000-0000-4000-ad00-${property.id.slice(-6)}${(i + 1).toString().padStart(6, '0')}`;
      const cat = await prisma.maintenanceCategory.upsert({
        where: { id: catId },
        update: {
          name: mCat.name,
          icon: mCat.icon,
          color: mCat.color,
          subCategories: mCat.subCategories,
          defaultPriority: mCat.defaultPriority,
          sortOrder: i,
          isActive: true,
        },
        create: {
          id: catId,
          propertyId: property.id,
          name: mCat.name,
          icon: mCat.icon,
          color: mCat.color,
          subCategories: mCat.subCategories,
          defaultPriority: mCat.defaultPriority,
          sortOrder: i,
          isActive: true,
        },
      });
      maintenanceCatMap[property.id]![mCat.name.toLowerCase()] = cat.id;
    }
    log('OK', `  ${MAINTENANCE_CATEGORIES.length} maintenance categories for ${property.name}`);
  }

  // -------------------------------------------------------------------------
  // 11. Packages (for Maple Heights only — demo data)
  // -------------------------------------------------------------------------
  log('11/15', 'Creating demo packages...');

  // Fetch unit IDs for Maple Heights
  const mhUnits = await prisma.unit.findMany({
    where: { propertyId: mapleHeights.id },
    select: { id: true, number: true },
  });

  // Use first available unit IDs, or generate stable fallbacks
  const getUnitId = (index: number): string => {
    if (mhUnits.length > index) return mhUnits[index]!.id;
    return `00000000-0000-4000-ae00-000000${(index + 1).toString().padStart(6, '0')}`;
  };

  const PACKAGE_DATA = [
    {
      ref: 'PKG-A1B2C3',
      courier: 'amazon',
      status: 'unreleased',
      isPerishable: false,
      unitIdx: 0,
      desc: 'Small cardboard box',
    },
    {
      ref: 'PKG-D4E5F6',
      courier: 'fedex',
      status: 'unreleased',
      isPerishable: false,
      unitIdx: 1,
      desc: 'Medium envelope',
    },
    {
      ref: 'PKG-G7H8I9',
      courier: 'ups',
      status: 'unreleased',
      isPerishable: true,
      unitIdx: 2,
      desc: 'Refrigerated meal kit — perishable',
    },
    {
      ref: 'PKG-J1K2L3',
      courier: 'canada-post',
      status: 'released',
      isPerishable: false,
      unitIdx: 3,
      desc: 'Letter-sized package',
    },
    {
      ref: 'PKG-M4N5O6',
      courier: 'dhl',
      status: 'released',
      isPerishable: false,
      unitIdx: 4,
      desc: 'International parcel',
    },
    {
      ref: 'PKG-P7Q8R9',
      courier: 'purolator',
      status: 'unreleased',
      isPerishable: false,
      unitIdx: 5,
      desc: 'Business document envelope',
    },
    {
      ref: 'PKG-S1T2U3',
      courier: 'amazon',
      status: 'unreleased',
      isPerishable: true,
      unitIdx: 6,
      desc: 'Amazon Fresh grocery delivery — perishable',
    },
    {
      ref: 'PKG-V4W5X6',
      courier: 'amazon',
      status: 'released',
      isPerishable: false,
      unitIdx: 7,
      desc: 'Large box (electronics)',
    },
    {
      ref: 'PKG-Y7Z8A9',
      courier: 'fedex',
      status: 'unreleased',
      isPerishable: false,
      unitIdx: 8,
      desc: 'Oversized flat box',
    },
    {
      ref: 'PKG-B1C2D3',
      courier: 'ups',
      status: 'released',
      isPerishable: false,
      unitIdx: 9,
      desc: 'Multi-box shipment (1 of 3)',
    },
    {
      ref: 'PKG-E4F5G6',
      courier: 'canada-post',
      status: 'unreleased',
      isPerishable: false,
      unitIdx: 0,
      desc: 'Registered mail',
    },
    {
      ref: 'PKG-H7I8J9',
      courier: 'amazon',
      status: 'unreleased',
      isPerishable: true,
      unitIdx: 1,
      desc: 'Fresh flowers — perishable',
    },
  ];

  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
  const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);

  for (let i = 0; i < PACKAGE_DATA.length; i++) {
    const pkg = PACKAGE_DATA[i]!;
    const pkgId = `00000000-0000-4000-af00-000000${(i + 1).toString().padStart(6, '0')}`;
    const courierId = courierMap[mapleHeights.id]?.[pkg.courier];

    await prisma.package.upsert({
      where: { id: pkgId },
      update: {
        status: pkg.status,
        description: pkg.desc,
        isPerishable: pkg.isPerishable,
      },
      create: {
        id: pkgId,
        propertyId: mapleHeights.id,
        unitId: getUnitId(pkg.unitIdx),
        referenceNumber: pkg.ref,
        direction: 'incoming',
        status: pkg.status,
        courierId: courierId ?? null,
        description: pkg.desc,
        isPerishable: pkg.isPerishable,
        isOversized: i === 8, // One oversized package
        createdById: IDS.mh_frontDesk1User,
        releasedById: pkg.status === 'released' ? IDS.mh_frontDesk1User : null,
        releasedAt: pkg.status === 'released' ? oneHourAgo : null,
        releasedToName: pkg.status === 'released' ? 'Resident' : null,
      },
    });
  }
  log('OK', `  ${PACKAGE_DATA.length} packages for Maple Heights`);

  // -------------------------------------------------------------------------
  // 12. Maintenance Requests (for Maple Heights)
  // -------------------------------------------------------------------------
  log('12/15', 'Creating maintenance requests...');

  const MAINTENANCE_REQUESTS = [
    {
      ref: 'SR-2026-00001',
      title: 'Kitchen faucet leaking',
      description:
        'The kitchen faucet has been dripping steadily for 2 days. Water is pooling under the sink cabinet. Please fix ASAP.',
      category: 'plumbing',
      status: 'open',
      priority: 'high',
      unitIdx: 0,
      residentId: IDS.mh_resident01,
    },
    {
      ref: 'SR-2026-00002',
      title: 'Bedroom outlet not working',
      description:
        'The outlet in the master bedroom stopped working yesterday. Other outlets in the room work fine. No breaker is tripped.',
      category: 'electrical',
      status: 'in_progress',
      priority: 'normal',
      unitIdx: 1,
      residentId: IDS.mh_resident02,
    },
    {
      ref: 'SR-2026-00003',
      title: 'No heat in unit',
      description:
        'The heating system is not producing warm air. Thermostat is set to 22C but room temperature reads 16C. Very cold.',
      category: 'hvac',
      status: 'open',
      priority: 'critical',
      unitIdx: 2,
      residentId: IDS.mh_resident03,
    },
    {
      ref: 'SR-2026-00004',
      title: 'Dishwasher not draining',
      description:
        'The dishwasher completes its cycle but standing water remains at the bottom. Started 3 days ago.',
      category: 'appliance',
      status: 'on_hold',
      priority: 'normal',
      unitIdx: 3,
      residentId: IDS.mh_resident04,
    },
    {
      ref: 'SR-2026-00005',
      title: 'Front door lock sticking',
      description:
        'The unit front door lock requires multiple attempts to turn. Key goes in fine but the deadbolt is very stiff.',
      category: 'general',
      status: 'closed',
      priority: 'low',
      unitIdx: 4,
      residentId: IDS.mh_resident05,
    },
    {
      ref: 'SR-2026-00006',
      title: 'Bathroom ceiling water stain',
      description:
        'Brown water stain appeared on the bathroom ceiling. Possibly a leak from the unit above. Stain is growing.',
      category: 'plumbing',
      status: 'in_progress',
      priority: 'high',
      unitIdx: 5,
      residentId: IDS.mh_resident06,
    },
    {
      ref: 'SR-2026-00007',
      title: 'Hallway light flickering',
      description:
        'The hallway light in the common area on floor 3 has been flickering intermittently for a week.',
      category: 'electrical',
      status: 'open',
      priority: 'low',
      unitIdx: 6,
      residentId: IDS.mh_resident07,
    },
  ];

  for (let i = 0; i < MAINTENANCE_REQUESTS.length; i++) {
    const mr = MAINTENANCE_REQUESTS[i]!;
    const mrId = `00000000-0000-4000-b100-000000${(i + 1).toString().padStart(6, '0')}`;
    const categoryId =
      maintenanceCatMap[mapleHeights.id]?.[mr.category] ?? `00000000-0000-4000-ad00-000001000001`;

    await prisma.maintenanceRequest.upsert({
      where: { id: mrId },
      update: {
        title: mr.title,
        status: mr.status,
        priority: mr.priority,
      },
      create: {
        id: mrId,
        propertyId: mapleHeights.id,
        unitId: getUnitId(mr.unitIdx),
        residentId: mr.residentId,
        referenceNumber: mr.ref,
        categoryId: categoryId,
        title: mr.title,
        description: mr.description,
        status: mr.status,
        priority: mr.priority,
        permissionToEnter: 'yes',
        source: 'resident',
        dateReported: threeDaysAgo,
        completedDate: mr.status === 'closed' ? oneHourAgo : null,
        resolutionNotes:
          mr.status === 'closed'
            ? 'Lock mechanism replaced and tested. Working smoothly now.'
            : null,
      },
    });
  }
  log('OK', `  ${MAINTENANCE_REQUESTS.length} maintenance requests for Maple Heights`);

  // -------------------------------------------------------------------------
  // 13. Announcements (for Maple Heights)
  // -------------------------------------------------------------------------
  log('13/15', 'Creating announcements...');

  const ANNOUNCEMENTS = [
    {
      title: 'Annual Fire Drill — March 25, 2026',
      content:
        '<p>A mandatory fire drill will take place on <strong>March 25, 2026 at 10:00 AM</strong>. All residents must evacuate via stairwells when the alarm sounds. Please do not use elevators. Assembly point is the main lobby.</p>',
      status: 'published',
      priority: 'high',
      publishedAt: twoDaysAgo,
    },
    {
      title: 'Pool Maintenance Closure — April 1-5',
      content:
        '<p>The swimming pool and hot tub will be closed for annual maintenance from <strong>April 1 through April 5, 2026</strong>. The gym and sauna will remain open. We apologize for the inconvenience.</p>',
      status: 'scheduled',
      priority: 'normal',
      scheduledAt: new Date('2026-03-28T09:00:00'),
    },
    {
      title: 'New Recycling Guidelines',
      content:
        '<p>Starting April 2026, the City of Toronto has updated recycling guidelines. Key changes:</p><ul><li>Soft plastics now accepted in blue bin</li><li>Styrofoam must go to designated drop-off</li><li>Coffee pods — remove foil lid, compost grounds, recycle pod</li></ul><p>Updated signage will be posted in the recycling room.</p>',
      status: 'draft',
      priority: 'normal',
      publishedAt: null,
    },
    {
      title: 'Lobby Renovation Update',
      content:
        '<p>The lobby renovation project is on track. Phase 2 (seating area and mailroom) begins next week. Temporary mail pickup will be at the concierge desk. Thank you for your patience.</p>',
      status: 'published',
      priority: 'normal',
      publishedAt: threeDaysAgo,
    },
  ];

  for (let i = 0; i < ANNOUNCEMENTS.length; i++) {
    const ann = ANNOUNCEMENTS[i]!;
    const annId = `00000000-0000-4000-b200-000000${(i + 1).toString().padStart(6, '0')}`;

    await prisma.announcement.upsert({
      where: { id: annId },
      update: {
        title: ann.title,
        status: ann.status,
        priority: ann.priority,
      },
      create: {
        id: annId,
        propertyId: mapleHeights.id,
        title: ann.title,
        content: ann.content,
        status: ann.status,
        priority: ann.priority,
        channels: ['web', 'email'],
        publishedAt: ann.publishedAt,
        scheduledAt: ann.status === 'scheduled' ? ann.scheduledAt : null,
        createdById: IDS.mh_managerUser,
      },
    });
  }
  log('OK', `  ${ANNOUNCEMENTS.length} announcements for Maple Heights`);

  // -------------------------------------------------------------------------
  // 14. Visitor Entries (for Maple Heights)
  // -------------------------------------------------------------------------
  log('14/15', 'Creating visitor entries...');

  const VISITORS = [
    {
      name: 'John Anderson',
      type: 'visitor',
      unitIdx: 0,
      departureAt: null,
      comments: 'Visiting family for dinner',
    },
    {
      name: 'Maria Santos (PlumbRight Inc.)',
      type: 'contractor',
      unitIdx: 2,
      departureAt: null,
      comments: 'Plumbing repair — unit 302',
    },
    {
      name: 'FedEx Driver',
      type: 'delivery_person',
      unitIdx: 3,
      departureAt: oneHourAgo,
      comments: 'Package delivery',
    },
    {
      name: 'Jane Cooper',
      type: 'visitor',
      unitIdx: 1,
      departureAt: twoDaysAgo,
      comments: 'Social visit',
    },
    {
      name: 'Tom Reynolds (Royal LePage)',
      type: 'real_estate_agent',
      unitIdx: 4,
      departureAt: oneHourAgo,
      comments: 'Unit showing for potential buyer',
    },
    {
      name: 'Sarah Kim',
      type: 'visitor',
      unitIdx: 5,
      departureAt: null,
      comments: 'Weekend guest — staying in guest suite',
    },
    {
      name: 'Mike Electrician (Volt Services)',
      type: 'contractor',
      unitIdx: 1,
      departureAt: threeDaysAgo,
      comments: 'Outlet repair — completed',
    },
  ];

  for (let i = 0; i < VISITORS.length; i++) {
    const v = VISITORS[i]!;
    const vId = `00000000-0000-4000-b300-000000${(i + 1).toString().padStart(6, '0')}`;

    await prisma.visitorEntry.upsert({
      where: { id: vId },
      update: {
        visitorName: v.name,
        visitorType: v.type,
        departureAt: v.departureAt,
        comments: v.comments,
      },
      create: {
        id: vId,
        propertyId: mapleHeights.id,
        unitId: getUnitId(v.unitIdx),
        visitorName: v.name,
        visitorType: v.type,
        arrivalAt: v.departureAt
          ? new Date(v.departureAt.getTime() - 2 * 60 * 60 * 1000)
          : oneHourAgo,
        departureAt: v.departureAt,
        notifyResident: true,
        comments: v.comments,
      },
    });
  }
  log('OK', `  ${VISITORS.length} visitor entries for Maple Heights`);

  // -------------------------------------------------------------------------
  // 15. Security Shifts & Shift Log Entries (for Maple Heights)
  // -------------------------------------------------------------------------
  log('15/15', 'Creating security shifts and log entries...');

  const shiftId1 = '00000000-0000-4000-b400-000000000001';
  const shiftId2 = '00000000-0000-4000-b400-000000000002';

  const shiftStart1 = new Date(now.getTime() - 8 * 60 * 60 * 1000); // 8 hours ago
  const shiftEnd1 = now;
  const shiftStart2 = new Date(now.getTime() - 16 * 60 * 60 * 1000); // 16 hours ago
  const shiftEnd2 = shiftStart1;

  await prisma.securityShift.upsert({
    where: { id: shiftId1 },
    update: { status: 'active' },
    create: {
      id: shiftId1,
      propertyId: mapleHeights.id,
      guardId: IDS.mh_guard1User,
      startTime: shiftStart1,
      endTime: shiftEnd1,
      status: 'active',
      openingNotes:
        'All clear at shift start. Lobby cameras operational. 3 packages pending pickup.',
      equipmentReceived: 'Radio, master key set, flashlight, incident report forms',
    },
  });

  await prisma.securityShift.upsert({
    where: { id: shiftId2 },
    update: { status: 'completed' },
    create: {
      id: shiftId2,
      propertyId: mapleHeights.id,
      guardId: IDS.mh_guard2User,
      startTime: shiftStart2,
      endTime: shiftEnd2,
      actualEndTime: shiftEnd2,
      relievingGuardId: IDS.mh_guard1User,
      status: 'completed',
      openingNotes: 'Received report of noise complaint on floor 4. Will monitor.',
      closingNotes:
        'Noise complaint resolved — residents spoke with each other. All quiet after 10 PM. Completed 3 patrol rounds.',
      equipmentReceived: 'Radio, master key set, flashlight',
      equipmentReturned: 'Radio, master key set, flashlight',
    },
  });

  log('OK', `  2 security shifts for Maple Heights`);

  // Shift Log Entries
  const LOG_ENTRIES = [
    {
      shiftId: shiftId1,
      category: 'general',
      entryText: 'Shift started. Received handoff from Amir (night shift). All systems normal.',
      entryTime: shiftStart1,
    },
    {
      shiftId: shiftId1,
      category: 'patrol_round',
      entryText:
        'Completed patrol round — all floors, parking garage, and rooftop. No issues found.',
      entryTime: new Date(shiftStart1.getTime() + 2 * 60 * 60 * 1000),
    },
    {
      shiftId: shiftId1,
      category: 'resident_interaction',
      entryText:
        'Resident in unit 201 reported a suspicious vehicle in visitor parking (grey sedan, no plate visible). Investigated — vehicle belongs to contractor working in unit 302.',
      entryTime: new Date(shiftStart1.getTime() + 3 * 60 * 60 * 1000),
    },
    {
      shiftId: shiftId2,
      category: 'general',
      entryText: 'Night shift started. Building quiet. Checked all emergency exits — all secured.',
      entryTime: shiftStart2,
    },
    {
      shiftId: shiftId2,
      category: 'alarm_response',
      entryText:
        'Fire alarm triggered on floor 4 at 11:42 PM. Investigated — cooking smoke from unit 408. Reset alarm. No evacuation required.',
      entryTime: new Date(shiftStart2.getTime() + 4 * 60 * 60 * 1000),
    },
  ];

  for (let i = 0; i < LOG_ENTRIES.length; i++) {
    const entry = LOG_ENTRIES[i]!;
    const entryId = `00000000-0000-4000-b500-000000${(i + 1).toString().padStart(6, '0')}`;

    await prisma.shiftLogEntry.upsert({
      where: { id: entryId },
      update: {
        category: entry.category,
        entryText: entry.entryText,
      },
      create: {
        id: entryId,
        shiftId: entry.shiftId,
        entryTime: entry.entryTime,
        category: entry.category,
        entryText: entry.entryText,
        createdById: entry.shiftId === shiftId1 ? IDS.mh_guard1User : IDS.mh_guard2User,
      },
    });
  }
  log('OK', `  ${LOG_ENTRIES.length} shift log entries for Maple Heights`);

  // -------------------------------------------------------------------------
  // Vacation Periods (Gap 3: Resident Vacation Tracking)
  // -------------------------------------------------------------------------

  const vacationPeriod1 = {
    id: '00000000-0000-4000-b600-000000000001',
    propertyId: mapleHeights.id,
    userId: IDS.mh_resident01,
    unitId: units[0]!.id,
    startDate: new Date(2026, 3, 10), // April 10, 2026
    endDate: new Date(2026, 3, 24), // April 24, 2026
    notes: 'Traveling to Europe. Hold mail and packages.',
    holdMail: true,
    isActive: true,
  };

  const vacationPeriod2 = {
    id: '00000000-0000-4000-b600-000000000002',
    propertyId: mapleHeights.id,
    userId: IDS.mh_resident02,
    unitId: units[1]!.id,
    startDate: new Date(2026, 5, 15), // June 15, 2026
    endDate: new Date(2026, 5, 30), // June 30, 2026
    notes: 'Summer cottage in Muskoka',
    holdMail: true,
    isActive: true,
  };

  await prisma.vacationPeriod.upsert({
    where: { id: vacationPeriod1.id },
    update: {},
    create: vacationPeriod1,
  });

  await prisma.vacationPeriod.upsert({
    where: { id: vacationPeriod2.id },
    update: {},
    create: vacationPeriod2,
  });

  log('OK', `  2 vacation periods for Maple Heights`);

  // -------------------------------------------------------------------------
  // Fire Logs (Gap 3.1: Fire Drill Specialized Checklist)
  // -------------------------------------------------------------------------

  const fireLog1 = {
    id: '00000000-0000-4000-b700-000000000001',
    propertyId: mapleHeights.id,
    alarmTime: new Date(2026, 2, 15, 10, 30), // March 15, 2026, 10:30 AM
    alarmLocation: 'Floor 4 - Hallway near stairwell',
    alarmType: 'smoke_detector',
    fireDeptCallTime: new Date(2026, 2, 15, 10, 32),
    firstAnnouncementTime: new Date(2026, 2, 15, 10, 31),
    secondAnnouncementTime: new Date(2026, 2, 15, 10, 33),
    thirdAnnouncementTime: new Date(2026, 2, 15, 10, 35),
    fireDeptArrivalTime: new Date(2026, 2, 15, 10, 42),
    fireDeptAllClearTime: new Date(2026, 2, 15, 10, 58),
    fireDeptDepartureTime: new Date(2026, 2, 15, 11, 5),
    prepareForFdArrival: {
      items: [
        { name: 'Clear main lobby entrance', completed: true, notes: 'Cleared by front desk' },
        { name: 'Position staff at elevator banks', completed: true, notes: 'Security staff posted' },
        { name: 'Alert mechanical room', completed: true, notes: 'Superintendent notified' },
      ],
    },
    ensureElevatorsReset: {
      items: [
        { name: 'Elevator A - recall button', completed: true, notes: 'Reset successfully' },
        { name: 'Elevator B - recall button', completed: true, notes: 'Reset successfully' },
        { name: 'Elevator C - recall button', completed: true, notes: 'Reset successfully' },
      ],
    },
    resetDevices: {
      items: [
        { name: 'Pull Station - Floor 4', completed: true, notes: 'Reset by FD' },
        { name: 'Smoke Detector - Floor 4', completed: true, notes: 'Reset by FD' },
        { name: 'Fire Panel - Main', completed: true, notes: 'Cleared alarm' },
        { name: 'Mag Locks - Entry', completed: true, notes: 'Re-locked' },
      ],
    },
    additionalNotes:
      'False alarm triggered by burnt toast in unit 408. Elevator system functioning normally. All staff performed well during drill.',
    createdById: IDS.mh_securityGuard,
  };

  const fireLog2 = {
    id: '00000000-0000-4000-b700-000000000002',
    propertyId: mapleHeights.id,
    alarmTime: new Date(2026, 2, 25, 14, 15), // March 25, 2026, 2:15 PM
    alarmLocation: 'Floor 2 - Heat detector near kitchen',
    alarmType: 'heat_detector',
    fireDeptCallTime: new Date(2026, 2, 25, 14, 17),
    firstAnnouncementTime: new Date(2026, 2, 25, 14, 16),
    secondAnnouncementTime: new Date(2026, 2, 25, 14, 18),
    thirdAnnouncementTime: null,
    fireDeptArrivalTime: new Date(2026, 2, 25, 14, 28),
    fireDeptAllClearTime: new Date(2026, 2, 25, 14, 40),
    fireDeptDepartureTime: new Date(2026, 2, 25, 14, 45),
    prepareForFdArrival: {
      items: [
        { name: 'Clear main lobby entrance', completed: true, notes: '' },
        { name: 'Position staff at elevator banks', completed: true, notes: 'Quick response' },
      ],
    },
    ensureElevatorsReset: {
      items: [
        { name: 'Elevator A - recall button', completed: true, notes: '' },
        { name: 'Elevator B - recall button', completed: true, notes: '' },
      ],
    },
    resetDevices: {
      items: [
        { name: 'Heat Detector - Floor 2', completed: true, notes: 'Reset by FD' },
        { name: 'Fire Panel - Main', completed: true, notes: 'Cleared alarm' },
      ],
    },
    additionalNotes:
      'Scheduled test drill - all procedures followed correctly. Response time improved from last drill.',
    createdById: IDS.mh_secSupervisorUser,
  };

  await prisma.fireLog.upsert({
    where: { id: fireLog1.id },
    update: {},
    create: fireLog1,
  });

  await prisma.fireLog.upsert({
    where: { id: fireLog2.id },
    update: {},
    create: fireLog2,
  });

  log('OK', `  2 fire logs for Maple Heights`);

  // -------------------------------------------------------------------------
  // Noise Complaints (Gap 3.2: Noise Complaint Specialized Fields)
  // -------------------------------------------------------------------------

  const noiseComplaint1 = {
    id: '00000000-0000-4000-b800-000000000001',
    propertyId: mapleHeights.id,
    complainantFloor: '3',
    suspectFloor: '4',
    noiseDuration: '2 hours',
    noiseVolume: 8,
    natureOfComplaint: ['Party', 'Loud Music'],
    suspectContactMethod: 'Unit 408 - Direct contact',
    counselingNotes: 'Spoke with residents of unit 408. They were having small dinner party. Agreed to keep music lower after 10 PM.',
    resolutionStatus: 'resolved',
    createdById: IDS.mh_frontDesk1User,
  };

  const noiseComplaint2 = {
    id: '00000000-0000-4000-b800-000000000002',
    propertyId: mapleHeights.id,
    complainantFloor: '5',
    suspectFloor: '5',
    noiseDuration: '30 minutes',
    noiseVolume: 7,
    natureOfComplaint: ['Dog Barking'],
    suspectContactMethod: 'Unit 505 - Via text note',
    counselingNotes: 'Contacted resident re: dog barking. They have small terrier with separation anxiety. Offered building resources and local trainer recommendations.',
    resolutionStatus: 'ongoing',
    createdById: IDS.mh_guard1User,
  };

  const noiseComplaint3 = {
    id: '00000000-0000-4000-b800-000000000003',
    propertyId: mapleHeights.id,
    complainantFloor: '2',
    suspectFloor: '3',
    noiseDuration: 'ongoing (past 3 days)',
    noiseVolume: 6,
    natureOfComplaint: ['Construction', 'Walking/Banging'],
    suspectContactMethod: 'Unknown - ongoing renovations',
    counselingNotes: 'Unit 305 undergoing alteration project. Construction hours limited to 8 AM - 6 PM weekdays per bylaw. Complaint registered. Alteration project escalated for review.',
    resolutionStatus: 'escalated',
    createdById: IDS.mh_propertyManager,
  };

  await prisma.noiseComplaint.upsert({
    where: { id: noiseComplaint1.id },
    update: {},
    create: noiseComplaint1,
  });

  await prisma.noiseComplaint.upsert({
    where: { id: noiseComplaint2.id },
    update: {},
    create: noiseComplaint2,
  });

  await prisma.noiseComplaint.upsert({
    where: { id: noiseComplaint3.id },
    update: {},
    create: noiseComplaint3,
  });

  log('OK', `  3 noise complaints for Maple Heights`);

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log('\n========================================');
  console.log('  Seed Complete');
  console.log('========================================');
  console.log(`
  Super Admin:    admin@concierge.app / SuperAdmin123!
  Staff password: StaffPass123!@
  Resident password: Resident123!@

  Properties:
    - Maple Heights Condominiums (200 units, Toronto)
    - Lakeshore Towers (150 units, Mississauga)

  Per property:
    - 11 roles (system defaults)
    - 10 staff users + 10 residents
    - 20 units (floors 1-5, 4 per floor)
    - 5 event groups, 15 event types
    - 7 courier types (Amazon, FedEx, UPS, Canada Post, DHL, Purolator, Other)
    - 6 amenities (Party Room, Gym, Pool, BBQ, Guest Suite, Rooftop Lounge)
    - 6 maintenance categories
    - Property settings with operational toggles

  Maple Heights demo data:
    - 12 packages (mix of unreleased/released, some perishable)
    - 7 maintenance requests (various statuses)
    - 4 announcements (draft, published, scheduled)
    - 7 visitor entries (active + signed out)
    - 2 security shifts with 5 log entries
`);
}

// ---------------------------------------------------------------------------
// Execute (only when run directly, not when imported)
// ---------------------------------------------------------------------------

const isMainModule =
  typeof process !== 'undefined' &&
  process.argv[1] &&
  (process.argv[1].includes('seed.ts') || process.argv[1].includes('seed.js'));

if (isMainModule) {
  main()
    .then(async () => {
      await prisma.$disconnect();
    })
    .catch(async (error) => {
      console.error('\nSeed failed:', error);
      await prisma.$disconnect();
      process.exit(1);
    });
}
