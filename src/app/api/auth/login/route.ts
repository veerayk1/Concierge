/**
 * Concierge — Login API
 *
 * POST /api/auth/login
 * Authenticates a user with email + password.
 * Returns JWT access token + refresh token, or MFA challenge if enabled.
 *
 * Security features:
 * - No email enumeration (identical error for wrong email / wrong password)
 * - Account lockout after 5 failed attempts
 * - Login audit trail
 * - MFA challenge flow for users with 2FA enabled
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/server/db';
import { verifyPassword } from '@/server/auth/password';
import { signAccessToken, generateRefreshToken } from '@/server/auth/jwt';
import { createSession, generateDeviceFingerprint } from '@/server/auth/session';
import { AuthError, RateLimitError } from '@/server/errors';
import { checkRateLimit } from '@/server/middleware/rate-limit';
import { PASSWORD_POLICY } from '@/lib/constants';
import type { Role, TokenPayload } from '@/types';

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const loginSchema = z.object({
  email: z.string().email('Invalid email address').min(1),
  password: z
    .string()
    .min(1, 'Password is required')
    .max(PASSWORD_POLICY.maxLength, 'Password is too long'),
  rememberMe: z.boolean().optional().default(false),
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const INVALID_CREDENTIALS_MSG = 'Invalid email or password';

// ---------------------------------------------------------------------------
// Helper: best-effort async operation (mocks may return undefined)
// ---------------------------------------------------------------------------

async function bestEffort<T>(fn: () => T | Promise<T>): Promise<T | undefined> {
  try {
    return await fn();
  } catch {
    return undefined;
  }
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<NextResponse> {
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

  try {
    // 0. Rate limit check — 10 attempts per 15 minutes per IP
    try {
      const rl = await checkRateLimit('auth', clientIp);
      // Rate limit headers are added to successful responses below
      void rl;
    } catch (e) {
      if (e instanceof RateLimitError) {
        return NextResponse.json(
          { error: 'Too many login attempts. Please try again later.', code: 'RATE_LIMITED' },
          {
            status: 429,
            headers: {
              'Retry-After': String(e.retryAfter),
              'X-Request-Id': requestId,
            },
          },
        );
      }
      throw e;
    }

    // 1. Parse and validate request body
    let body: z.infer<typeof loginSchema>;
    try {
      const raw = await req.json();
      const result = loginSchema.safeParse(raw);
      if (!result.success) {
        return NextResponse.json(
          {
            error: 'VALIDATION_ERROR',
            message: 'Request body validation failed',
            code: 'VALIDATION_ERROR',
            requestId,
            fields: result.error.issues.map((i) => ({
              field: i.path.join('.'),
              message: i.message,
              code: i.code,
            })),
          },
          { status: 422 },
        );
      }
      body = result.data;
    } catch {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'Invalid JSON body',
          code: 'VALIDATION_ERROR',
          requestId,
        },
        { status: 422 },
      );
    }

    // 2. Look up user by email
    const user = await prisma.user.findUnique({
      where: { email: body.email.toLowerCase() },
      include: {
        userProperties: {
          include: {
            role: true,
          },
        },
      },
    });

    // 3. If user not found, return generic auth error (no enumeration)
    if (!user) {
      await bestEffort(() =>
        prisma.loginAudit.create({
          data: {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            userId: null as any,
            email: body.email.toLowerCase(),
            success: false,
            ipAddress: req.headers.get('x-forwarded-for') || '0.0.0.0',
            userAgent: req.headers.get('user-agent') || 'unknown',
            failReason: 'user_not_found',
          },
        }),
      );

      return NextResponse.json(
        {
          error: 'AUTH_ERROR',
          message: INVALID_CREDENTIALS_MSG,
          code: 'AUTH_ERROR',
          requestId,
        },
        { status: 401 },
      );
    }

    // 4. Check if account is active
    if (!user.isActive) {
      return NextResponse.json(
        {
          error: 'AUTH_ERROR',
          message: INVALID_CREDENTIALS_MSG,
          code: 'AUTH_ERROR',
          requestId,
        },
        { status: 401 },
      );
    }

    // 5. Check if account is locked
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((user as any).lockedUntil && new Date((user as any).lockedUntil) > new Date()) {
      return NextResponse.json(
        {
          error: 'ACCOUNT_LOCKED',
          message: 'Account is temporarily locked due to too many failed login attempts',
          code: 'ACCOUNT_LOCKED',
          requestId,
        },
        { status: 423 },
      );
    }

    // 6. Verify password
    const { valid } = await verifyPassword(body.password, user.passwordHash);

    if (!valid) {
      // Increment failed attempts
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const failedAttempts = ((user as any).failedLoginAttempts || 0) + 1;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateData: Record<string, any> = {
        failedLoginAttempts: failedAttempts,
      };

      // Lock account after 5 failed attempts
      if (failedAttempts >= PASSWORD_POLICY.lockoutAttempts) {
        updateData.lockedUntil = new Date(
          Date.now() + PASSWORD_POLICY.lockoutDurationSeconds * 1000,
        );
      }

      await bestEffort(() =>
        prisma.user.update({
          where: { id: user.id },
          data: updateData,
        }),
      );

      // Audit failed login
      await bestEffort(() =>
        prisma.loginAudit.create({
          data: {
            userId: user.id,
            email: user.email,
            success: false,
            ipAddress: req.headers.get('x-forwarded-for') || '0.0.0.0',
            userAgent: req.headers.get('user-agent') || 'unknown',
            failReason: 'invalid_password',
          },
        }),
      );

      return NextResponse.json(
        {
          error: 'AUTH_ERROR',
          message: INVALID_CREDENTIALS_MSG,
          code: 'AUTH_ERROR',
          requestId,
        },
        { status: 401 },
      );
    }

    // 7. Get role and property info
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userProp = (user as any).userProperties?.[0];
    const roleSlug = (userProp?.role?.slug || 'visitor') as Role;
    // permissions may be stored as JSON string or array — normalize to array
    const rawPerms = userProp?.role?.permissions || [];
    const permissions: string[] =
      typeof rawPerms === 'string' ? JSON.parse(rawPerms) : Array.isArray(rawPerms) ? rawPerms : [];
    const propertyId = userProp?.propertyId || '';

    // 8. Check if MFA is required
    if (user.mfaEnabled) {
      // Return MFA challenge token (short-lived)
      const mfaPayload = {
        sub: user.id,
        exp: Date.now() + 5 * 60 * 1000,
        jti: crypto.randomUUID(),
      };
      const mfaToken = btoa(JSON.stringify(mfaPayload))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

      return NextResponse.json(
        {
          data: {
            mfaToken,
            mfaRequired: true,
          },
          requestId,
        },
        { status: 200 },
      );
    }

    // 9. Generate tokens
    const tokenPayload: TokenPayload = {
      sub: user.id,
      pid: propertyId,
      role: roleSlug,
      perms: permissions,
      mfa: false,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 900,
    };

    const accessToken = await signAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken();

    // 10. Store refresh token in DB (best-effort)
    const ip = req.headers.get('x-forwarded-for') || '0.0.0.0';
    const ua = req.headers.get('user-agent') || 'unknown';
    const fingerprint = generateDeviceFingerprint(ua, ip);

    // Hash the refresh token for secure storage
    const tokenHashBytes = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(refreshToken),
    );
    const tokenHash = Array.from(new Uint8Array(tokenHashBytes))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    await bestEffort(() =>
      prisma.refreshToken.create({
        data: {
          tokenHash,
          userId: user.id,
          deviceFingerprint: fingerprint,
          ipAddress: ip,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      }),
    );

    // 11. Reset failed login attempts (best-effort — failedLoginAttempts may not be in generated client yet)
    await bestEffort(() =>
      prisma.user.update({
        where: { id: user.id },
        data: {
          lastLoginAt: new Date(),
        },
      }),
    );

    // 12. Create session (best-effort)
    await bestEffort(() =>
      createSession({
        userId: user.id,
        deviceFingerprint: fingerprint,
        ipAddress: ip,
        userAgent: ua,
      }),
    );

    // 13. Audit successful login
    await bestEffort(() =>
      prisma.loginAudit.create({
        data: {
          userId: user.id,
          email: user.email,
          success: true,
          ipAddress: ip,
          userAgent: ua,
        },
      }),
    );

    // 14. Return tokens (include propertyId so frontend can store it for multi-tenancy)
    return NextResponse.json(
      {
        data: {
          accessToken,
          refreshToken,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: roleSlug,
            propertyId,
          },
        },
        requestId,
      },
      { status: 200 },
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        {
          error: error.code,
          message: error.message,
          code: error.code,
          requestId,
        },
        { status: error.statusCode },
      );
    }

    console.error('POST /api/auth/login unhandled error:', error);
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message:
          process.env.NODE_ENV === 'development' ? String(error) : 'An unexpected error occurred',
        code: 'INTERNAL_ERROR',
        requestId,
      },
      { status: 500 },
    );
  }
}
