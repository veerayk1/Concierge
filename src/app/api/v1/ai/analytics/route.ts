/**
 * AI Analytics API — Building health score and operational trends
 *
 * GET /api/v1/ai/analytics — returns health score, delivery trends,
 * and maintenance SLA compliance metrics.
 *
 * Health score is computed from weighted factors:
 * - Maintenance backlog (weight: 30%)
 * - Package handling speed (weight: 25%)
 * - Maintenance SLA compliance (weight: 25%)
 * - Open issue ratio (weight: 20%)
 *
 * All data is tenant-isolated by propertyId.
 * Uses database aggregations, not actual AI/ML.
 */

import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';

/** SLA threshold in hours. */
const SLA_HOURS = 72;

/** Days to look back for trend and SLA calculations. */
const LOOKBACK_DAYS = 90;

/** Number of weekly periods for delivery trend. */
const TREND_WEEKS = 4;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface Factor {
  name: string;
  score: number;
  weight: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// ---------------------------------------------------------------------------
// GET /api/v1/ai/analytics
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
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

    const now = new Date();
    const lookbackDate = new Date(now.getTime() - LOOKBACK_DAYS * 24 * 60 * 60 * 1000);
    const slaThreshold = new Date(now.getTime() - SLA_HOURS * 60 * 60 * 1000);

    // -------------------------------------------------------------------
    // Fetch data in parallel
    // -------------------------------------------------------------------

    const [
      openMaintenanceCount,
      overdueMaintenanceCount,
      closedMaintenance,
      recentPackages,
      totalPackagesLast30,
    ] = await Promise.all([
      // Open maintenance requests
      prisma.maintenanceRequest.count({
        where: {
          propertyId,
          status: { in: ['open', 'in_progress'] },
          deletedAt: null,
        },
      }),

      // Overdue maintenance (past SLA)
      prisma.maintenanceRequest.count({
        where: {
          propertyId,
          status: { in: ['open', 'in_progress'] },
          createdAt: { lt: slaThreshold },
          deletedAt: null,
        },
      }),

      // Closed maintenance with completion dates (for SLA calc)
      prisma.maintenanceRequest.findMany({
        where: {
          propertyId,
          status: 'closed',
          completedDate: { not: null },
          createdAt: { gte: lookbackDate },
          deletedAt: null,
        },
        select: { createdAt: true, completedDate: true },
      }),

      // Released packages with timing data (for delivery trend)
      prisma.package.findMany({
        where: {
          propertyId,
          releasedAt: { not: null },
          createdAt: { gte: lookbackDate },
          deletedAt: null,
        },
        select: { createdAt: true, releasedAt: true },
      }),

      // Total packages in last 30 days
      prisma.package.count({
        where: {
          propertyId,
          createdAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) },
          deletedAt: null,
        },
      }),
    ]);

    // -------------------------------------------------------------------
    // Maintenance SLA compliance
    // -------------------------------------------------------------------

    let maintenanceSlaCompliance = 100;
    if (closedMaintenance.length > 0) {
      const withinSla = closedMaintenance.filter((req) => {
        const created = new Date(req.createdAt).getTime();
        const completed = new Date(req.completedDate!).getTime();
        const hoursToResolve = (completed - created) / (1000 * 60 * 60);
        return hoursToResolve <= SLA_HOURS;
      });
      maintenanceSlaCompliance = Math.round((withinSla.length / closedMaintenance.length) * 100);
    }

    // -------------------------------------------------------------------
    // Package delivery time trends (weekly buckets)
    // -------------------------------------------------------------------

    const packageDeliveryTrend: Array<{
      period: string;
      count: number;
      avgDeliveryHours: number;
    }> = [];

    for (let w = 0; w < TREND_WEEKS; w++) {
      const weekEnd = new Date(now.getTime() - w * 7 * 24 * 60 * 60 * 1000);
      const weekStart = new Date(weekEnd.getTime() - 7 * 24 * 60 * 60 * 1000);

      const weekPackages = recentPackages.filter((p) => {
        const created = new Date(p.createdAt).getTime();
        return created >= weekStart.getTime() && created < weekEnd.getTime();
      });

      let avgDeliveryHours = 0;
      if (weekPackages.length > 0) {
        const totalHours = weekPackages.reduce((sum, p) => {
          const created = new Date(p.createdAt).getTime();
          const released = new Date(p.releasedAt!).getTime();
          return sum + (released - created) / (1000 * 60 * 60);
        }, 0);
        avgDeliveryHours = Math.round((totalHours / weekPackages.length) * 10) / 10;
      }

      packageDeliveryTrend.push({
        period: `week-${w + 1}`,
        count: weekPackages.length,
        avgDeliveryHours,
      });
    }

    // Reverse so most recent is last
    packageDeliveryTrend.reverse();

    // -------------------------------------------------------------------
    // Health score factors
    // -------------------------------------------------------------------

    // Factor 1: Maintenance backlog (fewer open = better)
    const maintenanceBacklogScore = clamp(
      openMaintenanceCount === 0 ? 100 : Math.max(0, 100 - openMaintenanceCount * 5),
      0,
      100,
    );

    // Factor 2: Package handling speed (based on avg hours)
    const avgPackageHours =
      recentPackages.length > 0
        ? recentPackages.reduce((sum, p) => {
            const created = new Date(p.createdAt).getTime();
            const released = new Date(p.releasedAt!).getTime();
            return sum + (released - created) / (1000 * 60 * 60);
          }, 0) / recentPackages.length
        : 0;
    const packageHandlingScore = clamp(
      avgPackageHours === 0 ? 100 : Math.max(0, 100 - avgPackageHours * 2),
      0,
      100,
    );

    // Factor 3: SLA compliance (direct percentage)
    const slaComplianceScore = maintenanceSlaCompliance;

    // Factor 4: Open issue ratio
    const openIssueScore = clamp(
      overdueMaintenanceCount === 0 ? 100 : Math.max(0, 100 - overdueMaintenanceCount * 10),
      0,
      100,
    );

    const factors: Factor[] = [
      { name: 'Maintenance Backlog', score: maintenanceBacklogScore, weight: 0.3 },
      { name: 'Package Handling', score: packageHandlingScore, weight: 0.25 },
      { name: 'SLA Compliance', score: slaComplianceScore, weight: 0.25 },
      { name: 'Open Issues', score: openIssueScore, weight: 0.2 },
    ];

    const healthScore = Math.round(factors.reduce((sum, f) => sum + f.score * f.weight, 0));

    // -------------------------------------------------------------------
    // Trend direction (compare to previous stored score)
    // -------------------------------------------------------------------

    const previousScore = await prisma.buildingHealthScore.findFirst({
      where: { propertyId },
      orderBy: { calculatedAt: 'desc' },
    });

    let trend: 'up' | 'down' | 'flat' = 'flat';
    if (previousScore) {
      const diff = healthScore - previousScore.score;
      if (diff > 2) trend = 'up';
      else if (diff < -2) trend = 'down';
    }

    // Store the new score
    await prisma.buildingHealthScore.create({
      data: {
        propertyId,
        score: healthScore,
        trend,
        trendChange: previousScore ? healthScore - previousScore.score : 0,
        period: '7_days',
        factors: factors as unknown as Prisma.InputJsonValue,
        calculatedBy: 'system',
      },
    });

    return NextResponse.json({
      data: {
        healthScore,
        trend,
        factors,
        packageDeliveryTrend,
        maintenanceSlaCompliance,
      },
    });
  } catch (error) {
    console.error('GET /api/v1/ai/analytics error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to calculate analytics' },
      { status: 500 },
    );
  }
}
