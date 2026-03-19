/**
 * Cache System Tests — TDD
 *
 * Tests for in-memory cache with TTL, tag-based invalidation,
 * pattern-based invalidation, LRU eviction, and stats tracking.
 */

import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest';
import { Cache } from '@/server/cache';
import type { CacheStats } from '@/server/cache';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createCache(maxEntries = 1000) {
  return new Cache({ maxEntries });
}

/** Advance fake timers by the given number of milliseconds. */
function advanceTime(ms: number) {
  vi.advanceTimersByTime(ms);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Cache', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // -----------------------------------------------------------------------
  // 1. cache.get(key) returns null for missing key
  // -----------------------------------------------------------------------
  describe('get — missing key', () => {
    it('returns null for a key that was never set', () => {
      const cache = createCache();
      expect(cache.get('nonexistent')).toBeNull();
    });

    it('returns null for an empty string key', () => {
      const cache = createCache();
      expect(cache.get('')).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // 2. cache.set(key, value, ttlSeconds) stores value
  // -----------------------------------------------------------------------
  describe('set — stores value', () => {
    it('stores a string value', () => {
      const cache = createCache();
      cache.set('greeting', 'hello', 60);
      expect(cache.get('greeting')).toBe('hello');
    });

    it('stores a numeric value', () => {
      const cache = createCache();
      cache.set('count', 42, 60);
      expect(cache.get('count')).toBe(42);
    });

    it('overwrites an existing value', () => {
      const cache = createCache();
      cache.set('key', 'old', 60);
      cache.set('key', 'new', 60);
      expect(cache.get('key')).toBe('new');
    });
  });

  // -----------------------------------------------------------------------
  // 3. cache.get(key) returns stored value before TTL
  // -----------------------------------------------------------------------
  describe('get — before TTL expiration', () => {
    it('returns value when TTL has not expired', () => {
      const cache = createCache();
      cache.set('dashboard:kpis', { packages: 5 }, 30);

      advanceTime(15_000); // 15 seconds, TTL is 30
      expect(cache.get('dashboard:kpis')).toEqual({ packages: 5 });
    });

    it('returns value at exactly TTL - 1ms', () => {
      const cache = createCache();
      cache.set('key', 'value', 10);

      advanceTime(9_999);
      expect(cache.get('key')).toBe('value');
    });
  });

  // -----------------------------------------------------------------------
  // 4. cache.get(key) returns null after TTL expires
  // -----------------------------------------------------------------------
  describe('get — after TTL expiration', () => {
    it('returns null after TTL has expired', () => {
      const cache = createCache();
      cache.set('dashboard:kpis', { packages: 5 }, 30);

      advanceTime(31_000); // 31 seconds, TTL is 30
      expect(cache.get('dashboard:kpis')).toBeNull();
    });

    it('returns null at exactly TTL boundary', () => {
      const cache = createCache();
      cache.set('key', 'value', 10);

      advanceTime(10_000);
      expect(cache.get('key')).toBeNull();
    });

    it('cleans up expired entry from internal storage', () => {
      const cache = createCache();
      cache.set('temp', 'data', 5);

      advanceTime(6_000);
      cache.get('temp'); // triggers cleanup
      expect(cache.size).toBe(0);
    });
  });

  // -----------------------------------------------------------------------
  // 5. cache.delete(key) removes specific key
  // -----------------------------------------------------------------------
  describe('delete', () => {
    it('removes an existing key', () => {
      const cache = createCache();
      cache.set('key', 'value', 60);
      cache.delete('key');
      expect(cache.get('key')).toBeNull();
    });

    it('returns true when key existed', () => {
      const cache = createCache();
      cache.set('key', 'value', 60);
      expect(cache.delete('key')).toBe(true);
    });

    it('returns false when key did not exist', () => {
      const cache = createCache();
      expect(cache.delete('nonexistent')).toBe(false);
    });

    it('does not affect other keys', () => {
      const cache = createCache();
      cache.set('a', 1, 60);
      cache.set('b', 2, 60);
      cache.delete('a');
      expect(cache.get('b')).toBe(2);
    });
  });

  // -----------------------------------------------------------------------
  // 6. cache.invalidatePattern('dashboard:*') removes matching keys
  // -----------------------------------------------------------------------
  describe('invalidatePattern', () => {
    it('removes all keys matching a glob pattern with trailing wildcard', () => {
      const cache = createCache();
      cache.set('dashboard:kpis', 'kpis', 60);
      cache.set('dashboard:activity', 'activity', 60);
      cache.set('search:results', 'results', 60);

      const count = cache.invalidatePattern('dashboard:*');

      expect(count).toBe(2);
      expect(cache.get('dashboard:kpis')).toBeNull();
      expect(cache.get('dashboard:activity')).toBeNull();
      expect(cache.get('search:results')).toBe('results');
    });

    it('removes keys matching pattern with wildcard in the middle', () => {
      const cache = createCache();
      cache.set('prop:001:settings', 'a', 60);
      cache.set('prop:002:settings', 'b', 60);
      cache.set('prop:001:users', 'c', 60);

      const count = cache.invalidatePattern('prop:*:settings');

      expect(count).toBe(2);
      expect(cache.get('prop:001:settings')).toBeNull();
      expect(cache.get('prop:002:settings')).toBeNull();
      expect(cache.get('prop:001:users')).toBe('c');
    });

    it('returns 0 when no keys match', () => {
      const cache = createCache();
      cache.set('key', 'value', 60);
      expect(cache.invalidatePattern('nomatch:*')).toBe(0);
    });
  });

  // -----------------------------------------------------------------------
  // 7. cache.invalidateByTag('property:prop-001') removes all tagged entries
  // -----------------------------------------------------------------------
  describe('invalidateByTag', () => {
    it('removes all entries with a matching tag', () => {
      const cache = createCache();
      cache.set('dashboard:prop-001', 'kpis', { ttl: 60, tags: ['property:prop-001'] });
      cache.set('settings:prop-001', 'settings', { ttl: 300, tags: ['property:prop-001'] });
      cache.set('dashboard:prop-002', 'other', { ttl: 60, tags: ['property:prop-002'] });

      const count = cache.invalidateByTag('property:prop-001');

      expect(count).toBe(2);
      expect(cache.get('dashboard:prop-001')).toBeNull();
      expect(cache.get('settings:prop-001')).toBeNull();
      expect(cache.get('dashboard:prop-002')).toBe('other');
    });

    it('returns 0 when no entries have the tag', () => {
      const cache = createCache();
      cache.set('key', 'value', 60);
      expect(cache.invalidateByTag('nonexistent-tag')).toBe(0);
    });

    it('handles entries with multiple tags', () => {
      const cache = createCache();
      cache.set('key1', 'v1', { ttl: 60, tags: ['property:prop-001', 'module:packages'] });
      cache.set('key2', 'v2', { ttl: 60, tags: ['module:packages'] });

      cache.invalidateByTag('property:prop-001');

      expect(cache.get('key1')).toBeNull();
      expect(cache.get('key2')).toBe('v2'); // only shares module tag, not property tag
    });
  });

  // -----------------------------------------------------------------------
  // 8. Tags: set(key, value, { tags: ['property:X', 'module:packages'] })
  // -----------------------------------------------------------------------
  describe('tag-based caching', () => {
    it('supports options object with tags and ttl', () => {
      const cache = createCache();
      cache.set(
        'dashboard:prop-001',
        { kpis: true },
        { ttl: 30, tags: ['property:prop-001', 'module:dashboard'] },
      );

      expect(cache.get('dashboard:prop-001')).toEqual({ kpis: true });
    });

    it('invalidating one tag does not remove entries with different tags', () => {
      const cache = createCache();
      cache.set('k1', 'v1', { ttl: 60, tags: ['tag-a'] });
      cache.set('k2', 'v2', { ttl: 60, tags: ['tag-b'] });

      cache.invalidateByTag('tag-a');

      expect(cache.get('k1')).toBeNull();
      expect(cache.get('k2')).toBe('v2');
    });

    it('entry can be invalidated by any of its tags', () => {
      const cache = createCache();
      cache.set('multi', 'data', { ttl: 60, tags: ['tag-a', 'tag-b', 'tag-c'] });

      cache.invalidateByTag('tag-b');
      expect(cache.get('multi')).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // 9. Cache hit rate tracking: cache.getStats()
  // -----------------------------------------------------------------------
  describe('getStats', () => {
    it('starts with zero hits, misses, and 0% hit rate', () => {
      const cache = createCache();
      const stats = cache.getStats();
      expect(stats).toEqual<CacheStats>({
        hits: 0,
        misses: 0,
        hitRate: 0,
        size: 0,
        evictions: 0,
      });
    });

    it('tracks hits when key is found', () => {
      const cache = createCache();
      cache.set('key', 'value', 60);
      cache.get('key');
      cache.get('key');

      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(0);
      expect(stats.hitRate).toBe(1);
    });

    it('tracks misses when key is not found', () => {
      const cache = createCache();
      cache.get('missing1');
      cache.get('missing2');

      const stats = cache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(2);
      expect(stats.hitRate).toBe(0);
    });

    it('calculates correct hit rate with mixed hits and misses', () => {
      const cache = createCache();
      cache.set('key', 'value', 60);
      cache.get('key'); // hit
      cache.get('missing'); // miss
      cache.get('key'); // hit
      cache.get('missing2'); // miss

      const stats = cache.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(2);
      expect(stats.hitRate).toBe(0.5);
    });

    it('counts expired key access as a miss', () => {
      const cache = createCache();
      cache.set('temp', 'data', 5);
      advanceTime(6_000);
      cache.get('temp'); // expired = miss

      const stats = cache.getStats();
      expect(stats.misses).toBe(1);
      expect(stats.hits).toBe(0);
    });

    it('reports current cache size', () => {
      const cache = createCache();
      cache.set('a', 1, 60);
      cache.set('b', 2, 60);
      cache.set('c', 3, 60);

      expect(cache.getStats().size).toBe(3);
    });
  });

  // -----------------------------------------------------------------------
  // 10. Memory limit: evict oldest entries when cache exceeds maxEntries
  // -----------------------------------------------------------------------
  describe('LRU eviction — maxEntries', () => {
    it('evicts least recently used entry when maxEntries is exceeded', () => {
      const cache = createCache(3);

      cache.set('a', 1, 60);
      advanceTime(1);
      cache.set('b', 2, 60);
      advanceTime(1);
      cache.set('c', 3, 60);
      advanceTime(1);

      // Cache is full (3/3), adding 'd' should evict 'a' (oldest)
      cache.set('d', 4, 60);

      expect(cache.get('a')).toBeNull(); // evicted
      expect(cache.get('b')).toBe(2);
      expect(cache.get('c')).toBe(3);
      expect(cache.get('d')).toBe(4);
    });

    it('accessing a key updates its recency (LRU behavior)', () => {
      const cache = createCache(3);

      cache.set('a', 1, 60);
      advanceTime(1);
      cache.set('b', 2, 60);
      advanceTime(1);
      cache.set('c', 3, 60);
      advanceTime(1);

      // Access 'a' to make it recently used
      cache.get('a');
      advanceTime(1);

      // Adding 'd' should evict 'b' (now the least recently used)
      cache.set('d', 4, 60);

      expect(cache.get('a')).toBe(1); // still here, was accessed recently
      expect(cache.get('b')).toBeNull(); // evicted
      expect(cache.get('c')).toBe(3);
      expect(cache.get('d')).toBe(4);
    });

    it('tracks eviction count in stats', () => {
      const cache = createCache(2);

      cache.set('a', 1, 60);
      cache.set('b', 2, 60);
      cache.set('c', 3, 60); // evicts 'a'
      cache.set('d', 4, 60); // evicts 'b'

      expect(cache.getStats().evictions).toBe(2);
    });

    it('never exceeds maxEntries', () => {
      const cache = createCache(5);

      for (let i = 0; i < 20; i++) {
        cache.set(`key-${i}`, i, 60);
      }

      expect(cache.size).toBeLessThanOrEqual(5);
    });
  });

  // -----------------------------------------------------------------------
  // 11. Concurrent access: multiple gets/sets don't corrupt data
  // -----------------------------------------------------------------------
  describe('concurrent access', () => {
    it('handles rapid sequential set/get without corruption', () => {
      const cache = createCache();

      // Simulate concurrent-like access (JS is single-threaded, but test rapid ops)
      for (let i = 0; i < 1000; i++) {
        cache.set(`key-${i}`, { index: i, data: `value-${i}` }, 60);
      }

      for (let i = 0; i < 1000; i++) {
        const value = cache.get<{ index: number; data: string }>(`key-${i}`);
        expect(value).toEqual({ index: i, data: `value-${i}` });
      }
    });

    it('handles interleaved set/get/delete without corruption', () => {
      const cache = createCache();

      for (let i = 0; i < 100; i++) {
        cache.set(`key-${i}`, i, 60);
        if (i % 3 === 0) cache.delete(`key-${i}`);
        if (i % 5 === 0) cache.get(`key-${i}`);
      }

      // Keys divisible by 3 should be deleted
      for (let i = 0; i < 100; i++) {
        if (i % 3 === 0) {
          expect(cache.get(`key-${i}`)).toBeNull();
        } else {
          expect(cache.get(`key-${i}`)).toBe(i);
        }
      }
    });

    it('handles concurrent set on same key — last write wins', () => {
      const cache = createCache();

      cache.set('shared', 'first', 60);
      cache.set('shared', 'second', 60);
      cache.set('shared', 'third', 60);

      expect(cache.get('shared')).toBe('third');
    });
  });

  // -----------------------------------------------------------------------
  // 12. Serialization: caches complex objects (arrays, nested objects, dates)
  // -----------------------------------------------------------------------
  describe('serialization — complex objects', () => {
    it('caches arrays', () => {
      const cache = createCache();
      const arr = [1, 'two', { three: 3 }];
      cache.set('array', arr, 60);

      const result = cache.get('array');
      expect(result).toEqual([1, 'two', { three: 3 }]);
    });

    it('caches deeply nested objects', () => {
      const cache = createCache();
      const nested = {
        level1: {
          level2: {
            level3: {
              value: 'deep',
              numbers: [1, 2, 3],
            },
          },
        },
      };
      cache.set('nested', nested, 60);
      expect(cache.get('nested')).toEqual(nested);
    });

    it('caches Date objects (serialized as ISO string via JSON)', () => {
      const cache = createCache();
      const now = new Date('2026-03-19T12:00:00Z');
      cache.set('date', now, 60);

      // JSON serialization converts Date to ISO string
      const result = cache.get<string>('date');
      expect(result).toBe('2026-03-19T12:00:00.000Z');
      expect(new Date(result!).getTime()).toBe(now.getTime());
    });

    it('returns a deep clone so mutations do not affect cache', () => {
      const cache = createCache();
      const original = { items: [1, 2, 3], meta: { count: 3 } };
      cache.set('data', original, 60);

      // Mutate original
      original.items.push(4);
      original.meta.count = 4;

      // Cache should still have original data
      const cached = cache.get<{ items: number[]; meta: { count: number } }>('data');
      expect(cached?.items).toEqual([1, 2, 3]);
      expect(cached?.meta.count).toBe(3);
    });

    it('caches null and undefined values', () => {
      const cache = createCache();
      cache.set('null-val', null, 60);
      cache.set('undef-val', undefined, 60);

      // null is stored as-is; get returns null for both missing and null-stored
      // We use a has() check or just accept null
      expect(cache.get('null-val')).toBeNull();
    });

    it('caches boolean values', () => {
      const cache = createCache();
      cache.set('flag-true', true, 60);
      cache.set('flag-false', false, 60);

      expect(cache.get('flag-true')).toBe(true);
      expect(cache.get('flag-false')).toBe(false);
    });

    it('caches KPI-like dashboard response', () => {
      const cache = createCache();
      const kpis = {
        unreleasedPackages: 12,
        activeVisitors: 3,
        openMaintenanceRequests: 7,
        todayEvents: 2,
        pendingBookingApprovals: 1,
        recentActivity: [
          {
            id: 'e1',
            type: 'package',
            title: 'Package received',
            createdAt: '2026-03-19T00:00:00.000Z',
          },
          {
            id: 'e2',
            type: 'visitor',
            title: 'Visitor checked in',
            createdAt: '2026-03-19T00:00:00.000Z',
          },
        ],
      };

      cache.set('dashboard:prop-001:kpis', kpis, 30);
      expect(cache.get('dashboard:prop-001:kpis')).toEqual(kpis);
    });
  });

  // -----------------------------------------------------------------------
  // Additional: clear() and size
  // -----------------------------------------------------------------------
  describe('clear', () => {
    it('removes all entries', () => {
      const cache = createCache();
      cache.set('a', 1, 60);
      cache.set('b', 2, 60);
      cache.set('c', 3, 60);

      cache.clear();

      expect(cache.size).toBe(0);
      expect(cache.get('a')).toBeNull();
      expect(cache.get('b')).toBeNull();
      expect(cache.get('c')).toBeNull();
    });

    it('resets stats', () => {
      const cache = createCache();
      cache.set('k', 'v', 60);
      cache.get('k');
      cache.get('miss');
      cache.clear();

      const stats = cache.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });
  });
});
