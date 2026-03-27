/**
 * Fire Log API — Safety-Critical Incident Tracking
 * Per GAP 3.1 — Fire log specialized checklist
 *
 * GET  /api/v1/security/fire-log — List fire log entries with date filtering
 * POST /api/v1/security/fire-log — Create a fire log entry with all specialized fields
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';

// ---------------------------------------------------------------------------
// GET /api/v1/security/fire-log
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request, {
      roles: ['security_guard', 'front_desk', 'property_admin', 'property_manager', 'super_admin'],
    });
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    // Use raw query since Prisma client may not have this model generated yet
    const offset = (page - 1) * pageSize;
    let logs: any[];
    let countResult: any[];

    if (startDate && endDate) {
      logs = await prisma.$queryRaw`
        SELECT * FROM fire_logs
        WHERE "propertyId" = ${propertyId}::uuid
          AND "deletedAt" IS NULL
          AND "createdAt" >= ${new Date(startDate)}
          AND "createdAt" <= ${new Date(endDate)}
        ORDER BY "createdAt" DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `;
      countResult = await prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*) as count FROM fire_logs
        WHERE "propertyId" = ${propertyId}::uuid
          AND "deletedAt" IS NULL
          AND "createdAt" >= ${new Date(startDate)}
          AND "createdAt" <= ${new Date(endDate)}
      `;
    } else {
      logs = await prisma.$queryRaw`
        SELECT * FROM fire_logs
        WHERE "propertyId" = ${propertyId}::uuid
          AND "deletedAt" IS NULL
        ORDER BY "createdAt" DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `;
      countResult = await prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(*) as count FROM fire_logs
        WHERE "propertyId" = ${propertyId}::uuid AND "deletedAt" IS NULL
      `;
    }

    const total = Number(countResult[0]?.count || 0);

    return NextResponse.json({
      data: logs,
      meta: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    });
  } catch (error) {
    console.error('GET /api/v1/security/fire-log error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch fire logs' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/security/fire-log — Create fire log entry
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request, {
      roles: ['security_guard', 'front_desk', 'property_admin', 'property_manager', 'super_admin'],
    });
    if (auth.error) return auth.error;

    const body = await request.json();
    const {
      propertyId,
      alarmTime,
      alarmLocation,
      alarmType,
      fireDeptCallTime,
      firstAnnouncementTime,
      secondAnnouncementTime,
      thirdAnnouncementTime,
      fireDeptArrivalTime,
      fireDeptAllClearTime,
      fireDeptDepartureTime,
      prepareForFdArrival,
      ensureElevatorsReset,
      resetDevices,
      additionalNotes,
    } = body;

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    if (!alarmTime || !alarmLocation || !alarmType) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'alarmTime, alarmLocation, and alarmType are required',
        },
        { status: 400 },
      );
    }

    const sanitizedLocation = stripControlChars(stripHtml(alarmLocation));
    const sanitizedType = stripControlChars(stripHtml(alarmType));
    const sanitizedNotes = additionalNotes ? stripControlChars(stripHtml(additionalNotes)) : null;

    // Use raw SQL to insert since Prisma client may not have this model generated
    const result = await prisma.$queryRaw<any[]>`
      INSERT INTO fire_logs (
        id, "propertyId", "alarmTime", "alarmLocation", "alarmType",
        "fireDeptCallTime", "firstAnnouncementTime", "secondAnnouncementTime", "thirdAnnouncementTime",
        "fireDeptArrivalTime", "fireDeptAllClearTime", "fireDeptDepartureTime",
        "prepareForFdArrival", "ensureElevatorsReset", "resetDevices",
        "additionalNotes", "createdById", "createdAt", "updatedAt"
      ) VALUES (
        gen_random_uuid(),
        ${propertyId}::uuid,
        ${new Date(alarmTime)},
        ${sanitizedLocation},
        ${sanitizedType},
        ${fireDeptCallTime ? new Date(fireDeptCallTime) : null},
        ${firstAnnouncementTime ? new Date(firstAnnouncementTime) : null},
        ${secondAnnouncementTime ? new Date(secondAnnouncementTime) : null},
        ${thirdAnnouncementTime ? new Date(thirdAnnouncementTime) : null},
        ${fireDeptArrivalTime ? new Date(fireDeptArrivalTime) : null},
        ${fireDeptAllClearTime ? new Date(fireDeptAllClearTime) : null},
        ${fireDeptDepartureTime ? new Date(fireDeptDepartureTime) : null},
        ${prepareForFdArrival ? JSON.stringify(prepareForFdArrival) : null}::jsonb,
        ${ensureElevatorsReset ? JSON.stringify(ensureElevatorsReset) : null}::jsonb,
        ${resetDevices ? JSON.stringify(resetDevices) : null}::jsonb,
        ${sanitizedNotes},
        ${auth.user.userId}::uuid,
        NOW(),
        NOW()
      )
      RETURNING *
    `;

    return NextResponse.json(
      {
        data: result[0],
        message: 'Fire log created successfully.',
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/v1/security/fire-log error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create fire log', detail: String(error) },
      { status: 500 },
    );
  }
}
