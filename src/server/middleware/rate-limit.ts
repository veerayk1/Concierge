/**
 * Concierge — Rate Limiting Middleware
 *
 * In-memory sliding window counter rate limiter. Tracks requests per
 * (IP + route group) key and returns 429 when limits are exceeded.
 *
 * Rate limit groups are chosen per-route to allow different thresholds
 * for auth endpoints (strict) vs. read endpoints (relaxed).
 *
 * A periodic cleanup timer prevents memory leaks by evicting expired entries.
 */

import { createLogger } from '@/server/logger';
import { RateLimitError } from '@/server/errors';

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

/** Internal tracking entry for a single key. */
interface RateLimitEntry {
  /** Number of requests recorded in the current window. */
  count: number;
  /** Unix timestamp (ms) when the current window started. */
  windowStart: number;
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
// In-memory sliding window store
// ---------------------------------------------------------------------------

/**
 * The store is a Map keyed by `"rl:<group>:<clientKey>"`. Each value tracks
 * the request count and the start of the current window.
 *
 * Exported for testing — not part of the public API contract.
 */
export const store = new Map<string, RateLimitEntry>();

/** Default cleanup interval: 60 seconds. */
const CLEANUP_INTERVAL_MS = 60_000;

/** Handle for the periodic cleanup timer (so tests can stop it). */
let cleanupTimer: ReturnType<typeof setInterval> | null = null;

/**
 * Remove expired entries from the store to prevent unbounded memory growth.
 * An entry is expired when `now - windowStart >= windowSeconds * 1000` for
 * the longest possible window (we use a conservative 1-hour ceiling).
 */
export function cleanupExpiredEntries(nowMs: number = Date.now()): number {
  let removed = 0;
  // Find the maximum window across all groups so we never prematurely evict.
  const maxWindowMs = Math.max(...Object.values(RATE_LIMITS).map((c) => c.windowSeconds * 1_000));

  for (const [key, entry] of store) {
    if (nowMs - entry.windowStart >= maxWindowMs) {
      store.delete(key);
      removed++;
    }
  }

  if (removed > 0) {
    logger.debug({ removed, remaining: store.size }, 'Rate limit store cleanup');
  }

  return removed;
}

/**
 * Start the periodic cleanup timer. Safe to call multiple times — subsequent
 * calls are no-ops if the timer is already running.
 */
export function startCleanupTimer(intervalMs: number = CLEANUP_INTERVAL_MS): void {
  if (cleanupTimer !== null) return;
  cleanupTimer = setInterval(() => cleanupExpiredEntries(), intervalMs);
  // Allow the Node process to exit even if the timer is still running.
  if (typeof cleanupTimer === 'object' && 'unref' in cleanupTimer) {
    cleanupTimer.unref();
  }
}

/**
 * Stop the periodic cleanup timer. Useful in tests and graceful shutdown.
 */
export function stopCleanupTimer(): void {
  if (cleanupTimer !== null) {
    clearInterval(cleanupTimer);
    cleanupTimer = null;
  }
}

// Start the cleanup timer on module load (unref'd so it won't keep the process alive).
startCleanupTimer();

// ---------------------------------------------------------------------------
// Rate limit result type (for header information)
// ---------------------------------------------------------------------------

export interface RateLimitResult {
  /** The maximum number of requests allowed in the window. */
  limit: number;
  /** How many requests remain before the limit is hit. */
  remaining: number;
  /** Unix timestamp (seconds) when the current window resets. */
  reset: number;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Check whether the request should be rate-limited.
 *
 * Uses an in-memory sliding window counter. When the limit is exceeded,
 * throws a `RateLimitError` (HTTP 429).
 *
 * @param group - The rate limit group for this route.
 * @param key   - A unique identifier for the requester (e.g. IP, userId, or composite).
 * @returns Rate limit metadata for setting response headers.
 */
export async function checkRateLimit(group: RateLimitGroup, key: string): Promise<RateLimitResult> {
  const config = RATE_LIMITS[group];
  const storeKey = `rl:${group}:${key}`;
  const now = Date.now();
  const windowMs = config.windowSeconds * 1_000;

  let entry = store.get(storeKey);

  // If no entry exists or the window has expired, start a fresh window.
  if (!entry || now - entry.windowStart >= windowMs) {
    entry = { count: 1, windowStart: now };
    store.set(storeKey, entry);

    const result: RateLimitResult = {
      limit: config.maxRequests,
      remaining: config.maxRequests - 1,
      reset: Math.ceil((now + windowMs) / 1_000),
    };

    logger.debug({ group, key, ...result }, 'Rate limit check — new window');
    return result;
  }

  // Window is still active — increment.
  entry.count += 1;

  const resetMs = entry.windowStart + windowMs;
  const remaining = Math.max(0, config.maxRequests - entry.count);
  const result: RateLimitResult = {
    limit: config.maxRequests,
    remaining,
    reset: Math.ceil(resetMs / 1_000),
  };

  if (entry.count > config.maxRequests) {
    const retryAfter = Math.ceil((resetMs - now) / 1_000);

    logger.warn(
      { group, key, count: entry.count, maxRequests: config.maxRequests, retryAfter },
      'Rate limit exceeded',
    );

    const error = new RateLimitError(retryAfter);
    // Attach rate limit info to the error for the chain middleware to read.
    (error as RateLimitError & { rateLimitResult: RateLimitResult }).rateLimitResult = result;
    throw error;
  }

  logger.debug({ group, key, ...result }, 'Rate limit check — within limits');
  return result;
}

/**
 * Build standard rate limit headers from a `RateLimitResult`.
 */
export function rateLimitHeaders(info: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(info.limit),
    'X-RateLimit-Remaining': String(info.remaining),
    'X-RateLimit-Reset': String(info.reset),
  };
}

/**
 * Reset the in-memory store. **Only use in tests.**
 */
export function _resetStore(): void {
  store.clear();
}
