/**
 * Webhook Delivery Service Tests
 *
 * Validates HMAC-SHA256 signing, signature verification, delivery with retries,
 * exponential backoff, delivery logging, timeout handling, and edge cases.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  signPayload,
  verifySignature,
  deliverWebhook,
  retryDelivery,
  getDeliveryLog,
  clearDeliveryLog,
  getAllDeliveryLogs,
  calculateRetryDelay,
  isValidWebhookEvent,
  MAX_RETRY_ATTEMPTS,
  DEFAULT_TIMEOUT_MS,
  WEBHOOK_EVENTS,
  type WebhookEndpoint,
  type WebhookEvent,
  type DeliveryOptions,
} from '../webhook-delivery';

// ---------------------------------------------------------------------------
// Mock logger
// ---------------------------------------------------------------------------

vi.mock('@/server/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createWebhook(overrides: Partial<WebhookEndpoint> = {}): WebhookEndpoint {
  return {
    id: 'wh-1',
    url: 'https://example.com/webhooks',
    secret: 'test-secret-key-123',
    events: ['package.received', 'maintenance.created'],
    active: true,
    ...overrides,
  };
}

function createMockFetch(
  status: number = 200,
  body: string = '{"ok": true}',
): (url: string, init: RequestInit) => Promise<Response> {
  return vi.fn().mockResolvedValue({
    status,
    ok: status >= 200 && status < 300,
    text: () => Promise.resolve(body),
  } as Response);
}

function createFailingFetch(error: Error): (url: string, init: RequestInit) => Promise<Response> {
  return vi.fn().mockRejectedValue(error);
}

const noopSleep: (ms: number) => Promise<void> = vi.fn().mockResolvedValue(undefined);

let idSeq = 0;
const testGenerateId = (): string => {
  idSeq++;
  return `test-id-${idSeq}`;
};

const defaultOptions: DeliveryOptions = {
  sleepFn: noopSleep,
  generateId: testGenerateId,
};

// ---------------------------------------------------------------------------
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  clearDeliveryLog();
  idSeq = 0;
});

// ---------------------------------------------------------------------------
// HMAC-SHA256 signing
// ---------------------------------------------------------------------------

describe('Webhook Delivery — Payload Signing', () => {
  it('signs payload with HMAC-SHA256', () => {
    const payload = '{"event":"package.received","data":{}}';
    const secret = 'my-secret';
    const signature = signPayload(payload, secret);

    expect(signature).toBeDefined();
    expect(typeof signature).toBe('string');
    // HMAC-SHA256 hex output is always 64 characters
    expect(signature).toHaveLength(64);
  });

  it('produces different signatures for different secrets', () => {
    const payload = '{"event":"test"}';
    const sig1 = signPayload(payload, 'secret-1');
    const sig2 = signPayload(payload, 'secret-2');
    expect(sig1).not.toBe(sig2);
  });

  it('produces different signatures for different payloads', () => {
    const secret = 'same-secret';
    const sig1 = signPayload('{"a":1}', secret);
    const sig2 = signPayload('{"a":2}', secret);
    expect(sig1).not.toBe(sig2);
  });

  it('produces consistent signatures for same input', () => {
    const payload = '{"event":"test"}';
    const secret = 'my-secret';
    const sig1 = signPayload(payload, secret);
    const sig2 = signPayload(payload, secret);
    expect(sig1).toBe(sig2);
  });
});

// ---------------------------------------------------------------------------
// Signature verification
// ---------------------------------------------------------------------------

describe('Webhook Delivery — Signature Verification', () => {
  it('verifies a valid signature', () => {
    const payload = '{"event":"package.received"}';
    const secret = 'webhook-secret';
    const signature = signPayload(payload, secret);

    expect(verifySignature(payload, signature, secret)).toBe(true);
  });

  it('rejects an invalid signature', () => {
    const payload = '{"event":"package.received"}';
    const secret = 'webhook-secret';
    const badSignature = 'a'.repeat(64);

    expect(verifySignature(payload, badSignature, secret)).toBe(false);
  });

  it('rejects a tampered payload', () => {
    const original = '{"event":"package.received","data":{"id":"1"}}';
    const tampered = '{"event":"package.received","data":{"id":"2"}}';
    const secret = 'webhook-secret';
    const signature = signPayload(original, secret);

    expect(verifySignature(tampered, signature, secret)).toBe(false);
  });

  it('rejects a signature with wrong length', () => {
    const payload = '{"event":"test"}';
    const secret = 'webhook-secret';
    const shortSig = 'abc123';

    expect(verifySignature(payload, shortSig, secret)).toBe(false);
  });

  it('rejects an empty signature', () => {
    const payload = '{"event":"test"}';
    expect(verifySignature(payload, '', 'secret')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Retry delay calculation
// ---------------------------------------------------------------------------

describe('Webhook Delivery — Retry Delays', () => {
  it('attempt 1 has 1s delay', () => {
    expect(calculateRetryDelay(1)).toBe(1000);
  });

  it('attempt 2 has 4s delay', () => {
    expect(calculateRetryDelay(2)).toBe(4000);
  });

  it('attempt 3 has 16s delay', () => {
    expect(calculateRetryDelay(3)).toBe(16000);
  });
});

// ---------------------------------------------------------------------------
// Successful delivery
// ---------------------------------------------------------------------------

describe('Webhook Delivery — Successful Delivery', () => {
  it('delivers webhook and records success', async () => {
    const fetchFn = createMockFetch(200);
    const webhook = createWebhook();

    const attempts = await deliverWebhook(
      webhook,
      'package.received',
      { packageId: 'pkg-1' },
      { ...defaultOptions, fetchFn },
    );

    expect(attempts).toHaveLength(1);
    expect(attempts[0]!.success).toBe(true);
    expect(attempts[0]!.responseStatus).toBe(200);
    expect(attempts[0]!.attempt).toBe(1);
  });

  it('records response status code', async () => {
    const fetchFn = createMockFetch(201, '{"status":"created"}');
    const webhook = createWebhook();

    const attempts = await deliverWebhook(
      webhook,
      'maintenance.created',
      { ticketId: 'mt-1' },
      { ...defaultOptions, fetchFn },
    );

    expect(attempts[0]!.responseStatus).toBe(201);
    expect(attempts[0]!.responseBody).toBe('{"status":"created"}');
  });

  it('records delivery duration', async () => {
    const fetchFn = createMockFetch(200);
    const webhook = createWebhook();

    const attempts = await deliverWebhook(
      webhook,
      'package.received',
      {},
      { ...defaultOptions, fetchFn },
    );

    expect(attempts[0]!.duration).toBeGreaterThanOrEqual(0);
  });

  it('sends correct headers', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      text: () => Promise.resolve('ok'),
    } as Response);

    const webhook = createWebhook();
    await deliverWebhook(webhook, 'package.received', { id: '1' }, { ...defaultOptions, fetchFn });

    expect(fetchFn).toHaveBeenCalledTimes(1);
    const callArgs = fetchFn.mock.calls[0]!;
    const init = callArgs[1] as RequestInit;
    const headers = init.headers as Record<string, string>;

    expect(headers['Content-Type']).toBe('application/json');
    expect(headers['User-Agent']).toBe('Concierge-Webhooks/1.0');
    expect(headers['X-Webhook-Signature']).toBeDefined();
    expect(headers['X-Webhook-Event']).toBe('package.received');
    expect(headers['X-Webhook-ID']).toBe('wh-1');
  });

  it('payload includes timestamp and event type', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      text: () => Promise.resolve('ok'),
    } as Response);

    const webhook = createWebhook();
    await deliverWebhook(
      webhook,
      'incident.created',
      { incidentId: 'inc-1' },
      { ...defaultOptions, fetchFn },
    );

    const callArgs = fetchFn.mock.calls[0]!;
    const body = JSON.parse((callArgs[1] as RequestInit).body as string);

    expect(body.event).toBe('incident.created');
    expect(body.timestamp).toBeDefined();
    expect(typeof body.timestamp).toBe('string');
    expect(body.data).toEqual({ incidentId: 'inc-1' });
  });

  it('signature in header matches the body', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      text: () => Promise.resolve('ok'),
    } as Response);

    const webhook = createWebhook({ secret: 'verify-me' });
    await deliverWebhook(webhook, 'package.received', { id: 'x' }, { ...defaultOptions, fetchFn });

    const callArgs = fetchFn.mock.calls[0]!;
    const init = callArgs[1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    const body = init.body as string;
    const headerSig = headers['X-Webhook-Signature']!;

    expect(verifySignature(body, headerSig, 'verify-me')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Retry behavior
// ---------------------------------------------------------------------------

describe('Webhook Delivery — Retry Behavior', () => {
  it('retries up to MAX_RETRY_ATTEMPTS on failure', async () => {
    const fetchFn = createMockFetch(500, 'Internal Server Error');
    const webhook = createWebhook();

    const attempts = await deliverWebhook(
      webhook,
      'package.received',
      {},
      { ...defaultOptions, fetchFn },
    );

    expect(attempts).toHaveLength(MAX_RETRY_ATTEMPTS);
    expect(fetchFn).toHaveBeenCalledTimes(MAX_RETRY_ATTEMPTS);
  });

  it('stops retrying after successful delivery', async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce({
        status: 500,
        ok: false,
        text: () => Promise.resolve('error'),
      } as Response)
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        text: () => Promise.resolve('ok'),
      } as Response);

    const webhook = createWebhook();

    const attempts = await deliverWebhook(
      webhook,
      'package.received',
      {},
      { ...defaultOptions, fetchFn },
    );

    expect(attempts).toHaveLength(2);
    expect(attempts[0]!.success).toBe(false);
    expect(attempts[1]!.success).toBe(true);
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it('uses exponential backoff between retries', async () => {
    const fetchFn = createMockFetch(500);
    const sleepFn = vi.fn().mockResolvedValue(undefined);
    const webhook = createWebhook();

    await deliverWebhook(webhook, 'package.received', {}, { ...defaultOptions, fetchFn, sleepFn });

    // Sleep is called before retry 2 and retry 3 (not before attempt 1)
    expect(sleepFn).toHaveBeenCalledTimes(2);
    expect(sleepFn).toHaveBeenNthCalledWith(1, 1000); // attempt 2: delay(1) = 1s
    expect(sleepFn).toHaveBeenNthCalledWith(2, 4000); // attempt 3: delay(2) = 4s
  });

  it('max 3 retry attempts', () => {
    expect(MAX_RETRY_ATTEMPTS).toBe(3);
  });

  it('successful retry stops further attempts', async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce({
        status: 502,
        ok: false,
        text: () => Promise.resolve('Bad Gateway'),
      } as Response)
      .mockResolvedValueOnce({
        status: 502,
        ok: false,
        text: () => Promise.resolve('Bad Gateway'),
      } as Response)
      .mockResolvedValueOnce({
        status: 200,
        ok: true,
        text: () => Promise.resolve('ok'),
      } as Response);

    const webhook = createWebhook();

    const attempts = await deliverWebhook(
      webhook,
      'package.received',
      {},
      { ...defaultOptions, fetchFn },
    );

    expect(attempts).toHaveLength(3);
    expect(attempts[2]!.success).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Delivery log
// ---------------------------------------------------------------------------

describe('Webhook Delivery — Delivery Log', () => {
  it('delivery creates log entry', async () => {
    const fetchFn = createMockFetch(200);
    const webhook = createWebhook();

    await deliverWebhook(webhook, 'package.received', {}, { ...defaultOptions, fetchFn });

    const logs = getDeliveryLog('wh-1');
    expect(logs).toHaveLength(1);
    expect(logs[0]!.webhookId).toBe('wh-1');
    expect(logs[0]!.event).toBe('package.received');
  });

  it('delivery log retrieval respects limit', async () => {
    const fetchFn = createMockFetch(200);
    const webhook = createWebhook();

    // Create 5 deliveries
    for (let i = 0; i < 5; i++) {
      await deliverWebhook(
        webhook,
        'package.received',
        { index: i },
        { ...defaultOptions, fetchFn },
      );
    }

    const logs = getDeliveryLog('wh-1', 3);
    expect(logs).toHaveLength(3);
  });

  it('delivery log filters by webhookId', async () => {
    const fetchFn = createMockFetch(200);
    const webhook1 = createWebhook({ id: 'wh-1' });
    const webhook2 = createWebhook({ id: 'wh-2' });

    await deliverWebhook(webhook1, 'package.received', {}, { ...defaultOptions, fetchFn });
    await deliverWebhook(webhook2, 'maintenance.created', {}, { ...defaultOptions, fetchFn });

    const logs1 = getDeliveryLog('wh-1');
    const logs2 = getDeliveryLog('wh-2');

    expect(logs1).toHaveLength(1);
    expect(logs2).toHaveLength(1);
    expect(logs1[0]!.event).toBe('package.received');
    expect(logs2[0]!.event).toBe('maintenance.created');
  });

  it('failed delivery attempts are also logged', async () => {
    const fetchFn = createMockFetch(500);
    const webhook = createWebhook();

    await deliverWebhook(webhook, 'package.received', {}, { ...defaultOptions, fetchFn });

    const logs = getAllDeliveryLogs();
    expect(logs).toHaveLength(3); // 3 failed attempts
    for (const log of logs) {
      expect(log.success).toBe(false);
    }
  });

  it('clearDeliveryLog empties the log', async () => {
    const fetchFn = createMockFetch(200);
    await deliverWebhook(createWebhook(), 'package.received', {}, { ...defaultOptions, fetchFn });

    expect(getAllDeliveryLogs().length).toBeGreaterThan(0);
    clearDeliveryLog();
    expect(getAllDeliveryLogs()).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Network error handling
// ---------------------------------------------------------------------------

describe('Webhook Delivery — Error Handling', () => {
  it('handles network errors gracefully', async () => {
    const fetchFn = createFailingFetch(new Error('ECONNREFUSED'));
    const webhook = createWebhook();

    const attempts = await deliverWebhook(
      webhook,
      'package.received',
      {},
      { ...defaultOptions, fetchFn },
    );

    expect(attempts).toHaveLength(3);
    for (const attempt of attempts) {
      expect(attempt.success).toBe(false);
      expect(attempt.responseStatus).toBeNull();
      expect(attempt.responseBody).toBe('ECONNREFUSED');
    }
  });

  it('handles timeout errors', async () => {
    const fetchFn = createFailingFetch(new Error('The operation was aborted due to timeout'));
    const webhook = createWebhook();

    const attempts = await deliverWebhook(
      webhook,
      'incident.created',
      {},
      { ...defaultOptions, fetchFn },
    );

    expect(attempts).toHaveLength(3);
    expect(attempts[0]!.success).toBe(false);
    expect(attempts[0]!.responseBody).toContain('timeout');
  });

  it('default timeout is 5 seconds', () => {
    expect(DEFAULT_TIMEOUT_MS).toBe(5000);
  });
});

// ---------------------------------------------------------------------------
// Webhook event types
// ---------------------------------------------------------------------------

describe('Webhook Delivery — Event Types', () => {
  it('defines all expected event types', () => {
    expect(WEBHOOK_EVENTS).toContain('package.received');
    expect(WEBHOOK_EVENTS).toContain('package.released');
    expect(WEBHOOK_EVENTS).toContain('maintenance.created');
    expect(WEBHOOK_EVENTS).toContain('maintenance.resolved');
    expect(WEBHOOK_EVENTS).toContain('visitor.signed_in');
    expect(WEBHOOK_EVENTS).toContain('visitor.signed_out');
    expect(WEBHOOK_EVENTS).toContain('incident.created');
    expect(WEBHOOK_EVENTS).toContain('booking.created');
    expect(WEBHOOK_EVENTS).toContain('booking.cancelled');
  });

  it('has exactly 9 event types', () => {
    expect(WEBHOOK_EVENTS).toHaveLength(9);
  });

  it('validates known event types', () => {
    expect(isValidWebhookEvent('package.received')).toBe(true);
    expect(isValidWebhookEvent('maintenance.created')).toBe(true);
    expect(isValidWebhookEvent('booking.cancelled')).toBe(true);
  });

  it('rejects unknown event types', () => {
    expect(isValidWebhookEvent('unknown.event')).toBe(false);
    expect(isValidWebhookEvent('')).toBe(false);
    expect(isValidWebhookEvent('package')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Retry delivery
// ---------------------------------------------------------------------------

describe('Webhook Delivery — retryDelivery', () => {
  it('retries a previously failed delivery', async () => {
    const failFetch = createMockFetch(500);
    const webhook = createWebhook();

    // First delivery fails
    await deliverWebhook(
      webhook,
      'package.received',
      { id: 'pkg-1' },
      { ...defaultOptions, fetchFn: failFetch },
    );

    const logs = getAllDeliveryLogs();
    const failedId = logs[0]!.id;

    // Now retry with successful fetch
    const successFetch = createMockFetch(200);
    const retryAttempts = await retryDelivery(failedId, webhook, {
      ...defaultOptions,
      fetchFn: successFetch,
    });

    expect(retryAttempts).not.toBeNull();
    expect(retryAttempts!).toHaveLength(1);
    expect(retryAttempts![0]!.success).toBe(true);
  });

  it('returns null for unknown delivery ID', async () => {
    const result = await retryDelivery('nonexistent-id', createWebhook(), defaultOptions);
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Edge cases
// ---------------------------------------------------------------------------

describe('Webhook Delivery — Edge Cases', () => {
  it('handles empty data payload', async () => {
    const fetchFn = createMockFetch(200);
    const webhook = createWebhook();

    const attempts = await deliverWebhook(
      webhook,
      'package.received',
      {},
      { ...defaultOptions, fetchFn },
    );

    expect(attempts).toHaveLength(1);
    expect(attempts[0]!.success).toBe(true);
  });

  it('handles large data payload', async () => {
    const fetchFn = createMockFetch(200);
    const webhook = createWebhook();
    const largeData: Record<string, unknown> = {};
    for (let i = 0; i < 100; i++) {
      largeData[`field_${i}`] = `value_${i}_${'x'.repeat(100)}`;
    }

    const attempts = await deliverWebhook(webhook, 'maintenance.created', largeData, {
      ...defaultOptions,
      fetchFn,
    });

    expect(attempts).toHaveLength(1);
    expect(attempts[0]!.success).toBe(true);
  });

  it('each attempt has incrementing attempt number', async () => {
    const fetchFn = createMockFetch(503);
    const webhook = createWebhook();

    const attempts = await deliverWebhook(
      webhook,
      'package.received',
      {},
      { ...defaultOptions, fetchFn },
    );

    expect(attempts[0]!.attempt).toBe(1);
    expect(attempts[1]!.attempt).toBe(2);
    expect(attempts[2]!.attempt).toBe(3);
  });

  it('delivery log entries have createdAt timestamps', async () => {
    const fetchFn = createMockFetch(200);
    const webhook = createWebhook();

    await deliverWebhook(webhook, 'package.received', {}, { ...defaultOptions, fetchFn });

    const logs = getDeliveryLog('wh-1');
    expect(logs[0]!.createdAt).toBeInstanceOf(Date);
  });
});
