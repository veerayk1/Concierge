/**
 * Dashboard API — Role-aware dashboard data
 * Per PRD 14 Dashboard
 *
 * Returns KPI values, recent activity, and quick stats
 * tailored to the requesting user's role.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const role = searchParams.get('role') || 'front_desk';

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    // Fetch counts in parallel
    const [unreleasedPackages, openMaintenanceRequests, openEvents, totalUnits, activeUsers] =
      await Promise.all([
        prisma.package.count({
          where: { propertyId, status: 'unreleased', deletedAt: null },
        }),
        prisma.maintenanceRequest.count({
          where: {
            propertyId,
            status: { in: ['open', 'assigned', 'in_progress'] },
            deletedAt: null,
          },
        }),
        prisma.event.count({
          where: { propertyId, status: { in: ['open', 'in_progress'] }, deletedAt: null },
        }),
        prisma.unit.count({
          where: { propertyId, deletedAt: null },
        }),
        prisma.user.count({
          where: {
            isActive: true,
            deletedAt: null,
            userProperties: { some: { propertyId, deletedAt: null } },
          },
        }),
      ]);

    // Recent events for activity feed
    const recentEvents = await prisma.event.findMany({
      where: { propertyId, deletedAt: null },
      include: {
        eventType: { select: { name: true, icon: true, color: true } },
        unit: { select: { number: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return NextResponse.json({
      data: {
        kpis: {
          unreleasedPackages,
          openMaintenanceRequests,
          openEvents,
          totalUnits,
          activeUsers,
        },
        recentActivity: recentEvents.map((e) => ({
          id: e.id,
          type: e.eventType?.name || 'Event',
          title: e.title,
          unit: e.unit?.number,
          status: e.status,
          createdAt: e.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('GET /api/v1/dashboard error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch dashboard data' },
      { status: 500 },
    );
  }
}
