/**
 * Contextual Help API — Returns articles relevant to a specific page
 * Per PRD 25 — In-App Contextual Help
 *
 * GET /api/v1/help/contextual?page=packages — Returns articles tagged for that page
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';

// ---------------------------------------------------------------------------
// GET /api/v1/help/contextual
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const page = searchParams.get('page');

    if (!page) {
      return NextResponse.json(
        { error: 'MISSING_PARAM', message: 'page query parameter is required' },
        { status: 400 },
      );
    }

    const articles = await prisma.helpArticle.findMany({
      where: {
        contextPages: { has: page },
        status: 'published',
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });

    return NextResponse.json({ data: articles });
  } catch (error) {
    console.error('GET /api/v1/help/contextual error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch contextual help' },
      { status: 500 },
    );
  }
}
