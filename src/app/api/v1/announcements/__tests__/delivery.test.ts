/**
 * Announcement Delivery Tracking Tests — per PRD 09 Communication
 *
 * When an announcement is published, delivery records are created for each
 * target user on each of their enabled channels. This ensures every resident
 * actually receives critical notices (fire drills, water shutoffs, etc.) and
 * property managers can see who has / has not been reached.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createGetRequest, createPostRequest, parseResponse } from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Mock Setup
// ---------------------------------------------------------------------------

const mockAnnouncementFindUnique = vi.fn();
const mockDeliveryFindMany = vi.fn();
const mockDeliveryCreateMany = vi.fn();
const mockDeliveryCount = vi.fn();
const mockDeliveryUpdateMany = vi.fn();
const mockDeliveryGroupBy = vi.fn();
const mockUserPropertyFindMany = vi.fn();
const mockNotificationPreferenceFindMany = vi.fn();
const mockAnnouncementCreate = vi.fn();
const mockAnnouncementFindMany = vi.fn();
const mockAnnouncementCount = vi.fn();
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
// Shared Constants
// ---------------------------------------------------------------------------

const PROPERTY_ID = '00000000-0000-4000-b000-000000000001';
const ANNOUNCEMENT_ID = '00000000-0000-4000-a000-000000000001';
const USER_1 = '00000000-0000-4000-c000-000000000001';
const USER_2 = '00000000-0000-4000-c000-000000000002';
const USER_3 = '00000000-0000-4000-c000-000000000003';

// ---------------------------------------------------------------------------
// Helper to create params promise (Next.js App Router pattern)
// ---------------------------------------------------------------------------

function makeParams(id: string): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) };
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();

  // Default: admin user
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

  // Default: announcement exists and is published
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

  // Default: users in the property
  mockUserPropertyFindMany.mockResolvedValue([
    { userId: USER_1 },
    { userId: USER_2 },
    { userId: USER_3 },
  ]);

  // Default: all users have all channels enabled
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

  // Default mocks
  mockDeliveryCreateMany.mockResolvedValue({ count: 9 });
  mockDeliveryFindMany.mockResolvedValue([]);
  mockDeliveryCount.mockResolvedValue(0);
  mockDeliveryUpdateMany.mockResolvedValue({ count: 0 });
  mockDeliveryGroupBy.mockResolvedValue([]);
  mockAnnouncementCreate.mockResolvedValue({});
  mockAnnouncementFindMany.mockResolvedValue([]);
  mockAnnouncementCount.mockResolvedValue(0);
});

// ---------------------------------------------------------------------------
// 1. Publishing creates AnnouncementDelivery records for each target user
// ---------------------------------------------------------------------------

describe('Publishing creates delivery records for each target user', () => {
  it('creates AnnouncementDelivery records when announcement is published', async () => {
    const announcementId = 'new-announcement-id';
    mockAnnouncementCreate.mockResolvedValue({
      id: announcementId,
      propertyId: PROPERTY_ID,
      title: 'Water Shutoff Notice',
      content: 'Water will be shut off Friday.',
      status: 'published',
      channels: ['email', 'sms'],
      publishedAt: new Date(),
      createdById: 'test-admin',
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/announcements', {
      propertyId: PROPERTY_ID,
      title: 'Water Shutoff Notice',
      content: 'Water will be shut off Friday.',
      channels: ['email', 'sms'],
      status: 'published',
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
    // Verify delivery records were created
    expect(mockDeliveryCreateMany).toHaveBeenCalled();
    const createManyCall = mockDeliveryCreateMany.mock.calls[0]![0];
    expect(createManyCall.data.length).toBeGreaterThan(0);

    // Each user should get a record for each channel (3 users x 2 channels = 6)
    expect(createManyCall.data.length).toBe(6);
  });

  it('creates one delivery record per user per channel', async () => {
    const announcementId = 'new-announcement-id';
    mockAnnouncementCreate.mockResolvedValue({
      id: announcementId,
      propertyId: PROPERTY_ID,
      title: 'Fire Drill',
      content: 'Fire drill at 2pm.',
      status: 'published',
      channels: ['email', 'push'],
      publishedAt: new Date(),
      createdById: 'test-admin',
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/announcements', {
      propertyId: PROPERTY_ID,
      title: 'Fire Drill',
      content: 'Fire drill at 2pm.',
      channels: ['email', 'push'],
      status: 'published',
    });
    await POST(req);

    const createManyCall = mockDeliveryCreateMany.mock.calls[0]![0];
    const records = createManyCall.data;

    // Verify each record has correct shape
    for (const record of records) {
      expect(record).toMatchObject({
        announcementId,
        recipientId: expect.any(String),
        channel: expect.stringMatching(/^(email|push)$/),
        status: 'pending',
      });
    }

    // Verify all user-channel combinations are present
    const combinations = records.map(
      (r: { recipientId: string; channel: string }) => `${r.recipientId}:${r.channel}`,
    );
    expect(combinations).toContain(`${USER_1}:email`);
    expect(combinations).toContain(`${USER_1}:push`);
    expect(combinations).toContain(`${USER_2}:email`);
    expect(combinations).toContain(`${USER_2}:push`);
    expect(combinations).toContain(`${USER_3}:email`);
    expect(combinations).toContain(`${USER_3}:push`);
  });
});

// ---------------------------------------------------------------------------
// 2. Delivery tracks: channel, status, sentAt
// ---------------------------------------------------------------------------

describe('Delivery tracks channel, status, and sentAt', () => {
  it('delivery records contain channel (email/sms/push)', async () => {
    mockAnnouncementCreate.mockResolvedValue({
      id: 'ann-1',
      propertyId: PROPERTY_ID,
      title: 'Test',
      content: 'Test content',
      status: 'published',
      channels: ['email', 'sms', 'push'],
      publishedAt: new Date(),
      createdById: 'test-admin',
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/announcements', {
      propertyId: PROPERTY_ID,
      title: 'Test',
      content: 'Test content',
      channels: ['email', 'sms', 'push'],
      status: 'published',
    });
    await POST(req);

    const createManyCall = mockDeliveryCreateMany.mock.calls[0]![0];
    const channels = [...new Set(createManyCall.data.map((r: { channel: string }) => r.channel))];
    expect(channels).toContain('email');
    expect(channels).toContain('sms');
    expect(channels).toContain('push');
  });

  it('delivery records start with status=pending and sentAt=null', async () => {
    mockAnnouncementCreate.mockResolvedValue({
      id: 'ann-1',
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

    const createManyCall = mockDeliveryCreateMany.mock.calls[0]![0];
    for (const record of createManyCall.data) {
      expect(record.status).toBe('pending');
      expect(record.sentAt).toBeNull();
    }
  });
});

// ---------------------------------------------------------------------------
// 3. GET /announcements/:id/deliveries — returns delivery stats
// ---------------------------------------------------------------------------

describe('GET /announcements/:id/deliveries — delivery stats', () => {
  it('returns total, sent, failed, and pending counts', async () => {
    mockDeliveryGroupBy.mockResolvedValue([
      { status: 'pending', _count: { status: 3 } },
      { status: 'sent', _count: { status: 4 } },
      { status: 'failed', _count: { status: 2 } },
    ]);
    mockDeliveryFindMany.mockResolvedValue([
      { id: 'd1', recipientId: USER_1, channel: 'email', status: 'sent', sentAt: new Date() },
    ]);

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

  it('returns 404 when announcement does not exist', async () => {
    mockAnnouncementFindUnique.mockResolvedValue(null);

    const req = createGetRequest('/api/v1/announcements/nonexistent/deliveries');
    const res = await GET_DELIVERIES(req, makeParams('nonexistent'));

    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// 4. POST /announcements/:id/deliveries/retry — re-sends failed deliveries
// ---------------------------------------------------------------------------

describe('POST /announcements/:id/deliveries/retry — retry failed deliveries', () => {
  it('resets failed deliveries to pending status', async () => {
    mockDeliveryUpdateMany.mockResolvedValue({ count: 2 });

    const req = createPostRequest(`/api/v1/announcements/${ANNOUNCEMENT_ID}/deliveries/retry`, {});
    const res = await POST_RETRY(req, makeParams(ANNOUNCEMENT_ID));

    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: { retriedCount: number } }>(res);
    expect(body.data.retriedCount).toBe(2);

    // Verify updateMany was called with correct filters
    expect(mockDeliveryUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          announcementId: ANNOUNCEMENT_ID,
          status: { in: ['failed', 'bounced'] },
        }),
        data: expect.objectContaining({
          status: 'pending',
          failedAt: null,
          failureReason: null,
        }),
      }),
    );
  });

  it('returns 404 when announcement does not exist', async () => {
    mockAnnouncementFindUnique.mockResolvedValue(null);

    const req = createPostRequest('/api/v1/announcements/nonexistent/deliveries/retry', {});
    const res = await POST_RETRY(req, makeParams('nonexistent'));

    expect(res.status).toBe(404);
  });

  it('increments retryCount on retried deliveries', async () => {
    mockDeliveryUpdateMany.mockResolvedValue({ count: 3 });

    const req = createPostRequest(`/api/v1/announcements/${ANNOUNCEMENT_ID}/deliveries/retry`, {});
    await POST_RETRY(req, makeParams(ANNOUNCEMENT_ID));

    const updateCall = mockDeliveryUpdateMany.mock.calls[0]![0];
    expect(updateCall.data.retryCount).toEqual({ increment: 1 });
  });
});

// ---------------------------------------------------------------------------
// 5. Channel-specific delivery: only delivers via user-enabled channels
// ---------------------------------------------------------------------------

describe('Channel-specific delivery respects user preferences', () => {
  it('only creates deliveries for channels the user has enabled', async () => {
    // User 1: email only, User 2: sms only, User 3: all channels
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
      id: 'ann-pref',
      propertyId: PROPERTY_ID,
      title: 'Preferences Test',
      content: 'Testing channel preferences.',
      status: 'published',
      channels: ['email', 'sms', 'push'],
      publishedAt: new Date(),
      createdById: 'test-admin',
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/announcements', {
      propertyId: PROPERTY_ID,
      title: 'Preferences Test',
      content: 'Testing channel preferences.',
      channels: ['email', 'sms', 'push'],
      status: 'published',
    });
    await POST(req);

    const createManyCall = mockDeliveryCreateMany.mock.calls[0]![0];
    const records = createManyCall.data;

    // User 1: email only = 1 record
    const user1Records = records.filter((r: { recipientId: string }) => r.recipientId === USER_1);
    expect(user1Records).toHaveLength(1);
    expect(user1Records[0].channel).toBe('email');

    // User 2: sms only = 1 record
    const user2Records = records.filter((r: { recipientId: string }) => r.recipientId === USER_2);
    expect(user2Records).toHaveLength(1);
    expect(user2Records[0].channel).toBe('sms');

    // User 3: all channels = 3 records
    const user3Records = records.filter((r: { recipientId: string }) => r.recipientId === USER_3);
    expect(user3Records).toHaveLength(3);
  });
});

// ---------------------------------------------------------------------------
// 6. Bulk delivery does not send duplicates to same user on same channel
// ---------------------------------------------------------------------------

describe('Bulk delivery prevents duplicates', () => {
  it('does not create duplicate records for same user on same channel', async () => {
    mockAnnouncementCreate.mockResolvedValue({
      id: 'ann-dedup',
      propertyId: PROPERTY_ID,
      title: 'Dedup Test',
      content: 'Testing deduplication.',
      status: 'published',
      channels: ['email', 'email'], // duplicate channel in input
      publishedAt: new Date(),
      createdById: 'test-admin',
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/announcements', {
      propertyId: PROPERTY_ID,
      title: 'Dedup Test',
      content: 'Testing deduplication.',
      channels: ['email', 'email'],
      status: 'published',
    });
    await POST(req);

    const createManyCall = mockDeliveryCreateMany.mock.calls[0]![0];
    const records = createManyCall.data;

    // Each user should have at most 1 email delivery
    const user1Emails = records.filter(
      (r: { recipientId: string; channel: string }) =>
        r.recipientId === USER_1 && r.channel === 'email',
    );
    expect(user1Emails).toHaveLength(1);
  });

  it('uses skipDuplicates flag in createMany', async () => {
    mockAnnouncementCreate.mockResolvedValue({
      id: 'ann-skip',
      propertyId: PROPERTY_ID,
      title: 'Skip Dupes',
      content: 'Testing skipDuplicates.',
      status: 'published',
      channels: ['email'],
      publishedAt: new Date(),
      createdById: 'test-admin',
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/announcements', {
      propertyId: PROPERTY_ID,
      title: 'Skip Dupes',
      content: 'Testing skipDuplicates.',
      channels: ['email'],
      status: 'published',
    });
    await POST(req);

    const createManyCall = mockDeliveryCreateMany.mock.calls[0]![0];
    expect(createManyCall.skipDuplicates).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 7. Delivery summary includes per-channel breakdown
// ---------------------------------------------------------------------------

describe('Delivery summary includes per-channel breakdown', () => {
  it('returns per-channel counts in the response', async () => {
    mockDeliveryGroupBy.mockResolvedValue([
      { status: 'sent', _count: { status: 3 }, channel: 'email' },
      { status: 'sent', _count: { status: 2 }, channel: 'sms' },
      { status: 'pending', _count: { status: 1 }, channel: 'push' },
      { status: 'failed', _count: { status: 1 }, channel: 'email' },
    ]);
    mockDeliveryFindMany.mockResolvedValue([]);

    const req = createGetRequest(`/api/v1/announcements/${ANNOUNCEMENT_ID}/deliveries`);
    const res = await GET_DELIVERIES(req, makeParams(ANNOUNCEMENT_ID));

    expect(res.status).toBe(200);
    const body = await parseResponse<{
      data: {
        channelBreakdown: Array<{
          channel: string;
          status: string;
          count: number;
        }>;
      };
    }>(res);

    expect(body.data.channelBreakdown).toBeDefined();
    expect(Array.isArray(body.data.channelBreakdown)).toBe(true);
    expect(body.data.channelBreakdown.length).toBeGreaterThan(0);

    // Check email sent count
    const emailSent = body.data.channelBreakdown.find(
      (b) => b.channel === 'email' && b.status === 'sent',
    );
    expect(emailSent).toBeDefined();
    expect(emailSent!.count).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// 8. Draft announcements have no delivery records
// ---------------------------------------------------------------------------

describe('Draft announcements have no delivery records', () => {
  it('does NOT create delivery records when status=draft', async () => {
    mockAnnouncementCreate.mockResolvedValue({
      id: 'ann-draft',
      propertyId: PROPERTY_ID,
      title: 'Draft Notice',
      content: 'This is a draft.',
      status: 'draft',
      channels: ['email', 'sms'],
      publishedAt: null,
      createdById: 'test-admin',
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/announcements', {
      propertyId: PROPERTY_ID,
      title: 'Draft Notice',
      content: 'This is a draft.',
      channels: ['email', 'sms'],
      status: 'draft',
    });
    await POST(req);

    // No delivery records should be created for drafts
    expect(mockDeliveryCreateMany).not.toHaveBeenCalled();
  });

  it('does NOT create delivery records when status defaults to draft', async () => {
    mockAnnouncementCreate.mockResolvedValue({
      id: 'ann-default-draft',
      propertyId: PROPERTY_ID,
      title: 'Default Draft',
      content: 'No status specified.',
      status: 'draft',
      channels: ['email'],
      publishedAt: null,
      createdById: 'test-admin',
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/announcements', {
      propertyId: PROPERTY_ID,
      title: 'Default Draft',
      content: 'No status specified.',
      channels: ['email'],
    });
    await POST(req);

    expect(mockDeliveryCreateMany).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// 9. Scheduled announcements create deliveries only after publishedAt time
// ---------------------------------------------------------------------------

describe('Scheduled announcements defer delivery creation', () => {
  it('does NOT create delivery records for scheduled announcements', async () => {
    mockAnnouncementCreate.mockResolvedValue({
      id: 'ann-scheduled',
      propertyId: PROPERTY_ID,
      title: 'Future Notice',
      content: 'This is scheduled for later.',
      status: 'scheduled',
      channels: ['email', 'push'],
      publishedAt: null,
      scheduledAt: new Date('2026-04-01T09:00:00Z'),
      createdById: 'test-admin',
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/announcements', {
      propertyId: PROPERTY_ID,
      title: 'Future Notice',
      content: 'This is scheduled for later.',
      channels: ['email', 'push'],
      status: 'scheduled',
      scheduledAt: '2026-04-01T09:00:00Z',
    });
    await POST(req);

    // Delivery records should NOT be created for scheduled announcements
    // They will be created by a scheduled job when publishedAt time arrives
    expect(mockDeliveryCreateMany).not.toHaveBeenCalled();
  });

  it('only creates delivery records when status is explicitly published', async () => {
    // First call: scheduled - no deliveries
    mockAnnouncementCreate.mockResolvedValue({
      id: 'ann-sched-2',
      propertyId: PROPERTY_ID,
      title: 'Scheduled Then Published',
      content: 'Will be published later.',
      status: 'scheduled',
      channels: ['email'],
      publishedAt: null,
      scheduledAt: new Date('2026-04-01T09:00:00Z'),
      createdById: 'test-admin',
      createdAt: new Date(),
    });

    const req1 = createPostRequest('/api/v1/announcements', {
      propertyId: PROPERTY_ID,
      title: 'Scheduled Then Published',
      content: 'Will be published later.',
      channels: ['email'],
      status: 'scheduled',
      scheduledAt: '2026-04-01T09:00:00Z',
    });
    await POST(req1);
    expect(mockDeliveryCreateMany).not.toHaveBeenCalled();

    // Second call: published - deliveries created
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
    mockUserPropertyFindMany.mockResolvedValue([{ userId: USER_1 }]);
    mockNotificationPreferenceFindMany.mockResolvedValue([
      { userId: USER_1, module: 'announcements', channel: 'email', enabled: true },
    ]);
    mockDeliveryCreateMany.mockResolvedValue({ count: 1 });
    mockAnnouncementCreate.mockResolvedValue({
      id: 'ann-pub',
      propertyId: PROPERTY_ID,
      title: 'Now Published',
      content: 'Published now.',
      status: 'published',
      channels: ['email'],
      publishedAt: new Date(),
      createdById: 'test-admin',
      createdAt: new Date(),
    });

    const req2 = createPostRequest('/api/v1/announcements', {
      propertyId: PROPERTY_ID,
      title: 'Now Published',
      content: 'Published now.',
      channels: ['email'],
      status: 'published',
    });
    await POST(req2);
    expect(mockDeliveryCreateMany).toHaveBeenCalled();
  });
});
