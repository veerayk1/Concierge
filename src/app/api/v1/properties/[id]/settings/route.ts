/**
 * Per-Property Settings API
 * Each property has independent settings including event types, branding config, etc.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin', 'property_admin'] });
    if (auth.error) return auth.error;

    const { id: propertyId } = await params;

    const [settings, eventTypes] = await Promise.all([
      prisma.propertySettings.findUnique({ where: { propertyId } }),
      prisma.eventType.findMany({ where: { propertyId, deletedAt: null } }),
    ]);

    return NextResponse.json({
      data: {
        settings: settings || { propertyId, brandingConfig: null },
        eventTypes,
      },
    });
  } catch (error) {
    console.error('GET /api/v1/properties/:id/settings error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch settings' },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin', 'property_admin'] });
    if (auth.error) return auth.error;

    const { id: propertyId } = await params;
    const body = await request.json();

    const settings = await prisma.propertySettings.upsert({
      where: { propertyId },
      create: {
        propertyId,
        brandingConfig: body.brandingConfig || null,
        welcomeMessage: body.welcomeMessage || null,
        operationalToggles: body.operationalToggles || null,
      },
      update: {
        ...(body.brandingConfig !== undefined && { brandingConfig: body.brandingConfig }),
        ...(body.welcomeMessage !== undefined && { welcomeMessage: body.welcomeMessage }),
        ...(body.operationalToggles !== undefined && {
          operationalToggles: body.operationalToggles,
        }),
      },
    });

    return NextResponse.json({ data: settings });
  } catch (error) {
    console.error('PATCH /api/v1/properties/:id/settings error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update settings' },
      { status: 500 },
    );
  }
}
