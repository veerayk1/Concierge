/**
 * Idea Voting — POST/DELETE /api/v1/ideas/:id/vote
 * Per Condo Control Idea Board
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id: ideaId } = await params;

    // Check idea exists
    const idea = await prisma.idea.findUnique({ where: { id: ideaId } });
    if (!idea) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Idea not found' }, { status: 404 });
    }

    // Cannot vote on own idea
    if ((idea as { userId: string }).userId === auth.user.userId) {
      return NextResponse.json(
        { error: 'CANNOT_VOTE_OWN_IDEA', message: 'You cannot vote on your own idea' },
        { status: 403 },
      );
    }

    // Check for existing vote
    const existingVote = await prisma.ideaVote.findUnique({
      where: { ideaId_userId: { ideaId, userId: auth.user.userId } },
    });

    if (existingVote) {
      return NextResponse.json(
        { error: 'ALREADY_VOTED', message: 'You have already voted on this idea' },
        { status: 409 },
      );
    }

    // Create the vote
    await prisma.ideaVote.create({
      data: {
        ideaId,
        userId: auth.user.userId,
      },
    });

    // Update vote count aggregate
    const voteCount = await prisma.ideaVote.count({ where: { ideaId } });
    const updated = await prisma.idea.update({
      where: { id: ideaId },
      data: { voteCount },
    });

    return NextResponse.json({ data: updated, message: 'Vote recorded.' }, { status: 201 });
  } catch (error) {
    console.error('POST /api/v1/ideas/:id/vote error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to vote' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id: ideaId } = await params;

    // Check idea exists
    const idea = await prisma.idea.findUnique({ where: { id: ideaId } });
    if (!idea) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Idea not found' }, { status: 404 });
    }

    // Check existing vote
    const existingVote = await prisma.ideaVote.findUnique({
      where: { ideaId_userId: { ideaId, userId: auth.user.userId } },
    });

    if (!existingVote) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'No vote found to remove' },
        { status: 404 },
      );
    }

    // Remove the vote
    await prisma.ideaVote.delete({
      where: { ideaId_userId: { ideaId, userId: auth.user.userId } },
    });

    // Update vote count aggregate
    const voteCount = await prisma.ideaVote.count({ where: { ideaId } });
    const updated = await prisma.idea.update({
      where: { id: ideaId },
      data: { voteCount },
    });

    return NextResponse.json({ data: updated, message: 'Vote removed.' });
  } catch (error) {
    console.error('DELETE /api/v1/ideas/:id/vote error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to remove vote' },
      { status: 500 },
    );
  }
}
