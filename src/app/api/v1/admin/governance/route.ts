/**
 * GET /api/v1/admin/governance
 *
 * Single-call snapshot of what the board / property_admin actually
 * looks at every Monday morning:
 *
 *   - Occupancy %: units with at least one active OccupancyRecord
 *     vs total active units in the property.
 *   - Vendor compliance: count by status (compliant / expiring /
 *     expired / not_compliant / not_tracking) — flags the ones that
 *     need renewals before a vendor walks on site without coverage.
 *   - Outstanding amenity-booking fees: dollar amount still owed.
 *   - Recent move activity: occupants added or moved out in the last
 *     30 days.
 *
 * Each query is wrapped in Promise.allSettled — one model outage
 * shouldn't blank the entire governance feed.
 */

import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/server/db';
import { guardRoute, enforcePropertyAccess } from '@/server/middleware/api-guard';

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request, {
      roles: ['super_admin', 'property_admin', 'property_manager', 'board_member'],
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

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const thirtyDaysAhead = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    const [
      unitsRes,
      occupiedRes,
      vendorRollupRes,
      atRiskVendorsRes,
      expiringDocsRes,
      outstandingFeesRes,
      recentMovesRes,
    ] = await Promise.allSettled([
      prisma.unit.count({
        where: { propertyId, deletedAt: null },
      }),
      // Distinct units with at least one active occupancy.
      prisma.occupancyRecord
        .findMany({
          where: { propertyId, moveOutDate: null },
          select: { unitId: true },
          distinct: ['unitId'],
        })
        .then((rows) => rows.length),
      prisma.vendor.groupBy({
        by: ['complianceStatus'],
        where: { propertyId, isActive: true },
        _count: { _all: true },
      }),
      // Vendors flagged at-risk by their stored complianceStatus —
      // these are what the admin should chase first.
      prisma.vendor.findMany({
        where: {
          propertyId,
          isActive: true,
          complianceStatus: { in: ['expired', 'expiring', 'not_compliant'] },
        },
        select: {
          id: true,
          companyName: true,
          complianceStatus: true,
          serviceCategory: { select: { name: true } },
        },
        orderBy: { complianceStatus: 'asc' },
        take: 8,
      }),
      // Documents expiring in the next 30 days — early warning for
      // vendors whose stored status hasn't yet flipped to 'expiring'.
      prisma.vendorDocument.findMany({
        where: {
          vendor: { propertyId, isActive: true },
          expiresAt: { gte: new Date(), lte: thirtyDaysAhead },
        },
        select: {
          id: true,
          documentType: true,
          expiresAt: true,
          vendor: {
            select: { id: true, companyName: true, complianceStatus: true },
          },
        },
        orderBy: { expiresAt: 'asc' },
        take: 8,
      }),
      prisma.booking.aggregate({
        where: {
          propertyId,
          // "Owed" — booking is active and not paid in full yet.
          status: { in: ['pending', 'approved', 'completed'] },
          paymentStatus: { in: ['pending', 'overdue', 'partial_refund'] },
        },
        _sum: { totalAmount: true },
        _count: { _all: true },
      }),
      prisma.occupancyRecord.findMany({
        where: {
          propertyId,
          OR: [{ createdAt: { gte: thirtyDaysAgo } }, { moveOutDate: { gte: thirtyDaysAgo } }],
        },
        include: {
          unit: { select: { number: true } },
          user: { select: { firstName: true, lastName: true } },
        },
        orderBy: { updatedAt: 'desc' },
        take: 10,
      }),
    ]);

    const totalUnits = unitsRes.status === 'fulfilled' ? unitsRes.value : 0;
    const occupiedUnits = occupiedRes.status === 'fulfilled' ? occupiedRes.value : 0;
    const vacantUnits = Math.max(0, totalUnits - occupiedUnits);
    const occupancyPercent = totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

    const vendorBuckets: Record<string, number> = {
      compliant: 0,
      expiring: 0,
      expired: 0,
      not_compliant: 0,
      not_tracking: 0,
    };
    if (vendorRollupRes.status === 'fulfilled') {
      for (const row of vendorRollupRes.value) {
        vendorBuckets[row.complianceStatus] =
          (vendorBuckets[row.complianceStatus] ?? 0) + row._count._all;
      }
    }
    const vendorTotal = Object.values(vendorBuckets).reduce((a, b) => a + b, 0);
    const vendorAtRisk =
      (vendorBuckets.expired ?? 0) +
      (vendorBuckets.expiring ?? 0) +
      (vendorBuckets.not_compliant ?? 0);

    const atRiskVendors =
      atRiskVendorsRes.status === 'fulfilled'
        ? atRiskVendorsRes.value.map((v) => ({
            id: v.id,
            companyName: v.companyName,
            complianceStatus: v.complianceStatus,
            category: v.serviceCategory?.name ?? null,
          }))
        : [];

    // Early-warning expirations — surface vendors whose stored status
    // is still 'compliant'/'not_tracking' but who have a document about
    // to expire. (Vendors already flagged at-risk skip this list to
    // avoid double-counting.)
    const expiringDocs =
      expiringDocsRes.status === 'fulfilled'
        ? expiringDocsRes.value
            .filter(
              (d) =>
                d.vendor &&
                !['expired', 'expiring', 'not_compliant'].includes(d.vendor.complianceStatus),
            )
            .map((d) => ({
              id: d.id,
              documentType: d.documentType,
              expiresAt: d.expiresAt?.toISOString() ?? null,
              daysUntilExpiry: d.expiresAt
                ? Math.max(
                    0,
                    Math.ceil((d.expiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)),
                  )
                : null,
              vendorId: d.vendor!.id,
              vendorName: d.vendor!.companyName,
            }))
        : [];

    const outstandingTotal =
      outstandingFeesRes.status === 'fulfilled'
        ? Number(outstandingFeesRes.value._sum.totalAmount ?? 0)
        : 0;
    const outstandingCount =
      outstandingFeesRes.status === 'fulfilled' ? outstandingFeesRes.value._count._all : 0;

    const moves =
      recentMovesRes.status === 'fulfilled'
        ? recentMovesRes.value.map((m) => ({
            id: m.id,
            kind: m.moveOutDate && m.moveOutDate >= thirtyDaysAgo ? 'out' : 'in',
            unitNumber: m.unit?.number ?? null,
            name: [m.user?.firstName, m.user?.lastName].filter(Boolean).join(' ') || 'Resident',
            on: (m.moveOutDate ?? m.moveInDate).toISOString(),
            residentType: m.residentType,
          }))
        : [];

    return NextResponse.json({
      data: {
        occupancy: {
          totalUnits,
          occupiedUnits,
          vacantUnits,
          percent: occupancyPercent,
        },
        vendors: {
          total: vendorTotal,
          atRisk: vendorAtRisk,
          byStatus: vendorBuckets,
          atRiskList: atRiskVendors,
          expiringDocs,
        },
        outstandingFees: {
          total: outstandingTotal,
          count: outstandingCount,
        },
        recentMoves: moves,
      },
    });
  } catch (error) {
    console.error('GET /api/v1/admin/governance error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to load governance snapshot.' },
      { status: 500 },
    );
  }
}
