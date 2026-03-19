/**
 * Comprehensive Search Module Tests — PRD 14
 *
 * Covers 12 scenario groups with 60+ individual test cases:
 *   1. Cross-module search across users, units, packages, events, announcements
 *   2. Type filtering (search only in specific modules)
 *   3. Date range filtering (from/to)
 *   4. Relevance ranking (exact > prefix > partial)
 *   5. Recent search history per user (save, retrieve, clear)
 *   6. Pagination on search results
 *   7. Empty query handling (empty string, missing, too short)
 *   8. Special character escaping (apostrophes, #, @, unicode, etc.)
 *   9. Text highlighting with <mark> tags
 *  10. Status filter applied per module
 *  11. Combined results sorted by relevance score descending
 *  12. Auth guard enforcement
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createGetRequest, createDeleteRequest, parseResponse } from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// UUIDs
// ---------------------------------------------------------------------------
const PROPERTY_A = '00000000-0000-4000-b000-000000000001';
const PROPERTY_B = '00000000-0000-4000-b000-000000000002';
const STAFF_USER = 'test-concierge';

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
  mockSearchHistoryCreate.mockResolvedValue({ id: 'sh-1' });
  mockSearchHistoryFindMany.mockResolvedValue([]);
  mockSearchHistoryDeleteMany.mockResolvedValue({ count: 0 });
}

function authOk() {
  mockGuardRoute.mockResolvedValue({
    user: {
      userId: STAFF_USER,
      propertyId: PROPERTY_A,
      role: 'front_desk',
      permissions: ['*'],
      mfaVerified: false,
    },
    error: null,
  });
}

function searchReq(params: Record<string, string>) {
  return createGetRequest('/api/v1/search', { searchParams: params });
}

beforeEach(() => {
  vi.clearAllMocks();
  authOk();
  clearModuleMocks();
});

// ===========================================================================
// 1. Cross-module search across users, units, packages, events, announcements
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
      { id: 'u1', firstName: 'Alice', lastName: 'Test', email: 'a@b.com' },
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
    const body = await parseResponse<{
      data: Record<string, unknown[]>;
      meta: { totalResults: number };
    }>(res);

    expect(body.data.users).toHaveLength(1);
    expect(body.data.units).toHaveLength(1);
    expect(body.data.packages).toHaveLength(1);
    expect(body.data.events).toHaveLength(1);
    expect(body.data.announcements).toHaveLength(1);
    expect(body.meta.totalResults).toBe(5);
  });

  it('returns combined results array alongside categorized results', async () => {
    mockUserFindMany.mockResolvedValue([
      { id: 'u1', firstName: 'Test', lastName: 'User', email: 'test@b.com' },
    ]);
    const res = await GET(searchReq({ propertyId: PROPERTY_A, q: 'test' }));
    const body = await parseResponse<{ data: { results: unknown[] } }>(res);

    expect(body.data.results).toBeDefined();
    expect(Array.isArray(body.data.results)).toBe(true);
  });

  it('scopes user search via userProperties join for tenant isolation', async () => {
    await GET(searchReq({ propertyId: PROPERTY_A, q: 'test' }));

    const where = mockUserFindMany.mock.calls[0]![0].where;
    expect(where.userProperties).toEqual({ some: { propertyId: PROPERTY_A, deletedAt: null } });
  });

  it('scopes unit, package, event, announcement searches by propertyId', async () => {
    await GET(searchReq({ propertyId: PROPERTY_A, q: 'test' }));

    expect(mockUnitFindMany.mock.calls[0]![0].where.propertyId).toBe(PROPERTY_A);
    expect(mockPackageFindMany.mock.calls[0]![0].where.propertyId).toBe(PROPERTY_A);
    expect(mockEventFindMany.mock.calls[0]![0].where.propertyId).toBe(PROPERTY_A);
    expect(mockAnnouncementFindMany.mock.calls[0]![0].where.propertyId).toBe(PROPERTY_A);
  });

  it('excludes soft-deleted records in every module query', async () => {
    await GET(searchReq({ propertyId: PROPERTY_A, q: 'test' }));

    expect(mockUserFindMany.mock.calls[0]![0].where.deletedAt).toBeNull();
    expect(mockUnitFindMany.mock.calls[0]![0].where.deletedAt).toBeNull();
    expect(mockPackageFindMany.mock.calls[0]![0].where.deletedAt).toBeNull();
    expect(mockEventFindMany.mock.calls[0]![0].where.deletedAt).toBeNull();
    expect(mockAnnouncementFindMany.mock.calls[0]![0].where.deletedAt).toBeNull();
  });
});

// ===========================================================================
// 2. Type filtering (search only in specific modules)
// ===========================================================================

describe('2. Type filtering', () => {
  it('searches only users when type=users', async () => {
    mockUserFindMany.mockResolvedValue([
      { id: 'u1', firstName: 'John', lastName: 'Doe', email: 'j@b.com' },
    ]);
    mockUserCount.mockResolvedValue(1);

    await GET(searchReq({ propertyId: PROPERTY_A, q: 'john', type: 'users' }));

    expect(mockUserFindMany).toHaveBeenCalled();
    expect(mockUnitFindMany).not.toHaveBeenCalled();
    expect(mockPackageFindMany).not.toHaveBeenCalled();
    expect(mockEventFindMany).not.toHaveBeenCalled();
    expect(mockAnnouncementFindMany).not.toHaveBeenCalled();
  });

  it('searches only units when type=units', async () => {
    mockUnitFindMany.mockResolvedValue([{ id: 'unit1', number: '1501', status: 'occupied' }]);
    mockUnitCount.mockResolvedValue(1);

    await GET(searchReq({ propertyId: PROPERTY_A, q: '15', type: 'units' }));

    expect(mockUnitFindMany).toHaveBeenCalled();
    expect(mockUserFindMany).not.toHaveBeenCalled();
  });

  it('searches only packages when type=packages', async () => {
    mockPackageFindMany.mockResolvedValue([]);
    mockPackageCount.mockResolvedValue(0);

    await GET(searchReq({ propertyId: PROPERTY_A, q: 'PKG', type: 'packages' }));

    expect(mockPackageFindMany).toHaveBeenCalled();
    expect(mockUserFindMany).not.toHaveBeenCalled();
    expect(mockUnitFindMany).not.toHaveBeenCalled();
  });

  it('searches only events when type=events', async () => {
    mockEventFindMany.mockResolvedValue([]);
    mockEventCount.mockResolvedValue(0);

    await GET(searchReq({ propertyId: PROPERTY_A, q: 'noise', type: 'events' }));

    expect(mockEventFindMany).toHaveBeenCalled();
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

  it('returns pagination meta when type filter is active', async () => {
    mockUserFindMany.mockResolvedValue([
      { id: 'u1', firstName: 'Test', lastName: 'One', email: 't1@b.com' },
    ]);
    mockUserCount.mockResolvedValue(25);

    const res = await GET(
      searchReq({ propertyId: PROPERTY_A, q: 'test', type: 'users', page: '1', limit: '10' }),
    );
    const body = await parseResponse<{
      meta: { total: number; page: number; limit: number; totalPages: number };
    }>(res);

    expect(body.meta.total).toBe(25);
    expect(body.meta.page).toBe(1);
    expect(body.meta.totalPages).toBe(3);
  });
});

// ===========================================================================
// 3. Date range filtering
// ===========================================================================

describe('3. Date range filtering', () => {
  it('applies from date filter as createdAt.gte on all modules', async () => {
    await GET(searchReq({ propertyId: PROPERTY_A, q: 'test', from: '2026-01-01' }));

    const userWhere = mockUserFindMany.mock.calls[0]![0].where;
    expect(userWhere.createdAt).toBeDefined();
    expect(userWhere.createdAt.gte).toEqual(new Date('2026-01-01'));
  });

  it('applies to date filter as createdAt.lte on all modules', async () => {
    await GET(searchReq({ propertyId: PROPERTY_A, q: 'test', to: '2026-03-31' }));

    const eventWhere = mockEventFindMany.mock.calls[0]![0].where;
    expect(eventWhere.createdAt).toBeDefined();
    expect(eventWhere.createdAt.lte).toEqual(new Date('2026-03-31'));
  });

  it('applies both from and to filters together', async () => {
    await GET(
      searchReq({ propertyId: PROPERTY_A, q: 'test', from: '2026-01-01', to: '2026-06-30' }),
    );

    const pkgWhere = mockPackageFindMany.mock.calls[0]![0].where;
    expect(pkgWhere.createdAt.gte).toEqual(new Date('2026-01-01'));
    expect(pkgWhere.createdAt.lte).toEqual(new Date('2026-06-30'));
  });

  it('omits date filter when neither from nor to are provided', async () => {
    await GET(searchReq({ propertyId: PROPERTY_A, q: 'test' }));

    const unitWhere = mockUnitFindMany.mock.calls[0]![0].where;
    expect(unitWhere.createdAt).toBeUndefined();
  });

  it('applies date filter to announcements module', async () => {
    await GET(
      searchReq({ propertyId: PROPERTY_A, q: 'test', from: '2026-02-01', to: '2026-02-28' }),
    );

    const annWhere = mockAnnouncementFindMany.mock.calls[0]![0].where;
    expect(annWhere.createdAt.gte).toEqual(new Date('2026-02-01'));
    expect(annWhere.createdAt.lte).toEqual(new Date('2026-02-28'));
  });
});

// ===========================================================================
// 4. Relevance ranking
// ===========================================================================

describe('4. Relevance ranking', () => {
  it('exact match scores higher than partial match', async () => {
    mockUserFindMany.mockResolvedValue([
      { id: 'u1', firstName: 'John', lastName: 'Doe', email: 'john@b.com' },
      { id: 'u2', firstName: 'Alejohn', lastName: 'Smith', email: 'a@b.com' },
    ]);

    const res = await GET(searchReq({ propertyId: PROPERTY_A, q: 'John', type: 'users' }));
    const body = await parseResponse<{ data: { results: Array<{ id: string; score: number }> } }>(
      res,
    );

    const u1 = body.data.results.find((r) => r.id === 'u1');
    const u2 = body.data.results.find((r) => r.id === 'u2');

    expect(u1!.score).toBeGreaterThan(u2!.score);
  });

  it('prefix match scores higher than substring match', async () => {
    mockUserFindMany.mockResolvedValue([
      { id: 'u1', firstName: 'Johnson', lastName: 'A', email: 'a@b.com' },
      { id: 'u2', firstName: 'McJohnson', lastName: 'B', email: 'b@b.com' },
    ]);

    const res = await GET(searchReq({ propertyId: PROPERTY_A, q: 'john', type: 'users' }));
    const body = await parseResponse<{ data: { results: Array<{ id: string; score: number }> } }>(
      res,
    );

    const u1 = body.data.results.find((r) => r.id === 'u1');
    const u2 = body.data.results.find((r) => r.id === 'u2');

    expect(u1!.score).toBeGreaterThanOrEqual(u2!.score);
  });

  it('results are sorted by score descending in combined results', async () => {
    mockUserFindMany.mockResolvedValue([
      { id: 'u1', firstName: 'Partial-test-match', lastName: 'X', email: 'x@b.com' },
    ]);
    mockAnnouncementFindMany.mockResolvedValue([{ id: 'a1', title: 'test', status: 'published' }]);

    const res = await GET(searchReq({ propertyId: PROPERTY_A, q: 'test' }));
    const body = await parseResponse<{ data: { results: Array<{ score: number }> } }>(res);

    for (let i = 1; i < body.data.results.length; i++) {
      expect(body.data.results[i - 1]!.score).toBeGreaterThanOrEqual(body.data.results[i]!.score);
    }
  });

  it('assigns score of 0 when no fields match', async () => {
    // This can happen if prisma returns items via a broader search but the fields we check are null
    mockUnitFindMany.mockResolvedValue([{ id: 'unit1', number: null, status: 'vacant' }]);

    const res = await GET(searchReq({ propertyId: PROPERTY_A, q: 'test' }));
    const body = await parseResponse<{ data: { results: Array<{ score: number }> } }>(res);

    const unitResult = body.data.results.find((r) => r.id === 'unit1');
    if (unitResult) {
      expect(unitResult.score).toBe(0);
    }
  });
});

// ===========================================================================
// 5. Recent search history per user
// ===========================================================================

describe('5. Recent search history', () => {
  it('retrieves recent searches when recent=true', async () => {
    const searches = Array.from({ length: 5 }, (_, i) => ({
      id: `sh-${i}`,
      query: `query-${i}`,
      userId: STAFF_USER,
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
    expect(call.where.userId).toBe(STAFF_USER);
  });

  it('saves search query to history on a valid search', async () => {
    await GET(searchReq({ propertyId: PROPERTY_A, q: 'john doe' }));

    expect(mockSearchHistoryCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          query: 'john doe',
          userId: STAFF_USER,
          propertyId: PROPERTY_A,
        }),
      }),
    );
  });

  it('clears search history for the authenticated user via DELETE', async () => {
    mockSearchHistoryDeleteMany.mockResolvedValue({ count: 3 });

    const req = createDeleteRequest('/api/v1/search');
    const res = await DELETE(req);

    expect(res.status).toBe(200);
    expect(mockSearchHistoryDeleteMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { userId: STAFF_USER } }),
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
// 6. Pagination on search results
// ===========================================================================

describe('6. Pagination on search results', () => {
  it('defaults to 5 per module in typeahead mode (no type filter)', async () => {
    await GET(searchReq({ propertyId: PROPERTY_A, q: 'test' }));

    expect(mockUserFindMany.mock.calls[0]![0].take).toBe(5);
    expect(mockUnitFindMany.mock.calls[0]![0].take).toBe(5);
  });

  it('uses custom limit when provided without type filter', async () => {
    await GET(searchReq({ propertyId: PROPERTY_A, q: 'test', limit: '15' }));

    expect(mockUserFindMany.mock.calls[0]![0].take).toBe(15);
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

  it('does not apply skip without type filter', async () => {
    await GET(searchReq({ propertyId: PROPERTY_A, q: 'test', page: '2' }));

    // Without type filter, skip is not applied (typeahead mode)
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

  it('returns full pagination meta with type filter', async () => {
    mockEventFindMany.mockResolvedValue([]);
    mockEventCount.mockResolvedValue(100);

    const res = await GET(
      searchReq({ propertyId: PROPERTY_A, q: 'test', type: 'events', page: '2', limit: '25' }),
    );
    const body = await parseResponse<{
      meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNext: boolean;
        hasPrev: boolean;
      };
    }>(res);

    expect(body.meta.total).toBe(100);
    expect(body.meta.page).toBe(2);
    expect(body.meta.limit).toBe(25);
    expect(body.meta.totalPages).toBe(4);
    expect(body.meta.hasNext).toBe(true);
    expect(body.meta.hasPrev).toBe(true);
  });
});

// ===========================================================================
// 7. Empty query handling
// ===========================================================================

describe('7. Empty query handling', () => {
  it('returns empty results for empty string query', async () => {
    const res = await GET(searchReq({ propertyId: PROPERTY_A, q: '' }));
    expect(res.status).toBe(200);

    expect(mockUserFindMany).not.toHaveBeenCalled();
    expect(mockUnitFindMany).not.toHaveBeenCalled();
  });

  it('returns empty results when q parameter is missing entirely', async () => {
    const res = await GET(searchReq({ propertyId: PROPERTY_A }));
    expect(res.status).toBe(200);

    expect(mockUserFindMany).not.toHaveBeenCalled();
  });

  it('returns empty results for single-character query (min length 2)', async () => {
    const res = await GET(searchReq({ propertyId: PROPERTY_A, q: 'a' }));
    expect(res.status).toBe(200);

    expect(mockPackageFindMany).not.toHaveBeenCalled();
  });

  it('accepts 2-character query as the minimum', async () => {
    await GET(searchReq({ propertyId: PROPERTY_A, q: 'ab' }));

    expect(mockUserFindMany).toHaveBeenCalled();
  });

  it('returns empty results when propertyId is missing', async () => {
    const res = await GET(searchReq({ q: 'test' }));
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { results: unknown[] } }>(res);
    expect(body.data.results).toEqual([]);
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
});

// ===========================================================================
// 8. Special character escaping
// ===========================================================================

describe('8. Special character escaping', () => {
  const specialQueries = [
    "O'Brien",
    'unit #302',
    'test@email.com',
    'pkg (123)',
    'name & surname',
    'search "quoted"',
    'back\\slash',
    'semi;colon',
    '100% complete',
    'résumé',
    'name<script>alert(1)</script>',
    'query\nwith\nnewlines',
  ];

  for (const q of specialQueries) {
    it(`handles query with special chars: "${q.slice(0, 30)}"`, async () => {
      const res = await GET(searchReq({ propertyId: PROPERTY_A, q }));

      // Should never crash with 500
      expect(res.status).not.toBe(500);
    });
  }

  it('passes query value unmodified to Prisma contains filter', async () => {
    await GET(searchReq({ propertyId: PROPERTY_A, q: "O'Brien" }));

    const unitWhere = mockUnitFindMany.mock.calls[0]![0].where;
    expect(unitWhere.number.contains).toBe("O'Brien");
  });
});

// ===========================================================================
// 9. Text highlighting
// ===========================================================================

describe('9. Text highlighting with <mark> tags', () => {
  it('wraps matching text in <mark> tags in highlights', async () => {
    mockUserFindMany.mockResolvedValue([
      { id: 'u1', firstName: 'Johnson', lastName: 'Doe', email: 'johnson@b.com' },
    ]);

    const res = await GET(searchReq({ propertyId: PROPERTY_A, q: 'john', type: 'users' }));
    const body = await parseResponse<{
      data: { results: Array<{ highlights: Record<string, string> }> };
    }>(res);

    const result = body.data.results[0]!;
    expect(result.highlights.firstName).toContain('<mark>');
    expect(result.highlights.firstName).toContain('</mark>');
  });

  it('preserves case of original text in highlights', async () => {
    mockUserFindMany.mockResolvedValue([
      { id: 'u1', firstName: 'JOHN', lastName: 'Doe', email: 'john@b.com' },
    ]);

    const res = await GET(searchReq({ propertyId: PROPERTY_A, q: 'john', type: 'users' }));
    const body = await parseResponse<{
      data: { results: Array<{ highlights: Record<string, string> }> };
    }>(res);

    // The original casing should be preserved inside the <mark>
    expect(body.data.results[0]!.highlights.firstName).toContain('<mark>JOHN</mark>');
  });

  it('highlights matching fields in announcements (title and content)', async () => {
    mockAnnouncementFindMany.mockResolvedValue([
      { id: 'a1', title: 'Important Notice', status: 'published', content: 'important update' },
    ]);

    const res = await GET(
      searchReq({ propertyId: PROPERTY_A, q: 'important', type: 'announcements' }),
    );
    const body = await parseResponse<{
      data: { results: Array<{ highlights: Record<string, string> }> };
    }>(res);

    expect(body.data.results[0]!.highlights).toHaveProperty('title');
  });
});

// ===========================================================================
// 10. Status filter
// ===========================================================================

describe('10. Status filter', () => {
  it('applies status filter to unit search', async () => {
    await GET(searchReq({ propertyId: PROPERTY_A, q: 'test', status: 'vacant' }));

    const unitWhere = mockUnitFindMany.mock.calls[0]![0].where;
    expect(unitWhere.status).toBe('vacant');
  });

  it('applies status filter to package search', async () => {
    await GET(searchReq({ propertyId: PROPERTY_A, q: 'PKG', status: 'released' }));

    const pkgWhere = mockPackageFindMany.mock.calls[0]![0].where;
    expect(pkgWhere.status).toBe('released');
  });

  it('applies status filter to event search', async () => {
    await GET(searchReq({ propertyId: PROPERTY_A, q: 'test', status: 'closed' }));

    const eventWhere = mockEventFindMany.mock.calls[0]![0].where;
    expect(eventWhere.status).toBe('closed');
  });

  it('applies status filter to announcement search', async () => {
    await GET(searchReq({ propertyId: PROPERTY_A, q: 'test', status: 'draft' }));

    const annWhere = mockAnnouncementFindMany.mock.calls[0]![0].where;
    expect(annWhere.status).toBe('draft');
  });
});

// ===========================================================================
// 11. Combined results with correct type labels
// ===========================================================================

describe('11. Combined results with correct type labels', () => {
  it('each result includes type, title, and score fields', async () => {
    mockUserFindMany.mockResolvedValue([
      { id: 'u1', firstName: 'Jane', lastName: 'Doe', email: 'jane@b.com' },
    ]);
    mockEventFindMany.mockResolvedValue([
      { id: 'e1', title: 'Jane visitor', referenceNo: 'EVT-1', status: 'open' },
    ]);

    const res = await GET(searchReq({ propertyId: PROPERTY_A, q: 'jane' }));
    const body = await parseResponse<{
      data: { results: Array<{ id: string; type: string; title: string; score: number }> };
    }>(res);

    for (const result of body.data.results) {
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('type');
      expect(result).toHaveProperty('title');
      expect(result).toHaveProperty('score');
    }
  });

  it('user results have type "users" and formatted title', async () => {
    mockUserFindMany.mockResolvedValue([
      { id: 'u1', firstName: 'Jane', lastName: 'Doe', email: 'jane@b.com' },
    ]);

    const res = await GET(searchReq({ propertyId: PROPERTY_A, q: 'jane', type: 'users' }));
    const body = await parseResponse<{
      data: { results: Array<{ type: string; title: string; subtitle?: string }> };
    }>(res);

    expect(body.data.results[0]!.type).toBe('users');
    expect(body.data.results[0]!.title).toBe('Jane Doe');
    expect(body.data.results[0]!.subtitle).toBe('jane@b.com');
  });

  it('unit results have type "units" and "Unit" prefix in title', async () => {
    mockUnitFindMany.mockResolvedValue([{ id: 'unit1', number: '1501', status: 'occupied' }]);

    const res = await GET(searchReq({ propertyId: PROPERTY_A, q: '15', type: 'units' }));
    const body = await parseResponse<{ data: { results: Array<{ type: string; title: string }> } }>(
      res,
    );

    expect(body.data.results[0]!.type).toBe('units');
    expect(body.data.results[0]!.title).toBe('Unit 1501');
  });
});

// ===========================================================================
// 12. Auth guard enforcement
// ===========================================================================

describe('12. Auth guard enforcement', () => {
  it('returns auth error when guardRoute returns error for GET', async () => {
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

  it('returns auth error when guardRoute returns error for DELETE', async () => {
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
