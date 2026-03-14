# Deep Dive: Logs Menu (Aquarius / ICON)

> **Platform**: Aquarius Condo Management Portal
> **Property**: TSCC 2584 — The Bond
> **URL**: `https://aquarius.iconconnect.ca/logs`
> **Documented by**: Claude Code (automated deep-dive)
> **Date**: 2026-03-13

---

## 1. Page Overview

**Title**: "Logs Menu"

The Logs Menu is a single scrollable page with 6 log type sections stacked vertically. Each section has:
1. A **Create** button (navy blue, full-width style)
2. A **View All** link (top-right, links to `/log-management`)
3. A **Recent entries table** (5 rows default, paginated)

### Log Types (6 total)

| # | Log Type | Create Button | Table Columns | Has Download | Has Delete |
|---|----------|--------------|---------------|--------------|------------|
| 1 | General Log | Create General Log | Reference #, Title, Creation By, Creation Time, View, Edit, Delete | No | Yes |
| 2 | Incident Log | Create Incident Log | Reference #, Title, Creation By, Creation Time, View, Download, Edit, Delete | Yes | Yes |
| 3 | Fire Log | Create Fire Log | Reference #, Title, Creation By, Creation Time, View, Download, Edit, Delete | Yes | Yes |
| 4 | Noise Log | Create Noise Log | Reference #, Title, Creation By, Creation Time, View, Download, Edit, Delete | Yes | Yes |
| 5 | Inspection Log | Create Inspection Log | Reference #, Type, Title, Booking Id, Creation By, Creation Time, View, Edit, Delete | No | Yes |
| 6 | Bulletin | Create Bulletin | Reference #, Title, Creation By, Set as 'Never Expire', Expiry Date, View, Edit | No | No |

**Key Observations**:
- General Log has no Download column
- Incident, Fire, and Noise logs all have a Download column (PDF export)
- Inspection Log has unique columns: "Type" and "Booking Id" (links to amenity bookings)
- Bulletin has no Delete column and has unique columns: "Set as 'Never Expire'" and "Expiry Date"
- All tables have standard pagination: 5/10/20/25/50/100 rows, Previous/Next, page number

---

## 2. Create General Log Modal

**Modal Title**: "General Log"

| Field | Type | Required | Default | Details |
|-------|------|----------|---------|---------|
| Select Building | Dropdown (combobox) | Yes | "Select Building:" placeholder | Building selector |
| Related Unit | Dropdown (combobox) | No | "Related Unit:" placeholder | Unit selector |
| Post in all buildings | Checkbox | No | Unchecked | "Post in all buildings (Your log will be posted in all the buildings you have access to)" |
| Title | Text input | Yes | "Title" placeholder | Free text |
| Event Date and Time | DateTime picker | Yes | Current datetime (DD-MM-YYYY HH:MM) | X button to clear |
| Send Copy | Dropdown (combobox, multi-select) | No | "Send Copy:" placeholder | "Optionally select recipients that should receive an email copy" |
| General log Details | Rich text editor (WYSIWYG) | Yes | Empty | Full Froala-style editor with 2 toolbar rows |
| **Save and Exit** | Submit button | — | — | Saves and closes modal |
| **Save and New** | Submit button | — | — | Saves and opens fresh form |

### Rich Text Editor Toolbar (2 rows)

**Row 1**: Undo, Redo, Bold, Italic, Underline, Strikethrough, Font Family (System Font), Font Size (12pt), Paragraph style, Align Left/Center/Right/Justify, Indent/Outdent, Ordered List, Unordered List, Checklist

**Row 2**: Font Color, Highlight Color, Clear Formatting, Subscript, Superscript, Insert Table, Special Characters, Emoji, Fullscreen, Preview, Download, Print, Insert Image, Insert Video, Insert File, Insert Link, Person Mention, Bookmark, Code View, Horizontal Rule, Page Break, Paragraph Format, Spell Check toggle

**Word Count**: Displayed at bottom-right ("0 WORDS")

**Note**: General Log is the ONLY log type that uses a rich text editor. All other logs use plain textarea.

