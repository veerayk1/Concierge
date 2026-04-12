/**
 * Key/FOB Lifecycle Management Tests — per Aquarius FOB management
 *
 * Covers: issue, return, decommission, lost key, key history,
 * resident summary, key categories, max-keys enforcement,
 * bulk issuance, audit trail, and tenant isolation.
 *
 * Aquarius spec: 6 FOB slots, 2 buzzer codes, 2 garage clickers per user.
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

const mockKeyFindMany = vi.fn();
const mockKeyFindUnique = vi.fn();
const mockKeyCreate = vi.fn();
const mockKeyUpdate = vi.fn();
const mockKeyCount = vi.fn();

const mockCheckoutFindMany = vi.fn();
const mockCheckoutFindUnique = vi.fn();
const mockCheckoutCreate = vi.fn();
const mockCheckoutUpdate = vi.fn();
const mockCheckoutCreateMany = vi.fn();

const mockIncidentCreate = vi.fn();

const mockTransaction = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    keyInventory: {
      findMany: (...args: unknown[]) => mockKeyFindMany(...args),
      findUnique: (...args: unknown[]) => mockKeyFindUnique(...args),
      create: (...args: unknown[]) => mockKeyCreate(...args),
      update: (...args: unknown[]) => mockKeyUpdate(...args),
      count: (...args: unknown[]) => mockKeyCount(...args),
    },
    keyCheckout: {
      findMany: (...args: unknown[]) => mockCheckoutFindMany(...args),
      findUnique: (...args: unknown[]) => mockCheckoutFindUnique(...args),
      create: (...args: unknown[]) => mockCheckoutCreate(...args),
      update: (...args: unknown[]) => mockCheckoutUpdate(...args),
      createMany: (...args: unknown[]) => mockCheckoutCreateMany(...args),
    },
    incidentReport: {
      create: (...args: unknown[]) => mockIncidentCreate(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: vi.fn().mockResolvedValue({
    user: {
      userId: 'staff-user-1',
      propertyId: '00000000-0000-4000-b000-000000000001',
      role: 'front_desk',
      permissions: ['*'],
      mfaVerified: false,
    },
    error: null,
  }),
}));

// ---------------------------------------------------------------------------
// Import routes (after mocks)
// ---------------------------------------------------------------------------

import { GET, POST } from '../route';
import { PATCH } from '../[id]/route';
import { GET as GET_CHECKOUTS, POST as POST_CHECKOUT } from '../../keys/checkouts/route';
import { PATCH as PATCH_CHECKOUT } from '../../keys/checkouts/[id]/route';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROP_ID = '00000000-0000-4000-b000-000000000001';
const KEY_ID = '00000000-0000-4000-b000-000000000010';
const UNIT_ID = '00000000-0000-4000-b000-000000000020';
const CHECKOUT_ID = '00000000-0000-4000-b000-000000000030';

beforeEach(() => {
  vi.clearAllMocks();
  mockKeyFindMany.mockResolvedValue([]);
  mockKeyFindUnique.mockResolvedValue(null);
  mockKeyCreate.mockResolvedValue({});
  mockKeyUpdate.mockResolvedValue({});
  mockKeyCount.mockResolvedValue(0);
  mockCheckoutFindMany.mockResolvedValue([]);
  mockCheckoutFindUnique.mockResolvedValue(null);
  mockCheckoutCreate.mockResolvedValue({});
  mockCheckoutUpdate.mockResolvedValue({});
  mockCheckoutCreateMany.mockResolvedValue({ count: 0 });
  mockIncidentCreate.mockResolvedValue({});
  mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
    // For array-of-promises pattern, just resolve each
    if (Array.isArray(fn)) {
      return Promise.all(fn);
    }
    // For callback pattern, pass through the prisma mock
    const { prisma } = await import('@/server/db');
    return fn(prisma);
  });
});

// ===========================================================================
// 1. Issue key to resident -> creates KeyCheckout with issuedAt
// ===========================================================================

describe('1. Issue key to resident', () => {
  it('creates a KeyCheckout record with issuedAt timestamp', async () => {
    const now = new Date();
    mockKeyFindUnique.mockResolvedValue({
      id: KEY_ID,
      propertyId: PROP_ID,
      status: 'available',
      category: 'unit',
      keyName: 'Unit 101 Key',
    });
    mockCheckoutCreate.mockResolvedValue({
      id: CHECKOUT_ID,
      keyId: KEY_ID,
      propertyId: PROP_ID,
      checkedOutTo: 'John Doe',
      checkoutTime: now,
      checkedOutById: 'staff-user-1',
    });
    mockKeyUpdate.mockResolvedValue({ id: KEY_ID, status: 'checked_out' });

    const req = createPostRequest('/api/v1/keys/checkouts', {
      propertyId: PROP_ID,
      keyId: KEY_ID,
      checkedOutTo: 'John Doe',
      unitId: UNIT_ID,
      idType: 'drivers_license',
      reason: 'Move-in key issuance',
    });
    const res = await POST_CHECKOUT(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{ data: { checkoutTime: string } }>(res);
    expect(body.data.checkoutTime).toBeDefined();
  });

  it('sets checkedOutById to the authenticated staff user', async () => {
    mockKeyFindUnique.mockResolvedValue({
      id: KEY_ID,
      propertyId: PROP_ID,
      status: 'available',
      category: 'unit',
    });
    mockCheckoutCreate.mockResolvedValue({
      id: CHECKOUT_ID,
      keyId: KEY_ID,
      checkedOutById: 'staff-user-1',
      checkoutTime: new Date(),
    });
    mockKeyUpdate.mockResolvedValue({ id: KEY_ID, status: 'checked_out' });

    const req = createPostRequest('/api/v1/keys/checkouts', {
      propertyId: PROP_ID,
      keyId: KEY_ID,
      checkedOutTo: 'Jane Doe',
      unitId: UNIT_ID,
      idType: 'drivers_license',
      reason: 'Key pickup',
    });
    await POST_CHECKOUT(req);

    const createCall = mockCheckoutCreate.mock.calls[0]![0];
    expect(createCall.data.checkedOutById).toBe('staff-user-1');
  });

  it('updates key status to checked_out', async () => {
    mockKeyFindUnique.mockResolvedValue({
      id: KEY_ID,
      propertyId: PROP_ID,
      status: 'available',
      category: 'unit',
    });
    mockCheckoutCreate.mockResolvedValue({ id: CHECKOUT_ID, checkoutTime: new Date() });
    mockKeyUpdate.mockResolvedValue({ id: KEY_ID, status: 'checked_out' });

    const req = createPostRequest('/api/v1/keys/checkouts', {
      propertyId: PROP_ID,
      keyId: KEY_ID,
      checkedOutTo: 'Jane Doe',
      unitId: UNIT_ID,
      idType: 'drivers_license',
      reason: 'Key pickup',
    });
    await POST_CHECKOUT(req);

    const updateCall = mockKeyUpdate.mock.calls[0]![0];
    expect(updateCall.data.status).toBe('checked_out');
    expect(updateCall.where.id).toBe(KEY_ID);
  });
});

// ===========================================================================
// 2. Return key -> closes checkout with returnedAt
// ===========================================================================

describe('2. Return key', () => {
  it('sets returnTime on the checkout record', async () => {
    const returnTime = new Date();
    mockCheckoutFindUnique.mockResolvedValue({
      id: CHECKOUT_ID,
      keyId: KEY_ID,
      propertyId: PROP_ID,
      returnTime: null,
    });
    mockCheckoutUpdate.mockResolvedValue({
      id: CHECKOUT_ID,
      returnTime,
      returnedToId: 'staff-user-1',
    });
    mockKeyUpdate.mockResolvedValue({ id: KEY_ID, status: 'available' });

    const req = createPatchRequest(`/api/v1/keys/checkouts/${CHECKOUT_ID}`, {
      action: 'return',
      conditionNotes: 'Good condition',
    });
    const res = await PATCH_CHECKOUT(req, { params: Promise.resolve({ id: CHECKOUT_ID }) });

    expect(res.status).toBe(200);
    const updateCall = mockCheckoutUpdate.mock.calls[0]![0];
    expect(updateCall.data.returnTime).toBeInstanceOf(Date);
    expect(updateCall.data.returnedToId).toBe('staff-user-1');
  });

  it('sets key status back to available after return', async () => {
    mockCheckoutFindUnique.mockResolvedValue({
      id: CHECKOUT_ID,
      keyId: KEY_ID,
      propertyId: PROP_ID,
      returnTime: null,
    });
    mockCheckoutUpdate.mockResolvedValue({ id: CHECKOUT_ID, returnTime: new Date() });
    mockKeyUpdate.mockResolvedValue({ id: KEY_ID, status: 'available' });

    const req = createPatchRequest(`/api/v1/keys/checkouts/${CHECKOUT_ID}`, {
      action: 'return',
    });
    await PATCH_CHECKOUT(req, { params: Promise.resolve({ id: CHECKOUT_ID }) });

    const updateCall = mockKeyUpdate.mock.calls[0]![0];
    expect(updateCall.data.status).toBe('available');
  });
});

// ===========================================================================
// 3. Cannot return already-returned key
// ===========================================================================

describe('3. Cannot return already-returned key', () => {
  it('rejects return when returnTime is already set', async () => {
    mockCheckoutFindUnique.mockResolvedValue({
      id: CHECKOUT_ID,
      keyId: KEY_ID,
      propertyId: PROP_ID,
      returnTime: new Date('2025-01-01'),
    });

    const req = createPatchRequest(`/api/v1/keys/checkouts/${CHECKOUT_ID}`, {
      action: 'return',
    });
    const res = await PATCH_CHECKOUT(req, { params: Promise.resolve({ id: CHECKOUT_ID }) });

    expect(res.status).toBe(409);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('ALREADY_RETURNED');
    expect(mockCheckoutUpdate).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// 4. Decommission key -> status=decommissioned, reason stored
// ===========================================================================

describe('4. Decommission key', () => {
  it('sets status to decommissioned with reason and timestamp', async () => {
    mockKeyFindUnique.mockResolvedValue({
      id: KEY_ID,
      propertyId: PROP_ID,
      status: 'available',
      keyName: 'Master Key A',
    });
    mockKeyUpdate.mockResolvedValue({
      id: KEY_ID,
      status: 'decommissioned',
      decommissionReason: 'Lock cylinder replaced',
      decommissionedAt: new Date(),
    });

    const req = createPatchRequest(`/api/v1/keys/${KEY_ID}`, {
      action: 'decommission',
      reason: 'Lock cylinder replaced',
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: KEY_ID }) });

    expect(res.status).toBe(200);
    const updateCall = mockKeyUpdate.mock.calls[0]![0];
    expect(updateCall.data.status).toBe('decommissioned');
    expect(updateCall.data.decommissionReason).toBe('Lock cylinder replaced');
    expect(updateCall.data.decommissionedAt).toBeInstanceOf(Date);
  });
});

// ===========================================================================
// 5. Cannot issue decommissioned key
// ===========================================================================

describe('5. Cannot issue decommissioned key', () => {
  it('rejects checkout of a decommissioned key', async () => {
    mockKeyFindUnique.mockResolvedValue({
      id: KEY_ID,
      propertyId: PROP_ID,
      status: 'decommissioned',
      category: 'unit',
    });

    const req = createPostRequest('/api/v1/keys/checkouts', {
      propertyId: PROP_ID,
      keyId: KEY_ID,
      checkedOutTo: 'Jane Doe',
      unitId: UNIT_ID,
      idType: 'drivers_license',
      reason: 'Key pickup',
    });
    const res = await POST_CHECKOUT(req);

    expect(res.status).toBe(409);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('KEY_NOT_AVAILABLE');
    expect(mockCheckoutCreate).not.toHaveBeenCalled();
  });

  it('rejects checkout of a key already checked out', async () => {
    mockKeyFindUnique.mockResolvedValue({
      id: KEY_ID,
      propertyId: PROP_ID,
      status: 'checked_out',
      category: 'unit',
    });

    const req = createPostRequest('/api/v1/keys/checkouts', {
      propertyId: PROP_ID,
      keyId: KEY_ID,
      checkedOutTo: 'Jane Doe',
      unitId: UNIT_ID,
      idType: 'drivers_license',
      reason: 'Key pickup',
    });
    const res = await POST_CHECKOUT(req);

    expect(res.status).toBe(409);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('KEY_NOT_AVAILABLE');
  });
});

// ===========================================================================
// 6. Key history: list all checkouts for a key
// ===========================================================================

describe('6. Key history', () => {
  it('lists all checkouts for a given key', async () => {
    const checkouts = [
      {
        id: 'c1',
        keyId: KEY_ID,
        checkedOutTo: 'Alice',
        checkoutTime: new Date('2025-01-01'),
        returnTime: new Date('2025-01-02'),
      },
      {
        id: 'c2',
        keyId: KEY_ID,
        checkedOutTo: 'Bob',
        checkoutTime: new Date('2025-02-01'),
        returnTime: null,
      },
    ];
    mockCheckoutFindMany.mockResolvedValue(checkouts);

    const req = createGetRequest('/api/v1/keys/checkouts', {
      searchParams: { propertyId: PROP_ID, keyId: KEY_ID },
    });
    const res = await GET_CHECKOUTS(req);

    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: unknown[] }>(res);
    expect(body.data).toHaveLength(2);

    // Verify query scoped by keyId
    const where = mockCheckoutFindMany.mock.calls[0]![0].where;
    expect(where.keyId).toBe(KEY_ID);
  });

  it('orders checkouts by checkoutTime DESC — most recent first', async () => {
    mockCheckoutFindMany.mockResolvedValue([]);

    const req = createGetRequest('/api/v1/keys/checkouts', {
      searchParams: { propertyId: PROP_ID, keyId: KEY_ID },
    });
    await GET_CHECKOUTS(req);

    const orderBy = mockCheckoutFindMany.mock.calls[0]![0].orderBy;
    expect(orderBy).toEqual({ checkoutTime: 'desc' });
  });
});

// ===========================================================================
// 7. Resident key summary: all active keys for a unit
// ===========================================================================

describe('7. Resident key summary', () => {
  it('lists all active (unreturned) checkouts for a unit', async () => {
    const activeCheckouts = [
      { id: 'c1', keyId: 'k1', checkedOutTo: 'Alice', unitId: UNIT_ID, returnTime: null },
      { id: 'c2', keyId: 'k2', checkedOutTo: 'Alice', unitId: UNIT_ID, returnTime: null },
    ];
    mockCheckoutFindMany.mockResolvedValue(activeCheckouts);

    const req = createGetRequest('/api/v1/keys/checkouts', {
      searchParams: { propertyId: PROP_ID, unitId: UNIT_ID, active: 'true' },
    });
    const res = await GET_CHECKOUTS(req);

    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: unknown[] }>(res);
    expect(body.data).toHaveLength(2);

    // Must filter by unitId and returnTime = null
    const where = mockCheckoutFindMany.mock.calls[0]![0].where;
    expect(where.unitId).toBe(UNIT_ID);
    expect(where.returnTime).toBeNull();
  });
});

// ===========================================================================
// 8. Lost key: mark as lost -> auto-decommissions and creates security alert
// ===========================================================================

describe('8. Lost key', () => {
  it('marks key as lost and creates an incident report', async () => {
    const lostKey = {
      id: KEY_ID,
      keyName: 'Master Key A',
      propertyId: PROP_ID,
      status: 'lost',
      category: 'master',
    };
    mockKeyUpdate.mockResolvedValue(lostKey);
    mockIncidentCreate.mockResolvedValue({ id: 'incident-1' });

    const req = createPatchRequest(`/api/v1/keys/${KEY_ID}`, {
      action: 'lost',
      reportedBy: 'Front Desk Staff',
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: KEY_ID }) });

    expect(res.status).toBe(200);

    // Key status set to lost
    const keyUpdateCall = mockKeyUpdate.mock.calls[0]![0];
    expect(keyUpdateCall.data.status).toBe('lost');

    // Incident report created for security alert
    expect(mockIncidentCreate).toHaveBeenCalled();
    const incidentData = mockIncidentCreate.mock.calls[0]![0].data;
    expect(incidentData.title).toContain('Master Key A');
    expect(incidentData.propertyId).toBe(PROP_ID);
  });

  it('includes key name and category in the security alert', async () => {
    mockKeyUpdate.mockResolvedValue({
      id: KEY_ID,
      keyName: 'FOB #1234',
      propertyId: PROP_ID,
      status: 'lost',
      category: 'master',
    });
    mockIncidentCreate.mockResolvedValue({ id: 'incident-2' });

    const req = createPatchRequest(`/api/v1/keys/${KEY_ID}`, {
      action: 'lost',
      reportedBy: 'Guard',
    });
    await PATCH(req, { params: Promise.resolve({ id: KEY_ID }) });

    const incidentData = mockIncidentCreate.mock.calls[0]![0].data;
    expect(incidentData.title).toContain('FOB #1234');
    expect(incidentData.reportBody).toContain('lost');
  });
});

// ===========================================================================
// 9. Key categories: FOB, buzzer_code, garage_clicker, mailbox, storage_locker
// ===========================================================================

describe('9. Key categories', () => {
  const categories = [
    'fob',
    'buzzer_code',
    'garage_clicker',
    'mailbox',
    'storage_locker',
    'master',
    'unit',
    'common_area',
    'vehicle',
    'equipment',
    'other',
  ] as const;

  for (const category of categories) {
    it(`accepts category "${category}"`, async () => {
      mockKeyCreate.mockResolvedValue({
        id: 'k-new',
        keyName: `Test ${category}`,
        category,
        status: 'available',
        createdById: 'staff-user-1',
      });

      const req = createPostRequest('/api/v1/keys', {
        propertyId: PROP_ID,
        keyName: `Test ${category}`,
        category,
      });
      const res = await POST(req);

      expect(res.status).toBe(201);
    });
  }

  it('rejects an unknown category', async () => {
    const req = createPostRequest('/api/v1/keys', {
      propertyId: PROP_ID,
      keyName: 'Invalid',
      category: 'imaginary',
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });
});

// ===========================================================================
// 10. Maximum keys per unit enforcement (configurable per category)
// ===========================================================================

describe('10. Maximum keys per unit enforcement', () => {
  it('rejects issuance when unit already has max keys for category (e.g., 6 FOBs)', async () => {
    mockKeyFindUnique.mockResolvedValue({
      id: KEY_ID,
      propertyId: PROP_ID,
      status: 'available',
      category: 'fob',
    });
    // Unit already has 6 active FOB checkouts
    mockCheckoutFindMany.mockResolvedValue([]);
    mockKeyCount.mockResolvedValue(6);

    const req = createPostRequest('/api/v1/keys/checkouts', {
      propertyId: PROP_ID,
      keyId: KEY_ID,
      checkedOutTo: 'Max Resident',
      unitId: UNIT_ID,
      idType: 'drivers_license',
      reason: 'Additional FOB',
      enforceMax: true,
    });
    const res = await POST_CHECKOUT(req);

    expect(res.status).toBe(409);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MAX_KEYS_EXCEEDED');
  });

  it('allows issuance when under the max limit', async () => {
    mockKeyFindUnique.mockResolvedValue({
      id: KEY_ID,
      propertyId: PROP_ID,
      status: 'available',
      category: 'fob',
    });
    mockKeyCount.mockResolvedValue(3); // Under 6 FOB limit
    mockCheckoutCreate.mockResolvedValue({
      id: CHECKOUT_ID,
      keyId: KEY_ID,
      checkoutTime: new Date(),
    });
    mockKeyUpdate.mockResolvedValue({ id: KEY_ID, status: 'checked_out' });

    const req = createPostRequest('/api/v1/keys/checkouts', {
      propertyId: PROP_ID,
      keyId: KEY_ID,
      checkedOutTo: 'Under-limit Resident',
      unitId: UNIT_ID,
      idType: 'drivers_license',
      reason: 'New FOB',
      enforceMax: true,
    });
    const res = await POST_CHECKOUT(req);

    expect(res.status).toBe(201);
  });
});

// ===========================================================================
// 11. Bulk key issuance for move-in
// ===========================================================================

describe('11. Bulk key issuance for move-in', () => {
  it('creates multiple checkout records in one request', async () => {
    const keyIds = ['k1', 'k2', 'k3'];

    // Each key lookup returns available
    mockKeyFindUnique
      .mockResolvedValueOnce({
        id: 'k1',
        propertyId: PROP_ID,
        status: 'available',
        category: 'fob',
      })
      .mockResolvedValueOnce({
        id: 'k2',
        propertyId: PROP_ID,
        status: 'available',
        category: 'unit',
      })
      .mockResolvedValueOnce({
        id: 'k3',
        propertyId: PROP_ID,
        status: 'available',
        category: 'garage_clicker',
      });

    const bulkResult = keyIds.map((keyId) => ({
      id: `checkout-${keyId}`,
      keyId,
      checkoutTime: new Date(),
    }));

    mockTransaction.mockResolvedValue(bulkResult);

    const req = createPostRequest('/api/v1/keys/checkouts', {
      propertyId: PROP_ID,
      bulk: true,
      checkedOutTo: 'New Resident',
      unitId: UNIT_ID,
      idType: 'drivers_license',
      reason: 'Move-in package',
      keyIds,
    });
    const res = await POST_CHECKOUT(req);

    expect(res.status).toBe(201);
    const body = await parseResponse<{ data: unknown[] }>(res);
    expect(body.data).toHaveLength(3);
  });

  it('rejects bulk issuance if any key is unavailable', async () => {
    mockKeyFindUnique
      .mockResolvedValueOnce({
        id: 'k1',
        propertyId: PROP_ID,
        status: 'available',
        category: 'fob',
      })
      .mockResolvedValueOnce({
        id: 'k2',
        propertyId: PROP_ID,
        status: 'decommissioned',
        category: 'unit',
      });

    const req = createPostRequest('/api/v1/keys/checkouts', {
      propertyId: PROP_ID,
      bulk: true,
      checkedOutTo: 'New Resident',
      unitId: UNIT_ID,
      idType: 'drivers_license',
      reason: 'Move-in package',
      keyIds: ['k1', 'k2'],
    });
    const res = await POST_CHECKOUT(req);

    expect(res.status).toBe(409);
    const body = await parseResponse<{ error: string; message: string }>(res);
    expect(body.error).toBe('KEY_NOT_AVAILABLE');
    expect(body.message).toContain('k2');
  });
});

// ===========================================================================
// 12. Key audit trail: who issued, when, to whom
// ===========================================================================

describe('12. Key audit trail', () => {
  it('checkout record stores checkedOutById, checkedOutTo, and checkoutTime', async () => {
    mockKeyFindUnique.mockResolvedValue({
      id: KEY_ID,
      propertyId: PROP_ID,
      status: 'available',
      category: 'unit',
    });
    mockCheckoutCreate.mockResolvedValue({
      id: CHECKOUT_ID,
      keyId: KEY_ID,
      checkedOutTo: 'Audit Target',
      checkedOutById: 'staff-user-1',
      checkoutTime: new Date(),
    });
    mockKeyUpdate.mockResolvedValue({ id: KEY_ID, status: 'checked_out' });

    const req = createPostRequest('/api/v1/keys/checkouts', {
      propertyId: PROP_ID,
      keyId: KEY_ID,
      checkedOutTo: 'Audit Target',
      unitId: UNIT_ID,
      idType: 'drivers_license',
      reason: 'Audit test',
    });
    const res = await POST_CHECKOUT(req);

    expect(res.status).toBe(201);
    const createCall = mockCheckoutCreate.mock.calls[0]![0];
    expect(createCall.data.checkedOutTo).toBe('Audit Target');
    expect(createCall.data.checkedOutById).toBe('staff-user-1');
    expect(createCall.data.checkoutTime).toBeInstanceOf(Date);
  });

  it('return record stores returnedToId and returnTime', async () => {
    mockCheckoutFindUnique.mockResolvedValue({
      id: CHECKOUT_ID,
      keyId: KEY_ID,
      propertyId: PROP_ID,
      returnTime: null,
    });
    mockCheckoutUpdate.mockResolvedValue({
      id: CHECKOUT_ID,
      returnTime: new Date(),
      returnedToId: 'staff-user-1',
    });
    mockKeyUpdate.mockResolvedValue({ id: KEY_ID, status: 'available' });

    const req = createPatchRequest(`/api/v1/keys/checkouts/${CHECKOUT_ID}`, {
      action: 'return',
    });
    await PATCH_CHECKOUT(req, { params: Promise.resolve({ id: CHECKOUT_ID }) });

    const updateCall = mockCheckoutUpdate.mock.calls[0]![0];
    expect(updateCall.data.returnedToId).toBe('staff-user-1');
    expect(updateCall.data.returnTime).toBeInstanceOf(Date);
  });
});

// ===========================================================================
// 13. Tenant isolation: only see your property's keys
// ===========================================================================

describe('13. Tenant isolation', () => {
  it('checkout listing requires propertyId', async () => {
    const req = createGetRequest('/api/v1/keys/checkouts');
    const res = await GET_CHECKOUTS(req);

    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_PROPERTY');
    expect(mockCheckoutFindMany).not.toHaveBeenCalled();
  });

  it('checkout listing scopes query to propertyId', async () => {
    mockCheckoutFindMany.mockResolvedValue([]);

    const req = createGetRequest('/api/v1/keys/checkouts', {
      searchParams: { propertyId: PROP_ID },
    });
    await GET_CHECKOUTS(req);

    const where = mockCheckoutFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROP_ID);
  });

  it('checkout issuance validates key belongs to the specified property', async () => {
    mockKeyFindUnique.mockResolvedValue({
      id: KEY_ID,
      propertyId: 'different-property',
      status: 'available',
      category: 'unit',
    });

    const req = createPostRequest('/api/v1/keys/checkouts', {
      propertyId: PROP_ID,
      keyId: KEY_ID,
      checkedOutTo: 'Cross-tenant',
      unitId: UNIT_ID,
      idType: 'drivers_license',
      reason: 'Should fail',
    });
    const res = await POST_CHECKOUT(req);

    expect(res.status).toBe(404);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('KEY_NOT_FOUND');
  });
});
