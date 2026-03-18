/**
 * Roles API — List roles for a property
 * Per PRD 02 Section 3
 *
 * GET /api/v1/roles?propertyId=xxx — List available roles
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';

export async function GET(request: NextRequest) {
  try {
    const propertyId = new URL(request.url).searchParams.get('propertyId');

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    const roles = await prisma.role.findMany({
      where: { propertyId, deletedAt: null },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        isSystem: true,
        permissions: true,
        _count: { select: { userProperties: { where: { deletedAt: null } } } },
      },
      orderBy: { name: 'asc' },
    });

    const data = roles.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description,
      isSystem: r.isSystem,
      permissions: r.permissions,
      memberCount: r._count.userProperties,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error('GET /api/v1/roles error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch roles' },
      { status: 500 },
    );
  }
}
