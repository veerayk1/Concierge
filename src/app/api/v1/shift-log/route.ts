/**
 * Shift Log API — List & Create shift entries
 * Per PRD 03 Section 3.1.6
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';

const createShiftEntrySchema = z.object({
  propertyId: z.string().uuid(),
  content: z.string().min(1, 'Content is required').max(4000),
  shift: z.enum(['morning', 'afternoon', 'night']),
  priority: z.enum(['normal', 'important']).default('normal'),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    // Shift log uses Event model with a specific event type
    const where = {
      propertyId,
      deletedAt: null,
      eventType: { slug: 'shift_log' },
    };

    const [entries, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          eventType: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.event.count({ where }),
    ]);

    return NextResponse.json({
      data: entries,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    console.error('GET /api/v1/shift-log error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch shift log' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const body = await request.json();
    const parsed = createShiftEntrySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;

    // Create as an event with shift_log type
    // For now, store shift/priority in customFields
    const event = await prisma.event.create({
      data: {
        propertyId: input.propertyId,
        eventTypeId: 'shift-log-type', // Will be seeded
        title: `${input.shift} shift note`,
        description: stripControlChars(stripHtml(input.content)),
        priority: input.priority,
        referenceNo: `SL-${Date.now().toString(36).toUpperCase()}`,
        createdById: auth.user.userId,
        customFields: { shift: input.shift },
      },
    });

    return NextResponse.json({ data: event, message: 'Shift entry added.' }, { status: 201 });
  } catch (error) {
    console.error('POST /api/v1/shift-log error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create shift entry' },
      { status: 500 },
    );
  }
}
