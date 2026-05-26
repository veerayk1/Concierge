/**
 * GET /api/v1/shift-log/handoff/latest
 *
 * Returns the most recent submitted ShiftHandoff for the property.
 * Used by the Front Desk + Security dashboards to render a
 * "Pass-on from the previous shift" card the moment the on-shift
 * person opens their dashboard.
 *
 * Joins the outgoing user's first/last name so the card can read
 * "From Emily's morning shift" instead of a UUID.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute, enforcePropertyAccess } from '@/server/middleware/api-guard';

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId') ?? auth.user.propertyId;
    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required.' },
        { status: 400 },
      );
    }
    const tenancy = enforcePropertyAccess(auth.user, propertyId);
    if (tenancy) return tenancy;

    const handoff = await prisma.shiftHandoff.findFirst({
      where: { propertyId },
      orderBy: { createdAt: 'desc' },
    });

    if (!handoff) return NextResponse.json({ data: null });

    // Look up the outgoing guard's name so the dashboard card can
    // greet "From Emily's morning shift" without a second round-trip.
    const outgoing = await prisma.user.findUnique({
      where: { id: handoff.outgoingUserId },
      select: { firstName: true, lastName: true },
    });

    return NextResponse.json({
      data: {
        ...handoff,
        outgoingUser: outgoing
          ? { firstName: outgoing.firstName, lastName: outgoing.lastName }
          : null,
      },
    });
  } catch (error) {
    console.error('GET /api/v1/shift-log/handoff/latest error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to load latest shift handoff.' },
      { status: 500 },
    );
  }
}
