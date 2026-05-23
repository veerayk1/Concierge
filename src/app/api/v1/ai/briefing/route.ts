/**
 * AI Briefing API — Rule-based shift briefing generation
 *
 * GET  /api/v1/ai/briefing  — returns cached or freshly generated briefing
 * POST /api/v1/ai/briefing  — force-regenerate the briefing
 *
 * Briefings are role-aware: front desk, security, and managers
 * each see summaries tailored to their operational priorities.
 * Uses database aggregations, not actual AI/ML.
 */

import { NextRequest, NextResponse } from 'next/server';
import type { Prisma } from '@prisma/client';
import { prisma } from '@/server/db';
import { guardRoute, enforcePropertyAccess } from '@/server/middleware/api-guard';

/** Cache duration in milliseconds (15 minutes). */
const CACHE_TTL_MS = 15 * 60 * 1000;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

interface BriefingSections {
  packages: { unreleasedCount: number };
  visitors: { activeCount: number };
  maintenance: { openCount: number };
  approvals: { pendingCount: number };
  weather: { description: string };
  alerts: { count: number };
  handoff: { notes: string | null; flaggedItems: unknown[] };
}

interface BriefingContent {
  summary: string;
  sections: BriefingSections;
}

function generateSummary(role: string, sections: BriefingSections): string {
  const { packages, visitors, maintenance, approvals, alerts, handoff } = sections;

  // Residents see ONLY their own unit's stats — no building-wide ops numbers.
  // Without this branch they fell through to the front-desk default and the
  // briefing leaked things like "8 booking approvals pending review" which is
  // not their concern and exposes building-wide activity.
  if (
    role === 'resident_owner' ||
    role === 'resident_tenant' ||
    role === 'family_member' ||
    role === 'offsite_owner'
  ) {
    const parts: string[] = [];
    if (packages.unreleasedCount > 0) {
      parts.push(
        `You have ${packages.unreleasedCount} package${packages.unreleasedCount !== 1 ? 's' : ''} waiting for pickup`,
      );
    }
    if (maintenance.openCount > 0) {
      parts.push(
        `${maintenance.openCount} of your service request${maintenance.openCount !== 1 ? 's' : ''} ${maintenance.openCount !== 1 ? 'are' : 'is'} still open`,
      );
    }
    if (parts.length === 0) {
      return 'All caught up — no packages or open requests for your unit today.';
    }
    return parts.join('. ') + '.';
  }

  // Board members: governance-level summary
  if (role === 'board_member') {
    const parts: string[] = [];
    parts.push(
      `${maintenance.openCount} open maintenance request${maintenance.openCount !== 1 ? 's' : ''} across the building`,
    );
    if (alerts.count > 0) {
      parts.push(`${alerts.count} security alert${alerts.count !== 1 ? 's' : ''} today`);
    }
    return parts.join('. ') + '.';
  }

  // Security roles: emphasize alerts and incidents
  if (role === 'security_guard' || role === 'security_supervisor') {
    const parts: string[] = [];
    parts.push(`${alerts.count} active alert${alerts.count !== 1 ? 's' : ''} require attention`);
    if (visitors.activeCount > 0) {
      parts.push(
        `${visitors.activeCount} visitor${visitors.activeCount !== 1 ? 's' : ''} currently on-site`,
      );
    }
    if (handoff.notes) {
      parts.push('review handoff notes from previous shift');
    }
    return parts.join('. ') + '.';
  }

  // Manager roles: emphasize maintenance SLA and approvals
  if (role === 'property_manager' || role === 'property_admin' || role === 'super_admin') {
    const parts: string[] = [];
    parts.push(
      `${maintenance.openCount} open maintenance request${maintenance.openCount !== 1 ? 's' : ''}`,
    );
    parts.push(
      `${approvals.pendingCount} pending approval${approvals.pendingCount !== 1 ? 's' : ''}`,
    );
    if (packages.unreleasedCount > 0) {
      parts.push(
        `${packages.unreleasedCount} unreleased package${packages.unreleasedCount !== 1 ? 's' : ''}`,
      );
    }
    return parts.join('. ') + '.';
  }

  // Front desk (default): emphasize packages and visitors
  const parts: string[] = [];
  parts.push(
    `${packages.unreleasedCount} unreleased package${packages.unreleasedCount !== 1 ? 's' : ''} awaiting pickup`,
  );
  parts.push(
    `${visitors.activeCount} active visitor${visitors.activeCount !== 1 ? 's' : ''} on-site`,
  );
  if (maintenance.openCount > 0) {
    parts.push(
      `${maintenance.openCount} open maintenance request${maintenance.openCount !== 1 ? 's' : ''}`,
    );
  }
  return parts.join('. ') + '.';
}

