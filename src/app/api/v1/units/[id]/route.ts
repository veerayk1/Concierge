/**
 * Unit Detail API — per PRD 07 Unit Management
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute, enforcePropertyAccess } from '@/server/middleware/api-guard';
import { z } from 'zod';
import { isUuid } from '@/lib/uuid';

const updateUnitSchema = z.object({
  number: z.string().min(1).max(50).optional(),
  floor: z.number().int().nullable().optional(),
  unitType: z.string().max(50).optional(),
  status: z.string().max(50).optional(),
  squareFootage: z.number().min(0).nullable().optional(),
  enterPhoneCode: z.string().max(50).nullable().optional(),
  parkingSpot: z.string().max(50).nullable().optional(),
  locker: z.string().max(50).nullable().optional(),
  keyTag: z.string().max(50).nullable().optional(),
  packageEmailNotification: z.boolean().optional(),
  comments: z.string().max(5000).optional(),
  customFields: z.record(z.unknown()).optional(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Skip demo handler — uses the real database for consistent GET/POST
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    if (!isUuid(id)) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Invalid unit id.' },
        { status: 400 },
      );
    }

    const unit = await prisma.unit.findUnique({
      where: { id, deletedAt: null },
      include: {
        building: { select: { id: true, name: true } },
        // UX-058: detail page header reads `occupants.length` to render the
        // "Occupants" stat tile. Previously this came back undefined, so
        // every unit reported "0 Occupants" even when the list view showed
        // the resident's name. Fetch active occupancy records (moveOutDate
        // is null) joined with the user.
        occupancyRecords: {
          where: { moveOutDate: null },
          orderBy: [{ isPrimary: 'desc' }, { moveInDate: 'asc' }],
          select: {
            id: true,
            residentType: true,
            isPrimary: true,
            moveInDate: true,
            user: {
              select: { id: true, firstName: true, lastName: true, email: true, phone: true },
            },
          },
        },
        unitInstructions: {
          where: { isActive: true },
          select: { id: true, instructionText: true, priority: true, createdAt: true },
        },
        events: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
            eventType: { select: { name: true, icon: true, color: true } },
          },
        },
        packages: {
          where: { deletedAt: null, status: 'unreleased' },
          select: { id: true, referenceNumber: true, createdAt: true },
        },
        maintenanceRequests: {
          where: { deletedAt: null, status: { in: ['open', 'in_progress', 'on_hold'] } },
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            referenceNumber: true,
            description: true,
            status: true,
            priority: true,
            createdAt: true,
            category: { select: { name: true } },
          },
        },
      },
    });

    if (!unit) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Unit not found' }, { status: 404 });
    }

    // Unit detail includes packages, events, MR, and key codes. Cross-tenant
    // reads would leak the entire ops surface of another property.
    const tenancy = enforcePropertyAccess(auth.user, unit.propertyId);
    if (tenancy) return tenancy;

    // SEC-126: per-resident scoping. Without this, any logged-in resident
    // could fetch ANY neighbor's unit detail by guessing UUIDs — which
    // includes their concierge instructions ("beware of dog"), their
    // pending package list (when they're not home), and their open
    // maintenance requests (what's broken in their apartment). Staff can
    // see any unit in the property; residents see only units they occupy.
    const STAFF_ROLES = new Set<string>([
      'super_admin',
      'property_admin',
      'property_manager',
      'front_desk',
      'security_guard',
      'security_supervisor',
      'superintendent',
      'maintenance_staff',
      'board_member',
    ]);
    if (!STAFF_ROLES.has(auth.user.role)) {
      const occupancy = await prisma.occupancyRecord.findFirst({
        where: {
          userId: auth.user.userId,
          unitId: id,
          moveOutDate: null,
        },
        select: { id: true },
      });
      if (!occupancy) {
        return NextResponse.json(
          { error: 'FORBIDDEN', message: 'You can only view units you occupy.' },
          { status: 403 },
        );
      }
    }

    // Flatten OccupancyRecord → Occupant for the page consumer. The page
    // (src/app/(portal)/units/[id]/page.tsx) reads apiUnit.occupants as a
    // user-shaped array, so map { id, residentType, isPrimary, user } down
    // to { id, firstName, lastName, email, phone, residentType, isPrimary }.
    type OccupancyWithUser = (typeof unit.occupancyRecords)[number];
    const occupants = (unit.occupancyRecords as OccupancyWithUser[]).map((occ) => ({
      id: occ.user.id,
      firstName: occ.user.firstName,
      lastName: occ.user.lastName,
      email: occ.user.email,
      phone: occ.user.phone,
      residentType: occ.residentType,
      isPrimary: occ.isPrimary,
      moveInDate: occ.moveInDate,
    }));

    return NextResponse.json({ data: { ...unit, occupants } });
  } catch (error) {
    console.error('GET /api/v1/units/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch unit' },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Unit edit is a staff operation — residents must not rewrite their own
    // unit's parking spot, key tag, or buzzer code (and certainly not
    // anyone else's). Lock to admins.
    const auth = await guardRoute(request, {
      roles: ['super_admin', 'property_admin', 'property_manager', 'superintendent'],
    });
    if (auth.error) return auth.error;

    const { id } = await params;
    if (!isUuid(id)) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Invalid unit id.' },
        { status: 400 },
      );
    }
    const body = await request.json();

    const target = await prisma.unit.findUnique({
      where: { id, deletedAt: null },
      select: { propertyId: true },
    });
    if (!target) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Unit not found' }, { status: 404 });
    }
    const tenancy = enforcePropertyAccess(auth.user, target.propertyId);
    if (tenancy) return tenancy;

    const parsed = updateUnitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    const input = parsed.data;

    const updateData: Record<string, unknown> = {};
    if (input.number !== undefined) updateData.number = input.number;
    if (input.floor !== undefined)
      updateData.floor = input.floor !== null ? Number(input.floor) : null;
    if (input.unitType !== undefined) updateData.unitType = input.unitType;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.squareFootage !== undefined)
      updateData.squareFootage = input.squareFootage !== null ? Number(input.squareFootage) : null;
    if (input.enterPhoneCode !== undefined)
      updateData.enterPhoneCode = input.enterPhoneCode || null;
    if (input.parkingSpot !== undefined) updateData.parkingSpot = input.parkingSpot || null;
    if (input.locker !== undefined) updateData.locker = input.locker || null;
    if (input.keyTag !== undefined) updateData.keyTag = input.keyTag || null;
    if (input.packageEmailNotification !== undefined)
      updateData.packageEmailNotification = input.packageEmailNotification;
    if (input.comments !== undefined) updateData.comments = input.comments;
    if (input.customFields !== undefined) updateData.customFields = input.customFields;

    const unit = await prisma.unit.update({
      where: { id },
      data: updateData,
      include: { building: { select: { name: true } } },
    });

    return NextResponse.json({ data: unit, message: 'Unit updated.' });
  } catch (error) {
    console.error('PATCH /api/v1/units/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update unit' },
      { status: 500 },
    );
  }
}
