/**
 * AI Suggestions API — Rule-based actionable recommendations
 *
 * GET /api/v1/ai/suggestions — returns smart suggestions based on
 * pattern detection and anomaly analysis in building data.
 *
 * Suggestions include:
 * - Bulk package reminders for units with 3+ unreleased packages
 * - Anomaly detection for unusually high package volumes
 * - Overdue maintenance alerts
 *
 * Uses heuristics, not actual AI/ML.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';

/** Threshold for bulk package reminder suggestion. */
const BULK_PACKAGE_THRESHOLD = 3;

/** Multiplier above daily average to flag as anomaly. */
const ANOMALY_MULTIPLIER = 2;

/** Days to look back for daily average calculation. */
const AVERAGE_LOOKBACK_DAYS = 30;

interface Suggestion {
  type: string;
  priority: string;
  message: string;
  actionable: boolean;
}

// ---------------------------------------------------------------------------
// GET /api/v1/ai/suggestions
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

    const suggestions: Suggestion[] = [];
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const thirtyDaysAgo = new Date(now.getTime() - AVERAGE_LOOKBACK_DAYS * 24 * 60 * 60 * 1000);

    // -----------------------------------------------------------------------
    // 1. Bulk package reminders — units with 3+ unreleased packages
    // -----------------------------------------------------------------------

    const packagesByUnit = await prisma.package.groupBy({
      by: ['unitId'],
      where: {
        propertyId,
        status: 'unreleased',
        deletedAt: null,
      },
      _count: { id: true },
    });

    for (const group of packagesByUnit) {
      if (group._count.id >= BULK_PACKAGE_THRESHOLD) {
        suggestions.push({
          type: 'bulk_package_reminder',
          priority: 'medium',
          message: `${group._count.id} packages for unit ${group.unitId} — consider sending bulk reminder`,
          actionable: true,
        });
      }
    }

    // -----------------------------------------------------------------------
    // 2. Package volume anomaly detection
    // -----------------------------------------------------------------------

    const [todayPackageCount, thirtyDayPackageCount] = await Promise.all([
      prisma.package.count({
        where: {
          propertyId,
          createdAt: { gte: todayStart },
          deletedAt: null,
        },
      }),
      prisma.package.count({
        where: {
          propertyId,
          createdAt: { gte: thirtyDaysAgo },
          deletedAt: null,
        },
      }),
    ]);

    const dailyAverage = thirtyDayPackageCount / AVERAGE_LOOKBACK_DAYS;

    if (dailyAverage > 0 && todayPackageCount > dailyAverage * ANOMALY_MULTIPLIER) {
      suggestions.push({
        type: 'package_volume_anomaly',
        priority: 'high',
        message: `Unusually high package volume today: ${todayPackageCount} packages received vs ${Math.round(dailyAverage)}/day average. Consider allocating extra staff for package handling.`,
        actionable: true,
      });
    }

    // -----------------------------------------------------------------------
    // 3. Overdue maintenance suggestions
    // -----------------------------------------------------------------------

    const slaHours = 72;
    const slaThreshold = new Date(now.getTime() - slaHours * 60 * 60 * 1000);

    const overdueCount = await prisma.maintenanceRequest.count({
      where: {
        propertyId,
        status: { in: ['open', 'in_progress'] },
        createdAt: { lt: slaThreshold },
        deletedAt: null,
      },
    });

    if (overdueCount > 0) {
      suggestions.push({
        type: 'overdue_maintenance',
        priority: 'high',
        message: `${overdueCount} maintenance request${overdueCount !== 1 ? 's' : ''} past SLA threshold of ${slaHours}h. Review and escalate if needed.`,
        actionable: true,
      });
    }

    return NextResponse.json({
      data: { suggestions },
    });
  } catch (error) {
    console.error('GET /api/v1/ai/suggestions error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to generate suggestions' },
      { status: 500 },
    );
  }
}
