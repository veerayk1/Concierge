/**
 * Concierge — Health Check API
 *
 * GET /api/health
 * Returns a simple status check with version info and uptime.
 * No authentication required.
 * Used by load balancers, uptime monitors, and deployment checks.
 */

import { NextResponse } from 'next/server';

/** Track process start time for uptime calculation */
const startedAt = Date.now();

export async function GET(): Promise<NextResponse> {
  const requestStart = performance.now();

  // Read version from package.json (bundled at build time)
  let version = 'unknown';
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pkg = require('../../../../package.json') as { version: string };
    version = pkg.version;
  } catch {
    // package.json not available at runtime — use fallback
  }

  const responseTimeMs = Math.round((performance.now() - requestStart) * 100) / 100;
  const uptimeSeconds = Math.floor((Date.now() - startedAt) / 1000);

  return NextResponse.json(
    {
      status: 'ok',
      timestamp: new Date().toISOString(),
      version,
      uptime: uptimeSeconds,
      responseTime: `${responseTimeMs}ms`,
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
      },
    },
  );
}
