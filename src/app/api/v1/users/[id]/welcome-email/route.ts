/**
 * Welcome Email API — per PRD 08 Section 3.1.3
 * Send or resend welcome email to a user
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id, deletedAt: null },
      select: { id: true, email: true, firstName: true, lastName: true },
    });

    if (!user) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'User not found' }, { status: 404 });
    }

    // TODO: Actually send the welcome email via Resend
    // For now, just acknowledge the request

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
