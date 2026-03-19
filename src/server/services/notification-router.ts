/**
 * Concierge — Notification Router Service
 *
 * Routes notifications to the correct channel(s) based on user preferences,
 * notification type, quiet hours, DND mode, and emergency overrides.
 *
 * Channels: email, sms, push, in_app
 *
 * Behaviour:
 * - Emergency notifications bypass all preferences and quiet hours.
 * - DND mode blocks all channels except emergency.
 * - Quiet hours block non-emergency notifications.
 * - Digest mode queues notifications for batched delivery.
 * - Failed delivery on one channel does not block others.
 *
 * @module server/services/notification-router
 */

import { createLogger } from '@/server/logger';
import { sendEmail } from '@/server/email';
import { sendSms } from '@/server/sms';
import { sendPushToUser } from '@/server/push';

const logger = createLogger('notification-router');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Notification modules that map to Concierge features. */
export type Module =
  | 'packages'
  | 'maintenance'
  | 'security'
  | 'amenities'
  | 'announcements'
  | 'parking'
  | 'events'
  | 'training'
  | 'community'
  | 'governance'
  | 'emergency'
  | 'system';

/** Supported delivery channels. */
export type Channel = 'email' | 'sms' | 'push' | 'in_app';

/** Payload describing the notification to be routed. */
export interface NotificationPayload {
  title: string;
  body: string;
  module: Module;
  eventType: string;
  entityId: string;
  propertyId: string;
  metadata?: Record<string, unknown>;
}

/** Result of delivering to a single channel. */
export interface ChannelResult {
  channel: Channel;
  success: boolean;
  messageId?: string;
  error?: string;
}

/** Aggregated result across all channels. */
export interface DeliveryResult {
  channelResults: ChannelResult[];
}

/** Per-module channel preferences for a user. */
export interface UserChannelPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  in_app: boolean;
}

/** User notification profile used for routing decisions. */
export interface UserNotificationProfile {
  userId: string;
  email: string;
  phone?: string;
  /** Per-module preference overrides. If a module is absent, global defaults apply. */
  modulePreferences: Partial<Record<Module, UserChannelPreferences>>;
  /** Global defaults when no module-specific preference exists. */
  globalPreferences: UserChannelPreferences;
  /** Quiet hours: start and end in 24h format (e.g. 22 and 7 for 10pm-7am). */
  quietHoursStart?: number;
  quietHoursEnd?: number;
  /** Whether DND mode is currently active. */
  dndEnabled: boolean;
  /** Whether the user prefers digest delivery. */
  digestEnabled: boolean;
  /** The user's timezone (IANA, e.g. "America/Toronto"). */
  timezone: string;
}

/** A notification queued for later digest delivery. */
export interface QueuedDigestNotification {
  userId: string;
  payload: NotificationPayload;
  queuedAt: Date;
}

// ---------------------------------------------------------------------------
// Default module channel mappings
// ---------------------------------------------------------------------------

/**
 * Default channels for modules when user has no explicit preference.
 * These serve as fallbacks when globalPreferences are all disabled.
 */
const MODULE_DEFAULT_CHANNELS: Record<Module, Channel[]> = {
  packages: ['email', 'push'],
  maintenance: ['email', 'push'],
  security: ['email', 'sms', 'push', 'in_app'],
  amenities: ['email', 'in_app'],
  announcements: ['email', 'push', 'in_app'],
  parking: ['email', 'push'],
  events: ['email', 'in_app'],
  training: ['email', 'in_app'],
  community: ['in_app'],
  governance: ['email', 'in_app'],
  emergency: ['email', 'sms', 'push', 'in_app'],
  system: ['email'],
};

// ---------------------------------------------------------------------------
// Digest queue (in-memory for now; production would use Redis/DB)
// ---------------------------------------------------------------------------

const digestQueue: QueuedDigestNotification[] = [];

/**
 * Access the digest queue (primarily for testing).
 */
export function getDigestQueue(): QueuedDigestNotification[] {
  return digestQueue;
}

/**
 * Clear the digest queue (primarily for testing).
 */
export function clearDigestQueue(): void {
  digestQueue.length = 0;
}

// ---------------------------------------------------------------------------
// Emergency override
// ---------------------------------------------------------------------------

