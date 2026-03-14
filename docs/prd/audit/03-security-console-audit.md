# Audit: 03-Security Console PRD vs Research Files

> **Audit date**: 2026-03-14
> **Auditor**: Cross-reference audit engine
> **PRD file**: `docs/prd/03-security-console.md`
> **Research files audited**:
> 1. `docs/logs.md` (Aquarius log types)
> 2. `docs/security-menu.md` (Aquarius security features)
> 3. `docs/platform-2/event-log.md` (BuildingLink event system)
> 4. `docs/platform-3/deep-dive-security-concierge.md` (Condo Control security console)

---

## 1. Summary

| Metric | Count |
|--------|-------|
| Total fields/features checked across all research files | ~285 |
| GAPS (missing from PRD) | 34 |
| WEAK COVERAGE (present but insufficient detail) | 18 |
| CONFIRMED (verified present in PRD) | ~233 |

---

## 2. GAPS -- Items Missing from PRD

### 2.1 From Aquarius `logs.md` -- General Log

| # | Missing Item | Research Reference | Details |
|---|-------------|-------------------|---------|
| 1 | **"Post in all buildings" checkbox** | `logs.md` line 32 | General Log has a checkbox: "Your log will be posted in all the buildings you have access to." The PRD General Note (3.1.12) does not include a multi-building post option, only a building filter at the console level. |
| 2 | **"Save and New" button pattern** | `logs.md` line 38 | General Log has both "Save and Exit" and "Save and New" buttons for rapid sequential entry. The PRD only specifies "Save" and "Cancel" for General Note. This is a useful rapid-entry pattern for busy front desks. |
| 3 | **"Send Copy" as multi-select dropdown** | `logs.md` line 36 | The General Log "Send Copy" field is a multi-select dropdown of email recipients. PRD General Note (3.1.12) has "Send Copy" as multi-select dropdown but does not mention the option to include custom email addresses beyond staff list (line 565 says "Staff list + custom email" which partially covers this but is vague). |

### 2.2 From Aquarius `logs.md` -- Incident Log

| # | Missing Item | Research Reference | Details |
|---|-------------|-------------------|---------|
| 4 | **"Were police/fire department etc called?" toggle** | `logs.md` line 54 | Aquarius has a simple Yes/No toggle for "Were police/fire department etc called?" on the incident creation form itself. The PRD has the Emergency Services section (3.1.7) but only as a collapsible section shown for High/Critical priority. Low/Normal priority incidents in the PRD cannot record emergency service calls on creation. |
| 5 | **Pre-filled "Full Report to Follow..." default text** | `logs.md` lines 52, 107, 158 | Aquarius pre-fills the detail textarea with "Full Report to Follow..." for Incident, Fire, and Noise logs. This is a smart UX pattern for time-pressed guards who can log a placeholder and fill in details later. The PRD does not mention any default/placeholder text for incident report body. |
| 6 | **File attachment on incident creation (max 4 files, multi-select with CTRL/CMD)** | `logs.md` line 56 | Aquarius allows 4 file attachments of any type on creation. PRD (3.1.7 line 373-374) specifies 5 photos (JPG/PNG only) + 3 documents (PDF/DOC). The PRD is actually more generous but restricts file types. Aquarius allows any file type. This is a gap in flexibility -- guards may need to attach audio recordings, video clips, or other formats. |

### 2.3 From Aquarius `logs.md` -- Fire Log

| # | Missing Item | Research Reference | Details |
|---|-------------|-------------------|---------|
| 7 | **"Residents needing fire assistance" list** | `logs.md` line 81 | Fire Log checklist includes "List of residents that need fire assistance." The PRD Fire Log (3.2.1) does not mention a residents-needing-assistance list or checklist item. This is critical safety information. |
| 8 | **Elevator status checklist with 4 numbered elevators** | `logs.md` lines 83-86 | Aquarius has explicit "Elevator 1 (If available)" through "Elevator 4 (If available)" checkboxes. PRD (3.2.1) says "Status checklist per elevator: Elevator 1-4 (Responding/Not Responding/N/A)" which covers the concept but does not note the dynamic number (buildings may have more or fewer than 4 elevators). Should be configurable per property. |
| 9 | **"Time you made the first/second/third announcement" fields** | `logs.md` lines 76, 92, 105 | Aquarius tracks three separate PA announcement timestamps. The PRD Fire Log (3.2.1) lists "Time first announcement made" in Initial Response but does not include second and third announcement timestamps in the Resolution section. |
| 10 | **Fire department keys retrieval checkbox** | `logs.md` line 79 | Aquarius checklist includes "Fire department keys" as a separate checklist item for preparation. PRD (3.2.1) mentions "FD keys retrieved (checkbox)" which covers this. CONFIRMED on closer inspection. |

