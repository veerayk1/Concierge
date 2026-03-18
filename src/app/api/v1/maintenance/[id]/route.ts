/**
 * Maintenance Request Detail API — Get, Update, Assign
 * Per PRD 05
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { updateMaintenanceSchema } from '@/schemas/maintenance';
import { guardRoute } from '@/server/middleware/api-guard';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;

    const req = await prisma.maintenanceRequest.findUnique({
      where: { id, deletedAt: null },
      include: {
        unit: { select: { id: true, number: true } },
        category: { select: { id: true, name: true } },
      },
    });

    if (!req) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Request not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: req });
  } catch (error) {
    console.error('GET /api/v1/maintenance/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch request' },
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

    const parsed = updateMaintenanceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;
    const updateData: Record<string, unknown> = {};

    if (input.status) {
      updateData.status = input.status;
      if (input.status === 'resolved' || input.status === 'closed') {
        updateData.closedAt = new Date();
      }
    }
    if (input.priority) updateData.priority = input.priority;
    if (input.assignedEmployeeId) updateData.assignedEmployeeId = input.assignedEmployeeId;
    if (input.assignedVendorId) updateData.assignedVendorId = input.assignedVendorId;
    if (input.description) updateData.description = input.description;

    const req = await prisma.maintenanceRequest.update({
      where: { id },
      data: updateData,
      include: {
        unit: { select: { id: true, number: true } },
      },
    });

    return NextResponse.json({
      data: req,
      message: `Request ${input.status ? input.status : 'updated'}.`,
    });
  } catch (error) {
    console.error('PATCH /api/v1/maintenance/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update request' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    await prisma.maintenanceRequest.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return NextResponse.json({ message: 'Request deleted.' });
  } catch (error) {
    console.error('DELETE /api/v1/maintenance/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to delete request' },
      { status: 500 },
    );
  }
}
