/**
 * Integration Workflow Tests — Cross-Endpoint Business Process Verification
 *
 * These tests verify complete business workflows that span multiple API
 * endpoints. Each workflow represents a real-world process that staff
 * perform daily in a condo management environment.
 *
 * Unlike unit tests (which test a single endpoint), these tests call
 * multiple route handlers in sequence and verify that state transitions
 * propagate correctly across the system.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  createGetRequest,
  createPostRequest,
  createPatchRequest,
  parseResponse,
} from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Prisma Mock — shared across all workflows
// ---------------------------------------------------------------------------

const mockPackageCreate = vi.fn();
const mockPackageFindMany = vi.fn();
const mockPackageCount = vi.fn();
const mockPackageFindUnique = vi.fn();
const mockPackageUpdate = vi.fn();

const mockPackageHistoryCreate = vi.fn();

const mockUserCreate = vi.fn();
const mockUserFindFirst = vi.fn();
const mockUserFindUnique = vi.fn();
const mockUserUpdate = vi.fn();
const mockUserFindMany = vi.fn();
const mockUserCount = vi.fn();

const mockUserPropertyCreate = vi.fn();

const mockSessionUpdateMany = vi.fn();

const mockTransaction = vi.fn();

const mockVisitorEntryCreate = vi.fn();
const mockVisitorEntryFindMany = vi.fn();
const mockVisitorEntryCount = vi.fn();
const mockVisitorEntryFindUnique = vi.fn();
const mockVisitorEntryUpdate = vi.fn();

const mockAmenityFindUnique = vi.fn();

const mockBookingCreate = vi.fn();
const mockBookingFindUnique = vi.fn();
const mockBookingUpdate = vi.fn();
const mockBookingFindMany = vi.fn();
const mockBookingCount = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    package: {
      create: (...args: unknown[]) => mockPackageCreate(...args),
      findMany: (...args: unknown[]) => mockPackageFindMany(...args),
      count: (...args: unknown[]) => mockPackageCount(...args),
      findUnique: (...args: unknown[]) => mockPackageFindUnique(...args),
      update: (...args: unknown[]) => mockPackageUpdate(...args),
    },
    packageHistory: {
      create: (...args: unknown[]) => mockPackageHistoryCreate(...args),
    },
    user: {
      create: (...args: unknown[]) => mockUserCreate(...args),
      findFirst: (...args: unknown[]) => mockUserFindFirst(...args),
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
      update: (...args: unknown[]) => mockUserUpdate(...args),
      findMany: (...args: unknown[]) => mockUserFindMany(...args),
      count: (...args: unknown[]) => mockUserCount(...args),
    },
    userProperty: {
      create: (...args: unknown[]) => mockUserPropertyCreate(...args),
      updateMany: vi.fn(),
    },
    session: {
      updateMany: (...args: unknown[]) => mockSessionUpdateMany(...args),
    },
    refreshToken: {
      updateMany: vi.fn(),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
    visitorEntry: {
      create: (...args: unknown[]) => mockVisitorEntryCreate(...args),
      findMany: (...args: unknown[]) => mockVisitorEntryFindMany(...args),
      count: (...args: unknown[]) => mockVisitorEntryCount(...args),
      findUnique: (...args: unknown[]) => mockVisitorEntryFindUnique(...args),
      update: (...args: unknown[]) => mockVisitorEntryUpdate(...args),
    },
    amenity: {
      findUnique: (...args: unknown[]) => mockAmenityFindUnique(...args),
    },
    booking: {
      create: (...args: unknown[]) => mockBookingCreate(...args),
      findUnique: (...args: unknown[]) => mockBookingFindUnique(...args),
      update: (...args: unknown[]) => mockBookingUpdate(...args),
      findMany: (...args: unknown[]) => mockBookingFindMany(...args),
      count: (...args: unknown[]) => mockBookingCount(...args),
    },
  },
}));

vi.mock('@/schemas/package', () => ({
  createPackageSchema: {
    safeParse: vi.fn().mockImplementation((data: Record<string, unknown>) => {
      if (!data.propertyId || !data.unitId || !data.direction) {
        return {
          success: false,
          error: { flatten: () => ({ fieldErrors: { propertyId: ['Required'] } }) },
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
          error: { flatten: () => ({ fieldErrors: { releasedToName: ['Required'] } }) },
        };
      }
      return { success: true, data };
    }),
  },
}));

vi.mock('@/schemas/user', () => ({
  createUserSchema: {
    safeParse: vi.fn().mockImplementation((data: Record<string, unknown>) => {
      if (!data.email || !data.firstName || !data.lastName || !data.propertyId || !data.roleId) {
        return {
          success: false,
          error: { flatten: () => ({ fieldErrors: { email: ['Required'] } }) },
        };
      }
      return { success: true, data };
    }),
  },
  changeStatusSchema: {
    safeParse: vi.fn().mockImplementation((data: Record<string, unknown>) => {
      if (!['active', 'suspended'].includes(data.status as string)) {
        return {
          success: false,
          error: { flatten: () => ({ fieldErrors: { status: ['Invalid status'] } }) },
        };
      }
      return { success: true, data };
    }),
  },
  updateUserSchema: {
    safeParse: vi.fn().mockReturnValue({ success: true, data: {} }),
  },
}));

vi.mock('@/server/auth/password', () => ({
  hashPassword: vi.fn().mockResolvedValue('$argon2id$v=19$m=65536,t=3,p=4$hashed'),
}));

vi.mock('nanoid', () => ({
  nanoid: vi.fn().mockReturnValue('ABC123'),
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

// Mock auth guard — workflows test business logic, not auth
vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: vi.fn().mockResolvedValue({
    user: {
      userId: 'staff-001',
      propertyId: '00000000-0000-4000-b000-000000000001',
      role: 'property_admin',
      permissions: ['*'],
      mfaVerified: true,
    },
    error: null,
  }),
}));

// ---------------------------------------------------------------------------
// Import route handlers AFTER mocks are in place
// ---------------------------------------------------------------------------

import { POST as createPackage } from '@/app/api/v1/packages/route';
import { PATCH as updatePackage } from '@/app/api/v1/packages/[id]/route';
import { POST as sendReminder } from '@/app/api/v1/packages/[id]/remind/route';

import { POST as createUser } from '@/app/api/v1/users/route';
import { PATCH as updateUser } from '@/app/api/v1/users/[id]/route';

import { POST as signInVisitor, GET as listVisitors } from '@/app/api/v1/visitors/route';
import { PATCH as signOutVisitor } from '@/app/api/v1/visitors/[id]/route';

import { POST as createBooking } from '@/app/api/v1/amenities/[id]/route';
import { PATCH as updateBooking } from '@/app/api/v1/bookings/[id]/route';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROPERTY_ID = '00000000-0000-4000-b000-000000000001';
const UNIT_ID = '00000000-0000-4000-a000-000000000101';
const AMENITY_ID = '00000000-0000-4000-d000-000000000001';

// ---------------------------------------------------------------------------
// Reset all mocks before each test
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

// ===========================================================================
// WORKFLOW 1: Package Lifecycle
// Create → Send Reminder → Release
// ===========================================================================

describe('Workflow: Package Lifecycle (Create → Remind → Release)', () => {
  const packageId = 'pkg-001';

  const createdPackage = {
    id: packageId,
    propertyId: PROPERTY_ID,
    unitId: UNIT_ID,
    referenceNumber: 'PKG-ABC123',
    status: 'unreleased',
    courierId: null,
    isPerishable: false,
    isOversized: false,
    createdById: 'staff-001',
    createdAt: new Date(),
    unit: { id: UNIT_ID, number: '302' },
    courier: null,
  };

  it('Step 1: POST /api/v1/packages — creates package with status=unreleased', async () => {
    mockPackageCreate.mockResolvedValue(createdPackage);

    const req = createPostRequest('/api/v1/packages', {
      propertyId: PROPERTY_ID,
      unitId: UNIT_ID,
      direction: 'inbound',
      isPerishable: false,
      isOversized: false,
      notifyChannel: 'email',
    });

    const res = await createPackage(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{ data: { status: string; referenceNumber: string } }>(res);
    expect(body.data.status).toBe('unreleased');
    expect(body.data.referenceNumber).toBe('PKG-ABC123');
  });

  it('Step 2: POST /api/v1/packages/:id/remind — sends reminder for unreleased package', async () => {
    mockPackageFindUnique.mockResolvedValue({
      ...createdPackage,
      status: 'unreleased',
    });
    mockPackageHistoryCreate.mockResolvedValue({ id: 'history-1' });

    const req = createPostRequest(`/api/v1/packages/${packageId}/remind`, {});
    const params = Promise.resolve({ id: packageId });

    const res = await sendReminder(req, { params });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('Reminder sent');
    expect(body.message).toContain('PKG-ABC123');

    // Verify reminder was logged to PackageHistory
    expect(mockPackageHistoryCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          packageId,
          action: 'reminder_sent',
        }),
      }),
    );
  });

  it('Step 2b: Reminder FAILS for already-released package', async () => {
    mockPackageFindUnique.mockResolvedValue({
      ...createdPackage,
      status: 'released',
    });

    const req = createPostRequest(`/api/v1/packages/${packageId}/remind`, {});
    const params = Promise.resolve({ id: packageId });

    const res = await sendReminder(req, { params });
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('INVALID_STATE');
  });

  it('Step 3: PATCH /api/v1/packages/:id with action=release — releases the package', async () => {
    mockPackageUpdate.mockResolvedValue({
      ...createdPackage,
      status: 'released',
      releasedToName: 'John Smith',
      releasedAt: new Date(),
      releasedById: 'staff-001',
    });
    mockPackageHistoryCreate.mockResolvedValue({ id: 'history-2' });

    const req = createPatchRequest(`/api/v1/packages/${packageId}`, {
      action: 'release',
      releasedToName: 'John Smith',
      idVerified: true,
      isAuthorizedDelegate: false,
      releaseComments: 'Picked up at front desk',
    });
    const params = Promise.resolve({ id: packageId });

    const res = await updatePackage(req, { params });
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { status: string };
      message: string;
    }>(res);
    expect(body.data.status).toBe('released');
    expect(body.message).toContain('John Smith');

    // Verify PackageHistory entry for release
    expect(mockPackageHistoryCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          packageId,
          action: 'released',
          details: expect.stringContaining('John Smith'),
        }),
      }),
    );
  });

  it('Full workflow: PackageHistory accumulates entries for each step', async () => {
    // Step 1: Create
    mockPackageCreate.mockResolvedValue(createdPackage);
    const createReq = createPostRequest('/api/v1/packages', {
      propertyId: PROPERTY_ID,
      unitId: UNIT_ID,
      direction: 'inbound',
      isPerishable: false,
      isOversized: false,
      notifyChannel: 'email',
    });
    await createPackage(createReq);

    // Step 2: Remind
    mockPackageFindUnique.mockResolvedValue({ ...createdPackage, status: 'unreleased' });
    mockPackageHistoryCreate.mockResolvedValue({ id: 'h1' });
    const remindReq = createPostRequest(`/api/v1/packages/${packageId}/remind`, {});
    await sendReminder(remindReq, { params: Promise.resolve({ id: packageId }) });

    // Step 3: Release
    mockPackageUpdate.mockResolvedValue({ ...createdPackage, status: 'released' });
    mockPackageHistoryCreate.mockResolvedValue({ id: 'h2' });
    const releaseReq = createPatchRequest(`/api/v1/packages/${packageId}`, {
      action: 'release',
      releasedToName: 'John Smith',
      idVerified: true,
      isAuthorizedDelegate: false,
    });
    await updatePackage(releaseReq, { params: Promise.resolve({ id: packageId }) });

    // Verify PackageHistory was called for both remind and release
    const historyActions = mockPackageHistoryCreate.mock.calls.map(
      (call: unknown[]) => (call[0] as { data: { action: string } }).data.action,
    );
    expect(historyActions).toContain('reminder_sent');
    expect(historyActions).toContain('released');
    expect(mockPackageHistoryCreate).toHaveBeenCalledTimes(2);
  });
});

// ===========================================================================
// WORKFLOW 2: User Account Lifecycle
// Create → Activate → Suspend → Reactivate
// ===========================================================================

describe('Workflow: User Account Lifecycle (Create → Activate → Suspend → Reactivate)', () => {
  const userId = 'user-001';

  const validUserPayload = {
    firstName: 'Janet',
    lastName: 'Smith',
    email: 'janet@building.com',
    propertyId: PROPERTY_ID,
    roleId: '00000000-0000-4000-c000-000000010003',
    sendWelcomeEmail: true,
    languagePreference: 'en',
  };

  it('Step 1: POST /api/v1/users — creates user with status=pending', async () => {
    mockUserFindFirst.mockResolvedValue(null); // No duplicate
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      return fn({
        user: {
          create: vi.fn().mockResolvedValue({
            id: userId,
            email: 'janet@building.com',
            firstName: 'Janet',
            lastName: 'Smith',
            createdAt: new Date(),
          }),
        },
        userProperty: { create: vi.fn() },
      });
    });

    const req = createPostRequest('/api/v1/users', validUserPayload);
    const res = await createUser(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{ data: { id: string; status: string } }>(res);
    expect(body.data.id).toBe(userId);
    expect(body.data.status).toBe('pending');
  });

  it('Step 2: PATCH /api/v1/users/:id status=active — activates the user', async () => {
    mockUserUpdate.mockResolvedValue({
      id: userId,
      firstName: 'Janet',
      lastName: 'Smith',
      isActive: true,
    });

    const req = createPatchRequest(`/api/v1/users/${userId}`, { status: 'active' });
    const params = Promise.resolve({ id: userId });

    const res = await updateUser(req, { params });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { isActive: boolean }; message: string }>(res);
    expect(body.data.isActive).toBe(true);
    expect(body.message).toContain('active');

    // Verify activatedAt was set
    const updateCall = mockUserUpdate.mock.calls[0]![0] as {
      data: { isActive: boolean; activatedAt: unknown };
    };
    expect(updateCall.data.isActive).toBe(true);
    expect(updateCall.data.activatedAt).toBeInstanceOf(Date);
  });

  it('Step 3: PATCH /api/v1/users/:id status=suspended — suspends user and invalidates sessions', async () => {
    mockUserUpdate.mockResolvedValue({
      id: userId,
      firstName: 'Janet',
      lastName: 'Smith',
      isActive: false,
    });
    mockSessionUpdateMany.mockResolvedValue({ count: 3 });

    const req = createPatchRequest(`/api/v1/users/${userId}`, { status: 'suspended' });
    const params = Promise.resolve({ id: userId });

    const res = await updateUser(req, { params });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { isActive: boolean }; message: string }>(res);
    expect(body.data.isActive).toBe(false);
    expect(body.message).toContain('suspended');

    // CRITICAL: Sessions MUST be invalidated when suspending
    // A suspended user with active sessions is a security hole
    expect(mockSessionUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId,
          revokedAt: null,
        }),
        data: expect.objectContaining({
          revokedAt: expect.any(Date),
        }),
      }),
    );
  });

  it('Step 4: PATCH /api/v1/users/:id status=active — reactivates user', async () => {
    mockUserUpdate.mockResolvedValue({
      id: userId,
      firstName: 'Janet',
      lastName: 'Smith',
      isActive: true,
    });

    const req = createPatchRequest(`/api/v1/users/${userId}`, { status: 'active' });
    const params = Promise.resolve({ id: userId });

    const res = await updateUser(req, { params });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { isActive: boolean }; message: string }>(res);
    expect(body.data.isActive).toBe(true);
    expect(body.message).toContain('active');

    // Sessions should NOT be invalidated on reactivation
    // (mockSessionUpdateMany was cleared in beforeEach, so we check it wasn't called this time)
    expect(mockSessionUpdateMany).not.toHaveBeenCalled();
  });

  it('Full workflow: suspension always invalidates sessions, reactivation does not', async () => {
    // Activate
    mockUserUpdate.mockResolvedValue({
      id: userId,
      firstName: 'Janet',
      lastName: 'Smith',
      isActive: true,
    });
    await updateUser(createPatchRequest(`/api/v1/users/${userId}`, { status: 'active' }), {
      params: Promise.resolve({ id: userId }),
    });
    expect(mockSessionUpdateMany).not.toHaveBeenCalled();

    // Suspend
    mockUserUpdate.mockResolvedValue({
      id: userId,
      firstName: 'Janet',
      lastName: 'Smith',
      isActive: false,
    });
    mockSessionUpdateMany.mockResolvedValue({ count: 2 });
    await updateUser(createPatchRequest(`/api/v1/users/${userId}`, { status: 'suspended' }), {
      params: Promise.resolve({ id: userId }),
    });
    expect(mockSessionUpdateMany).toHaveBeenCalledTimes(1);

    vi.clearAllMocks();

    // Reactivate
    mockUserUpdate.mockResolvedValue({
      id: userId,
      firstName: 'Janet',
      lastName: 'Smith',
      isActive: true,
    });
    await updateUser(createPatchRequest(`/api/v1/users/${userId}`, { status: 'active' }), {
      params: Promise.resolve({ id: userId }),
    });
    expect(mockSessionUpdateMany).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// WORKFLOW 3: Visitor Lifecycle
// Sign In → Verify Active → Sign Out → Verify Gone → Double Sign-Out Fails
// ===========================================================================

describe('Workflow: Visitor Lifecycle (Sign In → Sign Out → Double Sign-Out Rejected)', () => {
  const visitorId = 'visitor-001';

  const visitorPayload = {
    propertyId: PROPERTY_ID,
    visitorName: 'Bob Jones',
    unitId: UNIT_ID,
    purpose: 'personal' as const,
    idVerified: true,
    parkingAssigned: false,
  };

  const signedInVisitor = {
    id: visitorId,
    propertyId: PROPERTY_ID,
    visitorName: 'Bob Jones',
    unitId: UNIT_ID,
    visitorType: 'personal',
    departureAt: null,
    createdAt: new Date(),
    unit: { id: UNIT_ID, number: '302' },
  };

  it('Step 1: POST /api/v1/visitors — signs in visitor', async () => {
    mockVisitorEntryCreate.mockResolvedValue(signedInVisitor);

    const req = createPostRequest('/api/v1/visitors', visitorPayload);
    const res = await signInVisitor(req);

    expect(res.status).toBe(201);
    const body = await parseResponse<{ data: { id: string }; message: string }>(res);
    expect(body.data.id).toBe(visitorId);
    expect(body.message).toContain('Bob Jones');
    expect(body.message).toContain('signed in');
  });

  it('Step 2: GET /api/v1/visitors?status=active — visitor appears in active list', async () => {
    mockVisitorEntryFindMany.mockResolvedValue([signedInVisitor]);
    mockVisitorEntryCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/visitors', {
      searchParams: { propertyId: PROPERTY_ID, status: 'active' },
    });
    const res = await listVisitors(req);

    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: { id: string }[] }>(res);
    expect(body.data).toHaveLength(1);
    expect(body.data[0]!.id).toBe(visitorId);

    // Verify the query filters for active visitors (departureAt is null)
    const where = (
      mockVisitorEntryFindMany.mock.calls[0]![0] as { where: { departureAt: unknown } }
    ).where;
    expect(where.departureAt).toBeNull();
  });

  it('Step 3: PATCH /api/v1/visitors/:id — signs out visitor', async () => {
    mockVisitorEntryFindUnique.mockResolvedValue({
      ...signedInVisitor,
      departureAt: null,
    });
    mockVisitorEntryUpdate.mockResolvedValue({
      ...signedInVisitor,
      departureAt: new Date(),
    });

    const req = createPatchRequest(`/api/v1/visitors/${visitorId}`, {});
    const params = Promise.resolve({ id: visitorId });

    const res = await signOutVisitor(req, { params });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('Bob Jones');
    expect(body.message).toContain('signed out');
  });

  it('Step 4: GET /api/v1/visitors?status=active — visitor NO LONGER in active list', async () => {
    mockVisitorEntryFindMany.mockResolvedValue([]); // Empty — visitor signed out
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

  it('Step 5: PATCH /api/v1/visitors/:id again — returns ALREADY_SIGNED_OUT', async () => {
    mockVisitorEntryFindUnique.mockResolvedValue({
      ...signedInVisitor,
      departureAt: new Date('2026-03-18T10:00:00Z'), // Already signed out
    });

    const req = createPatchRequest(`/api/v1/visitors/${visitorId}`, {});
    const params = Promise.resolve({ id: visitorId });

    const res = await signOutVisitor(req, { params });
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('ALREADY_SIGNED_OUT');
  });

  it('Full workflow: sign in → verify active → sign out → verify gone → double sign-out rejected', async () => {
    // Sign in
    mockVisitorEntryCreate.mockResolvedValue(signedInVisitor);
    const signInRes = await signInVisitor(createPostRequest('/api/v1/visitors', visitorPayload));
    expect(signInRes.status).toBe(201);

    // Verify active
    mockVisitorEntryFindMany.mockResolvedValue([signedInVisitor]);
    mockVisitorEntryCount.mockResolvedValue(1);
    const activeRes = await listVisitors(
      createGetRequest('/api/v1/visitors', {
        searchParams: { propertyId: PROPERTY_ID, status: 'active' },
      }),
    );
    const activeBody = await parseResponse<{ data: unknown[] }>(activeRes);
    expect(activeBody.data).toHaveLength(1);

    // Sign out
    mockVisitorEntryFindUnique.mockResolvedValue({ ...signedInVisitor, departureAt: null });
    mockVisitorEntryUpdate.mockResolvedValue({ ...signedInVisitor, departureAt: new Date() });
    const signOutRes = await signOutVisitor(
      createPatchRequest(`/api/v1/visitors/${visitorId}`, {}),
      { params: Promise.resolve({ id: visitorId }) },
    );
    expect(signOutRes.status).toBe(200);

    // Verify gone
    mockVisitorEntryFindMany.mockResolvedValue([]);
    mockVisitorEntryCount.mockResolvedValue(0);
    const goneRes = await listVisitors(
      createGetRequest('/api/v1/visitors', {
        searchParams: { propertyId: PROPERTY_ID, status: 'active' },
      }),
    );
    const goneBody = await parseResponse<{ data: unknown[] }>(goneRes);
    expect(goneBody.data).toHaveLength(0);

    // Double sign-out fails
    mockVisitorEntryFindUnique.mockResolvedValue({ ...signedInVisitor, departureAt: new Date() });
    const doubleRes = await signOutVisitor(
      createPatchRequest(`/api/v1/visitors/${visitorId}`, {}),
      { params: Promise.resolve({ id: visitorId }) },
    );
    expect(doubleRes.status).toBe(400);
    const doubleBody = await parseResponse<{ error: string }>(doubleRes);
    expect(doubleBody.error).toBe('ALREADY_SIGNED_OUT');
  });
});

// ===========================================================================
// WORKFLOW 4: Booking Lifecycle
// Create → Approve → Complete → Cancel (should FAIL)
// ===========================================================================

describe('Workflow: Booking Lifecycle (Create → Approve → Complete → Cancel Rejected)', () => {
  const bookingId = 'booking-001';

  const amenity = {
    id: AMENITY_ID,
    name: 'Rooftop Party Room',
    propertyId: PROPERTY_ID,
    approvalMode: 'manual',
  };

  const bookingPayload = {
    unitId: UNIT_ID,
    startDate: '2026-04-01',
    startTime: '2026-04-01T14:00:00Z',
    endDate: '2026-04-01',
    endTime: '2026-04-01T18:00:00Z',
    guestCount: 10,
    requestorComments: 'Birthday party',
  };

  it('Step 1: POST /api/v1/amenities/:id — creates booking with status=pending', async () => {
    mockAmenityFindUnique.mockResolvedValue(amenity);
    mockBookingCreate.mockResolvedValue({
      id: bookingId,
      propertyId: PROPERTY_ID,
      amenityId: AMENITY_ID,
      unitId: UNIT_ID,
      startDate: new Date('2026-04-01'),
      startTime: new Date('2026-04-01T14:00:00Z'),
      endDate: new Date('2026-04-01'),
      endTime: new Date('2026-04-01T18:00:00Z'),
      status: 'pending',
      guestCount: 10,
    });

    const req = createPostRequest(`/api/v1/amenities/${AMENITY_ID}`, bookingPayload);
    const params = Promise.resolve({ id: AMENITY_ID });

    const res = await createBooking(req, { params });
    expect(res.status).toBe(201);

    const body = await parseResponse<{ data: { status: string }; message: string }>(res);
    expect(body.data.status).toBe('pending');
    expect(body.message).toContain('approval');
  });

  it('Step 2: PATCH /api/v1/bookings/:id status=approved — admin approves booking', async () => {
    mockBookingFindUnique.mockResolvedValue({
      id: bookingId,
      status: 'pending',
    });
    mockBookingUpdate.mockResolvedValue({
      id: bookingId,
      status: 'approved',
      approvedById: 'staff-001',
      amenity: { name: 'Rooftop Party Room' },
    });

    const req = createPatchRequest(`/api/v1/bookings/${bookingId}`, { status: 'approved' });
    const params = Promise.resolve({ id: bookingId });

    const res = await updateBooking(req, { params });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { status: string } }>(res);
    expect(body.data.status).toBe('approved');

    // Verify approvedById is set
    const updateData = (mockBookingUpdate.mock.calls[0]![0] as { data: { approvedById: string } })
      .data;
    expect(updateData.approvedById).toBe('staff-001');
  });

  it('Step 3: PATCH /api/v1/bookings/:id status=completed — booking completes', async () => {
    mockBookingFindUnique.mockResolvedValue({
      id: bookingId,
      status: 'approved',
    });
    mockBookingUpdate.mockResolvedValue({
      id: bookingId,
      status: 'completed',
      amenity: { name: 'Rooftop Party Room' },
    });

    const req = createPatchRequest(`/api/v1/bookings/${bookingId}`, { status: 'completed' });
    const params = Promise.resolve({ id: bookingId });

    const res = await updateBooking(req, { params });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { status: string } }>(res);
    expect(body.data.status).toBe('completed');
  });

  it('Step 4: PATCH /api/v1/bookings/:id status=cancelled — FAILS for completed booking', async () => {
    mockBookingFindUnique.mockResolvedValue({
      id: bookingId,
      status: 'completed',
    });

    const req = createPatchRequest(`/api/v1/bookings/${bookingId}`, { status: 'cancelled' });
    const params = Promise.resolve({ id: bookingId });

    const res = await updateBooking(req, { params });
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string; message: string }>(res);
    expect(body.error).toBe('INVALID_TRANSITION');
    expect(body.message).toContain('completed');
    expect(body.message).toContain('cancelled');

    // Verify booking.update was NOT called — state was not mutated
    expect(mockBookingUpdate).not.toHaveBeenCalled();
  });

  it('Full workflow: create → approve → complete → cancel rejected', async () => {
    // Create
    mockAmenityFindUnique.mockResolvedValue(amenity);
    mockBookingCreate.mockResolvedValue({
      id: bookingId,
      status: 'pending',
      propertyId: PROPERTY_ID,
      amenityId: AMENITY_ID,
      unitId: UNIT_ID,
      startDate: new Date('2026-04-01'),
      startTime: new Date('2026-04-01T14:00:00Z'),
      endDate: new Date('2026-04-01'),
      endTime: new Date('2026-04-01T18:00:00Z'),
      guestCount: 10,
    });
    const createRes = await createBooking(
      createPostRequest(`/api/v1/amenities/${AMENITY_ID}`, bookingPayload),
      { params: Promise.resolve({ id: AMENITY_ID }) },
    );
    expect(createRes.status).toBe(201);

    // Approve
    mockBookingFindUnique.mockResolvedValue({ id: bookingId, status: 'pending' });
    mockBookingUpdate.mockResolvedValue({
      id: bookingId,
      status: 'approved',
      amenity: { name: 'Rooftop Party Room' },
    });
    const approveRes = await updateBooking(
      createPatchRequest(`/api/v1/bookings/${bookingId}`, { status: 'approved' }),
      { params: Promise.resolve({ id: bookingId }) },
    );
    expect(approveRes.status).toBe(200);

    // Complete
    mockBookingFindUnique.mockResolvedValue({ id: bookingId, status: 'approved' });
    mockBookingUpdate.mockResolvedValue({
      id: bookingId,
      status: 'completed',
      amenity: { name: 'Rooftop Party Room' },
    });
    const completeRes = await updateBooking(
      createPatchRequest(`/api/v1/bookings/${bookingId}`, { status: 'completed' }),
      { params: Promise.resolve({ id: bookingId }) },
    );
    expect(completeRes.status).toBe(200);

    // Cancel — MUST fail
    vi.clearAllMocks();
    mockBookingFindUnique.mockResolvedValue({ id: bookingId, status: 'completed' });
    const cancelRes = await updateBooking(
      createPatchRequest(`/api/v1/bookings/${bookingId}`, { status: 'cancelled' }),
      { params: Promise.resolve({ id: bookingId }) },
    );
    expect(cancelRes.status).toBe(400);
    const cancelBody = await parseResponse<{ error: string }>(cancelRes);
    expect(cancelBody.error).toBe('INVALID_TRANSITION');

    // Verify no update was made after the rejection
    expect(mockBookingUpdate).not.toHaveBeenCalled();
  });
});
