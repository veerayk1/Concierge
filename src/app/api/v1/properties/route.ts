/**
 * Properties API — List properties for the current user
 * Per PRD 01 Architecture + ADMIN-SUPERADMIN-ARCHITECTURE
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin', 'property_admin'] });
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type'); // production, demo, sandbox

    const where: Record<string, unknown> = { deletedAt: null, isActive: true };
    if (type) where.type = type.toUpperCase();
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    const properties = await prisma.property.findMany({
      where,
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
        type: true,
        subscriptionTier: true,
        slug: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ data: properties });
  } catch (error) {
    console.error('GET /api/v1/properties error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch properties' },
      { status: 500 },
    );
  }
}
