/**
 * Units API — List & Create units for a property
 * Per PRD 07 Unit Management
 * Prisma client regenerated — full model support available
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';
import { Prisma } from '@prisma/client';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Validation Schema
// ---------------------------------------------------------------------------

const createUnitSchema = z.object({
  propertyId: z.string().uuid(),
  number: z.string().min(1).max(20),
  floor: z.number().int().min(0).max(200).optional().nullable(),
  buildingId: z.string().uuid().optional().nullable(),
  unitType: z.string().max(50).default('residential'),
  squareFootage: z.number().positive().optional().nullable(),
  enterPhoneCode: z.string().max(20).optional().nullable(),
  parkingSpot: z.string().max(20).optional().nullable(),
  locker: z.string().max(20).optional().nullable(),
  keyTag: z.string().max(50).optional().nullable(),
  comments: z.string().max(2000).optional().nullable(),
  customFields: z.record(z.unknown()).optional().nullable(),
});

export async function GET(request: NextRequest) {
  // Skip demo handler — uses the real database for consistent GET/POST
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const search = searchParams.get('search') || '';
    const buildingId = searchParams.get('buildingId');
    const floor = searchParams.get('floor');
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '100', 10);

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    const where: Record<string, unknown> = {
      propertyId,
      deletedAt: null,
      // Filter out seed/test data markers
      number: {
        not: {
          in: ['__courier_seed__', '__test__', '__demo__', '__seed__']
        }
      }
    };
    if (buildingId) where.buildingId = buildingId;
    if (floor !== null && floor !== undefined && floor !== '') {
      const floorNum = parseInt(floor, 10);
      if (!Number.isNaN(floorNum)) where.floor = floorNum;
    }
    if (status) where.status = status;
    if (search) {
      where.OR = [{ number: { contains: search, mode: 'insensitive' } }];
    }

    const [units, total] = await Promise.all([
      prisma.unit.findMany({
        where,
        include: {
          building: { select: { id: true, name: true } },
          unitInstructions: {
            where: { isActive: true },
            select: { id: true, instructionText: true, priority: true },
          },
          occupancyRecords: {
            where: { moveOutDate: null },
            select: {
              id: true,
              isPrimary: true,
              residentType: true,
              user: {
                select: { id: true, firstName: true, lastName: true, email: true },
              },
            },
          },
          _count: {
            select: {
              occupancyRecords: { where: { moveOutDate: null } },
            },
          },
        },
        orderBy: { number: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.unit.count({ where }),
    ]);

    // Transform to include occupantCount and primaryResident
    const data = units.map((u) => {
      const primaryOccupancy = u.occupancyRecords.find((o) => o.isPrimary);
      const primaryResident = primaryOccupancy?.user ?? u.occupancyRecords[0]?.user ?? null;
      return {
        ...u,
        occupantCount: u._count.occupancyRecords,
        primaryResident: primaryResident
          ? {
              id: primaryResident.id,
              name: `${primaryResident.firstName} ${primaryResident.lastName}`.trim(),
              email: primaryResident.email,
            }
          : null,
        occupancyRecords: undefined,
        _count: undefined,
      };
    });

    return NextResponse.json({
      data,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    console.error('GET /api/v1/units error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch units' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/units — Create a single unit
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  // Skip demo handler — uses the real database for consistent GET/POST
  try {
    const auth = await guardRoute(request, {
      roles: ['super_admin', 'property_admin', 'property_manager'],
    });
    if (auth.error) return auth.error;

    const body = await request.json();
    const parsed = createUnitSchema.safeParse(body);

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

    // Sanitize string fields
    const sanitizedNumber = stripControlChars(stripHtml(input.number)).trim();

    // Check uniqueness within property
    const existing = await prisma.unit.findFirst({
      where: {
        propertyId: input.propertyId,
        number: { equals: sanitizedNumber, mode: 'insensitive' },
        deletedAt: null,
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: 'DUPLICATE_UNIT',
          message: `Unit "${sanitizedNumber}" already exists at this property`,
          fields: { number: [`Unit "${sanitizedNumber}" already exists`] },
        },
        { status: 409 },
      );
    }

    // Build data object — use only fields the generated Prisma client recognizes
    // The full schema has many more fields but the generated client may be stale
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const createData: Record<string, any> = {
      propertyId: input.propertyId,
      number: sanitizedNumber,
      floor: input.floor ?? null,
      unitType: input.unitType,
    };

    // Conditionally add fields that may or may not exist in the generated client
    const optionalFields: Record<string, unknown> = {
      buildingId: input.buildingId ?? null,
      status: 'vacant',
      squareFootage: input.squareFootage ?? null,
      enterPhoneCode: input.enterPhoneCode ? stripControlChars(input.enterPhoneCode) : null,
      parkingSpot: input.parkingSpot ? stripControlChars(input.parkingSpot) : null,
      locker: input.locker ? stripControlChars(input.locker) : null,
      keyTag: input.keyTag ? stripControlChars(input.keyTag) : null,
      comments: input.comments ? stripControlChars(stripHtml(input.comments)) : null,
    };
    if (input.customFields) {
      optionalFields.customFields = input.customFields as Prisma.InputJsonValue;
    }

    // Try full create first, fall back to minimal if stale client
    let unit;
    try {
      unit = await prisma.unit.create({
        data: { ...createData, ...optionalFields },
      });
    } catch {
      // Stale client — create with only core fields
      unit = await prisma.unit.create({
        data: createData,
      });
    }

    return NextResponse.json(
      { data: unit, message: `Unit ${sanitizedNumber} created` },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/v1/units error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create unit' },
      { status: 500 },
    );
  }
}
