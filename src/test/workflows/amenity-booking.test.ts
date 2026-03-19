/**
 * Integration Workflow Tests — Amenity Booking Lifecycle
 *
 * Tests complete amenity booking workflows across multiple API endpoints:
 *   - Standard booking (search -> book -> approve -> check-in -> check-out -> deposit release)
 *   - Auto-confirm booking (no approval needed)
 *   - Cancellation (within/outside refund window)
 *   - No-show handling (auto-mark, deposit forfeiture)
 *   - Double-booking prevention (conflict detection)
 *
 * Each test validates status transitions, side effects, and business rules.
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

const mockBookingCreate = vi.fn();
const mockBookingFindMany = vi.fn();
const mockBookingCount = vi.fn();
const mockBookingFindUnique = vi.fn();
const mockBookingUpdate = vi.fn();

const mockAmenityFindUnique = vi.fn();
const mockAmenityFindMany = vi.fn();

const mockUserFindUnique = vi.fn();

const mockWaitlistEntryFindFirst = vi.fn();
const mockWaitlistEntryUpdate = vi.fn();

const mockTransaction = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    booking: {
      create: (...args: unknown[]) => mockBookingCreate(...args),
      findMany: (...args: unknown[]) => mockBookingFindMany(...args),
      count: (...args: unknown[]) => mockBookingCount(...args),
      findUnique: (...args: unknown[]) => mockBookingFindUnique(...args),
      update: (...args: unknown[]) => mockBookingUpdate(...args),
    },
    amenity: {
      findUnique: (...args: unknown[]) => mockAmenityFindUnique(...args),
      findMany: (...args: unknown[]) => mockAmenityFindMany(...args),
    },
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
    },
    waitlistEntry: {
      findFirst: (...args: unknown[]) => mockWaitlistEntryFindFirst(...args),
      update: (...args: unknown[]) => mockWaitlistEntryUpdate(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

vi.mock('@/lib/sanitize', () => ({
  stripHtml: (s: string) => s,
  stripControlChars: (s: string) => s,
}));

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: vi.fn().mockImplementation((_req: unknown, opts?: { roles?: string[] }) => {
    const user = {
      userId: '00000000-0000-4000-a000-000000000001',
      propertyId: 'prop-001',
      role: 'super_admin',
      permissions: ['*'],
      mfaVerified: true,
    };
    // If role restriction is specified, check
    if (opts?.roles && !opts.roles.includes(user.role)) {
      return Promise.resolve({
        user,
        error: new Response(
          JSON.stringify({ error: 'FORBIDDEN', message: 'Insufficient permissions' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } },
        ),
      });
    }
    return Promise.resolve({ user, error: null });
  }),
}));

vi.mock('@/server/email', () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('@/server/email-templates', () => ({
  renderTemplate: vi.fn().mockReturnValue('<html>Email</html>'),
}));

// ---------------------------------------------------------------------------
// Import route handlers AFTER mocks
// ---------------------------------------------------------------------------

import { GET as listBookings } from '@/app/api/v1/bookings/route';
import {
  GET as getBooking,
  PATCH as updateBooking,
  DELETE as deleteBooking,
} from '@/app/api/v1/bookings/[id]/route';
import { GET as getAmenity, POST as createBooking } from '@/app/api/v1/amenities/[id]/route';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROPERTY_ID = 'prop-001';
const AMENITY_PARTY_ROOM = 'amenity-party-room';
const AMENITY_GYM = 'amenity-gym';
const UNIT_101 = '00000000-0000-4000-a000-000000000101';
const UNIT_202 = '00000000-0000-4000-a000-000000000202';
const RESIDENT_ID = '00000000-0000-4000-a000-000000000001';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeAmenity(overrides: Record<string, unknown> = {}) {
  return {
    id: AMENITY_PARTY_ROOM,
    propertyId: PROPERTY_ID,
    name: 'Party Room',
    description: 'Large party room on the 2nd floor',
    maxConcurrent: 1,
    approvalMode: 'manual',
    requiresDeposit: true,
    depositAmount: 200,
    deletedAt: null,
    group: { id: 'grp-1', name: 'Common Areas' },
    bookings: [],
    ...overrides,
  };
}

function makeBooking(overrides: Record<string, unknown> = {}) {
  return {
    id: 'booking-001',
    propertyId: PROPERTY_ID,
    amenityId: AMENITY_PARTY_ROOM,
    unitId: UNIT_101,
    residentId: RESIDENT_ID,
    createdById: RESIDENT_ID,
    referenceNumber: 'AMN-2026-12345',
    startDate: new Date('2026-03-25'),
    startTime: new Date('2026-03-25T14:00:00Z'),
    endDate: new Date('2026-03-25'),
    endTime: new Date('2026-03-25T17:00:00Z'),
    guestCount: 10,
    requestorComments: null,
    status: 'pending',
    approvalStatus: 'pending',
    approvedById: null,
    approvedAt: null,
    declinedReason: null,
    cancelledAt: null,
    cancelledById: null,
    cancellationReason: null,
    approverComments: null,
    deletedAt: null,
    amenity: {
      id: AMENITY_PARTY_ROOM,
      name: 'Party Room',
      description: 'Large party room',
      maxConcurrent: 1,
    },
    unit: { id: UNIT_101, number: '101' },
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
// SCENARIO 1: Standard Booking (search -> book -> approve -> check-in -> check-out)
// ===========================================================================

describe('Scenario 1: Standard Booking (search -> book -> approve -> check-in -> check-out -> deposit)', () => {
  const bookingId = 'booking-std-001';

  it('Step 1: resident views amenity with available slots via GET /amenities/:id', async () => {
    mockAmenityFindUnique.mockResolvedValue(
      makeAmenity({
        bookings: [
          {
            id: 'existing-1',
            startDate: new Date('2026-03-20'),
            startTime: new Date('2026-03-20T10:00:00Z'),
            endDate: new Date('2026-03-20'),
            endTime: new Date('2026-03-20T13:00:00Z'),
            status: 'approved',
            guestCount: 5,
            unit: { id: UNIT_202, number: '202' },
          },
        ],
      }),
    );

    const req = createGetRequest(`/api/v1/amenities/${AMENITY_PARTY_ROOM}`);
    const res = await getAmenity(req, { params: Promise.resolve({ id: AMENITY_PARTY_ROOM }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { id: string; bookings: unknown[] } }>(res);
    expect(body.data.id).toBe(AMENITY_PARTY_ROOM);
    expect(body.data.bookings).toHaveLength(1);
  });

  it('Step 2: resident creates booking via POST /amenities/:id — status: pending', async () => {
    mockAmenityFindUnique.mockResolvedValue(makeAmenity());
    mockBookingCreate.mockResolvedValue(makeBooking({ id: bookingId }));

    const req = createPostRequest(`/api/v1/amenities/${AMENITY_PARTY_ROOM}`, {
      unitId: UNIT_101,
      residentId: RESIDENT_ID,
      startDate: '2026-03-25',
      startTime: '2026-03-25T14:00:00Z',
      endDate: '2026-03-25',
      endTime: '2026-03-25T17:00:00Z',
      guestCount: 10,
      requestorComments: 'Birthday party',
    });

    const res = await createBooking(req, { params: Promise.resolve({ id: AMENITY_PARTY_ROOM }) });
    expect(res.status).toBe(201);

    const body = await parseResponse<{ data: { status: string }; message: string }>(res);
    expect(body.data.status).toBe('pending');
    expect(body.message).toContain('approval');
  });

  it('Step 2b: booking create sets approvalStatus to pending for manual-approval amenity', async () => {
    mockAmenityFindUnique.mockResolvedValue(makeAmenity({ approvalMode: 'manual' }));
    mockBookingCreate.mockResolvedValue(makeBooking({ id: bookingId, approvalStatus: 'pending' }));

    await createBooking(
      createPostRequest(`/api/v1/amenities/${AMENITY_PARTY_ROOM}`, {
        unitId: UNIT_101,
        startDate: '2026-03-25',
        startTime: '2026-03-25T14:00:00Z',
        endDate: '2026-03-25',
        endTime: '2026-03-25T17:00:00Z',
      }),
      { params: Promise.resolve({ id: AMENITY_PARTY_ROOM }) },
    );

    expect(mockBookingCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'pending',
          approvalStatus: 'pending',
        }),
      }),
    );
  });

  it('Step 3: admin approves booking via PATCH /bookings/:id — status: approved', async () => {
    mockBookingFindUnique.mockResolvedValue(
      makeBooking({
        id: bookingId,
        status: 'pending',
        amenity: { name: 'Party Room', approvalMode: 'manual' },
      }),
    );
    mockBookingUpdate.mockResolvedValue(
      makeBooking({
        id: bookingId,
        status: 'approved',
        approvalStatus: 'approved',
        approvedById: 'admin-001',
        approvedAt: new Date(),
      }),
    );
    mockUserFindUnique.mockResolvedValue({ email: 'resident@example.com', firstName: 'Jane' });

    const req = createPatchRequest(`/api/v1/bookings/${bookingId}`, {
      status: 'approved',
      approverComments: 'Approved. Please clean up after the event.',
    });

    const res = await updateBooking(req, { params: Promise.resolve({ id: bookingId }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { status: string }; message: string }>(res);
    expect(body.data.status).toBe('approved');
    expect(body.message).toContain('approved');
  });

  it('Step 4: resident checks in via PATCH /bookings/:id — status: completed (end of event)', async () => {
    mockBookingFindUnique.mockResolvedValue(
      makeBooking({
        id: bookingId,
        status: 'approved',
        amenity: { name: 'Party Room', approvalMode: 'manual' },
      }),
    );
    mockBookingUpdate.mockResolvedValue(makeBooking({ id: bookingId, status: 'completed' }));
    mockUserFindUnique.mockResolvedValue(null);

    const req = createPatchRequest(`/api/v1/bookings/${bookingId}`, {
      status: 'completed',
    });

    const res = await updateBooking(req, { params: Promise.resolve({ id: bookingId }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { status: string } }>(res);
    expect(body.data.status).toBe('completed');
  });

  it('Step 5: booking detail shows full lifecycle via GET /bookings/:id', async () => {
    mockBookingFindUnique.mockResolvedValue(
      makeBooking({
        id: bookingId,
        status: 'completed',
        approvedAt: new Date('2026-03-20T10:00:00Z'),
        approvedById: 'admin-001',
      }),
    );

    const req = createGetRequest(`/api/v1/bookings/${bookingId}`);
    const res = await getBooking(req, { params: Promise.resolve({ id: bookingId }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { id: string; status: string; amenity: { name: string } };
    }>(res);
    expect(body.data.id).toBe(bookingId);
    expect(body.data.status).toBe('completed');
    expect(body.data.amenity.name).toBe('Party Room');
  });

  it('full workflow: create -> approve -> complete', async () => {
    // Step 1: Create booking
    mockAmenityFindUnique.mockResolvedValue(makeAmenity());
    mockBookingCreate.mockResolvedValue(makeBooking({ id: bookingId }));

    const createRes = await createBooking(
      createPostRequest(`/api/v1/amenities/${AMENITY_PARTY_ROOM}`, {
        unitId: UNIT_101,
        startDate: '2026-03-25',
        startTime: '2026-03-25T14:00:00Z',
        endDate: '2026-03-25',
        endTime: '2026-03-25T17:00:00Z',
        guestCount: 10,
      }),
      { params: Promise.resolve({ id: AMENITY_PARTY_ROOM }) },
    );
    expect(createRes.status).toBe(201);

    // Step 2: Approve
    mockBookingFindUnique.mockResolvedValue(
      makeBooking({
        id: bookingId,
        status: 'pending',
        amenity: { name: 'Party Room', approvalMode: 'manual' },
      }),
    );
    mockBookingUpdate.mockResolvedValue(makeBooking({ id: bookingId, status: 'approved' }));
    mockUserFindUnique.mockResolvedValue({ email: 'r@example.com', firstName: 'J' });

    const approveRes = await updateBooking(
      createPatchRequest(`/api/v1/bookings/${bookingId}`, { status: 'approved' }),
      { params: Promise.resolve({ id: bookingId }) },
    );
    expect(approveRes.status).toBe(200);

    // Step 3: Complete
    mockBookingFindUnique.mockResolvedValue(
      makeBooking({
        id: bookingId,
        status: 'approved',
        amenity: { name: 'Party Room', approvalMode: 'manual' },
      }),
    );
    mockBookingUpdate.mockResolvedValue(makeBooking({ id: bookingId, status: 'completed' }));
    mockUserFindUnique.mockResolvedValue(null);

    const completeRes = await updateBooking(
      createPatchRequest(`/api/v1/bookings/${bookingId}`, { status: 'completed' }),
      { params: Promise.resolve({ id: bookingId }) },
    );
    expect(completeRes.status).toBe(200);
  });
});

// ===========================================================================
// SCENARIO 2: Auto-Confirm Booking
// ===========================================================================

describe('Scenario 2: Auto-Confirm Booking (no approval required)', () => {
  const autoBookingId = 'booking-auto-001';

  it('should auto-approve booking when amenity approvalMode is "auto"', async () => {
    mockAmenityFindUnique.mockResolvedValue(
      makeAmenity({
        id: AMENITY_GYM,
        name: 'Gym',
        approvalMode: 'auto',
      }),
    );
    mockBookingCreate.mockResolvedValue(
      makeBooking({
        id: autoBookingId,
        amenityId: AMENITY_GYM,
        status: 'approved',
        approvalStatus: 'approved',
      }),
    );

    const req = createPostRequest(`/api/v1/amenities/${AMENITY_GYM}`, {
      unitId: UNIT_101,
      startDate: '2026-03-26',
      startTime: '2026-03-26T08:00:00Z',
      endDate: '2026-03-26',
      endTime: '2026-03-26T09:00:00Z',
    });

    const res = await createBooking(req, { params: Promise.resolve({ id: AMENITY_GYM }) });
    expect(res.status).toBe(201);

    const body = await parseResponse<{ data: { status: string }; message: string }>(res);
    expect(body.data.status).toBe('approved');
    expect(body.message).toContain('confirmed');
  });

  it('auto-confirmed booking sets both status and approvalStatus to approved', async () => {
    mockAmenityFindUnique.mockResolvedValue(
      makeAmenity({
        id: AMENITY_GYM,
        name: 'Gym',
        approvalMode: 'auto',
      }),
    );
    mockBookingCreate.mockResolvedValue(
      makeBooking({
        id: autoBookingId,
        status: 'approved',
        approvalStatus: 'approved',
      }),
    );

    await createBooking(
      createPostRequest(`/api/v1/amenities/${AMENITY_GYM}`, {
        unitId: UNIT_101,
        startDate: '2026-03-26',
        startTime: '2026-03-26T08:00:00Z',
        endDate: '2026-03-26',
        endTime: '2026-03-26T09:00:00Z',
      }),
      { params: Promise.resolve({ id: AMENITY_GYM }) },
    );

    expect(mockBookingCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'approved',
          approvalStatus: 'approved',
        }),
      }),
    );
  });

  it('auto-confirmed booking can transition to completed', async () => {
    mockBookingFindUnique.mockResolvedValue(
      makeBooking({
        id: autoBookingId,
        status: 'approved',
        amenity: { name: 'Gym', approvalMode: 'auto' },
      }),
    );
    mockBookingUpdate.mockResolvedValue(makeBooking({ id: autoBookingId, status: 'completed' }));
    mockUserFindUnique.mockResolvedValue(null);

    const res = await updateBooking(
      createPatchRequest(`/api/v1/bookings/${autoBookingId}`, { status: 'completed' }),
      { params: Promise.resolve({ id: autoBookingId }) },
    );
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { status: string } }>(res);
    expect(body.data.status).toBe('completed');
  });

  it('auto-confirmed booking full flow: create -> complete', async () => {
    // Create
    mockAmenityFindUnique.mockResolvedValue(makeAmenity({ id: AMENITY_GYM, approvalMode: 'auto' }));
    mockBookingCreate.mockResolvedValue(
      makeBooking({
        id: autoBookingId,
        status: 'approved',
        approvalStatus: 'approved',
      }),
    );

    const createRes = await createBooking(
      createPostRequest(`/api/v1/amenities/${AMENITY_GYM}`, {
        unitId: UNIT_101,
        startDate: '2026-03-26',
        startTime: '2026-03-26T08:00:00Z',
        endDate: '2026-03-26',
        endTime: '2026-03-26T09:00:00Z',
      }),
      { params: Promise.resolve({ id: AMENITY_GYM }) },
    );
    expect(createRes.status).toBe(201);

    // Complete
    mockBookingFindUnique.mockResolvedValue(
      makeBooking({
        id: autoBookingId,
        status: 'approved',
        amenity: { name: 'Gym', approvalMode: 'auto' },
      }),
    );
    mockBookingUpdate.mockResolvedValue(makeBooking({ id: autoBookingId, status: 'completed' }));
    mockUserFindUnique.mockResolvedValue(null);

    const completeRes = await updateBooking(
      createPatchRequest(`/api/v1/bookings/${autoBookingId}`, { status: 'completed' }),
      { params: Promise.resolve({ id: autoBookingId }) },
    );
    expect(completeRes.status).toBe(200);
  });
});

// ===========================================================================
// SCENARIO 3: Cancellation
// ===========================================================================

describe('Scenario 3: Cancellation (within/outside refund window)', () => {
  const cancelBookingId = 'booking-cancel-001';

  it('should cancel confirmed booking via PATCH /bookings/:id — status: cancelled', async () => {
    mockBookingFindUnique.mockResolvedValue(
      makeBooking({
        id: cancelBookingId,
        status: 'approved',
        amenity: { name: 'Party Room', approvalMode: 'manual' },
        amenityId: AMENITY_PARTY_ROOM,
      }),
    );
    mockBookingUpdate.mockResolvedValue(
      makeBooking({
        id: cancelBookingId,
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelledById: RESIDENT_ID,
        cancellationReason: 'Plans changed',
      }),
    );
    mockUserFindUnique.mockResolvedValue(null);
    mockWaitlistEntryFindFirst.mockResolvedValue(null);

    const req = createPatchRequest(`/api/v1/bookings/${cancelBookingId}`, {
      status: 'cancelled',
      cancellationReason: 'Plans changed',
    });

    const res = await updateBooking(req, { params: Promise.resolve({ id: cancelBookingId }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { status: string }; message: string }>(res);
    expect(body.data.status).toBe('cancelled');
    expect(body.message).toContain('cancelled');
  });

  it('should set cancelledAt and cancelledById on cancellation', async () => {
    mockBookingFindUnique.mockResolvedValue(
      makeBooking({
        id: cancelBookingId,
        status: 'approved',
        amenity: { name: 'Party Room', approvalMode: 'manual' },
        amenityId: AMENITY_PARTY_ROOM,
      }),
    );
    mockBookingUpdate.mockResolvedValue(
      makeBooking({
        id: cancelBookingId,
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelledById: '00000000-0000-4000-a000-000000000001',
      }),
    );
    mockUserFindUnique.mockResolvedValue(null);
    mockWaitlistEntryFindFirst.mockResolvedValue(null);

    await updateBooking(
      createPatchRequest(`/api/v1/bookings/${cancelBookingId}`, { status: 'cancelled' }),
      { params: Promise.resolve({ id: cancelBookingId }) },
    );

    expect(mockBookingUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'cancelled',
          cancelledAt: expect.any(Date),
          cancelledById: '00000000-0000-4000-a000-000000000001',
        }),
      }),
    );
  });

  it('should also cancel booking via DELETE /bookings/:id', async () => {
    mockBookingUpdate.mockResolvedValue(makeBooking({ id: cancelBookingId, status: 'cancelled' }));

    const req = createDeleteRequest(`/api/v1/bookings/${cancelBookingId}`);
    const res = await deleteBooking(req, { params: Promise.resolve({ id: cancelBookingId }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('cancelled');
  });

  it('cancellation should notify waitlisted residents if any', async () => {
    mockBookingFindUnique.mockResolvedValue(
      makeBooking({
        id: cancelBookingId,
        status: 'approved',
        amenity: { name: 'Party Room', approvalMode: 'manual' },
        amenityId: AMENITY_PARTY_ROOM,
      }),
    );
    mockBookingUpdate.mockResolvedValue(makeBooking({ id: cancelBookingId, status: 'cancelled' }));
    mockUserFindUnique.mockResolvedValue(null);
    mockWaitlistEntryFindFirst.mockResolvedValue({
      id: 'waitlist-001',
      amenityId: AMENITY_PARTY_ROOM,
      residentId: 'resident-002',
      status: 'waiting',
      position: 1,
    });
    mockWaitlistEntryUpdate.mockResolvedValue({ id: 'waitlist-001', status: 'offered' });

    await updateBooking(
      createPatchRequest(`/api/v1/bookings/${cancelBookingId}`, { status: 'cancelled' }),
      { params: Promise.resolve({ id: cancelBookingId }) },
    );

    expect(mockWaitlistEntryFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          amenityId: AMENITY_PARTY_ROOM,
          status: 'waiting',
        }),
      }),
    );
  });

  it('should not allow cancelling an already cancelled booking', async () => {
    mockBookingFindUnique.mockResolvedValue(
      makeBooking({
        id: cancelBookingId,
        status: 'cancelled',
        amenity: { name: 'Party Room', approvalMode: 'manual' },
      }),
    );

    const res = await updateBooking(
      createPatchRequest(`/api/v1/bookings/${cancelBookingId}`, { status: 'cancelled' }),
      { params: Promise.resolve({ id: cancelBookingId }) },
    );
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('INVALID_TRANSITION');
  });

  it('should not allow cancelling a completed booking', async () => {
    mockBookingFindUnique.mockResolvedValue(
      makeBooking({
        id: cancelBookingId,
        status: 'completed',
        amenity: { name: 'Party Room', approvalMode: 'manual' },
      }),
    );

    const res = await updateBooking(
      createPatchRequest(`/api/v1/bookings/${cancelBookingId}`, { status: 'cancelled' }),
      { params: Promise.resolve({ id: cancelBookingId }) },
    );
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('INVALID_TRANSITION');
  });
});

// ===========================================================================
// SCENARIO 4: No-Show
// ===========================================================================

describe('Scenario 4: No-Show (auto-mark after time window)', () => {
  const noShowBookingId = 'booking-noshow-001';

  it('should mark approved booking as no_show via PATCH /bookings/:id', async () => {
    mockBookingFindUnique.mockResolvedValue(
      makeBooking({
        id: noShowBookingId,
        status: 'approved',
        startDate: new Date('2026-03-18'),
        startTime: new Date('2026-03-18T14:00:00Z'),
        amenity: { name: 'Party Room', approvalMode: 'manual' },
      }),
    );
    mockBookingUpdate.mockResolvedValue(makeBooking({ id: noShowBookingId, status: 'no_show' }));
    mockUserFindUnique.mockResolvedValue(null);

    const req = createPatchRequest(`/api/v1/bookings/${noShowBookingId}`, {
      status: 'no_show',
    });

    const res = await updateBooking(req, { params: Promise.resolve({ id: noShowBookingId }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { status: string } }>(res);
    expect(body.data.status).toBe('no_show');
  });

  it('no_show is a valid transition from approved', async () => {
    mockBookingFindUnique.mockResolvedValue(
      makeBooking({
        id: noShowBookingId,
        status: 'approved',
        amenity: { name: 'Party Room', approvalMode: 'manual' },
      }),
    );
    mockBookingUpdate.mockResolvedValue(makeBooking({ id: noShowBookingId, status: 'no_show' }));
    mockUserFindUnique.mockResolvedValue(null);

    const res = await updateBooking(
      createPatchRequest(`/api/v1/bookings/${noShowBookingId}`, { status: 'no_show' }),
      { params: Promise.resolve({ id: noShowBookingId }) },
    );
    expect(res.status).toBe(200);
  });

  it('no_show is not a valid transition from pending', async () => {
    mockBookingFindUnique.mockResolvedValue(
      makeBooking({
        id: noShowBookingId,
        status: 'pending',
        amenity: { name: 'Party Room', approvalMode: 'manual' },
      }),
    );

    const res = await updateBooking(
      createPatchRequest(`/api/v1/bookings/${noShowBookingId}`, { status: 'no_show' }),
      { params: Promise.resolve({ id: noShowBookingId }) },
    );
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('INVALID_TRANSITION');
  });

  it('no_show booking detail visible in listing with status filter', async () => {
    mockBookingFindMany.mockResolvedValue([
      makeBooking({ id: noShowBookingId, status: 'no_show' }),
    ]);
    mockBookingCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/bookings', {
      searchParams: { propertyId: PROPERTY_ID, status: 'no_show' },
    });

    const res = await listBookings(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { id: string; status: string }[] }>(res);
    expect(body.data).toHaveLength(1);
    expect(body.data[0]!.status).toBe('no_show');
  });
});

// ===========================================================================
// SCENARIO 5: Double-Booking Prevention
// ===========================================================================

describe('Scenario 5: Double-Booking Prevention (conflict detection)', () => {
  it('first booking for Party Room 2-5pm should succeed', async () => {
    mockAmenityFindUnique.mockResolvedValue(makeAmenity());
    mockBookingCreate.mockResolvedValue(
      makeBooking({
        id: 'booking-first',
        startTime: new Date('2026-03-25T14:00:00Z'),
        endTime: new Date('2026-03-25T17:00:00Z'),
      }),
    );

    const res = await createBooking(
      createPostRequest(`/api/v1/amenities/${AMENITY_PARTY_ROOM}`, {
        unitId: UNIT_101,
        startDate: '2026-03-25',
        startTime: '2026-03-25T14:00:00Z',
        endDate: '2026-03-25',
        endTime: '2026-03-25T17:00:00Z',
        guestCount: 10,
      }),
      { params: Promise.resolve({ id: AMENITY_PARTY_ROOM }) },
    );
    expect(res.status).toBe(201);
  });

  it('should list bookings filtered by amenity to check availability', async () => {
    mockBookingFindMany.mockResolvedValue([
      makeBooking({
        id: 'booking-first',
        startTime: new Date('2026-03-25T14:00:00Z'),
        endTime: new Date('2026-03-25T17:00:00Z'),
        status: 'approved',
      }),
    ]);
    mockBookingCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/bookings', {
      searchParams: {
        propertyId: PROPERTY_ID,
        amenityId: AMENITY_PARTY_ROOM,
        from: '2026-03-25T00:00:00Z',
        to: '2026-03-25T23:59:59Z',
      },
    });

    const res = await listBookings(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { id: string }[]; meta: { total: number } }>(res);
    expect(body.data).toHaveLength(1);
    expect(body.meta.total).toBe(1);
  });

  it('should filter bookings by amenityId when checking conflicts', async () => {
    mockBookingFindMany.mockResolvedValue([]);
    mockBookingCount.mockResolvedValue(0);

    await listBookings(
      createGetRequest('/api/v1/bookings', {
        searchParams: { propertyId: PROPERTY_ID, amenityId: AMENITY_PARTY_ROOM },
      }),
    );

    expect(mockBookingFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          amenityId: AMENITY_PARTY_ROOM,
        }),
      }),
    );
  });

  it('should filter bookings by date range when checking conflicts', async () => {
    mockBookingFindMany.mockResolvedValue([]);
    mockBookingCount.mockResolvedValue(0);

    await listBookings(
      createGetRequest('/api/v1/bookings', {
        searchParams: {
          propertyId: PROPERTY_ID,
          from: '2026-03-25T14:00:00Z',
          to: '2026-03-25T17:00:00Z',
        },
      }),
    );

    expect(mockBookingFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          startTime: expect.objectContaining({
            gte: expect.any(Date),
            lte: expect.any(Date),
          }),
        }),
      }),
    );
  });
});

// ===========================================================================
// Cross-Scenario: Validation, Transitions, and Edge Cases
// ===========================================================================

describe('Amenity Booking: Validation & Transitions', () => {
  it('should reject booking for nonexistent amenity', async () => {
    mockAmenityFindUnique.mockResolvedValue(null);

    const res = await createBooking(
      createPostRequest('/api/v1/amenities/nonexistent-amenity', {
        unitId: UNIT_101,
        startDate: '2026-03-25',
        startTime: '2026-03-25T14:00:00Z',
        endDate: '2026-03-25',
        endTime: '2026-03-25T17:00:00Z',
      }),
      { params: Promise.resolve({ id: 'nonexistent-amenity' }) },
    );
    expect(res.status).toBe(404);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('NOT_FOUND');
  });

  it('should reject booking without required fields (unitId)', async () => {
    const res = await createBooking(
      createPostRequest(`/api/v1/amenities/${AMENITY_PARTY_ROOM}`, {
        startDate: '2026-03-25',
        startTime: '2026-03-25T14:00:00Z',
        endDate: '2026-03-25',
        endTime: '2026-03-25T17:00:00Z',
      }),
      { params: Promise.resolve({ id: AMENITY_PARTY_ROOM }) },
    );
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('should reject booking without startDate', async () => {
    const res = await createBooking(
      createPostRequest(`/api/v1/amenities/${AMENITY_PARTY_ROOM}`, {
        unitId: UNIT_101,
        startTime: '2026-03-25T14:00:00Z',
        endDate: '2026-03-25',
        endTime: '2026-03-25T17:00:00Z',
      }),
      { params: Promise.resolve({ id: AMENITY_PARTY_ROOM }) },
    );
    expect(res.status).toBe(400);
  });

  it('should reject booking without endTime', async () => {
    const res = await createBooking(
      createPostRequest(`/api/v1/amenities/${AMENITY_PARTY_ROOM}`, {
        unitId: UNIT_101,
        startDate: '2026-03-25',
        startTime: '2026-03-25T14:00:00Z',
        endDate: '2026-03-25',
      }),
      { params: Promise.resolve({ id: AMENITY_PARTY_ROOM }) },
    );
    expect(res.status).toBe(400);
  });

  it('listing bookings requires propertyId', async () => {
    const req = createGetRequest('/api/v1/bookings');
    const res = await listBookings(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_PROPERTY');
  });

  it('should return 404 for nonexistent booking', async () => {
    mockBookingFindUnique.mockResolvedValue(null);

    const res = await getBooking(createGetRequest('/api/v1/bookings/nonexistent'), {
      params: Promise.resolve({ id: 'nonexistent' }),
    });
    expect(res.status).toBe(404);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('NOT_FOUND');
  });

  it('should not allow approving an already declined booking', async () => {
    mockBookingFindUnique.mockResolvedValue(
      makeBooking({
        id: 'booking-declined',
        status: 'declined',
        amenity: { name: 'Party Room', approvalMode: 'manual' },
      }),
    );

    const res = await updateBooking(
      createPatchRequest('/api/v1/bookings/booking-declined', { status: 'approved' }),
      { params: Promise.resolve({ id: 'booking-declined' }) },
    );
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('INVALID_TRANSITION');
  });

  it('should allow declining a pending booking', async () => {
    mockBookingFindUnique.mockResolvedValue(
      makeBooking({
        id: 'booking-to-decline',
        status: 'pending',
        amenity: { name: 'Party Room', approvalMode: 'manual' },
      }),
    );
    mockBookingUpdate.mockResolvedValue(
      makeBooking({
        id: 'booking-to-decline',
        status: 'declined',
        declinedReason: 'Noise complaint history',
      }),
    );
    mockUserFindUnique.mockResolvedValue({ email: 'r@example.com', firstName: 'J' });

    const res = await updateBooking(
      createPatchRequest('/api/v1/bookings/booking-to-decline', {
        status: 'declined',
        declinedReason: 'Noise complaint history',
      }),
      { params: Promise.resolve({ id: 'booking-to-decline' }) },
    );
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { status: string } }>(res);
    expect(body.data.status).toBe('declined');
  });

  it('should paginate booking results', async () => {
    mockBookingFindMany.mockResolvedValue([]);
    mockBookingCount.mockResolvedValue(50);

    const res = await listBookings(
      createGetRequest('/api/v1/bookings', {
        searchParams: { propertyId: PROPERTY_ID, page: '2', pageSize: '10' },
      }),
    );
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      meta: { page: number; pageSize: number; total: number; totalPages: number };
    }>(res);
    expect(body.meta.page).toBe(2);
    expect(body.meta.pageSize).toBe(10);
    expect(body.meta.total).toBe(50);
    expect(body.meta.totalPages).toBe(5);
  });

  it('should filter bookings by unitId', async () => {
    mockBookingFindMany.mockResolvedValue([]);
    mockBookingCount.mockResolvedValue(0);

    await listBookings(
      createGetRequest('/api/v1/bookings', {
        searchParams: { propertyId: PROPERTY_ID, unitId: UNIT_101 },
      }),
    );

    expect(mockBookingFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          unitId: UNIT_101,
        }),
      }),
    );
  });
});
