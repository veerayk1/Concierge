/**
 * Equipment Detail API — Get & Update
 * Per CLAUDE.md Phase 2
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { updateEquipmentSchema, EQUIPMENT_STATUS_TRANSITIONS } from '@/schemas/equipment';
import type { EquipmentStatus } from '@/schemas/equipment';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function computeWarrantyStatus(warrantyExpiry: Date | null): 'active' | 'expired' | 'unknown' {
  if (!warrantyExpiry) return 'unknown';
  return new Date(warrantyExpiry) > new Date() ? 'active' : 'expired';
}

function computeReplacementForecast(
  installDate: Date | null,
  expectedLifespanYears: number | null,
): { estimatedReplacementDate: string; isPastDue: boolean } | null {
  if (!installDate || !expectedLifespanYears) return null;

  const install = new Date(installDate);
  const replacementDate = new Date(install);
  replacementDate.setFullYear(replacementDate.getFullYear() + expectedLifespanYears);

  return {
    estimatedReplacementDate: replacementDate.toISOString(),
    isPastDue: replacementDate < new Date(),
  };
}

// ---------------------------------------------------------------------------
// GET /api/v1/equipment/:id
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;

    const equipment = await prisma.equipment.findUnique({
      where: { id, deletedAt: null },
      include: {
        maintenanceRequests: {
          select: { id: true, status: true },
        },
      },
    });

    if (!equipment) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Equipment not found' },
        { status: 404 },
      );
    }

    // Compute maintenance cost aggregate
    // The maintenanceRequest model does not have a `cost` field yet;
    // use a type-safe cast so this compiles now and works once the field is added.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const costAggregate = await (prisma.maintenanceRequest.aggregate as any)({
      where: { equipmentId: id },
      _sum: { cost: true },
    });

    const maintenanceCost = Number(costAggregate?._sum?.cost ?? 0);
    const purchasePrice = Number(equipment.purchasePrice ?? 0);

    const enriched = {
      ...equipment,
      warrantyStatus: computeWarrantyStatus(equipment.warrantyExpiry),
      replacementForecast: computeReplacementForecast(
        equipment.installDate,
        equipment.expectedLifespanYears,
      ),
      costSummary: {
        purchasePrice,
        maintenanceCost,
        totalCostOfOwnership: purchasePrice + maintenanceCost,
      },
    };

    return NextResponse.json({ data: enriched });
  } catch (error) {
    console.error('GET /api/v1/equipment/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch equipment' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/v1/equipment/:id — Update fields + status lifecycle
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    const body = await request.json();

    const parsed = updateEquipmentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;

    // Fetch existing for status transition validation
    const existing = await prisma.equipment.findUnique({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Equipment not found' },
        { status: 404 },
      );
    }

    // ------------------------------------------------------------------
    // Status transition validation
    // ------------------------------------------------------------------
    if (input.status && input.status !== existing.status) {
      const currentStatus = existing.status as EquipmentStatus;
      const newStatus = input.status;
      const allowedTransitions = EQUIPMENT_STATUS_TRANSITIONS[currentStatus];

      if (!allowedTransitions || !allowedTransitions.includes(newStatus)) {
        return NextResponse.json(
          {
            error: 'INVALID_STATUS_TRANSITION',
            message: `Cannot transition from "${currentStatus}" to "${newStatus}". Allowed: ${(allowedTransitions || []).join(', ') || 'none'}.`,
          },
          { status: 400 },
        );
      }
    }

    // ------------------------------------------------------------------
    // Build update payload
    // ------------------------------------------------------------------
    const updateData: Record<string, unknown> = {};

    if (input.name) updateData.name = stripControlChars(stripHtml(input.name));
    if (input.category) updateData.category = input.category;
    if (input.status) updateData.status = input.status;
    if (input.serialNumber !== undefined) updateData.serialNumber = input.serialNumber || null;
    if (input.manufacturer !== undefined) updateData.manufacturer = input.manufacturer || null;
    if (input.modelNumber !== undefined) updateData.modelNumber = input.modelNumber || null;
    if (input.location !== undefined) updateData.location = input.location || null;
    if (input.installDate !== undefined)
      updateData.installDate = input.installDate ? new Date(input.installDate) : null;
    if (input.purchaseDate !== undefined)
      updateData.purchaseDate = input.purchaseDate ? new Date(input.purchaseDate) : null;
    if (input.purchasePrice !== undefined) updateData.purchasePrice = input.purchasePrice;
    if (input.warrantyExpiry !== undefined)
      updateData.warrantyExpiry = input.warrantyExpiry ? new Date(input.warrantyExpiry) : null;
    if (input.expectedLifespanYears !== undefined)
      updateData.expectedLifespanYears = input.expectedLifespanYears;
    if (input.nextInspectionDate !== undefined)
      updateData.nextInspectionDate = input.nextInspectionDate
        ? new Date(input.nextInspectionDate)
        : null;
    if (input.nextServiceDate !== undefined)
      updateData.nextServiceDate = input.nextServiceDate ? new Date(input.nextServiceDate) : null;
    if (input.notes !== undefined)
      updateData.notes = input.notes ? stripControlChars(stripHtml(input.notes)) : null;

    const updated = await prisma.equipment.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      data: updated,
      message: 'Equipment updated.',
    });
  } catch (error) {
    console.error('PATCH /api/v1/equipment/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update equipment' },
      { status: 500 },
    );
  }
}
