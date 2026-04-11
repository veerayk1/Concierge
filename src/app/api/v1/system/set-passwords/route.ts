/**
 * System Set Passwords API — Set known passwords for testing/demo users
 * Super Admin only. Dev environment only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { hashPassword } from '@/server/auth/password';

export async function POST(request: NextRequest) {
  // Only allow in development
  if (process.env.NODE_ENV === 'production') {
    return NextResponse.json(
      { error: 'FORBIDDEN', message: 'Not available in production.' },
      { status: 403 },
    );
  }

  const demoRole = request.headers.get('x-demo-role');
  if (demoRole !== 'super_admin') {
    return NextResponse.json(
      { error: 'FORBIDDEN', message: 'Only super_admin can set passwords.' },
      { status: 403 },
    );
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { password, emails } = body;

    if (!password || !emails || !Array.isArray(emails)) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Send { "password": "...", "emails": ["..."] }' },
        { status: 400 },
      );
    }

    const passwordHash = await hashPassword(password);

    const result = await prisma.user.updateMany({
      where: {
        email: { in: emails.map((e: string) => e.toLowerCase()) },
      },
      data: {
        passwordHash,
        isActive: true,
        activatedAt: new Date(),
      },
    });

    return NextResponse.json({
      data: {
        message: `Updated ${result.count} user(s) with new password.`,
        count: result.count,
      },
    });
  } catch (error) {
    console.error('POST /api/v1/system/set-passwords error:', error);
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: 'Failed: ' + (error instanceof Error ? error.message : String(error)),
      },
      { status: 500 },
    );
  }
}
