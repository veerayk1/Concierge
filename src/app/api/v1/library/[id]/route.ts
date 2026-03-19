/**
 * Library Document Detail — GET, PATCH, DELETE /api/v1/library/:id
 * Per PRD research (all 3 platforms — Document Library)
 *
 * GET    — Fetch document details, increment downloadCount
 * PATCH  — Update document metadata (admin/manager only)
 * DELETE — Soft-delete document (admin/manager only)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';
import type { Role } from '@/types';

const ADMIN_ROLES: Role[] = ['super_admin', 'property_admin', 'property_manager'];

const updateDocumentSchema = z.object({
  fileName: z.string().min(1).max(255).optional(),
  description: z.string().max(500).optional(),
  folderId: z.string().uuid().optional(),
});

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const file = await (prisma.libraryFile.findUnique as any)({
      where: { id },
      include: {
        folder: { select: { id: true, name: true, description: true, propertyId: true } },
        versions: {
          orderBy: { versionNumber: 'desc' },
          take: 10,
          select: {
            id: true,
            versionNumber: true,
            filePath: true,
            fileSize: true,
            uploadedById: true,
            createdAt: true,
          },
        },
      },
    });

    if (!file) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Document not found' },
        { status: 404 },
      );
    }

    // Increment downloadCount asynchronously (fire-and-forget)
    void prisma.libraryFile
      .update({
        where: { id },
        data: { downloadCount: { increment: 1 } },
      })
      .catch(() => {
        /* silently ignore download count increment failures */
      });

    // Serialize BigInt fields for JSON
    const serialized = {
      ...file,
      fileSize: Number(file.fileSize),
      versions: file.versions.map((v: { fileSize: bigint; [key: string]: unknown }) => ({
        ...v,
        fileSize: Number(v.fileSize),
      })),
    };

    return NextResponse.json({ data: serialized });
  } catch (error) {
    console.error('GET /api/v1/library/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch document' },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request, {
      roles: ['super_admin', 'property_admin', 'property_manager'],
    });
    if (auth.error) return auth.error;

    const { id } = await params;
    const body = await request.json();
    const parsed = updateDocumentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const file = await prisma.libraryFile.findUnique({ where: { id } });
    if (!file) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Document not found' },
        { status: 404 },
      );
    }

    const input = parsed.data;

    // If moving to a new folder, verify the folder exists and belongs to the same property
    if (input.folderId) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const targetFolder = await (prisma.libraryFolder.findUnique as any)({
        where: { id: input.folderId },
      });
      if (
        !targetFolder ||
        (targetFolder as { propertyId: string }).propertyId !==
          (file as { propertyId: string }).propertyId
      ) {
        return NextResponse.json(
          {
            error: 'NOT_FOUND',
            message: 'Target folder not found or belongs to different property',
          },
          { status: 404 },
        );
      }
    }

    // Build update data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateData: Record<string, any> = {};
    if (input.fileName !== undefined)
      updateData.fileName = stripControlChars(stripHtml(input.fileName));
    if (input.description !== undefined)
      updateData.description = input.description
        ? stripControlChars(stripHtml(input.description))
        : null;
    if (input.folderId !== undefined) updateData.folderId = input.folderId;

    const updated = await prisma.libraryFile.update({
      where: { id },
      data: updateData,
    });

    // Serialize BigInt for JSON response
    const serialized = {
      ...updated,
      fileSize: Number((updated as { fileSize: bigint }).fileSize),
    };

    return NextResponse.json({ data: serialized });
  } catch (error) {
    console.error('PATCH /api/v1/library/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update document' },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await guardRoute(request, {
      roles: ['super_admin', 'property_admin', 'property_manager'],
    });
    if (auth.error) return auth.error;

    const { id } = await params;

    const file = await prisma.libraryFile.findUnique({ where: { id } });
    if (!file) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Document not found' },
        { status: 404 },
      );
    }

    // Soft delete: remove from DB but keep the actual file in storage
    // In production, a background job would clean up orphaned files
    await prisma.libraryFile.delete({ where: { id } });

    return NextResponse.json({ message: 'Document deleted.' });
  } catch (error) {
    console.error('DELETE /api/v1/library/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to delete document' },
      { status: 500 },
    );
  }
}
