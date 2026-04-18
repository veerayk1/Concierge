/**
 * Concierge — Comprehensive Security Headers Tests
 *
 * Validates that all OWASP-recommended security headers are present:
 *   - Content-Security-Policy header present and correctly configured
 *   - X-Content-Type-Options: nosniff
 *   - X-Frame-Options: DENY
 *   - Strict-Transport-Security present with correct directives
 *   - X-XSS-Protection: 0 (modern browsers)
 *   - CORS headers on API routes
 *
 * Per Security Rulebook C.1, OWASP Secure Headers Project.
 *
 * @module middleware/__tests__/security-headers-comprehensive
 */

import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';

// Mock env before importing the module under test
vi.mock('@/lib/env', () => ({
  env: {
    CORS_ORIGINS: [
      'https://app.concierge.io',
      'https://admin.concierge.io',
      'https://demo.concierge.io',
    ],
    NODE_ENV: 'production',
  },
}));

import { getSecurityHeaders, getCorsHeaders } from '@/lib/security-headers';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TEST_NONCE = 'dGVzdG5vbmNlMTIzNDU2Nzg=';
const ALLOWED_ORIGIN = 'https://app.concierge.io';
const ADMIN_ORIGIN = 'https://admin.concierge.io';
const DEMO_ORIGIN = 'https://demo.concierge.io';
const DISALLOWED_ORIGIN = 'https://evil.example.com';
const RANDOM_ORIGIN = 'https://random-site.net';

// ============================================================================
// 1. Content-Security-Policy header present and configured
// ============================================================================

describe('Content-Security-Policy header', () => {
  it('CSP header is present on all responses', () => {
    const headers = getSecurityHeaders(TEST_NONCE);
    expect(headers).toHaveProperty('Content-Security-Policy');
    expect(headers['Content-Security-Policy']!.length).toBeGreaterThan(0);
  });

  it("CSP includes default-src 'self'", () => {
    const headers = getSecurityHeaders(TEST_NONCE);
    const csp = headers['Content-Security-Policy'];
    expect(csp).toContain("default-src 'self'");
  });

  it('CSP includes script-src with self and unsafe-inline', () => {
    const headers = getSecurityHeaders(TEST_NONCE);
    const csp = headers['Content-Security-Policy'];
    expect(csp).toContain("script-src 'self' 'unsafe-inline'");
  });

  it("CSP script-src includes 'self'", () => {
    const headers = getSecurityHeaders(TEST_NONCE);
    const csp = headers['Content-Security-Policy'];
    expect(csp).toMatch(/script-src\s[^;]*'self'/);
  });

  it("CSP script-src includes 'unsafe-inline' (pending nonce migration)", () => {
    const headers = getSecurityHeaders(TEST_NONCE);
    const csp = headers['Content-Security-Policy'];
    const scriptSrc = csp!.split(';').find((d: string) => d.trim().startsWith('script-src'));
    expect(scriptSrc).toBeDefined();
    expect(scriptSrc!).toContain("'unsafe-inline'");
  });

  it("CSP includes style-src with 'self' and 'unsafe-inline' for Tailwind", () => {
    const headers = getSecurityHeaders(TEST_NONCE);
    const csp = headers['Content-Security-Policy'];
    expect(csp).toContain("style-src 'self' 'unsafe-inline'");
  });

  it("CSP includes img-src 'self' data: https:", () => {
    const headers = getSecurityHeaders(TEST_NONCE);
    const csp = headers['Content-Security-Policy'];
    expect(csp).toContain("img-src 'self' data: https:");
  });

  it("CSP includes font-src 'self'", () => {
    const headers = getSecurityHeaders(TEST_NONCE);
    const csp = headers['Content-Security-Policy'];
    expect(csp).toContain("font-src 'self'");
  });

  it("CSP includes frame-ancestors 'none' (prevents framing)", () => {
    const headers = getSecurityHeaders(TEST_NONCE);
    const csp = headers['Content-Security-Policy'];
    expect(csp).toContain("frame-ancestors 'none'");
  });

  it("CSP includes base-uri 'self'", () => {
    const headers = getSecurityHeaders(TEST_NONCE);
    const csp = headers['Content-Security-Policy'];
    expect(csp).toContain("base-uri 'self'");
  });

  it("CSP includes form-action 'self'", () => {
    const headers = getSecurityHeaders(TEST_NONCE);
    const csp = headers['Content-Security-Policy'];
    expect(csp).toContain("form-action 'self'");
  });

  it("CSP includes object-src 'none'", () => {
    const headers = getSecurityHeaders(TEST_NONCE);
    const csp = headers['Content-Security-Policy'];
    expect(csp).toContain("object-src 'none'");
  });

  it('CSP is consistent regardless of nonce value (nonce not yet used)', () => {
    const nonce1 = 'bm9uY2UxMjM0NTY3OA==';
    const nonce2 = 'YW5vdGhlcm5vbmNlMTI=';

    const csp1 = getSecurityHeaders(nonce1)['Content-Security-Policy'];
    const csp2 = getSecurityHeaders(nonce2)['Content-Security-Policy'];

    // Currently the nonce parameter is accepted but not embedded in CSP
    // Both calls produce the same CSP string
    expect(csp1).toEqual(csp2);
    expect(csp1).toContain("script-src 'self' 'unsafe-inline'");
  });
});

