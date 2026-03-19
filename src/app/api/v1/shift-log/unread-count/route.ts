/**
 * Shift Log Unread Count API
 * Per PRD 03 Section 3.1.6
 *
 * GET /api/v1/shift-log/unread-count?propertyId=...
 * Returns the number of shift log entries not yet read by the current user.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    const userId = auth.user.userId;

    // Fetch all shift log entries for this property
    const entries = await prisma.event.findMany({
      where: {
        propertyId,
        deletedAt: null,
        eventType: { slug: 'shift_log' },
      },
      select: {
        id: true,
        customFields: true,
      },
    });

    // Count entries where readBy does not include current userId
    const unreadCount = entries.filter((entry) => {
      const cf = (entry.customFields as Record<string, unknown> | null) ?? {};
      const readBy = Array.isArray(cf.readBy) ? (cf.readBy as string[]) : [];
      return !readBy.includes(userId);
    }).length;

    return NextResponse.json({ unreadCount });
  } catch (error) {
    console.error('GET /api/v1/shift-log/unread-count error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to get unread count' },
      { status: 500 },
    );
  }
}
