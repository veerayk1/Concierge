/**
 * Roles API regression tests
 *
 * The Create Custom Role flow is a Day-1 admin task. If POST /api/v1/roles
 * comes back with anything other than 201 for a valid request, the property
 * admin sits in the dialog typing into a dead form.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createPostRequest, parseResponse } from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Mock setup
// ---------------------------------------------------------------------------

const mockRoleFindFirst = vi.fn();
const mockRoleCreate = vi.fn();
const mockRoleFindMany = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    role: {
      findFirst: (...args: unknown[]) => mockRoleFindFirst(...args),
      create: (...args: unknown[]) => mockRoleCreate(...args),
      findMany: (...args: unknown[]) => mockRoleFindMany(...args),
    },
  },
}));

const mockGuardRoute = vi.fn();

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: (...args: unknown[]) => mockGuardRoute(...args),
  enforcePropertyAccess: vi.fn().mockReturnValue(null),
}));

const PROPERTY_ID = '00000000-0000-4000-b000-000000000001';

function mockAdminAuth() {
  mockGuardRoute.mockResolvedValue({
    user: {
      userId: 'admin-id',
      propertyId: PROPERTY_ID,
      role: 'property_admin',
      permissions: ['*'],
      mfaVerified: false,
    },
    error: null,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  mockAdminAuth();
});

// ---------------------------------------------------------------------------
// POST /api/v1/roles
// ---------------------------------------------------------------------------

describe('POST /api/v1/roles', () => {
  it('creates a role with name + description and returns 201', async () => {
    mockRoleFindFirst.mockResolvedValueOnce(null); // no slug collision
    mockRoleCreate.mockResolvedValueOnce({
      id: 'new-role-id',
      name: 'Building Engineer',
      slug: 'building-engineer',
      description: 'Handles HVAC and elevator escalations.',
      isSystem: false,
      permissions: '["*"]',
    });

    const { POST } = await import('../route');
    const req = createPostRequest('/api/v1/roles', {
      propertyId: PROPERTY_ID,
      name: 'Building Engineer',
      description: 'Handles HVAC and elevator escalations.',
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
    const body = await parseResponse<{ data: { id: string; name: string } }>(res);
    expect(body.data.name).toBe('Building Engineer');
    expect(body.data.id).toBe('new-role-id');
    expect(mockRoleCreate).toHaveBeenCalledTimes(1);

    // permissions must default to the seed convention ["*"] when not supplied
    const createCall = mockRoleCreate.mock.calls[0]?.[0] as { data: { permissions: string } };
    expect(createCall.data.permissions).toBe('["*"]');
    expect(createCall.data.isSystem).toBe(false);
    expect(createCall.data.slug).toBe('building-engineer');
  });

  it('rejects too-short names with a 400 validation error', async () => {
    const { POST } = await import('../route');
    const req = createPostRequest('/api/v1/roles', {
      propertyId: PROPERTY_ID,
      name: 'A',
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string; message: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
    expect(body.message).toMatch(/at least 2 characters/i);
    expect(mockRoleCreate).not.toHaveBeenCalled();
  });

  it('rejects missing propertyId with a 400 validation error', async () => {
    const { POST } = await import('../route');
    const req = createPostRequest('/api/v1/roles', {
      name: 'Building Engineer',
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(mockRoleCreate).not.toHaveBeenCalled();
  });

  it('rejects non-UUID propertyId', async () => {
    const { POST } = await import('../route');
    const req = createPostRequest('/api/v1/roles', {
      propertyId: 'not-a-uuid',
      name: 'Building Engineer',
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    expect(mockRoleCreate).not.toHaveBeenCalled();
  });

  it('resolves slug collisions by appending -2, -3, etc.', async () => {
    // First two findFirst calls return existing roles (collision), third is free
    mockRoleFindFirst
      .mockResolvedValueOnce({ id: 'existing-1' })
      .mockResolvedValueOnce({ id: 'existing-2' })
      .mockResolvedValueOnce(null);
    mockRoleCreate.mockResolvedValueOnce({
      id: 'new-role-id',
      name: 'Building Engineer',
      slug: 'building-engineer-3',
      description: null,
      isSystem: false,
      permissions: '["*"]',
    });

    const { POST } = await import('../route');
    const req = createPostRequest('/api/v1/roles', {
      propertyId: PROPERTY_ID,
      name: 'Building Engineer',
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
    const createCall = mockRoleCreate.mock.calls[0]?.[0] as { data: { slug: string } };
    expect(createCall.data.slug).toBe('building-engineer-3');
  });

  it('accepts an explicit permissions array and stores it JSON-stringified', async () => {
    mockRoleFindFirst.mockResolvedValueOnce(null);
    mockRoleCreate.mockResolvedValueOnce({
      id: 'new-role-id',
      name: 'Building Engineer',
      slug: 'building-engineer',
      description: null,
      isSystem: false,
      permissions: '["events.view","events.create"]',
    });

    const { POST } = await import('../route');
    const req = createPostRequest('/api/v1/roles', {
      propertyId: PROPERTY_ID,
      name: 'Building Engineer',
      permissions: ['events.view', 'events.create'],
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
    const createCall = mockRoleCreate.mock.calls[0]?.[0] as { data: { permissions: string } };
    expect(createCall.data.permissions).toBe('["events.view","events.create"]');
  });

  it('returns 401 when guardRoute denies the request', async () => {
    mockGuardRoute.mockResolvedValueOnce({
      user: null,
      error: new Response(JSON.stringify({ error: 'UNAUTHORIZED' }), { status: 401 }),
    });

    const { POST } = await import('../route');
    const req = createPostRequest('/api/v1/roles', {
      propertyId: PROPERTY_ID,
      name: 'Building Engineer',
    });
    const res = await POST(req);

    expect(res.status).toBe(401);
    expect(mockRoleCreate).not.toHaveBeenCalled();
  });

  it('rejects names containing only non-alphanumeric characters', async () => {
    const { POST } = await import('../route');
    const req = createPostRequest('/api/v1/roles', {
      propertyId: PROPERTY_ID,
      name: '!!!',
    });
    const res = await POST(req);

    expect(res.status).toBe(400);
    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toMatch(/alphanumeric/i);
    expect(mockRoleCreate).not.toHaveBeenCalled();
  });
});
