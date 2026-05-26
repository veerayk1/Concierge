/**
 * GET /api/v1/staff/shift-briefing
 *
 * One-paragraph synthesised briefing for front desk / security
 * staff at the start of their shift — what's pending across the
 * building's daily ops, in plain English, no clicks required.
 *
 *   - Aging shelf packages (7+ days unreleased)
 *   - Expected visitors today
 *   - Active incidents
 *   - Today's biggest amenity hold
 *   - Overdue keys still out
 */

import { NextRequest, NextResponse } from 'next/server';

import { prisma } from '@/server/db';
import { guardRoute, enforcePropertyAccess } from '@/server/middleware/api-guard';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Late shift';
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  if (h < 21) return 'Good evening';
  return 'Overnight';
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
    const auth = await guardRoute(request, {
      roles: [
        'super_admin',
        'property_admin',
        'property_manager',
        'front_desk',
        'security_guard',
        'security_supervisor',
        'superintendent',
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

    const me = await prisma.user.findUnique({
      where: { id: auth.user.userId },
      select: { firstName: true },
    });
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrowStart = new Date(todayStart);
    tomorrowStart.setDate(todayStart.getDate() + 1);
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const [
      agingPackages,
      perishableAging,
      expectedToday,
      activeIncidents,
      todaysBookings,
      overdueKeys,
    ] = await Promise.all([
      prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*)::bigint AS count FROM packages p
        WHERE p."propertyId" = ${propertyId}::uuid
          AND p."deletedAt" IS NULL
          AND p.status NOT IN ('released', 'returned', 'cancelled')
          AND p."createdAt" < ${sevenDaysAgo}
      `,
      prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*)::bigint AS count FROM packages p
        WHERE p."propertyId" = ${propertyId}::uuid
          AND p."deletedAt" IS NULL
          AND p.status NOT IN ('released', 'returned', 'cancelled')
          AND p."isPerishable" = true
      `,
      prisma.visitorEntry.count({
        where: {
          propertyId,
          departureAt: null,
          arrivalAt: { gte: now, lt: tomorrowStart },
        },
      }),
      prisma.event.count({
        where: {
          propertyId,
          deletedAt: null,
          eventType: { slug: { in: ['incident-report', 'incident_report'] } },
          status: 'open',
        },
      }),
      prisma.booking.findMany({
        where: {
          propertyId,
          status: { in: ['approved', 'confirmed'] },
          approvalStatus: { not: 'declined' },
          startDate: { gte: todayStart, lt: tomorrowStart },
        },
        include: { amenity: { select: { name: true } } },
        orderBy: { startTime: 'asc' },
        take: 10,
      }),
      prisma.keyCheckout.count({
        where: {
          propertyId,
          returnTime: null,
          OR: [
            { expectedReturn: { lt: now } },
            {
              AND: [
                { expectedReturn: null },
                { checkoutTime: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
              ],
            },
          ],
        },
      }),
    ]);

    const aging = Number(agingPackages[0]?.count ?? 0n);
    const perishable = Number(perishableAging[0]?.count ?? 0n);

    // Per-role scope. A security guard does not handle packages, visitor
    // pre-auth, or amenity bookings — those live with front desk. Mentioning
    // "3 perishable packages — surface to the resident" on a guard's
    // dashboard makes the briefing feel generic and undermines trust. So
    // we slice the paragraphs by what each role actually acts on.
    const userRole = auth.user.role;
    const isSecurity = userRole === 'security_guard' || userRole === 'security_supervisor';
    const isFrontDesk = userRole === 'front_desk';
    const handlesPackages = isFrontDesk || !isSecurity;
    const handlesVisitors = isFrontDesk || !isSecurity;
    const handlesAmenities = isFrontDesk || !isSecurity;

    const paragraphs: string[] = [];
    paragraphs.push(`${greeting()}, ${me?.firstName ?? 'team'}.`);

    if (activeIncidents > 0) {
      paragraphs.push(
        `${activeIncidents} incident${activeIncidents === 1 ? '' : 's'} still open — eyes on that first.`,
      );
    }
    if (overdueKeys > 0) {
      paragraphs.push(
        `${overdueKeys} key${overdueKeys === 1 ? '' : 's'} still out past return time — chase the borrower when you can.`,
      );
    }
    if (handlesPackages) {
      if (perishable > 0) {
        paragraphs.push(
          `${perishable} perishable package${perishable === 1 ? '' : 's'} on the shelf — surface those to the resident today.`,
        );
      } else if (aging > 0) {
        paragraphs.push(
          `${aging} package${aging === 1 ? '' : 's'} aging 7+ days on the shelf — worth a reminder to the resident.`,
        );
      }
    }
    if (handlesVisitors && expectedToday > 0) {
      paragraphs.push(
        `${expectedToday} pre-authorised visitor${expectedToday === 1 ? '' : 's'} expected through the day.`,
      );
    }
    if (handlesAmenities && todaysBookings.length > 0) {
      const first = todaysBookings[0]!;
      paragraphs.push(
        `${first.amenity?.name ?? 'An amenity'} starts at ${timeOnly(first.startTime.toISOString())}${
          todaysBookings.length > 1
            ? `, plus ${todaysBookings.length - 1} more booking${todaysBookings.length > 2 ? 's' : ''} today.`
            : '.'
        }`,
      );
    }

    if (paragraphs.length === 1) {
      // Different idle states for different roles — security walks
      // patrols, front desk catches up on filing/comms.
      paragraphs.push(
        isSecurity
          ? 'Floor is quiet — perfect time to catch up on patrols.'
          : 'Lobby is quiet — good moment to clear the inbox or sort the back room.',
      );
    }

    return NextResponse.json({
      data: {
        paragraphs,
        highlights: {
          activeIncidents,
          overdueKeys,
          agingPackages: aging,
          perishablePackages: perishable,
          expectedVisitors: expectedToday,
          todaysBookings: todaysBookings.length,
        },
      },
    });
  } catch (error) {
    console.error('GET /api/v1/staff/shift-briefing error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to load shift briefing.' },
      { status: 500 },
    );
  }
}
