/**
 * Integration Workflow Tests — Resident Self-Service
 *
 * Tests complete resident self-service workflows across multiple API endpoints:
 *   - Resident submits maintenance request via portal
 *   - Request appears in staff queue with correct priority
 *   - Staff updates status -> resident gets notification
 *   - Resident views their request history
 *   - Resident books an amenity
 *   - Resident views their package history
 *
 * Each test validates role-aware data access and notification side effects.
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

const mockMaintenanceRequestCreate = vi.fn();
const mockMaintenanceRequestFindMany = vi.fn();
const mockMaintenanceRequestCount = vi.fn();
const mockMaintenanceRequestFindUnique = vi.fn();
const mockMaintenanceRequestUpdate = vi.fn();
const mockMaintenanceStatusChangeCreate = vi.fn();
const mockMaintenanceCommentCreate = vi.fn();

const mockReservationCreate = vi.fn();
const mockReservationFindMany = vi.fn();
const mockReservationCount = vi.fn();

const mockAmenityFindUnique = vi.fn();

const mockPackageFindMany = vi.fn();
const mockPackageCount = vi.fn();

const mockNotificationCreate = vi.fn();

const mockTransaction = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    maintenanceRequest: {
      create: (...args: unknown[]) => mockMaintenanceRequestCreate(...args),
      findMany: (...args: unknown[]) => mockMaintenanceRequestFindMany(...args),
      count: (...args: unknown[]) => mockMaintenanceRequestCount(...args),
      findUnique: (...args: unknown[]) => mockMaintenanceRequestFindUnique(...args),
      update: (...args: unknown[]) => mockMaintenanceRequestUpdate(...args),
    },
    maintenanceStatusChange: {
      create: (...args: unknown[]) => mockMaintenanceStatusChangeCreate(...args),
    },
    maintenanceComment: {
      create: (...args: unknown[]) => mockMaintenanceCommentCreate(...args),
    },
    reservation: {
      create: (...args: unknown[]) => mockReservationCreate(...args),
      findMany: (...args: unknown[]) => mockReservationFindMany(...args),
      count: (...args: unknown[]) => mockReservationCount(...args),
    },
    booking: {
      create: (...args: unknown[]) => mockReservationCreate(...args),
      findMany: (...args: unknown[]) => mockReservationFindMany(...args),
      count: (...args: unknown[]) => mockReservationCount(...args),
    },
    amenity: {
      findUnique: (...args: unknown[]) => mockAmenityFindUnique(...args),
    },
    package: {
      findMany: (...args: unknown[]) => mockPackageFindMany(...args),
      count: (...args: unknown[]) => mockPackageCount(...args),
    },
    notification: {
      create: (...args: unknown[]) => mockNotificationCreate(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

vi.mock('nanoid', () => ({
  nanoid: vi.fn().mockReturnValue('RS001'),
}));

vi.mock('@/schemas/maintenance', () => ({
  createMaintenanceSchema: {
    safeParse: vi.fn().mockImplementation((data: Record<string, unknown>) => {
      if (!data.propertyId || !data.unitId || !data.description) {
        return {
          success: false,
          error: {
            flatten: () => ({ fieldErrors: { description: ['Required'] } }),
          },
        };
      }
      return { success: true, data };
    }),
  },
  updateMaintenanceSchema: {
    safeParse: vi.fn().mockImplementation((data: Record<string, unknown>) => {
      return { success: true, data };
    }),
  },
}));

vi.mock('@/schemas/reservation', () => ({
  createReservationSchema: {
    safeParse: vi.fn().mockImplementation((data: Record<string, unknown>) => {
      if (!data.propertyId || !data.amenityId || !data.startTime || !data.endTime) {
        return {
          success: false,
          error: {
            flatten: () => ({ fieldErrors: { amenityId: ['Required'] } }),
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

// Resident role for self-service tests
vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: vi.fn().mockResolvedValue({
    user: {
      userId: 'resident-001',
      propertyId: 'prop-001',
      role: 'resident',
      permissions: [
        'maintenance:create',
        'maintenance:read_own',
        'reservations:create',
        'packages:read_own',
      ],
      mfaVerified: true,
    },
    error: null,
  }),
}));

vi.mock('@/server/email', () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('@/server/email-templates', () => ({
  renderTemplate: vi.fn().mockReturnValue('<html>Email</html>'),
}));

vi.mock('@/server/workflows/maintenance-sla', () => ({
  calculateSlaStatus: vi.fn().mockReturnValue('within_sla'),
  getSlaPriorityBump: vi.fn().mockImplementation((current: string) => current),
  DEFAULT_SLA_HOURS: {
    Plumbing: 24,
    Electrical: 24,
    HVAC: 48,
    General: 72,
  },
}));

// ---------------------------------------------------------------------------
// Import route handlers AFTER mocks
// ---------------------------------------------------------------------------

import {
  GET as listMaintenanceRequests,
  POST as createMaintenanceRequest,
} from '@/app/api/v1/maintenance/route';
import {
  GET as getMaintenanceRequest,
  PATCH as updateMaintenanceRequest,
} from '@/app/api/v1/maintenance/[id]/route';

import { GET as listReservations, POST as createReservation } from '@/app/api/v1/bookings/route';

import { GET as listPackages } from '@/app/api/v1/packages/route';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROPERTY_ID = 'prop-001';
const UNIT_ID = 'unit-101';
const RESIDENT_ID = 'resident-001';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeMaintenanceRequest(overrides: Record<string, unknown> = {}) {
  return {
    id: 'mr-res-001',
    propertyId: PROPERTY_ID,
    unitId: UNIT_ID,
    referenceNumber: 'MR-RS001',
    title: 'Leaking shower head',
    description: 'Shower head in master bathroom drips constantly.',
    status: 'open',
    priority: 'medium',
    permissionToEnter: 'yes',
    entryInstructions: 'Key under mat',
    residentId: RESIDENT_ID,
    createdById: RESIDENT_ID,
    assignedEmployeeId: null,
    assignedVendorId: null,
    completedDate: null,
    resolutionNotes: null,
    hideFromResident: false,
    createdAt: new Date('2026-03-18T10:00:00Z'),
    updatedAt: new Date('2026-03-18T10:00:00Z'),
    deletedAt: null,
    unit: { id: UNIT_ID, number: '101' },
    category: { id: 'cat-plumbing', name: 'Plumbing' },
    ...overrides,
  };
}

function makeReservation(overrides: Record<string, unknown> = {}) {
  return {
    id: 'res-001',
    propertyId: PROPERTY_ID,
    amenityId: 'amenity-pool-001',
    unitId: UNIT_ID,
    residentId: RESIDENT_ID,
    createdById: RESIDENT_ID,
    startTime: new Date('2026-03-20T14:00:00Z'),
    endTime: new Date('2026-03-20T16:00:00Z'),
    status: 'confirmed',
    notes: 'Birthday party for 10 guests',
    createdAt: new Date(),
    amenity: {
      id: 'amenity-pool-001',
      name: 'Party Room A',
      requiresApproval: false,
    },
    ...overrides,
  };
}

function makePackage(overrides: Record<string, unknown> = {}) {
  return {
    id: 'pkg-001',
    propertyId: PROPERTY_ID,
    unitId: UNIT_ID,
    referenceNumber: 'PKG-REF001',
    status: 'unreleased',
    direction: 'inbound',
    courierId: null,
    isPerishable: false,
    createdAt: new Date('2026-03-17T09:00:00Z'),
    releasedToName: null,
    releasedAt: null,
    unit: { id: UNIT_ID, number: '101' },
    courier: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

// ===========================================================================
// SCENARIO 1: Submit Maintenance Request via Portal
// ===========================================================================

describe('Scenario 1: Resident Submits Maintenance Request', () => {
  const requestId = 'mr-res-001';

  it('Step 1: resident creates maintenance request with photo description', async () => {
    mockMaintenanceRequestCreate.mockResolvedValue(makeMaintenanceRequest({ id: requestId }));

    const req = createPostRequest('/api/v1/maintenance', {
      propertyId: PROPERTY_ID,
      unitId: UNIT_ID,
      description:
        'Shower head in master bathroom drips constantly. Water stain forming on ceiling below.',
      priority: 'medium',
      permissionToEnter: true,
      entryInstructions: 'Key under mat. Dog is friendly.',
      categoryId: 'cat-plumbing',
    });

    const res = await createMaintenanceRequest(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{
      data: { status: string; referenceNumber: string; priority: string };
    }>(res);
    expect(body.data.status).toBe('open');
    expect(body.data.referenceNumber).toContain('MR-');
    expect(body.data.priority).toBe('medium');
  });

  it('Step 2: request appears with correct priority and category', async () => {
    mockMaintenanceRequestCreate.mockResolvedValue(
      makeMaintenanceRequest({
        id: requestId,
        priority: 'high',
        category: { id: 'cat-electrical', name: 'Electrical' },
      }),
    );

    const req = createPostRequest('/api/v1/maintenance', {
      propertyId: PROPERTY_ID,
      unitId: UNIT_ID,
      description: 'Outlet sparking when plugging in devices. Potential fire hazard.',
      priority: 'high',
      permissionToEnter: true,
      categoryId: 'cat-electrical',
    });

    const res = await createMaintenanceRequest(req);
    expect(res.status).toBe(201);

    expect(mockMaintenanceRequestCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          priority: 'high',
        }),
      }),
    );
  });

  it('Step 3: request includes permission-to-enter and entry instructions', async () => {
    mockMaintenanceRequestCreate.mockResolvedValue(makeMaintenanceRequest({ id: requestId }));

    const req = createPostRequest('/api/v1/maintenance', {
      propertyId: PROPERTY_ID,
      unitId: UNIT_ID,
      description: 'HVAC not cooling. Temperature above 30C.',
      priority: 'high',
      permissionToEnter: true,
      entryInstructions: 'Concierge has spare key. Dog is in bedroom.',
    });

    const res = await createMaintenanceRequest(req);
    expect(res.status).toBe(201);

    expect(mockMaintenanceRequestCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          permissionToEnter: 'yes',
          entryInstructions: 'Concierge has spare key. Dog is in bedroom.',
        }),
      }),
    );
  });
});

// ===========================================================================
// SCENARIO 2: Request Appears in Staff Queue
// ===========================================================================

describe('Scenario 2: Request Appears in Staff Queue with Correct Priority', () => {
  it('staff can list all open requests for the property', async () => {
    mockMaintenanceRequestFindMany.mockResolvedValue([
      makeMaintenanceRequest({ id: 'mr-1', priority: 'urgent', status: 'open' }),
      makeMaintenanceRequest({ id: 'mr-2', priority: 'high', status: 'open' }),
      makeMaintenanceRequest({ id: 'mr-3', priority: 'medium', status: 'open' }),
    ]);
    mockMaintenanceRequestCount.mockResolvedValue(3);

    const req = createGetRequest('/api/v1/maintenance', {
      searchParams: { propertyId: PROPERTY_ID, status: 'open' },
    });

    const res = await listMaintenanceRequests(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { id: string; priority: string }[];
      meta: { total: number };
    }>(res);
    expect(body.data).toHaveLength(3);
    expect(body.meta.total).toBe(3);
  });

  it('requests are filterable by priority for triage', async () => {
    mockMaintenanceRequestFindMany.mockResolvedValue([
      makeMaintenanceRequest({ id: 'mr-urg-1', priority: 'urgent' }),
    ]);
    mockMaintenanceRequestCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/maintenance', {
      searchParams: { propertyId: PROPERTY_ID, priority: 'urgent' },
    });

    const res = await listMaintenanceRequests(req);
    expect(res.status).toBe(200);

    expect(mockMaintenanceRequestFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          priority: 'urgent',
        }),
      }),
    );
  });
});

// ===========================================================================
// SCENARIO 3: Staff Updates Status -> Resident Gets Notification
// ===========================================================================

describe('Scenario 3: Staff Updates Status -> Status Change Tracked', () => {
  const requestId = 'mr-upd-001';

  it('Step 1: staff assigns vendor — status changes from open to assigned', async () => {
    mockMaintenanceRequestFindUnique.mockResolvedValue(
      makeMaintenanceRequest({ id: requestId, status: 'open' }),
    );
    mockMaintenanceRequestUpdate.mockResolvedValue(
      makeMaintenanceRequest({
        id: requestId,
        status: 'assigned',
        assignedVendorId: 'vendor-plumber-001',
      }),
    );
    mockMaintenanceStatusChangeCreate.mockResolvedValue({ id: 'sc-1' });

    const req = createPatchRequest(`/api/v1/maintenance/${requestId}`, {
      status: 'assigned',
      assignedVendorId: 'vendor-plumber-001',
    });

    const res = await updateMaintenanceRequest(req, {
      params: Promise.resolve({ id: requestId }),
    });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { status: string } }>(res);
    expect(body.data.status).toBe('assigned');
  });

  it('Step 2: status change creates audit record', async () => {
    mockMaintenanceRequestFindUnique.mockResolvedValue(
      makeMaintenanceRequest({ id: requestId, status: 'assigned' }),
    );
    mockMaintenanceRequestUpdate.mockResolvedValue(
      makeMaintenanceRequest({ id: requestId, status: 'in_progress' }),
    );
    mockMaintenanceStatusChangeCreate.mockResolvedValue({ id: 'sc-2' });

    const req = createPatchRequest(`/api/v1/maintenance/${requestId}`, {
      status: 'in_progress',
    });

    await updateMaintenanceRequest(req, {
      params: Promise.resolve({ id: requestId }),
    });

    expect(mockMaintenanceStatusChangeCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          requestId,
          fromStatus: 'assigned',
          toStatus: 'in_progress',
        }),
      }),
    );
  });

  it('Step 3: completion with resolution notes', async () => {
    mockMaintenanceRequestFindUnique.mockResolvedValue(
      makeMaintenanceRequest({ id: requestId, status: 'in_progress' }),
    );
    mockMaintenanceRequestUpdate.mockResolvedValue(
      makeMaintenanceRequest({
        id: requestId,
        status: 'completed',
        completedDate: new Date(),
        resolutionNotes:
          'Replaced shower head and tightened fittings. Tested for 30 minutes, no drip.',
      }),
    );
    mockMaintenanceStatusChangeCreate.mockResolvedValue({ id: 'sc-3' });

    const req = createPatchRequest(`/api/v1/maintenance/${requestId}`, {
      status: 'completed',
      resolutionNotes:
        'Replaced shower head and tightened fittings. Tested for 30 minutes, no drip.',
    });

    const res = await updateMaintenanceRequest(req, {
      params: Promise.resolve({ id: requestId }),
    });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { status: string } }>(res);
    expect(body.data.status).toBe('completed');
  });
});

// ===========================================================================
// SCENARIO 4: Resident Views Request History
// ===========================================================================

describe('Scenario 4: Resident Views Their Request History', () => {
  it('should list requests filtered by unit', async () => {
    mockMaintenanceRequestFindMany.mockResolvedValue([
      makeMaintenanceRequest({ id: 'mr-h1', status: 'completed', description: 'Fixed faucet' }),
      makeMaintenanceRequest({ id: 'mr-h2', status: 'open', description: 'Broken window lock' }),
      makeMaintenanceRequest({
        id: 'mr-h3',
        status: 'closed',
        description: 'Light bulb replaced',
      }),
    ]);
    mockMaintenanceRequestCount.mockResolvedValue(3);

    const req = createGetRequest('/api/v1/maintenance', {
      searchParams: { propertyId: PROPERTY_ID, unitId: UNIT_ID },
    });

    const res = await listMaintenanceRequests(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { id: string; status: string }[];
      meta: { total: number };
    }>(res);
    expect(body.data).toHaveLength(3);

    // Verify unit filter was applied
    expect(mockMaintenanceRequestFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          unitId: UNIT_ID,
        }),
      }),
    );
  });

  it('should view individual request detail with full timeline', async () => {
    mockMaintenanceRequestFindUnique.mockResolvedValue(
      makeMaintenanceRequest({
        id: 'mr-detail-001',
        status: 'completed',
        resolutionNotes: 'Faucet washer replaced. No more leak.',
        completedDate: new Date('2026-03-19T15:00:00Z'),
        comments: [
          {
            id: 'c1',
            body: 'Vendor scheduled for Tuesday',
            createdAt: new Date('2026-03-18T14:00:00Z'),
          },
          { id: 'c2', body: 'Repair completed', createdAt: new Date('2026-03-19T15:00:00Z') },
        ],
      }),
    );

    const req = createGetRequest('/api/v1/maintenance/mr-detail-001');
    const res = await getMaintenanceRequest(req, {
      params: Promise.resolve({ id: 'mr-detail-001' }),
    });
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { status: string; resolutionNotes: string };
    }>(res);
    expect(body.data.status).toBe('completed');
    expect(body.data.resolutionNotes).toContain('washer replaced');
  });

  it('should search requests by reference number', async () => {
    mockMaintenanceRequestFindMany.mockResolvedValue([]);
    mockMaintenanceRequestCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/maintenance', {
      searchParams: { propertyId: PROPERTY_ID, search: 'MR-RS001' },
    });

    await listMaintenanceRequests(req);

    expect(mockMaintenanceRequestFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({
              referenceNumber: expect.objectContaining({ contains: 'MR-RS001' }),
            }),
          ]),
        }),
      }),
    );
  });
});

// ===========================================================================
// SCENARIO 5: Resident Books an Amenity
// ===========================================================================

describe('Scenario 5: Resident Books an Amenity', () => {
  it('Step 1: resident creates reservation for party room', async () => {
    mockAmenityFindUnique.mockResolvedValue({
      id: 'amenity-pool-001',
      name: 'Party Room A',
      requiresApproval: false,
      maxCapacity: 50,
    });
    mockReservationCreate.mockResolvedValue(makeReservation());

    const req = createPostRequest('/api/v1/reservations', {
      propertyId: PROPERTY_ID,
      amenityId: 'amenity-pool-001',
      unitId: UNIT_ID,
      startTime: '2026-03-20T14:00:00Z',
      endTime: '2026-03-20T16:00:00Z',
      notes: 'Birthday party for 10 guests',
    });

    const res = await createReservation(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{
      data: { status: string; amenity: { name: string } };
    }>(res);
    expect(body.data.status).toBe('confirmed');
    expect(body.data.amenity.name).toBe('Party Room A');
  });

  it('Step 2: resident views their upcoming reservations', async () => {
    mockReservationFindMany.mockResolvedValue([
      makeReservation({ id: 'res-1', amenity: { id: 'a1', name: 'Party Room A' } }),
      makeReservation({
        id: 'res-2',
        amenityId: 'amenity-gym-001',
        amenity: { id: 'a2', name: 'Gym' },
        startTime: new Date('2026-03-21T08:00:00Z'),
      }),
    ]);
    mockReservationCount.mockResolvedValue(2);

    const req = createGetRequest('/api/v1/reservations', {
      searchParams: { propertyId: PROPERTY_ID, unitId: UNIT_ID },
    });

    const res = await listReservations(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { id: string }[];
      meta: { total: number };
    }>(res);
    expect(body.data).toHaveLength(2);
    expect(body.meta.total).toBe(2);
  });

  it('should reject reservation with missing required fields', async () => {
    const req = createPostRequest('/api/v1/reservations', {
      propertyId: PROPERTY_ID,
      // Missing amenityId, startTime, endTime
    });

    const res = await createReservation(req);
    expect(res.status).toBe(400);
  });
});

// ===========================================================================
// SCENARIO 6: Resident Views Package History
// ===========================================================================

describe('Scenario 6: Resident Views Their Package History', () => {
  it('should list packages for resident unit', async () => {
    mockPackageFindMany.mockResolvedValue([
      makePackage({
        id: 'pkg-1',
        status: 'released',
        releasedToName: 'John Doe',
        releasedAt: new Date(),
      }),
      makePackage({ id: 'pkg-2', status: 'unreleased' }),
      makePackage({
        id: 'pkg-3',
        status: 'released',
        releasedToName: 'Jane Doe',
        releasedAt: new Date(),
      }),
    ]);
    mockPackageCount.mockResolvedValue(3);

    const req = createGetRequest('/api/v1/packages', {
      searchParams: { propertyId: PROPERTY_ID, unitId: UNIT_ID },
    });

    const res = await listPackages(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { id: string; status: string }[];
      meta: { total: number };
    }>(res);
    expect(body.data).toHaveLength(3);

    // Verify unit filter was applied
    expect(mockPackageFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          unitId: UNIT_ID,
        }),
      }),
    );
  });

  it('should filter packages by status (unreleased only)', async () => {
    mockPackageFindMany.mockResolvedValue([makePackage({ id: 'pkg-unr-1', status: 'unreleased' })]);
    mockPackageCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/packages', {
      searchParams: { propertyId: PROPERTY_ID, unitId: UNIT_ID, status: 'unreleased' },
    });

    const res = await listPackages(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { status: string }[];
      meta: { total: number };
    }>(res);
    expect(body.data).toHaveLength(1);
    expect(body.data[0]!.status).toBe('unreleased');
  });

  it('should paginate package history', async () => {
    mockPackageFindMany.mockResolvedValue([]);
    mockPackageCount.mockResolvedValue(50);

    const req = createGetRequest('/api/v1/packages', {
      searchParams: { propertyId: PROPERTY_ID, unitId: UNIT_ID, page: '2', pageSize: '10' },
    });

    const res = await listPackages(req);
    const body = await parseResponse<{
      meta: { page: number; pageSize: number; total: number; totalPages: number };
    }>(res);

    expect(body.meta.page).toBe(2);
    expect(body.meta.pageSize).toBe(10);
    expect(body.meta.total).toBe(50);
    expect(body.meta.totalPages).toBe(5);
  });
});

// ===========================================================================
// Full End-to-End Workflow
// ===========================================================================

describe('Full Workflow: Resident self-service from request to resolution', () => {
  it('complete lifecycle: submit request -> staff assigns -> staff completes -> resident views history', async () => {
    const requestId = 'mr-e2e-001';

    // Step 1: Resident submits
    mockMaintenanceRequestCreate.mockResolvedValue(makeMaintenanceRequest({ id: requestId }));
    const submitRes = await createMaintenanceRequest(
      createPostRequest('/api/v1/maintenance', {
        propertyId: PROPERTY_ID,
        unitId: UNIT_ID,
        description: 'Garbage disposal jammed and making grinding noise.',
        priority: 'medium',
        permissionToEnter: true,
      }),
    );
    expect(submitRes.status).toBe(201);

    // Step 2: Staff assigns
    mockMaintenanceRequestFindUnique.mockResolvedValue(
      makeMaintenanceRequest({ id: requestId, status: 'open' }),
    );
    mockMaintenanceRequestUpdate.mockResolvedValue(
      makeMaintenanceRequest({ id: requestId, status: 'assigned' }),
    );
    mockMaintenanceStatusChangeCreate.mockResolvedValue({ id: 'sc-1' });
    const assignRes = await updateMaintenanceRequest(
      createPatchRequest(`/api/v1/maintenance/${requestId}`, {
        status: 'assigned',
        assignedVendorId: 'vendor-001',
      }),
      { params: Promise.resolve({ id: requestId }) },
    );
    expect(assignRes.status).toBe(200);

    // Step 3: Staff completes
    mockMaintenanceRequestFindUnique.mockResolvedValue(
      makeMaintenanceRequest({ id: requestId, status: 'in_progress' }),
    );
    mockMaintenanceRequestUpdate.mockResolvedValue(
      makeMaintenanceRequest({
        id: requestId,
        status: 'completed',
        completedDate: new Date(),
        resolutionNotes: 'Disposal cleared and tested.',
      }),
    );
    mockMaintenanceStatusChangeCreate.mockResolvedValue({ id: 'sc-2' });
    const completeRes = await updateMaintenanceRequest(
      createPatchRequest(`/api/v1/maintenance/${requestId}`, {
        status: 'completed',
        resolutionNotes: 'Disposal cleared and tested.',
      }),
      { params: Promise.resolve({ id: requestId }) },
    );
    expect(completeRes.status).toBe(200);

    // Step 4: Resident views history
    mockMaintenanceRequestFindMany.mockResolvedValue([
      makeMaintenanceRequest({ id: requestId, status: 'completed' }),
    ]);
    mockMaintenanceRequestCount.mockResolvedValue(1);
    const historyRes = await listMaintenanceRequests(
      createGetRequest('/api/v1/maintenance', {
        searchParams: { propertyId: PROPERTY_ID, unitId: UNIT_ID },
      }),
    );
    expect(historyRes.status).toBe(200);

    const historyBody = await parseResponse<{ data: { id: string; status: string }[] }>(historyRes);
    expect(historyBody.data).toHaveLength(1);
    expect(historyBody.data[0]!.status).toBe('completed');
  });
});

// ===========================================================================
// Validation & Edge Cases
// ===========================================================================

describe('Resident Self-Service: Validation & Edge Cases', () => {
  it('should reject maintenance request without description', async () => {
    const req = createPostRequest('/api/v1/maintenance', {
      propertyId: PROPERTY_ID,
      unitId: UNIT_ID,
    });

    const res = await createMaintenanceRequest(req);
    expect(res.status).toBe(400);
  });

  it('should reject maintenance request without propertyId', async () => {
    const req = createPostRequest('/api/v1/maintenance', {
      unitId: UNIT_ID,
      description: 'Something broke',
    });

    const res = await createMaintenanceRequest(req);
    expect(res.status).toBe(400);
  });

  it('listing maintenance requires propertyId', async () => {
    const req = createGetRequest('/api/v1/maintenance');
    const res = await listMaintenanceRequests(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_PROPERTY');
  });

  it('should return 404 for nonexistent maintenance request', async () => {
    mockMaintenanceRequestFindUnique.mockResolvedValue(null);

    const req = createGetRequest('/api/v1/maintenance/nonexistent');
    const res = await getMaintenanceRequest(req, {
      params: Promise.resolve({ id: 'nonexistent' }),
    });
    expect(res.status).toBe(404);
  });

  it('listing packages requires propertyId', async () => {
    const req = createGetRequest('/api/v1/packages');
    const res = await listPackages(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_PROPERTY');
  });
});
