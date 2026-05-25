# Phase 1 — Resident Polish

> **Status:** in progress, started 2026-05-25
> **Branch:** main
> **Commit range:** UX-103 → UX-110 (one commit per page or coherent fix)
> **Persona:** Alice — resident owner in unit 2204
> **Tester role:** `demo_role = resident_owner` on the live preview

## Why this phase first

The resident persona is the only one we touched in the prior overnight session
(UX-098 through UX-102). Several pages a resident lands on still leak admin
surfaces, technical IDs, test seed data, or staff-side terminology. We finish
the resident loop before touching staff-side personas in Phase 2+ so the demo
to a board has a clean end-to-end resident story.

## Audit method (per page)

1. Switch `demo_role` to `resident_owner` in localStorage via `preview_eval`.
2. `preview_screenshot` desktop 1280×800, then `preview_resize mobile` and screenshot again.
3. `preview_snapshot` — read accessibility tree for jargon, leaked admin labels, test prefixes.
4. Click every interactive element. Watch `preview_console_logs --level error`
   and `preview_network --filter failed` for 403/500.
5. Re-test as `property_manager` to confirm we didn't break the staff view.

## Pages in scope (in order of impact)

### 1. /dashboard — UX-103 (polish pass)

Already redesigned tonight (commits 80bfe50, cff1854, 8beb1a2). User said
"my mood will go off if the design is not good" — re-evaluate critically.

Check:

- Typography rhythm — H1 30px, section labels 15px, KPI numbers ~30px.
- KPI tile pattern matches UX-093/094 (no icon-in-tinted-square).
- Hover states on quick action cards (subtle shadow rise).
- Empty-state voice — "All quiet from the desk", "A quiet week".
- Mobile breakpoint (375×812): cards stack cleanly, no overflow.
- Announcement card spacing rhythm.

Likely fixes: tighten micro-spacing, polish hover transitions, verify mobile.

### 2. /my-packages — UX-104

Current state: list-only, no `[id]` detail route exists.

Check:

- Role gate not yet applied (this page is resident-only by nav, but defensive
  gate ensures staff who land here see a clear error, not nothing).
- Seed data filter — `isTestSeedTitle()` against description.
- Stripe-like detail rows for packages (sender, carrier, arrival time,
  storage spot, status badge).
- "Picked up" history collapsed by default — residents want to see what's
  waiting, not their archive.
- Empty state — "No packages waiting. We'll text you when one arrives."

### 3. /my-requests — UX-105

Check:

- Status badges color-coded sparingly (only red/amber for ones needing
  action, neutral for in-progress).
- Sort: open at top, descending by created date.
- Inline status pill, sub-text "Last update 2 hours ago".
- "New request" primary CTA top-right.
- Empty state — "No active requests. Submit one if something needs
  attention."

### 4. /amenity-booking — UX-106

Check:

- Resident view: "My upcoming bookings" first, then "Browse amenities".
- Don't show occupancy reports, staff-side approval queue, or
  amenity-level admin (rate, max capacity).
- Calendar view: highlight resident's own bookings; show building
  bookings only as occupied-greyed cells.
- Empty state for own bookings: "Book the pool, sauna, or party room."

### 5. /announcements (list) — UX-107

Detail page (`[id]`) is already role-gated at commit 650bf4f. Re-check the
list.

Check:

- Seed data filter (same regex as dashboard).
- HTML-strip preview text (same `stripHtml` helper).
- No "New announcement" button for residents.
- Pinned-first ordering.

### 6. /residents/vacations — UX-108

Resident sets dates so staff knows they're away. Check:

- Calendar / date picker is the primary surface.
- List of past + upcoming vacations as a calmer section below.
- Empty state: "Going away? Let the desk know."

### 7. /my-account — UX-109

Multi-tab page. Check each tab:

- Profile (read-only or limited edit for residents)
- Notifications (per-channel preferences)
- Security (password change, 2FA)
- Vehicles, pets, emergency contacts (resident-owned data)

Apply role-gate at the page level to ensure staff-only tabs (e.g. role
management) are hidden from residents.

### 8. Mobile sweep — UX-110

After all of the above, swap viewport to 375×812 and walk through every
resident page again. Fix any obvious cramping / overflow.

## Commit hygiene

One commit per UX-NNN. Format:

```
fix(UX-NNN): <screen> — <what changed>

Body explains what the resident persona sees now that they didn't before,
or what they no longer see that they shouldn't.

Co-Authored-By: Claude Opus 4.7 (1M context) <noreply@anthropic.com>
```

## Definition of done for Phase 1

- Every resident-facing page survives a re-test as `resident_owner` with:
  - No console errors (HMR-stale warnings excluded)
  - No failed network calls (only intentional 401/403 for staff-only endpoints)
  - No leaked test-seed titles
  - No admin/staff controls visible
  - Mobile breakpoint at 375×812 renders without horizontal overflow
- Cross-checked as `property_manager` to confirm staff view still works.
- Each page's commit landed on `main` with a real message.
- This document updated with screenshots / notes per page if any decisions
  changed mid-execution.

## Out of scope for Phase 1

- Building new detail routes for `/my-packages/[id]`, `/my-requests/[id]`,
  `/amenity-booking/[id]` — these don't exist yet; they get spun out to
  Phase 5 (detail-pages sweep) once we know the surface area.
- Staff-side dashboards (front desk, security, admin) — Phase 2/3/4.
- Marketing/landing — Phase 7.
