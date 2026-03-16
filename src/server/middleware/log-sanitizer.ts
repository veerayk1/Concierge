/**
 * Concierge — Log Sanitizer
 *
 * Recursively walks objects and redacts / masks fields that may contain
 * Personally Identifiable Information (PII) before they reach log output.
 *
 * Two strategies:
 * 1. **Redact** — Replace the value with "[REDACTED]" (passwords, tokens, etc.)
 * 2. **Mask**   — Partially obscure the value (email → "j***@example.com")
 */

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

/**
 * Field names (lowercased) that should be completely redacted.
 * Checked with `includes` against the lowercased key.
 */
const REDACT_FIELDS: ReadonlySet<string> = new Set([
  'password',
  'token',
  'secret',
  'authorization',
  'cookie',
  'ssn',
  'sin',
  'passport',
  'creditcard',
  'bankaccount',
  'dateofbirth',
  'accesstoken',
  'refreshtoken',
  'apikey',
  'privatekey',
]);

/**
 * Field names (lowercased) whose values should be masked as emails.
 */
const EMAIL_FIELDS: ReadonlySet<string> = new Set([
  'email',
  'emailaddress',
  'useremail',
  'contactemail',
]);

const REDACTED = '[REDACTED]';
const MAX_DEPTH = 10;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Normalise a key for comparison: lowercase and strip underscores / hyphens.
 */
function normaliseKey(key: string): string {
  return key.toLowerCase().replace(/[-_]/g, '');
}

/**
 * Mask an email address: `jane@example.com` → `j***@example.com`.
 * Non-string or non-email values are redacted entirely.
 */
function maskEmail(value: unknown): string {
  if (typeof value !== 'string') return REDACTED;

  const atIndex = value.indexOf('@');
  if (atIndex < 1) return REDACTED;

  const localPart = value.slice(0, atIndex);
  const domain = value.slice(atIndex);
  const firstChar = localPart[0] ?? '';

  return `${firstChar}***${domain}`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Recursively sanitise an object for safe logging.
 *
 * - Fields matching `REDACT_FIELDS` are replaced with `[REDACTED]`.
 * - Fields matching `EMAIL_FIELDS` are masked (`j***@domain`).
 * - Arrays are walked element-by-element.
 * - Circular references are replaced with `[Circular]`.
 * - Depth is capped at 10 levels to prevent stack overflow.
 *
 * The input is never mutated; a new object tree is returned.
 */
export function sanitizeForLog(obj: unknown): unknown {
  const seen = new WeakSet<object>();

  function walk(value: unknown, depth: number): unknown {
    // Primitives pass through
    if (value === null || value === undefined) return value;
    if (typeof value === 'boolean' || typeof value === 'number') return value;
    if (typeof value === 'string') return value;
    if (typeof value === 'bigint') return value.toString();

    // Depth guard
    if (depth > MAX_DEPTH) return '[MaxDepth]';

    // Must be an object or array from here
    if (typeof value !== 'object') return String(value);
    const objValue = value as Record<string, unknown>;

    // Circular reference guard
    if (seen.has(objValue)) return '[Circular]';
    seen.add(objValue);

    // Arrays
    if (Array.isArray(objValue)) {
      return objValue.map((item) => walk(item, depth + 1));
    }

    // Date objects
    if (objValue instanceof Date) {
      return objValue.toISOString();
    }

    // Plain objects
    const result: Record<string, unknown> = {};

    for (const key of Object.keys(objValue)) {
      const normKey = normaliseKey(key);

      if (REDACT_FIELDS.has(normKey)) {
        result[key] = REDACTED;
      } else if (EMAIL_FIELDS.has(normKey)) {
        result[key] = maskEmail(objValue[key]);
      } else {
        result[key] = walk(objValue[key], depth + 1);
      }
    }

    return result;
  }

  return walk(obj, 0);
}
