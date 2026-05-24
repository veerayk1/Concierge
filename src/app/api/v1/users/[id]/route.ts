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
import { isUuid } from '@/lib/uuid';

function badIdResponse() {
  return NextResponse.json(
    { error: 'VALIDATION_ERROR', message: 'User id must be a UUID.' },
    { status: 400 },
  );
}

// ---------------------------------------------------------------------------
// GET /api/v1/users/:id
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin', 'property_admin'] });
    if (auth.error) return auth.error;

    const { id } = await params;
    if (!isUuid(id)) return badIdResponse();

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
        userAuditsAsTarget: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          select: {
            id: true,
            action: true,
            detail: true,
            createdAt: true,
            actor: { select: { firstName: true, lastName: true, email: true } },
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'User not found' }, { status: 404 });
    }

    // Cross-tenant guard. A property_admin at A may only view users who
    // have at least one active userProperty at A. super_admin sees all.
    // Without this, a property_admin could enumerate every user (login
    // history, audits, IP addresses) of every property by guessing UUIDs.
    if (auth.user.role !== 'super_admin') {
      const sharesProperty = user.userProperties.some(
        (up) => up.propertyId === auth.user.propertyId,
      );
      if (!sharesProperty) {
        return NextResponse.json(
          { error: 'NOT_FOUND', message: 'User not found' },
          { status: 404 },
        );
      }
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
        // Per-user audit events (role / status / profile changes) surfaced
        // alongside login audits in the Activity tab.
        recentAudits: user.userAuditsAsTarget.map((a) => ({
          id: a.id,
          action: a.action,
          detail: a.detail,
          createdAt: a.createdAt,
          actorName: a.actor
            ? `${a.actor.firstName ?? ''} ${a.actor.lastName ?? ''}`.trim() || a.actor.email
            : null,
        })),
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
    if (!isUuid(id)) return badIdResponse();
    const body = await request.json();

    // Cross-tenant guard hoisted to top of PATCH. A property_admin at A
    // must not be able to mutate (suspend, edit profile, reassign role)
    // a user who has no membership at A. Without this, status changes
    // are globally destructive — A could deactivate every user at B.
    if (auth.user.role !== 'super_admin') {
      const target = await prisma.user.findUnique({
        where: { id, deletedAt: null },
        select: {
          userProperties: { where: { deletedAt: null }, select: { propertyId: true } },
        },
      });
      if (!target) {
        return NextResponse.json(
          { error: 'NOT_FOUND', message: 'User not found' },
          { status: 404 },
        );
      }
      const sharesProperty = target.userProperties.some(
        (up) => up.propertyId === auth.user.propertyId,
      );
      if (!sharesProperty) {
        return NextResponse.json(
          { error: 'NOT_FOUND', message: 'User not found' },
          { status: 404 },
        );
      }
    }

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

      // Read prior state for audit detail
      const prior = await prisma.user.findUnique({
        where: { id },
        select: { isActive: true },
      });

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

      // Record the status change in user_audits so the admin Activity
      // tab can surface it for compliance / forensics.
      await prisma.userAudit
        .create({
          data: {
            userId: id,
            actorId: auth.user.userId,
            action: 'status_changed',
            detail: {
              from: prior?.isActive === false ? 'suspended' : 'active',
              to: status,
            },
          },
        })
        .catch((err) => console.error('user_audit insert (status) failed:', err));

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
    // GAP 8.2: assistanceRequired flag for emergency reports
    if (typeof input.requireAssistance === 'boolean')
      updateData.assistanceRequired = input.requireAssistance;
    // GAP 7.6: Language preference per user
    if (input.languagePreference) updateData.languagePreference = input.languagePreference;
    // GAP 8.1: Email signature editor
    if (input.emailSignature !== undefined) updateData.emailSignature = input.emailSignature;

    // Snapshot prior values for audit detail
    const priorProfile = await prisma.user.findUnique({
      where: { id },
      select: { firstName: true, lastName: true, phone: true },
    });

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

    // Update role if provided.
    //
    // CRITICAL: validate that the role belongs to the property whose
    // membership we're updating. Without this, an admin at property A
    // could PATCH ?propertyId=A&roleId=<role-from-property-B> and that
    // user's userProperty row for property A would point at a role
    // owned by property B — bypassing tenancy entirely and potentially
    // granting them admin or super_admin permissions on B's data.
    let priorRoleSlug: string | null = null;
    let newRoleSlug: string | null = null;
    if (input.roleId) {
      const propertyId = new URL(request.url).searchParams.get('propertyId');
      if (propertyId) {
        const newRole = await prisma.role.findUnique({
          where: { id: input.roleId },
          select: { slug: true, propertyId: true },
        });
        if (!newRole) {
          return NextResponse.json(
            { error: 'INVALID_ROLE', message: 'Role does not exist.' },
            { status: 400 },
          );
        }
        if (newRole.propertyId !== propertyId) {
          return NextResponse.json(
            {
              error: 'INVALID_ROLE',
              message: 'Role does not belong to this property.',
            },
            { status: 400 },
          );
        }
        const priorMembership = await prisma.userProperty.findFirst({
          where: { userId: id, propertyId },
          select: { role: { select: { slug: true } } },
        });
        priorRoleSlug = priorMembership?.role?.slug ?? null;
        await prisma.userProperty.updateMany({
          where: { userId: id, propertyId },
          data: { roleId: input.roleId },
        });
        newRoleSlug = newRole.slug;
      }
    }

    // Record profile fields that actually changed.
    const changedFields: Record<string, { from: unknown; to: unknown }> = {};
    if (priorProfile) {
      if (input.firstName && priorProfile.firstName !== input.firstName)
        changedFields.firstName = { from: priorProfile.firstName, to: input.firstName };
      if (input.lastName && priorProfile.lastName !== input.lastName)
        changedFields.lastName = { from: priorProfile.lastName, to: input.lastName };
      if (input.phone !== undefined && priorProfile.phone !== input.phone)
        changedFields.phone = { from: priorProfile.phone, to: input.phone };
    }
    if (Object.keys(changedFields).length > 0) {
      await prisma.userAudit
        .create({
          data: {
            userId: id,
            actorId: auth.user.userId,
            action: 'profile_updated',
            detail: changedFields as unknown as object,
          },
        })
        .catch((err) => console.error('user_audit insert (profile) failed:', err));
    }

    if (priorRoleSlug !== null && newRoleSlug !== null && priorRoleSlug !== newRoleSlug) {
      await prisma.userAudit
        .create({
          data: {
            userId: id,
            actorId: auth.user.userId,
            action: 'role_changed',
            detail: { from: priorRoleSlug, to: newRoleSlug },
          },
        })
        .catch((err) => console.error('user_audit insert (role) failed:', err));
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
    if (!isUuid(id)) return badIdResponse();

    // Same tenant guard as PATCH — never let a property_admin at A delete
    // a user who only has memberships at B.
    if (auth.user.role !== 'super_admin') {
      const target = await prisma.user.findUnique({
        where: { id, deletedAt: null },
        select: {
          userProperties: { where: { deletedAt: null }, select: { propertyId: true } },
        },
      });
      if (!target) {
        return NextResponse.json(
          { error: 'NOT_FOUND', message: 'User not found' },
          { status: 404 },
        );
      }
      const sharesProperty = target.userProperties.some(
        (up) => up.propertyId === auth.user.propertyId,
      );
      if (!sharesProperty) {
        return NextResponse.json(
          { error: 'NOT_FOUND', message: 'User not found' },
          { status: 404 },
        );
      }
    }

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
