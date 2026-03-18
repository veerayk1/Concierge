/**
 * Concierge — Navigation Configuration
 *
 * Defines all sidebar navigation items grouped by category, with role-based
 * visibility per PRD 02 Section 7. Each role sees only the items listed in
 * their navigation table — everything else is completely absent (not disabled).
 *
 * @module lib/navigation
 */

import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Building2,
  CalendarDays,
  Shield,
  Package,
  Wrench,
  Megaphone,
  CalendarClock,
  Store,
  BookOpen,
  ClipboardList,
  BarChart3,
  Users,
  GraduationCap,
  ScrollText,
  Settings,
  Car,
  Activity,
  CreditCard,
  Brain,
  Gauge,
  Cog,
  User,
} from 'lucide-react';
import type { Role } from '@/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NavItem {
  /** Unique identifier */
  id: string;
  /** Display label */
  label: string;
  /** Route path */
  href: string;
  /** Lucide icon component */
  icon: LucideIcon;
  /** Roles that can see this item */
  roles: readonly Role[];
  /** Optional badge key for dynamic counts (e.g. 'unreleased_packages') */
  badgeKey?: string;
}

export interface NavGroup {
  /** Group label displayed as section header */
  label: string;
  /** Items within this group */
  items: NavItem[];
}

// ---------------------------------------------------------------------------
// All 13 Roles (from PRD 02)
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Navigation Items — mapped exactly from PRD 02 Section 7
// ---------------------------------------------------------------------------

/**
 * Complete navigation definition. Each item lists every role that can see it.
 * When a role is not in the list, the item is invisible to them.
 *
 * Mapped from PRD 02 Section 7 tables:
 *   7.1  Super Admin
 *   7.2  Property Admin
 *   7.3  Board Member
 *   7.4  Property Manager
 *   7.5  Security Supervisor
 *   7.6  Security Guard
 *   7.7  Front Desk / Concierge
 *   7.8  Maintenance Staff
 *   7.9  Superintendent
 *   7.10 Resident (Owner)
 *   7.11 Resident (Tenant)
 *   7.12 Resident (Offsite Owner)
 *   7.13 Family Member
 */
