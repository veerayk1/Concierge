/**
 * Key/FOB Inventory API — per PRD 03 + Aquarius FOB management
 * Track key inventory and status, checkout/return lifecycle
 *
 * GET  /api/v1/keys — List keys with filters (propertyId, status, category, search)
 * POST /api/v1/keys — Add key to inventory
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';
import { requireModule } from '@/server/middleware/module-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const createKeySchema = z.object({
  propertyId: z.string().uuid(),
  keyName: z.string().min(1).max(50),
  keyNumber: z.string().max(20).optional(),
  keyOwner: z.string().max(100).optional(),
  category: z.enum([
    'master',
    'unit',
    'common_area',
    'vehicle',
    'equipment',
    'other',
    'fob',
    'buzzer_code',
    'garage_clicker',
    'mailbox',
    'storage_locker',
  ]),
  notes: z.string().max(200).optional(),
});

// ---------------------------------------------------------------------------
// GET /api/v1/keys — List with filtering
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  // Skip demo handler — keys uses the real database for consistent GET/POST
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const moduleCheck = await requireModule(request, 'key_management');
    if (moduleCheck) return moduleCheck;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    const where: Record<string, unknown> = { propertyId };
    if (status) where.status = status;
    if (category) where.category = category;

    if (search) {
      where.OR = [
        { keyName: { contains: search, mode: 'insensitive' } },
        { keyNumber: { contains: search, mode: 'insensitive' } },
        { keyOwner: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [keys, total] = await Promise.all([
      prisma.keyInventory.findMany({
        where,
        include: {
          checkouts: {
            orderBy: { createdAt: 'desc' },
            take: 1,
            select: {
              id: true,
              checkedOutTo: true,
              checkoutTime: true,
              returnTime: true,
              expectedReturn: true,
              unitId: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.keyInventory.count({ where }),
    ]);

    // Enrich with active checkout info for convenience
    const enrichedKeys = keys.map((key) => {
      const lastCheckout = key.checkouts[0];
      const isOverdue =
        lastCheckout?.expectedReturn && !lastCheckout.returnTime
          ? new Date(lastCheckout.expectedReturn) < new Date()
          : false;

      return {
        ...key,
        activeCheckout: lastCheckout && !lastCheckout.returnTime ? lastCheckout : null,
        isOverdue,
      };
    });

    return NextResponse.json({
      data: enrichedKeys,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    console.error('GET /api/v1/keys error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch keys' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/keys — Add key to inventory
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const moduleCheck = await requireModule(request, 'key_management');
    if (moduleCheck) return moduleCheck;

    const body = await request.json();
    const parsed = createKeySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;

    // Resolve a real createdById — demo mode user may not exist in the DB
    let createdById = auth.user.userId;
    try {
      const realUser = await prisma.user.findFirst({
        where: { userProperties: { some: { propertyId: input.propertyId } } },
        select: { id: true },
        orderBy: { createdAt: 'asc' },
      });
      if (realUser) createdById = realUser.id;
    } catch {
      // Ignore — use auth userId
    }

    const key = await prisma.keyInventory.create({
      data: {
        propertyId: input.propertyId,
        keyName: stripControlChars(stripHtml(input.keyName)),
        keyNumber: input.keyNumber ? stripControlChars(stripHtml(input.keyNumber)) : null,
        keyOwner: input.keyOwner ? stripControlChars(stripHtml(input.keyOwner)) : null,
        category: input.category,
        status: 'available',
        notes: input.notes ? stripControlChars(stripHtml(input.notes)) : null,
        createdById,
      },
    });

    return NextResponse.json(
      { data: key, message: `Key ${input.keyName} added to inventory.` },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/v1/keys error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to add key' },
      { status: 500 },
    );
  }
}
