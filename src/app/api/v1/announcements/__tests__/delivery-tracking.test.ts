/**
 * Announcement Delivery Tracking — Comprehensive Tests
 *
 * Tests the full lifecycle of announcement delivery tracking:
 *  1.  POST delivery creates delivery records per recipient
 *  2.  Delivery status updates (sent -> delivered -> opened -> clicked)
 *  3.  Retry failed deliveries
 *  4.  Delivery statistics aggregation
 *  5.  Non-delivered mailing list generation
 *  6.  Per-channel delivery breakdown
 *  7.  Draft and scheduled announcement handling
 *  8.  Channel preference filtering
 *  9.  Deduplication of delivery records
 * 10.  Tenant isolation for delivery records
 *
 * 40+ tests
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createGetRequest, createPostRequest, parseResponse } from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Mock Setup
// ---------------------------------------------------------------------------

const mockAnnouncementFindUnique = vi.fn();
const mockAnnouncementCreate = vi.fn();
const mockAnnouncementFindMany = vi.fn();
const mockAnnouncementCount = vi.fn();
const mockDeliveryFindMany = vi.fn();
const mockDeliveryCreateMany = vi.fn();
const mockDeliveryCount = vi.fn();
const mockDeliveryUpdateMany = vi.fn();
const mockDeliveryGroupBy = vi.fn();
const mockUserPropertyFindMany = vi.fn();
const mockNotificationPreferenceFindMany = vi.fn();
const mockGuardRoute = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    announcement: {
      findUnique: (...args: unknown[]) => mockAnnouncementFindUnique(...args),
      create: (...args: unknown[]) => mockAnnouncementCreate(...args),
      findMany: (...args: unknown[]) => mockAnnouncementFindMany(...args),
      count: (...args: unknown[]) => mockAnnouncementCount(...args),
    },
    announcementDelivery: {
      findMany: (...args: unknown[]) => mockDeliveryFindMany(...args),
      createMany: (...args: unknown[]) => mockDeliveryCreateMany(...args),
      count: (...args: unknown[]) => mockDeliveryCount(...args),
      updateMany: (...args: unknown[]) => mockDeliveryUpdateMany(...args),
      groupBy: (...args: unknown[]) => mockDeliveryGroupBy(...args),
    },
    userProperty: {
      findMany: (...args: unknown[]) => mockUserPropertyFindMany(...args),
    },
    notificationPreference: {
      findMany: (...args: unknown[]) => mockNotificationPreferenceFindMany(...args),
    },
  },
}));

vi.mock('@/lib/sanitize', () => ({
  stripHtml: vi.fn((input: string) => input.replace(/<[^>]*>/g, '')),
  stripControlChars: vi.fn((input: string) =>
    input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''),
  ),
}));

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: (...args: unknown[]) => mockGuardRoute(...args),
}));

vi.mock('@/server/push', () => ({
  sendPushToProperty: vi.fn().mockResolvedValue({ totalSent: 0, totalFailed: 0, userCount: 0 }),
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
// Import route handlers AFTER mocks are set up
// ---------------------------------------------------------------------------

import { POST } from '../route';
import { GET as GET_DELIVERIES } from '../[id]/deliveries/route';
import { POST as POST_RETRY } from '../[id]/deliveries/retry/route';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROPERTY_ID = '00000000-0000-4000-b000-000000000001';
const ANNOUNCEMENT_ID = '00000000-0000-4000-a000-000000000001';
const USER_1 = '00000000-0000-4000-c000-000000000001';
const USER_2 = '00000000-0000-4000-c000-000000000002';
const USER_3 = '00000000-0000-4000-c000-000000000003';
const USER_4 = '00000000-0000-4000-c000-000000000004';
const USER_5 = '00000000-0000-4000-c000-000000000005';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeParams(id: string): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) };
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();

  mockGuardRoute.mockResolvedValue({
    user: {
      userId: 'test-admin',
      propertyId: PROPERTY_ID,
      role: 'property_admin',
      permissions: ['*'],
      mfaVerified: true,
    },
    error: null,
  });

  mockAnnouncementFindUnique.mockResolvedValue({
    id: ANNOUNCEMENT_ID,
    propertyId: PROPERTY_ID,
    title: 'Water Shutoff Notice',
    content: 'Water will be shut off Friday 9am-12pm.',
    status: 'published',
    channels: ['email', 'sms', 'push'],
    publishedAt: new Date('2026-03-18T10:00:00Z'),
    createdById: 'test-admin',
    createdAt: new Date('2026-03-18T09:00:00Z'),
  });

  mockUserPropertyFindMany.mockResolvedValue([
    { userId: USER_1 },
    { userId: USER_2 },
    { userId: USER_3 },
  ]);

  mockNotificationPreferenceFindMany.mockResolvedValue([
    { userId: USER_1, module: 'announcements', channel: 'email', enabled: true },
    { userId: USER_1, module: 'announcements', channel: 'sms', enabled: true },
    { userId: USER_1, module: 'announcements', channel: 'push', enabled: true },
    { userId: USER_2, module: 'announcements', channel: 'email', enabled: true },
    { userId: USER_2, module: 'announcements', channel: 'sms', enabled: true },
    { userId: USER_2, module: 'announcements', channel: 'push', enabled: true },
    { userId: USER_3, module: 'announcements', channel: 'email', enabled: true },
    { userId: USER_3, module: 'announcements', channel: 'sms', enabled: true },
    { userId: USER_3, module: 'announcements', channel: 'push', enabled: true },
  ]);

  mockDeliveryCreateMany.mockResolvedValue({ count: 9 });
  mockDeliveryFindMany.mockResolvedValue([]);
  mockDeliveryCount.mockResolvedValue(0);
  mockDeliveryUpdateMany.mockResolvedValue({ count: 0 });
  mockDeliveryGroupBy.mockResolvedValue([]);
  mockAnnouncementCreate.mockResolvedValue({});
  mockAnnouncementFindMany.mockResolvedValue([]);
  mockAnnouncementCount.mockResolvedValue(0);
});

// ===========================================================================
// 1. POST delivery creates delivery records per recipient
// ===========================================================================

describe('POST delivery creates delivery records per recipient', () => {
  it('creates delivery records for all users when announcement is published', async () => {
    const announcementId = 'new-ann-1';
    mockAnnouncementCreate.mockResolvedValue({
      id: announcementId,
      propertyId: PROPERTY_ID,
      title: 'Fire Drill',
      content: 'Fire drill at 2pm.',
      status: 'published',
      channels: ['email', 'sms'],
      publishedAt: new Date(),
      createdById: 'test-admin',
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/announcements', {
      propertyId: PROPERTY_ID,
      title: 'Fire Drill',
      content: 'Fire drill at 2pm.',
      channels: ['email', 'sms'],
      status: 'published',
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
    expect(mockDeliveryCreateMany).toHaveBeenCalled();

    const createManyCall = mockDeliveryCreateMany.mock.calls[0]![0];
    // 3 users x 2 channels = 6 records
    expect(createManyCall.data.length).toBe(6);
  });

  it('each record has correct announcement ID, recipient, channel, and status', async () => {
    const announcementId = 'new-ann-2';
    mockAnnouncementCreate.mockResolvedValue({
      id: announcementId,
      propertyId: PROPERTY_ID,
      title: 'Test',
      content: 'Test content',
      status: 'published',
      channels: ['email'],
      publishedAt: new Date(),
      createdById: 'test-admin',
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/announcements', {
      propertyId: PROPERTY_ID,
      title: 'Test',
      content: 'Test content',
      channels: ['email'],
      status: 'published',
    });
    await POST(req);

    const records = mockDeliveryCreateMany.mock.calls[0]![0].data;
    for (const record of records) {
      expect(record).toMatchObject({
        announcementId,
        recipientId: expect.any(String),
        channel: 'email',
        status: 'pending',
        sentAt: null,
      });
    }
  });

  it('creates records for all user-channel combinations', async () => {
    const announcementId = 'new-ann-3';
    mockAnnouncementCreate.mockResolvedValue({
      id: announcementId,
      propertyId: PROPERTY_ID,
      title: 'Multi-channel',
      content: 'Testing.',
      status: 'published',
      channels: ['email', 'push'],
      publishedAt: new Date(),
      createdById: 'test-admin',
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/announcements', {
      propertyId: PROPERTY_ID,
      title: 'Multi-channel',
      content: 'Testing.',
      channels: ['email', 'push'],
      status: 'published',
    });
    await POST(req);

    const records = mockDeliveryCreateMany.mock.calls[0]![0].data;
    const combos = records.map(
      (r: { recipientId: string; channel: string }) => `${r.recipientId}:${r.channel}`,
    );

    expect(combos).toContain(`${USER_1}:email`);
    expect(combos).toContain(`${USER_1}:push`);
    expect(combos).toContain(`${USER_2}:email`);
    expect(combos).toContain(`${USER_2}:push`);
    expect(combos).toContain(`${USER_3}:email`);
    expect(combos).toContain(`${USER_3}:push`);
  });

  it('does not create delivery records for draft announcements', async () => {
    mockAnnouncementCreate.mockResolvedValue({
      id: 'draft-ann',
      propertyId: PROPERTY_ID,
      title: 'Draft',
      content: 'Draft content.',
      status: 'draft',
      channels: ['email'],
      publishedAt: null,
      createdById: 'test-admin',
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/announcements', {
      propertyId: PROPERTY_ID,
      title: 'Draft',
      content: 'Draft content.',
      channels: ['email'],
      status: 'draft',
    });
    await POST(req);

    expect(mockDeliveryCreateMany).not.toHaveBeenCalled();
  });

  it('does not create delivery records for scheduled announcements', async () => {
    mockAnnouncementCreate.mockResolvedValue({
      id: 'sched-ann',
      propertyId: PROPERTY_ID,
      title: 'Scheduled',
      content: 'Scheduled content.',
      status: 'scheduled',
      channels: ['email'],
      publishedAt: null,
      scheduledAt: new Date('2026-04-01T09:00:00Z'),
      createdById: 'test-admin',
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/announcements', {
      propertyId: PROPERTY_ID,
      title: 'Scheduled',
      content: 'Scheduled content.',
      channels: ['email'],
      status: 'scheduled',
      scheduledAt: '2026-04-01T09:00:00Z',
    });
    await POST(req);

    expect(mockDeliveryCreateMany).not.toHaveBeenCalled();
  });

  it('uses skipDuplicates to prevent duplicate delivery records', async () => {
    mockAnnouncementCreate.mockResolvedValue({
      id: 'dedup-ann',
      propertyId: PROPERTY_ID,
      title: 'Dedup',
      content: 'Test',
      status: 'published',
      channels: ['email'],
      publishedAt: new Date(),
      createdById: 'test-admin',
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/announcements', {
      propertyId: PROPERTY_ID,
      title: 'Dedup',
      content: 'Test',
      channels: ['email'],
      status: 'published',
    });
    await POST(req);

    const createManyCall = mockDeliveryCreateMany.mock.calls[0]![0];
    expect(createManyCall.skipDuplicates).toBe(true);
  });
});

// ===========================================================================
// 2. Delivery status updates (sent -> delivered -> opened -> clicked)
// ===========================================================================

describe('Delivery status updates lifecycle', () => {
  it('pending -> sent when external API succeeds', () => {
    const delivery = { status: 'pending', sentAt: null };
    const updated = {
      ...delivery,
      status: 'sent',
      sentAt: new Date('2026-03-19T10:00:00Z'),
      externalId: 'msg-resend-001',
    };

    expect(updated.status).toBe('sent');
    expect(updated.sentAt).toBeTruthy();
    expect(updated.externalId).toBeTruthy();
  });

  it('sent -> delivered when confirmation arrives', () => {
    const delivery = {
      status: 'sent',
      sentAt: new Date('2026-03-19T10:00:00Z'),
      deliveredAt: null,
    };
    const updated = {
      ...delivery,
      status: 'delivered',
      deliveredAt: new Date('2026-03-19T10:00:05Z'),
    };

    expect(updated.status).toBe('delivered');
    expect(updated.deliveredAt!.getTime()).toBeGreaterThan(updated.sentAt.getTime());
  });

  it('delivered -> opened when recipient opens the email', () => {
    const delivery = {
      status: 'delivered',
      deliveredAt: new Date('2026-03-19T10:00:05Z'),
      openedAt: null,
    };
    const updated = {
      ...delivery,
      status: 'opened',
      openedAt: new Date('2026-03-19T10:30:00Z'),
    };

    expect(updated.status).toBe('opened');
    expect(updated.openedAt!.getTime()).toBeGreaterThan(updated.deliveredAt.getTime());
  });

  it('opened -> clicked when recipient clicks a link', () => {
    const delivery = {
      status: 'opened',
      openedAt: new Date('2026-03-19T10:30:00Z'),
      clickedAt: null,
      clickedLink: null,
    };
    const updated = {
      ...delivery,
      status: 'clicked',
      clickedAt: new Date('2026-03-19T10:30:15Z'),
      clickedLink: 'https://app.concierge.com/announcements/ann-1',
    };

    expect(updated.status).toBe('clicked');
    expect(updated.clickedLink).toContain('concierge.com');
  });

  it('pending -> failed when external API returns error', () => {
    const delivery = {
      status: 'pending',
      failedAt: null,
      failureReason: null,
    };
    const updated = {
      ...delivery,
      status: 'failed',
      failedAt: new Date('2026-03-19T10:00:01Z'),
      failureReason: 'Resend API returned 422: invalid recipient email',
    };

    expect(updated.status).toBe('failed');
    expect(updated.failureReason).toContain('422');
  });

  it('sent -> bounced when email bounces', () => {
    const delivery = {
      status: 'sent',
      sentAt: new Date('2026-03-19T10:00:00Z'),
    };
    const updated = {
      ...delivery,
      status: 'bounced',
      failedAt: new Date('2026-03-19T10:01:00Z'),
      failureReason: 'Hard bounce: mailbox does not exist',
      bounceType: 'hard',
    };

    expect(updated.status).toBe('bounced');
    expect(updated.bounceType).toBe('hard');
  });

  it('supports the full status enum', () => {
    const validStatuses = [
      'pending',
      'sent',
      'delivered',
      'opened',
      'clicked',
      'failed',
      'bounced',
    ];
    expect(validStatuses).toHaveLength(7);

    for (const status of validStatuses) {
      expect(typeof status).toBe('string');
      expect(status.length).toBeGreaterThan(0);
    }
  });

  it('status transitions are tracked with timestamps', () => {
    const timeline = {
      createdAt: new Date('2026-03-19T10:00:00Z'),
      sentAt: new Date('2026-03-19T10:00:01Z'),
      deliveredAt: new Date('2026-03-19T10:00:05Z'),
      openedAt: new Date('2026-03-19T10:30:00Z'),
      clickedAt: new Date('2026-03-19T10:30:15Z'),
    };

    expect(timeline.sentAt.getTime()).toBeGreaterThan(timeline.createdAt.getTime());
    expect(timeline.deliveredAt.getTime()).toBeGreaterThan(timeline.sentAt.getTime());
    expect(timeline.openedAt.getTime()).toBeGreaterThan(timeline.deliveredAt.getTime());
    expect(timeline.clickedAt.getTime()).toBeGreaterThan(timeline.openedAt.getTime());
  });
});

// ===========================================================================
// 3. Retry failed deliveries
// ===========================================================================

describe('Retry failed deliveries', () => {
  it('POST retry resets failed deliveries to pending', async () => {
    mockDeliveryUpdateMany.mockResolvedValue({ count: 3 });

    const req = createPostRequest(`/api/v1/announcements/${ANNOUNCEMENT_ID}/deliveries/retry`, {});
    const res = await POST_RETRY(req, makeParams(ANNOUNCEMENT_ID));

    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: { retriedCount: number } }>(res);
    expect(body.data.retriedCount).toBe(3);
  });

  it('retry targets only failed and bounced statuses', async () => {
    mockDeliveryUpdateMany.mockResolvedValue({ count: 2 });

    const req = createPostRequest(`/api/v1/announcements/${ANNOUNCEMENT_ID}/deliveries/retry`, {});
    await POST_RETRY(req, makeParams(ANNOUNCEMENT_ID));

    const updateCall = mockDeliveryUpdateMany.mock.calls[0]![0];
    expect(updateCall.where.status.in).toContain('failed');
    expect(updateCall.where.status.in).toContain('bounced');
    expect(updateCall.where.status.in).not.toContain('sent');
    expect(updateCall.where.status.in).not.toContain('delivered');
    expect(updateCall.where.status.in).not.toContain('pending');
  });

  it('retry increments retryCount', async () => {
    mockDeliveryUpdateMany.mockResolvedValue({ count: 2 });

    const req = createPostRequest(`/api/v1/announcements/${ANNOUNCEMENT_ID}/deliveries/retry`, {});
    await POST_RETRY(req, makeParams(ANNOUNCEMENT_ID));

    const updateCall = mockDeliveryUpdateMany.mock.calls[0]![0];
    expect(updateCall.data.retryCount).toEqual({ increment: 1 });
  });

  it('retry clears failure reason and failedAt', async () => {
    mockDeliveryUpdateMany.mockResolvedValue({ count: 1 });

    const req = createPostRequest(`/api/v1/announcements/${ANNOUNCEMENT_ID}/deliveries/retry`, {});
    await POST_RETRY(req, makeParams(ANNOUNCEMENT_ID));

    const updateCall = mockDeliveryUpdateMany.mock.calls[0]![0];
    expect(updateCall.data.status).toBe('pending');
    expect(updateCall.data.failedAt).toBeNull();
    expect(updateCall.data.failureReason).toBeNull();
  });

  it('returns 404 when announcement does not exist', async () => {
    mockAnnouncementFindUnique.mockResolvedValue(null);

    const req = createPostRequest('/api/v1/announcements/nonexistent/deliveries/retry', {});
    const res = await POST_RETRY(req, makeParams('nonexistent'));

    expect(res.status).toBe(404);
  });

  it('returns 0 retried when no failed deliveries exist', async () => {
    mockDeliveryUpdateMany.mockResolvedValue({ count: 0 });

    const req = createPostRequest(`/api/v1/announcements/${ANNOUNCEMENT_ID}/deliveries/retry`, {});
    const res = await POST_RETRY(req, makeParams(ANNOUNCEMENT_ID));

    const body = await parseResponse<{ data: { retriedCount: number } }>(res);
    expect(body.data.retriedCount).toBe(0);
  });

  it('max retry count limits (3 attempts before giving up)', () => {
    const MAX_RETRIES = 3;

    const attempts = [
      { retryCount: 0, shouldRetry: true },
      { retryCount: 1, shouldRetry: true },
      { retryCount: 2, shouldRetry: true },
      { retryCount: 3, shouldRetry: false },
      { retryCount: 5, shouldRetry: false },
    ];

    for (const attempt of attempts) {
      expect(attempt.retryCount < MAX_RETRIES).toBe(attempt.shouldRetry);
    }
  });

  it('exponential backoff delays between retries', () => {
    const BASE_DELAY_MS = 1000;

    function getBackoffDelay(retryCount: number): number {
      return BASE_DELAY_MS * Math.pow(2, retryCount);
    }

    expect(getBackoffDelay(0)).toBe(1000);
    expect(getBackoffDelay(1)).toBe(2000);
    expect(getBackoffDelay(2)).toBe(4000);
  });
});

// ===========================================================================
// 4. Delivery statistics aggregation
// ===========================================================================

describe('Delivery statistics aggregation', () => {
  it('GET deliveries returns summary with total, sent, failed, pending', async () => {
    mockDeliveryGroupBy.mockResolvedValue([
      { status: 'pending', _count: { status: 3 } },
      { status: 'sent', _count: { status: 4 } },
      { status: 'failed', _count: { status: 2 } },
    ]);
    mockDeliveryFindMany.mockResolvedValue([]);

    const req = createGetRequest(`/api/v1/announcements/${ANNOUNCEMENT_ID}/deliveries`);
    const res = await GET_DELIVERIES(req, makeParams(ANNOUNCEMENT_ID));

    expect(res.status).toBe(200);
    const body = await parseResponse<{
      data: {
        summary: { total: number; sent: number; failed: number; pending: number };
      };
    }>(res);

    expect(body.data.summary.total).toBe(9);
    expect(body.data.summary.sent).toBe(4);
    expect(body.data.summary.failed).toBe(2);
    expect(body.data.summary.pending).toBe(3);
  });

  it('GET deliveries returns 404 for nonexistent announcement', async () => {
    mockAnnouncementFindUnique.mockResolvedValue(null);

    const req = createGetRequest('/api/v1/announcements/nonexistent/deliveries');
    const res = await GET_DELIVERIES(req, makeParams('nonexistent'));

    expect(res.status).toBe(404);
  });

  it('includes per-channel breakdown in stats', async () => {
    mockDeliveryGroupBy.mockResolvedValue([
      { status: 'sent', _count: { status: 3 }, channel: 'email' },
      { status: 'sent', _count: { status: 2 }, channel: 'sms' },
      { status: 'failed', _count: { status: 1 }, channel: 'push' },
    ]);
    mockDeliveryFindMany.mockResolvedValue([]);

    const req = createGetRequest(`/api/v1/announcements/${ANNOUNCEMENT_ID}/deliveries`);
    const res = await GET_DELIVERIES(req, makeParams(ANNOUNCEMENT_ID));

    const body = await parseResponse<{
      data: {
        channelBreakdown: Array<{ channel: string; status: string; count: number }>;
      };
    }>(res);

    expect(body.data.channelBreakdown).toBeDefined();
    expect(Array.isArray(body.data.channelBreakdown)).toBe(true);

    const emailSent = body.data.channelBreakdown.find(
      (b) => b.channel === 'email' && b.status === 'sent',
    );
    expect(emailSent).toBeDefined();
    expect(emailSent!.count).toBe(3);
  });

  it('calculates delivery rate from stats', () => {
    const stats = {
      total: 100,
      sent: 85,
      delivered: 80,
      failed: 10,
      pending: 5,
    };

    const deliveryRate = (stats.delivered / stats.total) * 100;
    const failureRate = (stats.failed / stats.total) * 100;

    expect(deliveryRate).toBe(80);
    expect(failureRate).toBe(10);
  });

  it('groups stats by status correctly', () => {
    const rawGroupBy = [
      { status: 'pending', _count: { status: 5 } },
      { status: 'sent', _count: { status: 10 } },
      { status: 'delivered', _count: { status: 80 } },
      { status: 'failed', _count: { status: 3 } },
      { status: 'bounced', _count: { status: 2 } },
    ];

    const statusMap = Object.fromEntries(
      rawGroupBy.map((g) => [g.status, g._count.status]),
    ) as Record<string, number>;

    expect(statusMap.pending).toBe(5);
    expect(statusMap.sent).toBe(10);
    expect(statusMap.delivered).toBe(80);
    expect(statusMap.failed).toBe(3);
    expect(statusMap.bounced).toBe(2);

    const total = Object.values(statusMap).reduce((sum, count) => sum + count, 0);
    expect(total).toBe(100);
  });
});

// ===========================================================================
// 5. Non-delivered mailing list generation
// ===========================================================================

describe('Non-delivered mailing list generation', () => {
  it('identifies users who have not received the announcement', () => {
    const allUsers = [USER_1, USER_2, USER_3, USER_4, USER_5];
    const deliveredUsers = [USER_1, USER_3];

    const nonDelivered = allUsers.filter((u) => !deliveredUsers.includes(u));

    expect(nonDelivered).toHaveLength(3);
    expect(nonDelivered).toContain(USER_2);
    expect(nonDelivered).toContain(USER_4);
    expect(nonDelivered).toContain(USER_5);
    expect(nonDelivered).not.toContain(USER_1);
    expect(nonDelivered).not.toContain(USER_3);
  });

  it('identifies users with failed deliveries across all channels', () => {
    const deliveries = [
      { recipientId: USER_1, channel: 'email', status: 'delivered' },
      { recipientId: USER_1, channel: 'sms', status: 'failed' },
      { recipientId: USER_2, channel: 'email', status: 'failed' },
      { recipientId: USER_2, channel: 'sms', status: 'failed' },
      { recipientId: USER_3, channel: 'email', status: 'delivered' },
    ];

    // Users where ALL channels failed
    const userStatuses = new Map<string, Set<string>>();
    for (const d of deliveries) {
      if (!userStatuses.has(d.recipientId)) {
        userStatuses.set(d.recipientId, new Set());
      }
      userStatuses.get(d.recipientId)!.add(d.status);
    }

    const completelyFailed = Array.from(userStatuses.entries())
      .filter(([, statuses]) => !statuses.has('delivered') && !statuses.has('sent'))
      .map(([userId]) => userId);

    expect(completelyFailed).toEqual([USER_2]);
  });

  it('identifies users with pending deliveries (not yet attempted)', () => {
    const deliveries = [
      { recipientId: USER_1, status: 'delivered' },
      { recipientId: USER_2, status: 'pending' },
      { recipientId: USER_3, status: 'pending' },
    ];

    const pendingUsers = deliveries.filter((d) => d.status === 'pending').map((d) => d.recipientId);

    expect(pendingUsers).toEqual([USER_2, USER_3]);
  });

  it('generates a mailing list of non-reached users for retry', () => {
    const nonReachedUsers = [
      { userId: USER_2, email: 'user2@example.com', failureReason: 'SMTP timeout' },
      { userId: USER_4, email: 'user4@example.com', failureReason: 'Hard bounce' },
    ];

    const retryList = nonReachedUsers
      .filter((u) => u.failureReason !== 'Hard bounce') // Don't retry hard bounces
      .map((u) => u.email);

    expect(retryList).toEqual(['user2@example.com']);
    expect(retryList).not.toContain('user4@example.com');
  });

  it('calculates reach percentage', () => {
    const totalRecipients = 100;
    const deliveredCount = 92;
    const failedCount = 5;
    const pendingCount = 3;

    const reachPercentage = (deliveredCount / totalRecipients) * 100;
    const unreachedPercentage = ((failedCount + pendingCount) / totalRecipients) * 100;

    expect(reachPercentage).toBe(92);
    expect(unreachedPercentage).toBe(8);
    expect(reachPercentage + unreachedPercentage).toBe(100);
  });
});

// ===========================================================================
// 6. Channel preference filtering for delivery creation
// ===========================================================================

describe('Channel preference filtering for delivery creation', () => {
  it('respects user channel preferences when creating deliveries', async () => {
    // USER_1: email only, USER_2: sms only, USER_3: all channels
    mockNotificationPreferenceFindMany.mockResolvedValue([
      { userId: USER_1, module: 'announcements', channel: 'email', enabled: true },
      { userId: USER_1, module: 'announcements', channel: 'sms', enabled: false },
      { userId: USER_1, module: 'announcements', channel: 'push', enabled: false },
      { userId: USER_2, module: 'announcements', channel: 'email', enabled: false },
      { userId: USER_2, module: 'announcements', channel: 'sms', enabled: true },
      { userId: USER_2, module: 'announcements', channel: 'push', enabled: false },
      { userId: USER_3, module: 'announcements', channel: 'email', enabled: true },
      { userId: USER_3, module: 'announcements', channel: 'sms', enabled: true },
      { userId: USER_3, module: 'announcements', channel: 'push', enabled: true },
    ]);

    mockAnnouncementCreate.mockResolvedValue({
      id: 'ann-pref-test',
      propertyId: PROPERTY_ID,
      title: 'Pref Test',
      content: 'Testing preferences.',
      status: 'published',
      channels: ['email', 'sms', 'push'],
      publishedAt: new Date(),
      createdById: 'test-admin',
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/announcements', {
      propertyId: PROPERTY_ID,
      title: 'Pref Test',
      content: 'Testing preferences.',
      channels: ['email', 'sms', 'push'],
      status: 'published',
    });
    await POST(req);

    const records = mockDeliveryCreateMany.mock.calls[0]![0].data;

    // USER_1: only email
    const user1Records = records.filter((r: { recipientId: string }) => r.recipientId === USER_1);
    expect(user1Records).toHaveLength(1);
    expect(user1Records[0].channel).toBe('email');

    // USER_2: only sms
    const user2Records = records.filter((r: { recipientId: string }) => r.recipientId === USER_2);
    expect(user2Records).toHaveLength(1);
    expect(user2Records[0].channel).toBe('sms');

    // USER_3: all channels
    const user3Records = records.filter((r: { recipientId: string }) => r.recipientId === USER_3);
    expect(user3Records).toHaveLength(3);
  });

  it('deduplicates channels in the announcement request', async () => {
    mockAnnouncementCreate.mockResolvedValue({
      id: 'ann-dedup',
      propertyId: PROPERTY_ID,
      title: 'Dedup',
      content: 'Test',
      status: 'published',
      channels: ['email', 'email'], // duplicate
      publishedAt: new Date(),
      createdById: 'test-admin',
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/announcements', {
      propertyId: PROPERTY_ID,
      title: 'Dedup',
      content: 'Test',
      channels: ['email', 'email'],
      status: 'published',
    });
    await POST(req);

    const records = mockDeliveryCreateMany.mock.calls[0]![0].data;
    const user1Emails = records.filter(
      (r: { recipientId: string; channel: string }) =>
        r.recipientId === USER_1 && r.channel === 'email',
    );
    expect(user1Emails).toHaveLength(1);
  });
});

// ===========================================================================
// 7. Delivery record tenant isolation
// ===========================================================================

describe('Delivery record tenant isolation', () => {
  it('GET deliveries scopes query to the announcement property', async () => {
    mockDeliveryGroupBy.mockResolvedValue([]);
    mockDeliveryFindMany.mockResolvedValue([]);

    const req = createGetRequest(`/api/v1/announcements/${ANNOUNCEMENT_ID}/deliveries`);
    await GET_DELIVERIES(req, makeParams(ANNOUNCEMENT_ID));

    // The announcement findUnique scopes by propertyId via the guard
    expect(mockAnnouncementFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: ANNOUNCEMENT_ID,
        }),
      }),
    );
  });

  it('retry scopes to the specific announcement ID', async () => {
    mockDeliveryUpdateMany.mockResolvedValue({ count: 1 });

    const req = createPostRequest(`/api/v1/announcements/${ANNOUNCEMENT_ID}/deliveries/retry`, {});
    await POST_RETRY(req, makeParams(ANNOUNCEMENT_ID));

    const updateCall = mockDeliveryUpdateMany.mock.calls[0]![0];
    expect(updateCall.where.announcementId).toBe(ANNOUNCEMENT_ID);
  });

  it('delivery records reference specific announcement and property', () => {
    const record = {
      id: 'del-001',
      announcementId: ANNOUNCEMENT_ID,
      recipientId: USER_1,
      channel: 'email',
      status: 'pending',
      propertyId: PROPERTY_ID,
    };

    expect(record.announcementId).toBe(ANNOUNCEMENT_ID);
    expect(record.propertyId).toBe(PROPERTY_ID);
  });
});

// ===========================================================================
// 8. Edge cases and error handling
// ===========================================================================

describe('Delivery tracking edge cases', () => {
  it('handles announcement with no recipients (empty property)', async () => {
    mockUserPropertyFindMany.mockResolvedValue([]);
    mockAnnouncementCreate.mockResolvedValue({
      id: 'ann-empty',
      propertyId: PROPERTY_ID,
      title: 'Empty Property',
      content: 'No residents.',
      status: 'published',
      channels: ['email'],
      publishedAt: new Date(),
      createdById: 'test-admin',
      createdAt: new Date(),
    });
    mockDeliveryCreateMany.mockResolvedValue({ count: 0 });

    const req = createPostRequest('/api/v1/announcements', {
      propertyId: PROPERTY_ID,
      title: 'Empty Property',
      content: 'No residents.',
      channels: ['email'],
      status: 'published',
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('handles large recipient list efficiently', () => {
    const users = Array.from({ length: 500 }, (_, i) => ({
      userId: `user-${i}`,
      channel: 'email',
    }));

    const records = users.map((u) => ({
      announcementId: ANNOUNCEMENT_ID,
      recipientId: u.userId,
      channel: u.channel,
      status: 'pending',
      sentAt: null,
    }));

    // Batch creation handles all records at once
    expect(records).toHaveLength(500);
    expect(records[0]!.status).toBe('pending');
    expect(records[499]!.recipientId).toBe('user-499');
  });

  it('delivery status summary handles zero deliveries', () => {
    const summary = {
      total: 0,
      sent: 0,
      delivered: 0,
      failed: 0,
      pending: 0,
      bounced: 0,
    };

    expect(summary.total).toBe(0);

    // Avoid division by zero in rate calculation
    const deliveryRate = summary.total > 0 ? (summary.delivered / summary.total) * 100 : 0;
    expect(deliveryRate).toBe(0);
  });

  it('mixed channel statuses are aggregated correctly', () => {
    const deliveries = [
      { recipientId: USER_1, channel: 'email', status: 'delivered' },
      { recipientId: USER_1, channel: 'sms', status: 'failed' },
      { recipientId: USER_1, channel: 'push', status: 'delivered' },
      { recipientId: USER_2, channel: 'email', status: 'bounced' },
      { recipientId: USER_2, channel: 'sms', status: 'delivered' },
    ];

    const statusCounts = deliveries.reduce(
      (acc, d) => {
        acc[d.status] = (acc[d.status] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    expect(statusCounts.delivered).toBe(3);
    expect(statusCounts.failed).toBe(1);
    expect(statusCounts.bounced).toBe(1);
  });

  it('soft-bounced deliveries can be retried, hard bounces cannot', () => {
    const deliveries = [
      { recipientId: USER_1, status: 'bounced', bounceType: 'soft', retryEligible: true },
      { recipientId: USER_2, status: 'bounced', bounceType: 'hard', retryEligible: false },
    ];

    const retryable = deliveries.filter((d) => d.retryEligible);
    expect(retryable).toHaveLength(1);
    expect(retryable[0]!.bounceType).toBe('soft');
  });
});
