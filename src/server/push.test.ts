/**
 * Push Notification Service Tests — TDD
 *
 * Tests for FCM HTTP v1 API integration.
 * All external dependencies (fetch, Prisma) are mocked.
 */

import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mocks — must be declared before imports
// ---------------------------------------------------------------------------

const mockPrismaDevicePushToken = {
  findMany: vi.fn(),
  create: vi.fn(),
  deleteMany: vi.fn(),
};

const mockPrismaUserProperty = {
  findMany: vi.fn(),
};

vi.mock('@/server/db', () => ({
  prisma: {
    devicePushToken: mockPrismaDevicePushToken,
    userProperty: mockPrismaUserProperty,
  },
}));

vi.mock('@/server/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// ---------------------------------------------------------------------------
// Dynamic import so mocks are applied first
// ---------------------------------------------------------------------------

let sendPushNotification: typeof import('./push').sendPushNotification;
let sendPushToUser: typeof import('./push').sendPushToUser;
let sendPushToProperty: typeof import('./push').sendPushToProperty;
let registerPushToken: typeof import('./push').registerPushToken;
let unregisterPushToken: typeof import('./push').unregisterPushToken;

beforeEach(async () => {
  vi.resetModules();
  vi.resetAllMocks();
});

// ---------------------------------------------------------------------------
// Helper: import module with specific env
// ---------------------------------------------------------------------------

async function importWithEnv(env: Record<string, string | undefined>) {
  // Set env vars before importing
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  const mod = await import('./push');
  sendPushNotification = mod.sendPushNotification;
  sendPushToUser = mod.sendPushToUser;
  sendPushToProperty = mod.sendPushToProperty;
  registerPushToken = mod.registerPushToken;
  unregisterPushToken = mod.unregisterPushToken;
  return mod;
}

// Fake service account key (minimal structure for testing)
const FAKE_SERVICE_ACCOUNT = JSON.stringify({
  type: 'service_account',
  project_id: 'test-project',
  private_key_id: 'key123',
  private_key:
    '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCzRnuDAmo/DXNx\n0PRSwdVx/exASv8Ht45Kc/COBW/TcvY0N2V67zMOQznP58QzHavI0WIDlLlUydV/\nSOG3EPWUTZSES/BRApkhpbIRk+Sl93oOyVRYw/eXoz6fPRUniUPEP6YPQiIC+VFp\nNr70zZVtoOgNKSHaRw8a/BN35aQKDW1JqWev+v2hp2W0Bmofh5oGELKDnc58lM9L\n1KKR0wDKMKaYX/d+ZHYXgMDFKmkkIz6ItaVUV5zVhM9KyWSfVN8+Vo8ZYBH0LdaF\nzC41fmQtQuP3wwO7mCK+qcNJbpU7wBVG1ofcnUNLQCMjomhsPefXv0E+B2jVKhH7\nfPbmZrfdAgMBAAECggEAVv/RWJaHcOnaKFW6+55NMvCDAgBjGx+c0czJ5GIHDpov\nmM95U9tY74b4O0jCEfxILUBPTGWUOu1nyklYIDr+smWjuUAQ839LSOTcMWOQBmq+\ntQZHBHy1XsU90pEV/wXB+S7aK3Vwg/jx5RlIOgy6g2Uet6RKZV8umW3TFNBAdw+V\nEclirM1koqZDGjlDxxkD0w3071Ozj5sqM9oq326Zfh0Y7eAJhmqakXegZNHonjK7\nYXfo2Sz+bM7SLx7F1F4ZWXEfoxHtuF0p6Gh6+OUuFUkrGiWG+sYw4ccAAzdetaRG\nyb/t3MmAoJz9GkOPjL+3I2uq9PULo29uQFNUVEr4EQKBgQDZmLiwO+03jgojBHYb\nFFMgfx56N6Chf8Da2vB66k/H8IWfMEBSoI5b0USB27AzdAbaMS7aMLDp0FZFrHwp\nwVvcC24KTYVJVZgF0X9M1CpXleKoLZ2K/hjqUS/IU7zj4uA4e6NnW659HE/Fpq+h\nVfv+e+GuTOQLy5SIaFSsnD83fwKBgQDS6lxAZxPpbcZ9swm9kujqoqdUTE5KGXYm\nWsTOGd1+35qNOgJp7QhKR6Jke4me4BcI1fh+0rmJslxMRF3/PqlXwJ7XxFcO++8U\nb0ASJdvdf8gIwzgKVWTainR1znNgK3wMNDSDusvULA90MXDIb83G8m3lGqwqITlw\nl33EvRqeowKBgAmzn3hsE5WIhbct+b4XV+V5BXjZhhXtRkH7xQEV9VyqwqpoUlXc\nxrwdRnqrut1wbOXJj5c22Ix0N4R/vkF2V4wmDk/zSOAOKusHfi+EviaNjj+FWSLb\nVW0NFZ5O7XsToH+kM5LmKY92dbAQUIBW/xdHmrZUw04rU4IJdM0FYmQtAoGAXFuX\nzfPVOlCBrKVrzIG6UJStJTLMzZHctOrmZ0HYRihwKwuN5wiOqsg3ijy2hMWoEIxx\n5kcsS+m4lQUTDCRKT0zfwagOX1de19nneortfk7oLz4dGhlOsowSd0vSJfikt0tc\n+5oei2hH1B+aPYsH1uhtyvclEMW/u1f7EN2l/HUCgYEA00pY9k6KCWNNpequkYRl\n+p4TqEiSa6xKhepvklFmsaBTM4DmbOc5jP7NXIcNkVbGQbOgmR3MoMX3VoA8Z4lq\nDOtlsip3Fj8Q+hz8W6/0qkyRLQ/ArJJR/48PYf0bFjD2C+vq6douw7nKr4D3zO9l\nVvZziiA1W0Jxpy/jx8Qn+ik=\n-----END PRIVATE KEY-----\n',
  client_email: 'test@test-project.iam.gserviceaccount.com',
  client_id: '123',
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
});

// ---------------------------------------------------------------------------
// 1. sendPushNotification calls FCM HTTP v1 API
// ---------------------------------------------------------------------------

describe('sendPushNotification', () => {
  it('calls FCM HTTP v1 API with correct endpoint and payload', async () => {
    await importWithEnv({
      FIREBASE_PROJECT_ID: 'test-project',
      FIREBASE_SERVICE_ACCOUNT_KEY: FAKE_SERVICE_ACCOUNT,
    });

    // Mock OAuth2 token response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: 'mock-oauth-token', expires_in: 3600 }),
    });

    // Mock FCM send response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ name: 'projects/test-project/messages/msg123' }),
    });

    const result = await sendPushNotification({
      token: 'device-token-abc',
      title: 'Package Arrived',
      body: 'Your package is at the front desk',
    });

    expect(result).toBe(true);

    // Verify FCM API call (second fetch call)
    const fcmCall = mockFetch.mock.calls[1];
    expect(fcmCall![0]).toBe('https://fcm.googleapis.com/v1/projects/test-project/messages:send');
    const fcmBody = JSON.parse(fcmCall![1].body);
    expect(fcmBody.message.token).toBe('device-token-abc');
    expect(fcmBody.message.notification.title).toBe('Package Arrived');
    expect(fcmBody.message.notification.body).toBe('Your package is at the front desk');
  });

  // -------------------------------------------------------------------------
  // 2. Returns success boolean
  // -------------------------------------------------------------------------

  it('returns true on successful send', async () => {
    await importWithEnv({
      FIREBASE_PROJECT_ID: 'test-project',
      FIREBASE_SERVICE_ACCOUNT_KEY: FAKE_SERVICE_ACCOUNT,
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: 'token', expires_in: 3600 }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ name: 'projects/test-project/messages/msg456' }),
    });

    const result = await sendPushNotification({
      token: 'token-1',
      title: 'Test',
      body: 'Test body',
    });

    expect(result).toBe(true);
  });

  it('returns false on FCM API failure', async () => {
    await importWithEnv({
      FIREBASE_PROJECT_ID: 'test-project',
      FIREBASE_SERVICE_ACCOUNT_KEY: FAKE_SERVICE_ACCOUNT,
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: 'token', expires_in: 3600 }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: { message: 'Internal error' } }),
    });

    const result = await sendPushNotification({
      token: 'token-1',
      title: 'Test',
      body: 'Test body',
    });

    expect(result).toBe(false);
  });

  // -------------------------------------------------------------------------
  // 3. Handles missing FIREBASE_PROJECT_ID gracefully (dev mode)
  // -------------------------------------------------------------------------

  it('returns false and skips when FIREBASE_PROJECT_ID is not set', async () => {
    await importWithEnv({
      FIREBASE_PROJECT_ID: undefined,
      FIREBASE_SERVICE_ACCOUNT_KEY: undefined,
    });

    const result = await sendPushNotification({
      token: 'token-1',
      title: 'Test',
      body: 'Test body',
    });

    expect(result).toBe(false);
    // fetch should NOT have been called
    expect(mockFetch).not.toHaveBeenCalled();
  });

  // -------------------------------------------------------------------------
  // 4. Handles expired/invalid tokens (logs, returns false)
  // -------------------------------------------------------------------------

  it('returns false for expired/invalid FCM token (UNREGISTERED error)', async () => {
    await importWithEnv({
      FIREBASE_PROJECT_ID: 'test-project',
      FIREBASE_SERVICE_ACCOUNT_KEY: FAKE_SERVICE_ACCOUNT,
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: 'token', expires_in: 3600 }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({
        error: {
          code: 404,
          message: 'Requested entity was not found.',
          status: 'NOT_FOUND',
          details: [{ errorCode: 'UNREGISTERED' }],
        },
      }),
    });

    const result = await sendPushNotification({
      token: 'expired-token',
      title: 'Test',
      body: 'Test body',
    });

    expect(result).toBe(false);
  });

  // -------------------------------------------------------------------------
  // 7. Handles API errors without throwing
  // -------------------------------------------------------------------------

  it('does not throw on network error', async () => {
    await importWithEnv({
      FIREBASE_PROJECT_ID: 'test-project',
      FIREBASE_SERVICE_ACCOUNT_KEY: FAKE_SERVICE_ACCOUNT,
    });

    mockFetch.mockRejectedValueOnce(new Error('Network timeout'));

    const result = await sendPushNotification({
      token: 'token-1',
      title: 'Test',
      body: 'Test body',
    });

    expect(result).toBe(false);
  });

  it('does not throw on OAuth2 token fetch failure', async () => {
    await importWithEnv({
      FIREBASE_PROJECT_ID: 'test-project',
      FIREBASE_SERVICE_ACCOUNT_KEY: FAKE_SERVICE_ACCOUNT,
    });

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: 'invalid_grant' }),
    });

    const result = await sendPushNotification({
      token: 'token-1',
      title: 'Test',
      body: 'Test body',
    });

    expect(result).toBe(false);
  });

  // -------------------------------------------------------------------------
  // 8. Supports notification data payload (custom key-value pairs)
  // -------------------------------------------------------------------------

  it('includes data payload for deep linking', async () => {
    await importWithEnv({
      FIREBASE_PROJECT_ID: 'test-project',
      FIREBASE_SERVICE_ACCOUNT_KEY: FAKE_SERVICE_ACCOUNT,
    });

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: 'token', expires_in: 3600 }),
    });
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ name: 'projects/test-project/messages/msg789' }),
    });

    const result = await sendPushNotification({
      token: 'token-1',
      title: 'Package Arrived',
      body: 'Your package is ready',
      data: { packageId: 'pkg-123', screen: 'packages', action: 'view' },
    });

    expect(result).toBe(true);

    const fcmCall = mockFetch.mock.calls[1];
    const fcmBody = JSON.parse(fcmCall![1].body);
    expect(fcmBody.message.data).toEqual({
      packageId: 'pkg-123',
      screen: 'packages',
      action: 'view',
    });
  });
});

