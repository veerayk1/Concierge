/**
 * Maintenance Request Comments API — List & Create
 * Per PRD 05
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { createMaintenanceCommentSchema } from '@/schemas/maintenance';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';

// ---------------------------------------------------------------------------
// GET /api/v1/maintenance/:id/comments
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;

    // Verify the maintenance request exists
    const maintenanceRequest = await prisma.maintenanceRequest.findUnique({
      where: { id, deletedAt: null },
    });

    if (!maintenanceRequest) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Maintenance request not found' },
        { status: 404 },
      );
    }

    const comments = await prisma.maintenanceComment.findMany({
      where: { requestId: id },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json({ data: comments });
  } catch (error) {
    console.error('GET /api/v1/maintenance/:id/comments error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch comments' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/maintenance/:id/comments
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    const body = await request.json();

    const parsed = createMaintenanceCommentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    // Verify the maintenance request exists
    const maintenanceRequest = await prisma.maintenanceRequest.findUnique({
      where: { id, deletedAt: null },
    });

    if (!maintenanceRequest) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Maintenance request not found' },
        { status: 404 },
      );
    }

    const input = parsed.data;

    const comment = await prisma.maintenanceComment.create({
      data: {
        requestId: id,
        authorId: auth.user.userId,
        body: stripControlChars(stripHtml(input.body)),
        visibleToResident: input.visibleToResident,
      },
    });

    return NextResponse.json({ data: comment, message: 'Comment added.' }, { status: 201 });
  } catch (error) {
    console.error('POST /api/v1/maintenance/:id/comments error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to add comment' },
      { status: 500 },
    );
  }
}
