/**
 * Packages API Route Tests — per PRD 04
 *
 * Package management is the HIGHEST-VOLUME module. A 500-unit building
 * processes 50-200 packages/day, peaks at 400+ during holidays.
 * Getting this wrong means lost packages, angry residents, and liability.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createGetRequest, createPostRequest, parseResponse } from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Mock Setup
// ---------------------------------------------------------------------------

const mockFindMany = vi.fn();
const mockCount = vi.fn();
const mockCreate = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    package: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      count: (...args: unknown[]) => mockCount(...args),
      create: (...args: unknown[]) => mockCreate(...args),
    },
  },
}));

vi.mock('nanoid', () => ({
  nanoid: vi.fn().mockReturnValue('QPC004'),
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

beforeEach(() => {
  vi.clearAllMocks();
  mockFindMany.mockResolvedValue([]);
  mockCount.mockResolvedValue(0);
});

// ---------------------------------------------------------------------------
// GET /api/v1/packages — Tenant Isolation
// ---------------------------------------------------------------------------

describe('GET /api/v1/packages — Tenant Isolation', () => {
  it('REJECTS without propertyId — a resident at Property A must never see Property B packages', async () => {
    const req = createGetRequest('/api/v1/packages');
    const res = await GET(req);
    expect(res.status).toBe(400);
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it('always filters by propertyId + soft-delete — no leaked or deleted packages', async () => {
    const propertyId = '00000000-0000-4000-b000-000000000001';
    const req = createGetRequest('/api/v1/packages', { searchParams: { propertyId } });
    await GET(req);

    const where = mockFindMany.mock.calls[0][0].where;
    expect(where.propertyId).toBe(propertyId);
    expect(where.deletedAt).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// GET /api/v1/packages — Filtering (Front Desk Daily Operations)
// ---------------------------------------------------------------------------

describe('GET /api/v1/packages — Filtering', () => {
  const propertyId = '00000000-0000-4000-b000-000000000001';

  it('filters by status=unreleased — the primary view for front desk staff', async () => {
    const req = createGetRequest('/api/v1/packages', {
      searchParams: { propertyId, status: 'unreleased' },
    });
    await GET(req);
    expect(mockFindMany.mock.calls[0][0].where.status).toBe('unreleased');
  });

  it('filters by courierId — "show me all Amazon packages"', async () => {
    const courierId = 'courier-amazon';
    const req = createGetRequest('/api/v1/packages', {
      searchParams: { propertyId, courierId },
    });
    await GET(req);
    expect(mockFindMany.mock.calls[0][0].where.courierId).toBe(courierId);
  });

  it('filters by unitId — resident portal shows only their packages', async () => {
    const unitId = '00000000-0000-4000-e000-000000000001';
    const req = createGetRequest('/api/v1/packages', {
      searchParams: { propertyId, unitId },
    });
    await GET(req);
    expect(mockFindMany.mock.calls[0][0].where.unitId).toBe(unitId);
  });

  it('filters perishable=true — perishable packages need urgent attention', async () => {
    const req = createGetRequest('/api/v1/packages', {
      searchParams: { propertyId, perishable: 'true' },
    });
    await GET(req);
    expect(mockFindMany.mock.calls[0][0].where.isPerishable).toBe(true);
  });

  it('search covers referenceNumber, trackingNumber, AND description', async () => {
    const req = createGetRequest('/api/v1/packages', {
      searchParams: { propertyId, search: 'PKG-4821' },
    });
    await GET(req);

    const where = mockFindMany.mock.calls[0][0].where;
    expect(where.OR).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ referenceNumber: { contains: 'PKG-4821', mode: 'insensitive' } }),
        expect.objectContaining({ trackingNumber: { contains: 'PKG-4821', mode: 'insensitive' } }),
        expect.objectContaining({ description: { contains: 'PKG-4821', mode: 'insensitive' } }),
      ]),
    );
  });

  it('includes courier relation — needed for courier name, icon, color on cards', async () => {
    const req = createGetRequest('/api/v1/packages', { searchParams: { propertyId } });
    await GET(req);

    const include = mockFindMany.mock.calls[0][0].include;
    expect(include.courier).toBeDefined();
    expect(include.courier.select.name).toBe(true);
    expect(include.courier.select.icon).toBe(true);
    expect(include.courier.select.color).toBe(true);
  });

  it('includes unit relation — needed for unit number display', async () => {
    const req = createGetRequest('/api/v1/packages', { searchParams: { propertyId } });
    await GET(req);

    const include = mockFindMany.mock.calls[0][0].include;
    expect(include.unit).toBeDefined();
    expect(include.unit.select.number).toBe(true);
  });

  it('includes storageSpot relation — needed for "where is this package?"', async () => {
    const req = createGetRequest('/api/v1/packages', { searchParams: { propertyId } });
    await GET(req);

    const include = mockFindMany.mock.calls[0][0].include;
    expect(include.storageSpot).toBeDefined();
  });

  it('orders by createdAt DESC — newest packages first', async () => {
    const req = createGetRequest('/api/v1/packages', { searchParams: { propertyId } });
    await GET(req);

    expect(mockFindMany.mock.calls[0][0].orderBy).toEqual({ createdAt: 'desc' });
  });
});

// ---------------------------------------------------------------------------
// GET /api/v1/packages — Pagination
// ---------------------------------------------------------------------------

describe('GET /api/v1/packages — Pagination', () => {
  it('defaults to 50 per page — busy front desk needs to see many packages', async () => {
    mockCount.mockResolvedValue(200);
    const req = createGetRequest('/api/v1/packages', {
      searchParams: { propertyId: '00000000-0000-4000-b000-000000000001' },
    });
    const res = await GET(req);
    const body = await parseResponse<{ meta: { pageSize: number } }>(res);
    expect(body.meta.pageSize).toBe(50);
  });
});

// ---------------------------------------------------------------------------
// POST /api/v1/packages — Package Intake (PRD 04 Section 3.1.1)
// ---------------------------------------------------------------------------

describe('POST /api/v1/packages — Validation', () => {
  it('rejects missing required fields with specific errors', async () => {
    const req = createPostRequest('/api/v1/packages', {});
    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string; fields: Record<string, string[]> }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
    expect(body.fields.propertyId).toBeDefined();
    expect(body.fields.unitId).toBeDefined();
  });

  it('rejects unitId that is not a valid UUID — prevents injection', async () => {
    const req = createPostRequest('/api/v1/packages', {
      propertyId: '00000000-0000-4000-b000-000000000001',
      unitId: 'DROP TABLE packages;--',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects description over 500 characters', async () => {
    const req = createPostRequest('/api/v1/packages', {
      propertyId: '00000000-0000-4000-b000-000000000001',
      unitId: '00000000-0000-4000-e000-000000000001',
      description: 'X'.repeat(501),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/packages — Package Creation', () => {
  const validBody = {
    propertyId: '00000000-0000-4000-b000-000000000001',
    unitId: '00000000-0000-4000-e000-000000000001',
    direction: 'incoming',
    isPerishable: false,
    isOversized: false,
    notifyChannel: 'default',
  };

  it('generates PKG-XXXXXX reference number — per PRD 04', async () => {
    mockCreate.mockResolvedValue({
      id: 'pkg-1',
      referenceNumber: 'PKG-QPC004',
      ...validBody,
      status: 'unreleased',
      createdAt: new Date(),
      unit: { id: validBody.unitId, number: '1501' },
      courier: null,
    });

    const req = createPostRequest('/api/v1/packages', validBody);
    await POST(req);

    const createData = mockCreate.mock.calls[0][0].data;
    expect(createData.referenceNumber).toMatch(/^PKG-[A-Z0-9]+$/);
  });

  it('sets initial status to unreleased — package arrives, is NOT released yet', async () => {
    mockCreate.mockResolvedValue({
      id: 'pkg-1',
      ...validBody,
      referenceNumber: 'PKG-QPC004',
      status: 'unreleased',
      createdAt: new Date(),
      unit: { id: validBody.unitId, number: '1501' },
      courier: null,
    });

    const req = createPostRequest('/api/v1/packages', validBody);
    await POST(req);

    const createData = mockCreate.mock.calls[0][0].data;
    expect(createData.status).toBe('unreleased');
  });

  it('accepts all 7 notification channels per PRD 04', async () => {
    const channels = ['default', 'email', 'sms', 'push', 'voice', 'all', 'none'];

    for (const channel of channels) {
      mockCreate.mockResolvedValue({
        id: `pkg-${channel}`,
        ...validBody,
        notifyChannel: channel,
        referenceNumber: 'PKG-QPC004',
        status: 'unreleased',
        createdAt: new Date(),
        unit: { id: validBody.unitId, number: '1501' },
        courier: null,
      });

      const req = createPostRequest('/api/v1/packages', { ...validBody, notifyChannel: channel });
      const res = await POST(req);
      expect(res.status).toBe(201);
    }
  });

  it('stores perishable flag — triggers escalation workflow', async () => {
    mockCreate.mockResolvedValue({
      id: 'pkg-1',
      ...validBody,
      isPerishable: true,
      referenceNumber: 'PKG-QPC004',
      status: 'unreleased',
      createdAt: new Date(),
      unit: null,
      courier: null,
    });

    const req = createPostRequest('/api/v1/packages', { ...validBody, isPerishable: true });
    await POST(req);

    const createData = mockCreate.mock.calls[0][0].data;
    expect(createData.isPerishable).toBe(true);
  });

  it('stores oversized flag — affects storage location suggestions', async () => {
    mockCreate.mockResolvedValue({
      id: 'pkg-1',
      ...validBody,
      isOversized: true,
      referenceNumber: 'PKG-QPC004',
      status: 'unreleased',
      createdAt: new Date(),
      unit: null,
      courier: null,
    });

    const req = createPostRequest('/api/v1/packages', { ...validBody, isOversized: true });
    await POST(req);

    const createData = mockCreate.mock.calls[0][0].data;
    expect(createData.isOversized).toBe(true);
  });

  it('returns 201 with package data and unit number in message', async () => {
    mockCreate.mockResolvedValue({
      id: 'pkg-1',
      ...validBody,
      referenceNumber: 'PKG-QPC004',
      status: 'unreleased',
      createdAt: new Date(),
      unit: { id: validBody.unitId, number: '1501' },
      courier: null,
    });

    const req = createPostRequest('/api/v1/packages', validBody);
    const res = await POST(req);

    expect(res.status).toBe(201);
    const body = await parseResponse<{ data: Record<string, unknown>; message: string }>(res);
    expect(body.message).toContain('PKG-QPC004');
    expect(body.message).toContain('1501');
  });

  it('handles database errors without leaking internals', async () => {
    mockCreate.mockRejectedValue(new Error('Foreign key constraint: unitId not found'));

    const req = createPostRequest('/api/v1/packages', validBody);
    const res = await POST(req);

    expect(res.status).toBe(500);
    const body = await parseResponse<{ error: string; message: string }>(res);
    expect(body.error).toBe('INTERNAL_ERROR');
    expect(body.message).not.toContain('Foreign key');
  });
});
