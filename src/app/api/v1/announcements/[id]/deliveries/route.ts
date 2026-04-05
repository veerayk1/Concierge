/**
 * Announcement Deliveries API — GET delivery stats
 * Per PRD 09 Communication — delivery tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;

    // Verify announcement exists
    const announcement = await prisma.announcement.findUnique({
      where: { id, deletedAt: null },
      select: { id: true, propertyId: true, status: true },
    });

    if (!announcement) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Announcement not found' },
        { status: 404 },
      );
    }

    // Get per-status counts
    const statusCounts = await prisma.announcementDelivery.groupBy({
      by: ['status'],
      where: { announcementId: id },
      _count: { status: true },
    });

    // Get per-channel + per-status breakdown
    const channelBreakdown = await prisma.announcementDelivery.groupBy({
      by: ['channel', 'status'],
      where: { announcementId: id },
      _count: { status: true },
    });

    // Build summary
    let total = 0;
    let sent = 0;
    let failed = 0;
    let pending = 0;

    for (const entry of statusCounts) {
      const count = entry._count.status;
      total += count;
      if (entry.status === 'sent' || entry.status === 'delivered') {
        sent += count;
      } else if (entry.status === 'failed' || entry.status === 'bounced') {
        failed += count;
      } else if (entry.status === 'pending' || entry.status === 'queued') {
        pending += count;
      }
    }

    // Build channel breakdown array
    const channelBreakdownFormatted = channelBreakdown.map((entry) => ({
      channel: entry.channel,
      status: entry.status,
      count: entry._count.status,
    }));

    // Get individual delivery records
    const deliveriesRaw = await prisma.announcementDelivery.findMany({
      where: { announcementId: id },
      orderBy: { createdAt: 'desc' },
    });

    // Manual join: resolve recipient name/email from User table
    const recipientIds = [...new Set(deliveriesRaw.map((d) => d.recipientId))];
    const users = await prisma.user.findMany({
      where: { id: { in: recipientIds } },
      select: { id: true, firstName: true, lastName: true, email: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    const deliveries = deliveriesRaw.map((d) => {
      const user = userMap.get(d.recipientId);
      return {
        id: d.id,
        channel: d.channel,
        status: d.status,
        sentAt: d.sentAt,
        deliveredAt: d.deliveredAt,
        failedAt: d.failedAt,
        failureReason: d.failureReason,
        retryCount: d.retryCount,
        recipientId: d.recipientId,
        recipientName: user ? `${user.firstName} ${user.lastName}`.trim() : null,
        recipientEmail: user?.email ?? null,
      };
    });

    return NextResponse.json({
      data: {
        summary: { total, sent, failed, pending },
        channelBreakdown: channelBreakdownFormatted,
        deliveries,
      },
    });
  } catch (error) {
    console.error('GET /api/v1/announcements/:id/deliveries error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch delivery stats' },
      { status: 500 },
    );
  }
}