**Note**: General Log is the ONLY log type with "Save and Exit" + "Save and New" buttons. All other logs have a single "Save" button.

---

## 3. Create Incident Log Modal

**Modal Title**: "Incident Log"

| Field | Type | Required | Default | Details |
|-------|------|----------|---------|---------|
| Select Building | Dropdown (combobox) | Yes | "Select Building:" placeholder | Building selector |
| Related Unit | Dropdown (combobox) | No | "Related Unit:" placeholder | Unit selector |
| Time Incident Occured | DateTime picker | No | Current datetime (DD-MM-YYYY HH:MM) | Note: label has typo "Occured" instead of "Occurred" |
| Incident Title | Text input | No | "Incident Title:" placeholder | Free text |
| Incident Type | Dropdown (combobox) | No | "Incident Type:" placeholder | 17 options (see below) |
| Incident Details | Rich text editor (WYSIWYG) | Yes | "Full Report to Follow..." | Same toolbar as General Log |
| Suspect | Text input | No | "Suspect:" placeholder | Free text |
| Were police/fire department etc called ? | Toggle switch | No | Off | Boolean toggle, no conditional fields |
| Send Copy | Dropdown (combobox, multi-select) | No | "Send Copy:" placeholder | Email recipients |
| Attach any files | File upload | No | Empty | Max 4 files, multi-select with CTRL/CMD |
| **Save** | Submit button | — | — | Single save button |

### Incident Type Options (17)

| # | Option |
|---|--------|
| 1 | Floods/Leaks |
| 2 | Visitors Parking Violation |
| 3 | Noise Complaints |
| 4 | Elevator Entrapment |
| 5 | Property Damage |
| 6 | Pet's Discharge |
| 7 | Rules Infraction |
| 8 | Theft |
| 9 | Trespassers |
| 10 | Lost and Found |
| 11 | Garbage Chute Issues |
| 12 | Unauthorised Usage of Amenities |
| 13 | Mechanical Room Occurrence |
| 14 | Supervisory or Trouble Alarms |
| 15 | Accidents |
| 16 | Death |
| 17 | Other |

---

## 4. Create Fire Log Modal

**Modal Title**: "Fire Logs"

This is the most complex and specialized log form, designed as a step-by-step fire incident documentation workflow.

### Base Fields

| Field | Type | Required | Default | Details |
|-------|------|----------|---------|---------|
| Select Building | Dropdown (combobox) | Yes | "Select Building:" placeholder | Building selector |
| Related Unit | Dropdown (combobox) | No | "Related Unit:" placeholder | Unit selector |
| Log Title | Text input | Yes | "Log Title" placeholder | Free text |
| Start Date and Time | DateTime picker | Yes | Empty (calendar icon) | No default time set |
| Time fire alarm went off | DateTime picker | Yes | Empty (calendar icon) | When the alarm activated |
| Where is the alarm? | Text input | Yes | "Where is the alarm?" placeholder | Location description |
| What kind of alarm? | Text input | Yes | "What kind of alarm?" placeholder | Alarm type description |
| Time you called the fire department | DateTime picker | Yes | Empty (calendar icon) | When FD was called |
| Time you made the first anouncement | DateTime picker | Yes | Empty (calendar icon) | Note: typo "anouncement" |

### Prepare for Fire Department Arrival (Checklist)

| Checkbox | Default |
|----------|---------|
| Fire Safety Plan | Unchecked |
| Fire department keys | Unchecked |
| List of residents that need fire assistance | Unchecked |

### Ensure Elevators Respond (Checklist)

| Checkbox | Default |
|----------|---------|
| Elevator 1 (If available) | Unchecked |
| Elevator 2 (If available) | Unchecked |
| Elevator 3 (If available) | Unchecked |
| Elevator 4 (If available) | Unchecked |

### Post-Arrival Fields

| Field | Type | Required | Default | Details |
|-------|------|----------|---------|---------|
| Time fire department arrives | DateTime picker | Yes | Empty (calendar icon) | FD arrival time |
| Time you made the second anouncement | DateTime picker | No | Empty (calendar icon) | Note: typo "anouncement" |
| Time fire department gives all clear | DateTime picker | No | Empty (calendar icon) | All-clear time |

