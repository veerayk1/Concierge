/**
 * Parking Areas API — per PRD 13
 * Manage parking areas (P1 Underground, P2, Visitor Lot, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';

const createAreaSchema = z.object({
  propertyId: z.string().uuid(),
  buildingId: z.string().uuid().optional(),
  name: z.string().min(1).max(100),
  totalSpots: z.number().int().min(1).max(5000),
  type: z.enum(['underground', 'surface', 'visitor', 'reserved']).default('underground'),
});

export async function GET(request: NextRequest) {
  try {
    const propertyId = new URL(request.url).searchParams.get('propertyId');

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    const areas = await prisma.parkingArea.findMany({
      where: { propertyId, deletedAt: null },
      include: {
        _count: {
          select: {
            permits: { where: { status: 'active', deletedAt: null } },
            violations: { where: { status: 'open', deletedAt: null } },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      data: areas.map((a) => ({
        id: a.id,
        name: a.name,
        totalSpots: a.totalSpots,
        activePermits: a._count.permits,
        openViolations: a._count.violations,
        availableSpots: a.totalSpots - a._count.permits,
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
