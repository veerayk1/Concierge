/**
 * Event Detail API — Get, Update, Close
 * Per PRD 03 Security Console
 *
 * GET   /api/v1/events/:id — Get event details
 * PATCH /api/v1/events/:id — Update event (status, priority, description)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { updateEventSchema } from '@/schemas/event';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const event = await prisma.event.findUnique({
      where: { id, deletedAt: null },
      include: {
        eventType: {
          select: { id: true, name: true, icon: true, color: true },
        },
        unit: {
          select: { id: true, number: true },
        },
      },
    });

    if (!event) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Event not found' }, { status: 404 });
    }

    return NextResponse.json({ data: event });
  } catch (error) {
    console.error('GET /api/v1/events/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch event' },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const parsed = updateEventSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;
    const updateData: Record<string, unknown> = {};

    if (input.status) {
      updateData.status = input.status;
      if (input.status === 'closed' || input.status === 'resolved') {
        updateData.closedAt = new Date();
        updateData.closedById = 'demo-user'; // TODO: Get from auth
      }
    }
    if (input.priority) updateData.priority = input.priority;
    if (input.title) updateData.title = input.title;
    if (input.description !== undefined) updateData.description = input.description;

    const event = await prisma.event.update({
      where: { id },
      data: updateData,
      include: {
        eventType: {
          select: { id: true, name: true, icon: true, color: true },
        },
      },
    });

    return NextResponse.json({
      data: event,
      message: `Event ${input.status ? input.status : 'updated'}.`,
    });
  } catch (error) {
    console.error('PATCH /api/v1/events/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update event' },
      { status: 500 },
    );
  }
}