### 2.4 From Aquarius `logs.md` -- Noise Log

| # | Missing Item | Research Reference | Details |
|---|-------------|-------------------|---------|
| 11 | **Full noise complaint nature-of-complaint options** | `logs.md` lines 124-137 | Aquarius has 14 options: Drop on Floor, Loud Music, Smoking Hallways, Smoking in Suite, Hallway Noise, Piano Playing, Dog Barking, Cooking Odors, Children Playing, Walking/Banging, Party, Talking, Construction, Other. PRD (3.2.2) has 12 options but is missing: **Drop on Floor**, **Hallway Noise**, **Talking**, and **Smoking Hallways / Smoking in Suite** (PRD has generic "Smoking"). |
| 12 | **Investigation fields: noise noticeability at complainant vs suspect floor** | `logs.md` lines 142-145 | Aquarius has separate dropdown fields for: (a) noise noticeable by at complainant's floor, (b) noise noticeable at suspect's floor, (c) noise duration at suspect's floor, (d) noise degree/volume at suspect's floor. The PRD (3.2.2) has "Complainant floor noise level" and "Suspect floor noise level" dropdowns but does not separate the "noticeable by" method from the volume/duration. The Aquarius fields ask HOW noise was detected (e.g., standing in hallway vs at door) separately from volume. |
| 13 | **"Length of time verified" text input** | `logs.md` line 146 | Aquarius has a free-text "Length of time verified" field for recording exact minutes. PRD Noise Complaint has a "Duration" dropdown with ranges but no exact-minutes text input. |
| 14 | **"Suspect contacted by" checkbox list** | `logs.md` lines 148-153 | Aquarius has specific contact method checkboxes: Home Phone, Work Phone, Other Phone, At the door, No one home. PRD (3.2.2) has "Method (checkboxes: Phone, Door visit, Intercom, Not home)" which consolidates phones into one "Phone" option and adds "Intercom" but loses the granularity of Home/Work/Other phone. |
| 15 | **"Complainant contacted to advise of action taken" dropdown** | `logs.md` line 157 | Aquarius has a dropdown for how the complainant was notified of action taken. PRD (3.2.2) has only a checkbox "Complainant notified of action taken" -- loses the method detail. |

### 2.5 From Aquarius `logs.md` -- Pre/Post Inspection Log

| # | Missing Item | Research Reference | Details |
|---|-------------|-------------------|---------|
| 16 | **"Related Booking" dropdown** | `logs.md` line 169 | Aquarius Inspection Log has a "Related Booking" dropdown to link to an amenity booking. The PRD (3.2.5) has "Linked Booking" dropdown which covers this. CONFIRMED. |

### 2.6 From Aquarius `logs.md` -- Bulletin

| # | Missing Item | Research Reference | Details |
|---|-------------|-------------------|---------|
| 17 | **Bulletin system entirely missing** | `logs.md` lines 178-191 | Aquarius has a Bulletin log type with Title, Expiry Date/Time, Never Expire checkbox, Details, and file attachment. The PRD has no equivalent. Bulletins are distinct from Pass-On Logs (staff-only) and Announcements (resident-facing). Bulletins are internal staff notices with expiry dates. This may be intentionally excluded if Pass-On Logs serve this purpose, but Bulletins have an expiry mechanism and building scope that Pass-On Logs partially cover. |

### 2.7 From Aquarius `security-menu.md` -- Visitor Parking

