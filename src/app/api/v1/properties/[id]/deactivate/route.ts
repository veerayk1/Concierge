/**
 * Property Deactivation API
 * Soft-disables a property while retaining all data.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin', 'property_admin'] });
    if (auth.error) return auth.error;

    const { id } = await params;

    const existing = await prisma.property.findUnique({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Property not found' },
        { status: 404 },
      );
    }

    const property = await prisma.property.update({
      where: { id },
      data: { isActive: false },
    });

    return NextResponse.json({ data: property });
  } catch (error) {
    console.error('POST /api/v1/properties/:id/deactivate error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to deactivate property' },
      { status: 500 },
    );
  }
}
