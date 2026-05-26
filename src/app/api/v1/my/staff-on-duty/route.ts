/**
 * GET /api/v1/my/staff-on-duty
 *
 * Resident-side question: is the front desk staffed right now? If
 * yes, what's their first name (so a resident can say "thanks, Emily"
 * when they walk down). Driven by the live SecurityShift table —
 * anyone with an active shift at the resident's property counts.
 *
 * Returns the count of staff currently clocked in by category:
 *
 *   - frontDesk: front_desk + superintendent
 *   - security: security_guard + security_supervisor
 *
 * Plus the first name of the most-recently clocked-in person in each
 * category so the resident knows who they'd be talking to.
 */

import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';

const FRONT_DESK_ROLES = ['front_desk', 'superintendent'];
const SECURITY_ROLES = ['security_guard', 'security_supervisor'];

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    // Resolve the caller's property from their active occupancy.
    // Staff callers can include ?propertyId=... to get the same
    // signal from the front-desk side.
    const { searchParams } = new URL(request.url);
    let propertyId: string | null = searchParams.get('propertyId') ?? auth.user.propertyId ?? null;
    if (!propertyId && auth.user.userId) {
      const occ = await prisma.occupancyRecord.findFirst({
        where: { userId: auth.user.userId, moveOutDate: null },
        select: { propertyId: true },
      });
      propertyId = occ?.propertyId ?? null;
    }
    if (!propertyId) return NextResponse.json({ data: null });

    const shifts = await prisma.securityShift.findMany({
      where: {
        propertyId,
        status: 'active',
        actualEndTime: null,
      },
      orderBy: { startTime: 'desc' },
      take: 20,
      select: {
        id: true,
        startTime: true,
        guardId: true,
      },
    });

    const guardIds = shifts.map((s) => s.guardId);
    // Resolve role-at-this-property via UserProperty -> Role.
    const userProps = guardIds.length
      ? await prisma.userProperty.findMany({
          where: { userId: { in: guardIds }, propertyId },
          select: {
            userId: true,
            role: { select: { slug: true } },
            user: { select: { firstName: true } },
          },
        })
      : [];
    const guardById = new Map(
      userProps.map((up) => [
        up.userId,
        { firstName: up.user?.firstName ?? '', slug: up.role?.slug ?? '' },
      ]),
    );

    let frontDeskCount = 0;
    let securityCount = 0;
    let frontDeskName: string | null = null;
    let securityName: string | null = null;

    for (const s of shifts) {
      const g = guardById.get(s.guardId);
      if (!g) continue;
      if (FRONT_DESK_ROLES.includes(g.slug)) {
        frontDeskCount += 1;
        if (!frontDeskName) frontDeskName = g.firstName;
      } else if (SECURITY_ROLES.includes(g.slug)) {
        securityCount += 1;
        if (!securityName) securityName = g.firstName;
      }
    }

    return NextResponse.json({
      data: {
        frontDesk: { onDuty: frontDeskCount > 0, count: frontDeskCount, name: frontDeskName },
        security: { onDuty: securityCount > 0, count: securityCount, name: securityName },
      },
    });
  } catch (error) {
    console.error('GET /api/v1/my/staff-on-duty error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch staff availability.' },
      { status: 500 },
    );
  }
}