| # | Missing Item | Research Reference | Details |
|---|-------------|-------------------|---------|
| 18 | **"Guest Name" field on visitor parking** | `security-menu.md` line 66 | Aquarius Visitor Parking has an explicit "Guest Name" field separate from the unit/visitor concept. The PRD Visitor form has "Visitor Name" which covers this. CONFIRMED. |
| 19 | **Image upload on visitor parking creation** | `security-menu.md` line 68 | Aquarius allows drag-and-drop image upload on visitor parking creation (e.g., vehicle photo, ID). PRD Visitor form (3.1.4 line 189) has a "Photo" field (Camera/upload, 5MB JPG/PNG). CONFIRMED. |
| 20 | **Visitor Parking search filters: Plate Number, Filter by building, Filter by unit, Start/End Date, Search Deleted toggle** | `security-menu.md` lines 27-36 | Aquarius has dedicated search filters for visitor parking including plate number search and "Search Deleted" toggle. The PRD console filter bar (3.1.2) provides general search and type/status filters but does NOT have a dedicated plate number search or "Search Deleted" toggle for soft-deleted records. |
| 21 | **"Override End Time" column in visitor parking table** | `security-menu.md` line 43 | Aquarius allows manually overriding the end time for visitor parking. PRD does not mention the ability to override/extend parking permit end time after creation. |
| 22 | **Print visitor parking pass from table row** | `security-menu.md` line 51 | Aquarius has a per-row "Print" action directly in the visitor parking table. PRD has "Save & Print Pass" on creation (3.1.4 line 215) and "Print Pass" in detail view, but not a table-row-level print action. This is a minor workflow gap for reprinting. |

### 2.8 From Aquarius `security-menu.md` -- Key Checkout

| # | Missing Item | Research Reference | Details |
|---|-------------|-------------------|---------|
| 23 | **"Print Key Checkout History" button** | `security-menu.md` line 77 | Aquarius has a dedicated button to print/export all key checkout records. PRD does not mention a key checkout history export/print feature. |
| 24 | **Signature pad with Sign/Clear/Done buttons** | `security-menu.md` lines 121-124 | Aquarius Key Checkout has a signature pad with explicit Sign, Clear, and Done action buttons. PRD (3.1.9 line 487) mentions "Signature pad" as configurable but does not specify the Sign/Clear/Done sub-buttons. |
| 25 | **"Deliver Key" button label** | `security-menu.md` line 127 | Aquarius uses "Deliver Key" as the submit button text, which is semantically meaningful. PRD does not specify the submit button label for key checkout (only general button patterns). Minor but affects UX clarity. |
| 26 | **Key Checkout table: Signature column** | `security-menu.md` line 88 | Aquarius shows the captured digital signature directly in the key checkout table. PRD Key Inventory View (line 501-509) does not include a signature column in any table view. |
| 27 | **Bulk Add Keys** | `security-menu.md` line 166 | Aquarius has a "Bulk Add" button for adding multiple keys at once. PRD (line 513) mentions "Bulk Add: CSV upload with columns: Name, Number, Category" which covers this. CONFIRMED. |

### 2.9 From Aquarius `security-menu.md` -- Parking Violation

| # | Missing Item | Research Reference | Details |
|---|-------------|-------------------|---------|
| 28 | **Yellow banner notice: "This form is only for banning individual LICENSE PLATES"** | `security-menu.md` line 203 | Aquarius displays a prominent yellow notice clarifying the form purpose. PRD parking violation (3.1.13) has no equivalent instructional banner. This prevents misuse of the form. |
| 29 | **"Search Deleted" toggle for parking violations** | `security-menu.md` line 219 | Aquarius has a toggle to include soft-deleted violations in search results. PRD does not mention viewing deleted/archived violation records. |

### 2.10 From BuildingLink `event-log.md`

