/**
 * Booking Detail — Approve, reject, cancel
 * Per PRD 06 Amenity Booking
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const booking = await prisma.booking.findUnique({
      where: { id, deletedAt: null },
      include: {
        amenity: { select: { id: true, name: true, location: true, capacity: true } },
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
    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, unknown> = {};

    if (body.status) {
      const validTransitions: Record<string, string[]> = {
        pending: ['approved', 'rejected', 'cancelled'],
        approved: ['cancelled', 'completed'],
        rejected: [],
        cancelled: [],
        completed: [],
      };

      const booking = await prisma.booking.findUnique({ where: { id } });
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
      if (body.status === 'approved') updateData.approvedById = 'demo-user';
      if (body.status === 'cancelled') updateData.cancelledAt = new Date();
    }

    if (body.notes !== undefined) updateData.notes = body.notes;

    const booking = await prisma.booking.update({
      where: { id },
      data: updateData,
      include: { amenity: { select: { name: true } } },
    });

    return NextResponse.json({ data: booking, message: `Booking ${body.status || 'updated'}.` });
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
    const { id } = await params;
    await prisma.booking.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'cancelled' },
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
