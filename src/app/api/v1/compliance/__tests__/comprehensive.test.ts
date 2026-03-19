/**
 * PRD 28 — Compliance Reports Comprehensive Tests
 *
 * Extended TDD coverage for report type listing, access audit generation,
 * data retention reports, SLA performance, vendor compliance aggregation,
 * report scheduling, dashboard health scores, and report archival.
 *
 * These tests complement route.test.ts with additional edge-case coverage.
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
});

const PROPERTY_ID = '00000000-0000-4000-b000-000000000001';

// ---------------------------------------------------------------------------
// 1. Report type listing — comprehensive
// ---------------------------------------------------------------------------

describe('Report Type Listing (Comprehensive)', () => {
  it('every report type has a non-empty category', async () => {
    const req = createGetRequest('/api/v1/compliance/reports');
    const res = await GET_REPORTS(req);
    const body = await parseResponse<{
      data: { reportTypes: Array<{ category: string }> };
    }>(res);

    for (const report of body.data.reportTypes) {
      expect(report.category.length).toBeGreaterThan(0);
    }
  });

  it('REPORT_CATALOG matches COMPLIANCE_REPORT_TYPES count', () => {
    expect(REPORT_CATALOG).toHaveLength(COMPLIANCE_REPORT_TYPES.length);
  });

  it('each catalog entry has a description of at least 10 characters', () => {
    for (const entry of REPORT_CATALOG) {
      expect(entry.description.length).toBeGreaterThanOrEqual(10);
    }
  });
});

// ---------------------------------------------------------------------------
// 2. Access audit report generation — comprehensive
// ---------------------------------------------------------------------------

describe('Access Audit Report (Comprehensive)', () => {
  it('empty audit log returns zero counts', async () => {
    mockAuditEntryFindMany.mockResolvedValue([]);

    const req = createPostRequest('/api/v1/compliance/reports', {
      type: 'access_audit',
      propertyId: PROPERTY_ID,
    });
    const res = await POST_REPORTS(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{
      data: { summary: { totalEntries: number; uniqueUsers: number; piiAccessCount: number } };
    }>(res);
    expect(body.data.summary.totalEntries).toBe(0);
    expect(body.data.summary.uniqueUsers).toBe(0);
    expect(body.data.summary.piiAccessCount).toBe(0);
  });

  it('correctly counts multiple actions from the same user', async () => {
    mockAuditEntryFindMany.mockResolvedValue([
      {
        id: 'ae-1',
        userId: 'user-1',
        action: 'read',
        resource: 'unit',
        piiAccessed: false,
        createdAt: new Date(),
      },
      {
        id: 'ae-2',
        userId: 'user-1',
        action: 'update',
        resource: 'unit',
        piiAccessed: false,
        createdAt: new Date(),
      },
      {
        id: 'ae-3',
        userId: 'user-1',
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
      data: { summary: { totalEntries: number; uniqueUsers: number; piiAccessCount: number } };
    }>(res);

    expect(body.data.summary.totalEntries).toBe(3);
    expect(body.data.summary.uniqueUsers).toBe(1);
    expect(body.data.summary.piiAccessCount).toBe(1);
  });

  it('report response includes metadata with generation time', async () => {
    mockAuditEntryFindMany.mockResolvedValue([]);

    const req = createPostRequest('/api/v1/compliance/reports', {
      type: 'access_audit',
      propertyId: PROPERTY_ID,
    });
    const res = await POST_REPORTS(req);
    const body = await parseResponse<{
      data: { metadata: { generationTimeMs: number; format: string } };
    }>(res);

    expect(body.data.metadata.generationTimeMs).toBeGreaterThanOrEqual(0);
    expect(body.data.metadata.format).toBe('json');
  });
});

// ---------------------------------------------------------------------------
// 3. Data retention report
// ---------------------------------------------------------------------------

describe('Data Retention Report (Comprehensive)', () => {
  it('correctly aggregates resource breakdown', async () => {
    const oldDate = new Date();
    oldDate.setFullYear(oldDate.getFullYear() - 2);

    mockAuditEntryFindMany.mockResolvedValue([
      { id: 'ae-1', resource: 'unit', createdAt: oldDate },
      { id: 'ae-2', resource: 'unit', createdAt: oldDate },
      { id: 'ae-3', resource: 'resident', createdAt: oldDate },
      { id: 'ae-4', resource: 'event', createdAt: oldDate },
    ]);

    const req = createPostRequest('/api/v1/compliance/reports', {
      type: 'data_retention',
      propertyId: PROPERTY_ID,
    });
    const res = await POST_REPORTS(req);
    const body = await parseResponse<{
      data: { summary: { totalOverdue: number; resourceBreakdown: Record<string, number> } };
    }>(res);

    expect(body.data.summary.totalOverdue).toBe(4);
    expect(body.data.summary.resourceBreakdown.unit).toBe(2);
    expect(body.data.summary.resourceBreakdown.resident).toBe(1);
    expect(body.data.summary.resourceBreakdown.event).toBe(1);
  });

  it('returns retentionPeriodDays=365 in summary', async () => {
    mockAuditEntryFindMany.mockResolvedValue([]);

    const req = createPostRequest('/api/v1/compliance/reports', {
      type: 'data_retention',
      propertyId: PROPERTY_ID,
    });
    const res = await POST_REPORTS(req);
    const body = await parseResponse<{
      data: { summary: { retentionPeriodDays: number } };
    }>(res);

    expect(body.data.summary.retentionPeriodDays).toBe(365);
  });
});

// ---------------------------------------------------------------------------
// 4. SLA performance report
// ---------------------------------------------------------------------------

describe('SLA Performance Report (Comprehensive)', () => {
  it('handles zero resolved requests gracefully', async () => {
    mockMaintenanceRequestFindMany.mockResolvedValue([]);

    const req = createPostRequest('/api/v1/compliance/reports', {
      type: 'sla_performance',
      propertyId: PROPERTY_ID,
    });
    const res = await POST_REPORTS(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{
      data: { summary: { totalResolved: number; overallSlaComplianceRate: number } };
    }>(res);
    expect(body.data.summary.totalResolved).toBe(0);
    // With zero resolved requests, the implementation returns 100 (no breaches)
    expect(body.data.summary.overallSlaComplianceRate).toBe(100);
  });

  it('returns correct SLA targets for all 4 priority levels', async () => {
    mockMaintenanceRequestFindMany.mockResolvedValue([]);

    const req = createPostRequest('/api/v1/compliance/reports', {
      type: 'sla_performance',
      propertyId: PROPERTY_ID,
    });
    const res = await POST_REPORTS(req);
    const body = await parseResponse<{
      data: { summary: { slaTargets: Record<string, number> } };
    }>(res);

    expect(body.data.summary.slaTargets.critical).toBe(4);
    expect(body.data.summary.slaTargets.high).toBe(24);
    expect(body.data.summary.slaTargets.normal).toBe(72);
    expect(body.data.summary.slaTargets.low).toBe(168);
  });

  it('mixed priority requests are categorized correctly', async () => {
    const now = new Date();

    mockMaintenanceRequestFindMany.mockResolvedValue([
      {
        id: 'mr-1',
        priority: 'critical',
        createdAt: new Date(now.getTime() - 1 * 60 * 60 * 1000),
        completedDate: now,
        status: 'closed',
      },
      {
        id: 'mr-2',
        priority: 'high',
        createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
        completedDate: now,
        status: 'closed',
      },
      {
        id: 'mr-3',
        priority: 'normal',
        createdAt: new Date(now.getTime() - 48 * 60 * 60 * 1000),
        completedDate: now,
        status: 'closed',
      },
      {
        id: 'mr-4',
        priority: 'low',
        createdAt: new Date(now.getTime() - 100 * 60 * 60 * 1000),
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
          totalResolved: number;
          priorityMetrics: Record<string, { total: number; withinSla: number }>;
        };
      };
    }>(res);

    expect(body.data.summary.totalResolved).toBe(4);
    expect(body.data.summary.priorityMetrics.critical!.total).toBe(1);
    expect(body.data.summary.priorityMetrics.critical!.withinSla).toBe(1); // 1h < 4h
    expect(body.data.summary.priorityMetrics.high!.total).toBe(1);
    expect(body.data.summary.priorityMetrics.high!.withinSla).toBe(1); // 12h < 24h
    expect(body.data.summary.priorityMetrics.normal!.total).toBe(1);
    expect(body.data.summary.priorityMetrics.normal!.withinSla).toBe(1); // 48h < 72h
    expect(body.data.summary.priorityMetrics.low!.total).toBe(1);
    expect(body.data.summary.priorityMetrics.low!.withinSla).toBe(1); // 100h < 168h
  });
});

// ---------------------------------------------------------------------------
// 5. Vendor compliance aggregate
// ---------------------------------------------------------------------------

describe('Vendor Compliance Aggregate (Comprehensive)', () => {
  it('calculates compliance rate correctly with mixed statuses', async () => {
    mockVendorFindMany.mockResolvedValue([
      { id: 'v1', complianceStatus: 'compliant', documents: [], serviceCategory: { name: 'A' } },
      { id: 'v2', complianceStatus: 'compliant', documents: [], serviceCategory: { name: 'B' } },
      { id: 'v3', complianceStatus: 'expiring', documents: [], serviceCategory: { name: 'C' } },
      { id: 'v4', complianceStatus: 'expired', documents: [], serviceCategory: { name: 'D' } },
    ]);

    const req = createPostRequest('/api/v1/compliance/reports', {
      type: 'vendor_compliance',
      propertyId: PROPERTY_ID,
    });
    const res = await POST_REPORTS(req);
    const body = await parseResponse<{
      data: {
        summary: {
          totalVendors: number;
          complianceRate: number;
          statusCounts: Record<string, number>;
        };
      };
    }>(res);

    expect(body.data.summary.totalVendors).toBe(4);
    expect(body.data.summary.statusCounts.compliant).toBe(2);
    expect(body.data.summary.complianceRate).toBe(50); // 2/4
  });

  it('all vendors compliant yields 100% rate', async () => {
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
// 6. Report scheduling
// ---------------------------------------------------------------------------

describe('Report Scheduling (Comprehensive)', () => {
  it('daily schedule is valid with recipients', () => {
    const errors = validateSchedule({
      reportType: 'access_audit',
      frequency: 'daily',
      recipients: ['admin@example.com'],
      propertyId: PROPERTY_ID,
    });
    expect(errors).toHaveLength(0);
  });

  it('weekly schedule without dayOfWeek is invalid', () => {
    const errors = validateSchedule({
      reportType: 'access_audit',
      frequency: 'weekly',
      recipients: ['admin@example.com'],
      propertyId: PROPERTY_ID,
    });
    expect(errors.length).toBeGreaterThan(0);
  });

  it('monthly schedule with dayOfMonth=0 is invalid', () => {
    const errors = validateSchedule({
      reportType: 'access_audit',
      frequency: 'monthly',
      dayOfMonth: 0,
      recipients: ['admin@example.com'],
      propertyId: PROPERTY_ID,
    });
    expect(errors.some((e) => e.includes('dayOfMonth'))).toBe(true);
  });

  it('monthly schedule with dayOfMonth=28 is valid', () => {
    const errors = validateSchedule({
      reportType: 'vendor_compliance',
      frequency: 'monthly',
      dayOfMonth: 28,
      recipients: ['admin@example.com'],
      propertyId: PROPERTY_ID,
    });
    // dayOfMonth 28 is within range, so no dayOfMonth error
    expect(errors.filter((e) => e.includes('dayOfMonth'))).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 7. Dashboard health scores
// ---------------------------------------------------------------------------

describe('Dashboard Health Scores (Comprehensive)', () => {
  it('dashboard returns scores between 0 and 100 for all areas', async () => {
    const req = createGetRequest('/api/v1/compliance/dashboard', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET_DASHBOARD(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { scores: Record<string, number>; overallScore: number };
    }>(res);

    for (const [, score] of Object.entries(body.data.scores)) {
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(100);
    }
    expect(body.data.overallScore).toBeGreaterThanOrEqual(0);
    expect(body.data.overallScore).toBeLessThanOrEqual(100);
  });

  it('dashboard includes lastUpdated timestamp', async () => {
    const req = createGetRequest('/api/v1/compliance/dashboard', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET_DASHBOARD(req);
    const body = await parseResponse<{ data: { lastUpdated: string } }>(res);

    const date = new Date(body.data.lastUpdated);
    expect(date.toISOString()).toBe(body.data.lastUpdated);
  });

  it('dashboard with expired vendors generates critical alert', async () => {
    mockVendorFindMany.mockResolvedValue([{ complianceStatus: 'expired' }]);

    const req = createGetRequest('/api/v1/compliance/dashboard', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET_DASHBOARD(req);
    const body = await parseResponse<{
      data: { alerts: Array<{ type: string; severity: string }> };
    }>(res);

    const vendorAlert = body.data.alerts.find((a) => a.type === 'vendor_compliance');
    expect(vendorAlert).toBeDefined();
    expect(vendorAlert!.severity).toBe('critical');
  });

  it('dashboard requires propertyId', async () => {
    const req = createGetRequest('/api/v1/compliance/dashboard');
    const res = await GET_DASHBOARD(req);
    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_PROPERTY');
  });
});

// ---------------------------------------------------------------------------
// 8. Report archival
// ---------------------------------------------------------------------------

describe('Report Archival (Comprehensive)', () => {
  it('archived report includes full metadata', async () => {
    mockReportRunFindUnique.mockResolvedValue({
      id: 'run-archived',
      reportId: 'report-1',
      userId: 'system',
      propertyId: PROPERTY_ID,
      filters: { propertyId: PROPERTY_ID, from: '2026-01-01', to: '2026-03-31' },
      rowCount: 150,
      durationMs: 320,
      exportFormat: 'json',
      createdAt: new Date(),
      report: {
        name: 'Data Retention',
        slug: 'data_retention',
        category: 'privacy',
        description: 'Records past retention period',
      },
    });

    const req = createGetRequest('/api/v1/compliance/reports/run-archived');
    const res = await GET_REPORT_DETAIL(req, {
      params: Promise.resolve({ id: 'run-archived' }),
    });
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: {
        id: string;
        rowCount: number;
        durationMs: number;
        exportFormat: string;
        report: { slug: string };
      };
    }>(res);

    expect(body.data.id).toBe('run-archived');
    expect(body.data.rowCount).toBe(150);
    expect(body.data.durationMs).toBe(320);
    expect(body.data.exportFormat).toBe('json');
    expect(body.data.report.slug).toBe('data_retention');
  });

  it('returns NOT_FOUND for non-existent archived report', async () => {
    mockReportRunFindUnique.mockResolvedValue(null);

    const req = createGetRequest('/api/v1/compliance/reports/non-existent');
    const res = await GET_REPORT_DETAIL(req, {
      params: Promise.resolve({ id: 'non-existent' }),
    });
    expect(res.status).toBe(404);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('NOT_FOUND');
  });

  it('generated reports include a unique id', async () => {
    mockAuditEntryFindMany.mockResolvedValue([]);

    const req = createPostRequest('/api/v1/compliance/reports', {
      type: 'access_audit',
      propertyId: PROPERTY_ID,
    });
    const res = await POST_REPORTS(req);
    const body = await parseResponse<{ data: { id: string } }>(res);
    expect(body.data.id).toBeDefined();
    expect(body.data.id.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// 9. Incident response report — extended
// ---------------------------------------------------------------------------

describe('Incident Response Report (Comprehensive)', () => {
  it('handles zero incidents gracefully', async () => {
    mockIncidentReportFindMany.mockResolvedValue([]);

    const req = createPostRequest('/api/v1/compliance/reports', {
      type: 'incident_response',
      propertyId: PROPERTY_ID,
    });
    const res = await POST_REPORTS(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{
      data: { summary: { totalIncidents: number } };
    }>(res);
    expect(body.data.summary.totalIncidents).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 10. Privacy impact report — extended
// ---------------------------------------------------------------------------

describe('Privacy Impact Report (Comprehensive)', () => {
  it('risk level escalates with more PII accesses', async () => {
    // Create a large number of PII access entries
    const entries = Array.from({ length: 50 }, (_, i) => ({
      id: `ae-${i}`,
      userId: `user-${i % 5}`,
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
      data: { summary: { totalPiiAccesses: number; riskLevel: string } };
    }>(res);

    expect(body.data.summary.totalPiiAccesses).toBe(50);
    // Risk level should be higher than 'low' with 50 accesses
    expect(['medium', 'high']).toContain(body.data.summary.riskLevel);
  });

  it('zero PII accesses returns low risk', async () => {
    mockAuditEntryFindMany.mockResolvedValue([]);

    const req = createPostRequest('/api/v1/compliance/reports', {
      type: 'privacy_impact',
      propertyId: PROPERTY_ID,
    });
    const res = await POST_REPORTS(req);
    const body = await parseResponse<{
      data: { summary: { totalPiiAccesses: number; riskLevel: string } };
    }>(res);

    expect(body.data.summary.totalPiiAccesses).toBe(0);
    expect(body.data.summary.riskLevel).toBe('low');
  });
});
