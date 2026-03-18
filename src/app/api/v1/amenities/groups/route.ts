/**
 * Amenity Groups API — per PRD 06
 * Organize amenities into groups (Recreation, Events, Work, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';

const createGroupSchema = z.object({
  propertyId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  sortOrder: z.number().int().min(0).default(0),
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

    const groups = await prisma.amenityGroup.findMany({
      where: { propertyId, deletedAt: null },
      include: {
        _count: { select: { amenities: { where: { deletedAt: null } } } },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({
      data: groups.map((g) => ({ ...g, amenityCount: g._count.amenities })),
    });
  } catch (error) {
    console.error('GET /api/v1/amenities/groups error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch groups' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createGroupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const group = await prisma.amenityGroup.create({ data: parsed.data });
    return NextResponse.json({ data: group, message: 'Group created.' }, { status: 201 });
  } catch (error) {
    console.error('POST /api/v1/amenities/groups error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create group' },
      { status: 500 },
    );
  }
}
