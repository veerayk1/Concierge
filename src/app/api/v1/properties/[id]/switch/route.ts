/**
 * Property Context Switch API
 * Allows a user to switch their active property context.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id: propertyId } = await params;
    const { userId } = auth.user;

    // Verify the user has access to this property
    const userProperty = await prisma.userProperty.findFirst({
      where: { userId, propertyId, deletedAt: null },
      include: {
        property: true,
        role: { select: { slug: true, name: true } },
      },
    });

    if (!userProperty) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'You do not have access to this property' },
        { status: 403 },
      );
    }

    return NextResponse.json({
      data: {
        propertyId,
        propertyName: userProperty.property.name,
        role: userProperty.role.slug,
      },
    });
  } catch (error) {
    console.error('POST /api/v1/properties/:id/switch error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to switch property' },
      { status: 500 },
    );
  }
}
