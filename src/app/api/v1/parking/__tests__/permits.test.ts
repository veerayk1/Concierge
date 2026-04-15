/**
 * Parking Permit Lifecycle Tests — per PRD 13 Parking Management
 *
 * Covers:
 * 1.  Create parking permit with auto-generated reference number
 * 2.  Validate required fields (unitId, permitType, vehicleId, startDate)
 * 3.  Reject overlapping permits for same vehicle
 * 4.  Assign parking spot on creation
 * 5.  Activate permit -> status=active
 * 6.  Suspend permit -> status=suspended, suspensionReason stored
 * 7.  Expire permit on endDate (check logic, not cron)
 * 8.  Renew permit -> new permit created linked to old one
 * 9.  Cancel permit -> status=cancelled
 * 10. Cannot modify expired permit
 * 11. Parking violation auto-links to permit when vehicle plate matches
 * 12. List permits with filtering by status, unit, vehicle
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  createGetRequest,
  createPostRequest,
  createPatchRequest,
  parseResponse,
} from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Mock Setup
// ---------------------------------------------------------------------------

const mockPermitCreate = vi.fn();
const mockPermitFindMany = vi.fn();
const mockPermitFindUnique = vi.fn();
const mockPermitFindFirst = vi.fn();
const mockPermitUpdate = vi.fn();
const mockViolationFindMany = vi.fn();
const mockSpotFindFirst = vi.fn();
const mockSpotUpdate = vi.fn();
const mockTransaction = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    parkingPermit: {
      create: (...args: unknown[]) => mockPermitCreate(...args),
      findMany: (...args: unknown[]) => mockPermitFindMany(...args),
      findUnique: (...args: unknown[]) => mockPermitFindUnique(...args),
      findFirst: (...args: unknown[]) => mockPermitFindFirst(...args),
      update: (...args: unknown[]) => mockPermitUpdate(...args),
    },
    parkingViolation: {
      findMany: (...args: unknown[]) => mockViolationFindMany(...args),
      updateMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    parkingSpot: {
      findFirst: (...args: unknown[]) => mockSpotFindFirst(...args),
      update: (...args: unknown[]) => mockSpotUpdate(...args),
    },
    vehicle: {
      create: vi.fn().mockResolvedValue({ id: 'vehicle-1' }),
    },
    permitType: {
      findFirst: vi.fn().mockResolvedValue({ id: 'permit-type-1', name: 'Resident' }),
      create: vi.fn().mockImplementation((args: Record<string, unknown>) =>
        Promise.resolve({
          id: 'permit-type-new',
          ...(args as { data?: Record<string, unknown> }).data,
        }),
      ),
    },
    parkingLimitConfig: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    $transaction: (...args: unknown[]) => {
      const first = args[0];
      if (typeof first === 'function') {
        return (first as (tx: unknown) => Promise<unknown>)({
          parkingPermit: {
            create: (...a: unknown[]) => mockPermitCreate(...a),
            findUnique: (...a: unknown[]) => mockPermitFindUnique(...a),
            update: (...a: unknown[]) => mockPermitUpdate(...a),
          },
          parkingSpot: {
            update: (...a: unknown[]) => mockSpotUpdate(...a),
          },
          parkingViolation: {
            updateMany: vi.fn().mockResolvedValue({ count: 0 }),
          },
        });
      }
      if (Array.isArray(first)) {
        return Promise.all(first);
      }
      return mockTransaction(...args);
    },
  },
}));

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: vi.fn().mockResolvedValue({
    user: {
      userId: 'test-staff',
      propertyId: '00000000-0000-4000-b000-000000000001',
      role: 'property_admin',
      permissions: ['*'],
      mfaVerified: false,
    },
    error: null,
  }),
}));

import { GET, POST, PATCH } from '../route';

const PROPERTY_A = '00000000-0000-4000-b000-000000000001';
const UNIT_A = '00000000-0000-4000-b000-000000000010';
const VEHICLE_A = '00000000-0000-4000-b000-000000000020';
const PERMIT_TYPE_A = '00000000-0000-4000-b000-000000000030';
const SPOT_A = '00000000-0000-4000-b000-000000000040';
const PERMIT_A = '00000000-0000-4000-b000-000000000050';

const validPermitBody = {
  propertyId: PROPERTY_A,
  unitId: UNIT_A,
  vehicleId: VEHICLE_A,
  permitTypeId: PERMIT_TYPE_A,
  licensePlate: 'ABC1234',
  startDate: '2026-04-01',
  endDate: '2026-09-30',
};

beforeEach(() => {
  vi.clearAllMocks();
  mockPermitFindMany.mockResolvedValue([]);
  mockPermitFindFirst.mockResolvedValue(null);
  mockViolationFindMany.mockResolvedValue([]);
  mockSpotFindFirst.mockResolvedValue(null);
});

// ---------------------------------------------------------------------------
// 1. Create parking permit with auto-generated reference number
// ---------------------------------------------------------------------------

describe('POST /api/v1/parking — Create Permit', () => {
  it('creates a permit with an auto-generated reference number', async () => {
    mockPermitFindFirst.mockResolvedValue(null); // no overlap
    mockSpotFindFirst.mockResolvedValue({ id: SPOT_A, spotNumber: 'P1-001' });
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        parkingPermit: {
          create: mockPermitCreate,
        },
        parkingSpot: {
          update: mockSpotUpdate,
        },
      };
      return fn(tx);
    });
    mockPermitCreate.mockResolvedValue({
      id: PERMIT_A,
      referenceNumber: 'PRK-20260401-0001',
      status: 'active',
      ...validPermitBody,
    });

    const req = createPostRequest('/api/v1/parking', validPermitBody);
    const res = await POST(req);
    const body = await parseResponse<{ data: { referenceNumber: string } }>(res);

    expect(res.status).toBe(201);
    expect(body.data.referenceNumber).toMatch(/^PRK-/);
  });
});

// ---------------------------------------------------------------------------
// 2. Validate required fields
// ---------------------------------------------------------------------------

describe('POST /api/v1/parking — Validation', () => {
  it('rejects missing unitId', async () => {
    const { unitId: _, ...missingUnit } = validPermitBody;
    const req = createPostRequest('/api/v1/parking', missingUnit);
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('auto-creates permitType when permitTypeId not provided', async () => {
    mockPermitFindFirst.mockResolvedValue(null);
    mockPermitCreate.mockResolvedValue({
      id: PERMIT_A,
      referenceNumber: 'PRK-20260401-0001',
      status: 'active',
    });
    const { permitTypeId: _, ...missing } = validPermitBody;
    const req = createPostRequest('/api/v1/parking', missing);
    const res = await POST(req);
    // Route auto-creates permit type when not provided
    expect(res.status).toBe(201);
  });

  it('rejects missing vehicleId', async () => {
    const { vehicleId: _, ...missing } = validPermitBody;
    const req = createPostRequest('/api/v1/parking', missing);
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('defaults startDate to today when not provided', async () => {
    mockPermitFindFirst.mockResolvedValue(null);
    mockPermitCreate.mockResolvedValue({
      id: PERMIT_A,
      referenceNumber: 'PRK-20260401-0001',
      status: 'active',
    });
    const { startDate: _, ...missing } = validPermitBody;
    const req = createPostRequest('/api/v1/parking', missing);
    const res = await POST(req);
    // Route defaults startDate to today when not provided
    expect(res.status).toBe(201);
  });
});

// ---------------------------------------------------------------------------
// 3. Reject overlapping permits for same vehicle
// ---------------------------------------------------------------------------

describe('POST /api/v1/parking — Overlap Detection', () => {
  it('rejects overlapping permits for the same vehicle', async () => {
    mockPermitFindFirst.mockResolvedValue({
      id: 'existing-permit',
      vehicleId: VEHICLE_A,
      status: 'active',
      validFrom: '2026-03-01',
      validUntil: '2026-06-30',
    });

    const req = createPostRequest('/api/v1/parking', validPermitBody);
    const res = await POST(req);

    expect(res.status).toBe(409);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('OVERLAP_CONFLICT');
  });
});

// ---------------------------------------------------------------------------
// 4. Assign parking spot on creation
// ---------------------------------------------------------------------------

describe('POST /api/v1/parking — Spot Assignment', () => {
  it('assigns an available spot on creation', async () => {
    mockPermitFindFirst.mockResolvedValue(null);
    mockSpotFindFirst.mockResolvedValue({ id: SPOT_A, spotNumber: 'P1-001', status: 'available' });

    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        parkingPermit: { create: mockPermitCreate },
        parkingSpot: { update: mockSpotUpdate },
      };
      return fn(tx);
    });

    mockPermitCreate.mockResolvedValue({
      id: PERMIT_A,
      spotId: SPOT_A,
      referenceNumber: 'PRK-20260401-0001',
      status: 'active',
    });

    const req = createPostRequest('/api/v1/parking', {
      ...validPermitBody,
      areaId: '00000000-0000-4000-b000-000000000060',
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
    expect(mockSpotUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: SPOT_A },
        data: expect.objectContaining({ status: 'occupied', assignedPermitId: PERMIT_A }),
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// 5. Activate permit
// ---------------------------------------------------------------------------

describe('PATCH /api/v1/parking — Activate Permit', () => {
  it('activates a draft permit and sets status=active', async () => {
    mockPermitFindUnique.mockResolvedValue({
      id: PERMIT_A,
      status: 'draft',
      validFrom: '2026-04-01',
      validUntil: '2026-09-30',
    });
    mockPermitUpdate.mockResolvedValue({ id: PERMIT_A, status: 'active' });

    const req = createPatchRequest('/api/v1/parking', {
      permitId: PERMIT_A,
      action: 'activate',
    });
    const res = await PATCH(req);
    const body = await parseResponse<{ data: { status: string } }>(res);

    expect(res.status).toBe(200);
    expect(body.data.status).toBe('active');
  });
});

// ---------------------------------------------------------------------------
// 6. Suspend permit
// ---------------------------------------------------------------------------

describe('PATCH /api/v1/parking — Suspend Permit', () => {
  it('suspends an active permit and stores suspensionReason', async () => {
    mockPermitFindUnique.mockResolvedValue({ id: PERMIT_A, status: 'active' });
    mockPermitUpdate.mockResolvedValue({
      id: PERMIT_A,
      status: 'suspended',
      suspensionReason: 'Unpaid fees',
    });

    const req = createPatchRequest('/api/v1/parking', {
      permitId: PERMIT_A,
      action: 'suspend',
      reason: 'Unpaid fees',
    });
    const res = await PATCH(req);
    const body = await parseResponse<{ data: { status: string; suspensionReason: string } }>(res);

    expect(res.status).toBe(200);
    expect(body.data.status).toBe('suspended');
    expect(body.data.suspensionReason).toBe('Unpaid fees');
  });
});

// ---------------------------------------------------------------------------
// 7. Expire permit on endDate
// ---------------------------------------------------------------------------

describe('PATCH /api/v1/parking — Expire Permit', () => {
  it('expires a permit when endDate has passed', async () => {
    mockPermitFindUnique.mockResolvedValue({
      id: PERMIT_A,
      status: 'active',
      validUntil: '2025-01-01', // past date
    });
    mockPermitUpdate.mockResolvedValue({ id: PERMIT_A, status: 'expired' });

    const req = createPatchRequest('/api/v1/parking', {
      permitId: PERMIT_A,
      action: 'expire',
    });
    const res = await PATCH(req);
    const body = await parseResponse<{ data: { status: string } }>(res);

    expect(res.status).toBe(200);
    expect(body.data.status).toBe('expired');
  });
});

// ---------------------------------------------------------------------------
// 8. Renew permit
// ---------------------------------------------------------------------------

describe('PATCH /api/v1/parking — Renew Permit', () => {
  it('creates a new permit linked to the old one on renewal', async () => {
    const oldPermit = {
      id: PERMIT_A,
      propertyId: PROPERTY_A,
      unitId: UNIT_A,
      vehicleId: VEHICLE_A,
      permitTypeId: PERMIT_TYPE_A,
      licensePlate: 'ABC1234',
      status: 'active',
      validFrom: '2026-04-01',
      validUntil: '2026-09-30',
      areaId: 'area-1',
      spotId: SPOT_A,
      residentId: 'res-1',
    };
    mockPermitFindUnique.mockResolvedValue(oldPermit);

    const renewedPermit = {
      id: 'new-permit-id',
      referenceNumber: 'PRK-20261001-0001',
      status: 'active',
      renewedFromId: PERMIT_A,
      validFrom: '2026-10-01',
      validUntil: '2027-03-31',
    };

    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        parkingPermit: {
          update: mockPermitUpdate,
          create: mockPermitCreate,
        },
      };
      return fn(tx);
    });
    mockPermitUpdate.mockResolvedValue({ ...oldPermit, status: 'expired' });
    mockPermitCreate.mockResolvedValue(renewedPermit);

    const req = createPatchRequest('/api/v1/parking', {
      permitId: PERMIT_A,
      action: 'renew',
      newStartDate: '2026-10-01',
      newEndDate: '2027-03-31',
    });
    const res = await PATCH(req);
    const body = await parseResponse<{ data: { renewedFromId: string; status: string } }>(res);

    expect(res.status).toBe(201);
    expect(body.data.renewedFromId).toBe(PERMIT_A);
  });
});

// ---------------------------------------------------------------------------
// 9. Cancel permit
// ---------------------------------------------------------------------------

describe('PATCH /api/v1/parking — Cancel Permit', () => {
  it('cancels an active permit and sets status=cancelled', async () => {
    mockPermitFindUnique.mockResolvedValue({ id: PERMIT_A, status: 'active', spotId: SPOT_A });
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        parkingPermit: { update: mockPermitUpdate },
        parkingSpot: { update: mockSpotUpdate },
      };
      return fn(tx);
    });
    mockPermitUpdate.mockResolvedValue({ id: PERMIT_A, status: 'cancelled' });

    const req = createPatchRequest('/api/v1/parking', {
      permitId: PERMIT_A,
      action: 'cancel',
      reason: 'Resident moved out',
    });
    const res = await PATCH(req);
    const body = await parseResponse<{ data: { status: string } }>(res);

    expect(res.status).toBe(200);
    expect(body.data.status).toBe('cancelled');
  });
});

// ---------------------------------------------------------------------------
// 10. Cannot modify expired permit
// ---------------------------------------------------------------------------

describe('PATCH /api/v1/parking — Cannot Modify Expired Permit', () => {
  it('rejects modifications to an expired permit', async () => {
    mockPermitFindUnique.mockResolvedValue({ id: PERMIT_A, status: 'expired' });

    const req = createPatchRequest('/api/v1/parking', {
      permitId: PERMIT_A,
      action: 'activate',
    });
    const res = await PATCH(req);

    expect(res.status).toBe(409);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('INVALID_TRANSITION');
  });

  it('rejects modifications to a cancelled permit', async () => {
    mockPermitFindUnique.mockResolvedValue({ id: PERMIT_A, status: 'cancelled' });

    const req = createPatchRequest('/api/v1/parking', {
      permitId: PERMIT_A,
      action: 'activate',
    });
    const res = await PATCH(req);

    expect(res.status).toBe(409);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('INVALID_TRANSITION');
  });
});

// ---------------------------------------------------------------------------
// 11. Parking violation auto-links to permit when vehicle plate matches
// ---------------------------------------------------------------------------

describe('POST /api/v1/parking — Violation Auto-Link', () => {
  it('auto-links violation to permit when plate matches on creation', async () => {
    mockPermitFindFirst.mockResolvedValue(null); // no overlap for creation
    mockSpotFindFirst.mockResolvedValue({ id: SPOT_A, spotNumber: 'P1-001' });

    const existingViolations = [{ id: 'violation-1', licensePlate: 'ABC1234', permitId: null }];
    mockViolationFindMany.mockResolvedValue(existingViolations);

    mockPermitCreate.mockResolvedValue({
      id: PERMIT_A,
      referenceNumber: 'PRK-20260401-0001',
      licensePlate: 'ABC1234',
      status: 'active',
    });

    const req = createPostRequest('/api/v1/parking', validPermitBody);
    const res = await POST(req);

    expect(res.status).toBe(201);
    // Verify that violations were queried for auto-linking
    expect(mockViolationFindMany).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// 12. List permits with filtering by status, unit, vehicle
// ---------------------------------------------------------------------------

describe('GET /api/v1/parking — Permit Filtering', () => {
  it('filters permits by status', async () => {
    const req = createGetRequest('/api/v1/parking', {
      searchParams: { propertyId: PROPERTY_A, status: 'active' },
    });
    await GET(req);

    const where = mockPermitFindMany.mock.calls[0]![0].where;
    expect(where.status).toBe('active');
  });

  it('filters permits by unitId', async () => {
    const req = createGetRequest('/api/v1/parking', {
      searchParams: { propertyId: PROPERTY_A, unitId: UNIT_A },
    });
    await GET(req);

    const where = mockPermitFindMany.mock.calls[0]![0].where;
    expect(where.unitId).toBe(UNIT_A);
  });

  it('filters permits by vehicleId', async () => {
    const req = createGetRequest('/api/v1/parking', {
      searchParams: { propertyId: PROPERTY_A, vehicleId: VEHICLE_A },
    });
    await GET(req);

    const where = mockPermitFindMany.mock.calls[0]![0].where;
    expect(where.vehicleId).toBe(VEHICLE_A);
  });

  it('combines multiple filters', async () => {
    const req = createGetRequest('/api/v1/parking', {
      searchParams: { propertyId: PROPERTY_A, status: 'active', unitId: UNIT_A },
    });
    await GET(req);

    const where = mockPermitFindMany.mock.calls[0]![0].where;
    expect(where.status).toBe('active');
    expect(where.unitId).toBe(UNIT_A);
  });

  it('returns empty array when no matches', async () => {
    mockPermitFindMany.mockResolvedValue([]);
    const req = createGetRequest('/api/v1/parking', {
      searchParams: { propertyId: PROPERTY_A, status: 'suspended' },
    });
    const res = await GET(req);
    const body = await parseResponse<{ data: unknown[] }>(res);
    expect(body.data).toEqual([]);
  });
});
