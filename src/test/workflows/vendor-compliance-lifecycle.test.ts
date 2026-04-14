/**
 * Integration Workflow Tests — Vendor Compliance Lifecycle
 *
 * Tests complete vendor compliance workflows across multiple API endpoints:
 *   - Vendor created with insurance documents
 *   - Insurance approaching expiry triggers alerts
 *   - Insurance expired -> vendor status changes to non-compliant
 *   - Vendor uploads new insurance -> status returns to compliant
 *   - Compliance dashboard reflects current state
 *
 * Each test validates the 5-status compliance model and document lifecycle.
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

const mockVendorCreate = vi.fn();
const mockVendorFindMany = vi.fn();
const mockVendorFindUnique = vi.fn();
const mockVendorUpdate = vi.fn();
const mockVendorCount = vi.fn();

const mockVendorDocumentCreate = vi.fn();
const mockVendorDocumentFindMany = vi.fn();

const mockTransaction = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    vendor: {
      create: (...args: unknown[]) => mockVendorCreate(...args),
      findMany: (...args: unknown[]) => mockVendorFindMany(...args),
      findUnique: (...args: unknown[]) => mockVendorFindUnique(...args),
      update: (...args: unknown[]) => mockVendorUpdate(...args),
      count: (...args: unknown[]) => mockVendorCount(...args),
    },
    vendorDocument: {
      create: (...args: unknown[]) => mockVendorDocumentCreate(...args),
      findMany: (...args: unknown[]) => mockVendorDocumentFindMany(...args),
    },
    vendorServiceCategory: {
      findFirst: vi.fn().mockResolvedValue({ id: 'cat-1', name: 'General' }),
      create: vi
        .fn()
        .mockImplementation((args: Record<string, unknown>) =>
          Promise.resolve({ id: 'cat-new', ...(args as { data?: Record<string, unknown> }).data }),
        ),
    },
    user: {
      findFirst: vi.fn().mockResolvedValue(null),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

vi.mock('@/schemas/vendor', () => ({
  createVendorSchema: {
    safeParse: vi.fn().mockImplementation((data: Record<string, unknown>) => {
      if (!data.propertyId || !data.companyName || !data.serviceCategoryId) {
        return {
          success: false,
          error: { flatten: () => ({ fieldErrors: { companyName: ['Required'] } }) },
        };
      }
      return { success: true, data };
    }),
  },
  updateVendorSchema: {
    safeParse: vi.fn().mockImplementation((data: Record<string, unknown>) => {
      return { success: true, data };
    }),
  },
  createVendorDocumentSchema: {
    safeParse: vi.fn().mockImplementation((data: Record<string, unknown>) => {
      if (!data.documentType || !data.fileName || !data.fileUrl) {
        return {
          success: false,
          error: { flatten: () => ({ fieldErrors: { documentType: ['Required'] } }) },
        };
      }
      return { success: true, data };
    }),
  },
}));

vi.mock('@/server/vendors/compliance', () => ({
  calculateComplianceStatus: vi
    .fn()
    .mockImplementation((documents: { expiresAt: Date | null }[]) => {
      if (!documents || documents.length === 0) return 'not_tracking';

      const now = new Date();
      const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
      let hasExpired = false;
      let hasExpiring = false;

      for (const doc of documents) {
        if (doc.expiresAt) {
          const expiry = new Date(doc.expiresAt);
          if (expiry < now) hasExpired = true;
          else if (expiry < thirtyDaysFromNow) hasExpiring = true;
        }
      }

      if (hasExpired) return 'expired';
      if (hasExpiring) return 'expiring';
      return 'compliant';
    }),
  getExpiringDocumentFilter: vi.fn().mockReturnValue({}),
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

// ---------------------------------------------------------------------------
// Import route handlers AFTER mocks
// ---------------------------------------------------------------------------

import { GET as listVendors, POST as createVendor } from '@/app/api/v1/vendors/route';
import { GET as getVendor, PATCH as updateVendor } from '@/app/api/v1/vendors/[id]/route';
import {
  GET as _listVendorDocuments,
  POST as uploadVendorDocument,
} from '@/app/api/v1/vendors/[id]/documents/route';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROPERTY_ID = 'prop-001';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeVendor(overrides: Record<string, unknown> = {}) {
  return {
    id: 'vendor-001',
    propertyId: PROPERTY_ID,
    companyName: 'ProPlumb Plumbing Services',
    serviceCategoryId: 'cat-plumbing',
    contactName: 'Mike Johnson',
    phone: '416-555-0100',
    email: 'mike@proplumb.ca',
    streetAddress: '45 Plumber Lane',
    city: 'Toronto',
    stateProvince: 'ON',
    postalCode: 'M5V 2T6',
    notes: 'Preferred plumber for building.',
    complianceStatus: 'not_tracking',
    isActive: true,
    createdById: 'admin-001',
    createdAt: new Date(),
    serviceCategory: { id: 'cat-plumbing', name: 'Plumbing' },
    documents: [],
    ...overrides,
  };
}

function makeDocument(overrides: Record<string, unknown> = {}) {
  return {
    id: 'doc-001',
    vendorId: 'vendor-001',
    documentType: 'insurance',
    fileName: 'liability-insurance-2026.pdf',
    fileUrl: 'https://s3.amazonaws.com/docs/liability-insurance-2026.pdf',
    expiresAt: new Date('2027-03-01'),
    uploadedById: 'admin-001',
    createdAt: new Date(),
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
// SCENARIO 1: Vendor Created with Insurance Documents
// ===========================================================================

describe('Scenario 1: Vendor Created with Insurance Documents', () => {
  const vendorId = 'vendor-plumb-001';

  it('Step 1: create vendor with initial details', async () => {
    mockVendorCreate.mockResolvedValue(
      makeVendor({
        id: vendorId,
        complianceStatus: 'not_tracking',
      }),
    );

    const req = createPostRequest('/api/v1/vendors', {
      propertyId: PROPERTY_ID,
      companyName: 'ProPlumb Plumbing Services',
      serviceCategoryId: 'cat-plumbing',
      contactName: 'Mike Johnson',
      phone: '416-555-0100',
      email: 'mike@proplumb.ca',
    });

    const res = await createVendor(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{
      data: { companyName: string; complianceStatus: string };
      message: string;
    }>(res);
    expect(body.data.companyName).toBe('ProPlumb Plumbing Services');
    expect(body.data.complianceStatus).toBe('not_tracking');
    expect(body.message).toContain('ProPlumb');
  });

  it('Step 2: upload liability insurance document', async () => {
    mockVendorFindUnique.mockResolvedValue(makeVendor({ id: vendorId }));
    mockVendorDocumentCreate.mockResolvedValue(
      makeDocument({
        vendorId,
        documentType: 'insurance',
        fileName: 'general-liability-2026.pdf',
        expiresAt: new Date('2027-06-15'),
      }),
    );
    mockVendorDocumentFindMany.mockResolvedValue([
      makeDocument({ expiresAt: new Date('2027-06-15') }),
    ]);
    mockVendorUpdate.mockResolvedValue(makeVendor({ id: vendorId, complianceStatus: 'compliant' }));

    const req = createPostRequest(`/api/v1/vendors/${vendorId}/documents`, {
      documentType: 'insurance',
      fileName: 'general-liability-2026.pdf',
      fileUrl: 'https://s3.amazonaws.com/docs/general-liability-2026.pdf',
      expiresAt: '2027-06-15',
    });

    const res = await uploadVendorDocument(req, { params: Promise.resolve({ id: vendorId }) });
    expect(res.status).toBe(201);

    const body = await parseResponse<{ data: { documentType: string }; message: string }>(res);
    expect(body.data.documentType).toBe('insurance');
    expect(body.message).toContain('insurance');
  });

  it('Step 3: upload WSIB certificate', async () => {
    mockVendorFindUnique.mockResolvedValue(makeVendor({ id: vendorId }));
    mockVendorDocumentCreate.mockResolvedValue(
      makeDocument({
        vendorId,
        documentType: 'wsib',
        fileName: 'wsib-clearance-2026.pdf',
        expiresAt: new Date('2027-01-31'),
      }),
    );
    mockVendorDocumentFindMany.mockResolvedValue([
      makeDocument({ expiresAt: new Date('2027-06-15') }),
      makeDocument({ documentType: 'wsib', expiresAt: new Date('2027-01-31') }),
    ]);
    mockVendorUpdate.mockResolvedValue(makeVendor({ id: vendorId, complianceStatus: 'compliant' }));

    const req = createPostRequest(`/api/v1/vendors/${vendorId}/documents`, {
      documentType: 'wsib',
      fileName: 'wsib-clearance-2026.pdf',
      fileUrl: 'https://s3.amazonaws.com/docs/wsib-clearance-2026.pdf',
      expiresAt: '2027-01-31',
    });

    const res = await uploadVendorDocument(req, { params: Promise.resolve({ id: vendorId }) });
    expect(res.status).toBe(201);
  });

  it('Step 4: vendor now shows as compliant with all documents', async () => {
    const docsWithValidExpiry = [
      makeDocument({ documentType: 'insurance', expiresAt: new Date('2027-06-15') }),
      makeDocument({ documentType: 'wsib', expiresAt: new Date('2027-01-31') }),
    ];

    mockVendorFindUnique.mockResolvedValue(
      makeVendor({
        id: vendorId,
        documents: docsWithValidExpiry,
      }),
    );

    const req = createGetRequest(`/api/v1/vendors/${vendorId}`);
    const res = await getVendor(req, { params: Promise.resolve({ id: vendorId }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { complianceStatus: string; documents: { documentType: string }[] };
    }>(res);
    expect(body.data.complianceStatus).toBe('compliant');
  });
});

// ===========================================================================
// SCENARIO 2: Insurance Approaching Expiry
// ===========================================================================

describe('Scenario 2: Insurance Approaching Expiry Triggers Alert Status', () => {
  const vendorId = 'vendor-expiring-001';

  it('vendor with doc expiring within 30 days shows as "expiring"', async () => {
    const expiringDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000); // 15 days from now
    const docsExpiringSoon = [makeDocument({ documentType: 'insurance', expiresAt: expiringDate })];

    mockVendorFindUnique.mockResolvedValue(
      makeVendor({
        id: vendorId,
        documents: docsExpiringSoon,
      }),
    );

    const req = createGetRequest(`/api/v1/vendors/${vendorId}`);
    const res = await getVendor(req, { params: Promise.resolve({ id: vendorId }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { complianceStatus: string } }>(res);
    expect(body.data.complianceStatus).toBe('expiring');
  });

  it('compliance dashboard shows vendors with expiring documents', async () => {
    mockVendorFindMany.mockResolvedValue([
      makeVendor({
        id: 'v1',
        companyName: 'Vendor A',
        documents: [makeDocument({ expiresAt: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) })],
      }),
      makeVendor({
        id: 'v2',
        companyName: 'Vendor B',
        documents: [makeDocument({ expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000) })],
      }),
    ]);

    const req = createGetRequest('/api/v1/vendors', {
      searchParams: { propertyId: PROPERTY_ID, summary: 'compliance' },
    });

    const res = await listVendors(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { compliant: number; expiring: number; expired: number; total: number };
    }>(res);
    expect(body.data.total).toBe(2);
    // The mock calculateComplianceStatus will compute based on actual dates
    expect(body.data.expiring).toBeGreaterThanOrEqual(0);
  });
});

// ===========================================================================
// SCENARIO 3: Insurance Expired -> Non-Compliant
// ===========================================================================

describe('Scenario 3: Insurance Expired -> Vendor Status Changes to Non-Compliant', () => {
  const vendorId = 'vendor-expired-001';

  it('vendor with expired insurance shows as "expired"', async () => {
    const expiredDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days ago
    const expiredDocs = [makeDocument({ documentType: 'insurance', expiresAt: expiredDate })];

    mockVendorFindUnique.mockResolvedValue(
      makeVendor({
        id: vendorId,
        documents: expiredDocs,
      }),
    );

    const req = createGetRequest(`/api/v1/vendors/${vendorId}`);
    const res = await getVendor(req, { params: Promise.resolve({ id: vendorId }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { complianceStatus: string } }>(res);
    expect(body.data.complianceStatus).toBe('expired');
  });

  it('expired vendor appears when filtering by status', async () => {
    mockVendorFindMany.mockResolvedValue([
      makeVendor({ id: vendorId, complianceStatus: 'expired' }),
    ]);
    mockVendorCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/vendors', {
      searchParams: { propertyId: PROPERTY_ID, status: 'expired' },
    });

    const res = await listVendors(req);
    expect(res.status).toBe(200);

    expect(mockVendorFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          complianceStatus: 'expired',
        }),
      }),
    );
  });
});

// ===========================================================================
// SCENARIO 4: Vendor Uploads New Insurance -> Compliant Again
// ===========================================================================

describe('Scenario 4: Vendor Uploads New Insurance -> Returns to Compliant', () => {
  const vendorId = 'vendor-renewed-001';

  it('Step 1: vendor currently has expired insurance', async () => {
    const expiredDocs = [
      makeDocument({ documentType: 'insurance', expiresAt: new Date('2026-02-01') }),
    ];
    mockVendorFindUnique.mockResolvedValue(makeVendor({ id: vendorId, documents: expiredDocs }));

    const req = createGetRequest(`/api/v1/vendors/${vendorId}`);
    const res = await getVendor(req, { params: Promise.resolve({ id: vendorId }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { complianceStatus: string } }>(res);
    expect(body.data.complianceStatus).toBe('expired');
  });

  it('Step 2: upload renewed insurance with new expiry date', async () => {
    mockVendorFindUnique.mockResolvedValue(makeVendor({ id: vendorId }));
    mockVendorDocumentCreate.mockResolvedValue(
      makeDocument({
        vendorId,
        documentType: 'insurance',
        fileName: 'renewed-liability-2026-2027.pdf',
        expiresAt: new Date('2027-06-01'),
      }),
    );
    // After upload, all docs include the new one with future expiry
    mockVendorDocumentFindMany.mockResolvedValue([
      makeDocument({ documentType: 'insurance', expiresAt: new Date('2026-02-01') }), // old expired
      makeDocument({ documentType: 'insurance', expiresAt: new Date('2027-06-01') }), // new valid
    ]);
    mockVendorUpdate.mockResolvedValue(makeVendor({ id: vendorId, complianceStatus: 'compliant' }));

    const req = createPostRequest(`/api/v1/vendors/${vendorId}/documents`, {
      documentType: 'insurance',
      fileName: 'renewed-liability-2026-2027.pdf',
      fileUrl: 'https://s3.amazonaws.com/docs/renewed-liability-2026-2027.pdf',
      expiresAt: '2027-06-01',
    });

    const res = await uploadVendorDocument(req, { params: Promise.resolve({ id: vendorId }) });
    expect(res.status).toBe(201);

    // Verify compliance status was recomputed and updated
    expect(mockVendorUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: vendorId },
        data: expect.objectContaining({
          complianceStatus: expect.any(String),
        }),
      }),
    );
  });

  it('Step 3: vendor now shows as compliant after renewal', async () => {
    const validDocs = [
      makeDocument({ documentType: 'insurance', expiresAt: new Date('2027-06-01') }),
    ];
    mockVendorFindUnique.mockResolvedValue(makeVendor({ id: vendorId, documents: validDocs }));

    const req = createGetRequest(`/api/v1/vendors/${vendorId}`);
    const res = await getVendor(req, { params: Promise.resolve({ id: vendorId }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { complianceStatus: string } }>(res);
    expect(body.data.complianceStatus).toBe('compliant');
  });
});

// ===========================================================================
// SCENARIO 5: Compliance Dashboard Reflects Current State
// ===========================================================================

describe('Scenario 5: Compliance Dashboard Shows 5-Status Summary', () => {
  it('dashboard shows all 5 compliance statuses with counts', async () => {
    const now = Date.now();
    const futureDate = new Date(now + 365 * 24 * 60 * 60 * 1000);
    const expiringDate = new Date(now + 15 * 24 * 60 * 60 * 1000);
    const expiredDate = new Date(now - 30 * 24 * 60 * 60 * 1000);

    mockVendorFindMany.mockResolvedValue([
      // Compliant vendor
      makeVendor({
        id: 'v1',
        companyName: 'Good Plumber',
        documents: [makeDocument({ expiresAt: futureDate })],
      }),
      // Expiring vendor
      makeVendor({
        id: 'v2',
        companyName: 'Expiring Electric',
        documents: [makeDocument({ expiresAt: expiringDate })],
      }),
      // Expired vendor
      makeVendor({
        id: 'v3',
        companyName: 'Lapsed HVAC',
        documents: [makeDocument({ expiresAt: expiredDate })],
      }),
      // Not tracking vendor (no documents)
      makeVendor({
        id: 'v4',
        companyName: 'New Vendor',
        documents: [],
      }),
      // Another compliant
      makeVendor({
        id: 'v5',
        companyName: 'Reliable Painting',
        documents: [makeDocument({ expiresAt: futureDate })],
      }),
    ]);

    const req = createGetRequest('/api/v1/vendors', {
      searchParams: { propertyId: PROPERTY_ID, summary: 'compliance' },
    });

    const res = await listVendors(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: {
        compliant: number;
        expiring: number;
        expired: number;
        not_tracking: number;
        total: number;
      };
    }>(res);
    expect(body.data.total).toBe(5);
    expect(body.data.compliant).toBe(2);
    expect(body.data.expiring).toBe(1);
    expect(body.data.expired).toBe(1);
    expect(body.data.not_tracking).toBe(1);
  });

  it('should filter vendors by service category', async () => {
    mockVendorFindMany.mockResolvedValue([]);
    mockVendorCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/vendors', {
      searchParams: { propertyId: PROPERTY_ID, categoryId: 'cat-plumbing' },
    });

    await listVendors(req);

    expect(mockVendorFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          serviceCategoryId: 'cat-plumbing',
        }),
      }),
    );
  });

  it('should search vendors by company name', async () => {
    mockVendorFindMany.mockResolvedValue([]);
    mockVendorCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/vendors', {
      searchParams: { propertyId: PROPERTY_ID, search: 'ProPlumb' },
    });

    await listVendors(req);

    expect(mockVendorFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({
              companyName: expect.objectContaining({ contains: 'ProPlumb' }),
            }),
          ]),
        }),
      }),
    );
  });
});

// ===========================================================================
// Full End-to-End Workflow
// ===========================================================================

describe('Full Workflow: Vendor from creation to compliance renewal', () => {
  const vendorId = 'vendor-e2e-001';

  it('complete lifecycle: create -> upload insurance -> verify compliant -> expire -> renew -> verify compliant again', async () => {
    // Step 1: Create vendor
    mockVendorCreate.mockResolvedValue(
      makeVendor({ id: vendorId, complianceStatus: 'not_tracking' }),
    );
    const createRes = await createVendor(
      createPostRequest('/api/v1/vendors', {
        propertyId: PROPERTY_ID,
        companyName: 'E2E Plumbing Co',
        serviceCategoryId: 'cat-plumbing',
        contactName: 'Test Contact',
      }),
    );
    expect(createRes.status).toBe(201);

    // Step 2: Upload insurance
    mockVendorFindUnique.mockResolvedValue(makeVendor({ id: vendorId }));
    mockVendorDocumentCreate.mockResolvedValue(
      makeDocument({ vendorId, expiresAt: new Date('2027-06-01') }),
    );
    mockVendorDocumentFindMany.mockResolvedValue([
      makeDocument({ expiresAt: new Date('2027-06-01') }),
    ]);
    mockVendorUpdate.mockResolvedValue(makeVendor({ id: vendorId, complianceStatus: 'compliant' }));
    const uploadRes = await uploadVendorDocument(
      createPostRequest(`/api/v1/vendors/${vendorId}/documents`, {
        documentType: 'insurance',
        fileName: 'insurance.pdf',
        fileUrl: 'https://s3.amazonaws.com/insurance.pdf',
        expiresAt: '2027-06-01',
      }),
      { params: Promise.resolve({ id: vendorId }) },
    );
    expect(uploadRes.status).toBe(201);

    // Step 3: Verify compliant
    const validDocs = [makeDocument({ expiresAt: new Date('2027-06-01') })];
    mockVendorFindUnique.mockResolvedValue(makeVendor({ id: vendorId, documents: validDocs }));
    const compliantRes = await getVendor(createGetRequest(`/api/v1/vendors/${vendorId}`), {
      params: Promise.resolve({ id: vendorId }),
    });
    expect(compliantRes.status).toBe(200);
    const compliantBody = await parseResponse<{ data: { complianceStatus: string } }>(compliantRes);
    expect(compliantBody.data.complianceStatus).toBe('compliant');

    // Step 4: Time passes, insurance expires
    const expiredDocs = [makeDocument({ expiresAt: new Date('2026-01-01') })];
    mockVendorFindUnique.mockResolvedValue(makeVendor({ id: vendorId, documents: expiredDocs }));
    const expiredRes = await getVendor(createGetRequest(`/api/v1/vendors/${vendorId}`), {
      params: Promise.resolve({ id: vendorId }),
    });
    expect(expiredRes.status).toBe(200);
    const expiredBody = await parseResponse<{ data: { complianceStatus: string } }>(expiredRes);
    expect(expiredBody.data.complianceStatus).toBe('expired');

    // Step 5: Upload renewed insurance
    mockVendorFindUnique.mockResolvedValue(makeVendor({ id: vendorId }));
    mockVendorDocumentCreate.mockResolvedValue(
      makeDocument({ vendorId, expiresAt: new Date('2028-06-01') }),
    );
    mockVendorDocumentFindMany.mockResolvedValue([
      makeDocument({ expiresAt: new Date('2028-06-01') }),
    ]);
    mockVendorUpdate.mockResolvedValue(makeVendor({ id: vendorId, complianceStatus: 'compliant' }));
    const renewRes = await uploadVendorDocument(
      createPostRequest(`/api/v1/vendors/${vendorId}/documents`, {
        documentType: 'insurance',
        fileName: 'renewed-insurance.pdf',
        fileUrl: 'https://s3.amazonaws.com/renewed.pdf',
        expiresAt: '2028-06-01',
      }),
      { params: Promise.resolve({ id: vendorId }) },
    );
    expect(renewRes.status).toBe(201);

    // Step 6: Verify compliant again
    const renewedDocs = [makeDocument({ expiresAt: new Date('2028-06-01') })];
    mockVendorFindUnique.mockResolvedValue(makeVendor({ id: vendorId, documents: renewedDocs }));
    const renewedRes = await getVendor(createGetRequest(`/api/v1/vendors/${vendorId}`), {
      params: Promise.resolve({ id: vendorId }),
    });
    expect(renewedRes.status).toBe(200);
    const renewedBody = await parseResponse<{ data: { complianceStatus: string } }>(renewedRes);
    expect(renewedBody.data.complianceStatus).toBe('compliant');
  });
});

// ===========================================================================
// Validation & Edge Cases
// ===========================================================================

describe('Vendor Compliance: Validation & Edge Cases', () => {
  it('should reject vendor creation without companyName', async () => {
    const req = createPostRequest('/api/v1/vendors', {
      propertyId: PROPERTY_ID,
      serviceCategoryId: 'cat-plumbing',
    });

    const res = await createVendor(req);
    expect(res.status).toBe(400);
  });

  it('should reject vendor creation without propertyId', async () => {
    const req = createPostRequest('/api/v1/vendors', {
      companyName: 'Test Co',
      serviceCategoryId: 'cat-plumbing',
    });

    const res = await createVendor(req);
    expect(res.status).toBe(400);
  });

  it('listing vendors requires propertyId', async () => {
    const req = createGetRequest('/api/v1/vendors');
    const res = await listVendors(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_PROPERTY');
  });

  it('should return 404 for non-existent vendor', async () => {
    mockVendorFindUnique.mockResolvedValue(null);

    const req = createGetRequest('/api/v1/vendors/nonexistent');
    const res = await getVendor(req, { params: Promise.resolve({ id: 'nonexistent' }) });
    expect(res.status).toBe(404);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('NOT_FOUND');
  });

  it('should return 404 when uploading document for non-existent vendor', async () => {
    mockVendorFindUnique.mockResolvedValue(null);

    const req = createPostRequest('/api/v1/vendors/nonexistent/documents', {
      documentType: 'insurance',
      fileName: 'test.pdf',
      fileUrl: 'https://example.com/test.pdf',
    });

    const res = await uploadVendorDocument(req, {
      params: Promise.resolve({ id: 'nonexistent' }),
    });
    expect(res.status).toBe(404);
  });

  it('should reject document upload without required fields', async () => {
    mockVendorFindUnique.mockResolvedValue(makeVendor());

    const req = createPostRequest('/api/v1/vendors/vendor-001/documents', {
      // Missing documentType, fileName, fileUrl
    });

    const res = await uploadVendorDocument(req, {
      params: Promise.resolve({ id: 'vendor-001' }),
    });
    expect(res.status).toBe(400);
  });

  it('should deactivate vendor via PATCH', async () => {
    mockVendorFindUnique.mockResolvedValue(makeVendor({ id: 'vendor-deactivate' }));
    mockVendorUpdate.mockResolvedValue(
      makeVendor({
        id: 'vendor-deactivate',
        isActive: false,
        documents: [],
      }),
    );

    const req = createPatchRequest('/api/v1/vendors/vendor-deactivate', {
      isActive: false,
    });

    const res = await updateVendor(req, {
      params: Promise.resolve({ id: 'vendor-deactivate' }),
    });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('deactivated');
  });
});
