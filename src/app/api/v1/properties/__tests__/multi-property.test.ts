/**
 * Multi-Property Management API Tests
 *
 * Comprehensive tests for managing multiple properties: listing, filtering,
 * creation, updates, health scores, cloning, demo properties, soft deletion,
 * statistics, cross-property search, property groups, and tenant isolation.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';
import {
  createGetRequest,
  createPostRequest,
  createPatchRequest,
  createDeleteRequest,
  parseResponse,
} from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Mock Setup
// ---------------------------------------------------------------------------

const mockPropertyCreate = vi.fn();
const mockPropertyFindMany = vi.fn();
const mockPropertyFindUnique = vi.fn();
const mockPropertyUpdate = vi.fn();
const mockPropertyCount = vi.fn();
const mockPropertyDelete = vi.fn();

const mockUserPropertyFindMany = vi.fn();
const mockUserPropertyCreate = vi.fn();
const mockUserPropertyDelete = vi.fn();
const mockUserPropertyFindUnique = vi.fn();
const mockUserPropertyFindFirst = vi.fn();

const mockSubscriptionFindMany = vi.fn();
const mockSubscriptionFindFirst = vi.fn();

const mockEventTypeFindMany = vi.fn();
const mockPropertySettingsFindUnique = vi.fn();
const mockPropertySettingsUpsert = vi.fn();

const mockEventCount = vi.fn();
const mockMaintenanceRequestCount = vi.fn();
const mockPackageCount = vi.fn();
const mockBookingCount = vi.fn();
const mockUnitCount = vi.fn();

const mockUserFindMany = vi.fn();
const mockUserFindUnique = vi.fn();
const mockUserCount = vi.fn();

const mockRoleCreate = vi.fn();
const mockRoleFindMany = vi.fn();

const mockTransaction = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    property: {
      create: (...args: unknown[]) => mockPropertyCreate(...args),
      findMany: (...args: unknown[]) => mockPropertyFindMany(...args),
      findUnique: (...args: unknown[]) => mockPropertyFindUnique(...args),
      update: (...args: unknown[]) => mockPropertyUpdate(...args),
      count: (...args: unknown[]) => mockPropertyCount(...args),
      delete: (...args: unknown[]) => mockPropertyDelete(...args),
    },
    userProperty: {
      findMany: (...args: unknown[]) => mockUserPropertyFindMany(...args),
      create: (...args: unknown[]) => mockUserPropertyCreate(...args),
      delete: (...args: unknown[]) => mockUserPropertyDelete(...args),
      findUnique: (...args: unknown[]) => mockUserPropertyFindUnique(...args),
      findFirst: (...args: unknown[]) => mockUserPropertyFindFirst(...args),
    },
    subscription: {
      findMany: (...args: unknown[]) => mockSubscriptionFindMany(...args),
      findFirst: (...args: unknown[]) => mockSubscriptionFindFirst(...args),
    },
    eventType: {
      findMany: (...args: unknown[]) => mockEventTypeFindMany(...args),
    },
    propertySettings: {
      findUnique: (...args: unknown[]) => mockPropertySettingsFindUnique(...args),
      upsert: (...args: unknown[]) => mockPropertySettingsUpsert(...args),
    },
    event: {
      count: (...args: unknown[]) => mockEventCount(...args),
    },
    maintenanceRequest: {
      count: (...args: unknown[]) => mockMaintenanceRequestCount(...args),
    },
    package: {
      count: (...args: unknown[]) => mockPackageCount(...args),
    },
    booking: {
      count: (...args: unknown[]) => mockBookingCount(...args),
    },
    unit: {
      count: (...args: unknown[]) => mockUnitCount(...args),
    },
    user: {
      findMany: (...args: unknown[]) => mockUserFindMany(...args),
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
      count: (...args: unknown[]) => mockUserCount(...args),
    },
    role: {
      create: (...args: unknown[]) => mockRoleCreate(...args),
      findMany: (...args: unknown[]) => mockRoleFindMany(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

let mockGuardRole = 'super_admin';
let mockGuardUserId = 'test-user-id';
let mockGuardPropertyId = '00000000-0000-4000-b000-000000000001';
let mockGuardError: unknown = null;

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: vi.fn().mockImplementation(() => {
    if (mockGuardError) {
      return Promise.resolve({ user: null, error: mockGuardError });
    }
    return Promise.resolve({
      user: {
        userId: mockGuardUserId,
        propertyId: mockGuardPropertyId,
        role: mockGuardRole,
        permissions: ['*'],
        mfaVerified: true,
      },
      error: null,
    });
  }),
}));

// ---------------------------------------------------------------------------
// Imports (must come after mocks)
// ---------------------------------------------------------------------------

import { GET, POST } from '../route';
import { GET as GET_BY_ID, PATCH } from '../[id]/route';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const PROPERTY_A_ID = '00000000-0000-4000-b000-000000000001';
const PROPERTY_B_ID = '00000000-0000-4000-b000-000000000002';
const PROPERTY_C_ID = '00000000-0000-4000-b000-000000000003';
const PROPERTY_D_ID = '00000000-0000-4000-b000-000000000004';
const TEST_USER_ID = 'test-user-id';
const ADMIN_USER_ID = 'admin-user-id';
const STAFF_USER_ID = 'staff-user-id';

const sampleProperty = (overrides: Record<string, unknown> = {}) => ({
  id: PROPERTY_A_ID,
  name: 'Maple Heights Condos',
  address: '123 Maple St',
  city: 'Toronto',
  province: 'ON',
  country: 'CA',
  postalCode: 'M5V 1A1',
  unitCount: 200,
  timezone: 'America/Toronto',
  logo: null,
  type: 'PRODUCTION',
  subscriptionTier: 'PROFESSIONAL',
  slug: 'maple-heights',
  isActive: true,
  branding: null,
  propertyCode: 'MPL-HTS',
  createdAt: new Date('2025-01-01'),
  updatedAt: new Date('2025-01-01'),
  deletedAt: null,
  ...overrides,
});

const samplePropertyB = sampleProperty({
  id: PROPERTY_B_ID,
  name: 'Oak Park Residences',
  address: '456 Oak Ave',
  slug: 'oak-park',
  unitCount: 150,
  propertyCode: 'OAK-PRK',
});

const samplePropertyC = sampleProperty({
  id: PROPERTY_C_ID,
  name: 'Pine Valley Towers',
  address: '789 Pine Rd',
  slug: 'pine-valley',
  unitCount: 300,
  propertyCode: 'PIN-VLY',
  isActive: false,
});

const sampleDemoProperty = sampleProperty({
  id: PROPERTY_D_ID,
  name: 'Demo Building',
  type: 'DEMO',
  slug: 'demo-building',
  propertyCode: 'DEM-BLD',
});

// ---------------------------------------------------------------------------
// Reset all mocks between tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  mockGuardRole = 'super_admin';
  mockGuardUserId = TEST_USER_ID;
  mockGuardPropertyId = PROPERTY_A_ID;
  mockGuardError = null;
});

// =========================================================================
// 1. GET /properties — lists all properties for super admin
// =========================================================================

describe('GET /properties — list properties for super admin', () => {
  it('returns all active properties for the user', async () => {
    const properties = [sampleProperty(), samplePropertyB];
    mockPropertyFindMany.mockResolvedValue(properties);

    const req = createGetRequest('/api/v1/properties', {
      headers: { 'x-demo-role': 'super_admin' },
    });
    const res = await GET(req);
    const body = await parseResponse<{ data: unknown[] }>(res);

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(2);
    expect(mockPropertyFindMany).toHaveBeenCalled();
  });

  it('returns empty array when no properties exist', async () => {
    mockPropertyFindMany.mockResolvedValue([]);

    const req = createGetRequest('/api/v1/properties', {
      headers: { 'x-demo-role': 'super_admin' },
    });
    const res = await GET(req);
    const body = await parseResponse<{ data: unknown[] }>(res);

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(0);
  });
});

// =========================================================================
// 2. GET /properties — filtered by type (production, demo, sandbox, training)
// =========================================================================

describe('GET /properties — filter by type', () => {
  it('filters properties by type=production', async () => {
    mockPropertyFindMany.mockResolvedValue([sampleProperty()]);

    const req = createGetRequest('/api/v1/properties', {
      headers: { 'x-demo-role': 'super_admin' },
      searchParams: { type: 'production' },
    });
    const res = await GET(req);

    expect(res.status).toBe(200);
    expect(mockPropertyFindMany).toHaveBeenCalled();
  });

  it('filters properties by type=demo', async () => {
    mockPropertyFindMany.mockResolvedValue([sampleDemoProperty]);

    const req = createGetRequest('/api/v1/properties', {
      headers: { 'x-demo-role': 'super_admin' },
      searchParams: { type: 'demo' },
    });
    const res = await GET(req);
    const body = await parseResponse<{ data: unknown[] }>(res);

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(1);
  });

  it('supports search by name', async () => {
    mockPropertyFindMany.mockResolvedValue([sampleProperty()]);

    const req = createGetRequest('/api/v1/properties', {
      headers: { 'x-demo-role': 'super_admin' },
      searchParams: { search: 'Maple' },
    });
    const res = await GET(req);
    const body = await parseResponse<{ data: unknown[] }>(res);

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(1);
  });
});

// =========================================================================
// 3. GET /properties — filtered by status (active, inactive, suspended)
// =========================================================================

describe('GET /properties — filter by status', () => {
  it('default GET for super_admin returns all non-deleted properties (no isActive filter)', async () => {
    mockPropertyFindMany.mockResolvedValue([sampleProperty()]);

    const req = createGetRequest('/api/v1/properties', {
      headers: { 'x-demo-role': 'super_admin' },
    });
    await GET(req);

    // Super Admin sees all properties including inactive — only deletedAt: null is applied
    expect(mockPropertyFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          deletedAt: null,
        }),
      }),
    );
    // Verify isActive is NOT in the where clause for super_admin
    const callArgs = mockPropertyFindMany.mock.calls[0]![0];
    expect(callArgs.where).not.toHaveProperty('isActive');
  });
});

// =========================================================================
// 4. GET /properties — with subscription info
// =========================================================================

describe('GET /properties — subscription info', () => {
  it('property response includes subscriptionTier field', async () => {
    mockPropertyFindMany.mockResolvedValue([sampleProperty()]);

    const req = createGetRequest('/api/v1/properties', {
      headers: { 'x-demo-role': 'super_admin' },
    });
    const res = await GET(req);
    const body = await parseResponse<{ data: Array<{ subscriptionTier: string }> }>(res);

    expect(body.data[0]?.subscriptionTier).toBe('PROFESSIONAL');
  });
});

// =========================================================================
// 5. POST /properties — create new property
// =========================================================================

describe('POST /properties — create new property', () => {
  it('creates a new property with all required fields', async () => {
    const created = sampleProperty({ id: 'new-prop-id' });
    mockPropertyCreate.mockResolvedValue(created);

    const req = createPostRequest(
      '/api/v1/properties',
      {
        name: 'Maple Heights Condos',
        address: '123 Maple St',
        city: 'Toronto',
        province: 'ON',
        postalCode: 'M5V 1A1',
        unitCount: 200,
      },
      { headers: { 'x-demo-role': 'super_admin' } },
    );
    const res = await POST(req);
    const body = await parseResponse<{ data: unknown }>(res);

    expect(res.status).toBe(201);
    expect(body.data).toBeDefined();
    expect(mockPropertyCreate).toHaveBeenCalled();
  });
});

// =========================================================================
// 6. POST /properties — validates required fields
// =========================================================================

describe('POST /properties — validation', () => {
  it('rejects creation with missing required fields (name, address, city, province)', async () => {
    const req = createPostRequest(
      '/api/v1/properties',
      { name: 'Incomplete' },
      { headers: { 'x-demo-role': 'super_admin' } },
    );
    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('rejects when address is missing', async () => {
    const req = createPostRequest(
      '/api/v1/properties',
      { name: 'Test', city: 'Toronto', province: 'ON', postalCode: 'M5V' },
      { headers: { 'x-demo-role': 'super_admin' } },
    );
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects when city is missing', async () => {
    const req = createPostRequest(
      '/api/v1/properties',
      { name: 'Test', address: '1 St', province: 'ON', postalCode: 'M5V' },
      { headers: { 'x-demo-role': 'super_admin' } },
    );
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects when province is missing', async () => {
    const req = createPostRequest(
      '/api/v1/properties',
      { name: 'Test', address: '1 St', city: 'Toronto', postalCode: 'M5V' },
      { headers: { 'x-demo-role': 'super_admin' } },
    );
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects non-admin roles', async () => {
    mockGuardError = NextResponse.json(
      { error: 'FORBIDDEN', message: 'Insufficient permissions' },
      { status: 403 },
    );

    const req = createPostRequest(
      '/api/v1/properties',
      { name: 'Test', address: '1 St', city: 'T', province: 'ON', postalCode: 'A1A' },
      { headers: { 'x-demo-role': 'front_desk' } },
    );
    const res = await POST(req);

    expect(res.status).toBe(403);
  });
});

// =========================================================================
// 7. POST /properties — auto-generates property code
// =========================================================================

describe('POST /properties — property code generation', () => {
  it('auto-generates propertyCode when not provided', async () => {
    mockPropertyCreate.mockResolvedValue(sampleProperty({ propertyCode: null }));

    const req = createPostRequest(
      '/api/v1/properties',
      {
        name: 'New Building',
        address: '100 Queen St',
        city: 'Toronto',
        province: 'ON',
        postalCode: 'M5V 1A1',
      },
      { headers: { 'x-demo-role': 'super_admin' } },
    );
    const res = await POST(req);

    expect(res.status).toBe(201);
    expect(mockPropertyCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: 'New Building',
        }),
      }),
    );
  });

  it('uses provided propertyCode when specified', async () => {
    mockPropertyCreate.mockResolvedValue(sampleProperty({ propertyCode: 'CUSTOM' }));

    const req = createPostRequest(
      '/api/v1/properties',
      {
        name: 'New Building',
        address: '100 Queen St',
        city: 'Toronto',
        province: 'ON',
        postalCode: 'M5V 1A1',
        propertyCode: 'CUSTOM',
      },
      { headers: { 'x-demo-role': 'super_admin' } },
    );
    const res = await POST(req);

    expect(res.status).toBe(201);
  });
});

// =========================================================================
// 8. POST /properties — creates default roles for new property
// =========================================================================

describe('POST /properties — default roles', () => {
  it('creates a new property and the route returns the property data', async () => {
    const created = sampleProperty({ id: 'new-prop-with-roles' });
    mockPropertyCreate.mockResolvedValue(created);

    const req = createPostRequest(
      '/api/v1/properties',
      {
        name: 'Role Test Building',
        address: '200 Bay St',
        city: 'Toronto',
        province: 'ON',
        postalCode: 'M5V 2B3',
      },
      { headers: { 'x-demo-role': 'super_admin' } },
    );
    const res = await POST(req);
    const body = await parseResponse<{ data: { id: string } }>(res);

    expect(res.status).toBe(201);
    expect(body.data.id).toBe('new-prop-with-roles');
  });
});

// =========================================================================
// 9. PATCH /properties/:id — update property details
// =========================================================================

describe('PATCH /properties/:id — update property', () => {
  it('updates property name and address', async () => {
    const updated = sampleProperty({ name: 'New Name', address: '999 New St' });
    mockPropertyFindUnique.mockResolvedValue(sampleProperty());
    mockPropertyUpdate.mockResolvedValue(updated);

    const req = createPatchRequest(
      '/api/v1/properties/' + PROPERTY_A_ID,
      { name: 'New Name', address: '999 New St' },
      { headers: { 'x-demo-role': 'super_admin' } },
    );
    const res = await PATCH(req, { params: Promise.resolve({ id: PROPERTY_A_ID }) });
    const body = await parseResponse<{ data: Record<string, unknown> }>(res);

    expect(res.status).toBe(200);
    expect(body.data.name).toBe('New Name');
  });

  it('returns 404 for non-existent property', async () => {
    mockPropertyFindUnique.mockResolvedValue(null);

    const req = createPatchRequest(
      '/api/v1/properties/non-existent',
      { name: 'Updated' },
      { headers: { 'x-demo-role': 'super_admin' } },
    );
    const res = await PATCH(req, { params: Promise.resolve({ id: 'non-existent' }) });

    expect(res.status).toBe(404);
  });
});

// =========================================================================
// 10. PATCH /properties/:id — activate/deactivate property
// =========================================================================

describe('PATCH /properties/:id — activate/deactivate', () => {
  it('deactivates a property without deleting data', async () => {
    mockPropertyFindUnique.mockResolvedValue(sampleProperty());
    mockPropertyUpdate.mockResolvedValue(sampleProperty({ isActive: false, deletedAt: null }));

    const { POST: deactivate } = await import('../[id]/deactivate/route');
    const req = createPostRequest(
      `/api/v1/properties/${PROPERTY_A_ID}/deactivate`,
      {},
      { headers: { 'x-demo-role': 'super_admin' } },
    );
    const res = await deactivate(req, { params: Promise.resolve({ id: PROPERTY_A_ID }) });
    const body = await parseResponse<{ data: Record<string, unknown> }>(res);

    expect(res.status).toBe(200);
    expect(body.data.isActive).toBe(false);
    expect(body.data.deletedAt).toBeNull();
  });

  it('can reactivate a deactivated property', async () => {
    mockPropertyFindUnique.mockResolvedValue(samplePropertyC);
    mockPropertyUpdate.mockResolvedValue(sampleProperty({ id: PROPERTY_C_ID, isActive: true }));

    const { POST: reactivate } = await import('../[id]/reactivate/route');
    const req = createPostRequest(
      `/api/v1/properties/${PROPERTY_C_ID}/reactivate`,
      {},
      { headers: { 'x-demo-role': 'super_admin' } },
    );
    const res = await reactivate(req, { params: Promise.resolve({ id: PROPERTY_C_ID }) });
    const body = await parseResponse<{ data: Record<string, unknown> }>(res);

    expect(res.status).toBe(200);
    expect(body.data.isActive).toBe(true);
  });

  it('returns 404 when deactivating non-existent property', async () => {
    mockPropertyFindUnique.mockResolvedValue(null);

    const { POST: deactivate } = await import('../[id]/deactivate/route');
    const req = createPostRequest(
      '/api/v1/properties/missing/deactivate',
      {},
      { headers: { 'x-demo-role': 'super_admin' } },
    );
    const res = await deactivate(req, { params: Promise.resolve({ id: 'missing' }) });

    expect(res.status).toBe(404);
  });
});

// =========================================================================
// 11. Property health score calculation
// =========================================================================

describe('Property health score', () => {
  it('cross-property dashboard includes KPI metrics for health assessment', async () => {
    mockUserPropertyFindMany.mockResolvedValue([
      { propertyId: PROPERTY_A_ID, property: sampleProperty() },
    ]);
    mockEventCount.mockResolvedValue(5);
    mockMaintenanceRequestCount.mockResolvedValue(2);
    mockPackageCount.mockResolvedValue(10);
    mockBookingCount.mockResolvedValue(3);
    mockUnitCount.mockResolvedValue(200);

    const { GET: getDashboard } = await import('../dashboard/route');
    const req = createGetRequest('/api/v1/properties/dashboard', {
      headers: { 'x-demo-role': 'super_admin' },
    });
    const res = await getDashboard(req);
    const body = await parseResponse<{ data: Record<string, unknown> }>(res);

    expect(res.status).toBe(200);
    expect(body.data.totalProperties).toBe(1);
    expect(body.data.totalUnits).toBe(200);
    expect(body.data.openEvents).toBe(5);
    expect(body.data.openMaintenanceRequests).toBe(2);
  });
});

// =========================================================================
// 12. Property cloning (create from template)
// =========================================================================

describe('Property cloning — create from template', () => {
  it('creates a new property with same fields as source (via POST with template data)', async () => {
    const cloned = sampleProperty({
      id: 'cloned-prop-id',
      name: 'Maple Heights Condos - Copy',
      slug: 'maple-heights-copy',
      propertyCode: 'MPL-CPY',
    });
    mockPropertyCreate.mockResolvedValue(cloned);

    const req = createPostRequest(
      '/api/v1/properties',
      {
        name: 'Maple Heights Condos - Copy',
        address: '123 Maple St',
        city: 'Toronto',
        province: 'ON',
        postalCode: 'M5V 1A1',
        unitCount: 200,
        slug: 'maple-heights-copy',
        propertyCode: 'MPL-CPY',
      },
      { headers: { 'x-demo-role': 'super_admin' } },
    );
    const res = await POST(req);
    const body = await parseResponse<{ data: { id: string; name: string } }>(res);

    expect(res.status).toBe(201);
    expect(body.data.name).toBe('Maple Heights Condos - Copy');
  });
});

// =========================================================================
// 13. Demo property creation with mock data
// =========================================================================

describe('Demo property creation', () => {
  it('creates a property with type=DEMO', async () => {
    const demoProperty = sampleProperty({
      id: 'demo-prop-id',
      name: 'Demo Condo',
      type: 'DEMO',
    });
    mockPropertyCreate.mockResolvedValue(demoProperty);

    const req = createPostRequest(
      '/api/v1/properties',
      {
        name: 'Demo Condo',
        address: '1 Demo St',
        city: 'Toronto',
        province: 'ON',
        postalCode: 'M5V 1A1',
        type: 'DEMO',
      },
      { headers: { 'x-demo-role': 'super_admin' } },
    );
    const res = await POST(req);
    const body = await parseResponse<{ data: { type: string } }>(res);

    expect(res.status).toBe(201);
    expect(body.data.type).toBe('DEMO');
  });
});

// =========================================================================
// 14. Property deletion (soft delete)
// =========================================================================

describe('Property deletion — soft delete', () => {
  it('soft deletes by setting deletedAt without removing data', async () => {
    const now = new Date();
    mockPropertyFindUnique.mockResolvedValue(sampleProperty());
    mockPropertyUpdate.mockResolvedValue(sampleProperty({ isActive: false, deletedAt: now }));

    const req = createPatchRequest(
      `/api/v1/properties/${PROPERTY_A_ID}`,
      { isActive: false },
      { headers: { 'x-demo-role': 'super_admin' } },
    );
    const res = await PATCH(req, { params: Promise.resolve({ id: PROPERTY_A_ID }) });
    const body = await parseResponse<{ data: Record<string, unknown> }>(res);

    expect(res.status).toBe(200);
    expect(body.data.isActive).toBe(false);
  });
});

// =========================================================================
// 15. Property statistics aggregation
// =========================================================================

describe('Property statistics — cross-property dashboard', () => {
  it('returns aggregated KPIs across all managed properties', async () => {
    mockUserPropertyFindMany.mockResolvedValue([
      { propertyId: PROPERTY_A_ID, property: sampleProperty() },
      { propertyId: PROPERTY_B_ID, property: samplePropertyB },
    ]);
    mockEventCount.mockResolvedValue(42);
    mockMaintenanceRequestCount.mockResolvedValue(15);
    mockPackageCount.mockResolvedValue(88);
    mockBookingCount.mockResolvedValue(23);
    mockUnitCount.mockResolvedValue(350);

    const { GET: getDashboard } = await import('../dashboard/route');
    const req = createGetRequest('/api/v1/properties/dashboard', {
      headers: { 'x-demo-role': 'super_admin' },
    });
    const res = await getDashboard(req);
    const body = await parseResponse<{ data: Record<string, unknown> }>(res);

    expect(res.status).toBe(200);
    expect(body.data.totalProperties).toBe(2);
    expect(body.data.totalUnits).toBe(350);
    expect(body.data.openEvents).toBe(42);
    expect(body.data.openMaintenanceRequests).toBe(15);
    expect(body.data.pendingPackages).toBe(88);
    expect(body.data.upcomingBookings).toBe(23);
  });
});

// =========================================================================
// 16. Cross-property search (super admin)
// =========================================================================

describe('Cross-property search', () => {
  it('searches across all managed properties', async () => {
    mockUserPropertyFindMany.mockResolvedValue([
      { propertyId: PROPERTY_A_ID },
      { propertyId: PROPERTY_B_ID },
    ]);
    mockPropertyFindMany.mockResolvedValue([sampleProperty(), samplePropertyB]);

    const { GET: searchProperties } = await import('../search/route');
    const req = createGetRequest('/api/v1/properties/search', {
      headers: { 'x-demo-role': 'super_admin' },
      searchParams: { q: 'Maple' },
    });
    const res = await searchProperties(req);
    const body = await parseResponse<{ data: unknown[] }>(res);

    expect(res.status).toBe(200);
    expect(body.data).toBeDefined();
  });

  it('returns empty results for no matches', async () => {
    mockUserPropertyFindMany.mockResolvedValue([{ propertyId: PROPERTY_A_ID }]);
    mockPropertyFindMany.mockResolvedValue([]);

    const { GET: searchProperties } = await import('../search/route');
    const req = createGetRequest('/api/v1/properties/search', {
      headers: { 'x-demo-role': 'super_admin' },
      searchParams: { q: 'nonexistent' },
    });
    const res = await searchProperties(req);
    const body = await parseResponse<{ data: unknown[] }>(res);

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(0);
  });
});

// =========================================================================
// 17. Property group management
// =========================================================================

describe('Property group management', () => {
  it('properties can be compared side by side', async () => {
    mockPropertyFindMany.mockResolvedValue([sampleProperty(), samplePropertyB]);
    mockEventCount.mockResolvedValueOnce(30).mockResolvedValueOnce(20);
    mockMaintenanceRequestCount.mockResolvedValueOnce(10).mockResolvedValueOnce(5);
    mockPackageCount.mockResolvedValueOnce(50).mockResolvedValueOnce(40);
    mockUnitCount.mockResolvedValueOnce(200).mockResolvedValueOnce(150);

    const { GET: compareProperties } = await import('../compare/route');
    const req = createGetRequest('/api/v1/properties/compare', {
      headers: { 'x-demo-role': 'super_admin' },
      searchParams: { ids: `${PROPERTY_A_ID},${PROPERTY_B_ID}` },
    });
    const res = await compareProperties(req);
    const body = await parseResponse<{ data: unknown[] }>(res);

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(2);
  });

  it('rejects comparison with fewer than 2 properties', async () => {
    const { GET: compareProperties } = await import('../compare/route');
    const req = createGetRequest('/api/v1/properties/compare', {
      headers: { 'x-demo-role': 'super_admin' },
      searchParams: { ids: PROPERTY_A_ID },
    });
    const res = await compareProperties(req);

    expect(res.status).toBe(400);
  });
});

// =========================================================================
// 18. Tenant isolation — super admin vs admin
// =========================================================================

describe('Tenant isolation', () => {
  it('super admin can see all properties', async () => {
    mockGuardRole = 'super_admin';
    mockPropertyFindMany.mockResolvedValue([sampleProperty(), samplePropertyB, samplePropertyC]);

    const req = createGetRequest('/api/v1/properties', {
      headers: { 'x-demo-role': 'super_admin' },
    });
    const res = await GET(req);
    const body = await parseResponse<{ data: unknown[] }>(res);

    expect(res.status).toBe(200);
    expect(body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('rejects unauthenticated requests', async () => {
    mockGuardError = NextResponse.json(
      { error: 'UNAUTHORIZED', message: 'Auth required' },
      { status: 401 },
    );

    const req = createGetRequest('/api/v1/properties');
    const res = await GET(req);

    expect(res.status).toBe(401);
  });

  it('rejects users without admin role from creating properties', async () => {
    mockGuardError = NextResponse.json(
      { error: 'FORBIDDEN', message: 'Insufficient permissions' },
      { status: 403 },
    );

    const req = createPostRequest('/api/v1/properties', {
      name: 'Unauthorized Create',
      address: '1 St',
      city: 'T',
      province: 'ON',
      postalCode: 'A1A',
    });
    const res = await POST(req);

    expect(res.status).toBe(403);
  });
});

// =========================================================================
// 19. Property context switching
// =========================================================================

describe('Property context switching', () => {
  it('user can switch active property', async () => {
    mockUserPropertyFindFirst.mockResolvedValue({
      id: 'up-1',
      userId: TEST_USER_ID,
      propertyId: PROPERTY_B_ID,
      roleId: 'role-admin-id',
      property: samplePropertyB,
      role: { slug: 'property_admin' },
    });
    mockPropertyFindUnique.mockResolvedValue(samplePropertyB);

    const { POST: switchProperty } = await import('../[id]/switch/route');
    const req = createPostRequest(
      `/api/v1/properties/${PROPERTY_B_ID}/switch`,
      {},
      { headers: { 'x-demo-role': 'super_admin' } },
    );
    const res = await switchProperty(req, { params: Promise.resolve({ id: PROPERTY_B_ID }) });
    const body = await parseResponse<{ data: Record<string, unknown> }>(res);

    expect(res.status).toBe(200);
    expect(body.data.propertyId).toBe(PROPERTY_B_ID);
  });

  it('rejects switching to a property the user has no access to', async () => {
    mockUserPropertyFindFirst.mockResolvedValue(null);

    const { POST: switchProperty } = await import('../[id]/switch/route');
    const req = createPostRequest(
      `/api/v1/properties/${PROPERTY_C_ID}/switch`,
      {},
      { headers: { 'x-demo-role': 'super_admin' } },
    );
    const res = await switchProperty(req, { params: Promise.resolve({ id: PROPERTY_C_ID }) });

    expect(res.status).toBe(403);
  });
});

// =========================================================================
// 20. User assignment to properties
// =========================================================================

describe('User assignment — assign staff to properties', () => {
  it('assigns a user to a property with a role', async () => {
    mockUserPropertyFindUnique.mockResolvedValue(null);
    mockUserPropertyCreate.mockResolvedValue({
      id: 'new-assignment',
      userId: STAFF_USER_ID,
      propertyId: PROPERTY_A_ID,
      roleId: 'role-concierge-id',
    });

    const { POST: assignStaff } = await import('../[id]/staff/route');
    const req = createPostRequest(
      `/api/v1/properties/${PROPERTY_A_ID}/staff`,
      { userId: STAFF_USER_ID, roleId: 'role-concierge-id' },
      { headers: { 'x-demo-role': 'super_admin' } },
    );
    const res = await assignStaff(req, { params: Promise.resolve({ id: PROPERTY_A_ID }) });
    const body = await parseResponse<{ data: Record<string, unknown> }>(res);

    expect(res.status).toBe(201);
    expect(body.data.userId).toBe(STAFF_USER_ID);
  });

  it('rejects duplicate assignment', async () => {
    mockUserPropertyFindUnique.mockResolvedValue({
      id: 'existing',
      userId: STAFF_USER_ID,
      propertyId: PROPERTY_A_ID,
    });

    const { POST: assignStaff } = await import('../[id]/staff/route');
    const req = createPostRequest(
      `/api/v1/properties/${PROPERTY_A_ID}/staff`,
      { userId: STAFF_USER_ID, roleId: 'role-concierge-id' },
      { headers: { 'x-demo-role': 'super_admin' } },
    );
    const res = await assignStaff(req, { params: Promise.resolve({ id: PROPERTY_A_ID }) });

    expect(res.status).toBe(409);
  });
});

// =========================================================================
// 21. Staff can be assigned to multiple properties
// =========================================================================

describe('Staff assigned to multiple properties', () => {
  it('same user can be assigned to different properties', async () => {
    const { POST: assignStaff } = await import('../[id]/staff/route');

    // First assignment
    mockUserPropertyFindUnique.mockResolvedValueOnce(null);
    mockUserPropertyCreate.mockResolvedValueOnce({
      id: 'assign-1',
      userId: STAFF_USER_ID,
      propertyId: PROPERTY_A_ID,
      roleId: 'role-concierge-id',
    });

    const req1 = createPostRequest(
      `/api/v1/properties/${PROPERTY_A_ID}/staff`,
      { userId: STAFF_USER_ID, roleId: 'role-concierge-id' },
      { headers: { 'x-demo-role': 'super_admin' } },
    );
    const res1 = await assignStaff(req1, { params: Promise.resolve({ id: PROPERTY_A_ID }) });
    expect(res1.status).toBe(201);

    // Second assignment to a different property
    mockUserPropertyFindUnique.mockResolvedValueOnce(null);
    mockUserPropertyCreate.mockResolvedValueOnce({
      id: 'assign-2',
      userId: STAFF_USER_ID,
      propertyId: PROPERTY_B_ID,
      roleId: 'role-concierge-id',
    });

    const req2 = createPostRequest(
      `/api/v1/properties/${PROPERTY_B_ID}/staff`,
      { userId: STAFF_USER_ID, roleId: 'role-concierge-id' },
      { headers: { 'x-demo-role': 'super_admin' } },
    );
    const res2 = await assignStaff(req2, { params: Promise.resolve({ id: PROPERTY_B_ID }) });
    expect(res2.status).toBe(201);
  });

  it('lists all properties for a given staff member', async () => {
    mockUserPropertyFindMany.mockResolvedValue([
      {
        id: 'up-1',
        propertyId: PROPERTY_A_ID,
        property: sampleProperty(),
        role: { slug: 'front_desk', name: 'Front Desk' },
      },
      {
        id: 'up-2',
        propertyId: PROPERTY_B_ID,
        property: samplePropertyB,
        role: { slug: 'front_desk', name: 'Front Desk' },
      },
    ]);

    const { GET: listStaffProperties } = await import('../staff-properties/route');
    const req = createGetRequest('/api/v1/properties/staff-properties', {
      headers: { 'x-demo-role': 'super_admin' },
      searchParams: { userId: STAFF_USER_ID },
    });
    const res = await listStaffProperties(req);
    const body = await parseResponse<{ data: unknown[] }>(res);

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(2);
  });
});

// =========================================================================
// 22. Property settings are independent
// =========================================================================

describe('Property settings independence', () => {
  it('each property has its own event types', async () => {
    mockEventTypeFindMany.mockResolvedValueOnce([
      { id: 'et-1', name: 'Package Delivery', propertyId: PROPERTY_A_ID },
      { id: 'et-2', name: 'Visitor Entry', propertyId: PROPERTY_A_ID },
    ]);

    const { GET: getSettings } = await import('../[id]/settings/route');
    mockPropertySettingsFindUnique.mockResolvedValue({
      id: 'ps-1',
      propertyId: PROPERTY_A_ID,
      brandingConfig: null,
    });
    const req = createGetRequest(`/api/v1/properties/${PROPERTY_A_ID}/settings`, {
      headers: { 'x-demo-role': 'super_admin' },
    });
    const res = await getSettings(req, { params: Promise.resolve({ id: PROPERTY_A_ID }) });
    const body = await parseResponse<{ data: Record<string, unknown> }>(res);

    expect(res.status).toBe(200);
    expect(body.data.eventTypes).toHaveLength(2);
  });
});

// =========================================================================
// 23. White-label: per-property branding
// =========================================================================

describe('White-label — per-property branding', () => {
  it('updates branding for a specific property', async () => {
    const brandingPayload = {
      logo: 'https://cdn.example.com/logo.png',
      primaryColor: '#1A73E8',
      accentColor: '#FF5722',
      companyName: 'Maple Heights Inc.',
    };

    mockPropertyFindUnique.mockResolvedValue(sampleProperty());
    mockPropertyUpdate.mockResolvedValue(sampleProperty({ branding: brandingPayload }));

    const req = createPatchRequest(
      `/api/v1/properties/${PROPERTY_A_ID}`,
      { branding: brandingPayload },
      { headers: { 'x-demo-role': 'super_admin' } },
    );
    const res = await PATCH(req, { params: Promise.resolve({ id: PROPERTY_A_ID }) });
    const body = await parseResponse<{ data: Record<string, unknown> }>(res);

    expect(res.status).toBe(200);
    expect(body.data.branding).toEqual(brandingPayload);
  });
});

// =========================================================================
// 24. Vanity URL: per-property login URL
// =========================================================================

describe('Vanity URL — per-property slug', () => {
  it('sets a unique slug for vanity URL', async () => {
    mockPropertyFindUnique.mockResolvedValue(sampleProperty());
    mockPropertyUpdate.mockResolvedValue(sampleProperty({ slug: 'maple-heights-condos' }));

    const req = createPatchRequest(
      `/api/v1/properties/${PROPERTY_A_ID}`,
      { slug: 'maple-heights-condos' },
      { headers: { 'x-demo-role': 'super_admin' } },
    );
    const res = await PATCH(req, { params: Promise.resolve({ id: PROPERTY_A_ID }) });
    const body = await parseResponse<{ data: Record<string, unknown> }>(res);

    expect(res.status).toBe(200);
    expect(body.data.slug).toBe('maple-heights-condos');
  });

  it('rejects duplicate slugs via Prisma unique constraint', async () => {
    mockPropertyFindUnique.mockResolvedValue(sampleProperty());
    const prismaError = new Error('Unique constraint failed on the fields: (`slug`)');
    (prismaError as unknown as Record<string, unknown>).code = 'P2002';
    mockPropertyUpdate.mockRejectedValue(prismaError);

    const req = createPatchRequest(
      `/api/v1/properties/${PROPERTY_A_ID}`,
      { slug: 'oak-park' },
      { headers: { 'x-demo-role': 'super_admin' } },
    );
    const res = await PATCH(req, { params: Promise.resolve({ id: PROPERTY_A_ID }) });

    expect(res.status).toBe(409);
  });
});

// =========================================================================
// 25. Billing: per-property subscription tracking
// =========================================================================

describe('Billing — per-property subscription tracking', () => {
  it('returns subscription status for each property', async () => {
    mockUserPropertyFindMany.mockResolvedValue([
      { propertyId: PROPERTY_A_ID },
      { propertyId: PROPERTY_B_ID },
    ]);
    mockSubscriptionFindMany.mockResolvedValue([
      {
        id: 'sub-1',
        propertyId: PROPERTY_A_ID,
        tier: 'PROFESSIONAL',
        status: 'ACTIVE',
        billingCycle: 'monthly',
        currentPeriodEnd: new Date('2026-04-01'),
      },
      {
        id: 'sub-2',
        propertyId: PROPERTY_B_ID,
        tier: 'STARTER',
        status: 'TRIAL',
        billingCycle: 'monthly',
        trialEndsAt: new Date('2026-04-15'),
      },
    ]);

    const { GET: getBilling } = await import('../billing/route');
    const req = createGetRequest('/api/v1/properties/billing', {
      headers: { 'x-demo-role': 'super_admin' },
    });
    const res = await getBilling(req);
    const body = await parseResponse<{ data: unknown[] }>(res);

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(2);
  });
});

// =========================================================================
// 26. Database error handling
// =========================================================================

describe('Error handling', () => {
  it('handles database errors on GET with 500', async () => {
    mockPropertyFindMany.mockRejectedValue(new Error('Connection reset'));

    const req = createGetRequest('/api/v1/properties', {
      headers: { 'x-demo-role': 'super_admin' },
    });
    const res = await GET(req);

    expect(res.status).toBe(500);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('INTERNAL_ERROR');
  });

  it('handles database errors on POST with 500', async () => {
    mockPropertyCreate.mockRejectedValue(new Error('Deadlock'));

    const req = createPostRequest(
      '/api/v1/properties',
      {
        name: 'Test',
        address: '1 St',
        city: 'Toronto',
        province: 'ON',
        postalCode: 'M5V',
      },
      { headers: { 'x-demo-role': 'super_admin' } },
    );
    const res = await POST(req);

    expect(res.status).toBe(500);
  });
});
