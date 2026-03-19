/**
 * Alteration/Renovation Project API — Comprehensive Tests
 *
 * Tests alteration project CRUD, status lifecycle with transition rules,
 * momentum indicators (OK/Slow/Stalled/Stopped), permit/insurance tracking,
 * document management, contractor assignment, inspection scheduling,
 * timeline tracking, admin approval workflow, email notifications,
 * deposit/fee tracking, and tenant isolation. 45+ tests.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  createGetRequest,
  createPostRequest,
  createPatchRequest,
  parseResponse,
} from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Mock Setup
// ---------------------------------------------------------------------------

const mockFindMany = vi.fn();
const mockCount = vi.fn();
const mockCreate = vi.fn();
const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();

const mockDocFindMany = vi.fn();
const mockDocCreate = vi.fn();

const mockSendEmail = vi.fn().mockResolvedValue('msg-id');

vi.mock('@/server/db', () => ({
  prisma: {
    alterationProject: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      count: (...args: unknown[]) => mockCount(...args),
      create: (...args: unknown[]) => mockCreate(...args),
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
    alterationDocument: {
      findMany: (...args: unknown[]) => mockDocFindMany(...args),
      create: (...args: unknown[]) => mockDocCreate(...args),
    },
    alterationStatusChange: {
      create: vi.fn(),
    },
  },
}));

vi.mock('nanoid', () => ({
  nanoid: vi.fn().mockReturnValue('A1B2'),
}));

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: vi.fn().mockResolvedValue({
    user: {
      userId: 'test-admin',
      propertyId: '00000000-0000-4000-b000-000000000001',
      role: 'property_manager',
      permissions: ['*'],
      mfaVerified: false,
    },
    error: null,
  }),
}));

vi.mock('@/server/email', () => ({
  sendEmail: (...args: unknown[]) => mockSendEmail(...args),
}));

import { GET, POST } from '../route';
import { GET as GET_BY_ID, PATCH } from '@/app/api/v1/alterations/[id]/route';
import { GET as GET_DOCS, POST as POST_DOC } from '@/app/api/v1/alterations/[id]/documents/route';
import { calculateMomentum } from '@/schemas/alteration';

beforeEach(() => {
  vi.clearAllMocks();
  mockFindMany.mockResolvedValue([]);
  mockCount.mockResolvedValue(0);
});

const PROPERTY_ID = '00000000-0000-4000-b000-000000000001';
const UNIT_ID = '00000000-0000-4000-e000-000000000001';
const VENDOR_ID = '00000000-0000-4000-f000-000000000001';

// ---------------------------------------------------------------------------
// 1. POST /api/v1/alterations — Create alteration project
// ---------------------------------------------------------------------------

describe('POST /api/v1/alterations — Create Alteration Project', () => {
  const validBody = {
    propertyId: PROPERTY_ID,
    unitId: UNIT_ID,
    description: 'Full kitchen renovation including cabinet replacement and new countertops',
    expectedStartDate: '2026-04-01',
    expectedEndDate: '2026-06-30',
  };

  it('creates project with unit, description, and timeline', async () => {
    mockCreate.mockResolvedValue({
      id: 'alt-1',
      ...validBody,
      referenceNumber: 'ALT-A1B2',
      status: 'submitted',
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/alterations', validBody);
    const res = await POST(req);

    expect(res.status).toBe(201);
    const body = await parseResponse<{ data: Record<string, unknown>; message: string }>(res);
    expect(body.message).toContain('ALT-A1B2');

    const createData = mockCreate.mock.calls[0]![0].data;
    expect(createData.unitId).toBe(UNIT_ID);
    expect(createData.expectedStartDate).toBeDefined();
    expect(createData.expectedEndDate).toBeDefined();
    expect(createData.status).toBe('submitted');
  });

  it('generates ALT-XXXX reference number', async () => {
    mockCreate.mockResolvedValue({
      id: 'alt-1',
      referenceNumber: 'ALT-A1B2',
      status: 'submitted',
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/alterations', validBody);
    await POST(req);

    const createData = mockCreate.mock.calls[0]![0].data;
    expect(createData.referenceNumber).toMatch(/^ALT-[A-Z0-9]+$/);
  });

  it('rejects missing required fields', async () => {
    const req = createPostRequest('/api/v1/alterations', {});
    const res = await POST(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('rejects missing propertyId', async () => {
    const req = createPostRequest('/api/v1/alterations', {
      unitId: UNIT_ID,
      description: 'Some renovation work that is at least 10 chars',
      expectedStartDate: '2026-04-01',
      expectedEndDate: '2026-06-30',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects missing unitId', async () => {
    const req = createPostRequest('/api/v1/alterations', {
      propertyId: PROPERTY_ID,
      description: 'Some renovation work that is at least 10 chars',
      expectedStartDate: '2026-04-01',
      expectedEndDate: '2026-06-30',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects description under 10 characters', async () => {
    const req = createPostRequest('/api/v1/alterations', {
      ...validBody,
      description: 'short',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('stores optional scope field', async () => {
    const bodyWithScope = {
      ...validBody,
      scope: 'Kitchen cabinets, countertops, backsplash, flooring',
    };

    mockCreate.mockResolvedValue({
      id: 'alt-1',
      ...bodyWithScope,
      referenceNumber: 'ALT-A1B2',
      status: 'submitted',
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/alterations', bodyWithScope);
    const res = await POST(req);
    expect(res.status).toBe(201);

    const createData = mockCreate.mock.calls[0]![0].data;
    expect(createData.scope).toBeTruthy();
  });

  it('stores optional contractorVendorId on creation', async () => {
    const bodyWithContractor = { ...validBody, contractorVendorId: VENDOR_ID };

    mockCreate.mockResolvedValue({
      id: 'alt-1',
      ...bodyWithContractor,
      referenceNumber: 'ALT-A1B2',
      status: 'submitted',
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/alterations', bodyWithContractor);
    await POST(req);

    const createData = mockCreate.mock.calls[0]![0].data;
    expect(createData.contractorVendorId).toBe(VENDOR_ID);
  });

  it('sets lastActivityDate on creation', async () => {
    mockCreate.mockResolvedValue({
      id: 'alt-1',
      referenceNumber: 'ALT-A1B2',
      status: 'submitted',
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/alterations', validBody);
    await POST(req);

    const createData = mockCreate.mock.calls[0]![0].data;
    expect(createData.lastActivityDate).toBeInstanceOf(Date);
  });

  it('handles database errors gracefully', async () => {
    mockCreate.mockRejectedValue(new Error('DB down'));

    const req = createPostRequest('/api/v1/alterations', validBody);
    const res = await POST(req);

    expect(res.status).toBe(500);
    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).not.toContain('DB down');
  });
});

// ---------------------------------------------------------------------------
// 2. Required documents tracking
// ---------------------------------------------------------------------------

describe('Required Documents — insurance_certificate, permit, floor_plan', () => {
  it('tracks required document types on project detail', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'alt-1',
      status: 'submitted',
      propertyId: PROPERTY_ID,
      documents: [],
    });

    const req = createGetRequest('/api/v1/alterations/alt-1', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: 'alt-1' }) });
    const body = await parseResponse<{ data: Record<string, unknown> }>(res);

    expect(body.data).toHaveProperty('requiredDocuments');
    const requiredDocs = body.data.requiredDocuments as Array<{ type: string; uploaded: boolean }>;
    expect(requiredDocs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: 'insurance_certificate', uploaded: false }),
        expect.objectContaining({ type: 'permit', uploaded: false }),
        expect.objectContaining({ type: 'floor_plan', uploaded: false }),
      ]),
    );
  });

  it('marks document as uploaded when present', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'alt-1',
      status: 'submitted',
      propertyId: PROPERTY_ID,
      documents: [{ id: 'doc-1', documentType: 'insurance_certificate', fileName: 'cert.pdf' }],
    });

    const req = createGetRequest('/api/v1/alterations/alt-1', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: 'alt-1' }) });
    const body = await parseResponse<{ data: Record<string, unknown> }>(res);

    const requiredDocs = body.data.requiredDocuments as Array<{ type: string; uploaded: boolean }>;
    const insurance = requiredDocs.find((d) => d.type === 'insurance_certificate');
    expect(insurance?.uploaded).toBe(true);

    const permit = requiredDocs.find((d) => d.type === 'permit');
    expect(permit?.uploaded).toBe(false);
  });

  it('marks all required docs as uploaded when all present', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'alt-1',
      status: 'in_progress',
      propertyId: PROPERTY_ID,
      documents: [
        { id: 'doc-1', documentType: 'insurance_certificate', fileName: 'cert.pdf' },
        { id: 'doc-2', documentType: 'permit', fileName: 'permit.pdf' },
        { id: 'doc-3', documentType: 'floor_plan', fileName: 'floor.pdf' },
      ],
    });

    const req = createGetRequest('/api/v1/alterations/alt-1', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: 'alt-1' }) });
    const body = await parseResponse<{ data: Record<string, unknown> }>(res);

    const requiredDocs = body.data.requiredDocuments as Array<{ type: string; uploaded: boolean }>;
    expect(requiredDocs.every((d) => d.uploaded)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 3. Status lifecycle transitions
// ---------------------------------------------------------------------------

describe('Status Lifecycle', () => {
  const validBody = {
    propertyId: PROPERTY_ID,
    unitId: UNIT_ID,
    description: 'Bathroom renovation with new tiling and fixtures',
    expectedStartDate: '2026-04-01',
    expectedEndDate: '2026-06-30',
  };

  it('new projects start as submitted', async () => {
    mockCreate.mockResolvedValue({
      id: 'alt-1',
      ...validBody,
      referenceNumber: 'ALT-A1B2',
      status: 'submitted',
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/alterations', validBody);
    await POST(req);
    expect(mockCreate.mock.calls[0]![0].data.status).toBe('submitted');
  });

  it('allows transition submitted -> under_review', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'alt-1',
      status: 'submitted',
      propertyId: PROPERTY_ID,
      referenceNumber: 'ALT-A1B2',
      documents: [],
      lastActivityDate: new Date(),
    });
    mockUpdate.mockResolvedValue({ id: 'alt-1', status: 'under_review' });

    const req = createPatchRequest('/api/v1/alterations/alt-1', { status: 'under_review' });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'alt-1' }) });
    expect(res.status).toBe(200);
    expect(mockUpdate.mock.calls[0]![0].data.status).toBe('under_review');
  });

  it('allows transition under_review -> approved', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'alt-1',
      status: 'under_review',
      propertyId: PROPERTY_ID,
      referenceNumber: 'ALT-A1B2',
      documents: [],
      lastActivityDate: new Date(),
    });
    mockUpdate.mockResolvedValue({ id: 'alt-1', status: 'approved' });

    const req = createPatchRequest('/api/v1/alterations/alt-1', { status: 'approved' });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'alt-1' }) });
    expect(res.status).toBe(200);
    expect(mockUpdate.mock.calls[0]![0].data.status).toBe('approved');
  });

  it('allows transition approved -> in_progress', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'alt-1',
      status: 'approved',
      propertyId: PROPERTY_ID,
      referenceNumber: 'ALT-A1B2',
      documents: [],
      lastActivityDate: new Date(),
    });
    mockUpdate.mockResolvedValue({ id: 'alt-1', status: 'in_progress' });

    const req = createPatchRequest('/api/v1/alterations/alt-1', { status: 'in_progress' });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'alt-1' }) });
    expect(res.status).toBe(200);
  });

  it('allows transition in_progress -> completed', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'alt-1',
      status: 'in_progress',
      propertyId: PROPERTY_ID,
      referenceNumber: 'ALT-A1B2',
      documents: [],
      lastActivityDate: new Date(),
    });
    mockUpdate.mockResolvedValue({ id: 'alt-1', status: 'completed' });

    const req = createPatchRequest('/api/v1/alterations/alt-1', {
      status: 'completed',
      actualCompletionDate: '2026-06-28',
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'alt-1' }) });
    expect(res.status).toBe(200);
  });

  it('rejects invalid transition submitted -> in_progress (cannot skip steps)', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'alt-1',
      status: 'submitted',
      propertyId: PROPERTY_ID,
      referenceNumber: 'ALT-A1B2',
      documents: [],
      lastActivityDate: new Date(),
    });

    const req = createPatchRequest('/api/v1/alterations/alt-1', { status: 'in_progress' });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'alt-1' }) });
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('INVALID_TRANSITION');
  });

  it('rejects invalid transition submitted -> completed (cannot skip steps)', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'alt-1',
      status: 'submitted',
      propertyId: PROPERTY_ID,
      referenceNumber: 'ALT-A1B2',
      documents: [],
      lastActivityDate: new Date(),
    });

    const req = createPatchRequest('/api/v1/alterations/alt-1', { status: 'completed' });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'alt-1' }) });
    expect(res.status).toBe(400);
  });

  it('rejects invalid transition approved -> completed (must go through in_progress)', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'alt-1',
      status: 'approved',
      propertyId: PROPERTY_ID,
      referenceNumber: 'ALT-A1B2',
      documents: [],
      lastActivityDate: new Date(),
    });

    const req = createPatchRequest('/api/v1/alterations/alt-1', { status: 'completed' });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'alt-1' }) });
    expect(res.status).toBe(400);
  });

  it('returns 404 for non-existent project', async () => {
    mockFindUnique.mockResolvedValue(null);

    const req = createPatchRequest('/api/v1/alterations/non-existent', { status: 'under_review' });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'non-existent' }) });
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// 4. Declined status with reason
// ---------------------------------------------------------------------------

describe('Declined Status', () => {
  it('requires declineReason when declining', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'alt-1',
      status: 'under_review',
      propertyId: PROPERTY_ID,
      referenceNumber: 'ALT-A1B2',
      documents: [],
      lastActivityDate: new Date(),
    });

    const req = createPatchRequest('/api/v1/alterations/alt-1', { status: 'declined' });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'alt-1' }) });
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('DECLINE_REASON_REQUIRED');
  });

  it('accepts decline with valid reason', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'alt-1',
      status: 'under_review',
      propertyId: PROPERTY_ID,
      referenceNumber: 'ALT-A1B2',
      documents: [],
      lastActivityDate: new Date(),
    });
    mockUpdate.mockResolvedValue({ id: 'alt-1', status: 'declined' });

    const req = createPatchRequest('/api/v1/alterations/alt-1', {
      status: 'declined',
      declineReason: 'Missing structural engineer approval. Resubmit with PE stamp.',
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'alt-1' }) });
    expect(res.status).toBe(200);

    const updateData = mockUpdate.mock.calls[0]![0].data;
    expect(updateData.declineReason).toContain('structural engineer');
  });

  it('cannot transition out of declined', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'alt-1',
      status: 'declined',
      propertyId: PROPERTY_ID,
      referenceNumber: 'ALT-A1B2',
      documents: [],
      lastActivityDate: new Date(),
    });

    const req = createPatchRequest('/api/v1/alterations/alt-1', { status: 'approved' });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'alt-1' }) });
    expect(res.status).toBe(400);
  });

  it('cannot transition out of completed', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'alt-1',
      status: 'completed',
      propertyId: PROPERTY_ID,
      referenceNumber: 'ALT-A1B2',
      documents: [],
      lastActivityDate: new Date(),
    });

    const req = createPatchRequest('/api/v1/alterations/alt-1', { status: 'in_progress' });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'alt-1' }) });
    expect(res.status).toBe(400);
  });

  it('allows declining from submitted status', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'alt-1',
      status: 'submitted',
      propertyId: PROPERTY_ID,
      referenceNumber: 'ALT-A1B2',
      documents: [],
      lastActivityDate: new Date(),
    });
    mockUpdate.mockResolvedValue({ id: 'alt-1', status: 'declined' });

    const req = createPatchRequest('/api/v1/alterations/alt-1', {
      status: 'declined',
      declineReason: 'Incomplete submission materials',
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'alt-1' }) });
    expect(res.status).toBe(200);
  });

  it('allows declining from approved status', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'alt-1',
      status: 'approved',
      propertyId: PROPERTY_ID,
      referenceNumber: 'ALT-A1B2',
      documents: [],
      lastActivityDate: new Date(),
    });
    mockUpdate.mockResolvedValue({ id: 'alt-1', status: 'declined' });

    const req = createPatchRequest('/api/v1/alterations/alt-1', {
      status: 'declined',
      declineReason: 'Board reversed decision',
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'alt-1' }) });
    expect(res.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// 5. Momentum indicators
// ---------------------------------------------------------------------------

describe('Momentum Indicators', () => {
  it('returns ok when activity within last 7 days', () => {
    const recent = new Date();
    recent.setDate(recent.getDate() - 3);
    expect(calculateMomentum(recent)).toBe('ok');
  });

  it('returns slow when 7-14 days since last activity', () => {
    const date = new Date();
    date.setDate(date.getDate() - 10);
    expect(calculateMomentum(date)).toBe('slow');
  });

  it('returns stalled when 14-30 days since last activity', () => {
    const date = new Date();
    date.setDate(date.getDate() - 20);
    expect(calculateMomentum(date)).toBe('stalled');
  });

  it('returns stopped when 30+ days since last activity', () => {
    const date = new Date();
    date.setDate(date.getDate() - 45);
    expect(calculateMomentum(date)).toBe('stopped');
  });

  it('boundary: exactly 7 days returns ok', () => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    expect(calculateMomentum(date)).toBe('ok');
  });

  it('boundary: exactly 14 days returns slow', () => {
    const date = new Date();
    date.setDate(date.getDate() - 14);
    expect(calculateMomentum(date)).toBe('slow');
  });

  it('boundary: exactly 30 days returns stalled', () => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    expect(calculateMomentum(date)).toBe('stalled');
  });

  it('accepts string date input', () => {
    const recent = new Date();
    recent.setDate(recent.getDate() - 2);
    expect(calculateMomentum(recent.toISOString())).toBe('ok');
  });

  it('GET by ID includes momentum indicator', async () => {
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 2);
    mockFindUnique.mockResolvedValue({
      id: 'alt-1',
      status: 'in_progress',
      propertyId: PROPERTY_ID,
      lastActivityDate: recentDate,
      documents: [],
    });

    const req = createGetRequest('/api/v1/alterations/alt-1', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: 'alt-1' }) });
    const body = await parseResponse<{ data: Record<string, unknown> }>(res);

    expect(body.data.momentum).toBe('ok');
  });

  it('GET list includes momentum indicator per project', async () => {
    const staleDate = new Date();
    staleDate.setDate(staleDate.getDate() - 25);
    mockFindMany.mockResolvedValue([
      { id: 'alt-1', status: 'in_progress', lastActivityDate: staleDate, propertyId: PROPERTY_ID },
    ]);
    mockCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/alterations', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET(req);
    const body = await parseResponse<{ data: Array<Record<string, unknown>> }>(res);

    expect(body.data[0]!.momentum).toBe('stalled');
  });

  it('projects without lastActivityDate default to stopped', async () => {
    mockFindMany.mockResolvedValue([
      { id: 'alt-1', status: 'submitted', lastActivityDate: null, propertyId: PROPERTY_ID },
    ]);
    mockCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/alterations', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET(req);
    const body = await parseResponse<{ data: Array<Record<string, unknown>> }>(res);

    expect(body.data[0]!.momentum).toBe('stopped');
  });
});

// ---------------------------------------------------------------------------
// 6. Document upload tracking
// ---------------------------------------------------------------------------

describe('Document Upload Tracking', () => {
  it('uploads a document to a project', async () => {
    mockDocCreate.mockResolvedValue({
      id: 'doc-1',
      alterationProjectId: 'alt-1',
      documentType: 'insurance_certificate',
      fileName: 'insurance.pdf',
    });
    mockFindUnique.mockResolvedValue({
      id: 'alt-1',
      propertyId: PROPERTY_ID,
      status: 'submitted',
    });
    mockUpdate.mockResolvedValue({});

    const req = createPostRequest('/api/v1/alterations/alt-1/documents', {
      documentType: 'insurance_certificate',
      fileName: 'insurance.pdf',
      fileUrl: 's3://bucket/insurance.pdf',
      fileSizeBytes: 102400,
      contentType: 'application/pdf',
    });
    const res = await POST_DOC(req, { params: Promise.resolve({ id: 'alt-1' }) });

    expect(res.status).toBe(201);
    const body = await parseResponse<{ data: Record<string, unknown> }>(res);
    expect(body.data.documentType).toBe('insurance_certificate');
  });

  it('lists documents for a project', async () => {
    mockDocFindMany.mockResolvedValue([
      { id: 'doc-1', documentType: 'permit', fileName: 'permit.pdf' },
      { id: 'doc-2', documentType: 'floor_plan', fileName: 'floor.pdf' },
    ]);
    mockFindUnique.mockResolvedValue({ id: 'alt-1', propertyId: PROPERTY_ID });

    const req = createGetRequest('/api/v1/alterations/alt-1/documents', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET_DOCS(req, { params: Promise.resolve({ id: 'alt-1' }) });

    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: Array<Record<string, unknown>> }>(res);
    expect(body.data).toHaveLength(2);
  });

  it('rejects invalid document type', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'alt-1',
      propertyId: PROPERTY_ID,
      status: 'submitted',
    });

    const req = createPostRequest('/api/v1/alterations/alt-1/documents', {
      documentType: 'invalid_type',
      fileName: 'file.pdf',
      fileUrl: 's3://bucket/file.pdf',
      fileSizeBytes: 1024,
      contentType: 'application/pdf',
    });
    const res = await POST_DOC(req, { params: Promise.resolve({ id: 'alt-1' }) });
    expect(res.status).toBe(400);
  });

  it('returns 404 if project does not exist for document upload', async () => {
    mockFindUnique.mockResolvedValue(null);

    const req = createPostRequest('/api/v1/alterations/non-existent/documents', {
      documentType: 'permit',
      fileName: 'permit.pdf',
      fileUrl: 's3://bucket/permit.pdf',
      fileSizeBytes: 1024,
      contentType: 'application/pdf',
    });
    const res = await POST_DOC(req, { params: Promise.resolve({ id: 'non-existent' }) });
    expect(res.status).toBe(404);
  });

  it('returns 404 if project does not exist for document list', async () => {
    mockFindUnique.mockResolvedValue(null);

    const req = createGetRequest('/api/v1/alterations/non-existent/documents');
    const res = await GET_DOCS(req, { params: Promise.resolve({ id: 'non-existent' }) });
    expect(res.status).toBe(404);
  });

  it('accepts "other" document type for supplementary docs', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'alt-1',
      propertyId: PROPERTY_ID,
      status: 'submitted',
    });
    mockDocCreate.mockResolvedValue({ id: 'doc-1', documentType: 'other' });
    mockUpdate.mockResolvedValue({});

    const req = createPostRequest('/api/v1/alterations/alt-1/documents', {
      documentType: 'other',
      fileName: 'extra.pdf',
      fileUrl: 's3://bucket/extra.pdf',
      fileSizeBytes: 512,
      contentType: 'application/pdf',
    });
    const res = await POST_DOC(req, { params: Promise.resolve({ id: 'alt-1' }) });
    expect(res.status).toBe(201);
  });

  it('updates lastActivityDate on document upload', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'alt-1',
      propertyId: PROPERTY_ID,
      status: 'submitted',
    });
    mockDocCreate.mockResolvedValue({ id: 'doc-1', documentType: 'permit' });
    mockUpdate.mockResolvedValue({});

    const req = createPostRequest('/api/v1/alterations/alt-1/documents', {
      documentType: 'permit',
      fileName: 'permit.pdf',
      fileUrl: 's3://bucket/permit.pdf',
      fileSizeBytes: 1024,
      contentType: 'application/pdf',
    });
    await POST_DOC(req, { params: Promise.resolve({ id: 'alt-1' }) });

    // Should have called update to set lastActivityDate
    expect(mockUpdate).toHaveBeenCalledOnce();
    const updateData = mockUpdate.mock.calls[0]![0].data;
    expect(updateData.lastActivityDate).toBeInstanceOf(Date);
  });
});

// ---------------------------------------------------------------------------
// 7. Inspection scheduling linked to project
// ---------------------------------------------------------------------------

describe('Inspection Scheduling', () => {
  it('schedules an inspection via PATCH', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'alt-1',
      status: 'in_progress',
      propertyId: PROPERTY_ID,
      referenceNumber: 'ALT-A1B2',
      documents: [],
      lastActivityDate: new Date(),
    });
    mockUpdate.mockResolvedValue({
      id: 'alt-1',
      inspectionDate: '2026-05-15',
      inspectionNotes: 'Check wall removal permits',
    });

    const req = createPatchRequest('/api/v1/alterations/alt-1', {
      inspectionDate: '2026-05-15',
      inspectionNotes: 'Check wall removal permits',
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'alt-1' }) });

    expect(res.status).toBe(200);
    const updateData = mockUpdate.mock.calls[0]![0].data;
    expect(updateData.inspectionDate).toBeDefined();
    expect(updateData.inspectionNotes).toBe('Check wall removal permits');
  });
});

// ---------------------------------------------------------------------------
// 8. Contractor assignment
// ---------------------------------------------------------------------------

describe('Contractor Assignment', () => {
  it('assigns contractor vendor to project on creation', async () => {
    const bodyWithContractor = {
      propertyId: PROPERTY_ID,
      unitId: UNIT_ID,
      description: 'Living room hardwood floor refinishing project',
      expectedStartDate: '2026-04-01',
      expectedEndDate: '2026-05-15',
      contractorVendorId: VENDOR_ID,
    };

    mockCreate.mockResolvedValue({
      id: 'alt-1',
      ...bodyWithContractor,
      referenceNumber: 'ALT-A1B2',
      status: 'submitted',
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/alterations', bodyWithContractor);
    await POST(req);

    const createData = mockCreate.mock.calls[0]![0].data;
    expect(createData.contractorVendorId).toBe(VENDOR_ID);
  });

  it('updates contractor via PATCH', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'alt-1',
      status: 'approved',
      propertyId: PROPERTY_ID,
      referenceNumber: 'ALT-A1B2',
      documents: [],
      lastActivityDate: new Date(),
    });
    mockUpdate.mockResolvedValue({
      id: 'alt-1',
      contractorVendorId: VENDOR_ID,
    });

    const req = createPatchRequest('/api/v1/alterations/alt-1', {
      contractorVendorId: VENDOR_ID,
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'alt-1' }) });

    expect(res.status).toBe(200);
    expect(mockUpdate.mock.calls[0]![0].data.contractorVendorId).toBe(VENDOR_ID);
  });
});

// ---------------------------------------------------------------------------
// 9. Timeline tracking: expected vs actual completion
// ---------------------------------------------------------------------------

describe('Timeline Tracking — Expected vs Actual', () => {
  it('stores expected start and end dates on create', async () => {
    const validBody = {
      propertyId: PROPERTY_ID,
      unitId: UNIT_ID,
      description: 'Complete bathroom remodel with walk-in shower',
      expectedStartDate: '2026-04-01',
      expectedEndDate: '2026-07-31',
    };

    mockCreate.mockResolvedValue({
      id: 'alt-1',
      ...validBody,
      referenceNumber: 'ALT-A1B2',
      status: 'submitted',
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/alterations', validBody);
    await POST(req);

    const createData = mockCreate.mock.calls[0]![0].data;
    expect(createData.expectedStartDate).toBeDefined();
    expect(createData.expectedEndDate).toBeDefined();
  });

  it('records actual completion date when marking completed', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'alt-1',
      status: 'in_progress',
      propertyId: PROPERTY_ID,
      referenceNumber: 'ALT-A1B2',
      expectedEndDate: '2026-06-30',
      documents: [],
      lastActivityDate: new Date(),
    });
    mockUpdate.mockResolvedValue({
      id: 'alt-1',
      status: 'completed',
      actualCompletionDate: '2026-07-15',
    });

    const req = createPatchRequest('/api/v1/alterations/alt-1', {
      status: 'completed',
      actualCompletionDate: '2026-07-15',
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'alt-1' }) });

    expect(res.status).toBe(200);
    const updateData = mockUpdate.mock.calls[0]![0].data;
    expect(updateData.actualCompletionDate).toBeDefined();
  });

  it('auto-sets actualCompletionDate to now when completing without explicit date', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'alt-1',
      status: 'in_progress',
      propertyId: PROPERTY_ID,
      referenceNumber: 'ALT-A1B2',
      documents: [],
      lastActivityDate: new Date(),
    });
    mockUpdate.mockResolvedValue({ id: 'alt-1', status: 'completed' });

    const req = createPatchRequest('/api/v1/alterations/alt-1', {
      status: 'completed',
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'alt-1' }) });

    expect(res.status).toBe(200);
    const updateData = mockUpdate.mock.calls[0]![0].data;
    expect(updateData.actualCompletionDate).toBeInstanceOf(Date);
  });

  it('GET by ID includes timeline comparison data', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'alt-1',
      status: 'completed',
      propertyId: PROPERTY_ID,
      expectedStartDate: '2026-04-01',
      expectedEndDate: '2026-06-30',
      actualCompletionDate: '2026-07-15',
      lastActivityDate: new Date(),
      documents: [],
    });

    const req = createGetRequest('/api/v1/alterations/alt-1', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: 'alt-1' }) });
    const body = await parseResponse<{ data: Record<string, unknown> }>(res);

    expect(body.data.expectedEndDate).toBeDefined();
    expect(body.data.actualCompletionDate).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// 10. Admin approval workflow with multi-step review
// ---------------------------------------------------------------------------

describe('Admin Approval Workflow — Multi-Step Review', () => {
  it('records review step and notes during under_review', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'alt-1',
      status: 'under_review',
      propertyId: PROPERTY_ID,
      referenceNumber: 'ALT-A1B2',
      documents: [],
      lastActivityDate: new Date(),
    });
    mockUpdate.mockResolvedValue({
      id: 'alt-1',
      status: 'under_review',
      reviewStep: 'documents_check',
      reviewNotes: 'Insurance verified, permit pending',
    });

    const req = createPatchRequest('/api/v1/alterations/alt-1', {
      reviewStep: 'documents_check',
      reviewNotes: 'Insurance verified, permit pending',
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'alt-1' }) });

    expect(res.status).toBe(200);
    const updateData = mockUpdate.mock.calls[0]![0].data;
    expect(updateData.reviewStep).toBe('documents_check');
    expect(updateData.reviewNotes).toBe('Insurance verified, permit pending');
  });

  it('supports board_review step', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'alt-1',
      status: 'under_review',
      propertyId: PROPERTY_ID,
      referenceNumber: 'ALT-A1B2',
      documents: [],
      lastActivityDate: new Date(),
    });
    mockUpdate.mockResolvedValue({
      id: 'alt-1',
      reviewStep: 'board_review',
    });

    const req = createPatchRequest('/api/v1/alterations/alt-1', {
      reviewStep: 'board_review',
      reviewNotes: 'Board approved at March meeting',
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'alt-1' }) });

    expect(res.status).toBe(200);
    expect(mockUpdate.mock.calls[0]![0].data.reviewStep).toBe('board_review');
  });

  it('supports final_approval step before approving', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'alt-1',
      status: 'under_review',
      propertyId: PROPERTY_ID,
      referenceNumber: 'ALT-A1B2',
      documents: [],
      lastActivityDate: new Date(),
    });
    mockUpdate.mockResolvedValue({
      id: 'alt-1',
      status: 'approved',
      reviewStep: 'final_approval',
    });

    const req = createPatchRequest('/api/v1/alterations/alt-1', {
      status: 'approved',
      reviewStep: 'final_approval',
      reviewNotes: 'All documents verified, board approved, final sign-off by PM',
    });
    const res = await PATCH(req, { params: Promise.resolve({ id: 'alt-1' }) });
    expect(res.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// 11. Resident can view their own alteration projects
// ---------------------------------------------------------------------------

describe('Resident Viewing Own Projects', () => {
  it('filters by residentId when provided', async () => {
    const residentId = 'resident-user-1';
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/alterations', {
      searchParams: { propertyId: PROPERTY_ID, residentId },
    });
    await GET(req);

    const where = mockFindMany.mock.calls[0]![0].where;
    expect(where.createdById).toBe(residentId);
  });

  it('returns only projects for the specified unit', async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/alterations', {
      searchParams: { propertyId: PROPERTY_ID, unitId: UNIT_ID },
    });
    await GET(req);

    const where = mockFindMany.mock.calls[0]![0].where;
    expect(where.unitId).toBe(UNIT_ID);
  });
});

// ---------------------------------------------------------------------------
// 12. Email notification on status change
// ---------------------------------------------------------------------------

describe('Email Notification on Status Change', () => {
  it('sends email when status changes', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'alt-1',
      status: 'submitted',
      propertyId: PROPERTY_ID,
      referenceNumber: 'ALT-A1B2',
      createdById: 'resident-1',
      documents: [],
      lastActivityDate: new Date(),
      unit: { number: '1501' },
      resident: { email: 'resident@example.com', firstName: 'Jane' },
    });
    mockUpdate.mockResolvedValue({ id: 'alt-1', status: 'under_review' });

    const req = createPatchRequest('/api/v1/alterations/alt-1', {
      status: 'under_review',
    });
    await PATCH(req, { params: Promise.resolve({ id: 'alt-1' }) });

    expect(mockSendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'resident@example.com',
        subject: expect.stringContaining('ALT-A1B2'),
      }),
    );
  });

  it('does not send email when no status change', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'alt-1',
      status: 'in_progress',
      propertyId: PROPERTY_ID,
      referenceNumber: 'ALT-A1B2',
      documents: [],
      lastActivityDate: new Date(),
    });
    mockUpdate.mockResolvedValue({
      id: 'alt-1',
      status: 'in_progress',
      inspectionDate: '2026-05-15',
    });

    const req = createPatchRequest('/api/v1/alterations/alt-1', {
      inspectionDate: '2026-05-15',
    });
    await PATCH(req, { params: Promise.resolve({ id: 'alt-1' }) });

    expect(mockSendEmail).not.toHaveBeenCalled();
  });

  it('does not send email when no resident email on record', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'alt-1',
      status: 'submitted',
      propertyId: PROPERTY_ID,
      referenceNumber: 'ALT-A1B2',
      createdById: 'resident-1',
      documents: [],
      lastActivityDate: new Date(),
      // No resident object
    });
    mockUpdate.mockResolvedValue({ id: 'alt-1', status: 'under_review' });

    const req = createPatchRequest('/api/v1/alterations/alt-1', {
      status: 'under_review',
    });
    await PATCH(req, { params: Promise.resolve({ id: 'alt-1' }) });

    expect(mockSendEmail).not.toHaveBeenCalled();
  });
});

// ---------------------------------------------------------------------------
// 13. GET /api/v1/alterations — Tenant Isolation & Pagination
// ---------------------------------------------------------------------------

describe('GET /api/v1/alterations — Tenant Isolation & Pagination', () => {
  it('rejects without propertyId', async () => {
    const req = createGetRequest('/api/v1/alterations');
    const res = await GET(req);
    expect(res.status).toBe(400);
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it('scopes to propertyId + soft-delete filter', async () => {
    const req = createGetRequest('/api/v1/alterations', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    await GET(req);

    const where = mockFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_ID);
    expect(where.deletedAt).toBeNull();
  });

  it('filters by status', async () => {
    const req = createGetRequest('/api/v1/alterations', {
      searchParams: { propertyId: PROPERTY_ID, status: 'in_progress' },
    });
    await GET(req);
    expect(mockFindMany.mock.calls[0]![0].where.status).toBe('in_progress');
  });

  it('returns paginated results with meta', async () => {
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(25);

    const req = createGetRequest('/api/v1/alterations', {
      searchParams: { propertyId: PROPERTY_ID, page: '2', pageSize: '10' },
    });
    const res = await GET(req);
    const body = await parseResponse<{ meta: Record<string, number> }>(res);

    expect(body.meta.page).toBe(2);
    expect(body.meta.pageSize).toBe(10);
    expect(body.meta.total).toBe(25);
  });

  it('defaults to page 1 and pageSize 50', async () => {
    const req = createGetRequest('/api/v1/alterations', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    await GET(req);

    const call = mockFindMany.mock.calls[0]![0];
    expect(call.skip).toBe(0);
    expect(call.take).toBe(50);
  });

  it('includes unit relation for display', async () => {
    const req = createGetRequest('/api/v1/alterations', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    await GET(req);

    const include = mockFindMany.mock.calls[0]![0].include;
    expect(include.unit).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// 14. lastActivityDate always updated on PATCH
// ---------------------------------------------------------------------------

describe('lastActivityDate tracking', () => {
  it('updates lastActivityDate on every PATCH', async () => {
    mockFindUnique.mockResolvedValue({
      id: 'alt-1',
      status: 'in_progress',
      propertyId: PROPERTY_ID,
      referenceNumber: 'ALT-A1B2',
      documents: [],
      lastActivityDate: new Date('2026-01-01'),
    });
    mockUpdate.mockResolvedValue({ id: 'alt-1' });

    const req = createPatchRequest('/api/v1/alterations/alt-1', {
      inspectionNotes: 'Updated notes',
    });
    await PATCH(req, { params: Promise.resolve({ id: 'alt-1' }) });

    const updateData = mockUpdate.mock.calls[0]![0].data;
    expect(updateData.lastActivityDate).toBeInstanceOf(Date);
  });
});

// ---------------------------------------------------------------------------
// 15. GET by ID returns 404 for non-existent project
// ---------------------------------------------------------------------------

describe('GET /api/v1/alterations/:id — Detail', () => {
  it('returns 404 for non-existent project', async () => {
    mockFindUnique.mockResolvedValue(null);

    const req = createGetRequest('/api/v1/alterations/non-existent', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: 'non-existent' }) });
    expect(res.status).toBe(404);
  });

  it('returns project data with momentum and required documents', async () => {
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 5);

    mockFindUnique.mockResolvedValue({
      id: 'alt-1',
      status: 'in_progress',
      propertyId: PROPERTY_ID,
      referenceNumber: 'ALT-A1B2',
      lastActivityDate: recentDate,
      documents: [{ documentType: 'insurance_certificate', fileName: 'ins.pdf' }],
    });

    const req = createGetRequest('/api/v1/alterations/alt-1', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET_BY_ID(req, { params: Promise.resolve({ id: 'alt-1' }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: Record<string, unknown> }>(res);
    expect(body.data.momentum).toBe('ok');
    expect(body.data.requiredDocuments).toBeDefined();

    const requiredDocs = body.data.requiredDocuments as Array<{ type: string; uploaded: boolean }>;
    const ins = requiredDocs.find((d) => d.type === 'insurance_certificate');
    expect(ins?.uploaded).toBe(true);
    const permit = requiredDocs.find((d) => d.type === 'permit');
    expect(permit?.uploaded).toBe(false);
  });
});
