/**
 * Maintenance API Route Tests — per PRD 05
 *
 * Maintenance requests directly impact resident satisfaction and building
 * safety. A leaking pipe ignored for 48h becomes water damage and a lawsuit.
 * SLA tracking and priority escalation must work correctly.
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
    maintenanceRequest: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      count: (...args: unknown[]) => mockCount(...args),
      create: (...args: unknown[]) => mockCreate(...args),
    },
  },
}));

vi.mock('nanoid', () => ({
  nanoid: vi.fn().mockReturnValue('0841'),
}));

import { GET, POST } from '../route';

beforeEach(() => {
  vi.clearAllMocks();
  mockFindMany.mockResolvedValue([]);
  mockCount.mockResolvedValue(0);
});

const PROPERTY_ID = '00000000-0000-4000-b000-000000000001';

// ---------------------------------------------------------------------------
// GET /api/v1/maintenance — Tenant Isolation
// ---------------------------------------------------------------------------

describe('GET /api/v1/maintenance — Tenant Isolation', () => {
  it('REJECTS without propertyId', async () => {
    const req = createGetRequest('/api/v1/maintenance');
    const res = await GET(req);
    expect(res.status).toBe(400);
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it('scopes to propertyId + soft-delete filter', async () => {
    const req = createGetRequest('/api/v1/maintenance', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    await GET(req);

    const where = mockFindMany.mock.calls[0][0].where;
    expect(where.propertyId).toBe(PROPERTY_ID);
    expect(where.deletedAt).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// GET /api/v1/maintenance — Filtering
// ---------------------------------------------------------------------------

describe('GET /api/v1/maintenance — Filtering', () => {
  it('filters by status — property manager needs to see open vs assigned vs in_progress', async () => {
    const req = createGetRequest('/api/v1/maintenance', {
      searchParams: { propertyId: PROPERTY_ID, status: 'open' },
    });
    await GET(req);
    expect(mockFindMany.mock.calls[0][0].where.status).toBe('open');
  });

  it('filters by priority — urgent plumbing leak must surface above low-priority cosmetic issues', async () => {
    const req = createGetRequest('/api/v1/maintenance', {
      searchParams: { propertyId: PROPERTY_ID, priority: 'urgent' },
    });
    await GET(req);
    expect(mockFindMany.mock.calls[0][0].where.priority).toBe('urgent');
  });

  it('search covers referenceNumber AND description — staff searches by either', async () => {
    const req = createGetRequest('/api/v1/maintenance', {
      searchParams: { propertyId: PROPERTY_ID, search: 'leaking' },
    });
    await GET(req);

    const where = mockFindMany.mock.calls[0][0].where;
    expect(where.OR).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ referenceNumber: { contains: 'leaking', mode: 'insensitive' } }),
        expect.objectContaining({ description: { contains: 'leaking', mode: 'insensitive' } }),
      ]),
    );
  });

  it('includes unit + category relations for display', async () => {
    const req = createGetRequest('/api/v1/maintenance', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    await GET(req);

    const include = mockFindMany.mock.calls[0][0].include;
    expect(include.unit).toBeDefined();
    expect(include.category).toBeDefined();
  });

  it('orders by createdAt DESC — newest requests first', async () => {
    const req = createGetRequest('/api/v1/maintenance', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    await GET(req);
    expect(mockFindMany.mock.calls[0][0].orderBy).toEqual({ createdAt: 'desc' });
  });
});

// ---------------------------------------------------------------------------
// POST /api/v1/maintenance — Request Submission
// ---------------------------------------------------------------------------

describe('POST /api/v1/maintenance — Validation', () => {
  it('rejects missing required fields', async () => {
    const req = createPostRequest('/api/v1/maintenance', {});
    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string; fields: Record<string, string[]> }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('requires description of at least 10 characters — prevents useless "broken" tickets', async () => {
    const req = createPostRequest('/api/v1/maintenance', {
      propertyId: PROPERTY_ID,
      unitId: '00000000-0000-4000-e000-000000000001',
      description: 'broken',
      priority: 'medium',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('accepts description of exactly 10 characters', async () => {
    mockCreate.mockResolvedValue({
      id: 'mr-1',
      referenceNumber: 'MR-0841',
      status: 'open',
      description: '1234567890',
      createdAt: new Date(),
      unit: { id: 'u1', number: '101' },
    });

    const req = createPostRequest('/api/v1/maintenance', {
      propertyId: PROPERTY_ID,
      unitId: '00000000-0000-4000-e000-000000000001',
      description: '1234567890',
      priority: 'medium',
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('rejects description over 4000 characters — per PRD 05 field spec', async () => {
    const req = createPostRequest('/api/v1/maintenance', {
      propertyId: PROPERTY_ID,
      unitId: '00000000-0000-4000-e000-000000000001',
      description: 'X'.repeat(4001),
      priority: 'medium',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/maintenance — Request Creation', () => {
  const validBody = {
    propertyId: PROPERTY_ID,
    unitId: '00000000-0000-4000-e000-000000000001',
    description: 'Kitchen sink leaking under cabinet. Water pooling on floor.',
    priority: 'high',
    permissionToEnter: true,
    entryInstructions: 'Key at front desk. Dog in bedroom.',
  };

  it('generates MR-XXXX reference number', async () => {
    mockCreate.mockResolvedValue({
      id: 'mr-1',
      ...validBody,
      referenceNumber: 'MR-0841',
      status: 'open',
      createdAt: new Date(),
      unit: { id: validBody.unitId, number: '1501' },
    });

    const req = createPostRequest('/api/v1/maintenance', validBody);
    await POST(req);

    const createData = mockCreate.mock.calls[0][0].data;
    expect(createData.referenceNumber).toMatch(/^MR-[A-Z0-9]+$/);
  });

  it('sets initial status to open — new requests always start open', async () => {
    mockCreate.mockResolvedValue({
      id: 'mr-1',
      ...validBody,
      referenceNumber: 'MR-0841',
      status: 'open',
      createdAt: new Date(),
      unit: { id: validBody.unitId, number: '1501' },
    });

    const req = createPostRequest('/api/v1/maintenance', validBody);
    await POST(req);

    expect(mockCreate.mock.calls[0][0].data.status).toBe('open');
  });

  it('stores permissionToEnter — critical for staff safety and legal liability', async () => {
    mockCreate.mockResolvedValue({
      id: 'mr-1',
      ...validBody,
      referenceNumber: 'MR-0841',
      status: 'open',
      createdAt: new Date(),
      unit: { id: validBody.unitId, number: '1501' },
    });

    const req = createPostRequest('/api/v1/maintenance', validBody);
    await POST(req);

    const data = mockCreate.mock.calls[0][0].data;
    expect(data.permissionToEnter).toBe(true);
    expect(data.entryInstructions).toBe('Key at front desk. Dog in bedroom.');
  });

  it('returns 201 with reference number in message', async () => {
    mockCreate.mockResolvedValue({
      id: 'mr-1',
      ...validBody,
      referenceNumber: 'MR-0841',
      status: 'open',
      createdAt: new Date(),
      unit: { id: validBody.unitId, number: '1501' },
    });

    const req = createPostRequest('/api/v1/maintenance', validBody);
    const res = await POST(req);

    expect(res.status).toBe(201);
    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('MR-0841');
  });

  it('handles database errors gracefully', async () => {
    mockCreate.mockRejectedValue(new Error('DB down'));

    const req = createPostRequest('/api/v1/maintenance', validBody);
    const res = await POST(req);

    expect(res.status).toBe(500);
    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).not.toContain('DB down');
  });
});
