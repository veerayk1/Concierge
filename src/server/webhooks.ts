/**
 * Webhook Delivery Engine
 *
 * Handles sending webhook payloads to registered endpoints with:
 * - HMAC-SHA256 signature verification (shared secret)
 * - Retry with exponential backoff (3 attempts)
 * - Delivery logging
 *
 * Per PRD 26 — Developer Portal & API
 */

import { createHmac } from 'crypto';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WebhookTarget {
  id: string;
  url: string;
  secretHash: string;
  events: string[];
  status: string;
}

export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: Record<string, unknown>;
}

export interface DeliveryResult {
  success: boolean;
  statusCode: number | null;
  responseTime: number;
  error: string | null;
  attempt: number;
}

export interface DeliveryRecord {
  webhookId: string;
  eventType: string;
  payload: WebhookPayload;
  results: DeliveryResult[];
  finalSuccess: boolean;
}

// ---------------------------------------------------------------------------
// Signature Generation
// ---------------------------------------------------------------------------

/**
 * Generates an HMAC-SHA256 signature for a webhook payload.
 * The consumer can verify this against the X-Webhook-Signature header.
 */
export function generateWebhookSignature(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Verifies an HMAC-SHA256 webhook signature.
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  const expected = generateWebhookSignature(payload, secret);
  // Constant-time comparison to prevent timing attacks
  if (expected.length !== signature.length) return false;
  let result = 0;
  for (let i = 0; i < expected.length; i++) {
    result |= (expected.charCodeAt(i) ?? 0) ^ (signature.charCodeAt(i) ?? 0);
  }
  return result === 0;
}

// ---------------------------------------------------------------------------
// Retry Configuration
// ---------------------------------------------------------------------------

const MAX_ATTEMPTS = 3;
const BASE_DELAY_MS = 1000; // 1s, 2s, 4s exponential backoff

/**
 * Calculate delay for a given attempt number (0-indexed).
 * Uses exponential backoff: 1s, 2s, 4s
 */
export function calculateRetryDelay(attempt: number): number {
  return BASE_DELAY_MS * Math.pow(2, attempt);
}

// ---------------------------------------------------------------------------
// Delivery Engine
// ---------------------------------------------------------------------------

/**
 * Fetch function type — allows injection for testing.
 */
export type FetchFn = (url: string, init: RequestInit) => Promise<Response>;

/**
 * Sleep function type — allows injection for testing.
 */
export type SleepFn = (ms: number) => Promise<void>;

const defaultSleep: SleepFn = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Delivers a webhook payload to the target URL.
 * Retries up to 3 times with exponential backoff on failure.
 *
 * Returns a DeliveryRecord with all attempt results.
 */
export async function deliverWebhook(
  webhook: WebhookTarget,
  payload: WebhookPayload,
  options: {
    fetchFn?: FetchFn;
    sleepFn?: SleepFn;
    onAttempt?: (result: DeliveryResult) => void;
  } = {},
): Promise<DeliveryRecord> {
  const { fetchFn = fetch, sleepFn = defaultSleep, onAttempt } = options;

  const payloadStr = JSON.stringify(payload);
  const signature = generateWebhookSignature(payloadStr, webhook.secretHash);

  const results: DeliveryResult[] = [];

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    if (attempt > 0) {
      await sleepFn(calculateRetryDelay(attempt - 1));
    }

    const start = Date.now();
    let statusCode: number | null = null;
    let success = false;
    let error: string | null = null;

    try {
      const response = await fetchFn(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': payload.event,
          'X-Webhook-ID': webhook.id,
          'User-Agent': 'Concierge-Webhooks/1.0',
        },
        body: payloadStr,
        signal: AbortSignal.timeout(10000), // 10s timeout
      });

      statusCode = response.status;
      success = response.status >= 200 && response.status < 300;

      if (!success) {
        error = `HTTP ${response.status}`;
      }
    } catch (err) {
      error = err instanceof Error ? err.message : 'Unknown error';
    }

    const result: DeliveryResult = {
      success,
      statusCode,
      responseTime: Date.now() - start,
      error,
      attempt: attempt + 1,
    };

    results.push(result);
    onAttempt?.(result);

    if (success) {
      break;
    }
  }

  return {
    webhookId: webhook.id,
    eventType: payload.event,
    payload,
    results,
    finalSuccess: results.some((r) => r.success),
  };
}

export { MAX_ATTEMPTS, BASE_DELAY_MS };
