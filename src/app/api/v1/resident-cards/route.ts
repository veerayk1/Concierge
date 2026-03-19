/**
 * Resident ID Cards API — List and Issue
 *
 * Physical and digital identity cards for building residents.
 * Cards contain QR codes for instant security verification.
 * Supports bulk generation for new building onboarding.
 *
 * Card types: resident, owner, tenant, family_member, staff
 * Auto-generates card number (RC-XXXXXX) on creation.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';
import { nanoid } from 'nanoid';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const VALID_STATUSES = ['active', 'expired', 'revoked', 'lost'] as const;
const VALID_CARD_TYPES = ['resident', 'owner', 'tenant', 'family_member', 'staff'] as const;
const VALID_ACCESS_LEVELS = ['full', 'limited', 'temporary', 'restricted'] as const;

// ---------------------------------------------------------------------------
// Validation Schemas
// ---------------------------------------------------------------------------

const singleCardSchema = z.object({
  propertyId: z.string().uuid(),
  residentId: z.string().min(1).optional(),
  unitId: z.string().min(1).optional(),
  residentName: z.string().min(1, 'Resident name is required').max(200),
  unit: z.string().min(1, 'Unit is required').max(50).optional(),
  type: z.enum(VALID_CARD_TYPES).default('resident'),
  photoUrl: z.string().url().optional().or(z.literal('')),
  accessLevel: z.enum(VALID_ACCESS_LEVELS).default('full'),
  designTemplate: z.string().max(100).optional(),
  bulk: z.literal(false).optional().or(z.undefined()),
});

const bulkResidentSchema = z.object({
  residentId: z.string().min(1).optional(),
  unitId: z.string().min(1).optional(),
  residentName: z.string().min(1).max(200),
  unit: z.string().min(1).max(50).optional(),
  type: z.enum(VALID_CARD_TYPES).default('resident'),
  accessLevel: z.enum(VALID_ACCESS_LEVELS).default('full'),
  photoUrl: z.string().url().optional().or(z.literal('')),
});

const bulkCardSchema = z.object({
  propertyId: z.string().uuid(),
  bulk: z.literal(true),
  residents: z
    .array(bulkResidentSchema)
    .min(1, 'At least one resident required')
    .max(500, 'Maximum 500 residents per bulk request'),
  designTemplate: z.string().max(100).optional(),
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Generate a card number in the format RC-XXXXXX */
function generateCardNumber(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `RC-${code}`;
}

// ---------------------------------------------------------------------------
// GET /api/v1/resident-cards — List cards
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const type = searchParams.get('type') || undefined;
    const status = searchParams.get('status') || undefined;
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    if (status && !VALID_STATUSES.includes(status as (typeof VALID_STATUSES)[number])) {
      return NextResponse.json(
        { error: 'INVALID_STATUS', message: `Status must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 },
      );
    }

    if (type && !VALID_CARD_TYPES.includes(type as (typeof VALID_CARD_TYPES)[number])) {
      return NextResponse.json(
        { error: 'INVALID_TYPE', message: `Type must be one of: ${VALID_CARD_TYPES.join(', ')}` },
        { status: 400 },
      );
    }

    const where: Record<string, unknown> = { propertyId, deletedAt: null };

    if (status) {
      where.status = status;
    }

    // Filter by card type stored in designTemplate field
    if (type) {
      where.designTemplate = type;
    }

    if (search) {
      where.OR = [
        { residentName: { contains: search, mode: 'insensitive' } },
        { qrCode: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [cards, total] = await Promise.all([
      prisma.residentCard.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: {
          property: {
            select: { name: true },
          },
        },
      }),
      prisma.residentCard.count({ where }),
    ]);

    return NextResponse.json({
      data: cards,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    console.error('GET /api/v1/resident-cards error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch resident cards' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/resident-cards — Issue new card(s)
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const body = await request.json();

    // Bulk generation
    if (body.bulk === true) {
      const parsed = bulkCardSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
          { status: 400 },
        );
      }

      const input = parsed.data;
      const now = new Date();
      const expiresAt = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
      const template = input.designTemplate || 'standard';

      const cardsData = input.residents.map((r) => ({
        propertyId: input.propertyId,
        residentId: r.residentId || nanoid(12),
        unitId: r.unitId || r.unit || nanoid(12),
        residentName: stripControlChars(stripHtml(r.residentName)),
        photoUrl: r.photoUrl || null,
        accessLevel: r.accessLevel,
        status: 'active' as const,
        qrCode: generateCardNumber(),
        designTemplate: r.type || template,
        expiresAt,
        issuedById: auth.user.userId,
      }));

      const result = (await prisma.residentCard.createMany({
        data: cardsData,
      })) as { count: number; cards?: unknown[] };

      return NextResponse.json(
        {
          data: { count: result.count, cards: result.cards },
          message: `${result.count} resident cards issued.`,
        },
        { status: 201 },
      );
    }

    // Single card issuance
    const parsed = singleCardSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;
    const now = new Date();
    const expiresAt = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
    const cardNumber = generateCardNumber();

    const card = await prisma.residentCard.create({
      data: {
        propertyId: input.propertyId,
        residentId: input.residentId || nanoid(12),
        unitId: input.unitId || input.unit || nanoid(12),
        residentName: stripControlChars(stripHtml(input.residentName)),
        photoUrl: input.photoUrl || null,
        accessLevel: input.accessLevel,
        status: 'active',
        qrCode: cardNumber,
        designTemplate: input.type || input.designTemplate || 'standard',
        expiresAt,
        issuedById: auth.user.userId,
      },
    });

    return NextResponse.json(
      {
        data: { ...card, cardNumber },
        message: `Resident card ${cardNumber} issued for ${input.residentName}.`,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/v1/resident-cards error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to issue resident card' },
      { status: 500 },
    );
  }
}
