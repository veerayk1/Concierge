/**
 * Emergency Broadcast API — List & Create
 * Phase 2: Push + SMS + voice cascade for critical alerts
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';

const BROADCAST_CHANNELS = ['push', 'sms', 'email', 'voice', 'lobby_display'] as const;
const BROADCAST_TARGETS = ['all', 'specific_floors', 'specific_units', 'staff_only'] as const;

const createBroadcastSchema = z.object({
  propertyId: z.string().uuid(),
  title: z.string().min(1, 'Title is required').max(200),
  body: z
    .string()
    .min(10, 'Message must be at least 10 characters')
    .max(2000, 'Message must be at most 2000 characters'),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
  channels: z.array(z.enum(BROADCAST_CHANNELS)).min(1, 'At least one channel is required'),
  targetAudience: z.enum(BROADCAST_TARGETS).default('all'),
  targetFloors: z.array(z.number().int()).optional(),
  targetUnitIds: z.array(z.string().uuid()).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    const where: Record<string, unknown> = { propertyId, deletedAt: null };

    const [broadcasts, total] = await Promise.all([
      prisma.emergencyBroadcast.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.emergencyBroadcast.count({ where }),
    ]);

    return NextResponse.json({
      data: broadcasts,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch {
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch emergency broadcasts' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request, { roles: ['property_admin', 'security_guard'] });
    if (auth.error) return auth.error;

    const rawBody = await request.json();
    const parsed = createBroadcastSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;

    // Validate target-specific fields
    if (
      input.targetAudience === 'specific_floors' &&
      (!input.targetFloors || input.targetFloors.length === 0)
    ) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'targetFloors required when targetAudience is specific_floors',
        },
        { status: 400 },
      );
    }
    if (
      input.targetAudience === 'specific_units' &&
      (!input.targetUnitIds || input.targetUnitIds.length === 0)
    ) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'targetUnitIds required when targetAudience is specific_units',
        },
        { status: 400 },
      );
    }

    // Get targeted users based on audience
    const userPropertyWhere: Record<string, unknown> = {
      propertyId: input.propertyId,
      deletedAt: null,
    };

    if (input.targetAudience === 'staff_only') {
      userPropertyWhere.role = {
        in: ['property_admin', 'front_desk', 'security_guard', 'maintenance_staff'],
      };
    }

    const userProperties = await prisma.userProperty.findMany({
      where: userPropertyWhere,
      select: { userId: true },
    });

    const totalTargeted = userProperties.length;
    const hasPush = input.channels.includes('push');

    const broadcast = await prisma.emergencyBroadcast.create({
      data: {
        propertyId: input.propertyId,
        title: stripControlChars(stripHtml(input.title)),
        body: stripControlChars(stripHtml(input.body)),
        severity: input.severity,
        status: 'active',
        totalTargeted,
        pushSent: hasPush ? totalTargeted : 0,
        smsSent: 0,
        voiceSent: 0,
        acknowledgedCount: 0,
        cascadeStatus: hasPush
          ? 'push_phase'
          : input.channels.includes('sms')
            ? 'sms_phase'
            : 'voice_phase',
        cascadeConfig: {
          channels: input.channels,
          targetAudience: input.targetAudience,
          targetFloors: input.targetFloors ?? [],
          targetUnitIds: input.targetUnitIds ?? [],
          sms_delay_minutes: 2,
          voice_delay_minutes: 5,
        },
        initiatedById: auth.user.userId,
      },
    });

    return NextResponse.json(
      { data: broadcast, message: 'Emergency broadcast initiated.' },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create emergency broadcast' },
      { status: 500 },
    );
  }
}
