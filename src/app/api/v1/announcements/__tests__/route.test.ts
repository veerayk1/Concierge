/**
 * Announcements API Route Tests — per PRD 09 Communication
 *
 * Announcements are the primary way property managers communicate with
 * residents. A broken announcement means 500+ residents miss a fire drill
 * notice, a water shutoff warning, or an emergency evacuation plan.
 *
 * Security context: Only admins can create/publish announcements.
 * Title and body are sanitized (XSS prevention) because announcements
 * render as HTML in the resident portal.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createGetRequest, createPostRequest, parseResponse } from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Mock Setup
// ---------------------------------------------------------------------------

const mockFindMany = vi.fn();
const mockCount = vi.fn();
const mockCreate = vi.fn();
const mockGuardRoute = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    announcement: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      count: (...args: unknown[]) => mockCount(...args),
      create: (...args: unknown[]) => mockCreate(...args),
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

import { GET, POST } from '../route';
import { stripHtml, stripControlChars } from '@/lib/sanitize';

beforeEach(() => {
  vi.clearAllMocks();
  mockFindMany.mockResolvedValue([]);
  mockCount.mockResolvedValue(0);
  mockCreate.mockResolvedValue({});

  // Default: admin user (can create announcements)
  mockGuardRoute.mockResolvedValue({
    user: {
      userId: 'test-admin',
      propertyId: '00000000-0000-4000-b000-000000000001',
      role: 'property_admin',
      permissions: ['*'],
      mfaVerified: true,
    },
    error: null,
  });
});

// ---------------------------------------------------------------------------
// GET /api/v1/announcements — Tenant Isolation
// ---------------------------------------------------------------------------

describe('GET /api/v1/announcements — Tenant Isolation', () => {
  it('REJECTS requests without propertyId — prevents listing announcements across properties', async () => {
    const req = createGetRequest('/api/v1/announcements');
    const res = await GET(req);
    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string }>(res);
    expect(body.error).toBe('MISSING_PROPERTY');
    expect(mockFindMany).not.toHaveBeenCalled();
  });

  it('scopes query to propertyId + excludes soft-deleted announcements', async () => {
    const propertyId = '00000000-0000-4000-b000-000000000001';
    const req = createGetRequest('/api/v1/announcements', { searchParams: { propertyId } });
    await GET(req);

    const where = mockFindMany.mock.calls[0]![0].where;
    expect(where.propertyId).toBe(propertyId);
    expect(where.deletedAt).toBeNull();
  });

  it('orders announcements by createdAt DESC — most recent first', async () => {
    const req = createGetRequest('/api/v1/announcements', {
      searchParams: { propertyId: '00000000-0000-4000-b000-000000000001' },
    });
    await GET(req);

    const orderBy = mockFindMany.mock.calls[0]![0].orderBy;
    expect(orderBy).toEqual({ createdAt: 'desc' });
  });
});

// ---------------------------------------------------------------------------
// GET /api/v1/announcements — Filtering
// ---------------------------------------------------------------------------

describe('GET /api/v1/announcements — Filtering', () => {
  it('filters by status — draft, published, scheduled', async () => {
    const req = createGetRequest('/api/v1/announcements', {
      searchParams: {
        propertyId: '00000000-0000-4000-b000-000000000001',
        status: 'published',
      },
    });
    await GET(req);

    expect(mockFindMany.mock.calls[0]![0].where.status).toBe('published');
  });

  it('searches across title AND body — case insensitive', async () => {
    const req = createGetRequest('/api/v1/announcements', {
      searchParams: {
        propertyId: '00000000-0000-4000-b000-000000000001',
        search: 'water shutoff',
      },
    });
    await GET(req);

    const where = mockFindMany.mock.calls[0]![0].where;
    expect(where.OR).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ title: { contains: 'water shutoff', mode: 'insensitive' } }),
        expect.objectContaining({ content: { contains: 'water shutoff', mode: 'insensitive' } }),
      ]),
    );
  });

  it('includes category relation — needed for category name display', async () => {
    const req = createGetRequest('/api/v1/announcements', {
      searchParams: { propertyId: '00000000-0000-4000-b000-000000000001' },
    });
    await GET(req);

    const include = mockFindMany.mock.calls[0]![0].include;
    expect(include.category).toBeDefined();
    expect(include.category.select).toMatchObject({ id: true, name: true });
  });
});

// ---------------------------------------------------------------------------
// GET /api/v1/announcements — Pagination
// ---------------------------------------------------------------------------

describe('GET /api/v1/announcements — Pagination', () => {
  it('defaults to page 1 with 20 items per page', async () => {
    mockCount.mockResolvedValue(50);

    const req = createGetRequest('/api/v1/announcements', {
      searchParams: { propertyId: '00000000-0000-4000-b000-000000000001' },
    });
    const res = await GET(req);
    const body = await parseResponse<{
      meta: { page: number; pageSize: number; totalPages: number; total: number };
    }>(res);

    expect(body.meta.page).toBe(1);
    expect(body.meta.pageSize).toBe(20);
    expect(body.meta.totalPages).toBe(3); // ceil(50/20)
    expect(body.meta.total).toBe(50);
  });

  it('applies correct skip/take for page 2', async () => {
    mockCount.mockResolvedValue(50);

    const req = createGetRequest('/api/v1/announcements', {
      searchParams: {
        propertyId: '00000000-0000-4000-b000-000000000001',
        page: '2',
        pageSize: '10',
      },
    });
    await GET(req);

    const call = mockFindMany.mock.calls[0]![0];
    expect(call.skip).toBe(10); // (2-1) * 10
    expect(call.take).toBe(10);
  });
});

// ---------------------------------------------------------------------------
// POST /api/v1/announcements — Authorization (Role Check)
// ---------------------------------------------------------------------------

describe('POST /api/v1/announcements — Authorization', () => {
  it('requires admin role — guardRoute called with roles restriction', async () => {
    const validBody = {
      propertyId: '00000000-0000-4000-b000-000000000001',
      title: 'Water Shutoff Notice',
      content: 'Water will be shut off on Friday from 9am-12pm for pipe repairs.',
      channels: ['web', 'email'],
      status: 'draft',
    };

    const req = createPostRequest('/api/v1/announcements', validBody);
    await POST(req);

    // Verify guardRoute was called with roles restriction
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

    const req = createPostRequest('/api/v1/announcements', {
      propertyId: '00000000-0000-4000-b000-000000000001',
      title: 'Test',
      content: 'Test body',
      channels: ['web'],
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });
});

// ---------------------------------------------------------------------------
// POST /api/v1/announcements — Validation
// ---------------------------------------------------------------------------

describe('POST /api/v1/announcements — Validation', () => {
  it('rejects empty body with VALIDATION_ERROR', async () => {
    const req = createPostRequest('/api/v1/announcements', {});
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await parseResponse<{ error: string; fields: Record<string, string[]> }>(res);
    expect(body.error).toBe('VALIDATION_ERROR');
    expect(body.fields).toBeDefined();
  });

  it('returns field-specific errors for each invalid field', async () => {
    const req = createPostRequest('/api/v1/announcements', {
      propertyId: 'not-uuid',
      title: '',
      content: '',
      channels: [],
    });
    const res = await POST(req);
    const body = await parseResponse<{ fields: Record<string, string[]> }>(res);

    expect(body.fields.propertyId).toBeDefined();
    expect(body.fields.title).toBeDefined();
    expect(body.fields.content).toBeDefined();
    expect(body.fields.channels).toBeDefined();
  });

  it('requires channels array with at least 1 item — per multi-channel distribution spec', async () => {
    const req = createPostRequest('/api/v1/announcements', {
      propertyId: '00000000-0000-4000-b000-000000000001',
      title: 'Test Announcement',
      content: 'This is a test.',
      channels: [],
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const body = await parseResponse<{ fields: Record<string, string[]> }>(res);
    expect(body.fields.channels).toBeDefined();
  });

  it('rejects invalid channel types', async () => {
    const req = createPostRequest('/api/v1/announcements', {
      propertyId: '00000000-0000-4000-b000-000000000001',
      title: 'Test Announcement',
      content: 'This is a test.',
      channels: ['fax'],
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects title over 200 characters', async () => {
    const req = createPostRequest('/api/v1/announcements', {
      propertyId: '00000000-0000-4000-b000-000000000001',
      title: 'X'.repeat(201),
      content: 'Valid body.',
      channels: ['web'],
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('rejects content over 10000 characters', async () => {
    const req = createPostRequest('/api/v1/announcements', {
      propertyId: '00000000-0000-4000-b000-000000000001',
      title: 'Valid Title',
      content: 'X'.repeat(10001),
      channels: ['web'],
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

// ---------------------------------------------------------------------------
// POST /api/v1/announcements — XSS Prevention (Sanitization)
// ---------------------------------------------------------------------------

describe('POST /api/v1/announcements — XSS Prevention', () => {
  const validBody = {
    propertyId: '00000000-0000-4000-b000-000000000001',
    title: 'Water <script>alert("xss")</script> Notice',
    content: 'Water shutoff <img onerror="alert(1)" src="x"> on Friday.',
    channels: ['web', 'email'],
    status: 'draft' as const,
  };

  it('sanitizes title with stripHtml AND stripControlChars before storing', async () => {
    mockCreate.mockResolvedValue({
      id: 'a1',
      title: 'Water  Notice',
      content: 'Water shutoff  on Friday.',
      status: 'draft',
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/announcements', validBody);
    await POST(req);

    // Both sanitization functions should be called on title
    expect(stripHtml).toHaveBeenCalled();
    expect(stripControlChars).toHaveBeenCalled();

    // Verify the create call uses sanitized values (not raw input)
    const createData = mockCreate.mock.calls[0]![0].data;
    expect(createData.title).not.toContain('<script>');
    expect(createData.content).not.toContain('onerror');
  });

  it('sanitizes body with stripHtml AND stripControlChars before storing', async () => {
    mockCreate.mockResolvedValue({
      id: 'a1',
      title: 'Clean Title',
      content: 'Clean body',
      status: 'draft',
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/announcements', {
      ...validBody,
      title: 'Clean Title',
      content: 'Body with <script>evil()</script> content',
    });
    await POST(req);

    const createData = mockCreate.mock.calls[0]![0].data;
    expect(createData.content).not.toContain('<script>');
  });
});

// ---------------------------------------------------------------------------
// POST /api/v1/announcements — Publishing Logic
// ---------------------------------------------------------------------------

describe('POST /api/v1/announcements — Publishing', () => {
  const baseBody = {
    propertyId: '00000000-0000-4000-b000-000000000001',
    title: 'Lobby Renovation Complete',
    content: 'The lobby renovation is now complete. Thank you for your patience.',
    channels: ['web', 'email', 'push'],
  };

  it('sets publishedAt to current timestamp when status=published', async () => {
    mockCreate.mockResolvedValue({
      id: 'a1',
      ...baseBody,
      status: 'published',
      publishedAt: new Date(),
      createdById: 'test-admin',
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/announcements', {
      ...baseBody,
      status: 'published',
    });
    await POST(req);

    const createData = mockCreate.mock.calls[0]![0].data;
    expect(createData.publishedAt).toBeInstanceOf(Date);
  });

  it('sets publishedAt to null when status=draft — not yet visible to residents', async () => {
    mockCreate.mockResolvedValue({
      id: 'a1',
      ...baseBody,
      status: 'draft',
      publishedAt: null,
      createdById: 'test-admin',
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/announcements', {
      ...baseBody,
      status: 'draft',
    });
    await POST(req);

    const createData = mockCreate.mock.calls[0]![0].data;
    expect(createData.publishedAt).toBeNull();
  });

  it('defaults status to draft when not specified', async () => {
    mockCreate.mockResolvedValue({
      id: 'a1',
      ...baseBody,
      status: 'draft',
      publishedAt: null,
      createdById: 'test-admin',
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/announcements', baseBody);
    await POST(req);

    const createData = mockCreate.mock.calls[0]![0].data;
    expect(createData.status).toBe('draft');
    expect(createData.publishedAt).toBeNull();
  });

  it('uses auth.user.userId as createdById — tracks WHO created the announcement', async () => {
    mockCreate.mockResolvedValue({
      id: 'a1',
      ...baseBody,
      status: 'draft',
      createdById: 'test-admin',
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/announcements', {
      ...baseBody,
      status: 'draft',
    });
    await POST(req);

    const createData = mockCreate.mock.calls[0]![0].data;
    expect(createData.createdById).toBe('test-admin');
  });

  it('stores scheduledAt as Date when provided', async () => {
    const scheduledAt = '2026-04-01T09:00:00Z';
    mockCreate.mockResolvedValue({
      id: 'a1',
      ...baseBody,
      status: 'scheduled',
      scheduledAt: new Date(scheduledAt),
      createdById: 'test-admin',
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/announcements', {
      ...baseBody,
      status: 'scheduled',
      scheduledAt,
    });
    await POST(req);

    const createData = mockCreate.mock.calls[0]![0].data;
    expect(createData.scheduledAt).toEqual(new Date(scheduledAt));
  });

  it('sets scheduledAt to null when not provided', async () => {
    mockCreate.mockResolvedValue({
      id: 'a1',
      ...baseBody,
      status: 'draft',
      scheduledAt: null,
      createdById: 'test-admin',
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/announcements', {
      ...baseBody,
      status: 'draft',
    });
    await POST(req);

    const createData = mockCreate.mock.calls[0]![0].data;
    expect(createData.scheduledAt).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// POST /api/v1/announcements — Response Shape
// ---------------------------------------------------------------------------

describe('POST /api/v1/announcements — Response', () => {
  it('returns 201 with announcement data and confirmation message', async () => {
    mockCreate.mockResolvedValue({
      id: 'a1',
      propertyId: '00000000-0000-4000-b000-000000000001',
      title: 'Fire Drill Thursday',
      content: 'Fire drill at 2pm Thursday.',
      status: 'draft',
      channels: ['web'],
      createdById: 'test-admin',
      publishedAt: null,
      createdAt: new Date(),
    });

    const req = createPostRequest('/api/v1/announcements', {
      propertyId: '00000000-0000-4000-b000-000000000001',
      title: 'Fire Drill Thursday',
      content: 'Fire drill at 2pm Thursday.',
      channels: ['web'],
    });
    const res = await POST(req);

    expect(res.status).toBe(201);
    const body = await parseResponse<{ data: { id: string }; message: string }>(res);
    expect(body.data.id).toBe('a1');
    expect(body.message).toBe('Announcement created.');
  });

  it('handles database errors without leaking internals', async () => {
    mockCreate.mockRejectedValue(new Error('FK constraint: categoryId does not exist'));

    const req = createPostRequest('/api/v1/announcements', {
      propertyId: '00000000-0000-4000-b000-000000000001',
      title: 'Test',
      content: 'Test body content here.',
      channels: ['web'],
    });
    const res = await POST(req);

    expect(res.status).toBe(500);
    const body = await parseResponse<{ error: string; message: string }>(res);
    expect(body.error).toBe('INTERNAL_ERROR');
    expect(body.message).not.toContain('FK constraint');
    expect(body.message).not.toContain('categoryId');
  });
});

// ---------------------------------------------------------------------------
// GET /api/v1/announcements — Error Handling
// ---------------------------------------------------------------------------

describe('GET /api/v1/announcements — Error Handling', () => {
  it('handles database errors without leaking internals', async () => {
    mockFindMany.mockRejectedValue(new Error('Connection pool exhausted'));

    const req = createGetRequest('/api/v1/announcements', {
      searchParams: { propertyId: '00000000-0000-4000-b000-000000000001' },
    });
    const res = await GET(req);

    expect(res.status).toBe(500);
    const body = await parseResponse<{ error: string; message: string }>(res);
    expect(body.error).toBe('INTERNAL_ERROR');
    expect(body.message).not.toContain('Connection pool');
  });
});
