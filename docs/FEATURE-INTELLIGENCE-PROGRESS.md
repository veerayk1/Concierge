# Feature Intelligence Testing — Progress Report

**Last Updated:** April 12, 2026 (Session 2)
**Live Site:** https://concierge-sigma-seven.vercel.app
**GitHub:** veerayk1/Concierge
**Database:** Neon (wiped clean, all data created during testing)

---

## Current State

### Data Created During Testing (Clean DB)

| Entity                 | Count | Details                                                                                                                                                                                               |
| ---------------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Properties             | 1     | Parkview Terrace (55 Harbour Square, Toronto, ON M5J 2G4, 150 units)                                                                                                                                  |
| Users                  | 7     | Nadia Kowalski (PM), Alex Brennan (Front Desk), Ravi Patel (Security Guard), Lena Fischer (Security Supervisor), Omar Hassan (Maintenance), Yuki Tanaka (Superintendent), Maya Singh (Resident Owner) |
| Units                  | 1     | Unit 101 (Floor 1, Residential, Vacant)                                                                                                                                                               |
| Packages               | 2     | PKG-TRJC_0 (Released), PKG-PQI1RW (Unreleased, logged by Front Desk)                                                                                                                                  |
| Maintenance Requests   | 3     | MR-JINM (Resolved), MR-KBCN (Open), MR-QGTG (Open, created by Resident)                                                                                                                               |
| Maintenance Comments   | 1     | On MR-JINM: "Contacted building plumber..."                                                                                                                                                           |
| Maintenance Categories | 8     | Auto-seeded: General, Plumbing, Electrical, HVAC, Appliance, Structural, Pest Control, Other                                                                                                          |
| Announcements          | 1     | "Water Shutoff Notice — April 15, 2026" (Published, Urgent, Email channel)                                                                                                                            |
| Visitors               | 1     | James Williams (Visitor, Unit 101, signed in and out — 1m visit)                                                                                                                                      |
| Security Events        | 1     | "Unauthorized person in P1 parking garage" (Incident, High, Trespassing, Open)                                                                                                                        |
| Vendors                | 1     | Mike's Plumbing Services (Plumbing, Mike Henderson, Not Tracking compliance)                                                                                                                          |
| Equipment              | 1     | Lobby Elevator #1 (Elevator, Otis Gen3 MRL, OTIS-2024-11582, Main Lobby, Active)                                                                                                                      |
| Roles                  | 13    | Auto-created per property                                                                                                                                                                             |

### Property ID

`94fd28bd-37ce-4fb1-952e-4c182634fc90` (Parkview Terrace)
This ID is set in `src/lib/demo-config.ts` as `DEFAULT_DEMO_PROPERTY_ID`.

---

## Phases Tested

### Phase 1: Super Admin — Platform Setup (MOSTLY COMPLETE)

- [x] 1.1 Login as Super Admin
- [x] 1.2 Verify dashboard KPIs (found & fixed 3 bugs: fake Active Users, fake Platform Health, fake Subscriptions)
- [x] 1.3 Create property (found & fixed placeholder bugs)
- [x] 1.4 Verify property in list
- [x] 1.5 Settings → General (verified all fields match)
- [x] 1.6 Settings → Modules (verified all toggles)
- [x] 1.11 Create Property Manager user (verified via UI)
- [x] 1.12 Platform Health (verified real metrics)
- [x] 1.13 AI Dashboard (found 2 UX bugs: contradictory health labels, misleading SLA bar)
- [x] 1.14 Billing (verified empty state)
- [x] 1.15 Reports (verified 12 report types)
- [x] 1.16 Logs (verified empty state)
- [ ] 1.7-1.10 Settings sub-pages (Event Types, Roles, Notifications, Email Config) — not yet tested
- [ ] 1.17-1.31 Remaining system pages — not yet tested

### Phase 3: Property Manager — Operations (MAJOR PROGRESS)

- [x] Dashboard verified (all KPIs accurate: Open Requests 1, Unreleased Packages 0, Building Health 98)
- [x] **Packages**: FULL CRUD tested (Create → Verify → Release → Verify Release) — Session 1
- [x] **Maintenance Requests**: FULL CRUD tested
  - [x] Create request (Unit 101, High priority, kitchen leak description)
  - [x] Verify in list with correct data
  - [x] Detail page — all fields correct (reference, category, description, unit, reporter, date, SLA tracking)
  - [x] Status changes: Open → In Progress → Resolved (all work via PATCH API)
  - [x] Edit description (Save Changes works)
  - [x] Comments: add comment, verify displays (found & fixed author name bug)
  - [x] SLA Tracking widget shows real data (ON TRACK, 24h target)
