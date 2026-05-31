/**
 * Device Push Token Registration API Tests
 *
 * POST   /api/v1/users/me/devices — register/refresh a push token
 * DELETE /api/v1/users/me/devices — drop a token (own only)
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createPostRequest, createDeleteRequest, parseResponse } from '@/test/helpers/api';

const USER_ID = '00000000-0000-4000-a000-000000000001';
const TOKEN = 'ExponentPushToken[abcdefghijklmnopqrstuvwxyz]';

const mockUpsert = vi.fn();
const mockDeleteMany = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    devicePushToken: {
      upsert: (...args: unknown[]) => mockUpsert(...args),
      deleteMany: (...args: unknown[]) => mockDeleteMany(...args),
    },
  },
}));

const mockGuardRoute = vi.fn();
vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: (...args: unknown[]) => mockGuardRoute(...args),
}));

function setAuth() {
  mockGuardRoute.mockResolvedValue({
    user: { userId: USER_ID, propertyId: 'p1', role: 'resident_owner', permissions: [] },
    error: null,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  setAuth();
});

describe('POST /api/v1/users/me/devices', () => {
  it('registers a token (200) and upserts keyed on the token', async () => {
    mockUpsert.mockResolvedValue({ id: 'd1', platform: 'ios', createdAt: new Date() });
    const { POST } = await import('../route');
    const req = createPostRequest('/api/v1/users/me/devices', {
      platform: 'ios',
      token: TOKEN,
      deviceName: 'QA iPhone',
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const arg = mockUpsert.mock.calls[0]?.[0] as {
      where: { token: string };
      create: { userId: string };
    };
    expect(arg.where.token).toBe(TOKEN);
    expect(arg.create.userId).toBe(USER_ID);
  });

  it('rejects an invalid platform with 400', async () => {
    const { POST } = await import('../route');
    const req = createPostRequest('/api/v1/users/me/devices', {
      platform: 'blackberry',
      token: TOKEN,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('rejects a too-short token with 400', async () => {
    const { POST } = await import('../route');
    const req = createPostRequest('/api/v1/users/me/devices', { platform: 'ios', token: 'short' });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

describe('DELETE /api/v1/users/me/devices', () => {
  it('deletes own token, scoped to the caller (200, deleted:1)', async () => {
    mockDeleteMany.mockResolvedValue({ count: 1 });
    const { DELETE } = await import('../route');
    const req = createDeleteRequest('/api/v1/users/me/devices', { body: { token: TOKEN } });
    const res = await DELETE(req);
    expect(res.status).toBe(200);
    // Must scope the delete to the caller's userId — never delete another
    // user's token by guessing it.
    const arg = mockDeleteMany.mock.calls[0]?.[0] as { where: { token: string; userId: string } };
    expect(arg.where.userId).toBe(USER_ID);
    expect(arg.where.token).toBe(TOKEN);
    const body = await parseResponse<{ data: { deleted: number } }>(res);
    expect(body.data.deleted).toBe(1);
  });

  it('is idempotent — deleting a missing token returns 200 deleted:0', async () => {
    mockDeleteMany.mockResolvedValue({ count: 0 });
    const { DELETE } = await import('../route');
    const req = createDeleteRequest('/api/v1/users/me/devices', { body: { token: TOKEN } });
    const res = await DELETE(req);
    expect(res.status).toBe(200);
    const body = await parseResponse<{ data: { deleted: number } }>(res);
    expect(body.data.deleted).toBe(0);
  });
});
