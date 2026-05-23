/**
 * Couriers API — per PRD 04
 * List and manage courier types for package intake
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const propertyId = new URL(request.url).searchParams.get('propertyId');

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    const couriers = await prisma.courierType.findMany({
      where: {
        OR: [{ propertyId }, { propertyId: null, isSystem: true }],
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        iconUrl: true,
        color: true,
        isSystem: true,
        sortOrder: true,
        propertyId: true,
      },
      orderBy: [{ isSystem: 'desc' }, { sortOrder: 'asc' }, { name: 'asc' }],
    });

    // Dedupe by slug — the seed can leave both a system row (propertyId NULL)
    // AND a per-property override with the same slug, which would otherwise
    // render duplicate courier pills in the Log Package dialog. Prefer the
    // property-scoped row when one exists.
    const bySlug = new Map<string, (typeof couriers)[number]>();
    for (const c of couriers) {
      const existing = bySlug.get(c.slug);
      if (!existing || (existing.propertyId === null && c.propertyId !== null)) {
        bySlug.set(c.slug, c);
      }
    }
    const deduped = [...bySlug.values()]
      .map(({ propertyId: _pid, ...rest }) => rest)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));

    return NextResponse.json({ data: deduped });
  } catch (error) {
    console.error('GET /api/v1/couriers error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch couriers' },
      { status: 500 },
    );
  }
}
