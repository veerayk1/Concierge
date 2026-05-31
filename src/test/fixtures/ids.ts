/**
 * Valid-UUID test fixtures.
 *
 * 37 of 43 `[id]` API routes validate path params with `isUuid()`
 * (src/lib/uuid.ts) and return 400 on anything that isn't a UUID. A lot of
 * older tests pass readable fake ids like 'pkg-1' / 'ad-1' / 'booking-1',
 * which now (correctly) fail that guard. This module gives tests a way to
 * keep readable, stable ids that are ALSO valid UUIDs.
 *
 *   import { testUuid } from '@/test/fixtures/ids';
 *   const params = Promise.resolve({ id: testUuid('pkg-1') });
 *   mockPackageFindUnique.mockResolvedValue({ id: testUuid('pkg-1'), ... });
 *
 * `testUuid(label)` is deterministic: the same label always yields the same
 * UUID, so a path-param id and the mock it resolves stay in sync without
 * hand-maintaining UUID literals.
 */

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Deterministically map any label to a valid (v4-shaped) UUID.
 * FNV-1a seed, then a small xorshift mixer to fill 32 hex chars.
 */
export function testUuid(label: string): string {
  // If the caller already handed us a UUID, pass it straight through.
  if (UUID_RE.test(label)) return label;

  let h = 0x811c9dc5 >>> 0;
  for (let i = 0; i < label.length; i++) {
    h ^= label.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  let hex = '';
  let x = h >>> 0;
  while (hex.length < 32) {
    x = (Math.imul(x, 0x01000193) ^ (x >>> 7)) >>> 0;
    hex += x.toString(16).padStart(8, '0');
  }
  hex = hex.slice(0, 32);
  // Shape into 8-4-4-4-12 with version nibble 4 and variant nibble 8.
  return (
    `${hex.slice(0, 8)}-${hex.slice(8, 12)}-4${hex.slice(13, 16)}-` +
    `8${hex.slice(17, 20)}-${hex.slice(20, 32)}`
  );
}

/**
 * Common stable ids matching the seed convention (00000000-0000-4000-…).
 * Use these when a test needs to line up with seeded/tenant constants.
 */
export const TEST_IDS = {
  propertyA: '00000000-0000-4000-b000-000000000001',
  propertyB: '00000000-0000-4000-b000-000000000002',
  userAdmin: '00000000-0000-4000-a000-000000000001',
  unitA: '00000000-0000-4000-e000-000000000001',
} as const;
