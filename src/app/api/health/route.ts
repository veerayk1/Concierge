/**
 * Concierge — Health Check API
 *
 * GET /api/health
 * Returns a simple status check. No authentication required.
 * Used by load balancers, uptime monitors, and deployment checks.
 */

import { NextResponse } from 'next/server';

export async function GET(): Promise<NextResponse> {
  return NextResponse.json(
    { status: 'ok', timestamp: new Date().toISOString() },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
      },
    },
  );
}
