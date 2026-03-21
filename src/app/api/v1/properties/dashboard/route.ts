/**
 * Cross-Property Dashboard API
 * Aggregates KPIs across all managed properties for the authenticated user.
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

    // Get all properties the user manages
    const userProperties = await prisma.userProperty.findMany({
      where: { userId, deletedAt: null },
      include: { property: true },
    });

    const propertyIds = userProperties.map((up) => up.propertyId);

    // Aggregate KPIs across all properties
    const [openEvents, openMaintenanceRequests, pendingPackages, upcomingBookings, totalUnits] =
      await Promise.all([
        prisma.event.count({
          where: { propertyId: { in: propertyIds }, status: 'open', deletedAt: null },
        }),
        prisma.maintenanceRequest.count({
          where: {
            propertyId: { in: propertyIds },
            status: { in: ['open', 'in_progress', 'on_hold'] },
            deletedAt: null,
          },
        }),
        prisma.package.count({
          where: { propertyId: { in: propertyIds }, status: 'unreleased', deletedAt: null },
        }),
        prisma.booking.count({
          where: {
            propertyId: { in: propertyIds },
            status: { in: ['pending', 'approved'] },
          },
        }),
        prisma.unit.count({
          where: { propertyId: { in: propertyIds }, deletedAt: null },
        }),
      ]);

    return NextResponse.json({
      data: {
        totalProperties: userProperties.length,
        totalUnits,
        openEvents,
        openMaintenanceRequests,
        pendingPackages,
        upcomingBookings,
        properties: userProperties.map((up) => ({
          id: up.property.id,
          name: up.property.name,
          isActive: up.property.isActive,
        })),
      },
    });
  } catch (error) {
    console.error('GET /api/v1/properties/dashboard error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch dashboard' },
      { status: 500 },
    );
  }
}