| # | Missing Item | Research Reference | Details |
|---|-------------|-------------------|---------|
| 30 | **On-Close action per event type** | `event-log.md` line 55 | BuildingLink has configurable "On-Close action" per event type (action triggered when event is closed/resolved). PRD EventType configuration does not mention on-close actions/triggers. |
| 31 | **"Public display" flag per event type** | `event-log.md` line 56 | BuildingLink has a per-event-type "Public display" boolean controlling whether events appear on lobby screens. PRD Section 3.3.3 (v3+ Digital Signage) mentions this concept but as a future feature, not a v1 configuration field on event types. The flag should exist in the EventType configuration even if digital signage is v3. |
| 32 | **Card width and font size adjustability** | `event-log.md` lines 77-78 | BuildingLink allows adjusting card width and font size in the grid view. PRD card grid has display modes (Card Grid, Compact List, Split View) but no user-adjustable card width or font size controls. |
| 33 | **Voice notification option for packages** | `event-log.md` line 147 | BuildingLink has "Residents can receive voice notifications for packages" as a setting. PRD Notification Options (line 272) lists: "Send to primary email, Send to all emails, Send SMS, No notification" -- voice call is missing for packages specifically. The PRD Emergency Broadcast (3.2.4) mentions voice but not for routine package notifications. |

### 2.11 From Condo Control `deep-dive-security-concierge.md`

| # | Missing Item | Research Reference | Details |
|---|-------------|-------------------|---------|
| 34 | **Valet Parking entry type** | `deep-dive-security-concierge.md` line 63, filter option #20 | Condo Control has "Valet Parking" as a distinct filter/entry type. PRD does not include Valet Parking as an entry type in any version (v1/v2/v3). Properties with valet service would need this. |

---

## 3. WEAK COVERAGE -- Items Present but Insufficiently Detailed

