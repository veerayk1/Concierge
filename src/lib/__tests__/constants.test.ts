/**
 * Concierge — Constants Module Tests
 *
 * Validates rate limits, session timeouts, pagination, file upload limits,
 * MIME types, password policy, token expiry, and sanitization allowlists.
 */

import { describe, it, expect } from 'vitest';

import {
  RATE_LIMITS,
  SESSION_TIMEOUTS,
  PASSWORD_POLICY,
  PASSWORD_PATTERNS,
  FILE_UPLOAD,
  ALLOWED_MIME_TYPES,
  ALL_ALLOWED_MIME_TYPES,
  PAGINATION,
  TOKEN_EXPIRY,
  TOKEN_EXPIRY_SECONDS,
  API_VERSIONING,
  ARGON2_CONFIG,
  TOTP_CONFIG,
  SANITIZE_ALLOWED_TAGS,
  SANITIZE_ALLOWED_ATTRS,
  ALLOWED_URL_PROTOCOLS,
  BLOCKED_URL_PROTOCOLS,
  BREAKPOINTS,
  CACHE_TTLS,
  FIELD_LENGTHS,
} from '@/lib/constants';

// ===========================================================================
// Rate Limits
// ===========================================================================

describe('RATE_LIMITS', () => {
  // 1
  it('has positive max values for all rate limit groups', () => {
    for (const [, config] of Object.entries(RATE_LIMITS)) {
      expect(config.max).toBeGreaterThan(0);
    }
  });

  // 2
  it('has positive windowSeconds for all rate limit groups', () => {
    for (const [, config] of Object.entries(RATE_LIMITS)) {
      expect(config.windowSeconds).toBeGreaterThan(0);
    }
  });

  // 3
  it('auth rate limit is stricter than read rate limit', () => {
    expect(RATE_LIMITS.auth.max).toBeLessThan(RATE_LIMITS.read.max);
  });

  // 4
  it('password reset has a 1-hour window', () => {
    expect(RATE_LIMITS.passwordReset.windowSeconds).toBe(3600);
  });
});

// ===========================================================================
// Session Timeouts
// ===========================================================================

describe('SESSION_TIMEOUTS', () => {
  // 5
  it('staff timeout is 8 hours in seconds', () => {
    expect(SESSION_TIMEOUTS.staff).toBe(8 * 60 * 60);
  });

  // 6
  it('resident remembered is 30 days', () => {
    expect(SESSION_TIMEOUTS.residentRemembered).toBe(30 * 24 * 60 * 60);
  });

  // 7
  it('resident default is shorter than resident remembered', () => {
    expect(SESSION_TIMEOUTS.residentDefault).toBeLessThan(SESSION_TIMEOUTS.residentRemembered);
  });

  // 8
  it('warning shows before session expires (positive seconds)', () => {
    expect(SESSION_TIMEOUTS.warningBeforeExpiry).toBeGreaterThan(0);
    expect(SESSION_TIMEOUTS.warningBeforeExpiry).toBeLessThan(SESSION_TIMEOUTS.staff);
  });
});

// ===========================================================================
// Pagination
// ===========================================================================

describe('PAGINATION', () => {
  // 9
  it('default page size is between 1 and max', () => {
    expect(PAGINATION.defaultPageSize).toBeGreaterThan(0);
    expect(PAGINATION.defaultPageSize).toBeLessThanOrEqual(PAGINATION.maxPageSize);
  });

  // 10
  it('max page size is reasonable (<=200)', () => {
    expect(PAGINATION.maxPageSize).toBeGreaterThan(0);
    expect(PAGINATION.maxPageSize).toBeLessThanOrEqual(200);
  });

  // 11
  it('minimum page number is 1', () => {
    expect(PAGINATION.minPage).toBe(1);
  });
});

// ===========================================================================
// File Upload
// ===========================================================================

describe('FILE_UPLOAD', () => {
  // 12
  it('image size limit is 5 MB', () => {
    expect(FILE_UPLOAD.maxImageSize).toBe(5 * 1024 * 1024);
  });

  // 13
  it('document size limit is larger than image limit', () => {
    expect(FILE_UPLOAD.maxDocSize).toBeGreaterThan(FILE_UPLOAD.maxImageSize);
  });

  // 14
  it('video size limit is the largest', () => {
    expect(FILE_UPLOAD.maxVideoSize).toBeGreaterThan(FILE_UPLOAD.maxDocSize);
  });

  // 15
  it('max files per request is positive', () => {
    expect(FILE_UPLOAD.maxFilesPerRequest).toBeGreaterThan(0);
  });

  // 16
  it('max JSON depth is reasonable', () => {
    expect(FILE_UPLOAD.maxJsonDepth).toBeGreaterThanOrEqual(1);
    expect(FILE_UPLOAD.maxJsonDepth).toBeLessThanOrEqual(50);
  });
});

// ===========================================================================
// MIME Types
// ===========================================================================

