/**
 * Emergency Broadcast API — List & Create
 * Phase 2: Push + SMS + voice cascade for critical alerts
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';

const createBroadcastSchema = z.object({
  propertyId: z.string().uuid(),
  title: z.string().min(1, 'Title is required').max(200),
  body: z.string().min(1, 'Body is required').max(10000),
  severity: z.enum(['low', 'medium', 'high', 'critical']),
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

    // Get all active users in the property for targeting
    const userProperties = await prisma.userProperty.findMany({
      where: { propertyId: input.propertyId, deletedAt: null },
      select: { userId: true },
    });

    const totalTargeted = userProperties.length;

    const broadcast = await prisma.emergencyBroadcast.create({
      data: {
        propertyId: input.propertyId,
        title: stripControlChars(stripHtml(input.title)),
        body: stripControlChars(stripHtml(input.body)),
        severity: input.severity,
        status: 'sending',
        totalTargeted,
        pushSent: totalTargeted, // Push is sent immediately to all targets
        smsSent: 0,
        voiceSent: 0,
        acknowledgedCount: 0,
        cascadeStatus: 'push_phase',
        cascadeConfig: {
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
