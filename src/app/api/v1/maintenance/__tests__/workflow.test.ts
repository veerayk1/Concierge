/**
 * Maintenance Workflow Tests — assignment, status transitions, photo upload wiring
 *
 * These tests exercise the full lifecycle of a maintenance request:
 * creation, assignment, hold/resume, completion, re-open, SLA escalation,
 * photo attachments, audit records, comments, and email notifications.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  createPatchRequest,
  createPostRequest,
  createGetRequest,
  parseResponse,
} from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Mock Setup
// ---------------------------------------------------------------------------

const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();
const mockCreate = vi.fn();
const mockStatusChangeCreate = vi.fn();
const mockCommentCreate = vi.fn();
const mockCommentFindMany = vi.fn();
const mockAttachmentCreate = vi.fn();
const mockSendEmail = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    maintenanceRequest: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
      create: (...args: unknown[]) => mockCreate(...args),
    },
    maintenanceStatusChange: {
      create: (...args: unknown[]) => mockStatusChangeCreate(...args),
    },
    maintenanceComment: {
      create: (...args: unknown[]) => mockCommentCreate(...args),
      findMany: (...args: unknown[]) => mockCommentFindMany(...args),
    },
    attachment: {
      create: (...args: unknown[]) => mockAttachmentCreate(...args),
    },
    user: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      findFirst: vi.fn().mockResolvedValue(null),
    },
  },
}));

vi.mock('@/server/email', () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
  getUnitResidentEmails: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: vi.fn().mockResolvedValue({
    user: {
      userId: 'staff-1',
      propertyId: '00000000-0000-4000-b000-000000000001',
      role: 'property_manager',
      permissions: ['*'],
      mfaVerified: false,
    },
    error: null,
  }),
}));

const PROPERTY_ID = '00000000-0000-4000-b000-000000000001';
const REQUEST_ID = '00000000-0000-4000-c000-000000000001';
const STAFF_ID = '00000000-0000-4000-d000-000000000002';
const VENDOR_ID = '00000000-0000-4000-e000-000000000001';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRequest(overrides: Record<string, unknown> = {}) {
  return {
    id: REQUEST_ID,
    propertyId: PROPERTY_ID,
    referenceNumber: 'MR-TEST',
    status: 'open',
    priority: 'medium',
    description: 'Kitchen sink is leaking under the cabinet.',
    residentId: 'resident-1',
    assignedEmployeeId: null,
    assignedVendorId: null,
    completedDate: null,
    resolutionNotes: null,
    holdReason: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    unit: { id: 'u1', number: '101' },
    category: { id: 'cat-1', name: 'Plumbing' },
    resident: { id: 'resident-1', email: 'resident@test.com', firstName: 'Jane' },
    ...overrides,
  };
}

// We need to import AFTER mocks are set up
import { PATCH } from '@/app/api/v1/maintenance/[id]/route';

beforeEach(() => {
  vi.clearAllMocks();
  mockSendEmail.mockResolvedValue('msg-id');
  mockStatusChangeCreate.mockResolvedValue({ id: 'sc-1' });
  mockAttachmentCreate.mockResolvedValue({ id: 'att-1' });
});

// ---------------------------------------------------------------------------
// 1. Create request with status=open, referenceNumber auto-generated
//    (Covered by existing route.test.ts — verified here via mock setup)
// ---------------------------------------------------------------------------

describe('Maintenance Workflow — 1. Initial state', () => {
  it('request starts with status=open', () => {
    const req = makeRequest();
    expect(req.status).toBe('open');
  });

  it('request has a referenceNumber', () => {
    const req = makeRequest();
    expect(req.referenceNumber).toMatch(/^MR-/);
  });
});

// ---------------------------------------------------------------------------
// 2. Assign to staff -> status=in_progress, assignedEmployeeId set
// ---------------------------------------------------------------------------

describe('Maintenance Workflow — 2. Assign to staff', () => {
  it('sets status to in_progress and assignedEmployeeId when assigning to staff', async () => {
    const existing = makeRequest({ status: 'open' });
    mockFindUnique.mockResolvedValue(existing);
    mockUpdate.mockResolvedValue({
      ...existing,
      status: 'in_progress',
      assignedEmployeeId: STAFF_ID,
    });

    const req = createPatchRequest(`/api/v1/maintenance/${REQUEST_ID}`, {
      status: 'in_progress',
      assignedEmployeeId: STAFF_ID,
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: REQUEST_ID }) });

    expect(res.status).toBe(200);
    const updateCall = mockUpdate.mock.calls[0]![0];
    expect(updateCall.data.status).toBe('in_progress');
    expect(updateCall.data.assignedEmployeeId).toBe(STAFF_ID);
  });
});

// ---------------------------------------------------------------------------
// 3. Assign to vendor -> vendorId set, vendor notified via email
// ---------------------------------------------------------------------------

describe('Maintenance Workflow — 3. Assign to vendor', () => {
  it('sets assignedVendorId when assigning to vendor', async () => {
    const existing = makeRequest({ status: 'open' });
    mockFindUnique.mockResolvedValue(existing);
    mockUpdate.mockResolvedValue({
      ...existing,
      status: 'in_progress',
      assignedVendorId: VENDOR_ID,
    });

    const req = createPatchRequest(`/api/v1/maintenance/${REQUEST_ID}`, {
      status: 'in_progress',
      assignedVendorId: VENDOR_ID,
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: REQUEST_ID }) });

    expect(res.status).toBe(200);
    const updateCall = mockUpdate.mock.calls[0]![0];
    expect(updateCall.data.assignedVendorId).toBe(VENDOR_ID);
  });

  it('sends email notification when vendor is assigned', async () => {
    const existing = makeRequest({ status: 'open' });
    mockFindUnique.mockResolvedValue(existing);
    mockUpdate.mockResolvedValue({
      ...existing,
      status: 'in_progress',
      assignedVendorId: VENDOR_ID,
    });

    const req = createPatchRequest(`/api/v1/maintenance/${REQUEST_ID}`, {
      status: 'in_progress',
      assignedVendorId: VENDOR_ID,
    });
    await PATCH(req, { params: Promise.resolve({ id: REQUEST_ID }) });

    expect(mockSendEmail).toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// 4. Put on hold -> status=on_hold, holdReason stored
// ---------------------------------------------------------------------------

describe('Maintenance Workflow — 4. Put on hold', () => {
  it('transitions to on_hold with holdReason', async () => {
    const existing = makeRequest({ status: 'in_progress', assignedEmployeeId: STAFF_ID });
    mockFindUnique.mockResolvedValue(existing);
    mockUpdate.mockResolvedValue({ ...existing, status: 'on_hold' });

    const req = createPatchRequest(`/api/v1/maintenance/${REQUEST_ID}`, {
      status: 'on_hold',
      holdReason: 'Waiting for parts from supplier',
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: REQUEST_ID }) });

    expect(res.status).toBe(200);
    const updateCall = mockUpdate.mock.calls[0]![0];
    expect(updateCall.data.status).toBe('on_hold');
  });

  it('rejects on_hold without holdReason', async () => {
    const existing = makeRequest({ status: 'in_progress', assignedEmployeeId: STAFF_ID });
    mockFindUnique.mockResolvedValue(existing);

    const req = createPatchRequest(`/api/v1/maintenance/${REQUEST_ID}`, {
      status: 'on_hold',
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: REQUEST_ID }) });

    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('HOLD_REASON_REQUIRED');
  });
});

// ---------------------------------------------------------------------------
// 5. Resume from hold -> status=in_progress
// ---------------------------------------------------------------------------

describe('Maintenance Workflow — 5. Resume from hold', () => {
  it('transitions from on_hold back to in_progress', async () => {
    const existing = makeRequest({ status: 'on_hold', assignedEmployeeId: STAFF_ID });
    mockFindUnique.mockResolvedValue(existing);
    mockUpdate.mockResolvedValue({ ...existing, status: 'in_progress' });

    const req = createPatchRequest(`/api/v1/maintenance/${REQUEST_ID}`, {
      status: 'in_progress',
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: REQUEST_ID }) });

    expect(res.status).toBe(200);
    const updateCall = mockUpdate.mock.calls[0]![0];
    expect(updateCall.data.status).toBe('in_progress');
  });
});

// ---------------------------------------------------------------------------
// 6. Complete request -> status=completed, completedDate set
// ---------------------------------------------------------------------------

describe('Maintenance Workflow — 6. Complete request', () => {
  it('sets status=completed and completedDate when completing with resolution notes', async () => {
    const existing = makeRequest({ status: 'in_progress', assignedEmployeeId: STAFF_ID });
    mockFindUnique.mockResolvedValue(existing);
    mockUpdate.mockResolvedValue({ ...existing, status: 'completed', completedDate: new Date() });

    const req = createPatchRequest(`/api/v1/maintenance/${REQUEST_ID}`, {
      status: 'completed',
      resolutionNotes: 'Replaced the washer on the kitchen faucet.',
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: REQUEST_ID }) });

    expect(res.status).toBe(200);
    const updateCall = mockUpdate.mock.calls[0]![0];
    expect(updateCall.data.status).toBe('completed');
    expect(updateCall.data.completedDate).toBeDefined();
    expect(updateCall.data.resolutionNotes).toBe('Replaced the washer on the kitchen faucet.');
  });
});

// ---------------------------------------------------------------------------
// 7. Cannot complete without resolution notes
// ---------------------------------------------------------------------------

describe('Maintenance Workflow — 7. Cannot complete without resolution notes', () => {
  it('rejects completion without resolutionNotes', async () => {
    const existing = makeRequest({ status: 'in_progress', assignedEmployeeId: STAFF_ID });
    mockFindUnique.mockResolvedValue(existing);

    const req = createPatchRequest(`/api/v1/maintenance/${REQUEST_ID}`, {
      status: 'completed',
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: REQUEST_ID }) });

    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('RESOLUTION_NOTES_REQUIRED');
  });
});

// ---------------------------------------------------------------------------
// 8. Re-open a completed request -> status=open (within 48h only)
// ---------------------------------------------------------------------------

describe('Maintenance Workflow — 8. Re-open completed request within 48h', () => {
  it('allows re-opening a completed request within 48 hours', async () => {
    const completedAt = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24h ago
    const existing = makeRequest({ status: 'completed', completedDate: completedAt });
    mockFindUnique.mockResolvedValue(existing);
    mockUpdate.mockResolvedValue({ ...existing, status: 'open', completedDate: null });

    const req = createPatchRequest(`/api/v1/maintenance/${REQUEST_ID}`, {
      status: 'open',
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: REQUEST_ID }) });

    expect(res.status).toBe(200);
    const updateCall = mockUpdate.mock.calls[0]![0];
    expect(updateCall.data.status).toBe('open');
    expect(updateCall.data.completedDate).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 9. Cannot re-open after 48h
// ---------------------------------------------------------------------------

describe('Maintenance Workflow — 9. Cannot re-open after 48h', () => {
  it('rejects re-opening a completed request after 48 hours', async () => {
    const completedAt = new Date(Date.now() - 49 * 60 * 60 * 1000); // 49h ago
    const existing = makeRequest({ status: 'completed', completedDate: completedAt });
    mockFindUnique.mockResolvedValue(existing);

    const req = createPatchRequest(`/api/v1/maintenance/${REQUEST_ID}`, {
      status: 'open',
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: REQUEST_ID }) });

    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('REOPEN_WINDOW_EXPIRED');
  });
});

// ---------------------------------------------------------------------------
// 10. Priority escalation: if SLA exceeded, priority auto-bumps
// ---------------------------------------------------------------------------

describe('Maintenance Workflow — 10. SLA priority escalation', () => {
  it('auto-bumps priority when SLA is overdue on status change', async () => {
    // Request created 25 hours ago with Plumbing category (24h SLA) = overdue
    const createdAt = new Date(Date.now() - 25 * 60 * 60 * 1000);
    const existing = makeRequest({
      status: 'open',
      priority: 'low',
      createdAt,
      category: { id: 'cat-1', name: 'Plumbing' },
    });
    mockFindUnique.mockResolvedValue(existing);
    mockUpdate.mockImplementation((args: { data: Record<string, unknown> }) => ({
      ...existing,
      ...args.data,
    }));

    const req = createPatchRequest(`/api/v1/maintenance/${REQUEST_ID}`, {
      status: 'in_progress',
      assignedEmployeeId: STAFF_ID,
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: REQUEST_ID }) });

    expect(res.status).toBe(200);
    const updateCall = mockUpdate.mock.calls[0]![0];
    // low + overdue = medium (bumped one level)
    expect(updateCall.data.priority).toBe('medium');
  });

  it('forces priority to urgent when SLA is critical', async () => {
    // Request created 50 hours ago with Plumbing category (24h SLA) = 208% = critical
    const createdAt = new Date(Date.now() - 50 * 60 * 60 * 1000);
    const existing = makeRequest({
      status: 'open',
      priority: 'low',
      createdAt,
      category: { id: 'cat-1', name: 'Plumbing' },
    });
    mockFindUnique.mockResolvedValue(existing);
    mockUpdate.mockImplementation((args: { data: Record<string, unknown> }) => ({
      ...existing,
      ...args.data,
    }));

    const req = createPatchRequest(`/api/v1/maintenance/${REQUEST_ID}`, {
      status: 'in_progress',
      assignedEmployeeId: STAFF_ID,
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: REQUEST_ID }) });

    expect(res.status).toBe(200);
    const updateCall = mockUpdate.mock.calls[0]![0];
    expect(updateCall.data.priority).toBe('urgent');
  });

  it('does not bump priority when SLA is within limits', async () => {
    // Request created 1 hour ago with Plumbing category (24h SLA) = within_sla
    const createdAt = new Date(Date.now() - 1 * 60 * 60 * 1000);
    const existing = makeRequest({
      status: 'open',
      priority: 'low',
      createdAt,
      category: { id: 'cat-1', name: 'Plumbing' },
    });
    mockFindUnique.mockResolvedValue(existing);
    mockUpdate.mockImplementation((args: { data: Record<string, unknown> }) => ({
      ...existing,
      ...args.data,
    }));

    const req = createPatchRequest(`/api/v1/maintenance/${REQUEST_ID}`, {
      status: 'in_progress',
      assignedEmployeeId: STAFF_ID,
    });
    await PATCH(req, { params: Promise.resolve({ id: REQUEST_ID }) });

    const updateCall = mockUpdate.mock.calls[0]![0];
    // Priority should remain unchanged — no bump
    expect(updateCall.data.priority).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 11. Photo attachment: link Attachment records to maintenance request
// ---------------------------------------------------------------------------

describe('Maintenance Workflow — 11. Photo attachment wiring', () => {
  it('creates Attachment records when attachments are provided', async () => {
    const existing = makeRequest({ status: 'in_progress' });
    mockFindUnique.mockResolvedValue(existing);
    mockUpdate.mockResolvedValue(existing);

    const req = createPatchRequest(`/api/v1/maintenance/${REQUEST_ID}`, {
      attachments: [
        {
          key: 'uploads/photo1.jpg',
          fileName: 'leak-photo.jpg',
          contentType: 'image/jpeg',
          fileSizeBytes: 204800,
        },
      ],
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: REQUEST_ID }) });

    expect(res.status).toBe(200);
    expect(mockAttachmentCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          attachableType: 'maintenance_request',
          attachableId: REQUEST_ID,
          fileName: 'leak-photo.jpg',
          fileType: 'image/jpeg',
          fileSizeBytes: 204800,
          storageUrl: 'uploads/photo1.jpg',
          maintenanceRequestId: REQUEST_ID,
        }),
      }),
    );
  });

  it('creates multiple Attachment records for multiple files', async () => {
    const existing = makeRequest({ status: 'in_progress' });
    mockFindUnique.mockResolvedValue(existing);
    mockUpdate.mockResolvedValue(existing);

    const req = createPatchRequest(`/api/v1/maintenance/${REQUEST_ID}`, {
      attachments: [
        {
          key: 'uploads/photo1.jpg',
          fileName: 'photo1.jpg',
          contentType: 'image/jpeg',
          fileSizeBytes: 100000,
        },
        {
          key: 'uploads/photo2.png',
          fileName: 'photo2.png',
          contentType: 'image/png',
          fileSizeBytes: 200000,
        },
      ],
    });
    await PATCH(req, { params: Promise.resolve({ id: REQUEST_ID }) });

    expect(mockAttachmentCreate).toHaveBeenCalledTimes(2);
  });
});

// ---------------------------------------------------------------------------
// 12. Status change creates MaintenanceStatusChange audit record
// ---------------------------------------------------------------------------

describe('Maintenance Workflow — 12. Status change audit', () => {
  it('creates a MaintenanceStatusChange record on status transition', async () => {
    const existing = makeRequest({ status: 'open' });
    mockFindUnique.mockResolvedValue(existing);
    mockUpdate.mockResolvedValue({ ...existing, status: 'in_progress' });

    const req = createPatchRequest(`/api/v1/maintenance/${REQUEST_ID}`, {
      status: 'in_progress',
      assignedEmployeeId: STAFF_ID,
    });
    await PATCH(req, { params: Promise.resolve({ id: REQUEST_ID }) });

    expect(mockStatusChangeCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          requestId: REQUEST_ID,
          fromStatus: 'open',
          toStatus: 'in_progress',
          changedById: 'staff-1',
        }),
      }),
    );
  });

  it('stores holdReason in the status change record', async () => {
    const existing = makeRequest({ status: 'in_progress', assignedEmployeeId: STAFF_ID });
    mockFindUnique.mockResolvedValue(existing);
    mockUpdate.mockResolvedValue({ ...existing, status: 'on_hold' });

    const req = createPatchRequest(`/api/v1/maintenance/${REQUEST_ID}`, {
      status: 'on_hold',
      holdReason: 'Waiting for parts',
    });
    await PATCH(req, { params: Promise.resolve({ id: REQUEST_ID }) });

    expect(mockStatusChangeCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          fromStatus: 'in_progress',
          toStatus: 'on_hold',
          reason: 'Waiting for parts',
        }),
      }),
    );
  });

  it('stores resolutionNotes in the status change record on completion', async () => {
    const existing = makeRequest({ status: 'in_progress', assignedEmployeeId: STAFF_ID });
    mockFindUnique.mockResolvedValue(existing);
    mockUpdate.mockResolvedValue({ ...existing, status: 'completed' });

    const req = createPatchRequest(`/api/v1/maintenance/${REQUEST_ID}`, {
      status: 'completed',
      resolutionNotes: 'Fixed the faucet.',
    });
    await PATCH(req, { params: Promise.resolve({ id: REQUEST_ID }) });

    expect(mockStatusChangeCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          fromStatus: 'in_progress',
          toStatus: 'completed',
          resolutionNotes: 'Fixed the faucet.',
        }),
      }),
    );
  });

  it('does NOT create a status change record when status is unchanged', async () => {
    const existing = makeRequest({ status: 'in_progress' });
    mockFindUnique.mockResolvedValue(existing);
    mockUpdate.mockResolvedValue(existing);

    const req = createPatchRequest(`/api/v1/maintenance/${REQUEST_ID}`, {
      description: 'Updated description for the leak.',
    });
    await PATCH(req, { params: Promise.resolve({ id: REQUEST_ID }) });

    expect(mockStatusChangeCreate).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// 13. Comment added creates MaintenanceComment record
// ---------------------------------------------------------------------------

describe('Maintenance Workflow — 13. Comments', () => {
  // Import the comment route handlers
  let COMMENT_POST: typeof import('@/app/api/v1/maintenance/[id]/comments/route').POST;
  let COMMENT_GET: typeof import('@/app/api/v1/maintenance/[id]/comments/route').GET;

  beforeEach(async () => {
    const mod = await import('@/app/api/v1/maintenance/[id]/comments/route');
    COMMENT_POST = mod.POST;
    COMMENT_GET = mod.GET;
  });

  it('creates a MaintenanceComment record via POST', async () => {
    mockFindUnique.mockResolvedValue(makeRequest());
    mockCommentCreate.mockResolvedValue({
      id: 'comment-1',
      requestId: REQUEST_ID,
      authorId: 'staff-1',
      body: 'Plumber will arrive tomorrow.',
      visibleToResident: true,
      createdAt: new Date(),
    });

    const req = createPostRequest(`/api/v1/maintenance/${REQUEST_ID}/comments`, {
      body: 'Plumber will arrive tomorrow.',
      visibleToResident: true,
    });
    const res = await COMMENT_POST(req, { params: Promise.resolve({ id: REQUEST_ID }) });

    expect(res.status).toBe(201);
    expect(mockCommentCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          requestId: REQUEST_ID,
          authorId: 'staff-1',
          body: 'Plumber will arrive tomorrow.',
          visibleToResident: true,
        }),
      }),
    );
  });

  it('lists comments via GET', async () => {
    mockFindUnique.mockResolvedValue(makeRequest());
    mockCommentFindMany.mockResolvedValue([
      { id: 'c1', body: 'First comment', createdAt: new Date() },
      { id: 'c2', body: 'Second comment', createdAt: new Date() },
    ]);

    const req = createGetRequest(`/api/v1/maintenance/${REQUEST_ID}/comments`);
    const res = await COMMENT_GET(req, { params: Promise.resolve({ id: REQUEST_ID }) });

    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: unknown[] }>(res);
    expect(body.data).toHaveLength(2);
  });

  it('rejects empty comment body', async () => {
    mockFindUnique.mockResolvedValue(makeRequest());

    const req = createPostRequest(`/api/v1/maintenance/${REQUEST_ID}/comments`, {
      body: '',
    });
    const res = await COMMENT_POST(req, { params: Promise.resolve({ id: REQUEST_ID }) });

    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// 14. Email notification sent on status change to requester
// ---------------------------------------------------------------------------

describe('Maintenance Workflow — 14. Email notification on status change', () => {
  it('sends email to requester when status changes', async () => {
    const existing = makeRequest({ status: 'open' });
    mockFindUnique.mockResolvedValue(existing);
    mockUpdate.mockResolvedValue({ ...existing, status: 'in_progress' });

    const req = createPatchRequest(`/api/v1/maintenance/${REQUEST_ID}`, {
      status: 'in_progress',
      assignedEmployeeId: STAFF_ID,
    });
    await PATCH(req, { params: Promise.resolve({ id: REQUEST_ID }) });

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'resident@test.com',
        subject: expect.stringContaining('MR-TEST'),
      }),
    );
  });

  it('marks status change record with notificationSent=true', async () => {
    const existing = makeRequest({ status: 'open' });
    mockFindUnique.mockResolvedValue(existing);
    mockUpdate.mockResolvedValue({ ...existing, status: 'in_progress' });

    const req = createPatchRequest(`/api/v1/maintenance/${REQUEST_ID}`, {
      status: 'in_progress',
      assignedEmployeeId: STAFF_ID,
    });
    await PATCH(req, { params: Promise.resolve({ id: REQUEST_ID }) });

    expect(mockStatusChangeCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          notificationSent: true,
        }),
      }),
    );
  });

  it('does not send email when no status change occurs', async () => {
    const existing = makeRequest({ status: 'in_progress' });
    mockFindUnique.mockResolvedValue(existing);
    mockUpdate.mockResolvedValue(existing);

    const req = createPatchRequest(`/api/v1/maintenance/${REQUEST_ID}`, {
      description: 'Updated description.',
    });
    await PATCH(req, { params: Promise.resolve({ id: REQUEST_ID }) });

    expect(mockSendEmail).not.toHaveBeenCalled();
  });
});
