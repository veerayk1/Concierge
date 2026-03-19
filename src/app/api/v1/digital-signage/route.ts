/**
 * Digital Signage API — List, Create, Update display content
 * Manages content for lobby screens, elevator displays, and mailroom monitors.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';

// ---------------------------------------------------------------------------
// Validation Schemas
// ---------------------------------------------------------------------------

const createContentSchema = z
  .object({
    propertyId: z.string().uuid(),
    title: z.string().min(1, 'Title is required').max(150),
    contentType: z.enum(['text', 'image', 'announcement', 'event', 'weather']),
    body: z.string().max(5000).optional(),
    imageUrl: z.string().max(500).optional(),
    zone: z.enum(['lobby', 'elevator', 'mailroom']),
    priority: z.number().int().min(0).default(0),
    durationSeconds: z.number().int().min(5).max(300).default(10),
    startDate: z.string().min(1, 'Start date is required'),
    endDate: z.string().min(1, 'End date is required'),
  })
  .refine((data) => new Date(data.endDate) > new Date(data.startDate), {
    message: 'endDate must be after startDate',
    path: ['endDate'],
  });

const updateContentSchema = z.object({
  contentId: z.string().min(1, 'Content ID is required'),
  title: z.string().min(1).max(150).optional(),
  body: z.string().max(5000).optional(),
  imageUrl: z.string().max(500).optional(),
  zone: z.enum(['lobby', 'elevator', 'mailroom']).optional(),
  priority: z.number().int().min(0).optional(),
  durationSeconds: z.number().int().min(5).max(300).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isActive: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// GET /api/v1/digital-signage — List content with pagination
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const zone = searchParams.get('zone');
    const active = searchParams.get('active');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    const where: Record<string, unknown> = { propertyId, deletedAt: null };
    if (zone) where.zone = zone;

    // When active=true, filter to currently scheduled content
    if (active === 'true') {
      const now = new Date();
      where.isActive = true;
      where.startDate = { lte: now };
      where.endDate = { gte: now };
    }

    const [content, total] = await Promise.all([
      prisma.digitalSignageContent.findMany({
        where,
        orderBy: [{ priority: 'desc' }, { startDate: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.digitalSignageContent.count({ where }),
    ]);

    return NextResponse.json({
      data: content,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    console.error('GET /api/v1/digital-signage error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch signage content' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/digital-signage — Create display content
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin', 'property_admin'] });
    if (auth.error) return auth.error;

    const body = await request.json();
    const parsed = createContentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;

    const content = await prisma.digitalSignageContent.create({
      data: {
        propertyId: input.propertyId,
        title: stripControlChars(stripHtml(input.title)),
        contentType: input.contentType,
        body: input.body ? stripControlChars(stripHtml(input.body)) : null,
        imageUrl: input.imageUrl || null,
        zone: input.zone,
        priority: input.priority,
        durationSeconds: input.durationSeconds,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        isActive: true,
        createdById: auth.user.userId,
      },
    });

    return NextResponse.json(
      { data: content, message: 'Signage content created.' },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/v1/digital-signage error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create signage content' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/v1/digital-signage — Update display content
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin', 'property_admin'] });
    if (auth.error) return auth.error;

    const body = await request.json();
    const parsed = updateContentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { contentId, ...updates } = parsed.data;

    // Build update data, only including provided fields
    const data: Record<string, unknown> = {};
    if (updates.title !== undefined) data.title = stripControlChars(stripHtml(updates.title));
    if (updates.body !== undefined) data.body = stripControlChars(stripHtml(updates.body));
    if (updates.imageUrl !== undefined) data.imageUrl = updates.imageUrl;
    if (updates.zone !== undefined) data.zone = updates.zone;
    if (updates.priority !== undefined) data.priority = updates.priority;
    if (updates.durationSeconds !== undefined) data.durationSeconds = updates.durationSeconds;
    if (updates.startDate !== undefined) data.startDate = new Date(updates.startDate);
    if (updates.endDate !== undefined) data.endDate = new Date(updates.endDate);
    if (updates.isActive !== undefined) data.isActive = updates.isActive;

    const content = await prisma.digitalSignageContent.update({
      where: { id: contentId },
      data,
    });

    return NextResponse.json({ data: content, message: 'Signage content updated.' });
  } catch (error) {
    console.error('PATCH /api/v1/digital-signage error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update signage content' },
      { status: 500 },
    );
  }
}
