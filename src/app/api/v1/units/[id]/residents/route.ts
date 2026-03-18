/**
 * Unit Residents API — per PRD 07
 * List residents assigned to a specific unit
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id: unitId } = await params;

    const unit = await prisma.unit.findUnique({
      where: { id: unitId, deletedAt: null },
      select: { id: true, number: true, propertyId: true },
    });

    if (!unit) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Unit not found' }, { status: 404 });
    }

    // Find users linked to this unit via UserProperty or unit assignments
    // For now, return users at the same property with resident roles
    const residents = await prisma.user.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        userProperties: {
          some: {
            propertyId: unit.propertyId,
            deletedAt: null,
            role: {
              slug: { in: ['resident_owner', 'resident_tenant', 'family_member'] },
            },
          },
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        userProperties: {
          where: { propertyId: unit.propertyId },
          select: { role: { select: { name: true, slug: true } } },
        },
      },
      orderBy: { lastName: 'asc' },
    });

    return NextResponse.json({
      data: residents.map((r) => ({
        id: r.id,
        firstName: r.firstName,
        lastName: r.lastName,
        email: r.email,
        phone: r.phone,
        role: r.userProperties[0]?.role ?? null,
      })),
    });
  } catch (error) {
    console.error('GET /api/v1/units/:id/residents error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch residents' },
      { status: 500 },
    );
  }
}
