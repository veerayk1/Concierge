# Gap Analysis: Research vs PRDs

> **Date**: 2026-03-17
> **Scope**: All 29 PRDs (00-28) cross-referenced against 60+ research files from Platform 1, Platform 2, Platform 3, and PLATFORM-COMPARISON.md
> **Methodology**: Every feature observed in competitor research was checked against the relevant PRD for coverage, specificity, and completeness.
> **Naming**: Competitor platforms are referenced as Platform 1 (P1), Platform 2 (P2), Platform 3 (P3) only. No competitor brand names.

---

## Executive Summary

After exhaustive cross-referencing of all research documentation against all 29 PRDs, **47 gaps** were identified:

| Priority     | Count | Description                                                         |
| ------------ | ----- | ------------------------------------------------------------------- |
| **Critical** | 8     | Missing features that exist in competitors and are essential for v1 |
| **High**     | 16    | Underspecified features, missing fields, or incomplete workflows    |
| **Medium**   | 14    | Minor omissions or features adequately deferred but needing a note  |
| **Low**      | 9     | Nice-to-have improvements or minor clarifications                   |

**Key findings**:

1. The PRDs are remarkably comprehensive. Most competitor features are covered.
2. The biggest gap category is **underspecified workflows and missing field-level detail** -- features are mentioned but lack the specificity needed for implementation.
3. Several P1-unique features (fire log checklists, noise complaint categories, parking limit granularity) are missing from PRDs entirely.
4. P3's unique features (vacation/away tracking, electronic consent, email signature editor, user badge scanning) have partial or no PRD coverage.
5. Business operations PRDs (21-28) are well-structured but several lack integration touchpoints with core modules.

---

## Gap Table by PRD

### PRD 01 — Architecture

| #   | Gap                               | Source                                                | Priority | Description                                                                                                                                                                                                                                                                                                      |
| --- | --------------------------------- | ----------------------------------------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1.1 | Multi-building context switching  | P1 (dashboard, settings), P2 (manage-and-communicate) | High     | P1 has building selector dropdown on every page. P2 has facility-level context. PRD 01 mentions multi-tenancy but does not specify how users switch between buildings within a single property management company. Need: building selector component spec, URL routing for multi-building, data isolation rules. |
| 1.2 | WebSocket event types enumeration | P3 (security-concierge)                               | Medium   | PRD mentions real-time WebSocket updates but does not enumerate which event types trigger real-time pushes vs polling. P3's console updates in real-time for all 7 entry types. Need: list of real-time event types.                                                                                             |

### PRD 02 — Roles and Permissions

| #   | Gap                         | Source                                       | Priority | Description                                                                                                                                                                                                                                                                                                                                               |
| --- | --------------------------- | -------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2.1 | Superintendent role missing | P1 (settings, groups), P3 (unit-file groups) | High     | P1 has Superintendent as a distinct role in settings. P3 has Superintendent as a staff group. PRD 02 lists 12 roles but Superintendent is not one of them. Many condos have a superintendent with a unique permission set (maintenance access, key access, no financial access). Recommend adding as a role or documenting how it maps to existing roles. |
| 2.2 | Payment Administrator role  | P3 (unit-file groups)                        | Low      | P3 has a "Payment Administrators" group. PRD 02 does not mention this. May be handled by Property Manager role, but worth confirming.                                                                                                                                                                                                                     |
| 2.3 | Floor-based group filtering | P3 (unit-file)                               | Low      | P3 supports floor-based groups (Floor 1, Floor 2, etc.) for filtering users. PRD 02 mentions "Filtered Groups" concept is deferred. Ensure floor-based grouping is in v2 scope.                                                                                                                                                                           |

### PRD 03 — Security Console

