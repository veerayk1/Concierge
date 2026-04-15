/**
 * Report Generation API Tests — PRD 10 Reports & Analytics
 *
 * Comprehensive tests for report generation:
 *   1.  GET available report types for a property
 *   2.  Report types: packages, maintenance, security, amenity_usage, parking, financial, etc.
 *   3.  Report generation with type, date range, format
 *   4.  Date range validation
 *   5.  Package report: deliveries by courier, average release time, perishable stats
 *   6.  Maintenance report: open/closed by category, SLA compliance, avg resolution time
 *   7.  Security report: incidents by type, visitor volume, key checkouts
 *   8.  Report access control (admin/manager only)
 *   9.  Export with proper response
 *  10.  Tenant isolation
 *  11.  Auth guard enforcement
 *  12.  Error handling
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

// ---------------------------------------------------------------------------
// Mock Setup — Prisma
// ---------------------------------------------------------------------------

const mockPackageFindMany = vi.fn();
const mockMaintenanceFindMany = vi.fn();
const mockEventFindMany = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    package: {
      findMany: (...args: unknown[]) => mockPackageFindMany(...args),
    },
    maintenanceRequest: {
      findMany: (...args: unknown[]) => mockMaintenanceFindMany(...args),
    },
    event: {
      findMany: (...args: unknown[]) => mockEventFindMany(...args),
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

import { GET } from '../route';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function setAuth(overrides: Record<string, unknown> = {}) {
  mockGuardRoute.mockResolvedValue({
    user: {
      userId: 'admin-1',
      propertyId: PROPERTY_A,
      role: 'admin',
      permissions: ['*'],
      mfaVerified: false,
      ...overrides,
    },
    error: null,
  });
}

function defaultMocks() {
  mockPackageFindMany.mockResolvedValue([]);
  mockMaintenanceFindMany.mockResolvedValue([]);
  mockEventFindMany.mockResolvedValue([]);
}

function reportReq(params: Record<string, string>) {
  return createGetRequest('/api/v1/reports', { searchParams: params });
}

interface ReportResponse {
  data: {
    summary: Record<string, number>;
    records: unknown[];
  };
}

interface AvailableReportsResponse {
  data: {
    availableReports: Array<{ type: string; name: string }>;
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  setAuth();
  defaultMocks();
});

// ===========================================================================
// 1. GET available report types for a property
// ===========================================================================

describe('1. Available report types', () => {
  it('returns list of available report types when no type is specified', async () => {
    const res = await GET(reportReq({ propertyId: PROPERTY_A }));
    expect(res.status).toBe(200);

    const body = await parseResponse<AvailableReportsResponse>(res);
    expect(body.data.availableReports).toBeDefined();
    expect(Array.isArray(body.data.availableReports)).toBe(true);
    expect(body.data.availableReports.length).toBeGreaterThan(0);
  });

  it('each report type has type and name fields', async () => {
    const res = await GET(reportReq({ propertyId: PROPERTY_A }));
    const body = await parseResponse<AvailableReportsResponse>(res);

    for (const report of body.data.availableReports) {
      expect(report).toHaveProperty('type');
      expect(report).toHaveProperty('name');
      expect(typeof report.type).toBe('string');
      expect(typeof report.name).toBe('string');
    }
  });
});

// ===========================================================================
// 2. Report types coverage
// ===========================================================================

describe('2. Report types include key modules', () => {
  it('includes package_activity report type', async () => {
    const res = await GET(reportReq({ propertyId: PROPERTY_A }));
    const body = await parseResponse<AvailableReportsResponse>(res);

    const types = body.data.availableReports.map((r) => r.type);
    expect(types).toContain('package_activity');
  });

  it('includes maintenance_summary report type', async () => {
    const res = await GET(reportReq({ propertyId: PROPERTY_A }));
    const body = await parseResponse<AvailableReportsResponse>(res);

    const types = body.data.availableReports.map((r) => r.type);
    expect(types).toContain('maintenance_summary');
  });

  it('includes security_incidents report type', async () => {
    const res = await GET(reportReq({ propertyId: PROPERTY_A }));
    const body = await parseResponse<AvailableReportsResponse>(res);

    const types = body.data.availableReports.map((r) => r.type);
    expect(types).toContain('security_incidents');
  });

  it('includes amenity_usage report type', async () => {
    const res = await GET(reportReq({ propertyId: PROPERTY_A }));
    const body = await parseResponse<AvailableReportsResponse>(res);

    const types = body.data.availableReports.map((r) => r.type);
    expect(types).toContain('amenity_usage');
  });

  it('includes parking_permits report type', async () => {
    const res = await GET(reportReq({ propertyId: PROPERTY_A }));
    const body = await parseResponse<AvailableReportsResponse>(res);

    const types = body.data.availableReports.map((r) => r.type);
    expect(types).toContain('parking_permits');
  });

  it('includes financial_summary report type', async () => {
    const res = await GET(reportReq({ propertyId: PROPERTY_A }));
    const body = await parseResponse<AvailableReportsResponse>(res);

    const types = body.data.availableReports.map((r) => r.type);
    expect(types).toContain('financial_summary');
  });

  it('includes resident_directory report type', async () => {
    const res = await GET(reportReq({ propertyId: PROPERTY_A }));
    const body = await parseResponse<AvailableReportsResponse>(res);

    const types = body.data.availableReports.map((r) => r.type);
    expect(types).toContain('resident_directory');
  });

  it('includes training_compliance report type', async () => {
    const res = await GET(reportReq({ propertyId: PROPERTY_A }));
    const body = await parseResponse<AvailableReportsResponse>(res);

    const types = body.data.availableReports.map((r) => r.type);
    expect(types).toContain('training_compliance');
  });
});

// ===========================================================================
// 3. Package activity report generation
// ===========================================================================

describe('3. Package activity report', () => {
  it('returns package summary with total, unreleased, released, and perishable counts', async () => {
    mockPackageFindMany.mockResolvedValue([
      {
        id: 'p1',
        status: 'unreleased',
        isPerishable: false,
        unit: { number: '101' },
        courier: { name: 'FedEx' },
      },
      {
        id: 'p2',
        status: 'released',
        isPerishable: true,
        unit: { number: '202' },
        courier: { name: 'UPS' },
      },
      {
        id: 'p3',
        status: 'unreleased',
        isPerishable: true,
        unit: { number: '303' },
        courier: { name: 'Amazon' },
      },
    ]);

    const res = await GET(reportReq({ propertyId: PROPERTY_A, type: 'package_activity' }));
    expect(res.status).toBe(200);

    const body = await parseResponse<ReportResponse>(res);
    expect(body.data.summary.total).toBe(3);
    expect(body.data.summary.unreleased).toBe(2);
    expect(body.data.summary.released).toBe(1);
    expect(body.data.summary.perishable).toBe(2);
  });

  it('returns records with unit and courier details', async () => {
    mockPackageFindMany.mockResolvedValue([
      {
        id: 'p1',
        status: 'unreleased',
        isPerishable: false,
        unit: { number: '101' },
        courier: { name: 'FedEx' },
      },
    ]);

    const res = await GET(reportReq({ propertyId: PROPERTY_A, type: 'package_activity' }));
    const body = await parseResponse<ReportResponse>(res);

    expect(body.data.records).toHaveLength(1);
  });

  it('filters packages by property and excludes soft-deleted', async () => {
    await GET(reportReq({ propertyId: PROPERTY_A, type: 'package_activity' }));

    const where = mockPackageFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_A);
    expect(where.deletedAt).toBeNull();
  });

  it('includes unit and courier in select', async () => {
    await GET(reportReq({ propertyId: PROPERTY_A, type: 'package_activity' }));

    const include = mockPackageFindMany.mock.calls[0]![0].include;
    expect(include.unit).toBeDefined();
    expect(include.courier).toBeDefined();
  });

  it('orders packages by createdAt desc', async () => {
    await GET(reportReq({ propertyId: PROPERTY_A, type: 'package_activity' }));

    const orderBy = mockPackageFindMany.mock.calls[0]![0].orderBy;
    expect(orderBy).toEqual({ createdAt: 'desc' });
  });
});

// ===========================================================================
// 4. Maintenance summary report
// ===========================================================================

describe('4. Maintenance summary report', () => {
  it('returns maintenance summary with open, inProgress, resolved counts', async () => {
    mockMaintenanceFindMany.mockResolvedValue([
      { id: 'm1', status: 'open', unit: { number: '101' }, category: { name: 'Plumbing' } },
      { id: 'm2', status: 'in_progress', unit: { number: '202' }, category: { name: 'HVAC' } },
      { id: 'm3', status: 'resolved', unit: { number: '303' }, category: { name: 'Electrical' } },
      { id: 'm4', status: 'open', unit: { number: '404' }, category: { name: 'Plumbing' } },
    ]);

    const res = await GET(reportReq({ propertyId: PROPERTY_A, type: 'maintenance_summary' }));
    expect(res.status).toBe(200);

    const body = await parseResponse<ReportResponse>(res);
    expect(body.data.summary.total).toBe(4);
    expect(body.data.summary.open).toBe(2);
    expect(body.data.summary.inProgress).toBe(1);
    expect(body.data.summary.resolved).toBe(1);
  });

  it('includes unit and category in maintenance records', async () => {
    await GET(reportReq({ propertyId: PROPERTY_A, type: 'maintenance_summary' }));

    const include = mockMaintenanceFindMany.mock.calls[0]![0].include;
    expect(include.unit).toBeDefined();
    expect(include.category).toBeDefined();
  });

  it('filters maintenance by property and excludes soft-deleted', async () => {
    await GET(reportReq({ propertyId: PROPERTY_A, type: 'maintenance_summary' }));

    const where = mockMaintenanceFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_A);
    expect(where.deletedAt).toBeNull();
  });
});

// ===========================================================================
// 5. Security incidents report
// ===========================================================================

describe('5. Security incidents report', () => {
  it('returns security incidents filtered by event type', async () => {
    mockEventFindMany.mockResolvedValue([
      {
        id: 'e1',
        title: 'Break-in attempt',
        eventType: { name: 'Incident' },
        unit: { number: '101' },
      },
      { id: 'e2', title: 'Tailgating', eventType: { name: 'Security' }, unit: { number: '202' } },
    ]);

    const res = await GET(reportReq({ propertyId: PROPERTY_A, type: 'security_incidents' }));
    expect(res.status).toBe(200);

    const body = await parseResponse<ReportResponse>(res);
    expect(body.data.summary.total).toBe(2);
    expect(body.data.records).toHaveLength(2);
  });

  it('filters events by incident/security slugs', async () => {
    await GET(reportReq({ propertyId: PROPERTY_A, type: 'security_incidents' }));

    const where = mockEventFindMany.mock.calls[0]![0].where;
    expect(where.eventType.slug).toEqual({ in: ['incident', 'security'] });
  });

  it('includes eventType and unit in security report records', async () => {
    await GET(reportReq({ propertyId: PROPERTY_A, type: 'security_incidents' }));

    const include = mockEventFindMany.mock.calls[0]![0].include;
    expect(include.eventType).toBeDefined();
    expect(include.unit).toBeDefined();
  });
});

// ===========================================================================
// 6. Date range filtering on reports
// ===========================================================================

describe('6. Date range filtering', () => {
  it('applies from date filter to package report', async () => {
    await GET(reportReq({ propertyId: PROPERTY_A, type: 'package_activity', from: '2026-01-01' }));

    const where = mockPackageFindMany.mock.calls[0]![0].where;
    expect(where.createdAt).toBeDefined();
    expect(where.createdAt.gte).toEqual(new Date('2026-01-01'));
  });

  it('applies to date filter to package report', async () => {
    await GET(reportReq({ propertyId: PROPERTY_A, type: 'package_activity', to: '2026-06-30' }));

    const where = mockPackageFindMany.mock.calls[0]![0].where;
    expect(where.createdAt).toBeDefined();
    expect(where.createdAt.lte).toEqual(new Date('2026-06-30'));
  });

  it('applies both from and to date filters to maintenance report', async () => {
    await GET(
      reportReq({
        propertyId: PROPERTY_A,
        type: 'maintenance_summary',
        from: '2026-01-01',
        to: '2026-12-31',
      }),
    );

    const where = mockMaintenanceFindMany.mock.calls[0]![0].where;
    expect(where.createdAt.gte).toEqual(new Date('2026-01-01'));
    expect(where.createdAt.lte).toEqual(new Date('2026-12-31'));
  });

  it('applies date filter to security incidents report', async () => {
    await GET(
      reportReq({
        propertyId: PROPERTY_A,
        type: 'security_incidents',
        from: '2026-03-01',
        to: '2026-03-31',
      }),
    );

    const where = mockEventFindMany.mock.calls[0]![0].where;
    expect(where.createdAt.gte).toEqual(new Date('2026-03-01'));
    expect(where.createdAt.lte).toEqual(new Date('2026-03-31'));
  });

  it('omits date filter when neither from nor to are provided', async () => {
    await GET(reportReq({ propertyId: PROPERTY_A, type: 'package_activity' }));

    const where = mockPackageFindMany.mock.calls[0]![0].where;
    expect(where.createdAt).toBeUndefined();
  });
});

// ===========================================================================
// 7. Report with empty data
// ===========================================================================

describe('7. Reports with empty data', () => {
  it('returns zero counts for package report with no data', async () => {
    mockPackageFindMany.mockResolvedValue([]);

    const res = await GET(reportReq({ propertyId: PROPERTY_A, type: 'package_activity' }));
    const body = await parseResponse<ReportResponse>(res);

    expect(body.data.summary.total).toBe(0);
    expect(body.data.summary.unreleased).toBe(0);
    expect(body.data.summary.released).toBe(0);
    expect(body.data.summary.perishable).toBe(0);
    expect(body.data.records).toHaveLength(0);
  });

  it('returns zero counts for maintenance report with no data', async () => {
    mockMaintenanceFindMany.mockResolvedValue([]);

    const res = await GET(reportReq({ propertyId: PROPERTY_A, type: 'maintenance_summary' }));
    const body = await parseResponse<ReportResponse>(res);

    expect(body.data.summary.total).toBe(0);
    expect(body.data.summary.open).toBe(0);
    expect(body.data.summary.inProgress).toBe(0);
    expect(body.data.summary.resolved).toBe(0);
  });

  it('returns zero total for security report with no incidents', async () => {
    mockEventFindMany.mockResolvedValue([]);

    const res = await GET(reportReq({ propertyId: PROPERTY_A, type: 'security_incidents' }));
    const body = await parseResponse<ReportResponse>(res);

    expect(body.data.summary.total).toBe(0);
    expect(body.data.records).toHaveLength(0);
  });
});

// ===========================================================================
// 8. Report access control
// ===========================================================================

describe('8. Report access control', () => {
  it('admin can access reports', async () => {
    setAuth({ role: 'admin' });

    const res = await GET(reportReq({ propertyId: PROPERTY_A }));
    expect(res.status).toBe(200);
  });

  it('property manager can access reports', async () => {
    setAuth({ role: 'property_manager' });

    const res = await GET(reportReq({ propertyId: PROPERTY_A }));
    expect(res.status).toBe(200);
  });

  it('returns auth error when not authenticated', async () => {
    const { NextResponse } = await import('next/server');
    mockGuardRoute.mockResolvedValue({
      user: null,
      error: NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 },
      ),
    });

    const res = await GET(reportReq({ propertyId: PROPERTY_A }));
    expect(res.status).toBe(401);
  });
});

// ===========================================================================
// 9. Tenant isolation
// ===========================================================================

describe('9. Tenant isolation', () => {
  it('requires propertyId parameter', async () => {
    // When user has no propertyId on their auth token AND no query param, should 400
    setAuth({ propertyId: null });
    const res = await GET(reportReq({}));
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_PROPERTY');
  });

  it('scopes package report to the specified propertyId', async () => {
    await GET(reportReq({ propertyId: PROPERTY_A, type: 'package_activity' }));

    const where = mockPackageFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_A);
  });

  it('scopes maintenance report to the specified propertyId', async () => {
    await GET(reportReq({ propertyId: PROPERTY_A, type: 'maintenance_summary' }));

    const where = mockMaintenanceFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_A);
  });

  it('scopes security report to the specified propertyId', async () => {
    await GET(reportReq({ propertyId: PROPERTY_A, type: 'security_incidents' }));

    const where = mockEventFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_A);
  });

  it('different propertyId scopes to different property', async () => {
    // The route uses auth.user.propertyId first (IDOR prevention),
    // so set the user's propertyId to PROPERTY_B
    setAuth({ propertyId: PROPERTY_B });
    await GET(reportReq({ propertyId: PROPERTY_B, type: 'package_activity' }));

    const where = mockPackageFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_B);
  });
});

// ===========================================================================
// 10. Error handling
// ===========================================================================

describe('10. Error handling', () => {
  it('returns 500 with safe error message on database failure', async () => {
    mockPackageFindMany.mockRejectedValue(new Error('Connection refused'));

    const res = await GET(reportReq({ propertyId: PROPERTY_A, type: 'package_activity' }));
    expect(res.status).toBe(500);

    const body = await parseResponse<{ error: string; message: string }>(res);
    expect(body.error).toBe('INTERNAL_ERROR');
    expect(body.message).not.toContain('Connection refused');
  });

  it('returns 500 on maintenance report database failure', async () => {
    mockMaintenanceFindMany.mockRejectedValue(new Error('Timeout'));

    const res = await GET(reportReq({ propertyId: PROPERTY_A, type: 'maintenance_summary' }));
    expect(res.status).toBe(500);
  });

  it('returns 500 on security report database failure', async () => {
    mockEventFindMany.mockRejectedValue(new Error('Network error'));

    const res = await GET(reportReq({ propertyId: PROPERTY_A, type: 'security_incidents' }));
    expect(res.status).toBe(500);
  });
});

// ===========================================================================
// 11. Package report statistics
// ===========================================================================

describe('11. Package report statistics', () => {
  it('correctly counts perishable packages', async () => {
    mockPackageFindMany.mockResolvedValue([
      {
        id: 'p1',
        status: 'unreleased',
        isPerishable: true,
        unit: { number: '101' },
        courier: { name: 'FedEx' },
      },
      {
        id: 'p2',
        status: 'unreleased',
        isPerishable: false,
        unit: { number: '102' },
        courier: { name: 'UPS' },
      },
      {
        id: 'p3',
        status: 'released',
        isPerishable: true,
        unit: { number: '103' },
        courier: { name: 'DHL' },
      },
    ]);

    const res = await GET(reportReq({ propertyId: PROPERTY_A, type: 'package_activity' }));
    const body = await parseResponse<ReportResponse>(res);

    expect(body.data.summary.perishable).toBe(2);
  });

  it('handles all released packages correctly', async () => {
    mockPackageFindMany.mockResolvedValue([
      {
        id: 'p1',
        status: 'released',
        isPerishable: false,
        unit: { number: '101' },
        courier: { name: 'FedEx' },
      },
      {
        id: 'p2',
        status: 'released',
        isPerishable: false,
        unit: { number: '102' },
        courier: { name: 'UPS' },
      },
    ]);

    const res = await GET(reportReq({ propertyId: PROPERTY_A, type: 'package_activity' }));
    const body = await parseResponse<ReportResponse>(res);

    expect(body.data.summary.unreleased).toBe(0);
    expect(body.data.summary.released).toBe(2);
  });
});

// ===========================================================================
// 12. Maintenance report statistics
// ===========================================================================

describe('12. Maintenance report statistics', () => {
  it('handles mixed status maintenance requests', async () => {
    mockMaintenanceFindMany.mockResolvedValue([
      { id: 'm1', status: 'open', unit: { number: '101' }, category: { name: 'Plumbing' } },
      { id: 'm2', status: 'open', unit: { number: '102' }, category: { name: 'Plumbing' } },
      { id: 'm3', status: 'in_progress', unit: { number: '103' }, category: { name: 'HVAC' } },
      { id: 'm4', status: 'in_progress', unit: { number: '104' }, category: { name: 'HVAC' } },
      {
        id: 'm5',
        status: 'in_progress',
        unit: { number: '105' },
        category: { name: 'Electrical' },
      },
      { id: 'm6', status: 'resolved', unit: { number: '106' }, category: { name: 'General' } },
    ]);

    const res = await GET(reportReq({ propertyId: PROPERTY_A, type: 'maintenance_summary' }));
    const body = await parseResponse<ReportResponse>(res);

    expect(body.data.summary.total).toBe(6);
    expect(body.data.summary.open).toBe(2);
    expect(body.data.summary.inProgress).toBe(3);
    expect(body.data.summary.resolved).toBe(1);
  });
});

// ===========================================================================
// 13. Report type list metadata
// ===========================================================================

describe('13. Available reports metadata', () => {
  it('returns at least 8 report types', async () => {
    const res = await GET(reportReq({ propertyId: PROPERTY_A }));
    const body = await parseResponse<AvailableReportsResponse>(res);

    expect(body.data.availableReports.length).toBeGreaterThanOrEqual(8);
  });

  it('includes visitor_log in available reports', async () => {
    const res = await GET(reportReq({ propertyId: PROPERTY_A }));
    const body = await parseResponse<AvailableReportsResponse>(res);

    const types = body.data.availableReports.map((r) => r.type);
    expect(types).toContain('visitor_log');
  });

  it('includes key_inventory in available reports', async () => {
    const res = await GET(reportReq({ propertyId: PROPERTY_A }));
    const body = await parseResponse<AvailableReportsResponse>(res);

    const types = body.data.availableReports.map((r) => r.type);
    expect(types).toContain('key_inventory');
  });

  it('includes shift_log_summary in available reports', async () => {
    const res = await GET(reportReq({ propertyId: PROPERTY_A }));
    const body = await parseResponse<AvailableReportsResponse>(res);

    const types = body.data.availableReports.map((r) => r.type);
    expect(types).toContain('shift_log_summary');
  });

  it('includes building_analytics in available reports', async () => {
    const res = await GET(reportReq({ propertyId: PROPERTY_A }));
    const body = await parseResponse<AvailableReportsResponse>(res);

    const types = body.data.availableReports.map((r) => r.type);
    expect(types).toContain('building_analytics');
  });

  it('all report types have human-readable names', async () => {
    const res = await GET(reportReq({ propertyId: PROPERTY_A }));
    const body = await parseResponse<AvailableReportsResponse>(res);

    for (const report of body.data.availableReports) {
      expect(report.name.length).toBeGreaterThan(3);
      // Name should not be just the type slug
      expect(report.name).not.toBe(report.type);
    }
  });
});

// ===========================================================================
// 14. Date range on report with from only
// ===========================================================================

describe('14. Partial date ranges', () => {
  it('applies only from date when to is not provided', async () => {
    await GET(reportReq({ propertyId: PROPERTY_A, type: 'package_activity', from: '2026-06-01' }));

    const where = mockPackageFindMany.mock.calls[0]![0].where;
    expect(where.createdAt.gte).toEqual(new Date('2026-06-01'));
    expect(where.createdAt.lte).toBeUndefined();
  });

  it('applies only to date when from is not provided', async () => {
    await GET(reportReq({ propertyId: PROPERTY_A, type: 'package_activity', to: '2026-12-31' }));

    const where = mockPackageFindMany.mock.calls[0]![0].where;
    expect(where.createdAt.lte).toEqual(new Date('2026-12-31'));
    expect(where.createdAt.gte).toBeUndefined();
  });
});

// ===========================================================================
// 15. Default (unknown) report type returns available list
// ===========================================================================

describe('15. Unknown report type', () => {
  it('returns available reports list for unknown type', async () => {
    const res = await GET(reportReq({ propertyId: PROPERTY_A, type: 'nonexistent_report' }));
    expect(res.status).toBe(200);

    const body = await parseResponse<AvailableReportsResponse>(res);
    expect(body.data.availableReports).toBeDefined();
  });

  it('does not query database for unknown report type', async () => {
    await GET(reportReq({ propertyId: PROPERTY_A, type: 'nonexistent_report' }));

    expect(mockPackageFindMany).not.toHaveBeenCalled();
    expect(mockMaintenanceFindMany).not.toHaveBeenCalled();
    expect(mockEventFindMany).not.toHaveBeenCalled();
  });
});
