import { describe, expect, it } from 'vitest';
import {
  getNavigationForRole,
  getFlatNavigationForRole,
  getAllNavGroups,
  ROLE_DISPLAY_NAMES,
} from '../navigation';
import type { Role } from '@/types';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** All 14 roles in the system. */
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

function groupLabels(role: Role): string[] {
  return getNavigationForRole(role).map((g) => g.label);
}

function itemIds(role: Role): string[] {
  return getFlatNavigationForRole(role).map((i) => i.id);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Navigation System', () => {
  // -----------------------------------------------------------------------
  // getNavigationForRole — role-specific groups
  // -----------------------------------------------------------------------

  describe('getNavigationForRole', () => {
    // 1
    it('returns SYSTEM group for super_admin', () => {
      const labels = groupLabels('super_admin');
      expect(labels).toContain('SYSTEM');
    });

    // 2
    it('does not return SYSTEM group for property_admin', () => {
      const labels = groupLabels('property_admin');
      expect(labels).not.toContain('SYSTEM');
    });

    // 3
    it('returns MY UNIT group for resident_owner', () => {
      const labels = groupLabels('resident_owner');
      expect(labels).toContain('MY UNIT');
    });

    // 4
    it('returns BUILDING group for resident_tenant', () => {
      const labels = groupLabels('resident_tenant');
      expect(labels).toContain('BUILDING');
    });

    // 5
    it('returns BUILDING group for resident_owner', () => {
      const labels = groupLabels('resident_owner');
      expect(labels).toContain('BUILDING');
    });

    // 6
    it('returns OPERATIONS group for security_guard', () => {
      const labels = groupLabels('security_guard');
      expect(labels).toContain('OPERATIONS');
    });

    // 7
    it('returns OPERATIONS group for front_desk', () => {
      const labels = groupLabels('front_desk');
      expect(labels).toContain('OPERATIONS');
    });

    // 8
    it('returns GOVERNANCE group for board_member', () => {
      const labels = groupLabels('board_member');
      expect(labels).toContain('GOVERNANCE');
    });

    // 9
    it('returns INFORMATION group for board_member', () => {
      const labels = groupLabels('board_member');
      expect(labels).toContain('INFORMATION');
    });

    // 10
    it('returns DAILY group for security_guard', () => {
      const labels = groupLabels('security_guard');
      expect(labels).toContain('DAILY');
    });

    // 11
    it('returns MANAGEMENT group for property_admin', () => {
      const labels = groupLabels('property_admin');
      expect(labels).toContain('MANAGEMENT');
    });

    // 12
    it('returns ACCOUNT group for family_member', () => {
      const labels = groupLabels('family_member');
      expect(labels).toContain('ACCOUNT');
    });

    // 13
    it('visitor sees only OVERVIEW (dashboard)', () => {
      const groups = getNavigationForRole('visitor');
      expect(groups).toHaveLength(1);
      expect(groups[0].label).toBe('OVERVIEW');
      expect(groups[0].items).toHaveLength(1);
      expect(groups[0].items[0].id).toBe('dashboard');
    });

    // 14
    it('excludes empty groups — visitor has no SYSTEM group', () => {
      const labels = groupLabels('visitor');
      expect(labels).not.toContain('SYSTEM');
      expect(labels).not.toContain('OPERATIONS');
      expect(labels).not.toContain('MANAGEMENT');
    });

    // 15
    it('super_admin sees platform-level groups only (not property-level OPERATIONS/COMMUNITY)', () => {
      const labels = groupLabels('super_admin');
      expect(labels).toContain('SYSTEM');
      expect(labels).toContain('OVERVIEW');
      expect(labels).toContain('MANAGEMENT');
      // Super Admin is a platform-level role — should NOT see property-level groups
      expect(labels).not.toContain('OPERATIONS');
      expect(labels).not.toContain('COMMUNITY');
    });

    // 16
    it('items not in role list are absent (not disabled)', () => {
      const residentItems = getFlatNavigationForRole('resident_owner');
      const residentIds = residentItems.map((i) => i.id);
      // Residents should NOT see settings, user management, etc.
      expect(residentIds).not.toContain('settings');
      expect(residentIds).not.toContain('user-management');
      expect(residentIds).not.toContain('security-console');
    });

    // 17
    it('front_desk sees packages and security console', () => {
      const ids = itemIds('front_desk');
      expect(ids).toContain('packages');
      expect(ids).toContain('security-console');
    });

    // 18
    it('front_desk sees shift log and training in DAILY', () => {
      const ids = itemIds('front_desk');
      expect(ids).toContain('shift-log');
      expect(ids).toContain('daily-training');
    });

    // 19
    it('maintenance_staff sees service-requests', () => {
      const ids = itemIds('maintenance_staff');
      expect(ids).toContain('service-requests');
    });

    // 20
    it('superintendent sees building-systems', () => {
      const ids = itemIds('superintendent');
      expect(ids).toContain('building-systems');
    });

    // 21
    it('offsite_owner sees announcements in BUILDING', () => {
      const groups = getNavigationForRole('offsite_owner');
      const buildingGroup = groups.find((g) => g.label === 'BUILDING');
      expect(buildingGroup).toBeDefined();
      const ids = buildingGroup!.items.map((i) => i.id);
      expect(ids).toContain('resident-announcements');
    });

    // 22
    it('security_supervisor sees parking', () => {
      const ids = itemIds('security_supervisor');
      expect(ids).toContain('parking');
    });
  });

  // -----------------------------------------------------------------------
  // getFlatNavigationForRole
  // -----------------------------------------------------------------------

  describe('getFlatNavigationForRole', () => {
    // 23
    it('returns flat list without group structure', () => {
      const flat = getFlatNavigationForRole('super_admin');
      expect(Array.isArray(flat)).toBe(true);
      expect(flat.length).toBeGreaterThan(0);
      // Flat items have id, label, href, icon, roles
      for (const item of flat) {
        expect(item).toHaveProperty('id');
        expect(item).toHaveProperty('label');
        expect(item).toHaveProperty('href');
        expect(item).toHaveProperty('icon');
        expect(item).toHaveProperty('roles');
      }
    });

    // 24
    it('returns empty-ish list for visitor (only dashboard)', () => {
      const flat = getFlatNavigationForRole('visitor');
      expect(flat).toHaveLength(1);
      expect(flat[0].id).toBe('dashboard');
    });

    // 25
    it('super_admin flat list is longer than resident list', () => {
      const adminItems = getFlatNavigationForRole('super_admin');
      const residentItems = getFlatNavigationForRole('resident_owner');
      expect(adminItems.length).toBeGreaterThan(residentItems.length);
    });
  });

  // -----------------------------------------------------------------------
  // ROLE_DISPLAY_NAMES
  // -----------------------------------------------------------------------

  describe('ROLE_DISPLAY_NAMES', () => {
    // 26
    it('has entries for all 14 roles', () => {
      for (const role of ALL_ROLES) {
        expect(ROLE_DISPLAY_NAMES[role]).toBeDefined();
        expect(typeof ROLE_DISPLAY_NAMES[role]).toBe('string');
        expect(ROLE_DISPLAY_NAMES[role].length).toBeGreaterThan(0);
      }
    });

    // 27
    it('maps super_admin to "Super Admin"', () => {
      expect(ROLE_DISPLAY_NAMES.super_admin).toBe('Super Admin');
    });

    // 28
    it('maps front_desk to "Front Desk / Concierge"', () => {
      expect(ROLE_DISPLAY_NAMES.front_desk).toBe('Front Desk / Concierge');
    });

    // 29
    it('maps visitor to "Visitor"', () => {
      expect(ROLE_DISPLAY_NAMES.visitor).toBe('Visitor');
    });
  });

  // -----------------------------------------------------------------------
  // getAllNavGroups — structural integrity
  // -----------------------------------------------------------------------

  describe('getAllNavGroups', () => {
    // 30
    it('returns all navigation groups', () => {
      const groups = getAllNavGroups();
      expect(groups.length).toBeGreaterThan(0);
    });

    // 31
    it('all nav items have required fields (id, label, href, icon, roles)', () => {
      const groups = getAllNavGroups();
      for (const group of groups) {
        for (const item of group.items) {
          expect(typeof item.id).toBe('string');
          expect(item.id.length).toBeGreaterThan(0);
          expect(typeof item.label).toBe('string');
          expect(item.label.length).toBeGreaterThan(0);
          expect(typeof item.href).toBe('string');
          expect(item.href.startsWith('/')).toBe(true);
          expect(item.icon).toBeDefined();
          expect(Array.isArray(item.roles)).toBe(true);
          expect(item.roles.length).toBeGreaterThan(0);
        }
      }
    });

    // 32
    it('has no duplicate IDs across all groups', () => {
      const groups = getAllNavGroups();
      const allIds = groups.flatMap((g) => g.items.map((i) => i.id));
      const uniqueIds = new Set(allIds);
      expect(uniqueIds.size).toBe(allIds.length);
    });

    // 33
    it('every group has a non-empty label', () => {
      const groups = getAllNavGroups();
      for (const group of groups) {
        expect(typeof group.label).toBe('string');
        expect(group.label.length).toBeGreaterThan(0);
      }
    });

    // 34
    it('every group has at least one item', () => {
      const groups = getAllNavGroups();
      for (const group of groups) {
        expect(group.items.length).toBeGreaterThan(0);
      }
    });

    // 35
    it('all roles referenced in nav items are valid roles', () => {
      const groups = getAllNavGroups();
      const validRoles = new Set(ALL_ROLES);
      for (const group of groups) {
        for (const item of group.items) {
          for (const role of item.roles) {
            expect(validRoles.has(role)).toBe(true);
          }
        }
      }
    });

    // 36
    it('dashboard item is visible to all 14 roles', () => {
      const groups = getAllNavGroups();
      const dashboardItem = groups.flatMap((g) => g.items).find((i) => i.id === 'dashboard');
      expect(dashboardItem).toBeDefined();
      expect(dashboardItem!.roles.length).toBe(ALL_ROLES.length);
    });

    // 37
    it('developer-portal is super_admin only', () => {
      const groups = getAllNavGroups();
      const devPortal = groups.flatMap((g) => g.items).find((i) => i.id === 'developer-portal');
      expect(devPortal).toBeDefined();
      expect(devPortal!.roles).toEqual(['super_admin']);
    });
  });

  // -----------------------------------------------------------------------
  // Cross-role consistency
  // -----------------------------------------------------------------------

  describe('cross-role consistency', () => {
    // 38
    it('every role gets at least the dashboard', () => {
      for (const role of ALL_ROLES) {
        const ids = itemIds(role);
        expect(ids).toContain('dashboard');
      }
    });

    // 39
    it('no role gets an empty navigation', () => {
      for (const role of ALL_ROLES) {
        const groups = getNavigationForRole(role);
        expect(groups.length).toBeGreaterThan(0);
      }
    });
  });
});
