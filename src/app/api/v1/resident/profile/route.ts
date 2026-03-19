/**
 * Resident Self-Service — Profile
 *
 * GET   /api/v1/resident/profile — View own profile
 * PATCH /api/v1/resident/profile — Update name and phone only
 *
 * Email changes are NOT allowed through this endpoint — they require
 * a verification flow (per Condo Control insight: no self-service email change
 * without confirmation).
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';
import type { Role } from '@/types';

const RESIDENT_ROLES: Role[] = ['resident_owner', 'resident_tenant'];

const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(100).optional(),
  lastName: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).optional().or(z.literal('')),
  email: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request, { roles: RESIDENT_ROLES });
    if (auth.error) return auth.error;

    const { userId } = auth.user;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        avatarUrl: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Profile not found.' },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: user });
  } catch (error) {
    console.error('GET /api/v1/resident/profile error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch profile' },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await guardRoute(request, { roles: RESIDENT_ROLES });
    if (auth.error) return auth.error;

    const { userId } = auth.user;

    const body = await request.json();
    const parsed = updateProfileSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    // Block email changes — requires verification flow
    if (parsed.data.email !== undefined) {
      return NextResponse.json(
        {
          error: 'EMAIL_CHANGE_NOT_ALLOWED',
          message: 'Email changes require a verification flow. Use the email change endpoint.',
        },
        { status: 400 },
      );
    }

    const updateData: Record<string, unknown> = {};

    if (parsed.data.firstName !== undefined) {
      updateData.firstName = stripControlChars(stripHtml(parsed.data.firstName));
    }
    if (parsed.data.lastName !== undefined) {
      updateData.lastName = stripControlChars(stripHtml(parsed.data.lastName));
    }
    if (parsed.data.phone !== undefined) {
      updateData.phone = parsed.data.phone || null;
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'No valid fields to update.' },
        { status: 400 },
      );
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        avatarUrl: true,
      },
    });

    return NextResponse.json({ data: updated, message: 'Profile updated.' });
  } catch (error) {
    console.error('PATCH /api/v1/resident/profile error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update profile' },
      { status: 500 },
    );
  }
}
