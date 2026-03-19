/**
 * Inspection Templates API — Reusable checklists per category
 * Per CLAUDE.md Phase 2
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { createInspectionTemplateSchema } from '@/schemas/inspection';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';

// Prisma models not yet generated — use type-safe casts so this compiles now
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

// ---------------------------------------------------------------------------
// GET /api/v1/inspections/templates — List templates for a property
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = { propertyId, deletedAt: null, isActive: true };
    if (category) where.category = category;

    const [templates, total] = await Promise.all([
      db.inspectionTemplate.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      db.inspectionTemplate.count({ where }),
    ]);

    return NextResponse.json({
      data: templates,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    console.error('GET /api/v1/inspections/templates error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch templates' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/inspections/templates — Create reusable template
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const body = await request.json();
    const parsed = createInspectionTemplateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;

    const template = await db.inspectionTemplate.create({
      data: {
        propertyId: input.propertyId,
        name: stripControlChars(stripHtml(input.name)),
        category: input.category,
        description: input.description ? stripControlChars(stripHtml(input.description)) : null,
        items: input.items,
        isActive: true,
      },
    });

    return NextResponse.json(
      { data: template, message: `Template "${template.name}" created.` },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/v1/inspections/templates error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create template' },
      { status: 500 },
    );
  }
}
