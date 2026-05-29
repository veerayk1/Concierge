/**
 * System Set Passwords API — Set known passwords for testing/demo users
 * Super Admin only. Dev environment only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { hashPassword } from '@/server/auth/password';
import { guardRoute } from '@/server/middleware/api-guard';

export async function POST(request: NextRequest) {
  // Production guard — block in production unless explicitly allowed
  if (process.env.NODE_ENV === 'production' && !process.env.ALLOW_SYSTEM_ROUTES) {
    return NextResponse.json({ error: 'Not available in production' }, { status: 403 });
  }

  // Previously trusted the X-Demo-Role header — that's a client-supplied
  // header, so the "super_admin only" gate was a backdoor. Anyone (in
  // dev/staging, or in prod with ALLOW_SYSTEM_ROUTES set) could reset
  // arbitrary user passwords by sending one header. Require a real JWT.
  // allowDemo: false — guardRoute would otherwise honor x-demo-role,
  // re-creating the backdoor this route was originally built around.
  const auth = await guardRoute(request, { roles: ['super_admin'], allowDemo: false });
  if (auth.error) return auth.error;

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
