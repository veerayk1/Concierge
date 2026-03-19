/**
 * Settings API — Property settings CRUD
 * Per PRD 16 Settings & Admin
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';
import { appCache } from '@/server/cache';

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin', 'property_admin'] });
    if (auth.error) return auth.error;

    const propertyId = new URL(request.url).searchParams.get('propertyId');

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    // Check cache — property settings change infrequently
    const settingsCacheKey = `settings:${propertyId}`;
    const cachedSettings = appCache.get(settingsCacheKey);
    if (cachedSettings) {
      return NextResponse.json(cachedSettings, {
        headers: { 'X-Cache': 'HIT' },
      });
    }

    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        province: true,
        country: true,
        postalCode: true,
        unitCount: true,
        timezone: true,
        logo: true,
        branding: true,
        type: true,
        subscriptionTier: true,
      },
    });

    if (!property) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Property not found' },
        { status: 404 },
      );
    }

    // Also fetch event types for this property
    const eventTypes = await prisma.eventType.findMany({
      where: { propertyId, deletedAt: null },
      select: {
        id: true,
        name: true,
        slug: true,
        icon: true,
        color: true,
        isActive: true,
        notifyOnCreate: true,
      },
      orderBy: { name: 'asc' },
    });

    const settingsResponseBody = {
      data: {
        property,
        eventTypes,
      },
    };

    // Cache property settings for 5 minutes (300 seconds)
    appCache.set(settingsCacheKey, settingsResponseBody, {
      ttl: 300,
      tags: [`property:${propertyId}`, 'module:settings'],
    });

    return NextResponse.json(settingsResponseBody);
  } catch (error) {
    console.error('GET /api/v1/settings error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch settings' },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin', 'property_admin'] });
    if (auth.error) return auth.error;

    const body = await request.json();
    const { propertyId, ...updates } = body;

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    const updateData: Record<string, unknown> = {};
    if (updates.name) updateData.name = updates.name;
    if (updates.address) updateData.address = updates.address;
    if (updates.city) updateData.city = updates.city;
    if (updates.province) updateData.province = updates.province;
    if (updates.postalCode) updateData.postalCode = updates.postalCode;
    if (updates.timezone) updateData.timezone = updates.timezone;
    if (updates.logo !== undefined) updateData.logo = updates.logo;
    if (updates.branding !== undefined) updateData.branding = updates.branding;

    const property = await prisma.property.update({
      where: { id: propertyId },
      data: updateData,
    });

    // Invalidate cached settings for this property
    appCache.invalidateByTag(`property:${propertyId}`);

    return NextResponse.json({ data: property, message: 'Settings updated.' });
  } catch (error) {
    console.error('PATCH /api/v1/settings error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update settings' },
      { status: 500 },
    );
  }
}
