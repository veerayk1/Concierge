/**
 * Idea Detail — GET, PATCH /api/v1/ideas/:id
 * Per Condo Control Idea Board
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';
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
  status: z.enum(['submitted', 'under_review', 'planned', 'completed', 'declined']).optional(),
  adminResponse: z.string().max(2000).optional(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;

    const idea = await prisma.idea.findUnique({
      where: { id },
      include: {
        votes: { select: { id: true, userId: true } },
      },
    });

    if (!idea) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Idea not found' }, { status: 404 });
    }

    return NextResponse.json({ data: idea });
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

    // Only admin can change status
    if (input.status) {
      const isAdmin = ADMIN_ROLES.includes(auth.user.role);
      if (!isAdmin) {
        return NextResponse.json(
          { error: 'FORBIDDEN', message: 'Only admins can change idea status' },
          { status: 403 },
        );
      }

      // Validate status transition
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

    // Build update data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {};
    if (input.status) updateData.status = input.status;
    if (input.adminResponse !== undefined) {
      updateData.adminResponse = input.adminResponse;
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
