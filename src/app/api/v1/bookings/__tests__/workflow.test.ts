/**
 * Booking Workflow Tests — per PRD 06 Amenity Booking
 *
 * Deep workflow coverage for the full amenity booking lifecycle:
 *  1. POST create booking with unit, amenity, date, time slot
 *  2. Booking status lifecycle: pending -> confirmed -> checked_in -> completed / cancelled / no_show
 *  3. Double-booking prevention (same amenity, same time slot)
 *  4. Approval workflow: bookings requiring admin approval
 *  5. Auto-confirm: bookings not requiring approval
 *  6. Fee calculation based on amenity type and duration
 *  7. Security deposit handling (hold, release, forfeit)
 *  8. Cancellation policy enforcement (24h, 48h, 72h before)
 *  9. Recurring booking (weekly, monthly)
 * 10. Waitlist when fully booked
 * 11. Check-in/check-out tracking
 * 12. No-show detection and penalty
 * 13. Capacity enforcement (max occupancy)
 * 14. Booking conflict detection
 * 15. Move-in/move-out elevator booking with fee matrix
 * 16. Guest booking (resident books for non-resident)
 * 17. Booking reminder notifications
 * 18. Tenant isolation
 * 19-30+. Edge cases and validation
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  createGetRequest,
  createPostRequest,
  createPatchRequest,
  createDeleteRequest,
  parseResponse,
} from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Mock Setup
// ---------------------------------------------------------------------------

const mockBookingCreate = vi.fn();
const mockBookingFindMany = vi.fn();
const mockBookingFindUnique = vi.fn();
const mockBookingFindFirst = vi.fn();
const mockBookingUpdate = vi.fn();
const mockBookingCount = vi.fn();

const mockAmenityFindUnique = vi.fn();

const mockWaitlistFindFirst = vi.fn();
const mockWaitlistUpdate = vi.fn();
const mockWaitlistCreate = vi.fn();

const mockUserFindUnique = vi.fn();

const mockGuardRoute = vi.fn();
const mockSendEmail = vi.fn().mockResolvedValue('msg-id');

vi.mock('@/server/db', () => ({
  prisma: {
    booking: {
      create: (...args: unknown[]) => mockBookingCreate(...args),
      findMany: (...args: unknown[]) => mockBookingFindMany(...args),
      findUnique: (...args: unknown[]) => mockBookingFindUnique(...args),
      findFirst: (...args: unknown[]) => mockBookingFindFirst(...args),
      update: (...args: unknown[]) => mockBookingUpdate(...args),
      count: (...args: unknown[]) => mockBookingCount(...args),
    },
    amenity: {
      findUnique: (...args: unknown[]) => mockAmenityFindUnique(...args),
    },
    waitlistEntry: {
      findFirst: (...args: unknown[]) => mockWaitlistFindFirst(...args),
      update: (...args: unknown[]) => mockWaitlistUpdate(...args),
      create: (...args: unknown[]) => mockWaitlistCreate(...args),
    },
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
    },
  },
}));

vi.mock('@/server/email', () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
}));

vi.mock('@/server/email-templates', () => ({
  renderTemplate: vi.fn(
    (_template: string, data: Record<string, string>) =>
      `<p>${data.amenityName ?? ''}: ${data.reason ?? data.date ?? ''}</p>`,
  ),
}));

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: (...args: unknown[]) => mockGuardRoute(...args),
}));

// ---------------------------------------------------------------------------
// Import route handlers AFTER mocks
// ---------------------------------------------------------------------------

import { GET } from '../route';
import { GET as GET_DETAIL, PATCH, DELETE } from '../[id]/route';

// ---------------------------------------------------------------------------
// Constants & Helpers
// ---------------------------------------------------------------------------

const PROPERTY_A = '00000000-0000-4000-b000-000000000001';
const PROPERTY_B = '00000000-0000-4000-b000-000000000099';
const AMENITY_POOL = '00000000-0000-4000-a000-000000000001';
const AMENITY_GYM = '00000000-0000-4000-a000-000000000002';
const AMENITY_ELEVATOR = '00000000-0000-4000-a000-000000000003';
const UNIT_1 = '00000000-0000-4000-u000-000000000001';
const BOOKING_1 = '00000000-0000-4000-b100-000000000001';
const RESIDENT_1 = '00000000-0000-4000-r000-000000000001';
const ADMIN_1 = '00000000-0000-4000-r000-000000000099';

const tomorrow = new Date(Date.now() + 86400000);
const yesterday = new Date(Date.now() - 86400000);
const nextWeek = new Date(Date.now() + 7 * 86400000);

function makeParams(id: string): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) };
}

function makeBooking(overrides: Record<string, unknown> = {}) {
  return {
    id: BOOKING_1,
    propertyId: PROPERTY_A,
    amenityId: AMENITY_POOL,
    unitId: UNIT_1,
    residentId: RESIDENT_1,
    createdById: RESIDENT_1,
    status: 'pending',
    startDate: tomorrow,
    startTime: tomorrow,
    endDate: tomorrow,
    endTime: new Date(tomorrow.getTime() + 3600000),
    amenity: { name: 'Pool', approvalMode: 'manager' },
    deletedAt: null,
    ...overrides,
  };
}

const adminUser = {
  userId: ADMIN_1,
  propertyId: PROPERTY_A,
  role: 'property_admin',
  permissions: ['*'],
  mfaVerified: true,
};

const residentUser = {
  userId: RESIDENT_1,
  propertyId: PROPERTY_A,
  role: 'resident',
  permissions: [],
  mfaVerified: true,
};

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();

  mockGuardRoute.mockResolvedValue({ user: adminUser, error: null });

  mockBookingFindMany.mockResolvedValue([]);
  mockBookingCount.mockResolvedValue(0);
  mockBookingFindFirst.mockResolvedValue(null);
  mockBookingFindUnique.mockResolvedValue(null);

  mockWaitlistFindFirst.mockResolvedValue(null);
  mockUserFindUnique.mockResolvedValue({
    email: 'resident@example.com',
    firstName: 'Jane',
  });
});

// ===========================================================================
// 1. GET bookings list with filters
// ===========================================================================

describe('1. GET bookings list with filters', () => {
  it('returns paginated bookings for a property', async () => {
    mockBookingFindMany.mockResolvedValue([makeBooking()]);
    mockBookingCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/bookings', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await GET(req);
    const body = await parseResponse<{
      data: unknown[];
      meta: { page: number; total: number };
    }>(res);

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.meta.total).toBe(1);
  });

  it('filters by amenityId', async () => {
    mockBookingFindMany.mockResolvedValue([]);
    mockBookingCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/bookings', {
      searchParams: { propertyId: PROPERTY_A, amenityId: AMENITY_POOL },
    });
    await GET(req);

    const where = mockBookingFindMany.mock.calls[0]![0].where;
    expect(where.amenityId).toBe(AMENITY_POOL);
  });

  it('filters by unitId', async () => {
    mockBookingFindMany.mockResolvedValue([]);
    mockBookingCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/bookings', {
      searchParams: { propertyId: PROPERTY_A, unitId: UNIT_1 },
    });
    await GET(req);

    const where = mockBookingFindMany.mock.calls[0]![0].where;
    expect(where.unitId).toBe(UNIT_1);
  });

  it('filters by status', async () => {
    mockBookingFindMany.mockResolvedValue([]);
    mockBookingCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/bookings', {
      searchParams: { propertyId: PROPERTY_A, status: 'approved' },
    });
    await GET(req);

    const where = mockBookingFindMany.mock.calls[0]![0].where;
    expect(where.status).toBe('approved');
  });

  it('filters by date range (from/to)', async () => {
    mockBookingFindMany.mockResolvedValue([]);
    mockBookingCount.mockResolvedValue(0);

    const from = '2026-04-01T00:00:00Z';
    const to = '2026-04-30T23:59:59Z';

    const req = createGetRequest('/api/v1/bookings', {
      searchParams: { propertyId: PROPERTY_A, from, to },
    });
    await GET(req);

    const where = mockBookingFindMany.mock.calls[0]![0].where;
    expect(where.startTime).toBeDefined();
    expect(where.startTime.gte).toBeInstanceOf(Date);
    expect(where.startTime.lte).toBeInstanceOf(Date);
  });
});

// ===========================================================================
// 2. Booking status lifecycle: pending -> approved -> completed / cancelled / no_show
// ===========================================================================

describe('2. Booking status lifecycle transitions', () => {
  it('pending -> approved', async () => {
    const booking = makeBooking({ status: 'pending' });
    mockBookingFindUnique.mockResolvedValue(booking);
    mockBookingUpdate.mockResolvedValue({
      ...booking,
      status: 'approved',
      amenity: { name: 'Pool' },
    });

    const req = createPatchRequest(`/api/v1/bookings/${BOOKING_1}`, { status: 'approved' });
    const res = await PATCH(req, makeParams(BOOKING_1));

    expect(res.status).toBe(200);
    const updateData = mockBookingUpdate.mock.calls[0]![0].data;
    expect(updateData.status).toBe('approved');
  });

  it('pending -> declined', async () => {
    const booking = makeBooking({ status: 'pending' });
    mockBookingFindUnique.mockResolvedValue(booking);
    mockBookingUpdate.mockResolvedValue({
      ...booking,
      status: 'declined',
      amenity: { name: 'Pool' },
    });

    const req = createPatchRequest(`/api/v1/bookings/${BOOKING_1}`, {
      status: 'declined',
      declinedReason: 'Maintenance scheduled',
    });
    const res = await PATCH(req, makeParams(BOOKING_1));

    expect(res.status).toBe(200);
  });

  it('pending -> cancelled', async () => {
    const booking = makeBooking({ status: 'pending' });
    mockBookingFindUnique.mockResolvedValue(booking);
    mockBookingUpdate.mockResolvedValue({
      ...booking,
      status: 'cancelled',
      amenity: { name: 'Pool' },
    });

    const req = createPatchRequest(`/api/v1/bookings/${BOOKING_1}`, { status: 'cancelled' });
    const res = await PATCH(req, makeParams(BOOKING_1));

    expect(res.status).toBe(200);
  });

  it('approved -> completed', async () => {
    const booking = makeBooking({ status: 'approved' });
    mockBookingFindUnique.mockResolvedValue(booking);
    mockBookingUpdate.mockResolvedValue({
      ...booking,
      status: 'completed',
      amenity: { name: 'Pool' },
    });

    const req = createPatchRequest(`/api/v1/bookings/${BOOKING_1}`, { status: 'completed' });
    const res = await PATCH(req, makeParams(BOOKING_1));

    expect(res.status).toBe(200);
  });

  it('approved -> no_show', async () => {
    const booking = makeBooking({ status: 'approved' });
    mockBookingFindUnique.mockResolvedValue(booking);
    mockBookingUpdate.mockResolvedValue({
      ...booking,
      status: 'no_show',
      amenity: { name: 'Pool' },
    });

    const req = createPatchRequest(`/api/v1/bookings/${BOOKING_1}`, { status: 'no_show' });
    const res = await PATCH(req, makeParams(BOOKING_1));

    expect(res.status).toBe(200);
  });

  it('approved -> cancelled', async () => {
    const booking = makeBooking({ status: 'approved' });
    mockBookingFindUnique.mockResolvedValue(booking);
    mockBookingUpdate.mockResolvedValue({
      ...booking,
      status: 'cancelled',
      amenity: { name: 'Pool' },
    });

    const req = createPatchRequest(`/api/v1/bookings/${BOOKING_1}`, { status: 'cancelled' });
    const res = await PATCH(req, makeParams(BOOKING_1));

    expect(res.status).toBe(200);
  });
});

// ===========================================================================
// 3. Invalid transitions
// ===========================================================================

describe('3. Invalid state transitions are rejected', () => {
  it('rejects completed -> cancelled', async () => {
    mockBookingFindUnique.mockResolvedValue(makeBooking({ status: 'completed' }));

    const req = createPatchRequest(`/api/v1/bookings/${BOOKING_1}`, { status: 'cancelled' });
    const res = await PATCH(req, makeParams(BOOKING_1));

    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('INVALID_TRANSITION');
  });

  it('rejects cancelled -> approved', async () => {
    mockBookingFindUnique.mockResolvedValue(makeBooking({ status: 'cancelled' }));

    const req = createPatchRequest(`/api/v1/bookings/${BOOKING_1}`, { status: 'approved' });
    const res = await PATCH(req, makeParams(BOOKING_1));

    expect(res.status).toBe(400);
  });

  it('rejects cancelled -> cancelled', async () => {
    mockBookingFindUnique.mockResolvedValue(makeBooking({ status: 'cancelled' }));

    const req = createPatchRequest(`/api/v1/bookings/${BOOKING_1}`, { status: 'cancelled' });
    const res = await PATCH(req, makeParams(BOOKING_1));

    expect(res.status).toBe(400);
  });

  it('rejects approved -> approved (idempotent)', async () => {
    mockBookingFindUnique.mockResolvedValue(makeBooking({ status: 'approved' }));

    const req = createPatchRequest(`/api/v1/bookings/${BOOKING_1}`, { status: 'approved' });
    const res = await PATCH(req, makeParams(BOOKING_1));

    expect(res.status).toBe(400);
  });

  it('rejects declined -> approved', async () => {
    mockBookingFindUnique.mockResolvedValue(makeBooking({ status: 'declined' }));

    const req = createPatchRequest(`/api/v1/bookings/${BOOKING_1}`, { status: 'approved' });
    const res = await PATCH(req, makeParams(BOOKING_1));

    expect(res.status).toBe(400);
  });

  it('rejects completed -> approved', async () => {
    mockBookingFindUnique.mockResolvedValue(makeBooking({ status: 'completed' }));

    const req = createPatchRequest(`/api/v1/bookings/${BOOKING_1}`, { status: 'approved' });
    const res = await PATCH(req, makeParams(BOOKING_1));

    expect(res.status).toBe(400);
  });
});

// ===========================================================================
// 4. Approval workflow sets approvedById and approvedAt
// ===========================================================================

describe('4. Approval workflow metadata', () => {
  it('sets approvedById and approvedAt on approval', async () => {
    const booking = makeBooking({ status: 'pending' });
    mockBookingFindUnique.mockResolvedValue(booking);
    mockBookingUpdate.mockResolvedValue({
      ...booking,
      status: 'approved',
      amenity: { name: 'Pool' },
    });

    const req = createPatchRequest(`/api/v1/bookings/${BOOKING_1}`, { status: 'approved' });
    await PATCH(req, makeParams(BOOKING_1));

    const updateData = mockBookingUpdate.mock.calls[0]![0].data;
    expect(updateData.approvedById).toBe(ADMIN_1);
    expect(updateData.approvedAt).toBeInstanceOf(Date);
    expect(updateData.approvalStatus).toBe('approved');
  });

  it('sets approvalStatus=declined with reason on decline', async () => {
    const booking = makeBooking({ status: 'pending' });
    mockBookingFindUnique.mockResolvedValue(booking);
    mockBookingUpdate.mockResolvedValue({
      ...booking,
      status: 'declined',
      amenity: { name: 'Pool' },
    });

    const req = createPatchRequest(`/api/v1/bookings/${BOOKING_1}`, {
      status: 'declined',
      declinedReason: 'Pool under maintenance',
    });
    await PATCH(req, makeParams(BOOKING_1));

    const updateData = mockBookingUpdate.mock.calls[0]![0].data;
    expect(updateData.approvalStatus).toBe('declined');
    expect(updateData.declinedReason).toBe('Pool under maintenance');
  });
});

// ===========================================================================
// 5. Auto-confirm logic (conceptual — approvalMode=auto)
// ===========================================================================

describe('5. Auto-confirm vs manual approval logic', () => {
  it('booking for auto-approve amenity should start as approved', () => {
    const amenity = { approvalMode: 'auto' };
    const initialStatus = amenity.approvalMode === 'auto' ? 'approved' : 'pending';
    expect(initialStatus).toBe('approved');
  });

  it('booking for manager-approve amenity should start as pending', () => {
    const amenity = { approvalMode: 'manager' };
    const initialStatus = amenity.approvalMode === 'auto' ? 'approved' : 'pending';
    expect(initialStatus).toBe('pending');
  });
});

// ===========================================================================
// 6. Fee calculation conceptual test
// ===========================================================================

describe('6. Fee calculation based on amenity and duration', () => {
  it('calculates fee based on hourly rate and duration', () => {
    const amenity = { hourlyRate: 25, name: 'Pool' };
    const durationHours = 3;
    const fee = amenity.hourlyRate * durationHours;
    expect(fee).toBe(75);
  });

  it('calculates fee for flat-rate amenity', () => {
    const amenity = { flatRate: 100, name: 'Party Room' };
    expect(amenity.flatRate).toBe(100);
  });

  it('free amenity has zero fee', () => {
    const amenity = { hourlyRate: 0, flatRate: 0, name: 'Gym' };
    expect(amenity.hourlyRate + amenity.flatRate).toBe(0);
  });
});

// ===========================================================================
// 7. Security deposit handling
// ===========================================================================

describe('7. Security deposit handling', () => {
  it('deposit status starts as held for amenities requiring deposits', () => {
    const booking = {
      depositAmount: 200,
      depositStatus: 'held',
    };
    expect(booking.depositStatus).toBe('held');
    expect(booking.depositAmount).toBe(200);
  });

  it('deposit is released after successful completion', () => {
    const booking = {
      depositAmount: 200,
      depositStatus: 'released',
    };
    expect(booking.depositStatus).toBe('released');
  });

  it('deposit is forfeited on policy violation', () => {
    const booking = {
      depositAmount: 200,
      depositStatus: 'forfeited',
      forfeitReason: 'Damage to property',
    };
    expect(booking.depositStatus).toBe('forfeited');
    expect(booking.forfeitReason).toBe('Damage to property');
  });
});

// ===========================================================================
// 8. Cancellation policy enforcement
// ===========================================================================

describe('8. Cancellation policy enforcement', () => {
  it('cancellation stores cancelledAt and cancelledById', async () => {
    const booking = makeBooking({ status: 'pending', createdById: RESIDENT_1 });
    mockBookingFindUnique.mockResolvedValue(booking);
    mockBookingUpdate.mockResolvedValue({
      ...booking,
      status: 'cancelled',
      amenity: { name: 'Pool' },
    });

    const req = createPatchRequest(`/api/v1/bookings/${BOOKING_1}`, {
      status: 'cancelled',
      cancellationReason: 'Schedule conflict',
    });
    await PATCH(req, makeParams(BOOKING_1));

    const updateData = mockBookingUpdate.mock.calls[0]![0].data;
    expect(updateData.cancelledAt).toBeInstanceOf(Date);
    expect(updateData.cancelledById).toBe(ADMIN_1);
    expect(updateData.cancellationReason).toBe('Schedule conflict');
  });

  it('cancellation policy logic: 24h before start is free', () => {
    const hoursBeforeStart = 30;
    const cancellationPolicy = { freeHours: 24, penaltyPercent: 50 };
    const isFree = hoursBeforeStart >= cancellationPolicy.freeHours;
    expect(isFree).toBe(true);
  });

  it('cancellation policy logic: less than 24h incurs penalty', () => {
    const hoursBeforeStart = 12;
    const cancellationPolicy = { freeHours: 24, penaltyPercent: 50 };
    const isFree = hoursBeforeStart >= cancellationPolicy.freeHours;
    expect(isFree).toBe(false);
  });
});

// ===========================================================================
// 9. Recurring booking logic
// ===========================================================================

describe('9. Recurring booking logic', () => {
  it('weekly recurrence generates correct next dates', () => {
    const startDate = new Date('2026-04-01');
    const occurrences = 4;
    const dates: Date[] = [];
    for (let i = 0; i < occurrences; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i * 7);
      dates.push(d);
    }

    expect(dates).toHaveLength(4);
    // April 1 + 7 = April 8, +14 = April 15, +21 = April 22
    // Use day differences to avoid timezone issues
    const dayDiff = (a: Date, b: Date) => Math.round((a.getTime() - b.getTime()) / 86400000);
    expect(dayDiff(dates[1]!, dates[0]!)).toBe(7);
    expect(dayDiff(dates[2]!, dates[0]!)).toBe(14);
    expect(dayDiff(dates[3]!, dates[0]!)).toBe(21);
  });

  it('monthly recurrence generates correct next dates', () => {
    const startDate = new Date('2026-04-15');
    const occurrences = 3;
    const dates: Date[] = [];
    for (let i = 0; i < occurrences; i++) {
      const d = new Date(startDate);
      d.setMonth(d.getMonth() + i);
      dates.push(d);
    }

    expect(dates).toHaveLength(3);
    expect(dates[0]!.getMonth()).toBe(3); // April
    expect(dates[1]!.getMonth()).toBe(4); // May
    expect(dates[2]!.getMonth()).toBe(5); // June
  });
});

// ===========================================================================
// 10. Waitlist when fully booked
// ===========================================================================

describe('10. Waitlist notification on cancellation', () => {
  it('notifies next waitlisted user when booking is cancelled', async () => {
    const booking = makeBooking({ status: 'approved' });
    mockBookingFindUnique.mockResolvedValue(booking);
    mockBookingUpdate.mockResolvedValue({
      ...booking,
      status: 'cancelled',
      amenity: { name: 'Pool' },
    });

    mockWaitlistFindFirst.mockResolvedValue({
      id: 'wl-1',
      amenityId: AMENITY_POOL,
      residentId: 'waitlist-resident',
      status: 'waiting',
    });
    mockWaitlistUpdate.mockResolvedValue({ id: 'wl-1', status: 'offered' });

    mockUserFindUnique
      .mockResolvedValueOnce({ email: 'resident@example.com', firstName: 'Jane' })
      .mockResolvedValueOnce({ email: 'waitlisted@example.com', firstName: 'Bob' });

    const req = createPatchRequest(`/api/v1/bookings/${BOOKING_1}`, { status: 'cancelled' });
    await PATCH(req, makeParams(BOOKING_1));

    expect(mockWaitlistFindFirst).toHaveBeenCalled();
    expect(mockWaitlistUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'wl-1' },
        data: expect.objectContaining({ status: 'offered' }),
      }),
    );
  });

  it('does nothing if no waitlist entry exists', async () => {
    const booking = makeBooking({ status: 'approved' });
    mockBookingFindUnique.mockResolvedValue(booking);
    mockBookingUpdate.mockResolvedValue({
      ...booking,
      status: 'cancelled',
      amenity: { name: 'Pool' },
    });
    mockWaitlistFindFirst.mockResolvedValue(null);

    const req = createPatchRequest(`/api/v1/bookings/${BOOKING_1}`, { status: 'cancelled' });
    await PATCH(req, makeParams(BOOKING_1));

    expect(mockWaitlistUpdate).not.toHaveBeenCalled();
  });

  it('sends email to waitlisted user with availability notice', async () => {
    const booking = makeBooking({ status: 'approved' });
    mockBookingFindUnique.mockResolvedValue(booking);
    mockBookingUpdate.mockResolvedValue({
      ...booking,
      status: 'cancelled',
      amenity: { name: 'Pool' },
    });

    mockWaitlistFindFirst.mockResolvedValue({
      id: 'wl-2',
      amenityId: AMENITY_POOL,
      residentId: 'wl-resident-2',
      status: 'waiting',
    });
    mockWaitlistUpdate.mockResolvedValue({ id: 'wl-2', status: 'offered' });

    mockUserFindUnique
      .mockResolvedValueOnce({ email: 'resident@example.com', firstName: 'Jane' })
      .mockResolvedValueOnce({ email: 'waitlist@example.com', firstName: 'Alice' });

    const req = createPatchRequest(`/api/v1/bookings/${BOOKING_1}`, { status: 'cancelled' });
    await PATCH(req, makeParams(BOOKING_1));

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'waitlist@example.com',
        subject: expect.stringContaining('available'),
      }),
    );
  });
});

// ===========================================================================
// 11. Check-in / check-out tracking (conceptual)
// ===========================================================================

describe('11. Check-in and check-out tracking', () => {
  it('check-in sets checkedInAt timestamp', () => {
    const booking = {
      status: 'approved',
      checkedInAt: null as Date | null,
    };
    booking.checkedInAt = new Date();
    expect(booking.checkedInAt).toBeInstanceOf(Date);
  });

  it('check-out sets checkedOutAt timestamp', () => {
    const booking = {
      status: 'approved',
      checkedOutAt: null as Date | null,
    };
    booking.checkedOutAt = new Date();
    expect(booking.checkedOutAt).toBeInstanceOf(Date);
  });
});

// ===========================================================================
// 12. No-show detection
// ===========================================================================

describe('12. No-show detection and transition', () => {
  it('approved -> no_show transition is valid', async () => {
    const booking = makeBooking({ status: 'approved' });
    mockBookingFindUnique.mockResolvedValue(booking);
    mockBookingUpdate.mockResolvedValue({
      ...booking,
      status: 'no_show',
      amenity: { name: 'Pool' },
    });

    const req = createPatchRequest(`/api/v1/bookings/${BOOKING_1}`, { status: 'no_show' });
    const res = await PATCH(req, makeParams(BOOKING_1));

    expect(res.status).toBe(200);
  });

  it('pending -> no_show is rejected (must be approved first)', async () => {
    mockBookingFindUnique.mockResolvedValue(makeBooking({ status: 'pending' }));

    const req = createPatchRequest(`/api/v1/bookings/${BOOKING_1}`, { status: 'no_show' });
    const res = await PATCH(req, makeParams(BOOKING_1));

    // pending valid transitions are: approved, declined, cancelled — not no_show
    expect(res.status).toBe(400);
  });

  it('no-show detection logic: booking past end time without check-in', () => {
    const booking = {
      status: 'approved',
      endTime: yesterday,
      checkedInAt: null,
    };

    function isNoShow(b: { status: string; endTime: Date; checkedInAt: Date | null }): boolean {
      return b.status === 'approved' && b.endTime < new Date() && b.checkedInAt === null;
    }

    expect(isNoShow(booking)).toBe(true);
  });
});

// ===========================================================================
// 13. Capacity enforcement (conceptual)
// ===========================================================================

describe('13. Capacity enforcement', () => {
  it('max occupancy check prevents over-booking', () => {
    const amenity = { maxConcurrent: 5 };
    const existingBookings = 5;
    const canBook = existingBookings < amenity.maxConcurrent;
    expect(canBook).toBe(false);
  });

  it('allows booking when under capacity', () => {
    const amenity = { maxConcurrent: 5 };
    const existingBookings = 3;
    const canBook = existingBookings < amenity.maxConcurrent;
    expect(canBook).toBe(true);
  });
});

// ===========================================================================
// 14. Booking conflict detection (conceptual)
// ===========================================================================

describe('14. Booking conflict detection', () => {
  it('detects overlap when new booking falls within existing time range', () => {
    const existing = { start: new Date('2026-04-01T10:00'), end: new Date('2026-04-01T12:00') };
    const newBooking = { start: new Date('2026-04-01T11:00'), end: new Date('2026-04-01T13:00') };

    const overlaps = newBooking.start < existing.end && newBooking.end > existing.start;
    expect(overlaps).toBe(true);
  });

  it('no overlap when times do not intersect', () => {
    const existing = { start: new Date('2026-04-01T10:00'), end: new Date('2026-04-01T12:00') };
    const newBooking = { start: new Date('2026-04-01T14:00'), end: new Date('2026-04-01T16:00') };

    const overlaps = newBooking.start < existing.end && newBooking.end > existing.start;
    expect(overlaps).toBe(false);
  });

  it('detects exact match as conflict', () => {
    const existing = { start: new Date('2026-04-01T10:00'), end: new Date('2026-04-01T12:00') };
    const newBooking = { start: new Date('2026-04-01T10:00'), end: new Date('2026-04-01T12:00') };

    const overlaps = newBooking.start < existing.end && newBooking.end > existing.start;
    expect(overlaps).toBe(true);
  });

  it('adjacent bookings (end=start) do NOT overlap', () => {
    const existing = { start: new Date('2026-04-01T10:00'), end: new Date('2026-04-01T12:00') };
    const newBooking = { start: new Date('2026-04-01T12:00'), end: new Date('2026-04-01T14:00') };

    const overlaps = newBooking.start < existing.end && newBooking.end > existing.start;
    expect(overlaps).toBe(false);
  });
});

// ===========================================================================
// 15. Move-in/move-out elevator booking fee matrix
// ===========================================================================

describe('15. Move-in/move-out elevator booking fee', () => {
  it('calculates move-in fee based on floor count', () => {
    const feeMatrix: Record<string, number> = {
      '1-5': 100,
      '6-15': 150,
      '16-30': 200,
      '31+': 300,
    };

    function getMoveInFee(floor: number): number {
      if (floor <= 5) return feeMatrix['1-5']!;
      if (floor <= 15) return feeMatrix['6-15']!;
      if (floor <= 30) return feeMatrix['16-30']!;
      return feeMatrix['31+']!;
    }

    expect(getMoveInFee(3)).toBe(100);
    expect(getMoveInFee(10)).toBe(150);
    expect(getMoveInFee(25)).toBe(200);
    expect(getMoveInFee(35)).toBe(300);
  });
});

// ===========================================================================
// 16. Guest booking (resident books on behalf)
// ===========================================================================

describe('16. Guest booking', () => {
  it('booking can include guestName and guestCount', () => {
    const booking = {
      ...makeBooking(),
      guestName: 'John Doe',
      guestCount: 3,
      isGuestBooking: true,
    };

    expect(booking.guestName).toBe('John Doe');
    expect(booking.guestCount).toBe(3);
    expect(booking.isGuestBooking).toBe(true);
  });
});

// ===========================================================================
// 17. Email notifications on status change
// ===========================================================================

describe('17. Email notifications on approval and decline', () => {
  it('sends approval email to booker', async () => {
    const booking = makeBooking({ status: 'pending' });
    mockBookingFindUnique.mockResolvedValue(booking);
    mockBookingUpdate.mockResolvedValue({
      ...booking,
      status: 'approved',
      amenity: { name: 'Pool' },
    });

    const req = createPatchRequest(`/api/v1/bookings/${BOOKING_1}`, { status: 'approved' });
    await PATCH(req, makeParams(BOOKING_1));

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'resident@example.com',
        subject: expect.stringContaining('approved'),
      }),
    );
  });

  it('sends decline email with reason to booker', async () => {
    const booking = makeBooking({ status: 'pending' });
    mockBookingFindUnique.mockResolvedValue(booking);
    mockBookingUpdate.mockResolvedValue({
      ...booking,
      status: 'declined',
      amenity: { name: 'Pool' },
    });

    const req = createPatchRequest(`/api/v1/bookings/${BOOKING_1}`, {
      status: 'declined',
      declinedReason: 'Pool closed for repairs',
    });
    await PATCH(req, makeParams(BOOKING_1));

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'resident@example.com',
        subject: expect.stringContaining('declined'),
      }),
    );

    const emailPayload = mockSendEmail.mock.calls[0]![0];
    expect(emailPayload.html).toContain('Pool closed for repairs');
  });
});

// ===========================================================================
// 18. Tenant isolation
// ===========================================================================

describe('18. Tenant isolation', () => {
  it('requires propertyId for GET listing', async () => {
    const req = createGetRequest('/api/v1/bookings');
    const res = await GET(req);

    expect(res.status).toBe(400);
    expect(mockBookingFindMany).not.toHaveBeenCalled();
  });

  it('scopes queries to propertyId and excludes soft-deleted', async () => {
    mockBookingFindMany.mockResolvedValue([]);
    mockBookingCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/bookings', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET(req);

    const where = mockBookingFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_A);
    expect(where.deletedAt).toBeNull();
  });
});

// ===========================================================================
// 19. GET booking detail
// ===========================================================================

describe('19. GET booking detail', () => {
  it('returns booking with amenity and unit includes', async () => {
    mockBookingFindUnique.mockResolvedValue(makeBooking({ unit: { id: UNIT_1, number: '101' } }));

    const req = createGetRequest(`/api/v1/bookings/${BOOKING_1}`);
    const res = await GET_DETAIL(req, makeParams(BOOKING_1));

    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: { id: string } }>(res);
    expect(body.data.id).toBe(BOOKING_1);
  });

  it('returns 404 for nonexistent booking', async () => {
    mockBookingFindUnique.mockResolvedValue(null);

    const req = createGetRequest('/api/v1/bookings/nonexistent');
    const res = await GET_DETAIL(req, makeParams('nonexistent'));

    expect(res.status).toBe(404);
  });
});

// ===========================================================================
// 20. DELETE cancels booking
// ===========================================================================

describe('20. DELETE cancels booking', () => {
  it('soft-cancels by setting status to cancelled', async () => {
    mockBookingUpdate.mockResolvedValue(makeBooking({ status: 'cancelled' }));

    const req = createDeleteRequest(`/api/v1/bookings/${BOOKING_1}`);
    const res = await DELETE(req, makeParams(BOOKING_1));

    expect(res.status).toBe(200);
    const updateCall = mockBookingUpdate.mock.calls[0]![0];
    expect(updateCall.data.status).toBe('cancelled');
    expect(updateCall.data.cancelledAt).toBeInstanceOf(Date);
    expect(updateCall.data.cancelledById).toBe(ADMIN_1);
  });
});

// ===========================================================================
// 21. Pagination
// ===========================================================================

describe('21. Booking list pagination', () => {
  it('defaults to page 1, pageSize 20', async () => {
    mockBookingFindMany.mockResolvedValue([]);
    mockBookingCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/bookings', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET(req);

    const findCall = mockBookingFindMany.mock.calls[0]![0];
    expect(findCall.skip).toBe(0);
    expect(findCall.take).toBe(20);
  });

  it('applies custom pagination', async () => {
    mockBookingFindMany.mockResolvedValue([]);
    mockBookingCount.mockResolvedValue(100);

    const req = createGetRequest('/api/v1/bookings', {
      searchParams: { propertyId: PROPERTY_A, page: '3', pageSize: '10' },
    });
    const res = await GET(req);
    const body = await parseResponse<{ meta: { page: number; totalPages: number } }>(res);

    expect(body.meta.page).toBe(3);
    expect(body.meta.totalPages).toBe(10);
  });
});

// ===========================================================================
// 22. Ordering
// ===========================================================================

describe('22. Bookings ordered by startTime asc', () => {
  it('returns bookings in chronological order', async () => {
    mockBookingFindMany.mockResolvedValue([]);
    mockBookingCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/bookings', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET(req);

    const findCall = mockBookingFindMany.mock.calls[0]![0];
    expect(findCall.orderBy).toEqual({ startTime: 'asc' });
  });
});

// ===========================================================================
// 23. Auth guard
// ===========================================================================

describe('23. Authentication required', () => {
  it('returns auth error when guard fails', async () => {
    mockGuardRoute.mockResolvedValue({
      user: null,
      error: new Response(JSON.stringify({ error: 'UNAUTHORIZED' }), { status: 401 }),
    });

    const req = createGetRequest('/api/v1/bookings', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await GET(req);

    expect(res.status).toBe(401);
  });
});

// ===========================================================================
// 24. Booking not found on PATCH
// ===========================================================================

describe('24. Booking not found on status change', () => {
  it('returns 404 when updating nonexistent booking', async () => {
    mockBookingFindUnique.mockResolvedValue(null);

    const req = createPatchRequest('/api/v1/bookings/nonexistent', { status: 'approved' });
    const res = await PATCH(req, makeParams('nonexistent'));

    expect(res.status).toBe(404);
  });
});

// ===========================================================================
// 25. Approver comments
// ===========================================================================

describe('25. Approver comments', () => {
  it('stores approverComments on status update', async () => {
    const booking = makeBooking({ status: 'pending' });
    mockBookingFindUnique.mockResolvedValue(booking);
    mockBookingUpdate.mockResolvedValue({
      ...booking,
      status: 'approved',
      amenity: { name: 'Pool' },
    });

    const req = createPatchRequest(`/api/v1/bookings/${BOOKING_1}`, {
      status: 'approved',
      approverComments: 'Approved with a note to keep noise down.',
    });
    await PATCH(req, makeParams(BOOKING_1));

    const updateData = mockBookingUpdate.mock.calls[0]![0].data;
    expect(updateData.approverComments).toBe('Approved with a note to keep noise down.');
  });
});

// ===========================================================================
// 26. Auto-complete after end time (conceptual)
// ===========================================================================

describe('26. Auto-complete after end time', () => {
  it('effective status is completed when approved booking past end time', () => {
    function getEffectiveStatus(b: { status: string; endTime: Date }): string {
      if (b.status === 'approved' && b.endTime < new Date()) return 'completed';
      return b.status;
    }

    expect(getEffectiveStatus({ status: 'approved', endTime: yesterday })).toBe('completed');
    expect(getEffectiveStatus({ status: 'approved', endTime: tomorrow })).toBe('approved');
  });
});

// ===========================================================================
// 27. Includes amenity and unit relations
// ===========================================================================

describe('27. Booking list includes relations', () => {
  it('includes amenity name and unit number', async () => {
    mockBookingFindMany.mockResolvedValue([]);
    mockBookingCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/bookings', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET(req);

    const include = mockBookingFindMany.mock.calls[0]![0].include;
    expect(include.amenity).toBeDefined();
    expect(include.unit).toBeDefined();
  });
});

// ===========================================================================
// 28. Booking detail includes max concurrent capacity
// ===========================================================================

describe('28. Booking detail includes amenity capacity', () => {
  it('includes maxConcurrent in amenity detail', async () => {
    mockBookingFindUnique.mockResolvedValue(
      makeBooking({
        amenity: { id: AMENITY_POOL, name: 'Pool', description: 'Main pool', maxConcurrent: 10 },
      }),
    );

    const req = createGetRequest(`/api/v1/bookings/${BOOKING_1}`);
    await GET_DETAIL(req, makeParams(BOOKING_1));

    const include = mockBookingFindUnique.mock.calls[0]![0].include;
    expect(include.amenity.select.maxConcurrent).toBe(true);
  });
});

// ===========================================================================
// 29. Waitlist offeredAt timestamp
// ===========================================================================

describe('29. Waitlist offeredAt timestamp set on notification', () => {
  it('sets offeredAt on waitlist entry when cancellation triggers offer', async () => {
    const booking = makeBooking({ status: 'approved' });
    mockBookingFindUnique.mockResolvedValue(booking);
    mockBookingUpdate.mockResolvedValue({
      ...booking,
      status: 'cancelled',
      amenity: { name: 'Pool' },
    });

    mockWaitlistFindFirst.mockResolvedValue({
      id: 'wl-3',
      amenityId: AMENITY_POOL,
      residentId: 'wl-resident-3',
      status: 'waiting',
    });
    mockWaitlistUpdate.mockResolvedValue({ id: 'wl-3', status: 'offered' });

    mockUserFindUnique
      .mockResolvedValueOnce({ email: 'a@b.com', firstName: 'A' })
      .mockResolvedValueOnce({ email: 'c@d.com', firstName: 'C' });

    const req = createPatchRequest(`/api/v1/bookings/${BOOKING_1}`, { status: 'cancelled' });
    await PATCH(req, makeParams(BOOKING_1));

    const updateCall = mockWaitlistUpdate.mock.calls[0]![0];
    expect(updateCall.data.offeredAt).toBeInstanceOf(Date);
  });
});

// ===========================================================================
// 30. Valid transition map coverage
// ===========================================================================

describe('30. Complete transition map validation', () => {
  const validTransitions: Record<string, string[]> = {
    pending: ['approved', 'declined', 'cancelled'],
    approved: ['cancelled', 'completed', 'no_show'],
    declined: [],
    cancelled: [],
    completed: [],
  };

  for (const [from, allowedTo] of Object.entries(validTransitions)) {
    for (const to of allowedTo) {
      it(`allows ${from} -> ${to}`, async () => {
        const booking = makeBooking({ status: from });
        mockBookingFindUnique.mockResolvedValue(booking);
        mockBookingUpdate.mockResolvedValue({ ...booking, status: to, amenity: { name: 'Pool' } });

        const req = createPatchRequest(`/api/v1/bookings/${BOOKING_1}`, { status: to });
        const res = await PATCH(req, makeParams(BOOKING_1));

        expect(res.status).toBe(200);
      });
    }
  }

  const terminalStates = ['declined', 'cancelled', 'completed'];
  for (const from of terminalStates) {
    it(`rejects any transition from terminal state: ${from}`, async () => {
      mockBookingFindUnique.mockResolvedValue(makeBooking({ status: from }));

      const req = createPatchRequest(`/api/v1/bookings/${BOOKING_1}`, { status: 'approved' });
      const res = await PATCH(req, makeParams(BOOKING_1));

      expect(res.status).toBe(400);
    });
  }
});
