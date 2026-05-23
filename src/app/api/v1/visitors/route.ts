/**
 * Visitor Management API — per PRD 03 Section Visitor Management
 * Sign in, sign out, list active visitors
 *
 * GET  /api/v1/visitors — List visitors with filters
 * POST /api/v1/visitors — Sign in a new visitor
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute, enforcePropertyAccess } from '@/server/middleware/api-guard';
import { requireModule } from '@/server/middleware/module-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';
import { sendEmail, getUnitResidentEmails } from '@/server/email';
import { renderTemplate } from '@/server/email-templates';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const signInVisitorSchema = z.object({
  propertyId: z.string().uuid(),
  visitorName: z.string().min(1, 'Visitor name is required').max(200),
  visitorType: z
    .enum([
      'visitor',
      'contractor',
      'delivery_person',
      'real_estate_agent',
      'emergency_service',
      'other',
    ])
    .default('visitor'),
  unitId: z.string().uuid('Select a unit'),
  expectedDepartureAt: z.string().datetime().optional(),
  comments: z.string().max(500).optional().or(z.literal('')),
  parkingPermit: z
    .object({
      licensePlate: z.string().min(1).max(20),
      vehicleMakeModel: z.string().min(1).max(100),
      provinceState: z.string().min(1).max(50),
      vehicleColor: z.string().max(30).optional(),
      parkingArea: z.string().max(100).optional(),
      permitEnd: z.string().datetime().optional(),
    })
    .optional(),
  notifyResident: z.boolean().default(true),
  // Legacy fields kept for backward compatibility
  purpose: z.enum(['personal', 'delivery', 'service', 'realtor', 'other']).optional(),
  vehiclePlate: z.string().max(20).optional().or(z.literal('')),
  idType: z.string().max(50).optional(),
  idVerified: z.boolean().default(false),
  parkingAssigned: z.boolean().default(false),
  notes: z.string().max(500).optional().or(z.literal('')),
});

// ---------------------------------------------------------------------------
// GET /api/v1/visitors — List with filtering
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  // Skip demo handler — uses the real database for consistent GET/POST
  try {
    // Building-wide visitor log is staff-only. Residents have a separate
    // resident-scoped endpoint; if they query this one they get the whole
    // building's guests, which is a privacy leak. Lock it down at the API
    // layer so the page-level role gate isn't the only line of defense.
    const auth = await guardRoute(request, {
      roles: [
        'super_admin',
        'property_admin',
        'property_manager',
        'front_desk',
        'security_guard',
        'security_supervisor',
        'superintendent',
      ],
    });
    if (auth.error) return auth.error;

    const moduleCheck = await requireModule(request, 'visitor_management');
    if (moduleCheck) return moduleCheck;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const status = searchParams.get('status') || 'active';
    const visitorType = searchParams.get('visitorType');
    const unitId = searchParams.get('unitId');
    const search = searchParams.get('search') || '';
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
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
    };

    // Status filter: signed_in = no departureAt, signed_out = has departureAt
    // "active" is an alias for "signed_in" for backward compatibility
    if (status === 'active' || status === 'signed_in') {
      where.departureAt = null;
    } else if (status === 'signed_out') {
      where.departureAt = { not: null };
    }
    // status === 'all' -> no departureAt filter

    if (visitorType) {
      where.visitorType = visitorType;
    }

    if (unitId) {
      where.unitId = unitId;
    }

    // Date range filter on arrivalAt — validate so `dateFrom=not-a-date`
    // returns a clean 400 instead of crashing Prisma with an Invalid Date.
    if (dateFrom || dateTo) {
      const arrivalFilter: Record<string, Date> = {};
      if (dateFrom) {
        const d = new Date(dateFrom);
        if (Number.isNaN(d.getTime())) {
          return NextResponse.json(
            { error: 'VALIDATION_ERROR', message: 'dateFrom must be a valid date.' },
            { status: 400 },
          );
        }
        arrivalFilter.gte = d;
      }
      if (dateTo) {
        const d = new Date(dateTo);
        if (Number.isNaN(d.getTime())) {
          return NextResponse.json(
            { error: 'VALIDATION_ERROR', message: 'dateTo must be a valid date.' },
            { status: 400 },
          );
        }
        arrivalFilter.lte = d;
      }
      where.arrivalAt = arrivalFilter;
    }

    if (search) {
      where.OR = [
        { visitorName: { contains: search, mode: 'insensitive' } },
        { comments: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [visitors, total] = await Promise.all([
      prisma.visitorEntry.findMany({
        where,
        include: {
          unit: { select: { id: true, number: true } },
        },
        orderBy: { arrivalAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.visitorEntry.count({ where }),
    ]);

    return NextResponse.json({
      data: visitors,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    console.error('GET /api/v1/visitors error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch visitors' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/visitors — Sign in a new visitor
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  // Skip demo handler — uses the real database for consistent GET/POST
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const moduleCheck = await requireModule(request, 'visitor_management');
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
    const parsed = signInVisitorSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;

    // Tenancy: verify both propertyId and unitId belong to the caller's
    // property, and that the unit lives in the same property. Without these
    // checks staff at Property A could sign in a visitor with unitId
    // pointing at a Property B unit — the record would be saved with
    // propertyId=A but a foreign unitId, breaking notifications and audit
    // trails for both properties.
    const tenancyA = enforcePropertyAccess(auth.user, input.propertyId);
    if (tenancyA) return tenancyA;

    const unit = await prisma.unit.findUnique({
      where: { id: input.unitId },
      select: { propertyId: true },
    });
    if (!unit || unit.propertyId !== input.propertyId) {
      return NextResponse.json(
        {
          error: 'INVALID_UNIT',
          message: 'Unit does not belong to this property.',
        },
        { status: 400 },
      );
    }

    // Resolve visitorType: prefer new field, fall back to legacy purpose mapping
    const resolvedVisitorType =
      input.visitorType !== 'visitor'
        ? input.visitorType
        : input.purpose
          ? {
              personal: 'visitor',
              delivery: 'delivery_person',
              service: 'contractor',
              realtor: 'real_estate_agent',
              other: 'other',
            }[input.purpose] || 'visitor'
          : 'visitor';

    // Build comments from structured fields
    const commentParts: string[] = [];
    const legacyPlate = input.vehiclePlate || input.parkingPermit?.licensePlate;
    if (legacyPlate) commentParts.push(`Vehicle: ${legacyPlate}`);
    if (input.idType)
      commentParts.push(`ID: ${input.idType}${input.idVerified ? ' (verified)' : ''}`);
    if (input.notes) commentParts.push(input.notes);
    if (input.comments) commentParts.push(input.comments);

    const commentsText =
      commentParts.length > 0 ? stripControlChars(stripHtml(commentParts.join('. '))) : null;

    const visitor = await prisma.visitorEntry.create({
      data: {
        propertyId: input.propertyId,
        visitorName: stripControlChars(stripHtml(input.visitorName)),
        visitorType: resolvedVisitorType,
        unitId: input.unitId,
        arrivalAt: new Date(),
        expectedDepartureAt: input.expectedDepartureAt ? new Date(input.expectedDepartureAt) : null,
        notifyResident: input.notifyResident,
        comments: commentsText,
      },
      include: {
        unit: { select: { id: true, number: true } },
      },
    });

    // Create parking permit if provided
    if (input.parkingPermit) {
      const now = new Date();
      const defaultEnd = input.expectedDepartureAt
        ? new Date(input.expectedDepartureAt)
        : new Date(now.getTime() + 24 * 60 * 60 * 1000); // default 24h

      await prisma.visitorParkingPermit.create({
        data: {
          visitorEntryId: visitor.id,
          propertyId: input.propertyId,
          licensePlate: stripControlChars(stripHtml(input.parkingPermit.licensePlate)),
          vehicleMakeModel: stripControlChars(stripHtml(input.parkingPermit.vehicleMakeModel)),
          provinceState: stripControlChars(stripHtml(input.parkingPermit.provinceState)),
          vehicleColor: input.parkingPermit.vehicleColor
            ? stripControlChars(stripHtml(input.parkingPermit.vehicleColor))
            : null,
          parkingArea: input.parkingPermit.parkingArea
            ? stripControlChars(stripHtml(input.parkingPermit.parkingArea))
            : null,
          permitStart: now,
          permitEnd: input.parkingPermit.permitEnd
            ? new Date(input.parkingPermit.permitEnd)
            : defaultEnd,
          status: 'active',
        },
      });
    }

    // Notify unit residents about the visitor (fire-and-forget)
    if (input.notifyResident) {
      void getUnitResidentEmails(input.unitId)
        .then((residents) => {
          for (const resident of residents) {
            void sendEmail({
              to: resident.email,
              subject: `Visitor arrived: ${input.visitorName}`,
              html: renderTemplate('visitor_checkin', {
                residentName: resident.firstName,
                visitorName: input.visitorName,
                visitorType: resolvedVisitorType.replace(/_/g, ' '),
                unitNumber: visitor.unit?.number ?? '',
                arrivalTime: new Date().toLocaleString('en-CA', { timeZone: 'America/Toronto' }),
              }),
            }).catch((err) => console.error('Failed to send visitor checkin email:', err));
          }
        })
        .catch((err) =>
          console.error('Failed to look up unit residents for visitor notification:', err),
        );
    }

    return NextResponse.json(
      {
        data: visitor,
        message: `${input.visitorName} signed in for Unit ${visitor.unit?.number}.`,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/v1/visitors error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to sign in visitor' },
      { status: 500 },
    );
  }
}
