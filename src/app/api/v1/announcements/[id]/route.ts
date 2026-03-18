/**
 * Announcement Detail API — per PRD 09
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;

    const announcement = await prisma.announcement.findUnique({
      where: { id, deletedAt: null },
      include: {
        category: { select: { id: true, name: true } },
      },
    });

    if (!announcement) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Announcement not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: announcement });
  } catch (error) {
    console.error('GET /api/v1/announcements/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch announcement' },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin', 'property_admin'] });
    if (auth.error) return auth.error;

    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, unknown> = {};
    if (body.title) updateData.title = stripControlChars(stripHtml(body.title));
    if (body.body) updateData.body = stripControlChars(stripHtml(body.body));
    if (body.priority) updateData.priority = body.priority;
    if (body.channels) updateData.channels = body.channels;
    if (body.status) {
      updateData.status = body.status;
      if (body.status === 'published' && !updateData.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }

    const announcement = await prisma.announcement.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ data: announcement, message: 'Announcement updated.' });
  } catch (error) {
    console.error('PATCH /api/v1/announcements/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update announcement' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin', 'property_admin'] });
    if (auth.error) return auth.error;

    const { id } = await params;
    await prisma.announcement.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return NextResponse.json({ message: 'Announcement deleted.' });
  } catch (error) {
    console.error('DELETE /api/v1/announcements/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to delete announcement' },
      { status: 500 },
    );
  }
}
