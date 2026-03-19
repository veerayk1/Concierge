/**
 * Board Governance API — Unified entry point for meetings and resolutions
 *
 * GET  /api/v1/governance?type=meetings  — List meetings
 * GET  /api/v1/governance?type=resolutions — List resolutions
 * POST /api/v1/governance — Create meeting or resolution (based on type field)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const GOVERNANCE_ROLES = ['board_member', 'property_admin', 'property_manager', 'super_admin'];

const MEETING_TYPES = ['regular', 'special', 'agm', 'emergency'] as const;
const MEETING_STATUSES = ['scheduled', 'in_progress', 'completed', 'cancelled'] as const;
const RESOLUTION_STATUSES = ['pending', 'approved', 'rejected', 'implemented'] as const;

// ---------------------------------------------------------------------------
// Validation Schemas
// ---------------------------------------------------------------------------

const createMeetingSchema = z.object({
  type: z.literal('meeting'),
  propertyId: z.string().uuid(),
  title: z.string().min(3, 'Title must be at least 3 characters').max(200),
  description: z.string().max(5000).optional(),
  scheduledAt: z.string().datetime(),
  location: z.string().max(200).optional(),
  meetingType: z.enum(MEETING_TYPES).default('regular'),
});

const createResolutionSchema = z.object({
  type: z.literal('resolution'),
  propertyId: z.string().uuid(),
  title: z.string().min(3, 'Title must be at least 3 characters').max(300),
  description: z.string().max(10000).optional(),
  meetingId: z.string().uuid().optional(),
  implementationDeadline: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .optional(),
});

const createSchema = z.discriminatedUnion('type', [createMeetingSchema, createResolutionSchema]);

// ---------------------------------------------------------------------------
// GET /api/v1/governance — List meetings or resolutions
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const type = searchParams.get('type'); // 'meetings' or 'resolutions'

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    if (!type || !['meetings', 'resolutions'].includes(type)) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'type query parameter is required and must be "meetings" or "resolutions"',
        },
        { status: 400 },
      );
    }

    const status = searchParams.get('status');
    const meetingType = searchParams.get('meetingType');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    if (type === 'meetings') {
      return handleListMeetings(propertyId, { status, meetingType, page, pageSize });
    }

    return handleListResolutions(propertyId, { status, page, pageSize });
  } catch (error) {
    console.error('GET /api/v1/governance error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch governance data' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/governance — Create meeting or resolution
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    if (!GOVERNANCE_ROLES.includes(auth.user.role)) {
      return NextResponse.json(
        {
          error: 'FORBIDDEN',
          message: 'Only board members and property admins can create governance items',
        },
        { status: 403 },
      );
    }

    const body = await request.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;

    if (input.type === 'meeting') {
      return handleCreateMeeting(input, auth.user.userId);
    }

    return handleCreateResolution(input, auth.user.userId);
  } catch (error) {
    console.error('POST /api/v1/governance error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create governance item' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// Handlers: Meetings
// ---------------------------------------------------------------------------

async function handleListMeetings(
  propertyId: string,
  opts: { status: string | null; meetingType: string | null; page: number; pageSize: number },
): Promise<NextResponse> {
  const where: Record<string, unknown> = { propertyId, deletedAt: null };
  if (opts.status) where.status = opts.status;
  if (opts.meetingType) where.type = opts.meetingType;

  const [meetings, total] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma.boardMeeting.findMany as any)({
      where,
      include: {
        agendaItems: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { votes: true, minutes: true } },
      },
      orderBy: { scheduledAt: 'desc' },
      skip: (opts.page - 1) * opts.pageSize,
      take: opts.pageSize,
    }),
    prisma.boardMeeting.count({ where } as Parameters<typeof prisma.boardMeeting.count>[0]),
  ]);

  return NextResponse.json({
    data: meetings,
    meta: {
      page: opts.page,
      pageSize: opts.pageSize,
      total,
      totalPages: Math.ceil(total / opts.pageSize),
    },
  });
}

async function handleCreateMeeting(
  input: z.infer<typeof createMeetingSchema>,
  userId: string,
): Promise<NextResponse> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const meeting = await (prisma.boardMeeting.create as any)({
    data: {
      propertyId: input.propertyId,
      title: stripControlChars(stripHtml(input.title)),
      description: input.description ? stripControlChars(stripHtml(input.description)) : null,
      scheduledAt: new Date(input.scheduledAt),
      location: input.location ? stripControlChars(stripHtml(input.location)) : null,
      type: input.meetingType,
      status: 'scheduled',
      createdBy: userId,
    },
  });

  return NextResponse.json({ data: meeting, message: 'Meeting created.' }, { status: 201 });
}

// ---------------------------------------------------------------------------
// Handlers: Resolutions
// ---------------------------------------------------------------------------

async function handleListResolutions(
  propertyId: string,
  opts: { status: string | null; page: number; pageSize: number },
): Promise<NextResponse> {
  const where: Record<string, unknown> = { propertyId, deletedAt: null };
  if (opts.status) where.status = opts.status;

  const [resolutions, total] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (prisma.boardResolution.findMany as any)({
      where,
      include: {
        meeting: { select: { id: true, title: true, scheduledAt: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (opts.page - 1) * opts.pageSize,
      take: opts.pageSize,
    }),
    prisma.boardResolution.count({ where } as Parameters<typeof prisma.boardResolution.count>[0]),
  ]);

  return NextResponse.json({
    data: resolutions,
    meta: {
      page: opts.page,
      pageSize: opts.pageSize,
      total,
      totalPages: Math.ceil(total / opts.pageSize),
    },
  });
}

async function handleCreateResolution(
  input: z.infer<typeof createResolutionSchema>,
  userId: string,
): Promise<NextResponse> {
  // Verify meeting exists if provided
  if (input.meetingId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const meeting = await (prisma.boardMeeting.findUnique as any)({
      where: { id: input.meetingId },
    });

    if (!meeting) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Meeting not found' },
        { status: 404 },
      );
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resolution = await (prisma.boardResolution.create as any)({
    data: {
      propertyId: input.propertyId,
      title: stripControlChars(stripHtml(input.title)),
      description: input.description ? stripControlChars(stripHtml(input.description)) : null,
      meetingId: input.meetingId || null,
      implementationDeadline: input.implementationDeadline
        ? new Date(input.implementationDeadline)
        : null,
      status: 'pending',
      createdBy: userId,
    },
  });

  return NextResponse.json({ data: resolution, message: 'Resolution created.' }, { status: 201 });
}
