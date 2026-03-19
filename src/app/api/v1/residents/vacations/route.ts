/**
 * Vacation Periods API — per PRD 07 Unit Management
 *
 * GET  — List vacation periods for a property (optionally filtered by userId)
 * POST — Create a new vacation period
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const createVacationSchema = z
  .object({
    propertyId: z.string().uuid(),
    userId: z.string().uuid(),
    unitId: z.string().uuid(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'startDate must be YYYY-MM-DD'),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'endDate must be YYYY-MM-DD'),
    notes: z.string().max(500).optional(),
    holdMail: z.boolean().default(false),
  })
  .superRefine((data, ctx) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (end <= start) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'endDate must be after startDate',
        path: ['endDate'],
      });
    }

    if (start < today) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'startDate cannot be in the past',
        path: ['startDate'],
      });
    }
  });

// ---------------------------------------------------------------------------
// GET /api/v1/residents/vacations
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const userId = searchParams.get('userId');

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    const where: Record<string, unknown> = { propertyId, isActive: true };
    if (userId) {
      where.userId = userId;
    }

    const vacations = await prisma.vacationPeriod.findMany({
      where,
      orderBy: { startDate: 'asc' },
    });

    return NextResponse.json({ data: vacations });
  } catch (error) {
    console.error('GET /api/v1/residents/vacations error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch vacation periods' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/residents/vacations
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const body = await request.json();
    const parsed = createVacationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const data = parsed.data;

    // Check for overlapping vacation periods for the same user
    const overlap = await prisma.vacationPeriod.findFirst({
      where: {
        propertyId: data.propertyId,
        userId: data.userId,
        isActive: true,
        startDate: { lte: new Date(data.endDate) },
        endDate: { gte: new Date(data.startDate) },
      },
    });

    if (overlap) {
      return NextResponse.json(
        {
          error: 'OVERLAP_CONFLICT',
          message: 'This user already has a vacation period that overlaps with the requested dates',
        },
        { status: 409 },
      );
    }

    const vacation = await prisma.vacationPeriod.create({
      data: {
        propertyId: data.propertyId,
        userId: data.userId,
        unitId: data.unitId,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        notes: data.notes || null,
        holdMail: data.holdMail,
        isActive: true,
      },
    });

    return NextResponse.json(
      { data: vacation, message: 'Vacation period created.' },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/v1/residents/vacations error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create vacation period' },
      { status: 500 },
    );
  }
}
