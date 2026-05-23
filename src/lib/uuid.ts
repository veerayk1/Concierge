/**
 * Tiny UUID validator used at API boundaries.
 *
 * Most of our route handlers blindly forward path params into prisma.findUnique
 * which then 500s on malformed input ("not-a-uuid", control bytes, path
 * traversal strings). Validating up-front lets us return a clean 400 with
 * VALIDATION_ERROR instead of leaking a Prisma stack trace.
 */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isUuid(value: unknown): value is string {
  return typeof value === 'string' && UUID_REGEX.test(value);
}
