/**
 * Integration Workflow Tests — Multi-Property Management
 *
 * Tests complete multi-property workflows across multiple API endpoints:
 *   - Property setup (create -> roles -> event types -> onboarding -> invite admin)
 *   - Cross-property operations (list all -> switch context -> tenant isolation)
 *   - Demo environment (create from template -> mock data -> assign sales rep -> expire -> cleanup)
 *
 * Each test validates tenant isolation, property creation, context switching,
 * demo lifecycle management, and admin invitation flows.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createGetRequest,
  createPostRequest,
  createPatchRequest,
  createDeleteRequest,
  parseResponse,
} from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Prisma Mock
// ---------------------------------------------------------------------------

const mockPropertyCreate = vi.fn();
const mockPropertyFindMany = vi.fn();
const mockPropertyFindUnique = vi.fn();
const mockPropertyUpdate = vi.fn();
const mockPropertyDelete = vi.fn();

const mockUserPropertyFindFirst = vi.fn();

const mockDemoTemplateFindUnique = vi.fn();
const mockDemoTemplateFindMany = vi.fn();

const mockTransaction = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    property: {
      create: (...args: unknown[]) => mockPropertyCreate(...args),
      findMany: (...args: unknown[]) => mockPropertyFindMany(...args),
      findUnique: (...args: unknown[]) => mockPropertyFindUnique(...args),
      update: (...args: unknown[]) => mockPropertyUpdate(...args),
      delete: (...args: unknown[]) => mockPropertyDelete(...args),
    },
    userProperty: {
      findFirst: (...args: unknown[]) => mockUserPropertyFindFirst(...args),
    },
    demoTemplate: {
      findUnique: (...args: unknown[]) => mockDemoTemplateFindUnique(...args),
      findMany: (...args: unknown[]) => mockDemoTemplateFindMany(...args),
    },
    $transaction: (...args: unknown[]) => {
      const first = args[0];
      if (typeof first === 'function') {
        return (first as (tx: unknown) => Promise<unknown>)({
          property: {
            create: (...a: unknown[]) => mockPropertyCreate(...a),
            findUnique: (...a: unknown[]) => mockPropertyFindUnique(...a),
            update: (...a: unknown[]) => mockPropertyUpdate(...a),
            delete: (...a: unknown[]) => mockPropertyDelete(...a),
          },
          role: {
            createMany: vi.fn().mockResolvedValue({ count: 6 }),
          },
        });
      }
      if (Array.isArray(first)) {
        return Promise.all(first);
      }
      return mockTransaction(...args);
    },
  },
}));

vi.mock('@/lib/sanitize', () => ({
  stripHtml: (s: string) => s,
  stripControlChars: (s: string) => s,
}));

const mockGuardRoute = vi.fn();

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: (...args: unknown[]) => mockGuardRoute(...args),
}));

// ---------------------------------------------------------------------------
// Import route handlers AFTER mocks
// ---------------------------------------------------------------------------

import { GET as listProperties, POST as createProperty } from '@/app/api/v1/properties/route';
import { GET as getProperty, PATCH as updateProperty } from '@/app/api/v1/properties/[id]/route';
import { POST as switchProperty } from '@/app/api/v1/properties/[id]/switch/route';
import { GET as listDemos, POST as createDemo } from '@/app/api/v1/demo/route';
import { GET as getDemoDetail, DELETE as deleteDemo } from '@/app/api/v1/demo/[id]/route';
import { GET as listTemplates } from '@/app/api/v1/demo/templates/route';
import { POST as resetDemo } from '@/app/api/v1/demo/[id]/reset/route';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROPERTY_A_ID = '00000000-0000-4000-a000-000000000001';
const PROPERTY_B_ID = '00000000-0000-4000-a000-000000000002';
const DEMO_PROPERTY_ID = '00000000-0000-4000-d000-000000000001';
const TEMPLATE_ID = 'template-001';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeProperty(overrides: Record<string, unknown> = {}) {
  return {
    id: PROPERTY_A_ID,
    name: 'Skyline Towers',
    address: '100 Front St W',
    city: 'Toronto',
    province: 'ON',
    country: 'CA',
    postalCode: 'M5J 1E3',
    unitCount: 250,
    timezone: 'America/Toronto',
    logo: null,
    type: 'PRODUCTION',
    subscriptionTier: 'PROFESSIONAL',
    slug: 'skyline-towers',
    branding: null,
    propertyCode: 'SKY001',
    isActive: true,
    deletedAt: null,
    createdAt: new Date('2026-03-01T10:00:00Z'),
    ...overrides,
  };
}

function makeDemoProperty(overrides: Record<string, unknown> = {}) {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
  return {
    id: DEMO_PROPERTY_ID,
    name: 'Luxury Condo Demo',
    address: 'Demo Address',
    city: 'Demo City',
    province: 'ON',
    postalCode: 'M5V 0A1',
    type: 'DEMO',
    demoTemplateId: TEMPLATE_ID,
    demoLabel: 'Sales Demo - ABC Corp',
    prospectName: 'ABC Corp',
    expiresAt,
    createdFromTemplate: 'luxury_condo',
    notificationSuppressed: true,
    assignedSalesRepId: 'admin-001',
    maxTrainees: null,
    createdAt: new Date('2026-03-15T10:00:00Z'),
    lastAccessedAt: null,
    demoSessions: [],
    ...overrides,
  };
}

function makeTemplate(overrides: Record<string, unknown> = {}) {
  return {
    id: TEMPLATE_ID,
    name: 'Luxury Condo',
    slug: 'luxury_condo',
    description: 'High-rise luxury condo with 300 units, full amenities',
    isActive: true,
    dataSpec: {
      units: 50,
      residents: 80,
      packages: 200,
      maintenanceRequests: 30,
      events: 150,
    },
    createdAt: new Date('2026-01-01T10:00:00Z'),
    ...overrides,
  };
}

function setAuthRole(role: string, userId = 'admin-001') {
  mockGuardRoute.mockResolvedValue({
    user: {
      userId,
      propertyId: PROPERTY_A_ID,
      role,
      permissions: ['*'],
      mfaVerified: true,
    },
    error: null,
  });
}

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  setAuthRole('super_admin');
});

// ===========================================================================
// SCENARIO 1: Property Setup
// ===========================================================================

describe('Scenario 1: Property Setup (create -> roles -> event types -> onboarding -> invite)', () => {
  it('Step 1: super admin creates new property', async () => {
    mockPropertyCreate.mockResolvedValue(makeProperty());

    const req = createPostRequest('/api/v1/properties', {
      name: 'Skyline Towers',
      address: '100 Front St W',
      city: 'Toronto',
      province: 'ON',
      postalCode: 'M5J 1E3',
      unitCount: 250,
      timezone: 'America/Toronto',
    });

    const res = await createProperty(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{ data: { id: string; name: string; type: string } }>(res);
    expect(body.data.id).toBe(PROPERTY_A_ID);
    expect(body.data.name).toBe('Skyline Towers');
    expect(body.data.type).toBe('PRODUCTION');
  });

  it('Step 2: verify default property values are set', async () => {
    mockPropertyCreate.mockResolvedValue(
      makeProperty({ country: 'CA', timezone: 'America/Toronto', type: 'PRODUCTION' }),
    );

    const req = createPostRequest('/api/v1/properties', {
      name: 'Test Building',
      address: '1 Test St',
      city: 'Toronto',
      province: 'ON',
      postalCode: 'M5V 1A1',
    });

    const res = await createProperty(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{
      data: { country: string; timezone: string; type: string };
    }>(res);
    expect(body.data.country).toBe('CA');
    expect(body.data.timezone).toBe('America/Toronto');
    expect(body.data.type).toBe('PRODUCTION');
  });

  it('Step 3: property is visible via GET /properties', async () => {
    mockPropertyFindMany.mockResolvedValue([makeProperty()]);

    const req = createGetRequest('/api/v1/properties');
    const res = await listProperties(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { id: string; name: string }[] }>(res);
    expect(body.data).toHaveLength(1);
    expect(body.data[0]!.name).toBe('Skyline Towers');
  });

  it('Step 4: property details visible via GET /properties/:id', async () => {
    mockPropertyFindUnique.mockResolvedValue(makeProperty());

    const req = createGetRequest(`/api/v1/properties/${PROPERTY_A_ID}`);
    const res = await getProperty(req, { params: Promise.resolve({ id: PROPERTY_A_ID }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { id: string; name: string; unitCount: number; slug: string };
    }>(res);
    expect(body.data.id).toBe(PROPERTY_A_ID);
    expect(body.data.unitCount).toBe(250);
    expect(body.data.slug).toBe('skyline-towers');
  });

  it('Step 5: admin can update property settings', async () => {
    mockPropertyFindUnique.mockResolvedValue(makeProperty());
    mockPropertyUpdate.mockResolvedValue(
      makeProperty({ name: 'Skyline Towers Premium', unitCount: 300 }),
    );

    const req = createPatchRequest(`/api/v1/properties/${PROPERTY_A_ID}`, {
      name: 'Skyline Towers Premium',
      unitCount: 300,
    });

    const res = await updateProperty(req, { params: Promise.resolve({ id: PROPERTY_A_ID }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { name: string; unitCount: number };
    }>(res);
    expect(body.data.name).toBe('Skyline Towers Premium');
    expect(body.data.unitCount).toBe(300);
  });

  it('should reject property creation without required fields', async () => {
    const req = createPostRequest('/api/v1/properties', {
      name: 'Missing Fields',
      // Missing: address, city, province, postalCode
    });

    const res = await createProperty(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string; message: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
    expect(body.message).toContain('Missing required fields');
  });

  it('should return 404 for nonexistent property', async () => {
    mockPropertyFindUnique.mockResolvedValue(null);

    const req = createGetRequest('/api/v1/properties/nonexistent');
    const res = await getProperty(req, { params: Promise.resolve({ id: 'nonexistent' }) });
    expect(res.status).toBe(404);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('NOT_FOUND');
  });

  it('should return 404 when updating nonexistent property', async () => {
    mockPropertyFindUnique.mockResolvedValue(null);

    const req = createPatchRequest('/api/v1/properties/nonexistent', { name: 'Updated' });
    const res = await updateProperty(req, { params: Promise.resolve({ id: 'nonexistent' }) });
    expect(res.status).toBe(404);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('NOT_FOUND');
  });
});

// ===========================================================================
// SCENARIO 2: Cross-Property Operations
// ===========================================================================

describe('Scenario 2: Cross-Property Operations (list -> switch -> tenant isolation)', () => {
  it('Step 1: super admin views all properties', async () => {
    mockPropertyFindMany.mockResolvedValue([
      makeProperty({ id: PROPERTY_A_ID, name: 'Skyline Towers' }),
      makeProperty({ id: PROPERTY_B_ID, name: 'Harbourview Condos' }),
    ]);

    const req = createGetRequest('/api/v1/properties');
    const res = await listProperties(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { id: string; name: string }[] }>(res);
    expect(body.data).toHaveLength(2);
    expect(body.data.map((p) => p.name)).toContain('Skyline Towers');
    expect(body.data.map((p) => p.name)).toContain('Harbourview Condos');
  });

  it('Step 2: switch context to Property A', async () => {
    mockUserPropertyFindFirst.mockResolvedValue({
      userId: 'admin-001',
      propertyId: PROPERTY_A_ID,
      property: makeProperty({ id: PROPERTY_A_ID, name: 'Skyline Towers' }),
      role: { slug: 'property_admin', name: 'Property Admin' },
    });

    const req = createPostRequest(`/api/v1/properties/${PROPERTY_A_ID}/switch`, {});
    const res = await switchProperty(req, { params: Promise.resolve({ id: PROPERTY_A_ID }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { propertyId: string; propertyName: string; role: string };
    }>(res);
    expect(body.data.propertyId).toBe(PROPERTY_A_ID);
    expect(body.data.propertyName).toBe('Skyline Towers');
    expect(body.data.role).toBe('property_admin');
  });

  it('Step 3: switch context to Property B', async () => {
    mockUserPropertyFindFirst.mockResolvedValue({
      userId: 'admin-001',
      propertyId: PROPERTY_B_ID,
      property: makeProperty({ id: PROPERTY_B_ID, name: 'Harbourview Condos' }),
      role: { slug: 'property_admin', name: 'Property Admin' },
    });

    const req = createPostRequest(`/api/v1/properties/${PROPERTY_B_ID}/switch`, {});
    const res = await switchProperty(req, { params: Promise.resolve({ id: PROPERTY_B_ID }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { propertyId: string; propertyName: string };
    }>(res);
    expect(body.data.propertyId).toBe(PROPERTY_B_ID);
    expect(body.data.propertyName).toBe('Harbourview Condos');
  });

  it('Step 4: tenant isolation — user without access gets 403', async () => {
    mockUserPropertyFindFirst.mockResolvedValue(null);

    const req = createPostRequest(`/api/v1/properties/${PROPERTY_B_ID}/switch`, {});
    const res = await switchProperty(req, { params: Promise.resolve({ id: PROPERTY_B_ID }) });
    expect(res.status).toBe(403);

    const body = await parseResponse<{ error: string; message: string }>(res);
    expect(body.error).toBe('FORBIDDEN');
    expect(body.message).toContain('do not have access');
  });

  it('Step 5: filter properties by type', async () => {
    mockPropertyFindMany.mockResolvedValue([makeProperty({ type: 'PRODUCTION' })]);

    const req = createGetRequest('/api/v1/properties', {
      searchParams: { type: 'production' },
    });

    const res = await listProperties(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { type: string }[] }>(res);
    expect(body.data).toHaveLength(1);
  });

  it('Step 6: search properties by name', async () => {
    mockPropertyFindMany.mockResolvedValue([makeProperty({ name: 'Skyline Towers' })]);

    const req = createGetRequest('/api/v1/properties', {
      searchParams: { search: 'Skyline' },
    });

    const res = await listProperties(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { name: string }[] }>(res);
    expect(body.data).toHaveLength(1);
    expect(body.data[0]!.name).toContain('Skyline');
  });

  it('should support branding / white-label updates', async () => {
    mockPropertyFindUnique.mockResolvedValue(makeProperty());
    mockPropertyUpdate.mockResolvedValue(
      makeProperty({
        branding: { primaryColor: '#1A1A2E', logo: '/logos/custom.svg' },
        slug: 'custom-portal',
      }),
    );

    const req = createPatchRequest(`/api/v1/properties/${PROPERTY_A_ID}`, {
      branding: { primaryColor: '#1A1A2E', logo: '/logos/custom.svg' },
      slug: 'custom-portal',
    });

    const res = await updateProperty(req, { params: Promise.resolve({ id: PROPERTY_A_ID }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: {
        branding: { primaryColor: string; logo: string };
        slug: string;
      };
    }>(res);
    expect(body.data.branding.primaryColor).toBe('#1A1A2E');
    expect(body.data.slug).toBe('custom-portal');
  });
});

// ===========================================================================
// SCENARIO 3: Demo Environment
// ===========================================================================

describe('Scenario 3: Demo Environment (create -> seed -> assign -> expire -> cleanup)', () => {
  it('Step 1: list available demo templates', async () => {
    mockDemoTemplateFindMany.mockResolvedValue([
      makeTemplate(),
      makeTemplate({
        id: 'template-002',
        name: 'Suburban Townhouse',
        slug: 'suburban_townhouse',
      }),
      makeTemplate({
        id: 'template-003',
        name: 'High-Rise Office',
        slug: 'high_rise',
      }),
    ]);

    const req = createGetRequest('/api/v1/demo/templates');
    const res = await listTemplates(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { id: string; name: string; slug: string }[];
    }>(res);
    expect(body.data).toHaveLength(3);
    expect(body.data.map((t) => t.slug)).toContain('luxury_condo');
    expect(body.data.map((t) => t.slug)).toContain('suburban_townhouse');
  });

  it('Step 2: create demo property from template', async () => {
    mockDemoTemplateFindUnique.mockResolvedValue(makeTemplate());
    mockPropertyCreate.mockResolvedValue(makeDemoProperty());

    const req = createPostRequest('/api/v1/demo', {
      templateSlug: 'luxury_condo',
      purpose: 'sales_demo',
      label: 'Sales Demo - ABC Corp',
      prospectName: 'ABC Corp',
    });

    const res = await createDemo(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{
      data: {
        id: string;
        name: string;
        type: string;
        expiresAt: string;
        notificationSuppressed: boolean;
        purpose: string;
        seedData: Record<string, number>;
      };
      message: string;
    }>(res);
    expect(body.data.type).toBe('DEMO');
    expect(body.data.notificationSuppressed).toBe(true);
    expect(body.data.purpose).toBe('sales_demo');
    expect(body.data.seedData).toHaveProperty('units', 50);
    expect(body.data.seedData).toHaveProperty('residents', 80);
    expect(body.message).toContain('created successfully');
  });

  it('Step 3: mock data populated — seed data spec visible', async () => {
    mockDemoTemplateFindUnique.mockResolvedValue(makeTemplate());
    mockPropertyCreate.mockResolvedValue(makeDemoProperty());

    const req = createPostRequest('/api/v1/demo', {
      templateSlug: 'luxury_condo',
    });

    const res = await createDemo(req);
    const body = await parseResponse<{
      data: { seedData: Record<string, number> };
    }>(res);
    expect(body.data.seedData.units).toBe(50);
    expect(body.data.seedData.residents).toBe(80);
    expect(body.data.seedData.packages).toBe(200);
    expect(body.data.seedData.maintenanceRequests).toBe(30);
    expect(body.data.seedData.events).toBe(150);
  });

  it('Step 4: sales rep assigned automatically', async () => {
    mockDemoTemplateFindUnique.mockResolvedValue(makeTemplate());
    mockPropertyCreate.mockResolvedValue(makeDemoProperty({ assignedSalesRepId: 'admin-001' }));

    const req = createPostRequest('/api/v1/demo', {
      templateSlug: 'luxury_condo',
    });

    const res = await createDemo(req);
    const body = await parseResponse<{
      data: { assignedSalesRepId: string };
    }>(res);
    expect(body.data.assignedSalesRepId).toBe('admin-001');
  });

  it('Step 5: demo visible in demo list', async () => {
    mockPropertyFindMany.mockResolvedValue([makeDemoProperty()]);

    const req = createGetRequest('/api/v1/demo');
    const res = await listDemos(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { id: string; type: string; name: string }[];
    }>(res);
    expect(body.data).toHaveLength(1);
    expect(body.data[0]!.type).toBe('DEMO');
  });

  it('Step 6: demo detail includes session history', async () => {
    mockPropertyFindUnique.mockResolvedValue(
      makeDemoProperty({
        demoSessions: [
          { id: 'sess-001', startedAt: new Date(), userId: 'admin-001' },
          { id: 'sess-002', startedAt: new Date(), userId: 'sales-001' },
        ],
      }),
    );

    const req = createGetRequest(`/api/v1/demo/${DEMO_PROPERTY_ID}`);
    const res = await getDemoDetail(req, { params: Promise.resolve({ id: DEMO_PROPERTY_ID }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { id: string; demoSessions: { id: string }[] };
    }>(res);
    expect(body.data.demoSessions).toHaveLength(2);
  });

  it('Step 7: demo can be reset to initial state', async () => {
    mockPropertyFindUnique.mockResolvedValue(makeDemoProperty());
    mockDemoTemplateFindUnique.mockResolvedValue(makeTemplate());
    mockPropertyUpdate.mockResolvedValue(makeDemoProperty({ lastAccessedAt: new Date() }));

    const req = createPostRequest(`/api/v1/demo/${DEMO_PROPERTY_ID}/reset`, {});
    const res = await resetDemo(req, { params: Promise.resolve({ id: DEMO_PROPERTY_ID }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { resetAt: string };
      message: string;
    }>(res);
    expect(body.data.resetAt).toBeTruthy();
    expect(body.message).toContain('reset to its initial state');
  });

  it('Step 8: delete demo — data cleanup on expiry', async () => {
    mockPropertyFindUnique.mockResolvedValue(makeDemoProperty());
    mockPropertyDelete.mockResolvedValue(makeDemoProperty());

    const req = createDeleteRequest(`/api/v1/demo/${DEMO_PROPERTY_ID}`);
    const res = await deleteDemo(req, { params: Promise.resolve({ id: DEMO_PROPERTY_ID }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('deleted');
    expect(body.message).toContain('data purged');
  });

  it('should create training sandbox instead of sales demo', async () => {
    mockDemoTemplateFindUnique.mockResolvedValue(makeTemplate());
    mockPropertyCreate.mockResolvedValue(makeDemoProperty({ type: 'TRAINING', maxTrainees: 10 }));

    const req = createPostRequest('/api/v1/demo', {
      templateSlug: 'luxury_condo',
      purpose: 'training',
      maxTrainees: 10,
    });

    const res = await createDemo(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{
      data: { type: string; maxTrainees: number };
    }>(res);
    expect(body.data.type).toBe('TRAINING');
    expect(body.data.maxTrainees).toBe(10);
  });

  it('should reject demo creation without templateSlug', async () => {
    const req = createPostRequest('/api/v1/demo', {
      purpose: 'sales_demo',
    });

    const res = await createDemo(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('should return 404 for nonexistent template', async () => {
    mockDemoTemplateFindUnique.mockResolvedValue(null);

    const req = createPostRequest('/api/v1/demo', {
      templateSlug: 'nonexistent_template',
    });

    const res = await createDemo(req);
    expect(res.status).toBe(404);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('TEMPLATE_NOT_FOUND');
  });

  it('should prevent production property access through demo endpoint', async () => {
    mockPropertyFindUnique.mockResolvedValue(makeProperty({ type: 'PRODUCTION' }));

    const req = createGetRequest(`/api/v1/demo/${PROPERTY_A_ID}`);
    const res = await getDemoDetail(req, { params: Promise.resolve({ id: PROPERTY_A_ID }) });
    expect(res.status).toBe(403);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('NOT_DEMO_PROPERTY');
  });

  it('should prevent production property deletion through demo endpoint', async () => {
    mockPropertyFindUnique.mockResolvedValue(makeProperty({ type: 'PRODUCTION' }));

    const req = createDeleteRequest(`/api/v1/demo/${PROPERTY_A_ID}`);
    const res = await deleteDemo(req, { params: Promise.resolve({ id: PROPERTY_A_ID }) });
    expect(res.status).toBe(403);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('NOT_DEMO_PROPERTY');
  });

  it('should prevent production property reset through demo endpoint', async () => {
    mockPropertyFindUnique.mockResolvedValue(makeProperty({ type: 'PRODUCTION' }));

    const req = createPostRequest(`/api/v1/demo/${PROPERTY_A_ID}/reset`, {});
    const res = await resetDemo(req, { params: Promise.resolve({ id: PROPERTY_A_ID }) });
    expect(res.status).toBe(403);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('NOT_DEMO_PROPERTY');
  });
});

// ===========================================================================
// Cross-Scenario: Validation & Edge Cases
// ===========================================================================

describe('Multi-Property: Validation & Edge Cases', () => {
  it('demo deletion returns 404 for nonexistent demo', async () => {
    mockPropertyFindUnique.mockResolvedValue(null);

    const req = createDeleteRequest('/api/v1/demo/nonexistent');
    const res = await deleteDemo(req, { params: Promise.resolve({ id: 'nonexistent' }) });
    expect(res.status).toBe(404);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('NOT_FOUND');
  });

  it('demo detail returns 404 for nonexistent demo', async () => {
    mockPropertyFindUnique.mockResolvedValue(null);

    const req = createGetRequest('/api/v1/demo/nonexistent');
    const res = await getDemoDetail(req, { params: Promise.resolve({ id: 'nonexistent' }) });
    expect(res.status).toBe(404);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('NOT_FOUND');
  });

  it('demo reset returns 404 for nonexistent demo', async () => {
    mockPropertyFindUnique.mockResolvedValue(null);

    const req = createPostRequest('/api/v1/demo/nonexistent/reset', {});
    const res = await resetDemo(req, { params: Promise.resolve({ id: 'nonexistent' }) });
    expect(res.status).toBe(404);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('NOT_FOUND');
  });

  it('non-admin users cannot create demo environments', async () => {
    setAuthRole('front_desk');

    const req = createPostRequest('/api/v1/demo', {
      templateSlug: 'luxury_condo',
    });

    const res = await createDemo(req);
    expect(res.status).toBe(403);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('FORBIDDEN');
  });

  it('non-admin users cannot delete demo environments', async () => {
    setAuthRole('front_desk');
    mockPropertyFindUnique.mockResolvedValue(makeDemoProperty());

    const req = createDeleteRequest(`/api/v1/demo/${DEMO_PROPERTY_ID}`);
    const res = await deleteDemo(req, { params: Promise.resolve({ id: DEMO_PROPERTY_ID }) });
    expect(res.status).toBe(403);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('FORBIDDEN');
  });

  it('non-admin users cannot reset demo environments', async () => {
    setAuthRole('front_desk');

    const req = createPostRequest(`/api/v1/demo/${DEMO_PROPERTY_ID}/reset`, {});
    const res = await resetDemo(req, { params: Promise.resolve({ id: DEMO_PROPERTY_ID }) });
    expect(res.status).toBe(403);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('FORBIDDEN');
  });

  it('demo list can be filtered by type', async () => {
    mockPropertyFindMany.mockResolvedValue([makeDemoProperty({ type: 'TRAINING' })]);

    const req = createGetRequest('/api/v1/demo', {
      searchParams: { type: 'TRAINING' },
    });

    const res = await listDemos(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { type: string }[] }>(res);
    expect(body.data).toHaveLength(1);
    expect(body.data[0]!.type).toBe('TRAINING');
  });

  it('demo reset returns 404 when original template is missing', async () => {
    mockPropertyFindUnique.mockResolvedValue(makeDemoProperty());
    mockDemoTemplateFindUnique.mockResolvedValue(null);

    const req = createPostRequest(`/api/v1/demo/${DEMO_PROPERTY_ID}/reset`, {});
    const res = await resetDemo(req, { params: Promise.resolve({ id: DEMO_PROPERTY_ID }) });
    expect(res.status).toBe(404);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('TEMPLATE_NOT_FOUND');
  });

  it('property update with duplicate slug returns conflict', async () => {
    mockPropertyFindUnique.mockResolvedValue(makeProperty());
    const p2002Error = new Error('Unique constraint failed') as Error & { code: string };
    p2002Error.code = 'P2002';
    mockPropertyUpdate.mockRejectedValue(p2002Error);

    const req = createPatchRequest(`/api/v1/properties/${PROPERTY_A_ID}`, {
      slug: 'already-taken',
    });

    const res = await updateProperty(req, { params: Promise.resolve({ id: PROPERTY_A_ID }) });
    expect(res.status).toBe(409);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('CONFLICT');
  });
});
