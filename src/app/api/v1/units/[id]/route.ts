/**
 * Unit Detail API — per PRD 07 Unit Management
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';
import { z } from 'zod';

const updateUnitSchema = z.object({
  number: z.string().min(1).max(50).optional(),
  floor: z.number().int().nullable().optional(),
  unitType: z.string().max(50).optional(),
  status: z.string().max(50).optional(),
  squareFootage: z.number().min(0).nullable().optional(),
  enterPhoneCode: z.string().max(50).nullable().optional(),
  parkingSpot: z.string().max(50).nullable().optional(),
  locker: z.string().max(50).nullable().optional(),
  keyTag: z.string().max(50).nullable().optional(),
  packageEmailNotification: z.boolean().optional(),
  comments: z.string().max(5000).optional(),
  customFields: z.record(z.unknown()).optional(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  // Skip demo handler — uses the real database for consistent GET/POST
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;

    const unit = await prisma.unit.findUnique({
      where: { id, deletedAt: null },
      include: {
        building: { select: { id: true, name: true } },
        unitInstructions: {
          where: { isActive: true },
          select: { id: true, instructionText: true, priority: true, createdAt: true },
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
          where: { deletedAt: null, status: { in: ['open', 'in_progress', 'on_hold'] } },
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

    const parsed = updateUnitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    const input = parsed.data;

    const updateData: Record<string, unknown> = {};
    if (input.number !== undefined) updateData.number = input.number;
    if (input.floor !== undefined)
      updateData.floor = input.floor !== null ? Number(input.floor) : null;
    if (input.unitType !== undefined) updateData.unitType = input.unitType;
    if (input.status !== undefined) updateData.status = input.status;
    if (input.squareFootage !== undefined)
      updateData.squareFootage = input.squareFootage !== null ? Number(input.squareFootage) : null;
    if (input.enterPhoneCode !== undefined)
      updateData.enterPhoneCode = input.enterPhoneCode || null;
    if (input.parkingSpot !== undefined) updateData.parkingSpot = input.parkingSpot || null;
    if (input.locker !== undefined) updateData.locker = input.locker || null;
    if (input.keyTag !== undefined) updateData.keyTag = input.keyTag || null;
    if (input.packageEmailNotification !== undefined)
      updateData.packageEmailNotification = input.packageEmailNotification;
    if (input.comments !== undefined) updateData.comments = input.comments;
    if (input.customFields !== undefined) updateData.customFields = input.customFields;

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
