/**
 * In-Memory Cache with TTL, Tag-Based Invalidation, LRU Eviction
 *
 * Redis-ready interface — swap the backing store for production Redis
 * without changing call sites.
 *
 * Features:
 * - Per-key TTL expiration
 * - Tag-based invalidation (e.g., invalidate all entries for a property)
 * - Glob pattern invalidation (e.g., 'dashboard:*')
 * - LRU eviction when maxEntries is exceeded
 * - Hit/miss/eviction statistics
 * - Deep-clone on read to prevent external mutation
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CacheOptions {
  /** Maximum number of entries before LRU eviction kicks in. Default: 10_000 */
  maxEntries?: number;
}

export interface CacheSetOptions {
  /** Time-to-live in seconds */
  ttl: number;
  /** Tags for group invalidation */
  tags?: string[];
}

export interface CacheStats {
  hits: number;
  misses: number;
  /** Ratio of hits to total requests (0-1). 0 if no requests yet. */
  hitRate: number;
  /** Current number of entries in cache. */
  size: number;
  /** Total number of LRU evictions since creation/last clear. */
  evictions: number;
}

interface CacheEntry<T = unknown> {
  value: string; // JSON-serialized
  expiresAt: number; // Date.now() + ttl * 1000
  tags: string[];
  lastAccessedAt: number;
}

// ---------------------------------------------------------------------------
// Glob-to-RegExp helper
// ---------------------------------------------------------------------------

/**
 * Converts a simple glob pattern (supporting `*` as wildcard) to a RegExp.
 * Escapes all regex-special characters except `*`, which becomes `.*`.
 */
function globToRegExp(pattern: string): RegExp {
  const escaped = pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&');
  const regexStr = escaped.replace(/\*/g, '.*');
  return new RegExp(`^${regexStr}$`);
}

// ---------------------------------------------------------------------------
// Cache class
// ---------------------------------------------------------------------------

export class Cache {
  private store = new Map<string, CacheEntry>();
  private tagIndex = new Map<string, Set<string>>(); // tag -> set of keys
  private maxEntries: number;
  private hits = 0;
  private misses = 0;
  private evictions = 0;

  constructor(options: CacheOptions = {}) {
    this.maxEntries = options.maxEntries ?? 10_000;
  }

  // -----------------------------------------------------------------------
  // Public API
  // -----------------------------------------------------------------------

  /**
   * Retrieve a cached value. Returns null if key is missing or expired.
   * Updates LRU recency on hit.
   */
  get<T = unknown>(key: string): T | null {
    const entry = this.store.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    // Check expiration
    if (Date.now() >= entry.expiresAt) {
      this.removeEntry(key);
      this.misses++;
      return null;
    }

    // Update LRU timestamp
    entry.lastAccessedAt = Date.now();
    this.hits++;

    // Deep clone via JSON round-trip to prevent external mutation
    return JSON.parse(entry.value) as T;
  }

  /**
   * Store a value in the cache.
   *
   * Overloads:
   * - `set(key, value, ttlSeconds)` — simple TTL
   * - `set(key, value, options)` — TTL + tags
   */
  set<T>(key: string, value: T, ttlOrOptions: number | CacheSetOptions): void {
    const { ttl, tags } = this.normalizeSetArgs(ttlOrOptions);

    // Remove old entry if it exists (cleans up tag index)
    if (this.store.has(key)) {
      this.removeEntry(key);
    }

    // Evict if at capacity
    if (this.store.size >= this.maxEntries) {
      this.evictLRU();
    }

    const now = Date.now();
    const entry: CacheEntry = {
      value: JSON.stringify(value),
      expiresAt: now + ttl * 1000,
      tags,
      lastAccessedAt: now,
    };

    this.store.set(key, entry);

    // Update tag index
    for (const tag of tags) {
      let keys = this.tagIndex.get(tag);
      if (!keys) {
        keys = new Set();
        this.tagIndex.set(tag, keys);
      }
      keys.add(key);
    }
  }

  /**
   * Delete a specific key. Returns true if the key existed.
   */
  delete(key: string): boolean {
    if (!this.store.has(key)) return false;
    this.removeEntry(key);
    return true;
  }

  /**
   * Remove all keys matching a glob pattern (e.g., 'dashboard:*').
   * Returns the number of entries removed.
   */
  invalidatePattern(pattern: string): number {
    const regex = globToRegExp(pattern);
    const keysToRemove: string[] = [];

    for (const key of this.store.keys()) {
      if (regex.test(key)) {
        keysToRemove.push(key);
      }
    }

    for (const key of keysToRemove) {
      this.removeEntry(key);
    }

    return keysToRemove.length;
  }

