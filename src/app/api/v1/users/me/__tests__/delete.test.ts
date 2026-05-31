/**
 * Account Deletion API Tests — DELETE /api/v1/users/me
 *
 * App Store policy 5.1.1(v): in-app account deletion.
 * - Residents can self-delete (soft-delete + token revocation).
 * - Admin roles (super_admin / property_admin / property_manager) are
 *   blocked to avoid locking a building out.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createDeleteRequest, parseResponse } from '@/test/helpers/api';

const USER_ID = '00000000-0000-4000-a000-000000000001';

const mockUserUpdate = vi.fn();
const mockRefreshDeleteMany = vi.fn();
const mockDeviceDeleteMany = vi.fn();
const mockUserAuditCreate = vi.fn();

// $transaction invokes its callback with a tx that mirrors the prisma
// surface the DELETE handler touches.
const txMock = {
  user: { update: (...a: unknown[]) => mockUserUpdate(...a) },
  refreshToken: { deleteMany: (...a: unknown[]) => mockRefreshDeleteMany(...a) },
  devicePushToken: { deleteMany: (...a: unknown[]) => mockDeviceDeleteMany(...a) },
  userAudit: { create: (...a: unknown[]) => mockUserAuditCreate(...a) },
};

vi.mock('@/server/db', () => ({
  prisma: {
    // GET/PATCH handlers in the same module reference these; harmless stubs.
    user: { findUnique: vi.fn(), update: vi.fn() },
    occupancyRecord: { findFirst: vi.fn() },
    emergencyContact: { count: vi.fn() },
    $transaction: (cb: (tx: typeof txMock) => unknown) => cb(txMock),
  },
}));

const mockGuardRoute = vi.fn();
vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: (...args: unknown[]) => mockGuardRoute(...args),
}));

function setRole(role: string) {
  mockGuardRoute.mockResolvedValue({
    user: { userId: USER_ID, propertyId: 'p1', role, permissions: [] },
    error: null,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockUserUpdate.mockResolvedValue({ id: USER_ID });
  mockRefreshDeleteMany.mockResolvedValue({ count: 2 });
  mockDeviceDeleteMany.mockResolvedValue({ count: 1 });
  mockUserAuditCreate.mockResolvedValue({ id: 'audit-1' });
});

describe('DELETE /api/v1/users/me — resident self-delete', () => {
  it('soft-deletes the user, revokes tokens, drops push tokens (200)', async () => {
    setRole('resident_owner');
    const { DELETE } = await import('../route');
    const res = await DELETE(createDeleteRequest('/api/v1/users/me'));
    expect(res.status).toBe(200);

    // Soft-delete: deletedAt set, isActive false.
    const updateArg = mockUserUpdate.mock.calls[0]?.[0] as {
      where: { id: string };
      data: { deletedAt: Date; isActive: boolean };
    };
    expect(updateArg.where.id).toBe(USER_ID);
    expect(updateArg.data.deletedAt).toBeInstanceOf(Date);
    expect(updateArg.data.isActive).toBe(false);

    // Tokens revoked + push dropped.
    expect(mockRefreshDeleteMany).toHaveBeenCalledWith({ where: { userId: USER_ID } });
    expect(mockDeviceDeleteMany).toHaveBeenCalledWith({ where: { userId: USER_ID } });
  });

  it('writes a deletion audit record', async () => {
    setRole('resident_tenant');
    const { DELETE } = await import('../route');
    await DELETE(createDeleteRequest('/api/v1/users/me'));
    expect(mockUserAuditCreate).toHaveBeenCalled();
    const auditArg = mockUserAuditCreate.mock.calls[0]?.[0] as {
      data: { action: string; userId: string };
    };
    expect(auditArg.data.action).toBe('deleted');
    expect(auditArg.data.userId).toBe(USER_ID);
  });
});

describe('DELETE /api/v1/users/me — admin roles blocked', () => {
  it.each(['super_admin', 'property_admin', 'property_manager'])(
    'blocks %s with 403 ADMIN_SELF_DELETE_BLOCKED and does not touch the DB',
    async (role) => {
      setRole(role);
      const { DELETE } = await import('../route');
      const res = await DELETE(createDeleteRequest('/api/v1/users/me'));
      expect(res.status).toBe(403);
      const body = await parseResponse<{ error: string }>(res);
      expect(body.error).toBe('ADMIN_SELF_DELETE_BLOCKED');
      expect(mockUserUpdate).not.toHaveBeenCalled();
    },
  );
});
