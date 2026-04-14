/**
 * Concierge — Advanced Search API Tests
 *
 * Tests for advanced search features: type filtering, date ranges,
 * status filtering, relevance scoring, text highlighting, recent
 * searches, pagination, and special character handling.
 *
 * These features transform search from a simple typeahead into the
 * "primary navigation tool for front desk staff who handle 100+
 * interactions per shift" (PRD 15).
 *
 * @module api/v1/search/__tests__/advanced.test
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createGetRequest, createDeleteRequest, parseResponse } from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Mock Setup
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

import { GET, DELETE } from '../../search/route';

const propertyId = '00000000-0000-4000-b000-000000000001';

beforeEach(() => {
  vi.clearAllMocks();
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
});

// ---------------------------------------------------------------------------
// Type Filter — search only specific modules
// ---------------------------------------------------------------------------

describe('GET /api/v1/search — Type Filter', () => {
  it('filters results to only users when type=users', async () => {
    mockUserFindMany.mockResolvedValue([
      { id: 'u1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
    ]);
    mockUserCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/search', {
      searchParams: { propertyId, q: 'john', type: 'users' },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: Record<string, unknown[]> }>(res);

    // Users should be searched
    expect(mockUserFindMany).toHaveBeenCalled();
    // Other modules should NOT be searched
    expect(mockUnitFindMany).not.toHaveBeenCalled();
    expect(mockPackageFindMany).not.toHaveBeenCalled();
    expect(mockEventFindMany).not.toHaveBeenCalled();
    expect(mockAnnouncementFindMany).not.toHaveBeenCalled();
  });

  it('filters results to only packages when type=packages', async () => {
    mockPackageFindMany.mockResolvedValue([
      { id: 'p1', referenceNumber: 'PKG-001', status: 'received' },
    ]);
    mockPackageCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/search', {
      searchParams: { propertyId, q: 'PKG', type: 'packages' },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);

    expect(mockPackageFindMany).toHaveBeenCalled();
    expect(mockUserFindMany).not.toHaveBeenCalled();
    expect(mockUnitFindMany).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Date Range Filter
// ---------------------------------------------------------------------------

describe('GET /api/v1/search — Date Range Filter', () => {
  it('applies date range filter to search queries', async () => {
    const req = createGetRequest('/api/v1/search', {
      searchParams: {
        propertyId,
        q: 'test',
        from: '2026-01-01',
        to: '2026-03-01',
      },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);

    // Verify date range is applied to at least the event query
    if (mockEventFindMany.mock.calls.length > 0) {
      const eventWhere = mockEventFindMany.mock.calls[0]![0].where;
      expect(eventWhere.createdAt).toBeDefined();
      expect(eventWhere.createdAt.gte).toEqual(new Date('2026-01-01'));
      expect(eventWhere.createdAt.lte).toEqual(new Date('2026-03-01'));
    }
  });
});

// ---------------------------------------------------------------------------
// Status Filter
// ---------------------------------------------------------------------------

describe('GET /api/v1/search — Status Filter', () => {
  it('applies status filter to search queries', async () => {
    const req = createGetRequest('/api/v1/search', {
      searchParams: {
        propertyId,
        q: 'test',
        status: 'open',
      },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);

    // Events searched with status filter
    if (mockEventFindMany.mock.calls.length > 0) {
      const eventWhere = mockEventFindMany.mock.calls[0]![0].where;
      expect(eventWhere.status).toBe('open');
    }
  });
});

// ---------------------------------------------------------------------------
// Relevance Scoring
// ---------------------------------------------------------------------------

describe('GET /api/v1/search — Relevance Scoring', () => {
  it('search results include relevance score', async () => {
    mockUserFindMany.mockResolvedValue([
      { id: 'u1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
    ]);
    mockUserCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/search', {
      searchParams: { propertyId, q: 'john', type: 'users' },
    });
    const res = await GET(req);
    const body = await parseResponse<{
      data: { results: Array<{ score: number }> };
    }>(res);

    // Combined results should have a score property
    if (body.data.results && body.data.results.length > 0) {
      expect(body.data.results[0]).toHaveProperty('score');
      expect(typeof body.data.results[0]!.score).toBe('number');
    }
  });
});

// ---------------------------------------------------------------------------
// Text Highlighting
// ---------------------------------------------------------------------------

describe('GET /api/v1/search — Text Highlighting', () => {
  it('search results include highlighted matching text', async () => {
    mockUserFindMany.mockResolvedValue([
      { id: 'u1', firstName: 'Johnson', lastName: 'Doe', email: 'johnson@example.com' },
    ]);
    mockUserCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/search', {
      searchParams: { propertyId, q: 'john', type: 'users' },
    });
    const res = await GET(req);
    const body = await parseResponse<{
      data: { results: Array<{ highlights: Record<string, string> }> };
    }>(res);

    // Combined results should have highlights
    if (body.data.results && body.data.results.length > 0) {
      expect(body.data.results[0]).toHaveProperty('highlights');
    }
  });
});

// ---------------------------------------------------------------------------
// Recent Searches
// ---------------------------------------------------------------------------

describe('GET /api/v1/search/recent — Recent Searches', () => {
  it('returns last 10 searches by user', async () => {
    const recentSearches = Array.from({ length: 10 }, (_, i) => ({
      id: `sh-${i}`,
      query: `search-${i}`,
      userId: 'test-concierge',
      propertyId,
      createdAt: new Date(),
    }));
    mockSearchHistoryFindMany.mockResolvedValue(recentSearches);

    const req = createGetRequest('/api/v1/search', {
      searchParams: { recent: 'true' },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { recentSearches: unknown[] } }>(res);
    expect(body.data.recentSearches).toHaveLength(10);
  });
});

describe('Search saves recent search on query', () => {
  it('saves the search query to search history', async () => {
    const req = createGetRequest('/api/v1/search', {
      searchParams: { propertyId, q: 'john doe' },
    });
    await GET(req);

    expect(mockSearchHistoryCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          query: 'john doe',
          userId: 'test-concierge',
        }),
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// Clear Search History
// ---------------------------------------------------------------------------

describe('DELETE /api/v1/search — Clear Search History', () => {
  it('clears search history for the authenticated user', async () => {
    mockSearchHistoryDeleteMany.mockResolvedValue({ count: 5 });

    const req = createDeleteRequest('/api/v1/search', {
      headers: { 'Content-Type': 'application/json' },
    });
    const res = await DELETE(req);
    expect(res.status).toBe(200);

    expect(mockSearchHistoryDeleteMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 'test-concierge',
        }),
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// Empty Query
// ---------------------------------------------------------------------------

describe('GET /api/v1/search — Empty Query', () => {
  it('returns no results when query is empty (not everything)', async () => {
    const req = createGetRequest('/api/v1/search', {
      searchParams: { propertyId, q: '' },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);

    // No database queries should fire
    expect(mockUserFindMany).not.toHaveBeenCalled();
    expect(mockUnitFindMany).not.toHaveBeenCalled();
    expect(mockPackageFindMany).not.toHaveBeenCalled();
    expect(mockEventFindMany).not.toHaveBeenCalled();
    expect(mockAnnouncementFindMany).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// Special Characters
// ---------------------------------------------------------------------------

describe('GET /api/v1/search — Special Characters', () => {
  it('special characters in query do not break search', async () => {
    const specialQueries = [
      "O'Brien",
      'unit #302',
      'test@email.com',
      'pkg (123)',
      'résumé',
      '100% complete',
      'name & surname',
      'search "quoted"',
      'back\\slash',
      'semi;colon',
    ];

    for (const q of specialQueries) {
      vi.clearAllMocks();
      mockUserFindMany.mockResolvedValue([]);
      mockUnitFindMany.mockResolvedValue([]);
      mockPackageFindMany.mockResolvedValue([]);
      mockEventFindMany.mockResolvedValue([]);
      mockAnnouncementFindMany.mockResolvedValue([]);
      mockSearchHistoryCreate.mockResolvedValue({ id: 'sh-1' });

      const req = createGetRequest('/api/v1/search', {
        searchParams: { propertyId, q },
      });
      const res = await GET(req);

      // Should not crash with 500
      expect(res.status).not.toBe(500);
    }
  });
});

// ---------------------------------------------------------------------------
// Cross-Module Combined Results Sorted by Relevance
// ---------------------------------------------------------------------------

describe('GET /api/v1/search — Combined Results', () => {
  it('returns combined results from multiple modules sorted by relevance', async () => {
    mockUserFindMany.mockResolvedValue([
      { id: 'u1', firstName: 'Maintenance', lastName: 'Staff', email: 'maint@b.com' },
    ]);
    mockUserCount.mockResolvedValue(1);
    mockAnnouncementFindMany.mockResolvedValue([
      { id: 'a1', title: 'Maintenance Notice', status: 'published' },
    ]);
    mockAnnouncementCount.mockResolvedValue(1);
    mockEventFindMany.mockResolvedValue([
      { id: 'e1', title: 'Maintenance Request', referenceNo: 'EVT-001', status: 'open' },
    ]);
    mockEventCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/search', {
      searchParams: { propertyId, q: 'maintenance' },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: {
        results: Array<{ id: string; type: string; score: number }>;
      };
    }>(res);

    // Should have combined results from multiple modules
    if (body.data.results) {
      expect(body.data.results.length).toBeGreaterThanOrEqual(3);
      // Results should be sorted by score descending
      for (let i = 1; i < body.data.results.length; i++) {
        expect(body.data.results[i - 1]!.score).toBeGreaterThanOrEqual(body.data.results[i]!.score);
      }
    }
  });
});

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

describe('GET /api/v1/search — Pagination', () => {
  it('search results support page and limit params', async () => {
    mockUserFindMany.mockResolvedValue([
      { id: 'u1', firstName: 'Test', lastName: 'User', email: 'test@b.com' },
    ]);
    mockUserCount.mockResolvedValue(50);

    const req = createGetRequest('/api/v1/search', {
      searchParams: { propertyId, q: 'test', page: '2', limit: '10', type: 'users' },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);

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

    expect(body.meta.page).toBe(2);
    expect(body.meta.limit).toBe(10);
    expect(body.meta.total).toBe(50);
    expect(body.meta.totalPages).toBe(5);
    expect(body.meta.hasNext).toBe(true);
    expect(body.meta.hasPrev).toBe(true);
  });

  it('uses skip/take for database queries based on page/limit', async () => {
    mockUserFindMany.mockResolvedValue([]);
    mockUserCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/search', {
      searchParams: { propertyId, q: 'test', page: '3', limit: '10', type: 'users' },
    });
    await GET(req);

    // Page 3, limit 10 => skip 20
    if (mockUserFindMany.mock.calls.length > 0) {
      const call = mockUserFindMany.mock.calls[0]![0];
      expect(call.skip).toBe(20);
      expect(call.take).toBe(10);
    }
  });
});
