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
import { prisma } from '@/server/db';

const logger = createLogger('email');

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? 'noreply@buildingautopilot.ca';
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
// Notification log — captures every outbound email in NotificationDelivery
// so admins can answer "did the resident actually receive this?"
// ---------------------------------------------------------------------------

export interface NotificationMeta {
  propertyId: string;
  category: string; // 'welcome' | 'activation' | 'password_reset' | 'announcement' | 'parking_violation' | 'package_pickup' | …
  recipientUserId?: string | null;
  relatedEntityType?: string | null;
  relatedEntityId?: string | null;
}

function htmlToPreview(s: string | undefined): string | null {
  if (!s) return null;
  // Strip <style> and <script> CONTENTS first — otherwise the raw CSS
  // bleeds into the preview ("body { margin: 0; padding: 0; … }").
  // Then drop tags, collapse whitespace, cap. Just a preview — full
  // content lives in the template source.
  return s
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 500);
}

/**
 * Like {@link sendEmail} but also writes a NotificationDelivery row so the
 * admin Notification Log can show what went out, to whom, and whether
 * Resend acked it. Logging failures are swallowed — they must never block
 * the user-facing flow.
 *
 * Prefer this over the raw `sendEmail` for any user-facing notification
 * (welcome, activation, password reset, announcements, violations, etc).
 */
export async function sendEmailWithLog(
  payload: EmailPayload,
  meta: NotificationMeta,
): Promise<string | null> {
  const messageId = await sendEmail(payload);

  // Insert the delivery record asynchronously of the original send — if
  // the log INSERT itself fails (DB blip, schema drift), don't bubble up.
  try {
    await prisma.notificationDelivery.create({
      data: {
        propertyId: meta.propertyId,
        recipientUserId: meta.recipientUserId ?? null,
        recipientEmail: payload.to,
        channel: 'email',
        category: meta.category,
        subject: payload.subject,
        bodyPreview: htmlToPreview(payload.html ?? payload.text),
        relatedEntityType: meta.relatedEntityType ?? null,
        relatedEntityId: meta.relatedEntityId ?? null,
        status: messageId ? 'sent' : RESEND_API_KEY ? 'failed' : 'skipped',
        providerId: messageId,
        sentAt: messageId ? new Date() : null,
      },
    });
  } catch (err) {
    logger.error(
      { err, to: payload.to, category: meta.category },
      'NotificationDelivery log insert failed',
    );
  }

  return messageId;
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
    subject: 'Reset your BuildingAutopilot password',
    html: renderTemplate('password_reset', {
      resetUrl: resetLink,
      expiresIn: '1 hour',
    }),
  });
}

// ---------------------------------------------------------------------------
// Unit Resident Email Lookup
// ---------------------------------------------------------------------------

/**
 * Look up current residents of a unit (moveOutDate is null) and return their
 * email addresses with first names. Used by package and visitor notifications.
 */
export async function getUnitResidentEmails(
  unitId: string,
): Promise<Array<{ email: string; firstName: string }>> {
  const records = await prisma.occupancyRecord.findMany({
    where: { unitId, moveOutDate: null },
    select: {
      user: {
        select: { email: true, firstName: true },
      },
    },
  });

  return records
    .filter((r) => r.user.email)
    .map((r) => ({ email: r.user.email, firstName: r.user.firstName }));
}
