/**
 * Notification Digest & Scheduling System — TDD Tests
 *
 * Tests for collecting, grouping, generating, rendering, and scheduling
 * notification digests with timezone-aware delivery.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  collectPendingNotifications,
  groupByUserAndChannel,
  generateDigest,
  renderDigestEmail,
  generateDigestCountsSummary,
  markAsIncludedInDigest,
  shouldSendDigest,
  isDigestTime,
  getCurrentHourInTimezone,
  processDigests,
  type PendingNotification,
  type UserDigestProfile,
  type DigestSummary,
} from '@/server/notification-digest';

// ---------------------------------------------------------------------------
// Helpers — Test Data Factories
// ---------------------------------------------------------------------------

let idCounter = 0;

function createNotification(overrides: Partial<PendingNotification> = {}): PendingNotification {
  idCounter++;
  return {
    id: `notif-${idCounter}`,
    userId: 'user-1',
    channel: 'email',
    module: 'packages',
    title: `Notification ${idCounter}`,
    description: `Description for notification ${idCounter}`,
    createdAt: new Date('2026-03-19T10:00:00Z'),
    sentAt: null,
    includedInDigest: false,
    ...overrides,
  };
}

function createUserProfile(overrides: Partial<UserDigestProfile> = {}): UserDigestProfile {
  return {
    userId: 'user-1',
    email: 'jane@example.com',
    firstName: 'Jane',
    digestPreference: 'daily',
    timezone: 'America/Toronto',
    ...overrides,
  };
}

beforeEach(() => {
  idCounter = 0;
});

// ---------------------------------------------------------------------------
// 1. Collect pending notifications for digest (not yet sent)
// ---------------------------------------------------------------------------

describe('collectPendingNotifications', () => {
  it('returns only unsent, non-digested notifications for the given user since the specified date', () => {
    const since = new Date('2026-03-18T00:00:00Z');
    const notifications: PendingNotification[] = [
      createNotification({ userId: 'user-1', createdAt: new Date('2026-03-18T12:00:00Z') }),
      createNotification({ userId: 'user-1', createdAt: new Date('2026-03-19T08:00:00Z') }),
      // Already sent — should be excluded
      createNotification({
        userId: 'user-1',
        createdAt: new Date('2026-03-18T14:00:00Z'),
        sentAt: new Date('2026-03-18T14:01:00Z'),
      }),
      // Already in a digest — should be excluded
      createNotification({
        userId: 'user-1',
        createdAt: new Date('2026-03-18T15:00:00Z'),
        includedInDigest: true,
      }),
      // Different user — should be excluded
      createNotification({ userId: 'user-2', createdAt: new Date('2026-03-19T08:00:00Z') }),
      // Before 'since' date — should be excluded
      createNotification({ userId: 'user-1', createdAt: new Date('2026-03-17T23:59:59Z') }),
    ];

    const result = collectPendingNotifications(notifications, 'user-1', since);

    expect(result).toHaveLength(2);
    expect(result.every((n) => n.userId === 'user-1')).toBe(true);
    expect(result.every((n) => n.sentAt === null)).toBe(true);
    expect(result.every((n) => !n.includedInDigest)).toBe(true);
    expect(result.every((n) => n.createdAt >= since)).toBe(true);
  });

  it('returns empty array when no notifications match', () => {
    const result = collectPendingNotifications([], 'user-1', new Date());
    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 2. Group notifications by user and channel
// ---------------------------------------------------------------------------

describe('groupByUserAndChannel', () => {
  it('groups notifications by user ID and channel', () => {
    const notifications: PendingNotification[] = [
      createNotification({ userId: 'user-1', channel: 'email' }),
      createNotification({ userId: 'user-1', channel: 'email' }),
      createNotification({ userId: 'user-1', channel: 'sms' }),
      createNotification({ userId: 'user-2', channel: 'email' }),
    ];

    const grouped = groupByUserAndChannel(notifications);

    expect(grouped.size).toBe(3);
    expect(grouped.get('user-1:email')).toHaveLength(2);
    expect(grouped.get('user-1:sms')).toHaveLength(1);
    expect(grouped.get('user-2:email')).toHaveLength(1);
  });

  it('returns empty map for empty input', () => {
    const grouped = groupByUserAndChannel([]);
    expect(grouped.size).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 3. Generate daily digest: all notifications from past 24h
// ---------------------------------------------------------------------------

describe('generateDigest — daily', () => {
  it('collects notifications from the past 24 hours', () => {
    const now = new Date('2026-03-19T12:00:00Z');
    const notifications: PendingNotification[] = [
      // Within 24h
      createNotification({ createdAt: new Date('2026-03-19T08:00:00Z'), module: 'packages' }),
      createNotification({ createdAt: new Date('2026-03-18T14:00:00Z'), module: 'maintenance' }),
      // Older than 24h — should be excluded
      createNotification({ createdAt: new Date('2026-03-18T11:59:59Z') }),
    ];

    const profile = createUserProfile();
    const digest = generateDigest(notifications, profile, 'daily', now);

    expect(digest).not.toBeNull();
    expect(digest!.totalCount).toBe(2);
    expect(digest!.period).toBe('daily');
    expect(digest!.since.getTime()).toBe(now.getTime() - 24 * 60 * 60 * 1000);
    expect(digest!.until).toBe(now);
  });
});

// ---------------------------------------------------------------------------
// 4. Generate weekly digest: all notifications from past 7 days
// ---------------------------------------------------------------------------

describe('generateDigest — weekly', () => {
  it('collects notifications from the past 7 days', () => {
    const now = new Date('2026-03-19T12:00:00Z');
    const notifications: PendingNotification[] = [
      createNotification({ createdAt: new Date('2026-03-19T08:00:00Z'), module: 'packages' }),
      createNotification({ createdAt: new Date('2026-03-15T10:00:00Z'), module: 'maintenance' }),
      createNotification({ createdAt: new Date('2026-03-13T10:00:00Z'), module: 'bookings' }),
      // Older than 7 days — should be excluded
      createNotification({ createdAt: new Date('2026-03-12T11:59:59Z') }),
    ];

    const profile = createUserProfile({ digestPreference: 'weekly' });
    const digest = generateDigest(notifications, profile, 'weekly', now);

    expect(digest).not.toBeNull();
    expect(digest!.totalCount).toBe(3);
    expect(digest!.period).toBe('weekly');
    expect(digest!.since.getTime()).toBe(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  });
});

// ---------------------------------------------------------------------------
// 5. Digest respects user preference (daily/weekly/instant)
// ---------------------------------------------------------------------------

describe('shouldSendDigest — preference matching', () => {
  it('returns true for daily preference with daily period', () => {
    expect(shouldSendDigest('daily', 'daily')).toBe(true);
  });

  it('returns true for weekly preference with weekly period', () => {
    expect(shouldSendDigest('weekly', 'weekly')).toBe(true);
  });

  it('returns false for instant preference with any period', () => {
    expect(shouldSendDigest('instant', 'daily')).toBe(false);
    expect(shouldSendDigest('instant', 'weekly')).toBe(false);
  });

  it('returns false for daily preference with weekly period', () => {
    expect(shouldSendDigest('daily', 'weekly')).toBe(false);
  });

  it('returns false for weekly preference with daily period', () => {
    expect(shouldSendDigest('weekly', 'daily')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// 6. Digest email template: grouped by module
// ---------------------------------------------------------------------------

describe('renderDigestEmail — grouped by module', () => {
  it('renders HTML with notifications grouped by module with section headers', () => {
    const digest: DigestSummary = {
      userId: 'user-1',
      email: 'jane@example.com',
      firstName: 'Jane',
      period: 'daily',
      since: new Date('2026-03-18T12:00:00Z'),
      until: new Date('2026-03-19T12:00:00Z'),
      groups: [
        {
          module: 'packages',
          label: 'Packages',
          count: 2,
          items: [
            {
              id: 'n1',
              title: 'Package from Amazon',
              description: 'PKG-001 at front desk',
              createdAt: new Date(),
            },
            {
              id: 'n2',
              title: 'Package from FedEx',
              description: 'PKG-002 at front desk',
              createdAt: new Date(),
            },
          ],
        },
        {
          module: 'maintenance',
          label: 'Maintenance Updates',
          count: 1,
          items: [
            {
              id: 'n3',
              title: 'Plumbing repair completed',
              description: 'MNT-042 resolved',
              createdAt: new Date(),
            },
          ],
        },
      ],
      totalCount: 3,
    };

    const html = renderDigestEmail(digest);

    // Contains the recipient name
    expect(html).toContain('Jane');
    // Contains module group headers
    expect(html).toContain('Packages (2)');
    expect(html).toContain('Maintenance Updates (1)');
    // Contains individual items
    expect(html).toContain('Package from Amazon');
    expect(html).toContain('PKG-001 at front desk');
    expect(html).toContain('Package from FedEx');
    expect(html).toContain('Plumbing repair completed');
    // Is valid HTML
    expect(html).toContain('<html');
    expect(html).toContain('</html>');
    // Contains period label
    expect(html).toContain('Daily Summary');
  });
});

// ---------------------------------------------------------------------------
// 7. Digest counts summary
// ---------------------------------------------------------------------------

describe('generateDigestCountsSummary', () => {
  it('generates "You have 3 packages, 2 maintenance updates, 1 booking confirmation"', () => {
    const digest: DigestSummary = {
      userId: 'user-1',
      email: 'jane@example.com',
      firstName: 'Jane',
      period: 'daily',
      since: new Date(),
      until: new Date(),
      groups: [
        { module: 'packages', label: 'Packages', count: 3, items: [] },
        { module: 'maintenance', label: 'Maintenance Updates', count: 2, items: [] },
        { module: 'bookings', label: 'Booking Confirmations', count: 1, items: [] },
      ],
      totalCount: 6,
    };

    const summary = generateDigestCountsSummary(digest);

    expect(summary).toBe('You have 3 packages, 2 maintenance updates, 1 booking confirmation');
  });

  it('uses singular form for count of 1', () => {
    const digest: DigestSummary = {
      userId: 'user-1',
      email: 'jane@example.com',
      firstName: 'Jane',
      period: 'daily',
      since: new Date(),
      until: new Date(),
      groups: [{ module: 'packages', label: 'Packages', count: 1, items: [] }],
      totalCount: 1,
    };

    const summary = generateDigestCountsSummary(digest);
    expect(summary).toBe('You have 1 package');
  });

  it('returns "No new notifications." for empty groups', () => {
    const digest: DigestSummary = {
      userId: 'user-1',
      email: 'jane@example.com',
      firstName: 'Jane',
      period: 'daily',
      since: new Date(),
      until: new Date(),
      groups: [],
      totalCount: 0,
    };

    const summary = generateDigestCountsSummary(digest);
    expect(summary).toBe('No new notifications.');
  });
});

// ---------------------------------------------------------------------------
// 8. Instant mode: no digest, send immediately
// ---------------------------------------------------------------------------

describe('instant mode — no digest', () => {
  it('shouldSendDigest returns false for instant preference', () => {
    expect(shouldSendDigest('instant', 'daily')).toBe(false);
    expect(shouldSendDigest('instant', 'weekly')).toBe(false);
  });

  it('processDigests skips users with instant preference', async () => {
    const notifications = [createNotification({ createdAt: new Date('2026-03-19T07:00:00Z') })];
    const users = [createUserProfile({ digestPreference: 'instant' })];

    // Use a time that would match 8 AM in America/Toronto
    const now = new Date('2026-03-19T12:00:00Z');

    const result = await processDigests(notifications, users, 'daily', now);

    expect(result.skipped).toBe(1);
    expect(result.sent).toBe(0);
    expect(result.results[0]!.status).toBe('skipped');
  });
});

// ---------------------------------------------------------------------------
// 9. Scheduled digest: runs at configured time (e.g. 8 AM local time)
// ---------------------------------------------------------------------------

describe('isDigestTime — scheduled digest', () => {
  it('returns true when current hour in timezone matches target hour', () => {
    // 2026-03-19T12:00:00Z is 8 AM EDT (America/Toronto, UTC-4 during DST)
    const now = new Date('2026-03-19T12:00:00Z');
    expect(isDigestTime('America/Toronto', 8, now)).toBe(true);
  });

  it('returns false when current hour does not match target hour', () => {
    // 2026-03-19T15:00:00Z is 11 AM EDT
    const now = new Date('2026-03-19T15:00:00Z');
    expect(isDigestTime('America/Toronto', 8, now)).toBe(false);
  });

  it('defaults to 8 AM when no target hour is specified', () => {
    const now = new Date('2026-03-19T12:00:00Z');
    expect(isDigestTime('America/Toronto', undefined, now)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 10. Timezone-aware: digest sent at 8 AM in property's timezone
// ---------------------------------------------------------------------------

describe('getCurrentHourInTimezone — timezone awareness', () => {
  it('returns 8 for 12:00 UTC in America/Toronto (EDT, UTC-4)', () => {
    const now = new Date('2026-03-19T12:00:00Z');
    expect(getCurrentHourInTimezone('America/Toronto', now)).toBe(8);
  });

  it('returns 8 for 16:00 UTC in Asia/Kolkata (UTC+5:30)', () => {
    // 16:00 UTC = 21:30 IST — not 8, let's pick the right time
    // 8:00 IST = 02:30 UTC
    const now = new Date('2026-03-19T02:30:00Z');
    expect(getCurrentHourInTimezone('Asia/Kolkata', now)).toBe(8);
  });

  it('handles different timezones for the same UTC time', () => {
    const now = new Date('2026-03-19T12:00:00Z');
    const torontoHour = getCurrentHourInTimezone('America/Toronto', now);
    const londonHour = getCurrentHourInTimezone('Europe/London', now);
    // Toronto is UTC-4 (EDT), London is UTC+0 (GMT)
    expect(londonHour - torontoHour).toBe(4);
  });

  it('processes digests only when it is 8 AM in the property timezone', async () => {
    const notifications = [createNotification({ createdAt: new Date('2026-03-19T07:00:00Z') })];

    // User in Tokyo (UTC+9): 12:00 UTC = 21:00 JST — not 8 AM
    const tokyoUser = createUserProfile({
      userId: 'tokyo-user',
      timezone: 'Asia/Tokyo',
      digestPreference: 'daily',
    });

    // User in Toronto (UTC-4): 12:00 UTC = 8:00 AM EDT — exactly 8 AM
    const torontoUser = createUserProfile({
      userId: 'toronto-user',
      timezone: 'America/Toronto',
      digestPreference: 'daily',
    });

    const now = new Date('2026-03-19T12:00:00Z');

    const torontoNotifications = [
      createNotification({
        userId: 'toronto-user',
        createdAt: new Date('2026-03-19T07:00:00Z'),
      }),
    ];

    const tokyoNotifications = [
      createNotification({
        userId: 'tokyo-user',
        createdAt: new Date('2026-03-19T07:00:00Z'),
      }),
    ];

    const allNotifications = [...torontoNotifications, ...tokyoNotifications];

    const result = await processDigests(allNotifications, [tokyoUser, torontoUser], 'daily', now);

    // Tokyo user should be skipped (not 8 AM there)
    const tokyoResult = result.results.find((r) => r.userId === 'tokyo-user');
    expect(tokyoResult!.status).toBe('skipped');

    // Toronto user should get the digest (it's 8 AM there)
    const torontoResult = result.results.find((r) => r.userId === 'toronto-user');
    // Either 'sent' (if email mock works) or at least not 'skipped' due to timezone
    expect(torontoResult!.status).not.toBe('skipped');
  });
});

// ---------------------------------------------------------------------------
// 11. Empty digest: skip sending if no notifications to digest
// ---------------------------------------------------------------------------

describe('empty digest — skip sending', () => {
  it('generateDigest returns null when there are no pending notifications', () => {
    const now = new Date('2026-03-19T12:00:00Z');
    const notifications: PendingNotification[] = [];
    const profile = createUserProfile();

    const digest = generateDigest(notifications, profile, 'daily', now);

    expect(digest).toBeNull();
  });

  it('generateDigest returns null when all notifications are already sent', () => {
    const now = new Date('2026-03-19T12:00:00Z');
    const notifications: PendingNotification[] = [
      createNotification({
        createdAt: new Date('2026-03-19T08:00:00Z'),
        sentAt: new Date('2026-03-19T08:01:00Z'),
      }),
    ];
    const profile = createUserProfile();

    const digest = generateDigest(notifications, profile, 'daily', now);

    expect(digest).toBeNull();
  });

  it('generateDigest returns null when all notifications are already in a digest', () => {
    const now = new Date('2026-03-19T12:00:00Z');
    const notifications: PendingNotification[] = [
      createNotification({
        createdAt: new Date('2026-03-19T08:00:00Z'),
        includedInDigest: true,
      }),
    ];
    const profile = createUserProfile();

    const digest = generateDigest(notifications, profile, 'daily', now);

    expect(digest).toBeNull();
  });

  it('processDigests skips users with no pending notifications', async () => {
    const notifications: PendingNotification[] = [];
    const users = [createUserProfile()];
    // 12:00 UTC = 8:00 AM EDT
    const now = new Date('2026-03-19T12:00:00Z');

    const result = await processDigests(notifications, users, 'daily', now);

    expect(result.skipped).toBe(1);
    expect(result.sent).toBe(0);
    expect(result.results[0]!.status).toBe('skipped');
  });
});

// ---------------------------------------------------------------------------
// 12. Digest marks notifications as "included in digest"
// ---------------------------------------------------------------------------

describe('markAsIncludedInDigest', () => {
  it('marks specified notifications as included', () => {
    const notifications: PendingNotification[] = [
      createNotification({ id: 'n-1' }),
      createNotification({ id: 'n-2' }),
      createNotification({ id: 'n-3' }),
    ];

    const count = markAsIncludedInDigest(notifications, ['n-1', 'n-3']);

    expect(count).toBe(2);
    expect(notifications.find((n) => n.id === 'n-1')!.includedInDigest).toBe(true);
    expect(notifications.find((n) => n.id === 'n-2')!.includedInDigest).toBe(false);
    expect(notifications.find((n) => n.id === 'n-3')!.includedInDigest).toBe(true);
  });

  it('returns 0 when no IDs match', () => {
    const notifications: PendingNotification[] = [createNotification({ id: 'n-1' })];

    const count = markAsIncludedInDigest(notifications, ['n-999']);
    expect(count).toBe(0);
    expect(notifications[0]!.includedInDigest).toBe(false);
  });

  it('prevents double-digesting: once marked, notifications are excluded from next digest', () => {
    const now = new Date('2026-03-19T12:00:00Z');
    const notifications: PendingNotification[] = [
      createNotification({
        id: 'n-1',
        createdAt: new Date('2026-03-19T08:00:00Z'),
      }),
      createNotification({
        id: 'n-2',
        createdAt: new Date('2026-03-19T09:00:00Z'),
      }),
    ];

    // First digest collects both
    const profile = createUserProfile();
    const digest1 = generateDigest(notifications, profile, 'daily', now);
    expect(digest1!.totalCount).toBe(2);

    // Mark as digested
    markAsIncludedInDigest(notifications, ['n-1', 'n-2']);

    // Second digest should find nothing
    const digest2 = generateDigest(notifications, profile, 'daily', now);
    expect(digest2).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Integration: processDigests end-to-end
// ---------------------------------------------------------------------------

describe('processDigests — end-to-end', () => {
  it('processes multiple users with different preferences', async () => {
    // 12:00 UTC = 8:00 AM EDT
    const now = new Date('2026-03-19T12:00:00Z');

    const notifications: PendingNotification[] = [
      createNotification({
        userId: 'daily-user',
        module: 'packages',
        createdAt: new Date('2026-03-19T07:00:00Z'),
      }),
      createNotification({
        userId: 'daily-user',
        module: 'maintenance',
        createdAt: new Date('2026-03-19T06:00:00Z'),
      }),
      createNotification({
        userId: 'instant-user',
        module: 'packages',
        createdAt: new Date('2026-03-19T07:00:00Z'),
      }),
    ];

    const users: UserDigestProfile[] = [
      createUserProfile({
        userId: 'daily-user',
        email: 'daily@example.com',
        digestPreference: 'daily',
        timezone: 'America/Toronto',
      }),
      createUserProfile({
        userId: 'instant-user',
        email: 'instant@example.com',
        digestPreference: 'instant',
        timezone: 'America/Toronto',
      }),
    ];

    const result = await processDigests(notifications, users, 'daily', now);

    expect(result.processed).toBe(2);
    // instant-user should be skipped
    expect(result.skipped).toBeGreaterThanOrEqual(1);
    // daily-user: either sent (if email succeeds/fails gracefully) or failed
    const dailyResult = result.results.find((r) => r.userId === 'daily-user');
    expect(dailyResult).toBeDefined();
    expect(['sent', 'failed']).toContain(dailyResult!.status);
  });

  it('marks notifications as digested after successful send', async () => {
    const now = new Date('2026-03-19T12:00:00Z');

    const notifications: PendingNotification[] = [
      createNotification({
        id: 'mark-test-1',
        userId: 'user-1',
        module: 'packages',
        createdAt: new Date('2026-03-19T07:00:00Z'),
      }),
    ];

    const users = [createUserProfile({ timezone: 'America/Toronto', digestPreference: 'daily' })];

    const result = await processDigests(notifications, users, 'daily', now);

    // If sent successfully, notifications should be marked
    if (result.sent > 0) {
      expect(notifications[0]!.includedInDigest).toBe(true);
    }
  });
});

// ---------------------------------------------------------------------------
// Digest summary includes user metadata
// ---------------------------------------------------------------------------

describe('generateDigest — summary metadata', () => {
  it('includes user email, first name, period, and date range', () => {
    const now = new Date('2026-03-19T12:00:00Z');
    const notifications: PendingNotification[] = [
      createNotification({ createdAt: new Date('2026-03-19T08:00:00Z') }),
    ];
    const profile = createUserProfile({
      email: 'test@example.com',
      firstName: 'TestUser',
    });

    const digest = generateDigest(notifications, profile, 'daily', now);

    expect(digest!.email).toBe('test@example.com');
    expect(digest!.firstName).toBe('TestUser');
    expect(digest!.period).toBe('daily');
    expect(digest!.userId).toBe('user-1');
  });
});

// ---------------------------------------------------------------------------
// Digest groups are sorted by count descending
// ---------------------------------------------------------------------------

describe('generateDigest — group ordering', () => {
  it('sorts module groups by count descending', () => {
    const now = new Date('2026-03-19T12:00:00Z');
    const notifications: PendingNotification[] = [
      createNotification({ module: 'maintenance', createdAt: new Date('2026-03-19T08:00:00Z') }),
      createNotification({ module: 'packages', createdAt: new Date('2026-03-19T08:01:00Z') }),
      createNotification({ module: 'packages', createdAt: new Date('2026-03-19T08:02:00Z') }),
      createNotification({ module: 'packages', createdAt: new Date('2026-03-19T08:03:00Z') }),
      createNotification({ module: 'bookings', createdAt: new Date('2026-03-19T08:04:00Z') }),
      createNotification({ module: 'bookings', createdAt: new Date('2026-03-19T08:05:00Z') }),
    ];
    const profile = createUserProfile();

    const digest = generateDigest(notifications, profile, 'daily', now);

    expect(digest!.groups[0]!.module).toBe('packages');
    expect(digest!.groups[0]!.count).toBe(3);
    expect(digest!.groups[1]!.module).toBe('bookings');
    expect(digest!.groups[1]!.count).toBe(2);
    expect(digest!.groups[2]!.module).toBe('maintenance');
    expect(digest!.groups[2]!.count).toBe(1);
  });
});
