/**
 * Announcement Delivery Retry API — POST retry failed deliveries
 * Per PRD 09 Communication — delivery retry mechanism
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin', 'property_admin'] });
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

    // Reset failed/bounced deliveries back to pending
    const result = await prisma.announcementDelivery.updateMany({
      where: {
        announcementId: id,
        status: { in: ['failed', 'bounced'] },
      },
      data: {
        status: 'pending',
        failedAt: null,
        failureReason: null,
        retryCount: { increment: 1 },
      },
    });

    return NextResponse.json({
      data: { retriedCount: result.count },
      message: `${result.count} delivery(ies) queued for retry.`,
    });
  } catch (error) {
    console.error('POST /api/v1/announcements/:id/deliveries/retry error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to retry deliveries' },
      { status: 500 },
    );
  }
}
