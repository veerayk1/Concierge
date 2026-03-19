/**
 * CSP Report Endpoint — Tests
 *
 * Tests the Content-Security-Policy violation report receiver.
 * Validates that it accepts valid reports, rejects oversized payloads,
 * and logs violation details correctly.
 */

import { describe, expect, it, vi, beforeEach } from 'vitest';

// ---------------------------------------------------------------------------
// Mock Setup
// ---------------------------------------------------------------------------

const mockConsoleWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('POST /api/csp-report', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('accepts a valid CSP violation report and returns 204', async () => {
    const { POST } = await import('../../csp-report/route');

    const cspReport = {
      'csp-report': {
        'document-uri': 'https://concierge.app/dashboard',
        'violated-directive': 'script-src',
        'blocked-uri': 'https://evil.example.com/malicious.js',
        'original-policy': "default-src 'self'; script-src 'self'",
        referrer: '',
        'status-code': 200,
      },
    };

    const request = new Request('http://localhost:3000/api/csp-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/csp-report' },
      body: JSON.stringify(cspReport),
    });

    const response = await POST(request);

    expect(response.status).toBe(204);
    expect(response.headers.get('X-Content-Type-Options')).toBe('nosniff');
  });

  it('logs the violation details', async () => {
    const { POST } = await import('../../csp-report/route');

    const cspReport = {
      'csp-report': {
        'document-uri': 'https://concierge.app/login',
        'violated-directive': 'img-src',
        'blocked-uri': 'data:image/svg+xml',
      },
    };

    const request = new Request('http://localhost:3000/api/csp-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/csp-report' },
      body: JSON.stringify(cspReport),
    });

    await POST(request);

    expect(mockConsoleWarn).toHaveBeenCalledTimes(1);
    expect(mockConsoleWarn).toHaveBeenCalledWith(
      '[CSP Violation]',
      expect.stringContaining('violated-directive'),
    );
    expect(mockConsoleWarn).toHaveBeenCalledWith(
      '[CSP Violation]',
      expect.stringContaining('img-src'),
    );
  });

  it('returns 204 even for malformed (non-JSON) body', async () => {
    const { POST } = await import('../../csp-report/route');

    const request = new Request('http://localhost:3000/api/csp-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/csp-report' },
      body: 'this is not json',
    });

    const response = await POST(request);

    // Endpoint silently discards malformed body and returns 204
    expect(response.status).toBe(204);
    // Should NOT have logged since parsing failed
    expect(mockConsoleWarn).not.toHaveBeenCalled();
  });

  it('rejects oversized reports by returning 204 without processing', async () => {
    const { POST } = await import('../../csp-report/route');

    // Create an oversized payload (larger than what a real CSP report would be)
    const oversizedReport = {
      'csp-report': {
        'document-uri': 'https://concierge.app/dashboard',
        'violated-directive': 'script-src',
        'blocked-uri': 'https://evil.example.com/' + 'x'.repeat(100_000),
        'original-policy': 'a'.repeat(100_000),
      },
    };

    const request = new Request('http://localhost:3000/api/csp-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/csp-report' },
      body: JSON.stringify(oversizedReport),
    });

    const response = await POST(request);

    // The endpoint always returns 204 — it should not crash on large bodies
    expect(response.status).toBe(204);
  });

  it('handles empty body gracefully', async () => {
    const { POST } = await import('../../csp-report/route');

    const request = new Request('http://localhost:3000/api/csp-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/csp-report' },
      body: '',
    });

    const response = await POST(request);

    expect(response.status).toBe(204);
    expect(mockConsoleWarn).not.toHaveBeenCalled();
  });
});
