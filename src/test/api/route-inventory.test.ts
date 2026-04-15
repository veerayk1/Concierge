/**
 * API Route Inventory Tests
 *
 * Validates structural integrity of the API layer:
 *   - All expected API route files exist on disk
 *   - Routes export the expected HTTP method handlers (GET, POST, PATCH, DELETE)
 *   - Auth routes (login, forgot-password, etc.) do not use guardRoute
 *   - Protected routes use guardRoute for authentication
 *   - All route files follow consistent patterns
 *
 * These tests verify the route inventory without starting an HTTP server.
 * They read route files to confirm exports and auth guard usage.
 *
 * @module test/api/route-inventory
 */

import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PROJECT_ROOT = process.cwd();
const API_ROOT = path.join(PROJECT_ROOT, 'src/app/api');

function routeExists(routePath: string): boolean {
  const fullPath = path.join(API_ROOT, routePath, 'route.ts');
  return fs.existsSync(fullPath);
}

function readRouteFile(routePath: string): string {
  const fullPath = path.join(API_ROOT, routePath, 'route.ts');
  return fs.readFileSync(fullPath, 'utf-8');
}

function routeExportsMethod(routePath: string, method: string): boolean {
  const content = readRouteFile(routePath);
  // Match "export async function GET" or "export function GET" or "export const GET"
  const pattern = new RegExp(
    `export\\s+(async\\s+)?function\\s+${method}\\b|export\\s+const\\s+${method}\\s*=`,
  );
  return pattern.test(content);
}

function routeUsesGuardRoute(routePath: string): boolean {
  const content = readRouteFile(routePath);
  return content.includes('guardRoute');
}

// ---------------------------------------------------------------------------
// 1. Expected API routes exist
// ---------------------------------------------------------------------------

describe('All expected API route files exist', () => {
  describe('Auth routes (no version prefix)', () => {
    const AUTH_ROUTES = [
      'auth/login',
      'auth/logout',
      'auth/refresh',
      'auth/forgot-password',
      'auth/reset-password',
      'auth/verify-2fa',
      'auth/sessions',
    ];

    it.each(AUTH_ROUTES)('route %s exists', (route) => {
      expect(routeExists(route)).toBe(true);
    });
  });

  describe('Core v1 API routes', () => {
    const V1_ROUTES = [
      // Events & Security Console (PRD 03)
      'v1/events',
      'v1/events/[id]',
      'v1/event-types',
      'v1/event-types/[id]',

      // Packages (PRD 04)
      'v1/packages',
      'v1/packages/[id]',
      'v1/packages/batch',
      'v1/packages/batch-release',

      // Maintenance (PRD 05)
      'v1/maintenance/categories',
      'v1/maintenance/[id]/comments',

      // Amenity Booking (PRD 06)
      'v1/amenities',
      'v1/amenities/[id]',
      'v1/amenities/groups',
      'v1/bookings',

      // Announcements (PRD 07)
      'v1/announcements/[id]',
      'v1/announcements/[id]/deliveries',

      // User Management (PRD 08)
      'v1/users/me',
      'v1/users/bulk-import',
      'v1/users/[id]/sessions',
      'v1/roles',

      // Units & Residents
      'v1/units/[id]',
      'v1/units/[id]/residents',
      'v1/units/[id]/instructions',
      'v1/residents',
      'v1/buildings',

      // Security features
      'v1/visitors',
      'v1/visitors/batch-signout',
      'v1/incidents/[id]/updates',
      'v1/keys/checkouts',
      'v1/keys/checkouts/[id]',

      // Parking
      'v1/parking',
      'v1/parking/areas',
      'v1/parking/violations',
      'v1/parking/violations/[id]',

      // Supporting entities
      'v1/emergency-contacts',
      'v1/authorized-delegates',
      'v1/pets',
      'v1/vehicles',
      'v1/storage-spots',
      'v1/couriers',

      // Communication
      'v1/notifications/preferences',
      'v1/notifications/templates',

      // Shift Log
      'v1/shift-log',
      'v1/shift-log/handoff',
      'v1/shift-log/mark-read',
      'v1/shift-log/unread-count',
      'v1/shift-log/[id]/pin',

      // Training
      'v1/training/[id]',
      'v1/training/[id]/enroll',
      'v1/training/[id]/quiz',
      'v1/training/[id]/modules/[moduleId]/complete',

      // Community
      'v1/community/events',
      'v1/community/[id]',
      'v1/community/[id]/flag',
      'v1/community/expire',

      // Vendors
      'v1/vendors',
      'v1/vendors/[id]',
      'v1/vendors/[id]/documents',

      // Export & Reports
      'v1/export',
      'v1/reports',

      // Feature Flags
      'v1/feature-flags',

      // Upload
      'v1/upload',

      // Onboarding
      'v1/onboarding',
    ];

    it.each(V1_ROUTES)('route v1/%s exists', (route) => {
      // Route path includes v1/ already in the array
      const routeWithoutV1 = route.startsWith('v1/') ? route : `v1/${route}`;
      expect(routeExists(routeWithoutV1)).toBe(true);
    });
  });

  describe('Extended module routes', () => {
    const EXTENDED_ROUTES = [
      'v1/billing',
      'v1/billing/checkout',
      'v1/emergency/broadcast',
      'v1/emergency/broadcast/[id]',
      'v1/surveys',
      'v1/surveys/[id]',
      'v1/library',
      'v1/library/[id]',
      'v1/forum',
      'v1/forum/[id]',
      'v1/forum/[id]/replies',
      'v1/classifieds',
      'v1/classifieds/[id]',
      'v1/ideas',
      'v1/ideas/[id]',
      'v1/ideas/[id]/comments',
      'v1/photo-albums',
      'v1/photo-albums/[id]',
      'v1/digital-signage',
      'v1/digital-signage/[id]',
      'v1/governance',
      'v1/governance/[id]',
      'v1/governance/meetings',
      'v1/governance/resolutions',
      'v1/governance/documents',
      'v1/governance/members',
      'v1/compliance',
      'v1/compliance/[id]',
      'v1/assets',
      'v1/assets/[id]',
      'v1/building-directory',
      'v1/building-directory/[id]',
      'v1/resident-cards',
      'v1/resident-cards/[id]',
      'v1/resident-cards/[id]/verify',
      'v1/custom-fields',
      'v1/custom-fields/[id]',
    ];

    it.each(EXTENDED_ROUTES)('route %s exists', (route) => {
      expect(routeExists(route)).toBe(true);
    });
  });

  describe('Resident self-service routes', () => {
    const RESIDENT_ROUTES = [
      'v1/resident/bookings',
      'v1/resident/maintenance',
      'v1/resident/notifications',
      'v1/resident/profile',
    ];

    it.each(RESIDENT_ROUTES)('route %s exists', (route) => {
      expect(routeExists(route)).toBe(true);
    });
  });
});

