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
import { guardRoute, enforcePropertyAccess } from '@/server/middleware/api-guard';
import { requireModule } from '@/server/middleware/module-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';
import { sendEmail, getUnitResidentEmails } from '@/server/email';
import { renderTemplate } from '@/server/email-templates';

// ---------------------------------------------------------------------------
// GET /api/v1/packages
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  // Skip demo handler — uses the real database for consistent GET/POST

  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const moduleCheck = await requireModule(request, 'packages');
    if (moduleCheck) return moduleCheck;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const direction = searchParams.get('direction');
    const courierId = searchParams.get('courierId');
    const unitId = searchParams.get('unitId');
    const perishable = searchParams.get('perishable');
    const _rawPage = parseInt(searchParams.get('page') || '1', 10);
    const _rawPageSize = parseInt(searchParams.get('pageSize') || '50', 10);
    const page = Number.isFinite(_rawPage) && _rawPage > 0 ? _rawPage : 1;
    const pageSize =
      Number.isFinite(_rawPageSize) && _rawPageSize > 0 ? Math.min(_rawPageSize, 200) : 50;

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }
    const _tenancy = enforcePropertyAccess(auth.user, propertyId);
    if (_tenancy) return _tenancy;

    const where: Record<string, unknown> = {
      propertyId,
      deletedAt: null,
    };

    if (status) where.status = status;
    if (direction === 'incoming' || direction === 'outgoing') where.direction = direction;
    if (courierId) where.courierId = courierId;
    if (unitId) where.unitId = unitId;
    if (perishable === 'true') where.isPerishable = true;

    // Build AND-combinable filter clauses so search + per-resident
    // scoping don't clobber each other on the .OR key.
    const andClauses: Array<Record<string, unknown>> = [];
    if (search) {
      andClauses.push({
        OR: [
          { referenceNumber: { contains: search, mode: 'insensitive' } },
          { trackingNumber: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } },
        ],
      });
    }

    // SEC-133: per-resident scoping. Without this, a resident at the
    // property could enumerate every neighbor's incoming packages —
    // recipient names, courier patterns, delivery timing. That data
    // reveals who's home (Amazon Fresh = home for groceries), shopping
    // habits, and high-value deliveries (designer brand return labels).
    // It's also a stalking signal. Staff (front desk intake) sees all;
    // non-staff sees only packages where they are the recipient
    // (residentId) OR packages addressed to units they occupy.
    const STAFF_ROLES = new Set<string>([
      'super_admin',
      'property_admin',
      'property_manager',
      'front_desk',
      'security_supervisor',
      'security_guard',
      'superintendent',
      'maintenance_staff',
      'board_member',
    ]);
    if (!STAFF_ROLES.has(auth.user.role)) {
      const myUnits = await prisma.occupancyRecord.findMany({
        where: { userId: auth.user.userId, moveOutDate: null },
        select: { unitId: true },
      });
      const myUnitIds = myUnits.map((u) => u.unitId);
      andClauses.push({
        OR: [{ residentId: auth.user.userId }, { unitId: { in: myUnitIds } }],
      });
    }

    if (andClauses.length > 0) {
      where.AND = andClauses;
    }

    const [packages, total] = await Promise.all([
      prisma.package.findMany({
        where,
        include: {
          unit: {
            select: {
              id: true,
              number: true,
              // Primary occupant first so the client can show a Recipient name
              // even when releasedToName is empty (i.e. unreleased packages).
              occupancyRecords: {
                where: { moveOutDate: null },
                select: {
                  isPrimary: true,
                  user: { select: { firstName: true, lastName: true } },
                },
                orderBy: [{ isPrimary: 'desc' }, { moveInDate: 'asc' }],
                take: 1,
              },
            },
          },
          courier: { select: { id: true, name: true, iconUrl: true, color: true } },
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
  // Skip demo handler — uses the real database for consistent GET/POST

  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const moduleCheck = await requireModule(request, 'packages');
    if (moduleCheck) return moduleCheck;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'INVALID_BODY', message: 'Request body must be valid JSON.' },
        { status: 400 },
      );
    }
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

    // Tenancy enforcement on the body's propertyId
    const bodyTenancy = enforcePropertyAccess(auth.user, input.propertyId);
    if (bodyTenancy) return bodyTenancy;

    // Verify the unitId actually belongs to the declared propertyId — otherwise
    // a logged-in user could POST with their own propertyId but a unitId from
    // another property and silently write into that tenant's data.
    const unit = await prisma.unit.findUnique({
      where: { id: input.unitId },
      select: { propertyId: true },
    });
    if (!unit || unit.propertyId !== input.propertyId) {
      return NextResponse.json(
        {
          error: 'UNIT_NOT_FOUND',
          message: 'Unit does not exist in this property.',
        },
        { status: 400 },
      );
    }

    // residentId spoofing guard. Same pattern as bookings (SEC-075). Without
    // this, Resident A could POST a fake "Amazon" package naming Resident B
    // as the recipient. Staff (front desk intake) legitimately log packages
    // on behalf of any resident; residents may only self-attribute.
    const STAFF_ROLES = new Set<string>([
      'super_admin',
      'property_admin',
      'property_manager',
      'front_desk',
      'security_supervisor',
      'security_guard',
      'superintendent',
    ]);
    const requestedResidentId = input.residentId ?? null;
    if (
      requestedResidentId &&
      requestedResidentId !== auth.user.userId &&
      !STAFF_ROLES.has(auth.user.role)
    ) {
      return NextResponse.json(
        {
          error: 'FORBIDDEN',
          message: 'Only staff can log packages on behalf of another resident.',
        },
        { status: 403 },
      );
    }

    // Generate reference number per PRD 04: PKG-XXXXXX
    const referenceNumber = `PKG-${nanoid(6).toUpperCase()}`;

    const pkg = await prisma.package.create({
      data: {
        propertyId: input.propertyId,
        unitId: input.unitId,
        residentId: requestedResidentId,
        direction: input.direction,
        referenceNumber,
        courierId: input.courierId || null,
        courierOtherName: input.courierOtherName || null,
        trackingNumber: input.trackingNumber || null,
        parcelCategoryId: input.parcelCategoryId || null,
        description: input.description ? stripControlChars(stripHtml(input.description)) : null,
        storageSpotId: input.storageSpotId || null,
        isPerishable: input.isPerishable,
        isOversized: input.isOversized,
        notifyChannel: input.notifyChannel,
        createdById: auth.user.userId, // From authenticated user
        status: 'unreleased',
      },
      include: {
        unit: { select: { id: true, number: true } },
        courier: { select: { id: true, name: true } },
      },
    });

    // Notify unit residents about the new package (fire-and-forget)
    void getUnitResidentEmails(input.unitId)
      .then((residents) => {
        for (const resident of residents) {
          void sendEmail({
            to: resident.email,
            subject: `Package ${referenceNumber} received`,
            html: renderTemplate('package_received', {
              residentName: resident.firstName,
              packageRef: referenceNumber,
              unitNumber: pkg.unit?.number ?? '',
            }),
          }).catch((err) => console.error('Failed to send package email:', err));
        }
      })
      .catch((err) =>
        console.error('Failed to look up unit residents for package notification:', err),
      );

    // Log to PackageHistory
    try {
      const actor = await prisma.user.findUnique({
        where: { id: auth.user.userId },
        select: { firstName: true, lastName: true },
      });
      const actorName = actor ? `${actor.firstName} ${actor.lastName}`.trim() : 'System';

      await prisma.packageHistory.create({
        data: {
          packageId: pkg.id,
          action: 'received',
          details: `Package ${referenceNumber} logged for unit ${pkg.unit?.number ?? 'unknown'}`,
          actorId: auth.user.userId,
          actorName,
        },
      });
    } catch {
      // Non-critical — don't fail package creation if history write fails
    }

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
