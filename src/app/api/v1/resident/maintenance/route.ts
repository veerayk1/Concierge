/**
 * Resident Self-Service — Maintenance Requests
 *
 * GET  /api/v1/resident/maintenance — List own maintenance requests
 * POST /api/v1/resident/maintenance — Create request for own unit only
 *
 * The unitId is always derived from the auth context — residents cannot
 * specify a different unit, preventing cross-unit data access.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { nanoid } from 'nanoid';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';
import type { Role } from '@/types';

const RESIDENT_ROLES: Role[] = ['resident_owner', 'resident_tenant'];

const residentMaintenanceSchema = z.object({
  description: z.string().min(10, 'Description must be at least 10 characters').max(4000),
  categoryId: z.string().uuid().optional().or(z.literal('')),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
  permissionToEnter: z.boolean().default(false),
  entryInstructions: z.string().max(1000).optional().or(z.literal('')),
  contactPhone: z.string().max(20).optional().or(z.literal('')),
});

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
      hideFromResident: false,
    };

    if (status) where.status = status;

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
    console.error('GET /api/v1/resident/maintenance error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch requests' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request, { roles: RESIDENT_ROLES });
    if (auth.error) return auth.error;

    const { userId, propertyId, unitId } = auth.user;

    if (!unitId) {
      return NextResponse.json(
        { error: 'NO_UNIT', message: 'No unit associated with your account.' },
        { status: 400 },
      );
    }

    const body = await request.json();
    const parsed = residentMaintenanceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const input = parsed.data;
    const referenceNumber = `MR-${nanoid(4).toUpperCase()}`;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const maintenanceReq = await (prisma.maintenanceRequest.create as any)({
      data: {
        propertyId,
        unitId, // Always from auth context, never from request body
        categoryId: input.categoryId || null,
        title: stripControlChars(stripHtml(input.description)).substring(0, 200),
        description: stripControlChars(stripHtml(input.description)),
        priority: input.priority,
        permissionToEnter: input.permissionToEnter ? 'yes' : 'no',
        entryInstructions: input.entryInstructions
          ? stripControlChars(stripHtml(input.entryInstructions))
          : null,
        referenceNumber,
        residentId: userId,
        status: 'open',
        createdById: userId,
        source: 'resident',
      },
      include: {
        unit: { select: { id: true, number: true } },
      },
    });

    return NextResponse.json(
      { data: maintenanceReq, message: `Request ${referenceNumber} created.` },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/v1/resident/maintenance error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create request' },
      { status: 500 },
    );
  }
}
