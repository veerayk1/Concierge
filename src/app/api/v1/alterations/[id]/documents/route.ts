/**
 * Alteration Project Documents API — List & Upload
 *
 * Tracks required documents (insurance certificate, permit, floor plan)
 * and optional supplementary documents for alteration projects.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { uploadAlterationDocumentSchema } from '@/schemas/alteration';
import { guardRoute, enforcePropertyAccess } from '@/server/middleware/api-guard';
import { isUuid } from '@/lib/uuid';

// ---------------------------------------------------------------------------
// GET /api/v1/alterations/:id/documents
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // SEC-128: alteration documents (permits, contractor COI, drawings)
    // inherit the parent alteration list's staff+board gate. Residents
    // must not enumerate neighbors' permits or contractor contact info
    // even when the parent project is at the same property.
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
        { error: 'VALIDATION_ERROR', message: 'Invalid alteration id.' },
        { status: 400 },
      );
    }

    // Verify project exists
    const project = await prisma.alterationProject.findUnique({
      where: { id },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Alteration project not found' },
        { status: 404 },
      );
    }

    // Alteration docs include permits and insurance — never leak cross-tenant.
    const tenancy = enforcePropertyAccess(auth.user, project.propertyId);
    if (tenancy) return tenancy;

    const documents = await prisma.alterationDocument.findMany({
      where: { alterationProjectId: id },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data: documents });
  } catch (error) {
    console.error('GET /api/v1/alterations/:id/documents error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch documents' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/alterations/:id/documents
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    if (!isUuid(id)) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Invalid alteration id.' },
        { status: 400 },
      );
    }
    const body = await request.json();

    const parsed = uploadAlterationDocumentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    // Verify project exists
    const project = await prisma.alterationProject.findUnique({
      where: { id },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Alteration project not found' },
        { status: 404 },
      );
    }

    const tenancy = enforcePropertyAccess(auth.user, project.propertyId);
    if (tenancy) return tenancy;

    const input = parsed.data;

    const document = await prisma.alterationDocument.create({
      data: {
        alterationProjectId: id,
        documentType: input.documentType,
        fileName: input.fileName,
        fileUrl: input.fileUrl,
        fileSizeBytes: input.fileSizeBytes,
        contentType: input.contentType,
        uploadedById: auth.user.userId,
      },
    });

    // Update project's lastActivityDate
    await prisma.alterationProject.update({
      where: { id },
      data: { lastActivityDate: new Date() },
    });

    return NextResponse.json({ data: document, message: 'Document uploaded.' }, { status: 201 });
  } catch (error) {
    console.error('POST /api/v1/alterations/:id/documents error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to upload document' },
      { status: 500 },
    );
  }
}
