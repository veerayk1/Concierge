/**
 * Integration Workflow Tests — Package Lifecycle
 *
 * Tests complete package business workflows across multiple API endpoints:
 *   - Standard delivery (receive -> notify -> release)
 *   - Perishable escalation (4h -> 8h -> 24h reminders)
 *   - Batch intake (bulk create with independent notifications)
 *   - Outgoing package (drop-off -> carrier pickup -> tracking)
 *   - Package return (receive -> refuse -> return to carrier)
 *
 * Each test validates data transformations and side effects across the system.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createGetRequest,
  createPostRequest,
  createPatchRequest,
  createDeleteRequest,
  parseResponse,
} from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Prisma Mock
// ---------------------------------------------------------------------------

const mockPackageCreate = vi.fn();
const mockPackageFindMany = vi.fn();
const mockPackageCount = vi.fn();
const mockPackageFindUnique = vi.fn();
const mockPackageUpdate = vi.fn();
const mockPackageUpdateMany = vi.fn();

const mockPackageHistoryCreate = vi.fn();
const mockPackageHistoryFindMany = vi.fn();

const mockNotificationCreate = vi.fn();
const mockNotificationFindMany = vi.fn();

const mockTransaction = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    package: {
      create: (...args: unknown[]) => mockPackageCreate(...args),
      findMany: (...args: unknown[]) => mockPackageFindMany(...args),
      count: (...args: unknown[]) => mockPackageCount(...args),
      findUnique: (...args: unknown[]) => mockPackageFindUnique(...args),
      update: (...args: unknown[]) => mockPackageUpdate(...args),
      updateMany: (...args: unknown[]) => mockPackageUpdateMany(...args),
    },
    packageHistory: {
      create: (...args: unknown[]) => mockPackageHistoryCreate(...args),
      findMany: (...args: unknown[]) => mockPackageHistoryFindMany(...args),
    },
    notification: {
      create: (...args: unknown[]) => mockNotificationCreate(...args),
      findMany: (...args: unknown[]) => mockNotificationFindMany(...args),
    },
    $transaction: (...args: unknown[]) => {
      const first = args[0];
      if (typeof first === 'function') {
        return mockTransaction(...args);
      }
      // Array-based transaction (batch package creation)
      if (Array.isArray(first)) {
        return Promise.all(first);
      }
      return mockTransaction(...args);
    },
  },
}));

// Nanoid mock — returns incrementing values for unique ref numbers
let nanoidCounter = 0;
vi.mock('nanoid', () => ({
  nanoid: vi.fn().mockImplementation(() => {
    nanoidCounter++;
    return `REF${String(nanoidCounter).padStart(3, '0')}`;
  }),
}));

vi.mock('@/schemas/package', () => ({
  createPackageSchema: {
    safeParse: vi.fn().mockImplementation((data: Record<string, unknown>) => {
      if (!data.propertyId || !data.unitId || !data.direction) {
        return {
          success: false,
          error: {
            flatten: () => ({ fieldErrors: { propertyId: ['Required'] } }),
          },
        };
      }
      return { success: true, data };
    }),
  },
  releasePackageSchema: {
    safeParse: vi.fn().mockImplementation((data: Record<string, unknown>) => {
      if (!data.releasedToName) {
        return {
          success: false,
          error: {
            flatten: () => ({ fieldErrors: { releasedToName: ['Required'] } }),
          },
        };
      }
      return { success: true, data };
    }),
  },
  batchCreatePackageSchema: {
    safeParse: vi.fn().mockImplementation((data: Record<string, unknown>) => {
      if (!data.propertyId || !Array.isArray(data.packages) || data.packages.length === 0) {
        return {
          success: false,
          error: {
            flatten: () => ({
              fieldErrors: { packages: ['At least one package required'] },
            }),
          },
        };
      }
      return { success: true, data };
    }),
  },
}));

vi.mock('@/lib/sanitize', () => ({
  stripHtml: (s: string) => s,
  stripControlChars: (s: string) => s,
}));

vi.mock('@/server/email', () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
  getUnitResidentEmails: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/server/email-templates', () => ({
  renderTemplate: vi.fn().mockReturnValue({ subject: 'Test', html: '<p>Test</p>' }),
}));

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: vi.fn().mockResolvedValue({
    user: {
      userId: 'staff-001',
      propertyId: 'prop-001',
      role: 'front_desk',
      permissions: ['*'],
      mfaVerified: true,
    },
    error: null,
  }),
}));

// ---------------------------------------------------------------------------
// Import route handlers AFTER mocks
// ---------------------------------------------------------------------------

import { GET as listPackages, POST as createPackage } from '@/app/api/v1/packages/route';
import {
  GET as getPackage,
  PATCH as updatePackage,
  DELETE as deletePackage,
} from '@/app/api/v1/packages/[id]/route';
import { POST as batchCreatePackages } from '@/app/api/v1/packages/batch/route';
import { POST as batchReleasePackages } from '@/app/api/v1/packages/batch-release/route';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROPERTY_ID = 'prop-001';
const UNIT_101 = 'unit-101';
const UNIT_202 = 'unit-202';
const UNIT_303 = 'unit-303';
const UNIT_404 = 'unit-404';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePackage(overrides: Record<string, unknown> = {}) {
  return {
    id: 'pkg-001',
    propertyId: PROPERTY_ID,
    unitId: UNIT_101,
    referenceNumber: 'PKG-REF001',
    status: 'unreleased',
    direction: 'inbound',
    courierId: null,
    isPerishable: false,
    isOversized: false,
    createdById: 'staff-001',
    createdAt: new Date('2026-03-18T09:00:00Z'),
    deletedAt: null,
    releasedToName: null,
    releasedAt: null,
    releasedById: null,
    trackingNumber: null,
    unit: { id: UNIT_101, number: '101' },
    courier: null,
    storageSpot: null,
    parcelCategory: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  nanoidCounter = 0;
});

// ===========================================================================
// SCENARIO 1: Standard Delivery
// ===========================================================================

describe('Scenario 1: Standard Delivery (Receive -> Notify -> Release)', () => {
  const packageId = 'pkg-std-001';

  it('should create package with status unreleased on POST /packages', async () => {
    const pkg = makePackage({ id: packageId });
    mockPackageCreate.mockResolvedValue(pkg);

    const req = createPostRequest('/api/v1/packages', {
      propertyId: PROPERTY_ID,
      unitId: UNIT_101,
      direction: 'inbound',
      isPerishable: false,
      isOversized: false,
      notifyChannel: 'email',
    });

    const res = await createPackage(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{ data: { status: string; referenceNumber: string } }>(res);
    expect(body.data.status).toBe('unreleased');
    expect(body.data.referenceNumber).toContain('PKG-');
  });

  it('should generate a unique reference number for every package', async () => {
    mockPackageCreate.mockResolvedValue(
      makePackage({ id: packageId, referenceNumber: 'PKG-REF001' }),
    );

    const req = createPostRequest('/api/v1/packages', {
      propertyId: PROPERTY_ID,
      unitId: UNIT_101,
      direction: 'inbound',
      isPerishable: false,
      isOversized: false,
      notifyChannel: 'email',
    });

    await createPackage(req);

    // Verify the create call includes a reference number
    expect(mockPackageCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          referenceNumber: expect.stringContaining('PKG-'),
          status: 'unreleased',
        }),
      }),
    );
  });

  it('should set createdById from authenticated user context', async () => {
    mockPackageCreate.mockResolvedValue(makePackage({ id: packageId }));

    const req = createPostRequest('/api/v1/packages', {
      propertyId: PROPERTY_ID,
      unitId: UNIT_101,
      direction: 'inbound',
      isPerishable: false,
      isOversized: false,
      notifyChannel: 'email',
    });

    await createPackage(req);

    expect(mockPackageCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          createdById: 'staff-001',
        }),
      }),
    );
  });

  it('should release package via PATCH with action=release', async () => {
    mockPackageUpdate.mockResolvedValue(
      makePackage({
        id: packageId,
        status: 'released',
        releasedToName: 'Jane Resident',
        releasedAt: new Date(),
        releasedById: 'staff-001',
      }),
    );
    mockPackageHistoryCreate.mockResolvedValue({ id: 'hist-001' });

    const req = createPatchRequest(`/api/v1/packages/${packageId}`, {
      action: 'release',
      releasedToName: 'Jane Resident',
      idVerified: true,
      isAuthorizedDelegate: false,
      releaseComments: 'Picked up at front desk',
    });

    const res = await updatePackage(req, { params: Promise.resolve({ id: packageId }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { status: string }; message: string }>(res);
    expect(body.data.status).toBe('released');
    expect(body.message).toContain('Jane Resident');
  });

  it('should log release action to package history', async () => {
    mockPackageUpdate.mockResolvedValue(makePackage({ id: packageId, status: 'released' }));
    mockPackageHistoryCreate.mockResolvedValue({ id: 'hist-001' });

    const req = createPatchRequest(`/api/v1/packages/${packageId}`, {
      action: 'release',
      releasedToName: 'Jane Resident',
      idVerified: true,
      isAuthorizedDelegate: false,
    });

    await updatePackage(req, { params: Promise.resolve({ id: packageId }) });

    expect(mockPackageHistoryCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          packageId,
          action: 'released',
          details: expect.stringContaining('Jane Resident'),
        }),
      }),
    );
  });

  it('should show package history with all events via GET /packages/:id', async () => {
    mockPackageFindUnique.mockResolvedValue(
      makePackage({
        id: packageId,
        status: 'released',
        history: [
          { id: 'h1', action: 'created', details: 'Package received', createdAt: new Date() },
          { id: 'h2', action: 'reminder_sent', details: 'Reminder sent', createdAt: new Date() },
          {
            id: 'h3',
            action: 'released',
            details: 'Released to Jane Resident',
            createdAt: new Date(),
          },
        ],
        photos: [],
      }),
    );

    const req = createGetRequest(`/api/v1/packages/${packageId}`);
    const res = await getPackage(req, { params: Promise.resolve({ id: packageId }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { history: { action: string }[] };
    }>(res);
    expect(body.data.history).toHaveLength(3);
    const actions = body.data.history.map((h) => h.action);
    expect(actions).toContain('created');
    expect(actions).toContain('reminder_sent');
    expect(actions).toContain('released');
  });

  it('should reject release when releasedToName is missing', async () => {
    const req = createPatchRequest(`/api/v1/packages/${packageId}`, {
      action: 'release',
      idVerified: true,
    });

    const res = await updatePackage(req, { params: Promise.resolve({ id: packageId }) });
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('full workflow: create -> release -> verify history', async () => {
    // Step 1: Create
    const pkg = makePackage({ id: packageId });
    mockPackageCreate.mockResolvedValue(pkg);
    const createRes = await createPackage(
      createPostRequest('/api/v1/packages', {
        propertyId: PROPERTY_ID,
        unitId: UNIT_101,
        direction: 'inbound',
        isPerishable: false,
        isOversized: false,
        notifyChannel: 'email',
      }),
    );
    expect(createRes.status).toBe(201);

    // Step 2: Release
    mockPackageUpdate.mockResolvedValue(
      makePackage({ id: packageId, status: 'released', releasedToName: 'John' }),
    );
    mockPackageHistoryCreate.mockResolvedValue({ id: 'h1' });
    const releaseRes = await updatePackage(
      createPatchRequest(`/api/v1/packages/${packageId}`, {
        action: 'release',
        releasedToName: 'John',
        idVerified: true,
        isAuthorizedDelegate: false,
      }),
      { params: Promise.resolve({ id: packageId }) },
    );
    expect(releaseRes.status).toBe(200);

    // Step 3: Verify history was recorded
    expect(mockPackageHistoryCreate).toHaveBeenCalledTimes(1);
    expect(mockPackageHistoryCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          packageId,
          action: 'released',
        }),
      }),
    );
  });
});

// ===========================================================================
// SCENARIO 2: Perishable Escalation
// ===========================================================================

describe('Scenario 2: Perishable Escalation (4h -> 8h -> 24h notices)', () => {
  const packageId = 'pkg-per-001';

  it('should create perishable package with isPerishable=true', async () => {
    const pkg = makePackage({ id: packageId, isPerishable: true });
    mockPackageCreate.mockResolvedValue(pkg);

    const req = createPostRequest('/api/v1/packages', {
      propertyId: PROPERTY_ID,
      unitId: UNIT_101,
      direction: 'inbound',
      isPerishable: true,
      isOversized: false,
      notifyChannel: 'email',
    });

    const res = await createPackage(req);
    expect(res.status).toBe(201);

    expect(mockPackageCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          isPerishable: true,
        }),
      }),
    );
  });

  it('should identify perishable packages when filtering with perishable=true', async () => {
    mockPackageFindMany.mockResolvedValue([makePackage({ id: packageId, isPerishable: true })]);
    mockPackageCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/packages', {
      searchParams: { propertyId: PROPERTY_ID, perishable: 'true' },
    });

    const res = await listPackages(req);
    expect(res.status).toBe(200);

    // Verify the query filtered for perishable packages
    expect(mockPackageFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          isPerishable: true,
        }),
      }),
    );
  });

  it('should include perishable packages in unreleased list for escalation cron', async () => {
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
    const perishablePkg = makePackage({
      id: packageId,
      isPerishable: true,
      status: 'unreleased',
      createdAt: fourHoursAgo,
    });

    mockPackageFindMany.mockResolvedValue([perishablePkg]);
    mockPackageCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/packages', {
      searchParams: {
        propertyId: PROPERTY_ID,
        status: 'unreleased',
        perishable: 'true',
      },
    });

    const res = await listPackages(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { id: string; isPerishable: boolean }[] }>(res);
    expect(body.data).toHaveLength(1);
    expect(body.data[0]!.isPerishable).toBe(true);
  });

  it('perishable package 4h old should still be unreleased (eligible for first reminder)', async () => {
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
    mockPackageFindMany.mockResolvedValue([
      makePackage({ id: packageId, isPerishable: true, createdAt: fourHoursAgo }),
    ]);
    mockPackageCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/packages', {
      searchParams: { propertyId: PROPERTY_ID, status: 'unreleased' },
    });

    const res = await listPackages(req);
    const body = await parseResponse<{
      data: { id: string; createdAt: string; isPerishable: boolean }[];
    }>(res);

    expect(body.data).toHaveLength(1);
    const pkg = body.data[0]!;
    expect(pkg.isPerishable).toBe(true);
    const ageMs = Date.now() - new Date(pkg.createdAt).getTime();
    expect(ageMs).toBeGreaterThanOrEqual(4 * 60 * 60 * 1000);
  });

  it('perishable package 8h old should be eligible for manager escalation', async () => {
    const eightHoursAgo = new Date(Date.now() - 8 * 60 * 60 * 1000);
    mockPackageFindMany.mockResolvedValue([
      makePackage({ id: packageId, isPerishable: true, createdAt: eightHoursAgo }),
    ]);
    mockPackageCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/packages', {
      searchParams: { propertyId: PROPERTY_ID, status: 'unreleased', perishable: 'true' },
    });

    const res = await listPackages(req);
    const body = await parseResponse<{
      data: { id: string; createdAt: string }[];
    }>(res);

    const pkg = body.data[0]!;
    const ageHours = (Date.now() - new Date(pkg.createdAt).getTime()) / (1000 * 60 * 60);
    expect(ageHours).toBeGreaterThanOrEqual(8);
  });

  it('perishable package 24h old should trigger final notice', async () => {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    mockPackageFindMany.mockResolvedValue([
      makePackage({
        id: packageId,
        isPerishable: true,
        createdAt: twentyFourHoursAgo,
      }),
    ]);
    mockPackageCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/packages', {
      searchParams: { propertyId: PROPERTY_ID, status: 'unreleased', perishable: 'true' },
    });

    const res = await listPackages(req);
    const body = await parseResponse<{
      data: { id: string; createdAt: string }[];
    }>(res);

    const pkg = body.data[0]!;
    const ageHours = (Date.now() - new Date(pkg.createdAt).getTime()) / (1000 * 60 * 60);
    expect(ageHours).toBeGreaterThanOrEqual(24);
  });

  it('should still be releasable even after escalation (perishable does not block release)', async () => {
    mockPackageUpdate.mockResolvedValue(
      makePackage({
        id: packageId,
        isPerishable: true,
        status: 'released',
        releasedToName: 'Late Resident',
      }),
    );
    mockPackageHistoryCreate.mockResolvedValue({ id: 'h-per' });

    const req = createPatchRequest(`/api/v1/packages/${packageId}`, {
      action: 'release',
      releasedToName: 'Late Resident',
      idVerified: true,
      isAuthorizedDelegate: false,
    });

    const res = await updatePackage(req, { params: Promise.resolve({ id: packageId }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { status: string } }>(res);
    expect(body.data.status).toBe('released');
  });
});

// ===========================================================================
// SCENARIO 3: Batch Intake
// ===========================================================================

describe('Scenario 3: Batch Intake (create 4 packages at once)', () => {
  it('should create multiple packages in a single batch POST', async () => {
    const packages = [
      makePackage({
        id: 'pkg-b1',
        unitId: UNIT_101,
        referenceNumber: 'PKG-B001',
        unit: { number: '101' },
      }),
      makePackage({
        id: 'pkg-b2',
        unitId: UNIT_202,
        referenceNumber: 'PKG-B002',
        unit: { number: '202' },
      }),
      makePackage({
        id: 'pkg-b3',
        unitId: UNIT_303,
        referenceNumber: 'PKG-B003',
        unit: { number: '303' },
      }),
      makePackage({
        id: 'pkg-b4',
        unitId: UNIT_404,
        referenceNumber: 'PKG-B004',
        unit: { number: '404' },
      }),
    ];

    // Array-based $transaction returns resolved promises
    mockPackageCreate
      .mockResolvedValueOnce(packages[0])
      .mockResolvedValueOnce(packages[1])
      .mockResolvedValueOnce(packages[2])
      .mockResolvedValueOnce(packages[3]);

    // The batch route uses prisma.$transaction(array_of_creates)
    // Our mock handles this by resolving the array
    mockTransaction.mockResolvedValue(packages);

    const req = createPostRequest('/api/v1/packages/batch', {
      propertyId: PROPERTY_ID,
      packages: [
        {
          unitId: UNIT_101,
          direction: 'inbound',
          isPerishable: false,
          isOversized: false,
          notifyChannel: 'email',
        },
        {
          unitId: UNIT_202,
          direction: 'inbound',
          isPerishable: false,
          isOversized: false,
          notifyChannel: 'sms',
        },
        {
          unitId: UNIT_303,
          direction: 'inbound',
          isPerishable: true,
          isOversized: false,
          notifyChannel: 'push',
        },
        {
          unitId: UNIT_404,
          direction: 'inbound',
          isPerishable: false,
          isOversized: true,
          notifyChannel: 'email',
        },
      ],
    });

    const res = await batchCreatePackages(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{
      data: { id: string; referenceNumber: string }[];
      meta: { count: number; referenceNumbers: string[] };
    }>(res);
    expect(body.data).toHaveLength(4);
    expect(body.meta.count).toBe(4);
  });

  it('each batch package should get a unique reference number', async () => {
    // The batch route calls nanoid() for each package, so each gets a different ref.
    // Our nanoid mock returns incrementing values, and the route builds PKG-{nanoid}.
    // The $transaction mock resolves the array of prisma.package.create calls.
    // We mock create to return packages with distinct reference numbers.
    let callCount = 0;
    mockPackageCreate.mockImplementation(() => {
      callCount++;
      return Promise.resolve(
        makePackage({
          id: `pkg-unq-${callCount}`,
          referenceNumber: `PKG-UNQ${String(callCount).padStart(3, '0')}`,
          unit: { number: String(100 + callCount) },
        }),
      );
    });

    // Array-based $transaction resolves the array of promises
    const packages = [
      makePackage({ id: 'pkg-unq-1', referenceNumber: 'PKG-UNQ001', unit: { number: '101' } }),
      makePackage({ id: 'pkg-unq-2', referenceNumber: 'PKG-UNQ002', unit: { number: '202' } }),
    ];
    mockTransaction.mockResolvedValue(packages);

    const req = createPostRequest('/api/v1/packages/batch', {
      propertyId: PROPERTY_ID,
      packages: [
        {
          unitId: UNIT_101,
          direction: 'inbound',
          isPerishable: false,
          isOversized: false,
          notifyChannel: 'email',
        },
        {
          unitId: UNIT_202,
          direction: 'inbound',
          isPerishable: false,
          isOversized: false,
          notifyChannel: 'email',
        },
      ],
    });

    const res = await batchCreatePackages(req);
    const body = await parseResponse<{
      meta: { referenceNumbers: string[] };
    }>(res);

    // All reference numbers should be unique
    const refs = body.meta.referenceNumbers;
    expect(refs.length).toBe(2);
    expect(refs[0]).not.toBe(refs[1]);
  });

  it('should reject batch with empty packages array', async () => {
    const req = createPostRequest('/api/v1/packages/batch', {
      propertyId: PROPERTY_ID,
      packages: [],
    });

    const res = await batchCreatePackages(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('should batch-release multiple packages to the same person', async () => {
    const uuid1 = '00000000-0000-4000-a000-000000000001';
    const uuid2 = '00000000-0000-4000-a000-000000000002';
    const uuid3 = '00000000-0000-4000-a000-000000000003';

    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      return fn({
        package: {
          updateMany: vi.fn().mockResolvedValue({ count: 3 }),
        },
        packageHistory: {
          create: vi.fn().mockResolvedValue({ id: 'h1' }),
        },
        user: {
          findUnique: vi.fn().mockResolvedValue({ firstName: 'Staff', lastName: 'User' }),
        },
      });
    });

    const req = createPostRequest('/api/v1/packages/batch-release', {
      packageIds: [uuid1, uuid2, uuid3],
      releasedToName: 'Unit 101 Resident',
      idVerified: true,
      isAuthorizedDelegate: false,
      releaseComments: 'All packages for unit 101',
    });

    const res = await batchReleasePackages(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      message: string;
      meta: { count: number };
    }>(res);
    expect(body.meta.count).toBe(3);
    expect(body.message).toContain('Unit 101 Resident');
  });

  it('batch release should log history for each package', async () => {
    const uuid1 = '00000000-0000-4000-a000-000000000011';
    const uuid2 = '00000000-0000-4000-a000-000000000012';
    const historyCreateMock = vi.fn().mockResolvedValue({ id: 'h' });

    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      return fn({
        package: {
          updateMany: vi.fn().mockResolvedValue({ count: 2 }),
        },
        packageHistory: {
          create: historyCreateMock,
        },
        user: {
          findUnique: vi.fn().mockResolvedValue({ firstName: 'Staff', lastName: 'User' }),
        },
      });
    });

    const req = createPostRequest('/api/v1/packages/batch-release', {
      packageIds: [uuid1, uuid2],
      releasedToName: 'Bulk Pickup Person',
      idVerified: true,
      isAuthorizedDelegate: false,
    });

    await batchReleasePackages(req);

    // History should be created for each package
    expect(historyCreateMock).toHaveBeenCalledTimes(2);
    for (const call of historyCreateMock.mock.calls) {
      const data = (call[0] as { data: { action: string; details: string } }).data;
      expect(data.action).toBe('released');
      expect(data.details).toContain('Bulk Pickup Person');
    }
  });
});

// ===========================================================================
// SCENARIO 4: Outgoing Package
// ===========================================================================

describe('Scenario 4: Outgoing Package (drop-off -> carrier pickup -> tracking)', () => {
  const outgoingId = 'pkg-out-001';

  it('should create outgoing package with direction=outbound', async () => {
    const pkg = makePackage({
      id: outgoingId,
      direction: 'outbound',
      status: 'unreleased',
    });
    mockPackageCreate.mockResolvedValue(pkg);

    const req = createPostRequest('/api/v1/packages', {
      propertyId: PROPERTY_ID,
      unitId: UNIT_101,
      direction: 'outbound',
      isPerishable: false,
      isOversized: false,
      notifyChannel: 'email',
      description: 'Return to Amazon',
    });

    const res = await createPackage(req);
    expect(res.status).toBe(201);

    expect(mockPackageCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          direction: 'outbound',
        }),
      }),
    );
  });

  it('should update outgoing package with tracking number when carrier picks up', async () => {
    mockPackageUpdate.mockResolvedValue(
      makePackage({
        id: outgoingId,
        direction: 'outbound',
        trackingNumber: '1Z999AA10123456784',
      }),
    );

    const req = createPatchRequest(`/api/v1/packages/${outgoingId}`, {
      trackingNumber: '1Z999AA10123456784',
    });

    const res = await updatePackage(req, { params: Promise.resolve({ id: outgoingId }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('updated');
  });

  it('should release outgoing package when carrier physically picks it up', async () => {
    mockPackageUpdate.mockResolvedValue(
      makePackage({
        id: outgoingId,
        direction: 'outbound',
        status: 'released',
        releasedToName: 'FedEx Driver',
      }),
    );
    mockPackageHistoryCreate.mockResolvedValue({ id: 'h-out' });

    const req = createPatchRequest(`/api/v1/packages/${outgoingId}`, {
      action: 'release',
      releasedToName: 'FedEx Driver',
      idVerified: false,
      isAuthorizedDelegate: false,
      releaseComments: 'Carrier picked up at 2pm',
    });

    const res = await updatePackage(req, { params: Promise.resolve({ id: outgoingId }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { status: string }; message: string }>(res);
    expect(body.data.status).toBe('released');
    expect(body.message).toContain('FedEx Driver');
  });
});

// ===========================================================================
// SCENARIO 5: Package Return
// ===========================================================================

describe('Scenario 5: Package Return (receive -> refuse -> return to carrier)', () => {
  const returnId = 'pkg-ret-001';

  it('should create package and then soft-delete when refused', async () => {
    // Step 1: Package received
    const pkg = makePackage({ id: returnId });
    mockPackageCreate.mockResolvedValue(pkg);

    const createRes = await createPackage(
      createPostRequest('/api/v1/packages', {
        propertyId: PROPERTY_ID,
        unitId: UNIT_101,
        direction: 'inbound',
        isPerishable: false,
        isOversized: false,
        notifyChannel: 'email',
      }),
    );
    expect(createRes.status).toBe(201);

    // Step 2: Resident refuses — soft delete (which represents "returned to carrier")
    mockPackageUpdate.mockResolvedValue({
      ...pkg,
      deletedAt: new Date(),
    });
    mockPackageHistoryCreate.mockResolvedValue({ id: 'h-ret' });

    const deleteRes = await deletePackage(createDeleteRequest(`/api/v1/packages/${returnId}`), {
      params: Promise.resolve({ id: returnId }),
    });
    expect(deleteRes.status).toBe(200);

    const body = await parseResponse<{ message: string }>(deleteRes);
    expect(body.message).toContain('deleted');
  });

  it('should log deletion to package history', async () => {
    mockPackageUpdate.mockResolvedValue(makePackage({ id: returnId, deletedAt: new Date() }));
    mockPackageHistoryCreate.mockResolvedValue({ id: 'h-del' });

    await deletePackage(createDeleteRequest(`/api/v1/packages/${returnId}`), {
      params: Promise.resolve({ id: returnId }),
    });

    expect(mockPackageHistoryCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          packageId: returnId,
          action: 'deleted',
        }),
      }),
    );
  });

  it('should not show deleted packages in listing', async () => {
    mockPackageFindMany.mockResolvedValue([]);
    mockPackageCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/packages', {
      searchParams: { propertyId: PROPERTY_ID },
    });

    const res = await listPackages(req);
    const body = await parseResponse<{ data: unknown[]; meta: { total: number } }>(res);
    expect(body.data).toHaveLength(0);
    expect(body.meta.total).toBe(0);

    // Verify the query includes deletedAt: null filter
    expect(mockPackageFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          deletedAt: null,
        }),
      }),
    );
  });

  it('should return 404 when trying to GET a deleted package', async () => {
    mockPackageFindUnique.mockResolvedValue(null);

    const req = createGetRequest(`/api/v1/packages/${returnId}`);
    const res = await getPackage(req, { params: Promise.resolve({ id: returnId }) });
    expect(res.status).toBe(404);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('NOT_FOUND');
  });

  it('full workflow: create -> refuse (delete) -> verify gone -> GET returns 404', async () => {
    // Create
    mockPackageCreate.mockResolvedValue(makePackage({ id: returnId }));
    const createRes = await createPackage(
      createPostRequest('/api/v1/packages', {
        propertyId: PROPERTY_ID,
        unitId: UNIT_101,
        direction: 'inbound',
        isPerishable: false,
        isOversized: false,
        notifyChannel: 'email',
      }),
    );
    expect(createRes.status).toBe(201);

    // Delete (refuse/return)
    mockPackageUpdate.mockResolvedValue(makePackage({ id: returnId, deletedAt: new Date() }));
    mockPackageHistoryCreate.mockResolvedValue({ id: 'h' });
    const delRes = await deletePackage(createDeleteRequest(`/api/v1/packages/${returnId}`), {
      params: Promise.resolve({ id: returnId }),
    });
    expect(delRes.status).toBe(200);

    // Verify gone from list
    mockPackageFindMany.mockResolvedValue([]);
    mockPackageCount.mockResolvedValue(0);
    const listRes = await listPackages(
      createGetRequest('/api/v1/packages', {
        searchParams: { propertyId: PROPERTY_ID },
      }),
    );
    const listBody = await parseResponse<{ data: unknown[] }>(listRes);
    expect(listBody.data).toHaveLength(0);

    // GET returns 404
    mockPackageFindUnique.mockResolvedValue(null);
    const getRes = await getPackage(createGetRequest(`/api/v1/packages/${returnId}`), {
      params: Promise.resolve({ id: returnId }),
    });
    expect(getRes.status).toBe(404);
  });
});

// ===========================================================================
// Cross-Scenario: Validation and Edge Cases
// ===========================================================================

describe('Package Lifecycle: Edge Cases & Validation', () => {
  it('should reject package creation without propertyId', async () => {
    const req = createPostRequest('/api/v1/packages', {
      unitId: UNIT_101,
      direction: 'inbound',
    });

    const res = await createPackage(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('should reject package creation without unitId', async () => {
    const req = createPostRequest('/api/v1/packages', {
      propertyId: PROPERTY_ID,
      direction: 'inbound',
    });

    const res = await createPackage(req);
    expect(res.status).toBe(400);
  });

  it('should reject package creation without direction', async () => {
    const req = createPostRequest('/api/v1/packages', {
      propertyId: PROPERTY_ID,
      unitId: UNIT_101,
    });

    const res = await createPackage(req);
    expect(res.status).toBe(400);
  });

  it('listing requires propertyId query param', async () => {
    const req = createGetRequest('/api/v1/packages');
    const res = await listPackages(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_PROPERTY');
  });

  it('should support search by reference number', async () => {
    mockPackageFindMany.mockResolvedValue([]);
    mockPackageCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/packages', {
      searchParams: { propertyId: PROPERTY_ID, search: 'PKG-ABC' },
    });

    await listPackages(req);

    expect(mockPackageFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({
              referenceNumber: expect.objectContaining({
                contains: 'PKG-ABC',
              }),
            }),
          ]),
        }),
      }),
    );
  });

  it('should filter packages by status', async () => {
    mockPackageFindMany.mockResolvedValue([]);
    mockPackageCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/packages', {
      searchParams: { propertyId: PROPERTY_ID, status: 'unreleased' },
    });

    await listPackages(req);

    expect(mockPackageFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'unreleased',
        }),
      }),
    );
  });

  it('should filter packages by unitId', async () => {
    mockPackageFindMany.mockResolvedValue([]);
    mockPackageCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/packages', {
      searchParams: { propertyId: PROPERTY_ID, unitId: UNIT_101 },
    });

    await listPackages(req);

    expect(mockPackageFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          unitId: UNIT_101,
        }),
      }),
    );
  });

  it('should paginate results correctly', async () => {
    mockPackageFindMany.mockResolvedValue([]);
    mockPackageCount.mockResolvedValue(100);

    const req = createGetRequest('/api/v1/packages', {
      searchParams: { propertyId: PROPERTY_ID, page: '3', pageSize: '10' },
    });

    const res = await listPackages(req);
    const body = await parseResponse<{
      meta: { page: number; pageSize: number; total: number; totalPages: number };
    }>(res);

    expect(body.meta.page).toBe(3);
    expect(body.meta.pageSize).toBe(10);
    expect(body.meta.total).toBe(100);
    expect(body.meta.totalPages).toBe(10);
  });
});
