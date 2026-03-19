/**
 * Board Governance — Voting API
 *
 * POST /api/v1/governance/meetings/votes — cast a vote
 * GET  /api/v1/governance/meetings/votes — get vote tally
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';

const VOTING_ROLES = ['board_member', 'property_admin', 'super_admin'];

const castVoteSchema = z.object({
  meetingId: z.string().min(1),
  agendaItemId: z.string().min(1),
  propertyId: z.string().uuid(),
  vote: z.enum(['approve', 'reject', 'abstain']),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    if (!VOTING_ROLES.includes(auth.user.role)) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Only board members can cast votes' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const parsed = castVoteSchema.safeParse(body);

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

    // Check for duplicate vote
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingVote = await (prisma.boardVote.findFirst as any)({
      where: {
        meetingId: input.meetingId,
        agendaItemId: input.agendaItemId,
        voterId: auth.user.userId,
      },
    });

    if (existingVote) {
      return NextResponse.json(
        { error: 'DUPLICATE_VOTE', message: 'You have already voted on this item' },
        { status: 409 },
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const vote = await (prisma.boardVote.create as any)({
      data: {
        meetingId: input.meetingId,
        agendaItemId: input.agendaItemId,
        propertyId: input.propertyId,
        vote: input.vote,
        voterId: auth.user.userId,
      },
    });

    return NextResponse.json({ data: vote, message: 'Vote recorded.' }, { status: 201 });
  } catch (error) {
    console.error('POST /api/v1/governance/meetings/votes error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to cast vote' },
      { status: 500 },
    );
  }
}

interface VoteRecord {
  id: string;
  vote: 'approve' | 'reject' | 'abstain';
  voterId: string;
}

function computeVoteTally(votes: VoteRecord[]) {
  const approve = votes.filter((v) => v.vote === 'approve').length;
  const reject = votes.filter((v) => v.vote === 'reject').length;
  const abstain = votes.filter((v) => v.vote === 'abstain').length;
  const total = votes.length;

  // Majority is based on non-abstaining votes
  let result: string;
  if (approve > reject) {
    result = 'passed';
  } else if (reject > approve) {
    result = 'failed';
  } else {
    result = 'tie';
  }

  return {
    approve,
    reject,
    abstain,
    total,
    result,
  };
}

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const meetingId = searchParams.get('meetingId');
    const agendaItemId = searchParams.get('agendaItemId');

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    if (!meetingId) {
      return NextResponse.json(
        { error: 'MISSING_MEETING', message: 'meetingId is required' },
        { status: 400 },
      );
    }

    // Verify meeting exists
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const meeting = await (prisma.boardMeeting.findUnique as any)({
      where: { id: meetingId },
    });

    if (!meeting) {
      return NextResponse.json(
        { error: 'MEETING_NOT_FOUND', message: 'Meeting not found' },
        { status: 404 },
      );
    }

    const where: Record<string, unknown> = { meetingId };
    if (agendaItemId) where.agendaItemId = agendaItemId;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const votes: VoteRecord[] = await (prisma.boardVote.findMany as any)({ where });

    const { approve, reject, abstain, total, result } = computeVoteTally(votes);

    return NextResponse.json({
      data: {
        votes,
        tally: { approve, reject, abstain, total },
        result,
      },
    });
  } catch (error) {
    console.error('GET /api/v1/governance/meetings/votes error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch votes' },
      { status: 500 },
    );
  }
}
