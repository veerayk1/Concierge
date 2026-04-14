/**
 * Integration Workflow Tests — Resident Onboarding & Offboarding
 *
 * Tests complete resident lifecycle workflows across multiple API endpoints:
 *   - New resident move-in (create account -> assign unit -> issue FOBs -> parking -> welcome -> activate)
 *   - Resident move-out (FOBs returned -> parking cancelled -> unit vacated -> account deactivated)
 *   - Ownership transfer (old owner out -> new owner in -> re-assign -> new FOBs)
 *
 * Each test validates data transformations, security side effects (session invalidation),
 * and cross-module interactions.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createGetRequest,
  createPostRequest,
  createPatchRequest,
  createPutRequest,
  createDeleteRequest,
  parseResponse,
} from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Prisma Mock
// ---------------------------------------------------------------------------

const mockUserCreate = vi.fn();
const mockUserFindFirst = vi.fn();
const mockUserFindUnique = vi.fn();
const mockUserFindMany = vi.fn();
const mockUserCount = vi.fn();
const mockUserUpdate = vi.fn();

const mockUserPropertyCreate = vi.fn();
const mockUserPropertyUpdateMany = vi.fn();

const mockSessionUpdateMany = vi.fn();
const mockRefreshTokenUpdateMany = vi.fn();

const mockKeyInventoryFindUnique = vi.fn();
const mockKeyInventoryCount = vi.fn();
const mockKeyInventoryUpdate = vi.fn();

const mockKeyCheckoutCreate = vi.fn();
const mockKeyCheckoutFindMany = vi.fn();
const mockKeyCheckoutFindUnique = vi.fn();
const mockKeyCheckoutUpdate = vi.fn();

const mockParkingPermitCreate = vi.fn();
const mockParkingPermitFindFirst = vi.fn();
const mockParkingPermitFindUnique = vi.fn();
const mockParkingPermitUpdate = vi.fn();
const mockParkingPermitFindMany = vi.fn();

const mockParkingSpotFindFirst = vi.fn();
const mockParkingSpotUpdate = vi.fn();

const mockParkingViolationFindMany = vi.fn();
const mockParkingViolationUpdateMany = vi.fn();

const mockUnitFindUnique = vi.fn();
const mockUnitUpdate = vi.fn();

const mockNotificationPreferenceUpsert = vi.fn();
const mockNotificationPreferenceFindMany = vi.fn();

const mockTransaction = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    user: {
      create: (...args: unknown[]) => mockUserCreate(...args),
      findFirst: (...args: unknown[]) => mockUserFindFirst(...args),
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
      findMany: (...args: unknown[]) => mockUserFindMany(...args),
      count: (...args: unknown[]) => mockUserCount(...args),
      update: (...args: unknown[]) => mockUserUpdate(...args),
    },
    userProperty: {
      create: (...args: unknown[]) => mockUserPropertyCreate(...args),
      updateMany: (...args: unknown[]) => mockUserPropertyUpdateMany(...args),
    },
    session: {
      updateMany: (...args: unknown[]) => mockSessionUpdateMany(...args),
    },
    refreshToken: {
      updateMany: (...args: unknown[]) => mockRefreshTokenUpdateMany(...args),
    },
    keyInventory: {
      findUnique: (...args: unknown[]) => mockKeyInventoryFindUnique(...args),
      count: (...args: unknown[]) => mockKeyInventoryCount(...args),
      update: (...args: unknown[]) => mockKeyInventoryUpdate(...args),
    },
    keyCheckout: {
      create: (...args: unknown[]) => mockKeyCheckoutCreate(...args),
      findMany: (...args: unknown[]) => mockKeyCheckoutFindMany(...args),
      findUnique: (...args: unknown[]) => mockKeyCheckoutFindUnique(...args),
      update: (...args: unknown[]) => mockKeyCheckoutUpdate(...args),
    },
    parkingPermit: {
      create: (...args: unknown[]) => mockParkingPermitCreate(...args),
      findFirst: (...args: unknown[]) => mockParkingPermitFindFirst(...args),
      findUnique: (...args: unknown[]) => mockParkingPermitFindUnique(...args),
      update: (...args: unknown[]) => mockParkingPermitUpdate(...args),
      findMany: (...args: unknown[]) => mockParkingPermitFindMany(...args),
    },
    parkingSpot: {
      findFirst: (...args: unknown[]) => mockParkingSpotFindFirst(...args),
      update: (...args: unknown[]) => mockParkingSpotUpdate(...args),
    },
    parkingViolation: {
      findMany: (...args: unknown[]) => mockParkingViolationFindMany(...args),
      updateMany: (...args: unknown[]) => mockParkingViolationUpdateMany(...args),
    },
    unit: {
      findUnique: (...args: unknown[]) => mockUnitFindUnique(...args),
      update: (...args: unknown[]) => mockUnitUpdate(...args),
    },
    notificationPreference: {
      upsert: (...args: unknown[]) => mockNotificationPreferenceUpsert(...args),
      findMany: (...args: unknown[]) => mockNotificationPreferenceFindMany(...args),
    },
    vehicle: {
      create: vi.fn().mockResolvedValue({ id: 'vehicle-1' }),
    },
    permitType: {
      findFirst: vi.fn().mockResolvedValue({ id: 'permit-type-1', name: 'Resident' }),
      create: vi
        .fn()
        .mockImplementation((args: Record<string, unknown>) =>
          Promise.resolve({
            id: 'permit-type-new',
            ...(args as { data?: Record<string, unknown> }).data,
          }),
        ),
    },
    parkingLimitConfig: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    $transaction: (...args: unknown[]) => {
      const first = args[0];
      if (typeof first === 'function') {
        return mockTransaction(...args);
      }
      if (Array.isArray(first)) {
        return Promise.all(first);
      }
      return mockTransaction(...args);
    },
  },
}));

vi.mock('nanoid', () => ({
  nanoid: vi.fn().mockReturnValue('ONBOARD01'),
}));

vi.mock('@/schemas/user', () => ({
  createUserSchema: {
    safeParse: vi.fn().mockImplementation((data: Record<string, unknown>) => {
      if (!data.email || !data.firstName || !data.lastName || !data.propertyId || !data.roleId) {
        return {
          success: false,
          error: { flatten: () => ({ fieldErrors: { email: ['Required'] } }) },
        };
      }
      return { success: true, data };
    }),
  },
  changeStatusSchema: {
    safeParse: vi.fn().mockImplementation((data: Record<string, unknown>) => {
      if (!['active', 'suspended'].includes(data.status as string)) {
        return {
          success: false,
          error: { flatten: () => ({ fieldErrors: { status: ['Invalid status'] } }) },
        };
      }
      return { success: true, data };
    }),
  },
  updateUserSchema: {
    safeParse: vi.fn().mockReturnValue({ success: true, data: {} }),
  },
}));

vi.mock('@/server/auth/password', () => ({
  hashPassword: vi.fn().mockResolvedValue('$argon2id$hashed'),
}));

vi.mock('@/lib/sanitize', () => ({
  stripHtml: (s: string) => s,
  stripControlChars: (s: string) => s,
}));

vi.mock('@/server/email', () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
  getUnitResidentEmails: vi.fn().mockResolvedValue([]),
  sendPasswordResetEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/server/email-templates', () => ({
  renderTemplate: vi.fn().mockReturnValue({ subject: 'Test', html: '<p>Test</p>' }),
}));

const mockGuardRoute = vi.fn().mockResolvedValue({
  user: {
    userId: 'admin-001',
    propertyId: '00000000-0000-4000-b000-000000000001',
    role: 'property_admin',
    permissions: ['*'],
    mfaVerified: true,
  },
  error: null,
});

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: (...args: unknown[]) => mockGuardRoute(...args),
}));

// ---------------------------------------------------------------------------
// Import route handlers AFTER mocks
// ---------------------------------------------------------------------------

import { POST as createUser, GET as _listUsers } from '@/app/api/v1/users/route';
import { PATCH as updateUser, DELETE as deleteUser } from '@/app/api/v1/users/[id]/route';
import { POST as issueKey, GET as _listKeyCheckouts } from '@/app/api/v1/keys/checkouts/route';
import { PATCH as returnKey } from '@/app/api/v1/keys/checkouts/[id]/route';
import {
  POST as createParkingPermit,
  PATCH as updateParkingPermit,
  GET as listParking,
} from '@/app/api/v1/parking/route';
import { PATCH as updateUnit } from '@/app/api/v1/units/[id]/route';
import {
  GET as getNotificationPreferences,
  PUT as updateNotificationPreferences,
} from '@/app/api/v1/notifications/preferences/route';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROPERTY_ID = '00000000-0000-4000-b000-000000000001';
const UNIT_ID = '00000000-0000-4000-a000-000000000501';
const RESIDENT_ROLE_ID = '00000000-0000-4000-c000-000000010003';
const _ADMIN_ROLE_ID = '00000000-0000-4000-c000-000000010001';
const VEHICLE_ID = '00000000-0000-4000-d000-000000000001';
const PERMIT_TYPE_ID = '00000000-0000-4000-e000-000000000001';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-new-001',
    email: 'jane@building.com',
    firstName: 'Jane',
    lastName: 'Doe',
    phone: '+14165551234',
    isActive: true,
    activatedAt: null,
    mfaEnabled: false,
    avatarUrl: null,
    lastLoginAt: null,
    createdAt: new Date('2026-03-18T09:00:00Z'),
    deletedAt: null,
    ...overrides,
  };
}

function makeKey(overrides: Record<string, unknown> = {}) {
  return {
    id: 'key-fob-001',
    propertyId: PROPERTY_ID,
    keyName: 'FOB #1234',
    category: 'fob',
    status: 'available',
    serialNumber: 'SN-001234',
    ...overrides,
  };
}

function makeKeyCheckout(overrides: Record<string, unknown> = {}) {
  return {
    id: 'checkout-001',
    propertyId: PROPERTY_ID,
    keyId: 'key-fob-001',
    checkedOutTo: 'Jane Doe',
    unitId: UNIT_ID,
    idType: 'drivers_license',
    reason: 'Move-in key issuance',
    checkoutTime: new Date(),
    returnTime: null,
    expectedReturn: null,
    checkedOutById: 'admin-001',
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ===========================================================================
// SCENARIO 1: New Resident Move-In
// ===========================================================================

describe('Scenario 1: New Resident Move-In', () => {
  const userId = 'user-new-001';

  it('Step 1: admin creates user account via POST /users', async () => {
    mockUserFindFirst.mockResolvedValue(null); // No duplicate
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      return fn({
        user: {
          create: vi.fn().mockResolvedValue(makeUser({ id: userId })),
        },
        userProperty: { create: vi.fn() },
      });
    });

    const req = createPostRequest('/api/v1/users', {
      email: 'jane@building.com',
      firstName: 'Jane',
      lastName: 'Doe',
      phone: '+14165551234',
      propertyId: PROPERTY_ID,
      roleId: RESIDENT_ROLE_ID,
      sendWelcomeEmail: true,
    });

    const res = await createUser(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{
      data: { id: string; status: string; email: string };
      message: string;
    }>(res);
    expect(body.data.id).toBe(userId);
    expect(body.data.status).toBe('pending');
    expect(body.message).toContain('Jane Doe');
  });

  it('Step 1b: duplicate email at same property is rejected', async () => {
    mockUserFindFirst.mockResolvedValue(makeUser({ id: 'existing-user' }));

    const req = createPostRequest('/api/v1/users', {
      email: 'jane@building.com',
      firstName: 'Jane',
      lastName: 'Doe',
      propertyId: PROPERTY_ID,
      roleId: RESIDENT_ROLE_ID,
    });

    const res = await createUser(req);
    expect(res.status).toBe(409);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('EMAIL_EXISTS');
  });

  it('Step 2: FOBs issued via POST /keys/checkouts', async () => {
    mockKeyInventoryFindUnique.mockResolvedValue(makeKey({ id: 'key-fob-001' }));
    mockKeyInventoryCount.mockResolvedValue(0);
    mockKeyCheckoutCreate.mockResolvedValue(makeKeyCheckout());
    mockKeyInventoryUpdate.mockResolvedValue(makeKey({ status: 'checked_out' }));

    const req = createPostRequest('/api/v1/keys/checkouts', {
      propertyId: PROPERTY_ID,
      keyId: 'key-fob-001',
      checkedOutTo: 'Jane Doe',
      unitId: UNIT_ID,
      idType: 'drivers_license',
      idNumber: 'D1234567',
      reason: 'Move-in key issuance',
      enforceMax: true,
    });

    const res = await issueKey(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{ data: { id: string }; message: string }>(res);
    expect(body.message).toContain('Jane Doe');
  });

  it('Step 2b: key status changes to checked_out after issuance', async () => {
    mockKeyInventoryFindUnique.mockResolvedValue(makeKey({ id: 'key-fob-002' }));
    mockKeyInventoryCount.mockResolvedValue(0);
    mockKeyCheckoutCreate.mockResolvedValue(
      makeKeyCheckout({ id: 'checkout-002', keyId: 'key-fob-002' }),
    );
    mockKeyInventoryUpdate.mockResolvedValue(makeKey({ id: 'key-fob-002', status: 'checked_out' }));

    await issueKey(
      createPostRequest('/api/v1/keys/checkouts', {
        propertyId: PROPERTY_ID,
        keyId: 'key-fob-002',
        checkedOutTo: 'Jane Doe',
        unitId: UNIT_ID,
        idType: 'drivers_license',
        reason: 'Move-in',
      }),
    );

    expect(mockKeyInventoryUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'key-fob-002' },
        data: { status: 'checked_out' },
      }),
    );
  });

  it('Step 2c: unavailable key cannot be issued', async () => {
    mockKeyInventoryFindUnique.mockResolvedValue(
      makeKey({ id: 'key-fob-003', status: 'checked_out' }),
    );

    const req = createPostRequest('/api/v1/keys/checkouts', {
      propertyId: PROPERTY_ID,
      keyId: 'key-fob-003',
      checkedOutTo: 'Jane Doe',
      unitId: UNIT_ID,
      idType: 'drivers_license',
      reason: 'Move-in',
    });

    const res = await issueKey(req);
    expect(res.status).toBe(409);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('KEY_NOT_AVAILABLE');
  });

  it('Step 2d: max keys per unit enforced', async () => {
    mockKeyInventoryFindUnique.mockResolvedValue(makeKey({ id: 'key-fob-overflow' }));
    mockKeyInventoryCount.mockResolvedValue(6); // Already at max for fob category

    const req = createPostRequest('/api/v1/keys/checkouts', {
      propertyId: PROPERTY_ID,
      keyId: 'key-fob-overflow',
      checkedOutTo: 'Jane Doe',
      unitId: UNIT_ID,
      idType: 'drivers_license',
      reason: 'Extras',
      enforceMax: true,
    });

    const res = await issueKey(req);
    expect(res.status).toBe(409);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MAX_KEYS_EXCEEDED');
  });

  it('Step 3: parking permit created via POST /parking', async () => {
    mockParkingPermitFindFirst.mockResolvedValue(null); // No overlap
    mockParkingSpotFindFirst.mockResolvedValue(null);
    mockParkingViolationFindMany.mockResolvedValue([]);

    const permitData = {
      id: 'permit-001',
      propertyId: PROPERTY_ID,
      unitId: UNIT_ID,
      vehicleId: VEHICLE_ID,
      permitTypeId: PERMIT_TYPE_ID,
      licensePlate: 'ABCD 123',
      status: 'active',
      referenceNumber: 'PRK-20260318-1234',
      validFrom: new Date('2026-04-01'),
      validUntil: new Date('2027-04-01'),
      linkedViolations: 0,
    };

    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      return fn({
        parkingPermit: {
          create: vi.fn().mockResolvedValue(permitData),
        },
        parkingSpot: {
          update: vi.fn(),
        },
        parkingViolation: {
          updateMany: vi.fn().mockResolvedValue({ count: 0 }),
        },
      });
    });

    const req = createPostRequest('/api/v1/parking', {
      propertyId: PROPERTY_ID,
      unitId: UNIT_ID,
      vehicleId: VEHICLE_ID,
      permitTypeId: PERMIT_TYPE_ID,
      licensePlate: 'ABCD 123',
      startDate: '2026-04-01',
      endDate: '2027-04-01',
    });

    const res = await createParkingPermit(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{ data: { status: string }; message: string }>(res);
    expect(body.data.status).toBe('active');
    expect(body.message).toContain('Permit created');
  });

  it('Step 3b: overlapping active permit is rejected', async () => {
    mockParkingPermitFindFirst.mockResolvedValue({
      id: 'existing-permit',
      status: 'active',
    });

    const req = createPostRequest('/api/v1/parking', {
      propertyId: PROPERTY_ID,
      unitId: UNIT_ID,
      vehicleId: VEHICLE_ID,
      permitTypeId: PERMIT_TYPE_ID,
      licensePlate: 'ABCD 123',
      startDate: '2026-04-01',
      endDate: '2027-04-01',
    });

    const res = await createParkingPermit(req);
    expect(res.status).toBe(409);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('OVERLAP_CONFLICT');
  });

  it('Step 4: resident activates account via PATCH /users/:id status=active', async () => {
    mockUserUpdate.mockResolvedValue(
      makeUser({ id: userId, isActive: true, activatedAt: new Date() }),
    );

    const req = createPatchRequest(`/api/v1/users/${userId}`, { status: 'active' });
    const res = await updateUser(req, { params: Promise.resolve({ id: userId }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { isActive: boolean }; message: string }>(res);
    expect(body.data.isActive).toBe(true);
    expect(body.message).toContain('active');
  });

  it('Step 5: resident sets notification preferences', async () => {
    mockNotificationPreferenceUpsert.mockResolvedValue({
      id: 'pref-1',
      module: 'packages',
      channel: 'email',
      enabled: true,
    });

    const req = createPutRequest('/api/v1/notifications/preferences', {
      preferences: [
        { module: 'packages', channel: 'email', enabled: true },
        { module: 'packages', channel: 'push', enabled: true },
        { module: 'maintenance', channel: 'email', enabled: true },
        { module: 'announcements', channel: 'email', enabled: true },
        { module: 'announcements', channel: 'sms', enabled: false },
      ],
    });

    const res = await updateNotificationPreferences(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('Preferences updated');
  });

  it('Step 6: resident can view their notification preferences', async () => {
    mockNotificationPreferenceFindMany.mockResolvedValue([
      { module: 'packages', channel: 'email', enabled: true },
      { module: 'packages', channel: 'push', enabled: true },
      { module: 'maintenance', channel: 'email', enabled: true },
    ]);

    const req = createGetRequest('/api/v1/notifications/preferences');
    const res = await getNotificationPreferences(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { module: string }[] }>(res);
    expect(body.data.length).toBeGreaterThanOrEqual(3);
  });

  it('full workflow: create account -> issue FOB -> parking -> activate', async () => {
    // 1. Create account
    mockUserFindFirst.mockResolvedValue(null);
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      return fn({
        user: {
          create: vi.fn().mockResolvedValue(makeUser({ id: userId })),
        },
        userProperty: { create: vi.fn() },
      });
    });
    const createRes = await createUser(
      createPostRequest('/api/v1/users', {
        email: 'jane@building.com',
        firstName: 'Jane',
        lastName: 'Doe',
        propertyId: PROPERTY_ID,
        roleId: RESIDENT_ROLE_ID,
      }),
    );
    expect(createRes.status).toBe(201);

    // 2. Issue FOB
    vi.clearAllMocks();
    mockKeyInventoryFindUnique.mockResolvedValue(makeKey());
    mockKeyInventoryCount.mockResolvedValue(0);
    mockKeyCheckoutCreate.mockResolvedValue(makeKeyCheckout());
    mockKeyInventoryUpdate.mockResolvedValue(makeKey({ status: 'checked_out' }));
    const fobRes = await issueKey(
      createPostRequest('/api/v1/keys/checkouts', {
        propertyId: PROPERTY_ID,
        keyId: 'key-fob-001',
        checkedOutTo: 'Jane Doe',
        unitId: UNIT_ID,
        idType: 'drivers_license',
        reason: 'Move-in',
      }),
    );
    expect(fobRes.status).toBe(201);

    // 3. Create parking permit
    vi.clearAllMocks();
    mockParkingPermitFindFirst.mockResolvedValue(null);
    mockParkingViolationFindMany.mockResolvedValue([]);
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      return fn({
        parkingPermit: {
          create: vi.fn().mockResolvedValue({
            id: 'permit-001',
            status: 'active',
            referenceNumber: 'PRK-20260401-5678',
            linkedViolations: 0,
          }),
        },
        parkingSpot: { update: vi.fn() },
        parkingViolation: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
      });
    });
    const parkRes = await createParkingPermit(
      createPostRequest('/api/v1/parking', {
        propertyId: PROPERTY_ID,
        unitId: UNIT_ID,
        vehicleId: VEHICLE_ID,
        permitTypeId: PERMIT_TYPE_ID,
        licensePlate: 'ABCD 123',
        startDate: '2026-04-01',
        endDate: '2027-04-01',
      }),
    );
    expect(parkRes.status).toBe(201);

    // 4. Activate account
    vi.clearAllMocks();
    mockUserUpdate.mockResolvedValue(makeUser({ id: userId, isActive: true }));
    const activateRes = await updateUser(
      createPatchRequest(`/api/v1/users/${userId}`, { status: 'active' }),
      { params: Promise.resolve({ id: userId }) },
    );
    expect(activateRes.status).toBe(200);
  });
});

// ===========================================================================
// SCENARIO 2: Resident Move-Out
// ===========================================================================

describe('Scenario 2: Resident Move-Out', () => {
  const userId = 'user-moveout-001';
  const checkoutId = 'checkout-moveout';
  const permitId = '00000000-0000-4000-e000-000000000010';

  it('Step 1: FOBs collected via PATCH /keys/checkouts/:id action=return', async () => {
    mockKeyCheckoutFindUnique.mockResolvedValue(
      makeKeyCheckout({ id: checkoutId, keyId: 'key-fob-001', returnTime: null }),
    );
    mockKeyCheckoutUpdate.mockResolvedValue(
      makeKeyCheckout({ id: checkoutId, returnTime: new Date() }),
    );
    mockKeyInventoryUpdate.mockResolvedValue(makeKey({ status: 'available' }));

    const req = createPatchRequest(`/api/v1/keys/checkouts/${checkoutId}`, {
      action: 'return',
      conditionNotes: 'Good condition, no damage.',
    });

    const res = await returnKey(req, { params: Promise.resolve({ id: checkoutId }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('returned');
  });

  it('Step 1b: key status restored to available after return', async () => {
    mockKeyCheckoutFindUnique.mockResolvedValue(
      makeKeyCheckout({ id: 'checkout-ret2', keyId: 'key-fob-002', returnTime: null }),
    );
    mockKeyCheckoutUpdate.mockResolvedValue(
      makeKeyCheckout({ id: 'checkout-ret2', returnTime: new Date() }),
    );
    mockKeyInventoryUpdate.mockResolvedValue(makeKey({ id: 'key-fob-002', status: 'available' }));

    await returnKey(
      createPatchRequest('/api/v1/keys/checkouts/checkout-ret2', {
        action: 'return',
      }),
      { params: Promise.resolve({ id: 'checkout-ret2' }) },
    );

    expect(mockKeyInventoryUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'key-fob-002' },
        data: { status: 'available' },
      }),
    );
  });

  it('Step 1c: double-return of same key is rejected', async () => {
    mockKeyCheckoutFindUnique.mockResolvedValue(
      makeKeyCheckout({
        id: checkoutId,
        returnTime: new Date('2026-03-18T10:00:00Z'),
      }),
    );

    const req = createPatchRequest(`/api/v1/keys/checkouts/${checkoutId}`, {
      action: 'return',
    });

    const res = await returnKey(req, { params: Promise.resolve({ id: checkoutId }) });
    expect(res.status).toBe(409);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('ALREADY_RETURNED');
  });

  it('Step 2: parking permit cancelled via PATCH /parking', async () => {
    mockParkingPermitFindUnique.mockResolvedValue({
      id: permitId,
      propertyId: PROPERTY_ID,
      unitId: UNIT_ID,
      status: 'active',
      spotId: '00000000-0000-4000-f000-000000000001',
      validUntil: new Date('2027-04-01'),
    });

    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      return fn({
        parkingPermit: {
          update: vi.fn().mockResolvedValue({
            id: permitId,
            status: 'cancelled',
            revokedReason: 'Resident moving out',
          }),
        },
        parkingSpot: {
          update: vi.fn().mockResolvedValue({ id: 'spot-001', status: 'available' }),
        },
      });
    });

    const req = createPatchRequest('/api/v1/parking', {
      permitId,
      action: 'cancel',
      reason: 'Resident moving out',
    });

    const res = await updateParkingPermit(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('cancelled');
  });

  it('Step 2b: cancelled permit cannot be cancelled again', async () => {
    mockParkingPermitFindUnique.mockResolvedValue({
      id: permitId,
      status: 'cancelled',
    });

    const req = createPatchRequest('/api/v1/parking', {
      permitId,
      action: 'cancel',
    });

    const res = await updateParkingPermit(req);
    expect(res.status).toBe(409);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('INVALID_TRANSITION');
  });

  it('Step 3: unit status changed to vacant via PATCH /units/:id', async () => {
    mockUnitUpdate.mockResolvedValue({
      id: UNIT_ID,
      status: 'vacant',
      building: { name: 'Tower A' },
    });

    const req = createPatchRequest(`/api/v1/units/${UNIT_ID}`, {
      status: 'vacant',
      comments: 'Resident moved out 2026-03-18.',
    });

    const res = await updateUnit(req, { params: Promise.resolve({ id: UNIT_ID }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { status: string }; message: string }>(res);
    expect(body.data.status).toBe('vacant');
  });

  it('Step 4: account deactivated via DELETE /users/:id', async () => {
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      return fn({
        user: {
          update: vi
            .fn()
            .mockResolvedValue(makeUser({ id: userId, isActive: false, deletedAt: new Date() })),
        },
        session: {
          updateMany: vi.fn().mockResolvedValue({ count: 2 }),
        },
        refreshToken: {
          updateMany: vi.fn().mockResolvedValue({ count: 1 }),
        },
      });
    });

    const req = createDeleteRequest(`/api/v1/users/${userId}`);
    const res = await deleteUser(req, { params: Promise.resolve({ id: userId }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('deactivated');
  });

  it('Step 4b: deactivation revokes all sessions and refresh tokens', async () => {
    const sessionMock = vi.fn().mockResolvedValue({ count: 3 });
    const refreshMock = vi.fn().mockResolvedValue({ count: 2 });

    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      return fn({
        user: {
          update: vi.fn().mockResolvedValue(makeUser({ id: userId, deletedAt: new Date() })),
        },
        session: { updateMany: sessionMock },
        refreshToken: { updateMany: refreshMock },
      });
    });

    await deleteUser(createDeleteRequest(`/api/v1/users/${userId}`), {
      params: Promise.resolve({ id: userId }),
    });

    expect(sessionMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId,
          revokedAt: null,
        }),
      }),
    );
    expect(refreshMock).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId,
          revokedAt: null,
        }),
      }),
    );
  });

  it('full workflow: collect FOBs -> cancel parking -> vacate unit -> deactivate account', async () => {
    // 1. Collect FOBs
    mockKeyCheckoutFindUnique.mockResolvedValue(
      makeKeyCheckout({ id: checkoutId, returnTime: null }),
    );
    mockKeyCheckoutUpdate.mockResolvedValue(
      makeKeyCheckout({ id: checkoutId, returnTime: new Date() }),
    );
    mockKeyInventoryUpdate.mockResolvedValue(makeKey({ status: 'available' }));
    const fobRes = await returnKey(
      createPatchRequest(`/api/v1/keys/checkouts/${checkoutId}`, { action: 'return' }),
      { params: Promise.resolve({ id: checkoutId }) },
    );
    expect(fobRes.status).toBe(200);

    // 2. Cancel parking
    vi.clearAllMocks();
    mockParkingPermitFindUnique.mockResolvedValue({
      id: permitId,
      propertyId: PROPERTY_ID,
      status: 'active',
      spotId: '00000000-0000-4000-f000-000000000001',
      validUntil: new Date(),
    });
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      return fn({
        parkingPermit: {
          update: vi.fn().mockResolvedValue({ id: permitId, status: 'cancelled' }),
        },
        parkingSpot: { update: vi.fn() },
      });
    });
    const parkRes = await updateParkingPermit(
      createPatchRequest('/api/v1/parking', { permitId, action: 'cancel', reason: 'Move-out' }),
    );
    expect(parkRes.status).toBe(200);

    // 3. Vacate unit
    vi.clearAllMocks();
    mockUnitUpdate.mockResolvedValue({
      id: UNIT_ID,
      status: 'vacant',
      building: { name: 'A' },
    });
    const unitRes = await updateUnit(
      createPatchRequest(`/api/v1/units/${UNIT_ID}`, { status: 'vacant' }),
      { params: Promise.resolve({ id: UNIT_ID }) },
    );
    expect(unitRes.status).toBe(200);

    // 4. Deactivate account
    vi.clearAllMocks();
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      return fn({
        user: {
          update: vi.fn().mockResolvedValue(makeUser({ deletedAt: new Date() })),
        },
        session: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
        refreshToken: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
      });
    });
    const deleteRes = await deleteUser(createDeleteRequest(`/api/v1/users/${userId}`), {
      params: Promise.resolve({ id: userId }),
    });
    expect(deleteRes.status).toBe(200);
  });
});

// ===========================================================================
// SCENARIO 3: Ownership Transfer
// ===========================================================================

describe('Scenario 3: Ownership Transfer (old owner out -> new owner in)', () => {
  const oldOwnerId = 'user-old-owner';
  const newOwnerId = 'user-new-owner';
  const oldCheckoutId = 'checkout-old';
  const oldPermitId = '00000000-0000-4000-e000-000000000020';

  it('Step 1: old owner FOBs collected', async () => {
    mockKeyCheckoutFindUnique.mockResolvedValue(
      makeKeyCheckout({
        id: oldCheckoutId,
        checkedOutTo: 'Old Owner',
        returnTime: null,
      }),
    );
    mockKeyCheckoutUpdate.mockResolvedValue(
      makeKeyCheckout({ id: oldCheckoutId, returnTime: new Date() }),
    );
    mockKeyInventoryUpdate.mockResolvedValue(makeKey({ status: 'available' }));

    const res = await returnKey(
      createPatchRequest(`/api/v1/keys/checkouts/${oldCheckoutId}`, { action: 'return' }),
      { params: Promise.resolve({ id: oldCheckoutId }) },
    );
    expect(res.status).toBe(200);
  });

  it('Step 2: old owner parking cancelled', async () => {
    mockParkingPermitFindUnique.mockResolvedValue({
      id: oldPermitId,
      propertyId: PROPERTY_ID,
      status: 'active',
      spotId: '00000000-0000-4000-f000-000000000002',
      validUntil: new Date(),
    });
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      return fn({
        parkingPermit: {
          update: vi.fn().mockResolvedValue({ id: oldPermitId, status: 'cancelled' }),
        },
        parkingSpot: { update: vi.fn() },
      });
    });

    const res = await updateParkingPermit(
      createPatchRequest('/api/v1/parking', {
        permitId: oldPermitId,
        action: 'cancel',
        reason: 'Ownership transfer',
      }),
    );
    expect(res.status).toBe(200);
  });

  it('Step 3: old owner account deactivated', async () => {
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      return fn({
        user: {
          update: vi
            .fn()
            .mockResolvedValue(
              makeUser({ id: oldOwnerId, deletedAt: new Date(), isActive: false }),
            ),
        },
        session: { updateMany: vi.fn().mockResolvedValue({ count: 1 }) },
        refreshToken: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
      });
    });

    const res = await deleteUser(createDeleteRequest(`/api/v1/users/${oldOwnerId}`), {
      params: Promise.resolve({ id: oldOwnerId }),
    });
    expect(res.status).toBe(200);
  });

  it('Step 4: new owner account created', async () => {
    mockUserFindFirst.mockResolvedValue(null);
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      return fn({
        user: {
          create: vi.fn().mockResolvedValue(
            makeUser({
              id: newOwnerId,
              email: 'newowner@email.com',
              firstName: 'New',
              lastName: 'Owner',
            }),
          ),
        },
        userProperty: { create: vi.fn() },
      });
    });

    const res = await createUser(
      createPostRequest('/api/v1/users', {
        email: 'newowner@email.com',
        firstName: 'New',
        lastName: 'Owner',
        propertyId: PROPERTY_ID,
        roleId: RESIDENT_ROLE_ID,
        sendWelcomeEmail: true,
      }),
    );
    expect(res.status).toBe(201);

    const body = await parseResponse<{ data: { id: string; status: string } }>(res);
    expect(body.data.id).toBe(newOwnerId);
    expect(body.data.status).toBe('pending');
  });

  it('Step 5: new FOBs issued to new owner', async () => {
    mockKeyInventoryFindUnique.mockResolvedValue(makeKey({ id: 'key-fob-new' }));
    mockKeyInventoryCount.mockResolvedValue(0);
    mockKeyCheckoutCreate.mockResolvedValue(
      makeKeyCheckout({ id: 'checkout-new', checkedOutTo: 'New Owner', keyId: 'key-fob-new' }),
    );
    mockKeyInventoryUpdate.mockResolvedValue(makeKey({ id: 'key-fob-new', status: 'checked_out' }));

    const res = await issueKey(
      createPostRequest('/api/v1/keys/checkouts', {
        propertyId: PROPERTY_ID,
        keyId: 'key-fob-new',
        checkedOutTo: 'New Owner',
        unitId: UNIT_ID,
        idType: 'passport',
        reason: 'New owner move-in',
      }),
    );
    expect(res.status).toBe(201);

    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('New Owner');
  });

  it('Step 6: new owner activated', async () => {
    mockUserUpdate.mockResolvedValue(
      makeUser({
        id: newOwnerId,
        firstName: 'New',
        lastName: 'Owner',
        isActive: true,
        activatedAt: new Date(),
      }),
    );

    const res = await updateUser(
      createPatchRequest(`/api/v1/users/${newOwnerId}`, { status: 'active' }),
      { params: Promise.resolve({ id: newOwnerId }) },
    );
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { isActive: boolean } }>(res);
    expect(body.data.isActive).toBe(true);
  });

  it('Step 6b: session invalidation does NOT happen on activation (only on suspension)', async () => {
    mockUserUpdate.mockResolvedValue(makeUser({ id: newOwnerId, isActive: true }));

    await updateUser(createPatchRequest(`/api/v1/users/${newOwnerId}`, { status: 'active' }), {
      params: Promise.resolve({ id: newOwnerId }),
    });

    // Sessions should NOT be invalidated on activation
    expect(mockSessionUpdateMany).not.toHaveBeenCalled();
  });

  it('full workflow: old owner out -> new owner in', async () => {
    // 1. Collect old FOBs
    mockKeyCheckoutFindUnique.mockResolvedValue(
      makeKeyCheckout({ id: oldCheckoutId, returnTime: null }),
    );
    mockKeyCheckoutUpdate.mockResolvedValue(
      makeKeyCheckout({ id: oldCheckoutId, returnTime: new Date() }),
    );
    mockKeyInventoryUpdate.mockResolvedValue(makeKey({ status: 'available' }));
    expect(
      (
        await returnKey(
          createPatchRequest(`/api/v1/keys/checkouts/${oldCheckoutId}`, { action: 'return' }),
          { params: Promise.resolve({ id: oldCheckoutId }) },
        )
      ).status,
    ).toBe(200);

    // 2. Cancel old parking
    vi.clearAllMocks();
    mockParkingPermitFindUnique.mockResolvedValue({
      id: oldPermitId,
      propertyId: PROPERTY_ID,
      status: 'active',
      spotId: null,
      validUntil: new Date(),
    });
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      return fn({
        parkingPermit: {
          update: vi.fn().mockResolvedValue({ id: oldPermitId, status: 'cancelled' }),
        },
        parkingSpot: { update: vi.fn() },
      });
    });
    expect(
      (
        await updateParkingPermit(
          createPatchRequest('/api/v1/parking', { permitId: oldPermitId, action: 'cancel' }),
        )
      ).status,
    ).toBe(200);

    // 3. Deactivate old account
    vi.clearAllMocks();
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      return fn({
        user: {
          update: vi.fn().mockResolvedValue(makeUser({ id: oldOwnerId, deletedAt: new Date() })),
        },
        session: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
        refreshToken: { updateMany: vi.fn().mockResolvedValue({ count: 0 }) },
      });
    });
    expect(
      (
        await deleteUser(createDeleteRequest(`/api/v1/users/${oldOwnerId}`), {
          params: Promise.resolve({ id: oldOwnerId }),
        })
      ).status,
    ).toBe(200);

    // 4. Create new owner
    vi.clearAllMocks();
    mockUserFindFirst.mockResolvedValue(null);
    mockTransaction.mockImplementation(async (fn: (tx: unknown) => unknown) => {
      return fn({
        user: {
          create: vi.fn().mockResolvedValue(makeUser({ id: newOwnerId, email: 'new@email.com' })),
        },
        userProperty: { create: vi.fn() },
      });
    });
    expect(
      (
        await createUser(
          createPostRequest('/api/v1/users', {
            email: 'new@email.com',
            firstName: 'New',
            lastName: 'Owner',
            propertyId: PROPERTY_ID,
            roleId: RESIDENT_ROLE_ID,
          }),
        )
      ).status,
    ).toBe(201);

    // 5. Issue new FOBs
    vi.clearAllMocks();
    mockKeyInventoryFindUnique.mockResolvedValue(makeKey());
    mockKeyInventoryCount.mockResolvedValue(0);
    mockKeyCheckoutCreate.mockResolvedValue(makeKeyCheckout({ checkedOutTo: 'New Owner' }));
    mockKeyInventoryUpdate.mockResolvedValue(makeKey({ status: 'checked_out' }));
    expect(
      (
        await issueKey(
          createPostRequest('/api/v1/keys/checkouts', {
            propertyId: PROPERTY_ID,
            keyId: 'key-fob-001',
            checkedOutTo: 'New Owner',
            unitId: UNIT_ID,
            idType: 'passport',
            reason: 'New owner',
          }),
        )
      ).status,
    ).toBe(201);

    // 6. Activate new owner
    vi.clearAllMocks();
    mockUserUpdate.mockResolvedValue(makeUser({ id: newOwnerId, isActive: true }));
    const activateRes = await updateUser(
      createPatchRequest(`/api/v1/users/${newOwnerId}`, { status: 'active' }),
      { params: Promise.resolve({ id: newOwnerId }) },
    );
    expect(activateRes.status).toBe(200);
    expect(mockSessionUpdateMany).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// Cross-Scenario: Validation and Edge Cases
// ===========================================================================

describe('Resident Onboarding: Validation & Edge Cases', () => {
  it('should reject user creation without email', async () => {
    const req = createPostRequest('/api/v1/users', {
      firstName: 'Jane',
      lastName: 'Doe',
      propertyId: PROPERTY_ID,
      roleId: RESIDENT_ROLE_ID,
    });

    const res = await createUser(req);
    expect(res.status).toBe(400);
  });

  it('should reject user creation without firstName', async () => {
    const req = createPostRequest('/api/v1/users', {
      email: 'jane@building.com',
      lastName: 'Doe',
      propertyId: PROPERTY_ID,
      roleId: RESIDENT_ROLE_ID,
    });

    const res = await createUser(req);
    expect(res.status).toBe(400);
  });

  it('should reject key checkout for nonexistent key', async () => {
    mockKeyInventoryFindUnique.mockResolvedValue(null);

    const req = createPostRequest('/api/v1/keys/checkouts', {
      propertyId: PROPERTY_ID,
      keyId: 'nonexistent-key',
      checkedOutTo: 'Jane',
      unitId: UNIT_ID,
      idType: 'drivers_license',
      reason: 'Test',
    });

    const res = await issueKey(req);
    expect(res.status).toBe(404);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('KEY_NOT_FOUND');
  });

  it('should reject key return for nonexistent checkout', async () => {
    mockKeyCheckoutFindUnique.mockResolvedValue(null);

    const res = await returnKey(
      createPatchRequest('/api/v1/keys/checkouts/nonexistent', { action: 'return' }),
      { params: Promise.resolve({ id: 'nonexistent' }) },
    );
    expect(res.status).toBe(404);
  });

  it('should reject invalid key checkout action', async () => {
    mockKeyCheckoutFindUnique.mockResolvedValue(null);

    const res = await returnKey(
      createPatchRequest('/api/v1/keys/checkouts/some-id', { action: 'invalid_action' }),
      { params: Promise.resolve({ id: 'some-id' }) },
    );
    // Should be 400 for unsupported action or 404 for not found
    expect([400, 404]).toContain(res.status);
  });

  it('parking listing requires propertyId', async () => {
    const req = createGetRequest('/api/v1/parking');
    const res = await listParking(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_PROPERTY');
  });

  it('suspension invalidates all sessions (security requirement)', async () => {
    mockUserUpdate.mockResolvedValue(makeUser({ id: 'user-suspend', isActive: false }));
    mockSessionUpdateMany.mockResolvedValue({ count: 5 });

    await updateUser(createPatchRequest('/api/v1/users/user-suspend', { status: 'suspended' }), {
      params: Promise.resolve({ id: 'user-suspend' }),
    });

    expect(mockSessionUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 'user-suspend',
          revokedAt: null,
        }),
        data: expect.objectContaining({
          revokedAt: expect.any(Date),
        }),
      }),
    );
  });
});
