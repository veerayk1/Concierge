/**
 * Developer Portal API Tests — API Keys, Webhooks, Delivery Engine
 *
 * Per PRD 26: REST API, webhooks, and API keys for the developer portal.
 * Tests cover creation, listing, revocation, scopes, rate limiting,
 * webhook CRUD, URL validation, delivery with retries, HMAC signatures,
 * delivery logs, pause/resume, success rate, tenant isolation, key expiry,
 * request counting, and name validation.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  createGetRequest,
  createPostRequest,
  createPatchRequest,
  createDeleteRequest,
  parseResponse,
} from '@/test/helpers/api';
import {
  generateWebhookSignature,
  verifyWebhookSignature,
  deliverWebhook,
  calculateRetryDelay,
} from '@/server/webhooks';
import type { WebhookTarget, WebhookPayload } from '@/server/webhooks';

// ---------------------------------------------------------------------------
// Mock Setup
// ---------------------------------------------------------------------------

const mockApiKeyFindMany = vi.fn();
const mockApiKeyFindUnique = vi.fn();
const mockApiKeyCreate = vi.fn();
const mockApiKeyUpdate = vi.fn();
const mockApiKeyCount = vi.fn();

const mockWebhookFindMany = vi.fn();
const mockWebhookFindUnique = vi.fn();
const mockWebhookCreate = vi.fn();
const mockWebhookUpdate = vi.fn();
const mockWebhookDelete = vi.fn();

const mockDeliveryFindMany = vi.fn();
const mockDeliveryCount = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    apiKey: {
      findMany: (...args: unknown[]) => mockApiKeyFindMany(...args),
      findUnique: (...args: unknown[]) => mockApiKeyFindUnique(...args),
      create: (...args: unknown[]) => mockApiKeyCreate(...args),
      update: (...args: unknown[]) => mockApiKeyUpdate(...args),
      count: (...args: unknown[]) => mockApiKeyCount(...args),
    },
    webhook: {
      findMany: (...args: unknown[]) => mockWebhookFindMany(...args),
      findUnique: (...args: unknown[]) => mockWebhookFindUnique(...args),
      create: (...args: unknown[]) => mockWebhookCreate(...args),
      update: (...args: unknown[]) => mockWebhookUpdate(...args),
      delete: (...args: unknown[]) => mockWebhookDelete(...args),
    },
    webhookDelivery: {
      findMany: (...args: unknown[]) => mockDeliveryFindMany(...args),
      count: (...args: unknown[]) => mockDeliveryCount(...args),
    },
  },
}));

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: vi.fn().mockResolvedValue({
    user: {
      userId: 'test-developer',
      propertyId: '00000000-0000-4000-b000-000000000001',
      role: 'property_admin',
      permissions: ['*'],
      mfaVerified: false,
    },
    error: null,
  }),
}));

// nanoid must be mocked because it uses ESM
vi.mock('nanoid', () => ({
  nanoid: vi.fn().mockReturnValue('abcdefghijklmnopqrstuvwxyz123456'),
}));

// Route imports MUST come after vi.mock calls
import { GET as GET_KEYS, POST as POST_KEY } from '../api-keys/route';
import { DELETE as DELETE_KEY } from '../api-keys/[id]/route';
import { GET as GET_WEBHOOKS, POST as POST_WEBHOOK } from '../webhooks/route';
import {
  GET as GET_WEBHOOK,
  PATCH as PATCH_WEBHOOK,
  DELETE as DELETE_WEBHOOK,
} from '../webhooks/[id]/route';
import { GET as GET_DELIVERIES } from '../webhooks/[id]/deliveries/route';

beforeEach(() => {
  vi.clearAllMocks();
  mockApiKeyFindMany.mockResolvedValue([]);
  mockWebhookFindMany.mockResolvedValue([]);
  mockDeliveryFindMany.mockResolvedValue([]);
  mockDeliveryCount.mockResolvedValue(0);
});

const PROPERTY_ID = '00000000-0000-4000-b000-000000000001';
const PROPERTY_ID_2 = '00000000-0000-4000-b000-000000000002';
const KEY_ID = '00000000-0000-4000-e000-000000000001';
const WEBHOOK_ID = '00000000-0000-4000-f000-000000000001';

// ===========================================================================
// API KEY TESTS
// ===========================================================================

// ---------------------------------------------------------------------------
// 1. GET API keys list for a property
// ---------------------------------------------------------------------------

describe('GET /api/v1/developer/api-keys — List API keys (masked)', () => {
  it('returns masked key values, never the full key', async () => {
    mockApiKeyFindMany.mockResolvedValue([
      {
        id: KEY_ID,
        name: 'Production Key',
        keyPrefix: 'conc_live_abcd',
        permissions: { scopes: ['read', 'write'] },
        rateLimit: 1000,
        expiresAt: null,
        lastUsedAt: null,
        createdAt: new Date(),
      },
    ]);

    const req = createGetRequest('/api/v1/developer/api-keys', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET_KEYS(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: Array<{ maskedKey: string; name: string }>;
    }>(res);
    expect(body.data[0]!.maskedKey).toContain('...');
    expect(body.data[0]!.maskedKey).toContain('conc_live_');
    expect(body.data[0]!.name).toBe('Production Key');
  });

  it('only returns non-revoked keys', async () => {
    const req = createGetRequest('/api/v1/developer/api-keys', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    await GET_KEYS(req);

    const where = mockApiKeyFindMany.mock.calls[0]![0].where;
    expect(where.revokedAt).toBeNull();
  });

  it('rejects without propertyId', async () => {
    const req = createGetRequest('/api/v1/developer/api-keys');
    const res = await GET_KEYS(req);
    expect(res.status).toBe(400);
  });

  it('returns empty array when no keys exist', async () => {
    mockApiKeyFindMany.mockResolvedValue([]);

    const req = createGetRequest('/api/v1/developer/api-keys', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET_KEYS(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: unknown[] }>(res);
    expect(body.data).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 2. POST generate new API key with name, scopes, expiresAt
// ---------------------------------------------------------------------------

describe('POST /api/v1/developer/api-keys — Create API key', () => {
  const validBody = {
    propertyId: PROPERTY_ID,
    name: 'My Integration Key',
    scopes: ['read', 'write'],
  };

  it('returns the raw key on creation (only shown once)', async () => {
    mockApiKeyCreate.mockResolvedValue({
      id: KEY_ID,
      name: 'My Integration Key',
      keyPrefix: 'conc_live_abcd',
      rateLimit: 1000,
      expiresAt: null,
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/developer/api-keys', validBody);
    const res = await POST_KEY(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{
      data: { id: string; key: string; scopes: string[] };
      message: string;
    }>(res);
    expect(body.data.key).toMatch(/^conc_live_/);
    expect(body.message).toContain('not be shown again');
  });

  it('stores a hashed version of the key (not plaintext)', async () => {
    mockApiKeyCreate.mockResolvedValue({
      id: KEY_ID,
      name: 'Test Key',
      keyPrefix: 'conc_live_abcd',
      rateLimit: 1000,
      expiresAt: null,
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/developer/api-keys', validBody);
    await POST_KEY(req);

    const createData = mockApiKeyCreate.mock.calls[0]![0].data;
    // keyHash should be a hex string (SHA-256 = 64 hex chars)
    expect(createData.keyHash).toMatch(/^[a-f0-9]{64}$/);
    // keyHash should NOT be the raw key
    expect(createData.keyHash).not.toContain('conc_live_');
  });

  it('rejects missing required fields', async () => {
    const req = createPostRequest('/api/v1/developer/api-keys', {});
    const res = await POST_KEY(req);
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('requires propertyId (API key must be associated with a property)', async () => {
    const req = createPostRequest('/api/v1/developer/api-keys', {
      name: 'Test',
      scopes: ['read'],
    });
    const res = await POST_KEY(req);
    expect(res.status).toBe(400);
  });

  it('accepts optional expiresAt for key expiry', async () => {
    const expiresAt = new Date('2027-06-01T00:00:00Z');
    mockApiKeyCreate.mockResolvedValue({
      id: KEY_ID,
      name: 'Expiring Key',
      keyPrefix: 'conc_live_abcd',
      rateLimit: 1000,
      expiresAt,
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/developer/api-keys', {
      propertyId: PROPERTY_ID,
      name: 'Expiring Key',
      scopes: ['read'],
      expiresAt: expiresAt.toISOString(),
    });
    const res = await POST_KEY(req);
    expect(res.status).toBe(201);
  });
});

// ---------------------------------------------------------------------------
// 3. POST validates key name (3-100 chars)
// ---------------------------------------------------------------------------

describe('POST /api/v1/developer/api-keys — Name validation', () => {
  it('rejects empty name', async () => {
    const req = createPostRequest('/api/v1/developer/api-keys', {
      propertyId: PROPERTY_ID,
      name: '',
      scopes: ['read'],
    });
    const res = await POST_KEY(req);
    expect(res.status).toBe(400);
  });

  it('rejects name longer than 100 characters', async () => {
    const req = createPostRequest('/api/v1/developer/api-keys', {
      propertyId: PROPERTY_ID,
      name: 'A'.repeat(101),
      scopes: ['read'],
    });
    const res = await POST_KEY(req);
    expect(res.status).toBe(400);
  });

  it('accepts name exactly 100 characters', async () => {
    mockApiKeyCreate.mockResolvedValue({
      id: KEY_ID,
      name: 'A'.repeat(100),
      keyPrefix: 'conc_live_abcd',
      rateLimit: 1000,
      expiresAt: null,
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/developer/api-keys', {
      propertyId: PROPERTY_ID,
      name: 'A'.repeat(100),
      scopes: ['read'],
    });
    const res = await POST_KEY(req);
    expect(res.status).toBe(201);
  });
});

// ---------------------------------------------------------------------------
// 4. POST validates scopes
// ---------------------------------------------------------------------------

describe('API key scopes validation', () => {
  it('stores scopes in permissions JSON on creation', async () => {
    mockApiKeyCreate.mockResolvedValue({
      id: KEY_ID,
      name: 'Admin Key',
      keyPrefix: 'conc_live_abcd',
      rateLimit: 1000,
      expiresAt: null,
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/developer/api-keys', {
      propertyId: PROPERTY_ID,
      name: 'Admin Key',
      scopes: ['read', 'write', 'admin'],
    });
    await POST_KEY(req);

    const createData = mockApiKeyCreate.mock.calls[0]![0].data;
    expect(createData.permissions).toEqual({
      scopes: ['read', 'write', 'admin'],
    });
  });

  it('rejects if no scopes provided', async () => {
    const req = createPostRequest('/api/v1/developer/api-keys', {
      propertyId: PROPERTY_ID,
      name: 'No Scopes',
      scopes: [],
    });
    const res = await POST_KEY(req);
    expect(res.status).toBe(400);
  });

  it('rejects invalid scope values', async () => {
    const req = createPostRequest('/api/v1/developer/api-keys', {
      propertyId: PROPERTY_ID,
      name: 'Bad Scope',
      scopes: ['superuser'],
    });
    const res = await POST_KEY(req);
    expect(res.status).toBe(400);
  });

  it('rejects scope "delete" (only read/write/admin are valid)', async () => {
    const req = createPostRequest('/api/v1/developer/api-keys', {
      propertyId: PROPERTY_ID,
      name: 'Delete Scope',
      scopes: ['read', 'delete'],
    });
    const res = await POST_KEY(req);
    expect(res.status).toBe(400);
  });

  it('accepts read-only scope', async () => {
    mockApiKeyCreate.mockResolvedValue({
      id: KEY_ID,
      name: 'Read Only',
      keyPrefix: 'conc_live_abcd',
      rateLimit: 1000,
      expiresAt: null,
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/developer/api-keys', {
      propertyId: PROPERTY_ID,
      name: 'Read Only',
      scopes: ['read'],
    });
    const res = await POST_KEY(req);
    expect(res.status).toBe(201);
  });
});

// ---------------------------------------------------------------------------
// 5. POST auto-generates key prefix (conc_live_) + random hash
// ---------------------------------------------------------------------------

describe('API key prefix generation', () => {
  it('generates key with conc_live_ prefix', async () => {
    mockApiKeyCreate.mockResolvedValue({
      id: KEY_ID,
      name: 'Prefix Key',
      keyPrefix: 'conc_live_abcd',
      rateLimit: 1000,
      expiresAt: null,
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/developer/api-keys', {
      propertyId: PROPERTY_ID,
      name: 'Prefix Key',
      scopes: ['read'],
    });
    const res = await POST_KEY(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{ data: { key: string } }>(res);
    expect(body.data.key).toMatch(/^conc_live_/);
  });

  it('stores keyPrefix for later masking', async () => {
    mockApiKeyCreate.mockResolvedValue({
      id: KEY_ID,
      name: 'Prefix Key',
      keyPrefix: 'conc_live_abcd',
      rateLimit: 1000,
      expiresAt: null,
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/developer/api-keys', {
      propertyId: PROPERTY_ID,
      name: 'Prefix Key',
      scopes: ['read'],
    });
    await POST_KEY(req);

    const createData = mockApiKeyCreate.mock.calls[0]![0].data;
    expect(createData.keyPrefix).toMatch(/^conc_live_/);
  });
});

// ---------------------------------------------------------------------------
// 6. Key is only shown once on creation (hashed for storage)
// ---------------------------------------------------------------------------

describe('API key shown once — hashed for storage', () => {
  it('key in creation response is never returned again in list', async () => {
    mockApiKeyCreate.mockResolvedValue({
      id: KEY_ID,
      name: 'One Time Key',
      keyPrefix: 'conc_live_abcd',
      rateLimit: 1000,
      expiresAt: null,
      createdAt: new Date(),
    });

    const createReq = createPostRequest('/api/v1/developer/api-keys', {
      propertyId: PROPERTY_ID,
      name: 'One Time Key',
      scopes: ['read'],
    });
    const createRes = await POST_KEY(createReq);
    const createBody = await parseResponse<{ data: { key: string } }>(createRes);
    const rawKey = createBody.data.key;

    // Now list keys - they should be masked
    mockApiKeyFindMany.mockResolvedValue([
      {
        id: KEY_ID,
        name: 'One Time Key',
        keyPrefix: 'conc_live_abcd',
        permissions: { scopes: ['read'] },
        rateLimit: 1000,
        expiresAt: null,
        lastUsedAt: null,
        createdAt: new Date(),
      },
    ]);

    const listReq = createGetRequest('/api/v1/developer/api-keys', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const listRes = await GET_KEYS(listReq);
    const listBody = await parseResponse<{
      data: Array<{ maskedKey: string }>;
    }>(listRes);

    // The full raw key must NOT appear in the list
    expect(listBody.data[0]!.maskedKey).not.toBe(rawKey);
    expect(listBody.data[0]!.maskedKey).toContain('...');
  });
});

// ---------------------------------------------------------------------------
// 7. PATCH revoke API key (sets status to revoked, revokedAt)
// ---------------------------------------------------------------------------

describe('DELETE /api/v1/developer/api-keys/:id — Revoke API key', () => {
  it('revokes an API key by setting revokedAt', async () => {
    mockApiKeyFindUnique.mockResolvedValue({
      id: KEY_ID,
      name: 'Old Key',
      revokedAt: null,
    });
    mockApiKeyUpdate.mockResolvedValue({
      id: KEY_ID,
      revokedAt: new Date(),
    });

    const req = createDeleteRequest('/api/v1/developer/api-keys/revoke');
    const res = await DELETE_KEY(req, {
      params: Promise.resolve({ id: KEY_ID }),
    });

    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { id: string; revoked: boolean };
      message: string;
    }>(res);
    expect(body.data.revoked).toBe(true);

    // Should have set revokedAt
    const updateData = mockApiKeyUpdate.mock.calls[0]![0].data;
    expect(updateData.revokedAt).toBeInstanceOf(Date);
  });

  it('returns 404 for non-existent key', async () => {
    mockApiKeyFindUnique.mockResolvedValue(null);

    const req = createDeleteRequest('/api/v1/developer/api-keys/revoke');
    const res = await DELETE_KEY(req, {
      params: Promise.resolve({ id: 'non-existent' }),
    });
    expect(res.status).toBe(404);
  });

  it('returns 400 if key is already revoked', async () => {
    mockApiKeyFindUnique.mockResolvedValue({
      id: KEY_ID,
      revokedAt: new Date('2026-01-01'),
    });

    const req = createDeleteRequest('/api/v1/developer/api-keys/revoke');
    const res = await DELETE_KEY(req, {
      params: Promise.resolve({ id: KEY_ID }),
    });
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('ALREADY_REVOKED');
  });
});

// ---------------------------------------------------------------------------
// 8. Request counting per key
// ---------------------------------------------------------------------------

describe('API key request counting', () => {
  it('lastUsedAt is returned in list response', async () => {
    const lastUsed = new Date('2026-03-15T14:00:00Z');
    mockApiKeyFindMany.mockResolvedValue([
      {
        id: KEY_ID,
        name: 'Active Key',
        keyPrefix: 'conc_live_abcd',
        permissions: { scopes: ['read'] },
        rateLimit: 1000,
        expiresAt: null,
        lastUsedAt: lastUsed,
        createdAt: new Date(),
      },
    ]);

    const req = createGetRequest('/api/v1/developer/api-keys', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET_KEYS(req);
    const body = await parseResponse<{
      data: Array<{ lastUsedAt: string }>;
    }>(res);
    expect(body.data[0]!.lastUsedAt).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// 9. Rate limiting per key (configurable limit)
// ---------------------------------------------------------------------------

describe('API key rate limiting', () => {
  it('stores custom rate limit on creation', async () => {
    mockApiKeyCreate.mockResolvedValue({
      id: KEY_ID,
      name: 'Rate Limited Key',
      keyPrefix: 'conc_live_abcd',
      rateLimit: 500,
      expiresAt: null,
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/developer/api-keys', {
      propertyId: PROPERTY_ID,
      name: 'Rate Limited Key',
      scopes: ['read'],
      rateLimit: 500,
    });
    await POST_KEY(req);

    const createData = mockApiKeyCreate.mock.calls[0]![0].data;
    expect(createData.rateLimit).toBe(500);
  });

  it('defaults to 1000 requests/hour if not specified', async () => {
    mockApiKeyCreate.mockResolvedValue({
      id: KEY_ID,
      name: 'Default Rate',
      keyPrefix: 'conc_live_abcd',
      rateLimit: 1000,
      expiresAt: null,
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/developer/api-keys', {
      propertyId: PROPERTY_ID,
      name: 'Default Rate',
      scopes: ['read'],
    });
    await POST_KEY(req);

    const createData = mockApiKeyCreate.mock.calls[0]![0].data;
    expect(createData.rateLimit).toBe(1000);
  });

  it('rate limit is returned in list response for each key', async () => {
    mockApiKeyFindMany.mockResolvedValue([
      {
        id: KEY_ID,
        name: 'Key A',
        keyPrefix: 'conc_live_abcd',
        permissions: { scopes: ['read'] },
        rateLimit: 2000,
        expiresAt: null,
        lastUsedAt: null,
        createdAt: new Date(),
      },
    ]);

    const req = createGetRequest('/api/v1/developer/api-keys', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET_KEYS(req);
    const body = await parseResponse<{
      data: Array<{ rateLimit: number }>;
    }>(res);
    expect(body.data[0]!.rateLimit).toBe(2000);
  });
});

// ---------------------------------------------------------------------------
// 10. Key expiry detection
// ---------------------------------------------------------------------------

describe('API key expiry detection', () => {
  it('returns expiresAt in the list response', async () => {
    const expiresAt = new Date('2027-01-01T00:00:00Z');
    mockApiKeyFindMany.mockResolvedValue([
      {
        id: KEY_ID,
        name: 'Expiring Key',
        keyPrefix: 'conc_live_abcd',
        permissions: { scopes: ['read'] },
        rateLimit: 1000,
        expiresAt,
        lastUsedAt: null,
        createdAt: new Date(),
      },
    ]);

    const req = createGetRequest('/api/v1/developer/api-keys', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET_KEYS(req);
    const body = await parseResponse<{
      data: Array<{ expiresAt: string }>;
    }>(res);
    expect(body.data[0]!.expiresAt).toBeDefined();
  });

  it('returns null expiresAt for keys without expiration', async () => {
    mockApiKeyFindMany.mockResolvedValue([
      {
        id: KEY_ID,
        name: 'Permanent Key',
        keyPrefix: 'conc_live_abcd',
        permissions: { scopes: ['read'] },
        rateLimit: 1000,
        expiresAt: null,
        lastUsedAt: null,
        createdAt: new Date(),
      },
    ]);

    const req = createGetRequest('/api/v1/developer/api-keys', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET_KEYS(req);
    const body = await parseResponse<{
      data: Array<{ expiresAt: string | null }>;
    }>(res);
    expect(body.data[0]!.expiresAt).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 11. API key tenant isolation
// ---------------------------------------------------------------------------

describe('API key property association (tenant isolation)', () => {
  it('stores propertyId on creation', async () => {
    mockApiKeyCreate.mockResolvedValue({
      id: KEY_ID,
      name: 'Property Key',
      keyPrefix: 'conc_live_abcd',
      rateLimit: 1000,
      expiresAt: null,
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/developer/api-keys', {
      propertyId: PROPERTY_ID,
      name: 'Property Key',
      scopes: ['read'],
    });
    await POST_KEY(req);

    const createData = mockApiKeyCreate.mock.calls[0]![0].data;
    expect(createData.propertyId).toBe(PROPERTY_ID);
  });

  it('list endpoint scopes to propertyId', async () => {
    const req = createGetRequest('/api/v1/developer/api-keys', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    await GET_KEYS(req);

    const where = mockApiKeyFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_ID);
  });

  it('cannot list keys from another property', async () => {
    const req = createGetRequest('/api/v1/developer/api-keys', {
      searchParams: { propertyId: PROPERTY_ID_2 },
    });
    await GET_KEYS(req);

    const where = mockApiKeyFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_ID_2);
    expect(where.propertyId).not.toBe(PROPERTY_ID);
  });
});

// ===========================================================================
// WEBHOOK TESTS
// ===========================================================================

// ---------------------------------------------------------------------------
// 12. GET webhooks list for a property
// ---------------------------------------------------------------------------

describe('GET /api/v1/developer/webhooks — List webhooks', () => {
  it('returns all webhooks for a property', async () => {
    mockWebhookFindMany.mockResolvedValue([
      {
        id: WEBHOOK_ID,
        url: 'https://example.com/hook1',
        events: ['package.received'],
        status: 'active',
        lastDeliveryAt: null,
        failureCount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ]);

    const req = createGetRequest('/api/v1/developer/webhooks', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET_WEBHOOKS(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: Array<{ id: string; url: string; events: string[] }>;
    }>(res);
    expect(body.data).toHaveLength(1);
    expect(body.data[0]!.url).toBe('https://example.com/hook1');
  });

  it('scopes to propertyId', async () => {
    const req = createGetRequest('/api/v1/developer/webhooks', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    await GET_WEBHOOKS(req);

    const where = mockWebhookFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_ID);
  });

  it('rejects without propertyId', async () => {
    const req = createGetRequest('/api/v1/developer/webhooks');
    const res = await GET_WEBHOOKS(req);
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// 13. POST create webhook with url, events, secret
// ---------------------------------------------------------------------------

describe('POST /api/v1/developer/webhooks — Register webhook', () => {
  const validBody = {
    propertyId: PROPERTY_ID,
    url: 'https://example.com/webhooks',
    events: ['package.received', 'maintenance.created'],
  };

  it('creates webhook with URL, events, and shared secret', async () => {
    mockWebhookCreate.mockResolvedValue({
      id: WEBHOOK_ID,
      url: validBody.url,
      events: validBody.events,
      status: 'active',
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/developer/webhooks', validBody);
    const res = await POST_WEBHOOK(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{
      data: { id: string; url: string; events: string[]; secret: string };
      message: string;
    }>(res);
    expect(body.data.url).toBe(validBody.url);
    expect(body.data.events).toEqual(validBody.events);
    expect(body.data.secret).toMatch(/^whsec_/);
    expect(body.message).toContain('not be shown again');
  });

  it('stores hashed secret, not plaintext', async () => {
    mockWebhookCreate.mockResolvedValue({
      id: WEBHOOK_ID,
      url: validBody.url,
      events: validBody.events,
      status: 'active',
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/developer/webhooks', validBody);
    await POST_WEBHOOK(req);

    const createData = mockWebhookCreate.mock.calls[0]![0].data;
    expect(createData.secretHash).toMatch(/^[a-f0-9]{64}$/);
    expect(createData.secretHash).not.toContain('whsec_');
  });

  it('auto-generates signing secret with whsec_ prefix', async () => {
    mockWebhookCreate.mockResolvedValue({
      id: WEBHOOK_ID,
      url: 'https://secure.example.com/hook',
      events: ['package.received'],
      status: 'active',
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/developer/webhooks', {
      propertyId: PROPERTY_ID,
      url: 'https://secure.example.com/hook',
      events: ['package.received'],
    });
    const res = await POST_WEBHOOK(req);
    const body = await parseResponse<{ data: { secret: string } }>(res);
    expect(body.data.secret).toMatch(/^whsec_/);
  });
});

// ---------------------------------------------------------------------------
// 14. POST validates webhook URL (must be https in production)
// ---------------------------------------------------------------------------

describe('Webhook URL validation — must be HTTPS', () => {
  it('rejects HTTP URL', async () => {
    const req = createPostRequest('/api/v1/developer/webhooks', {
      propertyId: PROPERTY_ID,
      url: 'http://example.com/webhooks',
      events: ['package.received'],
    });
    const res = await POST_WEBHOOK(req);
    expect(res.status).toBe(400);
  });

  it('rejects non-URL string', async () => {
    const req = createPostRequest('/api/v1/developer/webhooks', {
      propertyId: PROPERTY_ID,
      url: 'not-a-url',
      events: ['package.received'],
    });
    const res = await POST_WEBHOOK(req);
    expect(res.status).toBe(400);
  });

  it('accepts HTTPS URL', async () => {
    mockWebhookCreate.mockResolvedValue({
      id: WEBHOOK_ID,
      url: 'https://secure.example.com/hook',
      events: ['package.received'],
      status: 'active',
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/developer/webhooks', {
      propertyId: PROPERTY_ID,
      url: 'https://secure.example.com/hook',
      events: ['package.received'],
    });
    const res = await POST_WEBHOOK(req);
    expect(res.status).toBe(201);
  });

  it('rejects localhost URLs', async () => {
    const req = createPostRequest('/api/v1/developer/webhooks', {
      propertyId: PROPERTY_ID,
      url: 'http://localhost:3000/hook',
      events: ['package.received'],
    });
    const res = await POST_WEBHOOK(req);
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// 15. POST validates events array (non-empty, valid event names)
// ---------------------------------------------------------------------------

describe('Webhook events validation', () => {
  it('rejects empty events array', async () => {
    const req = createPostRequest('/api/v1/developer/webhooks', {
      propertyId: PROPERTY_ID,
      url: 'https://example.com/hook',
      events: [],
    });
    const res = await POST_WEBHOOK(req);
    expect(res.status).toBe(400);
  });

  it('accepts multiple valid event types', async () => {
    mockWebhookCreate.mockResolvedValue({
      id: WEBHOOK_ID,
      url: 'https://example.com/hook',
      events: ['package.received', 'maintenance.created', 'visitor.signed_in'],
      status: 'active',
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/developer/webhooks', {
      propertyId: PROPERTY_ID,
      url: 'https://example.com/hook',
      events: ['package.received', 'maintenance.created', 'visitor.signed_in'],
    });
    const res = await POST_WEBHOOK(req);
    expect(res.status).toBe(201);
  });
});

// ---------------------------------------------------------------------------
// 16. PATCH update webhook events/url
// ---------------------------------------------------------------------------

describe('PATCH /api/v1/developer/webhooks/:id — Update webhook', () => {
  it('updates URL', async () => {
    mockWebhookFindUnique.mockResolvedValue({
      id: WEBHOOK_ID,
      url: 'https://old.example.com/hook',
      events: ['package.received'],
    });
    mockWebhookUpdate.mockResolvedValue({
      id: WEBHOOK_ID,
      url: 'https://new.example.com/hook',
      events: ['package.received'],
      status: 'active',
      lastDeliveryAt: null,
      failureCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const req = createPatchRequest('/api/v1/developer/webhooks/update', {
      url: 'https://new.example.com/hook',
    });
    const res = await PATCH_WEBHOOK(req, {
      params: Promise.resolve({ id: WEBHOOK_ID }),
    });
    expect(res.status).toBe(200);

    const updateData = mockWebhookUpdate.mock.calls[0]![0].data;
    expect(updateData.url).toBe('https://new.example.com/hook');
  });

  it('updates events list', async () => {
    mockWebhookFindUnique.mockResolvedValue({
      id: WEBHOOK_ID,
      url: 'https://example.com/hook',
      events: ['package.received'],
    });
    mockWebhookUpdate.mockResolvedValue({
      id: WEBHOOK_ID,
      url: 'https://example.com/hook',
      events: ['package.received', 'maintenance.created'],
      status: 'active',
      lastDeliveryAt: null,
      failureCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const req = createPatchRequest('/api/v1/developer/webhooks/update', {
      events: ['package.received', 'maintenance.created'],
    });
    const res = await PATCH_WEBHOOK(req, {
      params: Promise.resolve({ id: WEBHOOK_ID }),
    });
    expect(res.status).toBe(200);

    const updateData = mockWebhookUpdate.mock.calls[0]![0].data;
    expect(updateData.events).toEqual(['package.received', 'maintenance.created']);
  });

  it('returns 404 for non-existent webhook', async () => {
    mockWebhookFindUnique.mockResolvedValue(null);

    const req = createPatchRequest('/api/v1/developer/webhooks/update', {
      url: 'https://example.com/new',
    });
    const res = await PATCH_WEBHOOK(req, {
      params: Promise.resolve({ id: 'non-existent' }),
    });
    expect(res.status).toBe(404);
  });

  it('rejects PATCH with HTTP URL', async () => {
    mockWebhookFindUnique.mockResolvedValue({
      id: WEBHOOK_ID,
      url: 'https://example.com/hook',
    });

    const req = createPatchRequest('/api/v1/developer/webhooks/update', {
      url: 'http://insecure.example.com/hook',
    });
    const res = await PATCH_WEBHOOK(req, {
      params: Promise.resolve({ id: WEBHOOK_ID }),
    });
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// 17. PATCH pause/resume webhook
// ---------------------------------------------------------------------------

describe('PATCH /api/v1/developer/webhooks/:id — Pause/Resume', () => {
  it('pauses an active webhook', async () => {
    mockWebhookFindUnique.mockResolvedValue({
      id: WEBHOOK_ID,
      url: 'https://example.com/hook',
      events: ['package.received'],
      status: 'active',
    });
    mockWebhookUpdate.mockResolvedValue({
      id: WEBHOOK_ID,
      url: 'https://example.com/hook',
      events: ['package.received'],
      status: 'paused',
      lastDeliveryAt: null,
      failureCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const req = createPatchRequest('/api/v1/developer/webhooks/update', {
      status: 'paused',
    });
    const res = await PATCH_WEBHOOK(req, {
      params: Promise.resolve({ id: WEBHOOK_ID }),
    });
    expect(res.status).toBe(200);

    const updateData = mockWebhookUpdate.mock.calls[0]![0].data;
    expect(updateData.status).toBe('paused');
  });

  it('resumes a paused webhook', async () => {
    mockWebhookFindUnique.mockResolvedValue({
      id: WEBHOOK_ID,
      url: 'https://example.com/hook',
      events: ['package.received'],
      status: 'paused',
    });
    mockWebhookUpdate.mockResolvedValue({
      id: WEBHOOK_ID,
      url: 'https://example.com/hook',
      events: ['package.received'],
      status: 'active',
      lastDeliveryAt: null,
      failureCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const req = createPatchRequest('/api/v1/developer/webhooks/update', {
      status: 'active',
    });
    const res = await PATCH_WEBHOOK(req, {
      params: Promise.resolve({ id: WEBHOOK_ID }),
    });
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { status: string };
    }>(res);
    expect(body.data.status).toBe('active');
  });
});

// ---------------------------------------------------------------------------
// 18. Webhook delivery log
// ---------------------------------------------------------------------------

describe('GET /api/v1/developer/webhooks/:id/deliveries — Delivery log', () => {
  it('returns delivery history for a webhook', async () => {
    mockWebhookFindUnique.mockResolvedValue({
      id: WEBHOOK_ID,
      url: 'https://example.com/hook',
    });
    mockDeliveryFindMany.mockResolvedValue([
      {
        id: 'del-1',
        webhookId: WEBHOOK_ID,
        eventType: 'package.received',
        payload: { event: 'package.received', data: {} },
        statusCode: 200,
        responseTime: 150,
        attempt: 1,
        success: true,
        error: null,
        createdAt: new Date(),
      },
      {
        id: 'del-2',
        webhookId: WEBHOOK_ID,
        eventType: 'maintenance.created',
        payload: { event: 'maintenance.created', data: {} },
        statusCode: 500,
        responseTime: 2000,
        attempt: 3,
        success: false,
        error: 'HTTP 500',
        createdAt: new Date(),
      },
    ]);
    mockDeliveryCount.mockResolvedValue(2);

    const req = createGetRequest('/api/v1/developer/webhooks/deliveries', {
      searchParams: { page: '1', pageSize: '50' },
    });
    const res = await GET_DELIVERIES(req, {
      params: Promise.resolve({ id: WEBHOOK_ID }),
    });
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: Array<{
        eventType: string;
        statusCode: number;
        success: boolean;
        attempt: number;
      }>;
      meta: { total: number };
    }>(res);
    expect(body.data).toHaveLength(2);
    expect(body.meta.total).toBe(2);
    expect(body.data[0]!.success).toBe(true);
    expect(body.data[1]!.success).toBe(false);
  });

  it('returns 404 if webhook does not exist', async () => {
    mockWebhookFindUnique.mockResolvedValue(null);

    const req = createGetRequest('/api/v1/developer/webhooks/deliveries');
    const res = await GET_DELIVERIES(req, {
      params: Promise.resolve({ id: 'non-existent' }),
    });
    expect(res.status).toBe(404);
  });

  it('scopes deliveries to webhookId', async () => {
    mockWebhookFindUnique.mockResolvedValue({
      id: WEBHOOK_ID,
      url: 'https://example.com/hook',
    });
    mockDeliveryFindMany.mockResolvedValue([]);
    mockDeliveryCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/developer/webhooks/deliveries');
    await GET_DELIVERIES(req, {
      params: Promise.resolve({ id: WEBHOOK_ID }),
    });

    const where = mockDeliveryFindMany.mock.calls[0]![0].where;
    expect(where.webhookId).toBe(WEBHOOK_ID);
  });

  it('paginates delivery results', async () => {
    mockWebhookFindUnique.mockResolvedValue({
      id: WEBHOOK_ID,
      url: 'https://example.com/hook',
    });
    mockDeliveryFindMany.mockResolvedValue([]);
    mockDeliveryCount.mockResolvedValue(100);

    const req = createGetRequest('/api/v1/developer/webhooks/deliveries', {
      searchParams: { page: '2', pageSize: '10' },
    });
    const res = await GET_DELIVERIES(req, {
      params: Promise.resolve({ id: WEBHOOK_ID }),
    });

    const body = await parseResponse<{
      meta: { page: number; pageSize: number; total: number; totalPages: number };
    }>(res);
    expect(body.meta.page).toBe(2);
    expect(body.meta.pageSize).toBe(10);
    expect(body.meta.total).toBe(100);
    expect(body.meta.totalPages).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// 19. Webhook retry logic (exponential backoff)
// ---------------------------------------------------------------------------

describe('Webhook retry — 3 attempts with exponential backoff', () => {
  const mockWebhookTarget: WebhookTarget = {
    id: WEBHOOK_ID,
    url: 'https://example.com/hook',
    secretHash: 'test-secret',
    events: ['package.received'],
    status: 'active',
  };

  const testPayload: WebhookPayload = {
    event: 'package.received',
    timestamp: '2026-03-18T12:00:00Z',
    data: { packageId: 'pkg-1' },
  };

  it('retries up to 3 times on failure', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ status: 500 });
    const mockSleep = vi.fn().mockResolvedValue(undefined);

    const result = await deliverWebhook(mockWebhookTarget, testPayload, {
      fetchFn: mockFetch,
      sleepFn: mockSleep,
    });

    expect(mockFetch).toHaveBeenCalledTimes(3);
    expect(result.results).toHaveLength(3);
    expect(result.finalSuccess).toBe(false);
  });

  it('uses exponential backoff between retries', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ status: 500 });
    const mockSleep = vi.fn().mockResolvedValue(undefined);

    await deliverWebhook(mockWebhookTarget, testPayload, {
      fetchFn: mockFetch,
      sleepFn: mockSleep,
    });

    expect(mockSleep).toHaveBeenCalledTimes(2);
    expect(mockSleep.mock.calls[0]![0]).toBe(1000); // 1s delay
    expect(mockSleep.mock.calls[1]![0]).toBe(2000); // 2s delay
  });

  it('stops retrying after first success', async () => {
    const mockFetch = vi
      .fn()
      .mockResolvedValueOnce({ status: 500 })
      .mockResolvedValueOnce({ status: 200 });
    const mockSleep = vi.fn().mockResolvedValue(undefined);

    const result = await deliverWebhook(mockWebhookTarget, testPayload, {
      fetchFn: mockFetch,
      sleepFn: mockSleep,
    });

    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(result.results).toHaveLength(2);
    expect(result.finalSuccess).toBe(true);
    expect(result.results[0]!.success).toBe(false);
    expect(result.results[1]!.success).toBe(true);
  });

  it('handles network errors (fetch throws)', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('Connection refused'));
    const mockSleep = vi.fn().mockResolvedValue(undefined);

    const result = await deliverWebhook(mockWebhookTarget, testPayload, {
      fetchFn: mockFetch,
      sleepFn: mockSleep,
    });

    expect(result.results).toHaveLength(3);
    expect(result.results[0]!.error).toBe('Connection refused');
    expect(result.results[0]!.statusCode).toBeNull();
    expect(result.finalSuccess).toBe(false);
  });

  it('calculates retry delays with exponential backoff', () => {
    expect(calculateRetryDelay(0)).toBe(1000); // 1s
    expect(calculateRetryDelay(1)).toBe(2000); // 2s
    expect(calculateRetryDelay(2)).toBe(4000); // 4s
  });

  it('records attempt number in each result', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ status: 500 });
    const mockSleep = vi.fn().mockResolvedValue(undefined);

    const result = await deliverWebhook(mockWebhookTarget, testPayload, {
      fetchFn: mockFetch,
      sleepFn: mockSleep,
    });

    expect(result.results[0]!.attempt).toBe(1);
    expect(result.results[1]!.attempt).toBe(2);
    expect(result.results[2]!.attempt).toBe(3);
  });
});

// ---------------------------------------------------------------------------
// 20. Success rate calculation
// ---------------------------------------------------------------------------

describe('Webhook success rate — delivery log analysis', () => {
  it('delivery log with mixed success/failure entries returns correct data', async () => {
    mockWebhookFindUnique.mockResolvedValue({
      id: WEBHOOK_ID,
      url: 'https://example.com/hook',
    });
    mockDeliveryFindMany.mockResolvedValue([
      { id: 'del-1', success: true, statusCode: 200, attempt: 1, createdAt: new Date() },
      { id: 'del-2', success: true, statusCode: 200, attempt: 1, createdAt: new Date() },
      { id: 'del-3', success: false, statusCode: 500, attempt: 3, createdAt: new Date() },
    ]);
    mockDeliveryCount.mockResolvedValue(3);

    const req = createGetRequest('/api/v1/developer/webhooks/deliveries');
    const res = await GET_DELIVERIES(req, {
      params: Promise.resolve({ id: WEBHOOK_ID }),
    });
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: Array<{ success: boolean }>;
      meta: { total: number };
    }>(res);
    const successes = body.data.filter((d) => d.success).length;
    const failures = body.data.filter((d) => !d.success).length;
    expect(successes).toBe(2);
    expect(failures).toBe(1);
  });
});

// ---------------------------------------------------------------------------
// 21. DELETE webhook
// ---------------------------------------------------------------------------

describe('DELETE /api/v1/developer/webhooks/:id — Delete webhook', () => {
  it('deletes a webhook', async () => {
    mockWebhookFindUnique.mockResolvedValue({
      id: WEBHOOK_ID,
      url: 'https://example.com/hook',
    });
    mockWebhookDelete.mockResolvedValue({ id: WEBHOOK_ID });

    const req = createDeleteRequest('/api/v1/developer/webhooks/delete');
    const res = await DELETE_WEBHOOK(req, {
      params: Promise.resolve({ id: WEBHOOK_ID }),
    });
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { id: string; deleted: boolean };
    }>(res);
    expect(body.data.deleted).toBe(true);
    expect(mockWebhookDelete).toHaveBeenCalledWith({
      where: { id: WEBHOOK_ID },
    });
  });

  it('returns 404 for non-existent webhook', async () => {
    mockWebhookFindUnique.mockResolvedValue(null);

    const req = createDeleteRequest('/api/v1/developer/webhooks/delete');
    const res = await DELETE_WEBHOOK(req, {
      params: Promise.resolve({ id: 'non-existent' }),
    });
    expect(res.status).toBe(404);
  });
});

// ===========================================================================
// WEBHOOK SIGNATURE TESTS
// ===========================================================================

// ---------------------------------------------------------------------------
// 22. Webhook signature: HMAC-SHA256 with shared secret
// ---------------------------------------------------------------------------

describe('Webhook signature — HMAC-SHA256', () => {
  it('generates HMAC-SHA256 signature for payload', () => {
    const payload = JSON.stringify({ event: 'test', data: {} });
    const secret = 'whsec_testsecret123';

    const signature = generateWebhookSignature(payload, secret);
    expect(signature).toMatch(/^[a-f0-9]{64}$/);
  });

  it('verifies valid signature', () => {
    const payload = JSON.stringify({ event: 'test', data: { id: '123' } });
    const secret = 'whsec_mysecret456';

    const signature = generateWebhookSignature(payload, secret);
    const isValid = verifyWebhookSignature(payload, signature, secret);
    expect(isValid).toBe(true);
  });

  it('rejects invalid signature', () => {
    const payload = JSON.stringify({ event: 'test', data: {} });
    const secret = 'whsec_secret';

    const isValid = verifyWebhookSignature(payload, 'invalid-signature', secret);
    expect(isValid).toBe(false);
  });

  it('rejects tampered payload', () => {
    const originalPayload = JSON.stringify({ event: 'test', data: { amount: 100 } });
    const tamperedPayload = JSON.stringify({ event: 'test', data: { amount: 999 } });
    const secret = 'whsec_secret';

    const signature = generateWebhookSignature(originalPayload, secret);
    const isValid = verifyWebhookSignature(tamperedPayload, signature, secret);
    expect(isValid).toBe(false);
  });

  it('webhook delivery includes signature header', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ status: 200 });
    const webhook: WebhookTarget = {
      id: WEBHOOK_ID,
      url: 'https://example.com/hook',
      secretHash: 'my-secret',
      events: ['event.created'],
      status: 'active',
    };
    const payload: WebhookPayload = {
      event: 'event.created',
      timestamp: '2026-03-18T12:00:00Z',
      data: {},
    };

    await deliverWebhook(webhook, payload, {
      fetchFn: mockFetch,
      sleepFn: vi.fn(),
    });

    const headers = (mockFetch.mock.calls[0]![1] as RequestInit).headers as Record<string, string>;
    const sentSignature = headers['X-Webhook-Signature'];

    const expectedSignature = generateWebhookSignature(JSON.stringify(payload), 'my-secret');
    expect(sentSignature).toBe(expectedSignature);
  });

  it('different secrets produce different signatures', () => {
    const payload = JSON.stringify({ event: 'test', data: {} });
    const sig1 = generateWebhookSignature(payload, 'secret1');
    const sig2 = generateWebhookSignature(payload, 'secret2');
    expect(sig1).not.toBe(sig2);
  });

  it('signature is deterministic for same payload and secret', () => {
    const payload = JSON.stringify({ event: 'test', data: {} });
    const sig1 = generateWebhookSignature(payload, 'secret');
    const sig2 = generateWebhookSignature(payload, 'secret');
    expect(sig1).toBe(sig2);
  });
});

// ---------------------------------------------------------------------------
// 23. Webhook delivery sends correct headers
// ---------------------------------------------------------------------------

describe('Webhook delivery — headers', () => {
  it('includes all required webhook headers in request', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ status: 200 });
    const webhook: WebhookTarget = {
      id: WEBHOOK_ID,
      url: 'https://example.com/hook',
      secretHash: 'test-secret-hash',
      events: ['package.received'],
      status: 'active',
    };
    const testPayload: WebhookPayload = {
      event: 'package.received',
      timestamp: '2026-03-18T12:00:00Z',
      data: { packageId: 'pkg-1', unitNumber: '301' },
    };

    await deliverWebhook(webhook, testPayload, {
      fetchFn: mockFetch,
      sleepFn: vi.fn(),
    });

    const headers = (mockFetch.mock.calls[0]![1] as RequestInit).headers as Record<string, string>;
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['X-Webhook-Event']).toBe('package.received');
    expect(headers['X-Webhook-ID']).toBe(WEBHOOK_ID);
    expect(headers['X-Webhook-Signature']).toBeDefined();
    expect(headers['User-Agent']).toBe('Concierge-Webhooks/1.0');
  });

  it('records response time in result', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ status: 200 });
    const webhook: WebhookTarget = {
      id: WEBHOOK_ID,
      url: 'https://example.com/hook',
      secretHash: 'sec',
      events: ['test.event'],
      status: 'active',
    };
    const payload: WebhookPayload = {
      event: 'test.event',
      timestamp: '2026-03-18T12:00:00Z',
      data: {},
    };

    const result = await deliverWebhook(webhook, payload, {
      fetchFn: mockFetch,
      sleepFn: vi.fn(),
    });

    expect(result.results[0]!.responseTime).toBeGreaterThanOrEqual(0);
  });
});

// ---------------------------------------------------------------------------
// 24. Webhook tenant isolation
// ---------------------------------------------------------------------------

describe('Webhook tenant isolation', () => {
  it('webhook creation stores propertyId', async () => {
    mockWebhookCreate.mockResolvedValue({
      id: WEBHOOK_ID,
      url: 'https://example.com/hook',
      events: ['package.received'],
      status: 'active',
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/developer/webhooks', {
      propertyId: PROPERTY_ID,
      url: 'https://example.com/hook',
      events: ['package.received'],
    });
    await POST_WEBHOOK(req);

    const createData = mockWebhookCreate.mock.calls[0]![0].data;
    expect(createData.propertyId).toBe(PROPERTY_ID);
  });

  it('webhook list scopes to propertyId', async () => {
    const req = createGetRequest('/api/v1/developer/webhooks', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    await GET_WEBHOOKS(req);

    const where = mockWebhookFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_ID);
  });
});

// ---------------------------------------------------------------------------
// 25. Error handling
// ---------------------------------------------------------------------------

describe('Developer Portal — Error handling', () => {
  it('handles database error during key creation', async () => {
    mockApiKeyCreate.mockRejectedValue(new Error('Unique constraint'));

    const req = createPostRequest('/api/v1/developer/api-keys', {
      propertyId: PROPERTY_ID,
      name: 'Fail Key',
      scopes: ['read'],
    });
    const res = await POST_KEY(req);
    expect(res.status).toBe(500);
  });

  it('handles database error during webhook creation', async () => {
    mockWebhookCreate.mockRejectedValue(new Error('Connection lost'));

    const req = createPostRequest('/api/v1/developer/webhooks', {
      propertyId: PROPERTY_ID,
      url: 'https://example.com/hook',
      events: ['package.received'],
    });
    const res = await POST_WEBHOOK(req);
    expect(res.status).toBe(500);
  });

  it('handles database error during key listing', async () => {
    mockApiKeyFindMany.mockRejectedValue(new Error('Timeout'));

    const req = createGetRequest('/api/v1/developer/api-keys', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET_KEYS(req);
    expect(res.status).toBe(500);
  });

  it('handles database error during webhook listing', async () => {
    mockWebhookFindMany.mockRejectedValue(new Error('Timeout'));

    const req = createGetRequest('/api/v1/developer/webhooks', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET_WEBHOOKS(req);
    expect(res.status).toBe(500);
  });
});
