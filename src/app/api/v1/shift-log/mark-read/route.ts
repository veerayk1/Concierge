/**
 * Shift Log Bulk Read API
 * Per PRD 03 Section 3.1.6
 *
 * POST /api/v1/shift-log/mark-read — Marks entries as read by the current user.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';

const markReadSchema = z.object({
  propertyId: z.string().uuid(),
  entryIds: z.array(z.string().uuid()).min(1, 'At least one entryId is required'),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const body = await request.json();
    const parsed = markReadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { propertyId, entryIds } = parsed.data;
    const userId = auth.user.userId;

    // Fetch all entries that belong to this property
    const entries = await prisma.event.findMany({
      where: {
        id: { in: entryIds },
        propertyId,
        deletedAt: null,
        eventType: { slug: 'shift_log' },
      },
    });

    // Filter to only entries not already read by this user
    let markedCount = 0;
    for (const entry of entries) {
      const cf = (entry.customFields as Record<string, unknown> | null) ?? {};
      const readBy = Array.isArray(cf.readBy) ? (cf.readBy as string[]) : [];

      if (!readBy.includes(userId)) {
        await prisma.event.update({
          where: { id: entry.id },
          data: {
            customFields: {
              ...cf,
              readBy: [...readBy, userId],
            },
          },
        });
        markedCount++;
      }
    }

    return NextResponse.json({
      message: `Marked ${markedCount} entries as read.`,
      markedCount,
    });
  } catch (error) {
    console.error('POST /api/v1/shift-log/mark-read error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to mark entries as read' },
      { status: 500 },
    );
  }
}
