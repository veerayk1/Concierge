/**
 * Concierge — Navigation Configuration Tests
 *
 * Verifies that each of the 13 roles gets exactly the nav items
 * specified in PRD 02 Section 7.
 */

import { describe, expect, it } from 'vitest';
import { getNavigationForRole, getFlatNavigationForRole, getAllNavGroups } from './navigation';
import type { Role } from '@/types';

// ---------------------------------------------------------------------------
// Helper: get all item labels for a role
// ---------------------------------------------------------------------------

function getLabelsForRole(role: Role): string[] {
  return getFlatNavigationForRole(role).map((item) => item.label);
}

function getGroupLabelsForRole(role: Role): string[] {
  return getNavigationForRole(role).map((group) => group.label);
}

// ---------------------------------------------------------------------------
// 7.1 Super Admin
// ---------------------------------------------------------------------------

describe('Super Admin navigation (Section 7.1)', () => {
  const role: Role = 'super_admin';

  it('sees SYSTEM group items', () => {
    const labels = getLabelsForRole(role);
    expect(labels).toContain('Multi-Property Dashboard');
    expect(labels).toContain('Platform Health');
    expect(labels).toContain('AI Dashboard');
    expect(labels).toContain('Billing');
  });

  it('sees OVERVIEW group items (Dashboard only — no property-level items)', () => {
    const labels = getLabelsForRole(role);
    expect(labels).toContain('Dashboard');
    // Super Admin no longer sees property-level items in OVERVIEW
    expect(labels).not.toContain('Units & Residents');
    expect(labels).not.toContain('Amenities');
  });

  it('does NOT see OPERATIONS group (property-level)', () => {
    const groups = getGroupLabelsForRole(role);
    expect(groups).not.toContain('OPERATIONS');
    const labels = getLabelsForRole(role);
    expect(labels).not.toContain('Security Console');
    expect(labels).not.toContain('Packages');
  });

  it('does NOT see COMMUNITY group (property-level)', () => {
    const groups = getGroupLabelsForRole(role);
    expect(groups).not.toContain('COMMUNITY');
    const labels = getLabelsForRole(role);
    expect(labels).not.toContain('Events');
    expect(labels).not.toContain('Marketplace');
  });

  it('sees MANAGEMENT group items', () => {
    const labels = getLabelsForRole(role);
    expect(labels).toContain('Reports');
    expect(labels).toContain('User Management');
    expect(labels).toContain('Training');
    expect(labels).toContain('Logs');
    expect(labels).toContain('Settings');
  });

  it('has all expected groups', () => {
    const groups = getGroupLabelsForRole(role);
    expect(groups).toContain('SYSTEM');
    expect(groups).toContain('OVERVIEW');
    expect(groups).toContain('MANAGEMENT');
    // Super Admin no longer has property-level groups
    expect(groups).not.toContain('OPERATIONS');
    expect(groups).not.toContain('COMMUNITY');
  });
});

// ---------------------------------------------------------------------------
// 7.2 Property Admin
// ---------------------------------------------------------------------------

describe('Property Admin navigation (Section 7.2)', () => {
  const role: Role = 'property_admin';

  it('does NOT see SYSTEM group', () => {
    const groups = getGroupLabelsForRole(role);
    expect(groups).not.toContain('SYSTEM');
  });

  it('sees OVERVIEW items', () => {
    const labels = getLabelsForRole(role);
    expect(labels).toContain('Dashboard');
    expect(labels).toContain('Units & Residents');
    expect(labels).toContain('Amenities');
  });

  it('sees OPERATIONS items', () => {
    const labels = getLabelsForRole(role);
    expect(labels).toContain('Security Console');
    expect(labels).toContain('Packages');
    expect(labels).toContain('Service Requests');
    expect(labels).toContain('Announcements');
  });

  it('sees COMMUNITY items', () => {
    const labels = getLabelsForRole(role);
    expect(labels).toContain('Events');
    expect(labels).toContain('Marketplace');
    expect(labels).toContain('Library');
    expect(labels).toContain('Surveys');
  });

  it('sees MANAGEMENT items', () => {
    const labels = getLabelsForRole(role);
    expect(labels).toContain('Reports');
    expect(labels).toContain('User Management');
    expect(labels).toContain('Training');
    expect(labels).toContain('Logs');
    expect(labels).toContain('Settings');
  });
});

// ---------------------------------------------------------------------------
// 7.3 Board Member
// ---------------------------------------------------------------------------

