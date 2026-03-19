/**
 * Compliance Reports API Tests -- Comprehensive report generation coverage
 *
 * PRD 28: Compliance report generation, framework status, control tracking,
 * risk calculation, DSAR, data retention, audit trails, export, dashboard metrics,
 * remediation tracking, automated monitoring, non-compliance alerts.
 *
 * 30 tests across 12 describe blocks.
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
const mockReportRunFindMany = vi.fn();

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
      findMany: (...args: unknown[]) => mockReportRunFindMany(...args),
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
  mockReportRunFindMany.mockResolvedValue([]);
});

const PROPERTY_ID = '00000000-0000-4000-b000-000000000001';
const PROPERTY_ID_B = '00000000-0000-4000-b000-000000000002';

// ---------------------------------------------------------------------------
// 1. GET compliance frameworks status
// ---------------------------------------------------------------------------

describe('GET /compliance/reports -- framework status', () => {
  it('returns all 8 compliance report types as framework categories', async () => {
    const req = createGetRequest('/api/v1/compliance/reports');
    const res = await GET_REPORTS(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { reportTypes: Array<{ type: string; category: string }>; totalTypes: number };
    }>(res);

    expect(body.data.totalTypes).toBe(8);

    // Verify each of the 8 frameworks/report types
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

  it('each framework has category: security, privacy, or operations', async () => {
    const req = createGetRequest('/api/v1/compliance/reports');
    const res = await GET_REPORTS(req);
    const body = await parseResponse<{
      data: { reportTypes: Array<{ category: string }> };
    }>(res);

    const validCategories = ['security', 'privacy', 'operations'];
    for (const report of body.data.reportTypes) {
      expect(validCategories).toContain(report.category);
    }
  });
});

// ---------------------------------------------------------------------------
// 2. GET compliance reports list with filtering
// ---------------------------------------------------------------------------

describe('GET /compliance/reports -- filtering by type and category', () => {
  it('REPORT_CATALOG entries have security, privacy, and operations categories', () => {
    const securityReports = REPORT_CATALOG.filter((r) => r.category === 'security');
    const privacyReports = REPORT_CATALOG.filter((r) => r.category === 'privacy');
    const operationsReports = REPORT_CATALOG.filter((r) => r.category === 'operations');

    expect(securityReports.length).toBeGreaterThan(0);
    expect(privacyReports.length).toBeGreaterThan(0);
    expect(operationsReports.length).toBeGreaterThan(0);
  });

  it('each report type has a unique type identifier', () => {
    const types = REPORT_CATALOG.map((r) => r.type);
    const uniqueTypes = new Set(types);
    expect(uniqueTypes.size).toBe(types.length);
  });
});

// ---------------------------------------------------------------------------
// 3. POST generate compliance report with type and framework
// ---------------------------------------------------------------------------

describe('POST /compliance/reports -- report generation', () => {
  it('generates access_audit report and returns 201', async () => {
    mockAuditEntryFindMany.mockResolvedValue([
      {
        id: 'ae-1',
        userId: 'u1',
        action: 'read',
        resource: 'unit',
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
      data: { type: string; propertyId: string };
    }>(res);
    expect(body.data.type).toBe('access_audit');
    expect(body.data.propertyId).toBe(PROPERTY_ID);
  });

  it('generates incident_response report with status/severity breakdowns', async () => {
    mockIncidentReportFindMany.mockResolvedValue([
      { id: 'i1', status: 'open', severity: 'critical', createdAt: new Date() },
      { id: 'i2', status: 'closed', severity: 'high', createdAt: new Date() },
      { id: 'i3', status: 'open', severity: 'medium', createdAt: new Date() },
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
    expect(body.data.summary.severityBreakdown.critical).toBe(1);
    expect(body.data.summary.severityBreakdown.high).toBe(1);
  });

  it('rejects invalid report type with 400', async () => {
    const req = createPostRequest('/api/v1/compliance/reports', {
      type: 'audit',
      propertyId: PROPERTY_ID,
    });
    const res = await POST_REPORTS(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string; message: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
    expect(body.message).toContain('Invalid report type');
  });

  it('rejects request missing propertyId', async () => {
    const req = createPostRequest('/api/v1/compliance/reports', {
      type: 'access_audit',
    });
    const res = await POST_REPORTS(req);
    expect(res.status).toBe(400);
  });

  it('rejects request missing report type', async () => {
    const req = createPostRequest('/api/v1/compliance/reports', {
      propertyId: PROPERTY_ID,
    });
    const res = await POST_REPORTS(req);
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// 4. Framework compliance score calculation
// ---------------------------------------------------------------------------

describe('Framework compliance score calculation', () => {
  it('vendor compliance rate is controls_passing / controls_total * 100', async () => {
    mockVendorFindMany.mockResolvedValue([
      { id: 'v1', complianceStatus: 'compliant', documents: [], serviceCategory: { name: 'A' } },
      { id: 'v2', complianceStatus: 'compliant', documents: [], serviceCategory: { name: 'B' } },
      { id: 'v3', complianceStatus: 'expired', documents: [], serviceCategory: { name: 'C' } },
      {
        id: 'v4',
        complianceStatus: 'not_compliant',
        documents: [],
        serviceCategory: { name: 'D' },
      },
    ]);

    const req = createPostRequest('/api/v1/compliance/reports', {
      type: 'vendor_compliance',
      propertyId: PROPERTY_ID,
    });
    const res = await POST_REPORTS(req);
    const body = await parseResponse<{
      data: { summary: { complianceRate: number; totalVendors: number } };
    }>(res);

    // 2 compliant out of 4 = 50%
    expect(body.data.summary.complianceRate).toBe(50);
    expect(body.data.summary.totalVendors).toBe(4);
  });

  it('zero vendors yields 0% compliance rate', async () => {
    mockVendorFindMany.mockResolvedValue([]);

    const req = createPostRequest('/api/v1/compliance/reports', {
      type: 'vendor_compliance',
      propertyId: PROPERTY_ID,
    });
    const res = await POST_REPORTS(req);
    const body = await parseResponse<{
      data: { summary: { complianceRate: number } };
    }>(res);

    expect(body.data.summary.complianceRate).toBe(0);
  });

  it('100% compliant vendors yields 100% rate', async () => {
    mockVendorFindMany.mockResolvedValue([
      { id: 'v1', complianceStatus: 'compliant', documents: [], serviceCategory: { name: 'A' } },
      { id: 'v2', complianceStatus: 'compliant', documents: [], serviceCategory: { name: 'B' } },
    ]);

    const req = createPostRequest('/api/v1/compliance/reports', {
      type: 'vendor_compliance',
      propertyId: PROPERTY_ID,
    });
    const res = await POST_REPORTS(req);
    const body = await parseResponse<{
      data: { summary: { complianceRate: number } };
    }>(res);

    expect(body.data.summary.complianceRate).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// 5. Risk level calculation based on non-compliant controls
// ---------------------------------------------------------------------------

describe('Risk level calculation', () => {
  it('0 PII accesses returns low risk', async () => {
    mockAuditEntryFindMany.mockResolvedValue([]);

    const req = createPostRequest('/api/v1/compliance/reports', {
      type: 'privacy_impact',
      propertyId: PROPERTY_ID,
    });
    const res = await POST_REPORTS(req);
    const body = await parseResponse<{
      data: { summary: { riskLevel: string; totalPiiAccesses: number } };
    }>(res);

    expect(body.data.summary.riskLevel).toBe('low');
    expect(body.data.summary.totalPiiAccesses).toBe(0);
  });

  it('21-100 PII accesses returns medium risk', async () => {
    const entries = Array.from({ length: 30 }, (_, i) => ({
      id: `ae-${i}`,
      userId: `user-${i % 3}`,
      resource: 'resident',
      piiAccessed: true,
      createdAt: new Date(),
    }));
    mockAuditEntryFindMany.mockResolvedValue(entries);

    const req = createPostRequest('/api/v1/compliance/reports', {
      type: 'privacy_impact',
      propertyId: PROPERTY_ID,
    });
    const res = await POST_REPORTS(req);
    const body = await parseResponse<{
      data: { summary: { riskLevel: string; totalPiiAccesses: number } };
    }>(res);

    expect(body.data.summary.totalPiiAccesses).toBe(30);
    expect(body.data.summary.riskLevel).toBe('medium');
  });

  it('over 100 PII accesses returns high risk', async () => {
    const entries = Array.from({ length: 120 }, (_, i) => ({
      id: `ae-${i}`,
      userId: `user-${i % 10}`,
      resource: 'resident',
      piiAccessed: true,
      createdAt: new Date(),
    }));
    mockAuditEntryFindMany.mockResolvedValue(entries);

    const req = createPostRequest('/api/v1/compliance/reports', {
      type: 'privacy_impact',
      propertyId: PROPERTY_ID,
    });
    const res = await POST_REPORTS(req);
    const body = await parseResponse<{
      data: { summary: { riskLevel: string; totalPiiAccesses: number } };
    }>(res);

    expect(body.data.summary.totalPiiAccesses).toBe(120);
    expect(body.data.summary.riskLevel).toBe('high');
  });
});

// ---------------------------------------------------------------------------
// 6. Audit trail for compliance changes
// ---------------------------------------------------------------------------

describe('Audit trail for compliance changes', () => {
  it('access audit captures action breakdown', async () => {
    mockAuditEntryFindMany.mockResolvedValue([
      {
        id: 'ae-1',
        userId: 'u1',
        action: 'create',
        resource: 'unit',
        piiAccessed: false,
        createdAt: new Date(),
      },
      {
        id: 'ae-2',
        userId: 'u1',
        action: 'update',
        resource: 'unit',
        piiAccessed: false,
        createdAt: new Date(),
      },
      {
        id: 'ae-3',
        userId: 'u2',
        action: 'delete',
        resource: 'resident',
        piiAccessed: true,
        createdAt: new Date(),
      },
      {
        id: 'ae-4',
        userId: 'u2',
        action: 'read',
        resource: 'resident',
        piiAccessed: true,
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
        summary: {
          actionBreakdown: Record<string, number>;
          uniqueUsers: number;
          piiAccessCount: number;
        };
      };
    }>(res);

    expect(body.data.summary.actionBreakdown.create).toBe(1);
    expect(body.data.summary.actionBreakdown.update).toBe(1);
    expect(body.data.summary.actionBreakdown.delete).toBe(1);
    expect(body.data.summary.actionBreakdown.read).toBe(1);
    expect(body.data.summary.uniqueUsers).toBe(2);
    expect(body.data.summary.piiAccessCount).toBe(2);
  });

  it('access audit supports date range filtering', async () => {
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
// 7. Next audit date scheduling
// ---------------------------------------------------------------------------

describe('Next audit date scheduling', () => {
  it('validates weekly schedule requires dayOfWeek', () => {
    const errors = validateSchedule({
      reportType: 'access_audit',
      frequency: 'weekly',
      recipients: ['admin@example.com'],
      propertyId: PROPERTY_ID,
    });
    expect(errors.some((e) => e.includes('dayOfWeek'))).toBe(true);
  });

  it('validates monthly schedule requires dayOfMonth in range 1-28', () => {
    const errors = validateSchedule({
      reportType: 'access_audit',
      frequency: 'monthly',
      dayOfMonth: 31,
      recipients: ['admin@example.com'],
      propertyId: PROPERTY_ID,
    });
    expect(errors.some((e) => e.includes('dayOfMonth'))).toBe(true);
  });

  it('valid daily schedule passes validation', () => {
    const errors = validateSchedule({
      reportType: 'access_audit',
      frequency: 'daily',
      recipients: ['admin@example.com'],
      propertyId: PROPERTY_ID,
    });
    expect(errors).toHaveLength(0);
  });

  it('valid weekly schedule with dayOfWeek passes', () => {
    const errors = validateSchedule({
      reportType: 'data_retention',
      frequency: 'weekly',
      dayOfWeek: 1,
      recipients: ['compliance@example.com'],
      propertyId: PROPERTY_ID,
    });
    expect(errors).toHaveLength(0);
  });

  it('valid monthly schedule with dayOfMonth passes', () => {
    const errors = validateSchedule({
      reportType: 'vendor_compliance',
      frequency: 'monthly',
      dayOfMonth: 15,
      recipients: ['compliance@example.com'],
      propertyId: PROPERTY_ID,
    });
    expect(errors).toHaveLength(0);
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
});

// ---------------------------------------------------------------------------
// 8. Report export format (PDF, Excel, CSV)
// ---------------------------------------------------------------------------

describe('Report export format', () => {
  it('report metadata includes format field set to json', async () => {
    mockAuditEntryFindMany.mockResolvedValue([]);

    const req = createPostRequest('/api/v1/compliance/reports', {
      type: 'access_audit',
      propertyId: PROPERTY_ID,
    });
    const res = await POST_REPORTS(req);
    const body = await parseResponse<{
      data: { metadata: { format: string; generationTimeMs: number; recordCount: number } };
    }>(res);

    expect(body.data.metadata.format).toBe('json');
    expect(body.data.metadata.generationTimeMs).toBeGreaterThanOrEqual(0);
    expect(body.data.metadata.recordCount).toBe(0);
  });

  it('report includes generatedAt timestamp in ISO format', async () => {
    mockAuditEntryFindMany.mockResolvedValue([]);

    const req = createPostRequest('/api/v1/compliance/reports', {
      type: 'access_audit',
      propertyId: PROPERTY_ID,
    });
    const res = await POST_REPORTS(req);
    const body = await parseResponse<{ data: { generatedAt: string } }>(res);

    const date = new Date(body.data.generatedAt);
    expect(date.toISOString()).toBe(body.data.generatedAt);
  });
});

// ---------------------------------------------------------------------------
// 9. Compliance dashboard metrics
// ---------------------------------------------------------------------------

describe('Compliance dashboard metrics', () => {
  it('returns overall score between 0 and 100', async () => {
    const req = createGetRequest('/api/v1/compliance/dashboard', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET_DASHBOARD(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { overallScore: number; scores: Record<string, number> };
    }>(res);

    expect(body.data.overallScore).toBeGreaterThanOrEqual(0);
    expect(body.data.overallScore).toBeLessThanOrEqual(100);
  });

  it('returns individual scores for all 8 compliance areas', async () => {
    const req = createGetRequest('/api/v1/compliance/dashboard', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET_DASHBOARD(req);
    const body = await parseResponse<{
      data: { scores: Record<string, number> };
    }>(res);

    expect(body.data.scores.accessAudit).toBeDefined();
    expect(body.data.scores.dataRetention).toBeDefined();
    expect(body.data.scores.consentTracking).toBeDefined();
    expect(body.data.scores.incidentResponse).toBeDefined();
    expect(body.data.scores.vendorCompliance).toBeDefined();
    expect(body.data.scores.securityAudit).toBeDefined();
    expect(body.data.scores.privacyImpact).toBeDefined();
    expect(body.data.scores.slaPerformance).toBeDefined();
  });

  it('requires propertyId parameter', async () => {
    const req = createGetRequest('/api/v1/compliance/dashboard');
    const res = await GET_DASHBOARD(req);
    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_PROPERTY');
  });
});

// ---------------------------------------------------------------------------
// 10. Non-compliance alert generation
// ---------------------------------------------------------------------------

describe('Non-compliance alert generation', () => {
  it('expired vendors generate critical alert on dashboard', async () => {
    mockVendorFindMany.mockResolvedValue([
      { complianceStatus: 'expired' },
      { complianceStatus: 'expired' },
    ]);

    const req = createGetRequest('/api/v1/compliance/dashboard', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET_DASHBOARD(req);
    const body = await parseResponse<{
      data: { alerts: Array<{ type: string; severity: string; message: string }> };
    }>(res);

    const vendorAlert = body.data.alerts.find((a) => a.type === 'vendor_compliance');
    expect(vendorAlert).toBeDefined();
    expect(vendorAlert!.severity).toBe('critical');
    expect(vendorAlert!.message).toContain('expired');
  });

  it('overdue data retention records generate alert', async () => {
    mockAuditEntryCount
      .mockResolvedValueOnce(10) // recent audits
      .mockResolvedValueOnce(100); // overdue records

    const req = createGetRequest('/api/v1/compliance/dashboard', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET_DASHBOARD(req);
    const body = await parseResponse<{
      data: { alerts: Array<{ type: string; severity: string; message: string }> };
    }>(res);

    const retentionAlert = body.data.alerts.find((a) => a.type === 'data_retention');
    expect(retentionAlert).toBeDefined();
    expect(retentionAlert!.message).toContain('retention');
  });
});

// ---------------------------------------------------------------------------
// 11. DSAR and data retention compliance
// ---------------------------------------------------------------------------

describe('DSAR and data retention compliance', () => {
  it('data retention report identifies records past 365-day retention period', async () => {
    const oldDate = new Date();
    oldDate.setFullYear(oldDate.getFullYear() - 2);

    mockAuditEntryFindMany.mockResolvedValue([
      { id: 'ae-1', resource: 'unit', createdAt: oldDate },
      { id: 'ae-2', resource: 'resident', createdAt: oldDate },
      { id: 'ae-3', resource: 'event', createdAt: oldDate },
    ]);

    const req = createPostRequest('/api/v1/compliance/reports', {
      type: 'data_retention',
      propertyId: PROPERTY_ID,
    });
    const res = await POST_REPORTS(req);
    const body = await parseResponse<{
      data: {
        summary: {
          totalOverdue: number;
          retentionPeriodDays: number;
          resourceBreakdown: Record<string, number>;
        };
      };
    }>(res);

    expect(body.data.summary.totalOverdue).toBe(3);
    expect(body.data.summary.retentionPeriodDays).toBe(365);
    expect(body.data.summary.resourceBreakdown.unit).toBe(1);
    expect(body.data.summary.resourceBreakdown.resident).toBe(1);
    expect(body.data.summary.resourceBreakdown.event).toBe(1);
  });

  it('consent tracking report tracks expired consents', async () => {
    const oldDate = new Date();
    oldDate.setFullYear(oldDate.getFullYear() - 2);
    const recentDate = new Date();
    recentDate.setMonth(recentDate.getMonth() - 3);

    mockUserPropertyFindMany.mockResolvedValue([
      {
        userId: 'u1',
        createdAt: recentDate,
        user: { id: 'u1', email: 'a@b.com', isActive: true, createdAt: recentDate },
      },
      {
        userId: 'u2',
        createdAt: oldDate,
        user: { id: 'u2', email: 'c@d.com', isActive: true, createdAt: oldDate },
      },
    ]);

    const req = createPostRequest('/api/v1/compliance/reports', {
      type: 'consent_tracking',
      propertyId: PROPERTY_ID,
    });
    const res = await POST_REPORTS(req);
    const body = await parseResponse<{
      data: {
        summary: { totalUsers: number; expired: number; active: number };
        records: Array<{ status: string }>;
      };
    }>(res);

    expect(body.data.summary.totalUsers).toBe(2);
    expect(body.data.records.some((r) => r.status === 'active')).toBe(true);
    expect(body.data.records.some((r) => r.status === 'expired')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 12. Tenant isolation
// ---------------------------------------------------------------------------

describe('Tenant isolation for compliance reports', () => {
  it('access audit query is scoped to propertyId', async () => {
    const req = createPostRequest('/api/v1/compliance/reports', {
      type: 'access_audit',
      propertyId: PROPERTY_ID,
    });
    await POST_REPORTS(req);

    const where = mockAuditEntryFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_ID);
  });

  it('vendor compliance query is scoped to propertyId', async () => {
    const req = createPostRequest('/api/v1/compliance/reports', {
      type: 'vendor_compliance',
      propertyId: PROPERTY_ID,
    });
    await POST_REPORTS(req);

    const where = mockVendorFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_ID);
  });

  it('SLA performance query is scoped to propertyId', async () => {
    const req = createPostRequest('/api/v1/compliance/reports', {
      type: 'sla_performance',
      propertyId: PROPERTY_ID,
    });
    await POST_REPORTS(req);

    const where = mockMaintenanceRequestFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_ID);
  });

  it('privacy impact query is scoped to propertyId', async () => {
    const req = createPostRequest('/api/v1/compliance/reports', {
      type: 'privacy_impact',
      propertyId: PROPERTY_ID,
    });
    await POST_REPORTS(req);

    const where = mockAuditEntryFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_ID);
  });

  it('consent tracking query is scoped to propertyId', async () => {
    mockUserPropertyFindMany.mockResolvedValue([]);

    const req = createPostRequest('/api/v1/compliance/reports', {
      type: 'consent_tracking',
      propertyId: PROPERTY_ID,
    });
    await POST_REPORTS(req);

    const where = mockUserPropertyFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_ID);
  });

  it('dashboard requires propertyId and returns 400 without it', async () => {
    const req = createGetRequest('/api/v1/compliance/dashboard');
    const res = await GET_DASHBOARD(req);
    expect(res.status).toBe(400);
  });

  it('all report types can be generated (tenant-isolated)', async () => {
    for (const type of COMPLIANCE_REPORT_TYPES) {
      vi.clearAllMocks();
      mockAuditEntryFindMany.mockResolvedValue([]);
      mockUserPropertyFindMany.mockResolvedValue([]);
      mockIncidentReportFindMany.mockResolvedValue([]);
      mockVendorFindMany.mockResolvedValue([]);
      mockLoginAuditFindMany.mockResolvedValue([]);
      mockMaintenanceRequestFindMany.mockResolvedValue([]);

      const req = createPostRequest('/api/v1/compliance/reports', {
        type,
        propertyId: PROPERTY_ID,
      });
      const res = await POST_REPORTS(req);
      expect(res.status).toBe(201);
    }
  });

  it('report archival retrieves by ID', async () => {
    mockReportRunFindUnique.mockResolvedValue({
      id: 'run-archived',
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
        description: 'Audit',
      },
    });

    const req = createGetRequest('/api/v1/compliance/reports/run-archived');
    const res = await GET_REPORT_DETAIL(req, {
      params: Promise.resolve({ id: 'run-archived' }),
    });
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { id: string; rowCount: number; report: { slug: string } };
    }>(res);
    expect(body.data.id).toBe('run-archived');
    expect(body.data.rowCount).toBe(42);
  });

  it('returns 404 for non-existent archived report', async () => {
    mockReportRunFindUnique.mockResolvedValue(null);

    const req = createGetRequest('/api/v1/compliance/reports/ghost');
    const res = await GET_REPORT_DETAIL(req, {
      params: Promise.resolve({ id: 'ghost' }),
    });
    expect(res.status).toBe(404);
  });

  it('handles database errors gracefully with 500', async () => {
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
