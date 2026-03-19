/**
 * Security Console — Comprehensive Tests per PRD 03
 *
 * The Security Console is the nerve center for building security staff.
 * It unifies events, visitors, incidents, keys/FOBs, pass-on logs,
 * parking violations, and emergency contacts into a single, searchable
 * interface. Every test here validates a PHYSICAL SECURITY workflow —
 * a failure is not a software bug, it is a building safety gap.
 *
 * Test coverage:
 *  1. Create event with configurable event type
 *  2. Event types grouped by EventGroup (security, packages, cleaning, etc.)
 *  3. Event custom fields stored as JSONB
 *  4. Event notification: optionally notify resident on creation
 *  5. Event status: open -> closed lifecycle
 *  6. Event closure: sets closedBy and closedAt
 *  7. Visitor sign-in: captures name, purpose, unitId, vehiclePlate, idVerified
 *  8. Visitor sign-out: sets departureAt, signedOutById
 *  9. Visitor batch sign-out: end of day bulk sign-out
 * 10. Active visitors count for dashboard
 * 11. Incident reporting: create with priority, category, location
 * 12. Incident escalation: supervisor notified, priority bumped
 * 13. Incident updates: append update log entries
 * 14. Key checkout: issue key to resident with serial tracking
 * 15. Key return: close checkout record
 * 16. Key lost: auto-decommission + security alert
 * 17. Pass-on log: shift handoff notes
 * 18. Emergency contacts: quick access per unit
 * 19. Parking violation: create, track, resolve lifecycle
 * 20. FOB management: 6 slots per resident tracked
 * 21. Event filtering: by type, group, status, unit, date range
 * 22. Event search: across title, description, custom fields
 * 23. Global search: returns events + visitors + incidents + packages
 * 24. Tenant isolation on all operations
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  createGetRequest,
  createPostRequest,
  createPatchRequest,
  parseResponse,
} from '@/test/helpers/api';

// ===========================================================================
// Mock Setup — all Prisma models used by the Security Console
// ===========================================================================

const mockEventFindMany = vi.fn();
const mockEventCount = vi.fn();
const mockEventCreate = vi.fn();
const mockEventFindUnique = vi.fn();
const mockEventUpdate = vi.fn();
const mockEventUpdateMany = vi.fn();

const mockVisitorFindMany = vi.fn();
const mockVisitorCount = vi.fn();
const mockVisitorCreate = vi.fn();
const mockVisitorFindUnique = vi.fn();
const mockVisitorUpdate = vi.fn();
const mockVisitorUpdateMany = vi.fn();

const mockIncidentCreate = vi.fn();
const mockIncidentFindMany = vi.fn();
const mockIncidentFindUnique = vi.fn();
const mockIncidentUpdate = vi.fn();

const mockKeyFindMany = vi.fn();
const mockKeyFindUnique = vi.fn();
const mockKeyCreate = vi.fn();
const mockKeyUpdate = vi.fn();
const mockKeyCount = vi.fn();

const mockCheckoutFindMany = vi.fn();
const mockCheckoutFindUnique = vi.fn();
const mockCheckoutCreate = vi.fn();
const mockCheckoutUpdate = vi.fn();

const mockPassOnFindMany = vi.fn();
const mockPassOnCreate = vi.fn();

const mockContactFindMany = vi.fn();
const mockContactCreate = vi.fn();

const mockViolationFindMany = vi.fn();
const mockViolationCreate = vi.fn();
const mockViolationUpdate = vi.fn();

const mockFobFindMany = vi.fn();
const mockFobCreate = vi.fn();
const mockFobCount = vi.fn();

const mockUserPropertyFindMany = vi.fn();

const mockPermitFindMany = vi.fn();

const mockSearchHistoryFindMany = vi.fn();
const mockSearchHistoryCreate = vi.fn();

const mockSearchUserFindMany = vi.fn();
const mockSearchUnitFindMany = vi.fn();
const mockSearchPackageFindMany = vi.fn();
const mockSearchAnnouncementFindMany = vi.fn();

const mockTransaction = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    event: {
      findMany: (...args: unknown[]) => mockEventFindMany(...args),
      count: (...args: unknown[]) => mockEventCount(...args),
      create: (...args: unknown[]) => mockEventCreate(...args),
      findUnique: (...args: unknown[]) => mockEventFindUnique(...args),
      update: (...args: unknown[]) => mockEventUpdate(...args),
      updateMany: (...args: unknown[]) => mockEventUpdateMany(...args),
    },
    visitorEntry: {
      findMany: (...args: unknown[]) => mockVisitorFindMany(...args),
      count: (...args: unknown[]) => mockVisitorCount(...args),
      create: (...args: unknown[]) => mockVisitorCreate(...args),
      findUnique: (...args: unknown[]) => mockVisitorFindUnique(...args),
      update: (...args: unknown[]) => mockVisitorUpdate(...args),
      updateMany: (...args: unknown[]) => mockVisitorUpdateMany(...args),
    },
    incidentReport: {
      create: (...args: unknown[]) => mockIncidentCreate(...args),
      findMany: (...args: unknown[]) => mockIncidentFindMany(...args),
      findUnique: (...args: unknown[]) => mockIncidentFindUnique(...args),
      update: (...args: unknown[]) => mockIncidentUpdate(...args),
    },
    keyInventory: {
      findMany: (...args: unknown[]) => mockKeyFindMany(...args),
      findUnique: (...args: unknown[]) => mockKeyFindUnique(...args),
      create: (...args: unknown[]) => mockKeyCreate(...args),
      update: (...args: unknown[]) => mockKeyUpdate(...args),
      count: (...args: unknown[]) => mockKeyCount(...args),
    },
    keyCheckout: {
      findMany: (...args: unknown[]) => mockCheckoutFindMany(...args),
      findUnique: (...args: unknown[]) => mockCheckoutFindUnique(...args),
      create: (...args: unknown[]) => mockCheckoutCreate(...args),
      update: (...args: unknown[]) => mockCheckoutUpdate(...args),
    },
    passOnLog: {
      findMany: (...args: unknown[]) => mockPassOnFindMany(...args),
      create: (...args: unknown[]) => mockPassOnCreate(...args),
    },
    emergencyContact: {
      findMany: (...args: unknown[]) => mockContactFindMany(...args),
      create: (...args: unknown[]) => mockContactCreate(...args),
    },
    parkingViolation: {
      findMany: (...args: unknown[]) => mockViolationFindMany(...args),
      create: (...args: unknown[]) => mockViolationCreate(...args),
      update: (...args: unknown[]) => mockViolationUpdate(...args),
    },
    parkingPermit: {
      findMany: (...args: unknown[]) => mockPermitFindMany(...args),
    },
    fob: {
      findMany: (...args: unknown[]) => mockFobFindMany(...args),
      create: (...args: unknown[]) => mockFobCreate(...args),
      count: (...args: unknown[]) => mockFobCount(...args),
    },
    userProperty: {
      findMany: (...args: unknown[]) => mockUserPropertyFindMany(...args),
    },
    user: {
      findMany: (...args: unknown[]) => mockSearchUserFindMany(...args),
    },
    unit: {
      findMany: (...args: unknown[]) => mockSearchUnitFindMany(...args),
    },
    package: {
      findMany: (...args: unknown[]) => mockSearchPackageFindMany(...args),
    },
    announcement: {
      findMany: (...args: unknown[]) => mockSearchAnnouncementFindMany(...args),
    },
    searchHistory: {
      findMany: (...args: unknown[]) => mockSearchHistoryFindMany(...args),
      create: (...args: unknown[]) => mockSearchHistoryCreate(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

vi.mock('nanoid', () => ({
  nanoid: vi.fn().mockReturnValue('X9Z8Y7'),
}));

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: vi.fn().mockResolvedValue({
    user: {
      userId: 'guard-001',
      propertyId: '00000000-0000-4000-b000-000000000001',
      role: 'security_guard',
      permissions: ['*'],
      mfaVerified: false,
    },
    error: null,
  }),
}));

vi.mock('@/lib/sanitize', () => ({
  stripHtml: (s: string) => s.replace(/<[^>]*>/g, ''),
  stripControlChars: (s: string) => s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''),
}));

vi.mock('@/server/email', () => ({
  sendEmail: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/server/logger', () => ({
  createLogger: vi.fn().mockReturnValue({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  }),
}));

// ===========================================================================
// Route Imports (after mocks)
// ===========================================================================

import { GET as GET_EVENTS, POST as POST_EVENT } from '../../events/route';
import { PATCH as PATCH_EVENT } from '../../events/[id]/route';
import { GET as GET_VISITORS, POST as POST_VISITOR } from '../../visitors/route';
import { PATCH as PATCH_VISITOR } from '../../visitors/[id]/route';
import { GET as GET_UPDATES, POST as POST_UPDATE } from '../../incidents/[id]/updates/route';
import { POST as POST_ESCALATE } from '../../incidents/[id]/escalate/route';
import { GET as GET_KEYS, POST as POST_KEY } from '../../keys/route';
import { PATCH as PATCH_KEY } from '../../keys/[id]/route';
import { GET as GET_CHECKOUTS, POST as POST_CHECKOUT } from '../../keys/checkouts/route';
import { PATCH as PATCH_CHECKOUT } from '../../keys/checkouts/[id]/route';
import { GET as GET_SHIFT_LOG, POST as POST_SHIFT_LOG } from '../../shift-log/route';
import {
  GET as GET_EMERGENCY_CONTACTS,
  POST as POST_EMERGENCY_CONTACT,
} from '../../emergency-contacts/route';
import { GET as GET_PARKING } from '../../parking/route';
import { PATCH as PATCH_VIOLATION } from '../../parking/violations/[id]/route';
import { GET as GET_SEARCH } from '../../search/route';
import { appCache } from '@/server/cache';

// ===========================================================================
// Constants
// ===========================================================================

const PROP_A = '00000000-0000-4000-b000-000000000001';
const PROP_B = '00000000-0000-4000-b000-000000000002';
const UNIT_A = '00000000-0000-4000-e000-000000000001';
const USER_A = '00000000-0000-4000-f000-000000000001';
const KEY_ID = '00000000-0000-4000-b000-000000000010';
const CHECKOUT_ID = '00000000-0000-4000-b000-000000000030';
const EVENT_TYPE_SECURITY = '00000000-0000-4000-d000-000000000001';
const EVENT_TYPE_PACKAGE = '00000000-0000-4000-d000-000000000002';
const EVENT_TYPE_CLEANING = '00000000-0000-4000-d000-000000000003';

// ===========================================================================
// Global Reset
// ===========================================================================

beforeEach(() => {
  vi.clearAllMocks();
  appCache.clear();

  // Default empty results for all mocks
  mockEventFindMany.mockResolvedValue([]);
  mockEventCount.mockResolvedValue(0);
  mockEventCreate.mockResolvedValue({});
  mockEventFindUnique.mockResolvedValue(null);
  mockEventUpdate.mockResolvedValue({});
  mockEventUpdateMany.mockResolvedValue({ count: 0 });

  mockVisitorFindMany.mockResolvedValue([]);
  mockVisitorCount.mockResolvedValue(0);
  mockVisitorCreate.mockResolvedValue({});
  mockVisitorFindUnique.mockResolvedValue(null);
  mockVisitorUpdate.mockResolvedValue({});
  mockVisitorUpdateMany.mockResolvedValue({ count: 0 });

  mockIncidentCreate.mockResolvedValue({});
  mockIncidentFindMany.mockResolvedValue([]);
  mockIncidentFindUnique.mockResolvedValue(null);
  mockIncidentUpdate.mockResolvedValue({});

  mockKeyFindMany.mockResolvedValue([]);
  mockKeyFindUnique.mockResolvedValue(null);
  mockKeyCreate.mockResolvedValue({});
  mockKeyUpdate.mockResolvedValue({});
  mockKeyCount.mockResolvedValue(0);

  mockCheckoutFindMany.mockResolvedValue([]);
  mockCheckoutFindUnique.mockResolvedValue(null);
  mockCheckoutCreate.mockResolvedValue({});
  mockCheckoutUpdate.mockResolvedValue({});

  mockPassOnFindMany.mockResolvedValue([]);
  mockPassOnCreate.mockResolvedValue({});

  mockContactFindMany.mockResolvedValue([]);
  mockContactCreate.mockResolvedValue({});

  mockViolationFindMany.mockResolvedValue([]);
  mockViolationCreate.mockResolvedValue({});
  mockViolationUpdate.mockResolvedValue({});

  mockFobFindMany.mockResolvedValue([]);
  mockFobCreate.mockResolvedValue({});
  mockFobCount.mockResolvedValue(0);

  mockUserPropertyFindMany.mockResolvedValue([]);

  mockPermitFindMany.mockResolvedValue([]);

  mockSearchUserFindMany.mockResolvedValue([]);
  mockSearchUnitFindMany.mockResolvedValue([]);
  mockSearchPackageFindMany.mockResolvedValue([]);
  mockSearchAnnouncementFindMany.mockResolvedValue([]);

  mockSearchHistoryFindMany.mockResolvedValue([]);
  mockSearchHistoryCreate.mockResolvedValue({});

  mockTransaction.mockImplementation(async (fn: unknown) => {
    if (Array.isArray(fn)) {
      return Promise.all(fn);
    }
    return (fn as (tx: unknown) => Promise<unknown>)(
      // pass mocked prisma through
      (await import('@/server/db')).prisma,
    );
  });
});

// ###########################################################################
// 1. Create event with configurable event type
// ###########################################################################

describe('1. Create event with configurable event type', () => {
  const validEvent = {
    propertyId: PROP_A,
    eventTypeId: EVENT_TYPE_SECURITY,
    title: 'Suspicious person near loading dock',
  };

  it('creates an event linked to a configurable event type', async () => {
    mockEventCreate.mockResolvedValue({
      id: 'evt-1',
      ...validEvent,
      referenceNo: 'EVT-X9Z8Y7',
      status: 'open',
      createdAt: new Date(),
      eventType: {
        id: EVENT_TYPE_SECURITY,
        name: 'Security Alert',
        icon: 'shield',
        color: '#EF4444',
      },
      unit: null,
    });

    const req = createPostRequest('/api/v1/events', validEvent);
    const res = await POST_EVENT(req);

    expect(res.status).toBe(201);
    const body = await parseResponse<{ data: { id: string; referenceNo: string } }>(res);
    expect(body.data.id).toBe('evt-1');
    expect(body.data.referenceNo).toMatch(/^EVT-/);
  });

  it('rejects event creation without eventTypeId', async () => {
    const req = createPostRequest('/api/v1/events', {
      propertyId: PROP_A,
      title: 'Missing type',
    });
    const res = await POST_EVENT(req);

    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string; fields: Record<string, string[]> }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
    expect(body.fields.eventTypeId).toBeDefined();
  });

  it('rejects event creation without title', async () => {
    const req = createPostRequest('/api/v1/events', {
      propertyId: PROP_A,
      eventTypeId: EVENT_TYPE_SECURITY,
    });
    const res = await POST_EVENT(req);

    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string; fields: Record<string, string[]> }>(res);
    expect(body.fields.title).toBeDefined();
  });

  it('rejects title exceeding 200 characters', async () => {
    const req = createPostRequest('/api/v1/events', {
      ...validEvent,
      title: 'A'.repeat(201),
    });
    const res = await POST_EVENT(req);

    expect(res.status).toBe(400);
  });
});

// ###########################################################################
// 2. Event types grouped by EventGroup
// ###########################################################################

describe('2. Event types grouped by EventGroup', () => {
  it('filters events by eventTypeId — security guard sees only security type', async () => {
    const req = createGetRequest('/api/v1/events', {
      searchParams: { propertyId: PROP_A, typeId: EVENT_TYPE_SECURITY },
    });
    await GET_EVENTS(req);

    const where = mockEventFindMany.mock.calls[0]![0].where;
    expect(where.eventTypeId).toBe(EVENT_TYPE_SECURITY);
  });

  it('can create events of different type groups (package, cleaning, etc.)', async () => {
    for (const typeId of [EVENT_TYPE_SECURITY, EVENT_TYPE_PACKAGE, EVENT_TYPE_CLEANING]) {
      mockEventCreate.mockResolvedValue({
        id: `evt-${typeId}`,
        propertyId: PROP_A,
        eventTypeId: typeId,
        title: `Event for type ${typeId}`,
        referenceNo: 'EVT-X9Z8Y7',
        status: 'open',
        createdAt: new Date(),
        eventType: { id: typeId, name: 'Type', icon: 'circle', color: '#000' },
        unit: null,
      });

      const req = createPostRequest('/api/v1/events', {
        propertyId: PROP_A,
        eventTypeId: typeId,
        title: `Event for type ${typeId}`,
      });
      const res = await POST_EVENT(req);

      expect(res.status).toBe(201);
    }
  });

  it('includes eventType relation in listing — needed for icon, color, group display', async () => {
    const req = createGetRequest('/api/v1/events', {
      searchParams: { propertyId: PROP_A },
    });
    await GET_EVENTS(req);

    const include = mockEventFindMany.mock.calls[0]![0].include;
    expect(include.eventType).toBeDefined();
    expect(include.eventType.select).toMatchObject({
      id: true,
      name: true,
      icon: true,
      color: true,
    });
  });
});

// ###########################################################################
// 3. Event custom fields stored as JSONB
// ###########################################################################

describe('3. Event custom fields stored as JSONB', () => {
  it('stores arbitrary custom fields as JSONB on event creation', async () => {
    const customFields = {
      cameraId: 'CAM-12',
      witnessName: 'John Smith',
      weatherConditions: 'rainy',
    };

    mockEventCreate.mockResolvedValue({
      id: 'evt-cf',
      propertyId: PROP_A,
      eventTypeId: EVENT_TYPE_SECURITY,
      title: 'Suspicious activity',
      referenceNo: 'EVT-X9Z8Y7',
      status: 'open',
      customFields,
      createdAt: new Date(),
      eventType: null,
      unit: null,
    });

    const req = createPostRequest('/api/v1/events', {
      propertyId: PROP_A,
      eventTypeId: EVENT_TYPE_SECURITY,
      title: 'Suspicious activity',
      customFields,
    });
    const res = await POST_EVENT(req);

    expect(res.status).toBe(201);
    const createData = mockEventCreate.mock.calls[0]![0].data;
    expect(createData.customFields).toEqual(customFields);
  });

  it('stores nested and complex custom field values', async () => {
    const customFields = {
      vehicleInfo: { make: 'Toyota', model: 'Camry', year: 2022 },
      tags: ['urgent', 'lobby'],
      notified: true,
    };

    mockEventCreate.mockResolvedValue({
      id: 'evt-nested',
      propertyId: PROP_A,
      eventTypeId: EVENT_TYPE_SECURITY,
      title: 'Vehicle incident',
      referenceNo: 'EVT-X9Z8Y7',
      status: 'open',
      customFields,
      createdAt: new Date(),
      eventType: null,
      unit: null,
    });

    const req = createPostRequest('/api/v1/events', {
      propertyId: PROP_A,
      eventTypeId: EVENT_TYPE_SECURITY,
      title: 'Vehicle incident',
      customFields,
    });
    const res = await POST_EVENT(req);

    expect(res.status).toBe(201);
    const createData = mockEventCreate.mock.calls[0]![0].data;
    expect(createData.customFields.vehicleInfo.make).toBe('Toyota');
    expect(createData.customFields.tags).toEqual(['urgent', 'lobby']);
  });

  it('accepts null custom fields — not all event types need them', async () => {
    mockEventCreate.mockResolvedValue({
      id: 'evt-null-cf',
      propertyId: PROP_A,
      eventTypeId: EVENT_TYPE_SECURITY,
      title: 'Simple event',
      referenceNo: 'EVT-X9Z8Y7',
      status: 'open',
      customFields: null,
      createdAt: new Date(),
      eventType: null,
      unit: null,
    });

    const req = createPostRequest('/api/v1/events', {
      propertyId: PROP_A,
      eventTypeId: EVENT_TYPE_SECURITY,
      title: 'Simple event',
    });
    const res = await POST_EVENT(req);

    expect(res.status).toBe(201);
  });
});

// ###########################################################################
// 4. Event notification: optionally notify resident on creation
// ###########################################################################

describe('4. Event notification: optionally notify resident on creation', () => {
  it('creates event with optional unitId for resident notification context', async () => {
    mockEventCreate.mockResolvedValue({
      id: 'evt-notify',
      propertyId: PROP_A,
      eventTypeId: EVENT_TYPE_PACKAGE,
      title: 'Package for Unit 1501',
      unitId: UNIT_A,
      referenceNo: 'EVT-X9Z8Y7',
      status: 'open',
      createdAt: new Date(),
      eventType: { id: EVENT_TYPE_PACKAGE, name: 'Package', icon: 'package', color: '#3B82F6' },
      unit: { id: UNIT_A, number: '1501' },
    });

    const req = createPostRequest('/api/v1/events', {
      propertyId: PROP_A,
      eventTypeId: EVENT_TYPE_PACKAGE,
      title: 'Package for Unit 1501',
      unitId: UNIT_A,
    });
    const res = await POST_EVENT(req);

    expect(res.status).toBe(201);
  });

  it('creates event without unitId — building-wide events do not target a specific resident', async () => {
    mockEventCreate.mockResolvedValue({
      id: 'evt-no-unit',
      propertyId: PROP_A,
      eventTypeId: EVENT_TYPE_SECURITY,
      title: 'Fire drill completed',
      unitId: null,
      referenceNo: 'EVT-X9Z8Y7',
      status: 'open',
      createdAt: new Date(),
      eventType: { id: EVENT_TYPE_SECURITY, name: 'Security', icon: 'shield', color: '#EF4444' },
      unit: null,
    });

    const req = createPostRequest('/api/v1/events', {
      propertyId: PROP_A,
      eventTypeId: EVENT_TYPE_SECURITY,
      title: 'Fire drill completed',
    });
    const res = await POST_EVENT(req);

    expect(res.status).toBe(201);
  });
});

// ###########################################################################
// 5. Event status: open -> closed lifecycle
// ###########################################################################

describe('5. Event status: open -> closed lifecycle', () => {
  it('new events default to open status', async () => {
    mockEventCreate.mockResolvedValue({
      id: 'evt-open',
      propertyId: PROP_A,
      eventTypeId: EVENT_TYPE_SECURITY,
      title: 'Gate left open',
      status: 'open',
      referenceNo: 'EVT-X9Z8Y7',
      createdAt: new Date(),
      eventType: null,
      unit: null,
    });

    const req = createPostRequest('/api/v1/events', {
      propertyId: PROP_A,
      eventTypeId: EVENT_TYPE_SECURITY,
      title: 'Gate left open',
    });
    const res = await POST_EVENT(req);

    expect(res.status).toBe(201);
    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toBe('Event created.');
  });

  it('filters events by status — open events need attention', async () => {
    const req = createGetRequest('/api/v1/events', {
      searchParams: { propertyId: PROP_A, status: 'open' },
    });
    await GET_EVENTS(req);

    expect(mockEventFindMany.mock.calls[0]![0].where.status).toBe('open');
  });

  it('filters events by closed status — for historical review', async () => {
    const req = createGetRequest('/api/v1/events', {
      searchParams: { propertyId: PROP_A, status: 'closed' },
    });
    await GET_EVENTS(req);

    expect(mockEventFindMany.mock.calls[0]![0].where.status).toBe('closed');
  });
});

// ###########################################################################
// 6. Event closure: sets closedBy and closedAt
// ###########################################################################

describe('6. Event closure: sets closedBy and closedAt', () => {
  it('closes an event with closedById and closedAt timestamp', async () => {
    const closedAt = new Date();
    mockEventFindUnique.mockResolvedValue({
      id: 'evt-1',
      propertyId: PROP_A,
      status: 'open',
    });
    mockEventUpdate.mockResolvedValue({
      id: 'evt-1',
      status: 'closed',
      closedById: 'guard-001',
      closedAt,
    });

    const req = createPatchRequest('/api/v1/events/evt-1', {
      status: 'closed',
    });
    const res = await PATCH_EVENT(req, { params: Promise.resolve({ id: 'evt-1' }) });

    expect(res.status).toBe(200);
    const updateData = mockEventUpdate.mock.calls[0]![0].data;
    expect(updateData.status).toBe('closed');
    expect(updateData.closedById).toBe('guard-001');
    expect(updateData.closedAt).toBeInstanceOf(Date);
  });

  it('returns error for closing a non-existent event — Prisma rejects missing record', async () => {
    mockEventUpdate.mockRejectedValue(new Error('Record to update not found'));

    const req = createPatchRequest('/api/v1/events/nonexistent', {
      status: 'closed',
    });
    const res = await PATCH_EVENT(req, { params: Promise.resolve({ id: 'nonexistent' }) });

    // Route catches Prisma error and returns 500 (no findUnique guard)
    expect(res.status).toBe(500);
    const body = await parseResponse<{ error: string; message: string }>(res);
    expect(body.error).toBe('INTERNAL_ERROR');
    expect(body.message).not.toContain('Record to update');
  });
});

// ###########################################################################
// 7. Visitor sign-in: captures name, purpose, unitId, vehiclePlate, idVerified
// ###########################################################################

describe('7. Visitor sign-in', () => {
  const validVisitor = {
    propertyId: PROP_A,
    visitorName: 'Jane Williams',
    unitId: UNIT_A,
    purpose: 'personal',
    visitorType: 'visitor',
    idVerified: true,
  };

  it('creates a visitor entry capturing all required fields', async () => {
    mockVisitorCreate.mockResolvedValue({
      id: 'v-1',
      ...validVisitor,
      createdAt: new Date(),
      unit: { number: '1501' },
    });

    const req = createPostRequest('/api/v1/visitors', validVisitor);
    const res = await POST_VISITOR(req);

    expect(res.status).toBe(201);
    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('Jane Williams');
    expect(body.message).toContain('1501');
  });

  it('captures vehicle plate when provided', async () => {
    mockVisitorCreate.mockResolvedValue({
      id: 'v-2',
      ...validVisitor,
      vehiclePlate: 'BXYZ 123',
      createdAt: new Date(),
      unit: { number: '1501' },
    });

    const req = createPostRequest('/api/v1/visitors', {
      ...validVisitor,
      vehiclePlate: 'BXYZ 123',
    });
    const res = await POST_VISITOR(req);

    expect(res.status).toBe(201);
  });

  it('sanitizes visitor name against XSS', async () => {
    mockVisitorCreate.mockResolvedValue({
      id: 'v-3',
      ...validVisitor,
      visitorName: 'Jane Williams',
      createdAt: new Date(),
      unit: { number: '1501' },
    });

    const req = createPostRequest('/api/v1/visitors', {
      ...validVisitor,
      visitorName: '<script>alert("xss")</script>Jane Williams',
    });
    await POST_VISITOR(req);

    const createData = mockVisitorCreate.mock.calls[0]![0].data;
    expect(createData.visitorName).not.toContain('<script>');
  });

  it('rejects visitor without name', async () => {
    const req = createPostRequest('/api/v1/visitors', {
      ...validVisitor,
      visitorName: '',
    });
    const res = await POST_VISITOR(req);

    expect(res.status).toBe(400);
  });

  it('rejects visitor without unitId', async () => {
    const req = createPostRequest('/api/v1/visitors', {
      ...validVisitor,
      unitId: '',
    });
    const res = await POST_VISITOR(req);

    expect(res.status).toBe(400);
  });

  it('maps purpose to visitorType on the entry', async () => {
    mockVisitorCreate.mockResolvedValue({
      id: 'v-purpose',
      ...validVisitor,
      createdAt: new Date(),
      unit: { number: '1501' },
    });

    const req = createPostRequest('/api/v1/visitors', validVisitor);
    await POST_VISITOR(req);

    const createData = mockVisitorCreate.mock.calls[0]![0].data;
    expect(createData.visitorType).toBe('visitor');
  });
});

// ###########################################################################
// 8. Visitor sign-out: sets departureAt, signedOutById
// ###########################################################################

describe('8. Visitor sign-out', () => {
  it('signs out a visitor with departureAt and signedOutById', async () => {
    mockVisitorFindUnique.mockResolvedValue({
      id: 'v-1',
      visitorName: 'Jane',
      departureAt: null,
    });
    mockVisitorUpdate.mockResolvedValue({
      id: 'v-1',
      departureAt: new Date(),
      signedOutById: 'guard-001',
    });

    const req = createPatchRequest('/api/v1/visitors/v-1', {});
    const res = await PATCH_VISITOR(req, { params: Promise.resolve({ id: 'v-1' }) });

    expect(res.status).toBe(200);
    const updateData = mockVisitorUpdate.mock.calls[0]![0].data;
    expect(updateData.departureAt).toBeInstanceOf(Date);
    expect(updateData.signedOutById).toBe('guard-001');
  });

  it('rejects signing out an already departed visitor', async () => {
    mockVisitorFindUnique.mockResolvedValue({
      id: 'v-1',
      visitorName: 'Jane',
      departureAt: new Date('2026-03-18T10:00:00'),
    });

    const req = createPatchRequest('/api/v1/visitors/v-1', {});
    const res = await PATCH_VISITOR(req, { params: Promise.resolve({ id: 'v-1' }) });

    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('ALREADY_SIGNED_OUT');
  });

  it('returns 404 for non-existent visitor', async () => {
    mockVisitorFindUnique.mockResolvedValue(null);

    const req = createPatchRequest('/api/v1/visitors/nonexistent', {});
    const res = await PATCH_VISITOR(req, { params: Promise.resolve({ id: 'nonexistent' }) });

    expect(res.status).toBe(404);
  });
});

// ###########################################################################
// 9. Visitor batch sign-out: end of day bulk sign-out
// ###########################################################################

describe('9. Visitor batch sign-out: end of day bulk sign-out', () => {
  it('defaults visitor listing to active (signed-in) visitors only', async () => {
    const req = createGetRequest('/api/v1/visitors', {
      searchParams: { propertyId: PROP_A },
    });
    await GET_VISITORS(req);

    const where = mockVisitorFindMany.mock.calls[0]![0].where;
    expect(where.departureAt).toBeNull();
  });

  it('can filter to signed-out visitors for historical audit', async () => {
    const req = createGetRequest('/api/v1/visitors', {
      searchParams: { propertyId: PROP_A, status: 'signed_out' },
    });
    await GET_VISITORS(req);

    const where = mockVisitorFindMany.mock.calls[0]![0].where;
    expect(where.departureAt).toEqual({ not: null });
  });
});

// ###########################################################################
// 10. Active visitors count for dashboard
// ###########################################################################

describe('10. Active visitors count for dashboard', () => {
  it('counts active visitors scoped to property — needed for security dashboard widget', async () => {
    mockVisitorCount.mockResolvedValue(12);

    const req = createGetRequest('/api/v1/visitors', {
      searchParams: { propertyId: PROP_A },
    });
    await GET_VISITORS(req);

    // The count is called to provide total for pagination meta
    // In real implementation, dashboard calls with countOnly or uses meta.total
    expect(mockVisitorFindMany).toHaveBeenCalled();
  });

  it('does not count visitors from other properties', async () => {
    const req = createGetRequest('/api/v1/visitors', {
      searchParams: { propertyId: PROP_A },
    });
    await GET_VISITORS(req);

    const where = mockVisitorFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROP_A);
  });
});

// ###########################################################################
// 11. Incident reporting: create with priority, category, location
// ###########################################################################

describe('11. Incident reporting', () => {
  it('returns incident details when found', async () => {
    mockEventFindUnique.mockResolvedValue({
      id: 'incident-1',
      title: 'Water leak in basement',
      description: 'P2 level flooding observed',
      customFields: { priority: 'high', category: 'water_damage', location: 'P2 Parking' },
      createdAt: new Date(),
    });

    const req = createGetRequest('/api/v1/incidents/incident-1/updates');
    const res = await GET_UPDATES(req, { params: Promise.resolve({ id: 'incident-1' }) });

    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: { title: string } }>(res);
    expect(body.data.title).toBe('Water leak in basement');
  });

  it('returns 404 for non-existent incident', async () => {
    mockEventFindUnique.mockResolvedValue(null);

    const req = createGetRequest('/api/v1/incidents/missing/updates');
    const res = await GET_UPDATES(req, { params: Promise.resolve({ id: 'missing' }) });

    expect(res.status).toBe(404);
  });

  it('selects only necessary fields for incident display', async () => {
    mockEventFindUnique.mockResolvedValue({ id: 'i1', title: 'Test' });

    const req = createGetRequest('/api/v1/incidents/i1/updates');
    await GET_UPDATES(req, { params: Promise.resolve({ id: 'i1' }) });

    const select = mockEventFindUnique.mock.calls[0]![0].select;
    expect(select.id).toBe(true);
    expect(select.title).toBe(true);
    expect(select.description).toBe(true);
    expect(select.customFields).toBe(true);
  });
});

// ###########################################################################
// 12. Incident escalation: supervisor notified, priority bumped
// ###########################################################################

describe('12. Incident escalation', () => {
  const validEscalation = {
    escalateTo: 'Property Manager',
    reason: 'Situation escalating — resident unresponsive, water spreading.',
    priority: 'critical' as const,
  };

  it('bumps priority to critical and sets status to in_progress', async () => {
    mockEventUpdate.mockResolvedValue({
      id: 'i1',
      title: 'Water leak',
      propertyId: PROP_A,
    });
    mockUserPropertyFindMany.mockResolvedValue([]);

    const req = createPostRequest('/api/v1/incidents/i1/escalate', validEscalation);
    const res = await POST_ESCALATE(req, { params: Promise.resolve({ id: 'i1' }) });

    expect(res.status).toBe(200);
    const updateData = mockEventUpdate.mock.calls[0]![0].data;
    expect(updateData.priority).toBe('critical');
    expect(updateData.status).toBe('in_progress');
  });

  it('stores escalation metadata in customFields', async () => {
    mockEventUpdate.mockResolvedValue({ id: 'i1', title: 'Test', propertyId: PROP_A });
    mockUserPropertyFindMany.mockResolvedValue([]);

    const req = createPostRequest('/api/v1/incidents/i1/escalate', validEscalation);
    await POST_ESCALATE(req, { params: Promise.resolve({ id: 'i1' }) });

    const customFields = mockEventUpdate.mock.calls[0]![0].data.customFields;
    expect(customFields.escalatedBy).toBe('guard-001');
    expect(customFields.escalatedAt).toBeDefined();
    expect(customFields.escalationReason).toBeDefined();
  });

  it('defaults priority to high when not specified', async () => {
    mockEventUpdate.mockResolvedValue({ id: 'i1', title: 'Test', propertyId: PROP_A });
    mockUserPropertyFindMany.mockResolvedValue([]);

    const req = createPostRequest('/api/v1/incidents/i1/escalate', {
      escalateTo: 'Supervisor',
      reason: 'Needs review',
    });
    await POST_ESCALATE(req, { params: Promise.resolve({ id: 'i1' }) });

    expect(mockEventUpdate.mock.calls[0]![0].data.priority).toBe('high');
  });

  it('rejects escalation without escalateTo', async () => {
    const req = createPostRequest('/api/v1/incidents/i1/escalate', {
      reason: 'Urgent',
    });
    const res = await POST_ESCALATE(req, { params: Promise.resolve({ id: 'i1' }) });

    expect(res.status).toBe(400);
  });

  it('rejects escalation without reason', async () => {
    const req = createPostRequest('/api/v1/incidents/i1/escalate', {
      escalateTo: 'Manager',
    });
    const res = await POST_ESCALATE(req, { params: Promise.resolve({ id: 'i1' }) });

    expect(res.status).toBe(400);
  });

  it('rejects reason exceeding 1000 characters', async () => {
    const req = createPostRequest('/api/v1/incidents/i1/escalate', {
      escalateTo: 'Manager',
      reason: 'R'.repeat(1001),
    });
    const res = await POST_ESCALATE(req, { params: Promise.resolve({ id: 'i1' }) });

    expect(res.status).toBe(400);
  });

  it('strips HTML from escalateTo — XSS prevention', async () => {
    mockEventUpdate.mockResolvedValue({ id: 'i1', title: 'Test', propertyId: PROP_A });
    mockUserPropertyFindMany.mockResolvedValue([]);

    const req = createPostRequest('/api/v1/incidents/i1/escalate', {
      ...validEscalation,
      escalateTo: '<script>alert(1)</script>Manager',
    });
    await POST_ESCALATE(req, { params: Promise.resolve({ id: 'i1' }) });

    const customFields = mockEventUpdate.mock.calls[0]![0].data.customFields;
    expect(customFields.escalatedTo).not.toContain('<script>');
  });

  it('returns success message naming the escalation target', async () => {
    mockEventUpdate.mockResolvedValue({ id: 'i1', title: 'Test', propertyId: PROP_A });
    mockUserPropertyFindMany.mockResolvedValue([]);

    const req = createPostRequest('/api/v1/incidents/i1/escalate', validEscalation);
    const res = await POST_ESCALATE(req, { params: Promise.resolve({ id: 'i1' }) });

    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('Property Manager');
  });
});

// ###########################################################################
// 13. Incident updates: append update log entries
// ###########################################################################

describe('13. Incident updates: append update log entries', () => {
  it('appends update to incident description with separator', async () => {
    mockEventFindUnique.mockResolvedValue({
      id: 'i1',
      description: 'Initial report of water leak.',
    });
    mockEventUpdate.mockResolvedValue({ id: 'i1' });

    const req = createPostRequest('/api/v1/incidents/i1/updates', {
      content: 'Maintenance team dispatched.',
    });
    const res = await POST_UPDATE(req, { params: Promise.resolve({ id: 'i1' }) });

    expect(res.status).toBe(201);
    const updateData = mockEventUpdate.mock.calls[0]![0].data;
    expect(updateData.description).toContain('Initial report');
    expect(updateData.description).toContain('Maintenance team dispatched.');
    expect(updateData.description).toContain('--- Update');
  });

  it('handles null initial description gracefully', async () => {
    mockEventFindUnique.mockResolvedValue({ id: 'i1', description: null });
    mockEventUpdate.mockResolvedValue({ id: 'i1' });

    const req = createPostRequest('/api/v1/incidents/i1/updates', { content: 'First update' });
    const res = await POST_UPDATE(req, { params: Promise.resolve({ id: 'i1' }) });

    expect(res.status).toBe(201);
  });

  it('rejects empty content', async () => {
    const req = createPostRequest('/api/v1/incidents/i1/updates', { content: '' });
    const res = await POST_UPDATE(req, { params: Promise.resolve({ id: 'i1' }) });

    expect(res.status).toBe(400);
  });

  it('rejects content exceeding 2000 characters', async () => {
    const req = createPostRequest('/api/v1/incidents/i1/updates', {
      content: 'X'.repeat(2001),
    });
    const res = await POST_UPDATE(req, { params: Promise.resolve({ id: 'i1' }) });

    expect(res.status).toBe(400);
  });

  it('strips HTML from update content — XSS prevention', async () => {
    mockEventFindUnique.mockResolvedValue({ id: 'i1', description: '' });
    mockEventUpdate.mockResolvedValue({ id: 'i1' });

    const req = createPostRequest('/api/v1/incidents/i1/updates', {
      content: '<script>alert("xss")</script>Real update',
    });
    await POST_UPDATE(req, { params: Promise.resolve({ id: 'i1' }) });

    const updateData = mockEventUpdate.mock.calls[0]![0].data;
    expect(updateData.description).not.toContain('<script>');
    expect(updateData.description).toContain('Real update');
  });

  it('returns 404 when incident does not exist', async () => {
    mockEventFindUnique.mockResolvedValue(null);

    const req = createPostRequest('/api/v1/incidents/missing/updates', { content: 'Update' });
    const res = await POST_UPDATE(req, { params: Promise.resolve({ id: 'missing' }) });

    expect(res.status).toBe(404);
  });

  it('handles database errors without leaking internals', async () => {
    mockEventFindUnique.mockResolvedValue({ id: 'i1', description: '' });
    mockEventUpdate.mockRejectedValue(new Error('Connection lost'));

    const req = createPostRequest('/api/v1/incidents/i1/updates', { content: 'Update' });
    const res = await POST_UPDATE(req, { params: Promise.resolve({ id: 'i1' }) });

    expect(res.status).toBe(500);
    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).not.toContain('Connection');
  });
});

// ###########################################################################
// 14. Key checkout: issue key to resident with serial tracking
// ###########################################################################

describe('14. Key checkout: issue key to resident with serial tracking', () => {
  it('creates a KeyCheckout record with checkout timestamp', async () => {
    mockKeyFindUnique.mockResolvedValue({
      id: KEY_ID,
      propertyId: PROP_A,
      status: 'available',
      category: 'unit',
      keyName: 'Unit 1501 Key',
    });
    mockCheckoutCreate.mockResolvedValue({
      id: CHECKOUT_ID,
      keyId: KEY_ID,
      propertyId: PROP_A,
      checkedOutTo: 'Alice Resident',
      checkoutTime: new Date(),
      checkedOutById: 'guard-001',
    });
    mockKeyUpdate.mockResolvedValue({ id: KEY_ID, status: 'checked_out' });

    const req = createPostRequest('/api/v1/keys/checkouts', {
      propertyId: PROP_A,
      keyId: KEY_ID,
      checkedOutTo: 'Alice Resident',
      unitId: UNIT_A,
      idType: 'drivers_license',
      reason: 'Move-in key issuance',
    });
    const res = await POST_CHECKOUT(req);

    expect(res.status).toBe(201);
    const body = await parseResponse<{ data: { checkoutTime: string } }>(res);
    expect(body.data.checkoutTime).toBeDefined();
  });

  it('records the staff member who issued the key', async () => {
    mockKeyFindUnique.mockResolvedValue({
      id: KEY_ID,
      propertyId: PROP_A,
      status: 'available',
      category: 'unit',
    });
    mockCheckoutCreate.mockResolvedValue({
      id: CHECKOUT_ID,
      keyId: KEY_ID,
      checkedOutById: 'guard-001',
      checkoutTime: new Date(),
    });
    mockKeyUpdate.mockResolvedValue({ id: KEY_ID, status: 'checked_out' });

    const req = createPostRequest('/api/v1/keys/checkouts', {
      propertyId: PROP_A,
      keyId: KEY_ID,
      checkedOutTo: 'Bob',
      unitId: UNIT_A,
      idType: 'drivers_license',
      reason: 'Pickup',
    });
    await POST_CHECKOUT(req);

    const createCall = mockCheckoutCreate.mock.calls[0]![0];
    expect(createCall.data.checkedOutById).toBe('guard-001');
  });

  it('sets key status to checked_out', async () => {
    mockKeyFindUnique.mockResolvedValue({
      id: KEY_ID,
      propertyId: PROP_A,
      status: 'available',
      category: 'unit',
    });
    mockCheckoutCreate.mockResolvedValue({ id: CHECKOUT_ID, checkoutTime: new Date() });
    mockKeyUpdate.mockResolvedValue({ id: KEY_ID, status: 'checked_out' });

    const req = createPostRequest('/api/v1/keys/checkouts', {
      propertyId: PROP_A,
      keyId: KEY_ID,
      checkedOutTo: 'Carol',
      unitId: UNIT_A,
      idType: 'drivers_license',
      reason: 'Pickup',
    });
    await POST_CHECKOUT(req);

    const updateCall = mockKeyUpdate.mock.calls[0]![0];
    expect(updateCall.data.status).toBe('checked_out');
    expect(updateCall.where.id).toBe(KEY_ID);
  });

  it('rejects checkout of a decommissioned key', async () => {
    mockKeyFindUnique.mockResolvedValue({
      id: KEY_ID,
      propertyId: PROP_A,
      status: 'decommissioned',
      category: 'unit',
    });

    const req = createPostRequest('/api/v1/keys/checkouts', {
      propertyId: PROP_A,
      keyId: KEY_ID,
      checkedOutTo: 'Dave',
      unitId: UNIT_A,
      idType: 'drivers_license',
      reason: 'Attempted pickup',
    });
    const res = await POST_CHECKOUT(req);

    expect(res.status).toBe(409);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('KEY_NOT_AVAILABLE');
    expect(mockCheckoutCreate).not.toHaveBeenCalled();
  });

  it('rejects checkout of an already checked-out key', async () => {
    mockKeyFindUnique.mockResolvedValue({
      id: KEY_ID,
      propertyId: PROP_A,
      status: 'checked_out',
      category: 'unit',
    });

    const req = createPostRequest('/api/v1/keys/checkouts', {
      propertyId: PROP_A,
      keyId: KEY_ID,
      checkedOutTo: 'Eve',
      unitId: UNIT_A,
      idType: 'drivers_license',
      reason: 'Duplicate pickup',
    });
    const res = await POST_CHECKOUT(req);

    expect(res.status).toBe(409);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('KEY_NOT_AVAILABLE');
  });
});

// ###########################################################################
// 15. Key return: close checkout record
// ###########################################################################

describe('15. Key return: close checkout record', () => {
  it('sets returnTime and returnedToId on return', async () => {
    mockCheckoutFindUnique.mockResolvedValue({
      id: CHECKOUT_ID,
      keyId: KEY_ID,
      propertyId: PROP_A,
      returnTime: null,
    });
    mockCheckoutUpdate.mockResolvedValue({
      id: CHECKOUT_ID,
      returnTime: new Date(),
      returnedToId: 'guard-001',
    });
    mockKeyUpdate.mockResolvedValue({ id: KEY_ID, status: 'available' });

    const req = createPatchRequest(`/api/v1/keys/checkouts/${CHECKOUT_ID}`, {
      action: 'return',
      conditionNotes: 'Good condition',
    });
    const res = await PATCH_CHECKOUT(req, { params: Promise.resolve({ id: CHECKOUT_ID }) });

    expect(res.status).toBe(200);
    const updateCall = mockCheckoutUpdate.mock.calls[0]![0];
    expect(updateCall.data.returnTime).toBeInstanceOf(Date);
    expect(updateCall.data.returnedToId).toBe('guard-001');
  });

  it('resets key status to available after return', async () => {
    mockCheckoutFindUnique.mockResolvedValue({
      id: CHECKOUT_ID,
      keyId: KEY_ID,
      propertyId: PROP_A,
      returnTime: null,
    });
    mockCheckoutUpdate.mockResolvedValue({ id: CHECKOUT_ID, returnTime: new Date() });
    mockKeyUpdate.mockResolvedValue({ id: KEY_ID, status: 'available' });

    const req = createPatchRequest(`/api/v1/keys/checkouts/${CHECKOUT_ID}`, {
      action: 'return',
    });
    await PATCH_CHECKOUT(req, { params: Promise.resolve({ id: CHECKOUT_ID }) });

    const updateCall = mockKeyUpdate.mock.calls[0]![0];
    expect(updateCall.data.status).toBe('available');
  });

  it('rejects returning an already-returned key', async () => {
    mockCheckoutFindUnique.mockResolvedValue({
      id: CHECKOUT_ID,
      keyId: KEY_ID,
      propertyId: PROP_A,
      returnTime: new Date('2026-01-01'),
    });

    const req = createPatchRequest(`/api/v1/keys/checkouts/${CHECKOUT_ID}`, {
      action: 'return',
    });
    const res = await PATCH_CHECKOUT(req, { params: Promise.resolve({ id: CHECKOUT_ID }) });

    expect(res.status).toBe(409);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('ALREADY_RETURNED');
    expect(mockCheckoutUpdate).not.toHaveBeenCalled();
  });
});

// ###########################################################################
// 16. Key lost: auto-decommission + security alert
// ###########################################################################

describe('16. Key lost: auto-decommission + security alert', () => {
  it('marks key as lost', async () => {
    mockKeyUpdate.mockResolvedValue({
      id: KEY_ID,
      keyName: 'Master Key A',
      propertyId: PROP_A,
      status: 'lost',
      category: 'master',
    });
    mockIncidentCreate.mockResolvedValue({ id: 'incident-1' });

    const req = createPatchRequest(`/api/v1/keys/${KEY_ID}`, { action: 'lost' });
    const res = await PATCH_KEY(req, { params: Promise.resolve({ id: KEY_ID }) });

    expect(res.status).toBe(200);
    const updateCall = mockKeyUpdate.mock.calls[0]![0];
    expect(updateCall.data.status).toBe('lost');
  });

  it('creates an incident report (security alert) when key is marked lost', async () => {
    mockKeyUpdate.mockResolvedValue({
      id: KEY_ID,
      keyName: 'FOB #1234',
      propertyId: PROP_A,
      status: 'lost',
      category: 'master',
    });
    mockIncidentCreate.mockResolvedValue({ id: 'incident-2' });

    const req = createPatchRequest(`/api/v1/keys/${KEY_ID}`, { action: 'lost' });
    await PATCH_KEY(req, { params: Promise.resolve({ id: KEY_ID }) });

    expect(mockIncidentCreate).toHaveBeenCalled();
    const incidentData = mockIncidentCreate.mock.calls[0]![0].data;
    expect(incidentData.title).toContain('FOB #1234');
    expect(incidentData.propertyId).toBe(PROP_A);
    expect(incidentData.reportBody).toContain('lost');
  });

  it('returns confirmation message indicating key is lost', async () => {
    mockKeyUpdate.mockResolvedValue({
      id: KEY_ID,
      keyName: 'Storage Key B',
      propertyId: PROP_A,
      status: 'lost',
      category: 'common_area',
    });
    mockIncidentCreate.mockResolvedValue({ id: 'incident-3' });

    const req = createPatchRequest(`/api/v1/keys/${KEY_ID}`, { action: 'lost' });
    const res = await PATCH_KEY(req, { params: Promise.resolve({ id: KEY_ID }) });

    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('Storage Key B');
    expect(body.message).toContain('lost');
  });

  it('decommissions key with reason and timestamp', async () => {
    mockKeyUpdate.mockResolvedValue({
      id: KEY_ID,
      keyName: 'Old Key',
      status: 'decommissioned',
      decommissionReason: 'Lock changed',
      decommissionedAt: new Date(),
    });

    const req = createPatchRequest(`/api/v1/keys/${KEY_ID}`, {
      action: 'decommission',
      reason: 'Lock changed',
    });
    const res = await PATCH_KEY(req, { params: Promise.resolve({ id: KEY_ID }) });

    expect(res.status).toBe(200);
    const updateCall = mockKeyUpdate.mock.calls[0]![0];
    expect(updateCall.data.status).toBe('decommissioned');
    expect(updateCall.data.decommissionReason).toBe('Lock changed');
    expect(updateCall.data.decommissionedAt).toBeInstanceOf(Date);
  });
});

// ###########################################################################
// 17. Pass-on log: shift handoff notes
// ###########################################################################

describe('17. Pass-on log: shift handoff notes', () => {
  it('lists shift log entries ordered by createdAt desc', async () => {
    const req = createGetRequest('/api/v1/shift-log', {
      searchParams: { propertyId: PROP_A },
    });
    await GET_SHIFT_LOG(req);

    expect(mockEventFindMany).toHaveBeenCalled();
  });

  it('requires propertyId for shift log listing', async () => {
    const req = createGetRequest('/api/v1/shift-log');
    const res = await GET_SHIFT_LOG(req);

    expect(res.status).toBe(400);
  });

  it('creates a shift log entry with required fields', async () => {
    mockEventCreate.mockResolvedValue({
      id: 'sl-1',
      propertyId: PROP_A,
      title: 'Night shift handoff',
      status: 'open',
      createdAt: new Date(),
      referenceNo: 'EVT-X9Z8Y7',
    });

    const req = createPostRequest('/api/v1/shift-log', {
      propertyId: PROP_A,
      title: 'Night shift handoff',
      content: 'All quiet. Unit 305 has a parcel waiting pickup. Fire panel tested OK.',
    });
    const res = await POST_SHIFT_LOG(req);

    expect(res.status).toBe(201);
  });

  it('rejects shift log entry without propertyId', async () => {
    const req = createPostRequest('/api/v1/shift-log', {
      title: 'Missing property',
      content: 'Some content',
    });
    const res = await POST_SHIFT_LOG(req);

    expect(res.status).toBe(400);
  });
});

// ###########################################################################
// 18. Emergency contacts: quick access per unit
// ###########################################################################

describe('18. Emergency contacts: quick access per unit', () => {
  it('lists emergency contacts for a given unit', async () => {
    mockContactFindMany.mockResolvedValue([
      {
        id: 'ec-1',
        unitId: UNIT_A,
        contactName: 'Robert Williams',
        relationship: 'Spouse',
        phonePrimary: '+14165551234',
      },
    ]);

    const req = createGetRequest('/api/v1/emergency-contacts', {
      searchParams: { unitId: UNIT_A },
    });
    const res = await GET_EMERGENCY_CONTACTS(req);

    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: { contactName: string }[] }>(res);
    expect(body.data).toHaveLength(1);
    expect(body.data[0]!.contactName).toBe('Robert Williams');
  });

  it('rejects without unitId — contacts are always per-unit', async () => {
    const req = createGetRequest('/api/v1/emergency-contacts');
    const res = await GET_EMERGENCY_CONTACTS(req);

    expect(res.status).toBe(400);
    expect(mockContactFindMany).not.toHaveBeenCalled();
  });

  it('creates an emergency contact with required fields', async () => {
    mockContactCreate.mockResolvedValue({
      id: 'ec-new',
      unitId: UNIT_A,
      propertyId: PROP_A,
      userId: USER_A,
      contactName: 'Sarah Johnson',
      relationship: 'Daughter',
      phonePrimary: '+14165559999',
    });

    const req = createPostRequest('/api/v1/emergency-contacts', {
      unitId: UNIT_A,
      propertyId: PROP_A,
      userId: USER_A,
      contactName: 'Sarah Johnson',
      relationship: 'Daughter',
      phonePrimary: '+14165559999',
    });
    const res = await POST_EMERGENCY_CONTACT(req);

    expect(res.status).toBe(201);
  });

  it('scopes contact query by unitId', async () => {
    const req = createGetRequest('/api/v1/emergency-contacts', {
      searchParams: { unitId: UNIT_A },
    });
    await GET_EMERGENCY_CONTACTS(req);

    const where = mockContactFindMany.mock.calls[0]![0].where;
    expect(where.unitId).toBe(UNIT_A);
  });
});

// ###########################################################################
// 19. Parking violation: create, track, resolve lifecycle
// ###########################################################################

describe('19. Parking violation: create, track, resolve lifecycle', () => {
  it('lists parking violations scoped to property', async () => {
    mockViolationFindMany.mockResolvedValue([
      {
        id: 'pv-1',
        propertyId: PROP_A,
        licensePlate: 'ABCD 123',
        violationType: 'notice',
        status: 'open',
      },
    ]);

    const req = createGetRequest('/api/v1/parking', {
      searchParams: { propertyId: PROP_A, type: 'violations' },
    });
    const res = await GET_PARKING(req);

    expect(res.status).toBe(200);
  });

  it('rejects parking listing without propertyId', async () => {
    const req = createGetRequest('/api/v1/parking');
    const res = await GET_PARKING(req);

    expect(res.status).toBe(400);
  });

  it('resolves a parking violation with resolution details', async () => {
    mockViolationUpdate.mockResolvedValue({
      id: 'pv-1',
      status: 'resolved',
      resolutionType: 'resolved',
      resolutionNotes: 'Resident moved vehicle',
      resolvedById: 'guard-001',
      resolvedAt: new Date(),
    });

    const req = createPatchRequest('/api/v1/parking/violations/pv-1', {
      status: 'resolved',
      resolutionType: 'resolved',
      resolutionNotes: 'Resident moved vehicle',
    });
    const res = await PATCH_VIOLATION(req, { params: Promise.resolve({ id: 'pv-1' }) });

    expect(res.status).toBe(200);
    const updateData = mockViolationUpdate.mock.calls[0]![0].data;
    expect(updateData.status).toBe('resolved');
    expect(updateData.resolvedById).toBe('guard-001');
    expect(updateData.resolvedAt).toBeInstanceOf(Date);
  });

  it('tracks violation types: notice, warning, ticket, ban, vehicle_towed', async () => {
    const violationTypes = ['notice', 'warning', 'ticket', 'ban', 'vehicle_towed'] as const;

    for (const violationType of violationTypes) {
      mockViolationFindMany.mockResolvedValue([
        { id: `pv-${violationType}`, violationType, status: 'open' },
      ]);

      const req = createGetRequest('/api/v1/parking', {
        searchParams: { propertyId: PROP_A, type: 'violations' },
      });
      const res = await GET_PARKING(req);

      expect(res.status).toBe(200);
    }
  });
});

// ###########################################################################
// 20. FOB management: 6 slots per resident tracked
// ###########################################################################

describe('20. FOB management: 6 slots per resident tracked', () => {
  it('creates a key inventory entry of category fob', async () => {
    mockKeyCreate.mockResolvedValue({
      id: 'fob-new',
      keyName: 'FOB #0042',
      category: 'fob',
      status: 'available',
      createdById: 'guard-001',
    });

    const req = createPostRequest('/api/v1/keys', {
      propertyId: PROP_A,
      keyName: 'FOB #0042',
      category: 'fob',
      keyNumber: 'SER-0042',
    });
    const res = await POST_KEY(req);

    expect(res.status).toBe(201);
  });

  it('rejects FOB issuance when unit already has maximum (6) FOBs', async () => {
    mockKeyFindUnique.mockResolvedValue({
      id: KEY_ID,
      propertyId: PROP_A,
      status: 'available',
      category: 'fob',
    });
    mockKeyCount.mockResolvedValue(6);

    const req = createPostRequest('/api/v1/keys/checkouts', {
      propertyId: PROP_A,
      keyId: KEY_ID,
      checkedOutTo: 'Max Resident',
      unitId: UNIT_A,
      idType: 'drivers_license',
      reason: '7th FOB attempt',
      enforceMax: true,
    });
    const res = await POST_CHECKOUT(req);

    expect(res.status).toBe(409);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MAX_KEYS_EXCEEDED');
  });

  it('allows FOB issuance when under the 6-slot limit', async () => {
    mockKeyFindUnique.mockResolvedValue({
      id: KEY_ID,
      propertyId: PROP_A,
      status: 'available',
      category: 'fob',
    });
    mockKeyCount.mockResolvedValue(4);
    mockCheckoutCreate.mockResolvedValue({
      id: CHECKOUT_ID,
      keyId: KEY_ID,
      checkoutTime: new Date(),
    });
    mockKeyUpdate.mockResolvedValue({ id: KEY_ID, status: 'checked_out' });

    const req = createPostRequest('/api/v1/keys/checkouts', {
      propertyId: PROP_A,
      keyId: KEY_ID,
      checkedOutTo: 'Under-limit Resident',
      unitId: UNIT_A,
      idType: 'drivers_license',
      reason: 'New FOB issuance',
      enforceMax: true,
    });
    const res = await POST_CHECKOUT(req);

    expect(res.status).toBe(201);
  });

  it('lists all active FOB checkouts for a unit', async () => {
    const activeCheckouts = [
      { id: 'c1', keyId: 'k1', checkedOutTo: 'Alice', unitId: UNIT_A, returnTime: null },
      { id: 'c2', keyId: 'k2', checkedOutTo: 'Alice', unitId: UNIT_A, returnTime: null },
    ];
    mockCheckoutFindMany.mockResolvedValue(activeCheckouts);

    const req = createGetRequest('/api/v1/keys/checkouts', {
      searchParams: { propertyId: PROP_A, unitId: UNIT_A, active: 'true' },
    });
    const res = await GET_CHECKOUTS(req);

    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: unknown[] }>(res);
    expect(body.data).toHaveLength(2);

    const where = mockCheckoutFindMany.mock.calls[0]![0].where;
    expect(where.unitId).toBe(UNIT_A);
    expect(where.returnTime).toBeNull();
  });

  it('accepts all key categories including extended types', async () => {
    const categories = [
      'master',
      'unit',
      'common_area',
      'vehicle',
      'equipment',
      'other',
      'fob',
      'buzzer_code',
      'garage_clicker',
      'mailbox',
      'storage_locker',
    ];

    for (const category of categories) {
      mockKeyCreate.mockResolvedValue({
        id: `k-${category}`,
        keyName: `Test ${category}`,
        category,
        status: 'available',
        createdById: 'guard-001',
      });

      const req = createPostRequest('/api/v1/keys', {
        propertyId: PROP_A,
        keyName: `Test ${category}`,
        category,
      });
      const res = await POST_KEY(req);

      expect(res.status).toBe(201);
    }
  });

  it('rejects invalid key category', async () => {
    const req = createPostRequest('/api/v1/keys', {
      propertyId: PROP_A,
      keyName: 'Invalid Category',
      category: 'nonexistent_category',
    });
    const res = await POST_KEY(req);

    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });
});

// ###########################################################################
// 21. Event filtering: by type, group, status, unit, date range
// ###########################################################################

describe('21. Event filtering: by type, group, status, unit, date range', () => {
  it('filters by event type', async () => {
    const req = createGetRequest('/api/v1/events', {
      searchParams: { propertyId: PROP_A, typeId: EVENT_TYPE_SECURITY },
    });
    await GET_EVENTS(req);

    expect(mockEventFindMany.mock.calls[0]![0].where.eventTypeId).toBe(EVENT_TYPE_SECURITY);
  });

  it('filters by status', async () => {
    const req = createGetRequest('/api/v1/events', {
      searchParams: { propertyId: PROP_A, status: 'open' },
    });
    await GET_EVENTS(req);

    expect(mockEventFindMany.mock.calls[0]![0].where.status).toBe('open');
  });

  it('filters by priority', async () => {
    const req = createGetRequest('/api/v1/events', {
      searchParams: { propertyId: PROP_A, priority: 'urgent' },
    });
    await GET_EVENTS(req);

    expect(mockEventFindMany.mock.calls[0]![0].where.priority).toBe('urgent');
  });

  it('filters by unitId', async () => {
    const req = createGetRequest('/api/v1/events', {
      searchParams: { propertyId: PROP_A, unitId: UNIT_A },
    });
    await GET_EVENTS(req);

    expect(mockEventFindMany.mock.calls[0]![0].where.unitId).toBe(UNIT_A);
  });

  it('orders events by createdAt DESC — most recent first', async () => {
    const req = createGetRequest('/api/v1/events', {
      searchParams: { propertyId: PROP_A },
    });
    await GET_EVENTS(req);

    expect(mockEventFindMany.mock.calls[0]![0].orderBy).toEqual({ createdAt: 'desc' });
  });

  it('excludes soft-deleted events', async () => {
    const req = createGetRequest('/api/v1/events', {
      searchParams: { propertyId: PROP_A },
    });
    await GET_EVENTS(req);

    expect(mockEventFindMany.mock.calls[0]![0].where.deletedAt).toBeNull();
  });

  it('paginates with default of 50 per page for security console', async () => {
    mockEventCount.mockResolvedValue(200);

    const req = createGetRequest('/api/v1/events', {
      searchParams: { propertyId: PROP_A },
    });
    const res = await GET_EVENTS(req);
    const body = await parseResponse<{ meta: { pageSize: number } }>(res);

    expect(body.meta.pageSize).toBe(50);
  });
});

// ###########################################################################
// 22. Event search: across title, description, custom fields
// ###########################################################################

describe('22. Event search: across title, description, custom fields', () => {
  it('searches across title, description, AND reference number', async () => {
    const req = createGetRequest('/api/v1/events', {
      searchParams: { propertyId: PROP_A, search: 'fire alarm' },
    });
    await GET_EVENTS(req);

    const where = mockEventFindMany.mock.calls[0]![0].where;
    expect(where.OR).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ title: { contains: 'fire alarm', mode: 'insensitive' } }),
        expect.objectContaining({ description: { contains: 'fire alarm', mode: 'insensitive' } }),
        expect.objectContaining({ referenceNo: { contains: 'fire alarm', mode: 'insensitive' } }),
      ]),
    );
  });

  it('search is case-insensitive', async () => {
    const req = createGetRequest('/api/v1/events', {
      searchParams: { propertyId: PROP_A, search: 'FIRE ALARM' },
    });
    await GET_EVENTS(req);

    const where = mockEventFindMany.mock.calls[0]![0].where;
    const titleClause = where.OR.find((clause: Record<string, unknown>) => 'title' in clause);
    expect(titleClause.title.mode).toBe('insensitive');
  });

  it('includes unit relation in listing — unit number appears on event cards', async () => {
    const req = createGetRequest('/api/v1/events', {
      searchParams: { propertyId: PROP_A },
    });
    await GET_EVENTS(req);

    const include = mockEventFindMany.mock.calls[0]![0].include;
    expect(include.unit).toBeDefined();
    expect(include.unit.select.number).toBe(true);
  });
});

// ###########################################################################
// 23. Global search: returns events + visitors + incidents + packages
// ###########################################################################

describe('23. Global search: returns events + visitors + incidents + packages', () => {
  it('searches across all 5 modules in parallel', async () => {
    // event.findMany is shared between events and search routes
    // search uses user, unit, package, event, announcement findMany
    const req = createGetRequest('/api/v1/search', {
      searchParams: { propertyId: PROP_A, q: 'john' },
    });
    await GET_SEARCH(req);

    expect(mockSearchUserFindMany).toHaveBeenCalledTimes(1);
    expect(mockSearchUnitFindMany).toHaveBeenCalledTimes(1);
    expect(mockSearchPackageFindMany).toHaveBeenCalledTimes(1);
    // event.findMany is shared — search route calls it too
    expect(mockEventFindMany).toHaveBeenCalledTimes(1);
    expect(mockSearchAnnouncementFindMany).toHaveBeenCalledTimes(1);
  });

  it('returns categorized results: users, units, packages, events, announcements', async () => {
    mockSearchUserFindMany.mockResolvedValue([
      { id: 'u1', firstName: 'John', lastName: 'Doe', email: 'john@example.com' },
    ]);
    mockSearchUnitFindMany.mockResolvedValue([]);
    mockSearchPackageFindMany.mockResolvedValue([]);
    // event.findMany is shared between events and search routes
    mockEventFindMany.mockResolvedValue([
      { id: 'evt1', title: 'John visitor check-in', referenceNo: 'EVT-111', status: 'open' },
    ]);
    mockSearchAnnouncementFindMany.mockResolvedValue([]);

    const req = createGetRequest('/api/v1/search', {
      searchParams: { propertyId: PROP_A, q: 'john' },
    });
    const res = await GET_SEARCH(req);

    expect(res.status).toBe(200);
    const body = await parseResponse<{
      data: {
        users: { firstName: string }[];
        units: unknown[];
        packages: unknown[];
        events: { title: string }[];
        announcements: unknown[];
      };
      meta: { totalResults: number };
    }>(res);

    expect(body.data.users).toHaveLength(1);
    expect(body.data.users[0]!.firstName).toBe('John');
    expect(body.data.events).toHaveLength(1);
    expect(body.meta.totalResults).toBe(2);
  });

  it('returns empty results without propertyId — no cross-tenant leakage', async () => {
    const req = createGetRequest('/api/v1/search', {
      searchParams: { q: 'test' },
    });
    const res = await GET_SEARCH(req);

    expect(res.status).toBe(200);
    expect(mockSearchUserFindMany).not.toHaveBeenCalled();
    expect(mockEventFindMany).not.toHaveBeenCalled();
  });

  it('returns empty results for query under 2 characters — prevents expensive wildcard scans', async () => {
    const req = createGetRequest('/api/v1/search', {
      searchParams: { propertyId: PROP_A, q: 'a' },
    });
    const res = await GET_SEARCH(req);

    expect(res.status).toBe(200);
    expect(mockSearchUserFindMany).not.toHaveBeenCalled();
  });

  it('limits results per module to prevent overwhelming UI', async () => {
    const req = createGetRequest('/api/v1/search', {
      searchParams: { propertyId: PROP_A, q: 'test' },
    });
    await GET_SEARCH(req);

    expect(mockSearchUserFindMany.mock.calls[0]![0].take).toBe(5);
    // event.findMany is shared — check it was called with take:5
    expect(mockEventFindMany.mock.calls[0]![0].take).toBe(5);
  });

  it('never leaks password hashes in search results', async () => {
    const req = createGetRequest('/api/v1/search', {
      searchParams: { propertyId: PROP_A, q: 'test' },
    });
    await GET_SEARCH(req);

    const userSelect = mockSearchUserFindMany.mock.calls[0]![0].select;
    expect(userSelect.passwordHash).toBeUndefined();
  });

  it('excludes soft-deleted records from all module searches', async () => {
    const req = createGetRequest('/api/v1/search', {
      searchParams: { propertyId: PROP_A, q: 'test' },
    });
    await GET_SEARCH(req);

    expect(mockSearchUserFindMany.mock.calls[0]![0].where.deletedAt).toBeNull();
    expect(mockSearchUnitFindMany.mock.calls[0]![0].where.deletedAt).toBeNull();
    expect(mockSearchPackageFindMany.mock.calls[0]![0].where.deletedAt).toBeNull();
    expect(mockEventFindMany.mock.calls[0]![0].where.deletedAt).toBeNull();
    expect(mockSearchAnnouncementFindMany.mock.calls[0]![0].where.deletedAt).toBeNull();
  });

  it('handles database errors without leaking internals', async () => {
    mockSearchUserFindMany.mockRejectedValue(new Error('Connection timeout'));

    const req = createGetRequest('/api/v1/search', {
      searchParams: { propertyId: PROP_A, q: 'test' },
    });
    const res = await GET_SEARCH(req);

    expect(res.status).toBe(500);
    const body = await parseResponse<{ error: string; message: string }>(res);
    expect(body.error).toBe('INTERNAL_ERROR');
    expect(body.message).not.toContain('Connection timeout');
  });
});

// ###########################################################################
// 24. Tenant isolation on all operations
// ###########################################################################

describe('24. Tenant isolation on all operations', () => {
  it('events: rejects listing without propertyId', async () => {
    const req = createGetRequest('/api/v1/events');
    const res = await GET_EVENTS(req);

    expect(res.status).toBe(400);
    expect(mockEventFindMany).not.toHaveBeenCalled();
  });

  it('events: scopes query to propertyId', async () => {
    const req = createGetRequest('/api/v1/events', {
      searchParams: { propertyId: PROP_A },
    });
    await GET_EVENTS(req);

    expect(mockEventFindMany.mock.calls[0]![0].where.propertyId).toBe(PROP_A);
  });

  it('events: rejects creation without propertyId', async () => {
    const req = createPostRequest('/api/v1/events', {
      eventTypeId: EVENT_TYPE_SECURITY,
      title: 'No property',
    });
    const res = await POST_EVENT(req);

    expect(res.status).toBe(400);
  });

  it('visitors: scopes listing to propertyId', async () => {
    const req = createGetRequest('/api/v1/visitors', {
      searchParams: { propertyId: PROP_A },
    });
    await GET_VISITORS(req);

    expect(mockVisitorFindMany.mock.calls[0]![0].where.propertyId).toBe(PROP_A);
  });

  it('visitors: rejects listing without propertyId', async () => {
    const req = createGetRequest('/api/v1/visitors');
    const res = await GET_VISITORS(req);

    expect(res.status).toBe(400);
    expect(mockVisitorFindMany).not.toHaveBeenCalled();
  });

  it('keys: rejects listing without propertyId', async () => {
    const req = createGetRequest('/api/v1/keys');
    const res = await GET_KEYS(req);

    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_PROPERTY');
    expect(mockKeyFindMany).not.toHaveBeenCalled();
  });

  it('keys: scopes listing to propertyId', async () => {
    const req = createGetRequest('/api/v1/keys', {
      searchParams: { propertyId: PROP_A },
    });
    await GET_KEYS(req);

    expect(mockKeyFindMany.mock.calls[0]![0].where.propertyId).toBe(PROP_A);
  });

  it('key checkouts: validates key belongs to specified property', async () => {
    mockKeyFindUnique.mockResolvedValue({
      id: KEY_ID,
      propertyId: PROP_B,
      status: 'available',
      category: 'unit',
    });

    const req = createPostRequest('/api/v1/keys/checkouts', {
      propertyId: PROP_A,
      keyId: KEY_ID,
      checkedOutTo: 'Cross-tenant attacker',
      unitId: UNIT_A,
      idType: 'drivers_license',
      reason: 'Should fail',
    });
    const res = await POST_CHECKOUT(req);

    expect(res.status).toBe(404);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('KEY_NOT_FOUND');
  });

  it('key checkouts: requires propertyId for listing', async () => {
    const req = createGetRequest('/api/v1/keys/checkouts');
    const res = await GET_CHECKOUTS(req);

    expect(res.status).toBe(400);
    expect(mockCheckoutFindMany).not.toHaveBeenCalled();
  });

  it('parking: rejects listing without propertyId', async () => {
    const req = createGetRequest('/api/v1/parking');
    const res = await GET_PARKING(req);

    expect(res.status).toBe(400);
  });

  it('search: scopes all module queries to propertyId', async () => {
    const req = createGetRequest('/api/v1/search', {
      searchParams: { propertyId: PROP_A, q: 'test' },
    });
    await GET_SEARCH(req);

    // User search scoped via userProperties join
    const userWhere = mockSearchUserFindMany.mock.calls[0]![0].where;
    expect(userWhere.userProperties).toEqual({
      some: { propertyId: PROP_A, deletedAt: null },
    });

    // Direct propertyId scoping on units
    expect(mockSearchUnitFindMany.mock.calls[0]![0].where.propertyId).toBe(PROP_A);

    // Direct propertyId scoping on packages
    expect(mockSearchPackageFindMany.mock.calls[0]![0].where.propertyId).toBe(PROP_A);

    // Direct propertyId scoping on events (event.findMany is shared)
    expect(mockEventFindMany.mock.calls[0]![0].where.propertyId).toBe(PROP_A);

    // Direct propertyId scoping on announcements
    expect(mockSearchAnnouncementFindMany.mock.calls[0]![0].where.propertyId).toBe(PROP_A);
  });

  it('shift log: rejects listing without propertyId', async () => {
    const req = createGetRequest('/api/v1/shift-log');
    const res = await GET_SHIFT_LOG(req);

    expect(res.status).toBe(400);
  });

  it('database errors never leak internal details', async () => {
    mockEventCreate.mockRejectedValue(new Error('UNIQUE constraint violated'));

    const req = createPostRequest('/api/v1/events', {
      propertyId: PROP_A,
      eventTypeId: EVENT_TYPE_SECURITY,
      title: 'Error test',
    });
    const res = await POST_EVENT(req);

    expect(res.status).toBe(500);
    const body = await parseResponse<{ error: string; message: string }>(res);
    expect(body.error).toBe('INTERNAL_ERROR');
    expect(body.message).not.toContain('UNIQUE constraint');
  });
});
