/**
 * Concierge — Reset Password API
 *
 * POST /api/auth/reset-password
 * Validates a reset token and sets a new password.
 * Invalidates all existing sessions and stores password in history.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/server/db';
import { hashPassword, verifyPassword } from '@/server/auth/password';
import { revokeAllUserSessions } from '@/server/auth/session';
import { RateLimitError } from '@/server/errors';
import { checkRateLimit } from '@/server/middleware/rate-limit';
import { PASSWORD_POLICY, PASSWORD_PATTERNS } from '@/lib/constants';

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  password: z
    .string()
    .min(
      PASSWORD_POLICY.minLength,
      `Password must be at least ${PASSWORD_POLICY.minLength} characters`,
    )
    .max(
      PASSWORD_POLICY.maxLength,
      `Password must be at most ${PASSWORD_POLICY.maxLength} characters`,
    )
    .refine(
      (val) => PASSWORD_PATTERNS.uppercase.test(val),
      'Password must contain at least one uppercase letter',
    )
    .refine(
      (val) => PASSWORD_PATTERNS.lowercase.test(val),
      'Password must contain at least one lowercase letter',
    )
    .refine((val) => PASSWORD_PATTERNS.digit.test(val), 'Password must contain at least one digit')
    .refine(
      (val) => PASSWORD_PATTERNS.special.test(val),
      'Password must contain at least one special character',
    ),
});

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<NextResponse> {
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';

  try {
    // 0. Rate limit check
    try {
      await checkRateLimit('auth', clientIp);
    } catch (e) {
      if (e instanceof RateLimitError) {
        return NextResponse.json(
          { error: 'Too many attempts. Please try again later.', code: 'RATE_LIMITED' },
          {
            status: 429,
            headers: { 'Retry-After': String(e.retryAfter), 'X-Request-Id': requestId },
          },
        );
      }
      throw e;
    }

    // 1. Parse and validate request body
    let body: z.infer<typeof resetPasswordSchema>;
    try {
      const raw = await req.json();
      const result = resetPasswordSchema.safeParse(raw);
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

    // 2. Look up reset token
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resetToken = await (prisma as any).passwordResetToken.findUnique({
      where: { token: body.token },
    });

    if (!resetToken) {
      return NextResponse.json(
        {
          error: 'AUTH_ERROR',
          message: 'Invalid or expired reset token',
          code: 'AUTH_ERROR',
          requestId,
        },
        { status: 401 },
      );
    }

    // 3. Check if token is expired
    if (new Date(resetToken.expiresAt) < new Date()) {
      return NextResponse.json(
        {
          error: 'AUTH_ERROR',
          message: 'Reset token has expired',
          code: 'AUTH_ERROR',
          requestId,
        },
        { status: 401 },
      );
    }

    // 4. Check if token is already used
    if (resetToken.usedAt) {
      return NextResponse.json(
        {
          error: 'AUTH_ERROR',
          message: 'Reset token has already been used',
          code: 'AUTH_ERROR',
          requestId,
        },
        { status: 401 },
      );
    }

    // 5. Look up user
    const user = await prisma.user.findUnique({
      where: { id: resetToken.userId },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: 'AUTH_ERROR',
          message: 'Invalid reset token',
          code: 'AUTH_ERROR',
          requestId,
        },
        { status: 401 },
      );
    }

    // 6. Check password history (prevent reuse of last N passwords)
    const passwordHistory = await prisma.passwordHistory.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: PASSWORD_POLICY.historyCount,
    });

    for (const historyEntry of passwordHistory) {
      const { valid } = await verifyPassword(body.password, historyEntry.passwordHash);
      if (valid) {
        return NextResponse.json(
          {
            error: 'VALIDATION_ERROR',
            message: 'Password has been used recently. Please choose a different password.',
            code: 'VALIDATION_ERROR',
            requestId,
            fields: [
              {
                field: 'password',
                message: 'Password has been used recently',
                code: 'password_reuse',
              },
            ],
          },
          { status: 422 },
        );
      }
    }

    // 7. Hash new password
    const newHash = await hashPassword(body.password);

    // 8. Update user password
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: newHash,
      },
    });

    // 9. Store old password in history
    await prisma.passwordHistory.create({
      data: {
        userId: user.id,
        passwordHash: newHash,
      },
    });

    // 10. Mark reset token as used
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).passwordResetToken.update({
      where: { id: resetToken.id },
      data: {
        usedAt: new Date(),
      },
    });

    // 11. Invalidate all sessions
    await revokeAllUserSessions(user.id);

    // Also invalidate all refresh tokens
    await prisma.refreshToken.updateMany({
      where: {
        userId: user.id,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
      },
    });

    // 12. Return success
    return NextResponse.json(
      {
        data: { message: 'Password has been reset successfully' },
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
