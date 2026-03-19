/**
 * Board Governance — Resolution Tracking API
 *
 * GET  /api/v1/governance/resolutions — list resolutions
 * POST /api/v1/governance/resolutions — create a resolution
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';

const GOVERNANCE_ROLES = ['board_member', 'property_admin', 'property_manager', 'super_admin'];

const createResolutionSchema = z.object({
  propertyId: z.string().uuid(),
  title: z.string().min(3).max(300),
  description: z.string().max(10000).optional(),
  meetingId: z.string().optional(),
  implementationDeadline: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .optional(),
});

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

    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    const where: Record<string, unknown> = { propertyId };
    if (status) where.status = status;

    const [resolutions, total] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prisma.boardResolution.findMany as any)({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.boardResolution.count({ where } as Parameters<typeof prisma.boardResolution.count>[0]),
    ]);

    return NextResponse.json({
      data: resolutions,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('GET /api/v1/governance/resolutions error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch resolutions' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    if (!GOVERNANCE_ROLES.includes(auth.user.role)) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Only board members and admins can create resolutions' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const parsed = createResolutionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resolution = await (prisma.boardResolution.create as any)({
      data: {
        propertyId: input.propertyId,
        title: input.title,
        description: input.description || null,
        meetingId: input.meetingId || null,
        implementationDeadline: input.implementationDeadline
          ? new Date(input.implementationDeadline)
          : null,
        status: 'pending',
        createdBy: auth.user.userId,
      },
    });

    return NextResponse.json({ data: resolution, message: 'Resolution created.' }, { status: 201 });
  } catch (error) {
    console.error('POST /api/v1/governance/resolutions error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create resolution' },
      { status: 500 },
    );
  }
}
