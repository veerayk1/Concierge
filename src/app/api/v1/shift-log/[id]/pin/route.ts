/**
 * Shift Log Pin/Unpin API
 * Per PRD 03 Section 3.1.6
 *
 * POST /api/v1/shift-log/:id/pin — Pins or unpins a shift log entry.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';

const pinSchema = z.object({
  pinned: z.boolean(),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const body = await request.json();
    const parsed = pinSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'pinned (boolean) is required' },
        { status: 400 },
      );
    }

    const { id } = await params;
    const entry = await prisma.event.findUnique({ where: { id } });

    if (!entry) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Shift log entry not found' },
        { status: 404 },
      );
    }

    const existingCustomFields = (entry.customFields as Record<string, unknown> | null) ?? {};

    const updated = await prisma.event.update({
      where: { id },
      data: {
        customFields: {
          ...existingCustomFields,
          pinned: parsed.data.pinned,
        },
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error('POST /api/v1/shift-log/:id/pin error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update pin status' },
      { status: 500 },
    );
  }
}
