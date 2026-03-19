/**
 * Authorized Delegates API — per PRD 04
 * Manage authorized pickup representatives per unit
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';

const createDelegateSchema = z.object({
  unitId: z.string().uuid(),
  delegateName: z.string().min(1, 'Name is required').max(100),
  delegatePhone: z.string().max(20).optional(),
  relationship: z.string().max(50).optional(),
  validFrom: z.string().optional(),
  validUntil: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const unitId = new URL(request.url).searchParams.get('unitId');

    if (!unitId) {
      return NextResponse.json(
        { error: 'MISSING_UNIT', message: 'unitId is required' },
        { status: 400 },
      );
    }

    const delegates = await prisma.authorizedDelegate.findMany({
      where: { unitId, isActive: true },
      orderBy: { delegateName: 'asc' },
    });

    return NextResponse.json({ data: delegates });
  } catch (error) {
    console.error('GET /api/v1/authorized-delegates error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch delegates' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const body = await request.json();
    const parsed = createDelegateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;

    const delegate = await prisma.authorizedDelegate.create({
      data: {
        unitId: input.unitId,
        delegateName: input.delegateName,
        delegatePhone: input.delegatePhone || null,
        relationship: input.relationship || null,
        validFrom: input.validFrom ? new Date(input.validFrom) : null,
        validUntil: input.validUntil ? new Date(input.validUntil) : null,
        isActive: true,
        createdById: auth.user.userId,
      },
    });

    return NextResponse.json({ data: delegate, message: 'Delegate added.' }, { status: 201 });
  } catch (error) {
    console.error('POST /api/v1/authorized-delegates error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to add delegate' },
      { status: 500 },
    );
  }
}
