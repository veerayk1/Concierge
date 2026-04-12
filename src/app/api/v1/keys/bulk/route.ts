/**
 * Bulk FOB/Key Creation API
 * Import FOBs and keys in batch during property setup wizard.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';
import { handleDemoRequest } from '@/server/demo';
import { stripHtml, stripControlChars } from '@/lib/sanitize';
import { z } from 'zod';

const bulkFobSchema = z.object({
  propertyId: z.string().uuid(),
  fobs: z
    .array(
      z.object({
        serialNumber: z.string().min(1).max(50),
        unitNumber: z.string().min(1).max(20),
        fobType: z.string().max(30).optional().nullable(),
        status: z.string().max(20).optional().nullable(),
        issuedDate: z.string().optional().nullable(),
        issuedToName: z.string().max(100).optional().nullable(),
        notes: z.string().max(500).optional().nullable(),
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
    const parsed = bulkFobSchema.safeParse(body);

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

    const { propertyId, fobs } = parsed.data;

    // Pre-fetch units for this property to resolve unitNumber -> unitId
    const units = await prisma.unit.findMany({
      where: { propertyId, deletedAt: null },
      select: { id: true, number: true },
    });
    const unitMap = new Map(units.map((u) => [u.number.toLowerCase(), u.id]));

    // Check for existing serial numbers
    const existingFobs = await prisma.fob.findMany({
      where: { propertyId },
      select: { serialNumber: true },
    });
    const existingSerials = new Set(existingFobs.map((f) => f.serialNumber.toLowerCase()));

    const results = {
      created: 0,
      skipped: 0,
      errors: [] as Array<{ index: number; serialNumber: string; message: string }>,
    };

    const toCreate: Array<{
      propertyId: string;
      unitId: string;
      serialNumber: string;
      fobType: string;
      status: string;
      issuedDate: Date | null;
      issuedToName: string | null;
      notes: string | null;
    }> = [];

    for (let i = 0; i < fobs.length; i++) {
      const fob = fobs[i]!;
      const serial = stripControlChars(stripHtml(fob.serialNumber)).trim();

      if (existingSerials.has(serial.toLowerCase())) {
        results.skipped++;
        continue;
      }

      const unitId = unitMap.get(fob.unitNumber.toLowerCase());
      if (!unitId) {
        results.errors.push({
          index: i,
          serialNumber: serial,
          message: `Unit "${fob.unitNumber}" not found`,
        });
        continue;
      }

      existingSerials.add(serial.toLowerCase());
      toCreate.push({
        propertyId,
        unitId,
        serialNumber: serial,
        fobType: fob.fobType || 'standard',
        status: fob.status || 'active',
        issuedDate: fob.issuedDate ? new Date(fob.issuedDate) : null,
        issuedToName: fob.issuedToName ? stripControlChars(fob.issuedToName) : null,
        notes: fob.notes ? stripControlChars(stripHtml(fob.notes)) : null,
      });
    }

    if (toCreate.length > 0) {
      await prisma.$transaction(async (tx) => {
        await tx.fob.createMany({ data: toCreate });
      });
      results.created = toCreate.length;
    }

    return NextResponse.json(
      {
        data: results,
        message: `${results.created} FOBs created, ${results.skipped} skipped, ${results.errors.length} errors`,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/v1/keys/bulk error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to bulk create FOBs' },
      { status: 500 },
    );
  }
}