// ============================================================================
// 2. X-Content-Type-Options: nosniff
// ============================================================================

describe('X-Content-Type-Options header', () => {
  it('X-Content-Type-Options is present', () => {
    const headers = getSecurityHeaders(TEST_NONCE);
    expect(headers).toHaveProperty('X-Content-Type-Options');
  });

  it('X-Content-Type-Options value is exactly "nosniff"', () => {
    const headers = getSecurityHeaders(TEST_NONCE);
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
  });

  it('prevents MIME type sniffing attacks', () => {
    const headers = getSecurityHeaders(TEST_NONCE);
    // nosniff tells browsers to strictly follow Content-Type
    expect(headers['X-Content-Type-Options']).not.toBe('');
    expect(headers['X-Content-Type-Options']).not.toBeUndefined();
  });
});

// ============================================================================
// 3. X-Frame-Options: DENY
// ============================================================================

describe('X-Frame-Options header', () => {
  it('X-Frame-Options is present', () => {
    const headers = getSecurityHeaders(TEST_NONCE);
    expect(headers).toHaveProperty('X-Frame-Options');
  });

  it('X-Frame-Options value is exactly "DENY"', () => {
    const headers = getSecurityHeaders(TEST_NONCE);
    expect(headers['X-Frame-Options']).toBe('DENY');
  });

  it('X-Frame-Options is not SAMEORIGIN (strictest setting)', () => {
    const headers = getSecurityHeaders(TEST_NONCE);
    expect(headers['X-Frame-Options']).not.toBe('SAMEORIGIN');
    expect(headers['X-Frame-Options']).not.toBe('ALLOW-FROM');
  });

  it('prevents clickjacking by disallowing all framing', () => {
    const headers = getSecurityHeaders(TEST_NONCE);
    expect(headers['X-Frame-Options']).toBe('DENY');
    // Also check CSP frame-ancestors for defense in depth
    const csp = headers['Content-Security-Policy'];
    expect(csp).toContain("frame-ancestors 'none'");
  });
});

// ============================================================================
// 4. Strict-Transport-Security present
// ============================================================================

describe('Strict-Transport-Security (HSTS) header', () => {
  it('HSTS header is present', () => {
    const headers = getSecurityHeaders(TEST_NONCE);
    expect(headers).toHaveProperty('Strict-Transport-Security');
  });

  it('HSTS includes max-age directive', () => {
    const headers = getSecurityHeaders(TEST_NONCE);
    const hsts = headers['Strict-Transport-Security'];
    expect(hsts).toMatch(/max-age=\d+/);
  });

  it('HSTS max-age is at least 1 year (31536000 seconds)', () => {
    const headers = getSecurityHeaders(TEST_NONCE);
    const hsts = headers['Strict-Transport-Security'];
    const maxAgeMatch = hsts!.match(/max-age=(\d+)/);
    expect(maxAgeMatch).not.toBeNull();
    const maxAge = parseInt(maxAgeMatch![1]!, 10);
    expect(maxAge).toBeGreaterThanOrEqual(31536000);
  });

  it('HSTS includes includeSubDomains', () => {
    const headers = getSecurityHeaders(TEST_NONCE);
    const hsts = headers['Strict-Transport-Security'];
    expect(hsts).toContain('includeSubDomains');
  });

  it('HSTS includes preload directive', () => {
    const headers = getSecurityHeaders(TEST_NONCE);
    const hsts = headers['Strict-Transport-Security'];
    expect(hsts).toContain('preload');
  });

  it('HSTS full value matches expected format', () => {
    const headers = getSecurityHeaders(TEST_NONCE);
    expect(headers['Strict-Transport-Security']).toBe(
      'max-age=31536000; includeSubDomains; preload',
    );
  });
});

// ============================================================================
// 5. X-XSS-Protection: 0 (modern browsers)
// ============================================================================