### Reset Electronic Devices (Checklist)

| Checkbox | Default |
|----------|---------|
| Pull Station | Unchecked |
| Smoke Detector | Unchecked |
| Heat Detector | Unchecked |
| Sprinkler Head | Unchecked |
| Fire Panel | Unchecked |
| Mag Locks | Unchecked |
| Elevators | Unchecked |

### Final Fields

| Field | Type | Required | Default | Details |
|-------|------|----------|---------|---------|
| Time you made the third announcement | DateTime picker | No | Empty (calendar icon) | Third announcement |
| Time of fire department departure | DateTime picker | Yes | Empty (calendar icon) | FD departure time |
| Fire log Details | Textarea (plain text) | Yes | "Full Report to Follow..." | Plain textarea, NOT rich text |
| Send Copy | Dropdown (combobox, multi-select) | No | "Send Copy:" placeholder | Email recipients |
| Attach any files | File upload | No | Empty | Max 4 files, multi-select with CTRL/CMD |
| **Save** | Submit button | — | — | Single save button |

**Total fields in Fire Log**: ~25+ (most of any log type)

---

## 5. Create Noise Log Modal

**Modal Title**: "Noise Logs"

### Base Fields

| Field | Type | Required | Default | Details |
|-------|------|----------|---------|---------|
| Select Building | Dropdown (combobox) | Yes | "Select Building:" placeholder | Building selector |
| Related Unit | Dropdown (combobox) | No | "Related Unit:" placeholder | Unit selector |
| Title | Text input | No | "Title" placeholder | Free text |
| Event Date and Time | DateTime picker | No | Empty (calendar icon) | No default time set |

### Nature of Complaint (Checkboxes — multi-select)

| # | Checkbox | Default |
|---|----------|---------|
| 1 | Drop on Floor | Unchecked |
| 2 | Loud Music | Unchecked |
| 3 | Smoking Hallways | Unchecked |
| 4 | Smoking in Suite | Unchecked |
| 5 | Hallway Noise | Unchecked |
| 6 | Piano Playing | Unchecked |
| 7 | Dog Barking | Unchecked |
| 8 | Cooking Odors | Unchecked |
| 9 | Children Playing | Unchecked |
| 10 | Walking/Banging | Unchecked |
| 11 | Party | Unchecked |
| 12 | Talking | Unchecked |
| 13 | Construction | Unchecked |
| 14 | Other | Unchecked |

### Investigation Dropdowns (4 required fields)

#### Upon investigating the complainant's floor the noise was noticeable by: *

| Option |
|--------|
| Standing in the hallway |
| Only inside the complainant's suite |

#### Upon investigating the suspect's floor the noise was noticeable: *

| Option |
|--------|
| On Approach to the suite |
| Standing in the hallway |
| Only at the door |
| Only inside the suite |

#### Upon investigating the suspect's floor the noise duration was: *

| Option |
|--------|
| Continuous |
| Infrequent/Momentarily |
| Other |
| (If Dog Barking) Only with the movement of elevator traffic |
| (If Dog Barking) Only with movement in hallway or at the door |

#### Upon investigating the suspect's floor the noise degree/volume was: *

| Option |
|--------|
| Not heard from outside the suite |
| Barely heard from outside the suite |
| Noticeable but acceptable |
| Unacceptable |

### Additional Fields

| Field | Type | Required | Default | Details |
|-------|------|----------|---------|---------|
| Length of time verified | Text input | No | "Length of time verified: (In Minutes) *" placeholder | Duration in minutes |

### Suspect Contacted By (Checkboxes — multi-select)

| # | Checkbox | Default |
|---|----------|---------|
| 1 | Home Phone | Unchecked |
| 2 | Work Phone | Unchecked |
| 3 | Other Phone | Unchecked |
| 4 | At the door | Unchecked |
| 5 | No one home | Unchecked |

### Final Fields

