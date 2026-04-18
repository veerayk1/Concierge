/**
 * Emergency Broadcast All-Clear API — POST all-clear follow-up
 * Phase 2: Sends all-clear notification to residents after emergency is resolved
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';
import { z } from 'zod';

const allClearSchema = z.object({
  message: z.string().max(2000).optional().default(''),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request, { roles: ['property_admin', 'security_guard'] });
    if (auth.error) return auth.error;

    const { id } = await params;

    // Verify broadcast exists
    const broadcast = await prisma.emergencyBroadcast.findUnique({
      where: { id },
      select: { id: true, propertyId: true, status: true },
    });

    if (!broadcast) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Emergency broadcast not found' },
        { status: 404 },
      );
    }

    if (broadcast.status === 'cancelled') {
      return NextResponse.json(
        {
          error: 'BROADCAST_CANCELLED',
          message: 'Cannot send all-clear for a cancelled broadcast',
        },
        { status: 400 },
      );
    }

    const body = await request.json();

    const parsed = allClearSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    const message = parsed.data.message;

    const updated = await prisma.emergencyBroadcast.update({
      where: { id },
      data: {
        status: 'all_clear',
        allClearAt: new Date(),
        allClearById: auth.user.userId,
        allClearMessage: message,
      },
    });

    return NextResponse.json({
      data: updated,
      message: 'All-clear sent.',
    });
  } catch {
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to send all-clear' },
      { status: 500 },
    );
  }
}
