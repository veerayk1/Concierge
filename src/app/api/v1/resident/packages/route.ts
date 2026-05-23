/**
 * Resident Self-Service — Packages (read-only)
 *
 * GET /api/v1/resident/packages — List packages for the resident's unit only.
 * Residents can view their packages but cannot create or modify them
 * (package intake is a front-desk operation per PRD 04).
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';
import type { Role } from '@/types';

const RESIDENT_ROLES: Role[] = ['resident_owner', 'resident_tenant'];

export async function GET(request: NextRequest) {
  // Skip demo handler — uses the real database for consistent GET/POST

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

    // Use raw SQL to query packages — the Package model may not exist in the stale generated Prisma client
    let packages: unknown[] = [];
    let total = 0;

    try {
      const offset = (page - 1) * pageSize;
      const statusFilter = status ? `AND p.status = '${status.replace(/'/g, "''")}'` : '';

      const countResult = await prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*)::bigint as count FROM packages p
        WHERE p."propertyId" = ${propertyId}::uuid
          AND p."unitId" = ${unitId}::uuid
          AND p."deletedAt" IS NULL
      `;
      total = Number(countResult[0]?.count || 0);

      const rows = await prisma.$queryRaw<Record<string, unknown>[]>`
        SELECT
          p.*,
          u.number AS "unitNumber",
          c.id AS "courier__id",
          c.name AS "courier__name",
          c.slug AS "courier__slug",
          c.color AS "courier__color",
          c."iconUrl" AS "courier__iconUrl"
        FROM packages p
        LEFT JOIN units u ON u.id = p."unitId"
        LEFT JOIN courier_types c ON c.id = p."courierId"
        WHERE p."propertyId" = ${propertyId}::uuid
          AND p."unitId" = ${unitId}::uuid
          AND p."deletedAt" IS NULL
        ORDER BY p."createdAt" DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `;
      // Promote the flattened courier__* columns into a nested object so the
      // resident page can render row.courier.name like the staff page does.
      packages = rows.map((row) => {
        const courier = row.courier__id
          ? {
              id: row.courier__id,
              name: row.courier__name,
              slug: row.courier__slug,
              color: row.courier__color,
              iconUrl: row.courier__iconUrl,
            }
          : null;
        const out: Record<string, unknown> = { ...row, courier };
        delete out.courier__id;
        delete out.courier__name;
        delete out.courier__slug;
        delete out.courier__color;
        delete out.courier__iconUrl;
        return out;
      });
    } catch {
      // packages table may not exist — return empty
      packages = [];
      total = 0;
    }

    return NextResponse.json({
      data: packages,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('GET /api/v1/resident/packages error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch packages' },
      { status: 500 },
    );
  }
}
