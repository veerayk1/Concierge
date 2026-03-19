/**
 * Concierge — Webhook Delivery Service
 *
 * Delivers webhook events to registered endpoints with:
 * - HMAC-SHA256 payload signing
 * - Signature verification
 * - Retry with exponential backoff (base 1s: 1s, 4s, 16s)
 * - Delivery logging
 * - 5s default timeout
 *
 * Per PRD 26 — Developer Portal & API
 *
 * @module server/services/webhook-delivery
 */

import { createHmac, timingSafeEqual } from 'crypto';
import { createLogger } from '@/server/logger';

const logger = createLogger('webhook-delivery');

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Supported webhook event types. */
export type WebhookEvent =
  | 'package.received'
  | 'package.released'
  | 'maintenance.created'
  | 'maintenance.resolved'
  | 'visitor.signed_in'
  | 'visitor.signed_out'
  | 'incident.created'
  | 'booking.created'
  | 'booking.cancelled';

/** All valid webhook event type strings. */
export const WEBHOOK_EVENTS: WebhookEvent[] = [
  'package.received',
  'package.released',
  'maintenance.created',
  'maintenance.resolved',
  'visitor.signed_in',
  'visitor.signed_out',
  'incident.created',
  'booking.created',
  'booking.cancelled',
];

/** A delivery attempt record. */
export interface DeliveryAttempt {
  id: string;
  webhookId: string;
  event: WebhookEvent;
  payload: Record<string, unknown>;
  responseStatus: number | null;
  responseBody: string | null;
  duration: number;
  attempt: number;
  createdAt: Date;
  success: boolean;
}

/** Configuration for a registered webhook endpoint. */
export interface WebhookEndpoint {
  id: string;
  url: string;
  secret: string;
  events: WebhookEvent[];
  active: boolean;
}

