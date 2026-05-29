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
    const newId = crypto.randomUUID();

    // Concurrency: serialize concurrent writers for the same (amenity, day)
    // tuple with a Postgres advisory transaction lock, then check + insert.
    // Without the lock, INSERT … WHERE NOT EXISTS still races under
    // READ COMMITTED — concurrent transactions don't see each other's
    // uncommitted rows so two can both pass the NOT EXISTS check and both
    // succeed. A 20-way drill against this endpoint produced 6 winners
    // before adding the lock; with it, exactly one wins.
    //
    // Overlap predicate: same amenity, same start date, active status
    // (not cancelled / declined), and the time ranges intersect on that
    // day. Same-day is the dominant case — multi-day bookings (cottages,
    // suites) are not gated here yet and should add an end-date overlap
    // term if/when the UI lets residents pick spanning ranges.
    const inserted = await prisma.$transaction(async (tx) => {
      // Two 32-bit keys for the lock: one is the amenityId hash, the other
      // is the startDate as YYYYMMDD. This namespaces locks per amenity per
      // day so unrelated bookings don't queue behind each other.
      const dateKey = parseInt(input.startDate.replace(/-/g, ''), 10);
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${input.amenityId})::int, ${dateKey}::int)`;

      return tx.$queryRaw<{ id: string; referenceNumber: string }[]>`
        INSERT INTO bookings (
          id, "referenceNumber", "propertyId", "amenityId", "unitId",
          "residentId", "createdById", "startDate", "startTime",
          "endDate", "endTime", "guestCount", "requestorComments",
          status, "approvalStatus", "createdAt", "updatedAt"
        )
        SELECT
          ${newId}::uuid, ${referenceNumber}, ${propertyId}::uuid,
          ${input.amenityId}::uuid, ${unitId}::uuid, ${userId}::uuid,
          ${userId}::uuid, ${new Date(input.startDate)}::date,
          ${`1970-01-01T${input.startTime}`}::timestamp::time,
          ${new Date(input.endDate)}::date,
          ${`1970-01-01T${input.endTime}`}::timestamp::time,
          ${input.guestCount}::int, ${input.requestorComments || null},
          'pending', 'pending', NOW(), NOW()
        WHERE NOT EXISTS (
          SELECT 1 FROM bookings
          WHERE "amenityId" = ${input.amenityId}::uuid
            AND "startDate" = ${new Date(input.startDate)}::date
            AND status NOT IN ('cancelled', 'declined')
            AND "startTime" < ${`1970-01-01T${input.endTime}`}::timestamp::time
            AND "endTime" > ${`1970-01-01T${input.startTime}`}::timestamp::time
        )
        RETURNING id, "referenceNumber"
      `;
    });

    if (inserted.length === 0) {
      return NextResponse.json(
        {
          error: 'SLOT_TAKEN',
          message: 'That amenity slot is already booked. Please pick a different time.',
        },
        { status: 409 },
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id: newId },
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

export async function DELETE(request: NextRequest) {
  try {
    const auth = await guardRoute(request, { roles: RESIDENT_ROLES });
    if (auth.error) return auth.error;

    const { userId, unitId } = auth.user;

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Booking ID is required.' },
        { status: 400 },
      );
    }

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
