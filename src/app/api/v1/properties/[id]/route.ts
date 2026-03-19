/**
 * Property Detail API — GET and PATCH a single property
 * Multi-property management: view and update property details,
 * branding (white-label), vanity URL (slug/propertyCode).
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin', 'property_admin'] });
    if (auth.error) return auth.error;

    const { id } = await params;

    const property = await prisma.property.findUnique({
      where: { id, deletedAt: null },
    });

    if (!property) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Property not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: property });
  } catch (error) {
    console.error('GET /api/v1/properties/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch property' },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin', 'property_admin'] });
    if (auth.error) return auth.error;

    const { id } = await params;
    const body = await request.json();

    // Verify property exists
    const existing = await prisma.property.findUnique({
      where: { id, deletedAt: null },
    });
    if (!existing) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Property not found' },
        { status: 404 },
      );
    }

    // Build update data from allowed fields
    const allowedFields = [
      'name',
      'address',
      'city',
      'province',
      'country',
      'postalCode',
      'unitCount',
      'timezone',
      'logo',
      'slug',
      'branding',
      'propertyCode',
      'type',
    ];

    const updateData: Record<string, unknown> = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    const property = await prisma.property.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ data: property });
  } catch (error) {
    // Handle unique constraint violations (slug, propertyCode)
    if (error instanceof Error && (error as unknown as Record<string, unknown>).code === 'P2002') {
      return NextResponse.json(
        { error: 'CONFLICT', message: 'A property with that slug or code already exists' },
        { status: 409 },
      );
    }
    console.error('PATCH /api/v1/properties/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update property' },
      { status: 500 },
    );
  }
}
