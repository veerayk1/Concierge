/**
 * Bulk Buzzer Code Creation API
 * Import buzzer codes in batch during property setup wizard.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';
import { handleDemoRequest } from '@/server/demo';
import { stripHtml, stripControlChars } from '@/lib/sanitize';
import { z } from 'zod';

const bulkBuzzerSchema = z.object({
  propertyId: z.string().uuid(),
  codes: z
    .array(
      z.object({
        unitNumber: z.string().min(1).max(20),
        code: z.string().min(1).max(20),
        comments: z.string().max(500).optional().nullable(),
      }),
    )
    .min(1)
    .max(1000),
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
    const parsed = bulkBuzzerSchema.safeParse(body);

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

    const { propertyId, codes } = parsed.data;

    // Pre-fetch units for this property
    const units = await prisma.unit.findMany({
      where: { propertyId, deletedAt: null },
      select: { id: true, number: true },
    });
    const unitMap = new Map(units.map((u) => [u.number.toLowerCase(), u.id]));

    // Check for existing buzzer codes per unit
    const existingCodes = await prisma.buzzerCode.findMany({
      where: { propertyId },
      select: { unitId: true, code: true },
    });
    const existingSet = new Set(existingCodes.map((c) => `${c.unitId}:${c.code.toLowerCase()}`));

    const results = {
      created: 0,
      skipped: 0,
      errors: [] as Array<{ index: number; unitNumber: string; message: string }>,
    };

    const toCreate: Array<{
      propertyId: string;
      unitId: string;
      code: string;
      comments: string | null;
    }> = [];

    for (let i = 0; i < codes.length; i++) {
      const entry = codes[i]!;
      const sanitizedCode = stripControlChars(entry.code).trim();

      const unitId = unitMap.get(entry.unitNumber.toLowerCase());
      if (!unitId) {
        results.errors.push({
          index: i,
          unitNumber: entry.unitNumber,
          message: `Unit "${entry.unitNumber}" not found`,
        });
        continue;
      }

      const key = `${unitId}:${sanitizedCode.toLowerCase()}`;
      if (existingSet.has(key)) {
        results.skipped++;
        continue;
      }

      existingSet.add(key);
      toCreate.push({
        propertyId,
        unitId,
        code: sanitizedCode,
        comments: entry.comments ? stripControlChars(stripHtml(entry.comments)) : null,
      });
    }

    if (toCreate.length > 0) {
      await prisma.$transaction(async (tx) => {
        await tx.buzzerCode.createMany({ data: toCreate });
      });
      results.created = toCreate.length;
    }

    return NextResponse.json(
      {
        data: results,
        message: `${results.created} buzzer codes created, ${results.skipped} skipped, ${results.errors.length} errors`,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/v1/buzzer-codes/bulk error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to bulk create buzzer codes' },
      { status: 500 },
    );
  }
}