| Field | Type | Required | Default | Details |
|-------|------|----------|---------|---------|
| Complainant contacted to advise of action taken | Dropdown (combobox) | Yes | Placeholder text | Options: **Yes**, **No** |
| Noise log Details | Textarea (plain text) | Yes | "Full Report to Follow..." | Plain textarea |
| Send Copy | Dropdown (combobox, multi-select) | No | "Send Copy:" placeholder | Email recipients |
| Attach any files | File upload | No | Empty | Max 4 files, multi-select with CTRL/CMD |
| **Save** | Submit button | — | — | Single save button |

---

## 6. Create Inspection Log Modal

**Modal Title**: "Pre/Post Inspection Logs"

The simplest log form. Used for pre/post-inspection of amenity bookings (e.g., party room before/after use).

| Field | Type | Required | Default | Details |
|-------|------|----------|---------|---------|
| Select Inspection Type | Dropdown (combobox) | Yes | "Pre Inspection" | Options: **Pre Inspection**, **Post Inspection** |
| Select Building | Dropdown (combobox) | Yes | "Select Building:" placeholder | Building selector |
| Related Booking | Dropdown (combobox) | No | "Related Booking:" placeholder | Links to amenity bookings |
| Title | Text input | Yes | "Title" placeholder | Free text |
| Inspection Date and Time | DateTime picker | Yes | Current datetime (DD-MM-YYYY HH:MM) | X button to clear |
| Inspection Details | Textarea (plain text) | Yes | "Inspection Details" placeholder | Plain textarea, no default text |
| **Save** | Submit button | — | — | Single save button |

**Note**: No file attachment, no email copy, no rich text editor. This is the simplest of all 6 log forms.

**Note**: The "/" separator next to the Inspection Type dropdown appears to be a UI artifact or separator between the type and another element.

---

## 7. Create Bulletin Modal

**Modal Title**: "Bulletin"

Bulletins are staff-targeted notices with expiry dates. They differ from announcements (which are resident-facing).

| Field | Type | Required | Default | Details |
|-------|------|----------|---------|---------|
| Select Building | Dropdown (combobox) | No | "Select Building:" placeholder | Building selector |
| Title | Text input | Yes | "Title" placeholder | Free text |
| Expiry Date and Time | DateTime picker | No | 7 days from now (DD-MM-YYYY HH:MM) | Default is current time + 7 days. X button to clear |
| Never Expire | Checkbox | No | Unchecked | When checked, bulletin has no expiry |
| Bulletin Details | Textarea (plain text) | Yes | "Bulletin Details" placeholder | Plain textarea |
| Attach a file | File upload | No | Empty | Single file only (NOT Max 4 like other logs) |
| Select recipients | Dropdown (combobox, multi-select) | Yes | "Send To:" placeholder | "Select recipients that should be able to see this bulletin (Bulletins are not visible to every staff member by default anymore)" — with Clear button |
| **Save** | Submit button | — | — | Single save button |

**Key Distinction**: Bulletins are TARGETED — they are NOT visible to all staff by default. You must select specific recipients. This is different from all other log types.

---

## 8. Log Management Menu (View All)

**URL**: `/log-management`
**Title**: "Log Management Menu"

A unified view of all logs across all types (except Inspection Logs and Bulletins).

### Filters

| Filter | Type | Default | Details |
|--------|------|---------|---------|
| Clear Search | Button (blue outline) | — | Resets all filters |
| Keyword | Text input with search icon | Empty | "Keyword.." placeholder |
| Log Category | Dropdown (combobox) | Empty (all categories) | Options: **Fire Logs**, **Noise Logs**, **Incident Logs**, **General Logs** |
| Start Date | Date picker (DD-MM-YYYY) | 7 days ago | X button to clear |
| End Date | Date picker (DD-MM-YYYY) | 2 days from now | X button to clear |
| Search by Author | Dropdown (combobox) | "Search by Author" placeholder | Staff member filter |
| Filter by unit | Dropdown (combobox) | "Filter by unit:" placeholder | Unit filter |

### Action Buttons

| Button | Style | Action |
|--------|-------|--------|
| Search | Blue outline | Execute search with current filters |
| Email | Blue filled with cloud icon | Email search results |
| Print | Blue filled with printer icon | Print search results |

