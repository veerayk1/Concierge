/**
 * Concierge — Input Sanitization
 *
 * Server-side and client-side content sanitization per Security Rulebook C.3.
 * Uses isomorphic-dompurify for SSR-compatible HTML sanitization.
 *
 * @module lib/sanitize
 */

import DOMPurify from 'isomorphic-dompurify';

import {
  ALLOWED_URL_PROTOCOLS,
  BLOCKED_URL_PROTOCOLS,
  SANITIZE_ALLOWED_ATTRS,
  SANITIZE_ALLOWED_TAGS,
} from '@/lib/constants';

// ---------------------------------------------------------------------------
// HTML Sanitization (Security Rulebook C.3.2)
// ---------------------------------------------------------------------------

/**
 * Sanitizes user-generated rich text HTML using DOMPurify with a strict allowlist.
 *
 * Only permits: b, i, u, a[href], ul, ol, li, p, br, strong, em.
 * All other tags and attributes are stripped.
 *
 * Per Security Rulebook C.3.2.
 *
 * @example
 * sanitizeHtml('<p>Hello <script>alert("xss")</script></p>')
 * // '<p>Hello </p>'
 *
 * sanitizeHtml('<p>Click <a href="https://example.com">here</a></p>')
 * // '<p>Click <a href="https://example.com" target="_blank" rel="noopener noreferrer">here</a></p>'
 */
export function sanitizeHtml(dirty: string): string {
  const clean = DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [...SANITIZE_ALLOWED_TAGS],
    ALLOWED_ATTR: Object.values(SANITIZE_ALLOWED_ATTRS).flat(),
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['target', 'rel'],
  });

  return typeof clean === 'string' ? clean : String(clean);
}

// ---------------------------------------------------------------------------
// URL Sanitization (Security Rulebook C.3.4)
// ---------------------------------------------------------------------------

/**
 * Validates and sanitizes a URL, blocking dangerous protocols.
 *
 * Blocks: javascript:, data:, vbscript:
 * Allows: https: only
 *
 * Returns the sanitized URL string, or null if the URL is invalid or uses
 * a blocked protocol.
 *
 * Per Security Rulebook C.3.4.
 *
 * @example
 * sanitizeUrl('https://example.com/page') // 'https://example.com/page'
 * sanitizeUrl('javascript:alert(1)') // null
 * sanitizeUrl('data:text/html,...') // null
 * sanitizeUrl('http://example.com') // null (only https allowed)
 */
export function sanitizeUrl(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  const trimmed = url.trim();

  // Check for blocked protocols (case-insensitive)
  const lowerUrl = trimmed.toLowerCase();
  for (const protocol of BLOCKED_URL_PROTOCOLS) {
    if (lowerUrl.startsWith(protocol)) {
      return null;
    }
  }

  // Try to parse as a URL
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    // If it doesn't parse as an absolute URL, check for relative paths
    if (trimmed.startsWith('/') && !trimmed.startsWith('//')) {
      // Relative paths are allowed
      return trimmed;
    }
    return null;
  }

  // Only allow explicitly listed protocols
  const isAllowed = ALLOWED_URL_PROTOCOLS.some((protocol) => parsed.protocol === protocol);

  if (!isAllowed) {
    return null;
  }

  return parsed.href;
}

// ---------------------------------------------------------------------------
// HTML Stripping
// ---------------------------------------------------------------------------

/**
 * Removes ALL HTML tags from a string, returning only the text content.
 * Useful for generating plaintext versions of rich content (e.g., email
 * text fallback, search indexing, notification previews).
 *
 * @example
 * stripHtml('<p>Hello <b>World</b></p>') // 'Hello World'
 * stripHtml('<script>alert("xss")</script>Visible') // 'Visible'
 */
export function stripHtml(html: string): string {
  // Step 1: Remove zero-width characters that can bypass tag detection
  // These Unicode chars can be inserted inside tag names to evade stripping
  const cleaned = html.replace(/[\u200B-\u200D\u2060\uFEFF]/g, '');

  // Step 2: Add spaces before block-level closing tags so text doesn't collapse
  const spaced = cleaned.replace(
    /<\/(p|div|h[1-6]|li|br|tr|td|th|blockquote|section|article|header|footer|nav|main)>/gi,
    ' </$1>',
  );

  // Step 3: Use DOMPurify to remove all tags (empty allowlist)
  const stripped = DOMPurify.sanitize(spaced, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });

  const text = typeof stripped === 'string' ? stripped : String(stripped);

  // Step 4: Collapse multiple whitespace chars into single spaces and trim
  return text.replace(/\s+/g, ' ').trim();
}

// ---------------------------------------------------------------------------
// General Input Sanitization
// ---------------------------------------------------------------------------

/**
 * Trims whitespace and collapses internal runs of whitespace in a string.
 * Does NOT strip HTML (use stripHtml or sanitizeHtml for that).
 *
 * Useful for normalizing user inputs like names, addresses, etc.
 *
 * @example
 * normalizeWhitespace('  John    Doe  ') // 'John Doe'
 */
export function normalizeWhitespace(input: string): string {
  return input.replace(/\s+/g, ' ').trim();
}

/**
 * Removes null bytes and other control characters (except newline, tab, CR)
 * from a string. Prevents null byte injection attacks.
 *
 * @example
 * stripControlChars('hello\x00world') // 'helloworld'
 */
export function stripControlChars(input: string): string {
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}
