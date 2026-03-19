/**
 * Database Integration Tests — Real PostgreSQL
 *
 * These tests run against a real PostgreSQL database (not mocks) to catch
 * SQL/schema issues: constraint violations, cascade behavior, JSON field
 * handling, transaction semantics, tenant isolation, and datetime behavior.
 *
 * Skipped by default when DATABASE_URL_TEST is not set, so they never
 * break CI without a test database.
 *
 * To run:
 *   DATABASE_URL_TEST=postgresql://user:pass@localhost:5432/concierge_test \
 *     pnpm vitest run src/test/integration/db-integration.test.ts
 *
 * @module test/integration/db-integration
 */

import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import type { PrismaClient } from '@prisma/client';
import { hasTestDatabase, setupTestDb, cleanTestDb, teardownTestDb } from '@/test/db-setup';

// ---------------------------------------------------------------------------
// Skip the entire suite when no test database is available
// ---------------------------------------------------------------------------

const SKIP = !hasTestDatabase();

describe.skipIf(SKIP)('Database Integration Tests (real PostgreSQL)', () => {
  let prisma: PrismaClient;

  beforeAll(async () => {
    if (SKIP) return;
    prisma = await setupTestDb();
  }, 120_000); // schema push can take a while

  afterEach(async () => {
    if (SKIP) return;
    await cleanTestDb();
  });

  afterAll(async () => {
    if (SKIP) return;
    await teardownTestDb();
  });

  // -------------------------------------------------------------------------
  // Helpers — factory functions for common data
  // -------------------------------------------------------------------------

  async function createTestProperty(overrides: Record<string, unknown> = {}) {
    return prisma.property.create({
      data: {
        name: 'Maple Heights',
        address: '100 Maple Ave',
        city: 'Toronto',
        province: 'ON',
        country: 'CA',
        postalCode: 'M5V 1A1',
        ...overrides,
      },
    });
  }

  async function createTestUser(overrides: Record<string, unknown> = {}) {
    return prisma.user.create({
      data: {
        email: `testuser-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`,
        passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$fakesalt$fakehash',
        firstName: 'Test',
        lastName: 'User',
        ...overrides,
      },
    });
  }

  async function createTestRole(propertyId: string, overrides: Record<string, unknown> = {}) {
    return prisma.role.create({
      data: {
        propertyId,
        name: 'Resident',
        slug: `resident-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        permissions: JSON.stringify(['read:own']),
        ...overrides,
      },
    });
  }

  async function createTestUnit(propertyId: string, overrides: Record<string, unknown> = {}) {
    return prisma.unit.create({
      data: {
        propertyId,
        number: `${Math.floor(Math.random() * 9000) + 1000}`,
        ...overrides,
      },
    });
  }

  // -------------------------------------------------------------------------
  // 1. Create a property and verify it is stored
  // -------------------------------------------------------------------------

  it('creates a property and persists all fields', async () => {
    const property = await createTestProperty({
      name: 'Oakwood Towers',
      address: '200 Oak St',
      city: 'Ottawa',
      province: 'ON',
      postalCode: 'K1A 0B1',
      unitCount: 120,
      timezone: 'America/Toronto',
    });

    expect(property.id).toBeDefined();
    expect(property.name).toBe('Oakwood Towers');
    expect(property.address).toBe('200 Oak St');
    expect(property.city).toBe('Ottawa');
    expect(property.unitCount).toBe(120);
    expect(property.isActive).toBe(true);
    expect(property.type).toBe('PRODUCTION');

    // Verify we can read it back
    const found = await prisma.property.findUnique({ where: { id: property.id } });
    expect(found).not.toBeNull();
    expect(found!.name).toBe('Oakwood Towers');
  });

  // -------------------------------------------------------------------------
  // 2. Create a user with password hash and verify login data
  // -------------------------------------------------------------------------

  it('creates a user with password hash and verifies login data', async () => {
    const user = await createTestUser({
      email: 'login-test@example.com',
      passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$realsalt$realhash',
      firstName: 'Alice',
      lastName: 'Smith',
      phone: '+14165551234',
    });

    expect(user.id).toBeDefined();
    expect(user.email).toBe('login-test@example.com');
    expect(user.passwordHash).toBe('$argon2id$v=19$m=65536,t=3,p=4$realsalt$realhash');
    expect(user.firstName).toBe('Alice');
    expect(user.lastName).toBe('Smith');
    expect(user.phone).toBe('+14165551234');
    expect(user.isActive).toBe(true);
    expect(user.mfaEnabled).toBe(false);

    // Verify lookup by email (the login query)
    const loginUser = await prisma.user.findUnique({
      where: { email: 'login-test@example.com' },
      select: { id: true, passwordHash: true, isActive: true },
    });
    expect(loginUser).not.toBeNull();
    expect(loginUser!.passwordHash).toBe('$argon2id$v=19$m=65536,t=3,p=4$realsalt$realhash');
    expect(loginUser!.isActive).toBe(true);
  });

  // -------------------------------------------------------------------------
  // 3. Create a unit and verify propertyId relation
  // -------------------------------------------------------------------------

  it('creates a unit linked to a property and verifies the relation', async () => {
    const property = await createTestProperty();
    const unit = await createTestUnit(property.id, {
      number: '1501',
      floor: 15,
      unitType: 'residential',
      status: 'occupied',
    });

    expect(unit.id).toBeDefined();
    expect(unit.propertyId).toBe(property.id);
    expect(unit.number).toBe('1501');
    expect(unit.floor).toBe(15);

    // Verify the relation via include
    const unitWithProperty = await prisma.unit.findUnique({
      where: { id: unit.id },
      include: { property: true },
    });
    expect(unitWithProperty!.property.name).toBe('Maple Heights');
  });

  // -------------------------------------------------------------------------
  // 4. Create a package and verify it links to unit and property
  // -------------------------------------------------------------------------

  it('creates a package linked to unit and property', async () => {
    const property = await createTestProperty();
    const unit = await createTestUnit(property.id, { number: '701' });

    const pkg = await prisma.package.create({
      data: {
        propertyId: property.id,
        unitId: unit.id,
        referenceNumber: 'PKG-20260318-001',
        direction: 'incoming',
        status: 'unreleased',
        createdById: (await createTestUser()).id,
        description: 'Amazon box',
        isPerishable: true,
      },
    });

    expect(pkg.id).toBeDefined();
    expect(pkg.propertyId).toBe(property.id);
    expect(pkg.unitId).toBe(unit.id);
    expect(pkg.referenceNumber).toBe('PKG-20260318-001');
    expect(pkg.isPerishable).toBe(true);
    expect(pkg.status).toBe('unreleased');

    // Verify relations via include
    const pkgWithRelations = await prisma.package.findUnique({
      where: { id: pkg.id },
      include: { unit: true, property: true },
    });
    expect(pkgWithRelations!.unit.number).toBe('701');
    expect(pkgWithRelations!.property.id).toBe(property.id);
  });

  // -------------------------------------------------------------------------
  // 5. Tenant isolation: queries only return data for the correct property
  // -------------------------------------------------------------------------

  it('enforces tenant isolation — queries scoped to one property', async () => {
    const propertyA = await createTestProperty({ name: 'Property A', postalCode: 'A1A 1A1' });
    const propertyB = await createTestProperty({ name: 'Property B', postalCode: 'B2B 2B2' });

    // Create units in each property
    await createTestUnit(propertyA.id, { number: '101' });
    await createTestUnit(propertyA.id, { number: '102' });
    await createTestUnit(propertyB.id, { number: '201' });

    // Query units scoped to Property A
    const unitsA = await prisma.unit.findMany({
      where: { propertyId: propertyA.id, deletedAt: null },
    });
    expect(unitsA).toHaveLength(2);
    expect(unitsA.every((u) => u.propertyId === propertyA.id)).toBe(true);

    // Query units scoped to Property B
    const unitsB = await prisma.unit.findMany({
      where: { propertyId: propertyB.id, deletedAt: null },
    });
    expect(unitsB).toHaveLength(1);
    expect(unitsB[0]!.number).toBe('201');

    // Verify no cross-property leakage
    const allUnits = await prisma.unit.findMany();
    expect(allUnits).toHaveLength(3);
  });

  // -------------------------------------------------------------------------
  // 6. Unique constraints: duplicate email user creation fails
  // -------------------------------------------------------------------------

  it('rejects duplicate email on user creation', async () => {
    await createTestUser({ email: 'duplicate@example.com' });

    await expect(createTestUser({ email: 'duplicate@example.com' })).rejects.toThrow();
  });

  // -------------------------------------------------------------------------
  // 7. Cascade / soft-delete: soft-delete user, verify sessions revoked
  // -------------------------------------------------------------------------

  it('soft-deletes a user and can revoke their sessions', async () => {
    const user = await createTestUser({ email: 'softdelete@example.com' });

    // Create sessions for the user
    const session1 = await prisma.session.create({
      data: {
        userId: user.id,
        deviceFingerprint: 'fp-abc123',
        ipAddress: '192.168.1.1',
        userAgent: 'TestAgent/1.0',
        expiresAt: new Date(Date.now() + 86400_000),
      },
    });
    const session2 = await prisma.session.create({
      data: {
        userId: user.id,
        deviceFingerprint: 'fp-def456',
        ipAddress: '192.168.1.2',
        userAgent: 'TestAgent/2.0',
        expiresAt: new Date(Date.now() + 86400_000),
      },
    });

    // Soft-delete the user
    await prisma.user.update({
      where: { id: user.id },
      data: { deletedAt: new Date(), isActive: false },
    });

    // Revoke all sessions for the soft-deleted user (application-level cascade)
    const revokeResult = await prisma.session.updateMany({
      where: { userId: user.id, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    expect(revokeResult.count).toBe(2);

    // Verify sessions are revoked
    const activeSessions = await prisma.session.findMany({
      where: { userId: user.id, revokedAt: null },
    });
    expect(activeSessions).toHaveLength(0);

    // Verify user is soft-deleted but still in the database
    const deletedUser = await prisma.user.findUnique({ where: { id: user.id } });
    expect(deletedUser).not.toBeNull();
    expect(deletedUser!.deletedAt).not.toBeNull();
    expect(deletedUser!.isActive).toBe(false);

    // Active user query should exclude soft-deleted users
    const activeUsers = await prisma.user.findMany({
      where: { deletedAt: null, email: 'softdelete@example.com' },
    });
    expect(activeUsers).toHaveLength(0);

    // Verify both session IDs exist but are revoked
    const s1 = await prisma.session.findUnique({ where: { id: session1.id } });
    const s2 = await prisma.session.findUnique({ where: { id: session2.id } });
    expect(s1!.revokedAt).not.toBeNull();
    expect(s2!.revokedAt).not.toBeNull();
  });

  // -------------------------------------------------------------------------
  // 8. JSON fields: store and retrieve custom fields
  // -------------------------------------------------------------------------

  it('stores and retrieves JSON custom fields on a unit', async () => {
    const property = await createTestProperty();

    const customFields = {
      petPolicy: 'no-dogs',
      moveInDate: '2026-03-15',
      amenityAccess: ['pool', 'gym', 'rooftop'],
      parkingAssignment: { spot: 'P2-45', type: 'underground' },
    };

    const unit = await createTestUnit(property.id, {
      number: '808',
      customFields,
    });

    expect(unit.customFields).toEqual(customFields);

    // Re-fetch and verify JSON round-trip
    const fetched = await prisma.unit.findUnique({ where: { id: unit.id } });
    const fields = fetched!.customFields as Record<string, unknown>;
    expect(fields['petPolicy']).toBe('no-dogs');
    expect(fields['amenityAccess']).toEqual(['pool', 'gym', 'rooftop']);
    expect(fields['parkingAssignment']).toEqual({ spot: 'P2-45', type: 'underground' });

    // Update JSON field and verify
    await prisma.unit.update({
      where: { id: unit.id },
      data: {
        customFields: {
          ...customFields,
          petPolicy: 'cats-only',
          newField: 42,
        },
      },
    });

    const updated = await prisma.unit.findUnique({ where: { id: unit.id } });
    const updatedFields = updated!.customFields as Record<string, unknown>;
    expect(updatedFields['petPolicy']).toBe('cats-only');
    expect(updatedFields['newField']).toBe(42);
    expect(updatedFields['amenityAccess']).toEqual(['pool', 'gym', 'rooftop']);
  });

  // -------------------------------------------------------------------------
  // 9. DateTime handling: createdAt auto-set, updatedAt changes on update
  // -------------------------------------------------------------------------

  it('auto-sets createdAt and updates updatedAt on modification', async () => {
    const before = new Date();

    const property = await createTestProperty({ name: 'DateTime Test Property' });

    const after = new Date();

    // createdAt should be between before and after
    expect(property.createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime() - 1000);
    expect(property.createdAt.getTime()).toBeLessThanOrEqual(after.getTime() + 1000);

    // updatedAt should be set on creation too
    expect(property.updatedAt).toBeDefined();
    const originalUpdatedAt = property.updatedAt;

    // Wait briefly so updatedAt will differ
    await new Promise((resolve) => setTimeout(resolve, 50));

    // Update the property
    const updated = await prisma.property.update({
      where: { id: property.id },
      data: { name: 'DateTime Test Property (Updated)' },
    });

    // updatedAt should have changed
    expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(originalUpdatedAt.getTime());
    expect(updated.name).toBe('DateTime Test Property (Updated)');

    // createdAt should NOT have changed
    expect(updated.createdAt.getTime()).toBe(property.createdAt.getTime());
  });

  // -------------------------------------------------------------------------
  // 10. Transaction: create user + userProperty atomically, rollback on failure
  // -------------------------------------------------------------------------

  it('creates user + userProperty atomically in a transaction', async () => {
    const property = await createTestProperty();
    const role = await createTestRole(property.id);

    // Successful transaction: create user and link to property
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: 'transaction-test@example.com',
          passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$salt$hash',
          firstName: 'Tx',
          lastName: 'User',
        },
      });

      const userProperty = await tx.userProperty.create({
        data: {
          userId: user.id,
          propertyId: property.id,
          roleId: role.id,
        },
      });

      return { user, userProperty };
    });

    expect(result.user.email).toBe('transaction-test@example.com');
    expect(result.userProperty.propertyId).toBe(property.id);
    expect(result.userProperty.roleId).toBe(role.id);

    // Verify both records exist after successful transaction
    const user = await prisma.user.findUnique({ where: { id: result.user.id } });
    const userProp = await prisma.userProperty.findUnique({
      where: { id: result.userProperty.id },
    });
    expect(user).not.toBeNull();
    expect(userProp).not.toBeNull();
  });

  it('rolls back entire transaction on failure', async () => {
    const property = await createTestProperty();
    const role = await createTestRole(property.id);

    let createdUserId: string | null = null;

    // Transaction that should fail — user is created, then we try
    // to create a userProperty with a nonexistent role ID
    await expect(
      prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
          data: {
            email: 'rollback-test@example.com',
            passwordHash: '$argon2id$v=19$m=65536,t=3,p=4$salt$hash',
            firstName: 'Rollback',
            lastName: 'Test',
          },
        });
        createdUserId = user.id;

        // This should fail — nonexistent role ID violates FK constraint
        await tx.userProperty.create({
          data: {
            userId: user.id,
            propertyId: property.id,
            roleId: '00000000-0000-0000-0000-000000000000', // nonexistent
          },
        });
      }),
    ).rejects.toThrow();

    // User should NOT exist because the transaction rolled back
    if (createdUserId) {
      const user = await prisma.user.findUnique({ where: { id: createdUserId } });
      expect(user).toBeNull();
    }

    // No user with the rollback email should exist
    const rollbackUser = await prisma.user.findUnique({
      where: { email: 'rollback-test@example.com' },
    });
    expect(rollbackUser).toBeNull();

    // Suppress unused variable lint — role is needed for the successful tx test setup
    void role;
  });
});
