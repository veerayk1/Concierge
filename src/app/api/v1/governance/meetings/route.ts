/**
 * Board Governance — Meetings API
 *
 * GET  /api/v1/governance/meetings — list meetings
 * POST /api/v1/governance/meetings — create a meeting
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';

const GOVERNANCE_ROLES = ['board_member', 'property_admin', 'property_manager', 'super_admin'];

const createMeetingSchema = z.object({
  propertyId: z.string().uuid(),
  title: z.string().min(3).max(200),
  description: z.string().max(5000).optional(),
  scheduledAt: z.string().datetime(),
  location: z.string().max(200).optional(),
  type: z.enum(['regular', 'special', 'agm', 'emergency']).default('regular'),
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

    const [meetings, total] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prisma.boardMeeting.findMany as any)({
        where,
        include: {
          agendaItems: {
            orderBy: { sortOrder: 'asc' },
          },
        },
        orderBy: { scheduledAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.boardMeeting.count({ where } as Parameters<typeof prisma.boardMeeting.count>[0]),
    ]);

    return NextResponse.json({
      data: meetings,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('GET /api/v1/governance/meetings error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch meetings' },
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
        {
          error: 'FORBIDDEN',
          message: 'Only board members and property admins can create meetings',
        },
        { status: 403 },
      );
    }

    const body = await request.json();
    const parsed = createMeetingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const meeting = await (prisma.boardMeeting.create as any)({
      data: {
        propertyId: input.propertyId,
        title: input.title,
        description: input.description || null,
        scheduledAt: new Date(input.scheduledAt),
        location: input.location || null,
        type: input.type,
        status: 'scheduled',
        createdBy: auth.user.userId,
      },
    });

    return NextResponse.json({ data: meeting, message: 'Meeting created.' }, { status: 201 });
  } catch (error) {
    console.error('POST /api/v1/governance/meetings error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create meeting' },
      { status: 500 },
    );
  }
}
