# Test Rehabilitation — Suspected Real Bugs

Tracking file for the vitest rehabilitation (see TEST-SUITE-STATUS.md and
the plan at .claude/plans/). When a test, given **valid input that satisfies
the route's current contract**, still fails in a way that suggests the ROUTE
is wrong (not the test), it is logged here and the test is left red — never
silenced.

## Found + fixed

### 1. Amenity booking `[id]` route rejected every booking (FIXED)

- **Route:** `src/app/api/v1/amenities/[id]/route.ts` (POST booking), ~line 139
- **Bug:** parsed the start/end time with `new Date(input.startTime)` where
  `startTime` is a bare clock string like `"10:00"` (from the UI's
  `<input type="time">`). `new Date("10:00")` is `Invalid Date`, so the
  future-guard `Number.isNaN(startsAt.getTime())` was always true → **every
  booking 400'd with `INVALID_TIME`.** The sibling `/resident/bookings` route
  combined date+time correctly (`1970-01-01T${startTime}`); this endpoint did not.
- **Fix:** combine date+time before parsing —
  `new Date(\`${input.startDate}T${input.startTime}\`)` for both start and end.
- **Surfaced by:** `amenities/__tests__/comprehensive.test.ts` booking-create
  tests (they send the documented `"10:00"` format and expect 201).
- **Severity:** real, but the production resident UI posts to `/resident/bookings`
  (unaffected); this `[id]` endpoint is the secondary/staff path. Still a genuine
  defect — any caller using the documented payload was blocked.

## Status: 1 found and fixed, 0 outstanding

Every other failure investigated through Tiers 0-2 traced to stale test
fixtures vs. deliberately hardened route validation (UUID id checks, required
fields, rotation semantics, CR/LF stripping, module gating, CAS transitions),
not to product defects.

<!--
Entry format when one is found:
### <route> — <symptom>
- File: <test path:line>
- Valid input used: <payload>
- Expected vs actual: <e.g. 201 vs 400 VALIDATION_ERROR on a valid body>
- Why it looks like a route bug: <reasoning>
- Route file: <path:line>
-->
