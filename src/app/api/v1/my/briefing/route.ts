/**
 * GET /api/v1/my/briefing
 *
 * Personalised morning briefing for the resident. Deterministic
 * synthesis (no LLM) over the resident's existing data:
 *
 *   - First name + time-of-day greeting
 *   - Expected visitors arriving today
 *   - Packages waiting at the desk (called out specially if perishable)
 *   - Open service requests still in progress
 *   - Today's biggest amenity hold on the property (in case it
 *     affects them — the pool is locked off 6-8pm)
 *
 * Returns a single `paragraphs` array; each entry is a complete
 * sentence the client renders in sequence. Empty days produce
 * a single "Quiet day on the floor" sentence — never an empty
 * response, so the dashboard always has something warm to render.
 */

import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';
import type { Role } from '@/types';

const RESIDENT_ROLES: Role[] = [
  'resident_owner',
  'resident_tenant',
  'family_member',
  'offsite_owner',
];

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Late night';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Quiet night';
}

function todayLocalSlug(): string {
  const t = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${t.getFullYear()}-${pad(t.getMonth() + 1)}-${pad(t.getDate())}`;
}

function timeOnly(iso: string): string {
  const m = iso.match(/T(\d{2}):(\d{2})/);
  if (!m) return iso;
  let h = parseInt(m[1]!, 10);
  const mm = m[2]!;
  const ampm = h >= 12 ? 'pm' : 'am';
  h = h % 12 || 12;
  return `${h}${mm === '00' ? '' : ':' + mm}${ampm}`;
}

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request, { roles: RESIDENT_ROLES });
    if (auth.error) return auth.error;

    // Caller's primary unit
    const occ = await prisma.occupancyRecord.findFirst({
      where: { userId: auth.user.userId, moveOutDate: null },
      select: { unitId: true, propertyId: true },
    });
    const user = await prisma.user.findUnique({
      where: { id: auth.user.userId },
      select: { firstName: true },
    });
    if (!occ || !user) {
      return NextResponse.json({
        data: { paragraphs: ['Welcome.'], highlights: [] },
      });
    }

    const { unitId, propertyId } = occ;
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(todayStart.getDate() + 1);

    // Fan out — every signal in parallel.
    const [expectedToday, waitingPackages, openRequests, todaysBookings] = await Promise.all([
      prisma.visitorEntry.findMany({
        where: {
          propertyId,
          unitId,
          departureAt: null,
          arrivalAt: { gte: now, lt: tomorrowStart },
        },
        orderBy: { arrivalAt: 'asc' },
        select: { visitorName: true, arrivalAt: true, visitorType: true },
      }),
      prisma.$queryRaw<{ courier: string | null; isPerishable: boolean; count: bigint }[]>`
        SELECT c.name AS courier, p."isPerishable", COUNT(*)::bigint AS count
        FROM packages p
        LEFT JOIN courier_types c ON c.id = p."courierId"
        WHERE p."propertyId" = ${propertyId}::uuid
          AND p."unitId" = ${unitId}::uuid
          AND p."deletedAt" IS NULL
          AND p.status NOT IN ('released', 'returned', 'cancelled')
        GROUP BY c.name, p."isPerishable"
      `,
      // Resident's open service requests
      prisma.$queryRaw<{ status: string; count: bigint }[]>`
        SELECT m.status, COUNT(*)::bigint AS count
        FROM maintenance_requests m
        WHERE m."propertyId" = ${propertyId}::uuid
          AND m."unitId" = ${unitId}::uuid
          AND m."deletedAt" IS NULL
          AND m.status NOT IN ('closed', 'resolved', 'cancelled', 'completed')
        GROUP BY m.status
      `,
      // Today's biggest amenity hold on the property
      prisma.booking.findMany({
        where: {
          propertyId,
          status: { in: ['approved', 'confirmed'] },
          approvalStatus: { not: 'declined' },
          startDate: { gte: todayStart, lt: tomorrowStart },
        },
        include: { amenity: { select: { name: true } }, unit: { select: { number: true } } },
        orderBy: { startTime: 'asc' },
        take: 10,
      }),
    ]);

    const paragraphs: string[] = [];
    paragraphs.push(`${greeting()}, ${user.firstName}.`);

    // Expected visitors
    if (expectedToday.length > 0) {
      const v = expectedToday[0]!;
      const time = timeOnly(v.arrivalAt.toISOString());
      const more = expectedToday.length > 1 ? ` and ${expectedToday.length - 1} more visitor` : '';
      const sMore = expectedToday.length > 2 ? 's' : '';
      paragraphs.push(`You're expecting ${v.visitorName} at ${time}${more}${sMore} today.`);
    }

    // Packages
    let totalPackages = 0;
    let perishableCount = 0;
    for (const row of waitingPackages) {
      totalPackages += Number(row.count);
      if (row.isPerishable) perishableCount += Number(row.count);
    }
    if (totalPackages > 0) {
      if (perishableCount > 0) {
        paragraphs.push(
          `${totalPackages} package${totalPackages === 1 ? '' : 's'} waiting at the desk — ${perishableCount} marked perishable, worth picking up first.`,
        );
      } else {
        paragraphs.push(
          `${totalPackages} package${totalPackages === 1 ? '' : 's'} ready for pickup at the desk.`,
        );
      }
    }

    // Open service requests
    let openCount = 0;
    let inProgressCount = 0;
    for (const row of openRequests) {
      const n = Number(row.count);
      openCount += n;
      if (row.status === 'in_progress') inProgressCount += n;
    }
    if (openCount > 0) {
      if (inProgressCount > 0) {
        paragraphs.push(
          `${inProgressCount} of your service request${inProgressCount === 1 ? ' is' : 's are'} actively being worked on.`,
        );
      } else {
        paragraphs.push(
          `${openCount} of your service request${openCount === 1 ? '' : 's'} still open.`,
        );
      }
    }

    // Amenity holds — pick the longest one today so the resident knows
    // when the popular space is locked off.
    if (todaysBookings.length > 0) {
      const longest = todaysBookings.reduce(
        (acc, b) => {
          const span = new Date(b.endTime).getTime() - new Date(b.startTime).getTime();
          return span > (acc.span ?? -1) ? { b, span } : acc;
        },
        {} as { b?: (typeof todaysBookings)[0]; span?: number },
      );
      if (longest.b) {
        const start = timeOnly(longest.b.startTime.toISOString());
        const end = timeOnly(longest.b.endTime.toISOString());
        paragraphs.push(
          `${longest.b.amenity?.name ?? 'An amenity'} is booked ${start}–${end} today by Unit ${longest.b.unit?.number ?? ''}.`,
        );
      }
    }

    if (paragraphs.length === 1) {
      paragraphs.push('Quiet day on the floor.');
    }

    return NextResponse.json({
      data: {
        paragraphs,
        highlights: {
          expectedVisitorsToday: expectedToday.length,
          packagesWaiting: totalPackages,
          perishablePackages: perishableCount,
          openRequests: openCount,
          inProgressRequests: inProgressCount,
        },
      },
    });
  } catch (error) {
    console.error('GET /api/v1/my/briefing error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to load briefing.' },
      { status: 500 },
    );
  }
}
