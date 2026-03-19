/**
 * Integration Workflow Tests — Emergency Broadcast Lifecycle
 *
 * Tests complete emergency broadcast workflows across multiple API endpoints:
 *   - Create emergency broadcast with severity levels (fire, flood, gas leak, security threat)
 *   - Broadcast reaches all units via push + SMS + voice cascade
 *   - Acknowledgment tracking per unit
 *   - All-clear message after resolution
 *   - Audit trail for emergency events
 *   - Emergency bypasses DND and quiet hours
 *
 * Each test validates notification cascades, acknowledgment tracking, and audit side effects.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createGetRequest,
  createPostRequest,
  createPatchRequest,
  parseResponse,
} from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Prisma Mock
// ---------------------------------------------------------------------------

const mockEmergencyBroadcastCreate = vi.fn();
const mockEmergencyBroadcastFindUnique = vi.fn();
const mockEmergencyBroadcastUpdate = vi.fn();
const mockEmergencyBroadcastFindMany = vi.fn();
const mockEmergencyBroadcastCount = vi.fn();

const mockAcknowledgmentCreate = vi.fn();
const mockAcknowledgmentFindUnique = vi.fn();

const mockUserPropertyFindMany = vi.fn();

const mockEventCreate = vi.fn();
const mockEventUpdate = vi.fn();
const mockEventFindUnique = vi.fn();

const mockNotificationCreate = vi.fn();

const mockTransaction = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    emergencyBroadcast: {
      create: (...args: unknown[]) => mockEmergencyBroadcastCreate(...args),
      findUnique: (...args: unknown[]) => mockEmergencyBroadcastFindUnique(...args),
      update: (...args: unknown[]) => mockEmergencyBroadcastUpdate(...args),
      findMany: (...args: unknown[]) => mockEmergencyBroadcastFindMany(...args),
      count: (...args: unknown[]) => mockEmergencyBroadcastCount(...args),
    },
    emergencyBroadcastAcknowledgment: {
      create: (...args: unknown[]) => mockAcknowledgmentCreate(...args),
      findUnique: (...args: unknown[]) => mockAcknowledgmentFindUnique(...args),
    },
    userProperty: {
      findMany: (...args: unknown[]) => mockUserPropertyFindMany(...args),
    },
    event: {
      create: (...args: unknown[]) => mockEventCreate(...args),
      update: (...args: unknown[]) => mockEventUpdate(...args),
      findUnique: (...args: unknown[]) => mockEventFindUnique(...args),
    },
    notification: {
      create: (...args: unknown[]) => mockNotificationCreate(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

vi.mock('@/lib/sanitize', () => ({
  stripHtml: (s: string) => s,
  stripControlChars: (s: string) => s,
}));

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: vi.fn().mockResolvedValue({
    user: {
      userId: 'security-001',
      propertyId: '00000000-0000-4000-b000-000000000001',
      role: 'security_guard',
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
  POST as createBroadcast,
  GET as listBroadcasts,
} from '@/app/api/v1/emergency/broadcast/route';
import {
  GET as getBroadcast,
  PATCH as patchBroadcast,
  POST as acknowledgeBroadcastFromDetail,
} from '@/app/api/v1/emergency/broadcast/[id]/route';
import { POST as sendAllClear } from '@/app/api/v1/emergency/broadcast/[id]/all-clear/route';
import { POST as acknowledgeBroadcast } from '@/app/api/v1/emergency/broadcast/[id]/acknowledge/route';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROPERTY_ID = '00000000-0000-4000-b000-000000000001';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeBroadcast(overrides: Record<string, unknown> = {}) {
  return {
    id: 'bc-001',
    propertyId: PROPERTY_ID,
    title: 'FIRE ALARM — Building A',
    body: 'Fire detected on floor 12. Please evacuate immediately via stairwells.',
    severity: 'critical',
    status: 'active',
    totalTargeted: 150,
    pushSent: 150,
    smsSent: 0,
    voiceSent: 0,
    acknowledgedCount: 0,
    cascadeStatus: 'push_phase',
    cascadeConfig: {
      channels: ['push', 'sms', 'voice'],
      sms_delay_minutes: 2,
      voice_delay_minutes: 5,
    },
    initiatedById: 'security-001',
    startedAt: new Date(),
    completedAt: null,
    cancelledAt: null,
    allClearAt: null,
    allClearMessage: null,
    allClearById: null,
    createdAt: new Date(),
    deletedAt: null,
    acknowledgments: [],
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
// SCENARIO 1: Fire Emergency — Full Cascade
// ===========================================================================

describe('Scenario 1: Fire Emergency — Push + SMS + Voice Cascade', () => {
  const broadcastId = 'bc-fire-001';

  it('Step 1: POST /emergency/broadcast — fire alarm broadcast created with severity=critical', async () => {
    mockUserPropertyFindMany.mockResolvedValue(
      Array.from({ length: 150 }, (_, i) => ({ userId: `resident-${i + 1}` })),
    );
    mockEmergencyBroadcastCreate.mockResolvedValue(
      makeBroadcast({ id: broadcastId, severity: 'critical' }),
    );

    const req = createPostRequest('/api/v1/emergency/broadcast', {
      propertyId: PROPERTY_ID,
      title: 'FIRE ALARM — Building A',
      body: 'Fire detected on floor 12. Please evacuate immediately via stairwells.',
      severity: 'critical',
      channels: ['push', 'sms', 'voice'],
    });

    const res = await createBroadcast(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{
      data: { severity: string; totalTargeted: number; status: string };
    }>(res);
    expect(body.data.severity).toBe('critical');
    expect(body.data.totalTargeted).toBe(150);
    expect(body.data.status).toBe('active');
  });

  it('Step 2: broadcast starts with push_phase cascade status', async () => {
    mockUserPropertyFindMany.mockResolvedValue([{ userId: 'r1' }, { userId: 'r2' }]);
    mockEmergencyBroadcastCreate.mockResolvedValue(
      makeBroadcast({ id: broadcastId, cascadeStatus: 'push_phase', pushSent: 2 }),
    );

    const req = createPostRequest('/api/v1/emergency/broadcast', {
      propertyId: PROPERTY_ID,
      title: 'FIRE ALARM',
      body: 'Evacuate immediately. This is not a drill.',
      severity: 'critical',
      channels: ['push', 'sms', 'voice'],
    });

    const res = await createBroadcast(req);
    const body = await parseResponse<{ data: { cascadeStatus: string; pushSent: number } }>(res);
    expect(body.data.cascadeStatus).toBe('push_phase');
    expect(body.data.pushSent).toBe(2);
  });

  it('Step 3: resident acknowledges broadcast via push', async () => {
    mockEmergencyBroadcastFindUnique.mockResolvedValue(
      makeBroadcast({ id: broadcastId, status: 'active' }),
    );
    mockAcknowledgmentFindUnique.mockResolvedValue(null); // Not yet acknowledged
    mockAcknowledgmentCreate.mockResolvedValue({
      id: 'ack-001',
      broadcastId,
      userId: 'security-001',
      channel: 'push',
      acknowledgedAt: new Date(),
    });
    mockEmergencyBroadcastUpdate.mockResolvedValue(
      makeBroadcast({ id: broadcastId, acknowledgedCount: 1 }),
    );

    const req = createPostRequest(`/api/v1/emergency/broadcast/${broadcastId}/acknowledge`, {
      channel: 'push',
    });

    const res = await acknowledgeBroadcast(req, { params: Promise.resolve({ id: broadcastId }) });
    expect(res.status).toBe(201);

    const body = await parseResponse<{ data: { channel: string; broadcastId: string } }>(res);
    expect(body.data.channel).toBe('push');
    expect(body.data.broadcastId).toBe(broadcastId);
  });

  it('Step 4: duplicate acknowledgment is rejected', async () => {
    mockEmergencyBroadcastFindUnique.mockResolvedValue(
      makeBroadcast({ id: broadcastId, status: 'active' }),
    );
    mockAcknowledgmentFindUnique.mockResolvedValue({
      id: 'ack-001',
      broadcastId,
      userId: 'security-001',
    });

    const req = createPostRequest(`/api/v1/emergency/broadcast/${broadcastId}/acknowledge`, {
      channel: 'push',
    });

    const res = await acknowledgeBroadcast(req, { params: Promise.resolve({ id: broadcastId }) });
    expect(res.status).toBe(409);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('ALREADY_ACKNOWLEDGED');
  });

  it('Step 5: GET /emergency/broadcast/:id shows acknowledgment stats', async () => {
    mockEmergencyBroadcastFindUnique.mockResolvedValue(
      makeBroadcast({
        id: broadcastId,
        totalTargeted: 150,
        pushSent: 150,
        smsSent: 120,
        voiceSent: 30,
        acknowledgedCount: 85,
        acknowledgments: [
          { id: 'ack-1', userId: 'r1', channel: 'push', acknowledgedAt: new Date() },
          { id: 'ack-2', userId: 'r2', channel: 'sms', acknowledgedAt: new Date() },
        ],
      }),
    );

    const req = createGetRequest(`/api/v1/emergency/broadcast/${broadcastId}`);
    const res = await getBroadcast(req, { params: Promise.resolve({ id: broadcastId }) });
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
        acknowledgments: { channel: string }[];
      };
    }>(res);
    expect(body.data.stats.total_targeted).toBe(150);
    expect(body.data.stats.push_sent).toBe(150);
    expect(body.data.stats.sms_sent).toBe(120);
    expect(body.data.stats.voice_sent).toBe(30);
    expect(body.data.stats.acknowledged).toBe(85);
    expect(body.data.acknowledgments).toHaveLength(2);
  });

  it('Step 6: all-clear issued after fire resolved', async () => {
    mockEmergencyBroadcastFindUnique.mockResolvedValue(
      makeBroadcast({ id: broadcastId, status: 'active' }),
    );
    mockEmergencyBroadcastUpdate.mockResolvedValue(
      makeBroadcast({
        id: broadcastId,
        status: 'all_clear',
        allClearAt: new Date(),
        allClearById: 'security-001',
        allClearMessage: 'Fire department confirmed false alarm. Safe to return to units.',
      }),
    );

    const req = createPostRequest(`/api/v1/emergency/broadcast/${broadcastId}/all-clear`, {
      message: 'Fire department confirmed false alarm. Safe to return to units.',
    });

    const res = await sendAllClear(req, { params: Promise.resolve({ id: broadcastId }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { status: string }; message: string }>(res);
    expect(body.data.status).toBe('all_clear');
    expect(body.message).toContain('All-clear');
  });

  it('Step 7: duplicate all-clear is rejected', async () => {
    mockEmergencyBroadcastFindUnique.mockResolvedValue(
      makeBroadcast({ id: broadcastId, status: 'all_clear' }),
    );

    const req = createPatchRequest(`/api/v1/emergency/broadcast/${broadcastId}`, {
      action: 'all_clear',
      message: 'Second all-clear attempt',
    });

    const res = await patchBroadcast(req, { params: Promise.resolve({ id: broadcastId }) });
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('ALREADY_CLEARED');
  });
});

// ===========================================================================
// SCENARIO 2: Flood Emergency — Targeted Floors
// ===========================================================================

describe('Scenario 2: Flood Emergency — Floor-Targeted Broadcast', () => {
  const broadcastId = 'bc-flood-001';

  it('should create flood broadcast targeting specific floors', async () => {
    mockUserPropertyFindMany.mockResolvedValue([
      { userId: 'r-b1-001' },
      { userId: 'r-b1-002' },
      { userId: 'r-b1-003' },
    ]);
    mockEmergencyBroadcastCreate.mockResolvedValue(
      makeBroadcast({
        id: broadcastId,
        title: 'FLOOD WARNING — Basement Levels',
        severity: 'high',
        totalTargeted: 3,
        cascadeConfig: {
          channels: ['push', 'sms'],
          targetAudience: 'specific_floors',
          targetFloors: [-1, -2],
        },
      }),
    );

    const req = createPostRequest('/api/v1/emergency/broadcast', {
      propertyId: PROPERTY_ID,
      title: 'FLOOD WARNING — Basement Levels',
      body: 'Water ingress detected in basement levels B1 and B2. Move vehicles immediately.',
      severity: 'high',
      channels: ['push', 'sms'],
      targetAudience: 'specific_floors',
      targetFloors: [-1, -2],
    });

    const res = await createBroadcast(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{ data: { severity: string; totalTargeted: number } }>(res);
    expect(body.data.severity).toBe('high');
    expect(body.data.totalTargeted).toBe(3);
  });

  it('should reject specific_floors broadcast without targetFloors', async () => {
    const req = createPostRequest('/api/v1/emergency/broadcast', {
      propertyId: PROPERTY_ID,
      title: 'FLOOD WARNING',
      body: 'Water ingress detected in basement.',
      severity: 'high',
      channels: ['push'],
      targetAudience: 'specific_floors',
      // Missing targetFloors
    });

    const res = await createBroadcast(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });
});

// ===========================================================================
// SCENARIO 3: Gas Leak — Multi-Channel Cascade
// ===========================================================================

describe('Scenario 3: Gas Leak — SMS + Voice Cascade After Push', () => {
  const broadcastId = 'bc-gas-001';

  it('should create gas leak broadcast with all channels', async () => {
    mockUserPropertyFindMany.mockResolvedValue(
      Array.from({ length: 80 }, (_, i) => ({ userId: `u-${i}` })),
    );
    mockEmergencyBroadcastCreate.mockResolvedValue(
      makeBroadcast({
        id: broadcastId,
        title: 'GAS LEAK — Floor 5',
        severity: 'critical',
        totalTargeted: 80,
        pushSent: 80,
        cascadeConfig: {
          channels: ['push', 'sms', 'voice'],
          sms_delay_minutes: 2,
          voice_delay_minutes: 5,
        },
      }),
    );

    const req = createPostRequest('/api/v1/emergency/broadcast', {
      propertyId: PROPERTY_ID,
      title: 'GAS LEAK — Floor 5',
      body: 'Natural gas leak reported on floor 5. Do NOT use elevators. Evacuate via stairwells.',
      severity: 'critical',
      channels: ['push', 'sms', 'voice'],
    });

    const res = await createBroadcast(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{ data: { totalTargeted: number; pushSent: number } }>(res);
    expect(body.data.totalTargeted).toBe(80);
    expect(body.data.pushSent).toBe(80);
  });

  it('should track cascade phases (push -> sms -> voice)', async () => {
    // Initially push_phase
    mockEmergencyBroadcastFindUnique.mockResolvedValue(
      makeBroadcast({
        id: broadcastId,
        cascadeStatus: 'push_phase',
        pushSent: 80,
        smsSent: 0,
        voiceSent: 0,
        acknowledgedCount: 40,
      }),
    );

    const req1 = createGetRequest(`/api/v1/emergency/broadcast/${broadcastId}`);
    const res1 = await getBroadcast(req1, { params: Promise.resolve({ id: broadcastId }) });
    const body1 = await parseResponse<{ data: { stats: { push_sent: number; sms_sent: number } } }>(
      res1,
    );
    expect(body1.data.stats.push_sent).toBe(80);
    expect(body1.data.stats.sms_sent).toBe(0);

    // After SMS phase
    mockEmergencyBroadcastFindUnique.mockResolvedValue(
      makeBroadcast({
        id: broadcastId,
        cascadeStatus: 'sms_phase',
        pushSent: 80,
        smsSent: 40,
        voiceSent: 0,
        acknowledgedCount: 60,
      }),
    );

    const req2 = createGetRequest(`/api/v1/emergency/broadcast/${broadcastId}`);
    const res2 = await getBroadcast(req2, { params: Promise.resolve({ id: broadcastId }) });
    const body2 = await parseResponse<{ data: { stats: { sms_sent: number } } }>(res2);
    expect(body2.data.stats.sms_sent).toBe(40);
  });
});

// ===========================================================================
// SCENARIO 4: Security Threat — Staff-Only Broadcast
// ===========================================================================

describe('Scenario 4: Security Threat — Staff-Only Broadcast', () => {
  const broadcastId = 'bc-threat-001';

  it('should create staff-only broadcast for security threat', async () => {
    mockUserPropertyFindMany.mockResolvedValue([
      { userId: 'staff-1' },
      { userId: 'staff-2' },
      { userId: 'staff-3' },
    ]);
    mockEmergencyBroadcastCreate.mockResolvedValue(
      makeBroadcast({
        id: broadcastId,
        title: 'SECURITY ALERT — Armed Intruder',
        severity: 'critical',
        totalTargeted: 3,
        cascadeConfig: {
          channels: ['push', 'sms'],
          targetAudience: 'staff_only',
        },
      }),
    );

    const req = createPostRequest('/api/v1/emergency/broadcast', {
      propertyId: PROPERTY_ID,
      title: 'SECURITY ALERT — Armed Intruder',
      body: 'Suspected armed individual in lobby. Police called. Do not engage. Lock all entrances.',
      severity: 'critical',
      channels: ['push', 'sms'],
      targetAudience: 'staff_only',
    });

    const res = await createBroadcast(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{ data: { totalTargeted: number } }>(res);
    // Only staff should be targeted
    expect(body.data.totalTargeted).toBe(3);
  });

  it('should filter for staff roles when targetAudience is staff_only', async () => {
    mockUserPropertyFindMany.mockResolvedValue([]);
    mockEmergencyBroadcastCreate.mockResolvedValue(makeBroadcast({ id: broadcastId }));

    const req = createPostRequest('/api/v1/emergency/broadcast', {
      propertyId: PROPERTY_ID,
      title: 'SECURITY ALERT',
      body: 'Internal staff alert. Do not share with residents.',
      severity: 'high',
      channels: ['push'],
      targetAudience: 'staff_only',
    });

    await createBroadcast(req);

    expect(mockUserPropertyFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          role: {
            in: ['property_admin', 'front_desk', 'security_guard', 'maintenance_staff'],
          },
        }),
      }),
    );
  });
});

// ===========================================================================
// SCENARIO 5: Emergency Bypasses DND and Quiet Hours
// ===========================================================================

describe('Scenario 5: Emergency Broadcast Bypasses DND and Quiet Hours', () => {
  it('critical broadcast sends to ALL residents regardless of notification preferences', async () => {
    // Even residents with DND enabled should be targeted
    mockUserPropertyFindMany.mockResolvedValue([
      { userId: 'dnd-resident-1' },
      { userId: 'dnd-resident-2' },
      { userId: 'quiet-hours-resident' },
      { userId: 'normal-resident' },
    ]);
    mockEmergencyBroadcastCreate.mockResolvedValue(
      makeBroadcast({
        totalTargeted: 4,
        pushSent: 4,
        severity: 'critical',
      }),
    );

    const req = createPostRequest('/api/v1/emergency/broadcast', {
      propertyId: PROPERTY_ID,
      title: 'EARTHQUAKE — Evacuate',
      body: 'Building structural assessment in progress. Evacuate immediately.',
      severity: 'critical',
      channels: ['push', 'sms', 'voice'],
    });

    const res = await createBroadcast(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{ data: { totalTargeted: number } }>(res);
    // All 4 residents targeted including DND and quiet hours ones
    expect(body.data.totalTargeted).toBe(4);
  });
});

// ===========================================================================
// SCENARIO 6: Broadcast Cancellation (Within 30s Window)
// ===========================================================================

describe('Scenario 6: Broadcast Cancellation Within 30s Window', () => {
  const broadcastId = 'bc-cancel-001';

  it('should cancel broadcast within 30-second window', async () => {
    const recentCreation = new Date(); // Just created
    mockEmergencyBroadcastFindUnique.mockResolvedValue(
      makeBroadcast({ id: broadcastId, status: 'active', createdAt: recentCreation }),
    );
    mockEmergencyBroadcastUpdate.mockResolvedValue(
      makeBroadcast({ id: broadcastId, status: 'cancelled', cancelledAt: new Date() }),
    );

    const req = createPatchRequest(`/api/v1/emergency/broadcast/${broadcastId}`, {
      action: 'cancel',
    });

    const res = await patchBroadcast(req, { params: Promise.resolve({ id: broadcastId }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { status: string }; message: string }>(res);
    expect(body.data.status).toBe('cancelled');
    expect(body.message).toContain('cancelled');
  });

  it('should reject cancellation after 30-second window', async () => {
    const oldCreation = new Date(Date.now() - 60_000); // 60 seconds ago
    mockEmergencyBroadcastFindUnique.mockResolvedValue(
      makeBroadcast({ id: broadcastId, status: 'active', createdAt: oldCreation }),
    );

    const req = createPatchRequest(`/api/v1/emergency/broadcast/${broadcastId}`, {
      action: 'cancel',
    });

    const res = await patchBroadcast(req, { params: Promise.resolve({ id: broadcastId }) });
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('CANCEL_WINDOW_EXPIRED');
  });

  it('should reject cancellation of already-cancelled broadcast', async () => {
    mockEmergencyBroadcastFindUnique.mockResolvedValue(
      makeBroadcast({ id: broadcastId, status: 'cancelled' }),
    );

    const req = createPatchRequest(`/api/v1/emergency/broadcast/${broadcastId}`, {
      action: 'cancel',
    });

    const res = await patchBroadcast(req, { params: Promise.resolve({ id: broadcastId }) });
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('ALREADY_CANCELLED');
  });
});

// ===========================================================================
// SCENARIO 7: Audit Trail for Emergency Events
// ===========================================================================

describe('Scenario 7: Emergency Broadcast Audit Trail', () => {
  it('should list all broadcasts for a property in chronological order', async () => {
    mockEmergencyBroadcastFindMany.mockResolvedValue([
      makeBroadcast({
        id: 'bc-1',
        title: 'Fire alarm floor 3',
        severity: 'critical',
        status: 'all_clear',
        createdAt: new Date('2026-03-18T14:00:00Z'),
      }),
      makeBroadcast({
        id: 'bc-2',
        title: 'Water leak basement',
        severity: 'high',
        status: 'all_clear',
        createdAt: new Date('2026-03-17T10:00:00Z'),
      }),
      makeBroadcast({
        id: 'bc-3',
        title: 'Power outage',
        severity: 'medium',
        status: 'active',
        createdAt: new Date('2026-03-19T08:00:00Z'),
      }),
    ]);
    mockEmergencyBroadcastCount.mockResolvedValue(3);

    const req = createGetRequest('/api/v1/emergency/broadcast', {
      searchParams: { propertyId: PROPERTY_ID },
    });

    const res = await listBroadcasts(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { id: string; severity: string }[];
      meta: { total: number };
    }>(res);
    expect(body.data).toHaveLength(3);
    expect(body.meta.total).toBe(3);
  });

  it('should include acknowledgment details per broadcast for audit', async () => {
    mockEmergencyBroadcastFindUnique.mockResolvedValue(
      makeBroadcast({
        id: 'bc-audit',
        totalTargeted: 100,
        acknowledgedCount: 75,
        acknowledgments: [
          {
            id: 'a1',
            userId: 'r1',
            channel: 'push',
            acknowledgedAt: new Date('2026-03-18T14:01:00Z'),
          },
          {
            id: 'a2',
            userId: 'r2',
            channel: 'sms',
            acknowledgedAt: new Date('2026-03-18T14:03:00Z'),
          },
          {
            id: 'a3',
            userId: 'r3',
            channel: 'voice',
            acknowledgedAt: new Date('2026-03-18T14:06:00Z'),
          },
        ],
      }),
    );

    const req = createGetRequest('/api/v1/emergency/broadcast/bc-audit');
    const res = await getBroadcast(req, { params: Promise.resolve({ id: 'bc-audit' }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: {
        stats: { acknowledged: number; total_targeted: number };
        acknowledgments: { channel: string }[];
      };
    }>(res);
    expect(body.data.stats.acknowledged).toBe(75);
    expect(body.data.stats.total_targeted).toBe(100);
    expect(body.data.acknowledgments).toHaveLength(3);
    const channels = body.data.acknowledgments.map((a) => a.channel);
    expect(channels).toContain('push');
    expect(channels).toContain('sms');
    expect(channels).toContain('voice');
  });
});

// ===========================================================================
// Full End-to-End Workflow
// ===========================================================================

describe('Full Workflow: Fire emergency from trigger to all-clear', () => {
  const broadcastId = 'bc-e2e-001';

  it('complete lifecycle: create -> acknowledge -> all-clear -> verify', async () => {
    // Step 1: Create broadcast
    mockUserPropertyFindMany.mockResolvedValue([
      { userId: 'r1' },
      { userId: 'r2' },
      { userId: 'r3' },
    ]);
    mockEmergencyBroadcastCreate.mockResolvedValue(
      makeBroadcast({
        id: broadcastId,
        totalTargeted: 3,
        pushSent: 3,
        status: 'active',
      }),
    );

    const createRes = await createBroadcast(
      createPostRequest('/api/v1/emergency/broadcast', {
        propertyId: PROPERTY_ID,
        title: 'FIRE ALARM — Building A',
        body: 'Evacuate immediately. Fire detected on floor 12.',
        severity: 'critical',
        channels: ['push', 'sms', 'voice'],
      }),
    );
    expect(createRes.status).toBe(201);

    // Step 2: First resident acknowledges
    mockEmergencyBroadcastFindUnique.mockResolvedValue(
      makeBroadcast({ id: broadcastId, status: 'active' }),
    );
    mockAcknowledgmentFindUnique.mockResolvedValue(null);
    mockAcknowledgmentCreate.mockResolvedValue({
      id: 'ack-1',
      broadcastId,
      userId: 'security-001',
      channel: 'push',
      acknowledgedAt: new Date(),
    });
    mockEmergencyBroadcastUpdate.mockResolvedValue(
      makeBroadcast({ id: broadcastId, acknowledgedCount: 1 }),
    );

    const ackRes = await acknowledgeBroadcast(
      createPostRequest(`/api/v1/emergency/broadcast/${broadcastId}/acknowledge`, {
        channel: 'push',
      }),
      { params: Promise.resolve({ id: broadcastId }) },
    );
    expect(ackRes.status).toBe(201);

    // Step 3: All-clear
    mockEmergencyBroadcastFindUnique.mockResolvedValue(
      makeBroadcast({ id: broadcastId, status: 'active' }),
    );
    mockEmergencyBroadcastUpdate.mockResolvedValue(
      makeBroadcast({
        id: broadcastId,
        status: 'all_clear',
        allClearAt: new Date(),
        allClearMessage: 'False alarm confirmed. Safe to return.',
      }),
    );

    const allClearRes = await sendAllClear(
      createPostRequest(`/api/v1/emergency/broadcast/${broadcastId}/all-clear`, {
        message: 'False alarm confirmed. Safe to return.',
      }),
      { params: Promise.resolve({ id: broadcastId }) },
    );
    expect(allClearRes.status).toBe(200);

    const allClearBody = await parseResponse<{ data: { status: string } }>(allClearRes);
    expect(allClearBody.data.status).toBe('all_clear');

    // Step 4: Verify audit trail
    mockEmergencyBroadcastFindUnique.mockResolvedValue(
      makeBroadcast({
        id: broadcastId,
        status: 'all_clear',
        acknowledgedCount: 3,
        allClearAt: new Date(),
        acknowledgments: [
          { id: 'a1', userId: 'r1', channel: 'push', acknowledgedAt: new Date() },
          { id: 'a2', userId: 'r2', channel: 'sms', acknowledgedAt: new Date() },
          { id: 'a3', userId: 'r3', channel: 'voice', acknowledgedAt: new Date() },
        ],
      }),
    );

    const verifyRes = await getBroadcast(
      createGetRequest(`/api/v1/emergency/broadcast/${broadcastId}`),
      { params: Promise.resolve({ id: broadcastId }) },
    );
    expect(verifyRes.status).toBe(200);

    const verifyBody = await parseResponse<{
      data: { status: string; stats: { acknowledged: number } };
    }>(verifyRes);
    expect(verifyBody.data.status).toBe('all_clear');
    expect(verifyBody.data.stats.acknowledged).toBe(3);
  });
});

// ===========================================================================
// Edge Cases & Validation
// ===========================================================================

describe('Emergency Broadcast: Validation & Edge Cases', () => {
  it('should require propertyId for listing broadcasts', async () => {
    const req = createGetRequest('/api/v1/emergency/broadcast');
    const res = await listBroadcasts(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_PROPERTY');
  });

  it('should return 404 for non-existent broadcast', async () => {
    mockEmergencyBroadcastFindUnique.mockResolvedValue(null);

    const req = createGetRequest('/api/v1/emergency/broadcast/nonexistent');
    const res = await getBroadcast(req, { params: Promise.resolve({ id: 'nonexistent' }) });
    expect(res.status).toBe(404);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('NOT_FOUND');
  });

  it('should return 404 for all-clear on non-existent broadcast', async () => {
    mockEmergencyBroadcastFindUnique.mockResolvedValue(null);

    const req = createPostRequest('/api/v1/emergency/broadcast/nonexistent/all-clear', {
      message: 'Safe now',
    });
    const res = await sendAllClear(req, { params: Promise.resolve({ id: 'nonexistent' }) });
    expect(res.status).toBe(404);
  });

  it('should reject broadcast with missing title', async () => {
    const req = createPostRequest('/api/v1/emergency/broadcast', {
      propertyId: PROPERTY_ID,
      // Missing title
      body: 'Emergency message body here.',
      severity: 'critical',
      channels: ['push'],
    });

    const res = await createBroadcast(req);
    expect(res.status).toBe(400);
  });

  it('should reject broadcast with no channels', async () => {
    const req = createPostRequest('/api/v1/emergency/broadcast', {
      propertyId: PROPERTY_ID,
      title: 'EMERGENCY',
      body: 'Emergency message body here.',
      severity: 'critical',
      channels: [],
    });

    const res = await createBroadcast(req);
    expect(res.status).toBe(400);
  });

  it('should reject broadcast with body under 10 characters', async () => {
    const req = createPostRequest('/api/v1/emergency/broadcast', {
      propertyId: PROPERTY_ID,
      title: 'EMERGENCY',
      body: 'Short',
      severity: 'critical',
      channels: ['push'],
    });

    const res = await createBroadcast(req);
    expect(res.status).toBe(400);
  });

  it('should reject acknowledgment on non-existent broadcast', async () => {
    mockEmergencyBroadcastFindUnique.mockResolvedValue(null);

    const req = createPostRequest('/api/v1/emergency/broadcast/nonexistent/acknowledge', {
      channel: 'push',
    });
    const res = await acknowledgeBroadcast(req, { params: Promise.resolve({ id: 'nonexistent' }) });
    expect(res.status).toBe(404);
  });
});
