/**
 * User Management API — Get, Update, Change Status
 * Per PRD 08 Sections 3.1.2 (Status), 3.1.7 (Profile)
 *
 * GET    /api/v1/users/:id — Get user details
 * PATCH  /api/v1/users/:id — Update user profile
 * DELETE /api/v1/users/:id — Soft delete (deactivate)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { updateUserSchema, changeStatusSchema } from '@/schemas/user';
import { guardRoute } from '@/server/middleware/api-guard';

// ---------------------------------------------------------------------------
// GET /api/v1/users/:id
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin', 'property_admin'] });
    if (auth.error) return auth.error;

    const { id } = await params;

    const user = await prisma.user.findUnique({
      where: { id, deletedAt: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        avatarUrl: true,
        mfaEnabled: true,
        isActive: true,
        activatedAt: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
        userProperties: {
          where: { deletedAt: null },
          select: {
            propertyId: true,
            role: {
              select: { id: true, name: true, slug: true, permissions: true },
            },
            property: {
              select: { id: true, name: true },
            },
          },
        },
        loginAudits: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true,
            email: true,
            success: true,
            failReason: true,
            ipAddress: true,
            userAgent: true,
            createdAt: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'User not found' }, { status: 404 });
    }

    const status = !user.activatedAt ? 'pending' : user.isActive ? 'active' : 'suspended';

    return NextResponse.json({
      data: {
        ...user,
        status,
        properties: user.userProperties.map((up) => ({
          propertyId: up.propertyId,
          propertyName: up.property.name,
          role: up.role,
        })),
        recentLogins: user.loginAudits,
      },
    });
  } catch (error) {
    console.error('GET /api/v1/users/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch user' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/v1/users/:id — Update profile or change status
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin', 'property_admin'] });
    if (auth.error) return auth.error;

    const { id } = await params;
    const body = await request.json();

    // Check if this is a status change
    if (body.status) {
      const parsed = changeStatusSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
          { status: 400 },
        );
      }

      const { status } = parsed.data;
      const isActive = status === 'active';

      const user = await prisma.user.update({
        where: { id },
        data: {
          isActive,
          activatedAt: status === 'active' ? new Date() : undefined,
        },
        select: { id: true, firstName: true, lastName: true, isActive: true },
      });

      // Invalidate all sessions if suspending/deactivating
      if (!isActive) {
        await prisma.session.updateMany({
          where: { userId: id, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }

      return NextResponse.json({
        data: user,
        message: `${user.firstName} ${user.lastName} has been ${status}.`,
      });
    }

    // Regular profile update
    const parsed = updateUserSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;
    const updateData: Record<string, unknown> = {};

    if (input.firstName) updateData.firstName = input.firstName;
    if (input.lastName) updateData.lastName = input.lastName;
    if (input.phone !== undefined) updateData.phone = input.phone || null;
    if (input.dateOfBirth !== undefined) updateData.dateOfBirth = input.dateOfBirth || null;

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        isActive: true,
      },
    });

    // Update role if provided
    if (input.roleId) {
      const propertyId = new URL(request.url).searchParams.get('propertyId');
      if (propertyId) {
        await prisma.userProperty.updateMany({
          where: { userId: id, propertyId },
          data: { roleId: input.roleId },
        });
      }
    }

    return NextResponse.json({
      data: user,
      message: 'Profile updated.',
    });
  } catch (error) {
    console.error('PATCH /api/v1/users/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update user' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/v1/users/:id — Soft delete (deactivate)
// ---------------------------------------------------------------------------

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin', 'property_admin'] });
    if (auth.error) return auth.error;

    const { id } = await params;

    await prisma.$transaction(async (tx) => {
      // Soft delete user
      await tx.user.update({
        where: { id },
        data: { deletedAt: new Date(), isActive: false },
      });

      // Revoke all sessions
      await tx.session.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });

      // Revoke all refresh tokens
      await tx.refreshToken.updateMany({
        where: { userId: id, revokedAt: null },
        data: { revokedAt: new Date() },
      });
    });

    return NextResponse.json({ message: 'Account deactivated.' });
  } catch (error) {
    console.error('DELETE /api/v1/users/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to deactivate user' },
      { status: 500 },
    );
  }
}
