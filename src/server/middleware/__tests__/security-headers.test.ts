/**
 * Security Headers Tests
 *
 * Validates CORS, CSP, and other security headers applied by
 * the Next.js edge middleware via getSecurityHeaders() and
 * getCorsHeaders().
 */

import { describe, expect, it, beforeEach, vi } from 'vitest';

// Mock env before importing the module under test
vi.mock('@/lib/env', () => ({
  env: {
    CORS_ORIGINS: ['https://app.concierge.io', 'https://admin.concierge.io'],
    NODE_ENV: 'production',
  },
}));

import { getSecurityHeaders, getCorsHeaders } from '@/lib/security-headers';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ALLOWED_ORIGIN = 'https://app.concierge.io';
const DISALLOWED_ORIGIN = 'https://evil.example.com';
const TEST_NONCE = 'dGVzdG5vbmNlMTIzNDU2Nzg=';

// ---------------------------------------------------------------------------
// CORS Tests
// ---------------------------------------------------------------------------

describe('CORS headers', () => {
  it('OPTIONS preflight returns correct headers', () => {
    const headers = getCorsHeaders(ALLOWED_ORIGIN, 'OPTIONS');

    expect(headers['Access-Control-Allow-Origin']).toBe(ALLOWED_ORIGIN);
    expect(headers['Access-Control-Allow-Methods']).toBeDefined();
    expect(headers['Access-Control-Allow-Headers']).toBeDefined();
    expect(headers['Access-Control-Max-Age']).toBeDefined();
  });

  it('sets Access-Control-Allow-Origin for allowed origins', () => {
    const headers = getCorsHeaders(ALLOWED_ORIGIN, 'GET');

    expect(headers['Access-Control-Allow-Origin']).toBe(ALLOWED_ORIGIN);
  });

  it('rejects requests from non-allowed origins', () => {
    const headers = getCorsHeaders(DISALLOWED_ORIGIN, 'GET');

    expect(headers['Access-Control-Allow-Origin']).toBeUndefined();
  });

  it('allows credentials', () => {
    const headers = getCorsHeaders(ALLOWED_ORIGIN, 'GET');

    expect(headers['Access-Control-Allow-Credentials']).toBe('true');
  });

  it('returns correct Access-Control-Allow-Methods (GET, POST, PATCH, DELETE)', () => {
    const headers = getCorsHeaders(ALLOWED_ORIGIN, 'OPTIONS');
    const methods = headers['Access-Control-Allow-Methods'];

    expect(methods).toContain('GET');
    expect(methods).toContain('POST');
    expect(methods).toContain('PATCH');
    expect(methods).toContain('DELETE');
  });

  it('returns correct Access-Control-Allow-Headers (Content-Type, Authorization)', () => {
    const headers = getCorsHeaders(ALLOWED_ORIGIN, 'OPTIONS');
    const allowedHeaders = headers['Access-Control-Allow-Headers'];

    expect(allowedHeaders).toContain('Content-Type');
    expect(allowedHeaders).toContain('Authorization');
  });
});

// ---------------------------------------------------------------------------
// CSP Tests
// ---------------------------------------------------------------------------

describe('CSP headers', () => {
  it('Content-Security-Policy header is set on all responses', () => {
    const headers = getSecurityHeaders(TEST_NONCE);

    const csp = headers['Content-Security-Policy'];
    expect(csp).toBeDefined();
    expect(csp!.length).toBeGreaterThan(0);
  });

  it("includes default-src 'self'", () => {
    const headers = getSecurityHeaders(TEST_NONCE);
    const csp = headers['Content-Security-Policy'];

    expect(csp).toContain("default-src 'self'");
  });

  it("includes script-src 'self' without unsafe-inline", () => {
    const headers = getSecurityHeaders(TEST_NONCE);
    const csp = headers['Content-Security-Policy'];

    // script-src should include 'self' and the nonce
    expect(csp).toMatch(/script-src\s[^;]*'self'/);
    // Must NOT contain unsafe-inline in script-src
    const scriptSrc = csp?.split(';').find((d: string) => d.trim().startsWith('script-src'));
    expect(scriptSrc).toBeDefined();
    expect(scriptSrc!).not.toContain("'unsafe-inline'");
  });

  it("includes style-src 'self' 'unsafe-inline' (needed for Tailwind)", () => {
    const headers = getSecurityHeaders(TEST_NONCE);
    const csp = headers['Content-Security-Policy'];

    expect(csp).toContain("style-src 'self' 'unsafe-inline'");
  });
});

// ---------------------------------------------------------------------------
// HSTS
// ---------------------------------------------------------------------------

describe('HSTS header', () => {
  it('Strict-Transport-Security is set with max-age', () => {
    const headers = getSecurityHeaders(TEST_NONCE);
    const hsts = headers['Strict-Transport-Security'];

    expect(hsts).toBeDefined();
    expect(hsts).toMatch(/max-age=\d+/);
  });
});

// ---------------------------------------------------------------------------
// Additional Security Headers
// ---------------------------------------------------------------------------

describe('Additional security headers', () => {
  it('X-Frame-Options is DENY', () => {
    const headers = getSecurityHeaders(TEST_NONCE);

    expect(headers['X-Frame-Options']).toBe('DENY');
  });

  it('X-Content-Type-Options is nosniff', () => {
    const headers = getSecurityHeaders(TEST_NONCE);

    expect(headers['X-Content-Type-Options']).toBe('nosniff');
  });

  it('Referrer-Policy is strict-origin-when-cross-origin', () => {
    const headers = getSecurityHeaders(TEST_NONCE);

    expect(headers['Referrer-Policy']).toBe('strict-origin-when-cross-origin');
  });

  it('Permissions-Policy blocks camera, microphone, and geolocation', () => {
    const headers = getSecurityHeaders(TEST_NONCE);
    const policy = headers['Permissions-Policy'];

    expect(policy).toContain('camera=()');
    expect(policy).toContain('microphone=()');
    expect(policy).toContain('geolocation=()');
  });
});
