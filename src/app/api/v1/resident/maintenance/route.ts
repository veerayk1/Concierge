/**
 * Resident Self-Service — Maintenance Requests
 *
 * GET  /api/v1/resident/maintenance — List own maintenance requests
 * POST /api/v1/resident/maintenance — Create request for own unit only
 *
 * The unitId is always derived from the auth context — residents cannot
 * specify a different unit, preventing cross-unit data access.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';
import type { Role } from '@/types';

const RESIDENT_ROLES: Role[] = ['resident_owner', 'resident_tenant'];

const residentMaintenanceSchema = z.object({
  description: z.string().min(10, 'Description must be at least 10 characters').max(4000),
  categoryId: z.string().uuid().optional().or(z.literal('')),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  permissionToEnter: z.boolean().default(false),
  entryInstructions: z.string().max(1000).optional().or(z.literal('')),
  contactPhone: z.string().max(20).optional().or(z.literal('')),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request, { roles: RESIDENT_ROLES });
    if (auth.error) return auth.error;

    const { propertyId, unitId } = auth.user;

    if (!unitId) {
      return NextResponse.json(
        { error: 'NO_UNIT', message: 'No unit associated with your account.' },
        { status: 400 },
      );
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    // Use raw SQL — MaintenanceRequest model may not exist in stale generated client
    let requests: unknown[] = [];
    let total = 0;

    try {
      const offset = (page - 1) * pageSize;

      const countResult = await prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*)::bigint as count FROM maintenance_requests m
        WHERE m."propertyId" = ${propertyId}::uuid
          AND m."unitId" = ${unitId}::uuid
          AND m."deletedAt" IS NULL
      `;
      total = Number(countResult[0]?.count || 0);

      requests = await prisma.$queryRaw`
        SELECT m.*, u.number as "unitNumber"
        FROM maintenance_requests m
        LEFT JOIN units u ON u.id = m."unitId"
        WHERE m."propertyId" = ${propertyId}::uuid
          AND m."unitId" = ${unitId}::uuid
          AND m."deletedAt" IS NULL
        ORDER BY m."createdAt" DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `;
    } catch {
      // Table may not exist or columns differ — return empty
      requests = [];
      total = 0;
    }

    return NextResponse.json({
      data: requests,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    console.error('GET /api/v1/resident/maintenance error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch requests' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request, { roles: RESIDENT_ROLES });
    if (auth.error) return auth.error;

    const { userId, propertyId, unitId } = auth.user;

    if (!unitId) {
      return NextResponse.json(
        { error: 'NO_UNIT', message: 'No unit associated with your account.' },
        { status: 400 },
      );
    }

    const body = await request.json();
    const parsed = residentMaintenanceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;
    const referenceNumber = `MR-${nanoid(4).toUpperCase()}`;

    // Resolve categoryId — required field, so fall back to first active category
    let categoryId = input.categoryId && input.categoryId !== '' ? input.categoryId : null;
    if (!categoryId) {
      try {
        const defaultCat = await prisma.maintenanceCategory.findFirst({
          where: { propertyId, isActive: true },
          orderBy: { sortOrder: 'asc' },
          select: { id: true },
        });
        categoryId = defaultCat?.id ?? null;
      } catch {
        // Table may not exist — continue with null
      }
    }

    // Use raw SQL for reliability (Prisma client may be stale)
    const id = crypto.randomUUID();
    const title = stripControlChars(stripHtml(input.description)).substring(0, 200);
    const description = stripControlChars(stripHtml(input.description));
    const permissionToEnter = input.permissionToEnter ? 'yes' : 'no';
    const entryInstructions = input.entryInstructions
      ? stripControlChars(stripHtml(input.entryInstructions))
      : null;

    await prisma.$executeRaw`
      INSERT INTO maintenance_requests (
        id, "propertyId", "unitId", "residentId", "categoryId",
        title, description, status, priority,
        "permissionToEnter", "entryInstructions",
        "referenceNumber", source, "createdAt", "updatedAt"
      ) VALUES (
        ${id}::uuid, ${propertyId}::uuid, ${unitId}::uuid, ${userId}::uuid,
        ${categoryId ? categoryId : null}::uuid,
        ${title}, ${description}, 'open', ${input.priority},
        ${permissionToEnter}, ${entryInstructions},
        ${referenceNumber}, 'resident', NOW(), NOW()
      )
    `;

    // Fetch the created record
    const rows = await prisma.$queryRaw<unknown[]>`
      SELECT m.*, u.number as "unitNumber"
      FROM maintenance_requests m
      LEFT JOIN units u ON u.id = m."unitId"
      WHERE m.id = ${id}::uuid
    `;
    const maintenanceReq = rows[0] || { id, referenceNumber, status: 'open' };

    return NextResponse.json(
      { data: maintenanceReq, message: `Request ${referenceNumber} created.` },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/v1/resident/maintenance error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create request' },
      { status: 500 },
    );
  }
}
