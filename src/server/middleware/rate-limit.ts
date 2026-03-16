/**
 * Concierge — Rate Limiting Middleware
 *
 * Defines rate limit groups and their thresholds. The actual enforcement
 * will use Redis (ioredis) with a sliding-window counter once the Redis
 * connection is configured. For now, this module logs rate-limit checks
 * without blocking — a scaffold placeholder.
 *
 * Rate limit groups are chosen per-route to allow different thresholds
 * for auth endpoints (strict) vs. read endpoints (relaxed).
 */

import { createLogger } from '@/server/logger';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Rate limit groups. Each group has its own request-per-window threshold.
 *
 * - `auth`      — Login, token refresh, password reset (strictest)
 * - `read`      — GET / list endpoints (most relaxed)
 * - `write`     — POST / PUT / DELETE mutations
 * - `upload`    — File upload endpoints
 * - `emergency` — Emergency broadcast / voice cascade (very strict)
 */
export type RateLimitGroup = 'auth' | 'read' | 'write' | 'upload' | 'emergency';

/**
 * Configuration for a single rate limit group.
 */
interface RateLimitConfig {
  /** Maximum number of requests allowed within the window. */
  maxRequests: number;
  /** Window duration in seconds. */
  windowSeconds: number;
}

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const logger = createLogger('rate-limit');

/**
 * Default rate limits per group. These values are tuned for a building
 * management portal — high read volume, moderate writes, strict auth.
 *
 * Override via environment variables in production if needed:
 * `RATE_LIMIT_AUTH_MAX`, `RATE_LIMIT_AUTH_WINDOW`, etc.
 */
export const RATE_LIMITS: Record<RateLimitGroup, RateLimitConfig> = {
  auth: {
    maxRequests: toNumber(process.env['RATE_LIMIT_AUTH_MAX'], 10),
    windowSeconds: toNumber(process.env['RATE_LIMIT_AUTH_WINDOW'], 900), // 15 min
  },
  read: {
    maxRequests: toNumber(process.env['RATE_LIMIT_READ_MAX'], 200),
    windowSeconds: toNumber(process.env['RATE_LIMIT_READ_WINDOW'], 60),
  },
  write: {
    maxRequests: toNumber(process.env['RATE_LIMIT_WRITE_MAX'], 60),
    windowSeconds: toNumber(process.env['RATE_LIMIT_WRITE_WINDOW'], 60),
  },
  upload: {
    maxRequests: toNumber(process.env['RATE_LIMIT_UPLOAD_MAX'], 20),
    windowSeconds: toNumber(process.env['RATE_LIMIT_UPLOAD_WINDOW'], 60),
  },
  emergency: {
    maxRequests: toNumber(process.env['RATE_LIMIT_EMERGENCY_MAX'], 5),
    windowSeconds: toNumber(process.env['RATE_LIMIT_EMERGENCY_WINDOW'], 3600), // 1 hr
  },
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Parse an env var to a number, falling back to a default.
 */
function toNumber(value: string | undefined, fallback: number): number {
  if (value === undefined) return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check whether the request should be rate-limited.
 *
 * **Current behaviour (scaffold):** Logs the check and allows the request.
 * **Future behaviour:** Uses a Redis sliding-window counter to enforce limits
 * and throws `RateLimitError` when exceeded.
 *
 * @param group - The rate limit group for this route.
 * @param key   - A unique identifier for the requester (e.g. IP, userId, or composite).
 */
export async function checkRateLimit(group: RateLimitGroup, key: string): Promise<void> {
  const config = RATE_LIMITS[group];

  logger.debug(
    {
      group,
      key,
      maxRequests: config.maxRequests,
      windowSeconds: config.windowSeconds,
    },
    'Rate limit check (scaffold — not enforced)',
  );

  // TODO: Implement Redis sliding-window counter
  // const redis = getRedisClient();
  // const windowKey = `rl:${group}:${key}`;
  // const count = await redis.incr(windowKey);
  // if (count === 1) await redis.expire(windowKey, config.windowSeconds);
  // if (count > config.maxRequests) {
  //   throw new RateLimitError(config.windowSeconds);
  // }
}
