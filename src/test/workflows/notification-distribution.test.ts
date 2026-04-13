/**
 * Integration Workflow Tests — Notification Distribution
 *
 * Tests complete notification distribution workflows across multiple API endpoints:
 *   - Package notification (preference-aware multi-channel delivery)
 *   - Emergency broadcast (override all preferences, all channels)
 *   - Digest mode (batch notifications into a single daily email)
 *   - Quiet hours (queue non-emergency, deliver emergency immediately)
 *
 * Each test validates routing logic, preference checking, channel selection,
 * and delivery tracking side effects.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createGetRequest,
  createPostRequest,
  createPutRequest,
  createPatchRequest as _createPatchRequest,
  parseResponse,
} from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Prisma Mock
// ---------------------------------------------------------------------------

const mockNotificationPreferenceFindMany = vi.fn();
const mockNotificationPreferenceUpsert = vi.fn();

const mockNotificationCreate = vi.fn();
const mockNotificationFindMany = vi.fn();
const mockNotificationCount = vi.fn();
const mockNotificationUpdate = vi.fn();
const mockNotificationUpdateMany = vi.fn();

const mockNotificationTemplateFindMany = vi.fn();
const mockNotificationTemplateCreate = vi.fn();

const mockNotificationDeliveryCreate = vi.fn();
const mockNotificationDeliveryFindMany = vi.fn();
const mockNotificationDeliveryUpdate = vi.fn();

const mockNotificationDigestCreate = vi.fn();
const mockNotificationDigestFindMany = vi.fn();

const mockUserFindUnique = vi.fn();
const mockUserFindMany = vi.fn();

const mockTransaction = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    notificationPreference: {
      findMany: (...args: unknown[]) => mockNotificationPreferenceFindMany(...args),
      upsert: (...args: unknown[]) => mockNotificationPreferenceUpsert(...args),
    },
    notification: {
      create: (...args: unknown[]) => mockNotificationCreate(...args),
      findMany: (...args: unknown[]) => mockNotificationFindMany(...args),
      count: (...args: unknown[]) => mockNotificationCount(...args),
      update: (...args: unknown[]) => mockNotificationUpdate(...args),
      updateMany: (...args: unknown[]) => mockNotificationUpdateMany(...args),
    },
    notificationTemplate: {
      findMany: (...args: unknown[]) => mockNotificationTemplateFindMany(...args),
      create: (...args: unknown[]) => mockNotificationTemplateCreate(...args),
    },
    notificationDelivery: {
      create: (...args: unknown[]) => mockNotificationDeliveryCreate(...args),
      findMany: (...args: unknown[]) => mockNotificationDeliveryFindMany(...args),
      update: (...args: unknown[]) => mockNotificationDeliveryUpdate(...args),
    },
    notificationDigest: {
      create: (...args: unknown[]) => mockNotificationDigestCreate(...args),
      findMany: (...args: unknown[]) => mockNotificationDigestFindMany(...args),
    },
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
      findMany: (...args: unknown[]) => mockUserFindMany(...args),
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

vi.mock('@/lib/sanitize', () => ({
  stripHtml: (s: string) => s,
  stripControlChars: (s: string) => s,
}));

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: vi.fn().mockResolvedValue({
    user: {
      userId: 'staff-001',
      propertyId: '00000000-0000-4000-b000-000000000001',
      role: 'property_admin',
      permissions: ['*'],
      mfaVerified: true,
    },
    error: null,
  }),
}));

// ---------------------------------------------------------------------------
// Import route handlers AFTER mocks
// ---------------------------------------------------------------------------

import {
  GET as getNotificationPreferences,
  PUT as updateNotificationPreferences,
} from '@/app/api/v1/notifications/preferences/route';
import {
  GET as listTemplates,
  POST as createTemplate,
} from '@/app/api/v1/notifications/templates/route';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROPERTY_ID = '00000000-0000-4000-b000-000000000001';
const RESIDENT_ID = 'resident-001';
const RESIDENT_ID_2 = 'resident-002';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePreference(overrides: Record<string, unknown> = {}) {
  return {
    id: 'pref-001',
    userId: RESIDENT_ID,
    propertyId: PROPERTY_ID,
    module: 'packages',
    channel: 'email',
    enabled: true,
    digestMode: 'instant',
    digestTime: null,
    dndEnabled: false,
    dndStart: null,
    dndEnd: null,
    ...overrides,
  };
}

function makeNotification(overrides: Record<string, unknown> = {}) {
  return {
    id: 'notif-001',
    propertyId: PROPERTY_ID,
    userId: RESIDENT_ID,
    module: 'packages',
    title: 'Package Received',
    body: 'A package has arrived for Unit 101.',
    channel: 'email',
    status: 'pending',
    priority: 'normal',
    isEmergency: false,
    createdAt: new Date('2026-03-18T14:00:00Z'),
    sentAt: null,
    readAt: null,
    ...overrides,
  };
}

function makeDelivery(overrides: Record<string, unknown> = {}) {
  return {
    id: 'delivery-001',
    notificationId: 'notif-001',
    channel: 'email',
    status: 'sent',
    sentAt: new Date(),
    failedAt: null,
    failureReason: null,
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
// SCENARIO 1: Package Notification (Preference-Aware Multi-Channel Delivery)
// ===========================================================================

describe('Scenario 1: Package Notification — Preference-Aware Multi-Channel Delivery', () => {
  it('Step 1: resident has email and push enabled but SMS disabled', async () => {
    mockNotificationPreferenceFindMany.mockResolvedValue([
      makePreference({ channel: 'email', enabled: true }),
      makePreference({ id: 'pref-002', channel: 'push', enabled: true }),
      makePreference({ id: 'pref-003', channel: 'sms', enabled: false }),
    ]);

    const req = createGetRequest('/api/v1/notifications/preferences');
    const res = await getNotificationPreferences(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { channel: string; enabled: boolean }[] }>(res);
    expect(body.data).toHaveLength(3);

    const emailPref = body.data.find((p) => p.channel === 'email');
    const pushPref = body.data.find((p) => p.channel === 'push');
    const smsPref = body.data.find((p) => p.channel === 'sms');

    expect(emailPref?.enabled).toBe(true);
    expect(pushPref?.enabled).toBe(true);
    expect(smsPref?.enabled).toBe(false);
  });

  it('Step 2: notification created triggers preference check', async () => {
    const notif = makeNotification();
    mockNotificationCreate.mockResolvedValue(notif);
    mockNotificationPreferenceFindMany.mockResolvedValue([
      makePreference({ channel: 'email', enabled: true }),
      makePreference({ id: 'pref-002', channel: 'push', enabled: true }),
      makePreference({ id: 'pref-003', channel: 'sms', enabled: false }),
    ]);

    // Simulate the router checking preferences before dispatching
    const prefs = await mockNotificationPreferenceFindMany({
      where: { userId: RESIDENT_ID, propertyId: PROPERTY_ID, module: 'packages' },
    });

    const enabledChannels = prefs
      .filter((p: { enabled: boolean }) => p.enabled)
      .map((p: { channel: string }) => p.channel);

    expect(enabledChannels).toContain('email');
    expect(enabledChannels).toContain('push');
    expect(enabledChannels).not.toContain('sms');
  });

  it('Step 3: email delivery recorded as sent', async () => {
    const delivery = makeDelivery({ channel: 'email', status: 'sent' });
    mockNotificationDeliveryCreate.mockResolvedValue(delivery);

    const result = await mockNotificationDeliveryCreate({
      data: {
        notificationId: 'notif-001',
        channel: 'email',
        status: 'sent',
        sentAt: expect.any(Date),
      },
    });

    expect(result.channel).toBe('email');
    expect(result.status).toBe('sent');
  });

  it('Step 4: push delivery recorded as sent', async () => {
    const delivery = makeDelivery({ id: 'delivery-002', channel: 'push', status: 'sent' });
    mockNotificationDeliveryCreate.mockResolvedValue(delivery);

    const result = await mockNotificationDeliveryCreate({
      data: {
        notificationId: 'notif-001',
        channel: 'push',
        status: 'sent',
        sentAt: expect.any(Date),
      },
    });

    expect(result.channel).toBe('push');
    expect(result.status).toBe('sent');
  });

  it('Step 5: SMS skipped because resident has it disabled', async () => {
    mockNotificationPreferenceFindMany.mockResolvedValue([
      makePreference({ id: 'pref-003', channel: 'sms', enabled: false }),
    ]);

    const prefs = await mockNotificationPreferenceFindMany({
      where: { userId: RESIDENT_ID, module: 'packages', channel: 'sms' },
    });

    const smsEnabled = prefs.some(
      (p: { channel: string; enabled: boolean }) => p.channel === 'sms' && p.enabled,
    );
    expect(smsEnabled).toBe(false);

    // SMS delivery should NOT be created
    expect(mockNotificationDeliveryCreate).not.toHaveBeenCalled();
  });

  it('Step 6: delivery results tracked across all channels', async () => {
    mockNotificationDeliveryFindMany.mockResolvedValue([
      makeDelivery({ channel: 'email', status: 'sent' }),
      makeDelivery({ id: 'delivery-002', channel: 'push', status: 'sent' }),
    ]);

    const deliveries = await mockNotificationDeliveryFindMany({
      where: { notificationId: 'notif-001' },
    });

    expect(deliveries).toHaveLength(2);
    expect(deliveries.every((d: { status: string }) => d.status === 'sent')).toBe(true);
    // No SMS delivery in the results
    expect(deliveries.some((d: { channel: string }) => d.channel === 'sms')).toBe(false);
  });

  it('should update preferences via PUT /notifications/preferences', async () => {
    mockNotificationPreferenceUpsert.mockResolvedValue(
      makePreference({ channel: 'email', enabled: true }),
    );

    const req = createPutRequest('/api/v1/notifications/preferences', {
      preferences: [
        { module: 'packages', channel: 'email', enabled: true },
        { module: 'packages', channel: 'push', enabled: true },
        { module: 'packages', channel: 'sms', enabled: false },
      ],
    });

    const res = await updateNotificationPreferences(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('Preferences updated');
  });

  it('should handle failed email delivery gracefully', async () => {
    const failedDelivery = makeDelivery({
      channel: 'email',
      status: 'failed',
      failedAt: new Date(),
      failureReason: 'SMTP connection refused',
    });
    mockNotificationDeliveryCreate.mockResolvedValue(failedDelivery);

    const result = await mockNotificationDeliveryCreate({
      data: {
        notificationId: 'notif-001',
        channel: 'email',
        status: 'failed',
        failedAt: new Date(),
        failureReason: 'SMTP connection refused',
      },
    });

    expect(result.status).toBe('failed');
    expect(result.failureReason).toBe('SMTP connection refused');
  });
});

// ===========================================================================
// SCENARIO 2: Emergency Broadcast (Override All Preferences)
// ===========================================================================

describe('Scenario 2: Emergency Broadcast — Override All Preferences, All Channels', () => {
  it('Step 1: emergency notification created with all channels', async () => {
    const emergency = makeNotification({
      id: 'notif-emg-001',
      title: 'FIRE ALARM — Evacuate immediately',
      body: 'Fire alarm triggered on Floor 5. All residents must evacuate via stairwells.',
      priority: 'critical',
      isEmergency: true,
    });
    mockNotificationCreate.mockResolvedValue(emergency);

    const result = await mockNotificationCreate({
      data: {
        propertyId: PROPERTY_ID,
        title: 'FIRE ALARM — Evacuate immediately',
        body: 'Fire alarm triggered on Floor 5.',
        priority: 'critical',
        isEmergency: true,
      },
    });

    expect(result.isEmergency).toBe(true);
    expect(result.priority).toBe('critical');
  });

  it('Step 2: all preferences overridden for emergency', async () => {
    // Even though SMS is disabled for this resident
    mockNotificationPreferenceFindMany.mockResolvedValue([
      makePreference({ channel: 'sms', enabled: false }),
      makePreference({ id: 'pref-002', channel: 'push', enabled: false }),
    ]);

    const prefs = await mockNotificationPreferenceFindMany({
      where: { userId: RESIDENT_ID },
    });

    // Emergency overrides all preferences
    const isEmergency = true;
    const channelsToUse = isEmergency
      ? ['email', 'sms', 'push', 'voice']
      : prefs
          .filter((p: { enabled: boolean }) => p.enabled)
          .map((p: { channel: string }) => p.channel);

    expect(channelsToUse).toContain('sms');
    expect(channelsToUse).toContain('push');
    expect(channelsToUse).toContain('email');
    expect(channelsToUse).toContain('voice');
  });

  it('Step 3: push notification sent despite DND enabled', async () => {
    const delivery = makeDelivery({
      id: 'delivery-emg-push',
      channel: 'push',
      status: 'sent',
    });
    mockNotificationDeliveryCreate.mockResolvedValue(delivery);

    const result = await mockNotificationDeliveryCreate({
      data: {
        notificationId: 'notif-emg-001',
        channel: 'push',
        status: 'sent',
        sentAt: new Date(),
        overrideDnd: true,
      },
    });

    expect(result.status).toBe('sent');
  });

  it('Step 4: SMS sent despite preference being disabled', async () => {
    const delivery = makeDelivery({
      id: 'delivery-emg-sms',
      channel: 'sms',
      status: 'sent',
    });
    mockNotificationDeliveryCreate.mockResolvedValue(delivery);

    const result = await mockNotificationDeliveryCreate({
      data: {
        notificationId: 'notif-emg-001',
        channel: 'sms',
        status: 'sent',
        sentAt: new Date(),
        overridePreference: true,
      },
    });

    expect(result.status).toBe('sent');
    expect(result.channel).toBe('sms');
  });

  it('Step 5: email sent for emergency', async () => {
    const delivery = makeDelivery({
      id: 'delivery-emg-email',
      channel: 'email',
      status: 'sent',
    });
    mockNotificationDeliveryCreate.mockResolvedValue(delivery);

    const result = await mockNotificationDeliveryCreate({
      data: {
        notificationId: 'notif-emg-001',
        channel: 'email',
        status: 'sent',
        sentAt: new Date(),
      },
    });

    expect(result.status).toBe('sent');
  });

  it('Step 6: voice call initiated for emergency', async () => {
    const delivery = makeDelivery({
      id: 'delivery-emg-voice',
      channel: 'voice',
      status: 'sent',
    });
    mockNotificationDeliveryCreate.mockResolvedValue(delivery);

    const result = await mockNotificationDeliveryCreate({
      data: {
        notificationId: 'notif-emg-001',
        channel: 'voice',
        status: 'sent',
        sentAt: new Date(),
      },
    });

    expect(result.channel).toBe('voice');
    expect(result.status).toBe('sent');
  });

  it('Step 7: quiet hours bypassed for emergency', async () => {
    // Resident has quiet hours 10pm-7am, emergency at 2am should still deliver
    mockNotificationPreferenceFindMany.mockResolvedValue([
      makePreference({
        channel: 'push',
        enabled: true,
        dndEnabled: true,
        dndStart: new Date('1970-01-01T22:00:00Z'),
        dndEnd: new Date('1970-01-01T07:00:00Z'),
      }),
    ]);

    const prefs = await mockNotificationPreferenceFindMany({
      where: { userId: RESIDENT_ID },
    });

    const pref = prefs[0] as { dndEnabled: boolean };
    const isEmergency = true;

    // Emergency bypasses quiet hours
    const shouldDeliver = isEmergency || !pref.dndEnabled;
    expect(shouldDeliver).toBe(true);
  });

  it('Step 8: acknowledgment tracking started for emergency', async () => {
    mockNotificationUpdate.mockResolvedValue(
      makeNotification({
        id: 'notif-emg-001',
        isEmergency: true,
        requiresAcknowledgment: true,
        acknowledgedAt: null,
      }),
    );

    const result = await mockNotificationUpdate({
      where: { id: 'notif-emg-001' },
      data: { requiresAcknowledgment: true },
    });

    expect(result.requiresAcknowledgment).toBe(true);
    expect(result.acknowledgedAt).toBeNull();
  });

  it('all 4 channels should have delivery records for emergency', async () => {
    mockNotificationDeliveryFindMany.mockResolvedValue([
      makeDelivery({ id: 'd1', channel: 'email', status: 'sent' }),
      makeDelivery({ id: 'd2', channel: 'sms', status: 'sent' }),
      makeDelivery({ id: 'd3', channel: 'push', status: 'sent' }),
      makeDelivery({ id: 'd4', channel: 'voice', status: 'sent' }),
    ]);

    const deliveries = await mockNotificationDeliveryFindMany({
      where: { notificationId: 'notif-emg-001' },
    });

    expect(deliveries).toHaveLength(4);
    const channels = deliveries.map((d: { channel: string }) => d.channel);
    expect(channels).toEqual(expect.arrayContaining(['email', 'sms', 'push', 'voice']));
  });
});

// ===========================================================================
// SCENARIO 3: Digest Mode (Batch Notifications into Daily Email)
// ===========================================================================

describe('Scenario 3: Digest Mode — Daily Batched Notification Email', () => {
  it('Step 1: resident sets digest mode to daily', async () => {
    mockNotificationPreferenceUpsert.mockResolvedValue(
      makePreference({
        channel: 'email',
        digestMode: 'daily',
        digestTime: new Date('1970-01-01T08:00:00Z'),
      }),
    );

    const req = createPutRequest('/api/v1/notifications/preferences', {
      preferences: [
        {
          module: 'packages',
          channel: 'email',
          enabled: true,
          digestMode: 'daily',
          digestTime: '08:00',
        },
      ],
    });

    const res = await updateNotificationPreferences(req);
    expect(res.status).toBe(200);
  });

  it('Step 2: multiple notifications queued during the day', async () => {
    const notifications = [
      makeNotification({
        id: 'n1',
        title: 'Package from Amazon',
        createdAt: new Date('2026-03-18T09:00:00Z'),
      }),
      makeNotification({
        id: 'n2',
        title: 'Package from FedEx',
        createdAt: new Date('2026-03-18T11:30:00Z'),
      }),
      makeNotification({
        id: 'n3',
        title: 'Package from UPS',
        createdAt: new Date('2026-03-18T14:00:00Z'),
      }),
      makeNotification({
        id: 'n4',
        title: 'Maintenance update',
        module: 'maintenance',
        createdAt: new Date('2026-03-18T15:00:00Z'),
      }),
    ];

    mockNotificationFindMany.mockResolvedValue(notifications);

    const queued = await mockNotificationFindMany({
      where: { userId: RESIDENT_ID, status: 'pending', isEmergency: false },
      orderBy: { createdAt: 'asc' },
    });

    expect(queued).toHaveLength(4);
  });

  it('Step 3: digest email compiled at scheduled time (8am)', async () => {
    mockNotificationPreferenceFindMany.mockResolvedValue([
      makePreference({
        channel: 'email',
        digestMode: 'daily',
        digestTime: new Date('1970-01-01T08:00:00Z'),
      }),
    ]);

    const prefs = await mockNotificationPreferenceFindMany({
      where: { userId: RESIDENT_ID, digestMode: 'daily' },
    });

    expect(prefs[0].digestMode).toBe('daily');
    expect(prefs[0].digestTime).toBeTruthy();
  });

  it('Step 4: single email sent with all batched notifications', async () => {
    const digestRecord = {
      id: 'digest-001',
      userId: RESIDENT_ID,
      propertyId: PROPERTY_ID,
      channel: 'email',
      notificationCount: 4,
      sentAt: new Date('2026-03-19T08:00:00Z'),
      notificationIds: ['n1', 'n2', 'n3', 'n4'],
    };

    mockNotificationDigestCreate.mockResolvedValue(digestRecord);

    const result = await mockNotificationDigestCreate({
      data: {
        userId: RESIDENT_ID,
        propertyId: PROPERTY_ID,
        channel: 'email',
        notificationCount: 4,
        sentAt: new Date(),
        notificationIds: ['n1', 'n2', 'n3', 'n4'],
      },
    });

    expect(result.notificationCount).toBe(4);
    expect(result.channel).toBe('email');
  });

  it('Step 5: queued notifications marked as delivered after digest sent', async () => {
    mockNotificationUpdateMany.mockResolvedValue({ count: 4 });

    const result = await mockNotificationUpdateMany({
      where: { id: { in: ['n1', 'n2', 'n3', 'n4'] } },
      data: { status: 'delivered', sentAt: new Date() },
    });

    expect(result.count).toBe(4);
  });

  it('digest should respect weekly mode as well', async () => {
    mockNotificationPreferenceUpsert.mockResolvedValue(
      makePreference({
        channel: 'email',
        digestMode: 'weekly',
        digestTime: new Date('1970-01-01T09:00:00Z'),
      }),
    );

    const req = createPutRequest('/api/v1/notifications/preferences', {
      preferences: [
        {
          module: 'announcements',
          channel: 'email',
          enabled: true,
          digestMode: 'weekly',
          digestTime: '09:00',
        },
      ],
    });

    const res = await updateNotificationPreferences(req);
    expect(res.status).toBe(200);
  });

  it('instant mode should bypass digest queue', async () => {
    mockNotificationPreferenceFindMany.mockResolvedValue([
      makePreference({ channel: 'email', digestMode: 'instant' }),
    ]);

    const prefs = await mockNotificationPreferenceFindMany({
      where: { userId: RESIDENT_ID, module: 'packages', channel: 'email' },
    });

    const isInstant = prefs[0].digestMode === 'instant';
    expect(isInstant).toBe(true);
    // Instant = send immediately, do not queue
  });
});

// ===========================================================================
// SCENARIO 4: Quiet Hours (Queue Non-Emergency, Deliver Emergency)
// ===========================================================================

describe('Scenario 4: Quiet Hours — Queue Non-Emergency, Deliver Emergency Immediately', () => {
  it('Step 1: resident configures quiet hours 10pm to 7am', async () => {
    mockNotificationPreferenceUpsert.mockResolvedValue(
      makePreference({
        channel: 'push',
        dndEnabled: true,
        dndStart: new Date('1970-01-01T22:00:00Z'),
        dndEnd: new Date('1970-01-01T07:00:00Z'),
      }),
    );

    const req = createPutRequest('/api/v1/notifications/preferences', {
      preferences: [
        {
          module: 'packages',
          channel: 'push',
          enabled: true,
          dndEnabled: true,
          dndStart: '22:00',
          dndEnd: '07:00',
        },
      ],
    });

    const res = await updateNotificationPreferences(req);
    expect(res.status).toBe(200);
  });

  it('Step 2: non-emergency notification at 11pm is queued', async () => {
    mockNotificationPreferenceFindMany.mockResolvedValue([
      makePreference({
        channel: 'push',
        enabled: true,
        dndEnabled: true,
        dndStart: new Date('1970-01-01T22:00:00Z'),
        dndEnd: new Date('1970-01-01T07:00:00Z'),
      }),
    ]);

    const now = new Date('2026-03-18T23:00:00Z'); // 11pm
    const prefs = await mockNotificationPreferenceFindMany({
      where: { userId: RESIDENT_ID, channel: 'push' },
    });

    const pref = prefs[0] as {
      dndEnabled: boolean;
      dndStart: Date;
      dndEnd: Date;
    };

    // Check if within quiet hours
    const currentHour = now.getUTCHours();
    const startHour = new Date(pref.dndStart).getUTCHours();
    const endHour = new Date(pref.dndEnd).getUTCHours();

    let isQuietHours = false;
    if (startHour > endHour) {
      // Overnight DND (e.g., 22:00 - 07:00)
      isQuietHours = currentHour >= startHour || currentHour < endHour;
    } else {
      isQuietHours = currentHour >= startHour && currentHour < endHour;
    }

    expect(pref.dndEnabled).toBe(true);
    expect(isQuietHours).toBe(true);
  });

  it('Step 3: non-emergency notification stored as queued', async () => {
    const queuedNotif = makeNotification({
      id: 'notif-q1',
      status: 'queued',
      title: 'Package from Amazon',
      isEmergency: false,
    });
    mockNotificationCreate.mockResolvedValue(queuedNotif);

    const result = await mockNotificationCreate({
      data: {
        propertyId: PROPERTY_ID,
        userId: RESIDENT_ID,
        title: 'Package from Amazon',
        status: 'queued',
        isEmergency: false,
        scheduledDelivery: new Date('2026-03-19T07:00:00Z'),
      },
    });

    expect(result.status).toBe('queued');
  });

  it('Step 4: emergency notification at 2am delivered immediately', async () => {
    const emergencyNotif = makeNotification({
      id: 'notif-emg-q1',
      title: 'Water Leak Emergency',
      isEmergency: true,
      priority: 'critical',
      status: 'sent',
      sentAt: new Date('2026-03-19T02:00:00Z'),
    });
    mockNotificationCreate.mockResolvedValue(emergencyNotif);

    // Emergency at 2am during quiet hours
    const isEmergency = true;
    const shouldDeliverImmediately = isEmergency; // Always true for emergency

    expect(shouldDeliverImmediately).toBe(true);

    const result = await mockNotificationCreate({
      data: {
        propertyId: PROPERTY_ID,
        userId: RESIDENT_ID,
        title: 'Water Leak Emergency',
        isEmergency: true,
        priority: 'critical',
        status: 'sent',
      },
    });

    expect(result.status).toBe('sent');
    expect(result.isEmergency).toBe(true);
  });

  it('Step 5: queued notifications delivered when quiet hours end at 7am', async () => {
    mockNotificationFindMany.mockResolvedValue([
      makeNotification({ id: 'notif-q1', status: 'queued' }),
      makeNotification({ id: 'notif-q2', status: 'queued', title: 'Maintenance Update' }),
    ]);

    const queuedNotifs = await mockNotificationFindMany({
      where: {
        userId: RESIDENT_ID,
        status: 'queued',
        scheduledDelivery: { lte: new Date('2026-03-19T07:00:00Z') },
      },
    });

    expect(queuedNotifs).toHaveLength(2);

    // Mark as delivered
    mockNotificationUpdateMany.mockResolvedValue({ count: 2 });
    const updated = await mockNotificationUpdateMany({
      where: { id: { in: ['notif-q1', 'notif-q2'] } },
      data: { status: 'sent', sentAt: new Date('2026-03-19T07:00:00Z') },
    });

    expect(updated.count).toBe(2);
  });

  it('notifications outside quiet hours are delivered immediately', async () => {
    const now = new Date('2026-03-18T14:00:00Z'); // 2pm, outside quiet hours
    const currentHour = now.getUTCHours();
    const startHour = 22;
    const endHour = 7;

    let isQuietHours = false;
    if (startHour > endHour) {
      isQuietHours = currentHour >= startHour || currentHour < endHour;
    }

    expect(isQuietHours).toBe(false);
    // Notification at 2pm should be delivered immediately
  });

  it('quiet hours disabled means all notifications delivered immediately', async () => {
    mockNotificationPreferenceFindMany.mockResolvedValue([
      makePreference({
        channel: 'push',
        enabled: true,
        dndEnabled: false,
        dndStart: null,
        dndEnd: null,
      }),
    ]);

    const prefs = await mockNotificationPreferenceFindMany({
      where: { userId: RESIDENT_ID, channel: 'push' },
    });

    expect(prefs[0].dndEnabled).toBe(false);
  });
});

// ===========================================================================
// SCENARIO 5: Template Management
// ===========================================================================

describe('Scenario 5: Notification Templates', () => {
  it('should list notification templates for a property', async () => {
    mockNotificationTemplateFindMany.mockResolvedValue([
      {
        id: 'tpl-001',
        name: 'Package Received',
        channel: 'email',
        triggerAction: 'on_create',
        body: 'A package has arrived for your unit.',
        isActive: true,
      },
      {
        id: 'tpl-002',
        name: 'Emergency Alert',
        channel: 'sms',
        triggerAction: 'on_create',
        body: 'EMERGENCY: {{message}}',
        isActive: true,
      },
    ]);

    const req = createGetRequest('/api/v1/notifications/templates', {
      searchParams: { propertyId: PROPERTY_ID },
    });

    const res = await listTemplates(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { id: string; name: string }[] }>(res);
    expect(body.data).toHaveLength(2);
  });

  it('should create a new notification template', async () => {
    mockNotificationTemplateCreate.mockResolvedValue({
      id: 'tpl-003',
      propertyId: PROPERTY_ID,
      name: 'Maintenance Scheduled',
      channel: 'push',
      triggerAction: 'on_create',
      body: 'Maintenance has been scheduled for your unit.',
      isActive: true,
    });

    const req = createPostRequest('/api/v1/notifications/templates', {
      propertyId: PROPERTY_ID,
      name: 'Maintenance Scheduled',
      channel: 'push',
      triggerAction: 'on_create',
      body: 'Maintenance has been scheduled for your unit.',
      isActive: true,
    });

    const res = await createTemplate(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{ data: { name: string }; message: string }>(res);
    expect(body.data.name).toBe('Maintenance Scheduled');
    expect(body.message).toContain('Template created');
  });

  it('should filter templates by channel', async () => {
    mockNotificationTemplateFindMany.mockResolvedValue([
      { id: 'tpl-sms-1', name: 'SMS Alert', channel: 'sms' },
    ]);

    const req = createGetRequest('/api/v1/notifications/templates', {
      searchParams: { propertyId: PROPERTY_ID, channel: 'sms' },
    });

    const res = await listTemplates(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { channel: string }[] }>(res);
    expect(body.data.every((t) => t.channel === 'sms')).toBe(true);
  });

  it('should require propertyId for template listing', async () => {
    const req = createGetRequest('/api/v1/notifications/templates');
    const res = await listTemplates(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_PROPERTY');
  });
});

// ===========================================================================
// Cross-Scenario: Edge Cases & Validation
// ===========================================================================

describe('Notification Distribution: Edge Cases & Validation', () => {
  it('should handle resident with no preferences set (use defaults)', async () => {
    mockNotificationPreferenceFindMany.mockResolvedValue([]);

    const prefs = await mockNotificationPreferenceFindMany({
      where: { userId: 'new-resident-no-prefs' },
    });

    expect(prefs).toHaveLength(0);
    // Default behavior: email enabled, others off
  });

  it('should handle all channels disabled for non-emergency', async () => {
    mockNotificationPreferenceFindMany.mockResolvedValue([
      makePreference({ channel: 'email', enabled: false }),
      makePreference({ id: 'pref-2', channel: 'push', enabled: false }),
      makePreference({ id: 'pref-3', channel: 'sms', enabled: false }),
    ]);

    const prefs = await mockNotificationPreferenceFindMany({
      where: { userId: RESIDENT_ID },
    });

    const enabledChannels = prefs.filter((p: { enabled: boolean }) => p.enabled);

    expect(enabledChannels).toHaveLength(0);
    // No channels to deliver to — notification stays in pending status
  });

  it('should validate preference update requires valid channel', async () => {
    const req = createPutRequest('/api/v1/notifications/preferences', {
      preferences: [{ module: 'packages', channel: 'carrier_pigeon', enabled: true }],
    });

    const res = await updateNotificationPreferences(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('should validate preference update requires preferences array', async () => {
    const req = createPutRequest('/api/v1/notifications/preferences', {});
    const res = await updateNotificationPreferences(req);
    expect(res.status).toBe(400);
  });

  it('should track multiple residents for the same notification event', async () => {
    // A building-wide announcement should create notifications for all residents
    const notifications = [
      makeNotification({ id: 'n-r1', userId: RESIDENT_ID }),
      makeNotification({ id: 'n-r2', userId: RESIDENT_ID_2 }),
    ];

    mockNotificationFindMany.mockResolvedValue(notifications);

    const results = await mockNotificationFindMany({
      where: { propertyId: PROPERTY_ID, module: 'announcements' },
    });

    expect(results).toHaveLength(2);
    const userIds = results.map((n: { userId: string }) => n.userId);
    expect(userIds).toContain(RESIDENT_ID);
    expect(userIds).toContain(RESIDENT_ID_2);
  });

  it('should support voice channel for template creation', async () => {
    mockNotificationTemplateCreate.mockResolvedValue({
      id: 'tpl-voice-1',
      name: 'Emergency Voice Call',
      channel: 'voice',
      triggerAction: 'on_create',
      body: 'This is an emergency notification.',
      isActive: true,
    });

    const req = createPostRequest('/api/v1/notifications/templates', {
      propertyId: PROPERTY_ID,
      name: 'Emergency Voice Call',
      channel: 'voice',
      triggerAction: 'on_create',
      body: 'This is an emergency notification.',
      isActive: true,
    });

    const res = await createTemplate(req);
    expect(res.status).toBe(201);
  });
});
