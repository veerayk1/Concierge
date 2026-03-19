/**
 * Concierge — Sanitization Module Tests
 *
 * Tests sanitizeHtml, sanitizeUrl, stripHtml, normalizeWhitespace,
 * and stripControlChars per Security Rulebook C.3.
 */

import { describe, it, expect } from 'vitest';

import {
  sanitizeHtml,
  sanitizeUrl,
  stripHtml,
  normalizeWhitespace,
  stripControlChars,
} from '@/lib/sanitize';

// ===========================================================================
// sanitizeHtml — XSS Prevention
// ===========================================================================

describe('sanitizeHtml', () => {
  // 1
  it('removes script tags', () => {
    const result = sanitizeHtml('<p>Hello <script>alert("xss")</script></p>');
    expect(result).not.toContain('<script');
    expect(result).toContain('Hello');
  });

  // 2
  it('preserves safe tags: b, i, a', () => {
    const input =
      '<p>This is <b>bold</b> and <i>italic</i> and <a href="https://example.com">a link</a></p>';
    const result = sanitizeHtml(input);
    expect(result).toContain('<b>bold</b>');
    expect(result).toContain('<i>italic</i>');
    expect(result).toContain('<a');
  });

  // 3
  it('removes onclick event handlers', () => {
    const result = sanitizeHtml('<button onclick="alert(1)">Click</button>');
    expect(result).not.toContain('onclick');
  });

  // 4
  it('removes onerror event handlers from img tags', () => {
    const result = sanitizeHtml('<img src="x" onerror="alert(1)">');
    expect(result).not.toContain('onerror');
    // img is not in the allowed tags, so the entire tag should be stripped
    expect(result).not.toContain('<img');
  });

  // 5
  it('removes iframe tags', () => {
    const result = sanitizeHtml('<iframe src="https://evil.com"></iframe>');
    expect(result).not.toContain('<iframe');
  });

  // 6
  it('handles nested XSS patterns — script tag is stripped', () => {
    const result = sanitizeHtml('<scr<script>ipt>alert(1)</script>');
    expect(result).not.toContain('<script');
    // DOMPurify strips the script tag; remaining text is safe (HTML-encoded)
    expect(result).not.toContain('<script>');
  });

  // 7
  it('handles empty string input', () => {
    const result = sanitizeHtml('');
    expect(result).toBe('');
  });

  // 8
  it('preserves plain text without HTML', () => {
    const result = sanitizeHtml('Just plain text');
    expect(result).toBe('Just plain text');
  });

  // 9
  it('removes style tags', () => {
    const result = sanitizeHtml('<style>body { display: none; }</style>');
    expect(result).not.toContain('<style');
  });

  // 10
  it('preserves list elements', () => {
    const result = sanitizeHtml('<ul><li>Item 1</li><li>Item 2</li></ul>');
    expect(result).toContain('<ul>');
    expect(result).toContain('<li>');
  });

  // 11
  it('strips data attributes', () => {
    const result = sanitizeHtml('<p data-custom="evil">text</p>');
    expect(result).not.toContain('data-custom');
  });

  // 12
  it('removes onmouseover handler', () => {
    const result = sanitizeHtml('<div onmouseover="alert(1)">hover</div>');
    expect(result).not.toContain('onmouseover');
  });
});

// ===========================================================================
// sanitizeUrl — URL Protocol Validation
// ===========================================================================

describe('sanitizeUrl', () => {
  // 13
  it('allows https URLs', () => {
    const result = sanitizeUrl('https://example.com/page');
    expect(result).toBe('https://example.com/page');
  });

  // 14
  it('blocks javascript: protocol', () => {
    const result = sanitizeUrl('javascript:alert(1)');
    expect(result).toBeNull();
  });

  // 15
  it('blocks data: protocol', () => {
    const result = sanitizeUrl('data:text/html,<script>alert(1)</script>');
    expect(result).toBeNull();
  });

  // 16
  it('blocks vbscript: protocol', () => {
    const result = sanitizeUrl('vbscript:msgbox("xss")');
    expect(result).toBeNull();
  });

  // 17
  it('blocks http URLs (only https allowed)', () => {
    const result = sanitizeUrl('http://example.com');
    expect(result).toBeNull();
  });

  // 18
  it('returns null for empty string', () => {
    expect(sanitizeUrl('')).toBeNull();
  });

  // 19
  it('returns null for null-like input', () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(sanitizeUrl(null as any)).toBeNull();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(sanitizeUrl(undefined as any)).toBeNull();
  });

  // 20
  it('allows relative paths starting with /', () => {
    const result = sanitizeUrl('/dashboard/settings');
    expect(result).toBe('/dashboard/settings');
  });

  // 21
  it('blocks javascript: with mixed case', () => {
    const result = sanitizeUrl('JavaScript:alert(1)');
    expect(result).toBeNull();
  });

  // 22
  it('trims whitespace from URLs', () => {
    const result = sanitizeUrl('  https://example.com  ');
    expect(result).toBe('https://example.com/');
  });

  // 23
  it('returns null for completely invalid URLs', () => {
    const result = sanitizeUrl('not a url at all');
    expect(result).toBeNull();
  });
});

// ===========================================================================
// stripHtml — Full HTML Tag Removal
// ===========================================================================

describe('stripHtml', () => {
  // 24
  it('removes all HTML tags and returns text', () => {
    const result = stripHtml('<p>Hello <b>World</b></p>');
    expect(result).toBe('Hello World');
  });

  // 25
  it('removes script tags and their content', () => {
    const result = stripHtml('<script>alert("xss")</script>Visible');
    expect(result).toBe('Visible');
  });

  // 26
  it('handles empty string', () => {
    expect(stripHtml('')).toBe('');
  });

  // 27
  it('collapses multiple whitespace into one space', () => {
    const result = stripHtml('<p>Hello</p>   <p>World</p>');
    expect(result).not.toContain('  ');
  });
});

// ===========================================================================
// normalizeWhitespace
// ===========================================================================

describe('normalizeWhitespace', () => {
  // 28
  it('trims leading and trailing whitespace', () => {
    expect(normalizeWhitespace('  hello  ')).toBe('hello');
  });

  // 29
  it('collapses internal whitespace runs', () => {
    expect(normalizeWhitespace('John    Doe')).toBe('John Doe');
  });

  // 30
  it('handles tabs and newlines', () => {
    expect(normalizeWhitespace('hello\t\nworld')).toBe('hello world');
  });
});

// ===========================================================================
// stripControlChars
// ===========================================================================

describe('stripControlChars', () => {
  // 31
  it('removes null bytes', () => {
    expect(stripControlChars('hello\x00world')).toBe('helloworld');
  });

  // 32
  it('preserves newlines and tabs', () => {
    const result = stripControlChars('hello\n\tworld');
    expect(result).toContain('\n');
    expect(result).toContain('\t');
  });

  // 33
  it('removes other control characters', () => {
    const result = stripControlChars('hello\x01\x02\x03world');
    expect(result).toBe('helloworld');
  });

  // 34
  it('passes through normal text unchanged', () => {
    expect(stripControlChars('normal text 123!')).toBe('normal text 123!');
  });
});
