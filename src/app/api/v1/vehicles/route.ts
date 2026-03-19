/**
 * Vehicles API — per PRD 07 + 13
 * Manage resident vehicles for parking and security
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';

const createVehicleSchema = z.object({
  propertyId: z.string().uuid(),
  unitId: z.string().uuid(),
  make: z.string().min(1).max(50),
  model: z.string().min(1).max(50),
  color: z.string().max(30).optional(),
  year: z.number().int().min(1900).max(2030).optional(),
  licensePlate: z.string().min(1, 'License plate is required').max(20),
  provinceState: z.string().min(1).max(50),
  parkingSpot: z.string().max(20).optional(),
  notes: z.string().max(500).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const unitId = new URL(request.url).searchParams.get('unitId');
    const propertyId = new URL(request.url).searchParams.get('propertyId');

    const where: Record<string, unknown> = { deletedAt: null };
    if (unitId) where.unitId = unitId;
    if (propertyId) where.propertyId = propertyId;

    const vehicles = await prisma.vehicle.findMany({
      where,
      include: { unit: { select: { id: true, number: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data: vehicles });
  } catch (error) {
    console.error('GET /api/v1/vehicles error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch vehicles' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const body = await request.json();
    const parsed = createVehicleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;

    const vehicle = await prisma.vehicle.create({
      data: {
        propertyId: input.propertyId,
        unitId: input.unitId,
        userId: auth.user.userId,
        make: input.make,
        model: input.model,
        color: input.color || null,
        year: input.year || null,
        licensePlate: input.licensePlate.toUpperCase(),
        provinceState: input.provinceState,
        parkingSpot: input.parkingSpot || null,
        notes: input.notes || null,
      },
    });

    return NextResponse.json({ data: vehicle, message: 'Vehicle registered.' }, { status: 201 });
  } catch (error) {
    console.error('POST /api/v1/vehicles error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to register vehicle' },
      { status: 500 },
    );
  }
}
