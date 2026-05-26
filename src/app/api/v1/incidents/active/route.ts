/**
 * GET /api/v1/incidents/active
 *
 * Returns incidents from the last 24 hours that managers / supervisors /
 * admins need to see at a glance on their dashboard:
 *
 *   - Anything urgent or high priority — even if "closed", they want to
 *     know it happened on their watch.
 *   - Anything still open regardless of priority.
 *
 * Ordered most-urgent-first, then newest-first. Capped at 12 — beyond
 * that it stops being a glanceable card and becomes a list page (which
 * is what /security/incidents already does).
 */

import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/server/db';
import { guardRoute, enforcePropertyAccess } from '@/server/middleware/api-guard';

const PRIORITY_RANK: Record<string, number> = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request, {
      roles: [
        'super_admin',
        'property_admin',
        'property_manager',
        'security_supervisor',
        'security_guard',
        'board_member',
        'superintendent',
        'front_desk',
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

    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const rows = await prisma.event.findMany({
      where: {
        propertyId,
        deletedAt: null,
        eventType: { slug: { in: ['incident-report', 'incident_report'] } },
        OR: [{ priority: { in: ['urgent', 'high'] } }, { status: 'open' }],
        createdAt: { gte: since },
      },
      include: {
        eventType: { select: { name: true } },
        unit: { select: { id: true, number: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    // Sort by priority rank first, then keep newest-first within rank.
    rows.sort((a, b) => {
      const pr = (PRIORITY_RANK[b.priority ?? ''] ?? 0) - (PRIORITY_RANK[a.priority ?? ''] ?? 0);
      if (pr !== 0) return pr;
      return b.createdAt.getTime() - a.createdAt.getTime();
    });

    return NextResponse.json({
      data: rows.slice(0, 12).map((r) => ({
        id: r.id,
        title: r.title,
        description: r.description,
        priority: r.priority,
        status: r.status,
        createdAt: r.createdAt,
        unit: r.unit ? { id: r.unit.id, number: r.unit.number } : null,
        category:
          (r.customFields as { category?: string } | null)?.category ??
          r.eventType?.name ??
          'Incident',
      })),
    });
  } catch (error) {
    console.error('GET /api/v1/incidents/active error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to load active incidents.' },
      { status: 500 },
    );
  }
}
