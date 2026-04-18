/**
 * Per-Property Settings API
 * Each property has independent settings including event types, branding config, etc.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';
import { z } from 'zod';

const updatePropertySettingsSchema = z.object({
  brandingConfig: z.unknown().optional(),
  welcomeMessage: z.string().max(5000).nullable().optional(),
  operationalToggles: z.unknown().optional(),
});

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

    const parsed = updatePropertySettingsSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    const input = parsed.data;

    const settings = await prisma.propertySettings.upsert({
      where: { propertyId },
      create: {
        propertyId,
        brandingConfig: (input.brandingConfig as any) || null,
        welcomeMessage: input.welcomeMessage || null,
        operationalToggles: (input.operationalToggles as any) || null,
      },
      update: {
        ...(input.brandingConfig !== undefined && { brandingConfig: input.brandingConfig as any }),
        ...(input.welcomeMessage !== undefined && { welcomeMessage: input.welcomeMessage }),
        ...(input.operationalToggles !== undefined && {
          operationalToggles: input.operationalToggles as any,
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
