/**
 * Users API Route Tests — per PRD 08
 *
 * These tests verify REAL business rules, security boundaries, and edge cases
 * that could cause production bugs in a condo management platform.
 *
 * Security context: User accounts are tied to physical building access (FOBs, keys).
 * A compromised or stale account is a PHYSICAL security risk, not just software.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createGetRequest, createPostRequest, parseResponse } from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Mock Setup
// ---------------------------------------------------------------------------

const mockFindMany = vi.fn();
const mockCount = vi.fn();
const mockFindFirst = vi.fn();
const mockTransaction = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    user: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      count: (...args: unknown[]) => mockCount(...args),
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

vi.mock('@/server/auth/password', () => ({
  hashPassword: vi.fn().mockResolvedValue('$argon2id$v=19$m=65536,t=3,p=4$hashed'),
}));

vi.mock('nanoid', () => ({
  nanoid: vi.fn().mockReturnValue('TMP_PWD_16CHARS'),
}));

// Mock the auth guard — these tests focus on business logic, not auth
// Auth is tested separately in api-guard.test.ts
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

import { GET, POST } from '../route';

beforeEach(() => {
  vi.clearAllMocks();
  mockFindMany.mockResolvedValue([]);
  mockCount.mockResolvedValue(0);
  mockFindFirst.mockResolvedValue(null);
});

// ---------------------------------------------------------------------------
// GET /api/v1/users — Tenant Isolation & Authorization
// ---------------------------------------------------------------------------

describe('GET /api/v1/users — Tenant Isolation', () => {
  it('REJECTS requests without propertyId — prevents cross-tenant data leak', async () => {
    const req = createGetRequest('/api/v1/users');
    const res = await GET(req);
    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_PROPERTY');
    // Verify NO database query was made — prevents accidental data exposure
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it('scopes ALL queries to the requested propertyId — tenant isolation', async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    const propertyId = '00000000-0000-4000-b000-000000000001';
    const req = createGetRequest('/api/v1/users', { searchParams: { propertyId } });
    await GET(req);

    // Verify the Prisma query includes propertyId in the where clause
    const findManyCall = mockFindMany.mock.calls[0][0];
    expect(findManyCall.where).toMatchObject({
      deletedAt: null, // Soft-delete filter — never return deleted users
      userProperties: {
        some: {
          propertyId, // Must scope to this property
          deletedAt: null,
        },
      },
    });
  });

  it('NEVER returns soft-deleted users — SECURITY-RULEBOOK J.4', async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/users', {
      searchParams: { propertyId: '00000000-0000-4000-b000-000000000001' },
    });
    await GET(req);

    const where = mockFindMany.mock.calls[0][0].where;
    expect(where.deletedAt).toBeNull(); // Must filter out deleted records
  });
});

// ---------------------------------------------------------------------------
// GET /api/v1/users — Search & Filtering
// ---------------------------------------------------------------------------

describe('GET /api/v1/users — Search', () => {
  it('searches across firstName, lastName, and email simultaneously', async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/users', {
      searchParams: { propertyId: '00000000-0000-4000-b000-000000000001', search: 'janet' },
    });
    await GET(req);

    const where = mockFindMany.mock.calls[0][0].where;
    expect(where.OR).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ firstName: { contains: 'janet', mode: 'insensitive' } }),
        expect.objectContaining({ lastName: { contains: 'janet', mode: 'insensitive' } }),
        expect.objectContaining({ email: { contains: 'janet', mode: 'insensitive' } }),
      ]),
    );
  });

  it('search is case-insensitive — per PRD 08 Section 3.1.10', async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/users', {
      searchParams: { propertyId: '00000000-0000-4000-b000-000000000001', search: 'JANET' },
    });
    await GET(req);

    const where = mockFindMany.mock.calls[0][0].where;
    // All search fields must use insensitive mode
    for (const condition of where.OR) {
      const field = Object.keys(condition)[0];
      expect(condition[field].mode).toBe('insensitive');
    }
  });

  it('filters by status=active returns only activated + active users', async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/users', {
      searchParams: { propertyId: '00000000-0000-4000-b000-000000000001', status: 'active' },
    });
    await GET(req);

    const where = mockFindMany.mock.calls[0][0].where;
    expect(where.isActive).toBe(true);
    expect(where.activatedAt).toEqual({ not: null }); // Must have completed onboarding
  });

  it('filters by status=pending returns users who never activated', async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/users', {
      searchParams: { propertyId: '00000000-0000-4000-b000-000000000001', status: 'pending' },
    });
    await GET(req);

    const where = mockFindMany.mock.calls[0][0].where;
    expect(where.activatedAt).toBeNull(); // Never completed onboarding
  });
});

// ---------------------------------------------------------------------------
// GET /api/v1/users — Pagination
// ---------------------------------------------------------------------------

describe('GET /api/v1/users — Pagination', () => {
  it('defaults to page 1 with 20 items per page', async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(100);

    const req = createGetRequest('/api/v1/users', {
      searchParams: { propertyId: '00000000-0000-4000-b000-000000000001' },
    });
    const res = await GET(req);
    const body = await parseResponse<{
      meta: { page: number; pageSize: number; totalPages: number };
    }>(res);

    expect(body.meta.page).toBe(1);
    expect(body.meta.pageSize).toBe(20);
    expect(body.meta.totalPages).toBe(5); // 100 / 20
  });

  it('calculates totalPages correctly with remainder', async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(23);

    const req = createGetRequest('/api/v1/users', {
      searchParams: { propertyId: '00000000-0000-4000-b000-000000000001', pageSize: '10' },
    });
    const res = await GET(req);
    const body = await parseResponse<{ meta: { totalPages: number } }>(res);

    expect(body.meta.totalPages).toBe(3); // ceil(23/10)
  });

  it('applies correct skip/take for page 3', async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(100);

    const req = createGetRequest('/api/v1/users', {
      searchParams: {
        propertyId: '00000000-0000-4000-b000-000000000001',
        page: '3',
        pageSize: '10',
      },
    });
    await GET(req);

    const call = mockFindMany.mock.calls[0][0];
    expect(call.skip).toBe(20); // (3-1) * 10
    expect(call.take).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// GET /api/v1/users — Status Mapping (PRD 08 Section 3.1.2)
// ---------------------------------------------------------------------------

describe('GET /api/v1/users — Account Status Lifecycle', () => {
  const makeUser = (overrides: Record<string, unknown>) => ({
    id: 'u1',
    email: 'a@b.com',
    firstName: 'A',
    lastName: 'B',
    phone: null,
    avatarUrl: null,
    mfaEnabled: false,
    isActive: true,
    activatedAt: new Date(),
    lastLoginAt: null,
    createdAt: new Date(),
    userProperties: [{ role: { id: 'r1', name: 'Staff', slug: 'front_desk' } }],
    ...overrides,
  });

  it('status=pending when activatedAt is null (account created, not onboarded)', async () => {
    mockFindMany.mockResolvedValue([makeUser({ activatedAt: null })]);
    mockCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/users', {
      searchParams: { propertyId: '00000000-0000-4000-b000-000000000001' },
    });
    const res = await GET(req);
    const body = await parseResponse<{ data: { status: string }[] }>(res);
    expect(body.data[0].status).toBe('pending');
  });

  it('status=active when activatedAt exists and isActive=true', async () => {
    mockFindMany.mockResolvedValue([makeUser({ activatedAt: new Date(), isActive: true })]);
    mockCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/users', {
      searchParams: { propertyId: '00000000-0000-4000-b000-000000000001' },
    });
    const res = await GET(req);
    const body = await parseResponse<{ data: { status: string }[] }>(res);
    expect(body.data[0].status).toBe('active');
  });

  it('status=suspended when activatedAt exists but isActive=false', async () => {
    mockFindMany.mockResolvedValue([makeUser({ activatedAt: new Date(), isActive: false })]);
    mockCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/users', {
      searchParams: { propertyId: '00000000-0000-4000-b000-000000000001' },
    });
    const res = await GET(req);
    const body = await parseResponse<{ data: { status: string }[] }>(res);
    expect(body.data[0].status).toBe('suspended');
  });
});

// ---------------------------------------------------------------------------
// POST /api/v1/users — Account Creation (PRD 08 Section 3.1.1)
// ---------------------------------------------------------------------------

describe('POST /api/v1/users — Validation', () => {
  const validBody = {
    firstName: 'Janet',
    lastName: 'Smith',
    email: 'janet@building.com',
    propertyId: '00000000-0000-4000-b000-000000000001',
    roleId: '00000000-0000-4000-c000-000000010003',
    sendWelcomeEmail: true,
    languagePreference: 'en',
  };

  it('rejects empty body with VALIDATION_ERROR', async () => {
    const req = createPostRequest('/api/v1/users', {});
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string; fields: Record<string, string[]> }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
    expect(body.fields).toBeDefined();
  });

  it('returns SPECIFIC field errors for each invalid field — not generic message', async () => {
    const req = createPostRequest('/api/v1/users', {
      firstName: '',
      lastName: '',
      email: 'not-an-email',
      propertyId: 'bad',
      roleId: '',
    });
    const res = await POST(req);
    const body = await parseResponse<{ fields: Record<string, string[]> }>(res);

    expect(body.fields.firstName).toBeDefined();
    expect(body.fields.lastName).toBeDefined();
    expect(body.fields.email).toBeDefined();
    expect(body.fields.propertyId).toBeDefined();
    expect(body.fields.roleId).toBeDefined();
  });

  it('rejects names with numbers — per PRD 08 field spec (letters, hyphens, apostrophes only)', async () => {
    const req = createPostRequest('/api/v1/users', { ...validBody, firstName: 'Janet123' });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('accepts hyphenated and apostrophe names — per Canadian naming conventions', async () => {
    mockFindFirst.mockResolvedValue(null);
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      return fn({
        user: {
          create: vi.fn().mockResolvedValue({
            id: 'u1',
            email: 'mary@b.com',
            firstName: 'Mary-Jane',
            lastName: "O'Brien",
            createdAt: new Date(),
          }),
        },
        userProperty: { create: vi.fn() },
      });
    });

    const req = createPostRequest('/api/v1/users', {
      ...validBody,
      firstName: 'Mary-Jane',
      lastName: "O'Brien",
      email: 'mary@b.com',
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });
});

describe('POST /api/v1/users — Email Uniqueness (Security)', () => {
  const validBody = {
    firstName: 'Janet',
    lastName: 'Smith',
    email: 'janet@building.com',
    propertyId: '00000000-0000-4000-b000-000000000001',
    roleId: '00000000-0000-4000-c000-000000010003',
    sendWelcomeEmail: true,
    languagePreference: 'en',
  };

  it('rejects duplicate email at the SAME property', async () => {
    mockFindFirst.mockResolvedValue({ id: 'existing-user' });

    const req = createPostRequest('/api/v1/users', validBody);
    const res = await POST(req);
    expect(res.status).toBe(409);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('EMAIL_EXISTS');
  });

  it('lowercases email before checking uniqueness — prevents JANET@Building.com vs janet@building.com bypass', async () => {
    mockFindFirst.mockResolvedValue(null);
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      return fn({
        user: {
          create: vi.fn().mockResolvedValue({
            id: 'u1',
            email: 'janet@building.com',
            firstName: 'Janet',
            lastName: 'Smith',
            createdAt: new Date(),
          }),
        },
        userProperty: { create: vi.fn() },
      });
    });

    const req = createPostRequest('/api/v1/users', { ...validBody, email: 'JANET@Building.COM' });
    await POST(req);

    // Verify the findFirst check used lowercased email
    expect(mockFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          email: 'janet@building.com', // Must be lowercased
        }),
      }),
    );
  });

  it('checks uniqueness ONLY within the same property — user can exist at different properties', async () => {
    mockFindFirst.mockResolvedValue(null);
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      return fn({
        user: {
          create: vi.fn().mockResolvedValue({
            id: 'u1',
            email: 'janet@building.com',
            firstName: 'Janet',
            lastName: 'Smith',
            createdAt: new Date(),
          }),
        },
        userProperty: { create: vi.fn() },
      });
    });

    const req = createPostRequest('/api/v1/users', validBody);
    await POST(req);

    // Verify uniqueness check includes propertyId scope
    expect(mockFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userProperties: expect.objectContaining({
            some: expect.objectContaining({
              propertyId: validBody.propertyId,
            }),
          }),
        }),
      }),
    );
  });
});

describe('POST /api/v1/users — Account Creation Flow', () => {
  const validBody = {
    firstName: 'Janet',
    lastName: 'Smith',
    email: 'janet@building.com',
    propertyId: '00000000-0000-4000-b000-000000000001',
    roleId: '00000000-0000-4000-c000-000000010003',
    sendWelcomeEmail: true,
    languagePreference: 'en',
  };

  it('creates User AND UserProperty in a TRANSACTION — ensures atomicity', async () => {
    mockFindFirst.mockResolvedValue(null);

    let transactionCalled = false;
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      transactionCalled = true;
      return fn({
        user: {
          create: vi.fn().mockResolvedValue({
            id: 'u1',
            email: 'janet@building.com',
            firstName: 'Janet',
            lastName: 'Smith',
            createdAt: new Date(),
          }),
        },
        userProperty: { create: vi.fn() },
      });
    });

    const req = createPostRequest('/api/v1/users', validBody);
    await POST(req);

    expect(transactionCalled).toBe(true); // Must use transaction
  });

  it('generates a temporary password with Argon2id — per SECURITY-RULEBOOK A.2', async () => {
    const { hashPassword } = await import('@/server/auth/password');
    mockFindFirst.mockResolvedValue(null);
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      return fn({
        user: {
          create: vi.fn().mockResolvedValue({
            id: 'u1',
            email: 'janet@building.com',
            firstName: 'Janet',
            lastName: 'Smith',
            createdAt: new Date(),
          }),
        },
        userProperty: { create: vi.fn() },
      });
    });

    const req = createPostRequest('/api/v1/users', validBody);
    await POST(req);

    expect(hashPassword).toHaveBeenCalled(); // Must hash the temp password
  });

  it('returns 201 with user data and confirmation message', async () => {
    mockFindFirst.mockResolvedValue(null);
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      return fn({
        user: {
          create: vi.fn().mockResolvedValue({
            id: 'new-user-id',
            email: 'janet@building.com',
            firstName: 'Janet',
            lastName: 'Smith',
            createdAt: new Date(),
          }),
        },
        userProperty: { create: vi.fn() },
      });
    });

    const req = createPostRequest('/api/v1/users', validBody);
    const res = await POST(req);

    expect(res.status).toBe(201);
    const body = await parseResponse<{ data: { id: string; status: string }; message: string }>(
      res,
    );
    expect(body.data.id).toBe('new-user-id');
    expect(body.data.status).toBe('pending'); // Not yet activated
    expect(body.message).toContain('Janet Smith');
    expect(body.message).toContain('Welcome email');
  });

  it('DOES NOT return the temporary password in the response — security', async () => {
    mockFindFirst.mockResolvedValue(null);
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      return fn({
        user: {
          create: vi.fn().mockResolvedValue({
            id: 'u1',
            email: 'janet@building.com',
            firstName: 'Janet',
            lastName: 'Smith',
            createdAt: new Date(),
          }),
        },
        userProperty: { create: vi.fn() },
      });
    });

    const req = createPostRequest('/api/v1/users', validBody);
    const res = await POST(req);
    const text = await res.clone().text();

    // The response body must NEVER contain the password or hash
    expect(text).not.toContain('password');
    expect(text).not.toContain('argon2');
    expect(text).not.toContain('TMP_PWD');
  });

  it('handles database errors gracefully — returns 500 without leaking internals', async () => {
    mockFindFirst.mockResolvedValue(null);
    mockTransaction.mockRejectedValue(new Error('Connection refused'));

    const req = createPostRequest('/api/v1/users', validBody);
    const res = await POST(req);

    expect(res.status).toBe(500);
    const body = await parseResponse<{ error: string; message: string }>(res);
    expect(body.error).toBe('INTERNAL_ERROR');
    expect(body.message).not.toContain('Connection refused'); // Don't leak DB errors
  });
});
