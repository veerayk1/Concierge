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

    // 2. Look up refresh token in DB
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const storedToken = await (prisma.refreshToken.findUnique as any)({
      where: { token: body.refreshToken },
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

    // 3. Check if token is revoked (replay detection)
    if (storedToken.revokedAt) {
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

    // 6. Rotate: revoke old token
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma.refreshToken.update as any)({
      where: { id: storedToken.id },
      data: {
        revokedAt: new Date(),
        replacedByToken: 'new-refresh-token', // Will be updated
      },
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

    // 8. Store new refresh token
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma.refreshToken.create as any)({
      data: {
        token: newRefreshToken,
        userId: user.id,
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
  } catch {
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
