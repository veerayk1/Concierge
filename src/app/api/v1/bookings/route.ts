/**
 * Bookings API — List & Create bookings across amenities
 * Per PRD 06 Amenity Booking
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute, enforcePropertyAccess } from '@/server/middleware/api-guard';
import { createReservationSchema } from '@/schemas/reservation';

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const amenityId = searchParams.get('amenityId');
    const unitId = searchParams.get('unitId');
    const status = searchParams.get('status');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const _rawPage = parseInt(searchParams.get('page') || '1', 10);
    const _rawPageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    const page = Number.isFinite(_rawPage) && _rawPage > 0 ? _rawPage : 1;
    const pageSize =
      Number.isFinite(_rawPageSize) && _rawPageSize > 0 ? Math.min(_rawPageSize, 200) : 20;

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }
    const _tenancy = enforcePropertyAccess(auth.user, propertyId);
    if (_tenancy) return _tenancy;

    const where: Record<string, unknown> = { propertyId };
    if (amenityId) where.amenityId = amenityId;
    if (unitId) where.unitId = unitId;
    if (status) where.status = status;
    if (from || to) {
      where.startTime = {};
      if (from) (where.startTime as Record<string, unknown>).gte = new Date(from);
      if (to) (where.startTime as Record<string, unknown>).lte = new Date(to);
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          amenity: { select: { id: true, name: true } },
          unit: { select: { id: true, number: true } },
        },
        orderBy: { startTime: 'asc' },
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
    console.error('GET /api/v1/bookings error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch bookings' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const body = await request.json();
    const parsed = createReservationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;

    const startDt = new Date(input.startTime);
    const endDt = new Date(input.endTime);
    const referenceNumber = `AMN-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`;

    // Conflict detection inside a serializable transaction. Without this, two
    // residents could POST identical slots in parallel and both succeed
    // (verified race condition). amenity.maxConcurrent governs how many
    // overlapping bookings are allowed (default 1 = exclusive).
    let booking;
    try {
      booking = await prisma.$transaction(
        async (tx) => {
          const amenity = await tx.amenity.findUnique({
            where: { id: input.amenityId },
            select: { maxConcurrent: true, propertyId: true },
          });
          if (!amenity) {
            throw Object.assign(new Error('Amenity not found.'), { _status: 404 });
          }
          if (amenity.propertyId !== input.propertyId) {
            throw Object.assign(new Error('Amenity does not belong to this property.'), {
              _status: 400,
            });
          }

          // Resolve the unit for this booking. The schema makes unitId optional
          // because residents shouldn't have to type it — but the old fallback
          // `input.unitId || auth.user.userId` passed a USER id into the unit
          // foreign key, blowing up every booking with a P2003 constraint
          // violation. Instead, look up the caller's active occupancy and use
          // that. If the caller has no occupancy (staff making a booking on
          // behalf of someone else without specifying the unit), error out
          // clearly instead of corrupting the row.
          let resolvedUnitId = input.unitId;
          if (!resolvedUnitId) {
            const occupancy = await tx.occupancyRecord.findFirst({
              where: {
                userId: auth.user.userId,
                propertyId: input.propertyId,
                moveOutDate: null,
              },
              select: { unitId: true },
            });
            resolvedUnitId = occupancy?.unitId;
          }
          if (!resolvedUnitId) {
            throw Object.assign(
              new Error(
                'unitId is required for this booking — caller has no active occupancy at this property.',
              ),
              { _status: 400 },
            );
          }

          // Booking.startTime is a Postgres TIME column (time-of-day only)
          // and Booking.startDate is a DATE column. A Prisma filter like
          // `startTime: { lt: endDt }` only compares the time portion and
          // ignores the date, so a 14:00–16:00 booking on Aug 13 falsely
          // collides with an existing 14:00–16:00 on a totally different
          // day. Build a single timestamp by combining the date + time
          // columns and compare against the requested window. Convert
          // the JS Date bounds to ISO strings and cast both sides to
          // `timestamp` so no implicit session-timezone conversion
          // shifts the comparison.
          const startIso = startDt.toISOString();
          const endIso = endDt.toISOString();
          const overlapRows = await tx.$queryRaw<{ count: bigint }[]>`
            SELECT COUNT(*)::bigint AS count
            FROM bookings
            WHERE "amenityId" = ${input.amenityId}::uuid
              AND status IN ('confirmed', 'pending', 'approved')
              AND ("startDate"::timestamp + "startTime"::time) < ${endIso}::timestamp
              AND ("endDate"::timestamp + "endTime"::time) > ${startIso}::timestamp
          `;
          const overlapping = Number(overlapRows[0]?.count ?? 0n);
          if (overlapping >= (amenity.maxConcurrent || 1)) {
            throw Object.assign(
              new Error('This amenity is already booked for the requested time.'),
              { _status: 409 },
            );
          }

          return tx.booking.create({
            data: {
              referenceNumber,
              propertyId: input.propertyId,
              amenityId: input.amenityId,
              unitId: resolvedUnitId,
              residentId: auth.user.userId,
              createdById: auth.user.userId,
              startDate: startDt,
              startTime: startDt,
              endDate: endDt,
              endTime: endDt,
              requestorComments: input.notes || null,
              status: 'confirmed',
            },
            include: {
              amenity: { select: { id: true, name: true } },
              unit: { select: { id: true, number: true } },
            },
          });
        },
        { isolationLevel: 'Serializable' },
      );
    } catch (e) {
      const status = (e as { _status?: number })?._status;
      if (status) {
        return NextResponse.json(
          { error: status === 409 ? 'CONFLICT' : 'NOT_FOUND', message: (e as Error).message },
          { status },
        );
      }
      // Postgres serialization failure under concurrent same-slot bookings.
      // The first writer wins, the rest hit P2034. The user wants the same
      // 409 they'd get from a sequential conflict, not a generic 500.
      const code = (e as { code?: string })?.code;
      if (code === 'P2034' || /write conflict|deadlock/i.test((e as Error)?.message ?? '')) {
        return NextResponse.json(
          {
            error: 'CONFLICT',
            message: 'This amenity is already booked for the requested time.',
          },
          { status: 409 },
        );
      }
      throw e;
    }

    return NextResponse.json({ data: booking, message: 'Reservation created.' }, { status: 201 });
  } catch (error) {
    console.error('POST /api/v1/bookings error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create booking' },
      { status: 500 },
    );
  }
}
