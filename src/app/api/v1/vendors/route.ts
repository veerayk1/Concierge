/**
 * Vendors API — List & Create
 * Implements BuildingLink's 5-status vendor compliance dashboard
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';
import { calculateComplianceStatus, getExpiringDocumentFilter } from '@/server/vendors/compliance';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// GET /api/v1/vendors — List vendors with compliance status
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  // Skip demo handler — vendors uses the real database for consistent GET/POST
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

// Flexible schema that accepts BOTH the dialog's field names and the strict schema
const flexibleCreateVendorSchema = z.object({
  propertyId: z.string().uuid(),
  companyName: z.string().min(1, 'Company name is required').max(200),
  // Accept either serviceCategoryId (UUID) OR category (string name)
  serviceCategoryId: z.string().uuid().optional(),
  category: z.string().max(100).optional(),
  contactName: z.string().max(200).optional().or(z.literal('')),
  phone: z.string().max(50).optional().or(z.literal('')),
  email: z.string().email().max(200).optional().or(z.literal('')),
  // Accept either split address fields or single address field
  streetAddress: z.string().max(300).optional().or(z.literal('')),
  city: z.string().max(100).optional().or(z.literal('')),
  stateProvince: z.string().max(100).optional().or(z.literal('')),
  postalCode: z.string().max(20).optional().or(z.literal('')),
  address: z.string().max(500).optional().or(z.literal('')),
  // Insurance fields from dialog — stored as VendorDocuments
  licenseNumber: z.string().max(100).optional().or(z.literal('')),
  insuranceProvider: z.string().max(200).optional().or(z.literal('')),
  insurancePolicyNumber: z.string().max(100).optional().or(z.literal('')),
  insuranceExpiry: z.string().optional().or(z.literal('')),
  notes: z.string().max(2000).optional().or(z.literal('')),
});

export async function POST(request: NextRequest) {
  // Skip demo handler — vendors uses the real database for consistent GET/POST
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const body = await request.json();
    const parsed = flexibleCreateVendorSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;
    const resolvedPropertyId = input.propertyId || auth.user.propertyId;

    // Resolve serviceCategoryId: use provided UUID, or look up / create from category name
    let serviceCategoryId = input.serviceCategoryId;
    if (!serviceCategoryId && input.category) {
      // Try to find existing category by name
      let cat = await prisma.vendorServiceCategory.findFirst({
        where: {
          propertyId: resolvedPropertyId,
          name: { equals: input.category, mode: 'insensitive' },
        },
      });
      if (!cat) {
        // Auto-create the category
        cat = await prisma.vendorServiceCategory.create({
          data: {
            propertyId: resolvedPropertyId,
            name: input.category.charAt(0).toUpperCase() + input.category.slice(1),
          },
        });
      }
      serviceCategoryId = cat.id;
    }

    if (!serviceCategoryId) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Category or serviceCategoryId is required' },
        { status: 400 },
      );
    }

    // Handle address: use split fields if provided, otherwise parse single address field
    const streetAddress = input.streetAddress || input.address || null;

    // Resolve a real createdById — demo mode user may not exist in the DB
    let createdById = auth.user.userId;
    try {
      const realUser = await prisma.user.findFirst({
        where: { userProperties: { some: { propertyId: resolvedPropertyId } } },
        select: { id: true },
        orderBy: { createdAt: 'asc' },
      });
      if (realUser) createdById = realUser.id;
    } catch {
      // Ignore — use auth userId
    }

    const vendor = await prisma.vendor.create({
      data: {
        propertyId: resolvedPropertyId,
        companyName: stripControlChars(stripHtml(input.companyName)),
        serviceCategoryId,
        contactName: input.contactName ? stripControlChars(stripHtml(input.contactName)) : null,
        phone: input.phone || null,
        email: input.email || null,
        streetAddress: streetAddress ? stripControlChars(stripHtml(streetAddress)) : null,
        city: input.city || null,
        stateProvince: input.stateProvince || null,
        postalCode: input.postalCode || null,
        notes: input.notes ? stripControlChars(stripHtml(input.notes)) : null,
        complianceStatus: 'not_tracking',
        createdById,
      },
      include: {
        serviceCategory: { select: { id: true, name: true } },
      },
    });

    // If insurance info provided, create a VendorDocument for it
    if (input.insuranceProvider || input.insurancePolicyNumber) {
      try {
        await prisma.vendorDocument.create({
          data: {
            vendorId: vendor.id,
            documentType: 'insurance',
            fileName: `Insurance - ${input.insuranceProvider || 'Policy'}`,
            fileUrl: `policy://${input.insurancePolicyNumber || 'pending'}`,
            expiresAt: input.insuranceExpiry ? new Date(input.insuranceExpiry) : null,
            uploadedById: createdById,
          },
        });
      } catch {
        // Non-critical — vendor was still created
      }
    }

    // If license number provided, create a VendorDocument for it
    if (input.licenseNumber) {
      try {
        await prisma.vendorDocument.create({
          data: {
            vendorId: vendor.id,
            documentType: 'license',
            fileName: `License - ${input.licenseNumber}`,
            fileUrl: `license://${input.licenseNumber}`,
            expiresAt: null,
            uploadedById: createdById,
          },
        });
      } catch {
        // Non-critical — vendor was still created
      }
    }

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
