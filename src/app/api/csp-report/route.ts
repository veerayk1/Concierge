/**
 * Concierge — CSP Violation Report Endpoint
 *
 * POST /api/csp-report
 * Receives Content-Security-Policy violation reports from the browser.
 * No authentication required (browser sends these automatically).
 * Returns 204 No Content.
 */

import { NextResponse } from 'next/server';

export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body: unknown = await request.json();

    // TODO: Replace console.warn with structured logger (e.g. Pino / Winston)
    console.warn('[CSP Violation]', JSON.stringify(body));
  } catch {
    // Malformed body — silently discard
  }

  return new NextResponse(null, {
    status: 204,
    headers: {
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
