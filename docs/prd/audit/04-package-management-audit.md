# Audit Report: 04 — Package Management PRD

> **Audit date**: 2026-03-14
> **Auditor**: Cross-reference audit against all research files
> **Research files audited**:
> 1. `docs/packages.md` — Aquarius package management
> 2. `docs/logs.md` — Aquarius logs (parcel log section)
> 3. `docs/platform-2/event-log.md` — BuildingLink event log
> 4. `docs/platform-3/deep-dive-security-concierge.md` — Condo Control security/concierge module

---

## 1. Summary

| Metric | Count |
|--------|-------|
| Total fields/features checked across all research files | 187 |
| Gaps found (missing from PRD) | 23 |
| Weak coverage (present but insufficiently detailed) | 14 |
| Confirmed present and adequately covered | 150 |

**Overall assessment**: The PRD is comprehensive and goes well beyond what any single research platform offers. However, there are specific fields, dropdown options, workflow steps, and edge cases from the research that are either missing or insufficiently specified.

---

## 2. GAPS — Items Missing from PRD

### GAP-01: Aquarius "Manage Parcel Types" admin CRUD interface
**Source**: `docs/packages.md` (lines 22-53)
**Details**: Aquarius has a dedicated "Manage Parcel Types" button on the package listing page itself (not buried in Settings) that opens a modal with a table showing Package Type Category, Added On date, and a Delete action. The PRD specifies configurable parcel categories in `ParcelCategory` entity but does not specify the admin management UI for creating/editing/deleting parcel categories. There is no section describing the Settings > Packages > Parcel Categories admin interface with its CRUD operations, table columns, and empty state.

### GAP-02: Aquarius "Print Non Released Packages" report button
**Source**: `docs/packages.md` (line 69)
**Details**: Aquarius has a dedicated "Print Non Released Packages" button on the search filter bar. The PRD has "Print Unreleased" button (Section 3.1.4) but does not specify the print layout/format of this report — what columns are included, paper size, sort order, grouping options, or whether it respects current filter state.

### GAP-03: Aquarius released packages 21-day history window
**Source**: `docs/packages.md` (lines 101-108)
**Details**: Aquarius shows released packages for the past 21 days by default. The PRD uses 30 days (Section 3.1.4). This is not a gap per se (30 is better), but the PRD does not specify that the released section has its own independent search/filter capability. Aquarius explicitly has separate "Clear Search" and "Search" buttons for the Released section, meaning filters can differ between the two sections. The PRD appears to use a single unified filter bar with a Status dropdown toggle.

### GAP-04: Aquarius "Building Name" column in package table
**Source**: `docs/packages.md` (line 94)
**Details**: Aquarius shows "Building Name" as a column in the package table. The PRD's table columns (Section 3.1.4) do not include a Building column. For multi-building properties this is essential for quick visual identification. The filter exists but the column does not.

### GAP-05: Aquarius "Bulk Addition" button on Record Packages modal
**Source**: `docs/packages.md` (line 133)
**Details**: Aquarius has a "Bulk Addition" button directly on the single-package Record modal (top-right, outlined style). The PRD has Batch Intake as a separate form accessed from the listing page. The Aquarius pattern of allowing quick switch from single to batch mode within the same dialog is not replicated.

### GAP-06: Aquarius default search date range (90 days back, 2 days forward)
**Source**: `docs/packages.md` (lines 65-66)
**Details**: Aquarius defaults the search to 90 days back and 2 days forward (to catch future-dated entries). The PRD's API defaults to 90 days back (Section 10.2) but does not specify the forward-looking date or explain why a future end date might be useful (pre-logged expected deliveries).

### GAP-07: BuildingLink per-event-type On-Close action
**Source**: `docs/platform-2/event-log.md` (line 55)
**Details**: BuildingLink configures an "On-Close action" per event type — a specific action triggered when the event is closed/resolved (i.e., package released). The PRD specifies notification on release (Section 9.1, "Package released" push notification) but does not surface this as a configurable per-courier-type action in the courier management settings. Each courier could have a different release action template.

