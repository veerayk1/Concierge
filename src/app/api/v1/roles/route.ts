/**
 * Roles API — List + create roles for a property
 * Per PRD 02 Section 3
 *
 * GET  /api/v1/roles?propertyId=xxx — List available roles
 * POST /api/v1/roles                — Create a custom role
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { guardRoute, enforcePropertyAccess } from '@/server/middleware/api-guard';
import { z } from 'zod';

const CreateRoleSchema = z.object({
  propertyId: z.string().uuid('propertyId must be a UUID'),
  name: z
    .string()
    .trim()
    .min(2, 'Role name must be at least 2 characters')
    .max(100, 'Role name must be at most 100 characters'),
  description: z
    .string()
    .trim()
    .max(500, 'Description must be at most 500 characters')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  permissions: z.array(z.string().min(1)).optional(),
});

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

export async function GET(request: NextRequest) {
  // Skip demo handler — uses the real database for consistent GET/POST

  try {
    // GET roles is open to anyone who manages users/permissions UIs;
    // property managers, supervisors, and admins all need this list.
    const auth = await guardRoute(request, {
      roles: ['super_admin', 'property_admin', 'property_manager', 'security_supervisor'],
    });
    if (auth.error) return auth.error;

    const propertyId = new URL(request.url).searchParams.get('propertyId');

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }
    const _tenancy = enforcePropertyAccess(auth.user, propertyId);
    if (_tenancy) return _tenancy;

    const roles = await prisma.role.findMany({
      where: { propertyId, deletedAt: null },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        isSystem: true,
        permissions: true,
        _count: { select: { userProperties: { where: { deletedAt: null } } } },
      },
      orderBy: { name: 'asc' },
    });

    const data = roles.map((r) => ({
      id: r.id,
      name: r.name,
      slug: r.slug,
      description: r.description,
      isSystem: r.isSystem,
      permissions: r.permissions,
      memberCount: r._count.userProperties,
    }));

    return NextResponse.json({ data });
  } catch (error) {
    console.error('GET /api/v1/roles error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch roles' },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request, {
      roles: ['super_admin', 'property_admin', 'property_manager'],
    });
    if (auth.error) return auth.error;

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'INVALID_JSON', message: 'Request body must be valid JSON' },
        { status: 400 },
      );
    }

    const parsed = CreateRoleSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'VALIDATION_ERROR',
          message: parsed.error.issues[0]?.message ?? 'Invalid request body',
          issues: parsed.error.issues,
        },
        { status: 400 },
      );
    }

    const { propertyId, name, description, permissions } = parsed.data;

    const tenancy = enforcePropertyAccess(auth.user, propertyId);
    if (tenancy) return tenancy;

    const baseSlug = slugify(name);
    if (!baseSlug) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Role name must contain alphanumeric characters' },
        { status: 400 },
      );
    }

    // Resolve unique slug under (propertyId, slug) by appending -2, -3, etc.
    let slug = baseSlug;
    for (let n = 2; n < 100; n++) {
      const collision = await prisma.role.findFirst({
        where: { propertyId, slug, deletedAt: null },
        select: { id: true },
      });
      if (!collision) break;
      slug = `${baseSlug}-${n}`.slice(0, 100);
    }

    // Match seed convention: permissions stored as JSON-stringified array
    const perms = JSON.stringify(permissions && permissions.length > 0 ? permissions : ['*']);

    const role = await prisma.role.create({
      data: {
        propertyId,
        name,
        slug,
        description: description ?? null,
        isSystem: false,
        permissions: perms,
      },
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        isSystem: true,
        permissions: true,
      },
    });

    return NextResponse.json(
      {
        data: {
          ...role,
          memberCount: 0,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/v1/roles error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create role' },
      { status: 500 },
    );
  }
}
