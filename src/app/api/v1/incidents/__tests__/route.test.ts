/**
 * Incidents API Route Tests — per PRD 03
 *
 * Covers:
 * - GET /api/v1/incidents/:id/updates (fetch incident details)
 * - POST /api/v1/incidents/:id/updates (add update)
 * - POST /api/v1/incidents/:id/escalate (escalate incident)
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createGetRequest, createPostRequest, parseResponse } from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Mock Setup
// ---------------------------------------------------------------------------

const mockEventFindUnique = vi.fn();
const mockEventUpdate = vi.fn();
const mockUserPropertyFindMany = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    event: {
      findUnique: (...args: unknown[]) => mockEventFindUnique(...args),
      update: (...args: unknown[]) => mockEventUpdate(...args),
    },
    userProperty: {
      findMany: (...args: unknown[]) => mockUserPropertyFindMany(...args),
    },
  },
}));

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: vi.fn().mockResolvedValue({
    user: {
      userId: 'test-staff',
      propertyId: '00000000-0000-4000-b000-000000000001',
      role: 'security',
      permissions: ['*'],
      mfaVerified: false,
    },
    error: null,
  }),
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

import { GET as GET_UPDATES, POST as POST_UPDATE } from '../[id]/updates/route';
import { POST as POST_ESCALATE } from '../[id]/escalate/route';

const PROPERTY_A = '00000000-0000-4000-b000-000000000001';

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// GET /api/v1/incidents/:id/updates — Fetch Incident
// ---------------------------------------------------------------------------

describe('GET /api/v1/incidents/:id/updates — Fetch', () => {
  it('returns 404 for non-existent incident', async () => {
    mockEventFindUnique.mockResolvedValue(null);
    const req = createGetRequest('/api/v1/incidents/nonexistent/updates');
    const res = await GET_UPDATES(req, { params: Promise.resolve({ id: 'nonexistent' }) });
    expect(res.status).toBe(404);
  });

  it('returns incident details when found', async () => {
    mockEventFindUnique.mockResolvedValue({
      id: 'incident-1',
      title: 'Fire alarm triggered',
      description: 'False alarm in lobby',
      customFields: {},
      createdAt: new Date(),
    });
    const req = createGetRequest('/api/v1/incidents/incident-1/updates');
    const res = await GET_UPDATES(req, { params: Promise.resolve({ id: 'incident-1' }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { title: string } }>(res);
    expect(body.data.title).toBe('Fire alarm triggered');
  });

  it('selects only necessary fields for performance', async () => {
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

// ---------------------------------------------------------------------------
// POST /api/v1/incidents/:id/updates — Add Update
// ---------------------------------------------------------------------------

describe('POST /api/v1/incidents/:id/updates — Validation', () => {
  it('rejects empty body', async () => {
    const req = createPostRequest('/api/v1/incidents/i1/updates', {});
    const res = await POST_UPDATE(req, { params: Promise.resolve({ id: 'i1' }) });
    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('rejects missing content', async () => {
    const req = createPostRequest('/api/v1/incidents/i1/updates', { isInternal: true });
    const res = await POST_UPDATE(req, { params: Promise.resolve({ id: 'i1' }) });
    expect(res.status).toBe(400);
  });

  it('rejects empty content string', async () => {
    const req = createPostRequest('/api/v1/incidents/i1/updates', { content: '' });
    const res = await POST_UPDATE(req, { params: Promise.resolve({ id: 'i1' }) });
    expect(res.status).toBe(400);
  });

  it('rejects content over 2000 characters', async () => {
    const req = createPostRequest('/api/v1/incidents/i1/updates', { content: 'X'.repeat(2001) });
    const res = await POST_UPDATE(req, { params: Promise.resolve({ id: 'i1' }) });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/incidents/:id/updates — Update Creation', () => {
  it('returns 404 when incident does not exist', async () => {
    mockEventFindUnique.mockResolvedValue(null);

    const req = createPostRequest('/api/v1/incidents/missing/updates', { content: 'Update text' });
    const res = await POST_UPDATE(req, { params: Promise.resolve({ id: 'missing' }) });
    expect(res.status).toBe(404);
  });

  it('appends update to incident description', async () => {
    mockEventFindUnique.mockResolvedValue({
      id: 'i1',
      description: 'Initial description',
    });
    mockEventUpdate.mockResolvedValue({ id: 'i1' });

    const req = createPostRequest('/api/v1/incidents/i1/updates', {
      content: 'Fire department arrived.',
    });
    const res = await POST_UPDATE(req, { params: Promise.resolve({ id: 'i1' }) });
    expect(res.status).toBe(201);

    const updateData = mockEventUpdate.mock.calls[0]![0].data;
    expect(updateData.description).toContain('Initial description');
    expect(updateData.description).toContain('Fire department arrived.');
    expect(updateData.description).toContain('--- Update');
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

  it('handles null initial description gracefully', async () => {
    mockEventFindUnique.mockResolvedValue({ id: 'i1', description: null });
    mockEventUpdate.mockResolvedValue({ id: 'i1' });

    const req = createPostRequest('/api/v1/incidents/i1/updates', { content: 'First update' });
    const res = await POST_UPDATE(req, { params: Promise.resolve({ id: 'i1' }) });
    expect(res.status).toBe(201);
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

// ---------------------------------------------------------------------------
// POST /api/v1/incidents/:id/escalate — Escalation
// ---------------------------------------------------------------------------

describe('POST /api/v1/incidents/:id/escalate — Validation', () => {
  it('rejects empty body', async () => {
    const req = createPostRequest('/api/v1/incidents/i1/escalate', {});
    const res = await POST_ESCALATE(req, { params: Promise.resolve({ id: 'i1' }) });
    expect(res.status).toBe(400);
  });

  it('rejects missing escalateTo', async () => {
    const req = createPostRequest('/api/v1/incidents/i1/escalate', { reason: 'Urgent' });
    const res = await POST_ESCALATE(req, { params: Promise.resolve({ id: 'i1' }) });
    expect(res.status).toBe(400);
  });

  it('rejects missing reason', async () => {
    const req = createPostRequest('/api/v1/incidents/i1/escalate', {
      escalateTo: 'Property Manager',
    });
    const res = await POST_ESCALATE(req, { params: Promise.resolve({ id: 'i1' }) });
    expect(res.status).toBe(400);
  });

  it('rejects reason over 1000 characters', async () => {
    const req = createPostRequest('/api/v1/incidents/i1/escalate', {
      escalateTo: 'Property Manager',
      reason: 'X'.repeat(1001),
    });
    const res = await POST_ESCALATE(req, { params: Promise.resolve({ id: 'i1' }) });
    expect(res.status).toBe(400);
  });
});

describe('POST /api/v1/incidents/:id/escalate — Escalation Flow', () => {
  const validEscalation = {
    escalateTo: 'Property Manager',
    reason: 'Resident is unresponsive and situation is getting worse.',
    priority: 'critical' as const,
  };

  it('updates event priority and status to in_progress', async () => {
    mockEventUpdate.mockResolvedValue({
      id: 'i1',
      title: 'Water leak',
      propertyId: '00000000-0000-4000-b000-000000000001',
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
    mockEventUpdate.mockResolvedValue({ id: 'i1', title: 'Test', propertyId: PROPERTY_A });
    mockUserPropertyFindMany.mockResolvedValue([]);

    const req = createPostRequest('/api/v1/incidents/i1/escalate', validEscalation);
    await POST_ESCALATE(req, { params: Promise.resolve({ id: 'i1' }) });

    const customFields = mockEventUpdate.mock.calls[0]![0].data.customFields;
    expect(customFields.escalatedBy).toBe('test-staff');
    expect(customFields.escalatedAt).toBeDefined();
    expect(customFields.escalationReason).toBeDefined();
  });

  it('strips HTML from escalateTo — XSS prevention', async () => {
    mockEventUpdate.mockResolvedValue({ id: 'i1', title: 'Test', propertyId: PROPERTY_A });
    mockUserPropertyFindMany.mockResolvedValue([]);

    const req = createPostRequest('/api/v1/incidents/i1/escalate', {
      ...validEscalation,
      escalateTo: '<script>alert(1)</script>Manager',
    });
    await POST_ESCALATE(req, { params: Promise.resolve({ id: 'i1' }) });

    const customFields = mockEventUpdate.mock.calls[0]![0].data.customFields;
    expect(customFields.escalatedTo).not.toContain('<script>');
  });

  it('returns success message with escalation target', async () => {
    mockEventUpdate.mockResolvedValue({ id: 'i1', title: 'Test', propertyId: PROPERTY_A });
    mockUserPropertyFindMany.mockResolvedValue([]);

    const req = createPostRequest('/api/v1/incidents/i1/escalate', validEscalation);
    const res = await POST_ESCALATE(req, { params: Promise.resolve({ id: 'i1' }) });
    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('Property Manager');
  });

  it('defaults priority to high if not specified', async () => {
    mockEventUpdate.mockResolvedValue({ id: 'i1', title: 'Test', propertyId: PROPERTY_A });
    mockUserPropertyFindMany.mockResolvedValue([]);

    const req = createPostRequest('/api/v1/incidents/i1/escalate', {
      escalateTo: 'PM',
      reason: 'Needs attention',
    });
    await POST_ESCALATE(req, { params: Promise.resolve({ id: 'i1' }) });

    expect(mockEventUpdate.mock.calls[0]![0].data.priority).toBe('high');
  });

  it('handles database errors without leaking internals', async () => {
    mockEventUpdate.mockRejectedValue(new Error('Record to update not found'));

    const req = createPostRequest('/api/v1/incidents/bad/escalate', validEscalation);
    const res = await POST_ESCALATE(req, { params: Promise.resolve({ id: 'bad' }) });
    expect(res.status).toBe(500);
    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).not.toContain('Record');
  });
});
