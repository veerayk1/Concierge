# Quality Bar — The Production-Ready Checklist

> **Read this BEFORE shipping any feature.** This file is the codified standard for what "done" means in Concierge. Both humans and AI agents working on this codebase must check the relevant section before claiming a feature complete.
>
> The bar exists because we keep shipping features that look complete in code review but fail in the first 30 seconds of real use. Validations missing. Loading states missing. Empty states missing. Error handling missing. This file makes those omissions impossible to call done.

---

## How to use this file

1. Before opening a PR, find the section(s) that apply to your change (forms, lists, write actions, etc.).
2. Check every box in those sections. If a box is unchecked, the feature is not done.
3. If you can't check a box because it's genuinely not applicable, write a one-line note in the PR explaining why.
4. The reviewer (human or AI) must verify each box independently — not take the author's word.

---

## Section A: Input fields (every `<input>`, `<select>`, `<textarea>`)

For every input the user can type into, ALL of these must be true:

- [ ] **A1. Uses a typed form primitive**, not a raw `<input>`. If the data type is email, phone, postal code, address, currency, date, percent, URL, or any other constrained type, use the matching primitive from `src/components/forms/primitives/`. Only use the generic `<Input>` for free-form text.
- [ ] **A2. Validates on blur AND on submit.** Not only on submit — the user must see the inline error the moment they leave the field, not after they've moved on three steps and clicked Save.
- [ ] **A3. Validates client-side AND server-side.** Same Zod schema in both places — import from `src/schemas/`. Client gives instant feedback; server is the source of truth.
- [ ] **A4. Has placeholder text that shows the expected format.** Phone: `(416) 555-0123`. Postal code: `M5V 2T6`. Date: `YYYY-MM-DD`.
- [ ] **A5. Has an explicit label visible above the field.** Never label-via-placeholder — placeholders disappear when the user types.
- [ ] **A6. Marks required vs optional explicitly.** Either an asterisk on required, or "(optional)" on optional. Pick one convention; be consistent.
- [ ] **A7. Shows the inline error in a fixed position** so the layout doesn't jump when validation fires. Error text uses `role="alert"` for screen readers.
- [ ] **A8. Formats as the user types** (where applicable). Phone numbers gain parentheses and dashes. Postal codes auto-uppercase. Currency adds commas. Date pickers use a calendar widget.
- [ ] **A9. Has an `autocomplete` attribute** so password managers and browser autofill work: `email`, `tel`, `street-address`, `postal-code`, `cc-number`, etc.
- [ ] **A10. Caps `maxLength` to a sensible value.** Email 254. Phone 20. Postal code 10. Free-form notes 5000. Match the Zod schema.

## Section B: Forms (every `<form>` or dialog containing inputs)

