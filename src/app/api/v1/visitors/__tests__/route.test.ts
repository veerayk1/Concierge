/**
 * Visitors API Tests — per PRD 03 Visitor Management
 *
 * Visitor tracking is a PHYSICAL SECURITY function. If a visitor
 * is signed in but never signed out, security doesn't know who's
 * still in the building during an emergency evacuation.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  createGetRequest,
  createPostRequest,
  createPatchRequest,
  parseResponse,
} from '@/test/helpers/api';

const mockFindMany = vi.fn();
const mockCount = vi.fn();
const mockCreate = vi.fn();
const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();
const mockUpdateMany = vi.fn();

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

import { GET, POST } from '../route';
import { PATCH } from '../[id]/route';

beforeEach(() => {
  vi.clearAllMocks();
  mockFindMany.mockResolvedValue([]);
  mockCount.mockResolvedValue(0);
});

const PROPERTY_ID = '00000000-0000-4000-b000-000000000001';

// ---------------------------------------------------------------------------
// GET /api/v1/visitors — List
// ---------------------------------------------------------------------------

describe('GET /api/v1/visitors — Tenant Isolation', () => {
  it('rejects without propertyId', async () => {
    const req = createGetRequest('/api/v1/visitors');
    const res = await GET(req);
    expect(res.status).toBe(400);
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it('defaults to active (signed-in) visitors — security needs to know who is IN the building', async () => {
    const req = createGetRequest('/api/v1/visitors', { searchParams: { propertyId: PROPERTY_ID } });
    await GET(req);

    const where = mockFindMany.mock.calls[0]![0].where;
    expect(where.departureAt).toBeNull(); // Only show visitors still in building
  });

  it('can filter to signed-out visitors for historical records', async () => {
    const req = createGetRequest('/api/v1/visitors', {
      searchParams: { propertyId: PROPERTY_ID, status: 'signed_out' },
    });
    await GET(req);

    const where = mockFindMany.mock.calls[0]![0].where;
    expect(where.departureAt).toEqual({ not: null });
  });
});

// ---------------------------------------------------------------------------
// POST /api/v1/visitors — Sign In
// ---------------------------------------------------------------------------

describe('POST /api/v1/visitors — Sign In', () => {
  const validBody = {
    propertyId: PROPERTY_ID,
    visitorName: 'John Williams',
    unitId: '00000000-0000-4000-e000-000000000001',
    purpose: 'personal',
    idVerified: true,
  };

  it('creates visitor entry with visitorType mapped from purpose', async () => {
    mockCreate.mockResolvedValue({
      id: 'v-1',
      ...validBody,
      createdAt: new Date(),
      unit: { number: '1501' },
    });

    const req = createPostRequest('/api/v1/visitors', validBody);
    await POST(req);

    const createData = mockCreate.mock.calls[0]![0].data;
    expect(createData.visitorType).toBe('personal'); // Mapped from purpose input
  });

  it('sanitizes visitor name — prevents XSS via name field', async () => {
    mockCreate.mockResolvedValue({
      id: 'v-1',
      createdAt: new Date(),
      unit: { number: '1501' },
      ...validBody,
      visitorName: 'John Williams',
    });

    const req = createPostRequest('/api/v1/visitors', {
      ...validBody,
      visitorName: '<script>alert("xss")</script>John Williams',
    });
    await POST(req);

    const createData = mockCreate.mock.calls[0]![0].data;
    expect(createData.visitorName).not.toContain('<script>');
  });

  it('returns 201 with visitor name and unit in message', async () => {
    mockCreate.mockResolvedValue({
      id: 'v-1',
      ...validBody,
      createdAt: new Date(),
      unit: { number: '1501' },
    });

    const req = createPostRequest('/api/v1/visitors', validBody);
    const res = await POST(req);

    expect(res.status).toBe(201);
    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('John Williams');
    expect(body.message).toContain('1501');
  });

  it('rejects missing visitor name', async () => {
    const req = createPostRequest('/api/v1/visitors', {
      ...validBody,
      visitorName: '',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects missing unit', async () => {
    const req = createPostRequest('/api/v1/visitors', {
      ...validBody,
      unitId: '',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// PATCH /api/v1/visitors/:id — Sign Out
// ---------------------------------------------------------------------------

describe('PATCH /api/v1/visitors/:id — Sign Out', () => {
  it('signs out a visitor and sets signedOutById from auth', async () => {
    mockFindUnique.mockResolvedValue({ id: 'v-1', visitorName: 'John', departureAt: null });
    mockUpdate.mockResolvedValue({ id: 'v-1', departureAt: new Date() });

    const req = createPatchRequest('/api/v1/visitors/v-1', {});
    const res = await PATCH(req, { params: Promise.resolve({ id: 'v-1' }) });

    expect(res.status).toBe(200);
    const updateData = mockUpdate.mock.calls[0]![0].data;
    expect(updateData.departureAt).toBeInstanceOf(Date);
    expect(updateData.signedOutById).toBe('guard-patel');
  });

  it('rejects signing out an already signed-out visitor', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'v-1',
      visitorName: 'John',
      departureAt: new Date('2026-03-18T10:00:00'), // Already signed out
    });

    const req = createPatchRequest('/api/v1/visitors/v-1', {});
    const res = await PATCH(req, { params: Promise.resolve({ id: 'v-1' }) });

    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('ALREADY_SIGNED_OUT');
  });

  it('returns 404 for non-existent visitor', async () => {
    mockFindUnique.mockResolvedValue(null);

    const req = createPatchRequest('/api/v1/visitors/nonexistent', {});
    const res = await PATCH(req, { params: Promise.resolve({ id: 'nonexistent' }) });

    expect(res.status).toBe(404);
  });
});
