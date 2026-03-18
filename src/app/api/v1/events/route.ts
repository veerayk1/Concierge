/**
 * Events API — Unified Event Model
 * Per PRD 03 Security Console + CLAUDE.md unified event model
 *
 * GET  /api/v1/events — List events with filters
 * POST /api/v1/events — Create a new event
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { createEventSchema } from '@/schemas/event';
import { nanoid } from 'nanoid';
import { guardRoute } from '@/server/middleware/api-guard';

// ---------------------------------------------------------------------------
// GET /api/v1/events
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const search = searchParams.get('search') || '';
    const typeId = searchParams.get('typeId');
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const unitId = searchParams.get('unitId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    const where: Record<string, unknown> = {
      propertyId,
      deletedAt: null,
    };

    if (typeId) where.eventTypeId = typeId;
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (unitId) where.unitId = unitId;

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { referenceNo: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          eventType: {
            select: { id: true, name: true, icon: true, color: true },
          },
          unit: {
            select: { id: true, number: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.event.count({ where }),
    ]);

    return NextResponse.json({
      data: events,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('GET /api/v1/events error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch events' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/events
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const body = await request.json();
    const parsed = createEventSchema.safeParse(body);

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

    // Generate reference number (e.g., EVT-A1B2C3)
    const referenceNo = `EVT-${nanoid(6).toUpperCase()}`;

    const event = await prisma.event.create({
      data: {
        propertyId: input.propertyId,
        eventTypeId: input.eventTypeId,
        unitId: input.unitId || null,
        title: input.title,
        description: input.description || null,
        priority: input.priority,
        referenceNo,
        createdById: 'demo-user', // TODO: Get from auth context
        customFields: input.customFields || undefined,
      },
      include: {
        eventType: {
          select: { id: true, name: true, icon: true, color: true },
        },
        unit: {
          select: { id: true, number: true },
        },
      },
    });

    return NextResponse.json({ data: event, message: 'Event created.' }, { status: 201 });
  } catch (error) {
    console.error('POST /api/v1/events error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create event' },
      { status: 500 },
    );
  }
}
