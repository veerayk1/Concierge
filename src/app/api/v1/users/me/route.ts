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
        assistanceRequired: true,
        assistanceNotes: true,
        emailSignature: true, // GAP 8.1
        languagePreference: true, // GAP 7.6
      },
    });

    if (!user) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'User not found' }, { status: 404 });
    }

    // Resolve primary occupancy unit so resident-facing flows (vacation,
    // visitor pre-auth, package self-view) don't have to make a second
    // round-trip just to know "which unit am I?".
    const occupancy = await prisma.occupancyRecord.findFirst({
      where: {
        userId: auth.user.userId,
        moveOutDate: null,
      },
      select: { unitId: true, unit: { select: { number: true, propertyId: true } } },
    });

    // Onboarding checklist signals — surface from one call so the
    // resident dashboard doesn't fan out a separate request per field.
    // Skip for non-resident roles; staff don't need a setup card.
    let onboarding: {
      hasPhone: boolean;
      hasAvatar: boolean;
      hasEmergencyContact: boolean;
      hasLanguagePreference: boolean;
      complete: boolean;
    } | null = null;
    if (
      auth.user.role === 'resident_owner' ||
      auth.user.role === 'resident_tenant' ||
      auth.user.role === 'family_member' ||
      auth.user.role === 'offsite_owner'
    ) {
      const emergencyCount = await prisma.emergencyContact.count({
        where: { userId: auth.user.userId },
      });
      const hasPhone = Boolean(user.phone && user.phone.trim().length >= 7);
      const hasAvatar = Boolean(user.avatarUrl);
      const hasEmergencyContact = emergencyCount > 0;
      const hasLanguagePreference = Boolean(user.languagePreference);
      onboarding = {
        hasPhone,
        hasAvatar,
        hasEmergencyContact,
        hasLanguagePreference,
        complete: hasPhone && hasAvatar && hasEmergencyContact && hasLanguagePreference,
      };
    }

    return NextResponse.json({
      data: {
        ...user,
        requiresAssistance: user.assistanceRequired, // GAP 8.2: rename for client
        emailSignature: user.emailSignature ?? null, // GAP 8.1
        languagePreference: user.languagePreference, // GAP 7.6
        occupancyUnitId: occupancy?.unitId ?? null,
        occupancyUnitNumber: occupancy?.unit?.number ?? null,
        propertyId: occupancy?.unit?.propertyId ?? null,
        onboarding,
      },
    });
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
    if (input.requiresAssistance !== undefined)
      updateData.assistanceRequired = input.requiresAssistance; // GAP 8.2
    if (input.assistanceNotes !== undefined)
      updateData.assistanceNotes = input.assistanceNotes || null; // GAP 8.2
    if (input.emailSignature !== undefined)
      updateData.emailSignature = input.emailSignature ?? null; // GAP 8.1
    if (input.languagePreference !== undefined)
      updateData.languagePreference = input.languagePreference; // GAP 7.6

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
        assistanceRequired: true,
        assistanceNotes: true,
        emailSignature: true, // GAP 8.1
        languagePreference: true, // GAP 7.6
      },
    });

    return NextResponse.json({
      data: {
        ...user,
        requiresAssistance: user.assistanceRequired, // GAP 8.2: rename for client
        emailSignature: user.emailSignature ?? null, // GAP 8.1
        languagePreference: user.languagePreference, // GAP 7.6
      },
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

// ---------------------------------------------------------------------------
// DELETE /api/v1/users/me — Account deletion (App Store policy 5.1.1(v))
// ---------------------------------------------------------------------------
//
// Apple requires every app that supports account creation to support
// in-app account deletion. The deletion flow has to be obvious,
// reachable without leaving the app, and complete on the user's
// terms (not "we'll email support to delete this for you").
//
// What we do:
//   - Soft-delete the user (deletedAt = now).
//   - Revoke all refresh tokens so other devices are signed out.
//   - Delete all device push tokens so we stop pushing to a deleted
//     account's phones.
//   - Anonymize PII on a delay (a separate scheduled job will do the
//     30-day hard-purge); for compliance reasons we keep the audit
//     trail (`UserAudit`, `LoginAudit`) so the building can show "this
//     person held a key on Jan 4" even after their account is gone.
//   - Cannot be undone by the resident themselves; their property
//     admin can re-invite them under the same email.
//
// What we do NOT do here:
//   - Hard-delete property data (packages, requests, bookings) — those
//     belong to the property, not the resident, and reference the user
//     for audit. They survive deletion with the resident's name
//     archived in place.
//   - Allow a property_admin to delete themselves via this route. Use
//     /api/v1/users/[id] DELETE for admin-initiated deletions; the
//     in-app self-delete is for residents.

export async function DELETE(request: NextRequest) {
  try {
    const auth = await guardRoute(request, { allowDemo: false });
    if (auth.error) return auth.error;

    const userId = auth.user.userId;

    // Property admins / super admins can't self-delete via the mobile
    // flow — too easy to lock the building out. They need to be
    // deleted by someone with admin authority via /api/v1/users/[id].
    if (
      auth.user.role === 'super_admin' ||
      auth.user.role === 'property_admin' ||
      auth.user.role === 'property_manager'
    ) {
      return NextResponse.json(
        {
          error: 'ADMIN_SELF_DELETE_BLOCKED',
          message:
            'Admin accounts cannot be self-deleted from the app. Ask another admin or super admin to remove this account.',
        },
        { status: 403 },
      );
    }

    const now = new Date();

    await prisma.$transaction(async (tx) => {
      // 1. Soft-delete the user. `deletedAt` blocks subsequent
      //    /api/v1/users/me reads and guardRoute will reject any
      //    further token use against this account.
      await tx.user.update({
        where: { id: userId },
        data: {
          deletedAt: now,
          isActive: false,
          // Strip activation token / lockout state so the row is in
          // a known-clean state for the eventual hard purge.
          activationToken: null,
          lockedUntil: null,
        },
      });

      // 2. Revoke every refresh token — other devices are signed out
      //    the moment they try to refresh.
      await tx.refreshToken.deleteMany({ where: { userId } });

      // 3. Drop push tokens so we stop notifying a deleted account.
      await tx.devicePushToken.deleteMany({ where: { userId } });

      // 4. Audit trail — record WHO initiated this and WHEN. Useful
      //    for support tickets ("did I delete my own account?").
      try {
        await tx.userAudit.create({
          data: {
            userId,
            actorId: userId,
            action: 'deleted',
            detail: { reason: 'self_delete_via_mobile' },
          },
        });
      } catch {
        // If the audit table is unavailable, don't block the delete —
        // the deletion is the protection the user actually wanted.
      }
    });

    return NextResponse.json({
      data: {
        deletedAt: now.toISOString(),
        message:
          'Your account has been deleted. We will purge your remaining personal data within 30 days per privacy policy.',
      },
    });
  } catch (error) {
    console.error('DELETE /api/v1/users/me error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to delete account' },
      { status: 500 },
    );
  }
}
