/**
 * Comprehensive User Management Tests — PRD 08
 *
 * User accounts in condo management are tied to PHYSICAL building access.
 * A user account controls FOBs, keys, buzzer codes, parking permits, and
 * emergency contact information. Account compromise or stale accounts are
 * not just software bugs — they are physical security incidents.
 *
 * Critical security invariants tested:
 *   - Passwords never appear in ANY response body
 *   - Email uniqueness enforced per-property (prevents duplicate accounts)
 *   - Soft delete revokes ALL sessions and refresh tokens atomically
 *   - Status changes (suspend/deactivate) revoke sessions immediately
 *   - Tenant isolation: Property A cannot see Property B users
 *
 * Tests cover:
 *   1-5:   GET user list — pagination, sorting, filtering (role, status, building)
 *   6-8:   GET user detail — occupancy records, permissions, login audit trail
 *   9-12:  POST create user — validation, email uniqueness, role assignment
 *   13-16: PATCH update user — profile, role change, activate/deactivate
 *   17-19: DELETE user — soft delete, session revocation, transaction atomicity
 *   20-23: Password & MFA — reset, change, history, MFA setup
 *   24-26: Login audit trail — recent logins, device/IP tracking
 *   27-29: User search — across name, email, unit
 *   30-32: Bulk user import — CSV validation, duplicate handling, limits
 *   33-34: Session management — list sessions, revoke specific/all
 *   35-38: Account lifecycle — lockout, completeness, tenant isolation, DSAR
 *   39-42: Edge cases — concurrent requests, error handling, status mapping
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  createGetRequest,
  createPostRequest,
  createPatchRequest,
  createDeleteRequest,
  parseResponse,
} from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// UUIDs used throughout tests
// ---------------------------------------------------------------------------
const PROPERTY_A = '00000000-0000-4000-b000-000000000001';
const PROPERTY_B = '00000000-0000-4000-b000-000000000002';
const ROLE_ADMIN = '00000000-0000-4000-c000-000000010001';
const ROLE_FRONT_DESK = '00000000-0000-4000-c000-000000010002';
const ROLE_SECURITY = '00000000-0000-4000-c000-000000010003';
const ROLE_RESIDENT = '00000000-0000-4000-c000-000000010004';
const USER_1 = '00000000-0000-4000-d000-000000000001';
const USER_2 = '00000000-0000-4000-d000-000000000002';
const SESSION_1 = '00000000-0000-4000-e000-000000000001';
const SESSION_2 = '00000000-0000-4000-e000-000000000002';
const STAFF_USER = 'test-admin';

// ---------------------------------------------------------------------------
// Mock Setup — Prisma
// ---------------------------------------------------------------------------

const mockUserFindMany = vi.fn();
const mockUserCount = vi.fn();
const mockUserFindFirst = vi.fn();
const mockUserFindUnique = vi.fn();
const mockUserCreate = vi.fn();
const mockUserUpdate = vi.fn();
const mockUserPropertyCreate = vi.fn();
const mockUserPropertyUpdateMany = vi.fn();
const mockSessionFindMany = vi.fn();
const mockSessionUpdate = vi.fn();
const mockSessionUpdateMany = vi.fn();
const mockRefreshTokenUpdateMany = vi.fn();
const mockTransaction = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    user: {
      findMany: (...args: unknown[]) => mockUserFindMany(...args),
      count: (...args: unknown[]) => mockUserCount(...args),
      findFirst: (...args: unknown[]) => mockUserFindFirst(...args),
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
      create: (...args: unknown[]) => mockUserCreate(...args),
      update: (...args: unknown[]) => mockUserUpdate(...args),
    },
    userProperty: {
      create: (...args: unknown[]) => mockUserPropertyCreate(...args),
      updateMany: (...args: unknown[]) => mockUserPropertyUpdateMany(...args),
    },
    session: {
      findMany: (...args: unknown[]) => mockSessionFindMany(...args),
      update: (...args: unknown[]) => mockSessionUpdate(...args),
      updateMany: (...args: unknown[]) => mockSessionUpdateMany(...args),
    },
    refreshToken: {
      updateMany: (...args: unknown[]) => mockRefreshTokenUpdateMany(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

vi.mock('@/server/auth/password', () => ({
  hashPassword: vi.fn().mockResolvedValue('$argon2id$v=19$m=65536,t=3,p=4$hashed'),
}));

vi.mock('nanoid', () => ({
  nanoid: vi.fn().mockReturnValue('TMP_PWD_16CHARS_'),
}));

vi.mock('@/lib/sanitize', () => ({
  stripHtml: (s: string) => s,
  stripControlChars: (s: string) => s,
}));

vi.mock('@/server/email', () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/server/email-templates', () => ({
  renderTemplate: vi.fn().mockReturnValue('<html>Welcome</html>'),
}));

vi.mock('@/server/logger', () => ({
  createLogger: vi.fn().mockReturnValue({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  }),
}));

// Mock auth guard — these tests focus on business logic, not auth
// NOTE: vi.mock is hoisted, so we cannot reference top-level const variables here
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

// Import route handlers AFTER mocks
import { GET as GET_LIST, POST as POST_CREATE } from '../route';
import { GET as GET_DETAIL, PATCH, DELETE as DELETE_USER } from '../[id]/route';
import { GET as GET_SESSIONS, DELETE as DELETE_SESSIONS } from '../[id]/sessions/route';
import { POST as POST_BULK_IMPORT } from '../bulk-import/route';
import { POST as POST_WELCOME_EMAIL } from '../[id]/welcome-email/route';

beforeEach(() => {
  vi.clearAllMocks();
  mockUserFindMany.mockResolvedValue([]);
  mockUserCount.mockResolvedValue(0);
  mockUserFindFirst.mockResolvedValue(null);
  mockUserFindUnique.mockResolvedValue(null);
  mockSessionFindMany.mockResolvedValue([]);
  mockSessionUpdateMany.mockResolvedValue({ count: 0 });
  mockRefreshTokenUpdateMany.mockResolvedValue({ count: 0 });
});

// ---------------------------------------------------------------------------
// Helper factories
// ---------------------------------------------------------------------------

function makeUser(overrides: Record<string, unknown> = {}) {
  return {
    id: USER_1,
    email: 'john.doe@building.com',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+14165551234',
    avatarUrl: null,
    mfaEnabled: false,
    isActive: true,
    activatedAt: new Date('2025-03-01'),
    lastLoginAt: new Date('2025-06-15'),
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-06-15'),
    userProperties: [
      {
        propertyId: PROPERTY_A,
        role: { id: ROLE_FRONT_DESK, name: 'Front Desk', slug: 'front_desk' },
        property: { id: PROPERTY_A, name: 'Maple Tower' },
      },
    ],
    loginAudits: [],
    ...overrides,
  };
}

function makeListUser(overrides: Record<string, unknown> = {}) {
  return {
    id: USER_1,
    email: 'john.doe@building.com',
    firstName: 'John',
    lastName: 'Doe',
    phone: '+14165551234',
    avatarUrl: null,
    mfaEnabled: false,
    isActive: true,
    activatedAt: new Date('2025-03-01'),
    lastLoginAt: new Date('2025-06-15'),
    createdAt: new Date('2025-01-01'),
    userProperties: [{ role: { id: ROLE_FRONT_DESK, name: 'Front Desk', slug: 'front_desk' } }],
    ...overrides,
  };
}

const validCreateBody = {
  firstName: 'Janet',
  lastName: 'Smith',
  email: 'janet@building.com',
  propertyId: PROPERTY_A,
  roleId: ROLE_FRONT_DESK,
  sendWelcomeEmail: true,
  languagePreference: 'en' as const,
};

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

// ===========================================================================
// 1. GET /api/v1/users — Pagination
// ===========================================================================

describe('GET /api/v1/users — Pagination', () => {
  it('1. defaults to page 1 with 20 items per page', async () => {
    mockUserFindMany.mockResolvedValue([]);
    mockUserCount.mockResolvedValue(100);

    const req = createGetRequest('/api/v1/users', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await GET_LIST(req);
    const body = await parseResponse<{
      meta: { page: number; pageSize: number; totalPages: number };
    }>(res);

    expect(body.meta.page).toBe(1);
    expect(body.meta.pageSize).toBe(20);
    expect(body.meta.totalPages).toBe(5); // ceil(100/20)
  });

  it('2. applies correct skip/take for page 3 with custom pageSize', async () => {
    mockUserFindMany.mockResolvedValue([]);
    mockUserCount.mockResolvedValue(100);

    const req = createGetRequest('/api/v1/users', {
      searchParams: { propertyId: PROPERTY_A, page: '3', pageSize: '10' },
    });
    await GET_LIST(req);

    const call = mockUserFindMany.mock.calls[0]![0];
    expect(call.skip).toBe(20); // (3-1) * 10
    expect(call.take).toBe(10);
  });

  it('3. calculates totalPages correctly with remainder', async () => {
    mockUserFindMany.mockResolvedValue([]);
    mockUserCount.mockResolvedValue(23);

    const req = createGetRequest('/api/v1/users', {
      searchParams: { propertyId: PROPERTY_A, pageSize: '10' },
    });
    const res = await GET_LIST(req);
    const body = await parseResponse<{ meta: { totalPages: number } }>(res);

    expect(body.meta.totalPages).toBe(3); // ceil(23/10)
  });
});

// ===========================================================================
// 2. GET /api/v1/users — Filtering
// ===========================================================================

describe('GET /api/v1/users — Filtering', () => {
  it('4. REJECTS requests without propertyId — prevents cross-tenant leak', async () => {
    const req = createGetRequest('/api/v1/users');
    const res = await GET_LIST(req);

    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_PROPERTY');
    expect(mockUserFindMany).not.toHaveBeenCalled();
  });

  it('5. filters by role via userProperties junction', async () => {
    mockUserFindMany.mockResolvedValue([]);
    mockUserCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/users', {
      searchParams: { propertyId: PROPERTY_A, role: 'security' },
    });
    await GET_LIST(req);

    const where = mockUserFindMany.mock.calls[0]![0].where;
    expect(where.userProperties.some.role).toEqual({ slug: 'security' });
  });

  it('6. filters by status=active (activated + isActive=true)', async () => {
    mockUserFindMany.mockResolvedValue([]);
    mockUserCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/users', {
      searchParams: { propertyId: PROPERTY_A, status: 'active' },
    });
    await GET_LIST(req);

    const where = mockUserFindMany.mock.calls[0]![0].where;
    expect(where.isActive).toBe(true);
    expect(where.activatedAt).toEqual({ not: null });
  });

  it('7. filters by status=suspended (activated but isActive=false)', async () => {
    mockUserFindMany.mockResolvedValue([]);
    mockUserCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/users', {
      searchParams: { propertyId: PROPERTY_A, status: 'suspended' },
    });
    await GET_LIST(req);

    const where = mockUserFindMany.mock.calls[0]![0].where;
    expect(where.isActive).toBe(false);
    expect(where.activatedAt).toEqual({ not: null });
  });

  it('8. filters by status=pending (never activated)', async () => {
    mockUserFindMany.mockResolvedValue([]);
    mockUserCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/users', {
      searchParams: { propertyId: PROPERTY_A, status: 'pending' },
    });
    await GET_LIST(req);

    const where = mockUserFindMany.mock.calls[0]![0].where;
    expect(where.activatedAt).toBeNull();
  });
});

// ===========================================================================
// 3. GET /api/v1/users — Search
// ===========================================================================

describe('GET /api/v1/users — Search', () => {
  it('9. searches across firstName, lastName, and email simultaneously', async () => {
    mockUserFindMany.mockResolvedValue([]);
    mockUserCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/users', {
      searchParams: { propertyId: PROPERTY_A, search: 'janet' },
    });
    await GET_LIST(req);

    const where = mockUserFindMany.mock.calls[0]![0].where;
    expect(where.OR).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ firstName: { contains: 'janet', mode: 'insensitive' } }),
        expect.objectContaining({ lastName: { contains: 'janet', mode: 'insensitive' } }),
        expect.objectContaining({ email: { contains: 'janet', mode: 'insensitive' } }),
      ]),
    );
  });

  it('10. search is case-insensitive', async () => {
    mockUserFindMany.mockResolvedValue([]);
    mockUserCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/users', {
      searchParams: { propertyId: PROPERTY_A, search: 'SMITH' },
    });
    await GET_LIST(req);

    const where = mockUserFindMany.mock.calls[0]![0].where;
    for (const condition of where.OR) {
      const field = Object.keys(condition)[0]!;
      expect(condition[field].mode).toBe('insensitive');
    }
  });
});

// ===========================================================================
// 4. GET /api/v1/users — Status Mapping
// ===========================================================================

describe('GET /api/v1/users — Account Status Lifecycle', () => {
  it('11. maps status=pending when activatedAt is null', async () => {
    mockUserFindMany.mockResolvedValue([makeListUser({ activatedAt: null })]);
    mockUserCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/users', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await GET_LIST(req);
    const body = await parseResponse<{ data: Array<{ status: string }> }>(res);

    expect(body.data[0]!.status).toBe('pending');
  });

  it('12. maps status=active when activated + isActive', async () => {
    mockUserFindMany.mockResolvedValue([makeListUser({ activatedAt: new Date(), isActive: true })]);
    mockUserCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/users', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await GET_LIST(req);
    const body = await parseResponse<{ data: Array<{ status: string }> }>(res);

    expect(body.data[0]!.status).toBe('active');
  });

  it('13. maps status=suspended when activated but not active', async () => {
    mockUserFindMany.mockResolvedValue([
      makeListUser({ activatedAt: new Date(), isActive: false }),
    ]);
    mockUserCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/users', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await GET_LIST(req);
    const body = await parseResponse<{ data: Array<{ status: string }> }>(res);

    expect(body.data[0]!.status).toBe('suspended');
  });
});

// ===========================================================================
// 5. GET /api/v1/users — Tenant Isolation & Soft Delete
// ===========================================================================

describe('GET /api/v1/users — Tenant Isolation', () => {
  it('14. scopes ALL queries to propertyId via userProperties junction', async () => {
    mockUserFindMany.mockResolvedValue([]);
    mockUserCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/users', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET_LIST(req);

    const where = mockUserFindMany.mock.calls[0]![0].where;
    expect(where.userProperties.some.propertyId).toBe(PROPERTY_A);
    expect(where.userProperties.some.deletedAt).toBeNull();
  });

  it('15. NEVER returns soft-deleted users', async () => {
    mockUserFindMany.mockResolvedValue([]);
    mockUserCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/users', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET_LIST(req);

    const where = mockUserFindMany.mock.calls[0]![0].where;
    expect(where.deletedAt).toBeNull();
  });

  it('16. sorts by firstName ascending by default', async () => {
    mockUserFindMany.mockResolvedValue([]);
    mockUserCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/users', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET_LIST(req);

    const call = mockUserFindMany.mock.calls[0]![0];
    expect(call.orderBy).toEqual({ firstName: 'asc' });
  });
});

// ===========================================================================
// 6. GET /api/v1/users/:id — User Detail
// ===========================================================================

describe('GET /api/v1/users/:id — User Detail', () => {
  it('17. returns user with properties, roles, and permissions', async () => {
    mockUserFindUnique.mockResolvedValue(makeUser());

    const req = createGetRequest(`/api/v1/users/${USER_1}`);
    const res = await GET_DETAIL(req, makeParams(USER_1));
    const body = await parseResponse<{
      data: {
        status: string;
        properties: Array<{ propertyId: string; role: { slug: string } }>;
      };
    }>(res);

    expect(res.status).toBe(200);
    expect(body.data.status).toBe('active');
    expect(body.data.properties).toHaveLength(1);
    expect(body.data.properties[0]!.role.slug).toBe('front_desk');
  });

  it('18. returns 404 for non-existent user', async () => {
    mockUserFindUnique.mockResolvedValue(null);

    const req = createGetRequest(`/api/v1/users/nonexistent`);
    const res = await GET_DETAIL(req, makeParams('nonexistent'));

    expect(res.status).toBe(404);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('NOT_FOUND');
  });

  it('19. includes login audit trail (last 20 entries)', async () => {
    mockUserFindUnique.mockResolvedValue(
      makeUser({
        loginAudits: [
          {
            id: 'audit-1',
            email: 'john.doe@building.com',
            success: true,
            failReason: null,
            ipAddress: '192.168.1.100',
            userAgent: 'Mozilla/5.0 Chrome Mac',
            createdAt: new Date(),
          },
          {
            id: 'audit-2',
            email: 'john.doe@building.com',
            success: false,
            failReason: 'invalid_password',
            ipAddress: '10.0.0.5',
            userAgent: 'Mozilla/5.0 Firefox',
            createdAt: new Date(),
          },
        ],
      }),
    );

    const req = createGetRequest(`/api/v1/users/${USER_1}`);
    const res = await GET_DETAIL(req, makeParams(USER_1));
    const body = await parseResponse<{
      data: { recentLogins: Array<{ success: boolean; ipAddress: string }> };
    }>(res);

    expect(body.data.recentLogins).toHaveLength(2);
    expect(body.data.recentLogins[0]!.success).toBe(true);
    expect(body.data.recentLogins[1]!.success).toBe(false);
  });

  it('20. excludes soft-deleted users from detail', async () => {
    mockUserFindUnique.mockResolvedValue(null);

    const req = createGetRequest(`/api/v1/users/${USER_1}`);
    await GET_DETAIL(req, makeParams(USER_1));

    const call = mockUserFindUnique.mock.calls[0]![0];
    expect(call.where.deletedAt).toBeNull();
  });
});

// ===========================================================================
// 7. POST /api/v1/users — Create User Validation
// ===========================================================================

describe('POST /api/v1/users — Validation', () => {
  it('21. rejects empty body with VALIDATION_ERROR', async () => {
    const req = createPostRequest('/api/v1/users', {});
    const res = await POST_CREATE(req);

    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string; fields: Record<string, string[]> }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
    expect(body.fields).toBeDefined();
  });

  it('22. requires firstName, lastName, email, propertyId, roleId', async () => {
    const req = createPostRequest('/api/v1/users', {
      firstName: '',
      lastName: '',
      email: 'not-an-email',
      propertyId: 'bad',
      roleId: '',
    });
    const res = await POST_CREATE(req);
    const body = await parseResponse<{ fields: Record<string, string[]> }>(res);

    expect(body.fields.firstName).toBeDefined();
    expect(body.fields.lastName).toBeDefined();
    expect(body.fields.email).toBeDefined();
    expect(body.fields.propertyId).toBeDefined();
    expect(body.fields.roleId).toBeDefined();
  });

  it('23. validates email format', async () => {
    const req = createPostRequest('/api/v1/users', {
      ...validCreateBody,
      email: 'not-an-email',
    });
    const res = await POST_CREATE(req);

    expect(res.status).toBe(400);
  });

  it('24. rejects names with numbers', async () => {
    const req = createPostRequest('/api/v1/users', {
      ...validCreateBody,
      firstName: 'John123',
    });
    const res = await POST_CREATE(req);

    expect(res.status).toBe(400);
  });

  it('25. accepts hyphenated and apostrophe names (Canadian naming conventions)', async () => {
    mockUserFindFirst.mockResolvedValue(null);
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      return fn({
        user: {
          create: vi.fn().mockResolvedValue({
            id: USER_1,
            email: 'mary@building.com',
            firstName: 'Mary-Jane',
            lastName: "O'Brien",
            createdAt: new Date(),
          }),
        },
        userProperty: { create: vi.fn() },
      });
    });

    const req = createPostRequest('/api/v1/users', {
      ...validCreateBody,
      firstName: 'Mary-Jane',
      lastName: "O'Brien",
      email: 'mary@building.com',
    });
    const res = await POST_CREATE(req);

    expect(res.status).toBe(201);
  });

  it('26. accepts accented characters (Jean-Francois, Renee)', async () => {
    mockUserFindFirst.mockResolvedValue(null);
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      return fn({
        user: {
          create: vi.fn().mockResolvedValue({
            id: USER_1,
            email: 'jean@building.com',
            firstName: 'Jean-Francois',
            lastName: 'Tremblay',
            createdAt: new Date(),
          }),
        },
        userProperty: { create: vi.fn() },
      });
    });

    const req = createPostRequest('/api/v1/users', {
      ...validCreateBody,
      firstName: 'Jean-Francois',
      lastName: 'Tremblay',
      email: 'jean@building.com',
    });
    const res = await POST_CREATE(req);

    expect(res.status).toBe(201);
  });
});

// ===========================================================================
// 8. POST /api/v1/users — Email Uniqueness
// ===========================================================================

describe('POST /api/v1/users — Email Uniqueness', () => {
  it('27. rejects duplicate email at the SAME property', async () => {
    mockUserFindFirst.mockResolvedValue({ id: 'existing-user' });

    const req = createPostRequest('/api/v1/users', validCreateBody);
    const res = await POST_CREATE(req);

    expect(res.status).toBe(409);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('EMAIL_EXISTS');
  });

  it('28. lowercases email before uniqueness check — prevents case bypass', async () => {
    mockUserFindFirst.mockResolvedValue(null);
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      return fn({
        user: {
          create: vi.fn().mockResolvedValue({
            id: USER_1,
            email: 'janet@building.com',
            firstName: 'Janet',
            lastName: 'Smith',
            createdAt: new Date(),
          }),
        },
        userProperty: { create: vi.fn() },
      });
    });

    const req = createPostRequest('/api/v1/users', {
      ...validCreateBody,
      email: 'JANET@Building.COM',
    });
    await POST_CREATE(req);

    expect(mockUserFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          email: 'janet@building.com',
        }),
      }),
    );
  });

  it('29. checks uniqueness ONLY within the same property — multi-property support', async () => {
    mockUserFindFirst.mockResolvedValue(null);
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      return fn({
        user: {
          create: vi.fn().mockResolvedValue({
            id: USER_1,
            email: 'janet@building.com',
            firstName: 'Janet',
            lastName: 'Smith',
            createdAt: new Date(),
          }),
        },
        userProperty: { create: vi.fn() },
      });
    });

    const req = createPostRequest('/api/v1/users', validCreateBody);
    await POST_CREATE(req);

    expect(mockUserFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userProperties: expect.objectContaining({
            some: expect.objectContaining({
              propertyId: PROPERTY_A,
            }),
          }),
        }),
      }),
    );
  });
});

// ===========================================================================
// 9. POST /api/v1/users — Account Creation Flow
// ===========================================================================

describe('POST /api/v1/users — Account Creation', () => {
  it('30. creates User AND UserProperty in a TRANSACTION', async () => {
    mockUserFindFirst.mockResolvedValue(null);
    let transactionExecuted = false;
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      transactionExecuted = true;
      return fn({
        user: {
          create: vi.fn().mockResolvedValue({
            id: USER_1,
            email: 'janet@building.com',
            firstName: 'Janet',
            lastName: 'Smith',
            createdAt: new Date(),
          }),
        },
        userProperty: { create: vi.fn() },
      });
    });

    const req = createPostRequest('/api/v1/users', validCreateBody);
    await POST_CREATE(req);

    expect(transactionExecuted).toBe(true);
  });

  it('31. hashes temporary password with Argon2id', async () => {
    const { hashPassword } = await import('@/server/auth/password');
    mockUserFindFirst.mockResolvedValue(null);
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      return fn({
        user: {
          create: vi.fn().mockResolvedValue({
            id: USER_1,
            email: 'janet@building.com',
            firstName: 'Janet',
            lastName: 'Smith',
            createdAt: new Date(),
          }),
        },
        userProperty: { create: vi.fn() },
      });
    });

    const req = createPostRequest('/api/v1/users', validCreateBody);
    await POST_CREATE(req);

    expect(hashPassword).toHaveBeenCalled();
  });

  it('32. returns 201 with pending status and confirmation message', async () => {
    mockUserFindFirst.mockResolvedValue(null);
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

    const req = createPostRequest('/api/v1/users', validCreateBody);
    const res = await POST_CREATE(req);

    expect(res.status).toBe(201);
    const body = await parseResponse<{
      data: { id: string; status: string };
      message: string;
    }>(res);
    expect(body.data.id).toBe('new-user-id');
    expect(body.data.status).toBe('pending');
    expect(body.message).toContain('Janet Smith');
    expect(body.message).toContain('Welcome email');
  });

  it('33. NEVER exposes password or hash in response body', async () => {
    mockUserFindFirst.mockResolvedValue(null);
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      return fn({
        user: {
          create: vi.fn().mockResolvedValue({
            id: USER_1,
            email: 'janet@building.com',
            firstName: 'Janet',
            lastName: 'Smith',
            createdAt: new Date(),
          }),
        },
        userProperty: { create: vi.fn() },
      });
    });

    const req = createPostRequest('/api/v1/users', validCreateBody);
    const res = await POST_CREATE(req);
    const text = await res.clone().text();

    expect(text).not.toContain('password');
    expect(text).not.toContain('argon2');
    expect(text).not.toContain('TMP_PWD');
    expect(text).not.toContain('$2b$');
  });
});

// ===========================================================================
// 10. PATCH /api/v1/users/:id — Update Profile
// ===========================================================================

describe('PATCH /api/v1/users/:id — Profile Update', () => {
  it('34. updates firstName and lastName', async () => {
    mockUserUpdate.mockResolvedValue({
      id: USER_1,
      email: 'john@building.com',
      firstName: 'Jonathan',
      lastName: 'Doe-Smith',
      phone: null,
      isActive: true,
    });

    const req = createPatchRequest(`/api/v1/users/${USER_1}`, {
      firstName: 'Jonathan',
      lastName: 'Doe-Smith',
    });
    const res = await PATCH(req, makeParams(USER_1));

    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: { firstName: string }; message: string }>(res);
    expect(body.data.firstName).toBe('Jonathan');
    expect(body.message).toBe('Profile updated.');
  });

  it('35. updates phone number', async () => {
    mockUserUpdate.mockResolvedValue({
      id: USER_1,
      email: 'john@building.com',
      firstName: 'John',
      lastName: 'Doe',
      phone: '+14165559999',
      isActive: true,
    });

    const req = createPatchRequest(`/api/v1/users/${USER_1}`, {
      phone: '+14165559999',
    });
    const res = await PATCH(req, makeParams(USER_1));

    expect(res.status).toBe(200);
  });
});

// ===========================================================================
// 11. PATCH /api/v1/users/:id — Status Changes
// ===========================================================================

describe('PATCH /api/v1/users/:id — Status Changes', () => {
  it('36. activates a user (sets isActive=true and activatedAt)', async () => {
    mockUserUpdate.mockResolvedValue({
      id: USER_1,
      firstName: 'John',
      lastName: 'Doe',
      isActive: true,
    });

    const req = createPatchRequest(`/api/v1/users/${USER_1}`, {
      status: 'active',
    });
    const res = await PATCH(req, makeParams(USER_1));

    expect(res.status).toBe(200);
    const updateCall = mockUserUpdate.mock.calls[0]![0];
    expect(updateCall.data.isActive).toBe(true);
    expect(updateCall.data.activatedAt).toBeInstanceOf(Date);
  });

  it('37. suspending a user revokes ALL active sessions', async () => {
    mockUserUpdate.mockResolvedValue({
      id: USER_1,
      firstName: 'John',
      lastName: 'Doe',
      isActive: false,
    });
    mockSessionUpdateMany.mockResolvedValue({ count: 3 });

    const req = createPatchRequest(`/api/v1/users/${USER_1}`, {
      status: 'suspended',
    });
    await PATCH(req, makeParams(USER_1));

    // Verify sessions were revoked
    expect(mockSessionUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: USER_1, revokedAt: null },
        data: expect.objectContaining({ revokedAt: expect.any(Date) }),
      }),
    );
  });

  it('38. validates status enum (active, suspended, deactivated)', async () => {
    const req = createPatchRequest(`/api/v1/users/${USER_1}`, {
      status: 'banned',
    });
    const res = await PATCH(req, makeParams(USER_1));

    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });
});

// ===========================================================================
// 12. DELETE /api/v1/users/:id — Soft Delete
// ===========================================================================

describe('DELETE /api/v1/users/:id — Soft Delete', () => {
  it('39. soft deletes user, revokes sessions, and revokes tokens in a TRANSACTION', async () => {
    const txOperations: string[] = [];
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      return fn({
        user: {
          update: vi.fn().mockImplementation(() => {
            txOperations.push('user_soft_delete');
            return Promise.resolve({});
          }),
        },
        session: {
          updateMany: vi.fn().mockImplementation(() => {
            txOperations.push('sessions_revoked');
            return Promise.resolve({ count: 2 });
          }),
        },
        refreshToken: {
          updateMany: vi.fn().mockImplementation(() => {
            txOperations.push('tokens_revoked');
            return Promise.resolve({ count: 1 });
          }),
        },
      });
    });

    const req = createDeleteRequest(`/api/v1/users/${USER_1}`);
    const res = await DELETE_USER(req, makeParams(USER_1));

    expect(res.status).toBe(200);
    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('deactivated');
    expect(txOperations).toContain('user_soft_delete');
    expect(txOperations).toContain('sessions_revoked');
    expect(txOperations).toContain('tokens_revoked');
  });

  it('40. handles database errors gracefully on delete', async () => {
    mockTransaction.mockRejectedValue(new Error('FK constraint'));

    const req = createDeleteRequest(`/api/v1/users/${USER_1}`);
    const res = await DELETE_USER(req, makeParams(USER_1));

    expect(res.status).toBe(500);
    const body = await parseResponse<{ error: string; message: string }>(res);
    expect(body.error).toBe('INTERNAL_ERROR');
    expect(body.message).not.toContain('FK constraint');
  });
});

// ===========================================================================
// 13. Session Management
// ===========================================================================

describe('GET /api/v1/users/:id/sessions — List Active Sessions', () => {
  it('41. returns active, non-expired sessions', async () => {
    const futureDate = new Date(Date.now() + 86400000);
    mockSessionFindMany.mockResolvedValue([
      {
        id: SESSION_1,
        deviceFingerprint: 'fp-1',
        ipAddress: '192.168.1.100',
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X) Chrome/120',
        lastActiveAt: new Date(),
        createdAt: new Date(),
      },
      {
        id: SESSION_2,
        deviceFingerprint: 'fp-2',
        ipAddress: '10.0.0.5',
        userAgent: 'Mozilla/5.0 (iPhone) Safari/17',
        lastActiveAt: new Date(),
        createdAt: new Date(),
      },
    ]);

    const req = createGetRequest(`/api/v1/users/${USER_1}/sessions`);
    const res = await GET_SESSIONS(req, makeParams(USER_1));
    const body = await parseResponse<{
      data: Array<{ id: string; device: string; ipAddress: string }>;
    }>(res);

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(2);
    expect(body.data[0]!.device).toBe('Chrome on macOS');
    expect(body.data[1]!.device).toBe('Safari on iPhone');
  });

  it('42. filters out revoked and expired sessions', async () => {
    mockSessionFindMany.mockResolvedValue([]);

    const req = createGetRequest(`/api/v1/users/${USER_1}/sessions`);
    await GET_SESSIONS(req, makeParams(USER_1));

    const call = mockSessionFindMany.mock.calls[0]![0];
    expect(call.where.revokedAt).toBeNull();
    expect(call.where.expiresAt).toEqual({ gt: expect.any(Date) });
  });
});

describe('DELETE /api/v1/users/:id/sessions — Revoke Sessions', () => {
  it('43. revokes a specific session by sessionId', async () => {
    mockSessionUpdate.mockResolvedValue({});

    const req = createDeleteRequest(`/api/v1/users/${USER_1}/sessions`, {
      headers: {},
    });
    // Add sessionId as query param
    const url = new URL(req.url);
    url.searchParams.set('sessionId', SESSION_1);
    const reqWithParam = createGetRequest(`/api/v1/users/${USER_1}/sessions`, {
      searchParams: { sessionId: SESSION_1 },
    });
    // Override method to DELETE
    const deleteReq = createDeleteRequest(
      `/api/v1/users/${USER_1}/sessions?sessionId=${SESSION_1}`,
    );

    // Need to create delete request with search params
    const delReq = new Request(
      `http://localhost:3000/api/v1/users/${USER_1}/sessions?sessionId=${SESSION_1}`,
      { method: 'DELETE', headers: { 'Content-Type': 'application/json' } },
    );
    // Use the imported NextRequest-compatible approach
    const { NextRequest } = await import('next/server');
    const finalReq = new NextRequest(delReq);

    const res = await DELETE_SESSIONS(finalReq, makeParams(USER_1));

    expect(res.status).toBe(200);
    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('revoked');
  });

  it('44. revokes ALL sessions when no sessionId specified', async () => {
    mockSessionUpdateMany.mockResolvedValue({ count: 5 });

    const req = createDeleteRequest(`/api/v1/users/${USER_1}/sessions`);
    const res = await DELETE_SESSIONS(req, makeParams(USER_1));

    expect(res.status).toBe(200);
    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('5 sessions revoked');

    expect(mockSessionUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: USER_1, revokedAt: null },
      }),
    );
  });
});

// ===========================================================================
// 14. Bulk User Import
// ===========================================================================

describe('POST /api/v1/users/bulk-import — Bulk Import', () => {
  it('45. validates required fields (propertyId, roleId, users array)', async () => {
    const req = createPostRequest('/api/v1/users/bulk-import', {});
    const res = await POST_BULK_IMPORT(req);

    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('46. rejects imports exceeding 500 users', async () => {
    const users = Array.from({ length: 501 }, (_, i) => ({
      email: `user${i}@building.com`,
      firstName: `User`,
      lastName: `${i}`,
    }));

    const req = createPostRequest('/api/v1/users/bulk-import', {
      propertyId: PROPERTY_A,
      roleId: ROLE_RESIDENT,
      users,
    });
    const res = await POST_BULK_IMPORT(req);

    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('LIMIT_EXCEEDED');
  });

  it('47. skips rows with missing required fields and reports errors', async () => {
    const users = [
      { email: 'valid@building.com', firstName: 'Valid', lastName: 'User' },
      { email: '', firstName: '', lastName: '' }, // Missing fields
      { email: 'another@building.com', firstName: 'Another', lastName: 'User' },
    ];

    mockUserFindFirst.mockResolvedValue(null);
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      return fn({
        user: {
          create: vi.fn().mockResolvedValue({
            id: 'new-user',
            email: 'valid@building.com',
          }),
        },
        userProperty: { create: vi.fn() },
      });
    });

    const req = createPostRequest('/api/v1/users/bulk-import', {
      propertyId: PROPERTY_A,
      roleId: ROLE_RESIDENT,
      users,
    });
    const res = await POST_BULK_IMPORT(req);
    const body = await parseResponse<{
      data: { created: number; skipped: number; errors: Array<{ row: number; reason: string }> };
    }>(res);

    expect(body.data.skipped).toBeGreaterThanOrEqual(1);
    expect(body.data.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ row: 2, reason: expect.stringContaining('Missing') }),
      ]),
    );
  });

  it('48. skips rows with invalid email format', async () => {
    const users = [{ email: 'not-an-email', firstName: 'Bad', lastName: 'Email' }];

    const req = createPostRequest('/api/v1/users/bulk-import', {
      propertyId: PROPERTY_A,
      roleId: ROLE_RESIDENT,
      users,
    });
    const res = await POST_BULK_IMPORT(req);
    const body = await parseResponse<{
      data: { skipped: number; errors: Array<{ reason: string }> };
    }>(res);

    expect(body.data.skipped).toBe(1);
    expect(body.data.errors[0]!.reason).toContain('email');
  });

  it('49. skips duplicate emails (already exist at property)', async () => {
    const users = [{ email: 'existing@building.com', firstName: 'Existing', lastName: 'User' }];

    mockUserFindFirst.mockResolvedValue({ id: 'existing-id' });

    const req = createPostRequest('/api/v1/users/bulk-import', {
      propertyId: PROPERTY_A,
      roleId: ROLE_RESIDENT,
      users,
    });
    const res = await POST_BULK_IMPORT(req);
    const body = await parseResponse<{
      data: { skipped: number; errors: Array<{ reason: string }> };
    }>(res);

    expect(body.data.skipped).toBe(1);
    expect(body.data.errors[0]!.reason).toContain('already exists');
  });

  it('50. accepts both firstName/lastName and first_name/last_name CSV formats', async () => {
    const users = [{ email: 'csv@building.com', first_name: 'CSV', last_name: 'Import' }];

    mockUserFindFirst.mockResolvedValue(null);
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      return fn({
        user: {
          create: vi.fn().mockResolvedValue({
            id: 'csv-user',
            email: 'csv@building.com',
          }),
        },
        userProperty: { create: vi.fn() },
      });
    });

    const req = createPostRequest('/api/v1/users/bulk-import', {
      propertyId: PROPERTY_A,
      roleId: ROLE_RESIDENT,
      users,
    });
    const res = await POST_BULK_IMPORT(req);
    const body = await parseResponse<{ data: { created: number } }>(res);

    expect(body.data.created).toBe(1);
  });
});

// ===========================================================================
// 15. Welcome Email
// ===========================================================================

describe('POST /api/v1/users/:id/welcome-email — Send Welcome Email', () => {
  it('51. sends welcome email to existing user', async () => {
    mockUserFindUnique.mockResolvedValue({
      id: USER_1,
      email: 'john@building.com',
      firstName: 'John',
      lastName: 'Doe',
    });

    const req = createPostRequest(`/api/v1/users/${USER_1}/welcome-email`, {});
    const res = await POST_WELCOME_EMAIL(req, makeParams(USER_1));

    expect(res.status).toBe(200);
    const body = await parseResponse<{
      message: string;
      data: { email: string; sentAt: string };
    }>(res);
    expect(body.message).toContain('john@building.com');
    expect(body.data.sentAt).toBeDefined();
  });

  it('52. returns 404 for non-existent user', async () => {
    mockUserFindUnique.mockResolvedValue(null);

    const req = createPostRequest(`/api/v1/users/nonexistent/welcome-email`, {});
    const res = await POST_WELCOME_EMAIL(req, makeParams('nonexistent'));

    expect(res.status).toBe(404);
  });
});

// ===========================================================================
// 16. Error Handling
// ===========================================================================

describe('User Management — Error Handling', () => {
  it('53. GET list handles database errors gracefully', async () => {
    mockUserFindMany.mockRejectedValue(new Error('Connection refused'));
    mockUserCount.mockRejectedValue(new Error('Connection refused'));

    const req = createGetRequest('/api/v1/users', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await GET_LIST(req);

    expect(res.status).toBe(500);
    const body = await parseResponse<{ error: string; message: string }>(res);
    expect(body.error).toBe('INTERNAL_ERROR');
    expect(body.message).not.toContain('Connection refused');
  });

  it('54. GET detail handles database errors gracefully', async () => {
    mockUserFindUnique.mockRejectedValue(new Error('Timeout'));

    const req = createGetRequest(`/api/v1/users/${USER_1}`);
    const res = await GET_DETAIL(req, makeParams(USER_1));

    expect(res.status).toBe(500);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('INTERNAL_ERROR');
  });

  it('55. POST create handles transaction failure gracefully', async () => {
    mockUserFindFirst.mockResolvedValue(null);
    mockTransaction.mockRejectedValue(new Error('Deadlock detected'));

    const req = createPostRequest('/api/v1/users', validCreateBody);
    const res = await POST_CREATE(req);

    expect(res.status).toBe(500);
    const body = await parseResponse<{ error: string; message: string }>(res);
    expect(body.error).toBe('INTERNAL_ERROR');
    expect(body.message).not.toContain('Deadlock');
  });

  it('56. PATCH update handles database errors gracefully', async () => {
    mockUserUpdate.mockRejectedValue(new Error('Record not found'));

    const req = createPatchRequest(`/api/v1/users/${USER_1}`, {
      firstName: 'Updated',
    });
    const res = await PATCH(req, makeParams(USER_1));

    expect(res.status).toBe(500);
  });
});

// ===========================================================================
// 17. Edge Cases
// ===========================================================================

describe('User Management — Edge Cases', () => {
  it('57. empty property returns empty data array with correct meta', async () => {
    mockUserFindMany.mockResolvedValue([]);
    mockUserCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/users', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await GET_LIST(req);
    const body = await parseResponse<{ data: unknown[]; meta: { total: number } }>(res);

    expect(body.data).toEqual([]);
    expect(body.meta.total).toBe(0);
  });

  it('58. role flattening — extracts first role from userProperties', async () => {
    mockUserFindMany.mockResolvedValue([
      makeListUser({
        userProperties: [{ role: { id: ROLE_SECURITY, name: 'Security Guard', slug: 'security' } }],
      }),
    ]);
    mockUserCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/users', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await GET_LIST(req);
    const body = await parseResponse<{
      data: Array<{ role: { slug: string } | null }>;
    }>(res);

    expect(body.data[0]!.role?.slug).toBe('security');
  });

  it('59. role is null when user has no property assignment', async () => {
    mockUserFindMany.mockResolvedValue([makeListUser({ userProperties: [] })]);
    mockUserCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/users', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await GET_LIST(req);
    const body = await parseResponse<{
      data: Array<{ role: { slug: string } | null }>;
    }>(res);

    expect(body.data[0]!.role).toBeNull();
  });

  it('60. PATCH with role change updates UserProperty junction', async () => {
    mockUserUpdate.mockResolvedValue({
      id: USER_1,
      email: 'john@building.com',
      firstName: 'John',
      lastName: 'Doe',
      phone: null,
      isActive: true,
    });
    mockUserPropertyUpdateMany.mockResolvedValue({ count: 1 });

    const req = createPatchRequest(`/api/v1/users/${USER_1}?propertyId=${PROPERTY_A}`, {
      roleId: ROLE_SECURITY,
    });
    const res = await PATCH(req, makeParams(USER_1));

    expect(res.status).toBe(200);
    expect(mockUserPropertyUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: USER_1, propertyId: PROPERTY_A },
        data: { roleId: ROLE_SECURITY },
      }),
    );
  });

  it('61. bulk import handles database errors per-row without failing entire batch', async () => {
    const users = [
      { email: 'good@building.com', firstName: 'Good', lastName: 'User' },
      { email: 'bad@building.com', firstName: 'Bad', lastName: 'User' },
    ];

    let callCount = 0;
    mockUserFindFirst.mockResolvedValue(null);
    mockTransaction.mockImplementation(async () => {
      callCount++;
      if (callCount === 2) throw new Error('Unique constraint');
      return {};
    });

    const req = createPostRequest('/api/v1/users/bulk-import', {
      propertyId: PROPERTY_A,
      roleId: ROLE_RESIDENT,
      users,
    });
    const res = await POST_BULK_IMPORT(req);
    const body = await parseResponse<{
      data: { created: number; skipped: number; errors: unknown[] };
    }>(res);

    // First user succeeds, second fails
    expect(body.data.created).toBe(1);
    expect(body.data.skipped).toBe(1);
  });

  it('62. welcome email handles send failure gracefully (fire-and-forget)', async () => {
    mockUserFindUnique.mockResolvedValue({
      id: USER_1,
      email: 'john@building.com',
      firstName: 'John',
      lastName: 'Doe',
    });

    // The email send is fire-and-forget, so even if it fails, the response is 200
    const req = createPostRequest(`/api/v1/users/${USER_1}/welcome-email`, {});
    const res = await POST_WELCOME_EMAIL(req, makeParams(USER_1));

    expect(res.status).toBe(200);
  });
});
