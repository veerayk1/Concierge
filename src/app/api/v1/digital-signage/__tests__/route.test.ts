/**
 * Digital Signage API Route Tests
 *
 * Digital signage powers lobby screens, elevator displays, and mailroom
 * monitors. Content rotates on a schedule with priority ordering.
 * Property managers create content that automatically shows and hides
 * based on startDate/endDate.
 *
 * Security context: Only admins can create/manage signage content.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
  createGetRequest,
  createPostRequest,
  createPatchRequest,
  parseResponse,
} from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Mock Setup
// ---------------------------------------------------------------------------

const mockContentFindMany = vi.fn();
const mockContentCount = vi.fn();
const mockContentCreate = vi.fn();
const mockContentUpdate = vi.fn();

const mockGuardRoute = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    digitalSignageContent: {
      findMany: (...args: unknown[]) => mockContentFindMany(...args),
      count: (...args: unknown[]) => mockContentCount(...args),
      create: (...args: unknown[]) => mockContentCreate(...args),
      update: (...args: unknown[]) => mockContentUpdate(...args),
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

import { GET, POST, PATCH } from '../route';

const PROPERTY_A = '00000000-0000-4000-b000-000000000001';

beforeEach(() => {
  vi.clearAllMocks();
  mockContentFindMany.mockResolvedValue([]);
  mockContentCount.mockResolvedValue(0);
  mockContentCreate.mockResolvedValue({});
  mockContentUpdate.mockResolvedValue({});

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

// ---------------------------------------------------------------------------
// 1. Create display content (announcement, event, weather)
// ---------------------------------------------------------------------------

describe('POST /api/v1/digital-signage — Create Display Content', () => {
  const validContent = {
    propertyId: PROPERTY_A,
    title: 'Lobby Renovation Notice',
    contentType: 'announcement',
    body: 'The lobby will be under renovation from March 20 to April 5.',
    zone: 'lobby',
    priority: 5,
    durationSeconds: 15,
    startDate: '2026-03-20T00:00:00Z',
    endDate: '2026-04-05T23:59:59Z',
  };

  it('creates display content with all fields', async () => {
    mockContentCreate.mockResolvedValue({
      id: 'content-1',
      ...validContent,
      startDate: new Date(validContent.startDate),
      endDate: new Date(validContent.endDate),
      createdById: 'test-admin',
      isActive: true,
    });

    const req = createPostRequest('/api/v1/digital-signage', validContent);
    const res = await POST(req);

    expect(res.status).toBe(201);
    const body = await parseResponse<{ data: { id: string }; message: string }>(res);
    expect(body.data.id).toBe('content-1');
    expect(body.message).toBe('Signage content created.');
  });

  it('sets createdById from authenticated user', async () => {
    mockContentCreate.mockResolvedValue({ id: 'content-1' });

    const req = createPostRequest('/api/v1/digital-signage', validContent);
    await POST(req);

    expect(mockContentCreate.mock.calls[0]![0].data.createdById).toBe('test-admin');
  });

  it('rejects empty body with VALIDATION_ERROR', async () => {
    const req = createPostRequest('/api/v1/digital-signage', {});
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
  });

  it('requires admin role', async () => {
    mockContentCreate.mockResolvedValue({ id: 'content-1' });

    const req = createPostRequest('/api/v1/digital-signage', validContent);
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

    const req = createPostRequest('/api/v1/digital-signage', validContent);
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('sanitizes title — XSS prevention', async () => {
    mockContentCreate.mockResolvedValue({ id: 'content-1' });

    const req = createPostRequest('/api/v1/digital-signage', {
      ...validContent,
      title: '<script>alert("xss")</script>Notice',
    });
    await POST(req);

    const createData = mockContentCreate.mock.calls[0]![0].data;
    expect(createData.title).not.toContain('<script>');
  });

  it('sanitizes body — XSS prevention', async () => {
    mockContentCreate.mockResolvedValue({ id: 'content-1' });

    const req = createPostRequest('/api/v1/digital-signage', {
      ...validContent,
      body: '<img onerror="alert(1)" src="">Important info',
    });
    await POST(req);

    const createData = mockContentCreate.mock.calls[0]![0].data;
    expect(createData.body).not.toContain('onerror');
  });

  it('handles database errors without leaking internals', async () => {
    mockContentCreate.mockRejectedValue(new Error('FK constraint: propertyId not found'));

    const req = createPostRequest('/api/v1/digital-signage', validContent);
    const res = await POST(req);

    expect(res.status).toBe(500);
    const body = await parseResponse<{ error: string; message: string }>(res);
    expect(body.error).toBe('INTERNAL_ERROR');
    expect(body.message).not.toContain('FK constraint');
  });
});

// ---------------------------------------------------------------------------
// 2. Content scheduling: show between startDate and endDate
// ---------------------------------------------------------------------------

describe('POST /api/v1/digital-signage — Content Scheduling', () => {
  it('stores startDate and endDate as Date objects', async () => {
    mockContentCreate.mockResolvedValue({ id: 'content-1' });

    const req = createPostRequest('/api/v1/digital-signage', {
      propertyId: PROPERTY_A,
      title: 'Scheduled Notice',
      contentType: 'text',
      body: 'Scheduled content body.',
      zone: 'lobby',
      startDate: '2026-04-01T09:00:00Z',
      endDate: '2026-04-15T18:00:00Z',
    });
    await POST(req);

    const createData = mockContentCreate.mock.calls[0]![0].data;
    expect(createData.startDate).toEqual(new Date('2026-04-01T09:00:00Z'));
    expect(createData.endDate).toEqual(new Date('2026-04-15T18:00:00Z'));
  });

  it('rejects when endDate is before startDate', async () => {
    const req = createPostRequest('/api/v1/digital-signage', {
      propertyId: PROPERTY_A,
      title: 'Invalid Dates',
      contentType: 'text',
      body: 'This should fail.',
      zone: 'lobby',
      startDate: '2026-04-15T00:00:00Z',
      endDate: '2026-04-01T00:00:00Z',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('requires both startDate and endDate', async () => {
    const req = createPostRequest('/api/v1/digital-signage', {
      propertyId: PROPERTY_A,
      title: 'Missing Dates',
      contentType: 'text',
      body: 'This should fail.',
      zone: 'lobby',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('GET filters active content by current date range when active=true', async () => {
    const req = createGetRequest('/api/v1/digital-signage', {
      searchParams: { propertyId: PROPERTY_A, active: 'true' },
    });
    await GET(req);

    const where = mockContentFindMany.mock.calls[0]![0].where;
    expect(where.startDate).toBeDefined();
    expect(where.endDate).toBeDefined();
    expect(where.isActive).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// 3. Content rotation: multiple items cycle every N seconds
// ---------------------------------------------------------------------------

describe('POST /api/v1/digital-signage — Content Rotation', () => {
  it('stores durationSeconds for rotation timing', async () => {
    mockContentCreate.mockResolvedValue({ id: 'content-1' });

    const req = createPostRequest('/api/v1/digital-signage', {
      propertyId: PROPERTY_A,
      title: 'Rotating Content',
      contentType: 'text',
      body: 'This content rotates.',
      zone: 'lobby',
      durationSeconds: 30,
      startDate: '2026-04-01T00:00:00Z',
      endDate: '2026-04-30T23:59:59Z',
    });
    await POST(req);

    const createData = mockContentCreate.mock.calls[0]![0].data;
    expect(createData.durationSeconds).toBe(30);
  });

  it('defaults durationSeconds to 10 when not specified', async () => {
    mockContentCreate.mockResolvedValue({ id: 'content-1' });

    const req = createPostRequest('/api/v1/digital-signage', {
      propertyId: PROPERTY_A,
      title: 'Default Duration',
      contentType: 'text',
      body: 'Default rotation speed.',
      zone: 'lobby',
      startDate: '2026-04-01T00:00:00Z',
      endDate: '2026-04-30T23:59:59Z',
    });
    await POST(req);

    const createData = mockContentCreate.mock.calls[0]![0].data;
    expect(createData.durationSeconds).toBe(10);
  });

  it('rejects durationSeconds less than 5', async () => {
    const req = createPostRequest('/api/v1/digital-signage', {
      propertyId: PROPERTY_A,
      title: 'Too Fast',
      contentType: 'text',
      body: 'This is too fast.',
      zone: 'lobby',
      durationSeconds: 2,
      startDate: '2026-04-01T00:00:00Z',
      endDate: '2026-04-30T23:59:59Z',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects durationSeconds over 300', async () => {
    const req = createPostRequest('/api/v1/digital-signage', {
      propertyId: PROPERTY_A,
      title: 'Too Slow',
      contentType: 'text',
      body: 'This is too slow.',
      zone: 'lobby',
      durationSeconds: 301,
      startDate: '2026-04-01T00:00:00Z',
      endDate: '2026-04-30T23:59:59Z',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('GET returns content ordered by priority then startDate for rotation', async () => {
    const req = createGetRequest('/api/v1/digital-signage', {
      searchParams: { propertyId: PROPERTY_A, zone: 'lobby' },
    });
    await GET(req);

    const orderBy = mockContentFindMany.mock.calls[0]![0].orderBy;
    expect(orderBy).toEqual([{ priority: 'desc' }, { startDate: 'asc' }]);
  });
});

// ---------------------------------------------------------------------------
// 4. Content types: text, image, announcement, event, weather
// ---------------------------------------------------------------------------

describe('POST /api/v1/digital-signage — Content Types', () => {
  const baseContent = {
    propertyId: PROPERTY_A,
    title: 'Test Content',
    zone: 'lobby',
    startDate: '2026-04-01T00:00:00Z',
    endDate: '2026-04-30T23:59:59Z',
  };

  it('accepts contentType=text with body', async () => {
    mockContentCreate.mockResolvedValue({ id: 'c-1' });

    const req = createPostRequest('/api/v1/digital-signage', {
      ...baseContent,
      contentType: 'text',
      body: 'Welcome to our building!',
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('accepts contentType=image with imageUrl', async () => {
    mockContentCreate.mockResolvedValue({ id: 'c-2' });

    const req = createPostRequest('/api/v1/digital-signage', {
      ...baseContent,
      contentType: 'image',
      imageUrl: '/uploads/signage/lobby-welcome.jpg',
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('accepts contentType=announcement', async () => {
    mockContentCreate.mockResolvedValue({ id: 'c-3' });

    const req = createPostRequest('/api/v1/digital-signage', {
      ...baseContent,
      contentType: 'announcement',
      body: 'Fire drill on Thursday at 2pm.',
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('accepts contentType=event', async () => {
    mockContentCreate.mockResolvedValue({ id: 'c-4' });

    const req = createPostRequest('/api/v1/digital-signage', {
      ...baseContent,
      contentType: 'event',
      body: 'Summer BBQ this Saturday at 3pm in the courtyard.',
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('accepts contentType=weather', async () => {
    mockContentCreate.mockResolvedValue({ id: 'c-5' });

    const req = createPostRequest('/api/v1/digital-signage', {
      ...baseContent,
      contentType: 'weather',
      body: 'Current conditions for the building area.',
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('rejects invalid contentType', async () => {
    const req = createPostRequest('/api/v1/digital-signage', {
      ...baseContent,
      contentType: 'video',
      body: 'This should fail.',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('stores imageUrl for image content type', async () => {
    mockContentCreate.mockResolvedValue({ id: 'c-2' });

    const req = createPostRequest('/api/v1/digital-signage', {
      ...baseContent,
      contentType: 'image',
      imageUrl: '/uploads/signage/lobby-welcome.jpg',
    });
    await POST(req);

    const createData = mockContentCreate.mock.calls[0]![0].data;
    expect(createData.imageUrl).toBe('/uploads/signage/lobby-welcome.jpg');
  });
});

// ---------------------------------------------------------------------------
// 5. Display zones: lobby, elevator, mailroom
// ---------------------------------------------------------------------------

describe('POST /api/v1/digital-signage — Display Zones', () => {
  const baseContent = {
    propertyId: PROPERTY_A,
    title: 'Zone Content',
    contentType: 'text',
    body: 'Zone test content.',
    startDate: '2026-04-01T00:00:00Z',
    endDate: '2026-04-30T23:59:59Z',
  };

  it('accepts zone=lobby', async () => {
    mockContentCreate.mockResolvedValue({ id: 'c-1' });
    const req = createPostRequest('/api/v1/digital-signage', { ...baseContent, zone: 'lobby' });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('accepts zone=elevator', async () => {
    mockContentCreate.mockResolvedValue({ id: 'c-2' });
    const req = createPostRequest('/api/v1/digital-signage', { ...baseContent, zone: 'elevator' });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('accepts zone=mailroom', async () => {
    mockContentCreate.mockResolvedValue({ id: 'c-3' });
    const req = createPostRequest('/api/v1/digital-signage', { ...baseContent, zone: 'mailroom' });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('rejects invalid zone value', async () => {
    const req = createPostRequest('/api/v1/digital-signage', {
      ...baseContent,
      zone: 'rooftop',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('GET filters by zone when provided', async () => {
    const req = createGetRequest('/api/v1/digital-signage', {
      searchParams: { propertyId: PROPERTY_A, zone: 'elevator' },
    });
    await GET(req);

    const where = mockContentFindMany.mock.calls[0]![0].where;
    expect(where.zone).toBe('elevator');
  });
});

// ---------------------------------------------------------------------------
// 6. Priority ordering for content
// ---------------------------------------------------------------------------

describe('POST /api/v1/digital-signage — Priority Ordering', () => {
  it('stores priority value for ordering', async () => {
    mockContentCreate.mockResolvedValue({ id: 'c-1' });

    const req = createPostRequest('/api/v1/digital-signage', {
      propertyId: PROPERTY_A,
      title: 'High Priority',
      contentType: 'announcement',
      body: 'Emergency notice.',
      zone: 'lobby',
      priority: 10,
      startDate: '2026-04-01T00:00:00Z',
      endDate: '2026-04-30T23:59:59Z',
    });
    await POST(req);

    const createData = mockContentCreate.mock.calls[0]![0].data;
    expect(createData.priority).toBe(10);
  });

  it('defaults priority to 0 when not specified', async () => {
    mockContentCreate.mockResolvedValue({ id: 'c-1' });

    const req = createPostRequest('/api/v1/digital-signage', {
      propertyId: PROPERTY_A,
      title: 'Default Priority',
      contentType: 'text',
      body: 'Normal content.',
      zone: 'lobby',
      startDate: '2026-04-01T00:00:00Z',
      endDate: '2026-04-30T23:59:59Z',
    });
    await POST(req);

    const createData = mockContentCreate.mock.calls[0]![0].data;
    expect(createData.priority).toBe(0);
  });

  it('PATCH updates priority of existing content', async () => {
    mockContentUpdate.mockResolvedValue({ id: 'c-1', priority: 8 });

    const req = createPatchRequest('/api/v1/digital-signage', {
      contentId: 'c-1',
      priority: 8,
    });
    const res = await PATCH(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { priority: number } }>(res);
    expect(body.data.priority).toBe(8);
  });

  it('PATCH updates isActive to toggle content on/off', async () => {
    mockContentUpdate.mockResolvedValue({ id: 'c-1', isActive: false });

    const req = createPatchRequest('/api/v1/digital-signage', {
      contentId: 'c-1',
      isActive: false,
    });
    const res = await PATCH(req);
    expect(res.status).toBe(200);
  });

  it('rejects negative priority', async () => {
    const req = createPostRequest('/api/v1/digital-signage', {
      propertyId: PROPERTY_A,
      title: 'Bad Priority',
      contentType: 'text',
      body: 'Negative priority.',
      zone: 'lobby',
      priority: -1,
      startDate: '2026-04-01T00:00:00Z',
      endDate: '2026-04-30T23:59:59Z',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// GET /api/v1/digital-signage — Listing & Pagination
// ---------------------------------------------------------------------------

describe('GET /api/v1/digital-signage — Listing', () => {
  it('rejects requests without propertyId', async () => {
    const req = createGetRequest('/api/v1/digital-signage');
    const res = await GET(req);
    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_PROPERTY');
  });

  it('scopes query to propertyId and excludes soft-deleted content', async () => {
    const req = createGetRequest('/api/v1/digital-signage', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET(req);

    const where = mockContentFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_A);
    expect(where.deletedAt).toBeNull();
  });

  it('defaults to page 1 with 20 items per page', async () => {
    mockContentCount.mockResolvedValue(50);

    const req = createGetRequest('/api/v1/digital-signage', {
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
    mockContentCount.mockResolvedValue(50);

    const req = createGetRequest('/api/v1/digital-signage', {
      searchParams: { propertyId: PROPERTY_A, page: '2', pageSize: '10' },
    });
    await GET(req);

    const call = mockContentFindMany.mock.calls[0]![0];
    expect(call.skip).toBe(10);
    expect(call.take).toBe(10);
  });

  it('handles database errors without leaking internals', async () => {
    mockContentFindMany.mockRejectedValue(new Error('Connection pool exhausted'));

    const req = createGetRequest('/api/v1/digital-signage', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await GET(req);

    expect(res.status).toBe(500);
    const body = await parseResponse<{ error: string; message: string }>(res);
    expect(body.error).toBe('INTERNAL_ERROR');
    expect(body.message).not.toContain('Connection pool');
  });
});
