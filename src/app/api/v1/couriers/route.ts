/**
 * Couriers API — per PRD 04
 * List and manage courier types for package intake
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';

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

    const couriers = await prisma.courierType.findMany({
      where: { propertyId, deletedAt: null, isActive: true },
      select: {
        id: true,
        name: true,
        icon: true,
        color: true,
        isSystem: true,
        notificationTemplate: true,
      },
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
    });

    return NextResponse.json({ data: couriers });
  } catch (error) {
    console.error('GET /api/v1/couriers error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch couriers' },
      { status: 500 },
    );
  }
}
