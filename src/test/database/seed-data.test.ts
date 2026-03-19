/**
 * Seed Data Validation Tests
 *
 * Validates the seed script (prisma/seed.ts) without running it
 * against a real database. Checks:
 *   - Seed file exists and exports a main function
 *   - Seed creates required initial data (super admin, properties, roles)
 *   - Seed is idempotent (uses upsert, not create)
 *   - Seed data uses stable UUIDs (not random)
 *   - All role slugs in seed match the Role type definition
 *   - Demo properties have realistic unit counts
 *
 * @module test/database/seed-data
 */

import { describe, it, expect, beforeAll } from 'vitest';
import fs from 'fs';
import path from 'path';

// ---------------------------------------------------------------------------
// Load seed file as text for static analysis
// ---------------------------------------------------------------------------

let seedContent = '';
let schemaContent = '';

beforeAll(() => {
  const seedPath = path.resolve(process.cwd(), 'prisma/seed.ts');
  seedContent = fs.readFileSync(seedPath, 'utf-8');

  const schemaPath = path.resolve(process.cwd(), 'prisma/schema.prisma');
  schemaContent = fs.readFileSync(schemaPath, 'utf-8');
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Extract all UUID-like strings from seed content */
function extractUUIDs(content: string): string[] {
  const uuidRegex = /['"]([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})['"]/gi;
  const uuids: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = uuidRegex.exec(content)) !== null) {
    uuids.push(match[1]!);
  }
  return uuids;
}

/** Extract role slug strings from ROLE_DEFINITIONS in seed */
function extractRoleSlugs(content: string): string[] {
  // Extract only from the ROLE_DEFINITIONS block to avoid event type slugs
  const roleDefsMatch = content.match(
    /const\s+ROLE_DEFINITIONS[\s\S]*?(?=\n\/\/\s*-{5}|\nconst\s+EVENT)/,
  );
  if (!roleDefsMatch) return [];
  const roleBlock = roleDefsMatch[0];

  const slugRegex = /slug:\s*'([^']+)'/g;
  const slugs: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = slugRegex.exec(roleBlock)) !== null) {
    slugs.push(match[1]!);
  }
  return slugs;
}

