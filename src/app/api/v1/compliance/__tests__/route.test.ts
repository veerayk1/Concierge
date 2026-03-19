/**
 * Compliance Reports & Monitoring API Tests
 *
 * PRD 28: 8 compliance report types, monitoring dashboards, audit automation.
 * Covers access audit, data retention, consent tracking, incident response,
 * vendor compliance, security audit, privacy impact, and SLA performance.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createGetRequest, createPostRequest, parseResponse } from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Mock Setup
// ---------------------------------------------------------------------------

const mockAuditEntryFindMany = vi.fn();
const mockAuditEntryCount = vi.fn();
const mockUserPropertyFindMany = vi.fn();
const mockUserPropertyCount = vi.fn();
const mockIncidentReportFindMany = vi.fn();
const mockIncidentReportCount = vi.fn();
const mockVendorFindMany = vi.fn();
const mockLoginAuditFindMany = vi.fn();
const mockMaintenanceRequestFindMany = vi.fn();
const mockMaintenanceRequestCount = vi.fn();
const mockReportRunFindUnique = vi.fn();
const mockReportRunCreate = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    auditEntry: {
      findMany: (...args: unknown[]) => mockAuditEntryFindMany(...args),
      count: (...args: unknown[]) => mockAuditEntryCount(...args),
    },
    userProperty: {
      findMany: (...args: unknown[]) => mockUserPropertyFindMany(...args),
      count: (...args: unknown[]) => mockUserPropertyCount(...args),
    },
    incidentReport: {
      findMany: (...args: unknown[]) => mockIncidentReportFindMany(...args),
      count: (...args: unknown[]) => mockIncidentReportCount(...args),
    },
    vendor: {
      findMany: (...args: unknown[]) => mockVendorFindMany(...args),
    },
    loginAudit: {
      findMany: (...args: unknown[]) => mockLoginAuditFindMany(...args),
    },
    maintenanceRequest: {
      findMany: (...args: unknown[]) => mockMaintenanceRequestFindMany(...args),
      count: (...args: unknown[]) => mockMaintenanceRequestCount(...args),
    },
    reportRun: {
      findUnique: (...args: unknown[]) => mockReportRunFindUnique(...args),
      create: (...args: unknown[]) => mockReportRunCreate(...args),
    },
  },
}));

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: vi.fn().mockResolvedValue({
    user: {
      userId: 'test-admin',
      propertyId: '00000000-0000-4000-b000-000000000001',
      role: 'property_manager',
      permissions: ['*'],
      mfaVerified: false,
    },
    error: null,
  }),
}));

// Route imports MUST come after vi.mock calls
import { GET as GET_REPORTS, POST as POST_REPORTS } from '../reports/route';
import { GET as GET_REPORT_DETAIL } from '../reports/[id]/route';
import { GET as GET_DASHBOARD } from '../dashboard/route';
import {
  COMPLIANCE_REPORT_TYPES,
  REPORT_CATALOG,
  validateSchedule,
  type ComplianceReportType,
} from '@/server/compliance';

beforeEach(() => {
  vi.clearAllMocks();
  // Sensible defaults
  mockAuditEntryFindMany.mockResolvedValue([]);
  mockAuditEntryCount.mockResolvedValue(0);
  mockUserPropertyFindMany.mockResolvedValue([]);
  mockUserPropertyCount.mockResolvedValue(0);
  mockIncidentReportFindMany.mockResolvedValue([]);
  mockIncidentReportCount.mockResolvedValue(0);
  mockVendorFindMany.mockResolvedValue([]);
  mockLoginAuditFindMany.mockResolvedValue([]);
  mockMaintenanceRequestFindMany.mockResolvedValue([]);
  mockMaintenanceRequestCount.mockResolvedValue(0);
  mockReportRunCreate.mockResolvedValue({ id: 'run-1' });
});

const PROPERTY_ID = '00000000-0000-4000-b000-000000000001';

// ---------------------------------------------------------------------------
// 1. GET /compliance/reports — List available compliance report types
// ---------------------------------------------------------------------------

describe('GET /compliance/reports — List report types', () => {
  it('returns all 8 compliance report types', async () => {
    const req = createGetRequest('/api/v1/compliance/reports');
    const res = await GET_REPORTS(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { reportTypes: Array<{ type: string; name: string }>; totalTypes: number };
    }>(res);

    expect(body.data.totalTypes).toBe(8);
    expect(body.data.reportTypes).toHaveLength(8);
  });

  it('includes type, name, description, and category for each report', async () => {
    const req = createGetRequest('/api/v1/compliance/reports');
    const res = await GET_REPORTS(req);
    const body = await parseResponse<{
      data: {
        reportTypes: Array<{
          type: string;
          name: string;
          description: string;
          category: string;
        }>;
      };
    }>(res);

    for (const report of body.data.reportTypes) {
      expect(report.type).toBeDefined();
      expect(report.name).toBeDefined();
      expect(report.description).toBeDefined();
      expect(report.category).toBeDefined();
    }
  });

  it('report types match PRD 28 specification', async () => {
    const req = createGetRequest('/api/v1/compliance/reports');
    const res = await GET_REPORTS(req);
    const body = await parseResponse<{
      data: { reportTypes: Array<{ type: string }> };
    }>(res);

    const types = body.data.reportTypes.map((r) => r.type);
    expect(types).toContain('access_audit');
    expect(types).toContain('data_retention');
    expect(types).toContain('consent_tracking');
    expect(types).toContain('incident_response');
    expect(types).toContain('vendor_compliance');
    expect(types).toContain('security_audit');
    expect(types).toContain('privacy_impact');
    expect(types).toContain('sla_performance');
  });
});

// ---------------------------------------------------------------------------
// 2. POST /compliance/reports/generate — Generate a specific report
// ---------------------------------------------------------------------------

describe('POST /compliance/reports — Generate report', () => {
  it('rejects missing propertyId', async () => {
    const req = createPostRequest('/api/v1/compliance/reports', {
      type: 'access_audit',
    });
    const res = await POST_REPORTS(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('rejects invalid report type', async () => {
    const req = createPostRequest('/api/v1/compliance/reports', {
      type: 'invalid_type',
      propertyId: PROPERTY_ID,
    });
    const res = await POST_REPORTS(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string; message: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
    expect(body.message).toContain('Invalid report type');
  });

  it('rejects missing report type', async () => {
    const req = createPostRequest('/api/v1/compliance/reports', {
      propertyId: PROPERTY_ID,
    });
    const res = await POST_REPORTS(req);
    expect(res.status).toBe(400);
  });

  it('generates report and returns 201', async () => {
    mockAuditEntryFindMany.mockResolvedValue([
      {
        id: 'ae-1',
        userId: 'user-1',
        propertyId: PROPERTY_ID,
        action: 'read',
        resource: 'unit',
        resourceId: 'unit-1',
        piiAccessed: false,
        createdAt: new Date(),
      },
    ]);

    const req = createPostRequest('/api/v1/compliance/reports', {
      type: 'access_audit',
      propertyId: PROPERTY_ID,
    });
    const res = await POST_REPORTS(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{
      data: { type: string; propertyId: string; summary: Record<string, unknown> };
      message: string;
    }>(res);

    expect(body.data.type).toBe('access_audit');
    expect(body.data.propertyId).toBe(PROPERTY_ID);
    expect(body.message).toContain('access_audit');
  });

  it('handles database errors gracefully', async () => {
    mockAuditEntryFindMany.mockRejectedValue(new Error('DB down'));

    const req = createPostRequest('/api/v1/compliance/reports', {
      type: 'access_audit',
      propertyId: PROPERTY_ID,
    });
    const res = await POST_REPORTS(req);
    expect(res.status).toBe(500);

    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).not.toContain('DB down');
  });
});

// ---------------------------------------------------------------------------
// 3. All 8 report types are defined in the catalog
// ---------------------------------------------------------------------------

describe('Report type catalog', () => {
  const expectedTypes: ComplianceReportType[] = [
    'access_audit',
    'data_retention',
    'consent_tracking',
    'incident_response',
    'vendor_compliance',
    'security_audit',
    'privacy_impact',
    'sla_performance',
  ];

  it('COMPLIANCE_REPORT_TYPES contains all 8 types', () => {
    expect(COMPLIANCE_REPORT_TYPES).toHaveLength(8);
    for (const type of expectedTypes) {
      expect(COMPLIANCE_REPORT_TYPES).toContain(type);
    }
  });

  it('REPORT_CATALOG has metadata for all 8 types', () => {
    expect(REPORT_CATALOG).toHaveLength(8);
    for (const type of expectedTypes) {
      const meta = REPORT_CATALOG.find((r) => r.type === type);
      expect(meta).toBeDefined();
      expect(meta!.name.length).toBeGreaterThan(0);
      expect(meta!.description.length).toBeGreaterThan(0);
    }
  });

  it('each report type generates via POST endpoint', async () => {
    // Set up mocks for all report types
    mockAuditEntryFindMany.mockResolvedValue([]);
    mockUserPropertyFindMany.mockResolvedValue([]);
    mockIncidentReportFindMany.mockResolvedValue([]);
    mockVendorFindMany.mockResolvedValue([]);
    mockLoginAuditFindMany.mockResolvedValue([]);
    mockMaintenanceRequestFindMany.mockResolvedValue([]);

    for (const type of expectedTypes) {
      const req = createPostRequest('/api/v1/compliance/reports', {
        type,
        propertyId: PROPERTY_ID,
      });
      const res = await POST_REPORTS(req);
      expect(res.status).toBe(201);

      const body = await parseResponse<{ data: { type: string } }>(res);
      expect(body.data.type).toBe(type);
    }
  });
});

// ---------------------------------------------------------------------------
// 4. Access audit report: who accessed what, when
// ---------------------------------------------------------------------------

describe('Access audit report', () => {
  it('returns audit entries scoped to propertyId', async () => {
    mockAuditEntryFindMany.mockResolvedValue([
      {
        id: 'ae-1',
        userId: 'user-1',
        propertyId: PROPERTY_ID,
        action: 'read',
        resource: 'unit',
        resourceId: 'unit-1',
        piiAccessed: false,
        createdAt: new Date('2026-03-01'),
      },
      {
        id: 'ae-2',
        userId: 'user-2',
        propertyId: PROPERTY_ID,
        action: 'update',
        resource: 'resident',
        resourceId: 'res-1',
        piiAccessed: true,
        createdAt: new Date('2026-03-10'),
      },
    ]);

    const req = createPostRequest('/api/v1/compliance/reports', {
      type: 'access_audit',
      propertyId: PROPERTY_ID,
    });
    const res = await POST_REPORTS(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{
      data: {
        summary: {
          totalEntries: number;
          uniqueUsers: number;
          piiAccessCount: number;
          actionBreakdown: Record<string, number>;
        };
        records: unknown[];
      };
    }>(res);

    expect(body.data.summary.totalEntries).toBe(2);
    expect(body.data.summary.uniqueUsers).toBe(2);
    expect(body.data.summary.piiAccessCount).toBe(1);
    expect(body.data.summary.actionBreakdown.read).toBe(1);
    expect(body.data.summary.actionBreakdown.update).toBe(1);
    expect(body.data.records).toHaveLength(2);
  });

  it('queries are scoped to propertyId — tenant isolation', async () => {
    const req = createPostRequest('/api/v1/compliance/reports', {
      type: 'access_audit',
      propertyId: PROPERTY_ID,
    });
    await POST_REPORTS(req);

    const where = mockAuditEntryFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_ID);
  });

  it('supports date range filtering', async () => {
    const req = createPostRequest('/api/v1/compliance/reports', {
      type: 'access_audit',
      propertyId: PROPERTY_ID,
      from: '2026-01-01',
      to: '2026-03-31',
    });
    await POST_REPORTS(req);

    const where = mockAuditEntryFindMany.mock.calls[0]![0].where;
    expect(where.createdAt).toBeDefined();
    expect(where.createdAt.gte).toBeInstanceOf(Date);
    expect(where.createdAt.lte).toBeInstanceOf(Date);
  });
});

// ---------------------------------------------------------------------------
// 5. Data retention report: records past retention period
// ---------------------------------------------------------------------------

describe('Data retention report', () => {
  it('identifies records past retention period (365 days)', async () => {
    const oldDate = new Date();
    oldDate.setFullYear(oldDate.getFullYear() - 2);

    mockAuditEntryFindMany.mockResolvedValue([
      {
        id: 'ae-old-1',
        resource: 'unit',
        createdAt: oldDate,
      },
      {
        id: 'ae-old-2',
        resource: 'resident',
        createdAt: oldDate,
      },
    ]);

    const req = createPostRequest('/api/v1/compliance/reports', {
      type: 'data_retention',
      propertyId: PROPERTY_ID,
    });
    const res = await POST_REPORTS(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{
      data: {
        summary: {
          totalOverdue: number;
          retentionPeriodDays: number;
          resourceBreakdown: Record<string, number>;
        };
      };
    }>(res);

    expect(body.data.summary.totalOverdue).toBe(2);
    expect(body.data.summary.retentionPeriodDays).toBe(365);
    expect(body.data.summary.resourceBreakdown.unit).toBe(1);
    expect(body.data.summary.resourceBreakdown.resident).toBe(1);
  });

  it('queries with retention cutoff date', async () => {
    const req = createPostRequest('/api/v1/compliance/reports', {
      type: 'data_retention',
      propertyId: PROPERTY_ID,
    });
    await POST_REPORTS(req);

    const where = mockAuditEntryFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_ID);
    expect(where.createdAt.lt).toBeInstanceOf(Date);
  });
});

// ---------------------------------------------------------------------------
// 6. Consent tracking: user consent records and expiry
// ---------------------------------------------------------------------------

describe('Consent tracking report', () => {
  it('returns consent status for all property users', async () => {
    const recentDate = new Date();
    recentDate.setMonth(recentDate.getMonth() - 6);

    const oldDate = new Date();
    oldDate.setFullYear(oldDate.getFullYear() - 2);

    mockUserPropertyFindMany.mockResolvedValue([
      {
        userId: 'user-1',
        createdAt: recentDate,
        user: { id: 'user-1', email: 'active@example.com', isActive: true, createdAt: recentDate },
      },
      {
        userId: 'user-2',
        createdAt: oldDate,
        user: { id: 'user-2', email: 'expired@example.com', isActive: true, createdAt: oldDate },
      },
    ]);

    const req = createPostRequest('/api/v1/compliance/reports', {
      type: 'consent_tracking',
      propertyId: PROPERTY_ID,
    });
    const res = await POST_REPORTS(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{
      data: {
        summary: {
          totalUsers: number;
          active: number;
          expired: number;
          consentExpiryDays: number;
        };
        records: Array<{ userId: string; status: string }>;
      };
    }>(res);

    expect(body.data.summary.totalUsers).toBe(2);
    expect(body.data.summary.consentExpiryDays).toBe(365);
    // One user with recent consent (active), one with old consent (expired)
    expect(body.data.records.some((r) => r.status === 'active')).toBe(true);
    expect(body.data.records.some((r) => r.status === 'expired')).toBe(true);
  });

  it('scopes consent query to propertyId', async () => {
    const req = createPostRequest('/api/v1/compliance/reports', {
      type: 'consent_tracking',
      propertyId: PROPERTY_ID,
    });
    await POST_REPORTS(req);

    const where = mockUserPropertyFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_ID);
    expect(where.deletedAt).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 7. Vendor compliance: aggregate from vendor documents
// ---------------------------------------------------------------------------

describe('Vendor compliance report', () => {
  it('aggregates vendor compliance statuses', async () => {
    mockVendorFindMany.mockResolvedValue([
      {
        id: 'v1',
        complianceStatus: 'compliant',
        documents: [],
        serviceCategory: { name: 'Plumbing' },
      },
      {
        id: 'v2',
        complianceStatus: 'expired',
        documents: [],
        serviceCategory: { name: 'Electrical' },
      },
      {
        id: 'v3',
        complianceStatus: 'not_tracking',
        documents: [],
        serviceCategory: { name: 'HVAC' },
      },
    ]);

    const req = createPostRequest('/api/v1/compliance/reports', {
      type: 'vendor_compliance',
      propertyId: PROPERTY_ID,
    });
    const res = await POST_REPORTS(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{
      data: {
        summary: {
          totalVendors: number;
          statusCounts: Record<string, number>;
          complianceRate: number;
        };
      };
    }>(res);

    expect(body.data.summary.totalVendors).toBe(3);
    expect(body.data.summary.statusCounts.compliant).toBe(1);
    expect(body.data.summary.statusCounts.expired).toBe(1);
    expect(body.data.summary.statusCounts.not_tracking).toBe(1);
    expect(body.data.summary.complianceRate).toBe(33); // 1/3
  });

  it('scopes vendor query to propertyId', async () => {
    const req = createPostRequest('/api/v1/compliance/reports', {
      type: 'vendor_compliance',
      propertyId: PROPERTY_ID,
    });
    await POST_REPORTS(req);

    const where = mockVendorFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_ID);
  });

  it('handles zero vendors gracefully', async () => {
    mockVendorFindMany.mockResolvedValue([]);

    const req = createPostRequest('/api/v1/compliance/reports', {
      type: 'vendor_compliance',
      propertyId: PROPERTY_ID,
    });
    const res = await POST_REPORTS(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{
      data: { summary: { complianceRate: number; totalVendors: number } };
    }>(res);

    expect(body.data.summary.totalVendors).toBe(0);
    expect(body.data.summary.complianceRate).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 8. SLA performance: maintenance resolution times vs targets
// ---------------------------------------------------------------------------

describe('SLA performance report', () => {
  it('calculates SLA compliance per priority level', async () => {
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

    mockMaintenanceRequestFindMany.mockResolvedValue([
      {
        id: 'mr-1',
        priority: 'critical',
        createdAt: twoHoursAgo,
        completedDate: now,
        status: 'closed',
      },
      {
        id: 'mr-2',
        priority: 'normal',
        createdAt: twoDaysAgo,
        completedDate: now,
        status: 'closed',
      },
    ]);

    const req = createPostRequest('/api/v1/compliance/reports', {
      type: 'sla_performance',
      propertyId: PROPERTY_ID,
    });
    const res = await POST_REPORTS(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{
      data: {
        summary: {
          totalResolved: number;
          overallSlaComplianceRate: number;
          priorityMetrics: Record<
            string,
            { total: number; withinSla: number; targetHours: number }
          >;
          slaTargets: Record<string, number>;
        };
      };
    }>(res);

    expect(body.data.summary.totalResolved).toBe(2);
    expect(body.data.summary.slaTargets.critical).toBe(4);
    expect(body.data.summary.slaTargets.high).toBe(24);
    expect(body.data.summary.slaTargets.normal).toBe(72);
    expect(body.data.summary.slaTargets.low).toBe(168);

    // Critical: 2 hours < 4 hour target = within SLA
    expect(body.data.summary.priorityMetrics.critical!.total).toBe(1);
    expect(body.data.summary.priorityMetrics.critical!.withinSla).toBe(1);

    // Normal: 48 hours < 72 hour target = within SLA
    expect(body.data.summary.priorityMetrics.normal!.total).toBe(1);
    expect(body.data.summary.priorityMetrics.normal!.withinSla).toBe(1);
  });

  it('identifies SLA breaches', async () => {
    const now = new Date();
    const fiveDaysAgo = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);

    mockMaintenanceRequestFindMany.mockResolvedValue([
      {
        id: 'mr-1',
        priority: 'critical',
        createdAt: fiveDaysAgo,
        completedDate: now,
        status: 'closed',
      },
    ]);

    const req = createPostRequest('/api/v1/compliance/reports', {
      type: 'sla_performance',
      propertyId: PROPERTY_ID,
    });
    const res = await POST_REPORTS(req);
    const body = await parseResponse<{
      data: {
        summary: {
          priorityMetrics: Record<string, { total: number; withinSla: number }>;
          overallSlaComplianceRate: number;
        };
      };
    }>(res);

    // Critical: 120 hours > 4 hour target = SLA breach
    expect(body.data.summary.priorityMetrics.critical!.withinSla).toBe(0);
    expect(body.data.summary.overallSlaComplianceRate).toBe(0);
  });

  it('queries only closed requests with completedDate', async () => {
    const req = createPostRequest('/api/v1/compliance/reports', {
      type: 'sla_performance',
      propertyId: PROPERTY_ID,
    });
    await POST_REPORTS(req);

    const where = mockMaintenanceRequestFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_ID);
    expect(where.status).toBe('closed');
    expect(where.completedDate).toEqual({ not: null });
    expect(where.deletedAt).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 9. Report scheduling: auto-generate weekly/monthly
// ---------------------------------------------------------------------------

describe('Report scheduling', () => {
  it('creates a weekly schedule', async () => {
    const req = createPostRequest('/api/v1/compliance/reports', {
      type: 'access_audit',
      propertyId: PROPERTY_ID,
      schedule: {
        frequency: 'weekly',
        dayOfWeek: 1,
        recipients: ['admin@example.com'],
      },
    });
    const res = await POST_REPORTS(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{
      data: { scheduled: boolean; config: { frequency: string; dayOfWeek: number } };
      message: string;
    }>(res);

    expect(body.data.scheduled).toBe(true);
    expect(body.data.config.frequency).toBe('weekly');
    expect(body.data.config.dayOfWeek).toBe(1);
    expect(body.message).toContain('weekly');
  });

  it('creates a monthly schedule', async () => {
    const req = createPostRequest('/api/v1/compliance/reports', {
      type: 'vendor_compliance',
      propertyId: PROPERTY_ID,
      schedule: {
        frequency: 'monthly',
        dayOfMonth: 15,
        recipients: ['compliance@example.com'],
      },
    });
    const res = await POST_REPORTS(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{
      data: { scheduled: boolean; config: { frequency: string; dayOfMonth: number } };
    }>(res);

    expect(body.data.scheduled).toBe(true);
    expect(body.data.config.frequency).toBe('monthly');
    expect(body.data.config.dayOfMonth).toBe(15);
  });

  it('validates schedule configuration', () => {
    const errors = validateSchedule({
      reportType: 'access_audit',
      frequency: 'weekly',
      recipients: ['admin@example.com'],
      propertyId: PROPERTY_ID,
      // missing dayOfWeek for weekly
    });

    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((e) => e.includes('dayOfWeek'))).toBe(true);
  });

  it('rejects schedule with no recipients', () => {
    const errors = validateSchedule({
      reportType: 'access_audit',
      frequency: 'daily',
      recipients: [],
      propertyId: PROPERTY_ID,
    });

    expect(errors.some((e) => e.includes('recipient'))).toBe(true);
  });

  it('rejects invalid frequency', () => {
    const errors = validateSchedule({
      reportType: 'access_audit',
      frequency: 'hourly' as 'daily',
      recipients: ['admin@example.com'],
      propertyId: PROPERTY_ID,
    });

    expect(errors.some((e) => e.includes('frequency'))).toBe(true);
  });

  it('rejects schedule with invalid report type', () => {
    const errors = validateSchedule({
      reportType: 'invalid_type' as ComplianceReportType,
      frequency: 'daily',
      recipients: ['admin@example.com'],
      propertyId: PROPERTY_ID,
    });

    expect(errors.some((e) => e.includes('report type'))).toBe(true);
  });

  it('validates monthly dayOfMonth range (1-28)', () => {
    const errors = validateSchedule({
      reportType: 'access_audit',
      frequency: 'monthly',
      dayOfMonth: 31,
      recipients: ['admin@example.com'],
      propertyId: PROPERTY_ID,
    });

    expect(errors.some((e) => e.includes('dayOfMonth'))).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 10. Report export as PDF (placeholder — structured data)
// ---------------------------------------------------------------------------

describe('Report export format', () => {
  it('returns structured data with metadata for PDF generation', async () => {
    mockAuditEntryFindMany.mockResolvedValue([
      {
        id: 'ae-1',
        userId: 'u1',
        action: 'read',
        resource: 'unit',
        resourceId: 'unit-1',
        piiAccessed: false,
        createdAt: new Date(),
      },
    ]);

    const req = createPostRequest('/api/v1/compliance/reports', {
      type: 'access_audit',
      propertyId: PROPERTY_ID,
    });
    const res = await POST_REPORTS(req);
    const body = await parseResponse<{
      data: {
        id: string;
        type: string;
        generatedAt: string;
        summary: Record<string, unknown>;
        records: unknown[];
        metadata: { recordCount: number; generationTimeMs: number; format: string };
      };
    }>(res);

    // Structured data suitable for PDF generation
    expect(body.data.id).toBeDefined();
    expect(body.data.type).toBe('access_audit');
    expect(body.data.generatedAt).toBeDefined();
    expect(body.data.summary).toBeDefined();
    expect(body.data.records).toBeInstanceOf(Array);
    expect(body.data.metadata.recordCount).toBe(1);
    expect(body.data.metadata.generationTimeMs).toBeGreaterThanOrEqual(0);
    expect(body.data.metadata.format).toBe('json');
  });

  it('includes generation timestamp in ISO format', async () => {
    const req = createPostRequest('/api/v1/compliance/reports', {
      type: 'access_audit',
      propertyId: PROPERTY_ID,
    });
    const res = await POST_REPORTS(req);
    const body = await parseResponse<{ data: { generatedAt: string } }>(res);

    // Should be a valid ISO timestamp
    const date = new Date(body.data.generatedAt);
    expect(date.toISOString()).toBe(body.data.generatedAt);
  });
});

// ---------------------------------------------------------------------------
// 11. Report archival: store generated reports
// ---------------------------------------------------------------------------

describe('Report archival', () => {
  it('GET /compliance/reports/:id retrieves an archived report', async () => {
    mockReportRunFindUnique.mockResolvedValue({
      id: 'run-1',
      reportId: 'report-1',
      userId: 'system',
      propertyId: PROPERTY_ID,
      filters: { propertyId: PROPERTY_ID },
      rowCount: 42,
      durationMs: 150,
      exportFormat: 'json',
      createdAt: new Date(),
      report: {
        name: 'Access Audit',
        slug: 'access_audit',
        category: 'security',
        description: 'Who accessed what',
      },
    });

    const req = createGetRequest('/api/v1/compliance/reports/run-1');
    const res = await GET_REPORT_DETAIL(req, {
      params: Promise.resolve({ id: 'run-1' }),
    });

    expect(res.status).toBe(200);
    const body = await parseResponse<{
      data: {
        id: string;
        rowCount: number;
        report: { name: string; slug: string };
      };
    }>(res);

    expect(body.data.id).toBe('run-1');
    expect(body.data.rowCount).toBe(42);
    expect(body.data.report.name).toBe('Access Audit');
  });

  it('returns 404 for non-existent archived report', async () => {
    mockReportRunFindUnique.mockResolvedValue(null);

    const req = createGetRequest('/api/v1/compliance/reports/non-existent');
    const res = await GET_REPORT_DETAIL(req, {
      params: Promise.resolve({ id: 'non-existent' }),
    });

    expect(res.status).toBe(404);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('NOT_FOUND');
  });
});

// ---------------------------------------------------------------------------
// 12. Dashboard: GET /compliance/dashboard — monitoring overview
// ---------------------------------------------------------------------------

describe('GET /compliance/dashboard — Compliance monitoring', () => {
  it('rejects without propertyId', async () => {
    const req = createGetRequest('/api/v1/compliance/dashboard');
    const res = await GET_DASHBOARD(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_PROPERTY');
  });

  it('returns compliance dashboard with overall score', async () => {
    const req = createGetRequest('/api/v1/compliance/dashboard', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET_DASHBOARD(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: {
        overallScore: number;
        scores: Record<string, number>;
        alerts: unknown[];
        lastUpdated: string;
      };
    }>(res);

    expect(body.data.overallScore).toBeGreaterThanOrEqual(0);
    expect(body.data.overallScore).toBeLessThanOrEqual(100);
    expect(body.data.lastUpdated).toBeDefined();
  });

  it('returns individual scores for all 8 compliance areas', async () => {
    const req = createGetRequest('/api/v1/compliance/dashboard', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET_DASHBOARD(req);

    const body = await parseResponse<{
      data: {
        scores: {
          accessAudit: number;
          dataRetention: number;
          consentTracking: number;
          incidentResponse: number;
          vendorCompliance: number;
          securityAudit: number;
          privacyImpact: number;
          slaPerformance: number;
        };
      };
    }>(res);

    const { scores } = body.data;
    expect(scores.accessAudit).toBeDefined();
    expect(scores.dataRetention).toBeDefined();
    expect(scores.consentTracking).toBeDefined();
    expect(scores.incidentResponse).toBeDefined();
    expect(scores.vendorCompliance).toBeDefined();
    expect(scores.securityAudit).toBeDefined();
    expect(scores.privacyImpact).toBeDefined();
    expect(scores.slaPerformance).toBeDefined();

    // All scores should be 0-100
    for (const score of Object.values(scores)) {
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
  });

  it('returns alerts for compliance issues', async () => {
    // Set up expired vendor to trigger alert
    mockVendorFindMany.mockResolvedValue([
      { complianceStatus: 'expired' },
      { complianceStatus: 'expired' },
    ]);

    const req = createGetRequest('/api/v1/compliance/dashboard', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET_DASHBOARD(req);

    const body = await parseResponse<{
      data: {
        alerts: Array<{ type: string; severity: string; message: string }>;
      };
    }>(res);

    const vendorAlert = body.data.alerts.find((a) => a.type === 'vendor_compliance');
    expect(vendorAlert).toBeDefined();
    expect(vendorAlert!.severity).toBe('critical');
    expect(vendorAlert!.message).toContain('expired');
  });

  it('returns data retention alerts when records are overdue', async () => {
    // First call for recent audit count, second for overdue count
    mockAuditEntryCount
      .mockResolvedValueOnce(10) // recent audits
      .mockResolvedValueOnce(100); // overdue records

    const req = createGetRequest('/api/v1/compliance/dashboard', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET_DASHBOARD(req);

    const body = await parseResponse<{
      data: {
        alerts: Array<{ type: string; severity: string; message: string }>;
      };
    }>(res);

    const retentionAlert = body.data.alerts.find((a) => a.type === 'data_retention');
    expect(retentionAlert).toBeDefined();
    expect(retentionAlert!.message).toContain('retention');
  });

  it('handles database errors gracefully', async () => {
    mockAuditEntryCount.mockRejectedValue(new Error('DB error'));

    const req = createGetRequest('/api/v1/compliance/dashboard', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET_DASHBOARD(req);
    expect(res.status).toBe(500);

    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).not.toContain('DB error');
  });
});

// ---------------------------------------------------------------------------
// Additional: Incident response report
// ---------------------------------------------------------------------------

describe('Incident response report', () => {
  it('returns incident summary with status and severity breakdowns', async () => {
    mockIncidentReportFindMany.mockResolvedValue([
      { id: 'i1', status: 'open', severity: 'high', createdAt: new Date() },
      { id: 'i2', status: 'closed', severity: 'low', createdAt: new Date() },
      { id: 'i3', status: 'open', severity: 'high', createdAt: new Date() },
    ]);

    const req = createPostRequest('/api/v1/compliance/reports', {
      type: 'incident_response',
      propertyId: PROPERTY_ID,
    });
    const res = await POST_REPORTS(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{
      data: {
        summary: {
          totalIncidents: number;
          statusBreakdown: Record<string, number>;
          severityBreakdown: Record<string, number>;
        };
      };
    }>(res);

    expect(body.data.summary.totalIncidents).toBe(3);
    expect(body.data.summary.statusBreakdown.open).toBe(2);
    expect(body.data.summary.statusBreakdown.closed).toBe(1);
    expect(body.data.summary.severityBreakdown.high).toBe(2);
    expect(body.data.summary.severityBreakdown.low).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// Additional: Security audit report
// ---------------------------------------------------------------------------

describe('Security audit report', () => {
  it('returns login attempt analysis filtered to property users', async () => {
    mockLoginAuditFindMany.mockResolvedValue([
      { id: 'la-1', userId: 'user-1', success: true, createdAt: new Date() },
      { id: 'la-2', userId: 'user-1', success: false, createdAt: new Date() },
      { id: 'la-3', userId: 'user-2', success: true, createdAt: new Date() },
      { id: 'la-4', userId: 'outsider', success: false, createdAt: new Date() },
    ]);

    mockUserPropertyFindMany.mockResolvedValue([{ userId: 'user-1' }, { userId: 'user-2' }]);

    const req = createPostRequest('/api/v1/compliance/reports', {
      type: 'security_audit',
      propertyId: PROPERTY_ID,
    });
    const res = await POST_REPORTS(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{
      data: {
        summary: {
          totalLoginAttempts: number;
          successCount: number;
          failureCount: number;
          failureRate: number;
        };
      };
    }>(res);

    // Should only include property users (user-1 and user-2), not outsider
    expect(body.data.summary.totalLoginAttempts).toBe(3);
    expect(body.data.summary.successCount).toBe(2);
    expect(body.data.summary.failureCount).toBe(1);
    expect(body.data.summary.failureRate).toBe(33); // 1/3
  });
});

// ---------------------------------------------------------------------------
// Additional: Privacy impact report
// ---------------------------------------------------------------------------

describe('Privacy impact report', () => {
  it('tracks PII access patterns and risk assessment', async () => {
    mockAuditEntryFindMany.mockResolvedValue([
      { id: 'ae-1', userId: 'u1', resource: 'resident', piiAccessed: true, createdAt: new Date() },
      { id: 'ae-2', userId: 'u1', resource: 'resident', piiAccessed: true, createdAt: new Date() },
      { id: 'ae-3', userId: 'u2', resource: 'unit', piiAccessed: true, createdAt: new Date() },
    ]);

    const req = createPostRequest('/api/v1/compliance/reports', {
      type: 'privacy_impact',
      propertyId: PROPERTY_ID,
    });
    const res = await POST_REPORTS(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{
      data: {
        summary: {
          totalPiiAccesses: number;
          uniqueUsersAccessingPii: number;
          resourceBreakdown: Record<string, number>;
          riskLevel: string;
        };
      };
    }>(res);

    expect(body.data.summary.totalPiiAccesses).toBe(3);
    expect(body.data.summary.uniqueUsersAccessingPii).toBe(2);
    expect(body.data.summary.resourceBreakdown.resident).toBe(2);
    expect(body.data.summary.resourceBreakdown.unit).toBe(1);
    expect(body.data.summary.riskLevel).toBe('low'); // < 20 accesses
  });

  it('queries only piiAccessed entries', async () => {
    const req = createPostRequest('/api/v1/compliance/reports', {
      type: 'privacy_impact',
      propertyId: PROPERTY_ID,
    });
    await POST_REPORTS(req);

    const where = mockAuditEntryFindMany.mock.calls[0]![0].where;
    expect(where.piiAccessed).toBe(true);
    expect(where.propertyId).toBe(PROPERTY_ID);
  });
});

// ---------------------------------------------------------------------------
// Tenant isolation across all endpoints
// ---------------------------------------------------------------------------

describe('Tenant isolation', () => {
  it('all report generators scope queries to propertyId', async () => {
    const types: ComplianceReportType[] = [
      'access_audit',
      'data_retention',
      'vendor_compliance',
      'sla_performance',
      'privacy_impact',
    ];

    for (const type of types) {
      vi.clearAllMocks();
      mockAuditEntryFindMany.mockResolvedValue([]);
      mockVendorFindMany.mockResolvedValue([]);
      mockMaintenanceRequestFindMany.mockResolvedValue([]);
      mockUserPropertyFindMany.mockResolvedValue([]);
      mockLoginAuditFindMany.mockResolvedValue([]);
      mockIncidentReportFindMany.mockResolvedValue([]);

      const req = createPostRequest('/api/v1/compliance/reports', {
        type,
        propertyId: PROPERTY_ID,
      });
      await POST_REPORTS(req);

      // Check the first prisma call was scoped to propertyId
      const allMocks = [mockAuditEntryFindMany, mockVendorFindMany, mockMaintenanceRequestFindMany];
      const calledMock = allMocks.find((m) => m.mock.calls.length > 0);
      if (calledMock) {
        const where = calledMock.mock.calls[0]![0].where;
        expect(where.propertyId).toBe(PROPERTY_ID);
      }
    }
  });
});
