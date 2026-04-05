/**
 * Property Lookup API — Public endpoint for vanity URL pages and login routing
 * GET /api/v1/properties/lookup?slug={slug}
 * GET /api/v1/properties/lookup?q={search-term}
 *
 * No auth required — returns minimal public data only.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');
    const query = searchParams.get('q');

    // Lookup by exact slug
    if (slug) {
      const property = await prisma.property.findFirst({
        where: {
          slug: slug.toLowerCase(),
          isActive: true,
          deletedAt: null,
        },
        select: {
          id: true,
          name: true,
          slug: true,
          address: true,
          city: true,
          province: true,
          logo: true,
          branding: true,
          unitCount: true,
        },
      });

      if (!property) {
        return NextResponse.json(
          { error: 'NOT_FOUND', message: 'Property not found' },
          { status: 404 }
        );
      }

      return NextResponse.json({ data: property });
    }

    // Search by name (for autocomplete)
    if (query && query.length >= 2) {
      const properties = await prisma.property.findMany({
        where: {
          isActive: true,
          deletedAt: null,
          slug: { not: null },
          name: { contains: query, mode: 'insensitive' },
        },
        select: {
          name: true,
          slug: true,
          city: true,
          logo: true,
        },
        take: 10,
        orderBy: { name: 'asc' },
      });

      return NextResponse.json({ data: properties });
    }

    return NextResponse.json(
      { error: 'BAD_REQUEST', message: 'Provide either slug or q parameter' },
      { status: 400 }
    );
  } catch (error) {
    console.error('GET /api/v1/properties/lookup error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to lookup property' },
      { status: 500 }
    );
  }
}
