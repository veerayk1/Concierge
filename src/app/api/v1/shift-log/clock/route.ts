/**
 * Guard Clock In / Clock Out for the Shift Log.
 *
 * GET  /api/v1/shift-log/clock  — return caller's currently-active shift
 *                                 (null if not clocked in).
 * POST /api/v1/shift-log/clock  — clock in. Body: { propertyId }.
 *                                 Creates a SecurityShift row with
 *                                 startTime = now and an end estimated
 *                                 8 hours out (the shift can be cut
 *                                 short on clock out).
 * DELETE /api/v1/shift-log/clock — clock out. Sets actualEndTime on the
 *                                 caller's active shift, status=completed.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';
import type { Role } from '@/types';

const GUARD_ROLES: Role[] = [
  'security_guard',
  'security_supervisor',
  'front_desk',
  'superintendent',
  'property_admin',
  'super_admin',
];

async function findActiveShift(userId: string, propertyId?: string | null) {
  return prisma.securityShift.findFirst({
    where: {
      guardId: userId,
      status: 'active',
      actualEndTime: null,
      ...(propertyId ? { propertyId } : {}),
    },
    orderBy: { startTime: 'desc' },
    select: {
      id: true,
      propertyId: true,
      guardId: true,
      startTime: true,
      endTime: true,
      status: true,
      openingNotes: true,
    },
  });
}

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request, { roles: GUARD_ROLES });
    if (auth.error) return auth.error;

    const propertyId = new URL(request.url).searchParams.get('propertyId');
    const shift = await findActiveShift(auth.user.userId, propertyId);
    return NextResponse.json({ data: shift });
  } catch (error) {
    console.error('GET /api/v1/shift-log/clock error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch shift state' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request, { roles: GUARD_ROLES });
    if (auth.error) return auth.error;

    const body = await request.json().catch(() => ({}));
    const propertyId: string | undefined = body.propertyId;
    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    // Double-clock-in guard — don't open a second active shift if one is
    // already open. Return the existing shift idempotently.
    const existing = await findActiveShift(auth.user.userId, propertyId);
    if (existing) {
      return NextResponse.json(
        { data: existing, message: 'You are already clocked in for this property.' },
        { status: 200 },
      );
    }

    const start = new Date();
    const end = new Date(start.getTime() + 8 * 60 * 60 * 1000); // 8h placeholder
    const shift = await prisma.securityShift.create({
      data: {
        propertyId,
        guardId: auth.user.userId,
        startTime: start,
        endTime: end,
        status: 'active',
        openingNotes: typeof body.notes === 'string' ? body.notes.slice(0, 2000) : null,
      },
      select: {
        id: true,
        propertyId: true,
        guardId: true,
        startTime: true,
        endTime: true,
        status: true,
      },
    });
    return NextResponse.json({ data: shift, message: 'Clocked in.' }, { status: 201 });
  } catch (error) {
    console.error('POST /api/v1/shift-log/clock error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to clock in', detail: String(error) },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const auth = await guardRoute(request, { roles: GUARD_ROLES });
    if (auth.error) return auth.error;

    const url = new URL(request.url);
    const propertyId = url.searchParams.get('propertyId');
    const closingNotes = url.searchParams.get('notes');

    const existing = await findActiveShift(auth.user.userId, propertyId);
    if (!existing) {
      return NextResponse.json(
        { error: 'NOT_CLOCKED_IN', message: 'You have no active shift to clock out of.' },
        { status: 404 },
      );
    }

    const updated = await prisma.securityShift.update({
      where: { id: existing.id },
      data: {
        actualEndTime: new Date(),
        status: 'completed',
        closingNotes: closingNotes ? closingNotes.slice(0, 2000) : undefined,
      },
      select: {
        id: true,
        actualEndTime: true,
        status: true,
      },
    });
    return NextResponse.json({ data: updated, message: 'Clocked out.' });
  } catch (error) {
    console.error('DELETE /api/v1/shift-log/clock error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to clock out' },
      { status: 500 },
    );
  }
}
