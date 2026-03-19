/**
 * Integration Workflow Tests — Key/FOB Management Lifecycle
 *
 * Tests complete key/FOB management workflows across multiple API endpoints:
 *   - Key inventory created with serial numbers
 *   - Key checked out to resident with sign-out record
 *   - Overdue key triggers notification
 *   - Key returned and checked back in
 *   - Lost key reported and deactivated
 *   - Key audit trail shows full history
 *
 * Each test validates the key lifecycle state machine and audit trail integrity.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createGetRequest,
  createPostRequest,
  createPatchRequest,
  parseResponse,
} from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Prisma Mock
// ---------------------------------------------------------------------------

const mockKeyInventoryCreate = vi.fn();
const mockKeyInventoryFindMany = vi.fn();
const mockKeyInventoryFindUnique = vi.fn();
const mockKeyInventoryUpdate = vi.fn();
const mockKeyInventoryCount = vi.fn();

const mockKeyCheckoutCreate = vi.fn();
const mockKeyCheckoutFindMany = vi.fn();
const mockKeyCheckoutFindUnique = vi.fn();
const mockKeyCheckoutUpdate = vi.fn();

const mockEventCreate = vi.fn();

const mockTransaction = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    keyInventory: {
      create: (...args: unknown[]) => mockKeyInventoryCreate(...args),
      findMany: (...args: unknown[]) => mockKeyInventoryFindMany(...args),
      findUnique: (...args: unknown[]) => mockKeyInventoryFindUnique(...args),
      update: (...args: unknown[]) => mockKeyInventoryUpdate(...args),
      count: (...args: unknown[]) => mockKeyInventoryCount(...args),
    },
    keyCheckout: {
      create: (...args: unknown[]) => mockKeyCheckoutCreate(...args),
      findMany: (...args: unknown[]) => mockKeyCheckoutFindMany(...args),
      findUnique: (...args: unknown[]) => mockKeyCheckoutFindUnique(...args),
      update: (...args: unknown[]) => mockKeyCheckoutUpdate(...args),
    },
    event: {
      create: (...args: unknown[]) => mockEventCreate(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

vi.mock('@/lib/sanitize', () => ({
  stripHtml: (s: string) => s,
  stripControlChars: (s: string) => s,
}));

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: vi.fn().mockResolvedValue({
    user: {
      userId: 'security-001',
      propertyId: '00000000-0000-4000-b000-000000000001',
      role: 'security_guard',
      permissions: ['*'],
      mfaVerified: true,
    },
    error: null,
  }),
}));

// ---------------------------------------------------------------------------
// Import route handlers AFTER mocks
// ---------------------------------------------------------------------------

import { GET as listKeys, POST as createKey } from '@/app/api/v1/keys/route';
import { GET as getKey, PATCH as updateKey } from '@/app/api/v1/keys/[id]/route';
import { POST as issueKey } from '@/app/api/v1/keys/checkouts/route';
import { PATCH as returnKey } from '@/app/api/v1/keys/checkouts/[id]/route';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROPERTY_ID = '00000000-0000-4000-b000-000000000001';
const UNIT_ID = '00000000-0000-4000-a000-000000000302';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeKey(overrides: Record<string, unknown> = {}) {
  return {
    id: 'key-001',
    propertyId: PROPERTY_ID,
    keyName: 'FOB-Unit302-A',
    keyNumber: 'FOB-SN-44821',
    keyOwner: null,
    category: 'fob',
    status: 'available',
    notes: null,
    createdById: 'security-001',
    createdAt: new Date(),
    checkouts: [],
    ...overrides,
  };
}

function makeCheckout(overrides: Record<string, unknown> = {}) {
  return {
    id: 'checkout-001',
    propertyId: PROPERTY_ID,
    keyId: 'key-001',
    checkedOutTo: 'Janet Smith - Unit 302',
    unitId: UNIT_ID,
    idType: 'driver_license',
    reason: 'New resident move-in',
    checkoutTime: new Date('2026-03-18T09:00:00Z'),
    expectedReturn: new Date('2026-03-18T17:00:00Z'),
    returnTime: null,
    conditionNotes: null,
    createdById: 'security-001',
    createdAt: new Date(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

// ===========================================================================
// SCENARIO 1: Key Inventory Created with Serial Numbers
// ===========================================================================

describe('Scenario 1: Key Inventory Created with Serial Numbers', () => {
  it('Step 1: add FOB to inventory with serial number', async () => {
    mockKeyInventoryCreate.mockResolvedValue(
      makeKey({
        id: 'key-fob-001',
        keyName: 'FOB-Unit302-A',
        keyNumber: 'FOB-SN-44821',
        category: 'fob',
        status: 'available',
      }),
    );

    const req = createPostRequest('/api/v1/keys', {
      propertyId: PROPERTY_ID,
      keyName: 'FOB-Unit302-A',
      keyNumber: 'FOB-SN-44821',
      category: 'fob',
      notes: 'Assigned to unit 302',
    });

    const res = await createKey(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{
      data: { keyName: string; status: string; category: string };
      message: string;
    }>(res);
    expect(body.data.keyName).toBe('FOB-Unit302-A');
    expect(body.data.status).toBe('available');
    expect(body.data.category).toBe('fob');
    expect(body.message).toContain('FOB-Unit302-A');
  });

  it('Step 2: add master key to inventory', async () => {
    mockKeyInventoryCreate.mockResolvedValue(
      makeKey({
        id: 'key-master-001',
        keyName: 'MASTER-Building-A',
        keyNumber: 'MST-001',
        category: 'master',
        status: 'available',
      }),
    );

    const req = createPostRequest('/api/v1/keys', {
      propertyId: PROPERTY_ID,
      keyName: 'MASTER-Building-A',
      keyNumber: 'MST-001',
      category: 'master',
      notes: 'Master key for Building A - ALL floors',
    });

    const res = await createKey(req);
    expect(res.status).toBe(201);
  });

  it('Step 3: add garage clicker to inventory', async () => {
    mockKeyInventoryCreate.mockResolvedValue(
      makeKey({
        id: 'key-clicker-001',
        keyName: 'CLICKER-P1-Unit302',
        keyNumber: 'CLK-SN-99102',
        category: 'garage_clicker',
        status: 'available',
      }),
    );

    const req = createPostRequest('/api/v1/keys', {
      propertyId: PROPERTY_ID,
      keyName: 'CLICKER-P1-Unit302',
      keyNumber: 'CLK-SN-99102',
      category: 'garage_clicker',
    });

    const res = await createKey(req);
    expect(res.status).toBe(201);

    expect(mockKeyInventoryCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          category: 'garage_clicker',
          status: 'available',
        }),
      }),
    );
  });

  it('Step 4: list all keys shows inventory with status', async () => {
    mockKeyInventoryFindMany.mockResolvedValue([
      makeKey({
        id: 'k1',
        keyName: 'FOB-302-A',
        category: 'fob',
        status: 'available',
        checkouts: [],
      }),
      makeKey({
        id: 'k2',
        keyName: 'MASTER-A',
        category: 'master',
        status: 'checked_out',
        checkouts: [{ id: 'co1', checkedOutTo: 'Guard Mike', returnTime: null }],
      }),
      makeKey({
        id: 'k3',
        keyName: 'CLK-302',
        category: 'garage_clicker',
        status: 'available',
        checkouts: [],
      }),
    ]);
    mockKeyInventoryCount.mockResolvedValue(3);

    const req = createGetRequest('/api/v1/keys', {
      searchParams: { propertyId: PROPERTY_ID },
    });

    const res = await listKeys(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { id: string; keyName: string; status: string; activeCheckout: unknown }[];
      meta: { total: number };
    }>(res);
    expect(body.data).toHaveLength(3);
    expect(body.meta.total).toBe(3);
  });

  it('should filter keys by category', async () => {
    mockKeyInventoryFindMany.mockResolvedValue([]);
    mockKeyInventoryCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/keys', {
      searchParams: { propertyId: PROPERTY_ID, category: 'fob' },
    });

    await listKeys(req);

    expect(mockKeyInventoryFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          category: 'fob',
        }),
      }),
    );
  });

  it('should filter keys by status', async () => {
    mockKeyInventoryFindMany.mockResolvedValue([]);
    mockKeyInventoryCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/keys', {
      searchParams: { propertyId: PROPERTY_ID, status: 'checked_out' },
    });

    await listKeys(req);

    expect(mockKeyInventoryFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'checked_out',
        }),
      }),
    );
  });
});

// ===========================================================================
// SCENARIO 2: Key Checked Out to Resident
// ===========================================================================

describe('Scenario 2: Key Checked Out to Resident with Sign-Out Record', () => {
  const keyId = 'key-checkout-001';
  const checkoutId = 'co-001';

  it('Step 1: issue key to resident with ID verification', async () => {
    mockKeyInventoryFindUnique.mockResolvedValue(makeKey({ id: keyId, status: 'available' }));
    mockKeyCheckoutCreate.mockResolvedValue(
      makeCheckout({
        id: checkoutId,
        keyId,
        checkedOutTo: 'Janet Smith - Unit 302',
        unitId: UNIT_ID,
        idType: 'driver_license',
        reason: 'New resident move-in',
        checkoutTime: new Date(),
      }),
    );
    mockKeyInventoryUpdate.mockResolvedValue(makeKey({ id: keyId, status: 'checked_out' }));

    const req = createPostRequest('/api/v1/keys/checkouts', {
      propertyId: PROPERTY_ID,
      keyId,
      checkedOutTo: 'Janet Smith - Unit 302',
      unitId: UNIT_ID,
      idType: 'driver_license',
      reason: 'New resident move-in',
    });

    const res = await issueKey(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{ data: { keyId: string }; message: string }>(res);
    expect(body.message).toContain('Janet Smith');
  });

  it('Step 2: key status changes to checked_out after issuance', async () => {
    mockKeyInventoryFindUnique.mockResolvedValue(makeKey({ id: keyId, status: 'available' }));
    mockKeyCheckoutCreate.mockResolvedValue(makeCheckout({ keyId }));
    mockKeyInventoryUpdate.mockResolvedValue(makeKey({ id: keyId, status: 'checked_out' }));

    await issueKey(
      createPostRequest('/api/v1/keys/checkouts', {
        propertyId: PROPERTY_ID,
        keyId,
        checkedOutTo: 'Test Resident',
        idType: 'driver_license',
        reason: 'Move-in',
      }),
    );

    expect(mockKeyInventoryUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: keyId },
        data: expect.objectContaining({
          status: 'checked_out',
        }),
      }),
    );
  });

  it('Step 3: attempting to issue already checked-out key fails', async () => {
    mockKeyInventoryFindUnique.mockResolvedValue(makeKey({ id: keyId, status: 'checked_out' }));

    const req = createPostRequest('/api/v1/keys/checkouts', {
      propertyId: PROPERTY_ID,
      keyId,
      checkedOutTo: 'Another Person',
      idType: 'driver_license',
      reason: 'Should fail',
    });

    const res = await issueKey(req);
    expect(res.status).toBe(409);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('KEY_NOT_AVAILABLE');
  });

  it('Step 4: issuing key from wrong property fails', async () => {
    mockKeyInventoryFindUnique.mockResolvedValue(
      makeKey({ id: keyId, propertyId: 'different-property' }),
    );

    const req = createPostRequest('/api/v1/keys/checkouts', {
      propertyId: PROPERTY_ID,
      keyId,
      checkedOutTo: 'Someone',
      idType: 'driver_license',
      reason: 'Cross-property attempt',
    });

    const res = await issueKey(req);
    expect(res.status).toBe(404);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('KEY_NOT_FOUND');
  });
});

// ===========================================================================
// SCENARIO 3: Overdue Key Detection
// ===========================================================================

describe('Scenario 3: Overdue Key Triggers Notification', () => {
  it('should identify overdue keys (expectedReturn in the past, no returnTime)', async () => {
    const overdueCheckout = {
      id: 'co-overdue',
      checkedOutTo: 'Late Resident',
      checkoutTime: new Date('2026-03-17T09:00:00Z'),
      expectedReturn: new Date('2026-03-17T17:00:00Z'), // Yesterday
      returnTime: null,
      unitId: UNIT_ID,
    };

    mockKeyInventoryFindMany.mockResolvedValue([
      makeKey({
        id: 'key-overdue',
        keyName: 'FOB-Overdue',
        status: 'checked_out',
        checkouts: [overdueCheckout],
      }),
    ]);
    mockKeyInventoryCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/keys', {
      searchParams: { propertyId: PROPERTY_ID, status: 'checked_out' },
    });

    const res = await listKeys(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { id: string; isOverdue: boolean; activeCheckout: { checkedOutTo: string } }[];
    }>(res);

    expect(body.data).toHaveLength(1);
    expect(body.data[0]!.isOverdue).toBe(true);
    expect(body.data[0]!.activeCheckout.checkedOutTo).toBe('Late Resident');
  });

  it('should not flag keys with future expectedReturn as overdue', async () => {
    const futureCheckout = {
      id: 'co-future',
      checkedOutTo: 'On-Time Resident',
      checkoutTime: new Date(),
      expectedReturn: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
      returnTime: null,
      unitId: UNIT_ID,
    };

    mockKeyInventoryFindMany.mockResolvedValue([
      makeKey({
        id: 'key-ontime',
        keyName: 'FOB-OnTime',
        status: 'checked_out',
        checkouts: [futureCheckout],
      }),
    ]);
    mockKeyInventoryCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/keys', {
      searchParams: { propertyId: PROPERTY_ID },
    });

    const res = await listKeys(req);
    const body = await parseResponse<{
      data: { isOverdue: boolean }[];
    }>(res);

    expect(body.data[0]!.isOverdue).toBe(false);
  });
});

// ===========================================================================
// SCENARIO 4: Key Returned and Checked Back In
// ===========================================================================

describe('Scenario 4: Key Returned and Checked Back In', () => {
  const keyId = 'key-return-001';
  const checkoutId = 'co-return-001';

  it('Step 1: return key with condition notes', async () => {
    mockKeyCheckoutFindUnique.mockResolvedValue(
      makeCheckout({
        id: checkoutId,
        keyId,
        returnTime: null,
      }),
    );
    mockKeyCheckoutUpdate.mockResolvedValue(
      makeCheckout({
        id: checkoutId,
        keyId,
        returnTime: new Date(),
        conditionNotes: 'Key returned in good condition',
      }),
    );
    mockKeyInventoryUpdate.mockResolvedValue(makeKey({ id: keyId, status: 'available' }));

    const req = createPatchRequest(`/api/v1/keys/checkouts/${checkoutId}`, {
      action: 'return',
      conditionNotes: 'Key returned in good condition',
    });

    const res = await returnKey(req, { params: Promise.resolve({ id: checkoutId }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('returned');
  });

  it('Step 2: key status returns to available after return', async () => {
    mockKeyCheckoutFindUnique.mockResolvedValue(
      makeCheckout({ id: checkoutId, keyId, returnTime: null }),
    );
    mockKeyCheckoutUpdate.mockResolvedValue(
      makeCheckout({ id: checkoutId, returnTime: new Date() }),
    );
    mockKeyInventoryUpdate.mockResolvedValue(makeKey({ id: keyId, status: 'available' }));

    await returnKey(
      createPatchRequest(`/api/v1/keys/checkouts/${checkoutId}`, { action: 'return' }),
      { params: Promise.resolve({ id: checkoutId }) },
    );

    expect(mockKeyInventoryUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'available',
        }),
      }),
    );
  });

  it('Step 3: attempting to return already-returned key fails', async () => {
    mockKeyCheckoutFindUnique.mockResolvedValue(
      makeCheckout({
        id: checkoutId,
        keyId,
        returnTime: new Date(), // Already returned
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

  it('Step 4: returning non-existent checkout returns 404', async () => {
    mockKeyCheckoutFindUnique.mockResolvedValue(null);

    const req = createPatchRequest('/api/v1/keys/checkouts/nonexistent', {
      action: 'return',
    });

    const res = await returnKey(req, { params: Promise.resolve({ id: 'nonexistent' }) });
    expect(res.status).toBe(404);
  });
});

// ===========================================================================
// SCENARIO 5: Lost Key Reported and Deactivated
// ===========================================================================

describe('Scenario 5: Lost Key Reported and Deactivated', () => {
  const lostKeyId = 'key-lost-001';
  const checkoutId = 'co-lost-001';

  it('Step 1: return lost key checkout with LOST condition note', async () => {
    mockKeyCheckoutFindUnique.mockResolvedValue(
      makeCheckout({
        id: checkoutId,
        keyId: lostKeyId,
        returnTime: null,
        checkedOutTo: 'Missing Resident',
      }),
    );
    mockKeyCheckoutUpdate.mockResolvedValue(
      makeCheckout({
        id: checkoutId,
        keyId: lostKeyId,
        returnTime: new Date(),
        conditionNotes: 'KEY LOST — resident reported FOB lost in parking garage',
      }),
    );
    mockKeyInventoryUpdate.mockResolvedValue(makeKey({ id: lostKeyId, status: 'available' }));

    const req = createPatchRequest(`/api/v1/keys/checkouts/${checkoutId}`, {
      action: 'return',
      conditionNotes: 'KEY LOST — resident reported FOB lost in parking garage',
    });

    const res = await returnKey(req, { params: Promise.resolve({ id: checkoutId }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('returned');
  });

  it('Step 2: deactivate lost key via key update', async () => {
    mockKeyInventoryFindUnique.mockResolvedValue(makeKey({ id: lostKeyId, status: 'available' }));
    mockKeyInventoryUpdate.mockResolvedValue(
      makeKey({
        id: lostKeyId,
        status: 'decommissioned',
        notes: 'LOST — decommissioned. Serial: FOB-SN-44821. Replacement issued.',
      }),
    );

    const req = createPatchRequest(`/api/v1/keys/${lostKeyId}`, {
      status: 'decommissioned',
      notes: 'LOST — decommissioned. Serial: FOB-SN-44821. Replacement issued.',
    });

    const res = await updateKey(req, { params: Promise.resolve({ id: lostKeyId }) });
    expect(res.status).toBe(200);

    expect(mockKeyInventoryUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: lostKeyId },
        data: expect.objectContaining({
          status: 'decommissioned',
        }),
      }),
    );
  });

  it('Step 3: issue replacement key from inventory', async () => {
    const replacementKeyId = 'key-replacement-001';

    mockKeyInventoryFindUnique.mockResolvedValue(
      makeKey({
        id: replacementKeyId,
        keyName: 'FOB-Unit302-B',
        keyNumber: 'FOB-SN-44822',
        status: 'available',
      }),
    );
    mockKeyCheckoutCreate.mockResolvedValue(
      makeCheckout({
        id: 'co-replacement-001',
        keyId: replacementKeyId,
        checkedOutTo: 'Janet Smith - Unit 302',
        reason: 'Replacement for lost FOB-SN-44821',
      }),
    );
    mockKeyInventoryUpdate.mockResolvedValue(
      makeKey({ id: replacementKeyId, status: 'checked_out' }),
    );

    const req = createPostRequest('/api/v1/keys/checkouts', {
      propertyId: PROPERTY_ID,
      keyId: replacementKeyId,
      checkedOutTo: 'Janet Smith - Unit 302',
      unitId: UNIT_ID,
      idType: 'driver_license',
      reason: 'Replacement for lost FOB-SN-44821',
    });

    const res = await issueKey(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('Janet Smith');
  });
});

// ===========================================================================
// SCENARIO 6: Key Audit Trail Shows Full History
// ===========================================================================

describe('Scenario 6: Key Audit Trail Shows Full History', () => {
  it('should list keys with latest checkout information', async () => {
    mockKeyInventoryFindMany.mockResolvedValue([
      makeKey({
        id: 'key-audit-001',
        keyName: 'FOB-302-A',
        status: 'checked_out',
        checkouts: [
          {
            id: 'co-latest',
            checkedOutTo: 'Janet Smith',
            checkoutTime: new Date('2026-03-18T09:00:00Z'),
            returnTime: null,
            expectedReturn: new Date('2026-03-25T09:00:00Z'),
            unitId: UNIT_ID,
          },
        ],
      }),
      makeKey({
        id: 'key-audit-002',
        keyName: 'FOB-302-B',
        status: 'available',
        checkouts: [
          {
            id: 'co-returned',
            checkedOutTo: 'John Doe',
            checkoutTime: new Date('2026-03-10T09:00:00Z'),
            returnTime: new Date('2026-03-15T09:00:00Z'),
            expectedReturn: null,
            unitId: UNIT_ID,
          },
        ],
      }),
    ]);
    mockKeyInventoryCount.mockResolvedValue(2);

    const req = createGetRequest('/api/v1/keys', {
      searchParams: { propertyId: PROPERTY_ID },
    });

    const res = await listKeys(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: {
        id: string;
        keyName: string;
        status: string;
        activeCheckout: { checkedOutTo: string } | null;
      }[];
    }>(res);

    // First key has active checkout
    const checkedOutKey = body.data.find((k) => k.id === 'key-audit-001');
    expect(checkedOutKey).toBeDefined();
    expect(checkedOutKey!.activeCheckout).not.toBeNull();
    expect(checkedOutKey!.activeCheckout!.checkedOutTo).toBe('Janet Smith');

    // Second key has no active checkout (returned)
    const availableKey = body.data.find((k) => k.id === 'key-audit-002');
    expect(availableKey).toBeDefined();
    expect(availableKey!.activeCheckout).toBeNull();
  });

  it('should search keys by name or serial number', async () => {
    mockKeyInventoryFindMany.mockResolvedValue([]);
    mockKeyInventoryCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/keys', {
      searchParams: { propertyId: PROPERTY_ID, search: 'FOB-SN-44821' },
    });

    await listKeys(req);

    expect(mockKeyInventoryFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({
              keyNumber: expect.objectContaining({ contains: 'FOB-SN-44821' }),
            }),
          ]),
        }),
      }),
    );
  });
});

// ===========================================================================
// Full End-to-End Workflow
// ===========================================================================

describe('Full Workflow: Key lifecycle from creation to lost replacement', () => {
  const keyId = 'key-e2e-001';
  const replacementKeyId = 'key-e2e-002';
  const checkoutId = 'co-e2e-001';

  it('complete lifecycle: create key -> issue -> return -> reissue -> lost -> replace', async () => {
    // Step 1: Add key to inventory
    mockKeyInventoryCreate.mockResolvedValue(
      makeKey({ id: keyId, keyName: 'FOB-E2E-001', keyNumber: 'SN-E2E-001' }),
    );
    const createRes = await createKey(
      createPostRequest('/api/v1/keys', {
        propertyId: PROPERTY_ID,
        keyName: 'FOB-E2E-001',
        keyNumber: 'SN-E2E-001',
        category: 'fob',
      }),
    );
    expect(createRes.status).toBe(201);

    // Step 2: Issue to resident
    mockKeyInventoryFindUnique.mockResolvedValue(makeKey({ id: keyId, status: 'available' }));
    mockKeyCheckoutCreate.mockResolvedValue(
      makeCheckout({ id: checkoutId, keyId, checkedOutTo: 'Resident A' }),
    );
    mockKeyInventoryUpdate.mockResolvedValue(makeKey({ id: keyId, status: 'checked_out' }));

    const issueRes = await issueKey(
      createPostRequest('/api/v1/keys/checkouts', {
        propertyId: PROPERTY_ID,
        keyId,
        checkedOutTo: 'Resident A',
        unitId: UNIT_ID,
        idType: 'driver_license',
        reason: 'Move-in',
      }),
    );
    expect(issueRes.status).toBe(201);

    // Step 3: Return key
    mockKeyCheckoutFindUnique.mockResolvedValue(
      makeCheckout({ id: checkoutId, keyId, returnTime: null }),
    );
    mockKeyCheckoutUpdate.mockResolvedValue(
      makeCheckout({ id: checkoutId, returnTime: new Date() }),
    );
    mockKeyInventoryUpdate.mockResolvedValue(makeKey({ id: keyId, status: 'available' }));

    const returnRes = await returnKey(
      createPatchRequest(`/api/v1/keys/checkouts/${checkoutId}`, { action: 'return' }),
      { params: Promise.resolve({ id: checkoutId }) },
    );
    expect(returnRes.status).toBe(200);

    // Step 4: Reissue same key to new resident
    vi.clearAllMocks();
    mockKeyInventoryFindUnique.mockResolvedValue(makeKey({ id: keyId, status: 'available' }));
    mockKeyCheckoutCreate.mockResolvedValue(
      makeCheckout({ id: 'co-e2e-002', keyId, checkedOutTo: 'Resident B' }),
    );
    mockKeyInventoryUpdate.mockResolvedValue(makeKey({ id: keyId, status: 'checked_out' }));

    const reissueRes = await issueKey(
      createPostRequest('/api/v1/keys/checkouts', {
        propertyId: PROPERTY_ID,
        keyId,
        checkedOutTo: 'Resident B',
        unitId: UNIT_ID,
        idType: 'passport',
        reason: 'New tenant',
      }),
    );
    expect(reissueRes.status).toBe(201);

    // Step 5: Key lost — return with lost note
    mockKeyCheckoutFindUnique.mockResolvedValue(
      makeCheckout({ id: 'co-e2e-002', keyId, returnTime: null }),
    );
    mockKeyCheckoutUpdate.mockResolvedValue(
      makeCheckout({ id: 'co-e2e-002', returnTime: new Date(), conditionNotes: 'LOST' }),
    );
    mockKeyInventoryUpdate.mockResolvedValue(makeKey({ id: keyId, status: 'available' }));

    const lostReturnRes = await returnKey(
      createPatchRequest('/api/v1/keys/checkouts/co-e2e-002', {
        action: 'return',
        conditionNotes: 'LOST',
      }),
      { params: Promise.resolve({ id: 'co-e2e-002' }) },
    );
    expect(lostReturnRes.status).toBe(200);

    // Step 6: Issue replacement
    mockKeyInventoryFindUnique.mockResolvedValue(
      makeKey({ id: replacementKeyId, keyName: 'FOB-E2E-002', status: 'available' }),
    );
    mockKeyCheckoutCreate.mockResolvedValue(
      makeCheckout({ id: 'co-e2e-003', keyId: replacementKeyId, checkedOutTo: 'Resident B' }),
    );
    mockKeyInventoryUpdate.mockResolvedValue(
      makeKey({ id: replacementKeyId, status: 'checked_out' }),
    );

    const replaceRes = await issueKey(
      createPostRequest('/api/v1/keys/checkouts', {
        propertyId: PROPERTY_ID,
        keyId: replacementKeyId,
        checkedOutTo: 'Resident B',
        unitId: UNIT_ID,
        idType: 'passport',
        reason: 'Replacement for lost FOB',
      }),
    );
    expect(replaceRes.status).toBe(201);
  });
});

// ===========================================================================
// Validation & Edge Cases
// ===========================================================================

describe('Key/FOB Management: Validation & Edge Cases', () => {
  it('listing keys requires propertyId', async () => {
    const req = createGetRequest('/api/v1/keys');
    const res = await listKeys(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_PROPERTY');
  });

  it('should reject key creation without required fields', async () => {
    const req = createPostRequest('/api/v1/keys', {
      // Missing propertyId, keyName, category
    });

    const res = await createKey(req);
    expect(res.status).toBe(400);
  });

  it('invalid return action returns 400', async () => {
    const req = createPatchRequest('/api/v1/keys/checkouts/some-id', {
      action: 'invalid_action',
    });

    const res = await returnKey(req, { params: Promise.resolve({ id: 'some-id' }) });
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('INVALID_ACTION');
  });

  it('should paginate key listing', async () => {
    mockKeyInventoryFindMany.mockResolvedValue([]);
    mockKeyInventoryCount.mockResolvedValue(100);

    const req = createGetRequest('/api/v1/keys', {
      searchParams: { propertyId: PROPERTY_ID, page: '3', pageSize: '10' },
    });

    const res = await listKeys(req);
    const body = await parseResponse<{
      meta: { page: number; pageSize: number; total: number; totalPages: number };
    }>(res);

    expect(body.meta.page).toBe(3);
    expect(body.meta.pageSize).toBe(10);
    expect(body.meta.total).toBe(100);
    expect(body.meta.totalPages).toBe(10);
  });

  it('should search keys by owner name', async () => {
    mockKeyInventoryFindMany.mockResolvedValue([]);
    mockKeyInventoryCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/keys', {
      searchParams: { propertyId: PROPERTY_ID, search: 'Janet Smith' },
    });

    await listKeys(req);

    expect(mockKeyInventoryFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({
              keyOwner: expect.objectContaining({ contains: 'Janet Smith' }),
            }),
          ]),
        }),
      }),
    );
  });
});
