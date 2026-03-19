/**
 * Photo Albums API — List, Create, Upload Photos, Reorder, Set Cover, Delete
 * Supports public and private photo albums for building communities.
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';

// ---------------------------------------------------------------------------
// Validation Schemas
// ---------------------------------------------------------------------------

const createAlbumSchema = z.object({
  propertyId: z.string().uuid(),
  title: z.string().min(1, 'Title is required').max(100),
  description: z.string().max(300).optional(),
  visibility: z.enum(['public', 'private']).default('public'),
  eventDate: z.string().optional(),
});

const addPhotoSchema = z.object({
  action: z.literal('add_photo'),
  albumId: z.string().min(1, 'Album ID is required'),
  filePath: z.string().min(1, 'File path is required'),
  caption: z.string().max(200).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

const reorderPhotosSchema = z.object({
  action: z.literal('reorder_photos'),
  albumId: z.string().min(1, 'Album ID is required'),
  photoOrder: z
    .array(
      z.object({
        photoId: z.string().min(1),
        sortOrder: z.number().int().min(0),
      }),
    )
    .min(1, 'At least one photo order entry is required'),
});

const setCoverSchema = z.object({
  action: z.literal('set_cover'),
  albumId: z.string().min(1, 'Album ID is required'),
  coverPhotoId: z.string().min(1, 'Cover photo ID is required'),
});

// ---------------------------------------------------------------------------
// GET /api/v1/photo-albums — List albums with pagination
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { searchParams } = new URL(request.url);
    const propertyId = searchParams.get('propertyId');
    const visibility = searchParams.get('visibility');
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '20', 10);

    if (!propertyId) {
      return NextResponse.json(
        { error: 'MISSING_PROPERTY', message: 'propertyId is required' },
        { status: 400 },
      );
    }

    const where: Record<string, unknown> = { propertyId, deletedAt: null };
    if (visibility) where.visibility = visibility;
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [albums, total] = await Promise.all([
      prisma.photoAlbum.findMany({
        where,
        include: {
          photos: {
            select: { id: true, filePath: true, caption: true, sortOrder: true },
            orderBy: { sortOrder: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.photoAlbum.count({ where }),
    ]);

    return NextResponse.json({
      data: albums,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (error) {
    console.error('GET /api/v1/photo-albums error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch albums' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/photo-albums — Create album or add photo
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin', 'property_admin'] });
    if (auth.error) return auth.error;

    const body = await request.json();

    // Dispatch based on action field
    if (body.action === 'add_photo') {
      return handleAddPhoto(body, auth.user);
    }

    // Default: create album
    return handleCreateAlbum(body, auth.user);
  } catch (error) {
    console.error('POST /api/v1/photo-albums error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to process request' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/v1/photo-albums — Reorder photos or set cover
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin', 'property_admin'] });
    if (auth.error) return auth.error;

    const body = await request.json();

    if (body.action === 'reorder_photos') {
      return handleReorderPhotos(body);
    }

    if (body.action === 'set_cover') {
      return handleSetCover(body);
    }

    return NextResponse.json(
      { error: 'VALIDATION_ERROR', message: 'Invalid action. Use reorder_photos or set_cover.' },
      { status: 400 },
    );
  } catch (error) {
    console.error('PATCH /api/v1/photo-albums error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to process request' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/v1/photo-albums — Delete a photo from album
// ---------------------------------------------------------------------------

export async function DELETE(request: NextRequest) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin', 'property_admin'] });
    if (auth.error) return auth.error;

    const body = await request.json();
    const photoId = body?.photoId;

    if (!photoId) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', message: 'photoId is required' },
        { status: 400 },
      );
    }

    const photo = await prisma.albumPhoto.findUnique({
      where: { id: photoId },
      include: { album: { select: { propertyId: true } } },
    });

    if (!photo) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Photo not found' }, { status: 404 });
    }

    await prisma.albumPhoto.delete({ where: { id: photoId } });

    // Decrement album photo count
    await prisma.photoAlbum.update({
      where: { id: photo.albumId },
      data: { photoCount: { decrement: 1 } },
    });

    return NextResponse.json({ message: 'Photo deleted.' });
  } catch (error) {
    console.error('DELETE /api/v1/photo-albums error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to delete photo' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// Handler: Create Album
// ---------------------------------------------------------------------------

async function handleCreateAlbum(body: unknown, user: { userId: string }): Promise<NextResponse> {
  const parsed = createAlbumSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const input = parsed.data;

  const album = await prisma.photoAlbum.create({
    data: {
      propertyId: input.propertyId,
      title: stripControlChars(stripHtml(input.title)),
      description: input.description ? stripControlChars(stripHtml(input.description)) : null,
      visibility: input.visibility,
      eventDate: input.eventDate ? new Date(input.eventDate) : null,
      createdById: user.userId,
      photoCount: 0,
    },
  });

  return NextResponse.json({ data: album, message: 'Album created.' }, { status: 201 });
}

// ---------------------------------------------------------------------------
// Handler: Add Photo to Album
// ---------------------------------------------------------------------------

async function handleAddPhoto(body: unknown, user: { userId: string }): Promise<NextResponse> {
  const parsed = addPhotoSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const input = parsed.data;

  // Verify album exists
  const album = await prisma.photoAlbum.findUnique({
    where: { id: input.albumId },
  });

  if (!album) {
    return NextResponse.json({ error: 'NOT_FOUND', message: 'Album not found' }, { status: 404 });
  }

  const photo = await prisma.albumPhoto.create({
    data: {
      albumId: input.albumId,
      filePath: input.filePath,
      caption: input.caption || null,
      sortOrder: input.sortOrder ?? 0,
      uploadedBy: user.userId,
    },
  });

  // Increment album photo count
  await prisma.photoAlbum.update({
    where: { id: input.albumId },
    data: { photoCount: { increment: 1 } },
  });

  return NextResponse.json({ data: photo, message: 'Photo added.' }, { status: 201 });
}

// ---------------------------------------------------------------------------
// Handler: Reorder Photos
// ---------------------------------------------------------------------------

async function handleReorderPhotos(body: unknown): Promise<NextResponse> {
  const parsed = reorderPhotosSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const input = parsed.data;

  // Verify album exists
  const album = await prisma.photoAlbum.findUnique({
    where: { id: input.albumId },
  });

  if (!album) {
    return NextResponse.json({ error: 'NOT_FOUND', message: 'Album not found' }, { status: 404 });
  }

  // Update each photo's sort order
  await Promise.all(
    input.photoOrder.map((entry) =>
      prisma.albumPhoto.updateMany({
        where: { id: entry.photoId, albumId: input.albumId },
        data: { sortOrder: entry.sortOrder },
      }),
    ),
  );

  return NextResponse.json({ message: 'Photo order updated.' });
}

// ---------------------------------------------------------------------------
// Handler: Set Cover Photo
// ---------------------------------------------------------------------------

async function handleSetCover(body: unknown): Promise<NextResponse> {
  const parsed = setCoverSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
      { status: 400 },
    );
  }

  const input = parsed.data;

  // Verify album exists
  const album = await prisma.photoAlbum.findUnique({
    where: { id: input.albumId },
  });

  if (!album) {
    return NextResponse.json({ error: 'NOT_FOUND', message: 'Album not found' }, { status: 404 });
  }

  // Verify photo exists
  const photo = await prisma.albumPhoto.findUnique({
    where: { id: input.coverPhotoId },
  });

  if (!photo) {
    return NextResponse.json({ error: 'NOT_FOUND', message: 'Photo not found' }, { status: 404 });
  }

  // Verify photo belongs to this album
  if (photo.albumId !== input.albumId) {
    return NextResponse.json(
      { error: 'VALIDATION_ERROR', message: 'Photo does not belong to this album' },
      { status: 400 },
    );
  }

  const updated = await prisma.photoAlbum.update({
    where: { id: input.albumId },
    data: { coverPhotoId: input.coverPhotoId },
  });

  return NextResponse.json({ data: updated, message: 'Cover photo updated.' });
}
