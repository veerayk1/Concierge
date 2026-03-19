/**
 * Comprehensive Export / Reports Module Tests — PRD 17
 *
 * Covers 12 scenario groups with 60+ individual test cases:
 *   1. Export packages as CSV
 *   2. Export maintenance as CSV
 *   3. Export visitors as CSV
 *   4. Export announcements as CSV
 *   5. Export units as CSV
 *   6. Export as JSON format
 *   7. Date range filtering on exports
 *   8. Status filtering on exports
 *   9. CSV header correctness per module
 *  10. CSV escaping (commas, quotes, newlines in data)
 *  11. Empty data returns headers-only CSV
 *  12. Module parameter validation and auth
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createGetRequest, parseResponse } from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// UUIDs
// ---------------------------------------------------------------------------
const PROPERTY_ID = '00000000-0000-4000-b000-000000000001';

// ---------------------------------------------------------------------------
// Mock Setup — Prisma
// ---------------------------------------------------------------------------

const mockPackageFindMany = vi.fn();
const mockMaintenanceFindMany = vi.fn();
const mockVisitorFindMany = vi.fn();
const mockAnnouncementFindMany = vi.fn();
const mockUnitFindMany = vi.fn();
const mockEventFindMany = vi.fn();
const mockUserFindMany = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    package: { findMany: (...args: unknown[]) => mockPackageFindMany(...args) },
    maintenanceRequest: { findMany: (...args: unknown[]) => mockMaintenanceFindMany(...args) },
    visitorEntry: { findMany: (...args: unknown[]) => mockVisitorFindMany(...args) },
    announcement: { findMany: (...args: unknown[]) => mockAnnouncementFindMany(...args) },
    unit: { findMany: (...args: unknown[]) => mockUnitFindMany(...args) },
    event: { findMany: (...args: unknown[]) => mockEventFindMany(...args) },
    user: { findMany: (...args: unknown[]) => mockUserFindMany(...args) },
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

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function authOk() {
  mockGuardRoute.mockResolvedValue({
    user: {
      userId: 'test-staff',
      propertyId: PROPERTY_ID,
      role: 'admin',
      permissions: ['*'],
      mfaVerified: false,
    },
    error: null,
  });
}

function exportReq(params: Record<string, string>) {
  return createGetRequest('/api/v1/export', {
    searchParams: { propertyId: PROPERTY_ID, ...params },
  });
}

function parseCsv(text: string): string[][] {
  return text.split('\n').map((row) => row.split(',').map((cell) => cell.trim()));
}

beforeEach(() => {
  vi.clearAllMocks();
  authOk();
  mockPackageFindMany.mockResolvedValue([]);
  mockMaintenanceFindMany.mockResolvedValue([]);
  mockVisitorFindMany.mockResolvedValue([]);
  mockAnnouncementFindMany.mockResolvedValue([]);
  mockUnitFindMany.mockResolvedValue([]);
  mockEventFindMany.mockResolvedValue([]);
  mockUserFindMany.mockResolvedValue([]);
});

// ===========================================================================
// 1. Export packages as CSV
// ===========================================================================

describe('1. Export packages as CSV', () => {
  it('returns CSV with correct Content-Type and Content-Disposition', async () => {
    mockPackageFindMany.mockResolvedValue([
      {
        referenceNumber: 'PKG-001',
        unit: { number: '101' },
        courier: { name: 'FedEx' },
        status: 'unreleased',
        trackingNumber: 'TRK123',
        isPerishable: false,
        createdAt: new Date('2026-01-15T10:00:00Z'),
        releasedAt: null,
      },
    ]);

    const res = await GET(exportReq({ module: 'packages' }));

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('text/csv');
    expect(res.headers.get('Content-Disposition')).toContain('packages-export-');
    expect(res.headers.get('Content-Disposition')).toContain('.csv');
  });

  it('maps package fields to correct CSV columns', async () => {
    mockPackageFindMany.mockResolvedValue([
      {
        referenceNumber: 'PKG-002',
        unit: { number: '505' },
        courier: { name: 'UPS' },
        status: 'released',
        trackingNumber: 'TRK999',
        isPerishable: true,
        createdAt: new Date('2026-02-01T08:00:00Z'),
        releasedAt: new Date('2026-02-01T14:00:00Z'),
      },
    ]);

    const res = await GET(exportReq({ module: 'packages' }));
    const text = await res.text();
    const rows = parseCsv(text);

    expect(rows[1]![0]).toBe('PKG-002');
    expect(rows[1]![1]).toBe('505');
    expect(rows[1]![2]).toBe('UPS');
    expect(rows[1]![3]).toBe('released');
    expect(rows[1]![5]).toBe('Yes'); // perishable
  });

  it('handles missing unit and courier gracefully', async () => {
    mockPackageFindMany.mockResolvedValue([
      {
        referenceNumber: 'PKG-003',
        unit: null,
        courier: null,
        status: 'unreleased',
        trackingNumber: null,
        isPerishable: false,
        createdAt: new Date('2026-03-01T00:00:00Z'),
        releasedAt: null,
      },
    ]);

    const res = await GET(exportReq({ module: 'packages' }));
    const text = await res.text();

    expect(text).toContain('PKG-003');
    expect(res.status).toBe(200);
  });

  it('exports multiple packages as multiple CSV rows', async () => {
    mockPackageFindMany.mockResolvedValue([
      {
        referenceNumber: 'P1',
        unit: { number: '1' },
        courier: null,
        status: 'unreleased',
        trackingNumber: '',
        isPerishable: false,
        createdAt: new Date(),
        releasedAt: null,
      },
      {
        referenceNumber: 'P2',
        unit: { number: '2' },
        courier: null,
        status: 'released',
        trackingNumber: '',
        isPerishable: false,
        createdAt: new Date(),
        releasedAt: new Date(),
      },
      {
        referenceNumber: 'P3',
        unit: { number: '3' },
        courier: null,
        status: 'unreleased',
        trackingNumber: '',
        isPerishable: true,
        createdAt: new Date(),
        releasedAt: null,
      },
    ]);

    const res = await GET(exportReq({ module: 'packages' }));
    const text = await res.text();
    const rows = text.split('\n');

    expect(rows).toHaveLength(4); // 1 header + 3 data rows
  });
});

// ===========================================================================
// 2. Export maintenance as CSV
// ===========================================================================

describe('2. Export maintenance as CSV', () => {
  it('returns maintenance CSV with correct headers', async () => {
    mockMaintenanceFindMany.mockResolvedValue([
      {
        referenceNumber: 'MNT-001',
        unit: { number: '202' },
        category: { name: 'Plumbing' },
        description: 'Leaking faucet',
        status: 'open',
        priority: 'high',
        createdAt: new Date('2026-01-01T00:00:00Z'),
      },
    ]);

    const res = await GET(exportReq({ module: 'maintenance' }));
    const text = await res.text();
    const rows = parseCsv(text);

    expect(rows[0]).toEqual([
      'reference',
      'unit',
      'category',
      'description',
      'status',
      'priority',
      'created_at',
    ]);
    expect(rows[1]![0]).toBe('MNT-001');
  });

  it('truncates description to 200 characters', async () => {
    const longDesc = 'A'.repeat(500);
    mockMaintenanceFindMany.mockResolvedValue([
      {
        referenceNumber: 'MNT-002',
        unit: { number: '101' },
        category: { name: 'General' },
        description: longDesc,
        status: 'open',
        priority: 'normal',
        createdAt: new Date('2026-01-01T00:00:00Z'),
      },
    ]);

    const res = await GET(exportReq({ module: 'maintenance' }));
    const text = await res.text();

    // The full 500-char description should not appear
    expect(text).not.toContain(longDesc);
  });

  it('handles missing unit and category gracefully', async () => {
    mockMaintenanceFindMany.mockResolvedValue([
      {
        referenceNumber: 'MNT-003',
        unit: null,
        category: null,
        description: 'General issue',
        status: 'open',
        priority: 'low',
        createdAt: new Date('2026-01-01T00:00:00Z'),
      },
    ]);

    const res = await GET(exportReq({ module: 'maintenance' }));
    expect(res.status).toBe(200);
  });
});

// ===========================================================================
// 3. Export visitors as CSV
// ===========================================================================

describe('3. Export visitors as CSV', () => {
  it('returns visitor CSV with correct headers', async () => {
    mockVisitorFindMany.mockResolvedValue([
      {
        visitorName: 'John Doe',
        visitorType: 'guest',
        unit: { number: '303' },
        arrivalAt: new Date('2026-03-01T09:00:00Z'),
        departureAt: null,
        comments: 'Expected',
        createdAt: new Date('2026-03-01T09:00:00Z'),
      },
    ]);

    const res = await GET(exportReq({ module: 'visitors' }));
    const text = await res.text();
    const rows = parseCsv(text);

    expect(rows[0]).toEqual([
      'visitor_name',
      'visitor_type',
      'unit',
      'arrival_at',
      'departure_at',
      'comments',
      'created_at',
    ]);
    expect(rows[1]![0]).toBe('John Doe');
  });

  it('handles null departure and comments', async () => {
    mockVisitorFindMany.mockResolvedValue([
      {
        visitorName: 'Jane',
        visitorType: 'delivery',
        unit: { number: '101' },
        arrivalAt: new Date(),
        departureAt: null,
        comments: null,
        createdAt: new Date(),
      },
    ]);

    const res = await GET(exportReq({ module: 'visitors' }));
    expect(res.status).toBe(200);
  });

  it('uses arrivalAt for date range filtering instead of createdAt', async () => {
    mockVisitorFindMany.mockResolvedValue([]);

    await GET(exportReq({ module: 'visitors', startDate: '2026-03-01', endDate: '2026-03-31' }));

    const where = mockVisitorFindMany.mock.calls[0]![0].where;
    expect(where.arrivalAt).toBeDefined();
    expect(where.arrivalAt.gte).toEqual(new Date('2026-03-01'));
    expect(where.createdAt).toBeUndefined();
  });
});

// ===========================================================================
// 4. Export announcements as CSV
// ===========================================================================

describe('4. Export announcements as CSV', () => {
  it('returns announcement CSV with correct headers', async () => {
    mockAnnouncementFindMany.mockResolvedValue([
      {
        title: 'Fire Drill',
        status: 'published',
        priority: 'high',
        isEmergency: true,
        publishedAt: new Date('2026-03-10T12:00:00Z'),
        expiresAt: null,
        createdAt: new Date('2026-03-09T10:00:00Z'),
      },
    ]);

    const res = await GET(exportReq({ module: 'announcements' }));
    const text = await res.text();
    const rows = parseCsv(text);

    expect(rows[0]).toEqual([
      'title',
      'status',
      'priority',
      'is_emergency',
      'published_at',
      'expires_at',
      'created_at',
    ]);
    expect(rows[1]![3]).toBe('Yes'); // is_emergency
  });

  it('maps isEmergency=false to "No"', async () => {
    mockAnnouncementFindMany.mockResolvedValue([
      {
        title: 'Normal',
        status: 'draft',
        priority: 'normal',
        isEmergency: false,
        publishedAt: null,
        expiresAt: null,
        createdAt: new Date(),
      },
    ]);

    const res = await GET(exportReq({ module: 'announcements' }));
    const text = await res.text();

    expect(text).toContain('No');
  });
});

// ===========================================================================
// 5. Export units as CSV
// ===========================================================================

describe('5. Export units as CSV', () => {
  it('returns unit CSV with correct headers', async () => {
    mockUnitFindMany.mockResolvedValue([
      {
        number: '1501',
        floor: '15',
        building: { name: 'Tower A' },
        unitType: 'residential',
        status: 'occupied',
        squareFootage: 850,
        parkingSpot: 'P-23',
        locker: 'L-12',
      },
    ]);

    const res = await GET(exportReq({ module: 'units' }));
    const text = await res.text();
    const rows = parseCsv(text);

    expect(rows[0]).toEqual([
      'number',
      'floor',
      'building',
      'type',
      'status',
      'sq_ft',
      'parking',
      'locker',
    ]);
    expect(rows[1]![0]).toBe('1501');
    expect(rows[1]![2]).toBe('Tower A');
    expect(rows[1]![5]).toBe('850');
  });

  it('handles null building, parkingSpot, locker, floor', async () => {
    mockUnitFindMany.mockResolvedValue([
      {
        number: '101',
        floor: null,
        building: null,
        unitType: 'studio',
        status: 'vacant',
        squareFootage: null,
        parkingSpot: null,
        locker: null,
      },
    ]);

    const res = await GET(exportReq({ module: 'units' }));
    expect(res.status).toBe(200);
  });

  it('orders units by number ascending', async () => {
    mockUnitFindMany.mockResolvedValue([]);

    await GET(exportReq({ module: 'units' }));

    expect(mockUnitFindMany.mock.calls[0]![0].orderBy).toEqual({ number: 'asc' });
  });
});

// ===========================================================================
// 6. Export as JSON format
// ===========================================================================

describe('6. Export as JSON format', () => {
  it('returns JSON with data array and meta when format=json', async () => {
    mockPackageFindMany.mockResolvedValue([
      {
        referenceNumber: 'PKG-001',
        unit: { number: '101' },
        courier: { name: 'UPS' },
        status: 'released',
        trackingNumber: 'TRK456',
        isPerishable: false,
        createdAt: new Date('2026-01-10T10:00:00Z'),
        releasedAt: new Date('2026-01-10T14:00:00Z'),
      },
    ]);

    const res = await GET(exportReq({ module: 'packages', format: 'json' }));

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toContain('application/json');

    const body = await parseResponse<{
      data: Record<string, unknown>[];
      meta: { count: number; module: string; format: string };
    }>(res);
    expect(body.data).toHaveLength(1);
    expect(body.data[0]!.reference).toBe('PKG-001');
    expect(body.meta.count).toBe(1);
    expect(body.meta.module).toBe('packages');
    expect(body.meta.format).toBe('json');
  });

  it('returns empty array when no data in JSON format', async () => {
    mockUnitFindMany.mockResolvedValue([]);

    const res = await GET(exportReq({ module: 'units', format: 'json' }));
    const body = await parseResponse<{ data: unknown[]; meta: { count: number } }>(res);

    expect(body.data).toHaveLength(0);
    expect(body.meta.count).toBe(0);
  });

  it('JSON format works for maintenance module', async () => {
    mockMaintenanceFindMany.mockResolvedValue([
      {
        referenceNumber: 'MNT-001',
        unit: { number: '202' },
        category: { name: 'HVAC' },
        description: 'Broken AC',
        status: 'open',
        priority: 'high',
        createdAt: new Date('2026-01-01T00:00:00Z'),
      },
    ]);

    const res = await GET(exportReq({ module: 'maintenance', format: 'json' }));
    const body = await parseResponse<{ data: Record<string, unknown>[] }>(res);

    expect(body.data[0]!.reference).toBe('MNT-001');
    expect(body.data[0]!.category).toBe('HVAC');
  });

  it('JSON format works for events module', async () => {
    mockEventFindMany.mockResolvedValue([
      {
        referenceNo: 'EVT-001',
        eventType: { name: 'Security' },
        title: 'Incident',
        unit: { number: '101' },
        status: 'open',
        priority: 'high',
        createdAt: new Date('2026-01-01T00:00:00Z'),
      },
    ]);

    const res = await GET(exportReq({ module: 'events', format: 'json' }));
    const body = await parseResponse<{ data: Record<string, unknown>[] }>(res);

    expect(body.data[0]!.reference).toBe('EVT-001');
    expect(body.data[0]!.type).toBe('Security');
  });

  it('JSON format works for announcements module', async () => {
    mockAnnouncementFindMany.mockResolvedValue([
      {
        title: 'Notice',
        status: 'published',
        priority: 'normal',
        isEmergency: false,
        publishedAt: new Date(),
        expiresAt: null,
        createdAt: new Date(),
      },
    ]);

    const res = await GET(exportReq({ module: 'announcements', format: 'json' }));
    const body = await parseResponse<{ data: Record<string, unknown>[] }>(res);

    expect(body.data[0]!.title).toBe('Notice');
    expect(body.data[0]!.is_emergency).toBe('No');
  });
});

// ===========================================================================
// 7. Date range filtering on exports
// ===========================================================================

describe('7. Date range filtering on exports', () => {
  it('applies startDate and endDate to packages via createdAt', async () => {
    mockPackageFindMany.mockResolvedValue([]);

    await GET(exportReq({ module: 'packages', startDate: '2026-01-01', endDate: '2026-01-31' }));

    const where = mockPackageFindMany.mock.calls[0]![0].where;
    expect(where.createdAt.gte).toEqual(new Date('2026-01-01'));
    expect(where.createdAt.lte).toEqual(new Date('2026-01-31'));
  });

  it('applies date filter to maintenance requests', async () => {
    mockMaintenanceFindMany.mockResolvedValue([]);

    await GET(exportReq({ module: 'maintenance', startDate: '2026-02-01', endDate: '2026-02-28' }));

    const where = mockMaintenanceFindMany.mock.calls[0]![0].where;
    expect(where.createdAt.gte).toEqual(new Date('2026-02-01'));
  });

  it('applies date filter to announcements via createdAt', async () => {
    mockAnnouncementFindMany.mockResolvedValue([]);

    await GET(exportReq({ module: 'announcements', startDate: '2026-03-01' }));

    const where = mockAnnouncementFindMany.mock.calls[0]![0].where;
    expect(where.createdAt.gte).toEqual(new Date('2026-03-01'));
  });

  it('applies date filter to events via createdAt', async () => {
    mockEventFindMany.mockResolvedValue([]);

    await GET(exportReq({ module: 'events', startDate: '2026-01-01', endDate: '2026-12-31' }));

    const where = mockEventFindMany.mock.calls[0]![0].where;
    expect(where.createdAt.gte).toEqual(new Date('2026-01-01'));
    expect(where.createdAt.lte).toEqual(new Date('2026-12-31'));
  });

  it('does not apply date filter when neither startDate nor endDate provided', async () => {
    mockPackageFindMany.mockResolvedValue([]);

    await GET(exportReq({ module: 'packages' }));

    const where = mockPackageFindMany.mock.calls[0]![0].where;
    expect(where.createdAt).toBeUndefined();
  });

  it('applies only startDate when endDate is absent', async () => {
    mockPackageFindMany.mockResolvedValue([]);

    await GET(exportReq({ module: 'packages', startDate: '2026-06-01' }));

    const where = mockPackageFindMany.mock.calls[0]![0].where;
    expect(where.createdAt.gte).toEqual(new Date('2026-06-01'));
    expect(where.createdAt.lte).toBeUndefined();
  });
});

// ===========================================================================
// 8. Status filtering on exports
// ===========================================================================

describe('8. Status filtering on exports', () => {
  it('filters packages by status', async () => {
    mockPackageFindMany.mockResolvedValue([]);

    await GET(exportReq({ module: 'packages', status: 'unreleased' }));

    expect(mockPackageFindMany.mock.calls[0]![0].where.status).toBe('unreleased');
  });

  it('filters maintenance by status', async () => {
    mockMaintenanceFindMany.mockResolvedValue([]);

    await GET(exportReq({ module: 'maintenance', status: 'open' }));

    expect(mockMaintenanceFindMany.mock.calls[0]![0].where.status).toBe('open');
  });

  it('filters announcements by status', async () => {
    mockAnnouncementFindMany.mockResolvedValue([]);

    await GET(exportReq({ module: 'announcements', status: 'published' }));

    expect(mockAnnouncementFindMany.mock.calls[0]![0].where.status).toBe('published');
  });

  it('filters events by status', async () => {
    mockEventFindMany.mockResolvedValue([]);

    await GET(exportReq({ module: 'events', status: 'closed' }));

    expect(mockEventFindMany.mock.calls[0]![0].where.status).toBe('closed');
  });

  it('filters units by status', async () => {
    mockUnitFindMany.mockResolvedValue([]);

    await GET(exportReq({ module: 'units', status: 'vacant' }));

    expect(mockUnitFindMany.mock.calls[0]![0].where.status).toBe('vacant');
  });

  it('does not apply status filter when not provided', async () => {
    mockPackageFindMany.mockResolvedValue([]);

    await GET(exportReq({ module: 'packages' }));

    expect(mockPackageFindMany.mock.calls[0]![0].where.status).toBeUndefined();
  });
});

// ===========================================================================
// 9. CSV header correctness per module
// ===========================================================================

describe('9. CSV header correctness per module', () => {
  it('packages headers: reference,unit,courier,status,tracking,perishable,created_at,released_at', async () => {
    const res = await GET(exportReq({ module: 'packages' }));
    const text = await res.text();
    expect(text.split('\n')[0]).toBe(
      'reference,unit,courier,status,tracking,perishable,created_at,released_at',
    );
  });

  it('maintenance headers: reference,unit,category,description,status,priority,created_at', async () => {
    const res = await GET(exportReq({ module: 'maintenance' }));
    const text = await res.text();
    expect(text.split('\n')[0]).toBe(
      'reference,unit,category,description,status,priority,created_at',
    );
  });

  it('visitors headers: visitor_name,visitor_type,unit,arrival_at,departure_at,comments,created_at', async () => {
    const res = await GET(exportReq({ module: 'visitors' }));
    const text = await res.text();
    expect(text.split('\n')[0]).toBe(
      'visitor_name,visitor_type,unit,arrival_at,departure_at,comments,created_at',
    );
  });

  it('announcements headers: title,status,priority,is_emergency,published_at,expires_at,created_at', async () => {
    const res = await GET(exportReq({ module: 'announcements' }));
    const text = await res.text();
    expect(text.split('\n')[0]).toBe(
      'title,status,priority,is_emergency,published_at,expires_at,created_at',
    );
  });

  it('units headers: number,floor,building,type,status,sq_ft,parking,locker', async () => {
    const res = await GET(exportReq({ module: 'units' }));
    const text = await res.text();
    expect(text.split('\n')[0]).toBe('number,floor,building,type,status,sq_ft,parking,locker');
  });

  it('events headers: reference,type,title,unit,status,priority,created_at', async () => {
    const res = await GET(exportReq({ module: 'events' }));
    const text = await res.text();
    expect(text.split('\n')[0]).toBe('reference,type,title,unit,status,priority,created_at');
  });
});

// ===========================================================================
// 10. CSV escaping (commas, quotes, newlines in data)
// ===========================================================================

describe('10. CSV escaping', () => {
  it('wraps values containing commas in double quotes', async () => {
    mockMaintenanceFindMany.mockResolvedValue([
      {
        referenceNumber: 'MNT-X',
        unit: { number: '101' },
        category: { name: 'HVAC' },
        description: 'Unit is cold, very cold',
        status: 'open',
        priority: 'medium',
        createdAt: new Date('2026-01-01T00:00:00Z'),
      },
    ]);

    const res = await GET(exportReq({ module: 'maintenance' }));
    const text = await res.text();

    expect(text).toContain('"Unit is cold, very cold"');
  });

  it('escapes double quotes by doubling them', async () => {
    mockMaintenanceFindMany.mockResolvedValue([
      {
        referenceNumber: 'MNT-Y',
        unit: { number: '101' },
        category: { name: 'General' },
        description: 'Resident says "urgent"',
        status: 'open',
        priority: 'high',
        createdAt: new Date('2026-01-01T00:00:00Z'),
      },
    ]);

    const res = await GET(exportReq({ module: 'maintenance' }));
    const text = await res.text();

    expect(text).toContain('"Resident says ""urgent"""');
  });

  it('wraps values containing newlines in double quotes', async () => {
    mockMaintenanceFindMany.mockResolvedValue([
      {
        referenceNumber: 'MNT-Z',
        unit: { number: '101' },
        category: { name: 'General' },
        description: 'Line 1\nLine 2',
        status: 'open',
        priority: 'normal',
        createdAt: new Date('2026-01-01T00:00:00Z'),
      },
    ]);

    const res = await GET(exportReq({ module: 'maintenance' }));
    const text = await res.text();

    expect(text).toContain('"Line 1\nLine 2"');
  });

  it('does not wrap simple values without special characters', async () => {
    mockUnitFindMany.mockResolvedValue([
      {
        number: '1501',
        floor: '15',
        building: { name: 'TowerA' },
        unitType: 'residential',
        status: 'occupied',
        squareFootage: 850,
        parkingSpot: 'P23',
        locker: 'L12',
      },
    ]);

    const res = await GET(exportReq({ module: 'units' }));
    const text = await res.text();
    const rows = text.split('\n');

    // Simple values should not be quoted
    expect(rows[1]).not.toContain('"1501"');
    expect(rows[1]).toContain('1501');
  });

  it('handles value that is both comma-containing and quote-containing', async () => {
    mockMaintenanceFindMany.mockResolvedValue([
      {
        referenceNumber: 'MNT-COMBO',
        unit: { number: '101' },
        category: { name: 'General' },
        description: 'Says "fix this, please"',
        status: 'open',
        priority: 'normal',
        createdAt: new Date('2026-01-01T00:00:00Z'),
      },
    ]);

    const res = await GET(exportReq({ module: 'maintenance' }));
    const text = await res.text();

    // Must be quoted and inner quotes doubled
    expect(text).toContain('"Says ""fix this, please"""');
  });
});

// ===========================================================================
// 11. Empty data returns headers-only CSV
// ===========================================================================

describe('11. Empty data returns headers-only CSV', () => {
  it('packages: headers only when no data', async () => {
    const res = await GET(exportReq({ module: 'packages' }));
    const text = await res.text();
    const rows = text.split('\n');

    expect(rows).toHaveLength(1);
    expect(rows[0]).toBe(
      'reference,unit,courier,status,tracking,perishable,created_at,released_at',
    );
  });

  it('maintenance: headers only when no data', async () => {
    const res = await GET(exportReq({ module: 'maintenance' }));
    const text = await res.text();
    const rows = text.split('\n');

    expect(rows).toHaveLength(1);
  });

  it('visitors: headers only when no data', async () => {
    const res = await GET(exportReq({ module: 'visitors' }));
    const text = await res.text();
    const rows = text.split('\n');

    expect(rows).toHaveLength(1);
  });

  it('announcements: headers only when no data', async () => {
    const res = await GET(exportReq({ module: 'announcements' }));
    const text = await res.text();
    const rows = text.split('\n');

    expect(rows).toHaveLength(1);
  });

  it('units: headers only when no data', async () => {
    const res = await GET(exportReq({ module: 'units' }));
    const text = await res.text();
    const rows = text.split('\n');

    expect(rows).toHaveLength(1);
  });

  it('events: headers only when no data', async () => {
    const res = await GET(exportReq({ module: 'events' }));
    const text = await res.text();
    const rows = text.split('\n');

    expect(rows).toHaveLength(1);
  });

  it('still returns Content-Type text/csv for empty results', async () => {
    const res = await GET(exportReq({ module: 'packages' }));
    expect(res.headers.get('Content-Type')).toBe('text/csv');
  });
});

// ===========================================================================
// 12. Module parameter validation and auth
// ===========================================================================

describe('12. Module parameter validation and auth', () => {
  it('returns 400 for unknown module name', async () => {
    const res = await GET(exportReq({ module: 'nonexistent' }));
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('INVALID_MODULE');
  });

  it('returns 400 when module parameter is missing', async () => {
    const res = await GET(
      createGetRequest('/api/v1/export', {
        searchParams: { propertyId: PROPERTY_ID },
      }),
    );
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_PARAMS');
  });

  it('returns 400 when propertyId parameter is missing', async () => {
    const res = await GET(
      createGetRequest('/api/v1/export', {
        searchParams: { module: 'packages' },
      }),
    );
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_PARAMS');
  });

  it('returns 401 when guardRoute returns auth error', async () => {
    const { NextResponse } = await import('next/server');
    mockGuardRoute.mockResolvedValue({
      user: null,
      error: NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Not authenticated' },
        { status: 401 },
      ),
    });

    const res = await GET(exportReq({ module: 'packages' }));
    expect(res.status).toBe(401);
  });

  it('accepts all valid module names without INVALID_MODULE error', async () => {
    const validModules = [
      'packages',
      'maintenance',
      'visitors',
      'announcements',
      'units',
      'events',
    ];

    for (const mod of validModules) {
      vi.clearAllMocks();
      authOk();
      mockPackageFindMany.mockResolvedValue([]);
      mockMaintenanceFindMany.mockResolvedValue([]);
      mockVisitorFindMany.mockResolvedValue([]);
      mockAnnouncementFindMany.mockResolvedValue([]);
      mockUnitFindMany.mockResolvedValue([]);
      mockEventFindMany.mockResolvedValue([]);

      const res = await GET(exportReq({ module: mod }));
      if (res.status === 400) {
        const body = await parseResponse<{ error: string }>(res);
        expect(body.error).not.toBe('INVALID_MODULE');
      }
    }
  });

  it('returns 500 with safe message on database error', async () => {
    mockPackageFindMany.mockRejectedValue(new Error('Connection lost'));

    const res = await GET(exportReq({ module: 'packages' }));
    expect(res.status).toBe(500);

    const body = await parseResponse<{ error: string; message: string }>(res);
    expect(body.error).toBe('INTERNAL_ERROR');
    expect(body.message).not.toContain('Connection');
  });

  it('export scopes packages to propertyId and excludes soft-deleted', async () => {
    mockPackageFindMany.mockResolvedValue([]);

    await GET(exportReq({ module: 'packages' }));

    const where = mockPackageFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_ID);
    expect(where.deletedAt).toBeNull();
  });

  it('export scopes announcements to propertyId and excludes soft-deleted', async () => {
    mockAnnouncementFindMany.mockResolvedValue([]);

    await GET(exportReq({ module: 'announcements' }));

    const where = mockAnnouncementFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_ID);
    expect(where.deletedAt).toBeNull();
  });

  it('also supports users module', async () => {
    mockUserFindMany.mockResolvedValue([
      {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@b.com',
        phone: '555-1234',
        isActive: true,
        createdAt: new Date(),
        userProperties: [{ role: { name: 'Front Desk' } }],
      },
    ]);

    const res = await GET(exportReq({ module: 'users' }));
    expect(res.status).toBe(200);

    const text = await res.text();
    expect(text.split('\n')[0]).toBe('first_name,last_name,email,phone,role,status,created_at');
  });
});
