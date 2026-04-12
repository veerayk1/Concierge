/**
 * Key Checkout API — Issue and list key checkouts
 * Per Aquarius FOB management: 6 FOB slots, 2 buzzer codes, 2 garage clickers
 *
 * Supports single and bulk issuance (move-in scenario).
 * Enforces max-keys-per-unit limits when enforceMax=true.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';

// ---------------------------------------------------------------------------
// Max keys per unit by category (Aquarius spec)
// ---------------------------------------------------------------------------

const MAX_KEYS_PER_UNIT: Record<string, number> = {
  fob: 6,
  buzzer_code: 2,
  garage_clicker: 2,
  mailbox: 2,
  storage_locker: 2,
  master: 1,
  unit: 4,
  common_area: 2,
  vehicle: 2,
  equipment: 2,
  other: 10,
};

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const singleCheckoutSchema = z.object({
  propertyId: z.string().min(1),
  keyId: z.string().min(1),
  checkedOutTo: z.string().min(1).max(100),
  unitId: z.string().min(1).optional(),
  company: z.string().max(100).optional(),
  idType: z.string().min(1).max(50),
  idNumber: z.string().max(30).optional(),
  reason: z.string().min(1).max(500),
  expectedReturn: z.string().optional(),
  enforceMax: z.boolean().optional(),
  bulk: z.literal(false).optional(),
});

const bulkCheckoutSchema = z.object({
  propertyId: z.string().min(1),
  bulk: z.literal(true),
  keyIds: z.array(z.string().min(1)).min(1),
  checkedOutTo: z.string().min(1).max(100),
  unitId: z.string().min(1).optional(),
  idType: z.string().min(1).max(50),
  idNumber: z.string().max(30).optional(),
  reason: z.string().min(1).max(500),
  expectedReturn: z.string().optional(),
  enforceMax: z.boolean().optional(),
});

const checkoutSchema = z.union([bulkCheckoutSchema, singleCheckoutSchema]);

// ---------------------------------------------------------------------------
// GET /api/v1/keys/checkouts — List checkouts (filterable)
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const keyId = searchParams.get('keyId');
    const unitId = searchParams.get('unitId');
    const active = searchParams.get('active');

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    const where: Record<string, unknown> = { propertyId };
    if (keyId) where.keyId = keyId;
    if (unitId) where.unitId = unitId;
    if (active === 'true') where.returnTime = null;

    const checkouts = await prisma.keyCheckout.findMany({
      where,
      orderBy: { checkoutTime: 'desc' },
      include: {
        key: { select: { id: true, keyName: true, category: true, status: true } },
      },
    });

    return NextResponse.json({ data: checkouts });
  } catch (error) {
    console.error('GET /api/v1/keys/checkouts error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch checkouts' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/keys/checkouts — Issue key(s)
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;
    const isBulk = 'bulk' in input && input.bulk === true;
    const keyIds = isBulk ? input.keyIds : [input.keyId];

    // Validate all keys exist, belong to property, and are available
    const keys = [];
    for (const keyId of keyIds) {
      const key = await prisma.keyInventory.findUnique({ where: { id: keyId } });
      if (!key || key.propertyId !== input.propertyId) {
        return NextResponse.json(
          { error: 'KEY_NOT_FOUND', message: `Key ${keyId} not found in this property.` },
          { status: 404 },
        );
      }
      if (key.status !== 'available') {
        return NextResponse.json(
          {
            error: 'KEY_NOT_AVAILABLE',
            message: `Key ${keyId} is ${key.status} and cannot be issued.`,
          },
          { status: 409 },
        );
      }
      keys.push(key);
    }

    // Enforce max keys per unit if requested
    if (input.enforceMax && input.unitId) {
      for (const key of keys) {
        const maxAllowed = MAX_KEYS_PER_UNIT[key.category] ?? 10;
        const currentCount = await prisma.keyInventory.count({
          where: {
            propertyId: input.propertyId,
            category: key.category,
            status: 'checked_out',
            checkouts: {
              some: {
                unitId: input.unitId,
                returnTime: null,
              },
            },
          },
        });
        if (currentCount >= maxAllowed) {
          return NextResponse.json(
            {
              error: 'MAX_KEYS_EXCEEDED',
              message: `Unit ${input.unitId} already has ${currentCount}/${maxAllowed} ${key.category} keys.`,
            },
            { status: 409 },
          );
        }
      }
    }

    // Create checkout(s)
    if (isBulk) {
      const results = await prisma.$transaction(
        keys.map((key) =>
          prisma.keyCheckout.create({
            data: {
              propertyId: input.propertyId,
              keyId: key.id,
              checkedOutTo: input.checkedOutTo,
              unitId: input.unitId || null,
              idType: input.idType,
              idNumber: input.idNumber || null,
              reason: input.reason,
              checkoutTime: new Date(),
              expectedReturn: input.expectedReturn ? new Date(input.expectedReturn) : null,
              checkedOutById: auth.user.userId,
            },
          }),
        ),
      );

      // Update all key statuses
      await Promise.all(
        keys.map((key) =>
          prisma.keyInventory.update({
            where: { id: key.id },
            data: { status: 'checked_out' },
          }),
        ),
      );

      return NextResponse.json(
        { data: results, message: `${results.length} keys issued to ${input.checkedOutTo}.` },
        { status: 201 },
      );
    }

    // Single checkout
    const checkout = await prisma.keyCheckout.create({
      data: {
        propertyId: input.propertyId,
        keyId: keys[0]!.id,
        checkedOutTo: input.checkedOutTo,
        unitId: input.unitId || null,
        idType: input.idType,
        idNumber: input.idNumber || null,
        reason: input.reason,
        checkoutTime: new Date(),
        expectedReturn: input.expectedReturn ? new Date(input.expectedReturn) : null,
        checkedOutById: auth.user.userId,
      },
    });

    await prisma.keyInventory.update({
      where: { id: keys[0]!.id },
      data: { status: 'checked_out' },
    });

    return NextResponse.json(
      { data: checkout, message: `Key issued to ${input.checkedOutTo}.` },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/v1/keys/checkouts error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to issue key' },
      { status: 500 },
    );
  }
}