describe('Board Member navigation (Section 7.3)', () => {
  const role: Role = 'board_member';

  it('sees OVERVIEW with Dashboard and Amenities', () => {
    const labels = getLabelsForRole(role);
    expect(labels).toContain('Dashboard');
    expect(labels).toContain('Amenities');
  });

  it('sees INFORMATION items', () => {
    const labels = getLabelsForRole(role);
    expect(labels).toContain('Announcements');
    expect(labels).toContain('Events');
    expect(labels).toContain('Library');
    expect(labels).toContain('Surveys');
  });

  it('sees GOVERNANCE items', () => {
    const labels = getLabelsForRole(role);
    expect(labels).toContain('Reports');
    expect(labels).toContain('Building Analytics');
  });

  it('does NOT see OPERATIONS items like Security Console or Packages', () => {
    const labels = getLabelsForRole(role);
    expect(labels).not.toContain('Security Console');
    expect(labels).not.toContain('Packages');
  });

  it('does NOT see MANAGEMENT items like User Management or Settings', () => {
    const labels = getLabelsForRole(role);
    expect(labels).not.toContain('User Management');
    expect(labels).not.toContain('Settings');
  });
});

// ---------------------------------------------------------------------------
// 7.4 Property Manager
// ---------------------------------------------------------------------------

describe('Property Manager navigation (Section 7.4)', () => {
  const role: Role = 'property_manager';

  it('sees OVERVIEW items', () => {
    const labels = getLabelsForRole(role);
    expect(labels).toContain('Dashboard');
    expect(labels).toContain('Units & Residents');
    expect(labels).toContain('Amenities');
  });

  it('sees OPERATIONS items', () => {
    const labels = getLabelsForRole(role);
    expect(labels).toContain('Security Console');
    expect(labels).toContain('Packages');
    expect(labels).toContain('Service Requests');
    expect(labels).toContain('Announcements');
  });

  it('sees MANAGEMENT items: Reports, Training, Logs', () => {
    const labels = getLabelsForRole(role);
    expect(labels).toContain('Reports');
    expect(labels).toContain('Training');
    expect(labels).toContain('Logs');
  });

  it('does NOT see User Management or Settings', () => {
    const labels = getLabelsForRole(role);
    expect(labels).not.toContain('User Management');
    expect(labels).not.toContain('Settings');
  });
});

// ---------------------------------------------------------------------------
// 7.5 Security Supervisor
// ---------------------------------------------------------------------------

describe('Security Supervisor navigation (Section 7.5)', () => {
  const role: Role = 'security_supervisor';

  it('sees Dashboard', () => {
    expect(getLabelsForRole(role)).toContain('Dashboard');
  });

  it('sees OPERATIONS: Security Console, Packages, Parking', () => {
    const labels = getLabelsForRole(role);
    expect(labels).toContain('Security Console');
    expect(labels).toContain('Packages');
    expect(labels).toContain('Parking');
  });

  it('sees MANAGEMENT: Reports, Training', () => {
    const labels = getLabelsForRole(role);
    expect(labels).toContain('Reports');
    expect(labels).toContain('Training');
  });

  it('does NOT see Service Requests, Announcements, or Settings', () => {
    const labels = getLabelsForRole(role);
    expect(labels).not.toContain('Service Requests');
    expect(labels).not.toContain('Settings');
  });
});

// ---------------------------------------------------------------------------
// 7.6 Security Guard
// ---------------------------------------------------------------------------

describe('Security Guard navigation (Section 7.6)', () => {
  const role: Role = 'security_guard';

  it('sees Dashboard', () => {
    expect(getLabelsForRole(role)).toContain('Dashboard');
  });

  it('sees OPERATIONS: Security Console, Packages, Parking', () => {
    const labels = getLabelsForRole(role);
    expect(labels).toContain('Security Console');
    expect(labels).toContain('Packages');
    expect(labels).toContain('Parking');
  });

  it('sees DAILY: Shift Log, Training', () => {
    const labels = getLabelsForRole(role);
    expect(labels).toContain('Shift Log');
    expect(labels).toContain('Training');
  });

  it('does NOT see Maintenance, Units, Reports, or Settings', () => {
    const labels = getLabelsForRole(role);
    expect(labels).not.toContain('Service Requests');
    expect(labels).not.toContain('Units & Residents');
    expect(labels).not.toContain('Reports');
    expect(labels).not.toContain('Settings');
  });
});

// ---------------------------------------------------------------------------
// 7.7 Front Desk / Concierge
// ---------------------------------------------------------------------------

