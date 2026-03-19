/**
 * Asset Detail API — Get & Update individual asset
 * Includes depreciation calculation for assets with purchase data.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { updateAssetSchema, calculateDepreciation } from '@/schemas/asset';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';

// ---------------------------------------------------------------------------
// GET /api/v1/assets/:id — Asset detail with depreciation
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;

    const asset = await (prisma as any).asset.findUnique({
      where: { id },
    });

    if (!asset) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Asset not found' }, { status: 404 });
    }

    // Calculate depreciation if purchase data is available
    let depreciation = null;
    if (asset.purchaseDate && asset.purchaseValue && asset.usefulLifeYears) {
      depreciation = calculateDepreciation(
        asset.purchaseValue,
        asset.usefulLifeYears,
        asset.purchaseDate,
      );
    }

    return NextResponse.json({
      data: { ...asset, depreciation },
    });
  } catch (error) {
    console.error('GET /api/v1/assets/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch asset' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/v1/assets/:id — Update asset
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;

    const existing = await (prisma as any).asset.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Asset not found' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = updateAssetSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;

    // Sanitize string fields
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = { ...input };
    if (input.description) {
      updateData.description = stripControlChars(stripHtml(input.description));
    }
    if (input.location) {
      updateData.location = stripControlChars(stripHtml(input.location));
    }
    if (input.notes) {
      updateData.notes = stripControlChars(stripHtml(input.notes));
    }

    const updated = await (prisma as any).asset.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      data: updated,
      message: `Asset ${updated.tagNumber} updated.`,
    });
  } catch (error) {
    console.error('PATCH /api/v1/assets/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update asset' },
      { status: 500 },
    );
  }
}
