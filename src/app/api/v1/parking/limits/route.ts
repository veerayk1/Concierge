/**
 * Parking Limit Configuration API — per PRD 13 Parking Management
 *
 * GET  — List parking limit configs for a property
 * POST — Create a new parking limit config
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VALID_SCOPES = ['per_unit', 'per_plate', 'per_area'] as const;
const VALID_PERIODS = ['per_week', 'per_month', 'per_year', 'consecutive', 'day_visit'] as const;

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const createLimitSchema = z
  .object({
    propertyId: z.string().uuid(),
    permitTypeId: z.string().uuid().optional(),
    scope: z.enum(VALID_SCOPES),
    period: z.enum(VALID_PERIODS),
    maxCount: z.number().int().min(1, 'maxCount must be at least 1'),
    consecutiveDays: z.number().int().min(1).optional(),
    dayVisitLimit: z.number().int().min(1).optional(),
  })
  .superRefine((data, ctx) => {
    // consecutiveDays is only valid when period is "consecutive"
    if (data.consecutiveDays !== undefined && data.period !== 'consecutive') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'consecutiveDays is only valid when period is "consecutive"',
        path: ['consecutiveDays'],
      });
    }

    // dayVisitLimit is only valid when period is "day_visit"
    if (data.dayVisitLimit !== undefined && data.period !== 'day_visit') {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'dayVisitLimit is only valid when period is "day_visit"',
        path: ['dayVisitLimit'],
      });
    }

    // consecutiveDays is required when period is "consecutive"
    if (data.period === 'consecutive' && data.consecutiveDays === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'consecutiveDays is required when period is "consecutive"',
        path: ['consecutiveDays'],
      });
    }

    // dayVisitLimit is required when period is "day_visit"
    if (data.period === 'day_visit' && data.dayVisitLimit === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'dayVisitLimit is required when period is "day_visit"',
        path: ['dayVisitLimit'],
      });
    }
  });

// ---------------------------------------------------------------------------
// GET /api/v1/parking/limits
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    const limits = await prisma.parkingLimitConfig.findMany({
      where: { propertyId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data: limits });
  } catch (error) {
    console.error('GET /api/v1/parking/limits error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch parking limits' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/parking/limits
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const body = await request.json();
    const parsed = createLimitSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const data = parsed.data;

    // Check for duplicate scope+period+permitType combination
    const existing = await prisma.parkingLimitConfig.findFirst({
      where: {
        propertyId: data.propertyId,
        permitTypeId: data.permitTypeId || null,
        scope: data.scope,
        period: data.period,
        isActive: true,
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          error: 'DUPLICATE_LIMIT',
          message: 'A limit config with this scope, period, and permit type already exists',
        },
        { status: 409 },
      );
    }

    const limit = await prisma.parkingLimitConfig.create({
      data: {
        propertyId: data.propertyId,
        permitTypeId: data.permitTypeId || null,
        scope: data.scope,
        period: data.period,
        maxCount: data.maxCount,
        consecutiveDays: data.consecutiveDays || null,
        dayVisitLimit: data.dayVisitLimit || null,
        isActive: true,
      },
    });

    return NextResponse.json(
      { data: limit, message: 'Parking limit config created.' },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/v1/parking/limits error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create parking limit config' },
      { status: 500 },
    );
  }
}
