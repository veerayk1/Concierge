/**
 * Concierge — Email Service
 *
 * Transactional email delivery via Resend (https://resend.com).
 * Uses `fetch` directly to call the Resend API — no extra dependencies.
 *
 * Behaviour:
 * - If `RESEND_API_KEY` is not set, emails are logged but not sent (dev mode).
 * - Email failures are logged but never thrown — callers are not disrupted.
 *
 * @module server/email
 */

import { createLogger } from '@/server/logger';
import { renderTemplate } from '@/server/email-templates';

const logger = createLogger('email');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'noreply@concierge.app';
const RESEND_API_URL = 'https://api.resend.com/emails';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface PasswordResetEmailPayload {
  email: string;
  token: string;
  firstName?: string;
}

export interface EmailPayload {
  /** Recipient email address. */
  to: string;
  /** Email subject line. */
  subject: string;
  /** Plain-text body (at least one of `text` or `html` is required). */
  text?: string;
  /** HTML body. */
  html?: string;
  /** Optional sender override (defaults to RESEND_FROM_EMAIL). */
  from?: string;
  /** Optional reply-to address. */
  replyTo?: string;
}

export interface BulkEmailPayload {
  /** List of recipient email addresses. */
  to: string[];
  /** Email subject line. */
  subject: string;
  /** Plain-text body. */
  text?: string;
  /** HTML body. */
  html?: string;
  /** Optional sender override. */
  from?: string;
  /** Optional reply-to address. */
  replyTo?: string;
}

interface ResendSuccessResponse {
  id: string;
}

interface ResendErrorResponse {
  statusCode: number;
  message: string;
  name: string;
}

// ---------------------------------------------------------------------------
// Core send helper
// ---------------------------------------------------------------------------

/**
 * Send a single email via the Resend API.
 *
 * Returns the Resend message ID on success, or `null` if sending was skipped
 * or failed. Failures are logged but never thrown.
 */
export async function sendEmail(payload: EmailPayload): Promise<string | null> {
  if (!RESEND_API_KEY) {
    logger.warn(
      { to: payload.to, subject: payload.subject },
      'RESEND_API_KEY not set — skipping email (development mode)',
    );
    return null;
  }

  try {
    const body = {
      from: payload.from ?? RESEND_FROM_EMAIL,
      to: [payload.to],
      subject: payload.subject,
      ...(payload.text ? { text: payload.text } : {}),
      ...(payload.html ? { html: payload.html } : {}),
      ...(payload.replyTo ? { reply_to: payload.replyTo } : {}),
    };

    const response = await fetch(RESEND_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const error = (await response.json()) as ResendErrorResponse;
      logger.error(
        { to: payload.to, status: response.status, error },
        'Resend API returned an error',
      );
      return null;
    }

    const data = (await response.json()) as ResendSuccessResponse;
    logger.info({ to: payload.to, messageId: data.id }, 'Email sent successfully');
    return data.id;
  } catch (err) {
    logger.error({ to: payload.to, err }, 'Failed to send email — network or unexpected error');
    return null;
  }
}

// ---------------------------------------------------------------------------
// Bulk send
// ---------------------------------------------------------------------------

/**
 * Send the same email to multiple recipients.
 *
 * Each recipient receives an individual email (not CC/BCC) so they cannot
 * see other recipients. Sends are executed concurrently via `Promise.allSettled`
 * so one failure does not block the others.
 *
 * Returns an array of Resend message IDs (or `null` for failures), one per
 * recipient in the same order as the input `to` array.
 */
export async function sendBulkEmail(payload: BulkEmailPayload): Promise<(string | null)[]> {
  if (!payload.to.length) {
    logger.warn('sendBulkEmail called with empty recipient list — skipping');
    return [];
  }

  logger.info(
    { recipientCount: payload.to.length, subject: payload.subject },
    'Sending bulk email',
  );

  const results = await Promise.allSettled(
    payload.to.map((recipient) =>
      sendEmail({
        to: recipient,
        subject: payload.subject,
        text: payload.text,
        html: payload.html,
        from: payload.from,
        replyTo: payload.replyTo,
      }),
    ),
  );

  return results.map((result) => (result.status === 'fulfilled' ? result.value : null));
}

// ---------------------------------------------------------------------------
// Transactional email helpers
// ---------------------------------------------------------------------------

/**
 * Send a password reset email to the user.
 *
 * Constructs the reset link from the application URL and delegates to
 * the core `sendEmail` function. Failures are logged but never thrown.
 */
export async function sendPasswordResetEmail(payload: PasswordResetEmailPayload): Promise<void> {
  logger.info({ email: payload.email }, 'Sending password reset email');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const resetLink = `${appUrl}/auth/reset-password?token=${encodeURIComponent(payload.token)}`;

  await sendEmail({
    to: payload.email,
    subject: 'Reset your Concierge password',
    html: renderTemplate('password_reset', {
      resetUrl: resetLink,
      expiresIn: '1 hour',
    }),
  });
}
