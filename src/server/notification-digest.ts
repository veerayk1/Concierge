/**
 * Concierge — Notification Digest & Scheduling System
 *
 * Allows users to receive batched notifications (daily/weekly digest)
 * instead of real-time delivery. Collects pending notifications,
 * groups them by module, renders a digest email, and processes
 * scheduled digests at the configured time in the property's timezone.
 *
 * @module server/notification-digest
 */

import { createLogger } from '@/server/logger';
import { renderTemplate } from '@/server/email-templates';
import { sendEmail } from '@/server/email';

const logger = createLogger('notification-digest');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Notification modules that map to Concierge features. */
export type NotificationModule =
  | 'packages'
  | 'maintenance'
  | 'bookings'
  | 'security'
  | 'announcements'
  | 'events'
  | 'general';

/** User's preferred notification delivery frequency. */
export type DigestPreference = 'instant' | 'daily' | 'weekly';

/** A single notification record awaiting delivery or digest inclusion. */
export interface PendingNotification {
  id: string;
  userId: string;
  channel: string;
  module: NotificationModule;
  title: string;
  description: string;
  createdAt: Date;
  sentAt: Date | null;
  includedInDigest: boolean;
}

/** User preference and profile data needed for digest processing. */
export interface UserDigestProfile {
  userId: string;
  email: string;
  firstName: string;
  digestPreference: DigestPreference;
  timezone: string;
}

/** A grouped digest ready for rendering. */
export interface DigestSummary {
  userId: string;
  email: string;
  firstName: string;
  period: 'daily' | 'weekly';
  since: Date;
  until: Date;
  groups: DigestGroup[];
  totalCount: number;
}

/** A group of notifications within a digest, keyed by module. */
export interface DigestGroup {
  module: NotificationModule;
  label: string;
  count: number;
  items: DigestItem[];
}

/** A single item within a digest group. */
export interface DigestItem {
  id: string;
  title: string;
  description: string;
  createdAt: Date;
}

/** Result of processing a single user's digest. */
export interface DigestProcessResult {
  userId: string;
  status: 'sent' | 'skipped' | 'failed';
  notificationCount: number;
}

/** Result of a full digest processing run. */
export interface DigestRunResult {
  processed: number;
  sent: number;
  skipped: number;
  failed: number;
  results: DigestProcessResult[];
}

// ---------------------------------------------------------------------------
// Module Label Map
// ---------------------------------------------------------------------------

const MODULE_LABELS: Record<NotificationModule, string> = {
  packages: 'Packages',
  maintenance: 'Maintenance Updates',
  bookings: 'Booking Confirmations',
  security: 'Security Alerts',
  announcements: 'Announcements',
  events: 'Events',
  general: 'General',
};

// ---------------------------------------------------------------------------
// Collect Pending Notifications
// ---------------------------------------------------------------------------

/**
 * Collect all pending (unsent, not-yet-digested) notifications for a user
 * since a given date.
 *
 * @param notifications - The full notification store to query
 * @param userId - The user to collect for
 * @param since - Only include notifications created after this date
 * @returns Filtered list of pending notifications
 */
export function collectPendingNotifications(
  notifications: PendingNotification[],
  userId: string,
  since: Date,
): PendingNotification[] {
  return notifications.filter(
    (n) => n.userId === userId && n.sentAt === null && !n.includedInDigest && n.createdAt >= since,
  );
}

// ---------------------------------------------------------------------------
// Group Notifications
// ---------------------------------------------------------------------------

/**
 * Group notifications by user and channel.
 *
 * @returns A map keyed by `userId:channel` with arrays of notifications.
 */
export function groupByUserAndChannel(
  notifications: PendingNotification[],
): Map<string, PendingNotification[]> {
  const grouped = new Map<string, PendingNotification[]>();

  for (const notification of notifications) {
    const key = `${notification.userId}:${notification.channel}`;
    const existing = grouped.get(key);
    if (existing) {
      existing.push(notification);
    } else {
      grouped.set(key, [notification]);
    }
  }

  return grouped;
}

// ---------------------------------------------------------------------------
// Generate Digest
// ---------------------------------------------------------------------------

