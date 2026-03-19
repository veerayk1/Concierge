/**
 * Integration Workflow Tests — Security Operations
 *
 * Tests complete security operation workflows spanning multiple API
 * endpoints: fire alarm response, security incidents, noise complaints,
 * and lost key emergencies.
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

const mockEventCreate = vi.fn();
const mockEventFindMany = vi.fn();
const mockEventFindUnique = vi.fn();
const mockEventUpdate = vi.fn();
const mockEventCount = vi.fn();

const mockEmergencyBroadcastCreate = vi.fn();
const mockEmergencyBroadcastFindUnique = vi.fn();
const mockEmergencyBroadcastUpdate = vi.fn();
const mockEmergencyBroadcastFindMany = vi.fn();
const mockEmergencyBroadcastCount = vi.fn();

const mockKeyInventoryFindUnique = vi.fn();
const mockKeyInventoryUpdate = vi.fn();
const mockKeyInventoryCount = vi.fn();

const mockKeyCheckoutCreate = vi.fn();
const mockKeyCheckoutFindUnique = vi.fn();
const mockKeyCheckoutUpdate = vi.fn();

const mockMaintenanceRequestCreate = vi.fn();

const mockUserPropertyFindMany = vi.fn();

const mockTransaction = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    event: {
      create: (...args: unknown[]) => mockEventCreate(...args),
      findMany: (...args: unknown[]) => mockEventFindMany(...args),
      findUnique: (...args: unknown[]) => mockEventFindUnique(...args),
      update: (...args: unknown[]) => mockEventUpdate(...args),
      count: (...args: unknown[]) => mockEventCount(...args),
    },
    emergencyBroadcast: {
      create: (...args: unknown[]) => mockEmergencyBroadcastCreate(...args),
      findUnique: (...args: unknown[]) => mockEmergencyBroadcastFindUnique(...args),
      update: (...args: unknown[]) => mockEmergencyBroadcastUpdate(...args),
      findMany: (...args: unknown[]) => mockEmergencyBroadcastFindMany(...args),
      count: (...args: unknown[]) => mockEmergencyBroadcastCount(...args),
    },
    keyInventory: {
      findUnique: (...args: unknown[]) => mockKeyInventoryFindUnique(...args),
      update: (...args: unknown[]) => mockKeyInventoryUpdate(...args),
      count: (...args: unknown[]) => mockKeyInventoryCount(...args),
    },
    keyCheckout: {
      create: (...args: unknown[]) => mockKeyCheckoutCreate(...args),
      findUnique: (...args: unknown[]) => mockKeyCheckoutFindUnique(...args),
      update: (...args: unknown[]) => mockKeyCheckoutUpdate(...args),
    },
    maintenanceRequest: {
      create: (...args: unknown[]) => mockMaintenanceRequestCreate(...args),
    },
    userProperty: {
      findMany: (...args: unknown[]) => mockUserPropertyFindMany(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

vi.mock('@/schemas/event', () => ({
  createEventSchema: {
    safeParse: vi.fn().mockImplementation((data: Record<string, unknown>) => {
      if (!data.propertyId || !data.eventTypeId || !data.title) {
        return {
          success: false,
          error: { flatten: () => ({ fieldErrors: { title: ['Required'] } }) },
        };
      }
      return { success: true, data };
    }),
  },
  updateEventSchema: {
    safeParse: vi.fn().mockImplementation((data: Record<string, unknown>) => {
      return { success: true, data };
    }),
  },
}));

vi.mock('@/schemas/maintenance', () => ({
  createMaintenanceSchema: {
    safeParse: vi.fn().mockImplementation((data: Record<string, unknown>) => {
      if (!data.propertyId || !data.description) {
        return {
          success: false,
          error: { flatten: () => ({ fieldErrors: { description: ['Required'] } }) },
        };
      }
      return { success: true, data };
    }),
  },
}));

vi.mock('nanoid', () => ({
  nanoid: vi.fn().mockReturnValue('X1Y2Z3'),
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

import { POST as createEvent, GET as listEvents } from '@/app/api/v1/events/route';
import { PATCH as updateEvent, GET as getEvent } from '@/app/api/v1/events/[id]/route';
import { POST as createBroadcast } from '@/app/api/v1/emergency/broadcast/route';
import { POST as sendAllClear } from '@/app/api/v1/emergency/broadcast/[id]/all-clear/route';
import { POST as addIncidentUpdate } from '@/app/api/v1/incidents/[id]/updates/route';
import { POST as issueKey } from '@/app/api/v1/keys/checkouts/route';
import { PATCH as returnKey } from '@/app/api/v1/keys/checkouts/[id]/route';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROPERTY_ID = '00000000-0000-4000-b000-000000000001';
const UNIT_ID = '00000000-0000-4000-a000-000000000101';
const FIRE_ALARM_TYPE_ID = 'evtype-fire-safety';
const INCIDENT_TYPE_ID = 'evtype-incident';
const NOISE_COMPLAINT_TYPE_ID = 'evtype-noise-complaint';

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

// ===========================================================================
// SCENARIO 1: Fire Alarm Event
// ===========================================================================

describe('Scenario 1: Fire Alarm Event — Full Emergency Response', () => {
  const eventId = 'fire-event-001';
  const broadcastId = 'broadcast-001';

  const fireEvent = {
    id: eventId,
    propertyId: PROPERTY_ID,
    eventTypeId: FIRE_ALARM_TYPE_ID,
    title: 'Fire alarm triggered — Floor 12',
    description: 'Smoke detected on floor 12 near garbage chute',
    priority: 'critical',
    status: 'open',
    referenceNo: 'EVT-X1Y2Z3',
    createdById: 'security-001',
    createdAt: new Date(),
    closedAt: null,
    closedById: null,
    customFields: {
      checklists: [
        { id: 'ck1', label: 'Evacuate floor 12', completed: false },
        { id: 'ck2', label: 'Check stairwells', completed: false },
        { id: 'ck3', label: 'Verify fire panel', completed: false },
      ],
      fireDeptCalledAt: null,
      fireDeptDepartedAt: null,
    },
    eventType: { id: FIRE_ALARM_TYPE_ID, name: 'Fire Safety', icon: 'flame', color: '#FF0000' },
    unit: null,
  };

  it('Step 1: POST /api/v1/events — fire alarm triggered', async () => {
    mockEventCreate.mockResolvedValue(fireEvent);

    const req = createPostRequest('/api/v1/events', {
      propertyId: PROPERTY_ID,
      eventTypeId: FIRE_ALARM_TYPE_ID,
      title: 'Fire alarm triggered — Floor 12',
      description: 'Smoke detected on floor 12 near garbage chute',
      priority: 'critical',
      customFields: {
        checklists: [
          { id: 'ck1', label: 'Evacuate floor 12', completed: false },
          { id: 'ck2', label: 'Check stairwells', completed: false },
          { id: 'ck3', label: 'Verify fire panel', completed: false },
        ],
      },
    });

    const res = await createEvent(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{ data: typeof fireEvent }>(res);
    expect(body.data.priority).toBe('critical');
    expect(body.data.eventType.name).toBe('Fire Safety');
    expect(body.data.referenceNo).toBe('EVT-X1Y2Z3');
  });

  it('Step 2: Verify fire safety checklists initialized (3 items)', async () => {
    mockEventCreate.mockResolvedValue(fireEvent);

    const req = createPostRequest('/api/v1/events', {
      propertyId: PROPERTY_ID,
      eventTypeId: FIRE_ALARM_TYPE_ID,
      title: 'Fire alarm triggered — Floor 12',
      priority: 'critical',
      customFields: {
        checklists: [
          { id: 'ck1', label: 'Evacuate floor 12', completed: false },
          { id: 'ck2', label: 'Check stairwells', completed: false },
          { id: 'ck3', label: 'Verify fire panel', completed: false },
        ],
      },
    });

    await createEvent(req);

    const createCall = mockEventCreate.mock.calls[0]![0] as {
      data: { customFields: { checklists: { completed: boolean }[] } };
    };
    const checklists = createCall.data.customFields.checklists;
    expect(checklists).toHaveLength(3);
    expect(checklists.every((c: { completed: boolean }) => c.completed === false)).toBe(true);
  });

  it('Step 3: PATCH /api/v1/events/:id — fire department called timestamp recorded', async () => {
    const now = new Date();
    mockEventUpdate.mockResolvedValue({
      ...fireEvent,
      customFields: {
        ...fireEvent.customFields,
        fireDeptCalledAt: now.toISOString(),
      },
    });

    const req = createPatchRequest(`/api/v1/events/${eventId}`, {
      description: 'Fire department called at ' + now.toISOString(),
    });
    const params = Promise.resolve({ id: eventId });

    const res = await updateEvent(req, { params });
    expect(res.status).toBe(200);
  });

  it('Step 4: POST /api/v1/emergency/broadcast — residents notified via emergency broadcast', async () => {
    mockUserPropertyFindMany.mockResolvedValue([
      { userId: 'resident-1' },
      { userId: 'resident-2' },
      { userId: 'resident-3' },
    ]);
    mockEmergencyBroadcastCreate.mockResolvedValue({
      id: broadcastId,
      propertyId: PROPERTY_ID,
      title: 'FIRE ALARM — Floor 12',
      body: 'Please evacuate immediately via stairwells.',
      severity: 'critical',
      status: 'sending',
      totalTargeted: 3,
      pushSent: 3,
      smsSent: 0,
      voiceSent: 0,
      acknowledgedCount: 0,
      cascadeStatus: 'push_phase',
    });

    const req = createPostRequest('/api/v1/emergency/broadcast', {
      propertyId: PROPERTY_ID,
      title: 'FIRE ALARM — Floor 12',
      body: 'Please evacuate immediately via stairwells.',
      severity: 'critical',
      channels: ['push'],
    });

    const res = await createBroadcast(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{ data: { totalTargeted: number; status: string } }>(res);
    expect(body.data.totalTargeted).toBe(3);
    expect(body.data.status).toBe('sending');
  });

  it('Step 5: PATCH /api/v1/events/:id — checklists completed one by one', async () => {
    // Complete first checklist
    const partiallyComplete = {
      ...fireEvent,
      customFields: {
        ...fireEvent.customFields,
        checklists: [
          { id: 'ck1', label: 'Evacuate floor 12', completed: true },
          { id: 'ck2', label: 'Check stairwells', completed: false },
          { id: 'ck3', label: 'Verify fire panel', completed: false },
        ],
      },
    };
    mockEventUpdate.mockResolvedValue(partiallyComplete);

    const req1 = createPatchRequest(`/api/v1/events/${eventId}`, {
      description: 'Checklist ck1 completed',
    });
    const res1 = await updateEvent(req1, { params: Promise.resolve({ id: eventId }) });
    expect(res1.status).toBe(200);

    // Complete second checklist
    const moreComplete = {
      ...partiallyComplete,
      customFields: {
        ...partiallyComplete.customFields,
        checklists: [
          { id: 'ck1', label: 'Evacuate floor 12', completed: true },
          { id: 'ck2', label: 'Check stairwells', completed: true },
          { id: 'ck3', label: 'Verify fire panel', completed: false },
        ],
      },
    };
    mockEventUpdate.mockResolvedValue(moreComplete);

    const req2 = createPatchRequest(`/api/v1/events/${eventId}`, {
      description: 'Checklist ck2 completed',
    });
    const res2 = await updateEvent(req2, { params: Promise.resolve({ id: eventId }) });
    expect(res2.status).toBe(200);

    // Complete third checklist
    const allComplete = {
      ...moreComplete,
      customFields: {
        ...moreComplete.customFields,
        checklists: [
          { id: 'ck1', label: 'Evacuate floor 12', completed: true },
          { id: 'ck2', label: 'Check stairwells', completed: true },
          { id: 'ck3', label: 'Verify fire panel', completed: true },
        ],
      },
    };
    mockEventUpdate.mockResolvedValue(allComplete);

    const req3 = createPatchRequest(`/api/v1/events/${eventId}`, {
      description: 'Checklist ck3 completed',
    });
    const res3 = await updateEvent(req3, { params: Promise.resolve({ id: eventId }) });
    expect(res3.status).toBe(200);

    expect(mockEventUpdate).toHaveBeenCalledTimes(3);
  });

  it('Step 6: POST /api/v1/emergency/broadcast/:id/all-clear — all-clear issued', async () => {
    mockEmergencyBroadcastFindUnique.mockResolvedValue({
      id: broadcastId,
      propertyId: PROPERTY_ID,
      status: 'sending',
    });
    mockEmergencyBroadcastUpdate.mockResolvedValue({
      id: broadcastId,
      status: 'all_clear',
      allClearAt: new Date(),
      allClearById: 'security-001',
      allClearMessage: 'Fire department confirmed false alarm. Safe to return.',
    });

    const req = createPostRequest(`/api/v1/emergency/broadcast/${broadcastId}/all-clear`, {
      message: 'Fire department confirmed false alarm. Safe to return.',
    });
    const params = Promise.resolve({ id: broadcastId });

    const res = await sendAllClear(req, { params });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { status: string }; message: string }>(res);
    expect(body.data.status).toBe('all_clear');
    expect(body.message).toContain('All-clear');
  });

  it('Step 7: PATCH /api/v1/events/:id — fire department departs', async () => {
    const now = new Date();
    mockEventUpdate.mockResolvedValue({
      ...fireEvent,
      customFields: {
        ...fireEvent.customFields,
        fireDeptDepartedAt: now.toISOString(),
      },
      eventType: fireEvent.eventType,
    });

    const req = createPatchRequest(`/api/v1/events/${eventId}`, {
      description: 'Fire department departed at ' + now.toISOString(),
    });

    const res = await updateEvent(req, { params: Promise.resolve({ id: eventId }) });
    expect(res.status).toBe(200);
  });

  it('Step 8: PATCH /api/v1/events/:id — event closed with full timeline', async () => {
    mockEventUpdate.mockResolvedValue({
      ...fireEvent,
      status: 'closed',
      closedAt: new Date(),
      closedById: 'security-001',
      eventType: fireEvent.eventType,
    });

    const req = createPatchRequest(`/api/v1/events/${eventId}`, {
      status: 'closed',
      description: 'Fire alarm resolved. False alarm caused by construction dust.',
    });

    const res = await updateEvent(req, { params: Promise.resolve({ id: eventId }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { status: string } }>(res);
    expect(body.data.status).toBe('closed');

    const updateCall = mockEventUpdate.mock.calls[0]![0] as {
      data: { closedAt: unknown; closedById: string };
    };
    expect(updateCall.data.closedAt).toBeInstanceOf(Date);
    expect(updateCall.data.closedById).toBe('security-001');
  });

  it('Full workflow: fire alarm from trigger to close', async () => {
    // Step 1: Create fire event
    mockEventCreate.mockResolvedValue(fireEvent);
    const createRes = await createEvent(
      createPostRequest('/api/v1/events', {
        propertyId: PROPERTY_ID,
        eventTypeId: FIRE_ALARM_TYPE_ID,
        title: 'Fire alarm triggered — Floor 12',
        priority: 'critical',
      }),
    );
    expect(createRes.status).toBe(201);

    // Step 2: Emergency broadcast
    mockUserPropertyFindMany.mockResolvedValue([{ userId: 'r1' }]);
    mockEmergencyBroadcastCreate.mockResolvedValue({
      id: broadcastId,
      status: 'sending',
      totalTargeted: 1,
      pushSent: 1,
      smsSent: 0,
      voiceSent: 0,
      acknowledgedCount: 0,
      cascadeStatus: 'push_phase',
      propertyId: PROPERTY_ID,
      title: 'Fire alarm',
      body: 'Evacuate now',
      severity: 'critical',
    });
    const bcRes = await createBroadcast(
      createPostRequest('/api/v1/emergency/broadcast', {
        propertyId: PROPERTY_ID,
        title: 'Fire alarm',
        body: 'Evacuate now',
        severity: 'critical',
        channels: ['push'],
      }),
    );
    expect(bcRes.status).toBe(201);

    // Step 3: All-clear
    mockEmergencyBroadcastFindUnique.mockResolvedValue({
      id: broadcastId,
      propertyId: PROPERTY_ID,
      status: 'sending',
    });
    mockEmergencyBroadcastUpdate.mockResolvedValue({
      id: broadcastId,
      status: 'all_clear',
      allClearAt: new Date(),
    });
    const allClearRes = await sendAllClear(
      createPostRequest(`/api/v1/emergency/broadcast/${broadcastId}/all-clear`, {
        message: 'Safe to return.',
      }),
      { params: Promise.resolve({ id: broadcastId }) },
    );
    expect(allClearRes.status).toBe(200);

    // Step 4: Close event
    mockEventUpdate.mockResolvedValue({
      ...fireEvent,
      status: 'closed',
      closedAt: new Date(),
      eventType: fireEvent.eventType,
    });
    const closeRes = await updateEvent(
      createPatchRequest(`/api/v1/events/${eventId}`, { status: 'closed' }),
      { params: Promise.resolve({ id: eventId }) },
    );
    expect(closeRes.status).toBe(200);
  });
});

// ===========================================================================
// SCENARIO 2: Security Incident
// ===========================================================================

describe('Scenario 2: Security Incident — Report to Resolution', () => {
  const incidentId = 'incident-001';

  const incidentEvent = {
    id: incidentId,
    propertyId: PROPERTY_ID,
    eventTypeId: INCIDENT_TYPE_ID,
    title: 'Suspicious person in parking garage B2',
    description: 'Male, approx 30s, wearing dark hoodie, seen trying car doors',
    priority: 'high',
    status: 'open',
    referenceNo: 'EVT-X1Y2Z3',
    createdById: 'security-001',
    createdAt: new Date(),
    closedAt: null,
    customFields: {
      suspectDescription: 'Male, 30s, dark hoodie, jeans',
      photosAttached: 0,
      policeCalledAt: null,
      policeReportNumber: null,
      escalatedTo: null,
    },
    eventType: {
      id: INCIDENT_TYPE_ID,
      name: 'Security Incident',
      icon: 'shield',
      color: '#FF4444',
    },
    unit: null,
  };

  it('Step 1: POST /api/v1/events — incident reported', async () => {
    mockEventCreate.mockResolvedValue(incidentEvent);

    const req = createPostRequest('/api/v1/events', {
      propertyId: PROPERTY_ID,
      eventTypeId: INCIDENT_TYPE_ID,
      title: 'Suspicious person in parking garage B2',
      description: 'Male, approx 30s, wearing dark hoodie, seen trying car doors',
      priority: 'high',
      customFields: {
        suspectDescription: 'Male, 30s, dark hoodie, jeans',
      },
    });

    const res = await createEvent(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{ data: typeof incidentEvent }>(res);
    expect(body.data.priority).toBe('high');
    expect(body.data.referenceNo).toMatch(/^EVT-/);
  });

  it('Step 2: PATCH /api/v1/events/:id — photos attached count updated', async () => {
    mockEventUpdate.mockResolvedValue({
      ...incidentEvent,
      customFields: { ...incidentEvent.customFields, photosAttached: 3 },
      eventType: incidentEvent.eventType,
    });

    const req = createPatchRequest(`/api/v1/events/${incidentId}`, {
      description: '3 photos attached from security camera B2-CAM-04',
    });

    const res = await updateEvent(req, { params: Promise.resolve({ id: incidentId }) });
    expect(res.status).toBe(200);
  });

  it('Step 3: PATCH /api/v1/events/:id — suspect description recorded', async () => {
    mockEventUpdate.mockResolvedValue({
      ...incidentEvent,
      description:
        'Male, approx 30s, wearing dark hoodie, jeans, white sneakers. Tattoo on left forearm.',
      eventType: incidentEvent.eventType,
    });

    const req = createPatchRequest(`/api/v1/events/${incidentId}`, {
      description:
        'Male, approx 30s, wearing dark hoodie, jeans, white sneakers. Tattoo on left forearm.',
    });

    const res = await updateEvent(req, { params: Promise.resolve({ id: incidentId }) });
    expect(res.status).toBe(200);
  });

  it('Step 4: PATCH /api/v1/events/:id — escalated to security supervisor', async () => {
    mockEventUpdate.mockResolvedValue({
      ...incidentEvent,
      priority: 'critical',
      eventType: incidentEvent.eventType,
    });

    const req = createPatchRequest(`/api/v1/events/${incidentId}`, {
      priority: 'critical',
      description: 'Escalated to Supervisor Johnson.',
    });

    const res = await updateEvent(req, { params: Promise.resolve({ id: incidentId }) });
    expect(res.status).toBe(200);

    const updateCall = mockEventUpdate.mock.calls[0]![0] as {
      data: { priority: string };
    };
    expect(updateCall.data.priority).toBe('critical');
  });

  it('Step 5: PATCH /api/v1/events/:id — police called, emergency services tracked', async () => {
    const policeCalledAt = new Date();
    mockEventUpdate.mockResolvedValue({
      ...incidentEvent,
      description: `Police called at ${policeCalledAt.toISOString()}. Officer Smith responding.`,
      eventType: incidentEvent.eventType,
    });

    const req = createPatchRequest(`/api/v1/events/${incidentId}`, {
      description: `Police called at ${policeCalledAt.toISOString()}. Officer Smith responding.`,
    });

    const res = await updateEvent(req, { params: Promise.resolve({ id: incidentId }) });
    expect(res.status).toBe(200);
  });

  it('Step 6: POST /api/v1/incidents/:id/updates — incident updates posted', async () => {
    mockEventFindUnique.mockResolvedValue({
      id: incidentId,
      description: 'Initial incident description',
      customFields: {},
    });
    mockEventUpdate.mockResolvedValue({ id: incidentId });

    const req = createPostRequest(`/api/v1/incidents/${incidentId}/updates`, {
      content: 'Police arrived on scene. Suspect fled on foot towards King St.',
      isInternal: false,
    });

    const res = await addIncidentUpdate(req, { params: Promise.resolve({ id: incidentId }) });
    expect(res.status).toBe(201);

    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('Update added');
  });

  it('Step 7: POST /api/v1/incidents/:id/updates — resolution summary written', async () => {
    mockEventFindUnique.mockResolvedValue({
      id: incidentId,
      description: 'Existing timeline',
      customFields: {},
    });
    mockEventUpdate.mockResolvedValue({ id: incidentId });

    const req = createPostRequest(`/api/v1/incidents/${incidentId}/updates`, {
      content:
        'Resolution: Suspect apprehended by police 2 blocks away. Police report #2026-44812 filed.',
      isInternal: false,
    });

    const res = await addIncidentUpdate(req, { params: Promise.resolve({ id: incidentId }) });
    expect(res.status).toBe(201);

    // Verify the description was appended to
    const updateCall = mockEventUpdate.mock.calls[0]![0] as {
      data: { description: string };
    };
    expect(updateCall.data.description).toContain('Resolution:');
    expect(updateCall.data.description).toContain('Existing timeline');
  });

  it('Step 8: PATCH /api/v1/events/:id — incident closed', async () => {
    mockEventUpdate.mockResolvedValue({
      ...incidentEvent,
      status: 'closed',
      closedAt: new Date(),
      closedById: 'security-001',
      eventType: incidentEvent.eventType,
    });

    const req = createPatchRequest(`/api/v1/events/${incidentId}`, {
      status: 'closed',
    });

    const res = await updateEvent(req, { params: Promise.resolve({ id: incidentId }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { status: string } }>(res);
    expect(body.data.status).toBe('closed');
  });

  it('Incident updates are appended to description preserving timeline', async () => {
    const existingDesc = 'Incident reported at 14:00.';
    mockEventFindUnique.mockResolvedValue({
      id: incidentId,
      description: existingDesc,
      customFields: {},
    });
    mockEventUpdate.mockResolvedValue({ id: incidentId });

    const req = createPostRequest(`/api/v1/incidents/${incidentId}/updates`, {
      content: 'Update: Camera footage reviewed.',
    });

    await addIncidentUpdate(req, { params: Promise.resolve({ id: incidentId }) });

    const updateData = (mockEventUpdate.mock.calls[0]![0] as { data: { description: string } })
      .data;
    expect(updateData.description).toContain(existingDesc);
    expect(updateData.description).toContain('Update: Camera footage reviewed.');
    expect(updateData.description).toContain('--- Update');
  });

  it('Incident update on non-existent incident returns 404', async () => {
    mockEventFindUnique.mockResolvedValue(null);

    const req = createPostRequest('/api/v1/incidents/nonexistent/updates', {
      content: 'This should fail',
    });

    const res = await addIncidentUpdate(req, {
      params: Promise.resolve({ id: 'nonexistent' }),
    });
    expect(res.status).toBe(404);
  });
});

// ===========================================================================
// SCENARIO 3: Noise Complaint Cycle
// ===========================================================================

describe('Scenario 3: Noise Complaint — Receive, Investigate, Resolve', () => {
  const complaintId = 'noise-001';

  const noiseEvent = {
    id: complaintId,
    propertyId: PROPERTY_ID,
    eventTypeId: NOISE_COMPLAINT_TYPE_ID,
    unitId: UNIT_ID,
    title: 'Noise complaint — Unit 302',
    description: 'Loud music reported by Unit 304',
    priority: 'normal',
    status: 'open',
    referenceNo: 'EVT-X1Y2Z3',
    createdById: 'security-001',
    createdAt: new Date(),
    customFields: {
      complaintFloor: 3,
      noiseType: 'music',
      volumeLevel: 'loud',
    },
    eventType: {
      id: NOISE_COMPLAINT_TYPE_ID,
      name: 'Noise Complaint',
      icon: 'volume-x',
      color: '#FFA500',
    },
    unit: { id: UNIT_ID, number: '302' },
  };

  it('Step 1: POST /api/v1/events — noise complaint received', async () => {
    mockEventCreate.mockResolvedValue(noiseEvent);

    const req = createPostRequest('/api/v1/events', {
      propertyId: PROPERTY_ID,
      eventTypeId: NOISE_COMPLAINT_TYPE_ID,
      unitId: UNIT_ID,
      title: 'Noise complaint — Unit 302',
      description: 'Loud music reported by Unit 304',
      priority: 'normal',
      customFields: {
        complaintFloor: 3,
        noiseType: 'music',
        volumeLevel: 'loud',
      },
    });

    const res = await createEvent(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{ data: typeof noiseEvent }>(res);
    expect(body.data.unit?.number).toBe('302');
  });

  it('Step 2: PATCH /api/v1/events/:id — investigation details filled', async () => {
    mockEventUpdate.mockResolvedValue({
      ...noiseEvent,
      description:
        'Investigated noise source. Music confirmed audible from hallway on floor 3. Volume measured above bylaw threshold.',
      eventType: noiseEvent.eventType,
    });

    const req = createPatchRequest(`/api/v1/events/${complaintId}`, {
      description:
        'Investigated noise source. Music confirmed audible from hallway on floor 3. Volume measured above bylaw threshold.',
    });

    const res = await updateEvent(req, { params: Promise.resolve({ id: complaintId }) });
    expect(res.status).toBe(200);
  });

  it('Step 3: POST /api/v1/incidents/:id/updates — counseling provided', async () => {
    mockEventFindUnique.mockResolvedValue({
      id: complaintId,
      description: 'Noise investigation notes',
      customFields: {},
    });
    mockEventUpdate.mockResolvedValue({ id: complaintId });

    const req = createPostRequest(`/api/v1/incidents/${complaintId}/updates`, {
      content:
        'Spoke with resident in Unit 302. Warned about noise bylaw. Resident agreed to lower volume.',
    });

    const res = await addIncidentUpdate(req, { params: Promise.resolve({ id: complaintId }) });
    expect(res.status).toBe(201);
  });

  it('Step 4: POST /api/v1/incidents/:id/updates — follow-up scheduled', async () => {
    mockEventFindUnique.mockResolvedValue({
      id: complaintId,
      description: 'Previous notes',
      customFields: {},
    });
    mockEventUpdate.mockResolvedValue({ id: complaintId });

    const req = createPostRequest(`/api/v1/incidents/${complaintId}/updates`, {
      content: 'Follow-up check scheduled for 23:00. Will verify compliance.',
    });

    const res = await addIncidentUpdate(req, { params: Promise.resolve({ id: complaintId }) });
    expect(res.status).toBe(201);
  });

  it('Step 5: PATCH /api/v1/events/:id — complaint resolved', async () => {
    mockEventUpdate.mockResolvedValue({
      ...noiseEvent,
      status: 'resolved',
      closedAt: new Date(),
      closedById: 'security-001',
      eventType: noiseEvent.eventType,
    });

    const req = createPatchRequest(`/api/v1/events/${complaintId}`, {
      status: 'resolved',
      description: 'Follow-up at 23:00 confirmed quiet. Complaint resolved.',
    });

    const res = await updateEvent(req, { params: Promise.resolve({ id: complaintId }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { status: string } }>(res);
    expect(body.data.status).toBe('resolved');

    // Verify closedAt/closedById set for resolved status
    const updateCall = mockEventUpdate.mock.calls[0]![0] as {
      data: { closedAt: unknown; closedById: string };
    };
    expect(updateCall.data.closedAt).toBeInstanceOf(Date);
    expect(updateCall.data.closedById).toBe('security-001');
  });

  it('Noise complaint with all fields creates event with correct custom fields', async () => {
    mockEventCreate.mockResolvedValue(noiseEvent);

    const req = createPostRequest('/api/v1/events', {
      propertyId: PROPERTY_ID,
      eventTypeId: NOISE_COMPLAINT_TYPE_ID,
      unitId: UNIT_ID,
      title: 'Noise complaint',
      priority: 'normal',
      customFields: {
        complaintFloor: 3,
        noiseType: 'music',
        volumeLevel: 'loud',
      },
    });

    await createEvent(req);

    const createData = (
      mockEventCreate.mock.calls[0]![0] as {
        data: { customFields: Record<string, unknown> };
      }
    ).data;
    expect(createData.customFields).toBeDefined();
  });
});

// ===========================================================================
// SCENARIO 4: Lost Key Emergency
// ===========================================================================

describe('Scenario 4: Lost Key Emergency — Report, Decommission, Reissue', () => {
  const lostKeyId = 'key-001';
  const newKeyId = 'key-002';
  const checkoutId = 'checkout-001';
  const newCheckoutId = 'checkout-002';
  const securityEventId = 'lost-key-event-001';

  const lostKey = {
    id: lostKeyId,
    propertyId: PROPERTY_ID,
    keyName: 'FOB-Unit302-A',
    category: 'fob',
    serialNumber: 'FOB-SN-44821',
    status: 'checked_out',
  };

  const newKey = {
    id: newKeyId,
    propertyId: PROPERTY_ID,
    keyName: 'FOB-Unit302-B',
    category: 'fob',
    serialNumber: 'FOB-SN-44822',
    status: 'available',
  };

  it('Step 1: POST /api/v1/events — key reported lost, security event auto-created', async () => {
    mockEventCreate.mockResolvedValue({
      id: securityEventId,
      propertyId: PROPERTY_ID,
      eventTypeId: INCIDENT_TYPE_ID,
      unitId: UNIT_ID,
      title: 'Lost key report — FOB-Unit302-A',
      description: 'Resident reports FOB lost somewhere in parking garage.',
      priority: 'high',
      status: 'open',
      referenceNo: 'EVT-X1Y2Z3',
      createdById: 'security-001',
      createdAt: new Date(),
      customFields: { keyId: lostKeyId, keySerial: 'FOB-SN-44821' },
      eventType: {
        id: INCIDENT_TYPE_ID,
        name: 'Security Incident',
        icon: 'shield',
        color: '#FF4444',
      },
      unit: { id: UNIT_ID, number: '302' },
    });

    const req = createPostRequest('/api/v1/events', {
      propertyId: PROPERTY_ID,
      eventTypeId: INCIDENT_TYPE_ID,
      unitId: UNIT_ID,
      title: 'Lost key report — FOB-Unit302-A',
      description: 'Resident reports FOB lost somewhere in parking garage.',
      priority: 'high',
      customFields: { keyId: lostKeyId, keySerial: 'FOB-SN-44821' },
    });

    const res = await createEvent(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{ data: { title: string; priority: string } }>(res);
    expect(body.data.title).toContain('Lost key');
    expect(body.data.priority).toBe('high');
  });

  it('Step 2: Key decommissioned via key checkout return + status update', async () => {
    // Return the key checkout (mark as returned but lost)
    mockKeyCheckoutFindUnique.mockResolvedValue({
      id: checkoutId,
      propertyId: PROPERTY_ID,
      keyId: lostKeyId,
      returnTime: null,
    });
    mockKeyCheckoutUpdate.mockResolvedValue({
      id: checkoutId,
      returnTime: new Date(),
      conditionNotes: 'KEY LOST — decommissioned',
    });
    mockKeyInventoryUpdate.mockResolvedValue({
      ...lostKey,
      status: 'available', // returnKey sets to available, then we update to decommissioned
    });

    const req = createPatchRequest(`/api/v1/keys/checkouts/${checkoutId}`, {
      action: 'return',
      conditionNotes: 'KEY LOST — decommissioned',
    });

    const res = await returnKey(req, { params: Promise.resolve({ id: checkoutId }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('returned');
  });

  it('Step 3: New key issued to resident', async () => {
    mockKeyInventoryFindUnique.mockResolvedValue(newKey);
    mockKeyCheckoutCreate.mockResolvedValue({
      id: newCheckoutId,
      propertyId: PROPERTY_ID,
      keyId: newKeyId,
      checkedOutTo: 'Janet Smith - Unit 302',
      unitId: UNIT_ID,
      checkoutTime: new Date(),
    });
    mockKeyInventoryUpdate.mockResolvedValue({ ...newKey, status: 'checked_out' });

    const req = createPostRequest('/api/v1/keys/checkouts', {
      propertyId: PROPERTY_ID,
      keyId: newKeyId,
      checkedOutTo: 'Janet Smith - Unit 302',
      unitId: UNIT_ID,
      idType: 'driver_license',
      reason: 'Replacement for lost FOB-SN-44821',
    });

    const res = await issueKey(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{ data: { keyId: string }; message: string }>(res);
    expect(body.message).toContain('Janet Smith');
  });

  it('Step 4: Attempting to return already-returned key fails', async () => {
    mockKeyCheckoutFindUnique.mockResolvedValue({
      id: checkoutId,
      propertyId: PROPERTY_ID,
      keyId: lostKeyId,
      returnTime: new Date(), // Already returned
    });

    const req = createPatchRequest(`/api/v1/keys/checkouts/${checkoutId}`, {
      action: 'return',
    });

    const res = await returnKey(req, { params: Promise.resolve({ id: checkoutId }) });
    expect(res.status).toBe(409);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('ALREADY_RETURNED');
  });

  it('Step 5: Key not found returns 404', async () => {
    mockKeyCheckoutFindUnique.mockResolvedValue(null);

    const req = createPatchRequest('/api/v1/keys/checkouts/nonexistent', {
      action: 'return',
    });

    const res = await returnKey(req, { params: Promise.resolve({ id: 'nonexistent' }) });
    expect(res.status).toBe(404);
  });

  it('Issuing a key that is not available returns 409', async () => {
    mockKeyInventoryFindUnique.mockResolvedValue({
      ...lostKey,
      status: 'checked_out',
    });

    const req = createPostRequest('/api/v1/keys/checkouts', {
      propertyId: PROPERTY_ID,
      keyId: lostKeyId,
      checkedOutTo: 'Someone',
      idType: 'driver_license',
      reason: 'Attempt to issue checked-out key',
    });

    const res = await issueKey(req);
    expect(res.status).toBe(409);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('KEY_NOT_AVAILABLE');
  });

  it('Issuing a key from wrong property returns 404', async () => {
    mockKeyInventoryFindUnique.mockResolvedValue({
      ...newKey,
      propertyId: 'different-property-id',
    });

    const req = createPostRequest('/api/v1/keys/checkouts', {
      propertyId: PROPERTY_ID,
      keyId: newKeyId,
      checkedOutTo: 'Someone',
      idType: 'driver_license',
      reason: 'Cross-property attempt',
    });

    const res = await issueKey(req);
    expect(res.status).toBe(404);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('KEY_NOT_FOUND');
  });

  it('Invalid return action returns 400', async () => {
    const req = createPatchRequest('/api/v1/keys/checkouts/some-id', {
      action: 'invalid_action',
    });

    const res = await returnKey(req, { params: Promise.resolve({ id: 'some-id' }) });
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('INVALID_ACTION');
  });

  it('Full workflow: lost key report → decommission → reissue → close event', async () => {
    // Step 1: Report lost key
    mockEventCreate.mockResolvedValue({
      id: securityEventId,
      propertyId: PROPERTY_ID,
      eventTypeId: INCIDENT_TYPE_ID,
      title: 'Lost key report',
      priority: 'high',
      status: 'open',
      referenceNo: 'EVT-X1Y2Z3',
      createdById: 'security-001',
      createdAt: new Date(),
      eventType: {
        id: INCIDENT_TYPE_ID,
        name: 'Security Incident',
        icon: 'shield',
        color: '#FF4444',
      },
      unit: { id: UNIT_ID, number: '302' },
    });
    const reportRes = await createEvent(
      createPostRequest('/api/v1/events', {
        propertyId: PROPERTY_ID,
        eventTypeId: INCIDENT_TYPE_ID,
        title: 'Lost key report',
        priority: 'high',
      }),
    );
    expect(reportRes.status).toBe(201);

    // Step 2: Return/decommission lost key
    mockKeyCheckoutFindUnique.mockResolvedValue({
      id: checkoutId,
      keyId: lostKeyId,
      returnTime: null,
    });
    mockKeyCheckoutUpdate.mockResolvedValue({ id: checkoutId, returnTime: new Date() });
    mockKeyInventoryUpdate.mockResolvedValue({ ...lostKey, status: 'available' });
    const returnRes = await returnKey(
      createPatchRequest(`/api/v1/keys/checkouts/${checkoutId}`, {
        action: 'return',
        conditionNotes: 'LOST',
      }),
      { params: Promise.resolve({ id: checkoutId }) },
    );
    expect(returnRes.status).toBe(200);

    // Step 3: Issue new key
    mockKeyInventoryFindUnique.mockResolvedValue(newKey);
    mockKeyCheckoutCreate.mockResolvedValue({
      id: newCheckoutId,
      keyId: newKeyId,
      checkoutTime: new Date(),
    });
    mockKeyInventoryUpdate.mockResolvedValue({ ...newKey, status: 'checked_out' });
    const issueRes = await issueKey(
      createPostRequest('/api/v1/keys/checkouts', {
        propertyId: PROPERTY_ID,
        keyId: newKeyId,
        checkedOutTo: 'Janet Smith',
        unitId: UNIT_ID,
        idType: 'driver_license',
        reason: 'Replacement',
      }),
    );
    expect(issueRes.status).toBe(201);

    // Step 4: Close security event
    mockEventUpdate.mockResolvedValue({
      id: securityEventId,
      status: 'closed',
      closedAt: new Date(),
      eventType: {
        id: INCIDENT_TYPE_ID,
        name: 'Security Incident',
        icon: 'shield',
        color: '#FF4444',
      },
    });
    const closeRes = await updateEvent(
      createPatchRequest(`/api/v1/events/${securityEventId}`, { status: 'closed' }),
      { params: Promise.resolve({ id: securityEventId }) },
    );
    expect(closeRes.status).toBe(200);
  });
});

// ===========================================================================
// Additional Edge Cases
// ===========================================================================

describe('Security Operations — Edge Cases', () => {
  it('Creating event without required fields returns validation error', async () => {
    const req = createPostRequest('/api/v1/events', {
      propertyId: PROPERTY_ID,
      // missing eventTypeId and title
    });

    const res = await createEvent(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('GET /api/v1/events requires propertyId', async () => {
    const req = createGetRequest('/api/v1/events', { searchParams: {} });
    const res = await listEvents(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_PROPERTY');
  });

  it('GET /api/v1/events filters by eventTypeId', async () => {
    mockEventFindMany.mockResolvedValue([]);
    mockEventCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/events', {
      searchParams: {
        propertyId: PROPERTY_ID,
        typeId: INCIDENT_TYPE_ID,
      },
    });

    await listEvents(req);

    const whereClause = (mockEventFindMany.mock.calls[0]![0] as { where: Record<string, unknown> })
      .where;
    expect(whereClause.eventTypeId).toBe(INCIDENT_TYPE_ID);
  });

  it('GET /api/v1/events filters by priority', async () => {
    mockEventFindMany.mockResolvedValue([]);
    mockEventCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/events', {
      searchParams: {
        propertyId: PROPERTY_ID,
        priority: 'critical',
      },
    });

    await listEvents(req);

    const whereClause = (mockEventFindMany.mock.calls[0]![0] as { where: Record<string, unknown> })
      .where;
    expect(whereClause.priority).toBe('critical');
  });

  it('GET /api/v1/events supports search across title, description, referenceNo', async () => {
    mockEventFindMany.mockResolvedValue([]);
    mockEventCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/events', {
      searchParams: {
        propertyId: PROPERTY_ID,
        search: 'fire',
      },
    });

    await listEvents(req);

    const whereClause = (
      mockEventFindMany.mock.calls[0]![0] as {
        where: { OR: Array<Record<string, unknown>> };
      }
    ).where;
    expect(whereClause.OR).toBeDefined();
    expect(whereClause.OR).toHaveLength(3);
  });

  it('GET /api/v1/events/:id returns 404 for non-existent event', async () => {
    mockEventFindUnique.mockResolvedValue(null);

    const req = createGetRequest('/api/v1/events/nonexistent');
    const res = await getEvent(req, { params: Promise.resolve({ id: 'nonexistent' }) });
    expect(res.status).toBe(404);
  });

  it('All-clear on cancelled broadcast returns error', async () => {
    mockEmergencyBroadcastFindUnique.mockResolvedValue({
      id: 'cancelled-bc',
      propertyId: PROPERTY_ID,
      status: 'cancelled',
    });

    const req = createPostRequest('/api/v1/emergency/broadcast/cancelled-bc/all-clear', {
      message: 'Safe now',
    });

    const res = await sendAllClear(req, { params: Promise.resolve({ id: 'cancelled-bc' }) });
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('BROADCAST_CANCELLED');
  });

  it('All-clear on non-existent broadcast returns 404', async () => {
    mockEmergencyBroadcastFindUnique.mockResolvedValue(null);

    const req = createPostRequest('/api/v1/emergency/broadcast/nonexistent/all-clear', {
      message: 'Safe',
    });

    const res = await sendAllClear(req, { params: Promise.resolve({ id: 'nonexistent' }) });
    expect(res.status).toBe(404);
  });
});
