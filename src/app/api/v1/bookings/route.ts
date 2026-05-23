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
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

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

          const overlapping = await tx.booking.count({
            where: {
              amenityId: input.amenityId,
              status: { in: ['confirmed', 'pending', 'approved'] },
              // Two ranges overlap iff start < other.end AND end > other.start.
              startTime: { lt: endDt },
              endTime: { gt: startDt },
            },
          });
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
              unitId: input.unitId || auth.user.userId,
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
