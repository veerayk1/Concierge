/**
 * Occupancy Records API — Assign residents to units
 * Per PRD 07 Section 3.1.5 (Occupant Management)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';
import { handleDemoRequest } from '@/server/demo';
import { z } from 'zod';

const createOccupancySchema = z.object({
  unitId: z.string().uuid(),
  userId: z.string().uuid(),
  propertyId: z.string().uuid(),
  residentType: z.enum(['owner', 'tenant', 'offsite_owner', 'family_member']),
  moveInDate: z.string().refine((d) => !isNaN(Date.parse(d)), 'Invalid date'),
  isPrimary: z.boolean().default(false),
  notes: z.string().max(500).optional().nullable(),
});

// ---------------------------------------------------------------------------
// GET /api/v1/occupancy — List occupancy records
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const demoRes = await handleDemoRequest(request);
  if (demoRes) return demoRes;

  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const unitId = searchParams.get('unitId');
    const userId = searchParams.get('userId');
    const active = searchParams.get('active');

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    const where: Record<string, unknown> = { propertyId };
    if (unitId) where.unitId = unitId;
    if (userId) where.userId = userId;
    if (active === 'true') where.moveOutDate = null;
    if (active === 'false') where.moveOutDate = { not: null };

    const records = await prisma.occupancyRecord.findMany({
      where,
      include: {
        unit: { select: { id: true, number: true, floor: true } },
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { moveInDate: 'desc' },
    });

    return NextResponse.json({ data: records });
  } catch (error) {
    console.error('GET /api/v1/occupancy error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch occupancy records' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/occupancy — Assign resident to unit
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const demoRes = await handleDemoRequest(request);
  if (demoRes) return demoRes;

  try {
    const auth = await guardRoute(request, {
      roles: ['super_admin', 'property_admin', 'property_manager'],
    });
    if (auth.error) return auth.error;

    const body = await request.json();
    const parsed = createOccupancySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'Invalid input',
          fields: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const input = parsed.data;

    // Verify unit and user exist
    const [unit, user] = await Promise.all([
      prisma.unit.findFirst({
        where: { id: input.unitId, propertyId: input.propertyId, deletedAt: null },
      }),
      prisma.user.findFirst({
        where: { id: input.userId, deletedAt: null },
      }),
    ]);

    if (!unit) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Unit not found' }, { status: 404 });
    }
    if (!user) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'User not found' }, { status: 404 });
    }

    // Check for active occupancy of same user in same unit
    const existingOccupancy = await prisma.occupancyRecord.findFirst({
      where: {
        unitId: input.unitId,
        userId: input.userId,
        moveOutDate: null,
      },
    });

    if (existingOccupancy) {
      return NextResponse.json(
        {
          error: 'ALREADY_ASSIGNED',
          message: 'This resident is already assigned to this unit',
        },
        { status: 409 },
      );
    }

    // If isPrimary, unset any existing primary for this unit
    const record = await prisma.$transaction(async (tx) => {
      if (input.isPrimary) {
        await tx.occupancyRecord.updateMany({
          where: { unitId: input.unitId, moveOutDate: null, isPrimary: true },
          data: { isPrimary: false },
        });
      }

      const occupancy = await tx.occupancyRecord.create({
        data: {
          unitId: input.unitId,
          userId: input.userId,
          propertyId: input.propertyId,
          residentType: input.residentType,
          moveInDate: new Date(input.moveInDate),
          isPrimary: input.isPrimary,
          notes: input.notes ?? null,
          recordedById: auth.user.userId,
        },
        include: {
          unit: { select: { id: true, number: true } },
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });

      // Update unit status to occupied
      await tx.unit.update({
        where: { id: input.unitId },
        data: { status: 'occupied' },
      });

      return occupancy;
    });

    return NextResponse.json(
      {
        data: record,
        message: `${user.firstName} ${user.lastName} assigned to unit ${unit.number}`,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/v1/occupancy error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create occupancy record' },
      { status: 500 },
    );
  }
}
