/**
 * Bookings API — List & Create bookings across amenities
 * Per PRD 06 Amenity Booking
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';
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

    const where: Record<string, unknown> = { propertyId, deletedAt: null };
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

    const booking = await prisma.booking.create({
      data: {
        propertyId: input.propertyId,
        amenityId: input.amenityId,
        unitId: input.unitId || null,
        startTime: new Date(input.startTime),
        endTime: new Date(input.endTime),
        notes: input.notes || null,
        status: 'confirmed',
        bookedById: auth.user.userId,
      },
      include: {
        amenity: { select: { id: true, name: true } },
        unit: { select: { id: true, number: true } },
      },
    });

    return NextResponse.json({ data: booking, message: 'Reservation created.' }, { status: 201 });
  } catch (error) {
    console.error('POST /api/v1/bookings error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create booking' },
      { status: 500 },
    );
  }
}
