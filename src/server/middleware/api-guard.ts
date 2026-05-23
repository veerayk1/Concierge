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
import { DEFAULT_DEMO_PROPERTY_ID } from '@/lib/demo-config';
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

  // Resolve the propertyId the DEMO USER is scoped to. ONLY trust the
  // explicit demo header — falling back to the URL's ?propertyId means
  // any demo caller could spoof access to any tenant by appending a
  // different propertyId in the query string. enforcePropertyAccess
  // would then see user.propertyId === requestedPropertyId and let the
  // request through. With the URL fallback removed, a demo caller's
  // user is pinned to either the header or the default seeded property,
  // and enforcePropertyAccess will correctly reject cross-tenant reads.
  const headerPropertyId = request.headers.get('x-demo-propertyId');
  const propertyId = headerPropertyId || DEFAULT_DEMO_PROPERTY_ID;

  // Resolve a real userId from the database — demo UUIDs don't exist after DB
  // wipes. Pick a user whose role at this property matches the requested
  // demoRole so that greetings, profile widgets, and /api/v1/users/me show the
  // right persona (otherwise we'd always greet "Super Admin").
  //
  // QA EXTENSION: honor `x-demo-user-id` when provided AND it points at a
  // real user at this property, so adversarial probes can simulate
  // distinct users of the same role (e.g., resident A vs resident B in
  // different units) and verify per-user scoping fixes. Without this,
  // every resident_owner call resolves to the same first-matching user,
  // masking real per-resident scope bugs during testing.
  let resolvedUserId = isResident
    ? '00000000-0000-4000-d000-000000010101'
    : '00000000-0000-4000-a000-000000000001';
  const headerUserId = request.headers.get('x-demo-user-id');
  const isValidUuid =
    headerUserId &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(headerUserId);
  let resolvedFromHeader = false;
  if (isValidUuid) {
    try {
      const headerUser = await prisma.user.findFirst({
        where: { id: headerUserId!, userProperties: { some: { propertyId } } },
        select: { id: true },
      });
      if (headerUser) {
        resolvedUserId = headerUser.id;
        resolvedFromHeader = true;
      }
    } catch {
      // Fall through to role-name resolver
    }
  }
  try {
    if (resolvedFromHeader) {
      // Skip role-name fallback — header gave us a usable real user
    } else {
      const roleNameByDemo: Record<string, string> = {
        super_admin: 'Super Admin',
        property_admin: 'Property Admin',
        property_manager: 'Property Manager',
        front_desk: 'Front Desk / Concierge',
        security_guard: 'Security Guard',
        security_supervisor: 'Security Supervisor',
        board_member: 'Board Member',
        resident_owner: 'Resident (Owner)',
        resident_tenant: 'Resident (Tenant)',
        maintenance_staff: 'Maintenance Staff',
        superintendent: 'Superintendent',
      };
      const expectedRoleName = roleNameByDemo[demoRole];
      const matchUser = expectedRoleName
        ? await prisma.user.findFirst({
            where: {
              userProperties: {
                some: { propertyId, role: { name: expectedRoleName } },
              },
            },
            select: { id: true },
            orderBy: { createdAt: 'asc' },
          })
        : null;
      if (matchUser) {
        resolvedUserId = matchUser.id;
      } else {
        const realUser = await prisma.user.findFirst({
          where: { userProperties: { some: { propertyId } } },
          select: { id: true },
          orderBy: { createdAt: 'asc' },
        });
        if (realUser) resolvedUserId = realUser.id;
      }
    } // end !resolvedFromHeader
  } catch {
    // User lookup failed — proceed with demo UUID
  }

  const demoUser: AuthenticatedUser = {
    userId: resolvedUserId,
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

  if (
    allowedRoles &&
    allowedRoles.length > 0 &&
    demoUser.role !== 'super_admin' &&
    !allowedRoles.includes(demoUser.role)
  ) {
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
    // Demo mode: enabled by default, disable via DEMO_MODE_DISABLED=true for multi-tenant production
    const demoDisabled = process.env.DEMO_MODE_DISABLED === 'true';
    if (allowDemo && !demoDisabled) {
      const demoRole = request.headers.get('x-demo-role');
      if (demoRole) {
        return handleDemoMode(request, demoRole as Role, roles);
      }
    }

    // requireAuth() applies a dev-only mock user when no Bearer token is sent
    // (see auth.ts). That bypass only runs if we actually call requireAuth.
    // Previously we returned 401 when Authorization was missing, which made the
    // bypass unreachable and broke client pages (e.g. /system/properties) any
    // time the browser had no token header yet.
    //
    // Only skip straight to 401 in production (and test/CI). next dev sets
    // NODE_ENV === 'development', where we delegate to requireAuth.
    const authHeader = request.headers.get('authorization');
    const isNextDev = process.env.NODE_ENV === 'development';
    if (!authHeader && !isNextDev) {
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

    // Role-based authorization. Super Admin implicitly satisfies any roles list
    // — gating super admins out of feature routes is never the intent.
    if (roles && roles.length > 0 && user.role !== 'super_admin' && !roles.includes(user.role)) {
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

/**
 * Multi-tenancy guard. Pass after guardRoute() — verifies that the propertyId
 * the request is asking about matches the user's assigned propertyId.
 *
 * Super Admins bypass this check; everyone else must match.
 *
 * Returns null on pass, a 403 NextResponse on fail. Use as:
 *
 *   const auth = await guardRoute(request);
 *   if (auth.error) return auth.error;
 *   const propertyId = new URL(request.url).searchParams.get('propertyId');
 *   const tenancy = enforcePropertyAccess(auth.user, propertyId);
 *   if (tenancy) return tenancy;
 */
export function enforcePropertyAccess(
  user: AuthenticatedUser,
  requestedPropertyId: string | null | undefined,
): NextResponse | null {
  if (!requestedPropertyId) return null;
  if (user.role === 'super_admin') return null;
  if (user.propertyId === requestedPropertyId) return null;
  return NextResponse.json(
    {
      error: 'FORBIDDEN',
      message: 'You do not have access to this property.',
      code: 'CROSS_TENANT_BLOCKED',
    },
    { status: 403 },
  );
}
