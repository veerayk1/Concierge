/**
 * Vendors API — List & Create
 * Implements BuildingLink's 5-status vendor compliance dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { createVendorSchema } from '@/schemas/vendor';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';
import { calculateComplianceStatus, getExpiringDocumentFilter } from '@/server/vendors/compliance';
import { handleDemoRequest } from '@/server/demo';

// ---------------------------------------------------------------------------
// GET /api/v1/vendors — List vendors with compliance status
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const demoRes = await handleDemoRequest(request);
  if (demoRes) return demoRes;

  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const status = searchParams.get('status');
    const categoryId = searchParams.get('categoryId');
    const search = searchParams.get('search') || '';
    const expiringWithin = searchParams.get('expiringWithin');
    const summary = searchParams.get('summary');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    // Dashboard summary: counts per compliance status
    if (summary === 'compliance') {
      const vendors = await prisma.vendor.findMany({
        where: { propertyId },
        include: { documents: true },
      });

      const counts: Record<string, number> = {
        compliant: 0,
        not_compliant: 0,
        expiring: 0,
        expired: 0,
        not_tracking: 0,
        total: vendors.length,
      };

      for (const vendor of vendors) {
        const computed = calculateComplianceStatus(vendor.documents);
        counts[computed] = (counts[computed] || 0) + 1;
      }

      return NextResponse.json({ data: counts });
    }

    // Build where clause
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: Record<string, any> = { propertyId };

    if (status) where.complianceStatus = status;
    if (categoryId) where.serviceCategoryId = categoryId;
    if (search) {
      where.OR = [
        { companyName: { contains: search, mode: 'insensitive' } },
        { contactName: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Filter vendors with docs expiring within N days
    if (expiringWithin) {
      const days = parseInt(expiringWithin, 10);
      if (!isNaN(days)) {
        Object.assign(where, getExpiringDocumentFilter(days));
      }
    }

    const [vendors, total] = await Promise.all([
      prisma.vendor.findMany({
        where,
        include: {
          serviceCategory: { select: { id: true, name: true } },
          documents: true,
        },
        orderBy: { companyName: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.vendor.count({ where }),
    ]);

    // Compute live compliance status from documents
    const vendorsWithCompliance = vendors.map((vendor) => ({
      ...vendor,
      complianceStatus: calculateComplianceStatus(vendor.documents),
    }));

    return NextResponse.json({
      data: vendorsWithCompliance,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    console.error('GET /api/v1/vendors error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch vendors' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/vendors — Create vendor
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const demoRes = await handleDemoRequest(request);
  if (demoRes) return demoRes;

  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const body = await request.json();
    const parsed = createVendorSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;

    const vendor = await prisma.vendor.create({
      data: {
        propertyId: input.propertyId,
        companyName: stripControlChars(stripHtml(input.companyName)),
        serviceCategoryId: input.serviceCategoryId,
        contactName: input.contactName ? stripControlChars(stripHtml(input.contactName)) : null,
        phone: input.phone || null,
        email: input.email || null,
        streetAddress: input.streetAddress || null,
        city: input.city || null,
        stateProvince: input.stateProvince || null,
        postalCode: input.postalCode || null,
        notes: input.notes ? stripControlChars(stripHtml(input.notes)) : null,
        complianceStatus: 'not_tracking',
        createdById: auth.user.userId,
      },
      include: {
        serviceCategory: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(
      { data: vendor, message: `Vendor ${vendor.companyName} created.` },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/v1/vendors error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create vendor' },
      { status: 500 },
    );
  }
}
