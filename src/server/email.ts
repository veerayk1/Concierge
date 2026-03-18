/**
 * Concierge — Email Service
 *
 * Stub email service for sending transactional emails.
 * Will be replaced with a real provider (SendGrid, SES, etc.) in production.
 *
 * @module server/email
 */

import { createLogger } from '@/server/logger';

const logger = createLogger('email');

export interface PasswordResetEmailPayload {
  email: string;
  token: string;
  firstName?: string;
}

/**
 * Send a password reset email to the user.
 * In production, this will use a transactional email provider.
 */
export async function sendPasswordResetEmail(payload: PasswordResetEmailPayload): Promise<void> {
  logger.info({ email: payload.email }, 'Sending password reset email');

  // TODO: Integrate with email provider (SendGrid, SES, etc.)
  // For now, this is a no-op stub that tests can mock.
}
