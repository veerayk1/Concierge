/**
 * Unit Detail API — per PRD 07 Unit Management
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;

    const unit = await prisma.unit.findUnique({
      where: { id, deletedAt: null },
      include: {
        building: { select: { id: true, name: true } },
        unitInstructions: {
          where: { deletedAt: null },
          select: { id: true, instruction: true, priority: true, createdAt: true },
        },
        events: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
            eventType: { select: { name: true, icon: true, color: true } },
          },
        },
        packages: {
          where: { deletedAt: null, status: 'unreleased' },
          select: { id: true, referenceNumber: true, createdAt: true },
        },
        maintenanceRequests: {
          where: { deletedAt: null, status: { in: ['open', 'assigned', 'in_progress'] } },
          select: {
            id: true,
            referenceNumber: true,
            description: true,
            status: true,
            priority: true,
          },
        },
      },
    });

    if (!unit) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Unit not found' }, { status: 404 });
    }

    return NextResponse.json({ data: unit });
  } catch (error) {
    console.error('GET /api/v1/units/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch unit' },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    const body = await request.json();

    const updateData: Record<string, unknown> = {};
    if (body.status) updateData.status = body.status;
    if (body.comments !== undefined) updateData.comments = body.comments;
    if (body.customFields !== undefined) updateData.customFields = body.customFields;
    if (body.enterPhoneCode !== undefined) updateData.enterPhoneCode = body.enterPhoneCode;
    if (body.parkingSpot !== undefined) updateData.parkingSpot = body.parkingSpot;
    if (body.locker !== undefined) updateData.locker = body.locker;

    const unit = await prisma.unit.update({
      where: { id },
      data: updateData,
      include: { building: { select: { name: true } } },
    });

    return NextResponse.json({ data: unit, message: 'Unit updated.' });
  } catch (error) {
    console.error('PATCH /api/v1/units/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update unit' },
      { status: 500 },
    );
  }
}
