/**
 * Vendor Documents API — List & Upload compliance documents
 * Supports: insurance, license, wsib, bond, background_check
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { createVendorDocumentSchema } from '@/schemas/vendor';
import { guardRoute, enforcePropertyAccess } from '@/server/middleware/api-guard';
import { calculateComplianceStatus } from '@/server/vendors/compliance';
import { isUuid } from '@/lib/uuid';

// ---------------------------------------------------------------------------
// GET /api/v1/vendors/:id/documents — List vendor documents
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // SEC-127: vendor documents (COI, license, W-9) inherit the parent
    // vendor list's staff-only gate. Without an explicit role check, a
    // resident_owner returns 200 with empty data today but would leak
    // certificate-of-insurance PDFs the moment any are uploaded.
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

    // Verify vendor exists
    const vendor = await prisma.vendor.findUnique({ where: { id } });
    if (!vendor) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Vendor not found' },
        { status: 404 },
      );
    }

    // Vendor docs are insurance certificates, contracts, WSIB letters.
    // Never let another property's admin read them.
    const tenancy = enforcePropertyAccess(auth.user, vendor.propertyId);
    if (tenancy) return tenancy;

    const documents = await prisma.vendorDocument.findMany({
      where: { vendorId: id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data: documents });
  } catch (error) {
    console.error('GET /api/v1/vendors/:id/documents error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch documents' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/vendors/:id/documents — Upload compliance document
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Uploading insurance/contract documents on a vendor is a procurement
    // action — never a resident.
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

    const parsed = createVendorDocumentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    // Verify vendor exists
    const vendor = await prisma.vendor.findUnique({ where: { id } });
    if (!vendor) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Vendor not found' },
        { status: 404 },
      );
    }

    const tenancy = enforcePropertyAccess(auth.user, vendor.propertyId);
    if (tenancy) return tenancy;

    const input = parsed.data;

    const document = await prisma.vendorDocument.create({
      data: {
        vendorId: id,
        documentType: input.documentType,
        fileName: input.fileName,
        fileUrl: input.fileUrl,
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        uploadedById: auth.user.userId,
      },
    });

    // Recompute and update vendor compliance status
    const allDocs = await prisma.vendorDocument.findMany({
      where: { vendorId: id },
    });
    const newStatus = calculateComplianceStatus(allDocs);
    await prisma.vendor.update({
      where: { id },
      data: { complianceStatus: newStatus },
    });

    return NextResponse.json(
      { data: document, message: `${input.documentType} document uploaded.` },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/v1/vendors/:id/documents error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to upload document' },
      { status: 500 },
    );
  }
}
