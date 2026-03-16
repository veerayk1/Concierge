/**
 * Concierge — Request ID Utilities
 *
 * Every API request gets a unique identifier for distributed tracing
 * and error correlation. The ID is generated in Edge middleware and
 * propagated via the `x-request-id` header.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const REQUEST_ID_HEADER = 'x-request-id';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Generate a new request ID using the platform's native UUID v4 implementation.
 *
 * Uses `crypto.randomUUID()` which is available in Node 19+, Edge Runtime,
 * and all modern browsers.
 */
export function generateRequestId(): string {
  return crypto.randomUUID();
}

/**
 * Extract the request ID from incoming request headers.
 *
 * @returns The request ID string, or `null` if the header is absent.
 */
export function getRequestId(headers: Headers): string | null {
  return headers.get(REQUEST_ID_HEADER);
}
