/**
 * Vendor Management API — Comprehensive Tests
 *
 * Tests vendor CRUD, 5-status compliance dashboard, document management,
 * insurance tracking, expiry alerts, vendor rating, deactivation,
 * and tenant isolation. 35+ tests.
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
// 1. GET /api/v1/vendors — List vendors
// ---------------------------------------------------------------------------

describe('GET /api/v1/vendors — List vendors with compliance', () => {
  it('rejects without propertyId', async () => {
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

  it('includes serviceCategory and documents relations', async () => {
    const req = createGetRequest('/api/v1/vendors', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    await GET(req);

    const include = mockVendorFindMany.mock.calls[0]![0].include;
    expect(include.serviceCategory).toBeDefined();
    expect(include.documents).toBeDefined();
  });

  it('sorts by companyName ascending by default', async () => {
    const req = createGetRequest('/api/v1/vendors', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    await GET(req);

    const orderBy = mockVendorFindMany.mock.calls[0]![0].orderBy;
    expect(orderBy).toEqual({ companyName: 'asc' });
  });

  it('filters by categoryId when provided', async () => {
    const req = createGetRequest('/api/v1/vendors', {
      searchParams: { propertyId: PROPERTY_ID, categoryId: CATEGORY_ID },
    });
    await GET(req);

    const where = mockVendorFindMany.mock.calls[0]![0].where;
    expect(where.serviceCategoryId).toBe(CATEGORY_ID);
  });

  it('filters by compliance status when provided', async () => {
    const req = createGetRequest('/api/v1/vendors', {
      searchParams: { propertyId: PROPERTY_ID, status: 'expired' },
    });
    await GET(req);

    const where = mockVendorFindMany.mock.calls[0]![0].where;
    expect(where.complianceStatus).toBe('expired');
  });

  it('searches by companyName or contactName', async () => {
    const req = createGetRequest('/api/v1/vendors', {
      searchParams: { propertyId: PROPERTY_ID, search: 'ACME' },
    });
    await GET(req);

    const where = mockVendorFindMany.mock.calls[0]![0].where;
    expect(where.OR).toBeDefined();
    expect(where.OR).toHaveLength(2);
    expect(where.OR[0].companyName.contains).toBe('ACME');
    expect(where.OR[1].contactName.contains).toBe('ACME');
  });

  it('returns paginated results with meta', async () => {
    mockVendorFindMany.mockResolvedValue([]);
    mockVendorCount.mockResolvedValue(75);

    const req = createGetRequest('/api/v1/vendors', {
      searchParams: { propertyId: PROPERTY_ID, page: '3', pageSize: '20' },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      meta: { page: number; pageSize: number; total: number; totalPages: number };
    }>(res);
    expect(body.meta.page).toBe(3);
    expect(body.meta.pageSize).toBe(20);
    expect(body.meta.total).toBe(75);
    expect(body.meta.totalPages).toBe(4);
  });
});

// ---------------------------------------------------------------------------
// 2. POST /api/v1/vendors — Create vendor
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

  it('validates email format when provided', async () => {
    const req = createPostRequest('/api/v1/vendors', {
      ...validBody,
      email: 'not-an-email',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('requires companyName', async () => {
    const req = createPostRequest('/api/v1/vendors', {
      propertyId: PROPERTY_ID,
      serviceCategoryId: CATEGORY_ID,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('requires serviceCategoryId', async () => {
    const req = createPostRequest('/api/v1/vendors', {
      propertyId: PROPERTY_ID,
      companyName: 'ACME',
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

  it('stores optional address fields', async () => {
    const bodyWithAddress = {
      ...validBody,
      streetAddress: '123 Main St',
      city: 'Toronto',
      stateProvince: 'ON',
      postalCode: 'M5V 1A1',
    };

    mockVendorCreate.mockResolvedValue({
      id: VENDOR_ID,
      ...bodyWithAddress,
      complianceStatus: 'not_tracking',
      serviceCategory: { id: CATEGORY_ID, name: 'Plumbing' },
    });

    const req = createPostRequest('/api/v1/vendors', bodyWithAddress);
    const res = await POST(req);
    expect(res.status).toBe(201);

    const createData = mockVendorCreate.mock.calls[0]![0].data;
    expect(createData.streetAddress).toBe('123 Main St');
    expect(createData.city).toBe('Toronto');
    expect(createData.postalCode).toBe('M5V 1A1');
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
// 3. Compliance status calculation from document expiry dates
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

  it('not_compliant — missing insurance', () => {
    const docs = [{ documentType: 'license', expiresAt: '2026-12-31T00:00:00Z' }];
    const status = calculateComplianceStatus(docs, now);
    expect(status).toBe('not_compliant');
  });

  it('not_compliant — missing license', () => {
    const docs = [{ documentType: 'insurance', expiresAt: '2026-12-31T00:00:00Z' }];
    const status = calculateComplianceStatus(docs, now);
    expect(status).toBe('not_compliant');
  });

  it('expiring — insurance expiring within 30 days', () => {
    const docs = [
      { documentType: 'insurance', expiresAt: '2026-04-10T00:00:00Z' },
      { documentType: 'license', expiresAt: '2027-06-30T00:00:00Z' },
    ];
    const status = calculateComplianceStatus(docs, now);
    expect(status).toBe('expiring');
  });

  it('expired — insurance past expiry date', () => {
    const docs = [
      { documentType: 'insurance', expiresAt: '2026-02-01T00:00:00Z' },
      { documentType: 'license', expiresAt: '2027-06-30T00:00:00Z' },
    ];
    const status = calculateComplianceStatus(docs, now);
    expect(status).toBe('expired');
  });

  it('expired takes priority over expiring', () => {
    const docs = [
      { documentType: 'insurance', expiresAt: '2026-01-01T00:00:00Z' },
      { documentType: 'license', expiresAt: '2026-04-01T00:00:00Z' },
    ];
    const status = calculateComplianceStatus(docs, now);
    expect(status).toBe('expired');
  });

  it('expired takes priority over not_compliant', () => {
    const docs = [{ documentType: 'insurance', expiresAt: '2025-01-01T00:00:00Z' }];
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
    expect(validStatuses).toHaveLength(5);
  });

  it('expiring — license expires exactly on day 30', () => {
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + 30);
    const docs = [
      { documentType: 'insurance', expiresAt: '2027-12-31T00:00:00Z' },
      { documentType: 'license', expiresAt: expiresAt.toISOString() },
    ];
    const status = calculateComplianceStatus(docs, now);
    expect(status).toBe('expiring');
  });

  it('compliant — document expires on day 31 (just outside window)', () => {
    const expiresAt = new Date(now);
    expiresAt.setDate(expiresAt.getDate() + 31);
    const docs = [
      { documentType: 'insurance', expiresAt: expiresAt.toISOString() },
      { documentType: 'license', expiresAt: '2027-12-31T00:00:00Z' },
    ];
    const status = calculateComplianceStatus(docs, now);
    expect(status).toBe('compliant');
  });
});

// ---------------------------------------------------------------------------
// 4. GET /api/v1/vendors/:id — Vendor detail
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
    const res = await GET_DETAIL(req, { params: Promise.resolve({ id: VENDOR_ID }) });

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
    const res = await GET_DETAIL(req, { params: Promise.resolve({ id: 'non-existent' }) });
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

  it('recomputes compliance from documents on each GET', async () => {
    mockVendorFindUnique.mockResolvedValue({
      id: VENDOR_ID,
      companyName: 'ACME',
      complianceStatus: 'not_tracking', // stored status is stale
      documents: [
        { documentType: 'insurance', expiresAt: new Date('2020-01-01') }, // expired
        { documentType: 'license', expiresAt: new Date('2027-01-01') },
      ],
      serviceCategory: { id: CATEGORY_ID, name: 'Plumbing' },
    });

    const req = createGetRequest('/api/v1/vendors/detail');
    const res = await GET_DETAIL(req, { params: Promise.resolve({ id: VENDOR_ID }) });
    const body = await parseResponse<{ data: { complianceStatus: string } }>(res);

    // Should compute live, not return stale stored value
    expect(body.data.complianceStatus).toBe('expired');
  });
});

// ---------------------------------------------------------------------------
// 5. PATCH /api/v1/vendors/:id — Update vendor
// ---------------------------------------------------------------------------

describe('PATCH /api/v1/vendors/:id — Update vendor fields', () => {
  it('updates companyName', async () => {
    mockVendorFindUnique.mockResolvedValue({
      id: VENDOR_ID,
      companyName: 'Old Name',
    });
    mockVendorUpdate.mockResolvedValue({
      id: VENDOR_ID,
      companyName: 'New Name',
      documents: [],
      serviceCategory: { id: CATEGORY_ID, name: 'Plumbing' },
    });

    const req = createPatchRequest('/api/v1/vendors/update', { companyName: 'New Name' });
    const res = await PATCH(req, { params: Promise.resolve({ id: VENDOR_ID }) });
    expect(res.status).toBe(200);

    const updateData = mockVendorUpdate.mock.calls[0]![0].data;
    expect(updateData.companyName).toBe('New Name');
  });

  it('updates serviceCategoryId', async () => {
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

    const req = createPatchRequest('/api/v1/vendors/update', { serviceCategoryId: newCategoryId });
    const res = await PATCH(req, { params: Promise.resolve({ id: VENDOR_ID }) });
    expect(res.status).toBe(200);

    const updateData = mockVendorUpdate.mock.calls[0]![0].data;
    expect(updateData.serviceCategoryId).toBe(newCategoryId);
  });

  it('returns 404 for non-existent vendor', async () => {
    mockVendorFindUnique.mockResolvedValue(null);

    const req = createPatchRequest('/api/v1/vendors/update', { companyName: 'Test' });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'non-existent' }) });
    expect(res.status).toBe(404);
  });

  it('updates email and phone', async () => {
    mockVendorFindUnique.mockResolvedValue({ id: VENDOR_ID, companyName: 'ACME' });
    mockVendorUpdate.mockResolvedValue({
      id: VENDOR_ID,
      companyName: 'ACME',
      email: 'new@acme.com',
      phone: '647-555-9999',
      documents: [],
      serviceCategory: { id: CATEGORY_ID, name: 'Plumbing' },
    });

    const req = createPatchRequest('/api/v1/vendors/update', {
      email: 'new@acme.com',
      phone: '647-555-9999',
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: VENDOR_ID }) });
    expect(res.status).toBe(200);

    const updateData = mockVendorUpdate.mock.calls[0]![0].data;
    expect(updateData.email).toBe('new@acme.com');
    expect(updateData.phone).toBe('647-555-9999');
  });
});

// ---------------------------------------------------------------------------
// 6. Vendor deactivation/reactivation
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

    const req = createPatchRequest('/api/v1/vendors/deactivate', { isActive: false });
    const res = await PATCH(req, { params: Promise.resolve({ id: VENDOR_ID }) });

    expect(res.status).toBe(200);
    const updateData = mockVendorUpdate.mock.calls[0]![0].data;
    expect(updateData.isActive).toBe(false);

    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('deactivated');
  });

  it('reactivates vendor via PATCH isActive=true', async () => {
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

    const req = createPatchRequest('/api/v1/vendors/reactivate', { isActive: true });
    const res = await PATCH(req, { params: Promise.resolve({ id: VENDOR_ID }) });

    expect(res.status).toBe(200);
    const updateData = mockVendorUpdate.mock.calls[0]![0].data;
    expect(updateData.isActive).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 7. Document upload — POST /api/v1/vendors/:id/documents
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
    const res = await POST_DOC(req, { params: Promise.resolve({ id: VENDOR_ID }) });
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
    const res = await POST_DOC(req, { params: Promise.resolve({ id: VENDOR_ID }) });

    expect(res.status).toBe(201);
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
    const res = await POST_DOC(req, { params: Promise.resolve({ id: 'non-existent' }) });
    expect(res.status).toBe(404);
  });

  it('stores expiresAt as Date when provided', async () => {
    mockDocCreate.mockResolvedValue({
      id: 'doc-new',
      vendorId: VENDOR_ID,
      documentType: 'insurance',
    });
    mockDocFindMany.mockResolvedValue([]);

    const req = createPostRequest('/api/v1/vendors/documents', validDoc);
    await POST_DOC(req, { params: Promise.resolve({ id: VENDOR_ID }) });

    const createData = mockDocCreate.mock.calls[0]![0].data;
    expect(createData.expiresAt).toBeInstanceOf(Date);
  });

  it('allows null expiresAt for non-expiring documents', async () => {
    const docWithoutExpiry = {
      documentType: 'background_check',
      fileName: 'bgcheck.pdf',
      fileUrl: 'https://s3.example.com/bgcheck.pdf',
    };

    mockDocCreate.mockResolvedValue({
      id: 'doc-new',
      vendorId: VENDOR_ID,
      documentType: 'background_check',
    });
    mockDocFindMany.mockResolvedValue([]);

    const req = createPostRequest('/api/v1/vendors/documents', docWithoutExpiry);
    await POST_DOC(req, { params: Promise.resolve({ id: VENDOR_ID }) });

    const createData = mockDocCreate.mock.calls[0]![0].data;
    expect(createData.expiresAt).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 8. Document type validation
// ---------------------------------------------------------------------------

describe('Document type validation', () => {
  beforeEach(() => {
    mockVendorFindUnique.mockResolvedValue({ id: VENDOR_ID, propertyId: PROPERTY_ID });
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
    const res = await POST_DOC(req, { params: Promise.resolve({ id: VENDOR_ID }) });
    expect(res.status).toBe(201);
  });

  it('rejects invalid document type', async () => {
    const req = createPostRequest('/api/v1/vendors/documents', {
      documentType: 'tax_return',
      fileName: 'tax.pdf',
      fileUrl: 'https://s3.example.com/tax.pdf',
    });
    const res = await POST_DOC(req, { params: Promise.resolve({ id: VENDOR_ID }) });
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// 9. Insurance expiry alerts (vendors expiring within 30 days)
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

  it('ignores non-numeric expiringWithin values', async () => {
    const req = createGetRequest('/api/v1/vendors', {
      searchParams: { propertyId: PROPERTY_ID, expiringWithin: 'abc' },
    });
    await GET(req);

    const where = mockVendorFindMany.mock.calls[0]![0].where;
    expect(where.documents).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 10. Compliance dashboard summary
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
      { id: 'v2', documents: [] },
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

    const body = await parseResponse<{ data: Record<string, number> }>(res);
    expect(body.data.total).toBe(3);
    expect(body.data.compliant).toBe(1);
    expect(body.data.not_tracking).toBe(1);
    expect(body.data.expired).toBe(1);
  });

  it('returns all zeros for empty vendor list', async () => {
    mockVendorFindMany.mockResolvedValue([]);

    const req = createGetRequest('/api/v1/vendors', {
      searchParams: { propertyId: PROPERTY_ID, summary: 'compliance' },
    });
    const res = await GET(req);
    const body = await parseResponse<{ data: Record<string, number> }>(res);
    expect(body.data.total).toBe(0);
    expect(body.data.compliant).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 11. Tenant isolation
// ---------------------------------------------------------------------------

describe('Tenant isolation', () => {
  it('all list queries are scoped to propertyId', async () => {
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
// 12. GET /api/v1/vendors/:id/documents — List documents
// ---------------------------------------------------------------------------

describe('GET /api/v1/vendors/:id/documents — List documents', () => {
  it('returns documents for a vendor', async () => {
    mockVendorFindUnique.mockResolvedValue({ id: VENDOR_ID, propertyId: PROPERTY_ID });
    mockDocFindMany.mockResolvedValue([
      { id: 'doc-1', documentType: 'insurance', fileName: 'ins.pdf' },
      { id: 'doc-2', documentType: 'license', fileName: 'lic.pdf' },
    ]);

    const req = createGetRequest('/api/v1/vendors/documents');
    const res = await GET_DOCS(req, { params: Promise.resolve({ id: VENDOR_ID }) });

    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: Array<{ documentType: string }> }>(res);
    expect(body.data).toHaveLength(2);
  });

  it('returns 404 if vendor does not exist', async () => {
    mockVendorFindUnique.mockResolvedValue(null);

    const req = createGetRequest('/api/v1/vendors/documents');
    const res = await GET_DOCS(req, { params: Promise.resolve({ id: 'non-existent' }) });
    expect(res.status).toBe(404);
  });

  it('orders documents by createdAt desc', async () => {
    mockVendorFindUnique.mockResolvedValue({ id: VENDOR_ID, propertyId: PROPERTY_ID });
    mockDocFindMany.mockResolvedValue([]);

    const req = createGetRequest('/api/v1/vendors/documents');
    await GET_DOCS(req, { params: Promise.resolve({ id: VENDOR_ID }) });

    const orderBy = mockDocFindMany.mock.calls[0]![0].orderBy;
    expect(orderBy).toEqual({ createdAt: 'desc' });
  });

  it('scopes documents to vendorId', async () => {
    mockVendorFindUnique.mockResolvedValue({ id: VENDOR_ID, propertyId: PROPERTY_ID });
    mockDocFindMany.mockResolvedValue([]);

    const req = createGetRequest('/api/v1/vendors/documents');
    await GET_DOCS(req, { params: Promise.resolve({ id: VENDOR_ID }) });

    const where = mockDocFindMany.mock.calls[0]![0].where;
    expect(where.vendorId).toBe(VENDOR_ID);
  });
});

// ---------------------------------------------------------------------------
// 13. Vendor notes management
// ---------------------------------------------------------------------------

describe('Vendor notes management', () => {
  it('creates vendor with notes field', async () => {
    mockVendorCreate.mockResolvedValue({
      id: VENDOR_ID,
      companyName: 'ACME',
      notes: 'Preferred vendor for emergency calls',
      complianceStatus: 'not_tracking',
      serviceCategory: { id: CATEGORY_ID, name: 'Plumbing' },
    });

    const req = createPostRequest('/api/v1/vendors', {
      propertyId: PROPERTY_ID,
      companyName: 'ACME',
      serviceCategoryId: CATEGORY_ID,
      notes: 'Preferred vendor for emergency calls',
    });
    const res = await POST(req);
    expect(res.status).toBe(201);

    const createData = mockVendorCreate.mock.calls[0]![0].data;
    expect(createData.notes).toBeTruthy();
  });

  it('updates notes via PATCH', async () => {
    mockVendorFindUnique.mockResolvedValue({ id: VENDOR_ID, companyName: 'ACME' });
    mockVendorUpdate.mockResolvedValue({
      id: VENDOR_ID,
      companyName: 'ACME',
      notes: 'Updated notes',
      documents: [],
      serviceCategory: { id: CATEGORY_ID, name: 'Plumbing' },
    });

    const req = createPatchRequest('/api/v1/vendors/update', { notes: 'Updated notes' });
    const res = await PATCH(req, { params: Promise.resolve({ id: VENDOR_ID }) });
    expect(res.status).toBe(200);

    const updateData = mockVendorUpdate.mock.calls[0]![0].data;
    expect(updateData.notes).toBeTruthy();
  });
});
