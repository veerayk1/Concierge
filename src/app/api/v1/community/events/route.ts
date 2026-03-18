/**
 * Community Events API — per PRD 12
 * Building-wide social events (BBQ, holiday party, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';

const createEventSchema = z.object({
  propertyId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(4000).optional(),
  location: z.string().max(200).optional(),
  startDate: z.string().min(1),
  endDate: z.string().optional(),
  maxAttendees: z.number().int().min(0).optional(),
  requiresRsvp: z.boolean().default(false),
  fee: z.number().min(0).optional(),
  organizer: z.string().max(200).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const upcoming = searchParams.get('upcoming') === 'true';

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    const where: Record<string, unknown> = { propertyId, deletedAt: null };
    if (upcoming) {
      where.startDate = { gte: new Date() };
    }

    const events = await prisma.communityEvent.findMany({
      where,
      orderBy: { startDate: 'asc' },
    });

    return NextResponse.json({ data: events });
  } catch (error) {
    console.error('GET /api/v1/community/events error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch events' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createEventSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;

    const event = await prisma.communityEvent.create({
      data: {
        propertyId: input.propertyId,
        title: input.title,
        description: input.description || null,
        location: input.location || null,
        startDate: new Date(input.startDate),
        endDate: input.endDate ? new Date(input.endDate) : null,
        maxAttendees: input.maxAttendees || null,
        requiresRsvp: input.requiresRsvp,
        organizedById: 'demo-user',
      },
    });

    return NextResponse.json({ data: event, message: 'Event created.' }, { status: 201 });
  } catch (error) {
    console.error('POST /api/v1/community/events error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create event' },
      { status: 500 },
    );
  }
}
