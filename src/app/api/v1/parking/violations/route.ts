/**
 * Parking Violations API — Create violation
 * Per PRD 13
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute, enforcePropertyAccess } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';

const createViolationSchema = z.object({
  propertyId: z.string().uuid(),
  unitId: z.string().uuid().optional(),
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

    const violation = await prisma.parkingViolation.create({
      data: {
        propertyId: input.propertyId,
        licensePlate: input.licensePlate.toUpperCase(),
        location: input.location,
        violationType: input.violationType,
        description: input.description ? stripControlChars(stripHtml(input.description)) : null,
        status: 'open',
        referenceNumber: refNum,
        issuedById: auth.user.userId,
      },
    });

    return NextResponse.json({ data: violation, message: 'Violation reported.' }, { status: 201 });
  } catch (error) {
    console.error('POST /api/v1/parking/violations error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to report violation' },
      { status: 500 },
    );
  }
}
