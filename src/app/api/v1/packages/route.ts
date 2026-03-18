/**
 * Package Management API — List & Create Packages
 * Per PRD 04 Sections 3.1.1 (Intake) and 3.1.4 (Listing)
 *
 * GET  /api/v1/packages — List packages with filters
 * POST /api/v1/packages — Create single package
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { createPackageSchema } from '@/schemas/package';
import { nanoid } from 'nanoid';
import { guardRoute } from '@/server/middleware/api-guard';

// ---------------------------------------------------------------------------
// GET /api/v1/packages
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const courierId = searchParams.get('courierId');
    const unitId = searchParams.get('unitId');
    const perishable = searchParams.get('perishable');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    const where: Record<string, unknown> = {
      propertyId,
      deletedAt: null,
    };

    if (status) where.status = status;
    if (courierId) where.courierId = courierId;
    if (unitId) where.unitId = unitId;
    if (perishable === 'true') where.isPerishable = true;

    if (search) {
      where.OR = [
        { referenceNumber: { contains: search, mode: 'insensitive' } },
        { trackingNumber: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [packages, total] = await Promise.all([
      prisma.package.findMany({
        where,
        include: {
          unit: { select: { id: true, number: true } },
          courier: { select: { id: true, name: true, icon: true, color: true } },
          storageSpot: { select: { id: true, name: true, code: true } },
          parcelCategory: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.package.count({ where }),
    ]);

    return NextResponse.json({
      data: packages,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('GET /api/v1/packages error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch packages' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/packages — Create single package
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const body = await request.json();
    const parsed = createPackageSchema.safeParse(body);

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

    // Generate reference number per PRD 04: PKG-XXXXXX
    const referenceNumber = `PKG-${nanoid(6).toUpperCase()}`;

    const pkg = await prisma.package.create({
      data: {
        propertyId: input.propertyId,
        unitId: input.unitId,
        residentId: input.residentId || null,
        direction: input.direction,
        referenceNumber,
        courierId: input.courierId || null,
        courierOtherName: input.courierOtherName || null,
        trackingNumber: input.trackingNumber || null,
        parcelCategoryId: input.parcelCategoryId || null,
        description: input.description || null,
        storageSpotId: input.storageSpotId || null,
        isPerishable: input.isPerishable,
        isOversized: input.isOversized,
        notifyChannel: input.notifyChannel,
        createdById: 'demo-user', // TODO: Get from auth context
        status: 'unreleased',
      },
      include: {
        unit: { select: { id: true, number: true } },
        courier: { select: { id: true, name: true } },
      },
    });

    // TODO: Send notification to resident based on notifyChannel
    // TODO: Log to PackageHistory

    return NextResponse.json(
      {
        data: pkg,
        message: `Package ${referenceNumber} logged for unit ${pkg.unit?.number}.`,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/v1/packages error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create package' },
      { status: 500 },
    );
  }
}
