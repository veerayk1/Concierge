/**
 * Emergency Contacts API Route Tests — per PRD 07
 *
 * Covers:
 * - GET /api/v1/emergency-contacts (list by unit)
 * - POST /api/v1/emergency-contacts (create contact)
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createGetRequest, createPostRequest, parseResponse } from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Mock Setup
// ---------------------------------------------------------------------------

const mockContactFindMany = vi.fn();
const mockContactCreate = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    emergencyContact: {
      findMany: (...args: unknown[]) => mockContactFindMany(...args),
      create: (...args: unknown[]) => mockContactCreate(...args),
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

import { GET, POST } from '../route';

const PROPERTY_A = '00000000-0000-4000-b000-000000000001';
const UNIT_A = '00000000-0000-4000-e000-000000000001';
const USER_A = '00000000-0000-4000-f000-000000000001';

beforeEach(() => {
  vi.clearAllMocks();
  mockContactFindMany.mockResolvedValue([]);
});

// ---------------------------------------------------------------------------
// GET /api/v1/emergency-contacts — Tenant Isolation
// ---------------------------------------------------------------------------

describe('GET /api/v1/emergency-contacts — Tenant Isolation', () => {
  it('rejects without unitId', async () => {
    const req = createGetRequest('/api/v1/emergency-contacts');
    const res = await GET(req);
    expect(res.status).toBe(400);
    expect(mockContactFindMany).not.toHaveBeenCalled();
  });

  it('filters by unitId', async () => {
    const req = createGetRequest('/api/v1/emergency-contacts', {
      searchParams: { unitId: UNIT_A },
    });
    await GET(req);

    const where = mockContactFindMany.mock.calls[0]![0].where;
    expect(where.unitId).toBe(UNIT_A);
  });
});

// ---------------------------------------------------------------------------
// GET /api/v1/emergency-contacts — Listing
// ---------------------------------------------------------------------------

describe('GET /api/v1/emergency-contacts — Listing', () => {
  it('orders by sortOrder then contactName', async () => {
    const req = createGetRequest('/api/v1/emergency-contacts', {
      searchParams: { unitId: UNIT_A },
    });
    await GET(req);

    expect(mockContactFindMany.mock.calls[0]![0].orderBy).toEqual([
      { sortOrder: 'asc' },
      { contactName: 'asc' },
    ]);
  });

  it('returns empty array when no contacts exist', async () => {
    const req = createGetRequest('/api/v1/emergency-contacts', {
      searchParams: { unitId: UNIT_A },
    });
    const res = await GET(req);
    const body = await parseResponse<{ data: unknown[] }>(res);
    expect(body.data).toEqual([]);
  });

  it('returns contacts array on success', async () => {
    mockContactFindMany.mockResolvedValue([
      { id: 'c1', contactName: 'Jane Doe', phonePrimary: '416-555-1234' },
      { id: 'c2', contactName: 'John Doe', phonePrimary: '416-555-5678' },
    ]);

    const req = createGetRequest('/api/v1/emergency-contacts', {
      searchParams: { unitId: UNIT_A },
    });
    const res = await GET(req);
    const body = await parseResponse<{ data: { contactName: string }[] }>(res);
    expect(body.data).toHaveLength(2);
    expect(body.data[0]!.contactName).toBe('Jane Doe');
  });

  it('handles database errors without leaking internals', async () => {
    mockContactFindMany.mockRejectedValue(new Error('Connection refused'));

    const req = createGetRequest('/api/v1/emergency-contacts', {
      searchParams: { unitId: UNIT_A },
    });
    const res = await GET(req);
    expect(res.status).toBe(500);
    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).not.toContain('Connection');
  });
});

// ---------------------------------------------------------------------------
// POST /api/v1/emergency-contacts — Validation
// ---------------------------------------------------------------------------

describe('POST /api/v1/emergency-contacts — Validation', () => {
  it('rejects empty body', async () => {
    const req = createPostRequest('/api/v1/emergency-contacts', {});
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('rejects missing contactName', async () => {
    const req = createPostRequest('/api/v1/emergency-contacts', {
      propertyId: PROPERTY_A,
      unitId: UNIT_A,
      userId: USER_A,
      relationship: 'Spouse',
      phonePrimary: '416-555-1234',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects missing phonePrimary', async () => {
    const req = createPostRequest('/api/v1/emergency-contacts', {
      propertyId: PROPERTY_A,
      unitId: UNIT_A,
      userId: USER_A,
      contactName: 'Jane Doe',
      relationship: 'Spouse',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects missing relationship', async () => {
    const req = createPostRequest('/api/v1/emergency-contacts', {
      propertyId: PROPERTY_A,
      unitId: UNIT_A,
      userId: USER_A,
      contactName: 'Jane Doe',
      phonePrimary: '416-555-1234',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects invalid propertyId format', async () => {
    const req = createPostRequest('/api/v1/emergency-contacts', {
      propertyId: 'not-uuid',
      unitId: UNIT_A,
      userId: USER_A,
      contactName: 'Jane Doe',
      relationship: 'Spouse',
      phonePrimary: '416-555-1234',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects invalid unitId format', async () => {
    const req = createPostRequest('/api/v1/emergency-contacts', {
      propertyId: PROPERTY_A,
      unitId: 'DROP TABLE;--',
      userId: USER_A,
      contactName: 'Jane Doe',
      relationship: 'Spouse',
      phonePrimary: '416-555-1234',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects contactName over 100 characters', async () => {
    const req = createPostRequest('/api/v1/emergency-contacts', {
      propertyId: PROPERTY_A,
      unitId: UNIT_A,
      userId: USER_A,
      contactName: 'X'.repeat(101),
      relationship: 'Spouse',
      phonePrimary: '416-555-1234',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects invalid email format', async () => {
    const req = createPostRequest('/api/v1/emergency-contacts', {
      propertyId: PROPERTY_A,
      unitId: UNIT_A,
      userId: USER_A,
      contactName: 'Jane Doe',
      relationship: 'Spouse',
      phonePrimary: '416-555-1234',
      email: 'not-an-email',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('accepts empty string email — optional field', async () => {
    mockContactCreate.mockResolvedValue({ id: 'c1' });

    const req = createPostRequest('/api/v1/emergency-contacts', {
      propertyId: PROPERTY_A,
      unitId: UNIT_A,
      userId: USER_A,
      contactName: 'Jane Doe',
      relationship: 'Spouse',
      phonePrimary: '416-555-1234',
      email: '',
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });
});

// ---------------------------------------------------------------------------
// POST /api/v1/emergency-contacts — Creation
// ---------------------------------------------------------------------------

describe('POST /api/v1/emergency-contacts — Contact Creation', () => {
  const validContact = {
    propertyId: PROPERTY_A,
    unitId: UNIT_A,
    userId: USER_A,
    contactName: 'Jane Doe',
    relationship: 'Spouse',
    phonePrimary: '416-555-1234',
    phoneSecondary: '647-555-5678',
    email: 'jane@example.com',
  };

  it('creates contact and returns 201', async () => {
    mockContactCreate.mockResolvedValue({ id: 'c1', ...validContact });

    const req = createPostRequest('/api/v1/emergency-contacts', validContact);
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('added');
  });

  it('strips HTML from contactName — XSS prevention', async () => {
    mockContactCreate.mockResolvedValue({ id: 'c1' });

    const req = createPostRequest('/api/v1/emergency-contacts', {
      ...validContact,
      contactName: '<script>alert("xss")</script>Jane',
    });
    await POST(req);

    const createData = mockContactCreate.mock.calls[0]![0].data;
    expect(createData.contactName).not.toContain('<script>');
    expect(createData.contactName).toContain('Jane');
  });

  it('stores all provided fields correctly', async () => {
    mockContactCreate.mockResolvedValue({ id: 'c1' });

    const req = createPostRequest('/api/v1/emergency-contacts', validContact);
    await POST(req);

    const createData = mockContactCreate.mock.calls[0]![0].data;
    expect(createData.propertyId).toBe(PROPERTY_A);
    expect(createData.unitId).toBe(UNIT_A);
    expect(createData.userId).toBe(USER_A);
    expect(createData.relationship).toBe('Spouse');
    expect(createData.phonePrimary).toBe('416-555-1234');
    expect(createData.phoneSecondary).toBe('647-555-5678');
    expect(createData.email).toBe('jane@example.com');
  });

  it('sets null for optional fields when not provided', async () => {
    mockContactCreate.mockResolvedValue({ id: 'c1' });

    const req = createPostRequest('/api/v1/emergency-contacts', {
      propertyId: PROPERTY_A,
      unitId: UNIT_A,
      userId: USER_A,
      contactName: 'Jane Doe',
      relationship: 'Parent',
      phonePrimary: '416-555-9999',
    });
    await POST(req);

    const createData = mockContactCreate.mock.calls[0]![0].data;
    expect(createData.phoneSecondary).toBeNull();
    expect(createData.email).toBeNull();
  });

  it('handles database errors without leaking internals', async () => {
    mockContactCreate.mockRejectedValue(new Error('FK: unitId not found in units'));

    const req = createPostRequest('/api/v1/emergency-contacts', validContact);
    const res = await POST(req);
    expect(res.status).toBe(500);
    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).not.toContain('FK');
  });
});
