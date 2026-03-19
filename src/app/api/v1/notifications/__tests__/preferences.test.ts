/**
 * Notification Preferences API Tests — per PRD 08 Section 3.1.8
 *
 * Users control which notifications they receive per channel.
 * Preferences are stored per user+property+module+channel.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createGetRequest, createPostRequest, parseResponse } from '@/test/helpers/api';

const mockFindMany = vi.fn();
const mockUpsert = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    notificationPreference: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      upsert: (...args: unknown[]) => mockUpsert(...args),
    },
  },
}));

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: vi.fn().mockResolvedValue({
    user: {
      userId: 'resident-1',
      propertyId: 'prop-1',
      role: 'resident_owner',
      permissions: ['*'],
      mfaVerified: false,
    },
    error: null,
  }),
}));

import { GET, PUT } from '../../notifications/preferences/route';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('GET /api/v1/notifications/preferences', () => {
  it('queries preferences for the authenticated user', async () => {
    mockFindMany.mockResolvedValue([]);

    const req = createGetRequest('/api/v1/notifications/preferences');
    const res = await GET(req);
    expect(res.status).toBe(200);

    expect(mockFindMany).toHaveBeenCalledOnce();
    const where = mockFindMany.mock.calls[0]![0].where;
    expect(where.userId).toBe('resident-1');
    expect(where.propertyId).toBe('prop-1');
  });

  it('returns preferences array in response data', async () => {
    mockFindMany.mockResolvedValue([
      { id: '1', module: 'packages', channel: 'email', enabled: true },
      { id: '2', module: 'packages', channel: 'sms', enabled: false },
    ]);

    const req = createGetRequest('/api/v1/notifications/preferences');
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { module: string; channel: string; enabled: boolean }[];
    }>(res);
    expect(body.data).toHaveLength(2);
    expect(body.data[0]!.module).toBe('packages');
    expect(body.data[0]!.enabled).toBe(true);
  });

  it('returns empty array when no preferences set yet', async () => {
    mockFindMany.mockResolvedValue([]);

    const req = createGetRequest('/api/v1/notifications/preferences');
    const res = await GET(req);
    const body = await parseResponse<{ data: unknown[] }>(res);
    expect(body.data).toEqual([]);
  });

  it('orders preferences by module then channel', async () => {
    mockFindMany.mockResolvedValue([]);

    const req = createGetRequest('/api/v1/notifications/preferences');
    await GET(req);

    const orderBy = mockFindMany.mock.calls[0]![0].orderBy;
    expect(orderBy).toEqual([{ module: 'asc' }, { channel: 'asc' }]);
  });
});

describe('PUT /api/v1/notifications/preferences', () => {
  it('upserts each preference for the authenticated user', async () => {
    mockUpsert.mockResolvedValue({ id: '1', module: 'packages', channel: 'email', enabled: true });

    const req = createPostRequest('/api/v1/notifications/preferences', {
      preferences: [{ module: 'packages', channel: 'email', enabled: true }],
    });
    // Override method to PUT
    Object.defineProperty(req, 'method', { value: 'PUT' });

    const res = await PUT(req);
    expect(res.status).toBe(200);

    expect(mockUpsert).toHaveBeenCalledOnce();
    const call = mockUpsert.mock.calls[0]![0];
    expect(call.where.userId_propertyId_module_channel.userId).toBe('resident-1');
    expect(call.create.module).toBe('packages');
    expect(call.create.channel).toBe('email');
    expect(call.create.enabled).toBe(true);
  });
});
