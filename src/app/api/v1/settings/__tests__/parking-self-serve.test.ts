/**
 * Settings — Parking Self-Serve Toggle (GAP 13.3)
 *
 * PropertySettings.operationalToggles stores boolean flags like
 * selfServeVisitorParking. When enabled, residents can register
 * visitor parking passes themselves instead of going through the front desk.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createPatchRequest, createGetRequest, parseResponse } from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Mock Setup
// ---------------------------------------------------------------------------

const mockPropertyUpdate = vi.fn();
const mockPropertyFindUnique = vi.fn();
const mockEventTypeFindMany = vi.fn();
const mockPropertySettingsUpsert = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    property: {
      update: (...args: unknown[]) => mockPropertyUpdate(...args),
      findUnique: (...args: unknown[]) => mockPropertyFindUnique(...args),
    },
    eventType: {
      findMany: (...args: unknown[]) => mockEventTypeFindMany(...args),
    },
    propertySettings: {
      upsert: (...args: unknown[]) => mockPropertySettingsUpsert(...args),
    },
  },
}));

vi.mock('@/server/cache', () => ({
  appCache: {
    get: vi.fn().mockReturnValue(null),
    set: vi.fn(),
    invalidateByTag: vi.fn(),
  },
}));

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: vi.fn().mockResolvedValue({
    user: {
      userId: 'admin-user',
      propertyId: '00000000-0000-4000-b000-000000000001',
      role: 'property_admin',
      permissions: ['*'],
      mfaVerified: true,
    },
    error: null,
  }),
}));

import { PATCH, GET } from '../route';

const PROPERTY_ID = '00000000-0000-4000-b000-000000000001';

beforeEach(() => {
  vi.clearAllMocks();
  mockPropertyUpdate.mockResolvedValue({
    id: PROPERTY_ID,
    name: 'Test Property',
  });
  mockPropertySettingsUpsert.mockResolvedValue({
    id: 'settings-1',
    propertyId: PROPERTY_ID,
    operationalToggles: { selfServeVisitorParking: true },
  });
});

// ---------------------------------------------------------------------------
// GAP 13.3: Parking self-serve toggle via operationalToggles
// ---------------------------------------------------------------------------

describe('PATCH /api/v1/settings — selfServeVisitorParking toggle (GAP 13.3)', () => {
  it('persists selfServeVisitorParking=true to PropertySettings', async () => {
    const req = createPatchRequest('/api/v1/settings', {
      propertyId: PROPERTY_ID,
      operationalToggles: { selfServeVisitorParking: true },
    });
    const res = await PATCH(req);
    expect(res.status).toBe(200);

    expect(mockPropertySettingsUpsert).toHaveBeenCalledTimes(1);
    const upsertCall = mockPropertySettingsUpsert.mock.calls[0]![0];
    expect(upsertCall.where.propertyId).toBe(PROPERTY_ID);
    expect(upsertCall.create.operationalToggles).toEqual({ selfServeVisitorParking: true });
    expect(upsertCall.update.operationalToggles).toEqual({ selfServeVisitorParking: true });
  });

  it('persists selfServeVisitorParking=false to PropertySettings', async () => {
    const req = createPatchRequest('/api/v1/settings', {
      propertyId: PROPERTY_ID,
      operationalToggles: { selfServeVisitorParking: false },
    });
    const res = await PATCH(req);
    expect(res.status).toBe(200);

    const upsertCall = mockPropertySettingsUpsert.mock.calls[0]![0];
    expect(upsertCall.create.operationalToggles).toEqual({ selfServeVisitorParking: false });
  });

  it('does NOT call propertySettings.upsert when operationalToggles is absent', async () => {
    const req = createPatchRequest('/api/v1/settings', {
      propertyId: PROPERTY_ID,
      name: 'Updated Name',
    });
    const res = await PATCH(req);
    expect(res.status).toBe(200);

    expect(mockPropertySettingsUpsert).not.toHaveBeenCalled();
  });

  it('stores updatedById from the authenticated user', async () => {
    const req = createPatchRequest('/api/v1/settings', {
      propertyId: PROPERTY_ID,
      operationalToggles: { selfServeVisitorParking: true },
    });
    await PATCH(req);

    const upsertCall = mockPropertySettingsUpsert.mock.calls[0]![0];
    expect(upsertCall.create.updatedById).toBe('admin-user');
    expect(upsertCall.update.updatedById).toBe('admin-user');
  });

  it('supports multiple toggles at once', async () => {
    const toggles = {
      selfServeVisitorParking: true,
      residentPackageNotifications: false,
      allowKeylessEntry: true,
    };

    const req = createPatchRequest('/api/v1/settings', {
      propertyId: PROPERTY_ID,
      operationalToggles: toggles,
    });
    await PATCH(req);

    const upsertCall = mockPropertySettingsUpsert.mock.calls[0]![0];
    expect(upsertCall.create.operationalToggles).toEqual(toggles);
  });

  it('ignores operationalToggles when it is not an object', async () => {
    const req = createPatchRequest('/api/v1/settings', {
      propertyId: PROPERTY_ID,
      operationalToggles: 'invalid',
    });
    const res = await PATCH(req);
    expect(res.status).toBe(200);

    expect(mockPropertySettingsUpsert).not.toHaveBeenCalled();
  });
});
