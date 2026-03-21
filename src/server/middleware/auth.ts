/**
 * Concierge — Authentication Middleware
 *
 * Extracts and validates the JWT Bearer token from the Authorization header.
 *
 * **Scaffold behaviour:**
 * - In development (`NODE_ENV !== 'production'`), returns a mock token
 *   payload so API routes can be tested without a running auth service.
 * - In production, validates the JWT signature and claims using `jose`.
 *
 * Once the auth service and key management are in place, the development
 * bypass will be removed and all environments will use real validation.
 */

import type { NextRequest } from 'next/server';
import { errors as joseErrors } from 'jose';

import { AuthError } from '@/server/errors';
import { verifyAccessToken } from '@/server/auth/jwt';
import { createLogger } from '@/server/logger';
import type { Role, TokenPayload } from '@/types';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const logger = createLogger('auth');

const isDev = process.env.NODE_ENV !== 'production';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Extract the Bearer token from the Authorization header.
 *
 * @returns The raw JWT string, or `null` if the header is missing or malformed.
 */
function extractBearerToken(req: NextRequest): string | null {
  const header = req.headers.get('authorization');
  if (!header) return null;

  const parts = header.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') return null;

  return parts[1] ?? null;
}

/**
 * Development-only mock payload.
 * Simulates a property admin so all routes are accessible during scaffold testing.
 */
function getMockPayload(): TokenPayload {
  const now = Math.floor(Date.now() / 1000);

  return {
    sub: '00000000-0000-0000-0000-000000000001',
    pid: '00000000-0000-0000-0000-000000000010',
    role: 'property_admin' as Role,
    perms: ['*'],
    mfa: true,
    iat: now,
    exp: now + 3600,
  };
}

// ---------------------------------------------------------------------------
// Type Guard
// ---------------------------------------------------------------------------

/**
 * Runtime check that a decoded JWT payload conforms to `TokenPayload`.
 */
function isTokenPayload(value: unknown): value is TokenPayload {
  if (typeof value !== 'object' || value === null) return false;

  const obj = value as Record<string, unknown>;

  return (
    typeof obj['sub'] === 'string' &&
    typeof obj['pid'] === 'string' &&
    typeof obj['role'] === 'string' &&
    Array.isArray(obj['perms']) &&
    typeof obj['mfa'] === 'boolean' &&
    typeof obj['iat'] === 'number' &&
    typeof obj['exp'] === 'number'
  );
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Authenticate the request by validating the JWT Bearer token.
 *
 * @throws {AuthError} If the token is missing, malformed, expired, or invalid.
 * @returns The decoded `TokenPayload`.
 */
export async function requireAuth(req: NextRequest): Promise<TokenPayload> {
  const token = extractBearerToken(req);

  // ---- Development bypass ----
  if (isDev && !token) {
    logger.warn('DEV MODE: No token provided — returning mock payload');
    return getMockPayload();
  }

  if (!token) {
    throw new AuthError('Missing authorization token');
  }

  // Validate with RS256 via verifyAccessToken (shared key pair with login route)
  try {
    const payload = await verifyAccessToken(token);

    if (!isTokenPayload(payload)) {
      throw new AuthError('Invalid token payload structure');
    }

    return payload;
  } catch (error: unknown) {
    if (error instanceof AuthError) throw error;

    if (error instanceof joseErrors.JWTExpired) {
      throw new AuthError('Token has expired');
    }

    if (error instanceof joseErrors.JWTClaimValidationFailed) {
      throw new AuthError('Token claim validation failed');
    }

    if (error instanceof joseErrors.JWSSignatureVerificationFailed) {
      throw new AuthError('Invalid token signature');
    }

    logger.error({ error }, 'Unexpected JWT verification error');
    throw new AuthError('Invalid authorization token');
  }
}