async function generateBriefingData(
  propertyId: string,
  role: string,
  userId?: string,
): Promise<BriefingContent> {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  // For residents, look up their unit so the counts are scoped to just them.
  // Without this, a resident sees "13 active visitors" / "8 pending approvals"
  // building-wide — a privacy leak and confusing UX.
  const isResident =
    role === 'resident_owner' ||
    role === 'resident_tenant' ||
    role === 'family_member' ||
    role === 'offsite_owner';
  let residentUnitId: string | undefined;
  if (isResident && userId) {
    const occupancy = await prisma.occupancyRecord.findFirst({
      where: { userId, propertyId, moveOutDate: null },
      select: { unitId: true },
    });
    residentUnitId = occupancy?.unitId;
  }
  // SECURITY: if resident has no occupancy record, scope to impossible id so
  // counts come back zero rather than leaking the building-wide totals.
  const residentScope = isResident
    ? { unitId: residentUnitId || '00000000-0000-0000-0000-000000000000' }
    : {};

  const [
    unreleasedCount,
    activeVisitorCount,
    openMaintenanceCount,
    pendingApprovalCount,
    alertCount,
    handoff,
  ] = await Promise.all([
    prisma.package.count({
      where: { propertyId, status: 'unreleased', deletedAt: null, ...residentScope },
    }),
    // Residents don't have a "visitors building-wide" widget — they care about
    // their own incoming visitors. For now, hide entirely (count = 0).
    isResident
      ? Promise.resolve(0)
      : prisma.visitorEntry.count({
          where: { propertyId, departureAt: null },
        }),
    prisma.maintenanceRequest.count({
      where: {
        propertyId,
        status: { in: ['open', 'in_progress'] },
        deletedAt: null,
        ...residentScope,
      },
    }),
    // Booking approvals are a manager concern; hide from residents.
    isResident
      ? Promise.resolve(0)
      : prisma.booking.count({
          where: { propertyId, approvalStatus: 'pending' },
        }),
    // Alerts (today's open events) — hide from residents (they're not on-call).
    isResident
      ? Promise.resolve(0)
      : prisma.event.count({
          where: {
            propertyId,
            status: { in: ['open', 'in_progress'] },
            createdAt: { gte: todayStart },
            deletedAt: null,
          },
        }),
    isResident
      ? Promise.resolve(null)
      : prisma.shiftHandoff.findFirst({
          where: { propertyId },
          orderBy: { createdAt: 'desc' },
        }),
  ]);

  const sections: BriefingSections = {
    packages: { unreleasedCount },
    visitors: { activeCount: activeVisitorCount },
    maintenance: { openCount: openMaintenanceCount },
    approvals: { pendingCount: pendingApprovalCount },
    weather: { description: 'Sunny, 22\u00B0C — conditions normal' },
    alerts: { count: alertCount },
    handoff: {
      notes: handoff?.notes ?? null,
      flaggedItems: (handoff?.flaggedItems as unknown[]) ?? [],
    },
  };

  const summary = generateSummary(role, sections);

  return { summary, sections };
}

// ---------------------------------------------------------------------------
// GET /api/v1/ai/briefing
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
    const _tenancy = enforcePropertyAccess(auth.user, propertyId);
    if (_tenancy) return _tenancy;

    const { userId, role } = auth.user;
    const now = new Date();

    // Check for cached briefing
    const cached = await prisma.aIBriefing.findFirst({
      where: {
        propertyId,
        userId,
        briefingType: 'shift',
      },
      orderBy: { generatedAt: 'desc' },
    });

    if (cached && cached.expiresAt > now) {
      const content = JSON.parse(cached.content as string) as BriefingContent;
      return NextResponse.json({
        data: {
          briefing: {
            ...content,
            generatedAt: cached.generatedAt.toISOString(),
            cached: true,
          },
        },
      });
    }

    // Generate fresh briefing
    const content = await generateBriefingData(propertyId, role, userId);

    // roleId is a UUID FK; look up the role assignment for this user+property
    const membership = await prisma.userProperty.findFirst({
      where: { userId, propertyId },
      select: { roleId: true },
    });
    if (!membership) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'No role assignment for this user at this property' },
        { status: 403 },
      );
    }

    // Store for caching
    await prisma.aIBriefing.create({
      data: {
        propertyId,
        userId,
        roleId: membership.roleId,
        briefingType: 'shift',
        content: JSON.stringify(content),
        dataSnapshot: content.sections as unknown as Prisma.InputJsonValue,
        generatedAt: now,
        modelUsed: 'rule-based-v1',
        cost: 0,
        expiresAt: new Date(now.getTime() + CACHE_TTL_MS),
      },
    });

    return NextResponse.json({
      data: {
        briefing: {
          ...content,
          generatedAt: now.toISOString(),
          cached: false,
        },
      },
    });
  } catch (error) {
    console.error('GET /api/v1/ai/briefing error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to generate briefing' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/ai/briefing — force regenerate
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    let body: { propertyId?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'INVALID_BODY', message: 'Request body must be valid JSON' },
        { status: 400 },
      );
    }

    const propertyId = body.propertyId;

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }
    const _tenancy = enforcePropertyAccess(auth.user, propertyId);
    if (_tenancy) return _tenancy;

    const { userId, role } = auth.user;
    const now = new Date();

    const content = await generateBriefingData(propertyId, role, userId);

    const membership = await prisma.userProperty.findFirst({
      where: { userId, propertyId },
      select: { roleId: true },
    });
    if (!membership) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'No role assignment for this user at this property' },
        { status: 403 },
      );
    }

    await prisma.aIBriefing.create({
      data: {
        propertyId,
        userId,
        roleId: membership.roleId,
        briefingType: 'shift',
        content: JSON.stringify(content),
        dataSnapshot: content.sections as unknown as Prisma.InputJsonValue,
        generatedAt: now,
        modelUsed: 'rule-based-v1',
        cost: 0,
        expiresAt: new Date(now.getTime() + CACHE_TTL_MS),
      },
    });

    return NextResponse.json(
      {
        data: {
          briefing: {
            ...content,
            generatedAt: now.toISOString(),
            cached: false,
          },
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/v1/ai/briefing error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to regenerate briefing' },
      { status: 500 },
    );
  }
}
