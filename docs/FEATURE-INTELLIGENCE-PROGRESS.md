# Feature Intelligence Testing — Progress Report

**Last Updated:** April 12, 2026
**Live Site:** https://concierge-sigma-seven.vercel.app
**GitHub:** veerayk1/Concierge
**Database:** Neon (wiped clean, all data created during testing)

---

## Current State

### Data Created During Testing (Clean DB)

| Entity     | Count | Details                                                                                                                                                                                               |
| ---------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Properties | 1     | Parkview Terrace (55 Harbour Square, Toronto, ON M5J 2G4, 150 units)                                                                                                                                  |
| Users      | 7     | Nadia Kowalski (PM), Alex Brennan (Front Desk), Ravi Patel (Security Guard), Lena Fischer (Security Supervisor), Omar Hassan (Maintenance), Yuki Tanaka (Superintendent), Maya Singh (Resident Owner) |
| Units      | 1     | Unit 101 (Floor 1, Residential, Vacant)                                                                                                                                                               |
| Packages   | 1     | PKG-TRJC_0 (Unit 101, AMZ-98765432, Released to Maya Singh)                                                                                                                                           |
| Roles      | 13    | Auto-created per property                                                                                                                                                                             |

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

### Phase 3: Property Manager — Operations (IN PROGRESS)

- [x] Dashboard verified (all KPIs 0, no fake data)
- [x] Packages: FULL CRUD tested (Create → Verify → Release → Verify Release)
- [ ] Maintenance: Dialog opened, about to create request
- [ ] Announcements: Not tested
- [ ] Visitors: Not tested
- [ ] Security Console: Not tested
- [ ] Keys & FOBs: Not tested
- [ ] Vendors: Not tested
- [ ] Equipment: Not tested
- [ ] Inspections: Not tested
- [ ] Recurring Tasks: Not tested
- [ ] Alterations: Not tested
- [ ] Reports: Not tested

### Phases 4-14: NOT STARTED

---

## Bugs Found & Fixed: 11

| #   | Bug                                                                                        | Severity | Phase         | Status |
| --- | ------------------------------------------------------------------------------------------ | -------- | ------------- | ------ |
| 1   | Dashboard "Active Users" showed unitCount (550) not real count                             | HIGH     | 1.2           | FIXED  |
| 2   | Dashboard "Platform Health" hardcoded as "99.7%"                                           | HIGH     | 1.2           | FIXED  |
| 3   | Dashboard "Active Subscriptions" counted properties not subscriptions                      | HIGH     | 1.2           | FIXED  |
| 4   | "Maple Heights Condominiums" placeholder in property form                                  | MEDIUM   | 1.3           | FIXED  |
| 5   | "maple-heights" slug placeholder                                                           | LOW      | 1.3           | FIXED  |
| 6   | "+1 416-555-0100" fake phone placeholder                                                   | LOW      | 1.3           | FIXED  |
| 7   | All operations fail after DB wipe — stale hardcoded property ID in 4 files                 | CRITICAL | 1.11          | FIXED  |
| 8   | Add Unit form silently fails — NaN from empty optional number fields breaks zod validation | CRITICAL | Unit creation | FIXED  |
| 9   | User filter count header doesn't update to show filtered count                             | LOW      | 1.11          | LOGGED |
| 10  | AI Dashboard: contradictory "Stable" + "NEEDS ATTENTION" labels                            | LOW      | 1.13          | LOGGED |
| 11  | AI Dashboard: SLA compliance shows red bar with empty "%" on clean DB                      | LOW      | 1.13          | LOGGED |

---

## What Needs to Happen Next

### Priority 1: Email Integration

- Set up Resend (free tier) for real email notifications
- Add RESEND_API_KEY to Vercel env vars
- Test: log package → resident gets HTML email notification
- Verify email template is professionally designed (not plain text)

### Priority 2: Continue CRUD Testing Per Module

For EACH module, test the full lifecycle:

1. CREATE through UI (fill form, submit, verify)
2. VERIFY data appears correctly in list
3. CLICK INTO detail page (verify all fields)
4. EDIT (if supported)
5. DELETE or status change (if supported)
6. CHECK notifications/emails fire

Modules remaining:

- Maintenance Requests (was about to test)
- Announcements
- Visitors
- Security Console (incidents, fire log, noise complaints)
- Keys & FOBs
- Vendors
- Equipment
- Inspections
- Recurring Tasks
- Alterations
- Amenities/Bookings

### Priority 3: Cross-Role Testing

- Log in as each role and verify:
  - Correct dashboard
  - Correct sidebar
  - Data created by other roles visible where expected
  - Data NOT visible where restricted

### Priority 4: UX Evaluation

- Does the flow make sense for each role?
- Are there confusing labels, missing buttons, dead ends?
- Are empty states helpful?
- Do placeholders make sense?

---

## Technical Notes

### Deployment

- Vercel CLI: `/Users/yaswanth/Desktop/ZAZZ_RFP_-AutoPilot/.local/node-v20.19.5-darwin-arm64/bin/vercel`
- Deploy command: `vercel --prod --yes`
- Build: `prisma generate && next build`
- GitHub remote: `veerayk1` (push to this, not `origin`)

### Key Fixes Applied

- `src/lib/sanitize.ts` — lazy-load DOMPurify (fixed all Vercel 500s)
- `src/lib/demo-config.ts` — DEFAULT_DEMO_PROPERTY_ID updated to current property
- `src/server/middleware/api-guard.ts` — demo mode enabled in production
- `src/server/demo/demo-route-handler.ts` — only serve fake data in showcase mode
- `src/components/forms/create-unit-dialog.tsx` — z.preprocess for NaN handling
- 23 files cleaned of hardcoded fake data
