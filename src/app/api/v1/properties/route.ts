/**
 * Properties API — List and create properties
 * Multi-property management for management companies.
 * Per PRD 01 Architecture + ADMIN-SUPERADMIN-ARCHITECTURE
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute } from '@/server/middleware/api-guard';
import { handleDemoRequest } from '@/server/demo';

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

    // Validate required fields
    const required = ['name', 'address', 'city', 'province', 'postalCode'];
    const missing = required.filter((f) => !body[f]);
    if (missing.length > 0) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: `Missing required fields: ${missing.join(', ')}`,
          fields: missing.map((f) => ({ field: f, message: `${f} is required` })),
        },
        { status: 400 },
      );
    }

    // Generate a unique slug from the name if not provided
    const baseSlug =
      body.slug ||
      body.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
    const slug = `${baseSlug}-${Date.now().toString(36)}`;

    // Generate a unique property code (max 7 chars per schema)
    const propertyCode = body.propertyCode || `P${Date.now().toString(36).slice(-6).toUpperCase()}`;

    // Create property and seed system roles in a transaction
    const property = await prisma.$transaction(async (tx) => {
      const prop = await tx.property.create({
        data: {
          name: body.name,
          address: body.address,
          city: body.city,
          province: body.province,
          country:
            (body.country && body.country.length > 2
              ? body.country.toLowerCase().startsWith('can')
                ? 'CA'
                : body.country.substring(0, 2).toUpperCase()
              : body.country) || 'CA',
          postalCode: body.postalCode,
          unitCount: body.unitCount || 0,
          timezone: body.timezone || 'America/Toronto',
          logo: body.logo || null,
          type: 'PRODUCTION',
          slug,
          branding: body.branding || {},
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
