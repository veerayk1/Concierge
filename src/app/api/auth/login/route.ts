/**
 * Concierge — Login API
 *
 * POST /api/auth/login
 * Authenticates a user with email + password.
 * Stub — returns 501 until auth system is implemented.
 */

import { NextResponse } from 'next/server';

export async function POST(): Promise<NextResponse> {
  // TODO: Implement via createApiHandler from @/server/middleware/chain
  // - Validate request body against loginSchema
  // - Verify credentials against database
  // - Generate JWT access + refresh tokens
  // - Set httpOnly secure cookies
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
