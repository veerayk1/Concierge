# Feature Intelligence Testing — Methodology & Rules

**CRITICAL: Read this ENTIRE document before testing. These rules are non-negotiable. If you violate any rule, you are doing the testing WRONG.**

---

## The Standard

This is **REAL product testing**. You are testing as if this product is launching tomorrow and paying customers will use it. Every click, every form, every number, every email, every label — everything must work perfectly and make sense to a non-technical user.

---

## Rule 1: ALL Testing Must Be Through the Browser UI — NOT the API

- **NEVER** test by calling API endpoints with curl or fetch. That is API testing, not UI testing.
- **ALWAYS** test by clicking buttons, filling forms, and interacting with the Chrome browser.
- The only acceptable use of API is to verify backend state AFTER a UI action (e.g., checking if the database received the right data).
- If a form is broken and you can't submit it through the UI → that's a BUG. Fix the form. Don't bypass it with an API call.
- Creating test data via API is acceptable ONLY when the UI form for that specific feature has already been thoroughly tested and proven to work. Even then, prefer UI.

---

## Rule 2: Every Number on Every Screen — Trace It to Its Source

- For EVERY number you see on any screen, you must ask: **"Where did this come from?"**
- If it came from data you created → verify the count is correct
- If it came from a calculation → verify the calculation is right
- If you can't explain it → it's either fake data or a bug. Investigate and fix.
- **Examples:**
  - You created 7 users. The dashboard says "550 Active Users." That's a BUG.
  - You created 1 property. The KPI says "2 Active Subscriptions." WHERE did subscription 2 come from? That's a BUG.
  - Maintenance SLA shows "88%" with a green bar. You have ZERO maintenance requests. That number is FAKE.
  - Building Health shows "87 GOOD." You haven't logged any operations. That score is HARDCODED.

---

## Rule 3: You Cannot Pass an Empty Page — You Must Create Data and Test the Full Lifecycle

- Seeing "No packages found" and saying "PASS" is **WRONG**
- You MUST:
  1. **CREATE** — open the dialog, fill every field, submit through the UI
  2. **VERIFY CREATION** — does it appear in the list? Do all fields match what you typed?
  3. **VERIFY COUNTS** — did the KPI cards update? (e.g., "Unreleased Packages" went from 0 to 1?)
  4. **CLICK INTO DETAIL** — click the item to open the detail page. Are all fields correct?
  5. **EDIT** — if the page supports editing, change something and verify it saved
  6. **STATUS CHANGE** — if the item has a workflow (Open → In Progress → Resolved), test each transition
  7. **DELETE** — if deletion is supported, delete it and verify it's gone and counts update

---

## Rule 4: Before Creating Data, Verify Prerequisites Exist

- Before logging a package to Unit 101, **verify Unit 101 actually exists** in the system
- Before assigning a maintenance request to a staff member, **verify that staff member exists**
- Before booking an amenity, **verify the amenity was created first**
- If a prerequisite doesn't exist → CREATE IT FIRST through the UI
- This ensures the data relationships are real, not broken foreign key references

---

## Rule 5: Test Email & Notifications — They Must Actually Send

- **Set up Resend (free email service) BEFORE testing any module with notifications**
- Add `RESEND_API_KEY` to Vercel environment variables
- For every action that SHOULD trigger a notification:
  - **Package logged** → resident of that unit should receive an HTML email saying "You have a package"
  - **Maintenance request created** → assigned staff should get an email
  - **Announcement published** → all residents should get notification
  - **Visitor checked in** → resident should get notification
