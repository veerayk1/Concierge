/**
 * GET /api/v1/manager/briefing
 *
 * One-paragraph synthesised briefing for the property_admin /
 * property_manager / board_member at the start of their day.
 * Tuned for governance signals:
 *
 *   - At-risk vendors (compliance: expired / expiring / not_compliant)
 *   - Stalled decisions sitting in the queue > 24h
 *   - Maintenance backlog (urgent + unassigned)
 *   - Recent move-ins to acknowledge
 *   - Building's busiest amenity today
 */

import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/server/db';
import { guardRoute, enforcePropertyAccess } from '@/server/middleware/api-guard';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Late night';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Quiet evening';
}

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request, {
      roles: [
        'super_admin',
        'property_admin',
        'property_manager',
        'board_member',
        'superintendent',
      ],
    });
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required.' },
        { status: 400 },
      );
    }
    const tenancy = enforcePropertyAccess(auth.user, propertyId);
    if (tenancy) return tenancy;

    const me = await prisma.user.findUnique({
      where: { id: auth.user.userId },
      select: { firstName: true },
    });

    const now = new Date();
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const [
      atRiskVendors,
      stalledAlterations,
      stalledBookings,
      urgentUnassignedMaintenance,
      recentMoveIns,
    ] = await Promise.all([
      prisma.vendor.count({
        where: {
          propertyId,
          isActive: true,
          complianceStatus: { in: ['expired', 'expiring', 'not_compliant'] },
        },
      }),
      prisma.alterationProject.count({
        where: {
          propertyId,
          deletedAt: null,
          status: { in: ['submitted', 'under_review'] },
          createdAt: { lt: yesterday },
        },
      }),
      prisma.booking.count({
        where: {
          propertyId,
          approvalStatus: 'pending',
          status: { notIn: ['cancelled', 'declined'] },
          createdAt: { lt: yesterday },
        },
      }),
      prisma.maintenanceRequest.count({
        where: {
          propertyId,
          deletedAt: null,
          status: { in: ['open', 'on_hold'] },
          priority: { in: ['critical', 'high'] },
          assignedEmployeeId: null,
          assignedVendorId: null,
        },
      }),
      prisma.occupancyRecord.findMany({
        where: {
          propertyId,
          moveInDate: { gte: thirtyDaysAgo },
        },
        include: {
          unit: { select: { number: true } },
          user: { select: { firstName: true, lastName: true } },
        },
        orderBy: { moveInDate: 'desc' },
        take: 3,
      }),
    ]);

    const paragraphs: string[] = [];
    paragraphs.push(`${greeting()}, ${me?.firstName ?? 'manager'}.`);

    if (atRiskVendors > 0) {
      paragraphs.push(
        `${atRiskVendors} vendor${atRiskVendors === 1 ? '' : 's'} flagged for compliance — chase those certificates before they walk back on site.`,
      );
    }
    if (urgentUnassignedMaintenance > 0) {
      paragraphs.push(
        `${urgentUnassignedMaintenance} urgent maintenance request${urgentUnassignedMaintenance === 1 ? '' : 's'} still without a vendor or staff member — those won't move on their own.`,
      );
    }
    const stalledDecisions = stalledAlterations + stalledBookings;
    if (stalledDecisions > 0) {
      const parts: string[] = [];
      if (stalledAlterations > 0)
        parts.push(`${stalledAlterations} alteration${stalledAlterations === 1 ? '' : 's'}`);
      if (stalledBookings > 0)
        parts.push(`${stalledBookings} amenity booking${stalledBookings === 1 ? '' : 's'}`);
      paragraphs.push(
        `${parts.join(' and ')} ${stalledDecisions === 1 ? 'has' : 'have'} been waiting on you over 24 hours.`,
      );
    }
    if (recentMoveIns.length > 0) {
      const m = recentMoveIns[0]!;
      const name =
        [m.user?.firstName, m.user?.lastName].filter(Boolean).join(' ') || 'A new resident';
      const more =
        recentMoveIns.length > 1
          ? ` and ${recentMoveIns.length - 1} other new resident${recentMoveIns.length > 2 ? 's' : ''}`
          : '';
      paragraphs.push(`${name} moved into Unit ${m.unit?.number ?? '—'}${more} in the last month.`);
    }

    if (paragraphs.length === 1) {
      paragraphs.push('The building is running cleanly — nothing waiting on you.');
    }

    return NextResponse.json({
      data: {
        paragraphs,
        highlights: {
          atRiskVendors,
          stalledAlterations,
          stalledBookings,
          urgentUnassignedMaintenance,
          recentMoveIns: recentMoveIns.length,
        },
      },
    });
  } catch (error) {
    console.error('GET /api/v1/manager/briefing error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to load manager briefing.' },
      { status: 500 },
    );
  }
}
