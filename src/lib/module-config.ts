/**
 * Concierge — Module Configuration
 *
 * Defines the canonical list of toggleable modules. Each module maps to one or more
 * navigation item IDs from navigation.ts. When a module is disabled for a property,
 * its navigation items are hidden from ALL roles, and its API routes return 403.
 *
 * Two-level control:
 *   1. Super Admin — sets initial module availability per property (during onboarding or later)
 *   2. Property Admin — can further disable modules but CANNOT enable modules the Super Admin disabled
 *
 * @module lib/module-config
 */

// ---------------------------------------------------------------------------
// Module Key type — must match the keys in DEFAULT_FLAGS in feature-flags API
// ---------------------------------------------------------------------------

export type ModuleKey =
  | 'packages'
  | 'maintenance'
  | 'security_console'
  | 'amenity_booking'
  | 'announcements'
  | 'shift_log'
  | 'visitor_management'
  | 'key_management'
  | 'parking'
  | 'training_lms'
  | 'community'
  | 'reports'
  | 'ai_features'
  | 'api_access'
  | 'white_label'
  | 'sso';

// ---------------------------------------------------------------------------
// Module definitions with metadata for the UI
// ---------------------------------------------------------------------------

export interface ModuleDefinition {
  key: ModuleKey;
  name: string;
  description: string;
  /** Subscription tier required */
  tier: 'starter' | 'professional' | 'enterprise';
  /** Category grouping for the settings UI */
  category: 'operations' | 'communication' | 'community' | 'advanced';
  /** Navigation item IDs from navigation.ts that belong to this module */
  navItemIds: string[];
  /** Whether this module is core and cannot be disabled (e.g., Dashboard is always on) */
  core?: boolean;
  /** Icon name from lucide-react for the settings UI */
  iconName: string;
}

