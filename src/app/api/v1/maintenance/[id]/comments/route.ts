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

    // Resolve author names from User table
    const authorIds = [...new Set(comments.map((c) => c.authorId))];
    const authors = authorIds.length
      ? await prisma.user.findMany({
          where: { id: { in: authorIds } },
          select: { id: true, firstName: true, lastName: true },
        })
      : [];
    const authorMap = new Map(authors.map((a) => [a.id, `${a.firstName} ${a.lastName}`]));

    const mapped = comments.map((c) => ({
      ...c,
      authorName: authorMap.get(c.authorId) ?? 'System',
    }));

    return NextResponse.json({ data: mapped });
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

    // Resolve authorId — verify the auth userId exists in DB.
    // In demo mode the hardcoded UUID may not exist after a DB wipe.
    let authorId = auth.user.userId;
    try {
      const userExists = await prisma.user.findUnique({
        where: { id: authorId },
        select: { id: true },
      });
      if (!userExists) {
        const fallbackUser = await prisma.user.findFirst({
          where: {
            userProperties: { some: { propertyId: maintenanceRequest.propertyId } },
          },
          select: { id: true },
        });
        if (fallbackUser) authorId = fallbackUser.id;
      }
    } catch {
      // User lookup failed — proceed with auth userId
    }

    const comment = await prisma.maintenanceComment.create({
      data: {
        requestId: id,
        authorId,
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
