/**
 * Properties API — List and create properties
 * Multi-property management for management companies.
 * Per PRD 01 Architecture + ADMIN-SUPERADMIN-ARCHITECTURE
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';
import { handleDemoRequest } from '@/server/demo';
import { z } from 'zod';

const createPropertySchema = z.object({
  name: z.string().min(1).max(200),
  address: z.string().min(1).max(500),
  city: z.string().min(1).max(100),
  province: z.string().min(1).max(100),
  postalCode: z.string().min(1).max(20),
  country: z.string().max(100).optional(),
  unitCount: z.number().int().min(0).optional(),
  timezone: z.string().max(100).optional(),
  logo: z.string().url().max(2048).nullable().optional(),
  slug: z
    .string()
    .max(100)
    .regex(/^[a-z0-9-]*$/)
    .optional(),
  branding: z.unknown().optional(),
  propertyCode: z.string().max(7).optional(),
});

export async function GET(request: NextRequest) {
  const demoRes = await handleDemoRequest(request);
  if (demoRes) return demoRes;

  try {
    const auth = await guardRoute(request, { roles: ['super_admin', 'property_admin'] });
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const type = searchParams.get('type'); // production, demo, sandbox

    // Super Admin sees all properties (including inactive); others see only active
    const where: Record<string, unknown> = { deletedAt: null };
    if (auth.user.role !== 'super_admin') {
      where.isActive = true;
    }
    if (type) where.type = type.toUpperCase();
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
        { city: { contains: search, mode: 'insensitive' } },
      ];
    }

    const properties = await prisma.property.findMany({
      where,
      select: {
        id: true,
        name: true,
        address: true,
        city: true,
        province: true,
        country: true,
        postalCode: true,
        unitCount: true,
        timezone: true,
        logo: true,
        type: true,
        subscriptionTier: true,
        slug: true,
        branding: true,
        propertyCode: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({ data: properties });
  } catch (error) {
    console.error('GET /api/v1/properties error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch properties' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const demoRes = await handleDemoRequest(request);
  if (demoRes) return demoRes;

  try {
    const auth = await guardRoute(request, { roles: ['super_admin', 'property_admin'] });
    if (auth.error) return auth.error;

    const body = await request.json();

    const parsed = createPropertySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    const input = parsed.data;

    // Generate a unique slug from the name if not provided
    const baseSlug =
      input.slug ||
      input.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    const slug = `${baseSlug}-${Date.now().toString(36)}`;

    // Generate a unique property code (max 7 chars per schema)
    const propertyCode =
      input.propertyCode || `P${Date.now().toString(36).slice(-6).toUpperCase()}`;

    // Create property and seed system roles in a transaction
    const property = await prisma.$transaction(async (tx) => {
      const prop = await tx.property.create({
        data: {
          name: input.name,
          address: input.address,
          city: input.city,
          province: input.province,
          country:
            (input.country && input.country.length > 2
              ? input.country.toLowerCase().startsWith('can')
                ? 'CA'
                : input.country.substring(0, 2).toUpperCase()
              : input.country) || 'CA',
          postalCode: input.postalCode,
          unitCount: input.unitCount || 0,
          timezone: input.timezone || 'America/Toronto',
          logo: input.logo || null,
          type: 'PRODUCTION',
          slug,
          branding: (input.branding as any) || {},
          propertyCode,
        },
      });

      // Auto-create system roles for the new property
      const systemRoles = [
        { name: 'Super Admin', slug: 'super_admin', description: 'Full platform control' },
        {
          name: 'Property Admin',
          slug: 'property_admin',
          description: 'Property-level administration',
        },
        {
          name: 'Property Manager',
          slug: 'property_manager',
          description: 'Day-to-day property operations',
        },
        {
          name: 'Security Supervisor',
          slug: 'security_supervisor',
          description: 'Security team management',
        },
        {
          name: 'Security Guard',
          slug: 'security_guard',
          description: 'Security monitoring and patrol',
        },
        {
          name: 'Front Desk / Concierge',
          slug: 'front_desk',
          description: 'Front desk operations',
        },
        {
          name: 'Maintenance Staff',
          slug: 'maintenance_staff',
          description: 'Maintenance and repairs',
        },
        {
          name: 'Superintendent',
          slug: 'superintendent',
          description: 'Building operations management',
        },
        { name: 'Board Member', slug: 'board_member', description: 'Governance and oversight' },
        {
          name: 'Resident (Owner)',
          slug: 'resident_owner',
          description: 'Unit owner portal access',
        },
        { name: 'Resident (Tenant)', slug: 'resident_tenant', description: 'Tenant portal access' },
        {
          name: 'Family Member',
          slug: 'family_member',
          description: 'Family member limited access',
        },
        { name: 'Offsite Owner', slug: 'offsite_owner', description: 'Non-resident owner access' },
      ];

      await tx.role.createMany({
        data: systemRoles.map((r) => ({
          propertyId: prop.id,
          name: r.name,
          slug: r.slug,
          description: r.description,
          isSystem: true,
          permissions: JSON.stringify(['*']),
        })),
      });

      return prop;
    });

    return NextResponse.json({ data: property }, { status: 201 });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('POST /api/v1/properties error:', msg);
    // Provide actionable error messages
    let userMessage = 'Failed to create property';
    if (msg.includes('Unique constraint'))
      userMessage = 'A property with this name or slug already exists';
    else if (msg.includes('VarChar')) userMessage = 'One of the fields exceeds the maximum length';
    else if (msg.includes('foreign key')) userMessage = 'Invalid reference data';
    return NextResponse.json({ error: 'INTERNAL_ERROR', message: userMessage }, { status: 500 });
  }
}
