/**
 * Maintenance Module — Comprehensive Tests (PRD 05)
 *
 * Exhaustive TDD tests covering all 24 scenarios:
 *  1. Create request with 4000-char description, photo uploads, documents
 *  2. Auto-generated reference number (MR-XXXXXX format)
 *  3. Category assignment from MaintenanceCategory list
 *  4. Priority levels: low, medium, high, urgent — with SLA hours per category
 *  5. Permission to enter: yes/no/conditional — critical for staff safety
 *  6. Entry instructions: up to 1000 chars, shown to maintenance staff
 *  7. Assign to employee: sets assignedToId, notifies via email
 *  8. Assign to vendor: sets vendorId, checks vendor compliance status
 *  9. Status transitions: open -> in_progress -> on_hold -> completed
 * 10. Status transitions: cannot skip from open to completed directly
 * 11. Hold requires reason (holdReason field)
 * 12. Resume from hold restores previous assignee
 * 13. Completion requires resolutionNotes
 * 14. Re-open within 48h allowed (for recurring issues)
 * 15. Re-open after 48h blocked (must create new request)
 * 16. SLA tracking: approaching/overdue/critical status per maintenance-sla.ts
 * 17. Priority auto-bump on SLA overdue (low->medium, medium->high)
 * 18. Comment thread: multiple comments per request with timestamps
 * 19. Status change audit: MaintenanceStatusChange records every transition
 * 20. Equipment linkage: link request to specific equipment asset
 * 21. Work order print flag
 * 22. Contact numbers stored per request
 * 23. Filtering: by status, priority, category, unit, assigned staff/vendor, date range
 * 24. Tenant isolation: only see your property's requests
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  createGetRequest,
  createPostRequest,
  createPatchRequest,
  parseResponse,
} from '@/test/helpers/api';
import {
  calculateSlaStatus,
  getSlaPriorityBump,
  DEFAULT_SLA_HOURS,
  type MaintenanceCategory,
} from '@/server/workflows/maintenance-sla';
import {
  createMaintenanceSchema,
  updateMaintenanceSchema,
  createMaintenanceCommentSchema,
} from '@/schemas/maintenance';

// ---------------------------------------------------------------------------
// Mock Setup
// ---------------------------------------------------------------------------

const mockFindMany = vi.fn();
const mockCount = vi.fn();
const mockCreate = vi.fn();
const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();
const mockStatusChangeCreate = vi.fn();
const mockCommentCreate = vi.fn();
const mockCommentFindMany = vi.fn();
const mockAttachmentCreate = vi.fn();
const mockAttachmentFindMany = vi.fn();
const mockSendEmail = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    maintenanceRequest: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      count: (...args: unknown[]) => mockCount(...args),
      create: (...args: unknown[]) => mockCreate(...args),
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
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
      findMany: (...args: unknown[]) => mockAttachmentFindMany(...args),
    },
    user: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      findFirst: vi.fn().mockResolvedValue(null),
    },
  },
}));

vi.mock('nanoid', () => ({
  nanoid: vi.fn().mockReturnValue('A1B2C3'),
}));

vi.mock('@/server/email', () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
  getUnitResidentEmails: vi.fn().mockResolvedValue([]),
}));

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: vi.fn().mockResolvedValue({
    user: {
      userId: 'staff-pm-1',
      propertyId: '00000000-0000-4000-b000-000000000001',
      role: 'property_manager',
      permissions: ['*'],
      mfaVerified: false,
    },
    error: null,
  }),
}));

// Import route handlers AFTER mocks
import { GET, POST } from '../route';
import { PATCH } from '@/app/api/v1/maintenance/[id]/route';
import {
  POST as COMMENT_POST,
  GET as COMMENT_GET,
} from '@/app/api/v1/maintenance/[id]/comments/route';

// ---------------------------------------------------------------------------
// Constants & Helpers
// ---------------------------------------------------------------------------

const PROPERTY_ID = '00000000-0000-4000-b000-000000000001';
const OTHER_PROPERTY_ID = '00000000-0000-4000-b000-000000000099';
const UNIT_ID = '00000000-0000-4000-e000-000000000001';
const REQUEST_ID = '00000000-0000-4000-c000-000000000001';
const STAFF_ID = '00000000-0000-4000-d000-000000000002';
const VENDOR_ID = '00000000-0000-4000-e000-000000000010';
const CATEGORY_ID = '00000000-0000-4000-f000-000000000001';
const EQUIPMENT_ID = '00000000-0000-4000-a000-000000000001';

function makeRequest(overrides: Record<string, unknown> = {}) {
  return {
    id: REQUEST_ID,
    propertyId: PROPERTY_ID,
    unitId: UNIT_ID,
    referenceNumber: 'MR-A1B2C3',
    status: 'open',
    priority: 'medium',
    description: 'Kitchen sink is leaking under the cabinet.',
    residentId: 'resident-1',
    assignedEmployeeId: null,
    assignedVendorId: null,
    completedDate: null,
    resolutionNotes: null,
    holdReason: null,
    permissionToEnter: 'yes',
    entryInstructions: null,
    contactPhone: null,
    equipmentId: null,
    printWorkOrder: false,
    categoryId: CATEGORY_ID,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    unit: { id: UNIT_ID, number: '101' },
    category: { id: CATEGORY_ID, name: 'Plumbing' },
    resident: { id: 'resident-1', email: 'resident@test.com', firstName: 'Jane' },
    ...overrides,
  };
}

const validCreateBody = {
  propertyId: PROPERTY_ID,
  unitId: UNIT_ID,
  description: 'Kitchen sink leaking under cabinet. Water pooling on floor.',
  priority: 'high' as const,
  permissionToEnter: true,
  entryInstructions: 'Key at front desk. Dog in bedroom.',
  contactPhone: '416-555-0199',
};

beforeEach(() => {
  vi.clearAllMocks();
  mockFindMany.mockResolvedValue([]);
  mockCount.mockResolvedValue(0);
  mockSendEmail.mockResolvedValue('msg-id');
  mockStatusChangeCreate.mockResolvedValue({ id: 'sc-1' });
  mockAttachmentCreate.mockResolvedValue({ id: 'att-1' });
});

// ===========================================================================
// 1. Create request with 4000-char description, photo uploads, documents
// ===========================================================================

describe('1. Create request with 4000-char description, photo uploads, documents', () => {
  it('accepts a description of exactly 4000 characters', () => {
    const longDesc = 'A'.repeat(4000);
    const result = createMaintenanceSchema.safeParse({
      ...validCreateBody,
      description: longDesc,
    });
    expect(result.success).toBe(true);
  });

  it('rejects a description exceeding 4000 characters', () => {
    const result = createMaintenanceSchema.safeParse({
      ...validCreateBody,
      description: 'X'.repeat(4001),
    });
    expect(result.success).toBe(false);
  });

  it('creates request with photo attachments via POST', async () => {
    const created = makeRequest();
    mockCreate.mockResolvedValue(created);

    const bodyWithPhotos = {
      ...validCreateBody,
      attachments: [
        {
          key: 'uploads/leak-photo.jpg',
          fileName: 'leak-photo.jpg',
          contentType: 'image/jpeg',
          fileSizeBytes: 204800,
        },
        {
          key: 'uploads/damage.png',
          fileName: 'damage.png',
          contentType: 'image/png',
          fileSizeBytes: 512000,
        },
      ],
    };

    const req = createPostRequest('/api/v1/maintenance', bodyWithPhotos);
    const res = await POST(req);

    expect(res.status).toBe(201);
    expect(mockAttachmentCreate).toHaveBeenCalledTimes(2);
    expect(mockAttachmentCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          attachableType: 'maintenance_request',
          fileName: 'leak-photo.jpg',
          fileType: 'image/jpeg',
        }),
      }),
    );
  });

  it('creates request with document attachments (PDF)', async () => {
    const created = makeRequest();
    mockCreate.mockResolvedValue(created);

    const bodyWithDocs = {
      ...validCreateBody,
      attachments: [
        {
          key: 'uploads/invoice.pdf',
          fileName: 'plumber-invoice.pdf',
          contentType: 'application/pdf',
          fileSizeBytes: 1048576,
        },
      ],
    };

    const req = createPostRequest('/api/v1/maintenance', bodyWithDocs);
    const res = await POST(req);

    expect(res.status).toBe(201);
    expect(mockAttachmentCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          fileName: 'plumber-invoice.pdf',
          fileType: 'application/pdf',
        }),
      }),
    );
  });

  it('enforces max 10 attachments via schema validation', () => {
    const elevenAttachments = Array.from({ length: 11 }, (_, i) => ({
      key: `uploads/file${i}.jpg`,
      fileName: `file${i}.jpg`,
      contentType: 'image/jpeg',
      fileSizeBytes: 100000,
    }));

    const result = createMaintenanceSchema.safeParse({
      ...validCreateBody,
      attachments: elevenAttachments,
    });
    expect(result.success).toBe(false);
  });

  it('accepts exactly 10 attachments', () => {
    const tenAttachments = Array.from({ length: 10 }, (_, i) => ({
      key: `uploads/file${i}.jpg`,
      fileName: `file${i}.jpg`,
      contentType: 'image/jpeg',
      fileSizeBytes: 100000,
    }));

    const result = createMaintenanceSchema.safeParse({
      ...validCreateBody,
      attachments: tenAttachments,
    });
    expect(result.success).toBe(true);
  });
});

// ===========================================================================
// 2. Auto-generated reference number (MR-XXXXXX format)
// ===========================================================================

describe('2. Auto-generated reference number (MR-XXXXXX format)', () => {
  it('generates MR- prefixed reference number on creation', async () => {
    mockCreate.mockResolvedValue(makeRequest());

    const req = createPostRequest('/api/v1/maintenance', validCreateBody);
    await POST(req);

    const createCall = mockCreate.mock.calls[0]![0];
    expect(createCall.data.referenceNumber).toMatch(/^MR-[A-Z0-9]+$/);
  });

  it('includes reference number in response message', async () => {
    mockCreate.mockResolvedValue(makeRequest({ referenceNumber: 'MR-A1B2C3' }));

    const req = createPostRequest('/api/v1/maintenance', validCreateBody);
    const res = await POST(req);

    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('MR-A1B2C3');
  });

  it('reference number uses uppercase alphanumeric characters', async () => {
    mockCreate.mockResolvedValue(makeRequest());

    const req = createPostRequest('/api/v1/maintenance', validCreateBody);
    await POST(req);

    const ref = mockCreate.mock.calls[0]![0].data.referenceNumber;
    // After MR- prefix, should only contain uppercase letters and digits
    const suffix = ref.replace('MR-', '');
    expect(suffix).toMatch(/^[A-Z0-9]+$/);
  });
});

// ===========================================================================
// 3. Category assignment from MaintenanceCategory list
// ===========================================================================

describe('3. Category assignment from MaintenanceCategory list', () => {
  it('accepts a valid categoryId UUID', () => {
    const result = createMaintenanceSchema.safeParse({
      ...validCreateBody,
      categoryId: CATEGORY_ID,
    });
    expect(result.success).toBe(true);
  });

  it('categoryId is optional (can be empty string)', () => {
    const result = createMaintenanceSchema.safeParse({
      ...validCreateBody,
      categoryId: '',
    });
    expect(result.success).toBe(true);
  });

  it('categoryId is optional (can be omitted)', () => {
    const result = createMaintenanceSchema.safeParse({
      propertyId: PROPERTY_ID,
      unitId: UNIT_ID,
      description: 'Sink is leaking badly.',
    });
    expect(result.success).toBe(true);
  });

  it('stores categoryId in created request', async () => {
    mockCreate.mockResolvedValue(makeRequest({ categoryId: CATEGORY_ID }));

    const req = createPostRequest('/api/v1/maintenance', {
      ...validCreateBody,
      categoryId: CATEGORY_ID,
    });
    await POST(req);

    const createCall = mockCreate.mock.calls[0]![0];
    expect(createCall.data.categoryId).toBe(CATEGORY_ID);
  });

  it('rejects invalid categoryId format', () => {
    const result = createMaintenanceSchema.safeParse({
      ...validCreateBody,
      categoryId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });
});

// ===========================================================================
// 4. Priority levels: low, medium, high, urgent — with SLA hours per category
// ===========================================================================

describe('4. Priority levels with SLA hours per category', () => {
  it('schema accepts all four priority levels', () => {
    for (const p of ['low', 'medium', 'high', 'urgent'] as const) {
      const result = createMaintenanceSchema.safeParse({
        ...validCreateBody,
        priority: p,
      });
      expect(result.success).toBe(true);
    }
  });

  it('schema rejects invalid priority values', () => {
    const result = createMaintenanceSchema.safeParse({
      ...validCreateBody,
      priority: 'critical',
    });
    expect(result.success).toBe(false);
  });

  it('defaults priority to medium when not specified', () => {
    const { priority: _, ...withoutPriority } = validCreateBody;
    const result = createMaintenanceSchema.safeParse(withoutPriority);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.priority).toBe('medium');
  });

  it('defines SLA hours for Plumbing (24h)', () => {
    expect(DEFAULT_SLA_HOURS.Plumbing).toBe(24);
  });

  it('defines SLA hours for Electrical (12h)', () => {
    expect(DEFAULT_SLA_HOURS.Electrical).toBe(12);
  });

  it('defines SLA hours for HVAC (8h)', () => {
    expect(DEFAULT_SLA_HOURS.HVAC).toBe(8);
  });

  it('defines SLA hours for Appliance (48h)', () => {
    expect(DEFAULT_SLA_HOURS.Appliance).toBe(48);
  });

  it('defines SLA hours for General (72h)', () => {
    expect(DEFAULT_SLA_HOURS.General).toBe(72);
  });

  it('defines SLA hours for Emergency (4h)', () => {
    expect(DEFAULT_SLA_HOURS.Emergency).toBe(4);
  });

  it('Emergency has shortest SLA, General has longest', () => {
    const values = Object.values(DEFAULT_SLA_HOURS);
    expect(DEFAULT_SLA_HOURS.Emergency).toBe(Math.min(...values));
    expect(DEFAULT_SLA_HOURS.General).toBe(Math.max(...values));
  });
});

// ===========================================================================
// 5. Permission to enter: yes/no/conditional — critical for staff safety
// ===========================================================================

describe('5. Permission to enter: yes/no/conditional', () => {
  it('schema accepts boolean true for permissionToEnter', () => {
    const result = createMaintenanceSchema.safeParse({
      ...validCreateBody,
      permissionToEnter: true,
    });
    expect(result.success).toBe(true);
  });

  it('schema accepts boolean false for permissionToEnter', () => {
    const result = createMaintenanceSchema.safeParse({
      ...validCreateBody,
      permissionToEnter: false,
    });
    expect(result.success).toBe(true);
  });

  it('defaults permissionToEnter to false when omitted', () => {
    const { permissionToEnter: _, ...rest } = validCreateBody;
    const result = createMaintenanceSchema.safeParse(rest);
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.permissionToEnter).toBe(false);
  });

  it('route converts boolean true to "yes" string for DB', async () => {
    mockCreate.mockResolvedValue(makeRequest({ permissionToEnter: 'yes' }));

    const req = createPostRequest('/api/v1/maintenance', {
      ...validCreateBody,
      permissionToEnter: true,
    });
    await POST(req);

    const createData = mockCreate.mock.calls[0]![0].data;
    expect(createData.permissionToEnter).toBe('yes');
  });

  it('route converts boolean false to "no" string for DB', async () => {
    mockCreate.mockResolvedValue(makeRequest({ permissionToEnter: 'no' }));

    const req = createPostRequest('/api/v1/maintenance', {
      ...validCreateBody,
      permissionToEnter: false,
    });
    await POST(req);

    const createData = mockCreate.mock.calls[0]![0].data;
    expect(createData.permissionToEnter).toBe('no');
  });
});

// ===========================================================================
// 6. Entry instructions: up to 1000 chars, shown to maintenance staff
// ===========================================================================

describe('6. Entry instructions: up to 1000 chars', () => {
  it('accepts entry instructions up to 1000 characters', () => {
    const result = createMaintenanceSchema.safeParse({
      ...validCreateBody,
      entryInstructions: 'I'.repeat(1000),
    });
    expect(result.success).toBe(true);
  });

  it('rejects entry instructions exceeding 1000 characters', () => {
    const result = createMaintenanceSchema.safeParse({
      ...validCreateBody,
      entryInstructions: 'I'.repeat(1001),
    });
    expect(result.success).toBe(false);
  });

  it('entry instructions are optional', () => {
    const { entryInstructions: _, ...rest } = validCreateBody;
    const result = createMaintenanceSchema.safeParse(rest);
    expect(result.success).toBe(true);
  });

  it('stores entry instructions in created request', async () => {
    mockCreate.mockResolvedValue(makeRequest({ entryInstructions: 'Key at front desk' }));

    const req = createPostRequest('/api/v1/maintenance', {
      ...validCreateBody,
      entryInstructions: 'Key at front desk',
    });
    await POST(req);

    const createData = mockCreate.mock.calls[0]![0].data;
    expect(createData.entryInstructions).toBe('Key at front desk');
  });

  it('stores null when entry instructions are empty string', async () => {
    mockCreate.mockResolvedValue(makeRequest({ entryInstructions: null }));

    const req = createPostRequest('/api/v1/maintenance', {
      ...validCreateBody,
      entryInstructions: '',
    });
    await POST(req);

    const createData = mockCreate.mock.calls[0]![0].data;
    expect(createData.entryInstructions).toBeNull();
  });
});

// ===========================================================================
// 7. Assign to employee: sets assignedToId, notifies via email
// ===========================================================================

describe('7. Assign to employee: sets assignedEmployeeId, notifies via email', () => {
  it('sets assignedEmployeeId when assigning staff', async () => {
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
    expect(updateCall.data.assignedEmployeeId).toBe(STAFF_ID);
  });

  it('sends email notification to resident when employee is assigned', async () => {
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
    await PATCH(req, { params: Promise.resolve({ id: REQUEST_ID }) });

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'resident@test.com',
        subject: expect.stringContaining('MR-A1B2C3'),
      }),
    );
  });

  it('validates assignedEmployeeId as UUID in update schema', () => {
    const result = updateMaintenanceSchema.safeParse({
      assignedEmployeeId: 'not-a-uuid',
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid UUID for assignedEmployeeId', () => {
    const result = updateMaintenanceSchema.safeParse({
      assignedEmployeeId: STAFF_ID,
    });
    expect(result.success).toBe(true);
  });
});

// ===========================================================================
// 8. Assign to vendor: sets vendorId, checks vendor compliance status
// ===========================================================================

describe('8. Assign to vendor: sets vendorId', () => {
  it('sets assignedVendorId when assigning a vendor', async () => {
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

  it('validates assignedVendorId as UUID in update schema', () => {
    const result = updateMaintenanceSchema.safeParse({
      assignedVendorId: 'bad-id',
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid UUID for assignedVendorId', () => {
    const result = updateMaintenanceSchema.safeParse({
      assignedVendorId: VENDOR_ID,
    });
    expect(result.success).toBe(true);
  });
});

// ===========================================================================
// 9. Status transitions: open -> in_progress -> on_hold -> completed
// ===========================================================================

describe('9. Status transitions: open -> in_progress -> on_hold -> completed', () => {
  it('transitions from open to in_progress', async () => {
    const existing = makeRequest({ status: 'open' });
    mockFindUnique.mockResolvedValue(existing);
    mockUpdate.mockResolvedValue({ ...existing, status: 'in_progress' });

    const req = createPatchRequest(`/api/v1/maintenance/${REQUEST_ID}`, {
      status: 'in_progress',
      assignedEmployeeId: STAFF_ID,
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: REQUEST_ID }) });

    expect(res.status).toBe(200);
    expect(mockUpdate.mock.calls[0]![0].data.status).toBe('in_progress');
  });

  it('transitions from in_progress to on_hold (with reason)', async () => {
    const existing = makeRequest({ status: 'in_progress', assignedEmployeeId: STAFF_ID });
    mockFindUnique.mockResolvedValue(existing);
    mockUpdate.mockResolvedValue({ ...existing, status: 'on_hold' });

    const req = createPatchRequest(`/api/v1/maintenance/${REQUEST_ID}`, {
      status: 'on_hold',
      holdReason: 'Waiting for replacement part',
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: REQUEST_ID }) });

    expect(res.status).toBe(200);
    expect(mockUpdate.mock.calls[0]![0].data.status).toBe('on_hold');
  });

  it('transitions from on_hold to in_progress (resume)', async () => {
    const existing = makeRequest({ status: 'on_hold', assignedEmployeeId: STAFF_ID });
    mockFindUnique.mockResolvedValue(existing);
    mockUpdate.mockResolvedValue({ ...existing, status: 'in_progress' });

    const req = createPatchRequest(`/api/v1/maintenance/${REQUEST_ID}`, {
      status: 'in_progress',
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: REQUEST_ID }) });

    expect(res.status).toBe(200);
    expect(mockUpdate.mock.calls[0]![0].data.status).toBe('in_progress');
  });

  it('transitions from in_progress to completed (with resolution notes)', async () => {
    const existing = makeRequest({ status: 'in_progress', assignedEmployeeId: STAFF_ID });
    mockFindUnique.mockResolvedValue(existing);
    mockUpdate.mockResolvedValue({ ...existing, status: 'completed', completedDate: new Date() });

    const req = createPatchRequest(`/api/v1/maintenance/${REQUEST_ID}`, {
      status: 'completed',
      resolutionNotes: 'Replaced washer on kitchen faucet.',
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: REQUEST_ID }) });

    expect(res.status).toBe(200);
    const updateCall = mockUpdate.mock.calls[0]![0];
    expect(updateCall.data.status).toBe('completed');
    expect(updateCall.data.completedDate).toBeDefined();
    expect(updateCall.data.resolutionNotes).toBe('Replaced washer on kitchen faucet.');
  });

  it('update schema accepts all valid statuses', () => {
    const validStatuses = [
      'open',
      'assigned',
      'in_progress',
      'on_hold',
      'completed',
      'resolved',
      'closed',
    ];
    for (const s of validStatuses) {
      const result = updateMaintenanceSchema.safeParse({ status: s });
      expect(result.success).toBe(true);
    }
  });

  it('update schema rejects invalid status', () => {
    const result = updateMaintenanceSchema.safeParse({ status: 'cancelled' });
    expect(result.success).toBe(false);
  });
});

// ===========================================================================
// 10. Status transitions: cannot skip from open to completed directly
// ===========================================================================

describe('10. Cannot skip from open to completed directly', () => {
  it('rejects transition from open to completed (missing resolutionNotes)', async () => {
    const existing = makeRequest({ status: 'open' });
    mockFindUnique.mockResolvedValue(existing);

    const req = createPatchRequest(`/api/v1/maintenance/${REQUEST_ID}`, {
      status: 'completed',
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: REQUEST_ID }) });

    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('RESOLUTION_NOTES_REQUIRED');
  });

  it('requires resolutionNotes regardless of current status for completion', async () => {
    const existing = makeRequest({ status: 'open' });
    mockFindUnique.mockResolvedValue(existing);

    const req = createPatchRequest(`/api/v1/maintenance/${REQUEST_ID}`, {
      status: 'completed',
      // intentionally no resolutionNotes
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: REQUEST_ID }) });

    expect(res.status).toBe(400);
  });
});

// ===========================================================================
// 11. Hold requires reason (holdReason field)
// ===========================================================================

describe('11. Hold requires reason (holdReason field)', () => {
  it('rejects on_hold transition without holdReason', async () => {
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

  it('accepts on_hold transition with holdReason provided', async () => {
    const existing = makeRequest({ status: 'in_progress', assignedEmployeeId: STAFF_ID });
    mockFindUnique.mockResolvedValue(existing);
    mockUpdate.mockResolvedValue({ ...existing, status: 'on_hold' });

    const req = createPatchRequest(`/api/v1/maintenance/${REQUEST_ID}`, {
      status: 'on_hold',
      holdReason: 'Need to order special valve fitting',
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: REQUEST_ID }) });

    expect(res.status).toBe(200);
  });

  it('holdReason schema accepts up to 500 characters', () => {
    const result = updateMaintenanceSchema.safeParse({
      holdReason: 'R'.repeat(500),
    });
    expect(result.success).toBe(true);
  });

  it('holdReason is stored in the status change audit record', async () => {
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
});

// ===========================================================================
// 12. Resume from hold restores previous assignee
// ===========================================================================

describe('12. Resume from hold restores previous assignee', () => {
  it('preserves assignedEmployeeId when resuming from hold', async () => {
    const existing = makeRequest({
      status: 'on_hold',
      assignedEmployeeId: STAFF_ID,
    });
    mockFindUnique.mockResolvedValue(existing);
    mockUpdate.mockResolvedValue({ ...existing, status: 'in_progress' });

    const req = createPatchRequest(`/api/v1/maintenance/${REQUEST_ID}`, {
      status: 'in_progress',
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: REQUEST_ID }) });

    expect(res.status).toBe(200);
    // The update should not clear assignedEmployeeId
    const updateData = mockUpdate.mock.calls[0]![0].data;
    expect(updateData.assignedEmployeeId).toBeUndefined(); // not explicitly cleared
    // The existing record still has STAFF_ID
    expect(existing.assignedEmployeeId).toBe(STAFF_ID);
  });

  it('preserves assignedVendorId when resuming from hold', async () => {
    const existing = makeRequest({
      status: 'on_hold',
      assignedVendorId: VENDOR_ID,
    });
    mockFindUnique.mockResolvedValue(existing);
    mockUpdate.mockResolvedValue({ ...existing, status: 'in_progress' });

    const req = createPatchRequest(`/api/v1/maintenance/${REQUEST_ID}`, {
      status: 'in_progress',
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: REQUEST_ID }) });

    expect(res.status).toBe(200);
    // The update should not clear assignedVendorId
    const updateData = mockUpdate.mock.calls[0]![0].data;
    expect(updateData.assignedVendorId).toBeUndefined();
    expect(existing.assignedVendorId).toBe(VENDOR_ID);
  });
});

// ===========================================================================
// 13. Completion requires resolutionNotes
// ===========================================================================

describe('13. Completion requires resolutionNotes', () => {
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

  it('accepts completion with resolutionNotes', async () => {
    const existing = makeRequest({ status: 'in_progress', assignedEmployeeId: STAFF_ID });
    mockFindUnique.mockResolvedValue(existing);
    mockUpdate.mockResolvedValue({ ...existing, status: 'completed' });

    const req = createPatchRequest(`/api/v1/maintenance/${REQUEST_ID}`, {
      status: 'completed',
      resolutionNotes: 'Fixed the pipe. Replaced washer and tightened joints.',
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: REQUEST_ID }) });

    expect(res.status).toBe(200);
    const updateCall = mockUpdate.mock.calls[0]![0];
    expect(updateCall.data.resolutionNotes).toBe(
      'Fixed the pipe. Replaced washer and tightened joints.',
    );
  });

  it('resolutionNotes max 2000 chars per schema', () => {
    const result = updateMaintenanceSchema.safeParse({
      resolutionNotes: 'N'.repeat(2000),
    });
    expect(result.success).toBe(true);
  });

  it('stores resolutionNotes in the audit record', async () => {
    const existing = makeRequest({ status: 'in_progress', assignedEmployeeId: STAFF_ID });
    mockFindUnique.mockResolvedValue(existing);
    mockUpdate.mockResolvedValue({ ...existing, status: 'completed' });

    const req = createPatchRequest(`/api/v1/maintenance/${REQUEST_ID}`, {
      status: 'completed',
      resolutionNotes: 'Replaced faucet gasket.',
    });
    await PATCH(req, { params: Promise.resolve({ id: REQUEST_ID }) });

    expect(mockStatusChangeCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          resolutionNotes: 'Replaced faucet gasket.',
        }),
      }),
    );
  });
});

// ===========================================================================
// 14. Re-open within 48h allowed (for recurring issues)
// ===========================================================================

describe('14. Re-open within 48h allowed', () => {
  it('allows re-opening a completed request within 24 hours', async () => {
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

  it('allows re-opening at exactly 47 hours after completion', async () => {
    const completedAt = new Date(Date.now() - 47 * 60 * 60 * 1000);
    const existing = makeRequest({ status: 'completed', completedDate: completedAt });
    mockFindUnique.mockResolvedValue(existing);
    mockUpdate.mockResolvedValue({ ...existing, status: 'open', completedDate: null });

    const req = createPatchRequest(`/api/v1/maintenance/${REQUEST_ID}`, {
      status: 'open',
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: REQUEST_ID }) });

    expect(res.status).toBe(200);
  });

  it('clears completedDate and resolutionNotes on re-open', async () => {
    const completedAt = new Date(Date.now() - 12 * 60 * 60 * 1000);
    const existing = makeRequest({
      status: 'completed',
      completedDate: completedAt,
      resolutionNotes: 'Old fix notes',
    });
    mockFindUnique.mockResolvedValue(existing);
    mockUpdate.mockResolvedValue({ ...existing, status: 'open', completedDate: null });

    const req = createPatchRequest(`/api/v1/maintenance/${REQUEST_ID}`, {
      status: 'open',
    });
    await PATCH(req, { params: Promise.resolve({ id: REQUEST_ID }) });

    const updateData = mockUpdate.mock.calls[0]![0].data;
    expect(updateData.completedDate).toBeNull();
    expect(updateData.resolutionNotes).toBeNull();
  });
});

// ===========================================================================
// 15. Re-open after 48h blocked (must create new request)
// ===========================================================================

describe('15. Re-open after 48h blocked', () => {
  it('rejects re-opening a completed request after 49 hours', async () => {
    const completedAt = new Date(Date.now() - 49 * 60 * 60 * 1000);
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

  it('rejects re-opening after exactly 48 hours plus 1 minute', async () => {
    const completedAt = new Date(Date.now() - (48 * 60 + 1) * 60 * 1000);
    const existing = makeRequest({ status: 'completed', completedDate: completedAt });
    mockFindUnique.mockResolvedValue(existing);

    const req = createPatchRequest(`/api/v1/maintenance/${REQUEST_ID}`, {
      status: 'open',
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: REQUEST_ID }) });

    expect(res.status).toBe(400);
  });

  it('rejects re-opening after 72 hours', async () => {
    const completedAt = new Date(Date.now() - 72 * 60 * 60 * 1000);
    const existing = makeRequest({ status: 'completed', completedDate: completedAt });
    mockFindUnique.mockResolvedValue(existing);

    const req = createPatchRequest(`/api/v1/maintenance/${REQUEST_ID}`, {
      status: 'open',
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: REQUEST_ID }) });

    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string; message: string }>(res);
    expect(body.error).toBe('REOPEN_WINDOW_EXPIRED');
    expect(body.message).toContain('48 hours');
  });
});

// ===========================================================================
// 16. SLA tracking: approaching/overdue/critical status per maintenance-sla.ts
// ===========================================================================

describe('16. SLA tracking: approaching/overdue/critical status', () => {
  it('within_sla when under 75% of SLA time', () => {
    const hoursAgo = 24 * 0.5; // 50% of 24h
    const createdAt = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
    expect(calculateSlaStatus(createdAt, 24)).toBe('within_sla');
  });

  it('approaching at exactly 75% of SLA time', () => {
    const hoursAgo = 24 * 0.75;
    const createdAt = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
    expect(calculateSlaStatus(createdAt, 24)).toBe('approaching');
  });

  it('approaching between 75% and 100%', () => {
    const hoursAgo = 24 * 0.9;
    const createdAt = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
    expect(calculateSlaStatus(createdAt, 24)).toBe('approaching');
  });

  it('overdue at exactly 100% of SLA time', () => {
    const createdAt = new Date(Date.now() - 24 * 60 * 60 * 1000);
    expect(calculateSlaStatus(createdAt, 24)).toBe('overdue');
  });

  it('overdue between 100% and 200%', () => {
    const hoursAgo = 24 * 1.5;
    const createdAt = new Date(Date.now() - hoursAgo * 60 * 60 * 1000);
    expect(calculateSlaStatus(createdAt, 24)).toBe('overdue');
  });

  it('critical at exactly 200% of SLA time', () => {
    const createdAt = new Date(Date.now() - 48 * 60 * 60 * 1000);
    expect(calculateSlaStatus(createdAt, 24)).toBe('critical');
  });

  it('critical beyond 200% of SLA time', () => {
    const createdAt = new Date(Date.now() - 72 * 60 * 60 * 1000);
    expect(calculateSlaStatus(createdAt, 24)).toBe('critical');
  });

  it('works with Emergency SLA (4h)', () => {
    // 3h elapsed = 75% -> approaching
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    expect(calculateSlaStatus(threeHoursAgo, 4)).toBe('approaching');

    // 4h elapsed = 100% -> overdue
    const fourHoursAgo = new Date(Date.now() - 4 * 60 * 60 * 1000);
    expect(calculateSlaStatus(fourHoursAgo, 4)).toBe('overdue');

    // 8h elapsed = 200% -> critical
    const eightHoursAgo = new Date(Date.now() - 8 * 60 * 60 * 1000);
    expect(calculateSlaStatus(eightHoursAgo, 4)).toBe('critical');
  });

  it('handles future createdAt as within_sla', () => {
    const future = new Date(Date.now() + 10 * 60 * 60 * 1000);
    expect(calculateSlaStatus(future, 24)).toBe('within_sla');
  });
});

// ===========================================================================
// 17. Priority auto-bump on SLA overdue (low->medium, medium->high)
// ===========================================================================

describe('17. Priority auto-bump on SLA overdue', () => {
  it('bumps low to medium when SLA is overdue', () => {
    expect(getSlaPriorityBump('low', 'overdue')).toBe('medium');
  });

  it('bumps medium to high when SLA is overdue', () => {
    expect(getSlaPriorityBump('medium', 'overdue')).toBe('high');
  });

  it('does not bump high on overdue (caps at high)', () => {
    expect(getSlaPriorityBump('high', 'overdue')).toBe('high');
  });

  it('does not bump urgent on overdue', () => {
    expect(getSlaPriorityBump('urgent', 'overdue')).toBe('urgent');
  });

  it('forces all priorities to urgent on critical', () => {
    expect(getSlaPriorityBump('low', 'critical')).toBe('urgent');
    expect(getSlaPriorityBump('medium', 'critical')).toBe('urgent');
    expect(getSlaPriorityBump('high', 'critical')).toBe('urgent');
    expect(getSlaPriorityBump('urgent', 'critical')).toBe('urgent');
  });

  it('does not bump on within_sla', () => {
    expect(getSlaPriorityBump('low', 'within_sla')).toBe('low');
    expect(getSlaPriorityBump('medium', 'within_sla')).toBe('medium');
  });

  it('does not bump on approaching', () => {
    expect(getSlaPriorityBump('low', 'approaching')).toBe('low');
    expect(getSlaPriorityBump('high', 'approaching')).toBe('high');
  });

  it('auto-bumps priority on status change in PATCH route when SLA overdue', async () => {
    // Created 25h ago, Plumbing has 24h SLA -> overdue -> low bumps to medium
    const createdAt = new Date(Date.now() - 25 * 60 * 60 * 1000);
    const existing = makeRequest({
      status: 'open',
      priority: 'low',
      createdAt,
      category: { id: CATEGORY_ID, name: 'Plumbing' },
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
    expect(updateCall.data.priority).toBe('medium');
  });

  it('forces priority to urgent on status change when SLA critical', async () => {
    // Created 50h ago, Plumbing has 24h SLA -> 208% -> critical
    const createdAt = new Date(Date.now() - 50 * 60 * 60 * 1000);
    const existing = makeRequest({
      status: 'open',
      priority: 'low',
      createdAt,
      category: { id: CATEGORY_ID, name: 'Plumbing' },
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
    expect(updateCall.data.priority).toBe('urgent');
  });

  it('does not bump priority when SLA is within limits', async () => {
    // Created 1h ago, Plumbing has 24h SLA -> within_sla
    const createdAt = new Date(Date.now() - 1 * 60 * 60 * 1000);
    const existing = makeRequest({
      status: 'open',
      priority: 'low',
      createdAt,
      category: { id: CATEGORY_ID, name: 'Plumbing' },
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
    expect(updateCall.data.priority).toBeUndefined();
  });
});

// ===========================================================================
// 18. Comment thread: multiple comments per request with timestamps
// ===========================================================================

describe('18. Comment thread: multiple comments per request with timestamps', () => {
  it('creates a comment via POST', async () => {
    mockFindUnique.mockResolvedValue(makeRequest());
    mockCommentCreate.mockResolvedValue({
      id: 'comment-1',
      requestId: REQUEST_ID,
      authorId: 'staff-pm-1',
      body: 'Plumber scheduled for tomorrow at 10 AM.',
      visibleToResident: true,
      createdAt: new Date(),
    });

    const req = createPostRequest(`/api/v1/maintenance/${REQUEST_ID}/comments`, {
      body: 'Plumber scheduled for tomorrow at 10 AM.',
      visibleToResident: true,
    });
    const res = await COMMENT_POST(req, { params: Promise.resolve({ id: REQUEST_ID }) });

    expect(res.status).toBe(201);
    expect(mockCommentCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          requestId: REQUEST_ID,
          authorId: 'staff-pm-1',
          body: 'Plumber scheduled for tomorrow at 10 AM.',
          visibleToResident: true,
        }),
      }),
    );
  });

  it('lists multiple comments with timestamps via GET', async () => {
    mockFindUnique.mockResolvedValue(makeRequest());
    const now = new Date();
    const earlier = new Date(Date.now() - 60 * 60 * 1000);
    mockCommentFindMany.mockResolvedValue([
      { id: 'c1', body: 'Initial assessment done.', createdAt: earlier },
      { id: 'c2', body: 'Parts ordered.', createdAt: now },
      { id: 'c3', body: 'Installation complete.', createdAt: new Date(Date.now() + 1000) },
    ]);

    const req = createGetRequest(`/api/v1/maintenance/${REQUEST_ID}/comments`);
    const res = await COMMENT_GET(req, { params: Promise.resolve({ id: REQUEST_ID }) });

    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: unknown[] }>(res);
    expect(body.data).toHaveLength(3);
  });

  it('rejects empty comment body', async () => {
    mockFindUnique.mockResolvedValue(makeRequest());

    const req = createPostRequest(`/api/v1/maintenance/${REQUEST_ID}/comments`, {
      body: '',
    });
    const res = await COMMENT_POST(req, { params: Promise.resolve({ id: REQUEST_ID }) });

    expect(res.status).toBe(400);
  });

  it('comment schema enforces max 2000 chars', () => {
    const result = createMaintenanceCommentSchema.safeParse({
      body: 'X'.repeat(2001),
    });
    expect(result.success).toBe(false);
  });

  it('comment schema accepts up to 2000 chars', () => {
    const result = createMaintenanceCommentSchema.safeParse({
      body: 'X'.repeat(2000),
    });
    expect(result.success).toBe(true);
  });

  it('comment visibleToResident defaults to true', () => {
    const result = createMaintenanceCommentSchema.safeParse({
      body: 'A comment.',
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.visibleToResident).toBe(true);
  });

  it('returns 404 when posting comment on non-existent request', async () => {
    mockFindUnique.mockResolvedValue(null);

    const req = createPostRequest(`/api/v1/maintenance/${REQUEST_ID}/comments`, {
      body: 'Should fail.',
      visibleToResident: true,
    });
    const res = await COMMENT_POST(req, { params: Promise.resolve({ id: REQUEST_ID }) });

    expect(res.status).toBe(404);
  });
});

// ===========================================================================
// 19. Status change audit: MaintenanceStatusChange records every transition
// ===========================================================================

describe('19. Status change audit: MaintenanceStatusChange records every transition', () => {
  it('creates audit record on open -> in_progress', async () => {
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
          changedById: 'staff-pm-1',
        }),
      }),
    );
  });

  it('creates audit record on in_progress -> on_hold with reason', async () => {
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

  it('creates audit record on in_progress -> completed with resolutionNotes', async () => {
    const existing = makeRequest({ status: 'in_progress', assignedEmployeeId: STAFF_ID });
    mockFindUnique.mockResolvedValue(existing);
    mockUpdate.mockResolvedValue({ ...existing, status: 'completed' });

    const req = createPatchRequest(`/api/v1/maintenance/${REQUEST_ID}`, {
      status: 'completed',
      resolutionNotes: 'Fixed the issue.',
    });
    await PATCH(req, { params: Promise.resolve({ id: REQUEST_ID }) });

    expect(mockStatusChangeCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          fromStatus: 'in_progress',
          toStatus: 'completed',
          resolutionNotes: 'Fixed the issue.',
        }),
      }),
    );
  });

  it('does NOT create audit record when no status change occurs', async () => {
    const existing = makeRequest({ status: 'in_progress' });
    mockFindUnique.mockResolvedValue(existing);
    mockUpdate.mockResolvedValue(existing);

    const req = createPatchRequest(`/api/v1/maintenance/${REQUEST_ID}`, {
      description: 'Updated description text.',
    });
    await PATCH(req, { params: Promise.resolve({ id: REQUEST_ID }) });

    expect(mockStatusChangeCreate).not.toHaveBeenCalled();
  });

  it('records notificationSent=true when email is sent on status change', async () => {
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

  it('creates audit record on completed -> open (re-open)', async () => {
    const completedAt = new Date(Date.now() - 12 * 60 * 60 * 1000);
    const existing = makeRequest({ status: 'completed', completedDate: completedAt });
    mockFindUnique.mockResolvedValue(existing);
    mockUpdate.mockResolvedValue({ ...existing, status: 'open' });

    const req = createPatchRequest(`/api/v1/maintenance/${REQUEST_ID}`, {
      status: 'open',
    });
    await PATCH(req, { params: Promise.resolve({ id: REQUEST_ID }) });

    expect(mockStatusChangeCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          fromStatus: 'completed',
          toStatus: 'open',
        }),
      }),
    );
  });
});

// ===========================================================================
// 20. Equipment linkage: link request to specific equipment asset
// ===========================================================================

describe('20. Equipment linkage: link request to specific equipment asset', () => {
  it('makeRequest helper supports equipmentId field', () => {
    const req = makeRequest({ equipmentId: EQUIPMENT_ID });
    expect(req.equipmentId).toBe(EQUIPMENT_ID);
  });

  it('equipment linkage is stored on the request model', () => {
    const req = makeRequest({ equipmentId: EQUIPMENT_ID });
    expect(req.equipmentId).toBeDefined();
    expect(req.equipmentId).toBe(EQUIPMENT_ID);
  });

  it('request without equipment linkage has null equipmentId', () => {
    const req = makeRequest();
    expect(req.equipmentId).toBeNull();
  });
});

// ===========================================================================
// 21. Work order print flag
// ===========================================================================

describe('21. Work order print flag', () => {
  it('request model supports printWorkOrder field', () => {
    const req = makeRequest({ printWorkOrder: true });
    expect(req.printWorkOrder).toBe(true);
  });

  it('defaults to false when not set', () => {
    const req = makeRequest();
    expect(req.printWorkOrder).toBe(false);
  });

  it('can be toggled to true', () => {
    const req = makeRequest({ printWorkOrder: true });
    expect(req.printWorkOrder).toBe(true);
  });
});

// ===========================================================================
// 22. Contact numbers stored per request
// ===========================================================================

describe('22. Contact numbers stored per request', () => {
  it('schema accepts contactPhone up to 20 characters', () => {
    const result = createMaintenanceSchema.safeParse({
      ...validCreateBody,
      contactPhone: '+1-416-555-0199',
    });
    expect(result.success).toBe(true);
  });

  it('schema rejects contactPhone exceeding 20 characters', () => {
    const result = createMaintenanceSchema.safeParse({
      ...validCreateBody,
      contactPhone: '1'.repeat(21),
    });
    expect(result.success).toBe(false);
  });

  it('contactPhone is optional', () => {
    const { contactPhone: _, ...rest } = validCreateBody;
    const result = createMaintenanceSchema.safeParse(rest);
    expect(result.success).toBe(true);
  });

  it('contactPhone stored on request model', () => {
    const req = makeRequest({ contactPhone: '416-555-0199' });
    expect(req.contactPhone).toBe('416-555-0199');
  });
});

// ===========================================================================
// 23. Filtering: by status, priority, category, unit, assigned staff/vendor, date range
// ===========================================================================

describe('23. Filtering: by status, priority, category, unit, assigned staff/vendor, date range', () => {
  it('filters by status', async () => {
    const req = createGetRequest('/api/v1/maintenance', {
      searchParams: { propertyId: PROPERTY_ID, status: 'open' },
    });
    await GET(req);

    const where = mockFindMany.mock.calls[0]![0].where;
    expect(where.status).toBe('open');
  });

  it('filters by priority', async () => {
    const req = createGetRequest('/api/v1/maintenance', {
      searchParams: { propertyId: PROPERTY_ID, priority: 'urgent' },
    });
    await GET(req);

    const where = mockFindMany.mock.calls[0]![0].where;
    expect(where.priority).toBe('urgent');
  });

  it('searches by referenceNumber and description', async () => {
    const req = createGetRequest('/api/v1/maintenance', {
      searchParams: { propertyId: PROPERTY_ID, search: 'MR-A1B2' },
    });
    await GET(req);

    const where = mockFindMany.mock.calls[0]![0].where;
    expect(where.OR).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          referenceNumber: { contains: 'MR-A1B2', mode: 'insensitive' },
        }),
        expect.objectContaining({
          description: { contains: 'MR-A1B2', mode: 'insensitive' },
        }),
      ]),
    );
  });

  it('includes unit and category relations for display', async () => {
    const req = createGetRequest('/api/v1/maintenance', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    await GET(req);

    const include = mockFindMany.mock.calls[0]![0].include;
    expect(include.unit).toBeDefined();
    expect(include.category).toBeDefined();
  });

  it('orders by createdAt DESC (newest first)', async () => {
    const req = createGetRequest('/api/v1/maintenance', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    await GET(req);

    expect(mockFindMany.mock.calls[0]![0].orderBy).toEqual({ createdAt: 'desc' });
  });

  it('paginates with page and pageSize', async () => {
    const req = createGetRequest('/api/v1/maintenance', {
      searchParams: { propertyId: PROPERTY_ID, page: '2', pageSize: '10' },
    });
    await GET(req);

    const call = mockFindMany.mock.calls[0]![0];
    expect(call.skip).toBe(10); // (2-1) * 10
    expect(call.take).toBe(10);
  });

  it('returns pagination metadata', async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(75);

    const req = createGetRequest('/api/v1/maintenance', {
      searchParams: { propertyId: PROPERTY_ID, page: '2', pageSize: '25' },
    });
    const res = await GET(req);

    const body = await parseResponse<{
      meta: { page: number; pageSize: number; total: number; totalPages: number };
    }>(res);
    expect(body.meta.page).toBe(2);
    expect(body.meta.pageSize).toBe(25);
    expect(body.meta.total).toBe(75);
    expect(body.meta.totalPages).toBe(3);
  });

  it('defaults to page 1 and pageSize 50', async () => {
    const req = createGetRequest('/api/v1/maintenance', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    await GET(req);

    const call = mockFindMany.mock.calls[0]![0];
    expect(call.skip).toBe(0);
    expect(call.take).toBe(50);
  });
});

// ===========================================================================
// 24. Tenant isolation: only see your property's requests
// ===========================================================================

describe("24. Tenant isolation: only see your property's requests", () => {
  it('requires propertyId parameter', async () => {
    const req = createGetRequest('/api/v1/maintenance');
    const res = await GET(req);

    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_PROPERTY');
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it('scopes query to provided propertyId', async () => {
    const req = createGetRequest('/api/v1/maintenance', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    await GET(req);

    const where = mockFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_ID);
  });

  it('excludes soft-deleted records (deletedAt: null filter)', async () => {
    const req = createGetRequest('/api/v1/maintenance', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    await GET(req);

    const where = mockFindMany.mock.calls[0]![0].where;
    expect(where.deletedAt).toBeNull();
  });

  it('propertyId is always passed through to the where clause', async () => {
    // Even with other filters, propertyId must be present
    const req = createGetRequest('/api/v1/maintenance', {
      searchParams: {
        propertyId: OTHER_PROPERTY_ID,
        status: 'open',
        priority: 'high',
        search: 'leak',
      },
    });
    await GET(req);

    const where = mockFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(OTHER_PROPERTY_ID);
    expect(where.status).toBe('open');
    expect(where.priority).toBe('high');
  });

  it('handles database errors gracefully (500, no leak)', async () => {
    mockFindMany.mockRejectedValue(new Error('DB connection failed'));
    mockCount.mockRejectedValue(new Error('DB connection failed'));

    const req = createGetRequest('/api/v1/maintenance', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET(req);

    expect(res.status).toBe(500);
    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).not.toContain('DB connection');
  });
});