### Table Columns (7 columns)

| Column | Type | Description |
|--------|------|-------------|
| Title | Text | Log title |
| Type | Text | Log category (e.g., "General log", "Incident log", "Fire log", "Noise log") |
| Author | Text | Staff who created the log |
| Created At | DateTime | Creation timestamp (YYYY-MM-DD HH:MM format) |
| Updated At | DateTime | Last update timestamp (YYYY-MM-DD HH:MM format) |
| View | Action button | Blue "View {Type} Log" button (e.g., "View General Log") |
| Download | Action button | Download icon (for Incident/Fire/Noise logs only) |
| Delete | Action button | Red "Delete" button |

**Note**: Date format in this table uses YYYY-MM-DD (different from the DD-MM-YYYY used in the Logs Menu tables).

**Note**: No pagination controls visible — this may use infinite scroll or load all results.

**Note**: Inspection Logs and Bulletins are NOT included in the Log Management view. They are only accessible from the Logs Menu page.

---

## 9. Cross-Log Comparison Matrix

| Feature | General | Incident | Fire | Noise | Inspection | Bulletin |
|---------|---------|----------|------|-------|------------|----------|
| Rich text editor | ✅ WYSIWYG | ✅ WYSIWYG | ❌ Plain textarea | ❌ Plain textarea | ❌ Plain textarea | ❌ Plain textarea |
| File attachment | ❌ | ✅ Max 4 | ✅ Max 4 | ✅ Max 4 | ❌ | ✅ Single file |
| Email copy (Send Copy) | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ (has recipients) |
| Default detail text | Empty | "Full Report to Follow..." | "Full Report to Follow..." | "Full Report to Follow..." | Empty | Empty |
| Save buttons | Save and Exit + Save and New | Save | Save | Save | Save | Save |
| Post in all buildings | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Related Unit | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Related Booking | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| Incident Type dropdown | ❌ | ✅ (17 options) | ❌ | ❌ | ❌ | ❌ |
| Inspection Type | ❌ | ❌ | ❌ | ❌ | ✅ (Pre/Post) | ❌ |
| Suspect field | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Police/fire called toggle | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Checklists | ❌ | ❌ | ✅ (3 sections, 14 items) | ✅ (2 sections, 19 items) | ❌ | ❌ |
| Investigation dropdowns | ❌ | ❌ | ❌ | ✅ (4 dropdowns) | ❌ | ❌ |
| Timeline fields (datetimes) | 1 | 1 | 8 | 1 | 1 | 1 |
| Expiry date | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Never Expire option | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| Targeted recipients | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| In Log Management | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Has Download (PDF) | ❌ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Approx. field count | 8 | 10 | 25+ | 25+ | 6 | 7 |

---

## 10. URL Patterns

| Page | URL |
|------|-----|
| Logs Menu (all 6 sections) | `/logs` |
| Log Management (View All) | `/log-management` |

**Note**: All 6 creation forms are modals on the `/logs` page — no separate URLs for creating logs.

---

## 11. Concierge Design Implications

### Strengths to Retain
1. **Specialized fire log workflow** — Step-by-step fire incident documentation with timeline tracking (8 datetime fields), preparation checklists, and equipment reset verification. This is genuinely useful for fire code compliance.
2. **Noise log investigation structure** — The 4 investigation dropdowns (complainant floor, suspect floor, duration, volume) create a standardized noise complaint process. This produces defensible documentation for bylaw enforcement.
3. **Incident type categorization** — 17 predefined incident types enable meaningful reporting and analytics (e.g., "How many elevator entrapments this year?").
4. **Bulletin with targeted recipients** — Staff-only notices that are NOT visible by default, requiring explicit recipient selection. Good for sensitive operational communications.
5. **Pre/Post inspection linked to bookings** — Inspection logs connect to amenity bookings, creating an audit trail for amenity condition before/after use.
6. **General Log as shift report** — The dual save buttons ("Save and Exit" + "Save and New") and rich text editor make General Log ideal for shift handoff reports.
7. **Download/PDF export on incident-type logs** — Incident, Fire, and Noise logs can be downloaded (likely as PDF), critical for legal/insurance documentation.
8. **Default "Full Report to Follow..." text** — Smart UX for time-sensitive incidents where a quick entry is needed now, with details added later.
9. **Log Management unified search** — Cross-category search with keyword, author, unit, and date filters allows finding any log entry quickly.
10. **Email and Print from Log Management** — Bulk export capabilities for audit trails.

