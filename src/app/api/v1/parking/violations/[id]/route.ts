/**
 * Parking Violation Detail — Update status (warn, resolve, tow)
 * Per PRD 13 Parking Management
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, unknown> = {};

    if (body.status) {
      updateData.status = body.status;
      if (body.status === 'resolved') {
        updateData.resolvedAt = new Date();
        updateData.resolvedById = 'demo-user';
      }
    }
    if (body.notes) updateData.notes = body.notes;
    if (body.towRequested !== undefined) updateData.towRequested = body.towRequested;

    const violation = await prisma.parkingViolation.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      data: violation,
      message: `Violation ${body.status || 'updated'}.`,
    });
  } catch (error) {
    console.error('PATCH /api/v1/parking/violations/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update violation' },
      { status: 500 },
    );
  }
}
