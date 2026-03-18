/**
 * Amenity Detail + Booking API
 * Per PRD 06
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';

const createBookingSchema = z.object({
  unitId: z.string().uuid(),
  residentId: z.string().uuid().optional(),
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  guestCount: z.number().min(0).max(50).default(0),
  notes: z.string().max(500).optional(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const amenity = await prisma.amenity.findUnique({
      where: { id, deletedAt: null },
      include: {
        group: { select: { id: true, name: true } },
        bookings: {
          where: {
            deletedAt: null,
            startTime: { gte: new Date() },
          },
          select: {
            id: true,
            startTime: true,
            endTime: true,
            status: true,
            guestCount: true,
            unit: { select: { id: true, number: true } },
          },
          orderBy: { startTime: 'asc' },
          take: 20,
        },
      },
    });

    if (!amenity) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Amenity not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: amenity });
  } catch (error) {
    console.error('GET /api/v1/amenities/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch amenity' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: amenityId } = await params;
    const body = await request.json();

    const parsed = createBookingSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;

    // Check amenity exists
    const amenity = await prisma.amenity.findUnique({ where: { id: amenityId } });
    if (!amenity) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Amenity not found' },
        { status: 404 },
      );
    }

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        propertyId: amenity.propertyId,
        amenityId,
        unitId: input.unitId,
        residentId: input.residentId || null,
        startTime: new Date(input.startTime),
        endTime: new Date(input.endTime),
        guestCount: input.guestCount,
        notes: input.notes || null,
        status: amenity.requiresApproval ? 'pending' : 'approved',
        bookedById: 'demo-user',
      },
    });

    return NextResponse.json(
      {
        data: booking,
        message: amenity.requiresApproval
          ? 'Booking submitted for approval.'
          : 'Booking confirmed.',
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/v1/amenities/:id (booking) error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create booking' },
      { status: 500 },
    );
  }
}
