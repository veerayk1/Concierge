/**
 * Vendor Documents API — List & Upload compliance documents
 * Supports: insurance, license, wsib, bond, background_check
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { createVendorDocumentSchema } from '@/schemas/vendor';
import { guardRoute } from '@/server/middleware/api-guard';
import { calculateComplianceStatus } from '@/server/vendors/compliance';

// ---------------------------------------------------------------------------
// GET /api/v1/vendors/:id/documents — List vendor documents
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;

    // Verify vendor exists
    const vendor = await prisma.vendor.findUnique({ where: { id } });
    if (!vendor) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Vendor not found' },
        { status: 404 },
      );
    }

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
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;
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
