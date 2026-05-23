/**
 * Compliance Report Detail API — Retrieve archived report by ID
 * Per PRD 28
 */

import { NextRequest, NextResponse } from 'next/server';
import { guardRoute, enforcePropertyAccess } from '@/server/middleware/api-guard';
import { prisma } from '@/server/db';
import { isUuid } from '@/lib/uuid';

// ---------------------------------------------------------------------------
// GET /api/v1/compliance/reports/:id — Retrieve an archived report
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    if (!isUuid(id)) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Invalid compliance report id.' },
        { status: 400 },
      );
    }

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

    // Compliance reports contain regulatory evidence (PIPEDA, GDPR, SOC2).
    // Never expose another property's reports cross-tenant.
    const tenancy = enforcePropertyAccess(auth.user, reportRun.propertyId);
    if (tenancy) return tenancy;

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
