/**
 * Resident Self-Service — Bookings
 *
 * GET    /api/v1/resident/bookings     — List own bookings
 * POST   /api/v1/resident/bookings     — Create booking for own unit
 * DELETE /api/v1/resident/bookings/:id — Cancel own pending/approved booking
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { guardRoute } from '@/server/middleware/api-guard';
import type { Role } from '@/types';

const RESIDENT_ROLES: Role[] = ['resident_owner', 'resident_tenant'];

const CANCELLABLE_STATUSES = ['pending', 'approved'];

const createBookingSchema = z.object({
  amenityId: z.string().uuid('Select an amenity'),
  startDate: z.string().min(1, 'Start date is required'),
  startTime: z.string().min(1, 'Start time is required'),
  endDate: z.string().min(1, 'End date is required'),
  endTime: z.string().min(1, 'End time is required'),
  guestCount: z.number().int().min(0).default(1),
  requestorComments: z.string().max(1000).optional().or(z.literal('')),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request, { roles: RESIDENT_ROLES });
    if (auth.error) return auth.error;

    const { propertyId, unitId } = auth.user;

    if (!unitId) {
      return NextResponse.json(
        { error: 'NO_UNIT', message: 'No unit associated with your account.' },
        { status: 400 },
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    const where: Record<string, unknown> = {
      propertyId,
      unitId,
    };

    if (status) where.status = status;

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          amenity: { select: { id: true, name: true } },
          unit: { select: { id: true, number: true } },
        },
        orderBy: { startDate: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.booking.count({ where }),
    ]);

    return NextResponse.json({
      data: bookings,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    console.error('GET /api/v1/resident/bookings error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch bookings' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request, { roles: RESIDENT_ROLES });
    if (auth.error) return auth.error;

    const { userId, propertyId, unitId } = auth.user;

    if (!unitId) {
      return NextResponse.json(
        { error: 'NO_UNIT', message: 'No unit associated with your account.' },
        { status: 400 },
      );
    }

    const body = await request.json();
    const parsed = createBookingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;
    const year = new Date().getFullYear();
    const referenceNumber = `AMN-${year}-${nanoid(5).toUpperCase()}`;

    const booking = await prisma.booking.create({
      data: {
        referenceNumber,
        propertyId,
        amenityId: input.amenityId,
        unitId, // Always from auth context
        residentId: userId,
        createdById: userId,
        startDate: new Date(input.startDate),
        startTime: new Date(`1970-01-01T${input.startTime}`),
        endDate: new Date(input.endDate),
        endTime: new Date(`1970-01-01T${input.endTime}`),
        guestCount: input.guestCount,
        requestorComments: input.requestorComments || null,
        status: 'pending',
        approvalStatus: 'pending',
      },
      include: {
        amenity: { select: { id: true, name: true } },
        unit: { select: { id: true, number: true } },
      },
    });

    return NextResponse.json(
      { data: booking, message: `Booking ${referenceNumber} submitted.` },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/v1/resident/bookings error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create booking' },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request, { roles: RESIDENT_ROLES });
    if (auth.error) return auth.error;

    const { userId, unitId } = auth.user;

    const { id } = await context.params;

    const booking = await prisma.booking.findUnique({
      where: { id },
    });

    if (!booking) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Booking not found.' },
        { status: 404 },
      );
    }

    // Ownership check — resident can only cancel their own bookings
    if (booking.unitId !== unitId || booking.residentId !== userId) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'You can only cancel your own bookings.' },
        { status: 403 },
      );
    }

    // Status check — only pending or approved bookings can be cancelled
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
      message: 'Booking cancelled.',
    });
  } catch (error) {
    console.error('DELETE /api/v1/resident/bookings/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to cancel booking' },
      { status: 500 },
    );
  }
}
