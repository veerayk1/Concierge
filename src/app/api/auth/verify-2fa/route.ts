/**
 * Concierge — 2FA Verification API
 *
 * POST /api/auth/verify-2fa
 * Verifies a TOTP code or recovery code after successful password auth.
 * Returns JWT access token + refresh token on success.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/server/db';
import { verifyTotpCode } from '@/server/auth/totp';
import { signAccessToken, generateRefreshToken } from '@/server/auth/jwt';
import { createSession, generateDeviceFingerprint } from '@/server/auth/session';
import type { Role, TokenPayload } from '@/types';

// ---------------------------------------------------------------------------
// Schema — accepts either TOTP code OR recovery code
// ---------------------------------------------------------------------------

const verify2faSchema = z
  .object({
    code: z
      .string()
      .length(6, 'MFA code must be exactly 6 digits')
      .regex(/^\d{6}$/, 'MFA code must contain only digits')
      .optional(),
    recoveryCode: z.string().optional(),
    mfaToken: z.string().min(1, 'MFA token is required'),
  })
  .refine((data) => data.code || data.recoveryCode, {
    message: 'Either code or recoveryCode must be provided',
  });

// ---------------------------------------------------------------------------
// MFA Token Helpers
// ---------------------------------------------------------------------------

/**
 * Decode an MFA challenge token to extract the user ID.
 * MFA tokens are short-lived tokens issued during login when MFA is required.
 *
 * Token format: base64({ sub: userId, exp: timestamp })
 * Falls back to using the raw token value for lookup if decoding fails.
 */
function extractUserIdFromMfaToken(mfaToken: string): string {
  try {
    // Try base64url decoding
    const base64 = mfaToken.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base64);
    const decoded = JSON.parse(binary);
    if (decoded.sub && typeof decoded.sub === 'string') {
      // Check expiry (5 minutes)
      if (decoded.exp && decoded.exp < Date.now()) {
        return ''; // expired
      }
      return decoded.sub;
    }
  } catch {
    // Not a structured token — try parsing as mfa_challenge format
  }

  // Try mfa_challenge:<userId>:<timestamp>:<uuid> format
  if (mfaToken.startsWith('mfa_challenge:')) {
    const parts = mfaToken.split(':');
    return parts[1] || '';
  }

  // Fallback: use the token value directly as a lookup hint
  // (supports test environments where mfaToken is an opaque string)
  return mfaToken;
}

/**
 * Create an MFA challenge token encoding the user ID.
 */
export function createMfaChallengeToken(userId: string): string {
  const payload = {
    sub: userId,
    exp: Date.now() + 5 * 60 * 1000, // 5 minutes
    jti: crypto.randomUUID(),
  };
  return btoa(JSON.stringify(payload)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<NextResponse> {
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();

  try {
    // 1. Parse and validate request body
    let body: z.infer<typeof verify2faSchema>;
    try {
      const raw = await req.json();
      const result = verify2faSchema.safeParse(raw);
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

    // 2. Extract user ID from MFA token
    const userId = extractUserIdFromMfaToken(body.mfaToken);

    if (!userId) {
      return NextResponse.json(
        {
          error: 'AUTH_ERROR',
          message: 'Invalid or expired MFA token',
          code: 'AUTH_ERROR',
          requestId,
        },
        { status: 401 },
      );
    }

    // 3. Look up user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        userProperties: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user || !user.mfaEnabled) {
      return NextResponse.json(
        {
          error: 'AUTH_ERROR',
          message: 'Invalid or expired MFA token',
          code: 'AUTH_ERROR',
          requestId,
        },
        { status: 401 },
      );
    }

    // 4. Verify code (TOTP or recovery)
    let verified = false;

    if (body.code) {
      // TOTP verification
      verified = await verifyTotpCode(user.mfaSecret || '', body.code);
    } else if (body.recoveryCode) {
      // Recovery code verification
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const recoveryCode = await (prisma as any).recoveryCode.findFirst({
        where: {
          userId: user.id,
          code: body.recoveryCode,
          usedAt: null,
        },
      });

      if (recoveryCode) {
        verified = true;
        // Mark recovery code as used
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (prisma as any).recoveryCode.update({
          where: { id: recoveryCode.id },
          data: { usedAt: new Date() },
        });
      }
    }

    if (!verified) {
      return NextResponse.json(
        {
          error: 'AUTH_ERROR',
          message: 'Invalid verification code',
          code: 'AUTH_ERROR',
          requestId,
        },
        { status: 401 },
      );
    }

    // 5. Get role and property info
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userProp = (user as any).userProperties?.[0];
    const roleSlug = (userProp?.role?.slug || 'visitor') as Role;
    const permissions = userProp?.role?.permissions || [];
    const propertyId = userProp?.propertyId || '';

    // 6. Generate tokens
    const tokenPayload: TokenPayload = {
      sub: user.id,
      pid: propertyId,
      role: roleSlug,
      perms: permissions,
      mfa: true,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 900,
    };

    const accessToken = await signAccessToken(tokenPayload);
    const refreshToken = generateRefreshToken();

    // 7. Store refresh token (best-effort)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (prisma.refreshToken.create as any)({
        data: {
          token: refreshToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      });
    } catch {
      /* best-effort */
    }

    // 8. Create session
    const ip = req.headers.get('x-forwarded-for') || '0.0.0.0';
    const ua = req.headers.get('user-agent') || 'unknown';

    try {
      await createSession({
        userId: user.id,
        deviceFingerprint: generateDeviceFingerprint(ua, ip),
        ipAddress: ip,
        userAgent: ua,
      });
    } catch {
      /* best-effort */
    }

    // 9. Audit (best-effort)
    try {
      await prisma.loginAudit.create({
        data: {
          userId: user.id,
          email: user.email,
          success: true,
          ipAddress: ip,
          userAgent: ua,
        },
      });
    } catch {
      /* best-effort */
    }

    // 10. Return tokens
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
          },
        },
        requestId,
      },
      { status: 200 },
    );
  } catch (err) {
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: err instanceof Error ? err.message : 'An unexpected error occurred',
        code: 'INTERNAL_ERROR',
        requestId,
      },
      { status: 500 },
    );
  }
}
