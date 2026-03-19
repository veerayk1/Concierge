/**
 * Photo Album Detail API Route Tests — [id] endpoints
 *
 * Tests cover:
 * 1.  GET returns album with photos and increments viewCount
 * 2.  GET returns 404 for non-existent album
 * 3.  GET excludes soft-deleted albums
 * 4.  GET returns photoCount derived from photos array
 * 5.  PATCH updates album title
 * 6.  PATCH updates album description
 * 7.  PATCH updates album category
 * 8.  PATCH updates album visibility
 * 9.  PATCH sets cover photo
 * 10. PATCH rejects cover photo from another album
 * 11. PATCH rejects cover photo that does not exist
 * 12. PATCH returns 404 for non-existent album
 * 13. POST adds photo to album with filename, url, caption
 * 14. POST sets uploadedBy from authenticated user
 * 15. POST increments album photoCount
 * 16. POST returns 404 for non-existent album
 * 17. POST rejects missing url
 * 18. DELETE soft-deletes album
 * 19. DELETE returns 404 for non-existent album
 * 20. Tenant isolation — queries scoped by deletedAt: null
 * 21. Role-based access — PATCH/POST/DELETE require admin
 * 22. XSS sanitization on PATCH title
 * 23. Error handling — database errors do not leak internals
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createGetRequest,
  createPostRequest,
  createPatchRequest,
  createDeleteRequest,
  parseResponse,
} from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Mock Setup
// ---------------------------------------------------------------------------

const mockAlbumFindUnique = vi.fn();
const mockAlbumUpdate = vi.fn();
const mockPhotoCreate = vi.fn();
const mockPhotoFindUnique = vi.fn();

const mockGuardRoute = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    photoAlbum: {
      findUnique: (...args: unknown[]) => mockAlbumFindUnique(...args),
      update: (...args: unknown[]) => mockAlbumUpdate(...args),
    },
    albumPhoto: {
      create: (...args: unknown[]) => mockPhotoCreate(...args),
      findUnique: (...args: unknown[]) => mockPhotoFindUnique(...args),
    },
  },
}));

vi.mock('@/lib/sanitize', () => ({
  stripHtml: vi.fn((input: string) => input.replace(/<[^>]*>/g, '')),
  stripControlChars: vi.fn((input: string) =>
    input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''),
  ),
}));

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: (...args: unknown[]) => mockGuardRoute(...args),
}));

import { GET, PATCH, POST, DELETE } from '../route';

// ---------------------------------------------------------------------------
// Constants & Helpers
// ---------------------------------------------------------------------------

const PROPERTY_A = '00000000-0000-4000-b000-000000000001';
const ALBUM_ID = 'album-detail-001';
const PHOTO_ID = '00000000-0000-4000-b000-000000000010';
const USER_ADMIN = 'user-admin-001';

function makeParams(id: string) {
  return { params: Promise.resolve({ id }) };
}

const sampleAlbum = {
  id: ALBUM_ID,
  propertyId: PROPERTY_A,
  title: 'Summer BBQ 2026',
  description: 'Photos from the annual event',
  category: 'events',
  visibility: 'public',
  viewCount: 5,
  photoCount: 2,
  coverPhotoId: null,
  deletedAt: null,
  photos: [
    {
      id: 'p-1',
      filePath: '/uploads/1.jpg',
      caption: 'Photo 1',
      sortOrder: 0,
      uploadedBy: USER_ADMIN,
      createdAt: new Date(),
    },
    {
      id: 'p-2',
      filePath: '/uploads/2.jpg',
      caption: 'Photo 2',
      sortOrder: 1,
      uploadedBy: USER_ADMIN,
      createdAt: new Date(),
    },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  mockAlbumFindUnique.mockResolvedValue(null);
  mockAlbumUpdate.mockResolvedValue({});
  mockPhotoCreate.mockResolvedValue({});
  mockPhotoFindUnique.mockResolvedValue(null);

  mockGuardRoute.mockResolvedValue({
    user: {
      userId: USER_ADMIN,
      propertyId: PROPERTY_A,
      role: 'property_admin',
      permissions: ['*'],
      mfaVerified: true,
    },
    error: null,
  });
});

// ---------------------------------------------------------------------------
// 1–4. GET /api/v1/photo-albums/:id
// ---------------------------------------------------------------------------

describe('GET /api/v1/photo-albums/:id', () => {
  it('returns album with photos and photoCount', async () => {
    mockAlbumFindUnique.mockResolvedValue(sampleAlbum);
    mockAlbumUpdate.mockResolvedValue({ ...sampleAlbum, viewCount: 6 });

    const req = createGetRequest('/api/v1/photo-albums/' + ALBUM_ID);
    const res = await GET(req, makeParams(ALBUM_ID));
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: { id: string; photos: unknown[]; photoCount: number };
    }>(res);
    expect(body.data.id).toBe(ALBUM_ID);
    expect(body.data.photos).toHaveLength(2);
    expect(body.data.photoCount).toBe(2);
  });

  it('increments viewCount on fetch', async () => {
    mockAlbumFindUnique.mockResolvedValue(sampleAlbum);
    mockAlbumUpdate.mockResolvedValue({});

    const req = createGetRequest('/api/v1/photo-albums/' + ALBUM_ID);
    await GET(req, makeParams(ALBUM_ID));

    expect(mockAlbumUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: ALBUM_ID },
        data: { viewCount: { increment: 1 } },
      }),
    );
  });

  it('returns 404 for non-existent album', async () => {
    mockAlbumFindUnique.mockResolvedValue(null);

    const req = createGetRequest('/api/v1/photo-albums/non-existent');
    const res = await GET(req, makeParams('non-existent'));
    expect(res.status).toBe(404);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('NOT_FOUND');
  });

  it('excludes soft-deleted albums (deletedAt filter)', async () => {
    mockAlbumFindUnique.mockResolvedValue(null);

    const req = createGetRequest('/api/v1/photo-albums/' + ALBUM_ID);
    await GET(req, makeParams(ALBUM_ID));

    expect(mockAlbumFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: ALBUM_ID, deletedAt: null },
      }),
    );
  });

  it('includes photos ordered by sortOrder ascending', async () => {
    mockAlbumFindUnique.mockResolvedValue(sampleAlbum);
    mockAlbumUpdate.mockResolvedValue({});

    const req = createGetRequest('/api/v1/photo-albums/' + ALBUM_ID);
    await GET(req, makeParams(ALBUM_ID));

    const call = mockAlbumFindUnique.mock.calls[0]![0];
    expect(call.include.photos.orderBy).toEqual({ sortOrder: 'asc' });
  });
});

// ---------------------------------------------------------------------------
// 5–12. PATCH /api/v1/photo-albums/:id
// ---------------------------------------------------------------------------

describe('PATCH /api/v1/photo-albums/:id — Update metadata', () => {
  it('updates album title', async () => {
    mockAlbumFindUnique.mockResolvedValue(sampleAlbum);
    mockAlbumUpdate.mockResolvedValue({ ...sampleAlbum, title: 'Winter Gala 2026' });

    const req = createPatchRequest('/api/v1/photo-albums/' + ALBUM_ID, {
      title: 'Winter Gala 2026',
    });
    const res = await PATCH(req, makeParams(ALBUM_ID));
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { title: string } }>(res);
    expect(body.data.title).toBe('Winter Gala 2026');
  });

  it('updates album description', async () => {
    mockAlbumFindUnique.mockResolvedValue(sampleAlbum);
    mockAlbumUpdate.mockResolvedValue({ ...sampleAlbum, description: 'Updated desc' });

    const req = createPatchRequest('/api/v1/photo-albums/' + ALBUM_ID, {
      description: 'Updated desc',
    });
    const res = await PATCH(req, makeParams(ALBUM_ID));
    expect(res.status).toBe(200);
  });

  it('updates album category', async () => {
    mockAlbumFindUnique.mockResolvedValue(sampleAlbum);
    mockAlbumUpdate.mockResolvedValue({ ...sampleAlbum, category: 'community' });

    const req = createPatchRequest('/api/v1/photo-albums/' + ALBUM_ID, { category: 'community' });
    const res = await PATCH(req, makeParams(ALBUM_ID));
    expect(res.status).toBe(200);

    expect(mockAlbumUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ category: 'community' }),
      }),
    );
  });

  it('updates album visibility', async () => {
    mockAlbumFindUnique.mockResolvedValue(sampleAlbum);
    mockAlbumUpdate.mockResolvedValue({ ...sampleAlbum, visibility: 'staff_only' });

    const req = createPatchRequest('/api/v1/photo-albums/' + ALBUM_ID, {
      visibility: 'staff_only',
    });
    const res = await PATCH(req, makeParams(ALBUM_ID));
    expect(res.status).toBe(200);

    expect(mockAlbumUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ visibility: 'staff_only' }),
      }),
    );
  });

  it('rejects invalid category value', async () => {
    mockAlbumFindUnique.mockResolvedValue(sampleAlbum);

    const req = createPatchRequest('/api/v1/photo-albums/' + ALBUM_ID, { category: 'invalid_cat' });
    const res = await PATCH(req, makeParams(ALBUM_ID));
    expect(res.status).toBe(400);
  });

  it('rejects invalid visibility value', async () => {
    mockAlbumFindUnique.mockResolvedValue(sampleAlbum);

    const req = createPatchRequest('/api/v1/photo-albums/' + ALBUM_ID, { visibility: 'secret' });
    const res = await PATCH(req, makeParams(ALBUM_ID));
    expect(res.status).toBe(400);
  });

  it('returns 404 for non-existent album', async () => {
    mockAlbumFindUnique.mockResolvedValue(null);

    const req = createPatchRequest('/api/v1/photo-albums/non-existent', { title: 'New Title' });
    const res = await PATCH(req, makeParams('non-existent'));
    expect(res.status).toBe(404);
  });
});

describe('PATCH /api/v1/photo-albums/:id — Cover photo', () => {
  it('sets cover photo that belongs to the album', async () => {
    mockAlbumFindUnique.mockResolvedValue(sampleAlbum);
    mockPhotoFindUnique.mockResolvedValue({ id: PHOTO_ID, albumId: ALBUM_ID });
    mockAlbumUpdate.mockResolvedValue({ ...sampleAlbum, coverPhotoId: PHOTO_ID });

    const req = createPatchRequest('/api/v1/photo-albums/' + ALBUM_ID, { coverPhotoId: PHOTO_ID });
    const res = await PATCH(req, makeParams(ALBUM_ID));
    expect(res.status).toBe(200);

    expect(mockAlbumUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ coverPhotoId: PHOTO_ID }),
      }),
    );
  });

  it('rejects cover photo from another album', async () => {
    const otherPhotoId = '00000000-0000-4000-b000-000000000099';
    mockAlbumFindUnique.mockResolvedValue(sampleAlbum);
    mockPhotoFindUnique.mockResolvedValue({ id: otherPhotoId, albumId: 'other-album' });

    const req = createPatchRequest('/api/v1/photo-albums/' + ALBUM_ID, {
      coverPhotoId: otherPhotoId,
    });
    const res = await PATCH(req, makeParams(ALBUM_ID));
    expect(res.status).toBe(400);

    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('rejects cover photo that does not exist', async () => {
    const missingPhotoId = '00000000-0000-4000-b000-000000000088';
    mockAlbumFindUnique.mockResolvedValue(sampleAlbum);
    mockPhotoFindUnique.mockResolvedValue(null);

    const req = createPatchRequest('/api/v1/photo-albums/' + ALBUM_ID, {
      coverPhotoId: missingPhotoId,
    });
    const res = await PATCH(req, makeParams(ALBUM_ID));
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// 13–17. POST /api/v1/photo-albums/:id — Add photo
// ---------------------------------------------------------------------------

describe('POST /api/v1/photo-albums/:id — Add photo', () => {
  it('adds a photo to the album with filename, url, caption', async () => {
    mockAlbumFindUnique.mockResolvedValue(sampleAlbum);
    mockPhotoCreate.mockResolvedValue({
      id: 'new-photo',
      albumId: ALBUM_ID,
      filePath: '/uploads/new.jpg',
      caption: 'New photo',
      sortOrder: 0,
    });
    mockAlbumUpdate.mockResolvedValue({ photoCount: 3 });

    const req = createPostRequest('/api/v1/photo-albums/' + ALBUM_ID, {
      filename: 'new.jpg',
      url: '/uploads/new.jpg',
      caption: 'New photo',
    });
    const res = await POST(req, makeParams(ALBUM_ID));
    expect(res.status).toBe(201);

    const body = await parseResponse<{ data: { id: string; filename: string }; message: string }>(
      res,
    );
    expect(body.data.id).toBe('new-photo');
    expect(body.message).toBe('Photo added to album.');
  });

  it('sets uploadedBy from authenticated user', async () => {
    mockAlbumFindUnique.mockResolvedValue(sampleAlbum);
    mockPhotoCreate.mockResolvedValue({ id: 'new-photo' });
    mockAlbumUpdate.mockResolvedValue({});

    const req = createPostRequest('/api/v1/photo-albums/' + ALBUM_ID, {
      filename: 'photo.jpg',
      url: '/uploads/photo.jpg',
    });
    await POST(req, makeParams(ALBUM_ID));

    const createData = mockPhotoCreate.mock.calls[0]![0].data;
    expect(createData.uploadedBy).toBe(USER_ADMIN);
  });

  it('increments album photoCount after adding photo', async () => {
    mockAlbumFindUnique.mockResolvedValue(sampleAlbum);
    mockPhotoCreate.mockResolvedValue({ id: 'new-photo' });
    mockAlbumUpdate.mockResolvedValue({});

    const req = createPostRequest('/api/v1/photo-albums/' + ALBUM_ID, {
      filename: 'photo.jpg',
      url: '/uploads/photo.jpg',
    });
    await POST(req, makeParams(ALBUM_ID));

    expect(mockAlbumUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: ALBUM_ID },
        data: { photoCount: { increment: 1 } },
      }),
    );
  });

  it('returns 404 when adding photo to non-existent album', async () => {
    mockAlbumFindUnique.mockResolvedValue(null);

    const req = createPostRequest('/api/v1/photo-albums/non-existent', {
      filename: 'photo.jpg',
      url: '/uploads/photo.jpg',
    });
    const res = await POST(req, makeParams('non-existent'));
    expect(res.status).toBe(404);
  });

  it('rejects missing url field', async () => {
    const req = createPostRequest('/api/v1/photo-albums/' + ALBUM_ID, {
      filename: 'photo.jpg',
    });
    const res = await POST(req, makeParams(ALBUM_ID));
    expect(res.status).toBe(400);
  });

  it('rejects missing filename field', async () => {
    const req = createPostRequest('/api/v1/photo-albums/' + ALBUM_ID, {
      url: '/uploads/photo.jpg',
    });
    const res = await POST(req, makeParams(ALBUM_ID));
    expect(res.status).toBe(400);
  });

  it('defaults sortOrder to 0 when not specified', async () => {
    mockAlbumFindUnique.mockResolvedValue(sampleAlbum);
    mockPhotoCreate.mockResolvedValue({ id: 'new-photo' });
    mockAlbumUpdate.mockResolvedValue({});

    const req = createPostRequest('/api/v1/photo-albums/' + ALBUM_ID, {
      filename: 'photo.jpg',
      url: '/uploads/photo.jpg',
    });
    await POST(req, makeParams(ALBUM_ID));

    const createData = mockPhotoCreate.mock.calls[0]![0].data;
    expect(createData.sortOrder).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 18–19. DELETE /api/v1/photo-albums/:id — Soft delete
// ---------------------------------------------------------------------------

describe('DELETE /api/v1/photo-albums/:id', () => {
  it('soft-deletes album by setting deletedAt', async () => {
    mockAlbumFindUnique.mockResolvedValue(sampleAlbum);
    mockAlbumUpdate.mockResolvedValue({ ...sampleAlbum, deletedAt: new Date() });

    const req = createDeleteRequest('/api/v1/photo-albums/' + ALBUM_ID);
    const res = await DELETE(req, makeParams(ALBUM_ID));
    expect(res.status).toBe(200);

    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toBe('Album deleted.');

    const updateCall = mockAlbumUpdate.mock.calls[0]![0];
    expect(updateCall.data.deletedAt).toBeInstanceOf(Date);
  });

  it('returns 404 for non-existent album', async () => {
    mockAlbumFindUnique.mockResolvedValue(null);

    const req = createDeleteRequest('/api/v1/photo-albums/non-existent');
    const res = await DELETE(req, makeParams('non-existent'));
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// 20. Tenant isolation
// ---------------------------------------------------------------------------

describe('Tenant isolation', () => {
  it('GET scopes query with deletedAt: null', async () => {
    mockAlbumFindUnique.mockResolvedValue(null);

    const req = createGetRequest('/api/v1/photo-albums/' + ALBUM_ID);
    await GET(req, makeParams(ALBUM_ID));

    expect(mockAlbumFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ deletedAt: null }),
      }),
    );
  });

  it('PATCH verifies album exists and is not deleted', async () => {
    mockAlbumFindUnique.mockResolvedValue(null);

    const req = createPatchRequest('/api/v1/photo-albums/' + ALBUM_ID, { title: 'New' });
    const res = await PATCH(req, makeParams(ALBUM_ID));
    expect(res.status).toBe(404);

    expect(mockAlbumFindUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ deletedAt: null }),
      }),
    );
  });

  it('DELETE verifies album exists and is not already deleted', async () => {
    mockAlbumFindUnique.mockResolvedValue(null);

    const req = createDeleteRequest('/api/v1/photo-albums/' + ALBUM_ID);
    const res = await DELETE(req, makeParams(ALBUM_ID));
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// 21. Role-based access
// ---------------------------------------------------------------------------

describe('Role-based access', () => {
  it('PATCH requires admin role', async () => {
    mockAlbumFindUnique.mockResolvedValue(sampleAlbum);
    mockAlbumUpdate.mockResolvedValue({});

    const req = createPatchRequest('/api/v1/photo-albums/' + ALBUM_ID, { title: 'Updated' });
    await PATCH(req, makeParams(ALBUM_ID));

    expect(mockGuardRoute).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        roles: ['super_admin', 'property_admin'],
      }),
    );
  });

  it('POST requires admin role', async () => {
    mockAlbumFindUnique.mockResolvedValue(sampleAlbum);
    mockPhotoCreate.mockResolvedValue({ id: 'p' });
    mockAlbumUpdate.mockResolvedValue({});

    const req = createPostRequest('/api/v1/photo-albums/' + ALBUM_ID, {
      filename: 'f.jpg',
      url: '/u/f.jpg',
    });
    await POST(req, makeParams(ALBUM_ID));

    expect(mockGuardRoute).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        roles: ['super_admin', 'property_admin'],
      }),
    );
  });

  it('DELETE requires admin role', async () => {
    mockAlbumFindUnique.mockResolvedValue(sampleAlbum);
    mockAlbumUpdate.mockResolvedValue({});

    const req = createDeleteRequest('/api/v1/photo-albums/' + ALBUM_ID);
    await DELETE(req, makeParams(ALBUM_ID));

    expect(mockGuardRoute).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        roles: ['super_admin', 'property_admin'],
      }),
    );
  });

  it('rejects non-admin when guardRoute returns error', async () => {
    const { NextResponse } = await import('next/server');
    mockGuardRoute.mockResolvedValue({
      user: null,
      error: NextResponse.json(
        { error: 'FORBIDDEN', message: 'Insufficient permissions' },
        { status: 403 },
      ),
    });

    const req = createPatchRequest('/api/v1/photo-albums/' + ALBUM_ID, { title: 'Nope' });
    const res = await PATCH(req, makeParams(ALBUM_ID));
    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// 22. XSS sanitization
// ---------------------------------------------------------------------------

describe('XSS sanitization', () => {
  it('strips HTML from title on PATCH', async () => {
    mockAlbumFindUnique.mockResolvedValue(sampleAlbum);
    mockAlbumUpdate.mockResolvedValue({});

    const req = createPatchRequest('/api/v1/photo-albums/' + ALBUM_ID, {
      title: '<script>alert("xss")</script>Clean Title',
    });
    await PATCH(req, makeParams(ALBUM_ID));

    const updateData = mockAlbumUpdate.mock.calls[0]![0].data;
    expect(updateData.title).not.toContain('<script>');
    expect(updateData.title).toContain('Clean Title');
  });

  it('strips HTML from description on PATCH', async () => {
    mockAlbumFindUnique.mockResolvedValue(sampleAlbum);
    mockAlbumUpdate.mockResolvedValue({});

    const req = createPatchRequest('/api/v1/photo-albums/' + ALBUM_ID, {
      description: '<img onerror="alert(1)">Safe description',
    });
    await PATCH(req, makeParams(ALBUM_ID));

    const updateData = mockAlbumUpdate.mock.calls[0]![0].data;
    expect(updateData.description).not.toContain('<img');
  });
});

// ---------------------------------------------------------------------------
// 23. Error handling
// ---------------------------------------------------------------------------

describe('Error handling', () => {
  it('handles database error on GET without leaking internals', async () => {
    mockAlbumFindUnique.mockRejectedValue(new Error('connection pool exhausted'));

    const req = createGetRequest('/api/v1/photo-albums/' + ALBUM_ID);
    const res = await GET(req, makeParams(ALBUM_ID));
    expect(res.status).toBe(500);

    const body = await parseResponse<{ error: string; message: string }>(res);
    expect(body.error).toBe('INTERNAL_ERROR');
    expect(body.message).not.toContain('connection pool');
  });

  it('handles database error on PATCH without leaking internals', async () => {
    mockAlbumFindUnique.mockResolvedValue(sampleAlbum);
    mockAlbumUpdate.mockRejectedValue(new Error('deadlock detected'));

    const req = createPatchRequest('/api/v1/photo-albums/' + ALBUM_ID, { title: 'Updated' });
    const res = await PATCH(req, makeParams(ALBUM_ID));
    expect(res.status).toBe(500);

    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).not.toContain('deadlock');
  });

  it('handles database error on POST without leaking internals', async () => {
    mockAlbumFindUnique.mockResolvedValue(sampleAlbum);
    mockPhotoCreate.mockRejectedValue(new Error('disk full'));

    const req = createPostRequest('/api/v1/photo-albums/' + ALBUM_ID, {
      filename: 'f.jpg',
      url: '/u/f.jpg',
    });
    const res = await POST(req, makeParams(ALBUM_ID));
    expect(res.status).toBe(500);

    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).not.toContain('disk full');
  });

  it('handles database error on DELETE without leaking internals', async () => {
    mockAlbumFindUnique.mockResolvedValue(sampleAlbum);
    mockAlbumUpdate.mockRejectedValue(new Error('FK constraint'));

    const req = createDeleteRequest('/api/v1/photo-albums/' + ALBUM_ID);
    const res = await DELETE(req, makeParams(ALBUM_ID));
    expect(res.status).toBe(500);

    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).not.toContain('FK constraint');
  });
});
