/**
 * Shift Log API — List & Create shift entries
 * Per PRD 03 Section 3.1.6
 *
 * GET  — List entries with filtering (date range, priority, category)
 * POST — Create a new shift entry
 */

import { NextRequest, NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VALID_PRIORITIES = ['normal', 'important', 'urgent'] as const;
const VALID_CATEGORIES = [
  'general',
  'package',
  'visitor',
  'maintenance',
  'security',
  'other',
] as const;

// ---------------------------------------------------------------------------
// Validation Schemas
// ---------------------------------------------------------------------------

const createShiftEntrySchema = z.object({
  propertyId: z.string().uuid(),
  content: z.string().min(1, 'Content is required').max(4000),
  priority: z.enum(VALID_PRIORITIES).default('normal'),
  category: z.enum(VALID_CATEGORIES).default('general'),
  mentionedUnitId: z.string().uuid().optional(),
  mentionedResidentId: z.string().uuid().optional(),
});

// ---------------------------------------------------------------------------
// GET /api/v1/shift-log
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);
    const priority = searchParams.get('priority');
    const category = searchParams.get('category');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    // Build where clause
    const where: Record<string, unknown> = {
      propertyId,
      deletedAt: null,
      eventType: { slug: 'shift_log' },
    };

    // Date range filter
    if (dateFrom || dateTo) {
      const createdAt: Record<string, Date> = {};
      if (dateFrom) createdAt.gte = new Date(dateFrom);
      if (dateTo) createdAt.lte = new Date(dateTo);
      where.createdAt = createdAt;
    }

    // Priority filter
    if (priority && (VALID_PRIORITIES as readonly string[]).includes(priority)) {
      where.priority = priority;
    }

    // Category filter (stored in customFields JSONB)
    if (category && (VALID_CATEGORIES as readonly string[]).includes(category)) {
      where.customFields = { path: ['category'], equals: category };
    }

    const [entries, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          eventType: { select: { name: true } },
        },
        orderBy: [{ customFields: { sort: 'desc' } }, { createdAt: 'desc' }],
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

// ---------------------------------------------------------------------------
// POST /api/v1/shift-log
// ---------------------------------------------------------------------------

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

    // Build customFields
    const customFields: Record<string, unknown> = {
      category: input.category,
      pinned: false,
      readBy: [],
    };
    if (input.mentionedUnitId) customFields.mentionedUnitId = input.mentionedUnitId;
    if (input.mentionedResidentId) customFields.mentionedResidentId = input.mentionedResidentId;

    const event = await prisma.event.create({
      data: {
        propertyId: input.propertyId,
        eventTypeId: 'shift-log-type', // Will be seeded
        title: 'Shift log note',
        description: stripControlChars(stripHtml(input.content)),
        priority: input.priority,
        referenceNo: `SL-${Date.now().toString(36).toUpperCase()}`,
        createdById: auth.user.userId,
        customFields: customFields as Prisma.InputJsonValue,
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
