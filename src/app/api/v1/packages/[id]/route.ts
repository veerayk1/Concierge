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
import { guardRoute } from '@/server/middleware/api-guard';

// ---------------------------------------------------------------------------
// GET /api/v1/packages/:id
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;

    const pkg = await prisma.package.findUnique({
      where: { id, deletedAt: null },
      include: {
        unit: { select: { id: true, number: true } },
        courier: { select: { id: true, name: true, icon: true, color: true } },
        storageSpot: { select: { id: true, name: true, code: true } },
        parcelCategory: { select: { id: true, name: true } },
        photos: {
          where: { deletedAt: null },
          select: { id: true, url: true, type: true, createdAt: true },
        },
        history: {
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            action: true,
            detail: true,
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
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;
    const body = await request.json();

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

      const pkg = await prisma.package.update({
        where: { id },
        data: {
          status: 'released',
          releasedToName: input.releasedToName,
          releasedAt: new Date(),
          releasedById: auth.user.userId, // TODO: Get from auth
          idVerified: input.idVerified,
          isAuthorizedDelegate: input.isAuthorizedDelegate,
          releaseComments: input.releaseComments || null,
        },
      });

      // Log to history
      await prisma.packageHistory.create({
        data: {
          packageId: id,
          action: 'released',
          detail: `Released to ${input.releasedToName}`,
          actorName: 'Staff', // TODO: Get from auth
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
    if (body.description !== undefined) updateData.description = body.description;
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
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;

    await prisma.package.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await prisma.packageHistory.create({
      data: {
        packageId: id,
        action: 'deleted',
        detail: 'Package deleted',
        actorName: 'Staff', // TODO: Get from auth
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
