/**
 * Equipment Maintenance History API
 * Per CLAUDE.md Phase 2
 *
 * Returns maintenance requests linked to a specific piece of equipment,
 * ordered by creation date descending.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';

// ---------------------------------------------------------------------------
// GET /api/v1/equipment/:id/history
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    // Verify equipment exists
    const equipment = await prisma.equipment.findUnique({
      where: { id, deletedAt: null },
    });

    if (!equipment) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Equipment not found' },
        { status: 404 },
      );
    }

    // Fetch maintenance history
    const history = await prisma.maintenanceRequest.findMany({
      where: {
        equipmentId: id,
        propertyId,
        deletedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        referenceNumber: true,
        description: true,
        status: true,
        priority: true,
        createdAt: true,
        completedDate: true,
      },
    });

    return NextResponse.json({ data: history });
  } catch (error) {
    console.error('GET /api/v1/equipment/:id/history error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch equipment history' },
      { status: 500 },
    );
  }
}
