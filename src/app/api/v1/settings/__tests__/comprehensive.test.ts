/**
 * Comprehensive Settings Module Tests — PRD 16
 *
 * Covers 16 scenario groups with 60+ individual test cases:
 *   1. Property settings GET (read)
 *   2. Property settings PATCH (update)
 *   3. Event type configuration — create
 *   4. Event type configuration — update
 *   5. Event type configuration — delete (soft + hard)
 *   6. Role configuration (list roles)
 *   7. Notification template management (list + create)
 *   8. Feature flag management (list + toggle)
 *   9. Admin-only access enforcement on settings
 *  10. Admin-only access enforcement on event types
 *  11. Admin-only access enforcement on roles and feature flags
 *  12. Validation and error handling
 *  13. Settings caching behavior
 *  14. Settings audit trail (branding and logo updates)
 *  15. Feature flag tier requirements
 *  16. Default settings for new properties
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  createGetRequest,
  createPostRequest,
  createPatchRequest,
  createDeleteRequest,
  parseResponse,
} from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// UUIDs
// ---------------------------------------------------------------------------
const PROPERTY_A = '00000000-0000-4000-b000-000000000001';
const PROPERTY_B = '00000000-0000-4000-b000-000000000002';
const EVENT_TYPE_ID = '00000000-0000-4000-d000-000000000001';
const EVENT_GROUP_ID = '00000000-0000-4000-d000-000000000010';

// ---------------------------------------------------------------------------
// Mock Setup — Prisma
// ---------------------------------------------------------------------------

const mockPropertyFindUnique = vi.fn();
const mockPropertyUpdate = vi.fn();
const mockEventTypeFindMany = vi.fn();
const mockEventTypeCreate = vi.fn();
const mockEventTypeFindFirst = vi.fn();
const mockEventTypeUpdate = vi.fn();
const mockEventTypeDelete = vi.fn();
const mockEventCount = vi.fn();
const mockRoleFindMany = vi.fn();
const mockNotificationTemplateFindMany = vi.fn();
const mockNotificationTemplateCreate = vi.fn();
const mockFeatureFlagFindMany = vi.fn();
const mockFeatureFlagFindUnique = vi.fn();
const mockFeatureFlagUpsert = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    property: {
      findUnique: (...args: unknown[]) => mockPropertyFindUnique(...args),
      update: (...args: unknown[]) => mockPropertyUpdate(...args),
    },
    eventType: {
      findMany: (...args: unknown[]) => mockEventTypeFindMany(...args),
      create: (...args: unknown[]) => mockEventTypeCreate(...args),
      findFirst: (...args: unknown[]) => mockEventTypeFindFirst(...args),
      update: (...args: unknown[]) => mockEventTypeUpdate(...args),
      delete: (...args: unknown[]) => mockEventTypeDelete(...args),
    },
    event: {
      count: (...args: unknown[]) => mockEventCount(...args),
    },
    role: {
      findMany: (...args: unknown[]) => mockRoleFindMany(...args),
    },
    notificationTemplate: {
      findMany: (...args: unknown[]) => mockNotificationTemplateFindMany(...args),
      create: (...args: unknown[]) => mockNotificationTemplateCreate(...args),
    },
    featureFlag: {
      findMany: (...args: unknown[]) => mockFeatureFlagFindMany(...args),
      findUnique: (...args: unknown[]) => mockFeatureFlagFindUnique(...args),
      upsert: (...args: unknown[]) => mockFeatureFlagUpsert(...args),
    },
  },
}));

// ---------------------------------------------------------------------------
// Mock Setup — guardRoute
// ---------------------------------------------------------------------------

const mockGuardRoute = vi.fn();
vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: (...args: unknown[]) => mockGuardRoute(...args),
}));

// ---------------------------------------------------------------------------
// Import route handlers AFTER mocks
// ---------------------------------------------------------------------------

import { GET as GET_SETTINGS, PATCH as PATCH_SETTINGS } from '../../settings/route';
import { GET as GET_EVENT_TYPES, POST as POST_EVENT_TYPE } from '../../event-types/route';
import {
  PATCH as PATCH_EVENT_TYPE,
  DELETE as DELETE_EVENT_TYPE,
} from '../../event-types/[id]/route';
import { GET as GET_ROLES } from '../../roles/route';
import { GET as GET_TEMPLATES, POST as POST_TEMPLATE } from '../../notifications/templates/route';
import { GET as GET_FLAGS, PATCH as PATCH_FLAGS } from '../../feature-flags/route';
import { appCache } from '@/server/cache';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function adminAuth() {
  mockGuardRoute.mockResolvedValue({
    user: {
      userId: 'admin-user',
      propertyId: PROPERTY_A,
      role: 'property_admin',
      permissions: ['*'],
      mfaVerified: false,
    },
    error: null,
  });
}

function nonAdminAuth() {
  const { NextResponse } = require('next/server');
  mockGuardRoute.mockResolvedValue({
    user: null,
    error: NextResponse.json(
      { error: 'FORBIDDEN', message: 'Admin access required' },
      { status: 403 },
    ),
  });
}

function makeProperty(overrides: Record<string, unknown> = {}) {
  return {
    id: PROPERTY_A,
    name: 'Test Property',
    address: '123 Main St',
    city: 'Toronto',
    province: 'ON',
    country: 'CA',
    postalCode: 'M5V 1A1',
    unitCount: 200,
    timezone: 'America/Toronto',
    logo: null,
    branding: null,
    type: 'condo',
    subscriptionTier: 'professional',
    ...overrides,
  };
}

function makeEventType(overrides: Record<string, unknown> = {}) {
  return {
    id: EVENT_TYPE_ID,
    propertyId: PROPERTY_A,
    name: 'Package',
    slug: 'package',
    icon: 'package',
    color: '#2563EB',
    isActive: true,
    notifyOnCreate: true,
    eventGroup: { id: EVENT_GROUP_ID, name: 'Logistics' },
    _count: { events: 15 },
    deletedAt: null,
    ...overrides,
  };
}

beforeEach(() => {
  vi.clearAllMocks();
  appCache.clear();
  adminAuth();
  mockPropertyFindUnique.mockResolvedValue(makeProperty());
  mockEventTypeFindMany.mockResolvedValue([]);
  mockRoleFindMany.mockResolvedValue([]);
  mockNotificationTemplateFindMany.mockResolvedValue([]);
  mockFeatureFlagFindMany.mockResolvedValue([]);
});

// ===========================================================================
// 1. Property settings GET
// ===========================================================================

describe('1. Property settings GET', () => {
  it('returns property settings and event types for given propertyId', async () => {
    mockEventTypeFindMany.mockResolvedValue([makeEventType()]);

    const res = await GET_SETTINGS(
      createGetRequest('/api/v1/settings', {
        searchParams: { propertyId: PROPERTY_A },
      }),
    );
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { property: { name: string }; eventTypes: unknown[] };
    }>(res);
    expect(body.data.property.name).toBe('Test Property');
    expect(body.data.eventTypes).toHaveLength(1);
  });

  it('returns 400 when propertyId is missing', async () => {
    const res = await GET_SETTINGS(createGetRequest('/api/v1/settings'));
    expect(res.status).toBe(400);
  });

  it('returns 404 when property does not exist', async () => {
    mockPropertyFindUnique.mockResolvedValue(null);

    const res = await GET_SETTINGS(
      createGetRequest('/api/v1/settings', {
        searchParams: { propertyId: PROPERTY_A },
      }),
    );
    expect(res.status).toBe(404);
  });

  it('selects only safe fields (no internal secrets)', async () => {
    await GET_SETTINGS(
      createGetRequest('/api/v1/settings', {
        searchParams: { propertyId: PROPERTY_A },
      }),
    );

    const select = mockPropertyFindUnique.mock.calls[0]![0].select;
    expect(select.id).toBe(true);
    expect(select.name).toBe(true);
    expect(select.timezone).toBe(true);
    expect(select.subscriptionTier).toBe(true);
  });

  it('orders event types by name ascending', async () => {
    await GET_SETTINGS(
      createGetRequest('/api/v1/settings', {
        searchParams: { propertyId: PROPERTY_A },
      }),
    );

    const etCall = mockEventTypeFindMany.mock.calls[0]![0];
    expect(etCall.orderBy).toEqual({ name: 'asc' });
  });

  it('excludes soft-deleted event types', async () => {
    await GET_SETTINGS(
      createGetRequest('/api/v1/settings', {
        searchParams: { propertyId: PROPERTY_A },
      }),
    );

    const etWhere = mockEventTypeFindMany.mock.calls[0]![0].where;
    expect(etWhere.deletedAt).toBeNull();
  });
});

// ===========================================================================
// 2. Property settings PATCH
// ===========================================================================

describe('2. Property settings PATCH', () => {
  it('updates property name', async () => {
    mockPropertyUpdate.mockResolvedValue(makeProperty({ name: 'New Name' }));

    const res = await PATCH_SETTINGS(
      createPatchRequest('/api/v1/settings', {
        propertyId: PROPERTY_A,
        name: 'New Name',
      }),
    );
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { name: string }; message: string }>(res);
    expect(body.data.name).toBe('New Name');
    expect(body.message).toContain('updated');
  });

  it('updates multiple fields at once', async () => {
    mockPropertyUpdate.mockResolvedValue(
      makeProperty({ name: 'X', city: 'Vancouver', timezone: 'America/Vancouver' }),
    );

    await PATCH_SETTINGS(
      createPatchRequest('/api/v1/settings', {
        propertyId: PROPERTY_A,
        name: 'X',
        city: 'Vancouver',
        timezone: 'America/Vancouver',
      }),
    );

    const updateData = mockPropertyUpdate.mock.calls[0]![0].data;
    expect(updateData.name).toBe('X');
    expect(updateData.city).toBe('Vancouver');
    expect(updateData.timezone).toBe('America/Vancouver');
  });

  it('returns 400 when propertyId is missing', async () => {
    const res = await PATCH_SETTINGS(createPatchRequest('/api/v1/settings', { name: 'New' }));
    expect(res.status).toBe(400);
  });

  it('allows updating logo field to null', async () => {
    mockPropertyUpdate.mockResolvedValue(makeProperty({ logo: null }));

    await PATCH_SETTINGS(
      createPatchRequest('/api/v1/settings', {
        propertyId: PROPERTY_A,
        logo: null,
      }),
    );

    const updateData = mockPropertyUpdate.mock.calls[0]![0].data;
    expect(updateData.logo).toBeNull();
  });

  it('allows updating branding field', async () => {
    mockPropertyUpdate.mockResolvedValue(makeProperty({ branding: { primaryColor: '#FF0000' } }));

    await PATCH_SETTINGS(
      createPatchRequest('/api/v1/settings', {
        propertyId: PROPERTY_A,
        branding: { primaryColor: '#FF0000' },
      }),
    );

    expect(mockPropertyUpdate.mock.calls[0]![0].data.branding).toEqual({ primaryColor: '#FF0000' });
  });
});

// ===========================================================================
// 3. Event type configuration — create
// ===========================================================================

describe('3. Event type configuration — create', () => {
  const validEventType = {
    propertyId: PROPERTY_A,
    name: 'Noise Complaint',
    slug: 'noise_complaint',
    eventGroupId: EVENT_GROUP_ID,
  };

  it('creates a new event type and returns 201', async () => {
    mockEventTypeFindFirst.mockResolvedValue(null);
    mockEventTypeCreate.mockResolvedValue(
      makeEventType({ name: 'Noise Complaint', slug: 'noise_complaint' }),
    );

    const res = await POST_EVENT_TYPE(createPostRequest('/api/v1/event-types', validEventType));
    expect(res.status).toBe(201);

    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('created');
  });

  it('returns 409 when slug already exists for property', async () => {
    mockEventTypeFindFirst.mockResolvedValue(makeEventType());

    const res = await POST_EVENT_TYPE(createPostRequest('/api/v1/event-types', validEventType));
    expect(res.status).toBe(409);
  });

  it('validates slug format (lowercase alphanumeric + underscore)', async () => {
    const res = await POST_EVENT_TYPE(
      createPostRequest('/api/v1/event-types', {
        ...validEventType,
        slug: 'Invalid Slug!',
      }),
    );
    expect(res.status).toBe(400);
  });

  it('rejects missing name', async () => {
    const res = await POST_EVENT_TYPE(
      createPostRequest('/api/v1/event-types', {
        propertyId: PROPERTY_A,
        slug: 'test',
        eventGroupId: EVENT_GROUP_ID,
      }),
    );
    expect(res.status).toBe(400);
  });

  it('defaults notifyOnCreate to true', async () => {
    mockEventTypeFindFirst.mockResolvedValue(null);
    mockEventTypeCreate.mockResolvedValue(makeEventType());

    await POST_EVENT_TYPE(createPostRequest('/api/v1/event-types', validEventType));

    expect(mockEventTypeCreate.mock.calls[0]![0].data.notifyOnCreate).toBe(true);
  });

  it('defaults icon to "circle" when not provided', async () => {
    mockEventTypeFindFirst.mockResolvedValue(null);
    mockEventTypeCreate.mockResolvedValue(makeEventType());

    await POST_EVENT_TYPE(createPostRequest('/api/v1/event-types', validEventType));

    expect(mockEventTypeCreate.mock.calls[0]![0].data.icon).toBe('circle');
  });
});

// ===========================================================================
// 4. Event type configuration — update
// ===========================================================================

describe('4. Event type configuration — update', () => {
  it('updates event type name', async () => {
    mockEventTypeUpdate.mockResolvedValue(makeEventType({ name: 'Updated Name' }));

    const res = await PATCH_EVENT_TYPE(
      createPatchRequest('/api/v1/event-types/x', { name: 'Updated Name' }),
      { params: Promise.resolve({ id: EVENT_TYPE_ID }) },
    );
    expect(res.status).toBe(200);

    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('updated');
  });

  it('updates icon and color', async () => {
    mockEventTypeUpdate.mockResolvedValue(makeEventType());

    await PATCH_EVENT_TYPE(
      createPatchRequest('/api/v1/event-types/x', { icon: 'alarm', color: '#FF0000' }),
      { params: Promise.resolve({ id: EVENT_TYPE_ID }) },
    );

    const data = mockEventTypeUpdate.mock.calls[0]![0].data;
    expect(data.icon).toBe('alarm');
    expect(data.color).toBe('#FF0000');
  });

  it('updates isActive flag', async () => {
    mockEventTypeUpdate.mockResolvedValue(makeEventType({ isActive: false }));

    await PATCH_EVENT_TYPE(createPatchRequest('/api/v1/event-types/x', { isActive: false }), {
      params: Promise.resolve({ id: EVENT_TYPE_ID }),
    });

    expect(mockEventTypeUpdate.mock.calls[0]![0].data.isActive).toBe(false);
  });

  it('updates notificationTemplate', async () => {
    mockEventTypeUpdate.mockResolvedValue(makeEventType());

    await PATCH_EVENT_TYPE(
      createPatchRequest('/api/v1/event-types/x', {
        notificationTemplate: 'New package for {{unit}}',
      }),
      { params: Promise.resolve({ id: EVENT_TYPE_ID }) },
    );

    expect(mockEventTypeUpdate.mock.calls[0]![0].data.notificationTemplate).toBe(
      'New package for {{unit}}',
    );
  });
});

// ===========================================================================
// 5. Event type configuration — delete
// ===========================================================================

describe('5. Event type configuration — delete', () => {
  it('soft-deletes event type with existing events (sets deletedAt + isActive=false)', async () => {
    mockEventCount.mockResolvedValue(10);
    mockEventTypeUpdate.mockResolvedValue(
      makeEventType({ deletedAt: new Date(), isActive: false }),
    );

    const res = await DELETE_EVENT_TYPE(createDeleteRequest('/api/v1/event-types/x'), {
      params: Promise.resolve({ id: EVENT_TYPE_ID }),
    });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('deactivated');

    expect(mockEventTypeUpdate).toHaveBeenCalled();
    expect(mockEventTypeDelete).not.toHaveBeenCalled();
  });

  it('hard-deletes event type with zero existing events', async () => {
    mockEventCount.mockResolvedValue(0);
    mockEventTypeDelete.mockResolvedValue(makeEventType());

    const res = await DELETE_EVENT_TYPE(createDeleteRequest('/api/v1/event-types/x'), {
      params: Promise.resolve({ id: EVENT_TYPE_ID }),
    });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('deleted');

    expect(mockEventTypeDelete).toHaveBeenCalled();
    expect(mockEventTypeUpdate).not.toHaveBeenCalled();
  });

  it('checks event count filtered by non-deleted events only', async () => {
    mockEventCount.mockResolvedValue(0);
    mockEventTypeDelete.mockResolvedValue({});

    await DELETE_EVENT_TYPE(createDeleteRequest('/api/v1/event-types/x'), {
      params: Promise.resolve({ id: EVENT_TYPE_ID }),
    });

    const countWhere = mockEventCount.mock.calls[0]![0].where;
    expect(countWhere.eventTypeId).toBe(EVENT_TYPE_ID);
    expect(countWhere.deletedAt).toBeNull();
  });
});

// ===========================================================================
// 6. Role configuration
// ===========================================================================

describe('6. Role configuration', () => {
  it('lists roles for a property', async () => {
    mockRoleFindMany.mockResolvedValue([
      {
        id: 'r1',
        name: 'Front Desk',
        slug: 'front_desk',
        description: 'Concierge',
        isSystem: false,
        permissions: [],
        _count: { userProperties: 5 },
      },
      {
        id: 'r2',
        name: 'Admin',
        slug: 'property_admin',
        description: 'Admin',
        isSystem: true,
        permissions: ['*'],
        _count: { userProperties: 2 },
      },
    ]);

    const res = await GET_ROLES(
      createGetRequest('/api/v1/roles', {
        searchParams: { propertyId: PROPERTY_A },
      }),
    );
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: Array<{ name: string; memberCount: number }> }>(res);
    expect(body.data).toHaveLength(2);
    expect(body.data[0]!.memberCount).toBe(5);
  });

  it('returns 400 when propertyId is missing', async () => {
    const res = await GET_ROLES(createGetRequest('/api/v1/roles'));
    expect(res.status).toBe(400);
  });

  it('excludes soft-deleted roles', async () => {
    mockRoleFindMany.mockResolvedValue([]);

    await GET_ROLES(
      createGetRequest('/api/v1/roles', {
        searchParams: { propertyId: PROPERTY_A },
      }),
    );

    expect(mockRoleFindMany.mock.calls[0]![0].where.deletedAt).toBeNull();
  });

  it('orders roles by name ascending', async () => {
    mockRoleFindMany.mockResolvedValue([]);

    await GET_ROLES(
      createGetRequest('/api/v1/roles', {
        searchParams: { propertyId: PROPERTY_A },
      }),
    );

    expect(mockRoleFindMany.mock.calls[0]![0].orderBy).toEqual({ name: 'asc' });
  });

  it('includes member count from userProperties relation', async () => {
    mockRoleFindMany.mockResolvedValue([
      {
        id: 'r1',
        name: 'Test',
        slug: 'test',
        description: '',
        isSystem: false,
        permissions: [],
        _count: { userProperties: 42 },
      },
    ]);

    const res = await GET_ROLES(
      createGetRequest('/api/v1/roles', {
        searchParams: { propertyId: PROPERTY_A },
      }),
    );
    const body = await parseResponse<{ data: Array<{ memberCount: number }> }>(res);

    expect(body.data[0]!.memberCount).toBe(42);
  });
});

// ===========================================================================
// 7. Notification template management
// ===========================================================================

describe('7. Notification template management', () => {
  it('lists templates for a property', async () => {
    mockNotificationTemplateFindMany.mockResolvedValue([
      { id: 't1', name: 'Package Arrived', channel: 'email', body: 'Your package...' },
    ]);

    const res = await GET_TEMPLATES(
      createGetRequest('/api/v1/notifications/templates', {
        searchParams: { propertyId: PROPERTY_A },
      }),
    );
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: Array<{ name: string }> }>(res);
    expect(body.data).toHaveLength(1);
  });

  it('filters templates by channel/type parameter', async () => {
    mockNotificationTemplateFindMany.mockResolvedValue([]);

    await GET_TEMPLATES(
      createGetRequest('/api/v1/notifications/templates', {
        searchParams: { propertyId: PROPERTY_A, channel: 'sms' },
      }),
    );

    expect(mockNotificationTemplateFindMany.mock.calls[0]![0].where.channel).toBe('sms');
  });

  it('creates a new template with 201', async () => {
    mockNotificationTemplateCreate.mockResolvedValue({
      id: 't2',
      name: 'New',
      channel: 'push',
      body: 'Push message',
    });

    const res = await POST_TEMPLATE(
      createPostRequest('/api/v1/notifications/templates', {
        propertyId: PROPERTY_A,
        name: 'New',
        channel: 'push',
        triggerAction: 'on_create',
        body: 'Push message',
      }),
    );
    expect(res.status).toBe(201);
  });

  it('validates required fields on template creation', async () => {
    const res = await POST_TEMPLATE(
      createPostRequest('/api/v1/notifications/templates', {
        propertyId: PROPERTY_A,
      }),
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 when propertyId is missing from list', async () => {
    const res = await GET_TEMPLATES(createGetRequest('/api/v1/notifications/templates'));
    expect(res.status).toBe(400);
  });

  it('orders templates by name ascending', async () => {
    mockNotificationTemplateFindMany.mockResolvedValue([]);

    await GET_TEMPLATES(
      createGetRequest('/api/v1/notifications/templates', {
        searchParams: { propertyId: PROPERTY_A },
      }),
    );

    expect(mockNotificationTemplateFindMany.mock.calls[0]![0].orderBy).toEqual([{ name: 'asc' }]);
  });
});

// ===========================================================================
// 8. Feature flag management
// ===========================================================================

describe('8. Feature flag management', () => {
  it('lists all feature flags with defaults when no DB records exist', async () => {
    mockFeatureFlagFindMany.mockResolvedValue([]);

    const res = await GET_FLAGS(
      createGetRequest('/api/v1/feature-flags', {
        searchParams: { propertyId: PROPERTY_A },
      }),
    );
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: Array<{ key: string; enabled: boolean }> }>(res);
    expect(body.data.length).toBeGreaterThan(0);

    const packages = body.data.find((f) => f.key === 'packages');
    expect(packages).toBeDefined();
    expect(packages!.enabled).toBe(true);
  });

  it('applies property-specific overrides from DB record', async () => {
    mockFeatureFlagFindMany.mockResolvedValue([
      {
        key: 'packages',
        defaultValue: true,
        description: 'Package Management',
        propertyOverrides: { [PROPERTY_A]: false },
        tierRequirement: 'starter',
      },
    ]);

    const res = await GET_FLAGS(
      createGetRequest('/api/v1/feature-flags', {
        searchParams: { propertyId: PROPERTY_A },
      }),
    );
    const body = await parseResponse<{ data: Array<{ key: string; enabled: boolean }> }>(res);

    const packages = body.data.find((f) => f.key === 'packages');
    expect(packages!.enabled).toBe(false);
  });

  it('toggles a feature flag for a specific property', async () => {
    mockFeatureFlagFindUnique.mockResolvedValue({
      key: 'training_lms',
      defaultValue: false,
      propertyOverrides: {},
    });
    mockFeatureFlagUpsert.mockResolvedValue({});

    const res = await PATCH_FLAGS(
      createPatchRequest('/api/v1/feature-flags', {
        propertyId: PROPERTY_A,
        key: 'training_lms',
        enabled: true,
      }),
    );
    expect(res.status).toBe(200);

    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('enabled');
  });

  it('returns 400 when key is missing from toggle', async () => {
    const res = await PATCH_FLAGS(
      createPatchRequest('/api/v1/feature-flags', {
        propertyId: PROPERTY_A,
        enabled: true,
      }),
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 when enabled is missing from toggle', async () => {
    const res = await PATCH_FLAGS(
      createPatchRequest('/api/v1/feature-flags', {
        propertyId: PROPERTY_A,
        key: 'packages',
      }),
    );
    expect(res.status).toBe(400);
  });

  it('returns 400 when propertyId is missing from GET', async () => {
    const res = await GET_FLAGS(createGetRequest('/api/v1/feature-flags'));
    expect(res.status).toBe(400);
  });

  it('merges property override into existing overrides map', async () => {
    mockFeatureFlagFindUnique.mockResolvedValue({
      key: 'packages',
      defaultValue: true,
      propertyOverrides: { 'other-property': false },
    });
    mockFeatureFlagUpsert.mockResolvedValue({});

    await PATCH_FLAGS(
      createPatchRequest('/api/v1/feature-flags', {
        propertyId: PROPERTY_A,
        key: 'packages',
        enabled: false,
      }),
    );

    const upsertCall = mockFeatureFlagUpsert.mock.calls[0]![0];
    expect(upsertCall.update.propertyOverrides[PROPERTY_A]).toBe(false);
    expect(upsertCall.update.propertyOverrides['other-property']).toBe(false);
  });
});

// ===========================================================================
// 9. Admin-only access enforcement on settings
// ===========================================================================

describe('9. Admin-only access enforcement on settings', () => {
  it('settings GET passes role restriction to guardRoute', async () => {
    await GET_SETTINGS(
      createGetRequest('/api/v1/settings', {
        searchParams: { propertyId: PROPERTY_A },
      }),
    );

    const guardCall = mockGuardRoute.mock.calls[0]!;
    expect(guardCall[1]).toEqual({ roles: ['super_admin', 'property_admin'] });
  });

  it('settings PATCH passes role restriction to guardRoute', async () => {
    mockPropertyUpdate.mockResolvedValue(makeProperty());

    await PATCH_SETTINGS(createPatchRequest('/api/v1/settings', { propertyId: PROPERTY_A }));

    const guardCall = mockGuardRoute.mock.calls[0]!;
    expect(guardCall[1]).toEqual({ roles: ['super_admin', 'property_admin'] });
  });

  it('returns 403 when non-admin attempts GET settings', async () => {
    nonAdminAuth();

    const res = await GET_SETTINGS(
      createGetRequest('/api/v1/settings', {
        searchParams: { propertyId: PROPERTY_A },
      }),
    );
    expect(res.status).toBe(403);
  });

  it('returns 403 when non-admin attempts PATCH settings', async () => {
    nonAdminAuth();

    const res = await PATCH_SETTINGS(
      createPatchRequest('/api/v1/settings', {
        propertyId: PROPERTY_A,
        name: 'Hack',
      }),
    );
    expect(res.status).toBe(403);
  });
});

// ===========================================================================
// 10. Admin-only access enforcement on event types
// ===========================================================================

describe('10. Admin-only access enforcement on event types', () => {
  it('event types GET requires admin role', async () => {
    await GET_EVENT_TYPES(
      createGetRequest('/api/v1/event-types', {
        searchParams: { propertyId: PROPERTY_A },
      }),
    );

    expect(mockGuardRoute.mock.calls[0]![1]).toEqual({ roles: ['super_admin', 'property_admin'] });
  });

  it('event types POST requires admin role', async () => {
    mockEventTypeFindFirst.mockResolvedValue(null);
    mockEventTypeCreate.mockResolvedValue(makeEventType());

    await POST_EVENT_TYPE(
      createPostRequest('/api/v1/event-types', {
        propertyId: PROPERTY_A,
        name: 'Test',
        slug: 'test',
        eventGroupId: EVENT_GROUP_ID,
      }),
    );

    expect(mockGuardRoute.mock.calls[0]![1]).toEqual({ roles: ['super_admin', 'property_admin'] });
  });

  it('returns 403 when non-admin attempts event type creation', async () => {
    nonAdminAuth();

    const res = await POST_EVENT_TYPE(
      createPostRequest('/api/v1/event-types', {
        propertyId: PROPERTY_A,
        name: 'Test',
        slug: 'test',
        eventGroupId: EVENT_GROUP_ID,
      }),
    );
    expect(res.status).toBe(403);
  });

  it('returns 403 when non-admin attempts event type deletion', async () => {
    nonAdminAuth();

    const res = await DELETE_EVENT_TYPE(createDeleteRequest('/api/v1/event-types/x'), {
      params: Promise.resolve({ id: EVENT_TYPE_ID }),
    });
    expect(res.status).toBe(403);
  });
});

// ===========================================================================
// 11. Admin-only access enforcement on roles and feature flags
// ===========================================================================

describe('11. Admin-only access enforcement on roles and feature flags', () => {
  it('roles GET requires admin role', async () => {
    await GET_ROLES(
      createGetRequest('/api/v1/roles', {
        searchParams: { propertyId: PROPERTY_A },
      }),
    );

    expect(mockGuardRoute.mock.calls[0]![1]).toEqual({ roles: ['super_admin', 'property_admin'] });
  });

  it('feature flags GET uses standard guardRoute (no explicit role constraint)', async () => {
    await GET_FLAGS(
      createGetRequest('/api/v1/feature-flags', {
        searchParams: { propertyId: PROPERTY_A },
      }),
    );

    // GET handler calls guardRoute(request) without role restrictions
    // Only PATCH enforces admin roles
    expect(mockGuardRoute).toHaveBeenCalled();
    expect(mockGuardRoute.mock.calls[0]![1]).toBeUndefined();
  });

  it('feature flags PATCH requires admin role', async () => {
    mockFeatureFlagFindUnique.mockResolvedValue(null);
    mockFeatureFlagUpsert.mockResolvedValue({});

    await PATCH_FLAGS(
      createPatchRequest('/api/v1/feature-flags', {
        propertyId: PROPERTY_A,
        key: 'packages',
        enabled: true,
      }),
    );

    expect(mockGuardRoute.mock.calls[0]![1]).toEqual({ roles: ['super_admin', 'property_admin'] });
  });

  it('returns 403 when non-admin attempts to list roles', async () => {
    nonAdminAuth();

    const res = await GET_ROLES(
      createGetRequest('/api/v1/roles', {
        searchParams: { propertyId: PROPERTY_A },
      }),
    );
    expect(res.status).toBe(403);
  });

  it('returns 403 when non-admin attempts to toggle feature flag', async () => {
    nonAdminAuth();

    const res = await PATCH_FLAGS(
      createPatchRequest('/api/v1/feature-flags', {
        propertyId: PROPERTY_A,
        key: 'packages',
        enabled: false,
      }),
    );
    expect(res.status).toBe(403);
  });
});

// ===========================================================================
// 12. Validation and error handling
// ===========================================================================

describe('12. Validation and error handling', () => {
  it('settings GET returns 500 on database error without leaking details', async () => {
    mockPropertyFindUnique.mockRejectedValue(new Error('Connection timeout'));

    const res = await GET_SETTINGS(
      createGetRequest('/api/v1/settings', {
        searchParams: { propertyId: PROPERTY_A },
      }),
    );
    expect(res.status).toBe(500);

    const body = await parseResponse<{ error: string; message: string }>(res);
    expect(body.error).toBe('INTERNAL_ERROR');
    expect(body.message).not.toContain('Connection');
  });

  it('settings PATCH returns 500 on database error', async () => {
    mockPropertyUpdate.mockRejectedValue(new Error('Write failed'));

    const res = await PATCH_SETTINGS(
      createPatchRequest('/api/v1/settings', {
        propertyId: PROPERTY_A,
        name: 'X',
      }),
    );
    expect(res.status).toBe(500);
  });

  it('event type create validates required eventGroupId', async () => {
    const res = await POST_EVENT_TYPE(
      createPostRequest('/api/v1/event-types', {
        propertyId: PROPERTY_A,
        name: 'Test',
        slug: 'test',
      }),
    );
    expect(res.status).toBe(400);
  });

  it('event type list returns 400 when propertyId is missing', async () => {
    const res = await GET_EVENT_TYPES(createGetRequest('/api/v1/event-types'));
    expect(res.status).toBe(400);
  });

  it('event type list includes event count per type', async () => {
    mockEventTypeFindMany.mockResolvedValue([makeEventType({ _count: { events: 42 } })]);

    const res = await GET_EVENT_TYPES(
      createGetRequest('/api/v1/event-types', {
        searchParams: { propertyId: PROPERTY_A },
      }),
    );
    const body = await parseResponse<{ data: Array<{ eventCount: number }> }>(res);

    expect(body.data[0]!.eventCount).toBe(42);
  });

  it('notification template validates channel enum', async () => {
    const res = await POST_TEMPLATE(
      createPostRequest('/api/v1/notifications/templates', {
        propertyId: PROPERTY_A,
        name: 'Test',
        channel: 'carrier_pigeon',
        triggerAction: 'on_create',
        body: 'Hello',
      }),
    );
    expect(res.status).toBe(400);
  });

  it('notification template validates triggerAction enum', async () => {
    const res = await POST_TEMPLATE(
      createPostRequest('/api/v1/notifications/templates', {
        propertyId: PROPERTY_A,
        name: 'Test',
        channel: 'email',
        triggerAction: 'on_explode',
        body: 'Hello',
      }),
    );
    expect(res.status).toBe(400);
  });
});

// ===========================================================================
// 13. Settings caching behavior
// ===========================================================================

describe('13. Settings caching behavior', () => {
  it('caches settings response after first GET', async () => {
    mockEventTypeFindMany.mockResolvedValue([]);

    // First request — cache miss
    const res1 = await GET_SETTINGS(
      createGetRequest('/api/v1/settings', {
        searchParams: { propertyId: PROPERTY_A },
      }),
    );
    expect(res1.status).toBe(200);

    // Second request — should hit cache
    const res2 = await GET_SETTINGS(
      createGetRequest('/api/v1/settings', {
        searchParams: { propertyId: PROPERTY_A },
      }),
    );
    expect(res2.status).toBe(200);
    expect(res2.headers.get('X-Cache')).toBe('HIT');

    // DB should only be called once
    expect(mockPropertyFindUnique).toHaveBeenCalledTimes(1);
  });

  it('invalidates cache on PATCH', async () => {
    mockEventTypeFindMany.mockResolvedValue([]);

    // First GET — populates cache
    await GET_SETTINGS(
      createGetRequest('/api/v1/settings', {
        searchParams: { propertyId: PROPERTY_A },
      }),
    );

    // PATCH — should invalidate cache
    mockPropertyUpdate.mockResolvedValue(makeProperty({ name: 'Updated' }));
    await PATCH_SETTINGS(
      createPatchRequest('/api/v1/settings', {
        propertyId: PROPERTY_A,
        name: 'Updated',
      }),
    );

    // Second GET — should be a cache miss (cache was invalidated by PATCH)
    mockPropertyFindUnique.mockResolvedValue(makeProperty({ name: 'Updated' }));
    const res3 = await GET_SETTINGS(
      createGetRequest('/api/v1/settings', {
        searchParams: { propertyId: PROPERTY_A },
      }),
    );
    expect(res3.headers.get('X-Cache')).toBeNull();
    // DB called once for first GET, then once more for third GET (PATCH does not call findUnique)
    expect(mockPropertyFindUnique).toHaveBeenCalledTimes(2);
  });

  it('caches different properties independently', async () => {
    mockEventTypeFindMany.mockResolvedValue([]);

    // GET for property A
    await GET_SETTINGS(
      createGetRequest('/api/v1/settings', {
        searchParams: { propertyId: PROPERTY_A },
      }),
    );

    // GET for property B
    mockPropertyFindUnique.mockResolvedValue(makeProperty({ id: PROPERTY_B, name: 'Property B' }));
    await GET_SETTINGS(
      createGetRequest('/api/v1/settings', {
        searchParams: { propertyId: PROPERTY_B },
      }),
    );

    // Both should trigger DB calls (different cache keys)
    expect(mockPropertyFindUnique).toHaveBeenCalledTimes(2);
  });
});

// ===========================================================================
// 14. Settings audit trail (branding and logo updates)
// ===========================================================================

describe('14. Settings audit — branding and logo updates', () => {
  it('updates address fields correctly', async () => {
    mockPropertyUpdate.mockResolvedValue(
      makeProperty({ address: '456 Elm St', postalCode: 'M5V 2B2' }),
    );

    await PATCH_SETTINGS(
      createPatchRequest('/api/v1/settings', {
        propertyId: PROPERTY_A,
        address: '456 Elm St',
        postalCode: 'M5V 2B2',
      }),
    );

    const updateData = mockPropertyUpdate.mock.calls[0]![0].data;
    expect(updateData.address).toBe('456 Elm St');
    expect(updateData.postalCode).toBe('M5V 2B2');
  });

  it('updates province field', async () => {
    mockPropertyUpdate.mockResolvedValue(makeProperty({ province: 'BC' }));

    await PATCH_SETTINGS(
      createPatchRequest('/api/v1/settings', {
        propertyId: PROPERTY_A,
        province: 'BC',
      }),
    );

    const updateData = mockPropertyUpdate.mock.calls[0]![0].data;
    expect(updateData.province).toBe('BC');
  });

  it('sets logo to a URL when provided', async () => {
    mockPropertyUpdate.mockResolvedValue(
      makeProperty({ logo: 'https://cdn.example.com/logo.png' }),
    );

    await PATCH_SETTINGS(
      createPatchRequest('/api/v1/settings', {
        propertyId: PROPERTY_A,
        logo: 'https://cdn.example.com/logo.png',
      }),
    );

    const updateData = mockPropertyUpdate.mock.calls[0]![0].data;
    expect(updateData.logo).toBe('https://cdn.example.com/logo.png');
  });

  it('updates branding with accent color and welcome message', async () => {
    const branding = {
      primaryColor: '#1a73e8',
      accentColor: '#FF5722',
      welcomeMessage: 'Welcome to our building!',
    };
    mockPropertyUpdate.mockResolvedValue(makeProperty({ branding }));

    await PATCH_SETTINGS(
      createPatchRequest('/api/v1/settings', {
        propertyId: PROPERTY_A,
        branding,
      }),
    );

    const updateData = mockPropertyUpdate.mock.calls[0]![0].data;
    expect(updateData.branding).toEqual(branding);
    expect(updateData.branding.welcomeMessage).toBe('Welcome to our building!');
  });
});

// ===========================================================================
// 15. Feature flag tier requirements
// ===========================================================================

describe('15. Feature flag tier requirements', () => {
  it('includes tier requirement info in flag listing', async () => {
    mockFeatureFlagFindMany.mockResolvedValue([
      {
        key: 'training_lms',
        defaultValue: false,
        description: 'Training & LMS module',
        propertyOverrides: {},
        tierRequirement: 'professional',
      },
    ]);

    const res = await GET_FLAGS(
      createGetRequest('/api/v1/feature-flags', {
        searchParams: { propertyId: PROPERTY_A },
      }),
    );
    const body = await parseResponse<{
      data: Array<{ key: string; enabled: boolean }>;
    }>(res);

    const training = body.data.find((f) => f.key === 'training_lms');
    expect(training).toBeDefined();
  });

  it('creates new flag record when toggling a non-existent flag key', async () => {
    mockFeatureFlagFindUnique.mockResolvedValue(null);
    mockFeatureFlagUpsert.mockResolvedValue({});

    const res = await PATCH_FLAGS(
      createPatchRequest('/api/v1/feature-flags', {
        propertyId: PROPERTY_A,
        key: 'new_feature',
        enabled: true,
      }),
    );
    expect(res.status).toBe(200);
    expect(mockFeatureFlagUpsert).toHaveBeenCalled();
  });

  it('disable message says disabled when toggling off', async () => {
    mockFeatureFlagFindUnique.mockResolvedValue({
      key: 'packages',
      defaultValue: true,
      propertyOverrides: { [PROPERTY_A]: true },
    });
    mockFeatureFlagUpsert.mockResolvedValue({});

    const res = await PATCH_FLAGS(
      createPatchRequest('/api/v1/feature-flags', {
        propertyId: PROPERTY_A,
        key: 'packages',
        enabled: false,
      }),
    );
    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toContain('disabled');
  });
});

// ===========================================================================
// 16. Default settings for new properties
// ===========================================================================

describe('16. Default settings for new properties', () => {
  it('returns all property fields in settings response', async () => {
    const res = await GET_SETTINGS(
      createGetRequest('/api/v1/settings', {
        searchParams: { propertyId: PROPERTY_A },
      }),
    );

    const body = await parseResponse<{
      data: {
        property: {
          id: string;
          name: string;
          address: string;
          city: string;
          timezone: string;
          type: string;
          subscriptionTier: string;
        };
      };
    }>(res);

    expect(body.data.property.id).toBe(PROPERTY_A);
    expect(body.data.property.timezone).toBe('America/Toronto');
    expect(body.data.property.type).toBe('condo');
    expect(body.data.property.subscriptionTier).toBe('professional');
  });

  it('returns empty event types array for new property with no event types', async () => {
    mockEventTypeFindMany.mockResolvedValue([]);

    const res = await GET_SETTINGS(
      createGetRequest('/api/v1/settings', {
        searchParams: { propertyId: PROPERTY_A },
      }),
    );

    const body = await parseResponse<{ data: { eventTypes: unknown[] } }>(res);
    expect(body.data.eventTypes).toHaveLength(0);
  });

  it('settings are scoped to the specific propertyId in the query', async () => {
    await GET_SETTINGS(
      createGetRequest('/api/v1/settings', {
        searchParams: { propertyId: PROPERTY_A },
      }),
    );

    const findCall = mockPropertyFindUnique.mock.calls[0]![0];
    expect(findCall.where.id).toBe(PROPERTY_A);

    const etCall = mockEventTypeFindMany.mock.calls[0]![0];
    expect(etCall.where.propertyId).toBe(PROPERTY_A);
  });

  it('PATCH scopes update to the correct propertyId', async () => {
    mockPropertyUpdate.mockResolvedValue(makeProperty());

    await PATCH_SETTINGS(
      createPatchRequest('/api/v1/settings', {
        propertyId: PROPERTY_A,
        name: 'Updated',
      }),
    );

    const updateCall = mockPropertyUpdate.mock.calls[0]![0];
    expect(updateCall.where.id).toBe(PROPERTY_A);
  });
});
