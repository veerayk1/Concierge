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

    const where: Record<string, unknown> = {
      propertyId,
      unitId,
      deletedAt: null,
    };

    if (status) where.status = status;

    const [packages, total] = await Promise.all([
      prisma.package.findMany({
        where,
        include: {
          unit: { select: { id: true, number: true } },
          courier: { select: { id: true, name: true, iconUrl: true, color: true } },
          storageSpot: { select: { id: true, name: true, code: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.package.count({ where }),
    ]);

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
