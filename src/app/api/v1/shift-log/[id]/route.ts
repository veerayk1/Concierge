/**
 * Shift Log Entry Detail API — GET, PATCH, DELETE
 * Per PRD 03 Section 3.1.6
 *
 * GET    /api/v1/shift-log/:id — Get shift log entry detail
 * PATCH  /api/v1/shift-log/:id — Update entry content/priority
 * DELETE /api/v1/shift-log/:id — Soft-delete entry
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';

const updateShiftEntrySchema = z.object({
  content: z.string().min(1).max(4000).optional(),
  priority: z.enum(['normal', 'important', 'urgent']).optional(),
  category: z
    .enum(['general', 'package', 'visitor', 'maintenance', 'security', 'other'])
    .optional(),
});

// ---------------------------------------------------------------------------
// GET /api/v1/shift-log/:id — Entry detail with comments
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;

    const entry = await prisma.shiftLogEntry.findUnique({
      where: { id },
    });

    if (!entry) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Shift log entry not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: entry });
  } catch (error) {
    console.error('GET /api/v1/shift-log/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch shift log entry' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/v1/shift-log/:id — Update entry
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    const body = await request.json();

    const parsed = updateShiftEntrySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const existing = await prisma.shiftLogEntry.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Shift log entry not found' },
        { status: 404 },
      );
    }

    const input = parsed.data;
    const updateData: Record<string, unknown> = {};

    if (input.content) updateData.content = stripControlChars(stripHtml(input.content));
    if (input.priority) updateData.priority = input.priority;
    if (input.category) updateData.category = input.category;

    const updated = await prisma.shiftLogEntry.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ data: updated, message: 'Shift log entry updated.' });
  } catch (error) {
    console.error('PATCH /api/v1/shift-log/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update shift log entry' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/v1/shift-log/:id — Soft-delete entry
// ---------------------------------------------------------------------------

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;

    const existing = await prisma.shiftLogEntry.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Shift log entry not found' },
        { status: 404 },
      );
    }

    await prisma.shiftLogEntry.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Shift log entry deleted.' });
  } catch (error) {
    console.error('DELETE /api/v1/shift-log/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to delete shift log entry' },
      { status: 500 },
    );
  }
}
