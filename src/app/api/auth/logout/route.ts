/**
 * Concierge — Logout API
 *
 * POST /api/auth/logout
 * Invalidates the current session and clears auth cookies.
 * Stub — returns 501 until auth system is implemented.
 */

import { NextResponse } from 'next/server';

export async function POST(): Promise<NextResponse> {
  // TODO: Implement via createApiHandler from @/server/middleware/chain
  // - Read refresh token from httpOnly cookie
  // - Add token to deny-list / revoke in database
  // - Clear httpOnly auth cookies
  return NextResponse.json(
    { message: 'Auth not yet implemented' },
    {
      status: 501,
      headers: {
        'X-Content-Type-Options': 'nosniff',
        'Cache-Control': 'no-store',
      },
    },
  );
}
