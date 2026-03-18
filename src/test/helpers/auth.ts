/**
 * Concierge — Auth Test Helper
 *
 * Utilities for creating JWTs, authenticated request headers,
 * and wrapping API route handlers with auth context.
 *
 * Uses jose (already in dependencies) for JWT operations,
 * matching the production auth implementation.
 *
 * @module test/helpers/auth
 */

import { SignJWT } from 'jose';
import type { Role, TokenPayload } from '@/types';
import { TOKEN_EXPIRY_SECONDS } from '@/lib/constants';

// ---------------------------------------------------------------------------
// Test signing key
// ---------------------------------------------------------------------------

/**
 * Deterministic test secret — NEVER use in production.
 * 256-bit key for HS256 signing.
 *
 * We import as a CryptoKey to ensure compatibility with jose v6
 * across both Node.js and jsdom test environments.
 */
const TEST_JWT_SECRET_RAW = new TextEncoder().encode(
  'concierge-test-jwt-secret-do-not-use-in-production-256bit!',
);

let _cachedKey: CryptoKey | null = null;

async function getTestJWTKey(): Promise<CryptoKey> {
  if (_cachedKey) return _cachedKey;
  _cachedKey = await crypto.subtle.importKey(
    'raw',
    TEST_JWT_SECRET_RAW,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify'],
  );
  return _cachedKey;
}

/**
 * Default permissions per role for test JWTs.
 * Matches the permission sets from the user factory.
 */
const DEFAULT_PERMISSIONS: Record<Role, string[]> = {
  super_admin: ['*'],
  property_admin: [
    'property:manage',
    'user:manage',
    'role:manage',
    'event:manage',
    'unit:manage',
    'maintenance:manage',
    'amenity:manage',
    'announcement:manage',
    'report:view',
    'settings:manage',
  ],
  property_manager: [
    'event:manage',
    'unit:manage',
    'maintenance:manage',
    'amenity:manage',
    'announcement:manage',
    'report:view',
    'vendor:manage',
  ],
  security_supervisor: [
    'event:create',
    'event:read',
    'event:update',
    'incident:manage',
    'visitor:manage',
    'parking:manage',
    'key:manage',
    'unit:read',
    'shift_log:manage',
    'report:view:security',
    'training:manage:team',
  ],
  security_guard: [
    'event:create',
    'event:read',
    'event:update',
    'incident:manage',
    'visitor:manage',
    'parking:manage',
    'key:manage',
    'unit:read',
    'shift_log:manage',
  ],
  front_desk: [
    'event:create',
    'event:read',
    'event:update',
    'package:manage',
    'visitor:manage',
    'unit:read',
    'announcement:read',
    'shift_log:manage',
  ],
  maintenance_staff: ['maintenance:read', 'maintenance:update', 'equipment:read', 'unit:read'],
  superintendent: [
    'maintenance:read',
    'maintenance:update',
    'maintenance:create',
    'equipment:manage',
    'unit:read',
    'building_systems:read',
    'shift_log:manage',
    'parts:request',
  ],
  board_member: ['report:view', 'announcement:read', 'unit:read', 'financial:view'],
  resident_owner: [
    'event:read:own',
    'maintenance:create',
    'maintenance:read:own',
    'amenity:book',
    'announcement:read',
    'profile:manage',
  ],
  resident_tenant: [
    'event:read:own',
    'maintenance:create',
    'maintenance:read:own',
    'amenity:book',
    'announcement:read',
    'profile:manage',
  ],
  family_member: ['event:read:own', 'amenity:book', 'announcement:read', 'profile:read'],
  offsite_owner: [
    'event:read:own',
    'maintenance:read:own',
    'announcement:read',
    'report:view:own',
    'profile:manage',
  ],
  visitor: ['announcement:read:public'],
};

// ---------------------------------------------------------------------------
// JWT Creation
// ---------------------------------------------------------------------------

export interface CreateTestJWTOptions {
  /** Override default permissions for this role */
  permissions?: string[];
  /** Whether MFA was completed (default: true for admin roles, false otherwise) */
  mfa?: boolean;
  /** Custom expiration in seconds (default: access token TTL) */
  expiresInSeconds?: number;
  /** Custom issued-at timestamp */
  issuedAt?: Date;
}