const ALL_NAV_GROUPS: NavGroup[] = [
  // -------------------------------------------------------------------------
  // SYSTEM — Super Admin only (Section 7.1)
  // -------------------------------------------------------------------------
  {
    label: 'SYSTEM',
    items: [
      {
        id: 'multi-property-dashboard',
        label: 'Multi-Property Dashboard',
        href: '/system/properties',
        icon: Gauge,
        roles: ['super_admin'],
      },
      {
        id: 'platform-health',
        label: 'Platform Health',
        href: '/system/health',
        icon: Activity,
        roles: ['super_admin'],
      },
      {
        id: 'ai-dashboard',
        label: 'AI Dashboard',
        href: '/system/ai',
        icon: Brain,
        roles: ['super_admin'],
      },
      {
        id: 'billing-system',
        label: 'Billing',
        href: '/system/billing',
        icon: CreditCard,
        roles: ['super_admin'],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // OVERVIEW — Staff + Admin + Board + Residents
  // -------------------------------------------------------------------------
  {
    label: 'OVERVIEW',
    items: [
      {
        id: 'dashboard',
        label: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        // All 14 roles see the dashboard (role-specific rendering)
        roles: [
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
          'offsite_owner',
          'family_member',
          'visitor',
        ],
      },
      {
        id: 'units-residents',
        label: 'Units & Residents',
        href: '/units',
        icon: Building2,
        // 7.1 Super Admin, 7.2 Property Admin, 7.4 Property Manager
        roles: ['super_admin', 'property_admin', 'property_manager'],
      },
      {
        id: 'amenities',
        label: 'Amenities',
        href: '/amenities',
        icon: CalendarDays,
        // 7.1, 7.2, 7.3 Board Member, 7.4 Property Manager
        roles: ['super_admin', 'property_admin', 'board_member', 'property_manager'],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // HOME — Resident-specific (replaces OVERVIEW for residents)
  // -------------------------------------------------------------------------
  // Note: Residents see "Dashboard" via OVERVIEW above. The HOME section
  // in PRD 02 maps to the same Dashboard item. No separate HOME group needed.

  // -------------------------------------------------------------------------
  // MY UNIT — Resident self-service
  // -------------------------------------------------------------------------
  {
    label: 'MY UNIT',
    items: [
      {
        id: 'my-packages',
        label: 'My Packages',
        href: '/my-packages',
        icon: Package,
        badgeKey: 'my_packages',
        // 7.10 Owner, 7.11 Tenant, 7.13 Family Member
        roles: ['resident_owner', 'resident_tenant', 'family_member'],
      },
      {
        id: 'my-requests',
        label: 'My Requests',
        href: '/my-requests',
        icon: Wrench,
        // 7.10 Owner, 7.11 Tenant
        roles: ['resident_owner', 'resident_tenant'],
      },
      {
        id: 'amenity-booking',
        label: 'Amenity Booking',
        href: '/amenity-booking',
        icon: CalendarDays,
        // 7.10 Owner, 7.11 Tenant, 7.13 Family Member
        roles: ['resident_owner', 'resident_tenant', 'family_member'],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // OPERATIONS — Staff operational modules
  // -------------------------------------------------------------------------
  {
    label: 'OPERATIONS',
    items: [
      {
        id: 'security-console',
        label: 'Security Console',
        href: '/security',
        icon: Shield,
        // 7.1, 7.2, 7.4, 7.5 Security Supervisor, 7.6 Security Guard, 7.7 Front Desk
        roles: [
          'super_admin',
          'property_admin',
          'property_manager',
          'security_supervisor',
          'security_guard',
          'front_desk',
        ],
      },
      {
        id: 'packages',
        label: 'Packages',
        href: '/packages',
        icon: Package,
        badgeKey: 'unreleased_packages',
        // 7.1, 7.2, 7.4, 7.5, 7.6, 7.7 Front Desk
        roles: [
          'super_admin',
          'property_admin',
          'property_manager',
          'security_supervisor',
          'security_guard',
          'front_desk',
        ],
      },
      {
        id: 'service-requests',
        label: 'Service Requests',
        href: '/maintenance',
        icon: Wrench,
        // 7.1, 7.2, 7.4, 7.8 Maintenance Staff (assigned), 7.9 Superintendent
        roles: [
          'super_admin',
          'property_admin',
          'property_manager',
          'maintenance_staff',
          'superintendent',
        ],
      },
      {
        id: 'announcements',
        label: 'Announcements',
        href: '/announcements',
        icon: Megaphone,
        // 7.1, 7.2, 7.4 (create), 7.7 Front Desk (view), 7.9 Superintendent (view)
        roles: [
          'super_admin',
          'property_admin',
          'property_manager',
          'front_desk',
          'superintendent',
        ],
      },
      {
        id: 'parking',
        label: 'Parking',
        href: '/parking',
        icon: Car,
        // 7.5 Security Supervisor, 7.6 Security Guard
        roles: ['security_supervisor', 'security_guard'],
      },
      {
        id: 'building-systems',
        label: 'Building Systems',
        href: '/building-systems',
        icon: Cog,
        // 7.9 Superintendent only
        roles: ['superintendent'],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // RESOURCES — Superintendent-specific (Section 7.9)
  // -------------------------------------------------------------------------
  {
    label: 'RESOURCES',
    items: [
      {
        id: 'equipment',
        label: 'Equipment',
        href: '/equipment',
        icon: Cog,
        roles: ['superintendent'],
      },
      {
        id: 'parts-supplies',
        label: 'Parts & Supplies',
        href: '/parts-supplies',
        icon: Package,
        roles: ['superintendent'],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // BUILDING — Resident-facing community content
  // -------------------------------------------------------------------------
  {
    label: 'BUILDING',
    items: [
      {
        id: 'resident-announcements',
        label: 'Announcements',
        href: '/announcements',
        icon: Megaphone,
        // 7.10, 7.11, 7.12, 7.13
        roles: ['resident_owner', 'resident_tenant', 'offsite_owner', 'family_member'],
      },
      {
        id: 'events',
        label: 'Events',
        href: '/events',
        icon: CalendarClock,
        // 7.10, 7.11, 7.12 (view), 7.13
        roles: ['resident_owner', 'resident_tenant', 'offsite_owner', 'family_member'],
      },
      {
        id: 'resident-marketplace',
        label: 'Marketplace',
        href: '/marketplace',
        icon: Store,
        // 7.10, 7.11 (not offsite owners or family members)
        roles: ['resident_owner', 'resident_tenant'],
      },
      {
        id: 'resident-library',
        label: 'Library',
        href: '/library',
        icon: BookOpen,
        // 7.10, 7.11, 7.12, 7.13
        roles: ['resident_owner', 'resident_tenant', 'offsite_owner', 'family_member'],
      },
      {
        id: 'resident-surveys',
        label: 'Surveys',
        href: '/surveys',
        icon: ClipboardList,
        // 7.10 Owner, 7.12 Offsite Owner
        roles: ['resident_owner', 'offsite_owner'],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // COMMUNITY — Staff-managed community modules
  // -------------------------------------------------------------------------
  {
    label: 'COMMUNITY',
    items: [
      {
        id: 'community-events',
        label: 'Events',
        href: '/events',
        icon: CalendarClock,
        // 7.1, 7.2, 7.4
        roles: ['super_admin', 'property_admin', 'property_manager'],
      },
      {
        id: 'marketplace',
        label: 'Marketplace',
        href: '/marketplace',
        icon: Store,
        // 7.1, 7.2, 7.4
        roles: ['super_admin', 'property_admin', 'property_manager'],
      },
      {
        id: 'library',
        label: 'Library',
        href: '/library',
        icon: BookOpen,
        // 7.1, 7.2, 7.4
        roles: ['super_admin', 'property_admin', 'property_manager'],
      },
      {
        id: 'surveys',
        label: 'Surveys',
        href: '/surveys',
        icon: ClipboardList,
        // 7.1, 7.2, 7.4
        roles: ['super_admin', 'property_admin', 'property_manager'],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // INFORMATION — Board Member-specific (Section 7.3)
  // -------------------------------------------------------------------------
  {
    label: 'INFORMATION',
    items: [
      {
        id: 'board-announcements',
        label: 'Announcements',
        href: '/announcements',
        icon: Megaphone,
        roles: ['board_member'],
      },
      {
        id: 'board-events',
        label: 'Events',
        href: '/events',
        icon: CalendarClock,
        roles: ['board_member'],
      },
      {
        id: 'board-library',
        label: 'Library',
        href: '/library',
        icon: BookOpen,
        roles: ['board_member'],
      },
      {
        id: 'board-surveys',
        label: 'Surveys',
        href: '/surveys',
        icon: ClipboardList,
        roles: ['board_member'],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // GOVERNANCE — Board Member-specific (Section 7.3)
  // -------------------------------------------------------------------------
  {
    label: 'GOVERNANCE',
    items: [
      {
        id: 'board-reports',
        label: 'Reports',
        href: '/reports',
        icon: BarChart3,
        roles: ['board_member'],
      },
      {
        id: 'building-analytics',
        label: 'Building Analytics',
        href: '/analytics',
        icon: Activity,
        roles: ['board_member'],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // DAILY — Shift-based staff (Section 7.6, 7.7, 7.8, 7.9)
  // -------------------------------------------------------------------------
  {
    label: 'DAILY',
    items: [
      {
        id: 'my-schedule',
        label: 'My Schedule',
        href: '/my-schedule',
        icon: CalendarDays,
        // 7.9 Superintendent only
        roles: ['superintendent'],
      },
      {
        id: 'shift-log',
        label: 'Shift Log',
        href: '/shift-log',
        icon: ScrollText,
        // 7.6, 7.7, 7.8, 7.9
        roles: ['security_guard', 'front_desk', 'maintenance_staff', 'superintendent'],
      },
      {
        id: 'daily-training',
        label: 'Training',
        href: '/training',
        icon: GraduationCap,
        // 7.6, 7.7, 7.8, 7.9
        roles: ['security_guard', 'front_desk', 'maintenance_staff', 'superintendent'],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // MANAGEMENT — Admin + PM + Security Supervisor
  // -------------------------------------------------------------------------
  {
    label: 'MANAGEMENT',
    items: [
      {
        id: 'reports',
        label: 'Reports',
        href: '/reports',
        icon: BarChart3,
        // 7.1, 7.2, 7.4, 7.5 (security reports)
        roles: ['super_admin', 'property_admin', 'property_manager', 'security_supervisor'],
      },
      {
        id: 'user-management',
        label: 'User Management',
        href: '/users',
        icon: Users,
        // 7.1, 7.2
        roles: ['super_admin', 'property_admin'],
      },
      {
        id: 'training',
        label: 'Training',
        href: '/training',
        icon: GraduationCap,
        // 7.1, 7.2, 7.4, 7.5 (team training)
        roles: ['super_admin', 'property_admin', 'property_manager', 'security_supervisor'],
      },
      {
        id: 'logs',
        label: 'Logs',
        href: '/logs',
        icon: ScrollText,
        // 7.1, 7.2, 7.4
        roles: ['super_admin', 'property_admin', 'property_manager'],
      },
      {
        id: 'settings',
        label: 'Settings',
        href: '/settings',
        icon: Settings,
        // 7.1, 7.2
        roles: ['super_admin', 'property_admin'],
      },
    ],
  },

  // -------------------------------------------------------------------------
  // ACCOUNT — Resident self-service (Section 7.10, 7.11, 7.12, 7.13)
  // -------------------------------------------------------------------------
  {
    label: 'ACCOUNT',
    items: [
      {
        id: 'my-account',
        label: 'My Account',
        href: '/my-account',
        icon: User,
        roles: ['resident_owner', 'resident_tenant', 'offsite_owner', 'family_member'],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns the navigation groups filtered for a specific role.
 * Groups with no visible items are excluded entirely.
 * Items not assigned to the role are absent (not disabled).
 */
export function getNavigationForRole(role: Role): NavGroup[] {
  const filtered: NavGroup[] = [];

  for (const group of ALL_NAV_GROUPS) {
    const visibleItems = group.items.filter((item) => item.roles.includes(role));
    if (visibleItems.length > 0) {
      filtered.push({
        label: group.label,
        items: visibleItems,
      });
    }
  }

  return filtered;
}

/**
 * Returns a flat list of all nav items visible to a given role.
 * Useful for search indexing and permission checks.
 */
export function getFlatNavigationForRole(role: Role): NavItem[] {
  return ALL_NAV_GROUPS.flatMap((group) => group.items.filter((item) => item.roles.includes(role)));
}

/**
 * Returns the full unfiltered navigation configuration.
 * Used for testing and admin tools.
 */
export function getAllNavGroups(): NavGroup[] {
  return ALL_NAV_GROUPS;
}

/**
 * Role display names for UI rendering.
 */
export const ROLE_DISPLAY_NAMES: Record<Role, string> = {
  super_admin: 'Super Admin',
  property_admin: 'Property Admin',
  property_manager: 'Property Manager',
  security_supervisor: 'Security Supervisor',
  security_guard: 'Security Guard',
  front_desk: 'Front Desk / Concierge',
  maintenance_staff: 'Maintenance Staff',
  superintendent: 'Superintendent',
  board_member: 'Board Member',
  resident_owner: 'Resident (Owner)',
  resident_tenant: 'Resident (Tenant)',
  family_member: 'Family Member',
  offsite_owner: 'Offsite Owner',
  visitor: 'Visitor',
} as const;
