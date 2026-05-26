/**
 * GET /api/v1/my/visitors
 *
 * Resident-scoped visitor list — the resident's own pre-authorized
 * "Expecting someone?" entries plus any signed-in visitors still
 * on-site at their unit. Distinct from the staff-only
 * /api/v1/visitors which is building-wide.
 *
 * Default status is 'expected' (what the resident scheduled and hasn't
 * happened yet); pass ?status=active for currently on-site or
 * ?status=all for both, signed-out included.
 *
 * Tenancy: resolved via OccupancyRecord — the caller's unit is the
 * single unit they have an active occupancy at. No cross-tenant leak
 * because we never accept a unitId from the request body.
 */

import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request, {
      roles: ['resident_owner', 'resident_tenant', 'family_member', 'offsite_owner'],
    });
    if (auth.error) return auth.error;

    // Resolve the caller's unit via active occupancy. (Residents may
    // hold the legacy `users.unitId` column on the JWT, but the
    // truth-source is OccupancyRecord.)
    const occupancy = await prisma.occupancyRecord.findFirst({
      where: { userId: auth.user.userId, moveOutDate: null },
      select: { unitId: true, propertyId: true },
    });
    if (!occupancy) {
      // Not in a unit — nothing to show.
      return NextResponse.json({ data: [] });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') ?? 'expected';

    const now = new Date();
    const where: Record<string, unknown> = {
      propertyId: occupancy.propertyId,
      unitId: occupancy.unitId,
    };
    if (status === 'expected') {
      where.departureAt = null;
      where.arrivalAt = { gt: now };
    } else if (status === 'active' || status === 'signed_in') {
      where.departureAt = null;
      where.arrivalAt = { lte: now };
    } else if (status === 'signed_out') {
      where.departureAt = { not: null };
    }

    const rows = await prisma.visitorEntry.findMany({
      where,
      orderBy: { arrivalAt: 'asc' },
      take: 20,
      select: {
        id: true,
        visitorName: true,
        visitorType: true,
        arrivalAt: true,
        departureAt: true,
        comments: true,
      },
    });

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error('GET /api/v1/my/visitors error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to load your visitors.' },
      { status: 500 },
    );
  }
}