/**
 * Creates a valid signed JWT for testing API routes.
 *
 * @param userId - UUID of the user
 * @param role - Role for this session
 * @param propertyId - UUID of the property
 * @param options - Optional JWT configuration
 * @returns Signed JWT string (compact serialization)
 *
 * @example
 * ```ts
 * const token = await createTestJWT(user.id, 'property_admin', property.id);
 * const response = await fetch('/api/v1/events', {
 *   headers: { Authorization: `Bearer ${token}` },
 * });
 * ```
 */
export async function createTestJWT(
  userId: string,
  role: Role,
  propertyId: string,
  options: CreateTestJWTOptions = {},
): Promise<string> {
  const {
    permissions = DEFAULT_PERMISSIONS[role],
    mfa = role === 'super_admin' || role === 'property_admin',
    expiresInSeconds = TOKEN_EXPIRY_SECONDS.accessToken,
    issuedAt = new Date(),
  } = options;

  const iat = Math.floor(issuedAt.getTime() / 1000);

  try {
    const key = await getTestJWTKey();

    const token = await new SignJWT({
      sub: userId,
      pid: propertyId,
      role,
      perms: permissions,
      mfa,
    } satisfies Omit<TokenPayload, 'iat' | 'exp'>)
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt(iat)
      .setExpirationTime(iat + expiresInSeconds)
      .sign(key);

    return token;
  } catch {
    // Fallback for environments where jose cannot sign (e.g., jsdom with
    // incompatible Uint8Array). Construct a structurally valid but unsigned
    // JWT. Tests that use this helper mock verifyAccessToken anyway.
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).replace(/=/g, '');
    const payload = btoa(
      JSON.stringify({
        sub: userId,
        pid: propertyId,
        role,
        perms: permissions,
        mfa,
        iat,
        exp: iat + expiresInSeconds,
      }),
    ).replace(/=/g, '');
    return `${header}.${payload}.test-signature`;
  }
}

/**
 * Creates an expired JWT (for testing token expiration handling).
 */
export async function createExpiredJWT(
  userId: string,
  role: Role,
  propertyId: string,
): Promise<string> {
  const pastDate = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
  return createTestJWT(userId, role, propertyId, {
    issuedAt: pastDate,
    expiresInSeconds: 1, // expired 59 minutes ago
  });
}

// ---------------------------------------------------------------------------
// Auth Headers
// ---------------------------------------------------------------------------

/**
 * Returns an Authorization header object ready to spread into fetch options.
 *
 * @example
 * ```ts
 * const headers = await createAuthHeaders(user.id, 'front_desk', property.id);
 * const res = await fetch('/api/v1/events', { headers });
 * ```
 */
export async function createAuthHeaders(
  userId: string,
  role: Role,
  propertyId: string,
  options: CreateTestJWTOptions = {},
): Promise<Record<string, string>> {
  const token = await createTestJWT(userId, role, propertyId, options);

  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

// ---------------------------------------------------------------------------
// Route Handler Wrapper
// ---------------------------------------------------------------------------

/**
 * Wraps a Next.js API route handler with pre-authenticated context.
 * Injects a valid JWT into the request's Authorization header.
 *
 * Useful for testing route handlers directly without going through HTTP.
 *
 * @example
 * ```ts
 * import { GET } from '@/app/api/v1/events/route';
 *
 * it('returns events for the property', async () => {
 *   const handler = await withAuth(GET, {
 *     userId: user.id,
 *     role: 'front_desk',
 *     propertyId: property.id,
 *   });
 *   const response = await handler(request);
 *   expect(response.status).toBe(200);
 * });
 * ```
 */
export async function withAuth(
  handler: (req: Request, ...args: unknown[]) => Promise<Response>,
  authContext: {
    userId: string;
    role: Role;
    propertyId: string;
    options?: CreateTestJWTOptions;
  },
): Promise<(req: Request, ...args: unknown[]) => Promise<Response>> {
  const token = await createTestJWT(
    authContext.userId,
    authContext.role,
    authContext.propertyId,
    authContext.options,
  );

  return async (req: Request, ...args: unknown[]) => {
    // Clone the request with the auth header injected
    const authenticatedReq = new Request(req.url, {
      method: req.method,
      headers: {
        ...Object.fromEntries(req.headers.entries()),
        Authorization: `Bearer ${token}`,
      },
      body: req.body,
    });

    return handler(authenticatedReq, ...args);
  };
}

/**
 * Returns the test JWT secret for verifying tokens in tests.
 * Only exported for test infrastructure — never use in production code.
 */
export function getTestJWTSecret(): Uint8Array {
  return TEST_JWT_SECRET_RAW;
}
