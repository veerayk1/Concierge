/**
 * Ideas API — Idea Board (crowdsourced feature requests from residents)
 * Per CLAUDE.md nice-to-have #9 (inspired by Condo Control)
 *
 * GET  /api/v1/ideas — List ideas with pagination, search, category/status filter, sort
 * POST /api/v1/ideas — Create a new idea
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';

const IDEA_CATEGORIES = [
  'amenities',
  'maintenance',
  'security',
  'community',
  'communication',
  'technology',
  'other',
] as const;

const createIdeaSchema = z.object({
  propertyId: z.string().uuid(),
  title: z.string().min(5).max(200),
  description: z.string().min(10).max(5000),
  category: z.enum(IDEA_CATEGORIES).default('other'),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const sortBy = searchParams.get('sortBy') || 'newest'; // 'votes' | 'newest'
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '20', 10), 100);

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = { propertyId, deletedAt: null };
    if (category) {
      if (!IDEA_CATEGORIES.includes(category as (typeof IDEA_CATEGORIES)[number])) {
        return NextResponse.json(
          {
            error: 'INVALID_CATEGORY',
            message: `Invalid category. Must be one of: ${IDEA_CATEGORIES.join(', ')}`,
          },
          { status: 400 },
        );
      }
      where.category = category;
    }
    if (status) where.status = status;

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orderBy: any = sortBy === 'votes' ? { voteCount: 'desc' } : { createdAt: 'desc' };

    const [ideas, total] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prisma.idea.findMany as any)({
        where,
        include: {
          votes: { select: { id: true, userId: true } },
        },
        orderBy,
        take: pageSize,
        skip: (page - 1) * pageSize,
      }),
      prisma.idea.count({ where } as Parameters<typeof prisma.idea.count>[0]),
    ]);

    // Attach commentCount for each idea
    const ideaIds = ideas.map((i: { id: string }) => i.id);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const commentCounts = await (prisma as any).ideaComment.groupBy({
      by: ['ideaId'],
      where: { ideaId: { in: ideaIds } },
      _count: { id: true },
    });
    const commentCountMap = new Map<string, number>();
    for (const cc of commentCounts) {
      commentCountMap.set(cc.ideaId, cc._count.id);
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const enriched = ideas.map((idea: any) => ({
      ...idea,
      commentCount: commentCountMap.get(idea.id) || 0,
    }));

    return NextResponse.json({
      data: enriched,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
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
        category: input.category,
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
