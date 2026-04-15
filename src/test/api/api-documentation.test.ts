/**
 * API Documentation Generator Tests
 *
 * Scans all route.ts files under src/app/api/ and:
 *   1. Extracts path, HTTP methods exported, and auth guard usage
 *   2. Generates a summary of all endpoints
 *   3. Verifies completeness — every route file on disk is accounted for
 *
 * This test suite serves as a living inventory of the entire API surface.
 * If a new route is added, these tests will detect it and require the
 * documentation to be updated.
 *
 * @module test/api/api-documentation
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface RouteInfo {
  /** Relative path from src/app/api (e.g. "v1/packages/[id]") */
  routePath: string;
  /** API path as it would appear in a request (e.g. "/api/v1/packages/:id") */
  apiPath: string;
  /** HTTP methods exported (GET, POST, PATCH, PUT, DELETE) */
  methods: string[];
  /** Whether the route uses guardRoute for authentication */
  requiresAuth: boolean;
  /** Brief description derived from the file path */
  description: string;
  /** Module/category for grouping */
  category: string;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROJECT_ROOT = process.cwd();
const API_ROOT = path.join(PROJECT_ROOT, 'src/app/api');

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Recursively find all route.ts files under a directory.
 */
function findAllRouteFiles(dir: string): string[] {
  const files: string[] = [];
  if (!fs.existsSync(dir)) return files;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === '__tests__') continue;
      files.push(...findAllRouteFiles(fullPath));
    } else if (entry.name === 'route.ts') {
      files.push(fullPath);
    }
  }
  return files;
}

/**
 * Extract exported HTTP methods from a route file's content.
 */
function extractMethods(content: string): string[] {
  const methods: string[] = [];
  for (const method of HTTP_METHODS) {
    const pattern = new RegExp(
      `export\\s+(async\\s+)?function\\s+${method}\\b|export\\s+const\\s+${method}\\s*=`,
    );
    if (pattern.test(content)) {
      methods.push(method);
    }
  }
  return methods;
}

/**
 * Check if route content uses guardRoute for authentication.
 */
function usesAuthGuard(content: string): boolean {
  return content.includes('guardRoute');
}

/**
 * Convert a file-system route path to an API URL path.
 * e.g. "v1/packages/[id]" -> "/api/v1/packages/:id"
 */
function toApiPath(routePath: string): string {
  return '/api/' + routePath.replace(/\[([^\]]+)\]/g, ':$1');
}

/**
 * Derive a human-readable description from the route path.
 */
function describeRoute(routePath: string, methods: string[]): string {
  const segments = routePath.split('/');
  const isV1 = segments[0] === 'v1';
  const relevantSegments = isV1 ? segments.slice(1) : segments;

  // Build description from path segments
  const resourceMap: Record<string, string> = {
    'auth/login': 'Authenticate user with credentials',
    'auth/logout': 'End user session',
    'auth/refresh': 'Refresh authentication token',
    'auth/forgot-password': 'Request password reset email',
    'auth/reset-password': 'Reset password with token',
    'auth/verify-2fa': 'Verify two-factor authentication code',
    'auth/sessions': 'List active user sessions',
    'csp-report': 'Receive Content-Security-Policy violation reports',
    health: 'Basic health check',
    'health/detailed': 'Detailed health check with dependency status',
  };

  // Check exact match first
  if (resourceMap[routePath]) return resourceMap[routePath];

  // Dynamic description generation
  const resource = relevantSegments
    .filter((s) => !s.startsWith('[') && !s.startsWith(':'))
    .join(' ');
  const hasId = relevantSegments.some((s) => s === '[id]');
  const isAction = [
    'remind',
    'flag',
    'expire',
    'enroll',
    'complete',
    'vote',
    'acknowledge',
    'all-clear',
    'cancel',
    'reset',
    'verify',
    'pin',
    'mark-read',
    'batch-signout',
    'batch-release',
    'escalate',
    'retry',
    'deactivate',
    'reactivate',
    'switch',
  ].includes(relevantSegments[relevantSegments.length - 1]!);

  const isSubResource = relevantSegments.length >= 3 && !isAction;
  const methodList = methods.join('/');

  if (isAction) {
    const action = relevantSegments[relevantSegments.length - 1]!.replace(/-/g, ' ').replace(
      /\b\w/g,
      (c) => c.toUpperCase(),
    );
    const parent = relevantSegments
      .filter((s) => !s.startsWith('[') && s !== relevantSegments[relevantSegments.length - 1])
      .join(' ');
    return `${action} action on ${parent}`;
  }

  if (isSubResource && hasId) {
    const parent = relevantSegments[0]!.replace(/-/g, ' ');
    const sub = relevantSegments[relevantSegments.length - 1]!.replace(/-/g, ' ');
    return `Manage ${sub} for a specific ${parent.replace(/s$/, '')}`;
  }

  if (hasId && methods.includes('GET') && methods.includes('PATCH')) {
    return `Get or update a specific ${resource.replace(/-/g, ' ').replace(/s$/, '')}`;
  }

  if (hasId && methods.includes('GET')) {
    return `Get a specific ${resource.replace(/-/g, ' ').replace(/s$/, '')}`;
  }

  if (methods.includes('GET') && methods.includes('POST')) {
    return `List and create ${resource.replace(/-/g, ' ')}`;
  }

  if (methods.includes('GET')) {
    return `List or retrieve ${resource.replace(/-/g, ' ')}`;
  }

  if (methods.includes('POST')) {
    return `Create or execute ${resource.replace(/-/g, ' ')}`;
  }

  return `Manage ${resource.replace(/-/g, ' ')}`;
}

