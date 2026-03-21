/**
 * Auto-Generate Units API
 * Per PRD 07 & PRD 23 — Generate units from floor ranges
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';
import { handleDemoRequest } from '@/server/demo';
import { z } from 'zod';

const generateSchema = z.object({
  propertyId: z.string().uuid(),
  buildingId: z.string().uuid().optional().nullable(),
  floorStart: z.number().int().min(0).max(200),
  floorEnd: z.number().int().min(0).max(200),
  unitsPerFloor: z.number().int().min(1).max(100),
  numberingPattern: z.enum(['floor_prefix', 'sequential']).default('floor_prefix'),
  startingNumber: z.number().int().min(1).optional(),
  unitType: z.string().max(50).default('residential'),
  skipExisting: z.boolean().default(true),
  dryRun: z.boolean().default(false),
});

export async function POST(request: NextRequest) {
  const demoRes = await handleDemoRequest(request);
  if (demoRes) return demoRes;

  try {
    const auth = await guardRoute(request, {
      roles: ['super_admin', 'property_admin', 'property_manager'],
    });
    if (auth.error) return auth.error;

    const body = await request.json();
    const parsed = generateSchema.safeParse(body);

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

    const input = parsed.data;

    if (input.floorEnd < input.floorStart) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'floorEnd must be >= floorStart' },
        { status: 400 },
      );
    }

    // Generate unit numbers
    const generatedUnits: Array<{ number: string; floor: number }> = [];
    let sequentialCounter = input.startingNumber ?? 1;

    for (let floor = input.floorStart; floor <= input.floorEnd; floor++) {
      for (let unit = 1; unit <= input.unitsPerFloor; unit++) {
        let unitNumber: string;
        if (input.numberingPattern === 'floor_prefix') {
          // Floor 1, unit 1 → 101; Floor 12, unit 5 → 1205
          unitNumber = `${floor}${String(unit).padStart(2, '0')}`;
        } else {
          unitNumber = String(sequentialCounter++);
        }
        generatedUnits.push({ number: unitNumber, floor });
      }
    }

    // Check existing unit numbers
    const existingUnits = await prisma.unit.findMany({
      where: { propertyId: input.propertyId, deletedAt: null },
      select: { number: true },
    });
    const existingNumbers = new Set(existingUnits.map((u) => u.number.toLowerCase()));

    const toCreate = input.skipExisting
      ? generatedUnits.filter((u) => !existingNumbers.has(u.number.toLowerCase()))
      : generatedUnits;

    const skipped = generatedUnits.length - toCreate.length;

    // Dry run — return preview without creating
    if (input.dryRun) {
      return NextResponse.json({
        data: {
          preview: toCreate.slice(0, 20),
          totalToCreate: toCreate.length,
          totalGenerated: generatedUnits.length,
          skipped,
        },
        message: `Would create ${toCreate.length} units (${skipped} already exist)`,
      });
    }

    // Create all units
    if (toCreate.length > 0) {
      await prisma.unit.createMany({
        data: toCreate.map((u) => ({
          propertyId: input.propertyId,
          buildingId: input.buildingId ?? null,
          number: u.number,
          floor: u.floor,
          unitType: input.unitType,
          status: 'vacant',
        })),
      });
    }

    return NextResponse.json(
      {
        data: { created: toCreate.length, skipped },
        message: `${toCreate.length} units generated`,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/v1/units/generate error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to generate units' },
      { status: 500 },
    );
  }
}
