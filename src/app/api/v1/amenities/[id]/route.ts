/**
 * Amenity Detail + Booking API
 * Per PRD 06
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';

const createBookingSchema = z.object({
  unitId: z.string().uuid(),
  residentId: z.string().uuid().optional(),
  startDate: z.string().min(1),
  startTime: z.string().min(1),
  endDate: z.string().min(1),
  endTime: z.string().min(1),
  guestCount: z.number().min(0).max(50).default(0),
  requestorComments: z.string().max(500).optional(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const amenity = await (prisma.amenity.findUnique as any)({
      where: { id, deletedAt: null },
      include: {
        group: { select: { id: true, name: true } },
        bookings: {
          where: {
            startDate: { gte: new Date() },
          },
          select: {
            id: true,
            startDate: true,
            startTime: true,
            endDate: true,
            endTime: true,
            status: true,
            guestCount: true,
            unit: { select: { id: true, number: true } },
          },
          orderBy: { startDate: 'asc' },
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
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

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

    // Create booking — approvalMode determines if booking needs approval
    const needsApproval = amenity.approvalMode !== 'auto';
    const booking = await prisma.booking.create({
      data: {
        propertyId: amenity.propertyId,
        amenityId,
        unitId: input.unitId,
        residentId: input.residentId || auth.user.userId,
        createdById: auth.user.userId,
        referenceNumber: `AMN-${new Date().getFullYear()}-${Date.now().toString().slice(-5)}`,
        startDate: new Date(input.startDate),
        startTime: new Date(input.startTime),
        endDate: new Date(input.endDate),
        endTime: new Date(input.endTime),
        guestCount: input.guestCount,
        requestorComments: input.requestorComments || null,
        status: needsApproval ? 'pending' : 'approved',
        approvalStatus: needsApproval ? 'pending' : 'approved',
      },
    });

    return NextResponse.json(
      {
        data: booking,
        message: needsApproval ? 'Booking submitted for approval.' : 'Booking confirmed.',
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

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, unknown> = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.capacity !== undefined)
      updateData.capacity = body.capacity !== null ? Number(body.capacity) : null;
    if (body.fee !== undefined) updateData.fee = body.fee !== null ? Number(body.fee) : null;
    if (body.securityDeposit !== undefined)
      updateData.securityDeposit =
        body.securityDeposit !== null ? Number(body.securityDeposit) : null;
    if (body.requiresApproval !== undefined) updateData.requiresApproval = body.requiresApproval;
    if (body.approvalMode !== undefined) updateData.approvalMode = body.approvalMode;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.rules !== undefined) updateData.rules = body.rules;
    if (body.openTime !== undefined) updateData.openTime = body.openTime;
    if (body.closeTime !== undefined) updateData.closeTime = body.closeTime;
    if (body.maxConcurrent !== undefined)
      updateData.maxConcurrent = body.maxConcurrent !== null ? Number(body.maxConcurrent) : null;

    const amenity = await prisma.amenity.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ data: amenity, message: 'Amenity updated.' });
  } catch (error) {
    console.error('PATCH /api/v1/amenities/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update amenity' },
      { status: 500 },
    );
  }
}
