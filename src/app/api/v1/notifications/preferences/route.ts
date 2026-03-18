/**
 * Notification Preferences API — per PRD 08 Section 3.1.8
 * User can configure which notifications they receive per channel
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';

const updatePreferencesSchema = z.object({
  userId: z.string().uuid(),
  preferences: z.array(
    z.object({
      module: z.string(),
      notificationType: z.string(),
      email: z.boolean(),
      sms: z.boolean(),
      push: z.boolean(),
    }),
  ),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const userId = new URL(request.url).searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'MISSING_USER', message: 'userId is required' },
        { status: 400 },
      );
    }

    // Return default preferences structure per PRD 08 Section 3.1.8
    // In production, these would be stored in a NotificationPreference table
    const defaults = [
      {
        module: 'Packages',
        notificationType: 'Package received',
        email: true,
        sms: false,
        push: true,
      },
      {
        module: 'Packages',
        notificationType: 'Package unclaimed reminder',
        email: true,
        sms: false,
        push: false,
      },
      {
        module: 'Maintenance',
        notificationType: 'Request status update',
        email: true,
        sms: false,
        push: true,
      },
      {
        module: 'Maintenance',
        notificationType: 'Request assigned',
        email: true,
        sms: false,
        push: true,
      },
      {
        module: 'Amenities',
        notificationType: 'Booking confirmed',
        email: true,
        sms: false,
        push: true,
      },
      {
        module: 'Amenities',
        notificationType: 'Booking cancelled',
        email: true,
        sms: false,
        push: false,
      },
      {
        module: 'Amenities',
        notificationType: 'Booking reminder (24h)',
        email: true,
        sms: false,
        push: true,
      },
      {
        module: 'Announcements',
        notificationType: 'New announcement',
        email: true,
        sms: false,
        push: true,
      },
      {
        module: 'Events',
        notificationType: 'New event posted',
        email: true,
        sms: false,
        push: false,
      },
      {
        module: 'Security',
        notificationType: 'Visitor signed in',
        email: true,
        sms: false,
        push: true,
      },
      {
        module: 'Community',
        notificationType: 'Reply to classified ad',
        email: true,
        sms: false,
        push: false,
      },
      {
        module: 'Account',
        notificationType: 'Login from new device',
        email: true,
        sms: true,
        push: false,
      },
      {
        module: 'Account',
        notificationType: 'Password changed',
        email: true,
        sms: true,
        push: false,
      },
    ];

    return NextResponse.json({ data: defaults });
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

    const body = await request.json();
    const parsed = updatePreferencesSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    // TODO: Store preferences in database
    // For now, just acknowledge the update
    return NextResponse.json({ message: 'Preferences updated.' });
  } catch (error) {
    console.error('PUT /api/v1/notifications/preferences error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update preferences' },
      { status: 500 },
    );
  }
}
