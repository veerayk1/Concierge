/**
 * Event Types Configuration API — per PRD 03 + 16
 * Admin can create and manage event types for their property
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';

const createEventTypeSchema = z.object({
  propertyId: z.string().uuid(),
  name: z.string().min(1, 'Name is required').max(100),
  slug: z
    .string()
    .min(1)
    .max(50)
    .regex(/^[a-z0-9_]+$/),
  icon: z.string().max(50).optional(),
  color: z.string().max(20).optional(),
  eventGroupId: z.string().uuid(),
  defaultPriority: z.string().max(20).optional(),
  notifyOnCreate: z.boolean().default(true),
  notifyOnClose: z.boolean().default(false),
  showOnLobby: z.boolean().default(false),
  isActive: z.boolean().default(true),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin', 'property_admin'] });
    if (auth.error) return auth.error;

    const propertyId = new URL(request.url).searchParams.get('propertyId');

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    const eventTypes = await prisma.eventType.findMany({
      where: { propertyId, deletedAt: null },
      include: {
        eventGroup: { select: { id: true, name: true } },
        _count: { select: { events: { where: { deletedAt: null } } } },
      },
      orderBy: { name: 'asc' },
    });

    const data = eventTypes.map((et) => ({
      ...et,
      eventCount: et._count.events,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error('GET /api/v1/event-types error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch event types' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin', 'property_admin'] });
    if (auth.error) return auth.error;

    const body = await request.json();
    const parsed = createEventTypeSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;

    // Check for duplicate slug
    const existing = await prisma.eventType.findFirst({
      where: { propertyId: input.propertyId, slug: input.slug, deletedAt: null },
    });

    if (existing) {
      return NextResponse.json(
        { error: 'DUPLICATE', message: 'An event type with this slug already exists' },
        { status: 409 },
      );
    }

    const eventType = await prisma.eventType.create({
      data: {
        propertyId: input.propertyId,
        name: input.name,
        slug: input.slug,
        icon: input.icon || 'circle',
        color: input.color || '#2563EB',
        eventGroupId: input.eventGroupId,
        defaultPriority: input.defaultPriority || 'normal',
        notifyOnCreate: input.notifyOnCreate,
        notifyOnClose: input.notifyOnClose,
        showOnLobby: input.showOnLobby,
        isActive: input.isActive,
      },
    });

    return NextResponse.json({ data: eventType, message: 'Event type created.' }, { status: 201 });
  } catch (error) {
    console.error('POST /api/v1/event-types error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create event type' },
      { status: 500 },
    );
  }
}
