/**
 * Bulk Vehicle / Parking Import API
 * Import vehicles in batch during property setup wizard.
 * Creates Vehicle records (parking permits require more complex setup).
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';
import { handleDemoRequest } from '@/server/demo';
import { stripHtml, stripControlChars } from '@/lib/sanitize';
import { z } from 'zod';

const bulkParkingSchema = z.object({
  propertyId: z.string().uuid(),
  permits: z
    .array(
      z.object({
        unitNumber: z.string().min(1).max(20),
        licensePlate: z.string().min(1).max(20),
        vehicleMake: z.string().max(50).optional().nullable(),
        vehicleModel: z.string().max(50).optional().nullable(),
        vehicleYear: z.number().int().optional().nullable(),
        vehicleColor: z.string().max(30).optional().nullable(),
        provinceState: z.string().max(50).optional().nullable(),
        spotNumber: z.string().max(20).optional().nullable(),
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
    const parsed = bulkParkingSchema.safeParse(body);

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

    const { propertyId, permits } = parsed.data;

    // Pre-fetch units and find a user per unit for the Vehicle.userId requirement
    const units = await prisma.unit.findMany({
      where: { propertyId, deletedAt: null },
      select: { id: true, number: true },
    });
    const unitMap = new Map(units.map((u) => [u.number.toLowerCase(), u.id]));

    // Find user-property associations to get a userId per unit
    const userProperties = await prisma.userProperty.findMany({
      where: { propertyId, deletedAt: null },
      select: { userId: true },
    });
    // Use the first available user as a fallback owner for bulk-imported vehicles
    const fallbackUserId = userProperties[0]?.userId ?? auth.user?.userId ?? 'system';

    // Check for existing plates
    const existingVehicles = await prisma.vehicle.findMany({
      where: { propertyId, deletedAt: null },
      select: { licensePlate: true },
    });
    const existingPlates = new Set(existingVehicles.map((v) => v.licensePlate.toLowerCase()));

    const results = {
      created: 0,
      skipped: 0,
      errors: [] as Array<{ index: number; licensePlate: string; message: string }>,
    };

    for (let i = 0; i < permits.length; i++) {
      const entry = permits[i]!;
      const plate = stripControlChars(entry.licensePlate).trim().toUpperCase();

      if (existingPlates.has(plate.toLowerCase())) {
        results.skipped++;
        continue;
      }

      const unitId = unitMap.get(entry.unitNumber.toLowerCase());
      if (!unitId) {
        results.errors.push({
          index: i,
          licensePlate: plate,
          message: `Unit "${entry.unitNumber}" not found`,
        });
        continue;
      }

      try {
        await prisma.vehicle.create({
          data: {
            propertyId,
            unitId,
            userId: fallbackUserId,
            make: entry.vehicleMake ? stripControlChars(entry.vehicleMake) : 'Unknown',
            model: entry.vehicleModel ? stripControlChars(entry.vehicleModel) : 'Unknown',
            year: entry.vehicleYear ?? null,
            color: entry.vehicleColor ? stripControlChars(entry.vehicleColor) : null,
            licensePlate: plate,
            provinceState: entry.provinceState || 'ON',
            parkingSpot: entry.spotNumber ? stripControlChars(entry.spotNumber) : null,
            notes: entry.notes ? stripControlChars(stripHtml(entry.notes)) : null,
          },
        });

        existingPlates.add(plate.toLowerCase());
        results.created++;
      } catch (err) {
        results.errors.push({
          index: i,
          licensePlate: plate,
          message: err instanceof Error ? err.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json(
      {
        data: results,
        message: `${results.created} vehicles created, ${results.skipped} skipped, ${results.errors.length} errors`,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/v1/parking/bulk error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to bulk create vehicles' },
      { status: 500 },
    );
  }
}
