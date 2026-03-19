/**
 * Package Release API Tests — per PRD 04 Section 3.1.2
 *
 * Package release is the most common front desk operation.
 * Target: <20 seconds for single-package release with signature.
 * Getting this wrong = lost packages, liability, angry residents.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createPatchRequest, createDeleteRequest, parseResponse } from '@/test/helpers/api';

const mockFindUnique = vi.fn();
const mockUpdate = vi.fn();
const mockHistoryCreate = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    package: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
    packageHistory: {
      create: (...args: unknown[]) => mockHistoryCreate(...args),
    },
  },
}));

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: vi.fn().mockResolvedValue({
    user: {
      userId: 'staff-mike',
      propertyId: '00000000-0000-4000-b000-000000000001',
      role: 'front_desk',
      permissions: ['*'],
      mfaVerified: false,
    },
    error: null,
  }),
}));

import { PATCH, DELETE } from '@/app/api/v1/packages/[id]/route';

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// PATCH /api/v1/packages/:id — Release
// ---------------------------------------------------------------------------

describe('Package Release — PATCH with action=release', () => {
  const params = Promise.resolve({ id: 'pkg-1' });

  it('requires releasedToName with at least 2 characters', async () => {
    const req = createPatchRequest('/api/v1/packages/pkg-1', {
      action: 'release',
      releasedToName: 'A',
    });
    const res = await PATCH(req, { params });
    expect(res.status).toBe(400);
  });

  it('sets releasedAt timestamp on release', async () => {
    mockUpdate.mockResolvedValue({ id: 'pkg-1', status: 'released' });
    mockHistoryCreate.mockResolvedValue({});

    const req = createPatchRequest('/api/v1/packages/pkg-1', {
      action: 'release',
      releasedToName: 'Janet Smith',
      idVerified: true,
    });
    const res = await PATCH(req, { params });

    expect(res.status).toBe(200);
    const updateData = mockUpdate.mock.calls[0]![0].data;
    expect(updateData.status).toBe('released');
    expect(updateData.releasedAt).toBeInstanceOf(Date);
    expect(updateData.releasedToName).toBe('Janet Smith');
  });

  it('records releasedById from authenticated user — audit trail', async () => {
    mockUpdate.mockResolvedValue({ id: 'pkg-1', status: 'released' });
    mockHistoryCreate.mockResolvedValue({});

    const req = createPatchRequest('/api/v1/packages/pkg-1', {
      action: 'release',
      releasedToName: 'Janet Smith',
    });
    await PATCH(req, { params });

    expect(mockUpdate.mock.calls[0]![0].data.releasedById).toBe('staff-mike');
  });

  it('stores idVerified flag — per building security policy', async () => {
    mockUpdate.mockResolvedValue({ id: 'pkg-1', status: 'released' });
    mockHistoryCreate.mockResolvedValue({});

    const req = createPatchRequest('/api/v1/packages/pkg-1', {
      action: 'release',
      releasedToName: 'Janet Smith',
      idVerified: true,
    });
    await PATCH(req, { params });

    expect(mockUpdate.mock.calls[0]![0].data.idVerified).toBe(true);
  });

  it('stores isAuthorizedDelegate flag — someone else picking up', async () => {
    mockUpdate.mockResolvedValue({ id: 'pkg-1', status: 'released' });
    mockHistoryCreate.mockResolvedValue({});

    const req = createPatchRequest('/api/v1/packages/pkg-1', {
      action: 'release',
      releasedToName: 'Tom Smith',
      isAuthorizedDelegate: true,
    });
    await PATCH(req, { params });

    expect(mockUpdate.mock.calls[0]![0].data.isAuthorizedDelegate).toBe(true);
  });

  it('creates PackageHistory entry on release — audit trail', async () => {
    mockUpdate.mockResolvedValue({ id: 'pkg-1', status: 'released' });
    mockHistoryCreate.mockResolvedValue({});

    const req = createPatchRequest('/api/v1/packages/pkg-1', {
      action: 'release',
      releasedToName: 'Janet Smith',
    });
    await PATCH(req, { params });

    expect(mockHistoryCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          packageId: 'pkg-1',
          action: 'released',
          details: expect.stringContaining('Janet Smith'),
        }),
      }),
    );
  });

  it('returns confirmation message with recipient name', async () => {
    mockUpdate.mockResolvedValue({ id: 'pkg-1', status: 'released' });
    mockHistoryCreate.mockResolvedValue({});

    const req = createPatchRequest('/api/v1/packages/pkg-1', {
      action: 'release',
      releasedToName: 'Janet Smith',
    });
    const res = await PATCH(req, { params });

    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('Janet Smith');
  });
});

// ---------------------------------------------------------------------------
// DELETE /api/v1/packages/:id — Soft Delete
// ---------------------------------------------------------------------------

describe('Package Delete — Soft Delete', () => {
  it('soft-deletes package (sets deletedAt, does NOT hard delete)', async () => {
    mockUpdate.mockResolvedValue({ id: 'pkg-1' });
    mockHistoryCreate.mockResolvedValue({});

    const req = createDeleteRequest('/api/v1/packages/pkg-1');
    const res = await DELETE(req, { params: Promise.resolve({ id: 'pkg-1' }) });

    expect(res.status).toBe(200);
    expect(mockUpdate.mock.calls[0]![0].data.deletedAt).toBeInstanceOf(Date);
  });

  it('logs deletion in PackageHistory', async () => {
    mockUpdate.mockResolvedValue({ id: 'pkg-1' });
    mockHistoryCreate.mockResolvedValue({});

    const req = createDeleteRequest('/api/v1/packages/pkg-1');
    await DELETE(req, { params: Promise.resolve({ id: 'pkg-1' }) });

    expect(mockHistoryCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          packageId: 'pkg-1',
          action: 'deleted',
        }),
      }),
    );
  });
});
