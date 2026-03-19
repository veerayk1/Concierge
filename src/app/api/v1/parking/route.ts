/**
 * Parking API — Permits and Violations
 * Per PRD 13 Parking Management
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
    const type = searchParams.get('type'); // permits or violations
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    if (type === 'violations') {
      const where: Record<string, unknown> = { propertyId, deletedAt: null };
      if (status) where.status = status;
      if (search) {
        where.OR = [
          { licensePlate: { contains: search, mode: 'insensitive' } },
          { location: { contains: search, mode: 'insensitive' } },
        ];
      }

      const violations = await prisma.parkingViolation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json({ data: violations });
    }

    // Default: permits
    const where: Record<string, unknown> = { propertyId, deletedAt: null };
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { referenceNumber: { contains: search, mode: 'insensitive' } },
        { licensePlate: { contains: search, mode: 'insensitive' } },
      ];
    }

    const permits = await prisma.parkingPermit.findMany({
      where,
      include: {
        unit: { select: { id: true, number: true } },
        permitType: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data: permits });
  } catch (error) {
    console.error('GET /api/v1/parking error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch parking data' },
      { status: 500 },
    );
  }
}
