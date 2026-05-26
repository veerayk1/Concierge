/**
 * Booking Detail — Approve, reject, cancel
 * Per PRD 06 Amenity Booking
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute, enforcePropertyAccess } from '@/server/middleware/api-guard';
import { sendEmail } from '@/server/email';
import { renderTemplate } from '@/server/email-templates';
import { isUuid } from '@/lib/uuid';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    if (!isUuid(id)) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Invalid booking id.' },
        { status: 400 },
      );
    }
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

    // Tenancy: prevent a property_admin at Property A from reading a booking
    // at Property B by guessing its id. enforcePropertyAccess is a no-op for
    // super_admin and for the booking's own property.
    const tenancy = enforcePropertyAccess(auth.user, booking.propertyId);
    if (tenancy) return tenancy;

    // SEC-137: per-resident scoping on detail GET. The list endpoint was
    // scoped in SEC-135 but the detail handler wasn't — so a resident
    // could read any neighbor's booking detail (who, when, which amenity)
    // by guessing UUIDs. That maps when each apartment is empty (at the
    // gym/pool/party room) — useful intel for break-ins. Staff sees all;
    // non-staff sees only bookings they created, are the resident on, or
    // that belong to a unit they occupy.
    const STAFF_ROLES = new Set<string>([
      'super_admin',
      'property_admin',
      'property_manager',
      'front_desk',
      'security_supervisor',
      'security_guard',
      'superintendent',
      'maintenance_staff',
      'board_member',
    ]);
    if (!STAFF_ROLES.has(auth.user.role)) {
      const b = booking as {
        residentId?: string | null;
        createdById?: string | null;
        unitId?: string | null;
      };
      const isOwn = b.residentId === auth.user.userId || b.createdById === auth.user.userId;
      let ownsUnit = false;
      if (!isOwn && b.unitId) {
        const occ = await prisma.occupancyRecord.findFirst({
          where: { userId: auth.user.userId, unitId: b.unitId, moveOutDate: null },
          select: { id: true },
        });
        ownsUnit = !!occ;
      }
      if (!isOwn && !ownsUnit) {
        return NextResponse.json(
          { error: 'FORBIDDEN', message: 'You can only view your own bookings.' },
          { status: 403 },
        );
      }
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
    const auth = await guardRoute(request, {
      roles: ['super_admin', 'property_admin', 'property_manager'],
    });
    if (auth.error) return auth.error;

    const { id } = await params;
    if (!isUuid(id)) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Invalid booking id.' },
        { status: 400 },
      );
    }
    const body = await request.json();

    // Hoisted tenancy guard — covers every code path in PATCH (status,
    // approverComments, etc.). Previously the check was nested inside the
    // status branch, so a cross-tenant PATCH that only set approverComments
    // slipped through and a property_admin at A could edit B's bookings.
    {
      const target = await prisma.booking.findUnique({
        where: { id },
        select: { propertyId: true },
      });
      if (!target) {
        return NextResponse.json(
          { error: 'NOT_FOUND', message: 'Booking not found' },
          { status: 404 },
        );
      }
      const tenancyTop = enforcePropertyAccess(auth.user, target.propertyId);
      if (tenancyTop) return tenancyTop;
    }

    const updateData: Record<string, unknown> = {};

    if (body.status) {
      // 'confirmed' is the legacy DB value seeded by auto-approval — semantically
      // identical to 'approved' for transition purposes. Treat them as one node
      // in the graph so existing bookings can still be marked completed,
      // cancelled, or no_show.
      const validTransitions: Record<string, string[]> = {
        pending: ['approved', 'declined', 'cancelled'],
        approved: ['cancelled', 'completed', 'no_show'],
        confirmed: ['cancelled', 'completed', 'no_show'],
        declined: [],
        cancelled: [],
        completed: [],
        no_show: [],
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

      // Tenancy check before mutation — staff at Property A must not be able
      // to approve/decline/cancel bookings at Property B.
      const tenancy = enforcePropertyAccess(auth.user, booking.propertyId);
      if (tenancy) return tenancy;

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

      // Atomic compare-and-swap on status. Without this, N concurrent
      // PATCHes (e.g., two staff clicking Approve simultaneously, or a
      // double-clicked Cancel button) would all see status=pending and
      // all proceed past validation, sending N approval emails to the
      // booker and (on cancellation) marking the next waitlisted user
      // 'offered' N times and emailing them N copies of the offer.
      // Postgres serializes this single UPDATE statement at the row-
      // lock level; only the first writer wins. Losers get 409.
      const casCount = await prisma.$executeRaw`
        UPDATE bookings SET status = ${body.status}
        WHERE id = ${id}::uuid AND status = ${booking.status}
      `;
      if (casCount === 0) {
        return NextResponse.json(
          {
            error: 'STATE_CONFLICT',
            message: `Booking is no longer in '${booking.status}' status — another change won the race.`,
          },
          { status: 409 },
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
          html: renderTemplate('booking_approved', {
            amenityName,
            date: booking.startTime
              ? new Date(booking.startTime as string | number | Date).toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })
              : 'TBD',
            time: booking.startTime
              ? new Date(booking.startTime as string | number | Date).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                })
              : 'TBD',
          }),
        }).catch(() => {
          /* email failures are non-blocking */
        });
      }

      if (body.status === 'declined' && booker?.email) {
        sendEmail({
          to: booker.email,
          subject: `Your booking for ${amenityName} has been declined`,
          html: renderTemplate('booking_declined', {
            amenityName,
            reason: body.declinedReason ?? 'No reason provided.',
          }),
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

    // Stand-alone approvalStatus update — for the manager decision queue,
    // which only wants to flip a "needs approval" gate without driving
    // the full booking state machine. (Status changes still go through
    // the validated transition path above.)
    if (
      body.approvalStatus !== undefined &&
      ['pending', 'approved', 'declined'].includes(body.approvalStatus)
    ) {
      const tenancy = enforcePropertyAccess(
        auth.user,
        (await prisma.booking.findUnique({ where: { id }, select: { propertyId: true } }))
          ?.propertyId || '',
      );
      if (tenancy) return tenancy;
      updateData.approvalStatus = body.approvalStatus;
      if (body.approvalStatus === 'approved') {
        updateData.approvedById = auth.user.userId;
        updateData.approvedAt = new Date();
      }
    }

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
    if (!isUuid(id)) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Invalid booking id.' },
        { status: 400 },
      );
    }
    // Residents can only cancel their OWN bookings. Staff can cancel any
    // in the property. Without this scope check any logged-in resident
    // could cancel every booking in the building by guessing UUIDs —
    // verified during adversarial sweep (was 200, now 403 cross-resident).
    const STAFF_ROLES = new Set<string>([
      'super_admin',
      'property_admin',
      'property_manager',
      'front_desk',
      'security_supervisor',
      'superintendent',
    ]);
    const booking = await prisma.booking.findUnique({
      where: { id },
      select: { residentId: true, createdById: true, propertyId: true },
    });
    if (!booking) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Booking not found' },
        { status: 404 },
      );
    }
    // Tenancy first — staff at Property A cannot cancel Property B's bookings
    // even though the role gate alone would let them through.
    const tenancy = enforcePropertyAccess(auth.user, booking.propertyId);
    if (tenancy) return tenancy;
    if (!STAFF_ROLES.has(auth.user.role)) {
      if (booking.residentId !== auth.user.userId && booking.createdById !== auth.user.userId) {
        return NextResponse.json(
          { error: 'FORBIDDEN', message: 'You can only cancel your own bookings.' },
          { status: 403 },
        );
      }
    }
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
