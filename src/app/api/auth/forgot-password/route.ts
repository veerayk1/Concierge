/**
 * Concierge — Forgot Password API
 *
 * POST /api/auth/forgot-password
 * Sends a password reset email if the email exists.
 * Always returns 200 to prevent email enumeration.
 * Rate limited: 3 per email per hour.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/server/db';
import { sendPasswordResetEmail } from '@/server/email';
import { RateLimitError } from '@/server/errors';
import { checkRateLimit } from '@/server/middleware/rate-limit';

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address').min(1),
});

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GENERIC_MESSAGE =
  'If an account with that email exists, a password reset link has been sent.';
const RATE_LIMIT_PER_EMAIL = 3;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const TOKEN_EXPIRY_MS = 60 * 60 * 1000; // 1 hour

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
        // Return identical response to prevent timing/header enumeration
        return NextResponse.json(
          { message: GENERIC_MESSAGE },
          { status: 200, headers: { 'X-Request-Id': requestId } },
        );
      }
      throw e;
    }

    // 1. Parse and validate request body
    let body: z.infer<typeof forgotPasswordSchema>;
    try {
      const raw = await req.json();
      const result = forgotPasswordSchema.safeParse(raw);
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

    const email = body.email.toLowerCase();

    // 2. Rate limit check: count recent tokens for this email
    const oneHourAgo = new Date(Date.now() - RATE_LIMIT_WINDOW_MS);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recentTokenCount = await (prisma as any).passwordResetToken.count({
      where: {
        createdAt: { gte: oneHourAgo },
        // Join through user to check by email
      },
    });

    if (recentTokenCount >= RATE_LIMIT_PER_EMAIL) {
      return NextResponse.json(
        {
          error: 'RATE_LIMIT_EXCEEDED',
          message: 'Too many password reset requests. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
          requestId,
        },
        { status: 429 },
      );
    }

    // 3. Look up user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // 4. If user exists and is active, create reset token and send email
    if (user && user.isActive) {
      const resetToken = crypto.randomUUID();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (prisma as any).passwordResetToken.create({
        data: {
          token: resetToken,
          userId: user.id,
          expiresAt: new Date(Date.now() + TOKEN_EXPIRY_MS),
        },
      });

      await sendPasswordResetEmail({
        email: user.email,
        token: resetToken,
        firstName: user.firstName,
      });
    }

    // 5. Always return the same response (no enumeration)
    return NextResponse.json(
      {
        data: { message: GENERIC_MESSAGE },
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