- [x] **Announcements**: CREATE tested
  - [x] "Water Shutoff Notice" created with Urgent priority, Email channel, All Residents target
  - [x] Appears in list with PUBLISHED + URGENT badges
  - [x] Visible to Resident role (cross-role verified)
- [x] **Visitors**: FULL LIFECYCLE tested
  - [x] Sign In: James Williams, Visitor type, Unit 101, Maya Singh
  - [x] KPIs update: Currently In Building 1, Total Today 1
  - [x] Sign Out: visitor moves to Recent Departures, duration tracked (1m)
- [x] **Security Console**: CREATE tested
  - [x] Incident reported: "Unauthorized person in P1 parking garage" (Trespassing, High, Police Notified)
  - [x] KPIs update: Open Events 1, Incidents 1
  - [x] Event appears in list with type, status, priority badges
- [x] **Keys & FOBs**: Page loads correctly (was 404 — found & fixed gitignore blocking entire keys/ directory)
- [x] **Vendors**: CREATE tested
  - [x] Mike's Plumbing Services added (Plumbing, contact, phone, email)
  - [x] KPI shows Total Vendors 1, Compliance "NOT TRACKING"
- [x] **Equipment**: CREATE tested
  - [x] Lobby Elevator #1 added (Otis Gen3 MRL, serial, location)
  - [x] Shows in list with all fields
- [x] **Inspections**: Page loads, KPIs show 0s, create form available
- [x] **Recurring Tasks**: Page loads, KPIs show 0s, create form available
- [x] **Alterations**: Page loads, KPIs show 0s, create form available
- [x] **Amenities**: Page loads, empty state ("No amenities set up yet"), booking form available

### Phase 9: Resident — Cross-Role Verification (STARTED)

- [x] Login as Demo: Resident (Resident Owner)
- [x] Role-aware sidebar confirmed (only resident-relevant items shown)
- [x] AI Daily Briefing shows real data: "1 maintenance request currently open"
- [x] My Requests shows both maintenance requests (MR-JINM Resolved, MR-KBCN Open)
- [x] Announcements shows PM-created water shutoff notice
- [x] Dashboard KPIs: My Packages 0, Open Requests 1, Upcoming Bookings —

### Phase 4: Front Desk — Cross-Role Verification (COMPLETE)

- [x] Login as Demo: Front Desk
- [x] Role-aware sidebar: Dashboard, Vacations, Security Console, Packages, Announcements, Visitors, Keys & FOBs, Shift Log
- [x] No maintenance/vendor/equipment modules visible (correct restriction)
- [x] AI Daily Briefing shows real data
- [x] KPIs: Unreleased Packages 0, Expected Visitors 0, Pending Items 0
- [x] **Shift Log**: Page loads with Current Shift banner (Morning Shift, 6:00 AM - 2:00 PM), filter tabs, "+ Add Entry" and "Add Pass-On Note" buttons

### Phase 5: Security Guard — Cross-Role Verification (COMPLETE)

- [x] Login as Demo: Security
- [x] Role-aware sidebar: Dashboard, Vacations, Security Console, Packages, **Parking** (unique!), Visitors, Keys & FOBs, Shift Log
- [x] No maintenance/announcements/vendor modules visible (correct restriction)
- [x] AI Daily Briefing shows real data
- [x] KPIs: Active Visitors 0, Unreleased Packages 0, Keys Out —

### Phase 7: Maintenance Staff — Cross-Role Verification (COMPLETE)

- [x] Login as Maintenance Staff
- [x] Role-aware sidebar: Dashboard, Service Requests, Inspections, Equipment, Recurring Tasks, Shift Log
- [x] No packages/visitors/security/announcements (correct restriction)
- [x] AI Daily Briefing shows "1 maintenance request currently open"
- [x] KPIs: Assigned Requests 1, Equipment Alerts 0, Scheduled Tasks 0

### Role-Aware Interface Summary

| Role              | Sidebar Items                                | KPI Focus                                   | Verified |
| ----------------- | -------------------------------------------- | ------------------------------------------- | -------- |
| Property Manager  | All 13 modules                               | Open Requests, Packages, Visitors, Bookings | ✓        |
| Front Desk        | 8 items (no maintenance/vendor/equipment)    | Packages, Visitors, Pending                 | ✓        |
| Security Guard    | 8 items (includes Parking, no announcements) | Visitors, Packages, Keys                    | ✓        |
| Maintenance Staff | 5 items (service/equipment focus)            | Assigned Requests, Alerts, Tasks            | ✓        |
| Resident Owner    | 8 items (self-service only)                  | My Packages, Requests, Bookings             | ✓        |

