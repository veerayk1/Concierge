/**
 * Admin Leads API — List sales leads and contact submissions
 *
 * GET /api/v1/admin/leads
 *   Query params: page, pageSize, status, source, search
 *   Returns: { leads, total, page, pageSize }
 *
 * Requires super_admin role.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';
import { createLogger } from '@/server/logger';

const logger = createLogger('admin:leads');

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin'] });
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '25', 10)));
    const status = searchParams.get('status') || '';
    const source = searchParams.get('source') || '';
    const search = searchParams.get('search') || '';

    // Build filter
    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }
    if (source) {
      where.source = source;
    }
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { company: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [leads, total] = await Promise.all([
      prisma.salesLead.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.salesLead.count({ where }),
    ]);

    return NextResponse.json({ leads, total, page, pageSize });
  } catch (err) {
    logger.error({ err }, 'Failed to list leads');
    return NextResponse.json({ error: 'Failed to load leads' }, { status: 500 });
  }
}
