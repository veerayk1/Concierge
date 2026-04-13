/**
 * Integration Workflow Tests — Shift Log & Handoff
 *
 * Tests complete shift handoff workflows: normal shift transitions,
 * incident references across shifts, staff bulletins, pin/unpin,
 * and unread tracking.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createGetRequest, createPostRequest, parseResponse } from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Prisma Mock
// ---------------------------------------------------------------------------

const mockEventCreate = vi.fn();
const mockEventFindMany = vi.fn();
const mockEventFindUnique = vi.fn();
const mockEventUpdate = vi.fn();
const mockEventCount = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    event: {
      create: (...args: unknown[]) => mockEventCreate(...args),
      findMany: (...args: unknown[]) => mockEventFindMany(...args),
      findUnique: (...args: unknown[]) => mockEventFindUnique(...args),
      update: (...args: unknown[]) => mockEventUpdate(...args),
      count: (...args: unknown[]) => mockEventCount(...args),
    },
  },
}));

vi.mock('@/lib/sanitize', () => ({
  stripHtml: (s: string) => s,
  stripControlChars: (s: string) => s,
}));

// Track current user for multi-shift tests
let currentUserId = 'staff-morning';

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: vi.fn().mockImplementation(() =>
    Promise.resolve({
      user: {
        userId: currentUserId,
        propertyId: '00000000-0000-4000-b000-000000000001',
        role: 'front_desk',
        permissions: ['*'],
        mfaVerified: true,
      },
      error: null,
    }),
  ),
}));

// ---------------------------------------------------------------------------
// Import route handlers AFTER mocks
// ---------------------------------------------------------------------------

import { POST as createShiftEntry, GET as listShiftEntries } from '@/app/api/v1/shift-log/route';
import { GET as getHandoff } from '@/app/api/v1/shift-log/handoff/route';
import { POST as markRead } from '@/app/api/v1/shift-log/mark-read/route';
import { GET as getUnreadCount } from '@/app/api/v1/shift-log/unread-count/route';
import { POST as pinEntry } from '@/app/api/v1/shift-log/[id]/pin/route';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROPERTY_ID = '00000000-0000-4000-b000-000000000001';

// Shift times
const _MORNING_SHIFT_START = '2026-03-19T07:00:00Z';
const EVENING_SHIFT_START = '2026-03-19T15:00:00Z';
const NIGHT_SHIFT_START = '2026-03-19T23:00:00Z';

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  currentUserId = 'staff-morning';
});

// ===========================================================================
// SCENARIO 1: Normal Shift Handoff
// ===========================================================================

describe('Scenario 1: Normal Shift Handoff — Morning → Evening → Night', () => {
  const entryId1 = '00000000-0000-4000-f000-000000000001';
  const entryId2 = '00000000-0000-4000-f000-000000000002';
  const entryId3 = '00000000-0000-4000-f000-000000000003';
  const passOnId = '00000000-0000-4000-f000-000000000010';

  const morningEntry1 = {
    id: entryId1,
    propertyId: PROPERTY_ID,
    eventTypeId: 'shift-log-type',
    title: 'Shift log note',
    description: 'Package delivery from Amazon — 15 packages received',
    priority: 'normal',
    referenceNo: 'SL-ABC123',
    createdById: 'staff-morning',
    createdAt: new Date('2026-03-19T08:30:00Z'),
    customFields: { category: 'package', pinned: false, readBy: [] },
  };

  const morningEntry2 = {
    id: entryId2,
    propertyId: PROPERTY_ID,
    eventTypeId: 'shift-log-type',
    title: 'Shift log note',
    description: 'Water leak report from Unit 504 — maintenance notified',
    priority: 'important',
    referenceNo: 'SL-DEF456',
    createdById: 'staff-morning',
    createdAt: new Date('2026-03-19T10:15:00Z'),
    customFields: { category: 'maintenance', pinned: false, readBy: [] },
  };

  const passOnEntry = {
    id: passOnId,
    propertyId: PROPERTY_ID,
    eventTypeId: 'shift-log-type',
    title: 'Shift log note',
    description:
      'PASS-ON: Unit 504 water leak still being investigated. Plumber expected at 16:00. 3 unclaimed packages for Unit 302.',
    priority: 'important',
    referenceNo: 'SL-GHI789',
    createdById: 'staff-morning',
    createdAt: new Date('2026-03-19T14:45:00Z'),
    customFields: { category: 'general', pinned: true, readBy: [] },
  };

  it('Step 1: Morning shift creates entries throughout the day', async () => {
    mockEventCreate.mockResolvedValueOnce(morningEntry1);

    const req = createPostRequest('/api/v1/shift-log', {
      propertyId: PROPERTY_ID,
      content: 'Package delivery from Amazon — 15 packages received',
      priority: 'normal',
      category: 'package',
    });

    const res = await createShiftEntry(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{ data: typeof morningEntry1; message: string }>(res);
    expect(body.message).toContain('Shift entry added');
  });

  it('Step 2: Morning shift creates second entry with higher priority', async () => {
    mockEventCreate.mockResolvedValue(morningEntry2);

    const req = createPostRequest('/api/v1/shift-log', {
      propertyId: PROPERTY_ID,
      content: 'Water leak report from Unit 504 — maintenance notified',
      priority: 'important',
      category: 'maintenance',
    });

    const res = await createShiftEntry(req);
    expect(res.status).toBe(201);

    const createData = (
      mockEventCreate.mock.calls[0]![0] as {
        data: { priority: string; customFields: { category: string } };
      }
    ).data;
    expect(createData.priority).toBe('important');
    expect(createData.customFields.category).toBe('maintenance');
  });

  it('Step 3: Morning shift creates pass-on notes for evening shift', async () => {
    mockEventCreate.mockResolvedValue(passOnEntry);

    const req = createPostRequest('/api/v1/shift-log', {
      propertyId: PROPERTY_ID,
      content:
        'PASS-ON: Unit 504 water leak still being investigated. Plumber expected at 16:00. 3 unclaimed packages for Unit 302.',
      priority: 'important',
      category: 'general',
    });

    const res = await createShiftEntry(req);
    expect(res.status).toBe(201);
  });

  it('Step 4: Evening shift reads pass-on notes via handoff endpoint', async () => {
    currentUserId = 'staff-evening';

    mockEventFindMany.mockResolvedValue([passOnEntry, morningEntry2, morningEntry1]);

    const req = createGetRequest('/api/v1/shift-log/handoff', {
      searchParams: {
        propertyId: PROPERTY_ID,
        shiftStart: EVENING_SHIFT_START,
      },
    });

    const res = await getHandoff(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: (typeof morningEntry1)[] }>(res);
    expect(body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('Step 5: Evening shift marks pass-on notes as read', async () => {
    currentUserId = 'staff-evening';

    mockEventFindMany.mockResolvedValue([
      {
        ...passOnEntry,
        customFields: { ...passOnEntry.customFields, readBy: [] },
      },
    ]);
    mockEventUpdate.mockResolvedValue({
      ...passOnEntry,
      customFields: { ...passOnEntry.customFields, readBy: ['staff-evening'] },
    });

    const req = createPostRequest('/api/v1/shift-log/mark-read', {
      propertyId: PROPERTY_ID,
      entryIds: [passOnId],
    });

    const res = await markRead(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{ markedCount: number; message: string }>(res);
    expect(body.markedCount).toBe(1);
    expect(body.message).toContain('1');
    expect(body.message).toContain('read');
  });

  it('Step 6: Evening shift creates own entries', async () => {
    currentUserId = 'staff-evening';

    const eveningEntry = {
      id: entryId3,
      propertyId: PROPERTY_ID,
      eventTypeId: 'shift-log-type',
      title: 'Shift log note',
      description: 'Plumber arrived at 16:05. Working on Unit 504 leak.',
      priority: 'normal',
      referenceNo: 'SL-JKL012',
      createdById: 'staff-evening',
      createdAt: new Date('2026-03-19T16:10:00Z'),
      customFields: { category: 'maintenance', pinned: false, readBy: [] },
    };
    mockEventCreate.mockResolvedValue(eveningEntry);

    const req = createPostRequest('/api/v1/shift-log', {
      propertyId: PROPERTY_ID,
      content: 'Plumber arrived at 16:05. Working on Unit 504 leak.',
      priority: 'normal',
      category: 'maintenance',
    });

    const res = await createShiftEntry(req);
    expect(res.status).toBe(201);

    const createData = (
      mockEventCreate.mock.calls[0]![0] as {
        data: { createdById: string };
      }
    ).data;
    expect(createData.createdById).toBe('staff-evening');
  });

  it('Step 7: Evening shift creates pass-on notes for night shift', async () => {
    currentUserId = 'staff-evening';

    const eveningPassOn = {
      id: 'shift-passon-002',
      propertyId: PROPERTY_ID,
      eventTypeId: 'shift-log-type',
      title: 'Shift log note',
      description:
        'PASS-ON: Unit 504 leak fixed. Plumber will return tomorrow for final check. All packages claimed.',
      priority: 'normal',
      referenceNo: 'SL-MNO345',
      createdById: 'staff-evening',
      createdAt: new Date('2026-03-19T22:45:00Z'),
      customFields: { category: 'general', pinned: false, readBy: [] },
    };
    mockEventCreate.mockResolvedValue(eveningPassOn);

    const req = createPostRequest('/api/v1/shift-log', {
      propertyId: PROPERTY_ID,
      content:
        'PASS-ON: Unit 504 leak fixed. Plumber will return tomorrow for final check. All packages claimed.',
      priority: 'normal',
      category: 'general',
    });

    const res = await createShiftEntry(req);
    expect(res.status).toBe(201);
  });

  it('Handoff endpoint requires propertyId', async () => {
    const req = createGetRequest('/api/v1/shift-log/handoff', {
      searchParams: { shiftStart: EVENING_SHIFT_START },
    });

    const res = await getHandoff(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_PROPERTY');
  });

  it('Handoff endpoint requires shiftStart', async () => {
    const req = createGetRequest('/api/v1/shift-log/handoff', {
      searchParams: { propertyId: PROPERTY_ID },
    });

    const res = await getHandoff(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_SHIFT_START');
  });
});

// ===========================================================================
// SCENARIO 2: Incident During Shift
// ===========================================================================

describe('Scenario 2: Incident During Shift — Cross-Shift Tracking', () => {
  const incidentEntryId = '00000000-0000-4000-f000-000000000020';
  const followUpEntryId = '00000000-0000-4000-f000-000000000021';

  it('Step 1: Incident occurs during morning shift — shift log entry created with incident reference', async () => {
    const incidentShiftEntry = {
      id: incidentEntryId,
      propertyId: PROPERTY_ID,
      eventTypeId: 'shift-log-type',
      title: 'Shift log note',
      description:
        'INCIDENT: Suspicious person spotted in parking garage B1. Security event EVT-INC001 created. Police called.',
      priority: 'urgent',
      referenceNo: 'SL-INC001',
      createdById: 'staff-morning',
      createdAt: new Date('2026-03-19T11:30:00Z'),
      customFields: {
        category: 'security',
        pinned: true,
        readBy: [],
        incidentRef: 'EVT-INC001',
      },
    };
    mockEventCreate.mockResolvedValue(incidentShiftEntry);

    const req = createPostRequest('/api/v1/shift-log', {
      propertyId: PROPERTY_ID,
      content:
        'INCIDENT: Suspicious person spotted in parking garage B1. Security event EVT-INC001 created. Police called.',
      priority: 'urgent',
      category: 'security',
    });

    const res = await createShiftEntry(req);
    expect(res.status).toBe(201);

    const createData = (
      mockEventCreate.mock.calls[0]![0] as {
        data: { priority: string };
      }
    ).data;
    expect(createData.priority).toBe('urgent');
  });

  it('Step 2: Incident details passed to next shift via handoff', async () => {
    currentUserId = 'staff-evening';

    const incidentEntry = {
      id: incidentEntryId,
      propertyId: PROPERTY_ID,
      eventTypeId: 'shift-log-type',
      title: 'Shift log note',
      description: 'INCIDENT: Suspicious person in parking B1. EVT-INC001.',
      priority: 'urgent',
      createdAt: new Date('2026-03-19T11:30:00Z'),
      customFields: { category: 'security', pinned: true, readBy: [] },
      eventType: { name: 'Shift Log' },
    };

    mockEventFindMany.mockResolvedValue([incidentEntry]);

    const req = createGetRequest('/api/v1/shift-log/handoff', {
      searchParams: {
        propertyId: PROPERTY_ID,
        shiftStart: EVENING_SHIFT_START,
      },
    });

    const res = await getHandoff(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: (typeof incidentEntry)[] }>(res);
    expect(body.data).toHaveLength(1);
    expect(body.data[0]!.priority).toBe('urgent');
    expect(body.data[0]!.description).toContain('INCIDENT');
  });

  it('Step 3: Next shift reads incident handoff and marks as read', async () => {
    currentUserId = 'staff-evening';

    mockEventFindMany.mockResolvedValue([
      {
        id: incidentEntryId,
        propertyId: PROPERTY_ID,
        customFields: { category: 'security', pinned: true, readBy: [] },
      },
    ]);
    mockEventUpdate.mockResolvedValue({
      id: incidentEntryId,
      customFields: { readBy: ['staff-evening'] },
    });

    const req = createPostRequest('/api/v1/shift-log/mark-read', {
      propertyId: PROPERTY_ID,
      entryIds: [incidentEntryId],
    });

    const res = await markRead(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{ markedCount: number }>(res);
    expect(body.markedCount).toBe(1);
  });

  it('Step 4: Next shift creates follow-up entry for ongoing monitoring', async () => {
    currentUserId = 'staff-evening';

    const followUpEntry = {
      id: followUpEntryId,
      propertyId: PROPERTY_ID,
      eventTypeId: 'shift-log-type',
      title: 'Shift log note',
      description:
        'Follow-up on EVT-INC001: Reviewed parking cameras. No further suspicious activity. Extra patrols scheduled for B1.',
      priority: 'important',
      referenceNo: 'SL-FU001',
      createdById: 'staff-evening',
      createdAt: new Date('2026-03-19T15:30:00Z'),
      customFields: { category: 'security', pinned: false, readBy: [] },
    };
    mockEventCreate.mockResolvedValue(followUpEntry);

    const req = createPostRequest('/api/v1/shift-log', {
      propertyId: PROPERTY_ID,
      content:
        'Follow-up on EVT-INC001: Reviewed parking cameras. No further suspicious activity. Extra patrols scheduled for B1.',
      priority: 'important',
      category: 'security',
    });

    const res = await createShiftEntry(req);
    expect(res.status).toBe(201);

    const createData = (
      mockEventCreate.mock.calls[0]![0] as {
        data: { createdById: string };
      }
    ).data;
    expect(createData.createdById).toBe('staff-evening');
  });
});

// ===========================================================================
// SCENARIO 3: Staff Bulletin
// ===========================================================================

describe('Scenario 3: Staff Bulletin — Manager Creates, All Staff Acknowledge', () => {
  const bulletinId = '00000000-0000-4000-f000-000000000030';

  const bulletinEntry = {
    id: bulletinId,
    propertyId: PROPERTY_ID,
    eventTypeId: 'shift-log-type',
    title: 'Shift log note',
    description:
      'BULLETIN: New package handling procedure effective March 20. All couriers must present ID. See email for details.',
    priority: 'important',
    referenceNo: 'SL-BUL001',
    createdById: 'manager-001',
    createdAt: new Date('2026-03-19T09:00:00Z'),
    customFields: { category: 'general', pinned: true, readBy: [] },
  };

  it('Step 1: Manager creates staff bulletin', async () => {
    currentUserId = 'manager-001';
    mockEventCreate.mockResolvedValue(bulletinEntry);

    const req = createPostRequest('/api/v1/shift-log', {
      propertyId: PROPERTY_ID,
      content:
        'BULLETIN: New package handling procedure effective March 20. All couriers must present ID. See email for details.',
      priority: 'important',
      category: 'general',
    });

    const res = await createShiftEntry(req);
    expect(res.status).toBe(201);
  });

  it('Step 2: Pin bulletin so it appears in all handoffs', async () => {
    currentUserId = 'manager-001';

    mockEventFindUnique.mockResolvedValue({
      ...bulletinEntry,
      customFields: { category: 'general', pinned: false, readBy: [] },
    });
    mockEventUpdate.mockResolvedValue({
      ...bulletinEntry,
      customFields: { category: 'general', pinned: true, readBy: [] },
    });

    const req = createPostRequest(`/api/v1/shift-log/${bulletinId}/pin`, {
      pinned: true,
    });

    const res = await pinEntry(req, { params: Promise.resolve({ id: bulletinId }) });
    expect(res.status).toBe(200);

    const updateData = (
      mockEventUpdate.mock.calls[0]![0] as {
        data: { customFields: { pinned: boolean } };
      }
    ).data;
    expect(updateData.customFields.pinned).toBe(true);
  });

  it('Step 3: Pinned bulletin appears in handoff across shifts', async () => {
    currentUserId = 'staff-night';

    // Pinned entries should appear even if created before shiftStart
    mockEventFindMany.mockResolvedValue([
      {
        ...bulletinEntry,
        customFields: { ...bulletinEntry.customFields, pinned: true },
        eventType: { name: 'Shift Log' },
      },
    ]);

    const req = createGetRequest('/api/v1/shift-log/handoff', {
      searchParams: {
        propertyId: PROPERTY_ID,
        shiftStart: NIGHT_SHIFT_START, // Bulletin was created at 09:00, before night shift
      },
    });

    const res = await getHandoff(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: (typeof bulletinEntry)[] }>(res);
    expect(body.data).toHaveLength(1);
    expect(body.data[0]!.description).toContain('BULLETIN');
  });

  it('Step 4: Morning staff acknowledges reading', async () => {
    currentUserId = 'staff-morning';

    mockEventFindMany.mockResolvedValue([
      {
        id: bulletinId,
        propertyId: PROPERTY_ID,
        customFields: { pinned: true, readBy: [] },
      },
    ]);
    mockEventUpdate.mockResolvedValue({
      id: bulletinId,
      customFields: { pinned: true, readBy: ['staff-morning'] },
    });

    const req = createPostRequest('/api/v1/shift-log/mark-read', {
      propertyId: PROPERTY_ID,
      entryIds: [bulletinId],
    });

    const res = await markRead(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{ markedCount: number }>(res);
    expect(body.markedCount).toBe(1);

    // Verify readBy was updated
    const updateData = (
      mockEventUpdate.mock.calls[0]![0] as {
        data: { customFields: { readBy: string[] } };
      }
    ).data;
    expect(updateData.customFields.readBy).toContain('staff-morning');
  });

  it('Step 5: Evening staff acknowledges reading', async () => {
    currentUserId = 'staff-evening';

    mockEventFindMany.mockResolvedValue([
      {
        id: bulletinId,
        propertyId: PROPERTY_ID,
        customFields: { pinned: true, readBy: ['staff-morning'] },
      },
    ]);
    mockEventUpdate.mockResolvedValue({
      id: bulletinId,
      customFields: { pinned: true, readBy: ['staff-morning', 'staff-evening'] },
    });

    const req = createPostRequest('/api/v1/shift-log/mark-read', {
      propertyId: PROPERTY_ID,
      entryIds: [bulletinId],
    });

    const res = await markRead(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{ markedCount: number }>(res);
    expect(body.markedCount).toBe(1);

    const updateData = (
      mockEventUpdate.mock.calls[0]![0] as {
        data: { customFields: { readBy: string[] } };
      }
    ).data;
    expect(updateData.customFields.readBy).toContain('staff-evening');
    expect(updateData.customFields.readBy).toContain('staff-morning');
  });

  it('Step 6: Already-read entries are not double-marked', async () => {
    currentUserId = 'staff-morning';

    mockEventFindMany.mockResolvedValue([
      {
        id: bulletinId,
        propertyId: PROPERTY_ID,
        customFields: { pinned: true, readBy: ['staff-morning'] }, // Already read
      },
    ]);

    const req = createPostRequest('/api/v1/shift-log/mark-read', {
      propertyId: PROPERTY_ID,
      entryIds: [bulletinId],
    });

    const res = await markRead(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{ markedCount: number }>(res);
    expect(body.markedCount).toBe(0); // Already read, so no update

    // event.update should NOT have been called since already read
    expect(mockEventUpdate).not.toHaveBeenCalled();
  });
});

// ===========================================================================
// Pin / Unpin Edge Cases
// ===========================================================================

describe('Shift Log — Pin/Unpin Operations', () => {
  it('Pin a non-existent entry returns 404', async () => {
    mockEventFindUnique.mockResolvedValue(null);

    const req = createPostRequest('/api/v1/shift-log/nonexistent/pin', {
      pinned: true,
    });

    const res = await pinEntry(req, { params: Promise.resolve({ id: 'nonexistent' }) });
    expect(res.status).toBe(404);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('NOT_FOUND');
  });

  it('Unpin an entry sets pinned=false', async () => {
    mockEventFindUnique.mockResolvedValue({
      id: 'pinned-entry',
      customFields: { pinned: true, readBy: [] },
    });
    mockEventUpdate.mockResolvedValue({
      id: 'pinned-entry',
      customFields: { pinned: false, readBy: [] },
    });

    const req = createPostRequest('/api/v1/shift-log/pinned-entry/pin', {
      pinned: false,
    });

    const res = await pinEntry(req, { params: Promise.resolve({ id: 'pinned-entry' }) });
    expect(res.status).toBe(200);

    const updateData = (
      mockEventUpdate.mock.calls[0]![0] as {
        data: { customFields: { pinned: boolean } };
      }
    ).data;
    expect(updateData.customFields.pinned).toBe(false);
  });

  it('Pin request without pinned field returns validation error', async () => {
    const req = createPostRequest('/api/v1/shift-log/some-entry/pin', {});

    const res = await pinEntry(req, { params: Promise.resolve({ id: 'some-entry' }) });
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });
});

// ===========================================================================
// Unread Count
// ===========================================================================

describe('Shift Log — Unread Count Tracking', () => {
  it('GET /api/v1/shift-log/unread-count returns correct count', async () => {
    currentUserId = 'staff-evening';

    mockEventFindMany.mockResolvedValue([
      { id: 'e1', customFields: { readBy: ['staff-morning'] } },
      { id: 'e2', customFields: { readBy: ['staff-morning', 'staff-evening'] } },
      { id: 'e3', customFields: { readBy: [] } },
      { id: 'e4', customFields: null },
    ]);

    const req = createGetRequest('/api/v1/shift-log/unread-count', {
      searchParams: { propertyId: PROPERTY_ID },
    });

    const res = await getUnreadCount(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{ unreadCount: number }>(res);
    // e1: not read by evening (1), e2: read by evening (0), e3: not read (1), e4: null customFields (1)
    expect(body.unreadCount).toBe(3);
  });

  it('Unread count is 0 when all entries are read', async () => {
    currentUserId = 'staff-morning';

    mockEventFindMany.mockResolvedValue([
      { id: 'e1', customFields: { readBy: ['staff-morning'] } },
      { id: 'e2', customFields: { readBy: ['staff-morning'] } },
    ]);

    const req = createGetRequest('/api/v1/shift-log/unread-count', {
      searchParams: { propertyId: PROPERTY_ID },
    });

    const res = await getUnreadCount(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{ unreadCount: number }>(res);
    expect(body.unreadCount).toBe(0);
  });

  it('Unread count requires propertyId', async () => {
    const req = createGetRequest('/api/v1/shift-log/unread-count', {
      searchParams: {},
    });

    const res = await getUnreadCount(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_PROPERTY');
  });
});

// ===========================================================================
// Shift Log Listing & Filtering
// ===========================================================================

describe('Shift Log — Listing & Filtering', () => {
  it('GET /api/v1/shift-log requires propertyId', async () => {
    const req = createGetRequest('/api/v1/shift-log', { searchParams: {} });
    const res = await listShiftEntries(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_PROPERTY');
  });

  it('GET /api/v1/shift-log filters by priority', async () => {
    mockEventFindMany.mockResolvedValue([]);
    mockEventCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/shift-log', {
      searchParams: { propertyId: PROPERTY_ID, priority: 'urgent' },
    });

    await listShiftEntries(req);

    const whereClause = (
      mockEventFindMany.mock.calls[0]![0] as {
        where: { priority: string };
      }
    ).where;
    expect(whereClause.priority).toBe('urgent');
  });

  it('GET /api/v1/shift-log filters by category', async () => {
    mockEventFindMany.mockResolvedValue([]);
    mockEventCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/shift-log', {
      searchParams: { propertyId: PROPERTY_ID, category: 'security' },
    });

    await listShiftEntries(req);

    const whereClause = (
      mockEventFindMany.mock.calls[0]![0] as {
        where: { customFields: { path: string[]; equals: string } };
      }
    ).where;
    expect(whereClause.customFields).toEqual({ path: ['category'], equals: 'security' });
  });

  it('GET /api/v1/shift-log filters by date range', async () => {
    mockEventFindMany.mockResolvedValue([]);
    mockEventCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/shift-log', {
      searchParams: {
        propertyId: PROPERTY_ID,
        dateFrom: '2026-03-19T00:00:00Z',
        dateTo: '2026-03-19T23:59:59Z',
      },
    });

    await listShiftEntries(req);

    const whereClause = (
      mockEventFindMany.mock.calls[0]![0] as {
        where: { createdAt: { gte: Date; lte: Date } };
      }
    ).where;
    expect(whereClause.createdAt).toBeDefined();
    expect(whereClause.createdAt.gte).toBeInstanceOf(Date);
    expect(whereClause.createdAt.lte).toBeInstanceOf(Date);
  });

  it('GET /api/v1/shift-log paginates correctly', async () => {
    mockEventFindMany.mockResolvedValue([]);
    mockEventCount.mockResolvedValue(50);

    const req = createGetRequest('/api/v1/shift-log', {
      searchParams: { propertyId: PROPERTY_ID, page: '2', pageSize: '10' },
    });

    const res = await listShiftEntries(req);
    const body = await parseResponse<{
      meta: { page: number; pageSize: number; total: number; totalPages: number };
    }>(res);
    expect(body.meta.page).toBe(2);
    expect(body.meta.pageSize).toBe(10);
    expect(body.meta.total).toBe(50);
    expect(body.meta.totalPages).toBe(5);
  });

  it('POST /api/v1/shift-log validates required content field', async () => {
    const req = createPostRequest('/api/v1/shift-log', {
      propertyId: PROPERTY_ID,
      // missing content
    });

    const res = await createShiftEntry(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('POST /api/v1/shift-log validates required propertyId', async () => {
    const req = createPostRequest('/api/v1/shift-log', {
      content: 'Some note without property',
    });

    const res = await createShiftEntry(req);
    expect(res.status).toBe(400);
  });

  it('Shift entry initializes readBy as empty array and pinned as false', async () => {
    mockEventCreate.mockResolvedValue({
      id: 'new-entry',
      propertyId: PROPERTY_ID,
      customFields: { category: 'general', pinned: false, readBy: [] },
    });

    const req = createPostRequest('/api/v1/shift-log', {
      propertyId: PROPERTY_ID,
      content: 'Test entry',
    });

    await createShiftEntry(req);

    const createData = (
      mockEventCreate.mock.calls[0]![0] as {
        data: { customFields: { pinned: boolean; readBy: string[] } };
      }
    ).data;
    expect(createData.customFields.pinned).toBe(false);
    expect(createData.customFields.readBy).toEqual([]);
  });
});