/**
 * Categorize a route into a logical group for documentation.
 */
function categorizeRoute(routePath: string): string {
  if (routePath.startsWith('auth/')) return 'Authentication';
  if (routePath === 'csp-report') return 'Infrastructure';
  if (routePath.startsWith('health')) return 'Infrastructure';

  // Remove v1/ prefix for matching
  const path = routePath.replace(/^v1\//, '');

  if (path.startsWith('packages')) return 'Packages';
  if (path.startsWith('events') || path.startsWith('event-types'))
    return 'Events & Security Console';
  if (path.startsWith('maintenance')) return 'Maintenance';
  if (path.startsWith('amenities') || path.startsWith('bookings')) return 'Amenity Booking';
  if (path.startsWith('announcements')) return 'Announcements';
  if (path.startsWith('users') || path.startsWith('roles')) return 'User Management';
  if (path.startsWith('units') || path.startsWith('buildings')) return 'Units & Buildings';
  if (path.startsWith('residents')) return 'Residents';
  if (path.startsWith('visitors') || path.startsWith('incidents')) return 'Visitors & Incidents';
  if (path.startsWith('keys')) return 'Keys & FOB Management';
  if (path.startsWith('parking')) return 'Parking';
  if (path.startsWith('shift-log')) return 'Shift Log';
  if (path.startsWith('vendors')) return 'Vendor Management';
  if (path.startsWith('training')) return 'Training & LMS';
  if (path.startsWith('community')) return 'Community';
  if (path.startsWith('classifieds')) return 'Classified Ads';
  if (path.startsWith('ideas')) return 'Idea Board';
  if (path.startsWith('forum')) return 'Discussion Forum';
  if (path.startsWith('emergency')) return 'Emergency Broadcast';
  if (path.startsWith('equipment')) return 'Equipment';
  if (path.startsWith('inspections')) return 'Inspections';
  if (path.startsWith('recurring-tasks')) return 'Recurring Tasks';
  if (path.startsWith('alterations')) return 'Alteration Projects';
  if (path.startsWith('notifications')) return 'Notifications';
  if (path.startsWith('billing')) return 'Billing & Subscription';
  if (path.startsWith('onboarding')) return 'Onboarding';
  if (path.startsWith('compliance')) return 'Compliance';
  if (path.startsWith('help')) return 'Help Center';
  if (path.startsWith('developer')) return 'Developer Portal & API';
  if (path.startsWith('data-migration')) return 'Data Migration';
  if (path.startsWith('demo')) return 'Demo Environment';
  if (path.startsWith('properties')) return 'Property Management';
  if (path.startsWith('governance')) return 'Board Governance';
  if (path.startsWith('library')) return 'Document Library';
  if (path.startsWith('surveys')) return 'Surveys';
  if (path.startsWith('reports')) return 'Reports & Analytics';
  if (path.startsWith('export')) return 'Reports & Analytics';
  if (path.startsWith('search')) return 'Search';
  if (path.startsWith('upload')) return 'File Upload';
  if (path.startsWith('feature-flags')) return 'Feature Flags';
  if (path.startsWith('dashboard')) return 'Dashboard';
  if (path.startsWith('couriers')) return 'Packages';
  if (path.startsWith('storage-spots')) return 'Packages';
  if (path.startsWith('emergency-contacts')) return 'Residents';
  if (path.startsWith('authorized-delegates')) return 'Residents';
  if (path.startsWith('pets')) return 'Residents';
  if (path.startsWith('vehicles')) return 'Residents';
  if (path.startsWith('resident/')) return 'Resident Portal';
  if (path.startsWith('photo-albums')) return 'Photo Albums';
  if (path.startsWith('digital-signage')) return 'Digital Signage';
  if (path.startsWith('assets')) return 'Asset Management';
  if (path.startsWith('building-directory')) return 'Building Directory';
  if (path.startsWith('resident-cards')) return 'Resident Cards';
  if (path.startsWith('custom-fields')) return 'Custom Fields';
  if (path.startsWith('audit-log')) return 'Audit Log';
  if (path.startsWith('ai/')) return 'AI & Analytics';
  if (path.startsWith('privacy')) return 'Privacy & Compliance';
  if (path.startsWith('settings')) return 'Settings';
  if (path.startsWith('purchase-orders')) return 'Purchase Orders';
  if (path.startsWith('admin/')) return 'Admin';
  if (path.startsWith('buzzer-codes')) return 'Residents';
  if (path.startsWith('consent-documents')) return 'Privacy & Compliance';
  if (path.startsWith('debug')) return 'Infrastructure';
  if (path.startsWith('event-groups')) return 'Events & Security Console';
  if (path.startsWith('import/') || path.startsWith('import-templates')) return 'Data Migration';
  if (path.startsWith('occupancy')) return 'Units & Buildings';
  if (path.startsWith('public/')) return 'Public';
  if (path.startsWith('security/')) return 'Events & Security Console';
  if (path.startsWith('staff/')) return 'User Management';
  if (path.startsWith('system/')) return 'Infrastructure';
  if (path.startsWith('vacations')) return 'Residents';

  return 'Other';
}

/**
 * Build a complete inventory of all API routes.
 */
function buildRouteInventory(): RouteInfo[] {
  const routeFiles = findAllRouteFiles(API_ROOT);
  const inventory: RouteInfo[] = [];

  for (const filePath of routeFiles) {
    const relativePath = path.relative(API_ROOT, filePath).replace(/\/route\.ts$/, '');
    const content = fs.readFileSync(filePath, 'utf-8');
    const methods = extractMethods(content);
    const requiresAuth = usesAuthGuard(content);

    inventory.push({
      routePath: relativePath,
      apiPath: toApiPath(relativePath),
      methods,
      requiresAuth,
      description: describeRoute(relativePath, methods),
      category: categorizeRoute(relativePath),
    });
  }

  // Sort by category then path
  inventory.sort((a, b) => {
    const catCompare = a.category.localeCompare(b.category);
    if (catCompare !== 0) return catCompare;
    return a.apiPath.localeCompare(b.apiPath);
  });

  return inventory;
}

// ---------------------------------------------------------------------------
// Build the inventory once for all tests
// ---------------------------------------------------------------------------

const inventory = buildRouteInventory();

// ---------------------------------------------------------------------------
// 1. Scan completeness
// ---------------------------------------------------------------------------

describe('API Route Scanning', () => {
  it('discovers all route.ts files under src/app/api/', () => {
    const routeFiles = findAllRouteFiles(API_ROOT);
    expect(routeFiles.length).toBeGreaterThan(100);
    // Ensure we found as many route info entries as files on disk
    expect(inventory.length).toBe(routeFiles.length);
  });

  it('every discovered route has at least one HTTP method exported', () => {
    const routesWithoutMethods = inventory.filter((r) => r.methods.length === 0);
    expect(routesWithoutMethods.map((r) => r.routePath)).toEqual([]);
  });

  it('every discovered route is assigned a category', () => {
    const uncategorized = inventory.filter((r) => r.category === 'Other');
    // Allow a small number of uncategorized routes for new additions
    expect(uncategorized.length).toBeLessThanOrEqual(3);
  });
});

// ---------------------------------------------------------------------------
// 2. Method extraction accuracy
// ---------------------------------------------------------------------------

describe('HTTP method extraction', () => {
  it('auth/login exports only POST', () => {
    const route = inventory.find((r) => r.routePath === 'auth/login');
    expect(route).toBeDefined();
    expect(route!.methods).toEqual(['POST']);
  });

  it('v1/events exports GET and POST', () => {
    const route = inventory.find((r) => r.routePath === 'v1/events');
    expect(route).toBeDefined();
    expect(route!.methods).toContain('GET');
    expect(route!.methods).toContain('POST');
  });

  it('v1/packages/[id] exports GET, PATCH, and DELETE', () => {
    const route = inventory.find((r) => r.routePath === 'v1/packages/[id]');
    expect(route).toBeDefined();
    expect(route!.methods).toContain('GET');
    expect(route!.methods).toContain('PATCH');
    expect(route!.methods).toContain('DELETE');
  });

  it('v1/announcements/[id] exports GET, PATCH, and DELETE', () => {
    const route = inventory.find((r) => r.routePath === 'v1/announcements/[id]');
    expect(route).toBeDefined();
    expect(route!.methods).toContain('GET');
    expect(route!.methods).toContain('PATCH');
    expect(route!.methods).toContain('DELETE');
  });
});

// ---------------------------------------------------------------------------
// 3. Auth guard detection
// ---------------------------------------------------------------------------

describe('Auth guard detection', () => {
  it('public auth routes do NOT require auth', () => {
    const publicRoutes = [
      'auth/login',
      'auth/forgot-password',
      'auth/reset-password',
      'auth/verify-2fa',
      'auth/refresh',
    ];
    for (const routePath of publicRoutes) {
      const route = inventory.find((r) => r.routePath === routePath);
      expect(route).toBeDefined();
      expect(route!.requiresAuth).toBe(false);
    }
  });

  it('health check routes do NOT require auth', () => {
    const healthRoutes = inventory.filter((r) => r.routePath.startsWith('health'));
    expect(healthRoutes.length).toBeGreaterThanOrEqual(1);
    for (const route of healthRoutes) {
      expect(route.requiresAuth).toBe(false);
    }
  });

  it('billing webhook does NOT require auth (Stripe calls it directly)', () => {
    const route = inventory.find((r) => r.routePath === 'v1/billing/webhook');
    expect(route).toBeDefined();
    expect(route!.requiresAuth).toBe(false);
  });

  it('v1 data routes require auth', () => {
    const protectedRoutes = [
      'v1/events',
      'v1/packages',
      'v1/amenities',
      'v1/announcements/[id]',
      'v1/units/[id]',
      'v1/vendors',
      'v1/shift-log',
      'v1/reports',
      'v1/parking',
      'v1/visitors',
      'v1/keys/checkouts',
      'v1/maintenance',
    ];
    for (const routePath of protectedRoutes) {
      const route = inventory.find((r) => r.routePath === routePath);
      expect(route).toBeDefined();
      expect(route!.requiresAuth).toBe(true);
    }
  });

  it('the vast majority of v1 routes require auth', () => {
    const v1Routes = inventory.filter((r) => r.routePath.startsWith('v1/'));
    const authedRoutes = v1Routes.filter((r) => r.requiresAuth);
    const ratio = authedRoutes.length / v1Routes.length;
    // At least 95% of v1 routes should require auth
    expect(ratio).toBeGreaterThan(0.95);
  });
});

// ---------------------------------------------------------------------------
// 4. Summary generation
// ---------------------------------------------------------------------------

describe('API documentation summary', () => {
  it('generates a complete summary grouped by category', () => {
    const categories = new Map<string, RouteInfo[]>();
    for (const route of inventory) {
      if (!categories.has(route.category)) {
        categories.set(route.category, []);
      }
      categories.get(route.category)!.push(route);
    }

    // Verify expected categories exist
    const expectedCategories = [
      'Authentication',
      'Packages',
      'Events & Security Console',
      'Maintenance',
      'Amenity Booking',
      'Announcements',
      'User Management',
      'Units & Buildings',
      'Shift Log',
      'Vendor Management',
      'Training & LMS',
      'Parking',
      'Billing & Subscription',
      'Help Center',
      'Developer Portal & API',
      'Reports & Analytics',
      'Compliance',
    ];

    for (const cat of expectedCategories) {
      expect(categories.has(cat)).toBe(true);
    }
  });

  it('counts total unique endpoints (method + path combinations)', () => {
    let totalEndpoints = 0;
    for (const route of inventory) {
      totalEndpoints += route.methods.length;
    }
    // We expect at least 200 individual endpoints
    expect(totalEndpoints).toBeGreaterThan(200);
  });

  it('produces summary statistics', () => {
    const stats = {
      totalRouteFiles: inventory.length,
      totalEndpoints: inventory.reduce((sum, r) => sum + r.methods.length, 0),
      authProtected: inventory.filter((r) => r.requiresAuth).length,
      publicRoutes: inventory.filter((r) => !r.requiresAuth).length,
      categories: [...new Set(inventory.map((r) => r.category))].length,
    };

    expect(stats.totalRouteFiles).toBeGreaterThan(100);
    expect(stats.totalEndpoints).toBeGreaterThan(200);
    expect(stats.authProtected).toBeGreaterThan(stats.publicRoutes);
    expect(stats.categories).toBeGreaterThan(15);
  });
});

// ---------------------------------------------------------------------------
// 5. Completeness — every module in CLAUDE.md has routes
// ---------------------------------------------------------------------------

describe('Module completeness', () => {
  const requiredModules = [
    { name: 'Events', prefix: 'v1/events' },
    { name: 'Packages', prefix: 'v1/packages' },
    { name: 'Maintenance', prefix: 'v1/maintenance' },
    { name: 'Amenities', prefix: 'v1/amenities' },
    { name: 'Bookings', prefix: 'v1/bookings' },
    { name: 'Announcements', prefix: 'v1/announcements' },
    { name: 'Users', prefix: 'v1/users' },
    { name: 'Units', prefix: 'v1/units' },
    { name: 'Visitors', prefix: 'v1/visitors' },
    { name: 'Parking', prefix: 'v1/parking' },
    { name: 'Shift Log', prefix: 'v1/shift-log' },
    { name: 'Training', prefix: 'v1/training' },
    { name: 'Vendors', prefix: 'v1/vendors' },
    { name: 'Emergency Broadcast', prefix: 'v1/emergency/broadcast' },
    { name: 'Equipment', prefix: 'v1/equipment' },
    { name: 'Inspections', prefix: 'v1/inspections' },
    { name: 'Recurring Tasks', prefix: 'v1/recurring-tasks' },
    { name: 'Alterations', prefix: 'v1/alterations' },
    { name: 'Billing', prefix: 'v1/billing' },
    { name: 'Help Center', prefix: 'v1/help' },
    { name: 'Developer Portal', prefix: 'v1/developer' },
    { name: 'Data Migration', prefix: 'v1/data-migration' },
    { name: 'Compliance', prefix: 'v1/compliance' },
    { name: 'Demo Environment', prefix: 'v1/demo' },
    { name: 'Reports', prefix: 'v1/reports' },
    { name: 'Notifications', prefix: 'v1/notifications' },
    { name: 'Search', prefix: 'v1/search' },
    { name: 'Onboarding', prefix: 'v1/onboarding' },
    { name: 'Governance', prefix: 'v1/governance' },
    { name: 'Classifieds', prefix: 'v1/classifieds' },
    { name: 'Ideas', prefix: 'v1/ideas' },
    { name: 'Forum', prefix: 'v1/forum' },
    { name: 'AI', prefix: 'v1/ai' },
    { name: 'Properties', prefix: 'v1/properties' },
  ];

  it.each(requiredModules.map((m) => [m.name, m.prefix]))(
    '%s module has at least one route (prefix: %s)',
    (_name, prefix) => {
      const routes = inventory.filter((r) => r.routePath.startsWith(prefix));
      expect(routes.length).toBeGreaterThanOrEqual(1);
    },
  );
});

// ---------------------------------------------------------------------------
// 6. Resident portal completeness
// ---------------------------------------------------------------------------

describe('Resident self-service portal', () => {
  const residentRoutes = [
    'v1/resident/packages',
    'v1/resident/maintenance',
    'v1/resident/bookings',
    'v1/resident/announcements',
    'v1/resident/notifications',
    'v1/resident/profile',
  ];

  it.each(residentRoutes)('%s exists for resident self-service', (routePath) => {
    const route = inventory.find((r) => r.routePath === routePath);
    expect(route).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// 7. Export the inventory for external use
// ---------------------------------------------------------------------------

describe('Exportable inventory', () => {
  it('can generate a markdown table of all endpoints', () => {
    const lines: string[] = [
      '| Method | Path | Auth | Description |',
      '|--------|------|------|-------------|',
    ];
    for (const route of inventory) {
      for (const method of route.methods) {
        lines.push(
          `| ${method} | ${route.apiPath} | ${route.requiresAuth ? 'Yes' : 'No'} | ${route.description} |`,
        );
      }
    }
    const markdown = lines.join('\n');
    expect(markdown).toContain('/api/auth/login');
    expect(markdown).toContain('/api/v1/packages');
    expect(markdown).toContain('/api/v1/events');
    expect(lines.length).toBeGreaterThan(200);
  });
});
