/**
 * Forum Topic Detail — GET, PATCH, DELETE /api/v1/forum/:id
 * Per CLAUDE.md nice-to-have #10 (Discussion Forum)
 *
 * GET    — Fetch topic with replies
 * PATCH  — Edit topic (author within 30 min, or admin anytime), pin/lock (admin only)
 * DELETE — Soft-delete topic (author or admin)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';
import type { Role } from '@/types';

const ADMIN_ROLES: Role[] = ['super_admin', 'property_admin', 'property_manager'];

const EDIT_WINDOW_MS = 30 * 60 * 1000; // 30 minutes

const updateTopicSchema = z.object({
  title: z.string().min(3).max(200).optional(),
  body: z.string().min(10).max(10000).optional(),
  isPinned: z.boolean().optional(),
  isLocked: z.boolean().optional(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const topic = await (prisma.forumTopic.findUnique as any)({
      where: { id },
      include: {
        replies: {
          where: { status: 'active' },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!topic) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Topic not found' }, { status: 404 });
    }

    return NextResponse.json({ data: topic });
  } catch (error) {
    console.error('GET /api/v1/forum/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch topic' },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    const body = await request.json();
    const parsed = updateTopicSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const topic = await prisma.forumTopic.findUnique({ where: { id } });
    if (!topic) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Topic not found' }, { status: 404 });
    }

    const input = parsed.data;
    const isAdmin = ADMIN_ROLES.includes(auth.user.role);
    const isAuthor = (topic as { userId: string }).userId === auth.user.userId;

    // Admin-only fields: isPinned, isLocked
    if ((input.isPinned !== undefined || input.isLocked !== undefined) && !isAdmin) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Only admins can pin or lock topics' },
        { status: 403 },
      );
    }

    // Content edits: author within 30 min, or admin anytime
    if (input.title !== undefined || input.body !== undefined) {
      if (!isAdmin) {
        if (!isAuthor) {
          return NextResponse.json(
            { error: 'FORBIDDEN', message: 'You can only edit your own topics' },
            { status: 403 },
          );
        }

        const createdAt = new Date((topic as { createdAt: Date }).createdAt).getTime();
        const elapsed = Date.now() - createdAt;
        if (elapsed > EDIT_WINDOW_MS) {
          return NextResponse.json(
            {
              error: 'EDIT_WINDOW_EXPIRED',
              message: 'You can only edit your topic within 30 minutes of creation',
            },
            { status: 403 },
          );
        }
      }
    }

    // Build update data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {};
    if (input.title !== undefined) updateData.title = stripControlChars(stripHtml(input.title));
    if (input.body !== undefined) updateData.body = stripControlChars(stripHtml(input.body));
    if (input.isPinned !== undefined) updateData.isPinned = input.isPinned;
    if (input.isLocked !== undefined) updateData.isLocked = input.isLocked;

    const updated = await prisma.forumTopic.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('PATCH /api/v1/forum/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update topic' },
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

    const { id } = await params;

    const topic = await prisma.forumTopic.findUnique({ where: { id } });
    if (!topic) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Topic not found' }, { status: 404 });
    }

    const isAdmin = ADMIN_ROLES.includes(auth.user.role);
    const isAuthor = (topic as { userId: string }).userId === auth.user.userId;

    if (!isAdmin && !isAuthor) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'You can only delete your own topics' },
        { status: 403 },
      );
    }

    // Soft delete
    const updated = await prisma.forumTopic.update({
      where: { id },
      data: { status: 'deleted' },
    });

    return NextResponse.json({ data: updated, message: 'Topic deleted.' });
  } catch (error) {
    console.error('DELETE /api/v1/forum/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to delete topic' },
      { status: 500 },
    );
  }
}