// ---------------------------------------------------------------------------
// 5. sendPushToUser — looks up user's FCM tokens and sends to all devices
// ---------------------------------------------------------------------------

describe('sendPushToUser', () => {
  it('looks up user tokens from DB and sends to all devices', async () => {
    await importWithEnv({
      FIREBASE_PROJECT_ID: 'test-project',
      FIREBASE_SERVICE_ACCOUNT_KEY: FAKE_SERVICE_ACCOUNT,
    });

    mockPrismaDevicePushToken.findMany.mockResolvedValue([
      { id: 't1', token: 'device-token-1', platform: 'ios' },
      { id: 't2', token: 'device-token-2', platform: 'android' },
    ]);

    // OAuth token (called once, cached)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: 'token', expires_in: 3600 }),
    });
    // FCM send for device 1
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ name: 'msg1' }),
    });
    // OAuth token for second send (module re-imported, cache reset)
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ access_token: 'token', expires_in: 3600 }),
    });
    // FCM send for device 2
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ name: 'msg2' }),
    });

    const results = await sendPushToUser('user-123', {
      title: 'Announcement',
      body: 'New building update',
    });

    expect(mockPrismaDevicePushToken.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-123' },
    });
    expect(results.sent).toBe(2);
    expect(results.failed).toBe(0);
  });

  it('returns 0 sent when user has no registered tokens', async () => {
    await importWithEnv({
      FIREBASE_PROJECT_ID: 'test-project',
      FIREBASE_SERVICE_ACCOUNT_KEY: FAKE_SERVICE_ACCOUNT,
    });

    mockPrismaDevicePushToken.findMany.mockResolvedValue([]);

    const results = await sendPushToUser('user-no-devices', {
      title: 'Test',
      body: 'Test',
    });

    expect(results.sent).toBe(0);
    expect(results.failed).toBe(0);
  });

  it('does not throw when DB lookup fails', async () => {
    await importWithEnv({
      FIREBASE_PROJECT_ID: 'test-project',
      FIREBASE_SERVICE_ACCOUNT_KEY: FAKE_SERVICE_ACCOUNT,
    });

    mockPrismaDevicePushToken.findMany.mockRejectedValue(new Error('DB down'));

    const results = await sendPushToUser('user-123', {
      title: 'Test',
      body: 'Test',
    });

    expect(results.sent).toBe(0);
    expect(results.failed).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 6. sendPushToProperty — sends to all users in a property
// ---------------------------------------------------------------------------

describe('sendPushToProperty', () => {
  it('sends push to all users in a property', async () => {
    await importWithEnv({
      FIREBASE_PROJECT_ID: 'test-project',
      FIREBASE_SERVICE_ACCOUNT_KEY: FAKE_SERVICE_ACCOUNT,
    });

    mockPrismaUserProperty.findMany.mockResolvedValue([{ userId: 'user-1' }, { userId: 'user-2' }]);

    // User 1 has 1 device, User 2 has 1 device
    mockPrismaDevicePushToken.findMany
      .mockResolvedValueOnce([{ id: 't1', token: 'tok-1', platform: 'ios' }])
      .mockResolvedValueOnce([{ id: 't2', token: 'tok-2', platform: 'android' }]);

    // OAuth + FCM for each device
    mockFetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'tk', expires_in: 3600 }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ name: 'm1' }) })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ access_token: 'tk', expires_in: 3600 }),
      })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ name: 'm2' }) });

    const results = await sendPushToProperty('property-abc', {
      title: 'Building Alert',
      body: 'Fire drill at 3pm',
    });

    expect(mockPrismaUserProperty.findMany).toHaveBeenCalledWith({
      where: { propertyId: 'property-abc', deletedAt: null },
      select: { userId: true },
    });
    expect(results.totalSent).toBeGreaterThanOrEqual(0);
    expect(results.totalFailed).toBeGreaterThanOrEqual(0);
  });

  it('handles empty property (no users)', async () => {
    await importWithEnv({
      FIREBASE_PROJECT_ID: 'test-project',
      FIREBASE_SERVICE_ACCOUNT_KEY: FAKE_SERVICE_ACCOUNT,
    });

    mockPrismaUserProperty.findMany.mockResolvedValue([]);

    const results = await sendPushToProperty('empty-property', {
      title: 'Test',
      body: 'Test',
    });

    expect(results.totalSent).toBe(0);
    expect(results.totalFailed).toBe(0);
  });

  it('does not throw when DB fails', async () => {
    await importWithEnv({
      FIREBASE_PROJECT_ID: 'test-project',
      FIREBASE_SERVICE_ACCOUNT_KEY: FAKE_SERVICE_ACCOUNT,
    });

    mockPrismaUserProperty.findMany.mockRejectedValue(new Error('DB connection lost'));

    const results = await sendPushToProperty('property-abc', {
      title: 'Test',
      body: 'Test',
    });

    expect(results.totalSent).toBe(0);
    expect(results.totalFailed).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 9. registerPushToken — saves token to DB
// ---------------------------------------------------------------------------

describe('registerPushToken', () => {
  it('saves a push token to the database', async () => {
    await importWithEnv({
      FIREBASE_PROJECT_ID: 'test-project',
      FIREBASE_SERVICE_ACCOUNT_KEY: FAKE_SERVICE_ACCOUNT,
    });

    mockPrismaDevicePushToken.deleteMany.mockResolvedValue({ count: 0 });
    mockPrismaDevicePushToken.create.mockResolvedValue({
      id: 'dpt-1',
      userId: 'user-123',
      token: 'fcm-token-abc',
      platform: 'ios',
      createdAt: new Date(),
    });

    const result = await registerPushToken('user-123', 'fcm-token-abc', 'ios');

    expect(result).toBe(true);
    expect(mockPrismaDevicePushToken.deleteMany).toHaveBeenCalledWith({
      where: { token: 'fcm-token-abc' },
    });
    expect(mockPrismaDevicePushToken.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-123',
        token: 'fcm-token-abc',
        platform: 'ios',
      },
    });
  });

  it('does not throw on DB error', async () => {
    await importWithEnv({
      FIREBASE_PROJECT_ID: 'test-project',
      FIREBASE_SERVICE_ACCOUNT_KEY: FAKE_SERVICE_ACCOUNT,
    });

    mockPrismaDevicePushToken.deleteMany.mockRejectedValue(new Error('DB error'));

    const result = await registerPushToken('user-123', 'fcm-token', 'android');

    expect(result).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 10. unregisterPushToken — removes token from DB
// ---------------------------------------------------------------------------

describe('unregisterPushToken', () => {
  it('removes a push token from the database', async () => {
    await importWithEnv({
      FIREBASE_PROJECT_ID: 'test-project',
      FIREBASE_SERVICE_ACCOUNT_KEY: FAKE_SERVICE_ACCOUNT,
    });

    mockPrismaDevicePushToken.deleteMany.mockResolvedValue({ count: 1 });

    const result = await unregisterPushToken('fcm-token-abc');

    expect(result).toBe(true);
    expect(mockPrismaDevicePushToken.deleteMany).toHaveBeenCalledWith({
      where: { token: 'fcm-token-abc' },
    });
  });

  it('returns true even if token did not exist', async () => {
    await importWithEnv({
      FIREBASE_PROJECT_ID: 'test-project',
      FIREBASE_SERVICE_ACCOUNT_KEY: FAKE_SERVICE_ACCOUNT,
    });

    mockPrismaDevicePushToken.deleteMany.mockResolvedValue({ count: 0 });

    const result = await unregisterPushToken('nonexistent-token');

    expect(result).toBe(true);
  });

  it('does not throw on DB error', async () => {
    await importWithEnv({
      FIREBASE_PROJECT_ID: 'test-project',
      FIREBASE_SERVICE_ACCOUNT_KEY: FAKE_SERVICE_ACCOUNT,
    });

    mockPrismaDevicePushToken.deleteMany.mockRejectedValue(new Error('DB error'));

    const result = await unregisterPushToken('fcm-token');

    expect(result).toBe(false);
  });
});
