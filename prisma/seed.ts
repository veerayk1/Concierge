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

async function main(): Promise<void> {
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
  log('1/7', 'Creating Super Admin user...');

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
  log('2/7', 'Creating properties...');

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
  log('3/7', 'Creating roles for each property...');

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

      roleMap[property.id][roleDef.slug] = role.id;
    }
    log('OK', `  ${ROLE_DEFINITIONS.length} roles for ${property.name}`);
  }

  // -------------------------------------------------------------------------
  // 4. Staff Users + UserProperty assignments
  // -------------------------------------------------------------------------
  log('4/7', 'Creating staff and resident users...');

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

      const roleId = roleMap[property.id][u.roleSlug];
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
    const saRoleId = roleMap[property.id]['super_admin'];
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
  log('5/7', 'Creating units...');

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
  log('6/7', 'Creating event groups and event types...');

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

      eventGroupIdMap[property.id][groupDef.slug] = group.id;

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
  log('7/7', 'Creating property settings...');

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
    - Property settings with operational toggles
`);
}

// ---------------------------------------------------------------------------
// Execute
// ---------------------------------------------------------------------------

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error('\nSeed failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  });