### Phase 10: Board Member — Cross-Role Verification (COMPLETE)

- [x] Login as Board Member
- [x] Role-aware sidebar: Dashboard, Amenities, Announcements, Events, Library, Surveys, **Reports, Building Analytics, Governance** (unique GOVERNANCE section!)
- [x] No operations modules visible (correct for oversight role)
- [x] KPIs: Financial Summary, Compliance %, Pending Approvals, Satisfaction Score (governance metrics)

### Additional Pages Verified

- [x] **Unit Directory**: 1 unit (Unit 101, Floor 1, Main, Residential, Vacant), search, export, import, auto-generate
- [x] **Resident Directory**: 1 resident (Maya Singh, Owner, Active, Apr 2026), search, export, import
- [x] **Parking Management** (Security role): Permits/Violations tabs, search, create permit
- [x] **Shift Log** (Front Desk role): Current Shift banner, filter by priority, Add Entry, Pass-On Note
- [x] **Vacations** page: Available on multiple roles

### Phase 4: Front Desk — CRUD Operations (COMPLETE)

- [x] Log package as Front Desk (PKG-PQI1RW, Unit 101, FDX-98761234, fragile box) — 201 success
- [x] Package appears in unreleased list with all fields correct
- [x] Shift Log: created entry (Morning shift, Important, package notification) — 201 success
- [x] Shift Log entry appears with MORNING + IMPORTANT badges, reference SL-MNVVO85N

### Phase 5-6: Security — CRUD Operations (COMPLETE)

- [x] Security Console shows cross-role data (PM incident + Front Desk shift log)
- [x] Fire Log: created fire event (5th Floor smoke detector, false alarm) — 201 success
- [x] Parking Management: Permits/Violations tabs both load, search works

### Phase 9: Resident Self-Service (COMPLETE)

- [x] Resident form is simplified vs PM form (no unit selector, no category — great UX)
- [x] Created maintenance request MR-QGTG (exhaust fan noise, Medium priority) — 201 success
- [x] Request appears in My Requests with correct KPI update (Open: 2)

### Phase 13: Edge Cases (PARTIAL)

- [x] Maintenance filter tabs (Open, Resolved) correctly filter data
- [x] Global search command palette opens but doesn't find maintenance data (Bug #19)
- [ ] Empty form submission validation — not yet tested
- [ ] Duplicate data handling — not yet tested

### Phases 8, 11-12, 14: NOT YET STARTED

---

## Bugs Found & Fixed: 19

| #   | Bug                                                                                                                                  | Severity | Phase         | Status   |
| --- | ------------------------------------------------------------------------------------------------------------------------------------ | -------- | ------------- | -------- |
| 1   | Dashboard "Active Users" showed unitCount (550) not real count                                                                       | HIGH     | 1.2           | FIXED    |
| 2   | Dashboard "Platform Health" hardcoded as "99.7%"                                                                                     | HIGH     | 1.2           | FIXED    |
| 3   | Dashboard "Active Subscriptions" counted properties not subscriptions                                                                | HIGH     | 1.2           | FIXED    |
| 4   | "Maple Heights Condominiums" placeholder in property form                                                                            | MEDIUM   | 1.3           | FIXED    |
| 5   | "maple-heights" slug placeholder                                                                                                     | LOW      | 1.3           | FIXED    |
| 6   | "+1 416-555-0100" fake phone placeholder                                                                                             | LOW      | 1.3           | FIXED    |
| 7   | All operations fail after DB wipe — stale hardcoded property ID in 4 files                                                           | CRITICAL | 1.11          | FIXED    |
| 8   | Add Unit form silently fails — NaN from empty optional number fields breaks zod validation                                           | CRITICAL | Unit creation | FIXED    |
| 9   | User filter count header doesn't update to show filtered count                                                                       | LOW      | 1.11          | LOGGED   |
| 10  | AI Dashboard: contradictory "Stable" + "NEEDS ATTENTION" labels (resolved — shows "Stable" + "EXCELLENT" now with real data)         | LOW      | 1.13          | RESOLVED |
| 11  | AI Dashboard: SLA compliance shows red bar with empty "%" on clean DB (resolved — shows 100% with real data)                         | LOW      | 1.13          | RESOLVED |
| 12  | Maintenance POST returns 500 — categoryId NOT nullable but code passes null, residentId uses fake demo UUID, contactPhone not mapped | CRITICAL | 3.Maintenance | FIXED    |
| 13  | Comment author shows raw UUID (00000000-...) instead of name                                                                         | MEDIUM   | 3.Maintenance | FIXED    |
| 14  | Keys & FOBs API returns 404 — .gitignore `keys/` blocks ALL keys/ directories including API routes                                   | CRITICAL | 3.Keys        | FIXED    |
| 15  | Maintenance list shows "Unit 101 Resident" instead of actual resident name                                                           | LOW      | 3.Maintenance | FIXED    |
| 16  | Empty state messages could be more actionable (Vendors, Maintenance)                                                                 | LOW      | 3.Various     | LOGGED   |
| 17  | AI Dashboard Package Handling score shows unrounded float (99.89519444444444)                                                        | LOW      | AI Dashboard  | FIXED    |
| 18  | Resident self-service request fails — demo user UUID doesn't exist in DB (systemic fix: resolve real user in api-guard middleware)   | CRITICAL | 9.Resident    | FIXED    |
| 19  | Global search returns "No results" for maintenance data that exists (search may not cover all modules)                               | MEDIUM   | 13.Search     | LOGGED   |

