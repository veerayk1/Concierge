/**
 * Properties API — List and create properties
 * Multi-property management for management companies.
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

    // Super Admin sees all properties (including inactive); others see only active
    const where: Record<string, unknown> = { deletedAt: null };
    if (auth.user.role !== 'super_admin') {
      where.isActive = true;
    }
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
        branding: true,
        propertyCode: true,
        isActive: true,
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

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin', 'property_admin'] });
    if (auth.error) return auth.error;

    const body = await request.json();

    // Validate required fields
    const required = ['name', 'address', 'city', 'province', 'postalCode'];
    const missing = required.filter((f) => !body[f]);
    if (missing.length > 0) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: `Missing required fields: ${missing.join(', ')}`,
          fields: missing.map((f) => ({ field: f, message: `${f} is required` })),
        },
        { status: 400 },
      );
    }

    // Generate a unique slug from the name if not provided
    const baseSlug =
      body.slug ||
      body.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    const slug = `${baseSlug}-${Date.now().toString(36)}`;

    // Generate a unique property code (max 7 chars per schema)
    const propertyCode = body.propertyCode || `P${Date.now().toString(36).slice(-6).toUpperCase()}`;

    const property = await prisma.property.create({
      data: {
        name: body.name,
        address: body.address,
        city: body.city,
        province: body.province,
        country: body.country || 'CA',
        postalCode: body.postalCode,
        unitCount: body.unitCount || 0,
        timezone: body.timezone || 'America/Toronto',
        logo: body.logo || null,
        type: 'PRODUCTION',
        slug,
        branding: body.branding || {},
        propertyCode,
      },
    });

    return NextResponse.json({ data: property }, { status: 201 });
  } catch (error) {
    console.error('POST /api/v1/properties error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create property' },
      { status: 500 },
    );
  }
}
