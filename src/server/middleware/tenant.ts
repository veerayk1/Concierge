/**
 * Concierge — Tenant Isolation Middleware
 *
 * Ensures that a user can only access resources belonging to their own
 * property (tenant). This is a critical security boundary — every API
 * route that reads or mutates a resource MUST pass through this check.
 *
 * On mismatch, a `NotFoundError` (404) is thrown instead of `ForbiddenError`
 * (403) to prevent property-ID enumeration attacks. From the caller's
 * perspective, the resource simply "does not exist."
 */

import { NotFoundError } from '@/server/errors';
import { createLogger } from '@/server/logger';

// ---------------------------------------------------------------------------
// Logger
// ---------------------------------------------------------------------------

const logger = createLogger('tenant');

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Assert that the user's property ID matches the resource's property ID.
 *
 * @param userPropertyId    - The `pid` from the authenticated `TokenPayload`.
 * @param resourcePropertyId - The `propertyId` on the resource being accessed.
 *
 * @throws {NotFoundError} If the property IDs do not match (prevents enumeration).
 *
 * @example
 * ```ts
 * requireTenantAccess(token.pid, event.propertyId);
 * ```
 */
export function requireTenantAccess(userPropertyId: string, resourcePropertyId: string): void {
  if (userPropertyId !== resourcePropertyId) {
    logger.warn(
      {
        userPropertyId,
        resourcePropertyId,
      },
      'Tenant isolation violation — property ID mismatch',
    );

    // 404, not 403 — prevents enumeration
    throw new NotFoundError('Resource not found');
  }
}
