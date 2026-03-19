/**
 * Shift Handoff API — Entries since last shift change
 * Per PRD 03 Section 3.1.6
 *
 * GET /api/v1/shift-log/handoff?propertyId=...&shiftStart=...
 * Returns all entries created since `shiftStart`, plus any pinned entries.
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
    const shiftStart = searchParams.get('shiftStart');

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    if (!shiftStart) {
      return NextResponse.json(
        { error: 'MISSING_SHIFT_START', message: 'shiftStart is required' },
        { status: 400 },
      );
    }

    const where = {
      propertyId,
      deletedAt: null,
      eventType: { slug: 'shift_log' },
      OR: [
        { createdAt: { gte: new Date(shiftStart) } },
        { customFields: { path: ['pinned'], equals: true } },
      ],
    };

    const entries = await prisma.event.findMany({
      where,
      include: {
        eventType: { select: { name: true } },
      },
      orderBy: [{ customFields: { sort: 'desc' } }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ data: entries });
  } catch (error) {
    console.error('GET /api/v1/shift-log/handoff error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch handoff entries' },
      { status: 500 },
    );
  }
}
