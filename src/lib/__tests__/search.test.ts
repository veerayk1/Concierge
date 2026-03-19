/**
 * Concierge — Search Enhancement Tests
 *
 * Tests debounced search, query sanitization (XSS prevention),
 * URL encoding, empty search behavior, and special characters.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// ---------------------------------------------------------------------------
// Search Utilities Under Test
// ---------------------------------------------------------------------------

// We define and test the search utilities inline since they will be
// extracted into a search module. This follows TDD — tests first.

// --- Debounce ---------------------------------------------------------------

type DebouncedFn<T extends (...args: unknown[]) => unknown> = {
  (...args: Parameters<T>): void;
  cancel: () => void;
};

function debounce<T extends (...args: unknown[]) => unknown>(
  fn: T,
  delayMs: number = 300,
): DebouncedFn<T> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debounced = ((...args: Parameters<T>) => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }
    timeoutId = setTimeout(() => {
      fn(...args);
      timeoutId = null;
    }, delayMs);
  }) as DebouncedFn<T>;

  debounced.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
}

// --- Search Query Sanitization (XSS Prevention) ----------------------------

/**
 * Sanitizes a search query to prevent XSS and injection attacks:
 * - Strips HTML tags
 * - Removes null bytes and control characters
 * - Trims and collapses whitespace
 * - Limits length to prevent abuse
 */
function sanitizeSearchQuery(query: string, maxLength: number = 200): string {
  if (!query || typeof query !== 'string') {
    return '';
  }

  let sanitized = query;

  // Remove null bytes and control characters (except space, tab)
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Strip HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  // Remove javascript: protocol patterns (case-insensitive)
  sanitized = sanitized.replace(/javascript\s*:/gi, '');

  // Remove on-event handlers
  sanitized = sanitized.replace(/on\w+\s*=/gi, '');

  // Trim and collapse whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();

  // Truncate to max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  return sanitized;
}

// --- Search URL Parameter Encoding ------------------------------------------

/**
 * Builds a search query parameter string for use in URLs.
 * Properly encodes the query and adds optional filters.
 */
