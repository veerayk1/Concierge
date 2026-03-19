/**
 * Event Groups API — List event groups for a property
 * Used by the Event Type creation dialog to pick a parent group.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';

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

    const groups = await prisma.eventGroup.findMany({
      where: { propertyId, isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        sortOrder: true,
      },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ data: groups });
  } catch (error) {
    console.error('GET /api/v1/event-groups error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch event groups' },
      { status: 500 },
    );
  }
}