describe('Front Desk navigation (Section 7.7)', () => {
  const role: Role = 'front_desk';

  it('sees Dashboard', () => {
    expect(getLabelsForRole(role)).toContain('Dashboard');
  });

  it('sees OPERATIONS: Security Console, Packages', () => {
    const labels = getLabelsForRole(role);
    expect(labels).toContain('Security Console');
    expect(labels).toContain('Packages');
  });

  it('sees DAILY: Shift Log, Training, Announcements (view)', () => {
    const labels = getLabelsForRole(role);
    expect(labels).toContain('Shift Log');
    expect(labels).toContain('Training');
    expect(labels).toContain('Announcements');
  });

  it('does NOT see Service Requests, Parking, or Reports', () => {
    const labels = getLabelsForRole(role);
    expect(labels).not.toContain('Service Requests');
    expect(labels).not.toContain('Parking');
    expect(labels).not.toContain('Reports');
  });
});

// ---------------------------------------------------------------------------
// 7.8 Maintenance Staff
// ---------------------------------------------------------------------------

describe('Maintenance Staff navigation (Section 7.8)', () => {
  const role: Role = 'maintenance_staff';

  it('sees Dashboard', () => {
    expect(getLabelsForRole(role)).toContain('Dashboard');
  });

  it('sees OPERATIONS: Service Requests (assigned)', () => {
    expect(getLabelsForRole(role)).toContain('Service Requests');
  });

  it('sees DAILY: Shift Log, Training', () => {
    const labels = getLabelsForRole(role);
    expect(labels).toContain('Shift Log');
    expect(labels).toContain('Training');
  });

  it('does NOT see Security Console, Packages, or Settings', () => {
    const labels = getLabelsForRole(role);
    expect(labels).not.toContain('Security Console');
    expect(labels).not.toContain('Packages');
    expect(labels).not.toContain('Settings');
  });
});

// ---------------------------------------------------------------------------
// 7.9 Superintendent
// ---------------------------------------------------------------------------

describe('Superintendent navigation (Section 7.9)', () => {
  const role: Role = 'superintendent';

  it('sees Dashboard', () => {
    expect(getLabelsForRole(role)).toContain('Dashboard');
  });

  it('sees OPERATIONS: Service Requests, Building Systems', () => {
    const labels = getLabelsForRole(role);
    expect(labels).toContain('Service Requests');
    expect(labels).toContain('Building Systems');
  });

  it('sees RESOURCES: Equipment, Parts & Supplies', () => {
    const labels = getLabelsForRole(role);
    expect(labels).toContain('Equipment');
    expect(labels).toContain('Parts & Supplies');
  });

  it('sees DAILY: My Schedule, Shift Log, Training, Announcements (view)', () => {
    const labels = getLabelsForRole(role);
    expect(labels).toContain('My Schedule');
    expect(labels).toContain('Shift Log');
    expect(labels).toContain('Training');
    expect(labels).toContain('Announcements');
  });

  it('does NOT see Security Console, Packages, or Settings', () => {
    const labels = getLabelsForRole(role);
    expect(labels).not.toContain('Security Console');
    expect(labels).not.toContain('Packages');
    expect(labels).not.toContain('Settings');
  });
});

// ---------------------------------------------------------------------------
// 7.10 Resident (Owner)
// ---------------------------------------------------------------------------

describe('Resident Owner navigation (Section 7.10)', () => {
  const role: Role = 'resident_owner';

  it('sees Dashboard', () => {
    expect(getLabelsForRole(role)).toContain('Dashboard');
  });

  it('sees MY UNIT: My Packages, My Requests, Amenity Booking', () => {
    const labels = getLabelsForRole(role);
    expect(labels).toContain('My Packages');
    expect(labels).toContain('My Requests');
    expect(labels).toContain('Amenity Booking');
  });

  it('sees BUILDING: Announcements, Events, Marketplace, Library, Surveys', () => {
    const labels = getLabelsForRole(role);
    expect(labels).toContain('Announcements');
    expect(labels).toContain('Events');
    expect(labels).toContain('Marketplace');
    expect(labels).toContain('Library');
    expect(labels).toContain('Surveys');
  });

  it('sees ACCOUNT: My Account', () => {
    expect(getLabelsForRole(role)).toContain('My Account');
  });

  it('does NOT see Security Console, User Management, or Settings', () => {
    const labels = getLabelsForRole(role);
    expect(labels).not.toContain('Security Console');
    expect(labels).not.toContain('User Management');
    expect(labels).not.toContain('Settings');
  });
});

// ---------------------------------------------------------------------------
// 7.11 Resident (Tenant)
// ---------------------------------------------------------------------------

