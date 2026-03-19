/**
 * Ticket Comments API — List & Create Comments on Support Tickets
 * Per PRD 25 — Help Center Support Tickets
 *
 * GET  /api/v1/help/tickets/:id/comments — List comments for a ticket
 * POST /api/v1/help/tickets/:id/comments — Add a comment to a ticket
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { createTicketCommentSchema } from '@/schemas/help';
import { guardRoute } from '@/server/middleware/api-guard';
import type { Role } from '@/types';

const ADMIN_ROLES: Role[] = ['super_admin', 'property_admin', 'property_manager'];

type RouteContext = { params: Promise<{ id: string }> };

// ---------------------------------------------------------------------------
// GET /api/v1/help/tickets/:id/comments
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id: ticketId } = await context.params;
    const isAdmin = ADMIN_ROLES.includes(auth.user.role);

    // Verify ticket exists and user has access
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Support ticket not found' },
        { status: 404 },
      );
    }

    if (!isAdmin && ticket.userId !== auth.user.userId) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Support ticket not found' },
        { status: 404 },
      );
    }

    const comments = await prisma.ticketComment.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ data: comments });
  } catch (error) {
    console.error('GET /api/v1/help/tickets/:id/comments error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch comments' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/help/tickets/:id/comments
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id: ticketId } = await context.params;
    const isAdmin = ADMIN_ROLES.includes(auth.user.role);

    // Verify ticket exists
    const ticket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Support ticket not found' },
        { status: 404 },
      );
    }

    // Non-admins can only comment on their own tickets
    if (!isAdmin && ticket.userId !== auth.user.userId) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Support ticket not found' },
        { status: 404 },
      );
    }

    const body = await request.json();
    const parsed = createTicketCommentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'Invalid input',
          fields: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const comment = await prisma.ticketComment.create({
      data: {
        ticketId,
        userId: auth.user.userId,
        body: parsed.data.body,
        isStaff: isAdmin,
      },
    });

    return NextResponse.json({ data: comment }, { status: 201 });
  } catch (error) {
    console.error('POST /api/v1/help/tickets/:id/comments error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create comment' },
      { status: 500 },
    );
  }
}
