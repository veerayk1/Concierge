/**
 * Concierge — Logout API
 *
 * POST /api/auth/logout
 * Invalidates the current session and clears auth cookies.
 * Idempotent — returns 200 even if no active session.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { prisma } from '@/server/db';
import { verifyAccessToken } from '@/server/auth/jwt';

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<NextResponse> {
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();

  try {
    // 1. Try to extract user from token (optional — logout is idempotent)
    let userId: string | null = null;

    const authHeader = req.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7);
      try {
        const payload = await verifyAccessToken(token);
        userId = payload.sub;
      } catch {
        // Token invalid or expired — still allow logout
      }
    }

    // 2. Revoke user's refresh tokens and sessions if we have a userId
    if (userId) {
      try {
        await prisma.refreshToken.updateMany({
          where: {
            userId,
            revokedAt: null,
          },
          data: {
            revokedAt: new Date(),
          },
        });
      } catch {
        /* best-effort */
      }

      try {
        await prisma.session.updateMany({
          where: {
            userId,
          },
          data: {
            revokedAt: new Date(),
          },
        });
      } catch {
        /* best-effort */
      }
    }

    // 3. Build response with cookie clearing
    const response = NextResponse.json(
      {
        data: { message: 'Logged out successfully' },
        requestId,
      },
      { status: 200 },
    );

    // Clear auth cookies
    response.cookies.set('refreshToken', '', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 0,
    });

    response.cookies.set('accessToken', '', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 0,
    });

    return response;
  } catch {
    // Even on error, logout should succeed
    const response = NextResponse.json(
      {
        data: { message: 'Logged out' },
        requestId,
      },
      { status: 200 },
    );

    response.cookies.set('refreshToken', '', {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
      path: '/',
      maxAge: 0,
    });

    return response;
  }
}