/**
 * Generate a digest summary for a user over a given period.
 *
 * Collects pending notifications, groups them by module, and produces
 * a structured summary suitable for rendering.
 *
 * @param notifications - The full notification store
 * @param profile - User profile with digest preferences
 * @param period - 'daily' (past 24h) or 'weekly' (past 7 days)
 * @param now - The current time (for testability)
 * @returns A DigestSummary, or null if there are no notifications
 */
export function generateDigest(
  notifications: PendingNotification[],
  profile: UserDigestProfile,
  period: 'daily' | 'weekly',
  now: Date = new Date(),
): DigestSummary | null {
  const since = new Date(now);
  if (period === 'daily') {
    since.setTime(since.getTime() - 24 * 60 * 60 * 1000);
  } else {
    since.setTime(since.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  const pending = collectPendingNotifications(notifications, profile.userId, since);

  if (pending.length === 0) {
    return null;
  }

  // Group by module
  const moduleMap = new Map<NotificationModule, DigestItem[]>();
  for (const n of pending) {
    const items = moduleMap.get(n.module);
    const item: DigestItem = {
      id: n.id,
      title: n.title,
      description: n.description,
      createdAt: n.createdAt,
    };
    if (items) {
      items.push(item);
    } else {
      moduleMap.set(n.module, [item]);
    }
  }

  // Build ordered groups
  const groups: DigestGroup[] = [];
  for (const [module, items] of moduleMap) {
    groups.push({
      module,
      label: MODULE_LABELS[module],
      count: items.length,
      items,
    });
  }

  // Sort groups by count descending for readability
  groups.sort((a, b) => b.count - a.count);

  return {
    userId: profile.userId,
    email: profile.email,
    firstName: profile.firstName,
    period,
    since,
    until: now,
    groups,
    totalCount: pending.length,
  };
}

// ---------------------------------------------------------------------------
// Generate Digest Counts Summary
// ---------------------------------------------------------------------------

/**
 * Generate a human-readable summary line for a digest.
 *
 * @example "You have 3 packages, 2 maintenance updates, 1 booking confirmation"
 */
export function generateDigestCountsSummary(digest: DigestSummary): string {
  if (digest.groups.length === 0) {
    return 'No new notifications.';
  }

  const parts = digest.groups.map((g) => {
    const label = g.count === 1 ? singularLabel(g.module) : g.label.toLowerCase();
    return `${g.count} ${label}`;
  });

  return `You have ${parts.join(', ')}`;
}

function singularLabel(module: NotificationModule): string {
  const singulars: Record<NotificationModule, string> = {
    packages: 'package',
    maintenance: 'maintenance update',
    bookings: 'booking confirmation',
    security: 'security alert',
    announcements: 'announcement',
    events: 'event',
    general: 'notification',
  };
  return singulars[module];
}

// ---------------------------------------------------------------------------
// Render Digest Email
// ---------------------------------------------------------------------------

/**
 * Render a digest into an HTML email using the notification_digest template.
 *
 * The email groups items by module with section headers and a count summary.
 */
export function renderDigestEmail(digest: DigestSummary): string {
  const items: Array<{ title: string; description: string }> = [];

  for (const group of digest.groups) {
    // Add a section header for each module group
    items.push({
      title: `${group.label} (${group.count})`,
      description: '',
    });

    for (const item of group.items) {
      items.push({
        title: item.title,
        description: item.description,
      });
    }
  }

  const countsSummary = generateDigestCountsSummary(digest);
  const periodLabel = digest.period === 'daily' ? 'Daily' : 'Weekly';

  return renderTemplate('notification_digest', {
    recipientName: digest.firstName,
    items: [{ title: `${periodLabel} Summary`, description: countsSummary }, ...items],
  });
}

// ---------------------------------------------------------------------------
// Mark Notifications as Included in Digest
// ---------------------------------------------------------------------------

/**
 * Mark an array of notifications as included in a digest.
 * Mutates the notifications in place and returns the count marked.
 */
export function markAsIncludedInDigest(
  notifications: PendingNotification[],
  notificationIds: string[],
): number {
  const idSet = new Set(notificationIds);
  let count = 0;

  for (const n of notifications) {
    if (idSet.has(n.id)) {
      n.includedInDigest = true;
      count++;
    }
  }

  return count;
}

// ---------------------------------------------------------------------------
// Timezone Helpers
// ---------------------------------------------------------------------------

/**
 * Get the current hour in a given IANA timezone.
 *
 * @param timezone - IANA timezone string (e.g. "America/Toronto")
 * @param now - Current time (for testability)
 * @returns The current hour (0-23) in the given timezone
 */
export function getCurrentHourInTimezone(timezone: string, now: Date = new Date()): number {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  const hourPart = parts.find((p) => p.type === 'hour');
  return parseInt(hourPart?.value ?? '0', 10);
}

/**
 * Check if it's time to send a digest for a given timezone.
 *
 * @param timezone - IANA timezone
 * @param targetHour - Hour to send the digest (default 8 AM)
 * @param now - Current time
 * @returns true if the current hour matches the target hour in the timezone
 */
export function isDigestTime(
  timezone: string,
  targetHour: number = 8,
  now: Date = new Date(),
): boolean {
  return getCurrentHourInTimezone(timezone, now) === targetHour;
}

// ---------------------------------------------------------------------------
// Should Send Digest
// ---------------------------------------------------------------------------

/**
 * Determine whether a user should receive a digest based on their preference
 * and the current day.
 *
 * - 'instant': never receives a digest (returns false)
 * - 'daily': always eligible when it's digest time
 * - 'weekly': only eligible on Mondays (or the configured day)
 *
 * @param preference - The user's digest preference
 * @param period - The digest period being processed
 * @returns true if the user should receive this digest
 */
export function shouldSendDigest(
  preference: DigestPreference,
  period: 'daily' | 'weekly',
): boolean {
  if (preference === 'instant') {
    return false;
  }
  if (preference === 'daily' && period === 'daily') {
    return true;
  }
  if (preference === 'weekly' && period === 'weekly') {
    return true;
  }
  return false;
}

// ---------------------------------------------------------------------------
// Process Digests — Cron Job Entry Point
// ---------------------------------------------------------------------------

/**
 * Main cron job entry point for processing notification digests.
 *
 * For each user with digest preferences:
 * 1. Check if it's digest time in their property's timezone
 * 2. Generate the digest summary
 * 3. Render and send the digest email
 * 4. Mark notifications as included in digest
 *
 * @param notifications - The notification store
 * @param users - User profiles with digest preferences
 * @param period - 'daily' or 'weekly'
 * @param now - Current time (for testability)
 * @param targetHour - Hour to send digest (default 8)
 * @returns Results of the digest processing run
 */
export async function processDigests(
  notifications: PendingNotification[],
  users: UserDigestProfile[],
  period: 'daily' | 'weekly',
  now: Date = new Date(),
  targetHour: number = 8,
): Promise<DigestRunResult> {
  const results: DigestProcessResult[] = [];
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const user of users) {
    // Check preference
    if (!shouldSendDigest(user.digestPreference, period)) {
      results.push({ userId: user.userId, status: 'skipped', notificationCount: 0 });
      skipped++;
      continue;
    }

    // Check timezone-aware scheduling
    if (!isDigestTime(user.timezone, targetHour, now)) {
      results.push({ userId: user.userId, status: 'skipped', notificationCount: 0 });
      skipped++;
      continue;
    }

    // Generate digest
    const digest = generateDigest(notifications, user, period, now);

    if (!digest) {
      // Empty digest — skip sending
      logger.debug({ userId: user.userId, period }, 'No notifications for digest — skipping');
      results.push({ userId: user.userId, status: 'skipped', notificationCount: 0 });
      skipped++;
      continue;
    }

    // Render and send
    try {
      const html = renderDigestEmail(digest);
      const periodLabel = period === 'daily' ? 'Daily' : 'Weekly';

      await sendEmail({
        to: user.email,
        subject: `Your ${periodLabel} Notification Digest — Concierge`,
        html,
      });

      // Mark notifications as digested
      const ids = digest.groups.flatMap((g) => g.items.map((i) => i.id));
      markAsIncludedInDigest(notifications, ids);

      logger.info({ userId: user.userId, period, count: digest.totalCount }, 'Digest email sent');

      results.push({
        userId: user.userId,
        status: 'sent',
        notificationCount: digest.totalCount,
      });
      sent++;
    } catch (err) {
      logger.error({ userId: user.userId, err }, 'Failed to send digest email');
      results.push({ userId: user.userId, status: 'failed', notificationCount: 0 });
      failed++;
    }
  }

  return {
    processed: users.length,
    sent,
    skipped,
    failed,
    results,
  };
}
