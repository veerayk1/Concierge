/**
 * Resident Self-Service — Announcements (read-only)
 *
 * GET /api/v1/resident/announcements — Published property announcements.
 * Residents can only read published announcements — they cannot create,
 * edit, or delete them.
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

    const { propertyId } = auth.user;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    const where: Record<string, unknown> = {
      propertyId,
      status: 'published',
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where,
        include: {
          category: { select: { id: true, name: true } },
        },
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.announcement.count({ where }),
    ]);

    return NextResponse.json({
      data: announcements,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    console.error('GET /api/v1/resident/announcements error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch announcements' },
      { status: 500 },
    );
  }
}
