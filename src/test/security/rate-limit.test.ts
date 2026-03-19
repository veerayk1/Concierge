/**
 * Rate Limit Security Tests — Security Rulebook C.4
 *
 * Focused security tests for rate limiting enforcement on critical endpoints.
 * Validates that auth endpoints block after threshold, headers are present,
 * IPs have independent counters, windows reset, and emergency broadcast
 * is strictly limited.
 *
 * These tests complement the existing rate-limit.test.ts unit tests
 * with a security-boundary perspective.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import {
  checkRateLimit,
  RATE_LIMITS,
  store,
  _resetStore,
  stopCleanupTimer,
  rateLimitHeaders,
} from '@/server/middleware/rate-limit';
import type { RateLimitResult } from '@/server/middleware/rate-limit';
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
// 1. Auth endpoint blocks after 10 attempts
// ---------------------------------------------------------------------------

describe('Security: Auth endpoint rate limiting', () => {
  it('blocks auth requests after exactly 10 attempts', async () => {
    const attackerIp = `attacker-${Date.now()}`;

    // First 10 requests succeed
    for (let i = 0; i < 10; i++) {
      const result = await checkRateLimit('auth', attackerIp);
      expect(result.remaining).toBe(10 - 1 - i);
    }

    // 11th request is blocked
    await expect(checkRateLimit('auth', attackerIp)).rejects.toThrow(RateLimitError);
  });

  it('RateLimitError contains retryAfter value', async () => {
    const key = `retry-after-${Date.now()}`;

    for (let i = 0; i < 10; i++) {
      await checkRateLimit('auth', key);
    }

    try {
      await checkRateLimit('auth', key);
      expect.unreachable('Should have thrown RateLimitError');
    } catch (e) {
      expect(e).toBeInstanceOf(RateLimitError);
      const error = e as RateLimitError;
      expect(error.retryAfter).toBeGreaterThan(0);
      expect(error.statusCode).toBe(429);
    }
  });
});

// ---------------------------------------------------------------------------
// 2. Rate limit headers present on all responses
// ---------------------------------------------------------------------------

describe('Security: Rate limit headers on all responses', () => {
  it('returns X-RateLimit-Limit header matching group config', async () => {
    const result = await checkRateLimit('auth', 'header-check-1');
    const headers = rateLimitHeaders(result);

    expect(headers['X-RateLimit-Limit']).toBe(String(RATE_LIMITS.auth.maxRequests));
  });

  it('returns X-RateLimit-Remaining that decrements', async () => {
    const key = `header-remaining-${Date.now()}`;
    const r1 = await checkRateLimit('read', key);
    const r2 = await checkRateLimit('read', key);

    expect(r1.remaining).toBeGreaterThan(r2.remaining);
    expect(r2.remaining).toBe(r1.remaining - 1);
  });

  it('returns X-RateLimit-Reset as a future Unix timestamp', async () => {
    const result = await checkRateLimit('write', 'header-reset-check');
    const headers = rateLimitHeaders(result);
    const resetEpoch = Number(headers['X-RateLimit-Reset']);

    expect(resetEpoch).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it('all three standard rate limit headers are present', async () => {
    const result = await checkRateLimit('upload', 'header-presence');
    const headers = rateLimitHeaders(result);

    expect(headers).toHaveProperty('X-RateLimit-Limit');
    expect(headers).toHaveProperty('X-RateLimit-Remaining');
    expect(headers).toHaveProperty('X-RateLimit-Reset');
  });
});

// ---------------------------------------------------------------------------
// 3. Different IPs have independent counters
// ---------------------------------------------------------------------------

describe('Security: IP isolation in rate limiting', () => {
  it('exhausting one IP does not affect another IP', async () => {
    const ip1 = `ip-1-${Date.now()}`;
    const ip2 = `ip-2-${Date.now()}`;

    // Exhaust ip1 for auth
    for (let i = 0; i < RATE_LIMITS.auth.maxRequests; i++) {
      await checkRateLimit('auth', ip1);
    }

    // ip1 is blocked
    await expect(checkRateLimit('auth', ip1)).rejects.toThrow(RateLimitError);

    // ip2 is still fully allowed
    const result = await checkRateLimit('auth', ip2);
    expect(result.remaining).toBe(RATE_LIMITS.auth.maxRequests - 1);
  });

  it('same IP but different groups have independent counters', async () => {
    const ip = `shared-ip-${Date.now()}`;

    // Exhaust auth limit
    for (let i = 0; i < RATE_LIMITS.auth.maxRequests; i++) {
      await checkRateLimit('auth', ip);
    }
    await expect(checkRateLimit('auth', ip)).rejects.toThrow(RateLimitError);

    // Same IP, read group still works
    const readResult = await checkRateLimit('read', ip);
    expect(readResult.remaining).toBe(RATE_LIMITS.read.maxRequests - 1);
  });
});

// ---------------------------------------------------------------------------
// 4. Rate limit resets after window
// ---------------------------------------------------------------------------

describe('Security: Rate limit window reset', () => {
  it('allows requests again after the window expires', async () => {
    const key = `window-reset-${Date.now()}`;

    // Exhaust the auth limit
    for (let i = 0; i < RATE_LIMITS.auth.maxRequests; i++) {
      await checkRateLimit('auth', key);
    }
    await expect(checkRateLimit('auth', key)).rejects.toThrow(RateLimitError);

    // Simulate window expiry by manipulating the store entry
    const storeKey = `rl:auth:${key}`;
    const entry = store.get(storeKey);
    expect(entry).toBeDefined();
    entry!.windowStart = Date.now() - RATE_LIMITS.auth.windowSeconds * 1000 - 1;

    // Should be allowed again with a fresh window
    const result = await checkRateLimit('auth', key);
    expect(result.remaining).toBe(RATE_LIMITS.auth.maxRequests - 1);
  });
});

// ---------------------------------------------------------------------------
// 5. Emergency broadcast rate limited (5 per hour)
// ---------------------------------------------------------------------------

describe('Security: Emergency broadcast rate limiting', () => {
  it('emergency broadcast is limited to 5 per hour', () => {
    expect(RATE_LIMITS.emergency.maxRequests).toBe(5);
    expect(RATE_LIMITS.emergency.windowSeconds).toBe(3600);
  });

  it('blocks emergency broadcast after 5 attempts', async () => {
    const propertyKey = `prop-emergency-${Date.now()}`;

    for (let i = 0; i < 5; i++) {
      await checkRateLimit('emergency', propertyKey);
    }

    await expect(checkRateLimit('emergency', propertyKey)).rejects.toThrow(RateLimitError);
  });

  it('emergency continues blocking on repeated attempts after limit', async () => {
    const key = `emergency-persist-${Date.now()}`;

    for (let i = 0; i < 5; i++) {
      await checkRateLimit('emergency', key);
    }

    // Multiple subsequent attempts should all be blocked
    for (let i = 0; i < 5; i++) {
      await expect(checkRateLimit('emergency', key)).rejects.toThrow(RateLimitError);
    }
  });
});
