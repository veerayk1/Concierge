/**
 * Seed Script Tests — TDD for prisma/seed.ts
 *
 * Verifies the seed script creates all required demo data:
 * - Property, roles, users, units, amenities, packages,
 *   maintenance requests, announcements, visitors, event types,
 *   shift logs — all scoped to a single propertyId.
 * - Idempotent: running twice produces no duplicates.
 */

import { describe, expect, it, vi, beforeEach, type Mock } from 'vitest';

// ---------------------------------------------------------------------------
// Mock PrismaClient — track every upsert / create call
// ---------------------------------------------------------------------------

const upsertCalls: Record<string, Array<{ where: unknown; create: unknown; update: unknown }>> = {};
const createCalls: Record<string, Array<Record<string, unknown>>> = {};
const findManyCalls: Record<string, Array<Record<string, unknown>>> = {};

function makeModelMock(modelName: string) {
  upsertCalls[modelName] = [];
  createCalls[modelName] = [];
  findManyCalls[modelName] = [];

  return {
    upsert: vi
      .fn()
      .mockImplementation(async (args: { where: unknown; create: unknown; update: unknown }) => {
        upsertCalls[modelName]!.push(args);
        const create = args.create as Record<string, unknown>;
        // Return a plausible object with id and common fields
        return {
          id: (create['id'] as string) ?? '00000000-0000-4000-0000-000000000000',
          ...create,
        };
      }),
    create: vi.fn().mockImplementation(async (args: { data: Record<string, unknown> }) => {
      createCalls[modelName]!.push(args.data);
      return { id: (args.data['id'] as string) ?? crypto.randomUUID(), ...args.data };
    }),
    findMany: vi.fn().mockImplementation(async (args?: Record<string, unknown>) => {
      findManyCalls[modelName]!.push(args ?? {});
      return [];
    }),
    findFirst: vi.fn().mockResolvedValue(null),
    findUnique: vi.fn().mockResolvedValue(null),
    count: vi.fn().mockResolvedValue(0),
    update: vi.fn().mockImplementation(async (args: Record<string, unknown>) => args),
    updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    delete: vi.fn().mockResolvedValue({}),
    deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
  };
}

const mockModels: Record<string, ReturnType<typeof makeModelMock>> = {};
const MODEL_NAMES = [
  'user',
  'property',
  'role',
  'userProperty',
  'unit',
  'eventGroup',
  'eventType',
  'propertySettings',
  'amenityGroup',
  'amenity',
  'package',
  'courierType',
  'storageSpot',
  'maintenanceRequest',
  'maintenanceCategory',
  'announcement',
  'visitorEntry',
  'securityShift',
  'shiftLogEntry',
  'passOnLog',
  'event',
  'building',
] as const;

for (const name of MODEL_NAMES) {
  mockModels[name] = makeModelMock(name);
}

const mockPrisma = {
  ...mockModels,
  $connect: vi.fn(),
  $disconnect: vi.fn(),
  $transaction: vi.fn().mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
    // If fn is an array (sequential operations), resolve them. Otherwise call the function.
    if (Array.isArray(fn)) {
      return Promise.all(fn);
    }
    return fn(mockPrisma);
  }),
};

vi.mock('@prisma/client', () => {
  return {
    PrismaClient: vi.fn().mockImplementation(() => mockPrisma),
    PropertyType: { PRODUCTION: 'PRODUCTION', DEMO: 'DEMO', TRAINING: 'TRAINING' },
    SubscriptionTier: {
      STARTER: 'STARTER',
      PROFESSIONAL: 'PROFESSIONAL',
      ENTERPRISE: 'ENTERPRISE',
    },
  };
});

vi.mock('argon2', () => ({
  hash: vi.fn().mockResolvedValue('$argon2id$mocked-hash'),
  default: {
    hash: vi.fn().mockResolvedValue('$argon2id$mocked-hash'),
  },
}));

// ---------------------------------------------------------------------------
// Import the seed function (must come AFTER mocks are set up)
// ---------------------------------------------------------------------------

// The seed script exports its main function for testability
let seedMain: () => Promise<void>;

