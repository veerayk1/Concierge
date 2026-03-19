/**
 * Parking Areas API — per PRD 13
 * Manage parking areas (P1 Underground, P2, Visitor Lot, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';

const createAreaSchema = z.object({
  propertyId: z.string().uuid(),
  buildingId: z.string().uuid().optional(),
  areaName: z.string().min(1).max(50),
  areaCode: z.string().min(1).max(10),
  totalSpots: z.number().int().min(0).max(5000).default(0),
  visitorSpots: z.number().int().min(0).max(5000).default(0),
  description: z.string().max(200).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const propertyId = new URL(request.url).searchParams.get('propertyId');

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    const areas = await prisma.parkingArea.findMany({
      where: { propertyId, isActive: true },
      include: {
        _count: {
          select: {
            spots: true,
          },
        },
      },
      orderBy: { areaName: 'asc' },
    });

    return NextResponse.json({
      data: areas.map((a) => ({
        id: a.id,
        name: a.areaName,
        areaCode: a.areaCode,
        totalSpots: a.totalSpots,
        visitorSpots: a.visitorSpots,
        spotCount: a._count.spots,
      })),
    });
  } catch (error) {
    console.error('GET /api/v1/parking/areas error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch areas' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin', 'property_admin'] });
    if (auth.error) return auth.error;

    const body = await request.json();
    const parsed = createAreaSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const area = await prisma.parkingArea.create({ data: parsed.data });
    return NextResponse.json({ data: area, message: 'Parking area created.' }, { status: 201 });
  } catch (error) {
    console.error('POST /api/v1/parking/areas error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create area' },
      { status: 500 },
    );
  }
}