// ---------------------------------------------------------------------------
// 2. Routes export expected HTTP methods
// ---------------------------------------------------------------------------

describe('Routes export expected HTTP methods', () => {
  it('auth/login exports POST', () => {
    expect(routeExportsMethod('auth/login', 'POST')).toBe(true);
  });

  it('auth/logout exports POST', () => {
    expect(routeExportsMethod('auth/logout', 'POST')).toBe(true);
  });

  it('auth/refresh exports POST', () => {
    expect(routeExportsMethod('auth/refresh', 'POST')).toBe(true);
  });

  it('auth/forgot-password exports POST', () => {
    expect(routeExportsMethod('auth/forgot-password', 'POST')).toBe(true);
  });

  it('auth/reset-password exports POST', () => {
    expect(routeExportsMethod('auth/reset-password', 'POST')).toBe(true);
  });

  it('v1/events exports GET and POST', () => {
    expect(routeExportsMethod('v1/events', 'GET')).toBe(true);
    expect(routeExportsMethod('v1/events', 'POST')).toBe(true);
  });

  it('v1/events/[id] exports GET and PATCH', () => {
    expect(routeExportsMethod('v1/events/[id]', 'GET')).toBe(true);
    expect(routeExportsMethod('v1/events/[id]', 'PATCH')).toBe(true);
  });

  it('v1/packages exports GET and POST', () => {
    expect(routeExportsMethod('v1/packages', 'GET')).toBe(true);
    expect(routeExportsMethod('v1/packages', 'POST')).toBe(true);
  });

  it('v1/packages/[id] exports GET and PATCH', () => {
    expect(routeExportsMethod('v1/packages/[id]', 'GET')).toBe(true);
    expect(routeExportsMethod('v1/packages/[id]', 'PATCH')).toBe(true);
  });

  it('v1/amenities exports GET', () => {
    expect(routeExportsMethod('v1/amenities', 'GET')).toBe(true);
  });

  it('v1/bookings exports GET', () => {
    expect(routeExportsMethod('v1/bookings', 'GET')).toBe(true);
  });

  it('v1/announcements/[id] exports GET, PATCH, and DELETE', () => {
    expect(routeExportsMethod('v1/announcements/[id]', 'GET')).toBe(true);
    expect(routeExportsMethod('v1/announcements/[id]', 'PATCH')).toBe(true);
    expect(routeExportsMethod('v1/announcements/[id]', 'DELETE')).toBe(true);
  });

  it('v1/shift-log exports GET and POST', () => {
    expect(routeExportsMethod('v1/shift-log', 'GET')).toBe(true);
    expect(routeExportsMethod('v1/shift-log', 'POST')).toBe(true);
  });

  it('v1/vendors exports GET and POST', () => {
    expect(routeExportsMethod('v1/vendors', 'GET')).toBe(true);
    expect(routeExportsMethod('v1/vendors', 'POST')).toBe(true);
  });

  it('v1/vendors/[id] exports GET and PATCH', () => {
    expect(routeExportsMethod('v1/vendors/[id]', 'GET')).toBe(true);
    expect(routeExportsMethod('v1/vendors/[id]', 'PATCH')).toBe(true);
  });

  it('v1/reports exports GET', () => {
    expect(routeExportsMethod('v1/reports', 'GET')).toBe(true);
  });

  it('v1/upload exports POST', () => {
    expect(routeExportsMethod('v1/upload', 'POST')).toBe(true);
  });

  it('v1/feature-flags exports GET', () => {
    expect(routeExportsMethod('v1/feature-flags', 'GET')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 3. Auth routes do NOT require auth guard
// ---------------------------------------------------------------------------

describe('Auth routes do not use guardRoute', () => {
  const PUBLIC_AUTH_ROUTES = [
    'auth/login',
    'auth/forgot-password',
    'auth/reset-password',
    'auth/verify-2fa',
    'auth/refresh',
  ];

  it.each(PUBLIC_AUTH_ROUTES)('%s does not call guardRoute (public endpoint)', (route) => {
    expect(routeUsesGuardRoute(route)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 4. Protected routes require auth guard
// ---------------------------------------------------------------------------

describe('Protected routes use guardRoute', () => {
  const PROTECTED_ROUTES = [
    'v1/events',
    'v1/events/[id]',
    'v1/packages',
    'v1/packages/[id]',
    'v1/amenities',
    'v1/amenities/[id]',
    'v1/bookings',
    'v1/announcements/[id]',
    'v1/units/[id]',
    'v1/vendors',
    'v1/vendors/[id]',
    'v1/shift-log',
    'v1/reports',
    'v1/upload',
    'v1/feature-flags',
    'v1/parking',
    'v1/visitors',
    'v1/keys/checkouts',
    'v1/emergency-contacts',
  ];

  it.each(PROTECTED_ROUTES)('%s calls guardRoute for authentication', (route) => {
    expect(routeUsesGuardRoute(route)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 5. Route file consistency checks
// ---------------------------------------------------------------------------

describe('Route file consistency', () => {
  it('all v1 route files import from @/server/db or use guardRoute', () => {
    const v1Dir = path.join(API_ROOT, 'v1');

    function findRouteFiles(dir: string): string[] {
      const files: string[] = [];
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          files.push(...findRouteFiles(fullPath));
        } else if (entry.name === 'route.ts') {
          files.push(fullPath);
        }
      }
      return files;
    }

    const routeFiles = findRouteFiles(v1Dir);
    expect(routeFiles.length).toBeGreaterThan(50); // sanity check

    // Public/utility routes that intentionally skip DB and auth guard
    const EXCEPTIONS = ['v1/import-templates/route.ts'];

    const routesWithoutDbOrGuard: string[] = [];
    for (const file of routeFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      const hasDb = content.includes('@/server/db') || content.includes('prisma');
      const hasGuard = content.includes('guardRoute');
      if (!hasDb && !hasGuard) {
        const relative = path.relative(API_ROOT, file);
        if (!EXCEPTIONS.includes(relative)) {
          routesWithoutDbOrGuard.push(relative);
        }
      }
    }

    // All v1 routes should either use the database or auth guard (or both)
    expect(routesWithoutDbOrGuard).toEqual([]);
  });

  it('no route file contains hardcoded secrets or API keys', () => {
    const apiDir = API_ROOT;

    function findRouteFiles(dir: string): string[] {
      const files: string[] = [];
      if (!fs.existsSync(dir)) return files;
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          if (entry.name === 'node_modules' || entry.name === '__tests__') continue;
          files.push(...findRouteFiles(fullPath));
        } else if (entry.name === 'route.ts') {
          files.push(fullPath);
        }
      }
      return files;
    }

    const routeFiles = findRouteFiles(apiDir);
    const filesWithSecrets: string[] = [];

    for (const file of routeFiles) {
      const content = fs.readFileSync(file, 'utf-8');
      // Check for common secret patterns
      if (
        /sk_live_[a-zA-Z0-9]+/.test(content) ||
        /AKIA[A-Z0-9]{16}/.test(content) ||
        /-----BEGIN (RSA )?PRIVATE KEY-----/.test(content) ||
        /password\s*=\s*['"][^'"]+['"]/.test(content)
      ) {
        filesWithSecrets.push(path.relative(API_ROOT, file));
      }
    }

    expect(filesWithSecrets).toEqual([]);
  });

  it('all route files follow Next.js App Router convention (export named functions)', () => {
    // Verify that route files export named HTTP methods, not default exports
    const sampleRoutes = ['v1/events', 'v1/packages', 'v1/amenities', 'v1/bookings', 'v1/vendors'];

    for (const route of sampleRoutes) {
      const content = readRouteFile(route);
      // Should NOT have "export default"
      expect(content).not.toMatch(/export\s+default/);
      // Should have at least one named export function (GET, POST, PATCH, DELETE, PUT)
      expect(content).toMatch(/export\s+(async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE)\b/);
    }
  });
});

// ---------------------------------------------------------------------------
// 6. CSP report route exists
// ---------------------------------------------------------------------------

describe('Special routes', () => {
  it('CSP report route exists for Content-Security-Policy violation reporting', () => {
    expect(routeExists('csp-report')).toBe(true);
  });
});