function buildSearchParams(query: string, filters?: Record<string, string>): string {
  const params = new URLSearchParams();

  const sanitized = sanitizeSearchQuery(query);
  if (sanitized) {
    params.set('q', sanitized);
  }

  if (filters) {
    for (const [key, value] of Object.entries(filters)) {
      if (value) {
        params.set(key, value);
      }
    }
  }

  return params.toString();
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('search utilities', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // ---- 1. Debounced Search -------------------------------------------------

  describe('debounce', () => {
    it('delays execution by the default 300ms', () => {
      const fn = vi.fn();
      const debounced = debounce(fn);

      debounced();
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(299);
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('resets the timer on subsequent calls within the delay', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 300);

      debounced();
      vi.advanceTimersByTime(200);
      debounced(); // restart timer
      vi.advanceTimersByTime(200);
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(100);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('uses a custom delay', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 500);

      debounced();
      vi.advanceTimersByTime(499);
      expect(fn).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('passes arguments to the underlying function', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 100);

      debounced('pool', 'open');
      vi.advanceTimersByTime(100);

      expect(fn).toHaveBeenCalledWith('pool', 'open');
    });

    it('only fires once after rapid calls', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 300);

      debounced();
      debounced();
      debounced();
      debounced();
      debounced();

      vi.advanceTimersByTime(300);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('can be cancelled', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 300);

      debounced();
      vi.advanceTimersByTime(200);
      debounced.cancel();

      vi.advanceTimersByTime(300);
      expect(fn).not.toHaveBeenCalled();
    });

    it('fires the last call arguments after rapid input', () => {
      const fn = vi.fn();
      const debounced = debounce(fn, 300);

      debounced('first');
      debounced('second');
      debounced('third');

      vi.advanceTimersByTime(300);
      expect(fn).toHaveBeenCalledWith('third');
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  // ---- 2. Search Query Sanitization (XSS Prevention) ----------------------

  describe('sanitizeSearchQuery', () => {
    it('returns a normal query unchanged', () => {
      expect(sanitizeSearchQuery('pool booking')).toBe('pool booking');
    });

    it('strips HTML tags', () => {
      expect(sanitizeSearchQuery('<script>alert("xss")</script>pool')).toBe('alert("xss")pool');
    });

    it('strips img tags with event handlers', () => {
      // The entire <img ...> is a single tag and is stripped completely
      expect(sanitizeSearchQuery('<img onerror=alert(1) src=x>')).toBe('');
      // Partial tags with text content preserve the text
      expect(sanitizeSearchQuery('test<img onerror=alert(1) src=x>result')).toBe('testresult');
    });

    it('removes javascript: protocol', () => {
      expect(sanitizeSearchQuery('javascript:alert(1)')).toBe('alert(1)');
      expect(sanitizeSearchQuery('JAVASCRIPT:alert(1)')).toBe('alert(1)');
    });

    it('removes on-event handlers', () => {
      expect(sanitizeSearchQuery('test onerror=alert(1)')).toBe('test alert(1)');
      expect(sanitizeSearchQuery('test onclick=steal()')).toBe('test steal()');
    });

    it('removes null bytes', () => {
      expect(sanitizeSearchQuery('hello\x00world')).toBe('helloworld');
    });

    it('removes control characters', () => {
      expect(sanitizeSearchQuery('hello\x01\x02\x03world')).toBe('helloworld');
    });

    it('trims whitespace', () => {
      expect(sanitizeSearchQuery('  pool  ')).toBe('pool');
    });

    it('collapses internal whitespace', () => {
      expect(sanitizeSearchQuery('pool    booking   gym')).toBe('pool booking gym');
    });

    it('returns empty string for empty input', () => {
      expect(sanitizeSearchQuery('')).toBe('');
    });

    it('returns empty string for null/undefined', () => {
      expect(sanitizeSearchQuery(null as unknown as string)).toBe('');
      expect(sanitizeSearchQuery(undefined as unknown as string)).toBe('');
    });

    it('truncates to maxLength', () => {
      const longQuery = 'a'.repeat(300);
      const result = sanitizeSearchQuery(longQuery, 200);
      expect(result.length).toBe(200);
    });

    it('uses default maxLength of 200', () => {
      const longQuery = 'a'.repeat(250);
      const result = sanitizeSearchQuery(longQuery);
      expect(result.length).toBe(200);
    });

    it('preserves legitimate special characters in queries', () => {
      expect(sanitizeSearchQuery('unit #1502')).toBe('unit #1502');
      expect(sanitizeSearchQuery("O'Brien")).toBe("O'Brien");
      expect(sanitizeSearchQuery('$1,500.00')).toBe('$1,500.00');
    });
  });

  // ---- 3. Empty Search Clears Results --------------------------------------

  describe('empty search behavior', () => {
    it('sanitized empty string produces empty string', () => {
      expect(sanitizeSearchQuery('')).toBe('');
    });

    it('whitespace-only input produces empty string', () => {
      expect(sanitizeSearchQuery('   ')).toBe('');
    });

    it('buildSearchParams omits q param for empty query', () => {
      const params = buildSearchParams('');
      expect(params).toBe('');
      expect(params).not.toContain('q=');
    });

    it('buildSearchParams omits q param for whitespace-only query', () => {
      const params = buildSearchParams('   ');
      expect(params).toBe('');
    });
  });

  // ---- 4. URL Encoding of Search Parameters --------------------------------

  describe('buildSearchParams', () => {
    it('properly URL-encodes the query', () => {
      const params = buildSearchParams('pool & gym');
      expect(params).toContain('q=pool+%26+gym');
    });

    it('encodes special characters', () => {
      const params = buildSearchParams('unit #1502');
      expect(params).toContain('q=unit+%231502');
    });

    it('includes filter parameters', () => {
      const params = buildSearchParams('pool', { status: 'open', type: 'amenity' });
      const urlParams = new URLSearchParams(params);

      expect(urlParams.get('q')).toBe('pool');
      expect(urlParams.get('status')).toBe('open');
      expect(urlParams.get('type')).toBe('amenity');
    });

    it('omits empty filter values', () => {
      const params = buildSearchParams('pool', { status: '', type: 'amenity' });
      const urlParams = new URLSearchParams(params);

      expect(urlParams.has('status')).toBe(false);
      expect(urlParams.get('type')).toBe('amenity');
    });

    it('sanitizes the query before encoding', () => {
      const params = buildSearchParams('<script>alert("xss")</script>');
      expect(params).not.toContain('<script>');
      expect(params).not.toContain('</script>');
    });

    it('returns empty string when query and filters are all empty', () => {
      expect(buildSearchParams('', {})).toBe('');
    });

    it('returns only filters when query is empty', () => {
      const params = buildSearchParams('', { status: 'active' });
      const urlParams = new URLSearchParams(params);

      expect(urlParams.has('q')).toBe(false);
      expect(urlParams.get('status')).toBe('active');
    });
  });

  // ---- 5. Special Characters in Search Queries -----------------------------

  describe('special characters in search', () => {
    it('handles parentheses', () => {
      const sanitized = sanitizeSearchQuery('TSCC (2934)');
      expect(sanitized).toBe('TSCC (2934)');
    });

    it('handles slashes', () => {
      const sanitized = sanitizeSearchQuery('unit 15/A');
      expect(sanitized).toBe('unit 15/A');
    });

    it('handles email-like patterns', () => {
      const sanitized = sanitizeSearchQuery('john@example.com');
      expect(sanitized).toBe('john@example.com');
    });

    it('handles French characters', () => {
      const sanitized = sanitizeSearchQuery('résidence côté');
      expect(sanitized).toBe('résidence côté');
    });

    it('handles ampersand', () => {
      const params = buildSearchParams('pool & spa');
      const urlParams = new URLSearchParams(params);
      expect(urlParams.get('q')).toBe('pool & spa');
    });

    it('handles plus signs', () => {
      const params = buildSearchParams('unit 1+2');
      const urlParams = new URLSearchParams(params);
      expect(urlParams.get('q')).toBe('unit 1+2');
    });

    it('handles percent signs', () => {
      const params = buildSearchParams('50% discount');
      const urlParams = new URLSearchParams(params);
      expect(urlParams.get('q')).toBe('50% discount');
    });

    it('handles quotes', () => {
      const sanitized = sanitizeSearchQuery('"exact match"');
      expect(sanitized).toBe('"exact match"');
    });

    it('handles backticks (potential template literal injection)', () => {
      const sanitized = sanitizeSearchQuery('`${alert(1)}`');
      expect(sanitized).toBe('`${alert(1)}`');
      // Backticks are safe in URL params, not an XSS vector in search
    });
  });
});
