/**
 * Board Governance Detail API — Get, update meeting or resolution by ID
 *
 * GET   /api/v1/governance/:id — Get meeting or resolution detail
 * PATCH /api/v1/governance/:id — Update status, add votes, upload minutes
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

const MEETING_STATUSES = ['scheduled', 'in_progress', 'completed', 'cancelled'] as const;
const RESOLUTION_STATUSES = ['pending', 'approved', 'rejected', 'implemented'] as const;

// ---------------------------------------------------------------------------
// Validation Schemas
// ---------------------------------------------------------------------------

const updateMeetingSchema = z.object({
  entityType: z.literal('meeting'),
  status: z.enum(MEETING_STATUSES).optional(),
  title: z.string().min(3).max(200).optional(),
  description: z.string().max(5000).optional(),
  scheduledAt: z.string().datetime().optional(),
  location: z.string().max(200).optional(),
  // Upload minutes inline
  minutes: z
    .object({
      content: z.string().min(10).max(50000),
      attendees: z.array(z.string()).optional(),
    })
    .optional(),
});

const updateResolutionSchema = z.object({
  entityType: z.literal('resolution'),
  status: z.enum(RESOLUTION_STATUSES).optional(),
  title: z.string().min(3).max(300).optional(),
  description: z.string().max(10000).optional(),
  implementationDeadline: z
    .string()
    .datetime()
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .optional(),
  // Cast a vote on this resolution's meeting agenda item
  vote: z
    .object({
      agendaItemId: z.string().min(1),
      decision: z.enum(['approve', 'reject', 'abstain']),
    })
    .optional(),
});

const updateSchema = z.discriminatedUnion('entityType', [
  updateMeetingSchema,
  updateResolutionSchema,
]);

// ---------------------------------------------------------------------------
// GET /api/v1/governance/:id — Get meeting or resolution detail
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;

    // Try to find as meeting first
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const meeting = await (prisma.boardMeeting.findUnique as any)({
      where: { id },
      include: {
        agendaItems: { orderBy: { sortOrder: 'asc' } },
        votes: true,
        minutes: { orderBy: { createdAt: 'desc' } },
        resolutions: {
          select: { id: true, title: true, status: true, createdAt: true },
        },
        documents: {
          select: { id: true, title: true, type: true, filePath: true, createdAt: true },
        },
      },
    });

    if (meeting && !meeting.deletedAt) {
      // Compute vote tallies per agenda item
      const agendaWithTallies = meeting.agendaItems.map(
        (item: { id: string; title: string; description: string | null; sortOrder: number }) => {
          const itemVotes = meeting.votes.filter(
            (v: { agendaItemId: string }) => v.agendaItemId === item.id,
          );
          const approve = itemVotes.filter((v: { vote: string }) => v.vote === 'approve').length;
          const reject = itemVotes.filter((v: { vote: string }) => v.vote === 'reject').length;
          const abstain = itemVotes.filter((v: { vote: string }) => v.vote === 'abstain').length;

          return {
            ...item,
            voteTally: { approve, reject, abstain, total: itemVotes.length },
          };
        },
      );

      return NextResponse.json({
        data: {
          ...meeting,
          entityType: 'meeting',
          agendaItems: agendaWithTallies,
        },
      });
    }

    // Try as resolution
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const resolution = await (prisma.boardResolution.findUnique as any)({
      where: { id },
      include: {
        meeting: {
          select: { id: true, title: true, scheduledAt: true, status: true },
        },
      },
    });

    if (resolution && !resolution.deletedAt) {
      return NextResponse.json({
        data: {
          ...resolution,
          entityType: 'resolution',
        },
      });
    }

    return NextResponse.json(
      { error: 'NOT_FOUND', message: 'Governance item not found' },
      { status: 404 },
    );
  } catch (error) {
    console.error('GET /api/v1/governance/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch governance item' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/v1/governance/:id — Update status, add votes, upload minutes
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    if (!GOVERNANCE_ROLES.includes(auth.user.role)) {
      return NextResponse.json(
        {
          error: 'FORBIDDEN',
          message: 'Only board members and property admins can update governance items',
        },
        { status: 403 },
      );
    }

    const { id } = await params;
    const body = await request.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;

    if (input.entityType === 'meeting') {
      return handleUpdateMeeting(id, input, auth.user.userId);
    }

    return handleUpdateResolution(id, input, auth.user.userId);
  } catch (error) {
    console.error('PATCH /api/v1/governance/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update governance item' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// Handler: Update Meeting
// ---------------------------------------------------------------------------

async function handleUpdateMeeting(
  id: string,
  input: z.infer<typeof updateMeetingSchema>,
  userId: string,
): Promise<NextResponse> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const meeting = await (prisma.boardMeeting.findUnique as any)({
    where: { id },
  });

  if (!meeting || meeting.deletedAt) {
    return NextResponse.json({ error: 'NOT_FOUND', message: 'Meeting not found' }, { status: 404 });
  }

  // Build update data
  const data: Record<string, unknown> = {};
  if (input.status !== undefined) data.status = input.status;
  if (input.title !== undefined) data.title = stripControlChars(stripHtml(input.title));
  if (input.description !== undefined)
    data.description = stripControlChars(stripHtml(input.description));
  if (input.scheduledAt !== undefined) data.scheduledAt = new Date(input.scheduledAt);
  if (input.location !== undefined) data.location = stripControlChars(stripHtml(input.location));

  // Update meeting fields if any
  let updatedMeeting = meeting;
  if (Object.keys(data).length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updatedMeeting = await (prisma.boardMeeting.update as any)({
      where: { id },
      data,
    });
  }

  // Upload minutes if provided
  if (input.minutes) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma.meetingMinutes.create as any)({
      data: {
        meetingId: id,
        propertyId: meeting.propertyId,
        content: stripControlChars(stripHtml(input.minutes.content)),
        attendees: input.minutes.attendees || [],
        recordedBy: userId,
      },
    });
  }

  return NextResponse.json({ data: updatedMeeting, message: 'Meeting updated.' });
}

// ---------------------------------------------------------------------------
// Handler: Update Resolution
// ---------------------------------------------------------------------------

async function handleUpdateResolution(
  id: string,
  input: z.infer<typeof updateResolutionSchema>,
  userId: string,
): Promise<NextResponse> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const resolution = await (prisma.boardResolution.findUnique as any)({
    where: { id },
  });

  if (!resolution || resolution.deletedAt) {
    return NextResponse.json(
      { error: 'NOT_FOUND', message: 'Resolution not found' },
      { status: 404 },
    );
  }

  // Build update data
  const data: Record<string, unknown> = {};
  if (input.status !== undefined) {
    data.status = input.status;
    if (input.status === 'approved') data.approvedAt = new Date();
  }
  if (input.title !== undefined) data.title = stripControlChars(stripHtml(input.title));
  if (input.description !== undefined)
    data.description = stripControlChars(stripHtml(input.description));
  if (input.implementationDeadline !== undefined)
    data.implementationDeadline = new Date(input.implementationDeadline);

  // Update resolution fields if any
  let updatedResolution = resolution;
  if (Object.keys(data).length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    updatedResolution = await (prisma.boardResolution.update as any)({
      where: { id },
      data,
    });
  }

  // Cast vote if provided (requires a meetingId on the resolution)
  if (input.vote) {
    if (!resolution.meetingId) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'Cannot vote on a resolution without an associated meeting',
        },
        { status: 400 },
      );
    }

    // Check for duplicate vote
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingVote = await (prisma.boardVote.findFirst as any)({
      where: {
        meetingId: resolution.meetingId,
        agendaItemId: input.vote.agendaItemId,
        voterId: userId,
      },
    });

    if (existingVote) {
      return NextResponse.json(
        { error: 'DUPLICATE_VOTE', message: 'You have already voted on this item' },
        { status: 409 },
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma.boardVote.create as any)({
      data: {
        meetingId: resolution.meetingId,
        agendaItemId: input.vote.agendaItemId,
        propertyId: resolution.propertyId,
        vote: input.vote.decision,
        voterId: userId,
      },
    });
  }

  return NextResponse.json({ data: updatedResolution, message: 'Resolution updated.' });
}
