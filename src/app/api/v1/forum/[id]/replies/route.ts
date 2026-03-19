/**
 * Forum Replies — GET, POST /api/v1/forum/:id/replies
 * Per CLAUDE.md nice-to-have #10 (Discussion Forum)
 *
 * GET  — List replies for a topic (supports threaded/nested replies)
 * POST — Reply to a topic (optionally nested via parentReplyId)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';

const createReplySchema = z.object({
  body: z.string().min(1).max(10000),
  parentReplyId: z.string().optional(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id: topicId } = await params;

    // Check topic exists
    const topic = await prisma.forumTopic.findUnique({ where: { id: topicId } });
    if (!topic) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Topic not found' }, { status: 404 });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const replies = await (prisma.forumReply.findMany as any)({
      where: { topicId, status: 'active' },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ data: replies });
  } catch (error) {
    console.error('GET /api/v1/forum/:id/replies error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch replies' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id: topicId } = await params;

    // Check topic exists
    const topic = await prisma.forumTopic.findUnique({ where: { id: topicId } });
    if (!topic) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Topic not found' }, { status: 404 });
    }

    // Check topic is not locked
    if ((topic as { isLocked: boolean }).isLocked) {
      return NextResponse.json(
        { error: 'TOPIC_LOCKED', message: 'This topic is locked and cannot accept new replies' },
        { status: 403 },
      );
    }

    const body = await request.json();
    const parsed = createReplySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;

    // If parentReplyId is provided, validate it exists and belongs to this topic
    if (input.parentReplyId) {
      const parentReply = await prisma.forumReply.findUnique({
        where: { id: input.parentReplyId },
      });
      if (!parentReply || (parentReply as { topicId: string }).topicId !== topicId) {
        return NextResponse.json(
          { error: 'NOT_FOUND', message: 'Parent reply not found in this topic' },
          { status: 404 },
        );
      }
    }

    // Create the reply
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reply = await (prisma.forumReply.create as any)({
      data: {
        topicId,
        userId: auth.user.userId,
        body: stripControlChars(stripHtml(input.body)),
        parentReplyId: input.parentReplyId || null,
        status: 'active',
      },
    });

    // Update topic reply count and last activity
    await prisma.forumTopic.update({
      where: { id: topicId },
      data: {
        replyCount: { increment: 1 },
        lastActivityAt: new Date(),
      },
    });

    // Notify topic author (if not replying to own topic)
    const topicAuthorId = (topic as { userId: string }).userId;
    if (topicAuthorId !== auth.user.userId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (prisma as any).notification.create({
        data: {
          userId: topicAuthorId,
          type: 'forum_reply',
          title: 'New reply to your topic',
          message: `Someone replied to your topic "${(topic as { title: string }).title}"`,
          referenceId: topicId,
          referenceType: 'forum_topic',
          propertyId: (topic as { propertyId: string }).propertyId,
        },
      });
    }

    return NextResponse.json({ data: reply, message: 'Reply posted.' }, { status: 201 });
  } catch (error) {
    console.error('POST /api/v1/forum/:id/replies error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to post reply' },
      { status: 500 },
    );
  }
}
