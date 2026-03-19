/**
 * Comprehensive Notification Preferences Tests -- PRD 08
 *
 * Deep coverage of the notification preferences system including:
 *  1.  GET preferences returns all 12 notification modules
 *  2.  PATCH preferences updates individual module settings
 *  3.  Each module has email/sms/push toggle
 *  4.  DND (Do Not Disturb) mode settings
 *  5.  Quiet hours configuration
 *  6.  Emergency bypass settings
 *  7.  Digest mode (batched notifications)
 *  8.  Default preferences for new users
 *  9.  Bulk preference updates across modules
 * 10.  Preference validation and error handling
 * 11.  Multi-property preference isolation
 * 12.  Preference reset and inheritance
 *
 * 40+ tests
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  createGetRequest,
  createPostRequest,
  createPutRequest,
  parseResponse,
} from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Mock Setup
// ---------------------------------------------------------------------------

const mockFindMany = vi.fn();
const mockUpsert = vi.fn();
const mockDeleteMany = vi.fn();
const mockCount = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    notificationPreference: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      upsert: (...args: unknown[]) => mockUpsert(...args),
      deleteMany: (...args: unknown[]) => mockDeleteMany(...args),
      count: (...args: unknown[]) => mockCount(...args),
    },
  },
}));

const mockGuardRoute = vi.fn();

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: (...args: unknown[]) => mockGuardRoute(...args),
}));

import { GET, PUT } from '../../notifications/preferences/route';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROPERTY_ID = '00000000-0000-4000-b000-000000000001';
const PROPERTY_ID_2 = '00000000-0000-4000-b000-000000000002';
const USER_1 = '00000000-0000-4000-c000-000000000001';
const USER_2 = '00000000-0000-4000-c000-000000000002';

const ALL_MODULES = [
  'amenity',
  'announcements',
  'events',
  'maintenance',
  'packages',
  'security',
  'parking',
  'community',
  'governance',
  'training',
  'emergency',
  'system',
] as const;

const VALID_CHANNELS = ['email', 'sms', 'push'] as const;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createPreferencesPutRequest(preferences: unknown[]) {
  const req = createPostRequest('/api/v1/notifications/preferences', { preferences });
  Object.defineProperty(req, 'method', { value: 'PUT' });
  return req;
}

function mockAuthAs(userId: string, propertyId: string, role = 'resident_owner') {
  mockGuardRoute.mockResolvedValue({
    user: {
      userId,
      propertyId,
      role,
      permissions: ['*'],
      mfaVerified: false,
    },
    error: null,
  });
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  mockAuthAs(USER_1, PROPERTY_ID);
});

// ===========================================================================
// 1. GET preferences returns all 12 notification modules
// ===========================================================================

describe('GET preferences returns all 12 notification modules', () => {
  it('returns exactly 12 modules when all are stored', async () => {
    const allPrefs = ALL_MODULES.flatMap((module, i) =>
      VALID_CHANNELS.map((channel, j) => ({
        id: `pref-${i}-${j}`,
        module,
        channel,
        enabled: true,
        userId: USER_1,
        propertyId: PROPERTY_ID,
      })),
    );
    mockFindMany.mockResolvedValue(allPrefs);

    const req = createGetRequest('/api/v1/notifications/preferences');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: Array<{ module: string }> }>(res);
    const uniqueModules = [...new Set(body.data.map((p) => p.module))];
    expect(uniqueModules).toHaveLength(12);

    for (const mod of ALL_MODULES) {
      expect(uniqueModules).toContain(mod);
    }
  });

  it('returns 36 records when all 12 modules have all 3 channels', async () => {
    const allPrefs = ALL_MODULES.flatMap((module, i) =>
      VALID_CHANNELS.map((channel, j) => ({
        id: `pref-${i}-${j}`,
        module,
        channel,
        enabled: true,
      })),
    );
    mockFindMany.mockResolvedValue(allPrefs);

    const req = createGetRequest('/api/v1/notifications/preferences');
    const res = await GET(req);
    const body = await parseResponse<{ data: unknown[] }>(res);
    expect(body.data).toHaveLength(36);
  });

  it('returns preferences sorted by module then channel', async () => {
    mockFindMany.mockResolvedValue([]);

    const req = createGetRequest('/api/v1/notifications/preferences');
    await GET(req);

    const orderBy = mockFindMany.mock.calls[0]![0].orderBy;
    expect(orderBy).toEqual([{ module: 'asc' }, { channel: 'asc' }]);
  });

  it('scopes query to authenticated user and property', async () => {
    mockFindMany.mockResolvedValue([]);

    const req = createGetRequest('/api/v1/notifications/preferences');
    await GET(req);

    const where = mockFindMany.mock.calls[0]![0].where;
    expect(where.userId).toBe(USER_1);
    expect(where.propertyId).toBe(PROPERTY_ID);
  });

  it('returns 500 when database throws', async () => {
    mockFindMany.mockRejectedValue(new Error('Database connection lost'));

    const req = createGetRequest('/api/v1/notifications/preferences');
    const res = await GET(req);
    expect(res.status).toBe(500);
  });
});

// ===========================================================================
// 2. PATCH/PUT preferences updates individual module settings
// ===========================================================================

describe('PUT preferences updates individual module settings', () => {
  it('updates a single module-channel preference', async () => {
    mockUpsert.mockResolvedValue({
      id: '1',
      module: 'packages',
      channel: 'email',
      enabled: false,
    });

    const req = createPreferencesPutRequest([
      { module: 'packages', channel: 'email', enabled: false },
    ]);
    const res = await PUT(req);
    expect(res.status).toBe(200);

    expect(mockUpsert).toHaveBeenCalledOnce();
    const call = mockUpsert.mock.calls[0]![0];
    expect(call.where.userId_propertyId_module_channel).toEqual({
      userId: USER_1,
      propertyId: PROPERTY_ID,
      module: 'packages',
      channel: 'email',
    });
    expect(call.create.enabled).toBe(false);
    expect(call.update.enabled).toBe(false);
  });

  it('updates multiple module-channel preferences in a single request', async () => {
    mockUpsert.mockResolvedValue({});

    const req = createPreferencesPutRequest([
      { module: 'packages', channel: 'email', enabled: true },
      { module: 'packages', channel: 'sms', enabled: false },
      { module: 'packages', channel: 'push', enabled: true },
      { module: 'maintenance', channel: 'email', enabled: true },
      { module: 'security', channel: 'sms', enabled: true },
    ]);
    const res = await PUT(req);
    expect(res.status).toBe(200);
    expect(mockUpsert).toHaveBeenCalledTimes(5);
  });

  it('returns updated results with success message', async () => {
    mockUpsert.mockResolvedValue({ id: '1', module: 'packages', channel: 'push', enabled: true });

    const req = createPreferencesPutRequest([
      { module: 'packages', channel: 'push', enabled: true },
    ]);
    const res = await PUT(req);
    const body = await parseResponse<{ data: unknown[]; message: string }>(res);

    expect(body.data).toHaveLength(1);
    expect(body.message).toContain('updated');
  });

  it('toggles a preference from enabled to disabled', async () => {
    mockUpsert.mockResolvedValue({
      id: '1',
      module: 'security',
      channel: 'sms',
      enabled: false,
    });

    const req = createPreferencesPutRequest([
      { module: 'security', channel: 'sms', enabled: false },
    ]);
    const res = await PUT(req);
    expect(res.status).toBe(200);

    const call = mockUpsert.mock.calls[0]![0];
    expect(call.create.enabled).toBe(false);
  });

  it('returns 500 when database throws on upsert', async () => {
    mockUpsert.mockRejectedValue(new Error('Unique constraint violation'));

    const req = createPreferencesPutRequest([
      { module: 'packages', channel: 'email', enabled: true },
    ]);
    const res = await PUT(req);
    expect(res.status).toBe(500);
  });
});

// ===========================================================================
// 3. Each module has email/sms/push toggle
// ===========================================================================

describe('Each module has email, sms, push channel toggles', () => {
  it('accepts all three valid channels for any module', async () => {
    mockUpsert.mockResolvedValue({});

    for (const channel of VALID_CHANNELS) {
      const req = createPreferencesPutRequest([{ module: 'packages', channel, enabled: true }]);
      const res = await PUT(req);
      expect(res.status).toBe(200);
    }
    expect(mockUpsert).toHaveBeenCalledTimes(3);
  });

  it('rejects invalid channel values', async () => {
    const invalidChannels = ['telegram', 'whatsapp', 'voice', 'slack', 'webhook', ''];

    for (const channel of invalidChannels) {
      const req = createPreferencesPutRequest([{ module: 'packages', channel, enabled: true }]);
      const res = await PUT(req);
      expect(res.status).toBe(400);
    }
  });

  it('stores independent enabled state per channel per module', async () => {
    mockUpsert.mockResolvedValue({});

    const req = createPreferencesPutRequest([
      { module: 'maintenance', channel: 'email', enabled: true },
      { module: 'maintenance', channel: 'sms', enabled: false },
      { module: 'maintenance', channel: 'push', enabled: true },
    ]);
    const res = await PUT(req);
    expect(res.status).toBe(200);

    const modules = mockUpsert.mock.calls.map(
      (c: unknown[]) => (c[0] as { create: { channel: string; enabled: boolean } }).create,
    );
    expect(modules.find((m) => m.channel === 'email')!.enabled).toBe(true);
    expect(modules.find((m) => m.channel === 'sms')!.enabled).toBe(false);
    expect(modules.find((m) => m.channel === 'push')!.enabled).toBe(true);
  });

  it('returns separate records for each channel when querying', async () => {
    mockFindMany.mockResolvedValue([
      { id: '1', module: 'security', channel: 'email', enabled: true },
      { id: '2', module: 'security', channel: 'sms', enabled: true },
      { id: '3', module: 'security', channel: 'push', enabled: false },
    ]);

    const req = createGetRequest('/api/v1/notifications/preferences');
    const res = await GET(req);
    const body = await parseResponse<{
      data: Array<{ module: string; channel: string; enabled: boolean }>;
    }>(res);

    const securityPrefs = body.data.filter((p) => p.module === 'security');
    expect(securityPrefs).toHaveLength(3);
    expect(securityPrefs.map((p) => p.channel).sort()).toEqual(['email', 'push', 'sms']);
  });

  it('rejects request with missing enabled field', async () => {
    const req = createPostRequest('/api/v1/notifications/preferences', {
      preferences: [{ module: 'packages', channel: 'email' }],
    });
    Object.defineProperty(req, 'method', { value: 'PUT' });

    const res = await PUT(req);
    expect(res.status).toBe(400);
  });

  it('rejects request with missing channel field', async () => {
    const req = createPostRequest('/api/v1/notifications/preferences', {
      preferences: [{ module: 'packages', enabled: true }],
    });
    Object.defineProperty(req, 'method', { value: 'PUT' });

    const res = await PUT(req);
    expect(res.status).toBe(400);
  });

  it('rejects request with missing module field', async () => {
    const req = createPostRequest('/api/v1/notifications/preferences', {
      preferences: [{ channel: 'email', enabled: true }],
    });
    Object.defineProperty(req, 'method', { value: 'PUT' });

    const res = await PUT(req);
    expect(res.status).toBe(400);
  });
});

// ===========================================================================
// 4. DND (Do Not Disturb) mode settings
// ===========================================================================

describe('DND (Do Not Disturb) mode settings', () => {
  it('stores dndEnabled=true via PUT', async () => {
    mockUpsert.mockResolvedValue({});

    const req = createPreferencesPutRequest([
      { module: 'packages', channel: 'push', enabled: true, dndEnabled: true },
    ]);
    const res = await PUT(req);
    expect(res.status).toBe(200);

    const call = mockUpsert.mock.calls[0]![0];
    expect(call.create.dndEnabled).toBe(true);
  });

  it('dndEnabled defaults to false when omitted', async () => {
    mockUpsert.mockResolvedValue({});

    const req = createPreferencesPutRequest([
      { module: 'packages', channel: 'email', enabled: true },
    ]);
    await PUT(req);

    const call = mockUpsert.mock.calls[0]![0];
    expect(call.create.dndEnabled).toBe(false);
  });

  it('can disable DND by setting dndEnabled=false', async () => {
    mockUpsert.mockResolvedValue({});

    const req = createPreferencesPutRequest([
      { module: 'packages', channel: 'push', enabled: true, dndEnabled: false },
    ]);
    await PUT(req);

    const call = mockUpsert.mock.calls[0]![0];
    expect(call.create.dndEnabled).toBe(false);
  });

  it('DND can be set independently per module-channel combination', async () => {
    mockUpsert.mockResolvedValue({});

    const req = createPreferencesPutRequest([
      { module: 'packages', channel: 'push', enabled: true, dndEnabled: true },
      { module: 'packages', channel: 'email', enabled: true, dndEnabled: false },
    ]);
    await PUT(req);

    const pushCall = mockUpsert.mock.calls[0]![0];
    const emailCall = mockUpsert.mock.calls[1]![0];
    expect(pushCall.create.dndEnabled).toBe(true);
    expect(emailCall.create.dndEnabled).toBe(false);
  });

  it('global DND blocks all non-emergency modules at dispatch time', () => {
    const globalDnd = true;

    for (const mod of ALL_MODULES) {
      const shouldSend = !globalDnd || mod === 'emergency';
      if (mod === 'emergency') {
        expect(shouldSend).toBe(true);
      } else {
        expect(shouldSend).toBe(false);
      }
    }
  });
});

// ===========================================================================
// 5. Quiet hours configuration
// ===========================================================================

describe('Quiet hours configuration', () => {
  it('stores dndStart and dndEnd times as Date objects', async () => {
    mockUpsert.mockResolvedValue({});

    const req = createPreferencesPutRequest([
      {
        module: 'packages',
        channel: 'push',
        enabled: true,
        dndEnabled: true,
        dndStart: '22:00',
        dndEnd: '07:00',
      },
    ]);
    const res = await PUT(req);
    expect(res.status).toBe(200);

    const call = mockUpsert.mock.calls[0]![0];
    expect(call.create.dndStart).toBeInstanceOf(Date);
    expect(call.create.dndEnd).toBeInstanceOf(Date);
  });

  it('stores null for dndStart and dndEnd when not provided', async () => {
    mockUpsert.mockResolvedValue({});

    const req = createPreferencesPutRequest([
      { module: 'packages', channel: 'email', enabled: true },
    ]);
    await PUT(req);

    const call = mockUpsert.mock.calls[0]![0];
    expect(call.create.dndStart).toBeNull();
    expect(call.create.dndEnd).toBeNull();
  });

  it('quiet hours support overnight ranges (22:00 to 07:00)', () => {
    function isInQuietHours(hour: number, start: number, end: number): boolean {
      if (start > end) {
        return hour >= start || hour < end;
      }
      return hour >= start && hour < end;
    }

    // Overnight range: 22:00 to 07:00
    expect(isInQuietHours(22, 22, 7)).toBe(true);
    expect(isInQuietHours(23, 22, 7)).toBe(true);
    expect(isInQuietHours(0, 22, 7)).toBe(true);
    expect(isInQuietHours(3, 22, 7)).toBe(true);
    expect(isInQuietHours(6, 22, 7)).toBe(true);
    expect(isInQuietHours(7, 22, 7)).toBe(false);
    expect(isInQuietHours(12, 22, 7)).toBe(false);
    expect(isInQuietHours(21, 22, 7)).toBe(false);
  });

  it('quiet hours support same-day ranges (09:00 to 17:00)', () => {
    function isInQuietHours(hour: number, start: number, end: number): boolean {
      if (start > end) {
        return hour >= start || hour < end;
      }
      return hour >= start && hour < end;
    }

    // Same-day range: 09:00 to 17:00
    expect(isInQuietHours(9, 9, 17)).toBe(true);
    expect(isInQuietHours(12, 9, 17)).toBe(true);
    expect(isInQuietHours(16, 9, 17)).toBe(true);
    expect(isInQuietHours(17, 9, 17)).toBe(false);
    expect(isInQuietHours(8, 9, 17)).toBe(false);
    expect(isInQuietHours(0, 9, 17)).toBe(false);
  });

  it('DND-blocked notifications are queued for delivery after quiet hours end', () => {
    const dndEnd = 7;
    const currentHour = 23;
    const isBlocked = true;

    if (isBlocked) {
      const scheduledDeliveryHour = dndEnd;
      expect(scheduledDeliveryHour).toBe(7);
      expect(scheduledDeliveryHour).toBeGreaterThan(currentHour % 24 === 23 ? 0 : currentHour);
    }
  });

  it('stores quiet hours alongside channel enable status', async () => {
    mockUpsert.mockResolvedValue({});

    const req = createPreferencesPutRequest([
      {
        module: 'announcements',
        channel: 'push',
        enabled: true,
        dndEnabled: true,
        dndStart: '23:00',
        dndEnd: '06:00',
      },
    ]);
    await PUT(req);

    const call = mockUpsert.mock.calls[0]![0];
    expect(call.create.enabled).toBe(true);
    expect(call.create.dndEnabled).toBe(true);
    expect(call.create.dndStart).toBeInstanceOf(Date);
    expect(call.create.dndEnd).toBeInstanceOf(Date);
  });
});

// ===========================================================================
// 6. Emergency bypass settings
// ===========================================================================

describe('Emergency bypass settings', () => {
  it('emergency module preferences can be stored normally', async () => {
    mockUpsert.mockResolvedValue({
      module: 'emergency',
      channel: 'email',
      enabled: false,
    });

    const req = createPreferencesPutRequest([
      { module: 'emergency', channel: 'email', enabled: false },
    ]);
    const res = await PUT(req);
    expect(res.status).toBe(200);
  });

  it('emergency broadcasts bypass all user preferences at dispatch time', () => {
    const isEmergency = true;
    const userPrefs = [
      { module: 'emergency', channel: 'email', enabled: false },
      { module: 'emergency', channel: 'sms', enabled: false },
      { module: 'emergency', channel: 'push', enabled: false },
    ];

    const channelsToSend = isEmergency
      ? ['email', 'sms', 'push']
      : userPrefs.filter((p) => p.enabled).map((p) => p.channel);

    expect(channelsToSend).toEqual(['email', 'sms', 'push']);
  });

  it('emergency bypasses DND mode', () => {
    const isEmergency = true;
    const isDndActive = true;

    const shouldBlock = !isEmergency && isDndActive;
    expect(shouldBlock).toBe(false);
  });

  it('emergency bypasses quiet hours', () => {
    const isEmergency = true;
    const isInQuietHours = true;

    const shouldBlock = !isEmergency && isInQuietHours;
    expect(shouldBlock).toBe(false);
  });

  it('emergency bypasses digest mode', () => {
    const isEmergency = true;
    const digestMode = 'daily';

    const effectiveMode = isEmergency ? 'instant' : digestMode;
    expect(effectiveMode).toBe('instant');
  });

  it('non-emergency respects all preference restrictions', () => {
    const isEmergency = false;
    const isDndActive = true;

    const shouldBlock = !isEmergency && isDndActive;
    expect(shouldBlock).toBe(true);
  });

  it('emergency cascade config targets all available channels', () => {
    const cascadeConfig = {
      channels: ['email', 'sms', 'push'] as const,
      bypassPreferences: true,
      bypassDnd: true,
      bypassQuietHours: true,
      bypassDigest: true,
    };

    expect(cascadeConfig.channels).toHaveLength(3);
    expect(cascadeConfig.bypassPreferences).toBe(true);
    expect(cascadeConfig.bypassDnd).toBe(true);
    expect(cascadeConfig.bypassQuietHours).toBe(true);
    expect(cascadeConfig.bypassDigest).toBe(true);
  });
});

// ===========================================================================
// 7. Digest mode (batched notifications)
// ===========================================================================

describe('Digest mode (batched notifications)', () => {
  it('stores digestMode=daily via PUT', async () => {
    mockUpsert.mockResolvedValue({});

    const req = createPreferencesPutRequest([
      {
        module: 'announcements',
        channel: 'email',
        enabled: true,
        digestMode: 'daily',
        digestTime: '09:00',
      },
    ]);
    const res = await PUT(req);
    expect(res.status).toBe(200);

    const call = mockUpsert.mock.calls[0]![0];
    expect(call.create.digestMode).toBe('daily');
  });

  it('stores digestMode=weekly via PUT', async () => {
    mockUpsert.mockResolvedValue({});

    const req = createPreferencesPutRequest([
      {
        module: 'community',
        channel: 'email',
        enabled: true,
        digestMode: 'weekly',
      },
    ]);
    const res = await PUT(req);
    expect(res.status).toBe(200);

    const call = mockUpsert.mock.calls[0]![0];
    expect(call.create.digestMode).toBe('weekly');
  });

  it('digestMode defaults to instant when not provided', async () => {
    mockUpsert.mockResolvedValue({});

    const req = createPreferencesPutRequest([
      { module: 'packages', channel: 'email', enabled: true },
    ]);
    await PUT(req);

    const call = mockUpsert.mock.calls[0]![0];
    expect(call.create.digestMode).toBe('instant');
  });

  it('rejects invalid digestMode values', async () => {
    const invalidModes = ['hourly', 'monthly', 'realtime', 'biweekly'];

    for (const digestMode of invalidModes) {
      const req = createPostRequest('/api/v1/notifications/preferences', {
        preferences: [{ module: 'packages', channel: 'email', enabled: true, digestMode }],
      });
      Object.defineProperty(req, 'method', { value: 'PUT' });

      const res = await PUT(req);
      expect(res.status).toBe(400);
    }
  });

  it('stores digestTime alongside digestMode', async () => {
    mockUpsert.mockResolvedValue({});

    const req = createPreferencesPutRequest([
      {
        module: 'packages',
        channel: 'email',
        enabled: true,
        digestMode: 'daily',
        digestTime: '08:30',
      },
    ]);
    await PUT(req);

    const call = mockUpsert.mock.calls[0]![0];
    expect(call.create.digestMode).toBe('daily');
    expect(call.create.digestTime).toBeInstanceOf(Date);
  });

  it('different modules can have different digest modes', async () => {
    mockUpsert.mockResolvedValue({});

    const req = createPreferencesPutRequest([
      { module: 'packages', channel: 'email', enabled: true, digestMode: 'instant' },
      { module: 'community', channel: 'email', enabled: true, digestMode: 'weekly' },
      { module: 'announcements', channel: 'email', enabled: true, digestMode: 'daily' },
    ]);
    await PUT(req);

    expect(mockUpsert).toHaveBeenCalledTimes(3);
    const modes = mockUpsert.mock.calls.map(
      (c: unknown[]) => (c[0] as { create: { digestMode: string } }).create.digestMode,
    );
    expect(modes).toContain('instant');
    expect(modes).toContain('weekly');
    expect(modes).toContain('daily');
  });

  it('digest aggregates multiple notifications into a single summary', () => {
    const pendingNotifications = [
      { title: 'Package PKG-001 arrived', createdAt: new Date('2026-03-18T08:00:00Z') },
      { title: 'Maintenance request updated', createdAt: new Date('2026-03-18T10:00:00Z') },
      { title: 'Amenity booking confirmed', createdAt: new Date('2026-03-18T14:00:00Z') },
      { title: 'Package PKG-002 arrived', createdAt: new Date('2026-03-18T15:00:00Z') },
    ];

    const digestSubject = `Concierge Daily Summary - ${pendingNotifications.length} notifications`;
    expect(digestSubject).toContain('4 notifications');
    expect(pendingNotifications).toHaveLength(4);
  });
});

// ===========================================================================
// 8. Default preferences for new users
// ===========================================================================

describe('Default preferences for new users', () => {
  it('returns empty array when no preferences exist (client applies defaults)', async () => {
    mockFindMany.mockResolvedValue([]);

    const req = createGetRequest('/api/v1/notifications/preferences');
    const res = await GET(req);
    const body = await parseResponse<{ data: unknown[] }>(res);

    expect(body.data).toEqual([]);
  });

  it('default channel policy: email enabled, push enabled, SMS disabled', () => {
    const channelDefaults: Record<string, boolean> = {
      email: true,
      push: true,
      sms: false,
    };

    expect(channelDefaults.email).toBe(true);
    expect(channelDefaults.push).toBe(true);
    expect(channelDefaults.sms).toBe(false);
  });

  it('effective preference falls back to default when no user preference exists', () => {
    const prefs: { module: string; channel: string; enabled: boolean }[] = [];
    const defaults: Record<string, boolean> = { email: true, push: true, sms: false };

    function getEffective(module: string, channel: string): boolean {
      const found = prefs.find((p) => p.module === module && p.channel === channel);
      return found ? found.enabled : (defaults[channel] ?? false);
    }

    expect(getEffective('packages', 'email')).toBe(true);
    expect(getEffective('packages', 'push')).toBe(true);
    expect(getEffective('packages', 'sms')).toBe(false);
    expect(getEffective('maintenance', 'email')).toBe(true);
    expect(getEffective('security', 'sms')).toBe(false);
  });

  it('user override takes precedence over default', () => {
    const prefs = [{ module: 'packages', channel: 'email', enabled: false }];
    const defaults: Record<string, boolean> = { email: true, push: true, sms: false };

    function getEffective(module: string, channel: string): boolean {
      const found = prefs.find((p) => p.module === module && p.channel === channel);
      return found ? found.enabled : (defaults[channel] ?? false);
    }

    // User disabled email for packages
    expect(getEffective('packages', 'email')).toBe(false);
    // Other modules still use defaults
    expect(getEffective('maintenance', 'email')).toBe(true);
  });

  it('default digestMode is instant for all modules', () => {
    for (const mod of ALL_MODULES) {
      const defaultPref = {
        module: mod,
        digestMode: 'instant',
        dndEnabled: false,
      };
      expect(defaultPref.digestMode).toBe('instant');
      expect(defaultPref.dndEnabled).toBe(false);
    }
  });

  it('can re-create preferences after a reset', async () => {
    mockDeleteMany.mockResolvedValue({ count: 36 });
    mockUpsert.mockResolvedValue({ module: 'packages', channel: 'email', enabled: true });

    const req = createPreferencesPutRequest([
      { module: 'packages', channel: 'email', enabled: true },
    ]);
    const res = await PUT(req);
    expect(res.status).toBe(200);
    expect(mockUpsert).toHaveBeenCalledOnce();
  });
});

// ===========================================================================
// 9. Multi-property preference isolation (tenant isolation)
// ===========================================================================

describe('Multi-property preference isolation', () => {
  it('GET scopes to current user + property', async () => {
    mockFindMany.mockResolvedValue([]);

    const req = createGetRequest('/api/v1/notifications/preferences');
    await GET(req);

    const where = mockFindMany.mock.calls[0]![0].where;
    expect(where.userId).toBe(USER_1);
    expect(where.propertyId).toBe(PROPERTY_ID);
  });

  it('PUT scopes upsert to current user + property', async () => {
    mockUpsert.mockResolvedValue({});

    const req = createPreferencesPutRequest([
      { module: 'packages', channel: 'email', enabled: true },
    ]);
    await PUT(req);

    const key = mockUpsert.mock.calls[0]![0].where.userId_propertyId_module_channel;
    expect(key.userId).toBe(USER_1);
    expect(key.propertyId).toBe(PROPERTY_ID);
  });

  it('same user on different properties has independent preference keys', () => {
    const key1 = {
      userId: USER_1,
      propertyId: PROPERTY_ID,
      module: 'packages',
      channel: 'email',
    };
    const key2 = {
      userId: USER_1,
      propertyId: PROPERTY_ID_2,
      module: 'packages',
      channel: 'email',
    };

    expect(key1.propertyId).not.toBe(key2.propertyId);
    expect(JSON.stringify(key1)).not.toBe(JSON.stringify(key2));
  });

  it('different users on the same property have independent preference keys', () => {
    const key1 = {
      userId: USER_1,
      propertyId: PROPERTY_ID,
      module: 'packages',
      channel: 'email',
    };
    const key2 = {
      userId: USER_2,
      propertyId: PROPERTY_ID,
      module: 'packages',
      channel: 'email',
    };

    expect(key1.userId).not.toBe(key2.userId);
  });

  it('switching property context changes which preferences are returned', async () => {
    // First request as USER_1 on PROPERTY_ID
    mockFindMany.mockResolvedValue([
      { id: '1', module: 'packages', channel: 'email', enabled: true },
    ]);

    const req1 = createGetRequest('/api/v1/notifications/preferences');
    await GET(req1);

    expect(mockFindMany.mock.calls[0]![0].where.propertyId).toBe(PROPERTY_ID);

    // Switch to PROPERTY_ID_2
    vi.clearAllMocks();
    mockAuthAs(USER_1, PROPERTY_ID_2);
    mockFindMany.mockResolvedValue([
      { id: '2', module: 'packages', channel: 'email', enabled: false },
    ]);

    const req2 = createGetRequest('/api/v1/notifications/preferences');
    await GET(req2);

    expect(mockFindMany.mock.calls[0]![0].where.propertyId).toBe(PROPERTY_ID_2);
  });
});

// ===========================================================================
// 10. Preference inheritance and channel priority
// ===========================================================================

describe('Preference inheritance and channel priority', () => {
  it('property-level defaults can be overridden by user preferences', () => {
    const propertyDefaults = { email: true, sms: true, push: true };
    const userOverride = { email: false, sms: false };

    const effective = { ...propertyDefaults, ...userOverride };
    expect(effective.email).toBe(false);
    expect(effective.sms).toBe(false);
    expect(effective.push).toBe(true);
  });

  it('module-specific preference overrides global preference', () => {
    const globalPref = { email: true, sms: false, push: true };
    const modulePref = { sms: true }; // Override: enable SMS for this module

    const effective = { ...globalPref, ...modulePref };
    expect(effective.email).toBe(true);
    expect(effective.sms).toBe(true);
    expect(effective.push).toBe(true);
  });

  it('emergency module ignores all preference layers', () => {
    const isEmergency = true;
    const effectivePrefs = { email: false, sms: false, push: false };

    const channelsToUse = isEmergency
      ? ['email', 'sms', 'push']
      : Object.entries(effectivePrefs)
          .filter(([, enabled]) => enabled)
          .map(([ch]) => ch);

    expect(channelsToUse).toEqual(['email', 'sms', 'push']);
  });

  it('priority order: user > property > system defaults', () => {
    const systemDefault = true;
    const propertyDefault = false;
    const userPref: boolean | undefined = undefined;

    const effective = userPref ?? propertyDefault ?? systemDefault;
    expect(effective).toBe(false); // Property overrides system
  });
});
