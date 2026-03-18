/**
 * API Route Guard — Authentication + Authorization wrapper
 *
 * Every v1 API route MUST use this guard. It:
 * 1. Extracts and validates the JWT token
 * 2. Checks if the user's role has permission for this action
 * 3. Returns the authenticated user context
 * 4. Returns a 401/403 response if checks fail
 *
 * Usage in route handlers:
 *   const auth = await guardRoute(request, { roles: ['property_admin', 'super_admin'] });
 *   if (auth.error) return auth.error; // Returns 401 or 403 NextResponse
 *   const { userId, propertyId, role } = auth.user;
 */

import { NextRequest, NextResponse } from 'next/server';
import type { Role, TokenPayload } from '@/types';
import { requireAuth } from '@/server/middleware/auth';
import { AuthError } from '@/server/errors';

export interface AuthenticatedUser {
  userId: string;
  propertyId: string;
  role: Role;
  permissions: string[];
  mfaVerified: boolean;
}

export interface GuardResult {
  user: AuthenticatedUser;
  error: null;
}

export interface GuardError {
  user: null;
  error: NextResponse;
}

export type GuardResponse = GuardResult | GuardError;

interface GuardOptions {
  /** Allowed roles. If empty/undefined, any authenticated user is allowed. */
  roles?: Role[];
  /** If true, skips auth in demo mode (reads demo_role from request). */
  allowDemo?: boolean;
}

/**
 * Guard an API route with authentication and optional role-based authorization.
 */
export async function guardRoute(
  request: NextRequest,
  options: GuardOptions = {},
): Promise<GuardResponse> {
  const { roles, allowDemo = true } = options;

  try {
    // Check for demo mode first (development only)
    if (allowDemo && process.env.NODE_ENV !== 'production') {
      const demoRole = request.headers.get('x-demo-role');
      if (demoRole) {
        const demoUser: AuthenticatedUser = {
          userId: 'demo-user',
          propertyId: '00000000-0000-4000-b000-000000000001',
          role: demoRole as Role,
          permissions: ['*'],
          mfaVerified: true,
        };

        // Check role authorization even in demo mode
        if (roles && roles.length > 0 && !roles.includes(demoUser.role)) {
          return {
            user: null,
            error: NextResponse.json(
              {
                error: 'FORBIDDEN',
                message: `Role '${demoUser.role}' does not have access to this resource.`,
              },
              { status: 403 },
            ),
          };
        }

        return { user: demoUser, error: null };
      }
    }

    // Check if there's actually a token before calling requireAuth
    const authHeader = request.headers.get('authorization');
    if (!authHeader && process.env.NODE_ENV !== 'production') {
      // In dev mode without demo header AND without token = unauthorized
      // This prevents the requireAuth dev bypass from silently succeeding
      return {
        user: null,
        error: NextResponse.json(
          {
            error: 'UNAUTHORIZED',
            message: 'Authentication required. Use demo mode or provide a Bearer token.',
          },
          { status: 401 },
        ),
      };
    }

    // Real authentication
    const payload: TokenPayload = await requireAuth(request);

    const user: AuthenticatedUser = {
      userId: payload.sub,
      propertyId: payload.pid,
      role: payload.role,
      permissions: payload.perms,
      mfaVerified: payload.mfa,
    };

    // Role-based authorization
    if (roles && roles.length > 0 && !roles.includes(user.role)) {
      return {
        user: null,
        error: NextResponse.json(
          { error: 'FORBIDDEN', message: `Insufficient permissions for this action.` },
          { status: 403 },
        ),
      };
    }

    return { user, error: null };
  } catch (err) {
    if (err instanceof AuthError) {
      return {
        user: null,
        error: NextResponse.json({ error: 'UNAUTHORIZED', message: err.message }, { status: 401 }),
      };
    }

    return {
      user: null,
      error: NextResponse.json(
        { error: 'UNAUTHORIZED', message: 'Authentication required.' },
        { status: 401 },
      ),
    };
  }
}
