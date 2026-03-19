/**
 * Alteration/Renovation Projects API — List & Create
 *
 * Tracks unit renovation projects with permit/insurance compliance,
 * momentum indicators (OK/Slow/Stalled/Stopped), and multi-step review.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { createAlterationSchema, calculateMomentum } from '@/schemas/alteration';
import { nanoid } from 'nanoid';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';

// ---------------------------------------------------------------------------
// GET /api/v1/alterations
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const status = searchParams.get('status');
    const unitId = searchParams.get('unitId');
    const residentId = searchParams.get('residentId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    const where: Record<string, unknown> = { propertyId, deletedAt: null };
    if (status) where.status = status;
    if (unitId) where.unitId = unitId;
    if (residentId) where.createdById = residentId;

    const [projects, total] = await Promise.all([
      prisma.alterationProject.findMany({
        where,
        include: {
          unit: { select: { id: true, number: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.alterationProject.count({ where }),
    ]);

    // Enrich with momentum indicator
    const enriched = projects.map((project: Record<string, unknown>) => ({
      ...project,
      momentum: project.lastActivityDate
        ? calculateMomentum(project.lastActivityDate as Date)
        : 'stopped',
    }));

    return NextResponse.json({
      data: enriched,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    console.error('GET /api/v1/alterations error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch alteration projects' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/alterations
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const body = await request.json();
    const parsed = createAlterationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;
    const referenceNumber = `ALT-${nanoid(4).toUpperCase()}`;
    const now = new Date();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const project = await (prisma.alterationProject.create as any)({
      data: {
        propertyId: input.propertyId,
        unitId: input.unitId,
        description: stripControlChars(stripHtml(input.description)),
        scope: input.scope ? stripControlChars(stripHtml(input.scope)) : null,
        expectedStartDate: new Date(input.expectedStartDate),
        expectedEndDate: new Date(input.expectedEndDate),
        contractorVendorId: input.contractorVendorId || null,
        referenceNumber,
        status: 'submitted',
        createdById: auth.user.userId,
        lastActivityDate: now,
      },
      include: {
        unit: { select: { id: true, number: true } },
      },
    });

    return NextResponse.json(
      { data: project, message: `Alteration project ${referenceNumber} created.` },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/v1/alterations error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create alteration project' },
      { status: 500 },
    );
  }
}
