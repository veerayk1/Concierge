/**
 * Buildings API — List and manage buildings within a property
 * Per PRD 01 Architecture (multi-building support)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';

const createBuildingSchema = z.object({
  propertyId: z.string().uuid(),
  name: z.string().min(1, 'Name is required').max(100),
  address: z.string().max(500).optional(),
  totalFloors: z.number().int().min(1).max(200).default(1),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin', 'property_admin'] });
    if (auth.error) return auth.error;

    const propertyId = new URL(request.url).searchParams.get('propertyId');

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    const buildings = await prisma.building.findMany({
      where: { propertyId, deletedAt: null },
      include: {
        _count: { select: { units: { where: { deletedAt: null } } } },
      },
      orderBy: { name: 'asc' },
    });

    const data = buildings.map((b) => ({
      id: b.id,
      name: b.name,
      address: b.address,
      totalFloors: b.totalFloors,
      totalUnits: b._count.units,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error('GET /api/v1/buildings error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch buildings' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin', 'property_admin'] });
    if (auth.error) return auth.error;

    const body = await request.json();
    const parsed = createBuildingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;

    const existing = await prisma.building.findFirst({
      where: { propertyId: input.propertyId, name: input.name, deletedAt: null },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'DUPLICATE', message: 'A building with this name already exists' },
        { status: 409 },
      );
    }

    const building = await prisma.building.create({
      data: {
        propertyId: input.propertyId,
        name: input.name,
        address: input.address || null,
        totalFloors: input.totalFloors,
      },
    });

    return NextResponse.json({ data: building, message: 'Building created.' }, { status: 201 });
  } catch (error) {
    console.error('POST /api/v1/buildings error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create building' },
      { status: 500 },
    );
  }
}
