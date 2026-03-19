/**
 * Visitor Detail — Get visitor details, sign out a visitor
 * Per PRD 03 Visitor Management
 *
 * GET   /api/v1/visitors/:id — Get single visitor with parking permit
 * PATCH /api/v1/visitors/:id — Sign out visitor (set departureAt)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';

// ---------------------------------------------------------------------------
// GET /api/v1/visitors/:id — Fetch visitor detail with relations
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    const visitor = await prisma.visitorEntry.findUnique({
      where: { id },
      include: {
        unit: { select: { id: true, number: true } },
        visitorParkingPermit: true,
      },
    });

    if (!visitor) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Visitor not found' },
        { status: 404 },
      );
    }

    // Compute duration if signed out
    const duration =
      visitor.departureAt && visitor.arrivalAt
        ? Math.round((visitor.departureAt.getTime() - visitor.arrivalAt.getTime()) / 60000)
        : null;

    return NextResponse.json({
      data: {
        ...visitor,
        durationMinutes: duration,
        status: visitor.departureAt ? 'signed_out' : 'signed_in',
      },
    });
  } catch (error) {
    console.error('GET /api/v1/visitors/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch visitor' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/v1/visitors/:id — Sign out visitor
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    const body = await request.json().catch(() => ({}));

    const visitor = await prisma.visitorEntry.findUnique({ where: { id } });
    if (!visitor) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Visitor not found' },
        { status: 404 },
      );
    }

    if (visitor.departureAt) {
      return NextResponse.json(
        { error: 'ALREADY_SIGNED_OUT', message: 'Visitor already signed out' },
        { status: 400 },
      );
    }

    // Allow optional sign-out comments
    const signOutComments = body.comments ? stripControlChars(stripHtml(body.comments)) : undefined;

    const updateData: Record<string, unknown> = {
      departureAt: new Date(),
      signedOutById: auth.user.userId,
    };

    // Append sign-out comments if provided
    if (signOutComments) {
      const existingComments = visitor.comments || '';
      updateData.comments = existingComments
        ? `${existingComments} | Sign-out: ${signOutComments}`
        : `Sign-out: ${signOutComments}`;
    }

    const updated = await prisma.visitorEntry.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      data: updated,
      message: `${visitor.visitorName} signed out.`,
    });
  } catch (error) {
    console.error('PATCH /api/v1/visitors/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to sign out visitor' },
      { status: 500 },
    );
  }
}
