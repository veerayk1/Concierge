/**
 * Event Type Email Configuration API Tests — per PRD 03 + 16
 *
 * Covers:
 * - GET /api/v1/event-types/email-config (retrieve config)
 * - POST /api/v1/event-types/email-config (create/update config)
 * - PUT /api/v1/event-types/email-config (alias for POST)
 * - Email validation
 * - Auto-CC address management
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  createGetRequest,
  createPostRequest,
  createPutRequest,
  parseResponse,
} from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Mock Setup
// ---------------------------------------------------------------------------

const mockFindUnique = vi.fn();
const mockUpsert = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    eventTypeEmailConfig: {
      findUnique: (...args: unknown[]) => mockFindUnique(...args),
      upsert: (...args: unknown[]) => mockUpsert(...args),
    },
  },
}));

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: vi.fn().mockResolvedValue({
    user: {
      userId: 'test-admin',
      propertyId: '00000000-0000-4000-b000-000000000001',
      role: 'property_admin',
      permissions: ['*'],
      mfaVerified: false,
    },
    error: null,
  }),
}));

import { GET, POST, PUT } from '../route';

const PROPERTY_A = '00000000-0000-4000-b000-000000000001';
const EVENT_TYPE_A = '00000000-0000-4000-d000-000000000001';
const EVENT_TYPE_B = '00000000-0000-4000-d000-000000000002';

beforeEach(() => {
  vi.clearAllMocks();
  mockFindUnique.mockResolvedValue(null);
});

// ---------------------------------------------------------------------------
// GET /api/v1/event-types/email-config — Retrieval
// ---------------------------------------------------------------------------

describe('GET /api/v1/event-types/email-config — Retrieval', () => {
  it('rejects without propertyId', async () => {
    const req = createGetRequest('/api/v1/event-types/email-config', {
      searchParams: { eventTypeId: EVENT_TYPE_A },
    });
    const res = await GET(req);
    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_PROPERTY');
  });

  it('rejects without eventTypeId', async () => {
    const req = createGetRequest('/api/v1/event-types/email-config', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await GET(req);
    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_EVENT_TYPE');
  });

  it('returns 404 when no config exists', async () => {
    mockFindUnique.mockResolvedValue(null);
    const req = createGetRequest('/api/v1/event-types/email-config', {
      searchParams: { propertyId: PROPERTY_A, eventTypeId: EVENT_TYPE_A },
    });
    const res = await GET(req);
    expect(res.status).toBe(404);
  });

  it('returns config for event type', async () => {
    const mockConfig = {
      id: 'cfg-1',
      propertyId: PROPERTY_A,
      eventTypeId: EVENT_TYPE_A,
      fromAddress: 'noreply@example.com',
      fromName: 'Building Alerts',
      autoCcAddresses: ['manager@example.com'],
      replyToAddress: 'support@example.com',
      isActive: true,
      eventType: { id: EVENT_TYPE_A, name: 'Package Arrival', slug: 'package_arrival' },
    };
    mockFindUnique.mockResolvedValue(mockConfig);

    const req = createGetRequest('/api/v1/event-types/email-config', {
      searchParams: { propertyId: PROPERTY_A, eventTypeId: EVENT_TYPE_A },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: typeof mockConfig }>(res);
    expect(body.data.fromAddress).toBe('noreply@example.com');
    expect(body.data.fromName).toBe('Building Alerts');
    expect(body.data.autoCcAddresses).toEqual(['manager@example.com']);
    expect(body.data.eventType.name).toBe('Package Arrival');
  });

  it('uses composite key for lookup', async () => {
    mockFindUnique.mockResolvedValue(null);
    const req = createGetRequest('/api/v1/event-types/email-config', {
      searchParams: { propertyId: PROPERTY_A, eventTypeId: EVENT_TYPE_A },
    });
    await GET(req);

    const where = mockFindUnique.mock.calls[0]![0].where;
    expect(where.propertyId_eventTypeId).toEqual({
      propertyId: PROPERTY_A,
      eventTypeId: EVENT_TYPE_A,
    });
  });
});

// ---------------------------------------------------------------------------
// POST /api/v1/event-types/email-config — Create / Update
// ---------------------------------------------------------------------------

describe('POST /api/v1/event-types/email-config — Create', () => {
  it('creates email config with valid data', async () => {
    const created = {
      id: 'cfg-new',
      propertyId: PROPERTY_A,
      eventTypeId: EVENT_TYPE_A,
      fromAddress: 'alerts@building.com',
      fromName: 'Building Manager',
      autoCcAddresses: [],
      replyToAddress: null,
      isActive: true,
    };
    mockUpsert.mockResolvedValue(created);

    const req = createPostRequest('/api/v1/event-types/email-config', {
      propertyId: PROPERTY_A,
      eventTypeId: EVENT_TYPE_A,
      fromAddress: 'alerts@building.com',
      fromName: 'Building Manager',
    });
    const res = await POST(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: typeof created; message: string }>(res);
    expect(body.data.fromAddress).toBe('alerts@building.com');
    expect(body.message).toContain('saved');
  });

  it('creates config with auto-CC addresses', async () => {
    mockUpsert.mockResolvedValue({ id: 'cfg-1' });

    const req = createPostRequest('/api/v1/event-types/email-config', {
      propertyId: PROPERTY_A,
      eventTypeId: EVENT_TYPE_A,
      autoCcAddresses: ['admin@building.com', 'security@building.com'],
    });
    const res = await POST(req);
    expect(res.status).toBe(200);

    const createData = mockUpsert.mock.calls[0]![0].create;
    expect(createData.autoCcAddresses).toEqual(['admin@building.com', 'security@building.com']);
  });

  it('uses upsert to handle create-or-update semantics', async () => {
    mockUpsert.mockResolvedValue({ id: 'cfg-1' });

    const req = createPostRequest('/api/v1/event-types/email-config', {
      propertyId: PROPERTY_A,
      eventTypeId: EVENT_TYPE_A,
      fromAddress: 'new@building.com',
    });
    await POST(req);

    expect(mockUpsert).toHaveBeenCalledTimes(1);
    const call = mockUpsert.mock.calls[0]![0];
    expect(call.where.propertyId_eventTypeId).toEqual({
      propertyId: PROPERTY_A,
      eventTypeId: EVENT_TYPE_A,
    });
    expect(call.create.fromAddress).toBe('new@building.com');
    expect(call.update.fromAddress).toBe('new@building.com');
  });
});

// ---------------------------------------------------------------------------
// PUT /api/v1/event-types/email-config — Alias
// ---------------------------------------------------------------------------

describe('PUT /api/v1/event-types/email-config — Update Alias', () => {
  it('PUT delegates to POST handler', async () => {
    mockUpsert.mockResolvedValue({ id: 'cfg-1' });

    const req = createPutRequest('/api/v1/event-types/email-config', {
      propertyId: PROPERTY_A,
      eventTypeId: EVENT_TYPE_A,
      fromName: 'Updated Name',
    });
    const res = await PUT(req);
    expect(res.status).toBe(200);
    expect(mockUpsert).toHaveBeenCalledTimes(1);
  });
});

// ---------------------------------------------------------------------------
// POST /api/v1/event-types/email-config — Email Validation
// ---------------------------------------------------------------------------

describe('POST /api/v1/event-types/email-config — Email Validation', () => {
  it('rejects invalid fromAddress', async () => {
    const req = createPostRequest('/api/v1/event-types/email-config', {
      propertyId: PROPERTY_A,
      eventTypeId: EVENT_TYPE_A,
      fromAddress: 'not-an-email',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string; fields: Record<string, unknown> }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('rejects invalid replyToAddress', async () => {
    const req = createPostRequest('/api/v1/event-types/email-config', {
      propertyId: PROPERTY_A,
      eventTypeId: EVENT_TYPE_A,
      replyToAddress: 'bad@',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects invalid auto-CC addresses', async () => {
    const req = createPostRequest('/api/v1/event-types/email-config', {
      propertyId: PROPERTY_A,
      eventTypeId: EVENT_TYPE_A,
      autoCcAddresses: ['valid@example.com', 'invalid-addr'],
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects more than 10 auto-CC addresses', async () => {
    const addresses = Array.from({ length: 11 }, (_, i) => `user${i}@example.com`);
    const req = createPostRequest('/api/v1/event-types/email-config', {
      propertyId: PROPERTY_A,
      eventTypeId: EVENT_TYPE_A,
      autoCcAddresses: addresses,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('accepts valid email addresses in all fields', async () => {
    mockUpsert.mockResolvedValue({ id: 'cfg-1' });

    const req = createPostRequest('/api/v1/event-types/email-config', {
      propertyId: PROPERTY_A,
      eventTypeId: EVENT_TYPE_A,
      fromAddress: 'from@example.com',
      replyToAddress: 'reply@example.com',
      autoCcAddresses: ['cc1@example.com', 'cc2@example.com'],
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// POST /api/v1/event-types/email-config — Error Handling
// ---------------------------------------------------------------------------

describe('POST /api/v1/event-types/email-config — Error Handling', () => {
  it('handles database errors gracefully', async () => {
    mockUpsert.mockRejectedValue(new Error('Foreign key constraint'));
    const req = createPostRequest('/api/v1/event-types/email-config', {
      propertyId: PROPERTY_A,
      eventTypeId: EVENT_TYPE_A,
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).not.toContain('Foreign key');
  });

  it('rejects missing propertyId', async () => {
    const req = createPostRequest('/api/v1/event-types/email-config', {
      eventTypeId: EVENT_TYPE_A,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects missing eventTypeId', async () => {
    const req = createPostRequest('/api/v1/event-types/email-config', {
      propertyId: PROPERTY_A,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});
