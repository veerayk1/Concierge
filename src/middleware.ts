/**
 * Concierge — Next.js Edge Middleware
 *
 * Runs on every matched request at the edge before any page or API
 * route executes. Responsible for:
 *
 * 1. Generating a per-request nonce for CSP script-src.
 * 2. Generating a unique request ID (UUID) for tracing.
 * 3. Attaching all security headers to the response.
 *
 * This file MUST remain edge-compatible (no Node.js APIs that are
 * unavailable in the Edge Runtime).
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { getSecurityHeaders } from '@/lib/security-headers';

// ---------------------------------------------------------------------------
// Middleware
// ---------------------------------------------------------------------------

export function middleware(request: NextRequest): NextResponse {
  // 1. Generate a per-request nonce (base64, 16 bytes = 128 bits)
  const nonceBytes = new Uint8Array(16);
  crypto.getRandomValues(nonceBytes);
  const nonce = btoa(String.fromCharCode(...nonceBytes));

  // 2. Generate a unique request ID for distributed tracing
  const requestId = crypto.randomUUID();

  // 3. Clone request headers so downstream handlers can read nonce & requestId
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('x-request-id', requestId);

  // 4. Build the response with modified request headers forwarded downstream
  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  // 5. Attach all security headers to the outgoing response
  const securityHeaders = getSecurityHeaders(nonce);

  for (const [name, value] of Object.entries(securityHeaders)) {
    response.headers.set(name, value);
  }

  // 6. Expose request ID on response for client-side error reporting
  response.headers.set('x-request-id', requestId);

  return response;
}

// ---------------------------------------------------------------------------
// Matcher Configuration
// ---------------------------------------------------------------------------

/**
 * Run middleware on all routes EXCEPT:
 * - _next/static  (static assets)
 * - _next/image   (image optimisation)
 * - favicon.ico   (browser default)
 * - Public folder assets (images, fonts, etc.)
 */
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Public assets with common extensions
     */
    '/((?!_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|woff|woff2|ttf|eot)).*)',
  ],
};
