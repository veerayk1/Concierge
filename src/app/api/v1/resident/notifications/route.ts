/**
 * Resident Self-Service — Notifications
 *
 * GET   /api/v1/resident/notifications — View own notification preferences
 * PATCH /api/v1/resident/notifications — Update own notification preferences
 *
 * Per PRD 08, residents can configure per-module, per-channel preferences.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';
import type { Role } from '@/types';

const RESIDENT_ROLES: Role[] = ['resident_owner', 'resident_tenant'];

const preferenceItemSchema = z.object({
  module: z.string().min(1),
  channel: z.enum(['email', 'sms', 'push']),
  enabled: z.boolean(),
  digestMode: z.enum(['instant', 'daily', 'weekly']).optional(),
});

const updatePreferencesSchema = z.object({
  preferences: z.array(preferenceItemSchema).min(1, 'At least one preference is required'),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request, { roles: RESIDENT_ROLES });
    if (auth.error) return auth.error;

    const { userId, propertyId } = auth.user;

    const preferences = await prisma.notificationPreference.findMany({
      where: { userId, propertyId },
      orderBy: [{ module: 'asc' }, { channel: 'asc' }],
    });

    return NextResponse.json({ data: preferences });
  } catch (error) {
    console.error('GET /api/v1/resident/notifications error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch notifications' },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await guardRoute(request, { roles: RESIDENT_ROLES });
    if (auth.error) return auth.error;

    const { userId, propertyId } = auth.user;

    const body = await request.json();
    const parsed = updatePreferencesSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const results = await Promise.all(
      parsed.data.preferences.map((pref) =>
        prisma.notificationPreference.upsert({
          where: {
            userId_propertyId_module_channel: {
              userId,
              propertyId,
              module: pref.module,
              channel: pref.channel,
            },
          },
          create: {
            userId,
            propertyId,
            module: pref.module,
            channel: pref.channel,
            enabled: pref.enabled,
            digestMode: pref.digestMode ?? 'instant',
          },
          update: {
            enabled: pref.enabled,
            ...(pref.digestMode !== undefined && { digestMode: pref.digestMode }),
          },
        }),
      ),
    );

    return NextResponse.json({ data: results, message: 'Preferences updated.' });
  } catch (error) {
    console.error('PATCH /api/v1/resident/notifications error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update preferences' },
      { status: 500 },
    );
  }
}
