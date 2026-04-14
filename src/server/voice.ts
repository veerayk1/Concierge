/**
 * Concierge — Voice Call Notification Service
 *
 * Automated voice calls via Twilio REST API for emergency broadcasts.
 * Uses `fetch` directly — no Twilio SDK dependency.
 *
 * Voice calls are used ONLY for emergency broadcasts (fire, flood, gas leak, etc.)
 * where immediate attention is critical and SMS/push may not be seen in time.
 *
 * Behaviour:
 * - If `TWILIO_ACCOUNT_SID` is not set, calls are logged but not placed (dev mode).
 * - Call failures are logged but never thrown — callers are not disrupted.
 * - TwiML is generated inline to deliver a spoken emergency message.
 *
 * @module server/voice
 */

import { createLogger } from '@/server/logger';

const logger = createLogger('voice');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_FROM_NUMBER = process.env.TWILIO_FROM_NUMBER;

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface VoiceCallPayload {
  /** Recipient phone number in E.164 format (e.g. +14165551234). */
  to: string;
  /** The message to speak (text-to-speech via Twilio). */
  message: string;
  /** Voice to use. Defaults to 'Polly.Joanna' (natural-sounding English). */
  voice?: string;
  /** Number of times to repeat the message. Defaults to 2. */
  repeatCount?: number;
  /** Optional callback URL for call status updates. */
  statusCallbackUrl?: string;
}

export interface BulkVoiceCallPayload {
  /** List of recipient phone numbers in E.164 format. */
  to: string[];
  /** The message to speak. */
  message: string;
  /** Voice to use. */
  voice?: string;
  /** Number of times to repeat the message. */
  repeatCount?: number;
}

interface TwilioCallResponse {
  sid: string;
  status: string;
}

// ---------------------------------------------------------------------------
// TwiML generation
// ---------------------------------------------------------------------------

/**
 * Generate TwiML XML for an emergency voice message.
 * Repeats the message for clarity and adds pauses between repetitions.
 */
function generateTwiml(message: string, voice: string, repeatCount: number): string {
  const escapedMessage = message
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  const sayBlocks = Array.from({ length: repeatCount })
    .map(() => `<Say voice="${voice}">${escapedMessage}</Say><Pause length="2"/>`)
    .join('');

  return `<?xml version="1.0" encoding="UTF-8"?><Response>${sayBlocks}<Say voice="${voice}">This is the end of the emergency message. If you need assistance, please contact your building's front desk.</Say></Response>`;
}

// ---------------------------------------------------------------------------
// Voice call delivery
// ---------------------------------------------------------------------------

/**
 * Place a single voice call via Twilio.
 * Returns the Twilio call SID on success, null on failure.
 */
export async function sendVoiceCall(payload: VoiceCallPayload): Promise<string | null> {
  const voice = payload.voice ?? 'Polly.Joanna';
  const repeatCount = payload.repeatCount ?? 2;
  const twiml = generateTwiml(payload.message, voice, repeatCount);

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
    logger.info(
      { to: payload.to, message: payload.message.substring(0, 100) },
      'Voice call logged (dev mode — Twilio credentials not configured)',
    );
    return `dev_voice_${Date.now()}`;
  }

  try {
    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Calls.json`;
    const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');

    const params = new URLSearchParams();
    params.set('To', payload.to);
    params.set('From', TWILIO_FROM_NUMBER);
    params.set('Twiml', twiml);
    if (payload.statusCallbackUrl) {
      params.set('StatusCallback', payload.statusCallbackUrl);
      params.set('StatusCallbackEvent', 'completed');
    }

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      logger.error(
        { to: payload.to, status: response.status, error: errorBody },
        'Twilio voice call failed',
      );
      return null;
    }

    const result = (await response.json()) as TwilioCallResponse;
    logger.info({ to: payload.to, sid: result.sid, status: result.status }, 'Voice call initiated');
    return result.sid;
  } catch (error) {
    logger.error({ to: payload.to, error }, 'Voice call delivery error');
    return null;
  }
}

/**
 * Place voice calls to multiple recipients concurrently.
 * Returns an array of { to, sid } results.
 */
export async function sendBulkVoiceCalls(
  payload: BulkVoiceCallPayload,
): Promise<{ to: string; sid: string | null }[]> {
  const results = await Promise.allSettled(
    payload.to.map(async (to) => {
      const sid = await sendVoiceCall({
        to,
        message: payload.message,
        voice: payload.voice,
        repeatCount: payload.repeatCount,
      });
      return { to, sid };
    }),
  );

  return results.map((r) => (r.status === 'fulfilled' ? r.value : { to: 'unknown', sid: null }));
}
