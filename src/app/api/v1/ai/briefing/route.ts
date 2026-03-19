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
import { guardRoute } from '@/server/middleware/api-guard';

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

async function generateBriefingData(propertyId: string, role: string): Promise<BriefingContent> {
  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setHours(0, 0, 0, 0);

  const [
    unreleasedCount,
    activeVisitorCount,
    openMaintenanceCount,
    pendingApprovalCount,
    alertCount,
    handoff,
  ] = await Promise.all([
    prisma.package.count({
      where: { propertyId, status: 'unreleased', deletedAt: null },
    }),
    prisma.visitorEntry.count({
      where: { propertyId, departureAt: null },
    }),
    prisma.maintenanceRequest.count({
      where: { propertyId, status: { in: ['open', 'in_progress'] }, deletedAt: null },
    }),
    prisma.booking.count({
      where: { propertyId, approvalStatus: 'pending' },
    }),
    prisma.event.count({
      where: {
        propertyId,
        status: { in: ['open', 'in_progress'] },
        createdAt: { gte: todayStart },
        deletedAt: null,
      },
    }),
    prisma.shiftHandoff.findFirst({
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
    const content = await generateBriefingData(propertyId, role);

    // Store for caching
    await prisma.aIBriefing.create({
      data: {
        propertyId,
        userId,
        roleId: role,
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

    const { userId, role } = auth.user;
    const now = new Date();

    const content = await generateBriefingData(propertyId, role);

    await prisma.aIBriefing.create({
      data: {
        propertyId,
        userId,
        roleId: role,
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
