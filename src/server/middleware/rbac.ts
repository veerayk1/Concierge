/**
 * Concierge — Role-Based Access Control Middleware
 *
 * Enforces that the authenticated user holds one of the allowed roles
 * for the current operation. Throws `ForbiddenError` on mismatch.
 *
 * This is a simple list-based check. For fine-grained permission
 * checks (e.g. "event:create"), use a separate permission middleware
 * that inspects `TokenPayload.perms`.
 */

import { ForbiddenError } from '@/server/errors';
import { createLogger } from '@/server/logger';
import type { Role } from '@/types';

// ---------------------------------------------------------------------------
// Logger
// ---------------------------------------------------------------------------

const logger = createLogger('rbac');

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Assert that the user's role is in the list of allowed roles.
 *
 * @param userRole - The role from the authenticated `TokenPayload`.
 * @param allowedRoles - The roles permitted to access this resource.
 *
 * @throws {ForbiddenError} If the user's role is not in the allowed list.
 *
 * @example
 * ```ts
 * requireRole(token.role, ['property_admin', 'property_manager']);
 * ```
 */
export function requireRole(userRole: Role, allowedRoles: Role[]): void {
  if (allowedRoles.length === 0) {
    // No role restriction — any authenticated user is allowed
    return;
  }

  if (!allowedRoles.includes(userRole)) {
    logger.warn({ userRole, allowedRoles }, 'Role check failed — insufficient permissions');
    throw new ForbiddenError(`Role '${userRole}' is not authorised for this operation`);
  }
}
