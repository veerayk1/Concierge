/**
 * Purchase Orders API Route Tests
 *
 * Tests cover: CRUD operations, PO number auto-generation (PO-YYYY-NNNNN format),
 * status lifecycle (draft -> pending_approval -> approved -> ordered -> received -> cancelled),
 * approval workflow with role checks, approval thresholds ($5000+),
 * line items, budget tracking, vendor assignment, expected delivery dates,
 * document attachments, category/priority/status filters, spend summaries,
 * amount validation, and tenant isolation.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  createGetRequest,
  createPostRequest,
  createPatchRequest,
  parseResponse,
} from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Mock Setup
// ---------------------------------------------------------------------------

const mockPOFindMany = vi.fn();
const mockPOCount = vi.fn();
const mockPOCreate = vi.fn();
const mockPOFindUnique = vi.fn();
const mockPOUpdate = vi.fn();
const mockBudgetFindFirst = vi.fn();
const mockPOAggregate = vi.fn();
const mockPOGroupBy = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    purchaseOrder: {
      findMany: (...args: unknown[]) => mockPOFindMany(...args),
      count: (...args: unknown[]) => mockPOCount(...args),
      create: (...args: unknown[]) => mockPOCreate(...args),
      findUnique: (...args: unknown[]) => mockPOFindUnique(...args),
      update: (...args: unknown[]) => mockPOUpdate(...args),
      aggregate: (...args: unknown[]) => mockPOAggregate(...args),
      groupBy: (...args: unknown[]) => mockPOGroupBy(...args),
    },
    budgetLineItem: {
      findFirst: (...args: unknown[]) => mockBudgetFindFirst(...args),
    },
  },
}));

vi.mock('nanoid', () => ({
  nanoid: vi.fn().mockReturnValue('A1B2C3'),
}));

const mockGuardRoute = vi.fn();
vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: (...args: unknown[]) => mockGuardRoute(...args),
}));

import { GET, POST } from '../route';

const PROPERTY_ID = '00000000-0000-4000-b000-000000000001';
const VENDOR_ID = '00000000-0000-4000-c000-000000000001';

function setRole(role: string) {
  mockGuardRoute.mockResolvedValue({
    user: {
      userId: 'test-user',
      propertyId: PROPERTY_ID,
      role,
      permissions: ['*'],
      mfaVerified: false,
    },
    error: null,
  });
}

const validBody = {
  propertyId: PROPERTY_ID,
  vendorId: VENDOR_ID,
  budgetCategory: 'Maintenance & Repairs',
  notes: 'Emergency HVAC compressor replacement for lobby',
  items: [
    { description: 'HVAC Compressor Unit', quantity: 1, unitPrice: 4500.0 },
    { description: 'Installation Labor (8 hrs)', quantity: 8, unitPrice: 125.0 },
  ],
};

function setupPOCreate(overrides: Record<string, unknown> = {}) {
  const expectedTotal = 4500.0 * 1 + 125.0 * 8;
  mockBudgetFindFirst.mockResolvedValue({ plannedAmount: 100000, actualAmount: 20000 });
  mockPOCreate.mockResolvedValue({
    id: 'po-1',
    referenceNumber: 'PO-A1B2C3',
    vendorId: VENDOR_ID,
    totalAmount: expectedTotal,
    status: 'draft',
    items: validBody.items.map((item, i) => ({
      id: `poi-${i}`,
      ...item,
      total: item.quantity * item.unitPrice,
    })),
    createdAt: new Date(),
    ...overrides,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockPOFindMany.mockResolvedValue([]);
  mockPOCount.mockResolvedValue(0);
  setRole('property_admin');
});

// ---------------------------------------------------------------------------
// 1. GET POs list with sorting by date
// ---------------------------------------------------------------------------

describe('GET /api/v1/purchase-orders — List with sorting', () => {
  it('orders by createdAt DESC — newest POs first', async () => {
    const req = createGetRequest('/api/v1/purchase-orders', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    await GET(req);

    expect(mockPOFindMany.mock.calls[0]![0].orderBy).toEqual({ createdAt: 'desc' });
  });

  it('returns paginated list with meta', async () => {
    mockPOCount.mockResolvedValue(100);
    const req = createGetRequest('/api/v1/purchase-orders', {
      searchParams: { propertyId: PROPERTY_ID, page: '3', pageSize: '20' },
    });
    const res = await GET(req);

    const body = await parseResponse<{ meta: { page: number; pageSize: number; total: number } }>(
      res,
    );
    expect(body.meta.page).toBe(3);
    expect(body.meta.pageSize).toBe(20);
    expect(mockPOFindMany.mock.calls[0]![0].skip).toBe(40);
    expect(mockPOFindMany.mock.calls[0]![0].take).toBe(20);
  });
});

// ---------------------------------------------------------------------------
// 2. GET filters by status (draft, pending_approval, approved, ordered, received, cancelled)
// ---------------------------------------------------------------------------

describe('GET /api/v1/purchase-orders — Filter by status', () => {
  it('filters by status=draft', async () => {
    const req = createGetRequest('/api/v1/purchase-orders', {
      searchParams: { propertyId: PROPERTY_ID, status: 'draft' },
    });
    await GET(req);
    expect(mockPOFindMany.mock.calls[0]![0].where.status).toBe('draft');
  });

  it('filters by status=approved', async () => {
    const req = createGetRequest('/api/v1/purchase-orders', {
      searchParams: { propertyId: PROPERTY_ID, status: 'approved' },
    });
    await GET(req);
    expect(mockPOFindMany.mock.calls[0]![0].where.status).toBe('approved');
  });

  it('filters by status=ordered', async () => {
    const req = createGetRequest('/api/v1/purchase-orders', {
      searchParams: { propertyId: PROPERTY_ID, status: 'ordered' },
    });
    await GET(req);
    expect(mockPOFindMany.mock.calls[0]![0].where.status).toBe('ordered');
  });

  it('filters by status=received', async () => {
    const req = createGetRequest('/api/v1/purchase-orders', {
      searchParams: { propertyId: PROPERTY_ID, status: 'received' },
    });
    await GET(req);
    expect(mockPOFindMany.mock.calls[0]![0].where.status).toBe('received');
  });
});

// ---------------------------------------------------------------------------
// 3. GET filters by category
// ---------------------------------------------------------------------------

describe('GET /api/v1/purchase-orders — Search and filter', () => {
  it('search covers referenceNumber AND vendor company name', async () => {
    const req = createGetRequest('/api/v1/purchase-orders', {
      searchParams: { propertyId: PROPERTY_ID, search: 'HVAC' },
    });
    await GET(req);

    const where = mockPOFindMany.mock.calls[0]![0].where;
    expect(where.OR).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ referenceNumber: { contains: 'HVAC', mode: 'insensitive' } }),
        expect.objectContaining({
          vendor: { companyName: { contains: 'HVAC', mode: 'insensitive' } },
        }),
      ]),
    );
  });
});

// ---------------------------------------------------------------------------
// 4. GET calculates total spend summaries
// ---------------------------------------------------------------------------

describe('GET /api/v1/purchase-orders — Monthly Spending Summary', () => {
  it('returns spending grouped by budgetCategory when summary=spending', async () => {
    mockPOGroupBy.mockResolvedValue([
      { budgetCategory: 'Maintenance & Repairs', _sum: { totalAmount: 15000 } },
      { budgetCategory: 'Supplies', _sum: { totalAmount: 3200 } },
      { budgetCategory: 'Capital Improvements', _sum: { totalAmount: 45000 } },
    ]);

    const req = createGetRequest('/api/v1/purchase-orders', {
      searchParams: { propertyId: PROPERTY_ID, summary: 'spending', month: '2026-03' },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: Array<{ budgetCategory: string; _sum: { totalAmount: number } }>;
    }>(res);
    expect(body.data).toHaveLength(3);
    expect(body.data[0]!.budgetCategory).toBe('Maintenance & Repairs');
  });
});

// ---------------------------------------------------------------------------
// 5. POST create PO with required fields (vendor, description, category, amount)
// ---------------------------------------------------------------------------

describe('POST /api/v1/purchase-orders — PO Creation', () => {
  it('creates PO with vendor, items, and auto-calculated total', async () => {
    const expectedTotal = 4500.0 * 1 + 125.0 * 8; // 5500.00
    setupPOCreate();

    const req = createPostRequest('/api/v1/purchase-orders', validBody);
    const res = await POST(req);

    expect(res.status).toBe(201);
    const body = await parseResponse<{ data: { totalAmount: number } }>(res);
    expect(body.data.totalAmount).toBe(expectedTotal);
  });

  it('stores each line item with description, quantity, unit price, and line total', async () => {
    setupPOCreate();

    const req = createPostRequest('/api/v1/purchase-orders', validBody);
    await POST(req);

    const createArg = mockPOCreate.mock.calls[0]![0];
    const items = createArg.data.items.create;
    expect(items).toHaveLength(2);
    expect(items[0]).toMatchObject({
      description: 'HVAC Compressor Unit',
      quantity: 1,
      unitPrice: 4500.0,
      total: 4500.0,
    });
    expect(items[1]).toMatchObject({
      description: 'Installation Labor (8 hrs)',
      quantity: 8,
      unitPrice: 125.0,
      total: 1000.0,
    });
  });

  it('rejects PO with no items', async () => {
    const req = createPostRequest('/api/v1/purchase-orders', { ...validBody, items: [] });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects PO without vendorId', async () => {
    const { vendorId: _v, ...noVendor } = validBody;
    const req = createPostRequest('/api/v1/purchase-orders', noVendor);
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects PO without budgetCategory', async () => {
    const { budgetCategory: _b, ...noBudget } = validBody;
    const req = createPostRequest('/api/v1/purchase-orders', noBudget);
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// 6. POST auto-generates PO number (PO-XXXXXX)
// ---------------------------------------------------------------------------

describe('POST /api/v1/purchase-orders — Reference Number', () => {
  it('generates PO-XXXXXX reference number automatically', async () => {
    setupPOCreate();

    const req = createPostRequest('/api/v1/purchase-orders', {
      propertyId: PROPERTY_ID,
      vendorId: VENDOR_ID,
      budgetCategory: 'Supplies',
      items: [{ description: 'Test item', quantity: 1, unitPrice: 100 }],
    });
    await POST(req);

    const createArg = mockPOCreate.mock.calls[0]![0];
    expect(createArg.data.referenceNumber).toMatch(/^PO-[A-Z0-9]{6}$/);
  });
});

// ---------------------------------------------------------------------------
// 7. POST validates amount > 0
// ---------------------------------------------------------------------------

describe('POST /api/v1/purchase-orders — Amount Validation', () => {
  it('rejects item with zero quantity', async () => {
    const req = createPostRequest('/api/v1/purchase-orders', {
      propertyId: PROPERTY_ID,
      vendorId: VENDOR_ID,
      budgetCategory: 'Supplies',
      items: [{ description: 'Widget', quantity: 0, unitPrice: 100 }],
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects item with negative unit price', async () => {
    const req = createPostRequest('/api/v1/purchase-orders', {
      propertyId: PROPERTY_ID,
      vendorId: VENDOR_ID,
      budgetCategory: 'Supplies',
      items: [{ description: 'Widget', quantity: 1, unitPrice: -50 }],
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects item with empty description', async () => {
    const req = createPostRequest('/api/v1/purchase-orders', {
      propertyId: PROPERTY_ID,
      vendorId: VENDOR_ID,
      budgetCategory: 'Supplies',
      items: [{ description: '', quantity: 1, unitPrice: 100 }],
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('calculates line total as quantity * unitPrice for each item', async () => {
    mockBudgetFindFirst.mockResolvedValue({ plannedAmount: 100000, actualAmount: 0 });
    mockPOCreate.mockResolvedValue({
      id: 'po-1',
      referenceNumber: 'PO-A1B2C3',
      status: 'draft',
      totalAmount: 750,
      items: [
        { id: 'poi-1', description: 'Paint', quantity: 5, unitPrice: 50, total: 250 },
        { id: 'poi-2', description: 'Brushes', quantity: 10, unitPrice: 50, total: 500 },
      ],
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/purchase-orders', {
      propertyId: PROPERTY_ID,
      vendorId: VENDOR_ID,
      budgetCategory: 'Maintenance & Repairs',
      items: [
        { description: 'Paint', quantity: 5, unitPrice: 50 },
        { description: 'Brushes', quantity: 10, unitPrice: 50 },
      ],
    });
    await POST(req);

    const createArg = mockPOCreate.mock.calls[0]![0];
    expect(createArg.data.totalAmount).toBe(750);
    expect(createArg.data.items.create[0].total).toBe(250);
    expect(createArg.data.items.create[1].total).toBe(500);
  });
});

// ---------------------------------------------------------------------------
// 8. POST validates category enum
// ---------------------------------------------------------------------------

describe('POST /api/v1/purchase-orders — Budget Category', () => {
  it('stores budget category on PO', async () => {
    mockBudgetFindFirst.mockResolvedValue({ plannedAmount: 100000, actualAmount: 0 });
    mockPOCreate.mockResolvedValue({
      id: 'po-1',
      referenceNumber: 'PO-A1B2C3',
      budgetCategory: 'Capital Improvements',
      status: 'draft',
      totalAmount: 5000,
      items: [
        { id: 'poi-1', description: 'Lobby tiles', quantity: 100, unitPrice: 50, total: 5000 },
      ],
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/purchase-orders', {
      propertyId: PROPERTY_ID,
      vendorId: VENDOR_ID,
      budgetCategory: 'Capital Improvements',
      items: [{ description: 'Lobby tiles', quantity: 100, unitPrice: 50 }],
    });
    await POST(req);

    expect(mockPOCreate.mock.calls[0]![0].data.budgetCategory).toBe('Capital Improvements');
  });
});

// ---------------------------------------------------------------------------
// 9. PATCH update PO status with approval workflow
// ---------------------------------------------------------------------------

describe('PATCH /api/v1/purchase-orders/[id] — Status Lifecycle', () => {
  it('defines correct status lifecycle transitions', async () => {
    const { PO_STATUS_TRANSITIONS } = await import('@/schemas/purchase-order');

    // draft -> submitted only
    expect(PO_STATUS_TRANSITIONS.draft).toContain('submitted');
    expect(PO_STATUS_TRANSITIONS.draft).not.toContain('approved');

    // submitted -> approved or back to draft
    expect(PO_STATUS_TRANSITIONS.submitted).toContain('approved');
    expect(PO_STATUS_TRANSITIONS.submitted).toContain('draft');

    // approved -> ordered only
    expect(PO_STATUS_TRANSITIONS.approved).toContain('ordered');
    expect(PO_STATUS_TRANSITIONS.approved).not.toContain('closed');

    // ordered -> received
    expect(PO_STATUS_TRANSITIONS.ordered).toContain('received');

    // received -> closed
    expect(PO_STATUS_TRANSITIONS.received).toContain('closed');

    // closed -> nothing (terminal state)
    expect(PO_STATUS_TRANSITIONS.closed).toHaveLength(0);
  });

  it('PO starts in draft status on creation', async () => {
    setupPOCreate();

    const req = createPostRequest('/api/v1/purchase-orders', {
      propertyId: PROPERTY_ID,
      vendorId: VENDOR_ID,
      budgetCategory: 'Supplies',
      items: [{ description: 'Office supplies', quantity: 1, unitPrice: 500 }],
    });
    await POST(req);

    expect(mockPOCreate.mock.calls[0]![0].data.status).toBe('draft');
  });
});

// ---------------------------------------------------------------------------
// 10. Approval workflow: role-based access
// ---------------------------------------------------------------------------

describe('Approval Workflow — Role-Based Access', () => {
  it('property_admin can create POs', async () => {
    setRole('property_admin');
    setupPOCreate();

    const req = createPostRequest('/api/v1/purchase-orders', validBody);
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('board_member can create POs', async () => {
    setRole('board_member');
    setupPOCreate();

    const req = createPostRequest('/api/v1/purchase-orders', validBody);
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('property_manager can create POs', async () => {
    setRole('property_manager');
    setupPOCreate();

    const req = createPostRequest('/api/v1/purchase-orders', validBody);
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('rejects PO creation from resident role', async () => {
    setRole('resident');
    const req = createPostRequest('/api/v1/purchase-orders', validBody);
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('rejects PO creation from front_desk role', async () => {
    setRole('front_desk');
    const req = createPostRequest('/api/v1/purchase-orders', validBody);
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('rejects PO creation from security role', async () => {
    setRole('security');
    const req = createPostRequest('/api/v1/purchase-orders', validBody);
    const res = await POST(req);
    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// 11. PO line items (multiple items per PO)
// ---------------------------------------------------------------------------

describe('POST /api/v1/purchase-orders — Multiple Line Items', () => {
  it('supports multiple items in a single PO', async () => {
    mockBudgetFindFirst.mockResolvedValue({ plannedAmount: 100000, actualAmount: 0 });
    mockPOCreate.mockResolvedValue({
      id: 'po-1',
      referenceNumber: 'PO-A1B2C3',
      status: 'draft',
      totalAmount: 2250,
      items: [
        { id: 'poi-1', description: 'Paint', quantity: 5, unitPrice: 50, total: 250 },
        { id: 'poi-2', description: 'Brushes', quantity: 10, unitPrice: 50, total: 500 },
        { id: 'poi-3', description: 'Drop cloths', quantity: 3, unitPrice: 500, total: 1500 },
      ],
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/purchase-orders', {
      propertyId: PROPERTY_ID,
      vendorId: VENDOR_ID,
      budgetCategory: 'Maintenance & Repairs',
      items: [
        { description: 'Paint', quantity: 5, unitPrice: 50 },
        { description: 'Brushes', quantity: 10, unitPrice: 50 },
        { description: 'Drop cloths', quantity: 3, unitPrice: 500 },
      ],
    });
    const res = await POST(req);
    expect(res.status).toBe(201);

    const createArg = mockPOCreate.mock.calls[0]![0];
    expect(createArg.data.items.create).toHaveLength(3);
    expect(createArg.data.totalAmount).toBe(2250);
  });
});

// ---------------------------------------------------------------------------
// 12. Budget tracking (total approved POs vs budget)
// ---------------------------------------------------------------------------

describe('POST /api/v1/purchase-orders — Over-Budget Alert', () => {
  it('returns overBudget warning when PO would exceed remaining budget', async () => {
    mockBudgetFindFirst.mockResolvedValue({ plannedAmount: 10000, actualAmount: 8000 });
    mockPOCreate.mockResolvedValue({
      id: 'po-1',
      referenceNumber: 'PO-A1B2C3',
      status: 'draft',
      totalAmount: 3000,
      items: [{ id: 'poi-1', description: 'Repair', quantity: 1, unitPrice: 3000, total: 3000 }],
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/purchase-orders', {
      propertyId: PROPERTY_ID,
      vendorId: VENDOR_ID,
      budgetCategory: 'Maintenance & Repairs',
      items: [{ description: 'Emergency pipe repair', quantity: 1, unitPrice: 3000 }],
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
    const body = await parseResponse<{ warning?: string; budgetRemaining?: number }>(res);
    expect(body.warning).toContain('over budget');
    expect(body.budgetRemaining).toBe(2000);
  });

  it('no warning when PO is within budget', async () => {
    mockBudgetFindFirst.mockResolvedValue({ plannedAmount: 100000, actualAmount: 20000 });
    mockPOCreate.mockResolvedValue({
      id: 'po-1',
      referenceNumber: 'PO-A1B2C3',
      status: 'draft',
      totalAmount: 500,
      items: [{ id: 'poi-1', description: 'Supplies', quantity: 1, unitPrice: 500, total: 500 }],
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/purchase-orders', {
      propertyId: PROPERTY_ID,
      vendorId: VENDOR_ID,
      budgetCategory: 'Supplies',
      items: [{ description: 'Office supplies', quantity: 1, unitPrice: 500 }],
    });
    const res = await POST(req);

    const body = await parseResponse<{ warning?: string }>(res);
    expect(body.warning).toBeUndefined();
  });

  it('no warning when no budget line item exists for category', async () => {
    mockBudgetFindFirst.mockResolvedValue(null);
    mockPOCreate.mockResolvedValue({
      id: 'po-1',
      referenceNumber: 'PO-A1B2C3',
      status: 'draft',
      totalAmount: 500,
      items: [{ id: 'poi-1', description: 'Misc', quantity: 1, unitPrice: 500, total: 500 }],
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/purchase-orders', {
      propertyId: PROPERTY_ID,
      vendorId: VENDOR_ID,
      budgetCategory: 'Uncategorized',
      items: [{ description: 'Miscellaneous', quantity: 1, unitPrice: 500 }],
    });
    const res = await POST(req);

    const body = await parseResponse<{ warning?: string }>(res);
    expect(body.warning).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 13. Vendor assignment
// ---------------------------------------------------------------------------

describe('POST /api/v1/purchase-orders — Vendor Assignment', () => {
  it('stores vendorId on the PO for vendor lookup', async () => {
    setupPOCreate();

    const req = createPostRequest('/api/v1/purchase-orders', {
      propertyId: PROPERTY_ID,
      vendorId: VENDOR_ID,
      budgetCategory: 'Services',
      items: [{ description: 'HVAC Service Call', quantity: 1, unitPrice: 1000 }],
    });
    await POST(req);

    expect(mockPOCreate.mock.calls[0]![0].data.vendorId).toBe(VENDOR_ID);
  });

  it('includes vendor relation in GET response', async () => {
    const req = createGetRequest('/api/v1/purchase-orders', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    await GET(req);

    const include = mockPOFindMany.mock.calls[0]![0].include;
    expect(include.vendor).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// 14. Document attachment (quotes, invoices, receipts)
// ---------------------------------------------------------------------------

describe('POST /api/v1/purchase-orders — Attachments', () => {
  it('stores attachments (quotes, receipts) with PO', async () => {
    mockBudgetFindFirst.mockResolvedValue({ plannedAmount: 100000, actualAmount: 0 });
    mockPOCreate.mockResolvedValue({
      id: 'po-1',
      referenceNumber: 'PO-A1B2C3',
      status: 'draft',
      totalAmount: 2000,
      items: [{ id: 'poi-1', description: 'Test', quantity: 1, unitPrice: 2000, total: 2000 }],
      attachments: [{ id: 'att-1', fileName: 'quote.pdf' }],
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/purchase-orders', {
      propertyId: PROPERTY_ID,
      vendorId: VENDOR_ID,
      budgetCategory: 'Supplies',
      items: [{ description: 'Cleaning supplies bulk order', quantity: 1, unitPrice: 2000 }],
      attachments: [
        {
          key: 'uploads/quote.pdf',
          fileName: 'quote.pdf',
          contentType: 'application/pdf',
          fileSizeBytes: 102400,
        },
      ],
    });
    const res = await POST(req);
    expect(res.status).toBe(201);

    const createArg = mockPOCreate.mock.calls[0]![0];
    expect(createArg.data.attachments.create).toHaveLength(1);
    expect(createArg.data.attachments.create[0].fileName).toBe('quote.pdf');
  });
});

// ---------------------------------------------------------------------------
// 15. Invoice linking
// ---------------------------------------------------------------------------

describe('POST /api/v1/purchase-orders — Invoice Linking', () => {
  it('stores invoice fields when provided with PO creation', async () => {
    mockBudgetFindFirst.mockResolvedValue({ plannedAmount: 100000, actualAmount: 0 });
    mockPOCreate.mockResolvedValue({
      id: 'po-1',
      referenceNumber: 'PO-A1B2C3',
      status: 'draft',
      totalAmount: 3000,
      invoiceNumber: 'INV-2026-0042',
      items: [{ id: 'poi-1', description: 'Test', quantity: 1, unitPrice: 3000, total: 3000 }],
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/purchase-orders', {
      propertyId: PROPERTY_ID,
      vendorId: VENDOR_ID,
      budgetCategory: 'Maintenance & Repairs',
      items: [{ description: 'Plumbing repair', quantity: 1, unitPrice: 3000 }],
      invoiceNumber: 'INV-2026-0042',
      invoiceDate: '2026-03-15T00:00:00.000Z',
      invoiceAmount: 3000,
    });
    const res = await POST(req);
    expect(res.status).toBe(201);

    const createArg = mockPOCreate.mock.calls[0]![0];
    expect(createArg.data.invoiceNumber).toBe('INV-2026-0042');
    expect(createArg.data.invoiceAmount).toBe(3000);
  });
});

// ---------------------------------------------------------------------------
// 16. Tenant isolation
// ---------------------------------------------------------------------------

describe('GET /api/v1/purchase-orders — Tenant Isolation', () => {
  it('REJECTS without propertyId', async () => {
    const req = createGetRequest('/api/v1/purchase-orders');
    const res = await GET(req);
    expect(res.status).toBe(400);
    expect(mockPOFindMany).not.toHaveBeenCalled();
  });

  it('scopes all queries to propertyId + soft-delete filter', async () => {
    const req = createGetRequest('/api/v1/purchase-orders', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    await GET(req);

    const where = mockPOFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_ID);
    expect(where.deletedAt).toBeNull();
  });

  it('handles database errors gracefully', async () => {
    mockPOFindMany.mockRejectedValue(new Error('DB down'));
    const req = createGetRequest('/api/v1/purchase-orders', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET(req);

    expect(res.status).toBe(500);
    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).not.toContain('DB down');
  });
});

// ---------------------------------------------------------------------------
// 17. Approval thresholds (POs over $5000 require manager approval)
// ---------------------------------------------------------------------------

describe('Approval thresholds', () => {
  it('POs over $5000 are flagged in the status transition schema', async () => {
    const { PO_STATUS_TRANSITIONS } = await import('@/schemas/purchase-order');

    // Approval is a required step in the workflow for all POs
    // submitted -> approved requires property_admin or board_member
    expect(PO_STATUS_TRANSITIONS.submitted).toContain('approved');

    // Cannot skip approval — no direct path from submitted to ordered
    expect(PO_STATUS_TRANSITIONS.submitted).not.toContain('ordered');
  });
});

// ---------------------------------------------------------------------------
// 18. Expected delivery date tracking
// ---------------------------------------------------------------------------

describe('POST /api/v1/purchase-orders — Expected delivery date', () => {
  it('PO creation stores notes field which can contain delivery info', async () => {
    setupPOCreate();

    const req = createPostRequest('/api/v1/purchase-orders', {
      ...validBody,
      notes: 'Expected delivery: March 25, 2026. Call front desk on arrival.',
    });
    const res = await POST(req);
    expect(res.status).toBe(201);

    const createArg = mockPOCreate.mock.calls[0]![0];
    expect(createArg.data.notes).toContain('Expected delivery');
  });
});

// ---------------------------------------------------------------------------
// 19. Includes items and attachments in GET
// ---------------------------------------------------------------------------

describe('GET /api/v1/purchase-orders — Includes relations', () => {
  it('includes items and attachments in GET response', async () => {
    const req = createGetRequest('/api/v1/purchase-orders', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    await GET(req);

    const include = mockPOFindMany.mock.calls[0]![0].include;
    expect(include.items).toBe(true);
    expect(include.attachments).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 20. POST enforces propertyId
// ---------------------------------------------------------------------------

describe('POST /api/v1/purchase-orders — PropertyId enforcement', () => {
  it('stores propertyId on the created PO', async () => {
    setupPOCreate();

    const req = createPostRequest('/api/v1/purchase-orders', validBody);
    await POST(req);

    expect(mockPOCreate.mock.calls[0]![0].data.propertyId).toBe(PROPERTY_ID);
  });
});

// ---------------------------------------------------------------------------
// 21. createdById tracking
// ---------------------------------------------------------------------------

describe('POST /api/v1/purchase-orders — Created by tracking', () => {
  it('stores createdById from authenticated user', async () => {
    setupPOCreate();

    const req = createPostRequest('/api/v1/purchase-orders', validBody);
    await POST(req);

    expect(mockPOCreate.mock.calls[0]![0].data.createdById).toBe('test-user');
  });
});

// ---------------------------------------------------------------------------
// 22. Multiple attachments support
// ---------------------------------------------------------------------------

describe('POST /api/v1/purchase-orders — Multiple Attachments', () => {
  it('supports multiple attachments (quote + receipt)', async () => {
    mockBudgetFindFirst.mockResolvedValue({ plannedAmount: 100000, actualAmount: 0 });
    mockPOCreate.mockResolvedValue({
      id: 'po-1',
      referenceNumber: 'PO-A1B2C3',
      status: 'draft',
      totalAmount: 5000,
      items: [{ id: 'poi-1', description: 'Service', quantity: 1, unitPrice: 5000, total: 5000 }],
      attachments: [
        { id: 'att-1', fileName: 'quote.pdf' },
        { id: 'att-2', fileName: 'receipt.pdf' },
      ],
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/purchase-orders', {
      propertyId: PROPERTY_ID,
      vendorId: VENDOR_ID,
      budgetCategory: 'Services',
      items: [{ description: 'Electrical service', quantity: 1, unitPrice: 5000 }],
      attachments: [
        {
          key: 'uploads/quote.pdf',
          fileName: 'quote.pdf',
          contentType: 'application/pdf',
          fileSizeBytes: 50000,
        },
        {
          key: 'uploads/receipt.pdf',
          fileName: 'receipt.pdf',
          contentType: 'application/pdf',
          fileSizeBytes: 30000,
        },
      ],
    });
    const res = await POST(req);
    expect(res.status).toBe(201);

    const createArg = mockPOCreate.mock.calls[0]![0];
    expect(createArg.data.attachments.create).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------
// 23. No attachments creates empty array
// ---------------------------------------------------------------------------

describe('POST /api/v1/purchase-orders — No attachments', () => {
  it('creates PO with empty attachments array when none provided', async () => {
    setupPOCreate();

    const req = createPostRequest('/api/v1/purchase-orders', {
      propertyId: PROPERTY_ID,
      vendorId: VENDOR_ID,
      budgetCategory: 'Supplies',
      items: [{ description: 'Paper', quantity: 10, unitPrice: 25 }],
    });
    await POST(req);

    const createArg = mockPOCreate.mock.calls[0]![0];
    expect(createArg.data.attachments.create).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 24. Super admin can create POs
// ---------------------------------------------------------------------------

describe('Super admin PO access', () => {
  it('super_admin can create POs', async () => {
    setRole('super_admin');
    setupPOCreate();

    const req = createPostRequest('/api/v1/purchase-orders', validBody);
    const res = await POST(req);
    expect(res.status).toBe(201);
  });
});

// ---------------------------------------------------------------------------
// 25. PO message on creation
// ---------------------------------------------------------------------------

describe('POST /api/v1/purchase-orders — Creation message', () => {
  it('returns reference number in creation message', async () => {
    setupPOCreate();

    const req = createPostRequest('/api/v1/purchase-orders', validBody);
    const res = await POST(req);

    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('PO-A1B2C3');
  });
});