### GAP-08: BuildingLink "Public Display" flag per event type
**Source**: `docs/platform-2/event-log.md` (lines 56-57)
**Details**: BuildingLink has a "Public display" boolean per event type controlling whether the event appears on lobby screens/digital signage. The PRD does not mention lobby display integration for packages at all. This is listed as v3+ in CLAUDE.md ("Public display/digital signage") but the data model and courier configuration should accommodate the flag now.

### GAP-09: BuildingLink "Active/Inactive" toggle for event types with "Show Inactive" checkbox
**Source**: `docs/platform-2/event-log.md` (line 58)
**Details**: BuildingLink allows toggling event types active/inactive and has a "Show inactive" checkbox on the grid. The PRD's Courier entity has `is_active` (Section 4.2) but the listing page UI does not specify a "Show inactive couriers" toggle in the courier management admin view.

### GAP-10: BuildingLink card width and font size adjustability
**Source**: `docs/platform-2/event-log.md` (lines 77-78)
**Details**: BuildingLink lets users adjust card width and font size on the event grid. The PRD does not offer any display density/size controls on the package listing page. This is a staff productivity feature for front desks with different monitor sizes.

### GAP-11: BuildingLink 4 grouping modes (by Event Group, Status, Unit, Date)
**Source**: `docs/platform-2/event-log.md` (lines 82-86)
**Details**: BuildingLink offers 4 grouping modes for the event grid view. The PRD's package listing is a flat table sorted by various columns but does not offer a "group by" option (e.g., group by courier, group by unit, group by storage spot). This would be useful for visual scanning.

### GAP-12: BuildingLink "Location" module as an optional per-event field
**Source**: `docs/platform-2/event-log.md` (lines 144-145)
**Details**: BuildingLink has an optional "Location" module that adds a location field to events, with a setting to make it mandatory. The PRD has `storage_spot_id` for packages but no generic "location" field concept. For outgoing packages, the location might differ from storage (e.g., "Loading Dock", "Mail Room Counter").

### GAP-13: BuildingLink voice notification option for packages
**Source**: `docs/platform-2/event-log.md` (line 147)
**Details**: BuildingLink supports voice call notifications for packages ("Residents can receive voice notifications for packages"). The PRD's notification channels are email, SMS, push, all, none (Section 3.1.1). Voice call is not listed as a channel option. CLAUDE.md explicitly says "Email + SMS + Push" for v1, but voice is a notable omission given BuildingLink offers it.

### GAP-14: BuildingLink setting "Show resident's phone numbers on new events"
**Source**: `docs/platform-2/event-log.md` (line 146)
**Details**: BuildingLink has a property-level setting to show resident phone numbers directly on the event creation form. The PRD's intake form does not show resident contact info. During intake, staff may need to call the resident (especially for perishables). The detail view shows phone (Section 3.1.5) but the intake form does not.

### GAP-15: BuildingLink "Allowed to view captured signatures" access control
**Source**: `docs/platform-2/event-log.md` (line 143)
**Details**: BuildingLink has a setting controlling who can view signatures: "All building staff" or "Managers only". The PRD specifies signature capture (Section 3.1.3) but does not specify role-based access control for viewing captured signatures. This is a privacy concern — signatures are sensitive personal data.

### GAP-16: BuildingLink notification sender name/email as tag-based fields
**Source**: `docs/platform-2/event-log.md` (lines 138-139)
**Details**: BuildingLink uses "tag-based" fields for notification sender name and email (likely supporting merge tags like {property_name}). The PRD has `notification_sender_name` and `notification_sender_email` in settings (Section 9.3) but does not specify whether these support template variables/merge tags.

### GAP-17: BuildingLink "Default notification selection" radio setting
**Source**: `docs/platform-2/event-log.md` (line 141)
**Details**: BuildingLink has a property-level default notification selection with options: "1st email / No notification / All addresses". The PRD's `notify_channel` field defaults to "default" (use resident preference) but there is no property-level setting to override the system-wide default notification behavior for packages. The notification settings in Section 9.3 do not include a default notification channel setting.

### GAP-18: Condo Control "Log Call" button on package detail
**Source**: `docs/platform-3/deep-dive-security-concierge.md` (line 581)
**Details**: Condo Control has a "Log Call" button on the package detail dialog for outstanding packages. This lets staff document phone call attempts to reach residents about their packages. The PRD has "Send Reminder" but no "Log Call" action that records a manual contact attempt without sending a notification.

