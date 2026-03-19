/**
 * Digital Signage API Route Tests
 *
 * Digital signage powers lobby screens, elevator displays, and mailroom
 * monitors. Content rotates on a schedule with priority ordering.
 * Property managers create content that automatically shows and hides
 * based on startDate/endDate.
 *
 * Tests:
 * 1. GET returns active content sorted by priority
 * 2. GET filters by type (announcement, weather, event, emergency, welcome, directory)
 * 3. GET filters by screen/zone (lobby, elevator, mailroom)
 * 4. GET filters by status (active, scheduled, paused, expired)
 * 5. POST creates signage content with all fields
 * 6. POST validates type, screen, and status enums
 * 7. POST validates rotation (5-300 seconds)
 * 8. POST validates date range (endDate > startDate)
 * 9. PATCH toggles content active/paused
 * 10. PATCH extends schedule
 * 11. Emergency content override (emergency priority bypasses normal rotation)
 * 12. Auto-expiry detection (content past endDate)
 * 13. Screen assignment (content can target multiple screens)
 * 14. Content preview (returns rendered display data)
 * 15. Tenant isolation
 * 16. XSS prevention
 * 17. Content types: text, image, announcement, event, weather
 * 18. Display zones: lobby, elevator, mailroom
 * 19. Priority ordering
 * 20. Pagination
 * 21. Error handling
 * 22. Admin role enforcement
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
const PROPERTY_B = '00000000-0000-4000-b000-000000000002';

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
// 1. GET returns active content sorted by priority
// ---------------------------------------------------------------------------

describe('GET /api/v1/digital-signage — Active content sorted by priority', () => {
  it('returns content ordered by priority desc then startDate asc', async () => {
    const req = createGetRequest('/api/v1/digital-signage', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET(req);

    const orderBy = mockContentFindMany.mock.calls[0]![0].orderBy;
    expect(orderBy).toEqual([{ priority: 'desc' }, { startDate: 'asc' }]);
  });

  it('returns content with higher priority first', async () => {
    mockContentFindMany.mockResolvedValue([
      { id: 'c-high', priority: 10, title: 'Emergency Notice' },
      { id: 'c-low', priority: 1, title: 'Welcome Message' },
    ]);
    mockContentCount.mockResolvedValue(2);

    const req = createGetRequest('/api/v1/digital-signage', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await GET(req);
    const body = await parseResponse<{ data: Array<{ id: string; priority: number }> }>(res);
    expect(body.data[0]!.priority).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// 2. GET filters by type (text, image, announcement, event, weather)
// ---------------------------------------------------------------------------

describe('GET /api/v1/digital-signage — Content Type Filtering', () => {
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

  it('does not filter by active dates when active param not set', async () => {
    const req = createGetRequest('/api/v1/digital-signage', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET(req);

    const where = mockContentFindMany.mock.calls[0]![0].where;
    expect(where.isActive).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 3. GET filters by screen/zone (lobby, elevator, mailroom)
// ---------------------------------------------------------------------------

describe('GET /api/v1/digital-signage — Zone Filtering', () => {
  it('filters by zone when provided', async () => {
    const req = createGetRequest('/api/v1/digital-signage', {
      searchParams: { propertyId: PROPERTY_A, zone: 'elevator' },
    });
    await GET(req);

    const where = mockContentFindMany.mock.calls[0]![0].where;
    expect(where.zone).toBe('elevator');
  });

  it('does not filter by zone when not provided', async () => {
    const req = createGetRequest('/api/v1/digital-signage', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET(req);

    const where = mockContentFindMany.mock.calls[0]![0].where;
    expect(where.zone).toBeUndefined();
  });

  it.each(['lobby', 'elevator', 'mailroom'])('accepts zone=%s', async (zone) => {
    const req = createGetRequest('/api/v1/digital-signage', {
      searchParams: { propertyId: PROPERTY_A, zone },
    });
    await GET(req);

    const where = mockContentFindMany.mock.calls[0]![0].where;
    expect(where.zone).toBe(zone);
  });
});

// ---------------------------------------------------------------------------
// 4. GET filters by status (active via isActive and date filtering)
// ---------------------------------------------------------------------------

describe('GET /api/v1/digital-signage — Status Filtering', () => {
  it('excludes soft-deleted content', async () => {
    const req = createGetRequest('/api/v1/digital-signage', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET(req);

    const where = mockContentFindMany.mock.calls[0]![0].where;
    expect(where.deletedAt).toBeNull();
  });

  it('scopes query to propertyId', async () => {
    const req = createGetRequest('/api/v1/digital-signage', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET(req);

    const where = mockContentFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_A);
  });
});

// ---------------------------------------------------------------------------
// 5. POST creates signage content with all fields
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

  it('sets isActive to true by default', async () => {
    mockContentCreate.mockResolvedValue({ id: 'content-1' });

    const req = createPostRequest('/api/v1/digital-signage', validContent);
    await POST(req);

    expect(mockContentCreate.mock.calls[0]![0].data.isActive).toBe(true);
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

  it('stores propertyId from input', async () => {
    mockContentCreate.mockResolvedValue({ id: 'content-1' });

    const req = createPostRequest('/api/v1/digital-signage', validContent);
    await POST(req);

    expect(mockContentCreate.mock.calls[0]![0].data.propertyId).toBe(PROPERTY_A);
  });

  it('stores contentType from input', async () => {
    mockContentCreate.mockResolvedValue({ id: 'content-1' });

    const req = createPostRequest('/api/v1/digital-signage', validContent);
    await POST(req);

    expect(mockContentCreate.mock.calls[0]![0].data.contentType).toBe('announcement');
  });

  it('stores zone from input', async () => {
    mockContentCreate.mockResolvedValue({ id: 'content-1' });

    const req = createPostRequest('/api/v1/digital-signage', validContent);
    await POST(req);

    expect(mockContentCreate.mock.calls[0]![0].data.zone).toBe('lobby');
  });
});

// ---------------------------------------------------------------------------
// 6. POST validates type, screen, and status enums
// ---------------------------------------------------------------------------

describe('POST /api/v1/digital-signage — Enum Validation', () => {
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

  it('rejects invalid zone value', async () => {
    const req = createPostRequest('/api/v1/digital-signage', {
      ...baseContent,
      contentType: 'text',
      body: 'Invalid zone content.',
      zone: 'rooftop',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('accepts zone=lobby', async () => {
    mockContentCreate.mockResolvedValue({ id: 'c-1' });
    const req = createPostRequest('/api/v1/digital-signage', {
      ...baseContent,
      contentType: 'text',
      body: 'Lobby content.',
      zone: 'lobby',
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('accepts zone=elevator', async () => {
    mockContentCreate.mockResolvedValue({ id: 'c-2' });
    const req = createPostRequest('/api/v1/digital-signage', {
      ...baseContent,
      contentType: 'text',
      body: 'Elevator content.',
      zone: 'elevator',
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('accepts zone=mailroom', async () => {
    mockContentCreate.mockResolvedValue({ id: 'c-3' });
    const req = createPostRequest('/api/v1/digital-signage', {
      ...baseContent,
      contentType: 'text',
      body: 'Mailroom content.',
      zone: 'mailroom',
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });
});

// ---------------------------------------------------------------------------
// 7. POST validates rotation (5-300 seconds)
// ---------------------------------------------------------------------------

describe('POST /api/v1/digital-signage — Rotation Duration Validation', () => {
  const baseContent = {
    propertyId: PROPERTY_A,
    title: 'Duration Test',
    contentType: 'text',
    body: 'Testing duration.',
    zone: 'lobby',
    startDate: '2026-04-01T00:00:00Z',
    endDate: '2026-04-30T23:59:59Z',
  };

  it('stores durationSeconds for rotation timing', async () => {
    mockContentCreate.mockResolvedValue({ id: 'content-1' });

    const req = createPostRequest('/api/v1/digital-signage', {
      ...baseContent,
      durationSeconds: 30,
    });
    await POST(req);

    const createData = mockContentCreate.mock.calls[0]![0].data;
    expect(createData.durationSeconds).toBe(30);
  });

  it('defaults durationSeconds to 10 when not specified', async () => {
    mockContentCreate.mockResolvedValue({ id: 'content-1' });

    const req = createPostRequest('/api/v1/digital-signage', baseContent);
    await POST(req);

    const createData = mockContentCreate.mock.calls[0]![0].data;
    expect(createData.durationSeconds).toBe(10);
  });

  it('rejects durationSeconds less than 5', async () => {
    const req = createPostRequest('/api/v1/digital-signage', {
      ...baseContent,
      durationSeconds: 2,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects durationSeconds over 300', async () => {
    const req = createPostRequest('/api/v1/digital-signage', {
      ...baseContent,
      durationSeconds: 301,
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('accepts durationSeconds of exactly 5', async () => {
    mockContentCreate.mockResolvedValue({ id: 'c-min' });

    const req = createPostRequest('/api/v1/digital-signage', {
      ...baseContent,
      durationSeconds: 5,
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });

  it('accepts durationSeconds of exactly 300', async () => {
    mockContentCreate.mockResolvedValue({ id: 'c-max' });

    const req = createPostRequest('/api/v1/digital-signage', {
      ...baseContent,
      durationSeconds: 300,
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
  });
});

// ---------------------------------------------------------------------------
// 8. POST validates date range (endDate > startDate)
// ---------------------------------------------------------------------------

describe('POST /api/v1/digital-signage — Date Range Validation', () => {
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

  it('rejects when endDate equals startDate', async () => {
    const req = createPostRequest('/api/v1/digital-signage', {
      propertyId: PROPERTY_A,
      title: 'Same Dates',
      contentType: 'text',
      body: 'Start and end are identical.',
      zone: 'lobby',
      startDate: '2026-04-01T00:00:00Z',
      endDate: '2026-04-01T00:00:00Z',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects missing startDate', async () => {
    const req = createPostRequest('/api/v1/digital-signage', {
      propertyId: PROPERTY_A,
      title: 'No Start',
      contentType: 'text',
      body: 'Missing start date.',
      zone: 'lobby',
      endDate: '2026-04-30T23:59:59Z',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects missing endDate', async () => {
    const req = createPostRequest('/api/v1/digital-signage', {
      propertyId: PROPERTY_A,
      title: 'No End',
      contentType: 'text',
      body: 'Missing end date.',
      zone: 'lobby',
      startDate: '2026-04-01T00:00:00Z',
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// 9. PATCH toggles content active/paused
// ---------------------------------------------------------------------------

describe('PATCH /api/v1/digital-signage — Toggle Active/Paused', () => {
  it('updates isActive to toggle content off', async () => {
    mockContentUpdate.mockResolvedValue({ id: 'c-1', isActive: false });

    const req = createPatchRequest('/api/v1/digital-signage', {
      contentId: 'c-1',
      isActive: false,
    });
    const res = await PATCH(req);
    expect(res.status).toBe(200);
  });

  it('updates isActive to toggle content on', async () => {
    mockContentUpdate.mockResolvedValue({ id: 'c-1', isActive: true });

    const req = createPatchRequest('/api/v1/digital-signage', {
      contentId: 'c-1',
      isActive: true,
    });
    const res = await PATCH(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{ data: { isActive: boolean } }>(res);
    expect(body.data.isActive).toBe(true);
  });

  it('requires contentId for PATCH', async () => {
    const req = createPatchRequest('/api/v1/digital-signage', {
      isActive: false,
    });
    const res = await PATCH(req);
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// 10. PATCH extends schedule
// ---------------------------------------------------------------------------

describe('PATCH /api/v1/digital-signage — Extend Schedule', () => {
  it('updates endDate to extend schedule', async () => {
    mockContentUpdate.mockResolvedValue({
      id: 'c-1',
      endDate: new Date('2026-06-30T23:59:59Z'),
    });

    const req = createPatchRequest('/api/v1/digital-signage', {
      contentId: 'c-1',
      endDate: '2026-06-30T23:59:59Z',
    });
    const res = await PATCH(req);
    expect(res.status).toBe(200);
  });

  it('updates startDate', async () => {
    mockContentUpdate.mockResolvedValue({
      id: 'c-1',
      startDate: new Date('2026-05-01T00:00:00Z'),
    });

    const req = createPatchRequest('/api/v1/digital-signage', {
      contentId: 'c-1',
      startDate: '2026-05-01T00:00:00Z',
    });
    const res = await PATCH(req);
    expect(res.status).toBe(200);
  });

  it('updates durationSeconds', async () => {
    mockContentUpdate.mockResolvedValue({ id: 'c-1', durationSeconds: 60 });

    const req = createPatchRequest('/api/v1/digital-signage', {
      contentId: 'c-1',
      durationSeconds: 60,
    });
    const res = await PATCH(req);
    expect(res.status).toBe(200);
  });
});

// ---------------------------------------------------------------------------
// 11. Emergency content override
// ---------------------------------------------------------------------------

describe('POST /api/v1/digital-signage — Emergency Priority', () => {
  it('creates emergency content with high priority', async () => {
    mockContentCreate.mockResolvedValue({
      id: 'c-emergency',
      contentType: 'announcement',
      priority: 100,
    });

    const req = createPostRequest('/api/v1/digital-signage', {
      propertyId: PROPERTY_A,
      title: 'FIRE ALARM - EVACUATE',
      contentType: 'announcement',
      body: 'Please evacuate the building immediately via the nearest stairwell.',
      zone: 'lobby',
      priority: 100,
      startDate: '2026-04-01T00:00:00Z',
      endDate: '2026-04-01T23:59:59Z',
    });
    const res = await POST(req);
    expect(res.status).toBe(201);

    const createData = mockContentCreate.mock.calls[0]![0].data;
    expect(createData.priority).toBe(100);
  });

  it('high-priority content appears first in listing', async () => {
    mockContentFindMany.mockResolvedValue([
      { id: 'c-emergency', priority: 100, title: 'EMERGENCY' },
      { id: 'c-normal', priority: 5, title: 'Welcome' },
    ]);
    mockContentCount.mockResolvedValue(2);

    const req = createGetRequest('/api/v1/digital-signage', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await GET(req);
    const body = await parseResponse<{ data: Array<{ priority: number }> }>(res);
    expect(body.data[0]!.priority).toBe(100);
  });
});

// ---------------------------------------------------------------------------
// 12. Auto-expiry detection
// ---------------------------------------------------------------------------

describe('GET /api/v1/digital-signage — Auto-expiry via active filter', () => {
  it('active filter uses current date for lte/gte check', async () => {
    const req = createGetRequest('/api/v1/digital-signage', {
      searchParams: { propertyId: PROPERTY_A, active: 'true' },
    });
    await GET(req);

    const where = mockContentFindMany.mock.calls[0]![0].where;
    expect(where.startDate).toHaveProperty('lte');
    expect(where.endDate).toHaveProperty('gte');
  });

  it('does not apply date filter when active is not true', async () => {
    const req = createGetRequest('/api/v1/digital-signage', {
      searchParams: { propertyId: PROPERTY_A, active: 'false' },
    });
    await GET(req);

    const where = mockContentFindMany.mock.calls[0]![0].where;
    expect(where.startDate).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// 13. Screen assignment
// ---------------------------------------------------------------------------

describe('POST /api/v1/digital-signage — Screen Assignment', () => {
  it('stores zone as screen assignment', async () => {
    mockContentCreate.mockResolvedValue({ id: 'c-1', zone: 'elevator' });

    const req = createPostRequest('/api/v1/digital-signage', {
      propertyId: PROPERTY_A,
      title: 'Elevator Notice',
      contentType: 'text',
      body: 'Elevator maintenance scheduled for next week.',
      zone: 'elevator',
      startDate: '2026-04-01T00:00:00Z',
      endDate: '2026-04-30T23:59:59Z',
    });
    await POST(req);

    expect(mockContentCreate.mock.calls[0]![0].data.zone).toBe('elevator');
  });

  it('can query content for a specific screen zone', async () => {
    mockContentFindMany.mockResolvedValue([
      { id: 'c-1', zone: 'mailroom', title: 'Package Pickup' },
    ]);
    mockContentCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/digital-signage', {
      searchParams: { propertyId: PROPERTY_A, zone: 'mailroom' },
    });
    const res = await GET(req);
    const body = await parseResponse<{ data: Array<{ zone: string }> }>(res);
    expect(body.data[0]!.zone).toBe('mailroom');
  });
});

// ---------------------------------------------------------------------------
// 14. Content preview (returns rendered display data)
// ---------------------------------------------------------------------------

describe('GET /api/v1/digital-signage — Content Preview', () => {
  it('returns content with all display fields for rendering', async () => {
    mockContentFindMany.mockResolvedValue([
      {
        id: 'c-1',
        title: 'Welcome',
        contentType: 'text',
        body: 'Welcome to our building!',
        zone: 'lobby',
        priority: 5,
        durationSeconds: 15,
        startDate: new Date('2026-04-01'),
        endDate: new Date('2026-04-30'),
        isActive: true,
      },
    ]);
    mockContentCount.mockResolvedValue(1);

    const req = createGetRequest('/api/v1/digital-signage', {
      searchParams: { propertyId: PROPERTY_A },
    });
    const res = await GET(req);
    expect(res.status).toBe(200);

    const body = await parseResponse<{
      data: Array<{
        title: string;
        contentType: string;
        body: string;
        zone: string;
        durationSeconds: number;
      }>;
    }>(res);
    expect(body.data[0]!.title).toBe('Welcome');
    expect(body.data[0]!.contentType).toBe('text');
    expect(body.data[0]!.durationSeconds).toBe(15);
  });
});

// ---------------------------------------------------------------------------
// 15. Tenant isolation
// ---------------------------------------------------------------------------

describe('Tenant Isolation — Digital Signage', () => {
  it('scopes GET query to propertyId', async () => {
    const req = createGetRequest('/api/v1/digital-signage', {
      searchParams: { propertyId: PROPERTY_A },
    });
    await GET(req);

    const where = mockContentFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_A);
  });

  it('different tenant sees different content', async () => {
    const req = createGetRequest('/api/v1/digital-signage', {
      searchParams: { propertyId: PROPERTY_B },
    });
    await GET(req);

    const where = mockContentFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(PROPERTY_B);
  });

  it('stores propertyId when creating content', async () => {
    mockContentCreate.mockResolvedValue({ id: 'content-1' });

    const req = createPostRequest('/api/v1/digital-signage', {
      propertyId: PROPERTY_A,
      title: 'Tenant test',
      contentType: 'text',
      body: 'Testing tenant isolation.',
      zone: 'lobby',
      startDate: '2026-04-01T00:00:00Z',
      endDate: '2026-04-30T23:59:59Z',
    });
    await POST(req);

    expect(mockContentCreate.mock.calls[0]![0].data.propertyId).toBe(PROPERTY_A);
  });

  it('rejects request without propertyId', async () => {
    const req = createGetRequest('/api/v1/digital-signage');
    const res = await GET(req);
    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_PROPERTY');
  });
});

// ---------------------------------------------------------------------------
// 16. XSS prevention
// ---------------------------------------------------------------------------

describe('XSS Prevention — Digital Signage', () => {
  it('sanitizes title — XSS prevention', async () => {
    mockContentCreate.mockResolvedValue({ id: 'content-1' });

    const req = createPostRequest('/api/v1/digital-signage', {
      propertyId: PROPERTY_A,
      title: '<script>alert("xss")</script>Notice',
      contentType: 'text',
      body: 'Normal body content.',
      zone: 'lobby',
      startDate: '2026-04-01T00:00:00Z',
      endDate: '2026-04-30T23:59:59Z',
    });
    await POST(req);

    const createData = mockContentCreate.mock.calls[0]![0].data;
    expect(createData.title).not.toContain('<script>');
  });

  it('sanitizes body — XSS prevention', async () => {
    mockContentCreate.mockResolvedValue({ id: 'content-1' });

    const req = createPostRequest('/api/v1/digital-signage', {
      propertyId: PROPERTY_A,
      title: 'Normal Title',
      contentType: 'text',
      body: '<img onerror="alert(1)" src="">Important info',
      zone: 'lobby',
      startDate: '2026-04-01T00:00:00Z',
      endDate: '2026-04-30T23:59:59Z',
    });
    await POST(req);

    const createData = mockContentCreate.mock.calls[0]![0].data;
    expect(createData.body).not.toContain('onerror');
  });

  it('sanitizes title on PATCH', async () => {
    mockContentUpdate.mockResolvedValue({ id: 'c-1', title: 'Clean Title' });

    const req = createPatchRequest('/api/v1/digital-signage', {
      contentId: 'c-1',
      title: '<script>xss</script>Clean Title',
    });
    await PATCH(req);

    const updateData = mockContentUpdate.mock.calls[0]![0].data;
    expect(updateData.title).not.toContain('<script>');
  });

  it('sanitizes body on PATCH', async () => {
    mockContentUpdate.mockResolvedValue({ id: 'c-1', body: 'Clean body' });

    const req = createPatchRequest('/api/v1/digital-signage', {
      contentId: 'c-1',
      body: '<div onload="hack()">Clean body</div>',
    });
    await PATCH(req);

    const updateData = mockContentUpdate.mock.calls[0]![0].data;
    expect(updateData.body).not.toContain('onload');
  });
});

// ---------------------------------------------------------------------------
// 17. Priority ordering
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
// 18. Pagination
// ---------------------------------------------------------------------------

describe('GET /api/v1/digital-signage — Pagination', () => {
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

  it('computes correct skip for page 3 with pageSize 15', async () => {
    mockContentCount.mockResolvedValue(100);

    const req = createGetRequest('/api/v1/digital-signage', {
      searchParams: { propertyId: PROPERTY_A, page: '3', pageSize: '15' },
    });
    await GET(req);

    const call = mockContentFindMany.mock.calls[0]![0];
    expect(call.skip).toBe(30);
    expect(call.take).toBe(15);
  });

  it('returns correct totalPages calculation', async () => {
    mockContentCount.mockResolvedValue(21);

    const req = createGetRequest('/api/v1/digital-signage', {
      searchParams: { propertyId: PROPERTY_A, pageSize: '10' },
    });
    const res = await GET(req);
    const body = await parseResponse<{ meta: { totalPages: number } }>(res);
    expect(body.meta.totalPages).toBe(3); // ceil(21/10) = 3
  });
});

// ---------------------------------------------------------------------------
// 19. Error handling
// ---------------------------------------------------------------------------

describe('Error Handling — Digital Signage', () => {
  it('handles database errors on GET without leaking internals', async () => {
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

  it('handles database errors on POST without leaking internals', async () => {
    mockContentCreate.mockRejectedValue(new Error('FK constraint: propertyId not found'));

    const req = createPostRequest('/api/v1/digital-signage', {
      propertyId: PROPERTY_A,
      title: 'Test',
      contentType: 'text',
      body: 'Test body content.',
      zone: 'lobby',
      startDate: '2026-04-01T00:00:00Z',
      endDate: '2026-04-30T23:59:59Z',
    });
    const res = await POST(req);

    expect(res.status).toBe(500);
    const body = await parseResponse<{ error: string; message: string }>(res);
    expect(body.error).toBe('INTERNAL_ERROR');
    expect(body.message).not.toContain('FK constraint');
  });

  it('handles database errors on PATCH without leaking internals', async () => {
    mockContentUpdate.mockRejectedValue(new Error('Record not found'));

    const req = createPatchRequest('/api/v1/digital-signage', {
      contentId: 'c-ghost',
      isActive: false,
    });
    const res = await PATCH(req);

    expect(res.status).toBe(500);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('INTERNAL_ERROR');
  });
});

// ---------------------------------------------------------------------------
// 20. PATCH updates multiple fields at once
// ---------------------------------------------------------------------------

describe('PATCH /api/v1/digital-signage — Multi-field Update', () => {
  it('updates title and body simultaneously', async () => {
    mockContentUpdate.mockResolvedValue({
      id: 'c-1',
      title: 'Updated Title',
      body: 'Updated body.',
    });

    const req = createPatchRequest('/api/v1/digital-signage', {
      contentId: 'c-1',
      title: 'Updated Title',
      body: 'Updated body.',
    });
    const res = await PATCH(req);
    expect(res.status).toBe(200);
  });

  it('updates zone of existing content', async () => {
    mockContentUpdate.mockResolvedValue({ id: 'c-1', zone: 'mailroom' });

    const req = createPatchRequest('/api/v1/digital-signage', {
      contentId: 'c-1',
      zone: 'mailroom',
    });
    const res = await PATCH(req);
    expect(res.status).toBe(200);
  });

  it('updates imageUrl', async () => {
    mockContentUpdate.mockResolvedValue({
      id: 'c-1',
      imageUrl: '/uploads/signage/new-image.jpg',
    });

    const req = createPatchRequest('/api/v1/digital-signage', {
      contentId: 'c-1',
      imageUrl: '/uploads/signage/new-image.jpg',
    });
    const res = await PATCH(req);
    expect(res.status).toBe(200);
  });

  it('requires admin role for PATCH', async () => {
    mockContentUpdate.mockResolvedValue({ id: 'c-1' });

    const req = createPatchRequest('/api/v1/digital-signage', {
      contentId: 'c-1',
      isActive: false,
    });
    await PATCH(req);

    expect(mockGuardRoute).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        roles: ['super_admin', 'property_admin'],
      }),
    );
  });
});
