/**
 * Event Type Detail API — Update, Delete
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute, enforcePropertyAccess } from '@/server/middleware/api-guard';

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin', 'property_admin'] });
    if (auth.error) return auth.error;

    const { id } = await params;

    const target = await prisma.eventType.findUnique({
      where: { id },
      select: { propertyId: true },
    });
    if (!target) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Event type not found' },
        { status: 404 },
      );
    }
    const tenancy = enforcePropertyAccess(auth.user, target.propertyId);
    if (tenancy) return tenancy;

    const body = await request.json();

    const updateData: Record<string, unknown> = {};
    if (body.name) updateData.name = body.name;
    if (body.icon !== undefined) updateData.icon = body.icon;
    if (body.color !== undefined) updateData.color = body.color;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.notificationTemplate !== undefined)
      updateData.notificationTemplate = body.notificationTemplate;

    const eventType = await prisma.eventType.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ data: eventType, message: 'Event type updated.' });
  } catch (error) {
    console.error('PATCH /api/v1/event-types/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update event type' },
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

    const target = await prisma.eventType.findUnique({
      where: { id },
      select: { propertyId: true },
    });
    if (!target) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Event type not found' },
        { status: 404 },
      );
    }
    const tenancy = enforcePropertyAccess(auth.user, target.propertyId);
    if (tenancy) return tenancy;

    // Check if event type has events
    const eventCount = await prisma.event.count({
      where: { eventTypeId: id, deletedAt: null },
    });

    if (eventCount > 0) {
      // Soft delete — don't lose data
      await prisma.eventType.update({
        where: { id },
        data: { deletedAt: new Date(), isActive: false },
      });
      return NextResponse.json({ message: 'Event type deactivated (has existing events).' });
    }

    // Hard delete if no events
    await prisma.eventType.delete({ where: { id } });
    return NextResponse.json({ message: 'Event type deleted.' });
  } catch (error) {
    console.error('DELETE /api/v1/event-types/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to delete event type' },
      { status: 500 },
    );
  }
}
