/**
 * Forum API — Discussion Forum (threaded resident discussions)
 * Per CLAUDE.md nice-to-have #10 (inspired by Condo Control)
 *
 * GET  /api/v1/forum — List topics with pagination, search, category filter
 * POST /api/v1/forum — Create a new discussion topic
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';

const FORUM_CATEGORIES = [
  'general',
  'maintenance',
  'amenities',
  'safety',
  'social',
  'suggestions',
] as const;

const createTopicSchema = z.object({
  propertyId: z.string().uuid(),
  title: z.string().min(3).max(200),
  body: z.string().min(10).max(10000),
  category: z.enum(FORUM_CATEGORIES).default('general'),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const pinned = searchParams.get('pinned');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = Math.min(parseInt(searchParams.get('pageSize') || '20', 10), 100);

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = {
      propertyId,
      status: status || 'active',
    };

    if (category) {
      if (!FORUM_CATEGORIES.includes(category as (typeof FORUM_CATEGORIES)[number])) {
        return NextResponse.json(
          {
            error: 'INVALID_CATEGORY',
            message: `Invalid category. Must be one of: ${FORUM_CATEGORIES.join(', ')}`,
          },
          { status: 400 },
        );
      }
      where.categoryId = category;
    }

    if (pinned === 'true') where.isPinned = true;
    if (pinned === 'false') where.isPinned = false;

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { body: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [topics, total] = await Promise.all([
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (prisma.forumTopic.findMany as any)({
        where,
        orderBy: [{ isPinned: 'desc' }, { lastActivityAt: 'desc' }],
        take: pageSize,
        skip: (page - 1) * pageSize,
        select: {
          id: true,
          propertyId: true,
          userId: true,
          categoryId: true,
          title: true,
          body: true,
          isPinned: true,
          isLocked: true,
          status: true,
          replyCount: true,
          viewCount: true,
          lastActivityAt: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.forumTopic.count({ where } as Parameters<typeof prisma.forumTopic.count>[0]),
    ]);

    return NextResponse.json({
      data: topics,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('GET /api/v1/forum error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch topics' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const body = await request.json();
    const parsed = createTopicSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const topic = await (prisma.forumTopic.create as any)({
      data: {
        propertyId: input.propertyId,
        title: stripControlChars(stripHtml(input.title)),
        body: stripControlChars(stripHtml(input.body)),
        categoryId: input.category,
        userId: auth.user.userId,
        status: 'active',
        replyCount: 0,
        viewCount: 0,
        isPinned: false,
        isLocked: false,
        lastActivityAt: new Date(),
      },
    });

    return NextResponse.json({ data: topic, message: 'Topic created.' }, { status: 201 });
  } catch (error) {
    console.error('POST /api/v1/forum error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create topic' },
      { status: 500 },
    );
  }
}