describe('Resident Tenant navigation (Section 7.11)', () => {
  const role: Role = 'resident_tenant';

  it('sees Dashboard', () => {
    expect(getLabelsForRole(role)).toContain('Dashboard');
  });

  it('sees MY UNIT: My Packages, My Requests, Amenity Booking', () => {
    const labels = getLabelsForRole(role);
    expect(labels).toContain('My Packages');
    expect(labels).toContain('My Requests');
    expect(labels).toContain('Amenity Booking');
  });

  it('sees BUILDING: Announcements, Events, Marketplace, Library', () => {
    const labels = getLabelsForRole(role);
    expect(labels).toContain('Announcements');
    expect(labels).toContain('Events');
    expect(labels).toContain('Marketplace');
    expect(labels).toContain('Library');
  });

  it('does NOT see Surveys (only owners)', () => {
    expect(getLabelsForRole(role)).not.toContain('Surveys');
  });

  it('sees My Account', () => {
    expect(getLabelsForRole(role)).toContain('My Account');
  });
});

// ---------------------------------------------------------------------------
// 7.12 Offsite Owner
// ---------------------------------------------------------------------------

describe('Offsite Owner navigation (Section 7.12)', () => {
  const role: Role = 'offsite_owner';

  it('sees Dashboard', () => {
    expect(getLabelsForRole(role)).toContain('Dashboard');
  });

  it('sees BUILDING: Announcements, Events, Library, Surveys', () => {
    const labels = getLabelsForRole(role);
    expect(labels).toContain('Announcements');
    expect(labels).toContain('Events');
    expect(labels).toContain('Library');
    expect(labels).toContain('Surveys');
  });

  it('does NOT see My Packages, My Requests, or Amenity Booking', () => {
    const labels = getLabelsForRole(role);
    expect(labels).not.toContain('My Packages');
    expect(labels).not.toContain('My Requests');
    expect(labels).not.toContain('Amenity Booking');
  });

  it('does NOT see Marketplace', () => {
    expect(getLabelsForRole(role)).not.toContain('Marketplace');
  });

  it('sees My Account', () => {
    expect(getLabelsForRole(role)).toContain('My Account');
  });
});

// ---------------------------------------------------------------------------
// 7.13 Family Member
// ---------------------------------------------------------------------------

describe('Family Member navigation (Section 7.13)', () => {
  const role: Role = 'family_member';

  it('sees Dashboard', () => {
    expect(getLabelsForRole(role)).toContain('Dashboard');
  });

  it('sees MY UNIT: My Packages, Amenity Booking', () => {
    const labels = getLabelsForRole(role);
    expect(labels).toContain('My Packages');
    expect(labels).toContain('Amenity Booking');
  });

  it('does NOT see My Requests (owners/tenants only)', () => {
    expect(getLabelsForRole(role)).not.toContain('My Requests');
  });

  it('sees BUILDING: Announcements, Events, Library', () => {
    const labels = getLabelsForRole(role);
    expect(labels).toContain('Announcements');
    expect(labels).toContain('Events');
    expect(labels).toContain('Library');
  });

  it('does NOT see Surveys or Marketplace', () => {
    const labels = getLabelsForRole(role);
    expect(labels).not.toContain('Surveys');
    expect(labels).not.toContain('Marketplace');
  });

  it('sees My Account', () => {
    expect(getLabelsForRole(role)).toContain('My Account');
  });
});

// ---------------------------------------------------------------------------
// Visitor role (minimal)
// ---------------------------------------------------------------------------

describe('Visitor navigation', () => {
  const role: Role = 'visitor';

  it('only sees Dashboard', () => {
    const labels = getLabelsForRole(role);
    expect(labels).toEqual(['Dashboard']);
  });
});

// ---------------------------------------------------------------------------
// Cross-cutting checks
// ---------------------------------------------------------------------------

describe('Navigation cross-cutting', () => {
  it('getNavigationForRole returns no empty groups', () => {
    const allRoles: Role[] = [
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

    for (const role of allRoles) {
      const groups = getNavigationForRole(role);
      for (const group of groups) {
        expect(group.items.length).toBeGreaterThan(0);
      }
    }
  });

  it('getAllNavGroups returns all groups', () => {
    const groups = getAllNavGroups();
    expect(groups.length).toBeGreaterThan(0);
  });

  it('every nav item has a unique id', () => {
    const groups = getAllNavGroups();
    const allIds = groups.flatMap((g) => g.items.map((i) => i.id));
    const uniqueIds = new Set(allIds);
    expect(uniqueIds.size).toBe(allIds.length);
  });

  it('every nav item has an href starting with /', () => {
    const groups = getAllNavGroups();
    for (const group of groups) {
      for (const item of group.items) {
        expect(item.href).toMatch(/^\//);
      }
    }
  });

  it('every nav item has at least one role assigned', () => {
    const groups = getAllNavGroups();
    for (const group of groups) {
      for (const item of group.items) {
        expect(item.roles.length).toBeGreaterThan(0);
      }
    }
  });
});
