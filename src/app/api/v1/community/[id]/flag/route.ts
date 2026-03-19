/**
 * Flag Classified Ad — POST /api/v1/community/:id/flag
 * Allows residents to flag inappropriate ads for admin review.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';

const flagSchema = z.object({
  reason: z.enum(['spam', 'inappropriate', 'scam', 'prohibited_item', 'other']),
  description: z.string().max(1000).optional(),
});

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id: adId } = await params;

    // Check ad exists
    const ad = await prisma.classifiedAd.findUnique({ where: { id: adId } });
    if (!ad) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Ad not found' }, { status: 404 });
    }

    const body = await request.json();
    const parsed = flagSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const flag = await (prisma as any).classifiedAdFlag.create({
      data: {
        adId,
        userId: auth.user.userId,
        reason: input.reason,
        description: input.description ? stripControlChars(stripHtml(input.description)) : null,
      },
    });

    return NextResponse.json({ data: flag, message: 'Ad flagged for review.' }, { status: 201 });
  } catch (error) {
    console.error('POST /api/v1/community/:id/flag error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to flag ad' },
      { status: 500 },
    );
  }
}
