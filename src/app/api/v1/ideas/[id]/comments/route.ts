/**
 * Idea Comments — GET/POST /api/v1/ideas/:id/comments
 * Per Condo Control Idea Board
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';

const createCommentSchema = z.object({
  content: z.string().min(1).max(2000),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id: ideaId } = await params;

    // Check idea exists
    const idea = await prisma.idea.findUnique({ where: { id: ideaId } });
    if (!idea) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Idea not found' }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const comments = await (prisma as any).ideaComment.findMany({
      where: { ideaId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ data: comments });
  } catch (error) {
    console.error('GET /api/v1/ideas/:id/comments error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch comments' },
      { status: 500 },
    );
  }
}

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

    const body = await request.json();
    const parsed = createCommentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const comment = await (prisma as any).ideaComment.create({
      data: {
        ideaId,
        userId: auth.user.userId,
        content: stripControlChars(stripHtml(input.content)),
      },
    });

    return NextResponse.json({ data: comment, message: 'Comment added.' }, { status: 201 });
  } catch (error) {
    console.error('POST /api/v1/ideas/:id/comments error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to add comment' },
      { status: 500 },
    );
  }
}
