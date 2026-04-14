/**
 * POST /api/v1/users/me/change-password
 *
 * Authenticated endpoint — allows users to change their own password.
 * Requires the current password for verification.
 *
 * Stores old password hash in PasswordHistory for breach-check (A.3.3).
 * Validates new password against policy rules (A.3).
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';
import { hashPassword, verifyPassword, checkPasswordPolicy } from '@/server/auth/password';
import { createLogger } from '@/server/logger';

const logger = createLogger('api:change-password');

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(1, 'New password is required'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'New password must be different from current password',
    path: ['newPassword'],
  });

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const body = await request.json();
    const parsed = ChangePasswordSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'Validation failed',
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { currentPassword, newPassword } = parsed.data;

    // 1. Fetch user with current password hash
    const user = await prisma.user.findUnique({
      where: { id: auth.user.userId, deletedAt: null },
      select: { id: true, passwordHash: true, email: true },
    });

    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'User not found' }, { status: 404 });
    }

    // 2. Verify current password
    const { valid } = await verifyPassword(currentPassword, user.passwordHash);
    if (!valid) {
      return NextResponse.json(
        {
          error: 'INVALID_PASSWORD',
          message: 'Current password is incorrect',
          details: { currentPassword: ['Current password is incorrect'] },
        },
        { status: 400 },
      );
    }

    // 3. Validate new password against policy (A.3)
    const policyViolations = checkPasswordPolicy(newPassword);
    if (policyViolations.length > 0) {
      return NextResponse.json(
        {
          error: 'POLICY_VIOLATION',
          message: 'Password does not meet requirements',
          details: { newPassword: policyViolations },
        },
        { status: 400 },
      );
    }

    // 4. Check against password history (A.3.3 — last 12 passwords)
    const passwordHistory = await prisma.passwordHistory.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 12,
      select: { passwordHash: true },
    });

    for (const entry of passwordHistory) {
      const { valid: isReused } = await verifyPassword(newPassword, entry.passwordHash);
      if (isReused) {
        return NextResponse.json(
          {
            error: 'PASSWORD_REUSED',
            message: 'This password has been used recently. Please choose a different one.',
            details: { newPassword: ['This password has been used recently'] },
          },
          { status: 400 },
        );
      }
    }

    // 5. Hash new password and update
    const newHash = await hashPassword(newPassword);

    await prisma.$transaction([
      // Store old password in history
      prisma.passwordHistory.create({
        data: {
          userId: user.id,
          passwordHash: user.passwordHash,
        },
      }),
      // Update user's password
      prisma.user.update({
        where: { id: user.id },
        data: { passwordHash: newHash },
      }),
    ]);

    logger.info({ userId: user.id }, 'Password changed successfully');

    return NextResponse.json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (err) {
    logger.error({ err }, 'Failed to change password');
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'An unexpected error occurred' },
      { status: 500 },
    );
  }
}