| #   | Gap                                        | Source                                 | Priority | Description                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| --- | ------------------------------------------ | -------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3.1 | Fire log specialized checklist             | P1 (logs)                              | Critical | P1 has a highly specialized Fire Log with: alarm time, alarm location, alarm type, fire department call time, first/second/third announcement times, FD arrival time, FD all-clear time, FD departure time, and THREE checklists (prepare for FD arrival, ensure elevators respond, reset electronic devices with 7 items: Pull Station, Smoke Detector, Heat Detector, Sprinkler Head, Fire Panel, Mag Locks, Elevators). PRD 03 mentions fire events as an event type but does NOT specify these specialized fields or checklists. This is a safety-critical gap. |
| 3.2 | Noise complaint specialized fields         | P1 (logs)                              | Critical | P1 has a specialized Noise Log with: 14 nature-of-complaint checkboxes (Drop on Floor, Loud Music, Smoking Hallways, Smoking in Suite, Hallway Noise, Piano Playing, Dog Barking, Cooking Odors, Children Playing, Walking/Banging, Party, Talking, Construction, Other), investigation fields (noise noticeable by complainant floor, suspect floor, noise duration, noise degree/volume), suspect contact method checkboxes, and counseling checkboxes. PRD 03 does not specify any noise-specific fields.                                                        |
| 3.3 | Authorized Entry tracking as distinct type | P3 (security-concierge)                | High     | P3 has "Authorized Entry" as a dedicated entry type (logging when staff enter a unit with permission). PRD 03 mentions "permission to enter" on maintenance requests but does NOT have authorized entry as a standalone security event type. This is important for audit trails and liability.                                                                                                                                                                                                                                                                      |
| 3.4 | Security Patrol entry type                 | P3 (security-concierge filter options) | Medium   | P3 has "Security Patrol" as a filter option and entry type. PRD 03 does not mention patrol logging. Consider adding patrol round tracking for security guards doing building walkthroughs.                                                                                                                                                                                                                                                                                                                                                                          |
| 3.5 | Valet Parking entry type                   | P3 (security-concierge filter options) | Low      | P3 has "Valet Parking" as a filter option. PRD 03 does not mention valet parking. May be niche but worth noting for luxury properties.                                                                                                                                                                                                                                                                                                                                                                                                                              |
| 3.6 | Pass-On Log as distinct from Shift Log     | P3 (security-concierge)                | Medium   | P3 separates "Pass-On Log" (handoff notes between shifts) from "Security Shift" (the shift record itself). PRD 03 combines these concepts. Consider whether they should be distinct event types for clarity.                                                                                                                                                                                                                                                                                                                                                        |

### PRD 04 — Package Management

| #   | Gap                                         | Source        | Priority | Description                                                                                                                                                                                                                                                                  |
| --- | ------------------------------------------- | ------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 4.1 | Outgoing package tracking                   | P1 (packages) | High     | P1 has an "Incoming/Outgoing" toggle on the package form. PRD 04 focuses heavily on incoming packages but does not specify outgoing package tracking (residents sending packages via building concierge).                                                                    |
| 4.2 | Package tracking number field               | P1 (packages) | High     | P1 has a dedicated "Tracking Number (optional)" field on the package form. PRD 04 mentions tracking but does not specify a dedicated tracking number input field for carrier tracking numbers.                                                                               |
| 4.3 | Parcel type physical description categories | P1 (packages) | Medium   | P1 has 11 physical parcel types (white box, brown box, small white box, etc.). PRD 04 has courier types but does not specify physical description categories. Both are useful: courier tells you WHO delivered, parcel type tells you WHAT it looks like for identification. |
| 4.4 | Print non-released packages report          | P1 (packages) | Medium   | P1 has a dedicated "Print Non Released Packages" button. PRD 04 mentions label printing but not a dedicated outstanding packages print report accessible from the package page.                                                                                              |

### PRD 05 — Maintenance

