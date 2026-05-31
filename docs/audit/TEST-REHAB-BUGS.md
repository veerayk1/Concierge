# Test Rehabilitation — Suspected Real Bugs

Tracking file for the vitest rehabilitation (see TEST-SUITE-STATUS.md and
the plan at .claude/plans/). When a test, given **valid input that satisfies
the route's current contract**, still fails in a way that suggests the ROUTE
is wrong (not the test), it is logged here and the test is left red — never
silenced.

## Status: empty

No confirmed real route bugs found so far. Every failure investigated through
Tier 0 and Tier 1 traced to stale test fixtures vs. deliberately hardened
route validation (UUID id checks, required fields, rotation semantics, CR/LF
stripping), not to product defects.

<!--
Entry format when one is found:
### <route> — <symptom>
- File: <test path:line>
- Valid input used: <payload>
- Expected vs actual: <e.g. 201 vs 400 VALIDATION_ERROR on a valid body>
- Why it looks like a route bug: <reasoning>
- Route file: <path:line>
-->