### Gaps to Address in Concierge
1. **No unified event model** — 6 rigid log types with completely different form structures. Concierge should use configurable event types, not hardcoded forms.
2. **Inconsistent editor types** — General Log gets a rich text editor; all others get plain textarea. Either all should have rich text or none should.
3. **No photo/image capture** — None of the 6 log types support photo upload (only file attachment on 3 types). Security incidents NEED photo evidence.
4. **No GPS/location tagging** — Fire and incident logs ask "where" in a free text field. Should support building floor plans or location pins.
5. **No status lifecycle** — Logs are created but never have statuses (open/in-progress/resolved/closed). An incident should track through to resolution.
6. **No follow-up/linked entries** — "Full Report to Follow..." implies a follow-up, but there's no mechanism to link the initial quick entry to the detailed follow-up.
7. **Inspection logs not in Log Management** — Pre/Post Inspections are siloed from the unified log view. All log types should be searchable in one place.
8. **Bulletins not in Log Management** — Same issue — bulletins are separate from the unified view.
9. **No notification on log creation** — Creating an incident doesn't automatically notify property managers. Only manual "Send Copy" is available.
10. **Fire log is overwhelming** — 25+ fields in a single modal is too many. Should use a multi-step wizard/stepper pattern.
11. **No templates** — Shift reports are the most common log type, yet staff must write from scratch every time. Templates would save time.
12. **No log approval workflow** — Sensitive logs (incidents, fire) should require supervisor review/approval before being finalized.
13. **Noise log is property-specific** — The investigation dropdowns are tailored to a specific noise bylaw process. Concierge should make this configurable.
14. **No dashboard/analytics for logs** — No charts showing incident trends, fire alarm frequency, noise complaint patterns over time.
15. **Typos in field labels** — "Time Incident Occured" and "first anouncement" have spelling errors. Indicates lack of polish.

### Architectural Notes
- All 6 log types share the same modal pattern but have completely different internal structures
- General Log is the only type with a rich text editor (Froala/similar with 30+ toolbar buttons)
- Fire Log has the most fields (~25+), Inspection Log has the fewest (~6)
- Log Management page only shows 4 of 6 log types (excludes Inspection and Bulletin)
- Date format is inconsistent: DD-MM-YYYY in Logs Menu tables vs YYYY-MM-DD in Log Management table
- Bulletin has unique "targeted recipients" pattern — not broadcast to all staff
- "Post in all buildings" checkbox is unique to General Log
- "Related Booking" dropdown is unique to Inspection Log
- File attachment limit: Max 4 files for Incident/Fire/Noise, Single file for Bulletin, None for General/Inspection

---

## 12. Data Model (Deduced)

