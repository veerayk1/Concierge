/**
 * Concierge — SMS Notification Service
 *
 * Transactional SMS delivery via Twilio REST API (https://www.twilio.com).
 * Uses `fetch` directly — no Twilio SDK dependency.
 *
 * Behaviour:
 * - If `TWILIO_ACCOUNT_SID` is not set, messages are logged but not sent (dev mode).
 * - SMS failures are logged but never thrown — callers are not disrupted.
 *
 * @module server/sms
 */

import { createLogger } from '@/server/logger';

const logger = createLogger('sms');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_FROM_NUMBER = process.env.TWILIO_FROM_NUMBER;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SmsPayload {
  /** Recipient phone number in E.164 format (e.g. +14165551234). */
  to: string;
  /** Message body (max 1600 characters for Twilio). */
  body: string;
}

export interface BulkSmsPayload {
  /** List of recipient phone numbers in E.164 format. */
  to: string[];
  /** Message body. */
  body: string;
}

interface TwilioSuccessResponse {
  sid: string;
}

interface TwilioErrorResponse {
  code: number;
  message: string;
  status: number;
}

// ---------------------------------------------------------------------------
// Phone number validation & formatting
// ---------------------------------------------------------------------------

/** E.164 pattern: + followed by 10-15 digits. */
const E164_REGEX = /^\+[1-9]\d{9,14}$/;

/**
 * Validate that a phone number is in E.164 format.
 */
export function isValidE164(phone: string): boolean {
  return E164_REGEX.test(phone);
}

/**
 * Normalize a Canadian/US phone number to E.164 format.
 *
 * Handles common input formats:
 * - `4165551234` -> `+14165551234`
 * - `14165551234` -> `+14165551234`
 * - `(416) 555-1234` -> `+14165551234`
 * - `416-555-1234` -> `+14165551234`
 * - `416.555.1234` -> `+14165551234`
 * - `+14165551234` -> `+14165551234` (no-op)
 *
 * Returns `null` if the number cannot be normalized to a valid E.164 format.
 */
export function formatPhoneNumber(phone: string): string | null {
  if (!phone) return null;

  // Strip all non-digit characters except leading +
  const hasPlus = phone.startsWith('+');
  const digits = phone.replace(/\D/g, '');

  if (!digits.length) return null;

  let normalized: string;

  if (hasPlus) {
    // Already has + prefix — just reassemble
    normalized = `+${digits}`;
  } else if (digits.length === 10) {
    // North American 10-digit: add +1
    normalized = `+1${digits}`;
  } else if (digits.length === 11 && digits.startsWith('1')) {
    // North American 11-digit starting with 1: add +
    normalized = `+${digits}`;
  } else {
    // Unknown format — cannot safely normalize
    return null;
  }

  return isValidE164(normalized) ? normalized : null;
}

// ---------------------------------------------------------------------------
// Core send helper
// ---------------------------------------------------------------------------

/**
 * Send a single SMS via the Twilio REST API.
 *
 * Returns the Twilio message SID on success, or `null` if sending was skipped
 * or failed. Failures are logged but never thrown.
 */
export async function sendSms(payload: SmsPayload): Promise<string | null> {
  if (!TWILIO_ACCOUNT_SID) {
    logger.warn({ to: payload.to }, 'TWILIO_ACCOUNT_SID not set — skipping SMS (development mode)');
    return null;
  }

  // Validate phone number format
  if (!isValidE164(payload.to)) {
    logger.warn(
      { to: payload.to },
      'Invalid phone number format — must be E.164 (e.g. +14165551234)',
    );
    return null;
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    const credentials = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString(
      'base64',
    );

    const formBody = new URLSearchParams({
      To: payload.to,
      From: TWILIO_FROM_NUMBER ?? '',
      Body: payload.body,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${credentials}`,
      },
      body: formBody.toString(),
    });

    if (!response.ok) {
      const error = (await response.json()) as TwilioErrorResponse;
      logger.error(
        { to: payload.to, status: response.status, error },
        'Twilio API returned an error',
      );
      return null;
    }

    const data = (await response.json()) as TwilioSuccessResponse;
    logger.info({ to: payload.to, messageSid: data.sid }, 'SMS sent successfully');
    return data.sid;
  } catch (err) {
    logger.error({ to: payload.to, err }, 'Failed to send SMS — network or unexpected error');
    return null;
  }
}

// ---------------------------------------------------------------------------
// Bulk send
// ---------------------------------------------------------------------------

/**
 * Send the same SMS to multiple recipients.
 *
 * Each recipient receives an individual message. Sends are executed concurrently
 * via `Promise.allSettled` so one failure does not block the others.
 *
 * Returns an array of Twilio message SIDs (or `null` for failures), one per
 * recipient in the same order as the input `to` array.
 */
export async function sendBulkSms(payload: BulkSmsPayload): Promise<(string | null)[]> {
  if (!payload.to.length) {
    logger.warn('sendBulkSms called with empty recipient list — skipping');
    return [];
  }

  logger.info({ recipientCount: payload.to.length }, 'Sending bulk SMS');

  const results = await Promise.allSettled(
    payload.to.map((recipient) => sendSms({ to: recipient, body: payload.body })),
  );

  return results.map((result) => (result.status === 'fulfilled' ? result.value : null));
}
