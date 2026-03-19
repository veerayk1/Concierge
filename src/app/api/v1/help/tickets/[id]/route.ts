/**
 * Support Ticket Detail API — Get & Update Single Ticket
 * Per PRD 25 — Help Center Support Tickets
 *
 * GET   /api/v1/help/tickets/:id — Get single ticket
 * PATCH /api/v1/help/tickets/:id — Update ticket status/priority/assignee
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { updateSupportTicketSchema } from '@/schemas/help';
import { guardRoute } from '@/server/middleware/api-guard';
import type { Role } from '@/types';

const ADMIN_ROLES: Role[] = ['super_admin', 'property_admin', 'property_manager'];

type RouteContext = { params: Promise<{ id: string }> };

// ---------------------------------------------------------------------------
// GET /api/v1/help/tickets/:id
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await context.params;
    const isAdmin = ADMIN_ROLES.includes(auth.user.role);

    const ticket = await prisma.supportTicket.findUnique({
      where: { id },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Support ticket not found' },
        { status: 404 },
      );
    }

    // Non-admins can only view their own tickets
    if (!isAdmin && ticket.userId !== auth.user.userId) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Support ticket not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: ticket });
  } catch (error) {
    console.error('GET /api/v1/help/tickets/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch support ticket' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/v1/help/tickets/:id
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await context.params;
    const body = await request.json();
    const parsed = updateSupportTicketSchema.safeParse(body);

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

    const existing = await prisma.supportTicket.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Support ticket not found' },
        { status: 404 },
      );
    }

    // Build update data with timestamp tracking
    const updateData: Record<string, unknown> = { ...parsed.data };

    if (parsed.data.status === 'resolved') {
      updateData.resolvedAt = new Date();
    }
    if (parsed.data.status === 'closed') {
      updateData.closedAt = new Date();
    }

    const ticket = await prisma.supportTicket.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ data: ticket });
  } catch (error) {
    console.error('PATCH /api/v1/help/tickets/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update support ticket' },
      { status: 500 },
    );
  }
}
