/**
 * POST /api/auth/activate
 *
 * Public endpoint — activates a new user account by setting their password.
 * The activation token is sent via welcome email when an admin creates a user.
 *
 * Flow: Admin creates user → welcome email with /activate?token=xxx →
 *       user sets password → account activated → redirect to login
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/server/db';
import { hashPassword, checkPasswordPolicy } from '@/server/auth/password';
import { createLogger } from '@/server/logger';

const logger = createLogger('auth:activate');

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const ActivateSchema = z.object({
  token: z.string().min(1, 'Activation token is required'),
  password: z.string().min(1, 'Password is required'),
});

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest) {
  const requestId = req.headers.get('x-request-id') || crypto.randomUUID();

  try {
    const body = await req.json();
    const parsed = ActivateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: parsed.error.flatten().fieldErrors,
          requestId,
        },
        { status: 400 },
      );
    }

    const { token, password } = parsed.data;

    // 1. Find user by activation token
    const user = await prisma.user.findFirst({
      where: {
        activationToken: token,
        deletedAt: null,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        activationToken: true,
        activationTokenExpiresAt: true,
        activatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          error: 'INVALID_TOKEN',
          message: 'This activation link is invalid or has already been used.',
          requestId,
        },
        { status: 400 },
      );
    }

    // 2. Check if already activated
    if (user.activatedAt) {
      return NextResponse.json(
        {
          error: 'ALREADY_ACTIVATED',
          message: 'This account has already been activated. Please sign in.',
          requestId,
        },
        { status: 400 },
      );
    }

    // 3. Check token expiry (72 hours)
    if (user.activationTokenExpiresAt && new Date() > user.activationTokenExpiresAt) {
      return NextResponse.json(
        {
          error: 'TOKEN_EXPIRED',
          message:
            'This activation link has expired. Please contact your property administrator to resend the welcome email.',
          requestId,
        },
        { status: 400 },
      );
    }

    // 4. Validate password against policy
    const policyViolations = checkPasswordPolicy(password);
    if (policyViolations.length > 0) {
      return NextResponse.json(
        {
          error: 'POLICY_VIOLATION',
          message: 'Password does not meet requirements',
          details: { password: policyViolations },
          requestId,
        },
        { status: 400 },
      );
    }

    // 5. Hash password and activate account
    const passwordHash = await hashPassword(password);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        activatedAt: new Date(),
        activationToken: null, // Clear token so it can't be reused
        activationTokenExpiresAt: null,
        isActive: true,
      },
    });

    // 6. Store in password history
    await prisma.passwordHistory
      .create({
        data: {
          userId: user.id,
          passwordHash,
        },
      })
      .catch(() => {
        // Non-critical — don't fail activation if history write fails
      });

    logger.info({ userId: user.id, email: user.email }, 'Account activated successfully');

    return NextResponse.json({
      message: 'Account activated successfully. You can now sign in.',
      data: {
        email: user.email,
        firstName: user.firstName,
      },
      requestId,
    });
  } catch (err) {
    logger.error({ err }, 'Account activation failed');
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred. Please try again.',
        requestId,
      },
      { status: 500 },
    );
  }
}
