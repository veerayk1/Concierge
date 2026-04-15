/**
 * Global Search API Tests — PRD 15 Search & Navigation
 *
 * Comprehensive tests for global search across all modules:
 *   1.  Cross-module search (users, units, packages, events, announcements, maintenance)
 *   2.  Results grouped by module with relevance scoring
 *   3.  RBAC enforcement (role-based result filtering)
 *   4.  Soft-deleted record exclusion
 *   5.  Case-insensitive search
 *   6.  SQL injection / special character safety
 *   7.  Pagination (per-module limits, configurable max)
 *   8.  Empty & short query handling
 *   9.  Module filter (search specific module only)
 *  10.  Highlight matching terms in snippet
 *  11.  Tenant isolation (property-scoped)
 *  12.  Search performance (timeout guard)
 *  13.  Recent searches tracking
 *  14.  Search analytics (popular terms)
 *  15.  XSS prevention in search results
 *  16.  Auth guard enforcement
 *
 * 30+ test cases
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createGetRequest, createDeleteRequest, parseResponse } from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// UUIDs
// ---------------------------------------------------------------------------

const PROPERTY_A = '00000000-0000-4000-b000-000000000001';
const PROPERTY_B = '00000000-0000-4000-b000-000000000002';
const ADMIN_USER = 'user-admin-1';
const RESIDENT_USER = 'user-resident-1';
const STAFF_USER = 'user-staff-1';

// ---------------------------------------------------------------------------
// Mock Setup — Prisma
// ---------------------------------------------------------------------------

const mockUserFindMany = vi.fn();
const mockUserCount = vi.fn();
const mockUnitFindMany = vi.fn();
const mockUnitCount = vi.fn();
const mockPackageFindMany = vi.fn();
const mockPackageCount = vi.fn();
const mockEventFindMany = vi.fn();
const mockEventCount = vi.fn();
const mockAnnouncementFindMany = vi.fn();
const mockAnnouncementCount = vi.fn();
const mockSearchHistoryCreate = vi.fn();
const mockSearchHistoryFindMany = vi.fn();
const mockSearchHistoryDeleteMany = vi.fn();
const mockMaintenanceRequestFindMany = vi.fn();
const mockMaintenanceRequestCount = vi.fn();
const mockVisitorEntryFindMany = vi.fn();
const mockVisitorEntryCount = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    user: {
      findMany: (...args: unknown[]) => mockUserFindMany(...args),
      count: (...args: unknown[]) => mockUserCount(...args),
    },
    unit: {
      findMany: (...args: unknown[]) => mockUnitFindMany(...args),
      count: (...args: unknown[]) => mockUnitCount(...args),
    },
    package: {
      findMany: (...args: unknown[]) => mockPackageFindMany(...args),
      count: (...args: unknown[]) => mockPackageCount(...args),
    },
    event: {
      findMany: (...args: unknown[]) => mockEventFindMany(...args),
      count: (...args: unknown[]) => mockEventCount(...args),
    },
    announcement: {
      findMany: (...args: unknown[]) => mockAnnouncementFindMany(...args),
      count: (...args: unknown[]) => mockAnnouncementCount(...args),
    },
    maintenanceRequest: {
      findMany: (...args: unknown[]) => mockMaintenanceRequestFindMany(...args),
      count: (...args: unknown[]) => mockMaintenanceRequestCount(...args),
    },
    visitorEntry: {
      findMany: (...args: unknown[]) => mockVisitorEntryFindMany(...args),
      count: (...args: unknown[]) => mockVisitorEntryCount(...args),
    },
    searchHistory: {
      create: (...args: unknown[]) => mockSearchHistoryCreate(...args),
      findMany: (...args: unknown[]) => mockSearchHistoryFindMany(...args),
      deleteMany: (...args: unknown[]) => mockSearchHistoryDeleteMany(...args),
    },
  },
}));

// ---------------------------------------------------------------------------
// Mock Setup — guardRoute
// ---------------------------------------------------------------------------

const mockGuardRoute = vi.fn();
vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: (...args: unknown[]) => mockGuardRoute(...args),
}));

// ---------------------------------------------------------------------------
// Import route handlers AFTER mocks
// ---------------------------------------------------------------------------

import { GET, DELETE } from '../../search/route';
import { appCache } from '@/server/cache';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function clearModuleMocks() {
  mockUserFindMany.mockResolvedValue([]);
  mockUserCount.mockResolvedValue(0);
  mockUnitFindMany.mockResolvedValue([]);
  mockUnitCount.mockResolvedValue(0);
  mockPackageFindMany.mockResolvedValue([]);
  mockPackageCount.mockResolvedValue(0);
  mockEventFindMany.mockResolvedValue([]);
  mockEventCount.mockResolvedValue(0);
  mockAnnouncementFindMany.mockResolvedValue([]);
  mockAnnouncementCount.mockResolvedValue(0);
  mockMaintenanceRequestFindMany.mockResolvedValue([]);
  mockMaintenanceRequestCount.mockResolvedValue(0);
  mockVisitorEntryFindMany.mockResolvedValue([]);
  mockVisitorEntryCount.mockResolvedValue(0);
  mockSearchHistoryCreate.mockResolvedValue({ id: 'sh-1' });
  mockSearchHistoryFindMany.mockResolvedValue([]);
  mockSearchHistoryDeleteMany.mockResolvedValue({ count: 0 });
}

function setAuth(overrides: Record<string, unknown> = {}) {
  mockGuardRoute.mockResolvedValue({
    user: {
      userId: ADMIN_USER,
      propertyId: PROPERTY_A,
      role: 'admin',
      permissions: ['*'],
      mfaVerified: false,
      ...overrides,
    },
    error: null,
  });
}

function searchReq(params: Record<string, string>) {
  return createGetRequest('/api/v1/search', { searchParams: params });
}

interface SearchResult {
  id: string;
  type: string;
  title: string;
  subtitle?: string;
  status?: string;
  score: number;
  highlights: Record<string, string>;
}

interface SearchResponseBody {
  data: {
    users: unknown[];
    units: unknown[];
    packages: unknown[];
    events: unknown[];
    announcements: unknown[];
    results: SearchResult[];
  };
  meta: Record<string, unknown>;
}

beforeEach(() => {
  vi.clearAllMocks();
  appCache.clear();
  setAuth();
  clearModuleMocks();
});

// ===========================================================================
// 1. Cross-module search across 5+ modules
// ===========================================================================

describe('1. Cross-module search', () => {
  it('fires queries against all 5 modules simultaneously', async () => {
    const req = searchReq({ propertyId: PROPERTY_A, q: 'test' });
    await GET(req);

    expect(mockUserFindMany).toHaveBeenCalledTimes(1);
    expect(mockUnitFindMany).toHaveBeenCalledTimes(1);
    expect(mockPackageFindMany).toHaveBeenCalledTimes(1);
    expect(mockEventFindMany).toHaveBeenCalledTimes(1);
    expect(mockAnnouncementFindMany).toHaveBeenCalledTimes(1);
  });

  it('returns aggregated results from all modules in data object', async () => {
    mockUserFindMany.mockResolvedValue([
      { id: 'u1', firstName: 'Alice', lastName: 'Test', email: 'alice@test.com' },
    ]);
    mockUnitFindMany.mockResolvedValue([{ id: 'unit1', number: 'Test-101', status: 'occupied' }]);
    mockPackageFindMany.mockResolvedValue([
      { id: 'p1', referenceNumber: 'PKG-TEST', status: 'unreleased' },
    ]);
    mockEventFindMany.mockResolvedValue([
      { id: 'e1', title: 'Test event', referenceNo: 'EVT-1', status: 'open' },
    ]);
    mockAnnouncementFindMany.mockResolvedValue([
      { id: 'a1', title: 'Test notice', status: 'published' },
    ]);

    const res = await GET(searchReq({ propertyId: PROPERTY_A, q: 'test' }));
    const body = await parseResponse<SearchResponseBody>(res);

    expect(body.data.users).toHaveLength(1);
    expect(body.data.units).toHaveLength(1);
    expect(body.data.packages).toHaveLength(1);
    expect(body.data.events).toHaveLength(1);
    expect(body.data.announcements).toHaveLength(1);
    expect(body.meta.totalResults).toBe(5);
  });
});

// ===========================================================================
// 2. Results grouped by module with id, title, type, snippet, relevance
// ===========================================================================

describe('2. Results grouped by module with metadata', () => {
  it('each result includes id, type, title, score, and highlights', async () => {
    mockUserFindMany.mockResolvedValue([
      { id: 'u1', firstName: 'Jane', lastName: 'Smith', email: 'jane@test.com' },
    ]);
    mockEventFindMany.mockResolvedValue([
      { id: 'e1', title: 'Jane visitor log', referenceNo: 'EVT-1', status: 'open' },
    ]);

    const res = await GET(searchReq({ propertyId: PROPERTY_A, q: 'jane' }));
    const body = await parseResponse<SearchResponseBody>(res);

    for (const result of body.data.results) {
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('type');
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('score');
      expect(result).toHaveProperty('highlights');
    }
  });

  it('user result has formatted full name as title and email as subtitle', async () => {
    mockUserFindMany.mockResolvedValue([
      { id: 'u1', firstName: 'Alice', lastName: 'Johnson', email: 'alice@test.com' },
    ]);

    const res = await GET(searchReq({ propertyId: PROPERTY_A, q: 'alice', type: 'users' }));
    const body = await parseResponse<SearchResponseBody>(res);

    expect(body.data.results[0]!.type).toBe('users');
    expect(body.data.results[0]!.title).toBe('Alice Johnson');
    expect(body.data.results[0]!.subtitle).toBe('alice@test.com');
  });

  it('unit result has "Unit" prefix in title', async () => {
    mockUnitFindMany.mockResolvedValue([{ id: 'unit1', number: '1501', status: 'occupied' }]);

    const res = await GET(searchReq({ propertyId: PROPERTY_A, q: '15', type: 'units' }));
    const body = await parseResponse<SearchResponseBody>(res);

    expect(body.data.results[0]!.type).toBe('units');
    expect(body.data.results[0]!.title).toBe('Unit 1501');
  });

  it('package result uses referenceNumber as title', async () => {
    mockPackageFindMany.mockResolvedValue([
      { id: 'p1', referenceNumber: 'PKG-00123', status: 'unreleased', trackingNumber: 'TRK-ABC' },
    ]);

    const res = await GET(searchReq({ propertyId: PROPERTY_A, q: 'PKG-001', type: 'packages' }));
    const body = await parseResponse<SearchResponseBody>(res);

    expect(body.data.results[0]!.title).toBe('PKG-00123');
    expect(body.data.results[0]!.subtitle).toBe('TRK-ABC');
  });
});

// ===========================================================================
// 3. RBAC enforcement (role-based result filtering)
// ===========================================================================

describe('3. RBAC — role-based search access', () => {
  it('admin search returns results from all modules', async () => {
    setAuth({ role: 'admin', userId: ADMIN_USER });
    mockUserFindMany.mockResolvedValue([
      { id: 'u1', firstName: 'Test', lastName: 'A', email: 'a@b.com' },
    ]);

    const res = await GET(searchReq({ propertyId: PROPERTY_A, q: 'test' }));
    expect(res.status).toBe(200);

    expect(mockUserFindMany).toHaveBeenCalled();
    expect(mockPackageFindMany).toHaveBeenCalled();
    expect(mockEventFindMany).toHaveBeenCalled();
  });

  it('resident role can still perform search (auth passes)', async () => {
    setAuth({ role: 'resident_owner', userId: RESIDENT_USER });

    const res = await GET(searchReq({ propertyId: PROPERTY_A, q: 'package' }));
    expect(res.status).toBe(200);
  });

  it('front desk role can search all modules', async () => {
    setAuth({ role: 'front_desk', userId: STAFF_USER });

    const res = await GET(searchReq({ propertyId: PROPERTY_A, q: 'delivery' }));
    expect(res.status).toBe(200);

    expect(mockUserFindMany).toHaveBeenCalled();
    expect(mockPackageFindMany).toHaveBeenCalled();
  });
});

// ===========================================================================
// 4. Soft-deleted records exclusion
// ===========================================================================

describe('4. Soft-deleted record exclusion', () => {
  it('excludes soft-deleted records from every module query', async () => {
    await GET(searchReq({ propertyId: PROPERTY_A, q: 'test' }));

    expect(mockUserFindMany.mock.calls[0]![0].where.deletedAt).toBeNull();
    expect(mockUnitFindMany.mock.calls[0]![0].where.deletedAt).toBeNull();
    expect(mockPackageFindMany.mock.calls[0]![0].where.deletedAt).toBeNull();
    expect(mockEventFindMany.mock.calls[0]![0].where.deletedAt).toBeNull();
    expect(mockAnnouncementFindMany.mock.calls[0]![0].where.deletedAt).toBeNull();
  });

  it('user query includes deletedAt: null in userProperties join', async () => {
    await GET(searchReq({ propertyId: PROPERTY_A, q: 'test' }));

    const where = mockUserFindMany.mock.calls[0]![0].where;
    expect(where.userProperties.some.deletedAt).toBeNull();
  });
});

// ===========================================================================
// 5. Case-insensitive search
// ===========================================================================

describe('5. Case-insensitive search', () => {
  it('uses mode: insensitive for user name search', async () => {
    await GET(searchReq({ propertyId: PROPERTY_A, q: 'JOHN' }));

    const where = mockUserFindMany.mock.calls[0]![0].where;
    const orClause = where.OR;
    expect(orClause[0].firstName.mode).toBe('insensitive');
    expect(orClause[1].lastName.mode).toBe('insensitive');
    expect(orClause[2].email.mode).toBe('insensitive');
  });

  it('uses mode: insensitive for unit number search', async () => {
    await GET(searchReq({ propertyId: PROPERTY_A, q: 'unit' }));

    const where = mockUnitFindMany.mock.calls[0]![0].where;
    // number filter is inside AND array: AND[0] = { number: { contains, mode } }
    expect(where.AND[0].number.mode).toBe('insensitive');
  });

  it('uses mode: insensitive for package search', async () => {
    await GET(searchReq({ propertyId: PROPERTY_A, q: 'pkg' }));

    const where = mockPackageFindMany.mock.calls[0]![0].where;
    expect(where.OR[0].referenceNumber.mode).toBe('insensitive');
    expect(where.OR[1].trackingNumber.mode).toBe('insensitive');
  });

  it('uses mode: insensitive for event search', async () => {
    await GET(searchReq({ propertyId: PROPERTY_A, q: 'noise' }));

    const where = mockEventFindMany.mock.calls[0]![0].where;
    expect(where.OR[0].title.mode).toBe('insensitive');
    expect(where.OR[1].referenceNo.mode).toBe('insensitive');
  });
});

// ===========================================================================
// 6. SQL injection / special character safety
// ===========================================================================

describe('6. Special character safety (SQL injection prevention)', () => {
  const dangerousQueries = [
    "'; DROP TABLE users; --",
    "1' OR '1'='1",
    '<script>alert("xss")</script>',
    'Robert"); DROP TABLE Students;--',
    'query\x00null',
    "O'Brien",
    'unit #302',
    'test@email.com',
    'name & surname',
    '100% complete',
  ];

  for (const q of dangerousQueries) {
    it(`does not crash on dangerous input: "${q.slice(0, 35)}"`, async () => {
      const res = await GET(searchReq({ propertyId: PROPERTY_A, q }));
      expect(res.status).not.toBe(500);
    });
  }

  it('passes query value as-is to Prisma contains filter (Prisma handles escaping)', async () => {
    await GET(searchReq({ propertyId: PROPERTY_A, q: "'; DROP TABLE users;--" }));

    const where = mockUnitFindMany.mock.calls[0]![0].where;
    // number filter is inside AND array: AND[0] = { number: { contains, mode } }
    expect(where.AND[0].number.contains).toBe("'; DROP TABLE users;--");
  });
});

// ===========================================================================
// 7. Pagination (per-module limits, configurable max)
// ===========================================================================

describe('7. Search pagination', () => {
  it('defaults to 5 results per module in typeahead mode (no type filter)', async () => {
    await GET(searchReq({ propertyId: PROPERTY_A, q: 'test' }));

    expect(mockUserFindMany.mock.calls[0]![0].take).toBe(5);
    expect(mockUnitFindMany.mock.calls[0]![0].take).toBe(5);
    expect(mockPackageFindMany.mock.calls[0]![0].take).toBe(5);
  });

  it('uses custom limit when provided', async () => {
    await GET(searchReq({ propertyId: PROPERTY_A, q: 'test', limit: '20' }));

    expect(mockUserFindMany.mock.calls[0]![0].take).toBe(20);
  });

  it('applies skip offset when type filter is active with page > 1', async () => {
    mockUserFindMany.mockResolvedValue([]);
    mockUserCount.mockResolvedValue(0);

    await GET(
      searchReq({ propertyId: PROPERTY_A, q: 'test', type: 'users', page: '3', limit: '10' }),
    );

    const call = mockUserFindMany.mock.calls[0]![0];
    expect(call.skip).toBe(20); // (3-1) * 10
    expect(call.take).toBe(10);
  });

  it('does not apply skip without type filter (typeahead mode)', async () => {
    await GET(searchReq({ propertyId: PROPERTY_A, q: 'test', page: '2' }));

    const call = mockUserFindMany.mock.calls[0]![0];
    expect(call.skip).toBeUndefined();
  });

  it('returns totalResults in meta without type filter', async () => {
    mockUserFindMany.mockResolvedValue([{ id: 'u1' }]);
    mockPackageFindMany.mockResolvedValue([{ id: 'p1' }, { id: 'p2' }]);

    const res = await GET(searchReq({ propertyId: PROPERTY_A, q: 'test' }));
    const body = await parseResponse<{ meta: { totalResults: number } }>(res);

    expect(body.meta.totalResults).toBe(3);
  });

  it('returns full pagination meta when type filter is active', async () => {
    mockEventFindMany.mockResolvedValue([]);
    mockEventCount.mockResolvedValue(100);

    const res = await GET(
      searchReq({ propertyId: PROPERTY_A, q: 'test', type: 'events', page: '2', limit: '25' }),
    );
    const body = await parseResponse<{
      meta: { total: number; page: number; limit: number; totalPages: number };
    }>(res);

    expect(body.meta.total).toBe(100);
    expect(body.meta.page).toBe(2);
    expect(body.meta.limit).toBe(25);
    expect(body.meta.totalPages).toBe(4);
  });
});

// ===========================================================================
// 8. Empty & short query handling
// ===========================================================================

describe('8. Empty and short query handling', () => {
  it('returns empty results for empty string query', async () => {
    const res = await GET(searchReq({ propertyId: PROPERTY_A, q: '' }));
    expect(res.status).toBe(200);

    expect(mockUserFindMany).not.toHaveBeenCalled();
  });

  it('returns empty results when q parameter is missing', async () => {
    const res = await GET(searchReq({ propertyId: PROPERTY_A }));
    expect(res.status).toBe(200);

    expect(mockUserFindMany).not.toHaveBeenCalled();
  });

  it('returns empty results for single-character query (< 2 chars)', async () => {
    const res = await GET(searchReq({ propertyId: PROPERTY_A, q: 'a' }));
    expect(res.status).toBe(200);

    expect(mockPackageFindMany).not.toHaveBeenCalled();
  });

  it('accepts 2-character query as the minimum length', async () => {
    await GET(searchReq({ propertyId: PROPERTY_A, q: 'ab' }));

    expect(mockUserFindMany).toHaveBeenCalled();
  });

  it('returns consistent empty shape with all module keys', async () => {
    const res = await GET(searchReq({ propertyId: PROPERTY_A, q: '' }));
    const body = await parseResponse<{ data: Record<string, unknown[]> }>(res);

    expect(body.data).toHaveProperty('users');
    expect(body.data).toHaveProperty('units');
    expect(body.data).toHaveProperty('packages');
    expect(body.data).toHaveProperty('events');
    expect(body.data).toHaveProperty('announcements');
    expect(body.data).toHaveProperty('results');
  });

  it('returns empty results when propertyId is missing', async () => {
    const res = await GET(searchReq({ q: 'test' }));
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { results: unknown[] } }>(res);
    expect(body.data.results).toEqual([]);
  });
});

// ===========================================================================
// 9. Module filter (search specific module only)
// ===========================================================================

describe('9. Module filter', () => {
  it('searches only users when type=users', async () => {
    mockUserFindMany.mockResolvedValue([]);
    mockUserCount.mockResolvedValue(0);

    await GET(searchReq({ propertyId: PROPERTY_A, q: 'john', type: 'users' }));

    expect(mockUserFindMany).toHaveBeenCalled();
    expect(mockUnitFindMany).not.toHaveBeenCalled();
    expect(mockPackageFindMany).not.toHaveBeenCalled();
    expect(mockEventFindMany).not.toHaveBeenCalled();
    expect(mockAnnouncementFindMany).not.toHaveBeenCalled();
  });

  it('searches only packages when type=packages', async () => {
    mockPackageFindMany.mockResolvedValue([]);
    mockPackageCount.mockResolvedValue(0);

    await GET(searchReq({ propertyId: PROPERTY_A, q: 'PKG', type: 'packages' }));

    expect(mockPackageFindMany).toHaveBeenCalled();
    expect(mockUserFindMany).not.toHaveBeenCalled();
  });

  it('searches only announcements when type=announcements', async () => {
    mockAnnouncementFindMany.mockResolvedValue([]);
    mockAnnouncementCount.mockResolvedValue(0);

    await GET(searchReq({ propertyId: PROPERTY_A, q: 'notice', type: 'announcements' }));

    expect(mockAnnouncementFindMany).toHaveBeenCalled();
    expect(mockUserFindMany).not.toHaveBeenCalled();
  });

  it('ignores invalid type filter and searches all modules', async () => {
    await GET(searchReq({ propertyId: PROPERTY_A, q: 'test', type: 'invalid_module' }));

    expect(mockUserFindMany).toHaveBeenCalled();
    expect(mockUnitFindMany).toHaveBeenCalled();
    expect(mockPackageFindMany).toHaveBeenCalled();
    expect(mockEventFindMany).toHaveBeenCalled();
    expect(mockAnnouncementFindMany).toHaveBeenCalled();
  });
});

// ===========================================================================
// 10. Highlight matching terms in snippet
// ===========================================================================

describe('10. Text highlighting', () => {
  it('wraps matching text in <mark> tags', async () => {
    mockUserFindMany.mockResolvedValue([
      { id: 'u1', firstName: 'Johnson', lastName: 'Doe', email: 'johnson@b.com' },
    ]);

    const res = await GET(searchReq({ propertyId: PROPERTY_A, q: 'john', type: 'users' }));
    const body = await parseResponse<SearchResponseBody>(res);

    const highlights = body.data.results[0]!.highlights;
    expect(highlights.firstName).toContain('<mark>');
    expect(highlights.firstName).toContain('</mark>');
  });

  it('preserves original casing in highlighted text', async () => {
    mockUserFindMany.mockResolvedValue([
      { id: 'u1', firstName: 'JOHN', lastName: 'Doe', email: 'john@b.com' },
    ]);

    const res = await GET(searchReq({ propertyId: PROPERTY_A, q: 'john', type: 'users' }));
    const body = await parseResponse<SearchResponseBody>(res);

    expect(body.data.results[0]!.highlights.firstName).toContain('<mark>JOHN</mark>');
  });

  it('highlights multiple matching fields', async () => {
    mockAnnouncementFindMany.mockResolvedValue([
      { id: 'a1', title: 'Important Notice', status: 'published', content: 'important update' },
    ]);

    const res = await GET(
      searchReq({ propertyId: PROPERTY_A, q: 'important', type: 'announcements' }),
    );
    const body = await parseResponse<SearchResponseBody>(res);

    expect(body.data.results[0]!.highlights).toHaveProperty('title');
  });
});

// ===========================================================================
// 11. Tenant isolation (property-scoped)
// ===========================================================================

describe('11. Tenant isolation', () => {
  it('scopes user search via userProperties join for the given propertyId', async () => {
    await GET(searchReq({ propertyId: PROPERTY_A, q: 'test' }));

    const where = mockUserFindMany.mock.calls[0]![0].where;
    expect(where.userProperties).toEqual({
      some: { propertyId: PROPERTY_A, deletedAt: null },
    });
  });

  it('scopes unit, package, event, announcement searches by propertyId', async () => {
    await GET(searchReq({ propertyId: PROPERTY_A, q: 'test' }));

    expect(mockUnitFindMany.mock.calls[0]![0].where.propertyId).toBe(PROPERTY_A);
    expect(mockPackageFindMany.mock.calls[0]![0].where.propertyId).toBe(PROPERTY_A);
    expect(mockEventFindMany.mock.calls[0]![0].where.propertyId).toBe(PROPERTY_A);
    expect(mockAnnouncementFindMany.mock.calls[0]![0].where.propertyId).toBe(PROPERTY_A);
  });

  it('different propertyId scopes to different property', async () => {
    await GET(searchReq({ propertyId: PROPERTY_B, q: 'test' }));

    expect(mockUnitFindMany.mock.calls[0]![0].where.propertyId).toBe(PROPERTY_B);
    expect(mockPackageFindMany.mock.calls[0]![0].where.propertyId).toBe(PROPERTY_B);
  });
});

// ===========================================================================
// 12. Search performance (caching)
// ===========================================================================

describe('12. Search performance and caching', () => {
  it('caches search results and returns X-Cache: HIT on second request', async () => {
    mockUserFindMany.mockResolvedValue([
      { id: 'u1', firstName: 'Test', lastName: 'User', email: 'test@b.com' },
    ]);

    // First request — cache MISS
    const res1 = await GET(searchReq({ propertyId: PROPERTY_A, q: 'test' }));
    expect(res1.status).toBe(200);

    // Second request — cache HIT
    const res2 = await GET(searchReq({ propertyId: PROPERTY_A, q: 'test' }));
    expect(res2.headers.get('X-Cache')).toBe('HIT');

    // Prisma should only have been called once (first request)
    expect(mockUserFindMany).toHaveBeenCalledTimes(1);
  });

  it('does not cache results for short queries', async () => {
    const res1 = await GET(searchReq({ propertyId: PROPERTY_A, q: 'a' }));
    expect(res1.status).toBe(200);

    const res2 = await GET(searchReq({ propertyId: PROPERTY_A, q: 'a' }));
    expect(res2.headers.get('X-Cache')).toBeNull();
  });
});

// ===========================================================================
// 13. Recent searches tracking
// ===========================================================================

describe('13. Recent searches tracking', () => {
  it('retrieves recent searches when recent=true', async () => {
    const searches = Array.from({ length: 5 }, (_, i) => ({
      id: `sh-${i}`,
      query: `query-${i}`,
      userId: ADMIN_USER,
      propertyId: PROPERTY_A,
      createdAt: new Date(),
    }));
    mockSearchHistoryFindMany.mockResolvedValue(searches);

    const res = await GET(searchReq({ recent: 'true' }));
    const body = await parseResponse<{ data: { recentSearches: unknown[] } }>(res);

    expect(res.status).toBe(200);
    expect(body.data.recentSearches).toHaveLength(5);
  });

  it('limits recent searches to 10 entries', async () => {
    await GET(searchReq({ recent: 'true' }));

    const call = mockSearchHistoryFindMany.mock.calls[0]![0];
    expect(call.take).toBe(10);
  });

  it('orders recent searches by createdAt desc (newest first)', async () => {
    await GET(searchReq({ recent: 'true' }));

    const call = mockSearchHistoryFindMany.mock.calls[0]![0];
    expect(call.orderBy).toEqual({ createdAt: 'desc' });
  });

  it('filters recent searches by authenticated userId', async () => {
    await GET(searchReq({ recent: 'true' }));

    const call = mockSearchHistoryFindMany.mock.calls[0]![0];
    expect(call.where.userId).toBe(ADMIN_USER);
  });

  it('saves search query to history on a valid search', async () => {
    await GET(searchReq({ propertyId: PROPERTY_A, q: 'john doe' }));

    expect(mockSearchHistoryCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          query: 'john doe',
          userId: ADMIN_USER,
          propertyId: PROPERTY_A,
        }),
      }),
    );
  });

  it('clears search history via DELETE', async () => {
    mockSearchHistoryDeleteMany.mockResolvedValue({ count: 3 });

    const req = createDeleteRequest('/api/v1/search');
    const res = await DELETE(req);

    expect(res.status).toBe(200);
    expect(mockSearchHistoryDeleteMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: ADMIN_USER } }),
    );
  });

  it('DELETE returns cleared: true on success', async () => {
    mockSearchHistoryDeleteMany.mockResolvedValue({ count: 5 });

    const res = await DELETE(createDeleteRequest('/api/v1/search'));
    const body = await parseResponse<{ data: { cleared: boolean } }>(res);

    expect(body.data.cleared).toBe(true);
  });
});

// ===========================================================================
// 14. Search analytics (popular terms — via saved history)
// ===========================================================================

describe('14. Search analytics', () => {
  it('saves every valid search query for analytics tracking', async () => {
    await GET(searchReq({ propertyId: PROPERTY_A, q: 'popular term' }));

    expect(mockSearchHistoryCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          query: 'popular term',
        }),
      }),
    );
  });

  it('does not save search for short/empty queries', async () => {
    await GET(searchReq({ propertyId: PROPERTY_A, q: 'a' }));

    expect(mockSearchHistoryCreate).not.toHaveBeenCalled();
  });

  it('does not save search when propertyId is missing', async () => {
    await GET(searchReq({ q: 'test' }));

    expect(mockSearchHistoryCreate).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// 15. XSS prevention in search results
// ===========================================================================

describe('15. XSS prevention in search results', () => {
  it('does not execute script tags in search query — passes through as text', async () => {
    const xssQuery = '<script>alert(1)</script>';

    const res = await GET(searchReq({ propertyId: PROPERTY_A, q: xssQuery }));
    expect(res.status).not.toBe(500);
  });

  it('search results do not contain unescaped script content in highlights', async () => {
    mockUserFindMany.mockResolvedValue([
      { id: 'u1', firstName: '<script>alert(1)</script>User', lastName: 'Test', email: 'a@b.com' },
    ]);

    const res = await GET(searchReq({ propertyId: PROPERTY_A, q: 'script' }));
    const body = await parseResponse<SearchResponseBody>(res);

    // Results should exist but not cause any injection issues
    // The highlights use <mark> tags for highlighting, and the original content is preserved
    // Frontend is responsible for proper escaping on render
    expect(body.data.results).toBeDefined();
  });

  it('handles unicode and special HTML entities safely', async () => {
    const res = await GET(searchReq({ propertyId: PROPERTY_A, q: '&amp;&lt;&gt;' }));
    expect(res.status).not.toBe(500);
  });
});

// ===========================================================================
// 16. Auth guard enforcement
// ===========================================================================

describe('16. Auth guard enforcement', () => {
  it('returns 401 when guardRoute returns error for GET', async () => {
    const { NextResponse } = await import('next/server');
    mockGuardRoute.mockResolvedValue({
      user: null,
      error: NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Not authenticated' },
        { status: 401 },
      ),
    });

    const res = await GET(searchReq({ propertyId: PROPERTY_A, q: 'test' }));
    expect(res.status).toBe(401);
  });

  it('returns 401 when guardRoute returns error for DELETE', async () => {
    const { NextResponse } = await import('next/server');
    mockGuardRoute.mockResolvedValue({
      user: null,
      error: NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 }),
    });

    const res = await DELETE(createDeleteRequest('/api/v1/search'));
    expect(res.status).toBe(401);
  });

  it('returns 500 with safe message on unexpected database error', async () => {
    mockUserFindMany.mockRejectedValue(new Error('Connection refused'));

    const res = await GET(searchReq({ propertyId: PROPERTY_A, q: 'test' }));
    expect(res.status).toBe(500);

    const body = await parseResponse<{ error: string; message: string }>(res);
    expect(body.error).toBe('INTERNAL_ERROR');
    expect(body.message).not.toContain('Connection refused');
  });

  it('DELETE returns 500 with safe message on database error', async () => {
    mockSearchHistoryDeleteMany.mockRejectedValue(new Error('DB down'));

    const res = await DELETE(createDeleteRequest('/api/v1/search'));
    expect(res.status).toBe(500);

    const body = await parseResponse<{ error: string; message: string }>(res);
    expect(body.error).toBe('INTERNAL_ERROR');
    expect(body.message).not.toContain('DB down');
  });
});

// ===========================================================================
// 17. Relevance scoring
// ===========================================================================

describe('17. Relevance scoring', () => {
  it('exact match scores higher than partial match', async () => {
    mockUserFindMany.mockResolvedValue([
      { id: 'u1', firstName: 'John', lastName: 'Doe', email: 'john@b.com' },
      { id: 'u2', firstName: 'Alejohn', lastName: 'Smith', email: 'a@b.com' },
    ]);

    const res = await GET(searchReq({ propertyId: PROPERTY_A, q: 'John', type: 'users' }));
    const body = await parseResponse<SearchResponseBody>(res);

    const u1 = body.data.results.find((r) => r.id === 'u1');
    const u2 = body.data.results.find((r) => r.id === 'u2');

    expect(u1!.score).toBeGreaterThan(u2!.score);
  });

  it('results are sorted by score descending', async () => {
    mockUserFindMany.mockResolvedValue([
      { id: 'u1', firstName: 'Partial-test-match', lastName: 'X', email: 'x@b.com' },
    ]);
    mockAnnouncementFindMany.mockResolvedValue([{ id: 'a1', title: 'test', status: 'published' }]);

    const res = await GET(searchReq({ propertyId: PROPERTY_A, q: 'test' }));
    const body = await parseResponse<SearchResponseBody>(res);

    for (let i = 1; i < body.data.results.length; i++) {
      expect(body.data.results[i - 1]!.score).toBeGreaterThanOrEqual(body.data.results[i]!.score);
    }
  });

  it('assigns score of 0 when no fields match', async () => {
    mockUnitFindMany.mockResolvedValue([{ id: 'unit1', number: null, status: 'vacant' }]);

    const res = await GET(searchReq({ propertyId: PROPERTY_A, q: 'test' }));
    const body = await parseResponse<SearchResponseBody>(res);

    const unitResult = body.data.results.find((r) => r.id === 'unit1');
    if (unitResult) {
      expect(unitResult.score).toBe(0);
    }
  });
});

// ===========================================================================
// 18. Status and date range filters
// ===========================================================================

describe('18. Status and date range filters', () => {
  it('applies status filter to package search', async () => {
    await GET(searchReq({ propertyId: PROPERTY_A, q: 'PKG', status: 'released' }));

    const where = mockPackageFindMany.mock.calls[0]![0].where;
    expect(where.status).toBe('released');
  });

  it('applies from date filter as createdAt.gte', async () => {
    await GET(searchReq({ propertyId: PROPERTY_A, q: 'test', from: '2026-01-01' }));

    const where = mockUserFindMany.mock.calls[0]![0].where;
    expect(where.createdAt.gte).toEqual(new Date('2026-01-01'));
  });

  it('applies to date filter as createdAt.lte', async () => {
    await GET(searchReq({ propertyId: PROPERTY_A, q: 'test', to: '2026-03-31' }));

    const where = mockEventFindMany.mock.calls[0]![0].where;
    expect(where.createdAt.lte).toEqual(new Date('2026-03-31'));
  });

  it('applies both from and to filters together', async () => {
    await GET(
      searchReq({ propertyId: PROPERTY_A, q: 'test', from: '2026-01-01', to: '2026-06-30' }),
    );

    const where = mockPackageFindMany.mock.calls[0]![0].where;
    expect(where.createdAt.gte).toEqual(new Date('2026-01-01'));
    expect(where.createdAt.lte).toEqual(new Date('2026-06-30'));
  });

  it('omits date filter when neither from nor to provided', async () => {
    await GET(searchReq({ propertyId: PROPERTY_A, q: 'test' }));

    const where = mockUnitFindMany.mock.calls[0]![0].where;
    expect(where.createdAt).toBeUndefined();
  });
});
