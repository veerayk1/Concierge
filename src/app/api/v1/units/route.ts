/**
 * Units API — List units for a property
 * Per PRD 07 Unit Management
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';
import { handleDemoRequest } from '@/server/demo';

export async function GET(request: NextRequest) {
  const demoRes = await handleDemoRequest(request);
  if (demoRes) return demoRes;
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const search = searchParams.get('search') || '';
    const buildingId = searchParams.get('buildingId');
    const floor = searchParams.get('floor');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '100', 10);

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    const where: Record<string, unknown> = { propertyId, deletedAt: null };
    if (buildingId) where.buildingId = buildingId;
    if (floor !== null && floor !== undefined && floor !== '') {
      const floorNum = parseInt(floor, 10);
      if (!Number.isNaN(floorNum)) where.floor = floorNum;
    }
    if (status) where.status = status;
    if (search) {
      where.OR = [{ number: { contains: search, mode: 'insensitive' } }];
    }

    const [units, total] = await Promise.all([
      prisma.unit.findMany({
        where,
        include: {
          building: { select: { id: true, name: true } },
          unitInstructions: {
            where: { isActive: true },
            select: { id: true, instructionText: true, priority: true },
          },
        },
        orderBy: { number: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.unit.count({ where }),
    ]);

    return NextResponse.json({
      data: units,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    console.error('GET /api/v1/units error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch units' },
      { status: 500 },
    );
  }
}
