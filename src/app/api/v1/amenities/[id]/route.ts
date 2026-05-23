/**
 * Amenity Detail + Booking API
 * Per PRD 06
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute, enforcePropertyAccess } from '@/server/middleware/api-guard';

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

    // Amenity detail includes the upcoming bookings list (unit + resident
    // hints). Block cross-tenant reads.
    const tenancy = enforcePropertyAccess(auth.user, amenity.propertyId);
    if (tenancy) return tenancy;

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

    // Tenancy: a resident at Property A must not book amenities at Property B.
    // Without this guard a resident could enumerate amenity ids across the
    // platform and flood other buildings with bookings.
    const tenancy = enforcePropertyAccess(auth.user, amenity.propertyId);
    if (tenancy) return tenancy;

    // Validate unit belongs to the amenity's property — otherwise a
    // resident at A could book A's pool but tag the booking against
    // a Property B unit (breaking unit-scoped booking history).
    const bookingUnit = await prisma.unit.findUnique({
      where: { id: input.unitId },
      select: { propertyId: true },
    });
    if (!bookingUnit || bookingUnit.propertyId !== amenity.propertyId) {
      return NextResponse.json(
        { error: 'INVALID_UNIT', message: 'Unit does not belong to this property.' },
        { status: 400 },
      );
    }

    // Past-date guard — bookings must be in the future. Without this you
    // can backdate a booking to 2020 to retroactively claim usage or
    // tamper with audit trails.
    const startsAt = new Date(input.startTime);
    if (Number.isNaN(startsAt.getTime()) || startsAt.getTime() < Date.now() - 60_000) {
      return NextResponse.json(
        { error: 'INVALID_TIME', message: 'Start time must be in the future.' },
        { status: 400 },
      );
    }
    const endsAt = new Date(input.endTime);
    if (endsAt.getTime() <= startsAt.getTime()) {
      return NextResponse.json(
        { error: 'INVALID_TIME', message: 'End time must be after start time.' },
        { status: 400 },
      );
    }

    // residentId spoofing guard. The previous implementation accepted
    // any residentId from the body and used it verbatim, so Resident A
    // could POST { residentId: B } and the booking would be charged to
    // Resident B (who never authorized it). Staff have a legitimate need
    // to book on behalf of residents (front desk taking a call); enforce
    // a role check before allowing a non-self residentId.
    const STAFF_ROLES = new Set<string>([
      'super_admin',
      'property_admin',
      'property_manager',
      'front_desk',
      'security_supervisor',
      'superintendent',
    ]);
    const requestedResidentId = input.residentId ?? auth.user.userId;
    if (requestedResidentId !== auth.user.userId && !STAFF_ROLES.has(auth.user.role)) {
      return NextResponse.json(
        {
          error: 'FORBIDDEN',
          message: 'Only staff can book on behalf of another resident.',
        },
        { status: 403 },
      );
    }

    // Conflict detection inside a SERIALIZABLE transaction. Without this two
    // residents can POST identical slots concurrently and BOTH succeed —
    // verified pre-fix: 7/8 concurrent POSTs on the same maxConcurrent=1
    // amenity slot all returned 201. The sibling /api/v1/bookings POST
    // already does this; this route was a parallel write path that bypassed
    // it. Compose date+time so a 14:00–16:00 booking on Aug 13 does not
    // collide with 14:00–16:00 on a different day (Postgres TIME column
    // ignores the date side of the comparison if you filter on time alone).
    const needsApproval = amenity.approvalMode !== 'auto';
    const referenceNumber = `AMN-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}`;

    let booking;
    try {
      booking = await prisma.$transaction(
        async (tx) => {
          const startIso = startsAt.toISOString();
          const endIso = endsAt.toISOString();
          const overlapRows = await tx.$queryRaw<{ count: bigint }[]>`
            SELECT COUNT(*)::bigint AS count
            FROM bookings
            WHERE "amenityId" = ${amenityId}::uuid
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
              propertyId: amenity.propertyId,
              amenityId,
              unitId: input.unitId,
              residentId: requestedResidentId,
              createdById: auth.user.userId,
              referenceNumber,
              startDate: new Date(input.startDate),
              startTime: startsAt,
              endDate: new Date(input.endDate),
              endTime: endsAt,
              guestCount: input.guestCount,
              requestorComments: input.requestorComments || null,
              status: needsApproval ? 'pending' : 'approved',
              approvalStatus: needsApproval ? 'pending' : 'approved',
            },
          });
        },
        { isolationLevel: 'Serializable' },
      );
    } catch (e) {
      const status = (e as { _status?: number })?._status;
      if (status === 409) {
        return NextResponse.json(
          {
            error: 'CONFLICT',
            message: 'This amenity is already booked for the requested time.',
          },
          { status: 409 },
        );
      }
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
    // Amenity config (name, fee, rules, hours, approval mode) is staff-only.
    // The previous version had no role gate at all — any logged-in resident
    // could change the booking fee on their own building's pool or rewrite
    // the rules. Lock to admins.
    const auth = await guardRoute(request, {
      roles: ['super_admin', 'property_admin', 'property_manager'],
    });
    if (auth.error) return auth.error;

    const { id } = await params;
    const body = await request.json();

    // Tenancy guard — even with the role gate, a property_admin at A must
    // not edit amenities at B.
    const target = await prisma.amenity.findUnique({
      where: { id, deletedAt: null },
      select: { propertyId: true },
    });
    if (!target) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Amenity not found' },
        { status: 404 },
      );
    }
    const tenancy = enforcePropertyAccess(auth.user, target.propertyId);
    if (tenancy) return tenancy;

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