describe('ALLOWED_MIME_TYPES', () => {
  // 17
  it('includes JPEG and PNG images', () => {
    expect(ALLOWED_MIME_TYPES.images).toContain('image/jpeg');
    expect(ALLOWED_MIME_TYPES.images).toContain('image/png');
  });

  // 18
  it('includes PDF documents', () => {
    expect(ALLOWED_MIME_TYPES.documents).toContain('application/pdf');
  });

  // 19
  it('includes CSV', () => {
    expect(ALLOWED_MIME_TYPES.documents).toContain('text/csv');
  });

  // 20
  it('ALL_ALLOWED_MIME_TYPES is the union of all categories', () => {
    const expected = [
      ...ALLOWED_MIME_TYPES.images,
      ...ALLOWED_MIME_TYPES.documents,
      ...ALLOWED_MIME_TYPES.video,
    ];
    expect(ALL_ALLOWED_MIME_TYPES).toEqual(expected);
  });
});

// ===========================================================================
// Password Policy
// ===========================================================================

describe('PASSWORD_POLICY', () => {
  // 21
  it('minimum length is at least 8', () => {
    expect(PASSWORD_POLICY.minLength).toBeGreaterThanOrEqual(8);
  });

  // 22
  it('max length is larger than min length', () => {
    expect(PASSWORD_POLICY.maxLength).toBeGreaterThan(PASSWORD_POLICY.minLength);
  });

  // 23
  it('lockout attempts is positive', () => {
    expect(PASSWORD_POLICY.lockoutAttempts).toBeGreaterThan(0);
  });

  // 24
  it('password patterns contain required complexity checks', () => {
    expect(PASSWORD_PATTERNS.uppercase).toBeInstanceOf(RegExp);
    expect(PASSWORD_PATTERNS.lowercase).toBeInstanceOf(RegExp);
    expect(PASSWORD_PATTERNS.digit).toBeInstanceOf(RegExp);
    expect(PASSWORD_PATTERNS.special).toBeInstanceOf(RegExp);
  });
});

// ===========================================================================
// Token Expiry
// ===========================================================================

describe('TOKEN_EXPIRY', () => {
  // 25
  it('access token is short-lived (15m)', () => {
    expect(TOKEN_EXPIRY.accessToken).toBe('15m');
  });

  // 26
  it('refresh token is longer than access token in seconds', () => {
    expect(TOKEN_EXPIRY_SECONDS.refreshToken).toBeGreaterThan(TOKEN_EXPIRY_SECONDS.accessToken);
  });
});

// ===========================================================================
// Sanitization Allowlists
// ===========================================================================

describe('Sanitization constants', () => {
  // 27
  it('allowed tags include safe formatting tags', () => {
    expect(SANITIZE_ALLOWED_TAGS).toContain('b');
    expect(SANITIZE_ALLOWED_TAGS).toContain('i');
    expect(SANITIZE_ALLOWED_TAGS).toContain('a');
    expect(SANITIZE_ALLOWED_TAGS).toContain('p');
  });

  // 28
  it('allowed tags do NOT include script or iframe', () => {
    expect(SANITIZE_ALLOWED_TAGS).not.toContain('script');
    expect(SANITIZE_ALLOWED_TAGS).not.toContain('iframe');
  });

  // 29
  it('anchor tag has href in allowed attrs', () => {
    expect(SANITIZE_ALLOWED_ATTRS.a).toContain('href');
  });

  // 30
  it('only https protocol is allowed', () => {
    expect(ALLOWED_URL_PROTOCOLS).toContain('https:');
    expect(ALLOWED_URL_PROTOCOLS).not.toContain('http:');
  });

  // 31
  it('javascript protocol is blocked', () => {
    expect(BLOCKED_URL_PROTOCOLS).toContain('javascript:');
    expect(BLOCKED_URL_PROTOCOLS).toContain('data:');
    expect(BLOCKED_URL_PROTOCOLS).toContain('vbscript:');
  });
});

// ===========================================================================
// Misc Constants
// ===========================================================================

describe('Miscellaneous constants', () => {
  // 32
  it('API version prefix starts with /api/', () => {
    expect(API_VERSIONING.prefix).toMatch(/^\/api\//);
  });

  // 33
  it('TOTP digits is 6', () => {
    expect(TOTP_CONFIG.digits).toBe(6);
  });

  // 34
  it('FIELD_LENGTHS values are all positive', () => {
    for (const [, len] of Object.entries(FIELD_LENGTHS)) {
      expect(len).toBeGreaterThan(0);
    }
  });

  // 35
  it('breakpoints are in ascending order', () => {
    expect(BREAKPOINTS.sm).toBeLessThan(BREAKPOINTS.md);
    expect(BREAKPOINTS.md).toBeLessThan(BREAKPOINTS.lg);
    expect(BREAKPOINTS.lg).toBeLessThan(BREAKPOINTS.xl);
  });

  // 36
  it('cache TTLs are positive', () => {
    expect(CACHE_TTLS.permissionsSeconds).toBeGreaterThan(0);
    expect(CACHE_TTLS.jwtDenyListMaxSeconds).toBeGreaterThan(0);
  });

  // 37
  it('argon2 config has expected fields', () => {
    expect(ARGON2_CONFIG.memoryCost).toBeGreaterThan(0);
    expect(ARGON2_CONFIG.timeCost).toBeGreaterThan(0);
    expect(ARGON2_CONFIG.parallelism).toBeGreaterThan(0);
    expect(ARGON2_CONFIG.hashLength).toBeGreaterThan(0);
    expect(ARGON2_CONFIG.saltLength).toBeGreaterThan(0);
  });
});
