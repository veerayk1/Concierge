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

/**
 * Sanitize a JSON value for PostgreSQL JSONB storage.
 * Removes null bytes, control characters, and XSS payloads from all string values.
 */
function sanitizeJsonValue(value: unknown): unknown {
  if (value === null || value === undefined) return null;
  if (typeof value === 'string') {
    return stripControlChars(stripHtml(value))
      .replace(/\0/g, '') // Remove null bytes
      .replace(/\\x[0-9a-fA-F]{2}/g, '') // Remove hex escapes
      .replace(/\\u0000/g, '') // Remove unicode null
      .substring(0, 5000); // Limit length
  }
  if (typeof value === 'number' || typeof value === 'boolean') return value;
  if (Array.isArray(value)) return value.map(sanitizeJsonValue);
  if (typeof value === 'object') {
    const cleaned: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      const cleanKey = k.replace(/[^\w\s.-]/g, '').substring(0, 200);
      if (cleanKey) cleaned[cleanKey] = sanitizeJsonValue(v);
    }
    return cleaned;
  }
  return String(value).substring(0, 5000);
}

const bulkRequestSchema = z.object({
  propertyId: z.string().uuid(),
  skipDuplicates: z.boolean().default(true),
  units: z.array(z.record(z.unknown())).min(1).max(2000),
});

// Individual unit schema — lenient, for per-row validation
const unitItemSchema = z.object({
  number: z.string().min(1).max(50),
  floor: z.number().int().min(-10).max(999).optional().nullable(),
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
    const parsed = bulkRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'Invalid request format',
          fields: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const { propertyId, skipDuplicates } = parsed.data;
    // Validate each unit individually — skip invalid ones instead of rejecting the whole batch
    const units = parsed.data.units
      .map((rawUnit, idx) => {
        // Pre-clean: convert non-number floors/sqft to null
        const cleaned = { ...rawUnit };
        if (cleaned.floor !== undefined && cleaned.floor !== null) {
          const f = Number(cleaned.floor);
          cleaned.floor = isNaN(f) ? null : Math.round(f);
        }
        if (cleaned.squareFootage !== undefined && cleaned.squareFootage !== null) {
          const s = Number(cleaned.squareFootage);
          cleaned.squareFootage = isNaN(s) || s < 0 ? null : s;
        }
        // Truncate overly long strings
        if (typeof cleaned.number === 'string')
          cleaned.number = cleaned.number.trim().substring(0, 20); // DB column is VarChar(20)
        if (typeof cleaned.comments === 'string')
          cleaned.comments = cleaned.comments.substring(0, 5000);
        if (typeof cleaned.unitType === 'string')
          cleaned.unitType = cleaned.unitType.substring(0, 50);

        const result = unitItemSchema.safeParse(cleaned);
        if (!result.success) {
          console.warn(`Unit row ${idx} validation failed:`, result.error.flatten().fieldErrors);
          return null;
        }
        return result.data;
      })
      .filter((u): u is z.infer<typeof unitItemSchema> => u !== null && !!u.number);

    // Pre-fetch existing unit numbers for this property
    const existingUnits = await prisma.unit.findMany({
      where: { propertyId, deletedAt: null },
      select: { number: true },
    });
    const existingNumbers = new Set(existingUnits.map((u) => u.number.toLowerCase()));

    // Build a lookup of building names → IDs for this property.
    // If a unit has a `building` string but no `buildingId`, we'll look it up
    // or auto-create the building.
    const buildingNameToId = new Map<string, string>();
    const existingBuildings = await prisma.building.findMany({
      where: { propertyId, deletedAt: null },
      select: { id: true, name: true },
    });
    for (const b of existingBuildings) {
      buildingNameToId.set(b.name.toLowerCase(), b.id);
    }

    // Collect unique building names that need to be created
    const buildingNamesToCreate = new Set<string>();
    for (const unit of units) {
      if (unit.building && !unit.buildingId) {
        const lower = unit.building.trim().toLowerCase();
        if (lower && !buildingNameToId.has(lower)) {
          buildingNamesToCreate.add(unit.building.trim());
        }
      }
    }

    // Auto-create missing buildings
    if (buildingNamesToCreate.size > 0) {
      for (const buildingName of buildingNamesToCreate) {
        const created = await prisma.building.create({
          data: {
            propertyId,
            name: buildingName,
          },
        });
        buildingNameToId.set(buildingName.toLowerCase(), created.id);
      }
    }

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
      let sanitizedNumber = stripControlChars(stripHtml(unit.number)).trim();
      // Remove path traversal, null bytes, and dangerous characters
      sanitizedNumber = sanitizedNumber
        .replace(/\.\.\//g, '')
        .replace(/[<>"'`]/g, '')
        .replace(/\0/g, '')
        .replace(/\\x[0-9a-fA-F]{2}/g, '')
        .substring(0, 20);
      if (!sanitizedNumber) {
        results.errors.push({
          index: i,
          number: unit.number,
          message: 'Invalid unit number after sanitization',
        });
        continue;
      }
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

      // Resolve buildingId from building name if needed
      let resolvedBuildingId = unit.buildingId ?? null;
      if (!resolvedBuildingId && unit.building) {
        const cleanBuilding = stripControlChars(stripHtml(unit.building)).trim();
        if (cleanBuilding) {
          resolvedBuildingId = buildingNameToId.get(cleanBuilding.toLowerCase()) ?? null;
        }
      }

      toCreate.push({
        propertyId,
        number: sanitizedNumber,
        floor: unit.floor ?? null,
        buildingId: resolvedBuildingId,
        unitType: (unit.unitType ?? 'residential').substring(0, 50),
        status: (unit.status ?? 'vacant').substring(0, 20),
        squareFootage: unit.squareFootage ?? null,
        enterPhoneCode: unit.enterPhoneCode
          ? stripControlChars(unit.enterPhoneCode).substring(0, 20)
          : null,
        parkingSpot: unit.parkingSpot ? stripControlChars(unit.parkingSpot).substring(0, 20) : null,
        locker: unit.locker ? stripControlChars(unit.locker).substring(0, 20) : null,
        keyTag: unit.keyTag ? stripControlChars(unit.keyTag).substring(0, 50) : null,
        comments: unit.comments ? stripControlChars(stripHtml(unit.comments)) : null,
        customFields: unit.customFields
          ? (sanitizeJsonValue(unit.customFields) as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      });
    }

    // Bulk create — try createMany first, fall back to one-at-a-time if it fails
    if (toCreate.length > 0) {
      try {
        await prisma.$transaction(async (tx) => {
          await tx.unit.createMany({ data: toCreate });
        });
        results.created = toCreate.length;
      } catch (bulkError) {
        console.warn(
          'createMany failed, falling back to individual inserts:',
          bulkError instanceof Error ? bulkError.message : bulkError,
        );
        // Fall back to creating one at a time — isolate bad rows
        for (let j = 0; j < toCreate.length; j++) {
          try {
            await prisma.unit.create({ data: toCreate[j]! });
            results.created++;
          } catch (rowError) {
            results.errors.push({
              index: j,
              number: toCreate[j]!.number,
              message:
                rowError instanceof Error
                  ? rowError.message.substring(0, 200)
                  : 'Failed to create unit',
            });
          }
        }
      }
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
