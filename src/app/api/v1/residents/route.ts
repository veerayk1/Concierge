/**
 * Residents API — List residents for a property
 * Per PRD 07 Unit Management + PRD 08 User Management
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const search = searchParams.get('search') || '';
    const unitId = searchParams.get('unitId');
    const role = searchParams.get('role');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    const residentRoleSlugs = [
      'resident_owner',
      'resident_tenant',
      'family_member',
      'offsite_owner',
    ];

    const where: Record<string, unknown> = {
      deletedAt: null,
      isActive: true,
      userProperties: {
        some: {
          propertyId,
          deletedAt: null,
          role: {
            slug: role ? { equals: role } : { in: residentRoleSlugs },
          },
        },
      },
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [residents, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          avatarUrl: true,
          lastLoginAt: true,
          createdAt: true,
          userProperties: {
            where: { propertyId, deletedAt: null },
            select: {
              role: { select: { name: true, slug: true } },
            },
          },
        },
        orderBy: [{ lastName: 'asc' }, { firstName: 'asc' }],
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.user.count({ where }),
    ]);

    const data = residents.map((r) => ({
      id: r.id,
      firstName: r.firstName,
      lastName: r.lastName,
      email: r.email,
      phone: r.phone,
      avatarUrl: r.avatarUrl,
      role: r.userProperties[0]?.role ?? null,
      lastLoginAt: r.lastLoginAt,
      createdAt: r.createdAt,
    }));

    return NextResponse.json({
      data,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    console.error('GET /api/v1/residents error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch residents' },
      { status: 500 },
    );
  }
}
