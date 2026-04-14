/**
 * Notification Settings API
 * Per PRD 08 — Notification System
 *
 * GET  /api/v1/settings/notifications — Get property notification settings
 * PUT  /api/v1/settings/notifications — Save property notification settings
 *
 * Settings are stored in PropertySettings.operationalToggles under the
 * "notificationSettings" key as JSONB, so no schema migration is required.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';

// ---------------------------------------------------------------------------
// GET /api/v1/settings/notifications
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin', 'property_admin'] });
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    const settings = await prisma.propertySettings.findUnique({
      where: { propertyId },
      select: { operationalToggles: true },
    });

    // Extract notification settings from the operationalToggles JSON
    const toggles = (settings?.operationalToggles as Record<string, unknown>) ?? {};
    const notificationSettings = (toggles.notificationSettings as Record<string, unknown>) ?? null;

    return NextResponse.json({ data: notificationSettings });
  } catch (error) {
    console.error('GET /api/v1/settings/notifications error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch notification settings' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// PUT /api/v1/settings/notifications
// ---------------------------------------------------------------------------

export async function PUT(request: NextRequest) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin', 'property_admin'] });
    if (auth.error) return auth.error;

    const body = await request.json();
    const { propertyId, ...notificationSettings } = body;

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    // Read existing toggles so we only overwrite the notificationSettings key
    const existing = await prisma.propertySettings.findUnique({
      where: { propertyId },
      select: { operationalToggles: true },
    });

    const existingToggles = (existing?.operationalToggles as Record<string, unknown>) ?? {};
    const mergedToggles = { ...existingToggles, notificationSettings };

    await prisma.propertySettings.upsert({
      where: { propertyId },
      create: {
        propertyId,
        operationalToggles: mergedToggles,
        updatedById: auth.user.userId,
      },
      update: {
        operationalToggles: mergedToggles,
        updatedById: auth.user.userId,
      },
    });

    return NextResponse.json({
      data: notificationSettings,
      message: 'Notification settings saved.',
    });
  } catch (error) {
    console.error('PUT /api/v1/settings/notifications error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to save notification settings' },
      { status: 500 },
    );
  }
}
