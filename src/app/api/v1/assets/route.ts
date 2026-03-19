/**
 * Assets API — List & Create
 *
 * Track physical assets: furniture, appliances, IT equipment, building systems,
 * vehicles, tools, and infrastructure. Auto-generates asset tags (AST-XXXXXX).
 * Includes warranty status calculation on listings.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ASSET_CATEGORIES = [
  'furniture',
  'appliance',
  'fixture',
  'technology',
  'vehicle',
  'tool',
  'infrastructure',
  'it',
  'building_system',
] as const;

const ASSET_STATUSES = ['in_use', 'in_storage', 'under_repair', 'disposed'] as const;
const ASSET_CONDITIONS = ['new', 'good', 'fair', 'poor', 'end_of_life'] as const;
const ASSIGNMENT_TYPES = ['common_area', 'unit'] as const;

// ---------------------------------------------------------------------------
// Validation Schemas
// ---------------------------------------------------------------------------

const createAssetSchema = z.object({
  propertyId: z.string().uuid(),
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().min(1, 'Description is required').max(500).optional(),
  category: z.enum(ASSET_CATEGORIES),
  status: z.enum(ASSET_STATUSES).default('in_use'),
  condition: z.enum(ASSET_CONDITIONS).default('good'),
  location: z.string().min(1, 'Location is required').max(200),
  assignmentType: z.enum(ASSIGNMENT_TYPES).optional(),
  assignedToId: z.string().uuid().optional().nullable(),
  purchaseDate: z.string().optional().nullable(),
  purchasePrice: z.number().min(0).optional().nullable(),
  usefulLifeYears: z.number().int().min(1).max(100).optional().nullable(),
  warrantyExpiry: z.string().optional().nullable(),
  manufacturer: z.string().max(200).optional().or(z.literal('')),
  modelNumber: z.string().max(200).optional().or(z.literal('')),
  serialNumber: z.string().max(200).optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Generate an asset tag in the format AST-XXXXXX */
function generateAssetTag(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `AST-${code}`;
}

/** Calculate warranty status from expiry date */
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
    const condition = searchParams.get('condition');
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
    const where: Record<string, any> = { propertyId, deletedAt: null };

    if (category) where.category = category;
    if (status) where.status = status;
    if (assignmentType) where.assignmentType = assignmentType;

    // Condition filter — stored in notes field as prefix or as a separate metadata approach
    // Since the schema does not have a dedicated condition column, we filter in-app
    // after retrieval when condition is specified.
    const filterCondition = condition || null;

    if (search) {
      where.OR = [
        { description: { contains: search, mode: 'insensitive' } },
        { tagNumber: { contains: search, mode: 'insensitive' } },
        { manufacturer: { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search, mode: 'insensitive' } },
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

    // Enrich with warranty status calculation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const enriched = (assets as any[]).map((asset: any) => {
      // Parse warranty info from notes if stored there
      const warrantyExpiry = asset.notes?.match(/warranty_expiry:(\S+)/)?.[1] || null;
      const conditionValue = asset.notes?.match(/condition:(\S+)/)?.[1] || null;

      return {
        ...asset,
        assetTag: asset.tagNumber,
        condition: conditionValue,
        warrantyStatus: calculateWarrantyStatus(warrantyExpiry),
      };
    });

    // Apply in-memory condition filter if specified
    const filtered = filterCondition
      ? enriched.filter((a: any) => a.condition === filterCondition)
      : enriched;

    return NextResponse.json({
      data: filtered,
      meta: {
        page,
        pageSize,
        total: filterCondition ? filtered.length : total,
        totalPages: Math.ceil((filterCondition ? filtered.length : total) / pageSize),
      },
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
    const assetTag = generateAssetTag();

    // Build notes with structured metadata (condition, warranty)
    const metaParts: string[] = [];
    if (input.condition) metaParts.push(`condition:${input.condition}`);
    if (input.warrantyExpiry) metaParts.push(`warranty_expiry:${input.warrantyExpiry}`);
    const metaPrefix = metaParts.length > 0 ? metaParts.join(' ') + '\n' : '';
    const notesContent = input.notes ? stripControlChars(stripHtml(input.notes)) : '';
    const fullNotes = metaPrefix + notesContent || null;

    const asset = await (prisma as any).asset.create({
      data: {
        propertyId: input.propertyId,
        tagNumber: assetTag,
        description: stripControlChars(
          stripHtml(input.name + (input.description ? ` — ${input.description}` : '')),
        ),
        category: input.category,
        status: input.status,
        location: stripControlChars(stripHtml(input.location)),
        assignmentType: input.assignmentType || null,
        assignedToId: input.assignedToId || null,
        purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : null,
        purchaseValue: input.purchasePrice ?? null,
        usefulLifeYears: input.usefulLifeYears ?? null,
        manufacturer: input.manufacturer ? stripControlChars(stripHtml(input.manufacturer)) : null,
        modelNumber: input.modelNumber || null,
        serialNumber: input.serialNumber || null,
        notes: fullNotes,
        createdById: auth.user.userId,
      },
    });

    return NextResponse.json(
      {
        data: { ...asset, assetTag, condition: input.condition },
        message: `Asset ${assetTag} created.`,
      },
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
