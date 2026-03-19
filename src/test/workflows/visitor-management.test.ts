/**
 * Integration Workflow Tests — Visitor Management
 *
 * Tests complete visitor management workflows: standard visitors,
 * contractors with parking, delivery persons, unauthorized visitors,
 * and end-of-day batch sign-out.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createGetRequest,
  createPostRequest,
  createPatchRequest,
  parseResponse,
} from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Prisma Mock
// ---------------------------------------------------------------------------

const mockVisitorEntryCreate = vi.fn();
const mockVisitorEntryFindMany = vi.fn();
const mockVisitorEntryFindUnique = vi.fn();
const mockVisitorEntryUpdate = vi.fn();
const mockVisitorEntryUpdateMany = vi.fn();
const mockVisitorEntryCount = vi.fn();

const mockVisitorParkingPermitCreate = vi.fn();

const mockEventCreate = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    visitorEntry: {
      create: (...args: unknown[]) => mockVisitorEntryCreate(...args),
      findMany: (...args: unknown[]) => mockVisitorEntryFindMany(...args),
      findUnique: (...args: unknown[]) => mockVisitorEntryFindUnique(...args),
      update: (...args: unknown[]) => mockVisitorEntryUpdate(...args),
      updateMany: (...args: unknown[]) => mockVisitorEntryUpdateMany(...args),
      count: (...args: unknown[]) => mockVisitorEntryCount(...args),
    },
    visitorParkingPermit: {
      create: (...args: unknown[]) => mockVisitorParkingPermitCreate(...args),
    },
    event: {
      create: (...args: unknown[]) => mockEventCreate(...args),
    },
  },
}));

vi.mock('@/lib/sanitize', () => ({
  stripHtml: (s: string) => s,
  stripControlChars: (s: string) => s,
}));

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: vi.fn().mockResolvedValue({
    user: {
      userId: 'concierge-001',
      propertyId: '00000000-0000-4000-b000-000000000001',
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

import { POST as signInVisitor, GET as listVisitors } from '@/app/api/v1/visitors/route';
import { PATCH as signOutVisitor, GET as getVisitor } from '@/app/api/v1/visitors/[id]/route';
import { POST as batchSignOut } from '@/app/api/v1/visitors/batch-signout/route';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROPERTY_ID = '00000000-0000-4000-b000-000000000001';
const UNIT_ID = '00000000-0000-4000-a000-000000000101';
const UNIT_ID_2 = '00000000-0000-4000-a000-000000000102';

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

// ===========================================================================
// SCENARIO 1: Standard Visitor
// ===========================================================================

describe('Scenario 1: Standard Visitor — Sign In, Notify, Sign Out', () => {
  const visitorId = 'visitor-std-001';

  const standardVisitor = {
    id: visitorId,
    propertyId: PROPERTY_ID,
    visitorName: 'Alice Johnson',
    visitorType: 'visitor',
    unitId: UNIT_ID,
    arrivalAt: new Date('2026-03-19T10:00:00Z'),
    departureAt: null,
    expectedDepartureAt: null,
    notifyResident: true,
    comments: null,
    unit: { id: UNIT_ID, number: '302' },
  };

  it('Step 1: POST /api/v1/visitors — visitor signed in', async () => {
    mockVisitorEntryCreate.mockResolvedValue(standardVisitor);

    const req = createPostRequest('/api/v1/visitors', {
      propertyId: PROPERTY_ID,
      visitorName: 'Alice Johnson',
      unitId: UNIT_ID,
      notifyResident: true,
    });

    const res = await signInVisitor(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{ data: typeof standardVisitor; message: string }>(res);
    expect(body.data.visitorName).toBe('Alice Johnson');
    expect(body.message).toContain('Alice Johnson');
    expect(body.message).toContain('signed in');
    expect(body.message).toContain('302');
  });

  it('Step 2: Resident notification flag is set', async () => {
    mockVisitorEntryCreate.mockResolvedValue(standardVisitor);

    const req = createPostRequest('/api/v1/visitors', {
      propertyId: PROPERTY_ID,
      visitorName: 'Alice Johnson',
      unitId: UNIT_ID,
      notifyResident: true,
    });

    await signInVisitor(req);

    const createData = (
      mockVisitorEntryCreate.mock.calls[0]![0] as {
        data: { notifyResident: boolean };
      }
    ).data;
    expect(createData.notifyResident).toBe(true);
  });

  it('Step 3: PATCH /api/v1/visitors/:id — visitor signed out', async () => {
    mockVisitorEntryFindUnique.mockResolvedValue({
      ...standardVisitor,
      departureAt: null,
      visitorName: 'Alice Johnson',
      comments: null,
    });
    mockVisitorEntryUpdate.mockResolvedValue({
      ...standardVisitor,
      departureAt: new Date('2026-03-19T11:30:00Z'),
    });

    const req = createPatchRequest(`/api/v1/visitors/${visitorId}`, {});
    const res = await signOutVisitor(req, { params: Promise.resolve({ id: visitorId }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { departureAt: string }; message: string }>(res);
    expect(body.data.departureAt).toBeDefined();
    expect(body.message).toContain('Alice Johnson');
    expect(body.message).toContain('signed out');
  });

  it('Step 4: GET /api/v1/visitors/:id — duration recorded', async () => {
    mockVisitorEntryFindUnique.mockResolvedValue({
      ...standardVisitor,
      arrivalAt: new Date('2026-03-19T10:00:00Z'),
      departureAt: new Date('2026-03-19T11:30:00Z'),
      visitorParkingPermit: null,
    });

    const req = createGetRequest(`/api/v1/visitors/${visitorId}`);
    const res = await getVisitor(req, { params: Promise.resolve({ id: visitorId }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { durationMinutes: number; status: string };
    }>(res);
    expect(body.data.durationMinutes).toBe(90); // 1.5 hours
    expect(body.data.status).toBe('signed_out');
  });

  it('Double sign-out is rejected', async () => {
    mockVisitorEntryFindUnique.mockResolvedValue({
      ...standardVisitor,
      departureAt: new Date('2026-03-19T11:30:00Z'),
    });

    const req = createPatchRequest(`/api/v1/visitors/${visitorId}`, {});
    const res = await signOutVisitor(req, { params: Promise.resolve({ id: visitorId }) });
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('ALREADY_SIGNED_OUT');
  });

  it('Sign-out with comments appends to visitor record', async () => {
    mockVisitorEntryFindUnique.mockResolvedValue({
      ...standardVisitor,
      departureAt: null,
      comments: 'Arrived for meeting',
    });
    mockVisitorEntryUpdate.mockResolvedValue({
      ...standardVisitor,
      departureAt: new Date(),
      comments: 'Arrived for meeting | Sign-out: Left after meeting',
    });

    const req = createPatchRequest(`/api/v1/visitors/${visitorId}`, {
      comments: 'Left after meeting',
    });

    const res = await signOutVisitor(req, { params: Promise.resolve({ id: visitorId }) });
    expect(res.status).toBe(200);

    const updateData = (
      mockVisitorEntryUpdate.mock.calls[0]![0] as {
        data: { comments: string };
      }
    ).data;
    expect(updateData.comments).toContain('Sign-out: Left after meeting');
  });
});

// ===========================================================================
// SCENARIO 2: Contractor Visit
// ===========================================================================

describe('Scenario 2: Contractor Visit — Sign In with Vehicle, Parking, Sign Out', () => {
  const contractorId = 'visitor-contractor-001';

  const contractorVisitor = {
    id: contractorId,
    propertyId: PROPERTY_ID,
    visitorName: 'Bob the Plumber',
    visitorType: 'contractor',
    unitId: UNIT_ID,
    arrivalAt: new Date('2026-03-19T08:00:00Z'),
    departureAt: null,
    expectedDepartureAt: new Date('2026-03-19T17:00:00Z'),
    notifyResident: true,
    comments: 'Vehicle: ABC-1234',
    unit: { id: UNIT_ID, number: '302' },
  };

  it('Step 1: POST /api/v1/visitors — contractor signed in with vehicle and parking', async () => {
    mockVisitorEntryCreate.mockResolvedValue(contractorVisitor);
    mockVisitorParkingPermitCreate.mockResolvedValue({
      id: 'permit-001',
      visitorEntryId: contractorId,
      licensePlate: 'ABC-1234',
      vehicleMakeModel: 'Ford Transit',
      provinceState: 'ON',
      vehicleColor: 'White',
      parkingArea: 'Visitor P1',
      status: 'active',
    });

    const req = createPostRequest('/api/v1/visitors', {
      propertyId: PROPERTY_ID,
      visitorName: 'Bob the Plumber',
      visitorType: 'contractor',
      unitId: UNIT_ID,
      expectedDepartureAt: '2026-03-19T17:00:00Z',
      notifyResident: true,
      parkingPermit: {
        licensePlate: 'ABC-1234',
        vehicleMakeModel: 'Ford Transit',
        provinceState: 'ON',
        vehicleColor: 'White',
        parkingArea: 'Visitor P1',
      },
    });

    const res = await signInVisitor(req);
    expect(res.status).toBe(201);

    // Verify parking permit was created
    expect(mockVisitorParkingPermitCreate).toHaveBeenCalled();
    const permitData = (
      mockVisitorParkingPermitCreate.mock.calls[0]![0] as {
        data: { licensePlate: string; vehicleMakeModel: string };
      }
    ).data;
    expect(permitData.licensePlate).toBe('ABC-1234');
    expect(permitData.vehicleMakeModel).toBe('Ford Transit');
  });

  it('Step 2: Parking permit has correct start/end times', async () => {
    mockVisitorEntryCreate.mockResolvedValue(contractorVisitor);
    mockVisitorParkingPermitCreate.mockResolvedValue({ id: 'permit-001' });

    const req = createPostRequest('/api/v1/visitors', {
      propertyId: PROPERTY_ID,
      visitorName: 'Bob the Plumber',
      visitorType: 'contractor',
      unitId: UNIT_ID,
      expectedDepartureAt: '2026-03-19T17:00:00Z',
      parkingPermit: {
        licensePlate: 'ABC-1234',
        vehicleMakeModel: 'Ford Transit',
        provinceState: 'ON',
      },
    });

    await signInVisitor(req);

    const permitData = (
      mockVisitorParkingPermitCreate.mock.calls[0]![0] as {
        data: { permitStart: Date; permitEnd: Date; status: string };
      }
    ).data;
    expect(permitData.permitStart).toBeInstanceOf(Date);
    expect(permitData.permitEnd).toBeInstanceOf(Date);
    expect(permitData.status).toBe('active');
  });

  it('Step 3: Contractor signed out after work completed', async () => {
    mockVisitorEntryFindUnique.mockResolvedValue({
      ...contractorVisitor,
      departureAt: null,
      visitorName: 'Bob the Plumber',
      comments: 'Vehicle: ABC-1234',
    });
    mockVisitorEntryUpdate.mockResolvedValue({
      ...contractorVisitor,
      departureAt: new Date('2026-03-19T15:30:00Z'),
    });

    const req = createPatchRequest(`/api/v1/visitors/${contractorId}`, {
      comments: 'Plumbing work completed. No issues.',
    });

    const res = await signOutVisitor(req, { params: Promise.resolve({ id: contractorId }) });
    expect(res.status).toBe(200);
  });

  it('GET /api/v1/visitors filters by visitorType=contractor', async () => {
    mockVisitorEntryFindMany.mockResolvedValue([contractorVisitor]);
    mockVisitorEntryCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/visitors', {
      searchParams: {
        propertyId: PROPERTY_ID,
        visitorType: 'contractor',
      },
    });

    await listVisitors(req);

    const whereClause = (
      mockVisitorEntryFindMany.mock.calls[0]![0] as {
        where: { visitorType: string };
      }
    ).where;
    expect(whereClause.visitorType).toBe('contractor');
  });

  it('Contractor visit resolves visitorType from legacy purpose=service', async () => {
    mockVisitorEntryCreate.mockResolvedValue({
      ...contractorVisitor,
      visitorType: 'contractor',
    });

    const req = createPostRequest('/api/v1/visitors', {
      propertyId: PROPERTY_ID,
      visitorName: 'Electrician Mike',
      unitId: UNIT_ID,
      purpose: 'service', // Legacy field
    });

    await signInVisitor(req);

    const createData = (
      mockVisitorEntryCreate.mock.calls[0]![0] as {
        data: { visitorType: string };
      }
    ).data;
    expect(createData.visitorType).toBe('contractor');
  });
});

// ===========================================================================
// SCENARIO 3: Delivery Person
// ===========================================================================

describe('Scenario 3: Delivery Person — Quick Sign In/Out', () => {
  const deliveryId = 'visitor-delivery-001';

  const deliveryVisitor = {
    id: deliveryId,
    propertyId: PROPERTY_ID,
    visitorName: 'Amazon Driver',
    visitorType: 'delivery_person',
    unitId: UNIT_ID,
    arrivalAt: new Date('2026-03-19T14:00:00Z'),
    departureAt: null,
    notifyResident: true,
    comments: null,
    unit: { id: UNIT_ID, number: '302' },
  };

  it('Step 1: POST /api/v1/visitors — delivery person signed in', async () => {
    mockVisitorEntryCreate.mockResolvedValue(deliveryVisitor);

    const req = createPostRequest('/api/v1/visitors', {
      propertyId: PROPERTY_ID,
      visitorName: 'Amazon Driver',
      visitorType: 'delivery_person',
      unitId: UNIT_ID,
      notifyResident: true,
    });

    const res = await signInVisitor(req);
    expect(res.status).toBe(201);

    const createData = (
      mockVisitorEntryCreate.mock.calls[0]![0] as {
        data: { visitorType: string };
      }
    ).data;
    expect(createData.visitorType).toBe('delivery_person');
  });

  it('Step 2: Quick sign-out after delivery', async () => {
    mockVisitorEntryFindUnique.mockResolvedValue({
      ...deliveryVisitor,
      departureAt: null,
      visitorName: 'Amazon Driver',
      comments: null,
    });
    mockVisitorEntryUpdate.mockResolvedValue({
      ...deliveryVisitor,
      departureAt: new Date('2026-03-19T14:05:00Z'),
    });

    const req = createPatchRequest(`/api/v1/visitors/${deliveryId}`, {
      comments: 'Package left at concierge desk',
    });

    const res = await signOutVisitor(req, { params: Promise.resolve({ id: deliveryId }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('Amazon Driver');
    expect(body.message).toContain('signed out');
  });

  it('GET /api/v1/visitors/:id — short duration recorded for delivery', async () => {
    mockVisitorEntryFindUnique.mockResolvedValue({
      ...deliveryVisitor,
      arrivalAt: new Date('2026-03-19T14:00:00Z'),
      departureAt: new Date('2026-03-19T14:05:00Z'),
      visitorParkingPermit: null,
    });

    const req = createGetRequest(`/api/v1/visitors/${deliveryId}`);
    const res = await getVisitor(req, { params: Promise.resolve({ id: deliveryId }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { durationMinutes: number } }>(res);
    expect(body.data.durationMinutes).toBe(5);
  });

  it('Delivery person type resolved from legacy purpose=delivery', async () => {
    mockVisitorEntryCreate.mockResolvedValue(deliveryVisitor);

    const req = createPostRequest('/api/v1/visitors', {
      propertyId: PROPERTY_ID,
      visitorName: 'FedEx',
      unitId: UNIT_ID,
      purpose: 'delivery',
    });

    await signInVisitor(req);

    const createData = (
      mockVisitorEntryCreate.mock.calls[0]![0] as {
        data: { visitorType: string };
      }
    ).data;
    expect(createData.visitorType).toBe('delivery_person');
  });
});

// ===========================================================================
// SCENARIO 4: Unauthorized Visitor
// ===========================================================================

describe('Scenario 4: Unauthorized Visitor — Denied Entry', () => {
  const unauthorizedId = 'visitor-unauth-001';

  it('Step 1: POST /api/v1/visitors — visitor arrives, signs in pending confirmation', async () => {
    const pendingVisitor = {
      id: unauthorizedId,
      propertyId: PROPERTY_ID,
      visitorName: 'Unknown Person',
      visitorType: 'visitor',
      unitId: UNIT_ID,
      arrivalAt: new Date(),
      departureAt: null,
      notifyResident: true,
      comments: 'Waiting for resident confirmation',
      unit: { id: UNIT_ID, number: '302' },
    };
    mockVisitorEntryCreate.mockResolvedValue(pendingVisitor);

    const req = createPostRequest('/api/v1/visitors', {
      propertyId: PROPERTY_ID,
      visitorName: 'Unknown Person',
      unitId: UNIT_ID,
      notifyResident: true,
      comments: 'Waiting for resident confirmation',
    });

    const res = await signInVisitor(req);
    expect(res.status).toBe(201);
  });

  it('Step 2: Resident denies entry — visitor signed out immediately', async () => {
    mockVisitorEntryFindUnique.mockResolvedValue({
      id: unauthorizedId,
      propertyId: PROPERTY_ID,
      visitorName: 'Unknown Person',
      departureAt: null,
      comments: 'Waiting for resident confirmation',
    });
    mockVisitorEntryUpdate.mockResolvedValue({
      id: unauthorizedId,
      departureAt: new Date(),
      comments:
        'Waiting for resident confirmation | Sign-out: Entry denied by resident. Asked to leave.',
    });

    const req = createPatchRequest(`/api/v1/visitors/${unauthorizedId}`, {
      comments: 'Entry denied by resident. Asked to leave.',
    });

    const res = await signOutVisitor(req, { params: Promise.resolve({ id: unauthorizedId }) });
    expect(res.status).toBe(200);

    const updateData = (
      mockVisitorEntryUpdate.mock.calls[0]![0] as {
        data: { comments: string; departureAt: Date };
      }
    ).data;
    expect(updateData.comments).toContain('Entry denied');
    expect(updateData.departureAt).toBeInstanceOf(Date);
  });

  it('Step 3: Visitor no longer appears in active list after denial', async () => {
    mockVisitorEntryFindMany.mockResolvedValue([]);
    mockVisitorEntryCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/visitors', {
      searchParams: { propertyId: PROPERTY_ID, status: 'active' },
    });

    const res = await listVisitors(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: unknown[]; meta: { total: number } }>(res);
    expect(body.data).toHaveLength(0);
    expect(body.meta.total).toBe(0);
  });

  it('Visitor not found returns 404 on sign-out', async () => {
    mockVisitorEntryFindUnique.mockResolvedValue(null);

    const req = createPatchRequest('/api/v1/visitors/nonexistent', {});
    const res = await signOutVisitor(req, {
      params: Promise.resolve({ id: 'nonexistent' }),
    });
    expect(res.status).toBe(404);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('NOT_FOUND');
  });

  it('Visitor not found returns 404 on GET', async () => {
    mockVisitorEntryFindUnique.mockResolvedValue(null);

    const req = createGetRequest('/api/v1/visitors/nonexistent');
    const res = await getVisitor(req, {
      params: Promise.resolve({ id: 'nonexistent' }),
    });
    expect(res.status).toBe(404);
  });
});

// ===========================================================================
// SCENARIO 5: End-of-Day Batch Sign-Out
// ===========================================================================

describe('Scenario 5: End-of-Day Batch Sign-Out', () => {
  const VISITOR_EOD_1 = '00000000-0000-4000-e000-000000000001';
  const VISITOR_EOD_2 = '00000000-0000-4000-e000-000000000002';
  const VISITOR_EOD_3 = '00000000-0000-4000-e000-000000000003';

  const visitor1 = {
    id: VISITOR_EOD_1,
    propertyId: PROPERTY_ID,
    visitorName: 'Late Visitor 1',
    visitorType: 'visitor',
    unitId: UNIT_ID,
    arrivalAt: new Date('2026-03-19T09:00:00Z'),
    departureAt: null,
    unit: { id: UNIT_ID, number: '302' },
  };

  const visitor2 = {
    id: VISITOR_EOD_2,
    propertyId: PROPERTY_ID,
    visitorName: 'Late Visitor 2',
    visitorType: 'contractor',
    unitId: UNIT_ID_2,
    arrivalAt: new Date('2026-03-19T10:00:00Z'),
    departureAt: null,
    unit: { id: UNIT_ID_2, number: '303' },
  };

  const visitor3 = {
    id: VISITOR_EOD_3,
    propertyId: PROPERTY_ID,
    visitorName: 'Late Visitor 3',
    visitorType: 'visitor',
    unitId: UNIT_ID,
    arrivalAt: new Date('2026-03-19T11:00:00Z'),
    departureAt: null,
    unit: { id: UNIT_ID, number: '302' },
  };

  it('Step 1: Multiple visitors still signed in at end of day', async () => {
    mockVisitorEntryFindMany.mockResolvedValue([visitor1, visitor2, visitor3]);
    mockVisitorEntryCount.mockResolvedValue(3);

    const req = createGetRequest('/api/v1/visitors', {
      searchParams: { propertyId: PROPERTY_ID, status: 'active' },
    });

    const res = await listVisitors(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: (typeof visitor1)[]; meta: { total: number } }>(res);
    expect(body.data).toHaveLength(3);
    expect(body.meta.total).toBe(3);
  });

  it('Step 2: POST /api/v1/visitors/batch-signout — all active visitors signed out', async () => {
    mockVisitorEntryUpdateMany.mockResolvedValue({ count: 3 });

    const req = createPostRequest('/api/v1/visitors/batch-signout', {
      visitorIds: [VISITOR_EOD_1, VISITOR_EOD_2, VISITOR_EOD_3],
    });

    const res = await batchSignOut(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{ message: string; meta: { count: number } }>(res);
    expect(body.meta.count).toBe(3);
    expect(body.message).toContain('3');
    expect(body.message).toContain('signed out');
  });

  it('Step 3: All visitors marked as departed after batch sign-out', async () => {
    mockVisitorEntryFindMany.mockResolvedValue([]);
    mockVisitorEntryCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/visitors', {
      searchParams: { propertyId: PROPERTY_ID, status: 'active' },
    });

    const res = await listVisitors(req);
    const body = await parseResponse<{ data: unknown[]; meta: { total: number } }>(res);
    expect(body.data).toHaveLength(0);
    expect(body.meta.total).toBe(0);
  });

  it('Batch sign-out only affects visitors with no departureAt', async () => {
    mockVisitorEntryUpdateMany.mockResolvedValue({ count: 2 }); // Only 2 were actually active

    const req = createPostRequest('/api/v1/visitors/batch-signout', {
      visitorIds: [VISITOR_EOD_1, VISITOR_EOD_2, '00000000-0000-4000-e000-000000000099'],
    });

    const res = await batchSignOut(req);
    expect(res.status).toBe(200);

    // Verify updateMany filters for departureAt: null
    const updateManyArgs = mockVisitorEntryUpdateMany.mock.calls[0]![0] as {
      where: { departureAt: null };
    };
    expect(updateManyArgs.where.departureAt).toBeNull();
  });

  it('Batch sign-out with empty array returns validation error', async () => {
    const req = createPostRequest('/api/v1/visitors/batch-signout', {
      visitorIds: [],
    });

    const res = await batchSignOut(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('Batch sign-out records signedOutById from auth context', async () => {
    mockVisitorEntryUpdateMany.mockResolvedValue({ count: 1 });

    const req = createPostRequest('/api/v1/visitors/batch-signout', {
      visitorIds: [VISITOR_EOD_1],
    });

    await batchSignOut(req);

    const updateData = (
      mockVisitorEntryUpdateMany.mock.calls[0]![0] as {
        data: { signedOutById: string };
      }
    ).data;
    expect(updateData.signedOutById).toBe('concierge-001');
  });
});

// ===========================================================================
// Additional Edge Cases & Filters
// ===========================================================================

describe('Visitor Management — Edge Cases & Filters', () => {
  it('GET /api/v1/visitors requires propertyId', async () => {
    const req = createGetRequest('/api/v1/visitors', { searchParams: {} });
    const res = await listVisitors(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_PROPERTY');
  });

  it('GET /api/v1/visitors filters active visitors (departureAt=null)', async () => {
    mockVisitorEntryFindMany.mockResolvedValue([]);
    mockVisitorEntryCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/visitors', {
      searchParams: { propertyId: PROPERTY_ID, status: 'active' },
    });

    await listVisitors(req);

    const whereClause = (
      mockVisitorEntryFindMany.mock.calls[0]![0] as {
        where: { departureAt: unknown };
      }
    ).where;
    expect(whereClause.departureAt).toBeNull();
  });

  it('GET /api/v1/visitors filters signed_out visitors', async () => {
    mockVisitorEntryFindMany.mockResolvedValue([]);
    mockVisitorEntryCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/visitors', {
      searchParams: { propertyId: PROPERTY_ID, status: 'signed_out' },
    });

    await listVisitors(req);

    const whereClause = (
      mockVisitorEntryFindMany.mock.calls[0]![0] as {
        where: { departureAt: { not: null } };
      }
    ).where;
    expect(whereClause.departureAt).toEqual({ not: null });
  });

  it('GET /api/v1/visitors filters by unitId', async () => {
    mockVisitorEntryFindMany.mockResolvedValue([]);
    mockVisitorEntryCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/visitors', {
      searchParams: { propertyId: PROPERTY_ID, unitId: UNIT_ID },
    });

    await listVisitors(req);

    const whereClause = (
      mockVisitorEntryFindMany.mock.calls[0]![0] as {
        where: { unitId: string };
      }
    ).where;
    expect(whereClause.unitId).toBe(UNIT_ID);
  });

  it('GET /api/v1/visitors supports search by name', async () => {
    mockVisitorEntryFindMany.mockResolvedValue([]);
    mockVisitorEntryCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/visitors', {
      searchParams: { propertyId: PROPERTY_ID, search: 'Alice' },
    });

    await listVisitors(req);

    const whereClause = (
      mockVisitorEntryFindMany.mock.calls[0]![0] as {
        where: { OR: Array<Record<string, unknown>> };
      }
    ).where;
    expect(whereClause.OR).toBeDefined();
    expect(whereClause.OR).toHaveLength(2);
  });

  it('GET /api/v1/visitors supports date range filtering', async () => {
    mockVisitorEntryFindMany.mockResolvedValue([]);
    mockVisitorEntryCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/visitors', {
      searchParams: {
        propertyId: PROPERTY_ID,
        dateFrom: '2026-03-19T00:00:00Z',
        dateTo: '2026-03-19T23:59:59Z',
      },
    });

    await listVisitors(req);

    const whereClause = (
      mockVisitorEntryFindMany.mock.calls[0]![0] as {
        where: { arrivalAt: { gte: Date; lte: Date } };
      }
    ).where;
    expect(whereClause.arrivalAt).toBeDefined();
    expect(whereClause.arrivalAt.gte).toBeInstanceOf(Date);
    expect(whereClause.arrivalAt.lte).toBeInstanceOf(Date);
  });

  it('GET /api/v1/visitors paginates correctly', async () => {
    mockVisitorEntryFindMany.mockResolvedValue([]);
    mockVisitorEntryCount.mockResolvedValue(100);

    const req = createGetRequest('/api/v1/visitors', {
      searchParams: { propertyId: PROPERTY_ID, page: '3', pageSize: '10' },
    });

    const res = await listVisitors(req);
    const body = await parseResponse<{
      meta: { page: number; pageSize: number; totalPages: number };
    }>(res);
    expect(body.meta.page).toBe(3);
    expect(body.meta.pageSize).toBe(10);
    expect(body.meta.totalPages).toBe(10);
  });

  it('POST /api/v1/visitors with ID verification builds comments', async () => {
    mockVisitorEntryCreate.mockResolvedValue({
      id: 'v-id-check',
      propertyId: PROPERTY_ID,
      visitorName: 'ID Check Visitor',
      visitorType: 'visitor',
      unitId: UNIT_ID,
      arrivalAt: new Date(),
      departureAt: null,
      unit: { id: UNIT_ID, number: '302' },
    });

    const req = createPostRequest('/api/v1/visitors', {
      propertyId: PROPERTY_ID,
      visitorName: 'ID Check Visitor',
      unitId: UNIT_ID,
      idType: 'driver_license',
      idVerified: true,
      notes: 'Regular visitor',
    });

    await signInVisitor(req);

    const createData = (
      mockVisitorEntryCreate.mock.calls[0]![0] as {
        data: { comments: string };
      }
    ).data;
    expect(createData.comments).toContain('driver_license');
    expect(createData.comments).toContain('verified');
    expect(createData.comments).toContain('Regular visitor');
  });

  it('GET /api/v1/visitors/:id computes null duration for active visitor', async () => {
    mockVisitorEntryFindUnique.mockResolvedValue({
      id: 'active-visitor',
      arrivalAt: new Date(),
      departureAt: null,
      visitorParkingPermit: null,
    });

    const req = createGetRequest('/api/v1/visitors/active-visitor');
    const res = await getVisitor(req, { params: Promise.resolve({ id: 'active-visitor' }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { durationMinutes: null; status: string } }>(res);
    expect(body.data.durationMinutes).toBeNull();
    expect(body.data.status).toBe('signed_in');
  });
});
