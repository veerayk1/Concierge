/**
 * Unit Instructions API — per PRD 07
 * Front desk instructions for specific units
 * "Unit 815 has a dog that bites. Unit 302 is deaf, use the doorbell twice."
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute, enforcePropertyAccess } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';
import { isUuid } from '@/lib/uuid';

const createInstructionSchema = z.object({
  instructionText: z.string().min(1, 'Instruction is required').max(1000),
  priority: z.enum(['normal', 'important', 'critical']).default('normal'),
  propertyId: z.string().uuid(),
  visibleToRoles: z.array(z.string()).optional(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id: unitId } = await params;
    if (!isUuid(unitId)) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Invalid unit id.' },
        { status: 400 },
      );
    }

    // Unit instructions can contain sensitive resident detail ("Unit 815
    // has a dog that bites; Unit 302 is deaf, use the doorbell twice").
    // Inherit tenancy from the parent unit.
    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
      select: { propertyId: true },
    });
    if (!unit) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Unit not found' }, { status: 404 });
    }
    const tenancy = enforcePropertyAccess(auth.user, unit.propertyId);
    if (tenancy) return tenancy;

    const instructions = await prisma.unitInstruction.findMany({
      where: { unitId, isActive: true },
      orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ data: instructions });
  } catch (error) {
    console.error('GET /api/v1/units/:id/instructions error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch instructions' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id: unitId } = await params;
    if (!isUuid(unitId)) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Invalid unit id.' },
        { status: 400 },
      );
    }

    const unit = await prisma.unit.findUnique({
      where: { id: unitId },
      select: { propertyId: true },
    });
    if (!unit) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Unit not found' }, { status: 404 });
    }
    const tenancy = enforcePropertyAccess(auth.user, unit.propertyId);
    if (tenancy) return tenancy;

    const body = await request.json();

    const parsed = createInstructionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;

    // Trust the unit's actual propertyId, not body.propertyId — body is
    // user-controlled and could otherwise plant an instruction at the
    // wrong property via mass assignment.
    const instruction = await prisma.unitInstruction.create({
      data: {
        unitId,
        propertyId: unit.propertyId,
        instructionText: stripControlChars(stripHtml(input.instructionText)),
        priority: input.priority,
        visibleToRoles: input.visibleToRoles || [],
        createdById: auth.user.userId,
      },
    });

    return NextResponse.json({ data: instruction, message: 'Instruction added.' }, { status: 201 });
  } catch (error) {
    console.error('POST /api/v1/units/:id/instructions error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to add instruction' },
      { status: 500 },
    );
  }
}
