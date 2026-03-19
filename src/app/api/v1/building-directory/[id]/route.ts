/**
 * Building Directory Detail API — Get individual profile
 * Returns staff or vendor profile with photo, bio, schedule, compliance status.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';

// ---------------------------------------------------------------------------
// GET /api/v1/building-directory/:id — Directory entry detail
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;

    const entry = await (prisma as any).directoryEntry.findUnique({
      where: { id },
    });

    if (!entry) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Directory entry not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: entry });
  } catch (error) {
    console.error('GET /api/v1/building-directory/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch directory entry' },
      { status: 500 },
    );
  }
}
