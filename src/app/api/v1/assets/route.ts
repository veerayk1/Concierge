/**
 * Assets API — List & Create
 * Track physical assets: furniture, appliances, IT equipment, building systems.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { createAssetSchema } from '@/schemas/asset';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';

// ---------------------------------------------------------------------------
// GET /api/v1/assets — List assets with filtering
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const search = searchParams.get('search') || '';
    const assignmentType = searchParams.get('assignmentType');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = { propertyId };

    if (category) where.category = category;
    if (status) where.status = status;
    if (assignmentType) where.assignmentType = assignmentType;
    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { tagNumber: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [assets, total] = await Promise.all([
      (prisma as any).asset.findMany({
        where,
        orderBy: { tagNumber: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      (prisma as any).asset.count({ where }),
    ]);

    return NextResponse.json({
      data: assets,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    console.error('GET /api/v1/assets error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch assets' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/assets — Create asset
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const body = await request.json();
    const parsed = createAssetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;

    const asset = await (prisma as any).asset.create({
      data: {
        propertyId: input.propertyId,
        tagNumber: stripControlChars(stripHtml(input.tagNumber)),
        description: stripControlChars(stripHtml(input.description)),
        category: input.category,
        status: input.status,
        location: stripControlChars(stripHtml(input.location)),
        assignmentType: input.assignmentType || null,
        assignedToId: input.assignedToId || null,
        purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : null,
        purchaseValue: input.purchaseValue ?? null,
        usefulLifeYears: input.usefulLifeYears ?? null,
        manufacturer: input.manufacturer ? stripControlChars(stripHtml(input.manufacturer)) : null,
        modelNumber: input.modelNumber || null,
        serialNumber: input.serialNumber || null,
        notes: input.notes ? stripControlChars(stripHtml(input.notes)) : null,
        createdById: auth.user.userId,
      },
    });

    return NextResponse.json(
      { data: asset, message: `Asset ${asset.tagNumber} created.` },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/v1/assets error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create asset' },
      { status: 500 },
    );
  }
}
