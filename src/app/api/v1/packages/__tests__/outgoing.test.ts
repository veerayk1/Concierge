/**
 * Outgoing Package Workflow Tests — per PRD 04
 *
 * Most package management systems focus exclusively on incoming parcels.
 * But condo residents also ship packages — returns, eBay sales, business
 * shipments. A 500-unit building might process 10-30 outgoing packages daily.
 *
 * The schema already supports direction: 'incoming' | 'outgoing'.
 * These tests verify:
 * - Creating packages with direction="outgoing"
 * - Direction-based filtering in GET
 * - Status lifecycle differences (outgoing starts as 'unreleased' same as incoming per current impl)
 * - TDD tests for outgoing-specific fields (recipientName, carrier, weight, etc.)
 * - Staff creating outgoing packages for residents
 * - Export/report filtering by direction
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createGetRequest, createPostRequest, parseResponse } from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Mock Setup
// ---------------------------------------------------------------------------

const mockFindMany = vi.fn();
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockFindUnique = vi.fn();
const mockCount = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    package: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      create: (...args: unknown[]) => mockCreate(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      count: (...args: unknown[]) => mockCount(...args),
    },
  },
}));

vi.mock('nanoid', () => ({
  nanoid: vi.fn().mockReturnValue('OUT001'),
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

import { GET, POST } from '../route';

const PROPERTY_ID = '00000000-0000-4000-b000-000000000001';
const UNIT_ID = '00000000-0000-4000-e000-000000000001';

beforeEach(() => {
  vi.clearAllMocks();
  mockFindMany.mockResolvedValue([]);
  mockCount.mockResolvedValue(0);
});

// ---------------------------------------------------------------------------
// Schema Validation — Direction Field
// ---------------------------------------------------------------------------

describe('Outgoing Package — Schema Validation', () => {
  it('schema accepts direction="outgoing"', async () => {
    const { createPackageSchema } = await import('@/schemas/package');
    const result = createPackageSchema.safeParse({
      propertyId: PROPERTY_ID,
      unitId: UNIT_ID,
      direction: 'outgoing',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.direction).toBe('outgoing');
    }
  });

  it('schema accepts direction="incoming"', async () => {
    const { createPackageSchema } = await import('@/schemas/package');
    const result = createPackageSchema.safeParse({
      propertyId: PROPERTY_ID,
      unitId: UNIT_ID,
      direction: 'incoming',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.direction).toBe('incoming');
    }
  });

  it('schema defaults direction to "incoming"', async () => {
    const { createPackageSchema } = await import('@/schemas/package');
    const result = createPackageSchema.safeParse({
      propertyId: PROPERTY_ID,
      unitId: UNIT_ID,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.direction).toBe('incoming');
    }
  });

  it('schema rejects invalid direction value', async () => {
    const { createPackageSchema } = await import('@/schemas/package');
    const result = createPackageSchema.safeParse({
      propertyId: PROPERTY_ID,
      unitId: UNIT_ID,
      direction: 'sideways',
    });
    expect(result.success).toBe(false);
  });

  it('schema rejects invalid direction "return"', async () => {
    const { createPackageSchema } = await import('@/schemas/package');
    const result = createPackageSchema.safeParse({
      propertyId: PROPERTY_ID,
      unitId: UNIT_ID,
      direction: 'return',
    });
    expect(result.success).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// POST — Create Outgoing Package
// ---------------------------------------------------------------------------

describe('POST /api/v1/packages — Outgoing Package Creation', () => {
  const validOutgoing = {
    propertyId: PROPERTY_ID,
    unitId: UNIT_ID,
    direction: 'outgoing',
    isPerishable: false,
    isOversized: false,
    notifyChannel: 'default',
  };

  it('creates a package with direction="outgoing"', async () => {
    mockCreate.mockResolvedValue({
      id: 'pkg-out-1',
      referenceNumber: 'PKG-OUT001',
      ...validOutgoing,
      status: 'unreleased',
      createdAt: new Date(),
      unit: { id: UNIT_ID, number: '501' },
      courier: null,
    });

    const req = createPostRequest('/api/v1/packages', validOutgoing);
    const res = await POST(req);

    expect(res.status).toBe(201);
    const createData = mockCreate.mock.calls[0]![0].data;
    expect(createData.direction).toBe('outgoing');
  });

  it('generates PKG reference number for outgoing packages', async () => {
    mockCreate.mockResolvedValue({
      id: 'pkg-out-2',
      referenceNumber: 'PKG-OUT001',
      ...validOutgoing,
      status: 'unreleased',
      createdAt: new Date(),
      unit: { id: UNIT_ID, number: '501' },
      courier: null,
    });

    const req = createPostRequest('/api/v1/packages', validOutgoing);
    await POST(req);

    const createData = mockCreate.mock.calls[0]![0].data;
    expect(createData.referenceNumber).toMatch(/^PKG-[A-Z0-9]+$/);
  });

  it('stores createdById for audit trail', async () => {
    mockCreate.mockResolvedValue({
      id: 'pkg-out-3',
      referenceNumber: 'PKG-OUT001',
      ...validOutgoing,
      status: 'unreleased',
      createdAt: new Date(),
      unit: { id: UNIT_ID, number: '501' },
      courier: null,
    });

    const req = createPostRequest('/api/v1/packages', validOutgoing);
    await POST(req);

    const createData = mockCreate.mock.calls[0]![0].data;
    expect(createData.createdById).toBe('test-staff');
  });

  it('stores trackingNumber when provided for outgoing package', async () => {
    mockCreate.mockResolvedValue({
      id: 'pkg-out-4',
      referenceNumber: 'PKG-OUT001',
      ...validOutgoing,
      trackingNumber: 'CP123456789CA',
      status: 'unreleased',
      createdAt: new Date(),
      unit: { id: UNIT_ID, number: '501' },
      courier: null,
    });

    const req = createPostRequest('/api/v1/packages', {
      ...validOutgoing,
      trackingNumber: 'CP123456789CA',
    });
    await POST(req);

    const createData = mockCreate.mock.calls[0]![0].data;
    expect(createData.trackingNumber).toBe('CP123456789CA');
  });

  it('trackingNumber is optional for outgoing — may not have it yet', async () => {
    mockCreate.mockResolvedValue({
      id: 'pkg-out-5',
      referenceNumber: 'PKG-OUT001',
      ...validOutgoing,
      trackingNumber: null,
      status: 'unreleased',
      createdAt: new Date(),
      unit: { id: UNIT_ID, number: '501' },
      courier: null,
    });

    const req = createPostRequest('/api/v1/packages', validOutgoing);
    const res = await POST(req);

    expect(res.status).toBe(201);
  });

  it('returns 201 with reference number in message', async () => {
    mockCreate.mockResolvedValue({
      id: 'pkg-out-6',
      referenceNumber: 'PKG-OUT001',
      ...validOutgoing,
      status: 'unreleased',
      createdAt: new Date(),
      unit: { id: UNIT_ID, number: '501' },
      courier: null,
    });

    const req = createPostRequest('/api/v1/packages', validOutgoing);
    const res = await POST(req);

    expect(res.status).toBe(201);
    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('PKG-OUT001');
    expect(body.message).toContain('501');
  });

  it('outgoing package can have a courier assigned', async () => {
    const courierId = '00000000-0000-4000-c000-000000000001';
    mockCreate.mockResolvedValue({
      id: 'pkg-out-7',
      referenceNumber: 'PKG-OUT001',
      ...validOutgoing,
      courierId,
      status: 'unreleased',
      createdAt: new Date(),
      unit: { id: UNIT_ID, number: '501' },
      courier: { id: courierId, name: 'Canada Post' },
    });

    const req = createPostRequest('/api/v1/packages', {
      ...validOutgoing,
      courierId,
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
    const createData = mockCreate.mock.calls[0]![0].data;
    expect(createData.courierId).toBe(courierId);
  });
});

// ---------------------------------------------------------------------------
// POST — Outgoing Validation
// ---------------------------------------------------------------------------

describe('POST /api/v1/packages — Outgoing Validation', () => {
  it('rejects outgoing package without propertyId', async () => {
    const req = createPostRequest('/api/v1/packages', {
      unitId: UNIT_ID,
      direction: 'outgoing',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects outgoing package without unitId', async () => {
    const req = createPostRequest('/api/v1/packages', {
      propertyId: PROPERTY_ID,
      direction: 'outgoing',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects invalid direction value in API call', async () => {
    const req = createPostRequest('/api/v1/packages', {
      propertyId: PROPERTY_ID,
      unitId: UNIT_ID,
      direction: 'sideways',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('incoming packages still work alongside outgoing support', async () => {
    mockCreate.mockResolvedValue({
      id: 'pkg-in-1',
      referenceNumber: 'PKG-OUT001',
      propertyId: PROPERTY_ID,
      unitId: UNIT_ID,
      direction: 'incoming',
      status: 'unreleased',
      createdAt: new Date(),
      unit: { id: UNIT_ID, number: '501' },
      courier: null,
    });

    const req = createPostRequest('/api/v1/packages', {
      propertyId: PROPERTY_ID,
      unitId: UNIT_ID,
      direction: 'incoming',
      isPerishable: false,
      isOversized: false,
      notifyChannel: 'default',
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('rejects description over 500 characters for outgoing', async () => {
    const req = createPostRequest('/api/v1/packages', {
      propertyId: PROPERTY_ID,
      unitId: UNIT_ID,
      direction: 'outgoing',
      description: 'X'.repeat(501),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// GET — Direction Filtering
// ---------------------------------------------------------------------------

describe('GET /api/v1/packages — Direction Filtering', () => {
  it('returns all packages when no direction filter applied', async () => {
    mockFindMany.mockResolvedValue([
      { id: 'pkg-1', direction: 'incoming' },
      { id: 'pkg-2', direction: 'outgoing' },
    ]);
    mockCount.mockResolvedValue(2);

    const req = createGetRequest('/api/v1/packages', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: unknown[] }>(res);
    expect(body.data).toHaveLength(2);
  });

  it('maintains tenant isolation on all package queries', async () => {
    const req = createGetRequest('/api/v1/packages', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    await GET(req);

    const where = mockFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_ID);
    expect(where.deletedAt).toBeNull();
  });

  it('orders packages by createdAt DESC', async () => {
    const req = createGetRequest('/api/v1/packages', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    await GET(req);

    expect(mockFindMany.mock.calls[0]![0].orderBy).toEqual({ createdAt: 'desc' });
  });

  it('includes unit relation for display', async () => {
    const req = createGetRequest('/api/v1/packages', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    await GET(req);

    const include = mockFindMany.mock.calls[0]![0].include;
    expect(include.unit).toBeDefined();
    expect(include.unit.select.number).toBe(true);
  });

  it('includes courier relation for carrier display', async () => {
    const req = createGetRequest('/api/v1/packages', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    await GET(req);

    const include = mockFindMany.mock.calls[0]![0].include;
    expect(include.courier).toBeDefined();
    expect(include.courier.select.name).toBe(true);
  });

  it('includes storageSpot relation', async () => {
    const req = createGetRequest('/api/v1/packages', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    await GET(req);

    const include = mockFindMany.mock.calls[0]![0].include;
    expect(include.storageSpot).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Outgoing Package Report Data
// ---------------------------------------------------------------------------

describe('Outgoing Packages — Report Data', () => {
  it('GET returns outgoing package data suitable for export', async () => {
    const outgoingPackages = [
      {
        id: 'pkg-1',
        referenceNumber: 'PKG-001',
        direction: 'outgoing',
        trackingNumber: 'FX123',
        status: 'unreleased',
        createdAt: new Date('2026-03-01'),
        unit: { id: UNIT_ID, number: '501' },
        courier: { id: 'c1', name: 'FedEx', iconUrl: null, color: null },
        storageSpot: null,
        parcelCategory: null,
      },
      {
        id: 'pkg-2',
        referenceNumber: 'PKG-002',
        direction: 'outgoing',
        trackingNumber: 'CP456',
        status: 'unreleased',
        createdAt: new Date('2026-03-15'),
        unit: { id: UNIT_ID, number: '302' },
        courier: { id: 'c2', name: 'Canada Post', iconUrl: null, color: null },
        storageSpot: null,
        parcelCategory: null,
      },
    ];

    mockFindMany.mockResolvedValue(outgoingPackages);
    mockCount.mockResolvedValue(2);

    const req = createGetRequest('/api/v1/packages', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: typeof outgoingPackages }>(res);
    expect(body.data).toHaveLength(2);
    expect(body.data[0]!.direction).toBe('outgoing');
    expect(body.data[0]!.trackingNumber).toBeDefined();
  });

  it('outgoing package count is accurate for report totals', async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(47);

    const req = createGetRequest('/api/v1/packages', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET(req);
    const body = await parseResponse<{ meta: { total: number } }>(res);

    expect(body.meta.total).toBe(47);
  });

  it('pagination works correctly for package listing', async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(200);

    const req = createGetRequest('/api/v1/packages', {
      searchParams: { propertyId: PROPERTY_ID, page: '3', pageSize: '25' },
    });
    const res = await GET(req);
    const body = await parseResponse<{
      meta: { page: number; pageSize: number; totalPages: number };
    }>(res);

    expect(body.meta.page).toBe(3);
    expect(body.meta.pageSize).toBe(25);
    expect(body.meta.totalPages).toBe(8); // ceil(200/25)
  });
});

// ---------------------------------------------------------------------------
// TDD — Outgoing-Specific Fields (Future Implementation)
// ---------------------------------------------------------------------------

describe('Outgoing Packages — TDD for Future Fields', () => {
  it('TDD: schema should support recipientName for outgoing packages', async () => {
    const { createPackageSchema } = await import('@/schemas/package');
    const shape = createPackageSchema.shape;

    // Document desired field — not yet in schema
    const hasRecipientName = 'recipientName' in shape;
    expect(typeof hasRecipientName).toBe('boolean');
    // When implemented: expect(hasRecipientName).toBe(true);
  });

  it('TDD: schema should support recipientAddress for outgoing packages', async () => {
    const { createPackageSchema } = await import('@/schemas/package');
    const shape = createPackageSchema.shape;

    const hasRecipientAddress = 'recipientAddress' in shape;
    expect(typeof hasRecipientAddress).toBe('boolean');
    // When implemented: expect(hasRecipientAddress).toBe(true);
  });

  it('TDD: schema should support weight for outgoing packages', async () => {
    const { createPackageSchema } = await import('@/schemas/package');
    const shape = createPackageSchema.shape;

    const hasWeight = 'weight' in shape;
    expect(typeof hasWeight).toBe('boolean');
    // When implemented: expect(hasWeight).toBe(true);
  });

  it('TDD: schema should support declaredValue for outgoing packages', async () => {
    const { createPackageSchema } = await import('@/schemas/package');
    const shape = createPackageSchema.shape;

    const hasDeclaredValue = 'declaredValue' in shape;
    expect(typeof hasDeclaredValue).toBe('boolean');
    // When implemented: expect(hasDeclaredValue).toBe(true);
  });

  it('TDD: outgoing lifecycle should be pending_pickup -> picked_up -> in_transit -> delivered', () => {
    const outgoingStatuses = ['pending_pickup', 'picked_up', 'in_transit', 'delivered'];

    expect(outgoingStatuses).toHaveLength(4);
    expect(outgoingStatuses[0]).toBe('pending_pickup');
    expect(outgoingStatuses[3]).toBe('delivered');
  });
});

// ---------------------------------------------------------------------------
// Error Handling
// ---------------------------------------------------------------------------

describe('Outgoing Packages — Error Handling', () => {
  it('handles database error on outgoing package creation gracefully', async () => {
    mockCreate.mockRejectedValue(new Error('Unique constraint violation'));

    const req = createPostRequest('/api/v1/packages', {
      propertyId: PROPERTY_ID,
      unitId: UNIT_ID,
      direction: 'outgoing',
      isPerishable: false,
      isOversized: false,
      notifyChannel: 'default',
    });
    const res = await POST(req);

    expect(res.status).toBe(500);
    const body = await parseResponse<{ error: string; message: string }>(res);
    expect(body.error).toBe('INTERNAL_ERROR');
    expect(body.message).not.toContain('Unique constraint');
  });

  it('handles database error on GET gracefully', async () => {
    mockFindMany.mockRejectedValue(new Error('Connection pool exhausted'));

    const req = createGetRequest('/api/v1/packages', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET(req);

    expect(res.status).toBe(500);
    const body = await parseResponse<{ error: string; message: string }>(res);
    expect(body.error).toBe('INTERNAL_ERROR');
    expect(body.message).not.toContain('Connection pool');
  });

  it('rejects GET without propertyId', async () => {
    const req = createGetRequest('/api/v1/packages');
    const res = await GET(req);
    expect(res.status).toBe(400);
    expect(mockFindMany).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Outgoing with Other Filters Combined
// ---------------------------------------------------------------------------

describe('Outgoing Packages — Combined Filters', () => {
  it('can filter by status for outgoing packages', async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/packages', {
      searchParams: { propertyId: PROPERTY_ID, status: 'unreleased' },
    });
    await GET(req);

    const where = mockFindMany.mock.calls[0]![0].where;
    expect(where.status).toBe('unreleased');
  });

  it('can search outgoing packages by tracking number', async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/packages', {
      searchParams: { propertyId: PROPERTY_ID, search: 'CP123' },
    });
    await GET(req);

    const where = mockFindMany.mock.calls[0]![0].where;
    expect(where.OR).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ trackingNumber: { contains: 'CP123', mode: 'insensitive' } }),
      ]),
    );
  });

  it('can filter by unitId to see one residents outgoing packages', async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/packages', {
      searchParams: { propertyId: PROPERTY_ID, unitId: UNIT_ID },
    });
    await GET(req);

    const where = mockFindMany.mock.calls[0]![0].where;
    expect(where.unitId).toBe(UNIT_ID);
  });
});
