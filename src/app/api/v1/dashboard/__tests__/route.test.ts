/**
 * Dashboard API Tests — KPI calculations with role-aware filtering
 *
 * The dashboard is the first screen staff and residents see.
 * Wrong numbers here erode trust in the entire platform.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createGetRequest, parseResponse } from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Prisma mock — every model the dashboard queries
// ---------------------------------------------------------------------------

const mockPackageCount = vi.fn();
const mockVisitorCount = vi.fn();
const mockMaintenanceCount = vi.fn();
const mockMaintenanceFindMany = vi.fn();
const mockCommunityEventCount = vi.fn();
const mockBookingCount = vi.fn();
const mockAnnouncementCount = vi.fn();
const mockEventFindMany = vi.fn();
const mockOccupancyFindFirst = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    package: {
      count: (...args: unknown[]) => mockPackageCount(...args),
    },
    visitorEntry: {
      count: (...args: unknown[]) => mockVisitorCount(...args),
    },
    maintenanceRequest: {
      count: (...args: unknown[]) => mockMaintenanceCount(...args),
      findMany: (...args: unknown[]) => mockMaintenanceFindMany(...args),
    },
    communityEvent: {
      count: (...args: unknown[]) => mockCommunityEventCount(...args),
    },
    booking: {
      count: (...args: unknown[]) => mockBookingCount(...args),
    },
    announcement: {
      count: (...args: unknown[]) => mockAnnouncementCount(...args),
    },
    event: {
      findMany: (...args: unknown[]) => mockEventFindMany(...args),
    },
    occupancyRecord: {
      findFirst: (...args: unknown[]) => mockOccupancyFindFirst(...args),
    },
  },
}));

// ---------------------------------------------------------------------------
// Auth mock — configurable per test via mockGuardRoute
// ---------------------------------------------------------------------------

const mockGuardRoute = vi.fn();

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: (...args: unknown[]) => mockGuardRoute(...args),
}));

import { GET } from '../route';
import { appCache } from '@/server/cache';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const PROPERTY_A = '00000000-0000-4000-b000-000000000001';
const PROPERTY_B = '00000000-0000-4000-b000-000000000002';
const USER_ID = 'user-resident-1';
const UNIT_ID = 'unit-1501';

interface DashboardResponse {
  data: {
    kpis: Record<string, number>;
    recentActivity: unknown[];
  };
}

function setAuth(overrides: Record<string, unknown> = {}) {
  mockGuardRoute.mockResolvedValue({
    user: {
      userId: 'staff-jones',
      propertyId: PROPERTY_A,
      role: 'front_desk',
      permissions: ['*'],
      mfaVerified: false,
      ...overrides,
    },
    error: null,
  });
}

function defaultMocks() {
  mockPackageCount.mockResolvedValue(0);
  mockVisitorCount.mockResolvedValue(0);
  mockMaintenanceCount.mockResolvedValue(0);
  mockMaintenanceFindMany.mockResolvedValue([]);
  mockCommunityEventCount.mockResolvedValue(0);
  mockBookingCount.mockResolvedValue(0);
  mockAnnouncementCount.mockResolvedValue(0);
  mockEventFindMany.mockResolvedValue([]);
  mockOccupancyFindFirst.mockResolvedValue(null);
}

beforeEach(() => {
  vi.clearAllMocks();
  appCache.clear();
  setAuth();
  defaultMocks();
});

// ---------------------------------------------------------------------------
// 1. Total unreleased packages count
// ---------------------------------------------------------------------------

describe('KPI: unreleased packages', () => {
  it('returns total unreleased packages count', async () => {
    mockPackageCount.mockResolvedValue(7);

    const req = createGetRequest('/api/v1/dashboard', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<DashboardResponse>(res);
    expect(body.data.kpis.unreleasedPackages).toBe(7);

    // Verify the query filters correctly
    const where = mockPackageCount.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_A);
    expect(where.status).toBe('unreleased');
    expect(where.deletedAt).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 2. Active visitors count (departureAt is null)
// ---------------------------------------------------------------------------

describe('KPI: active visitors', () => {
  it('returns active visitors count — only those still in the building', async () => {
    mockVisitorCount.mockResolvedValue(12);

    const req = createGetRequest('/api/v1/dashboard', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await GET(req);
    const body = await parseResponse<DashboardResponse>(res);

    expect(body.data.kpis.activeVisitors).toBe(12);

    // departureAt must be null — only visitors still on-premises
    const where = mockVisitorCount.mock.calls[0]![0].where;
    expect(where.departureAt).toBeNull();
    expect(where.propertyId).toBe(PROPERTY_A);
  });
});

// ---------------------------------------------------------------------------
// 3. Open maintenance requests count
// ---------------------------------------------------------------------------

describe('KPI: open maintenance requests', () => {
  it('returns open maintenance requests count', async () => {
    mockMaintenanceCount.mockResolvedValue(5);

    const req = createGetRequest('/api/v1/dashboard', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await GET(req);
    const body = await parseResponse<DashboardResponse>(res);

    expect(body.data.kpis.openMaintenanceRequests).toBe(5);

    const where = mockMaintenanceCount.mock.calls[0]![0].where;
    expect(where.status).toEqual({ in: ['open', 'in_progress'] });
    expect(where.deletedAt).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 4. Today's events count
// ---------------------------------------------------------------------------

describe('KPI: today events', () => {
  it("returns today's community events count", async () => {
    mockCommunityEventCount.mockResolvedValue(3);

    const req = createGetRequest('/api/v1/dashboard', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await GET(req);
    const body = await parseResponse<DashboardResponse>(res);

    expect(body.data.kpis.todayEvents).toBe(3);

    // Should filter to events happening today
    const where = mockCommunityEventCount.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_A);
    expect(where.startDatetime).toBeDefined();
    expect(where.startDatetime.lte).toBeInstanceOf(Date);
    expect(where.endDatetime).toBeDefined();
    expect(where.endDatetime.gte).toBeInstanceOf(Date);
    expect(where.status).toEqual({ in: ['active', 'in_progress'] });
  });
});

// ---------------------------------------------------------------------------
// 5. Pending booking approvals count
// ---------------------------------------------------------------------------

describe('KPI: pending booking approvals', () => {
  it('returns pending booking approvals count', async () => {
    mockBookingCount.mockResolvedValue(4);

    const req = createGetRequest('/api/v1/dashboard', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await GET(req);
    const body = await parseResponse<DashboardResponse>(res);

    expect(body.data.kpis.pendingBookingApprovals).toBe(4);

    const where = mockBookingCount.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_A);
    expect(where.approvalStatus).toBe('pending');
  });
});

// ---------------------------------------------------------------------------
// 6. Unread announcements count
// ---------------------------------------------------------------------------

describe('KPI: unread announcements', () => {
  it('returns unread published announcements count', async () => {
    mockAnnouncementCount.mockResolvedValue(2);

    const req = createGetRequest('/api/v1/dashboard', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await GET(req);
    const body = await parseResponse<DashboardResponse>(res);

    expect(body.data.kpis.unreadAnnouncements).toBe(2);

    const where = mockAnnouncementCount.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_A);
    expect(where.status).toBe('published');
    expect(where.deletedAt).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 7. Overdue maintenance count (SLA calculation)
// ---------------------------------------------------------------------------

describe('KPI: overdue maintenance', () => {
  it('returns overdue maintenance count using SLA calculation', async () => {
    // First call = open maintenance, second call = overdue maintenance
    mockMaintenanceCount.mockResolvedValueOnce(5).mockResolvedValueOnce(2);

    const req = createGetRequest('/api/v1/dashboard', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await GET(req);
    const body = await parseResponse<DashboardResponse>(res);

    expect(body.data.kpis.overdueMaintenanceRequests).toBe(2);

    // The overdue query should check for items older than SLA threshold
    // and still open
    const overdueCall = mockMaintenanceCount.mock.calls[1]![0];
    expect(overdueCall.where.propertyId).toBe(PROPERTY_A);
    expect(overdueCall.where.status).toEqual({ in: ['open', 'in_progress'] });
    expect(overdueCall.where.createdAt).toBeDefined();
    expect(overdueCall.where.createdAt.lt).toBeInstanceOf(Date);
    expect(overdueCall.where.deletedAt).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 8. Monthly package volume (last 30 days)
// ---------------------------------------------------------------------------

describe('KPI: monthly package volume', () => {
  it('returns package volume for the last 30 days', async () => {
    // First call = unreleased count, second call = monthly volume
    mockPackageCount.mockResolvedValueOnce(7).mockResolvedValueOnce(45);

    const req = createGetRequest('/api/v1/dashboard', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await GET(req);
    const body = await parseResponse<DashboardResponse>(res);

    expect(body.data.kpis.monthlyPackageVolume).toBe(45);

    // Verify the monthly volume query uses a 30-day window
    const monthlyCall = mockPackageCount.mock.calls[1]![0];
    expect(monthlyCall.where.propertyId).toBe(PROPERTY_A);
    expect(monthlyCall.where.createdAt).toBeDefined();
    expect(monthlyCall.where.createdAt.gte).toBeInstanceOf(Date);
    expect(monthlyCall.where.deletedAt).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 9. Maintenance resolution time average
// ---------------------------------------------------------------------------

describe('KPI: maintenance resolution time average', () => {
  it('returns average resolution time in hours for closed requests', async () => {
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);

    mockMaintenanceFindMany.mockResolvedValue([
      { createdAt: fourDaysAgo, completedDate: twoDaysAgo }, // 2 days = 48 hours
      { createdAt: twoDaysAgo, completedDate: now }, // 2 days = 48 hours
    ]);

    const req = createGetRequest('/api/v1/dashboard', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await GET(req);
    const body = await parseResponse<DashboardResponse>(res);

    // Average of 48h and 48h = 48h
    expect(body.data.kpis.avgResolutionTimeHours).toBe(48);

    // Should query recently closed maintenance requests
    const findCall = mockMaintenanceFindMany.mock.calls[0]![0];
    expect(findCall.where.propertyId).toBe(PROPERTY_A);
    expect(findCall.where.status).toBe('closed');
    expect(findCall.where.completedDate).toEqual({ not: null });
  });
});

// ---------------------------------------------------------------------------
// 10. Role-aware: resident sees their unit's KPIs only
// ---------------------------------------------------------------------------

describe('Role-aware: resident', () => {
  it("scopes KPIs to the resident's unit only", async () => {
    setAuth({ userId: USER_ID, role: 'resident_owner' });
    mockOccupancyFindFirst.mockResolvedValue({ unitId: UNIT_ID });
    mockPackageCount.mockResolvedValue(1);
    mockMaintenanceCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/dashboard', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<DashboardResponse>(res);
    // Resident should see their own unit's data
    expect(body.data.kpis.unreleasedPackages).toBe(1);

    // Verify package query includes unitId filter
    const pkgWhere = mockPackageCount.mock.calls[0]![0].where;
    expect(pkgWhere.unitId).toBe(UNIT_ID);
  });
});

// ---------------------------------------------------------------------------
// 11. Role-aware: front desk sees building-wide package/visitor KPIs
// ---------------------------------------------------------------------------

describe('Role-aware: front desk', () => {
  it('sees building-wide package and visitor KPIs without unit scoping', async () => {
    setAuth({ role: 'front_desk' });
    mockPackageCount.mockResolvedValue(15);
    mockVisitorCount.mockResolvedValue(8);

    const req = createGetRequest('/api/v1/dashboard', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await GET(req);
    const body = await parseResponse<DashboardResponse>(res);

    expect(body.data.kpis.unreleasedPackages).toBe(15);
    expect(body.data.kpis.activeVisitors).toBe(8);

    // Front desk queries should NOT have unitId filter
    const pkgWhere = mockPackageCount.mock.calls[0]![0].where;
    expect(pkgWhere.unitId).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 12. Role-aware: property manager sees all KPIs including financial
// ---------------------------------------------------------------------------

describe('Role-aware: property manager', () => {
  it('sees all KPIs including pending booking approvals and overdue maintenance', async () => {
    setAuth({ role: 'property_manager' });
    mockPackageCount.mockResolvedValue(10);
    mockVisitorCount.mockResolvedValue(5);
    mockMaintenanceCount.mockResolvedValueOnce(8).mockResolvedValueOnce(3);
    mockBookingCount.mockResolvedValue(6);
    mockAnnouncementCount.mockResolvedValue(1);
    mockCommunityEventCount.mockResolvedValue(2);
    mockMaintenanceFindMany.mockResolvedValue([]);

    const req = createGetRequest('/api/v1/dashboard', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await GET(req);
    const body = await parseResponse<DashboardResponse>(res);

    // Property manager sees ALL KPIs
    expect(body.data.kpis.unreleasedPackages).toBe(10);
    expect(body.data.kpis.activeVisitors).toBe(5);
    expect(body.data.kpis.openMaintenanceRequests).toBe(8);
    expect(body.data.kpis.pendingBookingApprovals).toBe(6);
    expect(body.data.kpis.overdueMaintenanceRequests).toBe(3);
    expect(body.data.kpis.unreadAnnouncements).toBe(1);
    expect(body.data.kpis.todayEvents).toBe(2);
  });
});

// ---------------------------------------------------------------------------
// 13. Tenant isolation: only returns data for user's property
// ---------------------------------------------------------------------------

describe('Tenant isolation', () => {
  it('only returns data for the requested propertyId — never cross-tenant', async () => {
    setAuth({ propertyId: PROPERTY_A });
    mockPackageCount.mockResolvedValue(3);
    mockVisitorCount.mockResolvedValue(1);
    mockMaintenanceCount.mockResolvedValue(2);

    const req = createGetRequest('/api/v1/dashboard', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET(req);

    // Every single query must include propertyId
    for (const mock of [mockPackageCount, mockVisitorCount]) {
      const calls = mock.mock.calls;
      for (const call of calls) {
        expect(call[0].where.propertyId).toBe(PROPERTY_A);
      }
    }

    // Maintenance count may be called twice (open + overdue)
    for (const call of mockMaintenanceCount.mock.calls) {
      expect(call[0].where.propertyId).toBe(PROPERTY_A);
    }
  });

  it('rejects request without propertyId', async () => {
    const req = createGetRequest('/api/v1/dashboard');
    const res = await GET(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_PROPERTY');
  });
});

// ---------------------------------------------------------------------------
// 14. Returns empty counts (0) for new properties with no data
// ---------------------------------------------------------------------------

describe('Empty property', () => {
  it('returns zero counts for a new property with no data', async () => {
    // All mocks already default to 0 / [] from defaultMocks()

    const req = createGetRequest('/api/v1/dashboard', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<DashboardResponse>(res);
    expect(body.data.kpis.unreleasedPackages).toBe(0);
    expect(body.data.kpis.activeVisitors).toBe(0);
    expect(body.data.kpis.openMaintenanceRequests).toBe(0);
    expect(body.data.kpis.todayEvents).toBe(0);
    expect(body.data.kpis.pendingBookingApprovals).toBe(0);
    expect(body.data.kpis.unreadAnnouncements).toBe(0);
    expect(body.data.kpis.overdueMaintenanceRequests).toBe(0);
    expect(body.data.kpis.monthlyPackageVolume).toBe(0);
    expect(body.data.kpis.avgResolutionTimeHours).toBe(0);
  });
});
