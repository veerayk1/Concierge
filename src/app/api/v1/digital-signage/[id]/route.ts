/**
 * Digital Signage Detail API — Get, update, toggle, soft delete content
 *
 * GET    /api/v1/digital-signage/:id — Get content detail
 * PATCH  /api/v1/digital-signage/:id — Toggle active/paused, update content, extend schedule
 * DELETE /api/v1/digital-signage/:id — Soft delete content
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const CONTENT_TYPES = [
  'announcement',
  'weather',
  'event',
  'emergency',
  'welcome',
  'directory',
  'text',
  'image',
] as const;

const SCREEN_ZONES = ['lobby', 'elevator', 'parking', 'pool', 'gym', 'mailroom'] as const;

// ---------------------------------------------------------------------------
// Validation Schemas
// ---------------------------------------------------------------------------

const updateContentSchema = z.object({
  name: z.string().min(1).max(150).optional(),
  content: z.string().max(5000).optional(),
  type: z.enum(CONTENT_TYPES).optional(),
  screen: z.enum(SCREEN_ZONES).optional(),
  priority: z.number().int().min(0).optional(),
  rotation: z.number().int().min(5).max(300).optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  isActive: z.boolean().optional(),
  imageUrl: z.string().max(500).optional(),
});

// ---------------------------------------------------------------------------
// GET /api/v1/digital-signage/:id — Get content detail
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;

    const content = await prisma.digitalSignageContent.findUnique({
      where: { id, deletedAt: null },
    });

    if (!content) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Signage content not found' },
        { status: 404 },
      );
    }

    // Compute active status based on schedule
    const now = new Date();
    const isCurrentlyActive =
      content.isActive && content.startDate <= now && content.endDate >= now;

    return NextResponse.json({
      data: {
        ...content,
        isCurrentlyActive,
      },
    });
  } catch (error) {
    console.error('GET /api/v1/digital-signage/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch signage content' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/v1/digital-signage/:id — Toggle active/paused, update content, extend schedule
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin', 'property_admin'] });
    if (auth.error) return auth.error;

    const { id } = await params;
    const body = await request.json();
    const parsed = updateContentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    // Verify content exists
    const existing = await prisma.digitalSignageContent.findUnique({
      where: { id, deletedAt: null },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Signage content not found' },
        { status: 404 },
      );
    }

    const input = parsed.data;
    const data: Record<string, unknown> = {};

    if (input.name !== undefined) data.title = stripControlChars(stripHtml(input.name));
    if (input.content !== undefined) data.body = stripControlChars(stripHtml(input.content));
    if (input.type !== undefined) data.contentType = input.type;
    if (input.screen !== undefined) data.zone = input.screen;
    if (input.priority !== undefined) data.priority = input.priority;
    if (input.rotation !== undefined) data.durationSeconds = input.rotation;
    if (input.startDate !== undefined) data.startDate = new Date(input.startDate);
    if (input.endDate !== undefined) data.endDate = new Date(input.endDate);
    if (input.isActive !== undefined) data.isActive = input.isActive;
    if (input.imageUrl !== undefined) data.imageUrl = input.imageUrl;

    // Validate endDate > startDate when both are being changed
    if (input.startDate && input.endDate) {
      if (new Date(input.endDate) <= new Date(input.startDate)) {
        return NextResponse.json(
          { error: 'VALIDATION_ERROR', message: 'endDate must be after startDate' },
          { status: 400 },
        );
      }
    }

    const updated = await prisma.digitalSignageContent.update({
      where: { id },
      data,
    });

    return NextResponse.json({ data: updated, message: 'Signage content updated.' });
  } catch (error) {
    console.error('PATCH /api/v1/digital-signage/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update signage content' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/v1/digital-signage/:id — Soft delete content
// ---------------------------------------------------------------------------

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin', 'property_admin'] });
    if (auth.error) return auth.error;

    const { id } = await params;

    const content = await prisma.digitalSignageContent.findUnique({
      where: { id, deletedAt: null },
    });

    if (!content) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Signage content not found' },
        { status: 404 },
      );
    }

    await prisma.digitalSignageContent.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ message: 'Signage content deleted.' });
  } catch (error) {
    console.error('DELETE /api/v1/digital-signage/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to delete signage content' },
      { status: 500 },
    );
  }
}
