/**
 * Parking Violations API — Create violation
 * Per PRD 13
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute, enforcePropertyAccess } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';
import { sendEmailWithLog } from '@/server/email';

const VIOLATION_LABELS: Record<string, string> = {
  notice: 'Notice',
  warning: 'Warning',
  ticket: 'Ticket',
  ban: 'Ban',
  vehicle_towed: 'Vehicle Towed',
};

/**
 * Fire-and-forget email to every active occupant of the cited unit so they
 * know a violation was logged against a vehicle attributed to their unit.
 * Failures are logged, not thrown — the violation itself has already been
 * persisted by the time this runs.
 */
async function notifyUnitOccupantsOfViolation(args: {
  propertyId: string;
  unitId: string;
  violation: {
    id?: string;
    referenceNumber: string;
    violationType: string;
    licensePlate: string;
    description: string | null;
  };
}): Promise<void> {
  const occupants = await prisma.occupancyRecord.findMany({
    where: { unitId: args.unitId, moveOutDate: null },
    include: {
      user: { select: { email: true, firstName: true } },
      unit: { select: { number: true } },
    },
  });
  if (occupants.length === 0) return;

  const propName =
    (await prisma.property.findUnique({ where: { id: args.propertyId }, select: { name: true } }))
      ?.name ?? 'your building';
  const typeLabel = VIOLATION_LABELS[args.violation.violationType] ?? args.violation.violationType;
  const unitNumber = occupants[0]?.unit?.number ?? 'your unit';

  for (const occ of occupants) {
    if (!occ.user?.email) continue;
    await sendEmailWithLog(
      {
        to: occ.user.email,
        subject: `Parking ${typeLabel} issued — ${propName}`,
        html: `<p>Hi ${occ.user.firstName ?? 'there'},</p>
<p>A parking <strong>${typeLabel.toLowerCase()}</strong> (reference <code>${args.violation.referenceNumber}</code>) was just logged against a vehicle with license plate
<strong>${args.violation.licensePlate}</strong>, attributed to unit ${unitNumber}.</p>
${args.violation.description ? `<p>Details from the building team: ${args.violation.description}</p>` : ''}
<p>If you believe this was issued in error, contact the property manager or reply to this email.</p>`,
      },
      {
        propertyId: args.propertyId,
        category: 'parking_violation',
        recipientUserId: occ.userId,
        relatedEntityType: 'parking_violation',
        relatedEntityId: args.violation.id ?? null,
      },
    );
  }
}

const createViolationSchema = z.object({
  propertyId: z.string().uuid(),
  // unitId is optional — a violation against an unknown plate may not be
  // attributable to a unit yet. When set, the notifyUnitOwner cascade
  // delivers to every active occupant of that unit.
  unitId: z.string().uuid().optional().or(z.literal('')),
  licensePlate: z.string().min(1, 'License plate is required').max(15),
  location: z.string().max(100).optional(),
  violationType: z.enum(['notice', 'warning', 'ticket', 'ban', 'vehicle_towed']),
  description: z.string().max(1000).optional(),
  notifyUnitOwner: z.boolean().default(true),
});

export async function POST(request: NextRequest) {
  try {
    // SEC-156 CRITICAL: parking violations are quasi-legal documents
    // (notices, warnings, tickets, ban, vehicle_towed). Previously
    // this had no role gate AND no tenancy check, so any resident
    // could file violations against any neighbor at any property —
    // harassment / fraud vector, and the seed notifyUnitOwner flag
    // would trigger an email cascade to the falsely-cited unit.
    // Issuing violations is a staff/security workflow.
    const auth = await guardRoute(request, {
      roles: [
        'super_admin',
        'property_admin',
        'property_manager',
        'front_desk',
        'security_supervisor',
        'security_guard',
        'superintendent',
      ],
    });
    if (auth.error) return auth.error;

    const body = await request.json();
    const parsed = createViolationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;

    // Cross-tenant: staff at A must not file violations at B.
    const tenancy = enforcePropertyAccess(auth.user, input.propertyId);
    if (tenancy) return tenancy;

    // Generate a reference number
    const refNum = `PV-${Date.now().toString(36).toUpperCase()}`;

    const unitId = input.unitId && input.unitId.length > 0 ? input.unitId : null;
    const violation = await prisma.parkingViolation.create({
      data: {
        propertyId: input.propertyId,
        licensePlate: input.licensePlate.toUpperCase(),
        location: input.location,
        violationType: input.violationType,
        description: input.description ? stripControlChars(stripHtml(input.description)) : null,
        unitId,
        notifyUnitOwner: input.notifyUnitOwner,
        status: 'open',
        referenceNumber: refNum,
        issuedById: auth.user.userId,
      },
    });

    // Fire-and-forget owner notification. Skipped silently if there's no
    // unit to attribute the violation to (unknown plate) or if the issuer
    // unchecked "Notify unit owner" on the form.
    if (input.notifyUnitOwner && unitId) {
      void notifyUnitOccupantsOfViolation({
        propertyId: input.propertyId,
        unitId,
        violation: {
          id: violation.id,
          referenceNumber: refNum,
          violationType: input.violationType,
          licensePlate: input.licensePlate.toUpperCase(),
          description: input.description ?? null,
        },
      }).catch((err) => console.error('parking violation notify failed:', err));
    }

    return NextResponse.json({ data: violation, message: 'Violation reported.' }, { status: 201 });
  } catch (error) {
    console.error('POST /api/v1/parking/violations error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to report violation' },
      { status: 500 },
    );
  }
}
