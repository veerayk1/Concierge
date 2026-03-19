/**
 * Webhook Delivery Retry Tests
 *
 * Focused testing of retry behavior: successful first attempt, exponential
 * backoff on 5xx failures, max retry limit, HMAC signature validation,
 * and timeout handling (5s limit).
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  signPayload,
  verifySignature,
  deliverWebhook,
  clearDeliveryLog,
  getAllDeliveryLogs,
  calculateRetryDelay,
  MAX_RETRY_ATTEMPTS,
  DEFAULT_TIMEOUT_MS,
  type WebhookEndpoint,
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
    id: 'wh-retry-1',
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
  return `retry-test-id-${idSeq}`;
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
// 1. Successful delivery on first attempt
// ---------------------------------------------------------------------------

describe('Webhook Retry — Successful First Attempt', () => {
  it('delivers on first try and records single successful attempt', async () => {
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
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });

  it('does not call sleep on first successful attempt', async () => {
    const fetchFn = createMockFetch(200);
    const sleepFn = vi.fn().mockResolvedValue(undefined);
    const webhook = createWebhook();

    await deliverWebhook(webhook, 'package.received', {}, { ...defaultOptions, fetchFn, sleepFn });

    expect(sleepFn).not.toHaveBeenCalled();
  });

  it('records delivery in the log on success', async () => {
    const fetchFn = createMockFetch(200);
    const webhook = createWebhook();

    await deliverWebhook(webhook, 'package.received', {}, { ...defaultOptions, fetchFn });

    const logs = getAllDeliveryLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0]!.success).toBe(true);
    expect(logs[0]!.webhookId).toBe('wh-retry-1');
  });

  it('handles 201 status as success', async () => {
    const fetchFn = createMockFetch(201, '{"status":"created"}');
    const webhook = createWebhook();

    const attempts = await deliverWebhook(
      webhook,
      'maintenance.created',
      { ticketId: 'mt-1' },
      { ...defaultOptions, fetchFn },
    );

    expect(attempts).toHaveLength(1);
    expect(attempts[0]!.success).toBe(true);
    expect(attempts[0]!.responseStatus).toBe(201);
  });

  it('records response body on success', async () => {
    const fetchFn = createMockFetch(200, '{"received":true}');
    const webhook = createWebhook();

    const attempts = await deliverWebhook(
      webhook,
      'package.received',
      {},
      { ...defaultOptions, fetchFn },
    );

    expect(attempts[0]!.responseBody).toBe('{"received":true}');
  });
});

// ---------------------------------------------------------------------------
// 2. Retry on 5xx failure with exponential backoff
// ---------------------------------------------------------------------------

describe('Webhook Retry — 5xx Failure with Exponential Backoff', () => {
  it('retries on 500 Internal Server Error', async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce({
        status: 500,
        ok: false,
        text: () => Promise.resolve('Internal Server Error'),
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
    expect(attempts[0]!.responseStatus).toBe(500);
    expect(attempts[1]!.success).toBe(true);
    expect(attempts[1]!.responseStatus).toBe(200);
  });

  it('retries on 502 Bad Gateway', async () => {
    const fetchFn = vi
      .fn()
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

    expect(attempts).toHaveLength(2);
    expect(attempts[1]!.success).toBe(true);
  });

  it('retries on 503 Service Unavailable', async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce({
        status: 503,
        ok: false,
        text: () => Promise.resolve('Service Unavailable'),
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
    expect(attempts[1]!.success).toBe(true);
  });

  it('uses exponential backoff: 1s then 4s', async () => {
    const fetchFn = createMockFetch(500);
    const sleepFn = vi.fn().mockResolvedValue(undefined);
    const webhook = createWebhook();

    await deliverWebhook(webhook, 'package.received', {}, { ...defaultOptions, fetchFn, sleepFn });

    // Sleep before retry 2 (1s) and retry 3 (4s), not before attempt 1
    expect(sleepFn).toHaveBeenCalledTimes(2);
    expect(sleepFn).toHaveBeenNthCalledWith(1, 1000);
    expect(sleepFn).toHaveBeenNthCalledWith(2, 4000);
  });

  it('calculateRetryDelay uses exponential formula', () => {
    expect(calculateRetryDelay(1)).toBe(1000); // 1s
    expect(calculateRetryDelay(2)).toBe(4000); // 4s
    expect(calculateRetryDelay(3)).toBe(16000); // 16s
  });

  it('attempt numbers are sequential starting at 1', async () => {
    const fetchFn = createMockFetch(500);
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
});

// ---------------------------------------------------------------------------
// 3. Max retry limit reached -> mark as failed
// ---------------------------------------------------------------------------

describe('Webhook Retry — Max Retry Limit', () => {
  it('stops after MAX_RETRY_ATTEMPTS (3) on persistent failure', async () => {
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

    // All attempts should be failures
    for (const attempt of attempts) {
      expect(attempt.success).toBe(false);
      expect(attempt.responseStatus).toBe(500);
    }
  });

  it('MAX_RETRY_ATTEMPTS is 3', () => {
    expect(MAX_RETRY_ATTEMPTS).toBe(3);
  });

  it('all failed attempts are logged', async () => {
    const fetchFn = createMockFetch(500);
    const webhook = createWebhook();

    await deliverWebhook(webhook, 'package.received', {}, { ...defaultOptions, fetchFn });

    const logs = getAllDeliveryLogs();
    expect(logs).toHaveLength(3);
    for (const log of logs) {
      expect(log.success).toBe(false);
    }
  });

  it('stops retrying immediately on success at attempt 2', async () => {
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
    expect(fetchFn).toHaveBeenCalledTimes(2);
    expect(attempts[1]!.success).toBe(true);
  });

  it('stops retrying at attempt 3 on success after 2 failures', async () => {
    const fetchFn = vi
      .fn()
      .mockResolvedValueOnce({
        status: 502,
        ok: false,
        text: () => Promise.resolve('Bad Gateway'),
      } as Response)
      .mockResolvedValueOnce({
        status: 503,
        ok: false,
        text: () => Promise.resolve('Service Unavailable'),
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
    expect(attempts[0]!.success).toBe(false);
    expect(attempts[1]!.success).toBe(false);
    expect(attempts[2]!.success).toBe(true);
  });

  it('handles network errors (ECONNREFUSED) with retries', async () => {
    const fetchFn = createFailingFetch(new Error('ECONNREFUSED'));
    const webhook = createWebhook();

    const attempts = await deliverWebhook(
      webhook,
      'package.received',
      {},
      { ...defaultOptions, fetchFn },
    );

    expect(attempts).toHaveLength(MAX_RETRY_ATTEMPTS);
    for (const attempt of attempts) {
      expect(attempt.success).toBe(false);
      expect(attempt.responseStatus).toBeNull();
      expect(attempt.responseBody).toBe('ECONNREFUSED');
    }
  });
});

// ---------------------------------------------------------------------------
// 4. HMAC signature validation
// ---------------------------------------------------------------------------

describe('Webhook Retry — HMAC Signature Validation', () => {
  it('signs payload with HMAC-SHA256 producing 64-char hex', () => {
    const payload = '{"event":"package.received","data":{}}';
    const signature = signPayload(payload, 'my-secret');

    expect(typeof signature).toBe('string');
    expect(signature).toHaveLength(64);
  });

  it('verifies valid signature', () => {
    const payload = '{"event":"package.received"}';
    const secret = 'webhook-secret';
    const signature = signPayload(payload, secret);

    expect(verifySignature(payload, signature, secret)).toBe(true);
  });

  it('rejects tampered payload', () => {
    const original = '{"event":"package.received","data":{"id":"1"}}';
    const tampered = '{"event":"package.received","data":{"id":"2"}}';
    const secret = 'webhook-secret';
    const signature = signPayload(original, secret);

    expect(verifySignature(tampered, signature, secret)).toBe(false);
  });

  it('rejects wrong secret', () => {
    const payload = '{"event":"test"}';
    const signature = signPayload(payload, 'correct-secret');

    expect(verifySignature(payload, signature, 'wrong-secret')).toBe(false);
  });

  it('rejects empty signature', () => {
    expect(verifySignature('{"event":"test"}', '', 'secret')).toBe(false);
  });

  it('rejects malformed signature (wrong length)', () => {
    expect(verifySignature('{"event":"test"}', 'abc123', 'secret')).toBe(false);
  });

  it('produces consistent signatures for identical inputs', () => {
    const payload = '{"event":"test"}';
    const secret = 'my-secret';
    expect(signPayload(payload, secret)).toBe(signPayload(payload, secret));
  });

  it('produces different signatures for different secrets', () => {
    const payload = '{"event":"test"}';
    expect(signPayload(payload, 'secret-1')).not.toBe(signPayload(payload, 'secret-2'));
  });

  it('webhook delivery includes correct HMAC signature in header', async () => {
    const fetchFn = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      text: () => Promise.resolve('ok'),
    } as Response);

    const webhook = createWebhook({ secret: 'verify-header-secret' });
    await deliverWebhook(webhook, 'package.received', { id: 'x' }, { ...defaultOptions, fetchFn });

    const callArgs = fetchFn.mock.calls[0]!;
    const init = callArgs[1] as RequestInit;
    const headers = init.headers as Record<string, string>;
    const body = init.body as string;
    const headerSig = headers['X-Webhook-Signature']!;

    expect(verifySignature(body, headerSig, 'verify-header-secret')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 5. Timeout handling (5s limit)
// ---------------------------------------------------------------------------

describe('Webhook Retry — Timeout Handling', () => {
  it('default timeout is 5 seconds', () => {
    expect(DEFAULT_TIMEOUT_MS).toBe(5000);
  });

  it('handles timeout error with retries', async () => {
    const fetchFn = createFailingFetch(new Error('The operation was aborted due to timeout'));
    const webhook = createWebhook();

    const attempts = await deliverWebhook(
      webhook,
      'incident.created',
      {},
      { ...defaultOptions, fetchFn },
    );

    expect(attempts).toHaveLength(MAX_RETRY_ATTEMPTS);
    for (const attempt of attempts) {
      expect(attempt.success).toBe(false);
      expect(attempt.responseBody).toContain('timeout');
    }
  });

  it('handles AbortError (timeout variant) with retries', async () => {
    const fetchFn = createFailingFetch(new Error('The operation was aborted'));
    const webhook = createWebhook();

    const attempts = await deliverWebhook(
      webhook,
      'package.received',
      {},
      { ...defaultOptions, fetchFn },
    );

    expect(attempts).toHaveLength(MAX_RETRY_ATTEMPTS);
    for (const attempt of attempts) {
      expect(attempt.success).toBe(false);
      expect(attempt.responseBody).toContain('aborted');
    }
  });

  it('timeout on first attempt still retries and can succeed on retry', async () => {
    const fetchFn = vi
      .fn()
      .mockRejectedValueOnce(new Error('The operation was aborted due to timeout'))
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
    expect(attempts[0]!.responseBody).toContain('timeout');
    expect(attempts[1]!.success).toBe(true);
  });

  it('records duration for each attempt', async () => {
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

  it('all attempts have createdAt timestamps', async () => {
    const fetchFn = createMockFetch(500);
    const webhook = createWebhook();

    const attempts = await deliverWebhook(
      webhook,
      'package.received',
      {},
      { ...defaultOptions, fetchFn },
    );

    for (const attempt of attempts) {
      expect(attempt.createdAt).toBeInstanceOf(Date);
    }
  });
});
