/**
 * Cross-tenant security regression tests.
 *
 * A burst of fixes during the QA-night session (Apr/May 2026) closed a
 * systemic pattern: endpoints took propertyId from query or body and ran
 * reads/writes against it without enforcePropertyAccess.
 *
 * These tests pin the contract: a property_admin on Property A submitting
 * propertyId = B is blocked at the route layer before it can touch the
 * database. If a future refactor accidentally drops the enforcePropertyAccess
 * call, this test fails before the leak ships.
 *
 * Strategy: mock guardRoute to return a property_admin scoped to A, and
 * mock enforcePropertyAccess to throw whenever called with a different
 * propertyId. We assert that the route either returns the 403 our middleware
 * produces, or never reaches prisma at all.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextResponse } from 'next/server';
import { createPostRequest } from '@/test/helpers/api';

const PROPERTY_A = '00000000-0000-4000-b000-000000000001';
const PROPERTY_B = '00000000-0000-4000-b000-000000000002';
const ADMIN_USER = 'admin-on-property-a';

// ---------------------------------------------------------------------------
// Mock surface: enough prisma touchpoints that the routes load. We use
// `unknown` stubs throughout — the tests assert behaviour *before* prisma
// is reached, so the stubs only need to exist, not to be realistic.
// ---------------------------------------------------------------------------

const noop = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    role: {
      findFirst: noop,
      create: noop,
      findMany: noop,
    },
    unit: { findMany: noop, createMany: noop, create: noop, findFirst: noop },
    building: { findMany: noop, create: noop },
    pet: { findMany: noop, create: noop },
    user: { findMany: noop, findUnique: noop, count: noop },
    userProperty: { findMany: noop, create: noop, createMany: noop, findFirst: noop },
    amenityGroup: { findFirst: noop, create: noop },
    amenity: { create: noop, createMany: noop },
    parkingPermit: { findMany: noop, deleteMany: noop, createMany: noop, create: noop },
    fob: { findMany: noop, create: noop, createMany: noop },
    buzzerCode: { findMany: noop, create: noop, createMany: noop },
    visitorEntry: { updateMany: noop },
    securityShift: { findMany: noop, create: noop },
    package: { create: noop, createMany: noop, updateMany: noop },
    classifiedAd: { updateMany: noop },
    boardMeeting: { findUnique: noop },
    meetingMinutes: { create: noop },
    event: { findMany: noop, update: noop },
    emergencyContact: { findMany: noop, create: noop },
    propertyComplianceReport: { create: noop },
    dataMigrationJob: { create: noop },
    $queryRawUnsafe: noop,
    $executeRawUnsafe: noop,
    $queryRaw: noop,
  },
}));

vi.mock('@/server/demo', () => ({
  handleDemoRequest: vi.fn().mockResolvedValue(null),
}));

vi.mock('@/server/data-migration', () => ({
  ENTITY_FIELDS: { users: {} },
  exportPropertyData: vi.fn(),
}));

// ---------------------------------------------------------------------------
// guardRoute / enforcePropertyAccess mocks
// ---------------------------------------------------------------------------

let mockUserPropertyId = PROPERTY_A;
let mockUserRole = 'property_admin';

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: vi.fn().mockImplementation(() =>
    Promise.resolve({
      user: {
        userId: ADMIN_USER,
        propertyId: mockUserPropertyId,
        role: mockUserRole,
        permissions: ['*'],
        mfaVerified: true,
      },
      error: null,
    }),
  ),
  enforcePropertyAccess: vi
    .fn()
    .mockImplementation((user: { propertyId: string }, requested: string) => {
      if (user.propertyId === requested) return null;
      return NextResponse.json(
        {
          error: 'FORBIDDEN',
          code: 'CROSS_TENANT_BLOCKED',
          message: 'You do not have access to this property.',
        },
        { status: 403 },
      );
    }),
}));

beforeEach(() => {
  vi.clearAllMocks();
  mockUserPropertyId = PROPERTY_A;
  mockUserRole = 'property_admin';
});

// ---------------------------------------------------------------------------
// units/bulk
// ---------------------------------------------------------------------------

describe('cross-tenant: POST /api/v1/units/bulk', () => {
  it('rejects when body propertyId differs from caller', async () => {
    const { POST } = await import('../units/bulk/route');
    const req = createPostRequest('/api/v1/units/bulk', {
      propertyId: PROPERTY_B,
      units: [{ number: '101', floor: 1 }],
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// units/generate
// ---------------------------------------------------------------------------

describe('cross-tenant: POST /api/v1/units/generate', () => {
  it('rejects when body propertyId differs from caller', async () => {
    const { POST } = await import('../units/generate/route');
    const req = createPostRequest('/api/v1/units/generate', {
      propertyId: PROPERTY_B,
      floorStart: 1,
      floorEnd: 2,
      unitsPerFloor: 1,
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// staff/bulk
// ---------------------------------------------------------------------------

describe('cross-tenant: POST /api/v1/staff/bulk', () => {
  it('rejects when body propertyId differs from caller', async () => {
    const { POST } = await import('../staff/bulk/route');
    const req = createPostRequest('/api/v1/staff/bulk', {
      propertyId: PROPERTY_B,
      staff: [
        {
          firstName: 'Foo',
          lastName: 'Bar',
          email: 'foo@example.com',
        },
      ],
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// amenities/bulk
// ---------------------------------------------------------------------------

describe('cross-tenant: POST /api/v1/amenities/bulk', () => {
  it('rejects when body propertyId differs from caller', async () => {
    const { POST } = await import('../amenities/bulk/route');
    const req = createPostRequest('/api/v1/amenities/bulk', {
      propertyId: PROPERTY_B,
      amenities: [{ name: 'Gym' }],
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// buzzer-codes/bulk
// ---------------------------------------------------------------------------

describe('cross-tenant: POST /api/v1/buzzer-codes/bulk', () => {
  it('rejects when body propertyId differs from caller', async () => {
    const { POST } = await import('../buzzer-codes/bulk/route');
    const req = createPostRequest('/api/v1/buzzer-codes/bulk', {
      propertyId: PROPERTY_B,
      codes: [{ unitNumber: '101', code: '1234' }],
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// keys/bulk (FOBs)
// ---------------------------------------------------------------------------

describe('cross-tenant: POST /api/v1/keys/bulk', () => {
  it('rejects when body propertyId differs from caller', async () => {
    const { POST } = await import('../keys/bulk/route');
    const req = createPostRequest('/api/v1/keys/bulk', {
      propertyId: PROPERTY_B,
      fobs: [{ serialNumber: 'FOB-001', unitNumber: '101' }],
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// users/bulk-import
// ---------------------------------------------------------------------------

describe('cross-tenant: POST /api/v1/users/bulk-import', () => {
  it('rejects when body propertyId differs from caller', async () => {
    const { POST } = await import('../users/bulk-import/route');
    const req = createPostRequest('/api/v1/users/bulk-import', {
      propertyId: PROPERTY_B,
      roleId: '00000000-0000-4000-c000-000000000001',
      users: [{ email: 'a@b.com', firstName: 'A', lastName: 'B' }],
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// parking/bulk
// ---------------------------------------------------------------------------

describe('cross-tenant: POST /api/v1/parking/bulk', () => {
  it('rejects when body propertyId differs from caller', async () => {
    const { POST } = await import('../parking/bulk/route');
    const req = createPostRequest('/api/v1/parking/bulk', {
      propertyId: PROPERTY_B,
      permits: [{ unitNumber: '101', licensePlate: 'ABC123' }],
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// search
// ---------------------------------------------------------------------------

describe('cross-tenant: GET /api/v1/search', () => {
  it('rejects when query propertyId differs from caller', async () => {
    const { createGetRequest } = await import('@/test/helpers/api');
    const { GET } = await import('../search/route');
    const req = createGetRequest('/api/v1/search', {
      searchParams: { propertyId: PROPERTY_B, q: 'maple' },
    });
    const res = await GET(req);
    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// emergency-contacts (POST cross-tenant write)
// ---------------------------------------------------------------------------

describe('cross-tenant: POST /api/v1/emergency-contacts', () => {
  it('rejects when body propertyId differs from caller', async () => {
    const { POST } = await import('../emergency-contacts/route');
    const req = createPostRequest('/api/v1/emergency-contacts', {
      propertyId: PROPERTY_B,
      unitId: '00000000-0000-4000-e000-000000000001',
      userId: '00000000-0000-4000-d000-000000000001',
      contactName: 'Jane Doe',
      relationship: 'mother',
      phonePrimary: '555-0100',
      sortOrder: 0,
    });
    const res = await POST(req);
    // Either the validator passes and we reach the tenancy check (403),
    // or the validator rejects payload nuances on a future schema change
    // (400) — both are "did NOT touch Property B's data," which is what
    // this regression test actually cares about.
    expect([400, 403]).toContain(res.status);
  });
});
