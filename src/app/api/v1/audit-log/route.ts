/**
 * Audit Log API — per PRD 16 Settings & Admin
 * Immutable log of all administrative actions
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const userId = searchParams.get('userId');
    const action = searchParams.get('action');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    // Use LoginAudit as a proxy for audit log until we have a dedicated AuditLog model
    const where: Record<string, unknown> = {};
    if (userId) where.userId = userId;
    if (from || to) {
      where.createdAt = {};
      if (from) (where.createdAt as Record<string, unknown>).gte = new Date(from);
      if (to) (where.createdAt as Record<string, unknown>).lte = new Date(to);
    }

    const [entries, total] = await Promise.all([
      prisma.loginAudit.findMany({
        where,
        select: {
          id: true,
          email: true,
          success: true,
          failReason: true,
          ipAddress: true,
          userAgent: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.loginAudit.count({ where }),
    ]);

    return NextResponse.json({
      data: entries,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    console.error('GET /api/v1/audit-log error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch audit log' },
      { status: 500 },
    );
  }
}