- **Check the actual email:**
  - Is it HTML or plain text? (Must be HTML)
  - Does it look professional? (Clean design, property name, action buttons)
  - Does it have the right data? (Package ref #, unit number, courier name)
  - Is the sender address correct? (Not "noreply@localhost")
- If emails aren't sending → that's a BUG. Fix it.
- If emails look ugly → that's a UX issue. Fix it.

---

## Rule 6: Test From the User's Perspective — Does It Make Sense?

For every screen, put yourself in the shoes of a first-time user and ask:

- **Is the label clear?** Would a front desk person who's never used software understand "Unreleased Packages"?
- **Is the flow logical?** Can I figure out what to do next without reading a manual?
- **Are there dead ends?** If I click something and nothing happens, that's a BUG.
- **Are error messages helpful?** "Failed to fetch (500)" tells the user NOTHING. It should say "Unable to load packages. Please try again."
- **Are empty states actionable?** "No packages found" should have a "Log Package" button, not just text.
- **Is the form too long?** If a form has 20 fields and only 2 are required, the optional fields should be in a collapsible section.
- **Does the placeholder text help?** "e.g. Brown box, 30×20cm" is helpful. "EXAMPLE_NAME" is not.
- **Is the process efficient?** If it takes 8 clicks to log a package, can it be done in 4?

If something feels awkward, confusing, or inefficient → LOG IT as a UX issue and fix it.

---

## Rule 7: Test Cross-Role Data Flow — Data Must Flow Between Roles

After creating data as one role, **switch roles** and verify:

- **Front Desk logs a package** → switch to Resident → My Packages should show it
- **Resident submits maintenance request** → switch to Property Manager → Service Requests should show it
- **Security Guard reports incident** → switch to Security Supervisor → should see it for review
- **Property Manager publishes announcement** → switch to Resident → Announcements page should show it
- **Supervisor checks out a key** → switch to any role that can see keys → audit trail should show it

If data doesn't flow between roles → the feature is BROKEN even if each role's page works individually.

---

## Rule 8: Test Every Filter, Search, and Tab

- If a page has filter tabs (All, Open, Assigned, In Progress) → click EACH tab and verify it shows the right subset
- If a page has a search bar → type something that should match → verify it finds it → type something that shouldn't match → verify it shows "No results"
- If a page has sort columns → click a column header → verify sorting works
- If a page has pagination → create enough data to trigger page 2 → verify pagination works

---

## Rule 9: Test Edge Cases and Error Handling

- **Submit an empty required form** → verify validation error messages appear on the right fields
- **Submit with invalid data** (email without @, phone with letters) → verify validation catches it
- **Submit the same data twice** (duplicate unit number, duplicate email) → verify it shows "already exists" error
- **Enter extremely long text** (500 characters in a name field) → verify it doesn't break the layout
- **Refresh the page** after creating data → verify data persists (not just client-side state)
- **Use browser back/forward buttons** → verify the app doesn't break
- **Try accessing a page you don't have permission for** → verify it shows 403, not a crash

---

## Rule 10: Fix Bugs Immediately — Don't Accumulate Them

- When you find a bug:
  1. STOP testing
  2. Investigate the root cause in the code
  3. Fix it
  4. Commit with a clear message explaining what was wrong and why
  5. Push to GitHub and deploy to Vercel
  6. Wait for deploy to complete
  7. VERIFY the fix works by re-testing the exact scenario
  8. THEN continue testing
- Never say "I'll fix it later" — fix it NOW
- Log every bug with: severity, what you saw, what you expected, root cause, fix applied

---

## Rule 11: No Shortcuts, No Skipping, No Assumptions

- Do NOT skip a module because "it's similar to another one"
- Do NOT assume a feature works because the code looks right — TEST IT
- Do NOT use demo mode shortcuts if real auth testing is needed
- Do NOT mark a Feature Intelligence checklist step as complete unless you ACTUALLY performed that exact action
- Do NOT say "PASS" without verifiable evidence (screenshot or verified data)
- Do NOT stop testing until all 14 phases are complete or the session literally runs out of context

---

## Rule 12: Document Everything in Real-Time

- After each module test, update `docs/FEATURE-INTELLIGENCE-PROGRESS.md`
- Log every bug found (even minor UX issues)
- Record what data you created so the next session knows what exists
- Screenshot critical state changes
- At the end of each session, write a clear handoff note for the next session

---

## Testing Execution Order

1. **Set up Resend email service** — without this, notification testing is impossible
2. **Phase 1: Super Admin** — finish remaining settings pages with CRUD
3. **Phase 3: Property Manager** — full CRUD on EVERY module (packages ✅ done, maintenance next)
4. **Phase 4: Front Desk** — packages, visitors, shift log — CREATE data, verify cross-role
5. **Phase 5-6: Security** — incidents, fire log, parking violations, key management — full CRUD
6. **Phase 7-8: Maintenance & Superintendent** — work orders, equipment, parts — full CRUD
7. **Phase 9: Resident** — self-service (packages, requests, bookings, community) — full CRUD
8. **Phase 10: Board Member** — governance, reports
9. **Phase 11: Cross-Role** — verify ALL data flows between roles
10. **Phase 12: Settings** — every settings sub-page with real configuration
11. **Phase 13: Edge Cases** — validation, errors, search, empty states
12. **Phase 14: Training & Onboarding** — LMS, onboarding wizard

---

## What "Done" Looks Like

Testing is COMPLETE when ALL of these are true:

- [ ] Every module has been tested with real CRUD operations through the UI
- [ ] Every form has been submitted with real data and the result verified
- [ ] Every notification trigger has been tested and emails verified
- [ ] Every role has been logged into and tested
- [ ] Cross-role data flow is verified (data created by one role visible to another)
- [ ] No fake/hardcoded data exists anywhere outside Demo Account
- [ ] Every edge case (empty form, duplicate data, invalid input) has been tested
- [ ] Every bug found has been fixed and verified
- [ ] The Feature Intelligence page on /system/features shows meaningful completion
- [ ] The founder can click through the app and every single thing makes sense
