/**
 * Concierge — Detailed Health Check API
 *
 * GET /api/health/detailed
 * Returns comprehensive health status including database and Redis connectivity.
 * No authentication required (but should be rate-limited in production).
 * Used by monitoring dashboards and incident response tooling.
 *
 * Response codes:
 *   200 — All services healthy
 *   200 — Degraded (non-critical service down, e.g. Redis)
 *   503 — Unhealthy (critical service down, e.g. database)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/server/db';
import { handleDemoRequest } from '@/server/demo';

/** Track process start time for uptime calculation */
const startedAt = Date.now();

type ServiceStatus = 'ok' | 'degraded' | 'error';

interface ServiceCheck {
  status: ServiceStatus;
  responseTime: string;
  error?: string;
}

interface DetailedHealthResponse {
  status: 'ok' | 'degraded' | 'unhealthy';
  timestamp: string;
  version: string;
  uptime: number;
  responseTime: string;
  services: {
    database: ServiceCheck;
    redis: ServiceCheck;
  };
}

/**
 * Check database connectivity using a raw query.
 */
async function checkDatabase(): Promise<ServiceCheck> {
  const start = performance.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    const elapsed = Math.round((performance.now() - start) * 100) / 100;
    return { status: 'ok', responseTime: `${elapsed}ms` };
  } catch (err) {
    const elapsed = Math.round((performance.now() - start) * 100) / 100;
    return {
      status: 'error',
      responseTime: `${elapsed}ms`,
      error: err instanceof Error ? err.message : 'Unknown database error',
    };
  }
}

/**
 * Check Redis connectivity.
 * Redis is optional — if REDIS_URL is not configured, returns degraded.
 */
async function checkRedis(): Promise<ServiceCheck> {
  const start = performance.now();
  const redisUrl = process.env['REDIS_URL'];

  if (!redisUrl) {
    const elapsed = Math.round((performance.now() - start) * 100) / 100;
    return {
      status: 'degraded',
      responseTime: `${elapsed}ms`,
      error: 'REDIS_URL not configured',
    };
  }

  try {
    // Dynamic import to avoid hard dependency if ioredis is not available
    const { default: Redis } = await import('ioredis');
    const redis = new Redis(redisUrl, {
      connectTimeout: 3000,
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    });

    await redis.ping();
    const elapsed = Math.round((performance.now() - start) * 100) / 100;
    await redis.quit();
    return { status: 'ok', responseTime: `${elapsed}ms` };
  } catch (err) {
    const elapsed = Math.round((performance.now() - start) * 100) / 100;
    return {
      status: 'degraded',
      responseTime: `${elapsed}ms`,
      error: err instanceof Error ? err.message : 'Unknown Redis error',
    };
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const demoRes = await handleDemoRequest(request);
  if (demoRes) return demoRes;

  const requestStart = performance.now();

  // Read version from package.json
  let version = 'unknown';
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pkg = require('../../../../../package.json') as { version: string };
    version = pkg.version;
  } catch {
    // package.json not available at runtime
  }

  // Run checks concurrently
  const [database, redis] = await Promise.all([checkDatabase(), checkRedis()]);

  const totalResponseTime = Math.round((performance.now() - requestStart) * 100) / 100;
  const uptimeSeconds = Math.floor((Date.now() - startedAt) / 1000);

  // Determine overall status
  // Database down = unhealthy (503)
  // Redis down but DB up = degraded (200)
  // Everything up = ok (200)
  let overallStatus: 'ok' | 'degraded' | 'unhealthy' = 'ok';
  let httpStatus = 200;

  if (database.status === 'error') {
    overallStatus = 'unhealthy';
    httpStatus = 503;
  } else if (redis.status === 'error' || redis.status === 'degraded') {
    overallStatus = 'degraded';
  }

  const body: DetailedHealthResponse = {
    status: overallStatus,
    timestamp: new Date().toISOString(),
    version,
    uptime: uptimeSeconds,
    responseTime: `${totalResponseTime}ms`,
    services: {
      database,
      redis,
    },
  };

  return NextResponse.json(body, {
    status: httpStatus,
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
