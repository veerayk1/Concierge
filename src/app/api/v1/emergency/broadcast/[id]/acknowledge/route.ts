/**
 * Emergency Broadcast Acknowledge API — POST acknowledgment
 * Phase 2: Resident confirms receipt of emergency broadcast
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;

    // Verify broadcast exists
    const broadcast = await prisma.emergencyBroadcast.findUnique({
      where: { id },
      select: { id: true, propertyId: true, status: true },
    });

    if (!broadcast) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Emergency broadcast not found' },
        { status: 404 },
      );
    }

    // Check if already acknowledged by this user
    const existing = await prisma.emergencyBroadcastAcknowledgment.findUnique({
      where: {
        broadcastId_userId: {
          broadcastId: id,
          userId: auth.user.userId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'ALREADY_ACKNOWLEDGED', message: 'You have already acknowledged this broadcast' },
        { status: 409 },
      );
    }

    // Parse request body for channel info
    const body = await request.json();
    const channel = body.channel || 'push';

    const acknowledgment = await prisma.emergencyBroadcastAcknowledgment.create({
      data: {
        broadcastId: id,
        userId: auth.user.userId,
        channel,
      },
    });

    // Increment acknowledgedCount on the broadcast
    await prisma.emergencyBroadcast.update({
      where: { id },
      data: {
        acknowledgedCount: { increment: 1 },
      },
    });

    return NextResponse.json(
      {
        data: {
          id: acknowledgment.id,
          broadcastId: acknowledgment.broadcastId,
          userId: acknowledgment.userId,
          channel: acknowledgment.channel,
          acknowledgedAt: acknowledgment.acknowledgedAt,
        },
      },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to acknowledge broadcast' },
      { status: 500 },
    );
  }
}
