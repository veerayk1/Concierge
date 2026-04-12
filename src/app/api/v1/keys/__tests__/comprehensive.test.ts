/**
 * Security/FOB Key Management — Comprehensive Tests (PRD 13)
 *
 * TDD coverage for key inventory CRUD by category, checkout/return lifecycle,
 * lost key handling with security alerts, decommission flow, per-unit key
 * summary (6 FOB slots), key audit trail, and buzzer code management.
 *
 * Tests 1-15:
 *  1. Key inventory — create key with category and keyName
 *  2. Key inventory — filter keys by category (FOB, buzzer, garage)
 *  3. Key inventory — filter keys by status (available, checked_out, lost)
 *  4. Checkout — issue key to resident (creates KeyCheckout)
 *  5. Return — return key and set status back to available
 *  6. Return — reject return on already-returned key (409)
 *  7. Lost key — mark as lost and create security incident
 *  8. Lost key — incident title includes key name
 *  9. Decommission — set status to decommissioned with reason
 * 10. Decommission — reject checkout of decommissioned key
 * 11. Per-unit key summary — list active checkouts for a unit
 * 12. Per-unit key summary — enforce max 6 FOBs per unit
 * 13. Key audit trail — checkout stores checkedOutById and timestamp
 * 14. Key audit trail — return stores returnedToId and timestamp
 * 15. Tenant isolation — require propertyId on all queries
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
      userId: 'staff-concierge',
      propertyId: '00000000-0000-4000-b000-000000000001',
      role: 'front_desk',
      permissions: ['*'],
      mfaVerified: false,
    },
    error: null,
  }),
}));

import { GET, POST } from '../route';
import { PATCH } from '../[id]/route';
import { GET as GET_CHECKOUTS, POST as POST_CHECKOUT } from '../checkouts/route';
import { PATCH as PATCH_CHECKOUT } from '../checkouts/[id]/route';

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
  mockIncidentCreate.mockResolvedValue({});
  mockTransaction.mockImplementation(async (fn: (tx: unknown) => Promise<unknown>) => {
    if (Array.isArray(fn)) return Promise.all(fn);
    const { prisma } = await import('@/server/db');
    return fn(prisma);
  });
});

// ===========================================================================
// 1. Key inventory — create with category and keyName
// ===========================================================================

describe('1. Key inventory — create key', () => {
  it('creates a key with status=available', async () => {
    mockKeyCreate.mockResolvedValue({
      id: 'k1',
      keyName: 'Unit 101 FOB',
      category: 'fob',
      status: 'available',
      createdById: 'staff-concierge',
    });

    const req = createPostRequest('/api/v1/keys', {
      propertyId: PROP_ID,
      keyName: 'Unit 101 FOB',
      category: 'fob',
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
    const data = mockKeyCreate.mock.calls[0]![0].data;
    expect(data.status).toBe('available');
    expect(data.createdById).toBe('staff-concierge');
  });

  it('rejects creation without keyName', async () => {
    const req = createPostRequest('/api/v1/keys', {
      propertyId: PROP_ID,
      category: 'fob',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

// ===========================================================================
// 2. Key inventory — filter by category
// ===========================================================================

describe('2. Key inventory — filter by category', () => {
  it('accepts fob category', async () => {
    mockKeyCreate.mockResolvedValue({
      id: 'k1',
      status: 'available',
      category: 'fob',
      createdById: 'staff-concierge',
    });
    const req = createPostRequest('/api/v1/keys', {
      propertyId: PROP_ID,
      keyName: 'FOB A',
      category: 'fob',
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('accepts buzzer_code category', async () => {
    mockKeyCreate.mockResolvedValue({
      id: 'k2',
      status: 'available',
      category: 'buzzer_code',
      createdById: 'staff-concierge',
    });
    const req = createPostRequest('/api/v1/keys', {
      propertyId: PROP_ID,
      keyName: 'Buzzer A',
      category: 'buzzer_code',
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('accepts garage_clicker category', async () => {
    mockKeyCreate.mockResolvedValue({
      id: 'k3',
      status: 'available',
      category: 'garage_clicker',
      createdById: 'staff-concierge',
    });
    const req = createPostRequest('/api/v1/keys', {
      propertyId: PROP_ID,
      keyName: 'Garage A',
      category: 'garage_clicker',
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('rejects unknown category', async () => {
    const req = createPostRequest('/api/v1/keys', {
      propertyId: PROP_ID,
      keyName: 'Bad',
      category: 'imaginary',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

// ===========================================================================
// 3. Key inventory — filter by status
// ===========================================================================

describe('3. Key inventory — filter by status', () => {
  it('filters by status=checked_out', async () => {
    const req = createGetRequest('/api/v1/keys', {
      searchParams: { propertyId: PROP_ID, status: 'checked_out' },
    });
    await GET(req);
    expect(mockKeyFindMany.mock.calls[0]![0].where.status).toBe('checked_out');
  });

  it('includes checkouts relation in response', async () => {
    const req = createGetRequest('/api/v1/keys', {
      searchParams: { propertyId: PROP_ID },
    });
    await GET(req);
    expect(mockKeyFindMany.mock.calls[0]![0].include.checkouts).toBeDefined();
  });
});

// ===========================================================================
// 4. Checkout — issue key to resident
// ===========================================================================

describe('4. Checkout — issue key to resident', () => {
  it('creates checkout record with checkoutTime', async () => {
    mockKeyFindUnique.mockResolvedValue({
      id: KEY_ID,
      propertyId: PROP_ID,
      status: 'available',
      category: 'unit',
    });
    mockCheckoutCreate.mockResolvedValue({
      id: CHECKOUT_ID,
      keyId: KEY_ID,
      checkedOutTo: 'John Doe',
      checkoutTime: new Date(),
      checkedOutById: 'staff-concierge',
    });
    mockKeyUpdate.mockResolvedValue({ id: KEY_ID, status: 'checked_out' });

    const req = createPostRequest('/api/v1/keys/checkouts', {
      propertyId: PROP_ID,
      keyId: KEY_ID,
      checkedOutTo: 'John Doe',
      unitId: UNIT_ID,
      idType: 'drivers_license',
      reason: 'Move-in',
    });
    const res = await POST_CHECKOUT(req);

    expect(res.status).toBe(201);
    const body = await parseResponse<{ data: { checkoutTime: string } }>(res);
    expect(body.data.checkoutTime).toBeDefined();
  });

  it('sets key status to checked_out', async () => {
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
      checkedOutTo: 'Jane',
      unitId: UNIT_ID,
      idType: 'drivers_license',
      reason: 'Pickup',
    });
    await POST_CHECKOUT(req);

    expect(mockKeyUpdate.mock.calls[0]![0].data.status).toBe('checked_out');
  });
});

// ===========================================================================
// 5. Return — return key and set status back to available
// ===========================================================================

describe('5. Return — key returned to available', () => {
  it('sets returnTime on checkout and key status to available', async () => {
    mockCheckoutFindUnique.mockResolvedValue({
      id: CHECKOUT_ID,
      keyId: KEY_ID,
      propertyId: PROP_ID,
      returnTime: null,
    });
    mockCheckoutUpdate.mockResolvedValue({
      id: CHECKOUT_ID,
      returnTime: new Date(),
      returnedToId: 'staff-concierge',
    });
    mockKeyUpdate.mockResolvedValue({ id: KEY_ID, status: 'available' });

    const req = createPatchRequest(`/api/v1/keys/checkouts/${CHECKOUT_ID}`, { action: 'return' });
    const res = await PATCH_CHECKOUT(req, { params: Promise.resolve({ id: CHECKOUT_ID }) });

    expect(res.status).toBe(200);
    expect(mockKeyUpdate.mock.calls[0]![0].data.status).toBe('available');
  });
});

// ===========================================================================
// 6. Return — reject already-returned key
// ===========================================================================

describe('6. Return — reject already returned', () => {
  it('returns 409 ALREADY_RETURNED', async () => {
    mockCheckoutFindUnique.mockResolvedValue({
      id: CHECKOUT_ID,
      keyId: KEY_ID,
      propertyId: PROP_ID,
      returnTime: new Date('2025-01-01'),
    });

    const req = createPatchRequest(`/api/v1/keys/checkouts/${CHECKOUT_ID}`, { action: 'return' });
    const res = await PATCH_CHECKOUT(req, { params: Promise.resolve({ id: CHECKOUT_ID }) });

    expect(res.status).toBe(409);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('ALREADY_RETURNED');
    expect(mockCheckoutUpdate).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// 7. Lost key — mark as lost and create security incident
// ===========================================================================

describe('7. Lost key — mark lost with incident', () => {
  it('marks key as lost and creates incident report', async () => {
    mockKeyUpdate.mockResolvedValue({
      id: KEY_ID,
      keyName: 'Master Key A',
      propertyId: PROP_ID,
      status: 'lost',
      category: 'master',
    });
    mockIncidentCreate.mockResolvedValue({ id: 'incident-1' });

    const req = createPatchRequest(`/api/v1/keys/${KEY_ID}`, { action: 'lost' });
    const res = await PATCH(req, { params: Promise.resolve({ id: KEY_ID }) });

    expect(res.status).toBe(200);
    expect(mockKeyUpdate.mock.calls[0]![0].data.status).toBe('lost');
    expect(mockIncidentCreate).toHaveBeenCalled();
  });
});

// ===========================================================================
// 8. Lost key — incident title includes key name
// ===========================================================================

describe('8. Lost key — incident includes key name', () => {
  it('incident report title contains the key name', async () => {
    mockKeyUpdate.mockResolvedValue({
      id: KEY_ID,
      keyName: 'FOB #5678',
      propertyId: PROP_ID,
      status: 'lost',
      category: 'fob',
    });
    mockIncidentCreate.mockResolvedValue({ id: 'incident-2' });

    const req = createPatchRequest(`/api/v1/keys/${KEY_ID}`, { action: 'lost' });
    await PATCH(req, { params: Promise.resolve({ id: KEY_ID }) });

    const incidentData = mockIncidentCreate.mock.calls[0]![0].data;
    expect(incidentData.title).toContain('FOB #5678');
    expect(incidentData.propertyId).toBe(PROP_ID);
  });
});

// ===========================================================================
// 9. Decommission — set status with reason
// ===========================================================================

describe('9. Decommission — with reason and timestamp', () => {
  it('decommissions key with reason and decommissionedAt', async () => {
    mockKeyUpdate.mockResolvedValue({
      id: KEY_ID,
      keyName: 'Old Master',
      status: 'decommissioned',
      decommissionReason: 'Lock changed',
      decommissionedAt: new Date(),
    });

    const req = createPatchRequest(`/api/v1/keys/${KEY_ID}`, {
      action: 'decommission',
      reason: 'Lock changed',
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: KEY_ID }) });

    expect(res.status).toBe(200);
    const updateCall = mockKeyUpdate.mock.calls[0]![0];
    expect(updateCall.data.status).toBe('decommissioned');
    expect(updateCall.data.decommissionReason).toBe('Lock changed');
    expect(updateCall.data.decommissionedAt).toBeInstanceOf(Date);
  });
});

// ===========================================================================
// 10. Decommission — reject checkout of decommissioned key
// ===========================================================================

describe('10. Decommission — reject checkout', () => {
  it('rejects checkout of decommissioned key (409 KEY_NOT_AVAILABLE)', async () => {
    mockKeyFindUnique.mockResolvedValue({
      id: KEY_ID,
      propertyId: PROP_ID,
      status: 'decommissioned',
      category: 'unit',
    });

    const req = createPostRequest('/api/v1/keys/checkouts', {
      propertyId: PROP_ID,
      keyId: KEY_ID,
      checkedOutTo: 'Jane',
      unitId: UNIT_ID,
      idType: 'drivers_license',
      reason: 'Pickup',
    });
    const res = await POST_CHECKOUT(req);

    expect(res.status).toBe(409);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('KEY_NOT_AVAILABLE');
    expect(mockCheckoutCreate).not.toHaveBeenCalled();
  });

  it('rejects checkout of already checked-out key', async () => {
    mockKeyFindUnique.mockResolvedValue({
      id: KEY_ID,
      propertyId: PROP_ID,
      status: 'checked_out',
      category: 'unit',
    });

    const req = createPostRequest('/api/v1/keys/checkouts', {
      propertyId: PROP_ID,
      keyId: KEY_ID,
      checkedOutTo: 'Jane',
      unitId: UNIT_ID,
      idType: 'drivers_license',
      reason: 'Pickup',
    });
    const res = await POST_CHECKOUT(req);

    expect(res.status).toBe(409);
  });
});

// ===========================================================================
// 11. Per-unit key summary — list active checkouts
// ===========================================================================

describe('11. Per-unit key summary — active checkouts', () => {
  it('lists unreturned checkouts for a unit', async () => {
    mockCheckoutFindMany.mockResolvedValue([
      { id: 'c1', keyId: 'k1', unitId: UNIT_ID, returnTime: null },
      { id: 'c2', keyId: 'k2', unitId: UNIT_ID, returnTime: null },
    ]);

    const req = createGetRequest('/api/v1/keys/checkouts', {
      searchParams: { propertyId: PROP_ID, unitId: UNIT_ID, active: 'true' },
    });
    const res = await GET_CHECKOUTS(req);

    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: unknown[] }>(res);
    expect(body.data).toHaveLength(2);

    const where = mockCheckoutFindMany.mock.calls[0]![0].where;
    expect(where.unitId).toBe(UNIT_ID);
    expect(where.returnTime).toBeNull();
  });
});

// ===========================================================================
// 12. Per-unit key summary — enforce max 6 FOBs
// ===========================================================================

describe('12. Per-unit key summary — max 6 FOBs', () => {
  it('rejects issuance when unit already has 6 FOBs', async () => {
    mockKeyFindUnique.mockResolvedValue({
      id: KEY_ID,
      propertyId: PROP_ID,
      status: 'available',
      category: 'fob',
    });
    mockCheckoutFindMany.mockResolvedValue([]);
    mockKeyCount.mockResolvedValue(6);

    const req = createPostRequest('/api/v1/keys/checkouts', {
      propertyId: PROP_ID,
      keyId: KEY_ID,
      checkedOutTo: 'Maxed Out',
      unitId: UNIT_ID,
      idType: 'drivers_license',
      reason: 'Extra FOB',
      enforceMax: true,
    });
    const res = await POST_CHECKOUT(req);

    expect(res.status).toBe(409);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MAX_KEYS_EXCEEDED');
  });

  it('allows issuance when under the limit (3 of 6)', async () => {
    mockKeyFindUnique.mockResolvedValue({
      id: KEY_ID,
      propertyId: PROP_ID,
      status: 'available',
      category: 'fob',
    });
    mockKeyCount.mockResolvedValue(3);
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
});

// ===========================================================================
// 13. Key audit trail — checkout stores checkedOutById
// ===========================================================================

describe('13. Key audit trail — checkout record', () => {
  it('stores checkedOutById, checkedOutTo, and checkoutTime', async () => {
    mockKeyFindUnique.mockResolvedValue({
      id: KEY_ID,
      propertyId: PROP_ID,
      status: 'available',
      category: 'unit',
    });
    mockCheckoutCreate.mockResolvedValue({
      id: CHECKOUT_ID,
      checkedOutTo: 'Audit Target',
      checkedOutById: 'staff-concierge',
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
    await POST_CHECKOUT(req);

    const createCall = mockCheckoutCreate.mock.calls[0]![0];
    expect(createCall.data.checkedOutTo).toBe('Audit Target');
    expect(createCall.data.checkedOutById).toBe('staff-concierge');
    expect(createCall.data.checkoutTime).toBeInstanceOf(Date);
  });
});

// ===========================================================================
// 14. Key audit trail — return stores returnedToId
// ===========================================================================

describe('14. Key audit trail — return record', () => {
  it('stores returnedToId and returnTime on return', async () => {
    mockCheckoutFindUnique.mockResolvedValue({
      id: CHECKOUT_ID,
      keyId: KEY_ID,
      propertyId: PROP_ID,
      returnTime: null,
    });
    mockCheckoutUpdate.mockResolvedValue({
      id: CHECKOUT_ID,
      returnTime: new Date(),
      returnedToId: 'staff-concierge',
    });
    mockKeyUpdate.mockResolvedValue({ id: KEY_ID, status: 'available' });

    const req = createPatchRequest(`/api/v1/keys/checkouts/${CHECKOUT_ID}`, { action: 'return' });
    await PATCH_CHECKOUT(req, { params: Promise.resolve({ id: CHECKOUT_ID }) });

    const updateCall = mockCheckoutUpdate.mock.calls[0]![0];
    expect(updateCall.data.returnedToId).toBe('staff-concierge');
    expect(updateCall.data.returnTime).toBeInstanceOf(Date);
  });
});

// ===========================================================================
// 15. Tenant isolation — require propertyId
// ===========================================================================

describe('15. Tenant isolation', () => {
  it('rejects key listing without propertyId', async () => {
    const req = createGetRequest('/api/v1/keys');
    const res = await GET(req);
    expect(res.status).toBe(400);
    expect(mockKeyFindMany).not.toHaveBeenCalled();
  });

  it('rejects checkout listing without propertyId', async () => {
    const req = createGetRequest('/api/v1/keys/checkouts');
    const res = await GET_CHECKOUTS(req);
    expect(res.status).toBe(400);
    expect(mockCheckoutFindMany).not.toHaveBeenCalled();
  });

  it('scopes key query to propertyId', async () => {
    const req = createGetRequest('/api/v1/keys', {
      searchParams: { propertyId: PROP_ID },
    });
    await GET(req);
    expect(mockKeyFindMany.mock.calls[0]![0].where.propertyId).toBe(PROP_ID);
  });

  it('validates key belongs to property on checkout', async () => {
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
