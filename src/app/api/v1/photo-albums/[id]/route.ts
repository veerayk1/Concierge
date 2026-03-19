/**
 * Photo Album Detail API — Get album with photos, update metadata, add photo, soft delete
 *
 * GET    /api/v1/photo-albums/:id — Get album with photos, increment viewCount
 * PATCH  /api/v1/photo-albums/:id — Update album metadata or set cover photo
 * POST   /api/v1/photo-albums/:id — Add a photo to the album
 * DELETE /api/v1/photo-albums/:id — Soft delete album
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { z } from 'zod';
import { guardRoute } from '@/server/middleware/api-guard';
import { stripHtml, stripControlChars } from '@/lib/sanitize';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ALBUM_CATEGORIES = [
  'events',
  'building',
  'amenities',
  'renovations',
  'community',
  'seasonal',
] as const;

const ALBUM_VISIBILITY = ['public', 'residents_only', 'staff_only'] as const;

// ---------------------------------------------------------------------------
// Validation Schemas
// ---------------------------------------------------------------------------

const updateAlbumSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(300).optional(),
  category: z.enum(ALBUM_CATEGORIES).optional(),
  visibility: z.enum(ALBUM_VISIBILITY).optional(),
  coverPhotoId: z.string().uuid().optional(),
  eventDate: z.string().optional(),
});

const addPhotoSchema = z.object({
  filename: z.string().min(1, 'Filename is required').max(255),
  url: z.string().min(1, 'URL is required').max(500),
  caption: z.string().max(200).optional(),
  sortOrder: z.number().int().min(0).optional(),
});

// ---------------------------------------------------------------------------
// GET /api/v1/photo-albums/:id — Get album with photos, increment viewCount
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request);
    if (auth.error) return auth.error;

    const { id } = await params;

    const album = await prisma.photoAlbum.findUnique({
      where: { id, deletedAt: null },
      include: {
        photos: {
          select: {
            id: true,
            filePath: true,
            caption: true,
            sortOrder: true,
            uploadedBy: true,
            createdAt: true,
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!album) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Album not found' }, { status: 404 });
    }

    // Increment view count (fire-and-forget)
    prisma.photoAlbum
      .update({
        where: { id },
        data: { viewCount: { increment: 1 } },
      })
      .catch(() => {
        /* non-critical */
      });

    return NextResponse.json({
      data: {
        ...album,
        photoCount: album.photos.length,
      },
    });
  } catch (error) {
    console.error('GET /api/v1/photo-albums/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to fetch album' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// PATCH /api/v1/photo-albums/:id — Update album metadata, set cover photo
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin', 'property_admin'] });
    if (auth.error) return auth.error;

    const { id } = await params;
    const body = await request.json();
    const parsed = updateAlbumSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    // Verify album exists
    const album = await prisma.photoAlbum.findUnique({
      where: { id, deletedAt: null },
    });

    if (!album) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Album not found' }, { status: 404 });
    }

    const input = parsed.data;
    const data: Record<string, unknown> = {};

    if (input.title !== undefined) data.title = stripControlChars(stripHtml(input.title));
    if (input.description !== undefined)
      data.description = stripControlChars(stripHtml(input.description));
    if (input.category !== undefined) data.category = input.category;
    if (input.visibility !== undefined) data.visibility = input.visibility;
    if (input.eventDate !== undefined) data.eventDate = new Date(input.eventDate);

    // Set cover photo — verify the photo belongs to this album
    if (input.coverPhotoId !== undefined) {
      const photo = await prisma.albumPhoto.findUnique({
        where: { id: input.coverPhotoId },
      });

      if (!photo || photo.albumId !== id) {
        return NextResponse.json(
          { error: 'VALIDATION_ERROR', message: 'Cover photo does not belong to this album' },
          { status: 400 },
        );
      }

      data.coverPhotoId = input.coverPhotoId;
    }

    const updated = await prisma.photoAlbum.update({
      where: { id },
      data,
    });

    return NextResponse.json({ data: updated, message: 'Album updated.' });
  } catch (error) {
    console.error('PATCH /api/v1/photo-albums/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update album' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/v1/photo-albums/:id — Add a photo to the album
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin', 'property_admin'] });
    if (auth.error) return auth.error;

    const { id } = await params;
    const body = await request.json();
    const parsed = addPhotoSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'VALIDATION_ERROR', fields: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    // Verify album exists and is not deleted
    const album = await prisma.photoAlbum.findUnique({
      where: { id, deletedAt: null },
    });

    if (!album) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Album not found' }, { status: 404 });
    }

    const input = parsed.data;

    const photo = await prisma.albumPhoto.create({
      data: {
        albumId: id,
        filePath: stripControlChars(input.url),
        caption: input.caption ? stripControlChars(stripHtml(input.caption)) : null,
        sortOrder: input.sortOrder ?? 0,
        uploadedBy: auth.user.userId,
      },
    });

    // Increment album photo count
    await prisma.photoAlbum.update({
      where: { id },
      data: { photoCount: { increment: 1 } },
    });

    return NextResponse.json(
      { data: { ...photo, filename: input.filename }, message: 'Photo added to album.' },
      { status: 201 },
    );
  } catch (error) {
    console.error('POST /api/v1/photo-albums/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to add photo' },
      { status: 500 },
    );
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/v1/photo-albums/:id — Soft delete album
// ---------------------------------------------------------------------------

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const auth = await guardRoute(request, { roles: ['super_admin', 'property_admin'] });
    if (auth.error) return auth.error;

    const { id } = await params;

    const album = await prisma.photoAlbum.findUnique({
      where: { id, deletedAt: null },
    });

    if (!album) {
      return NextResponse.json({ error: 'NOT_FOUND', message: 'Album not found' }, { status: 404 });
    }

    await prisma.photoAlbum.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    return NextResponse.json({ message: 'Album deleted.' });
  } catch (error) {
    console.error('DELETE /api/v1/photo-albums/:id error:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to delete album' },
      { status: 500 },
    );
  }
}
