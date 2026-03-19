/**
 * Current User API — Self-service profile read & update
 *
 * GET   /api/v1/users/me — Get the authenticated user's profile
 * PATCH /api/v1/users/me — Update own profile (firstName, lastName, phone)
 *
 * Does NOT allow changing email (requires verification flow) or role.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { updateMyProfileSchema } from '@/schemas/user';
import { guardRoute } from '@/server/middleware/api-guard';

// ---------------------------------------------------------------------------
// GET /api/v1/users/me
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const user = await prisma.user.findUnique({
      where: { id: auth.user.userId, deletedAt: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        mfaEnabled: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'User not found' }, { status: 404 });
    }

    return NextResponse.json({ data: user });
  } catch (error) {
    console.error('GET /api/v1/users/me error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch profile' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/v1/users/me — Self-update profile
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const body = await request.json();

    const parsed = updateMyProfileSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;
    const updateData: Record<string, unknown> = {};

    if (input.firstName !== undefined) updateData.firstName = input.firstName;
    if (input.lastName !== undefined) updateData.lastName = input.lastName;
    if (input.phone !== undefined) updateData.phone = input.phone || null;

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'No fields to update' },
        { status: 400 },
      );
    }

    const user = await prisma.user.update({
      where: { id: auth.user.userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        mfaEnabled: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({
      data: user,
      message: 'Profile updated.',
    });
  } catch (error) {
    console.error('PATCH /api/v1/users/me error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update profile' },
      { status: 500 },
    );
  }
}
