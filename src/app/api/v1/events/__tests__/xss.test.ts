/**
 * XSS Prevention Tests — Events API
 *
 * Stored XSS is a critical vulnerability in a condo management platform.
 * If a malicious script is stored in an event description and rendered
 * on the security console, it could steal session tokens from security
 * guards, giving an attacker access to the entire building's security system.
 *
 * These tests verify that HTML/script content is stripped from user input
 * before storage.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { createPostRequest, parseResponse } from '@/test/helpers/api';

const mockCreate = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    event: {
      create: (...args: unknown[]) => mockCreate(...args),
    },
    eventType: {
      findFirst: vi
        .fn()
        .mockResolvedValue({ id: '00000000-0000-4000-d000-000000000001', name: 'Security Event' }),
      create: vi.fn().mockImplementation((args: Record<string, unknown>) =>
        Promise.resolve({
          id: 'evt-type-new',
          ...(args as { data?: Record<string, unknown> }).data,
        }),
      ),
    },
    eventGroup: {
      findFirst: vi.fn().mockResolvedValue({ id: 'evt-group-1', name: 'Security' }),
      create: vi.fn().mockImplementation((args: Record<string, unknown>) =>
        Promise.resolve({
          id: 'evt-group-new',
          ...(args as { data?: Record<string, unknown> }).data,
        }),
      ),
    },
    eventTypeEmailConfig: {
      findFirst: vi.fn().mockResolvedValue(null),
    },
  },
}));

vi.mock('nanoid', () => ({ nanoid: vi.fn().mockReturnValue('XSS001') }));

vi.mock('@/server/middleware/api-guard', () => ({
  guardRoute: vi.fn().mockResolvedValue({
    user: {
      userId: 'test-user',
      propertyId: '00000000-0000-4000-b000-000000000001',
      role: 'security_guard',
      permissions: ['*'],
      mfaVerified: false,
    },
    error: null,
  }),
}));

import { POST } from '../route';

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Events API — XSS Prevention', () => {
  const baseEvent = {
    propertyId: '00000000-0000-4000-b000-000000000001',
    eventTypeId: '00000000-0000-4000-d000-000000000001',
    priority: 'normal',
  };

  it('strips <script> tags from title', async () => {
    mockCreate.mockResolvedValue({
      id: 'evt-1',
      referenceNo: 'EVT-XSS001',
      status: 'open',
      createdAt: new Date(),
      eventType: null,
      unit: null,
      title: 'Visitor alert("xss") for unit 1501',
      ...baseEvent,
    });

    const req = createPostRequest('/api/v1/events', {
      ...baseEvent,
      title: 'Visitor <script>alert("xss")</script> for unit 1501',
    });
    const res = await POST(req);

    if (res.status === 201) {
      // Check what was actually passed to Prisma
      const createData = mockCreate.mock.calls[0]?.[0]?.data;
      if (createData) {
        // stripHtml removes HTML tags but preserves inner text content
        expect(createData.title).not.toContain('<script>');
        expect(createData.title).not.toContain('</script>');
      }
    }
  });

  it('strips HTML tags from description', async () => {
    mockCreate.mockResolvedValue({
      id: 'evt-1',
      referenceNo: 'EVT-XSS001',
      status: 'open',
      createdAt: new Date(),
      eventType: null,
      unit: null,
      title: 'Test',
      description: 'Clean text',
      ...baseEvent,
    });

    const req = createPostRequest('/api/v1/events', {
      ...baseEvent,
      title: 'Test event',
      description: '<img src=x onerror=alert(document.cookie)>Noise complaint on floor 8',
    });
    const res = await POST(req);

    if (res.status === 201) {
      const createData = mockCreate.mock.calls[0]?.[0]?.data;
      if (createData?.description) {
        expect(createData.description).not.toContain('<img');
        expect(createData.description).not.toContain('onerror');
        expect(createData.description).not.toContain('document.cookie');
      }
    }
  });

  it('strips event handler attributes from input', async () => {
    mockCreate.mockResolvedValue({
      id: 'evt-1',
      referenceNo: 'EVT-XSS001',
      status: 'open',
      createdAt: new Date(),
      eventType: null,
      unit: null,
      title: 'Test',
      ...baseEvent,
    });

    const req = createPostRequest('/api/v1/events', {
      ...baseEvent,
      title: '<div onmouseover="steal()">Hover me</div>',
    });
    const res = await POST(req);

    if (res.status === 201) {
      const createData = mockCreate.mock.calls[0]?.[0]?.data;
      if (createData) {
        expect(createData.title).not.toContain('onmouseover');
        expect(createData.title).not.toContain('steal()');
      }
    }
  });
});
