/**
 * Building Directory Detail API — GET, PATCH, DELETE
 * View, update, or soft-delete individual directory entries
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';

// ---------------------------------------------------------------------------
// Validation Schemas
// ---------------------------------------------------------------------------

const updateEntrySchema = z.object({
  name: z.string().min(1).max(200).optional(),
  category: z
    .enum([
      'management',
      'security',
      'maintenance',
      'amenity',
      'emergency',
      'utility',
      'common_area',
    ])
    .optional(),
  phone: z.string().max(50).optional(),
  email: z.string().email().max(254).optional().or(z.literal('')),
  location: z.string().max(200).optional(),
  hours: z.string().max(200).optional(),
  contactPerson: z.string().max(100).optional(),
  notes: z.string().max(1000).optional(),
  isActive: z.boolean().optional(),
});

// ---------------------------------------------------------------------------
// GET /api/v1/building-directory/:id — Directory entry detail
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;

    const entry = await (prisma as any).directoryEntry.findUnique({
      where: { id },
    });

    if (!entry || entry.deletedAt) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Directory entry not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: entry });
  } catch (error) {
    console.error('GET /api/v1/building-directory/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch directory entry' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/v1/building-directory/:id — Update directory entry fields
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    const body = await request.json();
    const parsed = updateEntrySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const existing = await (prisma as any).directoryEntry.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Directory entry not found' },
        { status: 404 },
      );
    }

    const input = parsed.data;

    // Build update data, mapping the simplified API fields to Prisma model fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {};

    if (input.name) updateData.firstName = stripControlChars(stripHtml(input.name));
    if (input.category) {
      updateData.role = input.category;
      updateData.department = input.category;
    }
    if (input.phone) updateData.phone = input.phone;
    if (input.email !== undefined) updateData.email = input.email || null;
    if (input.location !== undefined) {
      updateData.specialty = input.location ? stripControlChars(stripHtml(input.location)) : null;
    }
    if (input.hours !== undefined) {
      updateData.scheduleNotes = input.hours ? stripControlChars(stripHtml(input.hours)) : null;
    }
    if (input.notes !== undefined) {
      updateData.bio = input.notes ? stripControlChars(stripHtml(input.notes)) : null;
    }
    if (input.isActive !== undefined) updateData.isActive = input.isActive;

    const updated = await (prisma as any).directoryEntry.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('PATCH /api/v1/building-directory/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update directory entry' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/v1/building-directory/:id — Soft-delete directory entry
// ---------------------------------------------------------------------------

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;

    const existing = await (prisma as any).directoryEntry.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Directory entry not found' },
        { status: 404 },
      );
    }

    // Soft-delete by setting deletedAt timestamp
    const deleted = await (prisma as any).directoryEntry.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
      },
    });

    return NextResponse.json({ data: deleted, message: 'Directory entry removed.' });
  } catch (error) {
    console.error('DELETE /api/v1/building-directory/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to delete directory entry' },
      { status: 500 },
    );
  }
}
