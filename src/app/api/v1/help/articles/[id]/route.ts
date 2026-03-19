/**
 * Help Article Detail API — Get & Update Single Article
 * Per PRD 25 — Help Center & Knowledge Base
 *
 * GET   /api/v1/help/articles/:id — Get single article with full content
 * PATCH /api/v1/help/articles/:id — Update article (admin only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { updateHelpArticleSchema } from '@/schemas/help';
import { guardRoute } from '@/server/middleware/api-guard';
import type { Role } from '@/types';

const ADMIN_ROLES: Role[] = ['super_admin', 'property_admin', 'property_manager'];

type RouteContext = { params: Promise<{ id: string }> };

// ---------------------------------------------------------------------------
// GET /api/v1/help/articles/:id
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await context.params;

    const article = await prisma.helpArticle.findUnique({
      where: { id },
    });

    if (!article) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Help article not found' },
        { status: 404 },
      );
    }

    // Non-admins can only see published articles
    const isAdmin = ADMIN_ROLES.includes(auth.user.role);
    if (!isAdmin && article.status !== 'published') {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Help article not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: article });
  } catch (error) {
    console.error('GET /api/v1/help/articles/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch help article' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/v1/help/articles/:id
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const auth = await guardRoute(request, { roles: ADMIN_ROLES });
    if (auth.error) return auth.error;

    const { id } = await context.params;
    const body = await request.json();
    const parsed = updateHelpArticleSchema.safeParse(body);

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

    const existing = await prisma.helpArticle.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Help article not found' },
        { status: 404 },
      );
    }

    const article = await prisma.helpArticle.update({
      where: { id },
      data: parsed.data,
    });

    return NextResponse.json({ data: article });
  } catch (error) {
    console.error('PATCH /api/v1/help/articles/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update help article' },
      { status: 500 },
    );
  }
}
