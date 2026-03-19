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
  icon: z.string().max(50).optional(),
  color: z.string().max(7).optional(),
  subCategories: z.array(z.string()).optional(),
  defaultPriority: z.enum(['low', 'normal', 'high', 'critical']).optional(),
  defaultAssigneeId: z.string().uuid().optional(),
  sortOrder: z.number().int().optional(),
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
      where: { propertyId, isActive: true },
      include: {
        _count: { select: { maintenanceRequests: { where: { deletedAt: null } } } },
      },
      orderBy: { name: 'asc' },
    });

    const data = categories.map((c) => ({
      ...c,
      requestCount: c._count.maintenanceRequests,
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
        icon: input.icon || null,
        color: input.color || null,
        subCategories: input.subCategories || [],
        defaultPriority: input.defaultPriority || null,
        defaultAssigneeId: input.defaultAssigneeId || null,
        sortOrder: input.sortOrder || 0,
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
