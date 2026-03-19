/**
 * Pets API — per PRD 07
 * Track pets per unit for security and front desk awareness
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';

const createPetSchema = z.object({
  propertyId: z.string().uuid(),
  unitId: z.string().uuid(),
  name: z.string().min(1).max(100),
  species: z.enum(['dog', 'cat', 'bird', 'fish', 'reptile', 'other']),
  breed: z.string().max(100).optional(),
  weight: z.string().max(20).optional(),
  color: z.string().max(50).optional(),
  registrationNumber: z.string().max(50).optional(),
  notes: z.string().max(500).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const unitId = new URL(request.url).searchParams.get('unitId');
    const propertyId = new URL(request.url).searchParams.get('propertyId');

    const where: Record<string, unknown> = { deletedAt: null };
    if (unitId) where.unitId = unitId;
    if (propertyId) where.propertyId = propertyId;

    const pets = await prisma.pet.findMany({
      where,
      include: { unit: { select: { id: true, number: true } } },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ data: pets });
  } catch (error) {
    console.error('GET /api/v1/pets error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch pets' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const body = await request.json();
    const parsed = createPetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;
    const pet = await prisma.pet.create({
      data: {
        propertyId: input.propertyId,
        unitId: input.unitId,
        userId: auth.user.userId,
        name: stripControlChars(stripHtml(input.name)),
        species: input.species,
        breed: input.breed || null,
        color: input.color || null,
        weight: input.weight ? parseFloat(input.weight) : null,
        registrationNumber: input.registrationNumber || null,
        notes: input.notes ? stripControlChars(stripHtml(input.notes)) : null,
      },
    });
    return NextResponse.json({ data: pet, message: 'Pet registered.' }, { status: 201 });
  } catch (error) {
    console.error('POST /api/v1/pets error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to register pet' },
      { status: 500 },
    );
  }
}
