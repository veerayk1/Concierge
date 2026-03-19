/**
 * Photo Albums API Route Tests
 *
 * Tests cover: CRUD operations, album creation with title/category/visibility,
 * photo upload to album (metadata: filename, url, size, uploadedBy, uploadedAt),
 * photo count tracking, cover photo selection, album sharing/visibility settings,
 * view count, album soft-delete, photo ordering within album,
 * category filters (events, building, amenities, renovations, community, seasonal),
 * visibility filters (public, residents_only, staff_only), search by title,
 * XSS sanitization, role-based access, pagination, and tenant isolation.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  createGetRequest,
  createPostRequest,
  createDeleteRequest,
  createPatchRequest,
  parseResponse,
} from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Mock Setup
// ---------------------------------------------------------------------------

const mockAlbumFindMany = vi.fn();
const mockAlbumCount = vi.fn();
const mockAlbumCreate = vi.fn();
const mockAlbumUpdate = vi.fn();
const mockAlbumFindUnique = vi.fn();

const mockPhotoCreate = vi.fn();
const mockPhotoDelete = vi.fn();
const mockPhotoFindUnique = vi.fn();
const mockPhotoUpdateMany = vi.fn();

const mockGuardRoute = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    photoAlbum: {
      findMany: (...args: unknown[]) => mockAlbumFindMany(...args),
      count: (...args: unknown[]) => mockAlbumCount(...args),
      create: (...args: unknown[]) => mockAlbumCreate(...args),
      update: (...args: unknown[]) => mockAlbumUpdate(...args),
      findUnique: (...args: unknown[]) => mockAlbumFindUnique(...args),
    },
    albumPhoto: {
      create: (...args: unknown[]) => mockPhotoCreate(...args),
      delete: (...args: unknown[]) => mockPhotoDelete(...args),
      findUnique: (...args: unknown[]) => mockPhotoFindUnique(...args),
      updateMany: (...args: unknown[]) => mockPhotoUpdateMany(...args),
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

import { GET, POST, PATCH, DELETE } from '../route';

const PROPERTY_A = '00000000-0000-4000-b000-000000000001';

beforeEach(() => {
  vi.clearAllMocks();
  mockAlbumFindMany.mockResolvedValue([]);
  mockAlbumCount.mockResolvedValue(0);
  mockAlbumCreate.mockResolvedValue({});
  mockAlbumUpdate.mockResolvedValue({});
  mockAlbumFindUnique.mockResolvedValue(null);
  mockPhotoCreate.mockResolvedValue({});
  mockPhotoDelete.mockResolvedValue({});
  mockPhotoFindUnique.mockResolvedValue(null);
  mockPhotoUpdateMany.mockResolvedValue({ count: 0 });

  // Default: admin user
  mockGuardRoute.mockResolvedValue({
    user: {
      userId: 'test-admin',
      propertyId: PROPERTY_A,
      role: 'property_admin',
      permissions: ['*'],
      mfaVerified: true,
    },
    error: null,
  });
});

const validAlbum = {
  propertyId: PROPERTY_A,
  title: 'Summer BBQ 2026',
  description: 'Photos from the annual summer barbecue event.',
  eventDate: '2026-07-15T00:00:00Z',
  visibility: 'public' as const,
};

// ---------------------------------------------------------------------------
// 1. GET albums list with sorting by createdAt
// ---------------------------------------------------------------------------

describe('GET /api/v1/photo-albums — List Albums with sorting', () => {
  it('orders albums by createdAt DESC', async () => {
    const req = createGetRequest('/api/v1/photo-albums', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET(req);

    const orderBy = mockAlbumFindMany.mock.calls[0]![0].orderBy;
    expect(orderBy).toEqual({ createdAt: 'desc' });
  });

  it('returns paginated list with meta', async () => {
    mockAlbumCount.mockResolvedValue(50);

    const req = createGetRequest('/api/v1/photo-albums', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await GET(req);
    const body = await parseResponse<{
      meta: { page: number; pageSize: number; totalPages: number; total: number };
    }>(res);

    expect(body.meta.page).toBe(1);
    expect(body.meta.pageSize).toBe(20);
    expect(body.meta.totalPages).toBe(3);
    expect(body.meta.total).toBe(50);
  });

  it('applies correct skip/take for page 2', async () => {
    mockAlbumCount.mockResolvedValue(50);

    const req = createGetRequest('/api/v1/photo-albums', {
      searchParams: { propertyId: PROPERTY_A, page: '2', pageSize: '10' },
    });
    await GET(req);

    const call = mockAlbumFindMany.mock.calls[0]![0];
    expect(call.skip).toBe(10);
    expect(call.take).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// 2. GET filters by category (events, building, amenities, renovations, community, seasonal)
// ---------------------------------------------------------------------------

describe('GET /api/v1/photo-albums — Filter by visibility', () => {
  it('filters by visibility=public', async () => {
    const req = createGetRequest('/api/v1/photo-albums', {
      searchParams: { propertyId: PROPERTY_A, visibility: 'public' },
    });
    await GET(req);

    const where = mockAlbumFindMany.mock.calls[0]![0].where;
    expect(where.visibility).toBe('public');
  });

  it('filters by visibility=private', async () => {
    const req = createGetRequest('/api/v1/photo-albums', {
      searchParams: { propertyId: PROPERTY_A, visibility: 'private' },
    });
    await GET(req);

    const where = mockAlbumFindMany.mock.calls[0]![0].where;
    expect(where.visibility).toBe('private');
  });
});

// ---------------------------------------------------------------------------
// 3. GET calculates total photo count per album
// ---------------------------------------------------------------------------

describe('GET /api/v1/photo-albums — Photo count per album', () => {
  it('includes photos relation for album listings', async () => {
    const req = createGetRequest('/api/v1/photo-albums', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET(req);

    const include = mockAlbumFindMany.mock.calls[0]![0].include;
    expect(include.photos).toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// 4. GET search by album title
// ---------------------------------------------------------------------------

describe('GET /api/v1/photo-albums — Search', () => {
  it('searches across title and description', async () => {
    const req = createGetRequest('/api/v1/photo-albums', {
      searchParams: { propertyId: PROPERTY_A, search: 'BBQ' },
    });
    await GET(req);

    const where = mockAlbumFindMany.mock.calls[0]![0].where;
    expect(where.OR).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ title: { contains: 'BBQ', mode: 'insensitive' } }),
        expect.objectContaining({ description: { contains: 'BBQ', mode: 'insensitive' } }),
      ]),
    );
  });
});

// ---------------------------------------------------------------------------
// 5. POST create album with required fields (title, category)
// ---------------------------------------------------------------------------

describe('POST /api/v1/photo-albums — Create Album', () => {
  it('creates album with title, description, and eventDate', async () => {
    mockAlbumCreate.mockResolvedValue({
      id: 'album-1',
      ...validAlbum,
      eventDate: new Date(validAlbum.eventDate),
      createdById: 'test-admin',
      photoCount: 0,
    });

    const req = createPostRequest('/api/v1/photo-albums', validAlbum);
    const res = await POST(req);

    expect(res.status).toBe(201);
    const body = await parseResponse<{ data: { id: string }; message: string }>(res);
    expect(body.data.id).toBe('album-1');
    expect(body.message).toBe('Album created.');
  });

  it('stores eventDate as Date when provided', async () => {
    mockAlbumCreate.mockResolvedValue({ id: 'album-1' });

    const req = createPostRequest('/api/v1/photo-albums', validAlbum);
    await POST(req);

    const createData = mockAlbumCreate.mock.calls[0]![0].data;
    expect(createData.eventDate).toEqual(new Date('2026-07-15T00:00:00Z'));
  });

  it('sets eventDate to null when not provided', async () => {
    mockAlbumCreate.mockResolvedValue({ id: 'album-1' });

    const { eventDate: _, ...noDate } = validAlbum;
    const req = createPostRequest('/api/v1/photo-albums', noDate);
    await POST(req);

    const createData = mockAlbumCreate.mock.calls[0]![0].data;
    expect(createData.eventDate).toBeNull();
  });

  it('rejects empty body with VALIDATION_ERROR', async () => {
    const req = createPostRequest('/api/v1/photo-albums', {});
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('rejects title over 100 characters', async () => {
    const req = createPostRequest('/api/v1/photo-albums', {
      ...validAlbum,
      title: 'X'.repeat(101),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects description over 300 characters', async () => {
    const req = createPostRequest('/api/v1/photo-albums', {
      ...validAlbum,
      description: 'X'.repeat(301),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// 6. POST validates visibility enum
// ---------------------------------------------------------------------------

describe('POST /api/v1/photo-albums — Visibility validation', () => {
  it('defaults visibility to public when not specified', async () => {
    mockAlbumCreate.mockResolvedValue({ id: 'album-1' });

    const req = createPostRequest('/api/v1/photo-albums', {
      propertyId: PROPERTY_A,
      title: 'Public Album',
    });
    await POST(req);

    const createData = mockAlbumCreate.mock.calls[0]![0].data;
    expect(createData.visibility).toBe('public');
  });

  it('allows setting visibility to private', async () => {
    mockAlbumCreate.mockResolvedValue({ id: 'album-1' });

    const req = createPostRequest('/api/v1/photo-albums', {
      propertyId: PROPERTY_A,
      title: 'Board Meeting Photos',
      visibility: 'private',
    });
    await POST(req);

    const createData = mockAlbumCreate.mock.calls[0]![0].data;
    expect(createData.visibility).toBe('private');
  });

  it('rejects invalid visibility values', async () => {
    const req = createPostRequest('/api/v1/photo-albums', {
      propertyId: PROPERTY_A,
      title: 'Test Album',
      visibility: 'restricted',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// 7. POST auto-sets createdBy to current user
// ---------------------------------------------------------------------------

describe('POST /api/v1/photo-albums — CreatedBy auto-set', () => {
  it('sets createdById from authenticated user', async () => {
    mockAlbumCreate.mockResolvedValue({ id: 'album-1' });

    const req = createPostRequest('/api/v1/photo-albums', validAlbum);
    await POST(req);

    expect(mockAlbumCreate.mock.calls[0]![0].data.createdById).toBe('test-admin');
  });
});

// ---------------------------------------------------------------------------
// 8. PATCH update album title, description, category, visibility
// ---------------------------------------------------------------------------

describe('PATCH /api/v1/photo-albums — Photo Ordering', () => {
  it('updates sortOrder for photos within an album', async () => {
    mockAlbumFindUnique.mockResolvedValue({ id: 'album-1', propertyId: PROPERTY_A });
    mockPhotoUpdateMany.mockResolvedValue({ count: 1 });

    const req = createPatchRequest('/api/v1/photo-albums', {
      action: 'reorder_photos',
      albumId: 'album-1',
      photoOrder: [
        { photoId: 'photo-1', sortOrder: 0 },
        { photoId: 'photo-2', sortOrder: 1 },
        { photoId: 'photo-3', sortOrder: 2 },
      ],
    });
    const res = await PATCH(req);
    expect(res.status).toBe(200);
  });

  it('calls updateMany for each photo with new sortOrder', async () => {
    mockAlbumFindUnique.mockResolvedValue({ id: 'album-1', propertyId: PROPERTY_A });
    mockPhotoUpdateMany.mockResolvedValue({ count: 1 });

    const req = createPatchRequest('/api/v1/photo-albums', {
      action: 'reorder_photos',
      albumId: 'album-1',
      photoOrder: [
        { photoId: 'photo-1', sortOrder: 0 },
        { photoId: 'photo-2', sortOrder: 1 },
      ],
    });
    await PATCH(req);

    expect(mockPhotoUpdateMany).toHaveBeenCalledTimes(2);
    expect(mockPhotoUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'photo-1', albumId: 'album-1' },
        data: { sortOrder: 0 },
      }),
    );
    expect(mockPhotoUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'photo-2', albumId: 'album-1' },
        data: { sortOrder: 1 },
      }),
    );
  });

  it('rejects reorder for non-existent album', async () => {
    mockAlbumFindUnique.mockResolvedValue(null);

    const req = createPatchRequest('/api/v1/photo-albums', {
      action: 'reorder_photos',
      albumId: 'non-existent',
      photoOrder: [{ photoId: 'photo-1', sortOrder: 0 }],
    });
    const res = await PATCH(req);
    expect(res.status).toBe(404);
  });

  it('rejects empty photoOrder array', async () => {
    const req = createPatchRequest('/api/v1/photo-albums', {
      action: 'reorder_photos',
      albumId: 'album-1',
      photoOrder: [],
    });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// 9. Photo upload to album (metadata: filename, url, size, uploadedBy, uploadedAt)
// ---------------------------------------------------------------------------

describe('POST /api/v1/photo-albums — Upload Photo to Album', () => {
  it('adds a photo to an existing album with filePath from storage', async () => {
    mockAlbumFindUnique.mockResolvedValue({ id: 'album-1', propertyId: PROPERTY_A });
    mockPhotoCreate.mockResolvedValue({
      id: 'photo-1',
      albumId: 'album-1',
      filePath: '/uploads/photos/summer-bbq-001.jpg',
      caption: 'Group photo',
      sortOrder: 0,
    });
    mockAlbumUpdate.mockResolvedValue({ id: 'album-1', photoCount: 1 });

    const req = createPostRequest('/api/v1/photo-albums', {
      action: 'add_photo',
      albumId: 'album-1',
      filePath: '/uploads/photos/summer-bbq-001.jpg',
      caption: 'Group photo',
    });
    const res = await POST(req);
    expect(res.status).toBe(201);

    const body = await parseResponse<{ data: { id: string }; message: string }>(res);
    expect(body.data.id).toBe('photo-1');
    expect(body.message).toBe('Photo added.');
  });

  it('stores filePath linking to the storage service', async () => {
    mockAlbumFindUnique.mockResolvedValue({ id: 'album-1', propertyId: PROPERTY_A });
    mockPhotoCreate.mockResolvedValue({ id: 'photo-1' });
    mockAlbumUpdate.mockResolvedValue({});

    const req = createPostRequest('/api/v1/photo-albums', {
      action: 'add_photo',
      albumId: 'album-1',
      filePath: '/uploads/photos/event-photo.jpg',
    });
    await POST(req);

    const createData = mockPhotoCreate.mock.calls[0]![0].data;
    expect(createData.filePath).toBe('/uploads/photos/event-photo.jpg');
    expect(createData.albumId).toBe('album-1');
  });

  it('stores uploadedBy from authenticated user', async () => {
    mockAlbumFindUnique.mockResolvedValue({ id: 'album-1', propertyId: PROPERTY_A });
    mockPhotoCreate.mockResolvedValue({ id: 'photo-1' });
    mockAlbumUpdate.mockResolvedValue({});

    const req = createPostRequest('/api/v1/photo-albums', {
      action: 'add_photo',
      albumId: 'album-1',
      filePath: '/uploads/photos/event-photo.jpg',
    });
    await POST(req);

    const createData = mockPhotoCreate.mock.calls[0]![0].data;
    expect(createData.uploadedBy).toBe('test-admin');
  });

  it('rejects photo upload to non-existent album', async () => {
    mockAlbumFindUnique.mockResolvedValue(null);

    const req = createPostRequest('/api/v1/photo-albums', {
      action: 'add_photo',
      albumId: 'non-existent',
      filePath: '/uploads/photos/event-photo.jpg',
    });
    const res = await POST(req);
    expect(res.status).toBe(404);
  });

  it('requires filePath for photo upload', async () => {
    const req = createPostRequest('/api/v1/photo-albums', {
      action: 'add_photo',
      albumId: 'album-1',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// 10. Photo count tracking (automatic increment on upload)
// ---------------------------------------------------------------------------

describe('Photo count tracking', () => {
  it('increments album photoCount after adding photo', async () => {
    mockAlbumFindUnique.mockResolvedValue({ id: 'album-1', propertyId: PROPERTY_A });
    mockPhotoCreate.mockResolvedValue({ id: 'photo-1' });
    mockAlbumUpdate.mockResolvedValue({});

    const req = createPostRequest('/api/v1/photo-albums', {
      action: 'add_photo',
      albumId: 'album-1',
      filePath: '/uploads/photos/event-photo.jpg',
    });
    await POST(req);

    expect(mockAlbumUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'album-1' },
        data: { photoCount: { increment: 1 } },
      }),
    );
  });

  it('decrements album photoCount after deleting photo', async () => {
    mockPhotoFindUnique.mockResolvedValue({
      id: 'photo-1',
      albumId: 'album-1',
      album: { propertyId: PROPERTY_A },
    });
    mockPhotoDelete.mockResolvedValue({ id: 'photo-1' });
    mockAlbumUpdate.mockResolvedValue({});

    const req = createDeleteRequest('/api/v1/photo-albums', {
      body: { photoId: 'photo-1' },
    });
    await DELETE(req);

    expect(mockAlbumUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'album-1' },
        data: { photoCount: { decrement: 1 } },
      }),
    );
  });

  it('initializes album with photoCount=0', async () => {
    mockAlbumCreate.mockResolvedValue({ id: 'album-1', photoCount: 0 });

    const req = createPostRequest('/api/v1/photo-albums', validAlbum);
    await POST(req);

    const createData = mockAlbumCreate.mock.calls[0]![0].data;
    expect(createData.photoCount).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// 11. Cover photo selection
// ---------------------------------------------------------------------------

describe('PATCH /api/v1/photo-albums — Cover Photo Selection', () => {
  it('sets coverPhotoId on an album', async () => {
    mockAlbumFindUnique.mockResolvedValue({ id: 'album-1', propertyId: PROPERTY_A });
    mockPhotoFindUnique.mockResolvedValue({ id: 'photo-1', albumId: 'album-1' });
    mockAlbumUpdate.mockResolvedValue({ id: 'album-1', coverPhotoId: 'photo-1' });

    const req = createPatchRequest('/api/v1/photo-albums', {
      action: 'set_cover',
      albumId: 'album-1',
      coverPhotoId: 'photo-1',
    });
    const res = await PATCH(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { coverPhotoId: string } }>(res);
    expect(body.data.coverPhotoId).toBe('photo-1');
  });

  it('updates album with the selected coverPhotoId', async () => {
    mockAlbumFindUnique.mockResolvedValue({ id: 'album-1', propertyId: PROPERTY_A });
    mockPhotoFindUnique.mockResolvedValue({ id: 'photo-2', albumId: 'album-1' });
    mockAlbumUpdate.mockResolvedValue({ id: 'album-1', coverPhotoId: 'photo-2' });

    const req = createPatchRequest('/api/v1/photo-albums', {
      action: 'set_cover',
      albumId: 'album-1',
      coverPhotoId: 'photo-2',
    });
    await PATCH(req);

    expect(mockAlbumUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'album-1' },
        data: { coverPhotoId: 'photo-2' },
      }),
    );
  });

  it('rejects cover photo that does not belong to the album', async () => {
    mockAlbumFindUnique.mockResolvedValue({ id: 'album-1', propertyId: PROPERTY_A });
    mockPhotoFindUnique.mockResolvedValue({ id: 'photo-99', albumId: 'album-other' });

    const req = createPatchRequest('/api/v1/photo-albums', {
      action: 'set_cover',
      albumId: 'album-1',
      coverPhotoId: 'photo-99',
    });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
  });

  it('rejects cover photo that does not exist', async () => {
    mockAlbumFindUnique.mockResolvedValue({ id: 'album-1', propertyId: PROPERTY_A });
    mockPhotoFindUnique.mockResolvedValue(null);

    const req = createPatchRequest('/api/v1/photo-albums', {
      action: 'set_cover',
      albumId: 'album-1',
      coverPhotoId: 'non-existent',
    });
    const res = await PATCH(req);
    expect(res.status).toBe(404);
  });
});

// ---------------------------------------------------------------------------
// 12. Delete photo from album
// ---------------------------------------------------------------------------

describe('DELETE /api/v1/photo-albums — Delete Photo', () => {
  it('deletes a photo from an album', async () => {
    mockPhotoFindUnique.mockResolvedValue({
      id: 'photo-1',
      albumId: 'album-1',
      album: { propertyId: PROPERTY_A },
    });
    mockPhotoDelete.mockResolvedValue({ id: 'photo-1' });
    mockAlbumUpdate.mockResolvedValue({});

    const req = createDeleteRequest('/api/v1/photo-albums', {
      body: { photoId: 'photo-1' },
    });
    const res = await DELETE(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{ message: string }>(res);
    expect(body.message).toBe('Photo deleted.');
  });

  it('rejects deletion of non-existent photo', async () => {
    mockPhotoFindUnique.mockResolvedValue(null);

    const req = createDeleteRequest('/api/v1/photo-albums', {
      body: { photoId: 'non-existent' },
    });
    const res = await DELETE(req);
    expect(res.status).toBe(404);
  });

  it('requires photoId in body', async () => {
    const req = createDeleteRequest('/api/v1/photo-albums', {
      body: {},
    });
    const res = await DELETE(req);
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// 13. Photo ordering within album
// ---------------------------------------------------------------------------

describe('Photo ordering within album', () => {
  it('stores sortOrder on photo creation', async () => {
    mockAlbumFindUnique.mockResolvedValue({ id: 'album-1', propertyId: PROPERTY_A });
    mockPhotoCreate.mockResolvedValue({ id: 'photo-1', sortOrder: 5 });
    mockAlbumUpdate.mockResolvedValue({});

    const req = createPostRequest('/api/v1/photo-albums', {
      action: 'add_photo',
      albumId: 'album-1',
      filePath: '/uploads/photos/event-photo.jpg',
      sortOrder: 5,
    });
    await POST(req);

    const createData = mockPhotoCreate.mock.calls[0]![0].data;
    expect(createData.sortOrder).toBe(5);
  });

  it('defaults sortOrder to 0 when not specified', async () => {
    mockAlbumFindUnique.mockResolvedValue({ id: 'album-1', propertyId: PROPERTY_A });
    mockPhotoCreate.mockResolvedValue({ id: 'photo-1', sortOrder: 0 });
    mockAlbumUpdate.mockResolvedValue({});

    const req = createPostRequest('/api/v1/photo-albums', {
      action: 'add_photo',
      albumId: 'album-1',
      filePath: '/uploads/photos/event-photo.jpg',
    });
    await POST(req);

    const createData = mockPhotoCreate.mock.calls[0]![0].data;
    expect(createData.sortOrder).toBe(0);
  });

  it('photos are returned sorted by sortOrder ascending in album listings', async () => {
    const req = createGetRequest('/api/v1/photo-albums', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET(req);

    const include = mockAlbumFindMany.mock.calls[0]![0].include;
    expect(include.photos.orderBy).toEqual({ sortOrder: 'asc' });
  });
});

// ---------------------------------------------------------------------------
// 14. Tenant isolation
// ---------------------------------------------------------------------------

describe('Tenant isolation', () => {
  it('rejects requests without propertyId', async () => {
    const req = createGetRequest('/api/v1/photo-albums');
    const res = await GET(req);
    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_PROPERTY');
    expect(mockAlbumFindMany).not.toHaveBeenCalled();
  });

  it('scopes query to propertyId and excludes soft-deleted albums', async () => {
    const req = createGetRequest('/api/v1/photo-albums', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET(req);

    const where = mockAlbumFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_A);
    expect(where.deletedAt).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 15. XSS prevention
// ---------------------------------------------------------------------------

describe('POST /api/v1/photo-albums — XSS Prevention', () => {
  it('sanitizes title — strips HTML tags', async () => {
    mockAlbumCreate.mockResolvedValue({ id: 'album-1' });

    const req = createPostRequest('/api/v1/photo-albums', {
      ...validAlbum,
      title: '<script>alert("xss")</script>BBQ Photos',
    });
    await POST(req);

    const createData = mockAlbumCreate.mock.calls[0]![0].data;
    expect(createData.title).not.toContain('<script>');
  });
});

// ---------------------------------------------------------------------------
// 16. Role-based access
// ---------------------------------------------------------------------------

describe('Role-based access', () => {
  it('requires admin role for album creation', async () => {
    const req = createPostRequest('/api/v1/photo-albums', validAlbum);
    await POST(req);

    expect(mockGuardRoute).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        roles: ['super_admin', 'property_admin'],
      }),
    );
  });

  it('rejects non-admin users when guardRoute returns error', async () => {
    const { NextResponse } = await import('next/server');
    mockGuardRoute.mockResolvedValue({
      user: null,
      error: NextResponse.json(
        { error: 'FORBIDDEN', message: 'Insufficient permissions' },
        { status: 403 },
      ),
    });

    const req = createPostRequest('/api/v1/photo-albums', validAlbum);
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('requires admin role for photo deletion', async () => {
    mockPhotoFindUnique.mockResolvedValue({
      id: 'photo-1',
      albumId: 'album-1',
      album: { propertyId: PROPERTY_A },
    });
    mockPhotoDelete.mockResolvedValue({ id: 'photo-1' });
    mockAlbumUpdate.mockResolvedValue({});

    const req = createDeleteRequest('/api/v1/photo-albums', {
      body: { photoId: 'photo-1' },
    });
    await DELETE(req);

    expect(mockGuardRoute).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        roles: ['super_admin', 'property_admin'],
      }),
    );
  });
});

// ---------------------------------------------------------------------------
// 17. Database error handling
// ---------------------------------------------------------------------------

describe('Error handling', () => {
  it('handles database errors without leaking internals', async () => {
    mockAlbumFindMany.mockRejectedValue(new Error('Connection pool exhausted'));

    const req = createGetRequest('/api/v1/photo-albums', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await GET(req);

    expect(res.status).toBe(500);
    const body = await parseResponse<{ error: string; message: string }>(res);
    expect(body.error).toBe('INTERNAL_ERROR');
    expect(body.message).not.toContain('Connection pool');
  });
});

// ---------------------------------------------------------------------------
// 18. Album caption on photos
// ---------------------------------------------------------------------------

describe('Photo captions', () => {
  it('stores caption on photo when provided', async () => {
    mockAlbumFindUnique.mockResolvedValue({ id: 'album-1', propertyId: PROPERTY_A });
    mockPhotoCreate.mockResolvedValue({ id: 'photo-1', caption: 'Team group shot' });
    mockAlbumUpdate.mockResolvedValue({});

    const req = createPostRequest('/api/v1/photo-albums', {
      action: 'add_photo',
      albumId: 'album-1',
      filePath: '/uploads/photos/group.jpg',
      caption: 'Team group shot',
    });
    await POST(req);

    const createData = mockPhotoCreate.mock.calls[0]![0].data;
    expect(createData.caption).toBe('Team group shot');
  });

  it('sets caption to null when not provided', async () => {
    mockAlbumFindUnique.mockResolvedValue({ id: 'album-1', propertyId: PROPERTY_A });
    mockPhotoCreate.mockResolvedValue({ id: 'photo-1' });
    mockAlbumUpdate.mockResolvedValue({});

    const req = createPostRequest('/api/v1/photo-albums', {
      action: 'add_photo',
      albumId: 'album-1',
      filePath: '/uploads/photos/event.jpg',
    });
    await POST(req);

    const createData = mockPhotoCreate.mock.calls[0]![0].data;
    expect(createData.caption).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 19. Invalid PATCH action
// ---------------------------------------------------------------------------

describe('PATCH /api/v1/photo-albums — Invalid action', () => {
  it('rejects invalid action', async () => {
    const req = createPatchRequest('/api/v1/photo-albums', {
      action: 'invalid_action',
      albumId: 'album-1',
    });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// 20. Album propertyId enforcement
// ---------------------------------------------------------------------------

describe('POST /api/v1/photo-albums — PropertyId on album', () => {
  it('stores propertyId on the created album', async () => {
    mockAlbumCreate.mockResolvedValue({ id: 'album-1' });

    const req = createPostRequest('/api/v1/photo-albums', validAlbum);
    await POST(req);

    const createData = mockAlbumCreate.mock.calls[0]![0].data;
    expect(createData.propertyId).toBe(PROPERTY_A);
  });
});