/**
 * Determine whether a module is an emergency override.
 * Emergency notifications bypass all preferences, quiet hours, and DND.
 */
export function isEmergencyOverride(module: Module): boolean {
  return module === 'emergency';
}

// ---------------------------------------------------------------------------
// Quiet hours check
// ---------------------------------------------------------------------------

/**
 * Check whether the current time falls within the user's quiet hours.
 *
 * @param profile - User notification profile with quiet hours config
 * @param now - Current time (for testability)
 * @returns true if currently in quiet hours
 */
export function isInQuietHours(profile: UserNotificationProfile, now: Date = new Date()): boolean {
  if (profile.quietHoursStart === undefined || profile.quietHoursEnd === undefined) {
    return false;
  }

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: profile.timezone,
    hour: 'numeric',
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  const hourPart = parts.find((p) => p.type === 'hour');
  const currentHour = parseInt(hourPart?.value ?? '0', 10);

  const start = profile.quietHoursStart;
  const end = profile.quietHoursEnd;

  if (start <= end) {
    // Same-day range: e.g. 13-17
    return currentHour >= start && currentHour < end;
  } else {
    // Overnight range: e.g. 22-7 means 22,23,0,1,2,3,4,5,6
    return currentHour >= start || currentHour < end;
  }
}

// ---------------------------------------------------------------------------
// Should send now
// ---------------------------------------------------------------------------

/**
 * Determine whether a notification should be sent immediately to this user.
 *
 * Returns false if:
 * - The user has DND enabled (non-emergency will be blocked later)
 * - The current time is within quiet hours
 *
 * @param profile - User notification profile
 * @param now - Current time (for testability)
 */
