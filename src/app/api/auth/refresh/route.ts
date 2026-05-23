/**
 * Concierge — Token Refresh API
 *
 * POST /api/auth/refresh
 * Exchanges a valid refresh token for new access + refresh tokens.
 * Implements refresh token rotation with replay detection.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/server/db';
import { signAccessToken, generateRefreshToken } from '@/server/auth/jwt';
import type { Role, TokenPayload } from '@/types';

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const refreshSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<NextResponse> {
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();

  try {
    // 1. Parse and validate request body
    let body: z.infer<typeof refreshSchema>;
    try {
      const raw = await req.json();
      const result = refreshSchema.safeParse(raw);
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

    // 2. Look up refresh token in DB. The token is stored as a SHA-256 hash
    //    (see login route step 10) under the `tokenHash` column; the previous
    //    implementation queried `where: { token: body.refreshToken }` which
    //    doesn't exist in the schema and 500'd on every call. Hash the
    //    incoming plaintext, then look up by the hash.
    const tokenHashBytes = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(body.refreshToken),
    );
    const tokenHash = Array.from(new Uint8Array(tokenHashBytes))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    const storedToken = await prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!storedToken) {
      return NextResponse.json(
        {
          error: 'AUTH_ERROR',
          message: 'Invalid refresh token',
          code: 'AUTH_ERROR',
          requestId,
        },
        { status: 401 },
      );
    }

    // 3. Check if token is revoked or already rotated (replay detection).
    //    Either condition means the token has been used or invalidated and
    //    can't be exchanged again.
    if (storedToken.revokedAt || storedToken.rotatedAt) {
      return NextResponse.json(
        {
          error: 'AUTH_ERROR',
          message: 'Refresh token has been revoked',
          code: 'AUTH_ERROR',
          requestId,
        },
        { status: 401 },
      );
    }

    // 4. Check if token is expired
    if (new Date(storedToken.expiresAt) < new Date()) {
      return NextResponse.json(
        {
          error: 'AUTH_ERROR',
          message: 'Refresh token has expired',
          code: 'AUTH_ERROR',
          requestId,
        },
        { status: 401 },
      );
    }

    // 5. Look up user and check active status
    const user = await prisma.user.findUnique({
      where: { id: storedToken.userId },
      include: {
        userProperties: {
          include: {
            role: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      return NextResponse.json(
        {
          error: 'AUTH_ERROR',
          message: 'User account is not active',
          code: 'AUTH_ERROR',
          requestId,
        },
        { status: 401 },
      );
    }

    // 6. Rotate: mark the old token as rotated so future replay returns 401.
    //    The previous implementation also set a `replacedByToken` field that
    //    doesn't exist in the schema, which 500'd the whole endpoint.
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { rotatedAt: new Date() },
    });

    // 7. Generate new tokens
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const userProp = (user as any).userProperties?.[0];
    const roleSlug = (userProp?.role?.slug || 'visitor') as Role;
    const permissions = userProp?.role?.permissions || [];
    const propertyId = userProp?.propertyId || '';

    const tokenPayload: TokenPayload = {
      sub: user.id,
      pid: propertyId,
      role: roleSlug,
      perms: permissions,
      mfa: user.mfaEnabled,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 900,
    };

    const accessToken = await signAccessToken(tokenPayload);
    const newRefreshToken = generateRefreshToken();

    // 8. Hash the new token and store it. Mirror the login flow: tokenHash
    //    + deviceFingerprint + ipAddress are required NOT NULL columns.
    const newHashBytes = await crypto.subtle.digest(
      'SHA-256',
      new TextEncoder().encode(newRefreshToken),
    );
    const newTokenHash = Array.from(new Uint8Array(newHashBytes))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');

    await prisma.refreshToken.create({
      data: {
        tokenHash: newTokenHash,
        userId: user.id,
        deviceFingerprint: storedToken.deviceFingerprint,
        ipAddress:
          req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || storedToken.ipAddress,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    // 9. Return new tokens
    return NextResponse.json(
      {
        data: {
          accessToken,
          refreshToken: newRefreshToken,
        },
        requestId,
      },
      { status: 200 },
    );
  } catch (e) {
    // Log the real error before returning generic 500 — the previous empty
    // catch{} hid the underlying Prisma "Unknown arg `token`" error so the
    // dead endpoint was invisible during normal log review.
    console.error('[refresh] unexpected error:', (e as Error)?.message);
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
        code: 'INTERNAL_ERROR',
        requestId,
      },
      { status: 500 },
    );
  }
}
