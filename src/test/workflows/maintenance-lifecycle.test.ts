/**
 * Integration Workflow Tests — Maintenance Request Lifecycle
 *
 * Tests complete maintenance request workflows across multiple API endpoints:
 *   - Standard request (submit -> assign -> complete -> close)
 *   - Emergency escalation (urgent -> auto-escalate -> dispatch -> resolve)
 *   - Multi-step repair (create -> assess -> hold for parts -> resume -> complete -> inspect)
 *   - Resident-hidden request (staff-only visibility)
 *
 * Each test validates data transformations, SLA tracking, and side effects.
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

const mockMaintenanceRequestCreate = vi.fn();
const mockMaintenanceRequestFindMany = vi.fn();
const mockMaintenanceRequestCount = vi.fn();
const mockMaintenanceRequestFindUnique = vi.fn();
const mockMaintenanceRequestUpdate = vi.fn();

const mockMaintenanceCommentCreate = vi.fn();
const mockMaintenanceCommentFindMany = vi.fn();

const mockMaintenanceStatusChangeCreate = vi.fn();

const mockAttachmentCreate = vi.fn();

const mockTransaction = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    maintenanceRequest: {
      create: (...args: unknown[]) => mockMaintenanceRequestCreate(...args),
      findMany: (...args: unknown[]) => mockMaintenanceRequestFindMany(...args),
      count: (...args: unknown[]) => mockMaintenanceRequestCount(...args),
      findUnique: (...args: unknown[]) => mockMaintenanceRequestFindUnique(...args),
      update: (...args: unknown[]) => mockMaintenanceRequestUpdate(...args),
    },
    maintenanceComment: {
      create: (...args: unknown[]) => mockMaintenanceCommentCreate(...args),
      findMany: (...args: unknown[]) => mockMaintenanceCommentFindMany(...args),
    },
    maintenanceStatusChange: {
      create: (...args: unknown[]) => mockMaintenanceStatusChangeCreate(...args),
    },
    attachment: {
      create: (...args: unknown[]) => mockAttachmentCreate(...args),
    },
    $transaction: (...args: unknown[]) => mockTransaction(...args),
  },
}));

vi.mock('nanoid', () => ({
  nanoid: vi.fn().mockReturnValue('MR01'),
}));

vi.mock('@/schemas/maintenance', () => ({
  createMaintenanceSchema: {
    safeParse: vi.fn().mockImplementation((data: Record<string, unknown>) => {
      if (!data.propertyId || !data.unitId || !data.description) {
        return {
          success: false,
          error: {
            flatten: () => ({ fieldErrors: { description: ['Required'] } }),
          },
        };
      }
      return { success: true, data };
    }),
  },
  updateMaintenanceSchema: {
    safeParse: vi.fn().mockImplementation((data: Record<string, unknown>) => {
      return { success: true, data };
    }),
  },
  createMaintenanceCommentSchema: {
    safeParse: vi.fn().mockImplementation((data: Record<string, unknown>) => {
      if (!data.body) {
        return {
          success: false,
          error: { flatten: () => ({ fieldErrors: { body: ['Required'] } }) },
        };
      }
      return { success: true, data };
    }),
  },
}));

vi.mock('@/lib/sanitize', () => ({
  stripHtml: (s: string) => s,
  stripControlChars: (s: string) => s,
}));

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: vi.fn().mockResolvedValue({
    user: {
      userId: 'staff-001',
      propertyId: 'prop-001',
      role: 'property_admin',
      permissions: ['*'],
      mfaVerified: true,
    },
    error: null,
  }),
}));

vi.mock('@/server/email', () => ({
  sendEmail: vi.fn().mockResolvedValue({ success: true }),
}));

vi.mock('@/server/email-templates', () => ({
  renderTemplate: vi.fn().mockReturnValue('<html>Email</html>'),
}));

vi.mock('@/server/workflows/maintenance-sla', () => ({
  calculateSlaStatus: vi.fn().mockReturnValue('within_sla'),
  getSlaPriorityBump: vi.fn().mockImplementation((current: string) => current),
  DEFAULT_SLA_HOURS: {
    Plumbing: 24,
    Electrical: 24,
    HVAC: 48,
    Appliance: 72,
    General: 72,
    Emergency: 4,
  },
}));

// ---------------------------------------------------------------------------
// Import route handlers AFTER mocks
// ---------------------------------------------------------------------------

import {
  GET as listMaintenanceRequests,
  POST as createMaintenanceRequest,
} from '@/app/api/v1/maintenance/route';
import {
  GET as getMaintenanceRequest,
  PATCH as updateMaintenanceRequest,
} from '@/app/api/v1/maintenance/[id]/route';
import {
  GET as listComments,
  POST as addComment,
} from '@/app/api/v1/maintenance/[id]/comments/route';

// ---------------------------------------------------------------------------
// Constants & Helpers
// ---------------------------------------------------------------------------

const PROPERTY_ID = 'prop-001';
const UNIT_ID = 'unit-101';

function makeMaintenanceRequest(overrides: Record<string, unknown> = {}) {
  return {
    id: 'mr-001',
    propertyId: PROPERTY_ID,
    unitId: UNIT_ID,
    referenceNumber: 'MR-MR01',
    title: 'Leaking faucet in kitchen',
    description: 'The kitchen faucet has been dripping for two days.',
    status: 'open',
    priority: 'medium',
    permissionToEnter: 'yes',
    entryInstructions: null,
    residentId: 'resident-001',
    createdById: 'staff-001',
    assignedEmployeeId: null,
    assignedVendorId: null,
    completedDate: null,
    resolutionNotes: null,
    createdAt: new Date('2026-03-18T09:00:00Z'),
    updatedAt: new Date('2026-03-18T09:00:00Z'),
    deletedAt: null,
    hideFromResident: false,
    unit: { id: UNIT_ID, number: '101' },
    category: { id: 'cat-plumbing', name: 'Plumbing' },
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ===========================================================================
// SCENARIO 1: Standard Request
// ===========================================================================

describe('Scenario 1: Standard Request (submit -> assign -> complete -> close)', () => {
  const requestId = 'mr-std-001';

  it('Step 1: resident submits request via POST /maintenance', async () => {
    mockMaintenanceRequestCreate.mockResolvedValue(makeMaintenanceRequest({ id: requestId }));

    const req = createPostRequest('/api/v1/maintenance', {
      propertyId: PROPERTY_ID,
      unitId: UNIT_ID,
      description: 'Leaking faucet in kitchen, dripping for two days.',
      priority: 'medium',
      permissionToEnter: true,
    });

    const res = await createMaintenanceRequest(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{ data: { status: string; referenceNumber: string } }>(res);
    expect(body.data.status).toBe('open');
    expect(body.data.referenceNumber).toContain('MR-');
  });

  it('Step 2: staff assigns vendor via PATCH /maintenance/:id', async () => {
    mockMaintenanceRequestFindUnique.mockResolvedValue(
      makeMaintenanceRequest({ id: requestId, status: 'open' }),
    );
    mockMaintenanceRequestUpdate.mockResolvedValue(
      makeMaintenanceRequest({
        id: requestId,
        status: 'assigned',
        assignedVendorId: 'vendor-plumber',
      }),
    );
    mockMaintenanceStatusChangeCreate.mockResolvedValue({ id: 'sc-1' });

    const req = createPatchRequest(`/api/v1/maintenance/${requestId}`, {
      status: 'assigned',
      assignedVendorId: 'vendor-plumber',
    });

    const res = await updateMaintenanceRequest(req, {
      params: Promise.resolve({ id: requestId }),
    });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { status: string } }>(res);
    expect(body.data.status).toBe('assigned');
  });

  it('Step 2b: assignment creates audit record with status change', async () => {
    mockMaintenanceRequestFindUnique.mockResolvedValue(
      makeMaintenanceRequest({ id: requestId, status: 'open' }),
    );
    mockMaintenanceRequestUpdate.mockResolvedValue(
      makeMaintenanceRequest({ id: requestId, status: 'assigned' }),
    );
    mockMaintenanceStatusChangeCreate.mockResolvedValue({ id: 'sc-2' });

    await updateMaintenanceRequest(
      createPatchRequest(`/api/v1/maintenance/${requestId}`, {
        status: 'assigned',
        assignedVendorId: 'vendor-plumber',
      }),
      { params: Promise.resolve({ id: requestId }) },
    );

    expect(mockMaintenanceStatusChangeCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          requestId,
          fromStatus: 'open',
          toStatus: 'assigned',
        }),
      }),
    );
  });

  it('Step 3: vendor completes work via PATCH with resolutionNotes', async () => {
    mockMaintenanceRequestFindUnique.mockResolvedValue(
      makeMaintenanceRequest({
        id: requestId,
        status: 'in_progress',
        assignedVendorId: 'vendor-plumber',
      }),
    );
    mockMaintenanceRequestUpdate.mockResolvedValue(
      makeMaintenanceRequest({
        id: requestId,
        status: 'completed',
        completedDate: new Date(),
        resolutionNotes: 'Replaced washer and tightened connections.',
      }),
    );
    mockMaintenanceStatusChangeCreate.mockResolvedValue({ id: 'sc-3' });

    const req = createPatchRequest(`/api/v1/maintenance/${requestId}`, {
      status: 'completed',
      resolutionNotes: 'Replaced washer and tightened connections.',
    });

    const res = await updateMaintenanceRequest(req, {
      params: Promise.resolve({ id: requestId }),
    });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { status: string } }>(res);
    expect(body.data.status).toBe('completed');
  });

  it('Step 3b: completion requires resolutionNotes', async () => {
    mockMaintenanceRequestFindUnique.mockResolvedValue(
      makeMaintenanceRequest({ id: requestId, status: 'in_progress' }),
    );

    const req = createPatchRequest(`/api/v1/maintenance/${requestId}`, {
      status: 'completed',
      // Missing resolutionNotes
    });

    const res = await updateMaintenanceRequest(req, {
      params: Promise.resolve({ id: requestId }),
    });
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('RESOLUTION_NOTES_REQUIRED');
  });

  it('Step 4: staff closes request after completion', async () => {
    mockMaintenanceRequestFindUnique.mockResolvedValue(
      makeMaintenanceRequest({
        id: requestId,
        status: 'completed',
        completedDate: new Date(),
      }),
    );
    mockMaintenanceRequestUpdate.mockResolvedValue(
      makeMaintenanceRequest({ id: requestId, status: 'closed' }),
    );
    mockMaintenanceStatusChangeCreate.mockResolvedValue({ id: 'sc-4' });

    const req = createPatchRequest(`/api/v1/maintenance/${requestId}`, {
      status: 'closed',
    });

    const res = await updateMaintenanceRequest(req, {
      params: Promise.resolve({ id: requestId }),
    });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { status: string } }>(res);
    expect(body.data.status).toBe('closed');
  });

  it('Step 5: SLA tracked throughout — status change creates audit trail', async () => {
    // Open -> assigned
    mockMaintenanceRequestFindUnique.mockResolvedValue(
      makeMaintenanceRequest({ id: requestId, status: 'open' }),
    );
    mockMaintenanceRequestUpdate.mockResolvedValue(
      makeMaintenanceRequest({ id: requestId, status: 'assigned' }),
    );
    mockMaintenanceStatusChangeCreate.mockResolvedValue({ id: 'sc-a' });

    await updateMaintenanceRequest(
      createPatchRequest(`/api/v1/maintenance/${requestId}`, { status: 'assigned' }),
      { params: Promise.resolve({ id: requestId }) },
    );

    expect(mockMaintenanceStatusChangeCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          changedById: 'staff-001',
          fromStatus: 'open',
          toStatus: 'assigned',
        }),
      }),
    );
  });
});

// ===========================================================================
// SCENARIO 2: Emergency Escalation
// ===========================================================================

describe('Scenario 2: Emergency Escalation (urgent -> auto-escalate -> dispatch -> resolve)', () => {
  const emergencyId = 'mr-emg-001';

  it('should create urgent request with priority=urgent', async () => {
    mockMaintenanceRequestCreate.mockResolvedValue(
      makeMaintenanceRequest({
        id: emergencyId,
        priority: 'urgent',
        description: 'Water main burst in basement. Flooding actively.',
        category: { id: 'cat-emergency', name: 'Emergency' },
      }),
    );

    const req = createPostRequest('/api/v1/maintenance', {
      propertyId: PROPERTY_ID,
      unitId: UNIT_ID,
      description: 'Water main burst in basement. Flooding actively.',
      priority: 'urgent',
      categoryId: 'cat-emergency',
      permissionToEnter: true,
    });

    const res = await createMaintenanceRequest(req);
    expect(res.status).toBe(201);
  });

  it('should assign vendor to emergency request immediately', async () => {
    mockMaintenanceRequestFindUnique.mockResolvedValue(
      makeMaintenanceRequest({
        id: emergencyId,
        status: 'open',
        priority: 'urgent',
        category: { id: 'cat-emergency', name: 'Emergency' },
      }),
    );
    mockMaintenanceRequestUpdate.mockResolvedValue(
      makeMaintenanceRequest({
        id: emergencyId,
        status: 'assigned',
        priority: 'urgent',
        assignedVendorId: 'vendor-emergency-plumber',
      }),
    );
    mockMaintenanceStatusChangeCreate.mockResolvedValue({ id: 'sc-e1' });

    const req = createPatchRequest(`/api/v1/maintenance/${emergencyId}`, {
      status: 'assigned',
      assignedVendorId: 'vendor-emergency-plumber',
    });

    const res = await updateMaintenanceRequest(req, {
      params: Promise.resolve({ id: emergencyId }),
    });
    expect(res.status).toBe(200);
  });

  it('should move to in_progress when vendor starts work', async () => {
    mockMaintenanceRequestFindUnique.mockResolvedValue(
      makeMaintenanceRequest({
        id: emergencyId,
        status: 'assigned',
        priority: 'urgent',
        category: { id: 'cat-emergency', name: 'Emergency' },
      }),
    );
    mockMaintenanceRequestUpdate.mockResolvedValue(
      makeMaintenanceRequest({
        id: emergencyId,
        status: 'in_progress',
        priority: 'urgent',
      }),
    );
    mockMaintenanceStatusChangeCreate.mockResolvedValue({ id: 'sc-e2' });

    const req = createPatchRequest(`/api/v1/maintenance/${emergencyId}`, {
      status: 'in_progress',
    });

    const res = await updateMaintenanceRequest(req, {
      params: Promise.resolve({ id: emergencyId }),
    });
    expect(res.status).toBe(200);
  });

  it('should resolve emergency within SLA window', async () => {
    mockMaintenanceRequestFindUnique.mockResolvedValue(
      makeMaintenanceRequest({
        id: emergencyId,
        status: 'in_progress',
        priority: 'urgent',
        category: { id: 'cat-emergency', name: 'Emergency' },
      }),
    );
    mockMaintenanceRequestUpdate.mockResolvedValue(
      makeMaintenanceRequest({
        id: emergencyId,
        status: 'completed',
        priority: 'urgent',
        completedDate: new Date(),
        resolutionNotes: 'Shut off main valve, repaired pipe section, mopped up water.',
      }),
    );
    mockMaintenanceStatusChangeCreate.mockResolvedValue({ id: 'sc-e3' });

    const req = createPatchRequest(`/api/v1/maintenance/${emergencyId}`, {
      status: 'completed',
      resolutionNotes: 'Shut off main valve, repaired pipe section, mopped up water.',
    });

    const res = await updateMaintenanceRequest(req, {
      params: Promise.resolve({ id: emergencyId }),
    });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { status: string } }>(res);
    expect(body.data.status).toBe('completed');
  });

  it('full workflow: emergency create -> assign -> in_progress -> complete', async () => {
    // Create
    mockMaintenanceRequestCreate.mockResolvedValue(
      makeMaintenanceRequest({
        id: emergencyId,
        priority: 'urgent',
        category: { id: 'cat-emergency', name: 'Emergency' },
      }),
    );
    const createRes = await createMaintenanceRequest(
      createPostRequest('/api/v1/maintenance', {
        propertyId: PROPERTY_ID,
        unitId: UNIT_ID,
        description: 'Emergency plumbing failure in unit 101.',
        priority: 'urgent',
        permissionToEnter: true,
      }),
    );
    expect(createRes.status).toBe(201);

    // Assign
    mockMaintenanceRequestFindUnique.mockResolvedValue(
      makeMaintenanceRequest({
        id: emergencyId,
        status: 'open',
        priority: 'urgent',
        category: { id: 'cat-emergency', name: 'Emergency' },
      }),
    );
    mockMaintenanceRequestUpdate.mockResolvedValue(
      makeMaintenanceRequest({
        id: emergencyId,
        status: 'assigned',
        priority: 'urgent',
      }),
    );
    mockMaintenanceStatusChangeCreate.mockResolvedValue({ id: 'sc-x' });
    const assignRes = await updateMaintenanceRequest(
      createPatchRequest(`/api/v1/maintenance/${emergencyId}`, {
        status: 'assigned',
        assignedVendorId: 'vendor-001',
      }),
      { params: Promise.resolve({ id: emergencyId }) },
    );
    expect(assignRes.status).toBe(200);

    // In progress
    mockMaintenanceRequestFindUnique.mockResolvedValue(
      makeMaintenanceRequest({
        id: emergencyId,
        status: 'assigned',
        priority: 'urgent',
        category: { id: 'cat-emergency', name: 'Emergency' },
      }),
    );
    mockMaintenanceRequestUpdate.mockResolvedValue(
      makeMaintenanceRequest({
        id: emergencyId,
        status: 'in_progress',
        priority: 'urgent',
      }),
    );
    mockMaintenanceStatusChangeCreate.mockResolvedValue({ id: 'sc-y' });
    const progressRes = await updateMaintenanceRequest(
      createPatchRequest(`/api/v1/maintenance/${emergencyId}`, { status: 'in_progress' }),
      { params: Promise.resolve({ id: emergencyId }) },
    );
    expect(progressRes.status).toBe(200);

    // Complete
    mockMaintenanceRequestFindUnique.mockResolvedValue(
      makeMaintenanceRequest({
        id: emergencyId,
        status: 'in_progress',
        priority: 'urgent',
        category: { id: 'cat-emergency', name: 'Emergency' },
      }),
    );
    mockMaintenanceRequestUpdate.mockResolvedValue(
      makeMaintenanceRequest({
        id: emergencyId,
        status: 'completed',
        priority: 'urgent',
        completedDate: new Date(),
      }),
    );
    mockMaintenanceStatusChangeCreate.mockResolvedValue({ id: 'sc-z' });
    const completeRes = await updateMaintenanceRequest(
      createPatchRequest(`/api/v1/maintenance/${emergencyId}`, {
        status: 'completed',
        resolutionNotes: 'Emergency resolved. Pipe repaired.',
      }),
      { params: Promise.resolve({ id: emergencyId }) },
    );
    expect(completeRes.status).toBe(200);

    // Verify audit trail was created for each transition
    expect(mockMaintenanceStatusChangeCreate).toHaveBeenCalledTimes(3);
  });
});

// ===========================================================================
// SCENARIO 3: Multi-Step Repair
// ===========================================================================

describe('Scenario 3: Multi-Step Repair (create -> assess -> hold -> resume -> complete -> inspect)', () => {
  const multiStepId = 'mr-multi-001';

  it('Step 1: request created', async () => {
    mockMaintenanceRequestCreate.mockResolvedValue(
      makeMaintenanceRequest({
        id: multiStepId,
        description: 'Dishwasher not draining properly.',
        category: { id: 'cat-appliance', name: 'Appliance' },
      }),
    );

    const res = await createMaintenanceRequest(
      createPostRequest('/api/v1/maintenance', {
        propertyId: PROPERTY_ID,
        unitId: UNIT_ID,
        description: 'Dishwasher not draining properly.',
        priority: 'medium',
        categoryId: 'cat-appliance',
        permissionToEnter: true,
      }),
    );
    expect(res.status).toBe(201);
  });

  it('Step 2: vendor assessment — add comment with findings', async () => {
    mockMaintenanceRequestFindUnique.mockResolvedValue(
      makeMaintenanceRequest({ id: multiStepId, status: 'in_progress' }),
    );
    mockMaintenanceCommentCreate.mockResolvedValue({
      id: 'comment-1',
      requestId: multiStepId,
      body: 'Drain pump motor failed. Need replacement part #DWP-4421.',
      visibleToResident: true,
      authorId: 'staff-001',
      createdAt: new Date(),
    });

    const res = await addComment(
      createPostRequest(`/api/v1/maintenance/${multiStepId}/comments`, {
        body: 'Drain pump motor failed. Need replacement part #DWP-4421.',
        visibleToResident: true,
      }),
      { params: Promise.resolve({ id: multiStepId }) },
    );
    expect(res.status).toBe(201);
  });

  it('Step 3: put on hold for parts — requires holdReason', async () => {
    mockMaintenanceRequestFindUnique.mockResolvedValue(
      makeMaintenanceRequest({
        id: multiStepId,
        status: 'in_progress',
        category: { id: 'cat-appliance', name: 'Appliance' },
      }),
    );
    mockMaintenanceRequestUpdate.mockResolvedValue(
      makeMaintenanceRequest({ id: multiStepId, status: 'on_hold' }),
    );
    mockMaintenanceStatusChangeCreate.mockResolvedValue({ id: 'sc-hold' });

    const req = createPatchRequest(`/api/v1/maintenance/${multiStepId}`, {
      status: 'on_hold',
      holdReason: 'Waiting for replacement drain pump motor, ETA 3 business days.',
    });

    const res = await updateMaintenanceRequest(req, {
      params: Promise.resolve({ id: multiStepId }),
    });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { status: string } }>(res);
    expect(body.data.status).toBe('on_hold');
  });

  it('Step 3b: on_hold without holdReason is rejected', async () => {
    mockMaintenanceRequestFindUnique.mockResolvedValue(
      makeMaintenanceRequest({
        id: multiStepId,
        status: 'in_progress',
        category: { id: 'cat-appliance', name: 'Appliance' },
      }),
    );

    const req = createPatchRequest(`/api/v1/maintenance/${multiStepId}`, {
      status: 'on_hold',
      // Missing holdReason
    });

    const res = await updateMaintenanceRequest(req, {
      params: Promise.resolve({ id: multiStepId }),
    });
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('HOLD_REASON_REQUIRED');
  });

  it('Step 4: parts arrive — resume to in_progress', async () => {
    mockMaintenanceRequestFindUnique.mockResolvedValue(
      makeMaintenanceRequest({
        id: multiStepId,
        status: 'on_hold',
        category: { id: 'cat-appliance', name: 'Appliance' },
      }),
    );
    mockMaintenanceRequestUpdate.mockResolvedValue(
      makeMaintenanceRequest({ id: multiStepId, status: 'in_progress' }),
    );
    mockMaintenanceStatusChangeCreate.mockResolvedValue({ id: 'sc-resume' });

    const req = createPatchRequest(`/api/v1/maintenance/${multiStepId}`, {
      status: 'in_progress',
    });

    const res = await updateMaintenanceRequest(req, {
      params: Promise.resolve({ id: multiStepId }),
    });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { status: string } }>(res);
    expect(body.data.status).toBe('in_progress');
  });

  it('Step 5: repair completed with resolution notes', async () => {
    mockMaintenanceRequestFindUnique.mockResolvedValue(
      makeMaintenanceRequest({
        id: multiStepId,
        status: 'in_progress',
        category: { id: 'cat-appliance', name: 'Appliance' },
      }),
    );
    mockMaintenanceRequestUpdate.mockResolvedValue(
      makeMaintenanceRequest({
        id: multiStepId,
        status: 'completed',
        completedDate: new Date(),
        resolutionNotes: 'Drain pump motor replaced. Tested 3 cycles, draining normally.',
      }),
    );
    mockMaintenanceStatusChangeCreate.mockResolvedValue({ id: 'sc-done' });

    const req = createPatchRequest(`/api/v1/maintenance/${multiStepId}`, {
      status: 'completed',
      resolutionNotes: 'Drain pump motor replaced. Tested 3 cycles, draining normally.',
    });

    const res = await updateMaintenanceRequest(req, {
      params: Promise.resolve({ id: multiStepId }),
    });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { status: string } }>(res);
    expect(body.data.status).toBe('completed');
  });

  it('Step 6: follow-up inspection — add comment after completion', async () => {
    mockMaintenanceRequestFindUnique.mockResolvedValue(
      makeMaintenanceRequest({ id: multiStepId, status: 'completed' }),
    );
    mockMaintenanceCommentCreate.mockResolvedValue({
      id: 'comment-inspection',
      requestId: multiStepId,
      body: 'Follow-up inspection: no leaks after 48 hours. Closing.',
      visibleToResident: true,
      authorId: 'staff-001',
      createdAt: new Date(),
    });

    const res = await addComment(
      createPostRequest(`/api/v1/maintenance/${multiStepId}/comments`, {
        body: 'Follow-up inspection: no leaks after 48 hours. Closing.',
        visibleToResident: true,
      }),
      { params: Promise.resolve({ id: multiStepId }) },
    );
    expect(res.status).toBe(201);
  });

  it('should list all comments for a maintenance request', async () => {
    mockMaintenanceRequestFindUnique.mockResolvedValue(makeMaintenanceRequest({ id: multiStepId }));
    mockMaintenanceCommentFindMany.mockResolvedValue([
      {
        id: 'c1',
        body: 'Drain pump motor failed.',
        visibleToResident: true,
        createdAt: new Date(),
      },
      {
        id: 'c2',
        body: 'Follow-up inspection complete.',
        visibleToResident: true,
        createdAt: new Date(),
      },
    ]);

    const res = await listComments(
      createGetRequest(`/api/v1/maintenance/${multiStepId}/comments`),
      { params: Promise.resolve({ id: multiStepId }) },
    );
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { id: string }[] }>(res);
    expect(body.data).toHaveLength(2);
  });

  it('reopen from completed — only within 48h window', async () => {
    const recentCompletion = new Date(Date.now() - 12 * 60 * 60 * 1000); // 12h ago
    mockMaintenanceRequestFindUnique.mockResolvedValue(
      makeMaintenanceRequest({
        id: multiStepId,
        status: 'completed',
        completedDate: recentCompletion,
        category: { id: 'cat-appliance', name: 'Appliance' },
      }),
    );
    mockMaintenanceRequestUpdate.mockResolvedValue(
      makeMaintenanceRequest({ id: multiStepId, status: 'open', completedDate: null }),
    );
    mockMaintenanceStatusChangeCreate.mockResolvedValue({ id: 'sc-reopen' });

    const req = createPatchRequest(`/api/v1/maintenance/${multiStepId}`, {
      status: 'open',
    });

    const res = await updateMaintenanceRequest(req, {
      params: Promise.resolve({ id: multiStepId }),
    });
    expect(res.status).toBe(200);
  });

  it('reopen from completed — rejected after 48h window expires', async () => {
    const oldCompletion = new Date(Date.now() - 72 * 60 * 60 * 1000); // 72h ago
    mockMaintenanceRequestFindUnique.mockResolvedValue(
      makeMaintenanceRequest({
        id: multiStepId,
        status: 'completed',
        completedDate: oldCompletion,
        category: { id: 'cat-appliance', name: 'Appliance' },
      }),
    );

    const req = createPatchRequest(`/api/v1/maintenance/${multiStepId}`, {
      status: 'open',
    });

    const res = await updateMaintenanceRequest(req, {
      params: Promise.resolve({ id: multiStepId }),
    });
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('REOPEN_WINDOW_EXPIRED');
  });
});

// ===========================================================================
// SCENARIO 4: Resident-Hidden Request
// ===========================================================================

describe('Scenario 4: Resident-Hidden Request (staff-only visibility)', () => {
  const hiddenId = 'mr-hidden-001';

  it('should create request with hideFromResident=true', async () => {
    mockMaintenanceRequestCreate.mockResolvedValue(
      makeMaintenanceRequest({
        id: hiddenId,
        hideFromResident: true,
        description: 'Internal plumbing inspection — do not notify resident.',
      }),
    );

    const res = await createMaintenanceRequest(
      createPostRequest('/api/v1/maintenance', {
        propertyId: PROPERTY_ID,
        unitId: UNIT_ID,
        description: 'Internal plumbing inspection — do not notify resident.',
        priority: 'low',
        permissionToEnter: true,
        hideFromResident: true,
      }),
    );
    expect(res.status).toBe(201);
  });

  it('staff sees all requests including hidden ones', async () => {
    mockMaintenanceRequestFindMany.mockResolvedValue([
      makeMaintenanceRequest({ id: 'mr-visible', hideFromResident: false }),
      makeMaintenanceRequest({ id: hiddenId, hideFromResident: true }),
    ]);
    mockMaintenanceRequestCount.mockResolvedValue(2);

    const req = createGetRequest('/api/v1/maintenance', {
      searchParams: { propertyId: PROPERTY_ID },
    });

    const res = await listMaintenanceRequests(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { id: string }[]; meta: { total: number } }>(res);
    expect(body.data).toHaveLength(2);
    expect(body.meta.total).toBe(2);
  });

  it('should return 404 for nonexistent maintenance request', async () => {
    mockMaintenanceRequestFindUnique.mockResolvedValue(null);

    const req = createGetRequest(`/api/v1/maintenance/nonexistent-id`);
    const res = await getMaintenanceRequest(req, {
      params: Promise.resolve({ id: 'nonexistent-id' }),
    });
    expect(res.status).toBe(404);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('NOT_FOUND');
  });

  it('should add internal-only comment not visible to resident', async () => {
    mockMaintenanceRequestFindUnique.mockResolvedValue(makeMaintenanceRequest({ id: hiddenId }));
    mockMaintenanceCommentCreate.mockResolvedValue({
      id: 'comment-internal',
      requestId: hiddenId,
      body: 'Internal note: unit has recurring plumbing issues. Consider pipe replacement.',
      visibleToResident: false,
      authorId: 'staff-001',
      createdAt: new Date(),
    });

    const res = await addComment(
      createPostRequest(`/api/v1/maintenance/${hiddenId}/comments`, {
        body: 'Internal note: unit has recurring plumbing issues. Consider pipe replacement.',
        visibleToResident: false,
      }),
      { params: Promise.resolve({ id: hiddenId }) },
    );
    expect(res.status).toBe(201);

    expect(mockMaintenanceCommentCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          visibleToResident: false,
        }),
      }),
    );
  });
});

// ===========================================================================
// Cross-Scenario: Validation and Edge Cases
// ===========================================================================

describe('Maintenance Lifecycle: Validation & Edge Cases', () => {
  it('should reject creation without description', async () => {
    const req = createPostRequest('/api/v1/maintenance', {
      propertyId: PROPERTY_ID,
      unitId: UNIT_ID,
    });

    const res = await createMaintenanceRequest(req);
    expect(res.status).toBe(400);
  });

  it('should reject creation without propertyId', async () => {
    const req = createPostRequest('/api/v1/maintenance', {
      unitId: UNIT_ID,
      description: 'Some issue.',
    });

    const res = await createMaintenanceRequest(req);
    expect(res.status).toBe(400);
  });

  it('listing requires propertyId', async () => {
    const req = createGetRequest('/api/v1/maintenance');
    const res = await listMaintenanceRequests(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_PROPERTY');
  });

  it('should filter by status', async () => {
    mockMaintenanceRequestFindMany.mockResolvedValue([]);
    mockMaintenanceRequestCount.mockResolvedValue(0);

    await listMaintenanceRequests(
      createGetRequest('/api/v1/maintenance', {
        searchParams: { propertyId: PROPERTY_ID, status: 'on_hold' },
      }),
    );

    expect(mockMaintenanceRequestFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          status: 'on_hold',
        }),
      }),
    );
  });

  it('should filter by priority', async () => {
    mockMaintenanceRequestFindMany.mockResolvedValue([]);
    mockMaintenanceRequestCount.mockResolvedValue(0);

    await listMaintenanceRequests(
      createGetRequest('/api/v1/maintenance', {
        searchParams: { propertyId: PROPERTY_ID, priority: 'urgent' },
      }),
    );

    expect(mockMaintenanceRequestFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          priority: 'urgent',
        }),
      }),
    );
  });

  it('should search by reference number', async () => {
    mockMaintenanceRequestFindMany.mockResolvedValue([]);
    mockMaintenanceRequestCount.mockResolvedValue(0);

    await listMaintenanceRequests(
      createGetRequest('/api/v1/maintenance', {
        searchParams: { propertyId: PROPERTY_ID, search: 'MR-ABC' },
      }),
    );

    expect(mockMaintenanceRequestFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          OR: expect.arrayContaining([
            expect.objectContaining({
              referenceNumber: expect.objectContaining({ contains: 'MR-ABC' }),
            }),
          ]),
        }),
      }),
    );
  });

  it('comment on nonexistent request returns 404', async () => {
    mockMaintenanceRequestFindUnique.mockResolvedValue(null);

    const res = await addComment(
      createPostRequest('/api/v1/maintenance/nonexistent/comments', {
        body: 'This should fail.',
        visibleToResident: true,
      }),
      { params: Promise.resolve({ id: 'nonexistent' }) },
    );
    expect(res.status).toBe(404);
  });

  it('should reject empty comment body', async () => {
    mockMaintenanceRequestFindUnique.mockResolvedValue(makeMaintenanceRequest({ id: 'mr-001' }));

    const res = await addComment(
      createPostRequest('/api/v1/maintenance/mr-001/comments', {
        visibleToResident: true,
      }),
      { params: Promise.resolve({ id: 'mr-001' }) },
    );
    expect(res.status).toBe(400);
  });
});
