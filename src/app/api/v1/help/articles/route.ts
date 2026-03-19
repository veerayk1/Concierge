/**
 * Help Articles API — List & Create Articles
 * Per PRD 25 — Help Center & Knowledge Base
 *
 * GET  /api/v1/help/articles — List articles (published only for non-admin)
 * POST /api/v1/help/articles — Create article (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { createHelpArticleSchema } from '@/schemas/help';
import { guardRoute } from '@/server/middleware/api-guard';
import type { Role } from '@/types';

const ADMIN_ROLES: Role[] = ['super_admin', 'property_admin', 'property_manager'];

// ---------------------------------------------------------------------------
// GET /api/v1/help/articles
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);

    const isAdmin = ADMIN_ROLES.includes(auth.user.role);

    const where: Record<string, unknown> = {};

    // Non-admins only see published articles
    if (!isAdmin) {
      where.status = 'published';
    }

    if (category) where.category = category;

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { body: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [articles, total] = await Promise.all([
      prisma.helpArticle.findMany({
        where,
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.helpArticle.count({ where }),
    ]);

    return NextResponse.json({
      data: articles,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('GET /api/v1/help/articles error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch help articles' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/help/articles
// ---------------------------------------------------------------------------

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request, { roles: ADMIN_ROLES });
    if (auth.error) return auth.error;

    const body = await request.json();
    const parsed = createHelpArticleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'Invalid input',
          fields: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const input = parsed.data;
    const slug = slugify(input.title);

    const article = await prisma.helpArticle.create({
      data: {
        title: input.title,
        slug,
        body: input.body,
        category: input.category,
        tags: input.tags,
        sortOrder: input.sortOrder,
        contextPages: input.contextPages,
        roleVisibility: input.roleVisibility,
        locale: input.locale,
        status: input.status,
        authorId: auth.user.userId,
      },
    });

    return NextResponse.json({ data: article }, { status: 201 });
  } catch (error) {
    console.error('POST /api/v1/help/articles error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create help article' },
      { status: 500 },
    );
  }
}
