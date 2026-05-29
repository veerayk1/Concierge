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
    // Restrict to staff who actually do front-desk work, and pin the update
    // to the caller's property so a user on Property A can't pass visitor
    // ids from Property B and sign them all out.
    const auth = await guardRoute(request, {
      roles: [
        'super_admin',
        'property_admin',
        'property_manager',
        'front_desk',
        'security_guard',
        'security_supervisor',
      ],
    });
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

    const where: {
      id: { in: string[] };
      departureAt: null;
      propertyId?: string;
    } = {
      id: { in: visitorIds },
      departureAt: null,
    };
    // Super_admin can act platform-wide (e.g. cron sweep); everyone else is
    // pinned to their own property.
    if (auth.user.role !== 'super_admin' && auth.user.propertyId) {
      where.propertyId = auth.user.propertyId;
    }

    const result = await prisma.visitorEntry.updateMany({
      where,
      data: {
        departureAt: new Date(),
        signedOutById: auth.user.userId,
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
