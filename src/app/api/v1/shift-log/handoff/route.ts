/**
 * Shift Handoff API — Entries since last shift change
 * Per PRD 03 Section 3.1.6
 *
 * GET /api/v1/shift-log/handoff?propertyId=...&shiftStart=...
 * Returns all entries created since `shiftStart`, plus any pinned entries.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute, enforcePropertyAccess } from '@/server/middleware/api-guard';

/**
 * POST /api/v1/shift-log/handoff — Create or upsert a shift handoff record.
 *
 * Used by an outgoing guard at end-of-shift to leave structured notes for the
 * next shift. Without this endpoint the handoff UI / chain test H2 gets
 * 405 Method Not Allowed because the route only handled GET.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request, {
      roles: [
        'super_admin',
        'property_admin',
        'property_manager',
        'security_guard',
        'security_supervisor',
        'superintendent',
        'front_desk',
      ],
    });
    if (auth.error) return auth.error;

    const body = await request.json().catch(() => ({}));
    const propertyId = body.propertyId as string | undefined;
    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }
    const tenancy = enforcePropertyAccess(auth.user, propertyId);
    if (tenancy) return tenancy;

    const shiftDate = body.shiftDate ? new Date(body.shiftDate) : new Date();
    shiftDate.setUTCHours(0, 0, 0, 0);
    const shiftType: string = body.shiftType ?? 'morning';
    const notes: string | null = body.notes ?? null;
    const flaggedItems = body.flaggedItems ?? [];
    // aiSummary is the editable narrative the wizard produces from
    // POST /api/v1/shift-log/handoff/compose. Persisted on the
    // ShiftHandoff row so the next shift sees it verbatim.
    const aiSummary: string | null = body.aiSummary ?? null;

    const handoff = await prisma.shiftHandoff.upsert({
      where: {
        propertyId_shiftDate_shiftType: { propertyId, shiftDate, shiftType },
      },
      update: {
        notes,
        flaggedItems,
        aiSummary,
        eventCount: Array.isArray(flaggedItems) ? flaggedItems.length : 0,
      },
      create: {
        propertyId,
        shiftDate,
        shiftType,
        outgoingUserId: auth.user.userId,
        notes,
        flaggedItems,
        aiSummary,
        eventCount: Array.isArray(flaggedItems) ? flaggedItems.length : 0,
      },
    });

    return NextResponse.json({ data: handoff, message: 'Shift handoff saved.' }, { status: 201 });
  } catch (error) {
    console.error('POST /api/v1/shift-log/handoff error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to save shift handoff' },
      { status: 500 },
    );
  }
}

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
    const _tenancy = enforcePropertyAccess(auth.user, propertyId);
    if (_tenancy) return _tenancy;

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
