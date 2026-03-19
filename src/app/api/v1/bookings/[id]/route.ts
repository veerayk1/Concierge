/**
 * Booking Detail — Approve, reject, cancel
 * Per PRD 06 Amenity Booking
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';
import { sendEmail } from '@/server/email';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        amenity: { select: { id: true, name: true, description: true, maxConcurrent: true } },
        unit: { select: { id: true, number: true } },
      },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Booking not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: booking });
  } catch (error) {
    console.error('GET /api/v1/bookings/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch booking' },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin', 'property_admin'] });
    if (auth.error) return auth.error;

    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, unknown> = {};

    if (body.status) {
      const validTransitions: Record<string, string[]> = {
        pending: ['approved', 'declined', 'cancelled'],
        approved: ['cancelled', 'completed', 'no_show'],
        declined: [],
        cancelled: [],
        completed: [],
      };

      const booking = await prisma.booking.findUnique({
        where: { id },
        include: {
          amenity: { select: { name: true, approvalMode: true } },
        },
      });
      if (!booking) {
        return NextResponse.json(
          { error: 'NOT_FOUND', message: 'Booking not found' },
          { status: 404 },
        );
      }

      const allowed = validTransitions[booking.status] || [];
      if (!allowed.includes(body.status)) {
        return NextResponse.json(
          {
            error: 'INVALID_TRANSITION',
            message: `Cannot change from ${booking.status} to ${body.status}`,
          },
          { status: 400 },
        );
      }

      updateData.status = body.status;
      if (body.status === 'approved') {
        updateData.approvedById = auth.user.userId;
        updateData.approvedAt = new Date();
        updateData.approvalStatus = 'approved';
      }
      if (body.status === 'declined') {
        updateData.approvalStatus = 'declined';
        if (body.declinedReason) updateData.declinedReason = body.declinedReason;
      }
      if (body.status === 'cancelled') {
        updateData.cancelledAt = new Date();
        updateData.cancelledById = auth.user.userId;
        if (body.cancellationReason) updateData.cancellationReason = body.cancellationReason;
      }

      // --- Email notifications ---
      const amenityName = booking.amenity?.name ?? 'Amenity';

      // Look up the booker's contact info for notifications
      const booker = await prisma.user.findUnique({
        where: { id: booking.residentId },
        select: { email: true, firstName: true },
      });

      if (body.status === 'approved' && booker?.email) {
        sendEmail({
          to: booker.email,
          subject: `Your booking for ${amenityName} has been approved`,
          text: `Hi ${booker.firstName ?? 'there'},\n\nYour booking for ${amenityName} has been approved.\n\n— Concierge`,
        }).catch(() => {
          /* email failures are non-blocking */
        });
      }

      if (body.status === 'declined' && booker?.email) {
        const reason = body.declinedReason ? `\n\nReason: ${body.declinedReason}` : '';
        sendEmail({
          to: booker.email,
          subject: `Your booking for ${amenityName} has been declined`,
          text: `Hi ${booker.firstName ?? 'there'},\n\nYour booking for ${amenityName} has been declined.${reason}\n\n— Concierge`,
        }).catch(() => {
          /* email failures are non-blocking */
        });
      }

      // --- Waitlist notification on cancellation ---
      if (body.status === 'cancelled') {
        try {
          const nextWaitlisted = await prisma.waitlistEntry.findFirst({
            where: {
              amenityId: booking.amenityId,
              status: 'waiting',
            },
            orderBy: { position: 'asc' },
          });

          if (nextWaitlisted) {
            await prisma.waitlistEntry.update({
              where: { id: nextWaitlisted.id },
              data: { status: 'offered', offeredAt: new Date() },
            });

            // Look up waitlisted user's contact info
            const waitlistedUser = await prisma.user.findUnique({
              where: { id: nextWaitlisted.residentId },
              select: { email: true, firstName: true },
            });

            if (waitlistedUser?.email) {
              sendEmail({
                to: waitlistedUser.email,
                subject: `A slot for ${amenityName} is now available`,
                text: `Hi ${waitlistedUser.firstName ?? 'there'},\n\nA booking slot for ${amenityName} is now available. Log in to claim it before it expires.\n\n— Concierge`,
              }).catch(() => {
                /* email failures are non-blocking */
              });
            }
          }
        } catch {
          // Waitlist notification failures should not block the cancellation
        }
      }
    }

    if (body.approverComments !== undefined) updateData.approverComments = body.approverComments;

    const updatedBooking = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: { amenity: { select: { name: true } } },
    });

    return NextResponse.json({
      data: updatedBooking,
      message: `Booking ${body.status || 'updated'}.`,
    });
  } catch (error) {
    console.error('PATCH /api/v1/bookings/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update booking' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    await prisma.booking.update({
      where: { id },
      data: { status: 'cancelled', cancelledAt: new Date(), cancelledById: auth.user.userId },
    });
    return NextResponse.json({ message: 'Booking cancelled.' });
  } catch (error) {
    console.error('DELETE /api/v1/bookings/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to cancel booking' },
      { status: 500 },
    );
  }
}
