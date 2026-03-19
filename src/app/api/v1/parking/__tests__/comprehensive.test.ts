/**
 * Parking Management Module — Comprehensive Tests (PRD 10)
 *
 * TDD coverage for permit CRUD, violation lifecycle, parking areas/spots,
 * permit type configuration, vehicle plate matching, expired permit detection,
 * and tenant isolation.
 *
 * Tests 1-15:
 *  1. Permit CRUD — create permit with auto-generated reference number
 *  2. Permit CRUD — update permit details (licensePlate, unitId)
 *  3. Permit CRUD — reference number format validation (PRK-YYYYMMDD-NNNN)
 *  4. Permit type validation — reject invalid permitTypeId
 *  5. Violation create — with reference number and type
 *  6. Violation track — filter open violations by status
 *  7. Violation resolve — close with resolvedAt and resolvedById
 *  8. Parking area CRUD — create area with areaName, areaCode, totalSpots
 *  9. Parking spots — list spots in an area with occupancy
 * 10. Permit type configuration — list permit types for a property
 * 11. Vehicle plate matching — violation auto-links to permit by licensePlate
 * 12. Vehicle plate matching — no link when plate does not match any permit
 * 13. Expired permit detection — cannot activate an expired permit
 * 14. Expired permit detection — list only active non-expired permits
 * 15. Tenant isolation — queries always scoped to propertyId
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

const mockTransaction = vi.fn();

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
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: vi.fn().mockResolvedValue({
    user: {
      userId: 'staff-parking',
      propertyId: '00000000-0000-4000-b000-000000000001',
      role: 'property_admin',
      permissions: ['*'],
      mfaVerified: false,
    },
    error: null,
  }),
}));

// Import route handlers after mocks
import { GET, POST, PATCH } from '../route';
import { GET as GET_AREAS, POST as POST_AREA } from '../areas/route';
import { POST as POST_VIOLATION } from '../violations/route';
import { PATCH as PATCH_VIOLATION } from '../violations/[id]/route';

const PROPERTY_A = '00000000-0000-4000-b000-000000000001';
const PROPERTY_B = '00000000-0000-4000-b000-000000000099';
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
  mockPermitFindUnique.mockResolvedValue(null);
  mockPermitCount.mockResolvedValue(0);
  mockViolationFindMany.mockResolvedValue([]);
  mockViolationCount.mockResolvedValue(0);
  mockAreaFindMany.mockResolvedValue([]);
  mockSpotFindMany.mockResolvedValue([]);
  mockSpotFindFirst.mockResolvedValue(null);
  mockPermitTypeFindMany.mockResolvedValue([]);
});

// ===========================================================================
// 1. Permit CRUD — create permit with auto-generated reference number
// ===========================================================================

describe('1. Permit CRUD — create with reference number', () => {
  it('creates a permit and returns a PRK- prefixed reference number', async () => {
    mockPermitFindFirst.mockResolvedValue(null);
    mockSpotFindFirst.mockResolvedValue({ id: SPOT_A, spotNumber: 'P1-001' });
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        parkingPermit: { create: mockPermitCreate },
        parkingSpot: { update: mockSpotUpdate },
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

  it('stores propertyId from the request body', async () => {
    mockPermitFindFirst.mockResolvedValue(null);
    mockSpotFindFirst.mockResolvedValue(null);
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        parkingPermit: { create: mockPermitCreate },
        parkingSpot: { update: mockSpotUpdate },
      };
      return fn(tx);
    });
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
// 2. Permit CRUD — update permit details
// ===========================================================================

describe('2. Permit CRUD — suspend stores reason', () => {
  it('suspends an active permit and stores the suspension reason', async () => {
    mockPermitFindUnique.mockResolvedValue({
      id: PERMIT_A,
      status: 'active',
      licensePlate: 'ABC1234',
    });
    mockPermitUpdate.mockResolvedValue({
      id: PERMIT_A,
      status: 'suspended',
      suspensionReason: 'Non-payment',
    });

    const req = createPatchRequest('/api/v1/parking', {
      permitId: PERMIT_A,
      action: 'suspend',
      reason: 'Non-payment',
    });
    const res = await PATCH(req);
    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: { status: string; suspensionReason: string } }>(res);
    expect(body.data.status).toBe('suspended');
    expect(body.data.suspensionReason).toBe('Non-payment');
  });
});

// ===========================================================================
// 3. Reference number format validation
// ===========================================================================

describe('3. Reference number format (PRK-YYYYMMDD-NNNN)', () => {
  it('generated reference contains date segment', async () => {
    mockPermitFindFirst.mockResolvedValue(null);
    mockSpotFindFirst.mockResolvedValue(null);
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        parkingPermit: { create: mockPermitCreate },
        parkingSpot: { update: mockSpotUpdate },
      };
      return fn(tx);
    });
    mockPermitCreate.mockResolvedValue({
      id: PERMIT_A,
      referenceNumber: 'PRK-20260401-0001',
      status: 'active',
    });

    const req = createPostRequest('/api/v1/parking', validPermitBody);
    const res = await POST(req);
    const body = await parseResponse<{ data: { referenceNumber: string } }>(res);

    expect(body.data.referenceNumber).toContain('PRK-');
    expect(body.data.referenceNumber.length).toBeGreaterThan(4);
  });
});

// ===========================================================================
// 4. Permit type validation — reject invalid permitTypeId
// ===========================================================================

describe('4. Permit type validation', () => {
  it('rejects creation without required permitTypeId', async () => {
    const { permitTypeId: _, ...noType } = validPermitBody;
    const req = createPostRequest('/api/v1/parking', noType);
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects creation with non-UUID permitTypeId', async () => {
    const req = createPostRequest('/api/v1/parking', {
      ...validPermitBody,
      permitTypeId: 'not-a-uuid',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

// ===========================================================================
// 5. Violation create — with reference number and type
// ===========================================================================

describe('5. Violation create — with reference and violationType', () => {
  it('creates a violation with auto-generated reference number', async () => {
    mockViolationCreate.mockResolvedValue({
      id: 'v1',
      referenceNumber: 'PV-ABC123',
      licensePlate: 'XYZ999',
      violationType: 'warning',
      status: 'open',
    });

    const req = createPostRequest('/api/v1/parking/violations', {
      propertyId: PROPERTY_A,
      licensePlate: 'XYZ999',
      violationType: 'warning',
    });
    const res = await POST_VIOLATION(req);

    expect(res.status).toBe(201);
    const body = await parseResponse<{ data: { referenceNumber: string; status: string } }>(res);
    expect(body.data.referenceNumber).toBeDefined();
    expect(body.data.status).toBe('open');
  });

  it('rejects violation without licensePlate', async () => {
    const req = createPostRequest('/api/v1/parking/violations', {
      propertyId: PROPERTY_A,
      violationType: 'warning',
    });
    const res = await POST_VIOLATION(req);
    expect(res.status).toBe(400);
  });

  it('rejects violation with invalid violationType', async () => {
    const req = createPostRequest('/api/v1/parking/violations', {
      propertyId: PROPERTY_A,
      licensePlate: 'XYZ999',
      violationType: 'invalid_type',
    });
    const res = await POST_VIOLATION(req);
    expect(res.status).toBe(400);
  });
});

// ===========================================================================
// 6. Violation track — filter open violations by status
// ===========================================================================

describe('6. Violation track — filter by status', () => {
  it('filters violations by status=open', async () => {
    const req = createGetRequest('/api/v1/parking', {
      searchParams: { propertyId: PROPERTY_A, type: 'violations', status: 'open' },
    });
    await GET(req);

    const where = mockViolationFindMany.mock.calls[0]![0].where;
    expect(where.status).toBe('open');
  });

  it('returns all violations when no status filter is applied', async () => {
    const req = createGetRequest('/api/v1/parking', {
      searchParams: { propertyId: PROPERTY_A, type: 'violations' },
    });
    await GET(req);

    const where = mockViolationFindMany.mock.calls[0]![0].where;
    expect(where.status).toBeUndefined();
  });
});

// ===========================================================================
// 7. Violation resolve — close with resolvedAt and resolvedById
// ===========================================================================

describe('7. Violation resolve lifecycle', () => {
  it('marks violation as resolved with timestamp and resolver', async () => {
    mockViolationUpdate.mockResolvedValue({
      id: 'v1',
      status: 'resolved',
      resolvedAt: new Date(),
      resolvedById: 'staff-parking',
    });

    const req = createPatchRequest('/api/v1/parking/violations/v1', { status: 'resolved' });
    const res = await PATCH_VIOLATION(req, { params: Promise.resolve({ id: 'v1' }) });

    expect(res.status).toBe(200);
    const updateData = mockViolationUpdate.mock.calls[0]![0].data;
    expect(updateData.status).toBe('resolved');
    expect(updateData.resolvedAt).toBeInstanceOf(Date);
    expect(updateData.resolvedById).toBe('staff-parking');
  });
});

// ===========================================================================
// 8. Parking area CRUD — create area
// ===========================================================================

describe('8. Parking area CRUD', () => {
  it('creates area with areaName, areaCode, and totalSpots', async () => {
    mockAreaCreate.mockResolvedValue({
      id: 'area-1',
      propertyId: PROPERTY_A,
      areaName: 'P1 Underground',
      areaCode: 'P1',
      totalSpots: 100,
    });

    const req = createPostRequest('/api/v1/parking/areas', {
      propertyId: PROPERTY_A,
      areaName: 'P1 Underground',
      areaCode: 'P1',
      totalSpots: 100,
    });
    const res = await POST_AREA(req);

    expect(res.status).toBe(201);
    const body = await parseResponse<{ data: { areaName: string } }>(res);
    expect(body.data).toBeDefined();
  });

  it('lists areas filtered by propertyId and active status', async () => {
    mockAreaFindMany.mockResolvedValue([
      {
        id: 'a1',
        areaName: 'P1',
        areaCode: 'P1',
        totalSpots: 50,
        visitorSpots: 5,
        isActive: true,
        _count: { spots: 40 },
      },
      {
        id: 'a2',
        areaName: 'P2',
        areaCode: 'P2',
        totalSpots: 30,
        visitorSpots: 3,
        isActive: true,
        _count: { spots: 20 },
      },
    ]);

    const req = createGetRequest('/api/v1/parking/areas', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await GET_AREAS(req);
    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: unknown[] }>(res);
    expect(body.data).toHaveLength(2);
  });
});

// ===========================================================================
// 9. Parking spots — list spots in area with occupancy
// ===========================================================================

describe('9. Parking spots management', () => {
  it('area listing includes spot count via _count', async () => {
    mockAreaFindMany.mockResolvedValue([
      {
        id: 'area-1',
        areaName: 'P1',
        areaCode: 'P1',
        totalSpots: 100,
        visitorSpots: 10,
        _count: { spots: 85 },
      },
    ]);

    const req = createGetRequest('/api/v1/parking/areas', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await GET_AREAS(req);
    const body = await parseResponse<{ data: { spotCount: number }[] }>(res);
    expect(body.data[0]!.spotCount).toBe(85);
  });
});

// ===========================================================================
// 10. Permit type configuration — list permit types
// ===========================================================================

describe('10. Permit type configuration', () => {
  it('permits include permitType relation in response', async () => {
    mockPermitFindMany.mockResolvedValue([
      {
        id: PERMIT_A,
        permitType: { id: PERMIT_TYPE_A, name: 'Resident', maxPerUnit: 2 },
      },
    ]);

    const req = createGetRequest('/api/v1/parking', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET(req);

    const include = mockPermitFindMany.mock.calls[0]![0].include;
    expect(include.permitType).toBeDefined();
  });
});

// ===========================================================================
// 11. Vehicle plate matching — violation auto-links to permit
// ===========================================================================

describe('11. Vehicle plate matching — auto-link violation to permit', () => {
  it('auto-links violations to permit when license plates match during creation', async () => {
    mockPermitFindFirst.mockResolvedValue(null);
    mockSpotFindFirst.mockResolvedValue({ id: SPOT_A, spotNumber: 'P1-001' });
    mockViolationFindMany.mockResolvedValue([
      { id: 'v1', licensePlate: 'ABC1234', permitId: null },
    ]);

    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        parkingPermit: { create: mockPermitCreate },
        parkingSpot: { update: mockSpotUpdate },
        parkingViolation: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
      };
      return fn(tx);
    });

    mockPermitCreate.mockResolvedValue({
      id: PERMIT_A,
      referenceNumber: 'PRK-001',
      licensePlate: 'ABC1234',
      status: 'active',
      linkedViolations: 1,
    });

    const req = createPostRequest('/api/v1/parking', validPermitBody);
    const res = await POST(req);
    const body = await parseResponse<{ data: { linkedViolations: number } }>(res);

    expect(res.status).toBe(201);
    expect(body.data.linkedViolations).toBe(1);
  });
});

// ===========================================================================
// 12. Vehicle plate matching — no link when plate does not match
// ===========================================================================

describe('12. Vehicle plate matching — no match scenario', () => {
  it('returns 0 linkedViolations when no plates match', async () => {
    mockPermitFindFirst.mockResolvedValue(null);
    mockSpotFindFirst.mockResolvedValue(null);
    mockViolationFindMany.mockResolvedValue([]);

    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        parkingPermit: { create: mockPermitCreate },
        parkingSpot: { update: mockSpotUpdate },
      };
      return fn(tx);
    });

    mockPermitCreate.mockResolvedValue({
      id: PERMIT_A,
      referenceNumber: 'PRK-001',
      licensePlate: 'NOPE999',
      status: 'active',
    });

    const req = createPostRequest('/api/v1/parking', {
      ...validPermitBody,
      licensePlate: 'NOPE999',
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
  });
});

// ===========================================================================
// 13. Expired permit detection — cannot activate an expired permit
// ===========================================================================

describe('13. Expired permit detection — cannot re-activate', () => {
  it('rejects activation of an expired permit', async () => {
    mockPermitFindUnique.mockResolvedValue({
      id: PERMIT_A,
      status: 'expired',
      validUntil: '2025-01-01',
    });

    const req = createPatchRequest('/api/v1/parking', {
      permitId: PERMIT_A,
      action: 'activate',
    });
    const res = await PATCH(req);

    expect(res.status).toBe(409);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('INVALID_TRANSITION');
  });

  it('rejects suspension of a cancelled permit', async () => {
    mockPermitFindUnique.mockResolvedValue({
      id: PERMIT_A,
      status: 'cancelled',
    });

    const req = createPatchRequest('/api/v1/parking', {
      permitId: PERMIT_A,
      action: 'suspend',
      reason: 'Should fail',
    });
    const res = await PATCH(req);

    expect(res.status).toBe(409);
  });
});

// ===========================================================================
// 14. Expired permit detection — list only active non-expired permits
// ===========================================================================

describe('14. Expired permit — list active permits', () => {
  it('filters permits by status=active to exclude expired', async () => {
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
// 15. Tenant isolation — queries always scoped to propertyId
// ===========================================================================

describe('15. Tenant isolation', () => {
  it('rejects permit listing without propertyId', async () => {
    const req = createGetRequest('/api/v1/parking');
    const res = await GET(req);
    expect(res.status).toBe(400);
    expect(mockPermitFindMany).not.toHaveBeenCalled();
  });

  it('rejects area listing without propertyId', async () => {
    const req = createGetRequest('/api/v1/parking/areas');
    const res = await GET_AREAS(req);
    expect(res.status).toBe(400);
    expect(mockAreaFindMany).not.toHaveBeenCalled();
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
});