```
LogEntry (base — shared fields across all 6 log types)
├── reference_number (integer, auto-generated)
├── log_type (enum: General, Incident, Fire, Noise, Inspection, Bulletin)
├── building_id → Building
├── related_unit_id → Unit (nullable)
├── title (string)
├── created_by → User (staff)
├── created_at (datetime)
├── updated_at (datetime)
└── deleted (boolean, default: false — soft delete)

GeneralLog extends LogEntry
├── event_datetime (datetime)
├── details (rich text — WYSIWYG editor)
├── post_in_all_buildings (boolean, default: false)
└── send_copy_recipients[] (string — email addresses)

IncidentLog extends LogEntry
├── time_incident_occurred (datetime)
├── incident_type (enum: Floods/Leaks, Visitors Parking Violation, Noise Complaints,
│   Elevator Entrapment, Property Damage, Pet's Discharge, Rules Infraction,
│   Theft, Trespassers, Lost and Found, Garbage Chute Issues,
│   Unauthorised Usage of Amenities, Mechanical Room Occurrence,
│   Supervisory or Trouble Alarms, Accidents, Death, Other)
├── details (rich text — WYSIWYG editor)
├── suspect (string, nullable)
├── police_fire_called (boolean, default: false)
├── send_copy_recipients[] (string — email addresses)
├── attachments[] (file, max 4)
└── downloadable_pdf (boolean, true)

FireLog extends LogEntry
├── start_datetime (datetime)
├── time_alarm_went_off (datetime)
├── alarm_location (string)
├── alarm_type (string)
├── time_called_fire_department (datetime)
├── time_first_announcement (datetime)
├── preparation_checklist → FirePreparationChecklist
├── elevator_checklist → ElevatorResponseChecklist
├── time_fire_department_arrives (datetime)
├── time_second_announcement (datetime, nullable)
├── time_fire_department_all_clear (datetime, nullable)
├── device_reset_checklist → DeviceResetChecklist
├── time_third_announcement (datetime, nullable)
├── time_fire_department_departure (datetime)
├── details (text — plain textarea)
├── send_copy_recipients[] (string — email addresses)
├── attachments[] (file, max 4)
└── downloadable_pdf (boolean, true)

FirePreparationChecklist
├── fire_safety_plan (boolean, default: false)
├── fire_department_keys (boolean, default: false)
└── residents_needing_assistance_list (boolean, default: false)

ElevatorResponseChecklist
├── elevator_1 (boolean, default: false)
├── elevator_2 (boolean, default: false)
├── elevator_3 (boolean, default: false)
└── elevator_4 (boolean, default: false)

DeviceResetChecklist
├── pull_station (boolean, default: false)
├── smoke_detector (boolean, default: false)
├── heat_detector (boolean, default: false)
├── sprinkler_head (boolean, default: false)
├── fire_panel (boolean, default: false)
├── mag_locks (boolean, default: false)
└── elevators (boolean, default: false)

NoiseLog extends LogEntry
├── event_datetime (datetime)
├── nature_of_complaint[] (multi-select enum: Drop on Floor, Loud Music,
│   Smoking Hallways, Smoking in Suite, Hallway Noise, Piano Playing,
│   Dog Barking, Cooking Odors, Children Playing, Walking/Banging,
│   Party, Talking, Construction, Other)
├── complainant_floor_noise (enum: Standing in the hallway,
│   Only inside the complainant's suite)
├── suspect_floor_noise (enum: On Approach to the suite,
│   Standing in the hallway, Only at the door, Only inside the suite)
├── suspect_floor_duration (enum: Continuous, Infrequent/Momentarily, Other,
│   Only with the movement of elevator traffic,
│   Only with movement in hallway or at the door)
├── suspect_floor_volume (enum: Not heard from outside the suite,
│   Barely heard from outside the suite, Noticeable but acceptable,
│   Unacceptable)
├── length_of_time_verified (string — minutes)
├── suspect_contacted_by[] (multi-select enum: Home Phone, Work Phone,
│   Other Phone, At the door, No one home)
├── complainant_advised_of_action (enum: Yes, No)
├── details (text — plain textarea)
├── send_copy_recipients[] (string — email addresses)
├── attachments[] (file, max 4)
└── downloadable_pdf (boolean, true)

InspectionLog extends LogEntry
├── inspection_type (enum: Pre Inspection, Post Inspection)
├── related_booking_id → Booking (nullable)
├── inspection_datetime (datetime)
└── details (text — plain textarea)

Bulletin extends LogEntry
├── expiry_datetime (datetime, nullable — default: 7 days from creation)
├── never_expire (boolean, default: false)
├── details (text — plain textarea)
├── attachment (file, single file only)
└── recipients[] → User (staff — targeted, not broadcast)
```

---

*Total fields documented: ~100+ across all 6 log forms and 2 pages*
*Log types covered: General, Incident, Fire, Noise, Inspection, Bulletin*
*Dropdown options fully enumerated: Incident Type (17), Inspection Type (2), Nature of Complaint (14), 4 noise investigation dropdowns, Complainant contacted (2), Log Category filter (4)*
