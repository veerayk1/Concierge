/**
 * Cross-Property Search API
 * Searches across all properties the user has access to.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';
import { handleDemoRequest } from '@/server/demo';

export async function GET(request: NextRequest) {
  const demoRes = await handleDemoRequest(request);
  if (demoRes) return demoRes;

  try {
    const auth = await guardRoute(request, { roles: ['super_admin', 'property_admin'] });
    if (auth.error) return auth.error;

    const { userId } = auth.user;
    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q') || '';

    // Get all properties the user manages
    const userProperties = await prisma.userProperty.findMany({
      where: { userId, deletedAt: null },
    });
    const propertyIds = userProperties.map((up) => up.propertyId);

    // Search properties by name, address, or city
    const results = await prisma.property.findMany({
      where: {
        id: { in: propertyIds },
        deletedAt: null,
        ...(q
          ? {
              OR: [
                { name: { contains: q, mode: 'insensitive' } },
                { address: { contains: q, mode: 'insensitive' } },
                { city: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        province: true,
        unitCount: true,
        isActive: true,
        slug: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ data: results });
  } catch (error) {
    console.error('GET /api/v1/properties/search error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to search properties' },
      { status: 500 },
    );
  }
}
