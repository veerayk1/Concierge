/**
 * Board Governance — Meeting Minutes API
 *
 * POST /api/v1/governance/meetings/minutes — record meeting minutes
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';

const GOVERNANCE_ROLES = ['board_member', 'property_admin', 'property_manager', 'super_admin'];

const createMinutesSchema = z.object({
  meetingId: z.string().min(1),
  propertyId: z.string().uuid(),
  content: z.string().min(10).max(50000),
  attendees: z.array(z.string()).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    if (!GOVERNANCE_ROLES.includes(auth.user.role)) {
      return NextResponse.json(
        {
          error: 'FORBIDDEN',
          message: 'Only board members and property admins can record minutes',
        },
        { status: 403 },
      );
    }

    const body = await request.json();
    const parsed = createMinutesSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;

    // Verify meeting exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const meeting = await (prisma.boardMeeting.findUnique as any)({
      where: { id: input.meetingId },
    });

    if (!meeting) {
      return NextResponse.json(
        { error: 'MEETING_NOT_FOUND', message: 'Meeting not found' },
        { status: 404 },
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const minutes = await (prisma.meetingMinutes.create as any)({
      data: {
        meetingId: input.meetingId,
        propertyId: input.propertyId,
        content: input.content,
        attendees: input.attendees || [],
        recordedBy: auth.user.userId,
      },
    });

    return NextResponse.json({ data: minutes, message: 'Minutes recorded.' }, { status: 201 });
  } catch (error) {
    console.error('POST /api/v1/governance/meetings/minutes error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to record minutes' },
      { status: 500 },
    );
  }
}
