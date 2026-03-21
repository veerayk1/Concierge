/**
 * Occupancy Record Detail API — Update & Delete
 * Per PRD 07 — Move-out workflow
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';
import { handleDemoRequest } from '@/server/demo';
import { z } from 'zod';

const updateOccupancySchema = z.object({
  moveOutDate: z
    .string()
    .refine((d) => !isNaN(Date.parse(d)), 'Invalid date')
    .optional(),
  residentType: z.enum(['owner', 'tenant', 'offsite_owner', 'family_member']).optional(),
  isPrimary: z.boolean().optional(),
  notes: z.string().max(500).optional().nullable(),
});

// ---------------------------------------------------------------------------
// PATCH /api/v1/occupancy/[id] — Update occupancy (e.g., move-out)
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const demoRes = await handleDemoRequest(request);
  if (demoRes) return demoRes;

  try {
    const auth = await guardRoute(request, {
      roles: ['super_admin', 'property_admin', 'property_manager'],
    });
    if (auth.error) return auth.error;

    const { id } = await params;
    const body = await request.json();
    const parsed = updateOccupancySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'Invalid input',
          fields: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const existing = await prisma.occupancyRecord.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Occupancy record not found' },
        { status: 404 },
      );
    }

    const input = parsed.data;
    const updateData: Record<string, unknown> = {};

    if (input.moveOutDate) updateData.moveOutDate = new Date(input.moveOutDate);
    if (input.residentType) updateData.residentType = input.residentType;
    if (input.isPrimary !== undefined) updateData.isPrimary = input.isPrimary;
    if (input.notes !== undefined) updateData.notes = input.notes;

    const record = await prisma.$transaction(async (tx) => {
      // If setting isPrimary, unset others first
      if (input.isPrimary) {
        await tx.occupancyRecord.updateMany({
          where: {
            unitId: existing.unitId,
            moveOutDate: null,
            isPrimary: true,
            id: { not: id },
          },
          data: { isPrimary: false },
        });
      }

      const updated = await tx.occupancyRecord.update({
        where: { id },
        data: updateData,
        include: {
          unit: { select: { id: true, number: true } },
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });

      // If move-out, check if any active occupants remain
      if (input.moveOutDate) {
        const remainingCount = await tx.occupancyRecord.count({
          where: {
            unitId: existing.unitId,
            moveOutDate: null,
          },
        });

        if (remainingCount === 0) {
          await tx.unit.update({
            where: { id: existing.unitId },
            data: { status: 'vacant' },
          });
        }
      }

      return updated;
    });

    return NextResponse.json({
      data: record,
      message: input.moveOutDate ? 'Move-out recorded' : 'Occupancy updated',
    });
  } catch (error) {
    console.error('PATCH /api/v1/occupancy/[id] error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update occupancy record' },
      { status: 500 },
    );
  }
}
