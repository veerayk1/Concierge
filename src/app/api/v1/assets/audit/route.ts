/**
 * Asset Audit API — Physical inventory audits
 * Compare physical inventory counts against system records to detect discrepancies.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { assetAuditSchema } from '@/schemas/asset';
import { guardRoute } from '@/server/middleware/api-guard';

// ---------------------------------------------------------------------------
// GET /api/v1/assets/audit — List audit history
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    const audits = await (prisma as any).assetAudit.findMany({
      where: { propertyId },
      orderBy: { auditDate: 'desc' },
    });

    return NextResponse.json({ data: audits });
  } catch (error) {
    console.error('GET /api/v1/assets/audit error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch audits' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/assets/audit — Create audit with findings
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const body = await request.json();
    const parsed = assetAuditSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;

    // Calculate summary statistics
    const total = input.findings.length;
    const found = input.findings.filter((f) => f.found).length;
    const missing = total - found;
    const discrepancyRate = total > 0 ? Math.round((missing / total) * 100) : 0;

    const audit = await (prisma as any).assetAudit.create({
      data: {
        propertyId: input.propertyId,
        auditDate: new Date(input.auditDate),
        conductedById: input.conductedById,
        findings: input.findings,
        summary: { total, found, missing, discrepancyRate },
        createdById: auth.user.userId,
      },
    });

    return NextResponse.json(
      {
        data: {
          ...audit,
          summary: { total, found, missing, discrepancyRate },
        },
        message: `Audit completed: ${found}/${total} assets found.`,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/v1/assets/audit error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create audit' },
      { status: 500 },
    );
  }
}
