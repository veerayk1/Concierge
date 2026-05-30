/**
 * GET /api/v1/my/visitors
 *
 * Resident-scoped visitor list — the resident's own pre-authorized
 * "Expecting someone?" entries plus any signed-in visitors still
 * on-site at their unit. Distinct from the staff-only
 * /api/v1/visitors which is building-wide.
 *
 * Default status is 'expected' (what the resident scheduled and hasn't
 * happened yet); pass ?status=active for currently on-site or
 * ?status=all for both, signed-out included.
 *
 * Tenancy: resolved via OccupancyRecord — the caller's unit is the
 * single unit they have an active occupancy at. No cross-tenant leak
 * because we never accept a unitId from the request body.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request, {
      roles: ['resident_owner', 'resident_tenant', 'family_member', 'offsite_owner'],
    });
    if (auth.error) return auth.error;

    // Resolve the caller's unit via active occupancy. (Residents may
    // hold the legacy `users.unitId` column on the JWT, but the
    // truth-source is OccupancyRecord.)
    const occupancy = await prisma.occupancyRecord.findFirst({
      where: { userId: auth.user.userId, moveOutDate: null },
      select: { unitId: true, propertyId: true },
    });
    if (!occupancy) {
      // Not in a unit — nothing to show.
      return NextResponse.json({ data: [] });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') ?? 'expected';

    const now = new Date();
    const where: Record<string, unknown> = {
      propertyId: occupancy.propertyId,
      unitId: occupancy.unitId,
    };
    if (status === 'expected') {
      where.departureAt = null;
      where.arrivalAt = { gt: now };
    } else if (status === 'active' || status === 'signed_in') {
      where.departureAt = null;
      where.arrivalAt = { lte: now };
    } else if (status === 'signed_out') {
      where.departureAt = { not: null };
    }

    const rows = await prisma.visitorEntry.findMany({
      where,
      orderBy: { arrivalAt: 'asc' },
      take: 20,
      select: {
        id: true,
        visitorName: true,
        visitorType: true,
        arrivalAt: true,
        departureAt: true,
        comments: true,
      },
    });

    return NextResponse.json({ data: rows });
  } catch (error) {
    console.error('GET /api/v1/my/visitors error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to load your visitors.' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/my/visitors — Resident pre-authorizes a guest
// ---------------------------------------------------------------------------
//
// The resident says "Sarah Kim is coming Saturday 7pm." The front desk
// sees the pre-auth on their incoming-visitor list and can wave the
// guest through without calling the unit. Mobile-app-first endpoint;
// the web equivalent for staff is /api/v1/visitors POST.
//
// Why a resident-scoped endpoint and not the building-wide POST:
//   - Self-auth on unit: we never accept a unitId from the body; we
//     resolve it from OccupancyRecord. Residents cannot accidentally
//     (or maliciously) authorize a guest into a neighbour's unit.
//   - Smaller payload surface: a resident provides only the guest
//     name and arrival time. Staff fields (vehiclePlate, idType,
//     idVerified) are not exposed.
//   - The route can be allowDemo: false specifically because pre-auth
//     should never go through demo mode in production.

const PRE_AUTH_VISITOR_TYPES = [
  'visitor',
  'delivery_person',
  'contractor',
  'real_estate_agent',
  'other',
] as const;

const preAuthSchema = z.object({
  visitorName: z.string().min(1).max(120),
  visitorType: z.enum(PRE_AUTH_VISITOR_TYPES).optional(),
  /** ISO date-time string for when the guest is expected to arrive. */
  expectedArrivalAt: z.string().datetime({ offset: true }),
  /** Optional note shown to the front desk when the guest arrives. */
  notes: z.string().max(500).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request, {
      roles: ['resident_owner', 'resident_tenant', 'family_member', 'offsite_owner'],
      allowDemo: false,
    });
    if (auth.error) return auth.error;

    const body = await request.json().catch(() => ({}));
    const parsed = preAuthSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    const input = parsed.data;

    // Resolve unit from occupancy. Never trust the request for unitId.
    const occupancy = await prisma.occupancyRecord.findFirst({
      where: { userId: auth.user.userId, moveOutDate: null },
      select: { unitId: true, propertyId: true },
    });
    if (!occupancy) {
      return NextResponse.json(
        {
          error: 'NO_UNIT',
          message: 'You need to be assigned to a unit before pre-authorizing a visitor.',
        },
        { status: 400 },
      );
    }

    const arrivalAt = new Date(input.expectedArrivalAt);
    // The schema's datetime() catches malformed strings; this guards
    // against semantically-bad dates ("Feb 30") that still parse but
    // produce NaN getTime.
    if (Number.isNaN(arrivalAt.getTime())) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'expectedArrivalAt is not a valid date.' },
        { status: 400 },
      );
    }
    // Refuse pre-auth more than 30 days out. Anything longer is
    // almost certainly a typo and clutters the front-desk queue.
    const maxFuture = Date.now() + 30 * 24 * 60 * 60 * 1000;
    if (arrivalAt.getTime() > maxFuture) {
      return NextResponse.json(
        {
          error: 'TOO_FAR_FUTURE',
          message: 'Pre-authorizations more than 30 days in the future are not allowed.',
        },
        { status: 400 },
      );
    }

    // Compose comments: prepend "Pre-auth by resident" so the front
    // desk can tell at a glance that this entry came from the resident
    // (not staff). The VisitorEntry schema doesn't carry a creator
    // FK — comments is the audit channel until we add createdById.
    const composedComments = [
      'Pre-authorized by resident',
      input.notes?.trim() ? input.notes.trim() : null,
    ]
      .filter(Boolean)
      .join('. ');

    const created = await prisma.visitorEntry.create({
      data: {
        propertyId: occupancy.propertyId,
        unitId: occupancy.unitId,
        visitorName: input.visitorName.trim(),
        visitorType: input.visitorType ?? 'visitor',
        arrivalAt,
        comments: composedComments,
        notifyResident: true,
      },
      select: {
        id: true,
        visitorName: true,
        visitorType: true,
        arrivalAt: true,
        comments: true,
      },
    });

    return NextResponse.json(
      {
        data: created,
        message: `${created.visitorName} is on the list for ${arrivalAt.toLocaleString('en-CA', { dateStyle: 'medium', timeStyle: 'short' })}.`,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/v1/my/visitors error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to pre-authorize visitor.' },
      { status: 500 },
    );
  }
}
