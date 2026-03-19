/**
 * Inspection Items API — List & Complete checklist items
 * Per CLAUDE.md Phase 2 — Mobile-first with photo capture
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { completeInspectionItemSchema } from '@/schemas/inspection';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';

// Prisma models not yet generated — use type-safe casts so this compiles now
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = prisma as any;

// ---------------------------------------------------------------------------
// GET /api/v1/inspections/:id/items — List checklist items
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;

    // Verify inspection exists
    const inspection = await db.inspection.findUnique({
      where: { id, deletedAt: null },
    });

    if (!inspection) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Inspection not found' },
        { status: 404 },
      );
    }

    const items = await db.inspectionItem.findMany({
      where: { inspectionId: id },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json({ data: items });
  } catch (error) {
    console.error('GET /api/v1/inspections/:id/items error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch inspection items' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/inspections/:id/items — Complete a checklist item
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    const body = await request.json();

    const { itemId, ...itemData } = body;
    const parsed = completeInspectionItemSchema.safeParse(itemData);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    // Verify inspection exists and is in_progress
    const inspection = await db.inspection.findUnique({
      where: { id, deletedAt: null },
    });

    if (!inspection) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Inspection not found' },
        { status: 404 },
      );
    }

    if (inspection.status !== 'in_progress') {
      return NextResponse.json(
        {
          error: 'INSPECTION_NOT_IN_PROGRESS',
          message: 'Items can only be completed when inspection is in progress.',
        },
        { status: 400 },
      );
    }

    // Verify item exists and belongs to this inspection
    const item = await db.inspectionItem.findUnique({
      where: { id: itemId },
    });

    if (!item || item.inspectionId !== id) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Inspection item not found' },
        { status: 404 },
      );
    }

    const input = parsed.data;

    const updateData: Record<string, unknown> = {
      completedAt: new Date(),
      completedById: auth.user.userId,
    };

    if (input.value !== undefined) updateData.value = input.value;
    if (input.numericValue !== undefined) updateData.numericValue = input.numericValue;
    if (input.passed !== undefined) updateData.passed = input.passed;
    if (input.photoUrl !== undefined) updateData.photoUrl = input.photoUrl;
    if (input.notes !== undefined)
      updateData.notes = input.notes ? stripControlChars(stripHtml(input.notes)) : null;

    const updated = await db.inspectionItem.update({
      where: { id: itemId },
      data: updateData,
    });

    return NextResponse.json({
      data: updated,
      message: `Item "${item.name}" completed.`,
    });
  } catch (error) {
    console.error('POST /api/v1/inspections/:id/items error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to complete inspection item' },
      { status: 500 },
    );
  }
}
