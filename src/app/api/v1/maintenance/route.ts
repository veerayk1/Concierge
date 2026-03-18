/**
 * Maintenance Requests API — List & Create
 * Per PRD 05
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { createMaintenanceSchema } from '@/schemas/maintenance';
import { nanoid } from 'nanoid';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '50', 10);

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    const where: Record<string, unknown> = { propertyId, deletedAt: null };
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (search) {
      where.OR = [
        { referenceNumber: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [requests, total] = await Promise.all([
      prisma.maintenanceRequest.findMany({
        where,
        include: {
          unit: { select: { id: true, number: true } },
          category: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.maintenanceRequest.count({ where }),
    ]);

    return NextResponse.json({
      data: requests,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    console.error('GET /api/v1/maintenance error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch requests' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = createMaintenanceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;
    const referenceNumber = `MR-${nanoid(4).toUpperCase()}`;

    const req = await prisma.maintenanceRequest.create({
      data: {
        propertyId: input.propertyId,
        unitId: input.unitId,
        categoryId: input.categoryId || null,
        description: input.description,
        priority: input.priority,
        permissionToEnter: input.permissionToEnter,
        entryInstructions: input.entryInstructions || null,
        referenceNumber,
        status: 'open',
        createdById: 'demo-user',
      },
      include: {
        unit: { select: { id: true, number: true } },
      },
    });

    return NextResponse.json(
      { data: req, message: `Request ${referenceNumber} created.` },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/v1/maintenance error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create request' },
      { status: 500 },
    );
  }
}
