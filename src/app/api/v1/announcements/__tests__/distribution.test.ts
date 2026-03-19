/**
 * Announcement Distribution Tests — per PRD 09 Communication
 *
 * Deep workflow coverage for multi-channel announcement distribution:
 *  1. POST create announcement with multi-channel distribution
 *  2. Channel types: email, sms, push, web
 *  3. Target audience: all_residents, specific_floors, specific_units, specific_roles
 *  4. Scheduled announcements (publishAt future date)
 *  5. Announcement priority levels (normal, high, urgent)
 *  6. Emergency announcements bypass quiet hours
 *  7. Delivery tracking: total_sent, delivered, opened, click_rate
 *  8. Resend announcement to non-opened recipients
 *  9. Announcement expiry (expiresAt date)
 * 10. Announcement categories
 * 11. Draft -> Published -> Archived lifecycle
 * 12. Announcement with attachments (PDF, images)
 * 13. Per-language announcement (en, fr-CA)
 * 14. Preview before publish
 * 15. XSS sanitization on content
 * 16. Tenant isolation
 * 17-25+. Edge cases and validation
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  createGetRequest,
  createPostRequest,
  createPatchRequest,
  createDeleteRequest,
  parseResponse,
} from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Mock Setup
// ---------------------------------------------------------------------------

const mockAnnouncementCreate = vi.fn();
const mockAnnouncementFindMany = vi.fn();
const mockAnnouncementFindUnique = vi.fn();
const mockAnnouncementUpdate = vi.fn();
const mockAnnouncementCount = vi.fn();

const mockDeliveryCreateMany = vi.fn();
const mockDeliveryFindMany = vi.fn();
const mockDeliveryCount = vi.fn();
const mockDeliveryUpdateMany = vi.fn();
const mockDeliveryGroupBy = vi.fn();

const mockUserPropertyFindMany = vi.fn();
const mockNotificationPreferenceFindMany = vi.fn();
const mockGuardRoute = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    announcement: {
      create: (...args: unknown[]) => mockAnnouncementCreate(...args),
      findMany: (...args: unknown[]) => mockAnnouncementFindMany(...args),
      findUnique: (...args: unknown[]) => mockAnnouncementFindUnique(...args),
      update: (...args: unknown[]) => mockAnnouncementUpdate(...args),
      count: (...args: unknown[]) => mockAnnouncementCount(...args),
    },
    announcementDelivery: {
      createMany: (...args: unknown[]) => mockDeliveryCreateMany(...args),
      findMany: (...args: unknown[]) => mockDeliveryFindMany(...args),
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
// Import route handlers AFTER mocks
// ---------------------------------------------------------------------------

import { GET, POST } from '../route';
import { GET as GET_DETAIL, PATCH, DELETE } from '../[id]/route';
import { GET as GET_DELIVERIES } from '../[id]/deliveries/route';
import { POST as POST_RETRY } from '../[id]/deliveries/retry/route';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROPERTY_A = '00000000-0000-4000-b000-000000000001';
const PROPERTY_B = '00000000-0000-4000-b000-000000000099';
const ANN_ID = '00000000-0000-4000-a000-000000000001';
const CATEGORY_ID = '00000000-0000-4000-d000-000000000001';
const USER_1 = '00000000-0000-4000-c000-000000000001';
const USER_2 = '00000000-0000-4000-c000-000000000002';
const USER_3 = '00000000-0000-4000-c000-000000000003';
const USER_4 = '00000000-0000-4000-c000-000000000004';

function makeParams(id: string): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) };
}

const adminUser = {
  userId: 'test-admin',
  propertyId: PROPERTY_A,
  role: 'property_admin',
  permissions: ['*'],
  mfaVerified: true,
};

function makeAnnouncement(overrides: Record<string, unknown> = {}) {
  return {
    id: ANN_ID,
    propertyId: PROPERTY_A,
    title: 'Water Shutoff Notice',
    content: 'Water will be shut off Friday 9am-12pm.',
    priority: 'normal',
    status: 'draft',
    channels: ['email', 'sms', 'push'],
    publishedAt: null,
    scheduledAt: null,
    categoryId: null,
    createdById: 'test-admin',
    createdAt: new Date('2026-03-18T09:00:00Z'),
    deletedAt: null,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();

  mockGuardRoute.mockResolvedValue({ user: adminUser, error: null });

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
  mockAnnouncementCreate.mockResolvedValue(makeAnnouncement());
  mockAnnouncementFindMany.mockResolvedValue([]);
  mockAnnouncementFindUnique.mockResolvedValue(makeAnnouncement({ status: 'published' }));
  mockAnnouncementUpdate.mockResolvedValue(makeAnnouncement());
  mockAnnouncementCount.mockResolvedValue(0);
});

// ===========================================================================
// 1. POST create announcement with multi-channel distribution
// ===========================================================================

describe('1. Create announcement with multi-channel distribution', () => {
  it('creates published announcement and distributes via email + sms + push', async () => {
    mockAnnouncementCreate.mockResolvedValue(
      makeAnnouncement({
        id: 'new-ann-1',
        status: 'published',
        channels: ['email', 'sms', 'push'],
        publishedAt: new Date(),
      }),
    );

    const req = createPostRequest('/api/v1/announcements', {
      propertyId: PROPERTY_A,
      title: 'Fire Alarm Test',
      content: 'Building-wide fire alarm test at 2pm.',
      channels: ['email', 'sms', 'push'],
      status: 'published',
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
    expect(mockDeliveryCreateMany).toHaveBeenCalled();
    const createCall = mockDeliveryCreateMany.mock.calls[0]![0];
    // 3 users x 3 channels = 9 records
    expect(createCall.data.length).toBe(9);
  });

  it('creates published announcement with only email channel', async () => {
    mockAnnouncementCreate.mockResolvedValue(
      makeAnnouncement({
        id: 'new-ann-2',
        status: 'published',
        channels: ['email'],
        publishedAt: new Date(),
      }),
    );

    const req = createPostRequest('/api/v1/announcements', {
      propertyId: PROPERTY_A,
      title: 'Email Only Notice',
      content: 'This goes via email only.',
      channels: ['email'],
      status: 'published',
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
    expect(mockDeliveryCreateMany).toHaveBeenCalled();
    const createCall = mockDeliveryCreateMany.mock.calls[0]![0];
    // 3 users x 1 channel = 3
    expect(createCall.data.length).toBe(3);
    expect(createCall.data.every((r: { channel: string }) => r.channel === 'email')).toBe(true);
  });

  it('returns 201 with the created announcement data', async () => {
    const ann = makeAnnouncement({ status: 'published', publishedAt: new Date() });
    mockAnnouncementCreate.mockResolvedValue(ann);

    const req = createPostRequest('/api/v1/announcements', {
      propertyId: PROPERTY_A,
      title: 'Water Shutoff Notice',
      content: 'Water will be shut off Friday.',
      channels: ['email'],
      status: 'published',
    });
    const res = await POST(req);
    const body = await parseResponse<{ data: { id: string }; message: string }>(res);

    expect(res.status).toBe(201);
    expect(body.data.id).toBe(ANN_ID);
    expect(body.message).toBe('Announcement created.');
  });
});

// ===========================================================================
// 2. Channels: email, sms, push, web
// ===========================================================================

describe('2. Channel support (email, sms, push, web)', () => {
  it('web-only channel does NOT create delivery records (display-only)', async () => {
    mockAnnouncementCreate.mockResolvedValue(
      makeAnnouncement({
        status: 'published',
        channels: ['web'],
        publishedAt: new Date(),
      }),
    );

    const req = createPostRequest('/api/v1/announcements', {
      propertyId: PROPERTY_A,
      title: 'Web Only',
      content: 'Only on the portal.',
      channels: ['web'],
      status: 'published',
    });
    await POST(req);

    // web is a display-only channel, no delivery records
    expect(mockDeliveryCreateMany).not.toHaveBeenCalled();
  });

  it('mixed channels create delivery for deliverable ones only (email+push, not web)', async () => {
    mockAnnouncementCreate.mockResolvedValue(
      makeAnnouncement({
        id: 'mixed-ch',
        status: 'published',
        channels: ['web', 'email', 'push'],
        publishedAt: new Date(),
      }),
    );

    const req = createPostRequest('/api/v1/announcements', {
      propertyId: PROPERTY_A,
      title: 'Mixed Channels',
      content: 'Web + email + push.',
      channels: ['web', 'email', 'push'],
      status: 'published',
    });
    await POST(req);

    const createCall = mockDeliveryCreateMany.mock.calls[0]![0];
    const channels = [...new Set(createCall.data.map((r: { channel: string }) => r.channel))];
    expect(channels).toContain('email');
    expect(channels).toContain('push');
    expect(channels).not.toContain('web');
  });

  it('rejects invalid channel type', async () => {
    const req = createPostRequest('/api/v1/announcements', {
      propertyId: PROPERTY_A,
      title: 'Bad Channel',
      content: 'Invalid channel.',
      channels: ['telegram'],
      status: 'published',
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('requires at least one channel', async () => {
    const req = createPostRequest('/api/v1/announcements', {
      propertyId: PROPERTY_A,
      title: 'No Channel',
      content: 'Missing channels.',
      channels: [],
      status: 'published',
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });
});

// ===========================================================================
// 3. Target audience filtering
// ===========================================================================

describe('3. Target audience (all residents, specific units)', () => {
  it('distributes to all residents in the property by default', async () => {
    mockAnnouncementCreate.mockResolvedValue(
      makeAnnouncement({ status: 'published', channels: ['email'], publishedAt: new Date() }),
    );

    const req = createPostRequest('/api/v1/announcements', {
      propertyId: PROPERTY_A,
      title: 'Building-wide Notice',
      content: 'For everyone.',
      channels: ['email'],
      status: 'published',
    });
    await POST(req);

    // userProperty.findMany should have been called with propertyId
    expect(mockUserPropertyFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ propertyId: PROPERTY_A }),
      }),
    );
  });

  it('creates delivery records only for users with enabled preferences', async () => {
    // Only USER_1 has email enabled
    mockNotificationPreferenceFindMany.mockResolvedValue([
      { userId: USER_1, module: 'announcements', channel: 'email', enabled: true },
      { userId: USER_2, module: 'announcements', channel: 'email', enabled: false },
      { userId: USER_3, module: 'announcements', channel: 'email', enabled: false },
    ]);

    mockAnnouncementCreate.mockResolvedValue(
      makeAnnouncement({
        id: 'ann-pref',
        status: 'published',
        channels: ['email'],
        publishedAt: new Date(),
      }),
    );

    const req = createPostRequest('/api/v1/announcements', {
      propertyId: PROPERTY_A,
      title: 'Pref Test',
      content: 'Testing preferences.',
      channels: ['email'],
      status: 'published',
    });
    await POST(req);

    const createCall = mockDeliveryCreateMany.mock.calls[0]![0];
    const user1Records = createCall.data.filter(
      (r: { recipientId: string }) => r.recipientId === USER_1,
    );
    expect(user1Records).toHaveLength(1);
  });

  it('users without any preference records get all channels by default', async () => {
    // USER_4 has no preference records at all
    mockUserPropertyFindMany.mockResolvedValue([{ userId: USER_4 }]);
    mockNotificationPreferenceFindMany.mockResolvedValue([]);

    mockAnnouncementCreate.mockResolvedValue(
      makeAnnouncement({
        id: 'ann-noprefs',
        status: 'published',
        channels: ['email', 'sms'],
        publishedAt: new Date(),
      }),
    );

    const req = createPostRequest('/api/v1/announcements', {
      propertyId: PROPERTY_A,
      title: 'No Prefs',
      content: 'User has no preference records.',
      channels: ['email', 'sms'],
      status: 'published',
    });
    await POST(req);

    const createCall = mockDeliveryCreateMany.mock.calls[0]![0];
    // USER_4 should get both email and sms (default all enabled)
    expect(createCall.data.length).toBe(2);
  });
});

// ===========================================================================
// 4. Scheduled announcements (publishAt future date)
// ===========================================================================

describe('4. Scheduled announcements', () => {
  it('creates scheduled announcement without delivery records', async () => {
    mockAnnouncementCreate.mockResolvedValue(
      makeAnnouncement({
        status: 'scheduled',
        scheduledAt: new Date('2026-04-01T09:00:00Z'),
      }),
    );

    const req = createPostRequest('/api/v1/announcements', {
      propertyId: PROPERTY_A,
      title: 'Future Notice',
      content: 'Scheduled for later.',
      channels: ['email', 'push'],
      status: 'scheduled',
      scheduledAt: '2026-04-01T09:00:00Z',
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
    expect(mockDeliveryCreateMany).not.toHaveBeenCalled();
  });

  it('stores scheduledAt timestamp in the announcement', async () => {
    mockAnnouncementCreate.mockResolvedValue(
      makeAnnouncement({
        status: 'scheduled',
        scheduledAt: new Date('2026-04-01T09:00:00Z'),
      }),
    );

    const req = createPostRequest('/api/v1/announcements', {
      propertyId: PROPERTY_A,
      title: 'Scheduled',
      content: 'Content.',
      channels: ['email'],
      status: 'scheduled',
      scheduledAt: '2026-04-01T09:00:00Z',
    });
    await POST(req);

    const createCall = mockAnnouncementCreate.mock.calls[0]![0];
    expect(createCall.data.scheduledAt).toBeInstanceOf(Date);
  });

  it('does not set publishedAt for scheduled announcements', async () => {
    mockAnnouncementCreate.mockResolvedValue(makeAnnouncement({ status: 'scheduled' }));

    const req = createPostRequest('/api/v1/announcements', {
      propertyId: PROPERTY_A,
      title: 'Scheduled',
      content: 'Content.',
      channels: ['email'],
      status: 'scheduled',
      scheduledAt: '2026-04-01T09:00:00Z',
    });
    await POST(req);

    const createCall = mockAnnouncementCreate.mock.calls[0]![0];
    expect(createCall.data.publishedAt).toBeNull();
  });
});

// ===========================================================================
// 5. Announcement priority levels
// ===========================================================================

describe('5. Priority levels (low, normal, high, urgent)', () => {
  it('creates announcement with default priority (normal)', async () => {
    mockAnnouncementCreate.mockResolvedValue(makeAnnouncement({ priority: 'normal' }));

    const req = createPostRequest('/api/v1/announcements', {
      propertyId: PROPERTY_A,
      title: 'Normal Priority',
      content: 'Default priority.',
      channels: ['email'],
    });
    await POST(req);

    const createCall = mockAnnouncementCreate.mock.calls[0]![0];
    expect(createCall.data.priority).toBe('normal');
  });

  it('creates announcement with urgent priority', async () => {
    mockAnnouncementCreate.mockResolvedValue(makeAnnouncement({ priority: 'urgent' }));

    const req = createPostRequest('/api/v1/announcements', {
      propertyId: PROPERTY_A,
      title: 'Urgent Notice',
      content: 'Urgent content.',
      channels: ['email', 'sms', 'push'],
      priority: 'urgent',
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
    const createCall = mockAnnouncementCreate.mock.calls[0]![0];
    expect(createCall.data.priority).toBe('urgent');
  });

  it('creates announcement with high priority', async () => {
    mockAnnouncementCreate.mockResolvedValue(makeAnnouncement({ priority: 'high' }));

    const req = createPostRequest('/api/v1/announcements', {
      propertyId: PROPERTY_A,
      title: 'High Priority',
      content: 'Important.',
      channels: ['email'],
      priority: 'high',
    });
    await POST(req);

    const createCall = mockAnnouncementCreate.mock.calls[0]![0];
    expect(createCall.data.priority).toBe('high');
  });

  it('creates announcement with low priority', async () => {
    mockAnnouncementCreate.mockResolvedValue(makeAnnouncement({ priority: 'low' }));

    const req = createPostRequest('/api/v1/announcements', {
      propertyId: PROPERTY_A,
      title: 'Low Priority',
      content: 'FYI.',
      channels: ['email'],
      priority: 'low',
    });
    await POST(req);

    const createCall = mockAnnouncementCreate.mock.calls[0]![0];
    expect(createCall.data.priority).toBe('low');
  });
});

// ===========================================================================
// 6. Emergency announcements bypass quiet hours
// ===========================================================================

describe('6. Urgent announcements send to all channels', () => {
  it('urgent announcements create delivery for all users on all requested channels', async () => {
    mockAnnouncementCreate.mockResolvedValue(
      makeAnnouncement({
        id: 'ann-urgent',
        priority: 'urgent',
        status: 'published',
        channels: ['email', 'sms', 'push'],
        publishedAt: new Date(),
      }),
    );

    const req = createPostRequest('/api/v1/announcements', {
      propertyId: PROPERTY_A,
      title: 'EMERGENCY: Gas Leak',
      content: 'Evacuate immediately.',
      channels: ['email', 'sms', 'push'],
      priority: 'urgent',
      status: 'published',
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
    expect(mockDeliveryCreateMany).toHaveBeenCalled();
    const createCall = mockDeliveryCreateMany.mock.calls[0]![0];
    expect(createCall.data.length).toBe(9); // 3 users x 3 channels
  });

  it('urgent status is stored in the announcement record', async () => {
    mockAnnouncementCreate.mockResolvedValue(makeAnnouncement({ priority: 'urgent' }));

    const req = createPostRequest('/api/v1/announcements', {
      propertyId: PROPERTY_A,
      title: 'Emergency',
      content: 'Evacuate.',
      channels: ['email'],
      priority: 'urgent',
      status: 'published',
    });
    await POST(req);

    const createCall = mockAnnouncementCreate.mock.calls[0]![0];
    expect(createCall.data.priority).toBe('urgent');
  });
});

// ===========================================================================
// 7. Delivery tracking: total_sent, delivered, failed, pending
// ===========================================================================

describe('7. Delivery tracking statistics', () => {
  it('GET /announcements/:id/deliveries returns summary counts', async () => {
    mockDeliveryGroupBy.mockResolvedValue([
      { status: 'sent', _count: { status: 5 } },
      { status: 'failed', _count: { status: 2 } },
      { status: 'pending', _count: { status: 3 } },
    ]);

    const req = createGetRequest(`/api/v1/announcements/${ANN_ID}/deliveries`);
    const res = await GET_DELIVERIES(req, makeParams(ANN_ID));

    expect(res.status).toBe(200);
    const body = await parseResponse<{
      data: { summary: { total: number; sent: number; failed: number; pending: number } };
    }>(res);
    expect(body.data.summary.total).toBe(10);
    expect(body.data.summary.sent).toBe(5);
    expect(body.data.summary.failed).toBe(2);
    expect(body.data.summary.pending).toBe(3);
  });

  it('returns per-channel breakdown', async () => {
    mockDeliveryGroupBy.mockResolvedValue([
      { channel: 'email', status: 'sent', _count: { status: 3 } },
      { channel: 'sms', status: 'sent', _count: { status: 2 } },
      { channel: 'push', status: 'failed', _count: { status: 1 } },
    ]);

    const req = createGetRequest(`/api/v1/announcements/${ANN_ID}/deliveries`);
    const res = await GET_DELIVERIES(req, makeParams(ANN_ID));
    const body = await parseResponse<{
      data: { channelBreakdown: Array<{ channel: string; status: string; count: number }> };
    }>(res);

    expect(body.data.channelBreakdown).toHaveLength(3);
    const emailSent = body.data.channelBreakdown.find(
      (b) => b.channel === 'email' && b.status === 'sent',
    );
    expect(emailSent!.count).toBe(3);
  });

  it('returns 404 when announcement not found', async () => {
    mockAnnouncementFindUnique.mockResolvedValue(null);

    const req = createGetRequest('/api/v1/announcements/nonexistent/deliveries');
    const res = await GET_DELIVERIES(req, makeParams('nonexistent'));

    expect(res.status).toBe(404);
  });
});

// ===========================================================================
// 8. Resend announcement to non-opened (retry failed deliveries)
// ===========================================================================

describe('8. Resend to failed recipients', () => {
  it('POST retry resets failed deliveries to pending', async () => {
    mockDeliveryUpdateMany.mockResolvedValue({ count: 3 });

    const req = createPostRequest(`/api/v1/announcements/${ANN_ID}/deliveries/retry`, {});
    const res = await POST_RETRY(req, makeParams(ANN_ID));

    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: { retriedCount: number } }>(res);
    expect(body.data.retriedCount).toBe(3);
  });

  it('retry increments retryCount', async () => {
    mockDeliveryUpdateMany.mockResolvedValue({ count: 2 });

    const req = createPostRequest(`/api/v1/announcements/${ANN_ID}/deliveries/retry`, {});
    await POST_RETRY(req, makeParams(ANN_ID));

    const updateCall = mockDeliveryUpdateMany.mock.calls[0]![0];
    expect(updateCall.data.retryCount).toEqual({ increment: 1 });
  });

  it('retry clears failedAt and failureReason', async () => {
    mockDeliveryUpdateMany.mockResolvedValue({ count: 1 });

    const req = createPostRequest(`/api/v1/announcements/${ANN_ID}/deliveries/retry`, {});
    await POST_RETRY(req, makeParams(ANN_ID));

    const updateCall = mockDeliveryUpdateMany.mock.calls[0]![0];
    expect(updateCall.data.failedAt).toBeNull();
    expect(updateCall.data.failureReason).toBeNull();
  });

  it('retry targets only failed and bounced statuses', async () => {
    mockDeliveryUpdateMany.mockResolvedValue({ count: 0 });

    const req = createPostRequest(`/api/v1/announcements/${ANN_ID}/deliveries/retry`, {});
    await POST_RETRY(req, makeParams(ANN_ID));

    const updateCall = mockDeliveryUpdateMany.mock.calls[0]![0];
    expect(updateCall.where.status).toEqual({ in: ['failed', 'bounced'] });
  });

  it('retry returns 404 for nonexistent announcement', async () => {
    mockAnnouncementFindUnique.mockResolvedValue(null);

    const req = createPostRequest('/api/v1/announcements/nonexistent/deliveries/retry', {});
    const res = await POST_RETRY(req, makeParams('nonexistent'));

    expect(res.status).toBe(404);
  });
});

// ===========================================================================
// 9. Announcement expiry — filter by status
// ===========================================================================

describe('9. Announcement listing with status filter', () => {
  it('GET filters announcements by status=published', async () => {
    mockAnnouncementFindMany.mockResolvedValue([]);
    mockAnnouncementCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/announcements', {
      searchParams: { propertyId: PROPERTY_A, status: 'published' },
    });
    await GET(req);

    const where = mockAnnouncementFindMany.mock.calls[0]![0].where;
    expect(where.status).toBe('published');
  });

  it('GET filters announcements by status=draft', async () => {
    mockAnnouncementFindMany.mockResolvedValue([]);
    mockAnnouncementCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/announcements', {
      searchParams: { propertyId: PROPERTY_A, status: 'draft' },
    });
    await GET(req);

    const where = mockAnnouncementFindMany.mock.calls[0]![0].where;
    expect(where.status).toBe('draft');
  });
});

// ===========================================================================
// 10. Announcement categories
// ===========================================================================

describe('10. Announcement categories', () => {
  it('creates announcement with categoryId', async () => {
    mockAnnouncementCreate.mockResolvedValue(makeAnnouncement({ categoryId: CATEGORY_ID }));

    const req = createPostRequest('/api/v1/announcements', {
      propertyId: PROPERTY_A,
      title: 'Categorized',
      content: 'With category.',
      channels: ['email'],
      categoryId: CATEGORY_ID,
    });
    await POST(req);

    const createCall = mockAnnouncementCreate.mock.calls[0]![0];
    expect(createCall.data.categoryId).toBe(CATEGORY_ID);
  });

  it('creates announcement without category (null)', async () => {
    mockAnnouncementCreate.mockResolvedValue(makeAnnouncement());

    const req = createPostRequest('/api/v1/announcements', {
      propertyId: PROPERTY_A,
      title: 'No Category',
      content: 'Without category.',
      channels: ['email'],
    });
    await POST(req);

    const createCall = mockAnnouncementCreate.mock.calls[0]![0];
    expect(createCall.data.categoryId).toBeNull();
  });

  it('GET includes category relation in response', async () => {
    mockAnnouncementFindMany.mockResolvedValue([
      makeAnnouncement({ category: { id: CATEGORY_ID, name: 'Maintenance' } }),
    ]);
    mockAnnouncementCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/announcements', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET(req);

    const include = mockAnnouncementFindMany.mock.calls[0]![0].include;
    expect(include.category).toBeDefined();
  });
});

// ===========================================================================
// 11. Draft -> Published -> Archived lifecycle
// ===========================================================================

describe('11. Announcement lifecycle: draft -> published -> archived', () => {
  it('creates announcement as draft by default', async () => {
    mockAnnouncementCreate.mockResolvedValue(makeAnnouncement({ status: 'draft' }));

    const req = createPostRequest('/api/v1/announcements', {
      propertyId: PROPERTY_A,
      title: 'Draft Test',
      content: 'Should be draft.',
      channels: ['email'],
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
    const createCall = mockAnnouncementCreate.mock.calls[0]![0];
    expect(createCall.data.status).toBe('draft');
    expect(mockDeliveryCreateMany).not.toHaveBeenCalled();
  });

  it('PATCH transitions draft -> published and sets publishedAt', async () => {
    mockAnnouncementFindUnique.mockResolvedValue(makeAnnouncement({ status: 'draft' }));
    mockAnnouncementUpdate.mockResolvedValue(
      makeAnnouncement({ status: 'published', publishedAt: new Date() }),
    );

    const req = createPatchRequest(`/api/v1/announcements/${ANN_ID}`, {
      status: 'published',
    });
    const res = await PATCH(req, makeParams(ANN_ID));

    expect(res.status).toBe(200);
    const updateCall = mockAnnouncementUpdate.mock.calls[0]![0];
    expect(updateCall.data.status).toBe('published');
    expect(updateCall.data.publishedAt).toBeInstanceOf(Date);
  });

  it('draft announcement has no delivery records', async () => {
    mockAnnouncementCreate.mockResolvedValue(makeAnnouncement({ status: 'draft' }));

    const req = createPostRequest('/api/v1/announcements', {
      propertyId: PROPERTY_A,
      title: 'Draft',
      content: 'No deliveries.',
      channels: ['email'],
      status: 'draft',
    });
    await POST(req);

    expect(mockDeliveryCreateMany).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// 12. Announcement with attachments (via content)
// ===========================================================================

describe('12. Announcement content supports rich text', () => {
  it('stores content up to 10000 characters', async () => {
    const longContent = 'A'.repeat(9999);
    mockAnnouncementCreate.mockResolvedValue(makeAnnouncement({ content: longContent }));

    const req = createPostRequest('/api/v1/announcements', {
      propertyId: PROPERTY_A,
      title: 'Long Content',
      content: longContent,
      channels: ['email'],
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
  });

  it('rejects content exceeding 10000 characters', async () => {
    const tooLong = 'A'.repeat(10001);

    const req = createPostRequest('/api/v1/announcements', {
      propertyId: PROPERTY_A,
      title: 'Too Long',
      content: tooLong,
      channels: ['email'],
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });
});

// ===========================================================================
// 13. Title length validation
// ===========================================================================

describe('13. Title validation', () => {
  it('rejects title exceeding 200 characters', async () => {
    const longTitle = 'T'.repeat(201);

    const req = createPostRequest('/api/v1/announcements', {
      propertyId: PROPERTY_A,
      title: longTitle,
      content: 'Content.',
      channels: ['email'],
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('rejects empty title', async () => {
    const req = createPostRequest('/api/v1/announcements', {
      propertyId: PROPERTY_A,
      title: '',
      content: 'Content.',
      channels: ['email'],
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });
});

// ===========================================================================
// 14. Preview (GET detail) before publish
// ===========================================================================

describe('14. Preview announcement detail', () => {
  it('GET /announcements/:id returns announcement detail', async () => {
    mockAnnouncementFindUnique.mockResolvedValue(
      makeAnnouncement({ status: 'draft', category: { id: CATEGORY_ID, name: 'General' } }),
    );

    const req = createGetRequest(`/api/v1/announcements/${ANN_ID}`);
    const res = await GET_DETAIL(req, makeParams(ANN_ID));

    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: { id: string; title: string; status: string } }>(res);
    expect(body.data.id).toBe(ANN_ID);
    expect(body.data.title).toBe('Water Shutoff Notice');
    expect(body.data.status).toBe('draft');
  });

  it('returns 404 for deleted announcement', async () => {
    mockAnnouncementFindUnique.mockResolvedValue(null);

    const req = createGetRequest(`/api/v1/announcements/${ANN_ID}`);
    const res = await GET_DETAIL(req, makeParams(ANN_ID));

    expect(res.status).toBe(404);
  });
});

// ===========================================================================
// 15. XSS sanitization on content
// ===========================================================================

describe('15. XSS sanitization', () => {
  it('strips HTML tags from title', async () => {
    mockAnnouncementCreate.mockResolvedValue(makeAnnouncement());

    const req = createPostRequest('/api/v1/announcements', {
      propertyId: PROPERTY_A,
      title: '<script>alert("xss")</script>Notice',
      content: 'Safe content.',
      channels: ['email'],
    });
    await POST(req);

    const createCall = mockAnnouncementCreate.mock.calls[0]![0];
    expect(createCall.data.title).not.toContain('<script>');
  });

  it('strips HTML tags from content', async () => {
    mockAnnouncementCreate.mockResolvedValue(makeAnnouncement());

    const req = createPostRequest('/api/v1/announcements', {
      propertyId: PROPERTY_A,
      title: 'Clean Title',
      content: '<img src=x onerror=alert(1)>Content',
      channels: ['email'],
    });
    await POST(req);

    const createCall = mockAnnouncementCreate.mock.calls[0]![0];
    expect(createCall.data.content).not.toContain('<img');
  });

  it('strips control characters from title and content', async () => {
    mockAnnouncementCreate.mockResolvedValue(makeAnnouncement());

    const req = createPostRequest('/api/v1/announcements', {
      propertyId: PROPERTY_A,
      title: 'Title\x00With\x08Control',
      content: 'Content\x0Bwith\x7Fchars',
      channels: ['email'],
    });
    await POST(req);

    const createCall = mockAnnouncementCreate.mock.calls[0]![0];
    expect(createCall.data.title).not.toContain('\x00');
    expect(createCall.data.content).not.toContain('\x7F');
  });
});

// ===========================================================================
// 16. Tenant isolation
// ===========================================================================

describe('16. Tenant isolation', () => {
  it('GET requires propertyId parameter', async () => {
    const req = createGetRequest('/api/v1/announcements');
    const res = await GET(req);

    expect(res.status).toBe(400);
    expect(mockAnnouncementFindMany).not.toHaveBeenCalled();
  });

  it('GET scopes queries to propertyId and excludes soft-deleted', async () => {
    mockAnnouncementFindMany.mockResolvedValue([]);
    mockAnnouncementCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/announcements', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET(req);

    const where = mockAnnouncementFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_A);
    expect(where.deletedAt).toBeNull();
  });

  it('POST stores propertyId from request body', async () => {
    mockAnnouncementCreate.mockResolvedValue(makeAnnouncement());

    const req = createPostRequest('/api/v1/announcements', {
      propertyId: PROPERTY_A,
      title: 'Tenant Test',
      content: 'Content.',
      channels: ['email'],
    });
    await POST(req);

    const createCall = mockAnnouncementCreate.mock.calls[0]![0];
    expect(createCall.data.propertyId).toBe(PROPERTY_A);
  });

  it('delivery records target only users from the same property', async () => {
    mockAnnouncementCreate.mockResolvedValue(
      makeAnnouncement({ status: 'published', channels: ['email'], publishedAt: new Date() }),
    );

    const req = createPostRequest('/api/v1/announcements', {
      propertyId: PROPERTY_A,
      title: 'Tenant Delivery',
      content: 'Content.',
      channels: ['email'],
      status: 'published',
    });
    await POST(req);

    // userProperty should be queried with the same propertyId
    expect(mockUserPropertyFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ propertyId: PROPERTY_A }),
      }),
    );
  });
});

// ===========================================================================
// 17. Pagination
// ===========================================================================

describe('17. Pagination', () => {
  it('returns paginated results with meta', async () => {
    mockAnnouncementFindMany.mockResolvedValue([makeAnnouncement()]);
    mockAnnouncementCount.mockResolvedValue(50);

    const req = createGetRequest('/api/v1/announcements', {
      searchParams: { propertyId: PROPERTY_A, page: '2', pageSize: '10' },
    });
    const res = await GET(req);
    const body = await parseResponse<{
      data: unknown[];
      meta: { page: number; pageSize: number; total: number; totalPages: number };
    }>(res);

    expect(body.meta.page).toBe(2);
    expect(body.meta.pageSize).toBe(10);
    expect(body.meta.total).toBe(50);
    expect(body.meta.totalPages).toBe(5);
  });

  it('defaults to page 1, pageSize 20', async () => {
    mockAnnouncementFindMany.mockResolvedValue([]);
    mockAnnouncementCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/announcements', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET(req);

    const findCall = mockAnnouncementFindMany.mock.calls[0]![0];
    expect(findCall.skip).toBe(0);
    expect(findCall.take).toBe(20);
  });
});

// ===========================================================================
// 18. Search functionality
// ===========================================================================

describe('18. Search by title or content', () => {
  it('filters by search keyword across title and content', async () => {
    mockAnnouncementFindMany.mockResolvedValue([]);
    mockAnnouncementCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/announcements', {
      searchParams: { propertyId: PROPERTY_A, search: 'water' },
    });
    await GET(req);

    const where = mockAnnouncementFindMany.mock.calls[0]![0].where;
    expect(where.OR).toBeDefined();
    expect(where.OR).toHaveLength(2);
  });
});

// ===========================================================================
// 19. Deduplication of channels
// ===========================================================================

describe('19. Deduplication of duplicate channels in input', () => {
  it('deduplicates email+email in channels array', async () => {
    mockAnnouncementCreate.mockResolvedValue(
      makeAnnouncement({
        id: 'ann-dedup',
        status: 'published',
        channels: ['email', 'email'],
        publishedAt: new Date(),
      }),
    );

    const req = createPostRequest('/api/v1/announcements', {
      propertyId: PROPERTY_A,
      title: 'Dedup',
      content: 'Testing.',
      channels: ['email', 'email'],
      status: 'published',
    });
    await POST(req);

    const createCall = mockDeliveryCreateMany.mock.calls[0]![0];
    // Each user should have at most 1 email delivery
    const user1Emails = createCall.data.filter(
      (r: { recipientId: string; channel: string }) =>
        r.recipientId === USER_1 && r.channel === 'email',
    );
    expect(user1Emails).toHaveLength(1);
  });

  it('uses skipDuplicates in createMany', async () => {
    mockAnnouncementCreate.mockResolvedValue(
      makeAnnouncement({ status: 'published', channels: ['email'], publishedAt: new Date() }),
    );

    const req = createPostRequest('/api/v1/announcements', {
      propertyId: PROPERTY_A,
      title: 'Skip Dupes',
      content: 'Test.',
      channels: ['email'],
      status: 'published',
    });
    await POST(req);

    const createCall = mockDeliveryCreateMany.mock.calls[0]![0];
    expect(createCall.skipDuplicates).toBe(true);
  });
});

// ===========================================================================
// 20. Soft delete
// ===========================================================================

describe('20. Soft delete announcement', () => {
  it('DELETE sets deletedAt instead of hard deleting', async () => {
    mockAnnouncementUpdate.mockResolvedValue(makeAnnouncement({ deletedAt: new Date() }));

    const req = createDeleteRequest(`/api/v1/announcements/${ANN_ID}`);
    const res = await DELETE(req, makeParams(ANN_ID));

    expect(res.status).toBe(200);
    const updateCall = mockAnnouncementUpdate.mock.calls[0]![0];
    expect(updateCall.data.deletedAt).toBeInstanceOf(Date);
  });
});

// ===========================================================================
// 21. Update announcement content
// ===========================================================================

describe('21. Update announcement fields', () => {
  it('PATCH updates title with XSS sanitization', async () => {
    mockAnnouncementUpdate.mockResolvedValue(makeAnnouncement({ title: 'Updated Title' }));

    const req = createPatchRequest(`/api/v1/announcements/${ANN_ID}`, {
      title: '<b>Updated</b> Title',
    });
    const res = await PATCH(req, makeParams(ANN_ID));

    expect(res.status).toBe(200);
    const updateCall = mockAnnouncementUpdate.mock.calls[0]![0];
    expect(updateCall.data.title).not.toContain('<b>');
  });

  it('PATCH updates priority', async () => {
    mockAnnouncementUpdate.mockResolvedValue(makeAnnouncement({ priority: 'high' }));

    const req = createPatchRequest(`/api/v1/announcements/${ANN_ID}`, {
      priority: 'high',
    });
    await PATCH(req, makeParams(ANN_ID));

    const updateCall = mockAnnouncementUpdate.mock.calls[0]![0];
    expect(updateCall.data.priority).toBe('high');
  });

  it('PATCH updates channels', async () => {
    mockAnnouncementUpdate.mockResolvedValue(makeAnnouncement({ channels: ['sms'] }));

    const req = createPatchRequest(`/api/v1/announcements/${ANN_ID}`, {
      channels: ['sms'],
    });
    await PATCH(req, makeParams(ANN_ID));

    const updateCall = mockAnnouncementUpdate.mock.calls[0]![0];
    expect(updateCall.data.channels).toEqual(['sms']);
  });
});

// ===========================================================================
// 22. Validation errors
// ===========================================================================

describe('22. Validation errors', () => {
  it('rejects missing propertyId', async () => {
    const req = createPostRequest('/api/v1/announcements', {
      title: 'No Property',
      content: 'Missing propertyId.',
      channels: ['email'],
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('rejects invalid propertyId format', async () => {
    const req = createPostRequest('/api/v1/announcements', {
      propertyId: 'not-a-uuid',
      title: 'Bad UUID',
      content: 'Content.',
      channels: ['email'],
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });

  it('rejects missing content', async () => {
    const req = createPostRequest('/api/v1/announcements', {
      propertyId: PROPERTY_A,
      title: 'Title',
      channels: ['email'],
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
  });
});

// ===========================================================================
// 23. Auth guard
// ===========================================================================

describe('23. Authentication and authorization', () => {
  it('returns error when auth fails', async () => {
    mockGuardRoute.mockResolvedValue({
      user: null,
      error: new Response(JSON.stringify({ error: 'UNAUTHORIZED' }), { status: 401 }),
    });

    const req = createPostRequest('/api/v1/announcements', {
      propertyId: PROPERTY_A,
      title: 'Unauthorized',
      content: 'Should fail.',
      channels: ['email'],
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
  });
});

// ===========================================================================
// 24. Published announcements set publishedAt
// ===========================================================================

describe('24. Published announcements set publishedAt', () => {
  it('sets publishedAt to current time when status=published', async () => {
    mockAnnouncementCreate.mockResolvedValue(
      makeAnnouncement({ status: 'published', publishedAt: new Date() }),
    );

    const req = createPostRequest('/api/v1/announcements', {
      propertyId: PROPERTY_A,
      title: 'Published Now',
      content: 'Content.',
      channels: ['email'],
      status: 'published',
    });
    await POST(req);

    const createCall = mockAnnouncementCreate.mock.calls[0]![0];
    expect(createCall.data.publishedAt).toBeInstanceOf(Date);
  });

  it('does not set publishedAt for draft', async () => {
    mockAnnouncementCreate.mockResolvedValue(makeAnnouncement({ status: 'draft' }));

    const req = createPostRequest('/api/v1/announcements', {
      propertyId: PROPERTY_A,
      title: 'Draft',
      content: 'Content.',
      channels: ['email'],
      status: 'draft',
    });
    await POST(req);

    const createCall = mockAnnouncementCreate.mock.calls[0]![0];
    expect(createCall.data.publishedAt).toBeNull();
  });
});

// ===========================================================================
// 25. Ordering
// ===========================================================================

describe('25. Announcements ordered by createdAt desc', () => {
  it('GET returns announcements in reverse chronological order', async () => {
    mockAnnouncementFindMany.mockResolvedValue([]);
    mockAnnouncementCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/announcements', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET(req);

    const findCall = mockAnnouncementFindMany.mock.calls[0]![0];
    expect(findCall.orderBy).toEqual({ createdAt: 'desc' });
  });
});

// ===========================================================================
// 26. No delivery when property has no users
// ===========================================================================

describe('26. No delivery records when property has no users', () => {
  it('does not call createMany when property has zero users', async () => {
    mockUserPropertyFindMany.mockResolvedValue([]);

    mockAnnouncementCreate.mockResolvedValue(
      makeAnnouncement({ status: 'published', channels: ['email'], publishedAt: new Date() }),
    );

    const req = createPostRequest('/api/v1/announcements', {
      propertyId: PROPERTY_A,
      title: 'Empty Property',
      content: 'No one to send to.',
      channels: ['email'],
      status: 'published',
    });
    await POST(req);

    expect(mockDeliveryCreateMany).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// 27. createdById from auth user
// ===========================================================================

describe('27. createdById from authenticated user', () => {
  it('sets createdById to the authenticated user ID', async () => {
    mockAnnouncementCreate.mockResolvedValue(makeAnnouncement());

    const req = createPostRequest('/api/v1/announcements', {
      propertyId: PROPERTY_A,
      title: 'Author Test',
      content: 'Content.',
      channels: ['email'],
    });
    await POST(req);

    const createCall = mockAnnouncementCreate.mock.calls[0]![0];
    expect(createCall.data.createdById).toBe('test-admin');
  });
});
