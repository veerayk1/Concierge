/**
 * Unit Residents API — per PRD 07
 * List residents assigned to a specific unit
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute, enforcePropertyAccess } from '@/server/middleware/api-guard';
import { isUuid } from '@/lib/uuid';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // SEC-130 CRITICAL: this endpoint had no role gate AND the query
    // filtered only by propertyId, not by unitId — so any logged-in
    // resident could call GET /api/v1/units/<ANY-UUID>/residents and
    // receive the FULL building roster (name, email, phone) of every
    // resident regardless of unit. Verified leak: 23-row roster
    // returned to resident_owner for both their own unit and a
    // neighbor's unit. Stalking + phishing vector.
    //
    // Fixes: (1) staff-only role gate — this is a front-desk lookup
    // tool; residents should use /my/profile or building-directory for
    // neighbor names. (2) actually filter by unitId via occupancy
    // records so the query returns the correct subset.
    const auth = await guardRoute(request, {
      roles: [
        'super_admin',
        'property_admin',
        'property_manager',
        'front_desk',
        'security_supervisor',
        'security_guard',
        'superintendent',
        'maintenance_staff',
      ],
    });
    if (auth.error) return auth.error;

    const { id: unitId } = await params;
    if (!isUuid(unitId)) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Invalid unit id.' },
        { status: 400 },
      );
    }

    const unit = await prisma.unit.findUnique({
      where: { id: unitId, deletedAt: null },
      select: { id: true, number: true, propertyId: true },
    });

    if (!unit) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Unit not found' }, { status: 404 });
    }

    const tenancy = enforcePropertyAccess(auth.user, unit.propertyId);
    if (tenancy) return tenancy;

    // Actual unit-scoped resident lookup via occupancy_records.
    // Previously this returned the WHOLE property's resident roster
    // because the query ignored unitId entirely.
    const residents = await prisma.user.findMany({
      where: {
        deletedAt: null,
        isActive: true,
        occupancyRecords: {
          some: {
            unitId,
            moveOutDate: null,
          },
        },
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        userProperties: {
          where: { propertyId: unit.propertyId },
          select: { role: { select: { name: true, slug: true } } },
        },
      },
      orderBy: { lastName: 'asc' },
    });

    return NextResponse.json({
      data: residents.map((r) => ({
        id: r.id,
        firstName: r.firstName,
        lastName: r.lastName,
        email: r.email,
        phone: r.phone,
        role: r.userProperties[0]?.role ?? null,
      })),
    });
  } catch (error) {
    console.error('GET /api/v1/units/:id/residents error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch residents' },
      { status: 500 },
    );
  }
}
