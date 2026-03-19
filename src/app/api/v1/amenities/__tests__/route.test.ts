/**
 * Amenities API Route Tests — per PRD 06 Amenity Booking
 *
 * Covers:
 * - GET /api/v1/amenities (list)
 * - GET /api/v1/amenities/:id (detail)
 * - POST /api/v1/amenities/:id (create booking)
 * - GET /api/v1/amenities/groups (list groups)
 * - POST /api/v1/amenities/groups (create group)
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createGetRequest, createPostRequest, parseResponse } from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Mock Setup
// ---------------------------------------------------------------------------

const mockAmenityFindMany = vi.fn();
const mockAmenityFindUnique = vi.fn();
const mockBookingCreate = vi.fn();
const mockAmenityGroupFindMany = vi.fn();
const mockAmenityGroupCreate = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    amenity: {
      findMany: (...args: unknown[]) => mockAmenityFindMany(...args),
      findUnique: (...args: unknown[]) => mockAmenityFindUnique(...args),
    },
    booking: {
      create: (...args: unknown[]) => mockBookingCreate(...args),
    },
    amenityGroup: {
      findMany: (...args: unknown[]) => mockAmenityGroupFindMany(...args),
      create: (...args: unknown[]) => mockAmenityGroupCreate(...args),
    },
  },
}));

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: vi.fn().mockResolvedValue({
    user: {
      userId: 'test-staff',
      propertyId: '00000000-0000-4000-b000-000000000001',
      role: 'front_desk',
      permissions: ['*'],
      mfaVerified: false,
    },
    error: null,
  }),
}));

import { GET } from '../route';
import { GET as GET_DETAIL, POST as POST_BOOKING } from '../[id]/route';
import { GET as GET_GROUPS, POST as POST_GROUP } from '../groups/route';

const PROPERTY_A = '00000000-0000-4000-b000-000000000001';
const PROPERTY_B = '00000000-0000-4000-b000-000000000002';

beforeEach(() => {
  vi.clearAllMocks();
  mockAmenityFindMany.mockResolvedValue([]);
  mockAmenityGroupFindMany.mockResolvedValue([]);
});

// ---------------------------------------------------------------------------
// GET /api/v1/amenities — Tenant Isolation
// ---------------------------------------------------------------------------

describe('GET /api/v1/amenities — Tenant Isolation', () => {
  it('rejects without propertyId', async () => {
    const req = createGetRequest('/api/v1/amenities');
    const res = await GET(req);
    expect(res.status).toBe(400);
    expect(mockAmenityFindMany).not.toHaveBeenCalled();
  });

  it('always filters by propertyId and soft-delete', async () => {
    const req = createGetRequest('/api/v1/amenities', { searchParams: { propertyId: PROPERTY_A } });
    await GET(req);

    const where = mockAmenityFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_A);
    expect(where.deletedAt).toBeNull();
  });

  it('cannot access another property amenities — isolation enforced', async () => {
    const req = createGetRequest('/api/v1/amenities', { searchParams: { propertyId: PROPERTY_B } });
    await GET(req);

    const where = mockAmenityFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_B);
  });
});

// ---------------------------------------------------------------------------
// GET /api/v1/amenities — Filtering
// ---------------------------------------------------------------------------

describe('GET /api/v1/amenities — Filtering', () => {
  it('filters by groupId', async () => {
    const req = createGetRequest('/api/v1/amenities', {
      searchParams: { propertyId: PROPERTY_A, groupId: 'group-1' },
    });
    await GET(req);
    expect(mockAmenityFindMany.mock.calls[0]![0].where.groupId).toBe('group-1');
  });

  it('search covers name and description', async () => {
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

  it('returns empty array when no amenities exist', async () => {
    mockAmenityFindMany.mockResolvedValue([]);
    const req = createGetRequest('/api/v1/amenities', { searchParams: { propertyId: PROPERTY_A } });
    const res = await GET(req);
    const body = await parseResponse<{ data: unknown[] }>(res);
    expect(body.data).toEqual([]);
  });

  it('includes group relation for display', async () => {
    const req = createGetRequest('/api/v1/amenities', { searchParams: { propertyId: PROPERTY_A } });
    await GET(req);

    const include = mockAmenityFindMany.mock.calls[0]![0].include;
    expect(include.group).toBeDefined();
  });

  it('includes upcoming bookings for availability display', async () => {
    const req = createGetRequest('/api/v1/amenities', { searchParams: { propertyId: PROPERTY_A } });
    await GET(req);

    const include = mockAmenityFindMany.mock.calls[0]![0].include;
    expect(include.bookings).toBeDefined();
    expect(include.bookings.take).toBe(5);
  });

  it('orders amenities by name ascending', async () => {
    const req = createGetRequest('/api/v1/amenities', { searchParams: { propertyId: PROPERTY_A } });
    await GET(req);

    expect(mockAmenityFindMany.mock.calls[0]![0].orderBy).toEqual({ name: 'asc' });
  });
});

// ---------------------------------------------------------------------------
// GET /api/v1/amenities/:id — Detail
// ---------------------------------------------------------------------------

describe('GET /api/v1/amenities/:id — Detail', () => {
  it('returns 404 for non-existent amenity', async () => {
    mockAmenityFindUnique.mockResolvedValue(null);
    const req = createGetRequest('/api/v1/amenities/nonexistent');
    const res = await GET_DETAIL(req, { params: Promise.resolve({ id: 'nonexistent' }) });
    expect(res.status).toBe(404);
  });

  it('returns amenity with upcoming bookings', async () => {
    mockAmenityFindUnique.mockResolvedValue({
      id: 'amenity-1',
      name: 'Pool',
      bookings: [],
      group: { id: 'g1', name: 'Recreation' },
    });
    const req = createGetRequest('/api/v1/amenities/amenity-1');
    const res = await GET_DETAIL(req, { params: Promise.resolve({ id: 'amenity-1' }) });
    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: { name: string } }>(res);
    expect(body.data.name).toBe('Pool');
  });

  it('includes bookings with unit info for schedule display', async () => {
    mockAmenityFindUnique.mockResolvedValue({ id: 'a1', name: 'Gym', bookings: [], group: null });
    const req = createGetRequest('/api/v1/amenities/a1');
    await GET_DETAIL(req, { params: Promise.resolve({ id: 'a1' }) });

    const include = mockAmenityFindUnique.mock.calls[0]![0].include;
    expect(include.bookings).toBeDefined();
    expect(include.bookings.take).toBe(20);
  });
});

// ---------------------------------------------------------------------------
// POST /api/v1/amenities/:id — Booking Creation
// ---------------------------------------------------------------------------

describe('POST /api/v1/amenities/:id — Booking Creation', () => {
  const validBooking = {
    unitId: '00000000-0000-4000-e000-000000000001',
    startDate: '2026-04-01',
    startTime: '10:00',
    endDate: '2026-04-01',
    endTime: '12:00',
    guestCount: 5,
  };

  it('rejects missing required fields', async () => {
    const req = createPostRequest('/api/v1/amenities/amenity-1', {});
    const res = await POST_BOOKING(req, { params: Promise.resolve({ id: 'amenity-1' }) });
    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('rejects invalid unitId format', async () => {
    const req = createPostRequest('/api/v1/amenities/amenity-1', {
      ...validBooking,
      unitId: 'not-a-uuid',
    });
    const res = await POST_BOOKING(req, { params: Promise.resolve({ id: 'amenity-1' }) });
    expect(res.status).toBe(400);
  });

  it('returns 404 when amenity does not exist', async () => {
    mockAmenityFindUnique.mockResolvedValue(null);
    const req = createPostRequest('/api/v1/amenities/nonexistent', validBooking);
    const res = await POST_BOOKING(req, { params: Promise.resolve({ id: 'nonexistent' }) });
    expect(res.status).toBe(404);
  });

  it('creates booking with status=approved when amenity has auto approval', async () => {
    mockAmenityFindUnique.mockResolvedValue({
      id: 'amenity-1',
      propertyId: PROPERTY_A,
      approvalMode: 'auto',
    });
    mockBookingCreate.mockResolvedValue({
      id: 'booking-1',
      status: 'approved',
      ...validBooking,
    });

    const req = createPostRequest('/api/v1/amenities/amenity-1', validBooking);
    const res = await POST_BOOKING(req, { params: Promise.resolve({ id: 'amenity-1' }) });
    expect(res.status).toBe(201);

    const createData = mockBookingCreate.mock.calls[0]![0].data;
    expect(createData.status).toBe('approved');
  });

  it('creates booking with status=pending when amenity needs approval', async () => {
    mockAmenityFindUnique.mockResolvedValue({
      id: 'amenity-1',
      propertyId: PROPERTY_A,
      approvalMode: 'manual',
    });
    mockBookingCreate.mockResolvedValue({
      id: 'booking-1',
      status: 'pending',
      ...validBooking,
    });

    const req = createPostRequest('/api/v1/amenities/amenity-1', validBooking);
    const res = await POST_BOOKING(req, { params: Promise.resolve({ id: 'amenity-1' }) });
    expect(res.status).toBe(201);

    const createData = mockBookingCreate.mock.calls[0]![0].data;
    expect(createData.status).toBe('pending');
  });

  it('returns correct message for auto-approved booking', async () => {
    mockAmenityFindUnique.mockResolvedValue({
      id: 'a1',
      propertyId: PROPERTY_A,
      approvalMode: 'auto',
    });
    mockBookingCreate.mockResolvedValue({ id: 'b1', status: 'approved' });

    const req = createPostRequest('/api/v1/amenities/a1', validBooking);
    const res = await POST_BOOKING(req, { params: Promise.resolve({ id: 'a1' }) });
    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('confirmed');
  });

  it('returns correct message for pending booking', async () => {
    mockAmenityFindUnique.mockResolvedValue({
      id: 'a1',
      propertyId: PROPERTY_A,
      approvalMode: 'manual',
    });
    mockBookingCreate.mockResolvedValue({ id: 'b1', status: 'pending' });

    const req = createPostRequest('/api/v1/amenities/a1', validBooking);
    const res = await POST_BOOKING(req, { params: Promise.resolve({ id: 'a1' }) });
    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('approval');
  });

  it('generates AMN- reference number', async () => {
    mockAmenityFindUnique.mockResolvedValue({
      id: 'a1',
      propertyId: PROPERTY_A,
      approvalMode: 'auto',
    });
    mockBookingCreate.mockResolvedValue({ id: 'b1', status: 'approved' });

    const req = createPostRequest('/api/v1/amenities/a1', validBooking);
    await POST_BOOKING(req, { params: Promise.resolve({ id: 'a1' }) });

    const createData = mockBookingCreate.mock.calls[0]![0].data;
    expect(createData.referenceNumber).toMatch(/^AMN-/);
  });

  it('rejects guestCount over 50', async () => {
    const req = createPostRequest('/api/v1/amenities/a1', { ...validBooking, guestCount: 51 });
    const res = await POST_BOOKING(req, { params: Promise.resolve({ id: 'a1' }) });
    expect(res.status).toBe(400);
  });

  it('handles database errors without leaking internals', async () => {
    mockAmenityFindUnique.mockResolvedValue({
      id: 'a1',
      propertyId: PROPERTY_A,
      approvalMode: 'auto',
    });
    mockBookingCreate.mockRejectedValue(new Error('DB constraint violation'));

    const req = createPostRequest('/api/v1/amenities/a1', validBooking);
    const res = await POST_BOOKING(req, { params: Promise.resolve({ id: 'a1' }) });
    expect(res.status).toBe(500);
    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).not.toContain('constraint');
  });
});

// ---------------------------------------------------------------------------
// GET /api/v1/amenities/groups — Amenity Groups
// ---------------------------------------------------------------------------

describe('GET /api/v1/amenities/groups — Listing', () => {
  it('rejects without propertyId', async () => {
    const req = createGetRequest('/api/v1/amenities/groups');
    const res = await GET_GROUPS(req);
    expect(res.status).toBe(400);
  });

  it('filters by propertyId and active status', async () => {
    mockAmenityGroupFindMany.mockResolvedValue([]);
    const req = createGetRequest('/api/v1/amenities/groups', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET_GROUPS(req);

    const where = mockAmenityGroupFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_A);
    expect(where.isActive).toBe(true);
  });

  it('returns empty array when no groups exist', async () => {
    mockAmenityGroupFindMany.mockResolvedValue([]);
    const req = createGetRequest('/api/v1/amenities/groups', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await GET_GROUPS(req);
    const body = await parseResponse<{ data: unknown[] }>(res);
    expect(body.data).toEqual([]);
  });

  it('orders groups by displayOrder ascending', async () => {
    mockAmenityGroupFindMany.mockResolvedValue([]);
    const req = createGetRequest('/api/v1/amenities/groups', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET_GROUPS(req);

    expect(mockAmenityGroupFindMany.mock.calls[0]![0].orderBy).toEqual({ displayOrder: 'asc' });
  });
});

// ---------------------------------------------------------------------------
// POST /api/v1/amenities/groups — Create Group
// ---------------------------------------------------------------------------

describe('POST /api/v1/amenities/groups — Validation', () => {
  it('rejects missing name', async () => {
    const req = createPostRequest('/api/v1/amenities/groups', { propertyId: PROPERTY_A });
    const res = await POST_GROUP(req);
    expect(res.status).toBe(400);
  });

  it('rejects missing propertyId', async () => {
    const req = createPostRequest('/api/v1/amenities/groups', { name: 'Recreation' });
    const res = await POST_GROUP(req);
    expect(res.status).toBe(400);
  });

  it('rejects invalid propertyId format', async () => {
    const req = createPostRequest('/api/v1/amenities/groups', {
      propertyId: 'not-uuid',
      name: 'Recreation',
    });
    const res = await POST_GROUP(req);
    expect(res.status).toBe(400);
  });

  it('creates group successfully and returns 201', async () => {
    mockAmenityGroupCreate.mockResolvedValue({
      id: 'group-1',
      propertyId: PROPERTY_A,
      name: 'Recreation',
      displayOrder: 0,
    });

    const req = createPostRequest('/api/v1/amenities/groups', {
      propertyId: PROPERTY_A,
      name: 'Recreation',
    });
    const res = await POST_GROUP(req);
    expect(res.status).toBe(201);
    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('created');
  });

  it('handles database errors gracefully', async () => {
    mockAmenityGroupCreate.mockRejectedValue(new Error('Unique constraint'));
    const req = createPostRequest('/api/v1/amenities/groups', {
      propertyId: PROPERTY_A,
      name: 'Duplicate',
    });
    const res = await POST_GROUP(req);
    expect(res.status).toBe(500);
  });
});