beforeEach(async () => {
  // Reset all tracked calls
  for (const name of MODEL_NAMES) {
    upsertCalls[name] = [];
    createCalls[name] = [];
    findManyCalls[name] = [];
    mockModels[name]!.upsert.mockClear();
    mockModels[name]!.create.mockClear();
    mockModels[name]!.findMany.mockClear();
  }
  mockPrisma.$disconnect.mockClear();

  // Dynamic import to get the seed module fresh (but mocks persist)
  const seedModule = await import('../../prisma/seed');
  seedMain = seedModule.main;
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Database Seed Script', () => {
  // -----------------------------------------------------------------------
  // 1. Demo Property
  // -----------------------------------------------------------------------
  describe('Property creation', () => {
    it('creates a demo property with realistic condo data (name, address, timezone)', async () => {
      await seedMain();

      const propertyUpserts = upsertCalls['property'] ?? [];
      expect(propertyUpserts.length).toBeGreaterThanOrEqual(1);

      const firstProperty = propertyUpserts[0]!.create as Record<string, unknown>;
      expect(firstProperty['name']).toBeTruthy();
      expect(typeof firstProperty['name']).toBe('string');
      expect(firstProperty['address']).toBeTruthy();
      expect(firstProperty['city']).toBeTruthy();
      expect(firstProperty['province']).toBeTruthy();
      expect(firstProperty['timezone']).toMatch(/^America\//);
      expect(firstProperty['postalCode']).toBeTruthy();
      expect(firstProperty['country']).toBe('CA');
    });
  });

  // -----------------------------------------------------------------------
  // 2. Roles
  // -----------------------------------------------------------------------
  describe('Role creation', () => {
    it('creates at least 6 required roles: super_admin, property_admin, property_manager, front_desk, security_guard, resident_owner', async () => {
      await seedMain();

      const roleUpserts = upsertCalls['role'] ?? [];
      // Roles are created per-property, so there should be at least 6 for the first property
      const roleSlugs = roleUpserts.map(
        (call) => (call.create as Record<string, unknown>)['slug'] as string,
      );

      const requiredSlugs = [
        'super_admin',
        'property_admin',
        'property_manager',
        'front_desk',
        'security_guard',
        'resident_owner',
      ];

      for (const slug of requiredSlugs) {
        expect(roleSlugs).toContain(slug);
      }
    });
  });

  // -----------------------------------------------------------------------
  // 3. Demo Users
  // -----------------------------------------------------------------------
  describe('User creation', () => {
    it('creates at least 10 demo users across roles (admin, manager, concierge, security, residents)', async () => {
      await seedMain();

      const userUpserts = upsertCalls['user'] ?? [];
      expect(userUpserts.length).toBeGreaterThanOrEqual(10);

      // Check there are users assigned to different roles via userProperty
      const userPropertyUpserts = upsertCalls['userProperty'] ?? [];
      expect(userPropertyUpserts.length).toBeGreaterThanOrEqual(10);
    });

    it('creates users with realistic names and email addresses', async () => {
      await seedMain();

      const userUpserts = upsertCalls['user'] ?? [];
      for (const call of userUpserts) {
        const data = call.create as Record<string, unknown>;
        expect(data['firstName']).toBeTruthy();
        expect(data['lastName']).toBeTruthy();
        expect(data['email']).toMatch(/@/);
        expect(data['passwordHash']).toBeTruthy();
      }
    });
  });

  // -----------------------------------------------------------------------
  // 4. Units
  // -----------------------------------------------------------------------
  describe('Unit creation', () => {
    it('creates 20+ units across 5 floors', async () => {
      await seedMain();

      const unitUpserts = upsertCalls['unit'] ?? [];
      expect(unitUpserts.length).toBeGreaterThanOrEqual(20);

      // Extract floor numbers
      const floors = new Set(
        unitUpserts.map((call) => (call.create as Record<string, unknown>)['floor'] as number),
      );
      expect(floors.size).toBeGreaterThanOrEqual(5);
    });

    it('creates units with realistic unit numbers (e.g. 101-520)', async () => {
      await seedMain();

      const unitUpserts = upsertCalls['unit'] ?? [];
      for (const call of unitUpserts) {
        const data = call.create as Record<string, unknown>;
        const unitNumber = data['number'] as string;
        expect(unitNumber).toMatch(/^\d{3,4}$/);
      }
    });
  });

  // -----------------------------------------------------------------------
  // 5. Amenities
  // -----------------------------------------------------------------------
  describe('Amenity creation', () => {
    it('creates 5+ amenities (party room, gym, pool, BBQ area, guest suite)', async () => {
      await seedMain();

      const amenityUpserts = upsertCalls['amenity'] ?? [];
      const amenityCreates = createCalls['amenity'] ?? [];
      const totalAmenities = amenityUpserts.length + amenityCreates.length;
      expect(totalAmenities).toBeGreaterThanOrEqual(5);

      // Verify key amenity types are represented
      const allAmenityData = [
        ...amenityUpserts.map((c) => c.create as Record<string, unknown>),
        ...amenityCreates,
      ];
      const amenityNames = allAmenityData.map((d) => ((d['name'] as string) ?? '').toLowerCase());

      const requiredAmenities = ['party room', 'gym', 'pool', 'bbq', 'guest suite'];
      for (const required of requiredAmenities) {
        const found = amenityNames.some((name) => name.includes(required));
        expect(found, `Expected amenity containing "${required}"`).toBe(true);
      }
    });
  });

  // -----------------------------------------------------------------------
  // 6. Packages
  // -----------------------------------------------------------------------
  describe('Package creation', () => {
    it('creates 10+ packages with a mix of unreleased and released', async () => {
      await seedMain();

      const packageUpserts = upsertCalls['package'] ?? [];
      const packageCreates = createCalls['package'] ?? [];
      const totalPackages = packageUpserts.length + packageCreates.length;
      expect(totalPackages).toBeGreaterThanOrEqual(10);

      const allPackageData = [
        ...packageUpserts.map((c) => c.create as Record<string, unknown>),
        ...packageCreates,
      ];

      const statuses = allPackageData.map((d) => d['status'] as string);
      expect(statuses.filter((s) => s === 'unreleased').length).toBeGreaterThanOrEqual(1);
      expect(statuses.filter((s) => s === 'released').length).toBeGreaterThanOrEqual(1);
    });

    it('includes some perishable packages', async () => {
      await seedMain();

      const allPackageData = [
        ...(upsertCalls['package'] ?? []).map((c) => c.create as Record<string, unknown>),
        ...(createCalls['package'] ?? []),
      ];

      const perishableCount = allPackageData.filter((d) => d['isPerishable'] === true).length;
      expect(perishableCount).toBeGreaterThanOrEqual(1);
    });

    it('uses package reference numbers like PKG-XXXXXX', async () => {
      await seedMain();

      const allPackageData = [
        ...(upsertCalls['package'] ?? []).map((c) => c.create as Record<string, unknown>),
        ...(createCalls['package'] ?? []),
      ];

      for (const pkg of allPackageData) {
        expect(pkg['referenceNumber']).toMatch(/^PKG-[A-Z0-9]+$/);
      }
    });
  });

  // -----------------------------------------------------------------------
  // 7. Maintenance Requests
  // -----------------------------------------------------------------------
  describe('Maintenance request creation', () => {
    it('creates 5+ maintenance requests in various statuses', async () => {
      await seedMain();

      const mrUpserts = upsertCalls['maintenanceRequest'] ?? [];
      const mrCreates = createCalls['maintenanceRequest'] ?? [];
      const totalMR = mrUpserts.length + mrCreates.length;
      expect(totalMR).toBeGreaterThanOrEqual(5);

      const allData = [...mrUpserts.map((c) => c.create as Record<string, unknown>), ...mrCreates];

      const statuses = new Set(allData.map((d) => d['status'] as string));
      // Should have at least 2 different statuses
      expect(statuses.size).toBeGreaterThanOrEqual(2);
    });

    it('creates maintenance categories (Plumbing, Electrical, HVAC, etc.)', async () => {
      await seedMain();

      const catUpserts = upsertCalls['maintenanceCategory'] ?? [];
      const catCreates = createCalls['maintenanceCategory'] ?? [];
      const allCats = [
        ...catUpserts.map((c) => c.create as Record<string, unknown>),
        ...catCreates,
      ];

      const catNames = allCats.map((d) => ((d['name'] as string) ?? '').toLowerCase());
      const requiredCats = ['plumbing', 'electrical', 'hvac'];
      for (const cat of requiredCats) {
        expect(
          catNames.some((n) => n.includes(cat)),
          `Expected maintenance category containing "${cat}"`,
        ).toBe(true);
      }
    });
  });

  // -----------------------------------------------------------------------
  // 8. Announcements
  // -----------------------------------------------------------------------
  describe('Announcement creation', () => {
    it('creates 3+ announcements (draft, published, scheduled)', async () => {
      await seedMain();

      const annUpserts = upsertCalls['announcement'] ?? [];
      const annCreates = createCalls['announcement'] ?? [];
      const totalAnn = annUpserts.length + annCreates.length;
      expect(totalAnn).toBeGreaterThanOrEqual(3);

      const allData = [
        ...annUpserts.map((c) => c.create as Record<string, unknown>),
        ...annCreates,
      ];

      const statuses = new Set(allData.map((d) => d['status'] as string));
      expect(statuses.has('draft')).toBe(true);
      expect(statuses.has('published')).toBe(true);
      expect(statuses.has('scheduled')).toBe(true);
    });
  });

  // -----------------------------------------------------------------------
  // 9. Visitor Entries
  // -----------------------------------------------------------------------
  describe('Visitor entry creation', () => {
    it('creates 5+ visitor entries (some active, some signed out)', async () => {
      await seedMain();

      const visitorUpserts = upsertCalls['visitorEntry'] ?? [];
      const visitorCreates = createCalls['visitorEntry'] ?? [];
      const totalVisitors = visitorUpserts.length + visitorCreates.length;
      expect(totalVisitors).toBeGreaterThanOrEqual(5);

      const allData = [
        ...visitorUpserts.map((c) => c.create as Record<string, unknown>),
        ...visitorCreates,
      ];

      // Some should have departureAt (signed out), some should not (still active)
      const withDeparture = allData.filter((d) => d['departureAt'] != null);
      const withoutDeparture = allData.filter((d) => d['departureAt'] == null);
      expect(withDeparture.length).toBeGreaterThanOrEqual(1);
      expect(withoutDeparture.length).toBeGreaterThanOrEqual(1);
    });
  });

  // -----------------------------------------------------------------------
  // 10. Event Types (Unified Event Model)
  // -----------------------------------------------------------------------
  describe('Event type creation', () => {
    it('creates event types for the unified event model', async () => {
      await seedMain();

      const etUpserts = upsertCalls['eventType'] ?? [];
      expect(etUpserts.length).toBeGreaterThanOrEqual(5);

      // Should have event groups too
      const egUpserts = upsertCalls['eventGroup'] ?? [];
      expect(egUpserts.length).toBeGreaterThanOrEqual(3);
    });
  });

  // -----------------------------------------------------------------------
  // 11. Shift Log Entries
  // -----------------------------------------------------------------------
  describe('Shift log creation', () => {
    it('creates security shifts with log entries', async () => {
      await seedMain();

      const shiftUpserts = upsertCalls['securityShift'] ?? [];
      const shiftCreates = createCalls['securityShift'] ?? [];
      const totalShifts = shiftUpserts.length + shiftCreates.length;
      expect(totalShifts).toBeGreaterThanOrEqual(1);

      const entryUpserts = upsertCalls['shiftLogEntry'] ?? [];
      const entryCreates = createCalls['shiftLogEntry'] ?? [];
      const totalEntries = entryUpserts.length + entryCreates.length;
      expect(totalEntries).toBeGreaterThanOrEqual(1);
    });
  });

  // -----------------------------------------------------------------------
  // 12. Tenant Isolation — all data uses same propertyId
  // -----------------------------------------------------------------------
  describe('Tenant isolation', () => {
    it('all seeded data references the same propertyId for tenant isolation', async () => {
      await seedMain();

      // Get the first property's ID
      const propertyUpserts = upsertCalls['property'] ?? [];
      expect(propertyUpserts.length).toBeGreaterThanOrEqual(1);
      const primaryPropertyId = (propertyUpserts[0]!.create as Record<string, unknown>)[
        'id'
      ] as string;
      expect(primaryPropertyId).toBeTruthy();

      // Collect all propertyIds from models that require tenant isolation
      const tenantModels = [
        'unit',
        'role',
        'amenity',
        'package',
        'maintenanceRequest',
        'maintenanceCategory',
        'announcement',
        'visitorEntry',
        'securityShift',
        'eventGroup',
        'eventType',
      ] as const;

      for (const modelName of tenantModels) {
        const upserts = upsertCalls[modelName] ?? [];
        const creates = createCalls[modelName] ?? [];
        const allData = [...upserts.map((c) => c.create as Record<string, unknown>), ...creates];

        // All records should reference one of the seeded property IDs
        const propertyIds = new Set(
          propertyUpserts.map((p) => (p.create as Record<string, unknown>)['id'] as string),
        );

        for (const record of allData) {
          if (record['propertyId']) {
            expect(
              propertyIds.has(record['propertyId'] as string),
              `${modelName} record has unexpected propertyId: ${record['propertyId']}`,
            ).toBe(true);
          }
        }
      }
    });
  });

  // -----------------------------------------------------------------------
  // 13. Idempotency — running twice doesn't create duplicates
  // -----------------------------------------------------------------------
  describe('Idempotency', () => {
    it('uses upsert for all primary entities to ensure idempotency', async () => {
      await seedMain();

      // Core entities should all be created via upsert, not create
      const coreModels = ['property', 'user', 'role', 'unit', 'eventGroup', 'eventType'] as const;
      for (const modelName of coreModels) {
        const upserts = upsertCalls[modelName] ?? [];
        expect(
          upserts.length,
          `${modelName} should use upsert (got ${upserts.length} upsert calls)`,
        ).toBeGreaterThan(0);
      }
    });

    it('running seed twice produces the same number of upsert calls', async () => {
      await seedMain();

      // Capture counts from first run
      const firstRunCounts: Record<string, number> = {};
      for (const name of MODEL_NAMES) {
        firstRunCounts[name] = (upsertCalls[name] ?? []).length + (createCalls[name] ?? []).length;
      }

      // Reset and run again
      for (const name of MODEL_NAMES) {
        upsertCalls[name] = [];
        createCalls[name] = [];
      }
      await seedMain();

      // Second run should produce the same call counts
      for (const name of MODEL_NAMES) {
        const secondCount = (upsertCalls[name] ?? []).length + (createCalls[name] ?? []).length;
        if (firstRunCounts[name]! > 0) {
          expect(
            secondCount,
            `${name}: first run had ${firstRunCounts[name]} calls, second had ${secondCount}`,
          ).toBe(firstRunCounts[name]);
        }
      }
    });
  });

  // -----------------------------------------------------------------------
  // Courier Types
  // -----------------------------------------------------------------------
  describe('Courier types', () => {
    it('creates courier types including Amazon, FedEx, UPS, Canada Post, DHL, Purolator', async () => {
      await seedMain();

      const courierUpserts = upsertCalls['courierType'] ?? [];
      const courierCreates = createCalls['courierType'] ?? [];
      const allCouriers = [
        ...courierUpserts.map((c) => c.create as Record<string, unknown>),
        ...courierCreates,
      ];

      const courierNames = allCouriers.map((d) => ((d['name'] as string) ?? '').toLowerCase());
      const requiredCouriers = ['amazon', 'fedex', 'ups', 'canada post', 'dhl', 'purolator'];
      for (const courier of requiredCouriers) {
        expect(
          courierNames.some((n) => n.includes(courier)),
          `Expected courier type containing "${courier}"`,
        ).toBe(true);
      }
    });
  });
});
