/**
 * Concierge — Database Test Helper
 *
 * Utilities for managing a test database connection, cleaning state
 * between tests, and wrapping tests in rollback transactions.
 *
 * IMPORTANT: These helpers require a separate test database.
 * Set DATABASE_URL in .env.test to point to your test DB.
 *
 * @module test/helpers/db
 */

import { PrismaClient } from '@prisma/client';

// ---------------------------------------------------------------------------
// Singleton test client
// ---------------------------------------------------------------------------

let testPrisma: PrismaClient | null = null;

/**
 * Returns a shared PrismaClient connected to the test database.
 * Creates the client on first call, reuses on subsequent calls.
 *
 * Validates that DATABASE_URL contains "test" to prevent
 * accidentally wiping a production or development database.
 */
export function getTestPrisma(): PrismaClient {
  if (testPrisma) return testPrisma;

  const databaseUrl = process.env['DATABASE_URL'] ?? '';

  if (!databaseUrl.includes('test')) {
    throw new Error(
      'DATABASE_URL does not contain "test". Refusing to connect to avoid ' +
        'accidentally cleaning a non-test database. Set DATABASE_URL to your ' +
        'test database in .env.test (e.g., postgresql://...concierge_test).',
    );
  }

  testPrisma = new PrismaClient({
    datasourceUrl: databaseUrl,
    log: process.env['DEBUG_PRISMA'] ? ['query', 'error'] : ['error'],
  });

  return testPrisma;
}

// ---------------------------------------------------------------------------
// Setup & Teardown
// ---------------------------------------------------------------------------

/**
 * Connects to the test database. Call in beforeAll().
 *
 * @example
 * ```ts
 * beforeAll(async () => {
 *   await setupTestDatabase();
 * });
 * ```
 */
export async function setupTestDatabase(): Promise<PrismaClient> {
  const prisma = getTestPrisma();
  await prisma.$connect();
  return prisma;
}

/**
 * Disconnects from the test database. Call in afterAll().
 *
 * @example
 * ```ts
 * afterAll(async () => {
 *   await teardownTestDatabase();
 * });
 * ```
 */
export async function teardownTestDatabase(): Promise<void> {
  if (testPrisma) {
    await testPrisma.$disconnect();
    testPrisma = null;
  }
}

// ---------------------------------------------------------------------------
// Clean Database
// ---------------------------------------------------------------------------

/**
 * Table names in deletion order (respects foreign key constraints).
 * Child tables are listed before parent tables.
 */
const TABLE_DELETION_ORDER = [
  // Audit & logging (no FK dependencies on them)
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

  // Event model
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

  // Unit sub-tables
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

  // Auth
  'password_history',
  'refresh_tokens',
  'sessions',
  'user_properties',
  'roles',
  'users',

  // Properties (last — everything references this)
  'subscriptions',
  'demo_sessions',
  'training_progress',
  'properties',
] as const;

/**
 * Truncates all tables in the test database between tests.
 * Uses TRUNCATE ... CASCADE for speed and correctness.
 *
 * @example
 * ```ts
 * afterEach(async () => {
 *   await cleanDatabase();
 * });
 * ```
 */
export async function cleanDatabase(): Promise<void> {
  const prisma = getTestPrisma();

  // Use a single TRUNCATE statement with CASCADE for maximum speed.
  // Falls back to sequential truncation if any table doesn't exist.
  try {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${TABLE_DELETION_ORDER.join(', ')} CASCADE`);
  } catch {
    // Fallback: truncate tables one by one, skipping missing ones
    for (const table of TABLE_DELETION_ORDER) {
      try {
        await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE`);
      } catch {
        // Table may not exist yet (schema not fully migrated) — skip
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Transaction Wrapper
// ---------------------------------------------------------------------------

/**
 * Wraps a test callback in a database transaction that is always rolled back.
 * This ensures complete isolation between tests without needing to truncate.
 *
 * NOTE: This uses Prisma's interactive transactions. The callback receives
 * a transaction client that must be used instead of the global client.
 *
 * @example
 * ```ts
 * it('creates a property', async () => {
 *   await withTransaction(async (tx) => {
 *     const property = await tx.property.create({ data: propertyData });
 *     expect(property.name).toBe('Maple Tower');
 *     // Transaction is rolled back automatically — no cleanup needed
 *   });
 * });
 * ```
 */
export async function withTransaction<T>(
  callback: (tx: Parameters<Parameters<PrismaClient['$transaction']>[0]>[0]) => Promise<T>,
): Promise<void> {
  const prisma = getTestPrisma();

  try {
    await prisma.$transaction(async (tx) => {
      await callback(tx);
      // Force rollback by throwing after the test completes
      throw new RollbackError();
    });
  } catch (error) {
    if (error instanceof RollbackError) {
      // Expected — transaction was rolled back successfully
      return;
    }
    // Re-throw real errors
    throw error;
  }
}

/**
 * Sentinel error used to trigger transaction rollback.
 * Not a real error — caught and swallowed by withTransaction().
 */
class RollbackError extends Error {
  constructor() {
    super('__test_rollback__');
    this.name = 'RollbackError';
  }
}
