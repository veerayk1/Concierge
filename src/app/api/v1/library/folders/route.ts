/**
 * Library Folders — Create a new folder.
 *
 * POST /api/v1/library/folders
 *   Body: { propertyId, name, parentFolderId? }
 *
 * The library page had a "New Folder" button with no onClick handler;
 * this endpoint is the missing target.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/server/db';
import { guardRoute, enforcePropertyAccess } from '@/server/middleware/api-guard';

const STAFF_ROLES = [
  'super_admin',
  'property_admin',
  'property_manager',
  'front_desk',
  'security_supervisor',
  'superintendent',
] as const;

const createFolderSchema = z.object({
  propertyId: z.string().uuid(),
  name: z.string().min(1, 'Folder name is required').max(100),
  parentFolderId: z.string().uuid().optional().or(z.literal('')),
  description: z.string().max(500).optional().or(z.literal('')),
});

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request, { roles: STAFF_ROLES as unknown as string[] });
    if (auth.error) return auth.error;

    const body = await request.json().catch(() => ({}));
    const parsed = createFolderSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }
    const input = parsed.data;
    const tenancy = enforcePropertyAccess(auth.user, input.propertyId);
    if (tenancy) return tenancy;

    // Reject duplicate names at the same parent so the folder tree stays sane.
    const existing = await (
      prisma.libraryFolder.findFirst as unknown as (args: unknown) => Promise<{ id: string } | null>
    )({
      where: {
        propertyId: input.propertyId,
        name: input.name,
        parentFolderId:
          input.parentFolderId && input.parentFolderId !== '' ? input.parentFolderId : null,
      },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: 'DUPLICATE_NAME', message: 'A folder with that name already exists here.' },
        { status: 409 },
      );
    }

    const folder = await (
      prisma.libraryFolder.create as unknown as (args: unknown) => Promise<unknown>
    )({
      data: {
        propertyId: input.propertyId,
        name: input.name,
        parentFolderId:
          input.parentFolderId && input.parentFolderId !== '' ? input.parentFolderId : null,
        description: input.description || null,
        createdById: auth.user.userId,
      },
    });
    return NextResponse.json({ data: folder, message: 'Folder created.' }, { status: 201 });
  } catch (error) {
    console.error('POST /api/v1/library/folders error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create folder', detail: String(error) },
      { status: 500 },
    );
  }
}
