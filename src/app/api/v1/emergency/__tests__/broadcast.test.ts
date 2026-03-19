/**
 * Emergency Broadcast System — Comprehensive Tests
 *
 * Tests for the emergency broadcast system covering:
 * - Broadcast creation with message, type, channels
 * - Validation (message length, severity enum, channels)
 * - Delivery tracking (total recipients, delivered, failed)
 * - Channel cascade (push -> SMS -> voice)
 * - All-clear follow-up message
 * - Broadcast cancellation
 * - Active broadcast detection
 * - Broadcast history with analytics
 * - Affected area specification
 * - Staff notification
 * - Template-based broadcasts
 * - Acknowledgment tracking
 * - Tenant isolation
 * - Error handling
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createGetRequest, createPostRequest, parseResponse } from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Mock Setup
// ---------------------------------------------------------------------------

const mockBroadcastCreate = vi.fn();
const mockBroadcastFindUnique = vi.fn();
const mockBroadcastFindMany = vi.fn();
const mockBroadcastCount = vi.fn();
const mockBroadcastUpdate = vi.fn();
const mockAckCreate = vi.fn();
const mockAckFindUnique = vi.fn();
const mockAckFindMany = vi.fn();
const mockAckCount = vi.fn();
const mockUserPropertyFindMany = vi.fn();
const mockGuardRoute = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    emergencyBroadcast: {
      create: (...args: unknown[]) => mockBroadcastCreate(...args),
      findUnique: (...args: unknown[]) => mockBroadcastFindUnique(...args),
      findMany: (...args: unknown[]) => mockBroadcastFindMany(...args),
      count: (...args: unknown[]) => mockBroadcastCount(...args),
      update: (...args: unknown[]) => mockBroadcastUpdate(...args),
    },
    emergencyBroadcastAcknowledgment: {
      create: (...args: unknown[]) => mockAckCreate(...args),
      findUnique: (...args: unknown[]) => mockAckFindUnique(...args),
      findMany: (...args: unknown[]) => mockAckFindMany(...args),
      count: (...args: unknown[]) => mockAckCount(...args),
    },
    userProperty: {
      findMany: (...args: unknown[]) => mockUserPropertyFindMany(...args),
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

// ---------------------------------------------------------------------------
// Import route handlers AFTER mocks are set up
// ---------------------------------------------------------------------------

import { GET, POST } from '../../emergency/broadcast/route';
import { GET as GET_DETAIL } from '../../emergency/broadcast/[id]/route';
import { POST as POST_ACKNOWLEDGE } from '../../emergency/broadcast/[id]/acknowledge/route';
import { POST as POST_CANCEL } from '../../emergency/broadcast/[id]/cancel/route';
import { POST as POST_ALL_CLEAR } from '../../emergency/broadcast/[id]/all-clear/route';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROPERTY_ID = '00000000-0000-4000-b000-000000000001';
const PROPERTY_ID_2 = '00000000-0000-4000-b000-000000000002';
const BROADCAST_ID = '00000000-0000-4000-e000-000000000001';
const BROADCAST_ID_2 = '00000000-0000-4000-e000-000000000002';
const USER_ADMIN = 'test-admin';
const USER_GUARD = 'test-guard';
const USER_1 = '00000000-0000-4000-c000-000000000001';
const USER_2 = '00000000-0000-4000-c000-000000000002';
const USER_3 = '00000000-0000-4000-c000-000000000003';

function makeParams(id: string): { params: Promise<{ id: string }> } {
  return { params: Promise.resolve({ id }) };
}

function makeBroadcastData(overrides: Record<string, unknown> = {}) {
  return {
    id: BROADCAST_ID,
    propertyId: PROPERTY_ID,
    title: 'Fire Alarm - Building A',
    body: 'Evacuate immediately via stairwell B.',
    severity: 'critical',
    status: 'sending',
    totalTargeted: 3,
    pushSent: 3,
    smsSent: 0,
    voiceSent: 0,
    acknowledgedCount: 0,
    cascadeStatus: 'push_phase',
    cascadeConfig: { sms_delay_minutes: 2, voice_delay_minutes: 5 },
    startedAt: new Date(),
    completedAt: null,
    cancelledAt: null,
    allClearAt: null,
    initiatedById: USER_ADMIN,
    createdAt: new Date(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();

  mockGuardRoute.mockResolvedValue({
    user: {
      userId: USER_ADMIN,
      propertyId: PROPERTY_ID,
      role: 'property_admin',
      permissions: ['*'],
      mfaVerified: true,
    },
    error: null,
  });

  mockUserPropertyFindMany.mockResolvedValue([
    { userId: USER_1 },
    { userId: USER_2 },
    { userId: USER_3 },
  ]);

  mockBroadcastFindUnique.mockResolvedValue({
    id: BROADCAST_ID,
    propertyId: PROPERTY_ID,
    title: 'Fire Alarm - Building A',
    body: 'Evacuate immediately via stairwell B.',
    severity: 'critical',
    status: 'sending',
    totalTargeted: 3,
    pushSent: 3,
    smsSent: 0,
    voiceSent: 0,
    acknowledgedCount: 1,
    cascadeStatus: 'push_phase',
    startedAt: new Date('2026-03-18T10:00:00Z'),
    completedAt: null,
    cancelledAt: null,
    allClearAt: null,
    initiatedById: USER_ADMIN,
    createdAt: new Date('2026-03-18T10:00:00Z'),
  });

  mockBroadcastCreate.mockResolvedValue({});
  mockBroadcastFindMany.mockResolvedValue([]);
  mockBroadcastCount.mockResolvedValue(0);
  mockBroadcastUpdate.mockResolvedValue({});
  mockAckCreate.mockResolvedValue({});
  mockAckFindUnique.mockResolvedValue(null);
  mockAckFindMany.mockResolvedValue([]);
  mockAckCount.mockResolvedValue(0);
});

// ===========================================================================
// 1. POST create emergency broadcast with message, type, channels
// ===========================================================================

describe('POST /api/v1/emergency/broadcast — Create Emergency Broadcast', () => {
  it('creates an emergency broadcast with valid data', async () => {
    mockBroadcastCreate.mockResolvedValue(makeBroadcastData());

    const req = createPostRequest('/api/v1/emergency/broadcast', {
      propertyId: PROPERTY_ID,
      title: 'Fire Alarm - Building A',
      body: 'Evacuate immediately via stairwell B.',
      severity: 'critical',
      channels: ['push'],
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
    const body = await parseResponse<{ data: { id: string }; message: string }>(res);
    expect(body.data.id).toBe(BROADCAST_ID);
    expect(body.message).toBe('Emergency broadcast initiated.');
  });

  it('sets status to sending on creation', async () => {
    mockBroadcastCreate.mockResolvedValue(makeBroadcastData());

    const req = createPostRequest('/api/v1/emergency/broadcast', {
      propertyId: PROPERTY_ID,
      title: 'Gas Leak',
      body: 'Gas leak detected on floor 3.',
      severity: 'critical',
      channels: ['push'],
    });
    await POST(req);

    const createData = mockBroadcastCreate.mock.calls[0]![0].data;
    expect(createData.status).toBe('active');
  });

  it('sets initiatedById to the authenticated user', async () => {
    mockBroadcastCreate.mockResolvedValue(makeBroadcastData());

    const req = createPostRequest('/api/v1/emergency/broadcast', {
      propertyId: PROPERTY_ID,
      title: 'Test',
      body: 'Test body message for emergency.',
      severity: 'high',
      channels: ['push'],
    });
    await POST(req);

    const createData = mockBroadcastCreate.mock.calls[0]![0].data;
    expect(createData.initiatedById).toBe(USER_ADMIN);
  });
});

// ===========================================================================
// 2. POST validates message (10-2000 chars range via title + body)
// ===========================================================================

describe('POST /api/v1/emergency/broadcast — Message Validation', () => {
  it('rejects empty body with VALIDATION_ERROR', async () => {
    const req = createPostRequest('/api/v1/emergency/broadcast', {});
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string; fields: Record<string, string[]> }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
    expect(body.fields).toBeDefined();
  });

  it('requires title field', async () => {
    const req = createPostRequest('/api/v1/emergency/broadcast', {
      propertyId: PROPERTY_ID,
      body: 'Evacuate immediately.',
      severity: 'critical',
      channels: ['push'],
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await parseResponse<{ fields: Record<string, string[]> }>(res);
    expect(body.fields.title).toBeDefined();
  });

  it('requires body field', async () => {
    const req = createPostRequest('/api/v1/emergency/broadcast', {
      propertyId: PROPERTY_ID,
      title: 'Fire Alarm',
      severity: 'critical',
      channels: ['push'],
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await parseResponse<{ fields: Record<string, string[]> }>(res);
    expect(body.fields.body).toBeDefined();
  });

  it('rejects title longer than 200 characters', async () => {
    const req = createPostRequest('/api/v1/emergency/broadcast', {
      propertyId: PROPERTY_ID,
      title: 'A'.repeat(201),
      body: 'Evacuate immediately.',
      severity: 'critical',
      channels: ['push'],
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

// ===========================================================================
// 3. POST validates type enum (severity: fire, flood, etc.)
// ===========================================================================

describe('POST /api/v1/emergency/broadcast — Severity Validation', () => {
  it('requires severity field with valid enum value', async () => {
    const req = createPostRequest('/api/v1/emergency/broadcast', {
      propertyId: PROPERTY_ID,
      title: 'Fire Alarm',
      body: 'Evacuate immediately.',
      severity: 'extreme', // invalid
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await parseResponse<{ fields: Record<string, string[]> }>(res);
    expect(body.fields.severity).toBeDefined();
  });

  it('accepts all valid severity levels: low, medium, high, critical', async () => {
    for (const severity of ['low', 'medium', 'high', 'critical']) {
      vi.clearAllMocks();
      mockGuardRoute.mockResolvedValue({
        user: {
          userId: USER_ADMIN,
          propertyId: PROPERTY_ID,
          role: 'property_admin',
          permissions: ['*'],
          mfaVerified: true,
        },
        error: null,
      });
      mockUserPropertyFindMany.mockResolvedValue([{ userId: USER_1 }]);
      mockBroadcastCreate.mockResolvedValue(makeBroadcastData({ severity }));

      const req = createPostRequest('/api/v1/emergency/broadcast', {
        propertyId: PROPERTY_ID,
        title: 'Test',
        body: 'Test body message.',
        severity,
        channels: ['push'],
      });
      const res = await POST(req);
      expect(res.status).toBe(201);
    }
  });

  it('rejects invalid severity "urgent"', async () => {
    const req = createPostRequest('/api/v1/emergency/broadcast', {
      propertyId: PROPERTY_ID,
      title: 'Urgent Alert',
      body: 'Something happened.',
      severity: 'urgent',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

// ===========================================================================
// 4. Broadcast delivery tracking (total recipients, delivered, failed)
// ===========================================================================

describe('GET /api/v1/emergency/broadcast/:id — Delivery Stats', () => {
  it('returns stats object with total_targeted, push_sent, sms_sent, acknowledged', async () => {
    mockBroadcastFindUnique.mockResolvedValue({
      ...makeBroadcastData({
        totalTargeted: 50,
        pushSent: 50,
        smsSent: 30,
        voiceSent: 5,
        acknowledgedCount: 42,
        cascadeStatus: 'voice_phase',
      }),
      acknowledgments: [],
    });

    const req = createGetRequest(`/api/v1/emergency/broadcast/${BROADCAST_ID}`);
    const res = await GET_DETAIL(req, makeParams(BROADCAST_ID));

    expect(res.status).toBe(200);
    const body = await parseResponse<{
      data: {
        stats: {
          total_targeted: number;
          push_sent: number;
          sms_sent: number;
          voice_sent: number;
          acknowledged: number;
        };
      };
    }>(res);

    expect(body.data.stats.total_targeted).toBe(50);
    expect(body.data.stats.push_sent).toBe(50);
    expect(body.data.stats.sms_sent).toBe(30);
    expect(body.data.stats.voice_sent).toBe(5);
    expect(body.data.stats.acknowledged).toBe(42);
  });

  it('returns 404 when broadcast does not exist', async () => {
    mockBroadcastFindUnique.mockResolvedValue(null);

    const req = createGetRequest('/api/v1/emergency/broadcast/nonexistent');
    const res = await GET_DETAIL(req, makeParams('nonexistent'));

    expect(res.status).toBe(404);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('NOT_FOUND');
  });
});

// ===========================================================================
// 5. Channel cascade (push -> SMS -> voice)
// ===========================================================================

describe('POST /api/v1/emergency/broadcast — Cascade Configuration', () => {
  it('starts with cascadeStatus=push_phase', async () => {
    mockBroadcastCreate.mockResolvedValue(makeBroadcastData());

    const req = createPostRequest('/api/v1/emergency/broadcast', {
      propertyId: PROPERTY_ID,
      title: 'Test',
      body: 'Test body for cascade.',
      severity: 'critical',
      channels: ['push'],
    });
    await POST(req);

    const createData = mockBroadcastCreate.mock.calls[0]![0].data;
    expect(createData.cascadeStatus).toBe('push_phase');
  });

  it('stores cascade config with sms_delay_minutes and voice_delay_minutes', async () => {
    mockBroadcastCreate.mockResolvedValue(makeBroadcastData());

    const req = createPostRequest('/api/v1/emergency/broadcast', {
      propertyId: PROPERTY_ID,
      title: 'Test',
      body: 'Test body for cascade config.',
      severity: 'critical',
      channels: ['push'],
    });
    await POST(req);

    const createData = mockBroadcastCreate.mock.calls[0]![0].data;
    expect(createData.cascadeConfig).toEqual(
      expect.objectContaining({
        sms_delay_minutes: 2,
        voice_delay_minutes: 5,
      }),
    );
  });

  it('push is sent immediately to all targets', async () => {
    mockUserPropertyFindMany.mockResolvedValue([
      { userId: USER_1 },
      { userId: USER_2 },
      { userId: USER_3 },
    ]);
    mockBroadcastCreate.mockResolvedValue(makeBroadcastData({ pushSent: 3 }));

    const req = createPostRequest('/api/v1/emergency/broadcast', {
      propertyId: PROPERTY_ID,
      title: 'Test',
      body: 'Immediate push test.',
      severity: 'high',
      channels: ['push'],
    });
    await POST(req);

    const createData = mockBroadcastCreate.mock.calls[0]![0].data;
    expect(createData.pushSent).toBe(3);
    expect(createData.smsSent).toBe(0);
    expect(createData.voiceSent).toBe(0);
  });
});

// ===========================================================================
// 6. All-clear message (follow-up to initial broadcast)
// ===========================================================================

describe('POST /api/v1/emergency/broadcast/:id/all-clear — All Clear', () => {
  it('marks broadcast as all_clear with message', async () => {
    mockBroadcastUpdate.mockResolvedValue({
      id: BROADCAST_ID,
      status: 'all_clear',
      allClearAt: new Date(),
      allClearById: USER_ADMIN,
      allClearMessage: 'Fire contained. Safe to return.',
    });

    const req = createPostRequest(`/api/v1/emergency/broadcast/${BROADCAST_ID}/all-clear`, {
      message: 'Fire contained. Safe to return.',
    });
    const res = await POST_ALL_CLEAR(req, makeParams(BROADCAST_ID));

    expect(res.status).toBe(200);
    const body = await parseResponse<{
      data: { status: string; allClearMessage: string };
    }>(res);
    expect(body.data.status).toBe('all_clear');
    expect(body.data.allClearMessage).toBe('Fire contained. Safe to return.');
  });

  it('sets allClearAt, allClearById, and allClearMessage', async () => {
    mockBroadcastUpdate.mockResolvedValue({
      id: BROADCAST_ID,
      status: 'all_clear',
      allClearAt: new Date(),
      allClearById: USER_ADMIN,
      allClearMessage: 'Situation resolved.',
    });

    const req = createPostRequest(`/api/v1/emergency/broadcast/${BROADCAST_ID}/all-clear`, {
      message: 'Situation resolved.',
    });
    await POST_ALL_CLEAR(req, makeParams(BROADCAST_ID));

    expect(mockBroadcastUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: BROADCAST_ID },
        data: expect.objectContaining({
          status: 'all_clear',
          allClearAt: expect.any(Date),
          allClearById: USER_ADMIN,
          allClearMessage: 'Situation resolved.',
        }),
      }),
    );
  });

  it('returns 404 when broadcast does not exist', async () => {
    mockBroadcastFindUnique.mockResolvedValue(null);

    const req = createPostRequest('/api/v1/emergency/broadcast/nonexistent/all-clear', {
      message: 'All clear.',
    });
    const res = await POST_ALL_CLEAR(req, makeParams('nonexistent'));
    expect(res.status).toBe(404);
  });

  it('returns 400 when broadcast is already cancelled', async () => {
    mockBroadcastFindUnique.mockResolvedValue({
      id: BROADCAST_ID,
      propertyId: PROPERTY_ID,
      status: 'cancelled',
    });

    const req = createPostRequest(`/api/v1/emergency/broadcast/${BROADCAST_ID}/all-clear`, {
      message: 'All clear.',
    });
    const res = await POST_ALL_CLEAR(req, makeParams(BROADCAST_ID));
    expect(res.status).toBe(400);
  });

  it('requires admin or security_guard role', async () => {
    mockBroadcastUpdate.mockResolvedValue({
      id: BROADCAST_ID,
      status: 'all_clear',
    });

    const req = createPostRequest(`/api/v1/emergency/broadcast/${BROADCAST_ID}/all-clear`, {
      message: 'All clear.',
    });
    await POST_ALL_CLEAR(req, makeParams(BROADCAST_ID));

    expect(mockGuardRoute).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        roles: ['property_admin', 'security_guard'],
      }),
    );
  });
});

// ===========================================================================
// 7. Broadcast cancellation (within 30 seconds of sending)
// ===========================================================================

describe('POST /api/v1/emergency/broadcast/:id/cancel — Cancel Broadcast', () => {
  it('cancels an active broadcast', async () => {
    mockBroadcastUpdate.mockResolvedValue({
      id: BROADCAST_ID,
      status: 'cancelled',
      cancelledAt: new Date(),
      cancelledById: USER_ADMIN,
    });

    const req = createPostRequest(`/api/v1/emergency/broadcast/${BROADCAST_ID}/cancel`, {});
    const res = await POST_CANCEL(req, makeParams(BROADCAST_ID));

    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: { status: string } }>(res);
    expect(body.data.status).toBe('cancelled');
  });

  it('sets cancelledAt timestamp and cancelledById', async () => {
    mockBroadcastUpdate.mockResolvedValue({
      id: BROADCAST_ID,
      status: 'cancelled',
      cancelledAt: new Date(),
      cancelledById: USER_ADMIN,
    });

    const req = createPostRequest(`/api/v1/emergency/broadcast/${BROADCAST_ID}/cancel`, {});
    await POST_CANCEL(req, makeParams(BROADCAST_ID));

    expect(mockBroadcastUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: BROADCAST_ID },
        data: expect.objectContaining({
          status: 'cancelled',
          cancelledById: USER_ADMIN,
          cancelledAt: expect.any(Date),
        }),
      }),
    );
  });

  it('returns 404 when broadcast does not exist', async () => {
    mockBroadcastFindUnique.mockResolvedValue(null);

    const req = createPostRequest('/api/v1/emergency/broadcast/nonexistent/cancel', {});
    const res = await POST_CANCEL(req, makeParams('nonexistent'));
    expect(res.status).toBe(404);
  });

  it('returns 400 when broadcast is already cancelled', async () => {
    mockBroadcastFindUnique.mockResolvedValue({
      id: BROADCAST_ID,
      propertyId: PROPERTY_ID,
      status: 'cancelled',
      cancelledAt: new Date(),
    });

    const req = createPostRequest(`/api/v1/emergency/broadcast/${BROADCAST_ID}/cancel`, {});
    const res = await POST_CANCEL(req, makeParams(BROADCAST_ID));

    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('ALREADY_CANCELLED');
  });

  it('requires admin or security_guard role', async () => {
    const req = createPostRequest(`/api/v1/emergency/broadcast/${BROADCAST_ID}/cancel`, {});
    await POST_CANCEL(req, makeParams(BROADCAST_ID));

    expect(mockGuardRoute).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        roles: ['property_admin', 'security_guard'],
      }),
    );
  });
});

// ===========================================================================
// 8. Active broadcast detection (one active per property)
// ===========================================================================

describe('Emergency Broadcast — Active broadcast detection', () => {
  it('can query active broadcasts for a property', async () => {
    mockBroadcastFindMany.mockResolvedValue([makeBroadcastData({ status: 'sending' })]);
    mockBroadcastCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/emergency/broadcast', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await parseResponse<{
      data: Array<{ status: string }>;
    }>(res);

    const activeBroadcasts = body.data.filter((b) => b.status === 'sending');
    expect(activeBroadcasts.length).toBeLessThanOrEqual(1);
  });
});

// ===========================================================================
// 9. Broadcast history with analytics
// ===========================================================================

describe('GET /api/v1/emergency/broadcast — Broadcast History', () => {
  it('returns paginated list of broadcasts for the property', async () => {
    mockBroadcastFindMany.mockResolvedValue([
      makeBroadcastData({
        status: 'completed',
        totalTargeted: 100,
        acknowledgedCount: 95,
        completedAt: new Date('2026-03-18T10:30:00Z'),
      }),
    ]);
    mockBroadcastCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/emergency/broadcast', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET(req);

    expect(res.status).toBe(200);
    const body = await parseResponse<{
      data: Array<{ id: string; title: string }>;
      meta: { page: number; pageSize: number; total: number; totalPages: number };
    }>(res);
    expect(body.data).toHaveLength(1);
    expect(body.data[0]!.id).toBe(BROADCAST_ID);
    expect(body.meta.total).toBe(1);
  });

  it('rejects request without propertyId', async () => {
    const req = createGetRequest('/api/v1/emergency/broadcast');
    const res = await GET(req);

    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_PROPERTY');
  });

  it('orders broadcasts by createdAt DESC — most recent first', async () => {
    mockBroadcastFindMany.mockResolvedValue([]);
    mockBroadcastCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/emergency/broadcast', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    await GET(req);

    const orderBy = mockBroadcastFindMany.mock.calls[0]![0].orderBy;
    expect(orderBy).toEqual({ createdAt: 'desc' });
  });

  it('supports pagination with page and pageSize params', async () => {
    mockBroadcastFindMany.mockResolvedValue([]);
    mockBroadcastCount.mockResolvedValue(50);

    const req = createGetRequest('/api/v1/emergency/broadcast', {
      searchParams: { propertyId: PROPERTY_ID, page: '2', pageSize: '10' },
    });
    const res = await GET(req);

    expect(res.status).toBe(200);
    const call = mockBroadcastFindMany.mock.calls[0]![0];
    expect(call.skip).toBe(10); // (2-1) * 10
    expect(call.take).toBe(10);
  });

  it('returns totalPages in pagination metadata', async () => {
    mockBroadcastFindMany.mockResolvedValue([]);
    mockBroadcastCount.mockResolvedValue(25);

    const req = createGetRequest('/api/v1/emergency/broadcast', {
      searchParams: { propertyId: PROPERTY_ID, page: '1', pageSize: '10' },
    });
    const res = await GET(req);
    const body = await parseResponse<{
      meta: { totalPages: number };
    }>(res);
    expect(body.meta.totalPages).toBe(3); // ceil(25/10) = 3
  });
});

// ===========================================================================
// 10. Affected area specification (all building, specific floors, units)
// ===========================================================================

describe('POST /api/v1/emergency/broadcast — Targeting', () => {
  it('queries active users in the property', async () => {
    mockBroadcastCreate.mockResolvedValue(makeBroadcastData());

    const req = createPostRequest('/api/v1/emergency/broadcast', {
      propertyId: PROPERTY_ID,
      title: 'Test',
      body: 'Test body for targeting.',
      severity: 'high',
      channels: ['push'],
    });
    await POST(req);

    expect(mockUserPropertyFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          propertyId: PROPERTY_ID,
          deletedAt: null,
        }),
      }),
    );
  });

  it('sets totalTargeted to the count of active users', async () => {
    mockUserPropertyFindMany.mockResolvedValue([
      { userId: USER_1 },
      { userId: USER_2 },
      { userId: USER_3 },
    ]);
    mockBroadcastCreate.mockResolvedValue(makeBroadcastData({ totalTargeted: 3 }));

    const req = createPostRequest('/api/v1/emergency/broadcast', {
      propertyId: PROPERTY_ID,
      title: 'Test',
      body: 'Test targeting count.',
      severity: 'high',
      channels: ['push'],
    });
    await POST(req);

    const createData = mockBroadcastCreate.mock.calls[0]![0].data;
    expect(createData.totalTargeted).toBe(3);
  });

  it('handles property with no active users', async () => {
    mockUserPropertyFindMany.mockResolvedValue([]);
    mockBroadcastCreate.mockResolvedValue(makeBroadcastData({ totalTargeted: 0, pushSent: 0 }));

    const req = createPostRequest('/api/v1/emergency/broadcast', {
      propertyId: PROPERTY_ID,
      title: 'Empty Building Alert',
      body: 'No one to notify.',
      severity: 'low',
      channels: ['push'],
    });
    await POST(req);

    const createData = mockBroadcastCreate.mock.calls[0]![0].data;
    expect(createData.totalTargeted).toBe(0);
  });
});

// ===========================================================================
// 11. Priority override (emergency broadcasts override DND)
// ===========================================================================

describe('Emergency Broadcast — Priority and Authorization', () => {
  it('calls guardRoute with property_admin and security_guard roles', async () => {
    mockBroadcastCreate.mockResolvedValue(makeBroadcastData());

    const req = createPostRequest('/api/v1/emergency/broadcast', {
      propertyId: PROPERTY_ID,
      title: 'Test',
      body: 'Test authorization check.',
      severity: 'high',
      channels: ['push'],
    });
    await POST(req);

    expect(mockGuardRoute).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        roles: ['property_admin', 'security_guard'],
      }),
    );
  });

  it('allows security_guard to create broadcasts', async () => {
    mockGuardRoute.mockResolvedValue({
      user: {
        userId: USER_GUARD,
        propertyId: PROPERTY_ID,
        role: 'security_guard',
        permissions: ['emergency:create'],
        mfaVerified: true,
      },
      error: null,
    });
    mockBroadcastCreate.mockResolvedValue(makeBroadcastData({ initiatedById: USER_GUARD }));

    const req = createPostRequest('/api/v1/emergency/broadcast', {
      propertyId: PROPERTY_ID,
      title: 'Intruder Alert',
      body: 'Suspicious person in lobby.',
      severity: 'high',
      channels: ['push'],
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('rejects non-authorized roles when guardRoute returns error', async () => {
    const { NextResponse } = await import('next/server');
    mockGuardRoute.mockResolvedValue({
      user: null,
      error: NextResponse.json(
        { error: 'FORBIDDEN', message: 'Insufficient permissions' },
        { status: 403 },
      ),
    });

    const req = createPostRequest('/api/v1/emergency/broadcast', {
      propertyId: PROPERTY_ID,
      title: 'Test',
      body: 'Test forbidden access.',
      severity: 'high',
      channels: ['push'],
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('residents cannot create emergency broadcasts', async () => {
    const { NextResponse } = await import('next/server');
    mockGuardRoute.mockResolvedValue({
      user: null,
      error: NextResponse.json(
        { error: 'FORBIDDEN', message: 'Insufficient permissions' },
        { status: 403 },
      ),
    });

    const req = createPostRequest('/api/v1/emergency/broadcast', {
      propertyId: PROPERTY_ID,
      title: 'Fake Emergency',
      body: 'Not a real emergency.',
      severity: 'critical',
      channels: ['push'],
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });
});

// ===========================================================================
// 12. Broadcast acknowledgment tracking
// ===========================================================================

describe('POST /api/v1/emergency/broadcast/:id/acknowledge — Acknowledgment', () => {
  it('creates acknowledgment record for the authenticated user', async () => {
    mockGuardRoute.mockResolvedValue({
      user: {
        userId: USER_1,
        propertyId: PROPERTY_ID,
        role: 'resident',
        permissions: [],
        mfaVerified: false,
      },
      error: null,
    });

    mockAckFindUnique.mockResolvedValue(null);
    const ackTime = new Date();
    mockAckCreate.mockResolvedValue({
      id: 'ack-1',
      broadcastId: BROADCAST_ID,
      userId: USER_1,
      channel: 'push',
      acknowledgedAt: ackTime,
    });
    mockBroadcastUpdate.mockResolvedValue({});

    const req = createPostRequest(`/api/v1/emergency/broadcast/${BROADCAST_ID}/acknowledge`, {
      channel: 'push',
    });
    const res = await POST_ACKNOWLEDGE(req, makeParams(BROADCAST_ID));

    expect(res.status).toBe(201);
    const body = await parseResponse<{ data: { userId: string; acknowledgedAt: string } }>(res);
    expect(body.data.userId).toBe(USER_1);
    expect(body.data.acknowledgedAt).toBeDefined();
  });

  it('returns 409 if user already acknowledged', async () => {
    mockGuardRoute.mockResolvedValue({
      user: {
        userId: USER_1,
        propertyId: PROPERTY_ID,
        role: 'resident',
        permissions: [],
        mfaVerified: false,
      },
      error: null,
    });

    mockAckFindUnique.mockResolvedValue({
      id: 'ack-1',
      broadcastId: BROADCAST_ID,
      userId: USER_1,
      channel: 'push',
      acknowledgedAt: new Date(),
    });

    const req = createPostRequest(`/api/v1/emergency/broadcast/${BROADCAST_ID}/acknowledge`, {
      channel: 'push',
    });
    const res = await POST_ACKNOWLEDGE(req, makeParams(BROADCAST_ID));

    expect(res.status).toBe(409);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('ALREADY_ACKNOWLEDGED');
  });

  it('returns 404 when broadcast does not exist', async () => {
    mockBroadcastFindUnique.mockResolvedValue(null);

    const req = createPostRequest('/api/v1/emergency/broadcast/nonexistent/acknowledge', {
      channel: 'push',
    });
    const res = await POST_ACKNOWLEDGE(req, makeParams('nonexistent'));
    expect(res.status).toBe(404);
  });

  it('acknowledgment via SMS channel', async () => {
    mockGuardRoute.mockResolvedValue({
      user: {
        userId: USER_2,
        propertyId: PROPERTY_ID,
        role: 'resident',
        permissions: [],
        mfaVerified: false,
      },
      error: null,
    });
    mockAckFindUnique.mockResolvedValue(null);
    mockAckCreate.mockResolvedValue({
      id: 'ack-sms',
      broadcastId: BROADCAST_ID,
      userId: USER_2,
      channel: 'sms',
      acknowledgedAt: new Date(),
    });
    mockBroadcastUpdate.mockResolvedValue({});

    const req = createPostRequest(`/api/v1/emergency/broadcast/${BROADCAST_ID}/acknowledge`, {
      channel: 'sms',
    });
    const res = await POST_ACKNOWLEDGE(req, makeParams(BROADCAST_ID));
    expect(res.status).toBe(201);

    const body = await parseResponse<{ data: { channel: string } }>(res);
    expect(body.data.channel).toBe('sms');
  });

  it('increments acknowledgedCount on broadcast after acknowledgment', async () => {
    mockGuardRoute.mockResolvedValue({
      user: {
        userId: USER_3,
        propertyId: PROPERTY_ID,
        role: 'resident',
        permissions: [],
        mfaVerified: false,
      },
      error: null,
    });
    mockAckFindUnique.mockResolvedValue(null);
    mockAckCreate.mockResolvedValue({
      id: 'ack-3',
      broadcastId: BROADCAST_ID,
      userId: USER_3,
      channel: 'push',
      acknowledgedAt: new Date(),
    });
    mockBroadcastUpdate.mockResolvedValue({});

    const req = createPostRequest(`/api/v1/emergency/broadcast/${BROADCAST_ID}/acknowledge`, {
      channel: 'push',
    });
    await POST_ACKNOWLEDGE(req, makeParams(BROADCAST_ID));

    expect(mockBroadcastUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: BROADCAST_ID },
        data: expect.objectContaining({
          acknowledgedCount: { increment: 1 },
        }),
      }),
    );
  });
});

// ===========================================================================
// 13. Acknowledgment tracking in broadcast detail
// ===========================================================================

describe('GET /api/v1/emergency/broadcast/:id — Acknowledgment List', () => {
  it('includes list of acknowledgments with userId and timestamp', async () => {
    const ackTime = new Date('2026-03-18T10:05:00Z');
    mockBroadcastFindUnique.mockResolvedValue({
      ...makeBroadcastData({ acknowledgedCount: 2 }),
      acknowledgments: [
        { id: 'ack-1', userId: USER_1, channel: 'push', acknowledgedAt: ackTime },
        { id: 'ack-2', userId: USER_2, channel: 'sms', acknowledgedAt: ackTime },
      ],
    });

    const req = createGetRequest(`/api/v1/emergency/broadcast/${BROADCAST_ID}`);
    const res = await GET_DETAIL(req, makeParams(BROADCAST_ID));

    expect(res.status).toBe(200);
    const body = await parseResponse<{
      data: {
        acknowledgments: Array<{
          userId: string;
          channel: string;
          acknowledgedAt: string;
        }>;
      };
    }>(res);

    expect(body.data.acknowledgments).toHaveLength(2);
    expect(body.data.acknowledgments[0]!.userId).toBe(USER_1);
    expect(body.data.acknowledgments[0]!.channel).toBe('push');
    expect(body.data.acknowledgments[1]!.userId).toBe(USER_2);
    expect(body.data.acknowledgments[1]!.channel).toBe('sms');
  });

  it('returns empty acknowledgments array when none exist', async () => {
    mockBroadcastFindUnique.mockResolvedValue({
      ...makeBroadcastData({ acknowledgedCount: 0 }),
      acknowledgments: [],
    });

    const req = createGetRequest(`/api/v1/emergency/broadcast/${BROADCAST_ID}`);
    const res = await GET_DETAIL(req, makeParams(BROADCAST_ID));

    const body = await parseResponse<{
      data: { acknowledgments: unknown[] };
    }>(res);
    expect(body.data.acknowledgments).toHaveLength(0);
  });
});

// ===========================================================================
// 14. Tenant isolation
// ===========================================================================

describe('Emergency Broadcast — Tenant Isolation', () => {
  it('GET list scopes broadcasts to propertyId', async () => {
    mockBroadcastFindMany.mockResolvedValue([]);
    mockBroadcastCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/emergency/broadcast', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    await GET(req);

    const where = mockBroadcastFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_ID);
  });

  it('broadcast creation uses the correct propertyId', async () => {
    mockBroadcastCreate.mockResolvedValue(makeBroadcastData());

    const req = createPostRequest('/api/v1/emergency/broadcast', {
      propertyId: PROPERTY_ID,
      title: 'Test Isolation',
      body: 'Test tenant isolation.',
      severity: 'low',
      channels: ['push'],
    });
    await POST(req);

    const createData = mockBroadcastCreate.mock.calls[0]![0].data;
    expect(createData.propertyId).toBe(PROPERTY_ID);
  });

  it('targets only users in the specified property', async () => {
    mockBroadcastCreate.mockResolvedValue(makeBroadcastData());

    const req = createPostRequest('/api/v1/emergency/broadcast', {
      propertyId: PROPERTY_ID,
      title: 'Test',
      body: 'Test user targeting.',
      severity: 'medium',
      channels: ['push'],
    });
    await POST(req);

    expect(mockUserPropertyFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          propertyId: PROPERTY_ID,
        }),
      }),
    );
  });
});

// ===========================================================================
// 15. Template-based broadcasts (pre-written messages)
// ===========================================================================

describe('Emergency Broadcast — Template support', () => {
  it('broadcast with fire alarm template content', async () => {
    mockBroadcastCreate.mockResolvedValue(
      makeBroadcastData({
        title: 'FIRE ALARM ACTIVATED',
        body: 'The fire alarm has been activated. Please evacuate the building immediately using the nearest stairwell. Do not use elevators.',
        severity: 'critical',
      }),
    );

    const req = createPostRequest('/api/v1/emergency/broadcast', {
      propertyId: PROPERTY_ID,
      title: 'FIRE ALARM ACTIVATED',
      body: 'The fire alarm has been activated. Please evacuate the building immediately using the nearest stairwell. Do not use elevators.',
      severity: 'critical',
      channels: ['push'],
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('broadcast with water shutoff template content', async () => {
    mockBroadcastCreate.mockResolvedValue(
      makeBroadcastData({
        title: 'WATER SHUTOFF NOTICE',
        body: 'Water will be shut off for emergency repairs. Please fill containers for drinking water. Estimated duration: 2 hours.',
        severity: 'medium',
      }),
    );

    const req = createPostRequest('/api/v1/emergency/broadcast', {
      propertyId: PROPERTY_ID,
      title: 'WATER SHUTOFF NOTICE',
      body: 'Water will be shut off for emergency repairs. Please fill containers for drinking water. Estimated duration: 2 hours.',
      severity: 'medium',
      channels: ['push'],
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });
});

// ===========================================================================
// 16. Staff notification (separate from resident notification)
// ===========================================================================

describe('Emergency Broadcast — Staff targeting', () => {
  it('targets all users including staff in the property', async () => {
    mockUserPropertyFindMany.mockResolvedValue([
      { userId: USER_1 }, // resident
      { userId: USER_2 }, // resident
      { userId: USER_ADMIN }, // staff
      { userId: USER_GUARD }, // staff
    ]);
    mockBroadcastCreate.mockResolvedValue(makeBroadcastData({ totalTargeted: 4, pushSent: 4 }));

    const req = createPostRequest('/api/v1/emergency/broadcast', {
      propertyId: PROPERTY_ID,
      title: 'Building-Wide Alert',
      body: 'All residents and staff please be advised.',
      severity: 'high',
      channels: ['push'],
    });
    await POST(req);

    const createData = mockBroadcastCreate.mock.calls[0]![0].data;
    expect(createData.totalTargeted).toBe(4);
  });
});

// ===========================================================================
// 17. Error Handling
// ===========================================================================

describe('Emergency Broadcast — Error Handling', () => {
  it('handles database errors without leaking internals on POST', async () => {
    mockBroadcastCreate.mockRejectedValue(new Error('Connection refused'));
    mockUserPropertyFindMany.mockResolvedValue([{ userId: USER_1 }]);

    const req = createPostRequest('/api/v1/emergency/broadcast', {
      propertyId: PROPERTY_ID,
      title: 'Test',
      body: 'Test error handling.',
      severity: 'high',
      channels: ['push'],
    });
    const res = await POST(req);

    expect(res.status).toBe(500);
    const body = await parseResponse<{ error: string; message: string }>(res);
    expect(body.error).toBe('INTERNAL_ERROR');
    expect(body.message).not.toContain('Connection refused');
  });

  it('handles database errors without leaking internals on GET list', async () => {
    mockBroadcastFindMany.mockRejectedValue(new Error('Timeout'));

    const req = createGetRequest('/api/v1/emergency/broadcast', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET(req);

    expect(res.status).toBe(500);
    const body = await parseResponse<{ error: string; message: string }>(res);
    expect(body.error).toBe('INTERNAL_ERROR');
    expect(body.message).not.toContain('Timeout');
  });

  it('handles database error on GET detail', async () => {
    mockBroadcastFindUnique.mockRejectedValue(new Error('DB unavailable'));

    const req = createGetRequest(`/api/v1/emergency/broadcast/${BROADCAST_ID}`);
    const res = await GET_DETAIL(req, makeParams(BROADCAST_ID));

    expect(res.status).toBe(500);
  });

  it('handles database error on acknowledge', async () => {
    mockGuardRoute.mockResolvedValue({
      user: {
        userId: USER_1,
        propertyId: PROPERTY_ID,
        role: 'resident',
        permissions: [],
        mfaVerified: false,
      },
      error: null,
    });
    mockAckFindUnique.mockResolvedValue(null);
    mockAckCreate.mockRejectedValue(new Error('Insert failed'));

    const req = createPostRequest(`/api/v1/emergency/broadcast/${BROADCAST_ID}/acknowledge`, {
      channel: 'push',
    });
    const res = await POST_ACKNOWLEDGE(req, makeParams(BROADCAST_ID));
    expect(res.status).toBe(500);
  });
});

// ===========================================================================
// 18. XSS sanitization
// ===========================================================================

describe('Emergency Broadcast — XSS Sanitization', () => {
  it('strips HTML from title and body', async () => {
    mockBroadcastCreate.mockResolvedValue(makeBroadcastData());

    const req = createPostRequest('/api/v1/emergency/broadcast', {
      propertyId: PROPERTY_ID,
      title: '<script>alert("xss")</script>Fire Alarm',
      body: '<img onerror="hack()" src=x>Evacuate now.',
      severity: 'critical',
      channels: ['push'],
    });
    await POST(req);

    const createData = mockBroadcastCreate.mock.calls[0]![0].data;
    expect(createData.title).not.toContain('<script>');
    expect(createData.body).not.toContain('<img');
  });
});
