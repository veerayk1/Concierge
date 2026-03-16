/**
 * Concierge — App-Wide Constants
 *
 * All values derived from the Security Rulebook and Architecture PRD.
 * Centralized here to avoid magic numbers scattered across the codebase.
 *
 * @module constants
 */

// ---------------------------------------------------------------------------
// Rate Limits (Security Rulebook C.4)
// ---------------------------------------------------------------------------

/**
 * Rate limit configuration per endpoint group.
 * Enforced by Redis-backed sliding window middleware.
 */
export const RATE_LIMITS = {
  /** Login, register, password reset — per IP */
  auth: { max: 5, windowSeconds: 60 },
  /** GET endpoints — per user */
  read: { max: 100, windowSeconds: 60 },
  /** POST, PUT, PATCH, DELETE — per user */
  write: { max: 30, windowSeconds: 60 },
  /** File upload endpoints — per user */
  upload: { max: 10, windowSeconds: 60 },
  /** Emergency broadcast — per property */
  emergency: { max: 5, windowSeconds: 60 },
  /** Password reset request — per email */
  passwordReset: { max: 3, windowSeconds: 3600 },
  /** 2FA verification — per user */
  mfaVerification: { max: 5, windowSeconds: 300 },
  /** API key endpoints — per API key */
  apiKey: { max: 10, windowSeconds: 60 },
  /** Global catch-all — per IP */
  globalPerIp: { max: 300, windowSeconds: 60 },
} as const;

// ---------------------------------------------------------------------------
// Session Timeouts (Security Rulebook A.6)
// ---------------------------------------------------------------------------

/** Session timeout durations in seconds. */
export const SESSION_TIMEOUTS = {
  /** Staff roles: 8 hours of inactivity */
  staff: 8 * 60 * 60,
  /** Resident with "Remember me": 30 days */
  residentRemembered: 30 * 24 * 60 * 60,
  /** Resident without "Remember me": 24 hours */
  residentDefault: 24 * 60 * 60,
  /** Warning toast shown this many seconds before expiry */
  warningBeforeExpiry: 5 * 60,
  /** Super Admin re-auth window for elevated operations */
  superAdminReauth: 5 * 60,
} as const;

// ---------------------------------------------------------------------------
// Password Policy (Security Rulebook A.3)
// ---------------------------------------------------------------------------

export const PASSWORD_POLICY = {
  /** Minimum password length */
  minLength: 12,
  /** Maximum password length (practical storage limit) */
  maxLength: 128,
  /** Number of previous passwords that cannot be reused */
  historyCount: 5,
  /** Failed attempts before account lockout */
  lockoutAttempts: 5,
  /** Lockout duration in seconds (15 minutes) */
  lockoutDurationSeconds: 15 * 60,
  /** After this many lockout cycles, permanent lock until Admin intervention */
  maxLockoutCycles: 3,
  /** IP-level failed attempts threshold */
  ipLockoutAttempts: 20,
  /** IP lockout window in seconds (10 minutes) */
  ipLockoutWindowSeconds: 10 * 60,
  /** IP lockout duration in seconds (30 minutes) */
  ipLockoutDurationSeconds: 30 * 60,
  /** Sliding window for failed attempt counters (30 minutes) */
  failedAttemptWindowSeconds: 30 * 60,
} as const;

/** Password complexity regex patterns (Security Rulebook A.3.2). */
export const PASSWORD_PATTERNS = {
  uppercase: /[A-Z]/,
  lowercase: /[a-z]/,
  digit: /\d/,
  special: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/,
} as const;

// ---------------------------------------------------------------------------
// File Upload (Security Rulebook K + C.5)
// ---------------------------------------------------------------------------

export const FILE_UPLOAD = {
  /** Max image file size: 5 MB */
  maxImageSize: 5 * 1024 * 1024,
  /** Max document file size: 10 MB */
  maxDocSize: 10 * 1024 * 1024,
  /** Max video file size: 50 MB */
  maxVideoSize: 50 * 1024 * 1024,
  /** Max files per single upload request */
  maxFilesPerRequest: 10,
  /** Max total upload size per request: 50 MB */
  maxTotalSize: 50 * 1024 * 1024,
  /** Max request body size (non-upload): 10 MB */
  maxRequestBodySize: 10 * 1024 * 1024,
  /** Max JSON nesting depth */
  maxJsonDepth: 10,
  /** Max array length in request bodies */
  maxArrayLength: 1000,
} as const;

/** Allowed MIME types grouped by category. */
export const ALLOWED_MIME_TYPES = {
  images: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/heic',
    'image/heif',
    'image/svg+xml',
  ] as const,
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/csv',
    'text/plain',
  ] as const,
  video: ['video/mp4', 'video/quicktime', 'video/webm'] as const,
} as const;

