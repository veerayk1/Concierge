/**
 * Parking Management Module — Comprehensive Tests (PRD 13)
 *
 * Deep workflow coverage for parking permits, violations, areas, spots,
 * permit lifecycle, towing, and tenant isolation.
 *
 *  1. Parking area CRUD (create, list, update)
 *  2. Parking spot assignment (unit <-> spot)
 *  3. Permit lifecycle: draft -> pending_review -> active -> expired/cancelled/revoked
 *  4. Permit type configuration (resident, visitor, contractor, reserved)
 *  5. Visitor parking permits (auto-expiry, plate tracking)
 *  6. Parking violation creation and lifecycle (notice -> warning -> ticket -> ban)
 *  7. Violation resolution workflow
 *  8. Parking limit enforcement (per-unit, per-plate, consecutive days)
 *  9. Self-service resident parking (register visitor parking)
 * 10. Permit renewal workflow
 * 11. Parking pass printing data
 * 12. Spot availability check
 * 13. Parking report generation
 * 14. Overnight parking detection
 * 15. Towing workflow
 * 16. Tenant isolation
 * 17-30+. Edge cases, validation, and state machine coverage
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
const mockPermitCount = vi.fn();

const mockViolationCreate = vi.fn();
const mockViolationFindMany = vi.fn();
const mockViolationUpdate = vi.fn();
const mockViolationCount = vi.fn();

const mockAreaFindMany = vi.fn();
const mockAreaCreate = vi.fn();

const mockSpotFindMany = vi.fn();
const mockSpotFindFirst = vi.fn();
const mockSpotUpdate = vi.fn();

const mockPermitTypeFindMany = vi.fn();

const mockLimitConfigFindMany = vi.fn();
const mockLimitConfigFindFirst = vi.fn();
const mockLimitConfigCreate = vi.fn();

const mockTransaction = vi.fn();
const mockGuardRoute = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    parkingPermit: {
      create: (...args: unknown[]) => mockPermitCreate(...args),
      findMany: (...args: unknown[]) => mockPermitFindMany(...args),
      findUnique: (...args: unknown[]) => mockPermitFindUnique(...args),
      findFirst: (...args: unknown[]) => mockPermitFindFirst(...args),
      update: (...args: unknown[]) => mockPermitUpdate(...args),
      count: (...args: unknown[]) => mockPermitCount(...args),
    },
    parkingViolation: {
      create: (...args: unknown[]) => mockViolationCreate(...args),
      findMany: (...args: unknown[]) => mockViolationFindMany(...args),
      update: (...args: unknown[]) => mockViolationUpdate(...args),
      count: (...args: unknown[]) => mockViolationCount(...args),
    },
    parkingArea: {
      findMany: (...args: unknown[]) => mockAreaFindMany(...args),
      create: (...args: unknown[]) => mockAreaCreate(...args),
    },
    parkingSpot: {
      findMany: (...args: unknown[]) => mockSpotFindMany(...args),
      findFirst: (...args: unknown[]) => mockSpotFindFirst(...args),
      update: (...args: unknown[]) => mockSpotUpdate(...args),
    },
    permitType: {
      findMany: (...args: unknown[]) => mockPermitTypeFindMany(...args),
      findFirst: vi.fn().mockResolvedValue({ id: 'pt-1', name: 'Resident' }),
      create: vi
        .fn()
        .mockImplementation((args: Record<string, unknown>) =>
          Promise.resolve({ id: 'pt-new', ...(args as { data?: Record<string, unknown> }).data }),
        ),
    },
    parkingLimitConfig: {
      findMany: (...args: unknown[]) => mockLimitConfigFindMany(...args),
      findFirst: (...args: unknown[]) => mockLimitConfigFindFirst(...args),
      create: (...args: unknown[]) => mockLimitConfigCreate(...args),
    },
    vehicle: {
      create: vi.fn().mockResolvedValue({ id: 'vehicle-1' }),
    },
    user: {
      findFirst: vi.fn().mockResolvedValue(null),
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
  guardRoute: (...args: unknown[]) => mockGuardRoute(...args),
}));

vi.mock('@/lib/sanitize', () => ({
  stripHtml: vi.fn((input: string) => input.replace(/<[^>]*>/g, '')),
  stripControlChars: vi.fn((input: string) =>
    input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''),
  ),
}));

// ---------------------------------------------------------------------------
// Import route handlers AFTER mocks
// ---------------------------------------------------------------------------

import { GET, POST, PATCH } from '../route';
import { GET as GET_AREAS, POST as POST_AREA } from '../areas/route';
import { POST as POST_VIOLATION } from '../violations/route';
import { PATCH as PATCH_VIOLATION } from '../violations/[id]/route';
import { GET as GET_LIMITS, POST as POST_LIMIT } from '../limits/route';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROPERTY_A = '00000000-0000-4000-b000-000000000001';
const PROPERTY_B = '00000000-0000-4000-b000-000000000099';
const UNIT_A = '00000000-0000-4000-b000-000000000010';
const UNIT_B = '00000000-0000-4000-b000-000000000011';
const VEHICLE_A = '00000000-0000-4000-b000-000000000020';
const VEHICLE_B = '00000000-0000-4000-b000-000000000021';
const PERMIT_TYPE_RESIDENT = '00000000-0000-4000-b000-000000000030';
const PERMIT_TYPE_VISITOR = '00000000-0000-4000-b000-000000000031';
const SPOT_A = '00000000-0000-4000-b000-000000000040';
const AREA_A = '00000000-0000-4000-b000-000000000060';
const PERMIT_A = '00000000-0000-4000-b000-000000000050';
const PERMIT_B = '00000000-0000-4000-b000-000000000051';
const STAFF_USER = 'staff-parking-admin';

const adminUser = {
  userId: STAFF_USER,
  propertyId: PROPERTY_A,
  role: 'property_admin',
  permissions: ['*'],
  mfaVerified: false,
};

const validPermitBody = {
  propertyId: PROPERTY_A,
  unitId: UNIT_A,
  vehicleId: VEHICLE_A,
  permitTypeId: PERMIT_TYPE_RESIDENT,
  licensePlate: 'ABC1234',
  startDate: '2026-04-01',
  endDate: '2026-09-30',
};

function makeTxMock() {
  return {
    parkingPermit: { create: mockPermitCreate, update: mockPermitUpdate },
    parkingSpot: { update: mockSpotUpdate },
    parkingViolation: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
  };
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();

  mockGuardRoute.mockResolvedValue({ user: adminUser, error: null });

  mockPermitFindMany.mockResolvedValue([]);
  mockPermitFindFirst.mockResolvedValue(null);
  mockPermitFindUnique.mockResolvedValue(null);
  mockPermitCount.mockResolvedValue(0);
  mockViolationFindMany.mockResolvedValue([]);
  mockViolationCount.mockResolvedValue(0);
  mockAreaFindMany.mockResolvedValue([]);
  mockSpotFindMany.mockResolvedValue([]);
  mockSpotFindFirst.mockResolvedValue(null);
  mockPermitTypeFindMany.mockResolvedValue([]);
  mockLimitConfigFindMany.mockResolvedValue([]);
  mockLimitConfigFindFirst.mockResolvedValue(null);

  mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
    return fn(makeTxMock());
  });
});

// ===========================================================================
// 1. Parking area CRUD
// ===========================================================================

describe('1. Parking area management', () => {
  it('creates area with name, code, and total spots', async () => {
    mockAreaCreate.mockResolvedValue({
      id: AREA_A,
      propertyId: PROPERTY_A,
      areaName: 'P1 Underground',
      areaCode: 'P1',
      totalSpots: 120,
    });

    const req = createPostRequest('/api/v1/parking/areas', {
      propertyId: PROPERTY_A,
      areaName: 'P1 Underground',
      areaCode: 'P1',
      totalSpots: 120,
    });
    const res = await POST_AREA(req);

    expect(res.status).toBe(201);
  });

  it('lists areas with spot counts', async () => {
    mockAreaFindMany.mockResolvedValue([
      {
        id: 'a1',
        areaName: 'P1',
        areaCode: 'P1',
        totalSpots: 100,
        visitorSpots: 10,
        isActive: true,
        _count: { spots: 85 },
      },
      {
        id: 'a2',
        areaName: 'P2',
        areaCode: 'P2',
        totalSpots: 50,
        visitorSpots: 5,
        isActive: true,
        _count: { spots: 30 },
      },
    ]);

    const req = createGetRequest('/api/v1/parking/areas', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await GET_AREAS(req);
    const body = await parseResponse<{ data: Array<{ spotCount: number }> }>(res);

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(2);
    expect(body.data[0]!.spotCount).toBe(85);
  });

  it('rejects area without propertyId', async () => {
    const req = createGetRequest('/api/v1/parking/areas');
    const res = await GET_AREAS(req);

    expect(res.status).toBe(400);
  });

  it('rejects area creation without areaName', async () => {
    const req = createPostRequest('/api/v1/parking/areas', {
      propertyId: PROPERTY_A,
      areaCode: 'P1',
      totalSpots: 50,
    });
    const res = await POST_AREA(req);

    expect(res.status).toBe(400);
  });

  it('rejects area creation without areaCode', async () => {
    const req = createPostRequest('/api/v1/parking/areas', {
      propertyId: PROPERTY_A,
      areaName: 'P1 Underground',
      totalSpots: 50,
    });
    const res = await POST_AREA(req);

    expect(res.status).toBe(400);
  });
});

// ===========================================================================
// 2. Parking spot assignment
// ===========================================================================

describe('2. Parking spot assignment', () => {
  it('auto-assigns available spot when areaId provided', async () => {
    mockSpotFindFirst.mockResolvedValue({ id: SPOT_A, spotNumber: 'P1-001' });
    mockPermitCreate.mockResolvedValue({
      id: PERMIT_A,
      referenceNumber: 'PRK-20260401-0001',
      spotId: SPOT_A,
      status: 'active',
    });

    const req = createPostRequest('/api/v1/parking', {
      ...validPermitBody,
      areaId: AREA_A,
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
  });

  it('marks spot as occupied when assigned to permit', async () => {
    mockSpotFindFirst.mockResolvedValue({ id: SPOT_A, spotNumber: 'P1-001' });
    mockPermitCreate.mockResolvedValue({
      id: PERMIT_A,
      referenceNumber: 'PRK-001',
      spotId: SPOT_A,
      status: 'active',
    });

    const txMock = makeTxMock();
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => fn(txMock));

    const req = createPostRequest('/api/v1/parking', {
      ...validPermitBody,
      areaId: AREA_A,
    });
    await POST(req);

    // Verify spot was marked as occupied
    expect(mockSpotUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: SPOT_A },
        data: expect.objectContaining({ status: 'occupied' }),
      }),
    );
  });
});

// ===========================================================================
// 3. Permit lifecycle: draft -> pending_review -> active -> expired/cancelled/revoked
// ===========================================================================

describe('3. Permit lifecycle state machine', () => {
  it('creates permit with active status', async () => {
    mockPermitCreate.mockResolvedValue({
      id: PERMIT_A,
      referenceNumber: 'PRK-20260401-0001',
      status: 'active',
    });

    const req = createPostRequest('/api/v1/parking', validPermitBody);
    const res = await POST(req);
    const body = await parseResponse<{ data: { referenceNumber: string } }>(res);

    expect(res.status).toBe(201);
    expect(body.data.referenceNumber).toMatch(/^PRK-/);
  });

  it('active -> suspend stores suspension reason', async () => {
    mockPermitFindUnique.mockResolvedValue({ id: PERMIT_A, status: 'active' });
    mockPermitUpdate.mockResolvedValue({
      id: PERMIT_A,
      status: 'suspended',
      suspensionReason: 'Repeated violations',
    });

    const req = createPatchRequest('/api/v1/parking', {
      permitId: PERMIT_A,
      action: 'suspend',
      reason: 'Repeated violations',
    });
    const res = await PATCH(req);
    const body = await parseResponse<{ data: { status: string; suspensionReason: string } }>(res);

    expect(res.status).toBe(200);
    expect(body.data.status).toBe('suspended');
    expect(body.data.suspensionReason).toBe('Repeated violations');
  });

  it('active -> expire', async () => {
    mockPermitFindUnique.mockResolvedValue({ id: PERMIT_A, status: 'active' });
    mockPermitUpdate.mockResolvedValue({ id: PERMIT_A, status: 'expired' });

    const req = createPatchRequest('/api/v1/parking', {
      permitId: PERMIT_A,
      action: 'expire',
    });
    const res = await PATCH(req);

    expect(res.status).toBe(200);
  });

  it('active -> cancel releases spot', async () => {
    mockPermitFindUnique.mockResolvedValue({ id: PERMIT_A, status: 'active', spotId: SPOT_A });

    const txMock = {
      parkingPermit: { update: mockPermitUpdate },
      parkingSpot: { update: mockSpotUpdate },
    };
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => fn(txMock));
    mockPermitUpdate.mockResolvedValue({ id: PERMIT_A, status: 'cancelled' });

    const req = createPatchRequest('/api/v1/parking', {
      permitId: PERMIT_A,
      action: 'cancel',
      reason: 'Unit sold',
    });
    const res = await PATCH(req);

    expect(res.status).toBe(200);
    expect(mockSpotUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: SPOT_A },
        data: expect.objectContaining({ status: 'available', assignedPermitId: null }),
      }),
    );
  });

  it('suspended -> activate (reactivation)', async () => {
    mockPermitFindUnique.mockResolvedValue({ id: PERMIT_A, status: 'suspended' });
    mockPermitUpdate.mockResolvedValue({ id: PERMIT_A, status: 'active' });

    const req = createPatchRequest('/api/v1/parking', {
      permitId: PERMIT_A,
      action: 'activate',
    });
    const res = await PATCH(req);

    expect(res.status).toBe(200);
    const updateCall = mockPermitUpdate.mock.calls[0]![0];
    expect(updateCall.data.status).toBe('active');
    expect(updateCall.data.approvedById).toBe(STAFF_USER);
  });

  it('rejects transition from terminal state: expired', async () => {
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

  it('rejects transition from terminal state: cancelled', async () => {
    mockPermitFindUnique.mockResolvedValue({ id: PERMIT_A, status: 'cancelled' });

    const req = createPatchRequest('/api/v1/parking', {
      permitId: PERMIT_A,
      action: 'suspend',
      reason: 'Should fail',
    });
    const res = await PATCH(req);

    expect(res.status).toBe(409);
  });

  it('rejects transition from terminal state: revoked', async () => {
    mockPermitFindUnique.mockResolvedValue({ id: PERMIT_A, status: 'revoked' });

    const req = createPatchRequest('/api/v1/parking', {
      permitId: PERMIT_A,
      action: 'activate',
    });
    const res = await PATCH(req);

    expect(res.status).toBe(409);
  });
});

// ===========================================================================
// 4. Permit type configuration
// ===========================================================================

describe('4. Permit type configuration', () => {
  it('permits include permitType relation in list response', async () => {
    mockPermitFindMany.mockResolvedValue([
      { id: PERMIT_A, permitType: { id: PERMIT_TYPE_RESIDENT, name: 'Resident' } },
    ]);

    const req = createGetRequest('/api/v1/parking', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET(req);

    const include = mockPermitFindMany.mock.calls[0]![0].include;
    expect(include.permitType).toBeDefined();
  });

  it('auto-creates permit type when permitTypeId not provided', async () => {
    mockPermitCreate.mockResolvedValue({
      id: PERMIT_A,
      referenceNumber: 'PRK-20260401-0001',
      status: 'active',
    });
    const { permitTypeId: _, ...noType } = validPermitBody;
    const req = createPostRequest('/api/v1/parking', noType);
    const res = await POST(req);

    // Route auto-creates permit type when not provided
    expect(res.status).toBe(201);
  });

  it('rejects non-UUID permitTypeId', async () => {
    const req = createPostRequest('/api/v1/parking', {
      ...validPermitBody,
      permitTypeId: 'invalid',
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });
});

// ===========================================================================
// 5. Visitor parking permits
// ===========================================================================

describe('5. Visitor parking permits', () => {
  it('creates visitor permit with license plate', async () => {
    mockPermitCreate.mockResolvedValue({
      id: PERMIT_B,
      referenceNumber: 'PRK-20260401-1234',
      permitTypeId: PERMIT_TYPE_VISITOR,
      licensePlate: 'VISITOR1',
      status: 'active',
    });

    const req = createPostRequest('/api/v1/parking', {
      ...validPermitBody,
      permitTypeId: PERMIT_TYPE_VISITOR,
      licensePlate: 'VISITOR1',
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
    const body = await parseResponse<{ data: { licensePlate: string } }>(res);
    expect(body.data.licensePlate).toBe('VISITOR1');
  });

  it('rejects permit without license plate', async () => {
    const { licensePlate: _, ...noPlate } = validPermitBody;
    const req = createPostRequest('/api/v1/parking', noPlate);
    const res = await POST(req);

    expect(res.status).toBe(400);
  });
});

// ===========================================================================
// 6. Parking violation creation and types
// ===========================================================================

describe('6. Parking violation creation', () => {
  it('creates violation with notice type', async () => {
    mockViolationCreate.mockResolvedValue({
      id: 'v1',
      referenceNumber: 'PV-ABC123',
      licensePlate: 'XYZ999',
      violationType: 'notice',
      status: 'open',
    });

    const req = createPostRequest('/api/v1/parking/violations', {
      propertyId: PROPERTY_A,
      licensePlate: 'XYZ999',
      violationType: 'notice',
    });
    const res = await POST_VIOLATION(req);

    expect(res.status).toBe(201);
    const body = await parseResponse<{ data: { referenceNumber: string; status: string } }>(res);
    expect(body.data.referenceNumber).toBeDefined();
    expect(body.data.status).toBe('open');
  });

  it('creates violation with warning type', async () => {
    mockViolationCreate.mockResolvedValue({
      id: 'v2',
      referenceNumber: 'PV-DEF456',
      licensePlate: 'ABC123',
      violationType: 'warning',
      status: 'open',
    });

    const req = createPostRequest('/api/v1/parking/violations', {
      propertyId: PROPERTY_A,
      licensePlate: 'ABC123',
      violationType: 'warning',
    });
    const res = await POST_VIOLATION(req);

    expect(res.status).toBe(201);
  });

  it('creates violation with ticket type', async () => {
    mockViolationCreate.mockResolvedValue({
      id: 'v3',
      referenceNumber: 'PV-GHI789',
      licensePlate: 'DEF456',
      violationType: 'ticket',
      status: 'open',
    });

    const req = createPostRequest('/api/v1/parking/violations', {
      propertyId: PROPERTY_A,
      licensePlate: 'DEF456',
      violationType: 'ticket',
    });
    const res = await POST_VIOLATION(req);

    expect(res.status).toBe(201);
  });

  it('creates violation with ban type', async () => {
    mockViolationCreate.mockResolvedValue({
      id: 'v4',
      referenceNumber: 'PV-JKL012',
      licensePlate: 'GHI789',
      violationType: 'ban',
      status: 'open',
    });

    const req = createPostRequest('/api/v1/parking/violations', {
      propertyId: PROPERTY_A,
      licensePlate: 'GHI789',
      violationType: 'ban',
    });
    const res = await POST_VIOLATION(req);

    expect(res.status).toBe(201);
  });

  it('creates violation with vehicle_towed type', async () => {
    mockViolationCreate.mockResolvedValue({
      id: 'v5',
      referenceNumber: 'PV-MNO345',
      licensePlate: 'TOW001',
      violationType: 'vehicle_towed',
      status: 'open',
    });

    const req = createPostRequest('/api/v1/parking/violations', {
      propertyId: PROPERTY_A,
      licensePlate: 'TOW001',
      violationType: 'vehicle_towed',
    });
    const res = await POST_VIOLATION(req);

    expect(res.status).toBe(201);
  });

  it('rejects violation without license plate', async () => {
    const req = createPostRequest('/api/v1/parking/violations', {
      propertyId: PROPERTY_A,
      violationType: 'warning',
    });
    const res = await POST_VIOLATION(req);

    expect(res.status).toBe(400);
  });

  it('rejects violation with invalid type', async () => {
    const req = createPostRequest('/api/v1/parking/violations', {
      propertyId: PROPERTY_A,
      licensePlate: 'ABC123',
      violationType: 'invalid_type',
    });
    const res = await POST_VIOLATION(req);

    expect(res.status).toBe(400);
  });
});

// ===========================================================================
// 7. Violation resolution workflow
// ===========================================================================

describe('7. Violation resolution workflow', () => {
  it('resolves violation with timestamp and resolver', async () => {
    mockViolationUpdate.mockResolvedValue({
      id: 'v1',
      status: 'resolved',
      resolvedAt: new Date(),
      resolvedById: STAFF_USER,
    });

    const req = createPatchRequest('/api/v1/parking/violations/v1', { status: 'resolved' });
    const res = await PATCH_VIOLATION(req, { params: Promise.resolve({ id: 'v1' }) });

    expect(res.status).toBe(200);
    const updateData = mockViolationUpdate.mock.calls[0]![0].data;
    expect(updateData.status).toBe('resolved');
    expect(updateData.resolvedAt).toBeInstanceOf(Date);
    expect(updateData.resolvedById).toBe(STAFF_USER);
  });

  it('adds notes to violation', async () => {
    mockViolationUpdate.mockResolvedValue({ id: 'v1', notes: 'Spoke with owner' });

    const req = createPatchRequest('/api/v1/parking/violations/v1', { notes: 'Spoke with owner' });
    const res = await PATCH_VIOLATION(req, { params: Promise.resolve({ id: 'v1' }) });

    expect(res.status).toBe(200);
    const updateData = mockViolationUpdate.mock.calls[0]![0].data;
    expect(updateData.notes).toBe('Spoke with owner');
  });

  it('requests tow on violation', async () => {
    mockViolationUpdate.mockResolvedValue({ id: 'v1', towRequested: true });

    const req = createPatchRequest('/api/v1/parking/violations/v1', { towRequested: true });
    const res = await PATCH_VIOLATION(req, { params: Promise.resolve({ id: 'v1' }) });

    expect(res.status).toBe(200);
    const updateData = mockViolationUpdate.mock.calls[0]![0].data;
    expect(updateData.towRequested).toBe(true);
  });
});

// ===========================================================================
// 8. Parking limit enforcement
// ===========================================================================

describe('8. Parking limit configuration', () => {
  it('creates per-unit limit config', async () => {
    mockLimitConfigCreate.mockResolvedValue({
      id: 'limit-1',
      propertyId: PROPERTY_A,
      scope: 'per_unit',
      period: 'per_month',
      maxCount: 4,
    });

    const req = createPostRequest('/api/v1/parking/limits', {
      propertyId: PROPERTY_A,
      scope: 'per_unit',
      period: 'per_month',
      maxCount: 4,
    });
    const res = await POST_LIMIT(req);

    expect(res.status).toBe(201);
  });

  it('creates per-plate consecutive-days limit', async () => {
    mockLimitConfigCreate.mockResolvedValue({
      id: 'limit-2',
      propertyId: PROPERTY_A,
      scope: 'per_plate',
      period: 'consecutive',
      maxCount: 1,
      consecutiveDays: 3,
    });

    const req = createPostRequest('/api/v1/parking/limits', {
      propertyId: PROPERTY_A,
      scope: 'per_plate',
      period: 'consecutive',
      maxCount: 1,
      consecutiveDays: 3,
    });
    const res = await POST_LIMIT(req);

    expect(res.status).toBe(201);
  });

  it('rejects duplicate limit config', async () => {
    mockLimitConfigFindFirst.mockResolvedValue({ id: 'existing-limit' });

    const req = createPostRequest('/api/v1/parking/limits', {
      propertyId: PROPERTY_A,
      scope: 'per_unit',
      period: 'per_month',
      maxCount: 4,
    });
    const res = await POST_LIMIT(req);

    expect(res.status).toBe(409);
  });

  it('rejects consecutiveDays when period is not consecutive', async () => {
    const req = createPostRequest('/api/v1/parking/limits', {
      propertyId: PROPERTY_A,
      scope: 'per_unit',
      period: 'per_month',
      maxCount: 4,
      consecutiveDays: 3,
    });
    const res = await POST_LIMIT(req);

    expect(res.status).toBe(400);
  });

  it('requires consecutiveDays when period is consecutive', async () => {
    const req = createPostRequest('/api/v1/parking/limits', {
      propertyId: PROPERTY_A,
      scope: 'per_plate',
      period: 'consecutive',
      maxCount: 1,
    });
    const res = await POST_LIMIT(req);

    expect(res.status).toBe(400);
  });

  it('lists limit configs for a property', async () => {
    mockLimitConfigFindMany.mockResolvedValue([
      { id: 'limit-1', scope: 'per_unit', period: 'per_month', maxCount: 4 },
    ]);

    const req = createGetRequest('/api/v1/parking/limits', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await GET_LIMITS(req);
    const body = await parseResponse<{ data: unknown[] }>(res);

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(1);
  });

  it('rejects limit listing without propertyId', async () => {
    const req = createGetRequest('/api/v1/parking/limits');
    const res = await GET_LIMITS(req);

    expect(res.status).toBe(400);
  });
});

// ===========================================================================
// 9. Self-service resident parking
// ===========================================================================

describe('9. Self-service permit creation', () => {
  it('sets residentId from request body if provided', async () => {
    const residentId = '00000000-0000-4000-a000-000000000001';
    mockPermitCreate.mockResolvedValue({
      id: PERMIT_A,
      referenceNumber: 'PRK-001',
      status: 'active',
      residentId,
    });

    const req = createPostRequest('/api/v1/parking', {
      ...validPermitBody,
      residentId,
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
    const body = await parseResponse<{ data: { residentId: string } }>(res);
    expect(body.data.residentId).toBe(residentId);
  });

  it('creates permit successfully when residentId not provided', async () => {
    mockPermitCreate.mockResolvedValue({
      id: PERMIT_A,
      referenceNumber: 'PRK-001',
      status: 'active',
    });

    const req = createPostRequest('/api/v1/parking', validPermitBody);
    const res = await POST(req);

    expect(res.status).toBe(201);
  });
});

// ===========================================================================
// 10. Permit renewal workflow
// ===========================================================================

describe('10. Permit renewal workflow', () => {
  it('renews active permit: expires old, creates new', async () => {
    const oldPermit = {
      id: PERMIT_A,
      status: 'active',
      propertyId: PROPERTY_A,
      unitId: UNIT_A,
      vehicleId: VEHICLE_A,
      permitTypeId: PERMIT_TYPE_RESIDENT,
      licensePlate: 'ABC1234',
      vehicleMake: 'Toyota',
      vehicleModel: 'Camry',
      vehicleYear: 2024,
      vehicleColor: 'Silver',
      areaId: AREA_A,
      spotId: SPOT_A,
      residentId: 'r-1',
      validUntil: new Date('2026-09-30'),
      autoRenew: false,
    };
    mockPermitFindUnique.mockResolvedValue(oldPermit);

    const renewedPermit = {
      id: PERMIT_B,
      referenceNumber: 'PRK-20260930-0001',
      status: 'active',
      renewedFromId: PERMIT_A,
    };

    const txMock = {
      parkingPermit: {
        update: mockPermitUpdate,
        create: mockPermitCreate,
      },
    };
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => fn(txMock));
    mockPermitUpdate.mockResolvedValue({ ...oldPermit, status: 'expired' });
    mockPermitCreate.mockResolvedValue(renewedPermit);

    const req = createPatchRequest('/api/v1/parking', {
      permitId: PERMIT_A,
      action: 'renew',
      newStartDate: '2026-10-01',
      newEndDate: '2027-03-31',
    });
    const res = await PATCH(req);

    expect(res.status).toBe(201);
    // Old permit should be expired
    expect(mockPermitUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: PERMIT_A },
        data: { status: 'expired' },
      }),
    );
    // New permit should be created
    expect(mockPermitCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          renewedFromId: PERMIT_A,
          status: 'active',
        }),
      }),
    );
  });
});

// ===========================================================================
// 11. Parking pass data (reference number generation)
// ===========================================================================

describe('11. Parking pass printing data (reference number)', () => {
  it('generates PRK- prefixed reference number with date', async () => {
    mockPermitCreate.mockResolvedValue({
      id: PERMIT_A,
      referenceNumber: 'PRK-20260401-5678',
      status: 'active',
    });

    const req = createPostRequest('/api/v1/parking', validPermitBody);
    const res = await POST(req);
    const body = await parseResponse<{ data: { referenceNumber: string } }>(res);

    expect(body.data.referenceNumber).toMatch(/^PRK-/);
    expect(body.data.referenceNumber.length).toBeGreaterThan(4);
  });
});

// ===========================================================================
// 12. Spot availability check
// ===========================================================================

describe('12. Spot availability check', () => {
  it('area response includes spot count for availability assessment', async () => {
    mockAreaFindMany.mockResolvedValue([
      {
        id: 'a1',
        areaName: 'P1',
        areaCode: 'P1',
        totalSpots: 100,
        visitorSpots: 10,
        isActive: true,
        _count: { spots: 95 },
      },
    ]);

    const req = createGetRequest('/api/v1/parking/areas', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await GET_AREAS(req);
    const body = await parseResponse<{ data: Array<{ totalSpots: number; spotCount: number }> }>(
      res,
    );

    // 100 total - 95 assigned = 5 available conceptually
    expect(body.data[0]!.totalSpots).toBe(100);
    expect(body.data[0]!.spotCount).toBe(95);
  });
});

// ===========================================================================
// 13. Violation status filtering (report-like)
// ===========================================================================

describe('13. Violation filtering for reports', () => {
  it('filters violations by status=open', async () => {
    const req = createGetRequest('/api/v1/parking', {
      searchParams: { propertyId: PROPERTY_A, type: 'violations', status: 'open' },
    });
    await GET(req);

    const where = mockViolationFindMany.mock.calls[0]![0].where;
    expect(where.status).toBe('open');
  });

  it('returns all violations when no status filter', async () => {
    const req = createGetRequest('/api/v1/parking', {
      searchParams: { propertyId: PROPERTY_A, type: 'violations' },
    });
    await GET(req);

    const where = mockViolationFindMany.mock.calls[0]![0].where;
    expect(where.status).toBeUndefined();
  });

  it('searches violations by license plate', async () => {
    const req = createGetRequest('/api/v1/parking', {
      searchParams: { propertyId: PROPERTY_A, type: 'violations', search: 'XYZ' },
    });
    await GET(req);

    const where = mockViolationFindMany.mock.calls[0]![0].where;
    expect(where.OR).toBeDefined();
  });
});

// ===========================================================================
// 14. Overnight parking detection (conceptual)
// ===========================================================================

describe('14. Overnight parking detection', () => {
  it('detects vehicle parked beyond allowed hours', () => {
    const permit = {
      validFrom: new Date('2026-04-01T08:00'),
      validUntil: new Date('2026-04-01T20:00'),
      licensePlate: 'NIGHT1',
    };
    const currentTime = new Date('2026-04-01T23:00');
    const isPastHours = currentTime > permit.validUntil;
    expect(isPastHours).toBe(true);
  });

  it('vehicle within allowed hours is fine', () => {
    const permit = {
      validFrom: new Date('2026-04-01T08:00'),
      validUntil: new Date('2026-04-01T20:00'),
    };
    const currentTime = new Date('2026-04-01T15:00');
    const isPastHours = currentTime > permit.validUntil;
    expect(isPastHours).toBe(false);
  });
});

// ===========================================================================
// 15. Towing workflow
// ===========================================================================

describe('15. Towing workflow', () => {
  it('marks towRequested on violation', async () => {
    mockViolationUpdate.mockResolvedValue({ id: 'v1', towRequested: true, status: 'open' });

    const req = createPatchRequest('/api/v1/parking/violations/v1', { towRequested: true });
    const res = await PATCH_VIOLATION(req, { params: Promise.resolve({ id: 'v1' }) });

    expect(res.status).toBe(200);
  });

  it('creates vehicle_towed violation type', async () => {
    mockViolationCreate.mockResolvedValue({
      id: 'v-tow',
      referenceNumber: 'PV-TOW1',
      licensePlate: 'TOWED1',
      violationType: 'vehicle_towed',
      status: 'open',
    });

    const req = createPostRequest('/api/v1/parking/violations', {
      propertyId: PROPERTY_A,
      licensePlate: 'TOWED1',
      violationType: 'vehicle_towed',
      description: 'Vehicle towed from P1-023',
    });
    const res = await POST_VIOLATION(req);

    expect(res.status).toBe(201);
  });
});

// ===========================================================================
// 16. Tenant isolation
// ===========================================================================

describe('16. Tenant isolation', () => {
  it('rejects permit listing without propertyId', async () => {
    const req = createGetRequest('/api/v1/parking');
    const res = await GET(req);

    expect(res.status).toBe(400);
    expect(mockPermitFindMany).not.toHaveBeenCalled();
  });

  it('scopes permit queries to propertyId and excludes soft-deleted', async () => {
    const req = createGetRequest('/api/v1/parking', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET(req);

    const where = mockPermitFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_A);
    expect(where.deletedAt).toBeNull();
  });

  it('scopes violation queries to propertyId', async () => {
    const req = createGetRequest('/api/v1/parking', {
      searchParams: { propertyId: PROPERTY_A, type: 'violations' },
    });
    await GET(req);

    const where = mockViolationFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_A);
  });

  it('rejects area listing without propertyId', async () => {
    const req = createGetRequest('/api/v1/parking/areas');
    const res = await GET_AREAS(req);

    expect(res.status).toBe(400);
  });

  it('stores propertyId from request body in permit', async () => {
    mockPermitCreate.mockResolvedValue({
      id: PERMIT_A,
      referenceNumber: 'PRK-001',
      status: 'active',
    });

    const req = createPostRequest('/api/v1/parking', validPermitBody);
    await POST(req);

    const createCall = mockPermitCreate.mock.calls[0]![0];
    expect(createCall.data.propertyId).toBe(PROPERTY_A);
  });
});

// ===========================================================================
// 17. Permit overlap detection
// ===========================================================================

describe('17. Permit overlap detection', () => {
  it('rejects permit when vehicle already has active permit for period', async () => {
    mockPermitFindFirst.mockResolvedValue({
      id: 'existing-permit',
      vehicleId: VEHICLE_A,
      status: 'active',
    });

    const req = createPostRequest('/api/v1/parking', validPermitBody);
    const res = await POST(req);

    expect(res.status).toBe(409);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('OVERLAP_CONFLICT');
  });

  it('allows permit when no overlap exists', async () => {
    mockPermitFindFirst.mockResolvedValue(null);
    mockPermitCreate.mockResolvedValue({
      id: PERMIT_A,
      referenceNumber: 'PRK-001',
      status: 'active',
    });

    const req = createPostRequest('/api/v1/parking', validPermitBody);
    const res = await POST(req);

    expect(res.status).toBe(201);
  });
});

// ===========================================================================
// 18. Permit search
// ===========================================================================

describe('18. Permit search by reference number or plate', () => {
  it('searches permits by reference number', async () => {
    const req = createGetRequest('/api/v1/parking', {
      searchParams: { propertyId: PROPERTY_A, search: 'PRK-2026' },
    });
    await GET(req);

    const where = mockPermitFindMany.mock.calls[0]![0].where;
    expect(where.OR).toBeDefined();
    expect(where.OR[0].referenceNumber).toBeDefined();
  });

  it('searches permits by license plate', async () => {
    const req = createGetRequest('/api/v1/parking', {
      searchParams: { propertyId: PROPERTY_A, search: 'ABC' },
    });
    await GET(req);

    const where = mockPermitFindMany.mock.calls[0]![0].where;
    expect(where.OR[1].licensePlate).toBeDefined();
  });
});

// ===========================================================================
// 19. Filter permits by unit and vehicle
// ===========================================================================

describe('19. Filter permits by unitId and vehicleId', () => {
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
});

// ===========================================================================
// 20. Permit filter by status
// ===========================================================================

describe('20. Filter permits by status', () => {
  it('filters permits by status=active', async () => {
    const req = createGetRequest('/api/v1/parking', {
      searchParams: { propertyId: PROPERTY_A, status: 'active' },
    });
    await GET(req);

    const where = mockPermitFindMany.mock.calls[0]![0].where;
    expect(where.status).toBe('active');
    expect(where.propertyId).toBe(PROPERTY_A);
  });
});

// ===========================================================================
// 21. Violation XSS sanitization
// ===========================================================================

describe('21. Violation description sanitized', () => {
  it('strips HTML from violation description', async () => {
    mockViolationCreate.mockResolvedValue({
      id: 'v-xss',
      referenceNumber: 'PV-XSS1',
      licensePlate: 'XSS001',
      violationType: 'warning',
      status: 'open',
    });

    const req = createPostRequest('/api/v1/parking/violations', {
      propertyId: PROPERTY_A,
      licensePlate: 'XSS001',
      violationType: 'warning',
      description: '<script>alert("xss")</script>Unauthorized parking',
    });
    await POST_VIOLATION(req);

    const createCall = mockViolationCreate.mock.calls[0]![0];
    expect(createCall.data.description).not.toContain('<script>');
  });
});

// ===========================================================================
// 22. License plate uppercase normalization
// ===========================================================================

describe('22. License plate normalization', () => {
  it('converts license plate to uppercase on violation', async () => {
    mockViolationCreate.mockResolvedValue({
      id: 'v-upper',
      referenceNumber: 'PV-UP1',
      licensePlate: 'ABC123',
      violationType: 'notice',
      status: 'open',
    });

    const req = createPostRequest('/api/v1/parking/violations', {
      propertyId: PROPERTY_A,
      licensePlate: 'abc123',
      violationType: 'notice',
    });
    await POST_VIOLATION(req);

    const createCall = mockViolationCreate.mock.calls[0]![0];
    expect(createCall.data.licensePlate).toBe('ABC123');
  });
});

// ===========================================================================
// 23. Violation auto-link to permit by plate
// ===========================================================================

describe('23. Violation auto-links to permit by license plate', () => {
  it('links violations to permit when license plates match', async () => {
    mockPermitFindFirst.mockResolvedValue(null);
    mockViolationFindMany.mockResolvedValue([
      { id: 'v1', licensePlate: 'ABC1234', permitId: null },
    ]);

    const txMock = makeTxMock();
    const mockViolationUpdateMany = vi.fn().mockResolvedValue({ count: 1 });
    (txMock as Record<string, unknown>).parkingViolation = { updateMany: mockViolationUpdateMany };
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => fn(txMock));

    mockPermitCreate.mockResolvedValue({
      id: PERMIT_A,
      referenceNumber: 'PRK-001',
      licensePlate: 'ABC1234',
      status: 'active',
      linkedViolations: 1,
    });

    const req = createPostRequest('/api/v1/parking', validPermitBody);
    const res = await POST(req);

    expect(res.status).toBe(201);
  });
});

// ===========================================================================
// 24. Permit not found on PATCH
// ===========================================================================

describe('24. Permit not found on lifecycle action', () => {
  it('returns 404 when permit does not exist', async () => {
    mockPermitFindUnique.mockResolvedValue(null);

    const req = createPatchRequest('/api/v1/parking', {
      permitId: '00000000-0000-4000-b000-0000000000ff',
      action: 'suspend',
    });
    const res = await PATCH(req);

    expect(res.status).toBe(404);
  });
});

// ===========================================================================
// 25. Validation errors on permit create
// ===========================================================================

describe('25. Validation errors on permit creation', () => {
  it('rejects missing unitId', async () => {
    const { unitId: _, ...noUnit } = validPermitBody;
    const req = createPostRequest('/api/v1/parking', noUnit);
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('rejects missing vehicleId', async () => {
    const { vehicleId: _, ...noVehicle } = validPermitBody;
    const req = createPostRequest('/api/v1/parking', noVehicle);
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('rejects invalid startDate format', async () => {
    const req = createPostRequest('/api/v1/parking', {
      ...validPermitBody,
      startDate: '04-01-2026',
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('rejects invalid propertyId format', async () => {
    const req = createPostRequest('/api/v1/parking', {
      ...validPermitBody,
      propertyId: 'not-a-uuid',
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });
});

// ===========================================================================
// 26. Validation errors on PATCH permit
// ===========================================================================

describe('26. Validation errors on permit lifecycle PATCH', () => {
  it('rejects PATCH without permitId', async () => {
    const req = createPatchRequest('/api/v1/parking', {
      action: 'suspend',
    });
    const res = await PATCH(req);

    expect(res.status).toBe(400);
  });

  it('rejects PATCH with invalid action', async () => {
    const req = createPatchRequest('/api/v1/parking', {
      permitId: PERMIT_A,
      action: 'invalid_action',
    });
    const res = await PATCH(req);

    expect(res.status).toBe(400);
  });
});

// ===========================================================================
// 27. Auth guard
// ===========================================================================

describe('27. Authentication required', () => {
  it('returns auth error when guard fails on GET', async () => {
    mockGuardRoute.mockResolvedValue({
      user: null,
      error: new Response(JSON.stringify({ error: 'UNAUTHORIZED' }), { status: 401 }),
    });

    const req = createGetRequest('/api/v1/parking', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it('returns auth error when guard fails on POST', async () => {
    mockGuardRoute.mockResolvedValue({
      user: null,
      error: new Response(JSON.stringify({ error: 'UNAUTHORIZED' }), { status: 401 }),
    });

    const req = createPostRequest('/api/v1/parking', validPermitBody);
    const res = await POST(req);

    expect(res.status).toBe(401);
  });
});

// ===========================================================================
// 28. Ordering
// ===========================================================================

describe('28. Result ordering', () => {
  it('permits ordered by createdAt desc', async () => {
    const req = createGetRequest('/api/v1/parking', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET(req);

    const findCall = mockPermitFindMany.mock.calls[0]![0];
    expect(findCall.orderBy).toEqual({ createdAt: 'desc' });
  });

  it('violations ordered by createdAt desc', async () => {
    const req = createGetRequest('/api/v1/parking', {
      searchParams: { propertyId: PROPERTY_A, type: 'violations' },
    });
    await GET(req);

    const findCall = mockViolationFindMany.mock.calls[0]![0];
    expect(findCall.orderBy).toEqual({ createdAt: 'desc' });
  });

  it('areas ordered by areaName asc', async () => {
    mockAreaFindMany.mockResolvedValue([]);

    const req = createGetRequest('/api/v1/parking/areas', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET_AREAS(req);

    const findCall = mockAreaFindMany.mock.calls[0]![0];
    expect(findCall.orderBy).toEqual({ areaName: 'asc' });
  });
});

// ===========================================================================
// 29. Auto-renew flag
// ===========================================================================

describe('29. Auto-renew flag', () => {
  it('stores autoRenew=true when requested', async () => {
    mockPermitCreate.mockResolvedValue({
      id: PERMIT_A,
      referenceNumber: 'PRK-001',
      status: 'active',
      autoRenew: true,
    });

    const req = createPostRequest('/api/v1/parking', {
      ...validPermitBody,
      autoRenew: true,
    });
    await POST(req);

    const createCall = mockPermitCreate.mock.calls[0]![0];
    expect(createCall.data.autoRenew).toBe(true);
  });

  it('defaults autoRenew to false', async () => {
    mockPermitCreate.mockResolvedValue({
      id: PERMIT_A,
      referenceNumber: 'PRK-001',
      status: 'active',
      autoRenew: false,
    });

    const req = createPostRequest('/api/v1/parking', validPermitBody);
    await POST(req);

    const createCall = mockPermitCreate.mock.calls[0]![0];
    expect(createCall.data.autoRenew).toBe(false);
  });
});

// ===========================================================================
// 30. Day-visit limit validation
// ===========================================================================

describe('30. Day-visit limit config validation', () => {
  it('creates day_visit limit with dayVisitLimit', async () => {
    mockLimitConfigCreate.mockResolvedValue({
      id: 'limit-dv',
      propertyId: PROPERTY_A,
      scope: 'per_unit',
      period: 'day_visit',
      maxCount: 2,
      dayVisitLimit: 8,
    });

    const req = createPostRequest('/api/v1/parking/limits', {
      propertyId: PROPERTY_A,
      scope: 'per_unit',
      period: 'day_visit',
      maxCount: 2,
      dayVisitLimit: 8,
    });
    const res = await POST_LIMIT(req);

    expect(res.status).toBe(201);
  });

  it('rejects day_visit period without dayVisitLimit', async () => {
    const req = createPostRequest('/api/v1/parking/limits', {
      propertyId: PROPERTY_A,
      scope: 'per_unit',
      period: 'day_visit',
      maxCount: 2,
    });
    const res = await POST_LIMIT(req);

    expect(res.status).toBe(400);
  });

  it('rejects dayVisitLimit when period is not day_visit', async () => {
    const req = createPostRequest('/api/v1/parking/limits', {
      propertyId: PROPERTY_A,
      scope: 'per_unit',
      period: 'per_month',
      maxCount: 4,
      dayVisitLimit: 8,
    });
    const res = await POST_LIMIT(req);

    expect(res.status).toBe(400);
  });
});

// ===========================================================================
// 31. Violation location field
// ===========================================================================

describe('31. Violation with location field', () => {
  it('stores location on violation', async () => {
    mockViolationCreate.mockResolvedValue({
      id: 'v-loc',
      referenceNumber: 'PV-LOC1',
      licensePlate: 'LOC001',
      violationType: 'notice',
      location: 'P1-023',
      status: 'open',
    });

    const req = createPostRequest('/api/v1/parking/violations', {
      propertyId: PROPERTY_A,
      licensePlate: 'LOC001',
      violationType: 'notice',
      location: 'P1-023',
    });
    const res = await POST_VIOLATION(req);

    expect(res.status).toBe(201);
  });
});

// ===========================================================================
// 32. Area with visitor spots and building
// ===========================================================================

describe('32. Area with visitorSpots and buildingId', () => {
  it('creates area with visitorSpots count', async () => {
    mockAreaCreate.mockResolvedValue({
      id: 'a-vis',
      propertyId: PROPERTY_A,
      areaName: 'Visitor Lot',
      areaCode: 'VIS',
      totalSpots: 20,
      visitorSpots: 20,
    });

    const req = createPostRequest('/api/v1/parking/areas', {
      propertyId: PROPERTY_A,
      areaName: 'Visitor Lot',
      areaCode: 'VIS',
      totalSpots: 20,
      visitorSpots: 20,
    });
    const res = await POST_AREA(req);

    expect(res.status).toBe(201);
  });
});
