/**
 * Key Checkout/Return Lifecycle Tests — per PRD 03 + Aquarius FOB Management
 *
 * Keys are physical security assets. A lost FOB can give unauthorized access
 * to 500+ units, parking garages, and storage rooms. Every checkout must be
 * traced back to a specific person with ID verification, and every return
 * must restore the key to the available pool.
 *
 * Aquarius spec: 6 FOB slots, 2 buzzer codes, 2 garage clickers per unit.
 *
 * These tests cover:
 * - Checkout with all required fields
 * - ID type validation
 * - Max keys per unit enforcement
 * - Preventing checkout of unavailable keys
 * - Staff attribution (createdById)
 * - Return lifecycle (returnTime, returnedToId, status restoration)
 * - Double-return prevention
 * - Overdue detection
 * - Key history audit trail
 * - Lost key workflow (mark lost -> incident -> decommission)
 * - Key transfer scenarios
 * - Tenant isolation
 * - Edge cases and error handling
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
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
      userId: 'staff-carlos',
      propertyId: '00000000-0000-4000-b000-000000000001',
      role: 'front_desk',
      permissions: ['*'],
      mfaVerified: false,
    },
    error: null,
  }),
}));

vi.mock('@/lib/sanitize', () => ({
  stripHtml: (s: string) => s.replace(/<[^>]*>/g, ''),
  stripControlChars: (s: string) => s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''),
}));

// ---------------------------------------------------------------------------
// Import routes (after mocks)
// ---------------------------------------------------------------------------

import { GET as GET_KEYS, POST as POST_KEY } from '../route';
import { GET as GET_KEY_DETAIL, PATCH as PATCH_KEY } from '../[id]/route';
import { GET as GET_CHECKOUTS, POST as POST_CHECKOUT } from '../../keys/checkouts/route';
import { PATCH as PATCH_CHECKOUT } from '../../keys/checkouts/[id]/route';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROP_ID = '00000000-0000-4000-b000-000000000001';
const OTHER_PROP_ID = '00000000-0000-4000-b000-000000000099';
const KEY_ID = '00000000-0000-4000-b000-000000000010';
const KEY_ID_2 = '00000000-0000-4000-b000-000000000011';
const KEY_ID_3 = '00000000-0000-4000-b000-000000000012';
const UNIT_ID = '00000000-0000-4000-b000-000000000020';
const UNIT_ID_2 = '00000000-0000-4000-b000-000000000021';
const CHECKOUT_ID = '00000000-0000-4000-b000-000000000030';
const CHECKOUT_ID_2 = '00000000-0000-4000-b000-000000000031';

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
  mockIncidentCreate.mockResolvedValue({});
  mockTransaction.mockImplementation(async (fn: unknown) => {
    if (Array.isArray(fn)) {
      return Promise.all(fn);
    }
    const { prisma } = await import('@/server/db');
    return (fn as (tx: unknown) => Promise<unknown>)(prisma);
  });
});

// ===========================================================================
// 1. POST checkout with all required fields
// ===========================================================================

describe('POST /api/v1/keys/checkouts — Checkout with required fields', () => {
  const validCheckout = {
    propertyId: PROP_ID,
    keyId: KEY_ID,
    checkedOutTo: 'Maria Rodriguez',
    unitId: UNIT_ID,
    idType: 'drivers_license',
    reason: 'Move-in key issuance',
  };

  it('creates checkout with keyId, checkedOutTo, unitId, idType, reason', async () => {
    mockKeyFindUnique.mockResolvedValue({
      id: KEY_ID,
      propertyId: PROP_ID,
      status: 'available',
      category: 'unit',
    });
    mockCheckoutCreate.mockResolvedValue({
      id: CHECKOUT_ID,
      ...validCheckout,
      checkoutTime: new Date(),
      checkedOutById: 'staff-carlos',
    });
    mockKeyUpdate.mockResolvedValue({ id: KEY_ID, status: 'checked_out' });

    const req = createPostRequest('/api/v1/keys/checkouts', validCheckout);
    const res = await POST_CHECKOUT(req);

    expect(res.status).toBe(201);
    const createCall = mockCheckoutCreate.mock.calls[0]![0];
    expect(createCall.data.keyId).toBe(KEY_ID);
    expect(createCall.data.checkedOutTo).toBe('Maria Rodriguez');
    expect(createCall.data.unitId).toBe(UNIT_ID);
    expect(createCall.data.idType).toBe('drivers_license');
    expect(createCall.data.reason).toBe('Move-in key issuance');
  });

  it('rejects checkout missing checkedOutTo', async () => {
    const req = createPostRequest('/api/v1/keys/checkouts', {
      ...validCheckout,
      checkedOutTo: '',
    });
    const res = await POST_CHECKOUT(req);
    expect(res.status).toBe(400);
  });

  it('rejects checkout missing keyId', async () => {
    const req = createPostRequest('/api/v1/keys/checkouts', {
      ...validCheckout,
      keyId: '',
    });
    const res = await POST_CHECKOUT(req);
    expect(res.status).toBe(400);
  });

  it('rejects checkout missing idType', async () => {
    const req = createPostRequest('/api/v1/keys/checkouts', {
      ...validCheckout,
      idType: '',
    });
    const res = await POST_CHECKOUT(req);
    expect(res.status).toBe(400);
  });

  it('rejects checkout missing reason', async () => {
    const req = createPostRequest('/api/v1/keys/checkouts', {
      ...validCheckout,
      reason: '',
    });
    const res = await POST_CHECKOUT(req);
    expect(res.status).toBe(400);
  });

  it('stores expectedReturn when provided', async () => {
    const expectedReturn = '2026-03-20T17:00:00Z';
    mockKeyFindUnique.mockResolvedValue({
      id: KEY_ID,
      propertyId: PROP_ID,
      status: 'available',
      category: 'unit',
    });
    mockCheckoutCreate.mockResolvedValue({
      id: CHECKOUT_ID,
      checkoutTime: new Date(),
      expectedReturn: new Date(expectedReturn),
    });
    mockKeyUpdate.mockResolvedValue({ id: KEY_ID, status: 'checked_out' });

    const req = createPostRequest('/api/v1/keys/checkouts', {
      ...validCheckout,
      expectedReturn,
    });
    await POST_CHECKOUT(req);

    const createCall = mockCheckoutCreate.mock.calls[0]![0];
    expect(createCall.data.expectedReturn).toBeInstanceOf(Date);
  });

  it('stores idNumber when provided', async () => {
    mockKeyFindUnique.mockResolvedValue({
      id: KEY_ID,
      propertyId: PROP_ID,
      status: 'available',
      category: 'unit',
    });
    mockCheckoutCreate.mockResolvedValue({ id: CHECKOUT_ID, checkoutTime: new Date() });
    mockKeyUpdate.mockResolvedValue({ id: KEY_ID, status: 'checked_out' });

    const req = createPostRequest('/api/v1/keys/checkouts', {
      ...validCheckout,
      idNumber: 'DL-12345-ON',
    });
    await POST_CHECKOUT(req);

    const createCall = mockCheckoutCreate.mock.calls[0]![0];
    expect(createCall.data.idNumber).toBe('DL-12345-ON');
  });
});

// ===========================================================================
// 2. POST validates ID type
// ===========================================================================

describe('POST — ID type validation', () => {
  const baseCheckout = {
    propertyId: PROP_ID,
    keyId: KEY_ID,
    checkedOutTo: 'Test Person',
    unitId: UNIT_ID,
    reason: 'Key pickup',
  };

  it.each(['drivers_license', 'passport', 'building_id', 'other', 'health_card'])(
    'accepts idType "%s" as a string value',
    async (idType) => {
      mockKeyFindUnique.mockResolvedValue({
        id: KEY_ID,
        propertyId: PROP_ID,
        status: 'available',
        category: 'unit',
      });
      mockCheckoutCreate.mockResolvedValue({ id: CHECKOUT_ID, checkoutTime: new Date() });
      mockKeyUpdate.mockResolvedValue({ id: KEY_ID, status: 'checked_out' });

      const req = createPostRequest('/api/v1/keys/checkouts', {
        ...baseCheckout,
        idType,
      });
      const res = await POST_CHECKOUT(req);

      expect(res.status).toBe(201);
    },
  );
});

// ===========================================================================
// 3. POST enforces max 6 keys per unit (FOB category)
// ===========================================================================

describe('POST — Max keys per unit enforcement', () => {
  it('rejects when unit already has 6 FOBs and enforceMax=true', async () => {
    mockKeyFindUnique.mockResolvedValue({
      id: KEY_ID,
      propertyId: PROP_ID,
      status: 'available',
      category: 'fob',
    });
    mockKeyCount.mockResolvedValue(6);

    const req = createPostRequest('/api/v1/keys/checkouts', {
      propertyId: PROP_ID,
      keyId: KEY_ID,
      checkedOutTo: 'Seventh FOB Attempt',
      unitId: UNIT_ID,
      idType: 'drivers_license',
      reason: 'Additional FOB request',
      enforceMax: true,
    });
    const res = await POST_CHECKOUT(req);

    expect(res.status).toBe(409);
    const body = await parseResponse<{ error: string; message: string }>(res);
    expect(body.error).toBe('MAX_KEYS_EXCEEDED');
    expect(body.message).toContain('6');
  });

  it('rejects when unit already has 2 buzzer codes and enforceMax=true', async () => {
    mockKeyFindUnique.mockResolvedValue({
      id: KEY_ID,
      propertyId: PROP_ID,
      status: 'available',
      category: 'buzzer_code',
    });
    mockKeyCount.mockResolvedValue(2);

    const req = createPostRequest('/api/v1/keys/checkouts', {
      propertyId: PROP_ID,
      keyId: KEY_ID,
      checkedOutTo: 'Third Buzzer Attempt',
      unitId: UNIT_ID,
      idType: 'drivers_license',
      reason: 'Buzzer code request',
      enforceMax: true,
    });
    const res = await POST_CHECKOUT(req);

    expect(res.status).toBe(409);
    expect((await parseResponse<{ error: string }>(res)).error).toBe('MAX_KEYS_EXCEEDED');
  });

  it('rejects when unit already has 2 garage clickers and enforceMax=true', async () => {
    mockKeyFindUnique.mockResolvedValue({
      id: KEY_ID,
      propertyId: PROP_ID,
      status: 'available',
      category: 'garage_clicker',
    });
    mockKeyCount.mockResolvedValue(2);

    const req = createPostRequest('/api/v1/keys/checkouts', {
      propertyId: PROP_ID,
      keyId: KEY_ID,
      checkedOutTo: 'Third Clicker Attempt',
      unitId: UNIT_ID,
      idType: 'building_id',
      reason: 'Clicker request',
      enforceMax: true,
    });
    const res = await POST_CHECKOUT(req);

    expect(res.status).toBe(409);
  });

  it('allows checkout when under limit with enforceMax=true', async () => {
    mockKeyFindUnique.mockResolvedValue({
      id: KEY_ID,
      propertyId: PROP_ID,
      status: 'available',
      category: 'fob',
    });
    mockKeyCount.mockResolvedValue(4); // Under 6 limit
    mockCheckoutCreate.mockResolvedValue({ id: CHECKOUT_ID, checkoutTime: new Date() });
    mockKeyUpdate.mockResolvedValue({ id: KEY_ID, status: 'checked_out' });

    const req = createPostRequest('/api/v1/keys/checkouts', {
      propertyId: PROP_ID,
      keyId: KEY_ID,
      checkedOutTo: 'Under Limit',
      unitId: UNIT_ID,
      idType: 'drivers_license',
      reason: 'New FOB',
      enforceMax: true,
    });
    const res = await POST_CHECKOUT(req);

    expect(res.status).toBe(201);
  });

  it('skips max enforcement when enforceMax is not set', async () => {
    mockKeyFindUnique.mockResolvedValue({
      id: KEY_ID,
      propertyId: PROP_ID,
      status: 'available',
      category: 'fob',
    });
    mockCheckoutCreate.mockResolvedValue({ id: CHECKOUT_ID, checkoutTime: new Date() });
    mockKeyUpdate.mockResolvedValue({ id: KEY_ID, status: 'checked_out' });

    const req = createPostRequest('/api/v1/keys/checkouts', {
      propertyId: PROP_ID,
      keyId: KEY_ID,
      checkedOutTo: 'No Max Check',
      unitId: UNIT_ID,
      idType: 'drivers_license',
      reason: 'Key pickup',
    });
    const res = await POST_CHECKOUT(req);

    expect(res.status).toBe(201);
    // mockKeyCount should NOT have been called for enforcement
    expect(mockKeyCount).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// 4. POST prevents checking out unavailable key
// ===========================================================================

describe('POST — Unavailable key prevention', () => {
  const baseCheckout = {
    propertyId: PROP_ID,
    keyId: KEY_ID,
    checkedOutTo: 'Jane Doe',
    unitId: UNIT_ID,
    idType: 'drivers_license',
    reason: 'Key pickup',
  };

  it('rejects checkout of a checked_out key', async () => {
    mockKeyFindUnique.mockResolvedValue({
      id: KEY_ID,
      propertyId: PROP_ID,
      status: 'checked_out',
      category: 'unit',
    });

    const req = createPostRequest('/api/v1/keys/checkouts', baseCheckout);
    const res = await POST_CHECKOUT(req);

    expect(res.status).toBe(409);
    const body = await parseResponse<{ error: string; message: string }>(res);
    expect(body.error).toBe('KEY_NOT_AVAILABLE');
    expect(body.message).toContain('checked_out');
  });

  it('rejects checkout of a decommissioned key', async () => {
    mockKeyFindUnique.mockResolvedValue({
      id: KEY_ID,
      propertyId: PROP_ID,
      status: 'decommissioned',
      category: 'unit',
    });

    const req = createPostRequest('/api/v1/keys/checkouts', baseCheckout);
    const res = await POST_CHECKOUT(req);

    expect(res.status).toBe(409);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('KEY_NOT_AVAILABLE');
  });

  it('rejects checkout of a lost key', async () => {
    mockKeyFindUnique.mockResolvedValue({
      id: KEY_ID,
      propertyId: PROP_ID,
      status: 'lost',
      category: 'fob',
    });

    const req = createPostRequest('/api/v1/keys/checkouts', baseCheckout);
    const res = await POST_CHECKOUT(req);

    expect(res.status).toBe(409);
  });

  it('returns 404 when key does not exist', async () => {
    mockKeyFindUnique.mockResolvedValue(null);

    const req = createPostRequest('/api/v1/keys/checkouts', baseCheckout);
    const res = await POST_CHECKOUT(req);

    expect(res.status).toBe(404);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('KEY_NOT_FOUND');
  });
});

// ===========================================================================
// 5. POST records who checked out the key (createdById)
// ===========================================================================

describe('POST — Staff attribution', () => {
  it('records checkedOutById from authenticated user', async () => {
    mockKeyFindUnique.mockResolvedValue({
      id: KEY_ID,
      propertyId: PROP_ID,
      status: 'available',
      category: 'unit',
    });
    mockCheckoutCreate.mockResolvedValue({
      id: CHECKOUT_ID,
      checkedOutById: 'staff-carlos',
      checkoutTime: new Date(),
    });
    mockKeyUpdate.mockResolvedValue({ id: KEY_ID, status: 'checked_out' });

    const req = createPostRequest('/api/v1/keys/checkouts', {
      propertyId: PROP_ID,
      keyId: KEY_ID,
      checkedOutTo: 'Recipient',
      unitId: UNIT_ID,
      idType: 'drivers_license',
      reason: 'Key pickup',
    });
    await POST_CHECKOUT(req);

    const createCall = mockCheckoutCreate.mock.calls[0]![0];
    expect(createCall.data.checkedOutById).toBe('staff-carlos');
  });

  it('records checkoutTime as current timestamp', async () => {
    mockKeyFindUnique.mockResolvedValue({
      id: KEY_ID,
      propertyId: PROP_ID,
      status: 'available',
      category: 'unit',
    });
    mockCheckoutCreate.mockResolvedValue({ id: CHECKOUT_ID, checkoutTime: new Date() });
    mockKeyUpdate.mockResolvedValue({ id: KEY_ID, status: 'checked_out' });

    const beforeTime = new Date();
    const req = createPostRequest('/api/v1/keys/checkouts', {
      propertyId: PROP_ID,
      keyId: KEY_ID,
      checkedOutTo: 'Time Test',
      unitId: UNIT_ID,
      idType: 'passport',
      reason: 'Timing test',
    });
    await POST_CHECKOUT(req);

    const createCall = mockCheckoutCreate.mock.calls[0]![0];
    const checkoutTime = createCall.data.checkoutTime as Date;
    expect(checkoutTime.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
  });

  it('updates key status to checked_out after checkout', async () => {
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
      checkedOutTo: 'Status Test',
      unitId: UNIT_ID,
      idType: 'building_id',
      reason: 'Status test',
    });
    await POST_CHECKOUT(req);

    const updateCall = mockKeyUpdate.mock.calls[0]![0];
    expect(updateCall.where.id).toBe(KEY_ID);
    expect(updateCall.data.status).toBe('checked_out');
  });
});

// ===========================================================================
// 6. PATCH return key sets returnTime and returnedToId
// ===========================================================================

describe('PATCH /api/v1/keys/checkouts/:id — Return key', () => {
  it('sets returnTime on the checkout record', async () => {
    mockCheckoutFindUnique.mockResolvedValue({
      id: CHECKOUT_ID,
      keyId: KEY_ID,
      propertyId: PROP_ID,
      returnTime: null,
    });
    mockCheckoutUpdate.mockResolvedValue({
      id: CHECKOUT_ID,
      returnTime: new Date(),
      returnedToId: 'staff-carlos',
    });
    mockKeyUpdate.mockResolvedValue({ id: KEY_ID, status: 'available' });

    const req = createPatchRequest(`/api/v1/keys/checkouts/${CHECKOUT_ID}`, {
      action: 'return',
    });
    const res = await PATCH_CHECKOUT(req, { params: Promise.resolve({ id: CHECKOUT_ID }) });

    expect(res.status).toBe(200);
    const updateCall = mockCheckoutUpdate.mock.calls[0]![0];
    expect(updateCall.data.returnTime).toBeInstanceOf(Date);
  });

  it('sets returnedToId from authenticated user', async () => {
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

    const updateCall = mockCheckoutUpdate.mock.calls[0]![0];
    expect(updateCall.data.returnedToId).toBe('staff-carlos');
  });

  it('stores conditionNotes when provided', async () => {
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
      conditionNotes: 'Key slightly bent but functional',
    });
    await PATCH_CHECKOUT(req, { params: Promise.resolve({ id: CHECKOUT_ID }) });

    const updateCall = mockCheckoutUpdate.mock.calls[0]![0];
    expect(updateCall.data.conditionNotes).toBe('Key slightly bent but functional');
  });

  it('returns success message', async () => {
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
    const res = await PATCH_CHECKOUT(req, { params: Promise.resolve({ id: CHECKOUT_ID }) });

    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('returned');
  });
});

// ===========================================================================
// 7. PATCH return rejects already-returned key
// ===========================================================================

describe('PATCH — Double-return prevention', () => {
  it('returns 409 ALREADY_RETURNED for already-returned key', async () => {
    mockCheckoutFindUnique.mockResolvedValue({
      id: CHECKOUT_ID,
      keyId: KEY_ID,
      propertyId: PROP_ID,
      returnTime: new Date('2026-03-18T10:00:00Z'),
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
// 8. PATCH return restores key to available status
// ===========================================================================

describe('PATCH — Key status restoration on return', () => {
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

    const keyUpdateCall = mockKeyUpdate.mock.calls[0]![0];
    expect(keyUpdateCall.where.id).toBe(KEY_ID);
    expect(keyUpdateCall.data.status).toBe('available');
  });
});

// ===========================================================================
// 9. Overdue detection
// ===========================================================================

describe('GET /api/v1/keys — Overdue detection', () => {
  it('enriches key listing with isOverdue=true when past expectedReturn', async () => {
    const pastDate = new Date('2026-03-01T00:00:00Z');
    mockKeyFindMany.mockResolvedValue([
      {
        id: KEY_ID,
        propertyId: PROP_ID,
        keyName: 'Overdue Key',
        category: 'unit',
        status: 'checked_out',
        checkouts: [
          {
            id: CHECKOUT_ID,
            checkedOutTo: 'Late Larry',
            checkoutTime: new Date('2026-02-01'),
            expectedReturn: pastDate,
            returnTime: null,
            unitId: UNIT_ID,
          },
        ],
      },
    ]);
    mockKeyCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/keys', {
      searchParams: { propertyId: PROP_ID },
    });
    const res = await GET_KEYS(req);

    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: Array<{ isOverdue: boolean }> }>(res);
    expect(body.data[0]!.isOverdue).toBe(true);
  });

  it('enriches key listing with isOverdue=false when not past expectedReturn', async () => {
    const futureDate = new Date();
    futureDate.setFullYear(futureDate.getFullYear() + 1);

    mockKeyFindMany.mockResolvedValue([
      {
        id: KEY_ID,
        propertyId: PROP_ID,
        keyName: 'On-Time Key',
        category: 'unit',
        status: 'checked_out',
        checkouts: [
          {
            id: CHECKOUT_ID,
            checkedOutTo: 'Punctual Pete',
            checkoutTime: new Date(),
            expectedReturn: futureDate,
            returnTime: null,
            unitId: UNIT_ID,
          },
        ],
      },
    ]);
    mockKeyCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/keys', {
      searchParams: { propertyId: PROP_ID },
    });
    const res = await GET_KEYS(req);

    const body = await parseResponse<{ data: Array<{ isOverdue: boolean }> }>(res);
    expect(body.data[0]!.isOverdue).toBe(false);
  });

  it('sets isOverdue=false for returned keys', async () => {
    mockKeyFindMany.mockResolvedValue([
      {
        id: KEY_ID,
        propertyId: PROP_ID,
        keyName: 'Returned Key',
        category: 'unit',
        status: 'available',
        checkouts: [
          {
            id: CHECKOUT_ID,
            checkedOutTo: 'Returner',
            checkoutTime: new Date('2026-01-01'),
            expectedReturn: new Date('2026-01-15'),
            returnTime: new Date('2026-01-14'), // returned before expected
            unitId: UNIT_ID,
          },
        ],
      },
    ]);
    mockKeyCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/keys', {
      searchParams: { propertyId: PROP_ID },
    });
    const res = await GET_KEYS(req);

    const body = await parseResponse<{
      data: Array<{ isOverdue: boolean; activeCheckout: unknown }>;
    }>(res);
    expect(body.data[0]!.isOverdue).toBe(false);
    expect(body.data[0]!.activeCheckout).toBeNull();
  });
});

// ===========================================================================
// 10. Key history audit trail
// ===========================================================================

describe('GET /api/v1/keys/:id — Key history audit trail', () => {
  it('returns checkout history for a key', async () => {
    mockKeyFindUnique.mockResolvedValue({
      id: KEY_ID,
      propertyId: PROP_ID,
      keyName: 'Master Key A',
      category: 'master',
      status: 'available',
      checkouts: [
        {
          id: 'c1',
          checkedOutTo: 'Alice',
          checkoutTime: new Date('2026-01-01'),
          returnTime: new Date('2026-01-02'),
          expectedReturn: null,
          company: null,
          unitId: UNIT_ID,
          idType: 'drivers_license',
          reason: 'Inspection',
          conditionNotes: null,
        },
        {
          id: 'c2',
          checkedOutTo: 'Bob',
          checkoutTime: new Date('2026-02-01'),
          returnTime: null,
          expectedReturn: new Date('2026-02-15'),
          company: 'Acme Co',
          unitId: UNIT_ID,
          idType: 'passport',
          reason: 'Contractor work',
          conditionNotes: null,
        },
      ],
    });

    const req = createGetRequest(`/api/v1/keys/${KEY_ID}`);
    const res = await GET_KEY_DETAIL(req, { params: Promise.resolve({ id: KEY_ID }) });

    expect(res.status).toBe(200);
    const body = await parseResponse<{
      data: {
        totalCheckouts: number;
        activeCheckout: { checkedOutTo: string } | null;
        isOverdue: boolean;
      };
    }>(res);
    expect(body.data.totalCheckouts).toBe(2);
    expect(body.data.activeCheckout).not.toBeNull();
    expect(body.data.activeCheckout!.checkedOutTo).toBe('Bob');
  });

  it('returns null activeCheckout when all checkouts are returned', async () => {
    mockKeyFindUnique.mockResolvedValue({
      id: KEY_ID,
      propertyId: PROP_ID,
      keyName: 'Returned Key',
      category: 'unit',
      status: 'available',
      checkouts: [
        {
          id: 'c1',
          checkedOutTo: 'Alice',
          checkoutTime: new Date('2026-01-01'),
          returnTime: new Date('2026-01-02'),
          expectedReturn: null,
          company: null,
          unitId: UNIT_ID,
          idType: 'drivers_license',
          reason: 'Visit',
          conditionNotes: null,
        },
      ],
    });

    const req = createGetRequest(`/api/v1/keys/${KEY_ID}`);
    const res = await GET_KEY_DETAIL(req, { params: Promise.resolve({ id: KEY_ID }) });

    const body = await parseResponse<{ data: { activeCheckout: unknown } }>(res);
    expect(body.data.activeCheckout).toBeNull();
  });

  it('returns 404 for non-existent key', async () => {
    mockKeyFindUnique.mockResolvedValue(null);

    const req = createGetRequest(`/api/v1/keys/nonexistent`);
    const res = await GET_KEY_DETAIL(req, { params: Promise.resolve({ id: 'nonexistent' }) });

    expect(res.status).toBe(404);
  });
});

// ===========================================================================
// 11. Lost key workflow
// ===========================================================================

describe('PATCH /api/v1/keys/:id — Lost key workflow', () => {
  it('marks key as lost and creates incident report', async () => {
    mockKeyUpdate.mockResolvedValue({
      id: KEY_ID,
      keyName: 'FOB #1234',
      propertyId: PROP_ID,
      status: 'lost',
      category: 'fob',
    });
    mockIncidentCreate.mockResolvedValue({ id: 'incident-1' });

    const req = createPatchRequest(`/api/v1/keys/${KEY_ID}`, {
      action: 'lost',
      reportedBy: 'Guard Singh',
    });
    const res = await PATCH_KEY(req, { params: Promise.resolve({ id: KEY_ID }) });

    expect(res.status).toBe(200);

    // Key status set to lost
    const keyUpdateCall = mockKeyUpdate.mock.calls[0]![0];
    expect(keyUpdateCall.data.status).toBe('lost');

    // Incident created
    expect(mockIncidentCreate).toHaveBeenCalledTimes(1);
    const incidentData = mockIncidentCreate.mock.calls[0]![0].data;
    expect(incidentData.title).toContain('FOB #1234');
    expect(incidentData.propertyId).toBe(PROP_ID);
    expect(incidentData.urgency).toBe(true);
    expect(incidentData.reportedBy).toBe('Guard Singh');
  });

  it('incident report body includes key category', async () => {
    mockKeyUpdate.mockResolvedValue({
      id: KEY_ID,
      keyName: 'Garage Clicker #5',
      propertyId: PROP_ID,
      status: 'lost',
      category: 'garage_clicker',
    });
    mockIncidentCreate.mockResolvedValue({ id: 'incident-2' });

    const req = createPatchRequest(`/api/v1/keys/${KEY_ID}`, {
      action: 'lost',
    });
    await PATCH_KEY(req, { params: Promise.resolve({ id: KEY_ID }) });

    const incidentData = mockIncidentCreate.mock.calls[0]![0].data;
    expect(incidentData.reportBody).toContain('garage_clicker');
  });

  it('success message mentions security alert', async () => {
    mockKeyUpdate.mockResolvedValue({
      id: KEY_ID,
      keyName: 'Unit Key',
      propertyId: PROP_ID,
      status: 'lost',
      category: 'unit',
    });
    mockIncidentCreate.mockResolvedValue({ id: 'incident-3' });

    const req = createPatchRequest(`/api/v1/keys/${KEY_ID}`, {
      action: 'lost',
    });
    const res = await PATCH_KEY(req, { params: Promise.resolve({ id: KEY_ID }) });

    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('lost');
    expect(body.message).toContain('Security alert');
  });
});

// ===========================================================================
// 12. Key decommission
// ===========================================================================

describe('PATCH /api/v1/keys/:id — Decommission', () => {
  it('decommissions key with reason and timestamp', async () => {
    mockKeyUpdate.mockResolvedValue({
      id: KEY_ID,
      keyName: 'Old Master Key',
      propertyId: PROP_ID,
      status: 'decommissioned',
      decommissionReason: 'Lock replaced',
      decommissionedAt: new Date(),
    });

    const req = createPatchRequest(`/api/v1/keys/${KEY_ID}`, {
      action: 'decommission',
      reason: 'Lock replaced',
    });
    const res = await PATCH_KEY(req, { params: Promise.resolve({ id: KEY_ID }) });

    expect(res.status).toBe(200);
    const updateCall = mockKeyUpdate.mock.calls[0]![0];
    expect(updateCall.data.status).toBe('decommissioned');
    expect(updateCall.data.decommissionReason).toBe('Lock replaced');
    expect(updateCall.data.decommissionedAt).toBeInstanceOf(Date);
  });

  it('decommissions without reason (optional)', async () => {
    mockKeyUpdate.mockResolvedValue({
      id: KEY_ID,
      keyName: 'Spare Key',
      propertyId: PROP_ID,
      status: 'decommissioned',
    });

    const req = createPatchRequest(`/api/v1/keys/${KEY_ID}`, {
      action: 'decommission',
    });
    const res = await PATCH_KEY(req, { params: Promise.resolve({ id: KEY_ID }) });

    expect(res.status).toBe(200);
    const updateCall = mockKeyUpdate.mock.calls[0]![0];
    expect(updateCall.data.decommissionReason).toBeNull();
  });
});

// ===========================================================================
// 13. Key transfer (checkout -> return -> checkout to different unit)
// ===========================================================================

describe('Key transfer scenario', () => {
  it('allows re-checkout after return to a different unit', async () => {
    // Step 1: Return the key
    mockCheckoutFindUnique.mockResolvedValue({
      id: CHECKOUT_ID,
      keyId: KEY_ID,
      propertyId: PROP_ID,
      returnTime: null,
    });
    mockCheckoutUpdate.mockResolvedValue({ id: CHECKOUT_ID, returnTime: new Date() });
    mockKeyUpdate.mockResolvedValue({ id: KEY_ID, status: 'available' });

    const returnReq = createPatchRequest(`/api/v1/keys/checkouts/${CHECKOUT_ID}`, {
      action: 'return',
    });
    const returnRes = await PATCH_CHECKOUT(returnReq, {
      params: Promise.resolve({ id: CHECKOUT_ID }),
    });
    expect(returnRes.status).toBe(200);

    // Step 2: Checkout to a different unit
    vi.clearAllMocks();
    mockKeyFindUnique.mockResolvedValue({
      id: KEY_ID,
      propertyId: PROP_ID,
      status: 'available',
      category: 'unit',
    });
    mockCheckoutCreate.mockResolvedValue({
      id: CHECKOUT_ID_2,
      keyId: KEY_ID,
      unitId: UNIT_ID_2,
      checkoutTime: new Date(),
    });
    mockKeyUpdate.mockResolvedValue({ id: KEY_ID, status: 'checked_out' });

    const checkoutReq = createPostRequest('/api/v1/keys/checkouts', {
      propertyId: PROP_ID,
      keyId: KEY_ID,
      checkedOutTo: 'New Tenant',
      unitId: UNIT_ID_2,
      idType: 'drivers_license',
      reason: 'Key transfer to new unit',
    });
    const checkoutRes = await POST_CHECKOUT(checkoutReq);
    expect(checkoutRes.status).toBe(201);

    const createCall = mockCheckoutCreate.mock.calls[0]![0];
    expect(createCall.data.unitId).toBe(UNIT_ID_2);
  });
});

// ===========================================================================
// 14. Checkout not found
// ===========================================================================

describe('PATCH — Checkout not found', () => {
  it('returns 404 for non-existent checkout record', async () => {
    mockCheckoutFindUnique.mockResolvedValue(null);

    const req = createPatchRequest('/api/v1/keys/checkouts/nonexistent', {
      action: 'return',
    });
    const res = await PATCH_CHECKOUT(req, { params: Promise.resolve({ id: 'nonexistent' }) });

    expect(res.status).toBe(404);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('NOT_FOUND');
  });
});

// ===========================================================================
// 15. Invalid action
// ===========================================================================

describe('PATCH — Invalid action', () => {
  it('returns 400 for unsupported action', async () => {
    const req = createPatchRequest(`/api/v1/keys/checkouts/${CHECKOUT_ID}`, {
      action: 'destroy',
    });
    const res = await PATCH_CHECKOUT(req, { params: Promise.resolve({ id: CHECKOUT_ID }) });

    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('INVALID_ACTION');
  });
});

// ===========================================================================
// 16. Tenant isolation
// ===========================================================================

describe('Tenant isolation', () => {
  it('checkout listing requires propertyId', async () => {
    const req = createGetRequest('/api/v1/keys/checkouts');
    const res = await GET_CHECKOUTS(req);

    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_PROPERTY');
  });

  it('checkout listing scopes to propertyId', async () => {
    mockCheckoutFindMany.mockResolvedValue([]);

    const req = createGetRequest('/api/v1/keys/checkouts', {
      searchParams: { propertyId: PROP_ID },
    });
    await GET_CHECKOUTS(req);

    const where = mockCheckoutFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROP_ID);
  });

  it('key listing requires propertyId', async () => {
    const req = createGetRequest('/api/v1/keys');
    const res = await GET_KEYS(req);

    expect(res.status).toBe(400);
  });

  it('key listing scopes to propertyId', async () => {
    mockKeyFindMany.mockResolvedValue([]);
    mockKeyCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/keys', {
      searchParams: { propertyId: PROP_ID },
    });
    await GET_KEYS(req);

    const where = mockKeyFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROP_ID);
  });

  it('rejects checkout when key belongs to a different property', async () => {
    mockKeyFindUnique.mockResolvedValue({
      id: KEY_ID,
      propertyId: OTHER_PROP_ID,
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

// ===========================================================================
// 17. Key inventory creation
// ===========================================================================

describe('POST /api/v1/keys — Create key in inventory', () => {
  it('creates key with required fields and sets status to available', async () => {
    mockKeyCreate.mockResolvedValue({
      id: KEY_ID,
      keyName: 'Master Key B',
      category: 'master',
      status: 'available',
      propertyId: PROP_ID,
      createdById: 'staff-carlos',
    });

    const req = createPostRequest('/api/v1/keys', {
      propertyId: PROP_ID,
      keyName: 'Master Key B',
      category: 'master',
    });
    const res = await POST_KEY(req);

    expect(res.status).toBe(201);
    const createCall = mockKeyCreate.mock.calls[0]![0];
    expect(createCall.data.status).toBe('available');
    expect(createCall.data.createdById).toBe('staff-carlos');
  });

  it('sanitizes keyName to prevent XSS', async () => {
    mockKeyCreate.mockResolvedValue({
      id: KEY_ID,
      keyName: 'Clean Name',
      category: 'unit',
      status: 'available',
    });

    const req = createPostRequest('/api/v1/keys', {
      propertyId: PROP_ID,
      keyName: '<img onerror="alert(1)">Clean Name',
      category: 'unit',
    });
    await POST_KEY(req);

    const createCall = mockKeyCreate.mock.calls[0]![0];
    expect(createCall.data.keyName).not.toContain('<img');
  });

  it('stores optional keyNumber and keyOwner', async () => {
    mockKeyCreate.mockResolvedValue({
      id: KEY_ID,
      keyName: 'Storage Key',
      keyNumber: 'SK-001',
      keyOwner: 'Building Manager',
      category: 'storage_locker',
      status: 'available',
    });

    const req = createPostRequest('/api/v1/keys', {
      propertyId: PROP_ID,
      keyName: 'Storage Key',
      keyNumber: 'SK-001',
      keyOwner: 'Building Manager',
      category: 'storage_locker',
    });
    await POST_KEY(req);

    const createCall = mockKeyCreate.mock.calls[0]![0];
    expect(createCall.data.keyNumber).toBe('SK-001');
    expect(createCall.data.keyOwner).toBe('Building Manager');
  });
});

// ===========================================================================
// 18. Key search and filtering
// ===========================================================================

describe('GET /api/v1/keys — Search and filtering', () => {
  it('filters by status', async () => {
    mockKeyFindMany.mockResolvedValue([]);
    mockKeyCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/keys', {
      searchParams: { propertyId: PROP_ID, status: 'checked_out' },
    });
    await GET_KEYS(req);

    const where = mockKeyFindMany.mock.calls[0]![0].where;
    expect(where.status).toBe('checked_out');
  });

  it('filters by category', async () => {
    mockKeyFindMany.mockResolvedValue([]);
    mockKeyCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/keys', {
      searchParams: { propertyId: PROP_ID, category: 'fob' },
    });
    await GET_KEYS(req);

    const where = mockKeyFindMany.mock.calls[0]![0].where;
    expect(where.category).toBe('fob');
  });

  it('searches by keyName, keyNumber, or keyOwner', async () => {
    mockKeyFindMany.mockResolvedValue([]);
    mockKeyCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/keys', {
      searchParams: { propertyId: PROP_ID, search: 'master' },
    });
    await GET_KEYS(req);

    const where = mockKeyFindMany.mock.calls[0]![0].where;
    expect(where.OR).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ keyName: { contains: 'master', mode: 'insensitive' } }),
        expect.objectContaining({ keyNumber: { contains: 'master', mode: 'insensitive' } }),
        expect.objectContaining({ keyOwner: { contains: 'master', mode: 'insensitive' } }),
      ]),
    );
  });

  it('returns paginated results', async () => {
    mockKeyFindMany.mockResolvedValue([]);
    mockKeyCount.mockResolvedValue(100);

    const req = createGetRequest('/api/v1/keys', {
      searchParams: { propertyId: PROP_ID, page: '2', pageSize: '25' },
    });
    const res = await GET_KEYS(req);

    const body = await parseResponse<{ meta: { page: number; total: number; totalPages: number } }>(
      res,
    );
    expect(body.meta.page).toBe(2);
    expect(body.meta.total).toBe(100);
    expect(body.meta.totalPages).toBe(4);
  });
});

// ===========================================================================
// 19. Bulk key issuance
// ===========================================================================

describe('POST — Bulk key issuance', () => {
  it('creates multiple checkout records via transaction', async () => {
    const keyIds = [KEY_ID, KEY_ID_2, KEY_ID_3];

    mockKeyFindUnique
      .mockResolvedValueOnce({
        id: KEY_ID,
        propertyId: PROP_ID,
        status: 'available',
        category: 'fob',
      })
      .mockResolvedValueOnce({
        id: KEY_ID_2,
        propertyId: PROP_ID,
        status: 'available',
        category: 'unit',
      })
      .mockResolvedValueOnce({
        id: KEY_ID_3,
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
      keyIds,
      checkedOutTo: 'New Resident Move-In',
      unitId: UNIT_ID,
      idType: 'drivers_license',
      reason: 'Move-in package: FOB + unit key + garage clicker',
    });
    const res = await POST_CHECKOUT(req);

    expect(res.status).toBe(201);
    const body = await parseResponse<{ data: unknown[]; message: string }>(res);
    expect(body.data).toHaveLength(3);
    expect(body.message).toContain('3');
  });

  it('rejects bulk issuance if any key is unavailable', async () => {
    mockKeyFindUnique
      .mockResolvedValueOnce({
        id: KEY_ID,
        propertyId: PROP_ID,
        status: 'available',
        category: 'fob',
      })
      .mockResolvedValueOnce({
        id: KEY_ID_2,
        propertyId: PROP_ID,
        status: 'lost',
        category: 'unit',
      });

    const req = createPostRequest('/api/v1/keys/checkouts', {
      propertyId: PROP_ID,
      bulk: true,
      keyIds: [KEY_ID, KEY_ID_2],
      checkedOutTo: 'Should Fail',
      unitId: UNIT_ID,
      idType: 'drivers_license',
      reason: 'Move-in',
    });
    const res = await POST_CHECKOUT(req);

    expect(res.status).toBe(409);
    const body = await parseResponse<{ error: string; message: string }>(res);
    expect(body.error).toBe('KEY_NOT_AVAILABLE');
    expect(body.message).toContain(KEY_ID_2);
  });

  it('rejects bulk issuance with empty keyIds array', async () => {
    const req = createPostRequest('/api/v1/keys/checkouts', {
      propertyId: PROP_ID,
      bulk: true,
      keyIds: [],
      checkedOutTo: 'Nobody',
      unitId: UNIT_ID,
      idType: 'drivers_license',
      reason: 'No keys',
    });
    const res = await POST_CHECKOUT(req);

    expect(res.status).toBe(400);
  });
});

// ===========================================================================
// 20. Generic key update
// ===========================================================================

describe('PATCH /api/v1/keys/:id — Generic update', () => {
  it('updates key notes', async () => {
    mockKeyUpdate.mockResolvedValue({
      id: KEY_ID,
      notes: 'Spare copy for maintenance team',
    });

    const req = createPatchRequest(`/api/v1/keys/${KEY_ID}`, {
      notes: 'Spare copy for maintenance team',
    });
    const res = await PATCH_KEY(req, { params: Promise.resolve({ id: KEY_ID }) });

    expect(res.status).toBe(200);
    const updateCall = mockKeyUpdate.mock.calls[0]![0];
    expect(updateCall.data.notes).toContain('Spare copy');
  });

  it('updates key owner', async () => {
    mockKeyUpdate.mockResolvedValue({
      id: KEY_ID,
      keyOwner: 'New Owner',
    });

    const req = createPatchRequest(`/api/v1/keys/${KEY_ID}`, {
      keyOwner: 'New Owner',
    });
    const res = await PATCH_KEY(req, { params: Promise.resolve({ id: KEY_ID }) });

    expect(res.status).toBe(200);
  });

  it('sanitizes notes to prevent XSS', async () => {
    mockKeyUpdate.mockResolvedValue({ id: KEY_ID });

    const req = createPatchRequest(`/api/v1/keys/${KEY_ID}`, {
      notes: '<script>document.cookie</script>Important note',
    });
    await PATCH_KEY(req, { params: Promise.resolve({ id: KEY_ID }) });

    const updateCall = mockKeyUpdate.mock.calls[0]![0];
    expect(updateCall.data.notes).not.toContain('<script>');
  });
});

// ===========================================================================
// 21. Error handling
// ===========================================================================

describe('Error handling', () => {
  it('returns 500 on database error during checkout', async () => {
    mockKeyFindUnique.mockRejectedValue(new Error('Connection pool exhausted'));

    const req = createPostRequest('/api/v1/keys/checkouts', {
      propertyId: PROP_ID,
      keyId: KEY_ID,
      checkedOutTo: 'Error Test',
      unitId: UNIT_ID,
      idType: 'drivers_license',
      reason: 'Should error',
    });
    const res = await POST_CHECKOUT(req);

    expect(res.status).toBe(500);
    const body = await parseResponse<{ error: string; message: string }>(res);
    expect(body.error).toBe('INTERNAL_ERROR');
    expect(body.message).not.toContain('Connection pool');
  });

  it('returns 500 on database error during return', async () => {
    mockCheckoutFindUnique.mockRejectedValue(new Error('Deadlock'));

    const req = createPatchRequest(`/api/v1/keys/checkouts/${CHECKOUT_ID}`, {
      action: 'return',
    });
    const res = await PATCH_CHECKOUT(req, { params: Promise.resolve({ id: CHECKOUT_ID }) });

    expect(res.status).toBe(500);
  });

  it('returns 500 on database error during key listing', async () => {
    mockKeyFindMany.mockRejectedValue(new Error('Timeout'));

    const req = createGetRequest('/api/v1/keys', {
      searchParams: { propertyId: PROP_ID },
    });
    const res = await GET_KEYS(req);

    expect(res.status).toBe(500);
  });

  it('returns 500 on database error during key detail', async () => {
    mockKeyFindUnique.mockRejectedValue(new Error('Connection refused'));

    const req = createGetRequest(`/api/v1/keys/${KEY_ID}`);
    const res = await GET_KEY_DETAIL(req, { params: Promise.resolve({ id: KEY_ID }) });

    expect(res.status).toBe(500);
  });
});

// ===========================================================================
// 22. Checkout listing with filters
// ===========================================================================

describe('GET /api/v1/keys/checkouts — Listing with filters', () => {
  it('filters active checkouts (returnTime = null)', async () => {
    mockCheckoutFindMany.mockResolvedValue([]);

    const req = createGetRequest('/api/v1/keys/checkouts', {
      searchParams: { propertyId: PROP_ID, active: 'true' },
    });
    await GET_CHECKOUTS(req);

    const where = mockCheckoutFindMany.mock.calls[0]![0].where;
    expect(where.returnTime).toBeNull();
  });

  it('filters checkouts by keyId', async () => {
    mockCheckoutFindMany.mockResolvedValue([]);

    const req = createGetRequest('/api/v1/keys/checkouts', {
      searchParams: { propertyId: PROP_ID, keyId: KEY_ID },
    });
    await GET_CHECKOUTS(req);

    const where = mockCheckoutFindMany.mock.calls[0]![0].where;
    expect(where.keyId).toBe(KEY_ID);
  });

  it('filters checkouts by unitId', async () => {
    mockCheckoutFindMany.mockResolvedValue([]);

    const req = createGetRequest('/api/v1/keys/checkouts', {
      searchParams: { propertyId: PROP_ID, unitId: UNIT_ID },
    });
    await GET_CHECKOUTS(req);

    const where = mockCheckoutFindMany.mock.calls[0]![0].where;
    expect(where.unitId).toBe(UNIT_ID);
  });

  it('orders by checkoutTime descending', async () => {
    mockCheckoutFindMany.mockResolvedValue([]);

    const req = createGetRequest('/api/v1/keys/checkouts', {
      searchParams: { propertyId: PROP_ID },
    });
    await GET_CHECKOUTS(req);

    const orderBy = mockCheckoutFindMany.mock.calls[0]![0].orderBy;
    expect(orderBy).toEqual({ checkoutTime: 'desc' });
  });

  it('includes key details in checkout listing', async () => {
    mockCheckoutFindMany.mockResolvedValue([
      {
        id: CHECKOUT_ID,
        keyId: KEY_ID,
        key: { id: KEY_ID, keyName: 'FOB #1', category: 'fob', status: 'checked_out' },
        checkedOutTo: 'Alice',
        checkoutTime: new Date(),
        returnTime: null,
      },
    ]);

    const req = createGetRequest('/api/v1/keys/checkouts', {
      searchParams: { propertyId: PROP_ID },
    });
    const res = await GET_CHECKOUTS(req);

    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: Array<{ key: { keyName: string } }> }>(res);
    expect(body.data[0]!.key.keyName).toBe('FOB #1');
  });
});
