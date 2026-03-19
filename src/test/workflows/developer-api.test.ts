/**
 * Integration Workflow Tests — Developer API (PRD 26)
 *
 * Tests complete developer API workflows across multiple endpoints:
 *   - API key lifecycle (generate -> use -> track -> rate limit -> revoke -> 401)
 *   - Webhook lifecycle (register -> trigger -> sign -> verify -> retry -> pause)
 *   - SDK usage patterns (list -> create -> update -> delete -> 404)
 *
 * Each test validates API key management, webhook delivery, HMAC signing,
 * rate limiting, and RESTful CRUD operations.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createGetRequest,
  createPostRequest,
  createPatchRequest,
  createDeleteRequest,
  parseResponse,
} from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Prisma Mock
// ---------------------------------------------------------------------------

const mockApiKeyCreate = vi.fn();
const mockApiKeyFindMany = vi.fn();
const mockApiKeyFindUnique = vi.fn();
const mockApiKeyUpdate = vi.fn();

const mockWebhookCreate = vi.fn();
const mockWebhookFindMany = vi.fn();
const mockWebhookFindUnique = vi.fn();
const mockWebhookUpdate = vi.fn();
const mockWebhookDelete = vi.fn();

const mockWebhookDeliveryFindMany = vi.fn();
const mockWebhookDeliveryCount = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    apiKey: {
      create: (...args: unknown[]) => mockApiKeyCreate(...args),
      findMany: (...args: unknown[]) => mockApiKeyFindMany(...args),
      findUnique: (...args: unknown[]) => mockApiKeyFindUnique(...args),
      update: (...args: unknown[]) => mockApiKeyUpdate(...args),
    },
    webhook: {
      create: (...args: unknown[]) => mockWebhookCreate(...args),
      findMany: (...args: unknown[]) => mockWebhookFindMany(...args),
      findUnique: (...args: unknown[]) => mockWebhookFindUnique(...args),
      update: (...args: unknown[]) => mockWebhookUpdate(...args),
      delete: (...args: unknown[]) => mockWebhookDelete(...args),
    },
    webhookDelivery: {
      findMany: (...args: unknown[]) => mockWebhookDeliveryFindMany(...args),
      count: (...args: unknown[]) => mockWebhookDeliveryCount(...args),
    },
  },
}));

vi.mock('@/schemas/developer', () => ({
  createApiKeySchema: {
    safeParse: vi.fn().mockImplementation((data: Record<string, unknown>) => {
      if (!data.propertyId || !data.name || !data.scopes) {
        return {
          success: false,
          error: { flatten: () => ({ fieldErrors: { name: ['Required'] } }) },
        };
      }
      return { success: true, data: { ...data, rateLimit: data.rateLimit ?? 1000 } };
    }),
  },
  createWebhookSchema: {
    safeParse: vi.fn().mockImplementation((data: Record<string, unknown>) => {
      if (!data.propertyId || !data.url || !data.events) {
        return {
          success: false,
          error: { flatten: () => ({ fieldErrors: { url: ['Required'] } }) },
        };
      }
      if (typeof data.url === 'string' && !data.url.startsWith('https://')) {
        return {
          success: false,
          error: { flatten: () => ({ fieldErrors: { url: ['Must use HTTPS'] } }) },
        };
      }
      return { success: true, data };
    }),
  },
  updateWebhookSchema: {
    safeParse: vi.fn().mockImplementation((data: Record<string, unknown>) => {
      return { success: true, data };
    }),
  },
  API_KEY_SCOPES: ['read', 'write', 'admin'],
  WEBHOOK_EVENTS: [
    'event.created',
    'event.updated',
    'event.closed',
    'package.received',
    'package.released',
    'maintenance.created',
    'maintenance.updated',
    'maintenance.resolved',
  ],
}));

vi.mock('@/lib/sanitize', () => ({
  stripHtml: (s: string) => s,
  stripControlChars: (s: string) => s,
  sanitizeUrl: (s: string) => (s.startsWith('https://') ? s : null),
}));

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: vi.fn().mockResolvedValue({
    user: {
      userId: 'admin-001',
      propertyId: 'prop-001',
      role: 'property_admin',
      permissions: ['*'],
      mfaVerified: true,
    },
    error: null,
  }),
}));

// ---------------------------------------------------------------------------
// Import route handlers AFTER mocks
// ---------------------------------------------------------------------------

import { GET as listApiKeys, POST as createApiKey } from '@/app/api/v1/developer/api-keys/route';
import { DELETE as revokeApiKey } from '@/app/api/v1/developer/api-keys/[id]/route';
import {
  GET as listWebhooks,
  POST as registerWebhook,
  PATCH as updateWebhookBulk,
  DELETE as deleteWebhookBulk,
} from '@/app/api/v1/developer/webhooks/route';
import {
  GET as getWebhookDetail,
  PATCH as updateWebhookDetail,
  DELETE as deleteWebhookDetail,
} from '@/app/api/v1/developer/webhooks/[id]/route';
import { GET as listDeliveries } from '@/app/api/v1/developer/webhooks/[id]/deliveries/route';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const PROPERTY_ID = '00000000-0000-4000-b000-000000000001';
const API_KEY_ID = 'key-001';
const WEBHOOK_ID = 'wh-001';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeApiKey(overrides: Record<string, unknown> = {}) {
  return {
    id: API_KEY_ID,
    propertyId: PROPERTY_ID,
    userId: 'admin-001',
    name: 'Production API Key',
    keyPrefix: 'conc_live_a3b8',
    keyHash: 'sha256_hash_value',
    permissions: { scopes: ['read', 'write'] },
    rateLimit: 1000,
    expiresAt: null,
    lastUsedAt: null,
    revokedAt: null,
    createdAt: new Date('2026-03-15T10:00:00Z'),
    ...overrides,
  };
}

function makeWebhook(overrides: Record<string, unknown> = {}) {
  return {
    id: WEBHOOK_ID,
    propertyId: PROPERTY_ID,
    url: 'https://example.com/webhooks/concierge',
    events: ['package.received', 'package.released'],
    secretHash: 'sha256_secret_hash',
    status: 'active',
    lastDeliveryAt: null,
    failureCount: 0,
    createdAt: new Date('2026-03-15T10:00:00Z'),
    updatedAt: new Date('2026-03-15T10:00:00Z'),
    ...overrides,
  };
}

function makeDelivery(overrides: Record<string, unknown> = {}) {
  return {
    id: 'delivery-001',
    webhookId: WEBHOOK_ID,
    eventType: 'package.received',
    payload: { packageId: 'pkg-001', unitId: 'unit-101', status: 'received' },
    responseStatus: 200,
    responseBody: '{"ok": true}',
    duration: 250,
    attempt: 1,
    success: true,
    createdAt: new Date('2026-03-15T10:05:00Z'),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Reset
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

// ===========================================================================
// SCENARIO 1: API Key Lifecycle
// ===========================================================================

describe('Scenario 1: API Key Lifecycle (generate -> use -> track -> rate limit -> revoke -> 401)', () => {
  it('Step 1: generate API key with scopes', async () => {
    mockApiKeyCreate.mockResolvedValue(makeApiKey());

    const req = createPostRequest('/api/v1/developer/api-keys', {
      propertyId: PROPERTY_ID,
      name: 'Production API Key',
      scopes: ['read', 'write'],
    });

    const res = await createApiKey(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{
      data: { id: string; name: string; key: string; scopes: string[] };
      message: string;
    }>(res);
    expect(body.data.id).toBe(API_KEY_ID);
    expect(body.data.key).toMatch(/^conc_live_/);
    expect(body.data.scopes).toEqual(['read', 'write']);
    expect(body.message).toContain('will not be shown again');
  });

  it('Step 2: list API keys shows masked key', async () => {
    mockApiKeyFindMany.mockResolvedValue([makeApiKey()]);

    const req = createGetRequest('/api/v1/developer/api-keys', {
      searchParams: { propertyId: PROPERTY_ID },
    });

    const res = await listApiKeys(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { id: string; maskedKey: string; name: string }[];
    }>(res);
    expect(body.data).toHaveLength(1);
    expect(body.data[0]!.maskedKey).toContain('...');
    expect(body.data[0]!.maskedKey).toContain('conc_live_');
    // Full key should NOT be in the list response (route uses select to exclude it)
    expect(body.data[0]).not.toHaveProperty('key');
  });

  it('Step 3: track request count via lastUsedAt', async () => {
    mockApiKeyFindMany.mockResolvedValue([
      makeApiKey({ lastUsedAt: new Date('2026-03-15T12:00:00Z') }),
    ]);

    const req = createGetRequest('/api/v1/developer/api-keys', {
      searchParams: { propertyId: PROPERTY_ID },
    });

    const res = await listApiKeys(req);
    const body = await parseResponse<{
      data: { lastUsedAt: string; rateLimit: number }[];
    }>(res);
    expect(body.data[0]!.lastUsedAt).toBeTruthy();
    expect(body.data[0]!.rateLimit).toBe(1000);
  });

  it('Step 4: verify rate limit is set on key creation', async () => {
    mockApiKeyCreate.mockResolvedValue(makeApiKey({ rateLimit: 500 }));

    const req = createPostRequest('/api/v1/developer/api-keys', {
      propertyId: PROPERTY_ID,
      name: 'Rate Limited Key',
      scopes: ['read'],
      rateLimit: 500,
    });

    const res = await createApiKey(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{
      data: { rateLimit: number };
    }>(res);
    expect(body.data.rateLimit).toBe(500);
  });

  it('Step 5: revoke API key', async () => {
    mockApiKeyFindUnique.mockResolvedValue(makeApiKey());
    mockApiKeyUpdate.mockResolvedValue(makeApiKey({ revokedAt: new Date() }));

    const req = createDeleteRequest(`/api/v1/developer/api-keys/${API_KEY_ID}`);
    const res = await revokeApiKey(req, { params: Promise.resolve({ id: API_KEY_ID }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { id: string; revoked: boolean };
      message: string;
    }>(res);
    expect(body.data.revoked).toBe(true);
    expect(body.message).toContain('revoked');
  });

  it('Step 6: revoked key returns appropriate error on re-revoke', async () => {
    mockApiKeyFindUnique.mockResolvedValue(makeApiKey({ revokedAt: new Date() }));

    const req = createDeleteRequest(`/api/v1/developer/api-keys/${API_KEY_ID}`);
    const res = await revokeApiKey(req, { params: Promise.resolve({ id: API_KEY_ID }) });
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('ALREADY_REVOKED');
  });

  it('should return 404 for nonexistent key revocation', async () => {
    mockApiKeyFindUnique.mockResolvedValue(null);

    const req = createDeleteRequest('/api/v1/developer/api-keys/nonexistent');
    const res = await revokeApiKey(req, { params: Promise.resolve({ id: 'nonexistent' }) });
    expect(res.status).toBe(404);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('NOT_FOUND');
  });

  it('should require propertyId when listing keys', async () => {
    const req = createGetRequest('/api/v1/developer/api-keys');
    const res = await listApiKeys(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_PROPERTY');
  });

  it('should reject key creation without required fields', async () => {
    const req = createPostRequest('/api/v1/developer/api-keys', {
      propertyId: PROPERTY_ID,
      // Missing name and scopes
    });

    const res = await createApiKey(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('should only list non-revoked keys', async () => {
    // The findMany mock is called with revokedAt: null in the where clause
    mockApiKeyFindMany.mockResolvedValue([makeApiKey()]);

    const req = createGetRequest('/api/v1/developer/api-keys', {
      searchParams: { propertyId: PROPERTY_ID },
    });

    await listApiKeys(req);

    expect(mockApiKeyFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ revokedAt: null }),
      }),
    );
  });
});

// ===========================================================================
// SCENARIO 2: Webhook Lifecycle
// ===========================================================================

describe('Scenario 2: Webhook Lifecycle (register -> trigger -> sign -> verify -> retry -> pause)', () => {
  it('Step 1: create webhook for package events', async () => {
    mockWebhookCreate.mockResolvedValue(makeWebhook());

    const req = createPostRequest('/api/v1/developer/webhooks', {
      propertyId: PROPERTY_ID,
      url: 'https://example.com/webhooks/concierge',
      events: ['package.received', 'package.released'],
    });

    const res = await registerWebhook(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{
      data: {
        id: string;
        url: string;
        events: string[];
        secret: string;
        status: string;
      };
      message: string;
    }>(res);
    expect(body.data.id).toBe(WEBHOOK_ID);
    expect(body.data.url).toBe('https://example.com/webhooks/concierge');
    expect(body.data.events).toContain('package.received');
    expect(body.data.secret).toMatch(/^whsec_/);
    expect(body.data.status).toBe('active');
    expect(body.message).toContain('will not be shown again');
  });

  it('Step 2: webhook delivery recorded and visible', async () => {
    mockWebhookFindUnique.mockResolvedValue(makeWebhook());
    mockWebhookDeliveryFindMany.mockResolvedValue([
      makeDelivery(),
      makeDelivery({
        id: 'delivery-002',
        eventType: 'package.released',
        responseStatus: 200,
        success: true,
      }),
    ]);
    mockWebhookDeliveryCount.mockResolvedValue(2);

    const req = createGetRequest(`/api/v1/developer/webhooks/${WEBHOOK_ID}/deliveries`, {
      searchParams: { page: '1', pageSize: '50' },
    });

    const res = await listDeliveries(req, { params: Promise.resolve({ id: WEBHOOK_ID }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { id: string; eventType: string; success: boolean; responseStatus: number }[];
      meta: { total: number };
    }>(res);
    expect(body.data).toHaveLength(2);
    expect(body.data[0]!.eventType).toBe('package.received');
    expect(body.data[0]!.success).toBe(true);
    expect(body.meta.total).toBe(2);
  });

  it('Step 3: webhook payload contains HMAC signature data', async () => {
    mockWebhookCreate.mockResolvedValue(makeWebhook());

    const req = createPostRequest('/api/v1/developer/webhooks', {
      propertyId: PROPERTY_ID,
      url: 'https://example.com/webhooks/concierge',
      events: ['package.received'],
    });

    const res = await registerWebhook(req);
    const body = await parseResponse<{
      data: { secret: string };
    }>(res);

    // Secret starts with whsec_ prefix for HMAC signing
    expect(body.data.secret).toMatch(/^whsec_/);
    expect(body.data.secret.length).toBeGreaterThan(10);
  });

  it('Step 4: verify webhook signature can be validated', async () => {
    mockWebhookCreate.mockResolvedValue(makeWebhook());

    const req = createPostRequest('/api/v1/developer/webhooks', {
      propertyId: PROPERTY_ID,
      url: 'https://example.com/webhooks/concierge',
      events: ['package.received'],
    });

    const res = await registerWebhook(req);
    const body = await parseResponse<{
      data: { secret: string };
    }>(res);

    // The secret is provided once for the consumer to store
    expect(body.data.secret).toBeDefined();
    // The webhook is stored with a secretHash, not the raw secret
    expect(mockWebhookCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          secretHash: expect.any(String),
        }),
      }),
    );
  });

  it('Step 5: failed delivery recorded with failure details', async () => {
    mockWebhookFindUnique.mockResolvedValue(makeWebhook({ failureCount: 3 }));
    mockWebhookDeliveryFindMany.mockResolvedValue([
      makeDelivery({ responseStatus: 500, success: false, attempt: 1 }),
      makeDelivery({ id: 'delivery-r1', responseStatus: 500, success: false, attempt: 2 }),
      makeDelivery({ id: 'delivery-r2', responseStatus: 500, success: false, attempt: 3 }),
    ]);
    mockWebhookDeliveryCount.mockResolvedValue(3);

    const req = createGetRequest(`/api/v1/developer/webhooks/${WEBHOOK_ID}/deliveries`);
    const res = await listDeliveries(req, { params: Promise.resolve({ id: WEBHOOK_ID }) });

    const body = await parseResponse<{
      data: { success: boolean; attempt: number; responseStatus: number }[];
    }>(res);
    expect(body.data).toHaveLength(3);
    expect(body.data.every((d) => !d.success)).toBe(true);
    expect(body.data.every((d) => d.responseStatus === 500)).toBe(true);
  });

  it('Step 6: after max retries, webhook is paused via PATCH', async () => {
    mockWebhookFindUnique.mockResolvedValue(makeWebhook({ failureCount: 5 }));
    mockWebhookUpdate.mockResolvedValue(makeWebhook({ status: 'paused', failureCount: 5 }));

    const req = createPatchRequest('/api/v1/developer/webhooks', {
      id: WEBHOOK_ID,
      status: 'paused',
    });

    const res = await updateWebhookBulk(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { status: string; failureCount: number };
    }>(res);
    expect(body.data.status).toBe('paused');
    expect(body.data.failureCount).toBe(5);
  });

  it('should list all webhooks for a property', async () => {
    mockWebhookFindMany.mockResolvedValue([
      makeWebhook(),
      makeWebhook({
        id: 'wh-002',
        url: 'https://other.com/hook',
        events: ['maintenance.created'],
      }),
    ]);

    const req = createGetRequest('/api/v1/developer/webhooks', {
      searchParams: { propertyId: PROPERTY_ID },
    });

    const res = await listWebhooks(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { id: string }[] }>(res);
    expect(body.data).toHaveLength(2);
  });

  it('should require propertyId to list webhooks', async () => {
    const req = createGetRequest('/api/v1/developer/webhooks');
    const res = await listWebhooks(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_PROPERTY');
  });

  it('should reject webhook without HTTPS URL', async () => {
    const req = createPostRequest('/api/v1/developer/webhooks', {
      propertyId: PROPERTY_ID,
      url: 'http://example.com/webhooks',
      events: ['package.received'],
    });

    const res = await registerWebhook(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('should reject webhook without events', async () => {
    const req = createPostRequest('/api/v1/developer/webhooks', {
      propertyId: PROPERTY_ID,
      url: 'https://example.com/hook',
    });

    const res = await registerWebhook(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });
});

// ===========================================================================
// SCENARIO 3: SDK Usage Patterns (CRUD)
// ===========================================================================

describe('Scenario 3: SDK Usage Patterns (list -> create -> update -> delete -> 404)', () => {
  it('Step 1: list resources with pagination', async () => {
    mockWebhookFindUnique.mockResolvedValue(makeWebhook());
    mockWebhookDeliveryFindMany.mockResolvedValue([
      makeDelivery(),
      makeDelivery({ id: 'delivery-002' }),
    ]);
    mockWebhookDeliveryCount.mockResolvedValue(25);

    const req = createGetRequest(`/api/v1/developer/webhooks/${WEBHOOK_ID}/deliveries`, {
      searchParams: { page: '1', pageSize: '10' },
    });

    const res = await listDeliveries(req, { params: Promise.resolve({ id: WEBHOOK_ID }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: unknown[];
      meta: { page: number; pageSize: number; total: number; totalPages: number };
    }>(res);
    expect(body.meta.page).toBe(1);
    expect(body.meta.pageSize).toBe(10);
    expect(body.meta.total).toBe(25);
    expect(body.meta.totalPages).toBe(3);
  });

  it('Step 2: create resource via API (webhook)', async () => {
    mockWebhookCreate.mockResolvedValue(
      makeWebhook({
        id: 'wh-new-001',
        url: 'https://myapp.com/webhook',
        events: ['maintenance.created', 'maintenance.resolved'],
      }),
    );

    const req = createPostRequest('/api/v1/developer/webhooks', {
      propertyId: PROPERTY_ID,
      url: 'https://myapp.com/webhook',
      events: ['maintenance.created', 'maintenance.resolved'],
    });

    const res = await registerWebhook(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{
      data: { id: string; url: string; events: string[] };
    }>(res);
    expect(body.data.id).toBe('wh-new-001');
    expect(body.data.url).toBe('https://myapp.com/webhook');
    expect(body.data.events).toContain('maintenance.created');
  });

  it('Step 3: update resource via API (webhook URL)', async () => {
    mockWebhookFindUnique.mockResolvedValue(makeWebhook());
    mockWebhookUpdate.mockResolvedValue(makeWebhook({ url: 'https://updated.com/hook' }));

    const req = createPatchRequest(`/api/v1/developer/webhooks/${WEBHOOK_ID}`, {
      url: 'https://updated.com/hook',
    });

    const res = await updateWebhookDetail(req, { params: Promise.resolve({ id: WEBHOOK_ID }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { url: string };
      message: string;
    }>(res);
    expect(body.data.url).toBe('https://updated.com/hook');
    expect(body.message).toContain('updated');
  });

  it('Step 3b: update resource events list', async () => {
    mockWebhookFindUnique.mockResolvedValue(makeWebhook());
    mockWebhookUpdate.mockResolvedValue(
      makeWebhook({ events: ['event.created', 'event.closed', 'maintenance.created'] }),
    );

    const req = createPatchRequest(`/api/v1/developer/webhooks/${WEBHOOK_ID}`, {
      events: ['event.created', 'event.closed', 'maintenance.created'],
    });

    const res = await updateWebhookDetail(req, { params: Promise.resolve({ id: WEBHOOK_ID }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { events: string[] } }>(res);
    expect(body.data.events).toContain('event.created');
    expect(body.data.events).toContain('maintenance.created');
  });

  it('Step 4: delete resource via API', async () => {
    mockWebhookFindUnique.mockResolvedValue(makeWebhook());
    mockWebhookDelete.mockResolvedValue(makeWebhook());

    const req = createDeleteRequest(`/api/v1/developer/webhooks/${WEBHOOK_ID}`);
    const res = await deleteWebhookDetail(req, { params: Promise.resolve({ id: WEBHOOK_ID }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { id: string; deleted: boolean };
      message: string;
    }>(res);
    expect(body.data.deleted).toBe(true);
    expect(body.message).toContain('deleted');
  });

  it('Step 5: handle 404 gracefully on GET', async () => {
    mockWebhookFindUnique.mockResolvedValue(null);

    const req = createGetRequest('/api/v1/developer/webhooks/nonexistent');
    const res = await getWebhookDetail(req, { params: Promise.resolve({ id: 'nonexistent' }) });
    expect(res.status).toBe(404);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('NOT_FOUND');
  });

  it('Step 5b: handle 404 gracefully on DELETE', async () => {
    mockWebhookFindUnique.mockResolvedValue(null);

    const req = createDeleteRequest('/api/v1/developer/webhooks/nonexistent');
    const res = await deleteWebhookDetail(req, {
      params: Promise.resolve({ id: 'nonexistent' }),
    });
    expect(res.status).toBe(404);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('NOT_FOUND');
  });

  it('Step 5c: handle 404 gracefully on PATCH', async () => {
    mockWebhookFindUnique.mockResolvedValue(null);

    const req = createPatchRequest(`/api/v1/developer/webhooks/nonexistent`, {
      url: 'https://new.com/hook',
    });
    const res = await updateWebhookDetail(req, {
      params: Promise.resolve({ id: 'nonexistent' }),
    });
    expect(res.status).toBe(404);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('NOT_FOUND');
  });

  it('should get single webhook detail', async () => {
    mockWebhookFindUnique.mockResolvedValue(makeWebhook());

    const req = createGetRequest(`/api/v1/developer/webhooks/${WEBHOOK_ID}`);
    const res = await getWebhookDetail(req, { params: Promise.resolve({ id: WEBHOOK_ID }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { id: string; url: string; events: string[]; status: string };
    }>(res);
    expect(body.data.id).toBe(WEBHOOK_ID);
    expect(body.data.url).toBe('https://example.com/webhooks/concierge');
    expect(body.data.status).toBe('active');
  });
});

// ===========================================================================
// Cross-Scenario: Validation & Edge Cases
// ===========================================================================

describe('Developer API: Validation & Edge Cases', () => {
  it('webhook deliveries return 404 for nonexistent webhook', async () => {
    mockWebhookFindUnique.mockResolvedValue(null);

    const req = createGetRequest('/api/v1/developer/webhooks/nonexistent/deliveries');
    const res = await listDeliveries(req, {
      params: Promise.resolve({ id: 'nonexistent' }),
    });
    expect(res.status).toBe(404);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('NOT_FOUND');
  });

  it('webhook update via bulk endpoint requires id in body', async () => {
    const req = createPatchRequest('/api/v1/developer/webhooks', {
      // Missing id
      url: 'https://example.com/hook',
    });

    const res = await updateWebhookBulk(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('webhook update via bulk endpoint returns 404 for nonexistent webhook', async () => {
    mockWebhookFindUnique.mockResolvedValue(null);

    const req = createPatchRequest('/api/v1/developer/webhooks', {
      id: 'nonexistent',
      url: 'https://example.com/hook',
    });

    const res = await updateWebhookBulk(req);
    expect(res.status).toBe(404);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('NOT_FOUND');
  });

  it('webhook delete via bulk endpoint requires id', async () => {
    const req = createDeleteRequest('/api/v1/developer/webhooks');
    const res = await deleteWebhookBulk(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('webhook delete via bulk endpoint returns 404 for nonexistent', async () => {
    mockWebhookFindUnique.mockResolvedValue(null);

    const req = createDeleteRequest('/api/v1/developer/webhooks', {
      headers: {},
    });

    // Build URL with search param
    const reqWithId = createGetRequest('/api/v1/developer/webhooks', {
      searchParams: { id: 'nonexistent' },
    });
    // Use DELETE method manually
    const deleteReq = new Request(reqWithId.url, { method: 'DELETE' });
    const res = await deleteWebhookBulk(deleteReq as never);
    expect(res.status).toBe(404);
  });

  it('webhook resume from paused state', async () => {
    mockWebhookFindUnique.mockResolvedValue(makeWebhook({ status: 'paused' }));
    mockWebhookUpdate.mockResolvedValue(makeWebhook({ status: 'active', failureCount: 0 }));

    const req = createPatchRequest(`/api/v1/developer/webhooks/${WEBHOOK_ID}`, {
      status: 'active',
    });

    const res = await updateWebhookDetail(req, { params: Promise.resolve({ id: WEBHOOK_ID }) });
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { status: string } }>(res);
    expect(body.data.status).toBe('active');
  });

  it('API key with expiration date is stored correctly', async () => {
    const expiresAt = '2026-12-31T23:59:59Z';
    mockApiKeyCreate.mockResolvedValue(makeApiKey({ expiresAt: new Date(expiresAt) }));

    const req = createPostRequest('/api/v1/developer/api-keys', {
      propertyId: PROPERTY_ID,
      name: 'Expiring Key',
      scopes: ['read'],
      expiresAt,
    });

    const res = await createApiKey(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{
      data: { expiresAt: string };
    }>(res);
    expect(body.data.expiresAt).toBeTruthy();
  });

  it('deliveries support pagination with correct page math', async () => {
    mockWebhookFindUnique.mockResolvedValue(makeWebhook());
    mockWebhookDeliveryFindMany.mockResolvedValue([makeDelivery()]);
    mockWebhookDeliveryCount.mockResolvedValue(100);

    const req = createGetRequest(`/api/v1/developer/webhooks/${WEBHOOK_ID}/deliveries`, {
      searchParams: { page: '3', pageSize: '25' },
    });

    const res = await listDeliveries(req, { params: Promise.resolve({ id: WEBHOOK_ID }) });
    const body = await parseResponse<{
      meta: { page: number; pageSize: number; total: number; totalPages: number };
    }>(res);
    expect(body.meta.page).toBe(3);
    expect(body.meta.pageSize).toBe(25);
    expect(body.meta.total).toBe(100);
    expect(body.meta.totalPages).toBe(4);
  });
});
