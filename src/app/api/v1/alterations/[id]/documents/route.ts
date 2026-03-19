/**
 * Alteration Project Documents API — List & Upload
 *
 * Tracks required documents (insurance certificate, permit, floor plan)
 * and optional supplementary documents for alteration projects.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { uploadAlterationDocumentSchema } from '@/schemas/alteration';
import { guardRoute } from '@/server/middleware/api-guard';

// ---------------------------------------------------------------------------
// GET /api/v1/alterations/:id/documents
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;

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
