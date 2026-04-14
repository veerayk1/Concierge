/**
 * Library Document Download — GET /api/v1/library/:id/download
 *
 * Returns a presigned download URL for the document file.
 * Increments download count. Requires authentication.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';
import { generatePresignedDownloadUrl } from '@/server/storage';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;

    const file = await prisma.libraryFile.findUnique({
      where: { id },
      select: {
        id: true,
        fileName: true,
        filePath: true,
        mimeType: true,
        propertyId: true,
      },
    });

    if (!file) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Document not found' },
        { status: 404 },
      );
    }

    // Tenant isolation — verify the file belongs to the user's property
    if (file.propertyId !== auth.user.propertyId) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Document not found' },
        { status: 404 },
      );
    }

    // Generate presigned download URL
    const { url } = await generatePresignedDownloadUrl(file.filePath);

    // Increment download count (fire-and-forget)
    void prisma.libraryFile
      .update({
        where: { id },
        data: { downloadCount: { increment: 1 } },
      })
      .catch(() => {});

    return NextResponse.json({
      data: {
        url,
        fileName: file.fileName,
        mimeType: file.mimeType,
      },
    });
  } catch (error) {
    console.error('GET /api/v1/library/:id/download error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to generate download URL' },
      { status: 500 },
    );
  }
}
