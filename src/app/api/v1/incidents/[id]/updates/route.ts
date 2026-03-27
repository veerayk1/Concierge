/**
 * Incident Updates API — per PRD 03
 * Add updates/comments to an incident for tracking
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';

const addUpdateSchema = z.object({
  content: z.string().min(1, 'Update content is required').max(2000),
  isInternal: z.boolean().default(false),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request, {
      roles: [
        'super_admin',
        'property_admin',
        'property_manager',
        'security_guard',
        'security_supervisor',
        'front_desk',
        'superintendent',
        'maintenance_staff',
        'board_member',
      ],
    });
    if (auth.error) return auth.error;

    const { id } = await params;

    // Incident updates stored as related events or in custom fields
    // For now, return the event with its description as the timeline
    const event = await prisma.event.findUnique({
      where: { id, propertyId: auth.user.propertyId },
      select: {
        id: true,
        title: true,
        description: true,
        customFields: true,
        createdAt: true,
      },
    });

    if (!event) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Incident not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: event });
  } catch (error) {
    console.error('GET /api/v1/incidents/:id/updates error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch updates' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request, {
      roles: [
        'super_admin',
        'property_admin',
        'property_manager',
        'security_guard',
        'security_supervisor',
        'front_desk',
        'superintendent',
        'maintenance_staff',
        'board_member',
      ],
    });
    if (auth.error) return auth.error;

    const { id } = await params;
    const body = await request.json();

    const parsed = addUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;

    // Append update to the event's description
    const event = await prisma.event.findUnique({
      where: { id, propertyId: auth.user.propertyId },
    });
    if (!event) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Incident not found' },
        { status: 404 },
      );
    }

    const timestamp = new Date().toISOString();
    const sanitizedContent = stripControlChars(stripHtml(input.content));
    const updateEntry = `\n\n--- Update (${timestamp}) ---\n${sanitizedContent}`;

    await prisma.event.update({
      where: { id },
      data: {
        description: (event.description || '') + updateEntry,
      },
    });

    return NextResponse.json({ message: 'Update added to incident.' }, { status: 201 });
  } catch (error) {
    console.error('POST /api/v1/incidents/:id/updates error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to add update' },
      { status: 500 },
    );
  }
}