### GAP-19: Condo Control "Edit" link on Storage Spot within package detail
**Source**: `docs/platform-3/deep-dive-security-concierge.md` (line 570)
**Details**: Condo Control shows the storage location in the package detail with an inline "(Edit)" link, allowing quick relocation of a package without opening the full edit form. The PRD's detail view shows storage location but only offers a full "Edit" button. A quick-edit for storage spot relocation is a common workflow (moving packages between shelves).

### GAP-20: Condo Control per-type sequential reference number counters
**Source**: `docs/platform-3/deep-dive-security-concierge.md` (lines 706-713)
**Details**: Condo Control uses separate reference number counters per entry type (packages have their own sequence, visitors have their own, etc.). The PRD uses a per-property sequential counter (Section 3.1.6) with prefix "PKG-". This is confirmed present but the PRD does not explicitly state that the package counter is independent from other event type counters in the unified event model. This needs clarification to avoid confusion with the architecture PRD.

### GAP-21: Condo Control Outgoing Package tab as a distinct tab on the creation dialog
**Source**: `docs/platform-3/deep-dive-security-concierge.md` (lines 203-208)
**Details**: Condo Control presents Incoming and Outgoing as two distinct tabs on the "New Package" dialog, each being its own view. The PRD uses a toggle switch (field #1 `direction`). While functionally equivalent, the tab approach from Condo Control is more discoverable and could have different field layouts per tab. The PRD should clarify whether the form fields change when switching to Outgoing (Section 3.1.11 mentions differences but the form spec in 3.1.1 is unified).

### GAP-22: Aquarius "Incoming" toggle switch behavior on the Record Packages modal
**Source**: `docs/packages.md` (line 120)
**Details**: Aquarius has an "Incoming" toggle switch that defaults to on/blue. The implication is that toggling it off switches to "Outgoing" mode. The PRD's direction field is a "Toggle (2 options)" but does not specify the visual toggle behavior (is it a segmented control, a switch, or radio buttons?). The research shows a toggle switch; the PRD should specify the exact component type.

### GAP-23: Condo Control Package description as free text vs. dropdown disconnect
**Source**: `docs/platform-3/deep-dive-security-concierge.md` (line 219, line 847)
**Details**: Condo Control's deep dive notes that package description is free text ("Package", "Envelope", "White Package" typed manually) and flags this as a problem (item #7 in "What CondoControl Gets Wrong"). The PRD addresses this with `parcel_category_id` (dropdown) but also has a separate `description` free-text field. The PRD should explicitly state that the dropdown replaces the free-text description pattern from Condo Control, and the free-text field is for supplementary notes only, not the primary classification.

---

## 3. WEAK COVERAGE — Items Present but Insufficiently Detailed

### WEAK-01: Pagination specification
**Source**: `docs/packages.md` (lines 97, 108), `docs/platform-3/deep-dive-security-concierge.md` (lines 149-158)
**PRD location**: Section 3.1.4 (listing), Section 10.2 (API)
**Issue**: Aquarius uses 5 rows per page by default with Previous/Next navigation. Condo Control uses 10 per page with First/Previous/numbered pages/Next/Last. The PRD specifies 25 per page in the API (Section 10.2) but does not specify the UI pagination component design: does it use numbered pages, or simple prev/next? Is rows-per-page configurable by the user (Aquarius has a "Row-per-page selector")? What are the available page size options?

### WEAK-02: Courier icon selection behavior specifics
**Source**: `docs/platform-3/deep-dive-security-concierge.md` (line 240)
**PRD location**: Section 3.1.1 (field #6)
**Issue**: Condo Control specifies "Click to select (highlighted border). Only one can be selected at a time." The PRD says "Icon grid (15 options)" but does not detail: visual selected state (highlighted border? background change?), deselection behavior (click again to deselect? or must select another?), keyboard navigation within the grid, or mobile interaction pattern.

### WEAK-03: Batch intake notification control options
**Source**: `docs/platform-2/event-log.md` (line 126)
**PRD location**: Section 3.1.2 (per-row field #8)
**Issue**: BuildingLink's batch form has per-row notification options: "1st email / No notification / All addresses". The PRD specifies "Notification channel" dropdown per row but does not list the specific options for the batch row. Are they the same 6 options as the single intake form (default/email/sms/push/all/none)? This should be explicit.

### WEAK-04: "Send Copy" email functionality
**Source**: `docs/logs.md` (line 35), `docs/packages.md` (not present but related)
**PRD location**: Not addressed
**Issue**: Aquarius General Log and other logs have a "Send Copy" multi-select dropdown to email a copy of the log to selected recipients. While this is a logs feature, package intake may also benefit from a "Send copy to" field where staff can CC property management or a specific person on the package notification. The PRD's notification system sends to the resident only. No CC/BCC capability is specified.

### WEAK-05: Package edit form specification
**Source**: All research files show edit capability
**PRD location**: Section 3.1.5 mentions "Edit" button
**Issue**: The PRD specifies an "Edit" button on the detail view and a PATCH API endpoint (Section 10.1), but does not detail: which fields are editable after creation? Can the unit/recipient be changed? Can a released package be edited? What fields are locked after release? The edit form itself is not specified.

### WEAK-06: Package delete confirmation dialog
**Source**: `docs/packages.md` (line 93)
**PRD location**: Section 3.1.5 mentions "Soft-deletes the package with confirmation dialog"
**Issue**: The confirmation dialog text is not specified. What does it say? "Are you sure you want to delete Package #{ref}? This action cannot be undone." or similar? Also not specified: who gets notified of a deletion, and is there an undo/restore capability for soft-deleted packages?

### WEAK-07: Multi-building package filtering behavior
**Source**: `docs/packages.md` (line 63, line 94)
**PRD location**: Section 3.1.1 (field #2), Section 3.1.4 (filter #2)
**Issue**: Aquarius has "Select building" dropdown with default "Bond". The PRD says "Current building (auto)" for the default. But for staff who work across multiple buildings, the PRD does not specify: does the building filter persist across sessions? Is there a "All buildings" option? When viewing all buildings, is the building shown as a column (see GAP-04)?

### WEAK-08: Storage spot default behavior
**Source**: `docs/packages.md` (line 129), `docs/platform-3/deep-dive-security-concierge.md` (line 221)
**PRD location**: Section 3.1.1 (field #11, default "Property default")
**Issue**: The PRD says "Property default" but does not specify how the property default storage spot is configured. Is it a setting in Settings > Packages? What happens if no default is set? Does it fall back to empty/none? Condo Control defaults to "Security Desk" — is there a similar concept?

### WEAK-09: Aquarius "Released By" field
**Source**: `docs/packages.md` (line 144)
**PRD location**: Section 4.1 (`released_by` field)
**Issue**: The data model has `released_by` as a UUID FK, and the Released table shows "Released By" (Section 3.1.4). However, the release form (Section 3.1.3) does not show a "Released By" field — this should be auto-populated from the logged-in staff member. The PRD should explicitly state this is auto-populated and not user-editable.

### WEAK-10: Condo Control package history action types
**Source**: `docs/platform-3/deep-dive-security-concierge.md` (lines 613-616)
**PRD location**: Section 4.2 (PackageHistory entity)
**Issue**: Condo Control's observed history actions include "Received Package", "Notification sent", "Email Notification", "Package Picked Up". The PRD's PackageHistory has an action ENUM with 9 values. However, the PRD does not specify exactly what text/format appears in the history timeline UI for each action type. The detail view wireframe shows "Package received" and "Email notification sent" but this is only in the wireframe, not formally specified.

### WEAK-11: Aquarius parcel type categories — configurable by whom?
**Source**: `docs/packages.md` (lines 22-39)
**PRD location**: Section 3.1.1 ("11 default, configurable by admin")
**Issue**: The PRD says "configurable by admin" but does not specify which admin role(s) can manage parcel categories. Is it Property Admin only? Super Admin? The ParcelCategory entity has a `property_id` FK suggesting per-property configuration, but the CRUD UI and permissions are not specified.

### WEAK-12: BuildingLink courier-specific notification email templates
**Source**: `docs/platform-2/event-log.md` (lines 28-44)
**PRD location**: Section 3.1.1 (Courier icon grid, "Notification Template Subject" column)
**Issue**: The PRD specifies notification subject lines per courier but does not specify the full email body template per courier. BuildingLink has per-courier "On-Open Email Template" text (e.g., "You have an Amazon delivery", "A Purolator package has arrived for your unit"). The PRD should clarify whether only the subject line varies per courier or if the entire email body template is courier-specific.

### WEAK-13: Condo Control "Send Email Reminder" vs. PRD "Send Reminder"
**Source**: `docs/platform-3/deep-dive-security-concierge.md` (line 579)
**PRD location**: Section 3.1.5
**Issue**: Condo Control's button is explicitly "Send Email Reminder" (email only). The PRD's "Send Reminder" button uses the resident's preferred channel. While the PRD approach is better, the PRD does not specify what happens if the resident has no communication channel configured (no email, no phone, no app). Should it show a warning? Fall back to a specific channel?

### WEAK-14: Condo Control release "Comments" field examples
**Source**: `docs/platform-3/deep-dive-security-concierge.md` (line 592)
**PRD location**: Section 3.1.3 (field #4)
**Issue**: Condo Control notes example comments like "ID verified", "Left at door". The PRD has a Comments field on release but does not specify placeholder text, suggested quick-select options, or validation. Given this is a liability-sensitive field, placeholder examples would guide staff toward useful documentation practices.

---

## 4. CONFIRMED — Items Verified as Present

**Total confirmed: 150 items**

### From Aquarius (`docs/packages.md`)

| # | Research Item | PRD Section | Notes |
|---|--------------|-------------|-------|
| 1 | Dual-section layout (Non-Released / Released) | 3.1.4 | Confirmed as "Unreleased" / "Released" sections |
| 2 | Record Packages modal with Inbox icon entry point | 3.1.1 | Confirmed as "+ Package" button and keyboard shortcut |
| 3 | Batch release (Sitemap icon) | 3.1.3 | Confirmed as batch release with checklist |
| 4 | Select Building dropdown | 3.1.1, field #2 | Confirmed |
| 5 | Reference Number auto-generated | 3.1.6 | Confirmed with PKG-{CODE}-{SEQ} format (improved) |
| 6 | Related Unit dropdown | 3.1.1, field #4 | Confirmed as autocomplete |
| 7 | Choose Resident dropdown | 3.1.1, field #5 | Confirmed as autocomplete with auto-populate |
| 8 | Courier Name dropdown | 3.1.1, field #6 | Confirmed as icon grid (improved) |
| 9 | Type of parcel dropdown | 3.1.1, field #9 | Confirmed as ParcelCategory |
| 10 | Tracking Number field | 3.1.1, field #8 | Confirmed |
| 11 | Package Details textarea | 3.1.1, field #10 | Confirmed as Description |
| 12 | Storage Spot dropdown | 3.1.1, field #11 | Confirmed with capacity tracking (improved) |
| 13 | Perishable checkbox | 3.1.1, field #12 | Confirmed as toggle with escalation chain (improved) |
| 14 | Save button | 3.1.1 | Confirmed with detailed state spec |
| 15 | Reference # column | 3.1.4 | Confirmed |
| 16 | Unit # column | 3.1.4 | Confirmed |
| 17 | Belongs To / Recipient column | 3.1.4 | Confirmed |
| 18 | Package Details / Description column | 3.1.4 | Confirmed |
| 19 | Courier column | 3.1.4 | Confirmed with icon |
| 20 | Creation Time / Received column | 3.1.4 | Confirmed |
| 21 | Storage Spot column | 3.1.4 | Confirmed |
| 22 | Release action button | 3.1.4 | Confirmed |
| 23 | View action button | 3.1.4 | Confirmed |
| 24 | Edit action button | 3.1.4 | Confirmed |
| 25 | Delete action button | 3.1.4 | Confirmed |
| 26 | Release Time column (released section) | 3.1.4 | Confirmed as "Released At" |
| 27 | Search by package details | 3.1.4, filter #1 | Confirmed (full-text search) |
| 28 | Search by recipient name | 3.1.4, filter #1 | Confirmed |
| 29 | Filter by building | 3.1.4, filter #2 | Confirmed |
| 30 | Filter by unit | 3.1.4, filter #3 | Confirmed |
| 31 | Search by reference number | 3.1.4, filter #1 | Confirmed |
| 32 | Start/End date filter | 3.1.4, filter #7 | Confirmed |
| 33 | Clear Search button | 3.1.4 | Confirmed as "Clear Filters" |
| 34 | Package release flow (6 steps) | 5.2 | Confirmed with enhanced verification |
| 35 | Package lifecycle (receive, store, release) | 1, 5.1, 5.2 | Confirmed |
| 36 | Multi-building support | 3.1.1, field #2 | Confirmed |
| 37 | Auto-generated reference numbers | 3.1.6 | Confirmed (improved format) |
| 38 | Resident email notification on receipt | 9.1 | Confirmed (multi-channel) |

### From Aquarius — Improvement Opportunities (`docs/packages.md` lines 183-196)

| # | Suggested Improvement | PRD Section | Notes |
|---|----------------------|-------------|-------|
| 39 | Barcode/QR scanning | 3.1.1 (field #8 tooltip), 7.2 | Confirmed via AI OCR |
| 40 | Photo capture on intake | 3.1.1, field #14 | Confirmed |
| 41 | Smart notifications / escalating reminders | 3.1.9, 9.1 | Confirmed with perishable escalation |
| 42 | Perishable priority handling | 3.1.9 | Confirmed with full escalation chain |
| 43 | Courier analytics | 7.6, 8.2 | Confirmed |
| 44 | Resident self-serve | 3.1.10 | Confirmed |
| 45 | Batch intake | 3.1.2 | Confirmed (1-20 rows) |
| 46 | Digital signature on release | 3.1.3 | Confirmed |
| 47 | Search by tracking number | 3.1.4, filter #1 | Confirmed in full-text search |

### From BuildingLink (`docs/platform-2/event-log.md`)

| # | Research Item | PRD Section | Notes |
|---|--------------|-------------|-------|
| 48 | 15 courier-specific event types | 3.1.1 (courier grid) | Confirmed (15 couriers, different mix) |
| 49 | Courier icons and color badges | 3.1.1 (courier grid table) | Confirmed |
| 50 | Per-courier notification templates | 3.1.1 (notification subject column) | Confirmed (subject only) |
| 51 | Event type configurable icon | 4.2 (Courier entity, icon_url) | Confirmed |
| 52 | Event type configurable color | 4.2 (Courier entity, color_hex) | Confirmed |
| 53 | Event type configurable name | 4.2 (Courier entity, name) | Confirmed |
| 54 | Event type sort order | 4.2 (Courier entity, sort_order) | Confirmed |
| 55 | Event type active/inactive | 4.2 (Courier entity, is_active) | Confirmed |
| 56 | On-Open email template per type | 9.1 (Package received template) | Confirmed |
| 57 | Event detail: Unit | 3.1.5 (Recipient Info) | Confirmed |
| 58 | Event detail: Event type | 3.1.5 (Package Info) | Confirmed |
| 59 | Event detail: Comments | 3.1.5 (not explicit but in Description) | Confirmed |
| 60 | Event detail: Status | 3.1.5 (Header, status badge) | Confirmed |
| 61 | Event detail: Created by | 3.1.5 (History) | Confirmed |
| 62 | Event detail: Created at | 3.1.5 (Storage section) | Confirmed |
| 63 | Batch event creation | 3.1.2 | Confirmed (expanded from 4 to 20 rows) |
| 64 | Per-row notification control in batch | 3.1.2, field #8 | Confirmed |
| 65 | Print label per row in batch | 3.1.2, field #9 | Confirmed |
| 66 | Signature capture (premium) | 3.1.3 | Confirmed (configurable per property) |
| 67 | Photo capture (premium) | 3.1.3 | Confirmed |
| 68 | Email notification channel | 9.1 | Confirmed |
| 69 | SMS notification channel | 9.1 | Confirmed |
| 70 | Label printing integration | 3.1.7 | Confirmed (detailed spec) |
| 71 | Staff can select notification recipients | 3.1.1, field #15 | Confirmed |
| 72 | Notification sender name setting | 9.3 | Confirmed |
| 73 | Notification sender email setting | 9.3 | Confirmed |
| 74 | Allow staff to select notification recipients setting | 9.3 (implicit) | Confirmed via notify_channel dropdown |

### From Condo Control (`docs/platform-3/deep-dive-security-concierge.md`)

| # | Research Item | PRD Section | Notes |
|---|--------------|-------------|-------|
| 75 | Incoming/Outgoing tabs/toggle | 3.1.1 (field #1) | Confirmed as toggle |
| 76 | Ref# auto-generated read-only | 3.1.1 (field #3) | Confirmed |
| 77 | Recipient autocomplete | 3.1.1 (field #5) | Confirmed |
| 78 | Unit autocomplete | 3.1.1 (field #4) | Confirmed |
| 79 | Courier icon grid | 3.1.1 (field #6) | Confirmed |
| 80 | Amazon courier | 3.1.1 | Confirmed |
| 81 | Canada Post courier | 3.1.1 | Confirmed |
| 82 | Canpar courier | 3.1.1 | Confirmed |
| 83 | DHL courier | 3.1.1 | Confirmed |
| 84 | FedEx courier | 3.1.1 | Confirmed |
| 85 | Individual Drop-Off courier | 3.1.1 | Confirmed |
| 86 | Other courier | 3.1.1 | Confirmed |
| 87 | Property Manager/Management courier | 3.1.1 | Confirmed as "Property Management" |
| 88 | Purolator courier | 3.1.1 | Confirmed |
| 89 | UPS courier | 3.1.1 | Confirmed |
| 90 | Tracking # field | 3.1.1 (field #8) | Confirmed |
| 91 | Description field | 3.1.1 (field #10) | Confirmed |
| 92 | Perishable checkbox | 3.1.1 (field #12) | Confirmed |
| 93 | Storage Spot field | 3.1.1 (field #11) | Confirmed |
| 94 | "Log Multiple Packages" batch feature | 3.1.2 | Confirmed |
| 95 | Save button | 3.1.1 | Confirmed |
| 96 | Cancel button | 3.1.1 | Confirmed |
| 97 | Package detail: Package Type (Incoming/Outgoing) | 3.1.5 (Direction) | Confirmed |
| 98 | Package detail: Reference # | 3.1.5 (Header) | Confirmed |
| 99 | Package detail: Recipient with unit | 3.1.5 (Recipient Info) | Confirmed |
| 100 | Package detail: Delivered By (courier) | 3.1.5 (Package Info) | Confirmed |
| 101 | Package detail: Description | 3.1.5 (Package Info) | Confirmed |
| 102 | Package detail: Tracking # | 3.1.5 (Package Info) | Confirmed |
| 103 | Package detail: Perishable flag | 3.1.5 (Header badge) | Confirmed |
| 104 | Package detail: Stored In | 3.1.5 (Storage section) | Confirmed |
| 105 | Package detail: Released timestamp | 3.1.5 (Release Info) | Confirmed |
| 106 | "Send Email Reminder" button | 3.1.5 ("Send Reminder") | Confirmed (improved to multi-channel) |
| 107 | "Release Package" button | 3.1.5 ("Release") | Confirmed |
| 108 | Release sub-form: Released to field | 3.1.3 (field #1) | Confirmed |
| 109 | Release sub-form: Comments field | 3.1.3 (field #4) | Confirmed |
| 110 | Release sub-form: Signature (premium) | 3.1.3 (field #1 of Step 2) | Confirmed |
| 111 | Release button on sub-form | 3.1.3 | Confirmed |
| 112 | Cancel release button | 3.1.3 | Implied (close dialog) |
| 113 | Package History section | 3.1.5 (History section) | Confirmed |
| 114 | History: Date/Time column | 3.1.5 | Confirmed |
| 115 | History: Who column | 4.2 (PackageHistory, actor_name) | Confirmed |
| 116 | History: Action column | 4.2 (PackageHistory, action) | Confirmed |
| 117 | History: Details column | 4.2 (PackageHistory, details) | Confirmed |
| 118 | "Received Package" history action | 4.2 (action: 'created') | Confirmed |
| 119 | "Notification sent" history action | 4.2 (action: 'notification_sent') | Confirmed |
| 120 | "Package Picked Up" history action | 4.2 (action: 'released') | Confirmed |
| 121 | Console filter: All Packages | 3.1.4 (Status: "All") | Confirmed |
| 122 | Console filter: Outstanding Packages | 3.1.4 (Status: "Unreleased") | Confirmed |
| 123 | Console filter: Delivered Packages | 3.1.4 (Status: "Released") | Confirmed |
| 124 | "Release" action in table Action column | 3.1.4 (Actions column) | Confirmed |
| 125 | Empty action for delivered packages | 3.1.5 (released: "Print Receipt" only) | Confirmed |
| 126 | Security Console quick-create icon for packages | 3.1.1 (entry point #3) | Confirmed |
| 127 | Package entity: PackageType (Incoming/Outgoing) | 4.1 (direction ENUM) | Confirmed |
| 128 | Package entity: ReferenceNumber | 4.1 (reference_number) | Confirmed |
| 129 | Package entity: Recipient | 4.1 (resident_id FK) | Confirmed |
| 130 | Package entity: DeliveredBy | 4.1 (courier_id FK) | Confirmed |
| 131 | Package entity: Description | 4.1 (description) | Confirmed |
| 132 | Package entity: TrackingNumber | 4.1 (tracking_number) | Confirmed |
| 133 | Package entity: Perishable | 4.1 (is_perishable) | Confirmed |
| 134 | Package entity: StorageSpot | 4.1 (storage_spot_id FK) | Confirmed |
| 135 | Package entity: Released timestamp | 4.1 (released_at) | Confirmed |
| 136 | Search text input (min 3 chars) | 3.1.4 | Search exists but no min char requirement specified |
| 137 | Advanced search with date range | 3.1.4, filter #7 | Confirmed |
| 138 | Pagination on events table | 3.1.4, 10.2 | Confirmed |
| 139 | Real-time updates via WebSocket | 10.6 | Confirmed (addresses CC weakness #10) |
| 140 | Package moved from Outstanding to Delivered on release | 5.2 | Confirmed |

### From cross-platform design decisions (CLAUDE.md)

| # | Research Item | PRD Section | Notes |
|---|--------------|-------------|-------|
| 141 | Unified Event Model integration | 1 (Overview), 4.1 | Confirmed |
| 142 | Multi-channel notifications (email + SMS + push) | 9.1 | Confirmed |
| 143 | Role-aware interfaces | 8.1, 10.1 | Confirmed via dashboard widgets and API auth roles |
| 144 | Export (Excel/PDF) on listing page | 3.1.4, 8.2 | Confirmed (Excel, PDF, CSV) |
| 145 | Configurable event types (not hardcoded) | 3.2.5 | Confirmed via courier management |
| 146 | Photo/document uploads | 3.1.1 (field #14) | Confirmed |
| 147 | Mobile-responsive from start | 6.3 | Confirmed |
| 148 | Parcel waivers from Aquarius | 3.2.2 | Confirmed (v2) |
| 149 | Auto-generated reference numbers | 3.1.6 | Confirmed |
| 150 | Storage spot tracking | 3.1.8 | Confirmed (with capacity, improved) |

---

## 5. Recommendations

### Priority 1 (Should fix before development)
- **GAP-04**: Add Building column to package table for multi-building properties
- **GAP-15**: Add signature visibility access control setting
- **GAP-18**: Add "Log Call" action on package detail to document manual contact attempts
- **WEAK-05**: Specify the package edit form — which fields are editable, which lock after release
- **WEAK-01**: Specify pagination UI component (numbered pages, rows-per-page selector)

### Priority 2 (Should fix before design handoff)
- **GAP-01**: Specify admin CRUD UI for parcel categories
- **GAP-10**: Consider display density controls for front desk monitors
- **GAP-11**: Consider "Group by" option on package listing
- **GAP-13**: Evaluate voice call as a notification channel
- **GAP-19**: Add quick-edit for storage spot relocation
- **WEAK-02**: Detail courier icon grid interaction patterns
- **WEAK-08**: Specify how default storage spot is configured
- **WEAK-14**: Add placeholder/suggested text for release comments

### Priority 3 (Nice to have, can address during development)
- **GAP-02**: Specify print layout for unreleased packages report
- **GAP-05**: Consider inline batch mode switch on single intake form
- **GAP-07**: Per-courier On-Close action configuration
- **GAP-08**: Public display flag on courier entity (future-proofing)
- **GAP-14**: Show resident phone on intake form setting
- **GAP-16**: Support merge tags in notification sender fields
- **GAP-17**: Property-level default notification channel setting
- **WEAK-09**: Explicitly state released_by is auto-populated

---

*End of audit report.*
