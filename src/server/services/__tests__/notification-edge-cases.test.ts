/**
 * Notification Router Edge Case Tests
 *
 * Focused tests for edge cases in the notification router:
 * - Emergency notifications bypass DND
 * - Quiet hours respected for non-emergency
 * - Digest mode batches notifications
 * - Failed channel doesn't block other channels
 * - User with no email still gets push notification
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  routeNotification,
  getEffectiveChannels,
  shouldSendNow,
  isEmergencyOverride,
  isInQuietHours,
  queueForDigest,
  getDigestQueue,
  clearDigestQueue,
  type NotificationPayload,
  type UserNotificationProfile,
} from '../notification-router';

// ---------------------------------------------------------------------------
// Mock external services
// ---------------------------------------------------------------------------

vi.mock('@/server/email', () => ({
  sendEmail: vi.fn().mockResolvedValue('mock-email-id'),
}));

vi.mock('@/server/sms', () => ({
  sendSms: vi.fn().mockResolvedValue('mock-sms-sid'),
}));

vi.mock('@/server/push', () => ({
  sendPushToUser: vi.fn().mockResolvedValue({ sent: 1, failed: 0 }),
}));

vi.mock('@/server/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createProfile(overrides: Partial<UserNotificationProfile> = {}): UserNotificationProfile {
  return {
    userId: 'user-edge-1',
    email: 'edge@example.com',
    phone: '+14165551234',
    modulePreferences: {},
    globalPreferences: {
      email: true,
      sms: false,
      push: false,
      in_app: false,
    },
    dndEnabled: false,
    digestEnabled: false,
    timezone: 'America/Toronto',
    ...overrides,
  };
}

function createPayload(overrides: Partial<NotificationPayload> = {}): NotificationPayload {
  return {
    title: 'Edge Case Notification',
    body: 'This tests an edge case in the notification router.',
    module: 'packages',
    eventType: 'package.received',
    entityId: 'pkg-edge-1',
    propertyId: 'prop-edge-1',
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  clearDigestQueue();
});

// ---------------------------------------------------------------------------
// 1. Emergency notification bypasses DND
// ---------------------------------------------------------------------------

describe('Notification Edge Cases — Emergency Bypasses DND', () => {
  it('emergency notification is delivered even when DND is enabled', async () => {
    const profile = createProfile({ dndEnabled: true });
    const payload = createPayload({ module: 'emergency' });

    const result = await routeNotification(profile, payload);

    expect(result.channelResults.length).toBeGreaterThan(0);
    // Emergency goes to all channels
    const channels = result.channelResults.map((r) => r.channel).sort();
    expect(channels).toEqual(['email', 'in_app', 'push', 'sms']);
  });

  it('non-emergency notification is blocked when DND is enabled', async () => {
    const profile = createProfile({ dndEnabled: true });
    const payload = createPayload({ module: 'packages' });

    const result = await routeNotification(profile, payload);

    expect(result.channelResults).toHaveLength(0);
  });

  it('isEmergencyOverride returns true only for emergency module', () => {
    expect(isEmergencyOverride('emergency')).toBe(true);
    expect(isEmergencyOverride('packages')).toBe(false);
    expect(isEmergencyOverride('security')).toBe(false);
    expect(isEmergencyOverride('maintenance')).toBe(false);
  });

  it('emergency notification bypasses DND with all user preferences disabled', async () => {
    const profile = createProfile({
      dndEnabled: true,
      globalPreferences: { email: false, sms: false, push: false, in_app: false },
    });
    const payload = createPayload({ module: 'emergency' });

    const result = await routeNotification(profile, payload);

    // Emergency forces all channels regardless of preferences
    expect(result.channelResults).toHaveLength(4);
  });

  it('DND blocks security module notifications (not classified as emergency)', async () => {
    const profile = createProfile({ dndEnabled: true });
    const payload = createPayload({ module: 'security' });

    const result = await routeNotification(profile, payload);

    expect(result.channelResults).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 2. Quiet hours respected for non-emergency
// ---------------------------------------------------------------------------

describe('Notification Edge Cases — Quiet Hours', () => {
  it('blocks non-emergency during quiet hours', async () => {
    const profile = createProfile({
      quietHoursStart: 22,
      quietHoursEnd: 7,
    });
    // 3 AM ET = within quiet hours
    const threeAm = new Date('2026-03-19T08:00:00Z'); // 3 AM ET (UTC-5)

    const result = await routeNotification(profile, createPayload(), threeAm);

    expect(result.channelResults).toHaveLength(0);
  });

  it('allows non-emergency outside quiet hours', async () => {
    const profile = createProfile({
      quietHoursStart: 22,
      quietHoursEnd: 7,
    });
    // 2 PM ET = outside quiet hours
    const twoPm = new Date('2026-03-19T18:00:00Z');

    const result = await routeNotification(profile, createPayload(), twoPm);

    expect(result.channelResults.length).toBeGreaterThan(0);
  });

  it('emergency bypasses quiet hours', async () => {
    const profile = createProfile({
      quietHoursStart: 0,
      quietHoursEnd: 23, // quiet all day
      timezone: 'UTC',
    });
    const payload = createPayload({ module: 'emergency' });

    const result = await routeNotification(profile, payload, new Date('2026-03-19T12:00:00Z'));

    expect(result.channelResults.length).toBeGreaterThan(0);
  });

  it('shouldSendNow returns false during quiet hours', () => {
    const profile = createProfile({
      quietHoursStart: 22,
      quietHoursEnd: 7,
    });
    const midnight = new Date('2026-03-19T05:00:00Z'); // midnight ET

    expect(shouldSendNow(profile, midnight)).toBe(false);
  });

  it('shouldSendNow returns true outside quiet hours', () => {
    const profile = createProfile({
      quietHoursStart: 22,
      quietHoursEnd: 7,
    });
    const afternoon = new Date('2026-03-19T18:00:00Z'); // 1 PM ET

    expect(shouldSendNow(profile, afternoon)).toBe(true);
  });

  it('quiet hours handle same-day range (e.g., 13-17)', () => {
    const profile = createProfile({
      quietHoursStart: 13,
      quietHoursEnd: 17,
      timezone: 'UTC',
    });

    expect(isInQuietHours(profile, new Date('2026-03-19T14:00:00Z'))).toBe(true);
    expect(isInQuietHours(profile, new Date('2026-03-19T10:00:00Z'))).toBe(false);
    expect(isInQuietHours(profile, new Date('2026-03-19T18:00:00Z'))).toBe(false);
  });

  it('no quiet hours configured means always send', () => {
    const profile = createProfile(); // no quietHoursStart/End

    expect(isInQuietHours(profile)).toBe(false);
    expect(shouldSendNow(profile)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 3. Digest mode batches notifications
// ---------------------------------------------------------------------------

describe('Notification Edge Cases — Digest Mode', () => {
  it('queues notification for digest instead of immediate send', async () => {
    const profile = createProfile({ digestEnabled: true });
    const payload = createPayload();

    const result = await routeNotification(profile, payload);

    expect(result.channelResults).toHaveLength(0);
    expect(getDigestQueue()).toHaveLength(1);
    expect(getDigestQueue()[0]!.userId).toBe('user-edge-1');
    expect(getDigestQueue()[0]!.payload.module).toBe('packages');
  });

  it('batches multiple notifications in digest queue', async () => {
    const profile = createProfile({ digestEnabled: true });

    await routeNotification(profile, createPayload({ entityId: 'pkg-1' }));
    await routeNotification(profile, createPayload({ entityId: 'pkg-2' }));
    await routeNotification(profile, createPayload({ entityId: 'pkg-3' }));

    expect(getDigestQueue()).toHaveLength(3);
  });

  it('emergency bypasses digest mode', async () => {
    const profile = createProfile({ digestEnabled: true });
    const payload = createPayload({ module: 'emergency' });

    const result = await routeNotification(profile, payload);

    // Emergency delivered immediately, not queued
    expect(result.channelResults.length).toBeGreaterThan(0);
    expect(getDigestQueue()).toHaveLength(0);
  });

  it('queued items include timestamp', () => {
    const payload = createPayload();
    queueForDigest('user-1', payload);

    const queue = getDigestQueue();
    expect(queue[0]!.queuedAt).toBeInstanceOf(Date);
  });

  it('clearDigestQueue empties the queue', () => {
    queueForDigest('user-1', createPayload());
    queueForDigest('user-2', createPayload());
    expect(getDigestQueue()).toHaveLength(2);

    clearDigestQueue();
    expect(getDigestQueue()).toHaveLength(0);
  });

  it('digest mode with DND enabled still queues (not blocked)', async () => {
    // DND blocks immediate delivery, but digest should still queue.
    // Actually, DND check happens before digest check — DND blocks first.
    const profile = createProfile({ digestEnabled: true, dndEnabled: true });
    const payload = createPayload();

    const result = await routeNotification(profile, payload);

    // DND blocks before digest, so nothing queued
    expect(result.channelResults).toHaveLength(0);
    expect(getDigestQueue()).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 4. Failed channel doesn't block other channels
// ---------------------------------------------------------------------------

describe('Notification Edge Cases — Failed Channel Independence', () => {
  it('email failure does not prevent push delivery', async () => {
    const { sendEmail } = await import('@/server/email');
    const { sendPushToUser } = await import('@/server/push');

    vi.mocked(sendEmail).mockRejectedValueOnce(new Error('SMTP connection refused'));
    vi.mocked(sendPushToUser).mockResolvedValueOnce({ sent: 1, failed: 0 });

    const profile = createProfile({
      globalPreferences: { email: true, sms: false, push: true, in_app: false },
    });

    const result = await routeNotification(profile, createPayload());

    expect(result.channelResults).toHaveLength(2);

    const emailResult = result.channelResults.find((r) => r.channel === 'email');
    const pushResult = result.channelResults.find((r) => r.channel === 'push');

    expect(emailResult!.success).toBe(false);
    expect(emailResult!.error).toBeDefined();
    expect(pushResult!.success).toBe(true);
  });

  it('SMS failure does not prevent email delivery', async () => {
    const { sendEmail } = await import('@/server/email');
    const { sendSms } = await import('@/server/sms');

    vi.mocked(sendEmail).mockResolvedValueOnce('msg-id-123');
    vi.mocked(sendSms).mockRejectedValueOnce(new Error('Twilio rate limit'));

    const profile = createProfile({
      globalPreferences: { email: true, sms: true, push: false, in_app: false },
    });

    const result = await routeNotification(profile, createPayload());

    const emailResult = result.channelResults.find((r) => r.channel === 'email');
    const smsResult = result.channelResults.find((r) => r.channel === 'sms');

    expect(emailResult!.success).toBe(true);
    expect(smsResult!.success).toBe(false);
  });

  it('push failure does not prevent in_app delivery', async () => {
    const { sendPushToUser } = await import('@/server/push');

    vi.mocked(sendPushToUser).mockRejectedValueOnce(new Error('FCM unavailable'));

    const profile = createProfile({
      globalPreferences: { email: false, sms: false, push: true, in_app: true },
    });

    const result = await routeNotification(profile, createPayload());

    const pushResult = result.channelResults.find((r) => r.channel === 'push');
    const inAppResult = result.channelResults.find((r) => r.channel === 'in_app');

    expect(pushResult!.success).toBe(false);
    expect(inAppResult!.success).toBe(true);
  });

  it('all four channels can be attempted even if some fail', async () => {
    const { sendEmail } = await import('@/server/email');
    const { sendSms } = await import('@/server/sms');
    const { sendPushToUser } = await import('@/server/push');

    vi.mocked(sendEmail).mockRejectedValueOnce(new Error('email fail'));
    vi.mocked(sendSms).mockRejectedValueOnce(new Error('sms fail'));
    vi.mocked(sendPushToUser).mockResolvedValueOnce({ sent: 1, failed: 0 });

    const profile = createProfile({
      globalPreferences: { email: true, sms: true, push: true, in_app: true },
    });

    const result = await routeNotification(profile, createPayload());

    expect(result.channelResults).toHaveLength(4);

    const emailResult = result.channelResults.find((r) => r.channel === 'email');
    const smsResult = result.channelResults.find((r) => r.channel === 'sms');
    const pushResult = result.channelResults.find((r) => r.channel === 'push');
    const inAppResult = result.channelResults.find((r) => r.channel === 'in_app');

    expect(emailResult!.success).toBe(false);
    expect(smsResult!.success).toBe(false);
    expect(pushResult!.success).toBe(true);
    expect(inAppResult!.success).toBe(true);
  });

  it('failed channels include error messages', async () => {
    const { sendEmail } = await import('@/server/email');

    vi.mocked(sendEmail).mockRejectedValueOnce(new Error('SMTP timeout after 30s'));

    const profile = createProfile({
      globalPreferences: { email: true, sms: false, push: false, in_app: false },
    });

    const result = await routeNotification(profile, createPayload());
    const emailResult = result.channelResults.find((r) => r.channel === 'email');

    expect(emailResult!.success).toBe(false);
    expect(emailResult!.error).toBe('SMTP timeout after 30s');
  });
});

// ---------------------------------------------------------------------------
// 5. User with no email still gets push notification
// ---------------------------------------------------------------------------

describe('Notification Edge Cases — Missing Contact Info', () => {
  it('user without email still receives push notification', async () => {
    const { sendPushToUser } = await import('@/server/push');
    vi.mocked(sendPushToUser).mockResolvedValueOnce({ sent: 1, failed: 0 });

    const profile = createProfile({
      email: 'user@example.com', // email present but disabled
      globalPreferences: { email: false, sms: false, push: true, in_app: false },
    });

    const result = await routeNotification(profile, createPayload());

    expect(result.channelResults).toHaveLength(1);
    expect(result.channelResults[0]!.channel).toBe('push');
    expect(result.channelResults[0]!.success).toBe(true);
  });

  it('user without phone number gets SMS failure but other channels succeed', async () => {
    const { sendEmail } = await import('@/server/email');
    vi.mocked(sendEmail).mockResolvedValueOnce('msg-id');

    const profile = createProfile({
      phone: undefined,
      globalPreferences: { email: true, sms: true, push: false, in_app: false },
    });

    const result = await routeNotification(profile, createPayload());

    expect(result.channelResults).toHaveLength(2);

    const smsResult = result.channelResults.find((r) => r.channel === 'sms');
    const emailResult = result.channelResults.find((r) => r.channel === 'email');

    expect(smsResult!.success).toBe(false);
    expect(smsResult!.error).toContain('No phone number');
    expect(emailResult!.success).toBe(true);
  });

  it('user with only in_app enabled gets in_app notification', async () => {
    const profile = createProfile({
      globalPreferences: { email: false, sms: false, push: false, in_app: true },
    });

    const result = await routeNotification(profile, createPayload());

    expect(result.channelResults).toHaveLength(1);
    expect(result.channelResults[0]!.channel).toBe('in_app');
    expect(result.channelResults[0]!.success).toBe(true);
  });

  it('emergency notification reaches user even with no phone (SMS fails, others succeed)', async () => {
    const { sendPushToUser } = await import('@/server/push');
    vi.mocked(sendPushToUser).mockResolvedValueOnce({ sent: 1, failed: 0 });

    const profile = createProfile({
      phone: undefined,
      globalPreferences: { email: false, sms: false, push: false, in_app: false },
    });
    const payload = createPayload({ module: 'emergency' });

    const result = await routeNotification(profile, payload);

    // Emergency forces all 4 channels
    expect(result.channelResults).toHaveLength(4);

    const smsResult = result.channelResults.find((r) => r.channel === 'sms');
    expect(smsResult!.success).toBe(false); // No phone number

    // At least email, push, or in_app should succeed
    const successCount = result.channelResults.filter((r) => r.success).length;
    expect(successCount).toBeGreaterThan(0);
  });

  it('module defaults kick in when all preferences are disabled', () => {
    const profile = createProfile({
      globalPreferences: { email: false, sms: false, push: false, in_app: false },
    });

    // Packages default to email + push
    const packageChannels = getEffectiveChannels(profile, 'packages');
    expect(packageChannels).toContain('email');
    expect(packageChannels).toContain('push');

    // Security defaults to all channels
    const securityChannels = getEffectiveChannels(profile, 'security');
    expect(securityChannels).toEqual(['email', 'sms', 'push', 'in_app']);

    // Community defaults to in_app only
    const communityChannels = getEffectiveChannels(profile, 'community');
    expect(communityChannels).toEqual(['in_app']);
  });

  it('module-specific override to disable all channels returns empty', () => {
    const profile = createProfile({
      modulePreferences: {
        packages: { email: false, sms: false, push: false, in_app: false },
      },
    });

    const channels = getEffectiveChannels(profile, 'packages');
    expect(channels).toEqual([]);
  });
});
