/**
 * Import Status API — GET /api/v1/data-migration/import/:id/status
 *
 * Per PRD 27: Returns current progress and status of an import job.
 * Includes processed/success/error counts and per-row error details.
 *
 * @module app/api/v1/data-migration/import/[id]/status/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { guardRoute } from '@/server/middleware/api-guard';
import { getImportJobStatus } from '@/server/data-migration';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request, {
      roles: ['super_admin', 'property_admin', 'property_manager'],
    });
    if (auth.error) return auth.error;

    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Import job ID is required' },
        { status: 400 },
      );
    }

    const job = getImportJobStatus(id);

    if (!job) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: `Import job "${id}" not found` },
        { status: 404 },
      );
    }

    const progress = job.totalRows > 0 ? Math.round((job.processedRows / job.totalRows) * 100) : 0;

    return NextResponse.json({
      data: {
        id: job.id,
        status: job.status,
        entityType: job.entityType,
        fileName: job.fileName,
        progress,
        totalRows: job.totalRows,
        processedRows: job.processedRows,
        successRows: job.successRows,
        errorRows: job.errorRows,
        errors: job.errors.slice(0, 50), // Limit errors in response
        duplicateStrategy: job.duplicateStrategy,
        createdAt: job.createdAt.toISOString(),
        completedAt: job.completedAt?.toISOString() ?? null,
      },
    });
  } catch (error) {
    console.error('GET /api/v1/data-migration/import/:id/status error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to retrieve import status' },
      { status: 500 },
    );
  }
}
