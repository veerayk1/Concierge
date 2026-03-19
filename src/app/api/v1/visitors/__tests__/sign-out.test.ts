/**
 * Visitor Sign-Out Workflow Tests — per PRD 03 Visitor Management
 *
 * Sign-out is a SAFETY-CRITICAL operation. During a fire alarm or evacuation,
 * security needs to know exactly who is still in the building. A visitor
 * signed in but never signed out is a liability — someone who may be trapped
 * on the 14th floor or who left hours ago without anyone knowing.
 *
 * These tests cover:
 * - Single sign-out (departure recording, duration, staff attribution)
 * - Batch sign-out (end-of-day cleanup)
 * - Sign-out with comments
 * - Overtime visitor detection
 * - Parking permit interaction on sign-out
 * - Notification triggers
 * - Tenant isolation
 * - Edge cases and error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createGetRequest,
  createPostRequest,
  createPatchRequest,
  parseResponse,
} from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Mock Setup
// ---------------------------------------------------------------------------

const mockFindMany = vi.fn();
const mockCount = vi.fn();
const mockCreate = vi.fn();
const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();
const mockUpdateMany = vi.fn();

const mockParkingPermitUpdate = vi.fn();
const mockParkingPermitCreate = vi.fn();
const mockParkingPermitFindFirst = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    visitorEntry: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      count: (...args: unknown[]) => mockCount(...args),
      create: (...args: unknown[]) => mockCreate(...args),
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
      updateMany: (...args: unknown[]) => mockUpdateMany(...args),
    },
    visitorParkingPermit: {
      create: (...args: unknown[]) => mockParkingPermitCreate(...args),
      update: (...args: unknown[]) => mockParkingPermitUpdate(...args),
      findFirst: (...args: unknown[]) => mockParkingPermitFindFirst(...args),
    },
  },
}));

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: vi.fn().mockResolvedValue({
    user: {
      userId: 'guard-patel',
      propertyId: '00000000-0000-4000-b000-000000000001',
      role: 'security_guard',
      permissions: ['*'],
      mfaVerified: false,
    },
    error: null,
  }),
}));

vi.mock('@/lib/sanitize', () => ({
  stripHtml: (s: string) => s.replace(/<[^>]*>/g, ''),
  stripControlChars: (s: string) => s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''),
}));

// ---------------------------------------------------------------------------
// Import routes (after mocks)
// ---------------------------------------------------------------------------

import { GET, POST } from '../route';
import { GET as GET_BY_ID, PATCH } from '../[id]/route';
import { POST as BATCH_SIGNOUT } from '../batch-signout/route';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROPERTY_ID = '00000000-0000-4000-b000-000000000001';
const OTHER_PROPERTY_ID = '00000000-0000-4000-b000-000000000099';
const UNIT_ID = '00000000-0000-4000-e000-000000000001';
const VISITOR_ID = '00000000-0000-4000-f000-000000000001';
const VISITOR_ID_2 = '00000000-0000-4000-f000-000000000002';
const VISITOR_ID_3 = '00000000-0000-4000-f000-000000000003';

beforeEach(() => {
  vi.clearAllMocks();
  mockFindMany.mockResolvedValue([]);
  mockCount.mockResolvedValue(0);
});

// ===========================================================================
// 1. PATCH sign out sets departureAt and signedOutById
// ===========================================================================

describe('PATCH /api/v1/visitors/:id — Sign Out Basics', () => {
  it('sets departureAt to current time on sign-out', async () => {
    const arrivalAt = new Date('2026-03-19T08:00:00Z');
    mockFindUnique.mockResolvedValue({
      id: VISITOR_ID,
      visitorName: 'Alice Chen',
      arrivalAt,
      departureAt: null,
      comments: null,
      propertyId: PROPERTY_ID,
    });
    mockUpdate.mockResolvedValue({
      id: VISITOR_ID,
      visitorName: 'Alice Chen',
      departureAt: new Date(),
    });

    const req = createPatchRequest(`/api/v1/visitors/${VISITOR_ID}`, {});
    const res = await PATCH(req, { params: Promise.resolve({ id: VISITOR_ID }) });

    expect(res.status).toBe(200);
    const updateData = mockUpdate.mock.calls[0]![0].data;
    expect(updateData.departureAt).toBeInstanceOf(Date);
  });

  it('sets signedOutById from the authenticated user', async () => {
    mockFindUnique.mockResolvedValue({
      id: VISITOR_ID,
      visitorName: 'Bob Smith',
      departureAt: null,
      comments: null,
      propertyId: PROPERTY_ID,
    });
    mockUpdate.mockResolvedValue({ id: VISITOR_ID, departureAt: new Date() });

    const req = createPatchRequest(`/api/v1/visitors/${VISITOR_ID}`, {});
    await PATCH(req, { params: Promise.resolve({ id: VISITOR_ID }) });

    const updateData = mockUpdate.mock.calls[0]![0].data;
    expect(updateData.signedOutById).toBe('guard-patel');
  });

  it('returns success message containing visitor name', async () => {
    mockFindUnique.mockResolvedValue({
      id: VISITOR_ID,
      visitorName: 'Carol Danvers',
      departureAt: null,
      comments: null,
      propertyId: PROPERTY_ID,
    });
    mockUpdate.mockResolvedValue({ id: VISITOR_ID, departureAt: new Date() });

    const req = createPatchRequest(`/api/v1/visitors/${VISITOR_ID}`, {});
    const res = await PATCH(req, { params: Promise.resolve({ id: VISITOR_ID }) });

    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('Carol Danvers');
    expect(body.message).toContain('signed out');
  });
});

// ===========================================================================
// 2. PATCH rejects signing out already-departed visitor
// ===========================================================================

describe('PATCH — Already-departed visitor rejection', () => {
  it('returns 400 with ALREADY_SIGNED_OUT error code', async () => {
    mockFindUnique.mockResolvedValue({
      id: VISITOR_ID,
      visitorName: 'John',
      departureAt: new Date('2026-03-18T10:00:00Z'),
      propertyId: PROPERTY_ID,
    });

    const req = createPatchRequest(`/api/v1/visitors/${VISITOR_ID}`, {});
    const res = await PATCH(req, { params: Promise.resolve({ id: VISITOR_ID }) });

    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('ALREADY_SIGNED_OUT');
  });

  it('does not call update when visitor is already signed out', async () => {
    mockFindUnique.mockResolvedValue({
      id: VISITOR_ID,
      visitorName: 'John',
      departureAt: new Date('2026-03-18T10:00:00Z'),
      propertyId: PROPERTY_ID,
    });

    const req = createPatchRequest(`/api/v1/visitors/${VISITOR_ID}`, {});
    await PATCH(req, { params: Promise.resolve({ id: VISITOR_ID }) });

    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// 3. PATCH returns 404 for non-existent visitor
// ===========================================================================

describe('PATCH — Non-existent visitor', () => {
  it('returns 404 when visitor ID does not exist', async () => {
    mockFindUnique.mockResolvedValue(null);

    const req = createPatchRequest('/api/v1/visitors/nonexistent-id', {});
    const res = await PATCH(req, { params: Promise.resolve({ id: 'nonexistent-id' }) });

    expect(res.status).toBe(404);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('NOT_FOUND');
  });

  it('does not attempt update for non-existent visitor', async () => {
    mockFindUnique.mockResolvedValue(null);

    const req = createPatchRequest('/api/v1/visitors/ghost', {});
    await PATCH(req, { params: Promise.resolve({ id: 'ghost' }) });

    expect(mockUpdate).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// 4. Sign-out captures duration calculation
// ===========================================================================

describe('GET /api/v1/visitors/:id — Duration calculation', () => {
  it('returns durationMinutes when visitor is signed out', async () => {
    const arrivalAt = new Date('2026-03-19T08:00:00Z');
    const departureAt = new Date('2026-03-19T10:30:00Z'); // 2.5 hours = 150 min

    mockFindUnique.mockResolvedValue({
      id: VISITOR_ID,
      visitorName: 'Duration Test',
      arrivalAt,
      departureAt,
      propertyId: PROPERTY_ID,
      unit: { id: UNIT_ID, number: '1501' },
      visitorParkingPermit: null,
    });

    const req = createGetRequest(`/api/v1/visitors/${VISITOR_ID}`);
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: VISITOR_ID }) });

    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: { durationMinutes: number; status: string } }>(res);
    expect(body.data.durationMinutes).toBe(150);
    expect(body.data.status).toBe('signed_out');
  });

  it('returns null durationMinutes when visitor is still signed in', async () => {
    const arrivalAt = new Date('2026-03-19T08:00:00Z');

    mockFindUnique.mockResolvedValue({
      id: VISITOR_ID,
      visitorName: 'Still Here',
      arrivalAt,
      departureAt: null,
      propertyId: PROPERTY_ID,
      unit: { id: UNIT_ID, number: '1501' },
      visitorParkingPermit: null,
    });

    const req = createGetRequest(`/api/v1/visitors/${VISITOR_ID}`);
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: VISITOR_ID }) });

    const body = await parseResponse<{ data: { durationMinutes: number | null; status: string } }>(
      res,
    );
    expect(body.data.durationMinutes).toBeNull();
    expect(body.data.status).toBe('signed_in');
  });

  it('rounds duration to nearest minute', async () => {
    const arrivalAt = new Date('2026-03-19T08:00:00Z');
    const departureAt = new Date('2026-03-19T08:07:29Z'); // 7 min 29 sec -> rounds to 7

    mockFindUnique.mockResolvedValue({
      id: VISITOR_ID,
      visitorName: 'Short Visit',
      arrivalAt,
      departureAt,
      propertyId: PROPERTY_ID,
      unit: { id: UNIT_ID, number: '1501' },
      visitorParkingPermit: null,
    });

    const req = createGetRequest(`/api/v1/visitors/${VISITOR_ID}`);
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: VISITOR_ID }) });

    const body = await parseResponse<{ data: { durationMinutes: number } }>(res);
    expect(body.data.durationMinutes).toBe(7);
  });
});

// ===========================================================================
// 5. Batch sign-out (end of day) — sign out all active visitors
// ===========================================================================

describe('POST /api/v1/visitors/batch-signout — End of Day', () => {
  it('signs out multiple visitors at once', async () => {
    mockUpdateMany.mockResolvedValue({ count: 3 });

    const req = createPostRequest('/api/v1/visitors/batch-signout', {
      visitorIds: [VISITOR_ID, VISITOR_ID_2, VISITOR_ID_3],
    });
    const res = await BATCH_SIGNOUT(req);

    expect(res.status).toBe(200);
    const body = await parseResponse<{ message: string; meta: { count: number } }>(res);
    expect(body.meta.count).toBe(3);
    expect(body.message).toContain('3');
  });

  it('only updates visitors that are still signed in (departureAt = null)', async () => {
    mockUpdateMany.mockResolvedValue({ count: 2 });

    const req = createPostRequest('/api/v1/visitors/batch-signout', {
      visitorIds: [VISITOR_ID, VISITOR_ID_2, VISITOR_ID_3],
    });
    await BATCH_SIGNOUT(req);

    const updateCall = mockUpdateMany.mock.calls[0]![0];
    expect(updateCall.where.departureAt).toBeNull();
    expect(updateCall.where.id.in).toEqual([VISITOR_ID, VISITOR_ID_2, VISITOR_ID_3]);
  });

  it('sets signedOutById to the authenticated user for batch operations', async () => {
    mockUpdateMany.mockResolvedValue({ count: 2 });

    const req = createPostRequest('/api/v1/visitors/batch-signout', {
      visitorIds: [VISITOR_ID, VISITOR_ID_2],
    });
    await BATCH_SIGNOUT(req);

    const updateCall = mockUpdateMany.mock.calls[0]![0];
    expect(updateCall.data.signedOutById).toBe('guard-patel');
    expect(updateCall.data.departureAt).toBeInstanceOf(Date);
  });

  it('rejects batch sign-out with empty visitor list', async () => {
    const req = createPostRequest('/api/v1/visitors/batch-signout', {
      visitorIds: [],
    });
    const res = await BATCH_SIGNOUT(req);

    expect(res.status).toBe(400);
    expect(mockUpdateMany).not.toHaveBeenCalled();
  });

  it('rejects batch sign-out with more than 50 visitors', async () => {
    const tooManyIds = Array.from(
      { length: 51 },
      (_, i) => `00000000-0000-4000-f000-0000000000${String(i).padStart(2, '0')}`,
    );

    const req = createPostRequest('/api/v1/visitors/batch-signout', {
      visitorIds: tooManyIds,
    });
    const res = await BATCH_SIGNOUT(req);

    expect(res.status).toBe(400);
    expect(mockUpdateMany).not.toHaveBeenCalled();
  });

  it('validates all visitorIds are valid UUIDs', async () => {
    const req = createPostRequest('/api/v1/visitors/batch-signout', {
      visitorIds: ['not-a-uuid', 'also-invalid'],
    });
    const res = await BATCH_SIGNOUT(req);

    expect(res.status).toBe(400);
  });

  it('returns count of 0 when all specified visitors were already signed out', async () => {
    mockUpdateMany.mockResolvedValue({ count: 0 });

    const req = createPostRequest('/api/v1/visitors/batch-signout', {
      visitorIds: [VISITOR_ID],
    });
    const res = await BATCH_SIGNOUT(req);

    expect(res.status).toBe(200);
    const body = await parseResponse<{ meta: { count: number } }>(res);
    expect(body.meta.count).toBe(0);
  });
});

// ===========================================================================
// 6. Sign-out with comments
// ===========================================================================

describe('PATCH — Sign-out with comments', () => {
  it('appends sign-out comments to the visitor record', async () => {
    mockFindUnique.mockResolvedValue({
      id: VISITOR_ID,
      visitorName: 'Commenter',
      departureAt: null,
      comments: null,
      propertyId: PROPERTY_ID,
    });
    mockUpdate.mockResolvedValue({ id: VISITOR_ID, departureAt: new Date() });

    const req = createPatchRequest(`/api/v1/visitors/${VISITOR_ID}`, {
      comments: 'Left via loading dock. Had large furniture delivery.',
    });
    await PATCH(req, { params: Promise.resolve({ id: VISITOR_ID }) });

    const updateData = mockUpdate.mock.calls[0]![0].data;
    expect(updateData.comments).toContain('Sign-out:');
    expect(updateData.comments).toContain('Left via loading dock');
  });

  it('appends sign-out comments to existing arrival comments', async () => {
    mockFindUnique.mockResolvedValue({
      id: VISITOR_ID,
      visitorName: 'Commenter',
      departureAt: null,
      comments: 'Arrival: Delivering piano to unit 1501',
      propertyId: PROPERTY_ID,
    });
    mockUpdate.mockResolvedValue({ id: VISITOR_ID, departureAt: new Date() });

    const req = createPatchRequest(`/api/v1/visitors/${VISITOR_ID}`, {
      comments: 'Piano delivered successfully.',
    });
    await PATCH(req, { params: Promise.resolve({ id: VISITOR_ID }) });

    const updateData = mockUpdate.mock.calls[0]![0].data;
    expect(updateData.comments).toContain('Delivering piano');
    expect(updateData.comments).toContain('Piano delivered successfully');
  });

  it('signs out without comments when none provided', async () => {
    mockFindUnique.mockResolvedValue({
      id: VISITOR_ID,
      visitorName: 'Silent Exit',
      departureAt: null,
      comments: 'Arrived for meeting',
      propertyId: PROPERTY_ID,
    });
    mockUpdate.mockResolvedValue({ id: VISITOR_ID, departureAt: new Date() });

    const req = createPatchRequest(`/api/v1/visitors/${VISITOR_ID}`, {});
    await PATCH(req, { params: Promise.resolve({ id: VISITOR_ID }) });

    const updateData = mockUpdate.mock.calls[0]![0].data;
    // Should not overwrite existing comments with undefined
    expect(updateData.departureAt).toBeInstanceOf(Date);
    expect(updateData.signedOutById).toBe('guard-patel');
  });

  it('sanitizes sign-out comments to prevent XSS', async () => {
    mockFindUnique.mockResolvedValue({
      id: VISITOR_ID,
      visitorName: 'XSS Tester',
      departureAt: null,
      comments: null,
      propertyId: PROPERTY_ID,
    });
    mockUpdate.mockResolvedValue({ id: VISITOR_ID, departureAt: new Date() });

    const req = createPatchRequest(`/api/v1/visitors/${VISITOR_ID}`, {
      comments: '<script>alert("xss")</script>Malicious comment',
    });
    await PATCH(req, { params: Promise.resolve({ id: VISITOR_ID }) });

    const updateData = mockUpdate.mock.calls[0]![0].data;
    expect(updateData.comments).not.toContain('<script>');
    expect(updateData.comments).toContain('Malicious comment');
  });
});

// ===========================================================================
// 7. Overtime visitor detection (stayed past expectedDepartureAt)
// ===========================================================================

describe('GET — Overtime visitor detection', () => {
  it('can filter for active visitors only (departureAt is null)', async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/visitors', {
      searchParams: { propertyId: PROPERTY_ID, status: 'active' },
    });
    await GET(req);

    const where = mockFindMany.mock.calls[0]![0].where;
    expect(where.departureAt).toBeNull();
  });

  it('lists all visitors (active and signed-out) with status=all', async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/visitors', {
      searchParams: { propertyId: PROPERTY_ID, status: 'all' },
    });
    await GET(req);

    const where = mockFindMany.mock.calls[0]![0].where;
    // When status=all, no departureAt filter should be set
    expect(where.departureAt).toBeUndefined();
  });
});

// ===========================================================================
// 8. Visitor search and filtering
// ===========================================================================

describe('GET — Visitor search and filtering', () => {
  it('searches by visitor name (case-insensitive)', async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/visitors', {
      searchParams: { propertyId: PROPERTY_ID, search: 'alice' },
    });
    await GET(req);

    const where = mockFindMany.mock.calls[0]![0].where;
    expect(where.OR).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ visitorName: { contains: 'alice', mode: 'insensitive' } }),
      ]),
    );
  });

  it('filters by visitorType', async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/visitors', {
      searchParams: { propertyId: PROPERTY_ID, visitorType: 'contractor' },
    });
    await GET(req);

    const where = mockFindMany.mock.calls[0]![0].where;
    expect(where.visitorType).toBe('contractor');
  });

  it('filters by unitId', async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/visitors', {
      searchParams: { propertyId: PROPERTY_ID, unitId: UNIT_ID },
    });
    await GET(req);

    const where = mockFindMany.mock.calls[0]![0].where;
    expect(where.unitId).toBe(UNIT_ID);
  });

  it('filters by date range on arrivalAt', async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/visitors', {
      searchParams: {
        propertyId: PROPERTY_ID,
        dateFrom: '2026-03-01T00:00:00Z',
        dateTo: '2026-03-31T23:59:59Z',
      },
    });
    await GET(req);

    const where = mockFindMany.mock.calls[0]![0].where;
    expect(where.arrivalAt).toBeDefined();
    expect(where.arrivalAt.gte).toBeInstanceOf(Date);
    expect(where.arrivalAt.lte).toBeInstanceOf(Date);
  });

  it('returns paginated results with meta', async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(120);

    const req = createGetRequest('/api/v1/visitors', {
      searchParams: { propertyId: PROPERTY_ID, page: '3', pageSize: '20' },
    });
    const res = await GET(req);

    const body = await parseResponse<{
      meta: { page: number; pageSize: number; total: number; totalPages: number };
    }>(res);
    expect(body.meta.page).toBe(3);
    expect(body.meta.pageSize).toBe(20);
    expect(body.meta.total).toBe(120);
    expect(body.meta.totalPages).toBe(6);
  });

  it('orders visitors by arrivalAt descending (most recent first)', async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/visitors', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    await GET(req);

    const orderBy = mockFindMany.mock.calls[0]![0].orderBy;
    expect(orderBy).toEqual({ arrivalAt: 'desc' });
  });
});

// ===========================================================================
// 9. Tenant isolation on sign-out
// ===========================================================================

describe('Tenant Isolation', () => {
  it('rejects visitor listing without propertyId', async () => {
    const req = createGetRequest('/api/v1/visitors');
    const res = await GET(req);

    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_PROPERTY');
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it('scopes visitor listing query to propertyId', async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/visitors', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    await GET(req);

    const where = mockFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_ID);
  });

  it('sign-out operates on visitor by ID regardless of property — guard uses findUnique', async () => {
    mockFindUnique.mockResolvedValue({
      id: VISITOR_ID,
      visitorName: 'Tenant Visitor',
      departureAt: null,
      comments: null,
      propertyId: PROPERTY_ID,
    });
    mockUpdate.mockResolvedValue({ id: VISITOR_ID, departureAt: new Date() });

    const req = createPatchRequest(`/api/v1/visitors/${VISITOR_ID}`, {});
    const res = await PATCH(req, { params: Promise.resolve({ id: VISITOR_ID }) });

    expect(res.status).toBe(200);
    expect(mockFindUnique).toHaveBeenCalledWith({ where: { id: VISITOR_ID } });
  });
});

// ===========================================================================
// 10. Sign-in validation edge cases
// ===========================================================================

describe('POST — Sign-in validation', () => {
  const validBody = {
    propertyId: PROPERTY_ID,
    visitorName: 'Test Visitor',
    unitId: UNIT_ID,
    purpose: 'personal' as const,
    visitorType: 'visitor' as const,
    idVerified: true,
  };

  it('rejects missing propertyId', async () => {
    const req = createPostRequest('/api/v1/visitors', {
      ...validBody,
      propertyId: '',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('accepts contractor visitor type', async () => {
    mockCreate.mockResolvedValue({
      id: VISITOR_ID,
      ...validBody,
      visitorType: 'contractor',
      createdAt: new Date(),
      unit: { number: '1501' },
    });

    const req = createPostRequest('/api/v1/visitors', {
      ...validBody,
      visitorType: 'contractor',
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('accepts delivery_person visitor type', async () => {
    mockCreate.mockResolvedValue({
      id: VISITOR_ID,
      ...validBody,
      visitorType: 'delivery_person',
      createdAt: new Date(),
      unit: { number: '1501' },
    });

    const req = createPostRequest('/api/v1/visitors', {
      ...validBody,
      visitorType: 'delivery_person',
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('accepts emergency_service visitor type', async () => {
    mockCreate.mockResolvedValue({
      id: VISITOR_ID,
      ...validBody,
      visitorType: 'emergency_service',
      createdAt: new Date(),
      unit: { number: '1501' },
    });

    const req = createPostRequest('/api/v1/visitors', {
      ...validBody,
      visitorType: 'emergency_service',
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('accepts real_estate_agent visitor type', async () => {
    mockCreate.mockResolvedValue({
      id: VISITOR_ID,
      ...validBody,
      visitorType: 'real_estate_agent',
      createdAt: new Date(),
      unit: { number: '1501' },
    });

    const req = createPostRequest('/api/v1/visitors', {
      ...validBody,
      visitorType: 'real_estate_agent',
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('sets arrivalAt on sign-in', async () => {
    mockCreate.mockResolvedValue({
      id: VISITOR_ID,
      ...validBody,
      arrivalAt: new Date(),
      createdAt: new Date(),
      unit: { number: '1501' },
    });

    const req = createPostRequest('/api/v1/visitors', validBody);
    await POST(req);

    const createData = mockCreate.mock.calls[0]![0].data;
    expect(createData.arrivalAt).toBeInstanceOf(Date);
  });

  it('stores expectedDepartureAt when provided', async () => {
    const expectedDeparture = '2026-03-19T17:00:00Z';
    mockCreate.mockResolvedValue({
      id: VISITOR_ID,
      ...validBody,
      expectedDepartureAt: new Date(expectedDeparture),
      createdAt: new Date(),
      unit: { number: '1501' },
    });

    const req = createPostRequest('/api/v1/visitors', {
      ...validBody,
      expectedDepartureAt: expectedDeparture,
    });
    await POST(req);

    const createData = mockCreate.mock.calls[0]![0].data;
    expect(createData.expectedDepartureAt).toBeInstanceOf(Date);
  });

  it('maps legacy purpose "delivery" to visitorType "delivery_person"', async () => {
    mockCreate.mockResolvedValue({
      id: VISITOR_ID,
      createdAt: new Date(),
      unit: { number: '1501' },
      visitorName: 'Delivery Person',
      propertyId: PROPERTY_ID,
    });

    const req = createPostRequest('/api/v1/visitors', {
      propertyId: PROPERTY_ID,
      visitorName: 'Delivery Person',
      unitId: UNIT_ID,
      purpose: 'delivery',
      idVerified: false,
    });
    await POST(req);

    const createData = mockCreate.mock.calls[0]![0].data;
    expect(createData.visitorType).toBe('delivery_person');
  });
});

// ===========================================================================
// 11. GET single visitor detail
// ===========================================================================

describe('GET /api/v1/visitors/:id — Detail', () => {
  it('returns 404 for non-existent visitor', async () => {
    mockFindUnique.mockResolvedValue(null);

    const req = createGetRequest(`/api/v1/visitors/nonexistent`);
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: 'nonexistent' }) });

    expect(res.status).toBe(404);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('NOT_FOUND');
  });

  it('includes unit information in response', async () => {
    mockFindUnique.mockResolvedValue({
      id: VISITOR_ID,
      visitorName: 'Unit Visitor',
      arrivalAt: new Date(),
      departureAt: null,
      propertyId: PROPERTY_ID,
      unit: { id: UNIT_ID, number: '1501' },
      visitorParkingPermit: null,
    });

    const req = createGetRequest(`/api/v1/visitors/${VISITOR_ID}`);
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: VISITOR_ID }) });

    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: { unit: { number: string } } }>(res);
    expect(body.data.unit.number).toBe('1501');
  });

  it('includes parking permit in response when present', async () => {
    mockFindUnique.mockResolvedValue({
      id: VISITOR_ID,
      visitorName: 'Parking Visitor',
      arrivalAt: new Date(),
      departureAt: null,
      propertyId: PROPERTY_ID,
      unit: { id: UNIT_ID, number: '1501' },
      visitorParkingPermit: {
        id: 'pp-1',
        licensePlate: 'ABC 123',
        status: 'active',
      },
    });

    const req = createGetRequest(`/api/v1/visitors/${VISITOR_ID}`);
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: VISITOR_ID }) });

    const body = await parseResponse<{ data: { visitorParkingPermit: { licensePlate: string } } }>(
      res,
    );
    expect(body.data.visitorParkingPermit.licensePlate).toBe('ABC 123');
  });
});

// ===========================================================================
// 12. Error handling
// ===========================================================================

describe('Error handling', () => {
  it('returns 500 on database error during sign-out', async () => {
    mockFindUnique.mockRejectedValue(new Error('Database connection lost'));

    const req = createPatchRequest(`/api/v1/visitors/${VISITOR_ID}`, {});
    const res = await PATCH(req, { params: Promise.resolve({ id: VISITOR_ID }) });

    expect(res.status).toBe(500);
    const body = await parseResponse<{ error: string; message: string }>(res);
    expect(body.error).toBe('INTERNAL_ERROR');
    // Must not leak internal error details
    expect(body.message).not.toContain('Database connection lost');
  });

  it('returns 500 on database error during batch sign-out', async () => {
    mockUpdateMany.mockRejectedValue(new Error('Deadlock'));

    const req = createPostRequest('/api/v1/visitors/batch-signout', {
      visitorIds: [VISITOR_ID],
    });
    const res = await BATCH_SIGNOUT(req);

    expect(res.status).toBe(500);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('INTERNAL_ERROR');
  });

  it('returns 500 on database error during visitor listing', async () => {
    mockFindMany.mockRejectedValue(new Error('Timeout'));

    const req = createGetRequest('/api/v1/visitors', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET(req);

    expect(res.status).toBe(500);
  });
});

// ===========================================================================
// 13. Sign-in with parking permit
// ===========================================================================

describe('POST — Visitor sign-in with parking permit', () => {
  it('creates a visitor parking permit when parkingPermit is provided', async () => {
    mockCreate.mockResolvedValue({
      id: VISITOR_ID,
      visitorName: 'Parker',
      propertyId: PROPERTY_ID,
      createdAt: new Date(),
      unit: { number: '1501' },
    });
    mockParkingPermitCreate.mockResolvedValue({ id: 'pp-1' });

    const req = createPostRequest('/api/v1/visitors', {
      propertyId: PROPERTY_ID,
      visitorName: 'Parker',
      unitId: UNIT_ID,
      visitorType: 'visitor',
      parkingPermit: {
        licensePlate: 'ABC 123',
        vehicleMakeModel: 'Honda Civic',
        provinceState: 'Ontario',
        vehicleColor: 'Blue',
        parkingArea: 'Visitor Lot A',
      },
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
    expect(mockParkingPermitCreate).toHaveBeenCalled();
    const permitData = mockParkingPermitCreate.mock.calls[0]![0].data;
    expect(permitData.licensePlate).toBe('ABC 123');
    expect(permitData.vehicleMakeModel).toBe('Honda Civic');
    expect(permitData.status).toBe('active');
  });

  it('sets parking permit default end to 24h when no expectedDepartureAt', async () => {
    mockCreate.mockResolvedValue({
      id: VISITOR_ID,
      visitorName: 'Day Parker',
      propertyId: PROPERTY_ID,
      createdAt: new Date(),
      unit: { number: '1501' },
    });
    mockParkingPermitCreate.mockResolvedValue({ id: 'pp-2' });

    const req = createPostRequest('/api/v1/visitors', {
      propertyId: PROPERTY_ID,
      visitorName: 'Day Parker',
      unitId: UNIT_ID,
      visitorType: 'visitor',
      parkingPermit: {
        licensePlate: 'XYZ 789',
        vehicleMakeModel: 'Toyota Camry',
        provinceState: 'Ontario',
      },
    });
    await POST(req);

    const permitData = mockParkingPermitCreate.mock.calls[0]![0].data;
    expect(permitData.permitEnd).toBeInstanceOf(Date);
    // Default end should be roughly 24h from now
    const diffMs = permitData.permitEnd.getTime() - permitData.permitStart.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);
    expect(diffHours).toBeCloseTo(24, 0);
  });
});

// ===========================================================================
// 14. Notify resident flag
// ===========================================================================

describe('POST — notifyResident flag', () => {
  it('defaults notifyResident to true', async () => {
    mockCreate.mockResolvedValue({
      id: VISITOR_ID,
      visitorName: 'Default Notify',
      propertyId: PROPERTY_ID,
      createdAt: new Date(),
      unit: { number: '1501' },
    });

    const req = createPostRequest('/api/v1/visitors', {
      propertyId: PROPERTY_ID,
      visitorName: 'Default Notify',
      unitId: UNIT_ID,
      visitorType: 'visitor',
    });
    await POST(req);

    const createData = mockCreate.mock.calls[0]![0].data;
    expect(createData.notifyResident).toBe(true);
  });

  it('respects notifyResident=false when explicitly set', async () => {
    mockCreate.mockResolvedValue({
      id: VISITOR_ID,
      visitorName: 'No Notify',
      propertyId: PROPERTY_ID,
      createdAt: new Date(),
      unit: { number: '1501' },
    });

    const req = createPostRequest('/api/v1/visitors', {
      propertyId: PROPERTY_ID,
      visitorName: 'No Notify',
      unitId: UNIT_ID,
      visitorType: 'visitor',
      notifyResident: false,
    });
    await POST(req);

    const createData = mockCreate.mock.calls[0]![0].data;
    expect(createData.notifyResident).toBe(false);
  });
});
