/**
 * Demo Templates API — List available demo templates
 * Per PRD 21 — Sales demo + training sandbox system
 *
 * Returns the catalog of available demo templates (luxury_condo,
 * suburban_townhouse, high_rise) that can be used to create new
 * demo environments.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';

/**
 * GET /api/v1/demo/templates — List available demo templates
 *
 * Returns all active templates with their data specifications.
 * Accessible to all authenticated users (needed for template selection UI).
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const templates = await prisma.demoTemplate.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ data: templates });
  } catch (error) {
    console.error('GET /api/v1/demo/templates error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch demo templates' },
      { status: 500 },
    );
  }
}
