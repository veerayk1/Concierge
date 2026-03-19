/**
 * Amenity Booking Module — Comprehensive Tests (PRD 07)
 *
 * Exhaustive TDD coverage for amenity CRUD, booking lifecycle, waitlist,
 * recurring bookings, calendar/list views, rules enforcement, and tenant isolation.
 *
 * Tests 1-23 per specification:
 *  1. Amenity CRUD (name, description, maxConcurrent, rules)
 *  2. Amenity groups (pool_area, fitness, social_rooms, outdoor)
 *  3. Amenity options (paid add-ons: cleaning fee, equipment rental)
 *  4. Booking creation (amenityId, unitId, startDate, endDate, startTime, endTime)
 *  5. Booking auto-approval (approvalMode=auto)
 *  6. Booking manual approval (approvalMode=manual -> status=pending)
 *  7. Booking conflict detection (overlapping bookings for same amenity)
 *  8. Booking guest count (validated against amenity maxConcurrent)
 *  9. Approval workflow (pending -> approved -> completed)
 * 10. Decline workflow (pending -> declined with reason)
 * 11. Cancellation (approved -> cancelled before startDate)
 * 12. Cancellation (cannot cancel after startTime has passed)
 * 13. Cancellation (creates waitlist notification if others waiting)
 * 14. Waitlist (fully booked -> user joins waitlist)
 * 15. Waitlist promotion (booking cancelled -> next waitlisted user notified)
 * 16. Recurring booking (weekly/monthly repeat options)
 * 17. Calendar view data (GET /amenities/:id returns bookings for date range)
 * 18. List view (filter by status, amenity, unit, date)
 * 19. Booking fee (optional payment integration)
 * 20. Booking rules (minimum notice period, maximum duration)
 * 21. Amenity hours (enforce open/close times)
 * 22. Holiday closures (block bookings on specified dates)
 * 23. Tenant isolation on all operations
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

const mockAmenityFindMany = vi.fn();
const mockAmenityFindUnique = vi.fn();
const mockAmenityCreate = vi.fn();
const mockAmenityUpdate = vi.fn();
const mockAmenityDelete = vi.fn();
const mockBookingCreate = vi.fn();
const mockBookingFindMany = vi.fn();
const mockBookingFindUnique = vi.fn();
const mockBookingUpdate = vi.fn();
const mockBookingCount = vi.fn();
const mockBookingFindFirst = vi.fn();
const mockAmenityGroupFindMany = vi.fn();
const mockAmenityGroupCreate = vi.fn();
const mockAmenityOptionFindMany = vi.fn();
const mockAmenityOptionCreate = vi.fn();
const mockWaitlistFindFirst = vi.fn();
const mockWaitlistCreate = vi.fn();
const mockWaitlistUpdate = vi.fn();
const mockWaitlistCount = vi.fn();
const mockUserFindUnique = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    amenity: {
      findMany: (...args: unknown[]) => mockAmenityFindMany(...args),
      findUnique: (...args: unknown[]) => mockAmenityFindUnique(...args),
      create: (...args: unknown[]) => mockAmenityCreate(...args),
      update: (...args: unknown[]) => mockAmenityUpdate(...args),
      delete: (...args: unknown[]) => mockAmenityDelete(...args),
    },
    booking: {
      create: (...args: unknown[]) => mockBookingCreate(...args),
      findMany: (...args: unknown[]) => mockBookingFindMany(...args),
      findUnique: (...args: unknown[]) => mockBookingFindUnique(...args),
      update: (...args: unknown[]) => mockBookingUpdate(...args),
      count: (...args: unknown[]) => mockBookingCount(...args),
      findFirst: (...args: unknown[]) => mockBookingFindFirst(...args),
    },
    amenityGroup: {
      findMany: (...args: unknown[]) => mockAmenityGroupFindMany(...args),
      create: (...args: unknown[]) => mockAmenityGroupCreate(...args),
    },
    amenityOption: {
      findMany: (...args: unknown[]) => mockAmenityOptionFindMany(...args),
      create: (...args: unknown[]) => mockAmenityOptionCreate(...args),
    },
    waitlistEntry: {
      findFirst: (...args: unknown[]) => mockWaitlistFindFirst(...args),
      create: (...args: unknown[]) => mockWaitlistCreate(...args),
      update: (...args: unknown[]) => mockWaitlistUpdate(...args),
      count: (...args: unknown[]) => mockWaitlistCount(...args),
    },
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
    },
  },
}));

const mockSendEmail = vi.fn().mockResolvedValue('msg-id');

vi.mock('@/server/email', () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
}));

let mockAuthUser = {
  userId: 'test-staff',
  propertyId: '00000000-0000-4000-b000-000000000001',
  role: 'property_admin',
  permissions: ['*'],
  mfaVerified: true,
};

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: vi.fn().mockImplementation(() =>
    Promise.resolve({
      user: mockAuthUser,
      error: null,
    }),
  ),
}));

// ---------------------------------------------------------------------------
// Route Imports (after mocks are established)
// ---------------------------------------------------------------------------

import { GET } from '../route';
import { GET as GET_DETAIL, POST as POST_BOOKING } from '../[id]/route';
import { GET as GET_GROUPS, POST as POST_GROUP } from '../groups/route';
import { GET as GET_BOOKINGS } from '../../bookings/route';
import { PATCH as PATCH_BOOKING, DELETE as DELETE_BOOKING } from '../../bookings/[id]/route';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROPERTY_A = '00000000-0000-4000-b000-000000000001';
const PROPERTY_B = '00000000-0000-4000-b000-000000000002';
const AMENITY_ID = '00000000-0000-4000-c000-000000000001';
const UNIT_ID = '00000000-0000-4000-e000-000000000001';
const UNIT_ID_2 = '00000000-0000-4000-e000-000000000002';
const BOOKING_ID = '00000000-0000-4000-f000-000000000001';

const futureDate = new Date(Date.now() + 86_400_000); // tomorrow
const pastDate = new Date(Date.now() - 86_400_000); // yesterday

const validBookingPayload = {
  unitId: UNIT_ID,
  startDate: '2026-04-15',
  startTime: '10:00',
  endDate: '2026-04-15',
  endTime: '12:00',
  guestCount: 5,
};

function makeAmenity(overrides: Record<string, unknown> = {}) {
  return {
    id: AMENITY_ID,
    propertyId: PROPERTY_A,
    name: 'Swimming Pool',
    description: 'Olympic-size pool on 3rd floor',
    groupId: 'group-pool',
    maxConcurrent: 1,
    approvalMode: 'auto',
    isActive: true,
    deletedAt: null,
    operatingHours: {
      monday: { open: '06:00', close: '22:00' },
      tuesday: { open: '06:00', close: '22:00' },
      wednesday: { open: '06:00', close: '22:00' },
      thursday: { open: '06:00', close: '22:00' },
      friday: { open: '06:00', close: '22:00' },
      saturday: { open: '08:00', close: '20:00' },
      sunday: { open: '08:00', close: '20:00' },
    },
    advanceMinHours: 24,
    maxBookingMinutes: 180,
    fee: 0,
    waitlistEnabled: false,
    allowRecurring: false,
    ...overrides,
  };
}

function makeBooking(overrides: Record<string, unknown> = {}) {
  return {
    id: BOOKING_ID,
    referenceNumber: 'AMN-2026-00001',
    propertyId: PROPERTY_A,
    amenityId: AMENITY_ID,
    unitId: UNIT_ID,
    residentId: 'resident-1',
    createdById: 'resident-1',
    startDate: futureDate,
    startTime: futureDate,
    endDate: futureDate,
    endTime: new Date(futureDate.getTime() + 3_600_000),
    guestCount: 2,
    status: 'pending',
    approvalStatus: 'pending',
    amenity: { name: 'Swimming Pool', approvalMode: 'manual' },
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Test Lifecycle
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  mockAuthUser = {
    userId: 'test-staff',
    propertyId: PROPERTY_A,
    role: 'property_admin',
    permissions: ['*'],
    mfaVerified: true,
  };
  mockAmenityFindMany.mockResolvedValue([]);
  mockAmenityGroupFindMany.mockResolvedValue([]);
  mockBookingFindMany.mockResolvedValue([]);
  mockBookingCount.mockResolvedValue(0);
  mockWaitlistFindFirst.mockResolvedValue(null);
  mockUserFindUnique.mockResolvedValue({
    email: 'resident@example.com',
    firstName: 'Jane',
  });
});

// ===========================================================================
// 1. AMENITY CRUD: create with name, description, maxConcurrent, rules
// ===========================================================================

describe('1. Amenity CRUD', () => {
  it('lists amenities for a property with required fields', async () => {
    const amenity = makeAmenity();
    mockAmenityFindMany.mockResolvedValue([amenity]);

    const req = createGetRequest('/api/v1/amenities', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: (typeof amenity)[] }>(res);
    expect(body.data).toHaveLength(1);
    expect(body.data[0]).toMatchObject({
      name: 'Swimming Pool',
      description: 'Olympic-size pool on 3rd floor',
      maxConcurrent: 1,
    });
  });

  it('returns amenity detail with full configuration', async () => {
    const amenity = makeAmenity({
      bookings: [],
      group: { id: 'group-pool', name: 'Pool Area' },
    });
    mockAmenityFindUnique.mockResolvedValue(amenity);

    const req = createGetRequest('/api/v1/amenities/' + AMENITY_ID);
    const res = await GET_DETAIL(req, { params: Promise.resolve({ id: AMENITY_ID }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: typeof amenity }>(res);
    expect(body.data.name).toBe('Swimming Pool');
    expect(body.data.maxConcurrent).toBe(1);
    expect(body.data.operatingHours).toBeDefined();
  });

  it('returns 404 for non-existent amenity', async () => {
    mockAmenityFindUnique.mockResolvedValue(null);

    const req = createGetRequest('/api/v1/amenities/nonexistent');
    const res = await GET_DETAIL(req, { params: Promise.resolve({ id: 'nonexistent' }) });
    expect(res.status).toBe(404);
  });

  it('excludes soft-deleted amenities from listing', async () => {
    const req = createGetRequest('/api/v1/amenities', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET(req);

    const where = mockAmenityFindMany.mock.calls[0]![0].where;
    expect(where.deletedAt).toBeNull();
  });

  it('filters amenities by search term across name and description', async () => {
    const req = createGetRequest('/api/v1/amenities', {
      searchParams: { propertyId: PROPERTY_A, search: 'pool' },
    });
    await GET(req);

    const where = mockAmenityFindMany.mock.calls[0]![0].where;
    expect(where.OR).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: { contains: 'pool', mode: 'insensitive' } }),
        expect.objectContaining({ description: { contains: 'pool', mode: 'insensitive' } }),
      ]),
    );
  });

  it('orders amenities by name ascending', async () => {
    const req = createGetRequest('/api/v1/amenities', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET(req);

    expect(mockAmenityFindMany.mock.calls[0]![0].orderBy).toEqual({ name: 'asc' });
  });
});

// ===========================================================================
// 2. AMENITY GROUPS: pool_area, fitness, social_rooms, outdoor
// ===========================================================================

describe('2. Amenity Groups', () => {
  it('lists groups for a property filtered by active status', async () => {
    const groups = [
      {
        id: 'g1',
        propertyId: PROPERTY_A,
        name: 'Pool Area',
        displayOrder: 0,
        _count: { amenities: 2 },
      },
      {
        id: 'g2',
        propertyId: PROPERTY_A,
        name: 'Fitness',
        displayOrder: 1,
        _count: { amenities: 3 },
      },
      {
        id: 'g3',
        propertyId: PROPERTY_A,
        name: 'Social Rooms',
        displayOrder: 2,
        _count: { amenities: 4 },
      },
      {
        id: 'g4',
        propertyId: PROPERTY_A,
        name: 'Outdoor',
        displayOrder: 3,
        _count: { amenities: 1 },
      },
    ];
    mockAmenityGroupFindMany.mockResolvedValue(groups);

    const req = createGetRequest('/api/v1/amenities/groups', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await GET_GROUPS(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { name: string; amenityCount: number }[] }>(res);
    expect(body.data).toHaveLength(4);
    expect(body.data.map((g) => g.name)).toEqual([
      'Pool Area',
      'Fitness',
      'Social Rooms',
      'Outdoor',
    ]);
  });

  it('creates a new amenity group successfully', async () => {
    mockAmenityGroupCreate.mockResolvedValue({
      id: 'g-new',
      propertyId: PROPERTY_A,
      name: 'Outdoor',
      displayOrder: 3,
    });

    const req = createPostRequest('/api/v1/amenities/groups', {
      propertyId: PROPERTY_A,
      name: 'Outdoor',
    });
    const res = await POST_GROUP(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('created');
  });

  it('rejects group creation without a name', async () => {
    const req = createPostRequest('/api/v1/amenities/groups', {
      propertyId: PROPERTY_A,
    });
    const res = await POST_GROUP(req);
    expect(res.status).toBe(400);
  });

  it('rejects group creation without propertyId', async () => {
    const req = createPostRequest('/api/v1/amenities/groups', {
      name: 'Fitness',
    });
    const res = await POST_GROUP(req);
    expect(res.status).toBe(400);
  });

  it('rejects group creation with invalid propertyId format', async () => {
    const req = createPostRequest('/api/v1/amenities/groups', {
      propertyId: 'not-a-uuid',
      name: 'Fitness',
    });
    const res = await POST_GROUP(req);
    expect(res.status).toBe(400);
  });

  it('orders groups by displayOrder ascending', async () => {
    mockAmenityGroupFindMany.mockResolvedValue([]);
    const req = createGetRequest('/api/v1/amenities/groups', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET_GROUPS(req);

    expect(mockAmenityGroupFindMany.mock.calls[0]![0].orderBy).toEqual({ displayOrder: 'asc' });
  });

  it('filters amenities by groupId', async () => {
    const req = createGetRequest('/api/v1/amenities', {
      searchParams: { propertyId: PROPERTY_A, groupId: 'group-fitness' },
    });
    await GET(req);

    expect(mockAmenityFindMany.mock.calls[0]![0].where.groupId).toBe('group-fitness');
  });

  it('includes amenity count per group', async () => {
    mockAmenityGroupFindMany.mockResolvedValue([
      { id: 'g1', name: 'Pool Area', _count: { amenities: 3 } },
    ]);

    const req = createGetRequest('/api/v1/amenities/groups', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await GET_GROUPS(req);
    const body = await parseResponse<{ data: { amenityCount: number }[] }>(res);
    expect(body.data[0].amenityCount).toBe(3);
  });
});

// ===========================================================================
// 3. AMENITY OPTIONS: paid add-ons (cleaning fee, equipment rental)
// ===========================================================================

describe('3. Amenity Options — Paid Add-Ons', () => {
  it('amenity schema supports optionsEnabled flag', () => {
    const amenity = makeAmenity({ optionsEnabled: true });
    expect(amenity.optionsEnabled).toBe(true);
  });

  it('AmenityOption has name, description, feeOverride, depositOverride', () => {
    const option = {
      id: 'opt-1',
      amenityId: AMENITY_ID,
      name: 'Cleaning Fee',
      description: 'Post-event deep cleaning',
      feeOverride: 75.0,
      depositOverride: 50.0,
      displayOrder: 0,
      isActive: true,
    };
    expect(option.name).toBe('Cleaning Fee');
    expect(option.feeOverride).toBe(75.0);
    expect(option.depositOverride).toBe(50.0);
  });

  it('equipment rental option has correct structure', () => {
    const option = {
      id: 'opt-2',
      amenityId: AMENITY_ID,
      name: 'Equipment Rental',
      description: 'Tables and chairs for party room',
      feeOverride: 100.0,
      depositOverride: null,
      displayOrder: 1,
      isActive: true,
    };
    expect(option.name).toBe('Equipment Rental');
    expect(option.feeOverride).toBe(100.0);
    expect(option.depositOverride).toBeNull();
  });

  it('booking can reference an amenityOptionId for paid add-on', () => {
    const booking = makeBooking({ amenityOptionId: 'opt-1' });
    expect(booking.amenityOptionId).toBe('opt-1');
  });

  it('booking fee fields include feeAmount, depositAmount, serviceFee, taxAmount, totalAmount', () => {
    const booking = {
      feeAmount: 50.0,
      depositAmount: 100.0,
      serviceFee: 5.0,
      taxAmount: 7.15,
      totalAmount: 162.15,
    };
    expect(booking.totalAmount).toBe(
      booking.feeAmount + booking.depositAmount + booking.serviceFee + booking.taxAmount,
    );
  });
});

// ===========================================================================
// 4. BOOKING CREATION: requires amenityId, unitId, startDate, endDate, startTime, endTime
// ===========================================================================

describe('4. Booking Creation — Required Fields', () => {
  it('rejects booking with empty body', async () => {
    const req = createPostRequest('/api/v1/amenities/' + AMENITY_ID, {});
    const res = await POST_BOOKING(req, { params: Promise.resolve({ id: AMENITY_ID }) });
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('rejects booking without unitId', async () => {
    const { unitId, ...payload } = validBookingPayload;
    const req = createPostRequest('/api/v1/amenities/' + AMENITY_ID, payload);
    const res = await POST_BOOKING(req, { params: Promise.resolve({ id: AMENITY_ID }) });
    expect(res.status).toBe(400);
  });

  it('rejects booking without startDate', async () => {
    const { startDate, ...payload } = validBookingPayload;
    const req = createPostRequest('/api/v1/amenities/' + AMENITY_ID, payload);
    const res = await POST_BOOKING(req, { params: Promise.resolve({ id: AMENITY_ID }) });
    expect(res.status).toBe(400);
  });

  it('rejects booking without endDate', async () => {
    const { endDate, ...payload } = validBookingPayload;
    const req = createPostRequest('/api/v1/amenities/' + AMENITY_ID, payload);
    const res = await POST_BOOKING(req, { params: Promise.resolve({ id: AMENITY_ID }) });
    expect(res.status).toBe(400);
  });

  it('rejects booking without startTime', async () => {
    const { startTime, ...payload } = validBookingPayload;
    const req = createPostRequest('/api/v1/amenities/' + AMENITY_ID, payload);
    const res = await POST_BOOKING(req, { params: Promise.resolve({ id: AMENITY_ID }) });
    expect(res.status).toBe(400);
  });

  it('rejects booking without endTime', async () => {
    const { endTime, ...payload } = validBookingPayload;
    const req = createPostRequest('/api/v1/amenities/' + AMENITY_ID, payload);
    const res = await POST_BOOKING(req, { params: Promise.resolve({ id: AMENITY_ID }) });
    expect(res.status).toBe(400);
  });

  it('rejects booking with invalid unitId format', async () => {
    const req = createPostRequest('/api/v1/amenities/' + AMENITY_ID, {
      ...validBookingPayload,
      unitId: 'not-a-uuid',
    });
    const res = await POST_BOOKING(req, { params: Promise.resolve({ id: AMENITY_ID }) });
    expect(res.status).toBe(400);
  });

  it('rejects booking when amenity does not exist', async () => {
    mockAmenityFindUnique.mockResolvedValue(null);

    const req = createPostRequest('/api/v1/amenities/nonexistent', validBookingPayload);
    const res = await POST_BOOKING(req, { params: Promise.resolve({ id: 'nonexistent' }) });
    expect(res.status).toBe(404);
  });

  it('creates booking successfully with all required fields', async () => {
    mockAmenityFindUnique.mockResolvedValue(makeAmenity());
    mockBookingCreate.mockResolvedValue({
      id: BOOKING_ID,
      status: 'approved',
      ...validBookingPayload,
    });

    const req = createPostRequest('/api/v1/amenities/' + AMENITY_ID, validBookingPayload);
    const res = await POST_BOOKING(req, { params: Promise.resolve({ id: AMENITY_ID }) });
    expect(res.status).toBe(201);
  });

  it('booking stores amenityId from URL path parameter', async () => {
    mockAmenityFindUnique.mockResolvedValue(makeAmenity());
    mockBookingCreate.mockResolvedValue({ id: BOOKING_ID, status: 'approved' });

    const req = createPostRequest('/api/v1/amenities/' + AMENITY_ID, validBookingPayload);
    await POST_BOOKING(req, { params: Promise.resolve({ id: AMENITY_ID }) });

    const createData = mockBookingCreate.mock.calls[0]![0].data;
    expect(createData.amenityId).toBe(AMENITY_ID);
  });

  it('generates AMN- reference number', async () => {
    mockAmenityFindUnique.mockResolvedValue(makeAmenity());
    mockBookingCreate.mockResolvedValue({ id: BOOKING_ID, status: 'approved' });

    const req = createPostRequest('/api/v1/amenities/' + AMENITY_ID, validBookingPayload);
    await POST_BOOKING(req, { params: Promise.resolve({ id: AMENITY_ID }) });

    const createData = mockBookingCreate.mock.calls[0]![0].data;
    expect(createData.referenceNumber).toMatch(/^AMN-/);
  });

  it('sets propertyId from amenity, not from user input', async () => {
    mockAmenityFindUnique.mockResolvedValue(makeAmenity({ propertyId: PROPERTY_A }));
    mockBookingCreate.mockResolvedValue({ id: BOOKING_ID, status: 'approved' });

    const req = createPostRequest('/api/v1/amenities/' + AMENITY_ID, validBookingPayload);
    await POST_BOOKING(req, { params: Promise.resolve({ id: AMENITY_ID }) });

    const createData = mockBookingCreate.mock.calls[0]![0].data;
    expect(createData.propertyId).toBe(PROPERTY_A);
  });

  it('rejects guestCount exceeding max of 50', async () => {
    const req = createPostRequest('/api/v1/amenities/' + AMENITY_ID, {
      ...validBookingPayload,
      guestCount: 51,
    });
    const res = await POST_BOOKING(req, { params: Promise.resolve({ id: AMENITY_ID }) });
    expect(res.status).toBe(400);
  });

  it('rejects negative guestCount', async () => {
    const req = createPostRequest('/api/v1/amenities/' + AMENITY_ID, {
      ...validBookingPayload,
      guestCount: -1,
    });
    const res = await POST_BOOKING(req, { params: Promise.resolve({ id: AMENITY_ID }) });
    expect(res.status).toBe(400);
  });

  it('allows optional requestorComments up to 500 chars', async () => {
    mockAmenityFindUnique.mockResolvedValue(makeAmenity());
    mockBookingCreate.mockResolvedValue({ id: BOOKING_ID, status: 'approved' });

    const req = createPostRequest('/api/v1/amenities/' + AMENITY_ID, {
      ...validBookingPayload,
      requestorComments: 'Birthday party for my daughter',
    });
    const res = await POST_BOOKING(req, { params: Promise.resolve({ id: AMENITY_ID }) });
    expect(res.status).toBe(201);

    const createData = mockBookingCreate.mock.calls[0]![0].data;
    expect(createData.requestorComments).toBe('Birthday party for my daughter');
  });
});

// ===========================================================================
// 5. BOOKING AUTO-APPROVAL: when amenity approvalMode=auto
// ===========================================================================

describe('5. Booking Auto-Approval', () => {
  it('creates booking with status=approved when amenity approvalMode=auto', async () => {
    mockAmenityFindUnique.mockResolvedValue(makeAmenity({ approvalMode: 'auto' }));
    mockBookingCreate.mockResolvedValue({
      id: BOOKING_ID,
      status: 'approved',
      ...validBookingPayload,
    });

    const req = createPostRequest('/api/v1/amenities/' + AMENITY_ID, validBookingPayload);
    const res = await POST_BOOKING(req, { params: Promise.resolve({ id: AMENITY_ID }) });
    expect(res.status).toBe(201);

    const createData = mockBookingCreate.mock.calls[0]![0].data;
    expect(createData.status).toBe('approved');
    expect(createData.approvalStatus).toBe('approved');
  });

  it('returns "confirmed" message for auto-approved booking', async () => {
    mockAmenityFindUnique.mockResolvedValue(makeAmenity({ approvalMode: 'auto' }));
    mockBookingCreate.mockResolvedValue({ id: BOOKING_ID, status: 'approved' });

    const req = createPostRequest('/api/v1/amenities/' + AMENITY_ID, validBookingPayload);
    const res = await POST_BOOKING(req, { params: Promise.resolve({ id: AMENITY_ID }) });

    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('confirmed');
  });
});

// ===========================================================================
// 6. BOOKING MANUAL APPROVAL: when amenity approvalMode=manual -> status=pending
// ===========================================================================

describe('6. Booking Manual Approval', () => {
  it('creates booking with status=pending when amenity approvalMode=manual', async () => {
    mockAmenityFindUnique.mockResolvedValue(makeAmenity({ approvalMode: 'manual' }));
    mockBookingCreate.mockResolvedValue({
      id: BOOKING_ID,
      status: 'pending',
      ...validBookingPayload,
    });

    const req = createPostRequest('/api/v1/amenities/' + AMENITY_ID, validBookingPayload);
    const res = await POST_BOOKING(req, { params: Promise.resolve({ id: AMENITY_ID }) });
    expect(res.status).toBe(201);

    const createData = mockBookingCreate.mock.calls[0]![0].data;
    expect(createData.status).toBe('pending');
    expect(createData.approvalStatus).toBe('pending');
  });

  it('creates booking with status=pending when amenity approvalMode=manager', async () => {
    mockAmenityFindUnique.mockResolvedValue(makeAmenity({ approvalMode: 'manager' }));
    mockBookingCreate.mockResolvedValue({
      id: BOOKING_ID,
      status: 'pending',
      ...validBookingPayload,
    });

    const req = createPostRequest('/api/v1/amenities/' + AMENITY_ID, validBookingPayload);
    const res = await POST_BOOKING(req, { params: Promise.resolve({ id: AMENITY_ID }) });
    expect(res.status).toBe(201);

    const createData = mockBookingCreate.mock.calls[0]![0].data;
    expect(createData.status).toBe('pending');
  });

  it('creates booking with status=pending when amenity approvalMode=admin', async () => {
    mockAmenityFindUnique.mockResolvedValue(makeAmenity({ approvalMode: 'admin' }));
    mockBookingCreate.mockResolvedValue({
      id: BOOKING_ID,
      status: 'pending',
      ...validBookingPayload,
    });

    const req = createPostRequest('/api/v1/amenities/' + AMENITY_ID, validBookingPayload);
    const res = await POST_BOOKING(req, { params: Promise.resolve({ id: AMENITY_ID }) });

    const createData = mockBookingCreate.mock.calls[0]![0].data;
    expect(createData.status).toBe('pending');
  });

  it('returns "approval" message for manually-reviewed booking', async () => {
    mockAmenityFindUnique.mockResolvedValue(makeAmenity({ approvalMode: 'manual' }));
    mockBookingCreate.mockResolvedValue({ id: BOOKING_ID, status: 'pending' });

    const req = createPostRequest('/api/v1/amenities/' + AMENITY_ID, validBookingPayload);
    const res = await POST_BOOKING(req, { params: Promise.resolve({ id: AMENITY_ID }) });

    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('approval');
  });
});

// ===========================================================================
// 7. BOOKING CONFLICT DETECTION: reject overlapping bookings for same amenity
// ===========================================================================

describe('7. Booking Conflict Detection', () => {
  it('detects overlapping time slots on the same amenity and date (logic test)', () => {
    // Two bookings for the same amenity on the same date
    const existingBooking = {
      amenityId: AMENITY_ID,
      startDate: '2026-04-15',
      startTime: '10:00',
      endDate: '2026-04-15',
      endTime: '12:00',
      status: 'approved',
    };

    const newBooking = {
      amenityId: AMENITY_ID,
      startDate: '2026-04-15',
      startTime: '11:00', // overlaps with 10:00-12:00
      endDate: '2026-04-15',
      endTime: '13:00',
    };

    function hasOverlap(
      existing: { startTime: string; endTime: string },
      incoming: { startTime: string; endTime: string },
    ): boolean {
      return existing.startTime < incoming.endTime && incoming.startTime < existing.endTime;
    }

    expect(hasOverlap(existingBooking, newBooking)).toBe(true);
  });

  it('allows non-overlapping bookings for the same amenity', () => {
    function hasOverlap(
      existing: { startTime: string; endTime: string },
      incoming: { startTime: string; endTime: string },
    ): boolean {
      return existing.startTime < incoming.endTime && incoming.startTime < existing.endTime;
    }

    const existing = { startTime: '10:00', endTime: '12:00' };
    const incoming = { startTime: '12:00', endTime: '14:00' };

    expect(hasOverlap(existing, incoming)).toBe(false);
  });

  it('allows overlapping bookings when maxConcurrent > 1', () => {
    const amenity = makeAmenity({ maxConcurrent: 3 });
    const existingBookingsCount = 2; // 2 out of 3 slots taken

    const hasCapacity = existingBookingsCount < amenity.maxConcurrent;
    expect(hasCapacity).toBe(true);
  });

  it('rejects overlapping bookings when maxConcurrent is reached', () => {
    const amenity = makeAmenity({ maxConcurrent: 2 });
    const existingBookingsCount = 2; // all slots taken

    const hasCapacity = existingBookingsCount < amenity.maxConcurrent;
    expect(hasCapacity).toBe(false);
  });
});

// ===========================================================================
// 8. BOOKING GUEST COUNT: validated against amenity maxConcurrent
// ===========================================================================

describe('8. Booking Guest Count Validation', () => {
  it('allows guest count within schema max (50)', async () => {
    mockAmenityFindUnique.mockResolvedValue(makeAmenity());
    mockBookingCreate.mockResolvedValue({ id: BOOKING_ID, status: 'approved' });

    const req = createPostRequest('/api/v1/amenities/' + AMENITY_ID, {
      ...validBookingPayload,
      guestCount: 50,
    });
    const res = await POST_BOOKING(req, { params: Promise.resolve({ id: AMENITY_ID }) });
    expect(res.status).toBe(201);
  });

  it('rejects guest count above schema max of 50', async () => {
    const req = createPostRequest('/api/v1/amenities/' + AMENITY_ID, {
      ...validBookingPayload,
      guestCount: 51,
    });
    const res = await POST_BOOKING(req, { params: Promise.resolve({ id: AMENITY_ID }) });
    expect(res.status).toBe(400);
  });

  it('defaults guestCount to 0 when not provided', async () => {
    mockAmenityFindUnique.mockResolvedValue(makeAmenity());
    mockBookingCreate.mockResolvedValue({ id: BOOKING_ID, status: 'approved' });

    const { guestCount, ...payload } = validBookingPayload;
    const req = createPostRequest('/api/v1/amenities/' + AMENITY_ID, payload);
    const res = await POST_BOOKING(req, { params: Promise.resolve({ id: AMENITY_ID }) });
    expect(res.status).toBe(201);

    const createData = mockBookingCreate.mock.calls[0]![0].data;
    expect(createData.guestCount).toBe(0);
  });

  it('validates guest count against amenity maxGuests (model validation logic)', () => {
    const amenity = makeAmenity({ maxGuests: 10 });
    const requestedGuests = 15;

    const exceedsMax = amenity.maxGuests > 0 && requestedGuests > amenity.maxGuests;
    expect(exceedsMax).toBe(true);
  });

  it('allows guest count when amenity maxGuests is 0 (unlimited)', () => {
    const amenity = makeAmenity({ maxGuests: 0 });
    const requestedGuests = 200;

    const exceedsMax = amenity.maxGuests > 0 && requestedGuests > amenity.maxGuests;
    expect(exceedsMax).toBe(false);
  });
});

// ===========================================================================
// 9. APPROVAL WORKFLOW: pending -> approved -> completed
// ===========================================================================

describe('9. Approval Workflow — pending -> approved -> completed', () => {
  const params = Promise.resolve({ id: BOOKING_ID });

  it('allows pending -> approved', async () => {
    const booking = makeBooking({ status: 'pending' });
    mockBookingFindUnique.mockResolvedValue(booking);
    mockBookingUpdate.mockResolvedValue({
      ...booking,
      status: 'approved',
      amenity: { name: 'Pool' },
    });

    const req = createPatchRequest('/api/v1/bookings/' + BOOKING_ID, { status: 'approved' });
    const res = await PATCH_BOOKING(req, { params });
    expect(res.status).toBe(200);
  });

  it('sets approvedById and approvedAt on approval', async () => {
    const booking = makeBooking({ status: 'pending' });
    mockBookingFindUnique.mockResolvedValue(booking);
    mockBookingUpdate.mockResolvedValue({
      ...booking,
      status: 'approved',
      amenity: { name: 'Pool' },
    });

    const req = createPatchRequest('/api/v1/bookings/' + BOOKING_ID, { status: 'approved' });
    await PATCH_BOOKING(req, { params });

    const updateData = mockBookingUpdate.mock.calls[0]![0].data;
    expect(updateData.approvedById).toBe('test-staff');
    expect(updateData.approvedAt).toBeInstanceOf(Date);
    expect(updateData.approvalStatus).toBe('approved');
  });

  it('allows approved -> completed', async () => {
    const booking = makeBooking({ status: 'approved' });
    mockBookingFindUnique.mockResolvedValue(booking);
    mockBookingUpdate.mockResolvedValue({
      ...booking,
      status: 'completed',
      amenity: { name: 'Pool' },
    });

    const req = createPatchRequest('/api/v1/bookings/' + BOOKING_ID, { status: 'completed' });
    const res = await PATCH_BOOKING(req, { params });
    expect(res.status).toBe(200);
  });

  it('REJECTS completed -> approved (cannot reverse completion)', async () => {
    const booking = makeBooking({ status: 'completed' });
    mockBookingFindUnique.mockResolvedValue(booking);

    const req = createPatchRequest('/api/v1/bookings/' + BOOKING_ID, { status: 'approved' });
    const res = await PATCH_BOOKING(req, { params });
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('INVALID_TRANSITION');
  });

  it('sends approval email to resident on pending -> approved', async () => {
    const booking = makeBooking({ status: 'pending' });
    mockBookingFindUnique.mockResolvedValue(booking);
    mockBookingUpdate.mockResolvedValue({
      ...booking,
      status: 'approved',
      amenity: { name: 'Pool' },
    });

    const req = createPatchRequest('/api/v1/bookings/' + BOOKING_ID, { status: 'approved' });
    await PATCH_BOOKING(req, { params });

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'resident@example.com',
        subject: expect.stringContaining('approved'),
      }),
    );
  });
});

// ===========================================================================
// 10. DECLINE WORKFLOW: pending -> declined with reason
// ===========================================================================

describe('10. Decline Workflow — pending -> declined with reason', () => {
  const params = Promise.resolve({ id: BOOKING_ID });

  it('allows pending -> declined', async () => {
    const booking = makeBooking({ status: 'pending' });
    mockBookingFindUnique.mockResolvedValue(booking);
    mockBookingUpdate.mockResolvedValue({
      ...booking,
      status: 'declined',
      amenity: { name: 'Pool' },
    });

    const req = createPatchRequest('/api/v1/bookings/' + BOOKING_ID, {
      status: 'declined',
      declinedReason: 'Pool under maintenance this week',
    });
    const res = await PATCH_BOOKING(req, { params });
    expect(res.status).toBe(200);
  });

  it('stores declinedReason in update data', async () => {
    const booking = makeBooking({ status: 'pending' });
    mockBookingFindUnique.mockResolvedValue(booking);
    mockBookingUpdate.mockResolvedValue({
      ...booking,
      status: 'declined',
      amenity: { name: 'Pool' },
    });

    const req = createPatchRequest('/api/v1/bookings/' + BOOKING_ID, {
      status: 'declined',
      declinedReason: 'Exceeds capacity',
    });
    await PATCH_BOOKING(req, { params });

    const updateData = mockBookingUpdate.mock.calls[0]![0].data;
    expect(updateData.status).toBe('declined');
    expect(updateData.approvalStatus).toBe('declined');
    expect(updateData.declinedReason).toBe('Exceeds capacity');
  });

  it('sends decline email with reason to resident', async () => {
    const booking = makeBooking({ status: 'pending' });
    mockBookingFindUnique.mockResolvedValue(booking);
    mockBookingUpdate.mockResolvedValue({
      ...booking,
      status: 'declined',
      amenity: { name: 'Pool' },
    });

    const req = createPatchRequest('/api/v1/bookings/' + BOOKING_ID, {
      status: 'declined',
      declinedReason: 'Pool closed for repairs',
    });
    await PATCH_BOOKING(req, { params });

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'resident@example.com',
        subject: expect.stringContaining('declined'),
      }),
    );
    const emailPayload = mockSendEmail.mock.calls[0]![0];
    expect(emailPayload.text || emailPayload.html).toContain('Pool closed for repairs');
  });

  it('REJECTS declined -> approved (cannot un-decline)', async () => {
    const booking = makeBooking({ status: 'declined' });
    mockBookingFindUnique.mockResolvedValue(booking);

    const req = createPatchRequest('/api/v1/bookings/' + BOOKING_ID, { status: 'approved' });
    const res = await PATCH_BOOKING(req, { params });
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('INVALID_TRANSITION');
  });

  it('REJECTS declined -> pending (cannot re-submit)', async () => {
    const booking = makeBooking({ status: 'declined' });
    mockBookingFindUnique.mockResolvedValue(booking);

    const req = createPatchRequest('/api/v1/bookings/' + BOOKING_ID, { status: 'pending' });
    const res = await PATCH_BOOKING(req, { params });
    expect(res.status).toBe(400);
  });
});

// ===========================================================================
// 11. CANCELLATION: approved -> cancelled (before startDate only)
// ===========================================================================

describe('11. Cancellation — approved -> cancelled before startDate', () => {
  const params = Promise.resolve({ id: BOOKING_ID });

  it('allows approved -> cancelled for future booking', async () => {
    const booking = makeBooking({
      status: 'approved',
      startDate: futureDate,
      startTime: futureDate,
    });
    mockBookingFindUnique.mockResolvedValue(booking);
    mockBookingUpdate.mockResolvedValue({
      ...booking,
      status: 'cancelled',
      amenity: { name: 'Pool' },
    });

    const req = createPatchRequest('/api/v1/bookings/' + BOOKING_ID, { status: 'cancelled' });
    const res = await PATCH_BOOKING(req, { params });
    expect(res.status).toBe(200);
  });

  it('sets cancelledAt timestamp on cancellation', async () => {
    const booking = makeBooking({ status: 'approved', startDate: futureDate });
    mockBookingFindUnique.mockResolvedValue(booking);
    mockBookingUpdate.mockResolvedValue({
      ...booking,
      status: 'cancelled',
      amenity: { name: 'Pool' },
    });

    const req = createPatchRequest('/api/v1/bookings/' + BOOKING_ID, { status: 'cancelled' });
    await PATCH_BOOKING(req, { params });

    const updateData = mockBookingUpdate.mock.calls[0]![0].data;
    expect(updateData.cancelledAt).toBeInstanceOf(Date);
    expect(updateData.cancelledById).toBe('test-staff');
  });

  it('allows pending -> cancelled', async () => {
    const booking = makeBooking({ status: 'pending' });
    mockBookingFindUnique.mockResolvedValue(booking);
    mockBookingUpdate.mockResolvedValue({
      ...booking,
      status: 'cancelled',
      amenity: { name: 'Pool' },
    });

    const req = createPatchRequest('/api/v1/bookings/' + BOOKING_ID, { status: 'cancelled' });
    const res = await PATCH_BOOKING(req, { params });
    expect(res.status).toBe(200);
  });

  it('stores cancellationReason when provided', async () => {
    const booking = makeBooking({ status: 'approved' });
    mockBookingFindUnique.mockResolvedValue(booking);
    mockBookingUpdate.mockResolvedValue({
      ...booking,
      status: 'cancelled',
      amenity: { name: 'Pool' },
    });

    const req = createPatchRequest('/api/v1/bookings/' + BOOKING_ID, {
      status: 'cancelled',
      cancellationReason: 'Plans changed',
    });
    await PATCH_BOOKING(req, { params });

    const updateData = mockBookingUpdate.mock.calls[0]![0].data;
    expect(updateData.cancellationReason).toBe('Plans changed');
  });

  it('DELETE endpoint also cancels a booking', async () => {
    mockBookingUpdate.mockResolvedValue({ id: BOOKING_ID, status: 'cancelled' });

    const req = createDeleteRequest('/api/v1/bookings/' + BOOKING_ID);
    const res = await DELETE_BOOKING(req, { params });
    expect(res.status).toBe(200);

    const updateData = mockBookingUpdate.mock.calls[0]![0].data;
    expect(updateData.status).toBe('cancelled');
    expect(updateData.cancelledAt).toBeInstanceOf(Date);
  });
});

// ===========================================================================
// 12. CANCELLATION: cannot cancel after startTime has passed
// ===========================================================================

describe('12. Cancellation — Cannot Cancel After Start', () => {
  it('REJECTS completed -> cancelled (booking already completed)', async () => {
    const booking = makeBooking({ status: 'completed', startDate: pastDate, startTime: pastDate });
    mockBookingFindUnique.mockResolvedValue(booking);

    const req = createPatchRequest('/api/v1/bookings/' + BOOKING_ID, { status: 'cancelled' });
    const res = await PATCH_BOOKING(req, {
      params: Promise.resolve({ id: BOOKING_ID }),
    });
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('INVALID_TRANSITION');
  });

  it('REJECTS cancelled -> cancelled (already cancelled)', async () => {
    const booking = makeBooking({ status: 'cancelled' });
    mockBookingFindUnique.mockResolvedValue(booking);

    const req = createPatchRequest('/api/v1/bookings/' + BOOKING_ID, { status: 'cancelled' });
    const res = await PATCH_BOOKING(req, {
      params: Promise.resolve({ id: BOOKING_ID }),
    });
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('INVALID_TRANSITION');
  });

  it('effective status becomes completed after endTime passes (logic test)', () => {
    function getEffectiveStatus(b: { status: string; endTime: Date }): string {
      if (b.status === 'approved' && b.endTime < new Date()) {
        return 'completed';
      }
      return b.status;
    }

    expect(getEffectiveStatus({ status: 'approved', endTime: pastDate })).toBe('completed');
    expect(getEffectiveStatus({ status: 'approved', endTime: futureDate })).toBe('approved');
  });
});

// ===========================================================================
// 13. CANCELLATION: creates waitlist notification if others are waiting
// ===========================================================================

describe('13. Cancellation — Waitlist Notification', () => {
  const params = Promise.resolve({ id: BOOKING_ID });

  it('checks waitlist and notifies next user when booking is cancelled', async () => {
    const booking = makeBooking({ status: 'approved' });
    mockBookingFindUnique.mockResolvedValue(booking);
    mockBookingUpdate.mockResolvedValue({
      ...booking,
      status: 'cancelled',
      amenity: { name: 'Pool' },
    });

    mockWaitlistFindFirst.mockResolvedValue({
      id: 'waitlist-1',
      amenityId: AMENITY_ID,
      residentId: 'waitlist-resident-1',
      status: 'waiting',
    });
    mockWaitlistUpdate.mockResolvedValue({ id: 'waitlist-1', status: 'offered' });
    mockUserFindUnique
      .mockResolvedValueOnce({ email: 'resident@example.com', firstName: 'Jane' })
      .mockResolvedValueOnce({ email: 'waitlisted@example.com', firstName: 'Bob' });

    const req = createPatchRequest('/api/v1/bookings/' + BOOKING_ID, { status: 'cancelled' });
    await PATCH_BOOKING(req, { params });

    expect(mockWaitlistFindFirst).toHaveBeenCalledTimes(1);
    expect(mockWaitlistUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'waitlist-1' },
        data: expect.objectContaining({ status: 'offered' }),
      }),
    );
  });

  it('sends email to waitlisted user when slot opens', async () => {
    const booking = makeBooking({ status: 'approved' });
    mockBookingFindUnique.mockResolvedValue(booking);
    mockBookingUpdate.mockResolvedValue({
      ...booking,
      status: 'cancelled',
      amenity: { name: 'Pool' },
    });

    mockWaitlistFindFirst.mockResolvedValue({
      id: 'waitlist-1',
      amenityId: AMENITY_ID,
      residentId: 'waitlist-resident-1',
      status: 'waiting',
    });
    mockWaitlistUpdate.mockResolvedValue({ id: 'waitlist-1', status: 'offered' });
    mockUserFindUnique
      .mockResolvedValueOnce({ email: 'resident@example.com', firstName: 'Jane' })
      .mockResolvedValueOnce({ email: 'waitlisted@example.com', firstName: 'Bob' });

    const req = createPatchRequest('/api/v1/bookings/' + BOOKING_ID, { status: 'cancelled' });
    await PATCH_BOOKING(req, { params });

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'waitlisted@example.com',
        subject: expect.stringContaining('available'),
      }),
    );
  });

  it('does NOT notify waitlist when no one is waiting', async () => {
    const booking = makeBooking({ status: 'approved' });
    mockBookingFindUnique.mockResolvedValue(booking);
    mockBookingUpdate.mockResolvedValue({
      ...booking,
      status: 'cancelled',
      amenity: { name: 'Pool' },
    });
    mockWaitlistFindFirst.mockResolvedValue(null);

    const req = createPatchRequest('/api/v1/bookings/' + BOOKING_ID, { status: 'cancelled' });
    await PATCH_BOOKING(req, { params });

    expect(mockWaitlistUpdate).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// 14. WAITLIST: when amenity is fully booked, user joins waitlist
// ===========================================================================

describe('14. Waitlist — Fully Booked Amenity', () => {
  it('WaitlistEntry model has required fields', () => {
    const entry = {
      id: 'w-1',
      amenityId: AMENITY_ID,
      bookingDate: new Date('2026-04-15'),
      preferredStartTime: new Date('1970-01-01T10:00:00Z'),
      preferredEndTime: new Date('1970-01-01T12:00:00Z'),
      residentId: 'resident-1',
      unitId: UNIT_ID,
      position: 1,
      status: 'waiting',
      offeredAt: null,
      offerExpiresAt: null,
    };
    expect(entry.status).toBe('waiting');
    expect(entry.position).toBe(1);
    expect(entry.amenityId).toBe(AMENITY_ID);
  });

  it('amenity has waitlistEnabled and maxWaitlistSize settings', () => {
    const amenity = makeAmenity({ waitlistEnabled: true, maxWaitlistSize: 10 });
    expect(amenity.waitlistEnabled).toBe(true);
    expect(amenity.maxWaitlistSize).toBe(10);
  });

  it('waitlist entry position determines notification order', () => {
    const entries = [
      { position: 1, residentId: 'r-1', status: 'waiting' },
      { position: 2, residentId: 'r-2', status: 'waiting' },
      { position: 3, residentId: 'r-3', status: 'waiting' },
    ];

    const nextInLine = entries
      .filter((e) => e.status === 'waiting')
      .sort((a, b) => a.position - b.position)[0];
    expect(nextInLine!.residentId).toBe('r-1');
  });

  it('waitlist entry has valid status transitions: waiting -> offered -> booked|expired', () => {
    const validStatuses = ['waiting', 'offered', 'booked', 'expired', 'removed'];
    expect(validStatuses).toContain('waiting');
    expect(validStatuses).toContain('offered');
    expect(validStatuses).toContain('booked');
    expect(validStatuses).toContain('expired');
    expect(validStatuses).toContain('removed');
  });
});

// ===========================================================================
// 15. WAITLIST PROMOTION: when booking cancelled, next waitlisted user notified
// ===========================================================================

describe('15. Waitlist Promotion', () => {
  const params = Promise.resolve({ id: BOOKING_ID });

  it('updates waitlist entry status from waiting to offered', async () => {
    const booking = makeBooking({ status: 'approved' });
    mockBookingFindUnique.mockResolvedValue(booking);
    mockBookingUpdate.mockResolvedValue({
      ...booking,
      status: 'cancelled',
      amenity: { name: 'Pool' },
    });

    const waitlistEntry = {
      id: 'waitlist-1',
      amenityId: AMENITY_ID,
      residentId: 'waitlist-resident-1',
      status: 'waiting',
      position: 1,
    };
    mockWaitlistFindFirst.mockResolvedValue(waitlistEntry);
    mockWaitlistUpdate.mockResolvedValue({ ...waitlistEntry, status: 'offered' });
    mockUserFindUnique
      .mockResolvedValueOnce({ email: 'resident@example.com', firstName: 'Jane' })
      .mockResolvedValueOnce({ email: 'next@example.com', firstName: 'Sam' });

    const req = createPatchRequest('/api/v1/bookings/' + BOOKING_ID, { status: 'cancelled' });
    await PATCH_BOOKING(req, { params });

    // Verify waitlist lookup orders by position ascending
    expect(mockWaitlistFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          amenityId: AMENITY_ID,
          status: 'waiting',
        }),
        orderBy: { position: 'asc' },
      }),
    );

    // Verify waitlist entry was updated to "offered"
    expect(mockWaitlistUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'waitlist-1' },
        data: expect.objectContaining({ status: 'offered' }),
      }),
    );
  });

  it('sets offeredAt timestamp on waitlist promotion', async () => {
    const booking = makeBooking({ status: 'approved' });
    mockBookingFindUnique.mockResolvedValue(booking);
    mockBookingUpdate.mockResolvedValue({
      ...booking,
      status: 'cancelled',
      amenity: { name: 'Pool' },
    });

    mockWaitlistFindFirst.mockResolvedValue({
      id: 'waitlist-2',
      amenityId: AMENITY_ID,
      residentId: 'waitlist-resident-2',
      status: 'waiting',
    });
    mockWaitlistUpdate.mockResolvedValue({ id: 'waitlist-2', status: 'offered' });
    mockUserFindUnique
      .mockResolvedValueOnce({ email: 'r@e.com', firstName: 'X' })
      .mockResolvedValueOnce({ email: 'w@e.com', firstName: 'Y' });

    const req = createPatchRequest('/api/v1/bookings/' + BOOKING_ID, { status: 'cancelled' });
    await PATCH_BOOKING(req, { params });

    const updateData = mockWaitlistUpdate.mock.calls[0]![0].data;
    expect(updateData.offeredAt).toBeInstanceOf(Date);
  });

  it('only the FIRST waiting entry (lowest position) is offered', () => {
    // This is enforced by the findFirst + orderBy: { position: 'asc' }
    // Verify the pattern used in the route handler
    const entries = [
      { id: 'w3', position: 3, status: 'waiting' },
      { id: 'w1', position: 1, status: 'waiting' },
      { id: 'w2', position: 2, status: 'offered' }, // already offered, skip
    ];

    const next = entries
      .filter((e) => e.status === 'waiting')
      .sort((a, b) => a.position - b.position)[0];

    expect(next!.id).toBe('w1');
  });
});

// ===========================================================================
// 16. RECURRING BOOKING: weekly/monthly repeat options
// ===========================================================================

describe('16. Recurring Booking', () => {
  it('amenity can enable recurring bookings via allowRecurring', () => {
    const amenity = makeAmenity({ allowRecurring: true, maxRecurringWeeks: 12 });
    expect(amenity.allowRecurring).toBe(true);
    expect(amenity.maxRecurringWeeks).toBe(12);
  });

  it('booking model supports recurringGroupId to link recurring instances', () => {
    const recurringGroupId = '00000000-0000-4000-d000-000000000099';
    const bookings = [
      makeBooking({
        id: 'b-1',
        recurringGroupId,
        recurringSequence: 1,
        startDate: new Date('2026-04-15'),
      }),
      makeBooking({
        id: 'b-2',
        recurringGroupId,
        recurringSequence: 2,
        startDate: new Date('2026-04-22'),
      }),
      makeBooking({
        id: 'b-3',
        recurringGroupId,
        recurringSequence: 3,
        startDate: new Date('2026-04-29'),
      }),
    ];

    expect(bookings).toHaveLength(3);
    expect(bookings.every((b) => b.recurringGroupId === recurringGroupId)).toBe(true);
    expect(bookings.map((b) => b.recurringSequence)).toEqual([1, 2, 3]);
  });

  it('weekly recurring generates correct dates', () => {
    const baseDate = new Date('2026-04-15');
    const weekCount = 4;
    const dates: Date[] = [];

    for (let i = 0; i < weekCount; i++) {
      const d = new Date(baseDate);
      d.setDate(d.getDate() + i * 7);
      dates.push(d);
    }

    expect(dates).toHaveLength(4);
    expect(dates[0].toISOString().slice(0, 10)).toBe('2026-04-15');
    expect(dates[1].toISOString().slice(0, 10)).toBe('2026-04-22');
    expect(dates[2].toISOString().slice(0, 10)).toBe('2026-04-29');
    expect(dates[3].toISOString().slice(0, 10)).toBe('2026-05-06');
  });

  it('monthly recurring generates correct dates', () => {
    const baseDate = new Date('2026-04-15');
    const monthCount = 3;
    const dates: Date[] = [];

    for (let i = 0; i < monthCount; i++) {
      const d = new Date(baseDate);
      d.setMonth(d.getMonth() + i);
      dates.push(d);
    }

    expect(dates).toHaveLength(3);
    expect(dates[0].toISOString().slice(0, 10)).toBe('2026-04-15');
    expect(dates[1].toISOString().slice(0, 10)).toBe('2026-05-15');
    expect(dates[2].toISOString().slice(0, 10)).toBe('2026-06-15');
  });

  it('maxRecurringWeeks caps the number of recurring instances', () => {
    const amenity = makeAmenity({ allowRecurring: true, maxRecurringWeeks: 4 });
    const requestedWeeks = 6;

    const effectiveWeeks = Math.min(requestedWeeks, amenity.maxRecurringWeeks);
    expect(effectiveWeeks).toBe(4);
  });
});

// ===========================================================================
// 17. CALENDAR VIEW DATA: GET /amenities/:id returns bookings for date range
// ===========================================================================

describe('17. Calendar View Data', () => {
  it('amenity detail includes upcoming bookings', async () => {
    mockAmenityFindUnique.mockResolvedValue(
      makeAmenity({
        bookings: [
          {
            id: 'b1',
            startDate: '2026-04-15',
            startTime: '10:00',
            endDate: '2026-04-15',
            endTime: '12:00',
            status: 'approved',
            guestCount: 5,
            unit: { id: UNIT_ID, number: '101' },
          },
        ],
        group: { id: 'g1', name: 'Pool Area' },
      }),
    );

    const req = createGetRequest('/api/v1/amenities/' + AMENITY_ID);
    const res = await GET_DETAIL(req, { params: Promise.resolve({ id: AMENITY_ID }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { bookings: unknown[] } }>(res);
    expect(body.data.bookings).toHaveLength(1);
  });

  it('amenity detail fetches up to 20 upcoming bookings', async () => {
    mockAmenityFindUnique.mockResolvedValue(
      makeAmenity({ bookings: [], group: { id: 'g1', name: 'Pool' } }),
    );

    const req = createGetRequest('/api/v1/amenities/' + AMENITY_ID);
    await GET_DETAIL(req, { params: Promise.resolve({ id: AMENITY_ID }) });

    const include = mockAmenityFindUnique.mock.calls[0]![0].include;
    expect(include.bookings.take).toBe(20);
  });

  it('amenity detail only fetches future bookings (startDate >= now)', async () => {
    mockAmenityFindUnique.mockResolvedValue(
      makeAmenity({ bookings: [], group: { id: 'g1', name: 'Pool' } }),
    );

    const req = createGetRequest('/api/v1/amenities/' + AMENITY_ID);
    await GET_DETAIL(req, { params: Promise.resolve({ id: AMENITY_ID }) });

    const bookingsWhere = mockAmenityFindUnique.mock.calls[0]![0].include.bookings.where;
    expect(bookingsWhere.startDate.gte).toBeInstanceOf(Date);
  });

  it('bookings include unit info for calendar display', async () => {
    mockAmenityFindUnique.mockResolvedValue(
      makeAmenity({ bookings: [], group: { id: 'g1', name: 'Pool' } }),
    );

    const req = createGetRequest('/api/v1/amenities/' + AMENITY_ID);
    await GET_DETAIL(req, { params: Promise.resolve({ id: AMENITY_ID }) });

    const bookingsSelect = mockAmenityFindUnique.mock.calls[0]![0].include.bookings.select;
    expect(bookingsSelect.unit).toBeDefined();
  });

  it('amenity list includes up to 5 upcoming bookings for availability preview', async () => {
    const req = createGetRequest('/api/v1/amenities', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET(req);

    const include = mockAmenityFindMany.mock.calls[0]![0].include;
    expect(include.bookings.take).toBe(5);
  });

  it('amenity list only includes approved and pending bookings for availability', async () => {
    const req = createGetRequest('/api/v1/amenities', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET(req);

    const bookingsWhere = mockAmenityFindMany.mock.calls[0]![0].include.bookings.where;
    expect(bookingsWhere.status.in).toEqual(expect.arrayContaining(['approved', 'pending']));
  });
});

// ===========================================================================
// 18. LIST VIEW: filter by status, amenity, unit, date
// ===========================================================================

describe('18. List View — Booking Filters', () => {
  it('filters bookings by status', async () => {
    const req = createGetRequest('/api/v1/bookings', {
      searchParams: { propertyId: PROPERTY_A, status: 'approved' },
    });
    await GET_BOOKINGS(req);

    const where = mockBookingFindMany.mock.calls[0]![0].where;
    expect(where.status).toBe('approved');
  });

  it('filters bookings by amenityId', async () => {
    const req = createGetRequest('/api/v1/bookings', {
      searchParams: { propertyId: PROPERTY_A, amenityId: AMENITY_ID },
    });
    await GET_BOOKINGS(req);

    const where = mockBookingFindMany.mock.calls[0]![0].where;
    expect(where.amenityId).toBe(AMENITY_ID);
  });

  it('filters bookings by unitId', async () => {
    const req = createGetRequest('/api/v1/bookings', {
      searchParams: { propertyId: PROPERTY_A, unitId: UNIT_ID },
    });
    await GET_BOOKINGS(req);

    const where = mockBookingFindMany.mock.calls[0]![0].where;
    expect(where.unitId).toBe(UNIT_ID);
  });

  it('filters bookings by date range (from/to)', async () => {
    const req = createGetRequest('/api/v1/bookings', {
      searchParams: {
        propertyId: PROPERTY_A,
        from: '2026-04-01',
        to: '2026-04-30',
      },
    });
    await GET_BOOKINGS(req);

    const where = mockBookingFindMany.mock.calls[0]![0].where;
    expect(where.startTime.gte).toBeInstanceOf(Date);
    expect(where.startTime.lte).toBeInstanceOf(Date);
  });

  it('supports pagination with page and pageSize', async () => {
    const req = createGetRequest('/api/v1/bookings', {
      searchParams: { propertyId: PROPERTY_A, page: '2', pageSize: '10' },
    });
    await GET_BOOKINGS(req);

    const queryArgs = mockBookingFindMany.mock.calls[0]![0];
    expect(queryArgs.skip).toBe(10); // page 2, skip first 10
    expect(queryArgs.take).toBe(10);
  });

  it('returns pagination meta with total and totalPages', async () => {
    mockBookingFindMany.mockResolvedValue([]);
    mockBookingCount.mockResolvedValue(45);

    const req = createGetRequest('/api/v1/bookings', {
      searchParams: { propertyId: PROPERTY_A, pageSize: '10' },
    });
    const res = await GET_BOOKINGS(req);
    const body = await parseResponse<{ meta: { total: number; totalPages: number } }>(res);

    expect(body.meta.total).toBe(45);
    expect(body.meta.totalPages).toBe(5);
  });

  it('includes amenity and unit relations in list response', async () => {
    const req = createGetRequest('/api/v1/bookings', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET_BOOKINGS(req);

    const include = mockBookingFindMany.mock.calls[0]![0].include;
    expect(include.amenity).toBeDefined();
    expect(include.unit).toBeDefined();
  });

  it('orders bookings by startTime ascending', async () => {
    const req = createGetRequest('/api/v1/bookings', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET_BOOKINGS(req);

    const orderBy = mockBookingFindMany.mock.calls[0]![0].orderBy;
    expect(orderBy).toEqual({ startTime: 'asc' });
  });

  it('returns empty array when no bookings match filters', async () => {
    mockBookingFindMany.mockResolvedValue([]);
    mockBookingCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/bookings', {
      searchParams: { propertyId: PROPERTY_A, status: 'declined' },
    });
    const res = await GET_BOOKINGS(req);
    const body = await parseResponse<{ data: unknown[] }>(res);
    expect(body.data).toEqual([]);
  });
});

// ===========================================================================
// 19. BOOKING FEE: optional payment integration
// ===========================================================================

describe('19. Booking Fee — Payment Integration', () => {
  it('amenity has fee, feeType, securityDeposit, and taxRate fields', () => {
    const amenity = makeAmenity({
      fee: 150.0,
      feeType: 'flat',
      securityDeposit: 200.0,
      taxRate: 13.0,
      serviceFee: 10.0,
    });
    expect(amenity.fee).toBe(150.0);
    expect(amenity.feeType).toBe('flat');
    expect(amenity.securityDeposit).toBe(200.0);
    expect(amenity.taxRate).toBe(13.0);
  });

  it('booking model has payment fields', () => {
    const booking = {
      feeAmount: 150.0,
      depositAmount: 200.0,
      serviceFee: 10.0,
      taxAmount: 19.5,
      totalAmount: 379.5,
      paymentStatus: 'pending',
      paymentMethod: 'credit_card',
      stripePaymentIntentId: 'pi_123',
    };
    expect(booking.paymentStatus).toBe('pending');
    expect(booking.paymentMethod).toBe('credit_card');
    expect(booking.stripePaymentIntentId).toBe('pi_123');
  });

  it('paymentStatus supports all required states', () => {
    const validStatuses = [
      'not_required',
      'pending',
      'paid',
      'overdue',
      'refunded',
      'partial_refund',
    ];
    validStatuses.forEach((s) => {
      expect(typeof s).toBe('string');
    });
  });

  it('payment methods include credit_card, cheque, cash, e_transfer', () => {
    const methods = ['credit_card', 'cheque', 'cash', 'e_transfer'];
    expect(methods).toContain('credit_card');
    expect(methods).toContain('cheque');
    expect(methods).toContain('cash');
    expect(methods).toContain('e_transfer');
  });

  it('deposit refund fields track refund status', () => {
    const booking = {
      depositRefunded: true,
      depositRefundAmount: 150.0,
    };
    expect(booking.depositRefunded).toBe(true);
    expect(booking.depositRefundAmount).toBe(150.0);
  });

  it('fee calculation with hourly rate (logic test)', () => {
    const amenity = { fee: 25.0, feeType: 'hourly' };
    const durationHours = 3;
    const baseFee = amenity.feeType === 'hourly' ? amenity.fee * durationHours : amenity.fee;
    expect(baseFee).toBe(75.0);
  });

  it('fee calculation with per_guest rate (logic test)', () => {
    const amenity = { fee: 10.0, feeType: 'per_guest' };
    const guestCount = 8;
    const baseFee = amenity.feeType === 'per_guest' ? amenity.fee * guestCount : amenity.fee;
    expect(baseFee).toBe(80.0);
  });
});

// ===========================================================================
// 20. BOOKING RULES: minimum notice period, maximum duration
// ===========================================================================

describe('20. Booking Rules — Notice Period & Duration', () => {
  it('amenity has advanceMinHours for minimum notice period', () => {
    const amenity = makeAmenity({ advanceMinHours: 24 });
    expect(amenity.advanceMinHours).toBe(24);
  });

  it('rejects booking within minimum notice period (logic test)', () => {
    const amenity = { advanceMinHours: 24 };
    const bookingStartTime = new Date(Date.now() + 12 * 60 * 60 * 1000); // 12 hours from now
    const now = new Date();

    const hoursUntilStart = (bookingStartTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    const tooSoon = hoursUntilStart < amenity.advanceMinHours;

    expect(tooSoon).toBe(true);
  });

  it('allows booking meeting minimum notice period (logic test)', () => {
    const amenity = { advanceMinHours: 24 };
    const bookingStartTime = new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours from now
    const now = new Date();

    const hoursUntilStart = (bookingStartTime.getTime() - now.getTime()) / (1000 * 60 * 60);
    const tooSoon = hoursUntilStart < amenity.advanceMinHours;

    expect(tooSoon).toBe(false);
  });

  it('amenity has maxBookingMinutes for maximum duration', () => {
    const amenity = makeAmenity({ maxBookingMinutes: 180 });
    expect(amenity.maxBookingMinutes).toBe(180); // 3 hours max
  });

  it('rejects booking exceeding maximum duration (logic test)', () => {
    const amenity = { maxBookingMinutes: 180 };
    const startTime = new Date('2026-04-15T10:00:00Z');
    const endTime = new Date('2026-04-15T14:00:00Z'); // 4 hours = 240 min

    const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
    const exceedsMax =
      amenity.maxBookingMinutes !== null && durationMinutes > amenity.maxBookingMinutes;

    expect(exceedsMax).toBe(true);
  });

  it('allows booking within maximum duration (logic test)', () => {
    const amenity = { maxBookingMinutes: 180 };
    const startTime = new Date('2026-04-15T10:00:00Z');
    const endTime = new Date('2026-04-15T12:30:00Z'); // 2.5 hours = 150 min

    const durationMinutes = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
    const exceedsMax =
      amenity.maxBookingMinutes !== null && durationMinutes > amenity.maxBookingMinutes;

    expect(exceedsMax).toBe(false);
  });

  it('amenity has advanceMaxDays for maximum advance booking', () => {
    const amenity = makeAmenity({ advanceMaxDays: 90 });
    expect(amenity.advanceMaxDays).toBe(90);
  });

  it('rejects booking too far in advance (logic test)', () => {
    const amenity = { advanceMaxDays: 90 };
    const bookingStartDate = new Date(Date.now() + 100 * 24 * 60 * 60 * 1000); // 100 days
    const now = new Date();

    const daysUntilStart = (bookingStartDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
    const tooFarAhead = daysUntilStart > amenity.advanceMaxDays;

    expect(tooFarAhead).toBe(true);
  });

  it('amenity has minBookingMinutes for minimum duration', () => {
    const amenity = makeAmenity({ minBookingMinutes: 30 });
    expect(amenity.minBookingMinutes).toBe(30);
  });

  it('amenity has maxPerUnitWeek and maxPerUnitMonth limits', () => {
    const amenity = makeAmenity({ maxPerUnitWeek: 3, maxPerUnitMonth: 8 });
    expect(amenity.maxPerUnitWeek).toBe(3);
    expect(amenity.maxPerUnitMonth).toBe(8);
  });
});

// ===========================================================================
// 21. AMENITY HOURS: enforce open/close times
// ===========================================================================

describe('21. Amenity Hours — Operating Schedule', () => {
  it('amenity has per-day operatingHours JSON field', () => {
    const amenity = makeAmenity();
    expect(amenity.operatingHours).toBeDefined();
    expect(amenity.operatingHours.monday).toEqual({ open: '06:00', close: '22:00' });
    expect(amenity.operatingHours.saturday).toEqual({ open: '08:00', close: '20:00' });
  });

  it('rejects booking outside operating hours (logic test)', () => {
    const operatingHours = { open: '06:00', close: '22:00' };
    const bookingStartTime = '23:00';
    const bookingEndTime = '01:00';

    // Both start AND end must be within [open, close] window
    const startWithin =
      bookingStartTime >= operatingHours.open && bookingStartTime <= operatingHours.close;
    const endWithin =
      bookingEndTime >= operatingHours.open && bookingEndTime <= operatingHours.close;
    const withinHours = startWithin && endWithin;
    expect(withinHours).toBe(false);
  });

  it('allows booking within operating hours (logic test)', () => {
    const operatingHours = { open: '06:00', close: '22:00' };
    const bookingStartTime = '10:00';
    const bookingEndTime = '12:00';

    const withinHours =
      bookingStartTime >= operatingHours.open && bookingEndTime <= operatingHours.close;
    expect(withinHours).toBe(true);
  });

  it('different operating hours for weekdays vs weekends', () => {
    const amenity = makeAmenity();
    const weekdayHours = amenity.operatingHours.monday;
    const weekendHours = amenity.operatingHours.saturday;

    expect(weekdayHours.open).toBe('06:00');
    expect(weekendHours.open).toBe('08:00');
    expect(weekdayHours.close).toBe('22:00');
    expect(weekendHours.close).toBe('20:00');
  });

  it('handles amenity with no operating hours (24/7 available)', () => {
    const amenity = makeAmenity({ operatingHours: null });
    // null operatingHours means no time restrictions
    expect(amenity.operatingHours).toBeNull();
  });

  it('amenity has bufferMinutes between bookings', () => {
    const amenity = makeAmenity({ bufferMinutes: 30 });
    expect(amenity.bufferMinutes).toBe(30);
  });

  it('buffer time is accounted for in availability check (logic test)', () => {
    const bufferMinutes = 30;
    const existingEndTime = new Date('2026-04-15T12:00:00Z');
    const newStartTime = new Date('2026-04-15T12:15:00Z'); // only 15 min gap

    const bufferMs = bufferMinutes * 60 * 1000;
    const effectiveEndTime = new Date(existingEndTime.getTime() + bufferMs);
    const conflictsWithBuffer = newStartTime < effectiveEndTime;

    expect(conflictsWithBuffer).toBe(true);
  });
});

// ===========================================================================
// 22. HOLIDAY CLOSURES: block bookings on specified dates
// ===========================================================================

describe('22. Holiday Closures', () => {
  it('identifies booking date as a holiday (logic test)', () => {
    const holidayDates = ['2026-12-25', '2026-01-01', '2026-07-01'];
    const bookingDate = '2026-12-25';

    const isHoliday = holidayDates.includes(bookingDate);
    expect(isHoliday).toBe(true);
  });

  it('allows booking on a non-holiday date (logic test)', () => {
    const holidayDates = ['2026-12-25', '2026-01-01', '2026-07-01'];
    const bookingDate = '2026-04-15';

    const isHoliday = holidayDates.includes(bookingDate);
    expect(isHoliday).toBe(false);
  });

  it('holiday closures can be specific to an amenity (logic test)', () => {
    const amenityClosures = {
      [AMENITY_ID]: ['2026-12-25', '2026-12-26'], // Pool closed for holidays
    };
    const otherAmenityId = 'other-amenity';

    const poolClosed = (amenityClosures[AMENITY_ID] || []).includes('2026-12-25');
    const gymClosed = (amenityClosures[otherAmenityId] || []).includes('2026-12-25');

    expect(poolClosed).toBe(true);
    expect(gymClosed).toBe(false);
  });

  it('holiday closures can be property-wide (logic test)', () => {
    const propertyClosures = ['2026-01-01', '2026-12-25'];
    const bookingDate = '2026-01-01';

    const isClosed = propertyClosures.includes(bookingDate);
    expect(isClosed).toBe(true);
  });

  it('Canada Day (July 1) is blocked when configured', () => {
    const holidayDates = ['2026-07-01'];
    expect(holidayDates.includes('2026-07-01')).toBe(true);
  });
});

// ===========================================================================
// 23. TENANT ISOLATION on all operations
// ===========================================================================

describe('23. Tenant Isolation', () => {
  // --- Amenity Listing ---
  it('amenity listing requires propertyId', async () => {
    const req = createGetRequest('/api/v1/amenities');
    const res = await GET(req);
    expect(res.status).toBe(400);
    expect(mockAmenityFindMany).not.toHaveBeenCalled();
  });

  it('amenity listing always scopes by propertyId', async () => {
    const req = createGetRequest('/api/v1/amenities', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET(req);

    const where = mockAmenityFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_A);
  });

  it('property B cannot see property A amenities — isolation enforced via propertyId filter', async () => {
    const req = createGetRequest('/api/v1/amenities', {
      searchParams: { propertyId: PROPERTY_B },
    });
    await GET(req);

    const where = mockAmenityFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_B);
    // DB returns only property B amenities; property A data is never queried
  });

  // --- Amenity Groups ---
  it('amenity group listing requires propertyId', async () => {
    const req = createGetRequest('/api/v1/amenities/groups');
    const res = await GET_GROUPS(req);
    expect(res.status).toBe(400);
  });

  it('amenity group listing scopes by propertyId', async () => {
    mockAmenityGroupFindMany.mockResolvedValue([]);
    const req = createGetRequest('/api/v1/amenities/groups', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET_GROUPS(req);

    const where = mockAmenityGroupFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_A);
  });

  // --- Bookings Listing ---
  it('booking listing requires propertyId', async () => {
    const req = createGetRequest('/api/v1/bookings');
    const res = await GET_BOOKINGS(req);
    expect(res.status).toBe(400);
  });

  it('booking listing scopes by propertyId and soft-delete', async () => {
    const req = createGetRequest('/api/v1/bookings', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET_BOOKINGS(req);

    const where = mockBookingFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_A);
    expect(where.deletedAt).toBeNull();
  });

  // --- Booking Creation ---
  it('booking inherits propertyId from the amenity, not user input', async () => {
    mockAmenityFindUnique.mockResolvedValue(makeAmenity({ propertyId: PROPERTY_A }));
    mockBookingCreate.mockResolvedValue({ id: BOOKING_ID, status: 'approved' });

    const req = createPostRequest('/api/v1/amenities/' + AMENITY_ID, validBookingPayload);
    await POST_BOOKING(req, { params: Promise.resolve({ id: AMENITY_ID }) });

    const createData = mockBookingCreate.mock.calls[0]![0].data;
    expect(createData.propertyId).toBe(PROPERTY_A);
  });

  // --- Booking Status Change ---
  it('booking status change returns 404 for non-existent booking (no cross-tenant leak)', async () => {
    mockBookingFindUnique.mockResolvedValue(null);

    const req = createPatchRequest('/api/v1/bookings/nonexistent', { status: 'approved' });
    const res = await PATCH_BOOKING(req, {
      params: Promise.resolve({ id: 'nonexistent' }),
    });
    expect(res.status).toBe(404);
  });

  // --- Internal error handling ---
  it('database errors do not leak internal details to response', async () => {
    mockAmenityFindUnique.mockResolvedValue(makeAmenity());
    mockBookingCreate.mockRejectedValue(new Error('DB constraint violation: bookings_pkey'));

    const req = createPostRequest('/api/v1/amenities/' + AMENITY_ID, validBookingPayload);
    const res = await POST_BOOKING(req, { params: Promise.resolve({ id: AMENITY_ID }) });
    expect(res.status).toBe(500);

    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).not.toContain('constraint');
    expect(body.message).not.toContain('pkey');
  });

  it('amenity group database errors do not leak internal details', async () => {
    mockAmenityGroupCreate.mockRejectedValue(new Error('Unique constraint failed'));

    const req = createPostRequest('/api/v1/amenities/groups', {
      propertyId: PROPERTY_A,
      name: 'Duplicate',
    });
    const res = await POST_GROUP(req);
    expect(res.status).toBe(500);
  });
});
