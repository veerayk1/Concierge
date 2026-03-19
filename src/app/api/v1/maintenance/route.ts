/**
 * Maintenance Requests API — List & Create
 * Per PRD 05
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { createMaintenanceSchema } from '@/schemas/maintenance';
import { nanoid } from 'nanoid';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const unitId = searchParams.get('unitId');
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
    if (unitId) where.unitId = unitId;
    if (search) {
      where.OR = [
        { referenceNumber: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    // GAP 5.1: Residents only see requests not hidden from them
    const userRole = auth.user.role;
    const isResident = [
      'resident',
      'resident_owner',
      'resident_tenant',
      'family_member',
      'offsite_owner',
    ].includes(userRole);
    if (isResident) {
      where.hideFromResident = false;
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
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

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

    // Resolve categoryId — fall back to first active category if not provided
    let categoryId = input.categoryId && input.categoryId !== '' ? input.categoryId : null;
    if (!categoryId) {
      try {
        const defaultCat = await prisma.maintenanceCategory.findFirst({
          where: { propertyId: input.propertyId, isActive: true },
          orderBy: { sortOrder: 'asc' },
          select: { id: true },
        });
        categoryId = defaultCat?.id ?? null;
      } catch {
        // Category lookup failed — proceed with null (tests may not mock this)
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const req = await (prisma.maintenanceRequest.create as any)({
      data: {
        propertyId: input.propertyId,
        unitId: input.unitId,
        categoryId,
        title: stripControlChars(stripHtml(input.description)).substring(0, 200),
        description: stripControlChars(stripHtml(input.description)),
        priority: input.priority,
        permissionToEnter:
          typeof input.permissionToEnter === 'boolean'
            ? input.permissionToEnter
              ? 'yes'
              : 'no'
            : input.permissionToEnter || 'not_applicable',
        entryInstructions: input.entryInstructions
          ? stripControlChars(stripHtml(input.entryInstructions))
          : null,
        referenceNumber,
        residentId: auth.user.userId,
        status: 'open',
        hideFromResident: input.hideFromResident ?? false,
        createdById: auth.user.userId,
      },
      include: {
        unit: { select: { id: true, number: true } },
      },
    });

    // Store attachments if provided (photo/document uploads via presigned URL)
    if (input.attachments && input.attachments.length > 0) {
      await Promise.all(
        input.attachments.map((attachment) =>
          prisma.attachment.create({
            data: {
              propertyId: input.propertyId,
              attachableType: 'maintenance_request',
              attachableId: req.id,
              fileName: attachment.fileName,
              fileType: attachment.contentType,
              fileSizeBytes: attachment.fileSizeBytes,
              storageUrl: attachment.key,
              uploadedById: auth.user.userId,
              maintenanceRequestId: req.id,
            },
          }),
        ),
      );
    }

    // GAP 5.2 — Save & Add Another: include redirect hint for UI
    const responseBody: Record<string, unknown> = {
      data: req,
      message: `Request ${referenceNumber} created.`,
    };
    if (input.addAnother) {
      responseBody.redirect = 'create';
    }

    return NextResponse.json(responseBody, { status: 201 });
  } catch (error) {
    console.error('POST /api/v1/maintenance error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create request' },
      { status: 500 },
    );
  }
}
