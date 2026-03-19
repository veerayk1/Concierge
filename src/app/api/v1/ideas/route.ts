/**
 * Ideas API — per Condo Control research (Idea Board)
 * Crowdsourced feature requests from residents
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';

const createIdeaSchema = z.object({
  propertyId: z.string().uuid(),
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(2000),
  category: z.string().max(100).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const sort = searchParams.get('sort') || 'newest'; // newest, popular
    const category = searchParams.get('category');

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = { propertyId, deletedAt: null };
    if (category) where.category = category;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ideas = await (prisma.idea.findMany as any)({
      where,
      include: {
        author: { select: { id: true, firstName: true, lastName: true } },
        votes: { select: { id: true, userId: true } },
      },
      orderBy: sort === 'popular' ? { voteCount: 'desc' } : { createdAt: 'desc' },
    });

    return NextResponse.json({ data: ideas });
  } catch (error) {
    console.error('GET /api/v1/ideas error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch ideas' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const body = await request.json();
    const parsed = createIdeaSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const idea = await (prisma.idea.create as any)({
      data: {
        propertyId: input.propertyId,
        title: stripControlChars(stripHtml(input.title)),
        description: stripControlChars(stripHtml(input.description)),
        category: input.category || null,
        userId: auth.user.userId,
        status: 'submitted',
        voteCount: 0,
      },
    });

    return NextResponse.json({ data: idea, message: 'Idea posted.' }, { status: 201 });
  } catch (error) {
    console.error('POST /api/v1/ideas error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to post idea' },
      { status: 500 },
    );
  }
}
