/**
 * Parking API — Permits and Violations
 * Per PRD 13 Parking Management
 *
 * GET  — List permits (default) or violations (?type=violations)
 * POST — Create a new parking permit
 * PATCH — Permit lifecycle transitions (activate, suspend, expire, renew, cancel)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';
import { requireModule } from '@/server/middleware/module-guard';

// ---------------------------------------------------------------------------
// Date helpers for limit enforcement
// ---------------------------------------------------------------------------

function getPeriodWindowStart(period: string, now: Date): Date {
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  switch (period) {
    case 'per_week': {
      // Monday 00:00 of the current week
      const day = now.getDay(); // 0=Sun
      const diffToMonday = day === 0 ? -6 : 1 - day;
      return new Date(y, m, d + diffToMonday);
    }
    case 'per_month':
      return new Date(y, m, 1);
    case 'per_year':
      return new Date(y, 0, 1);
    case 'day_visit':
      return new Date(y, m, d);
    default:
      return new Date(y, m, d);
  }
}

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const createPermitSchema = z.object({
  propertyId: z.string().uuid(),
  unitId: z.string().uuid(),
  // vehicleId OR raw vehicle fields — auto-create if vehicleId not provided
  vehicleId: z.string().uuid().optional(),
  vehicleMake: z.string().max(50).optional(),
  vehicleModel: z.string().max(50).optional(),
  vehicleColor: z.string().max(30).optional(),
  // permitTypeId OR permitType string — look up / auto-create if permitTypeId not provided
  permitTypeId: z.string().uuid().optional(),
  permitType: z.string().max(50).optional(),
  licensePlate: z.string().min(1).max(15),
  startDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  endDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  areaId: z.string().uuid().optional(),
  spotId: z.string().uuid().optional(),
  residentId: z.string().uuid().optional(),
  notes: z.string().max(500).optional(),
  autoRenew: z.boolean().optional(),
});

const patchPermitSchema = z.object({
  permitId: z.string().uuid(),
  action: z.enum(['activate', 'suspend', 'expire', 'renew', 'cancel']),
  reason: z.string().max(500).optional(),
  newStartDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  newEndDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
});

// ---------------------------------------------------------------------------
// Valid state transitions
// ---------------------------------------------------------------------------

const VALID_TRANSITIONS: Record<string, string[]> = {
  draft: ['activate', 'cancel'],
  pending_review: ['activate', 'cancel'],
  active: ['suspend', 'expire', 'renew', 'cancel'],
  suspended: ['activate', 'cancel'],
};

// Terminal states — no transitions allowed
const TERMINAL_STATES = new Set(['expired', 'cancelled', 'revoked', 'denied']);

// ---------------------------------------------------------------------------
// Reference number generator
// ---------------------------------------------------------------------------

function generateReferenceNumber(date: string): string {
  const datePart = date.replace(/-/g, '');
  const randomPart = String(Math.floor(1000 + Math.random() * 9000));
  return `PRK-${datePart}-${randomPart}`;
}

// ---------------------------------------------------------------------------
// GET /api/v1/parking
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  // Skip demo handler — uses the real database for consistent GET/POST
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const moduleCheck = await requireModule(request, 'parking');
    if (moduleCheck) return moduleCheck;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const type = searchParams.get('type'); // permits or violations
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const unitId = searchParams.get('unitId');
    const vehicleId = searchParams.get('vehicleId');

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    if (type === 'violations') {
      const where: Record<string, unknown> = { propertyId, deletedAt: null };
      if (status) where.status = status;
      if (search) {
        where.OR = [
          { licensePlate: { contains: search, mode: 'insensitive' } },
          { location: { contains: search, mode: 'insensitive' } },
        ];
      }

      const violations = await prisma.parkingViolation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json({ data: violations });
    }

    // Default: permits
    const where: Record<string, unknown> = { propertyId, deletedAt: null };
    if (status) where.status = status;
    if (unitId) where.unitId = unitId;
    if (vehicleId) where.vehicleId = vehicleId;
    if (search) {
      where.OR = [
        { referenceNumber: { contains: search, mode: 'insensitive' } },
        { licensePlate: { contains: search, mode: 'insensitive' } },
      ];
    }

    const permits = await prisma.parkingPermit.findMany({
      where,
      include: {
        unit: { select: { id: true, number: true } },
        permitType: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data: permits });
  } catch (error) {
    console.error('GET /api/v1/parking error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch parking data' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/parking — Create Permit
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  // Skip demo handler — uses the real database for consistent GET/POST
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const moduleCheck = await requireModule(request, 'parking');
    if (moduleCheck) return moduleCheck;

    const body = await request.json();
    const parsed = createPermitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const data = parsed.data;

    // Default startDate to today if not provided
    if (!data.startDate) {
      data.startDate = new Date().toISOString().split('T')[0];
    }

    // Auto-create vehicle from raw fields if vehicleId not provided
    if (!data.vehicleId) {
      if (!data.vehicleMake || !data.vehicleModel) {
        return NextResponse.json(
          {
            error: 'VALIDATION_ERROR',
            message: 'vehicleId or vehicleMake+vehicleModel is required',
          },
          { status: 400 },
        );
      }
      const vehicle = await prisma.vehicle.create({
        data: {
          propertyId: data.propertyId,
          unitId: data.unitId,
          userId: auth.user.userId,
          make: data.vehicleMake,
          model: data.vehicleModel,
          color: data.vehicleColor || null,
          licensePlate: data.licensePlate,
          provinceState: 'ON', // default province
        },
      });
      data.vehicleId = vehicle.id;
    }

    // Look up or auto-create permit type if permitTypeId not provided
    if (!data.permitTypeId) {
      const permitTypeName = data.permitType || 'resident';
      let existingType = await prisma.permitType.findFirst({
        where: {
          OR: [
            { propertyId: data.propertyId, name: { equals: permitTypeName, mode: 'insensitive' } },
            { propertyId: null, name: { equals: permitTypeName, mode: 'insensitive' } },
          ],
          isActive: true,
        },
      });
      if (!existingType) {
        existingType = await prisma.permitType.create({
          data: {
            propertyId: data.propertyId,
            name: permitTypeName.charAt(0).toUpperCase() + permitTypeName.slice(1),
            defaultDurationDays: 365,
            renewable: true,
            requiresApproval: false,
            maxPerUnit: 2,
          },
        });
      }
      data.permitTypeId = existingType.id;
    }

    // Check for overlapping active permits on the same vehicle
    const overlap = await prisma.parkingPermit.findFirst({
      where: {
        vehicleId: data.vehicleId!,
        status: { in: ['active', 'draft', 'pending_review'] },
        deletedAt: null,
        validFrom: { lte: new Date(data.endDate || '2099-12-31') },
        validUntil: { gte: new Date(data.startDate!) },
      },
    });

    if (overlap) {
      return NextResponse.json(
        {
          error: 'OVERLAP_CONFLICT',
          message: 'Vehicle already has an active permit for this period',
        },
        { status: 409 },
      );
    }

    // ---- Parking limit enforcement ----
    const limitConfigs = await prisma.parkingLimitConfig.findMany({
      where: { propertyId: data.propertyId, isActive: true },
    });

    if (limitConfigs.length > 0) {
      const now = new Date();
      for (const config of limitConfigs) {
        // Skip consecutive-day enforcement (requires chain analysis — future work)
        if (config.period === 'consecutive') continue;

        const windowStart = getPeriodWindowStart(config.period, now);
        const whereClause: Record<string, unknown> = {
          propertyId: data.propertyId,
          status: { in: ['active', 'pending_review'] },
          deletedAt: null,
          validFrom: { gte: windowStart },
        };

        if (config.scope === 'per_unit') {
          whereClause.unitId = data.unitId;
        } else if (config.scope === 'per_plate') {
          whereClause.licensePlate = { equals: data.licensePlate, mode: 'insensitive' };
        }
        // per_area: skip (areaId not always present on permit)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const count = await prisma.parkingPermit.count({ where: whereClause as any });

        if (config.maxCount > 0 && count >= config.maxCount) {
          const scopeLabel = config.scope.replace(/_/g, ' ');
          const periodLabel = config.period.replace(/_/g, ' ');
          return NextResponse.json(
            {
              error: 'LIMIT_EXCEEDED',
              message: `Parking limit exceeded: max ${config.maxCount} permit${config.maxCount === 1 ? '' : 's'} ${periodLabel} ${scopeLabel}`,
              config: {
                scope: config.scope,
                period: config.period,
                limit: config.maxCount,
                current: count,
              },
            },
            { status: 422 },
          );
        }
      }
    }

    // Find available spot if areaId provided
    let assignedSpot: { id: string; spotNumber: string } | null = null;
    if (data.areaId && !data.spotId) {
      assignedSpot = await prisma.parkingSpot.findFirst({
        where: { areaId: data.areaId, status: 'available' },
        select: { id: true, spotNumber: true },
      });
    }

    const spotId = data.spotId || assignedSpot?.id || null;

    // Check for unlinked violations matching this plate
    const unmatchedViolations = await prisma.parkingViolation.findMany({
      where: {
        propertyId: data.propertyId,
        licensePlate: { equals: data.licensePlate, mode: 'insensitive' },
        status: 'open',
        deletedAt: null,
      },
      select: { id: true },
    });

    const referenceNumber = generateReferenceNumber(data.startDate!);

    // Use transaction for atomicity
    const result = await prisma.$transaction(
      async (tx: {
        parkingPermit: { create: typeof prisma.parkingPermit.create };
        parkingSpot: { update: typeof prisma.parkingSpot.update };
        parkingViolation: { updateMany: typeof prisma.parkingViolation.updateMany };
      }) => {
        const permit = await tx.parkingPermit.create({
          data: {
            propertyId: data.propertyId,
            unitId: data.unitId,
            vehicleId: data.vehicleId!,
            permitTypeId: data.permitTypeId!,
            licensePlate: data.licensePlate,
            validFrom: new Date(data.startDate!),
            validUntil: data.endDate ? new Date(data.endDate) : new Date('2099-12-31'),
            areaId: data.areaId || null,
            spotId,
            residentId: data.residentId || auth.user.userId,
            referenceNumber,
            status: 'active',
            autoRenew: data.autoRenew || false,
            notes: data.notes || null,
            createdById: auth.user.userId,
          },
        });

        // Mark spot as occupied
        if (spotId) {
          await tx.parkingSpot.update({
            where: { id: spotId },
            data: { status: 'occupied', assignedPermitId: permit.id },
          });
        }

        // Auto-link violations to this permit
        let linkedViolations = 0;
        if (unmatchedViolations.length > 0) {
          const violationIds = unmatchedViolations.map((v) => v.id);
          const result = await tx.parkingViolation.updateMany({
            where: { id: { in: violationIds } },
            data: { unitId: data.unitId },
          });
          linkedViolations = result.count;
        }

        return { ...permit, linkedViolations };
      },
    );

    return NextResponse.json({ data: result, message: 'Permit created.' }, { status: 201 });
  } catch (error) {
    console.error('POST /api/v1/parking error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create permit' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/v1/parking — Permit Lifecycle Transitions
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest) {
  // Skip demo handler — uses the real database for consistent GET/POST
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const moduleCheck = await requireModule(request, 'parking');
    if (moduleCheck) return moduleCheck;

    const body = await request.json();
    const parsed = patchPermitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { permitId, action, reason, newStartDate, newEndDate } = parsed.data;

    const permit = await prisma.parkingPermit.findUnique({ where: { id: permitId } });

    if (!permit) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Permit not found' },
        { status: 404 },
      );
    }

    // Check terminal states
    if (TERMINAL_STATES.has(permit.status)) {
      return NextResponse.json(
        { error: 'INVALID_TRANSITION', message: `Cannot ${action} a ${permit.status} permit` },
        { status: 409 },
      );
    }

    // Check valid transitions
    const allowed = VALID_TRANSITIONS[permit.status];
    if (!allowed || !allowed.includes(action)) {
      return NextResponse.json(
        { error: 'INVALID_TRANSITION', message: `Cannot ${action} a ${permit.status} permit` },
        { status: 409 },
      );
    }

    // Handle each action
    switch (action) {
      case 'activate': {
        const updated = await prisma.parkingPermit.update({
          where: { id: permitId },
          data: {
            status: 'active',
            approvedById: auth.user.userId,
            approvedAt: new Date(),
          },
        });
        return NextResponse.json({ data: updated, message: 'Permit activated.' });
      }

      case 'suspend': {
        const updated = await prisma.parkingPermit.update({
          where: { id: permitId },
          data: {
            status: 'suspended',
            suspensionReason: reason || null,
          },
        });
        return NextResponse.json({ data: updated, message: 'Permit suspended.' });
      }

      case 'expire': {
        const updated = await prisma.parkingPermit.update({
          where: { id: permitId },
          data: { status: 'expired' },
        });
        return NextResponse.json({ data: updated, message: 'Permit expired.' });
      }

      case 'renew': {
        const result = await prisma.$transaction(
          async (tx: {
            parkingPermit: {
              update: typeof prisma.parkingPermit.update;
              create: typeof prisma.parkingPermit.create;
            };
          }) => {
            // Expire old permit
            await tx.parkingPermit.update({
              where: { id: permitId },
              data: { status: 'expired' },
            });

            // Create new permit linked to old one
            const startDate = newStartDate || permit.validUntil.toISOString().split('T')[0]!;
            const referenceNumber = generateReferenceNumber(startDate);

            const renewed = await tx.parkingPermit.create({
              data: {
                propertyId: permit.propertyId,
                unitId: permit.unitId,
                vehicleId: permit.vehicleId,
                permitTypeId: permit.permitTypeId,
                licensePlate: permit.licensePlate,
                vehicleMake: permit.vehicleMake,
                vehicleModel: permit.vehicleModel,
                vehicleYear: permit.vehicleYear,
                vehicleColor: permit.vehicleColor,
                areaId: permit.areaId,
                spotId: permit.spotId,
                residentId: permit.residentId,
                validFrom: new Date(startDate),
                validUntil: newEndDate ? new Date(newEndDate) : new Date('2099-12-31'),
                autoRenew: permit.autoRenew,
                referenceNumber,
                status: 'active',
                renewedFromId: permit.id,
                createdById: auth.user.userId,
              },
            });

            return renewed;
          },
        );

        return NextResponse.json({ data: result, message: 'Permit renewed.' }, { status: 201 });
      }

      case 'cancel': {
        const result = await prisma.$transaction(
          async (tx: {
            parkingPermit: { update: typeof prisma.parkingPermit.update };
            parkingSpot: { update: typeof prisma.parkingSpot.update };
          }) => {
            const updated = await tx.parkingPermit.update({
              where: { id: permitId },
              data: {
                status: 'cancelled',
                revokedReason: reason || null,
                revokedById: auth.user.userId,
                revokedAt: new Date(),
              },
            });

            // Release spot if assigned
            if (permit.spotId) {
              await tx.parkingSpot.update({
                where: { id: permit.spotId },
                data: { status: 'available', assignedPermitId: null },
              });
            }

            return updated;
          },
        );

        return NextResponse.json({ data: result, message: 'Permit cancelled.' });
      }

      default:
        return NextResponse.json(
          { error: 'INVALID_ACTION', message: `Unknown action: ${action as string}` },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error('PATCH /api/v1/parking error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update permit' },
      { status: 500 },
    );
  }
}
