/**
 * PRD 21 — Demo Environment Comprehensive Tests
 *
 * Extended TDD coverage for demo environment creation, isolation,
 * auto-expiry, training sandbox, reset, template listing, usage tracking,
 * and delete/purge operations.
 *
 * These tests complement route.test.ts with additional edge-case coverage.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  createGetRequest,
  createPostRequest,
  createDeleteRequest,
  parseResponse,
} from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Mock Setup
// ---------------------------------------------------------------------------

const mockPropertyCreate = vi.fn();
const mockPropertyFindMany = vi.fn();
const mockPropertyFindUnique = vi.fn();
const mockPropertyDelete = vi.fn();
const mockPropertyUpdate = vi.fn();

const mockDemoTemplateFindMany = vi.fn();
const mockDemoTemplateFindUnique = vi.fn();

const mockDemoSessionCreate = vi.fn();
const mockDemoSessionFindMany = vi.fn();

const mockUserCreateMany = vi.fn();
const mockUnitCreateMany = vi.fn();
const mockPackageCreateMany = vi.fn();
const mockMaintenanceRequestCreateMany = vi.fn();
const mockVisitorEntryCreateMany = vi.fn();

const mockTransaction = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    property: {
      create: (...args: unknown[]) => mockPropertyCreate(...args),
      findMany: (...args: unknown[]) => mockPropertyFindMany(...args),
      findUnique: (...args: unknown[]) => mockPropertyFindUnique(...args),
      delete: (...args: unknown[]) => mockPropertyDelete(...args),
      update: (...args: unknown[]) => mockPropertyUpdate(...args),
    },
    demoTemplate: {
      findMany: (...args: unknown[]) => mockDemoTemplateFindMany(...args),
      findUnique: (...args: unknown[]) => mockDemoTemplateFindUnique(...args),
    },
    demoSession: {
      create: (...args: unknown[]) => mockDemoSessionCreate(...args),
      findMany: (...args: unknown[]) => mockDemoSessionFindMany(...args),
    },
    user: {
      createMany: (...args: unknown[]) => mockUserCreateMany(...args),
    },
    unit: {
      createMany: (...args: unknown[]) => mockUnitCreateMany(...args),
    },
    package: {
      createMany: (...args: unknown[]) => mockPackageCreateMany(...args),
    },
    maintenanceRequest: {
      createMany: (...args: unknown[]) => mockMaintenanceRequestCreateMany(...args),
    },
    visitorEntry: {
      createMany: (...args: unknown[]) => mockVisitorEntryCreateMany(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

let mockGuardRole = 'super_admin';
let mockGuardError: unknown = null;

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: vi.fn().mockImplementation(() => {
    if (mockGuardError) {
      return Promise.resolve({ user: null, error: mockGuardError });
    }
    return Promise.resolve({
      user: {
        userId: 'test-user-id',
        propertyId: '00000000-0000-4000-b000-000000000001',
        role: mockGuardRole,
        permissions: ['*'],
        mfaVerified: true,
      },
      error: null,
    });
  }),
}));

import { GET, POST } from '../route';
import { GET as GET_BY_ID, DELETE } from '../[id]/route';
import { POST as RESET_POST } from '../[id]/reset/route';
import { GET as GET_TEMPLATES } from '../templates/route';

const PROPERTY_ID = '00000000-0000-4000-b000-000000000001';
const DEMO_PROPERTY_ID = '00000000-0000-4000-b000-demo00000001';

beforeEach(() => {
  vi.clearAllMocks();
  mockGuardRole = 'super_admin';
  mockGuardError = null;
});

// ---------------------------------------------------------------------------
// 1. Create demo with template selection — advanced scenarios
// ---------------------------------------------------------------------------

describe('Create Demo — Template Selection (Comprehensive)', () => {
  it('creates demo with each available template type', async () => {
    const templates = ['luxury_condo', 'suburban_townhouse', 'high_rise'];

    for (const slug of templates) {
      vi.clearAllMocks();
      mockDemoTemplateFindUnique.mockResolvedValue({
        id: `template-${slug}`,
        name: slug.replace(/_/g, ' '),
        slug,
        dataSpec: { units: 20, users: 10, packages: 15, maintenanceRequests: 10, visitors: 12 },
        isActive: true,
      });

      mockTransaction.mockResolvedValue({
        id: `demo-${slug}`,
        name: `${slug} Demo`,
        type: 'DEMO',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdFromTemplate: slug,
        demoTemplateId: `template-${slug}`,
        notificationSuppressed: true,
      });

      const req = createPostRequest('/api/v1/demo', {
        templateSlug: slug,
        label: `Test ${slug}`,
        purpose: 'sales_demo',
      });
      const res = await POST(req);
      expect(res.status).toBe(201);
      const body = await parseResponse<{ data: { createdFromTemplate: string } }>(res);
      expect(body.data.createdFromTemplate).toBe(slug);
    }
  });

  it('sets notificationSuppressed=true to prevent real notifications', async () => {
    mockDemoTemplateFindUnique.mockResolvedValue({
      id: 'template-1',
      name: 'Luxury Condo',
      slug: 'luxury_condo',
      dataSpec: { units: 25 },
      isActive: true,
    });

    mockTransaction.mockResolvedValue({
      id: DEMO_PROPERTY_ID,
      name: 'Luxury Condo Demo',
      type: 'DEMO',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      notificationSuppressed: true,
      createdFromTemplate: 'luxury_condo',
      demoTemplateId: 'template-1',
    });

    const req = createPostRequest('/api/v1/demo', {
      templateSlug: 'luxury_condo',
      label: 'Notification test',
      purpose: 'sales_demo',
    });
    const res = await POST(req);
    const body = await parseResponse<{ data: { notificationSuppressed: boolean } }>(res);
    expect(body.data.notificationSuppressed).toBe(true);
  });

  it('rejects non-string templateSlug values', async () => {
    const req = createPostRequest('/api/v1/demo', {
      templateSlug: 12345,
      label: 'Bad Type',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });
});

// ---------------------------------------------------------------------------
// 2. Demo isolation — separate propertyId guarantees
// ---------------------------------------------------------------------------

describe('Demo Isolation (Comprehensive)', () => {
  it('demo propertyId is always distinct from production propertyId', async () => {
    mockDemoTemplateFindUnique.mockResolvedValue({
      id: 'template-1',
      name: 'Luxury Condo',
      slug: 'luxury_condo',
      dataSpec: { units: 25 },
      isActive: true,
    });

    const demoIds = new Set<string>();
    for (let i = 0; i < 3; i++) {
      mockTransaction.mockResolvedValue({
        id: `demo-unique-${i}`,
        name: 'Demo',
        type: 'DEMO',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdFromTemplate: 'luxury_condo',
        demoTemplateId: 'template-1',
        notificationSuppressed: true,
      });

      const req = createPostRequest('/api/v1/demo', {
        templateSlug: 'luxury_condo',
        label: `Isolation ${i}`,
        purpose: 'sales_demo',
      });
      const res = await POST(req);
      const body = await parseResponse<{ data: { id: string } }>(res);
      demoIds.add(body.data.id);
      expect(body.data.id).not.toBe(PROPERTY_ID);
    }
    // Each demo gets its own unique ID
    expect(demoIds.size).toBe(3);
  });

  it('GET /demo excludes production properties via type filter', async () => {
    mockPropertyFindMany.mockResolvedValue([]);

    const req = createGetRequest('/api/v1/demo');
    await GET(req);

    const queryArgs = mockPropertyFindMany.mock.calls[0]![0];
    const typeFilter = queryArgs.where.type;
    expect(typeFilter.in).toContain('DEMO');
    expect(typeFilter.in).toContain('TRAINING');
    expect(typeFilter.in).not.toContain('PRODUCTION');
  });
});

// ---------------------------------------------------------------------------
// 3. Auto-expiry after 7 days
// ---------------------------------------------------------------------------

describe('Auto-Expiry After 7 Days (Comprehensive)', () => {
  it('GET listing only returns non-expired demos (expiresAt > now)', async () => {
    mockPropertyFindMany.mockResolvedValue([]);

    const req = createGetRequest('/api/v1/demo');
    await GET(req);

    const where = mockPropertyFindMany.mock.calls[0]![0].where;
    expect(where.expiresAt).toBeDefined();
    expect(where.expiresAt.gt).toBeInstanceOf(Date);
  });

  it('newly created demo expiresAt is exactly 7 days from now', async () => {
    mockDemoTemplateFindUnique.mockResolvedValue({
      id: 'template-1',
      name: 'T',
      slug: 'luxury_condo',
      dataSpec: { units: 5 },
      isActive: true,
    });

    // Capture the transaction callback to inspect expiresAt
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const mockTx = {
        property: {
          create: (args: { data: Record<string, unknown> }) => {
            const expiresAt = args.data.expiresAt as Date;
            const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
            const diff = expiresAt.getTime() - Date.now();
            // Should be within 5 seconds of 7 days
            expect(diff).toBeGreaterThan(sevenDaysMs - 5000);
            expect(diff).toBeLessThanOrEqual(sevenDaysMs + 5000);
            return {
              id: DEMO_PROPERTY_ID,
              name: 'T Demo',
              type: 'DEMO',
              expiresAt,
              createdFromTemplate: 'luxury_condo',
              demoTemplateId: 'template-1',
              notificationSuppressed: true,
            };
          },
        },
      };
      return fn(mockTx);
    });

    const req = createPostRequest('/api/v1/demo', {
      templateSlug: 'luxury_condo',
      purpose: 'sales_demo',
    });
    await POST(req);
    expect(mockTransaction).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// 4. Training sandbox mode
// ---------------------------------------------------------------------------

describe('Training Sandbox Mode (Comprehensive)', () => {
  it('sets type=TRAINING and maxTrainees when purpose=training', async () => {
    mockDemoTemplateFindUnique.mockResolvedValue({
      id: 'template-2',
      name: 'Suburban',
      slug: 'suburban_townhouse',
      dataSpec: { units: 20 },
      isActive: true,
    });

    mockTransaction.mockResolvedValue({
      id: 'training-id',
      name: 'Suburban Demo',
      type: 'TRAINING',
      maxTrainees: 5,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdFromTemplate: 'suburban_townhouse',
      demoTemplateId: 'template-2',
      notificationSuppressed: true,
    });

    const req = createPostRequest('/api/v1/demo', {
      templateSlug: 'suburban_townhouse',
      purpose: 'training',
      maxTrainees: 5,
      label: 'Onboarding Week',
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const body = await parseResponse<{ data: { type: string; maxTrainees: number } }>(res);
    expect(body.data.type).toBe('TRAINING');
    expect(body.data.maxTrainees).toBe(5);
  });

  it('property_manager can create training environments', async () => {
    mockGuardRole = 'property_manager';

    mockDemoTemplateFindUnique.mockResolvedValue({
      id: 'template-1',
      name: 'T',
      slug: 'luxury_condo',
      dataSpec: { units: 10 },
      isActive: true,
    });

    mockTransaction.mockResolvedValue({
      id: 'pm-training',
      name: 'T Demo',
      type: 'TRAINING',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdFromTemplate: 'luxury_condo',
      demoTemplateId: 'template-1',
      notificationSuppressed: true,
    });

    const req = createPostRequest('/api/v1/demo', {
      templateSlug: 'luxury_condo',
      purpose: 'training',
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('security_guard role cannot create demo environments', async () => {
    mockGuardRole = 'security_guard';

    const req = createPostRequest('/api/v1/demo', {
      templateSlug: 'luxury_condo',
      purpose: 'training',
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// 5. Reset to initial state
// ---------------------------------------------------------------------------

describe('Reset to Initial State (Comprehensive)', () => {
  it('reset requires the original template to still exist', async () => {
    mockPropertyFindUnique.mockResolvedValue({
      id: DEMO_PROPERTY_ID,
      name: 'Demo',
      type: 'DEMO',
      createdFromTemplate: 'luxury_condo',
      demoTemplateId: 'template-deleted',
      expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    });

    mockDemoTemplateFindUnique.mockResolvedValue(null);

    const req = createPostRequest(`/api/v1/demo/${DEMO_PROPERTY_ID}/reset`, {});
    const res = await RESET_POST(req, {
      params: Promise.resolve({ id: DEMO_PROPERTY_ID }),
    });
    expect(res.status).toBe(404);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('TEMPLATE_NOT_FOUND');
  });

  it('TRAINING type demos can also be reset', async () => {
    mockPropertyFindUnique.mockResolvedValue({
      id: 'training-demo',
      name: 'Training Env',
      type: 'TRAINING',
      createdFromTemplate: 'high_rise',
      demoTemplateId: 'template-3',
      expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    });

    mockDemoTemplateFindUnique.mockResolvedValue({
      id: 'template-3',
      name: 'High Rise',
      slug: 'high_rise',
      dataSpec: { units: 60 },
      isActive: true,
    });

    mockTransaction.mockResolvedValue({
      id: 'training-demo',
      name: 'Training Env',
      type: 'TRAINING',
      resetAt: new Date(),
      resetCount: 1,
    });

    const req = createPostRequest('/api/v1/demo/training-demo/reset', {});
    const res = await RESET_POST(req, {
      params: Promise.resolve({ id: 'training-demo' }),
    });
    expect(res.status).toBe(200);
    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('reset');
  });
});

// ---------------------------------------------------------------------------
// 6. Template listing
// ---------------------------------------------------------------------------

describe('Template Listing (Comprehensive)', () => {
  it('templates include dataSpec with unit/user/package counts', async () => {
    mockDemoTemplateFindMany.mockResolvedValue([
      {
        id: 'template-1',
        name: 'Luxury Condo',
        slug: 'luxury_condo',
        description: 'Downtown luxury condo',
        dataSpec: { units: 25, users: 12, packages: 30, maintenanceRequests: 15, visitors: 20 },
        isActive: true,
      },
    ]);

    const req = createGetRequest('/api/v1/demo/templates');
    const res = await GET_TEMPLATES(req);
    const body = await parseResponse<{
      data: Array<{ dataSpec: Record<string, number> }>;
    }>(res);

    expect(body.data[0]!.dataSpec.units).toBeGreaterThan(0);
    expect(body.data[0]!.dataSpec.users).toBeGreaterThan(0);
  });

  it('templates are sorted alphabetically by name', async () => {
    mockDemoTemplateFindMany.mockResolvedValue([
      { id: '1', name: 'Alpha', slug: 'alpha', isActive: true },
      { id: '2', name: 'Beta', slug: 'beta', isActive: true },
      { id: '3', name: 'Gamma', slug: 'gamma', isActive: true },
    ]);

    const req = createGetRequest('/api/v1/demo/templates');
    await GET_TEMPLATES(req);

    const orderBy = mockDemoTemplateFindMany.mock.calls[0]![0].orderBy;
    expect(orderBy).toEqual({ name: 'asc' });
  });

  it('returns empty array when no active templates exist', async () => {
    mockDemoTemplateFindMany.mockResolvedValue([]);

    const req = createGetRequest('/api/v1/demo/templates');
    const res = await GET_TEMPLATES(req);
    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: unknown[] }>(res);
    expect(body.data).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 7. Usage tracking
// ---------------------------------------------------------------------------

describe('Usage Tracking (Comprehensive)', () => {
  it('demo creation assigns the creating user as assignedSalesRepId', async () => {
    mockDemoTemplateFindUnique.mockResolvedValue({
      id: 'template-1',
      name: 'T',
      slug: 'luxury_condo',
      dataSpec: { units: 5 },
      isActive: true,
    });

    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const mockTx = {
        property: {
          create: (args: { data: Record<string, unknown> }) => {
            // Verify the sales rep is recorded
            expect(args.data.assignedSalesRepId).toBe('test-user-id');
            return {
              id: DEMO_PROPERTY_ID,
              ...args.data,
              name: 'T Demo',
            };
          },
        },
      };
      return fn(mockTx);
    });

    const req = createPostRequest('/api/v1/demo', {
      templateSlug: 'luxury_condo',
      label: 'Tracking test',
      purpose: 'sales_demo',
    });
    await POST(req);
    expect(mockTransaction).toHaveBeenCalled();
  });

  it('demo response includes purpose field for tracking', async () => {
    mockDemoTemplateFindUnique.mockResolvedValue({
      id: 'template-1',
      name: 'T',
      slug: 'luxury_condo',
      dataSpec: { units: 5 },
      isActive: true,
    });

    mockTransaction.mockResolvedValue({
      id: DEMO_PROPERTY_ID,
      name: 'T Demo',
      type: 'DEMO',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdFromTemplate: 'luxury_condo',
      demoTemplateId: 'template-1',
      notificationSuppressed: true,
    });

    const req = createPostRequest('/api/v1/demo', {
      templateSlug: 'luxury_condo',
      purpose: 'sales_demo',
    });
    const res = await POST(req);
    const body = await parseResponse<{ data: { purpose: string } }>(res);
    expect(body.data.purpose).toBe('sales_demo');
  });
});

// ---------------------------------------------------------------------------
// 8. Delete and purge
// ---------------------------------------------------------------------------

describe('Delete and Purge (Comprehensive)', () => {
  it('delete uses a transaction to cascade-remove all associated data', async () => {
    mockPropertyFindUnique.mockResolvedValue({
      id: DEMO_PROPERTY_ID,
      name: 'Demo to Purge',
      type: 'DEMO',
      expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    });

    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const mockTx = {
        property: {
          delete: vi.fn().mockResolvedValue({ id: DEMO_PROPERTY_ID }),
        },
      };
      await fn(mockTx);
      // Verify the transaction callback invoked property.delete
      expect(mockTx.property.delete).toHaveBeenCalledWith({
        where: { id: DEMO_PROPERTY_ID },
      });
      return { deleted: true };
    });

    const req = createDeleteRequest(`/api/v1/demo/${DEMO_PROPERTY_ID}`);
    const res = await DELETE(req, {
      params: Promise.resolve({ id: DEMO_PROPERTY_ID }),
    });
    expect(res.status).toBe(200);
  });

  it('delete response message includes the demo name', async () => {
    mockPropertyFindUnique.mockResolvedValue({
      id: DEMO_PROPERTY_ID,
      name: 'Acme Corp Demo',
      type: 'DEMO',
    });

    mockTransaction.mockResolvedValue({ deleted: true });

    const req = createDeleteRequest(`/api/v1/demo/${DEMO_PROPERTY_ID}`);
    const res = await DELETE(req, {
      params: Promise.resolve({ id: DEMO_PROPERTY_ID }),
    });
    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('Acme Corp Demo');
    expect(body.message).toContain('deleted');
  });

  it('handles database errors during delete gracefully', async () => {
    mockPropertyFindUnique.mockResolvedValue({
      id: DEMO_PROPERTY_ID,
      name: 'Error Demo',
      type: 'DEMO',
    });

    mockTransaction.mockRejectedValue(new Error('FK constraint failed'));

    const req = createDeleteRequest(`/api/v1/demo/${DEMO_PROPERTY_ID}`);
    const res = await DELETE(req, {
      params: Promise.resolve({ id: DEMO_PROPERTY_ID }),
    });
    expect(res.status).toBe(500);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('INTERNAL_ERROR');
  });

  it('delete of TRAINING type is also allowed', async () => {
    mockPropertyFindUnique.mockResolvedValue({
      id: 'training-1',
      name: 'Training Env',
      type: 'TRAINING',
    });

    mockTransaction.mockResolvedValue({ deleted: true });

    const req = createDeleteRequest('/api/v1/demo/training-1');
    const res = await DELETE(req, {
      params: Promise.resolve({ id: 'training-1' }),
    });
    expect(res.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// 9. Error handling for GET /demo
// ---------------------------------------------------------------------------

describe('GET /demo — Error Handling', () => {
  it('returns 500 when database query fails', async () => {
    mockPropertyFindMany.mockRejectedValue(new Error('Connection refused'));

    const req = createGetRequest('/api/v1/demo');
    const res = await GET(req);
    expect(res.status).toBe(500);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('INTERNAL_ERROR');
  });
});

// ---------------------------------------------------------------------------
// 10. GET /demo/:id — detail view edge cases
// ---------------------------------------------------------------------------

describe('GET /demo/:id — Detail View (Comprehensive)', () => {
  it('returns 404 for non-existent demo', async () => {
    mockPropertyFindUnique.mockResolvedValue(null);

    const req = createGetRequest('/api/v1/demo/non-existent');
    const res = await GET_BY_ID(req, {
      params: Promise.resolve({ id: 'non-existent' }),
    });
    expect(res.status).toBe(404);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('NOT_FOUND');
  });

  it('includes demoSessions in the detail response', async () => {
    mockPropertyFindUnique.mockResolvedValue({
      id: DEMO_PROPERTY_ID,
      name: 'Demo',
      type: 'DEMO',
      demoLabel: 'Test',
      expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      createdFromTemplate: 'luxury_condo',
      demoSessions: [
        { id: 's1', userId: 'u1', effectiveRole: 'front_desk', startedAt: new Date() },
      ],
    });

    const req = createGetRequest(`/api/v1/demo/${DEMO_PROPERTY_ID}`);
    const res = await GET_BY_ID(req, {
      params: Promise.resolve({ id: DEMO_PROPERTY_ID }),
    });
    expect(res.status).toBe(200);
    const body = await parseResponse<{
      data: { demoSessions: Array<{ id: string }> };
    }>(res);
    expect(body.data.demoSessions).toHaveLength(1);
  });
});
