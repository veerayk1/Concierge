/**
 * Parking Violations API — Create violation
 * Per PRD 13
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';

const createViolationSchema = z.object({
  propertyId: z.string().uuid(),
  areaId: z.string().uuid().optional(),
  licensePlate: z.string().min(1, 'License plate is required').max(20),
  location: z.string().min(1, 'Location is required').max(200),
  violationType: z.string().min(1, 'Violation type is required').max(100),
  description: z.string().max(1000).optional(),
  photoUrl: z.string().url().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const body = await request.json();
    const parsed = createViolationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;

    const violation = await prisma.parkingViolation.create({
      data: {
        propertyId: input.propertyId,
        areaId: input.areaId || null,
        licensePlate: input.licensePlate.toUpperCase(),
        location: input.location,
        violationType: input.violationType,
        description: input.description || null,
        status: 'open',
        reportedById: 'demo-user',
      },
    });

    return NextResponse.json({ data: violation, message: 'Violation reported.' }, { status: 201 });
  } catch (error) {
    console.error('POST /api/v1/parking/violations error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to report violation' },
      { status: 500 },
    );
  }
}