export function shouldSendNow(profile: UserNotificationProfile, now: Date = new Date()): boolean {
  if (profile.dndEnabled) {
    return false;
  }
  if (isInQuietHours(profile, now)) {
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Get effective channels
// ---------------------------------------------------------------------------

/**
 * Determine which channels are active for a given user, module, and event type.
 *
 * Priority:
 * 1. Module-specific preferences (if set)
 * 2. Global preferences
 * 3. Module defaults (fallback)
 *
 * @returns Array of active channels for this user/module combo
 */
export function getEffectiveChannels(profile: UserNotificationProfile, module: Module): Channel[] {
  const modulePrefs = profile.modulePreferences[module];
  const prefs = modulePrefs ?? profile.globalPreferences;

  const channels: Channel[] = [];
  if (prefs.email) channels.push('email');
  if (prefs.sms) channels.push('sms');
  if (prefs.push) channels.push('push');
  if (prefs.in_app) channels.push('in_app');

  // If the user has no channels enabled and no explicit module override,
  // fall back to module defaults
  if (channels.length === 0 && !modulePrefs) {
    const defaults = MODULE_DEFAULT_CHANNELS[module];
    if (defaults) {
      return [...defaults];
    }
    // Unknown module defaults to email
    return ['email'];
  }

  return channels;
}

// ---------------------------------------------------------------------------
// Queue for digest
// ---------------------------------------------------------------------------

/**
 * Queue a notification for digest delivery instead of immediate send.
 */
export function queueForDigest(
  userId: string,
  payload: NotificationPayload,
  now: Date = new Date(),
): void {
  digestQueue.push({ userId, payload, queuedAt: now });
  logger.info(
    { userId, module: payload.module, eventType: payload.eventType },
    'Notification queued for digest delivery',
  );
}

// ---------------------------------------------------------------------------
// Channel delivery helpers
// ---------------------------------------------------------------------------

async function deliverEmail(
  profile: UserNotificationProfile,
  payload: NotificationPayload,
): Promise<ChannelResult> {
  try {
    const messageId = await sendEmail({
      to: profile.email,
      subject: payload.title,
      text: payload.body,
    });
    return {
      channel: 'email',
      success: messageId !== null,
      messageId: messageId ?? undefined,
    };
  } catch (err) {
    return {
      channel: 'email',
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

async function deliverSms(
  profile: UserNotificationProfile,
  payload: NotificationPayload,
): Promise<ChannelResult> {
  if (!profile.phone) {
    return { channel: 'sms', success: false, error: 'No phone number on file' };
  }
  try {
    const messageSid = await sendSms({
      to: profile.phone,
      body: `${payload.title}: ${payload.body}`,
    });
    return {
      channel: 'sms',
      success: messageSid !== null,
      messageId: messageSid ?? undefined,
    };
  } catch (err) {
    return {
      channel: 'sms',
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

async function deliverPush(
  profile: UserNotificationProfile,
  payload: NotificationPayload,
): Promise<ChannelResult> {
  try {
    const result = await sendPushToUser(profile.userId, {
      title: payload.title,
      body: payload.body,
      data: {
        module: payload.module,
        eventType: payload.eventType,
        entityId: payload.entityId,
        propertyId: payload.propertyId,
      },
    });
    return {
      channel: 'push',
      success: result.sent > 0,
      messageId: result.sent > 0 ? `push:${result.sent}` : undefined,
      error: result.sent === 0 && result.failed > 0 ? 'All push deliveries failed' : undefined,
    };
  } catch (err) {
    return {
      channel: 'push',
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
}

async function deliverInApp(
  _profile: UserNotificationProfile,
  _payload: NotificationPayload,
): Promise<ChannelResult> {
  // In-app notifications are stored in the database and displayed via the UI.
  // For now, this always succeeds as a placeholder.
  return { channel: 'in_app', success: true, messageId: `in_app:${Date.now()}` };
}

const CHANNEL_DISPATCHERS: Record<
  Channel,
  (profile: UserNotificationProfile, payload: NotificationPayload) => Promise<ChannelResult>
> = {
  email: deliverEmail,
  sms: deliverSms,
  push: deliverPush,
  in_app: deliverInApp,
};

// ---------------------------------------------------------------------------
// Route notification (main entry point)
// ---------------------------------------------------------------------------

/**
 * Route a notification to the correct channel(s) based on user preferences.
 *
 * Flow:
 * 1. Check if emergency override applies (bypass all restrictions)
 * 2. Check DND mode (blocks everything except emergency)
 * 3. Check quiet hours (blocks non-emergency)
 * 4. Check if user prefers digest delivery
 * 5. Determine effective channels
 * 6. Dispatch to all channels concurrently
 * 7. Aggregate results
 *
 * @returns DeliveryResult with per-channel outcomes
 */
export async function routeNotification(
  profile: UserNotificationProfile,
  payload: NotificationPayload,
  now: Date = new Date(),
): Promise<DeliveryResult> {
  const isEmergency = isEmergencyOverride(payload.module);

  // DND blocks everything except emergency
  if (profile.dndEnabled && !isEmergency) {
    logger.info(
      { userId: profile.userId, module: payload.module },
      'DND active — notification blocked',
    );
    return { channelResults: [] };
  }

  // Quiet hours block non-emergency
  if (!isEmergency && isInQuietHours(profile, now)) {
    logger.info(
      { userId: profile.userId, module: payload.module },
      'Quiet hours active — notification blocked',
    );
    return { channelResults: [] };
  }

  // Digest mode: queue instead of sending (unless emergency)
  if (profile.digestEnabled && !isEmergency) {
    queueForDigest(profile.userId, payload, now);
    return { channelResults: [] };
  }

  // Determine channels
  let channels: Channel[];
  if (isEmergency) {
    // Emergency always goes to all channels
    channels = ['email', 'sms', 'push', 'in_app'];
  } else {
    channels = getEffectiveChannels(profile, payload.module);
  }

  if (channels.length === 0) {
    logger.info(
      { userId: profile.userId, module: payload.module },
      'No channels enabled — notification not sent',
    );
    return { channelResults: [] };
  }

  // Dispatch to all channels concurrently
  const results = await Promise.allSettled(
    channels.map((channel) => {
      const dispatcher = CHANNEL_DISPATCHERS[channel];
      return dispatcher(profile, payload);
    }),
  );

  const channelResults: ChannelResult[] = results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    }
    return {
      channel: channels[index]!,
      success: false,
      error: result.reason instanceof Error ? result.reason.message : 'Unknown error',
    };
  });

  logger.info(
    {
      userId: profile.userId,
      module: payload.module,
      channels: channelResults.map((r) => `${r.channel}:${r.success ? 'ok' : 'fail'}`),
    },
    'Notification routed',
  );

  return { channelResults };
}