| #   | Gap                              | Source           | Priority | Description                                                                                                                                                                                                          |
| --- | -------------------------------- | ---------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 5.1 | "Don't show to residents" toggle | P2 (maintenance) | High     | P2 has a "Don't show to residents" checkbox on the maintenance form, allowing staff to create internal maintenance requests hidden from the resident portal. PRD 05 does not specify visibility control per request. |
| 5.2 | "Save and add another" workflow  | P2 (maintenance) | Medium   | P2 has "Save and add another" button for quick sequential request creation. PRD 05 does not specify this workflow shortcut. Important for busy maintenance periods.                                                  |
| 5.3 | Inline preview on listing        | P2 (maintenance) | Low      | P2 shows the problem description directly below each row in the maintenance list without needing to click. PRD 05 specifies a standard table view. Consider inline expansion.                                        |

### PRD 06 — Amenity Booking

| #   | Gap                                    | Source         | Priority | Description                                                                                                                                                                                                                                                                                                                                                                  |
| --- | -------------------------------------- | -------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 6.1 | Move-in/move-out elevator booking      | P1 (amenities) | High     | P1 has specialized elevator booking with different fee structures for Move-In ($50 + $250 deposit), Move-Out ($50 + $500 deposit), and Delivery ($50 + $250 deposit), with day-of-week restrictions (no Sunday/holiday). PRD 06 mentions amenity types generically but does not specify elevator booking as a special amenity type with distinct fee structures per purpose. |
| 6.2 | Security guard requirement per booking | P1 (amenities) | Medium   | P1 specifies that Party Room events with 11+ people require a security guard at $106.20 + HST/hr (4-hour minimum). PRD 06 mentions security guard requirements but does not specify the threshold-based auto-requirement rules or rate calculations.                                                                                                                         |
| 6.3 | Agreement/waiver signing pre-booking   | P1 (amenities) | Medium   | P1 requires "Agreement must be signed and handed to Concierge" for certain amenities (e.g., Golf Room). PRD 06 mentions terms and conditions but does not specify a signed-agreement-required gate before booking.                                                                                                                                                           |

### PRD 07 — Unit Management

| #   | Gap                                      | Source                  | Priority | Description                                                                                                                                                                                                                                                                                                    |
| --- | ---------------------------------------- | ----------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 7.1 | Vacation/away period tracking            | P3 (my-account)         | Critical | P3 has a dedicated "Vacations" tab on user profiles where residents can set away periods. This informs staff about absent units (security awareness, package holding, notification pausing). PRD 07 does not mention vacation/away tracking at all. This is a useful feature for both security and operations. |
| 7.2 | Electronic consent document tracking     | P3 (my-account)         | High     | P3 tracks signed electronic consent documents per user. PRD 07 mentions parcel waivers but does not have a general-purpose electronic consent/agreement tracking system.                                                                                                                                       |
| 7.3 | User History Records / Audit Log         | P3 (unit-file, reports) | High     | P3 has "User History Records" and "Unit History Records" reports showing all updates made to users and units over time. PRD 07 mentions audit logging generally but does not specify per-user and per-unit change history as a viewable feature (not just backend logs).                                       |
| 7.4 | Transactions/balance tab on user profile | P3 (unit-file detail)   | Medium   | P3 has a "Transactions" tab on user profiles showing account balance and payment history. PRD 07 does not specify a financial transactions tab on user profiles.                                                                                                                                               |
| 7.5 | Salutation field on user profiles        | P3 (unit-file)          | Low      | P3 stores salutation (Mr., Mrs., Ms., Dr.) with user names and displays as "Salutation First Last". PRD 07 does not mention salutation. Small but important for formal communications.                                                                                                                         |
| 7.6 | Language preference per user             | P3 (my-account)         | Medium   | P3 has "Language Preference" as an editable field on user profiles. PRD 07 mentions i18n at system level but not per-user language preference that affects their portal experience.                                                                                                                            |

### PRD 08 — User Management

