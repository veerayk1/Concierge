/**
 * Welcome Email API — per PRD 08 Section 3.1.3
 * Send or resend welcome email to a user
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';
import { sendEmail } from '@/server/email';
import { renderTemplate } from '@/server/email-templates';
import { createLogger } from '@/server/logger';

const logger = createLogger('welcome-email');

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin', 'property_admin'] });
    if (auth.error) return auth.error;

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id, deletedAt: null },
      select: { id: true, email: true, firstName: true, lastName: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'User not found' }, { status: 404 });
    }

    // Generate a secure activation token (72-hour expiry)
    const activationToken = crypto.randomUUID() + '-' + crypto.randomUUID();
    const activationTokenExpiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000);

    // Store token on the user record
    await prisma.user.update({
      where: { id: user.id },
      data: {
        activationToken,
        activationTokenExpiresAt,
      },
    });

    // Send the welcome email with activation link
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const activateUrl = `${appUrl}/activate?token=${encodeURIComponent(activationToken)}`;

    void sendEmail({
      to: user.email,
      subject: 'Welcome to Concierge — Activate Your Account',
      html: renderTemplate('welcome', {
        firstName: user.firstName ?? 'there',
        propertyName: 'Concierge',
        loginUrl: activateUrl,
      }),
    }).catch((err) => {
      logger.error({ err, userId: user.id, email: user.email }, 'Failed to send welcome email');
    });

    return NextResponse.json({
      message: `Welcome email sent to ${user.email}.`,
      data: {
        userId: user.id,
        email: user.email,
        sentAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('POST /api/v1/users/:id/welcome-email error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to send welcome email' },
      { status: 500 },
    );
  }
}
