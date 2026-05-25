/**
 * Resident-scoped maintenance request detail
 *
 * GET /api/v1/resident/maintenance/[id] — Read one of the caller's own
 * requests. Scoped to the resident's active occupancy unit; returns 404
 * for anything that isn't theirs so we never leak another unit's data.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';

export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await ctx.params;
    if (!id) {
      return NextResponse.json(
        { error: 'MISSING_ID', message: 'Request id required.' },
        { status: 400 },
      );
    }

    // Caller's active unit at their current property. We trust the auth
    // guard's resolved unitId (same path the list endpoint uses) and
    // fall back to an occupancy lookup if auth didn't include one.
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId') ?? auth.user.propertyId;

    let unitId = auth.user.unitId;
    if (!unitId) {
      const occupancy = await prisma.occupancyRecord.findFirst({
        where: {
          userId: auth.user.userId,
          propertyId,
          moveOutDate: null,
        },
        orderBy: { moveInDate: 'desc' },
        select: { unitId: true },
      });
      unitId = occupancy?.unitId;
    }
    if (!unitId) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Request not found.' },
        { status: 404 },
      );
    }

    // Look up the request, joining the small bits the detail page needs
    // (unit number, category name, assigned vendor / employee names) so
    // the client doesn't have to make extra round-trips just to render
    // a human-readable row.
    const rows = await prisma.$queryRaw<Array<Record<string, unknown>>>`
      SELECT m.*,
             u.number AS "unitNumber",
             c.id     AS "categoryRefId",
             c.name   AS "categoryName",
             v.id     AS "vendorRefId",
             v."companyName" AS "vendorName",
             e.id     AS "employeeRefId",
             e."firstName" AS "employeeFirstName",
             e."lastName"  AS "employeeLastName"
      FROM maintenance_requests m
      LEFT JOIN units u ON u.id = m."unitId"
      LEFT JOIN maintenance_categories c ON c.id = m."categoryId"
      LEFT JOIN vendors v ON v.id = m."assignedVendorId"
      LEFT JOIN users e ON e.id = m."assignedEmployeeId"
      WHERE m.id = ${id}::uuid
        AND m."propertyId" = ${propertyId}::uuid
        AND m."unitId" = ${unitId}::uuid
        AND m."deletedAt" IS NULL
      LIMIT 1
    `;
    const row = rows[0];
    if (!row) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Request not found.' },
        { status: 404 },
      );
    }

    // Comments (resident-readable only — anything marked
    // internal/hidden stays inside the staff console).
    const comments = await prisma.$queryRaw<Array<Record<string, unknown>>>`
      SELECT mc.id, mc.comment, mc."isInternal", mc."createdAt",
             u."firstName", u."lastName"
      FROM maintenance_comments mc
      LEFT JOIN users u ON u.id = mc."authorId"
      WHERE mc."requestId" = ${id}::uuid
        AND mc."deletedAt" IS NULL
        AND mc."isInternal" = false
      ORDER BY mc."createdAt" ASC
    `.catch(() => []);

    // Attachments
    const attachments = await prisma.$queryRaw<Array<Record<string, unknown>>>`
      SELECT id, "fileName", "contentType", "fileSizeBytes", "fileUrl",
             "thumbnailUrl", "createdAt"
      FROM maintenance_attachments
      WHERE "requestId" = ${id}::uuid
      ORDER BY "createdAt" ASC
    `.catch(() => []);

    return NextResponse.json({
      data: {
        ...row,
        category: row.categoryRefId ? { id: row.categoryRefId, name: row.categoryName } : null,
        vendor: row.vendorRefId ? { id: row.vendorRefId, name: row.vendorName } : null,
        employee: row.employeeRefId
          ? {
              id: row.employeeRefId,
              firstName: row.employeeFirstName,
              lastName: row.employeeLastName,
            }
          : null,
        comments,
        attachments,
      },
    });
  } catch (error) {
    console.error('GET /api/v1/resident/maintenance/[id] error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to load request.' },
      { status: 500 },
    );
  }
}
