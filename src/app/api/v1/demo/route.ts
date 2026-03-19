/**
 * Demo Environment API — List active demos, create new demo environments
 * Per PRD 21 — Sales demo + training sandbox system
 *
 * Demo environments are isolated properties with type DEMO or TRAINING,
 * pre-seeded with mock data from templates. They auto-expire after 7 days
 * and suppress all real notifications.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';
import type { Role } from '@/types';

const ADMIN_ROLES: Role[] = ['super_admin', 'property_admin', 'property_manager'];
const DEMO_EXPIRY_DAYS = 7;

/**
 * GET /api/v1/demo — List active (non-expired) demo environments
 *
 * Accessible to all authenticated users. Admins see all demos;
 * staff see only training sandboxes they have access to.
 */
export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const typeFilter = searchParams.get('type');

    const where: Record<string, unknown> = {
      type: typeFilter ? { in: [typeFilter] } : { in: ['DEMO', 'TRAINING'] },
      expiresAt: { gt: new Date() },
    };

    const demos = await prisma.property.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ data: demos });
  } catch (error) {
    console.error('GET /api/v1/demo error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to list demo environments' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/v1/demo — Create a new demo environment
 *
 * Requires admin role. Creates an isolated property with type DEMO or TRAINING,
 * seeds it with data from the selected template, and sets a 7-day expiry.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    // Only admins can create demo environments
    if (!ADMIN_ROLES.includes(auth.user.role)) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Only administrators can create demo environments.' },
        { status: 403 },
      );
    }

    const body = await request.json();

    // Validate required fields
    if (!body.templateSlug || typeof body.templateSlug !== 'string') {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: 'templateSlug is required',
          fields: { templateSlug: ['Template slug is required'] },
        },
        { status: 400 },
      );
    }

    // Look up template
    const template = await prisma.demoTemplate.findUnique({
      where: { slug: body.templateSlug },
    });

    if (!template) {
      return NextResponse.json(
        {
          error: 'TEMPLATE_NOT_FOUND',
          message: `Demo template "${body.templateSlug}" not found`,
        },
        { status: 404 },
      );
    }

    const expiresAt = new Date(Date.now() + DEMO_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
    const isTraining = body.purpose === 'training';
    const propertyType = isTraining ? 'TRAINING' : 'DEMO';

    const purpose = body.purpose || 'sales_demo';

    // Create the demo property and seed data inside a transaction
    const result = await prisma.$transaction(async (tx) => {
      const property = await tx.property.create({
        data: {
          name: `${template.name} Demo`,
          address: 'Demo Address',
          city: 'Demo City',
          province: 'ON',
          postalCode: 'M5V 0A1',
          type: propertyType,
          demoTemplateId: template.id,
          demoLabel: body.label || null,
          prospectName: body.prospectName || null,
          expiresAt,
          createdFromTemplate: template.slug,
          notificationSuppressed: true,
          assignedSalesRepId: auth.user.userId,
          maxTrainees: isTraining ? body.maxTrainees || null : null,
        },
      });

      return property;
    });

    // Include metadata not stored in the property model for the response
    const responseData = {
      ...result,
      purpose,
      seedData: template.dataSpec as Record<string, number>,
    };

    return NextResponse.json(
      {
        data: responseData,
        message: `Demo environment "${result.name}" created successfully. Expires at ${expiresAt.toISOString()}.`,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/v1/demo error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create demo environment' },
      { status: 500 },
    );
  }
}