/** Flat array of all allowed MIME types for validation. */
export const ALL_ALLOWED_MIME_TYPES: readonly string[] = [
  ...ALLOWED_MIME_TYPES.images,
  ...ALLOWED_MIME_TYPES.documents,
  ...ALLOWED_MIME_TYPES.video,
];

// ---------------------------------------------------------------------------
// Pagination
// ---------------------------------------------------------------------------

export const PAGINATION = {
  /** Default number of items per page */
  defaultPageSize: 25,
  /** Maximum allowed items per page */
  maxPageSize: 100,
  /** Minimum page number */
  minPage: 1,
} as const;

// ---------------------------------------------------------------------------
// Token Expiry (Security Rulebook A.1 + A.8)
// ---------------------------------------------------------------------------

export const TOKEN_EXPIRY = {
  /** Access token lifetime */
  accessToken: '15m' as const,
  /** Refresh token lifetime */
  refreshToken: '7d' as const,
  /** Account activation link */
  activationLink: '24h' as const,
  /** Password reset token */
  passwordReset: '1h' as const,
  /** MFA pending verification window */
  mfaPending: '5m' as const,
} as const;

/** Token expiry durations in seconds for Redis TTL. */
export const TOKEN_EXPIRY_SECONDS = {
  accessToken: 15 * 60,
  refreshToken: 7 * 24 * 60 * 60,
  activationLink: 24 * 60 * 60,
  passwordReset: 60 * 60,
  mfaPending: 5 * 60,
} as const;

// ---------------------------------------------------------------------------
// API Versioning
// ---------------------------------------------------------------------------

export const API_VERSIONING = {
  currentVersion: 'v1',
  prefix: '/api/v1',
} as const;

// ---------------------------------------------------------------------------
// Argon2 Hashing Parameters (Security Rulebook A.2)
// ---------------------------------------------------------------------------

export const ARGON2_CONFIG = {
  memoryCost: 65536,
  timeCost: 3,
  parallelism: 4,
  hashLength: 32,
  saltLength: 16,
} as const;

// ---------------------------------------------------------------------------
// TOTP / 2FA (Security Rulebook A.5)
// ---------------------------------------------------------------------------

export const TOTP_CONFIG = {
  /** TOTP algorithm */
  algorithm: 'SHA1' as const,
  /** Number of digits in the code */
  digits: 6,
  /** Time step in seconds */
  period: 30,
  /** Window tolerance (periods before/after) */
  window: 1,
  /** Number of recovery codes generated */
  recoveryCodeCount: 10,
  /** Length of each recovery code */
  recoveryCodeLength: 8,
  /** Redis TTL for used TOTP codes (replay prevention) */
  usedCodeTtlSeconds: 90,
} as const;

// ---------------------------------------------------------------------------
// DOMPurify Allowlist (Security Rulebook C.3.2)
// ---------------------------------------------------------------------------

export const SANITIZE_ALLOWED_TAGS = [
  'b',
  'i',
  'u',
  'a',
  'ul',
  'ol',
  'li',
  'p',
  'br',
  'strong',
  'em',
] as const;

export const SANITIZE_ALLOWED_ATTRS: Record<string, readonly string[]> = {
  a: ['href', 'title', 'target', 'rel'],
} as const;

/** URL protocols allowed in user content (Security Rulebook C.3.4). */
export const ALLOWED_URL_PROTOCOLS = ['https:'] as const;

/** URL protocols explicitly blocked. */
export const BLOCKED_URL_PROTOCOLS = ['javascript:', 'data:', 'vbscript:'] as const;

// ---------------------------------------------------------------------------
// Breakpoints (from design tokens)
// ---------------------------------------------------------------------------

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
  monitor: 1920,
} as const;

// ---------------------------------------------------------------------------
// Cache TTLs
// ---------------------------------------------------------------------------

export const CACHE_TTLS = {
  /** Permission cache in Redis (Security Rulebook B.4.1) */
  permissionsSeconds: 60,
  /** JWT deny list entry TTL (matches remaining token lifetime) */
  jwtDenyListMaxSeconds: TOKEN_EXPIRY_SECONDS.accessToken,
} as const;

// ---------------------------------------------------------------------------
// Misc
// ---------------------------------------------------------------------------

/** Maximum description / comment field lengths (Security Rulebook C.5.5). */
export const FIELD_LENGTHS = {
  name: 200,
  email: 254,
  description: 4000,
  comment: 2000,
  shortText: 500,
  phone: 20,
  postalCode: 10,
  unitNumber: 20,
} as const;