- [ ] **B1. Uses react-hook-form + zodResolver.** Not raw `useState` per field. Not formik. There's one pattern; everyone follows it.
- [ ] **B2. Disables the submit button while submitting AND shows a spinner inside it.** Not next to it; inside it.
- [ ] **B3. Disables the submit button when the form is invalid.** Greys it out with a tooltip or helper text saying what's missing.
- [ ] **B4. Shows a top-of-form summary error** if the server returns an error that doesn't map to a specific field ("Network error. Please try again.").
- [ ] **B5. Preserves user input on submit failure.** Never wipe the form on a 4xx/5xx. The user just typed for 90 seconds.
- [ ] **B6. Closes the dialog only on success.** On error: dialog stays open, errors visible, retry possible.
- [ ] **B7. Confirms before discarding unsaved changes.** Closing a dialog with dirty fields opens a "Discard?" confirmation.
- [ ] **B8. Focus-traps inside the dialog and restores focus to the trigger on close.** Use Radix's `Dialog` or equivalent — don't roll your own.
- [ ] **B9. Submits on Enter** (when the focused field isn't a textarea). Cancel on Escape.
- [ ] **B10. Has a success state.** A toast, a redirect, an inline confirmation — the user must know it worked. "Silently closed dialog" is not success.

## Section C: Lists / tables / data grids (every page that shows multiple records)

- [ ] **C1. Has pagination** — never load 10,000 rows at once.
- [ ] **C2. Has a search field** if the list is >20 items.
- [ ] **C3. Has filter controls** for the obvious axes (status, category, date range, owner).
- [ ] **C4. Has sortable columns** for sortable axes (created date, status, name).
- [ ] **C5. Empty state** with an illustration + headline + primary CTA ("No vendors yet. Add your first."). Never just an empty table.
- [ ] **C6. Loading state** with skeleton rows, not a centered spinner that hides the layout.
- [ ] **C7. Error state** with a "Retry" button — not a silent fail or a console error.
- [ ] **C8. Row click goes to the detail page or opens an edit dialog.** Rows must not be visually-clickable-but-dead.
- [ ] **C9. Bulk select + bulk actions** if any meaningful bulk operation exists (export, delete, assign).
- [ ] **C10. Export to CSV/Excel** for any list an admin would want to share or archive.

## Section D: Destructive actions (delete, cancel, suspend, revoke)

- [ ] **D1. Confirmation dialog** with the resource name typed in the message ("Delete vendor _Acme Plumbing_? This will…").
- [ ] **D2. Explicit "type the name to confirm"** for irreversible actions on critical resources (delete property, revoke admin, cancel subscription).
- [ ] **D3. Shows consequences** in the confirmation ("This will cancel 3 active maintenance requests and unassign 2 vendors.").
- [ ] **D4. Defaults to Cancel** — destructive option is never the primary button.
- [ ] **D5. Soft-delete where possible** (set `deletedAt`, not actual DELETE). User-visible "Undo" toast for 10 seconds after.
- [ ] **D6. Audit log entry** for the action — who, when, what was destroyed.

## Section E: Authorization (every read, write, delete)

- [ ] **E1. Role gate via `guardRoute(request, { roles: [...] })`** — not bare `guardRoute(request)`. Explicit role list, even if the list is "all logged-in users."
- [ ] **E2. Tenancy check via `enforcePropertyAccess(auth.user, propertyId)`** on every endpoint that uses `body.propertyId` or `params.propertyId`. Always. No exceptions.
- [ ] **E3. Per-resource ownership check** for resident-scoped data (residents see only their own; staff see all). Match `residentId` or check `occupancyRecord`.
- [ ] **E4. Whitelist body fields** residents are allowed to change — never trust the body. Status, assignment, priority are staff-only fields even on a resident's own resource.
- [ ] **E5. Detail endpoint has the SAME role gate as its list endpoint.** "List locked, detail open" is the most-repeated leak shape in this codebase.
- [ ] **E6. No `userId` / `createdById` / `residentId` accepted from the body.** Always use `auth.user.userId`. Mass-assignment trap.
- [ ] **E7. UUID-validate every path parameter** via `isUuid(id)` — return 400 before any DB lookup. Prevents PG `Invalid UUID` 500s and surface-mapping via error differentials.

## Section F: Side effects (email, SMS, push, audit, child entity creation)

- [ ] **F1. Atomic CAS on status transitions.** Use raw SQL `UPDATE ... WHERE status=$old`. Prisma `updateMany` did NOT serialize correctly under our dev pool. See `project_race_fix_pattern.md` in claude-mem.
- [ ] **F2. Idempotency on external webhooks** (Stripe, SendGrid, FCM). Check `event.id` or the natural unique key — N delivery attempts must produce 1 row.
- [ ] **F3. Unique constraint on (entity, user)** for "once per user" actions (broadcast acks, course enrollments, quiz submissions). Catch P2002, don't pre-check then act.
- [ ] **F4. Atomic counters** — use Prisma `{ increment: 1 }` or raw SQL, never read-modify-write.
- [ ] **F5. Outbound notifications fire AFTER the CAS wins** — not before. Otherwise N race losers each send their own email.

## Section G: API responses

- [ ] **G1. Consistent error shape** — always `{ error: 'CODE', message: 'Human-readable', fields?: {...} }`. Never raw stack traces or vague 500s.
- [ ] **G2. Validation errors are field-level**, not a single string. Frontend can map them to the right input.
- [ ] **G3. Auth errors return 401 (not 403) when token is missing/expired; 403 when token is valid but role insufficient.** Distinguish.
- [ ] **G4. Pagination metadata** on every list response: `{ data, meta: { page, pageSize, total, totalPages } }`. Cap pageSize at 200.
- [ ] **G5. Avoid leaking internal IDs** in error messages. "Webhook not found" not "SubscriptionId abc123 has no Stripe customer mapped to property prop_xyz."

## Section H: Loading / error / empty states

Every component that fetches data must handle ALL FIVE states:

- [ ] **H1. Initial loading** — skeleton matching the eventual layout, not a spinner.
- [ ] **H2. Empty** — illustration + helpful message + primary CTA to populate.
- [ ] **H3. Error** — clear message + retry button. Never blank.
- [ ] **H4. Partial / stale** — refetching after data already loaded shows a subtle indicator, not a flash to blank.
- [ ] **H5. Success / loaded** — the actual data.

## Section I: Accessibility

- [ ] **I1. Keyboard-navigable.** Tab order makes sense, all interactive elements reachable, focus visible.
- [ ] **I2. Screen-reader labels.** Every icon button has `aria-label`. Every form field has a `<label htmlFor>`.
- [ ] **I3. Color is not the only signal.** Status badges have text AND color. Error states have an icon AND red.
- [ ] **I4. Contrast meets WCAG 2.2 AA** — 4.5:1 for body text, 3:1 for large text and UI elements.
- [ ] **I5. Modal dialogs** trap focus and restore on close (Radix Dialog handles this — use it).
- [ ] **I6. `prefers-reduced-motion` respected** for animations.

## Section J: Mobile / responsive

- [ ] **J1. Tested at 375px** (iPhone SE) — nothing overflows, all CTAs reachable.
- [ ] **J2. Tested at 768px** (iPad portrait) — tables don't truncate, dialogs fit.
- [ ] **J3. Tested at 1280px+** (desktop monitor — the primary target per `feedback_desktop_first.md`).
- [ ] **J4. Touch targets ≥ 44×44px** on mobile.
- [ ] **J5. No hover-only interactions** — every hover-revealed action also reachable via tap/click or kebab menu.

## Section K: Performance

- [ ] **K1. Initial page load ≤ 1.5s** on 4G (Lighthouse Performance ≥ 80).
- [ ] **K2. Largest list query takes ≤ 500ms** server-side (Postgres EXPLAIN ANALYZE).
- [ ] **K3. Bundle size budget** — new code adds ≤ 10kb gzipped per route (check with `pnpm build` output).
- [ ] **K4. Images optimized** — Next.js `<Image>` for raster, SVG for icons, no PNG logos.
- [ ] **K5. Database queries indexed.** Add an index for every WHERE clause column we filter on regularly.

---

## How to add a new section

If you find a recurring quality miss not covered above, add a new section. Each item must be:

- **Concrete** — checkable in 30 seconds.
- **Universal** — applies to every feature of that type, not just one.
- **Verifiable by anyone** — not "looks good" but "matches WCAG 2.2 AA."

---

## Sister documents

- `MEMORY.md` (project memory) — what we've learned + what we've broken
- `project_race_fix_pattern.md` — the race-condition fix template (Section F)
- `project_per_occupancy_scope.md` — the authorization pattern (Section E)
- `docs/DESIGN-SYSTEM.md` — visual + interaction spec
- `docs/tech/SECURITY-RULEBOOK.md` — security rules (overlap with Section E)
- `docs/tech/ENTERPRISE-PRINCIPLES.md` — coding patterns

When this file disagrees with a sister document, the stricter rule wins. If both apply, both apply.

---

_Last updated: 2026-05-23_
_Born from: 30 seconds of real user testing surfacing 5+ Section-A misses in the property-creation form._
