/**
 * Bulk Unit Creation API
 * Per PRD 07 — Import units in batch
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';
import { handleDemoRequest } from '@/server/demo';
import { stripHtml, stripControlChars } from '@/lib/sanitize';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

const bulkUnitSchema = z.object({
  propertyId: z.string().uuid(),
  skipDuplicates: z.boolean().default(true),
  units: z
    .array(
      z.object({
        number: z.string().min(1).max(50),
        floor: z.number().int().min(-10).max(200).optional().nullable(),
        buildingId: z.string().uuid().optional().nullable(),
        building: z.string().max(100).optional().nullable(),
        unitType: z.string().max(50).optional().nullable(),
        squareFootage: z.number().min(0).optional().nullable(),
        status: z.string().max(50).optional().nullable(),
        enterPhoneCode: z.string().max(50).optional().nullable(),
        parkingSpot: z.string().max(50).optional().nullable(),
        locker: z.string().max(50).optional().nullable(),
        keyTag: z.string().max(50).optional().nullable(),
        comments: z.string().max(5000).optional().nullable(),
        customFields: z.record(z.unknown()).optional().nullable(),
      }),
    )
    .min(1)
    .max(2000),
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
    const parsed = bulkUnitSchema.safeParse(body);

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

    const { propertyId, units, skipDuplicates } = parsed.data;

    // Pre-fetch existing unit numbers for this property
    const existingUnits = await prisma.unit.findMany({
      where: { propertyId, deletedAt: null },
      select: { number: true },
    });
    const existingNumbers = new Set(existingUnits.map((u) => u.number.toLowerCase()));

    const results: {
      created: number;
      skipped: number;
      errors: Array<{ index: number; number: string; message: string }>;
    } = { created: 0, skipped: 0, errors: [] };

    // Track numbers within this batch to detect intra-batch duplicates
    const batchNumbers = new Set<string>();

    const toCreate: Array<{
      propertyId: string;
      number: string;
      floor: number | null;
      buildingId: string | null;
      unitType: string;
      status: string;
      squareFootage: number | null;
      enterPhoneCode: string | null;
      parkingSpot: string | null;
      locker: string | null;
      keyTag: string | null;
      comments: string | null;
      customFields: Prisma.InputJsonValue | typeof Prisma.JsonNull;
    }> = [];

    for (let i = 0; i < units.length; i++) {
      const unit = units[i]!;
      const sanitizedNumber = stripControlChars(stripHtml(unit.number)).trim();
      const lowerNumber = sanitizedNumber.toLowerCase();

      // Check for duplicates
      if (existingNumbers.has(lowerNumber) || batchNumbers.has(lowerNumber)) {
        if (skipDuplicates) {
          results.skipped++;
          continue;
        } else {
          results.errors.push({
            index: i,
            number: sanitizedNumber,
            message: `Unit "${sanitizedNumber}" already exists`,
          });
          continue;
        }
      }

      batchNumbers.add(lowerNumber);
      toCreate.push({
        propertyId,
        number: sanitizedNumber,
        floor: unit.floor ?? null,
        buildingId: unit.buildingId ?? null,
        unitType: unit.unitType ?? 'residential',
        status: 'vacant',
        squareFootage: unit.squareFootage ?? null,
        enterPhoneCode: unit.enterPhoneCode ? stripControlChars(unit.enterPhoneCode) : null,
        parkingSpot: unit.parkingSpot ? stripControlChars(unit.parkingSpot) : null,
        locker: unit.locker ? stripControlChars(unit.locker) : null,
        keyTag: unit.keyTag ? stripControlChars(unit.keyTag) : null,
        comments: unit.comments ? stripControlChars(stripHtml(unit.comments)) : null,
        customFields: unit.customFields
          ? (unit.customFields as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      });
    }

    // Bulk create in transaction
    if (toCreate.length > 0) {
      await prisma.$transaction(async (tx) => {
        // createMany doesn't support returning created records on all DBs,
        // but it's the fastest approach for bulk inserts
        await tx.unit.createMany({ data: toCreate });
      });
      results.created = toCreate.length;
    }

    return NextResponse.json(
      {
        data: results,
        message: `${results.created} units created, ${results.skipped} skipped, ${results.errors.length} errors`,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/v1/units/bulk error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to bulk create units' },
      { status: 500 },
    );
  }
}
