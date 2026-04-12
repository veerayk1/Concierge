/**
 * Equipment Lifecycle API — List & Create
 * Per CLAUDE.md Phase 2
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { createEquipmentSchema, bulkImportRowSchema } from '@/schemas/equipment';
import { nanoid } from 'nanoid';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';

// ---------------------------------------------------------------------------
// GET /api/v1/equipment — List with filtering
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request, {
      roles: ['property_admin', 'property_manager', 'superintendent', 'maintenance_staff'],
    });
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const location = searchParams.get('location');
    const aging = searchParams.get('aging');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    const where: Record<string, unknown> = { propertyId, deletedAt: null };
    if (category) where.category = category;
    if (status) where.status = status;
    if (location) {
      where.location = { contains: location, mode: 'insensitive' };
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { serialNumber: { contains: search, mode: 'insensitive' } },
        { assetTag: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Aging report filter: items past expected lifespan
    if (aging === 'true') {
      const cutoffDate = new Date();
      where.installDate = { not: null, lt: cutoffDate };
      where.expectedLifespanYears = { not: null, gt: 0 };
    }

    const [items, total] = await Promise.all([
      prisma.equipment.findMany({
        where,
        orderBy: { name: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.equipment.count({ where }),
    ]);

    return NextResponse.json({
      data: items,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    console.error('GET /api/v1/equipment error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch equipment' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/equipment — Create (single or bulk)
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const body = await request.json();

    // ------------------------------------------------------------------
    // Bulk import path
    // ------------------------------------------------------------------
    if (body.bulk === true && Array.isArray(body.items)) {
      if (!body.propertyId || typeof body.propertyId !== 'string') {
        return NextResponse.json(
          { error: 'VALIDATION_ERROR', message: 'propertyId is required for bulk import' },
          { status: 400 },
        );
      }

      const rowErrors: { row: number; errors: Record<string, string[]> }[] = [];
      const validRows: Array<{
        name: string;
        category: string;
        serialNumber?: string;
        location?: string;
        installDate?: string;
        purchasePrice?: number;
      }> = [];

      for (let i = 0; i < body.items.length; i++) {
        const parsed = bulkImportRowSchema.safeParse(body.items[i]);
        if (!parsed.success) {
          rowErrors.push({
            row: i,
            errors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
          });
        } else {
          validRows.push(parsed.data as (typeof validRows)[number]);
        }
      }

      if (rowErrors.length > 0) {
        return NextResponse.json({ error: 'BULK_VALIDATION_ERROR', rowErrors }, { status: 400 });
      }

      const created = await Promise.all(
        validRows.map((row) => {
          const assetTag = `EQ-${nanoid(4).toUpperCase()}`;
          return prisma.equipment.create({
            data: {
              propertyId: body.propertyId,
              name: stripControlChars(stripHtml(row.name)),
              category: row.category || 'other',
              serialNumber: row.serialNumber || null,
              location: row.location || null,
              installDate: row.installDate ? new Date(row.installDate) : null,
              purchasePrice: row.purchasePrice ?? null,
              status: 'active',
              assetTag,
            },
          });
        }),
      );

      return NextResponse.json(
        { data: created, message: `${created.length} equipment items imported.` },
        { status: 201 },
      );
    }

    // ------------------------------------------------------------------
    // Single create path
    // ------------------------------------------------------------------
    const parsed = createEquipmentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;
    const assetTag = `EQ-${nanoid(4).toUpperCase()}`;

    const equipment = await prisma.equipment.create({
      data: {
        propertyId: input.propertyId,
        name: stripControlChars(stripHtml(input.name)),
        category: input.category || 'other',
        serialNumber: input.serialNumber || null,
        manufacturer: input.manufacturer || null,
        modelNumber: input.modelNumber || null,
        location: input.location || null,
        installDate: input.installDate ? new Date(input.installDate) : null,
        purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : null,
        purchasePrice: input.purchasePrice ?? null,
        warrantyExpiry: input.warrantyExpiry ? new Date(input.warrantyExpiry) : null,
        expectedLifespanYears: input.expectedLifespanYears ?? null,
        nextInspectionDate: input.nextInspectionDate ? new Date(input.nextInspectionDate) : null,
        notes: input.notes ? stripControlChars(stripHtml(input.notes)) : null,
        status: 'active',
        assetTag,
      },
    });

    return NextResponse.json(
      { data: equipment, message: `Equipment ${assetTag} created.` },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/v1/equipment error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create equipment' },
      { status: 500 },
    );
  }
}
