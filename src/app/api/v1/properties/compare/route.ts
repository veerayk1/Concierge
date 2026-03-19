/**
 * Property Comparison API
 * Side-by-side metrics for selected properties.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin', 'property_admin'] });
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const idsParam = searchParams.get('ids') || '';
    const ids = idsParam
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);

    if (ids.length < 2) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'At least 2 property IDs are required for comparison',
        },
        { status: 400 },
      );
    }

    const properties = await prisma.property.findMany({
      where: { id: { in: ids }, deletedAt: null },
    });

    // Gather per-property metrics in parallel
    const comparison = await Promise.all(
      properties.map(async (property) => {
        const [events, maintenance, packages, units] = await Promise.all([
          prisma.event.count({
            where: { propertyId: property.id, status: 'open', deletedAt: null },
          }),
          prisma.maintenanceRequest.count({
            where: {
              propertyId: property.id,
              status: { in: ['open', 'in_progress'] },
              deletedAt: null,
            },
          }),
          prisma.package.count({
            where: { propertyId: property.id, status: 'unreleased', deletedAt: null },
          }),
          prisma.unit.count({
            where: { propertyId: property.id, deletedAt: null },
          }),
        ]);

        return {
          property: {
            id: property.id,
            name: property.name,
            address: property.address,
            city: property.city,
          },
          metrics: {
            totalUnits: units,
            openEvents: events,
            openMaintenanceRequests: maintenance,
            pendingPackages: packages,
          },
        };
      }),
    );

    return NextResponse.json({ data: comparison });
  } catch (error) {
    console.error('GET /api/v1/properties/compare error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to compare properties' },
      { status: 500 },
    );
  }
}
