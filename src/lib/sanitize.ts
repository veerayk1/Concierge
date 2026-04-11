/**
 * Concierge — Input Sanitization
 *
 * Server-side and client-side content sanitization per Security Rulebook C.3.
 * Uses isomorphic-dompurify for SSR-compatible HTML sanitization when available,
 * with regex fallback for serverless environments (Vercel) where jsdom is unavailable.
 *
 * @module lib/sanitize
 */

import {
  ALLOWED_URL_PROTOCOLS,
  BLOCKED_URL_PROTOCOLS,
  SANITIZE_ALLOWED_ATTRS,
  SANITIZE_ALLOWED_TAGS,
} from '@/lib/constants';

// ---------------------------------------------------------------------------
// Lazy DOMPurify loader — avoids crashing on Vercel serverless
// where jsdom (required by isomorphic-dompurify) is not available.
// ---------------------------------------------------------------------------

let _DOMPurify: typeof import('isomorphic-dompurify').default | null = null;
let _loadAttempted = false;

async function getDOMPurify() {
  if (_DOMPurify) return _DOMPurify;
  if (_loadAttempted) return null;
  _loadAttempted = true;
  try {
    const mod = await import('isomorphic-dompurify');
    _DOMPurify = mod.default;
    return _DOMPurify;
  } catch {
    // jsdom not available (serverless environment) — use regex fallback
    return null;
  }
}

// Synchronous regex fallback for stripping HTML tags
function regexStripHtml(html: string): string {
  // Remove zero-width characters
  const cleaned = html.replace(/[\u200B-\u200D\u2060\uFEFF]/g, '');
  // Add spaces before block-level closing tags
  const spaced = cleaned.replace(
    /<\/(p|div|h[1-6]|li|br|tr|td|th|blockquote|section|article|header|footer|nav|main)>/gi,
    ' </$1>',
  );
  // Strip all HTML tags
  const stripped = spaced.replace(/<[^>]*>/g, '');
  // Decode common HTML entities
  const decoded = stripped
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ');
  // Collapse whitespace
  return decoded.replace(/\s+/g, ' ').trim();
}

// Synchronous regex fallback for sanitizing HTML (strips everything dangerous)
function regexSanitizeHtml(html: string): string {
  // Remove script, style, and event handler attributes
  let clean = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');
  clean = clean.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
  clean = clean.replace(/\s*on\w+\s*=\s*["'][^"']*["']/gi, '');
  clean = clean.replace(/\s*on\w+\s*=\s*[^\s>]*/gi, '');
  // Remove all tags except allowed ones
  const allowedPattern = SANITIZE_ALLOWED_TAGS.join('|');
  const tagRegex = new RegExp(`<(?!\/?(?:${allowedPattern})\\b)[^>]+>`, 'gi');
  clean = clean.replace(tagRegex, '');
  return clean;
}

// ---------------------------------------------------------------------------
// HTML Sanitization (Security Rulebook C.3.2)
// ---------------------------------------------------------------------------

/**
 * Sanitizes user-generated rich text HTML using DOMPurify with a strict allowlist.
 * Falls back to regex sanitization in serverless environments.
 */
export function sanitizeHtml(dirty: string): string {
  // Try synchronous DOMPurify first (already loaded)
  if (_DOMPurify) {
    const clean = _DOMPurify.sanitize(dirty, {
      ALLOWED_TAGS: [...SANITIZE_ALLOWED_TAGS],
      ALLOWED_ATTR: Object.values(SANITIZE_ALLOWED_ATTRS).flat(),
      ALLOW_DATA_ATTR: false,
      ADD_ATTR: ['target', 'rel'],
    });
    return typeof clean === 'string' ? clean : String(clean);
  }
  // Regex fallback
  return regexSanitizeHtml(dirty);
}

// ---------------------------------------------------------------------------
// URL Sanitization (Security Rulebook C.3.4)
// ---------------------------------------------------------------------------

/**
 * Validates and sanitizes a URL, blocking dangerous protocols.
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
 * Uses DOMPurify when available, regex fallback in serverless.
 */
export function stripHtml(html: string): string {
  // Try synchronous DOMPurify first (already loaded)
  if (_DOMPurify) {
    const cleaned = html.replace(/[\u200B-\u200D\u2060\uFEFF]/g, '');
    const spaced = cleaned.replace(
      /<\/(p|div|h[1-6]|li|br|tr|td|th|blockquote|section|article|header|footer|nav|main)>/gi,
      ' </$1>',
    );
    const stripped = _DOMPurify.sanitize(spaced, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: [],
    });
    const text = typeof stripped === 'string' ? stripped : String(stripped);
    return text.replace(/\s+/g, ' ').trim();
  }
  // Regex fallback
  return regexStripHtml(html);
}

// ---------------------------------------------------------------------------
// General Input Sanitization
// ---------------------------------------------------------------------------

/**
 * Trims whitespace and collapses internal runs of whitespace.
 */
export function normalizeWhitespace(input: string): string {
  return input.replace(/\s+/g, ' ').trim();
}

/**
 * Removes null bytes and other control characters (except newline, tab, CR).
 */
export function stripControlChars(input: string): string {
  return input.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
}

// ---------------------------------------------------------------------------
// Async initializer — call once at app startup to load DOMPurify if available
// ---------------------------------------------------------------------------

/**
 * Pre-load DOMPurify for environments that support it.
 * Non-blocking — if it fails, regex fallback is used automatically.
 */
export async function initSanitizer(): Promise<void> {
  await getDOMPurify();
}
