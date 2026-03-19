/**
 * Welcome Email API — per PRD 08 Section 3.1.3
 * Send or resend welcome email to a user
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';
import { sendEmail } from '@/server/email';
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

    // Send the welcome email via Resend (fire-and-forget)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
    const greeting = user.firstName ? `Hi ${user.firstName},` : 'Hi,';

    void sendEmail({
      to: user.email,
      subject: 'Welcome to Concierge',
      text: `${greeting}\n\nWelcome to Concierge! Your account has been created.\n\nYou can sign in at: ${appUrl}/auth/login\n\nIf you have any questions, please contact your property manager.\n\n— Concierge`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 16px;">
          <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 16px;">Welcome to Concierge</h2>
          <p>${greeting}</p>
          <p>Your account has been created. You can sign in using the link below:</p>
          <p style="margin: 24px 0;">
            <a href="${appUrl}/auth/login" style="display: inline-block; padding: 12px 24px; background-color: #0f172a; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 500;">Sign In</a>
          </p>
          <p>If you have any questions, please contact your property manager.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
          <p style="color: #94a3b8; font-size: 12px;">Concierge — Building Management</p>
        </div>
      `,
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
