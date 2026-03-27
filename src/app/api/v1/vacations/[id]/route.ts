/**
 * Vacation Period Detail API
 * Per GAP 7.1 — Update and cancel vacation periods
 *
 * PATCH  /api/v1/vacations/:id — Update vacation period
 * DELETE /api/v1/vacations/:id — Cancel vacation period (deactivate)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';

// ---------------------------------------------------------------------------
// PATCH /api/v1/vacations/:id — Update vacation period
// ---------------------------------------------------------------------------

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    const body = await request.json();
    const { propertyId, startDate, endDate, notes, holdMail } = body;

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    // Fetch existing vacation period
    const existing = await prisma.vacationPeriod.findUnique({
      where: { id },
      select: { userId: true, propertyId: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Vacation period not found' },
        { status: 404 },
      );
    }

    // Check ownership: user can only update their own, admins can update any
    const isAdmin = ['property_admin', 'property_manager', 'super_admin'].includes(auth.user.role);
    if (!isAdmin && auth.user.userId !== existing.userId) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Can only update your own vacation periods' },
        { status: 403 },
      );
    }

    const updateData: Record<string, unknown> = {};

    if (startDate) {
      const start = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        if (start >= end) {
          return NextResponse.json(
            {
              error: 'VALIDATION_ERROR',
              message: 'startDate must be before endDate',
            },
            { status: 400 },
          );
        }
        updateData.endDate = end;
      }
      updateData.startDate = start;
    }

    if (endDate && !startDate) {
      updateData.endDate = new Date(endDate);
    }

    if (notes !== undefined) {
      updateData.notes = notes ? stripControlChars(stripHtml(notes)) : null;
    }

    if (holdMail !== undefined) {
      updateData.holdMail = !!holdMail;
    }

    const vacationPeriod = await prisma.vacationPeriod.update({
      where: { id },
      data: updateData,
      include: {
        property: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      data: vacationPeriod,
      message: 'Vacation period updated.',
    });
  } catch (error) {
    console.error('PATCH /api/v1/vacations/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update vacation period' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/v1/vacations/:id — Cancel vacation period (deactivate)
// ---------------------------------------------------------------------------

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;

    // Fetch existing vacation period
    const existing = await prisma.vacationPeriod.findUnique({
      where: { id },
      select: { userId: true },
    });

    if (!existing) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Vacation period not found' },
        { status: 404 },
      );
    }

    // Check ownership: user can only delete their own, admins can delete any
    const isAdmin = ['property_admin', 'property_manager', 'super_admin'].includes(auth.user.role);
    if (!isAdmin && auth.user.userId !== existing.userId) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Can only cancel your own vacation periods' },
        { status: 403 },
      );
    }

    const vacationPeriod = await prisma.vacationPeriod.update({
      where: { id },
      data: { isActive: false },
      include: {
        property: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json({
      data: vacationPeriod,
      message: 'Vacation period has been cancelled.',
    });
  } catch (error) {
    console.error('DELETE /api/v1/vacations/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to cancel vacation period' },
      { status: 500 },
    );
  }
}
