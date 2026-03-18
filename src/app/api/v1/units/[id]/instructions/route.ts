/**
 * Unit Instructions API — per PRD 07
 * Front desk instructions for specific units
 * "Unit 815 has a dog that bites. Unit 302 is deaf, use the doorbell twice."
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';

const createInstructionSchema = z.object({
  instruction: z.string().min(1, 'Instruction is required').max(500),
  priority: z.enum(['normal', 'important', 'critical']).default('normal'),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id: unitId } = await params;

    const instructions = await prisma.unitInstruction.findMany({
      where: { unitId, deletedAt: null },
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
    const body = await request.json();

    const parsed = createInstructionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;

    const instruction = await prisma.unitInstruction.create({
      data: {
        unitId,
        instruction: input.instruction,
        priority: input.priority,
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
