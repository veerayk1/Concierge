/**
 * GET /api/v1/system/platform-kpis
 *
 * Platform-level aggregated KPIs for the Super Admin dashboard.
 * Returns counts that drive the four hero tiles:
 *   - totalProperties
 *   - activeUsers      — count of users with isActive=true across all properties
 *   - activeSubscriptions — count of subscriptions where status='ACTIVE'
 *   - platformHealth   — 100 - (open critical incidents / 10), clamped 0..100
 *
 * Per docs/QUALITY-BAR.md Section A8 + the "stop showing — for missing data"
 * dashboard fix. Existed only as hard-coded em-dashes before this commit.
 *
 * Super admin only — leaks subscription state otherwise.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin'] });
    if (auth.error) return auth.error;

    const [propertyCount, activeUserCount, activeSubscriptionCount, openCriticalIncidents] =
      await Promise.all([
        prisma.property.count({ where: { isActive: true, deletedAt: null } }),
        prisma.user.count({ where: { isActive: true, deletedAt: null } }),
        prisma.subscription.count({ where: { status: 'ACTIVE' } }),
        prisma.event.count({
          where: {
            priority: 'critical',
            status: { in: ['open', 'in_progress'] },
            deletedAt: null,
          },
        }),
      ]);

    // Platform health: simple heuristic — 100 minus 10 per open critical
    // incident, clamped 0..100. Good enough for first-cut; can graduate to
    // a real composite (error rate + uptime + p95 latency) later.
    const platformHealth = Math.max(0, Math.min(100, 100 - openCriticalIncidents * 10));

    return NextResponse.json({
      data: {
        totalProperties: propertyCount,
        activeUsers: activeUserCount,
        activeSubscriptions: activeSubscriptionCount,
        platformHealth,
        openCriticalIncidents,
      },
    });
  } catch (error) {
    console.error('GET /api/v1/system/platform-kpis error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch platform KPIs' },
      { status: 500 },
    );
  }
}