describe('X-XSS-Protection header', () => {
  it('X-XSS-Protection is present', () => {
    const headers = getSecurityHeaders(TEST_NONCE);
    expect(headers).toHaveProperty('X-XSS-Protection');
  });

  it('X-XSS-Protection value is "0" (disabled for modern browsers)', () => {
    const headers = getSecurityHeaders(TEST_NONCE);
    expect(headers['X-XSS-Protection']).toBe('0');
  });

  it('X-XSS-Protection is NOT set to "1; mode=block" (legacy pattern)', () => {
    const headers = getSecurityHeaders(TEST_NONCE);
    expect(headers['X-XSS-Protection']).not.toBe('1; mode=block');
    expect(headers['X-XSS-Protection']).not.toBe('1');
  });

  it('CSP provides XSS protection instead of X-XSS-Protection header', () => {
    const headers = getSecurityHeaders(TEST_NONCE);
    // X-XSS-Protection is disabled because CSP with nonces provides better protection
    expect(headers['X-XSS-Protection']).toBe('0');
    expect(headers['Content-Security-Policy']).toContain('script-src');
  });
});

// ============================================================================
// 6. CORS headers on API routes
// ============================================================================

describe('CORS headers on API routes', () => {
  const originalNodeEnv = process.env.NODE_ENV;

  beforeAll(() => {
    Object.assign(process.env, { NODE_ENV: 'production' });
  });

  afterAll(() => {
    Object.assign(process.env, { NODE_ENV: originalNodeEnv });
  });

  it('allowed origin receives Access-Control-Allow-Origin header', () => {
    const headers = getCorsHeaders(ALLOWED_ORIGIN, 'GET');
    expect(headers['Access-Control-Allow-Origin']).toBe(ALLOWED_ORIGIN);
  });

  it('admin origin is also allowed', () => {
    const headers = getCorsHeaders(ADMIN_ORIGIN, 'GET');
    expect(headers['Access-Control-Allow-Origin']).toBe(ADMIN_ORIGIN);
  });

  it('demo origin is also allowed', () => {
    const headers = getCorsHeaders(DEMO_ORIGIN, 'GET');
    expect(headers['Access-Control-Allow-Origin']).toBe(DEMO_ORIGIN);
  });

  it('disallowed origin does NOT receive Access-Control-Allow-Origin', () => {
    const headers = getCorsHeaders(DISALLOWED_ORIGIN, 'GET');
    expect(headers['Access-Control-Allow-Origin']).toBeUndefined();
  });

  it('random origin does NOT receive Access-Control-Allow-Origin', () => {
    const headers = getCorsHeaders(RANDOM_ORIGIN, 'GET');
    expect(headers['Access-Control-Allow-Origin']).toBeUndefined();
  });

  it('null origin returns empty headers', () => {
    const headers = getCorsHeaders(null, 'GET');
    expect(Object.keys(headers)).toHaveLength(0);
  });

  it('undefined origin returns empty headers', () => {
    const headers = getCorsHeaders(undefined, 'GET');
    expect(Object.keys(headers)).toHaveLength(0);
  });

  it('Access-Control-Allow-Credentials is "true" for allowed origins', () => {
    const headers = getCorsHeaders(ALLOWED_ORIGIN, 'GET');
    expect(headers['Access-Control-Allow-Credentials']).toBe('true');
  });

  it('Vary: Origin is set for allowed origins', () => {
    const headers = getCorsHeaders(ALLOWED_ORIGIN, 'GET');
    expect(headers['Vary']).toBe('Origin');
  });

  it('OPTIONS preflight returns Access-Control-Allow-Methods', () => {
    const headers = getCorsHeaders(ALLOWED_ORIGIN, 'OPTIONS');
    expect(headers['Access-Control-Allow-Methods']).toBeDefined();
    expect(headers['Access-Control-Allow-Methods']).toContain('GET');
    expect(headers['Access-Control-Allow-Methods']).toContain('POST');
    expect(headers['Access-Control-Allow-Methods']).toContain('PATCH');
    expect(headers['Access-Control-Allow-Methods']).toContain('DELETE');
    expect(headers['Access-Control-Allow-Methods']).toContain('OPTIONS');
  });

  it('OPTIONS preflight returns Access-Control-Allow-Headers', () => {
    const headers = getCorsHeaders(ALLOWED_ORIGIN, 'OPTIONS');
    expect(headers['Access-Control-Allow-Headers']).toBeDefined();
    expect(headers['Access-Control-Allow-Headers']).toContain('Content-Type');
    expect(headers['Access-Control-Allow-Headers']).toContain('Authorization');
  });

  it('OPTIONS preflight returns Access-Control-Max-Age', () => {
    const headers = getCorsHeaders(ALLOWED_ORIGIN, 'OPTIONS');
    expect(headers['Access-Control-Max-Age']).toBeDefined();
    const maxAge = parseInt(headers['Access-Control-Max-Age']!, 10);
    expect(maxAge).toBeGreaterThan(0);
  });

  it('non-OPTIONS requests do NOT include Access-Control-Allow-Methods', () => {
    const headers = getCorsHeaders(ALLOWED_ORIGIN, 'GET');
    expect(headers['Access-Control-Allow-Methods']).toBeUndefined();
  });

  it('non-OPTIONS requests do NOT include Access-Control-Allow-Headers', () => {
    const headers = getCorsHeaders(ALLOWED_ORIGIN, 'POST');
    expect(headers['Access-Control-Allow-Headers']).toBeUndefined();
  });

  it('CORS does not use wildcard (*) for Access-Control-Allow-Origin', () => {
    const headers = getCorsHeaders(ALLOWED_ORIGIN, 'GET');
    expect(headers['Access-Control-Allow-Origin']).not.toBe('*');
  });
});