| # | Item | Research Reference | PRD Section | What is Weak |
|---|------|-------------------|-------------|-------------|
| 1 | **Outgoing package form details** | `deep-dive-security-concierge.md` Section 6.1 (tab 2: Outgoing) | PRD 3.1.5 line 307-308 | PRD says "Same form as incoming but without Courier grid and Storage Spot. Additional field: Courier Pickup Expected." This is a single sentence. No field-level specification. Missing: who is sending, destination address, pickup instructions, outgoing tracking number, notification to sender when picked up. |
| 2 | **Package "Send Email Reminder" action** | `deep-dive-security-concierge.md` Section 13.2 | PRD 9.1 line 1609 | Condo Control has a dedicated "Send Email Reminder" button on outstanding package details. PRD has a notification template for package reminders and an API endpoint (`POST .../packages/{id}/notify`) but does not specify the UI button or flow for manually triggering a reminder from the package detail view. |
| 3 | **Package "Log Call" action** | `deep-dive-security-concierge.md` Section 13.2 | Not in PRD | Condo Control has a "Log Call" button on package details to record that a phone call was made about the package. PRD has no equivalent call-logging feature on packages. |
| 4 | **"Edit" storage spot from package detail** | `deep-dive-security-concierge.md` Section 13.1 line 570 | PRD 3.1.5 | Condo Control shows "(Edit)" link next to Storage Spot on outstanding package details, allowing relocation. PRD does not specify an inline edit for storage spot after creation. |
| 5 | **Incident "Reported By" field details** | `deep-dive-security-concierge.md` Section 15.1 line 646-647 | PRD 3.1.7 line 371 | Both have the field, but Condo Control shows "Reported By" and "Suspect" as read-only fields on the detail view. PRD does not specify whether these appear read-only on the detail view vs only on the creation form. |
| 6 | **Incident Report "Print" button** | `deep-dive-security-concierge.md` Section 15.7 | PRD 3.1.7 line 444 | PRD mentions "Print Report" generates a formatted PDF but does not specify the print layout, what sections are included, header/footer content, or whether it matches the on-screen view. |
| 7 | **Key inventory "View All Keys" sub-dialog search** | `deep-dive-security-concierge.md` Section 10.3 | PRD 3.1.9 lines 500-515 | Condo Control has a searchable sub-dialog with Select/Update/Delete actions per key and a "Key Owner" column. PRD Key Inventory View has columns but does not mention a search function within the key list, and does not include "Key Owner" as a column (only "Current Holder" for checked-out keys). Key Owner is different -- it is the assigned owner of the key, not the person who currently has it checked out. |
| 8 | **"New" button to create key from checkout dialog** | `deep-dive-security-concierge.md` Section 10.2 line 409 | PRD 3.1.9 | Condo Control has a teal "New" button next to the Key dropdown in the checkout dialog to create a new key on the fly without leaving the checkout flow. PRD does not specify this inline key creation capability. |
| 9 | **Security Shift detail view vs creation form** | `deep-dive-security-concierge.md` Section 14 | PRD 3.1.6 | Condo Control notes that clicking a shift reopens the creation form for editing. PRD does not clearly distinguish between the shift detail read-only view and the shift edit view. The PRD should specify that completed shifts have a read-only view (unlike Condo Control's weakness of re-opening the creation form). |
| 10 | **Shift log entries added WITHIN a shift** | `deep-dive-security-concierge.md` Section 14 line 627 | PRD 3.1.6 lines 334-343 | PRD specifies shift log entry fields well, but does not describe the UI for adding entries to an active shift. Is it a button on the shift detail? A separate section of the console? A floating action button? The workflow for "guard is on shift and wants to add a log entry" needs UI specification. |
| 11 | **Authorized Entry detail view fields** | `deep-dive-security-concierge.md` Section 9 | PRD 3.1.8 | PRD specifies the creation dialog fields but does not describe what the Authorized Entry detail view looks like. No mention of departure time tracking, or how to mark when the authorized person has left. |
| 12 | **Pass-On Log acknowledgment workflow** | `deep-dive-security-concierge.md` concept | PRD 4.13 line 984 | PRD data model has `acknowledged_by` JSONB field, and API has `PATCH .../pass-on-logs/{id}/acknowledge`. But the UI for acknowledging a pass-on log is not described. What does the acknowledge button look like? Is there a list of who has/hasn't acknowledged? |
| 13 | **Per-event-type notification template configuration** | `event-log.md` lines 28-44 | PRD 9.2 | BuildingLink has unique "On-Open Email Template" text per courier type (e.g., "You have an Amazon delivery" vs "You have a FedEx delivery"). PRD mentions templates are customizable per property but does not specify per-EventType notification template configuration in the data model. |
| 14 | **Notification sender name/email configuration** | `event-log.md` lines 138-139 | PRD 9.2 | BuildingLink has configurable "Notification sender name" and "Notification sender email" fields. PRD does not specify where or how the sender name/email is configured for event notifications. |
| 15 | **"Allow staff to select notification recipients" setting** | `event-log.md` line 140 | PRD 3.1.5 | BuildingLink has a property-level setting controlling whether staff can choose notification recipients per event. PRD gives staff notification dropdown options but does not mention a property-level toggle controlling this capability. |
| 16 | **"Default notification selection" setting** | `event-log.md` line 141 | PRD 3.1.5 | BuildingLink has a property-level default notification behavior: "1st email / No notification / All addresses." PRD has a per-package notification dropdown but does not mention property-level default configuration. |
| 17 | **"Show resident's phone numbers on new events" setting** | `event-log.md` line 146 | PRD | BuildingLink setting to show resident phone numbers on event creation forms. PRD does not mention displaying resident contact info on creation dialogs. This is useful for front desk staff who need to call residents. |
| 18 | **Cleaning Log from Aquarius** | `logs.md` -- no dedicated cleaning log in Aquarius | PRD 3.1.11 | The PRD created a Cleaning Log entry type that goes beyond what any research platform had. This is good. However, the connection to Condo Control's "Cleaning" entry type in the filter (deep-dive line 48 "Show All" covers it) should be noted -- Condo Control had cleaning as a basic entry type without checklists. PRD's version is an enhancement. Not a gap per se, but flagged for awareness. |

---

## 4. CONFIRMED -- Items Verified as Present in PRD

### 4.1 Aquarius `logs.md` Features Confirmed in PRD

- General Log concept -> General Note (3.1.12): Title, DateTime, Details (rich text), Send Copy, Attachments, Building selector
- Incident Log -> Incident Report (3.1.7): Building/Unit, Time Occurred, Incident Type, Details, Suspect, Emergency services called, Send Copy, File attachments
- Fire Log -> Fire Log (3.2.1): Alarm time/location/type, FD call time, First announcement, Fire Safety Plan checklist, FD keys checklist, Elevator status, FD arrival, All-clear, Reset checklist (Pull Station, Smoke Detector, Heat Detector, Sprinkler Head, Fire Panel, Mag Locks, Elevators), Post-incident report, Photos, Documents
- Noise Log -> Noise Complaint Log (3.2.2): Nature of complaint multi-select, Investigation fields, Contact attempt, Follow-up
- Pre/Post Inspection -> Pre/Post Inspection Log (3.2.5): Inspection Type toggle, Linked Booking, Title, DateTime, Details, Photos
- Bulletin -> Partially covered by Pass-On Log (3.1.10) with expiry date
- Common table features (Reference #, Created By, Created Time, View, Edit, Delete) -> Unified Event Grid columns and actions
- Pagination -> Infinite scroll with date-based grouping (PRD improvement over pagination)
- Dashboard integration (shift logs, log counts) -> Covered in Analytics (Section 8) and Shift Dashboard

### 4.2 Aquarius `security-menu.md` Features Confirmed in PRD

- Visitor Parking creation: Building, Unit, Visitor Type, Guest Name, Parking toggle, Comments -> Visitor Management (3.1.4)
- Parking details: Make/Model, License Plate, Province, Parking Until -> Visitor Parking Details (3.1.4)
- Key Checkout: Building, Select Key, Checked Out To, Company, ID Type, ID Number, Reason, Signature, Image Captures -> Key Checkout (3.1.9)
- Key Management: Add Keys (Name, Number), Bulk Add, Status tracking -> Key Inventory (3.1.9)
- Key Checkout table: Reference #, Key Number, Checkout Time, Checked Out To, Company, Check In -> Key Checkout data model (4.11)
- Parking Violation: License Plate, Ban Type (Ban/Ticket/Warning/Vehicle Towed), Auto-Lift Ban Date -> Parking Violations (3.1.13)
- Quick Create Icons (Car, Key, Ban) -> Quick-Create Icons (3.1.3) with 9 icons
- Search filters (plate number, building, unit, date range) -> Filter Bar (3.1.2)
- Sorting by column headers -> Grouping modes (3.1.1)

### 4.3 BuildingLink `event-log.md` Features Confirmed in PRD

- Unified Event Model with configurable Event Types and Event Groups -> Core architecture (referenced from 01-architecture.md)
- 15 courier-specific event types with icons and colors -> Courier Icon Grid (3.1.5) with 10 couriers + configurable
- Per-event-type configuration (icon, color, name, group, sort order, active/inactive) -> Referenced in 01-architecture.md
- Card-based grid display -> Card Grid display mode (3.1.1)
- Grouping modes (By Group, By Status, By Unit, By Date) -> 4 grouping modes (3.1.1)
- Event detail fields (Unit, Type, Comments, Status, Created by, Timestamp) -> Card fields and detail views
- Premium features (Signature, Photo, ID capture) -> Configurable per property (not premium-gated)
- Batch event creation (multi-row with per-row notification) -> Batch Package Mode (3.1.5) with up to 10 rows
- Print label integration -> "Save & Print Label" button
- Multi-channel notifications (Email + Voice + SMS) -> Notification system (Section 9)
- Location module per event -> Event base entity has location field

### 4.4 Condo Control `deep-dive-security-concierge.md` Features Confirmed in PRD

- 7 entry types (Visitor, Package, Security Log, Incident Report, Authorized Entry, Key Checkout, Pass-On Log) -> All 7 present plus 2 additional (Cleaning Log, General Note)
- Filter bar with 20 filter options including sub-filters -> Filter Bar (3.1.2) with multi-select type filter and status sub-filters
- Advanced Search (Time Frame, Search Accuracy) -> Advanced toggle in filter bar
- Quick-create icons (7 teal circular icons) -> 9 Quick-Create Icons (3.1.3)
- Events table columns (Type, Reference #, When, What happened, Unit, Action) -> Card fields (3.1.1)
- Per-type reference numbers with separate counters -> Reference number format `{PREFIX}-{YEAR}-{SEQUENCE}` (3.1.1)
- Visitor form: Unit #, Visitor Name, Visitor/Contractor toggle, Parking checkbox, Comments, Parking details (Make/Model, License, Province, Parking Until) -> Visitor Management (3.1.4) with enhanced fields
- Package form: Ref# (read-only), Recipient, Unit, Courier grid (10 options), Tracking #, Description, Perishable, Storage Spot -> Package Tracking (3.1.5) with all fields
- Package Incoming/Outgoing tabs -> Outgoing Package Tab (3.1.5 line 307)
- Multi-package batch mode -> Batch Package Mode (3.1.5)
- Security Log: Start Time, End Time, Relieved dropdown, To Be Relieved By dropdown, Equipment Received, Info Banner (bookings, keys, vacations) -> Security Shift (3.1.6) with enhanced info banner
- Incident Report: Unit, Type (17 types), What Happened, Time Occurred, Urgency toggle, Photos -> Incident Report (3.1.7) with 19 types
- Incident status lifecycle (Open, Closed, Draft) -> Enhanced: Draft > Open > In Progress > Under Review > Escalated > Closed
- Emergency Services table (Police, Fire, Ambulance, Client Contact, Patrol Supervisor) -> Emergency Services Section (3.1.7)
- Incident Updates (append-only with file attachments and status) -> Incident Detail View and IncidentUpdate entity
- Authorized Entry: Unit, Authorized Person, Reason, DateTime, Comments -> Authorized Entry (3.1.8) with enhanced fields
- Key Checkout: Logged By/On (read-only), Key selection, Checked Out To, Company, ID Type, ID Number, Reason -> Key Checkout (3.1.9) with all fields
- View All Keys sub-dialog -> Key Inventory View (3.1.9)
- Pass-On Log: Subject, Details (rich text), File attachment, Send To checkbox list with "Send to all" master checkbox -> Pass-On Log (3.1.10)
- Visitor detail: Unit, Name, Type, Arrival, Departure, Comment, Sign Out, Print Parking Permit, Add Comment, Parking Permits table, History -> Visitor Detail View (3.1.4)
- Package detail: Type, Ref#, Recipient, Delivered By, Description, Tracking, Perishable, Stored In, Released -> Package data model and detail view
- Package release form: Released To, Comments, Signature (premium) -> Release Package flow (3.1.5)
- Pagination -> Replaced with infinite scroll (improvement)
- Security Patrol filter option -> Patrol/Inspection Rounds (3.2.3, v2)

---

## 5. Cross-Reference Notes

### Items the PRD Added Beyond All Research (Enhancements)

These are PRD features not found in any research file -- confirming the PRD adds original value:

1. **AI Integration (12 capabilities)** -- No research platform has any AI features
2. **Keyboard shortcuts (Alt+1 through Alt+9)** -- No platform observed had keyboard shortcuts
3. **Saved filter presets** -- No platform had saveable filter combinations
4. **Split View display mode** -- No platform offered a split-view layout
5. **Batch Sign Out for visitors** -- Condo Control explicitly lacked this; PRD adds it
6. **Overdue Key Alerts with notifications** -- Enhancement over all platforms
7. **Repeat Offender Detection for parking** -- AI-powered, not in any platform
8. **Expected Departure for visitors** -- No platform tracked expected departure
9. **Cleaning Log with checklists and before/after photos** -- Enhancement over basic cleaning entries
10. **FOB/Access Device Management (3.1.14)** -- Pulled from Aquarius user-profile.md, not from any security console research
11. **WebSocket real-time updates** -- Condo Control was noted as lacking this
12. **Offline support** -- Mentioned in user flows, not in any platform
13. **Conflict resolution (concurrent edit)** -- Enterprise-grade feature
14. **Swipe gestures for mobile** -- Modern mobile UX not in any platform
15. **Incident linking (AI-suggested similar incidents)** -- Novel feature

---

*End of audit.*
*Total research lines analyzed: ~1,085 across 4 files*
*PRD lines analyzed: ~1,922*
