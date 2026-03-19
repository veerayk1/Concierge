/**
 * Maintenance API — Save & Add Another (GAP 5.2)
 *
 * When staff are entering multiple maintenance requests in a row (e.g.,
 * after a building inspection), they need to stay on the creation form
 * instead of being redirected to the list view. The `addAnother` field
 * signals the UI to keep the form open after successful creation.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createPostRequest, parseResponse } from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Mock Setup
// ---------------------------------------------------------------------------

const mockCreate = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    maintenanceRequest: {
      create: (...args: unknown[]) => mockCreate(...args),
    },
    attachment: {
      create: vi.fn(),
    },
  },
}));

vi.mock('nanoid', () => ({
  nanoid: vi.fn().mockReturnValue('AB12'),
}));

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: vi.fn().mockResolvedValue({
    user: {
      userId: 'test-staff',
      propertyId: '00000000-0000-4000-b000-000000000001',
      role: 'front_desk',
      permissions: ['*'],
      mfaVerified: false,
    },
    error: null,
  }),
}));

import { POST } from '../route';

const PROPERTY_ID = '00000000-0000-4000-b000-000000000001';
const UNIT_ID = '00000000-0000-4000-e000-000000000001';

const validBody = {
  propertyId: PROPERTY_ID,
  unitId: UNIT_ID,
  description: 'Kitchen sink leaking under cabinet. Water pooling on floor.',
  priority: 'high',
  permissionToEnter: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  mockCreate.mockResolvedValue({
    id: 'mr-1',
    ...validBody,
    referenceNumber: 'MR-AB12',
    status: 'open',
    createdAt: new Date(),
    unit: { id: UNIT_ID, number: '1501' },
  });
});

// ---------------------------------------------------------------------------
// GAP 5.2: Save & Add Another
// ---------------------------------------------------------------------------

describe('POST /api/v1/maintenance — Save & Add Another (GAP 5.2)', () => {
  it('includes redirect:"create" in response when addAnother=true', async () => {
    const req = createPostRequest('/api/v1/maintenance', {
      ...validBody,
      addAnother: true,
    });
    const res = await POST(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{ redirect?: string; message: string }>(res);
    expect(body.redirect).toBe('create');
    expect(body.message).toContain('MR-AB12');
  });

  it('does NOT include redirect field when addAnother=false', async () => {
    const req = createPostRequest('/api/v1/maintenance', {
      ...validBody,
      addAnother: false,
    });
    const res = await POST(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{ redirect?: string }>(res);
    expect(body.redirect).toBeUndefined();
  });

  it('does NOT include redirect field when addAnother is omitted', async () => {
    const req = createPostRequest('/api/v1/maintenance', validBody);
    const res = await POST(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{ redirect?: string }>(res);
    expect(body.redirect).toBeUndefined();
  });

  it('still creates the maintenance request normally when addAnother=true', async () => {
    const req = createPostRequest('/api/v1/maintenance', {
      ...validBody,
      addAnother: true,
    });
    const res = await POST(req);
    expect(res.status).toBe(201);

    // Verify the create was called
    expect(mockCreate).toHaveBeenCalledTimes(1);
    const createData = mockCreate.mock.calls[0]![0].data;
    expect(createData.referenceNumber).toMatch(/^MR-[A-Z0-9]+$/);
    expect(createData.status).toBe('open');
  });

  it('returns data payload alongside redirect field', async () => {
    const req = createPostRequest('/api/v1/maintenance', {
      ...validBody,
      addAnother: true,
    });
    const res = await POST(req);

    const body = await parseResponse<{
      data: { id: string; referenceNumber: string };
      redirect: string;
    }>(res);
    expect(body.data).toBeDefined();
    expect(body.data.id).toBe('mr-1');
    expect(body.redirect).toBe('create');
  });
});
