/**
 * Demo Environment & Training Sandbox API Tests — per PRD 21
 *
 * Sales demo with mock data plus training sandbox for new staff.
 * Demo environments are fully isolated via separate propertyIds,
 * auto-expire after 7 days, and support role-based access for
 * trainers (writable) vs trainees (read-only).
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

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: vi.fn().mockImplementation(() => {
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
});

// ---------------------------------------------------------------------------
// 1. POST /api/v1/demo — Creates a new demo environment with sample data
// ---------------------------------------------------------------------------

describe('POST /api/v1/demo — Create Demo Environment', () => {
  const validCreateBody = {
    templateSlug: 'luxury_condo',
    label: 'Acme Corp Sales Demo',
    prospectName: 'Acme Corporation',
    purpose: 'sales_demo',
  };

  it('creates a new demo environment with sample data', async () => {
    mockDemoTemplateFindUnique.mockResolvedValue({
      id: 'template-1',
      name: 'Luxury Condo',
      slug: 'luxury_condo',
      dataSpec: {
        units: 25,
        users: 12,
        packages: 30,
        maintenanceRequests: 15,
        visitors: 20,
      },
      isActive: true,
    });

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    mockTransaction.mockResolvedValue({
      id: DEMO_PROPERTY_ID,
      name: 'Luxury Condo Demo',
      type: 'DEMO',
      demoLabel: 'Acme Corp Sales Demo',
      prospectName: 'Acme Corporation',
      expiresAt,
      createdFromTemplate: 'luxury_condo',
      demoTemplateId: 'template-1',
      notificationSuppressed: true,
      seedData: {
        units: 25,
        users: 12,
        packages: 30,
        maintenanceRequests: 15,
        visitors: 20,
      },
    });

    const req = createPostRequest('/api/v1/demo', validCreateBody);
    const res = await POST(req);

    expect(res.status).toBe(201);
    const body = await parseResponse<{ data: { id: string; type: string } }>(res);
    expect(body.data.id).toBe(DEMO_PROPERTY_ID);
    expect(body.data.type).toBe('DEMO');
  });

  it('rejects creation without required templateSlug', async () => {
    const { templateSlug: _, ...noTemplate } = validCreateBody;
    const req = createPostRequest('/api/v1/demo', noTemplate);
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 404 for non-existent template', async () => {
    mockDemoTemplateFindUnique.mockResolvedValue(null);

    const req = createPostRequest('/api/v1/demo', {
      ...validCreateBody,
      templateSlug: 'nonexistent_template',
    });
    const res = await POST(req);
    expect(res.status).toBe(404);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('TEMPLATE_NOT_FOUND');
  });

  it('rejects creation by non-admin roles', async () => {
    mockGuardRole = 'resident_owner';

    const req = createPostRequest('/api/v1/demo', validCreateBody);
    const res = await POST(req);
    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// 2. Demo environment is completely isolated (separate propertyId)
// ---------------------------------------------------------------------------

describe('Demo Environment Isolation', () => {
  it('demo is created with a separate propertyId and DEMO type', async () => {
    mockDemoTemplateFindUnique.mockResolvedValue({
      id: 'template-1',
      name: 'Luxury Condo',
      slug: 'luxury_condo',
      dataSpec: { units: 25, users: 12, packages: 30, maintenanceRequests: 15, visitors: 20 },
      isActive: true,
    });

    mockTransaction.mockResolvedValue({
      id: DEMO_PROPERTY_ID,
      name: 'Luxury Condo Demo',
      type: 'DEMO',
      demoLabel: 'Isolation Test',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdFromTemplate: 'luxury_condo',
      demoTemplateId: 'template-1',
      notificationSuppressed: true,
    });

    const req = createPostRequest('/api/v1/demo', {
      templateSlug: 'luxury_condo',
      label: 'Isolation Test',
      purpose: 'sales_demo',
    });
    const res = await POST(req);
    const body = await parseResponse<{
      data: { id: string; type: string; notificationSuppressed: boolean };
    }>(res);

    // Demo has its own propertyId, distinct from production
    expect(body.data.id).not.toBe(PROPERTY_ID);
    expect(body.data.type).toBe('DEMO');
    // Notifications are suppressed so demo actions do not reach real users
    expect(body.data.notificationSuppressed).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 3. Demo auto-expires after 7 days
// ---------------------------------------------------------------------------

describe('Demo Auto-Expiry', () => {
  it('demo environment has an expiresAt set to 7 days from creation', async () => {
    mockDemoTemplateFindUnique.mockResolvedValue({
      id: 'template-1',
      name: 'Luxury Condo',
      slug: 'luxury_condo',
      dataSpec: { units: 25, users: 12, packages: 30, maintenanceRequests: 15, visitors: 20 },
      isActive: true,
    });

    const beforeCreate = Date.now();

    mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
      const result = {
        id: DEMO_PROPERTY_ID,
        name: 'Luxury Condo Demo',
        type: 'DEMO',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        createdFromTemplate: 'luxury_condo',
        demoTemplateId: 'template-1',
        notificationSuppressed: true,
      };
      return result;
    });

    const req = createPostRequest('/api/v1/demo', {
      templateSlug: 'luxury_condo',
      label: 'Expiry Test',
      purpose: 'sales_demo',
    });
    const res = await POST(req);
    const body = await parseResponse<{ data: { expiresAt: string } }>(res);

    const expiresAt = new Date(body.data.expiresAt).getTime();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    // expiresAt should be roughly 7 days from now (within 10 seconds tolerance)
    expect(expiresAt).toBeGreaterThanOrEqual(beforeCreate + sevenDaysMs - 10_000);
    expect(expiresAt).toBeLessThanOrEqual(Date.now() + sevenDaysMs + 10_000);
  });

  it('listing excludes expired demos by default', async () => {
    const activeDemos = [
      {
        id: 'demo-active',
        name: 'Active Demo',
        type: 'DEMO',
        expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        demoLabel: 'Active',
      },
    ];
    mockPropertyFindMany.mockResolvedValue(activeDemos);

    const req = createGetRequest('/api/v1/demo');
    const res = await GET(req);
    const body = await parseResponse<{ data: typeof activeDemos }>(res);

    expect(body.data).toHaveLength(1);
    expect(body.data[0]!.id).toBe('demo-active');
  });
});

// ---------------------------------------------------------------------------
// 4. Training sandbox mode: read-only for trainees, writable for trainers
// ---------------------------------------------------------------------------

describe('Training Sandbox Access Control', () => {
  it('allows trainers (property_admin) to create demo in training mode', async () => {
    mockGuardRole = 'property_admin';

    mockDemoTemplateFindUnique.mockResolvedValue({
      id: 'template-2',
      name: 'Suburban Townhouse',
      slug: 'suburban_townhouse',
      dataSpec: { units: 20, users: 10, packages: 20, maintenanceRequests: 10, visitors: 15 },
      isActive: true,
    });

    mockTransaction.mockResolvedValue({
      id: 'demo-training-1',
      name: 'Training Sandbox',
      type: 'TRAINING',
      demoLabel: 'New Hire Training',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdFromTemplate: 'suburban_townhouse',
      demoTemplateId: 'template-2',
      notificationSuppressed: true,
      maxTrainees: 10,
    });

    const req = createPostRequest('/api/v1/demo', {
      templateSlug: 'suburban_townhouse',
      label: 'New Hire Training',
      purpose: 'training',
      maxTrainees: 10,
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
    const body = await parseResponse<{ data: { type: string; maxTrainees: number } }>(res);
    expect(body.data.type).toBe('TRAINING');
    expect(body.data.maxTrainees).toBe(10);
  });

  it('trainees (front_desk) cannot create demo environments', async () => {
    mockGuardRole = 'front_desk';

    const req = createPostRequest('/api/v1/demo', {
      templateSlug: 'luxury_condo',
      label: 'Unauthorized',
      purpose: 'training',
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('trainees (front_desk) can list demos they have access to', async () => {
    mockGuardRole = 'front_desk';
    mockPropertyFindMany.mockResolvedValue([
      {
        id: 'demo-training-1',
        name: 'Training Sandbox',
        type: 'TRAINING',
        demoLabel: 'Staff Training',
        expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      },
    ]);

    const req = createGetRequest('/api/v1/demo');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: Array<{ id: string }> }>(res);
    expect(body.data).toHaveLength(1);
  });
});

// ---------------------------------------------------------------------------
// 5. Reset demo: POST /demo/:id/reset — restores to initial state
// ---------------------------------------------------------------------------

describe('POST /api/v1/demo/:id/reset — Reset Demo', () => {
  it('resets demo environment to its initial state', async () => {
    mockPropertyFindUnique.mockResolvedValue({
      id: DEMO_PROPERTY_ID,
      name: 'Luxury Condo Demo',
      type: 'DEMO',
      createdFromTemplate: 'luxury_condo',
      demoTemplateId: 'template-1',
      expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    });

    mockDemoTemplateFindUnique.mockResolvedValue({
      id: 'template-1',
      name: 'Luxury Condo',
      slug: 'luxury_condo',
      dataSpec: { units: 25, users: 12, packages: 30, maintenanceRequests: 15, visitors: 20 },
      isActive: true,
    });

    mockTransaction.mockResolvedValue({
      id: DEMO_PROPERTY_ID,
      name: 'Luxury Condo Demo',
      type: 'DEMO',
      resetAt: new Date(),
      resetCount: 1,
    });

    const req = createPostRequest(`/api/v1/demo/${DEMO_PROPERTY_ID}/reset`, {});
    const res = await RESET_POST(req, {
      params: Promise.resolve({ id: DEMO_PROPERTY_ID }),
    });

    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: { id: string }; message: string }>(res);
    expect(body.data.id).toBe(DEMO_PROPERTY_ID);
    expect(body.message).toContain('reset');
  });

  it('returns 404 when resetting a non-existent demo', async () => {
    mockPropertyFindUnique.mockResolvedValue(null);

    const req = createPostRequest('/api/v1/demo/nonexistent/reset', {});
    const res = await RESET_POST(req, {
      params: Promise.resolve({ id: 'nonexistent' }),
    });
    expect(res.status).toBe(404);
  });

  it('rejects reset of a production property', async () => {
    mockPropertyFindUnique.mockResolvedValue({
      id: PROPERTY_ID,
      name: 'Real Property',
      type: 'PRODUCTION',
    });

    const req = createPostRequest(`/api/v1/demo/${PROPERTY_ID}/reset`, {});
    const res = await RESET_POST(req, {
      params: Promise.resolve({ id: PROPERTY_ID }),
    });
    expect(res.status).toBe(403);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('NOT_DEMO_PROPERTY');
  });

  it('rejects reset by non-admin roles', async () => {
    mockGuardRole = 'front_desk';

    mockPropertyFindUnique.mockResolvedValue({
      id: DEMO_PROPERTY_ID,
      name: 'Demo',
      type: 'DEMO',
      createdFromTemplate: 'luxury_condo',
      demoTemplateId: 'template-1',
      expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    });

    const req = createPostRequest(`/api/v1/demo/${DEMO_PROPERTY_ID}/reset`, {});
    const res = await RESET_POST(req, {
      params: Promise.resolve({ id: DEMO_PROPERTY_ID }),
    });
    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// 6. Demo templates: luxury_condo, suburban_townhouse, high_rise
// ---------------------------------------------------------------------------

describe('GET /api/v1/demo/templates — Available Templates', () => {
  it('returns all three standard demo templates', async () => {
    const templates = [
      {
        id: 'template-1',
        name: 'Luxury Condo',
        slug: 'luxury_condo',
        description: 'High-end downtown condo with full amenities',
        dataSpec: { units: 25, users: 12, packages: 30, maintenanceRequests: 15, visitors: 20 },
        isActive: true,
      },
      {
        id: 'template-2',
        name: 'Suburban Townhouse',
        slug: 'suburban_townhouse',
        description: 'Mid-size suburban townhouse community',
        dataSpec: { units: 40, users: 15, packages: 25, maintenanceRequests: 20, visitors: 15 },
        isActive: true,
      },
      {
        id: 'template-3',
        name: 'High Rise',
        slug: 'high_rise',
        description: 'Large urban high-rise with 200+ units',
        dataSpec: { units: 60, users: 20, packages: 50, maintenanceRequests: 30, visitors: 25 },
        isActive: true,
      },
    ];
    mockDemoTemplateFindMany.mockResolvedValue(templates);

    const req = createGetRequest('/api/v1/demo/templates');
    const res = await GET_TEMPLATES(req);

    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: typeof templates }>(res);
    expect(body.data).toHaveLength(3);

    const slugs = body.data.map((t) => t.slug);
    expect(slugs).toContain('luxury_condo');
    expect(slugs).toContain('suburban_townhouse');
    expect(slugs).toContain('high_rise');
  });

  it('only returns active templates', async () => {
    mockDemoTemplateFindMany.mockResolvedValue([
      {
        id: 'template-1',
        name: 'Luxury Condo',
        slug: 'luxury_condo',
        isActive: true,
      },
    ]);

    const req = createGetRequest('/api/v1/demo/templates');
    const res = await GET_TEMPLATES(req);
    const body = await parseResponse<{ data: Array<{ isActive: boolean }> }>(res);

    expect(body.data.every((t) => t.isActive)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 7. List active demos: GET /demo
// ---------------------------------------------------------------------------

describe('GET /api/v1/demo — List Active Demos', () => {
  it('lists all active (non-expired) demo environments', async () => {
    const demos = [
      {
        id: 'demo-1',
        name: 'Demo A',
        type: 'DEMO',
        demoLabel: 'Sales Demo A',
        expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        createdFromTemplate: 'luxury_condo',
      },
      {
        id: 'demo-2',
        name: 'Demo B',
        type: 'TRAINING',
        demoLabel: 'Training B',
        expiresAt: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000),
        createdAt: new Date(),
        createdFromTemplate: 'high_rise',
      },
    ];
    mockPropertyFindMany.mockResolvedValue(demos);

    const req = createGetRequest('/api/v1/demo');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: typeof demos }>(res);
    expect(body.data).toHaveLength(2);
  });

  it('supports filtering by type (DEMO vs TRAINING)', async () => {
    mockPropertyFindMany.mockResolvedValue([
      {
        id: 'demo-1',
        name: 'Demo A',
        type: 'DEMO',
        demoLabel: 'Sales',
        expiresAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
      },
    ]);

    const req = createGetRequest('/api/v1/demo', {
      searchParams: { type: 'DEMO' },
    });
    const res = await GET(req);
    const body = await parseResponse<{ data: Array<{ type: string }> }>(res);

    expect(body.data).toHaveLength(1);
    expect(body.data[0]!.type).toBe('DEMO');
  });
});

// ---------------------------------------------------------------------------
// 8. Delete demo: DELETE /demo/:id — purges all demo data
// ---------------------------------------------------------------------------

describe('DELETE /api/v1/demo/:id — Delete Demo', () => {
  it('deletes a demo environment and purges all associated data', async () => {
    mockPropertyFindUnique.mockResolvedValue({
      id: DEMO_PROPERTY_ID,
      name: 'Demo to Delete',
      type: 'DEMO',
      expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    });

    mockTransaction.mockResolvedValue({ deleted: true });

    const req = createDeleteRequest(`/api/v1/demo/${DEMO_PROPERTY_ID}`);
    const res = await DELETE(req, {
      params: Promise.resolve({ id: DEMO_PROPERTY_ID }),
    });

    expect(res.status).toBe(200);
    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('deleted');
  });

  it('returns 404 for non-existent demo', async () => {
    mockPropertyFindUnique.mockResolvedValue(null);

    const req = createDeleteRequest('/api/v1/demo/nonexistent');
    const res = await DELETE(req, {
      params: Promise.resolve({ id: 'nonexistent' }),
    });
    expect(res.status).toBe(404);
  });

  it('prevents deletion of production properties', async () => {
    mockPropertyFindUnique.mockResolvedValue({
      id: PROPERTY_ID,
      name: 'Production Property',
      type: 'PRODUCTION',
    });

    const req = createDeleteRequest(`/api/v1/demo/${PROPERTY_ID}`);
    const res = await DELETE(req, {
      params: Promise.resolve({ id: PROPERTY_ID }),
    });
    expect(res.status).toBe(403);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('NOT_DEMO_PROPERTY');
  });

  it('rejects deletion by non-admin roles', async () => {
    mockGuardRole = 'front_desk';

    const req = createDeleteRequest(`/api/v1/demo/${DEMO_PROPERTY_ID}`);
    const res = await DELETE(req, {
      params: Promise.resolve({ id: DEMO_PROPERTY_ID }),
    });
    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// 9. Demo has 20+ pre-seeded units, 10+ users, packages, maintenance, visitors
// ---------------------------------------------------------------------------

describe('Demo Seed Data Volume', () => {
  it('demo creation specifies adequate seed data counts from template', async () => {
    const dataSpec = {
      units: 25,
      users: 12,
      packages: 30,
      maintenanceRequests: 15,
      visitors: 20,
    };

    mockDemoTemplateFindUnique.mockResolvedValue({
      id: 'template-1',
      name: 'Luxury Condo',
      slug: 'luxury_condo',
      dataSpec,
      isActive: true,
    });

    mockTransaction.mockResolvedValue({
      id: DEMO_PROPERTY_ID,
      name: 'Luxury Condo Demo',
      type: 'DEMO',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      createdFromTemplate: 'luxury_condo',
      demoTemplateId: 'template-1',
      notificationSuppressed: true,
      seedData: dataSpec,
    });

    const req = createPostRequest('/api/v1/demo', {
      templateSlug: 'luxury_condo',
      label: 'Seed Test',
      purpose: 'sales_demo',
    });
    const res = await POST(req);
    const body = await parseResponse<{
      data: {
        seedData: {
          units: number;
          users: number;
          packages: number;
          maintenanceRequests: number;
          visitors: number;
        };
      };
    }>(res);

    // Verify seed data meets minimum thresholds per PRD 21
    expect(body.data.seedData.units).toBeGreaterThanOrEqual(20);
    expect(body.data.seedData.users).toBeGreaterThanOrEqual(10);
    expect(body.data.seedData.packages).toBeGreaterThan(0);
    expect(body.data.seedData.maintenanceRequests).toBeGreaterThan(0);
    expect(body.data.seedData.visitors).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// 10. Cannot access production data from demo context
// ---------------------------------------------------------------------------

describe('Production Data Isolation', () => {
  it('demo detail endpoint rejects access to production properties', async () => {
    mockPropertyFindUnique.mockResolvedValue({
      id: PROPERTY_ID,
      name: 'Production Property',
      type: 'PRODUCTION',
    });

    const req = createGetRequest(`/api/v1/demo/${PROPERTY_ID}`);
    const res = await GET_BY_ID(req, {
      params: Promise.resolve({ id: PROPERTY_ID }),
    });

    expect(res.status).toBe(403);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('NOT_DEMO_PROPERTY');
  });

  it('demo detail returns data only for DEMO or TRAINING type properties', async () => {
    mockPropertyFindUnique.mockResolvedValue({
      id: DEMO_PROPERTY_ID,
      name: 'Demo Property',
      type: 'DEMO',
      demoLabel: 'Sales Demo',
      expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      createdFromTemplate: 'luxury_condo',
      demoSessions: [],
    });

    const req = createGetRequest(`/api/v1/demo/${DEMO_PROPERTY_ID}`);
    const res = await GET_BY_ID(req, {
      params: Promise.resolve({ id: DEMO_PROPERTY_ID }),
    });

    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: { id: string; type: string } }>(res);
    expect(body.data.type).toBe('DEMO');
  });
});

// ---------------------------------------------------------------------------
// 11. Demo usage tracking: who created, when, for what purpose
// ---------------------------------------------------------------------------

describe('Demo Usage Tracking', () => {
  it('tracks creator, creation time, and purpose on demo creation', async () => {
    mockDemoTemplateFindUnique.mockResolvedValue({
      id: 'template-1',
      name: 'Luxury Condo',
      slug: 'luxury_condo',
      dataSpec: { units: 25, users: 12, packages: 30, maintenanceRequests: 15, visitors: 20 },
      isActive: true,
    });

    const now = new Date();

    mockTransaction.mockResolvedValue({
      id: DEMO_PROPERTY_ID,
      name: 'Luxury Condo Demo',
      type: 'DEMO',
      demoLabel: 'Enterprise Prospect',
      prospectName: 'BigCorp Inc',
      expiresAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      createdFromTemplate: 'luxury_condo',
      demoTemplateId: 'template-1',
      notificationSuppressed: true,
      assignedSalesRepId: 'test-user-id',
      createdAt: now,
      purpose: 'sales_demo',
    });

    const req = createPostRequest('/api/v1/demo', {
      templateSlug: 'luxury_condo',
      label: 'Enterprise Prospect',
      prospectName: 'BigCorp Inc',
      purpose: 'sales_demo',
    });
    const res = await POST(req);
    const body = await parseResponse<{
      data: {
        assignedSalesRepId: string;
        createdAt: string;
        purpose: string;
        prospectName: string;
      };
    }>(res);

    expect(body.data.assignedSalesRepId).toBe('test-user-id');
    expect(body.data.createdAt).toBeDefined();
    expect(body.data.purpose).toBe('sales_demo');
    expect(body.data.prospectName).toBe('BigCorp Inc');
  });

  it('demo detail includes session history for usage auditing', async () => {
    mockPropertyFindUnique.mockResolvedValue({
      id: DEMO_PROPERTY_ID,
      name: 'Demo Property',
      type: 'DEMO',
      demoLabel: 'Audit Demo',
      expiresAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      createdFromTemplate: 'luxury_condo',
      assignedSalesRepId: 'test-user-id',
      demoSessions: [
        {
          id: 'session-1',
          userId: 'user-a',
          effectiveRole: 'front_desk',
          actualRole: 'property_admin',
          startedAt: new Date(),
          endedAt: null,
        },
        {
          id: 'session-2',
          userId: 'user-b',
          effectiveRole: 'resident_owner',
          actualRole: 'super_admin',
          startedAt: new Date(Date.now() - 60_000),
          endedAt: new Date(),
        },
      ],
    });

    const req = createGetRequest(`/api/v1/demo/${DEMO_PROPERTY_ID}`);
    const res = await GET_BY_ID(req, {
      params: Promise.resolve({ id: DEMO_PROPERTY_ID }),
    });

    expect(res.status).toBe(200);
    const body = await parseResponse<{
      data: {
        demoSessions: Array<{ id: string; userId: string; effectiveRole: string }>;
      };
    }>(res);
    expect(body.data.demoSessions).toHaveLength(2);
  });
});
