/**
 * Notification Router Service Tests
 *
 * Validates routing logic, channel selection, quiet hours, DND mode,
 * emergency overrides, digest queueing, and delivery result aggregation.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  routeNotification,
  getEffectiveChannels,
  shouldSendNow,
  isEmergencyOverride,
  queueForDigest,
  isInQuietHours,
  getDigestQueue,
  clearDigestQueue,
  type Module,
  type NotificationPayload,
  type UserNotificationProfile,
  type Channel,
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
    userId: 'user-1',
    email: 'user@example.com',
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
    title: 'Test Notification',
    body: 'This is a test notification body.',
    module: 'packages',
    eventType: 'package.received',
    entityId: 'pkg-123',
    propertyId: 'prop-1',
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
// Emergency override detection
// ---------------------------------------------------------------------------

describe('Notification Router — Emergency Override', () => {
  it('identifies emergency module as override', () => {
    expect(isEmergencyOverride('emergency')).toBe(true);
  });

  it('does not treat packages as emergency', () => {
    expect(isEmergencyOverride('packages')).toBe(false);
  });

  it('does not treat security as emergency', () => {
    expect(isEmergencyOverride('security')).toBe(false);
  });

  it('does not treat system as emergency', () => {
    expect(isEmergencyOverride('system')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Quiet hours
// ---------------------------------------------------------------------------

describe('Notification Router — Quiet Hours', () => {
  it('returns false when quiet hours are not configured', () => {
    const profile = createProfile();
    expect(isInQuietHours(profile)).toBe(false);
  });

  it('detects quiet hours (overnight range, e.g. 22-7)', () => {
    const profile = createProfile({ quietHoursStart: 22, quietHoursEnd: 7 });
    // 23:00 UTC -> in quiet hours for UTC-based check
    const midnight = new Date('2026-03-19T05:00:00Z'); // midnight ET
    expect(isInQuietHours(profile, midnight)).toBe(true);
  });

  it('detects outside quiet hours (overnight range)', () => {
    const profile = createProfile({ quietHoursStart: 22, quietHoursEnd: 7 });
    // 14:00 ET (18:00 UTC)
    const afternoon = new Date('2026-03-19T18:00:00Z');
    expect(isInQuietHours(profile, afternoon)).toBe(false);
  });

  it('detects quiet hours (same-day range, e.g. 13-17)', () => {
    const profile = createProfile({
      quietHoursStart: 13,
      quietHoursEnd: 17,
      timezone: 'UTC',
    });
    const twopm = new Date('2026-03-19T14:00:00Z');
    expect(isInQuietHours(profile, twopm)).toBe(true);
  });

  it('detects outside same-day quiet hours', () => {
    const profile = createProfile({
      quietHoursStart: 13,
      quietHoursEnd: 17,
      timezone: 'UTC',
    });
    const morning = new Date('2026-03-19T10:00:00Z');
    expect(isInQuietHours(profile, morning)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// shouldSendNow
// ---------------------------------------------------------------------------

describe('Notification Router — shouldSendNow', () => {
  it('returns true when no restrictions', () => {
    const profile = createProfile();
    expect(shouldSendNow(profile)).toBe(true);
  });

  it('returns false when DND is enabled', () => {
    const profile = createProfile({ dndEnabled: true });
    expect(shouldSendNow(profile)).toBe(false);
  });

  it('returns false during quiet hours', () => {
    const profile = createProfile({
      quietHoursStart: 22,
      quietHoursEnd: 7,
    });
    const midnight = new Date('2026-03-19T05:00:00Z'); // midnight ET
    expect(shouldSendNow(profile, midnight)).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// getEffectiveChannels
// ---------------------------------------------------------------------------

describe('Notification Router — getEffectiveChannels', () => {
  it('returns email when only email is enabled globally', () => {
    const profile = createProfile();
    const channels = getEffectiveChannels(profile, 'packages');
    expect(channels).toEqual(['email']);
  });

  it('returns multiple channels when multiple are enabled', () => {
    const profile = createProfile({
      globalPreferences: { email: true, sms: true, push: true, in_app: false },
    });
    const channels = getEffectiveChannels(profile, 'packages');
    expect(channels).toEqual(['email', 'sms', 'push']);
  });

  it('uses module-specific preferences over global', () => {
    const profile = createProfile({
      globalPreferences: { email: true, sms: false, push: false, in_app: false },
      modulePreferences: {
        security: { email: true, sms: true, push: true, in_app: true },
      },
    });
    const channels = getEffectiveChannels(profile, 'security');
    expect(channels).toEqual(['email', 'sms', 'push', 'in_app']);
  });

  it('uses global preferences for modules without specific config', () => {
    const profile = createProfile({
      globalPreferences: { email: true, sms: false, push: true, in_app: false },
      modulePreferences: {
        security: { email: true, sms: true, push: true, in_app: true },
      },
    });
    const channels = getEffectiveChannels(profile, 'packages');
    expect(channels).toEqual(['email', 'push']);
  });

  it('falls back to module defaults when all global prefs are disabled and no module override', () => {
    const profile = createProfile({
      globalPreferences: { email: false, sms: false, push: false, in_app: false },
    });
    const channels = getEffectiveChannels(profile, 'security');
    expect(channels).toEqual(['email', 'sms', 'push', 'in_app']);
  });

  it('returns empty array when module override disables all channels', () => {
    const profile = createProfile({
      modulePreferences: {
        packages: { email: false, sms: false, push: false, in_app: false },
      },
    });
    const channels = getEffectiveChannels(profile, 'packages');
    expect(channels).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// Route to individual channels
// ---------------------------------------------------------------------------

describe('Notification Router — Single Channel Routing', () => {
  it('routes to email when email is enabled', async () => {
    const profile = createProfile({
      globalPreferences: { email: true, sms: false, push: false, in_app: false },
    });
    const result = await routeNotification(profile, createPayload());
    expect(result.channelResults).toHaveLength(1);
    expect(result.channelResults[0]!.channel).toBe('email');
    expect(result.channelResults[0]!.success).toBe(true);
  });

  it('routes to SMS when SMS is enabled', async () => {
    const profile = createProfile({
      globalPreferences: { email: false, sms: true, push: false, in_app: false },
    });
    const result = await routeNotification(profile, createPayload());
    expect(result.channelResults).toHaveLength(1);
    expect(result.channelResults[0]!.channel).toBe('sms');
    expect(result.channelResults[0]!.success).toBe(true);
  });

  it('routes to push when push is enabled', async () => {
    const profile = createProfile({
      globalPreferences: { email: false, sms: false, push: true, in_app: false },
    });
    const result = await routeNotification(profile, createPayload());
    expect(result.channelResults).toHaveLength(1);
    expect(result.channelResults[0]!.channel).toBe('push');
    expect(result.channelResults[0]!.success).toBe(true);
  });

  it('routes to in_app when in_app is enabled', async () => {
    const profile = createProfile({
      globalPreferences: { email: false, sms: false, push: false, in_app: true },
    });
    const result = await routeNotification(profile, createPayload());
    expect(result.channelResults).toHaveLength(1);
    expect(result.channelResults[0]!.channel).toBe('in_app');
    expect(result.channelResults[0]!.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Multi-channel routing
// ---------------------------------------------------------------------------

describe('Notification Router — Multi-Channel Routing', () => {
  it('routes to multiple channels simultaneously', async () => {
    const profile = createProfile({
      globalPreferences: { email: true, sms: true, push: true, in_app: true },
    });
    const result = await routeNotification(profile, createPayload());
    expect(result.channelResults).toHaveLength(4);

    const channels = result.channelResults.map((r) => r.channel).sort();
    expect(channels).toEqual(['email', 'in_app', 'push', 'sms']);
  });

  it('respects user preference — disabled channel not used', async () => {
    const profile = createProfile({
      globalPreferences: { email: true, sms: false, push: true, in_app: false },
    });
    const result = await routeNotification(profile, createPayload());
    expect(result.channelResults).toHaveLength(2);

    const channels = result.channelResults.map((r) => r.channel).sort();
    expect(channels).toEqual(['email', 'push']);
  });
});

// ---------------------------------------------------------------------------
// Emergency overrides
// ---------------------------------------------------------------------------

describe('Notification Router — Emergency Overrides', () => {
  it('emergency notifications bypass all preferences', async () => {
    const profile = createProfile({
      globalPreferences: { email: false, sms: false, push: false, in_app: false },
    });
    const payload = createPayload({ module: 'emergency' });
    const result = await routeNotification(profile, payload);

    // Emergency goes to ALL channels regardless of preferences
    expect(result.channelResults).toHaveLength(4);
    const channels = result.channelResults.map((r) => r.channel).sort();
    expect(channels).toEqual(['email', 'in_app', 'push', 'sms']);
  });

  it('emergency notifications bypass quiet hours', async () => {
    const profile = createProfile({
      quietHoursStart: 0,
      quietHoursEnd: 23, // quiet all day
      timezone: 'UTC',
    });
    const payload = createPayload({ module: 'emergency' });
    const result = await routeNotification(profile, payload, new Date('2026-03-19T12:00:00Z'));
    expect(result.channelResults.length).toBeGreaterThan(0);
  });

  it('emergency notifications bypass DND mode', async () => {
    const profile = createProfile({ dndEnabled: true });
    const payload = createPayload({ module: 'emergency' });
    const result = await routeNotification(profile, payload);
    expect(result.channelResults.length).toBeGreaterThan(0);
  });
});

// ---------------------------------------------------------------------------
// DND mode
// ---------------------------------------------------------------------------

describe('Notification Router — DND Mode', () => {
  it('DND mode blocks all non-emergency notifications', async () => {
    const profile = createProfile({ dndEnabled: true });
    const result = await routeNotification(profile, createPayload());
    expect(result.channelResults).toHaveLength(0);
  });

  it('DND mode blocks security notifications', async () => {
    const profile = createProfile({ dndEnabled: true });
    const payload = createPayload({ module: 'security' });
    const result = await routeNotification(profile, payload);
    expect(result.channelResults).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Quiet hours
// ---------------------------------------------------------------------------

describe('Notification Router — Quiet Hours Blocking', () => {
  it('quiet hours block non-emergency notifications', async () => {
    const profile = createProfile({
      quietHoursStart: 0,
      quietHoursEnd: 23,
      timezone: 'UTC',
    });
    const result = await routeNotification(
      profile,
      createPayload(),
      new Date('2026-03-19T12:00:00Z'),
    );
    expect(result.channelResults).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Digest mode
// ---------------------------------------------------------------------------

describe('Notification Router — Digest Mode', () => {
  it('queues for digest instead of immediate send', async () => {
    const profile = createProfile({ digestEnabled: true });
    const payload = createPayload();
    const result = await routeNotification(profile, payload);

    expect(result.channelResults).toHaveLength(0);
    expect(getDigestQueue()).toHaveLength(1);
    expect(getDigestQueue()[0]!.userId).toBe('user-1');
    expect(getDigestQueue()[0]!.payload.module).toBe('packages');
  });

  it('emergency bypasses digest mode', async () => {
    const profile = createProfile({ digestEnabled: true });
    const payload = createPayload({ module: 'emergency' });
    const result = await routeNotification(profile, payload);

    // Emergency should be sent immediately, not queued
    expect(result.channelResults.length).toBeGreaterThan(0);
    expect(getDigestQueue()).toHaveLength(0);
  });

  it('queueForDigest adds to the digest queue', () => {
    const payload = createPayload();
    queueForDigest('user-1', payload);
    expect(getDigestQueue()).toHaveLength(1);
    expect(getDigestQueue()[0]!.userId).toBe('user-1');
  });
});

// ---------------------------------------------------------------------------
// Module-specific routing
// ---------------------------------------------------------------------------

describe('Notification Router — Module-Specific Routing', () => {
  it('packages default to email+push when no preferences set', () => {
    const profile = createProfile({
      globalPreferences: { email: false, sms: false, push: false, in_app: false },
    });
    const channels = getEffectiveChannels(profile, 'packages');
    expect(channels).toContain('email');
    expect(channels).toContain('push');
    expect(channels).not.toContain('sms');
  });

  it('security defaults to all channels when no preferences set', () => {
    const profile = createProfile({
      globalPreferences: { email: false, sms: false, push: false, in_app: false },
    });
    const channels = getEffectiveChannels(profile, 'security');
    expect(channels).toEqual(['email', 'sms', 'push', 'in_app']);
  });

  it('community defaults to in_app only when no preferences set', () => {
    const profile = createProfile({
      globalPreferences: { email: false, sms: false, push: false, in_app: false },
    });
    const channels = getEffectiveChannels(profile, 'community');
    expect(channels).toEqual(['in_app']);
  });

  it('system defaults to email only when no preferences set', () => {
    const profile = createProfile({
      globalPreferences: { email: false, sms: false, push: false, in_app: false },
    });
    const channels = getEffectiveChannels(profile, 'system');
    expect(channels).toEqual(['email']);
  });
});

// ---------------------------------------------------------------------------
// Failed delivery handling
// ---------------------------------------------------------------------------

describe('Notification Router — Failed Delivery Handling', () => {
  it('failed delivery on one channel does not block others', async () => {
    const { sendEmail } = await import('@/server/email');
    const { sendPushToUser } = await import('@/server/push');

    // Email fails, push succeeds
    vi.mocked(sendEmail).mockRejectedValueOnce(new Error('Email service down'));
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

  it('SMS fails gracefully when no phone number on file', async () => {
    const profile = createProfile({
      phone: undefined,
      globalPreferences: { email: false, sms: true, push: false, in_app: false },
    });
    const result = await routeNotification(profile, createPayload());

    expect(result.channelResults).toHaveLength(1);
    expect(result.channelResults[0]!.channel).toBe('sms');
    expect(result.channelResults[0]!.success).toBe(false);
    expect(result.channelResults[0]!.error).toContain('No phone number');
  });
});

// ---------------------------------------------------------------------------
// Delivery result aggregation
// ---------------------------------------------------------------------------

describe('Notification Router — Delivery Result Aggregation', () => {
  it('aggregates results from all channels', async () => {
    const profile = createProfile({
      globalPreferences: { email: true, sms: true, push: true, in_app: true },
    });
    const result = await routeNotification(profile, createPayload());

    expect(result.channelResults).toHaveLength(4);
    for (const channelResult of result.channelResults) {
      expect(channelResult).toHaveProperty('channel');
      expect(channelResult).toHaveProperty('success');
    }
  });

  it('returns empty channelResults when no channels are active', async () => {
    const profile = createProfile({
      modulePreferences: {
        packages: { email: false, sms: false, push: false, in_app: false },
      },
    });
    const result = await routeNotification(profile, createPayload());
    expect(result.channelResults).toHaveLength(0);
  });

  it('includes messageId on successful deliveries', async () => {
    const profile = createProfile({
      globalPreferences: { email: true, sms: false, push: false, in_app: false },
    });
    const result = await routeNotification(profile, createPayload());
    expect(result.channelResults[0]!.messageId).toBe('mock-email-id');
  });

  it('includes error message on failed deliveries', async () => {
    const { sendEmail } = await import('@/server/email');
    vi.mocked(sendEmail).mockRejectedValueOnce(new Error('SMTP timeout'));

    const profile = createProfile({
      globalPreferences: { email: true, sms: false, push: false, in_app: false },
    });
    const result = await routeNotification(profile, createPayload());
    expect(result.channelResults[0]!.success).toBe(false);
    expect(result.channelResults[0]!.error).toBe('SMTP timeout');
  });
});

// ---------------------------------------------------------------------------
// Module type validation
// ---------------------------------------------------------------------------

describe('Notification Router — Module Types', () => {
  const allModules: Module[] = [
    'packages',
    'maintenance',
    'security',
    'amenities',
    'announcements',
    'parking',
    'events',
    'training',
    'community',
    'governance',
    'emergency',
    'system',
  ];

  it('all 12 module types are defined', () => {
    expect(allModules).toHaveLength(12);
  });

  it.each(allModules)('getEffectiveChannels handles module "%s"', (module) => {
    const profile = createProfile();
    const channels = getEffectiveChannels(profile, module);
    expect(Array.isArray(channels)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('Notification Router — Edge Cases', () => {
  it('handles multiple digest queues for same user', () => {
    const payload1 = createPayload({ eventType: 'package.received', entityId: 'pkg-1' });
    const payload2 = createPayload({ eventType: 'package.released', entityId: 'pkg-2' });

    queueForDigest('user-1', payload1);
    queueForDigest('user-1', payload2);

    expect(getDigestQueue()).toHaveLength(2);
  });

  it('clearDigestQueue empties the queue', () => {
    queueForDigest('user-1', createPayload());
    expect(getDigestQueue()).toHaveLength(1);

    clearDigestQueue();
    expect(getDigestQueue()).toHaveLength(0);
  });

  it('in_app delivery always succeeds', async () => {
    const profile = createProfile({
      globalPreferences: { email: false, sms: false, push: false, in_app: true },
    });
    const result = await routeNotification(profile, createPayload());
    expect(result.channelResults[0]!.channel).toBe('in_app');
    expect(result.channelResults[0]!.success).toBe(true);
  });

  it('notification payload metadata is optional', async () => {
    const profile = createProfile();
    const payload = createPayload({ metadata: undefined });
    const result = await routeNotification(profile, payload);
    expect(result.channelResults.length).toBeGreaterThan(0);
  });

  it('notification payload with metadata passes through', async () => {
    const profile = createProfile();
    const payload = createPayload({
      metadata: { courier: 'FedEx', trackingNumber: '1234567890' },
    });
    const result = await routeNotification(profile, payload);
    expect(result.channelResults.length).toBeGreaterThan(0);
  });
});
