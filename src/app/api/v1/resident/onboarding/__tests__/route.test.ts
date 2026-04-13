/**
 * Concierge — Resident Onboarding API Route Tests
 *
 * GET  /api/v1/resident/onboarding — Returns onboarding status
 * POST /api/v1/resident/onboarding — Saves step data
 *
 * Tests for step completion status, profile save, emergency contacts,
 * vehicles, pets, complete activation, validation errors, and role restrictions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import { createGetRequest, createPostRequest, parseResponse } from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Mock Prisma client
vi.mock('@/server/db', () => ({
  prisma: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    emergencyContact: {
      count: vi.fn(),
      create: vi.fn(),
    },
    vehicle: {
      count: vi.fn(),
      create: vi.fn(),
    },
    pet: {
      count: vi.fn(),
      create: vi.fn(),
    },
    unit: {
      findUnique: vi.fn(),
    },
    property: {
      findUnique: vi.fn(),
    },
  },
  default: {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    emergencyContact: {
      count: vi.fn(),
      create: vi.fn(),
    },
    vehicle: {
      count: vi.fn(),
      create: vi.fn(),
    },
    pet: {
      count: vi.fn(),
      create: vi.fn(),
    },
    unit: {
      findUnique: vi.fn(),
    },
    property: {
      findUnique: vi.fn(),
    },
  },
}));

// Mock guardRoute
vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: vi.fn(),
}));

// Import after mocks
import { GET, POST } from '@/app/api/v1/resident/onboarding/route';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';
import { NextResponse } from 'next/server';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const USER_ID = '550e8400-e29b-41d4-a716-446655440001';
const PROPERTY_ID = '550e8400-e29b-41d4-a716-446655440010';
const UNIT_ID = '550e8400-e29b-41d4-a716-446655440020';

function mockAuthSuccess(overrides: Record<string, unknown> = {}) {
  vi.mocked(guardRoute).mockResolvedValue({
    user: {
      userId: USER_ID,
      propertyId: PROPERTY_ID,
      unitId: UNIT_ID,
      role: 'resident_owner',
      permissions: ['*'],
      mfaVerified: true,
      ...overrides,
    },
    error: null,
  } as any);
}

function mockAuthForbidden(role = 'property_admin') {
  vi.mocked(guardRoute).mockResolvedValue({
    user: null,
    error: NextResponse.json(
      {
        error: 'FORBIDDEN',
        message: `Role '${role}' does not have access to this resource.`,
      },
      { status: 403 },
    ),
  } as any);
}

// ---------------------------------------------------------------------------
// GET /api/v1/resident/onboarding
// ---------------------------------------------------------------------------

describe('GET /api/v1/resident/onboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns 200 with correct shape including all step statuses', async () => {
    mockAuthSuccess();

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      firstName: 'Jane',
      lastName: 'Doe',
      phone: '+14165551234',
      activatedAt: null,
      languagePreference: 'en',
    } as any);

    vi.mocked(prisma.emergencyContact.count).mockResolvedValue(2);
    vi.mocked(prisma.vehicle.count).mockResolvedValue(1);
    vi.mocked(prisma.pet.count).mockResolvedValue(0);
    vi.mocked(prisma.unit.findUnique).mockResolvedValue({ number: '815' } as any);
    vi.mocked(prisma.property.findUnique).mockResolvedValue({ name: 'Maple Tower' } as any);

    const req = createGetRequest('/api/v1/resident/onboarding');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await parseResponse(res);
    const data = (body as any).data;

    // Shape assertions
    expect(data).toHaveProperty('completed');
    expect(data).toHaveProperty('steps');
    expect(data).toHaveProperty('counts');
    expect(data).toHaveProperty('residentType');
    expect(data).toHaveProperty('unitNumber');
    expect(data).toHaveProperty('propertyName');
    expect(data).toHaveProperty('firstName');

    // Step statuses
    expect(data.steps.welcome).toBe(true);
    expect(data.steps.profile).toBe(true); // phone is set
    expect(data.steps.emergencyContacts).toBe(true); // count > 0
    expect(data.steps.vehicles).toBe(true); // count > 0
    expect(data.steps.pets).toBe(false); // count === 0
    expect(data.steps.complete).toBe(false); // activatedAt is null

    // Counts
    expect(data.counts.emergencyContacts).toBe(2);
    expect(data.counts.vehicles).toBe(1);
    expect(data.counts.pets).toBe(0);

    // Metadata
    expect(data.completed).toBe(false);
    expect(data.residentType).toBe('Owner');
    expect(data.unitNumber).toBe('815');
    expect(data.propertyName).toBe('Maple Tower');
    expect(data.firstName).toBe('Jane');
  });

  it('returns completed = true when user has activatedAt set', async () => {
    mockAuthSuccess();

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      firstName: 'Jane',
      lastName: 'Doe',
      phone: '+14165551234',
      activatedAt: new Date('2025-01-15'),
      languagePreference: 'en',
    } as any);

    vi.mocked(prisma.emergencyContact.count).mockResolvedValue(1);
    vi.mocked(prisma.vehicle.count).mockResolvedValue(0);
    vi.mocked(prisma.pet.count).mockResolvedValue(0);
    vi.mocked(prisma.unit.findUnique).mockResolvedValue({ number: '302' } as any);
    vi.mocked(prisma.property.findUnique).mockResolvedValue({ name: 'Oak Place' } as any);

    const req = createGetRequest('/api/v1/resident/onboarding');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await parseResponse(res);
    expect((body as any).data.completed).toBe(true);
    expect((body as any).data.steps.complete).toBe(true);
  });

  it('returns 404 when user is not found', async () => {
    mockAuthSuccess();
    vi.mocked(prisma.user.findUnique).mockResolvedValue(null);

    const req = createGetRequest('/api/v1/resident/onboarding');
    const res = await GET(req);

    expect(res.status).toBe(404);
    const body = await parseResponse(res);
    expect((body as any).error).toBe('NOT_FOUND');
  });

  it('maps resident_tenant role to Tenant label', async () => {
    mockAuthSuccess({ role: 'resident_tenant' });

    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      firstName: 'Bob',
      lastName: 'Smith',
      phone: null,
      activatedAt: null,
      languagePreference: 'en',
    } as any);

    vi.mocked(prisma.emergencyContact.count).mockResolvedValue(0);
    vi.mocked(prisma.vehicle.count).mockResolvedValue(0);
    vi.mocked(prisma.pet.count).mockResolvedValue(0);
    vi.mocked(prisma.unit.findUnique).mockResolvedValue({ number: '101' } as any);
    vi.mocked(prisma.property.findUnique).mockResolvedValue({ name: 'Test' } as any);

    const req = createGetRequest('/api/v1/resident/onboarding');
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await parseResponse(res);
    expect((body as any).data.residentType).toBe('Tenant');
  });

  it('returns 403 for non-resident role (property_admin)', async () => {
    mockAuthForbidden('property_admin');

    const req = createGetRequest('/api/v1/resident/onboarding');
    const res = await GET(req);

    expect(res.status).toBe(403);
    const body = await parseResponse(res);
    expect((body as any).error).toBe('FORBIDDEN');
  });
});

// ---------------------------------------------------------------------------
// POST /api/v1/resident/onboarding
// ---------------------------------------------------------------------------

describe('POST /api/v1/resident/onboarding', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  // Profile step
  // -------------------------------------------------------------------------

  describe('step: profile', () => {
    it('saves phone and language preference', async () => {
      mockAuthSuccess();
      vi.mocked(prisma.user.update).mockResolvedValue({} as any);

      const req = createPostRequest('/api/v1/resident/onboarding', {
        step: 'profile',
        data: { phone: '+14165559999', language: 'fr' },
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
      const body = await parseResponse(res);
      expect((body as any).data.saved).toBe(true);
      expect((body as any).data.step).toBe('profile');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: USER_ID },
        data: expect.objectContaining({
          phone: '+14165559999',
          languagePreference: 'fr',
        }),
      });
    });

    it('saves accessibility fields when provided', async () => {
      mockAuthSuccess();
      vi.mocked(prisma.user.update).mockResolvedValue({} as any);

      const req = createPostRequest('/api/v1/resident/onboarding', {
        step: 'profile',
        data: {
          phone: '+14165550000',
          accessibilityNeeds: true,
          accessibilityNotes: 'Wheelchair access needed',
        },
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: USER_ID },
        data: expect.objectContaining({
          assistanceRequired: true,
          assistanceNotes: 'Wheelchair access needed',
        }),
      });
    });
  });

  // -------------------------------------------------------------------------
  // Emergency Contacts step
  // -------------------------------------------------------------------------

  describe('step: emergencyContacts', () => {
    it('creates emergency contacts', async () => {
      mockAuthSuccess();
      vi.mocked(prisma.emergencyContact.create).mockResolvedValue({ id: 'ec-1' } as any);

      const req = createPostRequest('/api/v1/resident/onboarding', {
        step: 'emergencyContacts',
        data: {
          contacts: [
            { name: 'Mom', phone: '+14165551111', relationship: 'Mother', email: 'mom@test.com' },
            { name: 'Dad', phone: '+14165552222', relationship: 'Father' },
          ],
        },
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
      const body = await parseResponse(res);
      expect((body as any).data.saved).toBe(true);
      expect((body as any).data.count).toBe(2);

      expect(prisma.emergencyContact.create).toHaveBeenCalledTimes(2);
      expect(prisma.emergencyContact.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          propertyId: PROPERTY_ID,
          unitId: UNIT_ID,
          userId: USER_ID,
          contactName: 'Mom',
          phonePrimary: '+14165551111',
          relationship: 'Mother',
          email: 'mom@test.com',
          sortOrder: 0,
        }),
      });
    });

    it('caps contacts at 3', async () => {
      mockAuthSuccess();
      vi.mocked(prisma.emergencyContact.create).mockResolvedValue({ id: 'ec-x' } as any);

      const contacts = Array.from({ length: 5 }, (_, i) => ({
        name: `Contact ${i}`,
        phone: `+1416555000${i}`,
        relationship: 'Friend',
      }));

      const req = createPostRequest('/api/v1/resident/onboarding', {
        step: 'emergencyContacts',
        data: { contacts },
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
      // Only first 3 should be created
      expect(prisma.emergencyContact.create).toHaveBeenCalledTimes(3);
    });

    it('returns 400 when contacts array is empty', async () => {
      mockAuthSuccess();

      const req = createPostRequest('/api/v1/resident/onboarding', {
        step: 'emergencyContacts',
        data: { contacts: [] },
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await parseResponse(res);
      expect((body as any).error).toBe('VALIDATION_ERROR');
      expect((body as any).message).toMatch(/at least one/i);
    });

    it('returns 400 when contacts field is missing', async () => {
      mockAuthSuccess();

      const req = createPostRequest('/api/v1/resident/onboarding', {
        step: 'emergencyContacts',
        data: {},
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
    });

    it('returns 400 when user has no unit assigned', async () => {
      mockAuthSuccess({ unitId: undefined });

      const req = createPostRequest('/api/v1/resident/onboarding', {
        step: 'emergencyContacts',
        data: {
          contacts: [{ name: 'Mom', phone: '+14165551111', relationship: 'Mother' }],
        },
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await parseResponse(res);
      expect((body as any).message).toMatch(/no unit/i);
    });
  });

  // -------------------------------------------------------------------------
  // Vehicles step
  // -------------------------------------------------------------------------

  describe('step: vehicles', () => {
    it('creates vehicles', async () => {
      mockAuthSuccess();
      vi.mocked(prisma.vehicle.create).mockResolvedValue({ id: 'v-1' } as any);

      const req = createPostRequest('/api/v1/resident/onboarding', {
        step: 'vehicles',
        data: {
          vehicles: [
            {
              make: 'Honda',
              model: 'Civic',
              licensePlate: 'ABC1234',
              color: 'Blue',
              province: 'ON',
            },
          ],
        },
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
      const body = await parseResponse(res);
      expect((body as any).data.saved).toBe(true);
      expect((body as any).data.count).toBe(1);

      expect(prisma.vehicle.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          propertyId: PROPERTY_ID,
          unitId: UNIT_ID,
          userId: USER_ID,
          make: 'Honda',
          model: 'Civic',
          licensePlate: 'ABC1234',
          color: 'Blue',
          provinceState: 'ON',
        }),
      });
    });

    it('caps vehicles at 5', async () => {
      mockAuthSuccess();
      vi.mocked(prisma.vehicle.create).mockResolvedValue({ id: 'v-x' } as any);

      const vehicles = Array.from({ length: 8 }, (_, i) => ({
        make: 'Toyota',
        model: 'Corolla',
        licensePlate: `PLATE${i}`,
      }));

      const req = createPostRequest('/api/v1/resident/onboarding', {
        step: 'vehicles',
        data: { vehicles },
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
      expect(prisma.vehicle.create).toHaveBeenCalledTimes(5);
    });

    it('returns skipped when data.skipped is true', async () => {
      mockAuthSuccess();

      const req = createPostRequest('/api/v1/resident/onboarding', {
        step: 'vehicles',
        data: { skipped: true },
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
      const body = await parseResponse(res);
      expect((body as any).data.skipped).toBe(true);
      expect(prisma.vehicle.create).not.toHaveBeenCalled();
    });

    it('returns skipped when vehicles array is empty', async () => {
      mockAuthSuccess();

      const req = createPostRequest('/api/v1/resident/onboarding', {
        step: 'vehicles',
        data: { vehicles: [] },
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
      const body = await parseResponse(res);
      expect((body as any).data.skipped).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Pets step
  // -------------------------------------------------------------------------

  describe('step: pets', () => {
    it('creates pets', async () => {
      mockAuthSuccess();
      vi.mocked(prisma.pet.create).mockResolvedValue({ id: 'p-1' } as any);

      const req = createPostRequest('/api/v1/resident/onboarding', {
        step: 'pets',
        data: {
          pets: [{ name: 'Buddy', species: 'Dog', breed: 'Golden Retriever', weight: '30' }],
        },
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
      const body = await parseResponse(res);
      expect((body as any).data.saved).toBe(true);
      expect((body as any).data.count).toBe(1);

      expect(prisma.pet.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          propertyId: PROPERTY_ID,
          unitId: UNIT_ID,
          userId: USER_ID,
          name: 'Buddy',
          species: 'Dog',
          breed: 'Golden Retriever',
          weight: 30,
        }),
      });
    });

    it('caps pets at 5', async () => {
      mockAuthSuccess();
      vi.mocked(prisma.pet.create).mockResolvedValue({ id: 'p-x' } as any);

      const pets = Array.from({ length: 7 }, (_, i) => ({
        name: `Pet${i}`,
        species: 'Cat',
      }));

      const req = createPostRequest('/api/v1/resident/onboarding', {
        step: 'pets',
        data: { pets },
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
      expect(prisma.pet.create).toHaveBeenCalledTimes(5);
    });

    it('returns skipped when data.skipped is true', async () => {
      mockAuthSuccess();

      const req = createPostRequest('/api/v1/resident/onboarding', {
        step: 'pets',
        data: { skipped: true },
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
      const body = await parseResponse(res);
      expect((body as any).data.skipped).toBe(true);
      expect(prisma.pet.create).not.toHaveBeenCalled();
    });

    it('returns skipped when pets array is empty', async () => {
      mockAuthSuccess();

      const req = createPostRequest('/api/v1/resident/onboarding', {
        step: 'pets',
        data: { pets: [] },
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
      const body = await parseResponse(res);
      expect((body as any).data.skipped).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Complete step
  // -------------------------------------------------------------------------

  describe('step: complete', () => {
    it('marks user as activated with activatedAt timestamp', async () => {
      mockAuthSuccess();
      vi.mocked(prisma.user.update).mockResolvedValue({} as any);

      const req = createPostRequest('/api/v1/resident/onboarding', {
        step: 'complete',
      });
      const res = await POST(req);

      expect(res.status).toBe(200);
      const body = await parseResponse(res);
      expect((body as any).data.saved).toBe(true);
      expect((body as any).data.step).toBe('complete');

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: USER_ID },
        data: { activatedAt: expect.any(Date) },
      });
    });

    it('does not require a data object', async () => {
      mockAuthSuccess();
      vi.mocked(prisma.user.update).mockResolvedValue({} as any);

      const req = createPostRequest('/api/v1/resident/onboarding', {
        step: 'complete',
      });
      const res = await POST(req);

      // complete step does not need data — should succeed
      expect(res.status).toBe(200);
    });
  });

  // -------------------------------------------------------------------------
  // Validation errors
  // -------------------------------------------------------------------------

  describe('validation', () => {
    it('returns 400 when step is missing', async () => {
      mockAuthSuccess();

      const req = createPostRequest('/api/v1/resident/onboarding', {
        data: { phone: '+14165550000' },
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await parseResponse(res);
      expect((body as any).error).toBe('VALIDATION_ERROR');
      expect((body as any).message).toMatch(/step is required/i);
    });

    it('returns 400 when data object is missing for non-complete step', async () => {
      mockAuthSuccess();

      const req = createPostRequest('/api/v1/resident/onboarding', {
        step: 'profile',
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await parseResponse(res);
      expect((body as any).error).toBe('VALIDATION_ERROR');
      expect((body as any).message).toMatch(/data object is required/i);
    });

    it('returns 400 for unknown step', async () => {
      mockAuthSuccess();

      const req = createPostRequest('/api/v1/resident/onboarding', {
        step: 'nonexistent',
        data: {},
      });
      const res = await POST(req);

      expect(res.status).toBe(400);
      const body = await parseResponse(res);
      expect((body as any).error).toBe('VALIDATION_ERROR');
      expect((body as any).message).toMatch(/unknown step/i);
    });
  });

  // -------------------------------------------------------------------------
  // Role restriction
  // -------------------------------------------------------------------------

  describe('role restriction', () => {
    it('returns 403 for property_admin role', async () => {
      mockAuthForbidden('property_admin');

      const req = createPostRequest('/api/v1/resident/onboarding', {
        step: 'profile',
        data: { phone: '+14165550000' },
      });
      const res = await POST(req);

      expect(res.status).toBe(403);
      const body = await parseResponse(res);
      expect((body as any).error).toBe('FORBIDDEN');
    });

    it('returns 403 for super_admin role', async () => {
      mockAuthForbidden('super_admin');

      const req = createPostRequest('/api/v1/resident/onboarding', {
        step: 'profile',
        data: { phone: '+14165550000' },
      });
      const res = await POST(req);

      expect(res.status).toBe(403);
    });
  });
});
