/**
 * Integration Workflow Tests — Compliance Audit Lifecycle
 *
 * Tests complete compliance audit workflows across multiple API endpoints:
 *   - PIPEDA audit cycle (schedule -> review controls -> report -> score -> remediation)
 *   - DSAR (Data Subject Access Request) export
 *   - Vendor compliance check (insurance status -> alerts -> update)
 *
 * Each test validates compliance framework operations, report generation,
 * data export, and vendor insurance lifecycle.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createGetRequest,
  createPostRequest,
  createPatchRequest,
  parseResponse,
} from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Prisma Mock
// ---------------------------------------------------------------------------

const mockComplianceReportCreate = vi.fn();
const mockComplianceReportFindMany = vi.fn();
const mockComplianceReportFindUnique = vi.fn();

const mockReportRunFindUnique = vi.fn();

const mockVendorFindUnique = vi.fn();
const mockVendorFindMany = vi.fn();
const mockVendorUpdate = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    complianceReport: {
      create: (...args: unknown[]) => mockComplianceReportCreate(...args),
      findMany: (...args: unknown[]) => mockComplianceReportFindMany(...args),
      findUnique: (...args: unknown[]) => mockComplianceReportFindUnique(...args),
    },
    reportRun: {
      findUnique: (...args: unknown[]) => mockReportRunFindUnique(...args),
    },
    vendor: {
      findUnique: (...args: unknown[]) => mockVendorFindUnique(...args),
      findMany: (...args: unknown[]) => mockVendorFindMany(...args),
      update: (...args: unknown[]) => mockVendorUpdate(...args),
    },
  },
}));

vi.mock('@/lib/sanitize', () => ({
  stripHtml: (s: string) => s,
  stripControlChars: (s: string) => s,
}));

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: vi.fn().mockResolvedValue({
    user: {
      userId: 'admin-001',
      propertyId: 'prop-001',
      role: 'property_admin',
      permissions: ['*'],
      mfaVerified: true,
    },
    error: null,
  }),
}));

vi.mock('@/server/compliance', () => ({
  COMPLIANCE_REPORT_TYPES: [
    'privacy_impact',
    'data_inventory',
    'consent_audit',
    'breach_response',
    'access_control',
    'security_audit',
    'vendor_compliance',
    'retention_audit',
  ],
  REPORT_CATALOG: [
    {
      type: 'privacy_impact',
      name: 'Privacy Impact Assessment',
      category: 'privacy',
      description: 'DPIA evaluation',
    },
    {
      type: 'data_inventory',
      name: 'Data Inventory',
      category: 'privacy',
      description: 'Data mapping',
    },
    {
      type: 'consent_audit',
      name: 'Consent Audit',
      category: 'privacy',
      description: 'Consent tracking',
    },
    {
      type: 'breach_response',
      name: 'Breach Response',
      category: 'security',
      description: 'Breach readiness',
    },
    {
      type: 'access_control',
      name: 'Access Control',
      category: 'security',
      description: 'Access review',
    },
    {
      type: 'security_audit',
      name: 'Security Audit',
      category: 'security',
      description: 'Security posture',
    },
    {
      type: 'vendor_compliance',
      name: 'Vendor Compliance',
      category: 'security',
      description: 'Vendor check',
    },
    {
      type: 'retention_audit',
      name: 'Retention Audit',
      category: 'privacy',
      description: 'Data retention',
    },
  ],
  generateComplianceReport: vi.fn().mockImplementation((type: string) => ({
    type,
    status: 'completed',
    findings: [
      { controlId: 'ctrl-1', status: 'compliant', details: 'Control verified' },
      { controlId: 'ctrl-2', status: 'non_compliant', details: 'Remediation needed' },
    ],
    summary: {
      totalControls: 10,
      compliant: 8,
      nonCompliant: 1,
      partial: 1,
      score: 85,
    },
    generatedAt: new Date().toISOString(),
  })),
  validateSchedule: vi.fn().mockReturnValue([]),
}));

vi.mock('@/server/data-migration', () => ({
  exportPropertyData: vi.fn().mockResolvedValue({
    id: 'export-001',
    propertyId: '00000000-0000-4000-a000-000000000001',
    entityTypes: ['users', 'packages', 'maintenanceRequests', 'bookings', 'events'],
    format: 'json',
    dsarCompliant: true,
    generatedAt: new Date(),
    data: {
      users: [{ id: 'user-001', firstName: 'Jane', lastName: 'Doe', email: 'jane@example.com' }],
      packages: [{ id: 'pkg-001', unitId: 'unit-101', status: 'released' }],
      maintenanceRequests: [{ id: 'mr-001', description: 'Leaky faucet', status: 'completed' }],
      bookings: [{ id: 'booking-001', amenityId: 'amenity-001', status: 'completed' }],
      events: [{ id: 'event-001', type: 'visitor', description: 'Visitor check-in' }],
    },
  }),
  ENTITY_FIELDS: {
    users: ['id', 'firstName', 'lastName', 'email'],
    packages: ['id', 'unitId', 'status'],
    maintenanceRequests: ['id', 'description', 'status'],
    bookings: ['id', 'amenityId', 'status'],
    events: ['id', 'type', 'description'],
  },
}));

vi.mock('@/server/vendors/compliance', () => ({
  calculateComplianceStatus: vi
    .fn()
    .mockImplementation((documents: { type: string; expiresAt: Date | null }[]) => {
      if (!documents || documents.length === 0) return 'not_tracked';

      const now = new Date();
      const hasExpired = documents.some(
        (d: { expiresAt: Date | null }) => d.expiresAt && new Date(d.expiresAt) < now,
      );
      const hasExpiring = documents.some((d: { expiresAt: Date | null }) => {
        if (!d.expiresAt) return false;
        const exp = new Date(d.expiresAt);
        const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        return exp > now && exp < thirtyDays;
      });

      if (hasExpired) return 'expired';
      if (hasExpiring) return 'expiring_soon';
      return 'compliant';
    }),
}));

vi.mock('@/schemas/vendor', () => ({
  updateVendorSchema: {
    safeParse: vi.fn().mockImplementation((data: Record<string, unknown>) => ({
      success: true,
      data,
    })),
  },
}));

vi.mock('@/server/email', () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true }),
}));

// ---------------------------------------------------------------------------
// Import route handlers AFTER mocks
// ---------------------------------------------------------------------------

import { GET as listCompliance, POST as generateReport } from '@/app/api/v1/compliance/route';
import {
  GET as getComplianceDetail,
  PATCH as updateControl,
  POST as scheduleAudit,
} from '@/app/api/v1/compliance/[id]/route';
import {
  GET as listReportTypes,
  POST as generateReportViaReports,
} from '@/app/api/v1/compliance/reports/route';
import { GET as getReportDetail } from '@/app/api/v1/compliance/reports/[id]/route';
import { POST as exportData } from '@/app/api/v1/data-migration/export/route';
import { GET as getVendor, PATCH as updateVendor } from '@/app/api/v1/vendors/[id]/route';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROPERTY_ID = '00000000-0000-4000-a000-000000000001';
const VENDOR_ID = 'vendor-plumber-001';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeComplianceReport(overrides: Record<string, unknown> = {}) {
  return {
    id: 'report-001',
    propertyId: PROPERTY_ID,
    type: 'privacy_impact',
    parameters: { framework: 'pipeda', from: null, to: null },
    status: 'completed',
    generatedBy: 'admin-001',
    generatedAt: new Date('2026-03-15T10:00:00Z'),
    ...overrides,
  };
}

function makeVendor(overrides: Record<string, unknown> = {}) {
  return {
    id: VENDOR_ID,
    propertyId: PROPERTY_ID,
    name: 'Reliable Plumbing Co.',
    email: 'contact@reliableplumbing.com',
    phone: '416-555-1234',
    status: 'active',
    serviceCategory: { id: 'cat-plumbing', name: 'Plumbing' },
    documents: [],
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

// ===========================================================================
// SCENARIO 1: PIPEDA Audit Cycle
// ===========================================================================

describe('Scenario 1: PIPEDA Audit Cycle (schedule -> review controls -> report -> score -> remediation)', () => {
  it('Step 1: view PIPEDA framework controls via GET /compliance/pipeda', async () => {
    const req = createGetRequest('/api/v1/compliance/pipeda', {
      searchParams: { propertyId: PROPERTY_ID },
    });

    const res = await getComplianceDetail(req, { params: Promise.resolve({ id: 'pipeda' }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: {
        frameworkId: string;
        controls: { id: string; name: string; status: string }[];
        totalControls: number;
        criticalControls: number;
      };
    }>(res);
    expect(body.data.frameworkId).toBe('pipeda');
    expect(body.data.totalControls).toBe(10);
    expect(body.data.criticalControls).toBeGreaterThan(0);
    expect(body.data.controls).toHaveLength(10);
    // All controls should start as not_assessed
    expect(body.data.controls.every((c) => c.status === 'not_assessed')).toBe(true);
  });

  it('Step 2: review individual control — mark as compliant via PATCH /compliance/pipeda', async () => {
    const req = createPatchRequest('/api/v1/compliance/pipeda', {
      controlId: 'pip-1',
      status: 'compliant',
      evidence: 'Privacy officer appointed. Documentation on file.',
      notes: 'Reviewed by external auditor on 2026-03-10.',
    });

    const res = await updateControl(req, { params: Promise.resolve({ id: 'pipeda' }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { id: string; status: string; evidence: string };
      message: string;
    }>(res);
    expect(body.data.id).toBe('pip-1');
    expect(body.data.status).toBe('compliant');
    expect(body.data.evidence).toContain('Privacy officer');
    expect(body.message).toContain('Accountability');
  });

  it('Step 2b: mark control as non_compliant', async () => {
    const req = createPatchRequest('/api/v1/compliance/pipeda', {
      controlId: 'pip-6',
      status: 'non_compliant',
      evidence: 'Data quality checks not implemented.',
      notes: 'Remediation due by Q2 2026.',
    });

    const res = await updateControl(req, { params: Promise.resolve({ id: 'pipeda' }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { status: string } }>(res);
    expect(body.data.status).toBe('non_compliant');
  });

  it('Step 2c: reject invalid controlId', async () => {
    const req = createPatchRequest('/api/v1/compliance/pipeda', {
      controlId: 'nonexistent-control',
      status: 'compliant',
    });

    const res = await updateControl(req, { params: Promise.resolve({ id: 'pipeda' }) });
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('INVALID_CONTROL');
  });

  it('Step 3: generate PIPEDA compliance report via POST /compliance', async () => {
    mockComplianceReportCreate.mockResolvedValue(makeComplianceReport());

    const req = createPostRequest('/api/v1/compliance', {
      propertyId: PROPERTY_ID,
      type: 'privacy_impact',
      framework: 'pipeda',
      dateRange: {
        from: '2026-01-01',
        to: '2026-03-31',
      },
    });

    const res = await generateReport(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{
      data: {
        type: string;
        summary: { totalControls: number; compliant: number; score: number };
        archivedId: string;
        framework: string;
      };
      message: string;
    }>(res);
    expect(body.data.type).toBe('privacy_impact');
    expect(body.data.summary.totalControls).toBe(10);
    expect(body.data.summary.score).toBe(85);
    expect(body.data.archivedId).toBe('report-001');
    expect(body.data.framework).toBe('pipeda');
    expect(body.message).toContain('privacy_impact');
  });

  it('Step 4: schedule PIPEDA audit via POST /compliance/pipeda', async () => {
    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    mockComplianceReportCreate.mockResolvedValue(makeComplianceReport({ status: 'generating' }));

    const req = createPostRequest('/api/v1/compliance/pipeda', {
      propertyId: PROPERTY_ID,
      scheduledDate: futureDate,
      auditorName: 'Jane Privacy Auditor',
      auditorEmail: 'jane@auditfirm.com',
      scope: ['pip-1', 'pip-2', 'pip-3', 'pip-7'],
      notes: 'Focus on consent and safeguards controls.',
    });

    const res = await scheduleAudit(req, { params: Promise.resolve({ id: 'pipeda' }) });
    expect(res.status).toBe(201);

    const body = await parseResponse<{
      data: {
        auditId: string;
        framework: string;
        auditor: string;
        scope: string[];
        controlCount: number;
        status: string;
      };
      message: string;
    }>(res);
    expect(body.data.framework).toBe('pipeda');
    expect(body.data.auditor).toBe('Jane Privacy Auditor');
    expect(body.data.scope).toHaveLength(4);
    expect(body.data.controlCount).toBe(10);
    expect(body.data.status).toBe('scheduled');
    expect(body.message).toContain('PIPEDA');
  });

  it('Step 4b: reject audit with past date', async () => {
    const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    const req = createPostRequest('/api/v1/compliance/pipeda', {
      propertyId: PROPERTY_ID,
      scheduledDate: pastDate,
      auditorName: 'Past Auditor',
      scope: ['pip-1'],
    });

    const res = await scheduleAudit(req, { params: Promise.resolve({ id: 'pipeda' }) });
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('INVALID_DATE');
  });

  it('Step 5: view all frameworks with compliance status via GET /compliance', async () => {
    mockComplianceReportFindMany.mockResolvedValue([
      makeComplianceReport({ type: 'privacy_impact', status: 'completed' }),
    ]);

    const req = createGetRequest('/api/v1/compliance', {
      searchParams: { propertyId: PROPERTY_ID },
    });

    const res = await listCompliance(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: {
        frameworks: { id: string; name: string; status: string }[];
        totalFrameworks: number;
        totalReportTypes: number;
      };
    }>(res);
    expect(body.data.totalFrameworks).toBe(8);
    expect(body.data.totalReportTypes).toBe(8);
    expect(body.data.frameworks.find((f) => f.id === 'pipeda')).toBeDefined();
  });

  it('Step 6: list available report types via GET /compliance/reports', async () => {
    const req = createGetRequest('/api/v1/compliance/reports');
    const res = await listReportTypes(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { reportTypes: { type: string }[]; totalTypes: number };
    }>(res);
    expect(body.data.totalTypes).toBe(8);
    expect(body.data.reportTypes.map((r) => r.type)).toContain('privacy_impact');
  });
});

// ===========================================================================
// SCENARIO 2: DSAR (Data Subject Access Request)
// ===========================================================================

describe('Scenario 2: DSAR — Data Subject Access Request', () => {
  it('Step 1: resident requests data export via POST /data-migration/export with dsarCompliant=true', async () => {
    const req = createPostRequest('/api/v1/data-migration/export', {
      propertyId: PROPERTY_ID,
      entityTypes: ['users', 'packages', 'maintenanceRequests', 'bookings', 'events'],
      format: 'json',
      dsarCompliant: true,
    });

    const res = await exportData(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: {
        dsarCompliant: boolean;
        data: {
          users: { id: string }[];
          packages: { id: string }[];
          maintenanceRequests: { id: string }[];
          bookings: { id: string }[];
          events: { id: string }[];
        };
      };
    }>(res);
    expect(body.data.dsarCompliant).toBe(true);
    expect(body.data.data.users).toHaveLength(1);
    expect(body.data.data.packages).toHaveLength(1);
    expect(body.data.data.maintenanceRequests).toHaveLength(1);
    expect(body.data.data.bookings).toHaveLength(1);
    expect(body.data.data.events).toHaveLength(1);
  });

  it('Step 2: DSAR export includes all required data modules', async () => {
    const req = createPostRequest('/api/v1/data-migration/export', {
      propertyId: PROPERTY_ID,
      entityTypes: ['users', 'packages', 'maintenanceRequests', 'bookings', 'events'],
      format: 'json',
      dsarCompliant: true,
    });

    const res = await exportData(req);
    const body = await parseResponse<{
      data: { data: Record<string, unknown[]> };
    }>(res);

    // Verify all required entity types are present
    expect(body.data.data).toHaveProperty('users');
    expect(body.data.data).toHaveProperty('packages');
    expect(body.data.data).toHaveProperty('maintenanceRequests');
    expect(body.data.data).toHaveProperty('bookings');
    expect(body.data.data).toHaveProperty('events');
  });

  it('Step 3: DSAR export includes metadata with timestamp', async () => {
    const req = createPostRequest('/api/v1/data-migration/export', {
      propertyId: PROPERTY_ID,
      format: 'json',
      dsarCompliant: true,
    });

    const res = await exportData(req);
    const body = await parseResponse<{
      data: { generatedAt: string; format: string };
    }>(res);

    expect(body.data.generatedAt).toBeDefined();
    expect(body.data.format).toBe('json');
  });

  it('Step 4: DSAR export requires propertyId', async () => {
    const req = createPostRequest('/api/v1/data-migration/export', {
      format: 'json',
      dsarCompliant: true,
    });

    const res = await exportData(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('Step 5: generate compliance report to document DSAR fulfillment', async () => {
    mockComplianceReportCreate.mockResolvedValue(
      makeComplianceReport({ type: 'data_inventory', framework: 'pipeda' }),
    );

    const req = createPostRequest('/api/v1/compliance', {
      propertyId: PROPERTY_ID,
      type: 'data_inventory',
      framework: 'pipeda',
    });

    const res = await generateReport(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{ data: { type: string } }>(res);
    expect(body.data.type).toBe('data_inventory');
  });
});

// ===========================================================================
// SCENARIO 3: Vendor Compliance Check
// ===========================================================================

describe('Scenario 3: Vendor Compliance Check (insurance status -> alerts -> update)', () => {
  it('Step 1: check vendor with compliant insurance via GET /vendors/:id', async () => {
    const futureDate = new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
    mockVendorFindUnique.mockResolvedValue(
      makeVendor({
        documents: [
          {
            id: 'doc-ins-1',
            type: 'insurance_certificate',
            title: 'General Liability Insurance',
            expiresAt: futureDate,
            filePath: '/docs/insurance.pdf',
            createdAt: new Date(),
          },
          {
            id: 'doc-ins-2',
            type: 'wsib_certificate',
            title: 'WSIB Certificate',
            expiresAt: futureDate,
            filePath: '/docs/wsib.pdf',
            createdAt: new Date(),
          },
        ],
      }),
    );

    const req = createGetRequest(`/api/v1/vendors/${VENDOR_ID}`);
    const res = await getVendor(req, { params: Promise.resolve({ id: VENDOR_ID }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: {
        id: string;
        name: string;
        complianceStatus: string;
        documents: { id: string; type: string }[];
      };
    }>(res);
    expect(body.data.id).toBe(VENDOR_ID);
    expect(body.data.complianceStatus).toBe('compliant');
    expect(body.data.documents).toHaveLength(2);
  });

  it('Step 2: vendor with expiring insurance shows expiring_soon status', async () => {
    const fifteenDays = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
    mockVendorFindUnique.mockResolvedValue(
      makeVendor({
        documents: [
          {
            id: 'doc-exp-1',
            type: 'insurance_certificate',
            title: 'General Liability Insurance',
            expiresAt: fifteenDays,
            filePath: '/docs/insurance.pdf',
            createdAt: new Date(),
          },
        ],
      }),
    );

    const req = createGetRequest(`/api/v1/vendors/${VENDOR_ID}`);
    const res = await getVendor(req, { params: Promise.resolve({ id: VENDOR_ID }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { complianceStatus: string };
    }>(res);
    expect(body.data.complianceStatus).toBe('expiring_soon');
  });

  it('Step 3: vendor with expired insurance shows expired status', async () => {
    const pastDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
    mockVendorFindUnique.mockResolvedValue(
      makeVendor({
        documents: [
          {
            id: 'doc-expired',
            type: 'insurance_certificate',
            title: 'General Liability Insurance',
            expiresAt: pastDate,
            filePath: '/docs/insurance.pdf',
            createdAt: new Date(),
          },
        ],
      }),
    );

    const req = createGetRequest(`/api/v1/vendors/${VENDOR_ID}`);
    const res = await getVendor(req, { params: Promise.resolve({ id: VENDOR_ID }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { complianceStatus: string };
    }>(res);
    expect(body.data.complianceStatus).toBe('expired');
  });

  it('Step 4: vendor with no documents shows not_tracked status', async () => {
    mockVendorFindUnique.mockResolvedValue(makeVendor({ documents: [] }));

    const req = createGetRequest(`/api/v1/vendors/${VENDOR_ID}`);
    const res = await getVendor(req, { params: Promise.resolve({ id: VENDOR_ID }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { complianceStatus: string } }>(res);
    expect(body.data.complianceStatus).toBe('not_tracked');
  });

  it('Step 5: update vendor details via PATCH /vendors/:id', async () => {
    mockVendorFindUnique.mockResolvedValue(makeVendor());
    mockVendorUpdate.mockResolvedValue(makeVendor({ email: 'newemail@reliableplumbing.com' }));

    const req = createPatchRequest(`/api/v1/vendors/${VENDOR_ID}`, {
      email: 'newemail@reliableplumbing.com',
    });

    const res = await updateVendor(req, { params: Promise.resolve({ id: VENDOR_ID }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { email: string } }>(res);
    expect(body.data.email).toBe('newemail@reliableplumbing.com');
  });

  it('Step 6: generate vendor compliance report across all vendors', async () => {
    mockComplianceReportCreate.mockResolvedValue(
      makeComplianceReport({ type: 'vendor_compliance' }),
    );

    const req = createPostRequest('/api/v1/compliance', {
      propertyId: PROPERTY_ID,
      type: 'vendor_compliance',
    });

    const res = await generateReport(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{
      data: { type: string; summary: { totalControls: number } };
    }>(res);
    expect(body.data.type).toBe('vendor_compliance');
    expect(body.data.summary.totalControls).toBe(10);
  });

  it('should return 404 for nonexistent vendor', async () => {
    mockVendorFindUnique.mockResolvedValue(null);

    const res = await getVendor(createGetRequest('/api/v1/vendors/nonexistent'), {
      params: Promise.resolve({ id: 'nonexistent' }),
    });
    expect(res.status).toBe(404);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('NOT_FOUND');
  });
});

// ===========================================================================
// Cross-Scenario: Validation and Edge Cases
// ===========================================================================

describe('Compliance Audit: Validation & Edge Cases', () => {
  it('listing compliance frameworks requires propertyId', async () => {
    const req = createGetRequest('/api/v1/compliance');
    const res = await listCompliance(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_PROPERTY');
  });

  it('should reject report generation without propertyId', async () => {
    const req = createPostRequest('/api/v1/compliance', {
      type: 'privacy_impact',
    });

    const res = await generateReport(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('should reject report generation with invalid type', async () => {
    const req = createPostRequest('/api/v1/compliance', {
      propertyId: PROPERTY_ID,
      type: 'nonexistent_report_type',
    });

    const res = await generateReport(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('should return 404 for nonexistent framework', async () => {
    const res = await getComplianceDetail(createGetRequest('/api/v1/compliance/nonexistent'), {
      params: Promise.resolve({ id: 'nonexistent' }),
    });
    expect(res.status).toBe(404);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('NOT_FOUND');
  });

  it('should reject control update without controlId', async () => {
    const req = createPatchRequest('/api/v1/compliance/pipeda', {
      status: 'compliant',
    });

    const res = await updateControl(req, { params: Promise.resolve({ id: 'pipeda' }) });
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('should reject audit scheduling without scope', async () => {
    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const req = createPostRequest('/api/v1/compliance/pipeda', {
      propertyId: PROPERTY_ID,
      scheduledDate: futureDate,
      auditorName: 'Test Auditor',
      scope: [],
    });

    const res = await scheduleAudit(req, { params: Promise.resolve({ id: 'pipeda' }) });
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('should reject audit scheduling without auditorName', async () => {
    const futureDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const req = createPostRequest('/api/v1/compliance/pipeda', {
      propertyId: PROPERTY_ID,
      scheduledDate: futureDate,
      scope: ['pip-1'],
    });

    const res = await scheduleAudit(req, { params: Promise.resolve({ id: 'pipeda' }) });
    expect(res.status).toBe(400);
  });

  it('should generate report via /compliance/reports endpoint', async () => {
    const req = createPostRequest('/api/v1/compliance/reports', {
      type: 'security_audit',
      propertyId: PROPERTY_ID,
      from: '2026-01-01',
      to: '2026-03-31',
    });

    const res = await generateReportViaReports(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{ data: { type: string }; message: string }>(res);
    expect(body.data.type).toBe('security_audit');
    expect(body.message).toContain('generated');
  });

  it('should reject report via /compliance/reports without type', async () => {
    const req = createPostRequest('/api/v1/compliance/reports', {
      propertyId: PROPERTY_ID,
    });

    const res = await generateReportViaReports(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('should list GDPR framework controls with 8 items', async () => {
    const req = createGetRequest('/api/v1/compliance/gdpr', {
      searchParams: { propertyId: PROPERTY_ID },
    });

    const res = await getComplianceDetail(req, { params: Promise.resolve({ id: 'gdpr' }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { frameworkId: string; totalControls: number } }>(res);
    expect(body.data.frameworkId).toBe('gdpr');
    expect(body.data.totalControls).toBe(8);
  });

  it('should list SOC 2 framework controls with 9 items', async () => {
    const req = createGetRequest('/api/v1/compliance/soc2', {
      searchParams: { propertyId: PROPERTY_ID },
    });

    const res = await getComplianceDetail(req, { params: Promise.resolve({ id: 'soc2' }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { frameworkId: string; totalControls: number } }>(res);
    expect(body.data.frameworkId).toBe('soc2');
    expect(body.data.totalControls).toBe(9);
  });
});
