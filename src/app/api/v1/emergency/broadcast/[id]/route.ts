/**
 * Emergency Broadcast Detail API — GET single broadcast with stats
 * Phase 2: Push + SMS + voice cascade for critical alerts
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';

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

// ---------------------------------------------------------------------------
// PATCH — Send all-clear follow-up OR cancel broadcast (within 30s)
// ---------------------------------------------------------------------------

const patchSchema = z.object({
  action: z.enum(['all_clear', 'cancel']),
  message: z.string().max(2000).optional(),
});

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request, { roles: ['property_admin', 'security_guard'] });
    if (auth.error) return auth.error;

    const { id } = await params;
    const rawBody = await request.json();
    const parsed = patchSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { action, message } = parsed.data;

    const broadcast = await prisma.emergencyBroadcast.findUnique({
      where: { id },
      select: { id: true, propertyId: true, status: true, createdAt: true },
    });

    if (!broadcast) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Emergency broadcast not found' },
        { status: 404 },
      );
    }

    if (broadcast.status === 'cancelled') {
      return NextResponse.json(
        { error: 'ALREADY_CANCELLED', message: 'Broadcast is already cancelled' },
        { status: 400 },
      );
    }

    if (action === 'cancel') {
      // Cancel is only allowed within 30 seconds of creation
      const elapsedMs = Date.now() - broadcast.createdAt.getTime();
      if (elapsedMs > 30_000) {
        return NextResponse.json(
          {
            error: 'CANCEL_WINDOW_EXPIRED',
            message:
              'Broadcast can only be cancelled within 30 seconds of creation. Use all_clear instead.',
          },
          { status: 400 },
        );
      }

      const updated = await prisma.emergencyBroadcast.update({
        where: { id },
        data: {
          status: 'cancelled',
          cancelledAt: new Date(),
          cancelledById: auth.user.userId,
        },
      });

      return NextResponse.json({
        data: updated,
        message: 'Emergency broadcast cancelled.',
      });
    }

    // action === 'all_clear'
    if (broadcast.status === 'all_clear') {
      return NextResponse.json(
        { error: 'ALREADY_CLEARED', message: 'All-clear has already been sent for this broadcast' },
        { status: 400 },
      );
    }

    const sanitizedMessage = message ? stripControlChars(stripHtml(message)) : '';

    const updated = await prisma.emergencyBroadcast.update({
      where: { id },
      data: {
        status: 'all_clear',
        allClearAt: new Date(),
        allClearById: auth.user.userId,
        allClearMessage: sanitizedMessage,
      },
    });

    return NextResponse.json({
      data: updated,
      message: 'All-clear sent.',
    });
  } catch {
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update emergency broadcast' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST — Acknowledge receipt (from resident devices)
// ---------------------------------------------------------------------------

const acknowledgeSchema = z.object({
  channel: z.enum(['push', 'sms', 'voice', 'email']).default('push'),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    const rawBody = await request.json();
    const parsed = acknowledgeSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

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

    const acknowledgment = await prisma.emergencyBroadcastAcknowledgment.create({
      data: {
        broadcastId: id,
        userId: auth.user.userId,
        channel: parsed.data.channel,
      },
    });

    await prisma.emergencyBroadcast.update({
      where: { id },
      data: { acknowledgedCount: { increment: 1 } },
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
