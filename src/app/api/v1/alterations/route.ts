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
    const type = searchParams.get('type');
    const momentum = searchParams.get('momentum');
    const unitId = searchParams.get('unitId');
    const residentId = searchParams.get('residentId');
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = { propertyId, deletedAt: null };
    if (status) where.status = status;
    if (type) where.type = type;
    if (unitId) where.unitId = unitId;
    if (residentId) where.createdById = residentId;
    if (search) {
      where.OR = [
        { referenceNumber: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { contractorName: { contains: search, mode: 'insensitive' } },
      ];
    }

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

    // Filter by momentum if requested (post-query since momentum is computed)
    const filtered = momentum ? enriched.filter((p) => p.momentum === momentum) : enriched;

    return NextResponse.json({
      data: filtered,
      meta: {
        page,
        pageSize,
        total: momentum ? filtered.length : total,
        totalPages: Math.ceil((momentum ? filtered.length : total) / pageSize),
      },
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

    // Map dialog field names to schema field names
    // Dialog sends: unit (unit number), unitId (if UUID)
    // Schema expects: unitId (UUID)
    let mapped: Record<string, unknown> = {
      ...body,
    };

    // If dialog sent unit as string (unit number), resolve to UUID
    if (body.unit && !body.unitId) {
      const unit = await prisma.unit.findFirst({
        where: {
          propertyId: body.propertyId,
          number: body.unit,
        },
      });
      if (unit) {
        mapped.unitId = unit.id;
      } else {
        return NextResponse.json(
          { error: 'VALIDATION_ERROR', fields: { unit: ['Unit not found'] } },
          { status: 400 },
        );
      }
    } else if (body.unitId) {
      mapped.unitId = body.unitId;
    }

    const parsed = createAlterationSchema.safeParse(mapped);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;
    const referenceNumber = `ALT-${nanoid(6).toUpperCase()}`;
    const now = new Date();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const project = await (prisma.alterationProject.create as any)({
      data: {
        propertyId: input.propertyId,
        unitId: input.unitId,
        description: stripControlChars(stripHtml(input.description)),
        type: input.type || 'renovation',
        scope: input.scope ? stripControlChars(stripHtml(input.scope)) : null,
        expectedStartDate: new Date(input.expectedStartDate),
        expectedEndDate: new Date(input.expectedEndDate),
        contractorVendorId: input.contractorVendorId || null,
        contractorName: input.contractorName
          ? stripControlChars(stripHtml(input.contractorName))
          : null,
        contractorPhone: input.contractorPhone || null,
        contractorEmail: input.contractorEmail || null,
        hasPermit: input.hasPermit ?? false,
        permitNumber: input.permitNumber ? stripControlChars(stripHtml(input.permitNumber)) : null,
        hasInsurance: input.hasInsurance ?? false,
        notes: input.notes ? stripControlChars(stripHtml(input.notes)) : null,
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
      {
        data: { ...project, momentum: 'ok' },
        message: `Alteration project ${referenceNumber} created.`,
      },
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
