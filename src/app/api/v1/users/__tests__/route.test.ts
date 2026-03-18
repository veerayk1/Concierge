/**
 * Users API Route Tests — per PRD 08
 * Tests GET (list) and POST (create) handlers
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createGetRequest, createPostRequest, parseResponse } from '@/test/helpers/api';

// Mock Prisma
const mockFindMany = vi.fn();
const mockCount = vi.fn();
const mockFindFirst = vi.fn();
const mockCreate = vi.fn();
const mockTransaction = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    user: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      count: (...args: unknown[]) => mockCount(...args),
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
      create: (...args: unknown[]) => mockCreate(...args),
    },
    userProperty: {
      create: vi.fn(),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

vi.mock('@/server/auth/password', () => ({
  hashPassword: vi.fn().mockResolvedValue('$argon2id$hashed'),
}));

vi.mock('nanoid', () => ({
  nanoid: vi.fn().mockReturnValue('ABC123'),
}));

import { GET, POST } from '../route';

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// GET /api/v1/users
// ---------------------------------------------------------------------------

describe('GET /api/v1/users', () => {
  it('returns 400 if propertyId is missing', async () => {
    const req = createGetRequest('/api/v1/users');
    const res = await GET(req);
    expect(res.status).toBe(400);
    const body = await parseResponse(res);
    expect((body as Record<string, string>).error).toBe('MISSING_PROPERTY');
  });

  it('returns users for a valid propertyId', async () => {
    const mockUsers = [
      {
        id: 'user-1',
        email: 'admin@test.com',
        firstName: 'Admin',
        lastName: 'User',
        phone: null,
        avatarUrl: null,
        mfaEnabled: true,
        isActive: true,
        activatedAt: new Date(),
        lastLoginAt: new Date(),
        createdAt: new Date(),
        userProperties: [
          { role: { id: 'role-1', name: 'Property Admin', slug: 'property_admin' } },
        ],
      },
    ];

    mockFindMany.mockResolvedValue(mockUsers);
    mockCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/users', {
      searchParams: { propertyId: '00000000-0000-4000-b000-000000000001' },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: unknown[]; meta: { total: number } }>(res);
    expect(body.data).toHaveLength(1);
    expect(body.meta.total).toBe(1);
  });

  it('supports search parameter', async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/users', {
      searchParams: { propertyId: '00000000-0000-4000-b000-000000000001', search: 'admin' },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);

    // Verify the where clause includes OR for search
    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([expect.objectContaining({ firstName: expect.any(Object) })]),
        }),
      }),
    );
  });

  it('supports pagination', async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(50);

    const req = createGetRequest('/api/v1/users', {
      searchParams: {
        propertyId: '00000000-0000-4000-b000-000000000001',
        page: '2',
        pageSize: '10',
      },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      meta: { page: number; pageSize: number; totalPages: number };
    }>(res);
    expect(body.meta.page).toBe(2);
    expect(body.meta.pageSize).toBe(10);
    expect(body.meta.totalPages).toBe(5);
  });

  it('maps user status correctly', async () => {
    const mockUsers = [
      {
        id: 'u1',
        email: 'a@b.com',
        firstName: 'A',
        lastName: 'B',
        phone: null,
        avatarUrl: null,
        mfaEnabled: false,
        isActive: true,
        activatedAt: null,
        lastLoginAt: null,
        createdAt: new Date(),
        userProperties: [{ role: { id: 'r1', name: 'Staff', slug: 'front_desk' } }],
      },
    ];
    mockFindMany.mockResolvedValue(mockUsers);
    mockCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/users', {
      searchParams: { propertyId: '00000000-0000-4000-b000-000000000001' },
    });
    const res = await GET(req);
    const body = await parseResponse<{ data: { status: string }[] }>(res);
    expect(body.data[0].status).toBe('pending'); // activatedAt is null
  });
});

// ---------------------------------------------------------------------------
// POST /api/v1/users
// ---------------------------------------------------------------------------

describe('POST /api/v1/users', () => {
  const validBody = {
    firstName: 'Janet',
    lastName: 'Smith',
    email: 'janet@building.com',
    propertyId: '00000000-0000-4000-b000-000000000001',
    roleId: '00000000-0000-4000-c000-000000010003',
    sendWelcomeEmail: true,
    languagePreference: 'en',
  };

  it('returns 400 for invalid input', async () => {
    const req = createPostRequest('/api/v1/users', { firstName: '' });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('returns 409 if email already exists', async () => {
    mockFindFirst.mockResolvedValue({ id: 'existing' });

    const req = createPostRequest('/api/v1/users', validBody);
    const res = await POST(req);
    expect(res.status).toBe(409);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('EMAIL_EXISTS');
  });

  it('creates user and returns 201', async () => {
    mockFindFirst.mockResolvedValue(null);
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const tx = {
        user: {
          create: vi
            .fn()
            .mockResolvedValue({
              id: 'new-user',
              email: 'janet@building.com',
              firstName: 'Janet',
              lastName: 'Smith',
              createdAt: new Date(),
            }),
        },
        userProperty: { create: vi.fn() },
      };
      return fn(tx);
    });

    const req = createPostRequest('/api/v1/users', validBody);
    const res = await POST(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{ data: { id: string }; message: string }>(res);
    expect(body.data.id).toBe('new-user');
    expect(body.message).toContain('Janet Smith');
  });

  it('lowercases email on creation', async () => {
    mockFindFirst.mockResolvedValue(null);
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const createFn = vi
        .fn()
        .mockResolvedValue({
          id: 'u1',
          email: 'janet@building.com',
          firstName: 'Janet',
          lastName: 'Smith',
          createdAt: new Date(),
        });
      const tx = {
        user: { create: createFn },
        userProperty: { create: vi.fn() },
      };
      await fn(tx);
      // Verify email was lowercased
      expect(createFn).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ email: 'janet@building.com' }),
        }),
      );
    });

    const req = createPostRequest('/api/v1/users', { ...validBody, email: 'JANET@Building.com' });
    await POST(req);
  });

  it('returns field-level errors for validation failures', async () => {
    const req = createPostRequest('/api/v1/users', {
      firstName: '',
      lastName: '',
      email: 'invalid',
      propertyId: 'not-uuid',
      roleId: '',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ fields: Record<string, string[]> }>(res);
    expect(body.fields).toBeDefined();
    expect(body.fields.firstName).toBeDefined();
    expect(body.fields.email).toBeDefined();
  });
});
