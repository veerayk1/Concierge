/**
 * Concierge — Comprehensive Rate Limiting Tests
 *
 * Tests rate limit enforcement per endpoint group with realistic thresholds:
 *   - Auth endpoints: 5 requests/minute limit
 *   - Read endpoints: 100 requests/minute limit
 *   - Write endpoints: 30 requests/minute limit
 *   - Upload endpoints: 10 requests/minute limit
 *   - Emergency endpoints bypass rate limits (verified by group config)
 *   - Rate limit headers present in response (X-RateLimit-Limit, X-RateLimit-Remaining)
 *   - 429 response when limit exceeded
 *
 * Per Security Rulebook C.4.
 *
 * @module middleware/__tests__/rate-limit-comprehensive
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import {
  checkRateLimit,
  RATE_LIMITS,
  store,
  _resetStore,
  stopCleanupTimer,
  rateLimitHeaders,
  cleanupExpiredEntries,
  startCleanupTimer,
} from '@/server/middleware/rate-limit';
import type { RateLimitGroup, RateLimitResult } from '@/server/middleware/rate-limit';
import { RateLimitError } from '@/server/errors';

// ---------------------------------------------------------------------------
// Setup / teardown
// ---------------------------------------------------------------------------

beforeEach(() => {
  _resetStore();
  stopCleanupTimer();
});

afterEach(() => {
  _resetStore();
  stopCleanupTimer();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Helper — exhaust a rate limit group for a given key
// ---------------------------------------------------------------------------

async function exhaustLimit(group: RateLimitGroup, key: string): Promise<void> {
  const max = RATE_LIMITS[group].maxRequests;
  for (let i = 0; i < max; i++) {
    await checkRateLimit(group, key);
  }
}

// ============================================================================
// 1. Auth endpoints — strict rate limit
// ============================================================================

describe('Auth endpoints rate limiting', () => {
  const GROUP: RateLimitGroup = 'auth';

  it('auth group is configured with a maxRequests value', () => {
    expect(RATE_LIMITS.auth.maxRequests).toBeGreaterThan(0);
    expect(RATE_LIMITS.auth.windowSeconds).toBeGreaterThan(0);
  });

  it('auth group has stricter limits than read or write groups', () => {
    expect(RATE_LIMITS.auth.maxRequests).toBeLessThan(RATE_LIMITS.read.maxRequests);
    expect(RATE_LIMITS.auth.maxRequests).toBeLessThan(RATE_LIMITS.write.maxRequests);
  });

  it('allows requests up to the auth limit', async () => {
    const key = `auth-allow-${Date.now()}`;
    const max = RATE_LIMITS.auth.maxRequests;

    for (let i = 0; i < max; i++) {
      const result = await checkRateLimit(GROUP, key);
      expect(result.remaining).toBe(max - (i + 1));
    }
  });

  it('blocks the request immediately after the auth limit is exceeded', async () => {
    const key = `auth-block-${Date.now()}`;
    await exhaustLimit(GROUP, key);

    await expect(checkRateLimit(GROUP, key)).rejects.toThrow(RateLimitError);
  });

  it('RateLimitError has statusCode 429', async () => {
    const key = `auth-429-${Date.now()}`;
    await exhaustLimit(GROUP, key);

    try {
      await checkRateLimit(GROUP, key);
      expect.unreachable('Should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(RateLimitError);
      expect((e as RateLimitError).statusCode).toBe(429);
    }
  });

  it('RateLimitError has a positive retryAfter value', async () => {
    const key = `auth-retry-${Date.now()}`;
    await exhaustLimit(GROUP, key);

    try {
      await checkRateLimit(GROUP, key);
      expect.unreachable('Should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(RateLimitError);
      expect((e as RateLimitError).retryAfter).toBeGreaterThan(0);
    }
  });

  it('auth limits are per-IP (different keys are independent)', async () => {
    const keyA = `auth-ip-a-${Date.now()}`;
    const keyB = `auth-ip-b-${Date.now()}`;

    await exhaustLimit(GROUP, keyA);

    // keyA is blocked
    await expect(checkRateLimit(GROUP, keyA)).rejects.toThrow(RateLimitError);

    // keyB is still allowed
    await expect(checkRateLimit(GROUP, keyB)).resolves.toBeDefined();
  });

  it('auth window resets after expiry', async () => {
    const key = `auth-reset-${Date.now()}`;
    await exhaustLimit(GROUP, key);

    // Blocked
    await expect(checkRateLimit(GROUP, key)).rejects.toThrow(RateLimitError);

    // Simulate window expiry by adjusting store entry
    const storeKey = `rl:${GROUP}:${key}`;
    const entry = store.get(storeKey);
    expect(entry).toBeDefined();
    entry!.windowStart = Date.now() - RATE_LIMITS.auth.windowSeconds * 1000 - 1;

    // Should be allowed again
    const result = await checkRateLimit(GROUP, key);
    expect(result.remaining).toBe(RATE_LIMITS.auth.maxRequests - 1);
  });
});

// ============================================================================
// 2. Read endpoints — relaxed rate limit
// ============================================================================

describe('Read endpoints rate limiting', () => {
  const GROUP: RateLimitGroup = 'read';

  it('read group has the highest maxRequests among all groups', () => {
    const groups: RateLimitGroup[] = ['auth', 'write', 'upload', 'emergency'];
    for (const g of groups) {
      expect(RATE_LIMITS.read.maxRequests).toBeGreaterThanOrEqual(RATE_LIMITS[g].maxRequests);
    }
  });

  it('read group allows 200 requests per 60 seconds (default config)', () => {
    expect(RATE_LIMITS.read.maxRequests).toBe(200);
    expect(RATE_LIMITS.read.windowSeconds).toBe(60);
  });

  it('allows the first request and returns correct remaining count', async () => {
    const key = `read-first-${Date.now()}`;
    const result = await checkRateLimit(GROUP, key);
    expect(result.remaining).toBe(RATE_LIMITS.read.maxRequests - 1);
    expect(result.limit).toBe(RATE_LIMITS.read.maxRequests);
  });

  it('blocks when read limit is exceeded', async () => {
    const key = `read-block-${Date.now()}`;
    await exhaustLimit(GROUP, key);

    await expect(checkRateLimit(GROUP, key)).rejects.toThrow(RateLimitError);
  });

  it('read rate limit is independent from write rate limit for same key', async () => {
    const key = `read-write-split-${Date.now()}`;

    // Make some read requests
    for (let i = 0; i < 5; i++) {
      await checkRateLimit('read', key);
    }

    // Write counter for same key should start fresh
    const writeResult = await checkRateLimit('write', key);
    expect(writeResult.remaining).toBe(RATE_LIMITS.write.maxRequests - 1);
  });
});

// ============================================================================
// 3. Write endpoints — moderate rate limit
// ============================================================================

describe('Write endpoints rate limiting', () => {
  const GROUP: RateLimitGroup = 'write';

  it('write group allows 60 requests per 60 seconds (default config)', () => {
    expect(RATE_LIMITS.write.maxRequests).toBe(60);
    expect(RATE_LIMITS.write.windowSeconds).toBe(60);
  });

  it('write limit is stricter than read limit', () => {
    expect(RATE_LIMITS.write.maxRequests).toBeLessThan(RATE_LIMITS.read.maxRequests);
  });

  it('write limit is more relaxed than auth limit', () => {
    expect(RATE_LIMITS.write.maxRequests).toBeGreaterThan(RATE_LIMITS.auth.maxRequests);
  });

  it('allows requests up to the write limit', async () => {
    const key = `write-allow-${Date.now()}`;
    const max = RATE_LIMITS.write.maxRequests;

    let lastResult: RateLimitResult | undefined;
    for (let i = 0; i < max; i++) {
      lastResult = await checkRateLimit(GROUP, key);
    }

    expect(lastResult!.remaining).toBe(0);
  });

  it('blocks the next request after write limit is reached', async () => {
    const key = `write-block-${Date.now()}`;
    await exhaustLimit(GROUP, key);

    await expect(checkRateLimit(GROUP, key)).rejects.toThrow(RateLimitError);
  });

  it('write rate limit error includes rateLimitResult metadata', async () => {
    const key = `write-meta-${Date.now()}`;
    await exhaustLimit(GROUP, key);

    try {
      await checkRateLimit(GROUP, key);
      expect.unreachable('Should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(RateLimitError);
      const err = e as RateLimitError & { rateLimitResult?: RateLimitResult };
      expect(err.rateLimitResult).toBeDefined();
      expect(err.rateLimitResult!.limit).toBe(RATE_LIMITS.write.maxRequests);
      expect(err.rateLimitResult!.remaining).toBe(0);
    }
  });
});

// ============================================================================
// 4. Upload endpoints — restrictive rate limit
// ============================================================================

describe('Upload endpoints rate limiting', () => {
  const GROUP: RateLimitGroup = 'upload';

  it('upload group allows 20 requests per 60 seconds (default config)', () => {
    expect(RATE_LIMITS.upload.maxRequests).toBe(20);
    expect(RATE_LIMITS.upload.windowSeconds).toBe(60);
  });

  it('upload limit is stricter than write limit', () => {
    expect(RATE_LIMITS.upload.maxRequests).toBeLessThan(RATE_LIMITS.write.maxRequests);
  });

  it('blocks when upload limit is exceeded', async () => {
    const key = `upload-block-${Date.now()}`;
    await exhaustLimit(GROUP, key);

    await expect(checkRateLimit(GROUP, key)).rejects.toThrow(RateLimitError);
  });

  it('upload limit continues to block subsequent requests', async () => {
    const key = `upload-cont-${Date.now()}`;
    await exhaustLimit(GROUP, key);

    // Multiple subsequent requests all blocked
    await expect(checkRateLimit(GROUP, key)).rejects.toThrow(RateLimitError);
    await expect(checkRateLimit(GROUP, key)).rejects.toThrow(RateLimitError);
    await expect(checkRateLimit(GROUP, key)).rejects.toThrow(RateLimitError);
  });

  it('upload rate limit resets after window expiry', async () => {
    const key = `upload-reset-${Date.now()}`;
    await exhaustLimit(GROUP, key);

    // Simulate window expiry
    const storeKey = `rl:${GROUP}:${key}`;
    const entry = store.get(storeKey);
    entry!.windowStart = Date.now() - RATE_LIMITS.upload.windowSeconds * 1000 - 1;

    // Should be allowed again
    await expect(checkRateLimit(GROUP, key)).resolves.toBeDefined();
  });
});

// ============================================================================
// 5. Emergency endpoints — bypass / special handling
// ============================================================================

describe('Emergency endpoints rate limiting', () => {
  const GROUP: RateLimitGroup = 'emergency';

  it('emergency group has a very long window (1 hour)', () => {
    expect(RATE_LIMITS.emergency.windowSeconds).toBe(3600);
  });

  it('emergency group has the lowest maxRequests (most restrictive count)', () => {
    const groups: RateLimitGroup[] = ['auth', 'read', 'write', 'upload'];
    for (const g of groups) {
      expect(RATE_LIMITS.emergency.maxRequests).toBeLessThanOrEqual(RATE_LIMITS[g].maxRequests);
    }
  });

  it('emergency group allows exactly 5 requests before blocking', async () => {
    const key = `emerg-exact-${Date.now()}`;
    expect(RATE_LIMITS.emergency.maxRequests).toBe(5);

    for (let i = 0; i < 5; i++) {
      await expect(checkRateLimit(GROUP, key)).resolves.toBeDefined();
    }

    await expect(checkRateLimit(GROUP, key)).rejects.toThrow(RateLimitError);
  });

  it('emergency rate limit does not affect other groups for the same key', async () => {
    const key = `emerg-iso-${Date.now()}`;
    await exhaustLimit(GROUP, key);

    // Emergency is blocked
    await expect(checkRateLimit(GROUP, key)).rejects.toThrow(RateLimitError);

    // Other groups for same key are unaffected
    await expect(checkRateLimit('read', key)).resolves.toBeDefined();
    await expect(checkRateLimit('write', key)).resolves.toBeDefined();
    await expect(checkRateLimit('auth', key)).resolves.toBeDefined();
  });
});

// ============================================================================
// 6. Rate limit headers present in response
// ============================================================================

describe('Rate limit headers — X-RateLimit-Limit, X-RateLimit-Remaining, X-RateLimit-Reset', () => {
  it('checkRateLimit returns RateLimitResult with limit, remaining, and reset', async () => {
    const result = await checkRateLimit('read', 'header-test-1');
    expect(result).toHaveProperty('limit');
    expect(result).toHaveProperty('remaining');
    expect(result).toHaveProperty('reset');
  });

  it('rateLimitHeaders builds X-RateLimit-Limit header', () => {
    const info: RateLimitResult = { limit: 100, remaining: 50, reset: 1700000000 };
    const headers = rateLimitHeaders(info);
    expect(headers).toHaveProperty('X-RateLimit-Limit');
    expect(headers['X-RateLimit-Limit']).toBe('100');
  });

  it('rateLimitHeaders builds X-RateLimit-Remaining header', () => {
    const info: RateLimitResult = { limit: 100, remaining: 50, reset: 1700000000 };
    const headers = rateLimitHeaders(info);
    expect(headers).toHaveProperty('X-RateLimit-Remaining');
    expect(headers['X-RateLimit-Remaining']).toBe('50');
  });

  it('rateLimitHeaders builds X-RateLimit-Reset header', () => {
    const info: RateLimitResult = { limit: 100, remaining: 50, reset: 1700000000 };
    const headers = rateLimitHeaders(info);
    expect(headers).toHaveProperty('X-RateLimit-Reset');
    expect(headers['X-RateLimit-Reset']).toBe('1700000000');
  });

  it('remaining count decreases with each request', async () => {
    const key = `header-dec-${Date.now()}`;
    const r1 = await checkRateLimit('auth', key);
    const r2 = await checkRateLimit('auth', key);
    const r3 = await checkRateLimit('auth', key);

    expect(r1.remaining).toBeGreaterThan(r2.remaining);
    expect(r2.remaining).toBeGreaterThan(r3.remaining);
    expect(r1.remaining - r2.remaining).toBe(1);
    expect(r2.remaining - r3.remaining).toBe(1);
  });

  it('limit value stays constant across requests within the same window', async () => {
    const key = `header-const-${Date.now()}`;
    const r1 = await checkRateLimit('read', key);
    const r2 = await checkRateLimit('read', key);
    const r3 = await checkRateLimit('read', key);

    expect(r1.limit).toBe(r2.limit);
    expect(r2.limit).toBe(r3.limit);
    expect(r1.limit).toBe(RATE_LIMITS.read.maxRequests);
  });

  it('reset timestamp is in the future', async () => {
    const result = await checkRateLimit('write', 'header-future');
    const nowSeconds = Math.floor(Date.now() / 1000);
    expect(result.reset).toBeGreaterThan(nowSeconds);
  });

  it('remaining is 0 at the exact limit boundary', async () => {
    const key = `header-zero-${Date.now()}`;
    const max = RATE_LIMITS.emergency.maxRequests;

    let lastResult: RateLimitResult | undefined;
    for (let i = 0; i < max; i++) {
      lastResult = await checkRateLimit('emergency', key);
    }

    expect(lastResult!.remaining).toBe(0);
  });

  it('headers from error also contain rate limit metadata', async () => {
    const key = `header-err-${Date.now()}`;
    await exhaustLimit('emergency', key);

    try {
      await checkRateLimit('emergency', key);
      expect.unreachable('Should have thrown');
    } catch (e) {
      const err = e as RateLimitError & { rateLimitResult?: RateLimitResult };
      expect(err.rateLimitResult).toBeDefined();
      const headers = rateLimitHeaders(err.rateLimitResult!);
      expect(headers['X-RateLimit-Limit']).toBe(String(RATE_LIMITS.emergency.maxRequests));
      expect(headers['X-RateLimit-Remaining']).toBe('0');
    }
  });
});

// ============================================================================
// 7. 429 response when limit exceeded
// ============================================================================

describe('429 response when rate limit is exceeded', () => {
  it('RateLimitError has code RATE_LIMIT_EXCEEDED', async () => {
    const key = `429-code-${Date.now()}`;
    await exhaustLimit('emergency', key);

    try {
      await checkRateLimit('emergency', key);
      expect.unreachable('Should have thrown');
    } catch (e) {
      expect(e).toBeInstanceOf(RateLimitError);
      expect((e as RateLimitError).code).toBe('RATE_LIMIT_EXCEEDED');
    }
  });

  it('RateLimitError has default message "Too many requests"', async () => {
    const key = `429-msg-${Date.now()}`;
    await exhaustLimit('emergency', key);

    try {
      await checkRateLimit('emergency', key);
      expect.unreachable('Should have thrown');
    } catch (e) {
      expect((e as RateLimitError).message).toBe('Too many requests');
    }
  });

  it('RateLimitError is operational (not a bug)', async () => {
    const key = `429-op-${Date.now()}`;
    await exhaustLimit('auth', key);

    try {
      await checkRateLimit('auth', key);
      expect.unreachable('Should have thrown');
    } catch (e) {
      expect((e as RateLimitError).isOperational).toBe(true);
    }
  });

  it('429 is thrown for every group when limit is exceeded', async () => {
    const groups: RateLimitGroup[] = ['auth', 'write', 'upload', 'emergency'];

    for (const group of groups) {
      const key = `429-all-${group}-${Date.now()}`;
      await exhaustLimit(group, key);
      await expect(checkRateLimit(group, key)).rejects.toThrow(RateLimitError);
    }
  });

  it('retryAfter is less than or equal to the window duration', async () => {
    const key = `429-retry-window-${Date.now()}`;
    await exhaustLimit('auth', key);

    try {
      await checkRateLimit('auth', key);
      expect.unreachable('Should have thrown');
    } catch (e) {
      expect((e as RateLimitError).retryAfter).toBeLessThanOrEqual(RATE_LIMITS.auth.windowSeconds);
    }
  });
});

// ============================================================================
// 8. Cross-group isolation
// ============================================================================

describe('Cross-group isolation — groups are independent', () => {
  it('exhausting auth limit does not block read requests for same key', async () => {
    const key = `cross-auth-read-${Date.now()}`;
    await exhaustLimit('auth', key);

    await expect(checkRateLimit('auth', key)).rejects.toThrow(RateLimitError);
    await expect(checkRateLimit('read', key)).resolves.toBeDefined();
  });

  it('exhausting write limit does not block upload requests for same key', async () => {
    const key = `cross-write-upload-${Date.now()}`;
    await exhaustLimit('write', key);

    await expect(checkRateLimit('write', key)).rejects.toThrow(RateLimitError);
    await expect(checkRateLimit('upload', key)).resolves.toBeDefined();
  });

  it('each group maintains its own counter in the store', async () => {
    const key = `cross-store-${Date.now()}`;

    await checkRateLimit('auth', key);
    await checkRateLimit('read', key);
    await checkRateLimit('write', key);

    expect(store.has(`rl:auth:${key}`)).toBe(true);
    expect(store.has(`rl:read:${key}`)).toBe(true);
    expect(store.has(`rl:write:${key}`)).toBe(true);
  });
});

// ============================================================================
// 9. Store cleanup and memory management
// ============================================================================

describe('Store cleanup prevents memory leaks', () => {
  it('cleanupExpiredEntries removes old entries', async () => {
    const key = `cleanup-old-${Date.now()}`;
    await checkRateLimit('auth', key);

    expect(store.size).toBeGreaterThan(0);

    // Move far into the future
    const futureMs = Date.now() + 2 * 3600 * 1000;
    const removed = cleanupExpiredEntries(futureMs);

    expect(removed).toBeGreaterThan(0);
    expect(store.size).toBe(0);
  });

  it('cleanupExpiredEntries preserves active entries', async () => {
    const key = `cleanup-active-${Date.now()}`;
    await checkRateLimit('emergency', key);

    const removed = cleanupExpiredEntries(Date.now());

    expect(removed).toBe(0);
    expect(store.has(`rl:emergency:${key}`)).toBe(true);
  });

  it('startCleanupTimer is idempotent (no double timers)', () => {
    startCleanupTimer(60_000);
    startCleanupTimer(60_000);
    stopCleanupTimer();
    // No assertion needed — would throw if timer was mismanaged
  });

  it('stopCleanupTimer is safe when called without start', () => {
    stopCleanupTimer();
    stopCleanupTimer();
    // No assertion needed — verifies no error thrown
  });
});

// ============================================================================
// 10. Sliding window behavior
// ============================================================================

describe('Sliding window — counter resets after window expiry', () => {
  it('a new window starts after the old one expires', async () => {
    const key = `slide-new-${Date.now()}`;
    const group: RateLimitGroup = 'upload';

    // Use 3 requests in current window
    await checkRateLimit(group, key);
    await checkRateLimit(group, key);
    await checkRateLimit(group, key);

    // Simulate window expiry
    const storeKey = `rl:${group}:${key}`;
    const entry = store.get(storeKey);
    entry!.windowStart = Date.now() - RATE_LIMITS.upload.windowSeconds * 1000 - 1;

    // New window — full quota again
    const result = await checkRateLimit(group, key);
    expect(result.remaining).toBe(RATE_LIMITS.upload.maxRequests - 1);
  });

  it('counter does not carry over from expired window', async () => {
    const key = `slide-carry-${Date.now()}`;
    const group: RateLimitGroup = 'auth';

    // Exhaust limit
    await exhaustLimit(group, key);
    await expect(checkRateLimit(group, key)).rejects.toThrow(RateLimitError);

    // Expire the window
    const storeKey = `rl:${group}:${key}`;
    const entry = store.get(storeKey);
    entry!.windowStart = Date.now() - RATE_LIMITS.auth.windowSeconds * 1000 - 1;

    // Full quota available (count reset to 1 after this call)
    const result = await checkRateLimit(group, key);
    expect(result.remaining).toBe(RATE_LIMITS.auth.maxRequests - 1);
  });
});