/** Options for webhook delivery (dependency injection for testing). */
export interface DeliveryOptions {
  fetchFn?: (url: string, init: RequestInit) => Promise<Response>;
  sleepFn?: (ms: number) => Promise<void>;
  generateId?: () => string;
  timeoutMs?: number;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const MAX_RETRY_ATTEMPTS = 3;
export const DEFAULT_TIMEOUT_MS = 5000;
const USER_AGENT = 'Concierge-Webhooks/1.0';

// ---------------------------------------------------------------------------
// Signature
// ---------------------------------------------------------------------------

/**
 * Sign a payload string with HMAC-SHA256 using the webhook secret.
 *
 * @param payload - The JSON string payload to sign
 * @param secret - The webhook's shared secret
 * @returns Hex-encoded HMAC-SHA256 signature
 */
export function signPayload(payload: string, secret: string): string {
  return createHmac('sha256', secret).update(payload).digest('hex');
}

/**
 * Verify an HMAC-SHA256 webhook signature using constant-time comparison.
 *
 * @param payload - The raw JSON string payload
 * @param signature - The signature to verify (hex-encoded)
 * @param secret - The webhook's shared secret
 * @returns true if the signature is valid
 */
export function verifySignature(payload: string, signature: string, secret: string): boolean {
  const expected = signPayload(payload, secret);

  // Both must be the same length for timingSafeEqual
  if (expected.length !== signature.length) {
    return false;
  }

  try {
    return timingSafeEqual(Buffer.from(expected, 'hex'), Buffer.from(signature, 'hex'));
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Retry delay calculation
// ---------------------------------------------------------------------------

/**
 * Calculate exponential backoff delay for a retry attempt.
 *
 * attempt 1 -> 1s (1000ms)
 * attempt 2 -> 4s (4000ms)
 * attempt 3 -> 16s (16000ms)
 *
 * Formula: base^(attempt+1) where base = 1000ms
 * Equivalent to: 1000 * 4^(attempt-1) for attempt starting at 1
 *
 * @param attempt - The retry attempt number (1-indexed)
 * @returns Delay in milliseconds
 */
export function calculateRetryDelay(attempt: number): number {
  // 1s, 4s, 16s
  return 1000 * Math.pow(4, attempt - 1);
}

// ---------------------------------------------------------------------------
// Delivery log (in-memory for now; production would use DB)
// ---------------------------------------------------------------------------

const deliveryLog: DeliveryAttempt[] = [];

/**
 * Get the delivery log for a specific webhook, ordered by most recent first.
 *
 * @param webhookId - The webhook endpoint ID
 * @param limit - Maximum number of entries to return (default 50)
 * @returns Array of delivery attempts
 */
export function getDeliveryLog(webhookId: string, limit: number = 50): DeliveryAttempt[] {
  return deliveryLog
    .filter((entry) => entry.webhookId === webhookId)
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .slice(0, limit);
}

/**
 * Clear the delivery log (primarily for testing).
 */
export function clearDeliveryLog(): void {
  deliveryLog.length = 0;
}

/**
 * Get all delivery log entries (primarily for testing).
 */
export function getAllDeliveryLogs(): DeliveryAttempt[] {
  return [...deliveryLog];
}

// ---------------------------------------------------------------------------
// Default helpers
// ---------------------------------------------------------------------------

const defaultSleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

let idCounter = 0;
const defaultGenerateId = (): string => {
  idCounter++;
  return `del_${Date.now()}_${idCounter}`;
};

// ---------------------------------------------------------------------------
// Deliver webhook
// ---------------------------------------------------------------------------

/**
 * Deliver a webhook event to a registered endpoint.
 *
 * Sends an HTTP POST with:
 * - Content-Type: application/json
 * - User-Agent: Concierge-Webhooks/1.0
 * - X-Webhook-Signature: HMAC-SHA256 signature of the body
 * - X-Webhook-Event: The event type
 * - X-Webhook-ID: The webhook endpoint ID
 *
 * Retries up to MAX_RETRY_ATTEMPTS times with exponential backoff on failure.
 * A successful delivery (2xx status) stops further retries.
 *
 * @param webhook - The webhook endpoint configuration
 * @param event - The event type being delivered
 * @param data - The event payload data
 * @param options - Optional dependency overrides for testing
 * @returns Array of delivery attempts (one per try)
 */
export async function deliverWebhook(
  webhook: WebhookEndpoint,
  event: WebhookEvent,
  data: Record<string, unknown>,
  options: DeliveryOptions = {},
): Promise<DeliveryAttempt[]> {
  const {
    fetchFn = fetch,
    sleepFn = defaultSleep,
    generateId = defaultGenerateId,
    timeoutMs = DEFAULT_TIMEOUT_MS,
  } = options;

  const payload = {
    event,
    timestamp: new Date().toISOString(),
    data,
  };

  const payloadStr = JSON.stringify(payload);
  const signature = signPayload(payloadStr, webhook.secret);

  const attempts: DeliveryAttempt[] = [];

  for (let attempt = 1; attempt <= MAX_RETRY_ATTEMPTS; attempt++) {
    // Wait before retry (not before first attempt)
    if (attempt > 1) {
      const delay = calculateRetryDelay(attempt - 1);
      await sleepFn(delay);
    }

    const attemptId = generateId();
    const startTime = Date.now();

    let responseStatus: number | null = null;
    let responseBody: string | null = null;
    let success = false;

    try {
      const response = await fetchFn(webhook.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': USER_AGENT,
          'X-Webhook-Signature': signature,
          'X-Webhook-Event': event,
          'X-Webhook-ID': webhook.id,
        },
        body: payloadStr,
        signal: AbortSignal.timeout(timeoutMs),
      });

      responseStatus = response.status;
      try {
        responseBody = await response.text();
      } catch {
        responseBody = null;
      }
      success = response.status >= 200 && response.status < 300;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      responseBody = errorMessage;

      if (errorMessage.includes('timeout') || errorMessage.includes('abort')) {
        logger.warn({ webhookId: webhook.id, event, attempt }, 'Webhook delivery timed out');
      } else {
        logger.error(
          { webhookId: webhook.id, event, attempt, error: errorMessage },
          'Webhook delivery network error',
        );
      }
    }

    const duration = Date.now() - startTime;

    const attemptRecord: DeliveryAttempt = {
      id: attemptId,
      webhookId: webhook.id,
      event,
      payload: payload as unknown as Record<string, unknown>,
      responseStatus,
      responseBody,
      duration,
      attempt,
      createdAt: new Date(),
      success,
    };

    attempts.push(attemptRecord);
    deliveryLog.push(attemptRecord);

    logger.info(
      {
        webhookId: webhook.id,
        event,
        attempt,
        success,
        responseStatus,
        duration,
      },
      success ? 'Webhook delivered successfully' : 'Webhook delivery attempt failed',
    );

    // Stop retrying on success
    if (success) {
      break;
    }
  }

  return attempts;
}

/**
 * Retry a previously failed delivery by its delivery attempt ID.
 *
 * Looks up the original attempt, reconstructs the webhook and payload,
 * and attempts delivery again with exponential backoff.
 *
 * @param deliveryId - The ID of the failed delivery attempt
 * @param webhook - The webhook endpoint configuration
 * @param options - Optional dependency overrides
 * @returns New delivery attempts, or null if the original was not found
 */
export async function retryDelivery(
  deliveryId: string,
  webhook: WebhookEndpoint,
  options: DeliveryOptions = {},
): Promise<DeliveryAttempt[] | null> {
  const original = deliveryLog.find((entry) => entry.id === deliveryId);

  if (!original) {
    logger.warn({ deliveryId }, 'Delivery attempt not found for retry');
    return null;
  }

  return deliverWebhook(
    webhook,
    original.event,
    (original.payload as { data?: Record<string, unknown> }).data ?? {},
    options,
  );
}

/**
 * Validate that a string is a valid webhook event type.
 */
export function isValidWebhookEvent(event: string): event is WebhookEvent {
  return WEBHOOK_EVENTS.includes(event as WebhookEvent);
}