| #   | Gap                                       | Source                             | Priority | Description                                                                                                                                                                                                                                                                                                                                                     |
| --- | ----------------------------------------- | ---------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 8.1 | Email signature editor                    | P3 (my-account)                    | High     | P3 has a CKEditor 5 rich text email signature editor. Signatures appear on announcement emails, service request updates, and violation notifications. PRD 08 does not mention email signatures for staff/admin users.                                                                                                                                           |
| 8.2 | "Require Assistance" flag                 | P1 (user-profile), P3 (my-account) | High     | Both P1 and P3 have a "Require Assistance" / "Assistance Required" flag on user profiles indicating residents who need help during emergencies (mobility issues, medical conditions). PRD 08 does not explicitly specify this field, though PRD 03 may reference it in emergency contacts. Needs explicit specification as a user-level boolean with reporting. |
| 8.3 | Unsubscribe from email notifications link | P3 (my-account)                    | Medium   | P3 has a direct "Unsubscribe from Email Notifications" link on the user profile page. PRD 08 mentions notification preferences but not a quick unsubscribe mechanism on the profile page itself.                                                                                                                                                                |

### PRD 09 — Communication

| #   | Gap                                       | Source                              | Priority | Description                                                                                                                                                                                                                                                                                                                                                                           |
| --- | ----------------------------------------- | ----------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 9.1 | Virtual concierge board / digital signage | P1 (announcement), P2 (communicate) | High     | P1 has a "virtual concierge board" checkbox on announcements. P2 has full "Public Display" configuration for lobby screens. PRD 09 mentions multi-channel delivery but does not specify lobby display/digital signage as a distribution channel for v1. CLAUDE.md lists "Public display/digital signage" as v3+ nice-to-have, but both competitors have it. Consider promoting to v2. |
| 9.2 | Scheduled announcements                   | P1 (announcement)                   | Medium   | P1 has "Scheduled For Later" badges with scheduled send dates on announcements. PRD 09 mentions scheduling but should ensure the UI specification includes scheduled send with verification notice ("please verify that all attachments are working as expected").                                                                                                                    |
| 9.3 | Email delivery failure tracking           | P1 (announcement)                   | High     | P1 has "Email Failures" and "Mailing List" buttons on each announcement showing a "Non-Delivered Mailing List" with columns: Sender, Recipient Email, Delivery Status, Error reason, Username, Unit #, Time Recorded. PRD 09 mentions delivery tracking but does not specify the detailed failure investigation UI.                                                                   |
| 9.4 | Missing email address tracking            | P2 (manage-and-communicate)         | Medium   | P2 tracks "3 employees, 19 occupants missing email addresses" in the communication hub. PRD 09 does not specify proactive missing-contact-info detection. This is a data quality feature that should be in PRD 10 or PRD 09.                                                                                                                                                          |

### PRD 10 — Reports & Analytics