export const MODULE_DEFINITIONS: ModuleDefinition[] = [
  // --- OPERATIONS (Starter) ---
  {
    key: 'packages',
    name: 'Package Management',
    description: 'Track incoming and outgoing packages for residents',
    tier: 'starter',
    category: 'operations',
    navItemIds: ['packages', 'my-packages'],
    iconName: 'Package',
  },
  {
    key: 'maintenance',
    name: 'Maintenance Requests',
    description: 'Submit and track service requests with photo uploads',
    tier: 'starter',
    category: 'operations',
    navItemIds: ['service-requests', 'my-requests'],
    iconName: 'Wrench',
  },
  {
    key: 'security_console',
    name: 'Security Console',
    description: 'Unified security event logging and incident tracking',
    tier: 'starter',
    category: 'operations',
    navItemIds: ['security-console'],
    iconName: 'Shield',
  },
  {
    key: 'amenity_booking',
    name: 'Amenity Booking',
    description: 'Reserve building amenities like gym, party room, guest suite',
    tier: 'starter',
    category: 'operations',
    navItemIds: ['amenities', 'amenity-booking'],
    iconName: 'CalendarDays',
  },
  {
    key: 'shift_log',
    name: 'Shift Log',
    description: 'Staff shift handoff notes between teams',
    tier: 'starter',
    category: 'operations',
    navItemIds: ['shift-log'],
    iconName: 'ScrollText',
  },

  // --- OPERATIONS (Professional) ---
  {
    key: 'visitor_management',
    name: 'Visitor Management',
    description: 'Visitor sign-in, tracking, and expected visitor management',
    tier: 'professional',
    category: 'operations',
    navItemIds: ['visitors'],
    iconName: 'Users',
  },
  {
    key: 'key_management',
    name: 'Key & FOB Management',
    description: 'Track key and FOB inventory, checkout, and returns',
    tier: 'professional',
    category: 'operations',
    navItemIds: ['keys-fobs'],
    iconName: 'Key',
  },
  {
    key: 'parking',
    name: 'Parking Management',
    description: 'Permits, violations, and parking spot tracking',
    tier: 'professional',
    category: 'operations',
    navItemIds: ['parking'],
    iconName: 'Car',
  },
  {
    key: 'training_lms',
    name: 'Training & LMS',
    description: 'Staff training courses with quizzes and pass/fail tracking',
    tier: 'professional',
    category: 'operations',
    navItemIds: ['daily-training', 'training'],
    iconName: 'GraduationCap',
  },

  // --- COMMUNICATION ---
  {
    key: 'announcements',
    name: 'Announcements',
    description: 'Multi-channel announcements to residents and staff',
    tier: 'starter',
    category: 'communication',
    navItemIds: ['announcements', 'resident-announcements', 'board-announcements'],
    iconName: 'Megaphone',
  },

  // --- COMMUNITY ---
  {
    key: 'community',
    name: 'Community Features',
    description: 'Marketplace, forum, idea board, and photo albums for residents',
    tier: 'professional',
    category: 'community',
    navItemIds: [
      'marketplace',
      'resident-marketplace',
      'forum',
      'resident-forum',
      'idea-board',
      'resident-ideas',
      'photo-albums',
      'resident-photo-albums',
    ],
    iconName: 'Store',
  },
  {
    key: 'reports',
    name: 'Reports & Analytics',
    description: 'Generate and export operational reports',
    tier: 'professional',
    category: 'operations',
    navItemIds: ['reports', 'board-reports', 'building-analytics'],
    iconName: 'BarChart3',
  },

  // --- ADVANCED (Enterprise) ---
  {
    key: 'ai_features',
    name: 'AI Features',
    description: 'AI-powered categorization, insights, and daily briefings',
    tier: 'enterprise',
    category: 'advanced',
    navItemIds: [],
    iconName: 'Brain',
  },
  {
    key: 'api_access',
    name: 'Developer API',
    description: 'REST API and webhook access for integrations',
    tier: 'enterprise',
    category: 'advanced',
    navItemIds: ['developer-portal'],
    iconName: 'Code2',
  },
  {
    key: 'white_label',
    name: 'White Label',
    description: 'Custom branding, domain, and styling',
    tier: 'enterprise',
    category: 'advanced',
    navItemIds: [],
    iconName: 'Building',
  },
  {
    key: 'sso',
    name: 'Single Sign-On',
    description: 'SAML/OIDC authentication for enterprise',
    tier: 'enterprise',
    category: 'advanced',
    navItemIds: [],
    iconName: 'Key',
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Get a module definition by key */
export function getModuleByKey(key: ModuleKey): ModuleDefinition | undefined {
  return MODULE_DEFINITIONS.find((m) => m.key === key);
}

/** Get all nav item IDs that should be hidden when a set of modules are disabled */
export function getHiddenNavItemIds(disabledModules: Set<ModuleKey>): Set<string> {
  const hidden = new Set<string>();
  for (const mod of MODULE_DEFINITIONS) {
    if (disabledModules.has(mod.key)) {
      for (const navId of mod.navItemIds) {
        hidden.add(navId);
      }
    }
  }
  return hidden;
}

/** Get modules grouped by category */
export function getModulesByCategory(): Record<string, ModuleDefinition[]> {
  const grouped: Record<string, ModuleDefinition[]> = {};
  for (const mod of MODULE_DEFINITIONS) {
    if (!grouped[mod.category]) grouped[mod.category] = [];
    grouped[mod.category].push(mod);
  }
  return grouped;
}

/** Category display names */
export const CATEGORY_LABELS: Record<string, string> = {
  operations: 'Operations',
  communication: 'Communication',
  community: 'Community',
  advanced: 'Advanced',
};

/** Tier display labels */
export const TIER_LABELS: Record<string, string> = {
  starter: 'Starter',
  professional: 'Professional',
  enterprise: 'Enterprise',
};

/** Tier badge colors */
export const TIER_COLORS: Record<string, { text: string; bg: string }> = {
  starter: { text: 'text-success-700', bg: 'bg-success-50' },
  professional: { text: 'text-info-700', bg: 'bg-info-50' },
  enterprise: { text: 'text-purple-700', bg: 'bg-purple-50' },
};
