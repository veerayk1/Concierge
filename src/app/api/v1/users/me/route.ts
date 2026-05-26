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
