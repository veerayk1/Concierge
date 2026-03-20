/**
 * Navigation Completeness Tests
 *
 * Validates the navigation configuration against the application:
 *   - Every navigation item has a corresponding page file
 *   - Every role has at least one navigation item
 *   - No broken href links in navigation config
 *   - Admin roles see Settings, non-admin roles do not
 *   - Resident role sees only resident-appropriate items
 *   - Badge counts are defined for applicable items (packages, etc.)
 *
 * Uses the navigation module directly (getNavigationForRole, getAllNavGroups)
 * and checks the filesystem for page existence.
 *
 * @module test/navigation/completeness
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

import {
  getNavigationForRole,
  getAllNavGroups,
  getFlatNavigationForRole,
  ROLE_DISPLAY_NAMES,
} from '@/lib/navigation';
import type { Role } from '@/types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROJECT_ROOT = process.cwd();

/**
 * All 14 roles in the system.
 */
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

const ADMIN_ROLES: Role[] = ['super_admin', 'property_admin'];
const STAFF_ROLES: Role[] = [
  'property_manager',
  'security_supervisor',
  'security_guard',
  'front_desk',
  'maintenance_staff',
  'superintendent',
];
const RESIDENT_ROLES: Role[] = [
  'resident_owner',
  'resident_tenant',
  'family_member',
  'offsite_owner',
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Checks if a page file exists for a given href.
 * Handles Next.js App Router conventions:
 *   /dashboard -> src/app/(portal)/dashboard/page.tsx
 *   /settings -> src/app/(admin)/settings/page.tsx or src/app/(portal)/settings/page.tsx
 *   /system/billing -> src/app/(portal)/system/billing/page.tsx
 */
function pageExistsForHref(href: string): boolean {
  // Route groups to check (Next.js App Router groups)
  const routeGroups = ['(portal)', '(admin)', '(auth)', '(marketing)', ''];

  for (const group of routeGroups) {
    const pagePath = group
      ? path.join(PROJECT_ROOT, 'src/app', group, href, 'page.tsx')
      : path.join(PROJECT_ROOT, 'src/app', href, 'page.tsx');

    if (fs.existsSync(pagePath)) {
      return true;
    }
  }

  return false;
}

// ---------------------------------------------------------------------------
// 1. Every navigation item has a corresponding page file
// ---------------------------------------------------------------------------

describe('Every navigation item has a corresponding page file', () => {
  const allGroups = getAllNavGroups();
  const allItems = allGroups.flatMap((g) => g.items);

  // Deduplicate by href (some items share the same href across groups)
  const uniqueHrefs = [...new Set(allItems.map((item) => item.href))];

  /**
   * Pages not yet implemented. These are tracked as Phase 4 work items.
   * Each entry here represents a nav item whose page file has not been created yet.
   */
  const PENDING_PAGES = new Set<string>([
    // All nav pages now have at least a placeholder page file
  ]);

  const implementedHrefs = uniqueHrefs.filter((h) => !PENDING_PAGES.has(h));

  it.each(implementedHrefs)('page file exists for href "%s"', (href) => {
    const exists = pageExistsForHref(href);
    if (!exists) {
      // Provide helpful debugging info
      const matchingItems = allItems.filter((i) => i.href === href);
      const labels = matchingItems.map((i) => i.label).join(', ');
      expect(
        exists,
        `No page.tsx found for href "${href}" (nav items: ${labels}). ` +
          `Checked src/app/(portal)${href}/page.tsx, src/app/(admin)${href}/page.tsx, etc.`,
      ).toBe(true);
    }
  });

  it('tracks pending pages that need implementation', () => {
    // Verify our PENDING_PAGES set is accurate — these hrefs should NOT have pages
    for (const pendingHref of PENDING_PAGES) {
      expect(
        pageExistsForHref(pendingHref),
        `Pending page "${pendingHref}" now exists! Remove it from PENDING_PAGES set.`,
      ).toBe(false);
    }
  });
});

// ---------------------------------------------------------------------------
// 2. Every role has at least one navigation item
// ---------------------------------------------------------------------------

describe('Every role has at least one navigation item', () => {
  it.each(ALL_ROLES)('role "%s" has at least one visible navigation item', (role) => {
    const navItems = getFlatNavigationForRole(role);
    expect(
      navItems.length,
      `Role "${role}" has zero navigation items. Every role must see at least a dashboard.`,
    ).toBeGreaterThan(0);
  });

  it('every role sees the Dashboard item', () => {
    for (const role of ALL_ROLES) {
      const items = getFlatNavigationForRole(role);
      const hasDashboard = items.some(
        (item) => item.id === 'dashboard' || item.href === '/dashboard',
      );
      expect(
        hasDashboard,
        `Role "${role}" cannot see the Dashboard. All roles should have dashboard access.`,
      ).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// 3. No broken href links in navigation config
// ---------------------------------------------------------------------------

describe('No broken href links in navigation config', () => {
  it('all hrefs start with /', () => {
    const allGroups = getAllNavGroups();
    const allItems = allGroups.flatMap((g) => g.items);

    for (const item of allItems) {
      expect(
        item.href.startsWith('/'),
        `Nav item "${item.label}" has href "${item.href}" that does not start with /`,
      ).toBe(true);
    }
  });

  it('no hrefs contain double slashes', () => {
    const allGroups = getAllNavGroups();
    const allItems = allGroups.flatMap((g) => g.items);

    for (const item of allItems) {
      expect(
        item.href.includes('//'),
        `Nav item "${item.label}" has href "${item.href}" with double slashes`,
      ).toBe(false);
    }
  });

  it('no hrefs contain spaces or special characters', () => {
    const allGroups = getAllNavGroups();
    const allItems = allGroups.flatMap((g) => g.items);

    for (const item of allItems) {
      expect(item.href, `Nav item "${item.label}" href should not contain spaces`).not.toMatch(
        /\s/,
      );

      // Only allow alphanumeric, hyphens, slashes
      expect(item.href, `Nav item "${item.label}" href contains unexpected characters`).toMatch(
        /^[a-z0-9/\-]+$/,
      );
    }
  });

  it('all nav items have non-empty labels', () => {
    const allGroups = getAllNavGroups();
    const allItems = allGroups.flatMap((g) => g.items);

    for (const item of allItems) {
      expect(item.label.length).toBeGreaterThan(0);
    }
  });

  it('all nav items have unique IDs within their group', () => {
    const allGroups = getAllNavGroups();
    // IDs should be globally unique
    const allIds = allGroups.flatMap((g) => g.items.map((i) => i.id));
    const uniqueIds = new Set(allIds);
    expect(uniqueIds.size).toBe(allIds.length);
  });

  it('all nav items have an icon component assigned', () => {
    const allGroups = getAllNavGroups();
    const allItems = allGroups.flatMap((g) => g.items);

    for (const item of allItems) {
      expect(item.icon, `Nav item "${item.label}" is missing an icon component`).toBeDefined();
      // Lucide icons are either function components or ForwardRef objects
      expect(
        typeof item.icon === 'function' || typeof item.icon === 'object',
        `Icon for "${item.label}" should be a function or object component`,
      ).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// 4. Admin roles see Settings, non-admin roles do not
// ---------------------------------------------------------------------------

describe('Settings visibility — admin vs non-admin', () => {
  it('super_admin sees Settings', () => {
    const items = getFlatNavigationForRole('super_admin');
    const settingsItem = items.find((i) => i.id === 'settings');
    expect(settingsItem).toBeDefined();
    expect(settingsItem!.href).toBe('/settings');
  });

  it('property_admin sees Settings', () => {
    const items = getFlatNavigationForRole('property_admin');
    const settingsItem = items.find((i) => i.id === 'settings');
    expect(settingsItem).toBeDefined();
  });

  it.each(STAFF_ROLES)('staff role "%s" does NOT see Settings', (role) => {
    const items = getFlatNavigationForRole(role);
    const settingsItem = items.find((i) => i.id === 'settings');
    expect(settingsItem, `Staff role "${role}" should not see Settings nav item`).toBeUndefined();
  });

  it.each(RESIDENT_ROLES)('resident role "%s" does NOT see Settings', (role) => {
    const items = getFlatNavigationForRole(role);
    const settingsItem = items.find((i) => i.id === 'settings');
    expect(
      settingsItem,
      `Resident role "${role}" should not see Settings nav item`,
    ).toBeUndefined();
  });

  it('only super_admin and property_admin can manage users', () => {
    for (const role of ALL_ROLES) {
      const items = getFlatNavigationForRole(role);
      const userMgmt = items.find((i) => i.id === 'user-management');
      if (ADMIN_ROLES.includes(role)) {
        expect(userMgmt, `Admin role "${role}" should see User Management`).toBeDefined();
      } else {
        expect(userMgmt, `Non-admin role "${role}" should NOT see User Management`).toBeUndefined();
      }
    }
  });
});

// ---------------------------------------------------------------------------
// 5. Resident role sees only resident-appropriate items
// ---------------------------------------------------------------------------

describe('Resident role navigation is appropriately scoped', () => {
  const RESIDENT_ALLOWED_IDS = new Set([
    'dashboard',
    'my-packages',
    'my-requests',
    'amenity-booking',
    'resident-announcements',
    'events',
    'resident-marketplace',
    'resident-library',
    'resident-surveys',
    'resident-forum',
    'resident-ideas',
    'resident-photo-albums',
    'my-account',
  ]);

  const STAFF_ONLY_IDS = new Set([
    'security-console',
    'packages',
    'service-requests',
    'parking',
    'shift-log',
    'visitors',
    'keys-fobs',
    'vendors',
    'inspections',
    'equipment-ops',
    'recurring-tasks',
    'alterations',
    'reports',
    'user-management',
    'training',
    'logs',
    'settings',
    'building-directory',
    'digital-signage',
    'compliance',
    'data-migration',
    'developer-portal',
  ]);

  it('resident_owner sees MY UNIT items', () => {
    const items = getFlatNavigationForRole('resident_owner');
    const myPackages = items.find((i) => i.id === 'my-packages');
    const myRequests = items.find((i) => i.id === 'my-requests');
    const amenityBooking = items.find((i) => i.id === 'amenity-booking');

    expect(myPackages).toBeDefined();
    expect(myRequests).toBeDefined();
    expect(amenityBooking).toBeDefined();
  });

  it('resident_owner sees BUILDING community items', () => {
    const items = getFlatNavigationForRole('resident_owner');
    const announcements = items.find((i) => i.id === 'resident-announcements');
    const events = items.find((i) => i.id === 'events');
    const library = items.find((i) => i.id === 'resident-library');
    const surveys = items.find((i) => i.id === 'resident-surveys');

    expect(announcements).toBeDefined();
    expect(events).toBeDefined();
    expect(library).toBeDefined();
    expect(surveys).toBeDefined();
  });

  it('resident_owner sees My Account', () => {
    const items = getFlatNavigationForRole('resident_owner');
    const account = items.find((i) => i.id === 'my-account');
    expect(account).toBeDefined();
  });

  it.each(['resident_owner', 'resident_tenant'] as Role[])(
    '%s does NOT see staff-only navigation items',
    (role) => {
      const items = getFlatNavigationForRole(role);
      const staffItems = items.filter((i) => STAFF_ONLY_IDS.has(i.id));
      expect(
        staffItems.map((i) => i.id),
        `Resident role "${role}" should not see staff-only items`,
      ).toEqual([]);
    },
  );

  it('family_member sees limited items (packages, booking, announcements, events)', () => {
    const items = getFlatNavigationForRole('family_member');
    const ids = items.map((i) => i.id);

    expect(ids).toContain('dashboard');
    expect(ids).toContain('my-packages');
    expect(ids).toContain('amenity-booking');
    expect(ids).toContain('resident-announcements');
    expect(ids).toContain('my-account');

    // Family members should NOT see maintenance requests or surveys
    expect(ids).not.toContain('my-requests');
    expect(ids).not.toContain('resident-surveys');
  });

  it('offsite_owner sees announcements, events, library, surveys but NOT marketplace/forum', () => {
    const items = getFlatNavigationForRole('offsite_owner');
    const ids = items.map((i) => i.id);

    expect(ids).toContain('dashboard');
    expect(ids).toContain('resident-announcements');
    expect(ids).toContain('events');
    expect(ids).toContain('resident-library');
    expect(ids).toContain('resident-surveys');
    expect(ids).toContain('my-account');

    // Offsite owners should NOT see marketplace or forum
    expect(ids).not.toContain('resident-marketplace');
    expect(ids).not.toContain('resident-forum');
  });

  it('visitor role sees only dashboard', () => {
    const items = getFlatNavigationForRole('visitor');
    expect(items.length).toBeGreaterThanOrEqual(1);

    const ids = items.map((i) => i.id);
    expect(ids).toContain('dashboard');

    // Visitors should not see any operational items
    expect(ids).not.toContain('packages');
    expect(ids).not.toContain('security-console');
    expect(ids).not.toContain('my-packages');
  });
});

// ---------------------------------------------------------------------------
// 6. Badge counts are defined for applicable items
// ---------------------------------------------------------------------------

describe('Badge counts on applicable navigation items', () => {
  it('packages item has a badgeKey for unreleased package count', () => {
    const allGroups = getAllNavGroups();
    const allItems = allGroups.flatMap((g) => g.items);
    const packagesItem = allItems.find((i) => i.id === 'packages');

    expect(packagesItem).toBeDefined();
    expect(packagesItem!.badgeKey).toBe('unreleased_packages');
  });

  it('my-packages item has a badgeKey for resident package count', () => {
    const allGroups = getAllNavGroups();
    const allItems = allGroups.flatMap((g) => g.items);
    const myPackages = allItems.find((i) => i.id === 'my-packages');

    expect(myPackages).toBeDefined();
    expect(myPackages!.badgeKey).toBe('my_packages');
  });

  it('items without badge counts have badgeKey as undefined', () => {
    const allGroups = getAllNavGroups();
    const allItems = allGroups.flatMap((g) => g.items);

    // Most items should NOT have a badge key
    const itemsWithBadge = allItems.filter((i) => i.badgeKey !== undefined);
    const itemsWithoutBadge = allItems.filter((i) => i.badgeKey === undefined);

    // At least 2 items have badges (packages, my-packages)
    expect(itemsWithBadge.length).toBeGreaterThanOrEqual(2);
    // Most items do not have badges
    expect(itemsWithoutBadge.length).toBeGreaterThan(itemsWithBadge.length);
  });
});

// ---------------------------------------------------------------------------
// 7. Role display names completeness
// ---------------------------------------------------------------------------

describe('Role display names', () => {
  it('every role has a display name defined', () => {
    for (const role of ALL_ROLES) {
      expect(ROLE_DISPLAY_NAMES[role], `Missing display name for role "${role}"`).toBeDefined();
      expect(ROLE_DISPLAY_NAMES[role].length).toBeGreaterThan(0);
    }
  });

  it('display names are human-readable (no underscores, proper capitalization)', () => {
    for (const role of ALL_ROLES) {
      const displayName = ROLE_DISPLAY_NAMES[role];
      expect(
        displayName,
        `Display name "${displayName}" for role "${role}" contains underscore`,
      ).not.toContain('_');

      // First character should be uppercase
      expect(displayName![0]).toBe(displayName![0]!.toUpperCase());
    }
  });
});

// ---------------------------------------------------------------------------
// 8. Navigation groups structure
// ---------------------------------------------------------------------------

describe('Navigation groups structure', () => {
  it('all groups have a non-empty label', () => {
    const groups = getAllNavGroups();
    for (const group of groups) {
      expect(group.label.length).toBeGreaterThan(0);
    }
  });

  it('all groups have at least one item', () => {
    const groups = getAllNavGroups();
    for (const group of groups) {
      expect(group.items.length, `Group "${group.label}" has zero items`).toBeGreaterThan(0);
    }
  });

  it('group labels are uppercase (section header convention)', () => {
    const groups = getAllNavGroups();
    for (const group of groups) {
      expect(group.label, `Group label "${group.label}" should be uppercase`).toBe(
        group.label.toUpperCase(),
      );
    }
  });

  it('getNavigationForRole returns empty groups filtered out', () => {
    // Visitor should get very few groups, and none should be empty
    const groups = getNavigationForRole('visitor');
    for (const group of groups) {
      expect(group.items.length).toBeGreaterThan(0);
    }
  });

  it('property_admin sees the most navigation items (super_admin is platform-level only)', () => {
    const propertyAdminItems = getFlatNavigationForRole('property_admin');
    for (const role of ALL_ROLES) {
      if (role === 'property_admin') continue;
      const roleItems = getFlatNavigationForRole(role);
      expect(
        propertyAdminItems.length,
        `property_admin should see at least as many items as ${role}`,
      ).toBeGreaterThanOrEqual(roleItems.length);
    }
  });
});
