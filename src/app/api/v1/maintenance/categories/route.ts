/**
 * Maintenance Categories API — per PRD 05
 * Configure maintenance request categories with SLA timers
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';

const createCategorySchema = z.object({
  propertyId: z.string().uuid(),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  slaHours: z.number().int().min(1).max(720).optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  autoAssignTo: z.string().uuid().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const propertyId = new URL(request.url).searchParams.get('propertyId');

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    const categories = await prisma.maintenanceCategory.findMany({
      where: { propertyId, deletedAt: null },
      include: {
        _count: { select: { requests: { where: { deletedAt: null } } } },
      },
      orderBy: { name: 'asc' },
    });

    const data = categories.map((c) => ({
      ...c,
      requestCount: c._count.requests,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error('GET /api/v1/maintenance/categories error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch categories' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin', 'property_admin'] });
    if (auth.error) return auth.error;

    const body = await request.json();
    const parsed = createCategorySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;

    const category = await prisma.maintenanceCategory.create({
      data: {
        propertyId: input.propertyId,
        name: input.name,
        description: input.description || null,
        slaHours: input.slaHours || null,
        defaultPriority: input.priority,
      },
    });

    return NextResponse.json({ data: category, message: 'Category created.' }, { status: 201 });
  } catch (error) {
    console.error('POST /api/v1/maintenance/categories error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create category' },
      { status: 500 },
    );
  }
}
