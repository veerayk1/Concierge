/**
 * Amenities API — List amenities for a property
 * Per PRD 06 Amenity Booking
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const search = searchParams.get('search') || '';
    const groupId = searchParams.get('groupId');

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    const where: Record<string, unknown> = { propertyId, deletedAt: null };
    if (groupId) where.groupId = groupId;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const amenities = await (prisma.amenity.findMany as any)({
      where,
      include: {
        group: { select: { id: true, name: true } },
        bookings: {
          where: {
            status: { in: ['approved', 'pending'] },
            startDate: { gte: new Date() },
          },
          select: {
            id: true,
            startDate: true,
            startTime: true,
            endDate: true,
            endTime: true,
            status: true,
          },
          take: 5,
          orderBy: { startDate: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ data: amenities });
  } catch (error) {
    console.error('GET /api/v1/amenities error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch amenities' },
      { status: 500 },
    );
  }
}