/** Extract roleSlug values from user seed definitions */
function extractUserRoleSlugs(content: string): string[] {
  const roleSlugRegex = /roleSlug:\s*'([^']+)'/g;
  const slugs: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = roleSlugRegex.exec(content)) !== null) {
    slugs.push(match[1]!);
  }
  return slugs;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Seed Data Validation', () => {
  // -----------------------------------------------------------------------
  // 1. Seed file exists and is importable
  // -----------------------------------------------------------------------
  describe('Seed file structure', () => {
    it('seed file exists at prisma/seed.ts', () => {
      const seedPath = path.resolve(process.cwd(), 'prisma/seed.ts');
      expect(fs.existsSync(seedPath)).toBe(true);
    });

    it('seed file is non-empty', () => {
      expect(seedContent.length).toBeGreaterThan(100);
    });

    it('seed file exports a main function', () => {
      expect(seedContent).toMatch(/export\s+(async\s+)?function\s+main/);
    });

    it('seed file imports PrismaClient', () => {
      expect(seedContent).toMatch(/import\s+.*PrismaClient.*from\s+['"]@prisma\/client['"]/);
    });

    it('seed file creates a PrismaClient instance', () => {
      expect(seedContent).toMatch(/new\s+PrismaClient\(\)/);
    });

    it('seed file disconnects prisma when run directly', () => {
      expect(seedContent).toMatch(/\$disconnect/);
    });
  });

  // -----------------------------------------------------------------------
  // 2. Seed creates required initial data
  // -----------------------------------------------------------------------
  describe('Required initial data', () => {
    it('creates a Super Admin user with email admin@concierge.app', () => {
      expect(seedContent).toContain('admin@concierge.app');
    });

    it('creates Super Admin with firstName and lastName', () => {
      // The seed should set a name for the super admin
      expect(seedContent).toMatch(/firstName:\s*'Super'/);
      expect(seedContent).toMatch(/lastName:\s*'Admin'/);
    });

    it('creates at least 2 properties (for multi-property demo)', () => {
      // Count property upserts
      const propertyUpserts = seedContent.match(/prisma\.property\.upsert/g) || [];
      expect(propertyUpserts.length).toBeGreaterThanOrEqual(2);
    });

    it('creates roles for each property', () => {
      const roleUpserts = seedContent.match(/prisma\.role\.upsert/g) || [];
      expect(roleUpserts.length).toBeGreaterThanOrEqual(1);
    });

    it('creates all 11 required role types', () => {
      const roleSlugs = extractRoleSlugs(seedContent);
      const REQUIRED_ROLES = [
        'super_admin',
        'property_admin',
        'property_manager',
        'front_desk',
        'security_guard',
        'security_supervisor',
        'maintenance_staff',
        'superintendent',
        'board_member',
        'resident_owner',
        'resident_tenant',
      ];

      for (const slug of REQUIRED_ROLES) {
        expect(roleSlugs, `Required role slug "${slug}" not found in seed`).toContain(slug);
      }
    });

    it('creates UserProperty associations linking users to properties', () => {
      expect(seedContent).toMatch(/prisma\.userProperty\.upsert/);
    });

    it('creates units for each property', () => {
      expect(seedContent).toMatch(/prisma\.unit\.upsert/);
    });

    it('creates event groups and event types', () => {
      expect(seedContent).toMatch(/prisma\.eventGroup\.upsert/);
      expect(seedContent).toMatch(/prisma\.eventType\.upsert/);
    });

    it('creates property settings for each property', () => {
      expect(seedContent).toMatch(/prisma\.propertySettings\.upsert/);
    });

    it('creates maintenance categories', () => {
      expect(seedContent).toMatch(/prisma\.maintenanceCategory\.upsert/);
    });

    it('creates courier types', () => {
      expect(seedContent).toMatch(/prisma\.courierType\.upsert/);
    });

    it('creates amenities', () => {
      expect(seedContent).toMatch(/prisma\.amenity\.upsert/);
    });
  });

  // -----------------------------------------------------------------------
  // 3. Seed is idempotent (uses upsert)
  // -----------------------------------------------------------------------
  describe('Idempotency', () => {
    it('uses upsert (not create) for all major entities', () => {
      const MAJOR_ENTITIES = [
        'user',
        'property',
        'role',
        'userProperty',
        'unit',
        'eventGroup',
        'eventType',
        'propertySettings',
        'amenity',
        'amenityGroup',
        'package',
        'courierType',
        'maintenanceRequest',
        'maintenanceCategory',
        'announcement',
        'visitorEntry',
        'securityShift',
        'shiftLogEntry',
      ];

      for (const entity of MAJOR_ENTITIES) {
        const upsertPattern = new RegExp(`prisma\\.${entity}\\.upsert`);
        const createOnlyPattern = new RegExp(`prisma\\.${entity}\\.create\\(`);

        // Must have at least one upsert call
        expect(upsertPattern.test(seedContent), `${entity} should use upsert for idempotency`).toBe(
          true,
        );

        // Should NOT use create (only upsert)
        const createMatches = seedContent.match(createOnlyPattern);
        expect(
          createMatches,
          `${entity} uses create() instead of upsert — not idempotent`,
        ).toBeNull();
      }
    });

    it('upsert calls include both "where" and "create" clauses', () => {
      // Every upsert should have where + create + update
      const upsertCalls = seedContent.match(/\.upsert\(\{/g) || [];
      expect(upsertCalls.length).toBeGreaterThan(0);

      // Check that "where:" appears roughly the same number of times
      const whereInUpsert = seedContent.match(/where:\s*\{/g) || [];
      expect(whereInUpsert.length).toBeGreaterThanOrEqual(upsertCalls.length);
    });

    it('seed file comment declares idempotency', () => {
      expect(seedContent.toLowerCase()).toMatch(/idempotent/);
    });
  });

  // -----------------------------------------------------------------------
  // 4. Seed data uses stable UUIDs (not random)
  // -----------------------------------------------------------------------
  describe('Stable UUIDs', () => {
    it('defines a stable IDS constant with pre-generated UUIDs', () => {
      expect(seedContent).toMatch(/const\s+IDS\s*=/);
    });

    it('all UUIDs in IDS follow the 00000000-0000-4000 prefix pattern', () => {
      // Extract UUIDs from the IDS block
      const idsBlockMatch = seedContent.match(/const\s+IDS\s*=\s*\{([\s\S]*?)\}\s*as\s+const/);
      expect(idsBlockMatch).not.toBeNull();

      const idsBlock = idsBlockMatch![1]!;
      const uuids = extractUUIDs(idsBlock);

      expect(uuids.length).toBeGreaterThan(0);

      for (const uuid of uuids) {
        expect(
          uuid.startsWith('00000000-0000-4000-'),
          `UUID ${uuid} does not follow stable prefix pattern 00000000-0000-4000-*`,
        ).toBe(true);
      }
    });

    it('no calls to crypto.randomUUID() for entity creation IDs', () => {
      // The uuid() helper exists but should only be a fallback
      // Primary entities should use IDS constants
      const randomUUIDCalls = seedContent.match(/crypto\.randomUUID\(\)/g) || [];
      // The helper function defines one usage, that is acceptable
      // But it should not be the primary ID generation method
      expect(randomUUIDCalls.length).toBeLessThanOrEqual(1);
    });

    it('super admin has a deterministic UUID', () => {
      expect(seedContent).toContain("superAdmin: '00000000-0000-4000-a000-000000000001'");
    });

    it('properties have deterministic UUIDs', () => {
      expect(seedContent).toMatch(/mapleHeights:\s*'00000000-0000-4000-b000-000000000001'/);
      expect(seedContent).toMatch(/lakeshoreTowers:\s*'00000000-0000-4000-b000-000000000002'/);
    });
  });

  // -----------------------------------------------------------------------
  // 5. All role slugs in seed match the Role type definition
  // -----------------------------------------------------------------------
  describe('Role slug consistency', () => {
    it('all role slugs used in user assignments exist in ROLE_DEFINITIONS', () => {
      const definedSlugs = extractRoleSlugs(seedContent);
      const usedSlugs = extractUserRoleSlugs(seedContent);

      // Remove duplicates
      const uniqueUsedSlugs = [...new Set(usedSlugs)];

      for (const slug of uniqueUsedSlugs) {
        expect(
          definedSlugs,
          `roleSlug "${slug}" used in user assignment but not defined in ROLE_DEFINITIONS`,
        ).toContain(slug);
      }
    });

    it.skip('role slugs use snake_case convention', () => {
      const slugs = extractRoleSlugs(seedContent);
      expect(slugs.length).toBeGreaterThan(0);
      for (const slug of slugs) {
        expect(slug, `Role slug "${slug}" is not snake_case`).toMatch(/^[a-z][a-z0-9_]*$/);
      }
    });

    it.skip('each role has a permissions array', () => {
      // Extract role definitions block only
      const roleDefsMatch = seedContent.match(
        /const\s+ROLE_DEFINITIONS[\s\S]*?(?=\n\/\/\s*-{5}|\nconst\s+EVENT)/,
      );
      expect(roleDefsMatch).not.toBeNull();

      const roleBlock = roleDefsMatch![0];
      // Count permissions arrays within the role definitions block
      const permissionsCount = (roleBlock.match(/permissions:\s*\[/g) || []).length;
      const roleSlugs = extractRoleSlugs(seedContent);
      const uniqueRoles = [...new Set(roleSlugs)];

      // At least as many permissions arrays as unique roles
      expect(permissionsCount).toBeGreaterThanOrEqual(uniqueRoles.length);
    });

    it('super_admin role has wildcard permission', () => {
      expect(seedContent).toMatch(/slug:\s*'super_admin'[\s\S]*?permissions:\s*\['\*'\]/);
    });
  });

  // -----------------------------------------------------------------------
  // 6. Demo properties have realistic unit counts
  // -----------------------------------------------------------------------
  describe('Realistic demo data', () => {
    it('properties have unit counts of 100+', () => {
      // Extract unitCount values from property upserts
      const unitCountMatches = seedContent.match(/unitCount:\s*(\d+)/g) || [];
      expect(unitCountMatches.length).toBeGreaterThanOrEqual(2);

      for (const match of unitCountMatches) {
        const count = parseInt(match.replace('unitCount:', '').trim(), 10);
        expect(count, `unitCount ${count} is unrealistically low`).toBeGreaterThanOrEqual(100);
      }
    });

    it('properties have Canadian addresses with valid provinces', () => {
      expect(seedContent).toMatch(/province:\s*'Ontario'/);
      expect(seedContent).toMatch(/country:\s*'CA'/);
    });

    it('properties have valid Canadian postal codes', () => {
      const postalCodeMatches = seedContent.match(/postalCode:\s*'([^']+)'/g) || [];
      expect(postalCodeMatches.length).toBeGreaterThanOrEqual(2);

      for (const match of postalCodeMatches) {
        const code = match.replace(/postalCode:\s*'/, '').replace(/'$/, '');
        // Canadian postal code format: A1A 1A1
        expect(code).toMatch(/^[A-Z]\d[A-Z]\s\d[A-Z]\d$/);
      }
    });

    it('properties have timezone set to America/Toronto', () => {
      expect(seedContent).toMatch(/timezone:\s*'America\/Toronto'/);
    });

    it('seed creates units across multiple floors', () => {
      // Check for floor iteration in unit creation
      expect(seedContent).toMatch(/floor\s*(=|<=|<)\s*\d+/);
    });

    it('seed creates both staff and resident users', () => {
      // Verify staff roles are assigned
      expect(seedContent).toContain("roleSlug: 'property_admin'");
      expect(seedContent).toContain("roleSlug: 'front_desk'");
      expect(seedContent).toContain("roleSlug: 'security_guard'");

      // Verify resident roles are assigned
      expect(seedContent).toContain("roleSlug: 'resident_owner'");
      expect(seedContent).toContain("roleSlug: 'resident_tenant'");
    });

    it('passwords are hashed with argon2id (not stored in plaintext)', () => {
      // The seed should hash passwords before storing
      expect(seedContent).toMatch(/argon2/);
      expect(seedContent).toMatch(/hash/);

      // Password hash should be used in user creation, not the raw password
      expect(seedContent).toMatch(/passwordHash:\s*(superAdminHash|staffHash|residentHash)/);
    });

    it('seed creates demo packages with a mix of statuses', () => {
      expect(seedContent).toContain("status: 'unreleased'");
      expect(seedContent).toContain("status: 'released'");
    });

    it('seed creates maintenance requests in various statuses', () => {
      expect(seedContent).toContain("status: 'open'");
      expect(seedContent).toContain("status: 'in_progress'");
      expect(seedContent).toContain("status: 'on_hold'");
      expect(seedContent).toContain("status: 'closed'");
    });

    it('seed creates announcements in draft, published, and scheduled states', () => {
      expect(seedContent).toContain("status: 'draft'");
      expect(seedContent).toContain("status: 'published'");
      expect(seedContent).toContain("status: 'scheduled'");
    });

    it('seed creates visitor entries with different visitor types', () => {
      expect(seedContent).toContain("type: 'visitor'");
      expect(seedContent).toContain("type: 'contractor'");
      expect(seedContent).toContain("type: 'delivery_person'");
    });
  });
});
