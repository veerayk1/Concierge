/**
 * Vacation Period API — Away Tracking
 * Per GAP 7.1 — Vacation/away period tracking for security and operations awareness
 *
 * GET    /api/v1/vacations — List vacation periods (filter by userId, active-only)
 * POST   /api/v1/vacations — Create vacation period
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';

// ---------------------------------------------------------------------------
// GET /api/v1/vacations
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    const offset = (page - 1) * pageSize;

    const vacations = await prisma.$queryRaw<any[]>`
      SELECT vp.*,
        u."firstName", u."lastName",
        un.number as "unitNumber"
      FROM vacation_periods vp
      LEFT JOIN users u ON u.id = vp."userId"
      LEFT JOIN units un ON un.id = vp."unitId"
      WHERE vp."propertyId" = ${propertyId}::uuid
      ORDER BY vp."startDate" DESC
      LIMIT ${pageSize} OFFSET ${offset}
    `;

    const countResult = await prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(*) as count FROM vacation_periods
      WHERE "propertyId" = ${propertyId}::uuid
    `;

    const total = Number(countResult[0]?.count || 0);

    // Transform to match the expected shape for the frontend
    const data = vacations.map((v) => ({
      id: v.id,
      propertyId: v.propertyId,
      userId: v.userId,
      unitId: v.unitId,
      startDate: v.startDate,
      endDate: v.endDate,
      notes: v.notes,
      holdPackages: v.holdMail ?? false,
      pauseNotifications: v.pauseNotifications ?? false,
      status: v.status || 'upcoming',
      createdAt: v.createdAt,
      resident: {
        firstName: v.firstName || '',
        lastName: v.lastName || '',
        unit: { number: v.unitNumber || '—' },
      },
    }));

    return NextResponse.json({
      data,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('GET /api/v1/vacations error:', error);
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: 'Failed to fetch vacation periods',
        detail: String(error),
      },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/vacations — Create vacation period
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const body = await request.json();
    const { propertyId, userId, startDate, endDate, notes, holdMail, pauseNotifications } = body;
    let { unitId } = body;

    if (!propertyId || !userId || !startDate || !endDate) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'propertyId, userId, startDate, and endDate are required',
        },
        { status: 400 },
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start >= end) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'startDate must be before endDate',
        },
        { status: 400 },
      );
    }

    // Check if user is creating for themselves or if they're admin
    const isAdmin = ['property_admin', 'property_manager', 'super_admin'].includes(auth.user.role);
    const isOwnRecord = auth.user.userId === userId;

    if (!isAdmin && !isOwnRecord) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Can only create vacation periods for yourself' },
        { status: 403 },
      );
    }

    // Verify user exists
    const userResult = await prisma.$queryRaw<any[]>`
      SELECT id, "firstName", "lastName" FROM users
      WHERE id = ${userId}::uuid AND "deletedAt" IS NULL
      LIMIT 1
    `;

    if (!userResult || userResult.length === 0) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'User not found' }, { status: 404 });
    }

    const user = userResult[0];

    // If unitId not provided, try to look up the user's unit
    if (!unitId) {
      try {
        const unitResult = await prisma.$queryRaw<any[]>`
          SELECT "unitId" FROM users
          WHERE id = ${userId}::uuid AND "unitId" IS NOT NULL
          LIMIT 1
        `;
        unitId = unitResult?.[0]?.unitId || null;
      } catch {
        // Best-effort unit lookup — unitId column may not exist on users table
      }
    }

    const sanitizedNotes = notes ? stripControlChars(stripHtml(notes)) : null;

    const result = await prisma.$queryRaw<any[]>`
      INSERT INTO vacation_periods (
        id, "propertyId", "userId", "unitId", "startDate", "endDate",
        notes, "holdMail", "pauseNotifications", "createdAt", "updatedAt"
      ) VALUES (
        gen_random_uuid(),
        ${propertyId}::uuid,
        ${userId}::uuid,
        ${unitId ? unitId : null}::uuid,
        ${start}::date,
        ${end}::date,
        ${sanitizedNotes},
        ${!!holdMail},
        ${!!pauseNotifications},
        NOW(),
        NOW()
      )
      RETURNING *
    `;

    return NextResponse.json(
      {
        data: result[0],
        message: `Vacation period created for ${user.firstName} ${user.lastName}.`,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/v1/vacations error:', error);
    return NextResponse.json(
      {
        error: 'INTERNAL_ERROR',
        message: 'Failed to create vacation period',
        detail: String(error),
      },
      { status: 500 },
    );
  }
}
