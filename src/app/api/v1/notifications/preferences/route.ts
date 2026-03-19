/**
 * Notification Preferences API — per PRD 08 Section 3.1.8
 * User can configure which notifications they receive per channel
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';

const preferenceItemSchema = z.object({
  module: z.string(),
  channel: z.enum(['email', 'sms', 'push']),
  enabled: z.boolean(),
  digestMode: z.enum(['instant', 'daily', 'weekly']).optional(),
  digestTime: z.string().nullable().optional(),
  dndEnabled: z.boolean().optional(),
  dndStart: z.string().nullable().optional(),
  dndEnd: z.string().nullable().optional(),
});

const updatePreferencesSchema = z.object({
  preferences: z.array(preferenceItemSchema),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { userId, propertyId } = auth.user;

    const preferences = await prisma.notificationPreference.findMany({
      where: { userId, propertyId },
      orderBy: [{ module: 'asc' }, { channel: 'asc' }],
    });

    // If no preferences exist, return sensible defaults per PRD 08 Section 3.1.8
    if (preferences.length === 0) {
      const defaultModules = [
        'packages',
        'maintenance',
        'amenities',
        'announcements',
        'security',
        'events',
        'visitors',
        'community',
        'billing',
        'system',
      ];
      const defaultChannels = ['email', 'sms', 'push'] as const;
      const defaults = defaultModules.flatMap((module) =>
        defaultChannels.map((channel) => ({
          id: null,
          userId,
          propertyId,
          module,
          channel,
          enabled: channel === 'email', // email on by default, sms/push off
          digestMode: 'instant',
          digestTime: null,
          dndEnabled: false,
          dndStart: null,
          dndEnd: null,
        })),
      );
      return NextResponse.json({ data: defaults });
    }

    return NextResponse.json({ data: preferences });
  } catch (error) {
    console.error('GET /api/v1/notifications/preferences error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch preferences' },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
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
            digestTime: pref.digestTime ? new Date(`1970-01-01T${pref.digestTime}`) : null,
            dndEnabled: pref.dndEnabled ?? false,
            dndStart: pref.dndStart ? new Date(`1970-01-01T${pref.dndStart}`) : null,
            dndEnd: pref.dndEnd ? new Date(`1970-01-01T${pref.dndEnd}`) : null,
          },
          update: {
            enabled: pref.enabled,
            ...(pref.digestMode !== undefined && { digestMode: pref.digestMode }),
            ...(pref.digestTime !== undefined && {
              digestTime: pref.digestTime ? new Date(`1970-01-01T${pref.digestTime}`) : null,
            }),
            ...(pref.dndEnabled !== undefined && { dndEnabled: pref.dndEnabled }),
            ...(pref.dndStart !== undefined && {
              dndStart: pref.dndStart ? new Date(`1970-01-01T${pref.dndStart}`) : null,
            }),
            ...(pref.dndEnd !== undefined && {
              dndEnd: pref.dndEnd ? new Date(`1970-01-01T${pref.dndEnd}`) : null,
            }),
          },
        }),
      ),
    );

    return NextResponse.json({ data: results, message: 'Preferences updated.' });
  } catch (error) {
    console.error('PUT /api/v1/notifications/preferences error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update preferences' },
      { status: 500 },
    );
  }
}
