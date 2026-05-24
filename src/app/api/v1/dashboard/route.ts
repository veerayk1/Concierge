/**
 * Dashboard API — Role-aware real-time KPI calculations
 * Per PRD 14 Dashboard
 *
 * Returns KPI values, recent activity, and quick stats
 * tailored to the requesting user's role.
 *
 * Roles:
 * - Resident: sees only their own unit's packages, maintenance, announcements
 * - Front desk: building-wide packages, visitors, announcements
 * - Property manager / admin: all KPIs including financials and overdue metrics
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute, enforcePropertyAccess } from '@/server/middleware/api-guard';
import { RESIDENT_ROLES } from '@/types';
import { appCache } from '@/server/cache';

/** Default SLA threshold in hours for maintenance overdue calculation. */
const MAINTENANCE_SLA_HOURS = 72;

/** Days to look back for monthly package volume. */
const MONTHLY_VOLUME_DAYS = 30;

/** Days to look back for average resolution time calculation. */
const RESOLUTION_LOOKBACK_DAYS = 90;

export async function GET(request: NextRequest) {
  // Skip demo handler — uses the real database for consistent GET/POST
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }
    const _tenancy = enforcePropertyAccess(auth.user, propertyId);
    if (_tenancy) return _tenancy;

    const { userId, role } = auth.user;
    const isResident = RESIDENT_ROLES.has(role);

    // Check cache — key includes propertyId, userId, and role for tenant/role isolation
    const cacheKey = `dashboard:${propertyId}:${userId}:${role}`;
    const cached = appCache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { 'X-Cache': 'HIT' },
      });
    }

    // For residents, look up their unit via occupancy records
    let unitId: string | undefined;
    if (isResident) {
      const occupancy = await prisma.occupancyRecord.findFirst({
        where: {
          userId,
          propertyId,
          moveOutDate: null,
        },
        select: { unitId: true },
      });
      unitId = occupancy?.unitId;
    }

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const slaThreshold = new Date(now.getTime() - MAINTENANCE_SLA_HOURS * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - MONTHLY_VOLUME_DAYS * 24 * 60 * 60 * 1000);
    const resolutionLookback = new Date(
      now.getTime() - RESOLUTION_LOOKBACK_DAYS * 24 * 60 * 60 * 1000,
    );

    // Build unit scope for resident queries.
    // SECURITY: if a resident has no occupancy record (data gap, or invalid
    // demo user), DO NOT silently fall back to {} — that would expose the
    // entire building's events / packages / requests to that resident.
    // Instead, scope to an impossible id so all queries return empty.
    const unitScope = isResident
      ? { unitId: unitId || '00000000-0000-0000-0000-000000000000' }
      : {};

    // Fetch all KPIs in parallel
    const [
      unreleasedPackages,
      activeVisitors,
      openMaintenanceRequests,
      todayEvents,
      pendingBookingApprovals,
      unreadAnnouncements,
      overdueMaintenanceRequests,
      monthlyPackageVolume,
      recentlyClosedMaintenance,
      residentCount,
      keysOut,
      recentActivity,
    ] = await Promise.all([
      // 1. Unreleased packages
      prisma.package.count({
        where: {
          propertyId,
          status: 'unreleased',
          deletedAt: null,
          ...unitScope,
        },
      }),

      // 2. Active visitors (still in building)
      prisma.visitorEntry.count({
        where: {
          propertyId,
          departureAt: null,
          ...(isResident ? unitScope : {}),
        },
      }),

      // 3. Open maintenance requests
      prisma.maintenanceRequest.count({
        where: {
          propertyId,
          status: { in: ['open', 'in_progress'] },
          deletedAt: null,
          ...unitScope,
        },
      }),

      // 4. Today's community events
      prisma.communityEvent.count({
        where: {
          propertyId,
          startDatetime: { lte: todayEnd },
          endDatetime: { gte: todayStart },
          status: { in: ['active', 'in_progress'] },
        },
      }),

      // 5. Pending booking approvals
      prisma.booking.count({
        where: {
          propertyId,
          approvalStatus: 'pending',
          ...(isResident ? unitScope : {}),
        },
      }),

      // 6. Unread announcements (published, not deleted)
      prisma.announcement.count({
        where: {
          propertyId,
          status: 'published',
          deletedAt: null,
        },
      }),

      // 7. Overdue maintenance (open past SLA threshold)
      prisma.maintenanceRequest.count({
        where: {
          propertyId,
          status: { in: ['open', 'in_progress'] },
          createdAt: { lt: slaThreshold },
          deletedAt: null,
          ...unitScope,
        },
      }),

      // 8. Monthly package volume (last 30 days)
      prisma.package.count({
        where: {
          propertyId,
          createdAt: { gte: thirtyDaysAgo },
          deletedAt: null,
          ...unitScope,
        },
      }),

      // 9. Recently closed maintenance for resolution time calculation
      prisma.maintenanceRequest.findMany({
        where: {
          propertyId,
          status: 'closed',
          completedDate: { not: null },
          createdAt: { gte: resolutionLookback },
          deletedAt: null,
          ...unitScope,
        },
        select: {
          createdAt: true,
          completedDate: true,
        },
      }),

      // Resident headcount — staff only. Counts active occupants (no
      // move-out date) at this property. For residents we still issue the
      // promise but resolve to 0 to keep the destructure positional.
      isResident
        ? Promise.resolve(0)
        : prisma.occupancyRecord.count({
            where: { propertyId, moveOutDate: null },
          }),

      // Keys currently checked out — security/front-desk metric. Counts
      // KeyCheckout rows that have not been returned yet. Residents see 0.
      isResident
        ? Promise.resolve(0)
        : prisma.keyCheckout.count({
            where: { propertyId, returnTime: null },
          }),

      // Recent activity feed — for residents, scope to their own unit only.
      // Without this, every resident's dashboard listed incidents, patrol
      // logs, package events for OTHER units — a building-wide privacy leak.
      // Staff see the full property feed.
      prisma.event.findMany({
        where: {
          propertyId,
          deletedAt: null,
          ...(isResident ? unitScope : {}),
        },
        include: {
          eventType: { select: { name: true, icon: true, color: true } },
          unit: { select: { number: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    // Calculate average resolution time in hours
    let avgResolutionTimeHours = 0;
    if (recentlyClosedMaintenance.length > 0) {
      const totalHours = recentlyClosedMaintenance.reduce((sum, req) => {
        const created = new Date(req.createdAt).getTime();
        const completed = new Date(req.completedDate!).getTime();
        return sum + (completed - created) / (1000 * 60 * 60);
      }, 0);
      avgResolutionTimeHours = Math.round(totalHours / recentlyClosedMaintenance.length);
    }

    const responseBody = {
      data: {
        kpis: {
          unreleasedPackages,
          activeVisitors,
          openMaintenanceRequests,
          todayEvents,
          pendingBookingApprovals,
          unreadAnnouncements,
          overdueMaintenanceRequests,
          monthlyPackageVolume,
          avgResolutionTimeHours,
          residentCount,
          keysOut,
        },
        recentActivity: recentActivity.map((e) => ({
          id: e.id,
          type: e.eventType?.name || 'Event',
          title: e.title,
          unit: e.unit?.number,
          status: e.status,
          createdAt: e.createdAt,
        })),
      },
    };

    // Cache for 30 seconds — dashboard KPIs are high-traffic
    appCache.set(cacheKey, responseBody, {
      ttl: 30,
      tags: [`property:${propertyId}`, 'module:dashboard'],
    });

    return NextResponse.json(responseBody);
  } catch (error) {
    console.error('GET /api/v1/dashboard error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch dashboard data' },
      { status: 500 },
    );
  }
}
