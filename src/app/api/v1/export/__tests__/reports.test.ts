/**
 * Export API Route Tests — per PRD 10 Reports & Analytics
 *
 * Every listing page must have export capability (CSV + JSON).
 * Supports packages, maintenance, visitors, announcements, units, events.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createGetRequest, parseResponse } from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Mock Setup
// ---------------------------------------------------------------------------

const mockPackageFindMany = vi.fn();
const mockMaintenanceFindMany = vi.fn();
const mockVisitorFindMany = vi.fn();
const mockAnnouncementFindMany = vi.fn();
const mockUnitFindMany = vi.fn();
const mockEventFindMany = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    package: { findMany: (...args: unknown[]) => mockPackageFindMany(...args) },
    maintenanceRequest: { findMany: (...args: unknown[]) => mockMaintenanceFindMany(...args) },
    visitorEntry: { findMany: (...args: unknown[]) => mockVisitorFindMany(...args) },
    announcement: { findMany: (...args: unknown[]) => mockAnnouncementFindMany(...args) },
    unit: { findMany: (...args: unknown[]) => mockUnitFindMany(...args) },
    event: { findMany: (...args: unknown[]) => mockEventFindMany(...args) },
  },
}));

const mockGuardRoute = vi.fn();
vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: (...args: unknown[]) => mockGuardRoute(...args),
}));

import { GET } from '../route';

const PROPERTY_ID = '00000000-0000-4000-b000-000000000001';

beforeEach(() => {
  vi.clearAllMocks();
  // Default: authenticated
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
  mockPackageFindMany.mockResolvedValue([]);
  mockMaintenanceFindMany.mockResolvedValue([]);
  mockVisitorFindMany.mockResolvedValue([]);
  mockAnnouncementFindMany.mockResolvedValue([]);
  mockUnitFindMany.mockResolvedValue([]);
  mockEventFindMany.mockResolvedValue([]);
});

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------

function exportRequest(params: Record<string, string>) {
  return createGetRequest('/api/v1/export', {
    searchParams: { propertyId: PROPERTY_ID, ...params },
  });
}

function parseCsv(text: string): string[][] {
  return text.split('\n').map((row) => row.split(',').map((cell) => cell.trim()));
}

// ---------------------------------------------------------------------------
// 1. Export packages as CSV — correct headers and data rows
// ---------------------------------------------------------------------------

describe('Export packages as CSV', () => {
  it('returns CSV with correct headers and data rows', async () => {
    mockPackageFindMany.mockResolvedValue([
      {
        referenceNumber: 'PKG-001',
        unit: { number: '101' },
        courier: { name: 'FedEx' },
        status: 'unreleased',
        trackingNumber: 'TRK123',
        isPerishable: true,
        createdAt: new Date('2026-01-15T10:00:00Z'),
        releasedAt: null,
      },
    ]);

    const req = exportRequest({ module: 'packages' });
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('text/csv');
    expect(res.headers.get('Content-Disposition')).toContain('packages-export-');
    expect(res.headers.get('Content-Disposition')).toContain('.csv');

    const text = await res.text();
    const rows = parseCsv(text);

    expect(rows[0]).toEqual([
      'reference',
      'unit',
      'courier',
      'status',
      'tracking',
      'perishable',
      'created_at',
      'released_at',
    ]);
    expect(rows[1]![0]).toBe('PKG-001');
    expect(rows[1]![1]).toBe('101');
    expect(rows[1]![2]).toBe('FedEx');
    expect(rows[1]![3]).toBe('unreleased');
  });
});

// ---------------------------------------------------------------------------
// 2. Export maintenance requests as CSV
// ---------------------------------------------------------------------------

describe('Export maintenance requests as CSV', () => {
  it('returns CSV with correct headers and data rows', async () => {
    mockMaintenanceFindMany.mockResolvedValue([
      {
        referenceNumber: 'MNT-001',
        unit: { number: '202' },
        category: { name: 'Plumbing' },
        description: 'Leaking faucet in kitchen',
        status: 'open',
        priority: 'high',
        createdAt: new Date('2026-02-01T08:00:00Z'),
      },
    ]);

    const req = exportRequest({ module: 'maintenance' });
    const res = await GET(req);

    expect(res.status).toBe(200);
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
    expect(rows[1]![4]).toBe('open');
  });
});

// ---------------------------------------------------------------------------
// 3. Export visitor log as CSV
// ---------------------------------------------------------------------------

describe('Export visitor log as CSV', () => {
  it('returns CSV with correct headers and data rows', async () => {
    mockVisitorFindMany.mockResolvedValue([
      {
        visitorName: 'John Doe',
        visitorType: 'visitor',
        unit: { number: '303' },
        arrivalAt: new Date('2026-03-01T09:00:00Z'),
        departureAt: new Date('2026-03-01T11:00:00Z'),
        comments: 'Expected guest',
        createdAt: new Date('2026-03-01T09:00:00Z'),
      },
    ]);

    const req = exportRequest({ module: 'visitors' });
    const res = await GET(req);

    expect(res.status).toBe(200);
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
    expect(rows[1]![1]).toBe('visitor');
  });
});

// ---------------------------------------------------------------------------
// 4. Export announcements as CSV
// ---------------------------------------------------------------------------

describe('Export announcements as CSV', () => {
  it('returns CSV with correct headers and data rows', async () => {
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

    const req = exportRequest({ module: 'announcements' });
    const res = await GET(req);

    expect(res.status).toBe(200);
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
    expect(rows[1]![0]).toBe('Fire Drill');
    expect(rows[1]![1]).toBe('published');
    expect(rows[1]![3]).toBe('Yes');
  });
});

// ---------------------------------------------------------------------------
// 5. Export units as CSV
// ---------------------------------------------------------------------------

describe('Export units as CSV', () => {
  it('returns CSV with correct headers and data rows', async () => {
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

    const req = exportRequest({ module: 'units' });
    const res = await GET(req);

    expect(res.status).toBe(200);
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
  });
});

// ---------------------------------------------------------------------------
// 6. Date range filtering — only include records within range
// ---------------------------------------------------------------------------

describe('Date range filtering', () => {
  it('passes startDate and endDate to Prisma where clause', async () => {
    mockPackageFindMany.mockResolvedValue([]);

    const req = exportRequest({
      module: 'packages',
      startDate: '2026-01-01',
      endDate: '2026-01-31',
    });
    await GET(req);

    const where = mockPackageFindMany.mock.calls[0]![0].where;
    expect(where.createdAt).toBeDefined();
    expect(where.createdAt.gte).toEqual(new Date('2026-01-01'));
    expect(where.createdAt.lte).toEqual(new Date('2026-01-31'));
  });

  it('applies date filter to maintenance requests', async () => {
    mockMaintenanceFindMany.mockResolvedValue([]);

    const req = exportRequest({
      module: 'maintenance',
      startDate: '2026-02-01',
      endDate: '2026-02-28',
    });
    await GET(req);

    const where = mockMaintenanceFindMany.mock.calls[0]![0].where;
    expect(where.createdAt.gte).toEqual(new Date('2026-02-01'));
    expect(where.createdAt.lte).toEqual(new Date('2026-02-28'));
  });

  it('applies date filter to visitors using arrivalAt', async () => {
    mockVisitorFindMany.mockResolvedValue([]);

    const req = exportRequest({
      module: 'visitors',
      startDate: '2026-03-01',
      endDate: '2026-03-31',
    });
    await GET(req);

    const where = mockVisitorFindMany.mock.calls[0]![0].where;
    expect(where.arrivalAt).toBeDefined();
    expect(where.arrivalAt.gte).toEqual(new Date('2026-03-01'));
    expect(where.arrivalAt.lte).toEqual(new Date('2026-03-31'));
  });
});

// ---------------------------------------------------------------------------
// 7. Status filtering — export only specific statuses
// ---------------------------------------------------------------------------

describe('Status filtering', () => {
  it('filters packages by status', async () => {
    mockPackageFindMany.mockResolvedValue([]);

    const req = exportRequest({ module: 'packages', status: 'unreleased' });
    await GET(req);

    const where = mockPackageFindMany.mock.calls[0]![0].where;
    expect(where.status).toBe('unreleased');
  });

  it('filters maintenance by status', async () => {
    mockMaintenanceFindMany.mockResolvedValue([]);

    const req = exportRequest({ module: 'maintenance', status: 'open' });
    await GET(req);

    const where = mockMaintenanceFindMany.mock.calls[0]![0].where;
    expect(where.status).toBe('open');
  });

  it('filters announcements by status', async () => {
    mockAnnouncementFindMany.mockResolvedValue([]);

    const req = exportRequest({ module: 'announcements', status: 'published' });
    await GET(req);

    const where = mockAnnouncementFindMany.mock.calls[0]![0].where;
    expect(where.status).toBe('published');
  });

  it('filters events by status', async () => {
    mockEventFindMany.mockResolvedValue([]);

    const req = exportRequest({ module: 'events', status: 'open' });
    await GET(req);

    const where = mockEventFindMany.mock.calls[0]![0].where;
    expect(where.status).toBe('open');
  });
});

// ---------------------------------------------------------------------------
// 8. CSV escapes commas and quotes in data
// ---------------------------------------------------------------------------

describe('CSV escapes commas and quotes in data', () => {
  it('wraps values containing commas in double quotes', async () => {
    mockMaintenanceFindMany.mockResolvedValue([
      {
        referenceNumber: 'MNT-002',
        unit: { number: '101' },
        category: { name: 'HVAC' },
        description: 'Unit is cold, very cold',
        status: 'open',
        priority: 'medium',
        createdAt: new Date('2026-01-01T00:00:00Z'),
      },
    ]);

    const req = exportRequest({ module: 'maintenance' });
    const res = await GET(req);
    const text = await res.text();

    // The description field should be quoted because it contains a comma
    expect(text).toContain('"Unit is cold, very cold"');
  });

  it('escapes double quotes by doubling them', async () => {
    mockMaintenanceFindMany.mockResolvedValue([
      {
        referenceNumber: 'MNT-003',
        unit: { number: '101' },
        category: { name: 'General' },
        description: 'Resident says "urgent"',
        status: 'open',
        priority: 'high',
        createdAt: new Date('2026-01-01T00:00:00Z'),
      },
    ]);

    const req = exportRequest({ module: 'maintenance' });
    const res = await GET(req);
    const text = await res.text();

    // Quotes should be escaped as "" within the quoted field
    expect(text).toContain('"Resident says ""urgent"""');
  });
});

// ---------------------------------------------------------------------------
// 9. Empty data returns headers-only CSV
// ---------------------------------------------------------------------------

describe('Empty data returns headers-only CSV', () => {
  it('returns headers row when no packages exist', async () => {
    mockPackageFindMany.mockResolvedValue([]);

    const req = exportRequest({ module: 'packages' });
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('text/csv');

    const text = await res.text();
    const rows = text.split('\n');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toBe(
      'reference,unit,courier,status,tracking,perishable,created_at,released_at',
    );
  });

  it('returns headers row when no maintenance requests exist', async () => {
    mockMaintenanceFindMany.mockResolvedValue([]);

    const req = exportRequest({ module: 'maintenance' });
    const res = await GET(req);

    expect(res.status).toBe(200);
    const text = await res.text();
    const rows = text.split('\n');
    expect(rows).toHaveLength(1);
    expect(rows[0]).toBe('reference,unit,category,description,status,priority,created_at');
  });
});

// ---------------------------------------------------------------------------
// 10. Export as JSON returns array of objects
// ---------------------------------------------------------------------------

describe('Export as JSON returns array of objects', () => {
  it('returns JSON with data array and meta', async () => {
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

    const req = exportRequest({ module: 'packages', format: 'json' });
    const res = await GET(req);

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

  it('returns empty array when no data exists', async () => {
    mockUnitFindMany.mockResolvedValue([]);

    const req = exportRequest({ module: 'units', format: 'json' });
    const res = await GET(req);

    const body = await parseResponse<{ data: Record<string, unknown>[]; meta: { count: number } }>(
      res,
    );
    expect(body.data).toHaveLength(0);
    expect(body.meta.count).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 11. Rejects unauthorized access (auth required)
// ---------------------------------------------------------------------------

describe('Rejects unauthorized access', () => {
  it('returns auth error when guardRoute fails', async () => {
    const { NextResponse } = await import('next/server');
    mockGuardRoute.mockResolvedValue({
      user: null,
      error: NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Authentication required' },
        { status: 401 },
      ),
    });

    const req = exportRequest({ module: 'packages' });
    const res = await GET(req);

    expect(res.status).toBe(401);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('UNAUTHORIZED');
  });
});

// ---------------------------------------------------------------------------
// 12. Validates module parameter (only known modules accepted)
// ---------------------------------------------------------------------------

describe('Validates module parameter', () => {
  it('rejects unknown module name', async () => {
    const req = exportRequest({ module: 'nonexistent' });
    const res = await GET(req);

    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('INVALID_MODULE');
  });

  it('rejects missing module parameter', async () => {
    const req = createGetRequest('/api/v1/export', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET(req);

    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_PARAMS');
  });

  it('rejects missing propertyId parameter', async () => {
    const req = createGetRequest('/api/v1/export', {
      searchParams: { module: 'packages' },
    });
    const res = await GET(req);

    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_PARAMS');
  });

  it('accepts all valid module names', async () => {
    const validModules = [
      'packages',
      'maintenance',
      'visitors',
      'announcements',
      'units',
      'events',
    ];

    for (const mod of validModules) {
      const req = exportRequest({ module: mod });
      const res = await GET(req);
      // Should not be 400 INVALID_MODULE
      if (res.status === 400) {
        const body = await parseResponse<{ error: string }>(res);
        expect(body.error).not.toBe('INVALID_MODULE');
      }
    }
  });
});
