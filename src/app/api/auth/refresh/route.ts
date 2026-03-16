/**
 * Concierge — Token Refresh API
 *
 * POST /api/auth/refresh
 * Exchanges a valid refresh token for a new access token.
 * Stub — returns 501 until auth system is implemented.
 */

import { NextResponse } from 'next/server';

export async function POST(): Promise<NextResponse> {
  // TODO: Implement via createApiHandler from @/server/middleware/chain
  // - Read refresh token from httpOnly cookie
  // - Validate token signature and expiry
  // - Issue new access token
  // - Rotate refresh token
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
