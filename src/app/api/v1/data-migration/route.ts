/**
 * Data Migration API — List & Create Import/Export/Migration/DSAR Jobs
 * Per PRD 27 — Data Migration
 *
 * GET  /api/v1/data-migration — List migration jobs for property (status filter)
 * POST /api/v1/data-migration — Create import/export/migration/dsar job
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { createMigrationJobUnionSchema, MIGRATION_JOB_STATUSES } from '@/schemas/data-migration';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';
import { nanoid } from 'nanoid';
import type { Role } from '@/types';

const ADMIN_ROLES: Role[] = ['super_admin', 'property_admin', 'property_manager'];

// ---------------------------------------------------------------------------
// GET /api/v1/data-migration — List migration jobs
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request, { roles: ADMIN_ROLES });
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const status = searchParams.get('status');
    const type = searchParams.get('type');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    // Query both ImportJob and DataExportRequest tables based on type filter
    if (type === 'import' || type === 'migration') {
      return await listImportJobs(propertyId, status, type, page, pageSize);
    }

    if (type === 'export' || type === 'dsar') {
      return await listExportJobs(propertyId, status, type, page, pageSize);
    }

    // No type filter — return both combined
    const [importResult, exportResult] = await Promise.all([
      getImportJobs(propertyId, status),
      getExportJobs(propertyId, status),
    ]);

    const combined = [
      ...importResult.map((j) => ({ ...j, jobType: 'import' as const })),
      ...exportResult.map((j) => ({ ...j, jobType: j.type as string })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = combined.length;
    const paged = combined.slice((page - 1) * pageSize, page * pageSize);

    return NextResponse.json({
      data: paged,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    console.error('GET /api/v1/data-migration error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch migration jobs' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/data-migration — Create migration job
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request, { roles: ADMIN_ROLES });
    if (auth.error) return auth.error;

    const body = await request.json();

    // Require propertyId in the body
    const { propertyId, ...rest } = body;
    if (!propertyId || typeof propertyId !== 'string') {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    const parsed = createMigrationJobUnionSchema.safeParse(rest);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'Invalid input',
          fields: parsed.error.flatten().fieldErrors,
        },
        { status: 400 },
      );
    }

    const input = parsed.data;

    switch (input.type) {
      case 'import': {
        const sanitizedFileName = stripControlChars(stripHtml(input.fileName));

        const job = await prisma.importJob.create({
          data: {
            propertyId,
            type: input.dataType,
            fileName: sanitizedFileName,
            status: 'pending',
            mappings: input.mappings || {},
            createdBy: auth.user.userId,
          },
        });

        return NextResponse.json({ data: { ...job, jobType: 'import' } }, { status: 201 });
      }

      case 'export': {
        const job = await prisma.dataExportRequest.create({
          data: {
            userId: auth.user.userId,
            propertyId,
            type: 'property_data',
            status: 'pending',
          },
        });

        return NextResponse.json(
          {
            data: {
              ...job,
              jobType: 'export',
              modules: input.modules,
              format: input.format,
            },
          },
          { status: 201 },
        );
      }

      case 'migration': {
        const sanitizedFileName = stripControlChars(stripHtml(input.fileName));
        const sanitizedPlatform = stripControlChars(stripHtml(input.sourcePlatform));

        const job = await prisma.importJob.create({
          data: {
            propertyId,
            type: `migration_${sanitizedPlatform}`,
            fileName: sanitizedFileName,
            status: 'pending',
            mappings: input.mappings || {},
            createdBy: auth.user.userId,
          },
        });

        return NextResponse.json(
          { data: { ...job, jobType: 'migration', sourcePlatform: sanitizedPlatform } },
          { status: 201 },
        );
      }

      case 'dsar': {
        const job = await prisma.dataExportRequest.create({
          data: {
            userId: input.userId,
            propertyId,
            type: 'personal_data',
            status: 'pending',
          },
        });

        return NextResponse.json({ data: { ...job, jobType: 'dsar' } }, { status: 201 });
      }

      default:
        return NextResponse.json(
          { error: 'VALIDATION_ERROR', message: 'Unknown job type' },
          { status: 400 },
        );
    }
  } catch (error) {
    console.error('POST /api/v1/data-migration error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create migration job' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function getImportJobs(propertyId: string, status: string | null) {
  const where: Record<string, unknown> = { propertyId };
  if (status) where.status = status;
  return prisma.importJob.findMany({ where, orderBy: { createdAt: 'desc' } });
}

async function getExportJobs(propertyId: string, status: string | null) {
  const where: Record<string, unknown> = { propertyId };
  if (status) where.status = status;
  return prisma.dataExportRequest.findMany({ where, orderBy: { createdAt: 'desc' } });
}

async function listImportJobs(
  propertyId: string,
  status: string | null,
  _type: string,
  page: number,
  pageSize: number,
) {
  const where: Record<string, unknown> = { propertyId };
  if (status) where.status = status;

  const [jobs, total] = await Promise.all([
    prisma.importJob.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.importJob.count({ where }),
  ]);

  return NextResponse.json({
    data: jobs.map((j) => ({ ...j, jobType: 'import' })),
    meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
}

async function listExportJobs(
  propertyId: string,
  status: string | null,
  type: string,
  page: number,
  pageSize: number,
) {
  const where: Record<string, unknown> = { propertyId };
  if (status) where.status = status;
  if (type === 'dsar') where.type = 'personal_data';

  const [jobs, total] = await Promise.all([
    prisma.dataExportRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.dataExportRequest.count({ where }),
  ]);

  return NextResponse.json({
    data: jobs.map((j) => ({ ...j, jobType: type })),
    meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
  });
}
