/**
 * Compliance Report Detail API — Retrieve archived report by ID
 * Per PRD 28
 */

import { NextRequest, NextResponse } from 'next/server';
import { guardRoute } from '@/server/middleware/api-guard';
import { prisma } from '@/server/db';

// ---------------------------------------------------------------------------
// GET /api/v1/compliance/reports/:id — Retrieve an archived report
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;

    const reportRun = await prisma.reportRun.findUnique({
      where: { id },
      include: {
        report: {
          select: {
            name: true,
            slug: true,
            category: true,
            description: true,
          },
        },
      },
    });

    if (!reportRun) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Report not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      data: reportRun,
    });
  } catch (error) {
    console.error('GET /api/v1/compliance/reports/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to retrieve report' },
      { status: 500 },
    );
  }
}
