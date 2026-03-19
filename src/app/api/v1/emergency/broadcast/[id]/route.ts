/**
 * Emergency Broadcast Detail API — GET single broadcast with stats
 * Phase 2: Push + SMS + voice cascade for critical alerts
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;

    const broadcast = await prisma.emergencyBroadcast.findUnique({
      where: { id },
      include: {
        acknowledgments: {
          select: {
            id: true,
            userId: true,
            channel: true,
            acknowledgedAt: true,
          },
          orderBy: { acknowledgedAt: 'asc' },
        },
      },
    });

    if (!broadcast) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Emergency broadcast not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      data: {
        id: broadcast.id,
        propertyId: broadcast.propertyId,
        title: broadcast.title,
        body: broadcast.body,
        severity: broadcast.severity,
        status: broadcast.status,
        cascadeStatus: broadcast.cascadeStatus,
        startedAt: broadcast.startedAt,
        completedAt: broadcast.completedAt,
        cancelledAt: broadcast.cancelledAt,
        allClearAt: broadcast.allClearAt,
        allClearMessage: broadcast.allClearMessage,
        initiatedById: broadcast.initiatedById,
        createdAt: broadcast.createdAt,
        stats: {
          total_targeted: broadcast.totalTargeted,
          push_sent: broadcast.pushSent,
          sms_sent: broadcast.smsSent,
          voice_sent: broadcast.voiceSent,
          acknowledged: broadcast.acknowledgedCount,
        },
        acknowledgments: broadcast.acknowledgments,
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch emergency broadcast' },
      { status: 500 },
    );
  }
}
