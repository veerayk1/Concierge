/**
 * Vendor Compliance API Route Tests
 *
 * BuildingLink's 5-status vendor compliance dashboard is a key feature to steal.
 * A vendor with expired insurance working in the building is a lawsuit waiting
 * to happen. These tests ensure compliance tracking actually works.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  createGetRequest,
  createPostRequest,
  createPatchRequest,
  parseResponse,
} from '@/test/helpers/api';
import { calculateComplianceStatus } from '@/server/vendors/compliance';

// ---------------------------------------------------------------------------
// Mock Setup
// ---------------------------------------------------------------------------

const mockVendorFindMany = vi.fn();
const mockVendorFindUnique = vi.fn();
const mockVendorCount = vi.fn();
const mockVendorCreate = vi.fn();
const mockVendorUpdate = vi.fn();

const mockDocFindMany = vi.fn();
const mockDocCreate = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    vendor: {
      findMany: (...args: unknown[]) => mockVendorFindMany(...args),
      findUnique: (...args: unknown[]) => mockVendorFindUnique(...args),
      count: (...args: unknown[]) => mockVendorCount(...args),
      create: (...args: unknown[]) => mockVendorCreate(...args),
      update: (...args: unknown[]) => mockVendorUpdate(...args),
    },
    vendorDocument: {
      findMany: (...args: unknown[]) => mockDocFindMany(...args),
      create: (...args: unknown[]) => mockDocCreate(...args),
    },
  },
}));

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: vi.fn().mockResolvedValue({
    user: {
      userId: 'test-staff',
      propertyId: '00000000-0000-4000-b000-000000000001',
      role: 'property_manager',
      permissions: ['*'],
      mfaVerified: false,
    },
    error: null,
  }),
}));

// Route imports MUST come after vi.mock calls
import { GET, POST } from '../route';
import { GET as GET_DETAIL, PATCH } from '../../vendors/[id]/route';
import { GET as GET_DOCS, POST as POST_DOC } from '../../vendors/[id]/documents/route';

beforeEach(() => {
  vi.clearAllMocks();
  mockVendorFindMany.mockResolvedValue([]);
  mockVendorCount.mockResolvedValue(0);
});

const PROPERTY_ID = '00000000-0000-4000-b000-000000000001';
const VENDOR_ID = '00000000-0000-4000-c000-000000000001';
const CATEGORY_ID = '00000000-0000-4000-d000-000000000001';

// ---------------------------------------------------------------------------
// 1. GET /api/v1/vendors — Lists vendors for property with compliance status
// ---------------------------------------------------------------------------

describe('GET /api/v1/vendors — List vendors with compliance', () => {
  it('REJECTS without propertyId', async () => {
    const req = createGetRequest('/api/v1/vendors');
    const res = await GET(req);
    expect(res.status).toBe(400);
    expect(mockVendorFindMany).not.toHaveBeenCalled();
  });

  it('scopes to propertyId — tenant isolation', async () => {
    const req = createGetRequest('/api/v1/vendors', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    await GET(req);

    const where = mockVendorFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_ID);
  });

  it('returns vendors with computed compliance status', async () => {
    mockVendorFindMany.mockResolvedValue([
      {
        id: VENDOR_ID,
        companyName: 'ACME Plumbing',
        complianceStatus: 'not_tracking',
        documents: [],
        serviceCategory: { id: CATEGORY_ID, name: 'Plumbing' },
      },
    ]);

    const req = createGetRequest('/api/v1/vendors', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: Array<{ companyName: string; complianceStatus: string }>;
    }>(res);
    expect(body.data[0]!.companyName).toBe('ACME Plumbing');
    expect(body.data[0]!.complianceStatus).toBe('not_tracking');
  });

  it('includes serviceCategory relation for display', async () => {
    const req = createGetRequest('/api/v1/vendors', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    await GET(req);

    const include = mockVendorFindMany.mock.calls[0]![0].include;
    expect(include.serviceCategory).toBeDefined();
    expect(include.documents).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// 2. POST /api/v1/vendors — Creates new vendor with required docs
// ---------------------------------------------------------------------------

describe('POST /api/v1/vendors — Vendor creation', () => {
  const validBody = {
    propertyId: PROPERTY_ID,
    companyName: 'ACME Plumbing Inc.',
    serviceCategoryId: CATEGORY_ID,
    contactName: 'John Smith',
    phone: '416-555-0100',
    email: 'john@acmeplumbing.com',
  };

  it('rejects missing required fields', async () => {
    const req = createPostRequest('/api/v1/vendors', {});
    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('creates vendor with initial status not_tracking', async () => {
    mockVendorCreate.mockResolvedValue({
      id: VENDOR_ID,
      ...validBody,
      complianceStatus: 'not_tracking',
      isActive: true,
      serviceCategory: { id: CATEGORY_ID, name: 'Plumbing' },
    });

    const req = createPostRequest('/api/v1/vendors', validBody);
    const res = await POST(req);
    expect(res.status).toBe(201);

    const createData = mockVendorCreate.mock.calls[0]![0].data;
    expect(createData.complianceStatus).toBe('not_tracking');
    expect(createData.companyName).toBe('ACME Plumbing Inc.');
  });

  it('returns 201 with vendor data and message', async () => {
    mockVendorCreate.mockResolvedValue({
      id: VENDOR_ID,
      ...validBody,
      complianceStatus: 'not_tracking',
      isActive: true,
      serviceCategory: { id: CATEGORY_ID, name: 'Plumbing' },
    });

    const req = createPostRequest('/api/v1/vendors', validBody);
    const res = await POST(req);

    const body = await parseResponse<{ data: { id: string }; message: string }>(res);
    expect(body.message).toContain('ACME Plumbing Inc.');
    expect(body.data.id).toBe(VENDOR_ID);
  });

  it('handles database errors gracefully', async () => {
    mockVendorCreate.mockRejectedValue(new Error('DB down'));

    const req = createPostRequest('/api/v1/vendors', validBody);
    const res = await POST(req);
    expect(res.status).toBe(500);

    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).not.toContain('DB down');
  });
});

// ---------------------------------------------------------------------------
// 3-6. Compliance status calculation from document expiry dates
// ---------------------------------------------------------------------------

describe('Compliance status calculation', () => {
  const now = new Date('2026-03-18T12:00:00Z');

  it('not_tracking — no documents uploaded', () => {
    const status = calculateComplianceStatus([], now);
    expect(status).toBe('not_tracking');
  });

  it('compliant — all required docs present and valid', () => {
    const docs = [
      { documentType: 'insurance', expiresAt: '2026-12-31T00:00:00Z' },
      { documentType: 'license', expiresAt: '2027-06-30T00:00:00Z' },
    ];
    const status = calculateComplianceStatus(docs, now);
    expect(status).toBe('compliant');
  });

  it('not_compliant — missing required document (insurance)', () => {
    const docs = [{ documentType: 'license', expiresAt: '2026-12-31T00:00:00Z' }];
    const status = calculateComplianceStatus(docs, now);
    expect(status).toBe('not_compliant');
  });

  it('not_compliant — missing required document (license)', () => {
    const docs = [{ documentType: 'insurance', expiresAt: '2026-12-31T00:00:00Z' }];
    const status = calculateComplianceStatus(docs, now);
    expect(status).toBe('not_compliant');
  });

  it('expiring — insurance expiring within 30 days', () => {
    const docs = [
      { documentType: 'insurance', expiresAt: '2026-04-10T00:00:00Z' }, // 23 days from now
      { documentType: 'license', expiresAt: '2027-06-30T00:00:00Z' },
    ];
    const status = calculateComplianceStatus(docs, now);
    expect(status).toBe('expiring');
  });

  it('expired — insurance past expiry, vendor flagged', () => {
    const docs = [
      { documentType: 'insurance', expiresAt: '2026-02-01T00:00:00Z' }, // expired
      { documentType: 'license', expiresAt: '2027-06-30T00:00:00Z' },
    ];
    const status = calculateComplianceStatus(docs, now);
    expect(status).toBe('expired');
  });

  it('expired takes priority over expiring', () => {
    const docs = [
      { documentType: 'insurance', expiresAt: '2026-01-01T00:00:00Z' }, // expired
      { documentType: 'license', expiresAt: '2026-04-01T00:00:00Z' }, // expiring
    ];
    const status = calculateComplianceStatus(docs, now);
    expect(status).toBe('expired');
  });

  it('expired takes priority over not_compliant', () => {
    const docs = [
      { documentType: 'insurance', expiresAt: '2025-01-01T00:00:00Z' }, // expired
      // missing license — would be not_compliant
    ];
    const status = calculateComplianceStatus(docs, now);
    expect(status).toBe('expired');
  });

  it('documents without expiresAt are treated as valid', () => {
    const docs = [
      { documentType: 'insurance', expiresAt: null },
      { documentType: 'license', expiresAt: null },
    ];
    const status = calculateComplianceStatus(docs, now);
    expect(status).toBe('compliant');
  });

  it('all 5 statuses are valid values', () => {
    const validStatuses = ['compliant', 'not_compliant', 'expiring', 'expired', 'not_tracking'];
    // each status is reachable (tested above individually)
    expect(validStatuses).toHaveLength(5);
  });
});

// ---------------------------------------------------------------------------
// 7. GET /api/v1/vendors/:id — Vendor detail with documents
// ---------------------------------------------------------------------------

describe('GET /api/v1/vendors/:id — Vendor detail', () => {
  it('returns vendor with documents and computed compliance', async () => {
    mockVendorFindUnique.mockResolvedValue({
      id: VENDOR_ID,
      propertyId: PROPERTY_ID,
      companyName: 'ACME Plumbing',
      complianceStatus: 'not_tracking',
      documents: [
        {
          id: 'doc-1',
          documentType: 'insurance',
          expiresAt: new Date('2027-01-01'),
          fileName: 'insurance.pdf',
        },
        {
          id: 'doc-2',
          documentType: 'license',
          expiresAt: new Date('2027-06-01'),
          fileName: 'license.pdf',
        },
      ],
      serviceCategory: { id: CATEGORY_ID, name: 'Plumbing' },
    });

    const req = createGetRequest('/api/v1/vendors/detail');
    const res = await GET_DETAIL(req, {
      params: Promise.resolve({ id: VENDOR_ID }),
    });

    expect(res.status).toBe(200);
    const body = await parseResponse<{
      data: {
        companyName: string;
        complianceStatus: string;
        documents: Array<{ documentType: string }>;
      };
    }>(res);

    expect(body.data.companyName).toBe('ACME Plumbing');
    expect(body.data.complianceStatus).toBe('compliant');
    expect(body.data.documents).toHaveLength(2);
  });

  it('returns 404 for non-existent vendor', async () => {
    mockVendorFindUnique.mockResolvedValue(null);

    const req = createGetRequest('/api/v1/vendors/detail');
    const res = await GET_DETAIL(req, {
      params: Promise.resolve({ id: 'non-existent' }),
    });

    expect(res.status).toBe(404);
  });

  it('includes documents ordered by createdAt desc', async () => {
    mockVendorFindUnique.mockResolvedValue({
      id: VENDOR_ID,
      companyName: 'ACME',
      documents: [],
      serviceCategory: { id: CATEGORY_ID, name: 'Plumbing' },
    });

    const req = createGetRequest('/api/v1/vendors/detail');
    await GET_DETAIL(req, { params: Promise.resolve({ id: VENDOR_ID }) });

    const include = mockVendorFindUnique.mock.calls[0]![0].include;
    expect(include.documents).toBeDefined();
    expect(include.documents.orderBy).toEqual({ createdAt: 'desc' });
  });
});

// ---------------------------------------------------------------------------
// 8. POST /api/v1/vendors/:id/documents — Upload compliance document
// ---------------------------------------------------------------------------

describe('POST /api/v1/vendors/:id/documents — Document upload', () => {
  const validDoc = {
    documentType: 'insurance',
    fileName: 'insurance-2026.pdf',
    fileUrl: 'https://s3.example.com/docs/insurance-2026.pdf',
    expiresAt: '2027-01-01T00:00:00Z',
  };

  beforeEach(() => {
    mockVendorFindUnique.mockResolvedValue({
      id: VENDOR_ID,
      propertyId: PROPERTY_ID,
      companyName: 'ACME Plumbing',
    });
    mockDocFindMany.mockResolvedValue([]);
    mockVendorUpdate.mockResolvedValue({});
  });

  it('rejects missing required fields', async () => {
    const req = createPostRequest('/api/v1/vendors/documents', {});
    const res = await POST_DOC(req, {
      params: Promise.resolve({ id: VENDOR_ID }),
    });
    expect(res.status).toBe(400);
  });

  it('creates document and updates vendor compliance', async () => {
    mockDocCreate.mockResolvedValue({
      id: 'doc-new',
      vendorId: VENDOR_ID,
      ...validDoc,
      expiresAt: new Date(validDoc.expiresAt),
    });
    mockDocFindMany.mockResolvedValue([
      {
        id: 'doc-new',
        vendorId: VENDOR_ID,
        documentType: 'insurance',
        expiresAt: new Date('2027-01-01'),
      },
    ]);

    const req = createPostRequest('/api/v1/vendors/documents', validDoc);
    const res = await POST_DOC(req, {
      params: Promise.resolve({ id: VENDOR_ID }),
    });

    expect(res.status).toBe(201);

    // Should have called vendorDocument.create
    expect(mockDocCreate).toHaveBeenCalledOnce();
    const createData = mockDocCreate.mock.calls[0]![0].data;
    expect(createData.documentType).toBe('insurance');
    expect(createData.vendorId).toBe(VENDOR_ID);

    // Should update vendor compliance status
    expect(mockVendorUpdate).toHaveBeenCalledOnce();
  });

  it('returns 404 if vendor does not exist', async () => {
    mockVendorFindUnique.mockResolvedValue(null);

    const req = createPostRequest('/api/v1/vendors/documents', validDoc);
    const res = await POST_DOC(req, {
      params: Promise.resolve({ id: 'non-existent' }),
    });

    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// 9. Document types: insurance, license, wsib, bond, background_check
// ---------------------------------------------------------------------------

describe('Document type validation', () => {
  beforeEach(() => {
    mockVendorFindUnique.mockResolvedValue({
      id: VENDOR_ID,
      propertyId: PROPERTY_ID,
    });
    mockDocCreate.mockResolvedValue({ id: 'doc-new' });
    mockDocFindMany.mockResolvedValue([]);
    mockVendorUpdate.mockResolvedValue({});
  });

  const validTypes = ['insurance', 'license', 'wsib', 'bond', 'background_check'];

  it.each(validTypes)('accepts document type: %s', async (docType) => {
    const req = createPostRequest('/api/v1/vendors/documents', {
      documentType: docType,
      fileName: `${docType}-doc.pdf`,
      fileUrl: `https://s3.example.com/${docType}.pdf`,
      expiresAt: '2027-01-01T00:00:00Z',
    });
    const res = await POST_DOC(req, {
      params: Promise.resolve({ id: VENDOR_ID }),
    });
    expect(res.status).toBe(201);
  });

  it('rejects invalid document type', async () => {
    const req = createPostRequest('/api/v1/vendors/documents', {
      documentType: 'tax_return',
      fileName: 'tax.pdf',
      fileUrl: 'https://s3.example.com/tax.pdf',
    });
    const res = await POST_DOC(req, {
      params: Promise.resolve({ id: VENDOR_ID }),
    });
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// 10. Expiry alert: vendors with docs expiring in next 30 days
// ---------------------------------------------------------------------------

describe('Expiry alert filtering', () => {
  it('filters vendors with documents expiring within N days', async () => {
    const req = createGetRequest('/api/v1/vendors', {
      searchParams: { propertyId: PROPERTY_ID, expiringWithin: '30' },
    });
    await GET(req);

    const where = mockVendorFindMany.mock.calls[0]![0].where;
    expect(where.documents).toBeDefined();
    expect(where.documents.some).toBeDefined();
    expect(where.documents.some.expiresAt).toBeDefined();
    expect(where.documents.some.expiresAt.gte).toBeDefined();
    expect(where.documents.some.expiresAt.lte).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// 11. Vendor service categories assignment
// ---------------------------------------------------------------------------

describe('Vendor service category assignment', () => {
  it('requires serviceCategoryId on creation', async () => {
    const req = createPostRequest('/api/v1/vendors', {
      propertyId: PROPERTY_ID,
      companyName: 'ACME',
      // missing serviceCategoryId
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('stores serviceCategoryId on creation', async () => {
    mockVendorCreate.mockResolvedValue({
      id: VENDOR_ID,
      companyName: 'ACME',
      serviceCategoryId: CATEGORY_ID,
      complianceStatus: 'not_tracking',
      serviceCategory: { id: CATEGORY_ID, name: 'Plumbing' },
    });

    const req = createPostRequest('/api/v1/vendors', {
      propertyId: PROPERTY_ID,
      companyName: 'ACME',
      serviceCategoryId: CATEGORY_ID,
    });
    await POST(req);

    const data = mockVendorCreate.mock.calls[0]![0].data;
    expect(data.serviceCategoryId).toBe(CATEGORY_ID);
  });

  it('can update serviceCategoryId via PATCH', async () => {
    const newCategoryId = '00000000-0000-4000-d000-000000000002';
    mockVendorFindUnique.mockResolvedValue({
      id: VENDOR_ID,
      companyName: 'ACME',
      serviceCategoryId: CATEGORY_ID,
    });
    mockVendorUpdate.mockResolvedValue({
      id: VENDOR_ID,
      companyName: 'ACME',
      serviceCategoryId: newCategoryId,
      documents: [],
      serviceCategory: { id: newCategoryId, name: 'Electrical' },
    });

    const req = createPatchRequest('/api/v1/vendors/update', {
      serviceCategoryId: newCategoryId,
    });
    const res = await PATCH(req, {
      params: Promise.resolve({ id: VENDOR_ID }),
    });
    expect(res.status).toBe(200);

    const updateData = mockVendorUpdate.mock.calls[0]![0].data;
    expect(updateData.serviceCategoryId).toBe(newCategoryId);
  });
});

// ---------------------------------------------------------------------------
// 12. Deactivate vendor — cannot be assigned to new work orders
// ---------------------------------------------------------------------------

describe('Vendor deactivation', () => {
  it('deactivates vendor via PATCH isActive=false', async () => {
    mockVendorFindUnique.mockResolvedValue({
      id: VENDOR_ID,
      companyName: 'ACME Plumbing',
      isActive: true,
    });
    mockVendorUpdate.mockResolvedValue({
      id: VENDOR_ID,
      companyName: 'ACME Plumbing',
      isActive: false,
      documents: [],
      serviceCategory: { id: CATEGORY_ID, name: 'Plumbing' },
    });

    const req = createPatchRequest('/api/v1/vendors/deactivate', {
      isActive: false,
    });
    const res = await PATCH(req, {
      params: Promise.resolve({ id: VENDOR_ID }),
    });

    expect(res.status).toBe(200);

    const updateData = mockVendorUpdate.mock.calls[0]![0].data;
    expect(updateData.isActive).toBe(false);

    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('deactivated');
  });

  it('can reactivate vendor via PATCH isActive=true', async () => {
    mockVendorFindUnique.mockResolvedValue({
      id: VENDOR_ID,
      companyName: 'ACME Plumbing',
      isActive: false,
    });
    mockVendorUpdate.mockResolvedValue({
      id: VENDOR_ID,
      companyName: 'ACME Plumbing',
      isActive: true,
      documents: [],
      serviceCategory: { id: CATEGORY_ID, name: 'Plumbing' },
    });

    const req = createPatchRequest('/api/v1/vendors/reactivate', {
      isActive: true,
    });
    const res = await PATCH(req, {
      params: Promise.resolve({ id: VENDOR_ID }),
    });

    expect(res.status).toBe(200);
    const updateData = mockVendorUpdate.mock.calls[0]![0].data;
    expect(updateData.isActive).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 13. Vendor compliance dashboard summary: counts per status
// ---------------------------------------------------------------------------

describe('Compliance dashboard summary', () => {
  it('returns counts per compliance status', async () => {
    const now = new Date();
    const futureDate = new Date(now);
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    mockVendorFindMany.mockResolvedValue([
      {
        id: 'v1',
        documents: [
          { documentType: 'insurance', expiresAt: futureDate },
          { documentType: 'license', expiresAt: futureDate },
        ],
      },
      {
        id: 'v2',
        documents: [],
      },
      {
        id: 'v3',
        documents: [
          { documentType: 'insurance', expiresAt: new Date('2020-01-01') },
          { documentType: 'license', expiresAt: futureDate },
        ],
      },
    ]);

    const req = createGetRequest('/api/v1/vendors', {
      searchParams: { propertyId: PROPERTY_ID, summary: 'compliance' },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: Record<string, number>;
    }>(res);

    expect(body.data.total).toBe(3);
    expect(body.data.compliant).toBe(1);
    expect(body.data.not_tracking).toBe(1);
    expect(body.data.expired).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// 14. Tenant isolation: only see your property's vendors
// ---------------------------------------------------------------------------

describe('Tenant isolation', () => {
  it('all queries are scoped to propertyId', async () => {
    const req = createGetRequest('/api/v1/vendors', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    await GET(req);

    const where = mockVendorFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_ID);
  });

  it('cannot query vendors without specifying propertyId', async () => {
    const req = createGetRequest('/api/v1/vendors');
    const res = await GET(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_PROPERTY');
  });

  it('vendor creation enforces propertyId from input', async () => {
    mockVendorCreate.mockResolvedValue({
      id: VENDOR_ID,
      companyName: 'ACME',
      propertyId: PROPERTY_ID,
      complianceStatus: 'not_tracking',
      serviceCategory: { id: CATEGORY_ID, name: 'Plumbing' },
    });

    const req = createPostRequest('/api/v1/vendors', {
      propertyId: PROPERTY_ID,
      companyName: 'ACME',
      serviceCategoryId: CATEGORY_ID,
    });
    await POST(req);

    const createData = mockVendorCreate.mock.calls[0]![0].data;
    expect(createData.propertyId).toBe(PROPERTY_ID);
  });

  it('compliance summary is scoped to propertyId', async () => {
    mockVendorFindMany.mockResolvedValue([]);

    const req = createGetRequest('/api/v1/vendors', {
      searchParams: { propertyId: PROPERTY_ID, summary: 'compliance' },
    });
    await GET(req);

    const where = mockVendorFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_ID);
  });
});

// ---------------------------------------------------------------------------
// GET /api/v1/vendors/:id/documents — List documents
// ---------------------------------------------------------------------------

describe('GET /api/v1/vendors/:id/documents — List documents', () => {
  it('returns documents for a vendor', async () => {
    mockVendorFindUnique.mockResolvedValue({
      id: VENDOR_ID,
      propertyId: PROPERTY_ID,
    });
    mockDocFindMany.mockResolvedValue([
      { id: 'doc-1', documentType: 'insurance', fileName: 'ins.pdf' },
      { id: 'doc-2', documentType: 'license', fileName: 'lic.pdf' },
    ]);

    const req = createGetRequest('/api/v1/vendors/documents');
    const res = await GET_DOCS(req, {
      params: Promise.resolve({ id: VENDOR_ID }),
    });

    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: Array<{ documentType: string }> }>(res);
    expect(body.data).toHaveLength(2);
  });

  it('returns 404 if vendor does not exist', async () => {
    mockVendorFindUnique.mockResolvedValue(null);

    const req = createGetRequest('/api/v1/vendors/documents');
    const res = await GET_DOCS(req, {
      params: Promise.resolve({ id: 'non-existent' }),
    });
    expect(res.status).toBe(404);
  });
});
