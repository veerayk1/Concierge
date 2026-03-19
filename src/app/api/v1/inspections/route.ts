/**
 * Inspections API — List & Create
 * Mobile-first inspection system with checklists and GPS verification
 * Per CLAUDE.md Phase 2
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { createInspectionSchema } from '@/schemas/inspection';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';

// Prisma models not yet generated — use type-safe casts so this compiles now
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

// ---------------------------------------------------------------------------
// GET /api/v1/inspections — List inspections for a property
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const inspectorId = searchParams.get('inspectorId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = { propertyId, deletedAt: null };
    if (status) where.status = status;
    if (category) where.category = category;
    if (inspectorId) where.inspectorId = inspectorId;

    const [inspections, total] = await Promise.all([
      db.inspection.findMany({
        where,
        include: {
          items: { select: { id: true, name: true, type: true, passed: true, completedAt: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.inspection.count({ where }),
    ]);

    // Flag overdue inspections (scheduled + scheduledDate in the past)
    const now = new Date();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const inspectionsWithOverdue = (inspections as any[]).map((inspection: any) => ({
      ...inspection,
      isOverdue:
        (inspection.status === 'scheduled' || inspection.status === 'in_progress') &&
        inspection.scheduledDate !== null &&
        new Date(inspection.scheduledDate) < now,
    }));

    return NextResponse.json({
      data: inspectionsWithOverdue,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    console.error('GET /api/v1/inspections error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch inspections' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/inspections — Create inspection with checklist
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const body = await request.json();
    const parsed = createInspectionSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;

    // Resolve checklist items: from template or inline
    let checklistItems: Array<{ name: string; required: boolean; type: string }> = [];

    if (input.templateId) {
      const template = await db.inspectionTemplate.findUnique({
        where: { id: input.templateId },
      });
      if (template && Array.isArray(template.items)) {
        checklistItems = template.items as typeof checklistItems;
      }
    } else if (input.items && input.items.length > 0) {
      checklistItems = input.items;
    }

    const inspection = await db.inspection.create({
      data: {
        propertyId: input.propertyId,
        templateId: input.templateId || null,
        recurringTaskId: input.recurringTaskId || null,
        title: stripControlChars(stripHtml(input.title)),
        category: input.category,
        priority: input.priority,
        scheduledDate: input.scheduledDate ? new Date(input.scheduledDate) : null,
        inspectorId: input.inspectorId || null,
        location: input.location ? stripControlChars(stripHtml(input.location)) : null,
        gpsLatitude: input.gpsLatitude ?? null,
        gpsLongitude: input.gpsLongitude ?? null,
        notes: input.notes ? stripControlChars(stripHtml(input.notes)) : null,
        status: 'scheduled',
        createdById: auth.user.userId,
        items: {
          create: checklistItems.map((item, index) => ({
            name: stripControlChars(stripHtml(item.name)),
            type: item.type,
            required: item.required,
            sortOrder: index,
          })),
        },
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json(
      { data: inspection, message: `Inspection "${inspection.title}" created.` },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/v1/inspections error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create inspection' },
      { status: 500 },
    );
  }
}
