/**
 * Idea Detail — GET, PATCH /api/v1/ideas/:id
 * Per CLAUDE.md nice-to-have #9 (Idea Board)
 *
 * GET   — Fetch idea with comments and vote info
 * PATCH — Update status/adminResponse (admin only), edit title/description (author only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';
import type { Role } from '@/types';

const ADMIN_ROLES: Role[] = ['super_admin', 'property_admin', 'property_manager'];

/** Valid status transitions for ideas */
const VALID_TRANSITIONS: Record<string, string[]> = {
  submitted: ['under_review', 'declined'],
  under_review: ['planned', 'declined'],
  planned: ['completed', 'declined'],
  completed: [],
  declined: [],
};

const updateIdeaSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  description: z.string().min(10).max(5000).optional(),
  status: z.enum(['submitted', 'under_review', 'planned', 'completed', 'declined']).optional(),
  adminResponse: z.string().max(2000).optional(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const idea = await (prisma.idea.findUnique as any)({
      where: { id },
      include: {
        votes: { select: { id: true, userId: true } },
      },
    });

    if (!idea) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Idea not found' }, { status: 404 });
    }

    // Fetch comments separately (IdeaComment may not have direct relation)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const comments = await (prisma as any).ideaComment.findMany({
      where: { ideaId: id },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({
      data: {
        ...idea,
        comments,
        commentCount: comments.length,
      },
    });
  } catch (error) {
    console.error('GET /api/v1/ideas/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch idea' },
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
    const parsed = updateIdeaSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const idea = await prisma.idea.findUnique({ where: { id } });
    if (!idea) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Idea not found' }, { status: 404 });
    }

    const input = parsed.data;
    const isAdmin = ADMIN_ROLES.includes(auth.user.role);
    const isAuthor = (idea as { userId: string }).userId === auth.user.userId;

    // Status changes and admin responses: admin only
    if (input.status || input.adminResponse !== undefined) {
      if (!isAdmin) {
        return NextResponse.json(
          { error: 'FORBIDDEN', message: 'Only admins can change idea status or respond' },
          { status: 403 },
        );
      }

      // Validate status transition
      if (input.status) {
        const currentStatus = (idea as { status: string }).status;
        const allowed = VALID_TRANSITIONS[currentStatus] || [];
        if (!allowed.includes(input.status)) {
          return NextResponse.json(
            {
              error: 'INVALID_TRANSITION',
              message: `Cannot transition from ${currentStatus} to ${input.status}`,
            },
            { status: 400 },
          );
        }
      }
    }

    // Content edits: author only (title, description)
    if (input.title !== undefined || input.description !== undefined) {
      if (!isAuthor && !isAdmin) {
        return NextResponse.json(
          { error: 'FORBIDDEN', message: 'You can only edit your own ideas' },
          { status: 403 },
        );
      }
    }

    // Build update data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {};
    if (input.title !== undefined) updateData.title = stripControlChars(stripHtml(input.title));
    if (input.description !== undefined)
      updateData.description = stripControlChars(stripHtml(input.description));
    if (input.status) updateData.status = input.status;
    if (input.adminResponse !== undefined) {
      updateData.adminResponse = stripControlChars(stripHtml(input.adminResponse));
      updateData.adminResponseById = auth.user.userId;
      updateData.adminResponseAt = new Date();
    }

    const updated = await prisma.idea.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('PATCH /api/v1/ideas/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update idea' },
      { status: 500 },
    );
  }
}