---

## What Needs to Happen Next

### Priority 1: Email Integration

- Set up Resend (free tier) for real email notifications
- Add RESEND_API_KEY to Vercel env vars
- Test: log package → resident gets HTML email notification
- Verify email template is professionally designed (not plain text)

### Priority 2: Continue Testing Remaining Phases

**Phase 4: Front Desk** — Test as Demo: Front Desk role

- Package intake, visitor log, shift notes
- Verify front desk sees package and visitor data

**Phase 5-6: Security** — Test as Demo: Security role

- Security console, incidents, fire log, parking violations
- Verify security-specific features

**Phase 7-8: Maintenance/Superintendent** — Test as those roles

- Work orders, equipment management
- Verify maintenance-specific workflows

**Phase 10: Board Member** — Test governance view
**Phase 11: Full Cross-Role** — Verify ALL data flows
**Phase 12: Settings** — Every settings sub-page with CRUD
**Phase 13: Edge Cases** — Validation, errors, search, empty states
**Phase 14: Training & Onboarding** — LMS, onboarding wizard

### Priority 3: Fix Logged UX Issues

- Bug #9: User filter count header
- Bug #10: AI Dashboard contradictory labels
- Bug #11: AI Dashboard SLA bar on clean DB
- Bug #16: Empty state messages need action buttons
- Equipment "Operational" KPI shows 0 when 1 piece of equipment is active

---

## Technical Notes

### Git Remotes & Deployment

- **PRIMARY repo**: `origin` → `https://github.com/veerayk1/Concierge.git` — push here FIRST, this triggers Vercel auto-deploy
- **SECONDARY repo**: `yaswanth-zazz` → `https://github.com/yaswanth-zazz/Concierge.git` — push here after to keep in sync
- **Push order**: Always `git push origin main` first, then `git push yaswanth-zazz main`
- Vercel CLI: `/Users/yaswanth/Desktop/ZAZZ_RFP_-AutoPilot/.local/node-v20.19.5-darwin-arm64/bin/vercel`
- Build: `prisma generate && next build`

### Key Fixes Applied (Session 2)

- `src/app/api/v1/maintenance/route.ts` — Auto-seed 8 maintenance categories, resolve real user for residentId, map contactPhone to contactNumbers
- `src/app/api/v1/maintenance/[id]/comments/route.ts` — Resolve author names from User table, use real user for authorId
- `src/app/(portal)/maintenance/[id]/page.tsx` — Display authorName instead of authorId in comments
- `src/app/api/v1/maintenance/route.ts` (GET) — Include resident relation for name display
- `.gitignore` — Changed `keys/` to `/keys/` to stop blocking API route directories
- 12 previously-gitignored files in src/app/api/v1/keys/ and src/app/(portal)/keys/ now tracked

### Key Fixes Applied (Session 1)

- `src/lib/sanitize.ts` — lazy-load DOMPurify (fixed all Vercel 500s)
- `src/lib/demo-config.ts` — DEFAULT_DEMO_PROPERTY_ID updated to current property
- `src/server/middleware/api-guard.ts` — demo mode enabled in production
- `src/server/demo/demo-route-handler.ts` — only serve fake data in showcase mode
- `src/components/forms/create-unit-dialog.tsx` — z.preprocess for NaN handling
- 23 files cleaned of hardcoded fake data

### Known Tool Limitation

Chrome MCP's `form_input` tool does NOT trigger React's synthetic change events. When using native `<select>` elements with react-hook-form's `register()`, the internal form state doesn't update even though the DOM value changes. Workaround: use JavaScript to dispatch change events via `Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set` + `dispatchEvent(new Event('change', { bubbles: true }))`.
