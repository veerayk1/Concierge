/**
 * Package Detail API — Get, Update, Release, Delete
 * Per PRD 04 Sections 3.1.2 (Release), 3.1.5 (Detail)
 *
 * GET    /api/v1/packages/:id — Get package details with history
 * PATCH  /api/v1/packages/:id — Update package or release it
 * DELETE /api/v1/packages/:id — Soft delete package
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { releasePackageSchema } from '@/schemas/package';
import { guardRoute, enforcePropertyAccess } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';
import { isUuid } from '@/lib/uuid';

/** Resolve actor name from userId — returns 'System' on failure */
async function resolveActorName(userId: string): Promise<string> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { firstName: true, lastName: true },
    });
    return user ? `${user.firstName} ${user.lastName}`.trim() : 'System';
  } catch {
    return 'System';
  }
}

// ---------------------------------------------------------------------------
// GET /api/v1/packages/:id
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    if (!isUuid(id)) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Invalid package id.' },
        { status: 400 },
      );
    }

    const pkg = await prisma.package.findUnique({
      where: { id, deletedAt: null },
      include: {
        unit: { select: { id: true, number: true } },
        courier: { select: { id: true, name: true, iconUrl: true, color: true } },
        storageSpot: { select: { id: true, name: true, code: true } },
        parcelCategory: { select: { id: true, name: true } },
        photos: {
          select: { id: true, fileUrl: true, photoType: true, uploadedAt: true },
        },
        history: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            action: true,
            details: true,
            actorName: true,
            createdAt: true,
          },
        },
      },
    });

    if (!pkg) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Package not found' },
        { status: 404 },
      );
    }

    return NextResponse.json({ data: pkg });
  } catch (error) {
    console.error('GET /api/v1/packages/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch package' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/v1/packages/:id — Update or Release
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    // Only staff can modify packages. Residents can VIEW their packages via
    // /api/v1/resident/packages but cannot mark them released, change unit,
    // re-route them, etc. — that's a front-desk operation.
    const auth = await guardRoute(request, {
      roles: [
        'super_admin',
        'property_admin',
        'property_manager',
        'front_desk',
        'security_supervisor',
        'security_guard',
      ],
    });
    if (auth.error) return auth.error;

    const { id } = await params;
    if (!isUuid(id)) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Invalid package id.' },
        { status: 400 },
      );
    }
    const body = await request.json();

    // Tenancy: load the package first and verify it belongs to the caller's
    // property. Without this, a property_admin at Property A could PATCH a
    // package at Property B just by knowing its id.
    const target = await prisma.package.findUnique({
      where: { id },
      select: { propertyId: true },
    });
    if (!target) {
      return NextResponse.json(
        { error: 'NOT_FOUND', message: 'Package not found.' },
        { status: 404 },
      );
    }
    const tenancy = enforcePropertyAccess(auth.user, target.propertyId);
    if (tenancy) return tenancy;

    // Check if this is a release action
    if (body.action === 'release') {
      const parsed = releasePackageSchema.safeParse(body);
      if (!parsed.success) {
        return NextResponse.json(
          { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
          { status: 400 },
        );
      }

      const input = parsed.data;

      // Atomic conditional update — only the first concurrent caller wins.
      // Without this, 5 concurrent release PATCHes all succeed and pollute
      // history with 5 release records for the same package.
      const result = await prisma.package.updateMany({
        where: { id, status: 'unreleased' },
        data: {
          status: 'released',
          releasedToName: input.releasedToName,
          releasedAt: new Date(),
          releasedById: auth.user.userId,
          idVerified: input.idVerified,
          isAuthorizedDelegate: input.isAuthorizedDelegate,
          releaseComments: input.releaseComments
            ? stripControlChars(stripHtml(input.releaseComments))
            : null,
        },
      });

      if (result.count === 0) {
        return NextResponse.json(
          {
            error: 'ALREADY_RELEASED',
            message: 'Package has already been released or is not in a releasable state.',
          },
          { status: 409 },
        );
      }

      const pkg = await prisma.package.findUnique({ where: { id } });

      // Log to history — only the winning writer reaches this point
      const releaseActorName = await resolveActorName(auth.user.userId);
      await prisma.packageHistory.create({
        data: {
          packageId: id,
          action: 'released',
          details: `Released to ${input.releasedToName}`,
          actorId: auth.user.userId,
          actorName: releaseActorName,
        },
      });

      return NextResponse.json({
        data: pkg,
        message: `Package released to ${input.releasedToName}.`,
      });
    }

    // Regular update (e.g., storage location, description)
    const updateData: Record<string, unknown> = {};
    if (body.storageSpotId !== undefined) updateData.storageSpotId = body.storageSpotId;
    if (body.description !== undefined)
      updateData.description = stripControlChars(stripHtml(body.description));
    if (body.isPerishable !== undefined) updateData.isPerishable = body.isPerishable;
    if (body.isOversized !== undefined) updateData.isOversized = body.isOversized;

    const pkg = await prisma.package.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ data: pkg, message: 'Package updated.' });
  } catch (error) {
    console.error('PATCH /api/v1/packages/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update package' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/v1/packages/:id — Soft delete
// ---------------------------------------------------------------------------

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Staff-only — a resident could delete the entire package log otherwise.
    const auth = await guardRoute(request, {
      roles: [
        'super_admin',
        'property_admin',
        'property_manager',
        'front_desk',
        'security_supervisor',
        'superintendent',
      ],
    });
    if (auth.error) return auth.error;

    const { id } = await params;
    if (!isUuid(id)) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'Invalid package id.' },
        { status: 400 },
      );
    }

    await prisma.package.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    const deleteActorName = await resolveActorName(auth.user.userId);
    await prisma.packageHistory.create({
      data: {
        packageId: id,
        action: 'deleted',
        details: 'Package deleted',
        actorId: auth.user.userId,
        actorName: deleteActorName,
      },
    });

    return NextResponse.json({ message: 'Package deleted.' });
  } catch (error) {
    console.error('DELETE /api/v1/packages/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to delete package' },
      { status: 500 },
    );
  }
}
