/**
 * Health Check API — Comprehensive Tests
 *
 * Tests both /api/health (basic) and /api/health/detailed endpoints.
 * Validates response structure, status codes, and degraded/unhealthy states.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { parseResponse } from '@/test/helpers/api';

// ---------------------------------------------------------------------------
// Mock Setup
// ---------------------------------------------------------------------------

const mockQueryRaw = vi.fn();

vi.mock('@/server/db', () => ({
  prisma: {
    $queryRaw: (...args: unknown[]) => mockQueryRaw(...args),
  },
}));

// Mock ioredis
const mockPing = vi.fn();
const mockQuit = vi.fn();
const mockRedisConstructor = vi.fn();

vi.mock('ioredis', () => ({
  default: class MockRedis {
    constructor(...args: unknown[]) {
      mockRedisConstructor(...args);
    }
    ping = mockPing;
    quit = mockQuit;
  },
}));

// ---------------------------------------------------------------------------
// Basic Health Endpoint: /api/health
// ---------------------------------------------------------------------------

describe('GET /api/health', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('returns 200 with status "ok"', async () => {
    const { GET } = await import('../../health/route');
    const response = await GET();

    expect(response.status).toBe(200);

    const body = await parseResponse<{
      status: string;
      timestamp: string;
      version: string;
      uptime: number;
      responseTime: string;
    }>(response);

    expect(body.status).toBe('ok');
    expect(body.timestamp).toBeDefined();
    expect(typeof body.timestamp).toBe('string');
  });

  it('includes version info', async () => {
    const { GET } = await import('../../health/route');
    const response = await GET();
    const body = await parseResponse<{ version: string }>(response);

    // Version should be a string (either from package.json or 'unknown')
    expect(typeof body.version).toBe('string');
    expect(body.version.length).toBeGreaterThan(0);
  });

  it('includes uptime tracking', async () => {
    const { GET } = await import('../../health/route');
    const response = await GET();
    const body = await parseResponse<{ uptime: number }>(response);

    expect(typeof body.uptime).toBe('number');
    expect(body.uptime).toBeGreaterThanOrEqual(0);
  });

  it('measures response time', async () => {
    const { GET } = await import('../../health/route');
    const response = await GET();
    const body = await parseResponse<{ responseTime: string }>(response);

    expect(body.responseTime).toBeDefined();
    expect(body.responseTime).toMatch(/^\d+(\.\d+)?ms$/);
  });

  it('sets correct cache and security headers', async () => {
    const { GET } = await import('../../health/route');
    const response = await GET();

    expect(response.headers.get('Cache-Control')).toBe('no-store, no-cache, must-revalidate');
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
  });
});

// ---------------------------------------------------------------------------
// Detailed Health Endpoint: /api/health/detailed
// ---------------------------------------------------------------------------

describe('GET /api/health/detailed', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockQueryRaw.mockResolvedValue([{ '?column?': 1 }]);
    mockPing.mockResolvedValue('PONG');
    mockQuit.mockResolvedValue('OK');
    process.env['REDIS_URL'] = 'redis://localhost:6379';
  });

  it('returns 200 with all services healthy', async () => {
    const { GET } = await import('../../health/detailed/route');
    const response = await GET();

    expect(response.status).toBe(200);

    const body = await parseResponse<{
      status: string;
      services: {
        database: { status: string };
        redis: { status: string };
      };
    }>(response);

    expect(body.status).toBe('ok');
    expect(body.services.database.status).toBe('ok');
    expect(body.services.redis.status).toBe('ok');
  });

  it('includes database, redis, and version in response', async () => {
    const { GET } = await import('../../health/detailed/route');
    const response = await GET();
    const body = await parseResponse<{
      version: string;
      uptime: number;
      responseTime: string;
      services: {
        database: { status: string; responseTime: string };
        redis: { status: string; responseTime: string };
      };
    }>(response);

    expect(body.version).toBeDefined();
    expect(typeof body.version).toBe('string');
    expect(body.uptime).toBeDefined();
    expect(typeof body.uptime).toBe('number');
    expect(body.responseTime).toMatch(/^\d+(\.\d+)?ms$/);
    expect(body.services.database).toBeDefined();
    expect(body.services.redis).toBeDefined();
    expect(body.services.database.responseTime).toMatch(/^\d+(\.\d+)?ms$/);
    expect(body.services.redis.responseTime).toMatch(/^\d+(\.\d+)?ms$/);
  });

  it('measures response time for the overall check', async () => {
    const { GET } = await import('../../health/detailed/route');
    const response = await GET();
    const body = await parseResponse<{ responseTime: string }>(response);

    expect(body.responseTime).toBeDefined();
    expect(body.responseTime).toMatch(/^\d+(\.\d+)?ms$/);
  });

  it('returns 503 when database is down', async () => {
    mockQueryRaw.mockRejectedValue(new Error('Connection refused'));

    const { GET } = await import('../../health/detailed/route');
    const response = await GET();

    expect(response.status).toBe(503);

    const body = await parseResponse<{
      status: string;
      services: {
        database: { status: string; error: string };
      };
    }>(response);

    expect(body.status).toBe('unhealthy');
    expect(body.services.database.status).toBe('error');
    expect(body.services.database.error).toContain('Connection refused');
  });

  it('returns degraded status when redis is down but DB is up', async () => {
    mockPing.mockRejectedValue(new Error('Redis connection failed'));

    const { GET } = await import('../../health/detailed/route');
    const response = await GET();

    expect(response.status).toBe(200);

    const body = await parseResponse<{
      status: string;
      services: {
        database: { status: string };
        redis: { status: string; error: string };
      };
    }>(response);

    expect(body.status).toBe('degraded');
    expect(body.services.database.status).toBe('ok');
    expect(body.services.redis.status).toMatch(/degraded|error/);
    expect(body.services.redis.error).toBeDefined();
  });

  it('returns degraded when REDIS_URL is not configured', async () => {
    delete process.env['REDIS_URL'];

    const { GET } = await import('../../health/detailed/route');
    const response = await GET();

    expect(response.status).toBe(200);

    const body = await parseResponse<{
      status: string;
      services: {
        redis: { status: string; error: string };
      };
    }>(response);

    expect(body.status).toBe('degraded');
    expect(body.services.redis.status).toBe('degraded');
    expect(body.services.redis.error).toContain('not configured');
  });

  it('sets correct cache and security headers', async () => {
    const { GET } = await import('../../health/detailed/route');
    const response = await GET();

    expect(response.headers.get('Cache-Control')).toBe('no-store, no-cache, must-revalidate');
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
  });
});
