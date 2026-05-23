/**
 * Emergency Broadcast Acknowledge API — POST acknowledgment
 * Phase 2: Resident confirms receipt of emergency broadcast
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute, enforcePropertyAccess } from '@/server/middleware/api-guard';
import { isUuid } from '@/lib/uuid';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    if (!isUuid(id)) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Invalid broadcast id.' },
        { status: 400 },
      );
    }

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

    // A resident at Property A should not be able to acknowledge — and
    // thereby inflate the acknowledgedCount of — Property B's broadcast.
    const tenancy = enforcePropertyAccess(auth.user, broadcast.propertyId);
    if (tenancy) return tenancy;

    // Parse request body for channel info
    const body = await request.json();
    const channel = body.channel || 'push';

    // Atomic acknowledgment: rely on the (broadcastId, userId) unique
    // constraint to gate one ack per user. Without this — and previously
    // — a double-clicked Acknowledge button would race the findUnique
    // check, pass both times, then increment acknowledgedCount twice for
    // a single human action. In an emergency that inflates the "X% of
    // residents are safe" metric and gives Security a false read.
    let acknowledgment;
    try {
      acknowledgment = await prisma.emergencyBroadcastAcknowledgment.create({
        data: {
          broadcastId: id,
          userId: auth.user.userId,
          channel,
        },
      });
    } catch (e) {
      const err = e as { code?: string };
      if (err.code === 'P2002') {
        // Unique violation — same user already acknowledged. Do NOT
        // increment acknowledgedCount; the original ack already counted.
        return NextResponse.json(
          {
            error: 'ALREADY_ACKNOWLEDGED',
            message: 'You have already acknowledged this broadcast',
          },
          { status: 409 },
        );
      }
      throw e;
    }

    // Increment acknowledgedCount on the broadcast — fires exactly once
    // per user because the create above is the gate. Late callers from
    // the same user hit P2002 above and never reach this line.
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
  } catch (error) {
    console.error('POST /api/v1/emergency/broadcast/:id/acknowledge error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to acknowledge broadcast' },
      { status: 500 },
    );
  }
}
