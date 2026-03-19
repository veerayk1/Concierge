/**
 * Concierge — Middleware Chain Tests
 *
 * Tests for createApiHandler composition: middleware ordering,
 * error propagation, context passing, and response formatting.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';
import { z } from 'zod';

import { createApiHandler } from '@/server/middleware/chain';
import type { Role, TokenPayload, ApiResponse, ApiError } from '@/types';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Mock the auth middleware
vi.mock('@/server/middleware/auth', () => ({
  requireAuth: vi.fn().mockResolvedValue({
    sub: 'user-1',
    pid: 'prop-1',
    role: 'property_admin' as Role,
    perms: ['*'],
    mfa: true,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 900,
  } satisfies TokenPayload),
}));

// Mock the rate limiter (scaffold — allows everything)
vi.mock('@/server/middleware/rate-limit', () => ({
  checkRateLimit: vi.fn(),
  RATE_LIMITS: {
    auth: { maxRequests: 10, windowSeconds: 900 },
    read: { maxRequests: 200, windowSeconds: 60 },
    write: { maxRequests: 60, windowSeconds: 60 },
    upload: { maxRequests: 20, windowSeconds: 60 },
    emergency: { maxRequests: 5, windowSeconds: 3600 },
  },
}));

// Mock the RBAC middleware
vi.mock('@/server/middleware/rbac', () => ({
  requireRole: vi.fn(),
}));

// Mock logger
vi.mock('@/server/logger', () => ({
  createLogger: () => ({
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  }),
}));

import { requireAuth } from '@/server/middleware/auth';
import { checkRateLimit } from '@/server/middleware/rate-limit';
import { requireRole } from '@/server/middleware/rbac';
import { AuthError, ForbiddenError, RateLimitError } from '@/server/errors';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createRequest(
  method = 'GET',
  url = 'http://localhost:3000/api/v1/test',
  body?: unknown,
  headers: Record<string, string> = {},
): NextRequest {
  const init: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer mock-token',
      ...headers,
    },
  };

  if (body && method !== 'GET') {
    init.body = JSON.stringify(body);
  }

  return new NextRequest(url, init as any);
}

async function parseJson<T>(response: Response): Promise<T> {
  return response.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('createApiHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset default mock implementations after clearing
    vi.mocked(checkRateLimit).mockResolvedValue({
      limit: 100,
      remaining: 99,
      reset: Math.floor(Date.now() / 1000) + 900,
    });
    vi.mocked(requireAuth).mockResolvedValue({
      sub: 'user-1',
      pid: 'prop-1',
      role: 'property_admin' as Role,
      perms: ['*'],
      mfa: true,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 900,
    });
    vi.mocked(requireRole).mockImplementation(() => {});
  });

  // --- Middleware execution order ---

  it('executes middleware in order: requestId -> rateLimit -> auth -> rbac -> validate -> handler', async () => {
    const callOrder: string[] = [];

    vi.mocked(checkRateLimit).mockImplementation(async () => {
      callOrder.push('rateLimit');
      return { limit: 100, remaining: 99, reset: Math.floor(Date.now() / 1000) + 900 };
    });
    vi.mocked(requireAuth).mockImplementation(async () => {
      callOrder.push('auth');
      return {
        sub: 'user-1',
        pid: 'prop-1',
        role: 'property_admin' as Role,
        perms: ['*'],
        mfa: true,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900,
      };
    });
    vi.mocked(requireRole).mockImplementation(() => {
      callOrder.push('rbac');
    });

    const handler = createApiHandler({
      allowedRoles: ['property_admin'],
      handler: async () => {
        callOrder.push('handler');
        return { ok: true };
      },
    });

    const req = createRequest();
    await handler(req);

    expect(callOrder).toEqual(['rateLimit', 'auth', 'rbac', 'handler']);
  });

  // --- Stops chain on error ---

  it('stops chain on auth error and returns 401', async () => {
    vi.mocked(requireAuth).mockRejectedValue(new AuthError('Token expired'));

    const handlerFn = vi.fn();
    const handler = createApiHandler({ handler: handlerFn });

    const req = createRequest();
    const res = await handler(req);

    expect(res.status).toBe(401);
    expect(handlerFn).not.toHaveBeenCalled();
  });

  it('stops chain on RBAC error and returns 403', async () => {
    vi.mocked(requireRole).mockImplementation(() => {
      throw new ForbiddenError('Not authorized');
    });

    const handlerFn = vi.fn();
    const handler = createApiHandler({
      allowedRoles: ['super_admin'],
      handler: handlerFn,
    });

    const req = createRequest();
    const res = await handler(req);

    expect(res.status).toBe(403);
    expect(handlerFn).not.toHaveBeenCalled();
  });

  it('stops chain on rate limit error and returns 429', async () => {
    vi.mocked(checkRateLimit).mockRejectedValue(new RateLimitError(60));

    const handlerFn = vi.fn();
    const handler = createApiHandler({ handler: handlerFn });

    const req = createRequest();
    const res = await handler(req);

    expect(res.status).toBe(429);
    expect(handlerFn).not.toHaveBeenCalled();

    // Should include Retry-After header
    expect(res.headers.get('Retry-After')).toBe('60');
  });

  it('stops chain on validation error and returns 400', async () => {
    const bodySchema = z.object({
      name: z.string().min(1),
    });

    const handlerFn = vi.fn();
    const handler = createApiHandler({
      bodySchema,
      handler: handlerFn,
    });

    const req = createRequest('POST', 'http://localhost:3000/api/v1/test', { name: '' });
    const res = await handler(req);

    expect(res.status).toBe(400);
    expect(handlerFn).not.toHaveBeenCalled();

    const body = await parseJson<ApiError>(res);
    expect(body.code).toBe('VALIDATION_ERROR');
    expect(body.fields).toBeDefined();
  });

  // --- Context passing ---

  it('passes decoded token to handler via context', async () => {
    const mockPayload: TokenPayload = {
      sub: 'user-42',
      pid: 'prop-99',
      role: 'front_desk',
      perms: ['event:create'],
      mfa: false,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 900,
    };
    vi.mocked(requireAuth).mockResolvedValue(mockPayload);

    let receivedToken: TokenPayload | null = null;

    const handler = createApiHandler({
      handler: async (ctx) => {
        receivedToken = ctx.token;
        return { ok: true };
      },
    });

    const req = createRequest();
    await handler(req);

    expect(receivedToken).toEqual(mockPayload);
  });

  it('passes validated body to handler', async () => {
    const bodySchema = z.object({ title: z.string() });

    let receivedBody: { title: string } | null = null;

    const handler = createApiHandler({
      bodySchema,
      handler: async (ctx) => {
        receivedBody = ctx.body;
        return { ok: true };
      },
    });

    const req = createRequest('POST', 'http://localhost:3000/api/v1/test', {
      title: 'Hello',
    });
    await handler(req);

    expect(receivedBody).toEqual({ title: 'Hello' });
  });

  it('passes requestId to handler', async () => {
    let receivedRequestId: string | null = null;

    const handler = createApiHandler({
      handler: async (ctx) => {
        receivedRequestId = ctx.requestId;
        return { ok: true };
      },
    });

    const req = createRequest('GET', 'http://localhost:3000/api/v1/test', undefined, {
      'x-request-id': 'custom-req-id-123',
    });
    await handler(req);

    expect(receivedRequestId).toBe('custom-req-id-123');
  });

  it('generates a requestId if none provided', async () => {
    let receivedRequestId: string | null = null;

    const handler = createApiHandler({
      handler: async (ctx) => {
        receivedRequestId = ctx.requestId;
        return { ok: true };
      },
    });

    const req = createRequest();
    await handler(req);

    expect(receivedRequestId).toBeDefined();
    expect(typeof receivedRequestId).toBe('string');
    expect(receivedRequestId!.length).toBeGreaterThan(0);
  });

  // --- Success response ---

  it('wraps handler result in ApiResponse format', async () => {
    const handler = createApiHandler({
      handler: async () => ({ items: [1, 2, 3] }),
    });

    const req = createRequest();
    const res = await handler(req);

    expect(res.status).toBe(200);

    const body = await parseJson<ApiResponse<{ items: number[] }>>(res);
    expect(body.data).toEqual({ items: [1, 2, 3] });
    expect(body.requestId).toBeDefined();
  });

  it('includes x-request-id header in response', async () => {
    const handler = createApiHandler({
      handler: async () => ({ ok: true }),
    });

    const req = createRequest();
    const res = await handler(req);

    expect(res.headers.get('x-request-id')).toBeDefined();
  });

  // --- Auth bypass ---

  it('skips auth when requireAuth is false', async () => {
    const handler = createApiHandler({
      requireAuth: false,
      handler: async (ctx) => ({ role: ctx.token.role }),
    });

    const req = createRequest('GET', 'http://localhost:3000/api/v1/public');
    const res = await handler(req);

    expect(res.status).toBe(200);
    expect(requireAuth).not.toHaveBeenCalled();
  });

  // --- Error response formatting ---

  it('formats unexpected errors as 500 with generic message', async () => {
    const handler = createApiHandler({
      handler: async () => {
        throw new Error('Unexpected database crash');
      },
    });

    const req = createRequest();
    const res = await handler(req);

    expect(res.status).toBe(500);

    const body = await parseJson<ApiError>(res);
    expect(body.code).toBe('INTERNAL_ERROR');
    // Should NOT leak the internal error message
    expect(body.message).not.toContain('database crash');
  });

  it('formats AppError subclasses with correct status codes', async () => {
    const handler = createApiHandler({
      handler: async () => {
        throw new ForbiddenError('Custom forbidden message');
      },
    });

    const req = createRequest();
    const res = await handler(req);

    expect(res.status).toBe(403);

    const body = await parseJson<ApiError>(res);
    expect(body.code).toBe('FORBIDDEN');
    expect(body.message).toBe('Custom forbidden message');
  });

  // --- Query and params validation ---

  it('validates query parameters when querySchema is provided', async () => {
    const querySchema = z.object({
      page: z.string().regex(/^\d+$/),
    });

    const handler = createApiHandler({
      querySchema,
      handler: async (ctx) => ({ page: ctx.query.page }),
    });

    const req = createRequest('GET', 'http://localhost:3000/api/v1/test?page=5');
    const res = await handler(req);

    expect(res.status).toBe(200);
    const body = await parseJson<ApiResponse<{ page: string }>>(res);
    expect(body.data.page).toBe('5');
  });

  it('returns 400 for invalid query parameters', async () => {
    const querySchema = z.object({
      page: z.string().regex(/^\d+$/),
    });

    const handler = createApiHandler({
      querySchema,
      handler: async () => ({ ok: true }),
    });

    const req = createRequest('GET', 'http://localhost:3000/api/v1/test?page=abc');
    const res = await handler(req);

    expect(res.status).toBe(400);
  });
});
