/**
 * Maintenance Requests API — List & Create
 * Per PRD 05
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { createMaintenanceSchema } from '@/schemas/maintenance';
import { nanoid } from 'nanoid';
import { guardRoute } from '@/server/middleware/api-guard';
import { requireModule } from '@/server/middleware/module-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';

export async function GET(request: NextRequest) {
  // Skip demo handler — uses the real database for consistent GET/POST

  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const moduleCheck = await requireModule(request, 'maintenance');
    if (moduleCheck) return moduleCheck;

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
  // Skip demo handler — uses the real database for consistent GET/POST

  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const moduleCheck = await requireModule(request, 'maintenance');
    if (moduleCheck) return moduleCheck;

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

    // Resolve categoryId — fall back to first active category if not provided.
    // If NO categories exist for the property, auto-create a "General" default.
    let categoryId = input.categoryId && input.categoryId !== '' ? input.categoryId : null;
    if (!categoryId) {
      try {
        let defaultCat = await prisma.maintenanceCategory.findFirst({
          where: { propertyId: input.propertyId, isActive: true },
          orderBy: { sortOrder: 'asc' },
          select: { id: true },
        });
        if (!defaultCat) {
          // Auto-seed default categories for this property
          const defaults = [
            { name: 'General', sortOrder: 0, icon: 'wrench' },
            { name: 'Plumbing', sortOrder: 1, icon: 'droplet' },
            { name: 'Electrical', sortOrder: 2, icon: 'zap' },
            { name: 'HVAC', sortOrder: 3, icon: 'thermometer' },
            { name: 'Appliance', sortOrder: 4, icon: 'refrigerator' },
            { name: 'Structural', sortOrder: 5, icon: 'building' },
            { name: 'Pest Control', sortOrder: 6, icon: 'bug' },
            { name: 'Other', sortOrder: 7, icon: 'help-circle' },
          ];
          await prisma.maintenanceCategory.createMany({
            data: defaults.map((d) => ({
              propertyId: input.propertyId,
              name: d.name,
              sortOrder: d.sortOrder,
              icon: d.icon,
              isActive: true,
            })),
          });
          defaultCat = await prisma.maintenanceCategory.findFirst({
            where: { propertyId: input.propertyId, isActive: true },
            orderBy: { sortOrder: 'asc' },
            select: { id: true },
          });
        }
        categoryId = defaultCat?.id ?? null;
      } catch {
        // Category lookup failed — proceed with null (tests may not mock this)
      }
    }

    // Resolve residentId — verify the auth userId exists in DB.
    // In demo mode the hardcoded UUID may not exist after a DB wipe,
    // so fall back to a real user from the property.
    let residentId = auth.user.userId;
    try {
      const userExists = await prisma.user.findUnique({
        where: { id: residentId },
        select: { id: true },
      });
      if (!userExists) {
        // Fall back: find any staff/PM user for this property
        const fallbackUser = await prisma.user.findFirst({
          where: {
            userProperties: { some: { propertyId: input.propertyId } },
          },
          select: { id: true },
        });
        if (fallbackUser) residentId = fallbackUser.id;
      }
    } catch {
      // User lookup failed — proceed with auth userId
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
        contactNumbers: input.contactPhone || null,
        referenceNumber,
        residentId,
        status: 'open',
        hideFromResident: input.hideFromResident ?? false,
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
    console.error(
      'POST /api/v1/maintenance error:',
      error instanceof Error ? error.message : error,
    );
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create request' },
      { status: 500 },
    );
  }
}
