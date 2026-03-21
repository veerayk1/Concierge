/**
 * Staff Properties API
 * Lists all properties a given staff member is assigned to.
 * Used to verify multi-property staff assignments.
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

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'userId query parameter is required' },
        { status: 400 },
      );
    }

    const assignments = await prisma.userProperty.findMany({
      where: { userId, deletedAt: null },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            isActive: true,
          },
        },
        role: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return NextResponse.json({ data: assignments });
  } catch (error) {
    console.error('GET /api/v1/properties/staff-properties error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch staff properties' },
      { status: 500 },
    );
  }
}
