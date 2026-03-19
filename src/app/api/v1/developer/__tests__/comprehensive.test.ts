/**
 * PRD 26 — Developer Portal Comprehensive Tests
 *
 * Extended TDD coverage for API key lifecycle (create, list masked, revoke),
 * scope enforcement, webhook registration with HTTPS validation,
 * event filtering, delivery with HMAC signature, retry with exponential
 * backoff, and delivery log.
 *
 * These tests complement route.test.ts with additional edge-case coverage.
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

vi.mock('nanoid', () => ({
  nanoid: vi.fn().mockReturnValue('abcdefghijklmnopqrstuvwxyz123456'),
}));

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
const KEY_ID = '00000000-0000-4000-e000-000000000001';
const WEBHOOK_ID = '00000000-0000-4000-f000-000000000001';

// ===========================================================================
// 1. API key create — shown once, then masked
// ===========================================================================

describe('API Key Create — Shown Once (Comprehensive)', () => {
  it('returns key with conc_live_ prefix on creation', async () => {
    mockApiKeyCreate.mockResolvedValue({
      id: KEY_ID,
      name: 'Fresh Key',
      keyPrefix: 'conc_live_abcd',
      rateLimit: 1000,
      expiresAt: null,
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/developer/api-keys', {
      propertyId: PROPERTY_ID,
      name: 'Fresh Key',
      scopes: ['read'],
    });
    const res = await POST_KEY(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{ data: { key: string }; message: string }>(res);
    expect(body.data.key).toMatch(/^conc_live_/);
    expect(body.message).toContain('not be shown again');
  });

  it('key creation stores optional expiresAt', async () => {
    const expiresAt = new Date('2027-01-01');
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
});

// ===========================================================================
// 2. API key list — masked values
// ===========================================================================

describe('API Key List — Masked (Comprehensive)', () => {
  it('returns multiple keys with masked values', async () => {
    mockApiKeyFindMany.mockResolvedValue([
      {
        id: 'key-1',
        name: 'Key A',
        keyPrefix: 'conc_live_aaaa',
        permissions: { scopes: ['read'] },
        rateLimit: 1000,
        expiresAt: null,
        lastUsedAt: new Date(),
        createdAt: new Date(),
      },
      {
        id: 'key-2',
        name: 'Key B',
        keyPrefix: 'conc_live_bbbb',
        permissions: { scopes: ['read', 'write'] },
        rateLimit: 2000,
        expiresAt: new Date('2027-01-01'),
        lastUsedAt: null,
        createdAt: new Date(),
      },
    ]);

    const req = createGetRequest('/api/v1/developer/api-keys', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    const res = await GET_KEYS(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: Array<{ maskedKey: string; name: string }> }>(res);
    expect(body.data).toHaveLength(2);
    // Both keys should be masked
    for (const key of body.data) {
      expect(key.maskedKey).toContain('...');
    }
  });

  it('filters out revoked keys by default', async () => {
    const req = createGetRequest('/api/v1/developer/api-keys', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    await GET_KEYS(req);

    const where = mockApiKeyFindMany.mock.calls[0]![0].where;
    expect(where.revokedAt).toBeNull();
  });
});

// ===========================================================================
// 3. API key revoke
// ===========================================================================

describe('API Key Revoke (Comprehensive)', () => {
  it('sets revokedAt timestamp on revocation', async () => {
    mockApiKeyFindUnique.mockResolvedValue({
      id: KEY_ID,
      name: 'To Revoke',
      revokedAt: null,
    });
    mockApiKeyUpdate.mockResolvedValue({
      id: KEY_ID,
      revokedAt: new Date(),
    });

    const req = createDeleteRequest('/api/v1/developer/api-keys/revoke');
    const res = await DELETE_KEY(req, { params: Promise.resolve({ id: KEY_ID }) });
    expect(res.status).toBe(200);

    const updateData = mockApiKeyUpdate.mock.calls[0]![0].data;
    expect(updateData.revokedAt).toBeInstanceOf(Date);
  });

  it('already-revoked key returns ALREADY_REVOKED error', async () => {
    mockApiKeyFindUnique.mockResolvedValue({
      id: KEY_ID,
      revokedAt: new Date('2026-01-01'),
    });

    const req = createDeleteRequest('/api/v1/developer/api-keys/revoke');
    const res = await DELETE_KEY(req, { params: Promise.resolve({ id: KEY_ID }) });
    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('ALREADY_REVOKED');
  });
});

// ===========================================================================
// 4. Key scope enforcement (read/write/admin)
// ===========================================================================

describe('Key Scope Enforcement (Comprehensive)', () => {
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

    const createData = mockApiKeyCreate.mock.calls[0]![0].data;
    expect(createData.permissions).toEqual({ scopes: ['read'] });
  });

  it('accepts all three valid scopes together', async () => {
    mockApiKeyCreate.mockResolvedValue({
      id: KEY_ID,
      name: 'Full',
      keyPrefix: 'conc_live_abcd',
      rateLimit: 1000,
      expiresAt: null,
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/developer/api-keys', {
      propertyId: PROPERTY_ID,
      name: 'Full',
      scopes: ['read', 'write', 'admin'],
    });
    const res = await POST_KEY(req);
    expect(res.status).toBe(201);
  });

  it('rejects scope values outside read/write/admin', async () => {
    const req = createPostRequest('/api/v1/developer/api-keys', {
      propertyId: PROPERTY_ID,
      name: 'Bad',
      scopes: ['read', 'delete'],
    });
    const res = await POST_KEY(req);
    expect(res.status).toBe(400);
  });

  it('rejects empty scopes array', async () => {
    const req = createPostRequest('/api/v1/developer/api-keys', {
      propertyId: PROPERTY_ID,
      name: 'No Scopes',
      scopes: [],
    });
    const res = await POST_KEY(req);
    expect(res.status).toBe(400);
  });
});

// ===========================================================================
// 5. Webhook registration with HTTPS validation
// ===========================================================================

describe('Webhook Registration — HTTPS Validation (Comprehensive)', () => {
  it('rejects localhost URLs', async () => {
    const req = createPostRequest('/api/v1/developer/webhooks', {
      propertyId: PROPERTY_ID,
      url: 'http://localhost:3000/hook',
      events: ['package.received'],
    });
    const res = await POST_WEBHOOK(req);
    expect(res.status).toBe(400);
  });

  it('rejects IP address URLs without HTTPS', async () => {
    const req = createPostRequest('/api/v1/developer/webhooks', {
      propertyId: PROPERTY_ID,
      url: 'http://192.168.1.1/hook',
      events: ['package.received'],
    });
    const res = await POST_WEBHOOK(req);
    expect(res.status).toBe(400);
  });

  it('accepts valid HTTPS URL with path', async () => {
    mockWebhookCreate.mockResolvedValue({
      id: WEBHOOK_ID,
      url: 'https://api.example.com/v1/webhooks/concierge',
      events: ['package.received'],
      status: 'active',
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/developer/webhooks', {
      propertyId: PROPERTY_ID,
      url: 'https://api.example.com/v1/webhooks/concierge',
      events: ['package.received'],
    });
    const res = await POST_WEBHOOK(req);
    expect(res.status).toBe(201);
  });
});

// ===========================================================================
// 6. Webhook event filtering
// ===========================================================================

describe('Webhook Event Filtering (Comprehensive)', () => {
  it('stores multiple events on webhook creation', async () => {
    mockWebhookCreate.mockResolvedValue({
      id: WEBHOOK_ID,
      url: 'https://example.com/hook',
      events: ['package.received', 'maintenance.created', 'visitor.checkedIn'],
      status: 'active',
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/developer/webhooks', {
      propertyId: PROPERTY_ID,
      url: 'https://example.com/hook',
      events: ['package.received', 'maintenance.created', 'visitor.checkedIn'],
    });
    const res = await POST_WEBHOOK(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{ data: { events: string[] } }>(res);
    expect(body.data.events).toHaveLength(3);
    expect(body.data.events).toContain('visitor.checkedIn');
  });

  it('PATCH can update event filters on existing webhook', async () => {
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
    expect(updateData.events).toContain('maintenance.created');
  });
});

// ===========================================================================
// 7. Webhook delivery with HMAC signature
// ===========================================================================

describe('Webhook Delivery — HMAC Signature (Comprehensive)', () => {
  const mockWebhook: WebhookTarget = {
    id: WEBHOOK_ID,
    url: 'https://example.com/hook',
    secretHash: 'test-hmac-secret',
    events: ['event.created'],
    status: 'active',
  };

  const testPayload: WebhookPayload = {
    event: 'event.created',
    timestamp: '2026-03-18T14:00:00Z',
    data: { eventId: 'evt-100', type: 'package_received' },
  };

  it('signature is deterministic for same payload and secret', () => {
    const payload = JSON.stringify(testPayload);
    const sig1 = generateWebhookSignature(payload, 'secret1');
    const sig2 = generateWebhookSignature(payload, 'secret1');
    expect(sig1).toBe(sig2);
  });

  it('different secrets produce different signatures', () => {
    const payload = JSON.stringify(testPayload);
    const sig1 = generateWebhookSignature(payload, 'secret1');
    const sig2 = generateWebhookSignature(payload, 'secret2');
    expect(sig1).not.toBe(sig2);
  });

  it('delivery sets correct Content-Type and User-Agent headers', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ status: 200 });

    await deliverWebhook(mockWebhook, testPayload, {
      fetchFn: mockFetch,
      sleepFn: vi.fn(),
    });

    const headers = (mockFetch.mock.calls[0]![1] as RequestInit).headers as Record<string, string>;
    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['User-Agent']).toBe('Concierge-Webhooks/1.0');
  });

  it('delivery includes X-Webhook-Event header matching the event type', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ status: 200 });

    await deliverWebhook(mockWebhook, testPayload, {
      fetchFn: mockFetch,
      sleepFn: vi.fn(),
    });

    const headers = (mockFetch.mock.calls[0]![1] as RequestInit).headers as Record<string, string>;
    expect(headers['X-Webhook-Event']).toBe('event.created');
  });
});

// ===========================================================================
// 8. Retry with exponential backoff
// ===========================================================================

describe('Retry — Exponential Backoff (Comprehensive)', () => {
  it('exponential backoff: attempt 3 delay is 4000ms', () => {
    expect(calculateRetryDelay(2)).toBe(4000);
  });

  it('exponential backoff: attempt 4 delay is 8000ms', () => {
    expect(calculateRetryDelay(3)).toBe(8000);
  });

  it('first attempt has no sleep delay', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ status: 200 });
    const mockSleep = vi.fn().mockResolvedValue(undefined);

    const webhook: WebhookTarget = {
      id: WEBHOOK_ID,
      url: 'https://example.com/hook',
      secretHash: 'sec',
      events: ['test.event'],
      status: 'active',
    };

    await deliverWebhook(
      webhook,
      { event: 'test.event', timestamp: new Date().toISOString(), data: {} },
      { fetchFn: mockFetch, sleepFn: mockSleep },
    );

    // sleep should not be called for successful first attempt
    expect(mockSleep).not.toHaveBeenCalled();
  });

  it('timeout/network error is handled without crash', async () => {
    const mockFetch = vi.fn().mockRejectedValue(new Error('ETIMEDOUT'));
    const mockSleep = vi.fn().mockResolvedValue(undefined);

    const webhook: WebhookTarget = {
      id: WEBHOOK_ID,
      url: 'https://example.com/hook',
      secretHash: 'sec',
      events: ['test.event'],
      status: 'active',
    };

    const result = await deliverWebhook(
      webhook,
      { event: 'test.event', timestamp: new Date().toISOString(), data: {} },
      { fetchFn: mockFetch, sleepFn: mockSleep },
    );

    expect(result.finalSuccess).toBe(false);
    expect(result.results).toHaveLength(3);
    expect(result.results[0]!.error).toBe('ETIMEDOUT');
  });
});

// ===========================================================================
// 9. Delivery log
// ===========================================================================

describe('Delivery Log (Comprehensive)', () => {
  it('delivery log entries include responseTime', async () => {
    mockWebhookFindUnique.mockResolvedValue({
      id: WEBHOOK_ID,
      url: 'https://example.com/hook',
    });
    mockDeliveryFindMany.mockResolvedValue([
      {
        id: 'del-1',
        webhookId: WEBHOOK_ID,
        eventType: 'package.received',
        payload: {},
        statusCode: 200,
        responseTime: 42,
        attempt: 1,
        success: true,
        error: null,
        createdAt: new Date(),
      },
    ]);
    mockDeliveryCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/developer/webhooks/deliveries');
    const res = await GET_DELIVERIES(req, {
      params: Promise.resolve({ id: WEBHOOK_ID }),
    });
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: Array<{ responseTime: number; statusCode: number }>;
    }>(res);
    expect(body.data[0]!.responseTime).toBe(42);
    expect(body.data[0]!.statusCode).toBe(200);
  });

  it('delivery log shows failed entries with error details', async () => {
    mockWebhookFindUnique.mockResolvedValue({
      id: WEBHOOK_ID,
      url: 'https://example.com/hook',
    });
    mockDeliveryFindMany.mockResolvedValue([
      {
        id: 'del-fail',
        webhookId: WEBHOOK_ID,
        eventType: 'maintenance.created',
        payload: {},
        statusCode: 502,
        responseTime: 5000,
        attempt: 3,
        success: false,
        error: 'Bad Gateway',
        createdAt: new Date(),
      },
    ]);
    mockDeliveryCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/developer/webhooks/deliveries');
    const res = await GET_DELIVERIES(req, {
      params: Promise.resolve({ id: WEBHOOK_ID }),
    });

    const body = await parseResponse<{
      data: Array<{ success: boolean; error: string; attempt: number }>;
    }>(res);
    expect(body.data[0]!.success).toBe(false);
    expect(body.data[0]!.error).toBe('Bad Gateway');
    expect(body.data[0]!.attempt).toBe(3);
  });

  it('delivery log returns empty when no deliveries exist', async () => {
    mockWebhookFindUnique.mockResolvedValue({
      id: WEBHOOK_ID,
      url: 'https://example.com/hook',
    });
    mockDeliveryFindMany.mockResolvedValue([]);
    mockDeliveryCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/developer/webhooks/deliveries');
    const res = await GET_DELIVERIES(req, {
      params: Promise.resolve({ id: WEBHOOK_ID }),
    });

    const body = await parseResponse<{ data: unknown[]; meta: { total: number } }>(res);
    expect(body.data).toHaveLength(0);
    expect(body.meta.total).toBe(0);
  });
});

// ===========================================================================
// 10. Webhook secret generation
// ===========================================================================

describe('Webhook Secret — Generation and Storage', () => {
  it('webhook creation returns secret with whsec_ prefix', async () => {
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
    const res = await POST_WEBHOOK(req);
    const body = await parseResponse<{ data: { secret: string } }>(res);
    expect(body.data.secret).toMatch(/^whsec_/);
  });

  it('stored secretHash is SHA-256 hex, not the raw secret', async () => {
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
    expect(createData.secretHash).toMatch(/^[a-f0-9]{64}$/);
    expect(createData.secretHash).not.toContain('whsec_');
  });
});

// ===========================================================================
// 11. Webhook delete
// ===========================================================================

describe('Webhook Delete (Comprehensive)', () => {
  it('delete removes the webhook and confirms deletion', async () => {
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

    const body = await parseResponse<{ data: { deleted: boolean } }>(res);
    expect(body.data.deleted).toBe(true);
  });

  it('delete returns 404 for unknown webhook', async () => {
    mockWebhookFindUnique.mockResolvedValue(null);

    const req = createDeleteRequest('/api/v1/developer/webhooks/delete');
    const res = await DELETE_WEBHOOK(req, {
      params: Promise.resolve({ id: 'missing' }),
    });
    expect(res.status).toBe(404);
  });
});

// ===========================================================================
// 12. Webhook PATCH — URL update validation
// ===========================================================================

describe('Webhook PATCH — URL Update Validation (Comprehensive)', () => {
  it('rejects PATCH with non-URL string', async () => {
    mockWebhookFindUnique.mockResolvedValue({
      id: WEBHOOK_ID,
      url: 'https://example.com/hook',
    });

    const req = createPatchRequest('/api/v1/developer/webhooks/update', {
      url: 'not-a-url-at-all',
    });
    const res = await PATCH_WEBHOOK(req, {
      params: Promise.resolve({ id: WEBHOOK_ID }),
    });
    expect(res.status).toBe(400);
  });

  it('accepts PATCH with valid HTTPS URL', async () => {
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
  });
});
