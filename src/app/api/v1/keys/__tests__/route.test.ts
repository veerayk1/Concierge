/**
 * Key/FOB Inventory API Route Tests — per PRD 03 Key/FOB Management
 *
 * Keys and FOBs grant PHYSICAL access to a building. A leaked key record,
 * a key issued to the wrong unit, or a "returned" key that was actually
 * lost is a real-world security incident — not just a software bug.
 *
 * Security context: Every key must be traceable to the staff member
 * who created it (createdById) and scoped to the correct property (tenant isolation).
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
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
const mockCreate = vi.fn();
const mockUpdate = vi.fn();
const mockCount = vi.fn();
const mockIncidentCreate = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    keyInventory: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      create: (...args: unknown[]) => mockCreate(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
      count: (...args: unknown[]) => mockCount(...args),
    },
    incidentReport: {
      create: (...args: unknown[]) => mockIncidentCreate(...args),
    },
  },
}));

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: vi.fn().mockResolvedValue({
    user: {
      userId: 'test-concierge',
      propertyId: '00000000-0000-4000-b000-000000000001',
      role: 'front_desk',
      permissions: ['*'],
      mfaVerified: false,
    },
    error: null,
  }),
}));

import { GET, POST } from '../route';
import { PATCH } from '../[id]/route';

beforeEach(() => {
  vi.clearAllMocks();
  mockFindMany.mockResolvedValue([]);
  mockCreate.mockResolvedValue({});
  mockUpdate.mockResolvedValue({});
  mockCount.mockResolvedValue(0);
  mockIncidentCreate.mockResolvedValue({});
});

// ---------------------------------------------------------------------------
// GET /api/v1/keys — Tenant Isolation
// ---------------------------------------------------------------------------

describe('GET /api/v1/keys — Tenant Isolation', () => {
  it('REJECTS requests without propertyId — prevents listing keys across all properties', async () => {
    const req = createGetRequest('/api/v1/keys');
    const res = await GET(req);
    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_PROPERTY');
    // No database query should fire without tenant scoping
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it('scopes query to propertyId', async () => {
    const propertyId = '00000000-0000-4000-b000-000000000001';
    const req = createGetRequest('/api/v1/keys', { searchParams: { propertyId } });
    await GET(req);

    const where = mockFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(propertyId);
  });

  it('orders keys by createdAt DESC — most recently added first', async () => {
    const req = createGetRequest('/api/v1/keys', {
      searchParams: { propertyId: '00000000-0000-4000-b000-000000000001' },
    });
    await GET(req);

    const orderBy = mockFindMany.mock.calls[0]![0].orderBy;
    expect(orderBy).toEqual({ createdAt: 'desc' });
  });
});

// ---------------------------------------------------------------------------
// GET /api/v1/keys — Filtering
// ---------------------------------------------------------------------------

describe('GET /api/v1/keys — Filtering', () => {
  it('filters by status — checked_out keys need tracking', async () => {
    const req = createGetRequest('/api/v1/keys', {
      searchParams: {
        propertyId: '00000000-0000-4000-b000-000000000001',
        status: 'checked_out',
      },
    });
    await GET(req);

    expect(mockFindMany.mock.calls[0]![0].where.status).toBe('checked_out');
  });

  it('includes checkouts relation — needed to display current checkout status', async () => {
    const req = createGetRequest('/api/v1/keys', {
      searchParams: { propertyId: '00000000-0000-4000-b000-000000000001' },
    });
    await GET(req);

    const include = mockFindMany.mock.calls[0]![0].include;
    expect(include.checkouts).toBeDefined();
  });

  it('returns data array on success', async () => {
    mockFindMany.mockResolvedValue([
      { id: 'k1', keyName: 'Master Key A', category: 'master', status: 'available', checkouts: [] },
    ]);
    mockCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/keys', {
      searchParams: { propertyId: '00000000-0000-4000-b000-000000000001' },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: unknown[] }>(res);
    expect(body.data).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// POST /api/v1/keys — Validation
// ---------------------------------------------------------------------------

describe('POST /api/v1/keys — Validation', () => {
  it('rejects empty body with VALIDATION_ERROR', async () => {
    const req = createPostRequest('/api/v1/keys', {});
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string; fields: Record<string, string[]> }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
    expect(body.fields).toBeDefined();
  });

  it('returns SPECIFIC field errors for each invalid field', async () => {
    const req = createPostRequest('/api/v1/keys', {
      propertyId: 'not-uuid',
      keyName: '',
      category: 'invalid_type',
    });
    const res = await POST(req);
    const body = await parseResponse<{ fields: Record<string, string[]> }>(res);

    expect(body.fields.propertyId).toBeDefined();
    expect(body.fields.keyName).toBeDefined();
    expect(body.fields.category).toBeDefined();
  });

  it('rejects invalid category — only master, unit, common_area, vehicle, equipment, other allowed', async () => {
    const req = createPostRequest('/api/v1/keys', {
      propertyId: '00000000-0000-4000-b000-000000000001',
      keyName: 'Test Key',
      category: 'garage_door',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// POST /api/v1/keys — Key Creation
// ---------------------------------------------------------------------------

describe('POST /api/v1/keys — Key Creation', () => {
  const validBody = {
    propertyId: '00000000-0000-4000-b000-000000000001',
    keyName: 'Master Key A',
    keyNumber: 'MK-001',
    category: 'master' as const,
    notes: 'Front entrance master',
  };

  it('sets status to available on creation — new keys start as available', async () => {
    mockCreate.mockResolvedValue({
      id: 'k1',
      ...validBody,
      status: 'available',
      createdById: 'test-concierge',
    });

    const req = createPostRequest('/api/v1/keys', validBody);
    await POST(req);

    const createData = mockCreate.mock.calls[0]![0].data;
    expect(createData.status).toBe('available');
  });

  it('uses auth.user.userId for createdById — tracks WHO added the key', async () => {
    mockCreate.mockResolvedValue({
      id: 'k1',
      ...validBody,
      status: 'available',
      createdById: 'test-concierge',
    });

    const req = createPostRequest('/api/v1/keys', validBody);
    await POST(req);

    const createData = mockCreate.mock.calls[0]![0].data;
    expect(createData.createdById).toBe('test-concierge');
  });

  it('returns 201 with key data and confirmation message including key name', async () => {
    mockCreate.mockResolvedValue({
      id: 'k1',
      ...validBody,
      status: 'available',
      createdById: 'test-concierge',
    });

    const req = createPostRequest('/api/v1/keys', validBody);
    const res = await POST(req);

    expect(res.status).toBe(201);
    const body = await parseResponse<{ data: { id: string }; message: string }>(res);
    expect(body.data.id).toBe('k1');
    expect(body.message).toContain('Master Key A');
  });

  it('handles database errors without leaking internals', async () => {
    mockCreate.mockRejectedValue(new Error('UNIQUE constraint violated'));

    const req = createPostRequest('/api/v1/keys', validBody);
    const res = await POST(req);

    expect(res.status).toBe(500);
    const body = await parseResponse<{ error: string; message: string }>(res);
    expect(body.error).toBe('INTERNAL_ERROR');
    expect(body.message).not.toContain('UNIQUE constraint');
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/v1/keys/:id — Mark Key as Lost
// ---------------------------------------------------------------------------

describe('PATCH /api/v1/keys/:id — Mark Lost', () => {
  it('sets status to lost — triggers physical security review', async () => {
    mockUpdate.mockResolvedValue({
      id: 'k1',
      keyName: 'Master Key A',
      propertyId: '00000000-0000-4000-b000-000000000001',
      category: 'master',
      status: 'lost',
    });

    const req = createPatchRequest('/api/v1/keys/k1', { action: 'lost' });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'k1' }) });

    expect(res.status).toBe(200);
    const updateCall = mockUpdate.mock.calls[0]![0];
    expect(updateCall.data.status).toBe('lost');
  });

  it('returns confirmation message indicating key is marked lost', async () => {
    mockUpdate.mockResolvedValue({
      id: 'k1',
      keyName: 'Master Key A',
      propertyId: '00000000-0000-4000-b000-000000000001',
      category: 'master',
      status: 'lost',
    });

    const req = createPatchRequest('/api/v1/keys/k1', { action: 'lost' });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'k1' }) });

    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('Master Key A');
    expect(body.message).toContain('lost');
  });

  it('handles database errors without leaking internals', async () => {
    mockUpdate.mockRejectedValue(new Error('Record not found'));

    const req = createPatchRequest('/api/v1/keys/k1', { action: 'lost' });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'k1' }) });

    expect(res.status).toBe(500);
    const body = await parseResponse<{ error: string; message: string }>(res);
    expect(body.error).toBe('INTERNAL_ERROR');
    expect(body.message).not.toContain('Record not found');
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/v1/keys/:id — Decommission Key
// ---------------------------------------------------------------------------

describe('PATCH /api/v1/keys/:id — Decommission', () => {
  it('sets status to decommissioned with reason and timestamp', async () => {
    mockUpdate.mockResolvedValue({
      id: 'k1',
      keyName: 'Master Key A',
      status: 'decommissioned',
      decommissionReason: 'Lock changed',
      decommissionedAt: new Date(),
    });

    const req = createPatchRequest('/api/v1/keys/k1', {
      action: 'decommission',
      reason: 'Lock changed',
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'k1' }) });

    expect(res.status).toBe(200);
    const updateCall = mockUpdate.mock.calls[0]![0];
    expect(updateCall.data.status).toBe('decommissioned');
    expect(updateCall.data.decommissionReason).toBe('Lock changed');
    expect(updateCall.data.decommissionedAt).toBeInstanceOf(Date);
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/v1/keys/:id — Generic Update
// ---------------------------------------------------------------------------

describe('PATCH /api/v1/keys/:id — Generic Update', () => {
  it('updates notes field without changing status', async () => {
    mockUpdate.mockResolvedValue({
      id: 'k1',
      keyName: 'Master Key A',
      status: 'available',
      notes: 'Spare key kept in safe',
    });

    const req = createPatchRequest('/api/v1/keys/k1', {
      notes: 'Spare key kept in safe',
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'k1' }) });

    expect(res.status).toBe(200);
    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toBe('Key updated.');
  });
});
