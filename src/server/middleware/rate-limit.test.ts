/**
 * Concierge — Rate Limiting Middleware Tests
 *
 * Tests for rate limit configuration, enforcement behavior,
 * sliding window logic, header values, cleanup mechanism,
 * and different limit groups.
 * Per Security Rulebook C.4.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import {
  checkRateLimit,
  RATE_LIMITS,
  store,
  _resetStore,
  cleanupExpiredEntries,
  startCleanupTimer,
  stopCleanupTimer,
  rateLimitHeaders,
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
// Configuration tests
// ---------------------------------------------------------------------------

describe('RATE_LIMITS configuration', () => {
  it('defines limits for auth group', () => {
    expect(RATE_LIMITS.auth).toBeDefined();
    expect(RATE_LIMITS.auth.maxRequests).toBeGreaterThan(0);
    expect(RATE_LIMITS.auth.windowSeconds).toBeGreaterThan(0);
  });

  it('defines limits for read group', () => {
    expect(RATE_LIMITS.read).toBeDefined();
    expect(RATE_LIMITS.read.maxRequests).toBeGreaterThan(0);
  });

  it('defines limits for write group', () => {
    expect(RATE_LIMITS.write).toBeDefined();
    expect(RATE_LIMITS.write.maxRequests).toBeGreaterThan(0);
  });

  it('defines limits for upload group', () => {
    expect(RATE_LIMITS.upload).toBeDefined();
    expect(RATE_LIMITS.upload.maxRequests).toBeGreaterThan(0);
  });

  it('defines limits for emergency group', () => {
    expect(RATE_LIMITS.emergency).toBeDefined();
    expect(RATE_LIMITS.emergency.maxRequests).toBeGreaterThan(0);
  });

  it('auth group has stricter limits than read group', () => {
    expect(RATE_LIMITS.auth.maxRequests).toBeLessThan(RATE_LIMITS.read.maxRequests);
  });

  it('emergency group has the strictest request limit', () => {
    expect(RATE_LIMITS.emergency.maxRequests).toBeLessThanOrEqual(RATE_LIMITS.auth.maxRequests);
  });

  it('read group has the most relaxed request limit', () => {
    const groups: RateLimitGroup[] = ['auth', 'write', 'upload', 'emergency'];
    for (const group of groups) {
      expect(RATE_LIMITS.read.maxRequests).toBeGreaterThanOrEqual(RATE_LIMITS[group].maxRequests);
    }
  });
});

// ---------------------------------------------------------------------------
// checkRateLimit — enforcement
// ---------------------------------------------------------------------------

describe('checkRateLimit', () => {
  it('allows requests under the limit', async () => {
    await expect(checkRateLimit('read', 'user-1')).resolves.toBeDefined();
  });

  it('does not throw for auth group within limits', async () => {
    await expect(checkRateLimit('auth', '192.168.1.1')).resolves.toBeDefined();
  });

  it('does not throw for write group within limits', async () => {
    await expect(checkRateLimit('write', 'user-2')).resolves.toBeDefined();
  });

  it('does not throw for upload group within limits', async () => {
    await expect(checkRateLimit('upload', 'user-3')).resolves.toBeDefined();
  });

  it('does not throw for emergency group within limits', async () => {
    await expect(checkRateLimit('emergency', 'property-1')).resolves.toBeDefined();
  });

  // --- Hitting the limit and getting blocked ---

  it('throws RateLimitError when auth limit is exceeded', async () => {
    const key = `test-ip-auth-${Date.now()}`;
    const limit = RATE_LIMITS.auth.maxRequests; // 10

    // Make calls up to the limit — should all pass
    for (let i = 0; i < limit; i++) {
      await expect(checkRateLimit('auth', key)).resolves.toBeDefined();
    }

    // The 11th call should throw
    await expect(checkRateLimit('auth', key)).rejects.toThrow(RateLimitError);
  });

  it('throws RateLimitError when emergency limit is exceeded', async () => {
    const key = `test-ip-emergency-${Date.now()}`;
    const limit = RATE_LIMITS.emergency.maxRequests; // 5

    for (let i = 0; i < limit; i++) {
      await expect(checkRateLimit('emergency', key)).resolves.toBeDefined();
    }

    await expect(checkRateLimit('emergency', key)).rejects.toThrow(RateLimitError);
  });

  it('throws RateLimitError when write limit is exceeded', async () => {
    const key = `test-ip-write-${Date.now()}`;
    const limit = RATE_LIMITS.write.maxRequests; // 60

    for (let i = 0; i < limit; i++) {
      await checkRateLimit('write', key);
    }

    await expect(checkRateLimit('write', key)).rejects.toThrow(RateLimitError);
  });

  it('continues to block after the limit is exceeded', async () => {
    const key = `test-ip-block-${Date.now()}`;
    const limit = RATE_LIMITS.emergency.maxRequests; // 5

    for (let i = 0; i < limit; i++) {
      await checkRateLimit('emergency', key);
    }

    // Multiple subsequent requests should all be blocked
    await expect(checkRateLimit('emergency', key)).rejects.toThrow(RateLimitError);
    await expect(checkRateLimit('emergency', key)).rejects.toThrow(RateLimitError);
    await expect(checkRateLimit('emergency', key)).rejects.toThrow(RateLimitError);
  });

  it('resets after window expires', async () => {
    const key = `test-ip-reset-${Date.now()}`;
    const limit = RATE_LIMITS.emergency.maxRequests; // 5
    const windowMs = RATE_LIMITS.emergency.windowSeconds * 1_000;

    // Exhaust the limit
    for (let i = 0; i < limit; i++) {
      await checkRateLimit('emergency', key);
    }

    // Should be blocked
    await expect(checkRateLimit('emergency', key)).rejects.toThrow(RateLimitError);

    // Advance time past the window by manipulating the store entry directly
    const storeKey = `rl:emergency:${key}`;
    const entry = store.get(storeKey);
    expect(entry).toBeDefined();
    // Move windowStart back so the window appears expired
    entry!.windowStart = Date.now() - windowMs - 1;

    // Should be allowed again (new window starts)
    await expect(checkRateLimit('emergency', key)).resolves.toBeDefined();
  });

  it('uses different counters for different keys', async () => {
    const limit = RATE_LIMITS.emergency.maxRequests; // 5

    // Exhaust limit for ip-1
    for (let i = 0; i < limit; i++) {
      await checkRateLimit('emergency', 'ip-1');
    }

    // ip-1 should be blocked
    await expect(checkRateLimit('emergency', 'ip-1')).rejects.toThrow(RateLimitError);

    // ip-2 should still be allowed (independent counter)
    await expect(checkRateLimit('emergency', 'ip-2')).resolves.toBeDefined();
  });

  it('uses different counters for different groups', async () => {
    // Exhaust emergency limit for user-x
    const limit = RATE_LIMITS.emergency.maxRequests; // 5
    for (let i = 0; i < limit; i++) {
      await checkRateLimit('emergency', 'user-x');
    }

    // Emergency should be blocked
    await expect(checkRateLimit('emergency', 'user-x')).rejects.toThrow(RateLimitError);

    // But auth and read groups for same user should still work
    await expect(checkRateLimit('auth', 'user-x')).resolves.toBeDefined();
    await expect(checkRateLimit('read', 'user-x')).resolves.toBeDefined();
    await expect(checkRateLimit('write', 'user-x')).resolves.toBeDefined();
  });
});

// ---------------------------------------------------------------------------
// Rate limit headers
// ---------------------------------------------------------------------------

describe('rate limit headers', () => {
  it('returns correct headers for a successful request', async () => {
    const result = await checkRateLimit('auth', 'header-test');

    expect(result.limit).toBe(RATE_LIMITS.auth.maxRequests);
    expect(result.remaining).toBe(RATE_LIMITS.auth.maxRequests - 1);
    expect(result.reset).toBeGreaterThan(Math.floor(Date.now() / 1_000));
  });

  it('remaining decreases with each request', async () => {
    const key = `header-dec-${Date.now()}`;
    const r1 = await checkRateLimit('auth', key);
    const r2 = await checkRateLimit('auth', key);
    const r3 = await checkRateLimit('auth', key);

    expect(r1.remaining).toBe(RATE_LIMITS.auth.maxRequests - 1);
    expect(r2.remaining).toBe(RATE_LIMITS.auth.maxRequests - 2);
    expect(r3.remaining).toBe(RATE_LIMITS.auth.maxRequests - 3);
  });

  it('remaining is 0 at the limit boundary', async () => {
    const key = `header-zero-${Date.now()}`;
    const limit = RATE_LIMITS.emergency.maxRequests; // 5

    let lastResult: RateLimitResult | undefined;
    for (let i = 0; i < limit; i++) {
      lastResult = await checkRateLimit('emergency', key);
    }

    expect(lastResult!.remaining).toBe(0);
  });

  it('rateLimitHeaders builds correct header map', () => {
    const info: RateLimitResult = { limit: 10, remaining: 7, reset: 1700000000 };
    const headers = rateLimitHeaders(info);

    expect(headers['X-RateLimit-Limit']).toBe('10');
    expect(headers['X-RateLimit-Remaining']).toBe('7');
    expect(headers['X-RateLimit-Reset']).toBe('1700000000');
  });

  it('limit value matches the group config', async () => {
    const groups: RateLimitGroup[] = ['auth', 'read', 'write', 'upload', 'emergency'];

    for (const group of groups) {
      const result = await checkRateLimit(group, `limit-check-${group}`);
      expect(result.limit).toBe(RATE_LIMITS[group].maxRequests);
    }
  });
});

// ---------------------------------------------------------------------------
// Different rate groups have correct thresholds
// ---------------------------------------------------------------------------

describe('rate groups have different thresholds', () => {
  it('auth allows exactly 10 requests before blocking', async () => {
    const key = `auth-exact-${Date.now()}`;
    for (let i = 0; i < 10; i++) {
      await checkRateLimit('auth', key);
    }
    await expect(checkRateLimit('auth', key)).rejects.toThrow(RateLimitError);
  });

  it('emergency allows exactly 5 requests before blocking', async () => {
    const key = `emerg-exact-${Date.now()}`;
    for (let i = 0; i < 5; i++) {
      await checkRateLimit('emergency', key);
    }
    await expect(checkRateLimit('emergency', key)).rejects.toThrow(RateLimitError);
  });

  it('upload allows exactly 20 requests before blocking', async () => {
    const key = `upload-exact-${Date.now()}`;
    for (let i = 0; i < 20; i++) {
      await checkRateLimit('upload', key);
    }
    await expect(checkRateLimit('upload', key)).rejects.toThrow(RateLimitError);
  });
});

// ---------------------------------------------------------------------------
// Cleanup mechanism
// ---------------------------------------------------------------------------

describe('cleanup mechanism', () => {
  it('removes expired entries from the store', async () => {
    const key = 'cleanup-test';
    await checkRateLimit('emergency', key);

    expect(store.size).toBeGreaterThan(0);

    // Move time far into the future (past the longest window)
    const futureMs = Date.now() + 2 * 3600 * 1_000; // 2 hours ahead
    const removed = cleanupExpiredEntries(futureMs);

    expect(removed).toBeGreaterThan(0);
    expect(store.has(`rl:emergency:${key}`)).toBe(false);
  });

  it('does not remove entries within their window', async () => {
    const key = 'cleanup-keep';
    await checkRateLimit('emergency', key);

    const removed = cleanupExpiredEntries(Date.now());

    expect(removed).toBe(0);
    expect(store.has(`rl:emergency:${key}`)).toBe(true);
  });

  it('handles an empty store gracefully', () => {
    expect(store.size).toBe(0);
    const removed = cleanupExpiredEntries(Date.now());
    expect(removed).toBe(0);
  });

  it('startCleanupTimer is idempotent', () => {
    startCleanupTimer(60_000);
    startCleanupTimer(60_000); // second call should be a no-op
    stopCleanupTimer();
  });

  it('stopCleanupTimer is safe when no timer is running', () => {
    stopCleanupTimer();
    stopCleanupTimer(); // should not throw
  });
});

// ---------------------------------------------------------------------------
// Expected rate limits per route group (documentation via tests)
// ---------------------------------------------------------------------------

describe('rate limit values per group', () => {
  it('auth: 10 requests per 15 minutes', () => {
    expect(RATE_LIMITS.auth.maxRequests).toBe(10);
    expect(RATE_LIMITS.auth.windowSeconds).toBe(900);
  });

  it('read: 200 requests per 60 seconds', () => {
    expect(RATE_LIMITS.read.maxRequests).toBe(200);
    expect(RATE_LIMITS.read.windowSeconds).toBe(60);
  });

  it('write: 60 requests per 60 seconds', () => {
    expect(RATE_LIMITS.write.maxRequests).toBe(60);
    expect(RATE_LIMITS.write.windowSeconds).toBe(60);
  });

  it('upload: 20 requests per 60 seconds', () => {
    expect(RATE_LIMITS.upload.maxRequests).toBe(20);
    expect(RATE_LIMITS.upload.windowSeconds).toBe(60);
  });

  it('emergency: 5 requests per 3600 seconds', () => {
    expect(RATE_LIMITS.emergency.maxRequests).toBe(5);
    expect(RATE_LIMITS.emergency.windowSeconds).toBe(3600);
  });
});