// ============================================================================
// 7. Additional security headers
// ============================================================================

describe('Additional security headers', () => {
  it('Referrer-Policy is strict-origin-when-cross-origin', () => {
    const headers = getSecurityHeaders(TEST_NONCE);
    expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
  });

  it('Permissions-Policy blocks camera', () => {
    const headers = getSecurityHeaders(TEST_NONCE);
    expect(headers['Permissions-Policy']).toContain('camera=()');
  });

  it('Permissions-Policy blocks microphone', () => {
    const headers = getSecurityHeaders(TEST_NONCE);
    expect(headers['Permissions-Policy']).toContain('microphone=()');
  });

  it('Permissions-Policy blocks geolocation', () => {
    const headers = getSecurityHeaders(TEST_NONCE);
    expect(headers['Permissions-Policy']).toContain('geolocation=()');
  });

  it('Permissions-Policy blocks payment', () => {
    const headers = getSecurityHeaders(TEST_NONCE);
    expect(headers['Permissions-Policy']).toContain('payment=()');
  });

  it('X-DNS-Prefetch-Control is off', () => {
    const headers = getSecurityHeaders(TEST_NONCE);
    expect(headers['X-DNS-Prefetch-Control']).toBe('off');
  });

  it('Cross-Origin-Opener-Policy is same-origin-allow-popups', () => {
    const headers = getSecurityHeaders(TEST_NONCE);
    expect(headers['Cross-Origin-Opener-Policy']).toBe('same-origin-allow-popups');
  });

  it('Cross-Origin-Resource-Policy is same-site', () => {
    const headers = getSecurityHeaders(TEST_NONCE);
    expect(headers['Cross-Origin-Resource-Policy']).toBe('same-site');
  });

  it('Cache-Control is set to prevent caching sensitive data', () => {
    const headers = getSecurityHeaders(TEST_NONCE);
    expect(headers['Cache-Control']).toContain('no-store');
    expect(headers['Cache-Control']).toContain('no-cache');
    expect(headers['Cache-Control']).toContain('must-revalidate');
  });
});

// ============================================================================
// 8. Header completeness — all expected headers present
// ============================================================================

describe('Header completeness — all OWASP-recommended headers present', () => {
  it('getSecurityHeaders returns all 10 expected headers', () => {
    const headers = getSecurityHeaders(TEST_NONCE);
    const expectedHeaders = [
      'Content-Security-Policy',
      'X-Frame-Options',
      'X-Content-Type-Options',
      'X-XSS-Protection',
      'Referrer-Policy',
      'Permissions-Policy',
      'X-DNS-Prefetch-Control',
      'Cache-Control',
      // The following are only present in non-dev (production/test):
      'Strict-Transport-Security',
      'Cross-Origin-Opener-Policy',
      'Cross-Origin-Resource-Policy',
    ];

    for (const header of expectedHeaders) {
      expect(headers).toHaveProperty(header);
      expect(headers[header]).toBeTruthy();
    }
  });

  it('no security header has an empty value', () => {
    const headers = getSecurityHeaders(TEST_NONCE);

    for (const [key, value] of Object.entries(headers)) {
      expect(value, `${key} should not be empty`).toBeTruthy();
      expect(value.length, `${key} should have a non-zero length`).toBeGreaterThan(0);
    }
  });

  it('headers are plain string values (no arrays or objects)', () => {
    const headers = getSecurityHeaders(TEST_NONCE);

    for (const [key, value] of Object.entries(headers)) {
      expect(typeof value, `${key} should be a string`).toBe('string');
    }
  });
});
