/**
 * Asset Detail API — Get, Update, and manage individual assets
 *
 * Includes depreciation calculation for assets with purchase data
 * and maintenance history enrichment.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { calculateDepreciation } from '@/schemas/asset';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ASSET_STATUSES = ['in_use', 'in_storage', 'under_repair', 'disposed'] as const;
const ASSET_CONDITIONS = ['new', 'good', 'fair', 'poor', 'end_of_life'] as const;

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const updateAssetSchema = z.object({
  description: z.string().min(1).max(500).optional(),
  category: z.string().max(30).optional(),
  status: z.enum(ASSET_STATUSES).optional(),
  condition: z.enum(ASSET_CONDITIONS).optional(),
  location: z.string().min(1).max(200).optional(),
  assignmentType: z.string().max(20).optional().nullable(),
  assignedToId: z.string().uuid().optional().nullable(),
  purchaseDate: z.string().optional().nullable(),
  purchaseValue: z.number().min(0).optional().nullable(),
  usefulLifeYears: z.number().int().min(1).max(100).optional().nullable(),
  notes: z.string().max(2000).optional().nullable(),
  manufacturer: z.string().max(200).optional(),
  modelNumber: z.string().max(200).optional(),
  serialNumber: z.string().max(200).optional(),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function calculateWarrantyStatus(warrantyExpiry: string | null | undefined): {
  isUnderWarranty: boolean;
  daysRemaining: number | null;
  status: 'active' | 'expiring_soon' | 'expired' | 'unknown';
} {
  if (!warrantyExpiry) {
    return { isUnderWarranty: false, daysRemaining: null, status: 'unknown' };
  }
  const expiry = new Date(warrantyExpiry);
  const now = new Date();
  const diffMs = expiry.getTime() - now.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) {
    return { isUnderWarranty: false, daysRemaining: 0, status: 'expired' };
  }
  if (daysRemaining <= 30) {
    return { isUnderWarranty: true, daysRemaining, status: 'expiring_soon' };
  }
  return { isUnderWarranty: true, daysRemaining, status: 'active' };
}

// ---------------------------------------------------------------------------
// GET /api/v1/assets/:id — Asset detail with depreciation and maintenance
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;

    const asset = await (prisma as any).asset.findUnique({
      where: { id },
    });

    if (!asset || asset.deletedAt) {
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

    // Extract structured metadata from notes
    const warrantyExpiry = asset.notes?.match(/warranty_expiry:(\S+)/)?.[1] || null;
    const conditionValue = asset.notes?.match(/condition:(\S+)/)?.[1] || null;

    // Fetch maintenance history linked to this asset (via equipment reference)
    let maintenanceHistory: unknown[] = [];
    try {
      maintenanceHistory = await prisma.maintenanceRequest.findMany({
        where: {
          equipmentId: id,
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          description: true,
          status: true,
          priority: true,
          createdAt: true,
          completedDate: true,
        },
      });
    } catch {
      // maintenanceRequest may not have equipmentId — gracefully ignore
    }

    return NextResponse.json({
      data: {
        ...asset,
        assetTag: asset.tagNumber,
        condition: conditionValue,
        warrantyStatus: calculateWarrantyStatus(warrantyExpiry),
        depreciation,
        maintenanceHistory,
      },
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
// PATCH /api/v1/assets/:id — Update asset status, condition, notes
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;

    const existing = await (prisma as any).asset.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
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

    // Build update data with XSS sanitization
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {};

    if (input.description !== undefined) {
      updateData.description = stripControlChars(stripHtml(input.description));
    }
    if (input.location !== undefined) {
      updateData.location = stripControlChars(stripHtml(input.location));
    }
    if (input.status !== undefined) {
      updateData.status = input.status;
    }
    if (input.category !== undefined) {
      updateData.category = input.category;
    }
    if (input.assignmentType !== undefined) {
      updateData.assignmentType = input.assignmentType;
    }
    if (input.assignedToId !== undefined) {
      updateData.assignedToId = input.assignedToId;
    }
    if (input.purchaseDate !== undefined) {
      updateData.purchaseDate = input.purchaseDate ? new Date(input.purchaseDate) : null;
    }
    if (input.purchaseValue !== undefined) {
      updateData.purchaseValue = input.purchaseValue;
    }
    if (input.usefulLifeYears !== undefined) {
      updateData.usefulLifeYears = input.usefulLifeYears;
    }
    if (input.manufacturer !== undefined) {
      updateData.manufacturer = stripControlChars(stripHtml(input.manufacturer));
    }
    if (input.modelNumber !== undefined) {
      updateData.modelNumber = input.modelNumber;
    }
    if (input.serialNumber !== undefined) {
      updateData.serialNumber = input.serialNumber;
    }

    // Handle condition and notes — merge structured metadata into notes
    if (input.condition !== undefined || input.notes !== undefined) {
      const currentNotes = existing.notes || '';
      // Extract existing metadata
      const existingCondition = currentNotes.match(/condition:(\S+)/)?.[1] || null;
      const existingWarranty = currentNotes.match(/warranty_expiry:(\S+)/)?.[1] || null;
      // Remove old metadata lines
      const cleanNotes = currentNotes
        .replace(/condition:\S+\s*/g, '')
        .replace(/warranty_expiry:\S+\s*/g, '')
        .trim();

      const metaParts: string[] = [];
      const newCondition = input.condition || existingCondition;
      if (newCondition) metaParts.push(`condition:${newCondition}`);
      if (existingWarranty) metaParts.push(`warranty_expiry:${existingWarranty}`);

      const metaPrefix = metaParts.length > 0 ? metaParts.join(' ') + '\n' : '';
      const notesBody =
        input.notes !== undefined ? stripControlChars(stripHtml(input.notes || '')) : cleanNotes;

      updateData.notes = (metaPrefix + notesBody).trim() || null;
    }

    const updated = await (prisma as any).asset.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      data: { ...updated, assetTag: updated.tagNumber },
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
