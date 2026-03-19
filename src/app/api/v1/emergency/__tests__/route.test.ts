/**
 * Emergency Broadcast API Route Tests — Phase 2 Emergency Broadcast System
 *
 * Push + SMS + voice cascade for critical alerts. When a fire alarm trips or
 * a gas leak is detected, property_admin or security_guard triggers a broadcast
 * that reaches every active resident through escalating channels: push first,
 * then SMS after 2 minutes if unconfirmed, then voice call.
 *
 * Security context: Only property_admin and security_guard can create broadcasts.
 * Every resident in the property is targeted. Acknowledgment tracking ensures
 * nobody is missed during a real emergency.
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
// Shared Constants
// ---------------------------------------------------------------------------

const PROPERTY_ID = '00000000-0000-4000-b000-000000000001';
const BROADCAST_ID = '00000000-0000-4000-e000-000000000001';
const USER_ADMIN = 'test-admin';
const USER_GUARD = 'test-guard';
const USER_RESIDENT = 'test-resident';
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

  // Default: property_admin user
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

  // Default: 3 active users in the property
  mockUserPropertyFindMany.mockResolvedValue([
    { userId: USER_1 },
    { userId: USER_2 },
    { userId: USER_3 },
  ]);

  // Default: broadcast exists
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

  // Default mocks
  mockBroadcastCreate.mockResolvedValue({});
  mockBroadcastFindMany.mockResolvedValue([]);
  mockBroadcastCount.mockResolvedValue(0);
  mockBroadcastUpdate.mockResolvedValue({});
  mockAckCreate.mockResolvedValue({});
  mockAckFindUnique.mockResolvedValue(null);
  mockAckFindMany.mockResolvedValue([]);
  mockAckCount.mockResolvedValue(0);
});

// ---------------------------------------------------------------------------
// 1. POST /emergency/broadcast — creates emergency broadcast
// ---------------------------------------------------------------------------

describe('POST /api/v1/emergency/broadcast — Create Emergency Broadcast', () => {
  it('creates an emergency broadcast with valid data', async () => {
    const broadcastData = {
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
      startedAt: new Date(),
      initiatedById: USER_ADMIN,
      createdAt: new Date(),
    };
    mockBroadcastCreate.mockResolvedValue(broadcastData);

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
});

// ---------------------------------------------------------------------------
// 2. Requires: title, body, severity (low/medium/high/critical)
// ---------------------------------------------------------------------------

describe('POST /api/v1/emergency/broadcast — Validation', () => {
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
      mockBroadcastCreate.mockResolvedValue({
        id: BROADCAST_ID,
        propertyId: PROPERTY_ID,
        title: 'Test',
        body: 'Test body',
        severity,
        status: 'active',
        totalTargeted: 1,
        pushSent: 1,
        smsSent: 0,
        voiceSent: 0,
        acknowledgedCount: 0,
        cascadeStatus: 'push_phase',
        startedAt: new Date(),
        initiatedById: USER_ADMIN,
        createdAt: new Date(),
      });

      const req = createPostRequest('/api/v1/emergency/broadcast', {
        propertyId: PROPERTY_ID,
        title: 'Test',
        body: 'Test body message for broadcast.',
        severity,
        channels: ['push'],
      });
      const res = await POST(req);
      expect(res.status).toBe(201);
    }
  });
});

// ---------------------------------------------------------------------------
// 3. Only property_admin and security_guard can create broadcasts
// ---------------------------------------------------------------------------

describe('POST /api/v1/emergency/broadcast — Authorization', () => {
  it('calls guardRoute with property_admin and security_guard roles', async () => {
    mockBroadcastCreate.mockResolvedValue({
      id: BROADCAST_ID,
      propertyId: PROPERTY_ID,
      title: 'Test',
      body: 'Test broadcast body message here.',
      severity: 'high',
      status: 'sending',
      totalTargeted: 3,
      pushSent: 3,
      smsSent: 0,
      voiceSent: 0,
      acknowledgedCount: 0,
      cascadeStatus: 'push_phase',
      startedAt: new Date(),
      initiatedById: USER_ADMIN,
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/emergency/broadcast', {
      propertyId: PROPERTY_ID,
      title: 'Test',
      body: 'Test broadcast body message',
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

    mockBroadcastCreate.mockResolvedValue({
      id: BROADCAST_ID,
      propertyId: PROPERTY_ID,
      title: 'Intruder Alert',
      body: 'Suspicious person in lobby.',
      severity: 'high',
      status: 'sending',
      totalTargeted: 3,
      pushSent: 3,
      smsSent: 0,
      voiceSent: 0,
      acknowledgedCount: 0,
      cascadeStatus: 'push_phase',
      startedAt: new Date(),
      initiatedById: USER_GUARD,
      createdAt: new Date(),
    });

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
      body: 'Test broadcast body message here.',
      severity: 'high',
      channels: ['push'],
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// 4. Creates EmergencyBroadcast record with status=sending
// ---------------------------------------------------------------------------

describe('POST /api/v1/emergency/broadcast — Record Creation', () => {
  it('creates record with status=sending', async () => {
    mockBroadcastCreate.mockResolvedValue({
      id: BROADCAST_ID,
      propertyId: PROPERTY_ID,
      title: 'Gas Leak',
      body: 'Gas leak detected on floor 3.',
      severity: 'critical',
      status: 'sending',
      totalTargeted: 3,
      pushSent: 3,
      smsSent: 0,
      voiceSent: 0,
      acknowledgedCount: 0,
      cascadeStatus: 'push_phase',
      startedAt: new Date(),
      initiatedById: USER_ADMIN,
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/emergency/broadcast', {
      propertyId: PROPERTY_ID,
      title: 'Gas Leak',
      body: 'Gas leak detected on floor 3.',
      severity: 'critical',
      channels: ['push'],
    });
    await POST(req);

    expect(mockBroadcastCreate).toHaveBeenCalled();
    const createData = mockBroadcastCreate.mock.calls[0]![0].data;
    expect(createData.status).toBe('active');
  });

  it('sets initiatedById to the authenticated user', async () => {
    mockBroadcastCreate.mockResolvedValue({
      id: BROADCAST_ID,
      propertyId: PROPERTY_ID,
      title: 'Test',
      body: 'Test broadcast body message here.',
      severity: 'high',
      status: 'sending',
      totalTargeted: 3,
      pushSent: 3,
      smsSent: 0,
      voiceSent: 0,
      acknowledgedCount: 0,
      cascadeStatus: 'push_phase',
      startedAt: new Date(),
      initiatedById: USER_ADMIN,
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/emergency/broadcast', {
      propertyId: PROPERTY_ID,
      title: 'Test',
      body: 'Test broadcast body message here.',
      severity: 'high',
      channels: ['push'],
    });
    await POST(req);

    const createData = mockBroadcastCreate.mock.calls[0]![0].data;
    expect(createData.initiatedById).toBe(USER_ADMIN);
  });
});

// ---------------------------------------------------------------------------
// 5. Cascading channels: push first, then SMS after 2 min, then voice
// ---------------------------------------------------------------------------

describe('POST /api/v1/emergency/broadcast — Cascade Configuration', () => {
  it('starts with cascadeStatus=push_phase', async () => {
    mockBroadcastCreate.mockResolvedValue({
      id: BROADCAST_ID,
      propertyId: PROPERTY_ID,
      title: 'Test',
      body: 'Test broadcast body message here.',
      severity: 'critical',
      status: 'sending',
      totalTargeted: 3,
      pushSent: 3,
      smsSent: 0,
      voiceSent: 0,
      acknowledgedCount: 0,
      cascadeStatus: 'push_phase',
      startedAt: new Date(),
      initiatedById: USER_ADMIN,
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/emergency/broadcast', {
      propertyId: PROPERTY_ID,
      title: 'Test',
      body: 'Test broadcast body message here.',
      severity: 'critical',
      channels: ['push'],
    });
    await POST(req);

    const createData = mockBroadcastCreate.mock.calls[0]![0].data;
    expect(createData.cascadeStatus).toBe('push_phase');
  });

  it('stores cascade config with sms_delay_minutes and voice_delay_minutes', async () => {
    mockBroadcastCreate.mockResolvedValue({
      id: BROADCAST_ID,
      propertyId: PROPERTY_ID,
      title: 'Test',
      body: 'Test broadcast body message here.',
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
      initiatedById: USER_ADMIN,
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/emergency/broadcast', {
      propertyId: PROPERTY_ID,
      title: 'Test',
      body: 'Test broadcast body message here.',
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
});

// ---------------------------------------------------------------------------
// 6. Targets all active users in the property
// ---------------------------------------------------------------------------

describe('POST /api/v1/emergency/broadcast — Targeting', () => {
  it('queries active users in the property', async () => {
    mockBroadcastCreate.mockResolvedValue({
      id: BROADCAST_ID,
      propertyId: PROPERTY_ID,
      title: 'Test',
      body: 'Test broadcast body message here.',
      severity: 'high',
      status: 'sending',
      totalTargeted: 3,
      pushSent: 3,
      smsSent: 0,
      voiceSent: 0,
      acknowledgedCount: 0,
      cascadeStatus: 'push_phase',
      startedAt: new Date(),
      initiatedById: USER_ADMIN,
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/emergency/broadcast', {
      propertyId: PROPERTY_ID,
      title: 'Test',
      body: 'Test broadcast body message here.',
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

    mockBroadcastCreate.mockResolvedValue({
      id: BROADCAST_ID,
      propertyId: PROPERTY_ID,
      title: 'Test',
      body: 'Test broadcast body message here.',
      severity: 'high',
      status: 'sending',
      totalTargeted: 3,
      pushSent: 3,
      smsSent: 0,
      voiceSent: 0,
      acknowledgedCount: 0,
      cascadeStatus: 'push_phase',
      startedAt: new Date(),
      initiatedById: USER_ADMIN,
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/emergency/broadcast', {
      propertyId: PROPERTY_ID,
      title: 'Test',
      body: 'Test broadcast body message here.',
      severity: 'high',
      channels: ['push'],
    });
    await POST(req);

    const createData = mockBroadcastCreate.mock.calls[0]![0].data;
    expect(createData.totalTargeted).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// 7. GET /emergency/broadcast/:id — returns broadcast status with delivery stats
// ---------------------------------------------------------------------------

describe('GET /api/v1/emergency/broadcast/:id — Broadcast Detail', () => {
  it('returns broadcast details with delivery stats', async () => {
    mockBroadcastFindUnique.mockResolvedValue({
      id: BROADCAST_ID,
      propertyId: PROPERTY_ID,
      title: 'Fire Alarm - Building A',
      body: 'Evacuate immediately via stairwell B.',
      severity: 'critical',
      status: 'sending',
      totalTargeted: 3,
      pushSent: 3,
      smsSent: 1,
      voiceSent: 0,
      acknowledgedCount: 1,
      cascadeStatus: 'sms_phase',
      startedAt: new Date('2026-03-18T10:00:00Z'),
      completedAt: null,
      initiatedById: USER_ADMIN,
      createdAt: new Date('2026-03-18T10:00:00Z'),
      acknowledgments: [
        { id: 'ack-1', userId: USER_1, channel: 'push', acknowledgedAt: new Date() },
      ],
    });

    const req = createGetRequest(`/api/v1/emergency/broadcast/${BROADCAST_ID}`);
    const res = await GET_DETAIL(req, makeParams(BROADCAST_ID));

    expect(res.status).toBe(200);
    const body = await parseResponse<{
      data: {
        id: string;
        stats: {
          total_targeted: number;
          push_sent: number;
          sms_sent: number;
          acknowledged: number;
        };
      };
    }>(res);
    expect(body.data.id).toBe(BROADCAST_ID);
    expect(body.data.stats.total_targeted).toBe(3);
    expect(body.data.stats.push_sent).toBe(3);
    expect(body.data.stats.sms_sent).toBe(1);
    expect(body.data.stats.acknowledged).toBe(1);
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

// ---------------------------------------------------------------------------
// 8. Delivery stats: total_targeted, push_sent, sms_sent, acknowledged
// ---------------------------------------------------------------------------

describe('GET /api/v1/emergency/broadcast/:id — Delivery Stats Shape', () => {
  it('returns stats object with total_targeted, push_sent, sms_sent, acknowledged', async () => {
    mockBroadcastFindUnique.mockResolvedValue({
      id: BROADCAST_ID,
      propertyId: PROPERTY_ID,
      title: 'Water Main Break',
      body: 'Water main break — avoid basement.',
      severity: 'high',
      status: 'sending',
      totalTargeted: 50,
      pushSent: 50,
      smsSent: 30,
      voiceSent: 5,
      acknowledgedCount: 42,
      cascadeStatus: 'voice_phase',
      startedAt: new Date(),
      completedAt: null,
      initiatedById: USER_ADMIN,
      createdAt: new Date(),
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
          acknowledged: number;
        };
      };
    }>(res);

    expect(body.data.stats.total_targeted).toBe(50);
    expect(body.data.stats.push_sent).toBe(50);
    expect(body.data.stats.sms_sent).toBe(30);
    expect(body.data.stats.acknowledged).toBe(42);
  });
});

// ---------------------------------------------------------------------------
// 9. POST /emergency/broadcast/:id/acknowledge — resident confirms receipt
// ---------------------------------------------------------------------------

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
});

// ---------------------------------------------------------------------------
// 10. Acknowledgment tracking: who acknowledged, when
// ---------------------------------------------------------------------------

describe('GET /api/v1/emergency/broadcast/:id — Acknowledgment Tracking', () => {
  it('includes list of acknowledgments with userId and timestamp', async () => {
    const ackTime = new Date('2026-03-18T10:05:00Z');
    mockBroadcastFindUnique.mockResolvedValue({
      id: BROADCAST_ID,
      propertyId: PROPERTY_ID,
      title: 'Fire Alarm',
      body: 'Evacuate now.',
      severity: 'critical',
      status: 'sending',
      totalTargeted: 3,
      pushSent: 3,
      smsSent: 0,
      voiceSent: 0,
      acknowledgedCount: 2,
      cascadeStatus: 'push_phase',
      startedAt: new Date(),
      completedAt: null,
      initiatedById: USER_ADMIN,
      createdAt: new Date(),
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
    expect(body.data.acknowledgments[0]!.acknowledgedAt).toBeDefined();
    expect(body.data.acknowledgments[1]!.userId).toBe(USER_2);
  });
});

// ---------------------------------------------------------------------------
// 11. Cancel broadcast: POST /emergency/broadcast/:id/cancel
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// 12. Cannot send emergency without proper role authorization
// ---------------------------------------------------------------------------

describe('POST /api/v1/emergency/broadcast — Role Enforcement', () => {
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
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('FORBIDDEN');
  });

  it('front_desk cannot create emergency broadcasts', async () => {
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
      body: 'Test broadcast body message here.',
      severity: 'high',
      channels: ['push'],
    });
    const res = await POST(req);

    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// 13. Emergency log: GET /emergency/broadcasts — history of all broadcasts
// ---------------------------------------------------------------------------

describe('GET /api/v1/emergency/broadcast — Broadcast History', () => {
  it('returns paginated list of broadcasts for the property', async () => {
    mockBroadcastFindMany.mockResolvedValue([
      {
        id: BROADCAST_ID,
        propertyId: PROPERTY_ID,
        title: 'Fire Alarm - Building A',
        body: 'Evacuate immediately.',
        severity: 'critical',
        status: 'completed',
        totalTargeted: 100,
        acknowledgedCount: 95,
        startedAt: new Date('2026-03-18T10:00:00Z'),
        completedAt: new Date('2026-03-18T10:30:00Z'),
        initiatedById: USER_ADMIN,
        createdAt: new Date('2026-03-18T10:00:00Z'),
      },
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
});

// ---------------------------------------------------------------------------
// 14. All-clear follow-up: POST /emergency/broadcast/:id/all-clear
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Error Handling
// ---------------------------------------------------------------------------

describe('Emergency Broadcast — Error Handling', () => {
  it('handles database errors without leaking internals on POST', async () => {
    mockBroadcastCreate.mockRejectedValue(new Error('Connection refused'));
    mockUserPropertyFindMany.mockResolvedValue([{ userId: USER_1 }]);

    const req = createPostRequest('/api/v1/emergency/broadcast', {
      propertyId: PROPERTY_ID,
      title: 'Test',
      body: 'Test broadcast body message here.',
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
});
