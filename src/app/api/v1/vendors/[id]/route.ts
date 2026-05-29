/**
 * Vendor Detail API — Get & Update
 * Includes compliance status computation from documents
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { updateVendorSchema } from '@/schemas/vendor';
import { guardRoute, enforcePropertyAccess } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';
import { calculateComplianceStatus } from '@/server/vendors/compliance';
import { isUuid } from '@/lib/uuid';

// ---------------------------------------------------------------------------
// GET /api/v1/vendors/:id — Vendor detail with documents
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // SEC-123: vendor record leaks insurance docs, contact info, contracts. Verified leak: resident_owner returned full vendor + documents + compliance.
    const auth = await guardRoute(request, {
      roles: [
        'super_admin',
        'property_admin',
        'property_manager',
        'front_desk',
        'security_supervisor',
        'superintendent',
        'maintenance_staff',
        'board_member',
      ],
    });
    if (auth.error) return auth.error;

    const { id } = await params;
    if (!isUuid(id)) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Invalid vendor id.' },
        { status: 400 },
      );
    }

    const vendor = await prisma.vendor.findUnique({
      where: { id },
      include: {
        serviceCategory: { select: { id: true, name: true } },
        documents: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!vendor) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Vendor not found' },
        { status: 404 },
      );
    }

    // Vendor detail includes insurance/contract documents — never leak
    // across properties.
    const tenancy = enforcePropertyAccess(auth.user, vendor.propertyId);
    if (tenancy) return tenancy;

    // Compute live compliance status
    const complianceStatus = calculateComplianceStatus(vendor.documents);

    return NextResponse.json({
      data: { ...vendor, complianceStatus },
    });
  } catch (error) {
    console.error('GET /api/v1/vendors/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch vendor' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/v1/vendors/:id — Update vendor details / deactivate
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Mutating vendor records (deactivation, contract terms, insurance
    // metadata) is procurement, not resident self-service.
    const auth = await guardRoute(request, {
      roles: [
        'super_admin',
        'property_admin',
        'property_manager',
        'superintendent',
        'maintenance_staff',
        'board_member',
      ],
    });
    if (auth.error) return auth.error;

    const { id } = await params;
    if (!isUuid(id)) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Invalid vendor id.' },
        { status: 400 },
      );
    }
    const body = await request.json();

    const parsed = updateVendorSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;

    // Verify vendor exists
    const existing = await prisma.vendor.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Vendor not found' },
        { status: 404 },
      );
    }

    const tenancy = enforcePropertyAccess(auth.user, existing.propertyId);
    if (tenancy) return tenancy;

    const updateData: Record<string, unknown> = {};

    if (input.companyName !== undefined)
      updateData.companyName = stripControlChars(stripHtml(input.companyName));
    if (input.serviceCategoryId !== undefined)
      updateData.serviceCategoryId = input.serviceCategoryId;
    if (input.contactName !== undefined)
      updateData.contactName = input.contactName
        ? stripControlChars(stripHtml(input.contactName))
        : null;
    if (input.phone !== undefined) updateData.phone = input.phone;
    if (input.email !== undefined) updateData.email = input.email;
    if (input.streetAddress !== undefined) updateData.streetAddress = input.streetAddress;
    if (input.city !== undefined) updateData.city = input.city;
    if (input.stateProvince !== undefined) updateData.stateProvince = input.stateProvince;
    if (input.postalCode !== undefined) updateData.postalCode = input.postalCode;
    if (input.notes !== undefined)
      updateData.notes = input.notes ? stripControlChars(stripHtml(input.notes)) : null;
    if (input.isActive !== undefined) updateData.isActive = input.isActive;

    const vendor = await prisma.vendor.update({
      where: { id },
      data: updateData,
      include: {
        serviceCategory: { select: { id: true, name: true } },
        documents: true,
      },
    });

    // Recompute compliance after update
    const complianceStatus = calculateComplianceStatus(vendor.documents);

    return NextResponse.json({
      data: { ...vendor, complianceStatus },
      message:
        input.isActive === false
          ? `Vendor ${vendor.companyName} deactivated.`
          : `Vendor ${vendor.companyName} updated.`,
    });
  } catch (error) {
    console.error('PATCH /api/v1/vendors/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update vendor' },
      { status: 500 },
    );
  }
}
