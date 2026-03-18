/**
 * Batch Visitor Sign-Out — per PRD 03
 * Sign out multiple visitors at once (end of day cleanup)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';

const batchSignoutSchema = z.object({
  visitorIds: z.array(z.string().uuid()).min(1, 'Select at least one visitor').max(50),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const body = await request.json();
    const parsed = batchSignoutSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { visitorIds } = parsed.data;

    const result = await prisma.visitorEntry.updateMany({
      where: {
        id: { in: visitorIds },
        signedOutAt: null,
      },
      data: {
        signedOutAt: new Date(),
        signedOutById: 'demo-user',
      },
    });

    return NextResponse.json({
      message: `${result.count} visitors signed out.`,
      meta: { count: result.count },
    });
  } catch (error) {
    console.error('POST /api/v1/visitors/batch-signout error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Batch sign-out failed' },
      { status: 500 },
    );
  }
}
