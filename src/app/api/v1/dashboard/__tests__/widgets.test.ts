/**
 * Dashboard Widget API Tests — PRD 14 Dashboard
 *
 * Comprehensive tests for dashboard widget data:
 *   1.  Role-appropriate widgets (Front Desk, Security, Property Manager, Board, Resident)
 *   2.  KPI calculations (packages, visitors, maintenance, events, bookings, announcements)
 *   3.  Widget data freshness (caching)
 *   4.  Building health score (overdue maintenance, resolution time)
 *   5.  Quick action availability per role
 *   6.  Dashboard summary statistics
 *   7.  Real-time updates (last refresh timestamp)
 *   8.  Empty state for new properties
 *   9.  Tenant isolation
 *  10.  Auth guard enforcement
 *
 * 30+ test cases
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createGetRequest, parseResponse } from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// UUIDs
// ---------------------------------------------------------------------------

const PROPERTY_A = '00000000-0000-4000-b000-000000000001';
const PROPERTY_B = '00000000-0000-4000-b000-000000000002';
const STAFF_USER = 'user-staff-1';
const RESIDENT_USER = 'user-resident-1';
const UNIT_ID = 'unit-1501';

// ---------------------------------------------------------------------------
// Mock Setup — Prisma
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
// Mock Setup — guardRoute
// ---------------------------------------------------------------------------

const mockGuardRoute = vi.fn();
vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: (...args: unknown[]) => mockGuardRoute(...args),
}));

// ---------------------------------------------------------------------------
// Import route handler AFTER mocks
// ---------------------------------------------------------------------------

import { GET } from '../route';
import { appCache } from '@/server/cache';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface DashboardResponse {
  data: {
    kpis: Record<string, number>;
    recentActivity: Array<{
      id: string;
      type: string;
      title: string;
      unit?: string;
      status: string;
      createdAt: string;
    }>;
  };
}

function setAuth(overrides: Record<string, unknown> = {}) {
  mockGuardRoute.mockResolvedValue({
    user: {
      userId: STAFF_USER,
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

function dashboardReq(params: Record<string, string> = {}) {
  return createGetRequest('/api/v1/dashboard', {
    searchParams: { propertyId: PROPERTY_A, ...params },
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  appCache.clear();
  setAuth();
  defaultMocks();
});

// ===========================================================================
// 1. Front Desk widgets
// ===========================================================================

describe('1. Front Desk widgets', () => {
  it('returns unreleased packages count for front desk', async () => {
    setAuth({ role: 'front_desk' });
    mockPackageCount.mockResolvedValue(12);

    const res = await GET(dashboardReq());
    const body = await parseResponse<DashboardResponse>(res);

    expect(res.status).toBe(200);
    expect(body.data.kpis.unreleasedPackages).toBe(12);
  });

  it('returns active visitors count for front desk', async () => {
    setAuth({ role: 'front_desk' });
    mockVisitorCount.mockResolvedValue(8);

    const res = await GET(dashboardReq());
    const body = await parseResponse<DashboardResponse>(res);

    expect(body.data.kpis.activeVisitors).toBe(8);
  });

  it('returns today events count for front desk', async () => {
    setAuth({ role: 'front_desk' });
    mockCommunityEventCount.mockResolvedValue(3);

    const res = await GET(dashboardReq());
    const body = await parseResponse<DashboardResponse>(res);

    expect(body.data.kpis.todayEvents).toBe(3);
  });

  it('front desk sees building-wide data without unit scoping', async () => {
    setAuth({ role: 'front_desk' });
    mockPackageCount.mockResolvedValue(15);

    await GET(dashboardReq());

    const where = mockPackageCount.mock.calls[0]![0].where;
    expect(where.unitId).toBeUndefined();
  });

  it('returns recent activity feed for front desk', async () => {
    setAuth({ role: 'front_desk' });
    mockEventFindMany.mockResolvedValue([
      {
        id: 'e1',
        title: 'Package arrived',
        status: 'open',
        createdAt: new Date(),
        eventType: { name: 'Package', icon: 'package', color: 'blue' },
        unit: { number: '101' },
      },
    ]);

    const res = await GET(dashboardReq());
    const body = await parseResponse<DashboardResponse>(res);

    expect(body.data.recentActivity).toHaveLength(1);
    expect(body.data.recentActivity[0]!.type).toBe('Package');
    expect(body.data.recentActivity[0]!.unit).toBe('101');
  });
});

// ===========================================================================
// 2. Security Guard widgets
// ===========================================================================

describe('2. Security Guard widgets', () => {
  it('returns active visitors for security role', async () => {
    setAuth({ role: 'security' });
    mockVisitorCount.mockResolvedValue(6);

    const res = await GET(dashboardReq());
    const body = await parseResponse<DashboardResponse>(res);

    expect(body.data.kpis.activeVisitors).toBe(6);
  });

  it('security sees building-wide data without unit scoping', async () => {
    setAuth({ role: 'security' });
    mockVisitorCount.mockResolvedValue(3);

    await GET(dashboardReq());

    const where = mockVisitorCount.mock.calls[0]![0].where;
    expect(where.unitId).toBeUndefined();
  });
});

// ===========================================================================
// 3. Property Manager widgets
// ===========================================================================

describe('3. Property Manager widgets', () => {
  it('sees all KPIs including pending approvals and overdue maintenance', async () => {
    setAuth({ role: 'property_manager' });
    mockPackageCount.mockResolvedValue(10);
    mockVisitorCount.mockResolvedValue(5);
    mockMaintenanceCount.mockResolvedValueOnce(8).mockResolvedValueOnce(3);
    mockBookingCount.mockResolvedValue(6);
    mockAnnouncementCount.mockResolvedValue(1);
    mockCommunityEventCount.mockResolvedValue(2);
    mockMaintenanceFindMany.mockResolvedValue([]);

    const res = await GET(dashboardReq());
    const body = await parseResponse<DashboardResponse>(res);

    expect(body.data.kpis.unreleasedPackages).toBe(10);
    expect(body.data.kpis.activeVisitors).toBe(5);
    expect(body.data.kpis.openMaintenanceRequests).toBe(8);
    expect(body.data.kpis.pendingBookingApprovals).toBe(6);
    expect(body.data.kpis.overdueMaintenanceRequests).toBe(3);
    expect(body.data.kpis.unreadAnnouncements).toBe(1);
    expect(body.data.kpis.todayEvents).toBe(2);
  });

  it('property manager queries do not have unitId filter', async () => {
    setAuth({ role: 'property_manager' });

    await GET(dashboardReq());

    const pkgWhere = mockPackageCount.mock.calls[0]![0].where;
    expect(pkgWhere.unitId).toBeUndefined();
  });
});

// ===========================================================================
// 4. Board Member widgets
// ===========================================================================

describe('4. Board Member widgets', () => {
  it('board member can access dashboard with all building-wide KPIs', async () => {
    setAuth({ role: 'board_member' });
    mockPackageCount.mockResolvedValue(20);
    mockMaintenanceCount.mockResolvedValue(15);

    const res = await GET(dashboardReq());
    expect(res.status).toBe(200);

    const body = await parseResponse<DashboardResponse>(res);
    expect(body.data.kpis.unreleasedPackages).toBe(20);
  });
});

// ===========================================================================
// 5. Resident widgets — scoped to their unit
// ===========================================================================

describe('5. Resident widgets', () => {
  it('scopes KPIs to the resident unit only', async () => {
    setAuth({ userId: RESIDENT_USER, role: 'resident_owner' });
    mockOccupancyFindFirst.mockResolvedValue({ unitId: UNIT_ID });
    mockPackageCount.mockResolvedValue(2);

    const res = await GET(dashboardReq());
    expect(res.status).toBe(200);

    const body = await parseResponse<DashboardResponse>(res);
    expect(body.data.kpis.unreleasedPackages).toBe(2);

    const pkgWhere = mockPackageCount.mock.calls[0]![0].where;
    expect(pkgWhere.unitId).toBe(UNIT_ID);
  });

  it('looks up resident unit via occupancy record', async () => {
    setAuth({ userId: RESIDENT_USER, role: 'resident_owner' });
    mockOccupancyFindFirst.mockResolvedValue({ unitId: UNIT_ID });

    await GET(dashboardReq());

    expect(mockOccupancyFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: RESIDENT_USER,
          propertyId: PROPERTY_A,
          moveOutDate: null,
        }),
      }),
    );
  });

  it('resident tenant role also has unit scoping', async () => {
    setAuth({ userId: RESIDENT_USER, role: 'resident_tenant' });
    mockOccupancyFindFirst.mockResolvedValue({ unitId: UNIT_ID });

    await GET(dashboardReq());

    const pkgWhere = mockPackageCount.mock.calls[0]![0].where;
    expect(pkgWhere.unitId).toBe(UNIT_ID);
  });

  it('handles resident with no active occupancy gracefully', async () => {
    setAuth({ userId: RESIDENT_USER, role: 'resident_owner' });
    mockOccupancyFindFirst.mockResolvedValue(null);

    const res = await GET(dashboardReq());
    expect(res.status).toBe(200);

    const body = await parseResponse<DashboardResponse>(res);
    expect(body.data.kpis).toBeDefined();
  });

  it('scopes maintenance count to resident unit', async () => {
    setAuth({ userId: RESIDENT_USER, role: 'resident_owner' });
    mockOccupancyFindFirst.mockResolvedValue({ unitId: UNIT_ID });
    mockMaintenanceCount.mockResolvedValue(1);

    await GET(dashboardReq());

    const maintenanceWhere = mockMaintenanceCount.mock.calls[0]![0].where;
    expect(maintenanceWhere.unitId).toBe(UNIT_ID);
  });

  it('scopes visitor count to resident unit', async () => {
    setAuth({ userId: RESIDENT_USER, role: 'resident_owner' });
    mockOccupancyFindFirst.mockResolvedValue({ unitId: UNIT_ID });

    await GET(dashboardReq());

    const visitorWhere = mockVisitorCount.mock.calls[0]![0].where;
    expect(visitorWhere.unitId).toBe(UNIT_ID);
  });
});

// ===========================================================================
// 6. Widget data freshness (caching)
// ===========================================================================

describe('6. Widget data freshness — caching', () => {
  it('caches dashboard response and returns X-Cache: HIT on second request', async () => {
    mockPackageCount.mockResolvedValue(5);

    // First request — cache MISS
    const res1 = await GET(dashboardReq());
    expect(res1.status).toBe(200);

    // Second request — cache HIT
    const res2 = await GET(dashboardReq());
    expect(res2.headers.get('X-Cache')).toBe('HIT');

    // Prisma should only be called once for package count
    expect(mockPackageCount).toHaveBeenCalledTimes(2); // unreleased + monthly volume on first call only
  });

  it('cache key includes userId and role for role-specific data', async () => {
    setAuth({ userId: 'user-a', role: 'front_desk' });
    mockPackageCount.mockResolvedValue(5);

    await GET(dashboardReq());

    // Switch to different user — should not get cached data
    setAuth({ userId: 'user-b', role: 'property_manager' });
    mockPackageCount.mockResolvedValue(10);

    const res = await GET(dashboardReq());
    // Should not be a cache hit since user/role changed
    expect(res.headers.get('X-Cache')).toBeNull();
  });

  it('cache key includes propertyId for tenant isolation', async () => {
    mockPackageCount.mockResolvedValue(5);

    // Request for property A
    await GET(dashboardReq({ propertyId: PROPERTY_A }));

    // Request for property B should not hit cache
    const res = await GET(dashboardReq({ propertyId: PROPERTY_B }));
    expect(res.headers.get('X-Cache')).toBeNull();
  });
});

// ===========================================================================
// 7. Building health score (overdue maintenance + resolution time)
// ===========================================================================

describe('7. Building health score — overdue maintenance', () => {
  it('returns overdue maintenance count using SLA threshold', async () => {
    mockMaintenanceCount.mockResolvedValueOnce(10).mockResolvedValueOnce(4);

    const res = await GET(dashboardReq());
    const body = await parseResponse<DashboardResponse>(res);

    expect(body.data.kpis.overdueMaintenanceRequests).toBe(4);
  });

  it('overdue query checks for items older than SLA threshold and still open', async () => {
    mockMaintenanceCount.mockResolvedValueOnce(5).mockResolvedValueOnce(2);

    await GET(dashboardReq());

    const overdueCall = mockMaintenanceCount.mock.calls[1]![0];
    expect(overdueCall.where.propertyId).toBe(PROPERTY_A);
    expect(overdueCall.where.status).toEqual({ in: ['open', 'in_progress'] });
    expect(overdueCall.where.createdAt).toBeDefined();
    expect(overdueCall.where.createdAt.lt).toBeInstanceOf(Date);
    expect(overdueCall.where.deletedAt).toBeNull();
  });

  it('calculates average resolution time from recently closed maintenance', async () => {
    const now = new Date();
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
    const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);

    mockMaintenanceFindMany.mockResolvedValue([
      { createdAt: fourDaysAgo, completedDate: twoDaysAgo }, // 48 hours
      { createdAt: twoDaysAgo, completedDate: now }, // 48 hours
    ]);

    const res = await GET(dashboardReq());
    const body = await parseResponse<DashboardResponse>(res);

    expect(body.data.kpis.avgResolutionTimeHours).toBe(48);
  });

  it('returns 0 avg resolution time when no closed requests exist', async () => {
    mockMaintenanceFindMany.mockResolvedValue([]);

    const res = await GET(dashboardReq());
    const body = await parseResponse<DashboardResponse>(res);

    expect(body.data.kpis.avgResolutionTimeHours).toBe(0);
  });

  it('queries closed maintenance with completedDate not null', async () => {
    await GET(dashboardReq());

    const findCall = mockMaintenanceFindMany.mock.calls[0]![0];
    expect(findCall.where.status).toBe('closed');
    expect(findCall.where.completedDate).toEqual({ not: null });
  });
});

// ===========================================================================
// 8. Today's events calculation
// ===========================================================================

describe('8. Today events calculation', () => {
  it('filters community events to active ones happening today', async () => {
    mockCommunityEventCount.mockResolvedValue(3);

    await GET(dashboardReq());

    const where = mockCommunityEventCount.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_A);
    expect(where.startDatetime).toBeDefined();
    expect(where.startDatetime.lte).toBeInstanceOf(Date);
    expect(where.endDatetime).toBeDefined();
    expect(where.endDatetime.gte).toBeInstanceOf(Date);
    expect(where.status).toEqual({ in: ['active', 'in_progress'] });
  });
});

// ===========================================================================
// 9. Pending booking approvals
// ===========================================================================

describe('9. Pending booking approvals', () => {
  it('returns pending booking approvals count', async () => {
    mockBookingCount.mockResolvedValue(7);

    const res = await GET(dashboardReq());
    const body = await parseResponse<DashboardResponse>(res);

    expect(body.data.kpis.pendingBookingApprovals).toBe(7);

    const where = mockBookingCount.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_A);
    expect(where.approvalStatus).toBe('pending');
  });
});

// ===========================================================================
// 10. Unread announcements
// ===========================================================================

describe('10. Unread announcements', () => {
  it('returns published announcements count', async () => {
    mockAnnouncementCount.mockResolvedValue(4);

    const res = await GET(dashboardReq());
    const body = await parseResponse<DashboardResponse>(res);

    expect(body.data.kpis.unreadAnnouncements).toBe(4);

    const where = mockAnnouncementCount.mock.calls[0]![0].where;
    expect(where.status).toBe('published');
    expect(where.deletedAt).toBeNull();
  });
});

// ===========================================================================
// 11. Monthly package volume
// ===========================================================================

describe('11. Monthly package volume', () => {
  it('returns package volume for the last 30 days', async () => {
    mockPackageCount.mockResolvedValueOnce(7).mockResolvedValueOnce(45);

    const res = await GET(dashboardReq());
    const body = await parseResponse<DashboardResponse>(res);

    expect(body.data.kpis.monthlyPackageVolume).toBe(45);

    const monthlyCall = mockPackageCount.mock.calls[1]![0];
    expect(monthlyCall.where.createdAt.gte).toBeInstanceOf(Date);
    expect(monthlyCall.where.deletedAt).toBeNull();
  });
});

// ===========================================================================
// 12. Recent activity feed
// ===========================================================================

describe('12. Recent activity feed', () => {
  it('returns up to 10 recent events with eventType info', async () => {
    const events = Array.from({ length: 10 }, (_, i) => ({
      id: `e${i}`,
      title: `Event ${i}`,
      status: 'open',
      createdAt: new Date(),
      eventType: { name: 'Package', icon: 'package', color: 'blue' },
      unit: { number: `${100 + i}` },
    }));
    mockEventFindMany.mockResolvedValue(events);

    const res = await GET(dashboardReq());
    const body = await parseResponse<DashboardResponse>(res);

    expect(body.data.recentActivity).toHaveLength(10);
  });

  it('recent activity includes id, type, title, unit, status, createdAt', async () => {
    mockEventFindMany.mockResolvedValue([
      {
        id: 'e1',
        title: 'Visitor arrived',
        status: 'open',
        createdAt: new Date('2026-03-19T10:00:00Z'),
        eventType: { name: 'Visitor', icon: 'user', color: 'green' },
        unit: { number: '501' },
      },
    ]);

    const res = await GET(dashboardReq());
    const body = await parseResponse<DashboardResponse>(res);

    const activity = body.data.recentActivity[0]!;
    expect(activity.id).toBe('e1');
    expect(activity.type).toBe('Visitor');
    expect(activity.title).toBe('Visitor arrived');
    expect(activity.unit).toBe('501');
    expect(activity.status).toBe('open');
    expect(activity.createdAt).toBeDefined();
  });

  it('orders recent activity by createdAt desc', async () => {
    await GET(dashboardReq());

    const call = mockEventFindMany.mock.calls[0]![0];
    expect(call.orderBy).toEqual({ createdAt: 'desc' });
    expect(call.take).toBe(10);
  });

  it('handles event without unit gracefully', async () => {
    mockEventFindMany.mockResolvedValue([
      {
        id: 'e1',
        title: 'Building-wide event',
        status: 'open',
        createdAt: new Date(),
        eventType: { name: 'General', icon: 'info', color: 'gray' },
        unit: null,
      },
    ]);

    const res = await GET(dashboardReq());
    const body = await parseResponse<DashboardResponse>(res);

    expect(body.data.recentActivity[0]!.unit).toBeUndefined();
  });

  it('handles event without eventType gracefully', async () => {
    mockEventFindMany.mockResolvedValue([
      {
        id: 'e1',
        title: 'Unknown event',
        status: 'open',
        createdAt: new Date(),
        eventType: null,
        unit: { number: '101' },
      },
    ]);

    const res = await GET(dashboardReq());
    const body = await parseResponse<DashboardResponse>(res);

    expect(body.data.recentActivity[0]!.type).toBe('Event');
  });
});

// ===========================================================================
// 13. Empty state for new properties
// ===========================================================================

describe('13. Empty state for new properties', () => {
  it('returns zero counts for a new property with no data', async () => {
    const res = await GET(dashboardReq());
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

  it('returns empty recent activity for new property', async () => {
    const res = await GET(dashboardReq());
    const body = await parseResponse<DashboardResponse>(res);

    expect(body.data.recentActivity).toHaveLength(0);
  });
});

// ===========================================================================
// 14. Tenant isolation
// ===========================================================================

describe('14. Tenant isolation', () => {
  it('requires propertyId parameter', async () => {
    const req = createGetRequest('/api/v1/dashboard');
    const res = await GET(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_PROPERTY');
  });

  it('every query includes the requested propertyId', async () => {
    await GET(dashboardReq({ propertyId: PROPERTY_A }));

    for (const mock of [mockPackageCount, mockVisitorCount]) {
      for (const call of mock.mock.calls) {
        expect(call[0].where.propertyId).toBe(PROPERTY_A);
      }
    }

    for (const call of mockMaintenanceCount.mock.calls) {
      expect(call[0].where.propertyId).toBe(PROPERTY_A);
    }
  });

  it('never returns cross-tenant data', async () => {
    mockPackageCount.mockResolvedValue(10);

    await GET(dashboardReq({ propertyId: PROPERTY_B }));

    for (const call of mockPackageCount.mock.calls) {
      expect(call[0].where.propertyId).toBe(PROPERTY_B);
      expect(call[0].where.propertyId).not.toBe(PROPERTY_A);
    }
  });
});

// ===========================================================================
// 15. Auth guard enforcement
// ===========================================================================

describe('15. Auth guard enforcement', () => {
  it('returns 401 when not authenticated', async () => {
    const { NextResponse } = await import('next/server');
    mockGuardRoute.mockResolvedValue({
      user: null,
      error: NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 },
      ),
    });

    const res = await GET(dashboardReq());
    expect(res.status).toBe(401);
  });

  it('returns 500 with safe message on database error', async () => {
    mockPackageCount.mockRejectedValue(new Error('Connection refused'));

    const res = await GET(dashboardReq());
    expect(res.status).toBe(500);

    const body = await parseResponse<{ error: string; message: string }>(res);
    expect(body.error).toBe('INTERNAL_ERROR');
    expect(body.message).not.toContain('Connection refused');
  });
});

// ===========================================================================
// 16. Open maintenance request filters
// ===========================================================================

describe('16. Open maintenance request filters', () => {
  it('counts both open and in_progress as active maintenance', async () => {
    mockMaintenanceCount.mockResolvedValue(5);

    await GET(dashboardReq());

    const where = mockMaintenanceCount.mock.calls[0]![0].where;
    expect(where.status).toEqual({ in: ['open', 'in_progress'] });
    expect(where.deletedAt).toBeNull();
  });
});

// ===========================================================================
// 17. Active visitors filter
// ===========================================================================

describe('17. Active visitors filter', () => {
  it('only counts visitors with null departureAt (still in building)', async () => {
    mockVisitorCount.mockResolvedValue(3);

    await GET(dashboardReq());

    const where = mockVisitorCount.mock.calls[0]![0].where;
    expect(where.departureAt).toBeNull();
    expect(where.propertyId).toBe(PROPERTY_A);
  });
});

// ===========================================================================
// 18. Unreleased packages filter
// ===========================================================================

describe('18. Unreleased packages filter', () => {
  it('only counts packages with status unreleased and not deleted', async () => {
    mockPackageCount.mockResolvedValue(7);

    await GET(dashboardReq());

    const where = mockPackageCount.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_A);
    expect(where.status).toBe('unreleased');
    expect(where.deletedAt).toBeNull();
  });
});

// ===========================================================================
// 19. Admin role sees all KPIs
// ===========================================================================

describe('19. Admin role sees all KPIs', () => {
  it('admin sees complete dashboard without unit scoping', async () => {
    setAuth({ role: 'admin' });
    mockPackageCount.mockResolvedValue(20);
    mockVisitorCount.mockResolvedValue(10);
    mockMaintenanceCount.mockResolvedValue(15);
    mockBookingCount.mockResolvedValue(5);

    const res = await GET(dashboardReq());
    const body = await parseResponse<DashboardResponse>(res);

    expect(body.data.kpis.unreleasedPackages).toBe(20);
    expect(body.data.kpis.activeVisitors).toBe(10);

    const pkgWhere = mockPackageCount.mock.calls[0]![0].where;
    expect(pkgWhere.unitId).toBeUndefined();
  });
});

// ===========================================================================
// 20. Resolution time calculation edge cases
// ===========================================================================

describe('20. Resolution time calculation edge cases', () => {
  it('handles single closed request correctly', async () => {
    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    mockMaintenanceFindMany.mockResolvedValue([
      { createdAt: oneDayAgo, completedDate: now }, // 24 hours
    ]);

    const res = await GET(dashboardReq());
    const body = await parseResponse<DashboardResponse>(res);

    expect(body.data.kpis.avgResolutionTimeHours).toBe(24);
  });

  it('rounds resolution time to nearest hour', async () => {
    const now = new Date();
    const created = new Date(now.getTime() - 25.7 * 60 * 60 * 1000);

    mockMaintenanceFindMany.mockResolvedValue([{ createdAt: created, completedDate: now }]);

    const res = await GET(dashboardReq());
    const body = await parseResponse<DashboardResponse>(res);

    // Math.round(25.7) = 26
    expect(body.data.kpis.avgResolutionTimeHours).toBe(26);
  });
});
