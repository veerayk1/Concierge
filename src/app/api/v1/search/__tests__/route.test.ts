/**
 * Global Search API Route Tests — per PRD 15 Search & Navigation
 *
 * Global search is the primary navigation tool for front desk staff who
 * handle 100+ interactions per shift. A broken search means staff can't
 * find a resident's package, can't locate a unit file, and can't pull
 * up an incident report when a board member asks.
 *
 * Security context: Search results MUST be scoped to the authenticated
 * property. A search that leaks data across properties is a tenant
 * isolation breach.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createGetRequest, parseResponse } from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Mock Setup
// ---------------------------------------------------------------------------

const mockUserFindMany = vi.fn();
const mockUnitFindMany = vi.fn();
const mockPackageFindMany = vi.fn();
const mockEventFindMany = vi.fn();
const mockAnnouncementFindMany = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    user: {
      findMany: (...args: unknown[]) => mockUserFindMany(...args),
    },
    unit: {
      findMany: (...args: unknown[]) => mockUnitFindMany(...args),
    },
    package: {
      findMany: (...args: unknown[]) => mockPackageFindMany(...args),
    },
    event: {
      findMany: (...args: unknown[]) => mockEventFindMany(...args),
    },
    announcement: {
      findMany: (...args: unknown[]) => mockAnnouncementFindMany(...args),
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

import { GET } from '../route';

beforeEach(() => {
  vi.clearAllMocks();
  mockUserFindMany.mockResolvedValue([]);
  mockUnitFindMany.mockResolvedValue([]);
  mockPackageFindMany.mockResolvedValue([]);
  mockEventFindMany.mockResolvedValue([]);
  mockAnnouncementFindMany.mockResolvedValue([]);
});

// ---------------------------------------------------------------------------
// GET /api/v1/search — Tenant Isolation & Input Validation
// ---------------------------------------------------------------------------

describe('GET /api/v1/search — Tenant Isolation', () => {
  it('returns empty results without propertyId — no database queries fired', async () => {
    const req = createGetRequest('/api/v1/search', {
      searchParams: { q: 'test' },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: {
        users: unknown[];
        units: unknown[];
        packages: unknown[];
        events: unknown[];
        announcements: unknown[];
      };
    }>(res);

    // Returns empty categorized results, not an error — UX decision for typeahead
    expect(body.data.users).toEqual([]);
    expect(body.data.units).toEqual([]);
    expect(body.data.packages).toEqual([]);
    expect(body.data.events).toEqual([]);
    expect(body.data.announcements).toEqual([]);

    // No database queries should be made
    expect(mockUserFindMany).not.toHaveBeenCalled();
    expect(mockUnitFindMany).not.toHaveBeenCalled();
    expect(mockPackageFindMany).not.toHaveBeenCalled();
    expect(mockEventFindMany).not.toHaveBeenCalled();
    expect(mockAnnouncementFindMany).not.toHaveBeenCalled();
  });

  it('returns empty results for query shorter than 2 characters — prevents expensive wildcard scans', async () => {
    const req = createGetRequest('/api/v1/search', {
      searchParams: {
        propertyId: '00000000-0000-4000-b000-000000000001',
        q: 'a',
      },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { users: unknown[]; units: unknown[] };
    }>(res);
    expect(body.data.users).toEqual([]);
    expect(body.data.units).toEqual([]);

    // No queries for single-character input
    expect(mockUserFindMany).not.toHaveBeenCalled();
  });

  it('returns empty results when q is missing entirely', async () => {
    const req = createGetRequest('/api/v1/search', {
      searchParams: { propertyId: '00000000-0000-4000-b000-000000000001' },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);

    // No queries fired
    expect(mockUserFindMany).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// GET /api/v1/search — Parallel Search Across Modules
// ---------------------------------------------------------------------------

describe('GET /api/v1/search — Cross-Module Search', () => {
  const propertyId = '00000000-0000-4000-b000-000000000001';

  it('searches across ALL 5 modules in parallel when query is valid', async () => {
    const req = createGetRequest('/api/v1/search', {
      searchParams: { propertyId, q: 'john' },
    });
    await GET(req);

    // All 5 module queries must fire
    expect(mockUserFindMany).toHaveBeenCalledTimes(1);
    expect(mockUnitFindMany).toHaveBeenCalledTimes(1);
    expect(mockPackageFindMany).toHaveBeenCalledTimes(1);
    expect(mockEventFindMany).toHaveBeenCalledTimes(1);
    expect(mockAnnouncementFindMany).toHaveBeenCalledTimes(1);
  });

  it('scopes user search to propertyId via userProperties join — tenant isolation', async () => {
    const req = createGetRequest('/api/v1/search', {
      searchParams: { propertyId, q: 'janet' },
    });
    await GET(req);

    const userWhere = mockUserFindMany.mock.calls[0]![0].where;
    expect(userWhere.deletedAt).toBeNull();
    expect(userWhere.userProperties).toEqual({
      some: { propertyId, deletedAt: null },
    });
  });

  it('searches users across firstName, lastName, and email', async () => {
    const req = createGetRequest('/api/v1/search', {
      searchParams: { propertyId, q: 'janet' },
    });
    await GET(req);

    const userWhere = mockUserFindMany.mock.calls[0]![0].where;
    expect(userWhere.OR).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ firstName: { contains: 'janet', mode: 'insensitive' } }),
        expect.objectContaining({ lastName: { contains: 'janet', mode: 'insensitive' } }),
        expect.objectContaining({ email: { contains: 'janet', mode: 'insensitive' } }),
      ]),
    );
  });

  it('scopes unit search to propertyId directly', async () => {
    const req = createGetRequest('/api/v1/search', {
      searchParams: { propertyId, q: '1501' },
    });
    await GET(req);

    const unitWhere = mockUnitFindMany.mock.calls[0]![0].where;
    expect(unitWhere.propertyId).toBe(propertyId);
    expect(unitWhere.deletedAt).toBeNull();
    expect(unitWhere.number).toEqual({ contains: '1501', mode: 'insensitive' });
  });

  it('searches packages by referenceNumber AND trackingNumber', async () => {
    const req = createGetRequest('/api/v1/search', {
      searchParams: { propertyId, q: 'PKG-123' },
    });
    await GET(req);

    const pkgWhere = mockPackageFindMany.mock.calls[0]![0].where;
    expect(pkgWhere.propertyId).toBe(propertyId);
    expect(pkgWhere.OR).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ referenceNumber: { contains: 'PKG-123', mode: 'insensitive' } }),
        expect.objectContaining({ trackingNumber: { contains: 'PKG-123', mode: 'insensitive' } }),
      ]),
    );
  });

  it('searches events by title AND referenceNo', async () => {
    const req = createGetRequest('/api/v1/search', {
      searchParams: { propertyId, q: 'noise' },
    });
    await GET(req);

    const eventWhere = mockEventFindMany.mock.calls[0]![0].where;
    expect(eventWhere.propertyId).toBe(propertyId);
    expect(eventWhere.OR).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ title: { contains: 'noise', mode: 'insensitive' } }),
        expect.objectContaining({ referenceNo: { contains: 'noise', mode: 'insensitive' } }),
      ]),
    );
  });

  it('searches announcements by title AND body', async () => {
    const req = createGetRequest('/api/v1/search', {
      searchParams: { propertyId, q: 'maintenance' },
    });
    await GET(req);

    const announcementWhere = mockAnnouncementFindMany.mock.calls[0]![0].where;
    expect(announcementWhere.propertyId).toBe(propertyId);
    expect(announcementWhere.OR).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ title: { contains: 'maintenance', mode: 'insensitive' } }),
        expect.objectContaining({ body: { contains: 'maintenance', mode: 'insensitive' } }),
      ]),
    );
  });

  it('excludes soft-deleted records from ALL module searches', async () => {
    const req = createGetRequest('/api/v1/search', {
      searchParams: { propertyId, q: 'test' },
    });
    await GET(req);

    // Every module query must filter out deleted records
    expect(mockUserFindMany.mock.calls[0]![0].where.deletedAt).toBeNull();
    expect(mockUnitFindMany.mock.calls[0]![0].where.deletedAt).toBeNull();
    expect(mockPackageFindMany.mock.calls[0]![0].where.deletedAt).toBeNull();
    expect(mockEventFindMany.mock.calls[0]![0].where.deletedAt).toBeNull();
    expect(mockAnnouncementFindMany.mock.calls[0]![0].where.deletedAt).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// GET /api/v1/search — Result Limiting
// ---------------------------------------------------------------------------

describe('GET /api/v1/search — Result Limiting', () => {
  const propertyId = '00000000-0000-4000-b000-000000000001';

  it('defaults to 5 results per module — prevents overwhelming typeahead dropdown', async () => {
    const req = createGetRequest('/api/v1/search', {
      searchParams: { propertyId, q: 'test' },
    });
    await GET(req);

    // Each module query should use take: 5
    expect(mockUserFindMany.mock.calls[0]![0].take).toBe(5);
    expect(mockUnitFindMany.mock.calls[0]![0].take).toBe(5);
    expect(mockPackageFindMany.mock.calls[0]![0].take).toBe(5);
    expect(mockEventFindMany.mock.calls[0]![0].take).toBe(5);
    expect(mockAnnouncementFindMany.mock.calls[0]![0].take).toBe(5);
  });

  it('respects custom limit parameter', async () => {
    const req = createGetRequest('/api/v1/search', {
      searchParams: { propertyId, q: 'test', limit: '10' },
    });
    await GET(req);

    expect(mockUserFindMany.mock.calls[0]![0].take).toBe(10);
    expect(mockUnitFindMany.mock.calls[0]![0].take).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// GET /api/v1/search — Response Shape
// ---------------------------------------------------------------------------

describe('GET /api/v1/search — Response Shape', () => {
  const propertyId = '00000000-0000-4000-b000-000000000001';

  it('returns categorized results with correct structure', async () => {
    mockUserFindMany.mockResolvedValue([
      { id: 'u1', firstName: 'Janet', lastName: 'Smith', email: 'janet@b.com' },
    ]);
    mockUnitFindMany.mockResolvedValue([{ id: 'unit1', number: '1501', status: 'occupied' }]);
    mockPackageFindMany.mockResolvedValue([]);
    mockEventFindMany.mockResolvedValue([
      { id: 'evt1', title: 'Janet visitor', referenceNo: 'EVT-ABC', status: 'open' },
    ]);
    mockAnnouncementFindMany.mockResolvedValue([]);

    const req = createGetRequest('/api/v1/search', {
      searchParams: { propertyId, q: 'janet' },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: {
        users: { id: string; firstName: string }[];
        units: { id: string; number: string }[];
        packages: unknown[];
        events: { id: string; title: string }[];
        announcements: unknown[];
      };
      meta: { totalResults: number };
    }>(res);

    expect(body.data.users).toHaveLength(1);
    expect(body.data.users[0]!.firstName).toBe('Janet');
    expect(body.data.units).toHaveLength(1);
    expect(body.data.units[0]!.number).toBe('1501');
    expect(body.data.packages).toHaveLength(0);
    expect(body.data.events).toHaveLength(1);
    expect(body.data.announcements).toHaveLength(0);
  });

  it('returns totalResults in meta — sum across all modules', async () => {
    mockUserFindMany.mockResolvedValue([{ id: 'u1' }, { id: 'u2' }]);
    mockUnitFindMany.mockResolvedValue([{ id: 'unit1' }]);
    mockPackageFindMany.mockResolvedValue([{ id: 'p1' }]);
    mockEventFindMany.mockResolvedValue([]);
    mockAnnouncementFindMany.mockResolvedValue([{ id: 'a1' }]);

    const req = createGetRequest('/api/v1/search', {
      searchParams: { propertyId, q: 'test' },
    });
    const res = await GET(req);
    const body = await parseResponse<{ meta: { totalResults: number } }>(res);

    expect(body.meta.totalResults).toBe(5); // 2 + 1 + 1 + 0 + 1
  });

  it('selects only necessary fields — no password hashes, no internal IDs leaked', async () => {
    const req = createGetRequest('/api/v1/search', {
      searchParams: { propertyId, q: 'test' },
    });
    await GET(req);

    // User select should NOT include passwordHash or sensitive fields
    const userSelect = mockUserFindMany.mock.calls[0]![0].select;
    expect(userSelect.id).toBe(true);
    expect(userSelect.firstName).toBe(true);
    expect(userSelect.lastName).toBe(true);
    expect(userSelect.email).toBe(true);
    expect(userSelect.passwordHash).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// GET /api/v1/search — Error Handling
// ---------------------------------------------------------------------------

describe('GET /api/v1/search — Error Handling', () => {
  it('handles database errors without leaking internals', async () => {
    mockUserFindMany.mockRejectedValue(new Error('Connection timeout'));

    const req = createGetRequest('/api/v1/search', {
      searchParams: {
        propertyId: '00000000-0000-4000-b000-000000000001',
        q: 'test',
      },
    });
    const res = await GET(req);

    expect(res.status).toBe(500);
    const body = await parseResponse<{ error: string; message: string }>(res);
    expect(body.error).toBe('INTERNAL_ERROR');
    expect(body.message).not.toContain('Connection timeout');
  });
});
