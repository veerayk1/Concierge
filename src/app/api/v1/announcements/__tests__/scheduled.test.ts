/**
 * Announcements — Scheduled Announcements (GAP 9.2)
 *
 * Property managers must be able to schedule announcements for future
 * publication. A scheduled announcement should:
 * 1. Accept a future scheduledAt date
 * 2. Be stored with status='scheduled'
 * 3. NOT be visible to residents until published
 * 4. NOT trigger delivery records at creation time
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createGetRequest, createPostRequest, parseResponse } from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Mock Setup
// ---------------------------------------------------------------------------

const mockCreate = vi.fn();
const mockFindMany = vi.fn();
const mockCount = vi.fn();
const mockGuardRoute = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    announcement: {
      create: (...args: unknown[]) => mockCreate(...args),
      findMany: (...args: unknown[]) => mockFindMany(...args),
      count: (...args: unknown[]) => mockCount(...args),
    },
  },
}));

vi.mock('@/lib/sanitize', () => ({
  stripHtml: vi.fn((input: string) => input.replace(/<[^>]*>/g, '')),
  stripControlChars: vi.fn((input: string) =>
    input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''),
  ),
}));

vi.mock('@/server/push', () => ({
  sendPushToProperty: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/server/logger', () => ({
  createLogger: vi.fn().mockReturnValue({
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn(),
  }),
}));

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: (...args: unknown[]) => mockGuardRoute(...args),
}));

import { GET, POST } from '../route';

const PROPERTY_ID = '00000000-0000-4000-b000-000000000001';

function setAuth(role: string) {
  mockGuardRoute.mockResolvedValue({
    user: {
      userId: 'test-user',
      propertyId: PROPERTY_ID,
      role,
      permissions: ['*'],
      mfaVerified: true,
    },
    error: null,
  });
}

beforeEach(() => {
  vi.clearAllMocks();
  setAuth('property_admin');
  mockFindMany.mockResolvedValue([]);
  mockCount.mockResolvedValue(0);
});

// ---------------------------------------------------------------------------
// GAP 9.2: Creating scheduled announcements
// ---------------------------------------------------------------------------

describe('POST /api/v1/announcements — Scheduled creation (GAP 9.2)', () => {
  const futureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

  const scheduledBody = {
    propertyId: PROPERTY_ID,
    title: 'Upcoming Water Shutoff',
    content: 'Water will be shut off next Monday from 9am-12pm for maintenance.',
    channels: ['web', 'email'],
    status: 'scheduled' as const,
    scheduledAt: futureDate,
  };

  it('creates a scheduled announcement with future scheduledAt', async () => {
    mockCreate.mockResolvedValue({
      id: 'ann-scheduled-1',
      ...scheduledBody,
      scheduledAt: new Date(futureDate),
      publishedAt: null,
      createdById: 'test-user',
    });

    const req = createPostRequest('/api/v1/announcements', scheduledBody);
    const res = await POST(req);

    expect(res.status).toBe(201);
    const createData = mockCreate.mock.calls[0]![0].data;
    expect(createData.status).toBe('scheduled');
    expect(createData.scheduledAt).toEqual(new Date(futureDate));
  });

  it('does NOT set publishedAt for scheduled announcements', async () => {
    mockCreate.mockResolvedValue({
      id: 'ann-scheduled-2',
      status: 'scheduled',
      publishedAt: null,
    });

    const req = createPostRequest('/api/v1/announcements', scheduledBody);
    await POST(req);

    const createData = mockCreate.mock.calls[0]![0].data;
    expect(createData.publishedAt).toBeNull();
  });

  it('stores scheduledAt as Date object', async () => {
    mockCreate.mockResolvedValue({
      id: 'ann-scheduled-3',
      status: 'scheduled',
      scheduledAt: new Date(futureDate),
    });

    const req = createPostRequest('/api/v1/announcements', scheduledBody);
    await POST(req);

    const createData = mockCreate.mock.calls[0]![0].data;
    expect(createData.scheduledAt).toBeInstanceOf(Date);
  });
});

// ---------------------------------------------------------------------------
// GAP 9.2: Scheduled announcements NOT visible to residents
// ---------------------------------------------------------------------------

describe('GET /api/v1/announcements — Scheduled visibility (GAP 9.2)', () => {
  it('residents only see published announcements by default', async () => {
    setAuth('resident_owner');
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/announcements', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    await GET(req);

    const where = mockFindMany.mock.calls[0]![0].where;
    expect(where.status).toBe('published');
  });

  it('resident_tenant only sees published announcements', async () => {
    setAuth('resident_tenant');
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/announcements', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    await GET(req);

    const where = mockFindMany.mock.calls[0]![0].where;
    expect(where.status).toBe('published');
  });

  it('front_desk only sees published announcements by default', async () => {
    setAuth('front_desk');
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/announcements', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    await GET(req);

    const where = mockFindMany.mock.calls[0]![0].where;
    expect(where.status).toBe('published');
  });

  it('admins can see all announcements (no default status filter)', async () => {
    setAuth('property_admin');
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/announcements', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    await GET(req);

    const where = mockFindMany.mock.calls[0]![0].where;
    // Admin without explicit status filter should not have status filter applied
    expect(where.status).toBeUndefined();
  });

  it('admins can explicitly filter by scheduled status', async () => {
    setAuth('property_admin');
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/announcements', {
      searchParams: { propertyId: PROPERTY_ID, status: 'scheduled' },
    });
    await GET(req);

    const where = mockFindMany.mock.calls[0]![0].where;
    expect(where.status).toBe('scheduled');
  });

  it('property_manager can see all announcements', async () => {
    setAuth('property_manager');
    mockFindMany.mockResolvedValue([]);
    mockCount.mockResolvedValue(0);

    const req = createGetRequest('/api/v1/announcements', {
      searchParams: { propertyId: PROPERTY_ID },
    });
    await GET(req);

    const where = mockFindMany.mock.calls[0]![0].where;
    expect(where.status).toBeUndefined();
  });
});
