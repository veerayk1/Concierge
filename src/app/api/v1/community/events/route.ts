/**
 * Community Events API — per PRD 12
 * Building-wide social events (BBQ, holiday party, etc.)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';
import { handleDemoRequest } from '@/server/demo';

const createEventSchema = z.object({
  propertyId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(4000).optional(),
  location: z.string().max(200).optional(),
  locationType: z.enum(['on_site', 'off_site', 'virtual', 'hybrid']).default('on_site'),
  virtualUrl: z.string().url().max(500).optional(),
  startDatetime: z.string().min(1),
  endDatetime: z.string().min(1),
  capacity: z.number().int().min(0).optional(),
  rsvpEnabled: z.boolean().default(true),
  categoryId: z.string().uuid().optional(),
});

export async function GET(request: NextRequest) {
  const demoRes = await handleDemoRequest(request);
  if (demoRes) return demoRes;

  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const upcoming = searchParams.get('upcoming') === 'true';

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    const where: Record<string, unknown> = { propertyId };
    if (upcoming) {
      where.startDatetime = { gte: new Date() };
    }

    const events = await prisma.communityEvent.findMany({
      where,
      include: {
        rsvps: { select: { id: true, userId: true, status: true } },
      },
      orderBy: { startDatetime: 'asc' },
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
  const demoRes = await handleDemoRequest(request);
  if (demoRes) return demoRes;

  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

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
        title: stripControlChars(stripHtml(input.title)),
        description: input.description ? stripControlChars(stripHtml(input.description)) : null,
        location: input.location ? stripControlChars(stripHtml(input.location)) : null,
        locationType: input.locationType,
        virtualUrl: input.virtualUrl || null,
        startDatetime: new Date(input.startDatetime),
        endDatetime: new Date(input.endDatetime),
        capacity: input.capacity || null,
        rsvpEnabled: input.rsvpEnabled,
        categoryId: input.categoryId || null,
        createdById: auth.user.userId,
        status: 'draft',
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
