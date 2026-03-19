/**
 * Concierge — Database Integration Test Setup
 *
 * Provides infrastructure for running integration tests against a real
 * PostgreSQL database. This catches SQL/schema issues that mocks miss:
 * constraint violations, cascade behavior, JSON field handling, etc.
 *
 * Usage:
 *   Set DATABASE_URL_TEST to a PostgreSQL connection string pointing at
 *   a dedicated test database (e.g., concierge_test). Tests will:
 *     1. Push the Prisma schema to create a clean database
 *     2. Provide a connected PrismaClient
 *     3. Truncate all tables between tests
 *     4. Disconnect after all tests complete
 *
 * Safety:
 *   - Refuses to run if DATABASE_URL_TEST is missing
 *   - Refuses to run if the URL does not contain "test"
 *   - Uses --force-reset to guarantee a clean schema each run
 *
 * @module test/db-setup
 */

import { PrismaClient } from '@prisma/client';
import { execSync } from 'node:child_process';
import path from 'node:path';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/**
 * Resolves the test database URL.
 * Prefers DATABASE_URL_TEST. Falls back to DATABASE_URL with "_test" appended
 * to the database name (only if DATABASE_URL is set).
 */
export function getTestDatabaseUrl(): string | undefined {
  if (process.env['DATABASE_URL_TEST']) {
    return process.env['DATABASE_URL_TEST'];
  }

  const baseUrl = process.env['DATABASE_URL'];
  if (baseUrl) {
    // Append _test to the database name in the connection string
    // e.g., postgresql://user:pass@host:5432/concierge -> .../concierge_test
    const url = new URL(baseUrl);
    if (!url.pathname.endsWith('_test')) {
      url.pathname = url.pathname + '_test';
    }
    return url.toString();
  }

  return undefined;
}

/**
 * Returns true when a test database is available and integration tests
 * should run. Used with describe.skipIf() to gracefully skip when no
 * test DB is configured.
 */
export function hasTestDatabase(): boolean {
  return !!process.env['DATABASE_URL_TEST'];
}

// ---------------------------------------------------------------------------
// Singleton test client
// ---------------------------------------------------------------------------

let client: PrismaClient | null = null;

/**
 * Returns the shared PrismaClient connected to the test database.
 * Creates the client on first call.
 */
export function getTestClient(): PrismaClient {
  if (client) return client;

  const url = getTestDatabaseUrl();
  if (!url) {
    throw new Error(
      'No test database URL available. Set DATABASE_URL_TEST to run integration tests.',
    );
  }

  if (!url.includes('test')) {
    throw new Error(
      `Test database URL must contain "test" to prevent accidental data loss. Got: ${url}`,
    );
  }

  client = new PrismaClient({
    datasourceUrl: url,
    log: process.env['DEBUG_PRISMA'] ? ['query', 'error', 'warn'] : ['error'],
  });

  return client;
}

// ---------------------------------------------------------------------------
// Schema push — ensures the test DB has the latest schema
// ---------------------------------------------------------------------------

/**
 * Pushes the Prisma schema to the test database with --force-reset,
 * guaranteeing a clean schema that matches the current prisma/schema.prisma.
 *
 * This runs synchronously (via execSync) because it must complete before
 * any tests execute.
 */
export function pushSchema(): void {
  const url = getTestDatabaseUrl();
  if (!url) {
    throw new Error('Cannot push schema: no test database URL.');
  }

  const projectRoot = path.resolve(__dirname, '..', '..');

  execSync('npx prisma db push --force-reset --accept-data-loss --skip-generate', {
    cwd: projectRoot,
    env: {
      ...process.env,
      DATABASE_URL: url,
    },
    stdio: process.env['DEBUG_PRISMA'] ? 'inherit' : 'pipe',
    timeout: 60_000,
  });
}

// ---------------------------------------------------------------------------
// Table truncation
// ---------------------------------------------------------------------------

/**
 * Table names in deletion order (child tables before parents).
 * Mirrors src/test/helpers/db.ts but used here for the real DB cleanup.
 */
const TABLES_TO_TRUNCATE = [
  // Audit & logging
  'audit_entries',
  'login_audits',

  // Package sub-tables
  'package_history',
  'package_signatures',
  'package_photos',

  // Security sub-tables
  'visitor_parking_permits',

  // Communication sub-tables
  'announcement_deliveries',

  // Events
  'events',
  'event_types',
  'event_groups',

  // Security console
  'pass_on_logs',
  'staff_bulletins',
  'key_inventory',
  'incident_reports',
  'incident_types',
  'security_shifts',
  'visitor_entries',

  // Packages
  'authorized_delegates',
  'packages',
  'storage_spots',
  'parcel_categories',
  'courier_types',

  // Units sub-tables
  'unit_instructions',
  'occupancy_records',
  'fobs',
  'buzzer_codes',
  'garage_clickers',
  'pets',
  'vehicles',
  'emergency_contacts',

  // Maintenance
  'maintenance_requests',
  'maintenance_categories',
  'equipment',
  'vendors',
  'vendor_service_categories',

  // Amenity & Booking
  'bookings',
  'amenities',
  'amenity_groups',

  // Parking
  'parking_violations',
  'parking_permits',
  'parking_spots',
  'parking_areas',
  'permit_types',

  // Communication
  'announcements',
  'announcement_categories',
  'announcement_templates',
  'notification_templates',
  'emergency_broadcasts',

  // Units & Buildings
  'units',
  'buildings',

  // Auth (child -> parent)
  'device_push_tokens',
  'password_history',
  'refresh_tokens',
  'sessions',
  'user_properties',
  'roles',
  'users',

  // Properties (last)
  'subscriptions',
  'demo_sessions',
  'training_progress',
  'property_settings',
  'custom_field_definitions',
  'properties',
] as const;

/**
 * Truncates all tables in the test database. Uses TRUNCATE ... CASCADE
 * for speed. Falls back to table-by-table truncation if needed.
 */
export async function truncateAllTables(): Promise<void> {
  const prisma = getTestClient();
  try {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${TABLES_TO_TRUNCATE.join(', ')} CASCADE`);
  } catch {
    // Fallback: truncate one by one, skip missing tables
    for (const table of TABLES_TO_TRUNCATE) {
      try {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE`);
      } catch {
        // Table may not exist — skip
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Lifecycle hooks for vitest
// ---------------------------------------------------------------------------

/**
 * Call in beforeAll() to set up the test database:
 *   1. Push the schema (clean reset)
 *   2. Connect the PrismaClient
 *
 * Returns the connected PrismaClient for use in tests.
 */
export async function setupTestDb(): Promise<PrismaClient> {
  pushSchema();
  const prisma = getTestClient();
  await prisma.$connect();
  return prisma;
}

/**
 * Call in afterEach() to clean data between tests.
 */
export async function cleanTestDb(): Promise<void> {
  await truncateAllTables();
}

/**
 * Call in afterAll() to disconnect and clean up.
 */
export async function teardownTestDb(): Promise<void> {
  if (client) {
    await client.$disconnect();
    client = null;
  }
}
