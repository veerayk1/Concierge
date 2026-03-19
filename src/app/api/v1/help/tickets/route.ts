/**
 * Support Tickets API — List & Create Tickets
 * Per PRD 25 — Help Center Support Tickets
 *
 * GET  /api/v1/help/tickets — List tickets (user sees own, admin sees all)
 * POST /api/v1/help/tickets — Create a new support ticket
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { createSupportTicketSchema } from '@/schemas/help';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';
import { randomInt } from 'crypto';
import type { Role } from '@/types';

const ADMIN_ROLES: Role[] = ['super_admin', 'property_admin', 'property_manager'];

// ---------------------------------------------------------------------------
// GET /api/v1/help/tickets
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);

    const isAdmin = ADMIN_ROLES.includes(auth.user.role);

    const where: Record<string, unknown> = {
      propertyId: auth.user.propertyId,
    };

    // Non-admins can only see their own tickets
    if (!isAdmin) {
      where.userId = auth.user.userId;
    }

    if (status) where.status = status;

    const [tickets, total] = await Promise.all([
      prisma.supportTicket.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.supportTicket.count({ where }),
    ]);

    return NextResponse.json({
      data: tickets,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('GET /api/v1/help/tickets error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch support tickets' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/help/tickets
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const body = await request.json();
    const parsed = createSupportTicketSchema.safeParse(body);

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

    const input = parsed.data;

    // Auto-generate ticket number TKT-XXXXXX
    const ticketNumber = `TKT-${randomInt(100000, 999999).toString()}`;

    // XSS sanitization on user-provided strings
    const sanitizedSubject = stripControlChars(stripHtml(input.subject));
    const sanitizedDescription = stripControlChars(stripHtml(input.description));

    const ticket = await prisma.supportTicket.create({
      data: {
        ticketNumber,
        subject: sanitizedSubject,
        description: sanitizedDescription,
        category: input.category,
        priority: input.priority,
        status: 'open',
        userId: auth.user.userId,
        propertyId: auth.user.propertyId,
      },
    });

    return NextResponse.json({ data: ticket }, { status: 201 });
  } catch (error) {
    console.error('POST /api/v1/help/tickets error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create support ticket' },
      { status: 500 },
    );
  }
}
