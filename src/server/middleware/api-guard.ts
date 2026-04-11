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
import { prisma } from '@/server/db';

export interface AuthenticatedUser {
  userId: string;
  propertyId: string;
  role: Role;
  permissions: string[];
  mfaVerified: boolean;
  /** Unit ID for resident roles — populated from occupancy records. */
  unitId?: string;
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
 * Resolve demo mode authentication for development.
 * For resident roles, looks up the first unit in the property to assign unitId.
 */
async function handleDemoMode(
  request: NextRequest,
  demoRole: Role,
  allowedRoles?: Role[],
): Promise<GuardResponse> {
  const isResident = demoRole === 'resident_owner' || demoRole === 'resident_tenant';

  // Read propertyId from header or query string, fall back to Bond Tower default
  const headerPropertyId = request.headers.get('x-demo-propertyId');
  const url = new URL(request.url);
  const queryPropertyId = url.searchParams.get('propertyId');
  const DEFAULT_PROPERTY_ID = '8165b053-0af8-4e46-aa54-97f52ee9ea8d'; // Bond Tower
  const propertyId = headerPropertyId || queryPropertyId || DEFAULT_PROPERTY_ID;

  const demoUser: AuthenticatedUser = {
    userId: isResident
      ? '00000000-0000-4000-d000-000000010101'
      : '00000000-0000-4000-a000-000000000001',
    propertyId,
    role: demoRole,
    permissions: ['*'],
    mfaVerified: true,
  };

  // For resident roles, resolve a unitId from the database
  if (isResident) {
    try {
      const rows = await prisma.$queryRaw<{ id: string }[]>`
        SELECT id FROM units
        WHERE "propertyId" = ${propertyId}::uuid
        LIMIT 1
      `;
      if (rows.length > 0) {
        demoUser.unitId = rows[0]!.id;
      }
    } catch {
      // units table may not exist yet — continue without unitId
    }
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(demoUser.role)) {
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
        return handleDemoMode(request, demoRole as Role, roles);
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

    // For resident roles, resolve unitId from occupancy records via raw SQL
    // (OccupancyRecord model may not be in generated Prisma client)
    if ((user.role === 'resident_owner' || user.role === 'resident_tenant') && !user.unitId) {
      try {
        const rows = await prisma.$queryRaw<{ unitId: string }[]>`
          SELECT "unitId" FROM occupancy_records
          WHERE "userId" = ${user.userId}::uuid
            AND "moveOutDate" IS NULL
            AND "isPrimary" = true
          LIMIT 1
        `;
        if (rows.length > 0) {
          user.unitId = rows[0]!.unitId;
        } else {
          // Fall back to any active occupancy
          const anyRows = await prisma.$queryRaw<{ unitId: string }[]>`
            SELECT "unitId" FROM occupancy_records
            WHERE "userId" = ${user.userId}::uuid
              AND "moveOutDate" IS NULL
            LIMIT 1
          `;
          if (anyRows.length > 0) {
            user.unitId = anyRows[0]!.unitId;
          }
        }
      } catch {
        // Silently continue without unitId — stale client or table missing
      }
    }

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
