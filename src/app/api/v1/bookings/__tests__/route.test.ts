/**
 * Bookings API Tests — per PRD 06 Amenity Booking
 *
 * Booking status transitions are critical business logic.
 * A resident can't cancel an already-completed booking.
 * An admin can't approve a cancelled booking.
 * Getting this wrong means double-bookings and angry residents.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createGetRequest, createPatchRequest, parseResponse } from '@/test/helpers/api';

const mockFindMany = vi.fn();
const mockCount = vi.fn();
const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    booking: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      count: (...args: unknown[]) => mockCount(...args),
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
  },
}));

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: vi.fn().mockResolvedValue({
    user: {
      userId: 'test-admin',
      propertyId: '00000000-0000-4000-b000-000000000001',
      role: 'property_admin',
      permissions: ['*'],
      mfaVerified: true,
    },
    error: null,
  }),
}));

import { GET } from '../route';
import { GET as GET_DETAIL, PATCH } from '../[id]/route';

beforeEach(() => {
  vi.clearAllMocks();
  mockFindMany.mockResolvedValue([]);
  mockCount.mockResolvedValue(0);
});

// ---------------------------------------------------------------------------
// GET /api/v1/bookings — List
// ---------------------------------------------------------------------------

describe('GET /api/v1/bookings — Tenant Isolation', () => {
  it('rejects without propertyId', async () => {
    const req = createGetRequest('/api/v1/bookings');
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it('scopes to propertyId + soft-delete', async () => {
    const req = createGetRequest('/api/v1/bookings', {
      searchParams: { propertyId: '00000000-0000-4000-b000-000000000001' },
    });
    await GET(req);
    const where = mockFindMany.mock.calls[0][0].where;
    expect(where.propertyId).toBe('00000000-0000-4000-b000-000000000001');
    expect(where.deletedAt).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/v1/bookings/:id — Status Transitions
// ---------------------------------------------------------------------------

describe('PATCH /api/v1/bookings/:id — Status Transitions', () => {
  const params = Promise.resolve({ id: 'booking-1' });

  it('allows pending → approved', async () => {
    mockFindUnique.mockResolvedValue({ id: 'booking-1', status: 'pending' });
    mockUpdate.mockResolvedValue({
      id: 'booking-1',
      status: 'approved',
      amenity: { name: 'Pool' },
    });

    const req = createPatchRequest('/api/v1/bookings/booking-1', { status: 'approved' });
    const res = await PATCH(req, { params });
    expect(res.status).toBe(200);
  });

  it('allows pending → rejected', async () => {
    mockFindUnique.mockResolvedValue({ id: 'booking-1', status: 'pending' });
    mockUpdate.mockResolvedValue({
      id: 'booking-1',
      status: 'rejected',
      amenity: { name: 'Pool' },
    });

    const req = createPatchRequest('/api/v1/bookings/booking-1', { status: 'rejected' });
    const res = await PATCH(req, { params });
    expect(res.status).toBe(200);
  });

  it('allows pending → cancelled', async () => {
    mockFindUnique.mockResolvedValue({ id: 'booking-1', status: 'pending' });
    mockUpdate.mockResolvedValue({
      id: 'booking-1',
      status: 'cancelled',
      amenity: { name: 'Pool' },
    });

    const req = createPatchRequest('/api/v1/bookings/booking-1', { status: 'cancelled' });
    const res = await PATCH(req, { params });
    expect(res.status).toBe(200);
  });

  it('allows approved → cancelled', async () => {
    mockFindUnique.mockResolvedValue({ id: 'booking-1', status: 'approved' });
    mockUpdate.mockResolvedValue({
      id: 'booking-1',
      status: 'cancelled',
      amenity: { name: 'Pool' },
    });

    const req = createPatchRequest('/api/v1/bookings/booking-1', { status: 'cancelled' });
    const res = await PATCH(req, { params });
    expect(res.status).toBe(200);
  });

  it('allows approved → completed', async () => {
    mockFindUnique.mockResolvedValue({ id: 'booking-1', status: 'approved' });
    mockUpdate.mockResolvedValue({
      id: 'booking-1',
      status: 'completed',
      amenity: { name: 'Pool' },
    });

    const req = createPatchRequest('/api/v1/bookings/booking-1', { status: 'completed' });
    const res = await PATCH(req, { params });
    expect(res.status).toBe(200);
  });

  it("REJECTS rejected → approved (can't un-reject)", async () => {
    mockFindUnique.mockResolvedValue({ id: 'booking-1', status: 'rejected' });

    const req = createPatchRequest('/api/v1/bookings/booking-1', { status: 'approved' });
    const res = await PATCH(req, { params });
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('INVALID_TRANSITION');
  });

  it("REJECTS cancelled → approved (can't un-cancel)", async () => {
    mockFindUnique.mockResolvedValue({ id: 'booking-1', status: 'cancelled' });

    const req = createPatchRequest('/api/v1/bookings/booking-1', { status: 'approved' });
    const res = await PATCH(req, { params });
    expect(res.status).toBe(400);
  });

  it("REJECTS completed → cancelled (can't cancel after completion)", async () => {
    mockFindUnique.mockResolvedValue({ id: 'booking-1', status: 'completed' });

    const req = createPatchRequest('/api/v1/bookings/booking-1', { status: 'cancelled' });
    const res = await PATCH(req, { params });
    expect(res.status).toBe(400);
  });

  it('sets approvedById when approving', async () => {
    mockFindUnique.mockResolvedValue({ id: 'booking-1', status: 'pending' });
    mockUpdate.mockResolvedValue({
      id: 'booking-1',
      status: 'approved',
      amenity: { name: 'Pool' },
    });

    const req = createPatchRequest('/api/v1/bookings/booking-1', { status: 'approved' });
    await PATCH(req, { params });

    const updateData = mockUpdate.mock.calls[0][0].data;
    expect(updateData.approvedById).toBe('test-admin');
  });

  it('sets cancelledAt when cancelling', async () => {
    mockFindUnique.mockResolvedValue({ id: 'booking-1', status: 'pending' });
    mockUpdate.mockResolvedValue({
      id: 'booking-1',
      status: 'cancelled',
      amenity: { name: 'Pool' },
    });

    const req = createPatchRequest('/api/v1/bookings/booking-1', { status: 'cancelled' });
    await PATCH(req, { params });

    const updateData = mockUpdate.mock.calls[0][0].data;
    expect(updateData.cancelledAt).toBeInstanceOf(Date);
  });

  it('returns 404 for non-existent booking', async () => {
    mockFindUnique.mockResolvedValue(null);

    const req = createPatchRequest('/api/v1/bookings/nonexistent', { status: 'approved' });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'nonexistent' }) });
    expect(res.status).toBe(404);
  });
});
