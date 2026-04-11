/**
 * Demo Setup: Create unit + assign resident via raw SQL
 * Bypasses stale Prisma client limitations
 * Super Admin only — used for demo preparation
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';

export async function POST(request: NextRequest) {
  const demoRole = request.headers.get('x-demo-role');
  if (demoRole !== 'super_admin') {
    return NextResponse.json(
      { error: 'FORBIDDEN', message: 'Only super_admin can run demo setup.' },
      { status: 403 },
    );
  }

  try {
    const body = await request.json();
    const { propertyId, userId, unitNumber, floor, residentType, isPrimary } = body;

    if (!propertyId || !userId || !unitNumber) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'propertyId, userId, and unitNumber are required' },
        { status: 400 },
      );
    }

    // 1. Create unit via raw SQL — columns are camelCase (Prisma default, no @map)
    const unitResult = await prisma.$queryRaw<{ id: string }[]>`
      INSERT INTO units (id, "propertyId", number, floor, "unitType", status, "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${propertyId}::uuid, ${unitNumber}, ${floor || null}::int, 'residential', 'occupied', NOW(), NOW())
      ON CONFLICT ("propertyId", number) DO UPDATE SET status = 'occupied', "updatedAt" = NOW()
      RETURNING id
    `;

    const unitId = unitResult[0]?.id;
    if (!unitId) {
      return NextResponse.json(
        { error: 'INTERNAL_ERROR', message: 'Failed to create/find unit' },
        { status: 500 },
      );
    }

    // 2. Create occupancy record via raw SQL
    const occupancyResult = await prisma.$queryRaw<{ id: string }[]>`
      INSERT INTO occupancy_records (id, "unitId", "userId", "propertyId", "residentType", "moveInDate", "isPrimary", "recordedById", "createdAt", "updatedAt")
      VALUES (gen_random_uuid(), ${unitId}::uuid, ${userId}::uuid, ${propertyId}::uuid, ${residentType || 'owner'}, '2024-09-01', ${isPrimary !== false}, ${userId}::uuid, NOW(), NOW())
      RETURNING id
    `;

    return NextResponse.json(
      {
        data: {
          unitId,
          unitNumber,
          occupancyRecordId: occupancyResult[0]?.id || 'already_exists',
          userId,
        },
        message: `Unit ${unitNumber} created and resident assigned`,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/v1/system/setup-demo-unit error:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR', message: String(error) }, { status: 500 });
  }
}

// DELETE handler: cleanup occupancy records
export async function DELETE(request: NextRequest) {
  const demoRole = request.headers.get('x-demo-role');
  if (demoRole !== 'super_admin') {
    return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const keepUnitId = searchParams.get('keepUnitId');

    if (!userId) {
      return NextResponse.json({ error: 'userId required' }, { status: 400 });
    }

    // Delete all occupancy records for user EXCEPT the one for keepUnitId
    let result;
    if (keepUnitId) {
      result = await prisma.$executeRaw`
        DELETE FROM occupancy_records
        WHERE "userId" = ${userId}::uuid AND "unitId" != ${keepUnitId}::uuid
      `;
    } else {
      result = await prisma.$executeRaw`
        DELETE FROM occupancy_records WHERE "userId" = ${userId}::uuid
      `;
    }

    return NextResponse.json({ deleted: result });
  } catch (error) {
    console.error('DELETE /api/v1/system/setup-demo-unit error:', error);
    return NextResponse.json({ error: 'INTERNAL_ERROR', message: String(error) }, { status: 500 });
  }
}
