/**
 * Storage Spots API — per PRD 04
 * Manage physical storage locations for packages
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';

const createStorageSpotSchema = z.object({
  propertyId: z.string().uuid(),
  name: z.string().min(1).max(100),
  code: z.string().min(1).max(20),
  capacity: z.number().int().min(1).max(1000).optional(),
  type: z.enum(['shelf', 'fridge', 'floor', 'locker', 'room']).default('shelf'),
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

    const spots = await prisma.storageSpot.findMany({
      where: { propertyId, deletedAt: null },
      include: {
        _count: {
          select: { packages: { where: { status: 'unreleased', deletedAt: null } } },
        },
      },
      orderBy: { name: 'asc' },
    });

    const data = spots.map((s) => ({
      id: s.id,
      name: s.name,
      code: s.code,
      capacity: s.capacity,
      currentCount: s._count.packages,
      isFull: s.capacity ? s._count.packages >= s.capacity : false,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error('GET /api/v1/storage-spots error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch storage spots' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const body = await request.json();
    const parsed = createStorageSpotSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;

    const spot = await prisma.storageSpot.create({
      data: {
        propertyId: input.propertyId,
        name: input.name,
        code: input.code,
        capacity: input.capacity || null,
      },
    });

    return NextResponse.json({ data: spot, message: 'Storage spot created.' }, { status: 201 });
  } catch (error) {
    console.error('POST /api/v1/storage-spots error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create storage spot' },
      { status: 500 },
    );
  }
}