  /**
   * Remove all entries that have the specified tag.
   * Returns the number of entries removed.
   */
  invalidateByTag(tag: string): number {
    const keys = this.tagIndex.get(tag);
    if (!keys || keys.size === 0) return 0;

    const count = keys.size;
    // Copy to array since removeEntry mutates the set
    const keysArray = [...keys];
    for (const key of keysArray) {
      this.removeEntry(key);
    }

    return count;
  }

  /**
   * Get cache statistics.
   */
  getStats(): CacheStats {
    const total = this.hits + this.misses;
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: total === 0 ? 0 : this.hits / total,
      size: this.store.size,
      evictions: this.evictions,
    };
  }

  /**
   * Remove all entries and reset statistics.
   */
  clear(): void {
    this.store.clear();
    this.tagIndex.clear();
    this.hits = 0;
    this.misses = 0;
    this.evictions = 0;
  }

  /**
   * Current number of entries in the cache.
   */
  get size(): number {
    return this.store.size;
  }

  // -----------------------------------------------------------------------
  // Private helpers
  // -----------------------------------------------------------------------

  private normalizeSetArgs(ttlOrOptions: number | CacheSetOptions): {
    ttl: number;
    tags: string[];
  } {
    if (typeof ttlOrOptions === 'number') {
      return { ttl: ttlOrOptions, tags: [] };
    }
    return { ttl: ttlOrOptions.ttl, tags: ttlOrOptions.tags ?? [] };
  }

  /**
   * Remove an entry and clean up its tag index references.
   */
  private removeEntry(key: string): void {
    const entry = this.store.get(key);
    if (!entry) return;

    // Clean up tag index
    for (const tag of entry.tags) {
      const keys = this.tagIndex.get(tag);
      if (keys) {
        keys.delete(key);
        if (keys.size === 0) {
          this.tagIndex.delete(tag);
        }
      }
    }

    this.store.delete(key);
  }

  /**
   * Evict the least recently used entry.
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.store) {
      if (entry.lastAccessedAt < oldestTime) {
        oldestTime = entry.lastAccessedAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.removeEntry(oldestKey);
      this.evictions++;
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton instance for application-wide use
// ---------------------------------------------------------------------------

export const appCache = new Cache({ maxEntries: 10_000 });

// ---------------------------------------------------------------------------
// Cache middleware helper for Next.js API routes
// ---------------------------------------------------------------------------

export interface CacheMiddlewareOptions {
  /** TTL in seconds */
  ttl: number;
  /** Tags for group invalidation */
  tags?: string[];
  /** Function to generate cache key from request. Default: uses URL pathname + search params */
  keyFn?: (request: Request) => string;
}

/**
 * Cache wrapper for API route handlers.
 *
 * Usage:
 * ```ts
 * import { withCache } from '@/server/cache';
 *
 * export const GET = withCache(
 *   { ttl: 30, tags: ['module:dashboard'] },
 *   async (request) => {
 *     // expensive DB query
 *     return NextResponse.json({ data });
 *   }
 * );
 * ```
 */
export function withCache(
  options: CacheMiddlewareOptions,
  handler: (request: Request) => Promise<Response>,
): (request: Request) => Promise<Response> {
  return async (request: Request) => {
    const key = options.keyFn ? options.keyFn(request) : buildCacheKey(request);

    // Check cache
    const cached = appCache.get<{ body: unknown; status: number; headers: Record<string, string> }>(
      key,
    );
    if (cached) {
      return new Response(JSON.stringify(cached.body), {
        status: cached.status,
        headers: {
          'Content-Type': 'application/json',
          'X-Cache': 'HIT',
          ...cached.headers,
        },
      });
    }

    // Execute handler
    const response = await handler(request);

    // Only cache successful responses
    if (response.ok) {
      const clonedResponse = response.clone();
      const body = await clonedResponse.json();

      const tags = options.tags ? [...options.tags] : [];

      appCache.set(key, { body, status: response.status, headers: {} }, { ttl: options.ttl, tags });
    }

    return response;
  };
}

/**
 * Build a cache key from a request's URL.
 */
function buildCacheKey(request: Request): string {
  const url = new URL(request.url);
  // Sort search params for consistent keys
  const params = new URLSearchParams(url.searchParams);
  const sortedParams = new URLSearchParams([...params.entries()].sort());
  return `${url.pathname}?${sortedParams.toString()}`;
}
