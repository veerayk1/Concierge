/**
 * Concierge — Middleware Chain Integration Tests
 *
 * Full pipeline integration tests: rate limiting -> auth -> RBAC -> validation -> handler.
 * These tests verify the complete request lifecycle through createApiHandler,
 * ensuring middleware executes in the correct order and errors short-circuit
 * the chain appropriately.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { NextRequest } from 'next/server';
import { z } from 'zod';

import { createApiHandler } from '@/server/middleware/chain';
import type { Role, TokenPayload, ApiResponse, ApiError } from '@/types';

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('@/server/middleware/auth', () => ({
  requireAuth: vi.fn(),
}));

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

vi.mock('@/server/middleware/rbac', () => ({
  requireRole: vi.fn(),
}));

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
import { AuthError, ForbiddenError, RateLimitError, ValidationError } from '@/server/errors';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DEFAULT_TOKEN: TokenPayload = {
  sub: 'user-1',
  pid: 'prop-1',
  role: 'property_admin' as Role,
  perms: ['*'],
  mfa: true,
  iat: Math.floor(Date.now() / 1000),
  exp: Math.floor(Date.now() / 1000) + 3600,
};

const DEFAULT_RATE_LIMIT_RESULT = {
  limit: 200,
  remaining: 199,
  reset: Math.floor(Date.now() / 1000) + 60,
};

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
      Authorization: 'Bearer valid-token',
      'x-forwarded-for': '192.168.1.1',
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
// Setup
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(checkRateLimit).mockResolvedValue(DEFAULT_RATE_LIMIT_RESULT);
  vi.mocked(requireAuth).mockResolvedValue({ ...DEFAULT_TOKEN });
  vi.mocked(requireRole).mockImplementation(() => {});
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Middleware Chain Integration', () => {
  // -----------------------------------------------------------------------
  // 1. Full chain: valid request with all middleware passes
  // -----------------------------------------------------------------------
  describe('full chain — valid request', () => {
    it('passes through all middleware and calls the handler', async () => {
      const handlerFn = vi.fn().mockResolvedValue({ message: 'success' });

      const handler = createApiHandler({
        allowedRoles: ['property_admin'],
        rateLimitGroup: 'read',
        handler: handlerFn,
      });

      const req = createRequest();
      const res = await handler(req);

      expect(res.status).toBe(200);
      expect(handlerFn).toHaveBeenCalledTimes(1);

      const body = await parseJson<ApiResponse<{ message: string }>>(res);
      expect(body.data).toEqual({ message: 'success' });
    });

    it('passes handler context with token, requestId, and request', async () => {
      let capturedCtx: any = null;

      const handler = createApiHandler({
        handler: async (ctx) => {
          capturedCtx = ctx;
          return { ok: true };
        },
      });

      const req = createRequest('GET', 'http://localhost:3000/api/v1/test', undefined, {
        'x-request-id': 'req-abc-123',
      });
      await handler(req);

      expect(capturedCtx).not.toBeNull();
      expect(capturedCtx.token.sub).toBe('user-1');
      expect(capturedCtx.requestId).toBe('req-abc-123');
      expect(capturedCtx.req).toBe(req);
    });

    it('validates body and passes typed data to handler', async () => {
      const bodySchema = z.object({
        title: z.string().min(1),
        priority: z.enum(['low', 'medium', 'high']),
      });

      let receivedBody: any = null;

      const handler = createApiHandler({
        bodySchema,
        handler: async (ctx) => {
          receivedBody = ctx.body;
          return { created: true };
        },
      });

      const req = createRequest('POST', 'http://localhost:3000/api/v1/events', {
        title: 'Fire alarm test',
        priority: 'high',
      });
      const res = await handler(req);

      expect(res.status).toBe(200);
      expect(receivedBody).toEqual({ title: 'Fire alarm test', priority: 'high' });
    });
  });

  // -----------------------------------------------------------------------
  // 2. Rate limit exceeded -> 429
  // -----------------------------------------------------------------------
  describe('rate limit exceeded', () => {
    it('returns 429 and does NOT call handler', async () => {
      vi.mocked(checkRateLimit).mockRejectedValue(new RateLimitError(120));

      const handlerFn = vi.fn();
      const handler = createApiHandler({ handler: handlerFn });

      const req = createRequest();
      const res = await handler(req);

      expect(res.status).toBe(429);
      expect(handlerFn).not.toHaveBeenCalled();
    });

    it('includes Retry-After header on 429 response', async () => {
      vi.mocked(checkRateLimit).mockRejectedValue(new RateLimitError(30));

      const handler = createApiHandler({ handler: async () => ({}) });

      const req = createRequest();
      const res = await handler(req);

      expect(res.headers.get('Retry-After')).toBe('30');
    });

    it('includes error code in 429 response body', async () => {
      vi.mocked(checkRateLimit).mockRejectedValue(new RateLimitError(60));

      const handler = createApiHandler({ handler: async () => ({}) });

      const req = createRequest();
      const res = await handler(req);
      const body = await parseJson<ApiError>(res);

      expect(body.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(body.error).toBe('RATE_LIMIT_EXCEEDED');
    });
  });

  // -----------------------------------------------------------------------
  // 3. Missing auth token -> 401
  // -----------------------------------------------------------------------
  describe('missing auth token', () => {
    it('returns 401 and does NOT call handler', async () => {
      vi.mocked(requireAuth).mockRejectedValue(new AuthError('Missing authorization token'));

      const handlerFn = vi.fn();
      const handler = createApiHandler({ handler: handlerFn });

      const req = createRequest();
      const res = await handler(req);

      expect(res.status).toBe(401);
      expect(handlerFn).not.toHaveBeenCalled();
    });

    it('includes AUTH_ERROR code in response body', async () => {
      vi.mocked(requireAuth).mockRejectedValue(new AuthError('Missing authorization token'));

      const handler = createApiHandler({ handler: async () => ({}) });

      const req = createRequest();
      const res = await handler(req);
      const body = await parseJson<ApiError>(res);

      expect(body.code).toBe('AUTH_ERROR');
      expect(body.message).toBe('Missing authorization token');
    });
  });

  // -----------------------------------------------------------------------
  // 4. Invalid auth token -> 401
  // -----------------------------------------------------------------------
  describe('invalid auth token', () => {
    it('returns 401 and does NOT call handler', async () => {
      vi.mocked(requireAuth).mockRejectedValue(new AuthError('Invalid token signature'));

      const handlerFn = vi.fn();
      const handler = createApiHandler({ handler: handlerFn });

      const req = createRequest();
      const res = await handler(req);

      expect(res.status).toBe(401);
      expect(handlerFn).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // 5. Expired auth token -> 401
  // -----------------------------------------------------------------------
  describe('expired auth token', () => {
    it('returns 401 and does NOT call handler', async () => {
      vi.mocked(requireAuth).mockRejectedValue(new AuthError('Token has expired'));

      const handlerFn = vi.fn();
      const handler = createApiHandler({ handler: handlerFn });

      const req = createRequest();
      const res = await handler(req);

      expect(res.status).toBe(401);
      expect(handlerFn).not.toHaveBeenCalled();

      const body = await parseJson<ApiError>(res);
      expect(body.message).toBe('Token has expired');
    });
  });

  // -----------------------------------------------------------------------
  // 6. Wrong role for endpoint -> 403
  // -----------------------------------------------------------------------
  describe('wrong role for endpoint', () => {
    it('returns 403 and does NOT call handler', async () => {
      vi.mocked(requireRole).mockImplementation(() => {
        throw new ForbiddenError("Role 'security_guard' is not authorised for this operation");
      });

      const handlerFn = vi.fn();
      const handler = createApiHandler({
        allowedRoles: ['super_admin', 'property_admin'],
        handler: handlerFn,
      });

      const req = createRequest();
      const res = await handler(req);

      expect(res.status).toBe(403);
      expect(handlerFn).not.toHaveBeenCalled();
    });

    it('includes FORBIDDEN code in response body', async () => {
      vi.mocked(requireRole).mockImplementation(() => {
        throw new ForbiddenError('Insufficient permissions');
      });

      const handler = createApiHandler({
        allowedRoles: ['super_admin'],
        handler: async () => ({}),
      });

      const req = createRequest();
      const res = await handler(req);
      const body = await parseJson<ApiError>(res);

      expect(body.code).toBe('FORBIDDEN');
    });
  });

  // -----------------------------------------------------------------------
  // 7. Validation fails -> 400 with field errors
  // -----------------------------------------------------------------------
  describe('validation failure', () => {
    it('returns 400 with field errors and does NOT call handler', async () => {
      const bodySchema = z.object({
        name: z.string().min(1, 'Name is required'),
        email: z.string().email('Invalid email format'),
      });

      const handlerFn = vi.fn();
      const handler = createApiHandler({
        bodySchema,
        handler: handlerFn,
      });

      const req = createRequest('POST', 'http://localhost:3000/api/v1/test', {
        name: '',
        email: 'not-an-email',
      });
      const res = await handler(req);

      expect(res.status).toBe(400);
      expect(handlerFn).not.toHaveBeenCalled();

      const body = await parseJson<ApiError>(res);
      expect(body.code).toBe('VALIDATION_ERROR');
      expect(body.fields).toBeDefined();
      expect(body.fields!.length).toBeGreaterThanOrEqual(2);

      const fieldNames = body.fields!.map((f) => f.field);
      expect(fieldNames).toContain('name');
      expect(fieldNames).toContain('email');
    });

    it('returns 400 for invalid JSON body', async () => {
      const bodySchema = z.object({ title: z.string() });

      const handlerFn = vi.fn();
      const handler = createApiHandler({
        bodySchema,
        handler: handlerFn,
      });

      // Create a request with malformed JSON body
      const req = new NextRequest('http://localhost:3000/api/v1/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer valid-token',
          'x-forwarded-for': '192.168.1.1',
        },
        body: 'not valid json{{{',
      } as any);

      const res = await handler(req);

      expect(res.status).toBe(400);
      expect(handlerFn).not.toHaveBeenCalled();
    });

    it('returns 400 for invalid query parameters', async () => {
      const querySchema = z.object({
        page: z.string().regex(/^\d+$/, 'Page must be a number'),
        limit: z.string().regex(/^\d+$/, 'Limit must be a number'),
      });

      const handlerFn = vi.fn();
      const handler = createApiHandler({
        querySchema,
        handler: handlerFn,
      });

      const req = createRequest('GET', 'http://localhost:3000/api/v1/test?page=abc&limit=xyz');
      const res = await handler(req);

      expect(res.status).toBe(400);
      expect(handlerFn).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // 8. Middleware order: rate limit checked BEFORE auth
  // -----------------------------------------------------------------------
  describe('middleware ordering', () => {
    it('checks rate limit BEFORE auth (saves DB lookups on abuse)', async () => {
      const callOrder: string[] = [];

      vi.mocked(checkRateLimit).mockImplementation(async () => {
        callOrder.push('rateLimit');
        return DEFAULT_RATE_LIMIT_RESULT;
      });

      vi.mocked(requireAuth).mockImplementation(async () => {
        callOrder.push('auth');
        return { ...DEFAULT_TOKEN };
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

      expect(callOrder.indexOf('rateLimit')).toBeLessThan(callOrder.indexOf('auth'));
    });

    it('rate limit rejection prevents auth from being called', async () => {
      vi.mocked(checkRateLimit).mockRejectedValue(new RateLimitError(60));

      const handler = createApiHandler({
        allowedRoles: ['property_admin'],
        handler: async () => ({ ok: true }),
      });

      const req = createRequest();
      await handler(req);

      expect(checkRateLimit).toHaveBeenCalled();
      expect(requireAuth).not.toHaveBeenCalled();
      expect(requireRole).not.toHaveBeenCalled();
    });

    it('auth failure prevents RBAC from being called', async () => {
      vi.mocked(requireAuth).mockRejectedValue(new AuthError('Token expired'));

      const handler = createApiHandler({
        allowedRoles: ['property_admin'],
        handler: async () => ({ ok: true }),
      });

      const req = createRequest();
      await handler(req);

      expect(checkRateLimit).toHaveBeenCalled();
      expect(requireAuth).toHaveBeenCalled();
      expect(requireRole).not.toHaveBeenCalled();
    });

    it('RBAC failure prevents validation and handler from being called', async () => {
      vi.mocked(requireRole).mockImplementation(() => {
        throw new ForbiddenError('Not authorized');
      });

      const handlerFn = vi.fn();
      const bodySchema = z.object({ title: z.string() });

      const handler = createApiHandler({
        allowedRoles: ['super_admin'],
        bodySchema,
        handler: handlerFn,
      });

      // Body is valid but should never be checked
      const req = createRequest('POST', 'http://localhost:3000/api/v1/test', {
        title: 'Hello',
      });
      const res = await handler(req);

      expect(res.status).toBe(403);
      expect(handlerFn).not.toHaveBeenCalled();
    });

    it('executes full chain in correct order: rateLimit -> auth -> rbac -> handler', async () => {
      const callOrder: string[] = [];

      vi.mocked(checkRateLimit).mockImplementation(async () => {
        callOrder.push('rateLimit');
        return DEFAULT_RATE_LIMIT_RESULT;
      });

      vi.mocked(requireAuth).mockImplementation(async () => {
        callOrder.push('auth');
        return { ...DEFAULT_TOKEN };
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
  });

  // -----------------------------------------------------------------------
  // 9. Request ID generated and included in response headers
  // -----------------------------------------------------------------------
  describe('request ID handling', () => {
    it('includes x-request-id header in successful responses', async () => {
      const handler = createApiHandler({
        handler: async () => ({ ok: true }),
      });

      const req = createRequest();
      const res = await handler(req);

      expect(res.headers.get('x-request-id')).toBeDefined();
      expect(res.headers.get('x-request-id')!.length).toBeGreaterThan(0);
    });

    it('generates a UUID request ID when none is provided', async () => {
      const handler = createApiHandler({
        handler: async () => ({ ok: true }),
      });

      const req = createRequest('GET', 'http://localhost:3000/api/v1/test');
      const res = await handler(req);

      const requestId = res.headers.get('x-request-id')!;
      // UUID v4 format
      expect(requestId).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
      );
    });

    it('preserves incoming x-request-id from upstream proxy', async () => {
      const handler = createApiHandler({
        handler: async () => ({ ok: true }),
      });

      const req = createRequest('GET', 'http://localhost:3000/api/v1/test', undefined, {
        'x-request-id': 'upstream-trace-id-999',
      });
      const res = await handler(req);

      expect(res.headers.get('x-request-id')).toBe('upstream-trace-id-999');
    });

    it('includes x-request-id in error responses too', async () => {
      vi.mocked(requireAuth).mockRejectedValue(new AuthError('Unauthorized'));

      const handler = createApiHandler({
        handler: async () => ({ ok: true }),
      });

      const req = createRequest('GET', 'http://localhost:3000/api/v1/test', undefined, {
        'x-request-id': 'error-trace-id',
      });
      const res = await handler(req);

      expect(res.status).toBe(401);
      expect(res.headers.get('x-request-id')).toBe('error-trace-id');
    });

    it('includes requestId in the JSON response body', async () => {
      const handler = createApiHandler({
        handler: async () => ({ ok: true }),
      });

      const req = createRequest('GET', 'http://localhost:3000/api/v1/test', undefined, {
        'x-request-id': 'body-trace-id',
      });
      const res = await handler(req);
      const body = await parseJson<ApiResponse<unknown>>(res);

      expect(body.requestId).toBe('body-trace-id');
    });
  });

  // -----------------------------------------------------------------------
  // 10. Rate limit headers present on successful responses
  // -----------------------------------------------------------------------
  describe('rate limit headers on success', () => {
    it('calls checkRateLimit for every request', async () => {
      const handler = createApiHandler({
        rateLimitGroup: 'write',
        handler: async () => ({ ok: true }),
      });

      const req = createRequest();
      await handler(req);

      expect(checkRateLimit).toHaveBeenCalledWith('write', expect.any(String));
    });

    it('uses IP from x-forwarded-for as rate limit key', async () => {
      const handler = createApiHandler({
        handler: async () => ({ ok: true }),
      });

      const req = createRequest('GET', 'http://localhost:3000/api/v1/test', undefined, {
        'x-forwarded-for': '10.0.0.42',
      });
      await handler(req);

      expect(checkRateLimit).toHaveBeenCalledWith('read', '10.0.0.42');
    });

    it('defaults rate limit group to read', async () => {
      const handler = createApiHandler({
        handler: async () => ({ ok: true }),
      });

      const req = createRequest();
      await handler(req);

      expect(checkRateLimit).toHaveBeenCalledWith('read', expect.any(String));
    });
  });

  // -----------------------------------------------------------------------
  // 11. Error responses include proper JSON structure
  // -----------------------------------------------------------------------
  describe('error response JSON structure', () => {
    it('auth error includes error, message, and code fields', async () => {
      vi.mocked(requireAuth).mockRejectedValue(new AuthError('Token invalid'));

      const handler = createApiHandler({ handler: async () => ({}) });

      const req = createRequest();
      const res = await handler(req);
      const body = await parseJson<ApiError>(res);

      expect(body).toHaveProperty('error');
      expect(body).toHaveProperty('message');
      expect(body).toHaveProperty('code');
      expect(body).toHaveProperty('requestId');
    });

    it('forbidden error includes error, message, and code fields', async () => {
      vi.mocked(requireRole).mockImplementation(() => {
        throw new ForbiddenError('Access denied');
      });

      const handler = createApiHandler({
        allowedRoles: ['super_admin'],
        handler: async () => ({}),
      });

      const req = createRequest();
      const res = await handler(req);
      const body = await parseJson<ApiError>(res);

      expect(body.error).toBe('FORBIDDEN');
      expect(body.message).toBe('Access denied');
      expect(body.code).toBe('FORBIDDEN');
    });

    it('validation error includes fields array', async () => {
      const bodySchema = z.object({
        title: z.string().min(1),
      });

      const handler = createApiHandler({
        bodySchema,
        handler: async () => ({}),
      });

      const req = createRequest('POST', 'http://localhost:3000/api/v1/test', { title: '' });
      const res = await handler(req);
      const body = await parseJson<ApiError>(res);

      expect(body.code).toBe('VALIDATION_ERROR');
      expect(body.fields).toBeInstanceOf(Array);
      expect(body.fields!.length).toBeGreaterThan(0);
      expect(body.fields![0]).toHaveProperty('field');
      expect(body.fields![0]).toHaveProperty('message');
    });

    it('rate limit error includes proper structure with Retry-After', async () => {
      vi.mocked(checkRateLimit).mockRejectedValue(new RateLimitError(45));

      const handler = createApiHandler({ handler: async () => ({}) });

      const req = createRequest();
      const res = await handler(req);
      const body = await parseJson<ApiError>(res);

      expect(body.code).toBe('RATE_LIMIT_EXCEEDED');
      expect(body.message).toBe('Too many requests');
      expect(res.headers.get('Retry-After')).toBe('45');
    });
  });

  // -----------------------------------------------------------------------
  // 12. Concurrent requests: independent rate limit tracking
  // -----------------------------------------------------------------------
  describe('concurrent requests', () => {
    it('each request gets independent processing through the chain', async () => {
      let callCount = 0;

      vi.mocked(checkRateLimit).mockImplementation(async () => {
        callCount++;
        return DEFAULT_RATE_LIMIT_RESULT;
      });

      const handler = createApiHandler({
        handler: async (ctx) => ({ ip: ctx.req.headers.get('x-forwarded-for') }),
      });

      const req1 = createRequest('GET', 'http://localhost:3000/api/v1/test', undefined, {
        'x-forwarded-for': '10.0.0.1',
      });
      const req2 = createRequest('GET', 'http://localhost:3000/api/v1/test', undefined, {
        'x-forwarded-for': '10.0.0.2',
      });
      const req3 = createRequest('GET', 'http://localhost:3000/api/v1/test', undefined, {
        'x-forwarded-for': '10.0.0.3',
      });

      const [res1, res2, res3] = await Promise.all([handler(req1), handler(req2), handler(req3)]);

      expect(res1.status).toBe(200);
      expect(res2.status).toBe(200);
      expect(res3.status).toBe(200);
      expect(callCount).toBe(3);
    });

    it('rate limit uses per-IP key for each concurrent request', async () => {
      const keys: string[] = [];

      vi.mocked(checkRateLimit).mockImplementation(async (_group, key) => {
        keys.push(key);
        return DEFAULT_RATE_LIMIT_RESULT;
      });

      const handler = createApiHandler({
        handler: async () => ({ ok: true }),
      });

      const req1 = createRequest('GET', 'http://localhost:3000/api/v1/test', undefined, {
        'x-forwarded-for': '192.168.1.100',
      });
      const req2 = createRequest('GET', 'http://localhost:3000/api/v1/test', undefined, {
        'x-forwarded-for': '192.168.1.200',
      });

      await Promise.all([handler(req1), handler(req2)]);

      expect(keys).toContain('192.168.1.100');
      expect(keys).toContain('192.168.1.200');
    });

    it('one rate-limited request does not affect others', async () => {
      let callIndex = 0;

      vi.mocked(checkRateLimit).mockImplementation(async () => {
        callIndex++;
        if (callIndex === 2) {
          throw new RateLimitError(60);
        }
        return DEFAULT_RATE_LIMIT_RESULT;
      });

      const handlerFn = vi.fn().mockResolvedValue({ ok: true });
      const handler = createApiHandler({ handler: handlerFn });

      const req1 = createRequest('GET', 'http://localhost:3000/api/v1/test', undefined, {
        'x-forwarded-for': '10.0.0.1',
      });
      const req2 = createRequest('GET', 'http://localhost:3000/api/v1/test', undefined, {
        'x-forwarded-for': '10.0.0.2',
      });
      const req3 = createRequest('GET', 'http://localhost:3000/api/v1/test', undefined, {
        'x-forwarded-for': '10.0.0.3',
      });

      const results = await Promise.all([handler(req1), handler(req2), handler(req3)]);

      const statuses = results.map((r) => r.status);
      expect(statuses.filter((s) => s === 200).length).toBe(2);
      expect(statuses.filter((s) => s === 429).length).toBe(1);
    });
  });

  // -----------------------------------------------------------------------
  // 13. Handler error caught: returns 500, doesn't crash
  // -----------------------------------------------------------------------
  describe('handler error handling', () => {
    it('returns 500 for unexpected handler errors', async () => {
      const handler = createApiHandler({
        handler: async () => {
          throw new Error('Database connection lost');
        },
      });

      const req = createRequest();
      const res = await handler(req);

      expect(res.status).toBe(500);

      const body = await parseJson<ApiError>(res);
      expect(body.code).toBe('INTERNAL_ERROR');
      // Must not leak internal error details
      expect(body.message).not.toContain('Database connection lost');
    });

    it('returns 500 for non-Error thrown values', async () => {
      const handler = createApiHandler({
        handler: async () => {
          throw 'string error'; // eslint-disable-line no-throw-literal
        },
      });

      const req = createRequest();
      const res = await handler(req);

      expect(res.status).toBe(500);

      const body = await parseJson<ApiError>(res);
      expect(body.code).toBe('INTERNAL_ERROR');
    });

    it('still includes x-request-id header on 500 responses', async () => {
      const handler = createApiHandler({
        handler: async () => {
          throw new Error('Crash');
        },
      });

      const req = createRequest('GET', 'http://localhost:3000/api/v1/test', undefined, {
        'x-request-id': 'crash-trace-id',
      });
      const res = await handler(req);

      expect(res.status).toBe(500);
      expect(res.headers.get('x-request-id')).toBe('crash-trace-id');
    });

    it('maps AppError subclasses thrown in handler to correct status codes', async () => {
      const handler = createApiHandler({
        handler: async () => {
          throw new ForbiddenError('Cannot delete this resource');
        },
      });

      const req = createRequest();
      const res = await handler(req);

      expect(res.status).toBe(403);

      const body = await parseJson<ApiError>(res);
      expect(body.code).toBe('FORBIDDEN');
      expect(body.message).toBe('Cannot delete this resource');
    });

    it('handler returning null/undefined still produces a 200 response', async () => {
      const handler = createApiHandler({
        handler: async () => null as any,
      });

      const req = createRequest();
      const res = await handler(req);

      expect(res.status).toBe(200);
    });
  });

  // -----------------------------------------------------------------------
  // 14. Async handler timeout handling
  // -----------------------------------------------------------------------
  describe('async handler behavior', () => {
    it('handles async handlers that resolve after a delay', async () => {
      const handler = createApiHandler({
        handler: async () => {
          // Simulate async work (DB query, external API call)
          await new Promise((resolve) => setTimeout(resolve, 10));
          return { delayed: true };
        },
      });

      const req = createRequest();
      const res = await handler(req);

      expect(res.status).toBe(200);

      const body = await parseJson<ApiResponse<{ delayed: boolean }>>(res);
      expect(body.data).toEqual({ delayed: true });
    });

    it('handles async handlers that reject after a delay', async () => {
      const handler = createApiHandler({
        handler: async () => {
          await new Promise((resolve) => setTimeout(resolve, 10));
          throw new Error('Timeout from upstream service');
        },
      });

      const req = createRequest();
      const res = await handler(req);

      expect(res.status).toBe(500);

      const body = await parseJson<ApiError>(res);
      expect(body.code).toBe('INTERNAL_ERROR');
    });

    it('concurrent async handlers do not interfere with each other', async () => {
      let activeCount = 0;
      let maxActive = 0;

      const handler = createApiHandler({
        handler: async () => {
          activeCount++;
          maxActive = Math.max(maxActive, activeCount);
          await new Promise((resolve) => setTimeout(resolve, 10));
          activeCount--;
          return { ok: true };
        },
      });

      const requests = Array.from({ length: 5 }, (_, i) =>
        createRequest('GET', `http://localhost:3000/api/v1/test?i=${i}`, undefined, {
          'x-forwarded-for': `10.0.0.${i + 1}`,
        }),
      );

      const results = await Promise.all(requests.map((req) => handler(req)));

      results.forEach((res) => expect(res.status).toBe(200));
      // At least 2 should have been active concurrently
      expect(maxActive).toBeGreaterThanOrEqual(2);
    });
  });

  // -----------------------------------------------------------------------
  // Additional edge cases
  // -----------------------------------------------------------------------
  describe('edge cases', () => {
    it('skips auth when requireAuth is false', async () => {
      const handlerFn = vi.fn().mockResolvedValue({ public: true });
      const handler = createApiHandler({
        requireAuth: false,
        handler: handlerFn,
      });

      const req = createRequest();
      const res = await handler(req);

      expect(res.status).toBe(200);
      expect(requireAuth).not.toHaveBeenCalled();
      expect(handlerFn).toHaveBeenCalled();
    });

    it('skips RBAC when allowedRoles is empty', async () => {
      const handler = createApiHandler({
        allowedRoles: [],
        handler: async () => ({ ok: true }),
      });

      const req = createRequest();
      const res = await handler(req);

      expect(res.status).toBe(200);
      expect(requireRole).not.toHaveBeenCalled();
    });

    it('skips RBAC when requireAuth is false even if allowedRoles is set', async () => {
      const handler = createApiHandler({
        requireAuth: false,
        allowedRoles: ['super_admin'],
        handler: async () => ({ ok: true }),
      });

      const req = createRequest();
      const res = await handler(req);

      expect(res.status).toBe(200);
      expect(requireRole).not.toHaveBeenCalled();
    });
  });
});
