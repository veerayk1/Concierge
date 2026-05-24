/**
 * Resident Self-Service — Booking Detail (cancel own)
 *
 * DELETE /api/v1/resident/bookings/:id — Cancel own pending/approved booking
 *
 * The collection route at /api/v1/resident/bookings already exposes a
 * DELETE handler that reads `?id=`, but the resident UI dispatches the
 * conventional path-param shape (`/bookings/{id}`). Mirroring it here
 * keeps the client honest without forcing every caller to switch to a
 * query-string ID.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';
import { isUuid } from '@/lib/uuid';
import type { Role } from '@/types';

const RESIDENT_ROLES: Role[] = ['resident_owner', 'resident_tenant'];
const CANCELLABLE_STATUSES = ['pending', 'approved'];

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await guardRoute(request, { roles: RESIDENT_ROLES });
    if (auth.error) return auth.error;

    const { userId, unitId } = auth.user;
    const { id } = await params;

    if (!isUuid(id)) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Invalid booking id.' },
        { status: 400 },
      );
    }

    const booking = await prisma.booking.findUnique({ where: { id } });
    if (!booking) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Booking not found.' },
        { status: 404 },
      );
    }

    if (booking.unitId !== unitId || booking.residentId !== userId) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'You can only cancel your own bookings.' },
        { status: 403 },
      );
    }

    if (!CANCELLABLE_STATUSES.includes(booking.status)) {
      return NextResponse.json(
        {
          error: 'INVALID_STATUS',
          message: `Cannot cancel a booking with status '${booking.status}'.`,
        },
        { status: 400 },
      );
    }

    const updated = await prisma.booking.update({
      where: { id },
      data: {
        status: 'cancelled',
        cancelledById: userId,
        cancelledAt: new Date(),
      },
    });

    return NextResponse.json({
      data: updated,
      message: `Booking ${updated.referenceNumber ?? ''} cancelled.`.trim(),
    });
  } catch (error) {
    console.error('DELETE /api/v1/resident/bookings/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to cancel booking.' },
      { status: 500 },
    );
  }
}