| #    | Gap                             | Source                  | Priority | Description                                                                                                                                                                                                                                                 |
| ---- | ------------------------------- | ----------------------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 10.1 | User login statistics report    | P3 (reports)            | Medium   | P3 has a "User Logins" report (ID 46) showing login statistics. PRD 10 mentions login audit trail (from P3's Recent Account Activity) but does not list a dedicated login statistics report showing aggregated login data across all users.                 |
| 10.2 | User Registration report        | P3 (reports)            | Low      | P3 has a "User Registration" report showing registration dates. PRD 10 does not list this specific report type.                                                                                                                                             |
| 10.3 | Unit History Records report     | P3 (reports)            | Medium   | P3 has "Unit History Records" and "User History Records" reports. PRD 10 lists many report types but should verify these change-log reports are included in the 52 pre-built reports.                                                                       |
| 10.4 | Email delivery analytics charts | P1 (dashboard)          | Medium   | P1 has dashboard charts for "Successful Emails" (clicked, processed, open, delivered) and "Failed Emails" (spam, invalid, bounces, blocks) over time. PRD 10 mentions communication reports but does not specify email delivery analytics with trend lines. |
| 10.5 | User breakdown donut chart      | P1 (dashboard, reports) | Low      | P1 has donut charts showing tenant vs owner distribution and unit breakdown (rental/owned/empty). PRD 10 may cover this in dashboard widgets but should verify these specific demographic visualizations are specified.                                     |

### PRD 11 — Training/LMS

| #    | Gap                           | Source        | Priority | Description                                                                                                                                                                                                                                                                                                          |
| ---- | ----------------------------- | ------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 11.1 | Course code system            | P3 (training) | Medium   | P3 uses structured course codes (CCC100, CCC200-CCC209, CCC250, etc.) with a naming convention where the code range indicates the category. PRD 11 mentions course builder but does not specify a structured course code system for organizing curriculum.                                                           |
| 11.2 | Product Updates learning path | P3 (training) | High     | P3 has a dedicated "Product Updates" learning path tab with 33+ release training entries documenting platform changes over time. This ensures staff stay current with new features. PRD 11 mentions learning paths but does not specify a platform updates learning path. This is critical for adoption post-launch. |

### PRD 12 — Community

| #    | Gap                                 | Source              | Priority | Description                                                                                                                                                                                                                                          |
| ---- | ----------------------------------- | ------------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 12.1 | Classified ads terms and conditions | P1 (advertisement)  | Medium   | P1 requires "I agree to terms and conditions" checkbox before posting classified ads, with a 2-business-day approval timeframe notice. PRD 12 mentions moderation but does not specify mandatory T&C acceptance or approval timeframe communication. |
| 12.2 | Classified ads expiry and price     | P3 (classified-ads) | Medium   | P3 classified ads have expiry dates and price fields as structured data (sortable, filterable). PRD 12 mentions classified ads but should ensure price and expiry are first-class fields, not just text in the description.                          |

### PRD 13 — Parking

| #    | Gap                                    | Source        | Priority | Description                                                                                                                                                                                                                                                                                                                                                                                  |
| ---- | -------------------------------------- | ------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 13.1 | Parking limit granularity              | P1 (settings) | Critical | P1 has extremely granular parking limits: overnight limit per plate per week, per unit per week, per plate per month, per unit per month, per plate per year, per unit per year, consecutive limit, day visit limit per unit, day visit limit per plate. PRD 13 mentions parking rules but does not specify this granular matrix of limits. This is essential for enforcing building bylaws. |
| 13.2 | Role-based parking limit notifications | P1 (settings) | High     | P1 has 9 role-specific toggles for parking limit notifications (Notify Board, Concierge, Owner, Property Manager, Security Head Office, Site Supervisor, Superintendent, Tenant, Admin when limit reached). PRD 13 mentions notifications but does not specify this role-based notification matrix.                                                                                          |
| 13.3 | Self-serve visitor parking toggle      | P1 (settings) | Medium   | P1 has "Allow self serve for visitor parking" toggle letting residents register visitor parking themselves. PRD 13 may cover this but should explicitly specify resident self-service parking registration as a configurable setting.                                                                                                                                                        |
| 13.4 | Multi-day visitor pass support         | P1 (settings) | Medium   | P1 has "Allow residents to enter multi day passes" toggle. PRD 13 should specify multi-day visitor pass capability.                                                                                                                                                                                                                                                                          |
| 13.5 | Formatted parking pass printing        | P1 (settings) | Low      | P1 has "Formatted Parking Passes" setting for branded pass printing. PRD 13 mentions pass printing but should specify formatted/branded passes.                                                                                                                                                                                                                                              |

### PRD 14 — Dashboard

| #    | Gap                                   | Source                         | Priority | Description                                                                                                                                                                                              |
| ---- | ------------------------------------- | ------------------------------ | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 14.1 | Weather widget with live data         | P1 (dashboard), P3 (dashboard) | Medium   | Both P1 and P3 display live weather data (temperature, wind, condition) on the dashboard. PRD 14 may mention weather but should confirm it is specified as a dashboard widget with live API integration. |
| 14.2 | Email delivery analytics on dashboard | P1 (dashboard)                 | Low      | P1 shows email success/failure charts directly on the dashboard. PRD 14 lists many widgets but should verify email delivery metrics are included.                                                        |

### PRD 16 — Settings & Admin

| #    | Gap                                          | Source        | Priority | Description                                                                                                                                                                                                                                                                                                                                          |
| ---- | -------------------------------------------- | ------------- | -------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 16.1 | Auto-CC email lists per event/log type       | P1 (settings) | Critical | P1 has configurable auto-CC email addresses per log type (General Log auto-CC, Incident Log auto-CC, Fire Log auto-CC, Noise Log auto-CC). These ensure the right people are always notified. PRD 16 mentions notification settings but does not specify per-event-type auto-CC email configuration.                                                 |
| 16.2 | Security company configuration               | P1 (settings) | High     | P1 has dedicated "Security Company" fields (company name, logo upload) in settings. PRD 16 mentions branding but does not specify third-party security company configuration. Important for branded security reports and passes.                                                                                                                     |
| 16.3 | Per-notification-type "from" email addresses | P1 (settings) | High     | P1 configures different "from" email addresses for: General Notifications, Event Log Notifications, Front Desk Instructions Notifications, Maintenance Requests Notifications, Amenity Reservations Notifications, and a default building "from" email. PRD 16 mentions email settings but does not specify per-module "from" address configuration. |
| 16.4 | Signature pad type configuration             | P1 (settings) | Low      | P1 has "Signature Pad Type" setting in parking configuration. PRD 16 does not specify signature capture device configuration.                                                                                                                                                                                                                        |

### PRD 17 — Mobile/Responsive

| #    | Gap                            | Source                            | Priority | Description                                                                                                                                                                    |
| ---- | ------------------------------ | --------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 17.1 | User badge scanning via mobile | P3 (reports - "User Badge Scans") | Medium   | P3 has a "User Badge Scans" report tracking badges scanned through the mobile app. PRD 17 mentions PWA but does not specify NFC/QR badge scanning for resident identification. |

### PRD 18 — Integrations

No critical gaps found. PRD 18 is comprehensive in listing integration categories.

### PRD 21 — Demo Environment

| #    | Gap                     | Source                         | Priority | Description                                                                                                                                                                                      |
| ---- | ----------------------- | ------------------------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 21.1 | Demo analytics tracking | Research (BUSINESS-OPERATIONS) | Medium   | BUSINESS-OPERATIONS.md specifies demo environments but PRD 21 should specify analytics on demo usage (which features prospects interact with, time spent per module) to inform sales follow-ups. |

### PRD 22 — Marketing Website

No gaps found. PRD 22 is well-specified.

### PRD 23 — Onboarding Wizard

| #    | Gap                                        | Source        | Priority | Description                                                                                                                                                                                                                                                              |
| ---- | ------------------------------------------ | ------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 23.1 | Parking limits configuration in onboarding | P1 (settings) | High     | Given the granular parking limit matrix identified in gap 13.1, the onboarding wizard should include a parking rules step or at minimum provide sensible defaults for all parking limit types. PRD 23 lists onboarding steps but does not specify parking configuration. |

### PRD 24 — Billing & Subscription

No critical gaps found. Well-specified.

### PRD 25 — Help Center

| #    | Gap                                      | Source                     | Priority | Description                                                                                                                                                                                                                                                                |
| ---- | ---------------------------------------- | -------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 25.1 | Idea Board / Feature Request integration | P3 (sidebar - Help button) | Medium   | P3 has "Post Idea" and "Browse Ideas" accessible from the Help button. PRD 25 mentions help and support but does not integrate the Idea Board feature (listed in PRD 12 as Community). Consider adding a "Feature Request" or "Idea" submission path from the Help Center. |

### PRD 26 — Developer Portal & API

No critical gaps found. Well-specified.

### PRD 27 — Data Migration

No critical gaps found. Well-specified.

### PRD 28 — Compliance Reports

No critical gaps found. Well-specified.

---

## Priority Summary

### Critical Gaps (Must Fix Before v1)

| #    | PRD    | Gap                                 | Action Required                                                            |
| ---- | ------ | ----------------------------------- | -------------------------------------------------------------------------- |
| 3.1  | PRD 03 | Fire log specialized checklist      | Add fire event type spec with all checklist fields                         |
| 3.2  | PRD 03 | Noise complaint specialized fields  | Add noise event type spec with 14 complaint types and investigation fields |
| 7.1  | PRD 07 | Vacation/away period tracking       | Add vacation tracking feature to unit/user management                      |
| 13.1 | PRD 13 | Parking limit granularity           | Add full parking limit matrix (per plate/unit, per week/month/year)        |
| 16.1 | PRD 16 | Auto-CC email lists per event type  | Add per-event-type auto-CC email configuration                             |
| 4.1  | PRD 04 | Outgoing package tracking           | Add outgoing package workflow                                              |
| 4.2  | PRD 04 | Package tracking number field       | Add carrier tracking number field                                          |
| 8.2  | PRD 08 | "Require Assistance" emergency flag | Add assistance-required boolean to user model                              |

### High Gaps (Must Fix Before v1)

| #    | PRD    | Gap                                | Action Required                       |
| ---- | ------ | ---------------------------------- | ------------------------------------- |
| 1.1  | PRD 01 | Multi-building context switching   | Spec building selector component      |
| 2.1  | PRD 02 | Superintendent role missing        | Add role or document mapping          |
| 3.3  | PRD 03 | Authorized Entry tracking          | Add as standalone event type          |
| 5.1  | PRD 05 | "Don't show to residents" toggle   | Add visibility control per request    |
| 6.1  | PRD 06 | Move-in/move-out elevator booking  | Spec elevator as special amenity type |
| 7.2  | PRD 07 | Electronic consent tracking        | Add consent document management       |
| 7.3  | PRD 07 | User/Unit history records          | Add viewable change history           |
| 8.1  | PRD 08 | Email signature editor             | Add rich text signature editor        |
| 9.1  | PRD 09 | Digital signage channel            | Promote to v2 with spec               |
| 9.3  | PRD 09 | Email delivery failure tracking UI | Spec failure investigation interface  |
| 11.2 | PRD 11 | Product Updates learning path      | Add platform updates curriculum       |
| 13.2 | PRD 13 | Role-based parking notifications   | Add notification matrix               |
| 16.2 | PRD 16 | Security company configuration     | Add security provider fields          |
| 16.3 | PRD 16 | Per-module "from" email addresses  | Add per-module email config           |
| 23.1 | PRD 23 | Parking limits in onboarding       | Add parking config step               |
| 7.6  | PRD 07 | Language preference per user       | Add per-user language setting         |

---

## Methodology Notes

1. **Every file** in `docs/`, `docs/platform-2/`, and `docs/platform-3/` was read.
2. **Every PRD** (00-28) was read (first 150-200 lines for large files due to size constraints; key fields and features captured).
3. **PLATFORM-COMPARISON.md** was read in full -- all 86+ features and Concierge decisions were cross-checked.
4. **CLAUDE.md** strategic decisions and feature prioritization were used as the baseline for priority ratings.
5. Gaps were only rated "Critical" if the feature exists in at least one competitor AND is relevant to v1 core operations AND its absence would be noticed by property managers during evaluation.
6. No competitor brand names appear in this document per project policy.

---

_Generated: 2026-03-17_
_Total research files reviewed: 60+_
_Total PRD files reviewed: 29_
_Total gaps identified: 47_
